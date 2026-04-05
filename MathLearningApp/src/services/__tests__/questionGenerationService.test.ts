import { questionGenerationService } from '../questionGenerationService';
import { QuestionType, Difficulty, Question } from '../../types';

describe('questionGenerationService', () => {
  describe('generateSimilarQuestions', () => {
    const baseQuestion: Question = {
      id: 'test-1',
      title: '测试题目',
      content: '5 + 3 = ?',
      type: QuestionType.ADDITION,
      difficulty: Difficulty.MEDIUM,
      grade: 1,
      knowledgePoint: '加法运算',
      explanation: '加法运算',
      answer: '8',
      createdAt: new Date(),
      userId: 'user-1',
    };

    it('should generate the requested number of questions', async () => {
      const count = 5;
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        count,
        Difficulty.MEDIUM
      );

      expect(result).toHaveLength(count);
    });

    it('should generate questions with different numbers but same structure', async () => {
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        5,
        Difficulty.MEDIUM
      );

      // 检查所有题目都是加法
      result.forEach(q => {
        expect(q.type).toBe(QuestionType.ADDITION);
        expect(q.content).toMatch(/\d+ \+ \d+ = \?/);
      });

      // 检查至少有一些题目数字不同
      const contents = result.map(q => q.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBeGreaterThan(1);
    });

    it('should include correct answer and explanation for each question', async () => {
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        3,
        Difficulty.MEDIUM
      );

      result.forEach(q => {
        expect(q.answer).toBeDefined();
        expect(q.answer).not.toBe('');
        expect(q.explanation).toBeDefined();
        expect(q.explanation).not.toBe('');
      });
    });

    it('should generate easy questions with numbers 1-20', async () => {
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        10,
        Difficulty.EASY
      );

      result.forEach(q => {
        const match = q.content.match(/(\d+) \+ (\d+)/);
        if (match) {
          const a = parseInt(match[1]);
          const b = parseInt(match[2]);
          // 简单难度：数字在1-20之间
          expect(a).toBeGreaterThanOrEqual(1);
          expect(a).toBeLessThanOrEqual(20);
          expect(b).toBeGreaterThanOrEqual(1);
          expect(b).toBeLessThanOrEqual(20);
        }
      });
    });

    it('should generate medium questions with numbers 1-50', async () => {
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        10,
        Difficulty.MEDIUM
      );

      result.forEach(q => {
        const match = q.content.match(/(\d+) \+ (\d+)/);
        if (match) {
          const a = parseInt(match[1]);
          const b = parseInt(match[2]);
          // 中等难度：数字在1-50之间
          expect(a).toBeGreaterThanOrEqual(1);
          expect(a).toBeLessThanOrEqual(50);
          expect(b).toBeGreaterThanOrEqual(1);
          expect(b).toBeLessThanOrEqual(50);
        }
      });
    });

    it('should generate hard questions with numbers 1-100', async () => {
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        10,
        Difficulty.HARD
      );

      result.forEach(q => {
        const match = q.content.match(/(\d+) \+ (\d+)/);
        if (match) {
          const a = parseInt(match[1]);
          const b = parseInt(match[2]);
          // 困难难度：数字在1-100之间
          expect(a).toBeGreaterThanOrEqual(1);
          expect(a).toBeLessThanOrEqual(100);
          expect(b).toBeGreaterThanOrEqual(1);
          expect(b).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should generate subtraction questions correctly', async () => {
      const subtractionQuestion: Question = {
        ...baseQuestion,
        type: QuestionType.SUBTRACTION,
        content: '10 - 4 = ?',
      };

      const result = await questionGenerationService.generateSimilarQuestions(
        subtractionQuestion,
        5,
        Difficulty.MEDIUM
      );

      result.forEach(q => {
        expect(q.type).toBe(QuestionType.SUBTRACTION);
        expect(q.content).toMatch(/\d+ - \d+ = \?/);
      });
    });

    it('should generate word problem questions correctly', async () => {
      const wordProblemQuestion: Question = {
        ...baseQuestion,
        type: QuestionType.WORD_PROBLEM,
        content: '小明有5个苹果,妈妈又给了他3个,小明现在有几个苹果？',
      };

      const result = await questionGenerationService.generateSimilarQuestions(
        wordProblemQuestion,
        5,
        Difficulty.MEDIUM
      );

      result.forEach(q => {
        // Word problems can be ADDITION or SUBTRACTION type
        expect([QuestionType.ADDITION, QuestionType.SUBTRACTION]).toContain(q.type);
        expect(q.content).toBeDefined();
        expect(q.answer).toBeDefined();
      });
    });

    it('should generate subtraction questions with easy difficulty', async () => {
      const subtractionQuestion: Question = {
        ...baseQuestion,
        type: QuestionType.SUBTRACTION,
        content: '15 - 5 = ?',
      };

      const result = await questionGenerationService.generateSimilarQuestions(
        subtractionQuestion,
        5,
        Difficulty.EASY
      );

      result.forEach(q => {
        expect(q.type).toBe(QuestionType.SUBTRACTION);
        expect(q.content).toMatch(/\d+ - \d+ = \?/);
        const match = q.content.match(/(\d+) - (\d+)/);
        if (match) {
          const a = parseInt(match[1]);
          const b = parseInt(match[2]);
          expect(a).toBeGreaterThanOrEqual(1);
          expect(a).toBeLessThanOrEqual(20);
          expect(a).toBeGreaterThan(b); // 结果不为0
        }
      });
    });

    it('should generate subtraction questions with hard difficulty', async () => {
      const subtractionQuestion: Question = {
        ...baseQuestion,
        type: QuestionType.SUBTRACTION,
        content: '100 - 50 = ?',
      };

      const result = await questionGenerationService.generateSimilarQuestions(
        subtractionQuestion,
        5,
        Difficulty.HARD
      );

      result.forEach(q => {
        expect(q.type).toBe(QuestionType.SUBTRACTION);
        const match = q.content.match(/(\d+) - (\d+)/);
        if (match) {
          const a = parseInt(match[1]);
          const b = parseInt(match[2]);
          expect(a).toBeGreaterThanOrEqual(1);
          expect(a).toBeLessThanOrEqual(100);
          expect(a).toBeGreaterThan(b);
        }
      });
    });

    it('should generate word problems with easy difficulty', async () => {
      const wordProblemQuestion: Question = {
        ...baseQuestion,
        type: QuestionType.WORD_PROBLEM,
        content: '小明有5个苹果，妈妈又给了他3个，小明现在有几个苹果？',
      };

      const result = await questionGenerationService.generateSimilarQuestions(
        wordProblemQuestion,
        5,
        Difficulty.EASY
      );

      result.forEach(q => {
        // Word problems can be ADDITION or SUBTRACTION type
        expect([QuestionType.ADDITION, QuestionType.SUBTRACTION]).toContain(q.type);
        expect(q.content).toBeDefined();
        expect(q.answer).toBeDefined();
      });
    });

    it('should generate word problems with hard difficulty', async () => {
      const wordProblemQuestion: Question = {
        ...baseQuestion,
        type: QuestionType.WORD_PROBLEM,
        content: '停车场有50辆车，开走了20辆，还剩几辆？',
      };

      const result = await questionGenerationService.generateSimilarQuestions(
        wordProblemQuestion,
        5,
        Difficulty.HARD
      );

      result.forEach(q => {
        // Word problems can be ADDITION or SUBTRACTION type
        expect([QuestionType.ADDITION, QuestionType.SUBTRACTION]).toContain(q.type);
        expect(q.content).toBeDefined();
        expect(q.answer).toBeDefined();
      });
    });

    it('should validate answers for generated questions', async () => {
      const result = await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        5,
        Difficulty.MEDIUM
      );

      const validationResult = await questionGenerationService.validateAnswers(result);
      expect(validationResult.allValid).toBe(true);
      expect(validationResult.invalidQuestions).toHaveLength(0);
    });

    it('should complete generation within 10 seconds for 15 questions', async () => {
      const startTime = Date.now();

      await questionGenerationService.generateSimilarQuestions(
        baseQuestion,
        15,
        Difficulty.MEDIUM
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // 10秒 = 10000毫秒
    });
  });

  describe('validateQuestion', () => {
    it('should validate a correct addition question', () => {
      const question: Question = {
        id: 'test-1',
        title: '测试',
        content: '5 + 3 = ?',
        type: QuestionType.ADDITION,
        difficulty: Difficulty.MEDIUM,
        grade: 1,
        knowledgePoint: '加法',
        explanation: '5加3等于8',
        answer: '8',
        createdAt: new Date(),
        userId: 'user-1',
      };

      const result = questionGenerationService.validateQuestion(question);
      expect(result.isValid).toBe(true);
    });

    it('should detect incorrect answer', () => {
      const question: Question = {
        id: 'test-1',
        title: '测试',
        content: '5 + 3 = ?',
        type: QuestionType.ADDITION,
        difficulty: Difficulty.MEDIUM,
        grade: 1,
        knowledgePoint: '加法',
        explanation: '5加3等于8',
        answer: '9', // 错误答案
        createdAt: new Date(),
        userId: 'user-1',
      };

      const result = questionGenerationService.validateQuestion(question);
      expect(result.isValid).toBe(false);
      expect(result.expectedAnswer).toBe('8');
    });
  });

  describe('validateAnswers', () => {
    it('should validate multiple questions', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          title: 'Q1',
          content: '2 + 3 = ?',
          type: QuestionType.ADDITION,
          difficulty: Difficulty.EASY,
          grade: 1,
          knowledgePoint: '加法',
          explanation: '2加3等于5',
          answer: '5',
          createdAt: new Date(),
          userId: 'user-1',
        },
        {
          id: 'q2',
          title: 'Q2',
          content: '10 - 4 = ?',
          type: QuestionType.SUBTRACTION,
          difficulty: Difficulty.EASY,
          grade: 1,
          knowledgePoint: '减法',
          explanation: '10减4等于6',
          answer: '6',
          createdAt: new Date(),
          userId: 'user-1',
        },
      ];

      const result = await questionGenerationService.validateAnswers(questions);
      expect(result.allValid).toBe(true);
      expect(result.invalidQuestions).toHaveLength(0);
    });
  });
});
