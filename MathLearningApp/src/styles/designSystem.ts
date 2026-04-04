/**
 * Design System - 统一设计系统入口
 *
 * 整合所有设计 Token：颜色、字体、间距、圆角、阴影
 * 提供统一的访问入口，确保整个应用的样式一致性
 *
 * @example
 * import { designSystem } from './styles/designSystem';
 *
 * // 使用颜色
 * backgroundColor: designSystem.colors.primary
 *
 * // 使用间距
 * padding: designSystem.spacing.lg
 *
 * // 使用圆角
 * borderRadius: designSystem.borderRadius.md
 *
 * // 使用阴影
 * ...designSystem.shadows.md
 */

// 导入现有设计系统模块
import {Colors, ColorScheme} from './colors';
import {typography, Typography} from './typography';

// 导入新创建的设计系统模块
import {spacing, Spacing} from './spacing';
import {borderRadius, BorderRadius} from './borderRadius';
import {shadows, Shadows, ShadowStyle} from './shadows';

/**
 * 统一设计系统对象
 *
 * 包含所有设计 Token，供整个应用使用
 */
export const designSystem = {
  /** 颜色系统 - WCAG AA 兼容 */
  colors: Colors,
  /** 字体系统 - 统一字体样式 */
  typography,
  /** 间距系统 - 基于 4dp 单位 */
  spacing,
  /** 圆角系统 - 统一圆角值 */
  borderRadius,
  /** 阴影系统 - 平台适配 */
  shadows,
} as const;

/**
 * 设计系统类型
 */
export type DesignSystem = typeof designSystem;

/**
 * 导出类型定义
 */
export type {
  ColorScheme,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ShadowStyle,
};

/**
 * 默认导出设计系统
 */
export default designSystem;

// ============================================================================
// 重新导出所有子模块（方便按需导入）
// ============================================================================

export {Colors} from './colors';
export {typography} from './typography';
export {spacing, getSpacing, SpacingKey} from './spacing';
export {borderRadius, getBorderRadius, BorderRadiusKey} from './borderRadius';
export {shadows, getShadow, ShadowLevel} from './shadows';

// ============================================================================
// 便捷工具函数
// ============================================================================

/**
 * 创建内边距（padding）样式对象
 *
 * 遵循 CSS shorthand 规则：
 * - 1个参数: 四边相同
 * - 2个参数: 垂直(top/bottom) + 水平(right/left)
 * - 3个参数: top + right/left + bottom
 * - 4个参数: top + right + bottom + left
 *
 * @param top - 上内边距键名 (必填)
 * @param right - 右内边距键名 (可选，默认与 top 相同，作为水平方向)
 * @param bottom - 下内边距键名 (可选，默认与 top 相同)
 * @param left - 左内边距键名 (可选，默认与 right 相同)
 * @returns 包含 paddingTop/Right/Bottom/Left 的样式对象
 *
 * @example
 * // 四边相同
 * ...createPadding('lg')
 *
 * // 垂直(lg) + 水平(md)
 * ...createPadding('lg', 'md')
 *
 * // top(lg) + right/left(md) + bottom(sm)
 * ...createPadding('lg', 'md', 'sm')
 *
 * // 四边不同
 * ...createPadding('lg', 'md', 'sm', 'xs')
 */
export const createPadding = (
  top: keyof Spacing,
  right?: keyof Spacing,
  bottom?: keyof Spacing,
  left?: keyof Spacing,
): {paddingTop: number; paddingRight: number; paddingBottom: number; paddingLeft: number} => {
  return {
    paddingTop: spacing[top],
    paddingRight: spacing[right ?? top],
    paddingBottom: spacing[bottom ?? top],
    paddingLeft: spacing[left ?? right ?? top],
  };
};

/**
 * 创建外边距（margin）样式对象
 *
 * 遵循 CSS shorthand 规则：
 * - 1个参数: 四边相同
 * - 2个参数: 垂直(top/bottom) + 水平(right/left)
 * - 3个参数: top + right/left + bottom
 * - 4个参数: top + right + bottom + left
 *
 * @param top - 上外边距键名 (必填)
 * @param right - 右外边距键名 (可选，默认与 top 相同，作为水平方向)
 * @param bottom - 下外边距键名 (可选，默认与 top 相同)
 * @param left - 左外边距键名 (可选，默认与 right 相同)
 * @returns 包含 marginTop/Right/Bottom/Left 的样式对象
 *
 * @example
 * // 四边相同
 * ...createMargin('lg')
 *
 * // 垂直(lg) + 水平(md)
 * ...createMargin('lg', 'md')
 */
export const createMargin = (
  top: keyof Spacing,
  right?: keyof Spacing,
  bottom?: keyof Spacing,
  left?: keyof Spacing,
): {marginTop: number; marginRight: number; marginBottom: number; marginLeft: number} => {
  return {
    marginTop: spacing[top],
    marginRight: spacing[right ?? top],
    marginBottom: spacing[bottom ?? top],
    marginLeft: spacing[left ?? right ?? top],
  };
};

/**
 * @deprecated 使用 createPadding 代替
 * 创建带间距的样式对象 (已重命名为 createPadding)
 */
export const createSpacing = createPadding;
