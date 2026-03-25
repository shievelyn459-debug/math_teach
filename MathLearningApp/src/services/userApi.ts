/**
 * User API Helper Functions
 *
 * 提供用户相关的辅助函数
 * 这个文件是为了兼容childApi.ts中对getCurrentUserId的导入需求
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_USER_DATA_KEY = '@math_learning_user_data';

/**
 * 获取当前登录用户的ID
 *
 * @returns 用户ID或null（如果未登录）
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const userDataJson = await AsyncStorage.getItem(AUTH_USER_DATA_KEY);
    if (!userDataJson) {
      return null;
    }

    const userData = JSON.parse(userDataJson);
    return userData?.id || null;
  } catch (error) {
    console.error('[userApi] Failed to get current user ID:', error);
    return null;
  }
}
