/**
 * 知识点讲解内容类型定义
 * Story 3-2: generate-knowledge-point-explanation
 */

/**
 * 讲解来源枚举
 */
export enum ExplanationSource {
  AI = 'ai',           // AI生成
  TEMPLATE = 'template', // 模板预设
  HYBRID = 'hybrid',    // 混合模式
}

/**
 * 讲解章节枚举
 */
export enum ExplanationSectionType {
  DEFINITION = 'definition',        // 概念说明
  METHODS = 'methods',              // 解题方法
  EXAMPLES = 'examples',            // 例题演示
  TIPS = 'tips',                    // 辅导技巧
}

/**
 * 讲解格式枚举
 * Story 3-4: multiple-explanation-formats
 */
export enum ExplanationFormat {
  TEXT = 'text',                    // 文字讲解 (已实现 - Story 3-2)
  ANIMATION = 'animation',          // 动画演示 (占位符 - 未来实现)
  VIDEO = 'video',                  // 视频讲解 (占位符 - 未来实现)
}

/**
 * 格式元数据接口
 */
export interface FormatMetadata {
  textContent?: string;             // 文字内容 (当前已实现)
  animationUrl?: string;            // 动画资源URL (未来)
  videoUrl?: string;                // 视频流URL (未来)
  thumbnailUrl?: string;            // 格式缩略图
  duration?: number;                // 动画/视频时长(秒)
}

/**
 * 例题数据结构
 */
export interface ExplanationExample {
  question: string;           // 题目
  answer: string;             // 答案
  steps: string[];            // 解题步骤
  difficulty?: 'easy' | 'medium' | 'hard'; // 难度级别
}

/**
 * 讲解章节内容
 */
export interface ExplanationSection {
  type: ExplanationSectionType;  // 章节类型
  title: string;                 // 章节标题
  content: string[];             // 内容段落列表
  examples?: ExplanationExample[]; // 例题列表（仅EXAMPLES章节）
  order: number;                 // 显示顺序
}

/**
 * 家长辅导技巧
 */
export interface TeachingTip {
  id: string;
  title: string;           // 技巧标题
  description: string;     // 详细说明
  dos: string[];          // 应该做的事
  donts: string[];        // 不应该做的事
  practiceActivity?: string; // 实践活动建议
}

/**
 * 知识点讲解完整内容
 */
export interface Explanation {
  id: string;                         // 讲解唯一ID
  knowledgePointId: string;           // 关联的知识点ID
  knowledgePointName: string;         // 知识点名称
  sections: ExplanationSection[];     // 讲解章节
  teachingTips: TeachingTip[];        // 家长辅导技巧
  source: ExplanationSource;          // 来源（AI/模板）
  qualityScore: number;               // 质量分数 (0-1)
  version: number;                    // 内容版本号
  reviewed: boolean;                  // 是否已人工审核
  childAppropriate: boolean;          // 是否适合儿童
  language: string;                   // 语言（默认"zh-CN"）
  estimatedReadTime: number;          // 预计阅读时间（分钟）
  // Story 3-4: 多格式支持字段
  availableFormats: ExplanationFormat[];  // 可用的格式列表
  currentFormat: ExplanationFormat;       // 当前选中的格式
  formatMetadata?: FormatMetadata;        // 格式相关的元数据
  createdAt: Date;                    // 创建时间
  updatedAt: Date;                    // 更新时间
}

/**
 * 讲解生成请求
 */
export interface ExplanationGenerationRequest {
  knowledgePointId: string;           // 知识点ID
  knowledgePointName: string;         // 知识点名称
  grade: string;                      // 年级
  preferredSource?: ExplanationSource; // 首选来源
  questionText?: string;              // 关联的题目文本（可选，用于上下文）
  parentProfile?: {                   // 家长画像（用于个性化）
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    concerns?: string[];              // 家长关注的问题
  };
}

/**
 * 讲解生成结果
 */
export interface ExplanationGenerationResult {
  explanation: Explanation;            // 生成的讲解内容
  generationTime: number;             // 生成耗时（毫秒）
  source: ExplanationSource;          // 实际使用的来源
  fallbackUsed: boolean;              // 是否使用了降级处理
  qualityMetrics: {                   // 质量指标
    completeness: number;             // 完整性 (0-1)
    clarity: number;                  // 清晰度 (0-1)
    childAppropriate: number;         // 适合度 (0-1)
  };
}

/**
 * 讲解反馈
 */
export interface ExplanationFeedback {
  explanationId: string;              // 讲解ID
  userId?: string;                    // 用户ID
  rating: number;                     // 评分 (1-5)
  helpful: boolean;                   // 是否有帮助
  easyToUnderstand: boolean;          // 是否易懂
  appropriateForChild: boolean;       // 是否适合孩子
  comments?: string;                  // 评论
  suggestions?: string;               // 改进建议
  timestamp: Date;                    // 提交时间
}

/**
 * 家长友好语言指南
 */
export const PARENT_FRIENDLY_LANGUAGE_GUIDELINES = {
  /**
   * 应该使用的词汇
   */
  preferredTerms: [
    '孩子', '小朋友', '宝贝', // 代替"学生"
    '加起来', '合起来', '一共', // 代替"求和"
    '拿走', '去掉', '剩下', // 代替"减去"
  ],

  /**
   * 应该避免的专业术语
   */
  avoidTerms: [
    '加数', '被加数', '和', // 加法术语
    '被减数', '减数', '差', // 减法术语
    '因数', '积', // 乘法术语
    '被除数', '除数', '商', // 除法术语
    '进位', '退位', // 位值概念
    '算式', '等式', // 数学表达
  ],

  /**
   * 生活化比喻库
   */
  analogies: {
    addition: [
      '把苹果放在一起',
      '合起来数一数',
      '像搭积木一样越堆越高',
    ],
    subtraction: [
      '从苹果篮子里拿走几个',
      '吃掉了饼干还剩多少',
      '像分糖果一样',
    ],
    numbers: [
      '像数楼梯台阶一样',
      '像排队的小朋友',
    ],
  },

  /**
   * 辅导话术模板
   */
  phraseTemplates: {
    encouragement: [
      '我们一起来数数看',
      '试试用你的小手比一比',
      '用画图的方法会更容易理解',
    ],
    guidance: [
      '先看看题目里有什么数字',
      '想想用什么东西来代表这些数字',
      '一步一步来，不着急',
    ],
    correction: [
      '这个思路很好，但是...',
      '我们换一种方式试试',
      '注意看这里的变化',
    ],
  },
};

/**
 * 内容风格指南
 */
export const CONTENT_STYLE_GUIDE = {
  /**
   * 目标受众特征
   */
  targetAudience: {
    ageRange: '6-7岁',
    grade: '一年级',
    parentBackground: '非数学专业家长',
  },

  /**
   * 语言风格要求
   */
  languageStyle: {
    tone: '亲切友好',
    complexity: '简单易懂',
    sentenceLength: '短句为主（每句不超过15字）',
    analogyUsage: '大量使用生活化比喻',
  },

  /**
   * 内容结构要求
   */
  contentStructure: {
    definition: {
      maxLength: 200, // 字数
      mustIncludeAnalogy: true,
      mustIncludeExample: true,
    },
    methods: {
      maxSteps: 5,
      eachStepMaxWords: 30,
      mustBeNumbered: true,
    },
    examples: {
      minCount: 3,
      maxCount: 5,
      mustHaveSteps: true,
    },
    tips: {
      minCount: 3,
      maxCount: 5,
      mustIncludeDosAndDonts: true,
    },
  },

  /**
   * 质量标准
   */
  qualityStandards: {
    completeness: 0.9,      // 完整性阈值
    clarity: 0.85,          // 清晰度阈值
    childAppropriate: 0.9,  // 适合度阈值
    minQualityScore: 0.8,   // 最低质量分数
  },
};
