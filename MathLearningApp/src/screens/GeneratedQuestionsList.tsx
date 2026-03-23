import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/native-stack';
import {Question, Difficulty, QuestionType} from '../types';
import {questionGenerationService} from '../services/questionGenerationService';
import QuantitySelector from '../components/QuantitySelector';
import {preferencesService} from '../services/preferencesService';

interface RouteParams {
  baseQuestion: {
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
  const {baseQuestion, initialQuantity = 10, initialDifficulty} = route.params;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  // 使用 ref 来跟踪组件挂载状态和 interval
  const isMountedRef = useRef(true);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初始生成题目
  React.useEffect(() => {
    generateQuestions();

    // 清理函数：组件卸载时设置标志并清理 interval
    return () => {
      isMountedRef.current = false;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  const generateQuestions = async (quantity?: number) => {
    // 防止竞态条件：如果正在生成，直接返回
    if (isGenerating) {
      console.warn('Generation already in progress, ignoring request');
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
          type: baseQuestion.type as any,
          difficulty: baseQuestion.difficulty,
          grade: 1,
          knowledgePoint: '',
          explanation: '',
          answer: '',
          createdAt: new Date(),
          userId: baseQuestion.userId,
        },
        count,
        baseQuestion.difficulty
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

    return (
      <View key={question.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>题目 {index + 1}</Text>
          <Text style={styles.questionType}>
            {getQuestionTypeLabel(question.type)}
          </Text>
        </View>
        <Text style={styles.questionContent}>{question.content}</Text>

        <TouchableOpacity
          style={styles.answerToggleButton}
          onPress={() => toggleAnswer(question.id)}>
          <View style={styles.answerToggleHeader}>
            <Text style={styles.answerToggleText}>
              {isExpanded ? '隐藏' : '显示'}答案
            </Text>
            <Text style={styles.answerToggleIcon}>
              {isExpanded ? '▲' : '▼'}
            </Text>
          </View>

          {isExpanded && (
            <View style={styles.answerContent}>
              <Text style={styles.answerLabel}>答案：</Text>
              <Text style={styles.answerValue}>{question.answer}</Text>
              <Text style={styles.explanationLabel}>讲解：</Text>
              <Text style={styles.explanationValue}>{question.explanation}</Text>
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
        <Text style={styles.headerTitle}>练习题</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowQuantitySelector(true)}>
            <Text style={styles.headerButtonText}>{selectedQuantity}题</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRegenerate}>
            <Text style={styles.headerButtonText}>↻</Text>
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

      {/* Questions List */}
      <ScrollView style={styles.scrollContainer}>
        {questions.map((q, i) => renderQuestion(q, i))}
      </ScrollView>

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
  scrollContainer: {
    flex: 1,
    padding: 16,
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
