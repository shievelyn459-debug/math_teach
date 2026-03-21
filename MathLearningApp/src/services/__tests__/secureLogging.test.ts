/**
 * 安全日志测试
 * 验证敏感数据过滤功能
 */

// Mock console before importing
let consoleErrorCalls: any[] = [];
const originalConsoleError = console.error;

beforeAll(() => {
  console.error = (...args: any[]) => {
    consoleErrorCalls.push(args);
  };
});

afterEach(() => {
  consoleErrorCalls = [];
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Secure Logging', () => {
  // Since the functions are not exported, we need to test them indirectly
  // through the API calls. This test file validates the behavior.

  describe('Password Redaction', () => {
    it('should redact password in error logs', async () => {
      const {userApi} = require('../api');

      // Mock a failing request with password data
      jest.spyOn(require('../api'), 'requestWithRetry').mockRejectedValue({
        message: 'Registration failed',
        userData: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecretPassword123',
        },
      });

      try {
        await userApi.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecretPassword123',
        });
      } catch (e) {
        // Expected to fail
      }

      // Check that password was redacted in logs
      const loggedData = JSON.stringify(consoleErrorCalls);
      expect(loggedData).not.toContain('SecretPassword123');
      expect(loggedData).toContain('[REDACTED]');
    });
  });

  describe('Token Redaction', () => {
    it('should redact tokens in error logs', async () => {
      const {userApi} = require('../api');

      jest.spyOn(require('../api'), 'requestWithRetry').mockRejectedValue({
        message: 'Login failed',
        requestData: {
          email: 'test@example.com',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
        },
      });

      try {
        await userApi.login({
          email: 'test@example.com',
          password: 'password123',
        });
      } catch (e) {
        // Expected to fail
      }

      const loggedData = JSON.stringify(consoleErrorCalls);
      expect(loggedData).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret');
      expect(loggedData).toContain('[REDACTED]');
    });
  });

  describe('Multiple Sensitive Fields', () => {
    it('should redact all sensitive fields in nested objects', async () => {
      const {userApi} = require('../api');

      jest.spyOn(require('../api'), 'requestWithRetry').mockRejectedValue({
        message: 'Request failed',
        config: {
          data: {
            user: {
              password: 'userPassword',
              apiKey: 'secret-key-123',
              normalField: 'this-is-kept',
            },
          },
        },
      });

      try {
        await userApi.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'password',
        });
      } catch (e) {
        // Expected
      }

      const loggedData = JSON.stringify(consoleErrorCalls);
      expect(loggedData).not.toContain('userPassword');
      expect(loggedData).not.toContain('secret-key-123');
      expect(loggedData).toContain('this-is-kept'); // Normal field should be kept
      expect(loggedData).toContain('[REDACTED]');
    });
  });
});
