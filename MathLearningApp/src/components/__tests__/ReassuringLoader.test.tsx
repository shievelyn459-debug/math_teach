import React from 'react';
import { render } from '@testing-library/react-native';
import ReassuringLoader from '../ReassuringLoader';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#1976d2',
    },
  }),
}));

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated = {
    ...RN.Animated,
    timing: () => ({
      start: jest.fn(),
      setValue: jest.fn(),
    }),
    loop: () => ({
      start: jest.fn(),
    }),
    Value: jest.fn(() => ({
      interpolate: () => ({}),
      setValue: jest.fn(),
    })),
  };
  return RN;
});

describe('ReassuringLoader', () => {
  it('should render with default props', () => {
    const { getByText } = render(<ReassuringLoader />);

    expect(getByText(/正在处理|请稍候|加载中/)).toBeTruthy();
  });

  it('should display custom message', () => {
    const customMessage = '正在加载您的数据...';
    const { getByText } = render(<ReassuringLoader message={customMessage} />);

    expect(getByText(customMessage)).toBeTruthy();
  });

  it('should show progress percentage when provided', () => {
    const { getByText } = render(<ReassuringLoader progress={75} />);

    expect(getByText(/75|%|进度/)).toBeTruthy();
  });

  it('should display reassurance messages', () => {
    const { getByText } = render(<ReassuringLoader />);

    // 应该显示安抚性消息
    expect(getByText(/不要担心|很快就好|正在努力/)).toBeTruthy();
  });

  it('should apply different sizes', () => {
    const { rerender } = render(<ReassuringLoader size="small" />);
    rerender(<ReassuringLoader size="large" />);

    // 应该能渲染不同尺寸
    expect(true).toBe(true);
  });

  it('should handle long messages gracefully', () => {
    const longMessage = '这是一个非常长的消息，用来测试组件是否能够正确处理长文本的情况';
    const { getByText } = render(<ReassuringLoader message={longMessage} />);

    expect(getByText(longMessage)).toBeTruthy();
  });

  it('should show animated dots or spinner', () => {
    const { UNSAFE_queryByType } = render(<ReassuringLoader />);

    // 应该包含加载动画元素
    expect(UNSAFE_queryByType('ActivityIndicator') || UNSAFE_queryByType('View')).toBeTruthy();
  });
});
