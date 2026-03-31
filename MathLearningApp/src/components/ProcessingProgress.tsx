/**
 * Story 5-2/5-3: 处理进度组件
 * Story 5-4: 集成焦虑减少的颜色系统和友好的消息
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {ProcessingStage, PerformanceMetrics} from '../types';
import {performanceTracker} from '../services/performanceTracker';
import {emotionalColors} from '../styles/calmingColors';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer} from '../components/ui';

interface ProcessingProgressProps {
  visible: boolean;
  metrics: PerformanceMetrics | null;
  warningThreshold?: number;
  totalTimeout?: number;
}

interface StageInfo {
  stage: ProcessingStage;
  label: string;
  icon: string;
  // Story 5-4: 添加友好的消息
  friendlyMessage: string;
}

// Story 5-4: 使用友好的阶段标签和消息
const STAGE_INFO: StageInfo[] = [
  {
    stage: ProcessingStage.UPLOADING,
    label: '上传中',
    icon: '☁️',
    friendlyMessage: '正在安全地上传你的内容...'
  },
  {
    stage: ProcessingStage.RECOGNIZING,
    label: '识别中',
    icon: '🔍',
    friendlyMessage: '我们正在仔细分析题目...'
  },
  {
    stage: ProcessingStage.CORRECTION,
    label: '选择类型',
    icon: '📝',
    friendlyMessage: '请选择最合适的题目类型'
  },
  {
    stage: ProcessingStage.DIFFICULTY_SELECTION,
    label: '选择难度',
    icon: '⚡',
    friendlyMessage: '根据孩子的水平选择合适的难度'
  },
  {
    stage: ProcessingStage.GENERATING,
    label: '生成中',
    icon: '✨',
    friendlyMessage: '正在为孩子准备专属练习题...'
  },
];

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  visible,
  metrics,
  warningThreshold = 25000,
  totalTimeout = 30000,
}) => {
  const [progressAnim] = useState(new Animated.Value(0));
  const [showWarning, setShowWarning] = useState(false);
  const [estimatedRemaining, setEstimatedRemaining] = useState(0);

  useEffect(() => {
    if (!visible || !metrics) {
      setShowWarning(false);
      return;
    }

    // 检查是否应显示警告
    const checkWarning = () => {
      const elapsed = performanceTracker.getElapsedTime();
      setShowWarning(elapsed >= warningThreshold);
    };

    // 更新估算剩余时间
    const updateEstimatedTime = () => {
      setEstimatedRemaining(performanceTracker.estimateRemainingTime());
    };

    // 动画进度条
    const animateProgress = () => {
      const currentStage = performanceTracker.getCurrentStage();
      let targetProgress = 0;

      const stageOrder = STAGE_INFO.map(s => s.stage);
      const currentIndex = stageOrder.indexOf(currentStage);
      targetProgress = ((currentIndex + 1) / STAGE_INFO.length) * 100;

      Animated.timing(progressAnim, {
        toValue: targetProgress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };

    checkWarning();
    updateEstimatedTime();
    animateProgress();

    // 定期更新
    const interval = setInterval(() => {
      checkWarning();
      updateEstimatedTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, metrics, warningThreshold, progressAnim]);

  if (!visible || !metrics) return null;

  const currentStage = performanceTracker.getCurrentStage();
  const elapsed = performanceTracker.getElapsedTime();

  // Story 5-4: 获取当前阶段的友好消息
  const getCurrentStageInfo = () => {
    return STAGE_INFO.find(info => info.stage === currentStage) || STAGE_INFO[0];
  };

  const currentStageInfo = getCurrentStageInfo();

  const getStageStatus = (stage: ProcessingStage): 'pending' | 'active' | 'completed' => {
    const stageOrder = STAGE_INFO.map(s => s.stage);
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stage);

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}秒`;
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Story 5-4: 使用友好的标题 */}
          <Typography variant="headlineMedium" align="center">
            我们正在努力，请稍候...
          </Typography>

          <Spacer size="lg" />

          {/* 进度条 */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Typography
              variant="caption"
              color={designSystem.colors.text.secondary}
              align="center">
              {Math.round(progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 100],
              }).__getValue())}%
            </Typography>
          </View>

          {/* 阶段列表 */}
          <View style={styles.stagesContainer}>
            {STAGE_INFO.map((stageInfo, index) => {
              const status = getStageStatus(stageInfo.stage);
              return (
                <View key={stageInfo.stage} style={styles.stageRow}>
                  <View
                    style={[
                      styles.stageIndicator,
                      status === 'active' && styles.stageIndicatorActive,
                      status === 'completed' && styles.stageIndicatorCompleted,
                    ]}>
                    <Typography variant="body">
                      {status === 'completed' ? '✓' : stageInfo.icon}
                    </Typography>
                  </View>
                  <Typography
                    variant="body"
                    color={
                      status === 'active'
                        ? emotionalColors.calm
                        : status === 'completed'
                          ? emotionalColors.encouraging
                          : designSystem.colors.text.secondary
                    }
                    style={status === 'active' && styles.stageLabelActive}>
                    {stageInfo.label}
                  </Typography>
                  {status === 'active' && (
                    <Typography
                      variant="caption"
                      color={emotionalColors.calm}>
                      处理中...
                    </Typography>
                  )}
                </View>
              );
            })}
          </View>

          {/* 时间信息 */}
          <View style={styles.timeInfoContainer}>
            <Typography variant="caption" color={designSystem.colors.text.secondary}>
              已用时间：{formatTime(elapsed)}
            </Typography>
            {estimatedRemaining > 0 && currentStage !== ProcessingStage.CORRECTION && currentStage !== ProcessingStage.DIFFICULTY_SELECTION && (
              <Typography variant="caption" color={designSystem.colors.text.secondary}>
                预计剩余：{formatTime(estimatedRemaining)}
              </Typography>
            )}
          </View>

          {/* 警告信息 */}
          {showWarning && (
            <View style={styles.warningContainer}>
              <Typography variant="body">⚠️</Typography>
              <Spacer size="sm" horizontal />
              <Typography variant="body" color="#D4A574">
                处理时间较长，请稍候...
              </Typography>
            </View>
          )}

          {/* 提示信息 */}
          <Typography
            variant="body"
            color={designSystem.colors.text.secondary}
            align="center"
            style={{lineHeight: 20}}>
            {currentStageInfo.friendlyMessage}
          </Typography>
        </View>
      </View>
    </Modal>
  );
};

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Story 5-4: 使用柔和的覆盖层颜色
    backgroundColor: designSystem.colors.overlay.light,
  },
  modalContent: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.xl,
    padding: designSystem.spacing.xl,
    width: '90%',
    maxWidth: 420,
    ...designSystem.shadows.lg,
  },
  progressBarContainer: {
    marginBottom: designSystem.spacing.lg,
  },
  progressBarBackground: {
    height: 8,
    // Story 5-4: 使用柔和背景色
    backgroundColor: designSystem.colors.surface.tertiary,
    borderRadius: designSystem.borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    // Story 5-4: 使用柔和青色
    backgroundColor: emotionalColors.calm,
    borderRadius: designSystem.borderRadius.sm,
  },
  stagesContainer: {
    marginBottom: designSystem.spacing.lg,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.sm,
  },
  stageIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // Story 5-4: 使用温暖的背景色
    backgroundColor: designSystem.colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designSystem.spacing.md,
  },
  stageIndicatorActive: {
    // Story 5-4: 使用柔和青色
    backgroundColor: emotionalColors.calm,
    ...designSystem.shadows.sm,
  },
  stageIndicatorCompleted: {
    // Story 5-4: 使用薄荷绿
    backgroundColor: emotionalColors.encouraging,
  },
  stageLabelActive: {
    fontWeight: '600',
  },
  timeInfoContainer: {
    // Story 5-4: 使用温暖的背景色
    backgroundColor: designSystem.colors.surface.secondary,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    marginBottom: designSystem.spacing.md,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Story 5-4: 使用柔和的警告背景色
    backgroundColor: designSystem.colors.warning.light,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    marginBottom: designSystem.spacing.md,
    // Story 5-4: 使用柔和边框
    borderLeftWidth: 4,
    borderLeftColor: emotionalColors.gentleError,
  },
});

export default ProcessingProgress;
