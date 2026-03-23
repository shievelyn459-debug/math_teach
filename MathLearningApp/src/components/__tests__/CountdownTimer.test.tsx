/**
 * Story 5-3: CountdownTimer 组件测试
 */

import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import CountdownTimer, {useCountdown} from '../components/CountdownTimer';

// Mock Circular Progress component
jest.mock('react-native-circular-progress', () => {
  return {
    CircularProgress: ({children}: any) => {
      return <div testID="circular-progress">{children}</div>;
    },
  };
});

describe('CountdownTimer', () => {
  const defaultProps = {
    totalTime: 30,
    remainingTime: 25,
    elapsedTime: 5,
  };

  it('renders correctly with default props', () => {
    const {getByText} = render(
      <CountdownTimer {...defaultProps} />
    );

    expect(getByText('25')).toBeTruthy();
    expect(getByText('秒')).toBeTruthy();
  });

  it('displays correct remaining time', () => {
    const {getByText} = render(
      <CountdownTimer {...defaultProps} remainingTime={15} />
    );

    expect(getByText('15')).toBeTruthy();
  });

  it('displays zero when time is up', () => {
    const {getByText} = render(
      <CountdownTimer {...defaultProps} remainingTime={0} />
    );

    expect(getByText('0')).toBeTruthy();
  });

  it('handles negative time gracefully', () => {
    const {getByText} = render(
      <CountdownTimer {...defaultProps} remainingTime={-5} />
    );

    expect(getByText('0')).toBeTruthy();
  });
});

describe('useCountdown hook', () => {
  jest.useFakeTimers();

  it('counts down from initial time', async () => {
    const TestComponent = () => {
      const {remaining} = useCountdown(10, true);
      return <div testID="countdown">Remaining: {remaining}</div>;
    };

    const {getByTestId} = render(<TestComponent />);
    expect(getByTestId('countdown').props.children).toBe('Remaining: 10');

    // Fast forward 1 second
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(getByTestId('countdown').props.children).toBe('Remaining: 9');
    });
  });

  it('does not count down when paused', () => {
    const TestComponent = () => {
      const {remaining} = useCountdown(10, false);
      return <div testID="countdown">{remaining}</div>;
    };

    const {getByTestId} = render(<TestComponent />);
    expect(getByTestId('countdown).props.children).toBe(10);

    jest.advanceTimersByTime(5000);
    expect(getByTestId('countdown').props.children).toBe(10);
  });

  it('resets correctly', () => {
    const TestComponent = () => {
      const {remaining, reset} = useCountdown(10, true);
      return (
        <div>
          <div testID="countdown">{remaining}</div>
          <button testID="reset" onPress={reset} />
        </div>
      );
    };

    const {getByTestId} = render(<TestComponent />);

    jest.advanceTimersByTime(3000);
    waitFor(() => {
      expect(getByTestId('countdown').props.children).toBe(7);
    });

    getByTestId('reset').props.onPress();
    expect(getByTestId('countdown').props.children).toBe(10);
  });
});
