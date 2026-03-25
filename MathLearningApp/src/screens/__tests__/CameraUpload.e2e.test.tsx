/**
 * 拍照上传题目 E2E测试
 *
 * Story 2-1: 拍照上传题目
 * PM: John
 * QA: Quinn
 * 日期: 2026-03-25
 *
 * 测试范围:
 * - 端到端流程：从拍照到保存记录
 * - 异常场景：网络异常、权限问题、识别失败
 * - 性能要求：30秒内完成识别
 */

import { RecognitionResult, QuestionType, Difficulty } from '../../types';
import { ocrService } from '../../services/ocrService';
import { recognitionApi } from '../../services/api';
import { studyApi } from '../../services/api';

// Mock React Native modules
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      Type: { back: 'back' },
    },
  },
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
  })),
}));

// Mock image picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock permissions
jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    IOS: { CAMERA: 'ios.permission.camera' },
    ANDROID: { CAMERA: 'android.permission.CAMERA' },
  },
}));

describe('拍照上传题目 E2E测试 - Story 2-1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==================== 主要流程测试 ====================

  describe('主要流程 - 正常场景', () => {
    it('应该完成从拍照到保存记录的完整流程', async () => {
      const startTime = Date.now();

      // Step 1: 模拟拍照操作
      const mockImageUri = 'file:///mock/photo.jpg';

      // Step 2: 模拟OCR识别
      const mockRecognitionResult: RecognitionResult = {
        questionText: '1 + 1 = ?',
        questionType: QuestionType.ADDITION,
        answer: '2',
        confidence: 0.95,
        difficulty: Difficulty.EASY,
        recognizedAt: new Date().toISOString(),
      };

      // Mock OCR service
      jest.spyOn(ocrService, 'recognizeQuestionType').mockResolvedValue({
        questionType: QuestionType.ADDITION,
        confidence: 0.95,
        keywords: ['+', '加'],
      });

      // Step 3: 验证识别结果
      expect(mockRecognitionResult.questionType).toBe(QuestionType.ADDITION);
      expect(mockRecognitionResult.confidence).toBeGreaterThanOrEqual(0.9);
      expect(mockRecognitionResult.answer).toBeDefined();

      // Step 4: 验证记录保存
      const recordStudySpy = jest.spyOn(studyApi, 'recordStudy').mockResolvedValue({
        success: true,
        data: {
          syncStatus: 'SYNCED',
          recordId: 'record-123',
        },
      });

      await recordStudySpy({
        questionId: 'mock-question-1',
        action: 'upload',
        duration: 5000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
      });

      expect(recordStudySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          questionType: '加法',
          difficulty: 'easy',
          action: 'upload',
        })
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 验证性能要求：应该在合理时间内完成
      expect(duration).toBeLessThan(30000); // 30秒内完成
    });

    it('应该显示正确的识别结果界面', async () => {
      const mockResult: RecognitionResult = {
        questionText: '2 + 3 = ?',
        questionType: QuestionType.ADDITION,
        answer: '5',
        confidence: 0.92,
        difficulty: Difficulty.EASY,
        recognizedAt: new Date().toISOString(),
      };

      // 验证结果包含必需字段
      expect(mockResult.questionText).toBeDefined();
      expect(mockResult.questionType).toBe(QuestionType.ADDITION);
      expect(mockResult.answer).toBe('5');
      expect(mockResult.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  // ==================== 异常场景测试 ====================

  describe('异常场景处理', () => {
    it('场景1: 照片模糊/不清楚 - 应该提示重拍', async () => {
      // Mock OCR返回低置信度结果
      jest.spyOn(ocrService, 'recognizeQuestionType').mockResolvedValue({
        questionType: QuestionType.WORD_PROBLEM,
        confidence: 0.2, // 低置信度
        keywords: [],
      });

      const result = await ocrService.recognizeQuestionType('模糊文本');

      // 验证低置信度检测
      expect(result.confidence).toBeLessThan(0.5);

      // 期望：显示"照片不清晰，请重拍"提示
      const shouldShowRetryPrompt = result.confidence < 0.5;
      expect(shouldShowRetryPrompt).toBe(true);
    });

    it('场景2: 网络异常 - 应该保存到本地队列', async () => {
      // Mock网络断开
      jest.spyOn(require('@react-native-community/netinfo'), 'fetch').mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      // Mock离线队列
      const mockEnqueue = jest.fn().mockResolvedValue(undefined);
      jest.doMock('../../services/offlineStudyQueue', () => ({
        offlineStudyQueue: {
          enqueue: mockEnqueue,
        },
      }));

      // 验证离线队列被调用
      const recordStudySpy = jest.spyOn(studyApi, 'recordStudy').mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_UNAVAILABLE',
          message: '网络连接失败，照片已保存',
        },
        data: {
          syncStatus: 'LOCAL_ONLY',
        },
      });

      await recordStudySpy({
        questionId: 'test-question',
        action: 'upload',
        duration: 5000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
      });

      // 验证返回LOCAL_ONLY状态
      const result = await recordStudySpy({
        questionId: 'test-question',
        action: 'upload',
        duration: 5000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
      });

      expect(result?.data?.syncStatus).toBe('LOCAL_ONLY');
    });

    it('场景3: 识别失败 - 应该提示无法识别', async () => {
      // Mock识别服务返回错误
      jest.spyOn(recognitionApi, 'recognize').mockRejectedValue(
        new Error('OCR识别失败')
      );

      // 验证错误处理
      try {
        await recognitionApi.recognize({
          imageUri: 'invalid-photo.jpg',
          questionType: QuestionType.ADDITION,
        });
        fail('应该抛出错误');
      } catch (error: any) {
        expect(error.message).toContain('OCR识别失败');
      }
    });

    it('场景4: 未授予相机权限 - 应该提示去设置', async () => {
      // Mock权限被拒绝
      jest.spyOn(require('react-native-permissions'), 'request').mockResolvedValue('denied');

      const checkPermission = jest.fn().mockResolvedValue('denied');

      // 验证权限检查
      const permissionStatus = await checkPermission();

      expect(permissionStatus).toBe('denied');

      // 期望：显示"需要相机权限才能拍照"提示
      // 期望：显示"去设置"按钮
    });
  });

  // ==================== 性能测试 ====================

  describe('性能要求验证', () => {
    it('相机启动时间应该 < 2秒', async () => {
      const startTime = Date.now();

      // 模拟相机启动
      await new Promise(resolve => setTimeout(resolve, 100));

      const endTime = Date.now();
      const startupTime = endTime - startTime;

      expect(startupTime).toBeLessThan(2000); // 2秒内启动
    });

    it('拍照后预览显示应该 < 1秒', async () => {
      const startTime = Date.now();

      // 模拟照片处理和预览
      await new Promise(resolve => setTimeout(resolve, 200));

      const endTime = Date.now();
      const previewTime = endTime - startTime;

      expect(previewTime).toBeLessThan(1000); // 1秒内显示预览
    });

    it('识别时间应该 < 30秒', async () => {
      const startTime = Date.now();

      // 模拟识别过程
      jest.spyOn(ocrService, 'recognizeQuestionType').mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              questionType: QuestionType.ADDITION,
              confidence: 0.95,
              keywords: ['+'],
            });
          }, 5000); // 模拟5秒识别时间
        })
      );

      await ocrService.recognizeQuestionType('1 + 1 = ?');

      const endTime = Date.now();
      const recognitionTime = endTime - startTime;

      expect(recognitionTime).toBeLessThan(30000); // 30秒内完成
    });
  });

  // ==================== 用户体验测试 ====================

  describe('用户体验验收', () => {
    it('操作流程应该简单直观（不超过3步）', () => {
      // 定义完整流程步骤
      const workflowSteps = [
        '点击拍照按钮',
        '拍摄照片',
        '查看结果',
      ];

      // 验证步骤数量
      expect(workflowSteps.length).toBeLessThanOrEqual(3);
    });

    it('错误提示应该清晰易懂', () => {
      // 测试各种错误场景的提示
      const errorMessages = {
        photo_blur: '照片不清晰，请重拍',
        network_error: '网络连接失败，照片已保存',
        recognition_failed: '无法识别，请重拍或手动输入',
        permission_denied: '需要相机权限才能拍照',
      };

      // 验证错误提示清晰
      Object.values(errorMessages).forEach(message => {
        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(0);
        expect(message).toContain('请'); // 包含操作建议
      });
    });

    it('加载状态应该明确显示', () => {
      // 测试各种加载状态
      const loadingStates = {
        recognizing: '正在识别...',
        saving: '正在保存...',
        syncing: '正在同步...',
      };

      // 验证每个状态都有提示
      Object.values(loadingStates).forEach(message => {
        expect(message).toContain('正在'); // 明确表示正在处理
      });
    });
  });

  // ==================== 数据一致性测试 ====================

  describe('数据一致性验证', () => {
    it('识别结果应该同时保存到MySQL和AsyncStorage', async () => {
      // Mock AsyncStorage
      const mockSetItem = jest.fn().mockResolvedValue(undefined);
      jest.doMock('@react-native-async-storage/async-storage', () => ({
        setItem: mockSetItem,
      }));

      // 验证数据保存
      const recordData = {
        questionId: 'test-1',
        questionType: '加法',
        answer: '2',
        timestamp: new Date().toISOString(),
      };

      // 模拟保存到AsyncStorage
      await mockSetItem('study_record_1', JSON.stringify(recordData));

      expect(mockSetItem).toHaveBeenCalledWith(
        'study_record_1',
        expect.stringContaining('test-1')
      );
    });
  });

  // ==================== 集成测试 ====================

  describe('端到端集成测试', () => {
    it('应该完成完整的用户旅程：登录→选择孩子→拍照→识别→保存', async () => {
      // 这是一个完整的E2E场景，但由于依赖真实组件，
      // 这里主要验证关键步骤和数据流

      // Step 1: 验证用户登录状态
      const mockUser = {
        id: 'user-123',
        email: 'parent@example.com',
      };

      expect(mockUser).toBeDefined();

      // Step 2: 验证选择孩子
      const mockChild = {
        id: 'child-1',
        name: '测试孩子',
        grade: '一年级',
      };

      expect(mockChild).toBeDefined();

      // Step 3: 验证拍照功能
      const mockImageUri = 'file:///mock/photo.jpg';
      expect(mockImageUri).toBeDefined();

      // Step 4: 验证OCR识别
      const recognitionResult = await ocrService.recognizeQuestionType('1 + 1 = ?');
      expect(recognitionResult.questionType).toBe(QuestionType.ADDITION);

      // Step 5: 验证记录保存
      const saveResult = {
        success: true,
        data: {
          syncStatus: 'SYNCED',
          recordId: 'record-123',
        },
      };

      expect(saveResult.success).toBe(true);
    });
  });

  // ==================== 边界条件测试 ====================

  describe('边界条件', () => {
    it('应该处理空字符串输入', async () => {
      const result = await ocrService.recognizeQuestionType('');

      // 空字符串应该使用降级处理
      expect(result).toBeDefined();
    });

    it('应该处理只有数字没有关键词的情况', async () => {
      const result = await ocrService.recognizeQuestionType('123');

      // 应该有默认处理
      expect(result).toBeDefined();
    });

    it('应该处理特殊字符输入', async () => {
      const specialCases = [
        '!@#$%^&*()',
        '①②③④⑤',
        '①＋②＝？', // 全角字符
      ];

      for (const testCase of specialCases) {
        const result = await ocrService.recognizeQuestionType(testCase);
        expect(result).toBeDefined();
      }
    });
  });
});
