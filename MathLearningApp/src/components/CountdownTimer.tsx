/**
 * Story 5-3: 30秒倒计时组件
 * 显示剩余处理时间，颜色随时间变化
 */

import React, {useEffect, useState, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {Text, useTheme} from 'react-native-paper';
import {CircularProgress} from 'react-native-circular-progress';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CountdownTimerProps {
  totalTime: number;          // 总时间（秒）
  remainingTime: number;      // 剩余时间（秒）
  elapsedTime?: number;       // 已用时间（秒）
  size?: number;              // 组件大小
  strokeWidth?: number;       // 圆环宽度
}

/**
 * 倒计时消息
 */
const COUNTDOWN_MESSAGES = {
  25: '正在识别题目...',
  20: '正在生成练习题...',
  15: '请稍候，即将完成...',
  10: '最后几道题正在生成...',
  5: '马上就好，感谢您的耐心！',
  3: '即将完成...',
  0: '完成！',
};

/**
 * 倒计时颜色
 */
const getCountdownColor = (remaining: number, theme: any): string => {
  if (remaining > 20) return '#4caf50';  // 绿色
  if (remaining > 10) return '#ff9800';  // 橙色
  if (remaining > 5) return '#ff5722';   // 深橙色
  return '#f44336';                       // 红色
};

/**
 * 30秒倒计时组件
 */
const CountdownTimer: React.FC<CountdownTimerProps> = ({
  totalTime,
  remainingTime,
  elapsedTime = 0,
  size = 80,
  strokeWidth = 6,
}) => {
  const theme = useTheme();
  const progress = remainingTime / totalTime;
  const color = getCountdownColor(remainingTime, theme);

  const [message, setMessage] = useState('');
  const [prevRemaining, setPrevRemaining] = useState(remainingTime);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 更新消息
  useEffect(() => {
    if (COUNTDOWN_MESSAGES[remainingTime as keyof typeof COUNTDOWN_MESSAGES]) {
      setMessage(COUNTDOWN_MESSAGES[remainingTime as keyof typeof COUNTDOWN_MESSAGES]);
    }
  }, [remainingTime]);

  // 剩余时间变化时的脉冲动画
  useEffect(() => {
    if (prevRemaining !== remainingTime) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setPrevRemaining(remainingTime);
    }
  }, [remainingTime, prevRemaining]);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    if (seconds < 0) return '0';
    return Math.ceil(seconds).toString();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{transform: [{scale: pulseAnim}]}}>
        <CircularProgress
          size={size}
          width={strokeWidth}
          fill={theme.colors.surface}
          tintColor={color}
          rotation={0}
          progress={progress}
          backgroundColor="#e0e0e0"
          linecap="round">
          <View style={styles.content}>
            <Text style={[styles.timeText, {color}]}>
              {formatTime(remainingTime)}
            </Text>
            <Text style={styles.unitText}>秒</Text>
          </View>
        </CircularProgress>
      </Animated.View>

      {message ? (
        <View style={styles.messageContainer}>
          <Icon name="schedule" size={14} color={color} />
          <Text style={[styles.messageText, {color}]}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  unitText: {
    fontSize: 12,
    color: '#757575',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default CountdownTimer;

/**
 * 倒计时Hook
 * 用于跟踪剩余时间
 */
export const useCountdown = (
  totalTime: number,
  isRunning: boolean,
  onComplete?: () => void
) => {
  const [remaining, setRemaining] = useState(totalTime);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const startTime = Date.now();
    const targetRemaining = remaining;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const newElapsed = elapsed + (now - startTime) / 1000;
      const newRemaining = Math.max(0, totalTime - newElapsed);

      setElapsed(newElapsed);
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onComplete?.();
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const reset = () => {
    setRemaining(totalTime);
    setElapsed(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {remaining, elapsed, reset};
};
