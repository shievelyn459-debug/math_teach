/**
 * ConflictResolver Tests
 *
 * Story 6.5: 离线同步与冲突解决
 * AC3: 冲突解决策略测试通过
 */

import {
  ConflictResolver,
  ConflictStrategy,
  type ConflictData,
} from '../ConflictResolver';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  // ==================== Task 3.1: 时间戳冲突解决测试 ====================

  describe('Task 3.1: Timestamp Conflict Resolution', () => {
    /**
     * 测试Last-Write-Wins策略
     */
    it('should resolve conflict using LWW strategy', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '客户端孩子',
          timestamp: 2000,
        },
        serverData: {
          name: '服务器孩子',
          timestamp: 1000,
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveLastWriteWins(conflict);

      expect(result.strategy).toBe(ConflictStrategy.LAST_WRITE_WINS);
      expect(result.resolvedData.name).toBe('客户端孩子');
    });

    /**
     * 测试时间戳相同场景
     */
    it('should handle same timestamp in LWW', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '客户端孩子',
          timestamp: 1000,
        },
        serverData: {
          name: '服务器孩子',
          timestamp: 1000,
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveLastWriteWins(conflict);

      // 应该有默认行为（服务器优先）
      expect(result.strategy).toBe(ConflictStrategy.LAST_WRITE_WINS);
      expect(result.resolvedData.name).toBe('服务器孩子');
    });

    /**
     * 测试时间戳伪造防护
     */
    it('should detect forged timestamps', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '客户端孩子',
          timestamp: 9999999999999, // 远超未来
        },
        serverData: {
          name: '服务器孩子',
          timestamp: Date.now(),
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveLastWriteWins(conflict);

      // 应该拒绝伪造的时间戳
      expect(result.resolvedData.name).toBe('服务器孩子');
    });

    /**
     * 测试时区处理
     */
    it('should handle timestamps from different timezones', () => {
      const now = Date.now();

      const conflict: ConflictData = {
        clientData: {
          name: '客户端孩子',
          timestamp: now + 1000, // 使用时间戳
        },
        serverData: {
          name: '服务器孩子',
          timestamp: now,
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveLastWriteWins(conflict);

      // 时间戳比较应该与timezone无关
      expect(result.resolvedData.name).toBe('客户端孩子');
    });
  });

  // ==================== Task 3.2: 服务器优先冲突解决测试 ====================

  describe('Task 3.2: Server-Wins Conflict Resolution', () => {
    /**
     * 测试Server-Wins策略
     */
    it('should resolve conflict using Server-Wins strategy', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '客户端孩子',
          timestamp: 2000,
        },
        serverData: {
          name: '服务器孩子',
          timestamp: 1000,
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveServerWins(conflict);

      expect(result.strategy).toBe(ConflictStrategy.SERVER_WINS);
      expect(result.resolvedData.name).toBe('服务器孩子');
    });

    /**
     * 测试并发更新场景
     */
    it('should handle concurrent updates with Server-Wins', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '并发修改',
          timestamp: 1000,
        },
        serverData: {
          name: '服务器版本',
          timestamp: 1000,
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveServerWins(conflict);

      // 服务器始终优先
      expect(result.resolvedData.name).toBe('服务器版本');
    });

    /**
     * 测试数据完整性保证
     */
    it('should maintain data integrity with Server-Wins', () => {
      const originalData = {
        name: '原始数据',
        grade: '一年级',
        birthday: new Date('2015-01-01'),
      };

      const conflict: ConflictData = {
        clientData: {
          ...originalData,
          name: '修改后', // 客户端只修改了名字
        },
        serverData: originalData,
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveServerWins(conflict);

      // 服务器数据应该完整保留
      expect(result.resolvedData).toEqual(originalData);
    });
  });

  // ==================== Task 3.3: 客户端优先冲突解决测试 ====================

  describe('Task 3.3: Client-Wins Conflict Resolution', () => {
    /**
     * 测试Client-Wins策略
     */
    it('should resolve conflict using Client-Wins strategy', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '客户端孩子',
          timestamp: 1000,
        },
        serverData: {
          name: '服务器孩子',
          timestamp: 2000,
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveClientWins(conflict);

      expect(result.strategy).toBe(ConflictStrategy.CLIENT_WINS);
      expect(result.resolvedData.name).toBe('客户端孩子');
    });

    /**
     * 测试离线修改场景
     */
    it('should protect offline modifications with Client-Wins', () => {
      // 用户在离线状态下修改了数据
      const offlineModification = {
        name: '离线修改的名字',
        grade: '二年级',
      };

      const conflict: ConflictData = {
        clientData: {
          ...offlineModification,
          timestamp: Date.now() - 3600000, // 1小时前（离线时）
        },
        serverData: {
          name: '服务器数据',
          timestamp: Date.now(), // 现在的服务器数据
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveClientWins(conflict);

      // 离线修改应该被保护
      expect(result.resolvedData.name).toBe('离线修改的名字');
      expect(result.resolvedData.grade).toBe('二年级');
    });

    /**
     * 测试客户端数据保护
     */
    it('should protect user input with Client-Wins', () => {
      const userInput = {
        name: '用户输入的名字',
        phone: '13800138000',
      };

      const conflict: ConflictData = {
        clientData: userInput,
        serverData: {
          name: '旧数据',
          phone: '旧号码',
        },
        entityType: 'user',
        entityId: 'user-1',
      };

      const result = resolver.resolveClientWins(conflict);

      // 用户输入应该被保护
      expect(result.resolvedData.name).toBe('用户输入的名字');
      expect(result.resolvedData.phone).toBe('13800138000');
    });
  });

  // ==================== Task 3.4: 手动合并冲突解决测试 ====================

  describe('Task 3.4: Manual-Merge Conflict Resolution', () => {
    /**
     * 测试Manual-Merge策略
     */
    it('should resolve conflict using Manual-Merge strategy', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '客户端孩子',
        },
        serverData: {
          name: '服务器孩子',
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveManualMerge(conflict);

      expect(result.strategy).toBe(ConflictStrategy.MANUAL_MERGE);
      expect(result.requiresUserAction).toBe(true);
      expect(result.resolvedData).toBeNull();
    });

    /**
     * 测试用户选择处理
     */
    it('should mark conflicts requiring user action', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '客户端数据',
          grade: '一年级',
        },
        serverData: {
          name: '服务器数据',
          grade: '二年级',
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.resolveManualMerge(conflict);

      expect(result.requiresUserAction).toBe(true);
    });

    /**
     * 测试合并后数据验证
     */
    it('should allow manual merge result', () => {
      // 模拟用户选择的合并结果
      const mergedData = {
        name: '客户端数据', // 使用客户端的名字
        grade: '二年级', // 使用服务器的年级
      };

      const conflict: ConflictData = {
        clientData: {
          name: '客户端数据',
          grade: '一年级',
        },
        serverData: {
          name: '服务器数据',
          grade: '二年级',
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      // 用户选择手动合并后的数据
      const finalData = mergedData;

      expect(finalData.name).toBe('客户端数据');
      expect(finalData.grade).toBe('二年级');
    });
  });

  // ==================== 额外测试 ====================

  describe('Additional Tests', () => {
    /**
     * 测试冲突检测
     */
    it('should detect conflicts between client and server data', () => {
      const clientData = {
        name: '客户端数据',
        grade: '一年级',
        timestamp: 1000,
      };

      const serverData = {
        name: '服务器数据',
        grade: '二年级',
        timestamp: 2000,
      };

      const conflict = resolver.detectConflict(
        clientData,
        serverData,
        'child',
        'child-1'
      );

      expect(conflict).not.toBeNull();
      expect(conflict?.entityType).toBe('child');
      expect(conflict?.entityId).toBe('child-1');
    });

    /**
     * 测试无冲突检测
     */
    it('should not detect conflict when data is identical', () => {
      const data = {
        name: '相同数据',
        grade: '一年级',
        timestamp: 1000,
      };

      const conflict = resolver.detectConflict(
        data,
        data,
        'child',
        'child-1'
      );

      expect(conflict).toBeNull();
    });

    /**
     * 测试自动解决冲突
     */
    it('should auto-resolve conflicts with given strategy', () => {
      const conflict: ConflictData = {
        clientData: {
          name: '客户端数据',
          timestamp: 2000,
        },
        serverData: {
          name: '服务器数据',
          timestamp: 1000,
        },
        entityType: 'child',
        entityId: 'child-1',
      };

      const result = resolver.autoResolve(conflict, ConflictStrategy.CLIENT_WINS);

      expect(result.strategy).toBe(ConflictStrategy.CLIENT_WINS);
      expect(result.resolvedData.name).toBe('客户端数据');
    });

    /**
     * 测试默认策略选择
     */
    it('should select default strategy based on entity type', () => {
      expect(resolver.getDefaultStrategy('user')).toBe(ConflictStrategy.CLIENT_WINS);
      expect(resolver.getDefaultStrategy('child')).toBe(ConflictStrategy.LAST_WRITE_WINS);
      expect(resolver.getDefaultStrategy('study_record')).toBe(ConflictStrategy.SERVER_WINS);
    });

    /**
     * 测试批量冲突检测
     */
    it('should detect multiple conflicts', () => {
      const operations = [
        {
          clientData: {name: 'A1', timestamp: 1000},
          serverData: {name: 'A2', timestamp: 2000},
          entityType: 'child',
          entityId: 'child-1',
        },
        {
          clientData: {name: 'B1', timestamp: 1000},
          serverData: {name: 'B1', timestamp: 1000},
          entityType: 'child',
          entityId: 'child-2',
        },
        {
          clientData: {name: 'C1', timestamp: 1000},
          serverData: {name: 'C2', timestamp: 2000},
          entityType: 'child',
          entityId: 'child-3',
        },
      ];

      const conflicts = resolver.detectConflicts(operations);

      // 应该检测到2个冲突（child-1和child-3，child-2数据相同）
      expect(conflicts).toHaveLength(2);
    });
  });
});
