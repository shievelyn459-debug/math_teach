/**
 * AI Prompt Templates
 * Pre-defined prompts for various AI operations (OCR, generation, explanation)
 */

import {QuestionType, Difficulty, Grade} from '../../types';

/**
 * OCR Recognition Prompt
 * Extracts mathematical questions from images
 */
export const OCR_PROMPT = `请识别这张图片中的小学数学题目。

返回JSON格式（必须严格遵循）：
\`\`\`json
{
  "questionType": "addition|subtraction|word_problem",
  "extractedText": "题目的完整文本描述",
  "numbers": [数字列表],
  "confidence": 0.95
}
\`\`\`

说明：
- addition: 加法题目（如 3 + 2 = ?）
- subtraction: 减法题目（如 5 - 2 = ?）
- word_problem: 应用题（有文字描述的题目）
- confidence: 识别置信度（0-1之间）
`;

/**
 * Question Generation Prompt
 * Generates similar math problems
 */
export function generateQuestionPrompt(
  type: QuestionType,
  difficulty: Difficulty,
  count: number,
  grade: string = '一年级'
): string {
  const difficultyMap: Record<Difficulty, string> = {
    [Difficulty.EASY]: '简单（基础计算）',
    [Difficulty.MEDIUM]: '中等（需要思考）',
    [Difficulty.HARD]: '较难（综合应用）',
  };

  const typeMap: Record<QuestionType, string> = {
    [QuestionType.ADDITION]: '加法运算',
    [QuestionType.SUBTRACTION]: '减法运算',
    [QuestionType.WORD_PROBLEM]: '应用题',
  };

  return `你是小学数学题目生成专家。请生成${count}道符合${grade}课程标准的${typeMap[type]}题目。

要求：
1. 难度：${difficultyMap[difficulty]}
2. 题目要有变化，不要重复
3. 应用题要有生活场景，贴近孩子日常
4. 数字范围：${getNumberRangeForGrade(grade)}

返回JSON数组格式（必须严格遵循）：
\`\`\`json
[
  {
    "question": "题目内容（纯文本）",
    "answer": "答案",
    "explanation": "解题思路（一句话说明）"
  }
]
\`\`\``;
}

/**
 * Knowledge Point Explanation Prompt
 * Generates explanations for parents
 */
export function generateExplanationPrompt(
  knowledgePointName: string,
  grade: string = '一年级'
): string {
  return `你是小学数学教育专家。请为家长生成关于"${knowledgePointName}"的知识点讲解。

目标读者：家长（需要辅导孩子）
年级：${grade}

返回JSON格式（必须严格遵循）：
\`\`\`json
{
  "sections": [
    {
      "type": "definition",
      "title": "什么是${knowledgePointName}？",
      "content": ["用简单的话解释这个概念", "举例说明"]
    },
    {
      "type": "methods",
      "title": "怎样教孩子？",
      "content": ["教学方法1", "教学方法2", "教学方法3"]
    },
    {
      "type": "examples",
      "title": "练习题目",
      "content": [],
      "examples": [
        {
          "question": "例题1",
          "answer": "答案",
          "steps": ["步骤1", "步骤2"],
          "difficulty": "easy"
        }
      ]
    },
    {
      "type": "tips",
      "title": "家长辅导技巧",
      "content": ["✅ 要这样做", "❌ 不要这样做"]
    }
  ]
}
\`\`\`

写作风格：
- 用简单易懂的语言，避免教育术语
- 多用生活化的例子
- 给家长具体的操作建议
- 强调耐心和鼓励的重要性`;
}

/**
 * Detailed Explanation Prompt (Optional enhancement)
 */
export function generateDetailedExplanationPrompt(
  knowledgePointName: string,
  currentExplanation: string
): string {
  return `你是小学数学教育专家。请为家长生成更详细的关于"${knowledgePointName}"的知识点讲解。

当前讲解内容：
${currentExplanation}

请扩展以下内容：
1. 更多的具体教学方法
2. 常见错误和纠正方法
3. 生活中可以练习的场景
4. 适合的学习游戏和活动

返回格式与之前相同，但内容要更丰富、更具体。`;
}

/**
 * Get number range for grade level
 */
function getNumberRangeForGrade(grade: string): string {
  if (grade.includes('一')) {
    return '10以内或20以内';
  } else if (grade.includes('二')) {
    return '100以内';
  } else if (grade.includes('三')) {
    return '1000以内';
  } else {
    return '10000以内';
  }
}

/**
 * System prompts for different models
 */
export const SYSTEM_PROMPTS = {
  /**
   * General math education assistant
   */
  MATH_TUTOR: `你是一位专业的小学数学教育助手，专门帮助家长辅导一年级学生学习数学。

你的特点：
- 熟悉一年级数学课程标准
- 能用简单的语言解释数学概念
- 为家长提供实用的辅导建议
- 理解儿童认知发展规律

请始终用中文回答，语言要亲切、易懂。`,

  /**
   * OCR specialist
   */
  OCR_SPECIALIST: `你是一位专业的OCR识别专家，专门识别小学数学题目。

你的任务：
1. 准确识别图片中的数学题
2. 判断题目类型（加法/减法/应用题）
3. 提取题目中的数字和文本
4. 给出识别置信度

请始终返回JSON格式的结果。`,

  /**
   * Question generator
   */
  QUESTION_GENERATOR: `你是一位专业的小学数学题目生成专家。

你的特点：
- 熟悉各年级数学课程标准
- 能生成符合儿童认知特点的题目
- 题目难度分级准确
- 应用题贴近儿童生活

请始终返回JSON格式的结果。`,

  /**
   * Explanation generator
   */
  EXPLANATION_GENERATOR: `你是一位专业的小学数学教育专家，专门为家长编写辅导材料。

你的特点：
- 深入理解儿童数学认知发展
- 能用简单的语言解释复杂概念
- 为家长提供实用的辅导方法
- 内容科学、准确、易懂

请始终返回JSON格式的结构化讲解内容。`,
};
