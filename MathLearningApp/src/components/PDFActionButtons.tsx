import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {designSystem} from '../styles/designSystem';
import {Button, Icon, Spacer, Typography} from '../components/ui';

interface PDFActionButtonsProps {
  onShare?: () => void;
  onPrint?: () => void;
  onOpen?: () => void;
  onViewAll?: () => void;
  sharing?: boolean;
  printing?: boolean;
  opening?: boolean;
  showViewAll?: boolean;
}

const PDFActionButtons: React.FC<PDFActionButtonsProps> = ({
  onShare,
  onPrint,
  onOpen,
  onViewAll,
  sharing = false,
  printing = false,
  opening = false,
  showViewAll = false,
}) => {
  const isDisabled = sharing || printing || opening;

  return (
    <View style={styles.container}>
      <View style={styles.primaryActions}>
        {onShare && (
          <Button
            title="分享"
            onPress={onShare}
            variant="primary"
            size="md"
            loading={sharing}
            disabled={isDisabled}
            leftIcon="share"
            style={styles.shareButton}
          />
        )}
        {onPrint && (
          <Button
            title="打印"
            onPress={onPrint}
            variant="primary"
            size="md"
            loading={printing}
            disabled={isDisabled}
            leftIcon="print"
            style={styles.printButton}
          />
        )}
        {onOpen && (
          <Button
            title="打开"
            onPress={onOpen}
            variant="primary"
            size="md"
            loading={opening}
            disabled={isDisabled}
            leftIcon="description"
            style={styles.openButton}
          />
        )}
      </View>

      {showViewAll && onViewAll && (
        <Button
          title="查看我的 PDF"
          onPress={onViewAll}
          variant="outline"
          size="md"
          disabled={isDisabled}
          rightIcon="chevron-right"
          fullWidth
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: designSystem.spacing.md,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: designSystem.spacing.sm,
    justifyContent: 'space-between',
  },
  shareButton: {
    flex: 1,
    backgroundColor: designSystem.colors.success.default,
  },
  printButton: {
    flex: 1,
    backgroundColor: designSystem.colors.primary,
  },
  openButton: {
    flex: 1,
    backgroundColor: designSystem.colors.warning.default,
  },
});

export default PDFActionButtons;
