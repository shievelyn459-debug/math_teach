/**
 * Story 1-5: ChildFormScreen Tests
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {PaperProvider} from 'react-native-paper';
import ChildFormScreen from '../ChildFormScreen';
import {Child, Grade} from '../../types';
import {childApi} from '../../services/api';

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
  const {Grade} = require('../../types');
  return {
    activeChildService: {
      waitForInitialization: jest.fn().mockResolvedValue(undefined),
      getActiveChildId: jest.fn().mockReturnValue('child-1'),
      getActiveChild: jest.fn().mockReturnValue({
        id: 'child-1',
        parentId: 'user-1',
        name: '小明',
        grade: Grade.GRADE_3,
        birthday: new Date('2016-05-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      getAllGrades: jest.fn().mockReturnValue([
        Grade.GRADE_1,
        Grade.GRADE_2,
        Grade.GRADE_3,
        Grade.GRADE_4,
        Grade.GRADE_5,
        Grade.GRADE_6,
      ]),
    },
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('ChildFormScreen', () => {
  const mockChild: Child = {
    id: 'child-1',
    parentId: 'user-1',
    name: '小明',
    grade: Grade.GRADE_3,
    birthday: new Date('2016-05-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<PaperProvider>{component}</PaperProvider>);
  };

  describe('Add Mode', () => {
    it('should render add form correctly', () => {
      const route = {
        params: {
          mode: 'add' as const,
          onRefresh: jest.fn(),
        },
      };

      const {getByText, getByTestId} = renderWithProviders(
        <ChildFormScreen route={route} />
      );

      expect(getByText('添加孩子')).toBeTruthy();
      expect(getByText('填写孩子的基本信息')).toBeTruthy();
      expect(getByTestId('child-name-input')).toBeTruthy();
      expect(getByText('一年级')).toBeTruthy();
    });

    it('should validate name length', async () => {
      const route = {
        params: {
          mode: 'add' as const,
          onRefresh: jest.fn(),
        },
      };

      const {getByTestId, getByText} = renderWithProviders(
        <ChildFormScreen route={route} />
      );

      const nameInput = getByTestId('child-name-input');
      const saveButton = getByText('保存');

      // Enter too short name
      fireEvent.changeText(nameInput, 'A');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText('孩子姓名至少需要2个字符')).toBeTruthy();
      });
    });

    it('should call addChild API on valid submit', async () => {
      (childApi.addChild as jest.Mock).mockResolvedValue({
        success: true,
        data: {...mockChild, id: 'child-new'},
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      const route = {
        params: {
          mode: 'add' as const,
          onRefresh: jest.fn(),
        },
      };

      const {getByTestId, getByText} = renderWithProviders(
        <ChildFormScreen route={route} />
      );

      const nameInput = getByTestId('child-name-input');
      const saveButton = getByText('保存');

      // Enter valid data
      fireEvent.changeText(nameInput, '测试孩子');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(childApi.addChild).toHaveBeenCalledWith({
          name: '测试孩子',
          grade: Grade.GRADE_1,
          birthday: undefined,
        });
      });

      alertSpy.mockRestore();
    });
  });

  describe('Edit Mode', () => {
    it('should render edit form correctly', () => {
      const route = {
        params: {
          mode: 'edit' as const,
          child: mockChild,
          onRefresh: jest.fn(),
        },
      };

      const {getByText} = renderWithProviders(
        <ChildFormScreen route={route} />
      );

      expect(getByText('编辑孩子')).toBeTruthy();
      expect(getByText('更新孩子的信息')).toBeTruthy();
    });

    it('should call updateChild API on valid submit', async () => {
      (childApi.updateChild as jest.Mock).mockResolvedValue({
        success: true,
        data: {...mockChild, name: '小明（更新）'},
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      const route = {
        params: {
          mode: 'edit' as const,
          child: mockChild,
          onRefresh: jest.fn(),
        },
      };

      const {getByTestId, getByText} = renderWithProviders(
        <ChildFormScreen route={route} />
      );

      const nameInput = getByTestId('child-name-input');
      const saveButton = getByText('保存');

      // Update name
      fireEvent.changeText(nameInput, '小明（更新）');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(childApi.updateChild).toHaveBeenCalledWith('child-1', {
          name: '小明（更新）',
          grade: Grade.GRADE_3,
          birthday: mockChild.birthday,
        });
      });

      alertSpy.mockRestore();
    });
  });

  describe('Grade Selection', () => {
    it('should display all grade options', () => {
      const route = {
        params: {
          mode: 'add' as const,
          onRefresh: jest.fn(),
        },
      };

      const {getByText} = renderWithProviders(
        <ChildFormScreen route={route} />
      );

      // Verify all grade options are present
      expect(getByText('一年级')).toBeTruthy();
      expect(getByText('二年级')).toBeTruthy();
      expect(getByText('三年级')).toBeTruthy();
      expect(getByText('四年级')).toBeTruthy();
      expect(getByText('五年级')).toBeTruthy();
      expect(getByText('六年级')).toBeTruthy();
    });
  });

  describe('Birthday Selection', () => {
    it('should handle optional birthday field', () => {
      const route = {
        params: {
          mode: 'add' as const,
          onRefresh: jest.fn(),
        },
      };

      const {getByText} = renderWithProviders(
        <ChildFormScreen route={route} />
      );

      expect(getByText('生日（可选）')).toBeTruthy();
    });
  });

  describe('Cancel Operation', () => {
    it('should have cancel button', () => {
      const route = {
        params: {
          mode: 'add' as const,
          onRefresh: jest.fn(),
        },
      };

      const {getByText} = renderWithProviders(
        <ChildFormScreen route={route} />
      );

      expect(getByText('取消')).toBeTruthy();
    });
  });
});
