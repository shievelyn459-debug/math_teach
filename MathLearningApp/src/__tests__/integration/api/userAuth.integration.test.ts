/**
 * 用户认证流程集成测试
 * Story 8-4: API集成测试
 * AC1: 关键API调用流程的集成测试覆盖
 *
 * 测试范围:
 * - 用户注册流程
 * - 用户登录流程
 * - 用户信息获取
 * - 用户登出流程
 */

import { authService } from '../../../services/authService';
import { TestDataFactory, TestDataCleaner } from '../setup/testData';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock MySQL相关
jest.mock('../../../services/mysql/prismaClient', () => ({
  checkDatabaseConnection: jest.fn(() => Promise.resolve(false)),
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock crypto utils
jest.mock('../../../utils/cryptoUtils', () => ({
  hashPasswordSHA256: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  timingSafeEqual: jest.fn((a, b) => a === b),
  generateSignatureSHA256: jest.fn(() => 'mock_signature'),
  generateSecureUUID: jest.fn(() => `uuid-${Date.now()}`),
}));

describe('User Authentication Flow Integration Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    console.log('🔐 Setting up authentication integration tests...');
  });

  afterAll(async () => {
    await TestDataCleaner.cleanAll();
    console.log('🧹 Cleaned up test data');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC1.1: User Registration Flow', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      testUser = TestDataFactory.createUser();

      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null); // 用户不存在
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const result = await authService.register({
        name: testUser.name,
        email: testUser.email,
        password: 'Test123!@#',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(result.data?.token).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // 模拟用户已存在
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          id: 'existing-user',
          email: 'duplicate@test.com',
          name: 'Existing User',
        })
      );

      // Act
      const result = await authService.register({
        name: 'Duplicate User',
        email: 'duplicate@test.com',
        password: 'Test123!@#',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_EXISTS');
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidEmail = 'invalid-email';

      // Act
      const result = await authService.register({
        name: 'Test User',
        email: invalidEmail,
        password: 'Test123!@#',
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it('should validate password strength', async () => {
      // Arrange
      const weakPassword = '123';

      // Act
      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: weakPassword,
      });

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('AC1.2: User Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test1@example.com',
        password: 'Test123!@#',
      };

      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const { hashPasswordSHA256 } = require('../../../utils/cryptoUtils');

      // 模拟用户存在
      hashPasswordSHA256.mockResolvedValueOnce('hashed_Test123!@#');
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          id: 'test-user-1',
          email: credentials.email,
          name: 'Test User',
          passwordHash: 'hashed_Test123!@#',
        })
      );
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test1@example.com',
        password: 'wrongpassword',
      };

      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const { hashPasswordSHA256 } = require('../../../utils/cryptoUtils');

      hashPasswordSHA256.mockResolvedValueOnce('hashed_wrongpassword');
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          id: 'test-user-1',
          email: credentials.email,
          name: 'Test User',
          passwordHash: 'hashed_correctpassword',
        })
      );

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'Test123!@#',
      };

      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('AC1.3: User Info Management', () => {
    it('should get current user info', async () => {
      // Arrange
      testUser = TestDataFactory.createUser();

      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(testUser));

      // Act
      const result = authService.getCurrentUser();

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe(testUser.email);
    });

    it('should return null when no user logged in', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      // Act
      const result = authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });

    it('should update user profile', async () => {
      // Arrange
      testUser = TestDataFactory.createUser();
      const updateData = { name: 'Updated Name' };

      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(testUser));
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const result = await authService.updateProfile(updateData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('AC1.4: Logout Flow', () => {
    it('should successfully logout', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.multiRemove.mockResolvedValueOnce(undefined);

      // Act & Assert
      await expect(authService.logout()).resolves.not.toThrow();
    });

    it('should clear user data after logout', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.multiRemove.mockResolvedValueOnce(undefined);

      // Act
      await authService.logout();

      // Assert
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('AC1.5: Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      // Act
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password',
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle corrupted user data', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce('invalid json');

      // Act
      const result = authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('AC1.6: Performance Validation', () => {
    it('should complete registration within acceptable time', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const startTime = Date.now();
      await authService.register({
        name: 'Performance Test',
        email: 'perf@test.com',
        password: 'Test123!@#',
      });
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(5000);
    });

    it('should complete login within acceptable time', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const { hashPasswordSHA256 } = require('../../../utils/cryptoUtils');

      hashPasswordSHA256.mockResolvedValueOnce('hashed_password');
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          id: 'test-user',
          email: 'test@test.com',
          passwordHash: 'hashed_password',
        })
      );
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const startTime = Date.now();
      await authService.login({
        email: 'test@test.com',
        password: 'password',
      });
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(3000);
    });
  });
});
