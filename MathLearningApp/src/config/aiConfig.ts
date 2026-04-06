/**
 * AI Service Configuration
 * Manages API keys, model selection, and rate limits for third-party AI services
 * Using: Baidu OCR for image recognition, DeepSeek for question generation
 */

// 导入运行时配置（用于打包版本）
import runtimeConfig from './runtimeConfig';

// 辅助函数：获取配置值
function getConfig(key: string, defaultValue: string = ''): string {
  // 优先使用runtimeConfig（打包版本）
  if (runtimeConfig && runtimeConfig[key]) {
    return runtimeConfig[key];
  }
  // 降级到process.env（开发环境）
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
}

/**
 * Baidu OCR Configuration
 */
export const BAIDU_OCR_CONFIG = {
  apiKey: getConfig('BAIDU_OCR_API_KEY'),
  secretKey: getConfig('BAIDU_OCR_SECRET_KEY'),
  accessToken: getConfig('BAIDU_OCR_ACCESS_TOKEN'),
  baseURL: 'https://aip.baidubce.com',
  tokenURL: 'https://aip.baidubce.com/oauth/2.0/token',
};

/**
 * DeepSeek Configuration
 */
export const DEEPSEEK_CONFIG = {
  apiKey: getConfig('DEEPSEEK_API_KEY'),
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat', // Main model for generation
  maxTokens: 2000,
};

/**
 * OpenAI Configuration (Optional - kept for fallback)
 */
export const OPENAI_CONFIG = {
  apiKey: getConfig('OPENAI_API_KEY'),
  baseURL: 'https://api.openai.com/v1',
  models: {
    vision: 'gpt-4o',
    chat: 'gpt-4o-mini',
    explanation: 'gpt-4o-mini',
  },
  maxTokens: {
    vision: 1000,
    chat: 2000,
    explanation: 3000,
  },
};

/**
 * AI Provider Selection
 */
export const AI_PROVIDER = {
  ocr: getConfig('OCR_PROVIDER', 'baidu'), // 'baidu' or 'openai'
  generation: getConfig('GENERATION_PROVIDER', 'deepseek'), // 'deepseek' or 'openai'
};

/**
 * Rate limiting configuration
 * Prevents excessive API usage and cost overruns
 */
export const RATE_LIMITS = {
  // DeepSeek limits (higher than OpenAI)
  deepseek: {
    maxRequestsPerMinute: 200,
    maxTokensPerDay: 200000,
  },
  // Baidu OCR limits (QPS = 2 for free tier, 10 for paid)
  baidu: {
    maxRequestsPerSecond: 2, // Free tier
    maxRequestsPerDay: 500, // Free tier daily limit
  },
  // OpenAI limits (fallback)
  openai: {
    maxRequestsPerMinute: 60,
    maxTokensPerDay: 100000,
  },
};

/**
 * Timeout configuration (milliseconds)
 */
export const AI_TIMEOUTS = {
  baiduOcr: 30000,       // 30 seconds for Baidu OCR (token fetch + recognition)
  baiduOcrToken: 15000,  // 15 seconds for Baidu OCR token fetch
  deepseek: 25000,       // 25 seconds for DeepSeek
  openai: {
    vision: 15000,
    chat: 20000,
    explanation: 15000,
  },
};

/**
 * Feature flags
 */
export const AI_FEATURES = {
  enableAIGeneration: process.env.ENABLE_AI_GENERATION !== 'false',
  useLocalFallback: process.env.USE_LOCAL_FALLBACK !== 'false',
  enableCache: true,
  enableDeepSeek: AI_PROVIDER.generation === 'deepseek',
  enableBaiduOcr: AI_PROVIDER.ocr === 'baidu',
};

/**
 * Validate configuration
 */
export function validateAIConfig(): {valid: boolean; errors: string[]} {
  const errors: string[] = [];

  // Check Baidu OCR config if enabled
  if (AI_PROVIDER.ocr === 'baidu') {
    if (!BAIDU_OCR_CONFIG.apiKey) {
      errors.push('BAIDU_OCR_API_KEY is not set. Please set it in your .env file.');
    }
    if (!BAIDU_OCR_CONFIG.secretKey) {
      errors.push('BAIDU_OCR_SECRET_KEY is not set. Please set it in your .env file.');
    }
  }

  // Check DeepSeek config if enabled
  if (AI_PROVIDER.generation === 'deepseek' && !DEEPSEEK_CONFIG.apiKey) {
    errors.push('DEEPSEEK_API_KEY is not set. Please set it in your .env file.');
  }

  if (!AI_FEATURES.enableAIGeneration && !AI_FEATURES.useLocalFallback) {
    errors.push('At least one of enableAIGeneration or useLocalFallback must be enabled.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Cost estimation (CNY per 1K tokens for DeepSeek, USD for others)
 * DeepSeek pricing is significantly cheaper than OpenAI
 */
export const PRICING = {
  // DeepSeek pricing (CNY)
  'deepseek-chat': {
    input: 0.001,  // ¥1/1M tokens
    output: 0.002, // ¥2/1M tokens
  },
  // OpenAI pricing (USD) - fallback
  'gpt-4o': {
    input: 0.0025,
    output: 0.01,
  },
  'gpt-4o-mini': {
    input: 0.00015,
    output: 0.0006,
  },
  // Baidu OCR pricing (CNY per call)
  'baidu-ocr': {
    general: 0.002,  // ¥0.002/call for general OCR
    accurate: 0.003, // ¥0.003/call for high-precision OCR
  },
};

/**
 * Get pricing for a specific model
 */
export function getModelPricing(model: string) {
  return PRICING[model as keyof typeof PRICING] || {input: 0, output: 0};
}

/**
 * Estimate cost for an API call
 */
export function estimateCost(provider: string, model: string, inputTokens: number, outputTokens: number = 0): number {
  if (provider === 'baidu') {
    // Baidu OCR is charged per call, not per token
    return PRICING['baidu-ocr'].general;
  }
  const pricing = getModelPricing(model);
  return ((inputTokens / 1000) * pricing.input) + ((outputTokens / 1000) * pricing.output);
}
