/**
 * OfflineQueue Tests
 *
 * Story 6.5: 离线同步与冲突解决
 * AC2: 离线队列机制测试通过
 */

import {OfflineQueue, OperationType, EntityType} from '../OfflineQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset AsyncStorage mock to return empty queue
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    // Create new instance for each test
    queue = new OfflineQueue();
  });

  // ==================== Task 2.1: 队列持久化测试 ====================

  describe('Task 2.1: Queue Persistence', () => {
    /**
     * 测试离线操作队列持久化
     */
    it('should persist queue to AsyncStorage', async () => {
      await queue.enqueue({
        type: OperationType.CREATE,
        entityType: EntityType.CHILD,
        data: {name: '测试孩子', grade: '一年级'},
        timestamp: Date.now(),
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_queue',
        expect.stringContaining('"type":"CREATE"')
      );
    });

    /**
     * 测试应用重启后队列恢复
     */
    it('should restore queue after app restart', async () => {
      const savedData = JSON.stringify([
        {
          id: 'op-1',
          type: 'CREATE',
          entityType: 'CHILD',
          data: {name: '测试孩子', grade: '一年级'},
          timestamp: 1000,
        },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(savedData);

      // 模拟应用重启：创建新实例
      const newQueue = new OfflineQueue();
      const operations = await newQueue.getAll();

      expect(operations).toHaveLength(1);
      expect(operations[0].data.name).toBe('测试孩子');
    });

    /**
     * 测试队列容量限制（1000条）
     */
    it('should enforce queue size limit (1000)', async () => {
      // 添加1001个操作
      for (let i = 0; i < 1001; i++) {
        await queue.enqueue({
          type: OperationType.CREATE,
          entityType: EntityType.STUDY_RECORD,
          data: {action: 'practice'},
          timestamp: Date.now() + i,
        });
      }

      const operations = await queue.getAll();
      expect(operations.length).toBeLessThanOrEqual(1000);
    });

    /**
     * 测试队列操作顺序保证
     */
    it('should maintain operation order', async () => {
      const timestamps: number[] = [];
      for (let i = 0; i < 5; i++) {
        const timestamp = Date.now() + i;
        await queue.enqueue({
          type: OperationType.CREATE,
          entityType: EntityType.CHILD,
          data: {name: `孩子${i}`},
          timestamp,
        });
        timestamps.push(timestamp);
      }

      const operations = await queue.getAll();
      for (let i = 0; i < operations.length; i++) {
        expect(operations[i].timestamp).toBe(timestamps[i]);
      }
    });
  });

  // ==================== Task 2.2: 网络切换测试 ====================

  describe('Task 2.2: Network Switching', () => {
    /**
     * 测试离线操作入队
     */
    it('should enqueue operations when offline', async () => {
      await queue.enqueue({
        type: OperationType.CREATE,
        entityType: EntityType.CHILD,
        data: {name: '离线孩子', grade: '一年级'},
        timestamp: Date.now(),
      });

      const operations = await queue.getAll();
      expect(operations).toHaveLength(1);
      expect(operations[0].data.name).toBe('离线孩子');
    });

    /**
     * 测试队列大小查询
     */
    it('should return correct queue size', async () => {
      expect(await queue.size()).toBe(0);

      await queue.enqueue({
        type: OperationType.CREATE,
        entityType: EntityType.CHILD,
        data: {name: '测试孩子', grade: '一年级'},
        timestamp: Date.now(),
      });

      expect(await queue.size()).toBe(1);
    });
  });

  // ==================== Task 2.3: 队列性能测试 ====================

  describe('Task 2.3: Queue Performance', () => {
    /**
     * 测试大量操作入队性能
     */
    it('should handle large number of operations efficiently', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await queue.enqueue({
          type: OperationType.CREATE,
          entityType: EntityType.STUDY_RECORD,
          data: {action: 'practice'},
          timestamp: Date.now() + i,
        });
      }

      const duration = Date.now() - startTime;

      // 应该在合理时间内完成（< 5秒）
      expect(duration).toBeLessThan(5000);
      expect(await queue.size()).toBe(100);
    });

    /**
     * 测试操作去重机制
     */
    it('should deduplicate operations with same entity', async () => {
      // 添加同一个孩子的两次更新操作
      await queue.enqueue({
        type: OperationType.UPDATE,
        entityType: EntityType.CHILD,
        data: {childId: 'child-1', name: '孩子1', grade: '一年级'},
        timestamp: 1000,
      });

      await queue.enqueue({
        type: OperationType.UPDATE,
        entityType: EntityType.CHILD,
        data: {childId: 'child-1', name: '孩子1', grade: '二年级'},
        timestamp: 2000,
      });

      const operations = await queue.getAll();
      // 应该只有一个操作（更新后的）
      expect(operations).toHaveLength(1);
      expect(operations[0].data.grade).toBe('二年级');
    });

    /**
     * 测试清空队列
     */
    it('should clear queue', async () => {
      await queue.enqueue({
        type: OperationType.CREATE,
        entityType: EntityType.CHILD,
        data: {name: '测试孩子', grade: '一年级'},
        timestamp: Date.now(),
      });

      expect(await queue.size()).toBe(1);

      await queue.clear();

      expect(await queue.size()).toBe(0);
    });

    /**
     * 测试移除已完成操作
     */
    it('should remove completed operations', async () => {
      await queue.enqueue({
        type: OperationType.CREATE,
        entityType: EntityType.CHILD,
        data: {name: '测试孩子', grade: '一年级'},
        timestamp: Date.now(),
      });

      const operations = await queue.getAll();
      const operationId = operations[0].id;

      await queue.remove([operationId]);

      expect(await queue.size()).toBe(0);
    });
  });

  // ==================== 额外测试 ====================

  describe('Additional Tests', () => {
    /**
     * 测试队列统计信息
     */
    it('should provide queue statistics', async () => {
      await queue.enqueue({
        type: OperationType.CREATE,
        entityType: EntityType.CHILD,
        data: {name: '孩子1', grade: '一年级'},
        timestamp: Date.now(),
      });

      await queue.enqueue({
        type: OperationType.UPDATE,
        entityType: EntityType.CHILD,
        data: {childId: 'child-2', name: '孩子2', grade: '二年级'},
        timestamp: Date.now(),
      });

      await queue.enqueue({
        type: OperationType.CREATE,
        entityType: EntityType.STUDY_RECORD,
        data: {action: 'practice'},
        timestamp: Date.now(),
      });

      const stats = await queue.getStats();

      expect(stats.totalSize).toBe(3);
      expect(stats.byType['CREATE']).toBe(2);
      expect(stats.byType['UPDATE']).toBe(1);
      expect(stats.byEntityType['child']).toBe(2);
      expect(stats.byEntityType['study_record']).toBe(1);
    });

    /**
     * 测试单例模式
     */
    it('should return the same instance', () => {
      const instance1 = OfflineQueue.getInstance();
      const instance2 = OfflineQueue.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
