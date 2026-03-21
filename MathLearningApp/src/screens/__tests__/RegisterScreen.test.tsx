import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import RegisterScreen from '../RegisterScreen';

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
    register: jest.fn(),
    isValidEmail: jest.fn(),
    isValidPassword: jest.fn(),
  },
}));

const {authService} = require('../../services/authService');

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

describe('RegisterScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authService.isValidEmail.mockReturnValue(true);
    authService.isValidPassword.mockReturnValue({isValid: true, errors: []});
  });

  const renderScreen = () => {
    return render(<RegisterScreen navigation={mockNavigation as any} />);
  };

  describe('UI Rendering', () => {
    it('should render all form fields', () => {
      const {getByTestId, getByText} = renderScreen();

      expect(getByText('创建账户')).toBeTruthy();
      expect(getByText('请填写您的信息')).toBeTruthy();
      expect(getByTestId('name-input')).toBeTruthy();
      expect(getByTestId('email-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
      expect(getByTestId('confirm-password-input')).toBeTruthy();
      expect(getByTestId('register-button')).toBeTruthy();
    });

    it('should render password requirements hint', () => {
      const {getByText} = renderScreen();

      expect(getByText('密码要求：')).toBeTruthy();
      expect(getByText('• 至少8个字符')).toBeTruthy();
      expect(getByText('• 包含字母和数字')).toBeTruthy();
    });

    it('should render login link', () => {
      const {getByText, getByTestId} = renderScreen();

      expect(getByText('已有账户？')).toBeTruthy();
      expect(getByTestId('login-link')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show error when name is empty', async () => {
      const {getByTestId, getByText} = renderScreen();

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('请输入您的姓名')).toBeTruthy();
      });
    });

    it('should show error when name is too short', async () => {
      const {getByTestId, getByText} = renderScreen();

      const nameInput = getByTestId('name-input');
      fireEvent.changeText(nameInput, 'A');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('姓名至少需要2个字符')).toBeTruthy();
      });
    });

    it('should show error when email is empty', async () => {
      const {getByTestId, getByText} = renderScreen();

      const nameInput = getByTestId('name-input');
      fireEvent.changeText(nameInput, '张三');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('请输入邮箱地址')).toBeTruthy();
      });
    });

    it('should show error when email is invalid', async () => {
      authService.isValidEmail.mockReturnValue(false);

      const {getByTestId, getByText} = renderScreen();

      const nameInput = getByTestId('name-input');
      fireEvent.changeText(nameInput, '张三');

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'invalid-email');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('请输入有效的邮箱地址')).toBeTruthy();
      });
    });

    it('should show error when password is empty', async () => {
      const {getByTestId, getByText} = renderScreen();

      const nameInput = getByTestId('name-input');
      fireEvent.changeText(nameInput, '张三');

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('请输入密码')).toBeTruthy();
      });
    });

    it('should show error when password is weak', async () => {
      authService.isValidPassword.mockReturnValue({
        isValid: false,
        errors: ['密码至少需要8个字符'],
      });

      const {getByTestId, getByText} = renderScreen();

      fireEvent.changeText(getByTestId('name-input'), '张三');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'short');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'short');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('密码至少需要8个字符')).toBeTruthy();
      });
    });

    it('should show error when passwords do not match', async () => {
      const {getByTestId, getByText} = renderScreen();

      fireEvent.changeText(getByTestId('name-input'), '张三');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password456');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('两次输入的密码不一致')).toBeTruthy();
      });
    });
  });

  describe('Registration Flow', () => {
    it('should call authService.register with correct parameters', async () => {
      authService.register.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            name: '张三',
            email: 'zhangsan@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: 'mock-token',
        },
      });

      const {getByTestId} = renderScreen();

      fireEvent.changeText(getByTestId('name-input'), '张三');
      fireEvent.changeText(getByTestId('email-input'), 'zhangsan@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(
          '张三',
          'zhangsan@example.com',
          'password123'
        );
      });
    });

    it('should show success alert and navigate on successful registration', async () => {
      authService.register.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            name: '张三',
            email: 'zhangsan@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: 'mock-token',
        },
      });

      const {getByTestId} = renderScreen();

      fireEvent.changeText(getByTestId('name-input'), '张三');
      fireEvent.changeText(getByTestId('email-input'), 'zhangsan@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '注册成功！',
          '欢迎加入一年级数学学习助手',
          expect.arrayContaining([
            expect.objectContaining({
              text: '开始使用',
            }),
          ])
        );
      });
    });

    it('should show error message when email already exists', async () => {
      authService.register.mockResolvedValue({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: '该邮箱已被注册，请使用其他邮箱或直接登录',
        },
      });

      const {getByTestId, getByText} = renderScreen();

      fireEvent.changeText(getByTestId('name-input'), '张三');
      fireEvent.changeText(getByTestId('email-input'), 'existing@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('该邮箱已被注册，请使用其他邮箱或直接登录')).toBeTruthy();
      });
    });

    it('should show general error message on registration failure', async () => {
      authService.register.mockResolvedValue({
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: '注册失败，请稍后重试',
        },
      });

      const {getByTestId, getByText} = renderScreen();

      fireEvent.changeText(getByTestId('name-input'), '张三');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('注册失败，请稍后重试')).toBeTruthy();
      });
    });

    it('should show network error message on connection failure', async () => {
      authService.register.mockRejectedValue(new Error('Network error'));

      const {getByTestId, getByText} = renderScreen();

      fireEvent.changeText(getByTestId('name-input'), '张三');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('网络连接出现问题，请检查您的网络后重试')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to login screen when login link is pressed', () => {
      const {getByTestId} = renderScreen();

      const loginLink = getByTestId('login-link');
      fireEvent.press(loginLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Loading State', () => {
    it('should disable button and show loading text during registration', async () => {
      let resolveRegister: (value: any) => void;
      authService.register.mockReturnValue(
        new Promise(resolve => {
          resolveRegister = resolve;
        })
      );

      const {getByTestId, getByText} = renderScreen();

      fireEvent.changeText(getByTestId('name-input'), '张三');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');

      const registerButton = getByTestId('register-button');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('注册中...')).toBeTruthy();
      });

      // Resolve the promise
      resolveRegister!({
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
