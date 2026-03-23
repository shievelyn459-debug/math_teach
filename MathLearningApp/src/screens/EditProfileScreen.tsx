/**
 * Story 1-4: 编辑个人资料屏幕
 * 允许用户编辑姓名、邮箱和电话号码
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Button, useTheme} from 'react-native-paper';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {FormInput} from '../components/FormInput';
import {authService} from '../services/authService';
import {userApi} from '../services/api';
import {User} from '../types';

/**
 * 验证结果类型
 */
interface ValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

type EditProfileRouteParams = {
  EditProfile: {
    user: User;
  };
};

/**
 * 编辑个人资料屏幕
 */
const EditProfileScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditProfileRouteParams, 'EditProfile'>>();

  // 安全获取用户参数，防止空值导致崩溃
  const {user} = route.params || {};

  // 如果用户数据不存在，返回上一页
  if (!user) {
    navigation.goBack();
    return null;
  }

  // 表单状态
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [originalData] = useState({name, email, phone});

  // UI 状态
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationResult['errors']>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // 检查是否有更改
    const changed =
      name !== originalData.name ||
      email !== originalData.email ||
      phone !== originalData.phone;
    setHasChanges(changed);
  }, [name, email, phone, originalData]);

  /**
   * 验证姓名 (AC2: 2-50字符)
   */
  const validateName = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) {
      return '姓名至少需要2个字符';
    }
    if (trimmed.length > 50) {
      return '姓名不能超过50个字符';
    }
    return undefined;
  };

  /**
   * 验证邮箱格式 (AC3)
   */
  const validateEmail = (value: string): string | undefined => {
    if (!value || value.trim().length === 0) {
      return '邮箱不能为空';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return '请输入有效的邮箱地址';
    }
    return undefined;
  };

  /**
   * 验证电话号码 (AC4: 可选，格式验证)
   */
  const validatePhone = (value: string): string | undefined => {
    // 电话号码是可选的
    if (!value || value.trim().length === 0) {
      return undefined;
    }

    // E.164 格式验证：+[国家代码][号码]，最少8位，最多15位
    const cleanPhone = value.replace(/[\s-()]/g, '');
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return '请输入有效的电话号码（国际格式：+国家代码+号码）';
    }

    return undefined;
  };

  /**
   * 验证所有字段
   */
  const validateAll = (): ValidationResult => {
    const newErrors: ValidationResult['errors'] = {};

    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const phoneError = validatePhone(phone);
    if (phoneError) newErrors.phone = phoneError;

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  /**
   * 处理保存
   */
  const handleSave = async () => {
    // 验证所有字段
    const validation = validateAll();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // 检查邮箱是否变更 (AC5: 邮箱变更需要验证)
      const emailChanged = email !== originalData.email;

      // Story 1-4 AC9: 3秒内完成更新
      const response = await userApi.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      if (response.success && response.data) {
        // 更新本地用户状态
        await authService.updateProfile(response.data);

        if (emailChanged) {
          // AC5: 邮箱变更需要验证
          Alert.alert(
            '邮箱已更改',
            '验证链接已发送到新邮箱地址。请查收邮件并点击验证链接以完成更改。旧邮箱仍可使用直到验证完成。',
            [
              {
                text: '知道了',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          // AC7: 更改立即保存，显示成功反馈
          Alert.alert('更新成功', '您的个人资料已更新', [
            {
              text: '确定',
              onPress: () => navigation.goBack(),
            },
          ]);
        }
      } else {
        // AC6: 防止重复邮箱
        if (response.error?.code === 'EMAIL_ALREADY_EXISTS') {
          setErrors({email: '该邮箱已被注册'});
        } else {
          Alert.alert(
            '更新失败',
            response.error?.message || '更新资料失败，请稍后重试'
          );
        }
      }
    } catch (error) {
      Alert.alert('更新失败', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理取消 (AC8: 用户可以取消编辑并返回之前的值)
   */
  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        '放弃更改',
        '您有未保存的更改，确定要放弃吗？',
        [
          {text: '继续编辑', style: 'cancel'},
          {
            text: '放弃',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 头部 */}
      <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
        <Text style={styles.headerTitle}>编辑个人资料</Text>
        <Text style={styles.headerSubtitle}>更新您的个人信息</Text>
      </View>

      {/* 表单字段 */}
      <View style={styles.formContainer}>
        {/* 姓名字段 (AC2) */}
        <FormInput
          label="姓名"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors({...errors, name: undefined});
          }}
          placeholder="请输入您的姓名"
          error={errors.name}
          testID="name-input"
        />
        <Text style={styles.hintText}>2-50个字符</Text>

        {/* 邮箱字段 (AC3, AC5, AC6) */}
        <FormInput
          label="邮箱地址"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrors({...errors, email: undefined});
          }}
          placeholder="请输入邮箱地址"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          testID="email-input"
        />

        {/* 电话号码字段 (AC4 - 可选) */}
        <FormInput
          label="电话号码（可选）"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            setErrors({...errors, phone: undefined});
          }}
          placeholder="例如：+8613812345678"
          keyboardType="phone-pad"
          error={errors.phone}
          testID="phone-input"
        />
        <Text style={styles.hintText}>
          国际格式：+国家代码+号码，例如 +8613812345678
        </Text>
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!hasChanges || loading}
          loading={loading}
          style={styles.saveButton}
          testID="save-button">
          {loading ? '保存中...' : '保存更改'}
        </Button>

        <Button
          mode="outlined"
          onPress={handleCancel}
          disabled={loading}
          style={styles.cancelButton}
          testID="cancel-button">
          取消
        </Button>
      </View>

      {/* 未保存更改提示 */}
      {hasChanges && (
        <View style={styles.unsavedHint}>
          <Text style={styles.unsavedHintText}>您有未保存的更改</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  formContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    marginLeft: 4,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 8,
  },
  unsavedHint: {
    alignItems: 'center',
    marginTop: 16,
  },
  unsavedHintText: {
    fontSize: 12,
    color: '#ff9800',
  },
});

export default EditProfileScreen;
