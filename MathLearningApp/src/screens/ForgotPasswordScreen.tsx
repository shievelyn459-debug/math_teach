import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {Button, Card, useTheme} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {FormInput} from '../components/FormInput';
import {passwordResetService} from '../services/passwordResetService';

type ForgotPasswordScreenProps = NativeStackScreenProps<any, 'ForgotPassword'>;

/**
 * 密码重置请求屏幕
 * Story 1-3: 家长用户重置密码
 *
 * 验收标准:
 * AC1: 用户可以从登录屏幕通过提供注册邮箱请求重置
 * AC3: 无论邮箱是否存在都显示相同消息（防止邮箱枚举）
 * AC9: 用户在每个步骤都能收到清晰的反馈
 */
const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme();

  // 表单状态
  const [email, setEmail] = useState('');

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);

  // 错误状态
  const [errors, setErrors] = useState<{
    email?: string;
    general?: string;
  }>({});

  // 成功状态
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 邮箱验证
    if (!email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!passwordResetService['isValidEmail'](email)) {
      newErrors.email = '请输入有效的邮箱地址';
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
   * 处理密码重置请求
   * AC1: 用户请求密码重置
   * AC3: 显示相同消息无论邮箱是否存在（防止邮箱枚举）
   * AC8: 请求在5秒内完成
   * AC9: 清晰的用户反馈
   */
  const handleRequestReset = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await passwordResetService.requestPasswordReset(
        email.trim().toLowerCase()
      );

      if (response.success) {
        // AC3 & AC9: 显示成功消息
        // 无论邮箱是否存在，都显示相同的成功消息（防止邮箱枚举）
        setIsSuccess(true);
      } else {
        // 显示错误
        setErrors({
          general: response.error?.message || '请求失败，请稍后重试',
        });
      }
    } catch (error) {
      console.error('[ForgotPasswordScreen] Request failed:', error);
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
    navigation.goBack();
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
            <Text style={styles.headerTitle}>重置密码</Text>
            <Text style={styles.headerSubtitle}>
              输入您的邮箱地址以接收重置链接
            </Text>
          </View>

          {/* 表单卡片 */}
          <Card style={styles.card}>
            <Card.Content>
              {!isSuccess ? (
                <>
                  <Text style={styles.cardTitle}>查找您的账户</Text>

                  {/* 说明文字 */}
                  <Text style={styles.instructionText}>
                    请输入您注册时使用的邮箱地址，我们将向您发送密码重置链接。
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

                  {/* 邮箱输入 (AC1) */}
                  <FormInput
                    label="邮箱地址"
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="请输入注册邮箱"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email}
                    testID="reset-email-input"
                  />

                  {/* 发送重置链接按钮 (AC1, AC8) */}
                  <Button
                    mode="contained"
                    onPress={handleRequestReset}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                    labelStyle={styles.submitButtonLabel}
                    testID="send-reset-link-button">
                    {isLoading ? '发送中...' : '发送重置链接'}
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
                  {/* 成功状态 (AC3, AC9) */}
                  <View style={styles.successContainer}>
                    <Text style={styles.successIcon}>📧</Text>
                    <Text style={styles.successTitle}>邮件已发送！</Text>
                    <Text style={styles.successMessage}>
                      {errors.general
                        ? errors.general
                        : '如果该邮箱已注册，您将收到包含密码重置链接的邮件。'}
                    </Text>

                    {/* AC3: 重申安全措施 - 不透露邮箱是否存在 */}
                    <View
                      style={[styles.noticeBox, {backgroundColor: '#e3f2fd'}]}>
                      <Text style={[styles.noticeText, {color: '#1565c0'}]}>
                        💡 为了保护账户安全，我们不会透露该邮箱是否已注册。
                      </Text>
                    </View>

                    <Text style={styles.instructionText}>
                      请检查您的收件箱（包括垃圾邮件文件夹），点击邮件中的链接重置密码。
                    </Text>

                    {/* 返回登录按钮 */}
                    <Button
                      mode="contained"
                      onPress={navigateToLogin}
                      style={styles.submitButton}
                      contentStyle={styles.submitButtonContent}
                      labelStyle={styles.submitButtonLabel}
                      testID="back-to-login-button">
                      返回登录
                    </Button>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {/* 友好提示 (AC9) */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 温馨提示</Text>
            <Text style={styles.tipsText}>
              {'• '}重置链接将在1小时后失效
              {'\n'}• 如果您没有收到邮件，请检查垃圾邮件文件夹
              {'\n'}• 请勿将重置链接分享给他人
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
  noticeBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 20,
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

export default ForgotPasswordScreen;
