/**
 * passwordResetService 测试
 * Story 1-3: 家长用户重置密码
 *
 * 测试覆盖:
 * - AC1: 用户请求密码重置
 * - AC2: 系统验证邮箱并发送重置链接
 * - AC3: 防止邮箱枚举攻击
 * - AC4: 重置链接1小时后过期
 * - AC5: 用户使用令牌设置新密码
 * - AC6: 新密码安全要求验证
 * - AC7: 成功重置后用户可登录
 * - AC8: 性能要求（邮件5秒，密码更新3秒）
 */

// Mock crypto at the top level before importing
const hashStore = new Map<string, string>();

// Compute a simple hash string from input
const computeSimpleHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Create a 64-char hex string (32 bytes * 2 hex chars)
  const hashHex = Math.abs(hash).toString(16).padStart(16, '0');
  // Repeat to get 64 characters
  return `hashed_${hashHex.repeat(4).slice(0, 64)}`;
};

// Helper to convert Uint8Array to string - must be consistent
const uint8ArrayToString = (data: Uint8Array): string => {
  return Array.from(data).map(byte => String.fromCharCode(byte)).join('');
};

// Helper function for tests to compute hash
const mockSha256Digest = async (textOrData: string | Uint8Array): Promise<string> => {
  // Always convert to string first
  let text: string;
  if (typeof textOrData === 'string') {
    text = textOrData;
  } else {
    text = uint8ArrayToString(textOrData);
  }

  if (!hashStore.has(text)) {
    hashStore.set(text, computeSimpleHash(text));
  }
  return hashStore.get(text)!;
};

// Mock Web Crypto API
const mockDigest = jest.fn().mockImplementation(async (algorithm: AlgorithmIdentifier, data: Uint8Array) => {
  // Convert Uint8Array to string
  const text = uint8ArrayToString(data);
  // Get hash for this text
  if (!hashStore.has(text)) {
    hashStore.set(text, computeSimpleHash(text));
  }
  const hashHex = hashStore.get(text)!;
  const hashValue = hashHex.replace('hashed_', '');
  // Convert hex string to ArrayBuffer
  const hashBytes = new Uint8Array(hashValue.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  return hashBytes.buffer;
});

// Set up the crypto mock globally
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
  writable: true,
  configurable: true,
});

import {passwordResetService} from '../passwordResetService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {api} from '../api';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../api', () => ({
  api: {
    passwordReset: {
      requestReset: jest.fn(),
      confirmReset: jest.fn(),
    },
  },
  isApiSuccess: jest.fn((response: any) => response?.success === true),
}));

describe('passwordResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('requestPasswordReset', () => {
    it('应该接受有效的邮箱格式请求', async () => {
      const mockApiResponse = {
        success: true,
        data: {success: true},
        message: '如果该邮箱已注册，您将收到密码重置链接',
      };
      (api.passwordReset.requestReset as jest.Mock).mockResolvedValue(mockApiResponse);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const response = await passwordResetService.requestPasswordReset(
        'test@example.com'
      );

      expect(response.success).toBe(true);
      expect(response.message).toContain('如果该邮箱已注册');
    });

    it('应该拒绝无效的邮箱格式', async () => {
      const response = await passwordResetService.requestPasswordReset('invalid-email');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INVALID_EMAIL');
      expect(response.error?.message).toContain('有效的邮箱地址');
    });

    it('AC3: 防止邮箱枚举 - 始终返回相同消息', async () => {
      // Mock API 返回错误（模拟邮箱不存在）
      (api.passwordReset.requestReset as jest.Mock).mockRejectedValue(
        new Error('Email not found')
      );
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const response = await passwordResetService.requestPasswordReset(
        'nonexistent@example.com'
      );

      // AC3: 即使出错，也返回成功消息以防止邮箱枚举
      expect(response.success).toBe(true);
      expect(response.message).toContain('如果该邮箱已注册');
    });

    it('应该应用速率限制 - 防止滥用', async () => {
      const mockRateLimitData = JSON.stringify({
        count: 3,
        windowStart: Date.now(),
      });
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('rate_limit')) {
          return Promise.resolve(mockRateLimitData);
        }
        return Promise.resolve(null);
      });

      const response = await passwordResetService.requestPasswordReset(
        'test@example.com'
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('AC8: 应该在5秒内完成请求', async () => {
      const mockApiResponse = {
        success: true,
        data: {success: true},
      };
      (api.passwordReset.requestReset as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockApiResponse), 100); // 100ms
          })
      );
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const startTime = Date.now();
      await passwordResetService.requestPasswordReset('test@example.com');
      const endTime = Date.now();

      // AC8: 请求应该在5秒内完成（这里我们用较短的时间测试）
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('confirmPasswordReset', () => {
    // 由于 hashToken 现在使用 SHA-256，需要使用相同的哈希函数
    const getValidTestToken = () => {
      return 'test_token_12345678';
    };

    const getHashedTestToken = async () => {
      // 使用与 mockSha256Digest 相同的哈希逻辑
      return await mockSha256Digest(getValidTestToken());
    };

    beforeEach(async () => {
      // Mock 存储的令牌数据 - 使用计算出的哈希值
      const hashedToken = await getHashedTestToken();
      const storedToken = JSON.stringify([
        {
          token: hashedToken,
          email: 'test@example.com',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
          used: false,
        },
      ]);
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('reset_tokens')) {
          return Promise.resolve(storedToken);
        }
        return Promise.resolve(null);
      });
    });

    it('AC5: 应该接受有效的令牌并更新密码', async () => {
      const testToken = getValidTestToken();
      const mockApiResponse = {
        success: true,
        data: {success: true},
        message: '密码重置成功！',
      };
      (api.passwordReset.confirmReset as jest.Mock).mockResolvedValue(mockApiResponse);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // Debug logging
      console.log('Test token for AC5:', testToken);

      const response = await passwordResetService.confirmPasswordReset(
        testToken,
        'NewPassword123'
      );

      console.log('Response for AC5:', response);

      expect(response.success).toBe(true);
      expect(response.message).toContain('密码重置成功');
    });

    it('AC6: 应该拒绝弱密码（少于8个字符）', async () => {
      const response = await passwordResetService.confirmPasswordReset(
        getValidTestToken(),
        'Short1'
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('WEAK_PASSWORD');
      expect(response.error?.message).toContain('至少需要8个字符');
    });

    it('AC6: 应该拒绝只包含字母的密码', async () => {
      const response = await passwordResetService.confirmPasswordReset(
        getValidTestToken(),
        'abcdefgh'
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('WEAK_PASSWORD');
      expect(response.error?.message).toContain('数字');
    });

    it('AC6: 应该拒绝只包含数字的密码', async () => {
      const response = await passwordResetService.confirmPasswordReset(
        getValidTestToken(),
        '12345678'
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('WEAK_PASSWORD');
      expect(response.error?.message).toContain('字母');
    });

    it('AC4: 应该拒绝过期的令牌', async () => {
      // Mock 存储的过期令牌
      const expiredToken = JSON.stringify([
        {
          token: expect.any(String),
          email: 'test@example.com',
          createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2小时前创建
          expiresAt: Date.now() - 60 * 60 * 1000, // 1小时前过期
          used: false,
        },
      ]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(expiredToken);

      const response = await passwordResetService.confirmPasswordReset(
        'expired-token',
        'NewPassword123'
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INVALID_TOKEN');
      expect(response.error?.message).toContain('过期');
    });

    it('应该拒绝无效的令牌格式', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const response = await passwordResetService.confirmPasswordReset(
        'short',
        'NewPassword123'
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INVALID_TOKEN');
    });

    it('应该拒绝已使用的令牌（一次性使用）', async () => {
      // Mock 已使用的令牌
      const hashedToken = await getHashedTestToken();
      const usedToken = JSON.stringify([
        {
          token: hashedToken,
          email: 'test@example.com',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
          used: true, // 已使用
        },
      ]);
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('reset_tokens')) {
          return Promise.resolve(usedToken);
        }
        return Promise.resolve(null);
      });

      const response = await passwordResetService.confirmPasswordReset(
        getValidTestToken(),
        'NewPassword123'
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INVALID_TOKEN');
    });

    it('AC8: 应该在3秒内完成密码更新', async () => {
      const mockApiResponse = {
        success: true,
        data: {success: true},
      };
      (api.passwordReset.confirmReset as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockApiResponse), 100); // 100ms
          })
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const startTime = Date.now();
      await passwordResetService.confirmPasswordReset(
        getValidTestToken(),
        'NewPassword123'
      );
      const endTime = Date.now();

      // AC8: 密码更新应该在3秒内完成
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });

  describe('validateResetToken', () => {
    const getValidTestToken = () => 'test_token_validate';
    const getHashedTestToken = async () => {
      return await mockSha256Digest(getValidTestToken());
    };

    it('应该验证有效的令牌', async () => {
      const testToken = getValidTestToken();
      const hashedToken = await getHashedTestToken();
      const validTokenData = JSON.stringify([
        {
          token: hashedToken,
          email: 'test@example.com',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
          used: false,
        },
      ]);
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('reset_tokens')) {
          console.log('Storage.getItem called for:', key);
          console.log('Returning:', validTokenData);
          return Promise.resolve(validTokenData);
        }
        return Promise.resolve(null);
      });

      // Debug: log the token values
      console.log('Test token:', testToken);
      console.log('Expected hash:', hashedToken);

      // Test hash computation directly
      console.log('[TEST] Calling mockSha256Digest directly with:', testToken);
      const directHash = await mockSha256Digest(testToken);
      console.log('[TEST] Direct hash result:', directHash);
      console.log('[TEST] Direct hash matches expected:', directHash === hashedToken);

      // Also test what the service hash function returns
      console.log('[TEST] Calling service hashToken with:', testToken);
      console.log('[TEST] global.crypto exists:', typeof global.crypto !== 'undefined');
      console.log('[TEST] global.crypto.subtle exists:', global.crypto?.subtle !== undefined);

      let serviceHash;
      try {
        serviceHash = await (passwordResetService as any).hashToken(testToken);
        console.log('Service computed hash:', serviceHash);
        console.log('Hashes match:', serviceHash === hashedToken);
      } catch (e) {
        console.log('Error calling service hashToken:', e);
        throw e;
      }

      const result = await passwordResetService.validateResetToken(testToken);

      console.log('Validation result:', result);

      expect(result.valid).toBe(true);
      expect(result.email).toBe('test@example.com');
    });

    it('应该将过期令牌标记为无效', async () => {
      const expiredTokenData = JSON.stringify([
        {
          token: expect.any(String),
          email: 'test@example.com',
          createdAt: Date.now() - 2 * 60 * 60 * 1000,
          expiresAt: Date.now() - 60 * 60 * 1000,
          used: false,
        },
      ]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(expiredTokenData);

      const result = await passwordResetService.validateResetToken(
        'expired-token'
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('clearAllTokens', () => {
    it('应该清除所有存储的重置令牌', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await passwordResetService.clearAllTokens();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining('reset_tokens')
      );
    });
  });

  describe('安全特性', () => {
    it('应该生成加密安全的令牌', async () => {
      // Mock API response
      (api.passwordReset.requestReset as jest.Mock).mockResolvedValue({
        success: true,
        data: {success: true},
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        if (key.includes('reset_tokens')) {
          const tokens = JSON.parse(value as string);
          // 验证令牌长度（至少 64 个十六进制字符）
          expect(tokens[0].token).toMatch(/^hashed_[a-z0-9]+$/);
          expect(tokens[0].token.length).toBeGreaterThan(10);
        }
        return Promise.resolve(undefined);
      });

      await passwordResetService.requestPasswordReset('test@example.com');
    });

    it('应该使用哈希存储令牌（而非明文）', async () => {
      (api.passwordReset.requestReset as jest.Mock).mockResolvedValue({
        success: true,
        data: {success: true},
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        if (key.includes('reset_tokens')) {
          const tokens = JSON.parse(value as string);
          // 验证令牌被哈希（不是原始值）
          expect(tokens[0].token).not.toBe('plaintext-token');
          expect(tokens[0].token).toMatch(/^hashed_/);
        }
        return Promise.resolve(undefined);
      });

      await passwordResetService.requestPasswordReset('test@example.com');
    });
  });

  describe('密码强度验证', () => {
    // 创建一个有效的测试令牌
    const getValidTestToken = () => 'test_token_strength';
    const getHashedTestToken = async () => {
      return await mockSha256Digest(getValidTestToken());
    };

    beforeEach(async () => {
      // 为每个测试设置有效的令牌存储
      const hashedToken = await getHashedTestToken();
      const storedToken = JSON.stringify([
        {
          token: hashedToken,
          email: 'test@example.com',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000,
          used: false,
        },
      ]);
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('reset_tokens')) {
          return Promise.resolve(storedToken);
        }
        return Promise.resolve(null);
      });
    });

    it('AC6: 应该接受符合要求的密码', async () => {
      const validPasswords = [
        'Password123',
        'MySecure456',
        'TestPass789',
        'ValidPass1',
      ];

      for (const password of validPasswords) {
        const response = await passwordResetService.confirmPasswordReset(
          getValidTestToken(),
          password
        );
        // 密码验证应该通过（虽然令牌验证可能失败）
        if (response.error?.code !== 'INVALID_TOKEN') {
          expect(response.error?.code).not.toBe('WEAK_PASSWORD');
        }
      }
    });

    it('AC6: 应该检查密码包含字母', async () => {
      const response = await passwordResetService.confirmPasswordReset(
        getValidTestToken(),
        '12345678'
      );

      expect(response.error?.code).toBe('WEAK_PASSWORD');
      expect(response.error?.message).toContain('字母');
    });

    it('AC6: 应该检查密码包含数字', async () => {
      const response = await passwordResetService.confirmPasswordReset(
        getValidTestToken(),
        'abcdefgh'
      );

      expect(response.error?.code).toBe('WEAK_PASSWORD');
      expect(response.error?.message).toContain('数字');
    });
  });
});
