/**
 * DataMigrationService 测试
 *
 * Story 6-2: 数据迁移服务
 * 测试从AsyncStorage迁移到MySQL的功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataMigrationService, MigrationStatus } from '../DataMigrationService';
import { userDataRepository } from '../mysql/UserDataRepository';
import { checkDatabaseConnection } from '../mysql/prismaClient';
import { User } from '../../types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../mysql/UserDataRepository');
jest.mock('../mysql/prismaClient');

describe('DataMigrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default: database is connected
    (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== getAllLocalUsers 测试 ====================

  describe('getAllLocalUsers', () => {
    it('应该从AsyncStorage获取所有本地用户', async () => {
      const mockUser1 = {
        user: {
          id: 'user-1',
          name: '测试用户1',
          email: 'test1@example.com',
          phone: '1234567890',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        passwordHash: 'hash1',
      };

      const mockUser2 = {
        user: {
          id: 'user-2',
          name: '测试用户2',
          email: 'test2@example.com',
          phone: '0987654321',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        passwordHash: 'hash2',
      };

      jest.spyOn(AsyncStorage, 'getAllKeys').mockResolvedValue([
        '@math_learning_users_test1@example.com',
        '@math_learning_users_test2@example.com',
      ]);

      jest.spyOn(AsyncStorage, 'multiGet').mockResolvedValue([
        [
          '@math_learning_users_test1@example.com',
          JSON.stringify(mockUser1),
        ],
        [
          '@math_learning_users_test2@example.com',
          JSON.stringify(mockUser2),
        ],
      ]);

      const service = dataMigrationService as any;
      const users = await service.getAllLocalUsers();

      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('test1@example.com');
      expect(users[1].email).toBe('test2@example.com');
    });

    it('应该处理没有本地用户的情况', async () => {
      jest.spyOn(AsyncStorage, 'getAllKeys').mockResolvedValue([]);

      const service = dataMigrationService as any;
      const users = await service.getAllLocalUsers();

      expect(users).toEqual([]);
    });

    it('应该处理JSON解析错误', async () => {
      jest.spyOn(AsyncStorage, 'getAllKeys').mockResolvedValue([
        '@math_learning_users_test@example.com',
      ]);

      jest.spyOn(AsyncStorage, 'multiGet').mockResolvedValue([
        ['@math_learning_users_test@example.com', 'invalid json'],
      ]);

      const service = dataMigrationService as any;
      const users = await service.getAllLocalUsers();

      expect(users).toEqual([]);
    });
  });

  // ==================== migrateUser 测试 ====================

  describe('migrateUser', () => {
    it('应该成功迁移用户到MySQL', async () => {
      const userData = {
        user: {
          id: 'user-1',
          name: '测试用户',
          email: 'test@example.com',
          phone: '1234567890',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        passwordHash: 'hash123',
      };

      // Mock用户不存在于MySQL
      (userDataRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      // Mock创建成功
      (userDataRepository.create as jest.Mock).mockResolvedValue({} as any);

      const service = dataMigrationService as any;
      const result = await service.migrateUser('test@example.com', userData);

      expect(result.success).toBe(true);
      expect(userDataRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash123',
        name: '测试用户',
        phone: '1234567890',
      });
    });

    it('应该跳过已存在的用户', async () => {
      const userData = {
        user: {
          id: 'user-1',
          name: '测试用户',
          email: 'test@example.com',
          phone: '1234567890',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        passwordHash: 'hash123',
      };

      // Mock用户已存在
      (userDataRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
      } as any);

      const service = dataMigrationService as any;
      const result = await service.migrateUser('test@example.com', userData);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('User already exists in MySQL');
      expect(userDataRepository.create).not.toHaveBeenCalled();
    });

    it('应该处理迁移失败的情况', async () => {
      const userData = {
        user: {
          id: 'user-1',
          name: '测试用户',
          email: 'test@example.com',
          phone: '1234567890',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        passwordHash: 'hash123',
      };

      // Mock用户不存在
      (userDataRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      // Mock创建失败
      (userDataRepository.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const service = dataMigrationService as any;
      const result = await service.migrateUser('test@example.com', userData);

      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  // ==================== migrateToMySQL 测试 ====================

  describe('migrateToMySQL', () => {
    it('应该成功迁移所有用户', async () => {
      const mockUsers = [
        {
          email: 'test1@example.com',
          data: {
            user: {
              id: 'user-1',
              name: '测试用户1',
              email: 'test1@example.com',
              phone: '1234567890',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            passwordHash: 'hash1',
          },
        },
        {
          email: 'test2@example.com',
          data: {
            user: {
              id: 'user-2',
              name: '测试用户2',
              email: 'test2@example.com',
              phone: '0987654321',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            passwordHash: 'hash2',
          },
        },
      ];

      // Mock MySQL可用
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);

      // Mock用户不存在
      (userDataRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      // Mock创建成功
      (userDataRepository.create as jest.Mock).mockResolvedValue({} as any);

      // Mock获取本地用户
      jest.spyOn(dataMigrationService as any, 'getAllLocalUsers').mockResolvedValue(
        mockUsers
      );

      // Mock迁移用户
      jest
        .spyOn(dataMigrationService as any, 'migrateUser')
        .mockResolvedValue({ success: true });

      const status: MigrationStatus = await dataMigrationService.migrateToMySQL();

      expect(status.totalUsers).toBe(2);
      expect(status.migratedUsers).toBe(2);
      expect(status.failedUsers).toBe(0);
      expect(status.errors).toHaveLength(0);
    });

    it('应该在MySQL不可用时返回空状态', async () => {
      // Mock MySQL不可用
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(false);

      const status: MigrationStatus = await dataMigrationService.migrateToMySQL();

      expect(status.totalUsers).toBe(0);
      expect(status.migratedUsers).toBe(0);
      expect(status.failedUsers).toBe(0);
    });

    it('应该记录迁移失败的用户', async () => {
      const mockUsers = [
        {
          email: 'test1@example.com',
          data: {
            user: {
              id: 'user-1',
              name: '测试用户1',
              email: 'test1@example.com',
              phone: '1234567890',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            passwordHash: 'hash1',
          },
        },
      ];

      // Mock MySQL可用
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);

      // Mock用户不存在
      (userDataRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      // Mock创建失败
      (userDataRepository.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Mock获取本地用户
      jest.spyOn(dataMigrationService as any, 'getAllLocalUsers').mockResolvedValue(
        mockUsers
      );

      const status: MigrationStatus = await dataMigrationService.migrateToMySQL();

      expect(status.totalUsers).toBe(1);
      expect(status.migratedUsers).toBe(0);
      expect(status.failedUsers).toBe(1);
      expect(status.errors).toHaveLength(1);
      expect(status.errors[0].email).toBe('test1@example.com');
    });

    it('应该跳过已存在的用户', async () => {
      const mockUsers = [
        {
          email: 'test1@example.com',
          data: {
            user: {
              id: 'user-1',
              name: '测试用户1',
              email: 'test1@example.com',
              phone: '1234567890',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            passwordHash: 'hash1',
          },
        },
      ];

      // Mock MySQL可用
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);

      // Mock用户已存在
      (userDataRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'existing-user',
      } as any);

      // Mock获取本地用户
      jest.spyOn(dataMigrationService as any, 'getAllLocalUsers').mockResolvedValue(
        mockUsers
      );

      const status: MigrationStatus = await dataMigrationService.migrateToMySQL();

      expect(status.totalUsers).toBe(1);
      expect(status.migratedUsers).toBe(0);
      expect(status.skippedUsers).toBe(1);
      expect(status.failedUsers).toBe(0);
    });
  });

  // ==================== hasPendingMigration 测试 ====================

  describe('hasPendingMigration', () => {
    it('应该检测到有待迁移的用户', async () => {
      jest.spyOn(dataMigrationService as any, 'getAllLocalUsers').mockResolvedValue([
        { email: 'test@example.com', data: {} },
      ]);

      const hasPending = await dataMigrationService.hasPendingMigration();

      expect(hasPending).toBe(true);
    });

    it('应该检测到没有待迁移的用户', async () => {
      jest.spyOn(dataMigrationService as any, 'getAllLocalUsers').mockResolvedValue([]);

      const hasPending = await dataMigrationService.hasPendingMigration();

      expect(hasPending).toBe(false);
    });
  });

  // ==================== getPendingMigrationCount 测试 ====================

  describe('getPendingMigrationCount', () => {
    it('应该返回待迁移用户数量', async () => {
      const mockUsers = [
        { email: 'test1@example.com', data: {} },
        { email: 'test2@example.com', data: {} },
        { email: 'test3@example.com', data: {} },
      ];

      jest.spyOn(dataMigrationService as any, 'getAllLocalUsers').mockResolvedValue(
        mockUsers
      );

      const count = await dataMigrationService.getPendingMigrationCount();

      expect(count).toBe(3);
    });

    it('应该在没有待迁移用户时返回0', async () => {
      jest.spyOn(dataMigrationService as any, 'getAllLocalUsers').mockResolvedValue([]);

      const count = await dataMigrationService.getPendingMigrationCount();

      expect(count).toBe(0);
    });
  });
});
