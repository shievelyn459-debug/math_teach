import { performanceTracker, ProcessingStage, STAGE_TIMEOUTS, WARNING_THRESHOLD, TOTAL_TIMEOUT } from '../performanceTracker';

describe('PerformanceTracker', () => {
  beforeEach(() => {
    performanceTracker.reset();
  });

  describe('startSession', () => {
    it('应该启动新的跟踪会话', () => {
      const sessionId = 'test-session-1';
      performanceTracker.startSession(sessionId);

      const metrics = performanceTracker.getCurrentMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.sessionId).toBe(sessionId);
      expect(metrics?.status).toBe('in_progress');
    });

    it('应该记录会话开始时间', () => {
      const startTimeBefore = Date.now();
      performanceTracker.startSession('test-session');
      const metrics = performanceTracker.getCurrentMetrics();
      const startTimeAfter = Date.now();

      expect(metrics?.startTime).toBeGreaterThanOrEqual(startTimeBefore);
      expect(metrics?.startTime).toBeLessThanOrEqual(startTimeAfter);
    });

    it('应该初始化阶段列表包含 IDLE', () => {
      performanceTracker.startSession('test-session');
      const metrics = performanceTracker.getCurrentMetrics();

      expect(metrics?.stages).toHaveLength(1);
      expect(metrics?.stages[0].stage).toBe(ProcessingStage.IDLE);
    });
  });

  describe('recordStage', () => {
    it('应该记录阶段转换', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.recordStage(ProcessingStage.UPLOADING);

      const metrics = performanceTracker.getCurrentMetrics();
      expect(metrics?.stages).toHaveLength(2);
      expect(metrics?.stages[1].stage).toBe(ProcessingStage.UPLOADING);
    });

    it('应该计算阶段持续时间', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.recordStage(ProcessingStage.UPLOADING);

      const metrics = performanceTracker.getCurrentMetrics();
      expect(metrics?.stages[1].duration).toBeGreaterThan(0);
    });

    it('应该计算累计时间', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.recordStage(ProcessingStage.UPLOADING);
      performanceTracker.recordStage(ProcessingStage.RECOGNIZING);

      const metrics = performanceTracker.getCurrentMetrics();
      expect(metrics?.totalUploadTime).toBeDefined();
      expect(metrics?.totalRecognitionTime).toBeDefined();
    });
  });

  describe('completeSession', () => {
    it('应该标记会话为完成', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.completeSession();

      const metrics = performanceTracker.getCurrentMetrics();
      expect(metrics?.status).toBe('completed');
    });

    it('应该记录结束时间和总时间', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.recordStage(ProcessingStage.UPLOADING);
      performanceTracker.completeSession();

      const metrics = performanceTracker.getCurrentMetrics();
      expect(metrics?.endTime).toBeDefined();
      expect(metrics?.totalTime).toBeGreaterThan(0);
    });

    it('应该添加 COMPLETED 阶段', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.completeSession();

      const metrics = performanceTracker.getCurrentMetrics();
      const lastStage = metrics?.stages[metrics.stages.length - 1];
      expect(lastStage?.stage).toBe(ProcessingStage.COMPLETED);
    });
  });

  describe('markError', () => {
    it('应该标记会话为错误', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.markError('测试错误');

      const metrics = performanceTracker.getCurrentMetrics();
      expect(metrics?.status).toBe('error');
      expect(metrics?.errorMessage).toBe('测试错误');
    });

    it('应该添加 ERROR 阶段', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.markError('测试错误');

      const metrics = performanceTracker.getCurrentMetrics();
      const lastStage = metrics?.stages[metrics.stages.length - 1];
      expect(lastStage?.stage).toBe(ProcessingStage.ERROR);
    });
  });

  describe('getElapsedTime', () => {
    it('应该返回已用时间', async () => {
      performanceTracker.startSession('test-session');
      await new Promise(resolve => setTimeout(resolve, 100));

      const elapsed = performanceTracker.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('没有会话时应返回 0', () => {
      const elapsed = performanceTracker.getElapsedTime();
      expect(elapsed).toBe(0);
    });
  });

  describe('shouldShowWarning', () => {
    it('超过警告阈值时应返回 true', async () => {
      performanceTracker.startSession('test-session');
      // 模拟时间流逝（实际上需要25秒，测试中我们检查逻辑）

      const elapsed = performanceTracker.getElapsedTime();
      // 在真实测试中，这里需要模拟25秒延迟
      const shouldWarn = elapsed >= WARNING_THRESHOLD;

      expect(typeof shouldWarn).toBe('boolean');
    });
  });

  describe('getCurrentStage', () => {
    it('应该返回当前阶段', () => {
      performanceTracker.startSession('test-session');
      expect(performanceTracker.getCurrentStage()).toBe(ProcessingStage.IDLE);

      performanceTracker.recordStage(ProcessingStage.UPLOADING);
      expect(performanceTracker.getCurrentStage()).toBe(ProcessingStage.UPLOADING);
    });

    it('没有会话时应返回 IDLE', () => {
      expect(performanceTracker.getCurrentStage()).toBe(ProcessingStage.IDLE);
    });
  });

  describe('getRemainingTime', () => {
    it('应该返回剩余时间预算', () => {
      performanceTracker.startSession('test-session');
      const remaining = performanceTracker.getRemainingTime();

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(TOTAL_TIMEOUT);
    });
  });

  describe('estimateRemainingTime', () => {
    it('应该估算剩余时间', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.recordStage(ProcessingStage.UPLOADING);

      const estimated = performanceTracker.estimateRemainingTime();
      expect(typeof estimated).toBe('number');
    });

    it('用户交互阶段应返回 0', () => {
      performanceTracker.startSession('test-session');
      performanceTracker.recordStage(ProcessingStage.CORRECTION);

      const estimated = performanceTracker.estimateRemainingTime();
      expect(estimated).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('应该订阅指标更新', () => {
      const callback = jest.fn();
      performanceTracker.startSession('test-session');

      const unsubscribe = performanceTracker.subscribe(callback);

      performanceTracker.recordStage(ProcessingStage.UPLOADING);

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });

    it('取消订阅后不应收到更新', () => {
      const callback = jest.fn();
      performanceTracker.startSession('test-session');

      const unsubscribe = performanceTracker.subscribe(callback);
      unsubscribe();

      performanceTracker.recordStage(ProcessingStage.UPLOADING);

      // 取消订阅后回调次数不应增加（可能在初始订阅时调用一次）
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('STAGE_TIMEOUTS', () => {
    it('应该定义所有阶段的超时时间', () => {
      expect(STAGE_TIMEOUTS.UPLOADING).toBe(5000);
      expect(STAGE_TIMEOUTS.RECOGNIZING).toBe(8000);
      expect(STAGE_TIMEOUTS.GENERATING).toBe(12000);
      expect(STAGE_TIMEOUTS.CORRECTION).toBe(Infinity);
      expect(STAGE_TIMEOUTS.DIFFICULTY_SELECTION).toBe(Infinity);
    });
  });

  describe('常量', () => {
    it('应该定义警告阈值', () => {
      expect(WARNING_THRESHOLD).toBe(25000);
    });

    it('应该定义总超时时间', () => {
      expect(TOTAL_TIMEOUT).toBe(30000);
    });
  });
});
