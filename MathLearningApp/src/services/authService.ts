import AsyncStorage from '@react-native-async-storage/async-storage';
import {User, ApiResponse} from '../types';
import {userApi} from './api';

/**
 * 认证令牌存储键
 */
const AUTH_TOKEN_KEY = '@math_learning_auth_token';
const USER_DATA_KEY = '@math_learning_user_data';

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

  private constructor() {
    this.initializeAuth();
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
   */
  private async initializeAuth(): Promise<void> {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (token && userData) {
        this.authToken = token;
        this.currentUser = JSON.parse(userData);
        this.notifyAuthListeners(this.currentUser);
      }
    } catch (error) {
      console.error('[AuthService] Failed to initialize auth:', error);
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

      if (response.success && response.data) {
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

      if (response.success && response.data) {
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
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
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
      // TODO: 调用API更新用户资料
      if (this.currentUser) {
        this.currentUser = {...this.currentUser, ...updates};
        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(this.currentUser)
        );
        this.notifyAuthListeners(this.currentUser);
      }

      return {
        success: true,
        data: this.currentUser as User,
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
   * 生成简单的认证令牌（生产环境应使用JWT）
   */
  private generateToken(user: User): string {
    // 生产环境应使用服务器返回的JWT令牌
    // 这里使用简单的base64编码作为临时方案
    const tokenData = {
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
    };
    return btoa(JSON.stringify(tokenData));
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
    if (!password || password.length < 8) {
      errors.push('密码至少需要8个字符');
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      errors.push('密码必须包含字母和数字');
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
   * 验证密码强度
   */
  isValidPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password || password.length < 8) {
      errors.push('密码至少需要8个字符');
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter) {
      errors.push('密码必须包含字母');
    }

    if (!hasNumber) {
      errors.push('密码必须包含数字');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// 导出单例实例
export const authService = AuthService.getInstance();
export default authService;
