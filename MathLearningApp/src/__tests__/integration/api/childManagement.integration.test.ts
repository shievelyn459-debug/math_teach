/**
 * 儿童管理流程集成测试
 * Story 8-4: API集成测试
 * AC1: 关键API调用流程的集成测试覆盖
 *
 * 测试范围:
 * - 创建儿童
 * - 更新儿童信息
 * - 切换活跃儿童
 * - 查看学习记录
 * - 删除儿童
 */

import { childApi } from '../../../services/childApi';
import { activeChildService } from '../../../services/activeChildService';
import { TestDataFactory, TestDataCleaner, testChildren } from '../setup/testData';
import { Grade } from '../../../types';

// Mock API客户端
jest.mock('../../../services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('Child Management Flow Integration Tests', () => {
  let testUser: any;
  let testChild1: any;
  let testChild2: any;

  beforeAll(async () => {
    console.log('👶 Setting up child management integration tests...');
    testUser = TestDataFactory.createUser();
    testChild1 = TestDataFactory.createChild({ parentId: testUser.id });
    testChild2 = TestDataFactory.createChild({
      ...testChildren.child2,
      parentId: testUser.id,
    });
  });

  afterAll(async () => {
    await TestDataCleaner.cleanAll();
    console.log('🧹 Cleaned up test data');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC1.1: Create Child Flow', () => {
    it('should successfully create a child profile', async () => {
      // Arrange
      const newChildData = {
        name: '新小朋友',
        grade: Grade.GRADE_2,
        birthday: new Date('2017-06-10'),
        parentId: testUser.id,
      };

      const { apiClient } = require('../../../services/api');
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            child: {
              id: 'child-new-1',
              ...newChildData,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      });

      // Act
      const result = await childApi.addChild(newChildData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.child.name).toBe(newChildData.name);
      expect(result.data.child.grade).toBe(Grade.GRADE_2);
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidChildData = {
        // 缺少name字段
        grade: Grade.GRADE_1,
        birthday: new Date('2018-01-01'),
      };

      // Act & Assert
      await expect(childApi.addChild(invalidChildData)).rejects.toThrow(
        'Name is required'
      );
    });

    it('should validate grade value', async () => {
      // Arrange
      const invalidGradeData = {
        name: 'Test Child',
        grade: 'INVALID_GRADE' as any,
        birthday: new Date('2018-01-01'),
        parentId: testUser.id,
      };

      // Act & Assert
      await expect(childApi.addChild(invalidGradeData)).rejects.toThrow(
        'Invalid grade value'
      );
    });

    it('should enforce maximum children limit per user', async () => {
      // Arrange - 模拟已有5个儿童
      const { apiClient } = require('../../../services/api');

      // 获取现有儿童列表
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            children: [
              { id: 'child-1' },
              { id: 'child-2' },
              { id: 'child-3' },
              { id: 'child-4' },
              { id: 'child-5' },
            ],
          },
        },
      });

      // 尝试创建第6个
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'MAX_CHILDREN_EXCEEDED',
            message: 'Maximum 5 children allowed per user',
          },
        },
      });

      // Act
      const existingChildren = await childApi.getChildren(testUser.id);
      const result = await childApi.addChild({
        name: 'Child 6',
        grade: Grade.GRADE_1,
        birthday: new Date(),
        parentId: testUser.id,
      });

      // Assert
      expect(existingChildren.data.children.length).toBe(5);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('MAX_CHILDREN_EXCEEDED');
    });
  });

  describe('AC1.2: Update Child Info Flow', () => {
    it('should successfully update child name', async () => {
      // Arrange
      const updateData = {
        name: '更新后的名字',
      };

      const { apiClient } = require('../../../services/api');
      apiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            child: {
              ...testChild1,
              ...updateData,
              updatedAt: new Date(),
            },
          },
        },
      });

      // Act
      const result = await childApi.updateChild(testChild1.id, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.child.name).toBe(updateData.name);
    });

    it('should successfully update child grade', async () => {
      // Arrange
      const updateData = {
        grade: Grade.GRADE_4,
      };

      const { apiClient } = require('../../../services/api');
      apiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            child: {
              ...testChild1,
              ...updateData,
            },
          },
        },
      });

      // Act
      const result = await childApi.updateChild(testChild1.id, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.child.grade).toBe(Grade.GRADE_4);
    });

    it('should reject update to non-existent child', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');
      apiClient.put.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child profile not found',
          },
        },
      });

      // Act
      const result = await childApi.updateChild('non-existent-id', {
        name: 'Test',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHILD_NOT_FOUND');
    });

    it('should validate name length', async () => {
      // Arrange
      const tooLongName = 'a'.repeat(51); // 超过50字符限制

      // Act & Assert
      await expect(
        childApi.updateChild(testChild1.id, { name: tooLongName })
      ).rejects.toThrow('Name must be between 2 and 50 characters');
    });
  });

  describe('AC1.3: Switch Active Child Flow', () => {
    it('should successfully switch active child', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // Act
      await activeChildService.setActiveChildId(testChild1.id);

      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'active_child_id',
        testChild1.id
      );
    });

    it('should get active child info', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(testChild1.id);

      const { apiClient } = require('../../../services/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { child: testChild1 },
        },
      });

      // Act
      const activeChildId = await activeChildService.getActiveChildId();
      const result = await childApi.getChild(activeChildId);

      // Assert
      expect(activeChildId).toBe(testChild1.id);
      expect(result.success).toBe(true);
      expect(result.data.child.id).toBe(testChild1.id);
    });

    it('should clear active child on logout', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // Act
      await activeChildService.clearActiveChild();

      // Assert
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('active_child_id');
    });
  });

  describe('AC1.4: View Learning Records Flow', () => {
    it('should retrieve child learning history', async () => {
      // Arrange
      const mockHistory = [
        {
          id: 'record-1',
          childId: testChild1.id,
          date: new Date('2026-01-01'),
          questionsGenerated: 10,
          questionsCorrect: 8,
        },
        {
          id: 'record-2',
          childId: testChild1.id,
          date: new Date('2026-01-02'),
          questionsGenerated: 15,
          questionsCorrect: 12,
        },
      ];

      const { apiClient } = require('../../../services/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { records: mockHistory },
        },
      });

      // Act
      const result = await childApi.getLearningRecords(testChild1.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.records).toHaveLength(2);
    });

    it('should filter records by date range', async () => {
      // Arrange
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const { apiClient } = require('../../../services/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { records: [] },
        },
      });

      // Act
      await childApi.getLearningRecords(testChild1.id, {
        startDate,
        endDate,
      });

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate')
      );
    });

    it('should calculate learning statistics', async () => {
      // Arrange
      const mockStats = {
        totalQuestions: 100,
        correctRate: 0.85,
        streak: 7,
        weeklyProgress: 15,
      };

      const { apiClient } = require('../../../services/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { statistics: mockStats },
        },
      });

      // Act
      const result = await childApi.getLearningStatistics(testChild1.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.statistics.totalQuestions).toBe(100);
      expect(result.data.statistics.correctRate).toBe(0.85);
    });
  });

  describe('AC1.5: Delete Child Flow', () => {
    it('should successfully delete child profile', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');
      apiClient.delete.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Child profile deleted successfully',
        },
      });

      // Act
      const result = await childApi.deleteChild(testChild2.id);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should require confirmation before deletion', async () => {
      // Arrange - 模拟确认流程
      const { apiClient } = require('../../../services/api');

      // 第一步：请求删除（需要确认）
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            requiresConfirmation: true,
            childName: testChild1.name,
            warningMessage: 'This action cannot be undone',
          },
        },
      });

      // 第二步：确认删除
      apiClient.delete.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Child profile deleted',
        },
      });

      // Act
      const requestResult = await childApi.requestDeleteChild(testChild1.id);
      expect(requestResult.data.requiresConfirmation).toBe(true);

      const confirmResult = await childApi.confirmDeleteChild(
        testChild1.id,
        'CONFIRM'
      );

      // Assert
      expect(confirmResult.success).toBe(true);
    });

    it('should handle deletion of active child', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(testChild1.id);

      const { apiClient } = require('../../../services/api');
      apiClient.delete.mockResolvedValueOnce({
        data: { success: true },
      });

      // Act
      await childApi.deleteChild(testChild1.id);

      // 如果删除的是活跃儿童，应该清除活跃状态
      const activeChildId = await activeChildService.getActiveChildId();

      // Assert
      expect(activeChildId).toBeNull();
    });

    it('should preserve learning records after child deletion', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');

      apiClient.delete.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            archivedRecords: 10,
            message: 'Child deleted, records archived',
          },
        },
      });

      // Act
      const result = await childApi.deleteChild(testChild1.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.archivedRecords).toBe(10);
    });
  });

  describe('AC1.6: Error Handling', () => {
    it('should handle network failure gracefully', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      // Act
      const result = await childApi.getChildren(testUser.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NETWORK_ERROR');
    });

    it('should handle unauthorized access', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        },
      });

      // Act
      const result = await childApi.getChildren(testUser.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED');
    });

    it('should prevent cross-user child access', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this child',
          },
        },
      });

      // Act
      const result = await childApi.getChild('other-user-child-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('FORBIDDEN');
    });
  });
});
