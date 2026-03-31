/**
 * Story 5-4: Calming Empty State Component
 * 使用友好的空状态组件引导用户
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer, Button} from '../components/ui';

interface CalmingEmptyStateProps {
  /** 图标名称 (来自 MaterialIcons) */
  icon?: string;
  /** 自定义插图图片 */
  illustration?: React.ReactNode;
  /** 标题 */
  title: string;
  /** 描述性消息 */
  message: string;
  /** 行动按钮文本 */
  actionLabel?: string;
  /** 行动按钮回调 */
  onAction?: () => void;
  /** 次要行动按钮文本 */
  secondaryActionLabel?: string;
  /** 次要行动按钮回调 */
  onSecondaryAction?: () => void;
  /** 是否显示帮助提示 */
  showHelpTip?: boolean;
  /** 自定义样式 */
  style?: any;
}

/**
 * 令人平静的空状态组件
 * 使用友好的插图和鼓励性的消息
 */
const CalmingEmptyState: React.FC<CalmingEmptyStateProps> = ({
  icon,
  illustration,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  showHelpTip = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 插图或图标 */}
      {illustration || (
        <View style={styles.iconContainer}>
          {icon && <Icon name={icon} size="xl" color={designSystem.colors.primary} />}
        </View>
      )}

      {/* 标题 */}
      <Typography variant="headlineMedium" align="center" style={styles.title}>
        {title}
      </Typography>

      {/* 描述消息 */}
      <Typography
        variant="body"
        color={designSystem.colors.text.secondary}
        align="center"
        style={styles.message}>
        {message}
      </Typography>

      {/* 行动按钮 */}
      <View style={styles.actionsContainer}>
        {actionLabel && onAction && (
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="lg"
            style={{width: '100%'}}
          />
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <>
            <Spacer size="sm" />
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="secondary"
              size="md"
              style={{width: '100%'}}
            />
          </>
        )}
      </View>

      {/* 帮助提示 */}
      {showHelpTip && (
        <View style={styles.helpTip}>
          <Icon name="help-outline" size="sm" color={designSystem.colors.text.hint} />
          <View style={{width: designSystem.spacing.sm}} />
          <Typography variant="caption" color={designSystem.colors.text.hint}>
            需要帮助？点击右上角的问号
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.spacing.xxl,
    backgroundColor: designSystem.colors.surface.secondary,
  },

  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: designSystem.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.xl,
  },

  title: {
    marginBottom: designSystem.spacing.md,
  },

  message: {
    paddingHorizontal: designSystem.spacing.md,
    marginBottom: designSystem.spacing.xxl,
  },

  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    maxWidth: 280,
  },

  helpTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designSystem.spacing.xxl,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.surface.tertiary,
    borderRadius: designSystem.borderRadius.md,
  },
});

export default CalmingEmptyState;
