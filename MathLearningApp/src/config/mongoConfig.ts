/**
 * MongoDB Configuration
 *
 * 配置MongoDB连接参数和环境变量
 */

export interface MongoConfig {
  /** MongoDB连接URI */
  uri: string;
  /** 数据库名称 */
  dbName: string;
  /** 连接选项 */
  options: {
    /** 连接池大小 */
    maxPoolSize: number;
    /** 服务器选择超时（毫秒） */
    serverSelectionTimeoutMS: number;
    /** Socket超时（毫秒） */
    socketTimeoutMS: number;
    /** 连接超时（毫秒） */
    connectTimeoutMS: number;
  };
}

/**
 * MongoDB配置对象
 *
 * 从环境变量读取配置，提供默认值用于开发环境
 */
export const MONGO_CONFIG: MongoConfig = {
  // 从环境变量获取连接URI，开发环境使用空字符串
  uri: process.env.MONGODB_URI || '',

  // 数据库名称固定为mathlearning
  dbName: 'mathlearning',

  // 连接池和超时配置
  options: {
    maxPoolSize: 10,                      // 最大连接数
    serverSelectionTimeoutMS: 5000,       // 5秒服务器选择超时
    socketTimeoutMS: 45000,               // 45秒socket超时
    connectTimeoutMS: 10000,              // 10秒连接超时
  },
};

/**
 * 验证MongoDB配置是否有效
 *
 * @returns {boolean} 配置是否有效
 * @returns {string} 错误信息（如果无效）
 */
export function validateMongoConfig(): { valid: boolean; error?: string } {
  if (!MONGO_CONFIG.uri || MONGO_CONFIG.uri.trim() === '') {
    return {
      valid: false,
      error: 'MONGODB_URI环境变量未设置。请在.env文件中配置MongoDB连接字符串。',
    };
  }

  if (!MONGO_CONFIG.uri.startsWith('mongodb+srv://') && !MONGO_CONFIG.uri.startsWith('mongodb://')) {
    return {
      valid: false,
      error: 'MONGODB_URI格式无效。必须以mongodb://或mongodb+srv://开头。',
    };
  }

  return { valid: true };
}

/**
 * 获取MongoDB连接状态描述
 *
 * @returns {string} 连接状态描述
 */
export function getConnectionStatus(): string {
  const validation = validateMongoConfig();
  if (!validation.valid) {
    return `❌ 配置无效: ${validation.error}`;
  }

  return `✅ 配置有效\n数据库: ${MONGO_CONFIG.dbName}\n连接池大小: ${MONGO_CONFIG.options.maxPoolSize}`;
}
