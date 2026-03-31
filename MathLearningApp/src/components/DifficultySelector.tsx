import React from 'react';
import {View, Modal, StyleSheet, ActivityIndicator} from 'react-native';
import {Difficulty} from '../types';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer, Button, Icon} from '../components/ui';

interface DifficultySelectorProps {
  visible: boolean;
  currentDifficulty?: Difficulty;
  recommendedDifficulty?: Difficulty;
  isLoading?: boolean;
  onSelect: (difficulty: Difficulty) => void;
  onCancel: () => void;
}

const DIFFICULTY_LEVELS = [
  {
    level: Difficulty.EASY,
    label: '简单',
    description: '适合初学者，题目基础易懂',
    detail: '孩子可以轻松完成，建立自信心',
  },
  {
    level: Difficulty.MEDIUM,
    label: '中等',
    description: '适度挑战，巩固基础知识',
    detail: '需要孩子思考，但不会太困难',
  },
  {
    level: Difficulty.HARD,
    label: '困难',
    description: '进阶训练，提升解题能力',
    detail: '适合基础扎实的孩子，挑战极限',
  },
];

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  visible,
  currentDifficulty,
  recommendedDifficulty,
  isLoading = false,
  onSelect,
  onCancel,
}) => {
  if (!visible) return null;

  const getDifficultyLabel = (level: Difficulty): string => {
    const levelObj = DIFFICULTY_LEVELS.find(d => d.level === level);
    return levelObj ? levelObj.label : level;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Typography variant="headlineMedium" align="center">
            选择题目难度
          </Typography>
          <Spacer size="sm" />
          <Typography
            variant="body"
            color={designSystem.colors.text.secondary}
            align="center">
            根据孩子的学习情况选择合适的难度级别
          </Typography>

          {recommendedDifficulty && (
            <>
              <Spacer size="md" />
              <View style={styles.recommendationBadge}>
                <Icon name="recommend" size="sm" color={designSystem.colors.info.dark} />
                <View style={{width: designSystem.spacing.xs}} />
                <Typography variant="body" color={designSystem.colors.info.dark}>
                  推荐：{getDifficultyLabel(recommendedDifficulty)}
                </Typography>
              </View>
            </>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={designSystem.colors.primary} />
              <Spacer size="md" />
              <Typography variant="body" color={designSystem.colors.text.secondary}>
                加载偏好设置中...
              </Typography>
            </View>
          )}

          <Spacer size="md" />

          {DIFFICULTY_LEVELS.map((levelObj) => {
            const isRecommended = levelObj.level === recommendedDifficulty;
            const isSelected = levelObj.level === currentDifficulty;

            return (
              <TouchableOpacity
                key={levelObj.level}
                testID={`difficulty-option-${levelObj.level}`}
                style={[
                  styles.difficultyOption,
                  isSelected && styles.difficultyOptionSelected,
                ]}
                onPress={() => !isLoading && onSelect(levelObj.level)}
                activeOpacity={0.7}>
                {isRecommended && !isSelected && (
                  <View style={styles.recommendationTag}>
                    <Typography variant="overline" color={designSystem.colors.surface.primary}>
                      推荐
                    </Typography>
                  </View>
                )}
                <View style={styles.difficultyHeader}>
                  <Typography
                    variant="headlineSmall"
                    color={isSelected ? designSystem.colors.surface.primary : designSystem.colors.text.primary}>
                    {levelObj.label}
                  </Typography>
                  {isSelected && (
                    <Icon name="check" size="md" color={designSystem.colors.surface.primary} />
                  )}
                </View>
                <Typography
                  variant="body"
                  color={isSelected ? designSystem.colors.surface.primary : designSystem.colors.text.secondary}>
                  {levelObj.description}
                </Typography>
                <Typography
                  variant="caption"
                  color={isSelected ? designSystem.colors.surface.primary : designSystem.colors.text.hint}>
                  {levelObj.detail}
                </Typography>
              </TouchableOpacity>
            );
          })}

          <Spacer size="lg" />

          <Button
            title="取消"
            onPress={onCancel}
            variant="secondary"
            size="lg"
            disabled={isLoading}
            style={{width: '100%'}}
          />
        </View>
      </View>
    </Modal>
  );
};

// Need to import TouchableOpacity
import {TouchableOpacity} from 'react-native';

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.overlay.medium,
  },
  modalContent: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.xl,
    width: '90%',
    maxWidth: 420,
    ...designSystem.shadows.lg,
  },
  recommendationBadge: {
    backgroundColor: designSystem.colors.info.light,
    borderColor: designSystem.colors.info.default,
    borderWidth: 1,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: designSystem.spacing.xl,
    alignItems: 'center',
  },
  difficultyOption: {
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.surface.secondary,
    borderRadius: designSystem.borderRadius.md,
    marginVertical: designSystem.spacing.xs,
    borderWidth: 2,
    borderColor: designSystem.colors.border,
    position: 'relative',
  },
  difficultyOptionSelected: {
    backgroundColor: designSystem.colors.primary,
    borderColor: designSystem.colors.primaryDark,
  },
  recommendationTag: {
    position: 'absolute',
    top: designSystem.spacing.xs,
    right: designSystem.spacing.xs,
    backgroundColor: designSystem.colors.success.default,
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: 2,
    borderRadius: designSystem.borderRadius.sm,
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.xs,
  },
});

export default DifficultySelector;
