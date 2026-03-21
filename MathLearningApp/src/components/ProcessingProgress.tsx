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
}

const STAGE_INFO: StageInfo[] = [
  {stage: ProcessingStage.UPLOADING, label: '上传中', icon: '☁️'},
  {stage: ProcessingStage.RECOGNIZING, label: '识别中', icon: '🔍'},
  {stage: ProcessingStage.CORRECTION, label: '选择类型', icon: '📝'},
  {stage: ProcessingStage.DIFFICULTY_SELECTION, label: '选择难度', icon: '⚡'},
  {stage: ProcessingStage.GENERATING, label: '生成中', icon: '✨'},
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
          <Text style={styles.title}>正在处理题目...</Text>

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
            {currentStage === ProcessingStage.CORRECTION ||
            currentStage === ProcessingStage.DIFFICULTY_SELECTION
              ? '请选择合适的选项'
              : '系统正在处理，请耐心等待'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196f3',
    borderRadius: 4,
  },
  progressPercent: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageIndicatorActive: {
    backgroundColor: '#2196f3',
    shadowColor: '#2196f3',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stageIndicatorCompleted: {
    backgroundColor: '#4caf50',
  },
  stageIcon: {
    fontSize: 16,
  },
  stageLabel: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  stageLabelActive: {
    color: '#2196f3',
    fontWeight: '600',
  },
  stageLabelCompleted: {
    color: '#4caf50',
  },
  stageStatus: {
    fontSize: 12,
    color: '#2196f3',
  },
  timeInfoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  tipText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProcessingProgress;
