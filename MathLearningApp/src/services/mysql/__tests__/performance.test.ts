/**
 * UserDataRepository 性能测试
 *
 * Story 6-2: 用户数据MySQL存储
 *
 * 测试内容：
 * - CRUD操作性能
 * - 并发请求处理
 * - 批量操作性能
 */

import {userDataRepository} from '../UserDataRepository';
import {prisma} from '../prismaClient';

// Mock prisma client
jest.mock('../prismaClient', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as any;

describe('UserDataRepository Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD操作性能', () => {
    it('should create user within 100ms', async () => {
      const mockUser = {
        userId: 'perf-test',
        email: 'perf@example.com',
        passwordHash: 'hashed',
        name: '性能测试',
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockImplementation(() => {
        // 模拟数据库延迟（50ms）
        return new Promise(resolve => {
          setTimeout(() => resolve(mockUser), 50);
        });
      });

      const start = Date.now();
      await userDataRepository.create({
        userId: 'perf-test',
        email: 'perf@example.com',
        passwordHash: 'hashed',
        name: '性能测试',
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should find user by email within 50ms', async () => {
      const mockUser = {
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockUser), 20);
        });
      });

      const start = Date.now();
      await userDataRepository.findByEmail('test@example.com');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should update user within 100ms', async () => {
      const mockUser = {
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Updated User',
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockUser), 30);
        });
      });

      const start = Date.now();
      await userDataRepository.update('test-user', {name: 'Updated User'});
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should validate password within 50ms', async () => {
      mockPrisma.user.findUnique.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({
            passwordHash: 'hashed_password_123',
          }), 15);
        });
      });

      const start = Date.now();
      await userDataRepository.validatePassword('test-user', 'hashed_password_123');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('并发请求处理', () => {
    it('should handle 100 concurrent create requests', async () => {
      let requestCount = 0;

      mockPrisma.user.create.mockImplementation(() => {
        requestCount++;
        return new Promise(resolve => {
          setTimeout(() => resolve({
            userId: `concurrent-${requestCount}`,
            email: `concurrent${requestCount}@example.com`,
            passwordHash: 'hashed',
            name: 'User',
            id: requestCount,
            createdAt: new Date(),
            updatedAt: new Date(),
          }), Math.random() * 20); // 0-20ms随机延迟
        });
      });

      const requests = Array.from({length: 100}, (_, i) =>
        userDataRepository.create({
          userId: `concurrent-${i}`,
          email: `concurrent${i}@example.com`,
          passwordHash: 'hashed',
        })
      );

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled');

      // 允许5%失败
      expect(successful.length).toBeGreaterThan(95);
    });

    it('should handle 50 concurrent read requests', async () => {
      mockPrisma.user.findUnique.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({
            userId: 'test-user',
            email: 'test@example.com',
            name: 'Test User',
            id: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }), Math.random() * 10);
        });
      });

      const requests = Array.from({length: 50}, () =>
        userDataRepository.findByEmail('test@example.com')
      );

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled');

      // 读取操作应该全部成功
      expect(successful.length).toBe(50);
    });

    it('should handle mixed read/write operations concurrently', async () => {
      let opCount = 0;

      mockPrisma.user.findUnique.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({
            userId: 'test-user',
            email: 'test@example.com',
            name: 'Test User',
            id: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }), Math.random() * 15);
        });
      });

      mockPrisma.user.create.mockImplementation(() => {
        opCount++;
        return new Promise(resolve => {
          setTimeout(() => resolve({
            userId: `user-${opCount}`,
            email: `user${opCount}@example.com`,
            passwordHash: 'hashed',
            name: 'User',
            id: opCount,
            createdAt: new Date(),
            updatedAt: new Date(),
          }), Math.random() * 20);
        });
      });

      const operations: Promise<any>[] = [];

      // 25个读取操作
      for (let i = 0; i < 25; i++) {
        operations.push(userDataRepository.findByEmail('test@example.com'));
      }

      // 25个创建操作
      for (let i = 0; i < 25; i++) {
        operations.push(userDataRepository.create({
          userId: `user-${i}`,
          email: `user${i}@example.com`,
          passwordHash: 'hashed',
        }));
      }

      const results = await Promise.allSettled(operations);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBeGreaterThan(47); // 允许少量失败
    });
  });

  describe('批量操作性能', () => {
    it('should handle sequential creates efficiently', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        mockPrisma.user.create.mockResolvedValueOnce({
          userId: `seq-${i}`,
          email: `seq${i}@example.com`,
          passwordHash: 'hashed',
          name: 'User',
          id: i,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await userDataRepository.create({
          userId: `seq-${i}`,
          email: `seq${i}@example.com`,
          passwordHash: 'hashed',
        });
      }

      const duration = Date.now() - startTime;

      // 10次顺序操作应该在合理时间内完成（模拟环境下）
      expect(duration).toBeLessThan(500);
    });

    it('should handle multiple rapid email existence checks', async () => {
      mockPrisma.user.count.mockResolvedValue(0);

      const startTime = Date.now();

      const checks = Array.from({length: 50}, (_, i) =>
        userDataRepository.existsByEmail(`test${i}@example.com`)
      );

      await Promise.all(checks);

      const duration = Date.now() - startTime;

      // 50次并行检查应该很快
      expect(duration).toBeLessThan(200);
    });
  });

  describe('内存效率', () => {
    it('should not leak memory with repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 执行100次操作
      for (let i = 0; i < 100; i++) {
        mockPrisma.user.findUnique.mockResolvedValueOnce({
          userId: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await userDataRepository.findByEmail('test@example.com');
      }

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // 内存增长应该小于1MB
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });
});
