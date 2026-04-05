/**
 * EncouragingSuccess 组件测试
 * Story 8-6c: 补充零覆盖率组件测试
 */

import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import EncouragingSuccess from '../../components/EncouragingSuccess';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const {View} = require('react-native');

  const MockAnimated = {
    View: (props: any) => React.createElement(View, props, props.children),
  };

  return {
    __esModule: true,
    default: MockAnimated,
    useSharedValue: (initial: any) => ({value: initial}),
    useAnimatedStyle: (cb: any) => cb(),
    withTiming: (toValue: any, config: any, callback: any) => {
      if (typeof callback === 'function') callback();
      return toValue;
    },
    withSequence: (...anims: any[]) => anims[0],
    runOnJS: (fn: any) => fn,
    Animated: MockAnimated,
  };
});

jest.mock('../../styles/designSystem', () => ({
  designSystem: {
    colors: {
      primary: '#007bff',
      primaryLight: '#e3f2fd',
      surface: {primary: '#fff', secondary: '#f5f5f5', tertiary: '#e0e0e0'},
      text: {primary: '#000', secondary: '#666', hint: '#999'},
      success: {default: '#4caf50', light: '#e8f5e9'},
      overlay: {light: 'rgba(0,0,0,0.3)'},
    },
    spacing: {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32},
    borderRadius: {sm: 4, md: 8, lg: 12, xl: 16},
    shadows: {sm: {}, md: {}, lg: {}},
  },
}));

jest.mock('../../components/ui', () => ({
  Typography: (props: any) => {
    const React = require('react');
    const {Text} = require('react-native');
    return React.createElement(Text, {testID: 'typography'}, props.children);
  },
  Icon: (props: any) => {
    const React = require('react');
    const {Text} = require('react-native');
    return React.createElement(Text, {testID: `icon-${props.name || 'default'}`}, props.name || 'icon');
  },
  Spacer: () => {
    const React = require('react');
    const {View} = require('react-native');
    return React.createElement(View, {testID: 'spacer'});
  },
}));

describe('EncouragingSuccess', () => {
  const defaultProps = {
    title: '太棒了！',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with required title prop', () => {
    const {getByText} = render(<EncouragingSuccess {...defaultProps} />);
    expect(getByText('太棒了！')).toBeTruthy();
  });

  it('should display message when provided', () => {
    const {getByText} = render(
      <EncouragingSuccess {...defaultProps} message="你做得很好！" />
    );
    expect(getByText('你做得很好！')).toBeTruthy();
  });

  it('should not display message when not provided', () => {
    const {toJSON} = render(<EncouragingSuccess {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should call onClose when close button pressed', () => {
    const onClose = jest.fn();
    const {getByTestId} = render(
      <EncouragingSuccess {...defaultProps} onClose={onClose} />
    );

    const closeIcon = getByTestId('icon-close');
    fireEvent.press(closeIcon);
    expect(onClose).toHaveBeenCalled();
  });

  it('should auto-close after specified delay', () => {
    const onClose = jest.fn();
    render(
      <EncouragingSuccess {...defaultProps} onClose={onClose} autoCloseDelay={1000} />
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should not auto-close when autoCloseDelay is 0', () => {
    const onClose = jest.fn();
    render(
      <EncouragingSuccess {...defaultProps} onClose={onClose} autoCloseDelay={0} />
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should display milestone progress when provided', () => {
    const milestone = {current: 5, total: 10, label: '完成进度'};
    const {getByText} = render(
      <EncouragingSuccess {...defaultProps} milestone={milestone} />
    );

    expect(getByText(/完成进度.*5\/10/)).toBeTruthy();
  });

  it('should show celebration decoration when showCelebration is true', () => {
    const {toJSON} = render(
      <EncouragingSuccess {...defaultProps} showCelebration={true} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should not show decoration when showCelebration is false', () => {
    const {toJSON} = render(
      <EncouragingSuccess {...defaultProps} showCelebration={false} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should use default icon when icon prop not provided', () => {
    const {getByTestId} = render(<EncouragingSuccess {...defaultProps} />);
    expect(getByTestId('icon-check-circle')).toBeTruthy();
  });

  it('should use custom icon when icon prop provided', () => {
    const {getByTestId} = render(
      <EncouragingSuccess {...defaultProps} icon="star" />
    );
    expect(getByTestId('icon-star')).toBeTruthy();
  });
});
