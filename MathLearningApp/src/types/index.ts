// Story 1-5: Grade枚举 - 小学年级（1-6年级）
export enum Grade {
  GRADE_1 = '1',
  GRADE_2 = '2',
  GRADE_3 = '3',
  GRADE_4 = '4',
  GRADE_5 = '5',
  GRADE_6 = '6',
}

// Story 1-5: 孩子信息接口
export interface Child {
  id: string;
  parentId: string;
  name: string;
  grade: Grade;
  birthday?: Date; // 可选字段
  avatar?: string; // 可选字段
  createdAt: Date;
  updatedAt: Date;
}

// Story 1-5: 孩子创建请求
export interface ChildCreateRequest {
  name: string;
  grade: Grade;
  birthday?: Date;
  avatar?: string;
}

// Story 1-5: 孩子更新请求
export interface ChildUpdateRequest {
  name?: string;
  grade?: Grade;
  birthday?: Date;
  avatar?: string;
}

// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; // Story 1-4: 可选电话号码
  avatar?: string;
  children?: Child[]; // Story 1-5: 用户的孩子列表
  createdAt: Date;
  updatedAt: Date;
}

// Story 1-4: 用户资料更新请求
export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

// Story 1-4: 用户资料信息（用于显示）
export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
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
  /** 存储模式指示器 (P0-3修复) */
  storageMode?: 'mysql' | 'local';
  /** 警告信息 (降级时提醒用户) (P0-3修复) */
  warning?: string;
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

// === Story 5-1: Easy Upload and View Results Types ===

// 生成的题目接口
export interface GeneratedQuestion {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty: Difficulty;
}

// 生成记录接口
export interface GenerationRecord {
  id: string;                    // 唯一 ID (timestamp + random)
  questionType: QuestionType;     // ADDITION, SUBTRACTION, WORD_PROBLEM
  difficulty: Difficulty;         // EASY, MEDIUM, HARD
  count: number;                 // 生成的题目数量
  timestamp: number;             // Unix 时间戳
  questions: GeneratedQuestion[]; // 生成的题目数组
  processingTime?: number;        // 总处理时间（毫秒）
}

// 处理阶段枚举（中文标签）
export enum GenerationStage {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  RECOGNIZING = 'recognizing',
  DIFFICULTY_SELECTION = 'difficulty_selection',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

// 处理阶段的中文显示名称
export const GenerationStageLabels: Record<GenerationStage, string> = {
  [GenerationStage.IDLE]: '准备就绪',
  [GenerationStage.UPLOADING]: '上传中',
  [GenerationStage.RECOGNIZING]: '识别中',
  [GenerationStage.DIFFICULTY_SELECTION]: '选择难度',
  [GenerationStage.GENERATING]: '生成中',
  [GenerationStage.COMPLETED]: '完成',
  [GenerationStage.ERROR]: '出错',
  [GenerationStage.CANCELLED]: '已取消',
};

// === Story 4-4: Tablet UI Optimization Types ===

// 屏幕尺寸分类
export enum ScreenSize {
  SMALL_TABLET = 'SMALL_TABLET',
  MEDIUM_TABLET = 'MEDIUM_TABLET',
  LARGE_TABLET = 'LARGE_TABLET',
}

// 屏幕方向
export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

// 平板配置
export interface TabletConfig {
  screenWidth: number;
  screenHeight: number;
  screenSize: ScreenSize;
  orientation: Orientation;
  isTablet: boolean;
}