/**
 * Child API - MySQL + AsyncStorage双模式实现
 *
 * Story 6-3: 孩子数据MySQL存储
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

// ==================== 验证函数 ====================

/**
 * 孩子姓名验证函数
 */
const validateChildName = (name: string): {isValid: boolean; error?: string} => {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return {isValid: false, error: '孩子姓名不能为空'};
  }
  if (trimmedName.length < 2) {
    return {isValid: false, error: '孩子姓名至少需要2个字符'};
  }
  if (trimmedName.length > 50) {
    return {isValid: false, error: '孩子姓名不能超过50个字符'};
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

  // 计算年龄：5-12岁之间适合小学1-6年级
  const ageInMs = now.getTime() - birthday.getTime();
  const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);

  if (ageInYears < 5) {
    return {isValid: false, error: '孩子年龄应至少5岁'};
  }
  if (ageInYears > 12) {
    return {isValid: false, error: '孩子年龄应不超过12岁'};
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
 */
async function getCacheVersionKey(): Promise<string> {
  const userId = await getCurrentUserId();
  return `@children_cache_version_${userId}`;
}

// ==================== 缓存管理 ====================

/**
 * 缓存策略配置
 */
const CACHE_CONFIG = {
  /** 缓存有效期（毫秒）- 5分钟 */
  CACHE_TTL: 5 * 60 * 1000,
  /** 是否启用缓存 */
  ENABLE_CACHE: true,
};

/**
 * 写入缓存
 */
async function writeCache(children: Child[]): Promise<void> {
  try {
    const storageKey = await getChildrenStorageKey();
    const versionKey = await getCacheVersionKey();

    // 写入孩子列表
    await AsyncStorage.setItem(storageKey, JSON.stringify(children));

    // 写入缓存版本（时间戳）
    await AsyncStorage.setItem(versionKey, Date.now().toString());

    console.log('[childApi] Cache written:', children.length, 'children');
  } catch (error) {
    console.error('[childApi] Failed to write cache:', error);
  }
}

/**
 * 读取缓存
 */
async function readCache(): Promise<Child[] | null> {
  try {
    const storageKey = await getChildrenStorageKey();
    const versionKey = await getCacheVersionKey();

    const [data, versionStr] = await Promise.all([
      AsyncStorage.getItem(storageKey),
      AsyncStorage.getItem(versionKey),
    ]);

    if (!data || !versionStr) {
      return null;
    }

    // 检查缓存是否过期
    const cacheTime = parseInt(versionStr, 10);
    const now = Date.now();

    if (now - cacheTime > CACHE_CONFIG.CACHE_TTL) {
      console.log('[childApi] Cache expired');
      return null;
    }

    // 解析数据并转换日期
    const children: Child[] = JSON.parse(data);
    children.forEach(child => {
      if (child.birthday) child.birthday = new Date(child.birthday);
      if (child.createdAt) child.createdAt = new Date(child.createdAt);
      if (child.updatedAt) child.updatedAt = new Date(child.updatedAt);
    });

    console.log('[childApi] Cache hit:', children.length, 'children');
    return children;
  } catch (error) {
    console.error('[childApi] Failed to read cache:', error);
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

    console.log('[childApi] Cache cleared');
  } catch (error) {
    console.error('[childApi] Failed to clear cache:', error);
  }
}

/**
 * 更新缓存中的单个孩子
 */
async function updateCacheChild(childId: string, updates: Partial<Child>): Promise<void> {
  try {
    const children = await readCache();
    if (!children) return;

    const index = children.findIndex(c => c.id === childId);
    if (index !== -1) {
      children[index] = { ...children[index], ...updates, updatedAt: new Date() };
      await writeCache(children);
    }
  } catch (error) {
    console.error('[childApi] Failed to update cache child:', error);
  }
}

/**
 * 从缓存中删除单个孩子
 */
async function removeCacheChild(childId: string): Promise<void> {
  try {
    const children = await readCache();
    if (!children) return;

    const filtered = children.filter(c => c.id !== childId);
    await writeCache(filtered);
  } catch (error) {
    console.error('[childApi] Failed to remove cache child:', error);
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

      // 首先尝试从缓存读取
      if (CACHE_CONFIG.ENABLE_CACHE) {
        const cachedChildren = await readCache();
        if (cachedChildren) {
          console.log('[childApi] Returning cached children');
          return {
            success: true,
            data: cachedChildren,
          };
        }
      }

      // 检查数据库连接
      const isConnected = await checkDatabaseConnection();

      if (!isConnected) {
        // 数据库未连接，尝试从AsyncStorage降级
        console.warn('[childApi] Database not connected, using AsyncStorage fallback');

        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (!data) {
          return {
            success: true,
            data: [],
          };
        }

        const children: Child[] = JSON.parse(data);
        children.forEach(child => {
          if (child.birthday) child.birthday = new Date(child.birthday);
          if (child.createdAt) child.createdAt = new Date(child.createdAt);
          if (child.updatedAt) child.updatedAt = new Date(child.updatedAt);
        });

        return {
          success: true,
          data: children,
        };
      }

      // 从MySQL获取数据
      console.log('[childApi] Fetching children from MySQL');
      const children = await childDataRepository.findByParentId(parentId);

      // 写入缓存
      if (CACHE_CONFIG.ENABLE_CACHE) {
        await writeCache(children);
      }

      return {
        success: true,
        data: children,
      };
    } catch (error) {
      console.error('[childApi] Failed to get children:', error);

      // 发生错误时，尝试从AsyncStorage降级
      try {
        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          const children: Child[] = JSON.parse(data);
          children.forEach(child => {
            if (child.birthday) child.birthday = new Date(child.birthday);
            if (child.createdAt) child.createdAt = new Date(child.createdAt);
            if (child.updatedAt) child.updatedAt = new Date(child.updatedAt);
          });

          console.log('[childApi] Fallback to AsyncStorage succeeded');
          return {
            success: true,
            data: children,
          };
        }
      } catch (fallbackError) {
        console.error('[childApi] AsyncStorage fallback also failed:', fallbackError);
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
   */
  addChild: async (childData: ChildCreateRequest): Promise<ApiResponse<Child>> => {
    try {
      // 客户端验证
      const nameValidation = validateChildName(childData.name);
      if (!nameValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: nameValidation.error!,
          },
        };
      }

      const gradeValidation = validateChildGrade(childData.grade);
      if (!gradeValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: gradeValidation.error!,
          },
        };
      }

      const birthdayValidation = validateChildBirthday(childData.birthday);
      if (!birthdayValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: birthdayValidation.error!,
          },
        };
      }

      const parentId = await getCurrentUserId();

      // 检查数据库连接
      const isConnected = await checkDatabaseConnection();

      if (isConnected) {
        // 使用MySQL存储
        console.log('[childApi] Adding child to MySQL');
        const newChild = await childDataRepository.create(parentId, childData);

        // 更新缓存
        if (CACHE_CONFIG.ENABLE_CACHE) {
          const cachedChildren = await readCache();
          const updatedChildren = cachedChildren ? [...cachedChildren, newChild] : [newChild];
          await writeCache(updatedChildren);
        }

        console.log('[childApi] Child added successfully to MySQL:', newChild.id);

        return {
          success: true,
          data: newChild,
        };
      } else {
        // 数据库未连接，降级到AsyncStorage
        console.warn('[childApi] Database not connected, using AsyncStorage fallback');

        // 生成UUID
        const newChild: Child = {
          id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          parentId,
          name: childData.name.trim(),
          grade: childData.grade,
          birthday: childData.birthday,
          avatar: childData.avatar,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);
        const existingChildren: Child[] = data ? JSON.parse(data) : [];

        existingChildren.push(newChild);
        await AsyncStorage.setItem(storageKey, JSON.stringify(existingChildren));

        console.log('[childApi] Child added successfully to AsyncStorage:', newChild.id);

        return {
          success: true,
          data: newChild,
        };
      }
    } catch (error) {
      console.error('[childApi] Failed to add child:', error);

      // 尝试降级到AsyncStorage
      try {
        const parentId = await getCurrentUserId();

        const newChild: Child = {
          id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          parentId,
          name: childData.name.trim(),
          grade: childData.grade,
          birthday: childData.birthday,
          avatar: childData.avatar,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);
        const existingChildren: Child[] = data ? JSON.parse(data) : [];

        existingChildren.push(newChild);
        await AsyncStorage.setItem(storageKey, JSON.stringify(existingChildren));

        console.log('[childApi] Fallback to AsyncStorage succeeded');

        return {
          success: true,
          data: newChild,
        };
      } catch (fallbackError) {
        console.error('[childApi] AsyncStorage fallback also failed:', fallbackError);

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
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: nameValidation.error!,
            },
          };
        }
      }

      if (updates.grade !== undefined) {
        const gradeValidation = validateChildGrade(updates.grade);
        if (!gradeValidation.isValid) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: gradeValidation.error!,
            },
          };
        }
      }

      if (updates.birthday !== undefined) {
        const birthdayValidation = validateChildBirthday(updates.birthday);
        if (!birthdayValidation.isValid) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: birthdayValidation.error!,
            },
          };
        }
      }

      // 检查数据库连接
      const isConnected = await checkDatabaseConnection();

      if (isConnected) {
        // 使用MySQL更新
        console.log('[childApi] Updating child in MySQL');
        const updatedChild = await childDataRepository.update(childId, updates);

        // 更新缓存
        if (CACHE_CONFIG.ENABLE_CACHE) {
          await updateCacheChild(childId, updatedChild);
        }

        console.log('[childApi] Child updated successfully in MySQL:', childId);

        return {
          success: true,
          data: updatedChild,
        };
      } else {
        // 数据库未连接，降级到AsyncStorage
        console.warn('[childApi] Database not connected, using AsyncStorage fallback');

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

        const children: Child[] = JSON.parse(data);
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
        const updatedChild = {
          ...children[childIndex],
          ...updates,
          updatedAt: new Date(),
        };

        children[childIndex] = updatedChild;
        await AsyncStorage.setItem(storageKey, JSON.stringify(children));

        console.log('[childApi] Child updated successfully in AsyncStorage:', childId);

        return {
          success: true,
          data: updatedChild,
        };
      }
    } catch (error) {
      console.error('[childApi] Failed to update child:', error);

      // 尝试降级到AsyncStorage
      try {
        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          const children: Child[] = JSON.parse(data);
          const childIndex = children.findIndex(c => c.id === childId);

          if (childIndex !== -1) {
            const updatedChild = {
              ...children[childIndex],
              ...updates,
              updatedAt: new Date(),
            };

            children[childIndex] = updatedChild;
            await AsyncStorage.setItem(storageKey, JSON.stringify(children));

            console.log('[childApi] Fallback to AsyncStorage succeeded');

            return {
              success: true,
              data: updatedChild,
            };
          }
        }
      } catch (fallbackError) {
        console.error('[childApi] AsyncStorage fallback also failed:', fallbackError);
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
        console.log('[childApi] Deleting child from MySQL');
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

        console.log('[childApi] Child deleted successfully from MySQL:', childId);

        return {
          success: true,
          data: undefined,
        };
      } else {
        // 数据库未连接，降级到AsyncStorage
        console.warn('[childApi] Database not connected, using AsyncStorage fallback');

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

        const children: Child[] = JSON.parse(data);
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

        console.log('[childApi] Child deleted successfully from AsyncStorage:', childId);

        return {
          success: true,
          data: undefined,
        };
      }
    } catch (error) {
      console.error('[childApi] Failed to delete child:', error);

      // 尝试降级到AsyncStorage
      try {
        const storageKey = await getChildrenStorageKey();
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          const children: Child[] = JSON.parse(data);
          const filteredChildren = children.filter(c => c.id === childId);

          if (filteredChildren.length < children.length) {
            await AsyncStorage.setItem(storageKey, JSON.stringify(filteredChildren));

            console.log('[childApi] Fallback to AsyncStorage succeeded');

            return {
              success: true,
              data: undefined,
            };
          }
        }
      } catch (fallbackError) {
        console.error('[childApi] AsyncStorage fallback also failed:', fallbackError);
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
      console.error('[childApi] Failed to clear cache:', error);

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
      console.error('[childApi] Failed to refresh:', error);

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
