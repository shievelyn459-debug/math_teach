import React from 'react';
import {TextInput, View, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from 'react-native-paper';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon} from '../components/ui';

/**
 * 通用表单输入组件
 * 支持错误提示、成功状态和实时验证
 */
interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  right?: React.ReactNode;
  testID?: string;
  validating?: boolean;
  valid?: boolean;
  showSuccessIcon?: boolean;
  onClearError?: () => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  error,
  disabled = false,
  maxLength,
  right,
  testID,
  validating = false,
  valid,
  showSuccessIcon = true,
  onClearError,
}) => {
  const theme = useTheme();

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (error && onClearError) {
      onClearError();
    }
  };

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (valid && value.length > 0) return designSystem.colors.success.default;
    return designSystem.colors.border;
  };

  return (
    <View style={styles.container}>
      <Typography variant="overline" color={theme.colors.primary} style={styles.label}>
        {label}
      </Typography>
      <View style={styles.inputWrapper}>
        <TextInput
          testID={testID}
          style={[
            styles.input,
            error ? styles.inputError : {},
            disabled ? styles.inputDisabled : {},
            {borderColor: getBorderColor()},
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={designSystem.colors.text.hint}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={!disabled}
          maxLength={maxLength}
          importantForAccessibility="auto"
        />
        {!error && value.length > 0 && showSuccessIcon && !right && (
          <View style={styles.externalStatusIcon}>
            {validating ? (
              <Typography variant="caption" color={designSystem.colors.text.secondary}>
                验证中...
              </Typography>
            ) : valid ? (
              <Icon name="check" size="sm" color={designSystem.colors.success.default} />
            ) : null}
          </View>
        )}
      </View>
      {right && <View style={styles.externalRight}>{right}</View>}
      {error && (
        <View style={[styles.errorContainer, {backgroundColor: designSystem.colors.error.light}]}>
          <Typography variant="overline" color={theme.colors.error} style={styles.errorText}>
            {error}
          </Typography>
          <TouchableOpacity onPress={onClearError} style={styles.clearErrorButton}>
            <Icon name="close" size="sm" color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/**
 * 密码输入组件
 * 带显示/隐藏切换功能
 */
interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  testID?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder = '请输入密码',
  error,
  testID,
}) => {
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);
  const theme = useTheme();

  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={styles.container}>
      <Typography variant="overline" color={theme.colors.primary} style={styles.label}>
        {label}
      </Typography>
      <View
        style={[
          styles.inputRow,
          {borderColor: error ? theme.colors.error : designSystem.colors.border},
        ]}>
        <TextInput
          testID={testID}
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={designSystem.colors.text.hint}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          importantForAccessibility="auto"
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.toggleButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Icon
            name={secureTextEntry ? 'visibility' : 'visibility-off'}
            size="sm"
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
      {error && (
        <Typography variant="overline" color={theme.colors.error}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: designSystem.spacing.lg,
  },
  label: {
    marginBottom: designSystem.spacing.sm,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: designSystem.borderRadius.md,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.md,
    fontSize: designSystem.typography.sizes.body,
    backgroundColor: designSystem.colors.surface.primary,
    minHeight: 46,
    color: designSystem.colors.text.primary,
  },
  inputError: {
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: designSystem.colors.surface.secondary,
    color: designSystem.colors.text.disabled,
  },
  externalStatusIcon: {
    position: 'absolute',
    right: designSystem.spacing.md,
    top: 14,
  },
  externalRight: {
    position: 'absolute',
    right: designSystem.spacing.md,
    top: 12,
    zIndex: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.sm,
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.xs,
  },
  errorText: {
    flex: 1,
  },
  clearErrorButton: {
    padding: designSystem.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.surface.primary,
    paddingRight: designSystem.spacing.sm,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.md,
    fontSize: designSystem.typography.sizes.body,
    minHeight: 46,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: designSystem.colors.text.primary,
  },
  toggleButton: {
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.sm,
  },
});
