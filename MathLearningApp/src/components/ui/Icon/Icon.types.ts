/**
 * Icon Component Types
 *
 * 统一图标组件的类型定义
 */

/**
 * 图标尺寸类型
 */
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * 图标组件属性
 */
export interface IconProps {
  /** MaterialIcons 图标名称 */
  name: string;
  /** 图标尺寸 */
  size?: IconSize;
  /** 图标颜色 */
  color?: string;
  /** 无障碍标签 */
  accessibilityLabel?: string;
  /** 测试ID */
  testID?: string;
}

/**
 * 图标尺寸配置
 */
export interface IconSizeConfig {
  /** 图标大小 (dp) */
  size: number;
}
