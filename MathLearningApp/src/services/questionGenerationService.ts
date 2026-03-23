import { Question, QuestionType, Difficulty } from '../types';

/**
 * 题目生成服务
 * 基于模板生成同类型的数学题目
 */

interface ValidationResult {
  isValid: boolean;
  expectedAnswer?: string;
}

interface BatchValidationResult {
  allValid: boolean;
  invalidQuestions: Array<{
    question: Question;
    expectedAnswer: string;
  }>;
}

// 难度对应的数字范围
const DIFFICULTY_RANGES = {
  [Difficulty.EASY]: { min: 1, max: 20 },
  [Difficulty.MEDIUM]: { min: 1, max: 50 },
  [Difficulty.HARD]: { min: 1, max: 100 },
};

// 数字范围常量
const NUMBER_RANGES = {
  EASY_MIN: 1,
  EASY_MAX: 10,
  EASY_SUM_LIMIT: 20,
  MEDIUM_FIRST_OPERAND_MAX: 25,
  MEDIUM_SUM_LIMIT: 50,
  HARD_FIRST_OPERAND_MAX: 50,
  HARD_SUM_LIMIT: 100,
  WORD_PROBLEM_EASY_MIN: 5,
  WORD_PROBLEM_EASY_MAX: 15,
  WORD_PROBLEM_EASY_SUBTRAHEND_MAX: 8,
  WORD_PROBLEM_MEDIUM_MIN: 10,
  WORD_PROBLEM_MEDIUM_MAX: 40,
  WORD_PROBLEM_HARD_MIN: 20,
  WORD_PROBLEM_HARD_MAX: 80,
  SUBTRACTION_EASY_MIN: 5,
  SUBTRACTION_EASY_MAX: 20,
  SUBTRACTION_EASY_SUBTRAHEND_MAX: 10,
  SUBTRACTION_MEDIUM_MIN: 10,
  SUBTRACTION_MEDIUM_MAX: 50,
  SUBTRACTION_HARD_MIN: 20,
  SUBTRACTION_HARD_MAX: 100,
  GENERATION_MIN_COUNT: 1,
  GENERATION_MAX_COUNT: 100,
  TEMPLATE_INDEX_MIN: 0,
  SCENARIO_COUNT: 3,
} as const;

// 生成随机数
const randomInt = (min: number, max: number): number => {
  if (min > max) {
    throw new Error(`randomInt: min (${min}) must be <= max (${max})`);
  }
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error(`randomInt: min and max must be integers, got ${min} and ${max}`);
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ID 生成计数器，用于避免同一毫秒内的冲突
let idCounter = 0;
let lastTimestamp = 0;

// 生成唯一ID
const generateId = (): string => {
  const now = Date.now();

  // 如果时间戳相同，增加计数器
  if (now === lastTimestamp) {
    idCounter++;
  } else {
    // 新的时间戳，重置计数器
    lastTimestamp = now;
    idCounter = 0;
  }

  // 使用时间戳 + 计数器 + 随机数确保唯一性
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `q_${now}_${idCounter}_${randomPart}`;
};

// 加法题目生成器
const generateAdditionQuestion = (
  difficulty: Difficulty,
  userId: string
): Question => {
  const range = DIFFICULTY_RANGES[difficulty];

  let a: number;
  let b: number;

  if (difficulty === Difficulty.EASY) {
    // 简单难度：确保结果不超过20，使用while循环确保均匀分布
    do {
      a = randomInt(NUMBER_RANGES.EASY_MIN, NUMBER_RANGES.EASY_MAX);
      b = randomInt(NUMBER_RANGES.EASY_MIN, NUMBER_RANGES.EASY_MAX);
    } while (a + b > NUMBER_RANGES.EASY_SUM_LIMIT);
  } else if (difficulty === Difficulty.MEDIUM) {
    // 中等难度：和不超过50，均匀分布
    do {
      a = randomInt(range.min, NUMBER_RANGES.MEDIUM_FIRST_OPERAND_MAX);
      b = randomInt(NUMBER_RANGES.EASY_MIN, NUMBER_RANGES.MEDIUM_FIRST_OPERAND_MAX);
    } while (a + b > NUMBER_RANGES.MEDIUM_SUM_LIMIT);
  } else {
    // 困难难度：和不超过100
    do {
      a = randomInt(range.min, NUMBER_RANGES.HARD_FIRST_OPERAND_MAX);
      b = randomInt(range.min, NUMBER_RANGES.HARD_FIRST_OPERAND_MAX);
    } while (a + b > NUMBER_RANGES.HARD_SUM_LIMIT);
  }

  const answer = a + b;

  return {
    id: generateId(),
    title: '加法练习',
    content: `${a} + ${b} = ?`,
    type: QuestionType.ADDITION,
    difficulty: difficulty,
    grade: 1,
    knowledgePoint: '加法运算',
    explanation: `把${a}和${b}合起来，答案是${answer}`,
    answer: String(answer),
    createdAt: new Date(),
    userId: userId,
  };
};

// 减法题目生成器
const generateSubtractionQuestion = (
  difficulty: Difficulty,
  userId: string
): Question => {
  const range = DIFFICULTY_RANGES[difficulty];

  let a: number;
  let b: number;

  if (difficulty === Difficulty.EASY) {
    // 简单难度：被减数不超过20，不退位，结果不为0
    a = randomInt(NUMBER_RANGES.SUBTRACTION_EASY_MIN, NUMBER_RANGES.SUBTRACTION_EASY_MAX);
    b = randomInt(NUMBER_RANGES.EASY_MIN, Math.min(a - 1, NUMBER_RANGES.SUBTRACTION_EASY_SUBTRAHEND_MAX));
  } else if (difficulty === Difficulty.MEDIUM) {
    // 中等难度：被减数不超过50，结果不为0
    a = randomInt(NUMBER_RANGES.SUBTRACTION_MEDIUM_MIN, NUMBER_RANGES.SUBTRACTION_MEDIUM_MAX);
    b = randomInt(NUMBER_RANGES.EASY_MIN, a - 1);
  } else {
    // 困难难度：被减数不超过100，结果不为0
    a = randomInt(NUMBER_RANGES.SUBTRACTION_HARD_MIN, NUMBER_RANGES.SUBTRACTION_HARD_MAX);
    b = randomInt(NUMBER_RANGES.EASY_MIN, a - 1);
  }

  const answer = a - b;

  return {
    id: generateId(),
    title: '减法练习',
    content: `${a} - ${b} = ?`,
    type: QuestionType.SUBTRACTION,
    difficulty: difficulty,
    grade: 1,
    knowledgePoint: '减法运算',
    explanation: `从${a}中减去${b}，答案是${answer}`,
    answer: String(answer),
    createdAt: new Date(),
    userId: userId,
  };
};

// 应用题生成器
const generateWordProblemQuestion = (
  difficulty: Difficulty,
  userId: string
): Question => {
  const templates = [
    // 加法应用题模板
    {
      type: QuestionType.ADDITION,
      template: (a: number, b: number) => {
        const scenarios = [
          `小明有${a}个苹果，妈妈又给了他${b}个，小明现在有几个苹果？`,
          `树上有${a}只小鸟，又飞来了${b}只，树上一共有几只小鸟？`,
          `盒子里有${a}支铅笔，又放进去了${b}支，盒子里现在有几支铅笔？`,
        ];
        const scenario = scenarios[randomInt(NUMBER_RANGES.TEMPLATE_INDEX_MIN, scenarios.length - 1)];
        return scenario;
      },
      explanation: (a: number, b: number) => `把${a}和${b}合起来，答案是${a + b}`,
      answer: (a: number, b: number) => String(a + b),
    },
    // 减法应用题模板
    {
      type: QuestionType.SUBTRACTION,
      template: (a: number, b: number) => {
        const scenarios = [
          `小红有${a}颗糖，吃了${b}颗，还剩几颗？`,
          `停车场有${a}辆车，开走了${b}辆，还剩几辆？`,
          `书架上有${a}本书，借走了${b}本，还剩几本？`,
        ];
        const scenario = scenarios[randomInt(NUMBER_RANGES.TEMPLATE_INDEX_MIN, scenarios.length - 1)];
        return scenario;
      },
      explanation: (a: number, b: number) => `从${a}中减去${b}，答案是${a - b}`,
      answer: (a: number, b: number) => String(a - b),
    },
  ];

  const selectedTemplate = templates[randomInt(NUMBER_RANGES.TEMPLATE_INDEX_MIN, templates.length - 1)];

  let a: number;
  let b: number;

  if (difficulty === Difficulty.EASY) {
    a = randomInt(NUMBER_RANGES.WORD_PROBLEM_EASY_MIN, NUMBER_RANGES.WORD_PROBLEM_EASY_MAX);
    b = randomInt(NUMBER_RANGES.EASY_MIN, Math.min(a - 1, NUMBER_RANGES.WORD_PROBLEM_EASY_SUBTRAHEND_MAX));
  } else if (difficulty === Difficulty.MEDIUM) {
    a = randomInt(NUMBER_RANGES.WORD_PROBLEM_MEDIUM_MIN, NUMBER_RANGES.WORD_PROBLEM_MEDIUM_MAX);
    b = randomInt(NUMBER_RANGES.EASY_MIN, a - 1);
  } else {
    a = randomInt(NUMBER_RANGES.WORD_PROBLEM_HARD_MIN, NUMBER_RANGES.WORD_PROBLEM_HARD_MAX);
    b = randomInt(NUMBER_RANGES.EASY_MIN, a - 1);
  }

  const content = selectedTemplate.template(a, b);
  const answer = selectedTemplate.answer(a, b);
  const explanation = selectedTemplate.explanation(a, b);

  return {
    id: generateId(),
    title: '应用题',
    content: content,
    type: selectedTemplate.type,
    difficulty: difficulty,
    grade: 1,
    knowledgePoint: '应用题',
    explanation: explanation,
    answer: answer,
    createdAt: new Date(),
    userId: userId,
  };
};

// 根据题目类型选择生成器
const generateQuestionByType = (
  type: QuestionType,
  difficulty: Difficulty,
  userId: string
): Question => {
  switch (type) {
    case QuestionType.ADDITION:
      return generateAdditionQuestion(difficulty, userId);
    case QuestionType.SUBTRACTION:
      return generateSubtractionQuestion(difficulty, userId);
    case QuestionType.WORD_PROBLEM:
      return generateWordProblemQuestion(difficulty, userId);
    default:
      throw new Error(`Unsupported question type: ${type}`);
  }
};

// 解析题目并计算正确答案
const parseAndCalculate = (content: string, type: QuestionType): string | null => {
  const additionMatch = content.match(/(\d+)\s*\+\s*(\d+)/);
  const subtractionMatch = content.match(/(\d+)\s*-\s*(\d+)/);

  if (additionMatch && type === QuestionType.ADDITION) {
    const a = parseInt(additionMatch[1]);
    const b = parseInt(additionMatch[2]);
    return String(a + b);
  }

  if (subtractionMatch && type === QuestionType.SUBTRACTION) {
    const a = parseInt(subtractionMatch[1]);
    const b = parseInt(subtractionMatch[2]);
    return String(a - b);
  }

  // 对于应用题，尝试从文本中提取数字
  const numbers = content.match(/\d+/g);
  if (numbers && numbers.length >= 2) {
    const nums = numbers.map(n => parseInt(n));
    if (content.includes('又') || content.includes('合')) {
      return String(nums[0] + nums[1]);
    } else if (content.includes('吃') || content.includes('走') || content.includes('借')) {
      return String(nums[0] - nums[1]);
    }
  }

  // 返回 null 表示无法解析
  return null;
};

// 验证题目是否符合难度要求
const validateDifficulty = (question: Question): boolean => {
  // 从题目内容中提取数字
  const numbers = question.content.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return true; // 应用题无数字时跳过验证
  }

  const nums = numbers.map(n => parseInt(n));
  const maxNum = Math.max(...nums);

  // 验证数字范围是否匹配难度
  switch (question.difficulty) {
    case Difficulty.EASY:
      // 简单难度：数字不超过20，结果不超过20
      return maxNum <= NUMBER_RANGES.EASY_SUM_LIMIT;
    case Difficulty.MEDIUM:
      // 中等难度：数字不超过50
      return maxNum <= NUMBER_RANGES.MEDIUM_SUM_LIMIT;
    case Difficulty.HARD:
      // 困难难度：数字不超过100
      return maxNum <= NUMBER_RANGES.HARD_SUM_LIMIT;
    default:
      return true;
  }
};

export const questionGenerationService = {
  /**
   * 生成相似题目
   * @param baseQuestion 基础题目
   * @param count 生成数量
   * @param difficulty 难度级别
   * @returns 生成的题目列表
   */
  async generateSimilarQuestions(
    baseQuestion: Question,
    count: number,
    difficulty: Difficulty
  ): Promise<Question[]> {
    // 参数验证
    if (!baseQuestion?.userId) {
      throw new Error('generateSimilarQuestions: userId is required');
    }
    if (!Number.isInteger(count) || count < NUMBER_RANGES.GENERATION_MIN_COUNT || count > NUMBER_RANGES.GENERATION_MAX_COUNT) {
      throw new Error(`generateSimilarQuestions: count must be between ${NUMBER_RANGES.GENERATION_MIN_COUNT} and ${NUMBER_RANGES.GENERATION_MAX_COUNT}, got ${count}`);
    }
    if (!Object.values(Difficulty).includes(difficulty)) {
      throw new Error(`generateSimilarQuestions: invalid difficulty ${difficulty}`);
    }

    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
      const question = generateQuestionByType(
        baseQuestion.type,
        difficulty,
        baseQuestion.userId
      );

      // 验证题目是否符合难度要求
      if (!validateDifficulty(question)) {
        console.warn(`[questionGenerationService] Generated question may not match difficulty ${difficulty}:`, question.content);
      }

      questions.push(question);
    }

    return questions;
  },

  /**
   * 验证单个题目
   * @param question 要验证的题目
   * @returns 验证结果
   */
  validateQuestion(question: Question): ValidationResult {
    const expectedAnswer = parseAndCalculate(question.content, question.type);

    // 无法解析（返回 null），假设正确
    if (expectedAnswer === null) {
      return { isValid: true };
    }

    const isValid = question.answer === expectedAnswer;

    return {
      isValid,
      expectedAnswer: isValid ? undefined : expectedAnswer,
    };
  },

  /**
   * 验证多个题目的答案
   * @param questions 要验证的题目列表
   * @returns 批量验证结果
   */
  async validateAnswers(questions: Question[]): Promise<BatchValidationResult> {
    const invalidQuestions: BatchValidationResult['invalidQuestions'] = [];

    for (const question of questions) {
      const result = this.validateQuestion(question);

      if (!result.isValid && result.expectedAnswer) {
        invalidQuestions.push({
          question,
          expectedAnswer: result.expectedAnswer,
        });
      }
    }

    return {
      allValid: invalidQuestions.length === 0,
      invalidQuestions,
    };
  },
};
