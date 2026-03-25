/**
 * OfflineQueue - 离线操作队列
 *
 * Story 6.5: 离线同步与冲突解决
 *
 * 提供离线操作的持久化队列，支持：
 * - 操作持久化到AsyncStorage
 * - 应用重启后队列恢复
 * - 容量限制（1000条）
 * - 操作顺序保证
 * - 去重机制
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 离线操作类型
 */
export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * 实体类型
 */
export enum EntityType {
  USER = 'user',
  CHILD = 'child',
  STUDY_RECORD = 'study_record',
}

/**
 * 离线操作接口
 */
export interface OfflineOperation {
  id: string;
  type: OperationType;
  entityType: EntityType;
  data: any;
  timestamp: number;
}

/**
 * 离线操作队列
 */
export class OfflineQueue {
  private static instance: OfflineQueue;
  private readonly STORAGE_KEY = '@offline_queue';
  private readonly MAX_QUEUE_SIZE = 1000;
  private queue: OfflineOperation[] = [];
  private initialized = false;

  private constructor() {}

  public static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  /**
   * 生成安全的操作ID
   */
  private generateOperationId(): string {
    const array = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }

    const hex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return `op_${Date.now()}_${hex}`;
  }

  /**
   * 从AsyncStorage加载队列
   */
  private async loadQueue(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
        console.log(`[OfflineQueue] Loaded ${this.queue.length} operations from storage`);
      } else {
        this.queue = [];
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
      this.queue = [];
    } finally {
      this.initialized = true;
    }
  }

  /**
   * 保存队列到AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
      throw new Error('Failed to persist offline queue');
    }
  }

  /**
   * 获取实体的唯一标识符
   */
  private getEntityId(operation: OfflineOperation): string | undefined {
    // 从操作数据中提取ID
    if (operation.type === OperationType.CREATE) {
      // 创建操作可能还没有ID，使用临时标识
      return operation.data?.tempId;
    } else {
      // 更新和删除操作应该有ID
      return operation.data?.userId || operation.data?.childId || operation.data?.recordId;
    }
  }

  /**
   * 添加操作到队列
   * 支持去重：相同实体类型的操作会合并
   */
  public async enqueue(operation: Omit<OfflineOperation, 'id'>): Promise<string> {
    await this.loadQueue();

    const newOperation: OfflineOperation = {
      ...operation,
      id: this.generateOperationId(),
    };

    // 检查是否已存在相同实体的操作（去重）
    const entityId = this.getEntityId(newOperation);

    if (entityId) {
      const existingIndex = this.queue.findIndex(
        op => op.entityType === newOperation.entityType &&
        this.getEntityId(op) === entityId
      );

      if (existingIndex >= 0) {
        // 更新现有操作（保留新的时间戳和数据）
        console.log(`[OfflineQueue] Updating existing operation for entity: ${entityId}`);
        this.queue[existingIndex] = {
          ...this.queue[existingIndex],
          data: newOperation.data,
          timestamp: newOperation.timestamp,
        };
      } else {
        // 添加新操作
        this.queue.push(newOperation);
      }
    } else {
      // 没有ID的操作直接添加
      this.queue.push(newOperation);
    }

    // 按时间戳排序（升序）
    this.queue.sort((a, b) => a.timestamp - b.timestamp);

    // 容量限制：保留最新的MAX_QUEUE_SIZE条
    if (this.queue.length > this.MAX_QUEUE_SIZE) {
      const removed = this.queue.length - this.MAX_QUEUE_SIZE;
      this.queue = this.queue.slice(-this.MAX_QUEUE_SIZE);
      console.warn(`[OfflineQueue] Queue size exceeded, removed ${removed} oldest operations`);
    }

    await this.saveQueue();
    console.log(`[OfflineQueue] Enqueued operation ${newOperation.id}, queue size: ${this.queue.length}`);

    return newOperation.id;
  }

  /**
   * 获取所有待同步操作
   */
  public async getAll(): Promise<OfflineOperation[]> {
    await this.loadQueue();
    return [...this.queue];
  }

  /**
   * 获取队列大小
   */
  public async size(): Promise<number> {
    await this.loadQueue();
    return this.queue.length;
  }

  /**
   * 清空队列
   */
  public async clear(): Promise<void> {
    await this.loadQueue();
    this.queue = [];
    await this.saveQueue();
    console.log('[OfflineQueue] Queue cleared');
  }

  /**
   * 移除已完成的操作
   */
  public async remove(operationIds: string[]): Promise<void> {
    await this.loadQueue();
    const beforeSize = this.queue.length;
    this.queue = this.queue.filter(op => !operationIds.includes(op.id));
    const removed = beforeSize - this.queue.length;

    if (removed > 0) {
      await this.saveQueue();
      console.log(`[OfflineQueue] Removed ${removed} completed operations`);
    }
  }

  /**
   * 获取队列统计信息
   */
  public async getStats(): Promise<{
    totalSize: number;
    byType: Record<string, number>;
    byEntityType: Record<string, number>;
  }> {
    await this.loadQueue();

    const byType: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};

    for (const op of this.queue) {
      byType[op.type] = (byType[op.type] || 0) + 1;
      byEntityType[op.entityType] = (byEntityType[op.entityType] || 0) + 1;
    }

    return {
      totalSize: this.queue.length,
      byType,
      byEntityType,
    };
  }

  /**
   * 重置队列（用于测试）
   */
  public async reset(): Promise<void> {
    this.initialized = false;
    this.queue = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }
}

// 导出单例
export const offlineQueue = OfflineQueue.getInstance();
