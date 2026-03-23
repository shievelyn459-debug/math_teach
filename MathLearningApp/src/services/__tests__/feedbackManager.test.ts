/**
 * Story 5-2: 反馈管理器测试
 * 测试 FeedbackManager 的所有功能
 */

import {
  feedbackManager,
  FeedbackType,
  FeedbackPosition,
  MilestoneType,
} from '../feedbackManager';

// Mock React Native
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  ToastAndroid: {
    show: jest.fn(),
    SHORT: 0,
  },
  Platform: {
    OS: 'android',
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, ToastAndroid} from 'react-native';

// Mock AsyncStorage methods
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
  removeItem: jest.fn(),
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    multiRemove: jest.fn(),
    getAllKeys: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('FeedbackManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 feedbackManager 状态到默认值
    feedbackManager.savePreferences({
      soundEnabled: false,
      vibrationEnabled: true,
      celebrationEnabled: true,
    });
  });

  describe('初始化', () => {
    it('应该加载保存的用户偏好', async () => {
      const mockPreferences = {
        soundEnabled: true,
        vibrationEnabled: false,
        celebrationEnabled: true,
      };
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      getItemMock.mockResolvedValue(JSON.stringify(mockPreferences));

      await feedbackManager.initialize();

      const prefs = feedbackManager.getPreferences();
      expect(prefs).toEqual(mockPreferences);
      getItemMock.mockClear();
    });

    it('应该使用默认值当没有保存的偏好时', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      getItemMock.mockResolvedValue(null);

      await feedbackManager.initialize();

      const prefs = feedbackManager.getPreferences();
      expect(prefs).toEqual({
        soundEnabled: false,
        vibrationEnabled: true,
        celebrationEnabled: true,
      });
      getItemMock.mockClear();
    });

    it('应该处理加载错误', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      getItemMock.mockRejectedValue(new Error('Storage error'));

      await expect(feedbackManager.initialize()).resolves.not.toThrow();
      getItemMock.mockClear();
    });
  });

  describe('保存偏好', () => {
    it('应该保存用户偏好到 AsyncStorage', async () => {
      const setItemMock = AsyncStorage.setItem as jest.Mock;
      setItemMock.mockResolvedValue(undefined);

      await feedbackManager.savePreferences({
        soundEnabled: true,
      });

      expect(setItemMock).toHaveBeenCalledWith(
        'feedback_preferences',
        expect.stringContaining('"soundEnabled":true')
      );
      setItemMock.mockClear();
    });

    it('应该合并新偏好与现有偏好', async () => {
      const setItemMock = AsyncStorage.setItem as jest.Mock;
      setItemMock.mockResolvedValue(undefined);

      await feedbackManager.savePreferences({
        soundEnabled: true,
      });

      const prefs = feedbackManager.getPreferences();
      expect(prefs.soundEnabled).toBe(true);
      expect(prefs.vibrationEnabled).toBe(true); // 保持原值
      setItemMock.mockClear();
    });
  });

  describe('显示 Toast', () => {
    it('应该在 Android 上显示 Toast', () => {
      feedbackManager.showToast('测试消息', FeedbackType.INFO);

      expect(ToastAndroid.show).toHaveBeenCalledWith(
        '测试消息',
        ToastAndroid.SHORT
      );
    });

    it('应该使用默认持续时间', () => {
      feedbackManager.showToast('测试消息');

      expect(ToastAndroid.show).toHaveBeenCalled();
    });

    it('应该使用自定义持续时间', () => {
      feedbackManager.showToast('测试消息', FeedbackType.INFO, {
        duration: 5000,
      });

      expect(ToastAndroid.show).toHaveBeenCalled();
    });
  });

  describe('显示成功消息', () => {
    it('应该显示成功类型的 Toast', () => {
      feedbackManager.showSuccess('操作成功');

      expect(ToastAndroid.show).toHaveBeenCalledWith(
        '操作成功',
        ToastAndroid.SHORT
      );
    });
  });

  describe('显示错误对话框', () => {
    it('应该显示带默认按钮的错误对话框', () => {
      feedbackManager.showErrorDialog('错误', '出错了');

      expect(Alert.alert).toHaveBeenCalledWith(
        '错误',
        '出错了',
        [{text: '确定', style: 'default', onPress: undefined}],
        expect.any(Object) // {cancelable: true}
      );
    });

    it('应该显示自定义按钮', () => {
      const buttons = [
        {text: '重试', onPress: jest.fn()},
        {text: '取消', style: 'cancel' as const},
      ];

      feedbackManager.showErrorDialog('错误', '出错了', buttons);

      expect(Alert.alert).toHaveBeenCalledWith(
        '错误',
        '出错了',
        [
          {text: '重试', onPress: buttons[0].onPress, style: undefined},
          {text: '取消', onPress: undefined, style: 'cancel'},
        ],
        {cancelable: true}
      );
    });
  });

  describe('网络错误', () => {
    it('应该显示网络错误对话框', () => {
      feedbackManager.showNetworkError();

      expect(Alert.alert).toHaveBeenCalledWith(
        '网络连接失败',
        '请检查网络设置后重试。您的数据已保存，不会丢失。',
        [{text: '确定', style: 'default', onPress: undefined}],
        expect.any(Object) // {cancelable: true}
      );
    });

    it('应该带重试按钮', () => {
      const onRetry = jest.fn();
      feedbackManager.showNetworkError(onRetry);

      expect(Alert.alert).toHaveBeenCalledWith(
        '网络连接失败',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({text: '重试', onPress: onRetry}),
        ]),
        expect.any(Object) // {cancelable: true}
      );
    });
  });

  describe('验证错误', () => {
    it('应该显示验证错误对话框', () => {
      feedbackManager.showValidationError('用户名', '用户名太短');

      expect(Alert.alert).toHaveBeenCalledWith(
        '用户名格式不正确',
        '用户名太短',
        [{text: '确定', style: 'default', onPress: undefined}],
        expect.any(Object) // {cancelable: true}
      );
    });
  });

  describe('庆祝', () => {
    it('应该显示庆祝消息当启用时', () => {
      feedbackManager.celebrate('太棒了！');

      expect(ToastAndroid.show).toHaveBeenCalled();
    });

    it('不应该显示庆祝消息当禁用时', async () => {
      await feedbackManager.savePreferences({celebrationEnabled: false});

      feedbackManager.celebrate('太棒了！');

      expect(ToastAndroid.show).not.toHaveBeenCalled();
    });
  });

  describe('里程碑检查', () => {
    it('应该庆祝第一次生成', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      const setItemMock = AsyncStorage.setItem as jest.Mock;
      getItemMock.mockResolvedValue(null);
      setItemMock.mockResolvedValue(undefined);

      const celebrated = await feedbackManager.checkMilestone(
        MilestoneType.FIRST_GENERATION,
        1
      );

      expect(celebrated).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith(
        'milestone_first_generation',
        'true'
      );
      getItemMock.mockClear();
      setItemMock.mockClear();
    });

    it('不应该重复庆祝同一里程碑', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      getItemMock.mockResolvedValue('true');

      const celebrated = await feedbackManager.checkMilestone(
        MilestoneType.FIRST_GENERATION,
        1
      );

      expect(celebrated).toBe(false);
      getItemMock.mockClear();
    });

    it('应该庆祝5次生成', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      const setItemMock = AsyncStorage.setItem as jest.Mock;
      getItemMock.mockResolvedValue(null);
      setItemMock.mockResolvedValue(undefined);

      const celebrated = await feedbackManager.checkMilestone(
        MilestoneType.FIVE_GENERATIONS,
        5
      );

      expect(celebrated).toBe(true);
      getItemMock.mockClear();
      setItemMock.mockClear();
    });

    it('应该庆祝10次生成', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      const setItemMock = AsyncStorage.setItem as jest.Mock;
      getItemMock.mockResolvedValue(null);
      setItemMock.mockResolvedValue(undefined);

      const celebrated = await feedbackManager.checkMilestone(
        MilestoneType.TEN_GENERATIONS,
        10
      );

      expect(celebrated).toBe(true);
      getItemMock.mockClear();
      setItemMock.mockClear();
    });

    it('应该庆祝50次生成', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      const setItemMock = AsyncStorage.setItem as jest.Mock;
      getItemMock.mockResolvedValue(null);
      setItemMock.mockResolvedValue(undefined);

      const celebrated = await feedbackManager.checkMilestone(
        MilestoneType.FIFTY_GENERATIONS,
        50
      );

      expect(celebrated).toBe(true);
      getItemMock.mockClear();
      setItemMock.mockClear();
    });

    it('应该在未达到里程碑时不庆祝', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      getItemMock.mockResolvedValue(null);

      const celebrated = await feedbackManager.checkMilestone(
        MilestoneType.FIVE_GENERATIONS,
        3
      );

      expect(celebrated).toBe(false);
      getItemMock.mockClear();
    });
  });

  describe('重置里程碑', () => {
    it('应该重置单个里程碑', async () => {
      const removeItemMock = AsyncStorage.removeItem as jest.Mock;
      removeItemMock.mockResolvedValue(undefined);

      await feedbackManager.resetMilestone(MilestoneType.FIRST_GENERATION);

      expect(removeItemMock).toHaveBeenCalledWith(
        'milestone_first_generation'
      );
      removeItemMock.mockClear();
    });

    it('应该重置所有里程碑', async () => {
      const getAllKeysMock = AsyncStorage.getAllKeys as jest.Mock;
      const multiRemoveMock = AsyncStorage.multiRemove as jest.Mock;
      getAllKeysMock.mockResolvedValue([
        'milestone_first_generation',
        'milestone_first_pdf',
        'other_key',
      ]);
      multiRemoveMock.mockResolvedValue(undefined);

      await feedbackManager.resetAllMilestones();

      expect(multiRemoveMock).toHaveBeenCalledWith([
        'milestone_first_generation',
        'milestone_first_pdf',
      ]);
      getAllKeysMock.mockClear();
      multiRemoveMock.mockClear();
    });
  });

  describe('友好错误消息格式化', () => {
    it('应该格式化网络错误', () => {
      const error = {isNetworkError: true};
      const message = feedbackManager.formatErrorMessage(error, '上传');

      expect(message).toBe('网络连接失败，请检查网络设置');
    });

    it('应该格式化超时错误', () => {
      const error = {message: 'Request timeout'};
      const message = feedbackManager.formatErrorMessage(error, '上传');

      expect(message).toBe('请求超时，请稍后重试');
    });

    it('应该格式化服务器错误', () => {
      const error = {status: 500};
      const message = feedbackManager.formatErrorMessage(error, '上传');

      expect(message).toBe('系统繁忙，请稍后再试。您的数据已保存。');
    });

    it('应该格式化认证错误', () => {
      const error = {status: 401};
      const message = feedbackManager.formatErrorMessage(error, '登录');

      expect(message).toBe('登录已过期，请重新登录');
    });

    it('应该格式化404错误', () => {
      const error = {status: 404};
      const message = feedbackManager.formatErrorMessage(error);

      expect(message).toBe('请求的资源不存在');
    });

    it('应该使用默认错误消息', () => {
      const error = {message: 'Unknown error'};
      const message = feedbackManager.formatErrorMessage(error, '操作');

      expect(message).toBe('操作失败：Unknown error');
    });

    it('应该截断过长的错误消息', () => {
      const error = {message: 'A'.repeat(100)};
      const message = feedbackManager.formatErrorMessage(error, '操作');

      expect(message).toBe('操作失败');
    });
  });

  describe('显示友好错误', () => {
    it('应该显示网络错误对话框', () => {
      const error = {isNetworkError: true};
      feedbackManager.showFriendlyError(error, '上传');

      expect(Alert.alert).toHaveBeenCalledWith(
        '网络连接失败',
        expect.any(String),
        expect.any(Array),
        expect.any(Object) // {cancelable: true}
      );
    });

    it('应该带重试回调显示错误', () => {
      const error = {message: 'Some error'};
      const onRetry = jest.fn();
      feedbackManager.showFriendlyError(error, '操作', onRetry);

      expect(Alert.alert).toHaveBeenCalledWith(
        '出错了',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({text: '重试', onPress: onRetry}),
        ]),
        expect.any(Object) // {cancelable: true}
      );
    });
  });

  describe('获取偏好', () => {
    it('应该返回偏好的副本', () => {
      const prefs1 = feedbackManager.getPreferences();
      const prefs2 = feedbackManager.getPreferences();

      expect(prefs1).not.toBe(prefs2);
      expect(prefs1).toEqual(prefs2);
    });
  });
});
