/**
 * 应用常量定义
 *
 * Story 6-2 P1修复 - 数据验证常量
 */

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US', 'es-ES'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * 难度级别列表
 */
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

/**
 * 验证语言代码
 * @param language 语言代码
 * @returns 是否有效
 */
export function isValidLanguage(language: string): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

/**
 * 验证难度级别
 * @param difficulty 难度级别
 * @returns 是否有效
 */
export function isValidDifficulty(difficulty: string): difficulty is DifficultyLevel {
  return DIFFICULTY_LEVELS.includes(difficulty as DifficultyLevel);
}
