/**
 * Offline Study Record Queue
 *
 * Story 6-4 Code Review Fix: 离线队列机制
 *
 * 当MySQL不可用时，将学习记录加入队列
 * 网络恢复后自动同步队列中的记录
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { studyDataRepository } from './mysql/StudyDataRepository';
import { checkDatabaseConnection } from './mysql/prismaClient';
import { logger } from '../utils/logger';
import { Action } from '@prisma/client';

const QUEUE_KEY = '@study_offline_queue';

/**
 * 队列中的记录
 */
interface QueuedRecord {
  recordId: string;
  childId: string;
  parentId: string;
  questionId?: string;
  action: Action;
  duration?: number;
  correct?: boolean;
  questionType?: string;
  difficulty?: string;
  timestamp: string;
  retryCount: number;
}

/**
 * 离线学习记录队列服务
 */
class OfflineStudyQueue {
  private maxRetries = 3;
  private syncInProgress = false;

  /**
   * 将记录加入离线队列
   */
  async enqueue(data: {
    recordId: string;
    childId: string;
    parentId: string;
    questionId?: string;
    action: Action;
    duration?: number;
    correct?: boolean;
    questionType?: string;
    difficulty?: string;
  }): Promise<void> {
    try {
      const queue = await this.getQueue();
      const queuedRecord: QueuedRecord = {
        ...data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      queue.push(queuedRecord);

      // 限制队列大小（最多保留500条待同步记录）
      if (queue.length > 500) {
        queue.splice(0, queue.length - 500);
      }

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      logger.info('OfflineStudyQueue', `Record added to queue: ${data.recordId}`);
    } catch (error) {
      logger.error('OfflineStudyQueue', 'Failed to enqueue record', error as Error);
      throw error;
    }
  }

  /**
   * 获取队列中的所有记录
   */
  async getQueue(): Promise<QueuedRecord[]> {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (!queueData) {
        return [];
      }

      // 处理损坏的队列数据
      try {
        return JSON.parse(queueData);
      } catch (parseError) {
        logger.warn('OfflineStudyQueue', 'Corrupted queue data, resetting');
        await AsyncStorage.removeItem(QUEUE_KEY);
        return [];
      }
    } catch (error) {
      logger.error('OfflineStudyQueue', 'Failed to get queue', error as Error);
      return [];
    }
  }

  /**
   * 获取队列中的记录数量
   */
  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * 同步队列中的记录到MySQL
   *
   * @returns 同步成功的记录数量
   */
  async syncQueue(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress) {
      logger.warn('OfflineStudyQueue', 'Sync already in progress, skipping');
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;

    try {
      // 检查MySQL是否可用
      const isMySQLAvailable = await checkDatabaseConnection();
      if (!isMySQLAvailable) {
        logger.info('OfflineStudyQueue', 'MySQL unavailable, skipping sync');
        return { synced: 0, failed: 0 };
      }

      const queue = await this.getQueue();
      if (queue.length === 0) {
        return { synced: 0, failed: 0 };
      }

      logger.info('OfflineStudyQueue', `Starting sync of ${queue.length} records`);

      let synced = 0;
      let failed = 0;
      const syncedRecordIds: string[] = [];
      const failedRecordIds: string[] = [];

      for (const record of queue) {
        try {
          await studyDataRepository.create({
            recordId: record.recordId,
            childId: record.childId,
            parentId: record.parentId,
            questionId: record.questionId,
            action: record.action,
            duration: record.duration,
            correct: record.correct,
            questionType: record.questionType,
            difficulty: record.difficulty,
          });

          syncedRecordIds.push(record.recordId);
          synced++;
          logger.info('OfflineStudyQueue', `Synced record: ${record.recordId}`);
        } catch (error) {
          record.retryCount++;
          if (record.retryCount >= this.maxRetries) {
            logger.error('OfflineStudyQueue', `Record failed after ${this.maxRetries} retries: ${record.recordId}`, error as Error);
            failedRecordIds.push(record.recordId);
            failed++;
          } else {
            logger.warn('OfflineStudyQueue', `Record sync failed, will retry: ${record.recordId}`, error as Error);
          }
        }
      }

      // 更新队列：移除已同步的记录和达到最大重试次数的记录
      const updatedQueue = queue.filter(record => {
        const wasSynced = syncedRecordIds.includes(record.recordId);
        const shouldGiveUp = failedRecordIds.includes(record.recordId);
        return !wasSynced && !shouldGiveUp;
      });

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));

      logger.info('OfflineStudyQueue', `Sync complete: ${synced} synced, ${failed} failed, ${updatedQueue.length} remaining`);
      return { synced, failed };
    } catch (error) {
      logger.error('OfflineStudyQueue', 'Sync failed', error as Error);
      return { synced: 0, failed: 0 };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 清空队列
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
    logger.info('OfflineStudyQueue', 'Queue cleared');
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats(): Promise<{ total: number; byRetryCount: Record<number, number> }> {
    const queue = await this.getQueue();
    const byRetryCount: Record<number, number> = {};

    for (const record of queue) {
      const retryCount = record.retryCount;
      byRetryCount[retryCount] = (byRetryCount[retryCount] || 0) + 1;
    }

    return {
      total: queue.length,
      byRetryCount,
    };
  }
}

/**
 * 导出单例实例
 */
export const offlineStudyQueue = new OfflineStudyQueue();
