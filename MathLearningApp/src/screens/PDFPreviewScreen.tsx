import React, {useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import Pdf from 'react-native-pdf';
import {StackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

// Safe Pdf wrapper - react-native-pdf native component may not be available
const SafePdf = Pdf || (() => null);

import FilenameDialog from '../components/FilenameDialog';
import PDFActionButtons from '../components/PDFActionButtons';
import {pdfService} from '../services/pdfService';
import {Difficulty} from '../types';
import {getFontSize, getScaledSpacing} from '../styles/tablet';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer, Button} from '../components/ui';

interface RouteParams {
  pdfPath: string;
  questionCount: number;
  difficulty: Difficulty;
}

type NavigationProp = StackNavigationProp<any, 'PDFPreview'>;

interface Props {
  route: RouteProp<{params: RouteParams}, 'PDFPreview'>;
  navigation: NavigationProp;
}

const PDFPreviewScreen: React.FC<Props> = ({route, navigation}) => {
  const {pdfPath, questionCount, difficulty} = route.params;
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;

  // Responsive font sizes
  const headerTitleFontSize = getFontSize(20, width);
  const headerInfoFontSize = getFontSize(14, width);
  const buttonFontSize = getFontSize(16, width);
  const successTitleFontSize = getFontSize(24, width);

  // Responsive spacing
  const buttonPadding = getScaledSpacing(14, width);
  const headerPadding = getScaledSpacing(16, width);

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
      setFileSize(fileInfo?.size || 0);

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
      <Icon
        name="check-circle"
        size="xxl"
        color={designSystem.colors.success.default}
      />
      <Spacer size="lg" />
      <Typography variant="displaySmall" align="center">
        PDF 已保存
      </Typography>
      {savedFilePath && (
        <>
          <Spacer size="sm" />
          <Typography
            variant="caption"
            color={designSystem.colors.text.secondary}
            align="center"
            numberOfLines={2}>
            {savedFilePath}
          </Typography>
        </>
      )}
      {fileSize > 0 && (
        <>
          <Spacer size="xs" />
          <Typography
            variant="overline"
            color={designSystem.colors.text.hint}
            align="center">
            文件大小: {pdfService.getFormattedFileSize(fileSize)}
          </Typography>
        </>
      )}

      <Spacer size="xxl" />

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
          <Typography
            variant="caption"
            color={designSystem.colors.warning.dark}>
            {actionError}
          </Typography>
          <Spacer size="sm" />
          <TouchableOpacity
            style={[styles.dismissErrorButton, {minHeight: 48}]}
            onPress={() => setActionError(null)}>
            <Typography
              variant="caption"
              color={designSystem.colors.text.inverse}>
              关闭
            </Typography>
          </TouchableOpacity>
        </View>
      )}

      {/* 底部导航按钮 */}
      <View style={styles.successButtonContainer}>
        <Button
          title="完成"
          onPress={handleDone}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Spacer size="md" />
        <Button
          title="生成更多"
          onPress={() => {
            setShowSuccess(false);
            setSavedFilePath(null);
            setFileSize(0);
            setActionError(null);
          }}
          variant="secondary"
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );

  // 错误界面
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon
        name="error"
        size="xxl"
        color={designSystem.colors.error.default}
      />
      <Spacer size="lg" />
      <Typography variant="displaySmall" align="center">
        出错了
      </Typography>
      <Spacer size="sm" />
      <Typography
        variant="body"
        color={designSystem.colors.text.secondary}
        align="center">
        {error}
      </Typography>
      <Spacer size="xxl" />
      <View style={styles.errorButtonContainer}>
        <Button
          title="重试"
          onPress={handleRetry}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Spacer size="md" />
        <Button
          title="取消"
          onPress={handleDone}
          variant="secondary"
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );

  // 主界面
  const renderContent = () => {
    if (isLandscape) {
      // 横屏布局：PDF在左侧(60%)，控制按钮在右侧(40%)
      return (
        <View style={styles.landscapeContainer}>
          <View style={styles.landscapePdfContainer}>
            <SafePdf
              source={{uri: `file://${pdfPath}`}}
              style={styles.landscapePdf}
              onLoadComplete={handleLoadComplete}
              onError={handleLoadError}
              trustAllCerts={false}
              enablePaging
              page={1}
              horizontal
            />
          </View>
          <View style={styles.landscapeControls}>
            <Typography variant="displaySmall" style={{fontSize: successTitleFontSize}}>
              PDF 预览
            </Typography>
            <Spacer size="sm" />
            <Typography
              variant="caption"
              color={designSystem.colors.text.secondary}
              style={{fontSize: headerInfoFontSize}}>
              {questionCount} 题 · {pdfService.getDifficultyLabel(difficulty)}
            </Typography>
            <Spacer size="xxl" />
            <View style={styles.landscapeButtonContainer}>
              <Button
                title="取消"
                onPress={handleDone}
                variant="secondary"
                size="lg"
                fullWidth
              />
              <Spacer size="md" />
              <Button
                title={isLoading ? '保存中...' : '保存 PDF'}
                onPress={handleSavePress}
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading || pdfLoadFailed}
                loading={isLoading}
              />
            </View>
          </View>
        </View>
      );
    }

    // 竖屏布局：PDF在上，按钮在下
    return (
      <>
        <SafePdf
          source={{uri: `file://${pdfPath}`}}
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
          <Button
            title="取消"
            onPress={handleDone}
            variant="secondary"
            size="lg"
            style={styles.button}
          />
          <Button
            title={isLoading ? '保存中...' : '保存 PDF'}
            onPress={handleSavePress}
            variant="primary"
            size="lg"
            style={styles.button}
            disabled={isLoading || pdfLoadFailed}
            loading={isLoading}
          />
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* 头部信息 - 仅竖屏模式显示 */}
      {!isLandscape && (
        <View style={[styles.header, {padding: headerPadding}]}>
          <Typography variant="headlineMedium" style={{fontSize: headerTitleFontSize}}>
            PDF 预览
          </Typography>
          <Typography
            variant="caption"
            color={designSystem.colors.text.secondary}
            style={{fontSize: headerInfoFontSize}}>
            {questionCount} 题 · {pdfService.getDifficultyLabel(difficulty)}
          </Typography>
        </View>
      )}

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
    backgroundColor: designSystem.colors.background,
  },
  header: {
    backgroundColor: designSystem.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border,
  },
  pdf: {
    flex: 1,
  },
  // 横屏布局
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapePdfContainer: {
    flex: 0.6,
    backgroundColor: designSystem.colors.surface.overlay,
  },
  landscapePdf: {
    flex: 1,
  },
  landscapeControls: {
    flex: 0.4,
    backgroundColor: designSystem.colors.surface.primary,
    padding: designSystem.spacing.xxl,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: designSystem.colors.border,
  },
  landscapeButtonContainer: {
    gap: designSystem.spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: designSystem.spacing.lg,
    gap: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.border,
  },
  button: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xxxl,
  },
  successButtonContainer: {
    width: '100%',
    gap: designSystem.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xxxl,
  },
  errorButtonContainer: {
    width: '100%',
    gap: designSystem.spacing.md,
  },
  actionErrorContainer: {
    width: '100%',
    backgroundColor: designSystem.colors.warning.light,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    marginTop: designSystem.spacing.md,
    borderWidth: 1,
    borderColor: designSystem.colors.warning.dark,
  },
  dismissErrorButton: {
    alignSelf: 'flex-start',
    paddingVertical: designSystem.spacing.xs,
    paddingHorizontal: designSystem.spacing.md,
    backgroundColor: designSystem.colors.warning.default,
    borderRadius: designSystem.borderRadius.sm,
  },
});

export default PDFPreviewScreen;
