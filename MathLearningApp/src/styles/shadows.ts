/**
 * Design System - Shadows
 *
 * 统一阴影系统，同时支持 iOS (shadow*) 和 Android (elevation)
 * 遵循 Material Design 阴影规范
 */

import {Platform, ViewStyle} from 'react-native';
import {Colors} from './colors';

/**
 * 阴影层级定义
 * 基于 Material Design elevation 规范
 */
export type ShadowLevel = 'none' | 'sm' | 'md' | 'lg';

/**
 * 阴影颜色 - 从颜色系统获取
 */
const SHADOW_COLOR = Colors.text.primary;

/**
 * iOS 阴影样式
 */
interface IOSShadowStyle {
  shadowColor: string;
  shadowOffset: {width: number; height: number};
  shadowOpacity: number;
  shadowRadius: number;
}

/**
 * Android 阴影样式
 */
interface AndroidShadowStyle {
  elevation: number;
}

/**
 * 完整阴影样式（平台适配）
 */
export type ShadowStyle = ViewStyle;

/**
 * 阴影配置
 */
const shadowConfigs: Record<
  ShadowLevel,
  {ios: IOSShadowStyle; android: AndroidShadowStyle}
> = {
  none: {
    ios: {
      shadowColor: 'transparent',
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: {
      elevation: 0,
    },
  },
  sm: {
    ios: {
      shadowColor: SHADOW_COLOR,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  },
  md: {
    ios: {
      shadowColor: SHADOW_COLOR,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  },
  lg: {
    ios: {
      shadowColor: SHADOW_COLOR,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  },
};

/**
 * 有效的阴影层级列表
 */
const validLevels: ShadowLevel[] = ['none', 'sm', 'md', 'lg'];

/**
 * 获取平台适配的阴影样式
 * @param level - 阴影层级 ('none' | 'sm' | 'md' | 'lg')
 * @returns 平台适配的阴影样式对象
 * @throws Error 如果传入无效的阴影层级
 */
export const getShadow = (level: ShadowLevel): ShadowStyle => {
  // 运行时验证
  if (!validLevels.includes(level)) {
    console.warn(`[DesignSystem] Invalid shadow level: "${level}". Falling back to "none".`);
    return shadowConfigs.none as ShadowStyle;
  }

  const config = shadowConfigs[level];
  return Platform.select({
    ios: config.ios,
    android: config.android,
    default: config.android,
  }) as ShadowStyle;
};

/**
 * 阴影样式对象（预定义所有层级）
 */
export const shadows: Record<ShadowLevel, ShadowStyle> = {
  none: getShadow('none'),
  sm: getShadow('sm'),
  md: getShadow('md'),
  lg: getShadow('lg'),
};

/**
 * 阴影类型
 */
export type Shadows = typeof shadows;

export default shadows;
