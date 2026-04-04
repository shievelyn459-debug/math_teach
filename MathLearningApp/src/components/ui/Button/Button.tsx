/**
 * Button Component
 *
 * 统一按钮组件，支持多种变体、尺寸和状态
 * 使用设计系统 Token 确保样式一致性
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {ButtonProps, ButtonVariant, ButtonSize, ButtonSizeConfig, ButtonVariantStyles} from './Button.types';
import {designSystem} from '../../../styles/designSystem';

// ============================================================================
// RUNTIME VALIDATION CONSTANTS
// ============================================================================

const VALID_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost'];
const VALID_SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const DEFAULT_VARIANT: ButtonVariant = 'primary';
const DEFAULT_SIZE: ButtonSize = 'md';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isValidVariant = (value: string): value is ButtonVariant =>
  VALID_VARIANTS.includes(value as ButtonVariant);

const isValidSize = (value: string): value is ButtonSize =>
  VALID_SIZES.includes(value as ButtonSize);

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const SIZE_CONFIG: Record<ButtonSize, ButtonSizeConfig> = {
  sm: {
    paddingVertical: designSystem.spacing.xs,
    paddingHorizontal: designSystem.spacing.md,
    fontSize: 14,
    iconSize: 16,
    borderRadius: designSystem.borderRadius.sm,
  },
  md: {
    paddingVertical: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.lg,
    fontSize: 16,
    iconSize: 20,
    borderRadius: designSystem.borderRadius.md,
  },
  lg: {
    paddingVertical: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.xl,
    fontSize: 18,
    iconSize: 24,
    borderRadius: designSystem.borderRadius.md,
  },
};

// ============================================================================
// VARIANT STYLES
// ============================================================================

const VARIANT_STYLES: Record<ButtonVariant, ButtonVariantStyles> = {
  primary: {
    backgroundColor: designSystem.colors.primary,
    textColor: designSystem.colors.text.inverse,
    borderColor: designSystem.colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: designSystem.colors.secondary,
    textColor: designSystem.colors.text.inverse,
    borderColor: designSystem.colors.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: designSystem.colors.primary,
    borderColor: designSystem.colors.primary,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: designSystem.colors.primary,
    borderColor: 'transparent',
    borderWidth: 0,
  },
};

// ============================================================================
// DISABLED STYLES
// ============================================================================

const DISABLED_STYLES: ButtonVariantStyles = {
  backgroundColor: designSystem.colors.backgroundTertiary,
  textColor: designSystem.colors.text.disabled,
  borderColor: designSystem.colors.border,
  borderWidth: 1,
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Button 组件
 *
 * @example
 * ```tsx
 * <Button
 *   title="点击我"
 *   onPress={() => console.log('pressed')}
 *   variant="primary"
 *   size="md"
 * />
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  title,
  accessibilityLabel,
  accessibilityHint,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  testID,
}) => {
  // Runtime validation with fallback
  const safeVariant = isValidVariant(variant) ? variant : DEFAULT_VARIANT;
  const safeSize = isValidSize(size) ? size : DEFAULT_SIZE;

  if (!isValidVariant(variant)) {
    console.warn(`[Button] Invalid variant "${variant}" provided. Falling back to "${DEFAULT_VARIANT}".`);
  }
  if (!isValidSize(size)) {
    console.warn(`[Button] Invalid size "${size}" provided. Falling back to "${DEFAULT_SIZE}".`);
  }

  // Dev warning for empty title
  if (!title && !leftIcon && !rightIcon) {
    console.warn('[Button] Button should have at least a title or an icon.');
  }

  const sizeConfig = SIZE_CONFIG[safeSize];
  const variantStyles = disabled ? DISABLED_STYLES : VARIANT_STYLES[safeVariant];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sizeConfig.paddingVertical,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    backgroundColor: variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
    borderWidth: variantStyles.borderWidth,
    borderRadius: sizeConfig.borderRadius,
    opacity: disabled && !loading ? 0.6 : 1,
  };

  const textStyleMerged: TextStyle = {
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
    color: variantStyles.textColor,
    textAlign: 'center',
  };

  const handlePress = (event: any) => {
    if (!disabled && !loading && onPress) {
      try {
        onPress(event);
      } catch (error) {
        console.error('[Button] onPress callback error:', error);
      }
    }
  };

  const renderIcon = (iconName: string, position: 'left' | 'right') => {
    const iconColor = disabled ? DISABLED_STYLES.textColor : variantStyles.textColor;
    const marginStyle = position === 'left' ? {marginRight: designSystem.spacing.xs} : {marginLeft: designSystem.spacing.xs};

    return (
      <MaterialIcons
        name={iconName}
        size={sizeConfig.iconSize}
        color={iconColor}
        style={marginStyle}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
          style={styles.spinner}
        />
      ) : (
        <>
          {leftIcon && renderIcon(leftIcon, 'left')}
          <Text style={[textStyleMerged, textStyle]}>{title}</Text>
          {rightIcon && renderIcon(rightIcon, 'right')}
        </>
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  spinner: {
    marginHorizontal: designSystem.spacing.sm,
  },
});

// ============================================================================
// MEMO EXPORT
// ============================================================================

export default React.memo(Button);
