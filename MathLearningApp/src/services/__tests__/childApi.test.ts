/**
 * childApi 测试
 *
 * Story 6-3: 孩子数据MySQL存储
 * 测试孩子管理API的完整功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { childApi } from '../childApi';
import { Child, Grade, ApiResponse } from '../../types';
import { childDataRepository } from '../mysql/ChildDataRepository';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../mysql/ChildDataRepository');
jest.mock('../mysql/prismaClient');
jest.mock('../userApi', () => ({
  getCurrentUserId: jest.fn(() => Promise.resolve('user-1')),
}));

// Import checkDatabaseConnection after mocking mysql module
import { checkDatabaseConnection } from '../mysql/prismaClient';

describe('childApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default: database is connected
    (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== getChildren 测试 ====================

  describe('getChildren', () => {
    it('应该从MySQL获取孩子列表成功', async () => {
      const mockChildren: Child[] = [
        {
          id: 'child-1',
          parentId: 'user-1',
          name: '小明',
          grade: Grade.GRADE_1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'child-2',
          parentId: 'user-1',
          name: '小红',
          grade: Grade.GRADE_2,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      // Mock MySQL返回
      (childDataRepository.findByParentId as jest.Mock).mockResolvedValue(mockChildren);

      const response = await childApi.getChildren();

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockChildren);
      expect(response.storageMode).toBe('mysql');
      expect(childDataRepository.findByParentId).toHaveBeenCalledWith('user-1');
    });

    it('应该处理MySQL连接失败的情况（降级到AsyncStorage）', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // Mock MySQL连接失败
      (childDataRepository.findByParentId as jest.Mock).mockRejectedValue(
        new Error('MySQL connection failed')
      );

      // Mock AsyncStorage返回
      const storageKey = '@math_learning_children_user-1';
      jest.spyOn(AsyncStorage as any, 'getItem').mockResolvedValue(
        JSON.stringify([mockChild])
      );

      const response = await childApi.getChildren();

      expect(response.success).toBe(true);
      expect(response.data).toEqual([mockChild]);
      expect(response.storageMode).toBe('local');
      expect(response.warning).toBeDefined();
    });

    it('应该处理完全没有数据的情况', async () => {
      // Mock MySQL和AsyncStorage都没有数据
      (childDataRepository.findByParentId as jest.Mock).mockResolvedValue([]);
      jest.spyOn(AsyncStorage as any, 'getItem').mockResolvedValue(null);

      const response = await childApi.getChildren();

      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
    });
  });

  // ==================== addChild 测试 ====================

  describe('addChild', () => {
    it('应该成功添加孩子到MySQL', async () => {
      const newChild = {
        name: '小明',
        grade: Grade.GRADE_1,
        birthday: new Date('2018-05-15'),
      };

      const createdChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        birthday: new Date('2018-05-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (childDataRepository.create as jest.Mock).mockResolvedValue(createdChild);
      jest.spyOn(AsyncStorage as any, 'multiSet').mockResolvedValue(undefined);

      const response = await childApi.addChild(newChild);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(createdChild);
      expect(childDataRepository.create).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          name: '小明',
          grade: Grade.GRADE_1,
        })
      );
    });

    it('应该验证孩子名字不能为空', async () => {
      const invalidChild = {
        name: '',
        grade: Grade.GRADE_1,
      };

      const response = await childApi.addChild(invalidChild);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
    });

    it('应该验证孩子名字长度', async () => {
      const invalidChild = {
        name: 'A',
        grade: Grade.GRADE_1,
      };

      const response = await childApi.addChild(invalidChild);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
    });

    it('应该验证年级', async () => {
      const invalidChild = {
        name: '小明',
        grade: '七年级' as any,
      };

      const response = await childApi.addChild(invalidChild);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==================== updateChild 测试 ====================

  describe('updateChild', () => {
    it('应该成功更新孩子信息', async () => {
      const updatedChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明（更新）',
        grade: Grade.GRADE_2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (childDataRepository.update as jest.Mock).mockResolvedValue(updatedChild);

      const response = await childApi.updateChild('child-1', {
        name: '小明（更新）',
        grade: Grade.GRADE_2,
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(updatedChild);
    });

    it('应该验证孩子ID不能为空', async () => {
      // Mock update to handle empty ID
      (childDataRepository.update as jest.Mock).mockRejectedValue(
        new Error('Invalid child ID')
      );

      const response = await childApi.updateChild('', {
        name: '小明',
        grade: Grade.GRADE_1,
      });

      expect(response.success).toBe(false);
    });
  });

  // ==================== deleteChild 测试 ====================

  describe('deleteChild', () => {
    it('应该成功删除孩子', async () => {
      (childDataRepository.delete as jest.Mock).mockResolvedValue(true);

      const response = await childApi.deleteChild('child-1');

      expect(response.success).toBe(true);
      expect(childDataRepository.delete).toHaveBeenCalledWith('child-1');
    });

    it('应该处理孩子不存在的情况', async () => {
      (childDataRepository.delete as jest.Mock).mockResolvedValue(false);

      const response = await childApi.deleteChild('child-1');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('CHILD_NOT_FOUND');
    });

    it('应该在MySQL失败时降级到AsyncStorage', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // Mock MySQL删除失败
      (childDataRepository.delete as jest.Mock).mockRejectedValue(
        new Error('MySQL connection failed')
      );

      // Mock AsyncStorage降级成功
      const storageKey = '@math_learning_children_user-1';
      jest.spyOn(AsyncStorage as any, 'getItem').mockResolvedValue(
        JSON.stringify([mockChild])
      );
      jest.spyOn(AsyncStorage as any, 'setItem').mockResolvedValue(undefined);

      const response = await childApi.deleteChild('child-1');

      expect(response.success).toBe(true);
      expect(response.storageMode).toBe('local');
      expect(response.warning).toBeDefined();
    });
  });

  // ==================== clearCache 测试 ====================

  describe('clearCache', () => {
    it('应该成功清除缓存', async () => {
      jest.spyOn(AsyncStorage as any, 'removeItem').mockResolvedValue(undefined);

      const response = await childApi.clearCache();

      expect(response.success).toBe(true);
    });
  });

  // ==================== refresh 测试 ====================

  describe('refresh', () => {
    it('应该成功刷新数据', async () => {
      const mockChildren: Child[] = [
        {
          id: 'child-1',
          parentId: 'user-1',
          name: '小明',
          grade: Grade.GRADE_1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      jest.spyOn(AsyncStorage as any, 'removeItem').mockResolvedValue(undefined);
      (childDataRepository.findByParentId as jest.Mock).mockResolvedValue(mockChildren);

      const response = await childApi.refresh();

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockChildren);
    });
  });
});
