import {
  KnowledgePoint,
  KnowledgePointMatchResult,
  KnowledgePointRecognitionResult,
} from '../types/knowledgePoint';
import {
  KNOWLEDGE_POINTS_DATABASE,
  getFallbackKnowledgePoint,
} from '../database/knowledgePoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 知识点识别服务
 * 实现题目到知识点的自动识别
 */
export class KnowledgePointService {
  private static instance: KnowledgePointService;
  private cache: Map<string, KnowledgePointRecognitionResult> = new Map();
  private readonly CACHE_PREFIX = 'kp_cache_';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时
  private readonly FEEDBACK_PREFIX = 'kp_feedback_';

  // 知识点统计追踪（用于AC8学习改进）
  private knowledgePointStats: Map<string, {
    correctCount: number;
    incorrectCount: number;
    totalConfidence: number; // 累计置信度
  }> = new Map();

  // 知识点层级关系（用于AC3多知识点去重和降权）
  // parent: child -> 父知识点更通用，child更具体
  private readonly KNOWLEDGE_POINT_HIERARCHY: Map<string, string[]> = new Map([
    ['kp-add-001', ['kp-add-002', 'kp-add-003']], // 10以内加法 <- 进位加法, 连加
    ['kp-sub-001', ['kp-sub-002', 'kp-sub-003']], // 10以内减法 <- 退位减法, 连减
    ['kp-nr-001', ['kp-nr-002']], // 10以内数的认识 <- 11-20数的认识
  ]);

  /**
   * 获取单例实例
   */
  static getInstance(): KnowledgePointService {
    if (!KnowledgePointService.instance) {
      KnowledgePointService.instance = new KnowledgePointService();
    }
    return KnowledgePointService.instance;
  }

  // 静态方法包装器，用于支持测试中的静态调用方式
  static async recognizeKnowledgePoints(questionText: string) {
    return KnowledgePointService.getInstance().recognizeKnowledgePoints(questionText);
  }

  static getKnowledgePointById(id: string) {
    return KnowledgePointService.getInstance().getKnowledgePointById(id);
  }

  static getAllKnowledgePoints() {
    return KnowledgePointService.getInstance().getAllKnowledgePoints();
  }

  static async submitKnowledgePointFeedback(feedback: {
    originalKnowledgePointId: string;
    correctedKnowledgePointId: string;
    questionText: string;
    timestamp: Date;
  }) {
    return KnowledgePointService.getInstance().submitKnowledgePointFeedback(feedback);
  }

  /**
   * 识别题目的知识点
   * @param questionText 题目文本
   * @returns 识别结果
   */
  async recognizeKnowledgePoints(
    questionText: string
  ): Promise<KnowledgePointRecognitionResult> {
    const startTime = Date.now();

    // 检查输入有效性
    if (!questionText || questionText.trim().length < 2) {
      return this.createFallbackResult();
    }

    // 检查缓存
    const cached = await this.getFromCache(questionText);
    if (cached) {
      console.log('[KnowledgePointService] Using cached result');
      return cached;
    }

    // 执行知识点识别
    const matchResults = this.matchKnowledgePoints(questionText);

    // 按置信度排序
    matchResults.sort((a, b) => b.confidence - a.confidence);

    // 过滤低置信度结果
    const validResults = matchResults.filter(
      r => r.confidence >= r.knowledgePoint.confidenceThreshold
    );

    // 创建识别结果
    const result: KnowledgePointRecognitionResult = {
      knowledgePoints: validResults,
      primaryKnowledgePoint:
        validResults.length > 0
          ? validResults[0]
          : this.createFallbackMatchResult(),
      fallbackUsed: validResults.length === 0,
    };

    // 缓存结果
    await this.saveToCache(questionText, result);

    const duration = Date.now() - startTime;
    console.log(
      `[KnowledgePointService] Recognition completed in ${duration}ms`
    );

    return result;
  }

  /**
   * 匹配知识点
   */
  private matchKnowledgePoints(
    questionText: string
  ): KnowledgePointMatchResult[] {
    const results: KnowledgePointMatchResult[] = [];
    const normalizedText = questionText.toLowerCase().trim();

    // 第一轮：收集所有匹配结果
    const firstRoundResults: KnowledgePointMatchResult[] = [];
    KNOWLEDGE_POINTS_DATABASE.forEach(kp => {
      const matchResult = this.matchSingleKnowledgePoint(
        normalizedText,
        kp
      );
      if (matchResult) {
        firstRoundResults.push(matchResult);
      }
    });

    // 第二轮：应用层级关系去重，重新计算置信度
    firstRoundResults.forEach(firstRoundResult => {
      const refinedResult = this.matchSingleKnowledgePoint(
        normalizedText,
        firstRoundResult.knowledgePoint,
        firstRoundResults // 传递第一轮结果用于层级检查
      );
      if (refinedResult && refinedResult.confidence >= refinedResult.knowledgePoint.confidenceThreshold) {
        results.push(refinedResult);
      }
    });

    return results;
  }

  /**
   * 匹配单个知识点
   */
  private matchSingleKnowledgePoint(
    text: string,
    kp: KnowledgePoint,
    allMatchResults?: KnowledgePointMatchResult[] // 用于层级关系去重
  ): KnowledgePointMatchResult | null {
    const matchedKeywords: string[] = [];
    let matchScore = 0;

    // 检查每个关键词
    kp.keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      const lowerText = text.toLowerCase();
      if (lowerText.includes(lowerKeyword)) {
        matchedKeywords.push(keyword);
        matchScore += 1;
      }
    });

    // 如果没有匹配到关键词，返回null
    if (matchedKeywords.length === 0) {
      return null;
    }

    // 计算置信度
    // 基础分数：匹配关键词数量 / 总关键词数量
    let confidence = matchScore / kp.keywords.length;

    // 加权：匹配的关键词越多，置信度越高
    confidence = Math.min(confidence * 1.5, 1.0);

    // 特殊规则：如果匹配到核心关键词（如+、-），提高置信度
    const hasCoreSymbol =
      text.includes('+') ||
      text.includes('-') ||
      text.includes('×') ||
      text.includes('÷');
    if (hasCoreSymbol && matchedKeywords.length >= 1) {
      confidence = Math.min(confidence + 0.5, 1.0); // 提高到0.5，让运算符优先
    }

    // AC3改进：检查是否存在子知识点匹配，如果存在则降低父知识点置信度
    // 例如：如果匹配到"进位加法"（子），则降低"10以内加法"（父）的置信度
    const children = this.KNOWLEDGE_POINT_HIERARCHY.get(kp.id);
    if (children && allMatchResults) {
      const hasChildMatch = allMatchResults.some(
        result => children.includes(result.knowledgePoint.id) && result.confidence > 0.6
      );
      if (hasChildMatch) {
        // 子知识点匹配时，父知识点置信度降低30%
        confidence = confidence * 0.7;
      }
    }

    // 应用历史准确率权重调整 (AC8学习改进)
    const stats = this.knowledgePointStats.get(kp.id);
    if (stats && stats.correctCount + stats.incorrectCount > 0) {
      const accuracy = stats.correctCount / (stats.correctCount + stats.incorrectCount);
      // 准确率低于50%时降低置信度，高于80%时略微提升
      if (accuracy < 0.5) {
        confidence = confidence * (0.5 + accuracy); // 降低置信度
      } else if (accuracy > 0.8) {
        confidence = Math.min(confidence * 1.1, 1.0); // 轻微提升
      }
    }

    return {
      knowledgePoint: kp,
      confidence,
      matchedKeywords,
    };
  }

  /**
   * 创建降级结果
   */
  private createFallbackResult(): KnowledgePointRecognitionResult {
    return {
      knowledgePoints: [],
      primaryKnowledgePoint: this.createFallbackMatchResult(),
      fallbackUsed: true,
    };
  }

  /**
   * 创建降级匹配结果
   */
  private createFallbackMatchResult(): KnowledgePointMatchResult {
    return {
      knowledgePoint: getFallbackKnowledgePoint(),
      confidence: 0,
      matchedKeywords: [],
    };
  }

  /**
   * 从缓存获取结果
   */
  private async getFromCache(
    questionText: string
  ): Promise<KnowledgePointRecognitionResult | null> {
    try {
      const cacheKey = this.CACHE_PREFIX + this.hashText(questionText);

      // 先检查内存缓存
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      // 检查持久化缓存
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // 检查是否过期
        if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
          return parsed.result as KnowledgePointRecognitionResult;
        }
      }
    } catch (error) {
      console.warn('[KnowledgePointService] Cache read error:', error);
    }

    return null;
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(
    questionText: string,
    result: KnowledgePointRecognitionResult
  ): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + this.hashText(questionText);
      const cacheData = {
        timestamp: Date.now(),
        result,
      };

      // 保存到内存缓存
      this.cache.set(cacheKey, result);

      // 保存到持久化缓存
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('[KnowledgePointService] Cache write error:', error);
    }
  }

  /**
   * 文本哈希函数
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 根据ID获取知识点
   */
  getKnowledgePointById(id: string): KnowledgePoint | undefined {
    return KNOWLEDGE_POINTS_DATABASE.find(kp => kp.id === id);
  }

  /**
   * 获取所有知识点
   */
  getAllKnowledgePoints(): KnowledgePoint[] {
    return [...KNOWLEDGE_POINTS_DATABASE];
  }

  /**
   * 提交知识点识别反馈
   * 用于系统学习和改进 (AC: 8)
   *
   * 实现说明：
   * - 存储反馈数据用于持久化追踪
   * - 更新内存中的统计权重，影响后续识别的置信度
   * - 定期生成准确率报告供分析
   */
  async submitKnowledgePointFeedback(feedback: {
    originalKnowledgePointId: string;
    correctedKnowledgePointId: string;
    questionText: string;
    timestamp: Date;
  }): Promise<{success: boolean; message?: string}> {
    try {
      // 保存反馈到本地存储（用于持久化追踪和服务器同步）
      const feedbackKey = this.FEEDBACK_PREFIX + Date.now();
      await AsyncStorage.setItem(feedbackKey, JSON.stringify(feedback));

      // 更新知识点统计（即时生效，影响后续识别）
      // 原识别结果错误 - 增加错误计数
      this.updateKPStats(feedback.originalKnowledgePointId, false);
      // 修正结果正确 - 增加正确计数
      this.updateKPStats(feedback.correctedKnowledgePointId, true);

      // 记录日志
      console.log('[KnowledgePointService] Feedback submitted:', {
        original: feedback.originalKnowledgePointId,
        corrected: feedback.correctedKnowledgePointId,
        question: feedback.questionText,
      });

      // TODO: 将反馈数据发送到服务器用于跨设备同步和模型改进

      return {success: true};
    } catch (error) {
      console.error('[KnowledgePointService] Feedback submission error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 更新知识点统计（内部方法，用于学习改进）
   */
  private updateKPStats(kpId: string, isCorrect: boolean): void {
    const stats = this.knowledgePointStats.get(kpId) || {
      correctCount: 0,
      incorrectCount: 0,
      totalConfidence: 0,
    };

    if (isCorrect) {
      stats.correctCount++;
    } else {
      stats.incorrectCount++;
    }

    this.knowledgePointStats.set(kpId, stats);
  }

  /**
   * 获取知识点识别准确率统计（用于监控和报告）
   */
  getKnowledgePointAccuracy(kpId: string): {
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    totalRecognitions: number;
  } | null {
    const stats = this.knowledgePointStats.get(kpId);
    if (!stats) {
      return null;
    }

    const total = stats.correctCount + stats.incorrectCount;
    const accuracy = total > 0 ? stats.correctCount / total : 0;

    return {
      correctCount: stats.correctCount,
      incorrectCount: stats.incorrectCount,
      accuracy,
      totalRecognitions: total,
    };
  }

  /**
   * 生成所有知识点的准确率报告（AC8周报）
   */
  generateAccuracyReport(): Array<{
    kpId: string;
    kpName: string;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    needsImprovement: boolean;
  }> {
    const report: Array<{
      kpId: string;
      kpName: string;
      correctCount: number;
      incorrectCount: number;
      accuracy: number;
      needsImprovement: boolean;
    }> = [];

    this.knowledgePointStats.forEach((stats, kpId) => {
      const kp = this.getKnowledgePointById(kpId);
      if (!kp) return;

      const total = stats.correctCount + stats.incorrectCount;
      const accuracy = total > 0 ? stats.correctCount / total : 0;

      report.push({
        kpId,
        kpName: kp.name,
        correctCount: stats.correctCount,
        incorrectCount: stats.incorrectCount,
        accuracy,
        needsImprovement: total >= 10 && accuracy < 0.7, // 至少10次反馈且准确率<70%
      });
    });

    return report.sort((a, b) => a.accuracy - b.accuracy); // 按准确率升序排列
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    try {
      this.cache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('[KnowledgePointService] Cache cleared');
    } catch (error) {
      console.error('[KnowledgePointService] Cache clear error:', error);
    }
  }
}

// 导出类和单例实例
export {KnowledgePointService};
export default KnowledgePointService.getInstance();
