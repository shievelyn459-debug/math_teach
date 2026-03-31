import React, {useState, useRef, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, Dimensions, StatusBar, ScrollView, Image} from 'react-native';
import {RNCamera} from 'react-native-camera';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Button as PaperButton, Card as PaperCard, Title} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';

// 导入设计系统和 UI 组件
import {designSystem} from '../styles/designSystem';
import {Card, Button, Icon, Typography, Spacer} from '../components/ui';
import {recognitionApi} from '../services/api';
import {RecognitionResult, QuestionType, ManualCorrection, Difficulty, PerformanceMetrics, ProcessingStage, GenerationRecord, GeneratedQuestion} from '../types';
import QuestionTypeSelector from '../components/QuestionTypeSelector';
import DifficultySelector from '../components/DifficultySelector';
import ProcessingProgress from '../components/ProcessingProgress';
import KnowledgePointTag from '../components/KnowledgePointTag';
import HelpDialog from '../components/HelpDialog';
import OnboardingTour from '../components/OnboardingTour';
import TipCard from '../components/TipCard';
import CountdownTimer from '../components/CountdownTimer';
import {preferencesService} from '../services/preferencesService';
import {performanceTracker, WARNING_THRESHOLD} from '../services/performanceTracker';
import {feedbackManager} from '../services/feedbackManager';
import {imageOptimizer} from '../utils/imageOptimizer';
import {generationHistoryService, generateUniqueId} from '../services/generationHistoryService';
import {checkTourCompleted} from '../components/OnboardingTour';
import {recognitionCache} from '../services/recognitionCache'; // PATCH-C4: Import cache
import {launchImageLibrary} from 'react-native-image-picker';
import {aiService} from '../services/ai'; // Import AI service for OCR

// 获取屏幕尺寸
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// 平板适配工具
const isTablet = () => {
  const pixelDensity = Dimensions.get('window').scale;
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  return Math.min(adjustedWidth, adjustedHeight) >= 900;
};

const IS_TABLET = isTablet();

// 平板适配尺寸
const TABLET_SCALE = IS_TABLET ? 1.2 : 1;
const BUTTON_SIZE = Math.min(SCREEN_WIDTH * (IS_TABLET ? 0.22 : 0.19), IS_TABLET ? 100 : 80) * TABLET_SCALE;
const GALLERY_BUTTON_SIZE = Math.min(SCREEN_WIDTH * (IS_TABLET ? 0.16 : 0.15), IS_TABLET ? 80 : 65) * TABLET_SCALE;

const CameraScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
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
  const [preselectedImage, setPreselectedImage] = useState<{uri: string; base64?: string} | null>(null);

  // 帮助和导览状态
  const [showHelp, setShowHelp] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // 性能跟踪相关状态
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [showProcessingProgress, setShowProcessingProgress] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // 使用ref追踪组件状态和清理
  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const hasProcessedImageRef = useRef(false);

  // 默认一年级（可以根据用户设置调整）
  const gradeLevel = 1;

  // 生成会话ID
  const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 订阅性能跟踪更新（改进订阅清理）
  useEffect(() => {
    // 清理之前的订阅
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = performanceTracker.subscribe((metrics) => {
      if (!isMountedRef.current) return;

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

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [showWarning]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // 清理导览timeout
      if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
      }
      // 完成性能跟踪会话
      if (currentSessionIdRef.current) {
        try {
          performanceTracker.completeSession();
        } catch (e) {
          console.warn('Failed to complete performance session:', e);
        }
      }
      // 清理订阅
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // 检查是否需要显示导览（修复timeout清理）
  useEffect(() => {
    const checkAndShowTour = async () => {
      try {
        const completed = await checkTourCompleted('CameraScreen');
        if (!completed && isMountedRef.current) {
          tourTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setShowTour(true);
            }
          }, 300);
        }
      } catch (error) {
        console.error('Failed to check tour completion:', error);
      }
    };

    checkAndShowTour();
  }, []);

  // 处理从HomeScreen传递过来的图片
  useEffect(() => {
    const params = route.params as {
      selectedImageUri?: string;
      selectedImageBase64?: string;
    };

    if (
      params?.selectedImageUri &&
      !hasProcessedImageRef.current &&
      !isRecognizing
    ) {
      hasProcessedImageRef.current = true;
      setPreselectedImage({
        uri: params.selectedImageUri,
        base64: params.selectedImageBase64,
      });

      // 自动开始识别
      processSelectedImage(params.selectedImageUri, params.selectedImageBase64);
    }
  }, [route.params]);

  const processSelectedImage = async (uri: string, base64?: string) => {
    setIsTakingPicture(true);
    setRecognitionResult(null);
    setError(null);
    setShowWarning(false);

    const sessionId = generateSessionId();
    currentSessionIdRef.current = sessionId;
    performanceTracker.startSession(sessionId);

    try {
      performanceTracker.recordStage(ProcessingStage.UPLOADING);
      setCurrentImageUri(uri);

      if (base64) {
        const base64DataUrl = base64.startsWith('data:image')
          ? base64
          : `data:image/jpeg;base64,${base64}`;
        await recognizeQuestionTypeWithBase64(base64DataUrl);
      } else {
        await recognizeQuestionType(uri);
      }
    } catch (error) {
      console.error('Error processing selected image:', error);
      performanceTracker.markError('处理图片失败');
      setError('处理图片失败，请重试');
      setIsTakingPicture(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsTakingPicture(true);
    setRecognitionResult(null);
    setError(null);
    setShowWarning(false);

    // 启动性能跟踪会话并追踪
    const sessionId = generateSessionId();
    currentSessionIdRef.current = sessionId;
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
      console.log('[CameraScreen] Has base64 data:', !!data.base64);
      console.log('[CameraScreen] Base64 length:', data.base64?.length || 0);

      // 记录上传阶段
      performanceTracker.recordStage(ProcessingStage.UPLOADING);
      setCurrentImageUri(data.uri);

      // 直接使用相机捕获的base64数据进行OCR识别
      // 跳过图片优化，避免文件系统读取问题
      if (data.base64) {
        console.log('[CameraScreen] Using camera base64 data directly');
        // 构建data URL格式（如果相机只返回了base64字符串）
        const base64DataUrl = data.base64.startsWith('data:image')
          ? data.base64
          : `data:image/jpeg;base64,${data.base64}`;
        await recognizeQuestionTypeWithBase64(base64DataUrl);
      } else {
        console.warn('[CameraScreen] No base64 data from camera, falling back to URI method');
        // PATCH-C5: Story 5-3 - Optimize image for performance before upload
        let optimizedImageUri = data.uri;
        try {
          const optimized = await imageOptimizer.optimizeForPerformance(data.uri);
          optimizedImageUri = optimized.uri;
          console.log(`[CameraScreen] Image optimized: ${formatBytes(optimized.size)} bytes`);
        } catch (optimizationError) {
          console.warn('[CameraScreen] Image optimization failed, using original:', optimizationError);
        }

        // 识别题目类型
        await recognizeQuestionType(optimizedImageUri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      performanceTracker.markError('拍照失败');
      feedbackManager.showFriendlyError(error, '拍照', () => takePicture());
    } finally {
      setIsTakingPicture(false);
    }
  };

  /**
   * 从相册选择图片进行识别
   */
  const pickImageFromGallery = async () => {
    setIsTakingPicture(true);
    setRecognitionResult(null);
    setError(null);
    setShowWarning(false);

    // 启动性能跟踪会话
    const sessionId = generateSessionId();
    currentSessionIdRef.current = sessionId;
    performanceTracker.startSession(sessionId);

    try {
      const result = await launchImageLibrary(
        {
          mediaType: 'photo',
          selectionLimit: 1,
          includeBase64: true,
          quality: 0.8,
        },
        (response) => {
          if (response.didCancel) {
            console.log('[CameraScreen] User cancelled image picker');
            setIsTakingPicture(false);
            performanceTracker.endSession();
            return;
          }

          if (response.errorCode) {
            console.error('[CameraScreen] ImagePicker error:', response.errorMessage);
            setError(response.errorMessage || '选择图片失败');
            setIsTakingPicture(false);
            performanceTracker.markError('选择图片失败');
            return;
          }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            console.log('[CameraScreen] Image selected:', asset.uri);
            console.log('[CameraScreen] Has base64 data:', !!asset.base64);

            performanceTracker.recordStage(ProcessingStage.UPLOADING);
            setCurrentImageUri(asset.uri || '');

            // 使用base64数据进行OCR识别（如果有）
            if (asset.base64) {
              console.log('[CameraScreen] Using gallery image base64 data directly');
              const base64DataUrl = asset.base64.startsWith('data:image')
                ? asset.base64
                : `data:image/jpeg;base64,${asset.base64}`;
              recognizeQuestionTypeWithBase64(base64DataUrl);
            } else if (asset.uri) {
              // 使用URI进行识别
              recognizeQuestionType(asset.uri);
            } else {
              setError('无法获取图片数据');
              setIsTakingPicture(false);
              performanceTracker.markError('图片数据无效');
            }
          }
        }
      );
    } catch (error) {
      console.error('Error picking image:', error);
      performanceTracker.markError('选择图片失败');
      feedbackManager.showFriendlyError(error, '选择图片', () => pickImageFromGallery());
    }
  };

  const recognizeQuestionType = async (imageUri: string) => {
    // 防止并发识别请求
    if (isRecognizing) {
      console.warn('[CameraScreen] Recognition already in progress, ignoring duplicate request');
      return;
    }

    setIsRecognizing(true);

    // 记录识别阶段
    performanceTracker.recordStage(ProcessingStage.RECOGNIZING);

    try {
      // PATCH-C4: Story 5-3 - Check cache before making API call
      const cacheKey = await recognitionCache.generateCacheKey(imageUri);
      const cachedResult = await recognitionCache.get(cacheKey);

      if (cachedResult) {
        console.log('[CameraScreen] Cache hit! Using cached recognition result');
        if (!isMountedRef.current) return;
        setRecognitionResult(cachedResult);

        // Check for user preferences
        const suggestion = await preferencesService.suggestQuestionType(
          cachedResult.questionType
        );
        if (isMountedRef.current) {
          setSuggestedType(suggestion);
        }

        // Show difficulty selector
        await showDifficultySelectionModal(cachedResult.questionType);
        setIsRecognizing(false);
        return;
      }

      console.log('[CameraScreen] Cache miss, calling recognition API...');
      const response = await recognitionApi.recognizeQuestionType(
        imageUri,
        (stage, progress) => {
          // 进度回调已在 API 中处理
          console.log(`Recognition progress: ${stage} - ${progress}%`);
        }
      );

      if (response.success && response.data) {
        if (!isMountedRef.current) return;
        setRecognitionResult(response.data);

        // PATCH-C4: Story 5-3 - Cache the recognition result
        try {
          await recognitionCache.set(cacheKey, response.data);
          console.log('[CameraScreen] Recognition result cached');
        } catch (cacheError) {
          console.warn('[CameraScreen] Failed to cache recognition result:', cacheError);
        }

        // 检查是否有用户偏好建议
        const suggestion = await preferencesService.suggestQuestionType(
          response.data.questionType
        );
        if (isMountedRef.current) {
          setSuggestedType(suggestion);
        }

        // 显示难度选择器（AC:1 题目类型识别后显示难度选择界面）
        await showDifficultySelectionModal(response.data.questionType);
      } else {
        const errorMsg = response.error?.message || '无法识别题目类型';
        if (!isMountedRef.current) return;
        setError(errorMsg);
        performanceTracker.markError(errorMsg);

        // 使用友好的错误对话框（修复并发重试问题）
        feedbackManager.showErrorDialog(
          '题目识别失败',
          '可能是图片不清晰或题目不在拍摄范围内。您可以重试或手动选择题目类型。',
          [
            {text: '重试', onPress: () => {
              // 检查是否仍在识别中，防止并发
              if (!isRecognizing) {
                recognizeQuestionType(imageUri);
              }
            }},
            {text: '手动选择', onPress: () => {
              performanceTracker.recordStage(ProcessingStage.CORRECTION);
              if (isMountedRef.current) {
                setShowManualCorrection(true);
              }
            }},
            {text: '取消', style: 'cancel', onPress: () => {
              performanceTracker.completeSession();
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Recognition error:', error);
      if (!isMountedRef.current) return;
      setError(error instanceof Error ? error.message : '识别过程出错');
      performanceTracker.markError(error instanceof Error ? error.message : '识别出错');
      Alert.alert('错误', '识别过程出错，请重试');
    } finally {
      if (isMountedRef.current) {
        setIsRecognizing(false);
      }
    }
  };

  /**
   * 直接使用base64数据进行OCR识别（避免文件系统读取问题）
   */
  const recognizeQuestionTypeWithBase64 = async (base64DataUrl: string) => {
    // 防止并发识别请求
    if (isRecognizing) {
      console.warn('[CameraScreen] Recognition already in progress, ignoring duplicate request');
      return;
    }

    setIsRecognizing(true);

    // 记录识别阶段
    performanceTracker.recordStage(ProcessingStage.RECOGNIZING);

    try {
      console.log('[CameraScreen] Starting OCR with base64 data, length:', base64DataUrl.length);

      // 直接调用AI服务进行OCR识别
      const ocrResult = await aiService.recognizeQuestion(base64DataUrl);

      if (!isMountedRef.current) return;

      // 显示识别结果
      setRecognitionResult({
        questionType: ocrResult.questionType as QuestionType,
        confidence: ocrResult.confidence,
        knowledgePoint: '',
        knowledgePoints: undefined,
        extractedText: ocrResult.extractedText,
      });

      console.log('[CameraScreen] OCR result:', ocrResult);

      // 检查是否有用户偏好建议
      const suggestion = await preferencesService.suggestQuestionType(
        ocrResult.questionType as QuestionType
      );
      if (isMountedRef.current) {
        setSuggestedType(suggestion);
      }

      // 显示难度选择器
      await showDifficultySelectionModal(ocrResult.questionType as QuestionType);
    } catch (error) {
      console.error('Recognition error with base64:', error);
      if (!isMountedRef.current) return;
      setError(error instanceof Error ? error.message : '识别过程出错');
      performanceTracker.markError(error instanceof Error ? error.message : '识别出错');

      feedbackManager.showErrorDialog(
        '题目识别失败',
        '可能是图片不清晰或题目不在拍摄范围内。您可以重试或手动选择题目类型。',
        [
          {text: '重试', onPress: () => {
            if (!isRecognizing) {
              takePicture();
            }
          }},
          {text: '手动选择', onPress: () => {
            performanceTracker.recordStage(ProcessingStage.CORRECTION);
            if (isMountedRef.current) {
              setShowManualCorrection(true);
            }
          }},
          {text: '取消', style: 'cancel', onPress: () => {
            performanceTracker.completeSession();
          }}
        ]
      );
    } finally {
      if (isMountedRef.current) {
        setIsRecognizing(false);
      }
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
        // PATCH-004: 验证题目数组不为空
        if (!response.data.questions || response.data.questions.length === 0) {
          throw new Error('未生成任何题目');
        }

        // 获取性能指标
        const metrics = performanceTracker.getCurrentMetrics();
        const processingTime = metrics?.totalTime || 0;

        // 完成性能跟踪
        performanceTracker.completeSession();

        // PATCH-005, 006: 安全映射题目属性，改进 ID 生成
        const validQuestions = response.data.questions.filter((q: any) =>
          q && (q.question || q.text)
        );

        if (validQuestions.length === 0) {
          throw new Error('没有有效的题目数据');
        }

        // 创建生成记录
        const generationRecord: GenerationRecord = {
          id: generateUniqueId(),
          questionType,
          difficulty,
          count: validQuestions.length,
          timestamp: Date.now(),
          questions: validQuestions.map((q: any, index: number) => ({
            id: `q_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            question: q.question || q.text,
            answer: q.answer || '',
            explanation: q.explanation || '',
            difficulty,
          })),
          processingTime,
        };

        // PATCH-003: 添加错误处理
        try {
          await generationHistoryService.saveGeneration(generationRecord);
        } catch (saveError) {
          console.error('Failed to save generation history:', saveError);
          // 保存失败不应阻止用户查看结果，但应记录错误
          Alert.alert(
            '提示',
            '题目已生成，但保存历史记录失败'
          );
        }

        // 自动导航到 GeneratedQuestionsList
        navigation.navigate('GeneratedQuestionsList' as never, {
          generationId: generationRecord.id,
          questions: generationRecord.questions,
          questionType: generationRecord.questionType,
        } as never);
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

  // Helper function for formatting bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0 || bytes < 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(k)) : 0;
    return `${(bytes / Math.pow(k, Math.max(0, i))).toFixed(2)} ${sizes[Math.max(0, Math.min(i, sizes.length - 1))]}`;
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
      <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.primary} />

      {/* 顶部工具栏 */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityLabel="返回">
          <Icon name="arrow-back" size="md" color={designSystem.colors.text.inverse} />
        </TouchableOpacity>

        <Typography variant="headlineSmall" color={designSystem.colors.text.inverse}>
          拍照上传
        </Typography>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('History')}
            style={styles.headerButton}
            accessibilityLabel="历史记录">
            <Icon name="history" size="md" color={designSystem.colors.text.inverse} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowHelp(true)}
            style={styles.headerButton}
            accessibilityLabel="帮助">
            <Icon name="help-outline" size="md" color={designSystem.colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 可滚动内容区域 */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 拍摄提示卡片 - 家长友好设计 */}
        <TipCard
          title="拍摄小贴士"
          tips={[
            '确保光线充足',
            '把题目放在桌面上',
            '平板垂直对准题目',
            '保持稳定，避免模糊',
          ]}
          icon="📷"
          style={styles.tipCard}
        />

      {/* 识别状态显示 */}
      {isRecognizing && (
        <View style={styles.recognitionStatus}>
          <ActivityIndicator size="large" color={designSystem.colors.info.default} />
          <Spacer size="md" direction="horizontal" />
          <Typography variant="body" color={designSystem.colors.text.primary}>
            正在识别题目类型...
          </Typography>
        </View>
      )}

      {error && (
        <Card variant="outlined" padding="md" style={styles.errorCard}>
          <Typography variant="headlineSmall" color={designSystem.colors.error.dark}>
            识别错误
          </Typography>
          <Spacer size="xs" />
          <Typography variant="body" color={designSystem.colors.error.dark}>
            {error}
          </Typography>
        </Card>
      )}

      {recognitionResult && (
        <Card variant="outlined" padding="md" style={styles.resultCard}>
          <Typography variant="headlineSmall" color={designSystem.colors.text.primary}>
            识别结果
          </Typography>
          <Spacer size="sm" />
          <Typography variant="body" color={designSystem.colors.text.primary}>
            题目类型: {getQuestionTypeLabel(recognitionResult.questionType)}
          </Typography>
          <Spacer size="xs" />
          <Typography variant="body" color={designSystem.colors.text.primary}>
            置信度: {(recognitionResult.confidence * 100).toFixed(1)}%
          </Typography>

          {/* Story 3-3: 知识点标签 - 支持点击导航到详细讲解 */}
          {recognitionResult.knowledgePoints ? (
            <View style={styles.knowledgePointContainer}>
              <Typography variant="body" color={designSystem.colors.text.primary}>
                知识点:
              </Typography>
              <Spacer size="xs" direction="horizontal" />
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
            <Typography variant="body" color={designSystem.colors.text.primary}>
              知识点: {recognitionResult.knowledgePoint}
            </Typography>
          )}

          {selectedDifficulty && (
            <Typography variant="body" color={designSystem.colors.text.primary}>
              选择难度: {getDifficultyLabel(selectedDifficulty)}
            </Typography>
          )}
          <Spacer size="md" />
          <Button
            variant="outline"
            size="md"
            title="不对？手动修正"
            onPress={() => setShowManualCorrection(true)}
          />
        </Card>
      )}

      {/* 生成问题加载状态 */}
      {isGeneratingQuestions && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designSystem.colors.info.default} />
          <Spacer size="md" direction="horizontal" />
          <Typography variant="body" color={designSystem.colors.info.dark}>
            正在生成题目...
          </Typography>
        </View>
      )}
      </ScrollView>

      {/* 固定在底部的相机和控制栏 */}
      <View style={styles.fixedBottomContainer}>
      {/* 相机区域或图片预览 */}
      <View style={styles.cameraSection}>
        {preselectedImage && currentImageUri ? (
          // 显示预选图片
          <View style={styles.cameraContainer}>
            <Image
              source={{uri: currentImageUri}}
              style={styles.preview}
              resizeMode="contain"
            />
            <View style={styles.imagePreviewOverlay}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => {
                  setPreselectedImage(null);
                  setCurrentImageUri('');
                  setRecognitionResult(null);
                  setError(null);
                  hasProcessedImageRef.current = false;
                }}>
                <Icon name="close" size="md" color={designSystem.colors.text.inverse} />
                <Spacer size="sm" direction="horizontal" />
                <Typography variant="body" color={designSystem.colors.text.inverse}>
                  重新选择
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // 显示相机
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
              <Icon name="crop-free" size="xl" color={designSystem.colors.text.inverse} />
              <Spacer size="xs" />
              <Typography variant="caption" color={designSystem.colors.text.inverse}>
                将题目对准框内
              </Typography>
            </View>
          </View>

          {/* 底部控制按钮 - 叠加在相机区域上 */}
          <View style={styles.cameraBottomControls}>
            {/* 左侧：相册按钮 */}
            <TouchableOpacity
              style={[styles.smallControlButton, (isTakingPicture || isRecognizing || preselectedImage) && styles.controlButtonDisabled]}
              onPress={pickImageFromGallery}
              disabled={isTakingPicture || isRecognizing || !!preselectedImage}
              activeOpacity={0.8}>
              <Icon name="photo-library" size="md" color="#FFFFFF" />
            </TouchableOpacity>

            {/* 中间：拍照按钮 */}
            {!preselectedImage && (
              <TouchableOpacity
                style={[styles.captureButton, (isTakingPicture || isRecognizing) && styles.controlButtonDisabled]}
                onPress={takePicture}
                disabled={isTakingPicture || isRecognizing}
                activeOpacity={0.8}>
                <View style={styles.captureButtonInner}>
                  <Icon name="camera-alt" size="lg" color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}

            {/* 右侧：历史记录按钮 */}
            <TouchableOpacity
              style={styles.smallControlButton}
              onPress={() => (navigation as any).navigate('History')}
              disabled={isTakingPicture || isRecognizing}
              activeOpacity={0.8}>
              <Icon name="history" size="md" color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        )}
      </View>
      </View>

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

      {/* Story 5-3: 30秒倒计时 */}
      {showProcessingProgress && performanceMetrics && (
        <View style={styles.countdownContainer}>
          <CountdownTimer
            totalTime={30}
            remainingTime={Math.max(0, 30 - performanceTracker.getElapsedTime() / 1000)}
            elapsedTime={performanceTracker.getElapsedTime() / 1000}
          />
        </View>
      )}

      {/* 处理时间过长警告 */}
      {showWarning && !showProcessingProgress && (
        <Modal visible={showWarning} transparent animationType="fade">
          <View style={styles.warningModalContainer}>
            <View style={styles.warningModalContent}>
              <Typography variant="headlineSmall" color={designSystem.colors.text.primary} align="center">
                ⚠️ 处理时间较长
              </Typography>
              <Spacer size="md" />
              <Typography variant="body" color={designSystem.colors.text.secondary} align="center">
                当前处理已超过 {WARNING_THRESHOLD / 1000} 秒，请选择：
              </Typography>
              <Spacer size="lg" />
              <View style={styles.warningButtons}>
                <TouchableOpacity
                  style={[styles.warningButton, styles.warningButtonCancel]}
                  onPress={() => {
                    setShowWarning(false);
                    performanceTracker.completeSession();
                  }}>
                  <Typography variant="body" color={designSystem.colors.text.primary}>
                    取消
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.warningButton, styles.warningButtonContinue]}
                  onPress={() => setShowWarning(false)}>
                  <Typography variant="body" color={designSystem.colors.text.inverse}>
                    继续等待
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 帮助对话框 */}
      <HelpDialog
        visible={showHelp}
        screenId="CameraScreen"
        onClose={() => setShowHelp(false)}
      />

      {/* 入门导览 */}
      <OnboardingTour
        visible={showTour}
        screenId="CameraScreen"
        onComplete={() => setShowTour(false)}
        onSkip={() => setShowTour(false)}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  // 滚动容器 - 改为flex: 1填充可用空间
  scrollContainer: {
    flex: 1,
  },
  // 拍摄提示卡片样式 - 缩小边距
  tipCard: {
    marginHorizontal: designSystem.spacing.sm,
    marginTop: designSystem.spacing.xs,
    marginBottom: designSystem.spacing.xs,
  },
  // 简化版使用说明
  miniInstructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.info.light,
    paddingVertical: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.lg,
    marginVertical: designSystem.spacing.xs,
    marginHorizontal: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
  },
  // 固定底部容器 - 不使用flex:1避免覆盖ScrollView
  fixedBottomContainer: {
    backgroundColor: designSystem.colors.surface.primary,
  },
  // 顶部工具栏 - 缩小高度
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designSystem.spacing.md,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + designSystem.spacing.xs : designSystem.spacing.sm,
    paddingBottom: designSystem.spacing.xs,
    backgroundColor: designSystem.colors.primary,
  },
  headerButton: {
    padding: designSystem.spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.xs,
  },
  // 相机区域
  cameraSection: {
    backgroundColor: designSystem.colors.surface.dark,
  },
  cameraContainer: {
    height: SCREEN_HEIGHT * 0.52,
    marginHorizontal: designSystem.spacing.sm,
    marginTop: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: designSystem.colors.surface.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  focusFrame: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    borderColor: 'rgba(255,255,255,0.8)',
    borderWidth: 2,
    borderRadius: designSystem.borderRadius.lg,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  // 底部控制按钮 - 叠加在相机区域上
  cameraBottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  smallControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    ...designSystem.shadows.md,
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 图片预览覆盖层
  imagePreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: designSystem.spacing.lg,
    paddingVertical: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.xl,
  },
  // 底部区域 - 温暖背景
  bottomSection: {
    backgroundColor: '#FAFAFA', // 温暖白色背景
    paddingHorizontal: designSystem.spacing.lg,
    paddingVertical: designSystem.spacing.sm,
    paddingBottom: designSystem.spacing.xl,
    borderTopLeftRadius: designSystem.borderRadius.xl,
    borderTopRightRadius: designSystem.borderRadius.xl,
    minHeight: SCREEN_HEIGHT * 0.15,
    ...designSystem.shadows.md,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.xs,
  },
  // 主控制按钮 - 平板友好大按钮
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.md,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 80,
    padding: designSystem.spacing.md,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  // 拍照按钮 - 更大更友好，平板适配
  cameraButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FF9800', // 温暖橙色
    justifyContent: 'center',
    alignItems: 'center',
    ...designSystem.shadows.lg,
  },
  cameraButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 相册按钮 - 更大更友好，平板适配
  galleryButton: {
    width: GALLERY_BUTTON_SIZE,
    height: GALLERY_BUTTON_SIZE,
    borderRadius: GALLERY_BUTTON_SIZE / 2,
    backgroundColor: '#42A5F5', // 淡蓝色
    justifyContent: 'center',
    alignItems: 'center',
    ...designSystem.shadows.md,
  },
  // 快速操作
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.border.light,
    paddingTop: designSystem.spacing.sm,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.xs,
  },
  // 倒计时容器
  countdownContainer: {
    position: 'absolute',
    top: 80,
    right: designSystem.spacing.lg,
    zIndex: 1000,
  },
  // 结果卡片
  resultCard: {
    marginHorizontal: designSystem.spacing.lg,
    marginTop: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.success.light,
    borderColor: designSystem.colors.success.default,
    borderWidth: 1,
  },
  knowledgePointContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: designSystem.spacing.xs,
  },
  // 识别状态
  recognitionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface.secondary,
    marginHorizontal: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginTop: designSystem.spacing.sm,
  },
  // 错误卡片
  errorCard: {
    margin: designSystem.spacing.md,
    backgroundColor: designSystem.colors.error.light,
    borderColor: designSystem.colors.error.default,
    borderWidth: 1,
  },
  // 加载状态
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.spacing.md,
  },
  // 警告模态框
  warningModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  warningModalContent: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.xl,
    width: '85%',
    maxWidth: 350,
    ...designSystem.shadows.lg,
  },
  warningButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: designSystem.spacing.md,
  },
  warningButton: {
    flex: 1,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    alignItems: 'center',
  },
  warningButtonCancel: {
    backgroundColor: designSystem.colors.surface.secondary,
  },
  warningButtonContinue: {
    backgroundColor: designSystem.colors.primary,
  },
});

export default CameraScreen;
