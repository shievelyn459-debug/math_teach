/**
 * Prisma Client Service
 *
 * 提供类型安全的MySQL数据库访问
 * 单例模式管理数据库连接
 */

import { PrismaClient } from '@prisma/client';

/**
 * 全局Prisma实例类型声明
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * 解析DATABASE_URL并提取连接参数
 */
function parseDatabaseUrl(): { url: string; timeout?: number } {
  const databaseUrl = process.env.DATABASE_URL;

  // 启动时验证DATABASE_URL
  if (!databaseUrl) {
    throw new Error(
      '❌ DATABASE_URL环境变量未设置。\n' +
      '请在.env文件中配置DATABASE_URL，格式: mysql://用户名:密码@主机:端口/数据库名?参数\n' +
      '示例: DATABASE_URL="mysql://root:password@localhost:3306/mathlearning"'
    );
  }

  // 验证URL格式
  if (!databaseUrl.startsWith('mysql://') && !databaseUrl.startsWith('mysql+unix://')) {
    throw new Error(
      `❌ DATABASE_URL格式无效: 必须以mysql://或mysql+unix://开头\n` +
      `当前值: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}` // 隐藏密码
    );
  }

  // 从URL参数中提取timeout配置
  const urlObj = new URL(databaseUrl);
  const connectTimeout = urlObj.searchParams.get('connect_timeout');
  const timeout = connectTimeout ? parseInt(connectTimeout, 10) * 1000 : undefined; // 转换为毫秒

  return { url: databaseUrl, timeout };
}

// 解析数据库URL
const { url: parsedUrl, timeout } = parseDatabaseUrl();

/**
 * 创建或获取全局Prisma实例
 *
 * 在开发环境中，使用全局变量避免热重载创建多个实例
 * 在生产环境中，每次创建新实例
 *
 * 连接池配置通过DATABASE_URL参数控制:
 * - connection_limit: 连接池大小（默认10）
 * - pool_timeout: 连接池超时秒数（默认20）
 * - connect_timeout: 连接超时秒数（默认10）
 */
const prismaClient =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: parsedUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaClient;
}

/**
 * 导出Prisma客户端实例
 */
export const prisma = prismaClient;

/**
 * 睡眠函数（用于重试延迟）
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查数据库连接状态（带重试逻辑）
 *
 * @param maxRetries 最大重试次数（默认3次）
 * @param retryDelayMs 初始重试延迟毫秒数（默认1000ms）
 * @returns {Promise<boolean>} 连接是否正常
 */
export async function checkDatabaseConnection(
  maxRetries: number = 3,
  retryDelayMs: number = 1000
): Promise<boolean> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 添加超时控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutMs = timeout || 10000; // 默认10秒
        setTimeout(() => reject(new Error(`连接超时 (${timeoutMs}ms)`)), timeoutMs);
      });

      const result = await Promise.race([
        prisma.$queryRaw`SELECT 1 as result`,
        timeoutPromise,
      ]);

      console.log('[Database] ✅ 连接正常');
      return true;
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Database] ⚠️  连接尝试 ${attempt}/${maxRetries} 失败:`, (error as Error).message);

      // 最后一次尝试失败，不再重试
      if (attempt < maxRetries) {
        // 指数退避策略
        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        console.log(`[Database] 🔄 ${delay}ms 后重试...`);
        await sleep(delay);
      }
    }
  }

  console.error('[Database] ❌ 连接失败（已重试', maxRetries, '次）:', lastError?.message);
  return false;
}

/**
 * 优雅关闭数据库连接
 *
 * @returns {Promise<void>}
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('[Database] ✅ 已断开连接');
  } catch (error) {
    console.error('[Database] ❌ 断开连接时出错:', error);
    throw error; // 重新抛出错误以便调用者处理
  }
}

/**
 * 获取数据库连接统计信息
 *
 * @returns {Promise<object>} 连接统计
 */
export async function getDatabaseStats(): Promise<{
  connected: boolean;
  databaseName?: string;
  maxConnections?: number;
}> {
  try {
    // 检查连接
    await prisma.$queryRaw`SELECT 1 as result`;

    // 从DATABASE_URL解析数据库名称
    const urlObj = new URL(parsedUrl);
    const databaseName = urlObj.pathname.slice(1); // 移除开头的 '/'

    // 获取MySQL连接数限制（使用数据库无关的方式）
    try {
      const result = await prisma.$queryRaw<Array<{ max_connections: string }>>`
        SELECT @@max_connections as max_connections
      `;

      return {
        connected: true,
        databaseName,
        maxConnections: result?.[0]?.max_connections
          ? parseInt(result[0].max_connections, 10)
          : undefined,
      };
    } catch {
      // 如果查询失败，只返回基本信息
      return {
        connected: true,
        databaseName,
      };
    }
  } catch (error) {
    return {
      connected: false,
    };
  }
}

/**
 * Prisma事务包装器（带超时控制）
 *
 * 自动处理事务错误和日志
 *
 * @param callback 事务回调函数
 * @param options 事务选项
 * @returns {Promise<T>} 事务结果
 */
export async function transaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>,
  options?: {
    maxWait?: number;  // 等待事务连接的最大时间（毫秒，默认5000ms）
    timeout?: number;  // 事务执行超时时间（毫秒，默认10000ms）
  }
): Promise<T> {
  const maxWait = options?.maxWait || 5000;  // 默认5秒
  const timeout = options?.timeout || 10000; // 默认10秒

  try {
    console.log('[Transaction] 开始事务');
    const result = await prisma.$transaction(
      async (tx) => {
        return await callback(tx);
      },
      { maxWait, timeout }
    );
    console.log('[Transaction] ✅ 事务成功');
    return result;
  } catch (error) {
    console.error('[Transaction] ❌ 事务失败:', error);
    throw error;
  }
}

/**
 * 设置优雅关闭处理器
 *
 * 在进程终止时正确关闭数据库连接
 */
export function setupGracefulShutdown(): void {
  const shutdownHandler = async (signal: string) => {
    console.log(`\n[Database] 收到 ${signal} 信号，开始优雅关闭...`);
    try {
      await disconnectDatabase();
      console.log('[Database] ✅ 优雅关闭完成');
      process.exit(0);
    } catch (error) {
      console.error('[Database] ❌ 优雅关闭失败:', error);
      process.exit(1);
    }
  };

  // 监听终止信号
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));

  // 开发环境监听重启信号
  if (process.env.NODE_ENV !== 'production') {
    process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')); // nodemon
  }
}

/**
 * 导出类型
 */
export type { PrismaClient };

// 在模块加载时设置优雅关闭处理器
if (typeof process !== 'undefined') {
  setupGracefulShutdown();
}
