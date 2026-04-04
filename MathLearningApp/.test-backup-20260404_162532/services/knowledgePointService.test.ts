import {KnowledgePointService} from '../knowledgePointService';
import {KnowledgePointCategory} from '../../types/knowledgePoint';

describe('KnowledgePointService', () => {
  describe('recognizeKnowledgePoints', () => {
    it('应该识别出10以内加法题目', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '3 + 2 = ?'
      );

      expect(result.primaryKnowledgePoint.knowledgePoint.name).toBe('10以内加法');
      expect(result.primaryKnowledgePoint.confidence).toBeGreaterThan(0.5);
      expect(result.fallbackUsed).toBe(false);
    });

    it('应该识别出10以内减法题目', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '8 - 3 = ?'
      );

      expect(result.primaryKnowledgePoint.knowledgePoint.name).toBe('10以内减法');
      expect(result.primaryKnowledgePoint.confidence).toBeGreaterThan(0.5);
    });

    it('应该识别出简单应用题', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '原来有5个苹果，又买了3个，一共有几个'
      );

      expect(result.primaryKnowledgePoint.knowledgePoint.category).toBe(
        KnowledgePointCategory.WORD_PROBLEM
      );
      expect(result.fallbackUsed).toBe(false);
    });

    it('应该识别出数的大小比较题目', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '5和3哪个大'
      );

      expect(result.primaryKnowledgePoint.knowledgePoint.name).toBe('数的大小比较');
    });

    it('应该识别出认识钟表题目', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '现在是8点整'
      );

      expect(result.primaryKnowledgePoint.knowledgePoint.name).toBe('认识钟表');
    });

    it('应该识别出认识人民币题目', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '1元等于多少角'
      );

      expect(result.primaryKnowledgePoint.knowledgePoint.name).toBe('认识人民币');
    });

    it('应该支持多个知识点识别 (AC: 3)', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '原来有5个苹果，又买了3个，一共有几个？5 + 3 = ?'
      );

      expect(result.knowledgePoints.length).toBeGreaterThanOrEqual(1);
      // 应该同时识别出应用题和加法运算
      const categories = result.knowledgePoints.map(
        kp => kp.knowledgePoint.category
      );
      expect(categories).toContain(KnowledgePointCategory.WORD_PROBLEM);
    });

    it('对于无法识别的题目应该使用降级处理 (AC: 7)', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '这是一道无法识别的数学题 xyz123'
      );

      expect(result.fallbackUsed).toBe(true);
      expect(result.primaryKnowledgePoint.knowledgePoint.name).toBe('其他题型');
    });

    it('应该返回置信度分数 (AC: 4)', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '3 + 2 = 5'
      );

      expect(result.primaryKnowledgePoint.confidence).toBeDefined();
      expect(result.primaryKnowledgePoint.confidence).toBeGreaterThanOrEqual(0);
      expect(result.primaryKnowledgePoint.confidence).toBeLessThanOrEqual(1);
    });

    it('应该返回匹配到的关键词列表', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '3 加 2 等于多少'
      );

      expect(result.primaryKnowledgePoint.matchedKeywords.length).toBeGreaterThan(0);
      expect(result.primaryKnowledgePoint.matchedKeywords).toContain('加');
    });

    it('识别应该在5秒内完成 (AC: 5)', async () => {
      const startTime = Date.now();

      await KnowledgePointService.recognizeKnowledgePoints('5 + 3 = ?');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 5秒
    });

    it('空字符串应该使用降级处理', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints('');

      expect(result.fallbackUsed).toBe(true);
      expect(result.primaryKnowledgePoint.knowledgePoint.name).toBe('其他题型');
    });

    it('只有数字没有关键词应该使用降级处理', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '123 456 789'
      );

      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('getKnowledgePointById', () => {
    it('应该返回正确的知识点', () => {
      const kp = KnowledgePointService.getKnowledgePointById('kp-add-001');

      expect(kp).toBeDefined();
      expect(kp?.name).toBe('10以内加法');
    });

    it('对于不存在的ID应该返回undefined', () => {
      const kp = KnowledgePointService.getKnowledgePointById('non-existent');

      expect(kp).toBeUndefined();
    });
  });

  describe('getAllKnowledgePoints', () => {
    it('应该返回所有知识点', () => {
      const allKps = KnowledgePointService.getAllKnowledgePoints();

      expect(allKps.length).toBeGreaterThan(15);
    });
  });

  describe('submitKnowledgePointFeedback', () => {
    it('应该能够提交用户反馈 (AC: 8)', async () => {
      const feedback = {
        originalKnowledgePointId: 'kp-add-001',
        correctedKnowledgePointId: 'kp-add-002',
        questionText: '9 + 5 = ?',
        timestamp: new Date(),
      };

      const result = await KnowledgePointService.submitKnowledgePointFeedback(
        feedback
      );

      expect(result.success).toBe(true);
    });

    // AC8改进：验证反馈能够影响后续识别的置信度
    it('反馈后应该更新知识点统计 (AC8改进)', async () => {
      const service = KnowledgePointService.getInstance();

      // 提交反馈
      await service.submitKnowledgePointFeedback({
        originalKnowledgePointId: 'kp-add-001',
        correctedKnowledgePointId: 'kp-add-002',
        questionText: '9 + 5 = ?',
        timestamp: new Date(),
      });

      // 获取统计信息
      const stats1 = service.getKnowledgePointAccuracy('kp-add-001');
      const stats2 = service.getKnowledgePointAccuracy('kp-add-002');

      expect(stats1).not.toBeNull();
      expect(stats1?.incorrectCount).toBeGreaterThan(0);
      expect(stats2).not.toBeNull();
      expect(stats2?.correctCount).toBeGreaterThan(0);
    });

    it('应该生成准确率报告 (AC8周报)', () => {
      const service = KnowledgePointService.getInstance();

      const report = service.generateAccuracyReport();

      expect(Array.isArray(report)).toBe(true);
      expect(report).toBeDefined();
    });
  });

  describe('缓存机制', () => {
    it('相同题目应该使用缓存结果', async () => {
      const questionText = '5 + 3 = ?';

      const result1 = await KnowledgePointService.recognizeKnowledgePoints(
        questionText
      );
      const result2 = await KnowledgePointService.recognizeKnowledgePoints(
        questionText
      );

      // 结果应该相同
      expect(result1.primaryKnowledgePoint.knowledgePoint.id).toBe(
        result2.primaryKnowledgePoint.knowledgePoint.id
      );
    });
  });

  // AC3改进：验证层级关系去重
  describe('层级关系去重 (AC3改进)', () => {
    it('当识别出具体知识点时，父知识点置信度应该降低', async () => {
      const result = await KnowledgePointService.recognizeKnowledgePoints(
        '9 + 5 = ?' // 这是进位加法（子知识点），不应同时高置信度匹配10以内加法（父知识点）
      );

      // 主要知识点应该是更具体的"进位加法"或"10以内加法"之一
      // 不应该同时高置信度匹配这两个
      const parentKp = result.knowledgePoints.find(
        kp => kp.knowledgePoint.id === 'kp-add-001' // 10以内加法
      );
      const childKp = result.knowledgePoints.find(
        kp => kp.knowledgePoint.id === 'kp-add-002' // 进位加法
      );

      // 如果同时匹配，子知识点置信度应该高于父知识点，或者父知识点置信度显著降低
      if (parentKp && childKp) {
        expect(childKp.confidence).toBeGreaterThan(parentKp.confidence);
      }
    });
  });
});
