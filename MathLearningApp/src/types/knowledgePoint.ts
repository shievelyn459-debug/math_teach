/**
 * 知识点分类枚举
 * 基于中国一年级数学课程标准
 */
export enum KnowledgePointCategory {
  NUMBER_RECOGNITION = 'number_recognition', // 数的认识
  ADDITION = 'addition', // 加法运算
  SUBTRACTION = 'subtraction', // 减法运算
  WORD_PROBLEM = 'word_problem', // 应用题
  GEOMETRY = 'geometry', // 图形认识
  MEASUREMENT = 'measurement', // 测量（认识钟表、人民币）
  OTHER = 'other', // 其他类型
}

/**
 * 知识点接口
 */
export interface KnowledgePoint {
  id: string; // 知识点唯一标识
  name: string; // 知识点名称，如 "10以内加法"
  category: KnowledgePointCategory; // 所属分类
  grade: string; // 适用年级，如 "一年级"
  keywords: string[]; // 匹配关键词列表
  description: string; // 家长友好的描述说明
  examples: string[]; // 示例题目
  confidenceThreshold: number; // 最低置信度阈值 (0-1)
}

/**
 * 知识点匹配结果
 */
export interface KnowledgePointMatchResult {
  knowledgePoint: KnowledgePoint; // 匹配到的知识点
  confidence: number; // 置信度 (0-1)
  matchedKeywords: string[]; // 匹配到的关键词列表
}

/**
 * 知识点识别结果
 */
export interface KnowledgePointRecognitionResult {
  knowledgePoints: KnowledgePointMatchResult[]; // 识别出的知识点列表（可能有多个）
  primaryKnowledgePoint: KnowledgePointMatchResult; // 主要知识点（置信度最高的）
  fallbackUsed: boolean; // 是否使用了降级处理
}
