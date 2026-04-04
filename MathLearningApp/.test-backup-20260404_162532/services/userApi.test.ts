/**
 * userApi 测试
 *
 * 用户API辅助函数测试
 * 测试用户ID获取等辅助功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId } from '../userApi';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');

describe('userApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== getCurrentUserId 测试 ====================

  describe('getCurrentUserId', () => {
    it('应该成功返回当前用户ID', async () => {
      const mockUserData = {
        id: 'user-123',
        name: '测试用户',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(
        JSON.stringify(mockUserData)
      );

      const userId = await getCurrentUserId();

      expect(userId).toBe('user-123');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@math_learning_user_data'
      );
    });

    it('应该在没有用户数据时返回null', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null);

      const userId = await getCurrentUserId();

      expect(userId).toBeNull();
    });

    it('应该处理无效的JSON数据', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue('invalid json');

      const userId = await getCurrentUserId();

      expect(userId).toBeNull();
    });

    it('应该处理用户数据中没有id字段的情况', async () => {
      const mockUserData = {
        name: '测试用户',
        email: 'test@example.com',
        // 缺少id字段
      };

      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(
        JSON.stringify(mockUserData)
      );

      const userId = await getCurrentUserId();

      expect(userId).toBeNull();
    });

    it('应该处理空字符串id', async () => {
      const mockUserData = {
        id: '',
        name: '测试用户',
        email: 'test@example.com',
      };

      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(
        JSON.stringify(mockUserData)
      );

      const userId = await getCurrentUserId();

      expect(userId).toBeNull();
    });

    it('应该处理AsyncStorage错误', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(
        new Error('Storage error')
      );

      const userId = await getCurrentUserId();

      expect(userId).toBeNull();
    });
  });
});
