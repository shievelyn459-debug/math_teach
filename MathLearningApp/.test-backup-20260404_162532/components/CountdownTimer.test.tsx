/**
 * Story 5-3: CountdownTimer 组件测试
 */

import React from 'react';
import {render, waitFor, act} from '@testing-library/react-native';
import CountdownTimer, {useCountdown} from '../CountdownTimer';

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
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down from initial time', () => {
    const TestComponent = () => {
      const {remaining} = useCountdown(10, true);
      return <div testID="countdown">{remaining}</div>;
    };

    const {getByTestId} = render(<TestComponent />);
    expect(getByTestId('countdown').props.children).toBe(10);

    // Fast forward some time
    act(() => {
      jest.advanceTimersByTime(150);
    });
    // After advancing, remaining should have decreased
    const value = getByTestId('countdown').props.children;
    expect(value).toBeLessThan(10);
    expect(value).toBeGreaterThanOrEqual(0);
  });

  it('does not count down when paused', () => {
    const TestComponent = () => {
      const {remaining} = useCountdown(10, false);
      return <div testID="countdown">{remaining}</div>;
    };

    const {getByTestId} = render(<TestComponent />);
    expect(getByTestId('countdown').props.children).toBe(10);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
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
    const initialValue = getByTestId('countdown').props.children;

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const midValue = getByTestId('countdown').props.children;
    expect(midValue).toBeLessThan(initialValue);

    act(() => {
      getByTestId('reset').props.onPress();
    });

    expect(getByTestId('countdown').props.children).toBe(10);
  });
});
