/**
 * ReassuringLoader 组件测试
 * Story 8-6c: 补充零覆盖率组件测试
 */

import React from 'react';
import {render, act} from '@testing-library/react-native';
import ReassuringLoader from '../../components/ReassuringLoader';

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
    withRepeat: (anim: any, count: any, reverse: any) => anim,
    withTiming: (toValue: any, config: any, callback: any) => toValue,
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
      info: {default: '#2196f3', light: '#e3f2fd'},
    },
    spacing: {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32},
    borderRadius: {sm: 4, md: 8, lg: 12, xl: 16},
  },
}));

jest.mock('../../components/ui', () => ({
  Typography: (props: any) => {
    const React = require('react');
    const {Text} = require('react-native');
    return React.createElement(Text, {testID: 'typography'}, props.children);
  },
  Spacer: () => {
    const React = require('react');
    const {View} = require('react-native');
    return React.createElement(View, {testID: 'spacer'});
  },
}));

describe('ReassuringLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with default props', () => {
    const {toJSON} = render(<ReassuringLoader />);
    expect(toJSON()).toBeTruthy();
  });

  it('should display default loading message', () => {
    const {getByText} = render(<ReassuringLoader />);
    expect(getByText('我们正在努力，请稍候...')).toBeTruthy();
  });

  it('should display custom message when provided', () => {
    const {getByText} = render(<ReassuringLoader message="正在加载..." />);
    expect(getByText('正在加载...')).toBeTruthy();
  });

  it('should display progress bar when progress is provided', () => {
    const {toJSON} = render(<ReassuringLoader progress={50} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should show progress percentage', () => {
    const {getByText} = render(<ReassuringLoader progress={75} />);
    expect(getByText('75%')).toBeTruthy();
  });

  it('should show breathing hint when showBreathing is true', () => {
    const {getByText} = render(<ReassuringLoader showBreathing={true} />);
    expect(getByText('深呼吸...放松...')).toBeTruthy();
  });

  it('should not show breathing hint when showBreathing is false', () => {
    const {queryByText} = render(<ReassuringLoader showBreathing={false} />);
    expect(queryByText('深呼吸...放松...')).toBeNull();
  });

  it('should rotate messages on interval', () => {
    // Pass empty string to use rotating messages instead of fixed message
    const {getByText} = render(<ReassuringLoader message="" />);

    // Initial message (index 0)
    expect(getByText('我们正在努力，请稍候...')).toBeTruthy();

    // Advance timer to trigger message rotation
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    // After 4 seconds, message should change to index 1
    expect(getByText('正在为您准备精彩内容...')).toBeTruthy();
  });

  it('should apply custom style', () => {
    const customStyle = {backgroundColor: 'red'};
    const {toJSON} = render(<ReassuringLoader style={customStyle} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should not show progress when progress is undefined', () => {
    const {queryByText} = render(<ReassuringLoader />);
    // No percentage should be shown
    expect(queryByText(/\d+%/)).toBeNull();
  });
});
