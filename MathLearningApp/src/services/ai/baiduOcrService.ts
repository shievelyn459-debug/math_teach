/**
 * Baidu OCR Service
 * Wrapper for Baidu OCR API calls with automatic token management
 * Uses native HTTP module to bypass OkHttp networking issues on some Android devices
 * API文档: https://ai.baidu.com/ai-doc/OCR/
 */

import {BAIDU_OCR_CONFIG, RATE_LIMITS, AI_TIMEOUTS} from '../../config/aiConfig';
import {NativeModules} from 'react-native';

// Native HTTP module - bypasses OkHttp for better network compatibility
const {NativeHttp} = NativeModules;

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
   * 获取访问令牌（使用原生HTTP模块绕过OkHttp）
   */
  private async getAccessToken(): Promise<string> {
    // 检查是否有有效的token
    if (this.tokenInfo && Date.now() < this.tokenInfo.expires_at) {
      return this.tokenInfo.access_token;
    }

    if (!NativeHttp) {
      throw new Error('NativeHttp模块不可用');
    }

    // 获取新token
    const url = `${BAIDU_OCR_CONFIG.tokenURL}?grant_type=client_credentials&client_id=${BAIDU_OCR_CONFIG.apiKey}&client_secret=${BAIDU_OCR_CONFIG.secretKey}`;

    console.log('[BaiduOcrService] Fetching token via native HTTP...');

    try {
      const result = await NativeHttp.get(url);
      console.log('[BaiduOcrService] Token response, status:', result.status, 'elapsed:', result.elapsed, 'ms');

      const data = JSON.parse(result.body);

      if (data.error) {
        throw new Error(`Token error: ${data.error_description}`);
      }

      // 保存token（有效期减去5分钟缓冲）
      this.tokenInfo = {
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in - 300) * 1000,
      };

      console.log('[BaiduOcrService] Token obtained, expires in:', data.expires_in, 'seconds');
      return this.tokenInfo.access_token;
    } catch (error) {
      console.error('[BaiduOcrService] Token fetch failed:', error);
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
   */
  async recognizeGeneralText(imageBase64: string): Promise<OCRResult> {
    return this.recognize(imageBase64, 'general_basic');
  }

  /**
   * 通用文字识别（高精度版）
   */
  async recognizeAccurateText(imageBase64: string): Promise<OCRResult> {
    return this.recognize(imageBase64, 'accurate_basic');
  }

  /**
   * 执行OCR识别（使用原生HTTP模块）
   */
  private async recognize(imageBase64: string, apiType: string): Promise<OCRResult> {
    if (!BAIDU_OCR_CONFIG.apiKey || !BAIDU_OCR_CONFIG.secretKey) {
      throw new Error('Baidu OCR credentials not configured');
    }

    if (!NativeHttp) {
      throw new Error('NativeHttp模块不可用');
    }

    // 速率限制
    await this.checkRateLimit();

    const token = await this.getAccessToken();

    // 清理base64前缀
    let cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    cleanBase64 = cleanBase64.replace(/\s/g, '');

    console.log('[BaiduOcrService] Base64 length:', cleanBase64.length);

    if (!cleanBase64 || cleanBase64.length === 0) {
      throw new Error('Empty base64 data');
    }

    // 构建请求URL和body
    const apiUrl = `${BAIDU_OCR_CONFIG.baseURL}/rest/2.0/ocr/v1/${apiType}?access_token=${token}`;
    const formData = `image=${encodeURIComponent(cleanBase64)}`;

    console.log('[BaiduOcrService] Sending OCR request via native HTTP...');

    const startTime = Date.now();
    this.requestTimes.push(startTime);

    try {
      const result = await NativeHttp.post(apiUrl, formData, 'application/x-www-form-urlencoded');
      const elapsed = Date.now() - startTime;
      console.log(`[BaiduOcrService] OCR response in ${elapsed}ms, status: ${result.status}`);

      const data = JSON.parse(result.body) as BaiduOcrResponse;

      // 检查API错误
      if (data.error_code) {
        throw new Error(`Baidu OCR error ${data.error_code}: ${data.error_msg}`);
      }

      // 提取文本
      const text = data.words_result
        ?.map(item => item.words)
        .join('\n') || '';

      const confidence = this.calculateConfidence(data);

      console.log(`[BaiduOcrService] Recognized ${data.words_result_num || 0} text blocks, confidence: ${confidence}`);

      return {
        text,
        confidence,
        rawResponse: data,
      };
    } catch (error: any) {
      console.error('[BaiduOcrService] OCR recognition failed:', error);
      throw error;
    }
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(response: BaiduOcrResponse): number {
    let confidence = 0.85;

    const numResults = response.words_result_num || response.words_result?.length || 0;

    if (numResults === 0) {
      confidence = 0.3;
    } else if (numResults < 3) {
      confidence = 0.6;
    }

    if (response.error_code) {
      confidence = 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * 从识别的文本中提取数学题目
   */
  parseMathQuestion(ocrText: string): {
    questionType: 'addition' | 'subtraction' | 'word_problem' | 'unknown';
    extractedText: string;
    numbers: number[];
    confidence: number;
  } {
    const numbers = ocrText.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];
    const text = ocrText.trim();

    let questionType: 'addition' | 'subtraction' | 'word_problem' | 'unknown' = 'unknown';

    if (text.includes('+') || text.includes('加') || text.includes('一共') || text.includes('合计')) {
      questionType = 'addition';
    } else if (text.includes('-') || text.includes('减') || text.includes('剩') || text.includes('去掉')) {
      questionType = 'subtraction';
    } else if (text.length > 20 && numbers.length >= 2) {
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
