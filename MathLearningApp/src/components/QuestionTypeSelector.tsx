import React from 'react';
import {View, Text, TouchableOpacity, Modal, StyleSheet} from 'react-native';
import {QuestionType} from '../types';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer, Button} from '../components/ui';

interface QuestionTypeSelectorProps {
  visible: boolean;
  currentType: QuestionType | null;
  onSelect: (type: QuestionType) => void;
  onCancel: () => void;
}

const QUESTION_TYPES = [
  {type: QuestionType.ADDITION, label: '加法', description: '加法运算练习'},
  {type: QuestionType.SUBTRACTION, label: '减法', description: '减法运算练习'},
  { type: QuestionType.WORD_PROBLEM, label: '应用题', description: '文字描述的数学问题'},
];

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  visible,
  currentType,
  onSelect,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}>
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Typography variant="headlineMedium" align="center" style={styles.modalTitle}>
            手动选择题目类型
          </Typography>
          <Spacer size="sm" />
          <Typography variant="body" color={designSystem.colors.text.secondary} align="center" style={styles.modalSubtitle}>
            请选择正确的题目类型，帮助我们更好地为您服务
          </Typography>

          <Spacer size="lg" />

          {QUESTION_TYPES.map((typeObj) => (
            <TouchableOpacity
              key={typeObj.type}
              testID={`type-option-${typeObj.type}`}
              style={[
                styles.typeOption,
                currentType === typeObj.type && styles.typeOptionSelected,
              ]}
              onPress={() => onSelect(typeObj.type)}
              activeOpacity={0.7}>
              <Typography variant="headlineSmall" style={styles.typeLabel}>
                {typeObj.label}
              </Typography>
              <Spacer size="xs" />
              <Typography variant="body" color={designSystem.colors.text.secondary}>
                {typeObj.description}
              </Typography>
            </TouchableOpacity>
          ))}

          <Spacer size="lg" />

          <Button
            title="取消"
            onPress={onCancel}
            variant="secondary"
            size="lg"
            fullWidth
          />
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
    backgroundColor: designSystem.colors.overlay.medium,
  },
  modalContent: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.xxl,
    width: '85%',
    maxWidth: 400,
    ...designSystem.shadows.md,
  },
  modalTitle: {
    marginBottom: designSystem.spacing.sm,
  },
  modalSubtitle: {
    textAlign: 'center',
  },
  typeOption: {
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.surface.secondary,
    borderRadius: designSystem.borderRadius.md,
    marginVertical: designSystem.spacing.sm,
    borderWidth: 1,
    borderColor: designSystem.colors.border,
  },
  typeOptionSelected: {
    backgroundColor: designSystem.colors.primary,
    borderColor: designSystem.colors.primaryDark,
  },
  typeLabel: {
    marginBottom: designSystem.spacing.xs,
  },
});

export default QuestionTypeSelector;
