/**
 * Card Component Types
 *
 * 统一卡片组件的类型定义
 */

import {ReactNode} from 'react';
import {ViewStyle} from 'react-native';
import {Spacing} from '../../../styles/spacing';

/**
 * 卡片变体类型
 */
export type CardVariant = 'elevated' | 'outlined' | 'filled';

/**
 * 卡片组件属性
 */
export interface CardProps {
  /** 卡片变体样式 */
  variant?: CardVariant;
  /** 内边距大小 */
  padding?: keyof Spacing;
  /** 子元素 */
  children: ReactNode;
  /** 自定义容器样式 */
  style?: ViewStyle;
  /** 无障碍标签 */
  accessibilityLabel?: string;
  /** 测试ID */
  testID?: string;
  /** 点击回调（如果提供，卡片将可点击） */
  onPress?: () => void;
}

/**
 * 卡片变体样式配置
 */
export interface CardVariantStyles {
  /** 背景色 */
  backgroundColor: string;
  /** 边框颜色 */
  borderColor?: string;
  /** 边框宽度 */
  borderWidth: number;
  /** 阴影层级 */
  shadowLevel: 'none' | 'sm' | 'md' | 'lg';
}
