import {authService, RegisterRequest, LoginRequest} from '../authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User} from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
  clear: jest.fn(),
}));

// Mock API
jest.mock('../api', () => ({
  userApi: {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  },
}));

const {userApi} = require('../api');

describe('AuthService', () => {
  const mockUser: User = {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth state
    authService['currentUser'] = null;
    authService['authToken'] = null;
    authService['authListeners'] = [];
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = authService;
      const instance2 = authService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('validateRegistrationData', () => {
    it('should validate correct registration data', () => {
      const result = (authService as any).validateRegistrationData(
        '张三',
        'zhangsan@example.com',
        'password123'
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid name', () => {
      const result = (authService as any).validateRegistrationData(
        '',
        'zhangsan@example.com',
        'password123'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('请输入有效的姓名（至少2个字符）');
    });

    it('should reject invalid email', () => {
      const result = (authService as any).validateRegistrationData(
        '张三',
        'invalid-email',
        'password123'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('请输入有效的邮箱地址');
    });

    it('should reject weak password', () => {
      const result = (authService as any).validateRegistrationData(
        '张三',
        'zhangsan@example.com',
        '123'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require password with both letters and numbers', () => {
      const result = (authService as any).validateRegistrationData(
        '张三',
        'zhangsan@example.com',
        'abcdefgh'
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(authService.isValidEmail('test@example.com')).toBe(true);
      expect(authService.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(authService.isValidEmail('')).toBe(false);
      expect(authService.isValidEmail('invalid')).toBe(false);
      expect(authService.isValidEmail('@example.com')).toBe(false);
      expect(authService.isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong password', () => {
      const result = authService.isValidPassword('password123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = authService.isValidPassword('pass1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码至少需要8个字符');
    });

    it('should reject password without letters', () => {
      const result = authService.isValidPassword('12345678');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码必须包含字母');
    });

    it('should reject password without numbers', () => {
      const result = authService.isValidPassword('abcdefgh');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码必须包含数字');
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when not authenticated', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return user when authenticated', () => {
      authService['currentUser'] = mockUser;
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('getAuthToken', () => {
    it('should return null when not authenticated', () => {
      expect(authService.getAuthToken()).toBeNull();
    });

    it('should return token when authenticated', () => {
      authService['authToken'] = 'mock-token';
      expect(authService.getAuthToken()).toBe('mock-token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', async () => {
      const result = await authService.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return true when authenticated', async () => {
      authService['currentUser'] = mockUser;
      const token = authService['generateToken'](mockUser);
      authService['authToken'] = token;

      const result = await authService.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when only user is set', async () => {
      authService['currentUser'] = mockUser;
      authService['authToken'] = null;

      const result = await authService.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false when only token is set', async () => {
      authService['currentUser'] = null;
      authService['authToken'] = 'mock-token';

      const result = await authService.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('isAuthenticatedSync', () => {
    it('should return false when not authenticated', () => {
      expect(authService.isAuthenticatedSync()).toBe(false);
    });

    it('should return true when authenticated', () => {
      authService['currentUser'] = mockUser;
      const token = authService['generateToken'](mockUser);
      authService['authToken'] = token;

      expect(authService.isAuthenticatedSync()).toBe(true);
    });

    it('should return false when only user is set', () => {
      authService['currentUser'] = mockUser;
      authService['authToken'] = null;

      expect(authService.isAuthenticatedSync()).toBe(false);
    });

    it('should return false when only token is set', () => {
      authService['currentUser'] = null;
      authService['authToken'] = 'mock-token';

      expect(authService.isAuthenticatedSync()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user data and token', async () => {
      authService['currentUser'] = mockUser;
      authService['authToken'] = 'mock-token';

      await authService.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@math_learning_auth_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@math_learning_user_data');
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getAuthToken()).toBeNull();
    });

    it('should notify auth listeners on logout', async () => {
      const listener = jest.fn();
      authService.onAuthStateChanged(listener);

      authService['currentUser'] = mockUser;
      authService['authToken'] = 'mock-token';

      await authService.logout();

      expect(listener).toHaveBeenLastCalledWith(null);
    });
  });

  describe('onAuthStateChanged', () => {
    it('should call listener immediately with current state', () => {
      authService['currentUser'] = mockUser;
      authService['authToken'] = 'mock-token';

      const listener = jest.fn();
      authService.onAuthStateChanged(listener);

      expect(listener).toHaveBeenCalledWith(mockUser);
    });

    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = authService.onAuthStateChanged(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should stop calling listener after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = authService.onAuthStateChanged(listener);

      unsubscribe();

      authService['notifyAuthListeners'](mockUser);
      expect(listener).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe('register', () => {
    it('should validate registration data before calling API', async () => {
      userApi.register.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const result = await authService.register('', 'invalid', 'short');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(userApi.register).not.toHaveBeenCalled();
    });

    it('should call API and set auth data on success', async () => {
      userApi.register.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const result = await authService.register('张三', 'zhangsan@example.com', 'password123');

      expect(userApi.register).toHaveBeenCalledWith({
        name: '张三',
        email: 'zhangsan@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(result.data?.token).toBeTruthy();
    });

    it('should handle API errors', async () => {
      userApi.register.mockResolvedValue({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: '该邮箱已被注册',
        },
      });

      const result = await authService.register('张三', 'zhangsan@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('该邮箱已被注册');
    });
  });

  describe('login', () => {
    it('should validate credentials before calling API', async () => {
      const result = await authService.login('', '');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(userApi.login).not.toHaveBeenCalled();
    });

    it('should call API and set auth data on success', async () => {
      userApi.login.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const result = await authService.login('zhangsan@example.com', 'password123');

      expect(userApi.login).toHaveBeenCalledWith({
        email: 'zhangsan@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
    });

    it('should handle API errors', async () => {
      userApi.login.mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
      });

      const result = await authService.login('zhangsan@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('邮箱或密码错误');
    });
  });

  describe('Token Security', () => {
    describe('generateToken', () => {
      it('should generate token with signature', () => {
        authService['currentUser'] = mockUser;
        const token = authService['generateToken'](mockUser);

        // Token should have two parts separated by dot
        const parts = token.split('.');
        expect(parts).toHaveLength(2);
        expect(parts[0]).toBeTruthy(); // base64 data
        expect(parts[1]).toBeTruthy(); // signature
      });

      it('should include expiry time in token', () => {
        authService['currentUser'] = mockUser;
        const now = Date.now();
        const token = authService['generateToken'](mockUser);

        const parts = token.split('.');
        const dataString = atob(parts[0]);
        const tokenData = JSON.parse(dataString);

        expect(tokenData.exp).toBeGreaterThan(now);
        expect(tokenData.exp).toBeLessThan(now + 8 * 24 * 60 * 60 * 1000); // Less than 8 days
      });

      it('should include user data in token', () => {
        authService['currentUser'] = mockUser;
        const token = authService['generateToken'](mockUser);

        const parts = token.split('.');
        const dataString = atob(parts[0]);
        const tokenData = JSON.parse(dataString);

        expect(tokenData.userId).toBe(mockUser.id);
        expect(tokenData.email).toBe(mockUser.email);
        expect(tokenData.v).toBe(1);
      });
    });

    describe('verifyToken', () => {
      it('should verify valid token', () => {
        authService['currentUser'] = mockUser;
        const token = authService['generateToken'](mockUser);

        const result = authService['verifyToken'](token);

        expect(result.valid).toBe(true);
        expect(result.userId).toBe(mockUser.id);
        expect(result.error).toBeUndefined();
      });

      it('should reject token with invalid signature', () => {
        const validToken = authService['generateToken'](mockUser);
        const tamperedToken = validToken.replace(/\.[^.]+$/, '.tampered');

        const result = authService['verifyToken'](tamperedToken);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('签名无效');
      });

      it('should reject expired token', () => {
        const expiredTokenData = {
          userId: mockUser.id,
          email: mockUser.email,
          iat: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          exp: Date.now() - 3 * 24 * 60 * 60 * 1000, // Expired 3 days ago
          v: 1,
        };

        const encodedData = btoa(JSON.stringify(expiredTokenData));
        const signature = authService['generateSignature'](JSON.stringify(expiredTokenData));
        const expiredToken = `${encodedData}.${signature}`;

        const result = authService['verifyToken'](expiredToken);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('过期');
      });

      it('should reject malformed token', () => {
        const result = authService['verifyToken']('invalid-token');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('格式无效');
      });

      it('should reject token with wrong version', () => {
        const wrongVersionData = {
          userId: mockUser.id,
          email: mockUser.email,
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
          v: 2, // Wrong version
        };

        const encodedData = btoa(JSON.stringify(wrongVersionData));
        const signature = authService['generateSignature'](JSON.stringify(wrongVersionData));
        const wrongVersionToken = `${encodedData}.${signature}`;

        const result = authService['verifyToken'](wrongVersionToken);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('版本不支持');
      });
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return false when no token exists', () => {
      authService['authToken'] = null;
      expect(authService.isTokenExpiringSoon()).toBe(false);
    });

    it('should return true when token expires within 24 hours', () => {
      const expiringTokenData = {
        userId: mockUser.id,
        email: mockUser.email,
        iat: Date.now() - 6 * 24 * 60 * 60 * 1000,
        exp: Date.now() + 12 * 60 * 60 * 1000, // Expires in 12 hours
        v: 1,
      };

      const encodedData = btoa(JSON.stringify(expiringTokenData));
      const signature = authService['generateSignature'](JSON.stringify(expiringTokenData));
      const expiringToken = `${encodedData}.${signature}`;

      authService['authToken'] = expiringToken;
      expect(authService.isTokenExpiringSoon()).toBe(true);
    });

    it('should return false when token has more than 24 hours', () => {
      const validTokenData = {
        userId: mockUser.id,
        email: mockUser.email,
        iat: Date.now(),
        exp: Date.now() + 5 * 24 * 60 * 60 * 1000, // Expires in 5 days
        v: 1,
      };

      const encodedData = btoa(JSON.stringify(validTokenData));
      const signature = authService['generateSignature'](JSON.stringify(validTokenData));
      const validToken = `${encodedData}.${signature}`;

      authService['authToken'] = validToken;
      expect(authService.isTokenExpiringSoon()).toBe(false);
    });
  });
});
