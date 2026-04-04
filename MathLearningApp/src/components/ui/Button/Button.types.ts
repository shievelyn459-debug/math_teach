/**
 * Button Component Types
 *
 * 统一按钮组件的类型定义
 */

import {GestureResponderEvent, TextStyle, ViewStyle} from 'react-native';

/**
 * 按钮变体类型
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

/**
 * 按钮尺寸类型
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * 按钮组件属性
 */
export interface ButtonProps {
  /** 按钮变体样式 */
  variant?: ButtonVariant;
  /** 按钮尺寸 */
  size?: ButtonSize;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 点击回调 */
  onPress: (event: GestureResponderEvent) => void;
  /** 按钮文本 */
  title: string;
  /** 无障碍标签 */
  accessibilityLabel?: string;
  /** 无障碍提示 */
  accessibilityHint?: string;
  /** 左侧图标名称 (MaterialIcons) */
  leftIcon?: string;
  /** 右侧图标名称 (MaterialIcons) */
  rightIcon?: string;
  /** 自定义容器样式 */
  style?: ViewStyle;
  /** 自定义文本样式 */
  textStyle?: TextStyle;
  /** 测试ID */
  testID?: string;
}

/**
 * 按钮尺寸配置
 */
export interface ButtonSizeConfig {
  /** 垂直内边距 */
  paddingVertical: number;
  /** 水平内边距 */
  paddingHorizontal: number;
  /** 字体大小 */
  fontSize: number;
  /** 图标大小 */
  iconSize: number;
  /** 圆角 */
  borderRadius: number;
}

/**
 * 按钮变体样式配置
 */
export interface ButtonVariantStyles {
  /** 背景色 */
  backgroundColor: string;
  /** 文字颜色 */
  textColor: string;
  /** 边框颜色 */
  borderColor: string;
  /** 边框宽度 */
  borderWidth: number;
}
