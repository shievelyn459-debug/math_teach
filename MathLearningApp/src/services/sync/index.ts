/**
 * Sync Services Index
 *
 * 导出所有同步服务和类型
 * Story 6.5: 离线同步与冲突解决
 */

// OfflineQueue
export {
  OfflineQueue,
  offlineQueue,
  OperationType,
  EntityType,
  type OfflineOperation,
} from './OfflineQueue';

// ConflictResolver
export {
  ConflictResolver,
  conflictResolver,
  ConflictStrategy,
  type ConflictData,
  type ResolveResult,
  type Conflict,
} from './ConflictResolver';

// SyncManager
export {
  SyncManager,
  syncManager,
  type SyncStatus,
  type SyncResult,
} from './SyncManager';
