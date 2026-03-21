/**
 * 知识点讲解屏幕
 * Story 3-2: generate-knowledge-point-explanation
 * Task 5: Create explanation display components
 * Story 3-4: multiple-explanation-formats
 * Added format selection support
 * Story 3-5: switch-explanation-formats
 * Enhanced format switching with animations and accessibility
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  AccessibilityInfo,
  Animated,
  Platform,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {ExplanationContent} from '../components/ExplanationContent';
import {FormatSelector} from '../components/FormatSelector';
import {Explanation, ExplanationFeedback, ExplanationFormat} from '../types/explanation';
import {getExplanationService} from '../services/explanationService';
import {preferencesService} from '../services/preferencesService';

interface RouteParams {
  knowledgePointId: string;
  knowledgePointName: string;
  grade?: string;
}

/**
 * 知识点讲解全屏展示
 * 显示完整的讲解内容，支持导航、格式切换和反馈
 * Story 3-5: 增强的格式切换体验（动画、触觉反馈、可访问性）
 */
export const ExplanationScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = (route.params as RouteParams) || {};

  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Story 3-4/3-5: 格式状态和过渡状态
  const [currentFormat, setCurrentFormat] = useState<ExplanationFormat>(ExplanationFormat.TEXT);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  // Story 3-5: 过渡动画
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const explanationService = getExplanationService();

  // Story 3-4: 加载格式偏好
  useEffect(() => {
    const loadFormatPreference = async () => {
      const savedFormat = await preferencesService.getFormatPreference();
      setCurrentFormat(savedFormat);
    };
    loadFormatPreference();
  }, []);

  useEffect(() => {
    loadExplanation();
  }, [params.knowledgePointId]);

  useEffect(() => {
    // 设置导航栏标题
    if (params.knowledgePointName) {
      navigation.setOptions({
        title: params.knowledgePointName,
      });
    }

    // Story 3-4: 添加格式选择器到header
    navigation.setOptions({
      headerRight: () => (
        <FormatSelector
          availableFormats={explanation?.availableFormats || [ExplanationFormat.TEXT]}
          selectedFormat={currentFormat}
          onFormatChange={handleFormatChange}
          style={styles.headerFormatSelector}
        />
      ),
    });
  }, [params.knowledgePointName, navigation, explanation, currentFormat, isTransitioning]);

  // Story 3-5: 增强的格式切换处理（动画、触觉反馈、可访问性）
  const handleFormatChange = async (format: ExplanationFormat) => {
    // 如果点击当前格式，忽略
    if (format === currentFormat) {
      return;
    }

    console.log('[ExplanationScreen] Format change requested:', currentFormat, '->', format);

    try {
      setIsTransitioning(true);
      setFormatError(null);

      // Story 3-5: 触觉反馈
      triggerHapticFeedback();

      // Story 3-5: 淡出动画
      await fadeOut();

      // 切换格式
      setCurrentFormat(format);

      // 立即保存偏好（AC5）
      await preferencesService.setFormatPreference(format);

      // Story 3-5: 可访问性公告
      announceFormatChange(format);

      // Story 3-5: 淡入动画
      fadeIn();

      console.log('[ExplanationScreen] Format changed successfully to:', format);
    } catch (err) {
      console.error('[ExplanationScreen] Format change error:', err);
      setFormatError('格式切换失败，已返回文字格式');

      // Story 3-5: 降级到文字格式（AC8）
      setCurrentFormat(ExplanationFormat.TEXT);
      await preferencesService.setFormatPreference(ExplanationFormat.TEXT);
      fadeIn();
    } finally {
      setIsTransitioning(false);
    }
  };

  // Story 3-5: 过渡动画函数
  const fadeOut = (): Promise<void> => {
    return new Promise(resolve => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  };

  const fadeIn = (): void => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Story 3-5: 触觉反馈
  const triggerHapticFeedback = () => {
    if (Platform.OS === 'ios') {
      // iOS: 使用轻量级冲击反馈
      // 注意: 需要Expo Modules或react-native-haptic-feedback包
      // 这里使用模拟实现
      console.log('[Haptic] iOS impact feedback triggered');
    } else {
      // Android: 振动反馈
      console.log('[Haptic] Android vibration feedback triggered');
    }
  };

  // Story 3-5: 可访问性公告
  const announceFormatChange = (format: ExplanationFormat) => {
    const formatNames = {
      [ExplanationFormat.TEXT]: '文字',
      [ExplanationFormat.ANIMATION]: '动画',
      [ExplanationFormat.VIDEO]: '视频',
    };
    const formatName = formatNames[format] || format;
    AccessibilityInfo.announceForAccessibility(`已切换到${formatName}格式`);
  };

  const loadExplanation = async () => {
    if (!params.knowledgePointId) {
      setError('缺少知识点ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await explanationService.generateExplanation({
        knowledgePointId: params.knowledgePointId,
        knowledgePointName: params.knowledgePointName || '知识点讲解',
        grade: params.grade || '一年级',
      });

      setExplanation(result.explanation);

      // 通知屏幕变化（辅助功能）
      AccessibilityInfo.announceForAsync('讲解内容已加载');
    } catch (err) {
      console.error('Failed to load explanation:', err);
      setError('加载讲解失败，请稍后重试');
      Alert.alert('加载失败', '无法加载讲解内容，请检查网络连接后重试', [
        {text: '重试', onPress: loadExplanation},
        {text: '返回', onPress: () => navigation.goBack()},
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackPress = () => {
    if (!explanation) return;

    Alert.alert(
      '讲解反馈',
      '这个讲解对您有帮助吗？',
      [
        {
          text: '很有帮助',
          onPress: () => submitFeedback(5, true, true),
        },
        {
          text: '一般',
          onPress: () => submitFeedback(3, true, false),
        },
        {
          text: '没有帮助',
          onPress: () => submitFeedback(1, false, false),
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ],
      {cancelable: true}
    );
  };

  const submitFeedback = async (
    rating: number,
    helpful: boolean,
    easyToUnderstand: boolean
  ) => {
    if (!explanation) return;

    try {
      await explanationService.submitFeedback({
        explanationId: explanation.id,
        rating,
        helpful,
        easyToUnderstand,
        appropriateForChild: true, // 默认假设适合儿童
        timestamp: new Date(),
      });

      Alert.alert('感谢反馈', '您的反馈已提交，帮助我们改进内容质量');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      Alert.alert('提交失败', '无法提交反馈，请稍后重试');
    }
  };

  const handleSectionPress = (sectionType: string) => {
    console.log('Section pressed:', sectionType);
    // 可以在这里添加章节导航逻辑
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>正在生成讲解内容...</Text>
        <Text style={styles.loadingSubtext}>通常需要1-3秒</Text>
      </View>
    );
  }

  if (error || !explanation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>加载失败</Text>
        <Text style={styles.errorMessage}>{error || '未知错误'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadExplanation}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 质量指标横幅 */}
      {explanation.qualityScore < 0.8 && (
        <View style={styles.qualityWarningBanner}>
          <Text style={styles.qualityWarningText}>
            ⚠️ 此讲解内容质量评分较低，建议谨慎参考
          </Text>
        </View>
      )}

      {/* Story 3-5: 格式切换错误提示 */}
      {formatError && (
        <View style={styles.formatErrorBanner}>
          <Text style={styles.formatErrorIcon}>⚠️</Text>
          <Text style={styles.formatErrorText}>{formatError}</Text>
        </View>
      )}

      {/* Story 3-5: 过渡状态加载指示器 */}
      {isTransitioning && (
        <View style={styles.transitionLoadingContainer}>
          <ActivityIndicator size="small" color="#2196f3" />
        </View>
      )}

      {/* Story 3-5: 讲解内容（带过渡动画） */}
      <Animated.View style={{opacity: fadeAnim}}>
        <ExplanationContent
          explanation={explanation}
          currentFormat={currentFormat}
          onSectionPress={handleSectionPress}
          isTransitioning={isTransitioning}
        />
      </Animated.View>

      {/* 底部信息 */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>
          来源: {explanation.source === 'ai' ? 'AI生成' : '专业审核'}
        </Text>
        <Text style={styles.footerText}>
          版本: v{explanation.version}
          {explanation.reviewed ? ' ✅ 已审核' : ' ⏳ 待审核'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3498db',
    borderRadius: 6,
    marginRight: 12,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Story 3-4: 格式选择器样式
  headerFormatSelector: {
    marginRight: 12,
  },
  // Story 3-5: 格式切换错误横幅
  formatErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  formatErrorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  formatErrorText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  // Story 3-5: 过渡加载指示器
  transitionLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  qualityWarningBanner: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  qualityWarningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
  },
});
