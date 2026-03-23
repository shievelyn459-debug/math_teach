/**
 * Story 5-4: Anxiety-Reducing Color Palette
 * 使用平静、令人安心的颜色减少用户焦虑感
 *
 * 注意：这是专门为降低焦虑设计的色彩系统
 * 与标准的 WCAG 颜色系统 (colors.ts) 并存
 * 在需要减少焦虑的界面使用此颜色系统
 */

/**
 * 情感化颜色映射
 * 每种颜色都经过精心选择以产生特定的情感反应
 */
export const emotionalColors = {
  calm: '#5C9EAD',           // 柔和青色 - 正常状态
  encouraging: '#7CB9A8',    // 薄荷绿 - 进度/成功
  supportive: '#C38D9E',     // 柔和紫色 - 帮助/支持
  gentleError: '#E8A87C',    // 桃色 - 错误（不刺眼）
  warmBackground: '#F7F3E8', // 奶油色 - 背景
  softAccent: '#D4A574',     // 暖棕 - 警告/强调
  comforting: '#9EB8D9',     // 柔和蓝 - 信息
} as const;

/**
 * 主色调
 * 替换原有的明亮色彩为更柔和的版本
 */
export const primaryColors = {
  // 主色 - 柔和青色替代明亮蓝色
  primary: emotionalColors.calm,
  primaryLight: '#7DB8C5',
  primaryDark: '#4A8A99',

  // 辅助色 - 薄荷绿替代明亮绿色
  secondary: emotionalColors.encouraging,
  secondaryLight: '#9DD4B8',
  secondaryDark: '#5A9E88',

  // 强调色 - 柔和紫色
  accent: emotionalColors.supportive,
  accentLight: '#D4A8B6',
  accentDark: '#A86F82',
} as const;

/**
 * 功能性颜色
 * 错误和警告使用更柔和的色调
 */
export const functionalColors = {
  // 成功 - 薄荷绿
  success: '#7CB9A8',
  successLight: '#A8D9C4',
  successDark: '#5A9E88',

  // 错误 - 桃色（不是红色！）
  error: emotionalColors.gentleError,
  errorLight: '#F0C4A8',
  errorDark: '#D68C5C',

  // 警告 - 暖棕色
  warning: emotionalColors.softAccent,
  warningLight: '#E5C29E',
  warningDark: '#B88B5A',

  // 信息 - 柔和蓝
  info: emotionalColors.comforting,
  infoLight: '#BFD0E8',
  infoDark: '#7A9CB8',
} as const;

/**
 * 背景颜色
 * 使用温暖的奶油色替代冷灰色
 */
export const backgroundColors = {
  // 主背景 - 温暖的奶油色
  primary: emotionalColors.warmBackground,

  // 卡片背景 - 纯白色
  card: '#FFFFFF',

  // 输入框背景 - 极浅灰
  input: '#FAFAFA',

  // 覆盖层背景 - 半透明
  overlay: 'rgba(92, 158, 173, 0.15)',

  // 禁用状态
  disabled: '#F0EBE0',
} as const;

/**
 * 文本颜色
 */
export const textColors = {
  // 主文本 - 深灰（不是纯黑）
  primary: '#2C3E50',

  // 次要文本 - 中灰
  secondary: '#5A6C7D',

  // 辅助文本 - 浅灰
  tertiary: '#8A9AAC',

  // 禁用文本
  disabled: '#BCC8D4',

  // 反白文本（用于深色背景）
  inverse: '#FFFFFF',

  // 链接文本
  link: primaryColors.primary,
} as const;

/**
 * 边框颜色
 */
export const borderColors = {
  // 默认边框
  default: '#E0E5EA',

  // 浅色边框
  light: '#F0F3F6',

  // 深色边框
  dark: '#C8D0DA',

  // 焦点边框
  focus: primaryColors.primary,

  // 错误边框
  error: functionalColors.errorLight,

  // 成功边框
  success: functionalColors.successLight,
} as const;

/**
 * 阴影颜色
 * 使用柔和的阴影
 */
export const shadowColors = {
  // 轻微阴影
  light: 'rgba(92, 158, 173, 0.08)',

  // 标准阴影
  medium: 'rgba(92, 158, 173, 0.12)',

  // 深阴影
  dark: 'rgba(92, 158, 173, 0.18)',
} as const;

/**
 * 渐变色
 */
export const gradients = {
  // 主渐变 - 青色到薄荷绿
  primary: ['#5C9EAD', '#7CB9A8'],

  // 成功渐变
  success: ['#7CB9A8', '#9DD4B8'],

  // 支持渐变 - 紫色到蓝色
  supportive: ['#C38D9E', '#9EB8D9'],

  // 温暖渐变
  warm: ['#E8A87C', '#D4A574'],
} as const;

/**
 * 完整颜色主题
 */
export const calmingColors = {
  ...emotionalColors,
  ...primaryColors,
  ...functionalColors,
  ...backgroundColors,
  ...textColors,
  ...borderColors,
  ...shadowColors,
  ...gradients,

  // 兼容性 - 保留旧颜色名的映射
  blue: primaryColors.primary,
  green: functionalColors.success,
  red: functionalColors.error,
  orange: functionalColors.warning,
  gray: textColors.secondary,
} as const;

/**
 * 获取情感对应的颜色
 * @param emotion 情感类型
 * @returns 颜色值
 */
export const getEmotionalColor = (emotion: keyof typeof emotionalColors): string => {
  return emotionalColors[emotion];
};

/**
 * 获取用于特定状态的背景色
 * @param state 状态类型
 * @returns 背景色
 */
export const getStateBackgroundColor = (state: 'success' | 'error' | 'warning' | 'info'): string => {
  const bgMap = {
    success: 'rgba(124, 185, 168, 0.15)',
    error: 'rgba(232, 168, 124, 0.15)',
    warning: 'rgba(212, 165, 116, 0.15)',
    info: 'rgba(158, 184, 217, 0.15)',
  };
  return bgMap[state];
};

/**
 * 默认导出
 */
export default calmingColors;
