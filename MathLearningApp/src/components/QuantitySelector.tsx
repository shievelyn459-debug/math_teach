import React from 'react';
import {View, Text, TouchableOpacity, Modal, StyleSheet} from 'react-native';

interface QuantitySelectorProps {
  visible: boolean;
  selected: number;
  onSelect: (quantity: number) => void;
  onCancel: () => void;
}

const QUANTITY_OPTIONS = [
  {
    value: 5,
    label: '5题',
    description: '快速练习，适合短时间学习',
  },
  {
    value: 10,
    label: '10题',
    description: '标准练习，均衡的学习量',
    recommended: true,
  },
  {
    value: 15,
    label: '15题',
    description: '强化练习，巩固知识点',
  },
];

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  visible,
  selected,
  onSelect,
  onCancel,
}) => {
  // Prop 验证
  if (process.env.NODE_ENV === 'development') {
    if (![5, 10, 15].includes(selected)) {
      console.warn(`QuantitySelector: Invalid selected value ${selected}, expected 5, 10, or 15`);
    }
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>选择题目数量</Text>
          <Text style={styles.modalSubtitle}>
            选择要生成的题目数量
          </Text>

          {QUANTITY_OPTIONS.map((option) => {
            const isSelected = option.value === selected;

            return (
              <TouchableOpacity
                key={option.value}
                testID={`quantity-option-${option.value}`}
                style={[
                  styles.quantityOption,
                  isSelected && styles.quantityOptionSelected,
                ]}
                onPress={() => onSelect(option.value)}>
                {option.recommended && !isSelected && (
                  <View style={styles.recommendationTag}>
                    <Text style={styles.recommendationTagText}>推荐</Text>
                  </View>
                )}
                <View style={styles.quantityHeader}>
                  <Text
                    style={[
                      styles.quantityLabel,
                      isSelected && styles.quantityLabelSelected,
                    ]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Text style={styles.selectedCheck}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.quantityDescription,
                    isSelected && styles.quantityDescriptionSelected,
                  ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}>
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
  quantityOption: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  quantityOptionSelected: {
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
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quantityLabelSelected: {
    color: 'white',
  },
  selectedCheck: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  quantityDescription: {
    fontSize: 14,
    color: '#666',
  },
  quantityDescriptionSelected: {
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

export default QuantitySelector;
