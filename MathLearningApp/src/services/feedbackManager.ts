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

  /**
   * 初始化：加载用户偏好
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load feedback preferences:', error);
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

    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // iOS 使用 Alert 作为轻提示
      // 实际项目中可以使用 react-native-toast-message 等库
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 显示成功消息
   * @param message 成功消息
   */
  showSuccess(message: string): void {
    this.showToast(message, FeedbackType.SUCCESS);
    // TODO: 添加成功音效
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
    try {
      const key = `milestone_${milestoneType}`;
      const celebrated = await AsyncStorage.getItem(key);

      if (celebrated === 'true') {
        return false; // 已庆祝过
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
      return '网络连接失败，请检查网络设置';
    }

    // 超时错误
    if (error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT') {
      return '请求超时，请稍后重试';
    }

    // 服务器错误
    if (error?.status >= 500) {
      return '系统繁忙，请稍后再试。您的数据已保存。';
    }

    // 认证错误
    if (error?.status === 401 || error?.code === 'AUTH_ERROR') {
      return '登录已过期，请重新登录';
    }

    // 权限错误
    if (error?.status === 403) {
      return '您没有权限执行此操作';
    }

    // 资源未找到
    if (error?.status === 404) {
      return '请求的资源不存在';
    }

    // 默认错误消息
    const baseMessage = context ? `${context}失败` : '操作失败';
    const errorMessage = error?.message || '';

    if (errorMessage && errorMessage.length < 50) {
      return `${baseMessage}：${errorMessage}`;
    }

    return baseMessage;
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

// 初始化
feedbackManager.initialize();
