import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';

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
              <Text style={styles.title}>保存 PDF</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    error ? styles.inputError : null
                  ]}
                  value={filename}
                  onChangeText={(text) => {
                    setFilename(text);
                    validateFilename(text);
                  }}
                  placeholder="请输入文件名"
                  placeholderTextColor="#999"
                  autoFocus
                  selectTextOnFocus
                />
                <Text style={styles.extension}>.pdf</Text>
              </View>

              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}>
                  <Text style={styles.confirmButtonText}>保存</Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#f44336',
  },
  extension: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#2196f3',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default FilenameDialog;
