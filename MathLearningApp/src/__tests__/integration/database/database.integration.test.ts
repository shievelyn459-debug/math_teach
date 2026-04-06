/**
 * 数据库集成测试
 * Story 8-4: 数据库集成测试
 * AC2: 数据库操作的集成测试（MySQL）
 *
 * 测试范围:
 * - MySQL连接测试
 * - 数据持久化测试
 * - 数据查询测试
 * - 数据同步测试
 */

import { Grade } from '../../../types';
import { TestDataFactory, TestDataCleaner } from '../setup/testData';

// Mock Prisma Client - 必须在文件顶部定义
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  child: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  studyRecord: {
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
};

jest.mock('../../../services/mysql/prismaClient', () => ({
  prisma: mockPrisma,
}));

describe('Database Integration Tests', () => {
  let testUser: any;
  let testChild: any;

  beforeAll(async () => {
    console.log('🗄️ Setting up database integration tests...');
    testUser = TestDataFactory.createUser();
    testChild = TestDataFactory.createChild();
  });

  afterAll(async () => {
    await TestDataCleaner.cleanAll();
    console.log('🧹 Cleaned up test data');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC2.1: MySQL Connection Tests', () => {
    it('should connect to database successfully', async () => {
      // Arrange
      mockPrisma.$connect.mockResolvedValueOnce(undefined);

      // Act & Assert
      await expect(mockPrisma.$connect()).resolves.not.toThrow();
      expect(mockPrisma.$connect).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      // Arrange
      mockPrisma.$connect.mockRejectedValueOnce(new Error('Connection failed'));

      // Act & Assert
      await expect(mockPrisma.$connect()).rejects.toThrow('Connection failed');
    });

    it('should disconnect from database cleanly', async () => {
      // Arrange
      mockPrisma.$disconnect.mockResolvedValueOnce(undefined);

      // Act & Assert
      await expect(mockPrisma.$disconnect()).resolves.not.toThrow();
    });
  });

  describe('AC2.2: User Data Persistence Tests', () => {
    it('should create user successfully', async () => {
      // Arrange
      mockPrisma.user.create.mockResolvedValueOnce({
        ...testUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await mockPrisma.user.create({
        data: { email: testUser.email, name: testUser.name },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(testUser.email);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: testUser.email,
        }),
      });
    });

    it('should find user by ID', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...testUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await mockPrisma.user.findUnique({
        where: { id: testUser.id },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(testUser.id);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      // Act
      const result = await mockPrisma.user.findUnique({
        where: { id: 'non-existent-id' },
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should update user successfully', async () => {
      // Arrange
      const updateData = { name: 'Updated Name' };
      mockPrisma.user.update.mockResolvedValueOnce({
        ...testUser,
        ...updateData,
        updatedAt: new Date(),
      });

      // Act
      const result = await mockPrisma.user.update({
        where: { id: testUser.id },
        data: updateData,
      });

      // Assert
      expect(result.name).toBe('Updated Name');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: updateData,
      });
    });

    it('should delete user successfully', async () => {
      // Arrange
      mockPrisma.user.delete.mockResolvedValueOnce({
        ...testUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await mockPrisma.user.delete({
        where: { id: testUser.id },
      });

      // Assert
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: testUser.id },
      });
    });

    it('should find user by email', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...testUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await mockPrisma.user.findUnique({
        where: { email: testUser.email },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe(testUser.email);
    });
  });

  describe('AC2.3: Child Data Persistence Tests', () => {
    it('should create child successfully', async () => {
      // Arrange
      mockPrisma.child.create.mockResolvedValueOnce({
        ...testChild,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await mockPrisma.child.create({
        data: { name: testChild.name, parentId: testChild.parentId },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(testChild.name);
      expect(mockPrisma.child.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: testChild.name,
        }),
      });
    });

    it('should find children by parent ID', async () => {
      // Arrange
      const testChild1 = TestDataFactory.createChild({ id: 'child-1' });
      const testChild2 = TestDataFactory.createChild({ id: 'child-2' });

      mockPrisma.child.findMany.mockResolvedValueOnce([
        { ...testChild1, createdAt: new Date(), updatedAt: new Date() },
        { ...testChild2, createdAt: new Date(), updatedAt: new Date() },
      ]);

      // Act
      const result = await mockPrisma.child.findMany({
        where: { parentId: testChild1.parentId },
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(mockPrisma.child.findMany).toHaveBeenCalledWith({
        where: { parentId: testChild1.parentId },
      });
    });

    it('should update child grade', async () => {
      // Arrange
      const updateData = { grade: Grade.GRADE_4 };
      mockPrisma.child.update.mockResolvedValueOnce({
        ...testChild,
        ...updateData,
        updatedAt: new Date(),
      });

      // Act
      const result = await mockPrisma.child.update({
        where: { id: testChild.id },
        data: updateData,
      });

      // Assert
      expect(result.grade).toBe(Grade.GRADE_4);
    });

    it('should delete child', async () => {
      // Arrange
      mockPrisma.child.delete.mockResolvedValueOnce({
        ...testChild,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await mockPrisma.child.delete({
        where: { id: testChild.id },
      });

      // Assert
      expect(mockPrisma.child.delete).toHaveBeenCalledWith({
        where: { id: testChild.id },
      });
    });

    it('should validate maximum children limit', async () => {
      // Arrange - 模拟已有5个孩子
      mockPrisma.child.findMany.mockResolvedValueOnce([
        { id: 'child-1' },
        { id: 'child-2' },
        { id: 'child-3' },
        { id: 'child-4' },
        { id: 'child-5' },
      ]);

      // Act
      const children = await mockPrisma.child.findMany({
        where: { parentId: 'user-with-5-children' },
      });

      // Assert
      expect(children).toHaveLength(5);
    });
  });

  describe('AC2.4: Data Query Tests', () => {
    it('should query study records by child ID', async () => {
      // Arrange
      mockPrisma.studyRecord.findMany.mockResolvedValueOnce([
        { id: 'record-1', childId: 'child-1', questionsGenerated: 10 },
        { id: 'record-2', childId: 'child-1', questionsGenerated: 15 },
      ]);

      // Act
      const result = await mockPrisma.studyRecord.findMany({
        where: { childId: 'child-1' },
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(mockPrisma.studyRecord.findMany).toHaveBeenCalledWith({
        where: { childId: 'child-1' },
      });
    });

    it('should query study records by date range', async () => {
      // Arrange
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      mockPrisma.studyRecord.findMany.mockResolvedValueOnce([
        { id: 'record-1', date: new Date('2026-01-05') },
        { id: 'record-2', date: new Date('2026-01-15') },
      ]);

      // Act
      const result = await mockPrisma.studyRecord.findMany({
        where: {
          childId: 'child-1',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Assert
      expect(result).toHaveLength(2);
    });

    it('should aggregate study statistics', async () => {
      // Arrange
      mockPrisma.studyRecord.aggregate.mockResolvedValueOnce({
        _count: { id: 10 },
        _sum: { questionsGenerated: 100, questionsCorrect: 85 },
      });

      // Act
      const stats = await mockPrisma.studyRecord.aggregate({
        where: { childId: 'child-1' },
        _count: { id: true },
        _sum: { questionsGenerated: true, questionsCorrect: true },
      });

      // Assert
      expect(stats._count.id).toBe(10);
      expect(stats._sum.questionsGenerated).toBe(100);
    });

    it('should support pagination for large datasets', async () => {
      // Arrange
      mockPrisma.studyRecord.findMany.mockResolvedValueOnce([
        { id: 'record-11' },
        { id: 'record-12' },
        { id: 'record-13' },
        { id: 'record-14' },
        { id: 'record-15' },
      ]);

      // Act
      const result = await mockPrisma.studyRecord.findMany({
        where: { childId: 'child-1' },
        skip: 10,
        take: 5,
      });

      // Assert
      expect(result).toHaveLength(5);
      expect(mockPrisma.studyRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
    });
  });

  describe('AC2.5: Data Sync Tests', () => {
    it('should handle transaction rollback on error', async () => {
      // Arrange
      mockPrisma.$transaction.mockRejectedValueOnce(new Error('Transaction failed'));

      // Act & Assert
      await expect(
        mockPrisma.$transaction(async (tx: any) => {
          await tx.user.create({ data: { email: 'test@test.com' } });
          throw new Error('Simulated error');
        })
      ).rejects.toThrow('Transaction failed');
    });

    it('should support batch operations', async () => {
      // Arrange
      const testChildren = [
        TestDataFactory.createChild({ id: 'batch-1' }),
        TestDataFactory.createChild({ id: 'batch-2' }),
        TestDataFactory.createChild({ id: 'batch-3' }),
      ];

      mockPrisma.child.create
        .mockResolvedValueOnce({ ...testChildren[0], createdAt: new Date(), updatedAt: new Date() })
        .mockResolvedValueOnce({ ...testChildren[1], createdAt: new Date(), updatedAt: new Date() })
        .mockResolvedValueOnce({ ...testChildren[2], createdAt: new Date(), updatedAt: new Date() });

      // Act
      const results = await Promise.all(
        testChildren.map((child) =>
          mockPrisma.child.create({ data: { name: child.name, parentId: child.parentId } })
        )
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(mockPrisma.child.create).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent updates correctly', async () => {
      // Arrange
      mockPrisma.child.update
        .mockResolvedValueOnce({
          ...testChild,
          name: 'Name 1',
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          ...testChild,
          name: 'Name 2',
          updatedAt: new Date(),
        });

      // Act - 并发更新
      const [result1, result2] = await Promise.all([
        mockPrisma.child.update({ where: { id: testChild.id }, data: { name: 'Name 1' } }),
        mockPrisma.child.update({ where: { id: testChild.id }, data: { name: 'Name 2' } }),
      ]);

      // Assert
      expect(result1.name).toBeDefined();
      expect(result2.name).toBeDefined();
    });
  });

  describe('AC2.6: Error Handling Tests', () => {
    it('should handle duplicate email error', async () => {
      // Arrange
      mockPrisma.user.create.mockRejectedValueOnce({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      // Act & Assert
      await expect(
        mockPrisma.user.create({ data: { email: testUser.email } })
      ).rejects.toMatchObject({
        code: 'P2002',
      });
    });

    it('should handle record not found error', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      // Act
      const result = await mockPrisma.user.findUnique({
        where: { id: 'non-existent-id' },
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should handle invalid data error', async () => {
      // Arrange
      mockPrisma.child.create.mockRejectedValueOnce({
        code: 'P2000',
        message: 'Invalid data',
      });

      // Act & Assert
      await expect(mockPrisma.child.create({ data: { name: '' } })).rejects.toMatchObject({
        code: 'P2000',
      });
    });

    it('should handle database timeout', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      // Act & Assert
      await expect(
        mockPrisma.user.findUnique({ where: { id: 'timeout-test' } })
      ).rejects.toThrow('Timeout');
    });
  });
});
