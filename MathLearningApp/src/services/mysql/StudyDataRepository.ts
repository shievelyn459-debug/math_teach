/**
 * Study Data Repository
 *
 * Story 6-4: 学习记录MySQL存储
 *
 * 提供学习记录数据的MySQL持久化操作
 * 基于Prisma ORM实现类型安全的数据库访问
 */

import {prisma} from './prismaClient';
import {Action, StudyRecord as PrismaStudyRecord} from '@prisma/client';
import {logger} from '../../utils/logger';
import {checkDatabaseConnection} from './prismaClient';

// 常量定义
const MAX_DURATION_MS = 3600000; // 1小时
const MAX_CACHE_RECORDS = 1000; // 最大缓存记录数
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

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
 * 学习记录数据仓库
 *
 * 提供完整的CRUD操作和高级查询功能
 */
export class StudyDataRepository {
  /**
   * 将Application记录转换为Prisma记录
   */
  private static toPrismaRecord(data: {
    recordId: string;
    childId: string;
    parentId: string;
    questionId?: string;
    action: Action;
    duration?: number;
    correct?: boolean;
    questionType?: string;
    difficulty?: string;
  }) {
    return {
      recordId: data.recordId,
      childId: data.childId,
      parentId: data.parentId,
      questionId: data.questionId || null,
      action: data.action,
      duration: data.duration || 0,
      correct: data.correct || null,
      questionType: data.questionType || null,
      difficulty: data.difficulty || null,
    };
  }

  /**
   * 验证学习记录数据
   */
  private static validateRecordData(data: {
    action?: Action;
    duration?: number;
    difficulty?: string;
    questionType?: string;
  }): void {
    // Action验证：通过Action枚举类型保证
    if (data.action !== undefined) {
      // 运行时验证：防止绕过TypeScript检查
      const validActions: Action[] = ['upload', 'practice', 'review'];
      if (!validActions.includes(data.action)) {
        throw new ValidationError(
          'action',
          'INVALID_ACTION',
          `行为必须是upload/practice/review之一`
        );
      }
    }

    // Duration验证：必须 >= 0 且不能是NaN
    if (data.duration !== undefined) {
      if (typeof data.duration !== 'number' || Number.isNaN(data.duration)) {
        throw new ValidationError(
          'duration',
          'INVALID_DURATION',
          '时长必须是有效的数字'
        );
      }
      if (data.duration < 0) {
        throw new ValidationError(
          'duration',
          'NEGATIVE_DURATION',
          '时长必须是非负数'
        );
      }
      if (data.duration > MAX_DURATION_MS) {
        throw new ValidationError(
          'duration',
          'DURATION_TOO_LONG',
          `时长不能超过1小时（${MAX_DURATION_MS}毫秒）`
        );
      }
    }

    // Difficulty验证：必须是easy/medium/hard之一，且不能是空字符串
    if (data.difficulty !== undefined && data.difficulty !== null) {
      if (data.difficulty.trim() === '') {
        throw new ValidationError(
          'difficulty',
          'EMPTY_DIFFICULTY',
          '难度不能为空字符串'
        );
      }
      if (!VALID_DIFFICULTIES.includes(data.difficulty as any)) {
        throw new ValidationError(
          'difficulty',
          'INVALID_DIFFICULTY',
          `难度必须是${VALID_DIFFICULTIES.join(', ')}之一`
        );
      }
    }

    // QuestionType验证：不能是空字符串
    if (data.questionType !== undefined && data.questionType !== null) {
      if (data.questionType.trim() === '') {
        throw new ValidationError(
          'questionType',
          'EMPTY_QUESTION_TYPE',
          '题目类型不能为空字符串'
        );
      }
    }
  }

  /**
   * 生成新的recordId
   */
  private static generateRecordId(): string {
    return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== CRUD操作 ====================

  /**
   * 创建学习记录
   *
   * @param data 学习记录数据
   * @returns 创建的学习记录
   */
  async create(data: {
    recordId?: string;
    childId: string;
    parentId: string;
    questionId?: string;
    action: Action;
    duration?: number;
    correct?: boolean;
    questionType?: string;
    difficulty?: string;
  }): Promise<PrismaStudyRecord> {
    // 验证数据
    StudyDataRepository.validateRecordData(data);

    // 检查MySQL是否可用
    const isMySQLAvailable = await checkDatabaseConnection();
    if (!isMySQLAvailable) {
      throw new Error('MySQL不可用，无法创建学习记录');
    }

    // 生成recordId（如果未提供）
    const recordId = data.recordId || StudyDataRepository.generateRecordId();

    // 转换为Prisma格式
    const prismaData = StudyDataRepository.toPrismaRecord({
      ...data,
      recordId,
    });

    // 创建记录
    const record = await prisma.studyRecord.create({
      data: prismaData,
    });

    logger.info('StudyDataRepository', `Record created: ${recordId}`);
    return record;
  }

  /**
   * 按recordId查找记录
   *
   * @param recordId 记录ID
   * @returns 学习记录，如果不存在则返回null
   */
  async findByRecordId(recordId: string): Promise<PrismaStudyRecord | null> {
    const record = await prisma.studyRecord.findUnique({
      where: {recordId},
    });

    return record;
  }

  /**
   * 按childId查询所有记录
   *
   * @param childId 孩子ID
   * @returns 学习记录列表
   */
  async findByChildId(childId: string): Promise<PrismaStudyRecord[]> {
    const records = await prisma.studyRecord.findMany({
      where: {childId},
      orderBy: {timestamp: 'desc'},
    });

    return records;
  }

  /**
   * 按parentId查询所有记录
   *
   * @param parentId 家长ID
   * @returns 学习记录列表
   */
  async findByParentId(parentId: string): Promise<PrismaStudyRecord[]> {
    const records = await prisma.studyRecord.findMany({
      where: {parentId},
      orderBy: {timestamp: 'desc'},
    });

    return records;
  }

  /**
   * 按家长和孩子查询（使用复合索引）
   *
   * @param parentId 家长ID
   * @param childId 孩子ID
   * @returns 学习记录列表
   */
  async findByParentIdAndChildId(
    parentId: string,
    childId: string
  ): Promise<PrismaStudyRecord[]> {
    const records = await prisma.studyRecord.findMany({
      where: {
        parentId,
        childId,
      },
      orderBy: {timestamp: 'desc'},
    });

    return records;
  }

  /**
   * 按行为类型筛选
   *
   * @param action 行为类型
   * @returns 学习记录列表
   */
  async findByAction(action: Action): Promise<PrismaStudyRecord[]> {
    const records = await prisma.studyRecord.findMany({
      where: {action},
      orderBy: {timestamp: 'desc'},
    });

    return records;
  }

  /**
   * 时间范围查询
   *
   * @param childId 孩子ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 学习记录列表
   */
  async findByTimeRange(
    childId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PrismaStudyRecord[]> {
    const records = await prisma.studyRecord.findMany({
      where: {
        childId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {timestamp: 'desc'},
    });

    return records;
  }

  /**
   * 统计查询（优化版本 - 使用数据库聚合）
   *
   * Story 6-4 Code Review Fix: 使用数据库聚合代替内存过滤
   * 对于大数据量，这避免了将所有记录加载到内存
   *
   * @param childId 孩子ID
   * @returns 统计数据
   */
  async getStatistics(childId: string): Promise<{
    totalQuestions: number;
    correctCount: number;
    uploadCount: number;
    practiceCount: number;
    reviewCount: number;
    accuracy: number;
    averageDuration: number;
  }> {
    // 使用数据库聚合来计算统计数据，避免内存溢出
    const [
      totalResult,
      actionCounts,
      practiceStats,
    ] = await Promise.all([
      // 总记录数
      prisma.studyRecord.count({
        where: { childId },
      }),
      // 按action类型分组统计
      prisma.studyRecord.groupBy({
        by: ['action'],
        where: { childId },
        _count: { id: true },
      }),
      // 练习记录的统计（正确数和平均时长）
      prisma.studyRecord.aggregate({
        where: {
          childId,
          action: 'practice',
        },
        _count: { id: true },
        _avg: { duration: true },
      }),
    ]);

    // 从actionCounts中提取各类型计数
    const uploadCount = actionCounts.find(c => c.action === 'upload')?._count.id || 0;
    const practiceCount = actionCounts.find(c => c.action === 'practice')?._count.id || 0;
    const reviewCount = actionCounts.find(c => c.action === 'review')?._count.id || 0;

    // 计算练习记录的正确数
    const correctCount = await prisma.studyRecord.count({
      where: {
        childId,
        action: 'practice',
        correct: true,
      },
    });

    return {
      totalQuestions: totalResult,
      correctCount,
      uploadCount,
      practiceCount,
      reviewCount,
      accuracy: practiceCount > 0
        ? correctCount / practiceCount
        : 0,
      averageDuration: Math.round(practiceStats._avg.duration || 0),
    };
  }

  /**
   * 删除记录
   *
   * @param recordId 记录ID
   * @returns 是否删除成功
   */
  async delete(recordId: string): Promise<boolean> {
    try {
      await prisma.studyRecord.delete({
        where: {recordId},
      });

      logger.info('StudyDataRepository', `Record deleted: ${recordId}`);
      return true;
    } catch (error) {
      logger.error('StudyDataRepository', 'Failed to delete record', error as Error);
      return false;
    }
  }

  /**
   * 检查记录是否存在
   *
   * @param recordId 记录ID
   * @returns 是否存在
   */
  async exists(recordId: string): Promise<boolean> {
    const count = await prisma.studyRecord.count({
      where: {recordId},
    });

    return count > 0;
  }

  // ==================== 批量操作 ====================

  /**
   * 批量创建记录（事务）
   *
   * @param records 学习记录数组
   * @returns 创建的记录数组
   */
  async createMany(
    records: Array<{
      recordId?: string;
      childId: string;
      parentId: string;
      questionId?: string;
      action: Action;
      duration?: number;
      correct?: boolean;
    }>
  ): Promise<PrismaStudyRecord[]> {
    if (records.length === 0) {
      return [];
    }

    // 验证所有数据
    records.forEach(data => StudyDataRepository.validateRecordData({
      action: data.action,
      duration: data.duration,
      difficulty: undefined, // createMany不包含这些字段
      questionType: undefined,
    }));

    // 检查MySQL是否可用
    const isMySQLAvailable = await checkDatabaseConnection();
    if (!isMySQLAvailable) {
      throw new Error('MySQL不可用，无法创建学习记录');
    }

    // 使用事务批量创建
    const createdRecords = await prisma.$transaction(
      records.map((data) => {
        const recordId = data.recordId || StudyDataRepository.generateRecordId();
        return prisma.studyRecord.create({
          data: StudyDataRepository.toPrismaRecord({
            ...data,
            recordId,
          }),
        });
      })
    );

    logger.info(
      'StudyDataRepository',
      `Created ${createdRecords.length} study records`
    );

    return createdRecords;
  }

  /**
   * 删除孩子的所有记录（级联删除的替代方案）
   *
   * @param childId 孩子ID
   * @returns 删除的记录数量
   */
  async deleteByChild(childId: string): Promise<number> {
    const result = await prisma.studyRecord.deleteMany({
      where: {childId},
    });

    logger.info(
      'StudyDataRepository',
      `Deleted ${result.count} records for child: ${childId}`
    );

    return result.count;
  }

  /**
   * 删除家长的所有记录（级联删除的替代方案）
   *
   * @param parentId 家长ID
   * @returns 删除的记录数量
   */
  async deleteByParent(parentId: string): Promise<number> {
    const result = await prisma.studyRecord.deleteMany({
      where: {parentId},
    });

    logger.info(
      'StudyDataRepository',
      `Deleted ${result.count} records for parent: ${parentId}`
    );

    return result.count;
  }
}

/**
 * 导出单例实例
 */
export const studyDataRepository = new StudyDataRepository();
