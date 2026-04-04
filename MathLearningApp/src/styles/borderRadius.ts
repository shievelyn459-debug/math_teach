/**
 * Design System - Border Radius
 *
 * 统一圆角系统，确保整个应用的圆角一致性
 */

/**
 * 圆角值定义
 */
export const borderRadius = {
  /** 0 - 无圆角 */
  none: 0,
  /** 4dp - 小圆角（按钮、标签） */
  sm: 4,
  /** 8dp - 中圆角（输入框、小组件） */
  md: 8,
  /** 12dp - 大圆角（卡片） */
  lg: 12,
  /** 16dp - 超大圆角（大卡片、容器） */
  xl: 16,
  /** 9999dp - 完全圆形（头像、圆形按钮） */
  full: 9999,
} as const;

/**
 * 圆角类型
 */
export type BorderRadius = typeof borderRadius;

/**
 * 圆角键类型
 */
export type BorderRadiusKey = keyof BorderRadius;

/**
 * 获取圆角值
 * @param key - 圆角键名
 * @returns 圆角数值
 */
export const getBorderRadius = (key: BorderRadiusKey): number => {
  return borderRadius[key];
};

export default borderRadius;
