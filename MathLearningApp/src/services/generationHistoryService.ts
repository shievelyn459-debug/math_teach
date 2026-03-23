/**
 * Story 5-1: 生成历史服务
 * 管理题目生成记录的本地存储和检索
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {GenerationRecord, QuestionType, Difficulty} from '../types';

const STORAGE_KEY = 'generation_history';
const MAX_RECORDS = 100; // 最大存储记录数

/**
 * 生成历史服务
 */
class GenerationHistoryService {
  /**
   * 保存生成记录
   * @param record - 生成记录
   */
  async saveGeneration(record: GenerationRecord): Promise<void> {
    try {
      const histories = await this.getAllGenerations();

      // 添加新记录到开头
      histories.unshift(record);

      // 限制最大记录数
      if (histories.length > MAX_RECORDS) {
        histories.splice(MAX_RECORDS);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
    } catch (error) {
      console.error('Failed to save generation:', error);
      throw error;
    }
  }

  /**
   * 获取所有生成记录
   * @returns 所有生成记录（按时间倒序）
   */
  async getAllGenerations(): Promise<GenerationRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }

      const records: GenerationRecord[] = JSON.parse(data);

      // 按时间戳倒序排序（最新的在前）
      return records.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get generations:', error);
      return [];
    }
  }

  /**
   * 获取最近的生成记录
   * @param limit - 返回记录数量限制
   * @returns 最近的生成记录
   */
  async getRecentGenerations(limit: number = 5): Promise<GenerationRecord[]> {
    try {
      // PATCH-011: 验证 limit 参数边界
      const MAX_RECORDS = 1000; // 合理上限
      const safeLimit = Math.max(0, Math.min(limit || 5, MAX_RECORDS));

      const histories = await this.getAllGenerations();
      return histories.slice(0, safeLimit);
    } catch (error) {
      console.error('Failed to get recent generations:', error);
      return [];
    }
  }

  /**
   * 根据ID获取生成记录
   * @param id - 生成记录ID
   * @returns 生成记录，如果不存在则返回null
   */
  async getGenerationById(id: string): Promise<GenerationRecord | null> {
    try {
      const histories = await this.getAllGenerations();
      return histories.find(record => record.id === id) || null;
    } catch (error) {
      console.error('Failed to get generation by id:', error);
      return null;
    }
  }

  /**
   * 按题目类型筛选生成记录
   * @param questionType - 题目类型
   * @returns 匹配的生成记录
   */
  async getGenerationsByType(questionType: QuestionType): Promise<GenerationRecord[]> {
    try {
      const histories = await this.getAllGenerations();
      return histories.filter(record => record.questionType === questionType);
    } catch (error) {
      console.error('Failed to get generations by type:', error);
      return [];
    }
  }

  /**
   * 按难度筛选生成记录
   * @param difficulty - 难度级别
   * @returns 匹配的生成记录
   */
  async getGenerationsByDifficulty(difficulty: Difficulty): Promise<GenerationRecord[]> {
    try {
      const histories = await this.getAllGenerations();
      return histories.filter(record => record.difficulty === difficulty);
    } catch (error) {
      console.error('Failed to get generations by difficulty:', error);
      return [];
    }
  }

  /**
   * 删除指定的生成记录
   * @param id - 生成记录ID
   */
  async deleteGeneration(id: string): Promise<void> {
    try {
      const histories = await this.getAllGenerations();
      const filtered = histories.filter(record => record.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete generation:', error);
      throw error;
    }
  }

  /**
   * 清除所有生成记录
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear generations:', error);
      throw error;
    }
  }

  /**
   * 获取生成统计信息
   * @returns 统计信息对象
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<QuestionType, number>;
    byDifficulty: Record<Difficulty, number>;
  }> {
    try {
      const histories = await this.getAllGenerations();

      const stats = {
        total: histories.length,
        byType: {
          [QuestionType.ADDITION]: 0,
          [QuestionType.SUBTRACTION]: 0,
          [QuestionType.WORD_PROBLEM]: 0,
        } as Record<QuestionType, number>,
        byDifficulty: {
          [Difficulty.EASY]: 0,
          [Difficulty.MEDIUM]: 0,
          [Difficulty.HARD]: 0,
        } as Record<Difficulty, number>,
      };

      for (const record of histories) {
        // PATCH-009: 验证枚举值有效性
        if (record.questionType in stats.byType) {
          stats.byType[record.questionType]++;
        }
        if (record.difficulty in stats.byDifficulty) {
          stats.byDifficulty[record.difficulty]++;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        total: 0,
        byType: {
          [QuestionType.ADDITION]: 0,
          [QuestionType.SUBTRACTION]: 0,
          [QuestionType.WORD_PROBLEM]: 0,
        },
        byDifficulty: {
          [Difficulty.EASY]: 0,
          [Difficulty.MEDIUM]: 0,
          [Difficulty.HARD]: 0,
        },
      };
    }
  }
}

// 导出单例实例
export const generationHistoryService = new GenerationHistoryService();

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
