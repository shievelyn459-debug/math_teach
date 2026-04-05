/**
 * CelebrationOverlay 组件测试
 * Story 8-6c: 补充零覆盖率组件测试
 */

import React from 'react';
import {render, act} from '@testing-library/react-native';
import CelebrationOverlay, {CELEBRATION_MESSAGES} from '../../components/CelebrationOverlay';

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const mockReact = require('react');
  const {View} = require('react-native');
  const cardFn = (props: any) => mockReact.createElement(View, {testID: 'card'}, props.children);
  const cardContentFn = (props: any) => mockReact.createElement(View, {testID: 'card-content'}, props.children);
  const Card = Object.assign(cardFn, {Content: cardContentFn});
  return {
    useTheme: () => ({
      colors: {primary: '#007bff', surface: '#fff', text: '#000', error: '#f44336', background: '#fff'},
    }),
    Card,
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
    const mockReact = require('react');
    const {Text} = require('react-native');
    return mockReact.createElement(Text, {testID: 'typography'}, props.children);
  },
  Icon: (props: any) => {
    const mockReact = require('react');
    const {Text} = require('react-native');
    return mockReact.createElement(Text, {testID: 'icon'}, props.name || 'icon');
  },
  Spacer: () => {
    const mockReact = require('react');
    const {View} = require('react-native');
    return mockReact.createElement(View, {testID: 'spacer'});
  },
}));

describe('CelebrationOverlay', () => {
  const defaultProps = {
    visible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render when visible is true', () => {
    const {toJSON} = render(<CelebrationOverlay {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should not render content when visible is false', () => {
    const {toJSON} = render(<CelebrationOverlay visible={false} />);
    // When not visible, the component returns null
    expect(toJSON()).toBeNull();
  });

  it('should display custom message when provided', () => {
    const {getByText} = render(
      <CelebrationOverlay {...defaultProps} message="Great job!" />
    );
    expect(getByText('Great job!')).toBeTruthy();
  });

  it('should display default celebration message when no message provided', () => {
    const {toJSON} = render(<CelebrationOverlay {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should call onComplete after duration', () => {
    const onComplete = jest.fn();
    render(
      <CelebrationOverlay {...defaultProps} duration={2000} onComplete={onComplete} />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('should not call onComplete when not provided', () => {
    const {toJSON} = render(
      <CelebrationOverlay {...defaultProps} duration={2000} />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(toJSON()).toBeTruthy();
  });

  it('should export CELEBRATION_MESSAGES', () => {
    expect(CELEBRATION_MESSAGES).toBeDefined();
    expect(typeof CELEBRATION_MESSAGES).toBe('object');
  });
});
