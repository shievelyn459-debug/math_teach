/**
 * 安全日志测试
 * 验证敏感数据过滤功能
 */

describe('Secure Logging', () => {
  const {__testing__} = require('../api');

  describe('Password Redaction', () => {
    it('should redact password in error logs', async () => {
      const testData = {
        message: 'Registration failed',
        userData: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecretPassword123',
        },
      };

      const redacted = __testing__.redactSensitiveData(testData);
      expect(JSON.stringify(redacted)).not.toContain('SecretPassword123');
      expect(JSON.stringify(redacted)).toContain('[REDACTED]');
    });
  });

  describe('Token Redaction', () => {
    it('should redact tokens in error logs', async () => {
      const testData = {
        message: 'Login failed',
        requestData: {
          email: 'test@example.com',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
        },
      };

      const redacted = __testing__.redactSensitiveData(testData);
      expect(JSON.stringify(redacted)).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret');
      expect(JSON.stringify(redacted)).toContain('[REDACTED]');
    });
  });

  describe('Multiple Sensitive Fields', () => {
    it('should redact all sensitive fields in nested objects', async () => {
      const testData = {
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
      };

      const redacted = __testing__.redactSensitiveData(testData);
      const redactedString = JSON.stringify(redacted);
      expect(redactedString).not.toContain('userPassword');
      expect(redactedString).not.toContain('secret-key-123');
      expect(redactedString).toContain('this-is-kept'); // Normal field should be kept
      expect(redactedString).toContain('[REDACTED]');
    });
  });
});
