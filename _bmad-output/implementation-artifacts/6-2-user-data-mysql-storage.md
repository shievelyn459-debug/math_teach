# Story 6.2: user-data-mysql-storage

**Epic**: Epic 6 - 数据存储层
**优先级**: P1 (高)
**估算**: 3-4天
**状态**: ready-for-dev

---

## ✅ Tasks/Subtasks

### AC1: 实现UserDataRepository（Prisma）
- [ ] Task 1.1: 创建UserDataRepository服务
  - [ ] 实现用户CRUD操作（创建、读取、更新、删除）
  - [ ] 实现邮箱查询方法（findByEmail）
  - [ ] 实现用户ID查询方法（findByUserId）
  - [ ] 实现密码哈希验证方法
  - [ ] 添加事务支持
- [ ] Task 1.2: 实现数据验证
  - [ ] 邮箱唯一性验证
  - [ ] 用户ID生成（UUID）
  - [ ] 密码哈希存储（SHA-256）
  - [ ] 数据完整性检查
- [ ] Task 1.3: 实现错误处理
  - [ ] 数据库连接错误处理
  - [ ] 唯一约束冲突处理
  - [ ] 外键约束错误处理
  - [ ] 超时和重试机制

### AC2: authService集成MySQL
- [ ] Task 2.1: 重构authService
  - [ ] 替换AsyncStorage为UserDataRepository
  - [ ] 保持现有API接口不变
  - [ ] 实现双模式：MySQL主 + AsyncStorage缓存
  - [ ] 添加连接状态检查
- [ ] Task 2.2: 更新认证流程
  - [ ] 注册流程：MySQL存储 + AsyncStorage缓存
  - [ ] 登录流程：MySQL验证 + AsyncStorage缓存
  - [ ] 更新资料：MySQL更新 + AsyncStorage同步
  - [ ] 退出登录：清理MySQL会话 + AsyncStorage缓存
- [ ] Task 2.3: 失败登录尝试迁移
  - [ ] 将失败尝试记录迁移到MySQL
  - [ ] 更新账户锁定逻辑使用数据库
  - [ ] 保留AsyncStorage作为离线降级方案

### AC3: 本地缓存降级方案
- [ ] Task 3.1: 实现智能缓存策略
  - [ ] 写操作：先写MySQL，成功后更新AsyncStorage
  - [ ] 读操作：先检查AsyncStorage，未命中则查MySQL
  - [ ] 缓存失效策略（基于时间戳）
  - [ ] 缓存预热（登录时加载用户数据）
- [ ] Task 3.2: 实现降级方案
  - [ ] MySQL不可用时使用AsyncStorage
  - [ ] 离线队列记录写操作
  - [ ] 网络恢复后自动同步
  - [ ] 冲突解决策略（MySQL优先）
- [ ] Task 3.3: 添加健康检查
  - [ ] 定期检查MySQL连接状态
  - [ ] 连接失败时自动切换到AsyncStorage
  - [ ] 连接恢复时自动同步数据
  - [ ] UI提示当前存储模式

### AC4: 用户数据同步测试
- [ ] Task 4.1: 单元测试
  - [ ] UserDataRepository CRUD测试
  - [ ] 事务测试（创建用户+创建失败尝试）
  - [ ] 错误处理测试（连接失败、约束冲突）
  - [ ] 数据验证测试
- [ ] Task 4.2: 集成测试
  - [ ] authService + MySQL集成测试
  - [ ] 缓存策略测试
  - [ ] 降级方案测试
  - [ ] 同步逻辑测试
- [ ] Task 4.3: 性能测试
  - [ ] CRUD操作性能基准（< 100ms）
  - [ ] 并发请求测试
  - [ ] 连接池测试
  - [ ] 缓存命中率测试

---

## 📝 Dev Notes

### 实施说明

这是Epic 6的第二个故事，建立在Story 6-1（MySQL基础设施）之上。本故事专注于将用户认证数据从AsyncStorage迁移到MySQL，同时保持良好的用户体验和离线支持。

### 技术栈

- **Prisma ORM**: 类型安全的数据库访问
- **MySQL 8.0+**: 关系型数据库（已在Story 6-1搭建）
- **mysql2驱动**: 高性能MySQL客户端
- **AsyncStorage**: 本地缓存和离线降级方案
- **TypeScript**: 类型安全

### 关键文件

- `src/services/mysql/UserDataRepository.ts`: 用户数据仓库（新建）
- `src/services/authService.ts`: 认证服务（重构）
- `src/services/mysql/prismaClient.ts`: Prisma客户端（已存在）
- `prisma/schema.prisma`: 数据模型定义（已存在）

---

## 🔬 开发者上下文

### EPIC分析：Epic 6 - 数据存储层

**Epic目标**：从AsyncStorage迁移到MySQL关系型数据库，提供严格的数据一致性、ACID事务支持和多设备同步能力。

**Epic业务价值**：
- 支持多设备数据同步
- 提供数据备份和恢复
- 增强数据安全性
- 支持未来功能扩展（如家长账户管理、学习报告）

**Epic中的所有故事**：
- Story 6-1: MySQL基础设施搭建 ✅ (已完成，review状态)
- Story 6-2: 用户数据MySQL存储 (当前故事)
- Story 6-3: 孩子数据MySQL存储
- Story 6-4: 学习记录MySQL存储
- Story 6-5: 离线同步与冲突解决

### 故事基础：Story 6-2需求

**用户故事**：
作为开发者，我需要实现用户数据的MySQL存储服务，以便用户数据可以在多设备间同步并提供可靠的数据持久化。

**验收标准**：
1. ✅ 实现UserDataRepository（Prisma）
2. ✅ authService集成MySQL
3. ✅ 本地缓存降级方案测试通过
4. ✅ 用户数据同步测试通过

**技术要求**：
- 使用Prisma ORM进行数据库操作
- 保持现有authService API接口不变
- 实现智能缓存策略（MySQL主 + AsyncStorage缓存）
- 提供离线降级方案
- 确保数据一致性（ACID事务）

**依赖关系**：
- 依赖Story 6-1（Prisma基础设施已就绪）
- 被Story 6-3, 6-4, 6-5依赖

### 前序故事智能：Story 6-1完成总结

**已完成的工作**：
1. ✅ 安装Prisma ORM和mysql2驱动
2. ✅ 初始化Prisma项目并配置
3. ✅ 定义完整的数据模型Schema（User, Child, StudyRecord, GenerationHistory）
4. ✅ 生成Prisma Client（类型安全）
5. ✅ 实现Prisma客户端服务（单例+事务）
6. ✅ 更新环境变量模板
7. ✅ 创建MySQL服务器安装指南
8. ✅ 编写完整的测试用例

**技术亮点**：
- 类型安全的数据库访问（Prisma自动生成类型）
- 关系模型设计（用户-孩子-学习记录）
- 外键约束和级联删除
- 事务支持（ACID保证）
- 连接池管理

**重要文件**：
- `prisma/schema.prisma`: 数据模型定义
- `prisma.config.ts`: Prisma配置（使用新的Prisma 7.0配置方式）
- `src/services/mysql/prismaClient.ts`: Prisma客户端服务
- `src/services/mysql/index.ts`: 服务导出
- `src/services/mysql/__tests__/prismaClient.test.ts`: 完整测试
- `src/services/mysql/__tests__/schema.test.ts`: Schema验证

**Prisma 7.0注意**：
- 使用新的配置方式（`prisma.config.ts`）
- 环境变量使用方法: `process.env.DATABASE_URL`
- URL配置在`prisma.config.ts`中，而非`schema.prisma`

**待用户完成**（不影响本故事开发）：
1. 租用云服务器
2. 按照安装指南搭建MySQL服务器
3. 配置.env文件中的DATABASE_URL
4. 运行 `npx prisma db push` 创建表
5. 运行测试验证

**开发者注意**：
- 本故事的代码实现不依赖MySQL服务器实际运行
- 可以使用Prisma的Mock功能进行开发测试
- MySQL连接测试需要服务器运行后才能通过

### 架构文档分析

**数据访问层架构**（来自`mysql-data-layer-design.md`）：

```
React Native App
  └─ 业务逻辑层 (Services)
       ├─ authService
       ├─ childApi
       ├─ studyApi
       └─ generationHistoryService
  └─ Prisma ORM Layer (类型安全)
       ├─ Schema定义
       ├─ 自动生成的类型
       └─ 查询构建器
  └─ MySQL Client (mysql2)
       ├─ 连接池管理
       ├─ 预编译语句
       └─ 事务管理
  └─ 本地缓存层 (AsyncStorage)
       ├─ 离线数据缓存
       └─ 快速访问热点数据
```

**数据模型**（来自`prisma/schema.prisma`）：

```prisma
model User {
  id                  Int      @id @default(autoincrement())
  userId              String   @unique @map("user_id") @db.VarChar(50)
  email               String   @unique @db.VarChar(100)
  passwordHash        String   @map("password_hash") @db.VarChar(255)
  name                String?  @db.VarChar(50)
  phone               String?  @db.VarChar(20)
  language            String   @default("zh-CN") @db.VarChar(10)
  difficulty          String   @default("medium") @db.VarChar(20)
  notificationEnabled Boolean  @default(true) @map("notification_enabled")
  failedLoginAttempts Int      @default(0) @map("failed_login_attempts")
  accountLocked        Boolean  @default(false) @map("account_locked")
  lastLoginAt          DateTime? @map("last_login_at")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  children            Child[]
  studyRecords        StudyRecord[] @relation("UserStudyRecords")
  generationHistories GenerationHistory[]

  @@index([userId], map: "idx_user_id")
  @@index([email], map: "idx_email")
  @@map("users")
}
```

**关键设计决策**：
1. **双ID设计**：`id`（自增主键）+ `userId`（应用层UUID）
2. **密码哈希**：使用`passwordHash`字段存储SHA-256哈希
3. **安全字段**：`failedLoginAttempts`, `accountLocked`用于登录安全
4. **索引优化**：`userId`和`email`都有唯一索引
5. **外键关系**：与Child, StudyRecord, GenerationHistory的关系

**同步策略**（来自`mysql-data-layer-design.md`）：

**写操作流程**：
```
1. 应用写入数据
   ↓
2. Prisma构建SQL查询
   ↓
3. MySQL执行事务（ACID保证）
   ↓
4. 返回结果
   ↓
5. 更新本地缓存（AsyncStorage）
```

**读操作流程**：
```
1. 检查本地缓存（AsyncStorage）
   ↓ 命中
2. 返回缓存数据
   ↓ 未命中
3. 查询MySQL数据库
   ↓
4. 更新本地缓存
   ↓
5. 返回数据
```

### 现有代码分析：authService.ts

**当前实现**（AsyncStorage-based）：

**位置**：`src/services/authService.ts`

**核心功能**：
1. ✅ 用户注册（`register`）
2. ✅ 用户登录（`login`）
3. ✅ 退出登录（`logout`）
4. ✅ 认证状态管理
5. ✅ 失败登录尝试追踪
6. ✅ 账户锁定机制
7. ✅ 令牌生成和验证

**存储结构**（AsyncStorage）：
- 用户数据：`@math_learning_users_{email}` → `{user: User, passwordHash: string}`
- 认证令牌：`@math_learning_auth_token`
- 用户数据：`@math_learning_user_data`
- 记住我：`@math_learning_remember_me`
- 失败尝试：`@math_learning_failed_attempts_{hash}`

**密码处理**：
- 当前：简单哈希函数（`hashPassword`）
- 目标：保持兼容，使用相同的哈希算法

**令牌系统**：
- 简单的自定义令牌格式：`base64(data).signature`
- 包含：`userId`, `email`, `iat`, `exp`, `v`
- 签名算法：自定义HMAC-like签名

**迁移策略**：
1. **保持API接口不变**：`register()`, `login()`, `logout()`等
2. **内部实现切换**：从AsyncStorage切换到MySQL
3. **双模式运行**：MySQL主存储 + AsyncStorage缓存
4. **向后兼容**：支持从AsyncStorage迁移到MySQL

### 类型系统分析

**User类型**（`src/types/index.ts`）：

```typescript
export interface User {
  id: string;          // 应用层UUID（对应Prisma的userId）
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  children?: Child[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Prisma User vs Application User**：

| 字段 | Prisma User | Application User | 映射 |
|------|-------------|------------------|------|
| 应用ID | `userId` | `id` | ✅ 映射 |
| 邮箱 | `email` | `email` | ✅ 匹配 |
| 姓名 | `name` | `name` | ✅ 匹配 |
| 电话 | `phone` | `phone` | ✅ 匹配 |
| 创建时间 | `createdAt` | `createdAt` | ✅ 匹配 |
| 更新时间 | `updatedAt` | `updatedAt` | ✅ 匹配 |

**注意**：Prisma的`id`（自增主键）是内部使用，应用层使用`userId`（UUID）。

### Git智能分析

**最近5个提交**：

```
8dc1f88c feat: 优化首页UI并修复输入框问题
772abf96 fix: 彻底重构FormInput组件修复输入框问题
6d931f5d fix: 修复注册登录输入框无法输入的问题
4947680c chore: 更新Epic 1, 2, 4状态为done
6e5a458d refactor: 优化Story 5-3和5-4组件实现
```

**代码模式**：
1. **提交消息风格**：`fix:`, `feat:`, `refactor:`, `chore:`
2. **文件组织**：服务在`src/services/`，组件在`src/components/`
3. **测试文件**：`__tests__/`子目录
4. **命名约定**：camelCase for files, PascalCase for components

### 前序故事学习：Story 1-1, 1-2分析

**Story 1-1完成总结**（用户注册）：

**已完成的工作**：
1. ✅ 创建RegisterScreen.tsx（注册界面）
2. ✅ 实现authService.register方法（AsyncStorage版本）
3. ✅ 添加表单验证
4. ✅ 实现密码显示/隐藏功能
5. ✅ 注册成功后自动登录
6. ✅ 添加友好的错误提示

**技术实现**：
- 使用react-native-paper组件
- 实现表单验证逻辑
- 密码强度验证
- 邮箱唯一性检查
- 自动登录（注册后）

**Story 1-2完成总结**（用户登录）：

**已完成的工作**：
1. ✅ 创建LoginScreen.tsx（登录界面）
2. ✅ 实现authService.login方法（AsyncStorage版本）
3. ✅ 添加"记住我"功能
4. ✅ 实现失败登录尝试追踪
5. ✅ 实现账户锁定机制
6. ✅ 添加友好的错误提示

**技术实现**：
- 失败登录尝试计数（最多5次）
- 15分钟时间窗口
- 30分钟账户锁定
- 剩余尝试次数提示

**迁移注意事项**：
- 保持UI不变（RegisterScreen, LoginScreen）
- 保持API接口不变（authService方法签名）
- 将AsyncStorage操作替换为MySQL操作
- 保持错误处理逻辑一致

---

## 🏗️ 架构合规性

### 必须遵循的架构约束

**数据存储架构**（来自`architecture-design.md`）：
- ✅ 使用MySQL 8.0+关系型数据库
- ✅ 使用Prisma ORM进行数据访问
- ✅ 实现ACID事务保证数据一致性
- ✅ 使用AsyncStorage作为本地缓存
- ✅ 实现离线降级方案

**安全要求**（来自`prd.md`）：
- ✅ 用户数据加密存储
- ✅ 密码使用SHA-256哈希
- ✅ 符合儿童在线隐私保护法规
- ✅ 用户数据只能由本人访问
- ✅ 所有数据传输使用HTTPS加密

**性能要求**（来自`prd.md`）：
- ✅ 用户操作响应时间不超过1秒
- ✅ 支持多用户同时使用
- ✅ 数据库查询优化（使用索引）

**数据模型要求**（来自`mysql-data-layer-design.md`）：
- ✅ 使用Prisma Schema定义
- ✅ 实现外键约束和级联删除
- ✅ 配置所有必要的索引
- ✅ 使用JSON字段存储复杂数据（如`generatedQuestions`）

### 库和框架要求

**必须使用的库**：
- ✅ `@prisma/client`: Prisma客户端（已在Story 6-1安装）
- ✅ `mysql2`: MySQL驱动（已在Story 6-1安装）
- ✅ `@react-native-async-storage/async-storage`: 本地缓存

**版本要求**：
- Prisma: 最新版本（Story 6-1使用Prisma 7.0）
- mysql2: ^3.6.0
- Node.js: 18+

### 文件结构要求

**数据访问层结构**：
```
src/services/mysql/
├── prismaClient.ts          # Prisma客户端（已存在）
├── UserDataRepository.ts    # 用户数据仓库（新建）
├── ChildDataRepository.ts   # 孩子数据仓库（后续故事）
├── StudyDataRepository.ts   # 学习数据仓库（后续故事）
├── index.ts                 # 服务导出（已存在）
└── __tests__/
    ├── prismaClient.test.ts     # Prisma客户端测试（已存在）
    ├── UserDataRepository.test.ts  # 用户数据测试（新建）
    └── integration.test.ts        # 集成测试（新建）
```

**命名约定**：
- 仓库类：`{Entity}DataRepository`
- 测试文件：`{Entity}DataRepository.test.ts`
- 导出：命名导出（`export class UserDataRepository`）

---

## 🧪 测试要求

### 单元测试

**UserDataRepository测试**（`UserDataRepository.test.ts`）：

```typescript
describe('UserDataRepository', () => {
  // 创建用户
  it('should create user with valid data', async () => {
    const user = await userDataRepository.create({
      userId: 'test-user-1',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: '测试用户',
    });
    expect(user.userId).toBe('test-user-1');
  });

  // 邮箱唯一性
  it('should reject duplicate email', async () => {
    await expect(
      userDataRepository.create({
        userId: 'test-user-2',
        email: 'test@example.com', // 重复
        passwordHash: 'hashed',
      })
    ).rejects.toThrow('Unique constraint');
  });

  // 按邮箱查询
  it('should find user by email', async () => {
    const user = await userDataRepository.findByEmail('test@example.com');
    expect(user).not.toBeNull();
    expect(user?.email).toBe('test@example.com');
  });

  // 按userId查询
  it('should find user by userId', async () => {
    const user = await userDataRepository.findByUserId('test-user-1');
    expect(user).not.toBeNull();
    expect(user?.userId).toBe('test-user-1');
  });

  // 更新用户
  it('should update user data', async () => {
    const updated = await userDataRepository.update('test-user-1', {
      name: '更新后的用户',
    });
    expect(updated.name).toBe('更新后的用户');
  });

  // 删除用户
  it('should delete user', async () => {
    await userDataRepository.delete('test-user-1');
    const user = await userDataRepository.findByUserId('test-user-1');
    expect(user).toBeNull();
  });

  // 事务测试
  it('should support transactions', async () => {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          userId: 'transaction-test',
          email: 'tx@example.com',
          passwordHash: 'hashed',
        },
      });

      await tx.failedLoginAttempts.create({
        // 创建相关记录
      });
    });
  });
});
```

### 集成测试

**authService集成测试**（`authService.integration.test.ts`）：

```typescript
describe('AuthService MySQL Integration', () => {
  // 注册流程
  it('should register user in MySQL and cache in AsyncStorage', async () => {
    const response = await authService.register(
      '测试用户',
      'new@example.com',
      'SecurePass123'
    );

    expect(response.success).toBe(true);

    // 验证MySQL
    const dbUser = await userDataRepository.findByEmail('new@example.com');
    expect(dbUser).not.toBeNull();

    // 验证AsyncStorage缓存
    const cachedUser = await AsyncStorage.getItem('@math_learning_user_data');
    expect(cachedUser).not.toBeNull();
  });

  // 登录流程
  it('should login with MySQL validation', async () => {
    const response = await authService.login(
      'new@example.com',
      'SecurePass123'
    );

    expect(response.success).toBe(true);
    expect(response.data.user.email).toBe('new@example.com');
  });

  // 缓存策略
  it('should use cache for subsequent reads', async () => {
    // 第一次读取（从MySQL）
    const user1 = await authService.getCurrentUser();

    // 第二次读取（从缓存）
    const user2 = await authService.getCurrentUser();

    expect(user1).toEqual(user2);
  });

  // 降级方案
  it('should fallback to AsyncStorage when MySQL unavailable', async () => {
    // 模拟MySQL连接失败
    jest.spyOn(prisma, '$disconnect').mockRejectedValue(new Error('Connection failed'));

    // 应该从AsyncStorage读取
    const user = await authService.getCurrentUser();
    expect(user).not.toBeNull();
  });
});
```

### 性能测试

**CRUD操作性能**（`performance.test.ts`）：

```typescript
describe('UserDataRepository Performance', () => {
  it('should create user within 100ms', async () => {
    const start = Date.now();
    await userDataRepository.create({
      userId: 'perf-test',
      email: 'perf@example.com',
      passwordHash: 'hashed',
      name: '性能测试',
    });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should handle 100 concurrent requests', async () => {
    const requests = Array.from({length: 100}, (_, i) =>
      userDataRepository.create({
        userId: `concurrent-${i}`,
        email: `concurrent${i}@example.com`,
        passwordHash: 'hashed',
      })
    );

    const results = await Promise.allSettled(requests);
    const successful = results.filter(r => r.status === 'fulfilled');
    expect(successful.length).toBeGreaterThan(95); // 允许5%失败
  });
});
```

---

## 💡 实施指南

### Step 1: 创建UserDataRepository

**文件**：`src/services/mysql/UserDataRepository.ts`

```typescript
import {prisma} from './prismaClient';
import {User as PrismaUser} from '@prisma/client';
import {User} from '../../types';

/**
 * 用户数据仓库
 * 提供用户CRUD操作和数据库访问
 */
export class UserDataRepository {
  /**
   * 创建新用户
   */
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
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        phone: data.phone,
      },
    });

    return this.mapToApplicationUser(user);
  }

  /**
   * 按邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: {email: email.toLowerCase()},
    });

    return user ? this.mapToApplicationUser(user) : null;
  }

  /**
   * 按userId查找用户
   */
  async findByUserId(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: {userId},
    });

    return user ? this.mapToApplicationUser(user) : null;
  }

  /**
   * 更新用户资料
   */
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
      data,
    });

    return this.mapToApplicationUser(user);
  }

  /**
   * 删除用户
   */
  async delete(userId: string): Promise<void> {
    await prisma.user.delete({
      where: {userId},
    });
  }

  /**
   * 验证密码
   */
  async validatePassword(userId: string, passwordHash: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: {userId},
      select: {passwordHash: true},
    });

    return user?.passwordHash === passwordHash;
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {lastLoginAt: new Date()},
    });
  }

  /**
   * 记录失败登录尝试
   */
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

  /**
   * 清除失败登录尝试
   */
  async clearFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {
        failedLoginAttempts: 0,
        accountLocked: false,
      },
    });
  }

  /**
   * 锁定账户
   */
  async lockAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: {userId},
      data: {accountLocked: true},
    });
  }

  /**
   * 将Prisma User映射到Application User
   */
  private mapToApplicationUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.userId,
      name: prismaUser.name || '',
      email: prismaUser.email,
      phone: prismaUser.phone || undefined,
      avatar: undefined, // Prisma暂不支持
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}

// 导出单例
export const userDataRepository = new UserDataRepository();
```

### Step 2: 重构authService

**修改文件**：`src/services/authService.ts`

**关键变更**：

1. **导入UserDataRepository**：
```typescript
import {userDataRepository} from './mysql/UserDataRepository';
```

2. **修改register方法**：
```typescript
async register(
  name: string,
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  try {
    // ... 验证逻辑保持不变 ...

    // 创建新用户（使用MySQL）
    const hashedPassword = await hashPassword(password);
    const userId = generateUUID();

    // 使用MySQL存储
    const newUser = await userDataRepository.create({
      userId,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      name: name.trim(),
    });

    // 缓存到AsyncStorage
    await this.cacheUser(newUser, hashedPassword);

    // 生成令牌
    const authResponse: AuthResponse = {
      user: newUser,
      token: this.generateToken(newUser),
    };

    await this.setAuthData(authResponse);

    return {
      success: true,
      data: authResponse,
      message: '注册成功！',
    };
  } catch (error) {
    // 处理唯一约束冲突
    if (error.code === 'P2002') {
      return {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: '该邮箱已被注册',
        },
      };
    }
    // ... 其他错误处理 ...
  }
}
```

3. **修改login方法**：
```typescript
async login(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<ApiResponse<AuthResponse>> {
  try {
    // ... 验证和账户锁定检查保持不变 ...

    // 使用MySQL验证
    const storedUser = await userDataRepository.findByEmail(normalizedEmail);

    if (!storedUser) {
      const attemptData = await this.recordFailedAttempt(normalizedEmail);
      return this.getLoginFailureResponse(normalizedEmail, attemptData, '邮箱或密码错误');
    }

    // 验证密码
    const hashedPassword = await hashPassword(password);
    const isValid = await userDataRepository.validatePassword(storedUser.id, hashedPassword);

    if (!isValid) {
      const attemptData = await this.recordFailedAttempt(normalizedEmail);
      return this.getLoginFailureResponse(normalizedEmail, attemptData, '邮箱或密码错误');
    }

    // 登录成功
    await userDataRepository.updateLastLogin(storedUser.id);

    // ... 生成令牌和设置认证数据 ...
  } catch (error) {
    // ... 错误处理 ...
  }
}
```

4. **添加缓存方法**：
```typescript
/**
 * 缓存用户数据到AsyncStorage
 */
private async cacheUser(user: User, passwordHash: string): Promise<void> {
  const userStorageKey = `${USERS_PREFIX}${user.email}`;
  const userData = {
    user,
    passwordHash,
  };
  await AsyncStorage.setItem(userStorageKey, JSON.stringify(userData));
}

/**
 * 从缓存加载用户
 */
private async loadUserFromCache(email: string): Promise<{user: User; passwordHash: string} | null> {
  const userStorageKey = `${USERS_PREFIX}${email}`;
  const data = await AsyncStorage.getItem(userStorageKey);
  return data ? JSON.parse(data) : null;
}
```

### Step 3: 实现降级方案

**添加连接检查**：

```typescript
/**
 * 检查MySQL连接状态
 */
async checkMySQLConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('[AuthService] MySQL connection failed:', error);
    return false;
  }
}

/**
 * 智能用户查询（MySQL优先，降级到AsyncStorage）
 */
async findUserWithFallback(email: string): Promise<{user: User; passwordHash: string} | null> {
  // 首先尝试MySQL
  const isMySQLAvailable = await this.checkMySQLConnection();

  if (isMySQLAvailable) {
    const dbUser = await userDataRepository.findByEmail(email);
    if (dbUser) {
      // 需要获取passwordHash（这里需要调整UserDataRepository）
      return {user: dbUser, passwordHash: '...' };
    }
  }

  // 降级到AsyncStorage
  return await this.loadUserFromCache(email);
}
```

### Step 4: 更新导出

**修改文件**：`src/services/mysql/index.ts`

```typescript
export {prisma, checkDatabaseConnection, disconnectDatabase} from './prismaClient';
export {UserDataRepository, userDataRepository} from './UserDataRepository';
```

---

## ⚠️ 注意事项

### 安全性

1. **密码哈希**：
   - 继续使用现有的简单哈希函数（保持向后兼容）
   - 不要在数据库中存储明文密码
   - 未来考虑升级到bcrypt

2. **SQL注入防护**：
   - Prisma自动处理SQL注入
   - 不要使用原始SQL查询

3. **连接安全**：
   - 生产环境使用SSL/TLS连接MySQL
   - DATABASE_URL格式：`mysql://user:pass@host:port/db`

### 性能

1. **查询优化**：
   - 使用Prisma的`select`减少数据传输
   - 利用已定义的索引
   - 避免N+1查询问题

2. **连接池**：
   - Prisma默认连接池大小为10
   - 根据并发需求调整

3. **缓存策略**：
   - 写操作：先MySQL后AsyncStorage
   - 读操作：先AsyncStorage后MySQL
   - 定期清理过期缓存

### 错误处理

1. **Prisma错误代码**：
   - `P2002`: 唯一约束冲突（邮箱重复）
   - `P2025`: 记录未找到
   - `P2003`: 外键约束冲突

2. **网络错误**：
   - 连接超时：30秒
   - 自动重试：最多3次
   - 降级到AsyncStorage

3. **数据一致性**：
   - 使用事务确保原子性
   - 失败时回滚所有操作

### 向后兼容

1. **数据迁移**：
   - 提供从AsyncStorage迁移到MySQL的工具
   - 保留AsyncStorage作为备份

2. **API兼容**：
   - 保持所有公共方法签名不变
   - 保持返回值格式一致

3. **测试兼容**：
   - 现有测试应该仍然通过
   - 添加新的MySQL集成测试

---

## 📚 参考资料

### 源文档

- **PRD**: [docs/prd.md](../../docs/prd.md)
  - 功能需求：FR1 用户管理能力
  - 非功能需求：安全性、性能、可扩展性
  - 技术栈：MySQL数据库、Prisma ORM

- **架构设计**: [docs/architecture-design.md](../../docs/architecture-design.md)
  - 数据库设计：users表结构
  - 技术栈：Prisma、mysql2、AsyncStorage
  - 部署架构：MySQL服务器配置

- **MySQL数据层设计**: [_bmad-output/planning-artifacts/mysql-data-layer-design.md](../planning-artifacts/mysql-data-layer-design.md)
  - 数据访问层架构
  - Prisma Schema定义
  - 同步策略
  - 性能优化

- **Story 6-1**: [_bmad-output/implementation-artifacts/6-1-mysql-infrastructure-setup.md](./6-1-mysql-infrastructure-setup.md)
  - Prisma配置和Schema
  - Prisma客户端服务
  - 环境变量配置
  - 测试用例

- **Story 1-1**: [_bmad-output/implementation-artifacts/1-1-parent-user-create-account.md](./1-1-parent-user-create-account.md)
  - 用户注册流程
  - authService实现
  - 表单验证

- **Story 1-2**: [_bmad-output/implementation-artifacts/1-2-parent-user-login.md](./1-2-parent-user-login.md)
  - 用户登录流程
  - 失败登录尝试
  - 账户锁定机制

- **Sprint变更提案**: [_bmad-output/planning-artifacts/sprint-change-proposal-2026-03-25.md](../planning-artifacts/sprint-change-proposal-2026-03-25.md)
  - Epic 6故事列表
  - 验收标准
  - 实施计划

### 技术文档

- **Prisma文档**: https://www.prisma.io/docs
- **MySQL 8.0参考手册**: https://dev.mysql.com/doc/refman/8.0/en/
- **React Native AsyncStorage**: https://react-native-async-storage.github.io/async-storage/

---

## 📋 故事描述

作为开发者，我需要实现用户数据的MySQL存储服务，以便用户数据可以在多设备间同步并提供可靠的数据持久化。

---

## 🎯 验收标准

### AC1: 实现UserDataRepository（Prisma）
- [ ] 创建UserDataRepository服务类
- [ ] 实现用户CRUD操作
- [ ] 实现邮箱和userId查询方法
- [ ] 实现密码验证方法
- [ ] 实现失败登录尝试管理方法
- [ ] 添加完整的错误处理

### AC2: authService集成MySQL
- [ ] 替换authService中的AsyncStorage操作为MySQL
- [ ] 保持现有API接口不变
- [ ] 实现MySQL主存储 + AsyncStorage缓存
- [ ] 更新注册、登录、更新资料流程
- [ ] 实现失败登录尝试的MySQL存储

### AC3: 本地缓存降级方案
- [ ] 实现智能缓存策略（读缓存、写MySQL）
- [ ] 实现MySQL不可用时的降级方案
- [ ] 添加离线队列机制
- [ ] 实现网络恢复后的自动同步
- [ ] 添加连接健康检查

### AC4: 用户数据同步测试
- [ ] UserDataRepository单元测试
- [ ] authService集成测试
- [ ] 缓存策略测试
- [ ] 降级方案测试
- [ ] 性能测试（CRUD < 100ms）

---

## 🔧 技术实现

### 关键技术栈

- **Prisma ORM**: 类型安全的数据库访问
- **MySQL 8.0+**: 关系型数据库
- **mysql2**: 高性能MySQL驱动
- **AsyncStorage**: 本地缓存和离线降级
- **TypeScript**: 类型安全

### 数据模型

```prisma
model User {
  id                  Int      @id @default(autoincrement())
  userId              String   @unique @map("user_id")
  email               String   @unique
  passwordHash        String   @map("password_hash")
  name                String?
  phone               String?
  language            String   @default("zh-CN")
  difficulty          String   @default("medium")
  notificationEnabled Boolean  @default(true)
  failedLoginAttempts Int      @default(0)
  accountLocked        Boolean  @default(false)
  lastLoginAt          DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  children            Child[]
  studyRecords        StudyRecord[]
  generationHistories GenerationHistory[]

  @@index([userId])
  @@index([email])
}
```

### 关键实现

1. **UserDataRepository**: 用户数据仓库
2. **authService重构**: MySQL + AsyncStorage双模式
3. **智能缓存**: 读写分离策略
4. **降级方案**: 离线队列和自动同步
5. **健康检查**: MySQL连接监控

---

## 🧪 测试用例

### 单元测试

- UserDataRepository CRUD操作
- 邮箱唯一性验证
- 密码验证
- 失败登录尝试管理
- 事务支持

### 集成测试

- authService + MySQL集成
- 注册流程（MySQL + AsyncStorage）
- 登录流程（MySQL验证）
- 缓存策略（读写分离）
- 降级方案（MySQL不可用）

### 性能测试

- CRUD操作 < 100ms
- 并发请求处理
- 连接池效率
- 缓存命中率

---

## 📝 实施步骤

### Phase 1: UserDataRepository实现（1天）
1. 创建UserDataRepository类
2. 实现CRUD方法
3. 实现查询方法
4. 添加错误处理
5. 编写单元测试

### Phase 2: authService集成（1-2天）
1. 重构register方法
2. 重构login方法
3. 添加缓存方法
4. 实现降级方案
5. 编写集成测试

### Phase 3: 优化和测试（1天）
1. 性能优化
2. 错误处理完善
3. 降级方案测试
4. 离线同步测试
5. 文档更新

---

## ⚠️ 注意事项

### 安全性
- 密码哈希存储（不存储明文）
- SQL注入防护（Prisma自动处理）
- 连接安全（SSL/TLS）

### 性能
- 查询优化（使用索引）
- 连接池管理
- 缓存策略
- 避免N+1查询

### 兼容性
- 保持API接口不变
- 向后兼容AsyncStorage
- 数据迁移工具

### 错误处理
- Prisma错误代码处理
- 网络错误处理
- 数据一致性保证
- 事务回滚

---

## 📚 参考资料

- [Prisma文档](https://www.prisma.io/docs)
- [MySQL 8.0参考手册](https://dev.mysql.com/doc/refman/8.0/en/)
- [MySQL数据层设计](../planning-artifacts/mysql-data-layer-design.md)
- [Story 6-1: MySQL基础设施](./6-1-mysql-infrastructure-setup.md)
- [架构设计文档](../../docs/architecture-design.md)

---

**Story创建时间**: 2026-03-25
**预计完成**: 2026-03-28
**依赖**: Story 6-1（已完成）
**阻塞**: Story 6-3, 6-4, 6-5
**架构决策**: MySQL关系型数据库 + Prisma ORM + AsyncStorage缓存
