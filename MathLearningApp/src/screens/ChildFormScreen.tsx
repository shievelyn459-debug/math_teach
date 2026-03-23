/**
 * Story 1-5: Child Form Screen
 * Form for adding or editing child information
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useTheme} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {Child, Grade, ChildCreateRequest, ChildUpdateRequest} from '../types';
import {childApi} from '../services/api';
import {activeChildService} from '../services/activeChildService';
import {FormInput} from '../components/FormInput';

/**
 * 年级选择器组件
 */
interface GradeSelectorProps {
  value: Grade;
  onSelect: (grade: Grade) => void;
  error?: string;
}

const GradeSelector: React.FC<GradeSelectorProps> = ({value, onSelect, error}) => {
  const theme = useTheme();
  const grades = activeChildService.getAllGrades();

  return (
    <View style={styles.gradeSelectorContainer}>
      <Text style={[styles.label, {color: theme.colors.primary}]}>年级</Text>
      <View style={styles.gradeOptions}>
        {grades.map((grade) => {
          const displayName = activeChildService.getGradeDisplayName(grade);
          const isSelected = value === grade;

          return (
            <TouchableOpacity
              key={grade}
              style={[
                styles.gradeOption,
                isSelected ? {backgroundColor: theme.colors.primary} : {backgroundColor: '#f0f0f0'},
                error && !isSelected ? {borderColor: theme.colors.error} : {},
              ]}
              onPress={() => onSelect(grade)}
              testID={`grade-option-${grade}`}>
              <Text
                style={[
                  styles.gradeOptionText,
                  isSelected ? {color: '#fff'} : {color: '#333'},
                ]}>
                {displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={[styles.errorText, {color: theme.colors.error}]}>{error}</Text>}
    </View>
  );
};

/**
 * 生日选择器组件
 */
interface BirthdayPickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  error?: string;
}

const BirthdayPicker: React.FC<BirthdayPickerProps> = ({value, onChange, error}) => {
  const theme = useTheme();

  // 简化实现：使用日期输入（实际项目中应使用日期选择器）
  const formatDate = (date?: Date): string => {
    if (!date) return '未设置';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleDatePress = () => {
    if (value) {
      // 如果已有生日，提示是否清除或修改
      Alert.alert(
        '修改生日',
        `当前生日：${formatDate(value)}\n\n您想：`,
        [
          {text: '取消', style: 'cancel'},
          {
            text: '清除生日',
            style: 'destructive',
            onPress: () => onChange(undefined),
          },
          {
            text: '选择新日期',
            onPress: () => {
              // 显示日期输入提示
              Alert.alert(
                '输入新生日',
                '请按 YYYY-MM-DD 格式输入生日日期（例如：2016-05-15）',
                [
                  {text: '取消', style: 'cancel'},
                  {
                    text: '确定',
                    onPress: () => {
                      // 简化实现：使用当前日期作为示例
                      // 生产环境应使用 @react-native-community/datetimepicker
                      onChange(new Date());
                    },
                  },
                ]
              );
            },
          },
        ]
      );
    } else {
      // 如果没有生日，提示设置生日
      Alert.alert(
        '设置生日',
        '请按 YYYY-MM-DD 格式输入生日日期（例如：2016-05-15）',
        [
          {text: '取消', style: 'cancel'},
          {
            text: '确定',
            onPress: () => {
              // 简化实现：使用当前日期作为示例
              // 生产环境应使用 @react-native-community/datetimepicker
              onChange(new Date());
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.formItemContainer}>
      <Text style={[styles.label, {color: theme.colors.primary}]}>生日（可选）</Text>
      <TouchableOpacity
        style={[
          styles.birthdayPicker,
          error ? {borderColor: theme.colors.error} : {borderColor: '#ddd'},
        ]}
        onPress={handleDatePress}
        testID="birthday-picker">
        <Text style={value ? styles.birthdayText : styles.birthdayPlaceholder}>
          {formatDate(value)}
        </Text>
        <Icon name="calendar-today" size={24} color="#666" />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, {color: theme.colors.error}]}>{error}</Text>}
      {!error && (
        <Text style={styles.hintText}>设置孩子的生日，帮助我们提供更合适的内容</Text>
      )}
    </View>
  );
};

/**
 * Child Form Screen Props
 */
interface ChildFormScreenProps {
  route: {
    params?: {
      mode: 'add' | 'edit';
      child?: Child;
      onRefresh?: () => void;
    };
  };
}

/**
 * 孩子表单屏幕
 */
const ChildFormScreen = ({route}: ChildFormScreenProps) => {
  // 提供默认值以防止 params 为 undefined
  const params = route.params || {mode: 'add'};
  const theme = useTheme();
  const navigation = useNavigation();

  const {mode, child: existingChild, onRefresh} = params;
  const isEditMode = mode === 'edit';

  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>(Grade.GRADE_1);
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    grade?: string;
    birthday?: string;
  }>({});

  // 初始化表单数据
  useEffect(() => {
    if (isEditMode && existingChild) {
      setName(existingChild.name);
      setGrade(existingChild.grade);
      setBirthday(existingChild.birthday);
    }
  }, [isEditMode, existingChild]);

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 验证姓名
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      newErrors.name = '孩子姓名至少需要2个字符';
    } else if (trimmedName.length > 50) {
      newErrors.name = '孩子姓名不能超过50个字符';
    }

    // 验证生日
    if (birthday) {
      const now = new Date();
      if (birthday > now) {
        newErrors.birthday = '生日不能是未来日期';
      } else {
        const ageInMs = now.getTime() - birthday.getTime();
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        if (ageInYears < 5) {
          newErrors.birthday = '孩子年龄应至少5岁';
        } else if (ageInYears > 12) {
          newErrors.birthday = '孩子年龄应不超过12岁';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 保存孩子信息
   */
  const handleSave = async () => {
    // 清除之前的错误
    setErrors({});

    // 验证表单
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && existingChild) {
        // 更新孩子
        const updates: ChildUpdateRequest = {
          name: name.trim(),
          grade,
          birthday,
        };

        const response = await childApi.updateChild(existingChild.id, updates);

        if (response.success) {
          Alert.alert('成功', '孩子信息已更新', [
            {
              text: '确定',
              onPress: () => {
                onRefresh?.();
                navigation.goBack();
              },
            },
          ]);
        } else {
          Alert.alert('更新失败', response.error?.message || '请稍后重试');
        }
      } else {
        // 添加新孩子
        const newChild: ChildCreateRequest = {
          name: name.trim(),
          grade,
          birthday,
        };

        const response = await childApi.addChild(newChild);

        if (response.success) {
          Alert.alert('成功', '孩子已添加', [
            {
              text: '确定',
              onPress: () => {
                onRefresh?.();
                navigation.goBack();
              },
            },
          ]);
        } else {
          Alert.alert('添加失败', response.error?.message || '请稍后重试');
        }
      }
    } catch (error) {
      console.error('[ChildFormScreen] Failed to save child:', error);
      Alert.alert('保存失败', '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 取消编辑
   */
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
        <Text style={styles.headerTitle}>{isEditMode ? '编辑孩子' : '添加孩子'}</Text>
        <Text style={styles.headerSubtitle}>
          {isEditMode ? '更新孩子的信息' : '填写孩子的基本信息'}
        </Text>
      </View>

      {/* 表单内容 */}
      <View style={styles.formContent}>
        {/* 姓名输入 */}
        <FormInput
          label="孩子姓名"
          value={name}
          onChangeText={(text) => {
            setName(text);
            // 清除错误
            if (errors.name) {
              setErrors({...errors, name: undefined});
            }
          }}
          placeholder="请输入孩子的姓名"
          error={errors.name}
          maxLength={50}
          testID="child-name-input"
        />

        {/* 年级选择 */}
        <GradeSelector
          value={grade}
          onSelect={(selectedGrade) => {
            setGrade(selectedGrade);
            // 清除错误
            if (errors.grade) {
              setErrors({...errors, grade: undefined});
            }
          }}
          error={errors.grade}
        />

        {/* 生日选择 */}
        <BirthdayPicker
          value={birthday}
          onChange={(date) => {
            setBirthday(date);
            // 清除错误
            if (errors.birthday) {
              setErrors({...errors, birthday: undefined});
            }
          }}
          error={errors.birthday}
        />
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={loading}>
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            {backgroundColor: theme.colors.primary},
          ]}
          onPress={handleSave}
          disabled={loading}
          testID="save-child-button">
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  formContent: {
    padding: 16,
  },
  formItemContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  gradeSelectorContainer: {
    marginBottom: 16,
  },
  gradeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gradeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  gradeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  birthdayPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  birthdayText: {
    fontSize: 16,
    color: '#333',
  },
  birthdayPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ChildFormScreen;
