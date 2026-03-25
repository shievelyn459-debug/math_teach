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
          // 确保TextInput不会被其他元素遮挡
          importantForAccessibility="auto"
        />
        {/* 验证状态图标 - 移到输入框外部，不影响输入 */}
        {!error && value.length > 0 && showSuccessIcon && !right && (
          <Text style={styles.externalStatusIcon}>
            {validating ? '验证中...' : valid ? '✓' : ''}
          </Text>
        )}
      </View>
      {/* 自定义右侧内容 */}
      {right && (
        <View style={styles.externalRight}>
          {right}
        </View>
      )}
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
      <View style={styles.inputRow}>
        <TextInput
          testID={testID}
          style={[
            styles.input,
            styles.passwordInput,
            error ? styles.inputError : {},
            {borderColor: error ? theme.colors.error : '#ddd'},
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          importantForAccessibility="auto"
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.toggleButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={[styles.toggleButtonText, {color: theme.colors.primary}]}>
            {secureTextEntry ? '显示' : '隐藏'}
          </Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={[styles.errorText, {color: theme.colors.error}]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
    minHeight: 46,
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#d32f2f',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  externalStatusIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
    fontSize: 16,
  },
  externalRight: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 46,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  toggleButtonText: {
    fontSize: 20,
  },
});
