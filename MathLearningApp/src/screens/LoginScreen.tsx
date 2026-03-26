import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Button, Card, Checkbox, useTheme} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {FormInput, PasswordInput} from '../components/FormInput';
import {authService} from '../services/authService';

type LoginScreenProps = NativeStackScreenProps<any, 'Login'>;

/**
 * 用户登录屏幕
 * 测试模式：添加日志以调试导航问题
 * Story 1-2 完整实现
 *
 * 验收标准:
 * AC1: 家长用户可以通过邮箱和密码登录
 * AC2: 系统验证凭证并提供清晰的错误信息
 * AC3: 登录成功后导航到主屏幕
 * AC4: 提供"记住我"选项保持登录状态
 * AC5: 登录表单提供家长友好的反馈和错误信息
 * AC6: 登录过程在正常网络条件下3秒内完成
 * AC7: 跟踪失败登录尝试并应用安全措施
 * AC8: 用户可以导航到注册屏幕
 * AC9: 用户可以导航到密码重置屏幕
 */
const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  console.log('[LoginScreen] Rendering LoginScreen component');
  const theme = useTheme();

  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 记住我状态 (AC4)
  const [rememberMe, setRememberMe] = useState(false);

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

    // 密码验证 (AC2)
    // 登录时只检查密码是否已输入，不验证复杂度（已在注册时完成）
    // 允许密码包含空格（可能是用户故意设置的）
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length > 128) {
      // 防止过长输入导致的问题
      newErrors.password = '密码过长，请检查后重试';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理邮箱输入变化 - 清除邮箱相关错误
   */
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email || errors.general) {
      setErrors(prev => ({...prev, email: undefined, general: undefined}));
    }
  };

  /**
   * 处理密码输入变化 - 清除密码相关错误
   */
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password || errors.general) {
      setErrors(prev => ({...prev, password: undefined, general: undefined}));
    }
  };

  /**
   * 处理登录提交 (AC1, AC3, AC6, AC7)
   * 包含失败尝试跟踪和安全措施
   */
  const handleLogin = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 调用登录服务 (AC6: 在3秒内完成)
      const response = await authService.login(
        email.trim().toLowerCase(),
        password,
        rememberMe  // AC4: 传递记住我偏好
      );

      if (response.success) {
        // 登录成功，导航到主屏幕 (AC3)
        navigation.reset({
          index: 0,
          routes: [{name: 'Main'}],
        });
      } else {
        // 登录失败，显示错误信息 (AC2, AC5)
        // 错误消息已经是家长友好的，来自authService
        if (response.error?.code === 'USER_NOT_FOUND') {
          setErrors({
            general: response.error.message,
            email: response.error.message,
          });
        } else if (response.error?.code === 'ACCOUNT_LOCKED') {
          // 账户锁定安全措施 (AC7)
          setErrors({
            general: response.error.message,
          });
        } else if (response.error?.code === 'TOO_MANY_ATTEMPTS') {
          // 速率限制安全措施 (AC7)
          setErrors({
            general: response.error.message,
          });
        } else {
          setErrors({
            general: response.error?.message || '登录失败，请稍后重试',
          });
        }
      }
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      // 网络错误的家长友好提示 (AC5)
      setErrors({
        general: '网络连接出现问题，请检查您的网络后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 导航到注册页面 (AC8)
   */
  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  /**
   * 导航到密码重置页面 (AC9)
   */
  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
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

              {/* 通用错误提示 (AC5) */}
              {errors.general && (
                <View style={[styles.errorBox, {backgroundColor: '#ffebee'}]}>
                  <Text style={[styles.errorBoxText, {color: '#c62828'}]}>
                    {errors.general}
                  </Text>
                </View>
              )}

              {/* 邮箱输入 (AC1) */}
              <FormInput
                label="邮箱地址"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="请输入邮箱"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                testID="email-input"
              />

              {/* 密码输入 (AC1) */}
              <View>
                <PasswordInput
                  label="密码"
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="请输入密码"
                  error={errors.password}
                  testID="password-input"
                />
                {/* 忘记密码链接 (AC9) */}
                <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity
                    onPress={navigateToForgotPassword}
                    testID="forgot-password-link">
                    <Text style={[styles.forgotPasswordLink, {color: theme.colors.primary}]}>
                      忘记密码？
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 记住我复选框 (AC4) */}
              <View style={styles.rememberMeContainer}>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    testID="remember-me-checkbox"
                    status={rememberMe ? 'checked' : 'unchecked'}
                    onPress={() => setRememberMe(!rememberMe)}
                    color={theme.colors.primary}
                  />
                  <TouchableOpacity
                    onPress={() => setRememberMe(!rememberMe)}
                    style={styles.checkboxLabel}>
                    <Text style={styles.checkboxText}>记住我</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.rememberMeHint}>
                  勾选后30天内保持登录状态，否则7天后需重新登录
                </Text>
              </View>

              {/* 登录按钮 (AC1, AC6) */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                labelStyle={styles.loginButtonLabel}
                testID="login-button">
                {isLoading ? '登录中...' : '登录'}
              </Button>

              {/* 注册链接 (AC8) */}
              <View style={styles.registerLinkContainer}>
                <Text style={styles.registerLinkText}>还没有账户？</Text>
                <TouchableOpacity
                  onPress={navigateToRegister}
                  testID="register-link">
                  <Text style={[styles.registerLink, {color: theme.colors.primary}]}>
                    立即注册
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {/* 友好提示 (AC5) */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 温馨提示</Text>
            <Text style={styles.tipsText}>
              • 登录后可以上传题目并获得讲解
              {'\n'}• 忘记密码可以点击"忘记密码"链接重置
              {'\n'}• 连续多次登录失败可能会临时锁定账户
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  forgotPasswordLink: {
    fontSize: 13,
    fontWeight: '500',
  },
  rememberMeContainer: {
    marginVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    flex: 1,
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
  },
  rememberMeHint: {
    fontSize: 12,
    color: '#666',
    marginLeft: 32,
    marginTop: 4,
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
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
  tipsBox: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#e65100',
  },
  tipsText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 22,
  },
});

export default LoginScreen;
