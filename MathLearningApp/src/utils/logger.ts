/**
 * 安全日志工具
 *
 * Story 6-2 P1-10修复: 不安全的错误处理暴露内部状态
 *
 * 功能：
 * - 在生产环境屏蔽敏感信息
 * - 提供分级日志（debug, info, warn, error）
 * - 自动脱敏用户邮箱等敏感数据
 */

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 日志配置
 */
interface LoggerConfig {
  level: LogLevel;
  enableStackTrace: boolean;
  sanitizeEmails: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
  enableStackTrace: __DEV__,
  sanitizeEmails: true,
};

/**
 * 敏感信息模式（需要脱敏）
 */
const SENSITIVE_PATTERNS = [
  {pattern: /email[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, replacement: 'email: ***@***.***'},
  {pattern: /password[:\s]*[^\s]+/gi, replacement: 'password: ***'},
  {pattern: /token[:\s]*[^\s]+/gi, replacement: 'token: ***'},
  {pattern: /secret[:\s]*[^\s]+/gi, replacement: 'secret: ***'},
];

/**
 * 安全日志类
 */
class SecureLogger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 脱敏消息
   */
  private sanitize(message: string): string {
    if (!this.config.sanitizeEmails) {
      return message;
    }

    let sanitized = message;
    for (const {pattern, replacement} of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    return sanitized;
  }

  /**
   * 格式化日志消息
   */
  private format(level: string, tag: string, message: string, error?: Error): string {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitize(message);
    let formatted = `[${timestamp}] [${level}] [${tag}] ${sanitizedMessage}`;

    if (error && this.config.enableStackTrace) {
      formatted += `\n  ${error.stack || error.message}`;
    } else if (error) {
      formatted += `\n  ${error.name}: ${error.message}`;
    }

    return formatted;
  }

  /**
   * 调试日志（仅开发环境）
   */
  debug(tag: string, message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG && __DEV__) {
      const formatted = this.format('DEBUG', tag, message);
      console.log(formatted, ...args);
    }
  }

  /**
   * 信息日志（仅开发环境）
   */
  info(tag: string, message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO && __DEV__) {
      const formatted = this.format('INFO', tag, message);
      console.log(formatted, ...args);
    }
  }

  /**
   * 警告日志（所有环境）
   */
  warn(tag: string, message: string, error?: Error): void {
    if (this.config.level <= LogLevel.WARN) {
      const formatted = this.format('WARN', tag, message, error);
      console.warn(formatted);
    }
  }

  /**
   * 错误日志（所有环境）
   */
  error(tag: string, message: string, error?: Error): void {
    if (this.config.level <= LogLevel.ERROR) {
      const formatted = this.format('ERROR', tag, message, error);
      console.error(formatted);
    }
  }

  /**
   * 业务日志（用户操作，所有环境）
   * 用于记录重要的业务事件（如用户登录、注册）
   */
  log(tag: string, message: string, ...args: any[]): void {
    const formatted = this.format('LOG', tag, message);
    console.log(formatted, ...args);
  }
}

/**
 * 导出单例实例
 */
export const logger = new SecureLogger();

/**
 * 导出类型以供外部使用
 */
export type {LoggerConfig};
