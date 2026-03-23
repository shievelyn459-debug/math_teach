/**
 * Story 1-4: 个人资料字段显示组件
 * 可复用的资料显示字段组件
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from 'react-native-paper';

export interface ProfileFieldProps {
  label: string;
  value: string | undefined;
  iconName?: string;
  testID?: string;
}

/**
 * 个人资料字段组件
 * 用于显示用户资料的单个字段（标签 + 值）
 */
export const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  iconName,
  testID,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.fieldContainer} testID={testID}>
      <Text style={[styles.label, {color: theme.colors.primary}]}>{label}</Text>
      <Text style={[styles.value, {color: value ? '#333' : '#999'}]}>
        {value || '未设置'}
      </Text>
    </View>
  );
};

/**
 * 编辑模式资料字段组件
 * 带编辑提示的样式
 */
export interface EditableProfileFieldProps extends ProfileFieldProps {
  onPress?: () => void;
}

export const EditableProfileField: React.FC<EditableProfileFieldProps> = ({
  label,
  value,
  onPress,
  testID,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.editableFieldContainer} testID={testID}>
      <Text style={[styles.label, {color: theme.colors.primary}]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, {flex: 1, color: value ? '#333' : '#999'}]}>
          {value || '点击设置'}
        </Text>
        {onPress && (
          <Text style={[styles.editText, {color: theme.colors.primary}]}>编辑</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editableFieldContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
