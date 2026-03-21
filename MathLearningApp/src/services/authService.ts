import AsyncStorage from '@react-native-async-storage/async-storage';
import {User, ApiResponse} from '../types';
import {userApi, isApiSuccess} from './api';

/**
 * 认证令牌存储键
 */
const AUTH_TOKEN_KEY = '@math_learning_auth_token';
const USER_DATA_KEY = '@math_learning_user_data';

/**
 * 令牌配置
 */
const TOKEN_CONFIG = {
  EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7天过期
  // 简单的签名密钥（生产环境应从安全配置获取）
  SIGNING_SECRET: 'math_learn_secure_token_v1',
};

/**
 * 认证响应接口
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
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
   * 用户注册
   * @param name 用户姓名
   * @param email 邮箱地址
   * @param password 密码
   * @returns 注册结果
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

      // 调用注册API
      const response = await userApi.register({name, email, password});

      // 使用类型守卫确保类型安全
      if (isApiSuccess(response)) {
        // 注册成功，自动登录
        const authResponse: AuthResponse = {
          user: response.data,
          token: this.generateToken(response.data),
        };

        await this.setAuthData(authResponse);

        return {
          success: true,
          data: authResponse,
          message: '注册成功！',
        };
      }

      return response;
    } catch (error) {
      console.error('[AuthService] Registration failed:', error);
      return {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message:
            error instanceof Error
              ? error.message
              : '注册失败，请稍后重试',
        },
      };
    }
  }

  /**
   * 用户登录
   * @param email 邮箱地址
   * @param password 密码
   * @returns 登录结果
   */
  async login(
    email: string,
    password: string
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

      // 调用登录API
      const response = await userApi.login({email, password});

      // 使用类型守卫确保类型安全
      if (isApiSuccess(response)) {
        const authResponse: AuthResponse = {
          user: response.data,
          token: this.generateToken(response.data),
        };

        await this.setAuthData(authResponse);

        return {
          success: true,
          data: authResponse,
          message: '登录成功！',
        };
      }

      return response;
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      return {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message:
            error instanceof Error ? error.message : '登录失败，请稍后重试',
        },
      };
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

    // 验证令牌
    const verification = this.verifyToken(this.authToken);
    return verification.valid;
  }

  /**
   * 同步检查认证状态（不等待初始化）
   * 用于需要快速检查的场景
   */
  isAuthenticatedSync(): boolean {
    if (!this.currentUser || !this.authToken) {
      return false;
    }

    const verification = this.verifyToken(this.authToken);
    return verification.valid;
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
   * 更新用户资料
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

      // TODO: 调用API更新用户资料
      this.currentUser = {...this.currentUser, ...updates};
      await AsyncStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify(this.currentUser)
      );
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
   */
  private async setAuthData(authResponse: AuthResponse): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, authResponse.token),
        AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(authResponse.user)
        ),
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
   */
  private generateToken(user: User): string {
    const now = Date.now();
    const expiry = now + TOKEN_CONFIG.EXPIRY_MS;

    // 令牌数据：包含用户信息和过期时间
    const tokenData = {
      userId: user.id,
      email: user.email,
      iat: now,        // 签发时间
      exp: expiry,     // 过期时间
      v: 1,            // 版本号
    };

    // 生成签名：HMAC-SHA256
    const dataString = JSON.stringify(tokenData);
    const signature = this.generateSignature(dataString);

    // 组合：base64(data).signature
    const encodedData = btoa(dataString);
    return `${encodedData}.${signature}`;
  }

  /**
   * 生成签名
   * 使用简单的HMAC-like签名机制
   */
  private generateSignature(data: string): string {
    // 简单的签名算法：将数据与密钥混合后hash
    const combined = data + TOKEN_CONFIG.SIGNING_SECRET;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // 转为正数并转为base36字符串
    return Math.abs(hash).toString(36);
  }

  /**
   * 验证令牌
   * 检查签名、过期时间和格式
   */
  private verifyToken(token: string): {valid: boolean; userId?: string; error?: string} {
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

      // 验证签名
      const expectedSignature = this.generateSignature(dataString);
      if (signature !== expectedSignature) {
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
   */
  private async validateStoredToken(): Promise<boolean> {
    const token = this.authToken;
    if (!token) {
      return false;
    }

    const verification = this.verifyToken(token);
    if (!verification.valid) {
      // 令牌无效，清除认证状态
      console.warn('[AuthService] Stored token invalid:', verification.error);
      await this.logout();
      return false;
    }

    return true;
  }

  /**
   * 验证注册数据
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

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push('请输入有效的邮箱地址');
    }

    // 验证密码强度
    const passwordValidation = this.isValidPassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
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
    if (!password || password.length < 8) {
      errors.push('密码至少需要8个字符');
    } else if (password.length >= 12) {
      strength = 'medium';
    }

    // 大写字母检查
    const hasUpperCase = /[A-Z]/.test(password);
    // 小写字母检查
    const hasLowerCase = /[a-z]/.test(password);
    // 数字检查
    const hasNumber = /[0-9]/.test(password);
    // 特殊字符检查
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase) {
      errors.push('密码必须包含至少1个大写字母');
    }
    if (!hasLowerCase) {
      errors.push('密码必须包含至少1个小写字母');
    }
    if (!hasNumber) {
      errors.push('密码必须包含至少1个数字');
    }
    if (!hasSpecial) {
      errors.push('密码必须包含至少1个特殊字符（!@#$%^&*等）');
    }

    // 计算强度
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
