import React, {useState, useEffect} from 'react';
import {
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import {designSystem} from '../styles/designSystem';
import {Typography, Button, Spacer} from '../components/ui';

interface Props {
  visible: boolean;
  defaultFilename: string;
  onConfirm: (filename: string) => void;
  onCancel: () => void;
}

const FilenameDialog: React.FC<Props> = ({
  visible,
  defaultFilename,
  onConfirm,
  onCancel,
}) => {
  const [filename, setFilename] = useState(defaultFilename);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilename(defaultFilename);
    setError(null);
  }, [defaultFilename, visible]);

  // 验证文件名
  const validateFilename = (name: string): boolean => {
    // 检查无效字符
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(name)) {
      setError('文件名包含无效字符');
      return false;
    }

    // 检查长度
    if (name.length === 0) {
      setError('请输入文件名');
      return false;
    }

    if (name.length > 255) {
      setError('文件名太长');
      return false;
    }

    // 检查 Windows 保留名称
    const baseName = name.replace(/\.[^/.]+$/, '').toUpperCase();
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];

    if (reservedNames.includes(baseName)) {
      setError('这是系统保留名称');
      return false;
    }

    setError(null);
    return true;
  };

  const handleConfirm = () => {
    if (validateFilename(filename)) {
      // 确保 .pdf 扩展名
      const finalFilename = filename.endsWith('.pdf')
        ? filename
        : `${filename}.pdf`;
      onConfirm(finalFilename);
      Keyboard.dismiss();
    }
  };

  const handleCancel = () => {
    onCancel();
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleCancel}
        testID="modal-overlay">
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.dialog}>
              <Typography variant="headlineSmall" style={styles.title}>
                保存 PDF
              </Typography>

              <Spacer size="md" />

              <View style={[
                styles.inputContainer,
                error ? styles.inputError : {}
              ]}>
                <TextInput
                  style={styles.input}
                  value={filename}
                  onChangeText={(text) => {
                    setFilename(text);
                    validateFilename(text);
                  }}
                  placeholder="请输入文件名"
                  placeholderTextColor={designSystem.colors.text.hint}
                  autoFocus
                  selectTextOnFocus
                />
                <Typography variant="body" color={designSystem.colors.text.secondary}>
                  .pdf
                </Typography>
              </View>

              {error && (
                <Typography variant="overline" color={designSystem.colors.error.default} style={styles.errorText}>
                  {error}
                </Typography>
              )}

              <Spacer size="xl" />

              <View style={styles.buttonContainer}>
                <Button
                  title="取消"
                  onPress={handleCancel}
                  variant="secondary"
                  size="md"
                  style={styles.button}
                />
                <Button
                  title="保存"
                  onPress={handleConfirm}
                  variant="primary"
                  size="md"
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: designSystem.colors.overlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  dialog: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.xl,
    ...designSystem.shadows.lg,
  },
  title: {
    marginBottom: designSystem.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: designSystem.colors.border,
    borderRadius: designSystem.borderRadius.md,
    paddingHorizontal: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface.secondary,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: designSystem.typography.sizes.body,
    color: designSystem.colors.text.primary,
  },
  inputError: {
    borderColor: designSystem.colors.error.default,
  },
  errorText: {
    marginTop: designSystem.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: designSystem.spacing.md,
  },
  button: {
    minWidth: 80,
  },
});

export default FilenameDialog;
