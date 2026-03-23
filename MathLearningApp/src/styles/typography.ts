/**
 * Story 5-4: Friendly Typography System
 * 使用友好的字体系统提高可读性和亲和力
 */

import {TextStyle} from 'react-native';

/**
 * 字体家族
 * 使用系统字体与圆角回退字体
 */
export const fontFamily = {
  // 主字体 - 系统默认
  regular: 'System',

  // 中文字体 - PingFang SC (友好、圆润)
  chinese: 'PingFang SC',

  // 英文字体 - SF Pro (圆角)
  english: 'SF Pro Display',

  // 等宽字体 - 用于数字显示
  mono: 'SF Mono',
} as const;

/**
 * 字重
 */
export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

/**
 * 字号系统
 */
export const fontSize = {
  // 大标题
  displayLarge: 32,
  displayMedium: 28,
  displaySmall: 24,

  // 标题
  headlineLarge: 22,
  headlineMedium: 20,
  headlineSmall: 18,

  // 正文
  bodyLarge: 17,
  body: 16,
  bodySmall: 15,

  // 辅助文本
  caption: 14,
  overline: 12,
} as const;

/**
 * 行高系统
 * 增加行高以提高可读性（1.6-1.8倍）
 */
export const lineHeight = {
  // 标题行高 - 较紧凑
  heading: 1.3,

  // 正文行高 - 宽松舒适
  body: 1.7,
  bodyLarge: 1.75,

  // 辅助文本行高
  caption: 1.5,
} as const;

/**
 * 字间距
 * 增加字间距以提高可读性
 */
export const letterSpacing = {
  // 标题 - 标准字间距
  heading: 0,

  // 大标题 - 稍宽
  display: 0.5,

  // 正文 - 标准到稍宽
  body: 0.2,
  bodyLarge: 0.25,

  // 小文本 - 稍宽
  small: 0.3,
} as const;

/**
 * 文本样式预设
 */
export const typography = {
  // ========== 大标题 ==========
  displayLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.displayLarge,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.displayLarge * lineHeight.heading,
    letterSpacing: letterSpacing.display,
  } as TextStyle,

  displayMedium: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.displayMedium,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.displayMedium * lineHeight.heading,
    letterSpacing: letterSpacing.display,
  } as TextStyle,

  displaySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.displaySmall,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.displaySmall * lineHeight.heading,
    letterSpacing: letterSpacing.display,
  } as TextStyle,

  // ========== 标题 ==========
  headlineLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.headlineLarge,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.headlineLarge * lineHeight.heading,
    letterSpacing: letterSpacing.heading,
  } as TextStyle,

  headlineMedium: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.headlineMedium,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.headlineMedium * lineHeight.heading,
    letterSpacing: letterSpacing.heading,
  } as TextStyle,

  headlineSmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.headlineSmall,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.headlineSmall * lineHeight.heading,
    letterSpacing: letterSpacing.heading,
  } as TextStyle,

  // ========== 正文 ==========
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.bodyLarge * lineHeight.bodyLarge,
    letterSpacing: letterSpacing.bodyLarge,
  } as TextStyle,

  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.body * lineHeight.body,
    letterSpacing: letterSpacing.body,
  } as TextStyle,

  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.bodySmall * lineHeight.body,
    letterSpacing: letterSpacing.body,
  } as TextStyle,

  // ========== 辅助文本 ==========
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.caption * lineHeight.caption,
    letterSpacing: letterSpacing.small,
  } as TextStyle,

  overline: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.overline,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.overline * lineHeight.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  } as TextStyle,

  // ========== 特殊用途 ==========
  // 按钮文本
  button: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
    letterSpacing: 0.3,
  } as TextStyle,

  // 数字显示（等宽）
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.body * lineHeight.body,
    letterSpacing: 0,
  } as TextStyle,
} as const;

/**
 * 语义化文本样式
 * 用于特定场景的预设样式
 */
export const semanticTypography = {
  // 友好的欢迎消息
  welcome: {
    ...typography.displayMedium,
    color: '#2C3E50',
  } as TextStyle,

  // 鼓励性消息
  encouragement: {
    ...typography.headlineMedium,
    color: '#5C9EAD',
  } as TextStyle,

  // 支持性消息
  supportive: {
    ...typography.bodyLarge,
    color: '#5A6C7D',
  } as TextStyle,

  // 警告消息（柔和）
  warning: {
    ...typography.body,
    color: '#D4A574',
  } as TextStyle,

  // 错误消息（柔和）
  error: {
    ...typography.body,
    color: '#E8A87C',
  } as TextStyle,

  // 成功消息
  success: {
    ...typography.body,
    color: '#7CB9A8',
  } as TextStyle,
} as const;

/**
 * 获取响应式字号
 * 根据屏幕宽度调整字号
 */
export const getResponsiveFontSize = (baseSize: number, screenWidth: number): number => {
  const baseWidth = 375; // iPhone SE 宽度
  const scaleFactor = Math.min(Math.max(screenWidth / baseWidth, 0.85), 1.15);
  return Math.round(baseSize * scaleFactor);
};

/**
 * 默认导出
 */
export default typography;
