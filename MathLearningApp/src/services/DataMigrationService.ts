/**
 * 数据迁移服务
 *
 * Story 6-2 P1-2修复: 缺少数据库迁移策略
 *
 * 功能：
 * - 从AsyncStorage迁移到MySQL
 * - 检测并迁移离线创建的用户
 * - 处理迁移冲突
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {userDataRepository} from './mysql/UserDataRepository';
import {checkDatabaseConnection} from './mysql/prismaClient';
import {User} from '../types';
import {logger} from '../utils/logger';

/**
 * 用户数据前缀（AsyncStorage）
 */
const USERS_PREFIX = '@math_learning_users_';

/**
 * 迁移状态
 */
export interface MigrationStatus {
  totalUsers: number;
  migratedUsers: number;
  failedUsers: number;
  skippedUsers: number;
  errors: Array<{email: string; error: string}>;
}

/**
 * 数据迁移服务类
 */
class DataMigrationService {
  private static instance: DataMigrationService;

  private constructor() {}

  public static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  /**
   * 获取所有AsyncStorage中的用户
   */
  private async getAllLocalUsers(): Promise<Array<{email: string; data: any}>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter(key => key.startsWith(USERS_PREFIX));

      if (userKeys.length === 0) {
        return [];
      }

      const users = await AsyncStorage.multiGet(userKeys);
      return users
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => ({
          email: key.replace(USERS_PREFIX, ''),
          data: JSON.parse(value as string),
        }));
    } catch (error) {
      logger.error('DataMigrationService', 'Failed to get local users', error as Error);
      return [];
    }
  }

  /**
   * 迁移单个用户到MySQL
   */
  private async migrateUser(
    email: string,
    userData: {user: User; passwordHash: string}
  ): Promise<{success: boolean; reason?: string}> {
    try {
      // 检查用户是否已存在于MySQL
      const existing = await userDataRepository.findByEmail(email);
      if (existing) {
        return {success: false, reason: 'User already exists in MySQL'};
      }

      // 创建用户到MySQL
      await userDataRepository.create({
        userId: userData.user.id,
        email: email,
        passwordHash: userData.passwordHash,
        name: userData.user.name,
        phone: userData.user.phone,
      });

      logger.info('DataMigrationService', `Migrated user: ${email}`);
      return {success: true};
    } catch (error) {
      logger.error('DataMigrationService', `Failed to migrate user: ${email}`, error as Error);
      return {success: false, reason: (error as Error).message};
    }
  }

  /**
   * 执行迁移
   * @returns 迁移状态
   */
  async migrateToMySQL(): Promise<MigrationStatus> {
    logger.info('DataMigrationService', 'Starting migration to MySQL...');

    // 首先检查MySQL是否可用
    const isMySQLAvailable = await checkDatabaseConnection();
    if (!isMySQLAvailable) {
      logger.warn('DataMigrationService', 'MySQL unavailable, migration aborted');
      return {
        totalUsers: 0,
        migratedUsers: 0,
        failedUsers: 0,
        skippedUsers: 0,
        errors: [],
      };
    }

    const localUsers = await this.getAllLocalUsers();
    const status: MigrationStatus = {
      totalUsers: localUsers.length,
      migratedUsers: 0,
      failedUsers: 0,
      skippedUsers: 0,
      errors: [],
    };

    for (const {email, data} of localUsers) {
      const result = await this.migrateUser(email, data);

      if (result.success) {
        status.migratedUsers++;
        // 迁移成功后，可以保留或删除本地数据
        // 这里选择保留作为备份
      } else if (result.reason === 'User already exists in MySQL') {
        status.skippedUsers++;
      } else {
        status.failedUsers++;
        status.errors.push({email, error: result.reason || 'Unknown error'});
      }
    }

    logger.info('DataMigrationService', `Migration complete: ${status.migratedUsers}/${status.totalUsers} users migrated`);

    return status;
  }

  /**
   * 检查是否有需要迁移的用户
   */
  async hasPendingMigration(): Promise<boolean> {
    const localUsers = await this.getAllLocalUsers();
    return localUsers.length > 0;
  }

  /**
   * 获取待迁移用户数量
   */
  async getPendingMigrationCount(): Promise<number> {
    const localUsers = await this.getAllLocalUsers();
    return localUsers.length;
  }
}

// 导出单例
export const dataMigrationService = DataMigrationService.getInstance();
