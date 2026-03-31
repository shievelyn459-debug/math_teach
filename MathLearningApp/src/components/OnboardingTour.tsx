/**
 * Story 5-2: 入门导览组件
 * 为新用户提供功能介绍
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {useTheme, Card} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer, Button} from '../components/ui';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed_';
const TOOLTIP_WIDTH = 300;
const TOOLTIP_HEIGHT = 200;

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
        title: '欢迎使用！',
        description: '点击这里可以快速拍摄数学题照片，系统会自动识别并生成练习题。',
        position: 'bottom',
        action: '点击"拍照上传题目"开始',
      },
      {
        targetId: 'recent_practice',
        title: '最近练习',
        description: '这里显示您最近的练习记录，点击可以查看详细题目和答案。',
        position: 'bottom',
      },
      {
        targetId: 'profile_button',
        title: '个人中心',
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
        title: '拍摄清晰题目',
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
        title: '查看练习题',
        description: '点击任何题目可以展开查看答案和解析。',
        position: 'bottom',
      },
      {
        targetId: 'export_pdf_button',
        title: '导出PDF',
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

  const tourContent = TOUR_CONTENTS[screenId] || getDefaultTourContent(screenId);
  const currentStep = tourContent?.steps[currentStepIndex];
  const isLastStep = currentStepIndex === (tourContent?.steps.length || 0) - 1;

  /**
   * 获取默认导览内容（针对未定义的屏幕）
   */
  function getDefaultTourContent(id: string): TourContent {
    return {
      screenId: id,
      steps: [
        {
          targetId: '',
          title: '欢迎使用应用',
          description: '这是一个帮助您辅导孩子学习数学的应用。您可以随时查看帮助内容了解更多功能。',
          position: 'center',
        },
      ],
    };
  }

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
      } else if (visible) {
        // 未完成且应该显示，确保showTour为true
        setShowTour(true);
      }
    } catch (error) {
      console.error('Failed to check tour completion:', error);
      // 错误情况下，如果visible为true则显示导览
      if (visible) {
        setShowTour(true);
      }
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => {
        const newIndex = prev + 1;
        // 边界检查
        const maxIndex = (tourContent?.steps.length || 0) - 1;
        return newIndex <= maxIndex ? newIndex : prev;
      });
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
      // 居中显示
      return {
        top: Math.max(10, height / 2 - TOOLTIP_HEIGHT / 2),
        left: Math.max(10, Math.min(width / 2 - TOOLTIP_WIDTH / 2, width - TOOLTIP_WIDTH - 10))
      };
    }

    let top = 0;
    let left = 0;

    switch (currentStep?.position) {
      case 'top':
        top = targetPos.y - TOOLTIP_HEIGHT - 20;
        left = targetPos.x + targetPos.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case 'bottom':
        top = targetPos.y + targetPos.height + 20;
        left = targetPos.x + targetPos.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case 'left':
        top = targetPos.y + targetPos.height / 2 - TOOLTIP_HEIGHT / 2;
        left = targetPos.x - TOOLTIP_WIDTH - 20;
        break;
      case 'right':
        top = targetPos.y + targetPos.height / 2 - TOOLTIP_HEIGHT / 2;
        left = targetPos.x + targetPos.width + 20;
        break;
      case 'center':
        top = height / 2 - TOOLTIP_HEIGHT / 2;
        left = width / 2 - TOOLTIP_WIDTH / 2;
        break;
    }

    // 边界检查 - 使用常量
    left = Math.max(10, Math.min(left, width - TOOLTIP_WIDTH - 10));
    top = Math.max(10, Math.min(top, height - TOOLTIP_HEIGHT - 10));

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
                <Typography variant="headlineSmall" color={theme.colors.primary}>
                  {currentStep.title}
                </Typography>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                  <Typography variant="body" color={designSystem.colors.text.hint}>
                    跳过
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* 描述 */}
              <Typography variant="body" style={styles.description}>{currentStep.description}</Typography>

              {/* 操作提示 */}
              {currentStep.action && (
                <View style={styles.actionContainer}>
                  <Icon name="touch-app" size="sm" color={theme.colors.primary} />
                  <Spacer size="xs" horizontal />
                  <Typography variant="body" color={theme.colors.primary}>
                    {currentStep.action}
                  </Typography>
                </View>
              )}

              {/* 进度指示器 */}
              <View style={styles.progressContainer}>
                {tourContent?.steps?.map((_, index) => (
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
                    title="上一步"
                    onPress={handlePrevious}
                    variant="secondary"
                    size="md"
                  />
                )}
                <Button
                  title={isLastStep ? '完成' : '下一步'}
                  onPress={handleNext}
                  variant="primary"
                  size="md"
                  style={{flex: 1}}
                />
              </View>

              {/* 不再显示复选框 */}
              <TouchableOpacity
                style={styles.dontShowAgainContainer}
                onPress={() => setDontShowAgain(!dontShowAgain)}>
                <View style={[
                  styles.checkbox,
                  dontShowAgain && [styles.checkboxChecked, {backgroundColor: theme.colors.primary}]
                ]}>
                  {dontShowAgain && <Icon name="check" size="sm" color={designSystem.colors.surface.primary} />}
                </View>
                <Typography variant="caption" color={designSystem.colors.text.hint}>
                  不再显示此导览
                </Typography>
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
    backgroundColor: designSystem.colors.overlay.medium,
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.md,
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
    marginBottom: designSystem.spacing.md,
  },
  skipButton: {
    padding: designSystem.spacing.xs,
  },
  description: {
    lineHeight: 20,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.md,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: designSystem.spacing.xs,
  },
  activeDot: {
    width: 20,
  },
  inactiveDot: {
    backgroundColor: designSystem.colors.border,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.md,
  },
  dontShowAgainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: designSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: designSystem.colors.border,
    borderRadius: designSystem.borderRadius.sm,
    marginRight: designSystem.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderWidth: 0,
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
