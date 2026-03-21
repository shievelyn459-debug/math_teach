import {Question, RecognitionResult, GenerateRequest, GenerateResult, ApiResponse, User, ManualCorrection, QuestionType, Difficulty} from '../types';
import {KnowledgePointService} from './knowledgePointService';

// API基础配置
const API_BASE_URL = 'https://api.math-learning.com/v1';
const DEFAULT_TIMEOUT = 30000; // 默认30秒超时

// 各阶段超时配置（毫秒）
export const STAGE_TIMEOUTS = {
  UPLOAD: 5000, // 5秒
  RECOGNITION: 8000, // 8秒 (包含OCR)
  KNOWLEDGE_POINT: 5000, // 5秒 (知识点识别 - Story 3-1 AC5)
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
  // 用户注册
  register: (userData: {name: string; email: string; password: string}) =>
    request<User>('/users/register', {method: 'POST', body: JSON.stringify(userData)}),

  // 用户登录
  login: (credentials: {email: string; password: string}) =>
    request<User>('/users/login', {method: 'POST', body: JSON.stringify(credentials)}),

  // 获取用户信息
  getProfile: () =>
    request<User>('/users/profile'),
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
  // 上传图片并识别题目（带重试）
  recognizeQuestion: async (imageUri: string): Promise<ApiResponse<RecognitionResult>> => {
    try {
      // 使用图片优化器压缩图片
      const { imageOptimizer } = await import('../utils/imageOptimizer');
      const optimized = await imageOptimizer.optimizeImage(imageUri);

      console.log(`[API] Uploading optimized image: ${optimized.uri}`);

      const formData = new FormData();
      formData.append('image', {
        uri: optimized.uri,
        type: 'image/jpeg',
        name: 'question.jpg',
      } as any);

      const response = await requestWithRetry<RecognitionResult>(
        '/questions/recognize',
        {
          method: 'POST',
          body: formData,
        },
        STAGE_TIMEOUTS.UPLOAD,
        {
          ...DEFAULT_RETRY_CONFIG,
          maxRetries: 2,
        }
      );

      return response;
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

  // 识别题目类型（本地处理，带超时）
  recognizeQuestionType: async (imageUri: string, onProgress?: ProgressCallback): Promise<ApiResponse<RecognitionResult>> => {
    try {
      // 报告开始
      onProgress?.('recognizing', 0);

      // 导入OCR服务
      const { OCRService } = await import('./ocrService');

      // 处理图像并识别题目类型（带超时）
      const resultPromise = OCRService.processImage(imageUri, {
        enhance: true,
        checkQuality: true
      });

      // 添加超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('识别超时')), STAGE_TIMEOUTS.RECOGNITION);
      });

      const result = await Promise.race([resultPromise, timeoutPromise]) as any;

      // 报告进度
      onProgress?.('recognizing', 50);

      // 验证提取的文本
      const validation = OCRService.validateExtractedText(result.extractedText);

      if (!validation.isValid) {
        console.warn('Text validation issues:', validation.issues);
      }

      const recognitionResult: RecognitionResult = {
        questionType: result.questionType,
        difficulty: mapConfidenceToDifficulty(result.confidence),
        confidence: result.confidence,
        knowledgePoint: getKnowledgePoint(result.questionType),
        extractedText: result.extractedText
      };

      // 识别知识点 (Story 3-1: AC 1, 5)
      // 添加独立的超时保护，确保知识点识别在5秒内完成
      const kpService = KnowledgePointService.getInstance();
      const kpPromise = kpService.recognizeKnowledgePoints(result.extractedText);
      const kpTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('知识点识别超时')), STAGE_TIMEOUTS.KNOWLEDGE_POINT);
      });

      const kpResult = await Promise.race([kpPromise, kpTimeoutPromise]) as any;
      recognitionResult.knowledgePoints = kpResult;
      // 更新knowledgePoint字段为主知识点名称
      recognitionResult.knowledgePoint = kpResult.primaryKnowledgePoint.knowledgePoint.name;

      // 报告完成
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
      const response = await request<void>('/questions/manual-correction', {
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
      const response = await request<any>('/user/preferences');
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
      const response = await request<void>('/user/preferences', {
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

  // 提交难度选择
  submitDifficultySelection: async (questionType: QuestionType, difficulty: Difficulty): Promise<ApiResponse<void>> => {
    try {
      const response = await request<void>('/questions/difficulty-selection', {
        method: 'POST',
        body: JSON.stringify({ questionType, difficulty }),
      });

      console.log('Difficulty selection submitted successfully');
      return response;
    } catch (error) {
      console.error('Failed to submit difficulty selection:', error);
      return {
        success: false,
        error: {
          code: 'DIFFICULTY_SUBMISSION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to submit difficulty selection'
        }
      };
    }
  },

  // 带难度参数生成问题（带重试和超时）
  generateQuestionsWithDifficulty: async (params: {
    questionType: QuestionType;
    difficulty: Difficulty;
    count: number;
  }, onProgress?: ProgressCallback): Promise<ApiResponse<GenerateResult>> => {
    try {
      onProgress?.('generating', 0);

      const response = await requestWithRetry<GenerateResult>(
        '/questions/generate',
        {
          method: 'POST',
          body: JSON.stringify(params),
        },
        STAGE_TIMEOUTS.GENERATION,
        {
          ...DEFAULT_RETRY_CONFIG,
          maxRetries: 2,
        },
        onProgress
      );

      onProgress?.('generating', 100);

      return response;
    } catch (error) {
      console.error('Failed to generate questions with difficulty:', error);
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
  // 生成同类型题目
  generateQuestions: (request: GenerateRequest): Promise<ApiResponse<GenerateResult>> =>
    request<GenerateResult>('/questions/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    }),

  // 获取知识点相关题目
  getQuestionsByKnowledgePoint: (knowledgePoint: string, count: number = 10) =>
    request<Question[]>(`/questions?knowledgePoint=${knowledgePoint}&count=${count}`),
};

// 题目管理API
export const questionApi = {
  // 获取题目详情
  getQuestion: (id: string) =>
    request<Question>(`/questions/${id}`),

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
    return request<Question[]>(`/questions${params.toString() ? `?${params}` : ''}`);
  },

  // 删除题目
  deleteQuestion: (id: string) =>
    request(`/questions/${id}`, {method: 'DELETE'}),
};

// 学习记录API
export const studyApi = {
  // 记录学习行为
  recordStudy: (data: {
    questionId: string;
    action: 'upload' | 'practice' | 'review';
    duration?: number;
    correct?: boolean;
  }) =>
    request('/study/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 获取学习统计
  getStatistics: () =>
    request('/study/statistics'),
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

export default {
  user: userApi,
  recognition: recognitionApi,
  generation: generationApi,
  question: questionApi,
  study: studyApi,
  export: exportApi,
};