/**
 * Icon Component
 *
 * 统一图标组件，封装 MaterialIcons
 * 使用设计系统 Token 确保样式一致性
 */

import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {IconProps, IconSize, IconSizeConfig} from './Icon.types';
import {designSystem} from '../../../styles/designSystem';

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const SIZE_CONFIG: Record<IconSize, IconSizeConfig> = {
  sm: {size: 16},
  md: {size: 24},
  lg: {size: 32},
  xl: {size: 48},
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Icon 组件
 *
 * @example
 * ```tsx
 * <Icon name="home" size="md" color={designSystem.colors.primary} />
 * ```
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = designSystem.colors.text.primary,
  accessibilityLabel,
  testID,
}) => {
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <MaterialIcons
      name={name}
      size={sizeConfig.size}
      color={color}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      testID={testID}
    />
  );
};

// ============================================================================
// MEMO EXPORT
// ============================================================================

export default React.memo(Icon);

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * 获取图标尺寸值
 * @param size - 图标尺寸类型
 * @returns 图标大小 (number)
 */
export const getIconSize = (size: IconSize): number => {
  return SIZE_CONFIG[size].size;
};
