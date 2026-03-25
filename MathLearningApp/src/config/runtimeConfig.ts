/**
 * 运行时配置（用于打包版本）
 * 此文件在打包时会根据.env自动生成
 */

// 默认配置
const config = {
  BAIDU_OCR_API_KEY: 'qgHDk2wOdQDXrK9irn8R0oPI',
  BAIDU_OCR_SECRET_KEY: 'XqEOZZpKmPIMcNWoWBDOwfDyixtf6q25',
  DEEPSEEK_API_KEY: 'sk-c3d1ff257a304d638ab9bf7f2ab9f2c2',
  OCR_PROVIDER: 'baidu',
  GENERATION_PROVIDER: 'deepseek',
  ENABLE_AI_GENERATION: 'true',
  USE_LOCAL_FALLBACK: 'true',
};

export default config;
