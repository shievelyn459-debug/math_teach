/**
 * 测试数据工厂
 * Story 8-4: 集成测试补充
 */

import { Child, Grade, User, Question } from '../../../types';

// 测试用户数据
export const testUsers = {
  user1: {
    id: 'test-user-1',
    email: 'test1@example.com',
    name: 'Test User 1',
    password: 'Test123!@#',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as User,

  user2: {
    id: 'test-user-2',
    email: 'test2@example.com',
    name: 'Test User 2',
    password: 'Test456!@#',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  } as User,
};

// 测试儿童数据
export const testChildren = {
  child1: {
    id: 'test-child-1',
    parentId: 'test-user-1',
    name: '小明',
    grade: Grade.GRADE_3,
    birthday: new Date('2016-05-15'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as Child,

  child2: {
    id: 'test-child-2',
    parentId: 'test-user-1',
    name: '小红',
    grade: Grade.GRADE_1,
    birthday: new Date('2018-08-20'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as Child,
};

// 测试题目数据
export const testQuestions = {
  question1: {
    id: 'test-question-1',
    childId: 'test-child-1',
    type: 'ADDITION',
    difficulty: 'EASY',
    content: '3 + 5 = ?',
    answer: '8',
    options: ['6', '7', '8', '9'],
    createdAt: new Date('2026-01-01'),
  } as Question,

  question2: {
    id: 'test-question-2',
    childId: 'test-child-1',
    type: 'SUBTRACTION',
    difficulty: 'MEDIUM',
    content: '15 - 7 = ?',
    answer: '8',
    options: ['6', '7', '8', '9'],
    createdAt: new Date('2026-01-02'),
  } as Question,
};

// 测试OCR结果
export const testOcrResults = {
  addition: {
    text: '3 + 5 = ?',
    confidence: 0.95,
    type: 'ADDITION',
  },

  subtraction: {
    text: '15 - 7 = ?',
    confidence: 0.92,
    type: 'SUBTRACTION',
  },
};

// 测试AI响应
export const testAiResponses = {
  generatedQuestion: {
    content: '7 + 6 = ?',
    answer: '13',
    explanation: '7 + 6 = 13',
    difficulty: 'EASY',
  },

  knowledgeExplanation: {
    title: '加法运算',
    content: '加法是数学中最基本的运算之一...',
    examples: ['3 + 2 = 5', '5 + 4 = 9'],
    format: 'TEXT',
  },
};

// 数据工厂函数
export class TestDataFactory {
  /**
   * 创建测试用户
   */
  static createUser(overrides?: Partial<User>): User {
    return {
      ...testUsers.user1,
      ...overrides,
    };
  }

  /**
   * 创建测试儿童
   */
  static createChild(overrides?: Partial<Child>): Child {
    return {
      ...testChildren.child1,
      ...overrides,
    };
  }

  /**
   * 创建测试题目
   */
  static createQuestion(overrides?: Partial<Question>): Question {
    return {
      ...testQuestions.question1,
      ...overrides,
    };
  }

  /**
   * 批量创建测试数据
   */
  static createTestDataSet() {
    return {
      users: [testUsers.user1, testUsers.user2],
      children: [testChildren.child1, testChildren.child2],
      questions: [testQuestions.question1, testQuestions.question2],
    };
  }
}

// 测试数据清理函数
export class TestDataCleaner {
  /**
   * 清理所有测试数据
   */
  static async cleanAll() {
    // TODO: 实现数据库清理逻辑
    console.log('🧹 Cleaning all test data...');
  }

  /**
   * 清理特定用户数据
   */
  static async cleanUser(userId: string) {
    // TODO: 实现用户数据清理逻辑
    console.log(`🧹 Cleaning data for user: ${userId}`);
  }
}
