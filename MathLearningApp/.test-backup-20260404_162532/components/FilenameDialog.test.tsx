import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FilenameDialog from '../FilenameDialog';

// Mock Modal to avoid rendering issues
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockModal({ visible, children }: any) {
    if (!visible) return null;
    return React.createElement(View, { testID: 'modal' }, children);
  };
});

// Mock Keyboard
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Keyboard.dismiss = jest.fn();
  return RN;
});

import { Keyboard } from 'react-native';

describe('FilenameDialog', () => {
  const defaultProps = {
    visible: true,
    defaultFilename: '练习题_2026-03-23.pdf',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <FilenameDialog {...defaultProps} />
    );

    expect(getByText('保存 PDF')).toBeTruthy();
    expect(getByPlaceholderText('请输入文件名')).toBeTruthy();
    expect(getByText('.pdf')).toBeTruthy();
  });

  it('should display default filename', () => {
    const { getByDisplayValue } = render(
      <FilenameDialog {...defaultProps} />
    );

    expect(getByDisplayValue('练习题_2026-03-23.pdf')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <FilenameDialog {...defaultProps} visible={false} />
    );

    expect(queryByText('保存 PDF')).toBeNull();
  });

  it('should call onConfirm with filename when confirm button pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <FilenameDialog {...defaultProps} onConfirm={onConfirm} />
    );

    const confirmButton = getByText('保存');
    fireEvent.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith('练习题_2026-03-23.pdf');
  });

  it('should call onCancel when cancel button pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <FilenameDialog {...defaultProps} onCancel={onCancel} />
    );

    const cancelButton = getByText('取消');
    fireEvent.press(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should not show error for valid filename with special chars like underscore', () => {
    const { queryByText } = render(
      <FilenameDialog {...defaultProps} defaultFilename="练习题_2026-03-23.pdf" />
    );

    expect(queryByText('文件名包含无效字符')).toBeNull();
  });

  it('should add .pdf extension if not present', () => {
    const onConfirm = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <FilenameDialog
        {...defaultProps}
        defaultFilename="练习题"
        onConfirm={onConfirm}
      />
    );

    const input = getByPlaceholderText('请输入文件名');
    fireEvent.changeText(input, '我的练习题');

    const confirmButton = getByText('保存');
    fireEvent.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith('我的练习题.pdf');
  });

  it('should show error for invalid characters when confirm pressed', () => {
    const { getByPlaceholderText, getByText } = render(
      <FilenameDialog {...defaultProps} />
    );

    const input = getByPlaceholderText('请输入文件名');
    fireEvent.changeText(input, 'test<.pdf');

    // 需要点击确认按钮才会触发验证
    const confirmButton = getByText('保存');
    fireEvent.press(confirmButton);

    expect(getByText('文件名包含无效字符')).toBeTruthy();
  });

  it('should show error for empty filename', () => {
    const { getByPlaceholderText, getByText } = render(
      <FilenameDialog {...defaultProps} defaultFilename="" />
    );

    const confirmButton = getByText('保存');
    fireEvent.press(confirmButton);

    expect(getByText('请输入文件名')).toBeTruthy();
  });

  it('should show error for reserved Windows names', () => {
    const { getByText } = render(
      <FilenameDialog {...defaultProps} defaultFilename="CON.pdf" />
    );

    const confirmButton = getByText('保存');
    fireEvent.press(confirmButton);

    expect(getByText('这是系统保留名称')).toBeTruthy();
  });

  it('should show error for too long filename', () => {
    const longName = 'a'.repeat(256) + '.pdf';
    const { getByText } = render(
      <FilenameDialog {...defaultProps} defaultFilename={longName} />
    );

    const confirmButton = getByText('保存');
    fireEvent.press(confirmButton);

    expect(getByText('文件名太长')).toBeTruthy();
  });

  it('should clear error when user starts typing valid input', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <FilenameDialog {...defaultProps} />
    );

    const input = getByPlaceholderText('请输入文件名');
    fireEvent.changeText(input, 'test<.pdf');
    expect(getByText('文件名包含无效字符')).toBeTruthy();

    fireEvent.changeText(input, 'valid_name.pdf');
    expect(queryByText('文件名包含无效字符')).toBeNull();
  });

  it('should dismiss keyboard on confirm', () => {
    const { getByText } = render(
      <FilenameDialog {...defaultProps} />
    );

    const confirmButton = getByText('保存');
    fireEvent.press(confirmButton);

    expect(Keyboard.dismiss).toHaveBeenCalled();
  });

  it('should dismiss keyboard on cancel', () => {
    const { getByText } = render(
      <FilenameDialog {...defaultProps} />
    );

    const cancelButton = getByText('取消');
    fireEvent.press(cancelButton);

    expect(Keyboard.dismiss).toHaveBeenCalled();
  });
});
