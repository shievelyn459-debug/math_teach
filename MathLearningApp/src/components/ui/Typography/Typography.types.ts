/**
 * Typography Component Types
 *
 * 统一文字组件的类型定义
 */

import {ReactNode} from 'react';
import {TextStyle} from 'react-native';

/**
 * Typography 变体类型
 */
export type TypographyVariant =
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'headlineSmall'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'overline';

/**
 * 文字对齐类型
 */
export type TypographyAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Typography 组件属性
 */
export interface TypographyProps {
  /** 文字变体样式 */
  variant?: TypographyVariant;
  /** 文字颜色 */
  color?: string;
  /** 文字对齐 */
  align?: TypographyAlign;
  /** 子元素 */
  children: ReactNode;
  /** 自定义样式 */
  style?: TextStyle;
  /** 无障碍标签 */
  accessibilityLabel?: string;
  /** 测试ID */
  testID?: string;
  /** 是否允许换行 */
  numberOfLines?: number;
  /** 是否允许缩放字体 */
  allowFontScaling?: boolean;
}

/**
 * Typography 变体样式配置
 */
export interface TypographyVariantStyles {
  /** 字体大小 */
  fontSize: number;
  /** 字重 */
  fontWeight: '400' | '500' | '600' | '700';
  /** 行高 */
  lineHeight: number;
  /** 字母间距 */
  letterSpacing?: number;
  /** 文字转换 */
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
}
