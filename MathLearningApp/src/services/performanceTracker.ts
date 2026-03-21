/**
 * 性能跟踪服务
 * 用于监控和记录题目处理各阶段的时间
 */

export enum ProcessingStage {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  RECOGNIZING = 'recognizing',
  CORRECTION = 'correction',
  DIFFICULTY_SELECTION = 'difficulty_selection',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface StageTimestamp {
  stage: ProcessingStage;
  timestamp: number;
  duration?: number; // 从上一阶段到该阶段的耗时
}

export interface PerformanceMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalTime?: number;
  stages: StageTimestamp[];
  totalUploadTime?: number;
  totalRecognitionTime?: number;
  totalGenerationTime?: number;
  userInteractionTime?: number;
  status: 'in_progress' | 'completed' | 'error';
  errorMessage?: string;
}

// 每个阶段的时间预算（毫秒）
export const STAGE_TIMEOUTS = {
  [ProcessingStage.UPLOADING]: 5000, // 5秒
  [ProcessingStage.RECOGNIZING]: 8000, // 8秒
  [ProcessingStage.CORRECTION]: Infinity, // 用户控制，无超时
  [ProcessingStage.DIFFICULTY_SELECTION]: Infinity, // 用户控制，无超时
  [ProcessingStage.GENERATING]: 12000, // 12秒
};

// 警告阈值（毫秒）
export const WARNING_THRESHOLD = 25000; // 25秒
export const TOTAL_TIMEOUT = 30000; // 30秒总限制

class PerformanceTracker {
  private currentMetrics: PerformanceMetrics | null = null;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  /**
   * 开始新的处理会话
   */
  startSession(sessionId: string): void {
    this.currentMetrics = {
      sessionId,
      startTime: Date.now(),
      stages: [
        {
          stage: ProcessingStage.IDLE,
          timestamp: Date.now(),
        },
      ],
      status: 'in_progress',
    };

    this.notifyListeners();
    console.log(`[PerformanceTracker] Session ${sessionId} started`);
  }

  /**
   * 记录阶段转换
   */
  recordStage(stage: ProcessingStage): void {
    if (!this.currentMetrics) {
      console.warn('[PerformanceTracker] No active session');
      return;
    }

    const now = Date.now();
    const lastStage = this.currentMetrics.stages[this.currentMetrics.stages.length - 1];
    const duration = now - lastStage.timestamp;

    this.currentMetrics.stages.push({
      stage,
      timestamp: now,
      duration,
    });

    // 更新累计时间
    this.updateCumulativeTimes();

    this.notifyListeners();

    // 检查是否超过总时间限制
    const totalTime = now - this.currentMetrics.startTime;
    if (totalTime > TOTAL_TIMEOUT) {
      this.markError('处理超时：超过30秒限制');
    }

    console.log(`[PerformanceTracker] Stage ${stage} recorded, duration: ${duration}ms, total: ${totalTime}ms`);
  }

  /**
   * 更新累计时间
   */
  private updateCumulativeTimes(): void {
    if (!this.currentMetrics) return;

    const stages = this.currentMetrics.stages;
    const uploadStage = stages.find(s => s.stage === ProcessingStage.UPLOADING);
    const recognitionStage = stages.find(s => s.stage === ProcessingStage.RECOGNIZING);
    const generationStage = stages.find(s => s.stage === ProcessingStage.GENERATING);

    // 计算系统处理时间（不包括用户交互时间）
    let systemTime = 0;
    if (uploadStage?.duration) systemTime += uploadStage.duration;
    if (recognitionStage?.duration) systemTime += recognitionStage.duration;
    if (generationStage?.duration) systemTime += generationStage.duration;

    // 计算用户交互时间
    let userTime = 0;
    stages.forEach(stage => {
      if (
        stage.stage === ProcessingStage.CORRECTION ||
        stage.stage === ProcessingStage.DIFFICULTY_SELECTION
      ) {
        if (stage.duration) userTime += stage.duration;
      }
    });

    this.currentMetrics.totalUploadTime = uploadStage?.duration;
    this.currentMetrics.totalRecognitionTime = recognitionStage?.duration;
    this.currentMetrics.totalGenerationTime = generationStage?.duration;
    this.currentMetrics.userInteractionTime = userTime;
  }

  /**
   * 完成会话
   */
  completeSession(): void {
    if (!this.currentMetrics) return;

    this.currentMetrics.endTime = Date.now();
    this.currentMetrics.totalTime =
      this.currentMetrics.endTime - this.currentMetrics.startTime;
    this.currentMetrics.status = 'completed';
    this.currentMetrics.stages.push({
      stage: ProcessingStage.COMPLETED,
      timestamp: Date.now(),
      duration: this.currentMetrics.endTime -
        this.currentMetrics.stages[this.currentMetrics.stages.length - 1].timestamp,
    });

    this.notifyListeners();
    this.logMetrics();

    console.log(
      `[PerformanceTracker] Session ${this.currentMetrics.sessionId} completed in ${this.currentMetrics.totalTime}ms`
    );
  }

  /**
   * 标记错误
   */
  markError(message: string): void {
    if (!this.currentMetrics) return;

    this.currentMetrics.status = 'error';
    this.currentMetrics.errorMessage = message;
    this.currentMetrics.endTime = Date.now();
    this.currentMetrics.totalTime =
      this.currentMetrics.endTime - this.currentMetrics.startTime;
    this.currentMetrics.stages.push({
      stage: ProcessingStage.ERROR,
      timestamp: Date.now(),
    });

    this.notifyListeners();
    console.error(`[PerformanceTracker] Session ${this.currentMetrics.sessionId} error: ${message}`);
  }

  /**
   * 获取当前指标
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.currentMetrics;
  }

  /**
   * 获取已用时间
   */
  getElapsedTime(): number {
    if (!this.currentMetrics) return 0;
    return Date.now() - this.currentMetrics.startTime;
  }

  /**
   * 检查是否应显示警告
   */
  shouldShowWarning(): boolean {
    const elapsed = this.getElapsedTime();
    return elapsed >= WARNING_THRESHOLD;
  }

  /**
   * 获取当前阶段
   */
  getCurrentStage(): ProcessingStage {
    if (!this.currentMetrics) return ProcessingStage.IDLE;
    const lastStage = this.currentMetrics.stages[this.currentMetrics.stages.length - 1];
    return lastStage?.stage || ProcessingStage.IDLE;
  }

  /**
   * 获取剩余时间预算
   */
  getRemainingTime(): number {
    return TOTAL_TIMEOUT - this.getElapsedTime();
  }

  /**
   * 估算剩余时间（基于当前阶段）
   */
  estimateRemainingTime(): number {
    const currentStage = this.getCurrentStage();
    const timeout = STAGE_TIMEOUTS[currentStage];

    if (timeout === Infinity) {
      // 用户交互阶段，无法估算
      return 0;
    }

    const elapsedInStage = this.getElapsedTime() -
      this.currentMetrics!.stages[this.currentMetrics!.stages.length - 1].timestamp;

    const remainingForStage = Math.max(0, timeout - elapsedInStage);

    // 加上后续阶段的预算
    const subsequentStages = this.getSubsequentStages(currentStage);
    const subsequentBudget = subsequentStages.reduce(
      (sum, stage) => sum + (STAGE_TIMEOUTS[stage] || 0),
      0
    );

    return remainingForStage + subsequentBudget;
  }

  /**
   * 获取当前阶段之后的所有阶段
   */
  private getSubsequentStages(currentStage: ProcessingStage): ProcessingStage[] {
    const stageOrder = [
      ProcessingStage.UPLOADING,
      ProcessingStage.RECOGNIZING,
      ProcessingStage.CORRECTION,
      ProcessingStage.DIFFICULTY_SELECTION,
      ProcessingStage.GENERATING,
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    return stageOrder.slice(currentIndex + 1);
  }

  /**
   * 订阅指标更新
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    if (this.currentMetrics) {
      this.listeners.forEach(callback => callback(this.currentMetrics!));
    }
  }

  /**
   * 记录性能日志到分析服务
   */
  private logMetrics(): void {
    if (!this.currentMetrics) return;

    const metrics = {
      sessionId: this.currentMetrics.sessionId,
      totalTime: this.currentMetrics.totalTime,
      uploadTime: this.currentMetrics.totalUploadTime,
      recognitionTime: this.currentMetrics.totalRecognitionTime,
      generationTime: this.currentMetrics.totalGenerationTime,
      userInteractionTime: this.currentMetrics.userInteractionTime,
      status: this.currentMetrics.status,
      timestamp: new Date().toISOString(),
    };

    // 在实际应用中，这里会发送到分析服务
    console.log('[PerformanceTracker] Metrics:', JSON.stringify(metrics, null, 2));

    // TODO: 发送到分析服务
    // await analyticsService.log('question_processing', metrics);
  }

  /**
   * 重置跟踪器
   */
  reset(): void {
    this.currentMetrics = null;
    this.listeners.clear();
    console.log('[PerformanceTracker] Reset');
  }
}

export const performanceTracker = new PerformanceTracker();
