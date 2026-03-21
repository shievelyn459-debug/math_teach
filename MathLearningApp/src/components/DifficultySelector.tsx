import React from 'react';
import {View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator} from 'react-native';
import {Difficulty} from '../types';

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
          <Text style={styles.modalTitle}>选择题目难度</Text>
          <Text style={styles.modalSubtitle}>
            根据孩子的学习情况选择合适的难度级别
          </Text>

          {recommendedDifficulty && (
            <View style={styles.recommendationBadge}>
              <Text style={styles.recommendationText}>
                推荐：{getDifficultyLabel(recommendedDifficulty)}
              </Text>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196f3" />
              <Text style={styles.loadingText}>加载偏好设置中...</Text>
            </View>
          ) : (
            DIFFICULTY_LEVELS.map((levelObj) => {
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
                  onPress={() => onSelect(levelObj.level)}
                  disabled={isLoading}>
                  {isRecommended && !isSelected && (
                    <View style={styles.recommendationTag}>
                      <Text style={styles.recommendationTagText}>推荐</Text>
                    </View>
                  )}
                  <View style={styles.difficultyHeader}>
                    <Text
                      style={[
                        styles.difficultyLabel,
                        isSelected && styles.difficultyLabelSelected,
                      ]}>
                      {levelObj.label}
                    </Text>
                    {isSelected && (
                      <Text style={styles.selectedCheck}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.difficultyDescription,
                      isSelected && styles.difficultyDescriptionSelected,
                    ]}>
                    {levelObj.description}
                  </Text>
                  <Text
                    style={[
                      styles.difficultyDetail,
                      isSelected && styles.difficultyDetailSelected,
                    ]}>
                    {levelObj.detail}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  recommendationBadge: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  difficultyOption: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  difficultyOptionSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#1976d2',
  },
  recommendationTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendationTagText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  difficultyLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  difficultyLabelSelected: {
    color: 'white',
  },
  selectedCheck: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  difficultyDescription: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
    fontWeight: '500',
  },
  difficultyDescriptionSelected: {
    color: 'white',
  },
  difficultyDetail: {
    fontSize: 13,
    color: '#777',
    lineHeight: 18,
  },
  difficultyDetailSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cancelButton: {
    padding: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default DifficultySelector;
