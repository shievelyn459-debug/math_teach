import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { QuestionType } from '../types';

interface QuestionTypeSelectorProps {
  visible: boolean;
  currentType?: QuestionType;
  onSelect: (type: QuestionType) => void;
  onCancel: () => void;
}

const QUESTION_TYPES = [
  { type: QuestionType.ADDITION, label: '加法', description: '数字相加的运算' },
  { type: QuestionType.SUBTRACTION, label: '减法', description: '数字相减的运算' },
  { type: QuestionType.WORD_PROBLEM, label: '应用题', description: '文字描述的数学问题' },
];

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  visible,
  currentType,
  onSelect,
  onCancel,
}) => {
  if (!visible) return null;

  const getTypeLabel = (type: QuestionType): string => {
    const typeObj = QUESTION_TYPES.find(t => t.type === type);
    return typeObj ? typeObj.label : type;
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
          <Text style={styles.modalTitle}>手动选择题目类型</Text>
          <Text style={styles.modalSubtitle}>
            请选择正确的题目类型，帮助我们更好地为您服务：
          </Text>

          {QUESTION_TYPES.map((typeObj) => (
            <TouchableOpacity
              key={typeObj.type}
              testID={`type-option-${typeObj.type}`}
              style={[
                styles.typeOption,
                currentType === typeObj.type && styles.typeOptionSelected,
              ]}
              onPress={() => onSelect(typeObj.type)}
            >
              <Text style={styles.typeLabel}>{typeObj.label}</Text>
              <Text style={styles.typeDescription}>{typeObj.description}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
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
    width: '85%',
    maxWidth: 400,
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
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  typeOption: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  typeOptionSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#1976d2',
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
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

export default QuestionTypeSelector;
