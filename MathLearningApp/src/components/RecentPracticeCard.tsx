/**
 * Story 5-1: 最近练习卡片组件
 * 显示最近的生成记录，支持点击查看详情
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Card, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {GenerationRecord, QuestionType, Difficulty} from '../types';
import {formatTimeAgo} from '../utils/timeUtils';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer} from '../components/ui';

interface RecentPracticeCardProps {
  record: GenerationRecord;
}

/**
 * 最近练习卡片组件
 */
const RecentPracticeCard: React.FC<RecentPracticeCardProps> = ({record}) => {
  const navigation = useNavigation();
  const theme = useTheme();

  /**
   * 获取题目类型图标
   */
  const getQuestionTypeIcon = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.ADDITION:
        return 'add';
      case QuestionType.SUBTRACTION:
        return 'remove';
      case QuestionType.WORD_PROBLEM:
        return 'description';
      default:
        return 'help';
    }
  };

  /**
   * 获取题目类型名称
   */
  const getQuestionTypeName = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.ADDITION:
        return '加法';
      case QuestionType.SUBTRACTION:
        return '减法';
      case QuestionType.WORD_PROBLEM:
        return '应用题';
      default:
        return '未知';
    }
  };

  /**
   * 获取难度配置
   */
  const getDifficultyConfig = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.EASY:
        return {
          name: '简单',
          color: designSystem.colors.success.default,
          backgroundColor: designSystem.colors.success.light,
        };
      case Difficulty.MEDIUM:
        return {
          name: '中等',
          color: designSystem.colors.warning.default,
          backgroundColor: designSystem.colors.warning.light,
        };
      case Difficulty.HARD:
        return {
          name: '困难',
          color: designSystem.colors.error.default,
          backgroundColor: designSystem.colors.error.light,
        };
      default:
        return {
          name: '未知',
          color: designSystem.colors.text.hint,
          backgroundColor: designSystem.colors.surface.secondary,
        };
    }
  };

  /**
   * 处理卡片点击
   */
  const handlePress = () => {
    (navigation as any).navigate('GeneratedQuestionsList', {
      generationId: record.id,
      questions: record.questions,
    });
  };

  const difficultyConfig = getDifficultyConfig(record.difficulty);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`查看${getQuestionTypeName(record.questionType)}练习`}
      accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          {/* 左侧图标和类型 */}
          <View style={styles.leftSection}>
            <Icon
              name={getQuestionTypeIcon(record.questionType)}
              size="lg"
              color={theme.colors.primary}
            />
            <Spacer size="md" horizontal />
            <View style={styles.typeInfo}>
              <Typography variant="body" style={styles.typeText}>
                {getQuestionTypeName(record.questionType)}
              </Typography>
              <Typography variant="overline" color={designSystem.colors.text.secondary}>
                {record.count}道题
              </Typography>
            </View>
          </View>

          {/* 中间时间和难度 */}
          <View style={styles.middleSection}>
            <Typography variant="overline" color={designSystem.colors.text.secondary}>
              {formatTimeAgo(record.timestamp)}
            </Typography>
            <Spacer size="xs" />
            <View
              style={[
                styles.difficultyBadge,
                {backgroundColor: difficultyConfig.backgroundColor},
              ]}>
              <Typography
                variant="overline"
                color={difficultyConfig.color}
                style={styles.difficultyText}>
                {difficultyConfig.name}
              </Typography>
            </View>
          </View>

          {/* 右侧箭头 */}
          <Spacer size="sm" horizontal />
          <Icon name="chevron-right" size="lg" color={designSystem.colors.text.hint} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: designSystem.spacing.lg,
    marginVertical: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.lg,
    ...designSystem.shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.lg,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeInfo: {
    flex: 1,
  },
  typeText: {
    fontWeight: '600',
  },
  middleSection: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.xs / 2,
    borderRadius: designSystem.borderRadius.lg,
  },
  difficultyText: {
    fontWeight: '600',
  },
});

export default RecentPracticeCard;
