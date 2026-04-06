import {
  Question,
  RecognitionResult,
  GenerateRequest,
  GenerateResult,
  ApiResponse,
  User,
  ManualCorrection,
  QuestionType,
  Difficulty,
  Child,
  ChildCreateRequest,
  ChildUpdateRequest,
  Grade,
} from '../types';
import {KnowledgePointService} from './knowledgePointService';
import {getExplanationService} from './explanationService';
import {ExplanationSource} from '../types/explanation';
import {aiService} from './ai';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Story 6-3: 导入新的MySQL版childApi
import { childApi } from './childApi';
export { childApi };

// Story 6-4: 导入StudyDataRepository（静态导入以便测试）
import { studyDataRepository as _studyDataRepository } from './mysql/StudyDataRepository';

// Story 6-4: 导入activeChildService（静态导入以便测试）
import { activeChildService as _activeChildService } from './activeChildService';

// Story 6-4: Code Review Fix - 导入mutex防止并发写入冲突
import { studyRecordMutex } from '../utils/mutex';

// Story 6-4: Code Review Fix - 导入离线队列服务
import { offlineStudyQueue } from './offlineStudyQueue';

/**
 * 类型守卫：检查API响应是否成功
 * 用于确保data字段存在
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & {data: T} {
  return response.success === true && response.data !== undefined;
}

/**
 * 类型守卫：检查API响应是否失败
 * 用于确保error字段存在
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiResponse<T> & {error: NonNullable<ApiResponse<T>['error']>} {
  return response.success === false && response.error !== undefined;
}

/**
 * 从成功响应中获取数据
 * 如果响应不成功，抛出错误
 */
export function getApiDataOrThrow<T>(response: ApiResponse<T>): T {
  if (isApiSuccess(response)) {
    return response.data;
  }
  throw new Error(response.error?.message || 'API request failed');
}

// API基础配置
const API_BASE_URL = 'https://api.math-learning.com/v1';
const DEFAULT_TIMEOUT = 30000; // 默认30秒超时

/**
 * 将图片URI转换为base64格式
 * 使用react-native-fs以支持React Native文件系统
 */
async function uriToBase64(uri: string): Promise<string> {
  try {
    console.log('[uriToBase64] Converting URI to base64:', uri);

    // 使用react-native-fs读取文件
    const RNFS = require('react-native-fs');

    // 处理file://前缀
    const filePath = uri.replace('file://', '');

    // 检查文件是否存在
    const exists = await RNFS.exists(filePath);
    console.log('[uriToBase64] File exists:', exists);
    if (!exists) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // 读取文件并转换为base64
    const base64 = await RNFS.readFile(filePath, 'base64');

    console.log('[uriToBase64] Base64 string length:', base64.length);
    console.log('[uriToBase64] Base64 preview (first 100 chars):', base64.substring(0, 100));

    // 确定图片类型（默认jpeg）
    let imageType = 'jpeg';
    if (uri.includes('.png')) {
      imageType = 'png';
    } else if (uri.includes('.gif')) {
      imageType = 'gif';
    } else if (uri.includes('.webp')) {
      imageType = 'webp';
    }

    // 构建data URL
    const dataUrl = `data:image/${imageType};base64,${base64}`;
    console.log('[uriToBase64] Conversion successful, data URL length:', dataUrl.length);

    return dataUrl;
  } catch (error) {
    console.error('[uriToBase64] Failed to convert URI to base64:', error);
    throw new Error(`Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Story 1-5: 孩子管理API超时配置
const CHILD_API_TIMEOUT = 3000; // 3秒超时 (AC9)

// 各阶段超时配置（毫秒）
export const STAGE_TIMEOUTS = {
  UPLOAD: 5000, // 5秒
  RECOGNITION: 8000, // 8秒 (包含OCR)
  KNOWLEDGE_POINT: 5000, // 5秒 (知识点识别 - Story 3-1 AC5)
  EXPLANATION: 3000, // 3秒 (讲解生成 - Story 3-2 AC5)
  GENERATION: 12000, // 12秒
};

// 重试配置
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  backoffMultiplier: 2,
};

// 进度回调类型
export type ProgressCallback = (stage: string, progress: number) => void;

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 计算重试延迟（指数退避）
 */
const calculateRetryDelay = (
  attempt: number,
  config: RetryConfig
): number => {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
};

/**
 * 带重试的请求函数
 */
const requestWithRetry = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  onProgress?: ProgressCallback
): Promise<ApiResponse<T>> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[API] Retry attempt ${attempt}/${retryConfig.maxRetries} for ${endpoint}`);

        // 指数退避延迟
        const retryDelay = calculateRetryDelay(attempt - 1, retryConfig);
        await delay(retryDelay);

        // 报告进度
        onProgress?.('retrying', (attempt / retryConfig.maxRetries) * 100);
      }

      const result = await requestWithTimeout<T>(endpoint, options, timeout, onProgress);

      // 成功后返回结果
      return result;
    } catch (error) {
      lastError = error as Error;

      // 检查是否是可重试的错误
      const isRetriable = isRetriableError(error);

      if (!isRetriable || attempt === retryConfig.maxRetries) {
        // 不可重试或已达到最大重试次数
        break;
      }

      console.warn(`[API] Request failed (attempt ${attempt + 1}):`, error);
    }
  }

  // 所有重试都失败
  throw lastError || new Error('请求失败');
};

/**
 * 带超时的请求函数
 */
const requestWithTimeout = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number,
  onProgress?: ProgressCallback
): Promise<ApiResponse<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 报告开始
    onProgress?.('started', 0);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // 报告完成
    onProgress?.('completed', 100);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }

    throw error;
  }
};

/**
 * 敏感字段名称列表（用于日志过滤）
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'token',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
  'authToken',
  'authorization',
];

/**
 * 递归过滤对象中的敏感字段
 * 返回一个新对象，敏感字段值被替换为 [REDACTED]
 */
function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * 安全的错误日志
 * 自动过滤敏感信息后再记录
 */
function safeLogError(context: string, error: unknown): void {
  let logData: any;

  if (error instanceof Error) {
    logData = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  } else {
    logData = error;
  }

  const redacted = redactSensitiveData(logData);
  console.error(`[${context}]`, redacted);
}

/**
 * 判断错误是否可重试
 */
const isRetriableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  // 网络错误可重试
  if (error.message.includes('Network request failed')) {
    return true;
  }

  // 超时可重试
  if (error.message.includes('timeout') || error.message.includes('超时')) {
    return true;
  }

  // 5xx 服务器错误可重试
  if (error.message.includes('HTTP error! status: 5')) {
    return true;
  }

  // 429 Too Many Requests 可重试
  if (error.message.includes('HTTP error! status: 429')) {
    return true;
  }

  return false;
};

// 用户相关API
export const userApi = {
  /**
   * 用户注册
   * 创建新用户账户
   * @param userData 用户注册信息（姓名、邮箱、密码）
   * @returns 注册结果，包含用户信息
   */
  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<User>> => {
    try {
      return await requestWithRetry<User>(
        '/users/register',
        {
          method: 'POST',
          body: JSON.stringify(userData),
        },
        5000, // 5秒超时（AC6: 注册过程在5秒内完成）
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        }
      );
    } catch (error) {
      safeLogError('userApi', error);
      const errorMessage = error instanceof Error ? error.message : '注册失败，请稍后重试';

      // 安全注意：不区分"邮箱已注册"和其他错误，防止邮箱枚举攻击
      // 具体的错误类型只在日志中记录，不对用户暴露
      if (errorMessage.includes('已注册') || errorMessage.includes('already exists')) {
        // 在日志中记录具体类型（用于调试）
        console.warn('[userApi] Email already exists (not shown to user for security)');
      }

      // 返回通用错误消息，不泄露邮箱是否存在
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: '注册失败，请检查输入信息后重试',
        },
      };
    }
  },

  /**
   * 用户登录
   * 使用邮箱和密码登录
   * @param credentials 登录凭证（邮箱、密码）
   * @returns 登录结果，包含用户信息
   */
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<User>> => {
    try {
      return await requestWithRetry<User>(
        '/users/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        },
        5000,
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        }
      );
    } catch (error) {
      safeLogError('userApi', error);
      const errorMessage = error instanceof Error ? error.message : '登录失败，请稍后重试';

      // 安全注意：不区分"用户不存在"和"密码错误"，防止用户枚举攻击
      // 具体错误类型只在日志中记录
      if (errorMessage.includes('密码') || errorMessage.includes('password')) {
        console.warn('[userApi] Invalid password (not shown to user for security)');
      } else if (errorMessage.includes('不存在') || errorMessage.includes('not found')) {
        console.warn('[userApi] User not found (not shown to user for security)');
      }

      // 返回通用错误消息
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: '邮箱或密码错误，请检查后重试',
        },
      };
    }
  },

  /**
   * 获取用户信息 (Story 1-4)
   * 获取当前登录用户的详细资料
   * @returns 用户信息
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      return await requestWithRetry<User>(
        '/users/profile',
        {},
        5000, // 5秒超时
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        }
      );
    } catch (error) {
      safeLogError('userApi', error);
      return {
        success: false,
        error: {
          code: 'GET_PROFILE_ERROR',
          message: '获取用户信息失败',
        },
      };
    }
  },

  /**
   * 更新用户资料 (Story 1-4)
   * @param updates 要更新的用户信息 (name, email, phone, avatar)
   * @returns 更新后的用户信息
   */
  updateProfile: async (updates: Partial<{
    name: string;
    email: string;
    phone: string;
    avatar: string;
  }>): Promise<ApiResponse<User>> => {
    try {
      // Story 1-4 AC9: 3秒内完成更新
      return await requestWithRetry<User>(
        '/users/profile',
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        },
        3000, // 3秒超时
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 3000,
          backoffMultiplier: 2,
        }
      );
    } catch (error) {
      safeLogError('userApi', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PROFILE_ERROR',
          message: '更新资料失败',
        },
      };
    }
  },
};

// 题目识别API

// 根据置信度映射难度（独立辅助函数）
function mapConfidenceToDifficulty(confidence: number): 'easy' | 'medium' | 'hard' {
  if (confidence >= 0.8) return 'easy';
  if (confidence >= 0.6) return 'medium';
  return 'hard';
}

// 获取知识点（独立辅助函数）
function getKnowledgePoint(questionType: QuestionType): string {
  const knowledgeMap: Record<QuestionType, string> = {
    [QuestionType.ADDITION]: '加法运算',
    [QuestionType.SUBTRACTION]: '减法运算',
    [QuestionType.WORD_PROBLEM]: '应用题'
  };
  return knowledgeMap[questionType] || '数学基础';
}

export const recognitionApi = {
  /**
   * 上传图片并识别题目（使用百度OCR）
   */
  recognizeQuestion: async (imageUri: string): Promise<ApiResponse<RecognitionResult>> => {
    try {
      // 使用图片优化器压缩图片
      const { imageOptimizer } = await import('../utils/imageOptimizer');
      const optimized = await imageOptimizer.optimizeImage(imageUri, undefined, true);

      console.log(`[API] Optimized image for OCR: ${optimized.uri}`);

      // 转换为base64
      const base64Data = await uriToBase64(optimized.uri);

      // 使用AI服务进行OCR识别
      const ocrResult = await aiService.recognizeQuestion(base64Data);

      // 获取知识点
      const kpService = KnowledgePointService.getInstance();
      const kpResult = await kpService.recognizeKnowledgePoints(ocrResult.extractedText);

      const recognitionResult: RecognitionResult = {
        questionType: ocrResult.questionType as QuestionType,
        difficulty: mapConfidenceToDifficulty(ocrResult.confidence),
        confidence: ocrResult.confidence,
        knowledgePoint: kpResult.primaryKnowledgePoint.knowledgePoint.name,
        knowledgePoints: kpResult,
        extractedText: ocrResult.extractedText
      };

      return {
        success: true,
        data: recognitionResult
      };
    } catch (error) {
      console.error('[API] Recognize question failed:', error);
      return {
        success: false,
        error: {
          code: 'RECOGNITION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to recognize question',
        },
      };
    }
  },

  /**
   * 识别题目类型（使用百度OCR + 知识点识别）
   */
  recognizeQuestionType: async (imageUri: string, onProgress?: ProgressCallback): Promise<ApiResponse<RecognitionResult>> => {
    try {
      onProgress?.('recognizing', 0);

      // 使用图片优化器压缩图片
      const { imageOptimizer } = await import('../utils/imageOptimizer');
      const optimized = await imageOptimizer.optimizeImage(imageUri, undefined, true);

      onProgress?.('recognizing', 20);

      // 转换为base64
      const base64Data = await uriToBase64(optimized.uri);

      // 使用AI服务进行OCR识别
      const ocrResult = await aiService.recognizeQuestion(base64Data);

      onProgress?.('recognizing', 60);

      // 识别知识点
      const kpService = KnowledgePointService.getInstance();
      const kpPromise = kpService.recognizeKnowledgePoints(ocrResult.extractedText);
      const kpTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('知识点识别超时')), STAGE_TIMEOUTS.KNOWLEDGE_POINT);
      });
      const kpResult = await Promise.race([kpPromise, kpTimeoutPromise]) as any;

      const recognitionResult: RecognitionResult = {
        questionType: ocrResult.questionType as QuestionType,
        difficulty: mapConfidenceToDifficulty(ocrResult.confidence),
        confidence: ocrResult.confidence,
        knowledgePoint: kpResult.primaryKnowledgePoint.knowledgePoint.name,
        knowledgePoints: kpResult,
        extractedText: ocrResult.extractedText
      };

      onProgress?.('recognizing', 100);

      return {
        success: true,
        data: recognitionResult
      };
    } catch (error) {
      console.error('Question type recognition failed:', error);
      return {
        success: false,
        error: {
          code: 'RECOGNITION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to recognize question type'
        }
      };
    }
  },

  // 提交手动纠正
  submitManualCorrection: async (correction: ManualCorrection): Promise<ApiResponse<void>> => {
    try {
      const response = await requestWithRetry<void>('/questions/manual-correction', {
        method: 'POST',
        body: JSON.stringify(correction),
      });

      console.log('Manual correction submitted successfully');
      return response;
    } catch (error) {
      console.error('Failed to submit manual correction:', error);
      return {
        success: false,
        error: {
          code: 'CORRECTION_SUBMISSION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to submit manual correction'
        }
      };
    }
  },

  // 获取用户偏好
  getUserPreferences: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await requestWithRetry<any>('/user/preferences');
      return response;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        success: false,
        error: {
          code: 'PREFERENCES_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get user preferences'
        }
      };
    }
  },

  // 更新用户偏好
  updateUserPreferences: async (preferences: any): Promise<ApiResponse<void>> => {
    try {
      const response = await requestWithRetry<void>('/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });

      return response;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      return {
        success: false,
        error: {
          code: 'PREFERENCES_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update user preferences'
        }
      };
    }
  },

  // 提交难度选择（本地记录，后端不可用时静默处理）
  submitDifficultySelection: async (questionType: QuestionType, difficulty: Difficulty): Promise<ApiResponse<void>> => {
    try {
      console.log('[recognitionApi] Difficulty selection recorded locally:', questionType, difficulty);
      // 后端API不可用，仅本地记录（preferencesService已在CameraScreen中调用）
      return { success: true, data: undefined };
    } catch (error) {
      console.warn('[recognitionApi] Difficulty selection local record failed:', error);
      return { success: true, data: undefined };
    }
  },

  // 带难度参数生成问题（使用DeepSeek AI服务，绕过不可用的后端API）
  generateQuestionsWithDifficulty: async (params: {
    questionType: QuestionType;
    difficulty: Difficulty;
    count: number;
  }, onProgress?: ProgressCallback): Promise<ApiResponse<GenerateResult>> => {
    try {
      onProgress?.('generating', 0);

      // 获取活跃孩子的年级
      const { activeChildService } = await import('./activeChildService');
      await activeChildService.waitForInitialization();
      const activeChild = activeChildService.getActiveChild();
      const grade = activeChild?.grade || Grade.GRADE_1;

      // 直接使用AI服务生成题目（通过原生HTTP模块调用DeepSeek）
      const generatedQuestions = await aiService.generateQuestions(
        params.questionType,
        params.difficulty,
        params.count,
        grade
      );

      onProgress?.('generating', 80);

      // 转换为Question格式（兼容CameraScreen的q.question字段）
      const questions: any[] = generatedQuestions.map((q, index) => ({
        id: `generated_${Date.now()}_${index}`,
        title: `题目 ${index + 1}`,
        content: q.question,
        question: q.question,
        type: params.questionType,
        difficulty: params.difficulty,
        grade: parseInt(grade) || 1,
        knowledgePoint: getKnowledgePoint(params.questionType),
        explanation: q.explanation,
        answer: q.answer,
        createdAt: new Date(),
        userId: 'local',
      }));

      onProgress?.('generating', 100);

      return {
        success: true,
        data: {
          questions,
          totalTime: 0,
        },
      };
    } catch (error) {
      console.error('[recognitionApi] Failed to generate questions with difficulty:', error);
      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate questions'
        }
      };
    }
  }
};

// 题目生成API
export const generationApi = {
  /**
   * 生成同类型题目（使用DeepSeek）
   */
  generateQuestions: async (request: GenerateRequest): Promise<ApiResponse<GenerateResult>> => {
    try {
      console.log('[generationApi] Generating questions with request:', request);

      // 获取活跃孩子的年级
      const { activeChildService } = await import('./activeChildService');
      await activeChildService.waitForInitialization();
      const activeChild = activeChildService.getActiveChild();
      const grade = activeChild?.grade || Grade.GRADE_1;

      // 使用AI服务生成题目
      // 默认生成5道题，如果没有指定数量
      const count = request.count || 5;
      const difficulty = request.difficulty || Difficulty.MEDIUM;

      // 假设题目类型来自某个存储或配置
      // 这里使用默认值，实际应从request或其他地方获取
      const questionType = QuestionType.ADDITION; // 默认值

      const generatedQuestions = await aiService.generateQuestions(
        questionType,
        difficulty,
        count,
        grade
      );

      // 转换为Question格式
      const questions: Question[] = generatedQuestions.map((q, index) => ({
        id: `generated_${Date.now()}_${index}`,
        title: `题目 ${index + 1}`,
        content: q.question,
        type: questionType,
        difficulty: difficulty,
        grade: parseInt(grade) || 1,
        knowledgePoint: getKnowledgePoint(questionType),
        explanation: q.explanation,
        answer: q.answer,
        createdAt: new Date(),
        userId: 'local', // 本地生成的题目
      }));

      return {
        success: true,
        data: {
          questions,
          totalTime: 0, // 本地生成，无网络时间
        },
      };
    } catch (error) {
      console.error('[generationApi] Failed to generate questions:', error);
      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate questions',
        },
      };
    }
  },

  /**
   * 获取知识点相关题目（使用DeepSeek生成）
   */
  getQuestionsByKnowledgePoint: async (knowledgePoint: string, count: number = 10) => {
    // 使用AI服务生成相关题目
    try {
      const { activeChildService } = await import('./activeChildService');
      await activeChildService.waitForInitialization();
      const activeChild = activeChildService.getActiveChild();
      const grade = activeChild?.grade || Grade.GRADE_1;

      // 根据知识点判断题目类型
      let questionType = QuestionType.ADDITION;
      if (knowledgePoint.includes('减')) {
        questionType = QuestionType.SUBTRACTION;
      } else if (knowledgePoint.includes('应用') || knowledgePoint.includes('问题')) {
        questionType = QuestionType.WORD_PROBLEM;
      }

      const generatedQuestions = await aiService.generateQuestions(
        questionType,
        Difficulty.MEDIUM,
        count,
        grade
      );

      const questions: Question[] = generatedQuestions.map((q, index) => ({
        id: `kp_${Date.now()}_${index}`,
        title: `题目 ${index + 1}`,
        content: q.question,
        type: questionType,
        difficulty: Difficulty.MEDIUM,
        grade: parseInt(grade) || 1,
        knowledgePoint: knowledgePoint,
        explanation: q.explanation,
        answer: q.answer,
        createdAt: new Date(),
        userId: 'local',
      }));

      return {
        success: true,
        data: questions,
      };
    } catch (error) {
      console.error('[generationApi] Failed to get questions by knowledge point:', error);
      return {
        success: false,
        error: {
          code: 'GET_QUESTIONS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get questions',
        },
      };
    }
  },
};

// 题目管理API
export const questionApi = {
  // 获取题目详情
  getQuestion: (id: string) =>
    requestWithRetry<Question>(`/questions/${id}`),

  // 获取题目列表
  getQuestions: (filters?: {
    type?: string;
    difficulty?: string;
    grade?: number;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return requestWithRetry<Question[]>(`/questions${params.toString() ? `?${params}` : ''}`);
  },

  // 删除题目
  deleteQuestion: (id: string) =>
    requestWithRetry(`/questions/${id}`, {method: 'DELETE'}),
};

// 学习记录API（Story 6-4: MySQL主存储 + AsyncStorage缓存版本）
export const studyApi = {
  /**
   * 记录学习行为（MySQL主存储 + AsyncStorage缓存）
   *
   * Story 6-4 AC2: studyApi集成MySQL
   * - MySQL主存储：保证数据持久化和多设备同步
   * - AsyncStorage缓存：离线降级和快速访问
   * - 双模式架构：MySQL不可用时降级到AsyncStorage
   *
   * Code Review Fixes:
   * - 使用mutex防止并发写入导致的竞态条件
   * - JSON.parse错误处理防止应用崩溃
   * - userId空值验证
   * - 返回syncStatus指示数据是否已同步到MySQL
   */
  recordStudy: async (data: {
    questionId: string;
    action: 'upload' | 'practice' | 'review';
    duration?: number;
    correct?: boolean;
    questionType?: string;
    difficulty?: string;
  }) => {
    // Code Review Fix: 使用mutex防止并发写入竞态条件
    return studyRecordMutex.runExclusive(async () => {
      try {
        // 获取活跃孩子ID
        await _activeChildService.waitForInitialization();
        const activeChildId = _activeChildService.getActiveChildId();

        if (!activeChildId) {
          return {
            success: false,
            error: {
              code: 'NO_ACTIVE_CHILD',
              message: '请先选择一个孩子',
            },
          };
        }

        // 获取当前用户
        const userResponse = await userApi.getProfile();
        if (!userResponse.success || !userResponse.data) {
          return {
            success: false,
            error: {
              code: 'NO_USER',
              message: '用户未登录',
            },
          };
        }

        // Code Review Fix: userId空值验证
        const userId = userResponse.data?.id;
        if (!userId) {
          return {
            success: false,
            error: {
              code: 'INVALID_USER_ID',
              message: '无效的用户ID',
            },
          };
        }

        const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Story 6-4: 尝试写入MySQL（双模式架构）
        let mysqlSuccess = false;
        try {
          await _studyDataRepository.create({
            recordId,
            childId: activeChildId,
            parentId: userId,
            questionId: data.questionId,
            action: data.action,
            duration: data.duration,
            correct: data.correct,
            questionType: data.questionType,
            difficulty: data.difficulty,
          });
          mysqlSuccess = true;
          console.log('[studyApi] Record saved to MySQL:', recordId);
        } catch (mysqlError) {
          console.warn('[studyApi] MySQL unavailable, enqueuing for later sync:', mysqlError);
          // Code Review Fix: 将记录加入离线队列
          try {
            await offlineStudyQueue.enqueue({
              recordId,
              childId: activeChildId,
              parentId: userId,
              questionId: data.questionId,
              action: data.action,
              duration: data.duration,
              correct: data.correct,
              questionType: data.questionType,
              difficulty: data.difficulty,
            });
          } catch (queueError) {
            console.error('[studyApi] Failed to enqueue record:', queueError);
          }
        }

        // 更新AsyncStorage缓存（无论MySQL是否成功）
        const storageKey = `@study_records_${activeChildId}`;
        const existingData = await AsyncStorage.getItem(storageKey);

        // Code Review Fix: JSON.parse错误处理
        let records: any[] = [];
        if (existingData) {
          try {
            records = JSON.parse(existingData);
          } catch (parseError) {
            console.warn('[studyApi] Corrupted cache data, resetting:', parseError);
            records = [];
          }
        }

        const newRecord = {
          id: recordId,
          childId: activeChildId,
          userId,
          questionId: data.questionId,
          action: data.action,
          duration: data.duration,
          correct: data.correct,
          questionType: data.questionType,
          difficulty: data.difficulty,
          timestamp: new Date().toISOString(),
          mysqlSynced: mysqlSuccess, // 标记是否已同步到MySQL
        };

        records.push(newRecord);
        // 限制缓存大小
        if (records.length > 1000) {
          records.splice(0, records.length - 1000);
        }

        await AsyncStorage.setItem(storageKey, JSON.stringify(records));

        // Code Review Fix: 返回syncStatus状态，不要在MySQL失败时返回success
        if (!mysqlSuccess) {
          return {
            success: false,
            error: {
              code: 'MYSQL_UNAVAILABLE',
              message: '数据已缓存本地，但暂时无法同步到服务器。将在网络恢复后自动同步。',
            },
            data: {
              syncStatus: 'LOCAL_ONLY',
              recordId,
            },
          };
        }

        return {
          success: true,
          data: {
            syncStatus: 'SYNCED',
            recordId,
          },
        };
      } catch (error) {
        console.error('[studyApi] Failed to record study:', error);
        return {
          success: false,
          error: {
            code: 'RECORD_STUDY_ERROR',
            message: '记录学习行为失败',
          },
        };
      }
    });
  },

  /**
   * 获取学习统计（MySQL统计 + 缓存优化）
   *
   * Story 6-4 AC2: studyApi集成MySQL
   * - 优先从MySQL获取统计数据（准确且完整）
   * - MySQL不可用时从AsyncStorage缓存获取
   * - 获取最近7天活动记录
   *
   * Code Review Fixes:
   * - JSON.parse错误处理
   * - 时区规范化（使用UTC）
   * - 修复AsyncStorage模式下的averageDuration未定义问题
   */
  getStatistics: async () => {
    try {
      // 获取活跃孩子ID
      await _activeChildService.waitForInitialization();
      const activeChildId = _activeChildService.getActiveChildId();

      if (!activeChildId) {
        return {
          success: false,
          error: {
            code: 'NO_ACTIVE_CHILD',
            message: '请先选择一个孩子',
          },
        };
      }

      // Story 6-4: 尝试从MySQL获取统计（双模式架构）
      let statsFromMySQL = false;
      let stats = {
        totalQuestions: 0,
        correctCount: 0,
        uploadCount: 0,
        practiceCount: 0,
        reviewCount: 0,
        accuracy: 0,
        averageDuration: 0,
      };

      try {
        stats = await _studyDataRepository.getStatistics(activeChildId);
        statsFromMySQL = true;
        console.log('[studyApi] Statistics from MySQL');
      } catch (mysqlError) {
        console.warn('[studyApi] MySQL unavailable, using AsyncStorage cache:', mysqlError);
      }

      // 如果MySQL不可用，从AsyncStorage获取统计
      if (!statsFromMySQL) {
        const storageKey = `@study_records_${activeChildId}`;
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          // Code Review Fix: JSON.parse错误处理
          let records: any[] = [];
          try {
            records = JSON.parse(data);
          } catch (parseError) {
            console.warn('[studyApi] Corrupted cache data, resetting:', parseError);
            records = [];
          }

          const uploadRecords = records.filter((r: any) => r.action === 'upload');
          const practiceRecords = records.filter((r: any) => r.action === 'practice');
          const reviewRecords = records.filter((r: any) => r.action === 'review');

          const correctRecords = practiceRecords.filter((r: any) => r.correct === true);
          const totalPracticeRecords = practiceRecords.length;

          const accuracy = totalPracticeRecords > 0
            ? (correctRecords.length / totalPracticeRecords)
            : 0;

          // Code Review Fix: 只计算练习记录的平均时长
          const totalDuration = practiceRecords.reduce((sum: number, r: any) => sum + (r.duration || 0), 0);
          const averageDuration = totalPracticeRecords > 0
            ? totalDuration / totalPracticeRecords
            : 0;

          stats = {
            totalQuestions: records.length,
            correctCount: correctRecords.length,
            uploadCount: uploadRecords.length,
            practiceCount: practiceRecords.length,
            reviewCount: reviewRecords.length,
            accuracy,
            averageDuration,
          };
        }
      }

      // 获取最近活动（优先MySQL，降级AsyncStorage）
      let recentActivity: any[] = [];
      // Code Review Fix: 时区规范化 - 使用UTC时间
      const now = new Date();
      const sevenDaysAgo = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 7
      ));
      const utcNow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));

      try {
        if (statsFromMySQL) {
          const recentRecords = await _studyDataRepository.findByTimeRange(
            activeChildId,
            sevenDaysAgo,
            utcNow
          );
          recentActivity = recentRecords.slice(0, 10).map(r => ({
            id: r.recordId,
            questionId: r.questionId,
            action: r.action,
            duration: r.duration,
            correct: r.correct,
            timestamp: r.timestamp.toISOString(),
          }));
        }
      } catch (mysqlError) {
        console.warn('[studyApi] Failed to get recent activity from MySQL:', mysqlError);
      }

      // 如果MySQL失败或不可用，从AsyncStorage获取最近活动
      if (recentActivity.length === 0) {
        const storageKey = `@study_records_${activeChildId}`;
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          // Code Review Fix: JSON.parse错误处理
          let records: any[] = [];
          try {
            records = JSON.parse(data);
          } catch (parseError) {
            console.warn('[studyApi] Corrupted cache data, resetting:', parseError);
            records = [];
          }

          recentActivity = records
            .filter((r: any) => new Date(r.timestamp) >= sevenDaysAgo)
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
        }
      }

      return {
        success: true,
        data: {
          ...stats,
          accuracy: Math.round(stats.accuracy * 10000) / 100, // 转换为百分比
          averageDuration: Math.round(stats.averageDuration),
          recentActivity,
        },
      };
    } catch (error) {
      console.error('[studyApi] Failed to get statistics:', error);
      return {
        success: false,
        error: {
          code: 'GET_STATISTICS_ERROR',
          message: '获取学习统计失败',
        },
      };
    }
  },

  /**
   * 同步离线队列中的记录到MySQL
   *
   * Story 6-4 Code Review Fix: 离线队列机制
   */
  syncQueue: async () => {
    try {
      const result = await offlineStudyQueue.syncQueue();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[studyApi] Failed to sync queue:', error);
      return {
        success: false,
        error: {
          code: 'SYNC_QUEUE_ERROR',
          message: '同步队列失败',
        },
      };
    }
  },

  /**
   * 获取离线队列大小
   *
   * Story 6-4 Code Review Fix: 离线队列机制
   */
  getQueueSize: async () => {
    try {
      const size = await offlineStudyQueue.getQueueSize();
      return {
        success: true,
        data: { size },
      };
    } catch (error) {
      console.error('[studyApi] Failed to get queue size:', error);
      return {
        success: false,
        error: {
          code: 'GET_QUEUE_SIZE_ERROR',
          message: '获取队列大小失败',
        },
      };
    }
  },
};

// 导出API
export const exportApi = {
  // 导出题目为PDF
  exportToPDF: (questionIds: string[], filename?: string) => {
    const params = new URLSearchParams({
      ids: questionIds.join(','),
    });
    if (filename) {
      params.append('filename', filename);
    }
    return `${API_BASE_URL}/export/pdf?${params}`;
  },
};

// 密码重置API (Story 1-3)
export const passwordResetApi = {
  /**
   * 请求密码重置
   * AC1: 用户可以从登录屏幕通过提供注册邮箱请求重置
   * AC2: 系统验证邮箱并发送重置链接
   * AC3: 无论邮箱是否存在都显示相同消息（防止邮箱枚举）
   * AC8: 邮件发送在5秒内完成
   */
  requestReset: async (data: {email: string; token: string}): Promise<ApiResponse<{success: boolean}>> => {
    try {
      return await requestWithRetry<{success: boolean}>(
        '/auth/password-reset/request',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        5000, // 5秒超时（AC8: 邮件发送在5秒内完成）
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        }
      );
    } catch (error) {
      safeLogError('passwordResetApi', error);

      // AC3: 无论邮箱是否存在，都返回相同的成功消息以防止邮箱枚举
      // 在实际错误情况下，我们仍然返回成功消息
      // 但会在日志中记录实际错误用于调试
      console.warn('[passwordResetApi] Request reset error (hidden from user for security):', error);

      return {
        success: true,
        data: {success: true},
        message: '如果该邮箱已注册，您将收到密码重置链接',
      };
    }
  },

  /**
   * 确认密码重置
   * AC4: 重置链接1小时后过期
   * AC5: 用户可以使用重置链接/令牌设置新密码
   * AC6: 新密码必须符合安全要求（8+字符，字母+数字）
   * AC7: 成功重置后，用户可以使用新密码登录
   * AC8: 密码更新在3秒内完成
   */
  confirmReset: async (data: {token: string; newPassword: string}): Promise<ApiResponse<{success: boolean}>> => {
    try {
      return await requestWithRetry<{success: boolean}>(
        '/auth/password-reset/confirm',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        3000, // 3秒超时（AC8: 密码更新在3秒内完成）
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 3000,
          backoffMultiplier: 2,
        }
      );
    } catch (error) {
      safeLogError('passwordResetApi', error);
      return {
        success: false,
        error: {
          code: 'RESET_CONFIRM_FAILED',
          message: '密码重置失败，请重新申请重置链接',
        },
      };
    }
  },
};

// 知识点讲解API (Story 3-2)
export const explanationApi = {
  /**
   * 生成知识点讲解
   * @param knowledgePointId 知识点ID
   * @param knowledgePointName 知识点名称
   * @param grade 年级
   * @param onProgress 进度回调
   */
  generateExplanation: async (
    knowledgePointId: string,
    knowledgePointName: string,
    grade: string = '一年级',
    onProgress?: ProgressCallback
  ) => {
    try {
      onProgress?.('generating', 0);

      const explanationService = getExplanationService();

      // 添加超时保护（AC5: 3秒内完成）
      const explanationPromise = explanationService.generateExplanation({
        knowledgePointId,
        knowledgePointName,
        grade,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('讲解生成超时')),
          STAGE_TIMEOUTS.EXPLANATION
        );
      });

      const result = await Promise.race([explanationPromise, timeoutPromise]) as any;

      onProgress?.('generating', 100);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[API] Explanation generation failed:', error);
      return {
        success: false,
        error: {
          code: 'EXPLANATION_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate explanation',
        },
      };
    }
  },

  /**
   * 提交讲解反馈
   * @param feedback 反馈数据
   */
  submitFeedback: async (feedback: {
    explanationId: string;
    rating: number;
    helpful: boolean;
    easyToUnderstand: boolean;
    appropriateForChild: boolean;
    comments?: string;
  }) => {
    try {
      const explanationService = getExplanationService();
      const result = await explanationService.submitFeedback({
        ...feedback,
        timestamp: new Date(),
      });

      if (result.success) {
        return {
          success: true,
          data: {message: '反馈已提交'},
        };
      } else {
        return {
          success: false,
          error: {
            code: 'FEEDBACK_SUBMISSION_FAILED',
            message: result.message || 'Failed to submit feedback',
          },
        };
      }
    } catch (error) {
      console.error('[API] Feedback submission failed:', error);
      return {
        success: false,
        error: {
          code: 'FEEDBACK_SUBMISSION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to submit feedback',
        },
      };
    }
  },

  /**
   * 获取讲解的反馈统计
   * @param explanationId 讲解ID
   */
  getFeedbackStats: async (explanationId: string) => {
    try {
      const explanationService = getExplanationService();
      const stats = explanationService.getFeedbackStats(explanationId);

      if (stats) {
        return {
          success: true,
          data: stats,
        };
      } else {
        return {
          success: false,
          error: {
            code: 'STATS_NOT_FOUND',
            message: 'Feedback stats not found',
          },
        };
      }
    } catch (error) {
      console.error('[API] Get feedback stats failed:', error);
      return {
        success: false,
        error: {
          code: 'STATS_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch feedback stats',
        },
      };
    }
  },
};

// Export internal testing utilities for security testing
export const __testing__ = {
  redactSensitiveData,
  safeLogError,
  requestWithRetry,
};

export default {
  user: userApi,
  recognition: recognitionApi,
  generation: generationApi,
  question: questionApi,
  study: studyApi,
  export: exportApi,
  explanation: explanationApi,
  passwordReset: passwordResetApi,
  child: childApi,
};