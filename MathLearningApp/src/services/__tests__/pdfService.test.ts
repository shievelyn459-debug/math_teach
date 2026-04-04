import { Question, Difficulty, QuestionType, PDFMetadata } from '../../types';

// Mock react-native-pdf-lib
const mockDrawText = jest.fn();
const mockAddPage = jest.fn(() => ({
  drawText: mockDrawText,
}));
const mockWrite = jest.fn(() => Promise.resolve('/mock/path.pdf'));
const mockGetPages = jest.fn(() => []);

jest.mock('react-native-pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn(() => Promise.resolve({
      addPage: mockAddPage,
      write: mockWrite,
      getPages: mockGetPages,
    })),
    getDocumentsDirectory: jest.fn(() => '/mock/documents/dir'),
  },
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/Documents',
  ExternalStorageDirectoryPath: '/mock/external/storage',
  DownloadDirectoryPath: '/mock/downloads',
  exists: jest.fn(),
  mkdir: jest.fn(),
  copyFile: jest.fn(),
  unlink: jest.fn(),
  readDir: jest.fn(),
  stat: jest.fn(),
}));

// Mock react-native-share
jest.mock('react-native-share', () => ({
  open: jest.fn(() => Promise.resolve({ success: true })),
  default: {
    open: jest.fn(() => Promise.resolve({ success: true })),
  },
}));

// Mock expo-print
jest.mock('expo-print', () => ({
  printAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Platform and Permissions
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj: any) => obj.ios || obj.default),
    Version: '14.0',
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
    },
    check: jest.fn(),
    request: jest.fn(),
    requestMultiple: jest.fn(),
  },
  NativeModules: {
    PlatformConstants: {
      Version: 33,
    },
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(),
  },
}));

// Import service after mocks are set up
import { pdfService } from '../pdfService';
import { Platform, PermissionsAndroid, NativeModules, Linking } from 'react-native';

describe('pdfService', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      title: '加法练习',
      content: '5 + 3 = ?',
      type: QuestionType.ADDITION,
      difficulty: Difficulty.EASY,
      grade: 1,
      knowledgePoint: '加法运算',
      explanation: '把5和3合起来，答案是8',
      answer: '8',
      createdAt: new Date('2026-03-23'),
      userId: 'user123',
    },
    {
      id: 'q2',
      title: '减法练习',
      content: '10 - 4 = ?',
      type: QuestionType.SUBTRACTION,
      difficulty: Difficulty.EASY,
      grade: 1,
      knowledgePoint: '减法运算',
      explanation: '从10中减去4，答案是6',
      answer: '6',
      createdAt: new Date('2026-03-23'),
      userId: 'user123',
    },
  ];

  const mockMetadata: PDFMetadata = {
    title: '一年级数学练习题',
    date: '2026-03-23',
    difficulty: Difficulty.EASY,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQuestionsPDF', () => {
    it('should generate a PDF with questions', async () => {
      const result = await pdfService.generateQuestionsPDF(mockQuestions, mockMetadata);

      expect(mockAddPage).toHaveBeenCalled();
      expect(mockDrawText).toHaveBeenCalled();
      expect(mockWrite).toHaveBeenCalled();
      expect(result).toContain('temp_questions_');
      expect(result).toContain('.pdf');
    });

    it('should add header with title, date, and difficulty', async () => {
      await pdfService.generateQuestionsPDF(mockQuestions, mockMetadata);

      // 验证标题被绘制
      expect(mockDrawText).toHaveBeenCalledWith(
        '一年级数学练习题',
        expect.objectContaining({
          size: 24,
        })
      );

      // 验证日期被绘制
      expect(mockDrawText).toHaveBeenCalledWith(
        '日期: 2026-03-23',
        expect.objectContaining({
          size: 12,
        })
      );

      // 验证难度被绘制
      expect(mockDrawText).toHaveBeenCalledWith(
        '难度: 简单',
        expect.objectContaining({
          size: 12,
        })
      );
    });

    it('should format questions as numbered list', async () => {
      await pdfService.generateQuestionsPDF(mockQuestions, mockMetadata);

      // 验证题目编号
      expect(mockDrawText).toHaveBeenCalledWith('1. 5 + 3 = ?', expect.anything());
      expect(mockDrawText).toHaveBeenCalledWith('2. 10 - 4 = ?', expect.anything());
    });

    it('should only include questions without answers or explanations', async () => {
      await pdfService.generateQuestionsPDF(mockQuestions, mockMetadata);

      const allCalls = mockDrawText.mock.calls.map(call => String(call[0]));

      // 题目内容应该存在
      expect(allCalls.some(text => text.includes('5 + 3'))).toBe(true);

      // 但不应该包含完整答案和讲解文本
      expect(allCalls.some(text => text.includes('答案是8'))).toBe(false);
      expect(allCalls.some(text => text.includes('讲解'))).toBe(false);
    });

    it('should handle page breaks for long question sets', async () => {
      // 创建15个题目来测试分页
      const longQuestions: Question[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        id: `q${i}`,
        content: `${i + 1} + ${i + 2} = ?`,
      }));

      await pdfService.generateQuestionsPDF(longQuestions, mockMetadata);

      // 应该调用多次 addPage 来处理分页
      expect(mockAddPage).toHaveBeenCalled();
    });

    it('should use A4 page size with appropriate margins', async () => {
      await pdfService.generateQuestionsPDF(mockQuestions, mockMetadata);

      // A4 尺寸是 595 x 842 points
      expect(mockAddPage).toHaveBeenCalledWith(595, 842);
    });

    it('should throw error for empty questions array', async () => {
      await expect(
        pdfService.generateQuestionsPDF([], mockMetadata)
      ).rejects.toThrow('questions array cannot be empty');
    });

    it('should complete generation within 5 seconds for 15 questions', async () => {
      const fifteenQuestions: Question[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        id: `q${i}`,
        content: `${i + 1} + ${i + 2} = ?`,
      }));

      const startTime = Date.now();
      await pdfService.generateQuestionsPDF(fifteenQuestions, mockMetadata);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe('savePDF', () => {
    const RNFS = require('react-native-fs');

    it('should save PDF to platform-specific directory', async () => {
      const mockSourcePath = '/mock/path.pdf';
      const filename = 'test.pdf';

      RNFS.exists = jest.fn().mockResolvedValue(true);
      RNFS.mkdir = jest.fn().mockResolvedValue(undefined);
      RNFS.copyFile = jest.fn().mockResolvedValue(undefined);
      RNFS.unlink = jest.fn().mockResolvedValue(undefined);

      const result = await pdfService.savePDF(mockSourcePath, filename);

      expect(result).toContain(filename);
      expect(RNFS.copyFile).toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      const mockSourcePath = '/mock/path.pdf';
      const filename = 'test.pdf';

      // 第一次调用返回false（目录不存在），mkdir后返回true（目录已创建）
      RNFS.exists = jest.fn()
        .mockResolvedValueOnce(false)  // 第一次检查
        .mockResolvedValue(true);      // mkdir后验证
      RNFS.mkdir = jest.fn().mockResolvedValue(undefined);
      RNFS.copyFile = jest.fn().mockResolvedValue(undefined);
      RNFS.unlink = jest.fn().mockResolvedValue(undefined);

      const result = await pdfService.savePDF(mockSourcePath, filename);

      expect(RNFS.mkdir).toHaveBeenCalled();
      expect(result).toContain(filename);
    });

    it('should throw error when directory creation fails', async () => {
      const mockSourcePath = '/mock/path.pdf';
      const filename = 'test.pdf';

      // 目录始终不存在（mkdir失败）
      RNFS.exists = jest.fn().mockResolvedValue(false);
      RNFS.mkdir = jest.fn().mockResolvedValue(undefined);

      await expect(pdfService.savePDF(mockSourcePath, filename)).rejects.toThrow('保存 PDF 失败');
    });
  });

  describe('getPDFSavePath', () => {
    it('should return iOS Documents directory path', () => {
      const path = pdfService.getPDFSavePath();
      expect(path).toBe('/mock/Documents');
    });
  });

  describe('validateFilename', () => {
    it('should accept valid filenames', () => {
      expect(pdfService.validateFilename('test.pdf')).toBe(true);
      expect(pdfService.validateFilename('练习题_2026-03-23.pdf')).toBe(true);
      expect(pdfService.validateFilename('math-questions_v1.pdf')).toBe(true);
    });

    it('should reject filenames with invalid characters', () => {
      expect(pdfService.validateFilename('test<.pdf')).toBe(false);
      expect(pdfService.validateFilename('test>.pdf')).toBe(false);
      expect(pdfService.validateFilename('test:.pdf')).toBe(false);
      expect(pdfService.validateFilename('test".pdf')).toBe(false);
      expect(pdfService.validateFilename('test/.pdf')).toBe(false);
      expect(pdfService.validateFilename('test|.pdf')).toBe(false);
      expect(pdfService.validateFilename('test?.pdf')).toBe(false);
      expect(pdfService.validateFilename('test*.pdf')).toBe(false);
    });

    it('should reject filenames that are too long', () => {
      const longName = 'a'.repeat(256) + '.pdf';
      expect(pdfService.validateFilename(longName)).toBe(false);
    });

    it('should reject Windows reserved names', () => {
      expect(pdfService.validateFilename('CON.pdf')).toBe(false);
      expect(pdfService.validateFilename('PRN.pdf')).toBe(false);
      expect(pdfService.validateFilename('AUX.pdf')).toBe(false);
      expect(pdfService.validateFilename('NUL.pdf')).toBe(false);
      expect(pdfService.validateFilename('COM1.pdf')).toBe(false);
      expect(pdfService.validateFilename('LPT1.pdf')).toBe(false);
    });
  });

  describe('getDifficultyLabel', () => {
    it('should return correct labels for difficulty levels', () => {
      expect(pdfService.getDifficultyLabel(Difficulty.EASY)).toBe('简单');
      expect(pdfService.getDifficultyLabel(Difficulty.MEDIUM)).toBe('中等');
      expect(pdfService.getDifficultyLabel(Difficulty.HARD)).toBe('困难');
    });
  });

  describe('checkStoragePermissions', () => {
    it('should return true for iOS (no permission needed)', async () => {
      const result = await pdfService.checkStoragePermissions();
      expect(result).toBe(true);
    });
  });

  describe('getFormattedFileSize', () => {
    it('should format bytes correctly', () => {
      expect(pdfService.getFormattedFileSize(0)).toBe('0 B');
      expect(pdfService.getFormattedFileSize(512)).toBe('512 B');
      expect(pdfService.getFormattedFileSize(1024)).toBe('1.0 KB');
      expect(pdfService.getFormattedFileSize(1536)).toBe('1.5 KB');
      expect(pdfService.getFormattedFileSize(1048576)).toBe('1.0 MB');
      expect(pdfService.getFormattedFileSize(2097152)).toBe('2.0 MB');
    });
  });

  describe('getSavedPDFs', () => {
    const RNFS = require('react-native-fs');

    it('should return list of PDF files', async () => {
      const mockFiles = [
        { name: 'test1.pdf', path: '/mock/test1.pdf', size: 1024, ctime: Date.now(), mtime: Date.now() },
        { name: 'test2.pdf', path: '/mock/test2.pdf', size: 2048, ctime: Date.now(), mtime: Date.now() },
      ];

      RNFS.exists = jest.fn().mockResolvedValue(true);
      RNFS.readDir = jest.fn().mockResolvedValue(mockFiles);

      const result = await pdfService.getSavedPDFs();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test1.pdf');
      expect(result[1].name).toBe('test2.pdf');
    });

    it('should filter out non-PDF files', async () => {
      const mockFiles = [
        { name: 'test.pdf', path: '/mock/test.pdf', size: 1024 },
        { name: 'image.jpg', path: '/mock/image.jpg', size: 2048 },
        { name: '.hidden.pdf', path: '/mock/.hidden.pdf', size: 512 },
      ];

      RNFS.exists = jest.fn().mockResolvedValue(true);
      RNFS.readDir = jest.fn().mockResolvedValue(mockFiles);

      const result = await pdfService.getSavedPDFs();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test.pdf');
    });

    it('should handle non-existent directory gracefully', async () => {
      RNFS.exists = jest.fn().mockResolvedValue(false);

      const result = await pdfService.getSavedPDFs();

      expect(result).toHaveLength(0);
    });

    it('should sort by modified date, newest first', async () => {
      const now = Date.now();
      const mockFiles = [
        { name: 'old.pdf', path: '/mock/old.pdf', size: 1024, ctime: now - 100000, mtime: now - 100000 },
        { name: 'new.pdf', path: '/mock/new.pdf', size: 2048, ctime: now, mtime: now },
      ];

      RNFS.exists = jest.fn().mockResolvedValue(true);
      RNFS.readDir = jest.fn().mockResolvedValue(mockFiles);

      const result = await pdfService.getSavedPDFs();

      expect(result[0].name).toBe('new.pdf');
      expect(result[1].name).toBe('old.pdf');
    });
  });

  describe('deletePDF', () => {
    const RNFS = require('react-native-fs');

    it('should delete existing PDF file', async () => {
      RNFS.exists = jest.fn().mockResolvedValue(true);
      RNFS.unlink = jest.fn().mockResolvedValue(undefined);

      await pdfService.deletePDF('/mock/test.pdf');

      expect(RNFS.unlink).toHaveBeenCalledWith('/mock/test.pdf');
    });

    it('should throw error for non-existent file', async () => {
      RNFS.exists = jest.fn().mockResolvedValue(false);

      await expect(pdfService.deletePDF('/mock/nonexistent.pdf')).rejects.toThrow('文件不存在');
    });
  });

  // ==================== 新增测试：Android 平台权限 ====================

  describe('checkStoragePermissions - Android', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      (Platform as any).OS = originalPlatform;
    });

    it('should return true on Android 13+ (API 33+)', async () => {
      (Platform as any).OS = 'android';
      (NativeModules.PlatformConstants as any).Version = 33;

      const result = await pdfService.checkStoragePermissions();

      expect(result).toBe(true);
    });

    it('should check permissions on Android 12 (API 30)', async () => {
      (Platform as any).OS = 'android';
      (NativeModules.PlatformConstants as any).Version = 30;
      (PermissionsAndroid.check as jest.Mock)
        .mockResolvedValueOnce(true) // READ_EXTERNAL_STORAGE
        .mockResolvedValueOnce(true); // WRITE_EXTERNAL_STORAGE

      const result = await pdfService.checkStoragePermissions();

      expect(result).toBe(true);
      expect(PermissionsAndroid.check).toHaveBeenCalledWith(
        'android.permission.READ_EXTERNAL_STORAGE'
      );
      expect(PermissionsAndroid.check).toHaveBeenCalledWith(
        'android.permission.WRITE_EXTERNAL_STORAGE'
      );
    });

    it('should return false when read permission not granted on Android 12', async () => {
      (Platform as any).OS = 'android';
      (NativeModules.PlatformConstants as any).Version = 30;
      (PermissionsAndroid.check as jest.Mock)
        .mockResolvedValueOnce(false) // READ_EXTERNAL_STORAGE
        .mockResolvedValueOnce(true); // WRITE_EXTERNAL_STORAGE

      const result = await pdfService.checkStoragePermissions();

      expect(result).toBe(false);
    });

    it('should handle permission check error gracefully', async () => {
      (Platform as any).OS = 'android';
      (NativeModules.PlatformConstants as any).Version = 30;
      (PermissionsAndroid.check as jest.Mock).mockRejectedValue(new Error('Permission check failed'));

      const result = await pdfService.checkStoragePermissions();

      expect(result).toBe(false);
    });
  });

  describe('requestStoragePermissions - Android', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      (Platform as any).OS = originalPlatform;
    });

    it('should return true on Android 13+ without requesting', async () => {
      (Platform as any).OS = 'android';
      (NativeModules.PlatformConstants as any).Version = 33;

      const result = await pdfService.requestStoragePermissions();

      expect(result).toBe(true);
      expect(PermissionsAndroid.requestMultiple).not.toHaveBeenCalled();
    });

    it('should request and grant permissions on Android 12', async () => {
      (Platform as any).OS = 'android';
      (NativeModules.PlatformConstants as any).Version = 30;
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.READ_EXTERNAL_STORAGE': 'granted',
        'android.permission.WRITE_EXTERNAL_STORAGE': 'granted',
      });

      const result = await pdfService.requestStoragePermissions();

      expect(result).toBe(true);
      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalled();
    });

    it('should return false when permissions denied on Android 12', async () => {
      (Platform as any).OS = 'android';
      (NativeModules.PlatformConstants as any).Version = 30;
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.READ_EXTERNAL_STORAGE': 'denied',
        'android.permission.WRITE_EXTERNAL_STORAGE': 'denied',
      });

      const result = await pdfService.requestStoragePermissions();

      expect(result).toBe(false);
    });

    it('should handle permission request error gracefully', async () => {
      (Platform as any).OS = 'android';
      (NativeModules.PlatformConstants as any).Version = 30;
      (PermissionsAndroid.requestMultiple as jest.Mock).mockRejectedValue(
        new Error('Permission request failed')
      );

      const result = await pdfService.requestStoragePermissions();

      expect(result).toBe(false);
    });
  });

  // ==================== 新增测试：分享和打开功能 ====================

  describe('sharePDF', () => {
    it('should share PDF successfully', async () => {
      const mockShare = require('react-native-share');
      mockShare.open = jest.fn().mockResolvedValue({ success: true });

      await expect(
        pdfService.sharePDF('/mock/documents/test.pdf')
      ).resolves.not.toThrow();
    });

    it('should handle share cancellation', async () => {
      const mockShare = require('react-native-share');
      mockShare.open = jest.fn().mockRejectedValue({ error: 'User cancelled' });

      await expect(
        pdfService.sharePDF('/mock/documents/test.pdf')
      ).rejects.toThrow();
    });
  });

  describe('openPDF', () => {
    it('should open PDF on iOS', async () => {
      (Platform as any).OS = 'ios';
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await pdfService.openPDF('/mock/documents/test.pdf');

      expect(Linking.openURL).toHaveBeenCalled();
    });

    it('should handle open error', async () => {
      (Platform as any).OS = 'ios';
      (Linking.openURL as jest.Mock).mockRejectedValue(new Error('Cannot open file'));

      await expect(
        pdfService.openPDF('/mock/documents/test.pdf')
      ).rejects.toThrow();
    });
  });

  describe('printPDF', () => {
    it('should print PDF successfully', async () => {
      const mockPrint = require('expo-print');
      mockPrint.printAsync = jest.fn().mockResolvedValue(undefined);

      await expect(
        pdfService.printPDF('/mock/documents/test.pdf')
      ).resolves.not.toThrow();
    });

    it('should handle print error', async () => {
      const mockPrint = require('expo-print');
      mockPrint.printAsync = jest.fn().mockRejectedValue(new Error('Print failed'));

      await expect(
        pdfService.printPDF('/mock/documents/test.pdf')
      ).rejects.toThrow();
    });
  });

  // ==================== 新增测试：错误场景 ====================

  describe('generateQuestionsPDF - Error Scenarios', () => {
    it('should throw error when question content is whitespace', async () => {
      const invalidQuestions = [
        {
          ...mockQuestions[0],
          content: '   ',
        },
      ];

      await expect(
        pdfService.generateQuestionsPDF(invalidQuestions, mockMetadata)
      ).rejects.toThrow();
    });

    it('should handle PDF generation error', async () => {
      const mockPDFDocument = require('react-native-pdf-lib').PDFDocument;
      mockPDFDocument.create = jest.fn().mockRejectedValue(new Error('PDF creation failed'));

      await expect(
        pdfService.generateQuestionsPDF(mockQuestions, mockMetadata)
      ).rejects.toThrow();
    });
  });

  describe('savePDF - Error Scenarios', () => {
    const RNFS = require('react-native-fs');

    it('should handle copy error', async () => {
      (RNFS.copyFile as jest.Mock).mockRejectedValue(new Error('Copy failed'));

      await expect(
        pdfService.savePDF('/tmp/test.pdf', 'test.pdf')
      ).rejects.toThrow('保存 PDF 失败');
    });

    it('should handle cleanup error gracefully', async () => {
      (RNFS.unlink as jest.Mock).mockRejectedValue(new Error('Cleanup failed'));
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);

      // Should not throw error even if cleanup fails
      const result = await pdfService.savePDF('/tmp/test.pdf', 'test.pdf');

      expect(result).toBeDefined();
    });
  });

  describe('getSavedPDFs - Edge Cases', () => {
    const RNFS = require('react-native-fs');

    it('should handle read error', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.readDir as jest.Mock).mockRejectedValue(new Error('Read directory failed'));

      await expect(pdfService.getSavedPDFs()).rejects.toThrow();
    });
  });

  describe('getPDFSavePath - Platform Specific', () => {
    it('should return Android path on Android platform', () => {
      const originalOS = Platform.OS;
      (Platform as any).OS = 'android';

      const path = pdfService.getPDFSavePath();

      expect(path).toContain('Documents');

      (Platform as any).OS = originalOS;
    });
  });
});
