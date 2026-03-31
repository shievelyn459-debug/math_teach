/**
 * Baidu OCR Service
 * Wrapper for Baidu OCR API calls with automatic token management
 * API文档: https://ai.baidu.com/ai-doc/OCR/
 */

import {BAIDU_OCR_CONFIG, RATE_LIMITS, AI_TIMEOUTS} from '../../config/aiConfig';

/**
 * Baidu OCR API响应类型
 */
interface BaiduOcrResponse {
  words_result: Array<{
    words: string;
  }>;
  words_result_num?: number;
  log_id?: number;
  error_code?: number;
  error_msg?: string;
}

/**
 * OCR识别结果
 */
export interface OCRResult {
  text: string;
  confidence: number;
  rawResponse?: BaiduOcrResponse;
}

/**
 * Token信息
 */
interface TokenInfo {
  access_token: string;
  expires_at: number;
}

/**
 * Baidu OCR服务类
 */
class BaiduOcrService {
  private tokenInfo: TokenInfo | null = null;
  private requestTimes: number[] = []; // 用于速率限制

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<string> {
    // 检查是否有有效的token
    if (this.tokenInfo && Date.now() < this.tokenInfo.expires_at) {
      return this.tokenInfo.access_token;
    }

    // 获取新token
    try {
      const url = `${BAIDU_OCR_CONFIG.tokenURL}?grant_type=client_credentials&client_id=${BAIDU_OCR_CONFIG.apiKey}&client_secret=${BAIDU_OCR_CONFIG.secretKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Token error: ${data.error_description}`);
      }

      // 保存token（有效期减去5分钟缓冲）
      this.tokenInfo = {
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in - 300) * 1000,
      };

      console.log('[BaiduOcrService] New access token obtained');
      return this.tokenInfo.access_token;
    } catch (error) {
      console.error('[BaiduOcrService] Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * 检查速率限制
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // 清理超过1秒的请求记录
    this.requestTimes = this.requestTimes.filter(t => now - t < 1000);

    // 检查是否超过QPS限制
    if (this.requestTimes.length >= RATE_LIMITS.baidu.maxRequestsPerSecond) {
      const waitTime = 1000 - (now - this.requestTimes[0]);
      console.log(`[BaiduOcrService] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * 通用文字识别（标准版）
   * 适用于普通文字识别场景
   */
  async recognizeGeneralText(imageBase64: string): Promise<OCRResult> {
    return this.recognize(imageBase64, 'general_basic');
  }

  /**
   * 通用文字识别（高精度版）
   * 适用于需要更高精度的场景
   */
  async recognizeAccurateText(imageBase64: string): Promise<OCRResult> {
    return this.recognize(imageBase64, 'accurate_basic');
  }

  /**
   * 执行OCR识别
   * @param imageBase64 图片的base64编码（不含data:image前缀）
   * @param apiType API类型: 'general_basic' | 'accurate_basic' | 'general' | 'accurate'
   */
  private async recognize(imageBase64: string, apiType: string): Promise<OCRResult> {
    // 检查配置
    if (!BAIDU_OCR_CONFIG.apiKey || !BAIDU_OCR_CONFIG.secretKey) {
      throw new Error('Baidu OCR credentials not configured');
    }

    // 速率限制
    await this.checkRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error('[BaiduOcrService] Request aborted due to timeout');
    }, AI_TIMEOUTS.baiduOcr);

    console.log('[BaiduOcrService] Starting OCR request with', AI_TIMEOUTS.baiduOcr, 'ms timeout');

    try {
      const token = await this.getAccessToken();

      // 清理base64前缀（如果有）
      let cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      // 重要：移除所有空白字符（换行、空格等）
      // React Native的相机可能在base64中包含换行符
      cleanBase64 = cleanBase64.replace(/\s/g, '');

      // 调试日志：检查base64数据
      console.log('[BaiduOcrService] Base64 data length (after cleaning):', cleanBase64.length);
      console.log('[BaiduOcrService] Base64 preview (first 100 chars):', cleanBase64.substring(0, 100));
      console.log('[BaiduOcrService] Base64 last 100 chars:', cleanBase64.substring(Math.max(0, cleanBase64.length - 100)));

      // 检查base64是否有效
      if (!cleanBase64 || cleanBase64.length === 0) {
        throw new Error('Empty base64 data');
      }

      // 检查base64长度（通常图片至少有几千字符）
      if (cleanBase64.length < 1000) {
        console.warn('[BaiduOcrService] Warning: Base64 data seems too short, may be invalid');
      }

      // 验证base64格式
      const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
      if (!base64Pattern.test(cleanBase64)) {
        console.error('[BaiduOcrService] ERROR: Base64 data contains invalid characters!');
        console.log('[BaiduOcrService] First invalid char position:', cleanBase64.search(/[^A-Za-z0-9+/=]/));
        throw new Error('Invalid base64 format');
      }

      // 构建请求URL（access_token作为查询参数）
      const apiUrl = `${BAIDU_OCR_CONFIG.baseURL}/rest/2.0/ocr/v1/${apiType}?access_token=${token}`;

      // 构建application/x-www-form-urlencoded格式的请求体
      // 使用encodeURIComponent对base64进行URL编码
      // 注意：base64中的+、/、=会被编码为%2B、%2F、%3D
      const formData = `image=${encodeURIComponent(cleanBase64)}`;

      console.log('[BaiduOcrService] Request URL:', apiUrl.substring(0, 100) + '...');
      console.log('[BaiduOcrService] Form data length:', formData.length);

      // 记录请求时间
      const startTime = Date.now();
      this.requestTimes.push(startTime);

      console.log('[BaiduOcrService] Sending HTTP request...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;
      console.log(`[BaiduOcrService] Response received in ${processingTime}ms`);

      if (!response.ok) {
        throw new Error(`OCR request failed: ${response.status}`);
      }

      const data = (await response.json()) as BaiduOcrResponse;

      // 检查API错误
      if (data.error_code) {
        throw new Error(`Baidu OCR error ${data.error_code}: ${data.error_msg}`);
      }

      // 提取文本
      const text = data.words_result
        ?.map(item => item.words)
        .join('\n') || '';

      // 计算置信度（基于返回的字数和识别结果数）
      const confidence = this.calculateConfidence(data);

      console.log(`[BaiduOcrService] Recognized ${data.words_result_num || 0} text blocks, confidence: ${confidence}`);

      return {
        text,
        confidence,
        rawResponse: data,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      // 检查是否是超时错误
      if (error.name === 'AbortError') {
        console.error('[BaiduOcrService] Request timed out after', AI_TIMEOUTS.baiduOcr, 'ms');
        throw new Error(`OCR请求超时（${AI_TIMEOUTS.baiduOcr/1000}秒），请检查网络连接`);
      }

      console.error('[BaiduOcrService] OCR recognition failed:', error);
      throw new Error(`OCR识别失败: ${error.message || '网络错误'}`);
    }
  }

  /**
   * 计算置信度
   * 基于识别结果的多个因素综合评估
   */
  private calculateConfidence(response: BaiduOcrResponse): number {
    // 基础置信度
    let confidence = 0.85;

    const numResults = response.words_result_num || response.words_result?.length || 0;

    // 如果识别结果太少，降低置信度
    if (numResults === 0) {
      confidence = 0.3;
    } else if (numResults < 3) {
      confidence = 0.6;
    }

    // 检查是否有错误
    if (response.error_code) {
      confidence = 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * 从识别的文本中提取数学题目
   * 尝试解析题目类型、数字等
   */
  parseMathQuestion(ocrText: string): {
    questionType: 'addition' | 'subtraction' | 'word_problem' | 'unknown';
    extractedText: string;
    numbers: number[];
    confidence: number;
  } {
    const numbers = ocrText.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];
    const text = ocrText.trim();

    // 判断题目类型
    let questionType: 'addition' | 'subtraction' | 'word_problem' | 'unknown' = 'unknown';

    if (text.includes('+') || text.includes('加') || text.includes('一共') || text.includes('合计')) {
      questionType = 'addition';
    } else if (text.includes('-') || text.includes('减') || text.includes('剩') || text.includes('去掉')) {
      questionType = 'subtraction';
    } else if (text.length > 20 && numbers.length >= 2) {
      // 文字较长且包含数字，可能是应用题
      questionType = 'word_problem';
    }

    const confidence = numbers.length > 0 ? 0.7 : 0.4;

    return {
      questionType,
      extractedText: text,
      numbers,
      confidence,
    };
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return !!(BAIDU_OCR_CONFIG.apiKey && BAIDU_OCR_CONFIG.secretKey);
  }

  /**
   * 清除缓存的token
   */
  clearToken(): void {
    this.tokenInfo = null;
    console.log('[BaiduOcrService] Token cleared');
  }
}

// 导出单例实例
export const baiduOcrService = new BaiduOcrService();
export default baiduOcrService;
