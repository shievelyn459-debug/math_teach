import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {Button, Card, useTheme} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {FormInput, PasswordInput} from '../components/FormInput';
import {authService} from '../services/authService';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer, Icon} from '../components/ui';

type RegisterScreenProps = NativeStackScreenProps<any, 'Register'>;

/**
 * 用户注册屏幕
 * 实现用户注册功能，包含表单验证和错误处理
 *
 * 验收标准:
 * AC1: 家长用户可以提供姓名、邮箱、密码创建新账户
 * AC2: 系统验证邮箱格式和密码强度（最少8个字符，包含字母和数字）
 * AC3: 系统检查邮箱是否已注册并显示适当的错误信息
 * AC4: 注册成功后自动登录并导航到主页
 * AC5: 注册表单提供清晰友好的反馈和错误信息
 * AC6: 注册过程在正常网络条件下5秒内完成
 * AC7: 用户数据按照架构中的安全要求安全存储
 */
const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const theme = useTheme();

  // 表单状态
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);

  // 错误状态
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 验证姓名 (AC2: 最少2个字符)
    if (!name.trim()) {
      newErrors.name = '请输入您的姓名';
    } else if (name.trim().length < 2) {
      newErrors.name = '姓名至少需要2个字符';
    }

    // 验证邮箱格式 (AC2)
    if (!email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!authService.isValidEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 验证密码 (AC2: 最少8个字符，包含字母和数字)
    if (!password) {
      newErrors.password = '请输入密码';
    } else {
      const passwordValidation = authService.isValidPassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors.join('，');
      }
    }

    // 验证确认密码
    if (!confirmPassword) {
      newErrors.confirmPassword = '请再次输入密码';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理注册提交
   */
  const handleRegister = async () => {
    // 清除之前的错误
    setErrors({});

    // 验证表单
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 调用注册服务
      const response = await authService.register(
        name.trim(),
        email.trim().toLowerCase(),
        password
      );

      if (response.success) {
        // 注册成功 (AC4: 自动登录并导航到主页)
        navigation.reset({
          index: 0,
          routes: [{name: 'Main'}],
        });
      } else {
        // 注册失败 (AC3, AC5: 显示友好的错误信息)
        if (response.error?.message?.includes('超时') || response.error?.code === 'TIMEOUT_ERROR') {
          setErrors({
            general: '注册请求超时，请检查网络连接后重试',
          });
        } else {
          setErrors({
            general: response.error?.message || '注册失败，请检查输入信息后重试',
          });
        }
      }
    } catch (error) {
      console.error('[RegisterScreen] Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('超时') || errorMessage.includes('timeout')) {
        setErrors({
          general: '请求超时，请检查您的网络连接后重试',
        });
      } else {
        setErrors({
          general: '网络连接出现问题，请检查您的网络后重试',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 导航到登录页面
   */
  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* 顶部标题区域 */}
        <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
          <Typography
            variant="headlineLarge"
            color={designSystem.colors.text.inverse}
            style={styles.headerTitle}>
            创建账户
          </Typography>
          <Typography
            variant="body"
            color={designSystem.colors.text.inverse}
            style={styles.headerSubtitle}>
            加入一年级数学学习助手，帮助您的孩子爱上数学
          </Typography>
        </View>

        {/* 注册表单卡片 */}
        <Card style={styles.card}>
          <Card.Content>
            <Typography variant="headlineSmall" style={styles.cardTitle}>
              请填写您的信息
            </Typography>

            {/* 通用错误提示 */}
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

            {/* 姓名输入 (AC1) */}
            <FormInput
              label="姓名"
              value={name}
              onChangeText={setName}
              placeholder="请输入您的姓名"
              autoCapitalize="words"
              error={errors.name}
              testID="name-input"
            />

            {/* 邮箱输入 (AC1, AC2) */}
            <FormInput
              label="邮箱地址"
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              testID="email-input"
            />

            {/* 密码输入 (AC1, AC2) */}
            <PasswordInput
              label="密码"
              value={password}
              onChangeText={setPassword}
              placeholder="至少8个字符，包含大小写字母、数字和特殊字符"
              error={errors.password}
              testID="password-input"
            />

            {/* 确认密码输入 (AC1) */}
            <PasswordInput
              label="确认密码"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="请再次输入密码"
              error={errors.confirmPassword}
              testID="confirm-password-input"
            />

            {/* 密码要求提示 (AC5) */}
            <View style={styles.passwordHint}>
              <Typography variant="bodyLarge" color={designSystem.colors.info.default}>
                密码要求：
              </Typography>
              <Spacer size="xs" />
              <Typography variant="overline" color={designSystem.colors.text.secondary}>
                • 至少8个字符{'\n'}
                • 包含大写字母（A-Z）{'\n'}
                • 包含小写字母（a-z）{'\n'}
                • 包含数字（0-9）{'\n'}
                • 包含特殊字符（!@#$%^&*等）
              </Typography>
            </View>

            {/* 注册按钮 */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
              testID="register-button">
              {isLoading ? '注册中...' : '注册'}
            </Button>

            {/* 已有账户链接 */}
            <View style={styles.loginLinkContainer}>
              <Typography variant="body" color={designSystem.colors.text.secondary}>
                已有账户？
              </Typography>
              <Spacer size="xs" horizontal />
              <TouchableOpacity onPress={navigateToLogin} testID="login-link">
                <Typography variant="bodyLarge" color={theme.colors.primary}>
                  立即登录
                </Typography>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* 友好提示 (AC5) */}
        <View style={styles.tipsBox}>
          <View style={styles.tipsHeader}>
            <Icon name="lightbulb" size="md" color={designSystem.colors.warning.main} />
            <Spacer size="sm" horizontal />
            <Typography variant="bodyLarge" color={designSystem.colors.warning.main}>
              温馨提示
            </Typography>
          </View>
          <Spacer size="sm" />
          <Typography variant="body" color={designSystem.colors.text.secondary}>
            • 注册后，您可以添加孩子的信息并开始使用{'\n'}
            • 您的个人信息将被安全保护{'\n'}
            • 如有问题，请随时联系客服
          </Typography>
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
  header: {
    padding: designSystem.spacing.xl,
    paddingTop: 60,
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
  passwordHint: {
    backgroundColor: designSystem.colors.info.light,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginVertical: designSystem.spacing.lg,
  },
  registerButton: {
    marginTop: designSystem.spacing.sm,
  },
  registerButtonContent: {
    paddingVertical: designSystem.spacing.sm,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: designSystem.spacing.xl,
  },
  tipsBox: {
    margin: designSystem.spacing.lg,
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

export default RegisterScreen;
