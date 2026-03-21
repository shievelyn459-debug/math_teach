import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionType, Difficulty } from '../types';

const PREFERENCES_KEY = '@math_learning_preferences';
const CORRECTION_HISTORY_KEY = '@math_learning_correction_history';
const DIFFICULTY_PREFERENCES_KEY = '@math_learning_difficulty_preferences';

// 用于序列化的内部类型（Date存储为ISO字符串）
interface UserPreferencesSerialized {
  questionTypeCorrections: {
    [key: string]: {
      originalType: QuestionType;
      correctedType: QuestionType;
      count: number;
      lastCorrected: string; // ISO字符串
    };
  };
}

interface CorrectionHistoryItemSerialized {
  id: string;
  originalType: QuestionType;
  correctedType: QuestionType;
  imageUri: string;
  timestamp: string; // ISO字符串
}

interface DifficultyPreferenceSerialized {
  questionType: string;
  difficulty: string;
  gradeLevel: number;
  lastSelected: string; // ISO字符串
  selectionCount: number;
}

export interface UserPreferences {
  questionTypeCorrections: {
    [key: string]: {
      originalType: QuestionType;
      correctedType: QuestionType;
      count: number;
      lastCorrected: Date;
    };
  };
}

export interface DifficultyPreference {
  questionType: QuestionType;
  difficulty: Difficulty;
  gradeLevel: number;
  lastSelected: Date;
  selectionCount: number;
}

export interface CorrectionHistoryItem {
  id: string;
  originalType: QuestionType;
  correctedType: QuestionType;
  imageUri: string;
  timestamp: Date;
}

// 操作队列用于避免竞态条件
type Operation = () => Promise<void>;
class OperationQueue {
  private queue: Operation[] = [];
  private isProcessing = false;

  async enqueue(operation: Operation): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const operation = this.queue.shift();

    if (operation) {
      try {
        await operation();
      } catch (error) {
        console.error('Operation queue error:', error);
      }
    }

    this.isProcessing = false;
    this.process();
  }
}

class PreferencesService {
  private operationQueue = new OperationQueue();

  // 获取用户偏好
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const preferencesJson = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (preferencesJson) {
        const parsed: UserPreferencesSerialized = JSON.parse(preferencesJson);
        // 将ISO字符串转换回Date对象
        const preferences: UserPreferences = {
          questionTypeCorrections: {}
        };
        for (const key in parsed.questionTypeCorrections) {
          const correction = parsed.questionTypeCorrections[key];
          preferences.questionTypeCorrections[key] = {
            ...correction,
            lastCorrected: new Date(correction.lastCorrected)
          };
        }
        return preferences;
      }
      return {
        questionTypeCorrections: {},
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        questionTypeCorrections: {},
      };
    }
  }

  // 更新用户偏好
  async updateUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      // 将Date对象转换为ISO字符串进行序列化
      const serialized: UserPreferencesSerialized = {
        questionTypeCorrections: {}
      };
      for (const key in preferences.questionTypeCorrections) {
        const correction = preferences.questionTypeCorrections[key];
        serialized.questionTypeCorrections[key] = {
          ...correction,
          lastCorrected: correction.lastCorrected.toISOString()
        };
      }
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  // 记录手动纠正（使用操作队列避免竞态条件）
  async recordCorrection(
    originalType: QuestionType,
    correctedType: QuestionType,
    imageUri: string
  ): Promise<void> {
    return this.operationQueue.enqueue(async () => {
      try {
        // 更新纠正统计
        const preferences = await this.getUserPreferences();
        const key = `${originalType}_${correctedType}`;

        if (!preferences.questionTypeCorrections[key]) {
          preferences.questionTypeCorrections[key] = {
            originalType,
            correctedType,
            count: 0,
            lastCorrected: new Date(),
          };
        }

        preferences.questionTypeCorrections[key].count += 1;
        preferences.questionTypeCorrections[key].lastCorrected = new Date();

        await this.updateUserPreferences(preferences);

        // 添加到历史记录
        const history = await this.getCorrectionHistory();
        const historyItem: CorrectionHistoryItem = {
          id: Date.now().toString(),
          originalType,
          correctedType,
          imageUri,
          timestamp: new Date(),
        };

        history.unshift(historyItem);
        // 只保留最近100条记录
        if (history.length > 100) {
          history.pop();
        }

        // 序列化历史记录（Date转换为ISO字符串）
        const serializedHistory: CorrectionHistoryItemSerialized[] = history.map(item => ({
          ...item,
          timestamp: item.timestamp.toISOString()
        }));
        await AsyncStorage.setItem(CORRECTION_HISTORY_KEY, JSON.stringify(serializedHistory));
      } catch (error) {
        console.error('Failed to record correction:', error);
        throw error;
      }
    });
  }

  // 获取纠正历史
  async getCorrectionHistory(): Promise<CorrectionHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(CORRECTION_HISTORY_KEY);
      if (historyJson) {
        const parsed: CorrectionHistoryItemSerialized[] = JSON.parse(historyJson);
        // 将ISO字符串转换回Date对象
        return parsed.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get correction history:', error);
      return [];
    }
  }

  // 根据历史纠正建议题目类型
  async suggestQuestionType(originalType: QuestionType): Promise<QuestionType | null> {
    try {
      const preferences = await this.getUserPreferences();

      // 查找该原始类型最常见的纠正
      let mostCommonCorrection: {
        correctedType: QuestionType;
        count: number;
      } | null = null;

      for (const key in preferences.questionTypeCorrections) {
        const correction = preferences.questionTypeCorrections[key];
        if (correction.originalType === originalType) {
          if (!mostCommonCorrection || correction.count > mostCommonCorrection.count) {
            mostCommonCorrection = {
              correctedType: correction.correctedType,
              count: correction.count,
            };
          }
        }
      }

      // 如果纠正次数超过3次，返回建议的类型
      if (mostCommonCorrection && mostCommonCorrection.count >= 3) {
        return mostCommonCorrection.correctedType;
      }

      return null;
    } catch (error) {
      console.error('Failed to suggest question type:', error);
      return null;
    }
  }

  // 清除所有偏好和历史
  async clearAllPreferences(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([PREFERENCES_KEY, CORRECTION_HISTORY_KEY, DIFFICULTY_PREFERENCES_KEY]);
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      throw error;
    }
  }

  // ============ 难度偏好相关方法 ============

  // 获取难度偏好
  async getDifficultyPreference(questionType: QuestionType, gradeLevel: number): Promise<Difficulty | null> {
    try {
      const preferencesJson = await AsyncStorage.getItem(DIFFICULTY_PREFERENCES_KEY);
      if (preferencesJson) {
        const parsed: DifficultyPreferenceSerialized[] = JSON.parse(preferencesJson);

        // 查找匹配的题目类型和年级
        const matching = parsed.find(
          p => p.questionType === questionType && p.gradeLevel === gradeLevel
        );

        if (matching) {
          return matching.difficulty as Difficulty;
        }
      }

      // 如果没有保存的偏好，返回基于年级的推荐
      return this.getRecommendedDifficulty(gradeLevel);
    } catch (error) {
      console.error('Failed to get difficulty preference:', error);
      return this.getRecommendedDifficulty(gradeLevel);
    }
  }

  // 记录难度选择
  async recordDifficultySelection(
    questionType: QuestionType,
    difficulty: Difficulty,
    gradeLevel: number
  ): Promise<void> {
    return this.operationQueue.enqueue(async () => {
      try {
        const preferencesJson = await AsyncStorage.getItem(DIFFICULTY_PREFERENCES_KEY);
        let preferences: DifficultyPreferenceSerialized[] = [];

        if (preferencesJson) {
          preferences = JSON.parse(preferencesJson);
        }

        // 查找现有记录
        const existingIndex = preferences.findIndex(
          p => p.questionType === questionType && p.gradeLevel === gradeLevel
        );

        if (existingIndex >= 0) {
          // 更新现有记录
          preferences[existingIndex].difficulty = difficulty;
          preferences[existingIndex].lastSelected = new Date().toISOString();
          preferences[existingIndex].selectionCount += 1;
        } else {
          // 创建新记录
          preferences.push({
            questionType,
            difficulty,
            gradeLevel,
            lastSelected: new Date().toISOString(),
            selectionCount: 1
          });
        }

        // 只保留最近50条记录
        if (preferences.length > 50) {
          preferences.sort((a, b) => b.selectionCount - a.selectionCount);
          preferences = preferences.slice(0, 50);
        }

        await AsyncStorage.setItem(DIFFICULTY_PREFERENCES_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to record difficulty selection:', error);
        throw error;
      }
    });
  }

  // 获取推荐的难度（基于年级）
  getRecommendedDifficulty(gradeLevel: number): Difficulty {
    // 一年级默认简单难度
    if (gradeLevel <= 1) {
      return Difficulty.EASY;
    }
    // 二-三年级中等难度
    if (gradeLevel <= 3) {
      return Difficulty.MEDIUM;
    }
    // 四年级及以上困难难度
    return Difficulty.HARD;
  }

  // 获取最常选择的难度（用于统计）
  async getMostSelectedDifficulty(questionType: QuestionType): Promise<Difficulty | null> {
    try {
      const preferencesJson = await AsyncStorage.getItem(DIFFICULTY_PREFERENCES_KEY);
      if (!preferencesJson) {
        return null;
      }

      const preferences: DifficultyPreferenceSerialized[] = JSON.parse(preferencesJson);
      const filtered = preferences.filter(p => p.questionType === questionType);

      if (filtered.length === 0) {
        return null;
      }

      // 找到选择次数最多的难度
      const mostSelected = filtered.reduce((prev, current) =>
        current.selectionCount > prev.selectionCount ? current : prev
      );

      return mostSelected.difficulty as Difficulty;
    } catch (error) {
      console.error('Failed to get most selected difficulty:', error);
      return null;
    }
  }
}

export const preferencesService = new PreferencesService();
