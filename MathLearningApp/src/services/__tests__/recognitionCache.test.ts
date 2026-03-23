/**
 * Story 5-3: RecognitionCache 服务测试
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {recognitionCache, CacheEntry} from '../recognitionCache';
import {RecognitionResult, QuestionType} from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock crypto-js
jest.mock('crypto-js', () => ({
  sha256: jest.fn((input: string) => `mock-hash-${input.substring(input.length - 10)}`),
}));

describe('RecognitionCache', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Completely reset cache state for testing
    await recognitionCache._resetForTest();
  });

  const mockRecognitionResult: RecognitionResult = {
    questionType: QuestionType.ADDITION,
    confidence: 0.95,
    timestamp: Date.now(),
  };

  describe('generateCacheKey', () => {
    it('generates consistent cache keys for same image', async () => {
      const imageUri = 'file:///path/to/image.jpg';
      const key1 = await recognitionCache.generateCacheKey(imageUri);
      const key2 = await recognitionCache.generateCacheKey(imageUri);

      expect(key1).toBe(key2);
      expect(key1).toContain('recognition_');
    });

    it('generates different keys for different images', async () => {
      const key1 = await recognitionCache.generateCacheKey('file:///image1.jpg');
      const key2 = await recognitionCache.generateCacheKey('file:///image2.jpg');

      expect(key1).not.toBe(key2);
    });
  });

  describe('get and set', () => {
    it('returns null for non-existent key', async () => {
      const result = await recognitionCache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('stores and retrieves cache entry', async () => {
      const key = 'test-key';
      await recognitionCache.set(key, mockRecognitionResult, 1000);

      const result = await recognitionCache.get(key);
      expect(result).toEqual(mockRecognitionResult);
    });

    it('updates access count on retrieval', async () => {
      const key = 'test-key';
      await recognitionCache.set(key, mockRecognitionResult, 1000);

      await recognitionCache.get(key);
      await recognitionCache.get(key);

      const stats = recognitionCache.getStats();
      expect(stats.hits).toBe(2);
    });
  });

  describe('TTL expiration', () => {
    it('returns null for expired entries', async () => {
      const key = 'test-key';
      const shortTTL = 100; // 100ms

      await recognitionCache.set(key, mockRecognitionResult, shortTTL);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = await recognitionCache.get(key);
      expect(result).toBeNull();
    });

    it('does not expire valid entries', async () => {
      const key = 'test-key';
      const longTTL = 10000; // 10 seconds

      await recognitionCache.set(key, mockRecognitionResult, longTTL);

      // Check immediately
      const result = await recognitionCache.get(key);
      expect(result).toEqual(mockRecognitionResult);
    });
  });

  describe('cache statistics', () => {
    it('tracks hit rate correctly', async () => {
      const key = 'test-key';
      await recognitionCache.set(key, mockRecognitionResult, 10000);

      // Cache miss
      await recognitionCache.get('other-key');

      // Cache hit
      await recognitionCache.get(key);

      const stats = recognitionCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('tracks cache size correctly', async () => {
      await recognitionCache.set('key1', mockRecognitionResult, 10000);
      await recognitionCache.set('key2', mockRecognitionResult, 10000);
      await recognitionCache.set('key3', mockRecognitionResult, 10000);

      const stats = recognitionCache.getStats();
      expect(stats.size).toBe(3);
    });
  });

  describe('clear and delete', () => {
    it('deletes specific entry', async () => {
      const key = 'test-key';
      await recognitionCache.set(key, mockRecognitionResult, 10000);

      await recognitionCache.delete(key);

      const result = await recognitionCache.get(key);
      expect(result).toBeNull();
    });

    it('clears all entries', async () => {
      await recognitionCache.set('key1', mockRecognitionResult, 10000);
      await recognitionCache.set('key2', mockRecognitionResult, 10000);

      await recognitionCache.clear();

      const stats = recognitionCache.getStats();
      expect(stats.size).toBe(0);
    });
  });
});
