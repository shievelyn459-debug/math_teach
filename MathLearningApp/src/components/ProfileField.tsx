/**
 * Story 1-4: 个人资料字段显示组件
 * 可复用的资料显示字段组件
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from 'react-native-paper';
import {designSystem} from '../styles/designSystem';
import {Typography} from '../components/ui';

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
      <Typography
        variant="overline"
        color={theme.colors.primary}
        style={styles.label}>
        {label}
      </Typography>
      <Typography
        variant="body"
        color={value ? designSystem.colors.text.primary : designSystem.colors.text.hint}>
        {value || '未设置'}
      </Typography>
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
      <Typography
        variant="overline"
        color={theme.colors.primary}
        style={styles.label}>
        {label}
      </Typography>
      <View style={styles.valueRow}>
        <Typography
          variant="body"
          color={value ? designSystem.colors.text.primary : designSystem.colors.text.hint}
          style={styles.valueText}>
          {value || '点击设置'}
        </Typography>
        {onPress && (
          <Typography variant="caption" color={theme.colors.primary}>
            编辑
          </Typography>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    backgroundColor: designSystem.colors.surface.primary,
    padding: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.lg,
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  editableFieldContainer: {
    backgroundColor: designSystem.colors.surface.primary,
    padding: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.lg,
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  label: {
    marginBottom: designSystem.spacing.sm,
  },
  valueText: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
