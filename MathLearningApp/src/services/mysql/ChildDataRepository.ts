/**
 * Child Data Repository
 *
 * 提供孩子数据的MySQL持久化操作
 * 基于Prisma ORM实现类型安全的数据库访问
 */

import { prisma } from './prismaClient';
import { Child, Grade, ChildCreateRequest, ChildUpdateRequest } from '../../types';
import {
  toPrismaGrade,
  fromPrismaGrade,
  isValidPrismaGrade,
} from './utils/gradeMapping';

/**
 * Prisma Child模型类型（自动生成）
 */
type PrismaChild = {
  id: number;
  childId: string;
  parentId: string;
  name: string;
  grade: string;
  birthday: Date | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 数据验证错误
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 孩子数据仓库
 *
 * 提供完整的CRUD操作和高级查询功能
 */
export class ChildDataRepository {
  /**
   * 将Prisma Child转换为Application Child
   */
  private static toApplicationChild(prismaChild: PrismaChild): Child {
    return {
      id: prismaChild.childId,
      parentId: prismaChild.parentId,
      name: prismaChild.name,
      grade: fromPrismaGrade(prismaChild.grade),
      birthday: prismaChild.birthday || undefined,
      avatar: prismaChild.avatar || undefined,
      createdAt: prismaChild.createdAt,
      updatedAt: prismaChild.updatedAt,
    };
  }

  /**
   * 验证孩子数据
   */
  private static validateChildData(data: {
    name?: string;
    grade?: Grade;
    birthday?: Date | null;
  }): void {
    // 姓名验证：2-50字符
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        throw new ValidationError(
          'name',
          'INVALID_NAME',
          '姓名必须是2-50个字符'
        );
      }
      if (!trimmedName) {
        throw new ValidationError(
          'name',
          'EMPTY_NAME',
          '姓名不能为空或仅包含空格'
        );
      }
    }

    // 年级验证：通过Grade枚举类型保证
    if (data.grade !== undefined) {
      // Grade枚举已限制有效值
    }

    // 生日验证：5-12岁
    if (data.birthday !== undefined) {
      if (data.birthday) {
        const age = ChildDataRepository.calculateAge(data.birthday);
        if (age < 5 || age > 12) {
          throw new ValidationError(
            'birthday',
          'INVALID_AGE',
            '孩子年龄应在5-12岁之间'
          );
        }
      }
    }
  }

  /**
   * 计算年龄
   */
  private static calculateAge(birthday: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * 生成新的childId
   */
  private static generateChildId(): string {
    return `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== CRUD操作 ====================

  /**
   * 创建孩子
   *
   * @param parentId 父母ID
   * @param childData 孩子数据
   * @returns 创建的孩子数据
   */
  async create(
    parentId: string,
    childData: ChildCreateRequest
  ): Promise<Child> {
    // 验证数据
    ChildDataRepository.validateChildData(childData);

    // 检查父母是否存在
    const parentExists = await prisma.user.findUnique({
      where: { userId: parentId },
    });

    if (!parentExists) {
      throw new Error(`Parent not found: ${parentId}`);
    }

    // 生成childId
    const childId = ChildDataRepository.generateChildId();

    // 转换Grade枚举
    const prismaGrade = toPrismaGrade(childData.grade);

    // 创建孩子
    const prismaChild = await prisma.child.create({
      data: {
        childId,
        parentId,
        name: childData.name.trim(),
        grade: prismaGrade,
        birthday: childData.birthday || null,
        avatar: childData.avatar || null,
      },
    });

    console.log('[ChildDataRepository] Child created:', childId);

    return ChildDataRepository.toApplicationChild(prismaChild);
  }

  /**
   * 按childId查找孩子
   *
   * @param childId 孩子ID
   * @returns 孩子数据，如果不存在则返回null
   */
  async findByChildId(childId: string): Promise<Child | null> {
    const prismaChild = await prisma.child.findUnique({
      where: { childId },
    });

    if (!prismaChild) {
      return null;
    }

    return ChildDataRepository.toApplicationChild(prismaChild);
  }

  /**
   * 按父母ID查找所有孩子
   *
   * @param parentId 父母ID
   * @returns 孩子列表
   */
  async findByParentId(parentId: string): Promise<Child[]> {
    const prismaChildren = await prisma.child.findMany({
      where: { parentId },
      orderBy: { createdAt: 'asc' },
    });

    return prismaChildren.map(ChildDataRepository.toApplicationChild);
  }

  /**
   * 按年级筛选孩子
   *
   * @param parentId 父母ID
   * @param grade 年级
   * @returns 孩子列表
   */
  async findByGrade(parentId: string, grade: Grade): Promise<Child[]> {
    const prismaGrade = toPrismaGrade(grade);

    const prismaChildren = await prisma.child.findMany({
      where: {
        parentId,
        grade: prismaGrade,
      },
      orderBy: { createdAt: 'asc' },
    });

    return prismaChildren.map(ChildDataRepository.toApplicationChild);
  }

  /**
   * 更新孩子信息
   *
   * @param childId 孩子ID
   * @param updates 更新数据
   * @returns 更新后的孩子数据
   */
  async update(
    childId: string,
    updates: ChildUpdateRequest
  ): Promise<Child> {
    // 验证数据
    ChildDataRepository.validateChildData(updates);

    // 构建更新数据
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }

    if (updates.grade !== undefined) {
      updateData.grade = toPrismaGrade(updates.grade);
    }

    if (updates.birthday !== undefined) {
      updateData.birthday = updates.birthday;
    }

    if (updates.avatar !== undefined) {
      updateData.avatar = updates.avatar;
    }

    // 更新孩子
    const prismaChild = await prisma.child.update({
      where: { childId },
      data: updateData,
    });

    console.log('[ChildDataRepository] Child updated:', childId);

    return ChildDataRepository.toApplicationChild(prismaChild);
  }

  /**
   * 删除孩子
   *
   * @param childId 孩子ID
   * @returns 是否删除成功
   */
  async delete(childId: string): Promise<boolean> {
    try {
      await prisma.child.delete({
        where: { childId },
      });

      console.log('[ChildDataRepository] Child deleted:', childId);
      return true;
    } catch (error) {
      console.error('[ChildDataRepository] Failed to delete child:', error);
      return false;
    }
  }

  /**
   * 检查孩子是否存在
   *
   * @param childId 孩子ID
   * @returns 是否存在
   */
  async exists(childId: string): Promise<boolean> {
    const count = await prisma.child.count({
      where: { childId },
    });

    return count > 0;
  }

  /**
   * 统计父母的孩子数量
   *
   * @param parentId 父母ID
   * @returns 孩子数量
   */
  async countByParent(parentId: string): Promise<number> {
    return await prisma.child.count({
      where: { parentId },
    });
  }

  // ==================== 批量操作 ====================

  /**
   * 批量创建孩子（事务）
   *
   * @param parentId 父母ID
   * @param childrenData 孩子数据数组
   * @returns 创建的孩子数据数组
   */
  async createMany(
    parentId: string,
    childrenData: ChildCreateRequest[]
  ): Promise<Child[]> {
    if (childrenData.length === 0) {
      return [];
    }

    // 验证所有数据
    childrenData.forEach(data => ChildDataRepository.validateChildData(data));

    // 检查父母是否存在
    const parentExists = await prisma.user.findUnique({
      where: { userId: parentId },
    });

    if (!parentExists) {
      throw new Error(`Parent not found: ${parentId}`);
    }

    // 使用事务批量创建
    const createdChildren = await prisma.$transaction(
      childrenData.map((childData) =>
        prisma.child.create({
          data: {
            childId: ChildDataRepository.generateChildId(),
            parentId,
            name: childData.name.trim(),
            grade: toPrismaGrade(childData.grade),
            birthday: childData.birthday || null,
            avatar: childData.avatar || null,
          },
        })
      )
    );

    console.log(
      `[ChildDataRepository] Created ${createdChildren.length} children for parent: ${parentId}`
    );

    return createdChildren.map(ChildDataRepository.toApplicationChild);
  }

  /**
   * 删除父母的所有孩子（级联删除的替代方案）
   *
   * @param parentId 父母ID
   * @returns 删除的孩子数量
   */
  async deleteByParent(parentId: string): Promise<number> {
    const result = await prisma.child.deleteMany({
      where: { parentId },
    });

    console.log(
      `[ChildDataRepository] Deleted ${result.count} children for parent: ${parentId}`
    );

    return result.count;
  }
}

/**
 * 导出单例实例
 */
export const childDataRepository = new ChildDataRepository();
