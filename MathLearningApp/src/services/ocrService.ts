import { QuestionType } from '../types';
import { ImagePreprocessor } from '../utils/imagePreprocessor';

/**
 * OCR服务 - 用于从图像中提取文本和识别题目类型
 */
export class OCRService {
  private static instance: OCRService;

  /**
   * 获取单例实例
   */
  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * 识别题目类型
   */
  static async recognizeQuestionType(
    extractedText: string
  ): Promise<{
    questionType: QuestionType;
    confidence: number;
    keywords: string[];
  }> {
    const text = extractedText.toLowerCase();
    const keywords: string[] = [];

    // 定义题型检测模式
    const typePatterns = {
      [QuestionType.ADDITION]: [
        /\+/g,
        /加/g,
        /plus/g,
        /和/g,
        /总和/g,
        /一共/g,
        /合计/g
      ],
      [QuestionType.SUBTRACTION]: [
        /-/g,
        /减/g,
        /minus/g,
        /差/g,
        /剩下/g,
        /剩余/g,
        /还剩/g
      ],
      [QuestionType.WORD_PROBLEM]: [
        /原来/g,
        /原来有/g,
        /买了/g,
        /卖了/g,
        /送给/g,
        /分给/g,
        /一共有/g,
        /还剩多少/g
      ]
    };

    let bestMatch: QuestionType = QuestionType.WORD_PROBLEM;
    let maxConfidence = 0;
    let foundKeywords: string[] = [];

    // 检查每种题型
    Object.entries(typePatterns).forEach(([type, patterns]) => {
      let matchCount = 0;
      const typeKeywords: string[] = [];

      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matchCount += matches.length;
          typeKeywords.push(pattern.toString());
        }
      });

      // 计算置信度
      const confidence = Math.min(matchCount / 2, 1); // 最多1.0的置信度

      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestMatch = type as QuestionType;
        foundKeywords = typeKeywords;
      }
    });

    // 如果没有找到明确的模式，使用启发式方法
    if (maxConfidence < 0.3) {
      // 检查是否包含数字和运算符
      const hasNumbers = /\d+/.test(text);
      const hasPlus = /\+/.test(text);
      const hasMinus = /-/.test(text);

      if (hasNumbers && hasPlus) {
        bestMatch = QuestionType.ADDITION;
        maxConfidence = 0.6;
      } else if (hasNumbers && hasMinus) {
        bestMatch = QuestionType.SUBTRACTION;
        maxConfidence = 0.6;
      } else {
        bestMatch = QuestionType.WORD_PROBLEM;
        maxConfidence = 0.4;
      }
    }

    // 如果置信度过低，提示用户手动选择
    if (maxConfidence < 0.5) {
      console.warn('Low confidence question type recognition:', {
        extractedText,
        confidence: maxConfidence,
        detectedType: bestMatch
      });
    }

    return {
      questionType: bestMatch,
      confidence: maxConfidence,
      keywords: foundKeywords
    };
  }

  /**
   * 处理图像并提取文本
   */
  static async processImage(
    imageUri: string,
    options: {
      enhance?: boolean;
      checkQuality?: boolean;
    } = {}
  ): Promise<{
    extractedText: string;
    questionType: QuestionType;
    confidence: number;
    qualityInfo?: {
      isGoodQuality: boolean;
      qualityScore: number;
      issues: string[];
    };
  }> {
    try {
      // 步骤1: 检查图像质量（如果需要）
      let qualityInfo;
      if (options.checkQuality) {
        qualityInfo = await ImagePreprocessor.checkImageQuality(imageUri);

        // 如果质量太差，直接返回错误
        if (!qualityInfo.isGoodQuality) {
          throw new Error(`Image quality is too poor: ${qualityInfo.issues.join(', ')}`);
        }
      }

      // 步骤2: 准备图像用于OCR
      const { processedImage, extractedText } = await ImagePreprocessor.prepareForOCR(
        imageUri,
        {
          brightness: 1.2,
          contrast: 1.1,
          sharpen: true,
          quality: 0.9
        }
      );

      // 步骤3: 识别题目类型
      const { questionType, confidence, keywords } = await this.recognizeQuestionType(
        extractedText
      );

      console.log('Question type recognition result:', {
        extractedText,
        questionType,
        confidence,
        keywords
      });

      return {
        extractedText,
        questionType,
        confidence,
        qualityInfo
      };
    } catch (error) {
      console.error('OCR processing failed:', error);

      // 返回默认值并记录错误
      return {
        extractedText: '',
        questionType: QuestionType.WORD_PROBLEM,
        confidence: 0,
        qualityInfo: options.checkQuality ? {
          isGoodQuality: false,
          qualityScore: 0,
          issues: [error instanceof Error ? error.message : 'Unknown error']
        } : undefined
      };
    }
  }

  /**
   * 验证提取的文本
   */
  static validateExtractedText(text: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查是否包含数字
    if (!/\d+/.test(text)) {
      issues.push('未检测到数字');
      suggestions.push('确保图像中的题目包含数字');
    }

    // 检查文本长度
    if (text.length < 3) {
      issues.push('提取的文本过短');
      suggestions.push('确保图像清晰且题目完整');
    }

    // 检查是否包含运算符
    if (!/[+\-×÷]/.test(text)) {
      issues.push('未检测到运算符');
      suggestions.push('确保运算符清晰可见');
    }

    // 检查特殊字符
    if (/[^\d\s+\-×÷=？]/.test(text)) {
      issues.push('检测到无法识别的字符');
      suggestions.push('避免在图像中包含无关文字');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * 获取题目类型的关键词列表
   */
  static getTypeKeywords(type: QuestionType): string[] {
    const keywordMap = {
      [QuestionType.ADDITION]: ['加', 'plus', '+', '和', '总和', '一共'],
      [QuestionType.SUBTRACTION]: ['减', 'minus', '-', '差', '剩下', '剩余'],
      [QuestionType.WORD_PROBLEM]: ['原来', '原来有', '买了', '卖了', '送给', '分给']
    };

    return keywordMap[type] || [];
  }
}