/**
 * Explanation Types 单元测试
 * Story 3-2: generate-knowledge-point-explanation
 * Task 1: Design explanation content structure
 */

import {
  ExplanationSource,
  ExplanationSectionType,
  Explanation,
  ExplanationSection,
  TeachingTip,
  ExplanationExample,
  ExplanationGenerationRequest,
  ExplanationGenerationResult,
  ExplanationFeedback,
  PARENT_FRIENDLY_LANGUAGE_GUIDELINES,
  CONTENT_STYLE_GUIDE,
} from '../explanation';

describe('Explanation Types', () => {
  describe('ExplanationSource Enum', () => {
    it('should have all expected sources', () => {
      expect(ExplanationSource.AI).toBe('ai');
      expect(ExplanationSource.TEMPLATE).toBe('template');
      expect(ExplanationSource.HYBRID).toBe('hybrid');
    });
  });

  describe('ExplanationSectionType Enum', () => {
    it('should have all expected section types', () => {
      expect(ExplanationSectionType.DEFINITION).toBe('definition');
      expect(ExplanationSectionType.METHODS).toBe('methods');
      expect(ExplanationSectionType.EXAMPLES).toBe('examples');
      expect(ExplanationSectionType.TIPS).toBe('tips');
    });
  });

  describe('Explanation Interface', () => {
    it('should create valid explanation object', () => {
      const explanation: Explanation = {
        id: 'exp-001',
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        sections: [
          {
            type: ExplanationSectionType.DEFINITION,
            title: '什么是10以内加法',
            content: ['加法就是把东西合在一起数一数'],
            order: 1,
          },
        ],
        teachingTips: [
          {
            id: 'tip-001',
            title: '用实物演示',
            description: '用孩子喜欢的玩具或食物来演示',
            dos: ['使用孩子熟悉的物品', '慢慢演示过程'],
            donts: ['不要一开始就用抽象数字', '不要急于求成'],
          },
        ],
        source: ExplanationSource.TEMPLATE,
        qualityScore: 0.95,
        version: 1,
        reviewed: true,
        childAppropriate: true,
        language: 'zh-CN',
        estimatedReadTime: 3,
        createdAt: new Date('2026-03-21'),
        updatedAt: new Date('2026-03-21'),
      };

      expect(explanation.id).toBe('exp-001');
      expect(explanation.sections).toHaveLength(1);
      expect(explanation.sections[0].type).toBe(ExplanationSectionType.DEFINITION);
      expect(explanation.teachingTips).toHaveLength(1);
      expect(explanation.qualityScore).toBeGreaterThanOrEqual(0);
      expect(explanation.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should have all required fields', () => {
      const partialExplanation: Partial<Explanation> = {
        id: 'exp-001',
        knowledgePointId: 'kp-add-001',
      };

      expect(partialExplanation.id).toBeDefined();
      expect(partialExplanation.knowledgePointId).toBeDefined();
    });
  });

  describe('ExplanationSection Interface', () => {
    it('should create valid section object', () => {
      const section: ExplanationSection = {
        type: ExplanationSectionType.EXAMPLES,
        title: '常见例题',
        content: ['例题1: 3 + 2 = ?'],
        examples: [
          {
            question: '3 + 2 = ?',
            answer: '5',
            steps: ['先数出3个', '再数出2个', '合起来数一数是5个'],
            difficulty: 'easy',
          },
        ],
        order: 3,
      };

      expect(section.type).toBe(ExplanationSectionType.EXAMPLES);
      expect(section.examples).toBeDefined();
      expect(section.examples).toHaveLength(1);
      expect(section.examples![0].steps).toHaveLength(3);
    });
  });

  describe('TeachingTip Interface', () => {
    it('should create valid teaching tip object', () => {
      const tip: TeachingTip = {
        id: 'tip-001',
        title: '鼓励为主',
        description: '多鼓励孩子，让孩子建立信心',
        dos: ['表扬孩子的努力', '赞美孩子的进步'],
        donts: ['不要批评错误', '不要和其他孩子比较'],
        practiceActivity: '每天练习10分钟，保持轻松愉快',
      };

      expect(tip.id).toBe('tip-001');
      expect(tip.dos).toBeDefined();
      expect(tip.dos).toHaveLength(2);
      expect(tip.donts).toBeDefined();
      expect(tip.donts).toHaveLength(2);
      expect(tip.practiceActivity).toBeDefined();
    });
  });

  describe('ExplanationGenerationRequest Interface', () => {
    it('should create valid generation request', () => {
      const request: ExplanationGenerationRequest = {
        knowledgePointId: 'kp-add-001',
        knowledgePointName: '10以内加法',
        grade: '一年级',
        preferredSource: ExplanationSource.TEMPLATE,
        questionText: '3 + 2 = ?',
        parentProfile: {
          experienceLevel: 'beginner',
          concerns: ['孩子不爱学习', '如何辅导'],
        },
      };

      expect(request.knowledgePointId).toBe('kp-add-001');
      expect(request.preferredSource).toBe(ExplanationSource.TEMPLATE);
      expect(request.parentProfile?.experienceLevel).toBe('beginner');
      expect(request.parentProfile?.concerns).toHaveLength(2);
    });
  });

  describe('ExplanationGenerationResult Interface', () => {
    it('should create valid generation result', () => {
      const mockExplanation: Explanation = {
        id: 'exp-001',
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

      const result: ExplanationGenerationResult = {
        explanation: mockExplanation,
        generationTime: 1200,
        source: ExplanationSource.TEMPLATE,
        fallbackUsed: false,
        qualityMetrics: {
          completeness: 0.95,
          clarity: 0.9,
          childAppropriate: 0.92,
        },
      };

      expect(result.generationTime).toBe(1200);
      expect(result.fallbackUsed).toBe(false);
      expect(result.qualityMetrics.completeness).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.completeness).toBeLessThanOrEqual(1);
    });
  });

  describe('ExplanationFeedback Interface', () => {
    it('should create valid feedback object', () => {
      const feedback: ExplanationFeedback = {
        explanationId: 'exp-001',
        userId: 'user-001',
        rating: 5,
        helpful: true,
        easyToUnderstand: true,
        appropriateForChild: true,
        comments: '非常有用，孩子很喜欢',
        suggestions: '可以增加更多图片',
        timestamp: new Date(),
      };

      expect(feedback.rating).toBeGreaterThanOrEqual(1);
      expect(feedback.rating).toBeLessThanOrEqual(5);
      expect(feedback.helpful).toBe(true);
      expect(feedback.comments).toBeDefined();
    });
  });
});

describe('PARENT_FRIENDLY_LANGUAGE_GUIDELINES', () => {
  it('should have preferred terms', () => {
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.preferredTerms).toBeDefined();
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.preferredTerms.length).toBeGreaterThan(0);
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.preferredTerms).toContain('孩子');
  });

  it('should have terms to avoid', () => {
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.avoidTerms).toBeDefined();
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.avoidTerms.length).toBeGreaterThan(0);
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.avoidTerms).toContain('加数');
  });

  it('should have analogies for different concepts', () => {
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.analogies).toBeDefined();
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.analogies.addition).toBeDefined();
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.analogies.subtraction).toBeDefined();
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.analogies.addition.length).toBeGreaterThan(0);
  });

  it('should have phrase templates', () => {
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.phraseTemplates).toBeDefined();
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.phraseTemplates.encouragement).toBeDefined();
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.phraseTemplates.guidance).toBeDefined();
    expect(PARENT_FRIENDLY_LANGUAGE_GUIDELINES.phraseTemplates.correction).toBeDefined();
  });
});

describe('CONTENT_STYLE_GUIDE', () => {
  it('should define target audience', () => {
    expect(CONTENT_STYLE_GUIDE.targetAudience).toBeDefined();
    expect(CONTENT_STYLE_GUIDE.targetAudience.ageRange).toBe('6-7岁');
    expect(CONTENT_STYLE_GUIDE.targetAudience.grade).toBe('一年级');
  });

  it('should define language style requirements', () => {
    expect(CONTENT_STYLE_GUIDE.languageStyle).toBeDefined();
    expect(CONTENT_STYLE_GUIDE.languageStyle.tone).toBe('亲切友好');
    expect(CONTENT_STYLE_GUIDE.languageStyle.complexity).toBe('简单易懂');
  });

  it('should define content structure requirements', () => {
    expect(CONTENT_STYLE_GUIDE.contentStructure).toBeDefined();
    expect(CONTENT_STYLE_GUIDE.contentStructure.definition.maxLength).toBe(200);
    expect(CONTENT_STYLE_GUIDE.contentStructure.methods.maxSteps).toBe(5);
    expect(CONTENT_STYLE_GUIDE.contentStructure.examples.minCount).toBe(3);
    expect(CONTENT_STYLE_GUIDE.contentStructure.tips.minCount).toBe(3);
  });

  it('should define quality standards', () => {
    expect(CONTENT_STYLE_GUIDE.qualityStandards).toBeDefined();
    expect(CONTENT_STYLE_GUIDE.qualityStandards.completeness).toBe(0.9);
    expect(CONTENT_STYLE_GUIDE.qualityStandards.clarity).toBe(0.85);
    expect(CONTENT_STYLE_GUIDE.qualityStandards.childAppropriate).toBe(0.9);
    expect(CONTENT_STYLE_GUIDE.qualityStandards.minQualityScore).toBe(0.8);
  });

  it('should validate example content against guidelines', () => {
    const exampleContent = '加法就是把东西合在一起数一数，像把苹果放在一起一样简单。';
    const wordCount = exampleContent.length;
    const maxDefinitionLength = CONTENT_STYLE_GUIDE.contentStructure.definition.maxLength;

    expect(wordCount).toBeLessThanOrEqual(maxDefinitionLength);
  });
});
