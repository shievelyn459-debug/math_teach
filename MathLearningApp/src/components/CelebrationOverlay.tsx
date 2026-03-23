/**
 * Story 5-2: 成功庆祝组件
 * 显示带有动画的成功庆祝效果
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {useTheme, Card} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const {width, height} = Dimensions.get('window');

/**
 * 预设的庆祝消息
 */
export const CELEBRATION_MESSAGES = {
  firstGeneration: ['🎉 第一次生成题目，太棒了！', '🌟 不错的开始！继续加油！'],
  firstPDF: ['📄 第一次导出PDF，保存得好！', '💾 存储习惯养成！'],
  fiveGenerations: ['🌟 已生成5次题目，坚持得真好！', '🏃 一直在前进，你真棒！'],
  tenGenerations: ['🏆 练习达人！已完成10次练习', '👍 坚持就是胜利！'],
  fiftyGenerations: ['👑 数学辅导专家！已完成50次练习', '🎊 太厉害了！你是真正的专家！'],
  default: ['✨ 太棒了！', '🎉 做得好！', '⭐ 继续加油！'],
};

interface ConfettiPiece {
  id: number;
  x: number;
  rotation: number;
  color: string;
  size: number;
  speed: number;
}

interface CelebrationOverlayProps {
  visible: boolean;
  message?: string;
  duration?: number;        // 显示时长（毫秒）
  onComplete?: () => void;
  type?: keyof typeof CELEBRATION_MESSAGES | 'default';
}

/**
 * 成功庆祝组件
 */
const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  message,
  duration = 2000,
  onComplete,
  type = 'default',
}) => {
  const theme = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const confettiPieces = useRef<ConfettiPiece[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 彩纸颜色
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];

  // 生成彩纸
  useEffect(() => {
    confettiPieces.current = Array.from({length: 50}, (_, i) => ({
      id: i,
      x: Math.random() * width,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      speed: Math.random() * 3 + 2,
    }));
  }, []);

  // 显示动画
  useEffect(() => {
    if (visible) {
      // 重置所有动画
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      confettiAnim.setValue(0);

      // 开始动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // 彩纸下落动画
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }).start();

      // 自动关闭
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    } else {
      // 关闭动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onComplete?.();
  };

  // 获取庆祝消息
  const getMessage = () => {
    if (message) {
      return message;
    }
    const messages = CELEBRATION_MESSAGES[type] || CELEBRATION_MESSAGES.default;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // 渲染彩纸
  const renderConfetti = () => {
    return confettiPieces.current.map((piece) => {
      const translateY = confettiAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, height + 100],
      });

      const translateX = confettiAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [piece.x, piece.x + Math.sin(piece.id) * 100],
      });

      const rotate = confettiAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [`${piece.rotation}deg`, `${piece.rotation + 360}deg`],
      });

      return (
        <Animated.View
          key={piece.id}
          style={[
            styles.confetti,
            {
              left: piece.x,
              transform: [
                {translateX},
                {translateY},
                {rotate},
              ],
            },
          ]}>
          <View
            style={[
              styles.confettiPiece,
              {
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.size,
              },
            ]}
          />
        </Animated.View>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      {/* 背景遮罩 */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}>
        {/* 彩纸效果 */}
        <View style={styles.confettiContainer}>
          {renderConfetti()}
        </View>

        {/* 庆祝内容 */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {/* 图标 */}
              <View style={[styles.iconContainer, {backgroundColor: theme.colors.primary + '20'}]}>
                <Icon name="celebration" size={80} color={theme.colors.primary} />
              </View>

              {/* 消息 */}
              <Text style={[styles.message, {color: theme.colors.primary}]}>
                {getMessage()}
              </Text>

              {/* 提示 */}
              <Text style={styles.hint}>点击任意处关闭</Text>
            </Card.Content>
          </Card>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: -20,
  },
  confettiPiece: {
    borderRadius: 2,
  },
  content: {
    width: width * 0.8,
    maxWidth: 400,
  },
  card: {
    elevation: 8,
  },
  cardContent: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  message: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: '#757575',
  },
});

export default CelebrationOverlay;

/**
 * 快捷方法：显示庆祝
 */
export const showCelebration = (
  message?: string,
  type?: keyof typeof CELEBRATION_MESSAGES
): void => {
  // 这里需要在实际使用时由父组件控制
  // 或者使用事件总线/全局状态管理
  // 目前仅作为示例
};
