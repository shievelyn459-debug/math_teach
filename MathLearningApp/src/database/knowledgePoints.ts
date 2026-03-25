import {KnowledgePoint, KnowledgePointCategory} from '../types/knowledgePoint';

/**
 * 一年级数学知识点数据库
 * 基于教育部《义务教育数学课程标准(2022年版)》一年级上册/下册
 */

// 数的认识知识点
const NUMBER_RECOGNITION_KPS: KnowledgePoint[] = [
  {
    id: 'kp-nr-001',
    name: '10以内数的认识',
    category: KnowledgePointCategory.NUMBER_RECOGNITION,
    grade: '一年级',
    keywords: ['10以内', '数数', '认数', '认识数字', '写数字'],
    description: '认识0-10的数字，理解数的含义',
    examples: ['数一数有多少个苹果', '写出数字5', '比大小'],
    confidenceThreshold: 0.5,
  },
  {
    id: 'kp-nr-002',
    name: '11-20数的认识',
    category: KnowledgePointCategory.NUMBER_RECOGNITION,
    grade: '一年级',
    keywords: ['11-20', '十几', '两位数', '十和几个'],
    description: '认识11-20的数字，理解数的组成',
    examples: ['1个十和5个一组成15', '读出数字18'],
    confidenceThreshold: 0.5,
  },
  {
    id: 'kp-nr-003',
    name: '数的顺序',
    category: KnowledgePointCategory.NUMBER_RECOGNITION,
    grade: '一年级',
    keywords: ['顺序', '前后', '相邻', '接着', '下一个'],
    description: '理解数的顺序和相邻数',
    examples: ['5的相邻数是几', '按顺序填数'],
    confidenceThreshold: 0.5,
  },
  {
    id: 'kp-nr-004',
    name: '数的大小比较',
    category: KnowledgePointCategory.NUMBER_RECOGNITION,
    grade: '一年级',
    keywords: ['大小', '哪个', '大于', '小于', '和'],
    description: '会比较数的大小',
    examples: ['5和3哪个大', '在○里填>、<、='],
    confidenceThreshold: 0.3,
  },
  {
    id: 'kp-nr-005',
    name: '比大小',
    category: KnowledgePointCategory.NUMBER_RECOGNITION,
    grade: '一年级',
    keywords: ['哪个多', '哪个少', '一样多', '同样多'],
    description: '比较数量的大小，理解多少的概念',
    examples: ['哪种水果多', '哪个数量最大'],
    confidenceThreshold: 0.5,
  },
  {
    id: 'kp-nr-006',
    name: '分类',
    category: KnowledgePointCategory.NUMBER_RECOGNITION,
    grade: '一年级',
    keywords: ['分类', '分一分', '把...分类', '按照', '标准', '不同', '相同'],
    description: '按照一定标准对物品进行分类',
    examples: ['把水果分类', '按颜色分类', '分一分'],
    confidenceThreshold: 0.5,
  },
  {
    id: 'kp-nr-007',
    name: '找规律',
    category: KnowledgePointCategory.NUMBER_RECOGNITION,
    grade: '一年级',
    keywords: ['规律', '接下来', '接着画', '重复', '模式'],
    description: '发现并延续简单的排列规律',
    examples: ['找出排列规律', '接下来是什么', '接着填'],
    confidenceThreshold: 0.5,
  },
];

// 加法运算知识点
const ADDITION_KPS: KnowledgePoint[] = [
  {
    id: 'kp-add-001',
    name: '10以内加法',
    category: KnowledgePointCategory.ADDITION,
    grade: '一年级',
    keywords: ['加', '+', '和', '一共', '合计', '总共', '增加', '添上', '等于'],
    description: '掌握10以内的加法运算',
    examples: ['3 + 2 = ?', '5 + 4 = ?', '一共有几个'],
    confidenceThreshold: 0.3, // 降低阈值，更容易匹配
  },
  {
    id: 'kp-add-002',
    name: '20以内进位加法',
    category: KnowledgePointCategory.ADDITION,
    grade: '一年级',
    keywords: ['进位', '满十进一', '9加几', '8加几', '7加几'],
    description: '掌握20以内的进位加法',
    examples: ['9 + 5 = ?', '8 + 6 = ?', '7 + 4 = ?'],
    confidenceThreshold: 0.7,
  },
  {
    id: 'kp-add-003',
    name: '连加',
    category: KnowledgePointCategory.ADDITION,
    grade: '一年级',
    keywords: ['连加', '依次加上', '再加上'],
    description: '掌握三个数连加的运算',
    examples: ['2 + 3 + 4 = ?', '5 + 1 + 3 = ?'],
    confidenceThreshold: 0.7,
  },
];

// 减法运算知识点
const SUBTRACTION_KPS: KnowledgePoint[] = [
  {
    id: 'kp-sub-001',
    name: '10以内减法',
    category: KnowledgePointCategory.SUBTRACTION,
    grade: '一年级',
    keywords: ['减', '-', '剩', '剩下', '剩余', '去掉', '拿走', '减少', '等于'],
    description: '掌握10以内的减法运算',
    examples: ['5 - 2 = ?', '8 - 3 = ?', '还剩几个'],
    confidenceThreshold: 0.3, // 降低阈值，更容易匹配
  },
  {
    id: 'kp-sub-002',
    name: '20以内退位减法',
    category: KnowledgePointCategory.SUBTRACTION,
    grade: '一年级',
    keywords: ['退位', '借位', '十几减几', '破十法'],
    description: '掌握20以内的退位减法',
    examples: ['15 - 8 = ?', '12 - 5 = ?', '16 - 9 = ?'],
    confidenceThreshold: 0.7,
  },
  {
    id: 'kp-sub-003',
    name: '连减',
    category: KnowledgePointCategory.SUBTRACTION,
    grade: '一年级',
    keywords: ['连减', '依次减去', '再减去'],
    description: '掌握三个数连减的运算',
    examples: ['10 - 2 - 3 = ?', '15 - 5 - 4 = ?'],
    confidenceThreshold: 0.7,
  },
];

// 应用题知识点
const WORD_PROBLEM_KPS: KnowledgePoint[] = [
  {
    id: 'kp-wp-001',
    name: '简单应用题',
    category: KnowledgePointCategory.WORD_PROBLEM,
    grade: '一年级',
    keywords: [
      '原来',
      '原来有',
      '又来',
      '又来了',
      '又买',
      '又买了',
      '买',
      '买了',
      '卖',
      '卖了',
      '送给',
      '分给',
      '一共有',
      '还剩',
      '还剩多少',
      '个苹果',
      '个',
      '有几个',
      '几',
    ],
    description: '解决简单的加法和减法应用题',
    examples: ['原来有5个苹果，又买了3个，一共有几个', '有8朵花，送给小朋友3朵，还剩几朵'],
    confidenceThreshold: 0.6,
  },
  {
    id: 'kp-wp-002',
    name: '图文应用题',
    category: KnowledgePointCategory.WORD_PROBLEM,
    grade: '一年级',
    keywords: ['看图', '图中', '如图', '画了', '从图中看出'],
    description: '理解并解决图文结合的应用题',
    examples: ['看图列式', '根据图意回答问题'],
    confidenceThreshold: 0.5,
  },
];

// 图形认识知识点
const GEOMETRY_KPS: KnowledgePoint[] = [
  {
    id: 'kp-geo-001',
    name: '认识图形',
    category: KnowledgePointCategory.GEOMETRY,
    grade: '一年级',
    keywords: ['长方体', '正方体', '圆柱', '球', '长方形', '正方形', '圆', '三角形', '图形'],
    description: '认识基本的立体图形和平面图形',
    examples: ['说出图形名称', '分类图形'],
    confidenceThreshold: 0.6,
  },
  {
    id: 'kp-geo-002',
    name: '图形拼摆',
    category: KnowledgePointCategory.GEOMETRY,
    grade: '一年级',
    keywords: ['拼摆', '拼图', '搭积木', '组成', '拼成'],
    description: '用图形拼摆出各种图案',
    examples: ['用三角形拼成正方形', '用小棒摆图形'],
    confidenceThreshold: 0.5,
  },
  {
    id: 'kp-geo-003',
    name: '位置',
    category: KnowledgePointCategory.GEOMETRY,
    grade: '一年级',
    keywords: ['位置', '上下', '前后', '左右', '中间', '里面', '外面', '旁边'],
    description: '认识物体的相对位置',
    examples: ['说出物体的位置', '在什么位置'],
    confidenceThreshold: 0.5,
  },
  {
    id: 'kp-geo-004',
    name: '方向',
    category: KnowledgePointCategory.GEOMETRY,
    grade: '一年级',
    keywords: ['方向', '东', '南', '西', '北', '向上', '向下', '向左', '向右'],
    description: '认识基本的方向',
    examples: ['辨别方向', '向哪个方向'],
    confidenceThreshold: 0.5,
  },
];

// 测量知识点
const MEASUREMENT_KPS: KnowledgePoint[] = [
  {
    id: 'kp-mea-001',
    name: '认识钟表',
    category: KnowledgePointCategory.MEASUREMENT,
    grade: '一年级',
    keywords: ['钟表', '时间', '整时', '点'],
    description: '认识钟表，会看整时和半时',
    examples: ['认读时间', '画出时针和分针'],
    confidenceThreshold: 0.25,
  },
  {
    id: 'kp-mea-002',
    name: '认识人民币',
    category: KnowledgePointCategory.MEASUREMENT,
    grade: '一年级',
    keywords: ['人民币', '元', '角', '分', '等于'],
    description: '认识人民币的面值',
    examples: ['认钱', '换算元和角'],
    confidenceThreshold: 0.25,
  },
];

// 降级处理知识点
const FALLBACK_KNOWLEDGE_POINT: KnowledgePoint = {
  id: 'kp-other-001',
  name: '其他题型',
  category: KnowledgePointCategory.OTHER,
  grade: '一年级',
  keywords: [],
  description: '未能自动识别的知识点，请手动选择或参考详细讲解',
  examples: [],
  confidenceThreshold: 0,
};

/**
 * 所有知识点数据库
 */
export const KNOWLEDGE_POINTS_DATABASE: KnowledgePoint[] = [
  ...NUMBER_RECOGNITION_KPS,
  ...ADDITION_KPS,
  ...SUBTRACTION_KPS,
  ...WORD_PROBLEM_KPS,
  ...GEOMETRY_KPS,
  ...MEASUREMENT_KPS,
];

/**
 * 获取降级知识点
 */
export function getFallbackKnowledgePoint(): KnowledgePoint {
  return {...FALLBACK_KNOWLEDGE_POINT};
}

/**
 * 根据分类获取知识点
 */
export function getKnowledgePointsByCategory(
  category: KnowledgePointCategory
): KnowledgePoint[] {
  return KNOWLEDGE_POINTS_DATABASE.filter(kp => kp.category === category);
}

/**
 * 根据ID获取知识点
 */
export function getKnowledgePointById(id: string): KnowledgePoint | undefined {
  return KNOWLEDGE_POINTS_DATABASE.find(kp => kp.id === id);
}

/**
 * 获取所有知识点名称列表
 */
export function getAllKnowledgePointNames(): string[] {
  return KNOWLEDGE_POINTS_DATABASE.map(kp => kp.name);
}
