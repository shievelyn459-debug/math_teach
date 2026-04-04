import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TipCard from '../TipCard';

describe('TipCard', () => {
  const defaultProps = {
    title: '小贴士',
    tips: ['提示1', '提示2', '提示3'],
  };

  it('should render with title and tips', () => {
    const { getByText } = render(<TipCard {...defaultProps} />);

    expect(getByText('小贴士')).toBeTruthy();
    expect(getByText('提示1')).toBeTruthy();
    expect(getByText('提示2')).toBeTruthy();
    expect(getByText('提示3')).toBeTruthy();
  });

  it('should handle press events when onPress is provided', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <TipCard {...defaultProps} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('小贴士'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('should handle empty tips array', () => {
    const { getByText } = render(<TipCard title="空提示" tips={[]} />);
    expect(getByText('空提示')).toBeTruthy();
  });

  it('should display single tip', () => {
    const { getByText } = render(
      <TipCard title="单条提示" tips={['只有一条']} />
    );
    expect(getByText('只有一条')).toBeTruthy();
  });

  it('should apply type-based styles', () => {
    const { getByText } = render(
      <TipCard title="信息提示" tips={['提示']} type="info" />
    );
    expect(getByText('信息提示')).toBeTruthy();
  });

  it('should handle long tip text', () => {
    const longTip = '这是一个非常长的提示文本，用来测试组件是否能够正确处理长文本的情况';
    const { getByText } = render(
      <TipCard title="长提示" tips={[longTip]} />
    );
    expect(getByText(longTip)).toBeTruthy();
  });
});
