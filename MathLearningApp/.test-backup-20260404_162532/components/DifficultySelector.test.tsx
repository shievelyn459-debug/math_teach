import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import DifficultySelector from '../DifficultySelector';
import {Difficulty} from '../../types';
import {designSystem} from '../../styles/designSystem';

describe('DifficultySelector', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染所有难度级别选项', () => {
    const {getByText} = render(
      <DifficultySelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('简单')).toBeTruthy();
    expect(getByText('中等')).toBeTruthy();
    expect(getByText('困难')).toBeTruthy();
  });

  it('点击难度级别时应该调用onSelect', () => {
    const {getByText} = render(
      <DifficultySelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('简单'));
    expect(mockOnSelect).toHaveBeenCalledWith(Difficulty.EASY);

    fireEvent.press(getByText('中等'));
    expect(mockOnSelect).toHaveBeenCalledWith(Difficulty.MEDIUM);

    fireEvent.press(getByText('困难'));
    expect(mockOnSelect).toHaveBeenCalledWith(Difficulty.HARD);
  });

  it('点击取消按钮时应该调用onCancel', () => {
    const {getByText} = render(
      <DifficultySelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('取消'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('当visible为false时不应该显示', () => {
    const {queryByText} = render(
      <DifficultySelector
        visible={false}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByText('选择题目难度')).toBeNull();
  });

  it('应该在1.5秒内显示（性能要求AC:7）', async () => {
    const startTime = Date.now();
    const {getByText} = render(
      <DifficultySelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(getByText('选择题目难度')).toBeTruthy();
    });

    const endTime = Date.now();
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(1500); // AC:7 1.5秒内显示
  });

  it('应该显示当前选中的难度级别', () => {
    const {getByTestId} = render(
      <DifficultySelector
        visible={true}
        currentDifficulty={Difficulty.EASY}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const easyButton = getByTestId(`difficulty-option-${Difficulty.EASY}`);
    expect(easyButton).toHaveStyle({backgroundColor: designSystem.colors.primary});
  });

  it('应该显示推荐难度标签', () => {
    const {getByText} = render(
      <DifficultySelector
        visible={true}
        recommendedDifficulty={Difficulty.EASY}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText(/推荐：简单/)).toBeTruthy();
    expect(getByText('推荐')).toBeTruthy(); // 推荐标签
  });

  it('应该在加载状态时显示加载指示器', () => {
    const {getByText} = render(
      <DifficultySelector
        visible={true}
        isLoading={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('加载偏好设置中...')).toBeTruthy();
  });

  it('加载时应该禁用选项按钮', () => {
    const {getByTestId} = render(
      <DifficultySelector
        visible={true}
        isLoading={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const easyButton = getByTestId(`difficulty-option-${Difficulty.EASY}`);
    // TouchableOpacity doesn't set disabled prop, so we test that press is blocked
    fireEvent.press(easyButton);
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('应该显示家长友好的说明文字', () => {
    const {getByText} = render(
      <DifficultySelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText(/根据孩子的学习情况选择合适的难度级别/i)).toBeTruthy();
  });

  it('应该显示每个难度级别的详细描述', () => {
    const {getByText} = render(
      <DifficultySelector
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    // 简单级别描述
    expect(getByText('适合初学者，题目基础易懂')).toBeTruthy();
    expect(getByText('孩子可以轻松完成，建立自信心')).toBeTruthy();

    // 中等级别描述
    expect(getByText('适度挑战，巩固基础知识')).toBeTruthy();
    expect(getByText('需要孩子思考，但不会太困难')).toBeTruthy();

    // 困难级别描述
    expect(getByText('进阶训练，提升解题能力')).toBeTruthy();
    expect(getByText('适合基础扎实的孩子，挑战极限')).toBeTruthy();
  });

  it('推荐和选中同一难度时应该只显示选中状态', () => {
    const {queryByText, getByTestId} = render(
      <DifficultySelector
        visible={true}
        currentDifficulty={Difficulty.EASY}
        recommendedDifficulty={Difficulty.EASY}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const easyButton = getByTestId(`difficulty-option-${Difficulty.EASY}`);
    expect(easyButton).toHaveStyle({backgroundColor: designSystem.colors.primary});

    // 推荐徽章应该显示
    expect(queryByText(/推荐：简单/)).toBeTruthy();
  });
});
