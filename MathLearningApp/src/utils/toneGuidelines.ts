/**
 * Story 5-4: Supportive Tone Guidelines
 * 提供支持性、鼓励性的语言指导
 */

/**
 * 情绪类型
 */
export type EmotionType = 'greeting' | 'encouragement' | 'reassurance' | 'celebration' | 'apology' | 'gratitude';

/**
 * 语气类型
 */
export type ToneType = 'friendly' | 'supportive' | 'encouraging' | 'calming' | 'celebratory';

/**
 * 支持性短语库
 */
export const supportivePhrases = {
  // ========== 问候语 ==========
  greeting: [
    '准备好开始学习了吗？',
    '让我们一起进步吧！',
    '今天也是美好的一天 ✨',
    '很高兴见到你！',
    '让我们开始今天的练习吧',
  ],

  // ========== 鼓励语 ==========
  encouragement: [
    '做得好，继续保持！',
    '每一次尝试都值得称赞',
    '你已经进步了很多',
    '这个小问题难不倒你',
    '相信你可以的',
    '慢慢来，你做得很好',
    '再试一次，你能行的',
  ],

  // ========== 安慰语 ==========
  reassurance: [
    '没关系，让我们再试一次',
    '慢慢来，不着急',
    '我们一起来解决',
    '这是学习的一部分',
    '每个人都会遇到这种情况',
    '不要担心，我们会帮你的',
    '这是一个很好的学习机会',
  ],

  // ========== 庆祝语 ==========
  celebration: [
    '太棒了！🎉',
    '做得好！🌟',
    '恭喜完成！✨',
    '继续加油！💪',
    '你真了不起！👏',
    '完美的表现！🏆',
    '又学会了一项新技能！🎯',
  ],

  // ========== 道歉语 ==========
  apology: [
    '抱歉，让我们重新开始',
    '不好意思，刚才出了点小问题',
    '给你带来不便了，我们马上修复',
    '抱歉让你久等了',
    '这是我们的问题，请再试一次',
  ],

  // ========== 感谢语 ==========
  gratitude: [
    '感谢你的耐心！',
    '谢谢你的努力！',
    '感谢你的理解',
    '你的支持对我们很重要',
    '非常感谢！',
  ],
} as const;

/**
 * 错误消息重写指南
 * 将批评性语言转换为支持性语言
 */
export const errorMessageRewrites = {
  // 网络错误
  network: {
    before: '网络错误',
    after: '💫 网络休息中，稍等片刻就好',
  },

  // 上传失败
  uploadFailed: {
    before: '上传失败',
    after: '😊 上传遇到小问题，让我们再试一次吧',
  },

  // 识别失败
  recognitionFailed: {
    before: '识别失败',
    after: '🤔 题目有点模糊，我们正在努力识别...',
  },

  // 操作失败
  actionFailed: {
    before: '操作失败',
    after: '🌱 没关系，我们还有其他方法',
  },

  // 验证失败
  validationFailed: {
    before: '输入无效',
    after: '🌿 请检查一下输入，有没有遗漏什么呢',
  },

  // 权限错误
  permissionDenied: {
    before: '权限不足',
    after: '🔓 需要你的允许才能继续哦',
  },

  // 超时
  timeout: {
    before: '请求超时',
    after: '⏰ 等待有点久了，要再试一次吗',
  },

  // 未知错误
  unknown: {
    before: '发生错误',
    after: '🍃 遇到一个小插曲，让我们重新开始吧',
  },
} as const;

/**
 * 成功消息增强
 */
export const successMessageEnhancements = {
  // 生成成功
  generated: {
    before: '生成成功',
    after: '🎉 太棒了！已为您生成练习题',
  },

  // 保存成功
  saved: {
    before: '保存成功',
    after: '✨ 已保存，做得很好！',
  },

  // 完成任务
  completed: {
    before: '完成',
    after: '🌟 完成啦，继续加油！',
  },

  // 更新成功
  updated: {
    before: '更新成功',
    after: '✅ 更新完成，一切就绪！',
  },

  // 删除成功
  deleted: {
    before: '删除成功',
    after: '🗑️ 已移除，继续保持整洁！',
  },
} as const;

/**
 * 加载消息重写
 */
export const loadingMessageRewrites = {
  // 正在加载
  loading: {
    before: '正在加载...',
    after: '🌈 正在为您准备精彩内容...',
  },

  // 正在处理
  processing: {
    before: '正在处理...',
    after: '☀️ 我们正在努力，请稍候...',
  },

  // 请等待
  waiting: {
    before: '请等待',
    after: '🍃 马上就好，感谢您的耐心',
  },

  // 正在上传
  uploading: {
    before: '正在上传...',
    after: '📤 正在安全地上传你的内容...',
  },

  // 正在下载
  downloading: {
    before: '正在下载...',
    after: '📥 正在获取最新内容...',
  },
} as const;

/**
 * 空状态消息重写
 */
export const emptyStateMessages = {
  // 无练习记录
  noPractice: {
    before: '暂无练习记录',
    title: '准备好开始了吗？',
    message: '每一次练习都是进步的开始',
    cta: '拍第一道题',
  },

  // 无历史记录
  noHistory: {
    before: '暂无历史记录',
    title: '崭新的开始',
    message: '记录你的每一次进步',
    cta: '开始练习',
  },

  // 无收藏
  noFavorites: {
    before: '暂无收藏',
    title: '收藏你喜欢的题目',
    message: '方便以后随时复习',
    cta: '去练习',
  },

  // 无通知
  noNotifications: {
    before: '暂无通知',
    title: '一切正常',
    message: '有新消息时我们会通知你',
    cta: '返回',
  },
} as const;

/**
 * 语气检查规则
 */
export const toneCheckerRules = {
  // 避免的词汇（负面）
  avoidWords: [
    '错误',
    '失败',
    '无法',
    '不能',
    '禁止',
    '必须',
    '应该',
    '不对',
    '不行',
    '糟糕',
    '麻烦',
  ],

  // 推荐的词汇（正面）
  preferWords: [
    '让我们',
    '一起',
    '可以',
    '能够',
    '试试',
    '看看',
    '准备',
    '开始',
    '进步',
    '学习',
  ],

  // emoji 使用指南
  emojiGuidelines: {
    // 友好的 emoji
    friendly: ['✨', '🌟', '💫', '🌈', '☀️', '🍃', '🌱', '🎯'],
    // 鼓励的 emoji
    encouraging: ['💪', '👏', '🎉', '🏆', '🌟', '✅'],
    // 安慰的 emoji
    reassuring: ['🤗', '🤝', '😊', '🌿', '🍃'],
    // 避免的 emoji（太消极）
    avoid: ['❌', '⚠️', '🚫', '😞', '😢', '😡'],
  },

  // "我们"语言优先于"你"语言
  useWeLanguage: {
    avoid: ['你必须', '你应该', '你错了', '你的问题'],
    prefer: ['让我们一起', '建议你', '可以试试', '这个问题'],
  },
} as const;

/**
 * 获取支持性短语
 * @param emotion 情绪类型
 * @returns 随机短语
 */
export const getSupportivePhrase = (emotion: EmotionType): string => {
  const phrases = supportivePhrases[emotion];
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
};

/**
 * 重写错误消息
 * @param errorType 错误类型
 * @returns 重写后的消息
 */
export const rewriteErrorMessage = (errorType: keyof typeof errorMessageRewrites): string => {
  return errorMessageRewrites[errorType]?.after || '🍃 遇到一个小问题，让我们再试一次吧';
};

/**
 * 增强成功消息
 * @param successType 成功类型
 * @returns 增强后的消息
 */
export const enhanceSuccessMessage = (successType: keyof typeof successMessageEnhancements): string => {
  return successMessageEnhancements[successType]?.after || '✨ 完成得很好！';
};

/**
 * 重写加载消息
 * @param loadingType 加载类型
 * @returns 重写后的消息
 */
export const rewriteLoadingMessage = (loadingType: keyof typeof loadingMessageRewrites): string => {
  return loadingMessageRewrites[loadingType]?.after || '🌈 正在为你准备...';
};

/**
 * 检查消息语气
 * @param message 要检查的消息
 * @returns {isAppropriate: boolean, suggestions: string[]}
 */
export const checkMessageTone = (message: string): {isAppropriate: boolean; suggestions: string[]} => {
  const suggestions: string[] = [];
  let isAppropriate = true;

  // 检查避免的词汇
  for (const avoidWord of toneCheckerRules.avoidWords) {
    if (message.includes(avoidWord)) {
      isAppropriate = false;
      suggestions.push(`避免使用"${avoidWord}"，尝试更友好的表达`);
    }
  }

  // 检查是否使用"你"而不是"我们"
  for (const avoidPhrase of toneCheckerRules.useWeLanguage.avoid) {
    if (message.includes(avoidPhrase)) {
      suggestions.push('尝试使用"让我们一起"而不是直接说"你必须"');
    }
  }

  return {isAppropriate, suggestions};
};

/**
 * 获取空状态内容
 * @param emptyType 空状态类型
 * @returns 空状态配置
 */
export const getEmptyStateContent = (
  emptyType: keyof typeof emptyStateMessages
): {title: string; message: string; cta: string} => {
  const content = emptyStateMessages[emptyType];
  return {
    title: content.title,
    message: content.message,
    cta: content.cta,
  };
};

/**
 * 默认导出
 */
export default {
  supportivePhrases,
  errorMessageRewrites,
  successMessageEnhancements,
  loadingMessageRewrites,
  emptyStateMessages,
  toneCheckerRules,
  getSupportivePhrase,
  rewriteErrorMessage,
  enhanceSuccessMessage,
  rewriteLoadingMessage,
  checkMessageTone,
  getEmptyStateContent,
};
