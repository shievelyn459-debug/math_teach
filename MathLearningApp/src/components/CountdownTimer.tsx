/**
 * Story 5-3: 30秒倒计时组件
 * Story 5-4: 使用焦虑减少的颜色系统
 * 显示剩余处理时间，颜色随时间变化
 */

import React, {useEffect, useState, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {Text} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {emotionalColors} from '../styles/calmingColors';

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
 * Story 5-4: 倒计时颜色 - 使用平静颜色系统
 * 从柔和青色渐变到桃色，避免刺眼的红色
 */
const getCountdownColor = (remaining: number): string => {
  if (remaining > 20) return emotionalColors.encouraging;  // 薄荷绿 - 充足时间
  if (remaining > 10) return emotionalColors.calm;         // 柔和青色 - 还有时间
  if (remaining > 5) return emotionalColors.softAccent;    // 暖棕 - 快好了
  return emotionalColors.gentleError;                       // 桃色 - 马上完成（不用红色！）
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
  // PATCH-C1: Guard against division by zero and NaN
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, remainingTime / totalTime)) : 0;
  // Story 5-4: 使用平静颜色
  const color = getCountdownColor(remainingTime);

  const [message, setMessage] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevRemainingRef = useRef(remainingTime);

  // 更新消息
  useEffect(() => {
    if (COUNTDOWN_MESSAGES[remainingTime as keyof typeof COUNTDOWN_MESSAGES]) {
      setMessage(COUNTDOWN_MESSAGES[remainingTime as keyof typeof COUNTDOWN_MESSAGES]);
    }
  }, [remainingTime]);

  // 剩余时间变化时的脉冲动画
  // PATCH-H1: Remove prevRemaining from deps to prevent infinite loop
  useEffect(() => {
    if (prevRemainingRef.current !== remainingTime) {
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

      prevRemainingRef.current = remainingTime;
    }
  }, [remainingTime, pulseAnim]);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    if (seconds < 0) return '0';
    return Math.ceil(seconds).toString();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circleContainer, {transform: [{scale: pulseAnim}], borderColor: color}]}>
        <View style={styles.content}>
          <Text style={[styles.timeText, {color}]}>
            {formatTime(remainingTime)}
          </Text>
          <Text style={styles.unitText}>秒</Text>
        </View>
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
  circleContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    // Story 5-4: 使用温暖背景色
    backgroundColor: '#F7F3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 32,
    // Story 5-4: 使用柔和文本色
    color: '#2C3E50',
  },
  unitText: {
    fontSize: 12,
    // Story 5-4: 使用柔和文本色
    color: '#5A6C7D',
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
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      // PATCH-C3: Single cleanup point
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      return;
    }

    // Initialize start time
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      if (startTimeRef.current === null) return;

      // PATCH-C2: Functional update to fix stale closure
      setElapsed(prevElapsed => {
        const newElapsed = prevElapsed + 0.1; // Fixed 100ms interval
        const newRemaining = Math.max(0, totalTime - newElapsed);

        setRemaining(newRemaining);

        if (newRemaining <= 0) {
          // Cleanup
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          startTimeRef.current = null;
          onComplete?.();
        }

        return newElapsed;
      });
    }, 100);

    return () => {
      // PATCH-C3: Single cleanup in return
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    };
  }, [isRunning, totalTime, onComplete]);

  const reset = () => {
    setRemaining(totalTime);
    setElapsed(0);
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {remaining, elapsed, reset};
};
