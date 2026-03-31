import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Button, Card, Checkbox, useTheme} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {FormInput, PasswordInput} from '../components/FormInput';
import {authService} from '../services/authService';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer, Icon} from '../components/ui';

type LoginScreenProps = NativeStackScreenProps<any, 'Login'>;

/**
 * 用户登录屏幕
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

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length > 128) {
      newErrors.password = '密码过长，请检查后重试';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理邮箱输入变化
   */
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email || errors.general) {
      setErrors(prev => ({...prev, email: undefined, general: undefined}));
    }
  };

  /**
   * 处理密码输入变化
   */
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password || errors.general) {
      setErrors(prev => ({...prev, password: undefined, general: undefined}));
    }
  };

  /**
   * 处理登录提交 (AC1, AC3, AC6, AC7)
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
        password,
        rememberMe,
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
        } else if (
          response.error?.code === 'ACCOUNT_LOCKED' ||
          response.error?.code === 'TOO_MANY_ATTEMPTS'
        ) {
          setErrors({general: response.error.message});
        } else {
          setErrors({general: response.error?.message || '登录失败，请稍后重试'});
        }
      }
    } catch (error) {
      setErrors({general: '网络连接出现问题，请检查您的网络后重试'});
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
            <Typography
              variant="headlineLarge"
              color={designSystem.colors.text.inverse}
              style={styles.headerTitle}>
              欢迎回来
            </Typography>
            <Typography
              variant="body"
              color={designSystem.colors.text.inverse}
              style={styles.headerSubtitle}>
              登录您的账户继续使用
            </Typography>
          </View>

          {/* 登录表单卡片 */}
          <Card style={styles.card}>
            <Card.Content>
              <Typography variant="headlineSmall" style={styles.cardTitle}>
                登录
              </Typography>

              {/* 通用错误提示 (AC5) */}
              {errors.general && (
                <View
                  style={[
                    styles.errorBox,
                    {backgroundColor: designSystem.colors.error.light},
                  ]}>
                  <Icon name="error" size="sm" color={designSystem.colors.error.default} />
                  <Spacer size="sm" horizontal />
                  <Typography variant="body" color={designSystem.colors.error.default}>
                    {errors.general}
                  </Typography>
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
                    <Typography variant="bodySmall" color={theme.colors.primary}>
                      忘记密码？
                    </Typography>
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
                    <Typography variant="body">记住我</Typography>
                  </TouchableOpacity>
                </View>
                <Typography
                  variant="overline"
                  color={designSystem.colors.text.secondary}
                  style={styles.rememberMeHint}>
                  勾选后30天内保持登录状态，否则7天后需重新登录
                </Typography>
              </View>

              {/* 登录按钮 (AC1, AC6) */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                testID="login-button">
                {isLoading ? '登录中...' : '登录'}
              </Button>

              {/* 注册链接 (AC8) */}
              <View style={styles.registerLinkContainer}>
                <Typography variant="body" color={designSystem.colors.text.secondary}>
                  还没有账户？
                </Typography>
                <Spacer size="xs" horizontal />
                <TouchableOpacity onPress={navigateToRegister} testID="register-link">
                  <Typography variant="bodyLarge" color={theme.colors.primary}>
                    立即注册
                  </Typography>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {/* 友好提示 (AC5) */}
          <View style={styles.tipsBox}>
            <View style={styles.tipsHeader}>
              <Icon name="lightbulb" size="md" color={designSystem.colors.warning.default} />
              <Spacer size="sm" horizontal />
              <Typography variant="bodyLarge" color={designSystem.colors.warning.default}>
                温馨提示
              </Typography>
            </View>
            <Spacer size="sm" />
            <Typography variant="body" color={designSystem.colors.text.secondary}>
              • 登录后可以上传题目并获得讲解{'\n'}
              • 忘记密码可以点击"忘记密码"链接重置{'\n'}
              • 连续多次登录失败可能会临时锁定账户
            </Typography>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: designSystem.spacing.xl,
    paddingTop: 80,
    borderBottomLeftRadius: designSystem.borderRadius.xl,
    borderBottomRightRadius: designSystem.borderRadius.xl,
  },
  headerTitle: {
    marginBottom: designSystem.spacing.sm,
  },
  headerSubtitle: {
    opacity: 0.9,
  },
  card: {
    margin: designSystem.spacing.lg,
    marginTop: designSystem.spacing.xxl,
    borderRadius: designSystem.borderRadius.lg,
    elevation: 4,
  },
  cardTitle: {
    marginBottom: designSystem.spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.lg,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: designSystem.spacing.xs,
    marginBottom: designSystem.spacing.sm,
  },
  rememberMeContainer: {
    marginVertical: designSystem.spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: designSystem.spacing.sm,
    flex: 1,
  },
  rememberMeHint: {
    marginLeft: 32,
    marginTop: designSystem.spacing.xs,
  },
  loginButton: {
    marginTop: designSystem.spacing.sm,
  },
  loginButtonContent: {
    paddingVertical: designSystem.spacing.sm,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: designSystem.spacing.xl,
  },
  tipsBox: {
    margin: designSystem.spacing.lg,
    marginTop: 0,
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.warning.light,
    borderRadius: designSystem.borderRadius.lg,
    borderWidth: 1,
    borderColor: designSystem.colors.warning.lighter,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default LoginScreen;
