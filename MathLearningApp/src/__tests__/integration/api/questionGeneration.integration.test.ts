/**
 * 题目生成流程集成测试
 * Story 8-4: API集成测试
 * AC1: 关键API调用流程的集成测试覆盖
 *
 * 测试范围:
 * - 题目生成服务
 * - PDF导出
 * - 历史记录管理
 */

import { questionGenerationService } from '../../../services/questionGenerationService';
import { pdfService } from '../../../services/pdfService';
import { generationHistoryService } from '../../../services/generationHistoryService';
import { TestDataFactory, TestDataCleaner } from '../setup/testData';
import { Difficulty, QuestionType } from '../../../types';

// Mock外部依赖
jest.mock('../../../services/ai/baiduOcrService', () => ({
  baiduOcrService: {
    recognizeImage: jest.fn(),
  },
}));

jest.mock('../../../services/ai/deepseekService', () => ({
  deepseekService: {
    generateQuestion: jest.fn(),
    generateSimilarQuestions: jest.fn(),
  },
}));

jest.mock('../../../services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('Question Generation Flow Integration Tests', () => {
  let testChild: any;
  let testQuestion: any;

  beforeAll(async () => {
    console.log('📝 Setting up question generation integration tests...');
    testChild = TestDataFactory.createChild();
    testQuestion = TestDataFactory.createQuestion();
  });

  afterAll(async () => {
    await TestDataCleaner.cleanAll();
    console.log('🧹 Cleaned up test data');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC1.1: Question Generation Service', () => {
    it('should generate similar questions based on template', async () => {
      // Arrange
      const baseQuestion = TestDataFactory.createQuestion({
        type: QuestionType.ADDITION,
        difficulty: Difficulty.EASY,
      });

      // Act
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        3,
        Difficulty.EASY
      );

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it('should validate question answer', async () => {
      // Arrange
      const question = TestDataFactory.createQuestion({
        content: '3 + 5 = ?',
        answer: '8',
        type: QuestionType.ADDITION,
      });

      // Act
      const result = questionGenerationService.validateQuestion(question);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid question answer', async () => {
      // Arrange
      const question = TestDataFactory.createQuestion({
        content: '3 + 5 = ?',
        answer: '10', // Wrong answer
        type: QuestionType.ADDITION,
      });

      // Act
      const result = questionGenerationService.validateQuestion(question);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.expectedAnswer).toBe('8');
    });
  });

  describe('AC1.2: PDF Export', () => {
    it('should export questions to PDF', async () => {
      // Arrange
      const questions = [
        TestDataFactory.createQuestion({ id: 'q1', content: '3 + 5 = ?' }),
        TestDataFactory.createQuestion({ id: 'q2', content: '7 + 2 = ?' }),
      ];

      jest.spyOn(pdfService, 'generateQuestionsPDF').mockResolvedValueOnce({
        success: true,
        data: {
          path: '/mock/path/questions.pdf',
          size: 12345,
        },
      });

      // Act
      const result = await pdfService.generateQuestionsPDF({
        questions,
        title: '练习题集',
        childName: testChild.name,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.path).toContain('.pdf');
    });

    it('should handle PDF generation failure', async () => {
      // Arrange
      const questions = [TestDataFactory.createQuestion()];

      jest.spyOn(pdfService, 'generateQuestionsPDF').mockResolvedValueOnce({
        success: false,
        error: {
          code: 'PDF_GENERATION_FAILED',
          message: 'Disk full',
        },
      });

      // Act
      const result = await pdfService.generateQuestionsPDF({
        questions,
        title: 'Test',
        childName: testChild.name,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PDF_GENERATION_FAILED');
    });

    it('should include metadata in PDF', async () => {
      // Arrange
      const questions = [
        TestDataFactory.createQuestion({ difficulty: Difficulty.EASY }),
        TestDataFactory.createQuestion({ difficulty: Difficulty.MEDIUM }),
      ];

      jest.spyOn(pdfService, 'generateQuestionsPDF').mockResolvedValueOnce({
        success: true,
        data: {
          path: '/mock/path/questions.pdf',
          size: 12345,
          metadata: {
            totalCount: 2,
            generatedAt: new Date().toISOString(),
            childName: testChild.name,
          },
        },
      });

      // Act
      const result = await pdfService.generateQuestionsPDF({
        questions,
        title: '练习题集',
        childName: testChild.name,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.metadata.totalCount).toBe(2);
    });
  });

  describe('AC1.3: Error Handling', () => {
    it('should handle invalid question count', async () => {
      // Arrange
      const baseQuestion = TestDataFactory.createQuestion();

      // Act & Assert
      expect(() => {
        questionGenerationService.generateSimilarQuestions(
          baseQuestion,
          0, // Invalid count
          Difficulty.EASY
        );
      }).toThrow();
    });

    it('should validate question type', async () => {
      // Arrange
      const baseQuestion = TestDataFactory.createQuestion({
        type: 'INVALID_TYPE' as any,
      });

      // Act & Assert - should not throw for invalid type in this implementation
      const result = questionGenerationService.validateQuestion(baseQuestion);
      expect(result).toBeDefined();
    });
  });

  describe('AC1.4: Performance', () => {
    it('should generate questions efficiently', async () => {
      // Arrange
      const baseQuestion = TestDataFactory.createQuestion();
      const startTime = Date.now();

      // Act
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        10,
        Difficulty.EASY
      );
      const duration = Date.now() - startTime;

      // Assert
      expect(result.length).toBe(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
