/**
 * Story 1-5: Active Child Service
 * Manages the active child selection and persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Child, Grade} from '../types';

/**
 * 存储键
 */
const ACTIVE_CHILD_ID_KEY = '@math_learning_active_child_id';
const ACTIVE_CHILD_DATA_KEY = '@math_learning_active_child_data';

/**
 * 活跃孩子变化监听器类型
 */
type ActiveChildListener = (child: Child | null) => void;

/**
 * 活跃孩子服务类
 * 负责活跃孩子的选择、持久化和通知
 */
class ActiveChildService {
  private static instance: ActiveChildService;
  private activeChild: Child | null = null;
  private listeners: ActiveChildListener[] = [];
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.initPromise = this.initialize();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ActiveChildService {
    if (!ActiveChildService.instance) {
      ActiveChildService.instance = new ActiveChildService();
    }
    return ActiveChildService.instance;
  }

  /**
   * 等待初始化完成
   */
  async waitForInitialization(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  /**
   * 初始化：从AsyncStorage恢复活跃孩子
   */
  private async initialize(): Promise<void> {
    try {
      const childData = await AsyncStorage.getItem(ACTIVE_CHILD_DATA_KEY);
      if (childData) {
        const parsed = JSON.parse(childData);
        // 将日期字符串转换回 Date 对象
        if (parsed.birthday) {
          parsed.birthday = new Date(parsed.birthday);
        }
        if (parsed.createdAt) {
          parsed.createdAt = new Date(parsed.createdAt);
        }
        if (parsed.updatedAt) {
          parsed.updatedAt = new Date(parsed.updatedAt);
        }
        this.activeChild = parsed;
      }
    } catch (error) {
      console.error('[ActiveChildService] Failed to initialize:', error);
      this.activeChild = null;
    }
  }

  /**
   * 获取活跃孩子
   */
  getActiveChild(): Child | null {
    return this.activeChild;
  }

  /**
   * 获取活跃孩子的ID
   */
  getActiveChildId(): string | null {
    return this.activeChild?.id || null;
  }

  /**
   * 获取活跃孩子的年级
   * 用于题目生成和难度调整
   */
  getActiveChildGrade(): Grade | null {
    return this.activeChild?.grade || null;
  }

  /**
   * 设置活跃孩子
   * @param child 要设置为活跃的孩子
   * @param availableChildren 所有可用孩子列表（用于验证）
   */
  async setActiveChild(
    child: Child | null,
    availableChildren?: Child[]
  ): Promise<{success: boolean; error?: string}> {
    try {
      // 如果设置为null，清除活跃孩子
      if (child === null) {
        await this.clearActiveChild();
        return {success: true};
      }

      // 验证孩子是否在可用列表中
      if (availableChildren) {
        const isValid = availableChildren.some(c => c.id === child.id);
        if (!isValid) {
          return {
            success: false,
            error: '选择的孩子不存在',
          };
        }
      }

      // 保存到AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(ACTIVE_CHILD_ID_KEY, child.id),
        AsyncStorage.setItem(ACTIVE_CHILD_DATA_KEY, JSON.stringify(child)),
      ]);

      this.activeChild = child;
      this.notifyListeners(child);

      console.log('[ActiveChildService] Active child set:', child.name, child.grade);
      return {success: true};
    } catch (error) {
      console.error('[ActiveChildService] Failed to set active child:', error);
      return {
        success: false,
        error: '设置活跃孩子失败',
      };
    }
  }

  /**
   * 清除活跃孩子
   */
  async clearActiveChild(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACTIVE_CHILD_ID_KEY),
        AsyncStorage.removeItem(ACTIVE_CHILD_DATA_KEY),
      ]);

      this.activeChild = null;
      this.notifyListeners(null);

      console.log('[ActiveChildService] Active child cleared');
    } catch (error) {
      console.error('[ActiveChildService] Failed to clear active child:', error);
    }
  }

  /**
   * 处理活跃孩子被删除的情况
   * 当活跃孩子被删除时，需要选择新的活跃孩子或清除
   * @param deletedChildId 被删除的孩子ID
   * @param remainingChildren 剩余的孩子列表
   * @returns 新的活跃孩子或null
   */
  async handleDeletedChild(
    deletedChildId: string,
    remainingChildren: Child[]
  ): Promise<Child | null> {
    // 如果删除的不是活跃孩子，无需处理
    if (this.activeChild?.id !== deletedChildId) {
      return this.activeChild;
    }

    // 删除的是活跃孩子，需要选择新的
    if (remainingChildren.length === 0) {
      // 没有剩余孩子，清除活跃孩子
      await this.clearActiveChild();
      return null;
    }

    // 默认选择第一个孩子作为新的活跃孩子
    const newActiveChild = remainingChildren[0];
    await this.setActiveChild(newActiveChild);
    return newActiveChild;
  }

  /**
   * 监听活跃孩子变化
   */
  onActiveChildChanged(callback: ActiveChildListener): () => void {
    this.listeners.push(callback);

    // 立即返回当前状态
    callback(this.activeChild);

    // 返回取消监听函数
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(child: Child | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(child);
      } catch (error) {
        console.error('[ActiveChildService] Listener error:', error);
      }
    });
  }

  /**
   * 获取年级显示名称（中文）
   */
  static getGradeDisplayName(grade: Grade): string {
    const gradeNames: Record<Grade, string> = {
      [Grade.GRADE_1]: '一年级',
      [Grade.GRADE_2]: '二年级',
      [Grade.GRADE_3]: '三年级',
      [Grade.GRADE_4]: '四年级',
      [Grade.GRADE_5]: '五年级',
      [Grade.GRADE_6]: '六年级',
    };
    return gradeNames[grade] || `${grade}年级`;
  }

  /**
   * 获取所有有效年级列表
   */
  static getAllGrades(): Grade[] {
    return [
      Grade.GRADE_1,
      Grade.GRADE_2,
      Grade.GRADE_3,
      Grade.GRADE_4,
      Grade.GRADE_5,
      Grade.GRADE_6,
    ];
  }

  /**
   * 根据年级获取对应的难度范围
   * 用于题目生成时的难度调整
   */
  static getGradeDifficultyRange(grade: Grade): {min: number; max: number} {
    const ranges: Record<Grade, {min: number; max: number}> = {
      [Grade.GRADE_1]: {min: 1, max: 3},
      [Grade.GRADE_2]: {min: 2, max: 4},
      [Grade.GRADE_3]: {min: 3, max: 5},
      [Grade.GRADE_4]: {min: 4, max: 6},
      [Grade.GRADE_5]: {min: 5, max: 7},
      [Grade.GRADE_6]: {min: 6, max: 8},
    };
    return ranges[grade] || {min: 1, max: 3};
  }
}

// 导出单例实例
export const activeChildService = ActiveChildService.getInstance();
export default activeChildService;
