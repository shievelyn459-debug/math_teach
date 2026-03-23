import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuantitySelector from '../QuantitySelector';

describe('QuantitySelector', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when visible', () => {
    const { getByText } = render(
      <QuantitySelector
        visible={true}
        selected={10}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('选择题目数量')).toBeTruthy();
  });

  it('should not render modal when not visible', () => {
    const { queryByText } = render(
      <QuantitySelector
        visible={false}
        selected={10}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByText('选择题目数量')).toBeNull();
  });

  it('should display all quantity options', () => {
    const { getByText } = render(
      <QuantitySelector
        visible={true}
        selected={10}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('5题')).toBeTruthy();
    expect(getByText('10题')).toBeTruthy();
    expect(getByText('15题')).toBeTruthy();
  });

  it('should highlight selected quantity', () => {
    const { getByTestId } = render(
      <QuantitySelector
        visible={true}
        selected={10}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const selectedOption = getByTestId('quantity-option-10');
    expect(selectedOption).toBeTruthy();
  });

  it('should call onSelect with quantity when option is pressed', () => {
    const { getByText } = render(
      <QuantitySelector
        visible={true}
        selected={10}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('5题'));
    expect(mockOnSelect).toHaveBeenCalledWith(5);
  });

  it('should call onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <QuantitySelector
        visible={true}
        selected={10}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('取消'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
