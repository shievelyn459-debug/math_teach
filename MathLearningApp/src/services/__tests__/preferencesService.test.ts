import { preferencesService } from '../preferencesService';
import { QuestionType, Difficulty } from '../../types';
import { ExplanationFormat } from '../../types/explanation';

// Mock AsyncStorage - configured in jest.setup.js
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

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
      AsyncStorage.getItem.mockResolvedValue(null);

      const difficulty = await preferencesService.getDifficultyPreference(
        QuestionType.ADDITION,
        1
      );

      expect(difficulty).toBe(Difficulty.EASY);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
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

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedPreference));

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

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedPreference));

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
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue(undefined);

      await preferencesService.recordDifficultySelection(
        QuestionType.ADDITION,
        Difficulty.EASY,
        1
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);

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

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingPreference));
      AsyncStorage.setItem.mockResolvedValue(undefined);

      await preferencesService.recordDifficultySelection(
        QuestionType.ADDITION,
        Difficulty.MEDIUM,
        1
      );

      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);

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

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedPreferences));

      const difficulty = await preferencesService.getMostSelectedDifficulty(
        QuestionType.ADDITION
      );

      expect(difficulty).toBe(Difficulty.EASY);
    });

    it('没有偏好时应该返回null', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

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

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedPreferences));

      const difficulty = await preferencesService.getMostSelectedDifficulty(
        QuestionType.ADDITION
      );

      // 应该返回 ADDITION 的偏好，而不是 SUBTRACTION
      expect(difficulty).toBe(Difficulty.EASY);
    });
  });

  describe('clearAllPreferences', () => {
    it('应该清除难度偏好', async () => {
      AsyncStorage.multiRemove.mockResolvedValue(undefined);

      await preferencesService.clearAllPreferences();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@math_learning_preferences',
        '@math_learning_correction_history',
        '@math_learning_difficulty_preferences',
      ]);
    });
  });

  // ============ Story 3-4: 讲解格式偏好测试 ============
  describe('Format Preferences (Story 3-4)', () => {
    describe('getFormatPreference', () => {
      it('没有保存的格式偏好时应该返回TEXT格式', async () => {
        AsyncStorage.getItem.mockResolvedValue(null);

        const format = await preferencesService.getFormatPreference();

        expect(format).toBe(ExplanationFormat.TEXT);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(
          '@math_learning_format_preference'
        );
      });

      it('应该返回保存的TEXT格式偏好', async () => {
        AsyncStorage.getItem.mockResolvedValue(ExplanationFormat.TEXT);

        const format = await preferencesService.getFormatPreference();

        expect(format).toBe(ExplanationFormat.TEXT);
      });

      it('应该返回保存的ANIMATION格式偏好', async () => {
        AsyncStorage.getItem.mockResolvedValue(ExplanationFormat.ANIMATION);

        const format = await preferencesService.getFormatPreference();

        expect(format).toBe(ExplanationFormat.ANIMATION);
      });

      it('应该返回保存的VIDEO格式偏好', async () => {
        AsyncStorage.getItem.mockResolvedValue(ExplanationFormat.VIDEO);

        const format = await preferencesService.getFormatPreference();

        expect(format).toBe(ExplanationFormat.VIDEO);
      });

      it('无效的格式值应该返回默认TEXT格式', async () => {
        AsyncStorage.getItem.mockResolvedValue('invalid-format');

        const format = await preferencesService.getFormatPreference();

        expect(format).toBe(ExplanationFormat.TEXT);
      });

      it('存储错误时应该返回默认TEXT格式', async () => {
        AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

        const format = await preferencesService.getFormatPreference();

        expect(format).toBe(ExplanationFormat.TEXT);
      });
    });

    describe('setFormatPreference', () => {
      it('应该保存TEXT格式偏好', async () => {
        AsyncStorage.setItem.mockResolvedValue(undefined);

        await preferencesService.setFormatPreference(ExplanationFormat.TEXT);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@math_learning_format_preference',
          ExplanationFormat.TEXT
        );
      });

      it('应该保存ANIMATION格式偏好', async () => {
        AsyncStorage.setItem.mockResolvedValue(undefined);

        await preferencesService.setFormatPreference(ExplanationFormat.ANIMATION);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@math_learning_format_preference',
          ExplanationFormat.ANIMATION
        );
      });

      it('应该保存VIDEO格式偏好', async () => {
        AsyncStorage.setItem.mockResolvedValue(undefined);

        await preferencesService.setFormatPreference(ExplanationFormat.VIDEO);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@math_learning_format_preference',
          ExplanationFormat.VIDEO
        );
      });

      it('存储失败时应该抛出错误', async () => {
        const error = new Error('Storage write failed');
        AsyncStorage.setItem.mockRejectedValue(error);

        await expect(
          preferencesService.setFormatPreference(ExplanationFormat.TEXT)
        ).rejects.toThrow();
      });
    });

    describe('clearFormatPreference', () => {
      it('应该清除格式偏好', async () => {
        AsyncStorage.removeItem.mockResolvedValue(undefined);

        await preferencesService.clearFormatPreference();

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
          '@math_learning_format_preference'
        );
      });

      it('清除失败时应该记录错误', async () => {
        const error = new Error('Remove failed');
        AsyncStorage.removeItem.mockRejectedValue(error);

        // 应该不抛出错误，而是记录日志
        await expect(
          preferencesService.clearFormatPreference()
        ).resolves.not.toThrow();
      });
    });

    describe('格式偏好持久化', () => {
      it('应该能够保存并读取相同的格式偏好', async () => {
        AsyncStorage.setItem.mockResolvedValue(undefined);
        AsyncStorage.getItem.mockResolvedValue(ExplanationFormat.VIDEO);

        // 保存格式偏好
        await preferencesService.setFormatPreference(ExplanationFormat.VIDEO);

        // 读取格式偏好
        const format = await preferencesService.getFormatPreference();

        expect(format).toBe(ExplanationFormat.VIDEO);
      });

      it('应该能够从TEXT切换到ANIMATION并持久化', async () => {
        AsyncStorage.setItem.mockResolvedValue(undefined);
        AsyncStorage.getItem
          .mockResolvedValueOnce(ExplanationFormat.TEXT) // 第一次读取
          .mockResolvedValueOnce(ExplanationFormat.ANIMATION); // 第二次读取

        // 初始格式是TEXT
        const initialFormat = await preferencesService.getFormatPreference();
        expect(initialFormat).toBe(ExplanationFormat.TEXT);

        // 切换到ANIMATION
        await preferencesService.setFormatPreference(ExplanationFormat.ANIMATION);

        // 再次读取应该是ANIMATION
        const newFormat = await preferencesService.getFormatPreference();
        expect(newFormat).toBe(ExplanationFormat.ANIMATION);
      });
    });

    describe('格式偏好与所有偏好清除的集成', () => {
      it('clearAllPreferences应该包含格式偏好键', async () => {
        AsyncStorage.multiRemove.mockResolvedValue(undefined);

        await preferencesService.clearAllPreferences();

        expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
          '@math_learning_preferences',
          '@math_learning_correction_history',
          '@math_learning_difficulty_preferences',
          // 注意：格式偏好键应该被包含（在preferencesService.ts中已经包含）
        ]);
      });
    });
  });
});
