import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EncouragingSuccess from '../EncouragingSuccess';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#1976d2',
      success: '#4caf50',
    },
  }),
  Card: ({ children }: any) => children,
}));

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated = {
    ...RN.Animated,
    timing: () => ({
      start: (cb: any) => cb && cb(),
      setValue: jest.fn(),
    }),
    spring: () => ({
      start: (cb: any) => cb && cb(),
      setValue: jest.fn(),
    }),
    parallel: (animations: any) => ({
      start: (cb: any) => cb && cb(),
    }),
    Value: jest.fn(() => ({
      interpolate: () => ({}),
      setValue: jest.fn(),
    })),
    sequence: (animations: any) => ({
      start: (cb: any) => cb && cb(),
    }),
  };
  return RN;
});

describe('EncouragingSuccess', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    const { getByText } = render(
      <EncouragingSuccess visible={true} onComplete={mockOnComplete} />
    );

    expect(getByText(/太棒了|做得好|继续加油/)).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <EncouragingSuccess visible={false} onComplete={mockOnComplete} />
    );

    expect(queryByText(/太棒了|做得好/)).toBeNull();
  });

  it('should display custom message', () => {
    const customMessage = '🎉 自定义成功消息';
    const { getByText } = render(
      <EncouragingSuccess
        visible={true}
        message={customMessage}
        onComplete={mockOnComplete}
      />
    );

    expect(getByText(customMessage)).toBeTruthy();
  });

  it('should call onComplete when button pressed', async () => {
    const { getByText } = render(
      <EncouragingSuccess visible={true} onComplete={mockOnComplete} />
    );

    const button = getByText(/继续|完成|好的/);
    fireEvent.press(button);

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('should show different messages based on difficulty', () => {
    const { rerender, getByText } = render(
      <EncouragingSuccess
        visible={true}
        difficulty="easy"
        onComplete={mockOnComplete}
      />
    );

    expect(getByText(/太棒了|简单|做得好/)).toBeTruthy();

    rerender(
      <EncouragingSuccess
        visible={true}
        difficulty="hard"
        onComplete={mockOnComplete}
      />
    );

    expect(getByText(/厉害|挑战|太强了/)).toBeTruthy();
  });

  it('should display score when provided', () => {
    const { getByText } = render(
      <EncouragingSuccess
        visible={true}
        score={95}
        onComplete={mockOnComplete}
      />
    );

    expect(getByText(/95|得分/)).toBeTruthy();
  });

  it('should handle completion animation', async () => {
    const { unmount } = render(
      <EncouragingSuccess visible={true} onComplete={mockOnComplete} />
    );

    unmount();
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
