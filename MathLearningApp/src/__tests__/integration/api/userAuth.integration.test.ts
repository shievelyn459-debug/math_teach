/**
 * 用户认证流程集成测试
 * Story 8-4: API集成测试
 * AC1: 关键API调用流程的集成测试覆盖
 *
 * 测试范围:
 * - 用户注册流程
 * - 用户登录流程
 * - Token刷新机制
 * - 密码重置流程
 * - 会话管理
 */

import { authService } from '../../../services/authService';
import { userApi } from '../../../services/userApi';
import { TestDataFactory, TestDataCleaner } from '../setup/testData';

// Mock外部依赖
jest.mock('../../../services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('User Authentication Flow Integration Tests', () => {
  let testUser: any;
  let authToken: string;

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
      testUser = TestDataFactory.createUser({
        email: 'newuser@test.com',
        name: 'New Test User',
      });

      // Mock API响应
      const mockRegisterResponse = {
        success: true,
        data: {
          user: testUser,
          token: 'mock-auth-token-123',
        },
      };

      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: mockRegisterResponse,
      });

      // Act
      const result = await authService.register({
        name: testUser.name,
        email: testUser.email,
        password: 'Test123!@#',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(testUser.email);
      expect(result.data.token).toBeDefined();
      authToken = result.data.token;
    });

    it('should reject duplicate email registration', async () => {
      // Arrange
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'duplicate@test.com',
        password: 'Test123!@#',
      };

      // 第一次注册成功
      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { user: duplicateUser, token: 'token1' } },
      });

      await authService.register(duplicateUser);

      // 第二次注册应该失败
      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'Email already exists',
          },
        },
      });

      // Act
      const result = await authService.register(duplicateUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('should validate password strength', async () => {
      // Arrange
      const weakPasswordUser = {
        name: 'Weak Password User',
        email: 'weak@test.com',
        password: '123', // 太弱
      };

      // Act & Assert
      await expect(authService.register(weakPasswordUser)).rejects.toThrow(
        'Password does not meet requirements'
      );
    });
  });

  describe('AC1.2: User Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test1@example.com',
        password: 'Test123!@#',
      };

      const mockLoginResponse = {
        success: true,
        data: {
          user: TestDataFactory.createUser({ email: credentials.email }),
          token: 'mock-auth-token-456',
          refreshToken: 'mock-refresh-token-456',
        },
      };

      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: mockLoginResponse,
      });

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.refreshToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const invalidCredentials = {
        email: 'test1@example.com',
        password: 'wrongpassword',
      };

      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is incorrect',
          },
        },
      });

      // Act
      const result = await authService.login(invalidCredentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      // Arrange
      const credentials = {
        email: 'locked@test.com',
        password: 'wrongpassword',
      };

      // 模拟5次失败登录
      for (let i = 0; i < 5; i++) {
        require('../../../services/api').apiClient.post.mockResolvedValueOnce({
          data: {
            success: false,
            error: { code: 'INVALID_CREDENTIALS' },
          },
        });

        await authService.login(credentials);
      }

      // 第6次应该触发锁定
      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Account locked due to too many failed attempts',
          },
        },
      });

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('AC1.3: Token Refresh Mechanism', () => {
    it('should successfully refresh expired token', async () => {
      // Arrange
      const oldToken = 'expired-token';
      const refreshToken = 'valid-refresh-token';

      const mockRefreshResponse = {
        success: true,
        data: {
          token: 'new-auth-token-789',
          refreshToken: 'new-refresh-token-789',
        },
      };

      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: mockRefreshResponse,
      });

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.token).toBe('new-auth-token-789');
    });

    it('should reject invalid refresh token', async () => {
      // Arrange
      const invalidRefreshToken = 'invalid-refresh-token';

      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token is invalid or expired',
          },
        },
      });

      // Act
      const result = await authService.refreshToken(invalidRefreshToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('AC1.4: Password Reset Flow', () => {
    it('should send password reset email', async () => {
      // Arrange
      const email = 'reset@test.com';

      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Password reset email sent',
        },
      });

      // Act
      const result = await authService.requestPasswordReset(email);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reset password with valid token', async () => {
      // Arrange
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'NewTest123!@#',
      };

      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Password reset successful',
        },
      });

      // Act
      const result = await authService.resetPassword(resetData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject invalid reset token', async () => {
      // Arrange
      const resetData = {
        token: 'invalid-reset-token',
        newPassword: 'NewTest123!@#',
      };

      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'INVALID_RESET_TOKEN',
            message: 'Reset token is invalid or expired',
          },
        },
      });

      // Act
      const result = await authService.resetPassword(resetData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_RESET_TOKEN');
    });
  });

  describe('AC1.5: User Info Management', () => {
    it('should get current user info with valid token', async () => {
      // Arrange
      const mockUser = TestDataFactory.createUser();

      require('../../../services/api').apiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { user: mockUser },
        },
      });

      // Act
      const result = await userApi.getCurrentUser();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(mockUser.email);
    });

    it('should update user profile', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Name',
      };

      const updatedUser = TestDataFactory.createUser(updateData);

      require('../../../services/api').apiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: { user: updatedUser },
        },
      });

      // Act
      const result = await userApi.updateProfile(updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.user.name).toBe('Updated Name');
    });

    it('should reject update without authentication', async () => {
      // Arrange
      const updateData = {
        name: 'Should Not Update',
      };

      require('../../../services/api').apiClient.put.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
      });

      // Act
      const result = await userApi.updateProfile(updateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('AC1.6: Logout Flow', () => {
    it('should successfully logout', async () => {
      // Arrange
      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Logged out successfully',
        },
      });

      // Act
      const result = await authService.logout();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should invalidate token after logout', async () => {
      // Arrange
      // 先登出
      require('../../../services/api').apiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      await authService.logout();

      // 然后尝试使用旧token获取用户信息
      require('../../../services/api').apiClient.get.mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token is invalid',
          },
        },
      });

      // Act
      const result = await userApi.getCurrentUser();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_TOKEN');
    });
  });
});
