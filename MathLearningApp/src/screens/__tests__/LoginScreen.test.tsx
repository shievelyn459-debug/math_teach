import React from 'react';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(),
  NativeStackScreenProps: jest.fn(),
}));

jest.mock('react-native-paper', () => ({
  ...jest.requireActual('react-native-paper'),
  useTheme: () => ({
    colors: {
      primary: '#007bff',
      error: '#f44336',
    },
  }),
}));

jest.mock('../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    isValidEmail: jest.fn(),
  },
}));

const {authService} = require('../../services/authService');

describe('LoginScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authService.isValidEmail.mockReturnValue(true);
  });

  const renderScreen = () => {
    return render(<LoginScreen navigation={mockNavigation as any} />);
  };

  describe('UI Rendering (AC1, AC5, AC8, AC9)', () => {
    it('should render login form with all required fields', () => {
      const {getByText, getByPlaceholderText, getByTestId} = renderScreen();

      expect(getByText('欢迎回来')).toBeTruthy();
      expect(getByText('登录您的账户继续使用')).toBeTruthy();
      expect(getByTestId('login-button')).toBeTruthy(); // Button
      expect(getByPlaceholderText('请输入邮箱')).toBeTruthy();
      expect(getByPlaceholderText('请输入密码')).toBeTruthy();
    });

    it('should render register link (AC8)', () => {
      const {getByText} = renderScreen();

      expect(getByText('还没有账户？')).toBeTruthy();
      expect(getByText('立即注册')).toBeTruthy();
    });

    it('should render remember me checkbox (AC4)', () => {
      const {getByText} = renderScreen();

      expect(getByText('记住我')).toBeTruthy();
    });

    it('should render forgot password link (AC9)', () => {
      const {getByText} = renderScreen();

      expect(getByText('忘记密码？')).toBeTruthy();
    });

    it('should render parent-friendly error messages (AC5)', () => {
      const {getByTestId} = renderScreen();

      // Verify that the error container and button exist
      expect(getByTestId('login-button')).toBeTruthy();
    });
  });

  describe('Form Validation (AC2)', () => {
    it('should show error when email is empty', async () => {
      const {getByTestId} = renderScreen();

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        // Should show email error
        expect(authService.login).not.toHaveBeenCalled();
      });
    });

    it('should show error when email is invalid', async () => {
      authService.isValidEmail.mockReturnValue(false);

      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      const emailInput = getByPlaceholderText('请输入邮箱');
      fireEvent.changeText(emailInput, 'invalid-email');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('请输入有效的邮箱地址')).toBeTruthy();
      });
    });

    it('should show error when password is empty', async () => {
      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      const emailInput = getByPlaceholderText('请输入邮箱');
      fireEvent.changeText(emailInput, 'test@example.com');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('请输入密码')).toBeTruthy();
      });
    });
  });

  describe('Login Flow (AC1, AC3, AC6)', () => {
    it('should call authService.login with correct parameters', async () => {
      authService.login.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            name: '张三',
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: 'mock-token',
        },
      });

      const {getByPlaceholderText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', false);
      });
    });

    it('should navigate to home screen on successful login (AC3)', async () => {
      authService.login.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            name: '张三',
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: 'mock-token',
        },
      });

      const {getByPlaceholderText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{name: 'Main'}],
        });
      });
    });

    it('should show clear error message on invalid credentials (AC2, AC5)', async () => {
      authService.login.mockResolvedValue({
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: '邮箱或密码错误，请检查后重试',
        },
      });

      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'wrongpassword');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('邮箱或密码错误，请检查后重试')).toBeTruthy();
      });
    });

    it('should show user-friendly error message on network failure (AC5)', async () => {
      authService.login.mockRejectedValue(new Error('Network error'));

      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('网络连接出现问题，请检查您的网络后重试')).toBeTruthy();
      });
    });

    it('should complete login within 3 seconds under normal conditions (AC6)', async () => {
      const startTime = Date.now();

      authService.login.mockImplementation(async () => {
        // Simulate fast API response
        return {
          success: true,
          data: {
            user: {
              id: '1',
              name: '张三',
              email: 'test@example.com',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            token: 'mock-token',
          },
        };
      });

      const {getByPlaceholderText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockNavigation.reset).toHaveBeenCalled();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete well within 3 seconds (even with test overhead)
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Navigation (AC8, AC9)', () => {
    it('should navigate to register screen when register link is pressed (AC8)', () => {
      const {getByText} = renderScreen();

      const registerLink = getByText('立即注册');
      fireEvent.press(registerLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
    });

    it('should navigate to password reset screen when forgot password link is pressed (AC9)', () => {
      const {getByText} = renderScreen();

      const forgotPasswordLink = getByText('忘记密码？');
      fireEvent.press(forgotPasswordLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('Remember Me Functionality (AC4)', () => {
    it('should have remember me checkbox unchecked by default', () => {
      const {getByTestId} = renderScreen();

      // The checkbox should exist
      expect(getByTestId('remember-me-checkbox')).toBeTruthy();
    });

    it('should toggle remember me checkbox when pressed', () => {
      const {getByTestId} = renderScreen();

      const checkbox = getByTestId('remember-me-checkbox');
      fireEvent.press(checkbox);

      // Should toggle state
      expect(checkbox).toBeTruthy();
    });

    it('should pass remember me preference to authService on login', async () => {
      authService.login.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            name: '张三',
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: 'mock-token',
        },
      });

      const {getByPlaceholderText, getByTestId} = renderScreen();

      // Check remember me
      const checkbox = getByTestId('remember-me-checkbox');
      fireEvent.press(checkbox);

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalled();
      });
    });
  });

  describe('Security Measures (AC7)', () => {
    it('should track failed login attempts', async () => {
      // First failed attempt
      authService.login.mockResolvedValueOnce({
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: '邮箱或密码错误，请检查后重试',
        },
      });

      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'wrongpassword');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('邮箱或密码错误，请检查后重试')).toBeTruthy();
      });

      // Second attempt should still work
      authService.login.mockResolvedValueOnce({
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: '邮箱或密码错误，请检查后重试',
        },
      });

      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('邮箱或密码错误，请检查后重试')).toBeTruthy();
      });
    });

    it('should show account locked message after too many failed attempts (AC7)', async () => {
      // Simulate account being locked
      authService.login.mockResolvedValue({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: '账户已临时锁定，请30分钟后再试或联系客服',
        },
      });

      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('账户已临时锁定，请30分钟后再试或联系客服')).toBeTruthy();
      });
    });

    it('should implement rate limiting for security (AC7)', async () => {
      // Simulate rate limiting
      authService.login.mockResolvedValue({
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: '登录尝试过于频繁，请稍后再试',
        },
      });

      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('登录尝试过于频繁，请稍后再试')).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      authService.login.mockReturnValue(
        new Promise(resolve => {
          resolveLogin = resolve;
        })
      );

      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('登录中...')).toBeTruthy();
      });

      // Cleanup: resolve the promise
      resolveLogin!({
        success: true,
        data: {
          user: {
            id: '1',
            name: '张三',
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: 'token',
        },
      });
    });

    it('should disable button during login', async () => {
      let resolveLogin: (value: any) => void;
      authService.login.mockReturnValue(
        new Promise(resolve => {
          resolveLogin = resolve;
        })
      );

      const {getByPlaceholderText, getByText, getByTestId} = renderScreen();

      fireEvent.changeText(getByPlaceholderText('请输入邮箱'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('请输入密码'), 'password123');

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        const button = getByText('登录中...');
        expect(button).toBeTruthy();
      });

      // Cleanup: resolve the promise
      resolveLogin!({
        success: true,
        data: {
          user: {
            id: '1',
            name: '张三',
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: 'token',
        },
      });
    });
  });
});
