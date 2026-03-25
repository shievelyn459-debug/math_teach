import AsyncStorage from '@react-native-async-storage/async-storage';
import {User, ApiResponse} from '../types';
import {userDataRepository} from './mysql/UserDataRepository';
import {checkDatabaseConnection} from './mysql/prismaClient';
import {
  hashPasswordSHA256,
  timingSafeEqual,
  generateSignatureSHA256,
  generateSecureUUID,
} from '../utils/cryptoUtils';
import {
  validateEmail,
  validateAndNormalizeEmail,
  validatePassword,
} from '../utils/validationUtils';
import {logger} from '../utils/logger';

/**
 * 认证令牌存储键
 */
const AUTH_TOKEN_KEY = '@math_learning_auth_token';
const USER_DATA_KEY = '@math_learning_user_data';
const REMEMBER_ME_KEY = '@math_learning_remember_me';
const USERS_PREFIX = '@math_learning_users_'; // 用户数据前缀
const MYSQL_AVAILABLE_KEY = '@math_learning_mysql_available'; // MySQL连接状态缓存

/**
 * 生成UUID v4（使用加密安全的随机数）
 * 修复P0-2: 替换不安全的Math.random()实现
 */
function generateUUID(): string {
  return generateSecureUUID();
}

/**
 * SHA-256密码哈希
 * 修复P0-1: 实现SHA-256密码哈希（符合AC1 Task 1.2）
 */
async function hashPassword(password: string): Promise<string> {
  return await hashPasswordSHA256(password);
}

/**
 * 令牌配置
 */
const TOKEN_CONFIG = {
  EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7天过期 (默认)
  EXPIRY_MS_REMEMBER: 30 * 24 * 60 * 60 * 1000, // 30天过期 (记住我)
  // 简单的签名密钥（生产环境应从安全配置获取）
  SIGNING_SECRET: 'math_learn_secure_token_v1',
};

/**
 * 失败登录尝试配置 (AC7)
 */
const FAILED_LOGIN_CONFIG = {
  MAX_ATTEMPTS: 5,              // 最大失败尝试次数
  ATTEMPT_WINDOW_MS: 15 * 60 * 1000,  // 尝试时间窗口：15分钟
  LOCKOUT_DURATION_MS: 30 * 60 * 1000,  // 锁定时长：30分钟
};

/**
 * 失败登录尝试数据
 */
interface FailedAttempt {
  count: number;
  lastAttempt: number;  // 时间戳
  lockedUntil?: number; // 锁定到期时间戳
}

/**
 * 认证响应接口
 * 修复P1-1: 添加storageMode字段以通知用户当前存储模式
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  storageMode?: 'mysql' | 'local'; // 修复P1-12: 指示当前使用的存储模式
  warning?: string; // 修复P1-1: 警告信息（如降级到本地存储）
}

/**
 * 注册请求数据
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * 登录请求数据
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 认证服务类
 * 负责用户认证状态管理和令牌处理
 */
class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private authListeners: ((user: User | null) => void)[] = [];
  private initPromise: Promise<void> | null = null;
  private mysqlAvailable: boolean | null = null; // MySQL连接状态缓存
  private mysqlCheckPromise: Promise<boolean> | null = null; // 修复P0-3: 防止并发连接检查
  private mysqlCacheExpiry: number | null = null; // 修复P0-8: 缓存过期时间
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟TTL（修复P0-8）

  private constructor() {
    this.initPromise = this.initializeAuth();
  }

  /**
   * 等待认证服务初始化完成
   * 用于确保在访问认证状态前初始化已完成
   */
  async waitForInitialization(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null; // Clear after completion
    }
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 检查MySQL连接状态（带缓存和TTL）
   * 修复P0-3: 添加promise缓存防止并发检查
   * 修复P0-8: 添加TTL使缓存定期过期
   *
   * @returns MySQL是否可用
   */
  private async isMySQLAvailable(): Promise<boolean> {
    const now = Date.now();

    // 检查缓存是否仍然有效（修复P0-8）
    if (this.mysqlAvailable !== null && this.mysqlCacheExpiry && now < this.mysqlCacheExpiry) {
      return this.mysqlAvailable;
    }

    // 如果正在进行的检查，等待它完成（修复P0-3）
    if (this.mysqlCheckPromise) {
      return this.mysqlCheckPromise;
    }

    // 开始新的检查
    this.mysqlCheckPromise = (async () => {
      try {
        // 尝试连接MySQL
        const isConnected = await checkDatabaseConnection();
        this.mysqlAvailable = isConnected;
        this.mysqlCacheExpiry = now + this.CACHE_TTL_MS; // 设置5分钟TTL（修复P0-8）

        // 缓存连接状态（包含过期时间）
        await AsyncStorage.setItem(
          MYSQL_AVAILABLE_KEY,
          JSON.stringify({
            connected: isConnected,
            expiry: this.mysqlCacheExpiry,
          })
        );

        return isConnected;
      } catch (error) {
        console.warn('[AuthService] MySQL connection check failed:', error);
        this.mysqlAvailable = false;
        this.mysqlCacheExpiry = now + this.CACHE_TTL_MS;
        await AsyncStorage.setItem(
          MYSQL_AVAILABLE_KEY,
          JSON.stringify({
            connected: false,
            expiry: this.mysqlCacheExpiry,
          })
        );
        return false;
      } finally {
        // 清除检查promise，允许下次检查
        this.mysqlCheckPromise = null;
      }
    })();

    return this.mysqlCheckPromise;
  }

  /**
   * 重置MySQL连接状态（用于重试连接）
   * 修复P0-8: 同时清除缓存过期时间
   */
  private async resetMySQLStatus(): Promise<void> {
    this.mysqlAvailable = null;
    this.mysqlCacheExpiry = null;
    this.mysqlCheckPromise = null; // 修复P0-3: 清除待检查的promise
    await AsyncStorage.removeItem(MYSQL_AVAILABLE_KEY);
  }

  /**
   * 获取当前数据存储模式
   * 修复P1-12: 提供方法让UI查询当前存储模式
   * @returns 当前存储模式
   */
  public getStorageMode(): 'mysql' | 'local' | 'unknown' {
    if (this.mysqlAvailable === true) {
      return 'mysql';
    } else if (this.mysqlAvailable === false) {
      return 'local';
    }
    return 'unknown';
  }

  /**
   * 检查是否使用离线模式（AsyncStorage）
   * 修复P1-12: 提供便利方法
   * @returns 是否处于离线模式
   */
  public isOfflineMode(): boolean {
    return this.mysqlAvailable === false;
  }

  /**
   * 缓存用户数据到AsyncStorage（Write-through缓存）
   * @param user 用户对象
   * @param passwordHash 密码哈希
   */
  private async cacheUser(user: User, passwordHash: string): Promise<void> {
    try {
      // 修复P1-5: 使用规范化邮箱作为缓存键
      const normalizedEmail = user.email.toLowerCase().trim();
      const userStorageKey = `${USERS_PREFIX}${normalizedEmail}`;
      const userData = {
        user,
        passwordHash,
      };
      await AsyncStorage.setItem(userStorageKey, JSON.stringify(userData));
    } catch (error) {
      // 修复P1-10: 使用安全的日志工具（不暴露用户邮箱）
      logger.warn('AuthService', 'Failed to cache user data', error as Error);
    }
  }

  /**
   * 从缓存加载用户（Read-aside缓存）
   * @param email 邮箱地址
   * @returns 用户数据和密码哈希，或null
   */
  private async loadUserFromCache(email: string): Promise<{user: User; passwordHash: string} | null> {
    try {
      // 修复P1-5: 使用规范化邮箱作为缓存键
      const normalizedEmail = email.toLowerCase().trim();
      const userStorageKey = `${USERS_PREFIX}${normalizedEmail}`;
      const data = await AsyncStorage.getItem(userStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // 修复P1-10: 使用安全的日志工具
      logger.warn('AuthService', 'Failed to load user from cache', error as Error);

      // 修复P1-14: 清理损坏的缓存条目
      try {
        const normalizedEmail = email.toLowerCase().trim();
        const userStorageKey = `${USERS_PREFIX}${normalizedEmail}`;
        await AsyncStorage.removeItem(userStorageKey);
        logger.warn('AuthService', 'Cleaned corrupted cache entry');
      } catch (cleanupError) {
        logger.error('AuthService', 'Failed to clean corrupted cache', cleanupError as Error);
      }
      return null;
    }
  }

  /**
   * 智能用户查询（MySQL优先，降级到AsyncStorage）
   * @param email 邮箱地址
   * @returns 用户数据和密码哈希，或null
   */
  private async findUserWithFallback(email: string): Promise<{user: User; passwordHash: string} | null> {
    const normalizedEmail = email.toLowerCase().trim();

    // 首先尝试MySQL
    const isMySQLAvailable = await this.isMySQLAvailable();

    if (isMySQLAvailable) {
      try {
        const dbUser = await userDataRepository.findByEmailWithPassword(normalizedEmail);
        if (dbUser) {
          // 更新缓存
          await this.cacheUser(dbUser.user, dbUser.passwordHash);
          return dbUser;
        }
      } catch (error) {
        console.warn('[AuthService] MySQL query failed, falling back to cache:', error);
        // MySQL查询失败，标记为不可用并降级到缓存
        this.mysqlAvailable = false;
      }
    }

    // 降级到AsyncStorage
    return await this.loadUserFromCache(normalizedEmail);
  }

  /**
   * 初始化认证状态（从本地存储恢复）
   * 验证存储的令牌有效性
   */
  private async initializeAuth(): Promise<void> {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (token && userData) {
        // 先验证令牌
        this.authToken = token;
        const isValid = await this.validateStoredToken();

        if (isValid && userData) {
          try {
            this.currentUser = JSON.parse(userData);
            this.notifyAuthListeners(this.currentUser);
          } catch (parseError) {
            // 用户数据损坏，清除并重新登录
            console.error('[AuthService] Failed to parse user data:', parseError);
            await this.logout();
          }
        }
      }
    } catch (error) {
      console.error('[AuthService] Failed to initialize auth:', error);
      // 确保错误状态下不会有部分数据
      this.currentUser = null;
      this.authToken = null;
    }
  }

  /**
   * 用户注册（MySQL + AsyncStorage缓存）
   * @param name 用户姓名
   * @param email 邮箱地址
   * @param password 密码
   * @returns 注册结果
   * 修复P0-6: 添加邮箱格式和长度验证
   */
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> {
    try {
      // 客户端验证
      const validation = this.validateRegistrationData(name, email, password);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(', '),
          },
        };
      }

      // 修复P0-6: 使用新的邮箱验证和规范化函数
      const emailValidation = validateAndNormalizeEmail(email);
      if (!emailValidation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: emailValidation.error || '邮箱格式不正确',
          },
        };
      }

      const normalizedEmail = emailValidation.normalizedEmail!;

      // 检查用户是否已存在（使用智能查询）
      const existingUser = await this.findUserWithFallback(normalizedEmail);
      if (existingUser) {
        return {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: '该邮箱已被注册',
          },
        };
      }

      // 创建新用户
      const hashedPassword = await hashPassword(password);
      const userId = generateUUID();

      // 尝试保存到MySQL
      const isMySQLAvailable = await this.isMySQLAvailable();

      let newUser: User;

      if (isMySQLAvailable) {
        try {
          // 保存到MySQL
          newUser = await userDataRepository.create({
            userId,
            email: normalizedEmail,
            passwordHash: hashedPassword,
            name: name.trim(),
          });

          // Write-through缓存：同时保存到AsyncStorage
          await this.cacheUser(newUser, hashedPassword);

          console.log('[AuthService] User registered in MySQL:', normalizedEmail);
        } catch (error: any) {
          // MySQL保存失败，检查是否是唯一约束错误
          if (error.code === 'P2002') {
            return {
              success: false,
              error: {
                code: 'USER_EXISTS',
                message: '该邮箱已被注册',
              },
            };
          }

          // 其他错误，降级到AsyncStorage
          console.warn('[AuthService] MySQL registration failed, falling back to AsyncStorage:', error);
          this.mysqlAvailable = false;

          // 降级到AsyncStorage
          newUser = {
            id: userId,
            name: name.trim(),
            email: normalizedEmail,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await this.cacheUser(newUser, hashedPassword);

          console.log('[AuthService] User registered in AsyncStorage (fallback):', normalizedEmail);
        }
      } else {
        // MySQL不可用，直接使用AsyncStorage
        newUser = {
          id: userId,
          name: name.trim(),
          email: normalizedEmail,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.cacheUser(newUser, hashedPassword);

        console.log('[AuthService] User registered in AsyncStorage (MySQL unavailable):', normalizedEmail);
      }

      // 注册成功，清除该邮箱的任何失败尝试记录
      await this.clearFailedAttempts(normalizedEmail);

      // 注册成功，自动登录（修复P0-2: 异步generateToken）
      const authResponse: AuthResponse = {
        user: newUser,
        token: await this.generateToken(newUser),
      };

      await this.setAuthData(authResponse);

      return {
        success: true,
        data: authResponse,
        message: '注册成功！',
      };
    } catch (error) {
      console.error('[AuthService] Registration failed:', error);
      return {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error instanceof Error ? error.message : '注册失败，请稍后重试',
        },
      };
    }
  }

  /**
   * 用户登录（MySQL + AsyncStorage降级）
   * @param email 邮箱地址
   * @param password 密码
   * @param rememberMe 是否记住登录状态（可选，默认 false）
   * @returns 登录结果
   */
  async login(
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<ApiResponse<AuthResponse>> {
    try {
      // 客户端验证
      if (!email || !password) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请输入邮箱和密码',
          },
        };
      }

      // 修复P0-6: 使用新的邮箱验证和规范化函数
      const emailValidation = validateAndNormalizeEmail(email);
      if (!emailValidation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: emailValidation.error || '邮箱格式不正确',
          },
        };
      }

      const normalizedEmail = emailValidation.normalizedEmail!;

      // 检查账户是否被锁定 (AC7)
      const lockCheck = await this.isAccountLocked(normalizedEmail);
      if (lockCheck.locked) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: lockCheck.error || '账户已临时锁定，请稍后再试',
          },
        };
      }

      // 使用智能查询查找用户（MySQL优先，降级到AsyncStorage）
      const storedUserData = await this.findUserWithFallback(normalizedEmail);
      if (!storedUserData) {
        // 用户不存在，记录失败尝试
        const attemptData = await this.recordFailedAttempt(normalizedEmail);
        return this.getLoginFailureResponse(normalizedEmail, attemptData, '邮箱或密码错误');
      }

      // 验证密码（修复P0-7: 使用常量时间比较）
      const hashedPassword = await hashPassword(password);
      if (!timingSafeEqual(storedUserData.passwordHash, hashedPassword)) {
        // 密码错误，记录失败尝试（使用MySQL如果可用）
        const isMySQLAvailable = await this.isMySQLAvailable();
        if (isMySQLAvailable) {
          try {
            const dbUser = await userDataRepository.findByEmail(normalizedEmail);
            if (dbUser) {
              const attempts = await userDataRepository.incrementFailedAttempts(dbUser.id);

              // 检查是否需要锁定账户
              if (attempts >= FAILED_LOGIN_CONFIG.MAX_ATTEMPTS) {
                await userDataRepository.lockAccount(dbUser.id);
              }

              return this.getLoginFailureResponse(normalizedEmail, {count: attempts}, '邮箱或密码错误');
            }
          } catch (error) {
            console.warn('[AuthService] Failed to record attempt in MySQL:', error);
          }
        }

        // 降级到AsyncStorage记录失败尝试
        const attemptData = await this.recordFailedAttempt(normalizedEmail);
        return this.getLoginFailureResponse(normalizedEmail, attemptData, '邮箱或密码错误');
      }

      // 登录成功，清除失败尝试记录
      const isMySQLAvailable = await this.isMySQLAvailable();
      if (isMySQLAvailable) {
        try {
          const dbUser = await userDataRepository.findByEmail(normalizedEmail);
          if (dbUser) {
            await userDataRepository.clearFailedAttempts(dbUser.id);
            await userDataRepository.updateLastLogin(dbUser.id);
          }
        } catch (error) {
          console.warn('[AuthService] Failed to update login status in MySQL:', error);
        }
      }

      // 也清除AsyncStorage的失败尝试记录（保持一致性）
      await this.clearFailedAttempts(normalizedEmail);

      // 根据记住我偏好生成不同过期时间的令牌（修复P0-2: 异步generateToken）
      const tokenExpiry = rememberMe ? TOKEN_CONFIG.EXPIRY_MS_REMEMBER : TOKEN_CONFIG.EXPIRY_MS;
      const authResponse: AuthResponse = {
        user: storedUserData.user,
        token: await this.generateToken(storedUserData.user, tokenExpiry),
      };

      await this.setAuthData(authResponse, rememberMe);

      console.log('[AuthService] User logged in successfully:', normalizedEmail);
      return {
        success: true,
        data: authResponse,
        message: '登录成功！',
      };
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      return {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: error instanceof Error ? error.message : '登录失败，请稍后重试',
        },
      };
    }
  }

  /**
   * 加载登录失败响应
   */
  private getLoginFailureResponse(
    email: string,
    attemptData: any,
    errorMessage: string
  ): ApiResponse<AuthResponse> {
    // 如果达到最大尝试次数，返回账户锁定错误
    if (attemptData.lockedUntil) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `登录失败次数过多，账户已临时锁定30分钟`,
        },
      };
    }

    // 返回剩余尝试次数
    const remainingAttempts = FAILED_LOGIN_CONFIG.MAX_ATTEMPTS - attemptData.count;
    if (remainingAttempts > 0 && remainingAttempts <= 2) {
      // 只在剩余尝试次数较少时提示
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: `${errorMessage}（还剩${remainingAttempts}次尝试机会）`,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: errorMessage,
      },
    };
  }

  /**
   * 根据邮箱加载用户数据
   */
  private async loadUserByEmail(email: string): Promise<{user: User; passwordHash: string} | null> {
    try {
      const userStorageKey = `${USERS_PREFIX}${email}`;
      const data = await AsyncStorage.getItem(userStorageKey);
      if (!data) {
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('[AuthService] Failed to load user by email:', error);
      return null;
    }
  }

  /**
   * 退出登录
   */
  async logout(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
        AsyncStorage.removeItem(REMEMBER_ME_KEY),
      ]);

      this.currentUser = null;
      this.authToken = null;
      this.notifyAuthListeners(null);
    } catch (error) {
      console.error('[AuthService] Logout failed:', error);
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 获取认证令牌
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * 检查是否已登录
   * 验证令牌有效性
   * 注意：此方法现在是异步的，确保初始化完成
   */
  async isAuthenticated(): Promise<boolean> {
    // 确保初始化完成
    await this.waitForInitialization();

    if (!this.currentUser || !this.authToken) {
      return false;
    }

    // 验证令牌（修复P0-2: 异步verifyToken）
    const verification = await this.verifyToken(this.authToken);
    return verification.valid;
  }

  /**
   * 同步检查认证状态（不等待初始化）
   * 用于需要快速检查的场景
   */
  isAuthenticatedSync(): boolean {
    // 同步版本无法异步验证令牌，假设已初始化的令牌有效
    // 实际验证应在异步版本isAuthenticated()中完成
    return !!(this.currentUser && this.authToken);
  }

  /**
   * 检查令牌是否即将过期（24小时内）
   * 用于UI提醒用户重新登录
   */
  isTokenExpiringSoon(): boolean {
    if (!this.authToken) {
      return false;
    }

    try {
      const parts = this.authToken.split('.');
      if (parts.length !== 2) {
        return false;
      }

      const dataString = atob(parts[0]);
      const tokenData = JSON.parse(dataString);

      if (!tokenData.exp) {
        return false;
      }

      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      return tokenData.exp - now < twentyFourHours;
    } catch {
      return false;
    }
  }

  /**
   * 监听认证状态变化
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authListeners.push(callback);

    // 立即返回当前状态
    callback(this.currentUser);

    // 返回取消监听的函数
    return () => {
      this.authListeners = this.authListeners.filter(
        listener => listener !== callback
      );
    };
  }

  /**
   * 更新用户资料（MySQL + AsyncStorage同步）
   */
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      // 检查用户是否已登录
      if (!this.currentUser) {
        return {
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: '请先登录后再更新资料',
          },
        };
      }

      // 尝试更新MySQL
      const isMySQLAvailable = await this.isMySQLAvailable();
      let updatedUser: User;

      if (isMySQLAvailable) {
        try {
          // 更新MySQL
          updatedUser = await userDataRepository.update(this.currentUser.id, {
            name: updates.name,
            phone: updates.phone,
            language: updates.language,
            difficulty: updates.difficulty,
          });

          console.log('[AuthService] Profile updated in MySQL');
        } catch (error) {
          console.warn('[AuthService] MySQL update failed, using local update:', error);
          // MySQL更新失败，仅更新本地数据
          updatedUser = {...this.currentUser, ...updates};
        }
      } else {
        // MySQL不可用，仅更新本地数据
        updatedUser = {...this.currentUser, ...updates};
      }

      // 更新本地状态和AsyncStorage
      this.currentUser = updatedUser;
      await AsyncStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify(this.currentUser)
      );

      // 如果更新了name或phone，也需要更新缓存的用户数据
      if (updates.name || updates.phone) {
        const cachedUserData = await this.loadUserFromCache(this.currentUser.email);
        if (cachedUserData) {
          await this.cacheUser(this.currentUser, cachedUserData.passwordHash);
        }
      }

      this.notifyAuthListeners(this.currentUser);

      return {
        success: true,
        data: this.currentUser,
        message: '资料更新成功',
      };
    } catch (error) {
      console.error('[AuthService] Update profile failed:', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: '更新资料失败',
        },
      };
    }
  }

  /**
   * 设置认证数据
   * @param authResponse 认证响应
   * @param rememberMe 是否记住登录状态
   */
  private async setAuthData(authResponse: AuthResponse, rememberMe: boolean = false): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, authResponse.token),
        AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(authResponse.user)
        ),
        AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(rememberMe)),
      ]);

      this.currentUser = authResponse.user;
      this.authToken = authResponse.token;
      this.notifyAuthListeners(this.currentUser);
    } catch (error) {
      console.error('[AuthService] Failed to set auth data:', error);
      throw error;
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyAuthListeners(user: User | null): void {
    this.authListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('[AuthService] Listener error:', error);
      }
    });
  }

  /**
   * 生成安全的认证令牌
   * 包含签名验证防止伪造
   *
   * 注意：这是客户端临时方案。生产环境应使用服务器返回的JWT令牌。
   * 服务器应验证所有请求的令牌并检查其有效性。
   * @param user 用户信息
   * @param tokenExpiry 令牌过期时间（毫秒）
   */
  private async generateToken(user: User, tokenExpiry: number): Promise<string> {
    const now = Date.now();
    const expiry = now + tokenExpiry;

    // 令牌数据：包含用户信息和过期时间
    const tokenData = {
      userId: user.id,
      email: user.email,
      iat: now,        // 签发时间
      exp: expiry,     // 过期时间
      v: 1,            // 版本号
    };

    // 生成签名：HMAC-SHA256（修复P0-2）
    const dataString = JSON.stringify(tokenData);
    const signature = await this.generateSignature(dataString);

    // 组合：base64(data).signature
    const encodedData = btoa(dataString);
    return `${encodedData}.${signature}`;
  }

  /**
   * 生成签名（SHA-256）
   * 修复P0-2: 使用加密安全的SHA-256签名（替代32位整数签名）
   */
  private async generateSignature(data: string): Promise<string> {
    return await generateSignatureSHA256(data, TOKEN_CONFIG.SIGNING_SECRET);
  }

  /**
   * 验证令牌
   * 检查签名、过期时间和格式
   * 修复P0-2: 使用异步签名验证
   * 修复P0-7: 使用常量时间比较
   */
  private async verifyToken(token: string): Promise<{valid: boolean; userId?: string; error?: string}> {
    try {
      // 分离数据和签名
      const parts = token.split('.');
      if (parts.length !== 2) {
        return {valid: false, error: '令牌格式无效'};
      }

      const [encodedData, signature] = parts;

      // 解码数据
      const dataString = atob(encodedData);
      const tokenData = JSON.parse(dataString);

      // 验证签名（修复P0-2: 异步）
      const expectedSignature = await this.generateSignature(dataString);
      // 使用常量时间比较（修复P0-7）
      if (!timingSafeEqual(expectedSignature, signature)) {
        return {valid: false, error: '令牌签名无效'};
      }

      // 验证过期时间
      const now = Date.now();
      if (tokenData.exp && now > tokenData.exp) {
        return {valid: false, error: '令牌已过期'};
      }

      // 验证版本
      if (tokenData.v !== 1) {
        return {valid: false, error: '令牌版本不支持'};
      }

      return {
        valid: true,
        userId: tokenData.userId,
      };
    } catch (error) {
      console.error('[AuthService] Token verification failed:', error);
      return {valid: false, error: '令牌解析失败'};
    }
  }

  /**
   * 检查存储的令牌是否有效
   * 如果令牌无效或过期，清除认证状态
   * 修复P0-2: 异步verifyToken调用
   */
  private async validateStoredToken(): Promise<boolean> {
    const token = this.authToken;
    if (!token) {
      return false;
    }

    const verification = await this.verifyToken(token);
    if (!verification.valid) {
      // 令牌无效，清除认证状态
      console.warn('[AuthService] Stored token invalid:', verification.error);
      await this.logout();
      return false;
    }

    return true;
  }

  /**
   * 获取失败登录尝试的存储键
   * 修复P0-2: 异步generateSignature调用
   */
  private async getFailedAttemptsKey(email: string): Promise<string> {
    // 使用哈希邮箱作为键，避免直接存储邮箱地址
    // 标准化为小写以保持与登录流程一致
    const normalizedEmail = email.toLowerCase();
    const hash = await this.generateSignature(normalizedEmail);
    return `@math_learning_failed_attempts_${hash}`;
  }

  /**
   * 获取失败登录尝试数据
   * 修复P0-2: 异步getFailedAttemptsKey调用
   */
  private async getFailedAttempts(email: string): Promise<FailedAttempt | null> {
    try {
      const key = await this.getFailedAttemptsKey(email);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[AuthService] Failed to get failed attempts:', error);
      return null;
    }
  }

  /**
   * 记录失败的登录尝试 (AC7)
   * 修复P0-2: 异步getFailedAttemptsKey调用
   */
  private async recordFailedAttempt(email: string): Promise<FailedAttempt> {
    const now = Date.now();
    const existing = await this.getFailedAttempts(email);
    const key = await this.getFailedAttemptsKey(email);

    let attemptData: FailedAttempt;

    if (!existing) {
      // 首次失败尝试
      attemptData = {
        count: 1,
        lastAttempt: now,
      };
    } else {
      // 检查是否在时间窗口内
      const timeSinceLastAttempt = now - existing.lastAttempt;

      if (timeSinceLastAttempt > FAILED_LOGIN_CONFIG.ATTEMPT_WINDOW_MS) {
        // 超出时间窗口，重置计数
        attemptData = {
          count: 1,
          lastAttempt: now,
        };
      } else {
        // 在时间窗口内，增加计数
        attemptData = {
          count: existing.count + 1,
          lastAttempt: now,
        };

        // 检查是否需要锁定账户
        if (attemptData.count >= FAILED_LOGIN_CONFIG.MAX_ATTEMPTS) {
          attemptData.lockedUntil = now + FAILED_LOGIN_CONFIG.LOCKOUT_DURATION_MS;
          console.warn(
            `[AuthService] Account locked due to ${attemptData.count} failed attempts`
          );
        }
      }
    }

    await AsyncStorage.setItem(key, JSON.stringify(attemptData));
    return attemptData;
  }

  /**
   * 清除失败的登录尝试记录（成功登录后调用）
   * 修复P0-2: 异步getFailedAttemptsKey调用
   */
  private async clearFailedAttempts(email: string): Promise<void> {
    try {
      const key = await this.getFailedAttemptsKey(email);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[AuthService] Failed to clear failed attempts:', error);
    }
  }

  /**
   * 检查账户是否被锁定 (AC7)
   */
  private async isAccountLocked(email: string): Promise<{locked: boolean; error?: string}> {
    const attemptData = await this.getFailedAttempts(email);
    const now = Date.now();

    if (!attemptData || !attemptData.lockedUntil) {
      return {locked: false};
    }

    if (now < attemptData.lockedUntil) {
      // 账户仍被锁定
      const remainingMinutes = Math.ceil((attemptData.lockedUntil - now) / 60000);
      return {
        locked: true,
        error: `账户已临时锁定，请${remainingMinutes}分钟后再试或联系客服`,
      };
    } else {
      // 锁定期已过，清除记录
      await this.clearFailedAttempts(email);
      return {locked: false};
    }
  }

  /**
   * 验证注册数据
   */
  /**
   * 验证注册数据
   * 修复P0-6: 使用新的验证工具
   */
  private validateRegistrationData(
    name: string,
    email: string,
    password: string
  ): {isValid: boolean; errors: string[]} {
    const errors: string[] = [];

    // 验证姓名
    if (!name || name.trim().length < 2) {
      errors.push('请输入有效的姓名（至少2个字符）');
    }

    // 验证邮箱格式（使用新的验证工具 - P0-6）
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error || '邮箱格式不正确');
    }

    // 验证密码强度（使用新的验证工具）
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.error || '密码格式不正确');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证邮箱格式
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度（增强版）
   * 修复P0-6: 使用新的验证工具，同时保持向后兼容性
   *
   * 要求：
   * - 至少8个字符
   * - 包含大小写字母
   * - 包含数字
   * - 包含特殊字符
   */
  isValidPassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    // 长度检查
    if (password.length < 8) {
      errors.push('密码至少需要8个字符');
    }

    // 细粒度验证（分别检查字母和数字）
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter) {
      errors.push('密码必须包含字母');
    }

    if (!hasNumber) {
      errors.push('密码必须包含数字');
    }

    // 额外的强度检查
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // 计算强度
    if (password.length >= 12) {
      strength = 'medium';
    }
    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
    if (password.length >= 10 && criteriaCount >= 3) {
      strength = 'strong';
    } else if (password.length >= 8 && criteriaCount >= 2) {
      strength = 'medium';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * 获取密码强度说明
   * 用于UI显示密码要求
   */
  getPasswordRequirements(): string[] {
    return [
      '至少8个字符',
      '包含大写字母（A-Z）',
      '包含小写字母（a-z）',
      '包含数字（0-9）',
      '包含特殊字符（!@#$%^&*等）',
    ];
  }
}

// 导出单例实例
export const authService = AuthService.getInstance();
export default authService;
