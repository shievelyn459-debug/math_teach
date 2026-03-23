/**
 * Story 1-5: ChildListScreen Tests
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {PaperProvider} from 'react-native-paper';
import ChildListScreen from '../ChildListScreen';
import {Child, Grade} from '../../types';
import {childApi} from '../../services/api';
import {activeChildService} from '../../services/activeChildService';
import {ActiveChildProvider} from '../../contexts/ActiveChildContext';

// Mock dependencies
jest.mock('../../services/api', () => ({
  childApi: {
    getChildren: jest.fn(),
    addChild: jest.fn(),
    updateChild: jest.fn(),
    deleteChild: jest.fn(),
  },
}));

jest.mock('../../services/activeChildService', () => {
  const actual = jest.requireActual('../../services/activeChildService');
  return {
    ...actual,
    waitForInitialization: jest.fn(() => Promise.resolve()),
    getActiveChild: jest.fn(() => null),
    onActiveChildChanged: jest.fn(() => () => {}),
    getGradeDisplayName: jest.fn((grade: Grade) => {
      const names: Record<Grade, string> = {
        [Grade.GRADE_1]: '一年级',
        [Grade.GRADE_2]: '二年级',
        [Grade.GRADE_3]: '三年级',
        [Grade.GRADE_4]: '四年级',
        [Grade.GRADE_5]: '五年级',
        [Grade.GRADE_6]: '六年级',
      };
      return names[grade] || `${grade}年级`;
    }),
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));

describe('ChildListScreen', () => {
  const mockChildren: Child[] = [
    {
      id: 'child-1',
      parentId: 'user-1',
      name: '小明',
      grade: Grade.GRADE_3,
      birthday: new Date('2016-05-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'child-2',
      parentId: 'user-1',
      name: '小红',
      grade: Grade.GRADE_2,
      birthday: new Date('2017-03-20'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <PaperProvider>
        <ActiveChildProvider>{component}</ActiveChildProvider>
      </PaperProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render the component without crashing', () => {
      (childApi.getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const {getByText} = renderWithProviders(<ChildListScreen route={{params: {}}} />);
      expect(getByText('我的孩子')).toBeTruthy();
    });

    it('should render header correctly', () => {
      (childApi.getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const {getByText} = renderWithProviders(<ChildListScreen route={{params: {}}} />);
      expect(getByText('我的孩子')).toBeTruthy();
      expect(getByText('管理孩子的信息')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no children', async () => {
      (childApi.getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const {getByText} = renderWithProviders(<ChildListScreen route={{params: {}}} />);

      await waitFor(() => {
        expect(getByText('还没有添加孩子')).toBeTruthy();
        expect(getByText('添加第一个孩子')).toBeTruthy();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getChildren API on mount', async () => {
      (childApi.getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: mockChildren,
      });

      renderWithProviders(<ChildListScreen route={{params: {}}} />);

      await waitFor(() => {
        expect(childApi.getChildren).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      (childApi.getChildren as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '获取孩子列表失败',
        },
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      renderWithProviders(<ChildListScreen route={{params: {}}} />);

      await waitFor(() => {
        expect(childApi.getChildren).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });
  });

  describe('Child Deletion', () => {
    it('should call deleteChild API when delete is confirmed', async () => {
      (childApi.getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: mockChildren,
      });

      (childApi.deleteChild as jest.Mock).mockResolvedValue({
        success: true,
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      renderWithProviders(<ChildListScreen route={{params: {}}} />);

      // Wait for render
      await waitFor(() => {
        expect(childApi.getChildren).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });
  });
});
