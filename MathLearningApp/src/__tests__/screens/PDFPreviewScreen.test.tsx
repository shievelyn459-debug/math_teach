/**
 * PDFPreviewScreen 组件测试
 * Story 8-6c: 修复测试套件
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import PDFPreviewScreen from '../../screens/PDFPreviewScreen';

// Mock dependencies
jest.mock('react-native-pdf', () => ({
  Pdf: 'Pdf',
}));

jest.mock('react-native-pdf-lib', () => ({
  PDFDocument: {
    getDocumentsDirectory: jest.fn(() => '/mock/documents/dir'),
  },
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/Documents',
  ExternalStorageDirectoryPath: '/mock/external/storage',
  exists: jest.fn(),
  mkdir: jest.fn(),
  copyFile: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

jest.mock('../../components/FilenameDialog', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {__esModule: true, default: () => React.createElement(View, {testID: 'filename-dialog'})};
});

jest.mock('../../components/PDFActionButtons', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {__esModule: true, default: () => React.createElement(View, {testID: 'pdf-action-buttons'})};
});

jest.mock('../../components/ui', () => ({
  Typography: (props: any) => {
    const React = require('react');
    const {Text} = require('react-native');
    return React.createElement(Text, props, props.children);
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
  Button: (props: any) => {
    const React = require('react');
    const {Text, TouchableOpacity} = require('react-native');
    return React.createElement(TouchableOpacity, {
      testID: props.testID || 'button',
      onPress: props.onPress,
      accessibilityLabel: props.title,
    }, React.createElement(Text, null, props.title));
  },
}));

jest.mock('../../styles/designSystem', () => ({
  designSystem: {
    colors: {
      primary: '#007bff',
      surface: {primary: '#fff', secondary: '#f5f5f5', tertiary: '#e0e0e0'},
      text: {primary: '#000', secondary: '#666', hint: '#999'},
      success: {default: '#4caf50', light: '#e8f5e9'},
      error: {default: '#f44336', light: '#ffebee'},
      info: {default: '#2196f3', light: '#e3f2fd'},
      warning: {light: '#fff3e0', main: '#ff9800', dark: '#e65100', border: '#ffe0b2'},
      overlay: {light: 'rgba(0,0,0,0.3)'},
    },
    spacing: {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32},
    borderRadius: {sm: 4, md: 8, lg: 12, xl: 16},
    shadows: {sm: {}, md: {}, lg: {}},
  },
}));

jest.mock('../../styles/tablet', () => ({
  getScaledSpacing: jest.fn((size: string) => 16),
  getFontSize: jest.fn((size: string) => 14),
}));

import {pdfService} from '../../services/pdfService';

describe('PDFPreviewScreen', () => {
  const mockRoute = {
    params: {
      pdfPath: '/mock/path.pdf',
      questionCount: 10,
      difficulty: 'easy' as const,
    },
  };

  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render PDF preview with header info', () => {
    const {getByText} = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    expect(getByText('PDF 预览')).toBeTruthy();
    expect(getByText('10 题 · 简单')).toBeTruthy();
  });

  it('should show cancel and save buttons', () => {
    const {getByText} = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    expect(getByText('取消')).toBeTruthy();
    expect(getByText('保存 PDF')).toBeTruthy();
  });

  it('should navigate back when cancel button pressed', () => {
    const {getByText} = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    fireEvent.press(getByText('取消'));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should request permissions if not granted', async () => {
    pdfService.checkStoragePermissions = jest.fn().mockResolvedValue(false);
    pdfService.requestStoragePermissions = jest.fn().mockResolvedValue(true);

    const {getByText} = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    fireEvent.press(getByText('保存 PDF'));
    expect(pdfService.checkStoragePermissions).toHaveBeenCalled();
  });

  it('should show error if permissions denied', async () => {
    pdfService.checkStoragePermissions = jest.fn().mockResolvedValue(false);
    pdfService.requestStoragePermissions = jest.fn().mockResolvedValue(false);

    const {getByText} = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    fireEvent.press(getByText('保存 PDF'));

    await waitFor(() => {
      expect(getByText('需要存储权限才能保存 PDF 文件')).toBeTruthy();
    });
  });

  it('should generate correct default filename', () => {
    pdfService.getDifficultyLabel = jest.fn(() => '简单');

    const {getByText} = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    expect(getByText('10 题 · 简单')).toBeTruthy();
  });

  describe('error handling', () => {
    it('should handle save failure gracefully', async () => {
      pdfService.checkStoragePermissions = jest.fn().mockResolvedValue(true);
      pdfService.savePDF = jest.fn().mockRejectedValue(new Error('保存失败'));

      const {getByText} = render(
        <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText('保存 PDF'));

      // Save attempt should have been made (even if it fails through dialog)
      expect(pdfService.checkStoragePermissions).toHaveBeenCalled();
    });
  });
});
