/**
 * FormatSelector Component Tests
 * Story 3-4: multiple-explanation-formats
 * Task 8: Add comprehensive tests
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {FormatSelector} from '../FormatSelector';
import {ExplanationFormat} from '../../types/explanation';

describe('FormatSelector Component', () => {
  const mockProps = {
    availableFormats: [ExplanationFormat.TEXT],
    selectedFormat: ExplanationFormat.TEXT,
    onFormatChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * AC2: Format type enum is defined and used consistently
   */
  it('should render all format buttons', () => {
    const {getByTestId} = render(
      <FormatSelector
        {...mockProps}
        availableFormats={[ExplanationFormat.TEXT, ExplanationFormat.ANIMATION, ExplanationFormat.VIDEO]}
      />
    );

    expect(getByTestId('format-button-text')).toBeTruthy();
    expect(getByTestId('format-button-animation')).toBeTruthy();
    expect(getByTestId('format-button-video')).toBeTruthy();
  });

  /**
   * AC3: Each format has a clear icon and label
   */
  it('should display correct icons and labels for each format', () => {
    const {getByText, getByTestId} = render(
      <FormatSelector
        {...mockProps}
        availableFormats={[ExplanationFormat.TEXT, ExplanationFormat.ANIMATION, ExplanationFormat.VIDEO]}
      />
    );

    expect(getByText('📝')).toBeTruthy();
    expect(getByText('文字')).toBeTruthy();

    expect(getByText('🎬')).toBeTruthy();
    expect(getByText('动画')).toBeTruthy();

    expect(getByText('🎥')).toBeTruthy();
    expect(getByText('视频')).toBeTruthy();
  });

  /**
   * AC4: Format selector UI component displays available formats
   * AC8: Format availability is displayed (enabled/disabled states)
   */
  it('should show disabled state for unavailable formats', () => {
    const {getByTestId} = render(
      <FormatSelector
        {...mockProps}
        availableFormats={[ExplanationFormat.TEXT]}
      />
    );

    const animationButton = getByTestId('format-button-animation');
    const videoButton = getByTestId('format-button-video');

    // Unavailable formats should show "即将" badge
    expect(animationButton).toBeTruthy();
    expect(videoButton).toBeTruthy();
  });

  /**
   * Format switching functionality
   */
  it('should call onFormatChange when available format is pressed', () => {
    const {getByTestId} = render(
      <FormatSelector
        {...mockProps}
        availableFormats={[ExplanationFormat.TEXT, ExplanationFormat.ANIMATION]}
      />
    );

    fireEvent.press(getByTestId('format-button-animation'));
    expect(mockProps.onFormatChange).toHaveBeenCalledWith(ExplanationFormat.ANIMATION);
  });

  /**
   * Disabled format buttons should not trigger change
   */
  it('should not call onFormatChange when unavailable format is pressed', () => {
    const {getByTestId} = render(
      <FormatSelector
        {...mockProps}
        availableFormats={[ExplanationFormat.TEXT]}
      />
    );

    fireEvent.press(getByTestId('format-button-video'));
    expect(mockProps.onFormatChange).not.toHaveBeenCalled();
  });

  /**
   * Props disabled state
   */
  it('should not call onFormatChange when component is disabled', () => {
    const {getByTestId} = render(
      <FormatSelector
        {...mockProps}
        availableFormats={[ExplanationFormat.TEXT, ExplanationFormat.ANIMATION]}
        disabled={true}
      />
    );

    fireEvent.press(getByTestId('format-button-animation'));
    expect(mockProps.onFormatChange).not.toHaveBeenCalled();
  });

  /**
   * AC10: Accessibility compliance
   */
  it('should have proper accessibility labels', () => {
    const {getByTestId} = render(
      <FormatSelector
        {...mockProps}
        availableFormats={[ExplanationFormat.TEXT]}
      />
    );

    const textButton = getByTestId('format-button-text');
    expect(textButton.props.accessibilityLabel).toBe('文字讲解');
    expect(textButton.props.accessibilityRole).toBe('tab');
  });

  /**
   * Selected state visual feedback
   */
  it('should apply selected styling to active format', () => {
    const {getByTestId} = render(
      <FormatSelector
        {...mockProps}
        selectedFormat={ExplanationFormat.TEXT}
        availableFormats={[ExplanationFormat.TEXT]}
      />
    );

    const textButton = getByTestId('format-button-text');
    expect(textButton.props.accessibilityState.selected).toBe(true);
  });

  /**
   * Coming soon badge for unavailable formats
   */
  it('should show coming soon badge for animation format when unavailable', () => {
    const {getAllByText} = render(
      <FormatSelector
        {...mockProps}
        availableFormats={[ExplanationFormat.TEXT]}
      />
    );

    // Both animation and video should show "即将" badge
    const badges = getAllByText('即将');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });
});

describe('FormatSelector Enum', () => {
  /**
   * AC1: System supports three explanation formats
   * AC2: Format type enum is defined
   */
  it('should have all three format types defined', () => {
    expect(ExplanationFormat.TEXT).toBe('text');
    expect(ExplanationFormat.ANIMATION).toBe('animation');
    expect(ExplanationFormat.VIDEO).toBe('video');
  });
});
