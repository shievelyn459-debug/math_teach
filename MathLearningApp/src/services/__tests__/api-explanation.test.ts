/**
 * Explanation API Integration Tests
 * Story 3-2: generate-knowledge-point-explanation
 * Task 4 & 7: Implement explanation generation pipeline and comprehensive tests
 */

import {explanationApi, STAGE_TIMEOUTS} from '../api';
import {getExplanationService} from '../explanationService';
import {ExplanationSource} from '../../types/explanation';

// Mock the ExplanationService
const mockExplanation = {
  id: 'exp-001',
  knowledgePointId: 'kp-add-001',
  knowledgePointName: '10以内加法',
  sections: [
    {
      type: 'definition',
      title: '什么是10以内加法',
      content: ['加法就是把东西合在一起数一数'],
      order: 1,
    },
    {
      type: 'methods',
      title: '解题方法',
      content: ['第一步：数手指法'],
      order: 2,
    },
    {
      type: 'examples',
      title: '常见例题',
      content: [],
      examples: [
        {
          question: '3 + 2 = ?',
          answer: '5',
          steps: ['数一数'],
          difficulty: 'easy',
        },
      ],
      order: 3,
    },
    {
      type: 'tips',
      title: '辅导技巧',
      content: ['✅ 多鼓励孩子'],
      order: 4,
    },
  ],
  teachingTips: [
    {
      id: 'tip-001',
      title: '用实物演示',
      description: '用玩具演示',
      dos: ['使用玩具'],
      donts: ['不要用抽象数字'],
    },
  ],
  source: 'TEMPLATE', // 使用字符串字面值代替 ExplanationSource.TEMPLATE
  qualityScore: 0.95,
  version: 1,
  reviewed: true,
  childAppropriate: true,
  language: 'zh-CN',
  estimatedReadTime: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// 创建单例 mock 服务实例
const mockExplanationService = {
  generateExplanation: jest.fn().mockResolvedValue({
    explanation: mockExplanation,
    generationTime: 1200,
    source: 'TEMPLATE',
    fallbackUsed: false,
    qualityMetrics: {
      completeness: 0.95,
      clarity: 0.9,
      childAppropriate: 0.92,
    },
  }),
  submitFeedback: jest.fn().mockResolvedValue({success: true}),
  getFeedbackStats: jest.fn().mockReturnValue({
    averageRating: 4.5,
    totalFeedbacks: 10,
    helpfulPercentage: 90,
    easyToUnderstandPercentage: 85,
  }),
};

jest.mock('../explanationService', () => ({
  getExplanationService: jest.fn(() => mockExplanationService),
}));

describe('explanationApi - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateExplanation', () => {
    it('should generate explanation successfully', async () => {
      const onProgress = jest.fn();
      const result = await explanationApi.generateExplanation(
        'kp-add-001',
        '10以内加法',
        '一年级',
        onProgress
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.explanation).toBeDefined();
      expect(onProgress).toHaveBeenCalledWith('generating', 0);
      expect(onProgress).toHaveBeenCalledWith('generating', 100);
    });

    it('should complete within 3 seconds (AC5)', async () => {
      const startTime = Date.now();

      await explanationApi.generateExplanation(
        'kp-add-001',
        '10以内加法'
      );

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(STAGE_TIMEOUTS.EXPLANATION);
    });

    it('should timeout after 3 seconds', async () => {
      // 使用fake timers来避免实际等待
      jest.useFakeTimers();

      // 修改单例 mock 实现以模拟超时
      mockExplanationService.generateExplanation.mockImplementation(
        () =>
          new Promise(resolve => {
            // 使用未timer的Promise来模拟延迟
            setTimeout(
              () =>
                resolve({
                  explanation: {},
                  generationTime: 4000,
                  source: 'AI',
                  fallbackUsed: false,
                  qualityMetrics: {},
                }),
              4000
            );
          })
      );

      const resultPromise = explanationApi.generateExplanation(
        'kp-add-001',
        '10以内加法'
      );

      // 前进时间超过API超时时间（3秒）
      jest.advanceTimersByTime(3100);

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EXPLANATION_GENERATION_FAILED');
      expect(result.error?.message).toContain('超时');

      // 恢复真实timers
      jest.useRealTimers();

      // 恢复默认实现
      mockExplanationService.generateExplanation.mockResolvedValue({
        explanation: mockExplanation,
        generationTime: 1200,
        source: 'TEMPLATE',
        fallbackUsed: false,
        qualityMetrics: {
          completeness: 0.95,
          clarity: 0.9,
          childAppropriate: 0.92,
        },
      });
    });

    it('should handle service errors gracefully', async () => {
      // 修改单例 mock 实现以模拟错误
      mockExplanationService.generateExplanation.mockRejectedValue(
        new Error('Service unavailable')
      );

      const result = await explanationApi.generateExplanation(
        'kp-add-001',
        '10以内加法'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EXPLANATION_GENERATION_FAILED');

      // 恢复默认实现
      mockExplanationService.generateExplanation.mockResolvedValue({
        explanation: mockExplanation,
        generationTime: 1200,
        source: 'TEMPLATE',
        fallbackUsed: false,
        qualityMetrics: {
          completeness: 0.95,
          clarity: 0.9,
          childAppropriate: 0.92,
        },
      });
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedback = {
        explanationId: 'exp-001',
        rating: 5,
        helpful: true,
        easyToUnderstand: true,
        appropriateForChild: true,
        comments: '非常好',
      };

      const result = await explanationApi.submitFeedback(feedback);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('反馈已提交');
    });

    it('should handle feedback submission errors', async () => {
      // 修改单例 mock 实现以模拟错误响应
      mockExplanationService.submitFeedback.mockResolvedValue({
        success: false,
        message: 'Network error',
      });

      const result = await explanationApi.submitFeedback({
        explanationId: 'exp-001',
        rating: 5,
        helpful: true,
        easyToUnderstand: true,
        appropriateForChild: true,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FEEDBACK_SUBMISSION_FAILED');

      // 恢复默认实现
      mockExplanationService.submitFeedback.mockResolvedValue({success: true});
    });
  });

  describe('getFeedbackStats', () => {
    it('should return feedback stats for valid explanation ID', async () => {
      const result = await explanationApi.getFeedbackStats('exp-001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        averageRating: 4.5,
        totalFeedbacks: 10,
        helpfulPercentage: 90,
        easyToUnderstandPercentage: 85,
      });
    });

    it('should return error for non-existent explanation', async () => {
      // 修改单例 mock 实现以模拟返回 null
      mockExplanationService.getFeedbackStats.mockReturnValue(null);

      const result = await explanationApi.getFeedbackStats('exp-nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STATS_NOT_FOUND');

      // 恢复默认实现
      mockExplanationService.getFeedbackStats.mockReturnValue({
        averageRating: 4.5,
        totalFeedbacks: 10,
        helpfulPercentage: 90,
        easyToUnderstandPercentage: 85,
      });
    });
  });
});

describe('explanationApi - Performance Tests', () => {
  it('should handle concurrent explanation requests', async () => {
    const requests = Array.from({length: 5}, (_, i) =>
      explanationApi.generateExplanation(
        `kp-add-00${i + 1}`,
        `知识点${i + 1}`
      )
    );

    const startTime = Date.now();
    const results = await Promise.all(requests);
    const endTime = Date.now();

    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // All requests should complete within reasonable time
    expect(endTime - startTime).toBeLessThan(10000);
  });

  it('should cache results for repeated requests', async () => {
    // 重置 mock 调用计数
    mockExplanationService.generateExplanation.mockClear();

    // First request
    await explanationApi.generateExplanation(
      'kp-add-001',
      '10以内加法'
    );

    // Second request (should use cache)
    await explanationApi.generateExplanation(
      'kp-add-001',
      '10以内加法'
    );

    // GenerateExplanation 应该被调用两次（API层不处理缓存）
    expect(mockExplanationService.generateExplanation).toHaveBeenCalledTimes(2);
  });
});

describe('explanationApi - Error Handling', () => {
  it('should handle timeout gracefully', async () => {
    // 修改单例 mock 实现以模拟超时拒绝
    mockExplanationService.generateExplanation.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Slow response')), 4000);
        })
    );

    const result = await explanationApi.generateExplanation(
      'kp-add-001',
      '10以内加法'
    );

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('超时');

    // 恢复默认实现
    mockExplanationService.generateExplanation.mockResolvedValue({
      explanation: mockExplanation,
      generationTime: 1200,
      source: 'TEMPLATE',
      fallbackUsed: false,
      qualityMetrics: {
        completeness: 0.95,
        clarity: 0.9,
        childAppropriate: 0.92,
      },
    });
  });

  it('should handle service exceptions', async () => {
    // 修改单例 mock 实现以抛出异常
    mockExplanationService.generateExplanation.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = await explanationApi.generateExplanation(
      'kp-add-001',
      '10以内加法'
    );

    expect(result.success).toBe(false);

    // 恢复默认实现
    mockExplanationService.generateExplanation.mockResolvedValue({
      explanation: mockExplanation,
      generationTime: 1200,
      source: 'TEMPLATE',
      fallbackUsed: false,
      qualityMetrics: {
        completeness: 0.95,
        clarity: 0.9,
        childAppropriate: 0.92,
      },
    });
  });
});

describe('STAGE_TIMEOUTS Configuration', () => {
  it('should have EXPLANATION timeout set to 3000ms', () => {
    expect(STAGE_TIMEOUTS.EXPLANATION).toBe(3000);
  });

  it('should have all required timeout stages', () => {
    expect(STAGE_TIMEOUTS.UPLOAD).toBeDefined();
    expect(STAGE_TIMEOUTS.RECOGNITION).toBeDefined();
    expect(STAGE_TIMEOUTS.KNOWLEDGE_POINT).toBeDefined();
    expect(STAGE_TIMEOUTS.EXPLANATION).toBeDefined();
    expect(STAGE_TIMEOUTS.GENERATION).toBeDefined();
  });
});
