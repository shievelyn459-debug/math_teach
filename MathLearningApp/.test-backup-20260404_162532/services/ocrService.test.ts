/**
 * ocrService 测试
 *
 * OCR服务测试
 * 测试图像文本提取和题目类型识别功能
 */

import { OCRService } from '../ocrService';
import { QuestionType } from '../../types';
import { ImagePreprocessor } from '../../utils/imagePreprocessor';

// Mock dependencies
jest.mock('../../utils/imagePreprocessor', () => ({
  ImagePreprocessor: {
    checkImageQuality: jest.fn(),
    prepareForOCR: jest.fn(),
  },
}));

describe('OCRService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== recognizeQuestionType 测试 ====================

  describe('recognizeQuestionType', () => {
    it('应该识别加法题目', async () => {
      const text = '1 + 2 = ?';

      const result = await OCRService.recognizeQuestionType(text);

      expect(result.questionType).toBe(QuestionType.ADDITION);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('应该识别减法题目', async () => {
      const text = '5 - 3 = ?';

      const result = await OCRService.recognizeQuestionType(text);

      expect(result.questionType).toBe(QuestionType.SUBTRACTION);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('应该识别应用题', async () => {
      const text = '原来有3个苹果，吃了1个，还剩多少个？';

      const result = await OCRService.recognizeQuestionType(text);

      expect(result.questionType).toBe(QuestionType.WORD_PROBLEM);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('应该识别中文加法题目', async () => {
      const text = '二加三等于多少？';

      const result = await OCRService.recognizeQuestionType(text);

      expect(result.questionType).toBe(QuestionType.ADDITION);
    });

    it('应该识别中文减法题目', async () => {
      const text = '十减五等于多少？';

      const result = await OCRService.recognizeQuestionType(text);

      expect(result.questionType).toBe(QuestionType.SUBTRACTION);
    });

    it('应该处理低置信度情况', async () => {
      const text = 'xyz abc def';

      const result = await OCRService.recognizeQuestionType(text);

      // 应该有一个默认类型
      expect(result.questionType).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('应该返回关键词', async () => {
      const text = '1 + 2 = 3';

      const result = await OCRService.recognizeQuestionType(text);

      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
    });
  });

  // ==================== validateExtractedText 测试 ====================

  describe('validateExtractedText', () => {
    it('应该验证有效的提取文本', () => {
      const validText = '1 + 2 = ？';  // 使用中文问号

      const result = OCRService.validateExtractedText(validText);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('应该检测缺少数字', () => {
      const textWithoutNumbers = '加法等于多少？';

      const result = OCRService.validateExtractedText(textWithoutNumbers);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('未检测到数字');
    });

    it('应该检测文本过短', () => {
      const shortText = '1+';

      const result = OCRService.validateExtractedText(shortText);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('提取的文本过短');
    });

    it('应该检测缺少运算符', () => {
      const textWithoutOperators = '12345';

      const result = OCRService.validateExtractedText(textWithoutOperators);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('未检测到运算符');
    });

    it('应该提供建议', () => {
      const invalidText = 'abc';

      const result = OCRService.validateExtractedText(invalidText);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  // ==================== getTypeKeywords 测试 ====================

  describe('getTypeKeywords', () => {
    it('应该返回加法关键词', () => {
      const keywords = OCRService.getTypeKeywords(QuestionType.ADDITION);

      expect(keywords).toContain('加');
      expect(keywords).toContain('plus');
      expect(keywords).toContain('+');
    });

    it('应该返回减法关键词', () => {
      const keywords = OCRService.getTypeKeywords(QuestionType.SUBTRACTION);

      expect(keywords).toContain('减');
      expect(keywords).toContain('minus');
      expect(keywords).toContain('-');
    });

    it('应该返回应用题关键词', () => {
      const keywords = OCRService.getTypeKeywords(QuestionType.WORD_PROBLEM);

      expect(keywords).toContain('原来');
      expect(keywords).toContain('买了');
      expect(keywords).toContain('分给');
    });
  });

  // ==================== processImage 测试 ====================

  describe('processImage', () => {
    it('应该处理图像并返回结果', async () => {
      (ImagePreprocessor.checkImageQuality as jest.Mock).mockResolvedValue({
        isGoodQuality: true,
        qualityScore: 0.9,
        issues: [],
      });

      (ImagePreprocessor.prepareForOCR as jest.Mock).mockResolvedValue({
        processedImage: 'processed-image-uri',
        extractedText: '1 + 2 = ?',
      });

      const result = await OCRService.processImage('image-uri', {
        checkQuality: true,
      });

      expect(result.extractedText).toBe('1 + 2 = ?');
      expect(result.questionType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.qualityInfo).toBeDefined();
    });

    it('应该处理图像质量检查失败的情况', async () => {
      (ImagePreprocessor.checkImageQuality as jest.Mock).mockResolvedValue({
        isGoodQuality: false,
        qualityScore: 0.3,
        issues: ['图片太模糊', '光线不足'],
      });

      const result = await OCRService.processImage('image-uri', {
        checkQuality: true,
      });

      expect(result.extractedText).toBe('');
      expect(result.confidence).toBe(0);
      expect(result.qualityInfo?.isGoodQuality).toBe(false);
    });

    it('应该跳过质量检查', async () => {
      (ImagePreprocessor.prepareForOCR as jest.Mock).mockResolvedValue({
        processedImage: 'processed-image-uri',
        extractedText: '5 - 3 = ?',
      });

      const result = await OCRService.processImage('image-uri', {
        checkQuality: false,
      });

      expect(result.extractedText).toBe('5 - 3 = ?');
      expect(result.qualityInfo).toBeUndefined();
    });

    it('应该处理处理错误', async () => {
      (ImagePreprocessor.prepareForOCR as jest.Mock).mockRejectedValue(new Error('Processing failed'));

      const result = await OCRService.processImage('image-uri');

      expect(result.extractedText).toBe('');
      expect(result.questionType).toBe(QuestionType.WORD_PROBLEM);
      expect(result.confidence).toBe(0);
    });
  });

  // ==================== 单例模式测试 ====================

  describe('Singleton Pattern', () => {
    it('应该返回相同的实例', () => {
      const instance1 = OCRService.getInstance();
      const instance2 = OCRService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
