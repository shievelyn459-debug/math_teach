import React from 'react';
import {TextInput, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from 'react-native-paper';

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
  // 新增：验证相关
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

  // 输入时清除错误
  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (error && onClearError) {
      onClearError();
    }
  };

  // 获取输入框边框颜色
  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (valid && value.length > 0) return '#4caf50'; // 绿色表示有效
    return '#ddd';
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: theme.colors.primary}]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          testID={testID}
          style={[
            styles.input,
            error ? styles.inputError : {},
            disabled ? styles.inputDisabled : {},
            valid && value.length > 0 ? styles.inputValid : {},
            {borderColor: getBorderColor()},
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={!disabled}
          maxLength={maxLength}
        />
        {right && <View style={styles.rightContainer}>{right}</View>}
        {/* 验证状态图标 */}
        {!error && value.length > 0 && showSuccessIcon && (
          <View style={styles.statusIconContainer}>
            {validating ? (
              <Text style={styles.validatingText}>验证中...</Text>
            ) : valid ? (
              <Text style={styles.successIcon}>✓</Text>
            ) : null}
          </View>
        )}
      </View>
      {/* 内联错误消息 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: theme.colors.error}]}>
            {error}
          </Text>
          <TouchableOpacity onPress={onClearError} style={styles.clearErrorButton}>
            <Text style={[styles.clearErrorText, {color: theme.colors.primary}]}>
              ✕
            </Text>
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
      <Text style={[styles.label, {color: theme.colors.primary}]}>{label}</Text>
      <View style={[styles.input, styles.passwordContainer, error ? styles.inputError : {}, {borderColor: error ? theme.colors.error : '#ddd'}]}>
        <TextInput
          testID={testID}
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <Text
        style={[styles.toggleButton, {color: theme.colors.primary}]}
        onPress={togglePasswordVisibility}>
        {secureTextEntry ? '显示' : '隐藏'}
      </Text>
      {error && <Text style={[styles.errorText, {color: theme.colors.error}]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    paddingRight: 40, // 为状态图标留出空间
  },
  inputError: {
    borderWidth: 2,
  },
  inputValid: {
    borderWidth: 1,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  rightContainer: {
    position: 'absolute',
    right: 12,
    top: 36,
  },
  statusIconContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 18,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  validatingText: {
    fontSize: 10,
    color: '#999',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
  },
  clearErrorButton: {
    padding: 4,
  },
  clearErrorText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  toggleButton: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
});
