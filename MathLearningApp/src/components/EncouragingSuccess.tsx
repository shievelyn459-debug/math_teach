/**
 * Story 5-4: Encouraging Success Component
 * 使用鼓励性的成功状态庆祝用户成就
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
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
          <Icon name={icon} size={48} color="#7CB9A8" />
        </Animated.View>

        {/* 标题 */}
        <Text style={styles.title}>{title}</Text>

        {/* 消息 */}
        {message && <Text style={styles.message}>{message}</Text>}

        {/* 里程碑显示 */}
        {milestone && (
          <View style={styles.milestone}>
            <Text style={styles.milestoneText}>
              {milestone.label || '进度'}: {milestone.current}/{milestone.total}
            </Text>
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
            <Icon name="close" size={24} color="#8A9AAC" />
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
    backgroundColor: 'rgba(92, 158, 173, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },

  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    margin: 24,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: '#5C9EAD',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 185, 168, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },

  message: {
    fontSize: 16,
    color: '#5A6C7D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },

  milestone: {
    width: '100%',
    marginTop: 16,
  },

  milestoneText: {
    fontSize: 13,
    color: '#8A9AAC',
    marginBottom: 8,
    textAlign: 'center',
  },

  milestoneBar: {
    height: 6,
    backgroundColor: '#F0EBE0',
    borderRadius: 3,
    overflow: 'hidden',
  },

  milestoneProgress: {
    height: '100%',
    backgroundColor: '#7CB9A8',
    borderRadius: 3,
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },

  decorationDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7CB9A8',
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
