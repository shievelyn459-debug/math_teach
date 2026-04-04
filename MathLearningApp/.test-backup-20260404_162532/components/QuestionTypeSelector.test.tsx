import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuestionTypeSelector from '../QuestionTypeSelector';
import { QuestionType } from '../../types';
import { designSystem } from '../../styles/designSystem';

describe('QuestionTypeSelector', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染所有题目类型选项', () => {
    const { getByText } = render(
      <QuestionTypeSelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('加法')).toBeTruthy();
    expect(getByText('减法')).toBeTruthy();
    expect(getByText('应用题')).toBeTruthy();
  });

  it('点击题目类型时应该调用onSelect', () => {
    const { getByText } = render(
      <QuestionTypeSelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('加法'));
    expect(mockOnSelect).toHaveBeenCalledWith(QuestionType.ADDITION);
  });

  it('点击取消按钮时应该调用onCancel', () => {
    const { getByText } = render(
      <QuestionTypeSelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('取消'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('当visible为false时不应该显示', () => {
    const { queryByText } = render(
      <QuestionTypeSelector
        visible={false}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByText('手动选择题目类型')).toBeNull();
  });

  it('应该在2秒内显示（性能要求AC:8）', async () => {
    const startTime = Date.now();
    const { getByText } = render(
      <QuestionTypeSelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(getByText('手动选择题目类型')).toBeTruthy();
    });

    const endTime = Date.now();
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(2000); // AC:8 2秒内显示
  });

  it('应该显示当前选中的题目类型', () => {
    const { getByTestId } = render(
      <QuestionTypeSelector
        visible={true}
        currentType={QuestionType.ADDITION}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const addButton = getByTestId(`type-option-${QuestionType.ADDITION}`);
    expect(addButton).toHaveStyle({ backgroundColor: designSystem.colors.primary });
  });

  it('应该显示家长友好的说明文字', () => {
    const { getByText } = render(
      <QuestionTypeSelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText(/请选择正确的题目类型/i)).toBeTruthy();
  });
});
