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
} from '../types';
import {KnowledgePointService} from './knowledgePointService';
import {getExplanationService} from './explanationService';
import {ExplanationSource} from '../types/explanation';

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
    const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field));

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

export default {
  user: userApi,
  recognition: recognitionApi,
  generation: generationApi,
  question: questionApi,
  study: studyApi,
  export: exportApi,
  explanation: explanationApi,
  passwordReset: passwordResetApi,
};