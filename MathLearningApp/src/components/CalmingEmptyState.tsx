/**
 * Story 5-4: Calming Empty State Component
 * 使用友好的空状态组件引导用户
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Text} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
          {icon && <Icon name={icon} size={64} color="#5C9EAD" />}
        </View>
      )}

      {/* 标题 */}
      <Text style={styles.title}>{title}</Text>

      {/* 描述消息 */}
      <Text style={styles.message}>{message}</Text>

      {/* 行动按钮 */}
      <View style={styles.actionsContainer}>
        {actionLabel && onAction && (
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={onAction}
            activeOpacity={0.7}>
            <Text style={styles.primaryActionText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={onSecondaryAction}
            activeOpacity={0.7}>
            <Text style={styles.secondaryActionText}>{secondaryActionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 帮助提示 */}
      {showHelpTip && (
        <View style={styles.helpTip}>
          <Icon name="help-outline" size={16} color="#8A9AAC" />
          <Text style={styles.helpTipText}>需要帮助？点击右上角的问号</Text>
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
    padding: 32,
    backgroundColor: '#F7F3E8',
  },

  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(92, 158, 173, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
  },

  message: {
    fontSize: 16,
    color: '#5A6C7D',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
    paddingHorizontal: 16,
  },

  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },

  primaryAction: {
    backgroundColor: '#5C9EAD',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#5C9EAD',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },

  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryAction: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#5C9EAD',
    minWidth: 180,
    alignItems: 'center',
  },

  secondaryActionText: {
    color: '#5C9EAD',
    fontSize: 15,
    fontWeight: '500',
  },

  helpTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(138, 154, 172, 0.1)',
    borderRadius: 12,
  },

  helpTipText: {
    fontSize: 13,
    color: '#8A9AAC',
    marginLeft: 6,
  },
});

export default CalmingEmptyState;
