import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  useWindowDimensions,
  FlatList,
  Animated,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/native-stack';
import {Question, Difficulty, QuestionType, PDFMetadata, GeneratedQuestion} from '../types';
import {questionGenerationService} from '../services/questionGenerationService';
import {pdfService} from '../services/pdfService';
import {generationHistoryService} from '../services/generationHistoryService';
import QuantitySelector from '../components/QuantitySelector';
import {preferencesService} from '../services/preferencesService';
import {getFontSize, getScaledSpacing, getNumColumns} from '../styles/tablet';
import {Orientation} from '../types';

interface RouteParams {
  // 从 CameraScreen 传入的已生成题目
  generationId?: string;
  questions?: GeneratedQuestion[];
  questionType?: QuestionType; // BAD_SPEC-002: 添加题目类型参数

  // 原有参数
  baseQuestion?: {
    type: string;
    difficulty: Difficulty;
    userId: string;
  };
  initialQuantity?: number;
  initialDifficulty?: Difficulty;
}

type NavigationProp = StackNavigationProp<any, 'GeneratedQuestionsList'>;

interface Props {
  route: {
    params: RouteParams;
  };
  navigation: NavigationProp;
}

const GeneratedQuestionsList: React.FC<Props> = ({route, navigation}) => {
  // PATCH-013: 添加路由参数默认值以防止 undefined 错误
  const params = route.params || {};
  const {
    generationId,
    questions: preloadedQuestions,
    questionType,
    baseQuestion,
    initialQuantity = 10,
    initialDifficulty
  } = params;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isLargeTablet = width >= 900;
  const numColumns = getNumColumns(width);

  // Responsive font sizes
  const questionFontSize = getFontSize(24, width);
  const headerTitleFontSize = getFontSize(20, width);
  const bodyFontSize = getFontSize(16, width);

  // Responsive spacing
  const cardMargin = getScaledSpacing(12, width);
  const cardPadding = getScaledSpacing(16, width);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // 成功动画状态
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // 使用 ref 来跟踪组件挂载状态和 interval
  const isMountedRef = useRef(true);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 检查是否有预加载的题目
  const hasPreloadedQuestions = preloadedQuestions && preloadedQuestions.length > 0;

  // 加载预加载的题目或从历史记录加载
  useEffect(() => {
    const loadPreloadedOrHistoryQuestions = async () => {
      // PATCH-010: 添加竞态条件保护
      if (!isMountedRef.current) {
        return;
      }

      if (hasPreloadedQuestions) {
        // 有预加载的题目，直接转换并显示
        const convertedQuestions: Question[] = preloadedQuestions.map((pq, index) => ({
          id: pq.id,
          title: `题目 ${index + 1}`,
          content: pq.question,
          imageUrl: '',
          // BAD_SPEC-002: 使用传入的 questionType 参数而非硬编码
          type: questionType || QuestionType.ADDITION,
          difficulty: pq.difficulty,
          grade: 1,
          knowledgePoint: '',
          explanation: pq.explanation || '',
          answer: pq.answer,
          createdAt: new Date(),
          userId: '',
        }));

        if (isMountedRef.current) {
          setQuestions(convertedQuestions);
          // 显示成功动画
          showSuccessAnimationAndScroll();
        }
      } else if (generationId) {
        // 从历史记录加载
        try {
          const record = await generationHistoryService.getGenerationById(generationId);
          if (record && record.questions && isMountedRef.current) {
            const convertedQuestions: Question[] = record.questions.map((pq, index) => ({
              id: pq.id,
              title: `题目 ${index + 1}`,
              content: pq.question,
              imageUrl: '',
              type: record.questionType,
              difficulty: record.difficulty,
              grade: 1,
              knowledgePoint: '',
              explanation: pq.explanation || '',
              answer: pq.answer,
              createdAt: new Date(record.timestamp),
              userId: '',
            }));

            if (isMountedRef.current) {
              setQuestions(convertedQuestions);
              showSuccessAnimationAndScroll();
            }
          }
        } catch (error) {
          console.error('Failed to load generation history:', error);
          if (isMountedRef.current) {
            setError('无法加载练习记录');
          }
        }
      }
    };

    loadPreloadedOrHistoryQuestions();
  }, [generationId, preloadedQuestions, questionType]); // PATCH-012: 添加 questionType 到依赖

  // 显示成功动画并滚动到顶部
  const showSuccessAnimationAndScroll = () => {
    setShowSuccessAnimation(true);

    // 淡入动画
    const animation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });
    animation.start();

    // 2秒后隐藏动画 - 保存 timeout ID 以便清理
    successTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setShowSuccessAnimation(false);
      }
    }, 2000);
  };

  // 初始生成题目（仅当没有预加载题目时）
  useEffect(() => {
    if (!hasPreloadedQuestions && !generationId && baseQuestion) {
      generateQuestions();
    }

    // 清理函数：组件卸载时设置标志并清理 interval、timeout
    return () => {
      isMountedRef.current = false;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    };
  }, [hasPreloadedQuestions, generationId]);

  const generateQuestions = async (quantity?: number) => {
    // 防止竞态条件：如果正在生成，直接返回
    if (isGenerating) {
      console.warn('Generation already in progress, ignoring request');
      return;
    }

    // 如果没有 baseQuestion 且没有预加载题目，无法生成
    if (!baseQuestion && !hasPreloadedQuestions) {
      setError('无法生成题目：缺少基础题目信息');
      return;
    }

    const count = quantity || selectedQuantity;
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      const startTime = Date.now();

      // 模拟进度更新，保存 interval 引用
      progressIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setGenerationProgress(prev => {
            if (prev >= 90) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              return 90;
            }
            return prev + 10;
          });
        }
      }, 100);

      const generatedQuestions = await questionGenerationService.generateSimilarQuestions(
        {
          id: 'base',
          title: '基础题目',
          content: '',
          type: (baseQuestion?.type || questionType || QuestionType.ADDITION) as any,
          difficulty: baseQuestion?.difficulty || initialDifficulty || Difficulty.MEDIUM,
          grade: 1,
          knowledgePoint: '',
          explanation: '',
          answer: '',
          createdAt: new Date(),
          userId: baseQuestion?.userId || '',
        },
        count,
        baseQuestion?.difficulty || initialDifficulty || Difficulty.MEDIUM
      );

      // 清理 interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // 只在组件仍然挂载时更新状态
      if (isMountedRef.current) {
        setGenerationProgress(100);

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Generated ${count} questions in ${duration}ms`);

        setQuestions(generatedQuestions);

        setTimeout(() => {
          if (isMountedRef.current) {
            setIsGenerating(false);
            setGenerationProgress(0);
          }
        }, 300);
      }
    } catch (err) {
      // 确保 interval 被清理（即使在错误情况下）
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // 只在组件仍然挂载时更新状态
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : '生成题目失败，请重试';
        console.error('Generation error:', errorMessage);
        setError(errorMessage);
        setIsGenerating(false);
        setGenerationProgress(0);
      }
    }
  };

  const handleQuantitySelect = async (quantity: number) => {
    // 保存用户选择到偏好设置
    try {
      await preferencesService.setQuantityPreference(quantity);
    } catch (error) {
      console.warn('Failed to save quantity preference:', error);
      // 不阻止流程，偏好保存失败不影响功能
    }

    setSelectedQuantity(quantity);
    setShowQuantitySelector(false);
    generateQuestions(quantity);
  };

  const handleRegenerate = () => {
    // 防止重复打开 Alert
    if (isAlertVisible || isGenerating) {
      return;
    }

    setIsAlertVisible(true);

    Alert.alert(
      '重新生成',
      '确定要重新生成题目吗？当前题目将被替换。',
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: () => setIsAlertVisible(false),
        },
        {
          text: '确定',
          onPress: () => {
            setIsAlertVisible(false);
            generateQuestions();
          },
        },
      ],
      { onDismiss: () => setIsAlertVisible(false) }
    );
  };

  const toggleAnswer = (questionId: string) => {
    setExpandedQuestionId(prev => (prev === questionId ? null : questionId));
  };

  const handleExportPDF = async () => {
    if (questions.length === 0) {
      Alert.alert('提示', '请先生成题目');
      return;
    }

    setIsGeneratingPDF(true);
    setPdfError(null);

    try {
      const metadata: PDFMetadata = {
        title: '一年级数学练习题',
        date: new Date().toISOString().split('T')[0],
        difficulty: baseQuestion?.difficulty || initialDifficulty || questions[0]?.difficulty || Difficulty.MEDIUM,
      };

      const pdfPath = await pdfService.generateQuestionsPDF(questions, metadata);

      // 导航到 PDF 预览界面
      navigation.navigate('PDFPreview', {
        pdfPath,
        questionCount: questions.length,
        difficulty: metadata.difficulty,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成 PDF 失败';
      setPdfError(errorMessage);
      Alert.alert('生成失败', errorMessage, [
        { text: '确定', onPress: () => setPdfError(null) },
      ]);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const isExpanded = expandedQuestionId === question.id;

    // 获取题目类型标签
    const getQuestionTypeLabel = (type: QuestionType): string => {
      switch (type) {
        case QuestionType.ADDITION:
          return '加法';
        case QuestionType.SUBTRACTION:
          return '减法';
        case QuestionType.WORD_PROBLEM:
          return '应用题';
        default:
          return '未知';
      }
    };

    // Responsive styles
    const questionCardStyle = {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: cardPadding,
      marginBottom: getScaledSpacing(12, width),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      // Two columns on large tablets in landscape
      flex: numColumns > 1 ? 1 : undefined,
      marginLeft: numColumns > 1 && index % 2 === 1 ? getScaledSpacing(8, width) : 0,
    };

    const questionContentStyle = {
      fontSize: questionFontSize,
      fontWeight: '600' as const,
      color: '#2196f3',
      textAlign: 'center' as const,
      marginVertical: getScaledSpacing(16, width),
    };

    const answerToggleStyle = {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      overflow: 'hidden' as const,
    };

    const answerToggleHeaderStyle = {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: getScaledSpacing(12, width) * 0.75, // Scale padding
      paddingHorizontal: getScaledSpacing(12, width),
      backgroundColor: '#f8f9fa',
      // Ensure minimum 48dp touch target
      minHeight: 48,
    };

    return (
      <View key={question.id} style={questionCardStyle}>
        <View style={styles.questionHeader}>
          <Text style={[styles.questionNumber, { fontSize: bodyFontSize }]}>
            题目 {index + 1}
          </Text>
          <Text style={styles.questionType}>
            {getQuestionTypeLabel(question.type)}
          </Text>
        </View>
        <Text style={questionContentStyle}>{question.content}</Text>

        <TouchableOpacity
          style={answerToggleStyle}
          onPress={() => toggleAnswer(question.id)}
          activeOpacity={0.7}>
          <View style={answerToggleHeaderStyle}>
            <Text style={[styles.answerToggleText, { fontSize: bodyFontSize }]}>
              {isExpanded ? '隐藏' : '显示'}答案
            </Text>
            <Text style={styles.answerToggleIcon}>
              {isExpanded ? '▲' : '▼'}
            </Text>
          </View>

          {isExpanded && (
            <View style={styles.answerContent}>
              <Text style={[styles.answerLabel, { fontSize: bodyFontSize }]}>
                答案：
              </Text>
              <Text style={[styles.answerValue, { fontSize: getFontSize(20, width) }]}>
                {question.answer}
              </Text>
              <Text style={[styles.explanationLabel, { fontSize: bodyFontSize }]}>
                讲解：
              </Text>
              <Text style={[styles.explanationValue, { fontSize: bodyFontSize, lineHeight: 22 }]}>
                {question.explanation}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isGenerating && questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>正在生成题目...</Text>
        <Text style={styles.progressText}>{generationProgress}%</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: headerTitleFontSize }]}>练习题</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { minHeight: 48 }]}
            onPress={() => setShowQuantitySelector(true)}>
            <Text style={[styles.headerButtonText, { fontSize: bodyFontSize }]}>
              {selectedQuantity}题
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { minHeight: 48 }]}
            onPress={handleRegenerate}>
            <Text style={[styles.headerButtonText, { fontSize: bodyFontSize }]}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { minHeight: 48 }]}
            onPress={handleExportPDF}
            disabled={isGeneratingPDF || questions.length === 0}>
            {isGeneratingPDF ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.headerButtonText, { fontSize: bodyFontSize }]}>PDF</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => generateQuestions()}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PDF Error Message */}
      {pdfError && (
        <View style={styles.pdfErrorContainer}>
          <Text style={styles.pdfErrorText}>{pdfError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleExportPDF}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Questions List */}
      {numColumns > 1 ? (
        // Two-column layout for large tablets
        <View style={[
          styles.scrollContainer,
          styles.gridContainer,
          { padding: getScaledSpacing(16, width) },
        ]}>
          {questions.map((q, i) => renderQuestion(q, i))}
        </View>
      ) : (
        // Single column layout
        <ScrollView style={styles.scrollContainer}>
          {questions.map((q, i) => renderQuestion(q, i))}
        </ScrollView>
      )}

      {/* Generating Overlay */}
      {isGenerating && questions.length > 0 && (
        <View style={styles.generatingOverlay}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.generatingText}>正在生成...</Text>
        </View>
      )}

      {/* Quantity Selector Modal */}
      <QuantitySelector
        visible={showQuantitySelector}
        selected={selectedQuantity}
        onSelect={handleQuantitySelect}
        onCancel={() => setShowQuantitySelector(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2196f3',
    borderRadius: 6,
  },
  headerButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#c62828',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  pdfErrorContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  pdfErrorText: {
    color: '#e65100',
    fontSize: 14,
    marginBottom: 12,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  questionType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  questionContent: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2196f3',
    textAlign: 'center',
    marginVertical: 16,
  },
  answerToggleButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  answerToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  answerToggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  answerToggleIcon: {
    fontSize: 12,
    color: '#999',
  },
  answerContent: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  answerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 12,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  explanationValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  generatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default GeneratedQuestionsList;
