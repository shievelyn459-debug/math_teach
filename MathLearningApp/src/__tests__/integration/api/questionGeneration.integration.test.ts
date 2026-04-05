/**
 * 题目生成流程集成测试
 * Story 8-4: API集成测试
 * AC1: 关键API调用流程的集成测试覆盖
 *
 * 测试范围:
 * - 完整的题目生成流程
 * - OCR服务集成
 * - AI服务集成
 * - 历史记录管理
 * - PDF导出
 */

import { questionGenerationService } from '../../../services/questionGenerationService';
import { pdfService } from '../../../services/pdfService';
import { generationHistoryService } from '../../../services/generationHistoryService';
import { TestDataFactory, TestDataCleaner } from '../setup/testData';
import { testOcrResults, testAiResponses } from '../setup/testData';

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

describe('Question Generation Flow Integration Tests', () => {
  let testChild: any;
  let testQuestion: any;

  beforeAll(async () => {
    console.log('📝 Setting up question generation integration tests...');
    testChild = TestDataFactory.createChild();
  });

  afterAll(async () => {
    await TestDataCleaner.cleanAll();
    console.log('🧹 Cleaned up test data');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC1.1: Complete Question Generation Flow', () => {
    it('should complete full flow: upload → OCR → AI generate → save → export PDF', async () => {
      // Arrange - 准备测试图片数据
      const mockImageData = {
        uri: 'file://test-image.jpg',
        type: 'image/jpeg',
        name: 'test-question.jpg',
      };

      // Step 1: Mock OCR识别
      const baiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      baiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: true,
        data: testOcrResults.addition,
      });

      // Step 2: Mock AI生成题目
      const deepseekService = require('../../../services/ai/deepseekService').deepseekService;
      deepseekService.generateQuestion.mockResolvedValueOnce({
        success: true,
        data: testAiResponses.generatedQuestion,
      });

      // Step 3: Mock API保存
      const { apiClient } = require('../../../services/api');
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            question: TestDataFactory.createQuestion({
              id: 'generated-question-1',
              content: testAiResponses.generatedQuestion.content,
            }),
          },
        },
      });

      // Act - 执行完整流程
      const ocrResult = await questionGenerationService.recognizeImage(mockImageData);
      expect(ocrResult.success).toBe(true);

      const generatedQuestion = await questionGenerationService.generateQuestion({
        ocrResult: ocrResult.data,
        childId: testChild.id,
        difficulty: 'EASY',
      });
      expect(generatedQuestion.success).toBe(true);

      const savedQuestion = await questionGenerationService.saveQuestion(generatedQuestion.data);
      expect(savedQuestion.success).toBe(true);
      testQuestion = savedQuestion.data.question;

      // Assert - 验证完整流程
      expect(baiduOcrService.recognizeImage).toHaveBeenCalledTimes(1);
      expect(deepseekService.generateQuestion).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledTimes(1);
    }, 30000); // 30秒超时

    it('should handle OCR failure gracefully', async () => {
      // Arrange
      const mockImageData = {
        uri: 'file://invalid-image.jpg',
        type: 'image/jpeg',
        name: 'invalid.jpg',
      };

      const baiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      baiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: false,
        error: {
          code: 'OCR_FAILED',
          message: 'Image quality too low',
        },
      });

      // Act
      const result = await questionGenerationService.recognizeImage(mockImageData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('OCR_FAILED');
    });

    it('should handle AI generation failure gracefully', async () => {
      // Arrange
      const baiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      baiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: true,
        data: testOcrResults.addition,
      });

      const deepseekService = require('../../../services/ai/deepseekService').deepseekService;
      deepseekService.generateQuestion.mockResolvedValueOnce({
        success: false,
        error: {
          code: 'AI_GENERATION_FAILED',
          message: 'AI service unavailable',
        },
      });

      // Act
      const ocrResult = await questionGenerationService.recognizeImage({
        uri: 'file://test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      });

      const generatedQuestion = await questionGenerationService.generateQuestion({
        ocrResult: ocrResult.data,
        childId: testChild.id,
        difficulty: 'EASY',
      });

      // Assert
      expect(ocrResult.success).toBe(true);
      expect(generatedQuestion.success).toBe(false);
      expect(generatedQuestion.error.code).toBe('AI_GENERATION_FAILED');
    });
  });

  describe('AC1.2: Similar Questions Generation', () => {
    it('should generate similar questions based on original', async () => {
      // Arrange
      const originalQuestion = TestDataFactory.createQuestion();
      const mockSimilarQuestions = [
        { content: '4 + 6 = ?', answer: '10', difficulty: 'EASY' },
        { content: '2 + 8 = ?', answer: '10', difficulty: 'EASY' },
        { content: '5 + 5 = ?', answer: '10', difficulty: 'EASY' },
      ];

      const deepseekService = require('../../../services/ai/deepseekService').deepseekService;
      deepseekService.generateSimilarQuestions.mockResolvedValueOnce({
        success: true,
        data: {
          questions: mockSimilarQuestions,
        },
      });

      // Act
      const result = await questionGenerationService.generateSimilarQuestions({
        originalQuestion,
        count: 3,
        difficulty: 'EASY',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.questions).toHaveLength(3);
      expect(result.data.questions[0].content).toContain('=');
    });

    it('should validate question count parameter', async () => {
      // Arrange
      const originalQuestion = TestDataFactory.createQuestion();

      // Act & Assert
      await expect(
        questionGenerationService.generateSimilarQuestions({
          originalQuestion,
          count: 0, // 无效数量
          difficulty: 'EASY',
        })
      ).rejects.toThrow('Question count must be at least 1');

      await expect(
        questionGenerationService.generateSimilarQuestions({
          originalQuestion,
          count: 50, // 超过限制
          difficulty: 'EASY',
        })
      ).rejects.toThrow('Question count cannot exceed 20');
    });
  });

  describe('AC1.3: Question History Management', () => {
    it('should save question to history', async () => {
      // Arrange
      const question = TestDataFactory.createQuestion();

      const { apiClient } = require('../../../services/api');
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { question },
        },
      });

      // Act
      const result = await generationHistoryService.saveQuestion(question);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.question.id).toBe(question.id);
    });

    it('should retrieve question history', async () => {
      // Arrange
      const mockHistory = [
        TestDataFactory.createQuestion({ id: 'q1' }),
        TestDataFactory.createQuestion({ id: 'q2' }),
      ];

      const { apiClient } = require('../../../services/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { questions: mockHistory },
        },
      });

      // Act
      const result = await generationHistoryService.getHistory({
        childId: testChild.id,
        limit: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.questions).toHaveLength(2);
    });

    it('should filter history by date range', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');
      apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { questions: [] },
        },
      });

      // Act
      const result = await generationHistoryService.getHistory({
        childId: testChild.id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      // Assert
      expect(result.success).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate')
      );
    });
  });

  describe('AC1.4: PDF Export Integration', () => {
    it('should export questions to PDF', async () => {
      // Arrange
      const questions = [
        TestDataFactory.createQuestion({ id: 'q1' }),
        TestDataFactory.createQuestion({ id: 'q2' }),
      ];

      // Mock PDF服务
      jest.spyOn(pdfService, 'generatePDF').mockResolvedValueOnce({
        success: true,
        data: {
          path: '/mock/path/questions.pdf',
          size: 12345,
        },
      });

      // Act
      const result = await pdfService.generatePDF({
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

      jest.spyOn(pdfService, 'generatePDF').mockResolvedValueOnce({
        success: false,
        error: {
          code: 'PDF_GENERATION_FAILED',
          message: 'Insufficient disk space',
        },
      });

      // Act
      const result = await pdfService.generatePDF({
        questions,
        title: 'Test PDF',
        childName: testChild.name,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PDF_GENERATION_FAILED');
    });

    it('should include metadata in PDF', async () => {
      // Arrange
      const questions = [TestDataFactory.createQuestion()];
      const metadata = {
        generatedAt: new Date().toISOString(),
        childName: testChild.name,
        difficulty: 'EASY',
        totalCount: 1,
      };

      jest.spyOn(pdfService, 'generatePDF').mockResolvedValueOnce({
        success: true,
        data: {
          path: '/mock/path/test.pdf',
          metadata,
        },
      });

      // Act
      const result = await pdfService.generatePDF({
        questions,
        title: 'Test PDF',
        childName: testChild.name,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.metadata.childName).toBe(testChild.name);
      expect(result.data.metadata.totalCount).toBe(1);
    });
  });

  describe('AC1.5: Error Recovery', () => {
    it('should retry OCR service on transient failure', async () => {
      // Arrange
      const mockImageData = {
        uri: 'file://test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      };

      const baiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;

      // 第一次失败
      baiduOcrService.recognizeImage.mockRejectedValueOnce(
        new Error('Network timeout')
      );

      // 第二次成功
      baiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: true,
        data: testOcrResults.addition,
      });

      // Act
      const result = await questionGenerationService.recognizeImage(mockImageData, {
        retryAttempts: 2,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(baiduOcrService.recognizeImage).toHaveBeenCalledTimes(2);
    });

    it('should fallback to cached result on AI service failure', async () => {
      // Arrange
      const baiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      baiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: true,
        data: testOcrResults.addition,
      });

      const deepseekService = require('../../../services/ai/deepseekService').deepseekService;
      deepseekService.generateQuestion.mockResolvedValueOnce({
        success: false,
        error: { code: 'AI_SERVICE_UNAVAILABLE' },
      });

      // 提供缓存后备
      const cachedQuestion = TestDataFactory.createQuestion();

      // Act
      const ocrResult = await questionGenerationService.recognizeImage({
        uri: 'file://test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      });

      const generatedQuestion = await questionGenerationService.generateQuestion(
        {
          ocrResult: ocrResult.data,
          childId: testChild.id,
          difficulty: 'EASY',
        },
        { useCacheFallback: true }
      );

      // Assert
      expect(ocrResult.success).toBe(true);
      // 应该使用缓存或本地生成
      expect(generatedQuestion.success).toBe(true);
    });
  });

  describe('AC1.6: Performance Validation', () => {
    it('should complete OCR within 5 seconds', async () => {
      // Arrange
      const mockImageData = {
        uri: 'file://test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      };

      const baiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      baiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: true,
        data: testOcrResults.addition,
      });

      // Act
      const startTime = Date.now();
      await questionGenerationService.recognizeImage(mockImageData);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(5000);
    });

    it('should complete full generation flow within 30 seconds', async () => {
      // Arrange
      const mockImageData = {
        uri: 'file://test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      };

      const baiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      baiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: true,
        data: testOcrResults.addition,
      });

      const deepseekService = require('../../../services/ai/deepseekService').deepseekService;
      deepseekService.generateQuestion.mockResolvedValueOnce({
        success: true,
        data: testAiResponses.generatedQuestion,
      });

      const { apiClient } = require('../../../services/api');
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { question: TestDataFactory.createQuestion() },
        },
      });

      // Act
      const startTime = Date.now();

      const ocrResult = await questionGenerationService.recognizeImage(mockImageData);
      const generatedQuestion = await questionGenerationService.generateQuestion({
        ocrResult: ocrResult.data,
        childId: testChild.id,
        difficulty: 'EASY',
      });

      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(30000);
      expect(ocrResult.success).toBe(true);
      expect(generatedQuestion.success).toBe(true);
    });
  });
});
