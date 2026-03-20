import {Question, RecognitionResult, GenerateRequest, GenerateResult, ApiResponse, User, ManualCorrection} from '../types';

// API基础配置
const API_BASE_URL = 'https://api.math-learning.com/v1';
const TIMEOUT = 30000; // 30秒超时

// 请求拦截器
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }

    throw error;
  }
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
export const recognitionApi = {
  // 上传图片并识别题目
  recognizeQuestion: (imageUri: string): Promise<ApiResponse<RecognitionResult>> => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'question.jpg',
    } as any);

    return fetch(`${API_BASE_URL}/questions/recognize`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  },

  // 识别题目类型（本地处理）
  recognizeQuestionType: async (imageUri: string): Promise<ApiResponse<RecognitionResult>> => {
    try {
      // 导入OCR服务
      const { OCRService } = await import('./ocrService');

      // 处理图像并识别题目类型
      const result = await OCRService.processImage(imageUri, {
        enhance: true,
        checkQuality: true
      });

      // 验证提取的文本
      const validation = OCRService.validateExtractedText(result.extractedText);

      if (!validation.isValid) {
        console.warn('Text validation issues:', validation.issues);
        // 在实际应用中，可能会提示用户重新拍照
      }

      const recognitionResult: RecognitionResult = {
        questionType: result.questionType,
        difficulty: this.mapConfidenceToDifficulty(result.confidence),
        confidence: result.confidence,
        knowledgePoint: this.getKnowledgePoint(result.questionType),
        extractedText: result.extractedText
      };

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

  // 根据置信度映射难度
  private mapConfidenceToDifficulty(confidence: number) {
    if (confidence >= 0.8) return 'easy';
    if (confidence >= 0.6) return 'medium';
    return 'hard';
  },

  // 获取知识点
  private getKnowledgePoint(questionType: QuestionType): string {
    const knowledgeMap = {
      [QuestionType.ADDITION]: '加法运算',
      [QuestionType.SUBTRACTION]: '减法运算',
      [QuestionType.WORD_PROBLEM]: '应用题'
    };
    return knowledgeMap[questionType] || '数学基础';
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