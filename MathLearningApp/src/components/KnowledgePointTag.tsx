import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {KnowledgePointMatchResult} from '../types/knowledgePoint';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer} from '../components/ui';

interface KnowledgePointTagProps {
  matchResult: KnowledgePointMatchResult;
  onPress: (matchResult: KnowledgePointMatchResult) => void;
  compact?: boolean; // 紧凑模式，仅显示名称
  style?: ViewStyle;
  testID?: string; // 用于测试
}

/**
 * 根据置信度获取颜色配置
 */
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) {
    return {
      background: designSystem.colors.success.light,
      text: designSystem.colors.success.dark,
      bar: designSystem.colors.success.default,
    };
  }
  if (confidence >= 0.7) {
    return {
      background: designSystem.colors.info.light,
      text: designSystem.colors.info.dark,
      bar: designSystem.colors.info.default,
    };
  }
  return {
    background: designSystem.colors.warning.light,
    text: designSystem.colors.warning.dark,
    bar: designSystem.colors.warning.default,
  };
};

/**
 * 知识点标签组件
 * 显示知识点名称和置信度，支持点击导航到详细讲解 (AC: 1, 4, 6)
 */
const KnowledgePointTag: React.FC<KnowledgePointTagProps> = ({
  matchResult,
  onPress,
  compact = false,
  style,
  testID,
}) => {
  const {knowledgePoint, confidence} = matchResult;
  const colors = getConfidenceColor(confidence);

  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.container,
        {backgroundColor: colors.background},
        style,
      ]}
      onPress={() => onPress(matchResult)}
      activeOpacity={0.7}>
      {/* 置信度条 */}
      <View
        style={[
          styles.confidenceBar,
          {backgroundColor: colors.bar, width: `${confidence * 100}%`},
        ]}
      />

      <View style={styles.tagContent}>
        <Typography
          variant="body"
          color={colors.text}
          style={styles.knowledgePointName}
          numberOfLines={1}>
          {knowledgePoint.name}
        </Typography>

        {!compact && (
          <>
            <View style={[styles.separator, {backgroundColor: colors.text}]} />
            <Typography
              variant="overline"
              color={colors.text}
              style={styles.confidenceText}>
              {Math.round(confidence * 100)}%
            </Typography>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: designSystem.borderRadius.lg,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    overflow: 'hidden',
    ...designSystem.shadows.xs,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  knowledgePointName: {
    flexShrink: 1,
  },
  separator: {
    width: 1,
    height: 14,
    marginHorizontal: designSystem.spacing.sm,
    opacity: 0.3,
  },
  confidenceText: {
    minWidth: 35,
    textAlign: 'center',
  },
  confidenceBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderTopLeftRadius: designSystem.borderRadius.lg,
    borderTopRightRadius: designSystem.borderRadius.lg,
    opacity: 0.4,
  },
});

export default KnowledgePointTag;
