/**
 * ChildDataRepository Tests
 *
 * 测试孩子数据仓库的CRUD操作和验证功能
 */

import { ChildDataRepository, ValidationError } from '../ChildDataRepository';
import { Grade } from '../../../types';
import { prisma } from '../prismaClient';

// Mock环境变量
const mockDatabaseURL = process.env.DATABASE_URL;

describe('ChildDataRepository', () => {
  const repository = new ChildDataRepository();
  const testUserId = `test-user-${Date.now()}`;

  beforeAll(async () => {
    // 如果没有设置DATABASE_URL，跳过测试
    if (!mockDatabaseURL) {
      console.warn('⚠️  跳过测试: DATABASE_URL环境变量未设置');
      console.warn('   请在.env文件中配置MySQL数据库连接');
    } else {
      // 创建测试用户
      try {
        await prisma.user.create({
          data: {
            userId: testUserId,
            email: `test-${Date.now()}@example.com`,
            passwordHash: 'hashed',
          },
        });
      } catch (error) {
        console.warn('创建测试用户失败:', error);
      }
    }
  });

  afterAll(async () => {
    if (mockDatabaseURL) {
      // 清理测试数据
      try {
        await prisma.child.deleteMany({
          where: { parentId: testUserId },
        });
        await prisma.user.deleteMany({
          where: { userId: testUserId },
        });
      } catch (error) {
        console.warn('清理测试数据失败:', error);
      }
    }
  });

  describe('创建孩子', () => {
    it('应该成功创建孩子', async () => {
      if (!mockDatabaseURL) return;

      const childData = {
        name: '张小明',
        grade: Grade.GRADE_3,
        birthday: new Date('2017-05-15'),
        avatar: 'https://example.com/avatar.jpg',
      };

      const child = await repository.create(testUserId, childData);

      expect(child).toBeDefined();
      expect(child.id).toBeDefined();
      expect(child.parentId).toBe(testUserId);
      expect(child.name).toBe('张小明');
      expect(child.grade).toBe(Grade.GRADE_3);
      expect(child.birthday).toEqual(new Date('2017-05-15'));
    });

    it('应该拒绝无效的姓名（空字符串）', async () => {
      if (!mockDatabaseURL) return;

      const childData = {
        name: '  ',  // 只有空格
        grade: Grade.GRADE_1,
      };

      await expect(repository.create(testUserId, childData)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝无效的姓名（太短）', async () => {
      if (!mockDatabaseURL) return;

      const childData = {
        name: 'A',  // 少于2个字符
        grade: Grade.GRADE_1,
      };

      await expect(repository.create(testUserId, childData)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝无效的姓名（太长）', async () => {
      if (!mockDatabaseURL) return;

      const childData = {
        name: 'A'.repeat(51),  // 超过50个字符
        grade: Grade.GRADE_1,
      };

      await expect(repository.create(testUserId, childData)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝无效的生日（太小）', async () => {
      if (!mockDatabaseURL) return;

      const childData = {
        name: '测试孩子',
        grade: Grade.GRADE_1,
        birthday: new Date('2024-01-01'),  // 2岁
      };

      await expect(repository.create(testUserId, childData)).rejects.toThrow(ValidationError);
    });

    it('应该拒绝无效的生日（太大）', async () => {
      if (!mockDatabaseURL) return;

      const childData = {
        name: '测试孩子',
        grade: Grade.GRADE_6,
        birthday: new Date('2010-01-01'),  // 14岁
      };

      await expect(repository.create(testUserId, childData)).rejects.toThrow(ValidationError);
    });
  });

  describe('查询孩子', () => {
    const testChildId = `test-child-${Date.now()}`;

    beforeAll(async () => {
      if (!mockDatabaseURL) return;

      // 创建测试孩子
      try {
        await repository.create(testUserId, {
          name: '李小红',
          grade: Grade.GRADE_4,
          birthday: new Date('2016-08-20'),
        });
      } catch (error) {
        console.warn('创建测试孩子失败:', error);
      }
    });

    it('应该按父母ID查询所有孩子', async () => {
      if (!mockDatabaseURL) return;

      const children = await repository.findByParentId(testUserId);

      expect(children).toBeInstanceOf(Array);
      expect(children.length).toBeGreaterThan(0);
      expect(children[0].parentId).toBe(testUserId);
    });

    it('应该按年级筛选孩子', async () => {
      if (!mockDatabaseURL) return;

      const children = await repository.findByGrade(testUserId, Grade.GRADE_4);

      expect(children).toBeInstanceOf(Array);
      children.forEach(child => {
        expect(child.grade).toBe(Grade.GRADE_4);
      });
    });
  });

  describe('更新孩子', () => {
    let childId: string;

    beforeEach(async () => {
      if (!mockDatabaseURL) return;

      const child = await repository.create(testUserId, {
        name: '王大明',
        grade: Grade.GRADE_2,
      });
      childId = child.id;
    });

    it('应该成功更新孩子姓名', async () => {
      if (!mockDatabaseURL) return;

      const updated = await repository.update(childId, {
        name: '王小明',
      });

      expect(updated.name).toBe('王小明');
    });

    it('应该成功更新孩子年级', async () => {
      if (!mockDatabaseURL) return;

      const updated = await repository.update(childId, {
        grade: Grade.GRADE_3,
      });

      expect(updated.grade).toBe(Grade.GRADE_3);
    });
  });

  describe('删除孩子', () => {
    let childId: string;

    beforeEach(async () => {
      if (!mockDatabaseURL) return;

      const child = await repository.create(testUserId, {
        name: '待删除孩子',
        grade: Grade.GRADE_1,
      });
      childId = child.id;
    });

    it('应该成功删除孩子', async () => {
      if (!mockDatabaseURL) return;

      const deleted = await repository.delete(childId);

      expect(deleted).toBe(true);

      // 验证孩子已被删除
      const found = await repository.findByChildId(childId);
      expect(found).toBeNull();
    });
  });

  describe('批量操作', () => {
    it('应该批量创建孩子', async () => {
      if (!mockDatabaseURL) return;

      const childrenData = [
        { name: '批量1', grade: Grade.GRADE_1 },
        { name: '批量2', grade: Grade.GRADE_2 },
        { name: '批量3', grade: Grade.GRADE_3 },
      ];

      const created = await repository.createMany(testUserId, childrenData);

      expect(created).toHaveLength(3);
      expect(created[0].name).toBe('批量1');
      expect(created[1].name).toBe('批量2');
      expect(created[2].name).toBe('批量3');
    });

    it('应该删除父母的所有孩子', async () => {
      if (!mockDatabaseURL) return;

      // 创建一些孩子
      await repository.createMany(testUserId, [
        { name: '删除测试1', grade: Grade.GRADE_1 },
        { name: '删除测试2', grade: Grade.GRADE_2 },
      ]);

      // 删除所有孩子
      const count = await repository.deleteByParent(testUserId);

      expect(count).toBeGreaterThan(0);

      // 验证所有孩子已被删除
      const children = await repository.findByParentId(testUserId);
      expect(children).toHaveLength(0);
    });
  });

  describe('外键关系', () => {
    it('应该拒绝为不存在的父母创建孩子', async () => {
      if (!mockDatabaseURL) return;

      const nonExistentParentId = `non-existent-${Date.now()}`;

      await expect(
        repository.create(nonExistentParentId, {
          name: '测试孩子',
          grade: Grade.GRADE_1,
        })
      ).rejects.toThrow('Parent not found');
    });
  });
});

/**
 * Grade枚举转换测试
 */
describe('Grade枚举转换', () => {
  const { toPrismaGrade, fromPrismaGrade } = require('../utils/gradeMapping');

  it('应该将Application Grade转换为Prisma Grade', () => {
    expect(toPrismaGrade(Grade.GRADE_1)).toBe('一年级');
    expect(toPrismaGrade(Grade.GRADE_2)).toBe('二年级');
    expect(toPrismaGrade(Grade.GRADE_3)).toBe('三年级');
    expect(toPrismaGrade(Grade.GRADE_4)).toBe('四年级');
    expect(toPrismaGrade(Grade.GRADE_5)).toBe('五年级');
    expect(toPrismaGrade(Grade.GRADE_6)).toBe('六年级');
  });

  it('应该将Prisma Grade转换为Application Grade', () => {
    expect(fromPrismaGrade('一年级')).toBe(Grade.GRADE_1);
    expect(fromPrismaGrade('二年级')).toBe(Grade.GRADE_2);
    expect(fromPrismaGrade('三年级')).toBe(Grade.GRADE_3);
    expect(fromPrismaGrade('四年级')).toBe(Grade.GRADE_4);
    expect(fromPrismaGrade('五年级')).toBe(Grade.GRADE_5);
    expect(fromPrismaGrade('六年级')).toBe(Grade.GRADE_6);
  });

  it('应该是往返转换的', () => {
    const grades = [
      Grade.GRADE_1,
      Grade.GRADE_2,
      Grade.GRADE_3,
      Grade.GRADE_4,
      Grade.GRADE_5,
      Grade.GRADE_6,
    ];

    grades.forEach(grade => {
      const prismaGrade = toPrismaGrade(grade);
      const backToApplication = fromPrismaGrade(prismaGrade);
      expect(backToApplication).toBe(grade);
    });
  });
});
