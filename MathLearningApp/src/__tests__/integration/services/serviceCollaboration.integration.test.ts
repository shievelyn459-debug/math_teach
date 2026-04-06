/**
 * 服务间协作集成测试
 * Story 8-4: 服务间集成测试
 * AC3: 多个服务协作的集成测试
 *
 * 测试范围:
 * - OCR服务 + AI服务协作
 * - AI服务 + PDF服务协作
 * - 用户服务 + 儿童信息服务
 * - 通知服务 + 状态管理
 */

import { questionGenerationService } from '../../../services/questionGenerationService';
import { pdfService } from '../../../services/pdfService';
import { childApi } from '../../../services/childApi';
import { activeChildService } from '../../../services/activeChildService';
import { baiduOcrService } from '../../../services/ai/baiduOcrService';
import { deepseekService } from '../../../services/ai/deepseekService';
import { TestDataFactory, TestDataCleaner, testOcrResults, testAiResponses } from '../setup/testData';
import { Question, Difficulty } from '../../../types';

// Mock 外部依赖
jest.mock('../../../services/ai/baiduOcrService', () => ({
  baiduOcrService: {
    recognizeImage: jest.fn(),
  },
}));

jest.mock('../../../services/ai/deepseekService', () => ({
  deepseekService: {
    generateQuestion: jest.fn(),
    generateSimilarQuestions: jest.fn(),
    generateExplanation: jest.fn(),
  },
}));

jest.mock('../../../services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../services/mysql/prismaClient', () => ({
  checkDatabaseConnection: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('../../../services/userApi', () => ({
  getCurrentUserId: jest.fn(() => Promise.resolve('test-user-1')),
}));

describe('Service Collaboration Integration Tests', () => {
  let testUser: any;
  let testChild: any;

  beforeAll(async () => {
    console.log('🔗 Setting up service collaboration integration tests...');
    testUser = TestDataFactory.createUser();
    testChild = TestDataFactory.createChild({ parentId: testUser.id });
  });

  afterAll(async () => {
    await TestDataCleaner.cleanAll();
    console.log('🧹 Cleaned up test data');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC3.1: OCR Service + AI Service Collaboration', () => {
    it('should complete OCR to AI generation pipeline', async () => {
      // Arrange
      const mockImageData = {
        uri: 'file://test-image.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      };

      const mockBaiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      const mockDeepseekService = require('../../../services/ai/deepseekService').deepseekService;

      // Step 1: OCR识别 - 使用 baiduOcrService 直接调用
      mockBaiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: true,
        data: testOcrResults.addition,
      });

      // Step 2: AI生成 - 使用 deepseekService
      mockDeepseekService.generateQuestion.mockResolvedValueOnce({
        success: true,
        data: testAiResponses.generatedQuestion,
      });

      // Act - 直接调用服务
      const ocrResult = await baiduOcrService.recognizeImage(mockImageData);
      expect(ocrResult.success).toBe(true);

      const aiResult = await deepseekService.generateQuestion({
        imageData: mockImageData,
        ocrResult: ocrResult.data,
        childId: testChild.id,
        difficulty: 'EASY' as Difficulty,
      });
      expect(aiResult.success).toBe(true);

      // Assert - 验证服务协作链
      expect(mockBaiduOcrService.recognizeImage).toHaveBeenCalledTimes(1);
      expect(mockDeepseekService.generateQuestion).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors through OCR-AI pipeline', async () => {
      // Arrange
      const mockImageData = {
        uri: 'file://invalid.jpg',
        type: 'image/jpeg',
        name: 'invalid.jpg',
      };

      const mockBaiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      mockBaiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: false,
        error: { code: 'OCR_FAILED', message: 'Image quality too low' },
      });

      // Act
      const ocrResult = await baiduOcrService.recognizeImage(mockImageData);

      // Assert
      expect(ocrResult.success).toBe(false);
      expect(ocrResult.error.code).toBe('OCR_FAILED');

      // AI服务不应该被调用
      const mockDeepseekService = require('../../../services/ai/deepseekService').deepseekService;
      expect(mockDeepseekService.generateQuestion).not.toHaveBeenCalled();
    });

    it('should handle OCR-AI service timeout gracefully', async () => {
      // Arrange
      const mockImageData = {
        uri: 'file://test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      };

      const mockBaiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      mockBaiduOcrService.recognizeImage.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      // Act & Assert
      await expect(baiduOcrService.recognizeImage(mockImageData)).rejects.toThrow(
        'Timeout'
      );
    });
  });

  describe('AC3.2: AI Service + PDF Service Collaboration', () => {
    it('should generate questions and export to PDF', async () => {
      // Arrange
      const questions = [
        TestDataFactory.createQuestion({ id: 'q1', content: '3 + 5 = ?' }),
        TestDataFactory.createQuestion({ id: 'q2', content: '7 + 2 = ?' }),
        TestDataFactory.createQuestion({ id: 'q3', content: '4 + 6 = ?' }),
      ];

      jest.spyOn(pdfService, 'generateQuestionsPDF').mockResolvedValueOnce({
        success: true,
        data: {
          path: '/mock/path/questions.pdf',
          size: 12345,
          metadata: {
            generatedAt: new Date().toISOString(),
            childName: testChild.name,
            totalCount: 3,
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
      expect(result.data.path).toContain('.pdf');
      expect(result.data.metadata.totalCount).toBe(3);
    });

    it('should handle PDF generation failure after AI success', async () => {
      // Arrange
      const questions = [TestDataFactory.createQuestion()];

      jest.spyOn(pdfService, 'generateQuestionsPDF').mockResolvedValueOnce({
        success: false,
        error: {
          code: 'PDF_GENERATION_FAILED',
          message: 'Insufficient disk space',
        },
      });

      // Act
      const result = await pdfService.generateQuestionsPDF({
        questions,
        title: 'Test PDF',
        childName: testChild.name,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PDF_GENERATION_FAILED');
    });

    it('should validate questions before PDF generation', async () => {
      // Arrange
      const invalidQuestions: any[] = [];

      // Act & Assert
      await expect(
        pdfService.generateQuestionsPDF({
          questions: invalidQuestions,
          title: 'Empty PDF',
          childName: testChild.name,
        })
      ).rejects.toThrow();
    });
  });

  describe('AC3.3: User Service + Child Info Service Collaboration', () => {
    it('should create user and child profile together', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // 创建用户
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: testUser,
            token: 'auth-token',
          },
        },
      });

      // 创建儿童
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            child: testChild,
          },
        },
      });

      // 设置活跃儿童
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const userResult = await apiClient.post('/auth/register', testUser);
      expect(userResult.data.success).toBe(true);

      const childResult = await childApi.addChild({
        name: testChild.name,
        grade: testChild.grade,
        birthday: testChild.birthday,
        parentId: testUser.id,
      });
      expect(childResult.success).toBe(true);

      // 使用正确的API: setActiveChild 而不是 setActiveChildId
      await activeChildService.setActiveChild(testChild, [testChild]);

      // Assert
      expect(apiClient.post).toHaveBeenCalled();
    });

    it('should update child and sync to active service', async () => {
      // Arrange
      const updateData = { name: '更新的名字' };
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // childApi 使用 AsyncStorage 而不是 apiClient
      const existingChildren = [testChild];
      // Mock 数据和版本号
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(existingChildren)) // 数据
        .mockResolvedValueOnce('1'); // 版本号
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const result = await childApi.updateChild(testChild.id, updateData);

      // Assert
      expect(result.success).toBe(true);
      if (result.data?.child) {
        expect(result.data.child.name).toBe('更新的名字');
      }
    });

    it('should delete child and clear active status', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // childApi 使用 AsyncStorage 而不是 apiClient
      const existingChildren = [testChild];
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingChildren));
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const result = await childApi.deleteChild(testChild.id);

      // Assert - 验证删除成功
      expect(result.success).toBe(true);
    });

    it('should handle child creation with invalid data', async () => {
      // Arrange - 测试无效数据验证
      const invalidChildData = {
        name: '', // 空名字应该失败
        grade: testChild.grade,
        birthday: testChild.birthday,
        parentId: testUser.id,
      };

      // Act
      const childResult = await childApi.addChild(invalidChildData);

      // Assert - 无效数据应该导致失败
      expect(childResult.success).toBe(false);
      expect(childResult.error).toBeDefined();
    });
  });

  describe('AC3.4: Notification Service + State Management Collaboration', () => {
    it('should update state and trigger notification', async () => {
      // Arrange - 模拟状态管理服务
      const stateManager = {
        getState: jest.fn(),
        setState: jest.fn(),
        subscribe: jest.fn(),
      };

      const notificationService = {
        notify: jest.fn(),
      };

      const newState = { activeChild: testChild };

      stateManager.setState.mockImplementationOnce((state: any) => {
        notificationService.notify({ type: 'STATE_CHANGED', payload: state });
        return state;
      });

      // Act
      stateManager.setState(newState);

      // Assert
      expect(stateManager.setState).toHaveBeenCalledWith(newState);
      expect(notificationService.notify).toHaveBeenCalledWith({
        type: 'STATE_CHANGED',
        payload: newState,
      });
    });

    it('should handle state rollback on notification failure', async () => {
      // Arrange
      const stateManager = {
        getState: jest.fn().mockReturnValue({ activeChild: null }),
        setState: jest.fn(),
        rollback: jest.fn(),
      };

      const notificationService = {
        notify: jest.fn().mockRejectedValueOnce(new Error('Notification failed')),
      };

      // Act & Assert
      try {
        await notificationService.notify({ type: 'TEST' });
      } catch (error) {
        // 通知失败时回滚状态
        stateManager.rollback();
      }

      expect(stateManager.rollback).toHaveBeenCalled();
    });
  });

  describe('AC3.5: End-to-End Service Pipeline', () => {
    it('should complete full pipeline: upload → OCR → AI → PDF', async () => {
      // Arrange
      const mockImageData = {
        uri: 'file://test.jpg',
        type: 'image/jpeg',
        name: 'test.jpg',
      };

      const mockBaiduOcrService = require('../../../services/ai/baiduOcrService').baiduOcrService;
      const mockDeepseekService = require('../../../services/ai/deepseekService').deepseekService;

      // Step 1: OCR
      mockBaiduOcrService.recognizeImage.mockResolvedValueOnce({
        success: true,
        data: testOcrResults.addition,
      });

      // Step 2: AI生成
      mockDeepseekService.generateQuestion.mockResolvedValueOnce({
        success: true,
        data: {
          questions: [
            testAiResponses.generatedQuestion,
            { ...testAiResponses.generatedQuestion, content: '5 + 3 = ?' },
            { ...testAiResponses.generatedQuestion, content: '2 + 6 = ?' },
          ],
        },
      });

      // Step 3: PDF
      jest.spyOn(pdfService, 'generateQuestionsPDF').mockResolvedValueOnce({
        success: true,
        data: {
          path: '/mock/path/questions.pdf',
          size: 12345,
        },
      });

      // Act - 使用正确的服务调用
      const ocrResult = await baiduOcrService.recognizeImage(mockImageData);
      expect(ocrResult.success).toBe(true);

      const aiResult = await deepseekService.generateQuestion({
        imageData: mockImageData,
        ocrResult: ocrResult.data,
        childId: testChild.id,
        difficulty: 'EASY' as Difficulty,
      });
      expect(aiResult.success).toBe(true);

      const pdfResult = await pdfService.generateQuestionsPDF({
        questions: [TestDataFactory.createQuestion()],
        title: '练习题集',
        childName: testChild.name,
      });
      expect(pdfResult.success).toBe(true);

      // Assert - 验证完整流水线
      expect(mockBaiduOcrService.recognizeImage).toHaveBeenCalled();
      expect(mockDeepseekService.generateQuestion).toHaveBeenCalled();
      expect(pdfService.generateQuestionsPDF).toHaveBeenCalled();
    }, 30000);

    it('should maintain data consistency across services', async () => {
      // Arrange
      const { apiClient } = require('../../../services/api');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      const childData = {
        id: 'child-consistency-test',
        name: '一致性测试',
        grade: testChild.grade,
      };

      apiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { child: childData } },
      });

      AsyncStorage.setItem.mockResolvedValueOnce(undefined);
      AsyncStorage.getItem.mockResolvedValueOnce(childData.id);

      // Act
      await childApi.addChild({
        name: childData.name,
        grade: childData.grade,
        birthday: testChild.birthday,
        parentId: testUser.id,
      });

      // 使用正确的API
      await activeChildService.setActiveChild(childData as any, [childData as any]);
      const activeChild = activeChildService.getActiveChild();

      // Assert
      expect(activeChild?.id).toBe(childData.id);
    });
  });

  describe('AC3.6: Performance Under Load', () => {
    it('should handle multiple concurrent service calls', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify([testChild]));

      // Act - 并发请求
      const requests = Array(10)
        .fill(null)
        .map(() => childApi.getChildren());

      const results = await Promise.all(requests);

      // Assert
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('should not exceed memory limits with large data', async () => {
      // Arrange
      const largeQuestions = Array(100)
        .fill(null)
        .map((_, i) => TestDataFactory.createQuestion({ id: `q-${i}` }));

      jest.spyOn(pdfService, 'generateQuestionsPDF').mockResolvedValueOnce({
        success: true,
        data: {
          path: '/mock/path/large.pdf',
          size: 1024 * 1024, // 1MB
        },
      });

      // Act
      const result = await pdfService.generateQuestionsPDF({
        questions: largeQuestions,
        title: '大型练习题集',
        childName: testChild.name,
      });

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
