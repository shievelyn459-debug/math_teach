/**
 * offlineStudyQueue 测试
 *
 * Story 6-4: 离线学习记录队列
 * 测试离线队列的入队、同步和重试机制
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineStudyQueue } from '../offlineStudyQueue';
import { studyDataRepository } from '../mysql/StudyDataRepository';
import { checkDatabaseConnection } from '../mysql/prismaClient';
import { Action } from '@prisma/client';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../mysql/StudyDataRepository');
jest.mock('../mysql/prismaClient');

describe('offlineStudyQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== enqueue 测试 ====================

  describe('enqueue', () => {
    it('应该成功将记录加入队列', async () => {
      const recordData = {
        recordId: 'record-1',
        childId: 'child-1',
        parentId: 'user-1',
        action: Action.upload,
        duration: 120,
        correct: true,
        questionType: 'addition',
        difficulty: 'easy',
      };

      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue('[]');
      jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue();

      await offlineStudyQueue.enqueue(recordData);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const queueData = JSON.parse(callArgs[1]);
      expect(queueData).toHaveLength(1);
      expect(queueData[0].recordId).toBe('record-1');
    });

    it('应该限制队列大小（最多500条）', async () => {
      const existingQueue = Array.from({ length: 500 }, (_, i) => ({
        recordId: `record-${i}`,
        childId: 'child-1',
        parentId: 'user-1',
        action: Action.upload,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      }));

      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(JSON.stringify(existingQueue));
      jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue();

      await offlineStudyQueue.enqueue({
        recordId: 'record-501',
        childId: 'child-1',
        parentId: 'user-1',
        action: Action.upload,
      });

      const callArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const queueData = JSON.parse(callArgs[1]);
      expect(queueData).toHaveLength(500);
    });
  });

  // ==================== getQueue 测试 ====================

  describe('getQueue', () => {
    it('应该返回队列中的所有记录', async () => {
      const mockQueue = [
        {
          recordId: 'record-1',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.upload,
          timestamp: '2024-01-01T00:00:00.000Z',
          retryCount: 0,
        },
        {
          recordId: 'record-2',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.practice,
          timestamp: '2024-01-01T01:00:00.000Z',
          retryCount: 1,
        },
      ];

      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(JSON.stringify(mockQueue));

      const queue = await offlineStudyQueue.getQueue();

      expect(queue).toEqual(mockQueue);
      expect(queue).toHaveLength(2);
    });

    it('应该处理损坏的队列数据', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue('invalid json');
      jest.spyOn(AsyncStorage, 'removeItem').mockResolvedValue();

      const queue = await offlineStudyQueue.getQueue();

      expect(queue).toEqual([]);
    });

    it('应该在没有队列数据时返回空数组', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null);

      const queue = await offlineStudyQueue.getQueue();

      expect(queue).toEqual([]);
    });
  });

  // ==================== getQueueSize 测试 ====================

  describe('getQueueSize', () => {
    it('应该返回队列中的记录数量', async () => {
      const mockQueue = [
        {
          recordId: 'record-1',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.upload,
          timestamp: '2024-01-01T00:00:00.000Z',
          retryCount: 0,
        },
        {
          recordId: 'record-2',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.practice,
          timestamp: '2024-01-01T01:00:00.000Z',
          retryCount: 1,
        },
        {
          recordId: 'record-3',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.review,
          timestamp: '2024-01-01T02:00:00.000Z',
          retryCount: 0,
        },
      ];

      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(JSON.stringify(mockQueue));

      const size = await offlineStudyQueue.getQueueSize();

      expect(size).toBe(3);
    });

    it('应该在队列为空时返回0', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null);

      const size = await offlineStudyQueue.getQueueSize();

      expect(size).toBe(0);
    });
  });

  // ==================== syncQueue 测试 ====================

  describe('syncQueue', () => {
    it('应该成功同步队列中的所有记录到MySQL', async () => {
      const mockQueue = [
        {
          recordId: 'record-1',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.upload,
          duration: 120,
          correct: true,
          questionType: 'addition',
          difficulty: 'easy',
          timestamp: '2024-01-01T00:00:00.000Z',
          retryCount: 0,
        },
        {
          recordId: 'record-2',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.practice,
          duration: 90,
          correct: false,
          questionType: 'subtraction',
          difficulty: 'medium',
          timestamp: '2024-01-01T01:00:00.000Z',
          retryCount: 0,
        },
      ];

      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(JSON.stringify(mockQueue));
      (studyDataRepository.create as jest.Mock).mockResolvedValue({} as any);
      jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue();

      const result = await offlineStudyQueue.syncQueue();

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(studyDataRepository.create).toHaveBeenCalledTimes(2);
    });

    it('应该在MySQL不可用时跳过同步', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(false);

      const result = await offlineStudyQueue.syncQueue();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(studyDataRepository.create).not.toHaveBeenCalled();
    });

    it('应该处理同步失败并重试', async () => {
      const mockQueue = [
        {
          recordId: 'record-1',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.upload,
          duration: 120,
          correct: true,
          timestamp: '2024-01-01T00:00:00.000Z',
          retryCount: 0,
        },
        {
          recordId: 'record-2',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.practice,
          duration: 90,
          correct: false,
          timestamp: '2024-01-01T01:00:00.000Z',
          retryCount: 2,
        },
      ];

      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(JSON.stringify(mockQueue));
      (studyDataRepository.create as jest.Mock)
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('Database error'));
      jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue();

      const result = await offlineStudyQueue.syncQueue();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1); // retryCount从2增加到3，达到maxRetries限制
    });

    it('应该移除达到最大重试次数的记录', async () => {
      const mockQueue = [
        {
          recordId: 'record-1',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.upload,
          duration: 120,
          correct: true,
          timestamp: '2024-01-01T00:00:00.000Z',
          retryCount: 3,
        },
      ];

      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(JSON.stringify(mockQueue));
      (studyDataRepository.create as jest.Mock).mockRejectedValue(new Error('Database error'));
      jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue();

      const result = await offlineStudyQueue.syncQueue();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('应该防止并发同步', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue('[]');

      const promise1 = offlineStudyQueue.syncQueue();
      const promise2 = offlineStudyQueue.syncQueue();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.synced).toBe(0);
      expect(result2.synced).toBe(0);
    });
  });

  // ==================== clearQueue 测试 ====================

  describe('clearQueue', () => {
    it('应该成功清空队列', async () => {
      jest.spyOn(AsyncStorage, 'removeItem').mockResolvedValue();

      await offlineStudyQueue.clearQueue();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@study_offline_queue');
    });
  });

  // ==================== getQueueStats 测试 ====================

  describe('getQueueStats', () => {
    it('应该返回队列统计信息', async () => {
      const mockQueue = [
        {
          recordId: 'record-1',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.upload,
          timestamp: '2024-01-01T00:00:00.000Z',
          retryCount: 0,
        },
        {
          recordId: 'record-2',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.practice,
          timestamp: '2024-01-01T01:00:00.000Z',
          retryCount: 1,
        },
        {
          recordId: 'record-3',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.review,
          timestamp: '2024-01-01T02:00:00.000Z',
          retryCount: 1,
        },
        {
          recordId: 'record-4',
          childId: 'child-1',
          parentId: 'user-1',
          action: Action.upload,
          timestamp: '2024-01-01T03:00:00.000Z',
          retryCount: 2,
        },
      ];

      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(JSON.stringify(mockQueue));

      const stats = await offlineStudyQueue.getQueueStats();

      expect(stats.total).toBe(4);
      expect(stats.byRetryCount[0]).toBe(1);
      expect(stats.byRetryCount[1]).toBe(2);
      expect(stats.byRetryCount[2]).toBe(1);
    });

    it('应该在队列为空时返回零统计', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null);

      const stats = await offlineStudyQueue.getQueueStats();

      expect(stats.total).toBe(0);
      expect(stats.byRetryCount).toEqual({});
    });
  });
});
