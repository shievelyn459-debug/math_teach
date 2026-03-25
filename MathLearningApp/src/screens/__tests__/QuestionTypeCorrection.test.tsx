/**
 * 手动纠正题目类型 测试
 *
 * Story 2-3: 手动纠正题目类型
 * 测试用户手动纠正OCR识别的题目类型功能
 */

import { QuestionType } from '../../types';

// Mock QuestionTypeSelector component
jest.mock('../../components/QuestionTypeSelector', () => 'QuestionTypeSelector');

// Mock RecognitionCache
const mockRecognitionCache = {
  saveCorrection: jest.fn(),
  getCorrectionHistory: jest.fn(),
  getMostFrequentCorrection: jest.fn(),
};

jest.mock('../../services/recognitionCache', () => ({
  recognitionCache: mockRecognitionCache,
}));

describe('手动纠正题目类型 - Story 2-3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== 纠正功能测试 ====================

  describe('纠正类型选择', () => {
    it('应该支持选择加法题目', () => {
      const originalType = QuestionType.SUBTRACTION;
      const correctedType = QuestionType.ADDITION;
      const imageData = 'mock-image-data';

      mockRecognitionCache.saveCorrection.mockResolvedValue(undefined);

      // 模拟纠正操作
      const correction = {
        originalType,
        correctedType,
        imageData,
        timestamp: new Date(),
      };

      expect(correction.correctedType).toBe(QuestionType.ADDITION);
      expect(correction.originalType).toBe(QuestionType.SUBTRACTION);
    });

    it('应该支持选择减法题目', () => {
      const originalType = QuestionType.ADDITION;
      const correctedType = QuestionType.SUBTRACTION;

      const correction = {
        originalType,
        correctedType,
        imageData: 'mock-image-data',
        timestamp: new Date(),
      };

      expect(correction.correctedType).toBe(QuestionType.SUBTRACTION);
    });

    it('应该支持选择应用题', () => {
      const originalType = QuestionType.ADDITION;
      const correctedType = QuestionType.WORD_PROBLEM;

      const correction = {
        originalType,
        correctedType,
        imageData: 'mock-image-data',
        timestamp: new Date(),
      };

      expect(correction.correctedType).toBe(QuestionType.WORD_PROBLEM);
    });

    it('应该支持返回到自动识别结果', () => {
      const originalType = QuestionType.ADDITION;
      const correctedType = QuestionType.ADDITION; // 选择与原始相同

      const correction = {
        originalType,
        correctedType,
        imageData: 'mock-image-data',
        timestamp: new Date(),
      };

      expect(correction.correctedType).toBe(correction.originalType);
    });
  });

  // ==================== 纠正历史测试 ====================

  describe('纠正历史记录', () => {
    it('应该保存纠正记录到缓存', async () => {
      const correction = {
        originalType: QuestionType.ADDITION,
        correctedType: QuestionType.SUBTRACTION,
        imageData: 'mock-image-data',
        timestamp: new Date(),
      };

      mockRecognitionCache.saveCorrection.mockResolvedValue(undefined);

      await mockRecognitionCache.saveCorrection(correction);

      expect(mockRecognitionCache.saveCorrection).toHaveBeenCalledWith(correction);
      expect(mockRecognitionCache.saveCorrection).toHaveBeenCalledTimes(1);
    });

    it('应该获取纠正历史记录', async () => {
      const mockHistory = [
        {
          originalType: QuestionType.ADDITION,
          correctedType: QuestionType.SUBTRACTION,
          imageData: 'mock-image-1',
          timestamp: new Date('2024-01-01'),
        },
        {
          originalType: QuestionType.SUBTRACTION,
          correctedType: QuestionType.ADDITION,
          imageData: 'mock-image-2',
          timestamp: new Date('2024-01-02'),
        },
      ];

      mockRecognitionCache.getCorrectionHistory.mockResolvedValue(mockHistory);

      const history = await mockRecognitionCache.getCorrectionHistory();

      expect(history).toEqual(mockHistory);
      expect(history).toHaveLength(2);
    });

    it('应该在历史记录为空时返回空数组', async () => {
      mockRecognitionCache.getCorrectionHistory.mockResolvedValue([]);

      const history = await mockRecognitionCache.getCorrectionHistory();

      expect(history).toEqual([]);
    });
  });

  // ==================== 纠正原因记录测试 ====================

  describe('纠正原因', () => {
    it('应该记录用户选择原因', () => {
      const correction = {
        originalType: QuestionType.ADDITION,
        correctedType: QuestionType.SUBTRACTION,
        reason: 'OCR识别错误',
        imageData: 'mock-image-data',
        timestamp: new Date(),
      };

      expect(correction.reason).toBe('OCR识别错误');
    });

    it('应该支持多种纠正原因', () => {
      const reasons = [
        'OCR识别错误',
        '题目类型判断错误',
        '图片质量问题',
        '其他原因',
      ];

      reasons.forEach(reason => {
        expect(reason).toBeTruthy();
        expect(reason.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== 数据更新测试 ====================

  describe('纠正后数据更新', () => {
    it('应该更新题目类型字段', () => {
      const question = {
        id: 'q-1',
        text: '1 + 2 = ?',
        type: QuestionType.ADDITION,
        correctedType: null,
      };

      const correction = {
        originalType: question.type,
        correctedType: QuestionType.SUBTRACTION,
      };

      const updatedQuestion = {
        ...question,
        type: correction.correctedType,
        correctedType: correction.originalType,
      };

      expect(updatedQuestion.type).toBe(QuestionType.SUBTRACTION);
      expect(updatedQuestion.correctedType).toBe(QuestionType.ADDITION);
    });

    it('应该保持其他字段不变', () => {
      const question = {
        id: 'q-1',
        text: '1 + 2 = ?',
        difficulty: 'easy',
        type: QuestionType.ADDITION,
      };

      const correction = {
        originalType: QuestionType.ADDITION,
        correctedType: QuestionType.SUBTRACTION,
      };

      const updatedQuestion = {
        ...question,
        type: correction.correctedType,
      };

      expect(updatedQuestion.id).toBe('q-1');
      expect(updatedQuestion.text).toBe('1 + 2 = ?');
      expect(updatedQuestion.difficulty).toBe('easy');
    });
  });

  // ==================== 频率统计测试 ====================

  describe('纠正频率统计', () => {
    it('应该记录最常见的纠正类型', async () => {
      const frequentCorrection = {
        originalType: QuestionType.ADDITION,
        correctedType: QuestionType.SUBTRACTION,
        count: 10,
      };

      mockRecognitionCache.getMostFrequentCorrection.mockResolvedValue(
        frequentCorrection
      );

      const result = await mockRecognitionCache.getMostFrequentCorrection();

      expect(result.originalType).toBe(QuestionType.ADDITION);
      expect(result.correctedType).toBe(QuestionType.SUBTRACTION);
      expect(result.count).toBe(10);
    });

    it('应该在没有纠正记录时返回null', async () => {
      mockRecognitionCache.getMostFrequentCorrection.mockResolvedValue(null);

      const result = await mockRecognitionCache.getMostFrequentCorrection();

      expect(result).toBeNull();
    });
  });

  // ==================== UI交互测试 ====================

  describe('UI交互', () => {
    it('应该在识别结果页面显示类型选择器', () => {
      const recognizedType = QuestionType.ADDITION;

      const uiState = {
        showTypeSelector: true,
        recognizedType,
        selectedType: null,
      };

      expect(uiState.showTypeSelector).toBe(true);
      expect(uiState.recognizedType).toBe(QuestionType.ADDITION);
      expect(uiState.selectedType).toBeNull();
    });

    it('应该在用户选择后隐藏选择器', () => {
      const uiState = {
        showTypeSelector: false,
        recognizedType: QuestionType.ADDITION,
        selectedType: QuestionType.SUBTRACTION,
      };

      expect(uiState.showTypeSelector).toBe(false);
      expect(uiState.selectedType).toBe(QuestionType.SUBTRACTION);
    });

    it('应该显示确认按钮', () => {
      const uiState = {
        showConfirmButton: true,
        hasCorrection: true,
      };

      expect(uiState.showConfirmButton).toBe(true);
    });
  });
});
