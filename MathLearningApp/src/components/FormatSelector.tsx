/**
 * 格式选择器组件
 * Story 3-4: multiple-explanation-formats
 * Story 3-5: switch-explanation-formats
 * 用于切换讲解内容的显示格式（文字/动画/视频）
 * 增强视觉反馈和可访问性
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {ExplanationFormat} from '../types/explanation';
import {AccessibilityInfo} from 'react-native';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon} from '../components/ui';

interface FormatSelectorProps {
  availableFormats: ExplanationFormat[];  // 可用的格式列表
  selectedFormat: ExplanationFormat;      // 当前选中的格式
  onFormatChange: (format: ExplanationFormat) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * 格式配置
 */
const FORMAT_CONFIG = {
  [ExplanationFormat.TEXT]: {
    icon: 'article' as const,
    label: '文字',
    accessibilityLabel: '文字讲解',
    description: '详细文字说明',
  },
  [ExplanationFormat.ANIMATION]: {
    icon: 'auto-fix-high' as const,
    label: '动画',
    accessibilityLabel: '动画演示',
    description: '即将推出',
  },
  [ExplanationFormat.VIDEO]: {
    icon: 'play-circle-outline' as const,
    label: '视频',
    accessibilityLabel: '视频讲解',
    description: '即将推出',
  },
};

/**
 * 格式选择器组件
 * 显示为水平排列的图标按钮，用于切换讲解格式
 */
export const FormatSelector: React.FC<FormatSelectorProps> = ({
  availableFormats,
  selectedFormat,
  onFormatChange,
  disabled = false,
  style,
}) => {
  // Story 3-5: 增强的格式切换处理（触觉反馈、可访问性）
  const handleFormatPress = (format: ExplanationFormat) => {
    if (!disabled && availableFormats.includes(format)) {
      // Story 3-5: 触觉反馈（平台相关）
      triggerHapticFeedback();

      // Story 3-5: 可访问性公告
      announceFormatChange(format);

      onFormatChange(format);
    }
  };

  // Story 3-5: 触觉反馈
  const triggerHapticFeedback = () => {
    // 注意: 完整实现需要Expo.haptics或react-native-haptic-feedback
    // 这里是模拟实现
    console.log('[FormatSelector] Haptic feedback triggered');
  };

  // Story 3-5: 可访问性公告
  const announceFormatChange = (format: ExplanationFormat) => {
    const formatNames = {
      [ExplanationFormat.TEXT]: '文字',
      [ExplanationFormat.ANIMATION]: '动画',
      [ExplanationFormat.VIDEO]: '视频',
    };
    const formatName = formatNames[format] || format;
    AccessibilityInfo.announceForAccessibility(`已选择${formatName}格式`);
  };

  return (
    <View style={[styles.container, style]} accessible={true} accessibilityRole="tablist">
      {(Object.keys(ExplanationFormat) as Array<keyof typeof ExplanationFormat>).map((formatKey) => {
        const format = ExplanationFormat[formatKey];
        const config = FORMAT_CONFIG[format];
        const isAvailable = availableFormats.includes(format);
        const isSelected = selectedFormat === format;

        return (
          <TouchableOpacity
            key={format}
            testID={`format-button-${format}`}
            style={[
              styles.formatButton,
              isSelected && styles.selectedButton,
              !isAvailable && styles.disabledButton,
              disabled && styles.disabledButton,
            ]}
            onPress={() => handleFormatPress(format)}
            disabled={disabled || !isAvailable}
            accessible={true}
            accessibilityLabel={config.accessibilityLabel}
            accessibilityRole="tab"
            accessibilityState={{selected: isSelected, disabled: !isAvailable || disabled}}
            accessibilityHint={isAvailable ? config.description : `${config.label}${config.description}`}>
            <Icon
              name={config.icon}
              size="sm"
              color={isSelected ? designSystem.colors.surface.primary : isAvailable ? designSystem.colors.text.primary : designSystem.colors.text.disabled}
            />
            <Typography
              variant="body"
              style={[
                styles.formatLabel,
                isSelected && styles.selectedLabel,
                !isAvailable && styles.disabledText,
              ]}>
              {config.label}
            </Typography>
            {/* Story 3-5: 选中指示器 */}
            {isSelected && (
              <Icon name="check" size="sm" color={designSystem.colors.surface.primary} />
            )}
            {!isAvailable && (
              <View style={styles.comingSoonBadge}>
                <Typography variant="overline" color={designSystem.colors.surface.primary}>
                  即将
                </Typography>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.surface.secondary,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.xs,
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.sm,
    marginHorizontal: designSystem.spacing.xs / 2,
    minHeight: 40,
    position: 'relative',
    gap: designSystem.spacing.xs,
  },
  selectedButton: {
    backgroundColor: designSystem.colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  formatLabel: {
    fontWeight: '500',
  },
  selectedLabel: {
    color: designSystem.colors.surface.primary,
  },
  disabledText: {
    color: designSystem.colors.text.disabled,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: designSystem.colors.warning.default,
    borderRadius: designSystem.borderRadius.lg,
    paddingHorizontal: designSystem.spacing.xs,
    paddingVertical: 2,
  },
});

export default FormatSelector;
