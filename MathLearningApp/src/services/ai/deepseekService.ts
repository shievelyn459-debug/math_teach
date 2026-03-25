/**
 * DeepSeek Service
 * Wrapper for DeepSeek API calls
 * DeepSeek提供与OpenAI兼容的API接口
 * API文档: https://platform.deepseek.com/api-docs/
 */

import {DEEPSEEK_CONFIG, RATE_LIMITS, AI_TIMEOUTS, estimateCost} from '../../config/aiConfig';

// Types for API responses
export interface GeneratedQuestion {
  question: string;
  answer: string;
  explanation: string;
}

export interface ExplanationSection {
  type: string;
  title: string;
  content: string[];
  examples?: Array<{
    question: string;
    answer: string;
    steps: string[];
    difficulty: string;
  }>;
}

export interface ExplanationResult {
  sections: ExplanationSection[];
}

/**
 * DeepSeek API响应格式
 */
interface DeepSeekChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 请求追踪器用于速率限制
 */
class RequestTracker {
  private requests: number[] = []; // 请求时间戳
  private dailyTokens = 0;
  private dailyResetTime: number;

  constructor() {
    this.dailyResetTime = this.getNextMidnight();
  }

  private getNextMidnight(): number {
    const now = Date.now();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    return tomorrow.getTime();
  }

  async checkRateLimit(): Promise<{allowed: boolean; waitTime?: number}> {
    const now = Date.now();

    // 重置每日计数器
    if (now > this.dailyResetTime) {
      this.dailyTokens = 0;
      this.dailyResetTime = this.getNextMidnight();
    }

    // 检查每日token限制
    if (this.dailyTokens >= RATE_LIMITS.deepseek.maxTokensPerDay) {
      const waitTime = this.dailyResetTime - now;
      return {allowed: false, waitTime};
    }

    // 清理旧请求（超过1分钟）
    this.requests = this.requests.filter(t => now - t < 60000);

    // 检查每分钟限制
    if (this.requests.length >= RATE_LIMITS.deepseek.maxRequestsPerMinute) {
      const oldestRequest = this.requests[0];
      const waitTime = 60000 - (now - oldestRequest);
      return {allowed: false, waitTime};
    }

    return {allowed: true};
  }

  recordRequest(tokens: number): void {
    this.requests.push(Date.now());
    this.dailyTokens += tokens;
  }

  getDailyUsage(): {tokens: number; limit: number; resetAt: Date} {
    return {
      tokens: this.dailyTokens,
      limit: RATE_LIMITS.deepseek.maxTokensPerDay,
      resetAt: new Date(this.dailyResetTime),
    };
  }
}

/**
 * DeepSeek服务类
 */
class DeepSeekService {
  private tracker: RequestTracker;
  private cache: Map<string, {data: any; expiry: number}>;

  constructor() {
    this.tracker = new RequestTracker();
    this.cache = new Map();
    this.logAvailability();
  }

  private logAvailability(): void {
    if (this.isAvailable()) {
      console.log('[DeepSeekService] Initialized successfully');
    } else {
      console.warn('[DeepSeekService] No API key provided, service will be disabled');
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return DEEPSEEK_CONFIG.apiKey.length > 0;
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any, ttlMinutes: number = 60): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMinutes * 60 * 1000,
    });
  }

  /**
   * 调用DeepSeek API
   */
  private async callAPI(
    systemPrompt: string,
    userPrompt: string,
    responseFormat?: {type: 'json_object'}
  ): Promise<DeepSeekChatResponse> {
    if (!this.isAvailable()) {
      throw new Error('DeepSeek service is not available');
    }

    // 检查速率限制
    const rateLimit = await this.tracker.checkRateLimit();
    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil((rateLimit.waitTime || 0) / 1000)} seconds.`
      );
    }

    try {
      const requestBody: any = {
        model: DEEPSEEK_CONFIG.model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: userPrompt},
        ],
        max_tokens: DEEPSEEK_CONFIG.maxTokens,
      };

      // DeepSeek支持JSON模式
      if (responseFormat) {
        requestBody.response_format = responseFormat;
      }

      const response = await fetch(`${DEEPSEEK_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      this.tracker.recordRequest(data.usage?.total_tokens || 0);

      // 记录成本估算
      const cost = estimateCost(
        'deepseek',
        DEEPSEEK_CONFIG.model,
        data.usage?.prompt_tokens || 0,
        data.usage?.completion_tokens || 0
      );
      console.log(`[DeepSeekService] API call cost: ¥${cost.toFixed(4)}, tokens: ${data.usage?.total_tokens || 0}`);

      return data;
    } catch (error) {
      console.error('[DeepSeekService] API call failed:', error);
      throw error;
    }
  }

  /**
   * 生成数学题目
   */
  async generateQuestions(
    systemPrompt: string,
    userPrompt: string,
    count: number = 5
  ): Promise<GeneratedQuestion[]> {
    // 检查缓存
    const cacheKey = this.getCacheKey('gen', {prompt: userPrompt, count});
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('[DeepSeekService] Cache hit for generation');
      return cached;
    }

    try {
      const response = await this.callAPI(systemPrompt, userPrompt, {type: 'json_object'});

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from API');
      }

      const result = JSON.parse(content) as GeneratedQuestion[];
      this.setCache(cacheKey, result, 60); // 缓存1小时

      console.log(`[DeepSeekService] Generated ${result.length} questions`);
      return result;
    } catch (error) {
      console.error('[DeepSeekService] Generation failed:', error);
      throw error;
    }
  }

  /**
   * 生成知识点讲解
   */
  async generateExplanation(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ExplanationResult> {
    // 检查缓存
    const cacheKey = this.getCacheKey('exp', {prompt: userPrompt});
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('[DeepSeekService] Cache hit for explanation');
      return cached;
    }

    try {
      const response = await this.callAPI(systemPrompt, userPrompt, {type: 'json_object'});

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from API');
      }

      const result = JSON.parse(content) as ExplanationResult;
      this.setCache(cacheKey, result, 120); // 缓存2小时

      console.log('[DeepSeekService] Generated explanation with', result.sections?.length, 'sections');
      return result;
    } catch (error) {
      console.error('[DeepSeekService] Explanation generation failed:', error);
      throw error;
    }
  }

  /**
   * 获取使用统计
   */
  getUsage() {
    return this.tracker.getDailyUsage();
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[DeepSeekService] Cache cleared');
  }
}

// 导出单例实例
export const deepseekService = new DeepSeekService();
export default deepseekService;
