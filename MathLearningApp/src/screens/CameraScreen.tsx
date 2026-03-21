import React, {useState, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal} from 'react-native';
import {RNCamera} from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Button, Card, Title} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {recognitionApi} from '../services/api';
import {RecognitionResult, QuestionType, ManualCorrection, Difficulty, PerformanceMetrics, ProcessingStage} from '../types';
import QuestionTypeSelector from '../components/QuestionTypeSelector';
import DifficultySelector from '../components/DifficultySelector';
import ProcessingProgress from '../components/ProcessingProgress';
import KnowledgePointTag from '../components/KnowledgePointTag';
import {preferencesService} from '../services/preferencesService';
import {performanceTracker, WARNING_THRESHOLD} from '../services/performanceTracker';
import {imageOptimizer} from '../utils/imageOptimizer';

const CameraScreen = () => {
  const navigation = useNavigation();
  const cameraRef = useRef<RNCamera>(null);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualCorrection, setShowManualCorrection] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [suggestedType, setSuggestedType] = useState<QuestionType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | undefined>(undefined);
  const [recommendedDifficulty, setRecommendedDifficulty] = useState<Difficulty | undefined>(undefined);
  const [isLoadingDifficulty, setIsLoadingDifficulty] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // 性能跟踪相关状态
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [showProcessingProgress, setShowProcessingProgress] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // 默认一年级（可以根据用户设置调整）
  const gradeLevel = 1;

  // 生成会话ID
  const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 订阅性能跟踪更新
  useEffect(() => {
    const unsubscribe = performanceTracker.subscribe((metrics) => {
      setPerformanceMetrics(metrics);

      // 检查是否应显示进度
      const currentStage = performanceTracker.getCurrentStage();
      setShowProcessingProgress(
        currentStage !== ProcessingStage.IDLE &&
        currentStage !== ProcessingStage.COMPLETED &&
        currentStage !== ProcessingStage.ERROR
      );

      // 检查是否应显示警告
      if (performanceTracker.shouldShowWarning() && !showWarning) {
        setShowWarning(true);
      }
    });

    return unsubscribe;
  }, [showWarning]);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsTakingPicture(true);
    setRecognitionResult(null);
    setError(null);
    setShowWarning(false);

    // 启动性能跟踪会话
    const sessionId = generateSessionId();
    performanceTracker.startSession(sessionId);

    try {
      const options = {
        quality: 0.8,
        base64: true,
        fixOrientation: true,
        forceUpOrientation: true,
      };

      const data = await cameraRef.current.takePictureAsync(options);
      console.log('Picture taken:', data.uri);

      // 记录上传阶段
      performanceTracker.recordStage(ProcessingStage.UPLOADING);
      setCurrentImageUri(data.uri);

      // 识别题目类型
      await recognizeQuestionType(data.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      performanceTracker.markError('拍照失败');
      Alert.alert('错误', '拍照失败，请重试');
    } finally {
      setIsTakingPicture(false);
    }
  };

  const recognizeQuestionType = async (imageUri: string) => {
    setIsRecognizing(true);

    // 记录识别阶段
    performanceTracker.recordStage(ProcessingStage.RECOGNIZING);

    try {
      const response = await recognitionApi.recognizeQuestionType(
        imageUri,
        (stage, progress) => {
          // 进度回调已在 API 中处理
          console.log(`Recognition progress: ${stage} - ${progress}%`);
        }
      );

      if (response.success && response.data) {
        setRecognitionResult(response.data);

        // 检查是否有用户偏好建议
        const suggestion = await preferencesService.suggestQuestionType(
          response.data.questionType
        );
        setSuggestedType(suggestion);

        // 显示难度选择器（AC:1 题目类型识别后显示难度选择界面）
        await showDifficultySelectionModal(response.data.questionType);
      } else {
        setError(response.error?.message || '识别失败');
        performanceTracker.markError(response.error?.message || '识别失败');
        Alert.alert('识别失败', response.error?.message || '无法识别题目类型', [
          {text: '确定', onPress: () => {
            performanceTracker.completeSession();
          }},
          {text: '手动选择', onPress: () => {
            performanceTracker.recordStage(ProcessingStage.CORRECTION);
            setShowManualCorrection(true);
          }}
        ]);
      }
    } catch (error) {
      console.error('Recognition error:', error);
      setError(error instanceof Error ? error.message : '识别过程出错');
      performanceTracker.markError(error instanceof Error ? error.message : '识别出错');
      Alert.alert('错误', '识别过程出错，请重试');
    } finally {
      setIsRecognizing(false);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    const labels = {
      [QuestionType.ADDITION]: '加法',
      [QuestionType.SUBTRACTION]: '减法',
      [QuestionType.WORD_PROBLEM]: '应用题'
    };
    return labels[type] || '未知类型';
  };

  const handleManualCorrection = async (selectedType: QuestionType) => {
    if (!recognitionResult) return;

    console.log('手动修正题目类型:', selectedType);

    try {
      // 记录纠正到偏好服务
      await preferencesService.recordCorrection(
        recognitionResult.questionType,
        selectedType,
        currentImageUri
      );

      // 创建手动纠正记录
      const correction: ManualCorrection = {
        id: Date.now().toString(),
        originalType: recognitionResult.questionType,
        correctedType: selectedType,
        imageUri: currentImageUri,
        timestamp: new Date(),
      };

      // 提交到API（用于AI学习）
      await recognitionApi.submitManualCorrection(correction);

      // 更新本地状态
      setRecognitionResult(prev => prev ? {
        ...prev,
        questionType: selectedType,
        correctedQuestionType: selectedType,
        isCorrected: true
      } : null);

      setShowManualCorrection(false);

      // 记录纠正完成并显示难度选择器
      performanceTracker.recordStage(ProcessingStage.CORRECTION);
      showDifficultySelectionModal(selectedType);
    } catch (error) {
      console.error('Failed to record manual correction:', error);
      // 即使记录失败，也更新本地状态
      setRecognitionResult(prev => prev ? {
        ...prev,
        questionType: selectedType,
        correctedQuestionType: selectedType,
        isCorrected: true
      } : null);
      setShowManualCorrection(false);

      // 仍然显示难度选择器
      performanceTracker.recordStage(ProcessingStage.CORRECTION);
      showDifficultySelectionModal(selectedType);
    }
  };

  // 显示难度选择模态框
  const showDifficultySelectionModal = async (questionType: QuestionType) => {
    setIsLoadingDifficulty(true);
    setShowDifficultySelector(true);

    // 记录难度选择阶段
    performanceTracker.recordStage(ProcessingStage.DIFFICULTY_SELECTION);

    try {
      // 获取推荐的难度
      const recommended = await preferencesService.getDifficultyPreference(questionType, gradeLevel);
      setRecommendedDifficulty(recommended);

      // 获取保存的难度偏好
      const savedDifficulty = await preferencesService.getDifficultyPreference(questionType, gradeLevel);
      setSelectedDifficulty(savedDifficulty);
    } catch (error) {
      console.error('Failed to load difficulty preference:', error);
      setRecommendedDifficulty(preferencesService.getRecommendedDifficulty(gradeLevel));
    } finally {
      setIsLoadingDifficulty(false);
    }
  };

  // 处理难度选择
  const handleDifficultySelect = async (difficulty: Difficulty) => {
    if (!recognitionResult) return;

    setIsLoadingDifficulty(true);

    try {
      const questionType = recognitionResult.correctedQuestionType || recognitionResult.questionType;

      // 记录难度选择到偏好服务
      await preferencesService.recordDifficultySelection(questionType, difficulty, gradeLevel);

      // 提交到API
      await recognitionApi.submitDifficultySelection(questionType, difficulty);

      // 更新识别结果
      setRecognitionResult(prev => prev ? {
        ...prev,
        selectedDifficulty: difficulty
      } : null);

      setSelectedDifficulty(difficulty);
      setShowDifficultySelector(false);

      // 开始生成问题
      await generateQuestions(questionType, difficulty);
    } catch (error) {
      console.error('Failed to process difficulty selection:', error);
      performanceTracker.markError('难度选择失败');
      setIsLoadingDifficulty(false);
      setShowDifficultySelector(false);
      Alert.alert('错误', '处理难度选择失败，请重试');
    }
  };

  // 生成问题
  const generateQuestions = async (questionType: QuestionType, difficulty: Difficulty) => {
    setIsGeneratingQuestions(true);

    // 记录生成阶段
    performanceTracker.recordStage(ProcessingStage.GENERATING);

    try {
      const response = await recognitionApi.generateQuestionsWithDifficulty({
        questionType,
        difficulty,
        count: 5, // 生成5道题目
      }, (stage, progress) => {
        console.log(`Generation progress: ${stage} - ${progress}%`);
      });

      if (response.success && response.data) {
        // 完成性能跟踪
        performanceTracker.completeSession();

        Alert.alert(
          '生成成功',
          `已生成 ${response.data.questions.length} 道${getDifficultyLabel(difficulty)}题目\n总用时: ${performanceTracker.getCurrentMetrics()?.totalTime ? (performanceTracker.getCurrentMetrics()!.totalTime! / 1000).toFixed(1) : 'N/A'}秒`
        );
      } else {
        throw new Error(response.error?.message || '生成失败');
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
      performanceTracker.markError('生成题目失败');
      Alert.alert(
        '生成失败',
        error instanceof Error ? error.message : '生成题目失败',
        [
          {
            text: '取消',
            onPress: () => {
              // 保存部分进度
              const metrics = performanceTracker.getCurrentMetrics();
              console.log('Partial progress saved:', metrics);
              performanceTracker.completeSession();
            }
          },
          {
            text: '重试',
            onPress: () => generateQuestions(questionType, difficulty)
          }
        ]
      );
    } finally {
      setIsGeneratingQuestions(false);
      setIsLoadingDifficulty(false);
      setShowProcessingProgress(false);
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty): string => {
    const labels = {
      [Difficulty.EASY]: '简单',
      [Difficulty.MEDIUM]: '中等',
      [Difficulty.HARD]: '困难'
    };
    return labels[difficulty] || '未知难度';
  };

  // Story 3-3: 处理知识点标签点击 - 导航到讲解屏幕
  const handleKnowledgePointPress = (knowledgePointId: string, knowledgePointName: string) => {
    (navigation as any).navigate('ExplanationScreen', {
      knowledgePointId,
      knowledgePointName,
      grade: '一年级',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>拍摄数学题目</Text>

      <Card style={styles.instructionCard}>
        <Card.Content>
          <Title>使用说明</Title>
          <Text style={styles.instructionText}>
            1. 确保题目清晰完整{'\n'}
            2. 保持光线充足{'\n'}
            3. 对准题目后点击拍照{'\n'}
            4. 系统将自动识别题目类型
          </Text>
        </Card.Content>
      </Card>

      {/* 识别状态显示 */}
      {isRecognizing && (
        <View style={styles.recognitionStatus}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.recognitionText}>正在识别题目类型...</Text>
        </View>
      )}

      {error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Title style={styles.errorTitle}>识别错误</Title>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      {recognitionResult && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Title>识别结果</Title>
            <Text style={styles.resultText}>
              题目类型: {getQuestionTypeLabel(recognitionResult.questionType)}
            </Text>
            <Text style={styles.resultText}>
              置信度: {(recognitionResult.confidence * 100).toFixed(1)}%
            </Text>

            {/* Story 3-3: 知识点标签 - 支持点击导航到详细讲解 */}
            {recognitionResult.knowledgePoints ? (
              <View style={styles.knowledgePointContainer}>
                <Text style={styles.resultText}>知识点:</Text>
                <KnowledgePointTag
                  matchResult={recognitionResult.knowledgePoints.primaryKnowledgePoint}
                  onPress={(matchResult) =>
                    handleKnowledgePointPress(
                      matchResult.knowledgePoint.id,
                      matchResult.knowledgePoint.name
                    )
                  }
                />
              </View>
            ) : (
              <Text style={styles.resultText}>
                知识点: {recognitionResult.knowledgePoint}
              </Text>
            )}

            {selectedDifficulty && (
              <Text style={styles.resultText}>
                选择难度: {getDifficultyLabel(selectedDifficulty)}
              </Text>
            )}
            <Button
              mode="outlined"
              onPress={() => setShowManualCorrection(true)}
              style={styles.correctionButton}
            >
              不对？手动修正
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* 生成问题加载状态 */}
      {isGeneratingQuestions && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>正在生成题目...</Text>
        </View>
      )}

      <View style={styles.cameraContainer}>
        <RNCamera
          ref={cameraRef}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.off}
          androidCameraPermissionOptions={{
            title: '相机权限',
            message: '需要相机权限来拍摄题目',
            buttonPositive: '确定',
            buttonNegative: '取消',
          }}
        />

        <View style={styles.cameraOverlay}>
          <View style={styles.focusFrame}>
            <Text style={styles.focusText}>将题目框在此区域内</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.captureButton, (isTakingPicture || isRecognizing) && styles.captureButtonDisabled]}
        onPress={takePicture}
        disabled={isTakingPicture || isRecognizing}>
        <Icon name="camera" size={40} color="white" />
        {(isTakingPicture || isRecognizing) && (
          <ActivityIndicator style={styles.buttonActivity} color="white" />
        )}
      </TouchableOpacity>

      {/* 手动修正组件 */}
      <QuestionTypeSelector
        visible={showManualCorrection}
        currentType={recognitionResult?.questionType}
        onSelect={handleManualCorrection}
        onCancel={() => setShowManualCorrection(false)}
      />

      {/* 难度选择组件 */}
      <DifficultySelector
        visible={showDifficultySelector}
        currentDifficulty={selectedDifficulty}
        recommendedDifficulty={recommendedDifficulty}
        isLoading={isLoadingDifficulty}
        onSelect={handleDifficultySelect}
        onCancel={() => setShowDifficultySelector(false)}
      />

      {/* 处理进度组件 */}
      <ProcessingProgress
        visible={showProcessingProgress}
        metrics={performanceMetrics}
        warningThreshold={WARNING_THRESHOLD}
      />

      {/* 处理时间过长警告 */}
      {showWarning && !showProcessingProgress && (
        <Modal visible={showWarning} transparent animationType="fade">
          <View style={styles.warningModalContainer}>
            <View style={styles.warningModalContent}>
              <Text style={styles.warningTitle}>⚠️ 处理时间较长</Text>
              <Text style={styles.warningMessage}>
                当前处理已超过 {WARNING_THRESHOLD / 1000} 秒，请选择：
              </Text>
              <View style={styles.warningButtons}>
                <TouchableOpacity
                  style={[styles.warningButton, styles.warningButtonCancel]}
                  onPress={() => {
                    setShowWarning(false);
                    performanceTracker.completeSession();
                  }}>
                  <Text style={styles.warningButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.warningButton, styles.warningButtonContinue]}
                  onPress={() => setShowWarning(false)}>
                  <Text style={styles.warningButtonText}>继续等待</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
  },
  instructionCard: {
    margin: 15,
    borderRadius: 10,
  },
  instructionText: {
    marginTop: 10,
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  focusFrame: {
    flex: 1,
    borderColor: 'white',
    borderWidth: 2,
    margin: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  captureButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  captureButtonDisabled: {
    backgroundColor: 'gray',
  },
  recognitionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  recognitionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  errorCard: {
    margin: 15,
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorTitle: {
    color: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 5,
  },
  resultCard: {
    margin: 15,
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  resultText: {
    fontSize: 16,
    marginVertical: 3,
    color: '#333',
  },
  knowledgePointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  correctionButton: {
    marginTop: 10,
    borderColor: '#2196f3',
  },
  buttonActivity: {
    position: 'absolute',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#e3f2fd',
    marginHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
  warningModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  warningModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  warningMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
  },
  warningButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  warningButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  warningButtonCancel: {
    backgroundColor: '#e0e0e0',
  },
  warningButtonContinue: {
    backgroundColor: '#2196f3',
  },
  warningButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});

export default CameraScreen;