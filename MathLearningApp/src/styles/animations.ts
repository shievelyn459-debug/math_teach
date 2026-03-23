/**
 * Story 5-4: Smooth, Calming Animations
 * 使用平滑、舒缓的动画减少焦虑感
 */

import {Easing} from 'react-native';

/**
 * 动画持续时间
 * 使用较长的持续时间，避免过快的动画
 */
export const duration = {
  // 极快 - 仅用于微交互
  instant: 150,

  // 快速 - 简单过渡
  fast: 200,

  // 标准 - 大多数动画
  medium: 300,

  // 较慢 - 复杂过渡
  slow: 400,

  // 缓慢 - 重大变化
  slower: 500,

  // 极慢 - 仅用于特殊效果
  leisurely: 600,
} as const;

/**
 * 缓动函数
 * 使用平滑的缓动，避免生硬的过渡
 */
export const easing = {
  // 平滑淡入
  fadeOut: Easing.out(Easing.ease),

  // 平滑淡出
  fadeIn: Easing.in(Easing.ease),

  // 舒缓的缓动
  smooth: Easing.bezier(0.4, 0.0, 0.2, 1),

  // 弹性缓动（轻微）
  gentle: Easing.bezier(0.34, 1.56, 0.64, 1),

  // 自然缓动
  natural: Easing.out(Easing.cubic),

  // 线性 - 仅用于连续动画
  linear: Easing.linear,
} as const;

/**
 * 动画配置预设
 */
export const animations = {
  // ========== 淡入淡出 ==========
  /**
   * 快速淡入
   */
  fadeInFast: {
    duration: duration.fast,
    easing: easing.fadeIn,
  },

  /**
   * 标准淡入
   */
  fadeIn: {
    duration: duration.medium,
    easing: easing.fadeIn,
  },

  /**
   * 慢速淡入
   */
  fadeInSlow: {
    duration: duration.slow,
    easing: easing.fadeIn,
  },

  /**
   * 快速淡出
   */
  fadeOutFast: {
    duration: duration.fast,
    easing: easing.fadeOut,
  },

  /**
   * 标准淡出
   */
  fadeOut: {
    duration: duration.medium,
    easing: easing.fadeOut,
  },

  // ========== 缩放动画 ==========
  /**
   * 轻微缩放 - 用于按钮反馈
   */
  softScale: {
    duration: 250,
    easing: easing.smooth,
    scale: 0.97,
  },

  /**
   * 脉冲 - 用于重要提示
   */
  pulse: {
    duration: 400,
    easing: easing.smooth,
    scale: 1.05,
  },

  /**
   * 呼吸 - 用于长时间等待
   */
  breathe: {
    duration: 3000,
    easing: easing.smooth,
    scale: 1.08,
  },

  // ========== 滑动动画 ==========
  /**
   * 平滑上滑
   */
  slideUp: {
    duration: duration.slow,
    easing: easing.natural,
  },

  /**
   * 平滑下滑
   */
  slideDown: {
    duration: duration.slow,
    easing: easing.natural,
  },

  /**
   * 舒缓的滑动
   */
  slide: {
    duration: duration.medium,
    easing: easing.smooth,
  },

  // ========== 弹簧动画 ==========
  /**
   * 轻微弹簧
   */
  springGentle: {
    tension: 80,
    friction: 12,
  },

  /**
   * 标准弹簧
   */
  spring: {
    tension: 60,
    friction: 10,
  },

  /**
   * 柔和弹簧
   */
  springSoft: {
    tension: 40,
    friction: 8,
  },
} as const;

/**
 * 动画组合预设
 * 用于常见的UI交互
 */
export const animationPresets = {
  // ========== 页面过渡 ==========
  /**
   * 页面淡入
   */
  pageEnter: {
    opacity: 0,
    to: {opacity: 1},
    config: {
      duration: duration.medium,
      easing: easing.fadeIn,
    },
  },

  /**
   * 页面淡出
   */
  pageExit: {
    opacity: 1,
    to: {opacity: 0},
    config: {
      duration: duration.fast,
      easing: easing.fadeOut,
    },
  },

  // ========== 弹窗动画 ==========
  /**
   * 弹窗淡入并缩放
   */
  modalEnter: {
    opacity: 0,
    scale: 0.95,
    to: {opacity: 1, scale: 1},
    config: {
      duration: duration.medium,
      easing: easing.smooth,
    },
  },

  /**
   * 弹窗淡出并缩小
   */
  modalExit: {
    opacity: 1,
    scale: 1,
    to: {opacity: 0, scale: 0.95},
    config: {
      duration: duration.fast,
      easing: easing.smooth,
    },
  },

  // ========== 列表项动画 ==========
  /**
   * 列表项淡入并滑动
   */
  listItemEnter: (index: number) => ({
    opacity: 0,
    translateY: 20,
    to: {opacity: 1, translateY: 0},
    config: {
      duration: duration.medium,
      easing: easing.smooth,
      delay: index * 50, // 错开动画
    },
  }),

  // ========== 按钮反馈 ==========
  /**
   * 按钮按下
   */
  buttonPress: {
    to: {scale: 0.97},
    config: {
      duration: duration.instant,
      easing: easing.smooth,
    },
  },

  /**
   * 按钮释放
   */
  buttonRelease: {
    to: {scale: 1},
    config: {
      duration: duration.fast,
      easing: easing.gentle,
    },
  },

  // ========== 加载动画 ==========
  /**
   * 平滑旋转
   */
  rotate: {
    duration: 1500,
    easing: easing.linear,
  },

  /**
   * 呼吸效果
   */
  breathe: {
    to: {scale: 1.08, opacity: 0.8},
    config: {
      duration: 1500,
      easing: easing.smooth,
    },
  },

  // ========== 成功/错误动画 ==========
  /**
   * 成功检查标记
   */
  successCheck: {
    to: {scale: 1.2},
    config: {
      duration: duration.fast,
      easing: easing.gentle,
    },
  },

  /**
   * 错误震动（非常轻微）
   * 注意：保持极轻微以避免焦虑
   */
  errorShake: {
    duration: 300,
    easing: easing.smooth,
    distance: 3, // 仅3像素，非常轻微
  },
} as const;

/**
 * 禁用的动画模式
 * 这些动画会产生焦虑感，应避免使用
 */
export const discouragedAnimations = {
  // ❌ 剧烈震动
  violentShake: false,

  // ❌ 快速闪烁
  strobe: false,

  // ❌ 弹跳（过于活跃）
  bounce: false,

  // ❌ 突然剪切
  snapCut: false,

  // ❌ 过快的动画（< 150ms）
  tooFast: false,

  // ❌ 抖动
  jitter: false,
} as const;

/**
 * 动画工具函数
 */
export const animationUtils = {
  /**
   * 创建延迟的动画
   */
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 创建序列动画
   */
  sequence: async (animations: Array<() => Promise<any>>) => {
    for (const anim of animations) {
      await anim();
    }
  },

  /**
   * 创建并行动画
   */
  parallel: async (animations: Array<() => Promise<any>>) => {
    await Promise.all(animations.map(anim => anim()));
  },

  /**
   * 获取错开的延迟时间
   * 用于列表项的级联动画
   */
  getStaggerDelay: (index: number, baseDelay: number = 50) => {
    return index * baseDelay;
  },
};

/**
 * 默认导出
 */
export default animations;
