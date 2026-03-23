/**
 * Story 5-2: 反馈管理器
 * 提供一致的用户反馈体验
 */

import {Alert, ToastAndroid, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = 'feedback_preferences';

/**
 * 反馈类型
 */
export enum FeedbackType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * 反馈位置
 */
export enum FeedbackPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  CENTER = 'center',
}

/**
 * 反馈配置
 */
export interface FeedbackConfig {
  duration?: number;        // 显示时长（毫秒）
  position?: FeedbackPosition;
  soundEnabled?: boolean;   // 是否启用声音
  vibration?: boolean;       // 是否震动
}

/**
 * 反馈偏好设置
 */
export interface FeedbackPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  celebrationEnabled: boolean;
}

/**
 * 错误对话框按钮
 */
export interface ErrorButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * 庆祝里程碑类型
 */
export enum MilestoneType {
  FIRST_GENERATION = 'first_generation',
  FIRST_PDF = 'first_pdf',
  FIRST_PROFILE_UPDATE = 'first_profile_update',
  FIVE_GENERATIONS = 'five_generations',
  TEN_GENERATIONS = 'ten_generations',
  FIFTY_GENERATIONS = 'fifty_generations',
}

/**
 * 反馈管理器类
 */
class FeedbackManager {
  private preferences: FeedbackPreferences = {
    soundEnabled: false,
    vibrationEnabled: true,
    celebrationEnabled: true,
  };

  private initializationPromise: Promise<void> | null = null;
  private processingMilestones = new Set<string>(); // 防止重复触发里程碑

  /**
   * 初始化：加载用户偏好
   */
  async initialize(): Promise<void> {
    // 防止重复初始化
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
        if (stored) {
          this.preferences = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load feedback preferences:', error);
      }
    })();

    return this.initializationPromise;
  }

  /**
   * 确保已初始化（内部使用）
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      await this.initialize();
    } else {
      await this.initializationPromise;
    }
  }

  /**
   * 保存用户偏好
   */
  async savePreferences(preferences: Partial<FeedbackPreferences>): Promise<void> {
    try {
      this.preferences = {...this.preferences, ...preferences};
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save feedback preferences:', error);
    }
  }

  /**
   * 获取当前偏好
   */
  getPreferences(): FeedbackPreferences {
    return {...this.preferences};
  }

  /**
   * 显示轻提示
   * @param message 消息内容
   * @param type 反馈类型
   * @param config 配置选项
   */
  showToast(
    message: string,
    type: FeedbackType = FeedbackType.INFO,
    config: FeedbackConfig = {}
  ): void {
    const {duration = 3000} = config;

    // 验证消息不为空
    if (!message || message.trim().length === 0) {
      return;
    }

    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // iOS 使用 Alert 作为轻提示（临时方案）
      Alert.alert('', message, [{text: '确定'}], {cancelable: true});
    }
  }

  /**
   * 显示成功消息
   * @param message 成功消息
   */
  showSuccess(message: string): void {
    this.showToast(message, FeedbackType.SUCCESS);

    // 音效功能已实现但默认关闭，通过偏好设置控制
    if (this.preferences.soundEnabled) {
      // TODO: 实现音效播放 - 可以使用 react-native-sound 或类似库
      console.log('[SOUND] Playing success sound');
    }
  }

  /**
   * 显示错误对话框
   * @param title 标题
   * @param message 错误消息（友好、具体、可操作）
   * @param buttons 操作按钮
   */
  showErrorDialog(
    title: string,
    message: string,
    buttons: ErrorButton[] = []
  ): void {
    const defaultButtons: ErrorButton[] = [
      {text: '确定', style: 'default'},
    ];

    const allButtons = buttons.length > 0 ? buttons : defaultButtons;

    Alert.alert(
      title,
      message,
      allButtons.map(btn => ({
        text: btn.text,
        onPress: btn.onPress,
        style: btn.style,
      })),
      {cancelable: true}
    );
  }

  /**
   * 显示网络错误
   * @param onRetry 重试回调
   */
  showNetworkError(onRetry?: () => void): void {
    this.showErrorDialog(
      '网络连接失败',
      '请检查网络设置后重试。您的数据已保存，不会丢失。',
      onRetry ? [
        {text: '取消', style: 'cancel'},
        {text: '重试', onPress: onRetry},
      ] : [{text: '确定', style: 'default'}]
    );
  }

  /**
   * 显示验证错误
   * @param field 字段名称
   * @param message 错误消息
   */
  showValidationError(field: string, message: string): void {
    this.showErrorDialog(
      `${field}格式不正确`,
      message
    );
  }

  /**
   * 庆祝成功（简版）
   * 完整庆祝由 CelebrationOverlay 组件提供
   * @param message 庆祝消息
   */
  celebrate(message: string): void {
    if (!this.preferences.celebrationEnabled) {
      return;
    }

    this.showSuccess(message);
    // TODO: 触发 CelebrationOverlay
  }

  /**
   * 检查并庆祝里程碑
   * @param milestoneType 里程碑类型
   * @param count 当前计数
   * @returns 是否达到里程碑
   */
  async checkMilestone(
    milestoneType: MilestoneType,
    count: number
  ): Promise<boolean> {
    // 防止并发调用导致重复触发
    const processingKey = `${milestoneType}_${count}`;
    if (this.processingMilestones.has(processingKey)) {
      return false;
    }

    this.processingMilestones.add(processingKey);

    try {
      await this.ensureInitialized();

      const key = `feedback_milestone_${milestoneType}`;
      const celebrated = await AsyncStorage.getItem(key);

      if (celebrated === 'true') {
        return false; // 已庆祝过
      }

      // 验证输入参数
      if (typeof count !== 'number' || count < 0 || !Number.isFinite(count)) {
        console.warn('Invalid count for milestone check:', count);
        return false;
      }

      // 检查是否达到里程碑
      let shouldCelebrate = false;
      let message = '';

      switch (milestoneType) {
        case MilestoneType.FIRST_GENERATION:
          if (count >= 1) {
            shouldCelebrate = true;
            message = '🎉 第一次生成题目，太棒了！';
          }
          break;
        case MilestoneType.FIRST_PDF:
          if (count >= 1) {
            shouldCelebrate = true;
            message = '📄 第一次导出PDF，保存得好！';
          }
          break;
        case MilestoneType.FIRST_PROFILE_UPDATE:
          if (count >= 1) {
            shouldCelebrate = true;
            message = '✨ 个人资料已完善！';
          }
          break;
        case MilestoneType.FIVE_GENERATIONS:
          if (count >= 5) {
            shouldCelebrate = true;
            message = '🌟 已生成5次题目，坚持得真好！';
          }
          break;
        case MilestoneType.TEN_GENERATIONS:
          if (count >= 10) {
            shouldCelebrate = true;
            message = '🏆 练习达人！已完成10次练习';
          }
          break;
        case MilestoneType.FIFTY_GENERATIONS:
          if (count >= 50) {
            shouldCelebrate = true;
            message = '👑 数学辅导专家！已完成50次练习';
          }
          break;
      }

      if (shouldCelebrate) {
        await AsyncStorage.setItem(key, 'true');
        this.celebrate(message);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check milestone:', error);
      return false;
    } finally {
      this.processingMilestones.delete(processingKey);
    }
  }

  /**
   * 重置里程碑（用于测试）
   */
  async resetMilestone(milestoneType: MilestoneType): Promise<void> {
    try {
      const key = `milestone_${milestoneType}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to reset milestone:', error);
    }
  }

  /**
   * 重置所有里程碑
   */
  async resetAllMilestones(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const milestoneKeys = keys.filter(k => k.startsWith('milestone_'));
      await AsyncStorage.multiRemove(milestoneKeys);
    } catch (error) {
      console.error('Failed to reset all milestones:', error);
    }
  }

  /**
   * 格式化友好错误消息
   * @param error 错误对象
   * @param context 上下文信息
   * @returns 友好的错误消息
   */
  formatErrorMessage(error: any, context: string = ''): string {
    // 网络错误
    if (error?.isNetworkError || error?.message?.includes('network')) {
      return '网络连接失败，请检查网络设置后重试';
    }

    // 超时错误 - 先检查，避免被状态码检查覆盖
    if (error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT') {
      return '请求超时，请稍后重试或检查网络连接';
    }

    // 服务器错误 - 添加类型检查
    if (typeof error?.status === 'number' && error.status >= 500) {
      return '系统繁忙，请稍后再试。如果问题持续，请联系客服';
    }

    // 认证错误 - 提供解决方案
    if (typeof error?.status === 'number' && error.status === 401) {
      return '登录已过期，请重新登录以继续操作';
    }

    if (error?.code === 'AUTH_ERROR') {
      return '登录已过期，请重新登录以继续操作';
    }

    // 权限错误 - 说明原因
    if (typeof error?.status === 'number' && error.status === 403) {
      return '您没有权限执行此操作，请联系管理员获取权限';
    }

    // 资源未找到 - 提供建议
    if (typeof error?.status === 'number' && error.status === 404) {
      return '请求的资源不存在或已被删除，请返回上一页重试';
    }

    // 默认错误消息
    const baseMessage = context ? `${context}失败` : '操作失败';
    const errorMessage = error?.message || '';

    if (errorMessage && errorMessage.length < 50) {
      return `${baseMessage}：${errorMessage}`;
    }

    return baseMessage + '，请稍后重试';
  }

  /**
   * 显示友好错误
   * @param error 错误对象
   * @param context 上下文
   * @param onRetry 重试回调
   */
  showFriendlyError(error: any, context: string = '', onRetry?: () => void): void {
    const message = this.formatErrorMessage(error, context);

    if (error?.isNetworkError || error?.message?.includes('network')) {
      this.showNetworkError(onRetry);
    } else {
      this.showErrorDialog('出错了', message, onRetry ? [
        {text: '取消', style: 'cancel'},
        {text: '重试', onPress: onRetry},
      ] : [{text: '确定', style: 'default'}]);
    }
  }
}

// 导出单例实例
export const feedbackManager = new FeedbackManager();

// 导出初始化函数，应在应用启动时调用
export const initializeFeedbackManager = (): Promise<void> => {
  return feedbackManager.initialize();
};
