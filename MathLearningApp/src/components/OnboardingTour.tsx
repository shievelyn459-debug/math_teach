/**
 * Story 5-2: 入门导览组件
 * 为新用户提供功能介绍
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import {useTheme, Card, Button} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed_';

/**
 * 导览步骤
 */
export interface TourStep {
  targetId: string;           // 目标元素 ID
  title: string;              // 标题
  description: string;        // 描述
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string;            // 可选操作提示
}

/**
 * 导览内容配置
 */
export interface TourContent {
  screenId: string;
  steps: TourStep[];
}

// 预定义的导览内容
const TOUR_CONTENTS: Record<string, TourContent> = {
  HomeScreen: {
    screenId: 'HomeScreen',
    steps: [
      {
        targetId: 'camera_button',
        title: '欢迎使用！👋',
        description: '点击这里可以快速拍摄数学题照片，系统会自动识别并生成练习题。',
        position: 'bottom',
        action: '点击"拍照上传题目"开始',
      },
      {
        targetId: 'recent_practice',
        title: '最近练习 📚',
        description: '这里显示您最近的练习记录，点击可以查看详细题目和答案。',
        position: 'bottom',
      },
      {
        targetId: 'profile_button',
        title: '个人中心 👤',
        description: '管理您和孩子的个人信息，以及应用设置。',
        position: 'bottom',
      },
    ],
  },
  CameraScreen: {
    screenId: 'CameraScreen',
    steps: [
      {
        targetId: 'camera_preview',
        title: '拍摄清晰题目 📷',
        description: '确保题目完整清晰，保持光线充足，对准题目后点击拍照。',
        position: 'bottom',
        action: '将题目对准取景框',
      },
      {
        targetId: 'capture_button',
        title: '点击拍照',
        description: '按下拍照按钮后，系统会自动识别题目类型。',
        position: 'top',
      },
    ],
  },
  GeneratedQuestionsList: {
    screenId: 'GeneratedQuestionsList',
    steps: [
      {
        targetId: 'questions_list',
        title: '查看练习题 📝',
        description: '点击任何题目可以展开查看答案和解析。',
        position: 'bottom',
      },
      {
        targetId: 'export_pdf_button',
        title: '导出PDF 📄',
        description: '可以将练习题导出为PDF，方便打印或分享。',
        position: 'left',
      },
    ],
  },
};

interface OnboardingTourProps {
  visible: boolean;
  screenId: string;
  onComplete: () => void;
  onSkip?: () => void;
  targetPositions?: Record<string, {x: number; y: number; width: number; height: number}>;
}

/**
 * 入门导览组件
 */
const OnboardingTour: React.FC<OnboardingTourProps> = ({
  visible,
  screenId,
  onComplete,
  onSkip,
  targetPositions = {},
}) => {
  const theme = useTheme();
  const {width, height} = Dimensions.get('window');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const tourContent = TOUR_CONTENTS[screenId];
  const currentStep = tourContent?.steps[currentStepIndex];
  const isLastStep = currentStepIndex === (tourContent?.steps.length || 0) - 1;

  // 检查是否已完成导览
  useEffect(() => {
    checkTourCompletion();
  }, [screenId]);

  // 显示动画
  useEffect(() => {
    if (visible && currentStep) {
      setShowTour(true);
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
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowTour(false));
    }
  }, [visible, currentStep]);

  const checkTourCompletion = async () => {
    try {
      const key = TOUR_COMPLETED_KEY + screenId;
      const completed = await AsyncStorage.getItem(key);
      if (completed === 'true') {
        // 已完成，不显示导览
        setShowTour(false);
      }
    } catch (error) {
      console.error('Failed to check tour completion:', error);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (dontShowAgain) {
        const key = TOUR_COMPLETED_KEY + screenId;
        await AsyncStorage.setItem(key, 'true');
      }
    } catch (error) {
      console.error('Failed to save tour completion:', error);
    }

    setCurrentStepIndex(0);
    onComplete();
  };

  const handleSkip = async () => {
    try {
      if (dontShowAgain) {
        const key = TOUR_COMPLETED_KEY + screenId;
        await AsyncStorage.setItem(key, 'true');
      }
    } catch (error) {
      console.error('Failed to save tour skip:', error);
    }

    setCurrentStepIndex(0);
    onSkip?.();
  };

  const getTooltipPosition = () => {
    const targetPos = targetPositions[currentStep?.targetId || ''];

    if (!targetPos) {
      return {top: height / 2 - 100, left: width / 2 - 150};
    }

    let top = 0;
    let left = 0;

    switch (currentStep?.position) {
      case 'top':
        top = targetPos.y - 180;
        left = targetPos.x + targetPos.width / 2 - 150;
        break;
      case 'bottom':
        top = targetPos.y + targetPos.height + 20;
        left = targetPos.x + targetPos.width / 2 - 150;
        break;
      case 'left':
        top = targetPos.y + targetPos.height / 2 - 75;
        left = targetPos.x - 310;
        break;
      case 'right':
        top = targetPos.y + targetPos.height / 2 - 75;
        left = targetPos.x + targetPos.width + 20;
        break;
      case 'center':
        top = height / 2 - 100;
        left = width / 2 - 150;
        break;
    }

    // 边界检查
    left = Math.max(10, Math.min(left, width - 310));
    top = Math.max(10, Math.min(top, height - 200));

    return {top, left};
  };

  const tooltipPosition = getTooltipPosition();

  if (!showTour || !currentStep) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}>
      {/* 半透明背景 */}
      <View style={styles.overlay}>
        {/* 高亮目标区域（可选） */}
        {/* <View
          style={[
            styles.highlight,
            {
              left: targetPositions[currentStep.targetId]?.x || 0,
              top: targetPositions[currentStep.targetId]?.y || 0,
              width: targetPositions[currentStep.targetId]?.width || 0,
              height: targetPositions[currentStep.targetId]?.height || 0,
            },
          ]}
        /> */}

        {/* 提示框 */}
        <Animated.View
          style={[
            styles.tooltip,
            {
              ...tooltipPosition,
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <Card style={styles.card}>
            <Card.Content>
              {/* 标题 */}
              <View style={styles.header}>
                <Text style={[styles.title, {color: theme.colors.primary}]}>
                  {currentStep.title}
                </Text>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                  <Text style={styles.skipText}>跳过</Text>
                </TouchableOpacity>
              </View>

              {/* 描述 */}
              <Text style={styles.description}>{currentStep.description}</Text>

              {/* 操作提示 */}
              {currentStep.action && (
                <View style={styles.actionContainer}>
                  <Icon name="touch-app" size={16} color={theme.colors.primary} />
                  <Text style={[styles.actionText, {color: theme.colors.primary}]}>
                    {currentStep.action}
                  </Text>
                </View>
              )}

              {/* 进度指示器 */}
              <View style={styles.progressContainer}>
                {tourContent.steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index === currentStepIndex
                        ? [styles.activeDot, {backgroundColor: theme.colors.primary}]
                        : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>

              {/* 按钮 */}
              <View style={styles.buttonContainer}>
                {currentStepIndex > 0 && (
                  <Button
                    mode="outlined"
                    onPress={handlePrevious}
                    style={styles.button}>
                    上一步
                  </Button>
                )}
                <Button
                  mode="contained"
                  onPress={handleNext}
                  style={[styles.button, {flex: 1}]}>
                  {isLastStep ? '完成' : '下一步'}
                </Button>
              </View>

              {/* 不再显示复选框 */}
              <TouchableOpacity
                style={styles.dontShowAgainContainer}
                onPress={() => setDontShowAgain(!dontShowAgain)}>
                <View style={[
                  styles.checkbox,
                  dontShowAgain && [styles.checkboxChecked, {backgroundColor: theme.colors.primary}]
                ]}>
                  {dontShowAgain && <Icon name="check" size={16} color="white" />}
                </View>
                <Text style={styles.dontShowAgainText}>不再显示此导览</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* 指向箭头 */}
          <View style={[styles.arrow, {borderTopColor: theme.colors.surface}]} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tooltip: {
    position: 'absolute',
    width: 300,
    zIndex: 1000,
  },
  card: {
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  skipButton: {
    padding: 4,
  },
  skipText: {
    fontSize: 14,
    color: '#757575',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
  },
  inactiveDot: {
    backgroundColor: '#e0e0e0',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    flex: 0,
  },
  dontShowAgainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderWidth: 0,
  },
  dontShowAgainText: {
    fontSize: 12,
    color: '#757575',
  },
  arrow: {
    position: 'absolute',
    left: 20,
    bottom: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 8,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
});

export default OnboardingTour;

/**
 * 检查导览是否已完成
 */
export const checkTourCompleted = async (screenId: string): Promise<boolean> => {
  try {
    const key = TOUR_COMPLETED_KEY + screenId;
    const completed = await AsyncStorage.getItem(key);
    return completed === 'true';
  } catch (error) {
    console.error('Failed to check tour completion:', error);
    return false;
  }
};

/**
 * 重置导览状态（用于测试）
 */
export const resetTour = async (screenId: string): Promise<void> => {
  try {
    const key = TOUR_COMPLETED_KEY + screenId;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to reset tour:', error);
  }
};

/**
 * 重置所有导览状态（用于测试）
 */
export const resetAllTours = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const tourKeys = keys.filter(k => k.startsWith(TOUR_COMPLETED_KEY));
    await AsyncStorage.multiRemove(tourKeys);
  } catch (error) {
    console.error('Failed to reset all tours:', error);
  }
};
