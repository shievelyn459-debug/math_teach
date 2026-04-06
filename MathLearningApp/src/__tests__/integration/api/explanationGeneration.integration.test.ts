/**
 * 知识点讲解生成流程集成测试
 * Story 8-4: API集成测试
 * AC1: 关键API调用流程的集成测试覆盖
 *
 * 测试范围:
 * - 完整的讲解生成流程
 * - 模板降级机制
 * - 缓存机制
 * - 反馈提交
 * - 质量评估
 */

import { ExplanationService, getExplanationService } from '../../../services/explanationService';
import { ExplanationSource, ExplanationFormat, ExplanationSectionType } from '../../../types/explanation';
import { TestDataFactory, TestDataCleaner } from '../setup/testData';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock 模板数据库
jest.mock('../../../database/explanations', () => ({
  getTemplateExplanationByKnowledgePointId: jest.fn(),
  validateTemplateExplanation: jest.fn(),
}));

describe('Explanation Generation Flow Integration Tests', () => {
  let explanationService: ExplanationService;
  let testChild: any;
  let testKnowledgePoint: any;

  beforeAll(async () => {
    console.log('📚 Setting up explanation generation integration tests...');
    testChild = TestDataFactory.createChild();
    testKnowledgePoint = {
      id: 'kp-addition-001',
      name: '加法运算',
      grade: '一年级',
    };
  });

  afterAll(async () => {
    await TestDataCleaner.cleanAll();
    console.log('🧹 Cleaned up test data');
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    explanationService = ExplanationService.getInstance();
    await explanationService.resetForTest();
  });

  describe('AC1.1: Complete Explanation Generation Flow', () => {
    it('should generate explanation from template successfully', async () => {
      // Arrange
      const mockTemplate = {
        id: 'exp-template-001',
        knowledgePointId: testKnowledgePoint.id,
        knowledgePointName: testKnowledgePoint.name,
        sections: [
          {
            type: ExplanationSectionType.DEFINITION,
            title: '什么是加法？',
            content: ['加法是把两个数合在一起，求总数。'],
            order: 1,
          },
          {
            type: ExplanationSectionType.METHODS,
            title: '学习方法',
            content: ['用手指计数', '画图理解'],
            order: 2,
          },
          {
            type: ExplanationSectionType.EXAMPLES,
            title: '例题',
            content: [],
            examples: [
              { question: '1 + 1 = ?', answer: '2', steps: [], difficulty: 'easy' },
            ],
            order: 3,
          },
          {
            type: ExplanationSectionType.TIPS,
            title: '辅导建议',
            content: ['多鼓励孩子'],
            order: 4,
          },
        ],
        teachingTips: [],
        source: ExplanationSource.TEMPLATE,
        qualityScore: 0.9,
        version: 1,
        reviewed: true,
        childAppropriate: true,
        language: 'zh-CN',
        estimatedReadTime: 5,
        availableFormats: [ExplanationFormat.TEXT],
        currentFormat: ExplanationFormat.TEXT,
        formatMetadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { getTemplateExplanationByKnowledgePointId, validateTemplateExplanation } =
        require('../../../database/explanations');
      getTemplateExplanationByKnowledgePointId.mockReturnValue(mockTemplate);
      validateTemplateExplanation.mockReturnValue({ valid: true, errors: [] });

      // Act
      const result = await explanationService.generateExplanation({
        knowledgePointId: testKnowledgePoint.id,
        knowledgePointName: testKnowledgePoint.name,
        grade: testKnowledgePoint.grade,
      });

      // Assert
      expect(result.explanation).toBeDefined();
      expect(result.explanation.knowledgePointId).toBe(testKnowledgePoint.id);
      expect(result.source).toBe(ExplanationSource.TEMPLATE);
      expect(result.fallbackUsed).toBe(false);
    }, 30000);

    it('should use fallback when template not found', async () => {
      // Arrange
      const { getTemplateExplanationByKnowledgePointId } = require('../../../database/explanations');
      getTemplateExplanationByKnowledgePointId.mockReturnValue(undefined);

      // Act
      const result = await explanationService.generateExplanation({
        knowledgePointId: 'unknown-kp-id',
        knowledgePointName: '未知知识点',
        grade: '一年级',
      });

      // Assert
      expect(result.explanation).toBeDefined();
      expect(result.fallbackUsed).toBe(true);
      expect(result.explanation.sections).toHaveLength(4);
    });

    it('should validate input parameters', async () => {
      // Arrange - 空的知识点ID
      const invalidRequest = {
        knowledgePointId: '',
        knowledgePointName: 'Test',
      };

      // Act & Assert
      await expect(
        explanationService.generateExplanation(invalidRequest)
      ).rejects.toThrow('Invalid knowledgePointId');

      // Arrange - 空的知识点名称
      const invalidRequest2 = {
        knowledgePointId: 'test-id',
        knowledgePointName: '',
      };

      // Act & Assert
      await expect(
        explanationService.generateExplanation(invalidRequest2)
      ).rejects.toThrow('Invalid knowledgePointName');
    });
  });

  describe('AC1.2: Cache Mechanism', () => {
    it('should cache generated explanation', async () => {
      // Arrange
      const mockTemplate = {
        id: 'exp-cache-test',
        knowledgePointId: 'kp-cache-001',
        knowledgePointName: '缓存测试',
        sections: [
          { type: ExplanationSectionType.DEFINITION, title: '定义', content: ['内容'], order: 1 },
          { type: ExplanationSectionType.METHODS, title: '方法', content: ['内容'], order: 2 },
          { type: ExplanationSectionType.EXAMPLES, title: '例题', content: [], examples: [], order: 3 },
          { type: ExplanationSectionType.TIPS, title: '建议', content: ['内容'], order: 4 },
        ],
        teachingTips: [],
        source: ExplanationSource.TEMPLATE,
        qualityScore: 0.9,
        version: 1,
        reviewed: true,
        childAppropriate: true,
        language: 'zh-CN',
        estimatedReadTime: 5,
        availableFormats: [ExplanationFormat.TEXT],
        currentFormat: ExplanationFormat.TEXT,
        formatMetadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { getTemplateExplanationByKnowledgePointId, validateTemplateExplanation } =
        require('../../../database/explanations');
      getTemplateExplanationByKnowledgePointId.mockReturnValue(mockTemplate);
      validateTemplateExplanation.mockReturnValue({ valid: true, errors: [] });

      // Act - 第一次调用
      const result1 = await explanationService.generateExplanation({
        knowledgePointId: 'kp-cache-001',
        knowledgePointName: '缓存测试',
        grade: '一年级',
      });

      // 第二次调用应该使用缓存
      const result2 = await explanationService.generateExplanation({
        knowledgePointId: 'kp-cache-001',
        knowledgePointName: '缓存测试',
        grade: '一年级',
      });

      // Assert
      expect(result1.explanation.id).toBe(result2.explanation.id);
      // 模板数据库应该只被调用一次（第二次使用缓存）
      expect(getTemplateExplanationByKnowledgePointId).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // Mock getAllKeys to return some cache keys with correct prefix
      AsyncStorage.getAllKeys.mockResolvedValueOnce([
        'exp_cache_kp-001',
        'exp_cache_kp-002',
      ]);

      // Act
      await explanationService.clearCache();

      // Assert
      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'exp_cache_kp-001',
        'exp_cache_kp-002',
      ]);
    });
  });

  describe('AC1.3: Feedback Submission', () => {
    it('should submit feedback successfully', async () => {
      // Arrange
      const feedback = {
        explanationId: 'exp-feedback-001',
        rating: 5,
        helpful: true,
        easyToUnderstand: true,
        comment: '讲解很清楚',
      };

      // Act
      const result = await explanationService.submitFeedback(feedback);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should track feedback statistics', async () => {
      // Arrange
      const explanationId = 'exp-stats-001';

      // 提交多个反馈
      await explanationService.submitFeedback({
        explanationId,
        rating: 5,
        helpful: true,
        easyToUnderstand: true,
      });

      await explanationService.submitFeedback({
        explanationId,
        rating: 4,
        helpful: true,
        easyToUnderstand: false,
      });

      // Act
      const stats = explanationService.getFeedbackStats(explanationId);

      // Assert
      expect(stats).not.toBeNull();
      expect(stats?.totalFeedbacks).toBe(2);
      expect(stats?.averageRating).toBe(4.5);
      expect(stats?.helpfulPercentage).toBe(100);
      expect(stats?.easyToUnderstandPercentage).toBe(50);
    });

    it('should return null for non-existent feedback stats', () => {
      // Act
      const stats = explanationService.getFeedbackStats('non-existent-id');

      // Assert
      expect(stats).toBeNull();
    });
  });

  describe('AC1.4: Quality Evaluation', () => {
    it('should evaluate explanation quality correctly', async () => {
      // Arrange - 高质量模板
      const highQualityTemplate = {
        id: 'exp-quality-001',
        knowledgePointId: 'kp-quality-001',
        knowledgePointName: '质量测试',
        sections: [
          { type: ExplanationSectionType.DEFINITION, title: '定义', content: ['简短的说明'], order: 1 },
          { type: ExplanationSectionType.METHODS, title: '方法', content: ['方法1', '方法2'], order: 2 },
          {
            type: ExplanationSectionType.EXAMPLES,
            title: '例题',
            content: [],
            examples: [
              { question: '1+1', answer: '2', steps: [], difficulty: 'easy' },
              { question: '2+2', answer: '4', steps: [], difficulty: 'easy' },
              { question: '3+3', answer: '6', steps: [], difficulty: 'easy' },
            ],
            order: 3,
          },
          { type: ExplanationSectionType.TIPS, title: '建议', content: ['建议1'], order: 4 },
        ],
        teachingTips: [],
        source: ExplanationSource.TEMPLATE,
        qualityScore: 0.9,
        version: 1,
        reviewed: true,
        childAppropriate: true,
        language: 'zh-CN',
        estimatedReadTime: 5,
        availableFormats: [ExplanationFormat.TEXT],
        currentFormat: ExplanationFormat.TEXT,
        formatMetadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { getTemplateExplanationByKnowledgePointId, validateTemplateExplanation } =
        require('../../../database/explanations');
      getTemplateExplanationByKnowledgePointId.mockReturnValue(highQualityTemplate);
      validateTemplateExplanation.mockReturnValue({ valid: true, errors: [] });

      // Act
      const result = await explanationService.generateExplanation({
        knowledgePointId: 'kp-quality-001',
        knowledgePointName: '质量测试',
        grade: '一年级',
      });

      // Assert
      expect(result.qualityMetrics).toBeDefined();
      expect(result.qualityMetrics.completeness).toBeGreaterThan(0.8);
      expect(result.qualityMetrics.clarity).toBeGreaterThan(0.5);
    });
  });

  describe('AC1.5: Concurrent Request Handling', () => {
    it('should handle concurrent requests for same knowledge point', async () => {
      // Arrange
      const mockTemplate = {
        id: 'exp-concurrent-001',
        knowledgePointId: 'kp-concurrent-001',
        knowledgePointName: '并发测试',
        sections: [
          { type: ExplanationSectionType.DEFINITION, title: '定义', content: ['内容'], order: 1 },
          { type: ExplanationSectionType.METHODS, title: '方法', content: ['内容'], order: 2 },
          { type: ExplanationSectionType.EXAMPLES, title: '例题', content: [], examples: [], order: 3 },
          { type: ExplanationSectionType.TIPS, title: '建议', content: ['内容'], order: 4 },
        ],
        teachingTips: [],
        source: ExplanationSource.TEMPLATE,
        qualityScore: 0.9,
        version: 1,
        reviewed: true,
        childAppropriate: true,
        language: 'zh-CN',
        estimatedReadTime: 5,
        availableFormats: [ExplanationFormat.TEXT],
        currentFormat: ExplanationFormat.TEXT,
        formatMetadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { getTemplateExplanationByKnowledgePointId, validateTemplateExplanation } =
        require('../../../database/explanations');
      getTemplateExplanationByKnowledgePointId.mockReturnValue(mockTemplate);
      validateTemplateExplanation.mockReturnValue({ valid: true, errors: [] });

      // Act - 同时发起多个请求
      const requests = Promise.all([
        explanationService.generateExplanation({
          knowledgePointId: 'kp-concurrent-001',
          knowledgePointName: '并发测试',
          grade: '一年级',
        }),
        explanationService.generateExplanation({
          knowledgePointId: 'kp-concurrent-001',
          knowledgePointName: '并发测试',
          grade: '一年级',
        }),
        explanationService.generateExplanation({
          knowledgePointId: 'kp-concurrent-001',
          knowledgePointName: '并发测试',
          grade: '一年级',
        }),
      ]);

      const results = await requests;

      // Assert - 所有请求都应该成功
      results.forEach((result) => {
        expect(result.explanation).toBeDefined();
        expect(result.explanation.knowledgePointId).toBe('kp-concurrent-001');
      });
    });
  });

  describe('AC1.6: Error Recovery', () => {
    it('should handle template validation failure gracefully', async () => {
      // Arrange
      const { getTemplateExplanationByKnowledgePointId, validateTemplateExplanation } =
        require('../../../database/explanations');

      getTemplateExplanationByKnowledgePointId.mockReturnValue({
        id: 'exp-invalid',
        sections: [], // 无效的模板
      });
      validateTemplateExplanation.mockReturnValue({
        valid: false,
        errors: ['Missing required sections'],
      });

      // Act
      const result = await explanationService.generateExplanation({
        knowledgePointId: 'kp-invalid',
        knowledgePointName: '无效模板测试',
        grade: '一年级',
      });

      // Assert - 应该使用降级方案
      expect(result.fallbackUsed).toBe(true);
      expect(result.explanation.sections).toHaveLength(4);
    });

    it('should handle cache read errors gracefully', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const { getTemplateExplanationByKnowledgePointId, validateTemplateExplanation } =
        require('../../../database/explanations');
      getTemplateExplanationByKnowledgePointId.mockReturnValue(undefined);

      // Act - 不应该抛出错误
      const result = await explanationService.generateExplanation({
        knowledgePointId: 'kp-storage-error',
        knowledgePointName: '存储错误测试',
        grade: '一年级',
      });

      // Assert
      expect(result.explanation).toBeDefined();
    });
  });

  describe('AC1.7: Performance Validation', () => {
    it('should generate explanation within acceptable time', async () => {
      // Arrange
      const { getTemplateExplanationByKnowledgePointId, validateTemplateExplanation } =
        require('../../../database/explanations');
      getTemplateExplanationByKnowledgePointId.mockReturnValue(undefined);

      // Act
      const startTime = Date.now();
      await explanationService.generateExplanation({
        knowledgePointId: 'kp-perf-001',
        knowledgePointName: '性能测试',
        grade: '一年级',
      });
      const duration = Date.now() - startTime;

      // Assert - 应该在1秒内完成（降级方案）
      expect(duration).toBeLessThan(1000);
    });
  });
});
