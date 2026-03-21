import { preferencesService } from '../preferencesService';
import { QuestionType, Difficulty } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 模拟 AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  multiRemove: jest.fn(),
  setItem: jest.fn(),
}));

describe('PreferencesService - 难度偏好', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecommendedDifficulty', () => {
    it('一年级应该返回简单难度', () => {
      const difficulty = preferencesService.getRecommendedDifficulty(1);
      expect(difficulty).toBe(Difficulty.EASY);
    });

    it('二年级应该返回中等难度', () => {
      const difficulty = preferencesService.getRecommendedDifficulty(2);
      expect(difficulty).toBe(Difficulty.MEDIUM);
    });

    it('三年级应该返回中等难度', () => {
      const difficulty = preferencesService.getRecommendedDifficulty(3);
      expect(difficulty).toBe(Difficulty.MEDIUM);
    });

    it('四年级应该返回困难难度', () => {
      const difficulty = preferencesService.getRecommendedDifficulty(4);
      expect(difficulty).toBe(Difficulty.HARD);
    });

    it('五年级及以上应该返回困难难度', () => {
      const difficulty = preferencesService.getRecommendedDifficulty(5);
      expect(difficulty).toBe(Difficulty.HARD);

      const difficulty6 = preferencesService.getRecommendedDifficulty(6);
      expect(difficulty6).toBe(Difficulty.HARD);
    });
  });

  describe('getDifficultyPreference', () => {
    it('没有保存的偏好时应该返回推荐难度', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const difficulty = await preferencesService.getDifficultyPreference(
        QuestionType.ADDITION,
        1
      );

      expect(difficulty).toBe(Difficulty.EASY);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@math_learning_difficulty_preferences'
      );
    });

    it('应该返回保存的难度偏好', async () => {
      const savedPreference = [
        {
          questionType: QuestionType.ADDITION,
          difficulty: Difficulty.MEDIUM,
          gradeLevel: 2,
          lastSelected: new Date().toISOString(),
          selectionCount: 3,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(savedPreference)
      );

      const difficulty = await preferencesService.getDifficultyPreference(
        QuestionType.ADDITION,
        2
      );

      expect(difficulty).toBe(Difficulty.MEDIUM);
    });

    it('年级不匹配时应该返回推荐难度', async () => {
      const savedPreference = [
        {
          questionType: QuestionType.ADDITION,
          difficulty: Difficulty.MEDIUM,
          gradeLevel: 3,
          lastSelected: new Date().toISOString(),
          selectionCount: 3,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(savedPreference)
      );

      const difficulty = await preferencesService.getDifficultyPreference(
        QuestionType.ADDITION,
        1
      );

      // 一年级应该返回 Easy，而不是保存的 Medium
      expect(difficulty).toBe(Difficulty.EASY);
    });
  });

  describe('recordDifficultySelection', () => {
    it('应该记录新的难度选择', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await preferencesService.recordDifficultySelection(
        QuestionType.ADDITION,
        Difficulty.EASY,
        1
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );

      expect(savedData).toHaveLength(1);
      expect(savedData[0].questionType).toBe(QuestionType.ADDITION);
      expect(savedData[0].difficulty).toBe(Difficulty.EASY);
      expect(savedData[0].gradeLevel).toBe(1);
      expect(savedData[0].selectionCount).toBe(1);
    });

    it('应该更新现有的难度选择记录', async () => {
      const existingPreference = [
        {
          questionType: QuestionType.ADDITION,
          difficulty: Difficulty.EASY,
          gradeLevel: 1,
          lastSelected: new Date().toISOString(),
          selectionCount: 2,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingPreference)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await preferencesService.recordDifficultySelection(
        QuestionType.ADDITION,
        Difficulty.MEDIUM,
        1
      );

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );

      expect(savedData).toHaveLength(1);
      expect(savedData[0].difficulty).toBe(Difficulty.MEDIUM);
      expect(savedData[0].selectionCount).toBe(3); // 2 + 1
    });
  });

  describe('getMostSelectedDifficulty', () => {
    it('应该返回最常选择的难度', async () => {
      const savedPreferences = [
        {
          questionType: QuestionType.ADDITION,
          difficulty: Difficulty.EASY,
          gradeLevel: 1,
          lastSelected: new Date().toISOString(),
          selectionCount: 5,
        },
        {
          questionType: QuestionType.ADDITION,
          difficulty: Difficulty.MEDIUM,
          gradeLevel: 1,
          lastSelected: new Date().toISOString(),
          selectionCount: 2,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(savedPreferences)
      );

      const difficulty = await preferencesService.getMostSelectedDifficulty(
        QuestionType.ADDITION
      );

      expect(difficulty).toBe(Difficulty.EASY);
    });

    it('没有偏好时应该返回null', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const difficulty = await preferencesService.getMostSelectedDifficulty(
        QuestionType.ADDITION
      );

      expect(difficulty).toBeNull();
    });

    it('应该只返回指定题目类型的偏好', async () => {
      const savedPreferences = [
        {
          questionType: QuestionType.ADDITION,
          difficulty: Difficulty.EASY,
          gradeLevel: 1,
          lastSelected: new Date().toISOString(),
          selectionCount: 3,
        },
        {
          questionType: QuestionType.SUBTRACTION,
          difficulty: Difficulty.HARD,
          gradeLevel: 1,
          lastSelected: new Date().toISOString(),
          selectionCount: 5,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(savedPreferences)
      );

      const difficulty = await preferencesService.getMostSelectedDifficulty(
        QuestionType.ADDITION
      );

      // 应该返回 ADDITION 的偏好，而不是 SUBTRACTION
      expect(difficulty).toBe(Difficulty.EASY);
    });
  });

  describe('clearAllPreferences', () => {
    it('应该清除难度偏好', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      await preferencesService.clearAllPreferences();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@math_learning_preferences',
        '@math_learning_correction_history',
        '@math_learning_difficulty_preferences',
      ]);
    });
  });
});
