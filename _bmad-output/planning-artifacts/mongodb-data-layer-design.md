# MongoDB 数据存储层设计文档

## 📋 概述

本文档描述了MathLearningApp的MongoDB数据存储层设计，用于替换当前的AsyncStorage本地存储方案，实现云端数据持久化和多设备同步。

---

## 🎯 设计目标

1. **数据持久化**：所有用户数据安全存储在MongoDB云端
2. **多设备同步**：支持同一账户在多个设备间同步数据
3. **离线支持**：AsyncStorage作为本地缓存，离线时可用
4. **数据安全**：加密传输，用户隔离访问
5. **性能优化**：智能缓存策略，减少网络请求

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
│  │       MongoDB 数据访问层 (新增)                │  │
│  │  - mongoDataService                            │  │
│  │  - userDataRepository                         │  │
│  │  - childDataRepository                        │  │
│  │  - studyDataRepository                        │  │
│  │  - syncManager                                │  │
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
        │   MongoDB Atlas (云端)       │
        │  - users 集合                 │
        │  - children 集合              │
        │  - study_records 集合         │
        │  - generation_history 集合    │
        └──────────────────────────────┘
```

---

## 📊 数据模型设计

### 1. users 集合

```javascript
{
  _id: ObjectId,
  userId: String,           // 与app内用户ID对应
  email: String,            // 用户邮箱
  passwordHash: String,     // 密码哈希
  profile: {
    name: String,
    phone: String,
    preferences: {
      language: String,
      difficulty: String,
      notification: Boolean
    }
  },
  security: {
    failedLoginAttempts: Number,
    lastLoginAt: Date,
    accountLocked: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}

索引：
- userId (唯一)
- email (唯一)
```

### 2. children 集合

```javascript
{
  _id: ObjectId,
  childId: String,          // 与app内孩子ID对应
  parentId: String,         // 关联用户ID
  name: String,
  grade: String,            // "一年级" ~ "六年级"
  birthday: Date,
  avatar: String,           // 头像URL
  createdAt: Date,
  updatedAt: Date
}

索引：
- childId (唯一)
- parentId
- parentId + grade
```

### 3. study_records 集合

```javascript
{
  _id: ObjectId,
  recordId: String,
  childId: String,          // 关联孩子ID
  parentId: String,         // 关联用户ID
  questionId: String,
  action: String,           // "upload", "practice", "review"
  duration: Number,         // 毫秒
  correct: Boolean,
  metadata: {
    questionType: String,
    difficulty: String
  },
  timestamp: Date
}

索引：
- recordId (唯一)
- childId
- parentId + childId
- timestamp (降序)
- action
```

### 4. generation_history 集合

```javascript
{
  _id: ObjectId,
  generationId: String,
  userId: String,           // 用户ID
  originalQuestion: {
    text: String,
    type: String,
    difficulty: String
  },
  generatedQuestions: [{
    question: String,
    answer: String,
    explanation: String
  }],
  childId: String,          // 关联孩子ID
  generatedAt: Date
}

索引：
- generationId (唯一)
- userId
- userId + childId
- generatedAt (降序)
```

---

## 🔌 API 设计

### 核心服务接口

#### mongoDataService.ts

```typescript
interface MongoDataService {
  // 连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // 用户数据
  userRepository: UserDataRepository;
  // 孩子数据
  childRepository: ChildDataRepository;
  // 学习记录
  studyRepository: StudyDataRepository;
  // 生成历史
  generationRepository: GenerationDataRepository;
}
```

#### userDataRepository.ts

```typescript
interface UserDataRepository {
  // 创建用户
  createUser(userData: CreateUserRequest): Promise<User>;
  // 获取用户
  getUserById(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  // 更新用户
  updateUser(userId: string, updates: UpdateUserRequest): Promise<User>;
  // 删除用户
  deleteUser(userId: string): Promise<void>;
  // 安全操作
  recordLoginAttempt(email: string, success: boolean): Promise<void>;
  incrementFailedLoginAttempts(email: string): Promise<void>;
  resetFailedLoginAttempts(email: string): Promise<void>;
}
```

#### childDataRepository.ts

```typescript
interface ChildDataRepository {
  // CRUD操作
  createChild(childData: CreateChildRequest): Promise<Child>;
  getChildById(childId: string): Promise<Child | null>;
  getChildrenByParentId(parentId: string): Promise<Child[]>;
  updateChild(childId: string, updates: UpdateChildRequest): Promise<Child>;
  deleteChild(childId: string): Promise<void>;
}
```

#### studyDataRepository.ts

```typescript
interface StudyDataRepository {
  // 记录学习行为
  createStudyRecord(record: CreateStudyRecordRequest): Promise<StudyRecord>;
  // 获取学习记录
  getStudyRecordsByChildId(childId: string, limit?: number): Promise<StudyRecord[]>;
  // 获取统计数据
  getStudyStatistics(childId: string, startDate?: Date, endDate?: Date): Promise<StudyStatistics>;
  // 批量操作
  batchCreateStudyRecords(records: CreateStudyRecordRequest[]): Promise<void>;
}
```

---

## 🔄 同步策略

### 智能同步管理器 (syncManager)

```typescript
interface SyncManager {
  // 同步策略
  syncStrategy: 'realtime' | 'manual' | 'scheduled';

  // 实时同步
  enableRealtimeSync(): void;
  disableRealtimeSync(): void;

  // 手动同步
  syncNow(): Promise<SyncResult>;

  // 冲突解决
  resolveConflict(conflict: SyncConflict): Resolution;

  // 同步状态
  getSyncStatus(): SyncStatus;
}
```

### 同步策略

1. **写操作**：立即写入MongoDB，成功后更新本地缓存
2. **读操作**：优先读取本地缓存，后台异步刷新
3. **离线模式**：写入本地队列，联网后批量同步
4. **冲突解决**：时间戳优先，保留最新数据

---

## 🔒 安全设计

### 认证与授权

```typescript
// API密钥配置
interface MongoConfig {
  uri: string;              // MongoDB连接URI
  apiKey: string;           // MongoDB Atlas API Key
  dbName: string;           // 数据库名称
  collectionPrefix: string; // 集合前缀
}

// 用户数据隔离
interface DataScope {
  userId: string;           // 所有用户操作限定在userId范围内
  role: 'parent' | 'child'; // 角色权限
}
```

### 数据加密

- 传输加密：TLS/SSL
- 存储加密：MongoDB Atlas自动加密
- 密码哈希：SHA-256 + Salt
- API密钥：环境变量存储

---

## 📈 性能优化

### 缓存策略

```typescript
interface CacheStrategy {
  // 热点数据缓存
  hotData: {
    activeChild: Child;
    recentGenerations: GenerationHistory[];
  };

  // 缓存失效策略
  invalidateOn: {
    write: boolean;         // 写操作后失效
    timeout: number;        // 超时失效（毫秒）
    version: string;        // 版本变化失效
  };

  // 预加载策略
  preload: {
    onAppStart: string[];   // 启动时预加载的数据
    onChildSwitch: string[]; // 切换孩子时预加载
  };
}
```

### 索引优化

```javascript
// 复合索引
db.study_records.createIndex({
  parentId: 1,
  childId: 1,
  timestamp: -1
});

// 覆盖索引
db.children.createIndex({
  parentId: 1,
  grade: 1,
  name: 1
});
```

---

## 🧪 测试策略

### 单元测试

```typescript
describe('MongoDataService', () => {
  it('should create user successfully');
  it('should handle duplicate email');
  it('should sync data on write');
  it('should fall back to cache on network error');
});
```

### 集成测试

```typescript
describe('Sync Manager Integration', () => {
  it('should sync offline changes on reconnect');
  it('should resolve conflicts using timestamp');
  it('should maintain data consistency across devices');
});
```

---

## 🚀 实施计划

### Phase 1: 基础设施 (1-2周)
- [ ] 设置MongoDB Atlas账户和集群
- [ ] 创建数据库和集合
- [ ] 配置索引
- [ ] 实现基础连接服务

### Phase 2: 数据访问层 (2-3周)
- [ ] 实现UserDataRepository
- [ ] 实现ChildDataRepository
- [ ] 实现StudyDataRepository
- [ ] 实现GenerationDataRepository

### Phase 3: 同步管理 (1-2周)
- [ ] 实现SyncManager
- [ ] 实现离线队列
- [ ] 实现冲突解决

### Phase 4: 集成测试 (1周)
- [ ] 端到端测试
- [ ] 性能测试
- [ ] 安全测试

---

## 📋 成本估算

### MongoDB Atlas (免费层)

| 项目 | 配置 | 成本 |
|------|------|------|
| 共享RAM | 512MB | ¥0/月 |
| 存储 | 512MB | ¥0/月 |
| API调用 | 包含 | ¥0/月 |

### 扩展层（按需）

| 项目 | 配置 | 成本 |
|------|------|------|
| 专用服务器 | 2GB RAM | ¥约300/月 |
| 存储 | 10GB | ¥约50/月 |
| 数据传输 | 10GB/月 | ¥约30/月 |

---

## ⚠️ 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 网络延迟 | 用户体验差 | 本地缓存 + 预加载 |
| 数据冲突 | 数据不一致 | 时间戳 + 冲突解决策略 |
| API限制 | 服务不可用 | 降级到本地存储 |
| 成本增加 | 运营成本 | 优化查询 + 使用免费层 |

---

**文档版本**: 1.0
**创建日期**: 2026-03-25
**作者**: Scrum Master Bob
