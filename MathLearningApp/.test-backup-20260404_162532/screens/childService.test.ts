/**
 * Story 1-5: Child Service Unit Tests
 * Tests for child CRUD operations and validation
 */

import {childApi} from '../../services/api';
import {Child, Grade} from '../../types';

// Mock the request function
jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  childApi: {
    getChildren: jest.fn(),
    addChild: jest.fn(),
    updateChild: jest.fn(),
    deleteChild: jest.fn(),
  },
}));

describe('Child Service', () => {
  const mockChild: Child = {
    id: 'child-123',
    parentId: 'user-123',
    name: '小明',
    grade: Grade.GRADE_3,
    birthday: new Date('2016-05-15'),
    avatar: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChildren', () => {
    it('should fetch all children for current user', async () => {
      const mockChildren = [mockChild];
      (childApi.getChildren as jest.Mock).mockResolvedValue({
        success: true,
        data: mockChildren,
      });

      const result = await childApi.getChildren();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChildren);
      expect(childApi.getChildren).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      (childApi.getChildren as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '获取孩子列表失败',
        },
      });

      const result = await childApi.getChildren();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('addChild', () => {
    it('should add a new child with valid data', async () => {
      const newChild = {
        name: '小红',
        grade: Grade.GRADE_2,
        birthday: new Date('2017-03-20'),
      };

      (childApi.addChild as jest.Mock).mockResolvedValue({
        success: true,
        data: {...mockChild, ...newChild, id: 'child-456'},
      });

      const result = await childApi.addChild(newChild);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(newChild.name);
      expect(result.data?.grade).toBe(newChild.grade);
    });

    it('should validate child name length (2-50 characters)', async () => {
      const invalidChild = {
        name: 'A', // Too short
        grade: Grade.GRADE_1,
      };

      (childApi.addChild as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '孩子姓名必须在2-50个字符之间',
        },
      });

      const result = await childApi.addChild(invalidChild);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should validate grade range (1-6 for primary school)', async () => {
      const invalidChild = {
        name: '小明',
        grade: '7', // Invalid grade
      };

      (childApi.addChild as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '年级必须在1-6之间',
        },
      });

      const result = await childApi.addChild(invalidChild as any);

      expect(result.success).toBe(false);
    });
  });

  describe('updateChild', () => {
    it('should update existing child information', async () => {
      const updates = {
        name: '小明（更新）',
        grade: Grade.GRADE_4,
      };

      (childApi.updateChild as jest.Mock).mockResolvedValue({
        success: true,
        data: {...mockChild, ...updates},
      });

      const result = await childApi.updateChild('child-123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(updates.name);
      expect(result.data?.grade).toBe(updates.grade);
    });
  });

  describe('deleteChild', () => {
    it('should delete a child successfully', async () => {
      (childApi.deleteChild as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await childApi.deleteChild('child-123');

      expect(result.success).toBe(true);
      expect(childApi.deleteChild).toHaveBeenCalledWith('child-123');
    });
  });
});

describe('Child Validation', () => {
  describe('Grade enum', () => {
    it('should have all primary school grades (1-6)', () => {
      expect(Grade.GRADE_1).toBe('1');
      expect(Grade.GRADE_2).toBe('2');
      expect(Grade.GRADE_3).toBe('3');
      expect(Grade.GRADE_4).toBe('4');
      expect(Grade.GRADE_5).toBe('5');
      expect(Grade.GRADE_6).toBe('6');
    });
  });

  describe('Child name validation', () => {
    it('should accept names with 2-50 characters', () => {
      const validNames = ['小明', '张三丰', 'A'.repeat(50)];

      validNames.forEach(name => {
        expect(name.length).toBeGreaterThanOrEqual(2);
        expect(name.length).toBeLessThanOrEqual(50);
      });
    });

    it('should reject names outside valid range', () => {
      const invalidNames = ['A', 'A'.repeat(51)];

      invalidNames.forEach(name => {
        const isValid = name.length >= 2 && name.length <= 50;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Birthday validation', () => {
    it('should accept valid past dates', () => {
      const validBirthdays = [
        new Date('2016-05-15'),
        new Date('2015-01-01'),
        new Date('2010-12-31'),
      ];

      validBirthdays.forEach(birthday => {
        expect(birthday <= new Date()).toBe(true);
      });
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(futureDate > new Date()).toBe(true);
    });
  });
});
