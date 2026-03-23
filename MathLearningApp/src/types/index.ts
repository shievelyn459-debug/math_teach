// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 题目类型
export interface Question {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  type: QuestionType;
  difficulty: Difficulty;
  grade: number;
  knowledgePoint: string;
  explanation: string;
  answer: string;
  options?: string[];
  createdAt: Date;
  userId: string;
}

// 题目类型枚举
export enum QuestionType {
  ADDITION = 'addition',      // 加法
  SUBTRACTION = 'subtraction', // 减法
  WORD_PROBLEM = 'word_problem', // 应用题
}

// 难度等级
export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// 识别结果
import {KnowledgePointRecognitionResult} from './knowledgePoint';

export interface RecognitionResult {
  questionType: QuestionType;
  difficulty: Difficulty;
  confidence: number; // 识别置信度 0-1
  knowledgePoint: string;
  knowledgePoints?: KnowledgePointRecognitionResult; // 详细的知识点识别结果 (AC: 1, 6)
  extractedText: string; // 从图片中提取的文本
  correctedQuestionType?: QuestionType; // 手动纠正后的题目类型
  isCorrected?: boolean; // 是否已被手动纠正
  selectedDifficulty?: Difficulty; // 用户选择的难度级别
}

// 手动纠正记录
export interface ManualCorrection {
  id: string;
  originalType: QuestionType;
  correctedType: QuestionType;
  imageUri: string;
  timestamp: Date;
  userId?: string;
}

// 生成请求
export interface GenerateRequest {
  originalQuestionId: string;
  count: number; // 生成题目数量
  difficulty?: Difficulty;
}

// 生成结果
export interface GenerateResult {
  questions: Question[];
  totalTime: number;
}

// 学习记录
export interface StudyRecord {
  id: string;
  userId: string;
  questionId: string;
  action: 'upload' | 'practice' | 'review';
  timestamp: Date;
  duration?: number; // 学习时长（秒）
  correct?: boolean; // 是否答对
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// 导出性能跟踪类型
export {ProcessingStage, PerformanceMetrics, StageTimestamp} from '../services/performanceTracker';

// 导出知识点相关类型
export {
  KnowledgePoint,
  KnowledgePointCategory,
  KnowledgePointMatchResult,
  KnowledgePointRecognitionResult,
} from './knowledgePoint';

// 导出讲解内容相关类型
export {
  ExplanationSource,
  ExplanationSectionType,
  ExplanationFormat,
  FormatMetadata,
  Explanation,
  ExplanationSection,
  TeachingTip,
  ExplanationExample,
  ExplanationGenerationRequest,
  ExplanationGenerationResult,
  ExplanationFeedback,
  PARENT_FRIENDLY_LANGUAGE_GUIDELINES,
  CONTENT_STYLE_GUIDE,
} from './explanation';

// PDF 导出相关类型
export interface PDFMetadata {
  title: string;
  date: string;
  difficulty: Difficulty;
  filename?: string;
}

export interface PDFGenerationResult {
  filePath: string;
  pageCount: number;
  fileSize: number;
  questionCount: number;
}

export interface PDFSaveOptions {
  filename?: string;
  showPreview?: boolean;
}

// PDF 文件信息
export interface PDFFileInfo {
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

// 分享选项
export interface ShareOptions {
  title?: string;
  message?: string;
  subject?: string; // 用于邮件
  excludedActivityTypes?: string[]; // iOS: 排除某些应用
  dialogTitle?: string; // Android: 分享对话框标题
}

// 打印选项
export interface PrintOptions {
  printerName?: string; // 特定打印机
  orientation?: 'portrait' | 'landscape';
  copies?: number;
}

// 权限状态
export interface PermissionStatus {
  storage: boolean;
  write: boolean;
  allGranted: boolean;
}