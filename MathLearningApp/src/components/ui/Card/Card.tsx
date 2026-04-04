/**
 * Card Component
 *
 * 统一卡片组件，支持多种变体
 * 使用设计系统 Token 确保样式一致性
 */

import React from 'react';
import {View, TouchableOpacity, StyleSheet, ViewStyle} from 'react-native';

import {CardProps, CardVariant, CardVariantStyles} from './Card.types';
import {designSystem} from '../../../styles/designSystem';

// ============================================================================
// RUNTIME VALIDATION CONSTANTS
// ============================================================================

const VALID_VARIANTS: CardVariant[] = ['elevated', 'outlined', 'filled'];
const VALID_PADDING_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const;
const DEFAULT_VARIANT: CardVariant = 'elevated';
const DEFAULT_PADDING = 'lg';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isValidVariant = (value: string): value is CardVariant =>
  VALID_VARIANTS.includes(value as CardVariant);

const isValidPadding = (value: string): value is keyof typeof designSystem.spacing =>
  VALID_PADDING_KEYS.includes(value);

// ============================================================================
// VARIANT CONFIGURATIONS
// ============================================================================

const VARIANT_CONFIG: Record<CardVariant, CardVariantStyles> = {
  elevated: {
    backgroundColor: designSystem.colors.surface.elevated,
    borderWidth: 0,
    shadowLevel: 'md',
  },
  outlined: {
    backgroundColor: designSystem.colors.surface.primary,
    borderColor: designSystem.colors.border,
    borderWidth: 1,
    shadowLevel: 'none',
  },
  filled: {
    backgroundColor: designSystem.colors.surface.secondary,
    borderWidth: 0,
    shadowLevel: 'none',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Card 组件
 *
 * @example
 * ```tsx
 * <Card variant="elevated" padding="lg">
 *   <Text>卡片内容</Text>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'lg',
  children,
  style,
  accessibilityLabel,
  testID,
  onPress,
}) => {
  // Runtime validation with fallback
  const safeVariant = isValidVariant(variant) ? variant : DEFAULT_VARIANT;
  const safePadding = isValidPadding(padding) ? padding : DEFAULT_PADDING;

  if (!isValidVariant(variant)) {
    console.warn(`[Card] Invalid variant "${variant}" provided. Falling back to "${DEFAULT_VARIANT}".`);
  }
  if (!isValidPadding(padding)) {
    console.warn(`[Card] Invalid padding "${padding}" provided. Falling back to "${DEFAULT_PADDING}".`);
  }

  const variantConfig = VARIANT_CONFIG[safeVariant];
  const shadowStyle = designSystem.shadows[variantConfig.shadowLevel];
  const paddingValue = designSystem.spacing[safePadding];

  const containerStyle: ViewStyle = {
    backgroundColor: variantConfig.backgroundColor,
    borderRadius: designSystem.borderRadius.lg,
    padding: paddingValue,
    borderWidth: variantConfig.borderWidth,
    borderColor: variantConfig.borderColor,
    ...shadowStyle,
  };

  // 安全的 onPress 处理（捕获错误防止崩溃）
  const handlePress = () => {
    if (onPress) {
      try {
        onPress();
      } catch (error) {
        console.error('[Card] onPress callback error:', error);
      }
    }
  };

  // 如果有 onPress，使用 TouchableOpacity 使卡片可点击
  if (onPress) {
    return (
      <TouchableOpacity
        style={[containerStyle, style]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[containerStyle, style]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </View>
  );
};

// ============================================================================
// MEMO EXPORT
// ============================================================================

export default React.memo(Card);
