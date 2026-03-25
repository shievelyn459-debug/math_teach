/**
 * UserDataRepository 单元测试
 *
 * Story 6-2: 用户数据MySQL存储
 *
 * 测试内容：
 * - CRUD操作
 * - 邮箱唯一性验证
 * - 密码验证
 * - 失败登录尝试管理
 * - 错误处理
 */

import {UserDataRepository, userDataRepository} from '../UserDataRepository';
import {prisma} from '../prismaClient';
import {User} from '../../../types';

// Mock expo-crypto for validation utils
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    HEX: 'hex',
  },
  digestStringAsync: jest.fn(),
  getRandomValues: jest.fn(),
}));

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

describe('UserDataRepository', () => {
  let repository: UserDataRepository;
  const mockUser = {
    id: 'test-user-id',
    userId: 'test-user-1',
    name: '测试用户',
    email: 'test@example.com',
    passwordHash: 'hashed_password_123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    repository = new UserDataRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create user with valid data', async () => {
      const expectedResult = {
        ...mockUser,
        email: 'test@example.com',
      };

      mockPrisma.user.create.mockResolvedValue(expectedResult);

      const result = await repository.create({
        userId: 'test-user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password_123',
        name: '测试用户',
      });

      expect(result).toEqual({
        id: 'test-user-1',
        name: '测试用户',
        email: 'test@example.com',
        phone: undefined,
        avatar: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          userId: 'test-user-1',
          email: 'test@example.com',
          passwordHash: 'hashed_password_123',
          name: '测试用户',
        },
      });
    });

    it('should normalize email to lowercase and trim', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await repository.create({
        userId: 'test-user-2',
        email: '  Test@Example.COM  ',
        passwordHash: 'hashed',
        name: '  测试用户  ',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          name: '测试用户',
        }),
      });
    });

    it('should create user with optional phone', async () => {
      const userWithPhone = {...mockUser, phone: '1234567890'};
      mockPrisma.user.create.mockResolvedValue(userWithPhone);

      const result = await repository.create({
        userId: 'test-user-3',
        email: 'phone@example.com',
        passwordHash: 'hashed',
        name: '电话用户',
        phone: '1234567890',
      });

      expect(result.phone).toBe('1234567890');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
      expect(result?.id).toBe('test-user-1'); // userId maps to id
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {email: 'test@example.com'},
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await repository.findByEmail('TEST@EXAMPLE.COM');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {email: 'test@example.com'},
      });
    });
  });

  describe('findByUserId', () => {
    it('should find user by userId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByUserId('test-user-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-user-1'); // userId maps to id
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
      });
    });

    it('should return null when userId not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserId('nonexistent-user');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user name', async () => {
      const updatedUser = {...mockUser, name: '更新后的用户'};
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update('test-user-1', {
        name: '更新后的用户',
      });

      expect(result.name).toBe('更新后的用户');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
        data: {name: '更新后的用户'},
      });
    });

    it('should update phone', async () => {
      const updatedUser = {...mockUser, phone: '9876543210'};
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update('test-user-1', {
        phone: '9876543210',
      });

      expect(result.phone).toBe('9876543210');
    });

    it('should update language', async () => {
      const updatedUser = {...mockUser};
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await repository.update('test-user-1', {
        language: 'en-US',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
        data: {language: 'en-US'},
      });
    });

    it('should trim name when updating', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await repository.update('test-user-1', {
        name: '  更新后的用户  ',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
        data: {name: '更新后的用户'},
      });
    });
  });

  describe('delete', () => {
    it('should delete user by userId', async () => {
      mockPrisma.user.delete.mockResolvedValue(undefined);

      await repository.delete('test-user-1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true when password matches', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        passwordHash: 'hashed_password_123',
      });

      const result = await repository.validatePassword('test-user-1', 'hashed_password_123');

      expect(result).toBe(true);
    });

    it('should return false when password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        passwordHash: 'hashed_password_123',
      });

      const result = await repository.validatePassword('test-user-1', 'wrong_password');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.validatePassword('nonexistent-user', 'any_password');

      expect(result).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login time', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await repository.updateLastLogin('test-user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
        data: {lastLoginAt: expect.any(Date)},
      });
    });
  });

  describe('incrementFailedAttempts', () => {
    it('should increment failed attempts', async () => {
      mockPrisma.user.update.mockResolvedValue({
        failedLoginAttempts: 1,
      });

      const result = await repository.incrementFailedAttempts('test-user-1');

      expect(result).toBe(1);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
        data: {
          failedLoginAttempts: {increment: 1},
        },
        select: {failedLoginAttempts: true},
      });
    });

    it('should increment from 1 to 2', async () => {
      mockPrisma.user.update.mockResolvedValue({
        failedLoginAttempts: 2,
      });

      const result = await repository.incrementFailedAttempts('test-user-1');

      expect(result).toBe(2);
    });
  });

  describe('clearFailedAttempts', () => {
    it('should clear failed attempts and unlock account', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await repository.clearFailedAttempts('test-user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
        data: {
          failedLoginAttempts: 0,
          accountLocked: false,
        },
      });
    });
  });

  describe('lockAccount', () => {
    it('should lock account', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await repository.lockAccount('test-user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
        data: {accountLocked: true},
      });
    });
  });

  describe('isAccountLocked', () => {
    it('should return true when account is locked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        accountLocked: true,
      });

      const result = await repository.isAccountLocked('test-user-1');

      expect(result).toBe(true);
    });

    it('should return false when account is not locked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        accountLocked: false,
      });

      const result = await repository.isAccountLocked('test-user-1');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.isAccountLocked('nonexistent-user');

      expect(result).toBe(false);
    });
  });

  describe('getFailedAttempts', () => {
    it('should return failed attempts count', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        failedLoginAttempts: 3,
      });

      const result = await repository.getFailedAttempts('test-user-1');

      expect(result).toBe(3);
    });

    it('should return 0 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.getFailedAttempts('nonexistent-user');

      expect(result).toBe(0);
    });
  });

  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await repository.existsByEmail('test@example.com');

      expect(result).toBe(true);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {email: 'test@example.com'},
      });
    });

    it('should return false when email does not exist', async () => {
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await repository.existsByEmail('nonexistent@example.com');

      expect(result).toBe(false);
    });

    it('should normalize email', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      await repository.existsByEmail('TEST@EXAMPLE.COM');

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {email: 'test@example.com'},
      });
    });
  });

  describe('existsByUserId', () => {
    it('should return true when userId exists', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await repository.existsByUserId('test-user-1');

      expect(result).toBe(true);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {userId: 'test-user-1'},
      });
    });

    it('should return false when userId does not exist', async () => {
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await repository.existsByUserId('nonexistent-user');

      expect(result).toBe(false);
    });
  });

  describe('mapToApplicationUser', () => {
    it('should map Prisma User to Application User correctly', async () => {
      const prismaUser = {
        id: 1,
        userId: 'test-user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        name: '测试用户',
        phone: '1234567890',
        language: 'zh-CN',
        difficulty: 'medium',
        notificationEnabled: true,
        failedLoginAttempts: 0,
        accountLocked: false,
        lastLoginAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.user.create.mockResolvedValue(prismaUser);

      const result = await repository.create({
        userId: 'test-user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        name: '测试用户',
        phone: '1234567890',
      });

      expect(result).toEqual({
        id: 'test-user-1',
        name: '测试用户',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    });

    it('should handle null name', async () => {
      const prismaUser = {
        id: 1,
        userId: 'test-user-2',
        email: 'test2@example.com',
        passwordHash: 'hashed',
        name: null,
        phone: null,
        language: 'zh-CN',
        difficulty: 'medium',
        notificationEnabled: true,
        failedLoginAttempts: 0,
        accountLocked: false,
        lastLoginAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.user.create.mockResolvedValue(prismaUser);

      const result = await repository.create({
        userId: 'test-user-2',
        email: 'test2@example.com',
        passwordHash: 'hashed',
      });

      expect(result.name).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should propagate Prisma unique constraint errors', async () => {
      const prismaError = new Error('Unique constraint violation');
      (prismaError as any).code = 'P2002';

      mockPrisma.user.create.mockRejectedValue(prismaError);

      await expect(repository.create({
        userId: 'test-user-3',
        email: 'existing@example.com',
        passwordHash: 'hashed',
      })).rejects.toThrow('Unique constraint violation');
    });

    it('should propagate Prisma not found errors', async () => {
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';

      mockPrisma.user.findUnique.mockRejectedValue(prismaError);

      await expect(repository.findByEmail('nonexistent@example.com')).rejects.toThrow('Record not found');
    });
  });
});
