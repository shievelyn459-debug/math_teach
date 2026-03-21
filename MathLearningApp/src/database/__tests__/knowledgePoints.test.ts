import {
  KNOWLEDGE_POINTS_DATABASE,
  getFallbackKnowledgePoint,
  getKnowledgePointsByCategory,
  getKnowledgePointById,
  getAllKnowledgePointNames,
} from '../knowledgePoints';
import {KnowledgePointCategory} from '../../types/knowledgePoint';

describe('KnowledgePoints Database', () => {
  describe('数据库完整性', () => {
    it('应该包含至少20个知识点 (修复后包含更多课程主题)', () => {
      expect(KNOWLEDGE_POINTS_DATABASE.length).toBeGreaterThanOrEqual(20);
    });

    it('每个知识点应该包含所有必需字段', () => {
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

      KNOWLEDGE_POINTS_DATABASE.forEach(kp => {
        requiredFields.forEach(field => {
          expect(kp).toHaveProperty(field);
        });
        expect(kp.grade).toBe('一年级');
        expect(Array.isArray(kp.keywords)).toBe(true);
        expect(Array.isArray(kp.examples)).toBe(true);
        expect(kp.confidenceThreshold).toBeGreaterThanOrEqual(0);
        expect(kp.confidenceThreshold).toBeLessThanOrEqual(1);
      });
    });

    it('应该覆盖所有一年级数学分类 (AC: 2)', () => {
      const categories = [
        KnowledgePointCategory.NUMBER_RECOGNITION,
        KnowledgePointCategory.ADDITION,
        KnowledgePointCategory.SUBTRACTION,
        KnowledgePointCategory.WORD_PROBLEM,
        KnowledgePointCategory.GEOMETRY,
        KnowledgePointCategory.MEASUREMENT,
      ];

      categories.forEach(category => {
        const kps = getKnowledgePointsByCategory(category);
        expect(kps.length).toBeGreaterThan(0);
        console.log(`${category}: ${kps.length} 个知识点`);
      });
    });
  });

  describe('数的认识知识点', () => {
    it('应该包含10以内数的认识', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '10以内数的认识'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.NUMBER_RECOGNITION);
      expect(kp?.keywords).toContain('10以内');
    });

    it('应该包含数的大小比较', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '数的大小比较'
      );
      expect(kp).toBeDefined();
      expect(kp?.keywords).toContain('大于');
      expect(kp?.keywords).toContain('小于');
    });
  });

  describe('加减法知识点', () => {
    it('应该包含10以内加法', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '10以内加法'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.ADDITION);
      expect(kp?.keywords).toContain('加');
      expect(kp?.keywords).toContain('+');
    });

    it('应该包含20以内进位加法', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '20以内进位加法'
      );
      expect(kp).toBeDefined();
      expect(kp?.keywords).toContain('进位');
    });

    it('应该包含10以内减法', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '10以内减法'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.SUBTRACTION);
      expect(kp?.keywords).toContain('减');
      expect(kp?.keywords).toContain('-');
    });

    it('应该包含20以内退位减法', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '20以内退位减法'
      );
      expect(kp).toBeDefined();
      expect(kp?.keywords).toContain('退位');
    });
  });

  describe('应用题知识点', () => {
    it('应该包含简单应用题', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '简单应用题'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.WORD_PROBLEM);
      expect(kp?.keywords).toContain('原来');
      expect(kp?.keywords).toContain('还剩');
    });
  });

  describe('图形和测量知识点', () => {
    it('应该包含认识图形', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '认识图形'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.GEOMETRY);
      expect(kp?.keywords).toContain('长方体');
      expect(kp?.keywords).toContain('正方体');
    });

    it('应该包含认识钟表', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '认识钟表'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.MEASUREMENT);
    });

    it('应该包含认识人民币', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '认识人民币'
      );
      expect(kp).toBeDefined();
      expect(kp?.keywords).toContain('元');
      expect(kp?.keywords).toContain('角');
    });

    // 新增知识点测试（修复审查问题）
    it('应该包含位置知识点 (新增)', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '位置'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.GEOMETRY);
      expect(kp?.keywords).toContain('上下');
      expect(kp?.keywords).toContain('前后');
    });

    it('应该包含方向知识点 (新增)', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '方向'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.GEOMETRY);
      expect(kp?.keywords).toContain('东');
      expect(kp?.keywords).toContain('南');
    });

    it('应该包含比大小知识点 (新增)', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '比大小'
      );
      expect(kp).toBeDefined();
      expect(kp?.category).toBe(KnowledgePointCategory.NUMBER_RECOGNITION);
    });

    it('应该包含分类知识点 (新增)', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '分类'
      );
      expect(kp).toBeDefined();
      expect(kp?.keywords).toContain('分类');
    });

    it('应该包含找规律知识点 (新增)', () => {
      const kp = KNOWLEDGE_POINTS_DATABASE.find(
        k => k.name === '找规律'
      );
      expect(kp).toBeDefined();
      expect(kp?.keywords).toContain('规律');
    });
  });

  describe('辅助函数', () => {
    it('getFallbackKnowledgePoint 应该返回降级知识点', () => {
      const fallback = getFallbackKnowledgePoint();
      expect(fallback.name).toBe('其他题型');
      expect(fallback.category).toBe(KnowledgePointCategory.OTHER);
    });

    it('getKnowledgePointsByCategory 应该返回正确的分类', () => {
      const additionKps = getKnowledgePointsByCategory(
        KnowledgePointCategory.ADDITION
      );
      expect(additionKps.length).toBeGreaterThan(0);
      expect(additionKps.every(kp => kp.category === KnowledgePointCategory.ADDITION)).toBe(true);
    });

    it('getKnowledgePointById 应该返回正确的知识点', () => {
      const kp = getKnowledgePointById('kp-add-001');
      expect(kp).toBeDefined();
      expect(kp?.name).toBe('10以内加法');
    });

    it('getKnowledgePointById 对不存在的ID应该返回undefined', () => {
      const kp = getKnowledgePointById('non-existent');
      expect(kp).toBeUndefined();
    });

    it('getAllKnowledgePointNames 应该返回所有知识点名称', () => {
      const names = getAllKnowledgePointNames();
      expect(names.length).toBe(KNOWLEDGE_POINTS_DATABASE.length);
      expect(names).toContain('10以内加法');
      expect(names).toContain('10以内减法');
    });
  });
});
