/**
 * StudyDataRepository 测试
 *
 * Story 6-4: 学习记录MySQL存储
 * AC1: 实现StudyDataRepository（Prisma）
 */

import {StudyDataRepository, ValidationError} from '../StudyDataRepository';
import {prisma, checkDatabaseConnection} from '../prismaClient';
import {Action} from '@prisma/client';

// Mock Prisma客户端
jest.mock('../prismaClient', () => ({
  prisma: {
    studyRecord: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  checkDatabaseConnection: jest.fn(),
}));

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockCheckDatabaseConnection = checkDatabaseConnection as jest.MockedFunction<typeof checkDatabaseConnection>;

describe('StudyDataRepository', () => {
  let repository: StudyDataRepository;

  beforeEach(() => {
    repository = new StudyDataRepository();
    jest.clearAllMocks();
  });

  describe('Task 1.1: CRUD操作', () => {
    describe('create - 创建学习记录', () => {
      it('should create study record with valid data', async () => {
        const mockRecord = {
          id: 1,
          recordId: 'test-record-1',
          childId: 'test-child-1',
          parentId: 'test-user-1',
          questionId: 'question-123',
          action: Action.practice,
          duration: 30000,
          correct: true,
          questionType: '加法',
          difficulty: 'easy',
          timestamp: new Date(),
        };

        (prisma.studyRecord.create as jest.Mock).mockResolvedValue(mockRecord);
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(true);

        const record = await repository.create({
          recordId: 'test-record-1',
          childId: 'test-child-1',
          parentId: 'test-user-1',
          questionId: 'question-123',
          action: Action.practice,
          duration: 30000,
          correct: true,
          questionType: '加法',
          difficulty: 'easy',
        });

        expect(record.recordId).toBe('test-record-1');
        expect(prisma.studyRecord.create).toHaveBeenCalledWith({
          data: {
            recordId: 'test-record-1',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-123',
            action: Action.practice,
            duration: 30000,
            correct: true,
            questionType: '加法',
            difficulty: 'easy',
          },
        });
      });

      it('should auto-generate recordId if not provided', async () => {
        const mockRecord = {
          id: 1,
          recordId: 'record_1234567890_abc123',
          childId: 'test-child-1',
          parentId: 'test-user-1',
          questionId: null,
          action: Action.upload,
          duration: 0,
          correct: null,
          questionType: null,
          difficulty: null,
          timestamp: new Date(),
        };

        (prisma.studyRecord.create as jest.Mock).mockResolvedValue(mockRecord);
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(true);

        await repository.create({
          childId: 'test-child-1',
          parentId: 'test-user-1',
          action: Action.upload,
        });

        expect(prisma.studyRecord.create).toHaveBeenCalled();
        const createCallArgs = (prisma.studyRecord.create as jest.Mock).mock.calls[0][0];
        expect(createCallArgs.data.recordId).toMatch(/^record_\d+_[a-z0-9]+$/);
      });

      it('should throw error when MySQL is unavailable', async () => {
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(false);

        await expect(
          repository.create({
            childId: 'test-child-1',
            parentId: 'test-user-1',
            action: Action.practice,
          })
        ).rejects.toThrow('MySQL不可用');
      });
    });

    describe('findByChildId - 按childId查询', () => {
      it('should find records by childId', async () => {
        const mockRecords = [
          {
            id: 1,
            recordId: 'record-1',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-1',
            action: Action.practice,
            duration: 30000,
            correct: true,
            questionType: '加法',
            difficulty: 'easy',
            timestamp: new Date(),
          },
          {
            id: 2,
            recordId: 'record-2',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-2',
            action: Action.review,
            duration: 20000,
            correct: false,
            questionType: '减法',
            difficulty: 'medium',
            timestamp: new Date(),
          },
        ];

        (prisma.studyRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

        const records = await repository.findByChildId('test-child-1');

        expect(records).toHaveLength(2);
        expect(records[0].childId).toBe('test-child-1');
        expect(prisma.studyRecord.findMany).toHaveBeenCalledWith({
          where: {childId: 'test-child-1'},
          orderBy: {timestamp: 'desc'},
        });
      });

      it('should return empty array when no records found', async () => {
        (prisma.studyRecord.findMany as jest.Mock).mockResolvedValue([]);

        const records = await repository.findByChildId('non-existent-child');

        expect(records).toHaveLength(0);
      });
    });

    describe('findByParentId - 按parentId查询', () => {
      it('should find records by parentId', async () => {
        const mockRecords = [
          {
            id: 1,
            recordId: 'record-1',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-1',
            action: Action.practice,
            duration: 30000,
            correct: true,
            questionType: '加法',
            difficulty: 'easy',
            timestamp: new Date(),
          },
        ];

        (prisma.studyRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

        const records = await repository.findByParentId('test-user-1');

        expect(records).toHaveLength(1);
        expect(prisma.studyRecord.findMany).toHaveBeenCalledWith({
          where: {parentId: 'test-user-1'},
          orderBy: {timestamp: 'desc'},
        });
      });
    });

    describe('findByAction - 按action筛选', () => {
      it('should filter records by action', async () => {
        const mockRecords = [
          {
            id: 1,
            recordId: 'record-1',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-1',
            action: Action.practice,
            duration: 30000,
            correct: true,
            questionType: '加法',
            difficulty: 'easy',
            timestamp: new Date(),
          },
          {
            id: 2,
            recordId: 'record-2',
            childId: 'test-child-2',
            parentId: 'test-user-1',
            questionId: 'question-2',
            action: Action.practice,
            duration: 20000,
            correct: false,
            questionType: '减法',
            difficulty: 'medium',
            timestamp: new Date(),
          },
        ];

        (prisma.studyRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

        const records = await repository.findByAction(Action.practice);

        expect(records.length).toBeGreaterThan(0);
        expect(records.every(r => r.action === Action.practice)).toBe(true);
        expect(prisma.studyRecord.findMany).toHaveBeenCalledWith({
          where: {action: Action.practice},
          orderBy: {timestamp: 'desc'},
        });
      });
    });

    describe('findByTimeRange - 时间范围查询', () => {
      it('should find records in time range', async () => {
        const mockRecords = [
          {
            id: 1,
            recordId: 'record-1',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-1',
            action: Action.practice,
            duration: 30000,
            correct: true,
            questionType: '加法',
            difficulty: 'easy',
            timestamp: new Date('2026-03-15'),
          },
        ];

        (prisma.studyRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

        const startDate = new Date('2026-03-01');
        const endDate = new Date('2026-03-31');
        const records = await repository.findByTimeRange(
          'test-child-1',
          startDate,
          endDate
        );

        expect(records.length).toBeGreaterThan(0);
        expect(prisma.studyRecord.findMany).toHaveBeenCalledWith({
          where: {
            childId: 'test-child-1',
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {timestamp: 'desc'},
        });
      });
    });

    describe('getStatistics - 统计查询', () => {
      it('should calculate statistics correctly', async () => {
        // Mock the count method
        (prisma.studyRecord.count as jest.Mock).mockResolvedValue(3);

        // Mock the groupBy method
        (prisma.studyRecord.groupBy as jest.Mock).mockResolvedValue([
          { action: 'practice', _count: { id: 2 } },
          { action: 'upload', _count: { id: 1 } },
        ]);

        // Mock the aggregate method
        (prisma.studyRecord.aggregate as jest.Mock).mockResolvedValue({
          _count: { id: 2 },
          _avg: { duration: 25000 },
        });

        // Mock count for correctCount calculation
        (prisma.studyRecord.count as jest.Mock)
          .mockResolvedValueOnce(3) // totalQuestions
          .mockResolvedValueOnce(1); // correctCount

        const stats = await repository.getStatistics('test-child-1');

        expect(stats.totalQuestions).toBe(3);
        expect(stats.correctCount).toBe(1);
        expect(stats.uploadCount).toBe(1);
        expect(stats.practiceCount).toBe(2);
        expect(stats.reviewCount).toBe(0);
        expect(stats.accuracy).toBe(0.5); // 1/2
        expect(stats.averageDuration).toBe(25000); // (30000+20000)/2
      });

      it('should return zero statistics when no records', async () => {
        // Mock all methods to return zero/empty values
        (prisma.studyRecord.count as jest.Mock).mockResolvedValue(0);
        (prisma.studyRecord.groupBy as jest.Mock).mockResolvedValue([]);
        (prisma.studyRecord.aggregate as jest.Mock).mockResolvedValue({
          _count: { id: 0 },
          _avg: { duration: null },
        });

        const stats = await repository.getStatistics('test-child-1');

        expect(stats.totalQuestions).toBe(0);
        expect(stats.correctCount).toBe(0);
        expect(stats.accuracy).toBe(0);
        expect(stats.averageDuration).toBe(0);
      });
    });

    describe('delete - 删除记录', () => {
      it('should delete record and return true', async () => {
        (prisma.studyRecord.delete as jest.Mock).mockResolvedValue({});

        const result = await repository.delete('record-1');

        expect(result).toBe(true);
        expect(prisma.studyRecord.delete).toHaveBeenCalledWith({
          where: {recordId: 'record-1'},
        });
      });

      it('should return false when delete fails', async () => {
        (prisma.studyRecord.delete as jest.Mock).mockRejectedValue(
          new Error('Record not found')
        );

        const result = await repository.delete('non-existent-record');

        expect(result).toBe(false);
      });
    });

    describe('exists - 检查记录存在', () => {
      it('should return true when record exists', async () => {
        (prisma.studyRecord.count as jest.Mock).mockResolvedValue(1);

        const exists = await repository.exists('record-1');

        expect(exists).toBe(true);
      });

      it('should return false when record does not exist', async () => {
        (prisma.studyRecord.count as jest.Mock).mockResolvedValue(0);

        const exists = await repository.exists('non-existent-record');

        expect(exists).toBe(false);
      });
    });
  });

  describe('Task 1.2: 数据验证', () => {
    describe('validateRecordData - duration验证', () => {
      it('should accept valid duration', async () => {
        const mockRecord = {
          id: 1,
          recordId: 'record-1',
          childId: 'test-child-1',
          parentId: 'test-user-1',
          questionId: null,
          action: Action.practice,
          duration: 30000,
          correct: null,
          questionType: null,
          difficulty: null,
          timestamp: new Date(),
        };

        (prisma.studyRecord.create as jest.Mock).mockResolvedValue(mockRecord);
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(true);

        await expect(
          repository.create({
            childId: 'test-child-1',
            parentId: 'test-user-1',
            action: Action.practice,
            duration: 30000,
          })
        ).resolves.toBeDefined();
      });

      it('should reject negative duration', async () => {
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(true);

        await expect(
          repository.create({
            childId: 'test-child-1',
            parentId: 'test-user-1',
            action: Action.practice,
            duration: -100,
          })
        ).rejects.toThrow(ValidationError);
      });

      it('should reject duration > 3600000', async () => {
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(true);

        await expect(
          repository.create({
            childId: 'test-child-1',
            parentId: 'test-user-1',
            action: Action.practice,
            duration: 4000000,
          })
        ).rejects.toThrow(ValidationError);

        // Verify error code
        try {
          await repository.create({
            childId: 'test-child-1',
            parentId: 'test-user-1',
            action: Action.practice,
            duration: 4000000,
          });
        } catch (error) {
          expect((error as ValidationError).code).toBe('DURATION_TOO_LONG');
        }
      });
    });

    describe('validateRecordData - difficulty验证', () => {
      it('should accept valid difficulty values', async () => {
        const mockRecord = {
          id: 1,
          recordId: 'record-1',
          childId: 'test-child-1',
          parentId: 'test-user-1',
          questionId: null,
          action: Action.practice,
          duration: 0,
          correct: null,
          questionType: null,
          difficulty: 'easy',
          timestamp: new Date(),
        };

        (prisma.studyRecord.create as jest.Mock).mockResolvedValue(mockRecord);
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(true);

        await expect(
          repository.create({
            childId: 'test-child-1',
            parentId: 'test-user-1',
            action: Action.practice,
            difficulty: 'easy',
          })
        ).resolves.toBeDefined();
      });

      it('should reject invalid difficulty', async () => {
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(true);

        await expect(
          repository.create({
            childId: 'test-child-1',
            parentId: 'test-user-1',
            action: Action.practice,
            difficulty: 'invalid',
          })
        ).rejects.toThrow(ValidationError);

        // Verify error code
        try {
          await repository.create({
            childId: 'test-child-1',
            parentId: 'test-user-1',
            action: Action.practice,
            difficulty: 'invalid',
          });
        } catch (error) {
          expect((error as ValidationError).code).toBe('INVALID_DIFFICULTY');
        }
      });
    });
  });

  describe('Task 1.3: 外键关系管理', () => {
    describe('findByParentIdAndChildId - 复合查询', () => {
      it('should use composite index for parent-child query', async () => {
        const mockRecords = [
          {
            id: 1,
            recordId: 'record-1',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-1',
            action: Action.practice,
            duration: 30000,
            correct: true,
            questionType: '加法',
            difficulty: 'easy',
            timestamp: new Date(),
          },
        ];

        (prisma.studyRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

        const records = await repository.findByParentIdAndChildId(
          'test-user-1',
          'test-child-1'
        );

        expect(records.length).toBeGreaterThan(0);
        expect(prisma.studyRecord.findMany).toHaveBeenCalledWith({
          where: {
            parentId: 'test-user-1',
            childId: 'test-child-1',
          },
          orderBy: {timestamp: 'desc'},
        });
      });
    });
  });

  describe('批量操作', () => {
    describe('createMany - 批量创建', () => {
      it('should create multiple records in transaction', async () => {
        const mockRecords = [
          {
            id: 1,
            recordId: 'record-1',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-1',
            action: Action.practice,
            duration: 30000,
            correct: true,
            questionType: '加法',
            difficulty: 'easy',
            timestamp: new Date(),
          },
          {
            id: 2,
            recordId: 'record-2',
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-2',
            action: Action.practice,
            duration: 20000,
            correct: false,
            questionType: '减法',
            difficulty: 'medium',
            timestamp: new Date(),
          },
        ];

        (prisma.$transaction as jest.Mock).mockResolvedValue(mockRecords);
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(true);

        const records = await repository.createMany([
          {
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-1',
            action: Action.practice,
            duration: 30000,
            correct: true,
          },
          {
            childId: 'test-child-1',
            parentId: 'test-user-1',
            questionId: 'question-2',
            action: Action.practice,
            duration: 20000,
            correct: false,
          },
        ]);

        expect(records).toHaveLength(2);
        expect(prisma.$transaction).toHaveBeenCalled();
      });

      it('should return empty array when input is empty', async () => {
        const records = await repository.createMany([]);

        expect(records).toHaveLength(0);
        expect(prisma.$transaction).not.toHaveBeenCalled();
      });

      it('should throw error when MySQL is unavailable', async () => {
        (mockCheckDatabaseConnection as jest.Mock).mockResolvedValue(false);

        await expect(
          repository.createMany([
            {
              childId: 'test-child-1',
              parentId: 'test-user-1',
              action: Action.practice,
            },
          ])
        ).rejects.toThrow('MySQL不可用');
      });
    });

    describe('deleteByChild - 级联删除', () => {
      it('should delete all records for a child', async () => {
        (prisma.studyRecord.deleteMany as jest.Mock).mockResolvedValue({count: 5});

        const count = await repository.deleteByChild('test-child-1');

        expect(count).toBe(5);
        expect(prisma.studyRecord.deleteMany).toHaveBeenCalledWith({
          where: {childId: 'test-child-1'},
        });
      });
    });

    describe('deleteByParent - 级联删除', () => {
      it('should delete all records for a parent', async () => {
        (prisma.studyRecord.deleteMany as jest.Mock).mockResolvedValue({count: 10});

        const count = await repository.deleteByParent('test-user-1');

        expect(count).toBe(10);
        expect(prisma.studyRecord.deleteMany).toHaveBeenCalledWith({
          where: {parentId: 'test-user-1'},
        });
      });
    });
  });
});
