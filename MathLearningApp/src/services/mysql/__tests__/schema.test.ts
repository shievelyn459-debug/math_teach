/**
 * Prisma Schema Validation Tests
 *
 * 简单的Schema验证测试（不需要数据库连接）
 */

describe('Prisma Schema', () => {
  it('应该成功导入Prisma Client', () => {
    // 这个测试只验证Prisma Client可以正常导入
    expect(() => {
      require('../prismaClient');
    }).not.toThrow();
  });

  it('应该导出所有必需的函数', () => {
    const module = require('../prismaClient');

    expect(module.prisma).toBeDefined();
    expect(module.checkDatabaseConnection).toBeDefined();
    expect(module.disconnectDatabase).toBeDefined();
    expect(module.transaction).toBeDefined();
  });

  it('Prisma Client应该有正确的模型', () => {
    const { prisma } = require('../prismaClient');

    // 检查模型是否存在
    expect(prisma.user).toBeDefined();
    expect(prisma.child).toBeDefined();
    expect(prisma.studyRecord).toBeDefined();
    expect(prisma.generationHistory).toBeDefined();
  });
});
