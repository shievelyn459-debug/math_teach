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
 */
class RecognitionCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {hits: 0, misses: 0};
  private initialized = false;

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.loadCache();
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
   * @param key 缓存键
   * @returns 识别结果或null
   */
  async get(key: string): Promise<RecognitionResult | null> {
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
   * @param key 缓存键
   * @param result 识别结果
   * @param ttl 生存时间（毫秒）
   */
  async set(key: string, result: RecognitionResult, ttl: number = DEFAULT_TTL): Promise<void> {
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
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * 加载缓存
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
      this.cache.clear();
    }
  }

  /**
   * 保存缓存
   */
  private async saveCache(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.cache);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save cache:', error);
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
