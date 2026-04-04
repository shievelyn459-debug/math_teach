/**
 * Spacer Component
 *
 * 统一间距组件，使用设计系统的 spacing 值
 * 支持水平和垂直方向
 */

import React from 'react';
import {View, ViewStyle} from 'react-native';

import {spacing, SpacingKey} from '../../../styles/spacing';

// ============================================================================
// RUNTIME VALIDATION CONSTANTS
// ============================================================================

const VALID_SIZES: SpacingKey[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'];
const DEFAULT_SIZE: SpacingKey = 'md';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isValidSize = (value: string): value is SpacingKey =>
  VALID_SIZES.includes(value as SpacingKey);

// ============================================================================
// TYPES
// ============================================================================

export interface SpacerProps {
  /** 间距大小 (使用 spacing 系统的键名) */
  size?: SpacingKey;
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
  /** 自定义样式 */
  style?: ViewStyle;
  /** 测试ID */
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Spacer 组件
 *
 * @example
 * ```tsx
 * // 垂直间距
 * <Spacer size="lg" />
 *
 * // 水平间距
 * <Spacer size="md" direction="horizontal" />
 * ```
 */
export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  direction = 'vertical',
  style,
  testID,
}) => {
  // Runtime validation with fallback
  const safeSize = isValidSize(size) ? size : DEFAULT_SIZE;

  if (!isValidSize(size)) {
    console.warn(`[Spacer] Invalid size "${size}" provided. Falling back to "${DEFAULT_SIZE}".`);
  }

  const spacingValue = spacing[safeSize];

  const containerStyle: ViewStyle =
    direction === 'vertical'
      ? {height: spacingValue, width: '100%'}
      : {width: spacingValue, height: '100%'};

  return <View style={[containerStyle, style]} testID={testID} />;
};

// ============================================================================
// MEMO EXPORT
// ============================================================================

export default React.memo(Spacer);

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * 快捷垂直间距组件
 */
export const VSpacer: React.FC<Omit<SpacerProps, 'direction'>> = props => (
  <Spacer {...props} direction="vertical" />
);

/**
 * 快捷水平间距组件
 */
export const HSpacer: React.FC<Omit<SpacerProps, 'direction'>> = props => (
  <Spacer {...props} direction="horizontal" />
);
