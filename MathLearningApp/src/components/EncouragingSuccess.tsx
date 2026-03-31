/**
 * Story 5-4: Encouraging Success Component
 * 使用鼓励性的成功状态庆祝用户成就
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer} from '../components/ui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

interface EncouragingSuccessProps {
  /** 成功图标 */
  icon?: string;
  /** 标题 */
  title: string;
  /** 详细消息 */
  message?: string;
  /** 是否显示庆祝动画 */
  showCelebration?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自动关闭延迟（毫秒），0 表示不自动关闭 */
  autoCloseDelay?: number;
  /** 进度里程碑（可选） */
  milestone?: {
    current: number;
    total: number;
    label?: string;
  };
}

/**
 * 鼓励性的成功状态组件
 * 使用积极的反馈庆祝用户成就
 */
const EncouragingSuccess: React.FC<EncouragingSuccessProps> = ({
  icon = 'check-circle',
  title,
  message,
  showCelebration = true,
  onClose,
  autoCloseDelay = 3000,
  milestone,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // 入场动画
    opacity.value = withTiming(1, {duration: 300});
    scale.value = withTiming(1, {duration: 400});

    // 庆祝动画
    if (showCelebration) {
      rotation.value = withSequence(
        withTiming(-10, {duration: 150}),
        withTiming(10, {duration: 150}),
        withTiming(-5, {duration: 100}),
        withTiming(5, {duration: 100}),
        withTiming(0, {duration: 100})
      );
    }

    // 自动关闭
    if (autoCloseDelay > 0 && onClose) {
      const timer = setTimeout(() => {
        opacity.value = withTiming(
          0,
          {duration: 300},
          () => {
            'worklet';
            runOnJS(onClose)();
          }
        );
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [showCelebration, autoCloseDelay, onClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {scale: scale.value},
      {rotate: `${rotation.value}deg`},
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        {/* 成功图标 */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Icon name={icon} size="xl" color={designSystem.colors.success.default} />
        </Animated.View>

        <Spacer size="lg" />

        {/* 标题 */}
        <Typography variant="headlineMedium" align="center">
          {title}
        </Typography>

        {/* 消息 */}
        {message && (
          <>
            <Spacer size="sm" />
            <Typography
              variant="body"
              color={designSystem.colors.text.secondary}
              align="center">
              {message}
            </Typography>
          </>
        )}

        {/* 里程碑显示 */}
        {milestone && (
          <View style={styles.milestone}>
            <Typography
              variant="caption"
              color={designSystem.colors.text.hint}
              align="center">
              {milestone.label || '进度'}: {milestone.current}/{milestone.total}
            </Typography>
            <Spacer size="xs" />
            <View style={styles.milestoneBar}>
              <View
                style={[
                  styles.milestoneProgress,
                  {width: `${(milestone.current / milestone.total) * 100}%`},
                ]}
              />
            </View>
          </View>
        )}

        {/* 关闭按钮 */}
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size="md" color={designSystem.colors.text.hint} />
          </TouchableOpacity>
        )}

        {/* 装饰性圆点 */}
        {showCelebration && (
          <>
            <View style={[styles.decorationDot, styles.dot1]} />
            <View style={[styles.decorationDot, styles.dot2]} />
            <View style={[styles.decorationDot, styles.dot3]} />
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: designSystem.colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },

  content: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.xl,
    padding: designSystem.spacing.xxl,
    margin: designSystem.spacing.xl,
    alignItems: 'center',
    maxWidth: 340,
    ...designSystem.shadows.lg,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: designSystem.colors.success.light,
    alignItems: 'center',
    justifyContent: 'center',
  },

  milestone: {
    width: '100%',
    marginTop: designSystem.spacing.md,
  },

  milestoneBar: {
    height: 6,
    backgroundColor: designSystem.colors.surface.tertiary,
    borderRadius: designSystem.borderRadius.sm,
    overflow: 'hidden',
  },

  milestoneProgress: {
    height: '100%',
    backgroundColor: designSystem.colors.success.default,
    borderRadius: designSystem.borderRadius.sm,
  },

  closeButton: {
    position: 'absolute',
    top: designSystem.spacing.md,
    right: designSystem.spacing.md,
    padding: designSystem.spacing.xs,
  },

  decorationDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: designSystem.colors.success.default,
  },

  dot1: {
    top: 40,
    left: 30,
  },

  dot2: {
    top: 80,
    right: 40,
  },

  dot3: {
    bottom: 60,
    left: 50,
  },
});

export default EncouragingSuccess;
