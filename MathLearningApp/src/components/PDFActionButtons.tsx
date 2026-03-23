import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

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
  const ActionButton: React.FC<{
    onPress: () => void;
    icon: string;
    label: string;
    loading: boolean;
    disabled?: boolean;
    style: any;
  }> = ({ onPress, icon, label, loading, disabled, style }) => (
    <TouchableOpacity
      style={[styles.actionButton, style, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Text style={styles.buttonIcon}>{icon}</Text>
          <Text style={styles.buttonLabel}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.primaryActions}>
        {onShare && (
          <ActionButton
            onPress={onShare}
            icon="↗"
            label="分享"
            loading={sharing}
            disabled={sharing || printing || opening}
            style={styles.shareButton}
          />
        )}
        {onPrint && (
          <ActionButton
            onPress={onPrint}
            icon="🖨"
            label="打印"
            loading={printing}
            disabled={sharing || printing || opening}
            style={styles.printButton}
          />
        )}
        {onOpen && (
          <ActionButton
            onPress={onOpen}
            icon="📄"
            label="打开"
            loading={opening}
            disabled={sharing || printing || opening}
            style={styles.openButton}
          />
        )}
      </View>

      {showViewAll && onViewAll && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAll}
          disabled={sharing || printing || opening}>
          <Text style={styles.viewAllButtonText}>查看我的 PDF</Text>
          <Text style={styles.viewAllButtonIcon}>→</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 18,
    color: '#fff',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  printButton: {
    backgroundColor: '#2196F3',
  },
  openButton: {
    backgroundColor: '#FF9800',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 48,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 6,
  },
  viewAllButtonIcon: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default PDFActionButtons;
