import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid, NativeModules, Linking } from 'react-native';
import { Question, Difficulty, PDFMetadata, PDFFileInfo, ShareOptions } from '../types';

// Native PDF generator module
const PdfGenerator = NativeModules.PdfGenerator;

// 检查 Android API 版本
const getAndroidApiLevel = (): number | null => {
  if (Platform.OS === 'android' && NativeModules.PlatformConstants) {
    return NativeModules.PlatformConstants.Version;
  }
  return null;
};

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
  // Android: 使用应用内部目录（不需要存储权限）
  return RNFS.DocumentDirectoryPath + '/PDFs';
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

// 生成题目 PDF (使用原生 PdfGenerator 模块)
const generateQuestionsPDF = async (
  questions: Question[],
  metadata: PDFMetadata
): Promise<string> => {
  // 验证输入
  if (!questions || questions.length === 0) {
    throw new Error('题目列表不能为空');
  }

  if (!metadata) {
    throw new Error('元数据不能为空');
  }

  // 验证题目内容非空
  for (const question of questions) {
    if (!question.content || question.content.trim().length === 0) {
      throw new Error(`题目 ID ${question.id} 的内容为空`);
    }
  }

  if (!PdfGenerator) {
    throw new Error('PDF生成模块未安装，请重新构建应用');
  }

  try {
    const difficultyLabel = getDifficultyLabel(metadata.difficulty);

    // 调用原生模块生成PDF
    const result = await PdfGenerator.generatePdf({
      title: metadata.title || '数学练习题',
      date: metadata.date || new Date().toISOString().split('T')[0],
      difficulty: difficultyLabel,
      questions: questions.map(q => ({
        content: q.content,
        answer: q.answer || '',
      })),
    });

    console.log(`[pdfService] PDF generated: ${result.path}, size: ${result.size}, pages: ${result.pageCount}`);
    return result.path;
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
    // 动态导入 expo-print (临时禁用)
    // const Print = require('expo-print').Print;
    //
    // // 检查打印是否可用
    // const isAvailable = await Print.printAvailableAsync();
    // if (!isAvailable) {
    //   throw new Error('打印服务不可用');
    // }
    //
    // // 打开打印对话框
    // await Print.printAsync({ uri: `file://${filePath}` });

    // 临时方案：抛出友好提示
    throw new Error('打印功能暂时不可用。请使用其他方式打印PDF文件。');
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
    // Android - 搜索与 savePDF 一致的目录
    searchDirs.push(RNFS.DocumentDirectoryPath + '/PDFs');
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
