/**
 * Story 5-4: Reassuring Loader Component
 * 使用令人安心的加载状态减少等待焦虑
 */

import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer} from '../components/ui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface ReassuringLoaderProps {
  /** 加载消息 */
  message?: string;
  /** 进度值 (0-100)，undefined 表示不确定 */
  progress?: number;
  /** 是否显示呼吸动画 */
  showBreathing?: boolean;
  /** 自定义样式 */
  style?: any;
}

/**
 * 令人安心的加载组件
 * 使用舒缓的动画和令人宽慰的消息
 */
const ReassuringLoader: React.FC<ReassuringLoaderProps> = ({
  message = '我们正在努力，请稍候...',
  progress,
  showBreathing = true,
  style,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // 宽松的加载消息轮换
  const reassuringMessages = [
    '我们正在努力，请稍候...',
    '正在为您准备精彩内容...',
    '马上就好，感谢您的耐心...',
    '每一次等待都值得...',
  ];

  // 呼吸动画
  const breatheValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    // 呼吸动画
    if (showBreathing) {
      breatheValue.value = withRepeat(
        withSequence(
          withTiming(1.1, {duration: 1500}),
          withTiming(1, {duration: 1500})
        ),
        -1,
        true
      );
    }

    // 旋转动画
    rotateValue.value = withRepeat(
      withTiming(360, {duration: 3000}),
      -1,
      false
    );

    // 消息轮换
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % reassuringMessages.length);
    }, 4000);

    return () => clearInterval(messageInterval);
  }, [showBreathing]);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{scale: breatheValue.value}],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotateValue.value}deg`}],
  }));

  return (
    <View style={[styles.container, style]}>
      {/* 呼吸圆圈 */}
      <Animated.View style={[styles.breatheCircle, breatheStyle]} />

      {/* 旋转圆环 */}
      <Animated.View style={[styles.rotateRing, rotateStyle]}>
        <View style={styles.ringSegment} />
        <View style={[styles.ringSegment, styles.segment2]} />
        <View style={[styles.ringSegment, styles.segment3]} />
      </Animated.View>

      <Spacer size="lg" />

      {/* 消息 */}
      <Typography
        variant="body"
        color={designSystem.colors.text.secondary}
        align="center">
        {message || reassuringMessages[currentMessageIndex]}
      </Typography>

      {/* 进度条（如果有） */}
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, {width: `${progress}%`}]} />
          </View>
          <Typography
            variant="caption"
            color={designSystem.colors.text.hint}
            align="center">
            {Math.round(progress)}%
          </Typography>
        </View>
      )}

      {/* 呼吸提示（可选） */}
      {showBreathing && (
        <View style={styles.breatheHint}>
          <Typography
            variant="caption"
            color={designSystem.colors.info.default}
            align="center">
            深呼吸...放松...
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.spacing.xxl,
    backgroundColor: designSystem.colors.surface.secondary,
  },

  breatheCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: designSystem.colors.primaryLight,
  },

  rotateRing: {
    width: 120,
    height: 120,
    position: 'absolute',
  },

  ringSegment: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: designSystem.colors.primary,
    top: 0,
    left: 54,
  },

  segment2: {
    top: undefined,
    bottom: 0,
  },

  segment3: {
    left: undefined,
    right: 0,
    top: 54,
  },

  progressContainer: {
    width: '100%',
    maxWidth: 240,
    marginTop: designSystem.spacing.xl,
    alignItems: 'center',
  },

  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: designSystem.colors.surface.tertiary,
    borderRadius: designSystem.borderRadius.sm,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.borderRadius.sm,
  },

  breatheHint: {
    marginTop: designSystem.spacing.xxl,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.info.light,
    borderRadius: designSystem.borderRadius.md,
  },
});

export default ReassuringLoader;
