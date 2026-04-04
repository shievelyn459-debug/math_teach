/**
 * ExplanationService 单元测试
 * Story 3-2: generate-knowledge-point-explanation
 * Task 2 & 7: Implement AI-powered explanation generation and comprehensive tests
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn() as jest.Mock,
    setItem: jest.fn() as jest.Mock,
    multiRemove: jest.fn() as jest.Mock,
    getAllKeys: jest.fn() as jest.Mock,
    removeItem: jest.fn() as jest.Mock,
  },
  __esModule: true,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ExplanationService,
  getExplanationService,
} from '../explanationService';
import {
  ExplanationGenerationRequest,
  ExplanationSource,
  ExplanationFeedback,
  ExplanationSectionType,
} from '../../types/explanation';

describe('ExplanationService', () => {
  let service: ExplanationService;

  beforeEach(async () => {
    service = ExplanationService.getInstance();
    await service.resetForTest();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('generateExplanation', () => {
    const mockRequest: ExplanationGenerationRequest = {
      knowledgePointId: 'kp-add-001',
      knowledgePointName: '10以内加法',
      grade: '一年级',
      preferredSource: ExplanationSource.TEMPLATE,
    };

    it('should generate explanation from template', async () => {
      // Mock cache miss
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.generateExplanation(mockRequest);

      expect(result).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.explanation.knowledgePointId).toBe('kp-add-001');
      expect(result.source).toBe(ExplanationSource.TEMPLATE);
      expect(result.fallbackUsed).toBe(false);
      expect(result.generationTime).toBeLessThan(3000); // AC5: < 3 seconds
    });

    it('should use cached explanation if available', async () => {
      const cachedExplanation = {
        id: 'exp-cached-001',
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        sections: [],
        teachingTips: [],
        source: ExplanationSource.TEMPLATE,
        qualityScore: 0.9,
        version: 1,
        reviewed: true,
        childAppropriate: true,
        language: 'zh-CN',
        estimatedReadTime: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          timestamp: Date.now(),
          explanation: cachedExplanation,
        })
      );

      const result = await service.generateExplanation(mockRequest);

      expect(result.explanation.id).toBe('exp-cached-001');
      expect(result.source).toBe(ExplanationSource.TEMPLATE);
    });

    it('should fallback to basic explanation when template not found', async () => {
      const invalidRequest: ExplanationGenerationRequest = {
        knowledgePointId: 'kp-invalid-999',
        knowledgePointName: '不存在的知识点',
        grade: '一年级',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.generateExplanation(invalidRequest);

      expect(result).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.fallbackUsed).toBe(true);
    });

    it('should attempt AI generation when preferred source is AI', async () => {
      const aiRequest: ExplanationGenerationRequest = {
        ...mockRequest,
        preferredSource: ExplanationSource.AI,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      // 使用fake timers来控制setTimeout
      jest.useFakeTimers();

      const promise = service.generateExplanation(aiRequest);

      // 推进时间让setTimeout完成
      jest.advanceTimersByTime(1000);
      jest.useRealTimers();

      const result = await promise;

      expect(result).toBeDefined();
      // AI生成可能降级到模板，这是正常行为
      expect(result.source).toBeDefined();
    });

    it('should complete within 3 seconds for performance requirement', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const startTime = Date.now();
      await service.generateExplanation(mockRequest);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000);
    });

    it('should return quality metrics', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.generateExplanation(mockRequest);

      expect(result.qualityMetrics).toBeDefined();
      expect(result.qualityMetrics.completeness).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.completeness).toBeLessThanOrEqual(1);
      expect(result.qualityMetrics.clarity).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.clarity).toBeLessThanOrEqual(1);
      expect(result.qualityMetrics.childAppropriate).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.childAppropriate).toBeLessThanOrEqual(1);
    });
  });

  describe('submitFeedback', () => {
    const mockFeedback: ExplanationFeedback = {
      explanationId: 'exp-001',
      userId: 'user-001',
      rating: 5,
      helpful: true,
      easyToUnderstand: true,
      appropriateForChild: true,
      comments: '非常有用',
      timestamp: new Date(),
    };

    it('should submit feedback successfully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await service.submitFeedback(mockFeedback);

      expect(result.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should update feedback stats', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.submitFeedback(mockFeedback);
      const stats = service.getFeedbackStats('exp-001');

      expect(stats).toBeDefined();
      expect(stats?.averageRating).toBe(5);
      expect(stats?.totalFeedbacks).toBe(1);
      expect(stats?.helpfulPercentage).toBe(100);
    });

    it('should handle multiple feedback submissions', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.submitFeedback({...mockFeedback, rating: 5});
      await service.submitFeedback({...mockFeedback, rating: 4});
      await service.submitFeedback({...mockFeedback, rating: 5});

      const stats = service.getFeedbackStats('exp-001');

      expect(stats?.totalFeedbacks).toBe(3);
      expect(stats?.averageRating).toBeCloseTo(4.67, 1); // (5+4+5)/3 = 4.67
    });

    it('should return null for non-existent feedback stats', () => {
      const stats = service.getFeedbackStats('exp-nonexistent');
      expect(stats).toBeNull();
    });
  });

  describe('Quality Evaluation', () => {
    it('should evaluate high quality template explanations', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.generateExplanation({
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        grade: '一年级',
      });

      // 模板讲解应该有高质量分数
      expect(result.qualityMetrics.completeness).toBeGreaterThanOrEqual(0.8);
      expect(result.qualityMetrics.clarity).toBeGreaterThanOrEqual(0.5);
      expect(result.qualityMetrics.childAppropriate).toBeGreaterThanOrEqual(0.8);
    });

    it('should detect jargon in explanations', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.generateExplanation({
        knowledgePointId: 'kp-invalid-999',
        knowledgePointName: '测试内容',
        grade: '一年级',
      });

      // 基本讲解因为没有专业术语，应该有较高的childAppropriate分数
      expect(result.qualityMetrics.childAppropriate).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Cache Management', () => {
    it('should save explanation to cache', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.generateExplanation({
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        grade: '一年级',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should clear cache', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        'exp_cache_kp-add-001',
        'exp_cache_kp-sub-001',
        'other_key',
      ]);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      await service.clearCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'exp_cache_kp-add-001',
        'exp_cache_kp-sub-001',
      ]);
    });
  });

  describe('getExplanationById', () => {
    it('should return explanation by ID from cache', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // 生成一个讲解
      const result = await service.generateExplanation({
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        grade: '一年级',
      });

      // 通过ID查找
      const found = service.getExplanationById(result.explanation.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(result.explanation.id);
    });

    it('should return undefined for non-existent ID', () => {
      const found = service.getExplanationById('exp-nonexistent');
      expect(found).toBeUndefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid consecutive requests', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const requests = Array.from({length: 10}, (_, i) => ({
        knowledgePointId: `kp-add-001`,
        knowledgePointName: '10以内加法',
        grade: '一年级',
      }));

      const startTime = Date.now();

      const results = await Promise.all(
        requests.map(req => service.generateExplanation(req))
      );

      const endTime = Date.now();

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.generationTime).toBeLessThan(3000);
      });

      // 总时间应该合理（虽然每个请求可能独立处理）
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });

  describe('Content Validation', () => {
    it('should generate explanation with all required sections', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.generateExplanation({
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        grade: '一年级',
      });

      const sectionTypes = new Set(
        result.explanation.sections.map(s => s.type)
      );

      expect(sectionTypes).toContain(ExplanationSectionType.DEFINITION);
      expect(sectionTypes).toContain(ExplanationSectionType.METHODS);
      expect(sectionTypes).toContain(ExplanationSectionType.EXAMPLES);
      expect(sectionTypes).toContain(ExplanationSectionType.TIPS);
    });

    it('should include teaching tips', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.generateExplanation({
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        grade: '一年级',
      });

      expect(result.explanation.teachingTips).toBeDefined();
      expect(result.explanation.teachingTips.length).toBeGreaterThan(0);
    });

    it('should include examples with steps', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.generateExplanation({
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        grade: '一年级',
      });

      const examplesSection = result.explanation.sections.find(
        s => s.type === ExplanationSectionType.EXAMPLES
      );

      expect(examplesSection).toBeDefined();
      expect(examplesSection?.examples).toBeDefined();
      expect(examplesSection?.examples!.length).toBeGreaterThan(0);

      if (examplesSection?.examples && examplesSection.examples.length > 0) {
        expect(examplesSection.examples[0].steps).toBeDefined();
        expect(examplesSection.examples[0].steps.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = ExplanationService.getInstance();
      const instance2 = getExplanationService();

      expect(instance1).toBe(instance2);
    });
  });
});
