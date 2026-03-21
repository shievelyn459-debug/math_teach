import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {KnowledgePointMatchResult} from '../types/knowledgePoint';

interface KnowledgePointTagProps {
  matchResult: KnowledgePointMatchResult;
  onPress: (matchResult: KnowledgePointMatchResult) => void;
  compact?: boolean; // 紧凑模式，仅显示名称
  style?: ViewStyle;
}

/**
 * 知识点标签组件
 * 显示知识点名称和置信度，支持点击导航到详细讲解 (AC: 1, 4, 6)
 */
const KnowledgePointTag: React.FC<KnowledgePointTagProps> = ({
  matchResult,
  onPress,
  compact = false,
  style,
}) => {
  const {knowledgePoint, confidence, matchedKeywords} = matchResult;

  // 根据置信度确定颜色 (AC: 4 - 颜色编码显示置信度)
  const getConfidenceColor = (): {
    backgroundColor: string;
    textColor: string;
  } => {
    if (confidence >= 0.8) {
      // 高置信度 - 绿色
      return {
        backgroundColor: '#e8f5e9',
        textColor: '#2e7d32',
      };
    } else if (confidence >= 0.5) {
      // 中等置信度 - 蓝色
      return {
        backgroundColor: '#e3f2fd',
        textColor: '#1976d2',
      };
    } else {
      // 低置信度 - 橙色
      return {
        backgroundColor: '#fff3e0',
        textColor: '#ef6c00',
      };
    }
  };

  const colors = getConfidenceColor();
  const confidencePercent = Math.round(confidence * 100);

  return (
    <TouchableOpacity
      testID="knowledge-point-tag"
      style={[
        styles.tagContainer,
        {backgroundColor: colors.backgroundColor},
        style,
      ]}
      onPress={() => onPress(matchResult)}
      activeOpacity={0.7}>
      <View style={styles.tagContent}>
        <Text
          style={[styles.knowledgePointName, {color: colors.textColor}]}
          numberOfLines={1}>
          {knowledgePoint.name}
        </Text>

        {!compact && (
          <>
            <View style={styles.separator} />
            <Text style={[styles.confidenceText, {color: colors.textColor}]}>
              {confidencePercent}%
            </Text>
          </>
        )}
      </View>

      {/* 置信度指示条 - 视觉反馈 */}
      {!compact && (
        <View
          style={[
            styles.confidenceBar,
            {width: `${confidencePercent}%`, backgroundColor: colors.textColor},
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tagContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  knowledgePointName: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  separator: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginHorizontal: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'center',
  },
  confidenceBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    opacity: 0.3,
  },
});

export default KnowledgePointTag;
