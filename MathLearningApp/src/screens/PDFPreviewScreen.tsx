import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Pdf } from 'react-native-pdf';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { PDFDocument } from 'react-native-pdf-lib';

import FilenameDialog from '../components/FilenameDialog';
import PDFActionButtons from '../components/PDFActionButtons';
import { pdfService } from '../services/pdfService';
import { Difficulty } from '../types';

interface RouteParams {
  pdfPath: string;
  questionCount: number;
  difficulty: Difficulty;
}

type NavigationProp = StackNavigationProp<any, 'PDFPreview'>;

interface Props {
  route: RouteProp<{ params: RouteParams }, 'PDFPreview'>;
  navigation: NavigationProp;
}

const PDFPreviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { pdfPath, questionCount, difficulty } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [showFilenameDialog, setShowFilenameDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 操作状态
  const [sharing, setSharing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [opening, setOpening] = useState(false);
  const [fileSize, setFileSize] = useState<number>(0);
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);

  // 生成默认文件名
  const generateDefaultFilename = (): string => {
    const date = new Date().toISOString().split('T')[0];
    const difficultyLabel = pdfService.getDifficultyLabel(difficulty);
    return `一年级数学练习_${difficultyLabel}_${date}.pdf`;
  };

  // 处理保存按钮
  const handleSavePress = async () => {
    setError(null);

    // 检查权限
    const hasPermission = await pdfService.checkStoragePermissions();
    if (!hasPermission) {
      const granted = await pdfService.requestStoragePermissions();
      if (!granted) {
        setError('需要存储权限才能保存 PDF 文件');
        return;
      }
    }

    setShowFilenameDialog(true);
  };

  // 处理文件名确认
  const handleFilenameConfirm = async (filename: string) => {
    setShowFilenameDialog(false);
    setIsLoading(true);
    setError(null);

    try {
      // 保存 PDF
      const savedPath = await pdfService.savePDF(pdfPath, filename);

      // 获取文件大小
      const RNFS = require('react-native-fs');
      const fileInfo = await RNFS.stat(savedPath);
      setFileSize(fileInfo.size || 0);

      setSavedFilePath(savedPath);
      setShowSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败，请重试';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setShowFilenameDialog(false);
    setError(null);
  };

  // 处理完成
  const handleDone = () => {
    setShowSuccess(false);
    navigation.goBack();
  };

  // 处理重试
  const handleRetry = () => {
    setError(null);
    setShowFilenameDialog(true);
  };

  // 处理分享
  const handleShare = async () => {
    if (!savedFilePath) return;

    setActionError(null);
    setSharing(true);

    try {
      await pdfService.sharePDF(savedFilePath, {
        title: '分享练习题',
        message: '一年级数学练习题',
        subject: '数学练习题',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分享失败，请重试';
      setActionError(errorMessage);
    } finally {
      setSharing(false);
    }
  };

  // 处理打印
  const handlePrint = async () => {
    if (!savedFilePath) return;

    setActionError(null);
    setPrinting(true);

    try {
      await pdfService.printPDF(savedFilePath);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '打印失败，请重试';
      setActionError(errorMessage);
    } finally {
      setPrinting(false);
    }
  };

  // 处理打开
  const handleOpen = async () => {
    if (!savedFilePath) return;

    setActionError(null);
    setOpening(true);

    try {
      const opened = await pdfService.openPDF(savedFilePath);
      if (!opened) {
        setActionError('没有安装PDF查看器应用');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '打开文件失败';
      setActionError(errorMessage);
    } finally {
      setOpening(false);
    }
  };

  // 查看所有 PDF
  const handleViewAll = () => {
    setShowSuccess(false);
    navigation.navigate('PDFList' as never);
  };

  // 处理加载完成
  const handleLoadComplete = (numberOfPages: number) => {
    console.log(`PDF loaded with ${numberOfPages} pages`);
  };

  // 处理加载错误
  const handleLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('无法预览 PDF 文件');
    setPdfLoadFailed(true);
  };

  // 成功界面
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>✓</Text>
      <Text style={styles.successTitle}>PDF 已保存</Text>
      {savedFilePath && (
        <Text style={styles.successPath} numberOfLines={2}>
          {savedFilePath}
        </Text>
      )}
      {fileSize > 0 && (
        <Text style={styles.successFileSize}>
          文件大小: {pdfService.getFormattedFileSize(fileSize)}
        </Text>
      )}

      {/* 操作按钮 */}
      <PDFActionButtons
        onShare={handleShare}
        onPrint={handlePrint}
        onOpen={handleOpen}
        onViewAll={handleViewAll}
        sharing={sharing}
        printing={printing}
        opening={opening}
        showViewAll={true}
      />

      {/* 操作错误显示 */}
      {actionError && (
        <View style={styles.actionErrorContainer}>
          <Text style={styles.actionErrorText}>{actionError}</Text>
          <TouchableOpacity
            style={styles.dismissErrorButton}
            onPress={() => setActionError(null)}>
            <Text style={styles.dismissErrorButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 底部导航按钮 */}
      <View style={styles.successButtonContainer}>
        <TouchableOpacity
          style={[styles.successButton, styles.primaryButton]}
          onPress={handleDone}>
          <Text style={styles.primaryButtonText}>完成</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.successButton, styles.secondaryButton]}
          onPress={() => {
            setShowSuccess(false);
            setSavedFilePath(null);
            setFileSize(0);
            setActionError(null);
          }}>
          <Text style={styles.secondaryButtonText}>生成更多</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 错误界面
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>!</Text>
      <Text style={styles.errorTitle}>出错了</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <View style={styles.errorButtonContainer}>
        <TouchableOpacity
          style={[styles.errorButton, styles.retryButton]}
          onPress={handleRetry}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.errorButton, styles.cancelButton]}
          onPress={handleDone}>
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 主界面
  const renderContent = () => (
    <>
      <Pdf
        source={{ uri: `file://${pdfPath}` }}
        style={styles.pdf}
        onLoadComplete={handleLoadComplete}
        onError={handleLoadError}
        trustAllCerts={false}
        enablePaging
        page={1}
        horizontal
      />

      {/* 底部按钮栏 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleDone}>
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, (isLoading || pdfLoadFailed) ? styles.buttonDisabled : styles.saveButton]}
          onPress={handleSavePress}
          disabled={isLoading || pdfLoadFailed}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>保存 PDF</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* 头部信息 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PDF 预览</Text>
        <Text style={styles.headerInfo}>
          {questionCount} 题 · {pdfService.getDifficultyLabel(difficulty)}
        </Text>
      </View>

      {/* 内容区域 */}
      {showSuccess ? renderSuccess() : error ? renderError() : renderContent()}

      {/* 文件名对话框 */}
      <FilenameDialog
        visible={showFilenameDialog}
        defaultFilename={generateDefaultFilename()}
        onConfirm={handleFilenameConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pdf: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#2196f3',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    fontSize: 64,
    color: '#4caf50',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  successPath: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  successFileSize: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  successButtonContainer: {
    width: '100%',
    gap: 12,
  },
  successButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196f3',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    color: '#f44336',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorButtonContainer: {
    width: '100%',
    gap: 12,
  },
  errorButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#f44336',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionErrorContainer: {
    width: '100%',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  actionErrorText: {
    fontSize: 14,
    color: '#e65100',
    marginBottom: 8,
  },
  dismissErrorButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#ffb74d',
    borderRadius: 4,
  },
  dismissErrorButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PDFPreviewScreen;
