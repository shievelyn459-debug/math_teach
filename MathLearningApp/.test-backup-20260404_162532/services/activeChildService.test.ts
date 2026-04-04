/**
 * activeChildService 测试
 *
 * Story 1-5 + Story 6-3: 活跃孩子管理服务
 * 测试活跃孩子的选择、持久化和通知功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Child, Grade } from '../../types';

// Mock dependencies BEFORE importing the service
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../childApi', () => ({
  getChildren: jest.fn(),
}));

// Import after mocks are set up
import { activeChildService } from '../activeChildService';
import { getChildren } from '../childApi';

// Helper function to reset service state for testing
async function resetServiceState() {
  // Clear the active child
  await (activeChildService as any).clearActiveChild();
  // Reset internal properties
  (activeChildService as any).activeChild = null;
  (activeChildService as any).activeChildId = null;
  (activeChildService as any).listeners = [];
  // Reset init promise
  (activeChildService as any).initPromise = null;
}

describe('activeChildService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset service state before each test
    await resetServiceState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== 单例模式测试 ====================

  describe('Singleton Pattern', () => {
    it('应该返回相同的实例', () => {
      const instance1 = activeChildService;
      const instance2 = activeChildService;

      expect(instance1).toBe(instance2);
    });
  });

  // ==================== 初始化测试 ====================

  describe('Initialization', () => {
    it('应该从AsyncStorage恢复活跃孩子ID并从MySQL获取数据', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // Mock AsyncStorage返回活跃孩子ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('child-1');

      // Mock getChildren返回MySQL数据
      (getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockChild],
      });

      // 手动触发初始化
      await (activeChildService as any).initialize();

      expect(activeChildService.getActiveChild()).toEqual(mockChild);
    });

    it('应该处理活跃孩子已被删除的情况', async () => {
      // Mock AsyncStorage返回活跃孩子ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('child-1');

      // Mock getChildren返回空列表（孩子已被删除）
      (getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      // Mock AsyncStorage.removeItem
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue();

      // 手动触发初始化
      await (activeChildService as any).initialize();

      expect(activeChildService.getActiveChild()).toBeNull();
    });
  });

  // ==================== getActiveChild 测试 ====================

  describe('getActiveChild', () => {
    it('应该返回当前活跃的孩子', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // Mock AsyncStorage返回活跃孩子ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('child-1');

      // Mock getChildren返回MySQL数据
      (getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockChild],
      });

      // 手动触发初始化
      await (activeChildService as any).initialize();

      const activeChild = activeChildService.getActiveChild();
      expect(activeChild).toEqual(mockChild);
    });

    it('应该在没有活跃孩子时返回null', () => {
      const activeChild = activeChildService.getActiveChild();
      expect(activeChild).toBeNull();
    });
  });

  // ==================== getActiveChildId 测试 ====================

  describe('getActiveChildId', () => {
    it('应该返回活跃孩子的ID', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // Mock AsyncStorage返回活跃孩子ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('child-1');

      // Mock getChildren返回MySQL数据
      (getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockChild],
      });

      // 手动触发初始化
      await (activeChildService as any).initialize();

      const childId = activeChildService.getActiveChildId();
      expect(childId).toBe('child-1');
    });
  });

  // ==================== getActiveChildGrade 测试 ====================

  describe('getActiveChildGrade', () => {
    it('应该返回活跃孩子的年级', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // Mock AsyncStorage返回活跃孩子ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('child-1');

      // Mock getChildren返回MySQL数据
      (getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockChild],
      });

      // 手动触发初始化
      await (activeChildService as any).initialize();

      const grade = activeChildService.getActiveChildGrade();
      expect(grade).toBe(Grade.GRADE_2);
    });

    it('应该在没有活跃孩子时返回null', () => {
      const grade = activeChildService.getActiveChildGrade();
      expect(grade).toBeNull();
    });
  });

  // ==================== setActiveChild 测试 ====================

  describe('setActiveChild', () => {
    it('应该成功设置活跃孩子', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue();

      const response = await activeChildService.setActiveChild(mockChild);

      expect(response.success).toBe(true);
      expect(activeChildService.getActiveChild()).toEqual(mockChild);
    });

    it('应该验证孩子是否在可用列表中', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const availableChildren: Child[] = [
        {
          id: 'child-2',
          parentId: 'user-1',
          name: '小红',
          grade: Grade.GRADE_2,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const response = await activeChildService.setActiveChild(
        mockChild,
        availableChildren
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('选择的孩子不存在');
    });

    it('应该支持清除活跃孩子（传入null）', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue();

      const response = await activeChildService.setActiveChild(null);

      expect(response.success).toBe(true);
      expect(activeChildService.getActiveChild()).toBeNull();
    });
  });

  // ==================== clearActiveChild 测试 ====================

  describe('clearActiveChild', () => {
    it('应该成功清除活跃孩子', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // 首先设置活跃孩子
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue();
      await activeChildService.setActiveChild(mockChild);

      // 然后清除
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue();
      await activeChildService.clearActiveChild();

      expect(activeChildService.getActiveChild()).toBeNull();
      expect(activeChildService.getActiveChildId()).toBeNull();
    });
  });

  // ==================== handleDeletedChild 测试 ====================

  describe('handleDeletedChild', () => {
    it('应该处理活跃孩子被删除的情况', async () => {
      const deletedChildId = 'child-1';
      const remainingChildren: Child[] = [
        {
          id: 'child-2',
          parentId: 'user-1',
          name: '小红',
          grade: Grade.GRADE_2,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      // 首先设置活跃孩子为child-1
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue();
      await activeChildService.setActiveChild({
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      (AsyncStorage.setItem as jest.Mock).mockClear();
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue();

      const newActiveChild = await activeChildService.handleDeletedChild(
        deletedChildId,
        remainingChildren
      );

      expect(newActiveChild).toEqual(remainingChildren[0]);
      expect(activeChildService.getActiveChild()).toEqual(remainingChildren[0]);
    });

    it('应该在没有剩余孩子时清除活跃孩子', async () => {
      const deletedChildId = 'child-1';
      const remainingChildren: Child[] = [];

      // 首先设置活跃孩子
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue();
      await activeChildService.setActiveChild({
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue();

      const newActiveChild = await activeChildService.handleDeletedChild(
        deletedChildId,
        remainingChildren
      );

      expect(newActiveChild).toBeNull();
      expect(activeChildService.getActiveChild()).toBeNull();
    });
  });

  // ==================== refreshActiveChild 测试 ====================

  describe('refreshActiveChild', () => {
    it('应该从MySQL刷新活跃孩子数据', async () => {
      const oldChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const newChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_2, // 年级更新了
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      // 首先设置活跃孩子
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue();
      await activeChildService.setActiveChild(oldChild);

      // Mock刷新后的数据
      (getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [newChild],
      });

      await activeChildService.refreshActiveChild();

      expect(activeChildService.getActiveChild()).toEqual(newChild);
    });
  });

  // ==================== 监听器测试 ====================

  describe('Listeners', () => {
    it('应该通知监听器活跃孩子变化', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue();

      let receivedChild: Child | null = null;
      const unsubscribe = activeChildService.onActiveChildChanged((child) => {
        receivedChild = child;
      });

      // onActiveChildChanged会立即调用当前状态（null）
      expect(receivedChild).toBeNull();

      await activeChildService.setActiveChild(mockChild);

      // 现在应该收到mockChild
      expect(receivedChild).toEqual(mockChild);

      unsubscribe();
    });

    it('应该支持取消监听', async () => {
      const mockChild: Child = {
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue();

      let callCount = 0;
      const unsubscribe = activeChildService.onActiveChildChanged(() => {
        callCount++;
      });

      // 初始调用一次
      expect(callCount).toBe(1);

      // 取消监听
      unsubscribe();

      await activeChildService.setActiveChild(mockChild);

      // 不应该再增加
      expect(callCount).toBe(1);
    });
  });
});
