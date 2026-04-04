/**
 * Typography Component
 *
 * 统一文字组件，支持多种变体样式
 * 使用设计系统 Token 确保样式一致性
 */

import React from 'react';
import {Text, StyleSheet, TextStyle} from 'react-native';

import {
  TypographyProps,
  TypographyVariant,
  TypographyVariantStyles,
  TypographyAlign,
} from './Typography.types';
import {designSystem} from '../../../styles/designSystem';

// ============================================================================
// RUNTIME VALIDATION CONSTANTS
// ============================================================================

const VALID_VARIANTS: TypographyVariant[] = [
  'displayLarge', 'displayMedium', 'displaySmall',
  'headlineLarge', 'headlineMedium', 'headlineSmall',
  'bodyLarge', 'body', 'bodySmall',
  'caption', 'overline',
];
const VALID_ALIGNS: TypographyAlign[] = ['left', 'center', 'right', 'justify'];
const DEFAULT_VARIANT: TypographyVariant = 'body';
const DEFAULT_ALIGN: TypographyAlign = 'left';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isValidVariant = (value: string): value is TypographyVariant =>
  VALID_VARIANTS.includes(value as TypographyVariant);

const isValidAlign = (value: string): value is TypographyAlign =>
  VALID_ALIGNS.includes(value as TypographyAlign);

// ============================================================================
// VARIANT CONFIGURATIONS
// ============================================================================

const VARIANT_CONFIG: Record<TypographyVariant, TypographyVariantStyles> = {
  displayLarge: {
    fontSize: 57,
    fontWeight: '400',
    lineHeight: 64,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: '400',
    lineHeight: 52,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 44,
  },
  headlineLarge: {
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 40,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 36,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 32,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
};

// ============================================================================
// ALIGNMENT HELPER (with validation)
// ============================================================================

const getAlignment = (align: TypographyAlign): TextStyle => {
  const alignmentMap: Record<TypographyAlign, TextStyle> = {
    left: {textAlign: 'left'},
    center: {textAlign: 'center'},
    right: {textAlign: 'right'},
    justify: {textAlign: 'justify'},
  };
  // Runtime validation - return default if invalid
  if (!isValidAlign(align)) {
    console.warn(`[Typography] Invalid align "${align}" provided. Falling back to "${DEFAULT_ALIGN}".`);
    return alignmentMap[DEFAULT_ALIGN];
  }
  return alignmentMap[align];
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Typography 组件
 *
 * @example
 * ```tsx
 * <Typography variant="headlineMedium" color={designSystem.colors.text.primary}>
 *   标题文字
 * </Typography>
 * ```
 */
export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = designSystem.colors.text.primary,
  align = 'left',
  children,
  style,
  accessibilityLabel,
  testID,
  numberOfLines,
  allowFontScaling = true,
}) => {
  // Runtime validation with fallback
  const safeVariant = isValidVariant(variant) ? variant : DEFAULT_VARIANT;
  const safeAlign = isValidAlign(align) ? align : DEFAULT_ALIGN;

  if (!isValidVariant(variant)) {
    console.warn(`[Typography] Invalid variant "${variant}" provided. Falling back to "${DEFAULT_VARIANT}".`);
  }

  const variantConfig = VARIANT_CONFIG[safeVariant];
  const alignmentStyle = getAlignment(safeAlign);

  const textStyle: TextStyle = {
    fontSize: variantConfig.fontSize,
    fontWeight: variantConfig.fontWeight,
    lineHeight: variantConfig.lineHeight,
    letterSpacing: variantConfig.letterSpacing,
    textTransform: variantConfig.textTransform,
    color,
    ...alignmentStyle,
  };

  return (
    <Text
      style={[textStyle, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      numberOfLines={numberOfLines}
      allowFontScaling={allowFontScaling}
      testID={testID}
    >
      {children}
    </Text>
  );
};

// ============================================================================
// MEMO EXPORT
// ============================================================================

export default React.memo(Typography);
