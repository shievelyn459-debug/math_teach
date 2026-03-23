import AsyncStorage from '@react-native-async-storage/async-storage';
import {api, isApiSuccess, ApiResponse} from './api';

/**
 * 密码重置令牌数据结构
 */
interface ResetToken {
  token: string;           // 哈希后的令牌
  email: string;           // 关联的邮箱
  createdAt: number;       // 创建时间戳
  expiresAt: number;       // 过期时间戳
  used: boolean;           // 是否已使用
}

/**
 * 密码重置请求响应
 */
interface PasswordResetRequest {
  email: string;
}

/**
 * 密码重置确认请求
 */
interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/**
 * 密码重置服务配置
 */
const RESET_CONFIG = {
  // 令牌有效期：1小时
  TOKEN_EXPIRY_MS: 60 * 60 * 1000,
  // 令牌最小字节长度（熵）
  MIN_TOKEN_BYTES: 32,
  // 请求速率限制窗口
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15分钟
  // 最大请求数
  MAX_REQUESTS_PER_WINDOW: 3,
};

/**
 * 存储键
 */
const STORAGE_KEYS = {
  RESET_TOKENS: '@math_learning_reset_tokens',
  RATE_LIMIT: '@math_learning_reset_rate_limit',
};

/**
 * 速率限制数据
 */
interface RateLimitData {
  count: number;
  windowStart: number;
}

/**
 * 密码重置服务
 * Story 1-3: 家长用户重置密码
 *
 * 安全特性：
 * - 防止邮箱枚举攻击
 * - 加密安全的令牌生成
 * - 令牌过期机制
 * - 一次性令牌
 * - 速率限制
 */
class PasswordResetService {
  private static instance: PasswordResetService;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): PasswordResetService {
    if (!PasswordResetService.instance) {
      PasswordResetService.instance = new PasswordResetService();
    }
    return PasswordResetService.instance;
  }

  /**
   * 请求密码重置
   * AC1: 用户可以从登录屏幕通过提供注册邮箱请求重置
   * AC2: 系统验证邮箱并发送重置链接（如果邮箱存在）
   * AC3: 出于安全考虑，无论邮箱是否存在都显示相同消息（防止邮箱枚举）
   * AC8: 邮件发送在5秒内完成
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{success: boolean}>> {
    try {
      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: '请输入有效的邮箱地址',
          },
        };
      }

      // 检查速率限制 (AC3: 防止滥用)
      const rateLimitCheck = await this.checkRateLimit(email);
      if (rateLimitCheck.limitExceeded) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '请求过于频繁，请稍后再试',
          },
        };
      }

      // 标准化邮箱
      const normalizedEmail = email.toLowerCase().trim();

      // 记录请求（用于速率限制）
      await this.recordRequest(normalizedEmail);

      // 生成安全重置令牌
      const resetToken = this.generateSecureToken();
      const hashedToken = await this.hashToken(resetToken);

      // 存储令牌信息
      await this.storeToken(hashedToken, normalizedEmail);

      // 调用 API 发送重置邮件
      // AC3: 无论邮箱是否存在，都返回相同的成功消息
      // 这防止了攻击者枚举有效的邮箱地址
      const response = await api.passwordReset.requestReset({
        email: normalizedEmail,
        token: resetToken, // 实际令牌仅用于发送邮件
      });

      // AC8: 邮件发送应在5秒内完成（由 API 层的超时控制）

      // AC3: 始终返回相同的成功消息，无论邮箱是否存在
      return {
        success: true,
        data: {success: true},
        message: '如果该邮箱已注册，您将收到密码重置链接',
      };
    } catch (error) {
      console.error('[PasswordResetService] Request reset failed:', error);

      // AC3: 即使出错，也返回通用消息以防止信息泄露
      return {
        success: true,
        data: {success: true},
        message: '如果该邮箱已注册，您将收到密码重置链接',
      };
    }
  }

  /**
   * 确认密码重置
   * AC4: 重置链接1小时后过期
   * AC5: 用户可以使用重置链接/令牌设置新密码
   * AC6: 新密码必须符合安全要求（8+字符，字母+数字）
   * AC7: 成功重置后，用户可以使用新密码登录
   * AC8: 密码更新在3秒内完成
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{success: boolean}>> {
    try {
      // 验证令牌格式
      if (!token || token.length < 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '重置链接无效或已过期',
          },
        };
      }

      // 验证新密码强度 (AC6)
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: passwordValidation.errors.join(', '),
          },
        };
      }

      // 哈希令牌以进行查找
      const hashedToken = await this.hashToken(token);

      // 查找并验证令牌
      const tokenData = await this.findAndValidateToken(hashedToken);
      if (!tokenData) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '重置链接无效或已过期',
          },
        };
      }

      // 调用 API 更新密码
      const response = await api.passwordReset.confirmReset({
        token: token,
        newPassword: newPassword,
      });

      if (!isApiSuccess(response)) {
        return response;
      }

      // 使令牌失效（一次性使用）
      await this.invalidateToken(hashedToken);

      // AC7: 密码重置成功
      return {
        success: true,
        data: {success: true},
        message: '密码重置成功！请使用新密码登录',
      };
    } catch (error) {
      console.error('[PasswordResetService] Confirm reset failed:', error);
      return {
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: '密码重置失败，请重新申请重置链接',
        },
      };
    }
  }

  /**
   * 验证令牌是否有效
   * 用于深度链接处理
   */
  async validateResetToken(token: string): Promise<{valid: boolean; email?: string}> {
    try {
      const hashedToken = await this.hashToken(token);
      const tokenData = await this.findAndValidateToken(hashedToken);

      if (tokenData) {
        return {
          valid: true,
          email: tokenData.email,
        };
      }

      return {valid: false};
    } catch (error) {
      console.error('[PasswordResetService] Token validation failed:', error);
      return {valid: false};
    }
  }

  /**
   * 生成加密安全的重置令牌
   * 使用 Web Crypto API 生成随机字节
   */
  private generateSecureToken(): string {
    // 生成 32 字节随机数（256 位）
    const randomBytes = this.generateRandomBytes(RESET_CONFIG.MIN_TOKEN_BYTES);

    // 转换为十六进制字符串
    const token = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return token;
  }

  /**
   * 生成加密安全的随机字节（使用 Web Crypto API）
   * 必须使用 crypto.getRandomValues，不可回退到不安全的随机源
   */
  private generateRandomBytes(length: number): Uint8Array {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return array;
    }

    // 生产环境必须使用安全的随机源
    // 对于 React Native，推荐安装 expo-crypto 或 react-native-crypto
    throw new Error(
      'Secure random number generation is required. ' +
      'Please ensure Web Crypto API is available or install expo-crypto.'
    );
  }

  /**
   * 哈希令牌（单向哈希）
   * 存储哈希值而非原始令牌，增强安全性
   * 使用 SHA-256 从 Web Crypto API
   */
  private async hashToken(token: string): Promise<string> {
    try {
      // 使用 Web Crypto API 的 SHA-256
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);

        // 转换为十六进制字符串
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return `hashed_${hashHex}`;
      }

      // 如果 crypto.subtle 不可用，抛出错误而不是使用弱哈希
      throw new Error('Web Crypto API (crypto.subtle) is required for secure token hashing');
    } catch (error) {
      console.error('[PasswordResetService] Hash token failed:', error);
      throw new Error('Failed to hash token securely. Please ensure Web Crypto API is available.');
    }
  }

  /**
   * 存储令牌信息（带 JSON 错误处理和重试机制）
   * 使用重试机制减少竞态条件的影响
   */
  private async storeToken(hashedToken: string, email: string, retryCount = 0): Promise<void> {
    const MAX_RETRIES = 3;

    try {
      const now = Date.now();
      const tokenData: ResetToken = {
        token: hashedToken,
        email: email,
        createdAt: now,
        expiresAt: now + RESET_CONFIG.TOKEN_EXPIRY_MS,
        used: false,
      };

      // 获取现有令牌
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.RESET_TOKENS);

      let tokens: ResetToken[];
      if (existingData) {
        try {
          tokens = JSON.parse(existingData) as ResetToken[];
        } catch (parseError) {
          // JSON 解析失败，清空损坏的数据
          console.warn('[PasswordResetService] Corrupted token data, resetting:', parseError);
          tokens = [];
        }
      } else {
        tokens = [];
      }

      // 添加新令牌
      tokens.push(tokenData);

      // 清理过期令牌
      tokens = tokens.filter(t => t.expiresAt > now);

      // 限制存储大小（最多保留100个令牌）
      if (tokens.length > 100) {
        tokens = tokens.slice(-100);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));
    } catch (error) {
      // 如果是竞态条件导致的错误（如数据被其他进程修改），尝试重试
      if (retryCount < MAX_RETRIES && this.isLikelyRaceCondition(error)) {
        console.warn(`[PasswordResetService] Possible race condition, retrying (${retryCount + 1}/${MAX_RETRIES})`);
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 50));
        return this.storeToken(hashedToken, email, retryCount + 1);
      }

      console.error('[PasswordResetService] Failed to store token:', error);
      throw error;
    }
  }

  /**
   * 判断是否可能是竞态条件错误
   */
  private isLikelyRaceCondition(error: unknown): boolean {
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      return errorMsg.includes('database') || errorMsg.includes('locked') ||
             errorMsg.includes('conflict') || errorMsg.includes('concurrent');
    }
    return false;
  }

  /**
   * 查找并验证令牌（带 JSON 错误处理）
   */
  private async findAndValidateToken(
    hashedToken: string
  ): Promise<ResetToken | null> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.RESET_TOKENS);
      if (!existingData) {
        return null;
      }

      let tokens: ResetToken[];
      try {
        tokens = JSON.parse(existingData) as ResetToken[];
      } catch (parseError) {
        console.error('[PasswordResetService] Failed to parse token data:', parseError);
        return null;
      }

      const now = Date.now();

      // 查找令牌
      const tokenData = tokens.find(t => t.token === hashedToken);

      if (!tokenData) {
        return null;
      }

      // 验证过期时间 (AC4: 1小时后过期)
      if (now > tokenData.expiresAt) {
        // 清理过期令牌
        await this.removeToken(hashedToken);
        return null;
      }

      // 验证是否已使用（一次性令牌）
      if (tokenData.used) {
        return null;
      }

      return tokenData;
    } catch (error) {
      console.error('[PasswordResetService] Failed to find token:', error);
      return null;
    }
  }

  /**
   * 使令牌失效（使用后）
   */
  private async invalidateToken(hashedToken: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.RESET_TOKENS);
      if (!existingData) {
        return;
      }

      let tokens: ResetToken[];
      try {
        tokens = JSON.parse(existingData) as ResetToken[];
      } catch (parseError) {
        console.error('[PasswordResetService] Failed to parse token data:', parseError);
        return;
      }

      const tokenIndex = tokens.findIndex(t => t.token === hashedToken);

      if (tokenIndex !== -1) {
        // 标记为已使用
        tokens[tokenIndex].used = true;
        await AsyncStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));
      }
    } catch (error) {
      console.error('[PasswordResetService] Failed to invalidate token:', error);
    }
  }

  /**
   * 移除令牌
   */
  private async removeToken(hashedToken: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.RESET_TOKENS);
      if (!existingData) {
        return;
      }

      let tokens: ResetToken[];
      try {
        tokens = JSON.parse(existingData) as ResetToken[];
      } catch (parseError) {
        console.error('[PasswordResetService] Failed to parse token data:', parseError);
        return;
      }

      const filteredTokens = tokens.filter(t => t.token !== hashedToken);

      await AsyncStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(filteredTokens));
    } catch (error) {
      console.error('[PasswordResetService] Failed to remove token:', error);
    }
  }

  /**
   * 检查速率限制
   * 防止滥用：限制每个邮箱的请求频率
   */
  private async checkRateLimit(email: string): Promise<{limitExceeded: boolean}> {
    try {
      const key = `${STORAGE_KEYS.RATE_LIMIT}_${await this.hashToken(email)}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        return {limitExceeded: false};
      }

      let rateLimit: RateLimitData;
      try {
        rateLimit = JSON.parse(data) as RateLimitData;
      } catch (parseError) {
        console.error('[PasswordResetService] Failed to parse rate limit data:', parseError);
        return {limitExceeded: false};
      }

      const now = Date.now();

      // 检查是否在时间窗口内
      if (now - rateLimit.windowStart > RESET_CONFIG.RATE_LIMIT_WINDOW_MS) {
        // 时间窗口已过，重置计数
        await AsyncStorage.removeItem(key);
        return {limitExceeded: false};
      }

      // 检查是否超过限制
      return {
        limitExceeded: rateLimit.count >= RESET_CONFIG.MAX_REQUESTS_PER_WINDOW,
      };
    } catch (error) {
      console.error('[PasswordResetService] Rate limit check failed:', error);
      // 出错时不阻止请求
      return {limitExceeded: false};
    }
  }

  /**
   * 记录请求（用于速率限制）
   */
  private async recordRequest(email: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.RATE_LIMIT}_${await this.hashToken(email)}`;
      const data = await AsyncStorage.getItem(key);
      const now = Date.now();

      let rateLimit: RateLimitData;

      if (!data) {
        // 首次请求
        rateLimit = {
          count: 1,
          windowStart: now,
        };
      } else {
        let existing: RateLimitData;
        try {
          existing = JSON.parse(data) as RateLimitData;
        } catch (parseError) {
          console.error('[PasswordResetService] Failed to parse rate limit data:', parseError);
          // 解析失败，重新开始计数
          rateLimit = {
            count: 1,
            windowStart: now,
          };
          await AsyncStorage.setItem(key, JSON.stringify(rateLimit));
          return;
        }

        // 检查是否在时间窗口内
        if (now - existing.windowStart > RESET_CONFIG.RATE_LIMIT_WINDOW_MS) {
          // 时间窗口已过，重置计数
          rateLimit = {
            count: 1,
            windowStart: now,
          };
        } else {
          // 在时间窗口内，增加计数
          rateLimit = {
            count: existing.count + 1,
            windowStart: existing.windowStart,
          };
        }
      }

      await AsyncStorage.setItem(key, JSON.stringify(rateLimit));
    } catch (error) {
      console.error('[PasswordResetService] Failed to record request:', error);
    }
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度 (AC6)
   * 要求：8+字符，字母+数字
   */
  private validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 长度检查
    if (!password || password.length < 8) {
      errors.push('密码至少需要8个字符');
    }

    // 字母检查
    const hasLetters = /[a-zA-Z]/.test(password);
    if (!hasLetters) {
      errors.push('密码必须包含字母');
    }

    // 数字检查
    const hasNumbers = /[0-9]/.test(password);
    if (!hasNumbers) {
      errors.push('密码必须包含数字');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 清理所有重置令牌（用于测试或登出）
   */
  async clearAllTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RESET_TOKENS);
    } catch (error) {
      console.error('[PasswordResetService] Failed to clear tokens:', error);
    }
  }
}

// 导出单例实例
export const passwordResetService = PasswordResetService.getInstance();
export default passwordResetService;
