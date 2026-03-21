import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {Button, Card, useTheme} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {FormInput, PasswordInput} from '../components/FormInput';
import {authService} from '../services/authService';

type LoginScreenProps = NativeStackScreenProps<any, 'Login'>;

/**
 * 用户登录屏幕
 * Story 1-2 实现内容，这里创建基础版本用于导航完整性
 */
const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const theme = useTheme();

  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);

  // 错误状态
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!authService.isValidEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理登录提交
   */
  const handleLogin = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(
        email.trim().toLowerCase(),
        password
      );

      if (response.success) {
        navigation.reset({
          index: 0,
          routes: [{name: 'Main'}],
        });
      } else {
        if (response.error?.code === 'USER_NOT_FOUND') {
          setErrors({
            general: response.error.message,
            email: response.error.message,
          });
        } else {
          setErrors({
            general: response.error?.message || '登录失败，请稍后重试',
          });
        }
      }
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      setErrors({
        general: '网络连接出现问题，请检查您的网络后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 导航到注册页面
   */
  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        {/* 顶部标题区域 */}
        <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
          <Text style={styles.headerTitle}>欢迎回来</Text>
          <Text style={styles.headerSubtitle}>
            登录您的账户继续使用
          </Text>
        </View>

        {/* 登录表单卡片 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>登录</Text>

            {errors.general && (
              <View style={[styles.errorBox, {backgroundColor: '#ffebee'}]}>
                <Text style={[styles.errorBoxText, {color: '#c62828'}]}>
                  {errors.general}
                </Text>
              </View>
            )}

            <FormInput
              label="邮箱地址"
              value={email}
              onChangeText={setEmail}
              placeholder="请输入邮箱"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <PasswordInput
              label="密码"
              value={password}
              onChangeText={setPassword}
              placeholder="请输入密码"
              error={errors.password}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}>
              {isLoading ? '登录中...' : '登录'}
            </Button>

            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerLinkText}>还没有账户？</Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={[styles.registerLink, {color: theme.colors.primary}]}>
                  立即注册
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 80,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  card: {
    margin: 16,
    marginTop: 32,
    borderRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default LoginScreen;
