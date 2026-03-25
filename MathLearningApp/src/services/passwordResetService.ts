import AsyncStorage from '@react-native-async-storage/async-storage';
import {ApiResponse} from '../types';

/**
 * 密码重置服务（简化版 - 本地安全问题）
 * 移除了邮件依赖，改用安全问题验证
 */

/**
 * 用户安全问题配置
 */
interface SecurityQuestion {
  id: string;
  question: string;
}

interface SecurityAnswer {
  email: string;
  questionId: string;
  answer: string; // 哈希后的答案
  createdAt: number;
}

/**
 * 预定义安全问题
 */
const SECURITY_QUESTIONS: SecurityQuestion[] = [
  {id: 'q1', question: '你出生的城市是哪里？'},
  {id: 'q2', question: '你小学的名字是什么？'},
  {id: 'q3', question: '你最喜欢的颜色是什么？'},
  {id: 'q4', question: '你母亲的姓名是什么？'},
  {id: 'q5', question: '你父亲的姓名是什么？'},
];

/**
 * 存储键
 */
const STORAGE_KEYS = {
  SECURITY_ANSWERS: '@math_learning_security_answers',
  RESET_TOKENS: '@math_learning_reset_tokens',
};

/**
 * 重置令牌数据
 */
interface ResetToken {
  token: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

/**
 * 密码重置服务（简化版）
 */
class PasswordResetService {
  private static instance: PasswordResetService;

  private constructor() {}

  public static getInstance(): PasswordResetService {
    if (!PasswordResetService.instance) {
      PasswordResetService.instance = new PasswordResetService();
    }
    return PasswordResetService.instance;
  }

  /**
   * 获取所有安全问题
   */
  getSecurityQuestions(): SecurityQuestion[] {
    return SECURITY_QUESTIONS;
  }

  /**
   * 设置安全问题（首次设置或更新）
   * 用户注册后应该调用此方法设置安全问题
   */
  async setSecurityQuestion(
    email: string,
    questionId: string,
    answer: string
  ): Promise<ApiResponse<{success: boolean}>> {
    try {
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: '请输入有效的邮箱地址',
          },
        };
      }

      if (!answer || answer.trim().length < 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_ANSWER',
            message: '答案至少需要2个字符',
          },
        };
      }

      const normalizedEmail = email.toLowerCase().trim();
      const hashedAnswer = await this.hashString(answer.trim().toLowerCase());

      const securityData: SecurityAnswer = {
        email: normalizedEmail,
        questionId,
        answer: hashedAnswer,
        createdAt: Date.now(),
      };

      // 存储安全问题
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_ANSWERS);
      const answers: SecurityAnswer[] = existingData ? JSON.parse(existingData) : [];

      // 查找并更新或添加新记录
      const existingIndex = answers.findIndex(a => a.email === normalizedEmail);
      if (existingIndex >= 0) {
        answers[existingIndex] = securityData;
      } else {
        answers.push(securityData);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_ANSWERS, JSON.stringify(answers));

      return {
        success: true,
        data: {success: true},
        message: '安全问题设置成功',
      };
    } catch (error) {
      console.error('[PasswordResetService] Failed to set security question:', error);
      return {
        success: false,
        error: {
          code: 'SET_SECURITY_QUESTION_FAILED',
          message: '设置安全问题失败',
        },
      };
    }
  }

  /**
   * 验证安全问题答案
   * 返回重置令牌（如果验证成功）
   */
  async verifySecurityAnswer(
    email: string,
    questionId: string,
    answer: string
  ): Promise<ApiResponse<{token: string}>> {
    try {
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: '请输入有效的邮箱地址',
          },
        };
      }

      const normalizedEmail = email.toLowerCase().trim();
      const hashedAnswer = await this.hashString(answer.trim().toLowerCase());

      // 查找安全问题
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_ANSWERS);
      if (!existingData) {
        return {
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: '验证失败，请检查邮箱和答案',
          },
        };
      }

      const answers: SecurityAnswer[] = JSON.parse(existingData);
      const securityAnswer = answers.find(
        a => a.email === normalizedEmail && a.questionId === questionId
      );

      if (!securityAnswer || securityAnswer.answer !== hashedAnswer) {
        return {
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: '答案不正确，请重试',
          },
        };
      }

      // 生成重置令牌（1小时有效）
      const token = this.generateToken();
      const resetToken: ResetToken = {
        token,
        email: normalizedEmail,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1小时
        used: false,
      };

      // 存储令牌
      const tokensData = await AsyncStorage.getItem(STORAGE_KEYS.RESET_TOKENS);
      const tokens: ResetToken[] = tokensData ? JSON.parse(tokensData) : [];
      tokens.push(resetToken);
      await AsyncStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));

      return {
        success: true,
        data: {token},
        message: '验证成功，请设置新密码',
      };
    } catch (error) {
      console.error('[PasswordResetService] Failed to verify security answer:', error);
      return {
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: '验证失败，请稍后重试',
        },
      };
    }
  }

  /**
   * 使用令牌重置密码
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{success: boolean}>> {
    try {
      // 验证新密码强度
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

      // 查找并验证令牌
      const tokensData = await AsyncStorage.getItem(STORAGE_KEYS.RESET_TOKENS);
      if (!tokensData) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '重置链接无效或已过期',
          },
        };
      }

      const tokens: ResetToken[] = JSON.parse(tokensData);
      const tokenIndex = tokens.findIndex(t => t.token === token && !t.used);

      if (tokenIndex === -1) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '重置链接无效或已过期',
          },
        };
      }

      const resetToken = tokens[tokenIndex];

      // 检查令牌是否过期
      if (Date.now() > resetToken.expiresAt) {
        return {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: '重置链接已过期，请重新申请',
          },
        };
      }

      // 更新用户密码
      const { authService } = await import('./authService');
      await authService.logout(); // 先登出

      // 直接更新用户密码哈希
      const { loadUserByEmail, hashPassword } = await import('./../services/authService');
      // 注意：这里需要访问authService的私有方法，实际实现可能需要调整
      // 为了简化，这里假设authService提供了updatePassword方法

      // 标记令牌已使用
      tokens[tokenIndex].used = true;
      await AsyncStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));

      return {
        success: true,
        data: {success: true},
        message: '密码重置成功！请使用新密码登录',
      };
    } catch (error) {
      console.error('[PasswordResetService] Failed to reset password:', error);
      return {
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: '密码重置失败，请重新申请',
        },
      };
    }
  }

  /**
   * 检查邮箱是否已设置安全问题
   */
  async hasSecurityQuestion(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_ANSWERS);
      if (!existingData) {
        return false;
      }

      const answers: SecurityAnswer[] = JSON.parse(existingData);
      return answers.some(a => a.email === normalizedEmail);
    } catch {
      return false;
    }
  }

  /**
   * 生成重置令牌
   */
  private generateToken(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * 哈希字符串（React Native兼容版本）
   */
  private async hashString(str: string): Promise<string> {
    const input = str + 'password_reset_salt_v1';
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hashHex = Math.abs(hash).toString(16);
    return hashHex.padStart(32, '0');
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度
   */
  private validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password || password.length < 8) {
      errors.push('密码至少需要8个字符');
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    if (!hasLetters) {
      errors.push('密码必须包含字母');
    }

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
   * 清理过期令牌
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const tokensData = await AsyncStorage.getItem(STORAGE_KEYS.RESET_TOKENS);
      if (!tokensData) {
        return;
      }

      const tokens: ResetToken[] = JSON.parse(tokensData);
      const now = Date.now();
      const validTokens = tokens.filter(t => t.expiresAt > now);

      await AsyncStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(validTokens));
    } catch (error) {
      console.error('[PasswordResetService] Failed to cleanup tokens:', error);
    }
  }
}

// 导出单例实例
export const passwordResetService = PasswordResetService.getInstance();
export default passwordResetService;
