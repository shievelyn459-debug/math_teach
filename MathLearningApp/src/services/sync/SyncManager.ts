/**
 * SyncManager - 同步管理器
 *
 * Story 6.5: 离线同步与冲突解决
 *
 * 核心同步服务，提供：
 * - 网络状态检测
 * - 操作路由（在线→MySQL, 离线→队列）
 * - 自动同步触发
 * - 冲突检测和解决
 * - 同步状态管理
 */

import NetInfo from '@react-native-community/netinfo';
import {OfflineQueue, OperationType, EntityType, OfflineOperation} from './OfflineQueue';
import {ConflictResolver, ConflictStrategy, ConflictData} from './ConflictResolver';
import {userDataRepository} from '../mysql/UserDataRepository';
import {ChildDataRepository} from '../mysql/ChildDataRepository';
import {StudyDataRepository} from '../mysql/StudyDataRepository';
import {logger} from '../../utils/logger';

/**
 * 同步状态
 */
export interface SyncStatus {
  isOnline: boolean;
  pendingOperations: number;
  lastSyncTime: number | null;
  syncInProgress: boolean;
  lastSyncError?: string;
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  errors: Array<{operationId: string; error: string}>;
}

/**
 * 同步管理器
 */
export class SyncManager {
  private static instance: SyncManager;
  private offlineQueue: OfflineQueue;
  private conflictResolver: ConflictResolver;
  private childDataRepository: ChildDataRepository;
  private studyDataRepository: StudyDataRepository;
  private syncInProgress = false;
  private netInfoUnsubscribe: any;
  private lastSyncTime: number | null = null;
  private lastSyncError: string | undefined;
  private isOnlineFlag = true;

  private constructor() {
    this.offlineQueue = OfflineQueue.getInstance();
    this.conflictResolver = new ConflictResolver();
    this.childDataRepository = new ChildDataRepository();
    this.studyDataRepository = new StudyDataRepository();
    this.initNetworkListener();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * 初始化网络监听
   */
  private initNetworkListener(): void {
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnlineFlag;
      this.isOnlineFlag = state.isConnected === true;

      if (this.isOnlineFlag && wasOffline) {
        logger.info('SyncManager', 'Network connected, starting auto sync...');
        this.onNetworkConnected().catch(error => {
          logger.error('SyncManager', 'Auto sync failed', error as Error);
        });
      } else if (!this.isOnlineFlag && wasOffline) {
        logger.info('SyncManager', 'Network disconnected, enabling offline mode');
        this.onNetworkDisconnected();
      }
    });
  }

  /**
   * 检查网络状态
   */
  public async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isOnlineFlag = state.isConnected === true;
      return this.isOnlineFlag;
    } catch (error) {
      logger.error('SyncManager', 'Failed to check network status', error as Error);
      // 假设离线
      this.isOnlineFlag = false;
      return false;
    }
  }

  /**
   * 网络连接事件
   */
  public async onNetworkConnected(): Promise<void> {
    logger.info('SyncManager', 'Network connected, starting sync...');
    await this.syncPendingOperations();
  }

  /**
   * 网络断开事件
   */
  public async onNetworkDisconnected(): Promise<void> {
    logger.info('SyncManager', 'Network disconnected, enabling offline mode');
  }

  /**
   * 入队操作（自动路由）
   * 在线时直接同步，离线时加入队列
   */
  public async enqueueOperation(operation: {
    type: OperationType;
    entityType: EntityType;
    data: any;
  }): Promise<void> {
    const isOnline = await this.isOnline();

    if (isOnline && !this.syncInProgress) {
      // 在线模式：直接同步
      try {
        await this.syncOperation(operation);
        logger.info('SyncManager', 'Operation synced immediately (online mode)');
      } catch (error) {
        // 同步失败，加入队列
        logger.warn('SyncManager', 'Immediate sync failed, queuing operation', error as Error);
        await this.offlineQueue.enqueue({
          ...operation,
          timestamp: Date.now(),
        });
      }
    } else {
      // 离线模式或同步进行中：入队
      await this.offlineQueue.enqueue({
        ...operation,
        timestamp: Date.now(),
      });
      logger.info('SyncManager', 'Operation enqueued (offline mode)');
    }
  }

  /**
   * 同步单个操作
   */
  private async syncOperation(operation: OfflineOperation): Promise<void> {
    const {type, entityType, data} = operation;

    try {
      switch (entityType) {
        case EntityType.USER:
          await this.syncUserOperation(type, data);
          break;
        case EntityType.CHILD:
          await this.syncChildOperation(type, data);
          break;
        case EntityType.STUDY_RECORD:
          await this.syncStudyRecordOperation(type, data);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
    } catch (error) {
      logger.error('SyncManager', `Failed to sync operation ${operation.id}`, error as Error);
      throw error;
    }
  }

  /**
   * 同步用户操作
   */
  private async syncUserOperation(type: OperationType, data: any): Promise<void> {
    switch (type) {
      case OperationType.CREATE:
        await userDataRepository.create(data);
        break;
      case OperationType.UPDATE:
        await userDataRepository.update(data.userId || data.id, data);
        break;
      case OperationType.DELETE:
        await userDataRepository.delete(data.userId || data.id);
        break;
    }
  }

  /**
   * 同步孩子操作
   */
  private async syncChildOperation(type: OperationType, data: any): Promise<void> {
    const parentId = data.parentId;
    const childId = data.childId || data.id;

    switch (type) {
      case OperationType.CREATE:
        await this.childDataRepository.create(parentId, data);
        break;
      case OperationType.UPDATE:
        await this.childDataRepository.update(childId, data);
        break;
      case OperationType.DELETE:
        await this.childDataRepository.delete(childId);
        break;
    }
  }

  /**
   * 同步学习记录操作
   */
  private async syncStudyRecordOperation(type: OperationType, data: any): Promise<void> {
    switch (type) {
      case OperationType.CREATE:
        await this.studyDataRepository.create(data);
        break;
      case OperationType.UPDATE:
        // 学习记录通常不更新，而是创建新记录
        logger.warn('SyncManager', 'Study record update not supported, skipping');
        break;
      case OperationType.DELETE:
        await this.studyDataRepository.delete(data.recordId || data.id);
        break;
    }
  }

  /**
   * 同步所有待处理操作
   */
  public async syncPendingOperations(): Promise<SyncResult> {
    if (this.syncInProgress) {
      logger.info('SyncManager', 'Sync already in progress, skipping');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflictCount: 0,
        errors: [{operationId: 'sync', error: 'Sync already in progress'}],
      };
    }

    // 检查网络状态
    const isOnline = await this.isOnline();
    if (!isOnline) {
      logger.warn('SyncManager', 'Cannot sync: network is offline');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflictCount: 0,
        errors: [{operationId: 'sync', error: 'Network is offline'}],
      };
    }

    this.syncInProgress = true;
    this.lastSyncError = undefined;

    logger.info('SyncManager', 'Starting sync...');

    const operations = await this.offlineQueue.getAll();
    logger.info('SyncManager', `Found ${operations.length} operations to sync`);

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflictCount: 0,
      errors: [],
    };

    const completedIds: string[] = [];

    try {
      for (const operation of operations) {
        try {
          await this.syncOperation(operation);
          completedIds.push(operation.id);
          result.syncedCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.failedCount++;
          result.errors.push({operationId: operation.id, error: errorMsg});
          logger.error(`SyncManager`, `Failed to sync operation ${operation.id}`, error as Error);
        }
      }

      // 清理已完成的操作
      if (completedIds.length > 0) {
        await this.offlineQueue.remove(completedIds);
        logger.info('SyncManager', `Synced ${completedIds.length} operations`);
      }

      if (result.failedCount > 0) {
        result.success = false;
        this.lastSyncError = `${result.failedCount} operations failed to sync`;
      }

      this.lastSyncTime = Date.now();
    } catch (error) {
      result.success = false;
      this.lastSyncError = error instanceof Error ? error.message : String(error);
      logger.error('SyncManager', 'Sync failed', error as Error);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * 获取同步状态
   */
  public async getSyncStatus(): Promise<SyncStatus> {
    const isOnline = await this.isOnline();
    const pendingOperations = await this.offlineQueue.size();

    return {
      isOnline,
      pendingOperations,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      lastSyncError: this.lastSyncError,
    };
  }

  /**
   * 获取待同步操作
   */
  public async getPendingOperations(): Promise<OfflineOperation[]> {
    return this.offlineQueue.getAll();
  }

  /**
   * 强制同步（忽略当前状态）
   */
  public async forceSync(): Promise<SyncResult> {
    // 重置同步锁
    this.syncInProgress = false;
    return this.syncPendingOperations();
  }

  /**
   * 清空队列（危险操作，仅用于调试）
   */
  public async clearQueue(): Promise<void> {
    await this.offlineQueue.clear();
    logger.warn('SyncManager', 'Queue cleared (manual operation)');
  }

  /**
   * 获取队列统计信息
   */
  public async getQueueStats(): Promise<{
    totalSize: number;
    byType: Record<string, number>;
    byEntityType: Record<string, number>;
  }> {
    return this.offlineQueue.getStats();
  }

  /**
   * 销毁
   */
  public destroy(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
  }
}

// 导出单例
export const syncManager = SyncManager.getInstance();
