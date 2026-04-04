/**
 * Design System - Spacing
 *
 * 统一间距系统，确保整个应用的间距一致性
 * 基于 4dp 基础单位
 */

/**
 * 间距值定义
 * 基于 4dp 基础单位，遵循 4-8-12-16-20-24-32 递增规律
 */
export const spacing = {
  /** 4dp - 极小间距 */
  xs: 4,
  /** 8dp - 小间距 */
  sm: 8,
  /** 12dp - 中等间距 */
  md: 12,
  /** 16dp - 大间距（默认padding） */
  lg: 16,
  /** 20dp - 较大间距 */
  xl: 20,
  /** 24dp - 区块间距 */
  xxl: 24,
  /** 32dp - 大区块间距 */
  xxxl: 32,
} as const;

/**
 * 间距类型
 */
export type Spacing = typeof spacing;

/**
 * 间距键类型
 */
export type SpacingKey = keyof Spacing;

/**
 * 获取间距值
 * @param key - 间距键名
 * @returns 间距数值
 */
export const getSpacing = (key: SpacingKey): number => {
  return spacing[key];
};

export default spacing;
