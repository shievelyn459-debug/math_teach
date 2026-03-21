import {
  KnowledgePoint,
  KnowledgePointCategory,
  KnowledgePointMatchResult,
} from '../knowledgePoint';

describe('KnowledgePoint Types', () => {
  describe('KnowledgePoint interface', () => {
    it('应该正确定义知识点接口结构', () => {
      const knowledgePoint: KnowledgePoint = {
        id: 'kp-001',
        name: '10以内加法',
        category: KnowledgePointCategory.ADDITION,
        grade: '一年级',
        keywords: ['加', '+', '和', '一共'],
        description: '掌握10以内的加法运算',
        examples: ['3 + 2 = ?', '5 + 4 = ?'],
        confidenceThreshold: 0.6,
      };

      expect(knowledgePoint.id).toBe('kp-001');
      expect(knowledgePoint.category).toBe(KnowledgePointCategory.ADDITION);
      expect(knowledgePoint.keywords).toContain('加');
      expect(knowledgePoint.grade).toBe('一年级');
    });

    it('应该包含所有必需字段', () => {
      const requiredFields = [
        'id',
        'name',
        'category',
        'grade',
        'keywords',
        'description',
        'examples',
        'confidenceThreshold',
      ];

      const knowledgePoint: KnowledgePoint = {
        id: 'kp-002',
        name: '10以内减法',
        category: KnowledgePointCategory.SUBTRACTION,
        grade: '一年级',
        keywords: ['减', '-', '剩'],
        description: '掌握10以内的减法运算',
        examples: ['5 - 2 = ?'],
        confidenceThreshold: 0.6,
      };

      requiredFields.forEach(field => {
        expect(knowledgePoint).toHaveProperty(field);
      });
    });
  });

  describe('KnowledgePointCategory enum', () => {
    it('应该包含所有一年级数学分类', () => {
      const expectedCategories = [
        KnowledgePointCategory.NUMBER_RECOGNITION,
        KnowledgePointCategory.ADDITION,
        KnowledgePointCategory.SUBTRACTION,
        KnowledgePointCategory.WORD_PROBLEM,
        KnowledgePointCategory.GEOMETRY,
        KnowledgePointCategory.MEASUREMENT,
        KnowledgePointCategory.OTHER,
      ];

      expect(expectedCategories).toContain('number_recognition');
      expect(expectedCategories).toContain('addition');
      expect(expectedCategories).toContain('subtraction');
      expect(expectedCategories).toContain('word_problem');
      expect(expectedCategories).toContain('geometry');
      expect(expectedCategories).toContain('measurement');
      expect(expectedCategories).toContain('other');
    });

    it('应该有7个分类类别', () => {
      const categories = Object.values(KnowledgePointCategory);
      expect(categories.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('KnowledgePointMatchResult interface', () => {
    it('应该正确定义匹配结果接口', () => {
      const matchResult: KnowledgePointMatchResult = {
        knowledgePoint: {
          id: 'kp-001',
          name: '10以内加法',
          category: KnowledgePointCategory.ADDITION,
          grade: '一年级',
          keywords: ['加', '+'],
          description: '测试',
          examples: [],
          confidenceThreshold: 0.6,
        },
        confidence: 0.85,
        matchedKeywords: ['加', '+'],
      };

      expect(matchResult.confidence).toBe(0.85);
      expect(matchResult.matchedKeywords).toEqual(['加', '+']);
      expect(matchResult.knowledgePoint.name).toBe('10以内加法');
    });

    it('置信度应该在0-1之间', () => {
      const matchResult: KnowledgePointMatchResult = {
        knowledgePoint: {
          id: 'kp-001',
          name: '测试',
          category: KnowledgePointCategory.OTHER,
          grade: '一年级',
          keywords: [],
          description: '测试',
          examples: [],
          confidenceThreshold: 0.5,
        },
        confidence: 0.75,
        matchedKeywords: [],
      };

      expect(matchResult.confidence).toBeGreaterThanOrEqual(0);
      expect(matchResult.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('知识点数据完整性', () => {
    it('关键词列表应该包含有效的中文和数学符号', () => {
      const validKeywords = ['加', '+', '和', '一共', '减', '-', '剩', '比'];

      const knowledgePoint: KnowledgePoint = {
        id: 'kp-003',
        name: '综合运算',
        category: KnowledgePointCategory.ADDITION,
        grade: '一年级',
        keywords: validKeywords,
        description: '测试',
        examples: [],
        confidenceThreshold: 0.5,
      };

      expect(knowledgePoint.keywords).toEqual(validKeywords);
    });
  });
});
