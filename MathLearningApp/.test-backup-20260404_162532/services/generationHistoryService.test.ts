/**
 * Story 5-1: generationHistoryService 单元测试
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {generationHistoryService, generateUniqueId} from '../generationHistoryService';
import {GenerationRecord, QuestionType, Difficulty} from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('generationHistoryService', () => {
  const mockRecord: GenerationRecord = {
    id: 'test_1',
    questionType: QuestionType.ADDITION,
    difficulty: Difficulty.EASY,
    count: 5,
    timestamp: Date.now(),
    questions: [
      {
        id: 'q1',
        question: '1 + 1 = ?',
        answer: '2',
        difficulty: Difficulty.EASY,
      },
    ],
    processingTime: 5000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveGeneration', () => {
    it('should save generation record successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await generationHistoryService.saveGeneration(mockRecord);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'generation_history',
        JSON.stringify([mockRecord])
      );
    });

    it('should add new record to existing records', async () => {
      const existingRecord: GenerationRecord = {
        ...mockRecord,
        id: 'existing',
        timestamp: Date.now() - 10000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingRecord]));

      await generationHistoryService.saveGeneration(mockRecord);

      const savedData = JSON.parse(
        (mockAsyncStorage.setItem.mock.calls[0][1] as string) || ''
      );

      // 新记录应该在最前面
      expect(savedData[0].id).toBe(mockRecord.id);
      expect(savedData[1].id).toBe(existingRecord.id);
    });

    it('should limit records to MAX_RECORDS', async () => {
      const records: GenerationRecord[] = Array.from({length: 100}, (_, i) => ({
        ...mockRecord,
        id: `record_${i}`,
      }));

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(records));

      await generationHistoryService.saveGeneration(mockRecord);

      const savedData = JSON.parse(
        (mockAsyncStorage.setItem.mock.calls[0][1] as string) || ''
      );

      // 应该有100条记录（MAX_RECORDS）
      expect(savedData.length).toBe(100);
      // 新记录应该在最前面
      expect(savedData[0].id).toBe(mockRecord.id);
    });
  });

  describe('getAllGenerations', () => {
    it('should return empty array when no records exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await generationHistoryService.getAllGenerations();

      expect(result).toEqual([]);
    });

    it('should return all records sorted by timestamp descending', async () => {
      const oldRecord = {...mockRecord, id: 'old', timestamp: 1000};
      const newRecord = {...mockRecord, id: 'new', timestamp: 2000};

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify([oldRecord, newRecord])
      );

      const result = await generationHistoryService.getAllGenerations();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('new'); // 最新的在前
      expect(result[1].id).toBe('old');
    });

    it('should handle invalid JSON gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      const result = await generationHistoryService.getAllGenerations();

      expect(result).toEqual([]);
    });
  });

  describe('getRecentGenerations', () => {
    it('should return limited number of recent records', async () => {
      const records: GenerationRecord[] = Array.from({length: 10}, (_, i) => ({
        ...mockRecord,
        id: `record_${i}`,
        timestamp: Date.now() - i * 1000,
      }));

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(records));

      const result = await generationHistoryService.getRecentGenerations(5);

      expect(result).toHaveLength(5);
      expect(result[0].id).toBe('record_0'); // 最新的
      expect(result[4].id).toBe('record_4');
    });

    it('should return all records if total is less than limit', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockRecord]));

      const result = await generationHistoryService.getRecentGenerations(5);

      expect(result).toHaveLength(1);
    });

    it('should use default limit of 5', async () => {
      const records: GenerationRecord[] = Array.from({length: 10}, (_, i) => ({
        ...mockRecord,
        id: `record_${i}`,
      }));

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(records));

      const result = await generationHistoryService.getRecentGenerations();

      expect(result).toHaveLength(5);
    });
  });

  describe('getGenerationById', () => {
    it('should return record when found', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockRecord]));

      const result = await generationHistoryService.getGenerationById('test_1');

      expect(result).toEqual(mockRecord);
    });

    it('should return null when not found', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockRecord]));

      const result = await generationHistoryService.getGenerationById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getGenerationsByType', () => {
    it('should return records matching the question type', async () => {
      const additionRecord = {
        ...mockRecord,
        id: 'addition',
        questionType: QuestionType.ADDITION,
      };
      const subtractionRecord = {
        ...mockRecord,
        id: 'subtraction',
        questionType: QuestionType.SUBTRACTION,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify([additionRecord, subtractionRecord])
      );

      const result = await generationHistoryService.getGenerationsByType(
        QuestionType.ADDITION
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('addition');
    });
  });

  describe('getGenerationsByDifficulty', () => {
    it('should return records matching the difficulty', async () => {
      const easyRecord = {
        ...mockRecord,
        id: 'easy',
        difficulty: Difficulty.EASY,
      };
      const hardRecord = {
        ...mockRecord,
        id: 'hard',
        difficulty: Difficulty.HARD,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify([easyRecord, hardRecord])
      );

      const result = await generationHistoryService.getGenerationsByDifficulty(
        Difficulty.EASY
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('easy');
    });
  });

  describe('deleteGeneration', () => {
    it('should remove specified record', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockRecord]));

      await generationHistoryService.deleteGeneration('test_1');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'generation_history',
        JSON.stringify([])
      );
    });
  });

  describe('clearAll', () => {
    it('should remove all records', async () => {
      await generationHistoryService.clearAll();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('generation_history');
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      const records: GenerationRecord[] = [
        {...mockRecord, id: '1', questionType: QuestionType.ADDITION, difficulty: Difficulty.EASY},
        {...mockRecord, id: '2', questionType: QuestionType.ADDITION, difficulty: Difficulty.MEDIUM},
        {...mockRecord, id: '3', questionType: QuestionType.SUBTRACTION, difficulty: Difficulty.HARD},
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(records));

      const stats = await generationHistoryService.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.byType[QuestionType.ADDITION]).toBe(2);
      expect(stats.byType[QuestionType.SUBTRACTION]).toBe(1);
      expect(stats.byDifficulty[Difficulty.EASY]).toBe(1);
      expect(stats.byDifficulty[Difficulty.MEDIUM]).toBe(1);
      expect(stats.byDifficulty[Difficulty.HARD]).toBe(1);
    });

    it('should return empty statistics when no records', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const stats = await generationHistoryService.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.byType[QuestionType.ADDITION]).toBe(0);
      expect(stats.byType[QuestionType.SUBTRACTION]).toBe(0);
      expect(stats.byType[QuestionType.WORD_PROBLEM]).toBe(0);
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();

      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with timestamp prefix', () => {
      const id = generateUniqueId();
      const prefix = Date.now().toString();

      expect(id.startsWith(prefix)).toBe(true);
    });

    it('should generate IDs with random suffix', () => {
      const id = generateUniqueId();
      const parts = id.split('_');

      expect(parts.length).toBe(2);
      expect(parts[1].length).toBeGreaterThan(0);
    });
  });
});
