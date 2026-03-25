/**
 * Story 1-5: Active Child Service
 * Story 6-3: MySQL Integration (P0-4 fix)
 *
 * Manages the active child selection and persistence.
 * - UI state (selected child ID) stored in AsyncStorage (device-specific)
 * - Child data fetched from MySQL for freshness
 * - Validates selected child still exists in MySQL
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Child, Grade} from '../types';
import {getChildren} from './childApi';

/**
 * 存储键 - 仅存储活跃孩子ID（UI状态）
 */
const ACTIVE_CHILD_ID_KEY = '@math_learning_active_child_id';

/**
 * 活跃孩子变化监听器类型
 */
type ActiveChildListener = (child: Child | null) => void;

/**
 * 活跃孩子服务类
 * 负责活跃孩子的选择、持久化和通知
 *
 * P0-4修复: 集成MySQL，确保活跃孩子数据新鲜
 */
class ActiveChildService {
  private static instance: ActiveChildService;
  private activeChild: Child | null = null;
  private activeChildId: string | null = null;
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
   * 初始化：从AsyncStorage恢复活跃孩子ID，并从MySQL获取最新数据
   * P0-4修复: 不再从AsyncStorage读取缓存数据，改为从MySQL获取
   */
  private async initialize(): Promise<void> {
    try {
      const childId = await AsyncStorage.getItem(ACTIVE_CHILD_ID_KEY);
      if (childId) {
        // P0-4: 从MySQL获取最新数据，验证孩子是否还存在
        const response = await getChildren();
        if (response.success && response.data) {
          const child = response.data.find(c => c.id === childId);
          if (child) {
            // 孩子仍然存在，使用MySQL中的最新数据
            this.activeChildId = childId;
            this.activeChild = child;
            console.log('[ActiveChildService] Active child restored from MySQL:', child.name);
          } else {
            // 孩子已被删除，清除本地状态
            await this.clearActiveChild();
            console.warn('[ActiveChildService] Previously active child no longer exists in MySQL');
          }
        } else {
          // MySQL查询失败，但保留ID（可能离线状态）
          this.activeChildId = childId;
          console.warn('[ActiveChildService] MySQL unavailable, keeping child ID for later validation');
        }
      }
    } catch (error) {
      console.error('[ActiveChildService] Failed to initialize:', error);
      this.activeChild = null;
      this.activeChildId = null;
    }
  }

  /**
   * 刷新活跃孩子数据（从MySQL获取最新数据）
   * P0-4新增: 用于主动刷新活跃孩子数据
   */
  async refreshActiveChild(): Promise<void> {
    if (!this.activeChildId) {
      return;
    }

    try {
      const response = await getChildren();
      if (response.success && response.data) {
        const child = response.data.find(c => c.id === this.activeChildId);
        if (child) {
          const oldChild = this.activeChild;
          this.activeChild = child;
          // 只有数据真正变化时才通知监听器
          if (JSON.stringify(oldChild) !== JSON.stringify(child)) {
            this.notifyListeners(child);
            console.log('[ActiveChildService] Active child refreshed from MySQL');
          }
        } else {
          // 孩子已被删除
          await this.clearActiveChild();
          console.warn('[ActiveChildService] Active child was deleted, cleared');
        }
      }
    } catch (error) {
      console.error('[ActiveChildService] Failed to refresh active child:', error);
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
    return this.activeChildId || this.activeChild?.id || null;
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
   * @param child 要设置为活跃的孩子（必须是从MySQL获取的最新数据）
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

      // P0-4修复: 只存储ID到AsyncStorage，不再存储完整数据
      await AsyncStorage.setItem(ACTIVE_CHILD_ID_KEY, child.id);

      this.activeChildId = child.id;
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
      await AsyncStorage.removeItem(ACTIVE_CHILD_ID_KEY);

      this.activeChildId = null;
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
    if (this.activeChildId !== deletedChildId && this.activeChild?.id !== deletedChildId) {
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
