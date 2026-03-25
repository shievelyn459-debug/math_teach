# Story 6-1: MySQL基础设施搭建

**Epic**: Epic 6 - 数据存储层
**优先级**: P0 (最高)
**估算**: 2-3天
**状态**: review (代码审查修复完成，等待MySQL服务器搭建)

---

## ✅ Tasks/Subtasks

### AC1: MySQL服务器搭建（用户需要完成）
- [x] Task 1.1: 创建云服务器安装指南
- [x] Task 1.2: 提供MySQL 8.0+安装步骤
- [x] Task 1.3: 提供远程访问和数据库配置说明

### AC2: Prisma ORM集成
- [x] Task 2.1: 安装Prisma和mysql2依赖
- [x] Task 2.2: 初始化Prisma项目
- [x] Task 2.3: 定义Schema模型
- [x] Task 2.4: 生成Prisma Client

### AC3: 数据库表创建
- [x] Task 3.1: 创建Prisma Schema定义
- [x] Task 3.2: 配置表关系和索引
- [x] Task 3.3: 创建数据库迁移脚本（db push准备）

### AC4: 环境配置
- [x] Task 4.1: 更新.env.example模板
- [x] Task 4.2: 配置本地开发环境

### AC5: 基础连接测试
- [x] Task 5.1: 创建Prisma客户端服务
- [x] Task 5.2: 编写连接测试（需要数据库后验证）
- [x] Task 5.3: 编写CRUD测试（需要数据库后验证）
- [x] Task 5.4: 编写事务测试（需要数据库后验证）

---

## 📝 Dev Notes

### 实施说明
由于AC1需要用户在云服务器上安装MySQL，我将：
1. 提供详细的安装指南文档
2. 先完成AC2-AC5（本地可以完成的任务）
3. 用户可以按指南自行完成MySQL服务器搭建

### 技术栈
- Prisma ORM（类型安全的数据库访问）
- MySQL 8.0+（关系型数据库）
- mysql2驱动（高性能MySQL客户端）

### 关键文件
- prisma/schema.prisma - 数据模型定义
- src/services/mysql/prismaClient.ts - Prisma客户端
- .env.example - 环境变量模板

---

## 📋 Dev Agent Record

### Implementation Plan

1. **依赖安装**
   - @prisma/client: 最新版本
   - prisma (CLI): 最新版本
   - mysql2: ^3.6.0

2. **Prisma配置**
   - 初始化Prisma项目
   - 定义完整的Schema（User, Child, StudyRecord, GenerationHistory）
   - 配置关系和外键约束
   - 生成Prisma Client

3. **服务实现**
   - prismaClient.ts: 单例模式Prisma客户端
   - 连接检查函数
   - 事务包装器
   - 优雅关闭函数

4. **环境配置**
   - 更新.env.example添加DATABASE_URL
   - 创建MySQL服务器安装指南

5. **测试文件**
   - prismaClient.test.ts: 完整的CRUD和事务测试
   - schema.test.ts: Schema验证测试

### Completion Notes

✅ **Story 6-1 实施完成（代码部分）**

**已完成的工作：**
1. ✅ 安装Prisma ORM和mysql2驱动
2. ✅ 初始化Prisma项目并配置
3. ✅ 定义完整的数据模型Schema（4个模型）
4. ✅ 生成Prisma Client（类型安全）
5. ✅ 实现Prisma客户端服务（单例+事务）
6. ✅ 更新环境变量模板
7. ✅ 创建MySQL服务器安装指南
8. ✅ 编写完整的测试用例

**技术亮点：**
- 类型安全的数据库访问（Prisma自动生成类型）
- 关系模型设计（用户-孩子-学习记录）
- 外键约束和级联删除
- 事务支持（ACID保证）
- 连接池管理

**文件创建：**
- prisma/schema.prisma: 数据模型定义
- prisma.config.ts: Prisma配置
- src/services/mysql/prismaClient.ts: Prisma客户端服务
- src/services/mysql/index.ts: 服务导出
- src/services/mysql/__tests__/prismaClient.test.ts: 完整测试
- src/services/mysql/__tests__/schema.test.ts: Schema验证
- _bmad-output/planning-artifacts/mysql-server-setup-guide.md: 服务器安装指南

**待用户完成（AC1）：**
1. 租用云服务器
2. 按照安装指南搭建MySQL服务器
3. 配置.env文件中的DATABASE_URL
4. 运行 `npx prisma db push` 创建表
5. 运行测试验证

**注意事项：**
- 测试需要MySQL服务器运行后才能通过
- **已降级到Prisma 6.19.2**（Prisma 7配置复杂，对传统MySQL支持不稳定）
- 环境变量使用方法: `process.env.DATABASE_URL`
- **验证结果**:
  - ✅ Schema验证测试通过（3/3）
  - ✅ Prisma Client成功生成
  - ⏳ 连接测试等待MySQL服务器（端口3306无服务监听）
  - ⏳ CRUD测试等待MySQL服务器

---

## 🔍 代码审查修复记录 (2026-03-25)

### 审查发现
进行了三层并行代码审查：
- Blind Hunter: 对抗性审查
- Edge Case Hunter: 边界条件分析
- Acceptance Auditor: 验收标准审计

### 修复的Patch问题 (12项)

#### 安全修复
1. **.env.example占位符密码** → 改为`YOUR_SECURE_PASSWORD`并添加配置说明
2. **DATABASE_URL启动验证** → 添加`parseDatabaseUrl()`函数，启动时验证URL格式

#### 性能优化
3. **连接池配置** → 支持通过DATABASE_URL参数配置（connection_limit, pool_timeout, connect_timeout）
4. **连接超时** → 添加10秒默认超时，可通过URL参数配置
5. **事务超时** → 添加`maxWait`和`timeout`参数（默认5秒/10秒）
6. **连接重试逻辑** → 实现3次重试+指数退避（1s, 2s, 4s）
7. **StudyRecord.parentId索引** → 添加单独的parentId索引以优化单列查询

#### 质量改进
8. **枚举值中文说明** → 添加注释说明中文枚举值针对中国市场，需utf8mb4字符集
9. **getDatabaseStats不完整** → 实现databaseName返回值，从URL解析数据库名
10. **优雅关闭处理** → 添加SIGTERM/SIGINT/SIGUSR2信号处理器
11. **应用层验证文档** → 在Schema中添加duration/difficulty/JSON大小验证说明
12. **MySQL特定查询优化** → 使用`@@max_connections`替代`SHOW VARIABLES`

### 修改的文件
- `MathLearningApp/.env.example` - 更新DATABASE_URL格式和参数说明
- `MathLearningApp/prisma/schema.prisma` - 添加索引、注释、验证说明
- `MathLearningApp/src/services/mysql/prismaClient.ts` - 完全重构，添加验证、超时、重试、优雅关闭
- `MathLearningApp/src/services/mysql/index.ts` - 导出新函数

### 技术债务 (Defer - 延后处理)
- 密码哈希验证（认证层职责）
- 输入验证中间件（服务层职责）
- 软删除支持（未来功能）
- 审计日志中间件（未来功能）

### 规范问题 (Bad Spec - 待修正)
- AC1: 需明确utf8mb4配置方式（已在.env.example中说明）
- AC3: 需澄清使用db push而非migrations（已在文档中说明）

---

## 📂 File List

### 新建文件
- MathLearningApp/prisma/schema.prisma
- MathLearningApp/prisma.config.ts
- MathLearningApp/src/services/mysql/prismaClient.ts
- MathLearningApp/src/services/mysql/index.ts
- MathLearningApp/src/services/mysql/__tests__/prismaClient.test.ts
- MathLearningApp/src/services/mysql/__tests__/schema.test.ts

### 修改文件
- MathLearningApp/package.json (添加Prisma依赖)
- MathLearningApp/.env.example (添加DATABASE_URL配置)

### 文档文件
- _bmad-output/planning-artifacts/mysql-server-setup-guide.md (MySQL服务器安装指南)

---

## 📝 Change Log

### 2026-03-25 (第二次更新)
- 架构从MongoDB切换到MySQL
- 创建完整的数据模型Schema
- 实现Prisma ORM集成
- 创建MySQL服务器安装指南
- 编写完整的测试用例

### 2026-03-25 (初始版本)
- 原MongoDB版本实现
- 已切换到MySQL方案

---

## 📋 故事描述

作为开发者，我需要搭建自建MySQL服务器和Prisma ORM基础设施，以便应用可以将用户数据安全地存储在关系型数据库中并实现多设备同步。

---

## 🎯 验收标准

### AC1: MySQL服务器搭建
- [ ] 在云服务器上安装MySQL 8.0+
- [ ] 配置远程访问和安全组
- [ ] 创建数据库和专用用户
- [ ] 配置字符集为utf8mb4

### AC2: Prisma ORM集成
- [ ] 初始化Prisma项目
- [ ] 定义数据模型Schema
- [ ] 生成Prisma Client
- [ ] 配置数据库连接

### AC3: 数据库表创建
- [ ] 创建users表（用户数据）
- [ ] 创建children表（孩子信息）
- [ ] 创建study_records表（学习记录）
- [ ] 创建generation_history表（生成历史）
- [ ] 配置所有索引和外键约束

### AC4: 环境配置
- [ ] 创建.env文件模板
- [ ] 添加DATABASE_URL配置
- [ ] 配置Prisma环境

### AC5: 基础连接测试
- [ ] 编写连接测试代码
- [ ] 验证CRUD操作
- [ ] 验证事务支持
- [ ] 验证外键约束

---

## 🔧 技术实现

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

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
  studyRecords        StudyRecord[]
  generationHistories GenerationHistory[]

  @@index([userId], map: "idx_user_id")
  @@index([email], map: "idx_email")
  @@map("users")
}

model Child {
  id        Int      @id @default(autoincrement())
  childId   String   @unique @map("child_id") @db.VarChar(50)
  parentId  String   @map("parent_id") @db.VarChar(50)
  name      String   @db.VarChar(50)
  grade     Grade    @db.VarChar(20)
  birthday  DateTime? @db.Date
  avatar    String?  @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user         User          @relation(fields: [parentId], references: [userId], onDelete: Cascade)
  studyRecords StudyRecord[]

  @@index([childId], map: "idx_child_id")
  @@index([parentId], map: "idx_parent_id")
  @@index([parentId, grade], map: "idx_parent_grade")
  @@map("children")
}

model StudyRecord {
  id           Int      @id @default(autoincrement())
  recordId     String   @unique @map("record_id") @db.VarChar(50)
  childId      String   @map("child_id") @db.VarChar(50)
  parentId     String   @map("parent_id") @db.VarChar(50)
  questionId   String?  @map("question_id") @db.VarChar(100)
  action       Action   @db.VarChar(20)
  duration     Int      @default(0)
  correct      Boolean?
  questionType String?  @map("question_type") @db.VarChar(50)
  difficulty   String?  @db.VarChar(20)
  timestamp    DateTime @default(now())

  child Child @relation(fields: [childId], references: [childId], onDelete: Cascade)

  @@index([recordId], map: "idx_record_id")
  @@index([childId], map: "idx_child_id")
  @@index([parentId, childId], map: "idx_parent_child")
  @@index([timestamp], map: "idx_timestamp")
  @@index([action], map: "idx_action")
  @@map("study_records")
}

model GenerationHistory {
  id                   Int      @id @default(autoincrement())
  generationId         String   @unique @map("generation_id") @db.VarChar(50)
  userId               String   @map("user_id") @db.VarChar(50)
  childId              String?  @map("child_id") @db.VarChar(50)
  originalQuestion     String?  @map("original_question") @db.Text
  questionType         String?  @map("question_type") @db.VarChar(50)
  difficulty           String?  @db.VarChar(20)
  generatedQuestions   Json     @map("generated_questions")
  generatedAt          DateTime @default(now()) @map("generated_at")

  user User @relation(fields: [userId], references: [userId], onDelete: Cascade)

  @@index([generationId], map: "idx_generation_id")
  @@index([userId], map: "idx_user_id")
  @@index([userId, childId], map: "idx_user_child")
  @@index([generatedAt], map: "idx_generated_at")
  @@map("generation_history")
}

enum Grade {
  一年级
  二年级
  三年级
  四年级
  五年级
  六年级
}

enum Action {
  upload
  practice
  review
}
```

### 连接服务实现

```typescript
// src/services/mysql/prismaClient.ts
import { PrismaClient } from '@prisma/client';

// 创建全局Prisma实例
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 健康检查
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 优雅关闭
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
```

### 环境变量配置

```bash
# .env.example

# ============================================================
# MySQL 数据库配置
# ============================================================
# 格式: mysql://用户名:密码@主机:端口/数据库名
# 示例: DATABASE_URL="mysql://mathapp:secure_password@localhost:3306/mathlearning"

# 本地开发环境
DATABASE_URL="mysql://root:password@localhost:3306/mathlearning"

# 生产环境（替换为实际值）
# DATABASE_URL="mysql://username:password@your-server-ip:3306/mathlearning"
```

---

## 📊 数据库初始化SQL

### 创建数据库

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS mathlearning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE mathlearning;

-- 创建专用用户
CREATE USER IF NOT EXISTS 'mathapp'@'%' IDENTIFIED BY 'secure_password_here';

-- 授权
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
  ON mathlearning.*
  TO 'mathapp'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
```

---

## 🧪 测试用例

```typescript
describe('Prisma Connection', () => {
  it('should connect to MySQL successfully', async () => {
    const isConnected = await checkDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  it('should perform basic CRUD operations', async () => {
    // Create
    const user = await prisma.user.create({
      data: {
        userId: 'test-user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        name: '测试用户',
      },
    });
    expect(user.userId).toBe('test-user-1');

    // Read
    const found = await prisma.user.findUnique({
      where: { userId: 'test-user-1' },
    });
    expect(found).not.toBeNull();

    // Update
    const updated = await prisma.user.update({
      where: { userId: 'test-user-1' },
      data: { name: '更新后的用户' },
    });
    expect(updated.name).toBe('更新后的用户');

    // Delete
    await prisma.user.delete({
      where: { userId: 'test-user-1' },
    });
  });

  it('should support transactions', async () => {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          userId: 'transaction-test',
          email: 'transaction@example.com',
          passwordHash: 'hashed',
        },
      });

      await tx.child.create({
        data: {
          childId: 'child-1',
          parentId: user.userId,
          name: '孩子1',
          grade: '一年级',
        },
      });
    });

    // 验证两者都创建成功
    const user = await prisma.user.findUnique({
      where: { userId: 'transaction-test' },
      include: { children: true },
    });

    expect(user?.children).toHaveLength(1);
  });
});
```

---

## 📝 实施步骤

### Step 1: 云服务器准备
1. 租用云服务器（推荐配置：2核4G，20GB SSD）
2. 选择操作系统：Ubuntu 22.04 LTS
3. 配置安全组：开放3306端口（仅限应用服务器IP）

### Step 2: MySQL服务器安装
```bash
# 更新包管理器
sudo apt update

# 安装MySQL Server
sudo apt install mysql-server -y

# 安全配置
sudo mysql_secure_installation

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Step 3: 数据库配置
```bash
# 登录MySQL
sudo mysql

# 执行初始化SQL（见上面的SQL脚本）
```

### Step 4: 安装Node.js依赖
```bash
cd MathLearningApp
npm install prisma @prisma/client mysql2 --save
npm install prisma --save-dev
```

### Step 5: 初始化Prisma
```bash
npx prisma init
npx prisma db push
npx prisma generate
```

### Step 6: 编写测试
1. 创建连接测试
2. 创建CRUD测试
3. 创建事务测试

---

## ⚠️ 注意事项

### 安全性
1. **密码强度**：使用强密码作为数据库用户密码
2. **网络隔离**：仅允许应用服务器IP访问3306端口
3. **SSL连接**：生产环境使用SSL/TLS连接
4. **定期备份**：设置自动备份脚本

### 性能
1. **连接池**：Prisma默认使用连接池（最大10个连接）
2. **索引优化**：已定义所有必要索引
3. **查询优化**：使用Prisma的select减少数据传输
4. **慢查询日志**：启用MySQL慢查询日志监控

### 成本控制
1. **免费套餐**：考虑使用云服务商的免费套餐
2. **按需付费**：按实际使用量付费
3. **资源优化**：定期清理无用数据

---

## 📚 参考资料

- [Prisma文档](https://www.prisma.io/docs)
- [MySQL 8.0参考手册](https://dev.mysql.com/doc/refman/8.0/en/)
- [MySQL性能优化](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

**Story创建时间**: 2026-03-25
**预计完成**: 2026-03-28
**依赖**: 无
**阻塞**: Story 6-2, 6-3, 6-4, 6-5
**架构决策**: 从MongoDB切换到MySQL关系型数据库
