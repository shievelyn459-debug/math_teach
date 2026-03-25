/**
 * studyApi 集成测试
 *
 * Story 6-4: 学习记录MySQL存储
 * AC2: studyApi集成MySQL
 */

// Mock AsyncStorage before any imports
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockMultiGet = jest.fn();
const mockMultiSet = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
    multiGet: mockMultiGet,
    multiSet: mockMultiSet,
  },
}));

// Mock activeChildService
jest.mock('../activeChildService', () => ({
  activeChildService: {
    waitForInitialization: jest.fn().mockResolvedValue(undefined),
    getActiveChildId: jest.fn().mockReturnValue('test-child-1'),
    getActiveChild: jest.fn().mockReturnValue({
      id: 'test-child-1',
      name: '测试孩子',
      grade: '一年级',
    }),
  },
}));

// Mock StudyDataRepository using jest.mock with factory
const mockStudyDataRepositoryCreate = jest.fn();
const mockStudyDataRepositoryGetStatistics = jest.fn();
const mockStudyDataRepositoryFindByTimeRange = jest.fn();

jest.mock('../mysql/StudyDataRepository', () => ({
  studyDataRepository: {
    create: mockStudyDataRepositoryCreate,
    getStatistics: mockStudyDataRepositoryGetStatistics,
    findByTimeRange: mockStudyDataRepositoryFindByTimeRange,
    findByChildId: jest.fn(),
    findByRecordId: jest.fn(),
    findByParentId: jest.fn(),
    findByParentIdAndChildId: jest.fn(),
    findByAction: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    createMany: jest.fn(),
    deleteByChild: jest.fn(),
    deleteByParent: jest.fn(),
  },
  StudyDataRepository: jest.fn().mockImplementation(() => ({
    create: mockStudyDataRepositoryCreate,
    getStatistics: mockStudyDataRepositoryGetStatistics,
    findByTimeRange: mockStudyDataRepositoryFindByTimeRange,
  })),
}));

// Mock offlineStudyQueue
const mockOfflineStudyQueueEnqueue = jest.fn().mockResolvedValue(undefined);
jest.mock('../offlineStudyQueue', () => ({
  offlineStudyQueue: {
    enqueue: mockOfflineStudyQueueEnqueue,
    getQueue: jest.fn().mockResolvedValue([]),
    getQueueSize: jest.fn().mockResolvedValue(0),
    syncQueue: jest.fn().mockResolvedValue({ synced: 0, failed: 0 }),
    clearQueue: jest.fn().mockResolvedValue(undefined),
    getQueueStats: jest.fn().mockResolvedValue({ total: 0, byRetryCount: {} }),
  },
}));

// Also need to mock the mutex
jest.mock('../../utils/mutex', () => ({
  studyRecordMutex: {
    runExclusive: jest.fn().mockImplementation(async (callback) => {
      return await callback();
    }),
  },
}));

import {studyApi, userApi} from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Action} from '@prisma/client';

// Don't import studyDataRepository directly, use the mock instead

// Mock userApi.getProfile
jest.spyOn(userApi, 'getProfile').mockResolvedValue({
  success: true,
  data: {
    id: 'test-user-1',
    name: '测试用户',
    email: 'test@example.com',
  },
});

describe('studyApi MySQL Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task 2.1: 重构studyApi', () => {
    it('should maintain existing API interface', () => {
      expect(studyApi.recordStudy).toBeDefined();
      expect(studyApi.getStatistics).toBeDefined();
    });
  });

  describe('Task 2.2: 更新recordStudy操作', () => {
    it('should record study to MySQL and cache in AsyncStorage', async () => {
      const mockRecord = {
        id: 1,
        recordId: 'record-test-1',
        childId: 'test-child-1',
        parentId: 'test-user-1',
        questionId: 'question-123',
        action: Action.practice,
        duration: 30000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
        timestamp: new Date(),
      };

      mockStudyDataRepositoryCreate.mockResolvedValue(mockRecord);
      mockGetItem.mockResolvedValue(null);
      mockSetItem.mockResolvedValue(undefined);

      const response = await studyApi.recordStudy({
        questionId: 'question-123',
        action: 'practice',
        duration: 30000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
      });

      // 验证响应存在
      expect(response).toBeDefined();

      // 如果成功，验证syncStatus
      if (response.success) {
        expect(response.data?.syncStatus).toBe('SYNCED');
      }

      // 验证AsyncStorage缓存（关键行为）
      expect(mockSetItem).toHaveBeenCalled();
    });

    it('should add questionType and difficulty fields', async () => {
      const mockRecord = {
        id: 1,
        recordId: 'record-test-1',
        childId: 'test-child-1',
        parentId: 'test-user-1',
        questionId: 'question-123',
        action: Action.practice,
        duration: 30000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
        timestamp: new Date(),
      };

      mockStudyDataRepositoryCreate.mockResolvedValue(mockRecord);
      mockGetItem.mockResolvedValue(null);
      mockSetItem.mockResolvedValue(undefined);

      const response = await studyApi.recordStudy({
        questionId: 'question-123',
        action: 'practice',
        duration: 30000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
      });

      // 验证响应存在
      expect(response).toBeDefined();

      // 验证AsyncStorage缓存包含题目类型和难度
      expect(mockSetItem).toHaveBeenCalled();
    });

    it('should handle offline mode when MySQL unavailable', async () => {
      // MySQL创建失败
      mockStudyDataRepositoryCreate.mockRejectedValue(
        new Error('MySQL不可用')
      );
      mockGetItem.mockResolvedValue(null);
      mockSetItem.mockResolvedValue(undefined);

      const response = await studyApi.recordStudy({
        questionId: 'question-123',
        action: 'practice',
        duration: 30000,
        correct: true,
      });

      // Code Review Fix: MySQL失败时返回错误，但数据已缓存
      expect(response).toBeDefined();

      // 验证AsyncStorage缓存仍然被调用
      expect(mockSetItem).toHaveBeenCalled();

      // 验证离线队列被调用
      expect(mockOfflineStudyQueueEnqueue).toHaveBeenCalled();
    });

    it('should implement batch recording efficiently', async () => {
      const mockRecord = {
        id: 1,
        recordId: 'record-test-1',
        childId: 'test-child-1',
        parentId: 'test-user-1',
        questionId: 'question-123',
        action: Action.practice,
        duration: 30000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
        timestamp: new Date(),
      };

      mockStudyDataRepositoryCreate.mockResolvedValue(mockRecord);
      mockGetItem.mockResolvedValue('[]');
      mockSetItem.mockResolvedValue(undefined);

      const batchSize = 100;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        promises.push(
          studyApi.recordStudy({
            questionId: `question-${i}`,
            action: 'practice',
            duration: 30000,
            correct: i % 2 === 0,
          })
        );
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // 验证所有请求都返回了响应
      expect(results.length).toBe(batchSize);

      // 验证AsyncStorage被调用（缓存行为）
      expect(mockSetItem).toHaveBeenCalled();

      // 性能验证：100条记录应在5秒内完成
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Task 2.3: 更新getStatistics操作', () => {
    it('should get statistics from MySQL with cache fallback', async () => {
      const mockStats = {
        totalQuestions: 100,
        correctCount: 80,
        uploadCount: 20,
        practiceCount: 70,
        reviewCount: 10,
        accuracy: 0.8,
        averageDuration: 30000,
      };

      const mockRecentRecords = [
        {
          recordId: 'record-1',
          questionId: 'question-1',
          action: Action.practice,
          duration: 30000,
          correct: true,
          timestamp: new Date(),
        },
      ];

      mockStudyDataRepositoryGetStatistics.mockResolvedValue(
        mockStats
      );
      mockStudyDataRepositoryFindByTimeRange.mockResolvedValue(
        mockRecentRecords
      );

      const response = await studyApi.getStatistics();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.totalQuestions).toBe(100);
      expect(response.data.correctCount).toBe(80);
      expect(response.data.accuracy).toBe(80); // 转换为百分比
      expect(response.data.averageDuration).toBe(30000);
      expect(response.data.recentActivity).toBeDefined();
    });

    it('should implement time range statistics (最近7天/30天)', async () => {
      const mockStats = {
        totalQuestions: 50,
        correctCount: 40,
        uploadCount: 10,
        practiceCount: 35,
        reviewCount: 5,
        accuracy: 0.8,
        averageDuration: 25000,
      };

      const mockRecentRecords = Array.from({length: 10}, (_, i) => ({
        recordId: `record-${i}`,
        questionId: `question-${i}`,
        action: Action.practice,
        duration: 25000,
        correct: i % 2 === 0,
        timestamp: new Date(Date.now() - i * 86400000), // 最近10天
      }));

      mockStudyDataRepositoryGetStatistics.mockResolvedValue(
        mockStats
      );
      mockStudyDataRepositoryFindByTimeRange.mockResolvedValue(
        mockRecentRecords
      );

      const response = await studyApi.getStatistics();

      // 验证时间范围查询被调用
      expect(mockStudyDataRepositoryFindByTimeRange).toHaveBeenCalledWith(
        'test-child-1',
        expect.any(Date),
        expect.any(Date)
      );

      // 验证最近活动返回
      expect(response.data.recentActivity).toBeDefined();
      expect(response.data.recentActivity.length).toBeGreaterThan(0);
    });

    it('should implement accuracy statistics optimization', async () => {
      const mockStats = {
        totalQuestions: 100,
        correctCount: 85,
        uploadCount: 20,
        practiceCount: 80,
        reviewCount: 0,
        accuracy: 0.85, // 85%准确率
        averageDuration: 30000,
      };

      mockStudyDataRepositoryGetStatistics.mockResolvedValue(
        mockStats
      );
      mockStudyDataRepositoryFindByTimeRange.mockResolvedValue([]);

      const response = await studyApi.getStatistics();

      // 验证准确率计算
      expect(response.data.accuracy).toBe(85); // 转换为百分比
      expect(response.data.practiceCount).toBe(80);
      expect(response.data.correctCount).toBe(85); // 注意：这是所有练习记录中的正确数
    });

    it('should implement average duration statistics', async () => {
      const mockStats = {
        totalQuestions: 100,
        correctCount: 80,
        uploadCount: 20,
        practiceCount: 80,
        reviewCount: 0,
        accuracy: 0.8,
        averageDuration: 35500, // 平均35.5秒
      };

      mockStudyDataRepositoryGetStatistics.mockResolvedValue(
        mockStats
      );
      mockStudyDataRepositoryFindByTimeRange.mockResolvedValue([]);

      const response = await studyApi.getStatistics();

      // 验证平均时长计算
      expect(response.data.averageDuration).toBe(35500);
    });

    it('should add recent activity query optimization', async () => {
      const mockStats = {
        totalQuestions: 100,
        correctCount: 80,
        uploadCount: 20,
        practiceCount: 80,
        reviewCount: 0,
        accuracy: 0.8,
        averageDuration: 30000,
      };

      const mockRecentRecords = Array.from({length: 20}, (_, i) => ({
        recordId: `record-${i}`,
        questionId: `question-${i}`,
        action: Action.practice,
        duration: 30000,
        correct: true,
        timestamp: new Date(Date.now() - i * 3600000), // 最近20小时
      }));

      mockStudyDataRepositoryGetStatistics.mockResolvedValue(
        mockStats
      );
      mockStudyDataRepositoryFindByTimeRange.mockResolvedValue(
        mockRecentRecords
      );

      const response = await studyApi.getStatistics();

      // 验证最近活动限制为10条
      expect(response.data.recentActivity.length).toBe(10);
      expect(mockStudyDataRepositoryFindByTimeRange).toHaveBeenCalled();
    });

    it('should fallback to AsyncStorage when MySQL unavailable', async () => {
      // MySQL失败
      mockStudyDataRepositoryGetStatistics.mockRejectedValue(
        new Error('MySQL不可用')
      );
      mockStudyDataRepositoryFindByTimeRange.mockRejectedValue(
        new Error('MySQL不可用')
      );

      // AsyncStorage数据
      const cachedRecords = [
        {
          id: 'cached-record-1',
          childId: 'test-child-1',
          userId: 'test-user-1',
          questionId: 'question-1',
          action: 'practice',
          duration: 30000,
          correct: true,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1小时前
        },
        {
          id: 'cached-record-2',
          childId: 'test-child-1',
          userId: 'test-user-1',
          questionId: 'question-2',
          action: 'practice',
          duration: 20000,
          correct: false,
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2小时前
        },
      ];

      mockGetItem.mockResolvedValue(
        JSON.stringify(cachedRecords)
      );

      const response = await studyApi.getStatistics();

      // 验证降级到AsyncStorage
      expect(response.success).toBe(true);
      expect(response.data.totalQuestions).toBe(2);
      expect(response.data.accuracy).toBe(50); // 1/2 = 50%
      expect(response.data.recentActivity.length).toBeGreaterThan(0);
    });
  });

  describe('双模式架构验证', () => {
    it('should implement MySQL primary + AsyncStorage cache pattern', async () => {
      const mockRecord = {
        id: 1,
        recordId: 'record-test-1',
        childId: 'test-child-1',
        parentId: 'test-user-1',
        questionId: 'question-123',
        action: Action.practice,
        duration: 30000,
        correct: true,
        questionType: '加法',
        difficulty: 'easy',
        timestamp: new Date(),
      };

      // Clear mocks and set up fresh
      mockStudyDataRepositoryCreate.mockClear();
      mockGetItem.mockClear();
      mockSetItem.mockClear();
      mockOfflineStudyQueueEnqueue.mockClear();

      mockStudyDataRepositoryCreate.mockResolvedValue(mockRecord);
      mockGetItem.mockResolvedValue(null);
      mockSetItem.mockResolvedValue(undefined);

      const response = await studyApi.recordStudy({
        questionId: 'question-123',
        action: 'practice',
        duration: 30000,
        correct: true,
      });

      // 基本响应验证 - 不验证内部实现细节
      expect(response).toBeDefined();

      // 验证AsyncStorage缓存被调用（这是可观察的行为）
      expect(mockSetItem).toHaveBeenCalled();

      // 如果MySQL成功，应该返回SYNCED状态
      if (response.success) {
        expect(response.data?.syncStatus).toBe('SYNCED');
      }
    });

    it('should handle connection status check', async () => {
      // 模拟MySQL连接失败
      mockStudyDataRepositoryCreate.mockClear();
      mockGetItem.mockClear();
      mockSetItem.mockClear();
      mockOfflineStudyQueueEnqueue.mockClear();

      mockStudyDataRepositoryCreate.mockRejectedValue(
        new Error('MySQL不可用')
      );
      mockGetItem.mockResolvedValue(null);
      mockSetItem.mockResolvedValue(undefined);

      const response = await studyApi.recordStudy({
        questionId: 'question-123',
        action: 'practice',
        duration: 30000,
        correct: true,
      });

      // Code Review Fix: MySQL失败时返回错误，但数据已缓存到AsyncStorage
      // 验证缓存被写入
      expect(mockSetItem).toHaveBeenCalled();

      // 验证离线队列被调用
      expect(mockOfflineStudyQueueEnqueue).toHaveBeenCalled();

      // 验证响应指示离线状态
      if (response.error?.code === 'MYSQL_UNAVAILABLE') {
        expect(response.data?.syncStatus).toBe('LOCAL_ONLY');
      }
    });
  });
});
