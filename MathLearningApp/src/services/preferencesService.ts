import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionType } from '../types';

const PREFERENCES_KEY = '@math_learning_preferences';
const CORRECTION_HISTORY_KEY = '@math_learning_correction_history';

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

export interface CorrectionHistoryItem {
  id: string;
  originalType: QuestionType;
  correctedType: QuestionType;
  imageUri: string;
  timestamp: Date;
}

class PreferencesService {
  // 获取用户偏好
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const preferencesJson = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (preferencesJson) {
        return JSON.parse(preferencesJson);
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
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  // 记录手动纠正
  async recordCorrection(
    originalType: QuestionType,
    correctedType: QuestionType,
    imageUri: string
  ): Promise<void> {
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

      await AsyncStorage.setItem(CORRECTION_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to record correction:', error);
      throw error;
    }
  }

  // 获取纠正历史
  async getCorrectionHistory(): Promise<CorrectionHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(CORRECTION_HISTORY_KEY);
      if (historyJson) {
        return JSON.parse(historyJson);
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
      await AsyncStorage.multiRemove([PREFERENCES_KEY, CORRECTION_HISTORY_KEY]);
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      throw error;
    }
  }
}

export const preferencesService = new PreferencesService();
