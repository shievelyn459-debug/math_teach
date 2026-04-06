/**
 * 儿童管理流程集成测试
 * Story 8-4: API集成测试
 * AC1: 关键API调用流程的集成测试覆盖
 *
 * 测试范围:
 * - 创建儿童
 * - 更新儿童信息
 * - 获取儿童列表
 * - 删除儿童
 */

import { childApi } from '../../../services/childApi';
import { TestDataFactory, TestDataCleaner } from '../setup/testData';
import { Grade } from '../../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock MySQL相关
jest.mock('../../../services/mysql/prismaClient', () => ({
  checkDatabaseConnection: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('../../../services/mysql', () => ({
  childDataRepository: {
    findByParentId: jest.fn(() => Promise.resolve([])),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock userApi
jest.mock('../../../services/userApi', () => ({
  getCurrentUserId: jest.fn(() => Promise.resolve('test-user-1')),
}));

describe('Child Management Flow Integration Tests', () => {
  let testUser: any;
  let testChild1: any;

  beforeAll(async () => {
    console.log('👶 Setting up child management integration tests...');
    testUser = TestDataFactory.createUser();
    testChild1 = TestDataFactory.createChild({ parentId: testUser.id });
  });

  afterAll(async () => {
    await TestDataCleaner.cleanAll();
    console.log('🧹 Cleaned up test data');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC1.1: Create Child Flow', () => {
    it('should successfully create a child profile', async () => {
      // Arrange
      const newChildData = {
        name: '新小朋友',
        grade: Grade.GRADE_2,
        birthday: new Date('2017-06-10'),
      };

      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const result = await childApi.addChild(newChildData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(newChildData.name);
    });

    it('should validate required name field', async () => {
      // Arrange
      const invalidChildData = {
        name: '',
        grade: Grade.GRADE_1,
        birthday: new Date('2018-01-01'),
      };

      // Act
      const result = await childApi.addChild(invalidChildData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should validate grade value', async () => {
      // Arrange
      const invalidGradeData = {
        name: 'Test Child',
        grade: 'INVALID_GRADE' as any,
        birthday: new Date('2018-01-01'),
      };

      // Act
      const result = await childApi.addChild(invalidGradeData);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('AC1.2: Update Child Info Flow', () => {
    it('should successfully update child name', async () => {
      // Arrange
      const updateData = { name: '更新后的名字' };
      const existingChild = TestDataFactory.createChild();

      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([existingChild]));
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const result = await childApi.updateChild(existingChild.id, updateData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject update to non-existent child', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

      // Act
      const result = await childApi.updateChild('non-existent-id', {
        name: 'Test',
      });

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('AC1.3: Get Children Flow', () => {
    it('should retrieve all children for user', async () => {
      // Arrange
      const mockChildren = [
        TestDataFactory.createChild({ id: 'child-1' }),
        TestDataFactory.createChild({ id: 'child-2' }),
      ];

      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // 设置 mock 返回值（不清除其他 mock）
      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key.includes('version')) {
          return Promise.resolve('1');
        }
        return Promise.resolve(JSON.stringify(mockChildren));
      });

      // Act
      const result = await childApi.getChildren();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
    });

    it('should return empty array when no children exist', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // 模拟 readCache 返回 null（缓存未命中）
      // 然后数据库连接检查返回 false，降级到 AsyncStorage
      // 降级路径再次读取 AsyncStorage
      let callCount = 0;
      AsyncStorage.getItem.mockImplementation((key: string) => {
        callCount++;
        // readCache 需要两个调用（数据和版本号）
        // 如果第一个调用返回 null，readCache 直接返回 null
        if (callCount === 1) {
          return Promise.resolve(null); // readCache 数据 - 缓存未命中
        }
        // 后续调用是降级路径
        return Promise.resolve(null);
      });

      // Act
      const result = await childApi.getChildren();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle corrupted data gracefully', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // 模拟损坏的数据 - readCache 会返回 null（因为安全解析失败）
      // 然后 getChildren 会继续检查数据库和降级
      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key.includes('version')) {
          return Promise.resolve('1'); // 版本号匹配
        }
        return Promise.resolve('invalid json'); // 损坏的数据
      });

      // Act
      const result = await childApi.getChildren();

      // Assert - 损坏的数据会被安全解析，返回空数组或成功
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('AC1.4: Delete Child Flow', () => {
    it('should successfully delete child profile', async () => {
      // Arrange
      const existingChild = TestDataFactory.createChild();
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([existingChild]));
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const result = await childApi.deleteChild(existingChild.id);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject deletion of non-existent child', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

      // Act
      const result = await childApi.deleteChild('non-existent-id');

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('AC1.5: Error Handling', () => {
    it('should handle network failure gracefully', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Network error'));

      // Act
      const result = await childApi.getChildren();

      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle storage errors gracefully', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));

      // Act
      const result = await childApi.addChild({
        name: 'Test Child',
        grade: Grade.GRADE_1,
        birthday: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('AC1.6: Performance Validation', () => {
    it('should complete getChildren within acceptable time', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify([testChild1])
      );

      // Act
      const startTime = Date.now();
      await childApi.getChildren();
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(2000);
    });

    it('should complete addChild within acceptable time', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      AsyncStorage.setItem.mockResolvedValueOnce(undefined);

      // Act
      const startTime = Date.now();
      await childApi.addChild({
        name: 'Performance Test',
        grade: Grade.GRADE_1,
        birthday: new Date(),
      });
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(2000);
    });
  });
});
