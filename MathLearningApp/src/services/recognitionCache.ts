/**
 * Story 5-3: 识别缓存服务
 * 缓存识别结果以提高响应速度
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {sha256} from 'crypto-js';
import {RecognitionResult} from '../types';

const CACHE_KEY = 'recognition_cache';
const MAX_CACHE_SIZE = 100;
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7天

/**
 * 缓存条目
 */
export interface CacheEntry {
  key: string;
  result: RecognitionResult;
  createdAt: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * 缓存统计
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * 识别缓存服务类
 * PATCH-H9: Add operation queue to prevent concurrent access
 */
class RecognitionCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {hits: 0, misses: 0};
  private initialized = false;
  private operationQueue: Promise<any> = Promise.resolve();

  /**
   * 初始化服务
   * PATCH-H3: Load persisted stats from AsyncStorage
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.loadCache();
      await this.loadStats(); // PATCH-H3: Load stats
      await this.cleanupExpired();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize recognition cache:', error);
      this.initialized = true;
    }
  }

  /**
   * 生成缓存键（基于图片的感知哈希）
   * @param imageUri 图片URI
   * @returns 缓存键
   */
  async generateCacheKey(imageUri: string): Promise<string> {
    // 简化版：使用URI作为基础，实际应用应使用图片内容的哈希
    // 这里使用文件名和时间戳作为简化实现
    const uri = imageUri.replace(/^file:\/\//, '');
    const hash = sha256(uri);
    return `recognition_${hash.substring(0, 16)}`;
  }

  /**
   * 获取缓存结果
   * PATCH-H9: Queue operations to prevent race conditions
   * @param key 缓存键
   * @returns 识别结果或null
   */
  async get(key: string): Promise<RecognitionResult | null> {
    // PATCH-H9: Queue operation
    return this.operationQueue.then(async () => {
      const operation = this._getInternal(key);
      this.operationQueue = operation.catch(() => {});
      return operation;
    });
  }

  /**
   * Internal get implementation (not queued)
   */
  private async _getInternal(key: string): Promise<RecognitionResult | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - entry.createdAt > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      await this.saveCache();
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    // 异步保存
    this.saveCache().catch(err => console.error('Failed to save cache stats:', err));

    return entry.result;
  }

  /**
   * 设置缓存
   * PATCH-H9: Queue operations to prevent race conditions
   * @param key 缓存键
   * @param result 识别结果
   * @param ttl 生存时间（毫秒）
   */
  async set(key: string, result: RecognitionResult, ttl: number = DEFAULT_TTL): Promise<void> {
    // PATCH-H9: Queue operation
    return this.operationQueue.then(async () => {
      const operation = this._setInternal(key, result, ttl);
      this.operationQueue = operation.catch(() => {});
      return operation;
    });
  }

  /**
   * Internal set implementation (not queued)
   */
  private async _setInternal(key: string, result: RecognitionResult, ttl: number): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const entry: CacheEntry = {
      key,
      result,
      createdAt: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    // 检查缓存大小限制
    if (this.cache.size >= MAX_CACHE_SIZE) {
      await this.evictOldest();
    }

    this.cache.set(key, entry);
    await this.saveCache();
  }

  /**
   * 清除指定缓存
   * @param key 缓存键
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.saveCache();
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {hits: 0, misses: 0};
    await this.saveCache();
  }

  /**
   * 完全重置服务状态（主要用于测试）
   */
  async _resetForTest(): Promise<void> {
    this.cache.clear();
    this.stats = {hits: 0, misses: 0};
    this.initialized = false;
    this.operationQueue = Promise.resolve();
  }

  /**
   * 获取缓存统计
   * PATCH-H2: Division by zero already handled (kept for clarity)
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0, // PATCH-H2: Safe division
    };
  }

  /**
   * 加载缓存
   * PATCH-H10: Clear corrupted cache on JSON parse failure
   */
  private async loadCache(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
      // PATCH-H10: Clear corrupted cache
      this.cache.clear();
      await AsyncStorage.removeItem(CACHE_KEY);
    }
  }

  /**
   * PATCH-H3: Load stats from AsyncStorage
   */
  private async loadStats(): Promise<void> {
    try {
      const statsData = await AsyncStorage.getItem(`${CACHE_KEY}_stats`);
      if (statsData) {
        const parsed = JSON.parse(statsData);
        this.stats = {
          hits: parsed.hits || 0,
          misses: parsed.misses || 0,
        };
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  /**
   * PATCH-H3: Save stats to AsyncStorage
   */
  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}_stats`, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save cache stats:', error);
    }
  }

  /**
   * 保存缓存
   * PATCH-H8: Handle AsyncStorage quota exceeded
   */
  private async saveCache(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.cache);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(obj));
      // PATCH-H3: Also save stats when cache is saved
      await this.saveStats();
    } catch (error) {
      // PATCH-H8: Handle quota exceeded
      if (error instanceof Error && error.message.includes('QuotaExceeded')) {
        console.warn('Cache quota exceeded, clearing oldest entries...');
        await this.evictOldest();
        // Retry with smaller cache
        try {
          const obj = Object.fromEntries(this.cache);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(obj));
        } catch (retryError) {
          console.error('Failed to save cache after cleanup:', retryError);
        }
      } else {
        console.error('Failed to save cache:', error);
      }
    }
  }

  /**
   * 清理过期条目
   */
  private async cleanupExpired(): Promise<void> {
    const now = Date.now();
    let hasExpired = false;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > entry.ttl) {
        this.cache.delete(key);
        hasExpired = true;
      }
    }

    if (hasExpired) {
      await this.saveCache();
    }
  }

  /**
   * 淘汰最旧的条目（LRU）
   */
  private async evictOldest(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 预热缓存（常用数据）
   */
  async warmUp(): Promise<void> {
    // 可以在应用启动时预加载常用数据
    // 当前为空实现
  }
}

// 导出单例实例
export const recognitionCache = new RecognitionCacheService();
