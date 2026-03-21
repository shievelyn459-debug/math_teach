import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {FormInput, PasswordInput} from '../FormInput';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007bff',
      error: '#f44336',
    },
  }),
}));

describe('FormInput Component', () => {
  describe('FormInput', () => {
    const defaultProps = {
      label: 'Test Label',
      value: '',
      onChangeText: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render correctly with required props', () => {
      const {getByTestId, getByText} = render(
        <FormInput {...defaultProps} testID="test-input" />
      );

      expect(getByText('Test Label')).toBeTruthy();
      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('should render placeholder when provided', () => {
      const {getByPlaceholderText} = render(
        <FormInput
          {...defaultProps}
          placeholder="Enter text"
          testID="test-input"
        />
      );

      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should call onChangeText when input changes', () => {
      const onChangeText = jest.fn();
      const {getByTestId} = render(
        <FormInput
          {...defaultProps}
          onChangeText={onChangeText}
          testID="test-input"
        />
      );

      const input = getByTestId('test-input');
      fireEvent.changeText(input, 'test value');

      expect(onChangeText).toHaveBeenCalledWith('test value');
    });

    it('should display error message when error prop is provided', () => {
      const {getByText} = render(
        <FormInput
          {...defaultProps}
          error="This field is required"
          testID="test-input"
        />
      );

      expect(getByText('This field is required')).toBeTruthy();
    });

    it('should render with secure text entry when enabled', () => {
      const {getByTestId} = render(
        <FormInput
          {...defaultProps}
          secureTextEntry={true}
          testID="test-input"
        />
      );

      const input = getByTestId('test-input');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should render with correct keyboard type', () => {
      const {getByTestId} = render(
        <FormInput
          {...defaultProps}
          keyboardType="email-address"
          testID="test-input"
        />
      );

      const input = getByTestId('test-input');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('should be disabled when disabled prop is true', () => {
      const {getByTestId} = render(
        <FormInput
          {...defaultProps}
          disabled={true}
          testID="test-input"
        />
      );

      const input = getByTestId('test-input');
      expect(input.props.editable).toBe(false);
    });

    it('should enforce max length when provided', () => {
      const {getByTestId} = render(
        <FormInput
          {...defaultProps}
          maxLength={10}
          testID="test-input"
        />
      );

      const input = getByTestId('test-input');
      expect(input.props.maxLength).toBe(10);
    });

    it('should not auto-capitalize when autoCapitalize is none', () => {
      const {getByTestId} = render(
        <FormInput
          {...defaultProps}
          autoCapitalize="none"
          testID="test-input"
        />
      );

      const input = getByTestId('test-input');
      expect(input.props.autoCapitalize).toBe('none');
    });
  });

  describe('PasswordInput Component', () => {
    const defaultProps = {
      label: 'Password',
      value: '',
      onChangeText: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render correctly with required props', () => {
      const {getByText, getByPlaceholderText} = (
        <PasswordInput {...defaultProps} testID="password-input" />
      );

      expect(getByText('Password')).toBeTruthy();
      expect(getByPlaceholderText('请输入密码')).toBeTruthy();
    });

    it('should render custom placeholder when provided', () => {
      const {getByPlaceholderText} = render(
        <PasswordInput
          {...defaultProps}
          placeholder="Enter your password"
          testID="password-input"
        />
      );

      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    });

    it('should display error message when error prop is provided', () => {
      const {getByText} = render(
        <PasswordInput
          {...defaultProps}
          error="Password is required"
          testID="password-input"
        />
      );

      expect(getByText('Password is required')).toBeTruthy();
    });

    it('should show toggle button', () => {
      const {getByText} = render(
        <PasswordInput {...defaultProps} testID="password-input" />
      );

      expect(getByText('显示')).toBeTruthy();
    });

    it('should toggle password visibility when toggle button is pressed', () => {
      const {getByTestId, getByText} = render(
        <PasswordInput {...defaultProps} testID="password-input" />
      );

      // Initially, password should be hidden
      const input = getByTestId('password-input');
      expect(input.props.secureTextEntry).toBe(true);

      // Press the toggle button
      const toggleButton = getByText('显示');
      fireEvent.press(toggleButton);

      // Now password should be visible
      expect(input.props.secureTextEntry).toBe(false);
      expect(getByText('隐藏')).toBeTruthy();
    });

    it('should call onChangeText when input changes', () => {
      const onChangeText = jest.fn();
      const {getByTestId} = render(
        <PasswordInput
          {...defaultProps}
          onChangeText={onChangeText}
          testID="password-input"
        />
      );

      const input = getByTestId('password-input');
      fireEvent.changeText(input, 'password123');

      expect(onChangeText).toHaveBeenCalledWith('password123');
    });

    it('should maintain password visibility toggle state across changes', () => {
      const {getByTestId, getByText} = render(
        <PasswordInput {...defaultProps} testID="password-input" />
      );

      const input = getByTestId('password-input');

      // Toggle to show
      fireEvent.press(getByText('显示'));
      expect(input.props.secureTextEntry).toBe(false);

      // Change text
      fireEvent.changeText(input, 'newpassword');
      expect(input.props.secureTextEntry).toBe(false);

      // Toggle to hide
      fireEvent.press(getByText('隐藏'));
      expect(input.props.secureTextEntry).toBe(true);
    });
  });
});
