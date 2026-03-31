/**
 * TipCard - 拍摄提示卡片组件
 *
 * 为家长用户设计的友好提示卡片，显示拍摄小贴士
 * 使用温暖色调，清晰易读
 * 支持平板适配
 *
 * @example
 * <TipCard
 *   title="拍摄小贴士"
 *   tips={['确保光线充足', '把题目放在桌面上']}
 * />
 */

import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';

// 获取屏幕尺寸用于平板适配
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// 平板检测
const isTablet = () => {
  const pixelDensity = Dimensions.get('window').scale;
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  return Math.min(adjustedWidth, adjustedHeight) >= 900;
};

const IS_TABLET = isTablet();

// 平板适配字体大小
const scaleFontSize = (baseSize: number) => IS_TABLET ? baseSize * 1.2 : baseSize;

// 直接定义颜色值，避免 Flow 类型问题
const COLORS = {
  surface: '#ffffff',
  textPrimary: '#212121',
  textSecondary: '#424242',
  success: '#2e7d32',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// 间距常量
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

interface TipCardProps {
  /** 卡片标题 */
  title: string;
  /** 提示列表 */
  tips: string[];
  /** 图标 (emoji 或 icon name) */
  icon?: string;
  /** 自定义样式 */
  style?: any;
}

export const TipCard: React.FC<TipCardProps> = ({
  title,
  tips,
  icon = '📷',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 标题区域 */}
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* 提示列表 */}
      <View style={styles.tipList}>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Text style={styles.bullet}>✓</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg * (IS_TABLET ? 1.25 : 1),
    // 阴影效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: scaleFontSize(24),
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: scaleFontSize(20),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tipList: {
    gap: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    color: COLORS.success,
    fontSize: scaleFontSize(18),
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: scaleFontSize(18),
    color: COLORS.textSecondary,
    lineHeight: scaleFontSize(28),
  },
});

export default TipCard;
