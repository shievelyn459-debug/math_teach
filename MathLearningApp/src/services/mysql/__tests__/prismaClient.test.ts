/**
 * Prisma Client Service Tests
 *
 * 测试MySQL数据库连接和基本操作
 */

import { prisma, checkDatabaseConnection, disconnectDatabase, transaction } from '../prismaClient';

// Mock环境变量
const mockDatabaseURL = process.env.DATABASE_URL;

describe('PrismaClient Service', () => {
  beforeAll(async () => {
    // 如果没有设置DATABASE_URL，跳过测试
    if (!mockDatabaseURL) {
      console.warn('⚠️  跳过测试: DATABASE_URL环境变量未设置');
      console.warn('   请在.env文件中配置MySQL数据库连接');
    }
  });

  afterAll(async () => {
    // 清理：断开连接
    if (mockDatabaseURL) {
      await disconnectDatabase();
    }
  });

  describe('连接测试', () => {
    it('应该成功连接到MySQL数据库', async () => {
      if (!mockDatabaseURL) {
        console.warn('跳过测试: 数据库未配置');
        return;
      }

      const isConnected = await checkDatabaseConnection();
      expect(isConnected).toBe(true);
    });

    it('数据库未配置时应该返回false', async () => {
      // 当有真实数据库时跳过此测试（需要mock Prisma client）
      if (mockDatabaseURL) {
        console.warn('跳过测试: 真实数据库环境下无法测试无效连接');
        return;
      }

      // 临时设置无效的DATABASE_URL
      const originalURL = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'invalid-connection-string';

      const isConnected = await checkDatabaseConnection();

      // 恢复环境变量
      process.env.DATABASE_URL = originalURL;

      expect(isConnected).toBe(false);
    });
  });

  describe('CRUD操作测试', () => {
    const testUserId = `test-user-${Date.now()}`;
    const testEmail = `test-${Date.now()}@example.com`;

    beforeAll(() => {
      if (!mockDatabaseURL) {
        console.warn('跳过CRUD测试: 数据库未配置');
      }
    });

    afterAll(async () => {
      if (mockDatabaseURL) {
        // 清理测试数据
        try {
          await prisma.user.deleteMany({
            where: {
              userId: { startsWith: 'test-user-' },
            },
          });
        } catch (error) {
          console.warn('清理测试数据失败:', error);
        }
      }
    });

    it('应该创建用户', async () => {
      if (!mockDatabaseURL) return;

      const user = await prisma.user.create({
        data: {
          userId: testUserId,
          email: testEmail,
          passwordHash: 'hashed_password',
          name: '测试用户',
        },
      });

      expect(user.userId).toBe(testUserId);
      expect(user.email).toBe(testEmail);
      expect(user.name).toBe('测试用户');
    });

    it('应该读取用户', async () => {
      if (!mockDatabaseURL) return;

      const found = await prisma.user.findUnique({
        where: { userId: testUserId },
      });

      expect(found).not.toBeNull();
      expect(found?.userId).toBe(testUserId);
    });

    it('应该更新用户', async () => {
      if (!mockDatabaseURL) return;

      const updated = await prisma.user.update({
        where: { userId: testUserId },
        data: { name: '更新后的用户' },
      });

      expect(updated.name).toBe('更新后的用户');
    });

    it('应该删除用户', async () => {
      if (!mockDatabaseURL) return;

      const deleted = await prisma.user.delete({
        where: { userId: testUserId },
      });

      expect(deleted.userId).toBe(testUserId);

      // 验证已删除
      const found = await prisma.user.findUnique({
        where: { userId: testUserId },
      });

      expect(found).toBeNull();
    });
  });

  describe('事务测试', () => {
    const transactionUserId = `transaction-test-${Date.now()}`;
    const transactionChildId = `transaction-child-${Date.now()}`;

    beforeAll(() => {
      if (!mockDatabaseURL) {
        console.warn('跳过事务测试: 数据库未配置');
      }
    });

    afterAll(async () => {
      if (mockDatabaseURL) {
        // 清理测试数据
        try {
          await prisma.child.deleteMany({
            where: {
              childId: transactionChildId,
            },
          });
          await prisma.user.deleteMany({
            where: {
              userId: transactionUserId,
            },
          });
        } catch (error) {
          console.warn('清理事务测试数据失败:', error);
        }
      }
    });

    it('应该支持事务操作', async () => {
      if (!mockDatabaseURL) return;

      // 使用事务包装器
      const result = await transaction(async (tx) => {
        // 创建用户
        const user = await tx.user.create({
          data: {
            userId: transactionUserId,
            email: `transaction-${Date.now()}@example.com`,
            passwordHash: 'hashed',
          },
        });

        // 创建孩子
        const child = await tx.child.create({
          data: {
            childId: transactionChildId,
            parentId: user.userId,
            name: '事务测试孩子',
            grade: '一年级',
          },
        });

        return { user, child };
      });

      expect(result.user.userId).toBe(transactionUserId);
      expect(result.child.childId).toBe(transactionChildId);
    });

    it('事务失败时应该回滚所有操作', async () => {
      if (!mockDatabaseURL) return;

      const invalidUserId = `invalid-transaction-${Date.now()}`;

      // 尝试创建无效数据（违反外键约束）
      await expect(
        transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              userId: invalidUserId,
              email: `invalid-${Date.now()}@example.com`,
              passwordHash: 'hashed',
            },
          });

          // 尝试创建孩子，但parentId不存在（这会成功，但后续会失败）
          await tx.child.create({
            data: {
              childId: `invalid-child-${Date.now()}`,
              parentId: 'non-existent-parent', // 这个不存在，应该失败
              name: '无效孩子',
              grade: '一年级',
            },
          });

          return { user };
        })
      ).rejects.toThrow();

      // 验证用户也没有被创建（事务回滚）
      const found = await prisma.user.findUnique({
        where: { userId: invalidUserId },
      });

      expect(found).toBeNull();
    });
  });

  describe('关系测试', () => {
    const relationUserId = `relation-test-${Date.now()}`;
    const relationChildId = `relation-child-${Date.now()}`;

    beforeAll(() => {
      if (!mockDatabaseURL) {
        console.warn('跳过关系测试: 数据库未配置');
      }
    });

    afterAll(async () => {
      if (mockDatabaseURL) {
        // 清理测试数据
        try {
          await prisma.studyRecord.deleteMany({
            where: { childId: relationChildId },
          });
          await prisma.child.deleteMany({
            where: { childId: relationChildId },
          });
          await prisma.user.deleteMany({
            where: { userId: relationUserId },
          });
        } catch (error) {
          console.warn('清理关系测试数据失败:', error);
        }
      }
    });

    it('应该支持一对多关系', async () => {
      if (!mockDatabaseURL) return;

      // 创建用户
      const user = await prisma.user.create({
        data: {
          userId: relationUserId,
          email: `relation-${Date.now()}@example.com`,
          passwordHash: 'hashed',
          children: {
            create: [
            {
              childId: relationChildId,
              name: '孩子1',
              grade: '一年级',
            },
            {
              childId: `relation-child-2-${Date.now()}`,
              name: '孩子2',
              grade: '二年级',
            },
          ],
        },
      },
      include: {
        children: true,
      },
    });

      expect(user.children).toHaveLength(2);
      expect(user.children[0].name).toBe('孩子1');
      expect(user.children[1].name).toBe('孩子2');
    });

    it('应该支持级联删除', async () => {
      if (!mockDatabaseURL) return;

      // 删除用户应该自动删除关联的孩子
      await prisma.user.delete({
        where: { userId: relationUserId },
      });

      // 验证孩子已被删除
      const children = await prisma.child.findMany({
        where: { parentId: relationUserId },
      });

      expect(children).toHaveLength(0);
    });
  });
});
