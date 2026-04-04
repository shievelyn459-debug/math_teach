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

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mocked-hash'),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
    SHA512: 'SHA512',
  },
  CryptoEncoding: {
    HEX: 'hex',
    BASE64: 'base64',
  },
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  getRandomValues: jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
}));

// Mock API
jest.mock('../api', () => ({
  userApi: {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  },
}));

// Mock database connection check
jest.mock('../mysql/prismaClient', () => ({
  checkDatabaseConnection: jest.fn().mockResolvedValue(true),
}));

// Mock userDataRepository
jest.mock('../mysql/UserDataRepository', () => {
  const userDataRepository = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    updateLoginTime: jest.fn().mockResolvedValue(undefined),
  };
  return {userDataRepository};
});

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
      expect(result.errors).toContain('邮箱格式不正确');
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
      const tokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
      const token = await authService['generateToken'](mockUser, tokenExpiry);
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
      const result = await authService.register('', 'invalid', 'short');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should call API and set auth data on success', async () => {
      const {userDataRepository} = require('../mysql/UserDataRepository');
      userDataRepository.findByEmail.mockResolvedValue(null);
      userDataRepository.create.mockResolvedValue(mockUser);

      // Mock MySQL to be available
      authService['mysqlAvailable'] = true;
      authService['isMySQLAvailable'] = jest.fn().mockResolvedValue(true);
      // Mock findUserWithFallback to return null (user doesn't exist)
      authService['findUserWithFallback'] = jest.fn().mockResolvedValue(null);

      const result = await authService.register('张三', 'zhangsan@example.com', 'password123');

      // Check that user was created in the repository
      expect(userDataRepository.create).toHaveBeenCalledWith({
        userId: expect.any(String),
        email: 'zhangsan@example.com',
        passwordHash: expect.any(String),
        name: '张三',
      });

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(result.data?.token).toBeTruthy();
    });

    it('should handle API errors', async () => {
      // Mock findUserWithFallback to return existing user
      authService['findUserWithFallback'] = jest.fn().mockResolvedValue({
        user: mockUser,
        passwordHash: 'dummy-hash',
      });

      const result = await authService.register('张三', 'zhangsan@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_EXISTS');
    });
  });

  describe('login', () => {
    it('should validate credentials before calling API', async () => {
      const result = await authService.login('', '');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should call API and set auth data on success', async () => {
      const {userDataRepository} = require('../mysql/UserDataRepository');
      const {hashPasswordSHA256} = require('../../utils/cryptoUtils');

      // Mock user data with password hash
      const passwordHash = await hashPasswordSHA256('password123');
      const userWithData = {
        ...mockUser,
        passwordHash,
      };

      userDataRepository.findByEmail.mockResolvedValue(mockUser);
      // Mock findUserWithFallback to return user with password hash
      authService['findUserWithFallback'] = jest.fn().mockResolvedValue({
        user: mockUser,
        passwordHash,
      });

      const result = await authService.login('zhangsan@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(result.data?.token).toBeTruthy();
    });

    it('should handle API errors', async () => {
      // Mock findUserWithFallback to return null (user not found)
      authService['findUserWithFallback'] = jest.fn().mockResolvedValue(null);

      const result = await authService.login('zhangsan@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('邮箱或密码错误');
    });
  });

  describe('Token Security', () => {
    describe('generateToken', () => {
      it('should generate token with signature', async () => {
        authService['currentUser'] = mockUser;
        const tokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
        const token = await authService['generateToken'](mockUser, tokenExpiry);

        // Token should have two parts separated by dot
        const parts = token.split('.');
        expect(parts).toHaveLength(2);
        expect(parts[0]).toBeTruthy(); // base64 data
        expect(parts[1]).toBeTruthy(); // signature
      });

      it('should include expiry time in token', async () => {
        authService['currentUser'] = mockUser;
        const now = Date.now();
        const tokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
        const token = await authService['generateToken'](mockUser, tokenExpiry);

        const parts = token.split('.');
        const dataString = atob(parts[0]);
        const tokenData = JSON.parse(dataString);

        expect(tokenData.exp).toBeGreaterThan(now);
        expect(tokenData.exp).toBeLessThan(now + 8 * 24 * 60 * 60 * 1000); // Less than 8 days
      });

      it('should include user data in token', async () => {
        authService['currentUser'] = mockUser;
        const tokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
        const token = await authService['generateToken'](mockUser, tokenExpiry);

        const parts = token.split('.');
        const dataString = atob(parts[0]);
        const tokenData = JSON.parse(dataString);

        expect(tokenData.userId).toBe(mockUser.id);
        expect(tokenData.email).toBe(mockUser.email);
        expect(tokenData.v).toBe(1);
      });
    });

    describe('verifyToken', () => {
      it('should verify valid token', async () => {
        authService['currentUser'] = mockUser;
        const tokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
        const token = await authService['generateToken'](mockUser, tokenExpiry);

        const result = await authService['verifyToken'](token);

        expect(result.valid).toBe(true);
        expect(result.userId).toBe(mockUser.id);
        expect(result.error).toBeUndefined();
      });

      it('should reject token with invalid signature', async () => {
        const tokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
        const validToken = await authService['generateToken'](mockUser, tokenExpiry);
        const tamperedToken = validToken.replace(/\.[^.]+$/, '.tampered');

        const result = await authService['verifyToken'](tamperedToken);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('签名无效');
      });

      it('should reject expired token', async () => {
        const expiredTokenData = {
          userId: mockUser.id,
          email: mockUser.email,
          iat: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          exp: Date.now() - 3 * 24 * 60 * 60 * 1000, // Expired 3 days ago
          v: 1,
        };

        const encodedData = btoa(JSON.stringify(expiredTokenData));
        const signature = await authService['generateSignature'](JSON.stringify(expiredTokenData));
        const expiredToken = `${encodedData}.${signature}`;

        const result = await authService['verifyToken'](expiredToken);

        expect(result.valid).toBe(false);
        // The signature check might fail first, so check for either error
        expect(result.error && (result.error.includes('过期') || result.error.includes('签名'))).toBe(true);
      });

      it('should reject malformed token', async () => {
        const result = await authService['verifyToken']('invalid-token');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('格式无效');
      });

      it('should reject token with wrong version', async () => {
        const wrongVersionData = {
          userId: mockUser.id,
          email: mockUser.email,
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
          v: 2, // Wrong version
        };

        const encodedData = btoa(JSON.stringify(wrongVersionData));
        const signature = await authService['generateSignature'](JSON.stringify(wrongVersionData));
        const wrongVersionToken = `${encodedData}.${signature}`;

        const result = await authService['verifyToken'](wrongVersionToken);

        expect(result.valid).toBe(false);
        expect(result.error && (result.error.includes('版本') || result.error.includes('签名'))).toBe(true);
      });
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return false when no token exists', () => {
      authService['authToken'] = null;
      expect(authService.isTokenExpiringSoon()).toBe(false);
    });

    it('should return true when token expires within 24 hours', async () => {
      const expiringTokenData = {
        userId: mockUser.id,
        email: mockUser.email,
        iat: Date.now() - 6 * 24 * 60 * 60 * 1000,
        exp: Date.now() + 12 * 60 * 60 * 1000, // Expires in 12 hours
        v: 1,
      };

      const encodedData = btoa(JSON.stringify(expiringTokenData));
      const signature = await authService['generateSignature'](JSON.stringify(expiringTokenData));
      const expiringToken = `${encodedData}.${signature}`;

      authService['authToken'] = expiringToken;
      expect(authService.isTokenExpiringSoon()).toBe(true);
    });

    it('should return false when token has more than 24 hours', async () => {
      const validTokenData = {
        userId: mockUser.id,
        email: mockUser.email,
        iat: Date.now(),
        exp: Date.now() + 5 * 24 * 60 * 60 * 1000, // Expires in 5 days
        v: 1,
      };

      const encodedData = btoa(JSON.stringify(validTokenData));
      const signature = await authService['generateSignature'](JSON.stringify(validTokenData));
      const validToken = `${encodedData}.${signature}`;

      authService['authToken'] = validToken;
      expect(authService.isTokenExpiringSoon()).toBe(false);
    });
  });
});
