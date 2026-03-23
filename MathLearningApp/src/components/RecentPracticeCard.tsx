/**
 * Story 5-1: 最近练习卡片组件
 * 显示最近的生成记录，支持点击查看详情
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Card, Text, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {GenerationRecord, QuestionType, Difficulty} from '../types';
import {formatTimeAgo} from '../utils/timeUtils';

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
   * 获取难度颜色
   */
  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case Difficulty.EASY:
        return '#4caf50'; // 绿色
      case Difficulty.MEDIUM:
        return '#ff9800'; // 橙色
      case Difficulty.HARD:
        return '#f44336'; // 红色
      default:
        return '#9e9e9e'; // 灰色
    }
  };

  /**
   * 获取难度名称
   */
  const getDifficultyName = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case Difficulty.EASY:
        return '简单';
      case Difficulty.MEDIUM:
        return '中等';
      case Difficulty.HARD:
        return '困难';
      default:
        return '未知';
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
              size={24}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <View style={styles.typeInfo}>
              <Text style={styles.typeText}>{getQuestionTypeName(record.questionType)}</Text>
              <Text style={styles.countText}>{record.count}道题</Text>
            </View>
          </View>

          {/* 中间时间和难度 */}
          <View style={styles.middleSection}>
            <Text style={styles.timeText}>{formatTimeAgo(record.timestamp)}</Text>
            <View style={[styles.difficultyBadge, {backgroundColor: getDifficultyColor(record.difficulty) + '20'}]}>
              <Text style={[styles.difficultyText, {color: getDifficultyColor(record.difficulty)}]}>
                {getDifficultyName(record.difficulty)}
              </Text>
            </View>
          </View>

          {/* 右侧箭头 */}
          <Icon name="chevron-right" size={24} color="#9e9e9e" />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  countText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  middleSection: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default RecentPracticeCard;
