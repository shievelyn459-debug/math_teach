/**
 * Story 1-4: ProfileScreen 测试
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import {authService} from '../../services/authService';
import {userApi} from '../../services/api';

// Mock navigation
const mockNavigation = {
  reset: jest.fn(),
  navigate: jest.fn(),
};

// Mock dependencies
jest.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
    onAuthStateChanged: jest.fn(() => jest.fn()),
  },
}));

jest.mock('../../services/api', () => ({
  userApi: {
    getProfile: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert.alert = jest.fn();
  return RN;
});

describe('ProfileScreen (Story 1-4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染测试 (AC1: 显示用户信息)', () => {
    it('应该显示加载状态', () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(null);
      (authService.onAuthStateChanged as jest.Mock).mockReturnValue(jest.fn());

      const {getByText} = render(<ProfileScreen navigation={mockNavigation} />);

      expect(getByText('加载中...')).toBeTruthy();
    });

    it('应该显示用户信息', async () => {
      const mockUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '+8613812345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      (authService.onAuthStateChanged as jest.Mock).mockReturnValue(jest.fn());
      (userApi.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const {getByTestId, getByText, getAllByText} = render(
        <ProfileScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // '张三' and email may appear multiple times
        const nameElements = getAllByText('张三');
        expect(nameElements.length).toBeGreaterThan(0);
        const emailElements = getAllByText('zhangsan@example.com');
        expect(emailElements.length).toBeGreaterThan(0);
      });
    });

    it('应该显示未登录状态', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(null);
      (authService.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        // Immediately call callback with null user
        callback(null);
        return jest.fn(); // Return unsubscribe function
      });
      // Mock getProfile to return failure when not logged in
      (userApi.getProfile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Not authenticated',
      });

      const {getByText, queryByText} = render(<ProfileScreen navigation={mockNavigation} />);

      // Wait for loading to complete and unlogged state to appear
      await waitFor(
        () => {
          expect(queryByText('加载中...')).toBeNull();
          expect(getByText('未登录')).toBeTruthy();
          expect(getByText('请先登录')).toBeTruthy();
        },
        {timeout: 3000}
      );
    });
  });

  describe('编辑按钮 (AC8: 导航到编辑页面)', () => {
    it('应该有编辑资料按钮', async () => {
      const mockUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      (authService.onAuthStateChanged as jest.Mock).mockReturnValue(jest.fn());
      (userApi.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const {getByTestId, getByText} = render(
        <ProfileScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('编辑资料')).toBeTruthy();
        expect(getByTestId('edit-profile-button')).toBeTruthy();
      });
    });

    it('点击编辑按钮应该导航到编辑页面', async () => {
      const mockUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '+8613812345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      (authService.onAuthStateChanged as jest.Mock).mockReturnValue(jest.fn());
      (userApi.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const {getByTestId} = render(
        <ProfileScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const editButton = getByTestId('edit-profile-button');
        fireEvent.press(editButton);

        expect(mockNavigation.navigate).toHaveBeenCalledWith('EditProfile', {
          user: mockUser,
          onRefresh: expect.any(Function),
        });
      });
    });
  });

  describe('资料字段显示 (AC1)', () => {
    it('应该显示姓名、邮箱、电话字段', async () => {
      const mockUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '+8613812345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      (authService.onAuthStateChanged as jest.Mock).mockReturnValue(jest.fn());
      (userApi.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const {getByTestId} = render(
        <ProfileScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('profile-name')).toBeTruthy();
        expect(getByTestId('profile-email')).toBeTruthy();
        expect(getByTestId('profile-phone')).toBeTruthy();
      });
    });

    it('应该显示未设置的电话号码', async () => {
      const mockUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        phone: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      (authService.onAuthStateChanged as jest.Mock).mockReturnValue(jest.fn());
      (userApi.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const {getByTestId} = render(
        <ProfileScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const phoneField = getByTestId('profile-phone');
        expect(phoneField.props.value).toBeUndefined();
      });
    });
  });

  describe('退出登录', () => {
    it('应该显示退出登录按钮', async () => {
      const mockUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      (authService.onAuthStateChanged as jest.Mock).mockReturnValue(jest.fn());
      (userApi.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const {getByText} = render(
        <ProfileScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('退出登录')).toBeTruthy();
      });
    });

    it('点击退出应该显示确认对话框', async () => {
      const mockUser = {
        id: 'user-123',
        name: '张三',
        email: 'zhangsan@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      (authService.onAuthStateChanged as jest.Mock).mockReturnValue(jest.fn());
      (userApi.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const {getByText} = render(
        <ProfileScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const logoutButton = getByText('退出登录');
        fireEvent.press(logoutButton);

        const {Alert} = require('react-native');
        expect(Alert.alert).toHaveBeenCalledWith(
          '退出登录',
          '确定要退出登录吗？',
          expect.any(Array)
        );
      });
    });
  });
});
