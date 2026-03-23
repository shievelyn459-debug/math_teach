/**
 * Story 5-2/5-3: 处理进度组件
 * Story 5-4: 集成焦虑减少的颜色系统和友好的消息
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {ProcessingStage, PerformanceMetrics} from '../types';
import {performanceTracker} from '../services/performanceTracker';
import {emotionalColors} from '../styles/calmingColors';
import {rewriteLoadingMessage} from '../utils/toneGuidelines';

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
  const progressPercent = Math.min((elapsed / totalTimeout) * 100, 100);

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
          <Text style={styles.title}>我们正在努力，请稍候...</Text>

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
            <Text style={styles.progressPercent}>
              {Math.round(progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 100],
              }).__getValue())}%
            </Text>
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
                    <Text style={styles.stageIcon}>
                      {status === 'completed' ? '✓' : stageInfo.icon}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stageLabel,
                      status === 'active' && styles.stageLabelActive,
                      status === 'completed' && styles.stageLabelCompleted,
                    ]}>
                    {stageInfo.label}
                  </Text>
                  {status === 'active' && (
                    <Text style={styles.stageStatus}>处理中...</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* 时间信息 */}
          <View style={styles.timeInfoContainer}>
            <Text style={styles.timeLabel}>已用时间：{formatTime(elapsed)}</Text>
            {estimatedRemaining > 0 && currentStage !== ProcessingStage.CORRECTION && currentStage !== ProcessingStage.DIFFICULTY_SELECTION && (
              <Text style={styles.timeLabel}>
                预计剩余：{formatTime(estimatedRemaining)}
              </Text>
            )}
          </View>

          {/* 警告信息 */}
          {showWarning && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                处理时间较长，请稍候...
              </Text>
            </View>
          )}

          {/* 提示信息 */}
          <Text style={styles.tipText}>
            {currentStageInfo.friendlyMessage}
          </Text>
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
    backgroundColor: 'rgba(92, 158, 173, 0.2)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    // Story 5-4: 使用柔和阴影
    shadowColor: '#5C9EAD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    // Story 5-4: 使用柔和文本颜色
    color: '#2C3E50',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    // Story 5-4: 使用柔和背景色
    backgroundColor: '#F0EBE0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    // Story 5-4: 使用柔和青色
    backgroundColor: emotionalColors.calm,
    borderRadius: 4,
  },
  progressPercent: {
    textAlign: 'center',
    fontSize: 14,
    // Story 5-4: 使用柔和文本颜色
    color: '#5A6C7D',
    marginTop: 8,
    fontWeight: '500',
  },
  stagesContainer: {
    marginBottom: 20,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  stageIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // Story 5-4: 使用温暖的背景色
    backgroundColor: '#F7F3E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageIndicatorActive: {
    // Story 5-4: 使用柔和青色
    backgroundColor: emotionalColors.calm,
    shadowColor: emotionalColors.calm,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stageIndicatorCompleted: {
    // Story 5-4: 使用薄荷绿
    backgroundColor: emotionalColors.encouraging,
  },
  stageIcon: {
    fontSize: 16,
  },
  stageLabel: {
    flex: 1,
    fontSize: 15,
    // Story 5-4: 使用柔和文本颜色
    color: '#5A6C7D',
  },
  stageLabelActive: {
    // Story 5-4: 使用柔和青色
    color: emotionalColors.calm,
    fontWeight: '600',
  },
  stageLabelCompleted: {
    // Story 5-4: 使用薄荷绿
    color: emotionalColors.encouraging,
  },
  stageStatus: {
    fontSize: 12,
    // Story 5-4: 使用柔和青色
    color: emotionalColors.calm,
  },
  timeInfoContainer: {
    // Story 5-4: 使用温暖的背景色
    backgroundColor: '#F7F3E8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    // Story 5-4: 使用柔和文本颜色
    color: '#5A6C7D',
    marginBottom: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Story 5-4: 使用柔和的警告背景色
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    // Story 5-4: 使用柔和边框
    borderLeftWidth: 4,
    borderLeftColor: emotionalColors.gentleError,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    // Story 5-4: 使用暖棕色文本
    color: '#D4A574',
    fontWeight: '500',
  },
  tipText: {
    fontSize: 14,
    // Story 5-4: 使用柔和文本颜色
    color: '#5A6C7D',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProcessingProgress;
