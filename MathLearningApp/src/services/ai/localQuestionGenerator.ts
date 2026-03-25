/**
 * Local Question Generator
 * 降级方案：当AI API不可用时，使用本地题库生成题目
 * This serves as a fallback when external APIs are unavailable
 */

import {QuestionType, Difficulty, Grade} from '../../types';

/**
 * 生成的题目接口
 */
export interface GeneratedQuestion {
  question: string;
  answer: string;
  explanation: string;
}

/**
 * 加法题模板库
 */
const ADDITION_TEMPLATES = {
  [Grade.GRADE_1]: {
    [Difficulty.EASY]: [
      {template: '{a} + {b} = ?', max: 10},
      {template: '{a} 和 {b} 一共是多少？', max: 10},
    ],
    [Difficulty.MEDIUM]: [
      {template: '{a} + {b} + {c} = ?', max: 10},
      {template: '{a} + {b} = ?，{b} + {a} = ?', max: 20},
    ],
    [Difficulty.HARD]: [
      {template: '{a} + {b} = ?，其中 {a} = {c} + {d}', max: 20},
      {template: '比{a}多{b}的数是多少？', max: 20},
    ],
  },
  [Grade.GRADE_2]: {
    [Difficulty.EASY]: [
      {template: '{a} + {b} = ?', max: 20},
    ],
    [Difficulty.MEDIUM]: [
      {template: '{a} + {b} + {c} = ?', max: 50},
    ],
    [Difficulty.HARD]: [
      {template: '{a} + {b} = ?，其中 {a} = {c} × 2', max: 100},
    ],
  },
};

/**
 * 减法题模板库
 */
const SUBTRACTION_TEMPLATES = {
  [Grade.GRADE_1]: {
    [Difficulty.EASY]: [
      {template: '{a} - {b} = ?', max: 10, ensurePositive: true},
      {template: '{a}减去{b}是多少？', max: 10, ensurePositive: true},
    ],
    [Difficulty.MEDIUM]: [
      {template: '{a} - {b} - {c} = ?', max: 10, ensurePositive: true},
      {template: '{a} - ? = {b}', max: 20, ensurePositive: true},
    ],
    [Difficulty.HARD]: [
      {template: '{a} - {b} = ?，{b} = {c} - {d}', max: 20, ensurePositive: true},
      {template: '比{a}少{b}的数是多少？', max: 20},
    ],
  },
  [Grade.GRADE_2]: {
    [Difficulty.EASY]: [
      {template: '{a} - {b} = ?', max: 20, ensurePositive: true},
    ],
    [Difficulty.MEDIUM]: [
      {template: '{a} - {b} - {c} = ?', max: 50, ensurePositive: true},
    ],
    [Difficulty.HARD]: [
      {template: '{a} - {b} = ?，其中 {a} = {c} × 2', max: 100, ensurePositive: true},
    ],
  },
};

/**
 * 应用题模板库
 */
const WORD_PROBLEM_TEMPLATES = {
  [Grade.GRADE_1]: {
    [Difficulty.EASY]: [
      {
        template: '小明有{a}个苹果，妈妈又给了他{b}个，小明现在一共有多少个苹果？',
        type: 'addition',
        max: 10,
      },
      {
        template: '树上有{a}只小鸟，飞走了{b}只，还剩多少只？',
        type: 'subtraction',
        max: 10,
      },
    ],
    [Difficulty.MEDIUM]: [
      {
        template: '停车场原来有{a}辆车，先开来了{b}辆，又开走了{c}辆，现在有多少辆车？',
        type: 'mixed',
        max: 10,
      },
      {
        template: '小红有{a}支铅笔，小丽有{b}支铅笔，两人一共有多少支铅笔？',
        type: 'addition',
        max: 20,
      },
    ],
    [Difficulty.HARD]: [
      {
        template: '书店里有{a}本故事书，卖出{b}本后，又进了{c}本，现在书店里有多少本故事书？',
        type: 'mixed',
        max: 20,
      },
      {
        template: '动物园里有{a}只猴子，大象比猴子少{b}只，大象有多少只？',
        type: 'subtraction',
        max: 20,
      },
    ],
  },
};

/**
 * 本地题目生成器类
 */
class LocalQuestionGenerator {
  private random: () => number;

  constructor() {
    // 使用更安全的随机数生成
    this.random = () => {
      // 使用 crypto.getRandomValues 如果可用
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xFFFFFFFF + 1);
      }
      // 降级到 Math.random
      return Math.random();
    };
  }

  /**
   * 生成指定类型和难度的题目
   */
  async generateQuestions(
    type: QuestionType,
    difficulty: Difficulty,
    count: number,
    grade: Grade = Grade.GRADE_1
  ): Promise<GeneratedQuestion[]> {
    const questions: GeneratedQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const question = await this.generateSingleQuestion(type, difficulty, grade);
      questions.push(question);
    }

    console.log(`[LocalGenerator] Generated ${count} ${type} questions (${difficulty})`);
    return questions;
  }

  /**
   * 生成单道题目
   */
  private async generateSingleQuestion(
    type: QuestionType,
    difficulty: Difficulty,
    grade: Grade
  ): Promise<GeneratedQuestion> {
    switch (type) {
      case QuestionType.ADDITION:
        return this.generateAddition(difficulty, grade);
      case QuestionType.SUBTRACTION:
        return this.generateSubtraction(difficulty, grade);
      case QuestionType.WORD_PROBLEM:
        return this.generateWordProblem(difficulty, grade);
      default:
        throw new Error(`Unsupported question type: ${type}`);
    }
  }

  /**
   * 生成加法题
   */
  private generateAddition(difficulty: Difficulty, grade: Grade): GeneratedQuestion {
    const templates = ADDITION_TEMPLATES[grade]?.[difficulty] || ADDITION_TEMPLATES[Grade.GRADE_1][Difficulty.EASY];
    const template = templates[Math.floor(this.random() * templates.length)];

    const {a, b, c, d} = this.generateNumbers(template.max, 4);
    const question = template.template
      .replace('{a}', String(a))
      .replace('{b}', String(b))
      .replace('{c}', String(c))
      .replace('{d}', String(d));

    const answer = String(a + b);
    const explanation = `${a} 加 ${b} 等于 ${answer}`;

    return {question, answer, explanation};
  }

  /**
   * 生成减法题
   */
  private generateSubtraction(difficulty: Difficulty, grade: Grade): GeneratedQuestion {
    const templates = SUBTRACTION_TEMPLATES[grade]?.[difficulty] || SUBTRACTION_TEMPLATES[Grade.GRADE_1][Difficulty.EASY];
    const template = templates[Math.floor(this.random() * templates.length)];

    const {a, b, c, d} = this.generateNumbers(template.max, 4, template.ensurePositive);
    const question = template.template
      .replace('{a}', String(a))
      .replace('{b}', String(b))
      .replace('{c}', String(c))
      .replace('{d}', String(d));

    const answer = String(a - b);
    const explanation = `${a} 减 ${b} 等于 ${answer}`;

    return {question, answer, explanation};
  }

  /**
   * 生成应用题
   */
  private generateWordProblem(difficulty: Difficulty, grade: Grade): GeneratedQuestion {
    const templates = WORD_PROBLEM_TEMPLATES[grade]?.[difficulty] || WORD_PROBLEM_TEMPLATES[Grade.GRADE_1][Difficulty.EASY];
    const template = templates[Math.floor(this.random() * templates.length)];

    const {a, b, c} = this.generateNumbers(template.max, 3, true);
    const question = template.template
      .replace('{a}', String(a))
      .replace('{b}', String(b))
      .replace('{c}', String(c));

    let answer: string;
    let explanation: string;

    if (template.type === 'addition') {
      answer = String(a + b);
      explanation = `把${a}和${b}合起来，一共有${answer}个`;
    } else if (template.type === 'subtraction') {
      answer = String(a - b);
      explanation = `从${a}里面去掉${b}，还剩${answer}个`;
    } else {
      // mixed: a + b - c
      answer = String(a + b - c);
      explanation = `先算${a}加${b}等于${a + b}，再减${c}，等于${answer}`;
    }

    return {question, answer, explanation};
  }

  /**
   * 生成随机数字
   */
  private generateNumbers(max: number, count: number, ensurePositive: boolean = false): {a: number; b: number; c?: number; d?: number} {
    const numbers: number[] = [];

    for (let i = 0; i < count; i++) {
      // 生成 1 到 max 之间的随机数
      const num = Math.floor(this.random() * max) + 1;
      numbers.push(num);
    }

    const result: any = {
      a: numbers[0] || Math.floor(this.random() * max) + 1,
      b: numbers[1] || Math.floor(this.random() * max) + 1,
    };

    if (count >= 3) {
      result.c = numbers[2];
    }
    if (count >= 4) {
      result.d = numbers[3];
    }

    // 如果需要确保减法结果为正数
    if (ensurePositive && result.a < result.b) {
      [result.a, result.b] = [result.b, result.a];
    }

    return result;
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return true; // 本地服务始终可用
  }

  /**
   * 获取支持的题目类型
   */
  getSupportedTypes(): QuestionType[] {
    return [QuestionType.ADDITION, QuestionType.SUBTRACTION, QuestionType.WORD_PROBLEM];
  }

  /**
   * 获取支持的难度等级
   */
  getSupportedDifficulties(): Difficulty[] {
    return [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];
  }

  /**
   * 获取支持的年级
   */
  getSupportedGrades(): Grade[] {
    return [Grade.GRADE_1, Grade.GRADE_2];
  }
}

// 导出单例实例
export const localQuestionGenerator = new LocalQuestionGenerator();
export default localQuestionGenerator;
