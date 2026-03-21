import React from 'react';
import {TextInput, View, Text, StyleSheet} from 'react-native';
import {useTheme} from 'react-native-paper';

/**
 * 通用表单输入组件
 * 支持错误提示和标签
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
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.label, {color: theme.colors.primary}]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : {},
          disabled ? styles.inputDisabled : {},
          {borderColor: error ? theme.colors.error : '#ddd'},
        ]}
        value={value}
        onChangeText={onChangeText}
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
      {error && <Text style={[styles.errorText, {color: theme.colors.error}]}>{error}</Text>}
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
    <View style={styles.container} testID={testID}>
      <Text style={[styles.label, {color: theme.colors.primary}]}>{label}</Text>
      <View style={[styles.input, styles.passwordContainer, error ? styles.inputError : {}, {borderColor: error ? theme.colors.error : '#ddd'}]}>
        <TextInput
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderWidth: 2,
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
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
