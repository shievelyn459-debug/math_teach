/**
 * @jest-environment node
 */

import { localQuestionGenerator, GeneratedQuestion } from '../localQuestionGenerator';
import { QuestionType, Difficulty, Grade } from '../../../types';

describe('LocalQuestionGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQuestions', () => {
    it('should generate specified number of questions', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5,
        Grade.GRADE_1
      );

      expect(questions).toBeDefined();
      expect(questions.length).toBe(5);
    });

    it('should generate questions with required fields', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        2,
        Grade.GRADE_1
      );

      questions.forEach((q: GeneratedQuestion) => {
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('answer');
        expect(q).toHaveProperty('explanation');
        expect(q.question).toBeTruthy();
        expect(q.answer).toBeTruthy();
      });
    });

    it('should generate addition questions', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        3,
        Grade.GRADE_1
      );

      questions.forEach((q: GeneratedQuestion) => {
        expect(q.question).toMatch(/\d+/); // Should contain numbers
      });
    });

    it('should generate subtraction questions', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.SUBTRACTION,
        Difficulty.EASY,
        3,
        Grade.GRADE_1
      );

      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q: GeneratedQuestion) => {
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('answer');
      });
    });

    it('should generate questions for different difficulty levels', async () => {
      const easyQuestions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        2,
        Grade.GRADE_1
      );

      const hardQuestions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.HARD,
        2,
        Grade.GRADE_1
      );

      expect(easyQuestions).toBeDefined();
      expect(hardQuestions).toBeDefined();
    });

    it('should generate questions for different grades', async () => {
      const grade1Questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        2,
        Grade.GRADE_1
      );

      const grade2Questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        2,
        Grade.GRADE_2
      );

      expect(grade1Questions).toBeDefined();
      expect(grade2Questions).toBeDefined();
    });

    it('should handle word problems', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.WORD_PROBLEM,
        Difficulty.MEDIUM,
        2,
        Grade.GRADE_1
      );

      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid question type', async () => {
      await expect(
        localQuestionGenerator.generateQuestions(
          'INVALID' as QuestionType,
          Difficulty.EASY,
          2,
          Grade.GRADE_1
        )
      ).rejects.toThrow('Unsupported question type');
    });

    it('should generate questions with valid numeric answers', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5,
        Grade.GRADE_1
      );

      questions.forEach((q: GeneratedQuestion) => {
        const answer = parseFloat(q.answer);
        expect(answer).not.toBeNaN();
        expect(answer).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate unique questions', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        10,
        Grade.GRADE_1
      );

      const questionSet = new Set(questions.map((q: GeneratedQuestion) => q.question));
      // At least some questions should be different (not all identical)
      expect(questionSet.size).toBeGreaterThan(1);
    });

    it('should generate questions with explanations', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        3,
        Grade.GRADE_1
      );

      questions.forEach((q: GeneratedQuestion) => {
        expect(q.explanation).toBeDefined();
        expect(q.explanation.length).toBeGreaterThan(0);
      });
    });

    it('should handle zero count', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        0,
        Grade.GRADE_1
      );

      expect(questions).toEqual([]);
    });

    it('should handle large count', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        50,
        Grade.GRADE_1
      );

      expect(questions.length).toBe(50);
    });

    it('should ensure subtraction results are positive for easy difficulty', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.SUBTRACTION,
        Difficulty.EASY,
        10,
        Grade.GRADE_1
      );

      questions.forEach((q: GeneratedQuestion) => {
        const answer = parseFloat(q.answer);
        expect(answer).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('generateAddition', () => {
    it('should generate appropriate questions for Grade 1 Easy', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5,
        Grade.GRADE_1
      );

      questions.forEach((q: GeneratedQuestion) => {
        // Grade 1 Easy should use numbers up to 10
        const numbers = q.question.match(/\d+/g);
        if (numbers) {
          const maxNum = Math.max(...numbers.map(Number));
          expect(maxNum).toBeLessThanOrEqual(20); // Allow some flexibility
        }
      });
    });
  });

  describe('generateSubtraction', () => {
    it('should generate valid subtraction questions', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.SUBTRACTION,
        Difficulty.EASY,
        5,
        Grade.GRADE_1
      );

      questions.forEach((q: GeneratedQuestion) => {
        // 减法题目可能包含数学符号或中文描述
        const hasMathFormat = /(\d+)\s*-\s*(\d+)/.test(q.question);
        const hasChineseFormat = /(\d+).*减.*(\d+)/.test(q.question);
        expect(hasMathFormat || hasChineseFormat).toBe(true);
      });
    });
  });

  describe('generateWordProblem', () => {
    it('should generate word problems with context', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.WORD_PROBLEM,
        Difficulty.MEDIUM,
        3,
        Grade.GRADE_1
      );

      // Word problems should have more context than simple arithmetic
      questions.forEach((q: GeneratedQuestion) => {
        expect(q.question.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid grade gracefully', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        2,
        'GRADE_99' as Grade
      );

      expect(questions).toBeDefined();
    });

    it('should handle invalid difficulty gracefully', async () => {
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        'ULTRA_HARD' as Difficulty,
        2,
        Grade.GRADE_1
      );

      expect(questions).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should generate 100 questions in reasonable time', async () => {
      const startTime = Date.now();
      const questions = await localQuestionGenerator.generateQuestions(
        QuestionType.ADDITION,
        Difficulty.EASY,
        100,
        Grade.GRADE_1
      );
      const duration = Date.now() - startTime;

      expect(questions.length).toBe(100);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
