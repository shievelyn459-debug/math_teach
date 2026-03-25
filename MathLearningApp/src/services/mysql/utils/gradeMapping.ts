/**
 * Grade枚举转换工具
 *
 * 处理Application层和Prisma层之间的Grade枚举值转换
 *
 * Application Grade: "1", "2", "3", "4", "5", "6"
 * Prisma Grade: "一年级", "二年级", "三年级", "四年级", "五年级", "六年级"
 */

import { Grade } from '../../../types';

/**
 * Application Grade → Prisma Grade 转换映射
 */
const TO_PRISMA_MAP: Record<Grade, string> = {
  [Grade.GRADE_1]: '一年级',
  [Grade.GRADE_2]: '二年级',
  [Grade.GRADE_3]: '三年级',
  [Grade.GRADE_4]: '四年级',
  [Grade.GRADE_5]: '五年级',
  [Grade.GRADE_6]: '六年级',
};

/**
 * Prisma Grade → Application Grade 转换映射
 */
const FROM_PRISMA_MAP: Record<string, Grade> = {
  '一年级': Grade.GRADE_1,
  '二年级': Grade.GRADE_2,
  '三年级': Grade.GRADE_3,
  '四年级': Grade.GRADE_4,
  '五年级': Grade.GRADE_5,
  '六年级': Grade.GRADE_6,
};

/**
 * 将Application Grade转换为Prisma Grade
 *
 * @param grade Application层Grade枚举
 * @returns Prisma层Grade字符串
 */
export function toPrismaGrade(grade: Grade): string {
  const prismaGrade = TO_PRISMA_MAP[grade];
  if (!prismaGrade) {
    throw new Error(`Invalid grade value: ${grade}`);
  }
  return prismaGrade;
}

/**
 * 将Prisma Grade转换为Application Grade
 *
 * @param prismaGrade Prisma层Grade字符串
 * @returns Application层Grade枚举
 */
export function fromPrismaGrade(prismaGrade: string): Grade {
  const grade = FROM_PRISMA_MAP[prismaGrade];
  if (!grade) {
    throw new Error(`Invalid Prisma grade value: ${prismaGrade}`);
  }
  return grade;
}

/**
 * 验证Prisma Grade值是否有效
 *
 * @param prismaGrade Prisma层Grade字符串
 * @returns 是否为有效的Grade值
 */
export function isValidPrismaGrade(prismaGrade: string): boolean {
  return prismaGrade in FROM_PRISMA_MAP;
}

/**
 * 获取所有有效的Prisma Grade值
 *
 * @returns 所有Prisma Grade字符串数组
 */
export function getAllPrismaGrades(): string[] {
  return Object.keys(FROM_PRISMA_MAP);
}

/**
 * 获取所有有效的Application Grade值
 *
 * @returns 所有Application Grade枚举数组
 */
export function getAllApplicationGrades(): Grade[] {
  return Object.values(Grade);
}
