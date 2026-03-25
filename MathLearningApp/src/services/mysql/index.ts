/**
 * MySQL Service Index
 *
 * 导出所有MySQL相关服务和类型
 */

// Prisma客户端服务
export { prisma, checkDatabaseConnection, disconnectDatabase, getDatabaseStats, transaction, setupGracefulShutdown } from './prismaClient';
export type { PrismaClient } from './prismaClient';

// 数据仓库
export { ChildDataRepository, childDataRepository, ValidationError } from './ChildDataRepository';

// 工具函数
export {
  toPrismaGrade,
  fromPrismaGrade,
  isValidPrismaGrade,
  getAllPrismaGrades,
  getAllApplicationGrades,
} from './utils/gradeMapping';

// Future data repositories will be exported here
// export { UserDataRepository, userDataRepository } from './UserDataRepository';
