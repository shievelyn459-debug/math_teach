/**
 * AI Service Aggregator
 * 统一的AI服务入口，自动路由到不同的提供商（百度OCR、DeepSeek、本地降级）
 */

import {QuestionType, Difficulty, Grade} from '../../types';
import {AI_PROVIDER, AI_FEATURES} from '../../config/aiConfig';
import {baiduOcrService} from './baiduOcrService';
import {deepseekService} from './deepseekService';
import {localQuestionGenerator} from './localQuestionGenerator';
import {generateQuestionPrompt, generateExplanationPrompt, SYSTEM_PROMPTS} from './promptTemplates';

/**
 * 导出所有服务
 */
export {baiduOcrService} from './baiduOcrService';
export {deepseekService} from './deepseekService';
export {localQuestionGenerator} from './localQuestionGenerator';
export * from './promptTemplates';

/**
 * OCR识别结果
 */
export interface OCRResult {
  questionType: 'addition' | 'subtraction' | 'word_problem' | 'unknown';
  extractedText: string;
  numbers: number[];
  confidence: number;
}

/**
 * 生成的题目
 */
export interface GeneratedQuestion {
  question: string;
  answer: string;
  explanation: string;
}

/**
 * 讲解结果
 */
export interface ExplanationResult {
  sections: Array<{
    type: string;
    title: string;
    content: string[];
    examples?: Array<{
      question: string;
      answer: string;
      steps: string[];
      difficulty: string;
    }>;
  }>;
}

/**
 * 统一AI服务类
 */
class AIService {
  /**
   * OCR识别数学题目
   * 优先使用百度OCR，失败则返回基础解析结果
   */
  async recognizeQuestion(imageBase64: string): Promise<OCRResult> {
    console.log('[AIService] Starting OCR recognition...');
    console.log('[AIService] OCR provider:', AI_PROVIDER.ocr);
    console.log('[AIService] Baidu OCR available:', baiduOcrService.isAvailable());

    // 如果启用百度OCR
    if (AI_PROVIDER.ocr === 'baidu' && baiduOcrService.isAvailable()) {
      try {
        console.log('[AIService] Using Baidu OCR API...');
        const result = await baiduOcrService.recognizeAccurateText(imageBase64);
        console.log('[AIService] Baidu OCR successful, text length:', result.text.length);

        // 使用百度OCR的解析功能
        return baiduOcrService.parseMathQuestion(result.text);
      } catch (error) {
        console.error('[AIService] Baidu OCR failed:', error);

        // 如果是超时或网络错误，直接抛给用户，不降级
        if (error.message && (error.message.includes('超时') || error.message.includes('网络'))) {
          throw error;
        }

        // 其他错误（如API配置错误）尝试降级到基础OCR
        console.log('[AIService] Attempting fallback to general OCR...');
        return baiduOcrService.recognizeGeneralText(imageBase64)
          .then(r => baiduOcrService.parseMathQuestion(r.text))
          .catch(() => this.getFallbackOCRResult());
      }
    }

    // 降级方案 - 当百度OCR不可用时
    console.log('[AIService] Baidu OCR not available, using fallback');
    const fallback = this.getFallbackOCRResult();
    console.log('[AIService] Fallback result:', fallback);

    // 如果返回空结果，抛出错误提示用户
    if (fallback.confidence === 0) {
      console.error('[AIService] OCR service not configured - API keys missing');
      throw new Error('OCR服务未配置。请在设置中配置百度OCR API密钥，或联系管理员。');
    }

    return fallback;
  }

  /**
   * 降级OCR结果
   */
  private getFallbackOCRResult(): OCRResult {
    return {
      questionType: 'unknown',
      extractedText: '',
      numbers: [],
      confidence: 0,
    };
  }

  /**
   * 生成相似题目
   * 优先使用DeepSeek，失败则使用本地生成器
   */
  async generateQuestions(
    type: QuestionType,
    difficulty: Difficulty,
    count: number,
    grade: Grade = Grade.GRADE_1
  ): Promise<GeneratedQuestion[]> {
    console.log(`[AIService] Generating ${count} ${type} questions (${difficulty}, ${grade})`);

    // 生成提示词
    const systemPrompt = SYSTEM_PROMPTS.QUESTION_GENERATOR;
    const userPrompt = generateQuestionPrompt(type, difficulty, count, this.getGradeName(grade));

    // 如果启用DeepSeek
    if (AI_PROVIDER.generation === 'deepseek' && deepseekService.isAvailable()) {
      try {
        const result = await deepseekService.generateQuestions(systemPrompt, userPrompt, count);
        console.log('[AIService] DeepSeek generation successful');
        return result;
      } catch (error) {
        console.error('[AIService] DeepSeek failed:', error);
        // 降级到本地生成器
        if (AI_FEATURES.useLocalFallback) {
          console.log('[AIService] Falling back to local generator');
          return localQuestionGenerator.generateQuestions(type, difficulty, count, grade);
        }
        throw error;
      }
    }

    // 使用本地生成器
    if (AI_FEATURES.useLocalFallback) {
      console.log('[AIService] Using local generator');
      return localQuestionGenerator.generateQuestions(type, difficulty, count, grade);
    }

    throw new Error('No generation service available');
  }

  /**
   * 生成知识点讲解
   * 优先使用DeepSeek，失败则返回空结构
   */
  async generateExplanation(
    knowledgePointName: string,
    grade: Grade = Grade.GRADE_1
  ): Promise<ExplanationResult> {
    console.log(`[AIService] Generating explanation for: ${knowledgePointName}`);

    const systemPrompt = SYSTEM_PROMPTS.EXPLANATION_GENERATOR;
    const userPrompt = generateExplanationPrompt(knowledgePointName, this.getGradeName(grade));

    // 如果启用DeepSeek
    if (AI_PROVIDER.generation === 'deepseek' && deepseekService.isAvailable()) {
      try {
        const result = await deepseekService.generateExplanation(systemPrompt, userPrompt);
        console.log('[AIService] DeepSeek explanation successful');
        return result;
      } catch (error) {
        console.error('[AIService] DeepSeek explanation failed:', error);
        // 返回基础结构
        return this.getFallbackExplanation(knowledgePointName);
      }
    }

    // 返回基础结构
    return this.getFallbackExplanation(knowledgePointName);
  }

  /**
   * 降级讲解结果
   */
  private getFallbackExplanation(knowledgePointName: string): ExplanationResult {
    return {
      sections: [
        {
          type: 'definition',
          title: `什么是${knowledgePointName}？`,
          content: [
            `${knowledgePointName}是一年级数学的重要内容。`,
            '建议让孩子通过实际操作和练习来理解。'
          ],
        },
        {
          type: 'methods',
          title: '怎样教孩子？',
          content: [
            '1. 用生活中的例子来解释',
            '2. 让孩子动手操作',
            '3. 多练习，巩固理解'
          ],
        },
      ],
    };
  }

  /**
   * 获取年级名称
   */
  private getGradeName(grade: Grade): string {
    const gradeNames: Record<Grade, string> = {
      [Grade.GRADE_1]: '一年级',
      [Grade.GRADE_2]: '二年级',
      [Grade.GRADE_3]: '三年级',
      [Grade.GRADE_4]: '四年级',
      [Grade.GRADE_5]: '五年级',
      [Grade.GRADE_6]: '六年级',
    };
    return gradeNames[grade];
  }

  /**
   * 检查服务可用性
   */
  checkAvailability(): {
    ocr: {baidu: boolean; local: boolean};
    generation: {deepseek: boolean; local: boolean};
  } {
    return {
      ocr: {
        baidu: baiduOcrService.isAvailable(),
        local: true, // 始终可用
      },
      generation: {
        deepseek: deepseekService.isAvailable(),
        local: localQuestionGenerator.isAvailable(),
      },
    };
  }

  /**
   * 获取使用统计
   */
  getUsageStats(): {
    deepseek?: {tokens: number; limit: number; resetAt: Date};
    local: {available: boolean};
  } {
    const stats: any = {
      local: {available: localQuestionGenerator.isAvailable()},
    };

    if (deepseekService.isAvailable()) {
      stats.deepseek = deepseekService.getUsage();
    }

    return stats;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    deepseekService.clearCache();
    console.log('[AIService] All caches cleared');
  }
}

// 导出单例实例
export const aiService = new AIService();
export default aiService;
