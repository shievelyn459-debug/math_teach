/**
 * ConflictResolver - 冲突解决器
 *
 * Story 6.5: 离线同步与冲突解决
 *
 * 提供多种冲突解决策略：
 * - Last-Write-Wins (时间戳优先)
 * - Server-Wins (服务器优先)
 * - Client-Wins (客户端优先)
 * - Manual-Merge (手动合并)
 */

/**
 * 冲突解决策略
 */
export enum ConflictStrategy {
  LAST_WRITE_WINS = 'LAST_WRITE_WINS',
  SERVER_WINS = 'SERVER_WINS',
  CLIENT_WINS = 'CLIENT_WINS',
  MANUAL_MERGE = 'MANUAL_MERGE',
}

/**
 * 冲突数据
 */
export interface ConflictData {
  clientData: any;
  serverData: any;
  entityType: string;
  entityId: string;
}

/**
 * 冲突解决结果
 */
export interface ResolveResult {
  resolvedData: any;
  strategy: ConflictStrategy;
  requiresUserAction?: boolean;
}

/**
 * 冲突检测器接口
 */
export interface Conflict {
  entityType: string;
  entityId: string;
  clientData: any;
  serverData: any;
  conflictType: 'timestamp' | 'concurrent_update' | 'data_mismatch';
  detectedAt: number;
}

/**
 * 冲突解决器
 */
export class ConflictResolver {
  /**
   * 时间戳验证（防止伪造）
   */
  private isValidTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const maxFutureOffset = 60000; // 1分钟
    const maxPastOffset = 365 * 24 * 60 * 60 * 1000; // 1年

    return timestamp <= now + maxFutureOffset && timestamp >= now - maxPastOffset;
  }

  /**
   * 检测冲突
   * 比较客户端和服务器数据，判断是否存在冲突
   */
  detectConflict(
    clientData: any,
    serverData: any,
    entityType: string,
    entityId: string
  ): Conflict | null {
    // 获取时间戳
    const clientTimestamp = clientData?.timestamp || clientData?.updatedAt || 0;
    const serverTimestamp = serverData?.timestamp || serverData?.updatedAt || 0;

    // 检查是否同时被修改（时间戳差异小于1秒视为并发修改）
    const timeDiff = Math.abs(clientTimestamp - serverTimestamp);
    const isConcurrent = timeDiff < 1000 && clientTimestamp !== serverTimestamp;

    // 检查数据内容是否不同
    const hasDataMismatch = !this.isDataEqual(clientData, serverData);

    if (hasDataMismatch) {
      return {
        entityType,
        entityId,
        clientData,
        serverData,
        conflictType: isConcurrent ? 'concurrent_update' : 'timestamp',
        detectedAt: Date.now(),
      };
    }

    return null;
  }

  /**
   * 比较两个数据对象是否相等（只比较业务字段）
   */
  private isDataEqual(data1: any, data2: any): boolean {
    if (!data1 || !data2) {
      return data1 === data2;
    }

    // 比较关键字段
    const fieldsToCompare = ['name', 'grade', 'birthday', 'avatar', 'phone', 'language', 'difficulty'];

    for (const field of fieldsToCompare) {
      if (data1[field] !== data2[field]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Last-Write-Wins策略
   * 基于时间戳比较，选择最新的数据
   */
  resolveLastWriteWins(conflict: ConflictData): ResolveResult {
    const clientTimestamp = conflict.clientData?.timestamp || conflict.clientData?.updatedAt || 0;
    const serverTimestamp = conflict.serverData?.timestamp || conflict.serverData?.updatedAt || 0;

    // 验证时间戳
    const validClientTime = this.isValidTimestamp(clientTimestamp);
    const validServerTime = this.isValidTimestamp(serverTimestamp);

    if (!validClientTime && validServerTime) {
      console.log('[ConflictResolver] Client timestamp invalid, using server data');
      return {
        resolvedData: conflict.serverData,
        strategy: ConflictStrategy.LAST_WRITE_WINS,
      };
    }

    if (validClientTime && !validServerTime) {
      console.log('[ConflictResolver] Server timestamp invalid, using client data');
      return {
        resolvedData: conflict.clientData,
        strategy: ConflictStrategy.LAST_WRITE_WINS,
      };
    }

    // 比较时间戳
    if (clientTimestamp > serverTimestamp) {
      console.log(`[ConflictResolver] Client data is newer (${clientTimestamp} > ${serverTimestamp})`);
      return {
        resolvedData: conflict.clientData,
        strategy: ConflictStrategy.LAST_WRITE_WINS,
      };
    } else if (serverTimestamp > clientTimestamp) {
      console.log(`[ConflictResolver] Server data is newer (${serverTimestamp} > ${clientTimestamp})`);
      return {
        resolvedData: conflict.serverData,
        strategy: ConflictStrategy.LAST_WRITE_WINS,
      };
    } else {
      // 时间戳相同，默认服务器优先（稳定性）
      console.log('[ConflictResolver] Timestamps equal, defaulting to server data');
      return {
        resolvedData: conflict.serverData,
        strategy: ConflictStrategy.LAST_WRITE_WINS,
      };
    }
  }

  /**
   * Server-Wins策略
   * 始终使用服务器数据
   */
  resolveServerWins(conflict: ConflictData): ResolveResult {
    console.log('[ConflictResolver] Using server-wins strategy');
    return {
      resolvedData: conflict.serverData,
      strategy: ConflictStrategy.SERVER_WINS,
    };
  }

  /**
   * Client-Wins策略
   * 始终使用客户端数据
   */
  resolveClientWins(conflict: ConflictData): ResolveResult {
    console.log('[ConflictResolver] Using client-wins strategy');
    return {
      resolvedData: conflict.clientData,
      strategy: ConflictStrategy.CLIENT_WINS,
    };
  }

  /**
   * Manual-Merge策略
   * 需要用户手动解决冲突
   */
  resolveManualMerge(conflict: ConflictData): ResolveResult {
    console.log('[ConflictResolver] Conflict requires manual resolution');
    return {
      resolvedData: null, // 需要用户决策
      strategy: ConflictStrategy.MANUAL_MERGE,
      requiresUserAction: true,
    };
  }

  /**
   * 自动解决冲突
   * 根据指定策略自动解决冲突
   */
  autoResolve(
    conflict: ConflictData,
    strategy: ConflictStrategy
  ): ResolveResult {
    switch (strategy) {
      case ConflictStrategy.LAST_WRITE_WINS:
        return this.resolveLastWriteWins(conflict);
      case ConflictStrategy.SERVER_WINS:
        return this.resolveServerWins(conflict);
      case ConflictStrategy.CLIENT_WINS:
        return this.resolveClientWins(conflict);
      case ConflictStrategy.MANUAL_MERGE:
        return this.resolveManualMerge(conflict);
      default:
        console.warn(`[ConflictResolver] Unknown strategy: ${strategy}, using LWW`);
        return this.resolveLastWriteWins(conflict);
    }
  }

  /**
   * 批量检测冲突
   */
  detectConflicts(operations: Array<{
    clientData: any;
    serverData: any;
    entityType: string;
    entityId: string;
  }>): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const op of operations) {
      const conflict = this.detectConflict(
        op.clientData,
        op.serverData,
        op.entityType,
        op.entityId
      );

      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  /**
   * 根据实体类型选择默认策略
   */
  getDefaultStrategy(entityType: string): ConflictStrategy {
    // 对于用户个人资料，默认客户端优先
    if (entityType === 'user') {
      return ConflictStrategy.CLIENT_WINS;
    }

    // 对于孩子数据，默认时间戳优先
    if (entityType === 'child') {
      return ConflictStrategy.LAST_WRITE_WINS;
    }

    // 对于学习记录，默认服务器优先（记录不修改）
    if (entityType === 'study_record') {
      return ConflictStrategy.SERVER_WINS;
    }

    // 默认使用Last-Write-Wins
    return ConflictStrategy.LAST_WRITE_WINS;
  }
}

// 导出单例
export const conflictResolver = new ConflictResolver();
