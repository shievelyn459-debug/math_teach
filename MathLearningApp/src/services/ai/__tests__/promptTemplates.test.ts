/**
 * @jest-environment node
 */

import {
  OCR_PROMPT,
  generateQuestionPrompt,
  generateExplanationPrompt,
  generateDetailedExplanationPrompt,
  SYSTEM_PROMPTS,
} from '../promptTemplates';
import { QuestionType, Difficulty } from '../../../types';

describe('promptTemplates', () => {
  describe('OCR_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(OCR_PROMPT).toBeDefined();
      expect(typeof OCR_PROMPT).toBe('string');
      expect(OCR_PROMPT.length).toBeGreaterThan(0);
    });

    it('should contain JSON format specification', () => {
      expect(OCR_PROMPT).toContain('JSON');
      expect(OCR_PROMPT).toContain('```json');
    });

    it('should mention question types', () => {
      expect(OCR_PROMPT).toContain('addition');
      expect(OCR_PROMPT).toContain('subtraction');
      expect(OCR_PROMPT).toContain('word_problem');
    });

    it('should include confidence field', () => {
      expect(OCR_PROMPT).toContain('confidence');
    });
  });

  describe('generateQuestionPrompt', () => {
    it('should generate prompt for addition questions', () => {
      const prompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5,
        '一年级'
      );

      expect(prompt).toBeDefined();
      expect(prompt).toContain('加法运算');
      expect(prompt).toContain('一年级');
      expect(prompt).toContain('5道');
    });

    it('should generate prompt for subtraction questions', () => {
      const prompt = generateQuestionPrompt(
        QuestionType.SUBTRACTION,
        Difficulty.MEDIUM,
        3,
        '二年级'
      );

      expect(prompt).toContain('减法运算');
      expect(prompt).toContain('二年级');
      expect(prompt).toContain('3道');
    });

    it('should generate prompt for word problems', () => {
      const prompt = generateQuestionPrompt(
        QuestionType.WORD_PROBLEM,
        Difficulty.HARD,
        10,
        '三年级'
      );

      expect(prompt).toContain('应用题');
      expect(prompt).toContain('三年级');
      expect(prompt).toContain('10道');
    });

    it('should include difficulty levels', () => {
      const easyPrompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5
      );
      expect(easyPrompt).toContain('简单');

      const mediumPrompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.MEDIUM,
        5
      );
      expect(mediumPrompt).toContain('中等');

      const hardPrompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.HARD,
        5
      );
      expect(hardPrompt).toContain('较难');
    });

    it('should include number range for different grades', () => {
      const grade1Prompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5,
        '一年级'
      );
      expect(grade1Prompt).toMatch(/10以内|20以内/);

      const grade2Prompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5,
        '二年级'
      );
      expect(grade2Prompt).toContain('100以内');

      const grade3Prompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5,
        '三年级'
      );
      expect(grade3Prompt).toContain('1000以内');
    });

    it('should include JSON format requirement', () => {
      const prompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5
      );

      expect(prompt).toContain('```json');
      expect(prompt).toContain('question');
      expect(prompt).toContain('answer');
      expect(prompt).toContain('explanation');
    });

    it('should handle default grade parameter', () => {
      const prompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5
      );

      expect(prompt).toBeDefined();
      expect(prompt).toContain('一年级');
    });
  });

  describe('generateExplanationPrompt', () => {
    it('should generate prompt for knowledge point explanation', () => {
      const prompt = generateExplanationPrompt('加法基础', '一年级');

      expect(prompt).toBeDefined();
      expect(prompt).toContain('加法基础');
      expect(prompt).toContain('一年级');
      expect(prompt).toContain('家长');
    });

    it('should include required sections', () => {
      const prompt = generateExplanationPrompt('减法运算', '二年级');

      expect(prompt).toContain('什么是');
      expect(prompt).toContain('怎样教孩子');
      expect(prompt).toContain('练习题目');
      expect(prompt).toContain('家长辅导技巧');
    });

    it('should include JSON format specification', () => {
      const prompt = generateExplanationPrompt('应用题', '一年级');

      expect(prompt).toContain('```json');
      expect(prompt).toContain('sections');
      expect(prompt).toContain('definition');
      expect(prompt).toContain('methods');
      expect(prompt).toContain('examples');
      expect(prompt).toContain('tips');
    });

    it('should mention writing style guidelines', () => {
      const prompt = generateExplanationPrompt('乘法口诀', '二年级');

      expect(prompt).toContain('简单易懂');
      expect(prompt).toContain('生活化');
    });

    it('should handle default grade parameter', () => {
      const prompt = generateExplanationPrompt('除法概念');

      expect(prompt).toBeDefined();
      expect(prompt).toContain('一年级');
    });
  });

  describe('generateDetailedExplanationPrompt', () => {
    it('should generate prompt for detailed explanation', () => {
      const currentExplanation = '这是当前的讲解内容';
      const prompt = generateDetailedExplanationPrompt('加法', currentExplanation);

      expect(prompt).toBeDefined();
      expect(prompt).toContain('加法');
      expect(prompt).toContain(currentExplanation);
    });

    it('should request expansion topics', () => {
      const prompt = generateDetailedExplanationPrompt('减法', '现有内容');

      expect(prompt).toContain('教学方法');
      expect(prompt).toContain('常见错误');
      expect(prompt).toContain('生活');
      expect(prompt).toContain('游戏');
    });

    it('should reference current explanation', () => {
      const currentExplanation = '这是需要扩展的讲解';
      const prompt = generateDetailedExplanationPrompt('乘法', currentExplanation);

      expect(prompt).toContain('当前讲解内容');
      expect(prompt).toContain(currentExplanation);
    });
  });

  describe('SYSTEM_PROMPTS', () => {
    it('should have MATH_TUTOR prompt', () => {
      expect(SYSTEM_PROMPTS.MATH_TUTOR).toBeDefined();
      expect(SYSTEM_PROMPTS.MATH_TUTOR).toContain('小学数学教育助手');
      expect(SYSTEM_PROMPTS.MATH_TUTOR).toContain('家长');
    });

    it('should have OCR_SPECIALIST prompt', () => {
      expect(SYSTEM_PROMPTS.OCR_SPECIALIST).toBeDefined();
      expect(SYSTEM_PROMPTS.OCR_SPECIALIST).toContain('OCR');
      expect(SYSTEM_PROMPTS.OCR_SPECIALIST).toContain('识别');
    });

    it('should have QUESTION_GENERATOR prompt', () => {
      expect(SYSTEM_PROMPTS.QUESTION_GENERATOR).toBeDefined();
      expect(SYSTEM_PROMPTS.QUESTION_GENERATOR).toContain('题目生成');
    });

    it('should have EXPLANATION_GENERATOR prompt', () => {
      expect(SYSTEM_PROMPTS.EXPLANATION_GENERATOR).toBeDefined();
      expect(SYSTEM_PROMPTS.EXPLANATION_GENERATOR).toContain('讲解');
      expect(SYSTEM_PROMPTS.EXPLANATION_GENERATOR).toContain('家长');
    });

    it('all prompts should be non-empty strings', () => {
      Object.values(SYSTEM_PROMPTS).forEach((prompt) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
      });
    });

    it('all prompts should be non-empty and contain Chinese', () => {
      Object.values(SYSTEM_PROMPTS).forEach((prompt) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
        // All prompts should contain Chinese characters
        expect(/[\u4e00-\u9fa5]/.test(prompt)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle high question counts', () => {
      const prompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        1000,
        '一年级'
      );

      expect(prompt).toContain('1000道');
    });

    it('should handle unknown grades', () => {
      const prompt = generateQuestionPrompt(
        QuestionType.ADDITION,
        Difficulty.EASY,
        5,
        '六年级'
      );

      expect(prompt).toBeDefined();
      expect(prompt).toContain('10000以内');
    });

    it('should handle long knowledge point names', () => {
      const longName = '这是一个非常非常长的知识点名称，用来测试系统是否能够正确处理长文本输入';
      const prompt = generateExplanationPrompt(longName, '一年级');

      expect(prompt).toContain(longName);
    });
  });
});
