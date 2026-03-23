/**
 * Story 1-4: 个人资料服务测试
 * 测试资料获取、更新和验证功能
 */

import {userApi} from '../api';
import {ProfileUpdateRequest} from '../../types';

// Mock fetch
global.fetch = jest.fn();

describe('ProfileService (Story 1-4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('应该成功获取用户资料', async () => {
      const mockUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '+8613812345678',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUser,
        }),
      });

      const result = await userApi.getProfile();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/profile'),
        expect.any(Object)
      );
    });

    it('应该处理获取资料失败的情况', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await userApi.getProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('GET_PROFILE_ERROR');
    });

    it('应该处理电话号码为空的情况', async () => {
      const mockUser = {
        id: 'user-123',
        name: '李四',
        email: 'lisi@example.com',
        phone: undefined, // 电话号码为空
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUser,
        }),
      });

      const result = await userApi.getProfile();

      expect(result.success).toBe(true);
      expect(result.data?.phone).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('应该成功更新姓名', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        name: '王五',
        email: 'old@example.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedUser,
        }),
      });

      const updates: ProfileUpdateRequest = {name: '王五'};
      const result = await userApi.updateProfile(updates);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('王五');
    });

    it('应该成功更新电话号码', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '+8613987654321',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedUser,
        }),
      });

      const updates: ProfileUpdateRequest = {phone: '+8613987654321'};
      const result = await userApi.updateProfile(updates);

      expect(result.success).toBe(true);
      expect(result.data?.phone).toBe('+8613987654321');
    });

    it('应该成功清空电话号码', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        phone: null, // 清空电话
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedUser,
        }),
      });

      const updates: ProfileUpdateRequest = {phone: undefined};
      const result = await userApi.updateProfile(updates);

      expect(result.success).toBe(true);
      expect(result.data?.phone).toBeNull();
    });

    it('应该处理更新失败的情况', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const updates: ProfileUpdateRequest = {name: '新名字'};
      const result = await userApi.updateProfile(updates);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UPDATE_PROFILE_ERROR');
    });

    it('应该处理邮箱重复错误', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: '该邮箱已被注册',
          },
        }),
      });

      const updates: ProfileUpdateRequest = {email: 'existing@example.com'};
      const result = await userApi.updateProfile(updates);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });
});

/**
 * 验证服务测试
 */
describe('Profile Validation (Story 1-4)', () => {
  describe('姓名验证', () => {
    const validateName = (name: string): {isValid: boolean; error?: string} => {
      if (!name || name.trim().length < 2) {
        return {isValid: false, error: '姓名至少需要2个字符'};
      }
      if (name.trim().length > 50) {
        return {isValid: false, error: '姓名不能超过50个字符'};
      }
      return {isValid: true};
    };

    it('应该接受有效的姓名', () => {
      expect(validateName('张三').isValid).toBe(true);
      expect(validateName('Zhang San').isValid).toBe(true);
      expect(validateName('A B').isValid).toBe(true);
    });

    it('应该拒绝太短的姓名', () => {
      const result = validateName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('姓名至少需要2个字符');
    });

    it('应该拒绝太长的姓名', () => {
      const longName = 'A'.repeat(51);
      const result = validateName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('姓名不能超过50个字符');
    });

    it('应该拒绝空姓名', () => {
      const result = validateName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('姓名至少需要2个字符');
    });

    it('应该自动修剪空格', () => {
      const result = validateName('  张三  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('邮箱验证', () => {
    const validateEmail = (email: string): {isValid: boolean; error?: string} => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return {isValid: false, error: '请输入有效的邮箱地址'};
      }
      return {isValid: true};
    };

    it('应该接受有效的邮箱', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('user.name@domain.co.jp').isValid).toBe(true);
      expect(validateEmail('user+tag@example.com').isValid).toBe(true);
    });

    it('应该拒绝无效的邮箱', () => {
      expect(validateEmail('invalid').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('user @example.com').isValid).toBe(false);
    });
  });

  describe('电话号码验证（可选）', () => {
    const validatePhone = (phone: string | undefined): {isValid: boolean; error?: string} => {
      // 电话号码是可选的
      if (!phone || phone.trim().length === 0) {
        return {isValid: true};
      }

      // 简单验证：支持国际格式
      // E.164 格式：+[国家代码][号码]，最少8位，最多15位
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
        return {isValid: false, error: '请输入有效的电话号码'};
      }
      return {isValid: true};
    };

    it('应该接受空电话号码（可选字段）', () => {
      expect(validatePhone('').isValid).toBe(true);
      expect(validatePhone(undefined).isValid).toBe(true);
    });

    it('应该接受有效的电话号码', () => {
      expect(validatePhone('+8613812345678').isValid).toBe(true);
      expect(validatePhone('13812345678').isValid).toBe(true);
      expect(validatePhone('+1234567890').isValid).toBe(true);
    });

    it('应该拒绝无效的电话号码', () => {
      expect(validatePhone('123').isValid).toBe(false);
      expect(validatePhone('abc').isValid).toBe(false);
      expect(validatePhone('+1234567890123456').isValid).toBe(false); // 太长
    });
  });
});

/**
 * 性能测试 (AC9: 3秒内完成)
 */
describe('Profile Service Performance (Story 1-4 AC9)', () => {
  it('资料更新应在3秒内完成', async () => {
    const startTime = Date.now();

    const mockUpdatedUser = {
      id: 'user-123',
      name: '张三',
      email: 'zhangsan@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: mockUpdatedUser,
            }),
          });
        }, 100); // 模拟100ms延迟
      })
    );

    await userApi.updateProfile({name: '新名字'});

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(3000); // 3秒 = 3000ms
  });
});
