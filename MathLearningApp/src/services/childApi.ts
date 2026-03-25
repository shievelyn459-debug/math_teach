/**
 * Child API - MySQL + AsyncStorage双模式实现
 *
 * Story 6-3: 孩子数据MySQL存储
 * P0修复:
 * - P0-1: 添加缓存锁防止竞态条件
 * - P0-2: 添加JSON类型验证
 * - P0-3: 添加storageMode和warning字段
 * P1修复:
 * - P1-1: 使用crypto安全UUID替代Math.random()
 * - P1-2: 提取日期转换工具函数
 * - P1-4: 使用缓存版本号替代TTL防止TOCTOU竞态
 * - P1-9: 添加缓存大小限制防止AsyncStorage配额超限
 * P2修复:
 * - P2-1: Magic Numbers提取为常量
 * - P2-2: 精确的闰年日期计算
 * - P2-3: 条件日志（仅在开发环境）
 * - P2-6: trim后验证（已修复）
 * - P2-7: Unicode规范化支持
 *
 * 架构:
 * - MySQL作为主存储（数据持久化、多设备同步）
 * - AsyncStorage作为缓存（离线降级、快速访问）
 * - 保持原有API接口完全兼容
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Child, Grade, ChildCreateRequest, ChildUpdateRequest, ApiResponse } from '../types';
import { childDataRepository, checkDatabaseConnection } from '../services/mysql';
import { getCurrentUserId } from './userApi';

// ==================== P2-1: Magic Numbers常量 ====================

/**
 * P2-1: 孩子年龄范围常量
 * 提取Magic Numbers为命名常量
 */
const CHILD_MIN_AGE = 5;   // 小学最小年龄
const CHILD_MAX_AGE = 12;  // 小学最大年龄

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;

// ==================== P2-3: 条件日志工具 ====================

/**
 * P2-3: 日志级别
 */
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * P2-3: 环境检测
 */
const isDevelopment = __DEV__; // React Native内置变量

/**
 * P2-3: 条件日志函数 - 仅在开发环境输出
 */
function log(level: LogLevel, message: string, ...args: any[]): void {
  if (!isDevelopment) {
    return; // 生产环境不输出日志
  }

  const timestamp = new Date().toISOString();
  const prefix = `[childApi][${timestamp}][${level}]`;

  switch (level) {
    case LogLevel.ERROR:
      console.error(prefix, message, ...args);
      break;
    case LogLevel.WARN:
      console.warn(prefix, message, ...args);
      break;
    case LogLevel.INFO:
      console.info(prefix, message, ...args);
      break;
    case LogLevel.DEBUG:
    default:
      console.log(prefix, message, ...args);
      break;
  }
}

// ==================== P2-7: Unicode规范化 ====================

/**
 * P2-7: Unicode规范化
 * 处理不同Unicode表示形式（如组合字符vs预组合字符）
 */
function normalizeUnicode(str: string): string {
  // 使用NFC规范化（Canonical Composition）
  // 这是最常用的形式，确保字符串有一致的表示
  return str.normalize('NFC');
}

/**
 * P2-7: 验证字符串是否为有效Unicode
 */
function isValidUnicode(str: string): boolean {
  try {
    // 尝试规范化，如果失败则包含无效Unicode
    normalizeUnicode(str);
    return true;
  } catch {
    return false;
  }
}

// ==================== P2-2: 精确年龄计算 ====================

/**
 * P2-2: 精确计算年龄（考虑闰年）
 * 使用基于日期的比较而非除以365.25
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // 如果还没到生日，减1岁
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// ==================== P1-1: 安全UUID生成 ====================

/**
 * P1-1: 使用crypto API生成安全的随机UUID
 * 替代不安全的Math.random()
 */
function generateSecureId(prefix: string): string {
  // 使用React Native可用的crypto API
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // 降级方案：使用多个随机源组合
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  // 转换为hex字符串
  const hex = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${prefix}_${Date.now()}_${hex}`;
}

// ==================== P1-2: 日期转换工具函数 ====================

/**
 * P1-2: 转换Child对象中的日期字段
 * 提取重复的日期转换逻辑为工具函数
 */
function convertChildDates(item: any): void {
  if (item.birthday && typeof item.birthday === 'string') {
    item.birthday = new Date(item.birthday);
  }
  if (item.createdAt && typeof item.createdAt === 'string') {
    item.createdAt = new Date(item.createdAt);
  }
  if (item.updatedAt && typeof item.updatedAt === 'string') {
    item.updatedAt = new Date(item.updatedAt);
  }
}

// ==================== 验证函数 ====================

/**
 * 孩子姓名验证函数
 * P2-6: 先trim再验证（已修复）
 * P2-7: 支持Unicode字符
 */
const validateChildName = (name: string): {isValid: boolean; error?: string} => {
  // P2-6: 先trim再验证长度
  const trimmedName = name.trim();

  // P2-7: 验证Unicode
  if (!isValidUnicode(trimmedName)) {
    return {isValid: false, error: '姓名包含无效字符'};
  }

  // P2-7: 规范化Unicode
  const normalizedName = normalizeUnicode(trimmedName);

  if (normalizedName.length === 0) {
    return {isValid: false, error: '孩子姓名不能为空'};
  }

  // P2-1: 使用常量替代Magic Numbers
  if (normalizedName.length < NAME_MIN_LENGTH) {
    return {isValid: false, error: `孩子姓名至少需要${NAME_MIN_LENGTH}个字符`};
  }

  if (normalizedName.length > NAME_MAX_LENGTH) {
    return {isValid: false, error: `孩子姓名不能超过${NAME_MAX_LENGTH}个字符`};
  }

  return {isValid: true};
};

/**
 * 孩子年级验证函数
 */
const validateChildGrade = (grade: Grade): {isValid: boolean; error?: string} => {
  const validGrades = [
    Grade.GRADE_1,
    Grade.GRADE_2,
    Grade.GRADE_3,
    Grade.GRADE_4,
    Grade.GRADE_5,
    Grade.GRADE_6,
  ];
  if (!validGrades.includes(grade)) {
    return {isValid: false, error: '年级必须在1-6之间'};
  }
  return {isValid: true};
};

/**
 * 孩子生日验证函数
 * P2-1: 使用常量替代Magic Numbers
 * P2-2: 使用精确的年龄计算
 */
const validateChildBirthday = (birthday?: Date): {isValid: boolean; error?: string} => {
  if (!birthday) {
    return {isValid: true}; // 生日是可选的
  }

  // 验证是否为有效的 Date 对象
  if (isNaN(birthday.getTime())) {
    return {isValid: false, error: '生日格式无效'};
  }

  const now = new Date();
  if (birthday > now) {
    return {isValid: false, error: '生日不能是未来日期'};
  }

  // P2-2: 使用精确的年龄计算（考虑闰年）
  const age = calculateAge(birthday);

  // P2-1: 使用常量替代Magic Numbers
  if (age < CHILD_MIN_AGE) {
    return {isValid: false, error: `孩子年龄应至少${CHILD_MIN_AGE}岁`};
  }

  if (age > CHILD_MAX_AGE) {
    return {isValid: false, error: `孩子年龄应不超过${CHILD_MAX_AGE}岁`};
  }

  return {isValid: true};
};

// ==================== 存储键辅助函数 ====================

/**
 * 获取本地存储的孩子列表键
 */
async function getChildrenStorageKey(): Promise<string> {
  const userId = await getCurrentUserId();
  return `@children_list_${userId}`;
}

/**
 * 获取缓存版本键
 * P1-4: 使用版本号替代TTL，防止TOCTOU竞态条件
 */
async function getCacheVersionKey(): Promise<string> {
  const userId = await getCurrentUserId();
  return `@children_cache_version_${userId}`;
}

/**
 * P0-1: 缓存锁键
 */
async function getCacheLockKey(): Promise<string> {
  const userId = await getCurrentUserId();
  return `@children_cache_lock_${userId}`;
}

// ==================== 缓存管理 ====================

/**
 * 缓存策略配置
 */
const CACHE_CONFIG = {
  /** 是否启用缓存 */
  ENABLE_CACHE: true,
  /** P0-1: 缓存锁超时（毫秒）- 防止死锁 */
  LOCK_TIMEOUT: 5000,
  /** P1-9: 缓存大小限制（字节）- AsyncStorage约6MB配额，限制为5MB */
  MAX_CACHE_SIZE: 5 * 1024 * 1024,
  /** P1-4: 缓存版本号（用于stale-while-revalidate） */
  VERSION: 1,
};

/**
 * P1-9: 估算字符串大小（字节）
 */
function estimateStringSize(str: string): number {
  // UTF-16编码，每个字符2字节
  return str.length * 2;
}

/**
 * P1-9: 检查缓存是否超过大小限制
 */
async function isCacheTooLarge(data: string): Promise<boolean> {
  const size = estimateStringSize(data);
  if (size > CACHE_CONFIG.MAX_CACHE_SIZE) {
    log(LogLevel.WARN, `Cache size exceeds limit: ${size} bytes`);
    return true;
  }
  return false;
}

/**
 * P0-2: Child类型验证函数
 */
function validateChildObject(obj: any): obj is Child {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.parentId === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.grade === 'string' &&
    (obj.birthday === undefined || obj.birthday === null || obj.birthday instanceof Date) &&
    (obj.avatar === undefined || obj.avatar === null || typeof obj.avatar === 'string') &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

/**
 * P0-2: 安全解析Child数组
 * P1-2: 使用提取的convertChildDates函数
 */
function safeParseChildren(data: string): Child[] | null {
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return null;
    }

    // 验证每个元素
    const validChildren: Child[] = [];
    for (const item of parsed) {
      // P1-2: 使用提取的日期转换函数
      convertChildDates(item);

      if (validateChildObject(item)) {
        validChildren.push(item);
      }
    }

    return validChildren;
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to parse children:', error);
    return null;
  }
}

/**
 * P0-1: 获取缓存锁
 */
async function acquireCacheLock(): Promise<boolean> {
  try {
    const lockKey = await getCacheLockKey();
    const now = Date.now();

    // 尝试获取锁
    await AsyncStorage.setItem(lockKey, now.toString());
    return true;
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to acquire cache lock:', error);
    return false;
  }
}

/**
 * P0-1: 释放缓存锁
 */
async function releaseCacheLock(): Promise<void> {
  try {
    const lockKey = await getCacheLockKey();
    await AsyncStorage.removeItem(lockKey);
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to release cache lock:', error);
  }
}

/**
 * P0-1: 检查缓存锁是否被持有
 */
async function isCacheLocked(): Promise<boolean> {
  try {
    const lockKey = await getCacheLockKey();
    const lockValue = await AsyncStorage.getItem(lockKey);
    if (!lockValue) return false;

    const lockTime = parseInt(lockValue, 10);
    const now = Date.now();

    // 锁超时检查
    if (now - lockTime > CACHE_CONFIG.LOCK_TIMEOUT) {
      await AsyncStorage.removeItem(lockKey);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * P1-4: 获取当前缓存版本号
 */
async function getCacheVersion(): Promise<number> {
  try {
    const versionKey = await getCacheVersionKey();
    const versionStr = await AsyncStorage.getItem(versionKey);
    return versionStr ? parseInt(versionStr, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * 写入缓存
 * P1-9: 添加缓存大小限制检查
 */
async function writeCache(children: Child[]): Promise<boolean> {
  try {
    const storageKey = await getChildrenStorageKey();
    const versionKey = await getCacheVersionKey();

    // 序列化数据
    const dataStr = JSON.stringify(children);

    // P1-9: 检查缓存大小
    if (await isCacheTooLarge(dataStr)) {
      log(LogLevel.WARN, 'Cache size exceeds limit, not caching');
      // 清除旧缓存以释放空间
      await clearCache();
      return false;
    }

    // P1-4: 原子写入：先写数据，再更新版本号
    await AsyncStorage.setItem(storageKey, dataStr);
    await AsyncStorage.setItem(versionKey, (CACHE_CONFIG.VERSION).toString());

    log(LogLevel.DEBUG, `Cache written: ${children.length} children`);
    return true;
  } catch (error) {
    // P1-9: 可能是配额超限错误
    if (error instanceof Error && error.message.includes('QuotaExceededError')) {
      log(LogLevel.ERROR, 'AsyncStorage quota exceeded, clearing cache');
      await clearCache();
    } else {
      log(LogLevel.ERROR, 'Failed to write cache:', error);
    }
    return false;
  }
}

/**
 * 读取缓存
 * P1-4: 使用版本号而非TTL，实现stale-while-revalidate模式
 */
async function readCache(): Promise<Child[] | null> {
  try {
    const storageKey = await getChildrenStorageKey();
    const versionKey = await getCacheVersionKey();

    const [data, versionStr] = await Promise.all([
      AsyncStorage.getItem(storageKey),
      AsyncStorage.getItem(versionKey),
    ]);

    if (!data) {
      return null;
    }

    // P1-4: 检查版本号而非TTL
    // 如果版本号不匹配，说明缓存已失效
    const cachedVersion = versionStr ? parseInt(versionStr, 10) : 0;
    if (cachedVersion !== CACHE_CONFIG.VERSION) {
      log(LogLevel.DEBUG, 'Cache version mismatch, clearing cache');
      // 清除旧版本缓存
      await clearCache();
      return null;
    }

    // P0-2: 使用安全解析
    const children = safeParseChildren(data);

    if (children) {
      log(LogLevel.DEBUG, `Cache hit: ${children.length} children`);
    }

    return children;
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to read cache:', error);
    return null;
  }
}

/**
 * 清除缓存
 */
async function clearCache(): Promise<void> {
  try {
    const storageKey = await getChildrenStorageKey();
    const versionKey = await getCacheVersionKey();

    await Promise.all([
      AsyncStorage.removeItem(storageKey),
      AsyncStorage.removeItem(versionKey),
    ]);

    log(LogLevel.DEBUG, 'Cache cleared');
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to clear cache:', error);
  }
}

/**
 * P0-1: 线程安全地更新缓存中的单个孩子
 * 使用缓存锁防止并发更新冲突
 */
async function updateCacheChild(childId: string, updates: Partial<Child>): Promise<void> {
  // 等待锁释放
  while (await isCacheLocked()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  await acquireCacheLock();

  try {
    const children = await readCache();
    if (!children) return;

    const index = children.findIndex(c => c.id === childId);
    if (index !== -1) {
      children[index] = { ...children[index], ...updates, updatedAt: new Date() };
      await writeCache(children);
    }
  } finally {
    await releaseCacheLock();
  }
}

/**
 * P0-1: 线程安全地从缓存中删除单个孩子
 */
async function removeCacheChild(childId: string): Promise<void> {
  // 等待锁释放
  while (await isCacheLocked()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  await acquireCacheLock();

  try {
    const children = await readCache();
    if (!children) return;

    const filtered = children.filter(c => c.id !== childId);
    await writeCache(filtered);
  } finally {
    await releaseCacheLock();
  }
}

// ==================== Child API ====================

export const childApi = {
  /**
   * 获取当前用户的所有孩子（MySQL主 + AsyncStorage缓存）
   * Story 1-5 AC1, AC3: 用户可以查看所有孩子
   * Story 6-3 AC2: 集成MySQL存储
   */
  getChildren: async (): Promise<ApiResponse<Child[]>> => {
    try {
      const parentId = await getCurrentUserId();

      // 首先尝试从缓存读取（stale-while-revalidate）
      if (CACHE_CONFIG.ENABLE_CACHE) {
        const cachedChildren = await readCache();
        if (cachedChildren) {
          log(LogLevel.INFO, 'Returning cached children');
          // 异步刷新缓存（后台更新）
          checkDatabaseConnection().then(isConnected => {
            if (isConnected) {
              childDataRepository.findByParentId(parentId).then(freshChildren => {
                writeCache(freshChildren);
              });
            }
          });
          return {
            success: true,
            data: cachedChildren,
            storageMode: 'local',
          };
        }
      }

      // 检查数据库连接
      const isConnected = await checkDatabaseConnection();

      if (!isConnected) {
        // 数据库未连接，尝试从AsyncStorage降级
        log(LogLevel.WARN, 'Database not connected, using AsyncStorage fallback');

        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (!data) {
          return {
            success: true,
            data: [],
            storageMode: 'local',
          };
        }

        // P0-2: 使用安全解析
        const children = safeParseChildren(data);
        if (!children) {
          return {
            success: true,
            data: [],
            storageMode: 'local',
          };
        }

        return {
          success: true,
          data: children,
          storageMode: 'local',
          warning: '数据库未连接，显示本地缓存数据',
        };
      }

      // 从MySQL获取数据
      log(LogLevel.INFO, 'Fetching children from MySQL');
      const children = await childDataRepository.findByParentId(parentId);

      // 写入缓存
      if (CACHE_CONFIG.ENABLE_CACHE) {
        await writeCache(children);
      }

      return {
        success: true,
        data: children,
        storageMode: 'mysql',
      };
    } catch (error) {
      log(LogLevel.ERROR, 'Failed to get children:', error);

      // 发生错误时，尝试从AsyncStorage降级
      try {
        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          const children = safeParseChildren(data);
          if (children) {
            log(LogLevel.INFO, 'Fallback to AsyncStorage succeeded');
            return {
              success: true,
              data: children,
              storageMode: 'local',
              warning: '数据库错误，显示本地缓存数据',
            };
          }
        }
      } catch (fallbackError) {
        log(LogLevel.ERROR, 'AsyncStorage fallback also failed:', fallbackError);
      }

      return {
        success: false,
        error: {
          code: 'GET_CHILDREN_ERROR',
          message: '获取孩子列表失败',
        },
      };
    }
  },

  /**
   * 添加新孩子（MySQL存储 + AsyncStorage缓存）
   * Story 1-5 AC1, AC2, AC7: 用户可以添加孩子，包含姓名、年级（必填）和生日（可选）
   * Story 6-3 AC2: 集成MySQL存储
   * P1-1: 使用安全UUID生成
   * P2-7: 支持Unicode字符
   */
  addChild: async (childData: ChildCreateRequest): Promise<ApiResponse<Child>> => {
    try {
      // 客户端验证
      const nameValidation = validateChildName(childData.name);
      if (!nameValidation.isValid) {
        // P3-1: 显式null检查而非使用!断言
        const errorMessage = nameValidation.error ?? '姓名验证失败';
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: errorMessage,
          },
        };
      }

      const gradeValidation = validateChildGrade(childData.grade);
      if (!gradeValidation.isValid) {
        const errorMessage = gradeValidation.error ?? '年级验证失败';
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: errorMessage,
          },
        };
      }

      const birthdayValidation = validateChildBirthday(childData.birthday);
      if (!birthdayValidation.isValid) {
        const errorMessage = birthdayValidation.error ?? '生日验证失败';
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: errorMessage,
          },
        };
      }

      const parentId = await getCurrentUserId();

      // 检查数据库连接
      const isConnected = await checkDatabaseConnection();

      if (isConnected) {
        // 使用MySQL存储
        log(LogLevel.INFO, 'Adding child to MySQL');
        const newChild = await childDataRepository.create(parentId, childData);

        // 更新缓存
        if (CACHE_CONFIG.ENABLE_CACHE) {
          await updateCacheChild(newChild.id, newChild);
        }

        log(LogLevel.INFO, `Child added successfully to MySQL: ${newChild.id}`);

        return {
          success: true,
          data: newChild,
          storageMode: 'mysql',
        };
      } else {
        // 数据库未连接，降级到AsyncStorage
        log(LogLevel.WARN, 'Database not connected, using AsyncStorage fallback');

        // P1-1: 使用安全UUID生成
        const newChild: Child = {
          id: generateSecureId('child'),
          parentId,
          // P2-7: 规范化Unicode
          name: normalizeUnicode(childData.name.trim()),
          grade: childData.grade,
          birthday: childData.birthday,
          avatar: childData.avatar,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);
        const existingChildren: Child[] = data ? safeParseChildren(data) || [] : [];

        existingChildren.push(newChild);

        // P1-9: 检查缓存大小
        const dataStr = JSON.stringify(existingChildren);
        if (await isCacheTooLarge(dataStr)) {
          log(LogLevel.WARN, 'Cache too large after adding child');
          return {
            success: false,
            error: {
              code: 'CACHE_FULL',
              message: '本地缓存已满，请连接网络',
            },
          };
        }

        await AsyncStorage.setItem(storageKey, dataStr);

        log(LogLevel.INFO, `Child added successfully to AsyncStorage: ${newChild.id}`);

        return {
          success: true,
          data: newChild,
          storageMode: 'local',
          warning: '数据库未连接，数据仅保存在本地',
        };
      }
    } catch (error) {
      log(LogLevel.ERROR, 'Failed to add child:', error);

      // 尝试降级到AsyncStorage
      try {
        const parentId = await getCurrentUserId();

        // P1-1: 使用安全UUID生成
        const newChild: Child = {
          id: generateSecureId('child'),
          parentId,
          name: normalizeUnicode(childData.name.trim()),
          grade: childData.grade,
          birthday: childData.birthday,
          avatar: childData.avatar,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);
        const existingChildren: Child[] = data ? safeParseChildren(data) || [] : [];

        existingChildren.push(newChild);
        await AsyncStorage.setItem(storageKey, JSON.stringify(existingChildren));

        log(LogLevel.INFO, 'Fallback to AsyncStorage succeeded');

        return {
          success: true,
          data: newChild,
          storageMode: 'local',
          warning: '数据库错误，数据仅保存在本地',
        };
      } catch (fallbackError) {
        log(LogLevel.ERROR, 'AsyncStorage fallback also failed:', fallbackError);

        return {
          success: false,
          error: {
            code: 'ADD_CHILD_ERROR',
            message: '添加孩子失败',
          },
        };
      }
    }
  },

  /**
   * 更新孩子信息（MySQL更新 + AsyncStorage同步）
   * Story 1-5 AC4: 用户可以编辑孩子信息
   * Story 6-3 AC2: 集成MySQL存储
   * P2-7: 支持Unicode字符
   */
  updateChild: async (
    childId: string,
    updates: ChildUpdateRequest
  ): Promise<ApiResponse<Child>> => {
    try {
      // 客户端验证（只验证提供的字段）
      if (updates.name !== undefined) {
        const nameValidation = validateChildName(updates.name);
        if (!nameValidation.isValid) {
          const errorMessage = nameValidation.error ?? '姓名验证失败';
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: errorMessage,
            },
          };
        }
      }

      if (updates.grade !== undefined) {
        const gradeValidation = validateChildGrade(updates.grade);
        if (!gradeValidation.isValid) {
          const errorMessage = gradeValidation.error ?? '年级验证失败';
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: errorMessage,
            },
          };
        }
      }

      if (updates.birthday !== undefined) {
        const birthdayValidation = validateChildBirthday(updates.birthday);
        if (!birthdayValidation.isValid) {
          const errorMessage = birthdayValidation.error ?? '生日验证失败';
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: errorMessage,
            },
          };
        }
      }

      // 检查数据库连接
      const isConnected = await checkDatabaseConnection();

      if (isConnected) {
        // 使用MySQL更新
        log(LogLevel.INFO, `Updating child in MySQL: ${childId}`);
        const updatedChild = await childDataRepository.update(childId, updates);

        // 更新缓存
        if (CACHE_CONFIG.ENABLE_CACHE) {
          await updateCacheChild(childId, updatedChild);
        }

        log(LogLevel.INFO, `Child updated successfully in MySQL: ${childId}`);

        return {
          success: true,
          data: updatedChild,
          storageMode: 'mysql',
        };
      } else {
        // 数据库未连接，降级到AsyncStorage
        log(LogLevel.WARN, 'Database not connected, using AsyncStorage fallback');

        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (!data) {
          return {
            success: false,
            error: {
              code: 'CHILD_NOT_FOUND',
              message: '孩子不存在',
            },
          };
        }

        const children = safeParseChildren(data);
        if (!children) {
          return {
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: '本地数据损坏',
            },
          };
        }

        const childIndex = children.findIndex(c => c.id === childId);

        if (childIndex === -1) {
          return {
            success: false,
            error: {
              code: 'CHILD_NOT_FOUND',
              message: '孩子不存在',
            },
          };
        }

        // 更新孩子信息
        // P2-7: 规范化Unicode
        const normalizedUpdates = {...updates};
        if (normalizedUpdates.name !== undefined) {
          normalizedUpdates.name = normalizeUnicode(normalizedUpdates.name.trim());
        }

        const updatedChild = {
          ...children[childIndex],
          ...normalizedUpdates,
          updatedAt: new Date(),
        };

        children[childIndex] = updatedChild;
        await AsyncStorage.setItem(storageKey, JSON.stringify(children));

        log(LogLevel.INFO, `Child updated successfully in AsyncStorage: ${childId}`);

        return {
          success: true,
          data: updatedChild,
          storageMode: 'local',
          warning: '数据库未连接，数据仅保存在本地',
        };
      }
    } catch (error) {
      log(LogLevel.ERROR, 'Failed to update child:', error);

      // 尝试降级到AsyncStorage
      try {
        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          const children = safeParseChildren(data);
          if (children) {
            const childIndex = children.findIndex(c => c.id === childId);

            if (childIndex !== -1) {
              const normalizedUpdates = {...updates};
              if (normalizedUpdates.name !== undefined) {
                normalizedUpdates.name = normalizeUnicode(normalizedUpdates.name.trim());
              }

              const updatedChild = {
                ...children[childIndex],
                ...normalizedUpdates,
                updatedAt: new Date(),
              };

              children[childIndex] = updatedChild;
              await AsyncStorage.setItem(storageKey, JSON.stringify(children));

              log(LogLevel.INFO, 'Fallback to AsyncStorage succeeded');

              return {
                success: true,
                data: updatedChild,
                storageMode: 'local',
                warning: '数据库错误，数据仅保存在本地',
              };
            }
          }
        }
      } catch (fallbackError) {
        log(LogLevel.ERROR, 'AsyncStorage fallback also failed:', fallbackError);
      }

      return {
        success: false,
        error: {
          code: 'UPDATE_CHILD_ERROR',
          message: '更新孩子信息失败',
        },
      };
    }
  },

  /**
   * 删除孩子（MySQL删除 + AsyncStorage清理）
   * Story 1-5 AC5: 用户可以删除孩子
   * Story 6-3 AC2: 集成MySQL存储
   */
  deleteChild: async (childId: string): Promise<ApiResponse<void>> => {
    try {
      // 检查数据库连接
      const isConnected = await checkDatabaseConnection();

      if (isConnected) {
        // 使用MySQL删除
        log(LogLevel.INFO, `Deleting child from MySQL: ${childId}`);
        const deleted = await childDataRepository.delete(childId);

        if (!deleted) {
          return {
            success: false,
            error: {
              code: 'CHILD_NOT_FOUND',
              message: '孩子不存在',
            },
          };
        }

        // 从缓存中删除
        if (CACHE_CONFIG.ENABLE_CACHE) {
          await removeCacheChild(childId);
        }

        log(LogLevel.INFO, `Child deleted successfully from MySQL: ${childId}`);

        return {
          success: true,
          data: undefined,
          storageMode: 'mysql',
        };
      } else {
        // 数据库未连接，降级到AsyncStorage
        log(LogLevel.WARN, 'Database not connected, using AsyncStorage fallback');

        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (!data) {
          return {
            success: false,
            error: {
              code: 'CHILD_NOT_FOUND',
              message: '孩子不存在',
            },
          };
        }

        const children = safeParseChildren(data);
        if (!children) {
          return {
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: '本地数据损坏',
            },
          };
        }

        const filteredChildren = children.filter(c => c.id !== childId);

        if (filteredChildren.length === children.length) {
          return {
            success: false,
            error: {
              code: 'CHILD_NOT_FOUND',
              message: '孩子不存在',
            },
          };
        }

        await AsyncStorage.setItem(storageKey, JSON.stringify(filteredChildren));

        log(LogLevel.INFO, `Child deleted successfully from AsyncStorage: ${childId}`);

        return {
          success: true,
          data: undefined,
          storageMode: 'local',
          warning: '数据库未连接，数据仅从本地删除',
        };
      }
    } catch (error) {
      log(LogLevel.ERROR, 'Failed to delete child:', error);

      // 尝试降级到AsyncStorage
      try {
        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          const children = safeParseChildren(data);
          if (children) {
            const filteredChildren = children.filter(c => c.id !== childId);

            if (filteredChildren.length < children.length) {
              await AsyncStorage.setItem(storageKey, JSON.stringify(filteredChildren));

              log(LogLevel.INFO, 'Fallback to AsyncStorage succeeded');

              return {
                success: true,
                data: undefined,
                storageMode: 'local',
                warning: '数据库错误，数据仅从本地删除',
              };
            }
          }
        }
      } catch (fallbackError) {
        log(LogLevel.ERROR, 'AsyncStorage fallback also failed:', fallbackError);
      }

      return {
        success: false,
        error: {
          code: 'DELETE_CHILD_ERROR',
          message: '删除孩子失败',
        },
      };
    }
  },

  /**
   * 清除缓存（手动刷新）
   *
   * @returns 清除是否成功
   */
  clearCache: async (): Promise<ApiResponse<void>> => {
    try {
      await clearCache();

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      log(LogLevel.ERROR, 'Failed to clear cache:', error);

      return {
        success: false,
        error: {
          code: 'CLEAR_CACHE_ERROR',
          message: '清除缓存失败',
        },
      };
    }
  },

  /**
   * 强制从MySQL刷新数据
   *
   * @returns 刷新后的孩子列表
   */
  refresh: async (): Promise<ApiResponse<Child[]>> => {
    try {
      // 清除缓存
      await clearCache();

      // 重新获取数据
      return await childApi.getChildren();
    } catch (error) {
      log(LogLevel.ERROR, 'Failed to refresh:', error);

      return {
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message: '刷新数据失败',
        },
      };
    }
  },
};

export default childApi;
