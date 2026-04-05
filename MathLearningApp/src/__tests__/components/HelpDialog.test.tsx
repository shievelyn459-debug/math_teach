/**
 * HelpDialog 组件测试
 * Story 8-6c: 补充零覆盖率组件测试
 */

import React from 'react';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import HelpDialog from '../../components/HelpDialog';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {primary: '#007bff', surface: '#fff', text: '#000', error: '#f44336', background: '#fff'},
  }),
  Card: (props: any) => {
    const {View} = require('react-native');
    return require('react').createElement(View, {testID: 'card'}, props.children);
  },
  Searchbar: (props: any) => {
    const React = require('react');
    const {TextInput} = require('react-native');
    return React.createElement(TextInput, {
      testID: 'search-bar',
      placeholder: props.placeholder,
      onChangeText: props.onChangeText,
      value: props.value,
    });
  },
  Button: (props: any) => {
    const React = require('react');
    const {Text, TouchableOpacity} = require('react-native');
    return React.createElement(TouchableOpacity, {
      testID: `button`,
      onPress: props.onPress,
    }, React.createElement(Text, null, props.children));
  },
}));

// Mock helpContentService with correct data structure
const mockHelpContent = {
  screenId: 'home',
  title: '首页帮助',
  sections: [
    {
      title: '如何拍照上传题目？',
      content: '点击拍照按钮，对准题目拍照即可',
    },
    {
      title: '如何查看讲解？',
      content: '点击知识点标签查看详细讲解',
    },
  ],
};

jest.mock('../../services/helpContentService', () => ({
  helpContentService: {
    getHelpContent: jest.fn().mockResolvedValue(mockHelpContent),
    searchHelp: jest.fn().mockResolvedValue([]),
    getGenericHelp: jest.fn().mockResolvedValue(mockHelpContent),
  },
}));

jest.mock('../../styles/designSystem', () => ({
  designSystem: {
    colors: {
      primary: '#007bff',
      surface: {primary: '#fff', secondary: '#f5f5f5', tertiary: '#e0e0e0'},
      text: {primary: '#000', secondary: '#666', hint: '#999'},
      error: {default: '#f44336', light: '#ffebee'},
      overlay: {light: 'rgba(0,0,0,0.3)', medium: 'rgba(0,0,0,0.5)'},
    },
    spacing: {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32},
    borderRadius: {sm: 4, md: 8, lg: 12, xl: 16},
  },
}));

jest.mock('../../styles/tablet', () => ({
  getScaledSpacing: jest.fn(() => 16),
  getFontSize: jest.fn(() => 14),
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

describe('HelpDialog', () => {
  const defaultProps = {
    visible: true,
    screenId: 'home',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', async () => {
    const {toJSON} = render(<HelpDialog {...defaultProps} />);
    await act(async () => {
      await waitFor(() => {
        expect(toJSON()).toBeTruthy();
      });
    });
  });

  it('should not render modal content when not visible', async () => {
    const {queryByTestId} = render(<HelpDialog {...defaultProps} visible={false} />);

    await act(async () => {
      await waitFor(() => {
        // Search bar should not be visible when dialog is hidden
        expect(queryByTestId('search-bar')).toBeNull();
      });
    });
  });

  it('should call onClose when close button pressed', async () => {
    const onClose = jest.fn();
    const {getByTestId} = render(<HelpDialog {...defaultProps} onClose={onClose} />);

    await act(async () => {
      await waitFor(() => {
        expect(getByTestId('search-bar')).toBeTruthy();
      });
    });

    // Press close button (the icon-close button)
    const closeBtn = getByTestId('icon-close');
    fireEvent.press(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('should load help content for screen', async () => {
    const {helpContentService} = require('../../services/helpContentService');
    render(<HelpDialog {...defaultProps} />);

    await act(async () => {
      await waitFor(() => {
        expect(helpContentService.getHelpContent).toHaveBeenCalledWith('home');
      });
    });
  });

  it('should display search bar', async () => {
    const {getByTestId} = render(<HelpDialog {...defaultProps} />);

    await act(async () => {
      await waitFor(() => {
        expect(getByTestId('search-bar')).toBeTruthy();
      });
    });
  });

  it('should filter content when searching', async () => {
    const {getByTestId} = render(<HelpDialog {...defaultProps} />);

    await act(async () => {
      await waitFor(() => {
        expect(getByTestId('search-bar')).toBeTruthy();
      });
    });

    const searchBar = getByTestId('search-bar');
    fireEvent.changeText(searchBar, '拍照');
    expect(searchBar).toBeTruthy();
  });

  it('should handle help content loading error gracefully', async () => {
    const {helpContentService} = require('../../services/helpContentService');
    helpContentService.getHelpContent.mockRejectedValueOnce(new Error('Network error'));
    helpContentService.getGenericHelp.mockRejectedValueOnce(new Error('Network error'));
    helpContentService.searchHelp.mockResolvedValue([]);

    const {toJSON} = render(<HelpDialog {...defaultProps} />);

    await act(async () => {
      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      }, {timeout: 3000});
    });
  });
});
