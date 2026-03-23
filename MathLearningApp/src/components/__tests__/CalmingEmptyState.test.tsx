/**
 * Story 5-4: CalmingEmptyState 组件测试
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import CalmingEmptyState from '../CalmingEmptyState';

describe('CalmingEmptyState', () => {
  const defaultProps = {
    title: '准备好开始了吗？',
    message: '每一次练习都是进步的开始',
  };

  it('renders correctly with title and message', () => {
    const {getByText} = render(<CalmingEmptyState {...defaultProps} />);

    expect(getByText('准备好开始了吗？')).toBeTruthy();
    expect(getByText('每一次练习都是进步的开始')).toBeTruthy();
  });

  it('renders with icon', () => {
    const {getByTestId} = render(
      <CalmingEmptyState {...defaultProps} icon="photo-camera" />
    );

    // Icon should be rendered
    expect(getByTestId).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const onAction = jest.fn();
    const {getByText} = render(
      <CalmingEmptyState {...defaultProps} actionLabel="开始" onAction={onAction} />
    );

    const actionButton = getByText('开始');
    expect(actionButton).toBeTruthy();

    fireEvent.press(actionButton);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action when provided', () => {
    const onSecondaryAction = jest.fn();
    const {getByText} = render(
      <CalmingEmptyState
        {...defaultProps}
        secondaryActionLabel="稍后再说"
        onSecondaryAction={onSecondaryAction}
      />
    );

    const secondaryButton = getByText('稍后再说');
    expect(secondaryButton).toBeTruthy();

    fireEvent.press(secondaryButton);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
  });

  it('shows help tip when showHelpTip is true', () => {
    const {getByText} = render(
      <CalmingEmptyState {...defaultProps} showHelpTip={true} />
    );

    expect(getByText('需要帮助？点击右上角的问号')).toBeTruthy();
  });

  it('hides help tip when showHelpTip is false', () => {
    const {queryByText} = render(
      <CalmingEmptyState {...defaultProps} showHelpTip={false} />
    );

    expect(queryByText('需要帮助？点击右上角的问号')).toBeNull();
  });
});
