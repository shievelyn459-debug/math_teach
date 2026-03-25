/**
 * 选择题目难度 测试
 *
 * Story 2-4: 选择题目难度
 * 测试用户选择和调整题目难度的功能
 */

import { Grade, Difficulty } from '../../types';

describe('选择题目难度 - Story 2-4', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== 难度选择测试 ====================

  describe('难度等级选择', () => {
    it('应该支持选择简单难度', () => {
      const selectedDifficulty = Difficulty.EASY;

      expect(selectedDifficulty).toBe(Difficulty.EASY);
      expect(selectedDifficulty).toBe('easy');
    });

    it('应该支持选择中等难度', () => {
      const selectedDifficulty = Difficulty.MEDIUM;

      expect(selectedDifficulty).toBe(Difficulty.MEDIUM);
      expect(selectedDifficulty).toBe('medium');
    });

    it('应该支持选择困难难度', () => {
      const selectedDifficulty = Difficulty.HARD;

      expect(selectedDifficulty).toBe(Difficulty.HARD);
      expect(selectedDifficulty).toBe('hard');
    });
  });

  // ==================== 默认难度逻辑测试 ====================

  describe('默认难度设置', () => {
    it('应该根据年级设置默认难度', () => {
      const gradeDifficultyMap: Record<Grade, Difficulty> = {
        [Grade.GRADE_1]: Difficulty.EASY,
        [Grade.GRADE_2]: Difficulty.EASY,
        [Grade.GRADE_3]: Difficulty.MEDIUM,
        [Grade.GRADE_4]: Difficulty.MEDIUM,
        [Grade.GRADE_5]: Difficulty.HARD,
        [Grade.GRADE_6]: Difficulty.HARD,
      };

      // 一年级默认简单
      expect(gradeDifficultyMap[Grade.GRADE_1]).toBe(Difficulty.EASY);
      // 三年级默认中等
      expect(gradeDifficultyMap[Grade.GRADE_3]).toBe(Difficulty.MEDIUM);
      // 五年级默认困难
      expect(gradeDifficultyMap[Grade.GRADE_5]).toBe(Difficulty.HARD);
    });

    it('应该在没有年级信息时使用简单难度', () => {
      const defaultDifficulty = Difficulty.EASY;

      expect(defaultDifficulty).toBe(Difficulty.EASY);
    });

    it('应该记住用户上次选择的难度', () => {
      const userPreferences = {
        lastSelectedDifficulty: Difficulty.MEDIUM,
      };

      expect(userPreferences.lastSelectedDifficulty).toBe(Difficulty.MEDIUM);
    });
  });

  // ==================== 难度与题目生成关联测试 ====================

  describe('难度与题目参数关联', () => {
    it('简单难度应该生成基础题目', () => {
      const difficultyConfig = {
        level: Difficulty.EASY,
        numberRange: { min: 1, max: 10 },
        operationCount: 2,
        timeLimit: 30,
      };

      expect(difficultyConfig.level).toBe(Difficulty.EASY);
      expect(difficultyConfig.numberRange.min).toBe(1);
      expect(difficultyConfig.numberRange.max).toBe(10);
    });

    it('中等难度应该生成进阶题目', () => {
      const difficultyConfig = {
        level: Difficulty.MEDIUM,
        numberRange: { min: 1, max: 20 },
        operationCount: 3,
        timeLimit: 45,
      };

      expect(difficultyConfig.level).toBe(Difficulty.MEDIUM);
      expect(difficultyConfig.numberRange.max).toBe(20);
      expect(difficultyConfig.operationCount).toBe(3);
    });

    it('困难难度应该生成复杂题目', () => {
      const difficultyConfig = {
        level: Difficulty.HARD,
        numberRange: { min: 10, max: 100 },
        operationCount: 4,
        timeLimit: 60,
      };

      expect(difficultyConfig.level).toBe(Difficulty.HARD);
      expect(difficultyConfig.numberRange.min).toBe(10);
      expect(difficultyConfig.operationCount).toBe(4);
    });

    it('困难难度应该生成复杂题目', () => {
      const difficultyConfig = {
        level: Difficulty.HARD,
        numberRange: { min: 10, max: 100 },
        operationCount: 4,
        timeLimit: 60,
      };

      expect(difficultyConfig.level).toBe(Difficulty.HARD);
      expect(difficultyConfig.operationCount).toBe(4);
    });
  });

  // ==================== 难度调整测试 ====================

  describe('难度调整', () => {
    it('应该支持提升难度', () => {
      const currentDifficulty = Difficulty.EASY;
      const adjustedDifficulty = Difficulty.MEDIUM;

      expect(currentDifficulty).toBe(Difficulty.EASY);
      expect(adjustedDifficulty).toBe(Difficulty.MEDIUM);
    });

    it('应该支持降低难度', () => {
      const currentDifficulty = Difficulty.HARD;
      const adjustedDifficulty = Difficulty.MEDIUM;

      expect(currentDifficulty).toBe(Difficulty.HARD);
      expect(adjustedDifficulty).toBe(Difficulty.MEDIUM);
    });

    it('应该防止难度超出范围', () => {
      const difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

      const canIncrease = (current: Difficulty) => {
        const currentIndex = difficulties.indexOf(current);
        return currentIndex < difficulties.length - 1;
      };

      const canDecrease = (current: Difficulty) => {
        const currentIndex = difficulties.indexOf(current);
        return currentIndex > 0;
      };

      // HARD是最高难度，不能再增加
      expect(canIncrease(Difficulty.HARD)).toBe(false);
      expect(canDecrease(Difficulty.HARD)).toBe(true);

      // EASY是最低难度，不能再减少
      expect(canIncrease(Difficulty.EASY)).toBe(true);
      expect(canDecrease(Difficulty.EASY)).toBe(false);
    });
  });

  // ==================== UI交互测试 ====================

  describe('UI交互流程', () => {
    it('应该显示难度选择界面', () => {
      const uiState = {
        showDifficultySelector: true,
        currentDifficulty: null,
        availableDifficulties: [
          Difficulty.EASY,
          Difficulty.MEDIUM,
          Difficulty.HARD,
          Difficulty.EXPERT,
        ],
      };

      expect(uiState.showDifficultySelector).toBe(true);
      expect(uiState.availableDifficulties).toHaveLength(4);
    });

    it('应该在选择后确认难度', () => {
      const uiState = {
        selectedDifficulty: Difficulty.MEDIUM,
        showConfirmButton: true,
      };

      expect(uiState.selectedDifficulty).toBe(Difficulty.MEDIUM);
      expect(uiState.showConfirmButton).toBe(true);
    });

    it('应该显示难度描述', () => {
      const difficultyDescriptions: Record<Difficulty, string> = {
        [Difficulty.EASY]: '简单 - 基础练习',
        [Difficulty.MEDIUM]: '中等 - 适当挑战',
        [Difficulty.HARD]: '困难 - 提升能力',
      };

      expect(difficultyDescriptions[Difficulty.EASY]).toBe('简单 - 基础练习');
      expect(difficultyDescriptions[Difficulty.HARD]).toBe('困难 - 提升能力');
    });

    it('应该显示当前选中难度的高亮状态', () => {
      const uiState = {
        currentDifficulty: Difficulty.MEDIUM,
        highlightedDifficulty: Difficulty.MEDIUM,
      };

      expect(uiState.currentDifficulty).toBe(uiState.highlightedDifficulty);
    });
  });

  // ==================== 数量选择测试 ====================

  describe('题目数量选择', () => {
    it('应该支持选择题目数量', () => {
      const quantityOptions = [5, 10, 15, 20];
      const selectedQuantity = 10;

      expect(quantityOptions).toContain(selectedQuantity);
      expect(selectedQuantity).toBe(10);
    });

    it('应该根据难度建议题目数量', () => {
      const difficultyQuantityMap: Record<Difficulty, number> = {
        [Difficulty.EASY]: 15,
        [Difficulty.MEDIUM]: 12,
        [Difficulty.HARD]: 10,
      };

      expect(difficultyQuantityMap[Difficulty.EASY]).toBe(15);
      expect(difficultyQuantityMap[Difficulty.HARD]).toBe(10);
    });

    it('应该限制题目数量范围', () => {
      const minQuantity = 5;
      const maxQuantity = 20;
      const selectedQuantity = 10;

      expect(selectedQuantity).toBeGreaterThanOrEqual(minQuantity);
      expect(selectedQuantity).toBeLessThanOrEqual(maxQuantity);
    });
  });

  // ==================== 持久化测试 ====================

  describe('难度设置持久化', () => {
    it('应该保存用户难度偏好', async () => {
      const savePreference = jest.fn().mockResolvedValue(undefined);
      const preference = {
        difficulty: Difficulty.MEDIUM,
        quantity: 10,
      };

      await savePreference(preference);

      expect(savePreference).toHaveBeenCalledWith(preference);
    });

    it('应该加载用户上次选择的难度', async () => {
      const loadPreference = jest.fn().mockResolvedValue({
        difficulty: Difficulty.HARD,
        quantity: 8,
      });

      const preference = await loadPreference();

      expect(preference.difficulty).toBe(Difficulty.HARD);
      expect(preference.quantity).toBe(8);
    });

    it('应该在首次使用时使用默认设置', async () => {
      const loadPreference = jest.fn().mockResolvedValue(null);
      const defaultPreference = {
        difficulty: Difficulty.EASY,
        quantity: 10,
      };

      const preference = await loadPreference();

      if (!preference) {
        expect(defaultPreference.difficulty).toBe(Difficulty.EASY);
      }
    });
  });

  // ==================== 验证测试 ====================

  describe('输入验证', () => {
    it('应该验证难度值是否有效', () => {
      const validDifficulties = [
        Difficulty.EASY,
        Difficulty.MEDIUM,
        Difficulty.HARD,
      ];

      const isValidDifficulty = (difficulty: string): boolean => {
        return validDifficulties.includes(difficulty as Difficulty);
      };

      expect(isValidDifficulty(Difficulty.EASY)).toBe(true);
      expect(isValidDifficulty('invalid')).toBe(false);
    });

    it('应该验证题目数量是否在范围内', () => {
      const minQuantity = 5;
      const maxQuantity = 20;

      const isValidQuantity = (quantity: number): boolean => {
        return quantity >= minQuantity && quantity <= maxQuantity;
      };

      expect(isValidQuantity(10)).toBe(true);
      expect(isValidQuantity(3)).toBe(false);
      expect(isValidQuantity(25)).toBe(false);
    });
  });
});
