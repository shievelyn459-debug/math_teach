import { PDFDocument } from 'react-native-pdf-lib';
import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid, NativeModules, Linking } from 'react-native';
import { Question, Difficulty, PDFMetadata, PDFFileInfo, ShareOptions } from '../types';

// 检查 Android API 版本
const getAndroidApiLevel = (): number | null => {
  if (Platform.OS === 'android' && NativeModules.PlatformConstants) {
    return NativeModules.PlatformConstants.Version;
  }
  return null;
};

// 生成唯一ID
const generateUUID = (): string => {
  return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toUpperCase();
};

// PDF 布局常量 (A4 尺寸: 595 x 842 points)
const PDF_CONSTANTS = {
  PAGE_WIDTH: 595,
  PAGE_HEIGHT: 842,
  MARGIN: 50,
  HEADER_TITLE_SIZE: 24,
  HEADER_METADATA_SIZE: 12,
  QUESTION_SIZE: 14,
  QUESTION_SPACING: 40,
  HEADER_SPACING: 100,
} as const;

// 文件名验证正则表达式
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f\n\r\t]/;
const RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
];

// 生成默认文件名
const generateDefaultFilename = (metadata: PDFMetadata): string => {
  const date = new Date().toISOString().split('T')[0];
  return `一年级数学练习_${date}.pdf`;
};

// 获取难度标签
const getDifficultyLabel = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case Difficulty.EASY:
      return '简单';
    case Difficulty.MEDIUM:
      return '中等';
    case Difficulty.HARD:
      return '困难';
    default:
      return '未知';
  }
};

// 验证文件名
const validateFilename = (filename: string): boolean => {
  // 检查无效字符
  if (INVALID_FILENAME_CHARS.test(filename)) {
    return false;
  }

  // 检查长度 (最大255字符)
  if (filename.length > 255) {
    return false;
  }

  // 检查 Windows 保留名称
  const baseName = filename.replace(/\.[^/.]+$/, '').toUpperCase();
  if (RESERVED_NAMES.includes(baseName)) {
    return false;
  }

  return true;
};

// 获取 PDF 保存路径 (平台特定)
const getPDFSavePath = (): string => {
  if (Platform.OS === 'ios') {
    return RNFS.DocumentDirectoryPath;
  }
  // Android
  return RNFS.ExternalStorageDirectoryPath + '/Documents';
};

// 检查存储权限
const checkStoragePermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS 不需要显式权限
    return true;
  }

  // Android 13+ (API 33+) 不需要存储权限，使用媒体存储 API
  const apiLevel = getAndroidApiLevel();
  if (apiLevel !== null && apiLevel >= 33) {
    // Android 13+ 使用更细粒度的媒体权限
    // 对于 PDF 保存到应用目录，不需要额外权限
    return true;
  }

  // Android 12 及以下需要存储权限
  try {
    const readGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    );
    const writeGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return readGranted && writeGranted;
  } catch (error) {
    console.error('[pdfService] Error checking permissions:', error);
    return false;
  }
};

// 请求存储权限
const requestStoragePermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return true;
  }

  // Android 13+ (API 33+) 不需要存储权限
  const apiLevel = getAndroidApiLevel();
  if (apiLevel !== null && apiLevel >= 33) {
    return true;
  }

  // Android 12 及以下需要请求存储权限
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ]);

    const allGranted =
      granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED;

    return allGranted;
  } catch (error) {
    console.error('[pdfService] Error requesting permissions:', error);
    return false;
  }
};

// 保存 PDF 文件
const savePDF = async (sourcePath: string, filename: string): Promise<string> => {
  const saveDir = getPDFSavePath();
  const destinationPath = `${saveDir}/${filename}`;

  try {
    // 确保目录存在
    const dirExists = await RNFS.exists(saveDir);
    if (!dirExists) {
      await RNFS.mkdir(saveDir);
      // 验证目录是否成功创建
      const dirCreated = await RNFS.exists(saveDir);
      if (!dirCreated) {
        throw new Error('无法创建保存目录');
      }
    }

    // 复制文件到目标位置
    await RNFS.copyFile(sourcePath, destinationPath);

    // 清理：删除临时文件
    try {
      await RNFS.unlink(sourcePath);
      console.log('[pdfService] Temporary file deleted:', sourcePath);
    } catch (cleanupError) {
      console.warn('[pdfService] Failed to delete temporary file:', cleanupError);
      // 不抛出错误 - 保存已成功
    }

    return destinationPath;
  } catch (error) {
    console.error('[pdfService] Error saving PDF:', error);
    throw new Error(`保存 PDF 失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 绘制文本（处理多行），返回占用的总高度
const drawTextWrapped = (
  page: any,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number
): number => {
  // 对于中文，每个字符大约占字体大小的一半宽度
  const charWidth = size * 0.6;
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);

  if (text.length <= maxCharsPerLine) {
    page.drawText(text, { x, y, size });
    return size * 1.2; // 单行高度
  }

  // 简单的多行处理
  const lines = [];
  for (let i = 0; i < text.length; i += maxCharsPerLine) {
    lines.push(text.substring(i, i + maxCharsPerLine));
  }

  lines.forEach((line, index) => {
    page.drawText(line, { x, y: y - (index * size * 1.2), size });
  });

  return lines.length * size * 1.2; // 返回总高度
};

// 生成题目 PDF
const generateQuestionsPDF = async (
  questions: Question[],
  metadata: PDFMetadata
): Promise<string> => {
  // 验证输入
  if (!questions || questions.length === 0) {
    throw new Error('questions array cannot be empty');
  }

  if (!metadata) {
    throw new Error('metadata is required');
  }

  // 验证题目内容非空
  for (const question of questions) {
    if (!question.content || question.content.trim().length === 0) {
      throw new Error(`题目 ID ${question.id} 的内容为空`);
    }
  }

  try {
    // 创建 PDF 文档
    const doc = await PDFDocument.create();
    const {
      PAGE_WIDTH,
      PAGE_HEIGHT,
      MARGIN,
      HEADER_TITLE_SIZE,
      HEADER_METADATA_SIZE,
      QUESTION_SIZE,
      QUESTION_SPACING,
      HEADER_SPACING,
    } = PDF_CONSTANTS;

    // 添加第一页
    let page = doc.addPage(PAGE_WIDTH, PAGE_HEIGHT);

    // 绘制标题（居中）
    const titleWidth = metadata.title.length * HEADER_TITLE_SIZE * 0.6;
    page.drawText(metadata.title, {
      x: (PAGE_WIDTH - titleWidth) / 2,
      y: PAGE_HEIGHT - MARGIN,
      size: HEADER_TITLE_SIZE,
      color: '/000000',
    });

    // 绘制元数据（日期和难度）
    const difficultyLabel = getDifficultyLabel(metadata.difficulty);
    page.drawText(`日期: ${metadata.date}`, {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 40,
      size: HEADER_METADATA_SIZE,
      color: '/000000',
    });

    page.drawText(`难度: ${difficultyLabel}`, {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 60,
      size: HEADER_METADATA_SIZE,
      color: '/000000',
    });

    // 绘制题目编号列表
    let yPosition = PAGE_HEIGHT - MARGIN - HEADER_SPACING;
    const contentWidth = PAGE_WIDTH - (2 * MARGIN);

    questions.forEach((question, index) => {
      const questionText = `${index + 1}. ${question.content}`;

      // 先计算题目文本占用的预估高度
      const charWidth = QUESTION_SIZE * 0.6;
      const maxCharsPerLine = Math.floor(contentWidth / charWidth);
      const estimatedLines = Math.ceil(questionText.length / maxCharsPerLine);
      const estimatedHeight = estimatedLines * QUESTION_SIZE * 1.2;

      // 检查是否需要新页面（预留更多空间）
      if (yPosition - estimatedHeight < MARGIN + QUESTION_SPACING) {
        page = doc.addPage(PAGE_WIDTH, PAGE_HEIGHT);
        yPosition = PAGE_HEIGHT - MARGIN;
      }

      // 绘制题目文本并获取实际高度
      const actualHeight = drawTextWrapped(
        page,
        questionText,
        MARGIN,
        yPosition,
        QUESTION_SIZE,
        contentWidth
      );

      // 移动到下一题位置
      yPosition -= (actualHeight + QUESTION_SPACING);
    });

    // 保存 PDF 到临时文件
    const tempPath = `${PDFDocument.getDocumentsDirectory()}/temp_questions_${generateUUID()}.pdf`;
    await doc.write(tempPath);

    return tempPath;
  } catch (error) {
    console.error('[pdfService] Error generating PDF:', error);
    throw new Error(`生成 PDF 失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 分享 PDF 文件
const sharePDF = async (filePath: string, options?: ShareOptions): Promise<void> => {
  try {
    // 动态导入 react-native-share
    const Share = require('react-native-share').default;

    const shareOptions = {
      title: options?.title || '分享练习题',
      message: options?.message || '一年级数学练习题',
      url: `file://${filePath}`,
      type: 'application/pdf',
      subject: options?.subject || '数学练习题',
      excludedActivityTypes: options?.excludedActivityTypes,
      dialogTitle: options?.dialogTitle || '分享 PDF',
    };

    await Share.open(shareOptions);
  } catch (error: any) {
    // 用户取消分享不视为错误
    if (error.message?.includes('User did not share') || error.message?.includes('User cancelled')) {
      console.log('[pdfService] Share cancelled by user');
      return;
    }
    console.error('[pdfService] Share error:', error);
    throw new Error(`分享失败: ${error.message || '未知错误'}`);
  }
};

// 打印 PDF 文件
const printPDF = async (filePath: string): Promise<void> => {
  try {
    // 动态导入 expo-print
    const Print = require('expo-print').Print;

    // 检查打印是否可用
    const isAvailable = await Print.printAvailableAsync();
    if (!isAvailable) {
      throw new Error('打印服务不可用');
    }

    // 打开打印对话框
    await Print.printAsync({ uri: `file://${filePath}` });
  } catch (error: any) {
    console.error('[pdfService] Print error:', error);
    throw new Error(`打印失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 打开 PDF 文件
const openPDF = async (filePath: string): Promise<boolean> => {
  try {
    const url = `file://${filePath}`;
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      throw new Error('没有安装PDF查看器');
    }

    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('[pdfService] Open file error:', error);
    if (error instanceof Error && error.message === '没有安装PDF查看器') {
      throw error;
    }
    throw new Error(`打开文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 获取已保存的 PDF 列表
const getSavedPDFs = async (): Promise<PDFFileInfo[]> => {
  const searchDirs: string[] = [];

  if (Platform.OS === 'ios') {
    searchDirs.push(RNFS.DocumentDirectoryPath);
  } else {
    // Android
    searchDirs.push(RNFS.ExternalStorageDirectoryPath + '/Documents');
    searchDirs.push(RNFS.DownloadDirectoryPath);
  }

  const pdfFiles: PDFFileInfo[] = [];

  for (const dir of searchDirs) {
    try {
      const exists = await RNFS.exists(dir);
      if (!exists) continue;

      const files = await RNFS.readDir(dir);
      const pdfs = files
        .filter(f => f.name.endsWith('.pdf') && !f.name.startsWith('.'))
        .map(f => ({
          name: f.name,
          path: f.path,
          size: f.size || 0,
          createdAt: new Date(f.ctime || 0),
          modifiedAt: new Date(f.mtime || 0),
        }));
      pdfFiles.push(...pdfs);
    } catch (error) {
      console.warn(`[pdfService] Cannot read directory: ${dir}`, error);
    }
  }

  // 按修改时间排序，最新的在前
  return pdfFiles.sort((a, b) =>
    b.modifiedAt.getTime() - a.modifiedAt.getTime()
  );
};

// 删除 PDF 文件
const deletePDF = async (filePath: string): Promise<void> => {
  try {
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      throw new Error('文件不存在');
    }

    await RNFS.unlink(filePath);
    console.log('[pdfService] File deleted:', filePath);
  } catch (error) {
    console.error('[pdfService] Delete file error:', error);
    throw new Error(`删除文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 获取文件大小（格式化）
const getFormattedFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// 导出服务
export const pdfService = {
  generateQuestionsPDF,
  savePDF,
  sharePDF,
  printPDF,
  openPDF,
  getSavedPDFs,
  deletePDF,
  getFormattedFileSize,
  getPDFSavePath,
  checkStoragePermissions,
  requestStoragePermissions,
  validateFilename,
  getDifficultyLabel,
};
