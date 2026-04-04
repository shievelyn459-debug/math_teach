import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PDFActionButtons from '../PDFActionButtons';

describe('PDFActionButtons', () => {
  const mockOnShare = jest.fn();
  const mockOnPrint = jest.fn();
  const mockOnOpen = jest.fn();
  const mockOnViewAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render share, print, and open buttons by default', () => {
    const { getByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
      />
    );

    expect(getByText('分享')).toBeTruthy();
    expect(getByText('打印')).toBeTruthy();
    expect(getByText('打开')).toBeTruthy();
  });

  it('should call onShare when share button is pressed', () => {
    const { getByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
      />
    );

    fireEvent.press(getByText('分享'));
    expect(mockOnShare).toHaveBeenCalledTimes(1);
  });

  it('should call onPrint when print button is pressed', () => {
    const { getByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
      />
    );

    fireEvent.press(getByText('打印'));
    expect(mockOnPrint).toHaveBeenCalledTimes(1);
  });

  it('should call onOpen when open button is pressed', () => {
    const { getByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
      />
    );

    fireEvent.press(getByText('打开'));
    expect(mockOnOpen).toHaveBeenCalledTimes(1);
  });

  it('should show loading indicator when sharing', () => {
    const { getByText, queryByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
        sharing={true}
      />
    );

    // Share button should show loading
    expect(queryByText('分享')).toBeNull();
  });

  it('should show loading indicator when printing', () => {
    const { getByText, queryByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
        printing={true}
      />
    );

    expect(queryByText('打印')).toBeNull();
  });

  it('should show loading indicator when opening', () => {
    const { getByText, queryByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
        opening={true}
      />
    );

    expect(queryByText('打开')).toBeNull();
  });

  it('should disable all buttons when any action is loading', () => {
    const { getByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
        sharing={true}
      />
    );

    // Try to press print while sharing (should be disabled)
    fireEvent.press(getByText('打印'));
    expect(mockOnPrint).not.toHaveBeenCalled();
  });

  it('should render view all button when showViewAll is true', () => {
    const { getByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
        onViewAll={mockOnViewAll}
        showViewAll={true}
      />
    );

    expect(getByText('查看我的 PDF')).toBeTruthy();
  });

  it('should call onViewAll when view all button is pressed', () => {
    const { getByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onOpen={mockOnOpen}
        onViewAll={mockOnViewAll}
        showViewAll={true}
      />
    );

    fireEvent.press(getByText('查看我的 PDF'));
    expect(mockOnViewAll).toHaveBeenCalledTimes(1);
  });

  it('should not render buttons when handlers are not provided', () => {
    const { queryByText } = render(<PDFActionButtons />);

    expect(queryByText('分享')).toBeNull();
    expect(queryByText('打印')).toBeNull();
    expect(queryByText('打开')).toBeNull();
  });

  it('should render only share and print buttons when onOpen is not provided', () => {
    const { getByText, queryByText } = render(
      <PDFActionButtons
        onShare={mockOnShare}
        onPrint={mockOnPrint}
      />
    );

    expect(getByText('分享')).toBeTruthy();
    expect(getByText('打印')).toBeTruthy();
    expect(queryByText('打开')).toBeNull();
  });
});
