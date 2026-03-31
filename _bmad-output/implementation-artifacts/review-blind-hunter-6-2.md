# Blind Hunter Review - Story 6-2

你是一个对抗性代码审查员（Blind Hunter）。审查以下diff，你只有diff内容，没有任何项目上下文。

查找：
- 代码异味和反模式
- 逻辑错误和缺陷
- 安全漏洞
- 性能问题
- 不良实践
- 不一致性

输出为编号的markdown列表，每个发现包括：
1. **[严重性]** 标题
2. diff中的证据（行号）
3. 为什么是问题

简洁但彻底。专注于真正重要的问题。

## Diff Content

```diff
diff --git a/MathLearningApp/src/services/authService.ts b/MathLearningApp/src/services/authService.ts
index e5bc25a6..0d242e8a 100644
--- a/MathLearningApp/src/services/authService.ts
+++ b/MathLearningApp/src/services/authService.ts
@@ -1,6 +1,7 @@
 import AsyncStorage from '@react-native-async-storage/async-storage';
 import {User, ApiResponse} from '../types';
-import {userApi, isApiSuccess} from './api';
+import {userDataRepository} from './mysql/UserDataRepository';
+import {checkDatabaseConnection} from './mysql/prismaClient';

 /**
  * 认证令牌存储键
@@ -8,6 +9,38 @@ import {userApi, isApiSuccess} from './api';
 const AUTH_TOKEN_KEY = '@math_learning_auth_token';
 const USER_DATA_KEY = '@math_learning_user_data';
 const REMEMBER_ME_KEY = '@math_learning_remember_me';
+const USERS_PREFIX = '@math_learning_users_'; // 用户数据前缀
+const MYSQL_AVAILABLE_KEY = '@math_learning_mysql_available'; // MySQL连接状态缓存
+
+/**
+ * 生成UUID
+ */
+function generateUUID(): string {
+  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
+    const r = Math.random() * 16 | 0;
+    const v = c === 'x' ? r : (r & 0x3 | 0x8);
+    return v.toString(16);
+  });
+}
+
+/**
+ * 简单哈希函数（用于本地密码存储）
+ * 注意：生产环境应使用更强的哈希算法如bcrypt
+ */
+async function hashPassword(password: string): Promise<string> {
+  // 使用简单的JS哈希函数（React Native兼容）
+  const str = password + 'math_learning_salt_v1';
+  let hash = 0;
+  for (let i = 0; i < str.length; i++) {
+    const char = str.charCodeAt(i);
+    hash = ((hash << 5) - hash) + char;
+    hash = hash & hash; // Convert to 32-bit integer
+  }
+  // 转换为16进制字符串
+  const hashHex = Math.abs(hash).toString(16);
+  // 填充到至少32个字符
+  return hashHex.padStart(32, '0');
+}

 /**
  * 令牌配置
@@ -73,6 +106,7 @@ class AuthService {
   private authToken: string | null = null;
   private authListeners: ((user: User | null) => void)[] = [];
   private initPromise: Promise<void> | null = null;
+  private mysqlAvailable: boolean | null = null; // MySQL连接状态缓存

   private constructor() {
     this.initPromise = this.initializeAuth();
@@ -99,6 +133,105 @@ class AuthService {
     return AuthService.instance;
   }

+  /**
+   * 检查MySQL连接状态（带缓存）
+   * @returns MySQL是否可用
+   */
+  private async isMySQLAvailable(): Promise<boolean> {
+    // 如果已经检查过，直接返回缓存结果
+    if (this.mysqlAvailable !== null) {
+      return this.mysqlAvailable;
+    }
+
+    try {
+      // 尝试连接MySQL
+      const isConnected = await checkDatabaseConnection();
+      this.mysqlAvailable = isConnected;
+
+      // 缓存连接状态
+      await AsyncStorage.setItem(MYSQL_AVAILABLE_KEY, JSON.stringify(isConnected));
+
+      return isConnected;
+    } catch (error) {
+      console.warn('[AuthService] MySQL connection check failed:', error);
+      this.mysqlAvailable = false;
+      await AsyncStorage.setItem(MYSQL_AVAILABLE_KEY, JSON.stringify(false));
+      return false;
+    }
+  }
+
+  /**
+   * 重置MySQL连接状态（用于重试连接）
+   */
+  private async resetMySQLStatus(): Promise<void> {
+    this.mysqlAvailable = null;
+    await AsyncStorage.removeItem(MYSQL_AVAILABLE_KEY);
+  }
+
+  /**
+   * 缓存用户数据到AsyncStorage（Write-through缓存）
+   * @param user 用户对象
+   * @param passwordHash 密码哈希
+   */
+  private async cacheUser(user: User, passwordHash: string): Promise<void> {
+    try {
+      const userStorageKey = `${USERS_PREFIX}${user.email}`;
+      const userData = {
+        user,
+        passwordHash,
+      };
+      await AsyncStorage.setItem(userStorageKey, JSON.stringify(userData));
+    } catch (error) {
+      console.warn('[AuthService] Failed to cache user:', error);
+    }
+  }
+
+  /**
+   * 从缓存加载用户（Read-aside缓存）
+   * @param email 邮箱地址
+   * @returns 用户数据和密码哈希，或null
+   */
+  private async loadUserFromCache(email: string): Promise<{user: User; passwordHash: string} | null> {
+    try {
+      const userStorageKey = `${USERS_PREFIX}${email}`;
+      const data = await AsyncStorage.getItem(userStorageKey);
+      return data ? JSON.parse(data) : null;
+    } catch (error) {
+      console.error('[AuthService] Failed to load user from cache:', error);
+      return null;
+    }
+  }
+
+  /**
+   * 智能用户查询（MySQL优先，降级到AsyncStorage）
+   * @param email 邮箱地址
+   * @returns 用户数据和密码哈希，或null
+   */
+  private async findUserWithFallback(email: string): Promise<{user: User; passwordHash: string} | null> {
+    const normalizedEmail = email.toLowerCase().trim();
+
+    // 首先尝试MySQL
+    const isMySQLAvailable = await this.isMySQLAvailable();
+
+    if (isMySQLAvailable) {
+      try {
+        const dbUser = await userDataRepository.findByEmailWithPassword(normalizedEmail);
+        if (dbUser) {
+          // 更新缓存
+          await this.cacheUser(dbUser.user, dbUser.passwordHash);
+          return dbUser;
+        }
+      } catch (error) {
+        console.warn('[AuthService] MySQL query failed, falling back to cache:', error);
+        // MySQL查询失败，标记为不可用并降级到缓存
+        this.mysqlAvailable = false;
+      }
+    }
+
+    // 降级到AsyncStorage
+    return await this.loadUserFromCache(normalizedEmail);
+  }
+
   /**
    * 初始化认证状态（从本地存储恢复）
    * 验证存储的令牌有效性
@@ -135,7 +268,7 @@ class AuthService {
   }

   /**
-   * 用户注册
+   * 用户注册（MySQL + AsyncStorage缓存）
    * @param name 用户姓名
    * @param email 邮箱地址
    * @param password 密码
@@ -159,47 +292,118 @@ class AuthService {
         };
       }

-      // 调用注册API
-      const response = await userApi.register({name, email, password});
-
-      // 使用类型守卫确保类型安全
-      if (isApiSuccess(response)) {
-        // 注册成功，清除该邮箱的任何失败尝试记录
-        await this.clearFailedAttempts(email);
+      // 标准化邮箱
+      const normalizedEmail = email.toLowerCase().trim();

-        // 注册成功，自动登录
-        const authResponse: AuthResponse = {
-          user: response.data,
-          token: this.generateToken(response.data),
+      // 检查用户是否已存在（使用智能查询）
+      const existingUser = await this.findUserWithFallback(normalizedEmail);
+      if (existingUser) {
+        return {
+          success: false,
+          error: {
+            code: 'USER_EXISTS',
+            message: '该邮箱已被注册',
          },
         };
+      }

-        await this.setAuthData(authResponse);
+      // 创建新用户
+      const hashedPassword = await hashPassword(password);
+      const userId = generateUUID();
+
+      // 尝试保存到MySQL
+      const isMySQLAvailable = await this.isMySQLAvailable();
+
+      let newUser: User;
+
+      if (isMySQLAvailable) {
+        try {
+          // 保存到MySQL
+          newUser = await userDataRepository.create({
+            userId,
+            email: normalizedEmail,
+            passwordHash: hashedPassword,
+            name: name.trim(),
+          });
+
+          // Write-through缓存：同时保存到AsyncStorage
+          await this.cacheUser(newUser, hashedPassword);
+
+          console.log('[AuthService] User registered in MySQL:', normalizedEmail);
+        } catch (error: any) {
+          // MySQL保存失败，检查是否是唯一约束错误
+          if (error.code === 'P2002') {
+            return {
+              success: false,
+              error: {
+                code: 'USER_EXISTS',
+                message: '该邮箱已被注册',
+              },
+            };
+          }
+
+          // 其他错误，降级到AsyncStorage
+          console.warn('[AuthService] MySQL registration failed, falling back to AsyncStorage:', error);
+          this.mysqlAvailable = false;
+
+          // 降级到AsyncStorage
+          newUser = {
+            id: userId,
+            name: name.trim(),
+            email: normalizedEmail,
+            createdAt: new Date(),
+            updatedAt: new Date(),
+          };
+
+          await this.cacheUser(newUser, hashedPassword);
+
+          console.log('[AuthService] User registered in AsyncStorage (fallback):', normalizedEmail);
+        }
+      } else {
+        // MySQL不可用，直接使用AsyncStorage
+        newUser = {
+          id: userId,
+          name: name.trim(),
+          email: normalizedEmail,
+          createdAt: new Date(),
+          updatedAt: new Date(),
+        };
+
+        await this.cacheUser(newUser, hashedPassword);
+
+        console.log('[AuthService] User registered in AsyncStorage (MySQL unavailable):', normalizedEmail);
+      }
+
+      // 注册成功，清除该邮箱的任何失败尝试记录
+      await this.clearFailedAttempts(normalizedEmail);
+
+      // 注册成功，自动登录
+      const authResponse: AuthResponse = {
+        user: newUser,
+        token: this.generateToken(newUser),
+      };
+
+      await this.setAuthData(authResponse);
+
+      return {
+        success: true,
+        data: authResponse,
+        message: '注册成功！',
+      };
+    } catch (error) {
+      console.error('[AuthService] Registration failed:', error);
+      return {
+        success: false,
+        error: {
+          code: 'REGISTRATION_FAILED',
+          message: error instanceof Error ? error.message : '注册失败，请稍后重试',
+        },
+      };
+    }
+  }

   /**
-   * 用户登录
+   * 用户登录（MySQL + AsyncStorage降级）
    * @param email 邮箱地址
    * @param password 密码
    * @param rememberMe 是否记住登录状态（可选，默认 false)
@@ -222,8 +426,11 @@ class AuthService {
         };
       }

+      // 标准化邮箱
+      const normalizedEmail = email.toLowerCase().trim();
+
       // 检查账户是否被锁定 (AC7)
-      const lockCheck = await this.isAccountLocked(email);
+      const lockCheck = await this.isAccountLocked(normalizedEmail);
       if (lockCheck.locked) {
         return {
           success: false,
@@ -234,69 +441,142 @@ class AuthService {
         };
       }

-      // 调用登录API
-      const response = await userApi.login({email, password});
-
-      // 使用类型守卫确保类型安全
-      if (isApiSuccess(response)) {
-        // 登录成功，清除失败尝试记录
-        await this.clearFailedAttempts(email);
-
-        // 根据记住我偏好生成不同过期时间的令牌
-        const tokenExpiry = rememberMe ? TOKEN_CONFIG.EXPIRY_MS_REMEMBER : TOKEN_CONFIG.EXPIRY_MS;
-        const authResponse: AuthResponse = {
-          user: response.data,
-          token: this.generateToken(response.data, tokenExpiry),
+      // 使用智能查询查找用户（MySQL优先，降级到AsyncStorage）
+      const storedUserData = await this.findUserWithFallback(normalizedEmail);
+      if (!storedUserData) {
+        // 用户不存在，记录失败尝试
+        const attemptData = await this.recordFailedAttempt(normalizedEmail);
+        return this.getLoginFailureResponse(normalizedEmail, attemptData, '邮箱或密码错误');
+      }
+
+      // 验证密码
+      const hashedPassword = await hashPassword(password);
+      if (storedUserData.passwordHash !== hashedPassword) {
+        // 密码错误，记录失败尝试（使用MySQL如果可用）
+        const isMySQLAvailable = await this.isMySQLAvailable();
+        if (isMySQLAvailable) {
+          try {
+            const dbUser = await userDataRepository.findByEmail(normalizedEmail);
+            if (dbUser) {
+              const attempts = await userDataRepository.incrementFailedAttempts(dbUser.id);
+
+              // 检查是否需要锁定账户
+              if (attempts >= FAILED_LOGIN_CONFIG.MAX_ATTEMPTS) {
+                await userDataRepository.lockAccount(dbUser.id);
+              }
+
+              return this.getLoginFailureResponse(normalizedEmail, {count: attempts}, '邮箱或密码错误');
+            }
+          } catch (error) {
+            console.warn('[AuthService] Failed to record attempt in MySQL:', error);
+          }
+        }
+
+        // 降级到AsyncStorage记录失败尝试
+        const attemptData = await this.recordFailedAttempt(normalizedEmail);
+        return this.getLoginFailureResponse(normalizedEmail, attemptData, '邮箱或密码错误');
+      }
+
+      // 登录成功，清除失败尝试记录
+      const isMySQLAvailable = await this.isMySQLAvailable();
+      if (isMySQLAvailable) {
+        try {
+          const dbUser = await userDataRepository.findByEmail(normalizedEmail);
+          if (dbUser) {
+            await userDataRepository.clearFailedAttempts(dbUser.id);
+            await userDataRepository.updateLastLogin(dbUser.id);
+          }
+        } catch (error) {
+          console.warn('[AuthService] Failed to update login status in MySQL:', error);
+        }
+      }
+
+      // 也清除AsyncStorage的失败尝试记录（保持一致性）
+      await this.clearFailedAttempts(normalizedEmail);
+
+      // 根据记住我偏好生成不同过期时间的令牌
+      const tokenExpiry = rememberMe ? TOKEN_CONFIG.EXPIRY_MS_REMEMBER : TOKEN_CONFIG.EXPIRY_MS;
+      const authResponse: AuthResponse = {
+        user: storedUserData.user,
+        token: this.generateToken(storedUserData.user, tokenExpiry),
+      };
+
+      await this.setAuthData(authResponse, rememberMe);
+
+      console.log('[AuthService] User logged in successfully:', normalizedEmail);
+      return {
+        success: true,
+        data: authResponse,
+        message: '登录成功！',
+      };
+    } catch (error) {
+      console.error('[AuthService] Login failed:', error);
+      return {
+        success: false,
+        error: {
+          code: 'LOGIN_FAILED',
+          message: error instanceof Error ? error.message : '登录失败，请稍后重试',
         };
-        await this.setAuthData(authResponse, rememberMe);
+      };
+    }
+  }

-        return {
-          success: true,
-          data: authResponse,
-          message: '登录成功！',
+  /**
+   * 加载登录失败响应
+   */
+  private getLoginFailureResponse(
+    email: string,
+    attemptData: any,
+    errorMessage: string
+  ): ApiResponse<AuthResponse> {
+    // 如果达到最大尝试次数，返回账户锁定错误
+    if (attemptData.lockedUntil) {
+      return {
+        success: false,
+        error: {
+          code: 'ACCOUNT_LOCKED',
+          message: `登录失败次数过多，账户已临时锁定30分钟`,
         };
-      }
+    }

-      // 登录失败，记录失败尝试 (AC7)
-      const attemptData = await this.recordFailedAttempt(email);
+    // 返回剩余尝试次数
+    const remainingAttempts = FAILED_LOGIN_CONFIG.MAX_ATTEMPTS - attemptData.count;
+    if (remainingAttempts > 0 && remainingAttempts <= 2) {
+      // 只在剩余尝试次数较少时提示
+      return {
+        success: false,
+        error: {
+          code: response.error?.code || 'LOGIN_ERROR',
+          message: `${response.error?.message || '邮箱或密码错误'}（还剩${remainingAttempts}次尝试机会）`,
-        },
-      };
+    }
+
+    return {
+      success: false,
+      error: {
+        code: 'LOGIN_ERROR',
+        message: errorMessage,
+      },
+    };
+  }
+
+  /**
+   * 根据邮箱加载用户数据
+   */
+  private async loadUserByEmail(email: string): Promise<{user: User; passwordHash: string} | null> {
+    try {
+      const userStorageKey = `${USERS_PREFIX}${email}`;
+      const data = await AsyncStorage.getItem(userStorageKey);
+      if (!data) {
+        return null;
+      }
+      return JSON.parse(data);
+    } catch (error) {
+      console.error('[AuthService] Failed to load user by email:', error);
+      return null;
+    }
+  }
+
+  /**
+   * 更新用户资料（MySQL + AsyncStorage同步）
+   */
+  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
+    try {
+      // 检查用户是否已登录
+      if (!this.currentUser) {
+        return {
+          success: false,
+          error: {
+            code: 'NOT_AUTHENTICATED',
+            message: '请先登录后再更新资料',
+          },
+        };
+      }
+
+      // 尝试更新MySQL
+      const isMySQLAvailable = await this.isMySQLAvailable();
+      let updatedUser: User;
+
+      if (isMySQLAvailable) {
+        try {
+          // 更新MySQL
+          updatedUser = await userDataRepository.update(this.currentUser.id, {
+            name: updates.name,
+            phone: updates.phone,
+            language: updates.language,
+            difficulty: updates.difficulty,
+          });
+
+          console.log('[AuthService] Profile updated in MySQL');
+        } catch (error) {
+          console.warn('[AuthService] MySQL update failed, using local update:', error);
+          // MySQL更新失败，仅更新本地数据
+          updatedUser = {...this.currentUser, ...updates};
+        }
+      } else {
+        // MySQL不可用，仅更新本地数据
+        updatedUser = {...this.currentUser, ...updates};
+      }
+
+      // 更新本地状态和AsyncStorage
+      this.currentUser = updatedUser;
+      await AsyncStorage.setItem(
+        USER_DATA_KEY,
+        JSON.stringify(this.currentUser)
+      );
+
+      // 如果更新了name或phone，也需要更新缓存的用户数据
+      if (updates.name || updates.phone) {
+        const cachedUserData = await this.loadUserFromCache(this.currentUser.email);
+        if (cachedUserData) {
+          await this.cacheUser(this.currentUser, cachedUserData.passwordHash);
+        }
+      }
+
+      this.notifyAuthListeners(this.currentUser);
+
+      return {
+        success: true,
+        data: this.currentUser,
+        message: '资料更新成功',
+      };
+    } catch (error) {
+      console.error('[AuthService] Update profile failed:', error);
+      return {
+        success: false,
+        error: {
+          code: 'UPDATE_FAILED',
+          message: '更新资料失败',
+        },
+      };
+    }
+  }
```

## UserDataRepository.ts (新增文件)

```typescript
import {prisma} from './prismaClient';
import {User as PrismaUser} from '@prisma/client';
import {User} from '../../types';

export class UserDataRepository {
  async create(data: {
    userId: string;
    email: string;
    passwordHash: string;
    name?: string;
    phone?: string;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        userId: data.userId,
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        name: data.name?.trim(),
        phone: data.phone,
      },
    });

    return this.mapToApplicationUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: {email: email.toLowerCase().trim()},
    });

    return user ? this.mapToApplicationUser(user) : null;
  }

  async findByEmailWithPassword(email: string): Promise<{user: User; passwordHash: string} | null> {
    const user = await prisma.user.findUnique({
      where: {email: email.toLowerCase().trim()},
    });

    if (!user) {
      return null;
    }

    return {
      user: this.mapToApplicationUser(user),
      passwordHash: user.passwordHash,
    };
  }

  async findByUserId(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: {userId},
    });

    return user ? this.mapToApplicationUser(user) : null;
  }

  async update(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      language?: string;
      difficulty?: string;
    }
  ): Promise<User> {
    const user = await prisma.user.update({
      where: {userId},
      data: {
        ...(data.name !== undefined && {name: data.name.trim()}),
        ...(data.phone !== undefined && {phone: data.phone}),
        ...(data.language && {language: data.language}),
        ...(data.difficulty && {difficulty: data.difficulty}),
      },
    });

    return this.mapToApplicationUser(user);
  }

  async delete(userId: string): Promise<void> {
    await prisma.user.delete({
      where: {userId},
    });
  }

  async validatePassword(userId: string, passwordHash: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: {userId},
      select: {passwordHash: true},
    });

    return user?.passwordHash === passwordHash;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {lastLoginAt: new Date()},
    });
  }

  async incrementFailedAttempts(userId: string): Promise<number> {
    const user = await prisma.user.update({
      where: {userId},
      data: {
        failedLoginAttempts: {increment: 1},
      },
      select: {failedLoginAttempts: true},
    });

    return user.failedLoginAttempts;
  }

  async clearFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {
        failedLoginAttempts: 0,
        accountLocked: false,
      },
    });
  }

  async lockAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {accountLocked: true},
    });
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: {userId},
      select: {accountLocked: true},
    });

    return user?.accountLocked || false;
  }

  async getFailedAttempts(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: {userId},
      select: {failedLoginAttempts: true},
    });

    return user?.failedLoginAttempts || 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {email: email.toLowerCase().trim()},
    });

    return count > 0;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {userId},
    });

    return count > 0;
  }

  private mapToApplicationUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.userId,
      name: prismaUser.name || '',
      email: prismaUser.email,
      phone: prismaUser.phone || undefined,
      avatar: undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}

export const userDataRepository = new UserDataRepository();
```

## index.ts (新增文件)

```typescript
export { prisma, checkDatabaseConnection, disconnectDatabase, getDatabaseStats, transaction, setupGracefulShutdown } from './prismaClient';
export type { PrismaClient };

// Future data repositories will be exported here
// export { UserDataRepository, userDataRepository } from './UserDataRepository';
```
```

**请将审查结果粘贴回来。格式如下：**

## Blind Hunter 审查结果

1. **[CRITICAL]** 问题标题
   - 证据：diff行号
   - 原因：...

2. ...
