import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Button, Card, useTheme} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {PasswordInput} from '../components/FormInput';
import {passwordResetService} from '../services/passwordResetService';

type SetNewPasswordScreenProps = NativeStackScreenProps<any, 'SetNewPassword'>;

/**
 * 设置新密码屏幕
 * Story 1-3: 家长用户重置密码
 *
 * 验收标准:
 * AC4: 重置链接1小时后过期
 * AC5: 用户可以使用重置链接/令牌设置新密码
 * AC6: 新密码必须符合安全要求（8+字符，字母+数字）
 * AC7: 成功重置后，用户可以使用新密码登录
 * AC8: 密码更新在3秒内完成
 * AC9: 用户在每个步骤都能收到清晰的反馈
 */
const SetNewPasswordScreen: React.FC<SetNewPasswordScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();

  // 从路由参数获取重置令牌（深度链接）
  const {token} = route.params || {};

  // 表单状态
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);

  // 错误状态
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // 成功状态
  const [isSuccess, setIsSuccess] = useState(false);

  // 令牌验证状态
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  /**
   * 验证重置令牌
   * AC4: 检查令牌是否过期
   */
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setErrors({
          general: '无效的重置链接，请重新申请密码重置',
        });
        return;
      }

      const validation = await passwordResetService.validateResetToken(
        token as string
      );
      setIsTokenValid(validation.valid);

      if (!validation.valid) {
        setErrors({
          general: '重置链接已过期或无效，请重新申请密码重置',
        });
      }
    };

    validateToken();
  }, [token]);

  /**
   * 验证表单
   * AC6: 新密码必须符合安全要求（8+字符，字母+数字）
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 验证新密码
    if (!newPassword) {
      newErrors.newPassword = '请输入新密码';
    } else {
      // AC6: 密码强度验证
      // 检查长度
      if (newPassword.length < 8) {
        newErrors.newPassword = '密码至少需要8个字符';
      } else {
        // 检查是否包含字母
        const hasLetters = /[a-zA-Z]/.test(newPassword);
        // 检查是否包含数字
        const hasNumbers = /[0-9]/.test(newPassword);

        if (!hasLetters || !hasNumbers) {
          newErrors.newPassword = '密码必须包含字母和数字';
        }
      }
    }

    // 验证确认密码
    if (!confirmPassword) {
      newErrors.confirmPassword = '请再次输入密码';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理新密码输入变化
   */
  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (errors.newPassword || errors.general) {
      setErrors(prev => ({
        ...prev,
        newPassword: undefined,
        general: undefined,
      }));
    }
  };

  /**
   * 处理确认密码输入变化
   */
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (errors.confirmPassword || errors.general) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: undefined,
        general: undefined,
      }));
    }
  };

  /**
   * 计算密码强度
   */
  const getPasswordStrength = (): {strength: string; color: string; label: string} => {
    if (!newPassword) {
      return {strength: 'weak', color: '#bdbdbd', label: ''};
    }

    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;

    if (score <= 2) {
      return {strength: 'weak', color: '#ef5350', label: '弱'};
    } else if (score <= 4) {
      return {strength: 'medium', color: '#ffa726', label: '中'};
    } else {
      return {strength: 'strong', color: '#66bb6a', label: '强'};
    }
  };

  /**
   * 处理密码重置确认
   * AC5: 用户使用令牌设置新密码
   * AC6: 验证密码强度
   * AC7: 成功重置后用户可以使用新密码登录
   * AC8: 密码更新在3秒内完成
   * AC9: 清晰的用户反馈
   */
  const handleConfirmReset = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await passwordResetService.confirmPasswordReset(
        token as string,
        newPassword
      );

      if (response.success) {
        // AC7 & AC9: 密码重置成功
        setIsSuccess(true);
      } else {
        // 显示错误
        setErrors({
          general: response.error?.message || '密码重置失败，请稍后重试',
        });
      }
    } catch (error) {
      console.error('[SetNewPasswordScreen] Confirm reset failed:', error);
      setErrors({
        general: '网络连接出现问题，请检查您的网络后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 返回登录屏幕
   */
  const navigateToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  const passwordStrength = getPasswordStrength();

  // 令牌验证中
  if (isTokenValid === null) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>验证重置链接...</Text>
        </View>
      </View>
    );
  }

  // 令牌无效
  if (isTokenValid === false) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
              <Text style={styles.headerTitle}>链接无效</Text>
              <Text style={styles.headerSubtitle}>
                重置链接已过期或无效
              </Text>
            </View>

            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorTitle}>重置链接无效</Text>
                  <Text style={styles.errorMessage}>
                    {errors.general ||
                      '重置链接已过期或无效，请重新申请密码重置。'}
                  </Text>

                  <Button
                    mode="contained"
                    onPress={navigateToLogin}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                    labelStyle={styles.submitButtonLabel}>
                    返回登录
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            <Text style={styles.headerTitle}>设置新密码</Text>
            <Text style={styles.headerSubtitle}>
              请输入您的新密码
            </Text>
          </View>

          {/* 表单卡片 */}
          <Card style={styles.card}>
            <Card.Content>
              {!isSuccess ? (
                <>
                  <Text style={styles.cardTitle}>创建新密码</Text>

                  {/* 说明文字 */}
                  <Text style={styles.instructionText}>
                    为了保护账户安全，请设置一个强密码。
                  </Text>

                  {/* 通用错误提示 (AC9) */}
                  {errors.general && (
                    <View
                      style={[styles.errorBox, {backgroundColor: '#ffebee'}]}>
                      <Text style={[styles.errorBoxText, {color: '#c62828'}]}>
                        {errors.general}
                      </Text>
                    </View>
                  )}

                  {/* 新密码输入 (AC5, AC6) */}
                  <PasswordInput
                    label="新密码"
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    placeholder="请输入新密码"
                    error={errors.newPassword}
                    testID="new-password-input"
                  />

                  {/* 密码强度指示器 (AC6) */}
                  {newPassword.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <Text style={styles.strengthLabel}>密码强度：</Text>
                      <View style={styles.strengthBarContainer}>
                        <View
                          style={[
                            styles.strengthBar,
                            {backgroundColor: passwordStrength.color},
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.strengthText,
                          {color: passwordStrength.color},
                        ]}>
                        {passwordStrength.label}
                      </Text>
                    </View>
                  )}

                  {/* 密码要求提示 (AC6) */}
                  <View style={styles.requirementsBox}>
                    <Text style={styles.requirementsTitle}>密码要求：</Text>
                    <Text style={styles.requirementsText}>
                      ✓ 至少8个字符
                      {'\n'}✓ 包含字母和数字
                      {'\n'}• 建议包含大小写字母和特殊字符
                    </Text>
                  </View>

                  {/* 确认密码输入 (AC5) */}
                  <PasswordInput
                    label="确认新密码"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    placeholder="请再次输入新密码"
                    error={errors.confirmPassword}
                    testID="confirm-password-input"
                  />

                  {/* 确认重置按钮 (AC8) */}
                  <Button
                    mode="contained"
                    onPress={handleConfirmReset}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                    labelStyle={styles.submitButtonLabel}
                    testID="confirm-reset-button">
                    {isLoading ? '重置中...' : '确认重置密码'}
                  </Button>

                  {/* 取消按钮 */}
                  <Button
                    mode="text"
                    onPress={navigateToLogin}
                    disabled={isLoading}
                    testID="cancel-button">
                    取消
                  </Button>
                </>
              ) : (
                <>
                  {/* 成功状态 (AC7, AC9) */}
                  <View style={styles.successContainer}>
                    <Text style={styles.successIcon}>✅</Text>
                    <Text style={styles.successTitle}>密码重置成功！</Text>
                    <Text style={styles.successMessage}>
                      您的密码已成功重置，现在可以使用新密码登录。
                    </Text>

                    <Button
                      mode="contained"
                      onPress={navigateToLogin}
                      style={styles.submitButton}
                      contentStyle={styles.submitButtonContent}
                      labelStyle={styles.submitButtonLabel}
                      testID="go-to-login-button">
                      前往登录
                    </Button>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {/* 友好提示 (AC9) */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 安全提示</Text>
            <Text style={styles.tipsText}>
              • 请勿与他人分享您的密码
              {'\n'}• 定期更换密码以保护账户安全
              {'\n'}• 使用强密码，包含字母、数字和特殊字符
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 14,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  strengthLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  strengthBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 30,
  },
  requirementsBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  requirementsText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
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

export default SetNewPasswordScreen;
