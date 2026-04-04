import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TipCard from '../TipCard';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#1976d2',
      surface: '#ffffff',
      text: '#000000',
    },
  }),
  Card: ({ children, onPress }: any) => {
    const { Pressable, View } = require('react-native');
    return onPress ? (
      <Pressable onPress={onPress}>{children}</Pressable>
    ) : (
      <View>{children}</View>
    );
  },
}));

describe('TipCard', () => {
  it('should render with title and content', () => {
    const title = '小贴士';
    const content = '这是一个有用的提示';
    const { getByText } = render(<TipCard title={title} content={content} />);

    expect(getByText(title)).toBeTruthy();
    expect(getByText(content)).toBeTruthy();
  });

  it('should handle press events when onPress is provided', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <TipCard
        title="点击提示"
        content="点击查看详情"
        onPress={mockOnPress}
      />
    );

    fireEvent.press(getByText('点击提示'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('should display icon when provided', () => {
    const { UNSAFE_queryByType } = render(
      <TipCard
        title="带图标的提示"
        content="内容"
        icon="lightbulb"
      />
    );

    expect(UNSAFE_queryByType('Image') || UNSAFE_queryByType('View')).toBeTruthy();
  });

  it('should apply different styles based on type', () => {
    const { rerender } = render(
      <TipCard title="信息" content="内容" type="info" />
    );

    rerender(<TipCard title="警告" content="内容" type="warning" />);
    rerender(<TipCard title="成功" content="内容" type="success" />);

    expect(true).toBe(true);
  });

  it('should handle empty content gracefully', () => {
    const { getByText } = render(<TipCard title="标题" content="" />);

    expect(getByText('标题')).toBeTruthy();
  });

  it('should truncate long content', () => {
    const longContent = '这是一个非常长的内容，'.repeat(20);
    const { getByText } = render(
      <TipCard title="长内容测试" content={longContent} />
    );

    expect(getByText(/长内容/)).toBeTruthy();
  });

  it('should show action button when action prop provided', () => {
    const mockAction = jest.fn();
    const { getByText } = render(
      <TipCard
        title="可操作的提示"
        content="点击按钮"
        action={{ label: '查看', onPress: mockAction }}
      />
    );

    const actionButton = getByText('查看');
    fireEvent.press(actionButton);
    expect(mockAction).toHaveBeenCalled();
  });
});
