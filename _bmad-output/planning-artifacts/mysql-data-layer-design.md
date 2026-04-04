# MySQL 数据存储层设计文档

## 📋 概述

本文档描述了MathLearningApp的MySQL数据存储层设计，使用关系型数据库替代MongoDB，提供严格的数据一致性和ACID事务支持。

---

## 🎯 设计目标

1. **数据一致性**：ACID事务保证数据完整性
2. **关系模型**：用户-孩子-学习记录的规范化设计
3. **性能优化**：索引优化和查询优化
4. **类型安全**：使用Prisma ORM提供编译时类型检查
5. **数据安全**：加密存储和访问控制

---

## 🏗️ 架构设计

### 数据访问层架构

```
┌─────────────────────────────────────────────────────┐
│                  React Native App                    │
│  ┌───────────────────────────────────────────────┐  │
│  │         业务逻辑层 (Services)                  │  │
│  │  - authService                                │  │
│  │  - childApi                                    │  │
│  │  - studyApi                                    │  │
│  │  - generationHistoryService                    │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │       Prisma ORM Layer (类型安全)             │  │
│  │  - Schema定义                                  │  │
│  │  - 自动生成的类型                              │  │
│  │  - 查询构建器                                  │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │        MySQL Client (mysql2)                  │  │
│  │  - 连接池管理                                  │  │
│  │  - 预编译语句                                  │  │
│  │  - 事务管理                                    │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │        本地缓存层 (AsyncStorage)               │  │
│  │  - 离线数据缓存                                │  │
│  │  - 快速访问热点数据                            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   MySQL 8.0+ Server          │
        │  - users 表                   │
        │  - children 表                │
        │  - study_records 表           │
        │  - generation_history 表      │
        └──────────────────────────────┘
```

---

## 📊 数据模型设计

### 实体关系图 (ERD)

```
┌─────────────┐       1:N       ┌─────────────┐
│   users     │◄───────────────┤  children   │
├─────────────┤                 ├─────────────┤
│ id (PK)     │                 │ id (PK)     │
│ user_id     │                 │ child_id    │
│ email       │       N:1       │ parent_id   │
│ password    │◄───────────────│ name        │
│ name        │                 │ grade       │
│ ...         │                 │ birthday    │
└─────────────┘                 └─────────────┘
       │                                 │
       │ 1:N                             │ 1:N
       ▼                                 ▼
┌─────────────────┐             ┌─────────────────┐
│ study_records   │             │generation_history│
├─────────────────┤             ├─────────────────┤
│ id (PK)         │             │ id (PK)         │
│ record_id       │             │ generation_id   │
│ child_id (FK)   │             │ user_id (FK)    │
│ parent_id (FK)  │             │ child_id (FK)   │
│ question_id     │             │ original_q...   │
│ action          │             │ generated_q...  │
│ duration        │             │ generated_at    │
│ timestamp       │             └─────────────────┘
└─────────────────┘
```

### 表结构定义

#### 1. users 表

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(50) UNIQUE NOT NULL COMMENT '用户唯一ID',
  email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  name VARCHAR(50) COMMENT '姓名',
  phone VARCHAR(20) COMMENT '手机号',
  language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言设置',
  difficulty VARCHAR(20) DEFAULT 'medium' COMMENT '默认难度',
  notification_enabled BOOLEAN DEFAULT TRUE COMMENT '通知开关',
  failed_login_attempts INT DEFAULT 0 COMMENT '失败登录次数',
  account_locked BOOLEAN DEFAULT FALSE COMMENT '账户锁定',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='用户表';
```

**字段说明：**
- `user_id`: 应用层使用的唯一标识（UUID）
- `email`: 登录邮箱，唯一索引
- `password_hash`: SHA-256哈希存储
- `failed_login_attempts`: 安全限制，超过阈值锁定账户
- `account_locked`: 账户锁定标志

---

#### 2. children 表

```sql
CREATE TABLE children (
  id INT PRIMARY KEY AUTO_INCREMENT,
  child_id VARCHAR(50) UNIQUE NOT NULL COMMENT '孩子唯一ID',
  parent_id VARCHAR(50) NOT NULL COMMENT '关联用户ID',
  name VARCHAR(50) NOT NULL COMMENT '孩子姓名',
  grade ENUM('一年级', '二年级', '三年级', '四年级', '五年级', '六年级')
    NOT NULL COMMENT '年级',
  birthday DATE COMMENT '生日',
  avatar VARCHAR(255) COMMENT '头像URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_child_id (child_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_parent_grade (parent_id, grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='孩子信息表';
```

**关系说明：**
- `parent_id`: 外键关联到users.user_id
- ON DELETE CASCADE: 删除用户时自动删除关联孩子
- 复合索引 `idx_parent_grade`: 优化按年级查询

---

#### 3. study_records 表

```sql
CREATE TABLE study_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  record_id VARCHAR(50) UNIQUE NOT NULL COMMENT '记录唯一ID',
  child_id VARCHAR(50) NOT NULL COMMENT '孩子ID',
  parent_id VARCHAR(50) NOT NULL COMMENT '家长ID',
  question_id VARCHAR(100) COMMENT '题目ID',
  action ENUM('upload', 'practice', 'review') NOT NULL COMMENT '行为类型',
  duration INT DEFAULT 0 COMMENT '持续时间（毫秒）',
  correct BOOLEAN COMMENT '是否正确（practice专用）',
  question_type VARCHAR(50) COMMENT '题目类型',
  difficulty VARCHAR(20) COMMENT '难度',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',

  FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE CASCADE,
  INDEX idx_record_id (record_id),
  INDEX idx_child_id (child_id),
  INDEX idx_parent_child (parent_id, child_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='学习记录表';
```

**性能优化：**
- `idx_timestamp`: 时间范围查询优化（最近7天活动）
- `idx_action`: 按行为类型统计

---

#### 4. generation_history 表

```sql
CREATE TABLE generation_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  generation_id VARCHAR(50) UNIQUE NOT NULL COMMENT '生成记录唯一ID',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
  child_id VARCHAR(50) COMMENT '孩子ID',
  original_question TEXT COMMENT '原始题目',
  question_type VARCHAR(50) COMMENT '题目类型',
  difficulty VARCHAR(20) COMMENT '难度',
  generated_questions JSON COMMENT '生成的题目（JSON数组）',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_generation_id (generation_id),
  INDEX idx_user_id (user_id),
  INDEX idx_user_child (user_id, child_id),
  INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='题目生成历史表';
```

**JSON字段说明：**
```json
{
  "generated_questions": [
    {
      "question": "1 + 2 = ?",
      "answer": "3",
      "explanation": "加法运算..."
    }
  ]
}
```

MySQL 8.0+ 支持JSON字段，可以灵活存储结构化数据。

---

## 🔌 Prisma Schema设计

### schema.prisma

```prisma
// Prisma Schema for MathLearningApp

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id                    Int      @id @default(autoincrement())
  userId                String   @unique @map("user_id") @db.VarChar(50)
  email                 String   @unique @db.VarChar(100)
  passwordHash          String   @map("password_hash") @db.VarChar(255)
  name                  String?  @db.VarChar(50)
  phone                 String?  @db.VarChar(20)
  language              String   @default("zh-CN") @db.VarChar(10)
  difficulty            String   @default("medium") @db.VarChar(20)
  notificationEnabled   Boolean  @default(true) @map("notification_enabled")
  failedLoginAttempts   Int      @default(0) @map("failed_login_attempts")
  accountLocked         Boolean  @default(false) @map("account_locked")
  lastLoginAt           DateTime? @map("last_login_at")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  // 关系
  children              Child[]
  studyRecords          StudyRecord[]
  generationHistories   GenerationHistory[]

  @@index([userId], map: "idx_user_id")
  @@index([email], map: "idx_email")
  @@map("users")
}

model Child {
  id          Int      @id @default(autoincrement())
  childId     String   @unique @map("child_id") @db.VarChar(50)
  parentId    String   @map("parent_id") @db.VarChar(50)
  name        String   @db.VarChar(50)
  grade       Grade    @db.VarChar(20)
  birthday    DateTime? @db.Date
  avatar      String?  @db.VarChar(255)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // 关系
  user        User         @relation(fields: [parentId], references: [userId], onDelete: Cascade)
  studyRecords StudyRecord[]

  @@index([childId], map: "idx_child_id")
  @@index([parentId], map: "idx_parent_id")
  @@index([parentId, grade], map: "idx_parent_grade")
  @@map("children")
}

model StudyRecord {
  id           Int              @id @default(autoincrement())
  recordId     String           @unique @map("record_id") @db.VarChar(50)
  childId      String           @map("child_id") @db.VarChar(50)
  parentId     String           @map("parent_id") @db.VarChar(50)
  questionId   String?          @map("question_id") @db.VarChar(100)
  action       Action           @db.VarChar(20)
  duration     Int              @default(0)
  correct      Boolean?
  questionType String?          @map("question_type") @db.VarChar(50)
  difficulty   String?          @db.VarChar(20)
  timestamp    DateTime         @default(now())

  // 关系
  child        Child            @relation(fields: [childId], references: [childId], onDelete: Cascade)

  @@index([recordId], map: "idx_record_id")
  @@index([childId], map: "idx_child_id")
  @@index([parentId, childId], map: "idx_parent_child")
  @@index([timestamp], map: "idx_timestamp")
  @@index([action], map: "idx_action")
  @@map("study_records")
}

model GenerationHistory {
  id                 Int      @id @default(autoincrement())
  generationId       String   @unique @map("generation_id") @db.VarChar(50)
  userId             String   @map("user_id") @db.VarChar(50)
  childId            String?  @map("child_id") @db.VarChar(50)
  originalQuestion   String?  @map("original_question") @db.Text
  questionType       String?  @map("question_type") @db.VarChar(50)
  difficulty         String?  @db.VarChar(20)
  generatedQuestions Json     @map("generated_questions")
  generatedAt        DateTime @default(now()) @map("generated_at")

  // 关系
  user               User     @relation(fields: [userId], references: [userId], onDelete: Cascade)

  @@index([generationId], map: "idx_generation_id")
  @@index([userId], map: "idx_user_id")
  @@index([userId, childId], map: "idx_user_child")
  @@index([generatedAt], map: "idx_generated_at")
  @@map("generation_history")
}

// 枚举类型
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

// JSON类型定义
type GeneratedQuestion {
  question     String
  answer       String
  explanation  String
}
```

---

## 🔧 技术栈

### 核心依赖

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "mysql2": "^3.6.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

### 技术选型理由

| 技术 | 用途 | 优势 |
|------|------|------|
| **Prisma** | ORM | 类型安全、自动迁移、开发体验好 |
| **mysql2** | 驱动 | 高性能、Promise支持、预编译语句 |
| **MySQL 8.0+** | 数据库 | JSON支持、窗口函数、CTE |

---

## 🔄 同步策略

### 写操作流程

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

### 读操作流程

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

---

## 🔒 安全设计

### 连接安全

```typescript
// DATABASE_URL格式
mysql://username:password@host:port/database

// 使用环境变量
DATABASE_URL="mysql://mathuser:secure_password@localhost:3306/mathlearning"
```

### 密码安全

```sql
-- 密码哈希示例（应用层）
password_hash = SHA256(password + salt)

-- MySQL存储
VARCHAR(255) -- 足够存储哈希值
```

### 访问控制

```sql
-- 创建专用数据库用户
CREATE USER 'mathapp'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON mathlearning.* TO 'mathapp'@'%';
FLUSH PRIVILEGES;
```

---

## 📈 性能优化

### 索引策略

```sql
-- 复合索引优化
CREATE INDEX idx_parent_child ON study_records(parent_id, child_id);
CREATE INDEX idx_user_child_gen ON generation_history(user_id, child_id);

-- 覆盖索引（包含所有查询字段）
CREATE INDEX idx_user_email ON users(user_id, email, name);
```

### 查询优化

```typescript
// 使用Prisma的select减少数据传输
const users = await prisma.user.findMany({
  select: {
    userId: true,
    name: true,
    email: true,
    // 排除大字段
  },
  where: {
    accountLocked: false,
  },
  take: 100, // 限制结果数量
});
```

### 连接池配置

```typescript
// Prisma连接池
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")

  // 连接池配置
  connection_limit = 10    // 最大连接数
  pool_timeout = 30         // 连接超时（秒）
}
```

---

## 🧪 测试策略

### 单元测试

```typescript
describe('UserRepository', () => {
  it('should create user with unique email', async () => {
    const user = await createUser({
      email: 'test@example.com',
      password: 'hashed_password',
    });
    expect(user.userId).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    await expect(
      createUser({
        email: 'test@example.com', // 重复
        password: 'hashed_password',
      })
    ).rejects.toThrow('Unique constraint');
  });
});
```

### 集成测试

```typescript
describe('Child-Parent Relationship', () => {
  it('should cascade delete children on user delete', async () => {
    const user = await createUser({...});
    const child = await createChild({parentId: user.userId});

    await deleteUser(user.userId);

    const remainingChildren = await getChildren(user.userId);
    expect(remainingChildren).toHaveLength(0);
  });
});
```

---

## 🚀 实施计划

### Phase 1: MySQL服务器搭建 (1天)
- [ ] 租用云服务器（阿里云/腾讯云）
- [ ] 安装MySQL 8.0+
- [ ] 配置防火墙和安全组
- [ ] 创建数据库和用户

### Phase 2: Prisma集成 (1-2天)
- [ ] 初始化Prisma
- [ ] 定义Schema
- [ ] 生成Client类型
- [ ] 配置连接

### Phase 3: 数据访问层实现 (2-3天)
- [ ] 实现UserDataRepository
- [ ] 实现ChildDataRepository
- [ ] 实现StudyDataRepository
- [ ] 实现GenerationRepository

### Phase 4: 集成测试 (1天)
- [ ] 端到端测试
- [ ] 性能测试
- [ ] 事务测试

---

## 📋 自建服务器成本估算

### 云服务器配置

| 配置 | 阿里云 | 腾讯云 | AWS |
|------|--------|--------|-----|
| 2核4G | ¥100/月 | ¥90/月 | ¥150/月 |
| 带宽1Mbps | 包含 | 包含 | ¥60/月 |
| 20GB SSD | 包含 | 包含 | ¥20/月 |
| **月总计** | **~¥100** | **~¥90** | **~¥230** |

### 年度成本

- 阿里云: ¥1,200/年
- 腾讯云: ¥1,080/年
- AWS: ¥2,760/年

---

## ⚠️ 与MongoDB方案的主要差异

| 特性 | MongoDB方案 | MySQL方案 |
|------|-------------|-----------|
| 数据模型 | 文档型 | 关系型 |
| Schema灵活性 | 高（无schema） | 低（需预定义） |
| 事务支持 | 4.0+支持 | 成熟支持 |
| JOIN查询 | 不支持 | 完整支持 |
| 开发速度 | 快（原型阶段） | 中（需设计表结构） |
| 生产可靠性 | 良好 | 优秀 |
| 数据一致性 | 最终一致 | 强一致 |
| 运维复杂度 | 低 | 中 |

---

**文档版本**: 1.0
**创建日期**: 2026-03-25
**作者**: Scrum Master Bob
**架构决策**: 从MongoDB切换到MySQL关系型数据库
