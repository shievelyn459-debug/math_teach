import {prisma, transaction} from './prismaClient';
import {Prisma} from '@prisma/client';
import {User as PrismaUser} from '@prisma/client';
import {User} from '../../types';
import {validateEmail, validatePhone} from '../../utils/validationUtils';
import {isValidLanguage, isValidDifficulty} from '../../utils/constants';
import {UserNotFoundError, DatabaseError, ValidationError} from '../../utils/errors';
import {logger} from '../../utils/logger';

/**
 * 用户数据仓库
 * 提供用户CRUD操作和数据库访问
 *
 * Story 6-2: 用户数据MySQL存储
 *
 * 功能：
 * - 用户CRUD操作（创建、读取、更新、删除）
 * - 邮箱和userId查询
 * - 密码验证
 * - 失败登录尝试管理
 * - 事务支持
 */
export class UserDataRepository {
  /**
   * 创建新用户
   * @param data 用户数据
   * @returns 创建的用户
   * @throws {P2002} 邮箱重复时抛出唯一约束错误
   */
  async create(data: {
    userId: string;
    email: string;
    passwordHash: string;
    name?: string;
    phone?: string;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        userId: data.userId,
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        name: data.name?.trim(),
        phone: data.phone,
      },
    });

    return this.mapToApplicationUser(user);
  }

  /**
   * 按邮箱查找用户
   * @param email 邮箱地址
   * @returns 用户对象或null
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: {email: email.toLowerCase().trim()},
    });

    return user ? this.mapToApplicationUser(user) : null;
  }

  /**
   * 按邮箱查找用户（包含密码哈希）
   * 用于登录验证
   * @param email 邮箱地址
   * @returns 用户对象和密码哈希，或null
   */
  async findByEmailWithPassword(email: string): Promise<{user: User; passwordHash: string} | null> {
    const user = await prisma.user.findUnique({
      where: {email: email.toLowerCase().trim()},
    });

    if (!user) {
      return null;
    }

    return {
      user: this.mapToApplicationUser(user),
      passwordHash: user.passwordHash,
    };
  }

  /**
   * 按userId查找用户
   * @param userId 用户ID
   * @returns 用户对象或null
   */
  async findByUserId(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: {userId},
    });

    return user ? this.mapToApplicationUser(user) : null;
  }

  /**
   * 更新用户资料
   * @param userId 用户ID
   * @param data 更新数据
   * @returns 更新后的用户
   */
  async update(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      language?: string;
      difficulty?: string;
    }
  ): Promise<User> {
    // 修复P0-4: 添加显式的null/空检查，防止崩溃
    const updateData: any = {};

    if (data.name !== undefined && data.name !== null && data.name !== '') {
      updateData.name = data.name.trim();
    }

    if (data.phone !== undefined) {
      const phoneValidation = validatePhone(data.phone);
      if (phoneValidation.valid) {
        // 清理格式后存储（去除空格、括号等）
        updateData.phone = data.phone.replace(/[\s-()]/g, '');
      }
    }

    // 修复P1-4: 添加language和difficulty字段验证
    if (data.language !== undefined && data.language !== null && data.language !== '') {
      if (!isValidLanguage(data.language)) {
        throw new ValidationError('language', 'INVALID_LANGUAGE', `Invalid language code: ${data.language}`);
      }
      updateData.language = data.language;
    }

    if (data.difficulty !== undefined && data.difficulty !== null && data.difficulty !== '') {
      if (!isValidDifficulty(data.difficulty)) {
        throw new ValidationError('difficulty', 'INVALID_DIFFICULTY', `Invalid difficulty level: ${data.difficulty}`);
      }
      updateData.difficulty = data.difficulty;
    }

    const user = await prisma.user.update({
      where: {userId},
      data: updateData,
    });

    return this.mapToApplicationUser(user);
  }

  /**
   * 删除用户
   * @param userId 用户ID
   *
   * 注意：这会级联删除所有关联的孩子、学习记录和生成历史
   */
  async delete(userId: string): Promise<void> {
    await prisma.user.delete({
      where: {userId},
    });
  }

  /**
   * 验证密码
   * @param userId 用户ID
   * @param passwordHash 密码哈希
   * @returns 密码是否匹配
   */
  async validatePassword(userId: string, passwordHash: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: {userId},
      select: {passwordHash: true},
    });

    return user?.passwordHash === passwordHash;
  }

  /**
   * 更新最后登录时间
   * @param userId 用户ID
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {lastLoginAt: new Date()},
    });
  }

  /**
   * 记录失败登录尝试（增加计数器）
   * 修复P1-6: 添加整数溢出检查
   * @param userId 用户ID
   * @returns 更新后的失败尝试次数
   */
  async incrementFailedAttempts(userId: string): Promise<number> {
    const MAX_ATTEMPTS = 2147483647; // Max safe integer for signed 32-bit

    try {
      const user = await prisma.user.update({
        where: {userId},
        data: {
          failedLoginAttempts: {increment: 1},
        },
        select: {failedLoginAttempts: true},
      });

      // 修复P1-6: 检查是否接近最大值
      if (user.failedLoginAttempts >= MAX_ATTEMPTS - 1) {
        // 接近最大值，锁定账户
        await this.lockAccount(userId);
        logger.warn('UserDataRepository', `Failed attempts counter at max value, locking account`);
      }

      return user.failedLoginAttempts;
    } catch (error: any) {
      // 处理Prisma错误
      if (error.code === 'P2025') {
        throw new UserNotFoundError(userId);
      }
      throw error;
    }
  }

  /**
   * 清除失败登录尝试
   * @param userId 用户ID
   */
  async clearFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {
        failedLoginAttempts: 0,
        accountLocked: false,
      },
    });
  }

  /**
   * 锁定账户
   * @param userId 用户ID
   */
  async lockAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {accountLocked: true},
    });
  }

  /**
   * 检查账户是否被锁定
   * @param userId 用户ID
   * @returns 账户是否被锁定
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: {userId},
      select: {accountLocked: true},
    });

    return user?.accountLocked || false;
  }

  /**
   * 获取失败登录尝试次数
   * @param userId 用户ID
   * @returns 失败尝试次数
   */
  async getFailedAttempts(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: {userId},
      select: {failedLoginAttempts: true},
    });

    return user?.failedLoginAttempts || 0;
  }

  /**
   * 检查用户是否存在
   * @param email 邮箱地址
   * @returns 用户是否存在
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {email: email.toLowerCase().trim()},
    });

    return count > 0;
  }

  /**
   * 检查userId是否存在
   * @param userId 用户ID
   * @returns 用户是否存在
   */
  async existsByUserId(userId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {userId},
    });

    return count > 0;
  }

  /**
   * 将Prisma User映射到Application User
   * 修复P1-7: 添加email的空值检查
   * @param prismaUser Prisma User对象
   * @returns Application User对象
   */
  private mapToApplicationUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.userId,
      name: prismaUser.name || '',
      // 修复P1-7: 添加email的空值安全处理
      email: prismaUser.email || '',
      phone: prismaUser.phone || undefined,
      avatar: undefined, // Prisma暂不支持avatar字段
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}

// 导出单例
export const userDataRepository = new UserDataRepository();
