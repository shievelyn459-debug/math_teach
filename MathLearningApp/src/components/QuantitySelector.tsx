import React from 'react';
import {View, Modal, StyleSheet, TouchableOpacity} from 'react-native';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer, Button, Icon} from '../components/ui';

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
          <Typography variant="headlineMedium" align="center">
            选择题目数量
          </Typography>
          <Spacer size="sm" />
          <Typography
            variant="body"
            color={designSystem.colors.text.secondary}
            align="center">
            选择要生成的题目数量
          </Typography>

          <Spacer size="lg" />

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
                onPress={() => onSelect(option.value)}
                activeOpacity={0.7}>
                {option.recommended && !isSelected && (
                  <View style={styles.recommendationTag}>
                    <Typography variant="overline" color={designSystem.colors.surface.primary}>
                      推荐
                    </Typography>
                  </View>
                )}
                <View style={styles.quantityHeader}>
                  <Typography
                    variant="headlineSmall"
                    color={isSelected ? designSystem.colors.surface.primary : designSystem.colors.text.primary}>
                    {option.label}
                  </Typography>
                  {isSelected && (
                    <Icon name="check" size="md" color={designSystem.colors.surface.primary} />
                  )}
                </View>
                <Typography
                  variant="body"
                  color={isSelected ? designSystem.colors.surface.primary : designSystem.colors.text.secondary}>
                  {option.description}
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
            style={{width: '100%'}}
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
    padding: designSystem.spacing.xl,
    width: '90%',
    maxWidth: 420,
    ...designSystem.shadows.lg,
  },
  quantityOption: {
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.surface.secondary,
    borderRadius: designSystem.borderRadius.md,
    marginVertical: designSystem.spacing.xs,
    borderWidth: 2,
    borderColor: designSystem.colors.border,
    position: 'relative',
  },
  quantityOptionSelected: {
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
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.xs,
  },
});

export default QuantitySelector;
