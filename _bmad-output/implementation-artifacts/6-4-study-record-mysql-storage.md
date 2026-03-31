# Story 6.4: study-record-mysql-storage

**Epic**: Epic 6 - 数据存储层
**优先级**: P2 (中)
**估算**: 2-3天
**状态**: review

---

## ✅ Tasks/Subtasks

### AC1: 实现StudyDataRepository（Prisma）
- [ ] Task 1.1: 创建StudyDataRepository服务
  - [ ] 实现学习记录CRUD操作（创建、读取、更新、删除）
  - [ ] 实现按childId查询方法（findByChildId）
  - [ ] 实现按parentId查询方法（findByParentId）
  - [ ] 实现按action筛选方法（findByAction）
  - [ ] 实现时间范围查询方法（findByTimeRange）
  - [ ] 实现统计查询方法（getStatistics）
  - [ ] 添加事务支持（批量操作）
- [ ] Task 1.2: 实现数据验证
  - [ ] recordId唯一性验证
  - [ ] action枚举验证（upload/practice/review）
  - [ ] duration范围验证（0-3600000毫秒）
  - [ ] correct字段类型验证
  - [ ] 时间戳格式验证
- [ ] Task 1.3: 实现外键关系管理
  - [ ] 孩子关系验证（childId外键）
  - [ ] 家长关系验证（parentId外键）
  - [ ] 级联删除处理（删除孩子时删除记录）
  - [ ] 关系完整性检查

### AC2: studyApi集成MySQL
- [ ] Task 2.1: 重构studyApi
  - [ ] 替换AsyncStorage为StudyDataRepository
  - [ ] 保持现有API接口不变
  - [ ] 实现双模式：MySQL主 + AsyncStorage缓存
  - [ ] 添加连接状态检查
- [ ] Task 2.2: 更新recordStudy操作
  - [ ] recordStudy：MySQL存储 + AsyncStorage缓存
  - [ ] 添加题目类型和难度字段存储
  - [ ] 实现批量记录插入优化
  - [ ] 添加离线队列机制
- [ ] Task 2.3: 更新getStatistics操作
  - [ ] getStatistics：MySQL统计查询 + 缓存优化
  - [ ] 实现时间范围统计（最近7天/30天）
  - [ ] 实现准确率统计优化
  - [ ] 实现平均时长统计
  - [ ] 添加最近活动查询优化

### AC3: 统计查询性能测试通过
- [ ] Task 3.1: 查询性能测试
  - [ ] 测试1000条记录的统计查询性能（<1秒）
  - [ ] 测试时间范围查询性能（使用索引）
  - [ ] 测试复合索引效果验证
  - [ ] 测试并发查询性能
- [ ] Task 3.2: 大数据量测试
  - [ ] 测试10000条记录的查询性能
  - [ ] 测试大数据量下的缓存策略
  - [ ] 测试分页查询性能
  - [ ] 测试数据归档机制
- [ ] Task 3.3: 统计准确性测试
  - [ ] 验证统计数据准确性
  - [ ] 验证时间范围计算准确性
  - [ ] 验证平均时长计算准确性
  - [ ] 验证准确率计算准确性

### AC4: 大数据量测试通过
- [ ] Task 4.1: 数据归档测试
  - [ ] 测试6个月数据归档功能
  - [ ] 测试归档后查询性能
  - [ ] 测试归档数据恢复
- [ ] Task 4.2: 并发操作测试
  - [ ] 测试并发插入记录
  - [ ] 测试并发统计查询
  - [ ] 测试并发更新操作
- [ ] Task 4.3: 缓存策略测试
  - [ ] 测试缓存命中率和更新策略
  - [ ] 测试缓存一致性
  - [ ] 测试缓存失效机制

---

## 📝 Dev Notes

### 实施说明

这是Epic 6的第四个故事，建立在Story 6-1（MySQL基础设施）、Story 6-2（用户数据）和Story 6-3（孩子数据）之上。本故事专注于将学习记录从AsyncStorage迁移到MySQL，同时保持与现有UI和服务的完全兼容。

### 技术栈

- **Prisma ORM**: 类型安全的数据库访问
- **MySQL 8.0+**: 关系型数据库（已在Story 6-1搭建）
- **mysql2驱动**: 高性能MySQL客户端
- **AsyncStorage**: 本地缓存和离线降级方案
- **TypeScript**: 类型安全

### 关键文件

- `src/services/mysql/StudyDataRepository.ts`: 学习数据仓库（新建）
- `src/services/api.ts`: studyApi重构（修改）
- `src/services/mysql/prismaClient.ts`: Prisma客户端（已存在）
- `prisma/schema.prisma`: 数据模型定义（已存在）

---

## 🔬 开发者上下文

### EPIC分析：Epic 6 - 数据存储层

**Epic目标**：从AsyncStorage迁移到MySQL关系型数据库，提供严格的数据一致性、ACID事务支持和多设备同步能力。

**Epic中的所有故事**：
- Story 6-1: MySQL基础设施搭建 ✅ (已完成，review状态)
- Story 6-2: 用户数据MySQL存储 ✅ (review状态)
- Story 6-3: 孩子数据MySQL存储 ✅ (review状态)
- Story 6-4: 学习记录MySQL存储 (当前故事)
- Story 6-5: 离线同步与冲突解决

### 故事基础：Story 6-4需求

**用户故事**：
作为开发者，我需要实现学习记录的MySQL存储服务，以便学习行为数据可以在多设备间同步并提供可靠的统计分析功能。

**验收标准**：
1. ✅ 实现StudyDataRepository（Prisma）
2. ✅ studyApi集成MySQL
3. ✅ 统计查询性能测试通过
4. ✅ 大数据量测试通过

**技术要求**：
- 使用Prisma ORM进行数据库操作
- 保持现有studyApi API接口不变
- 实现智能缓存策略（MySQL主 + AsyncStorage缓存）
- 提供离线降级方案
- 确保外键约束和数据完整性
- 优化统计查询性能

**依赖关系**：
- 依赖Story 6-1（Prisma基础设施）
- 依赖Story 6-2（用户数据，因为记录包含家长ID）
- 依赖Story 6-3（孩子数据，因为记录关联孩子）
- 被Story 6-5依赖

### 前序故事智能：Story 6-3完成总结

**已完成的工作**：
1. ✅ 实现ChildDataRepository完整的CRUD操作
2. ✅ childApi集成MySQL保持API接口不变
3. ✅ 实现智能缓存策略（MySQL主 + AsyncStorage缓存）
4. ✅ 外键约束验证测试通过
5. ✅ 级联删除测试通过（删除用户时删除孩子）

**关键设计模式**（应用于本故事）：
- **仓库模式**：`ChildDataRepository` → `StudyDataRepository`
- **双模式架构**：MySQL主存储 + AsyncStorage缓存
- **降级方案**：MySQL不可用时使用AsyncStorage
- **外键关系**：记录关联到孩子（childId外键）

**Prisma Schema中的StudyRecord模型**：

```prisma
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
```

**关键设计决策**：
- **外键关系**：`childId`关联到`children.childId`
- **级联删除**：删除孩子时自动删除学习记录
- **复合索引**：`(parentId, childId)`优化家长查询孩子记录
- **时间索引**：`timestamp`优化时间范围查询
- **行为索引**：`action`优化按行为类型统计

### 前序故事智能：当前AsyncStorage实现

**当前实现**（AsyncStorage-based）：

**位置**：`src/services/api.ts`中的`studyApi`

**核心功能**：
1. ✅ `recordStudy(data)`: 记录学习行为
2. ✅ `getStatistics()`: 获取学习统计

**存储结构**（AsyncStorage）：
- 存储键：`@study_records_{childId}`
- 数据格式：`StudyRecord[]`数组
- 存储限制：最多保留1000条记录
- 存储位置：本地AsyncStorage

**统计计算**（本地计算）：
```typescript
// 总题目数
totalQuestions: records.length

// 正确数
correctCount: records.filter(r => r.correct === true).length

// 按行为类型统计
uploadCount: records.filter(r => r.action === 'upload').length
practiceCount: records.filter(r => r.action === 'practice').length
reviewCount: records.filter(r => r.action === 'review').length

// 准确率
accuracy: correctCount / practiceCount

// 平均时长
averageDuration: totalDuration / practiceCount
```

### 架构文档分析

**数据模型**（来自`prisma/schema.prisma`）：

**Prisma StudyRecord vs Application StudyRecord**：

| 字段 | Prisma StudyRecord | Application StudyRecord | 映射 |
|------|-------------------|------------------------|------|
| 记录ID | `recordId` | `id` | ✅ 需要映射 |
| 孩子ID | `childId` | (从活跃孩子获取) | ✅ 需要填充 |
| 家长ID | `parentId` | (从用户获取) | ✅ 需要填充 |
| 题目ID | `questionId` | `questionId` | ✅ 匹配 |
| 行为 | `action` (Action枚举) | `action` (upload/practice/review) | ✅ 匹配 |
| 时长 | `duration` | `duration` | ✅ 匹配 |
| 正确 | `correct` | `correct` | ✅ 匹配 |
| 时间戳 | `timestamp` | `timestamp` | ✅ 匹配 |
| 题目类型 | `questionType` | (新增) | ⚠️ 需要添加 |
| 难度 | `difficulty` | (新增) | ⚠️ 需要添加 |

**关键差异**：
1. **ID字段映射**：Prisma的`recordId`对应Application的`id`
2. **外键关系**：Prisma需要`childId`和`parentId`，Application从上下文获取
3. **新增字段**：题目类型和难度需要在记录时添加

**外键关系**：
```
Child (1) ←→ (N) StudyRecord
  └─ studyRecords: StudyRecord[]
       └─ child: Child (childId → children.childId)
       └─ 级联删除：删除Child时自动删除StudyRecord
```

**索引优化**：
- `idx_record_id`: recordId唯一索引
- `idx_child_id`: 按孩子查询
- `idx_parent_child`: 复合索引，优化家长查询孩子记录
- `idx_timestamp`: 时间范围查询优化
- `idx_action`: 按行为类型统计优化

### 类型系统分析

**Action枚举**（`prisma/schema.prisma`）：
```prisma
enum Action {
  upload
  practice
  review
}
```

**Application Action**（`src/types/index.ts`）：
```typescript
action: 'upload' | 'practice' | 'review'
```

✅ **无需转换**：Application和Prisma使用相同的枚举值

### Git智能分析

**最近提交**：
```
ecb4dfc5 chore: 更新Story 6-3状态为review
248a7cb4 feat: 完成Story 6-3孩子数据MySQL存储
8dc1f88c feat: 优化首页UI并修复输入框问题
772abf96 fix: 彻底重构FormInput组件修复输入框问题
6d931f5d fix: 修复注册登录输入框无法输入的问题
```

**代码模式**：
- 服务在`src/services/`
- 测试在`src/services/__tests__/`
- 使用AsyncStorage作为本地缓存
- 使用`ApiResponse<T>`包装器统一API响应
- Repository模式：数据访问层封装

**Story 6-3关键实现模式**：
1. ✅ **仓库类模式**：`ChildDataRepository`类封装所有CRUD操作
2. ✅ **转换函数**：`toPrisma*`和`fromPrisma*`处理数据转换
3. ✅ **双模式架构**：MySQL主存储 + AsyncStorage缓存
4. ✅ **API兼容**：保持现有API接口不变，内部切换实现

---

## 🏗️ 架构合规性

### 必须遵循的架构约束

**数据存储架构**（来自`architecture-design.md`）：
- ✅ 使用MySQL 8.0+关系型数据库
- ✅ 使用Prisma ORM进行数据访问
- ✅ 实现ACID事务保证数据一致性
- ✅ 使用AsyncStorage作为本地缓存
- ✅ 实现离线降级方案

**外键关系要求**（来自`mysql-data-layer-design.md`）：
- ✅ StudyRecord.childId外键关联到Child.childId
- ✅ ON DELETE CASCADE：删除孩子时自动删除学习记录
- ✅ 外键约束确保数据完整性

**性能要求**（来自`prd.md`）：
- ✅ 用户操作响应时间不超过1秒
- ✅ 统计查询性能优化（使用索引）
- ✅ 1000条记录统计查询在1秒内完成
- ✅ 10000条记录查询性能可接受

**数据完整性要求**：
- ✅ recordId唯一性约束
- ✅ childId外键约束
- ✅ action枚举约束
- ✅ 时间戳格式验证

**性能优化要求**（来自`mysql-data-layer-design.md`）：
- ✅ 使用复合索引`idx_parent_child`优化家长查询
- ✅ 使用时间索引`idx_timestamp`优化时间范围查询
- ✅ 使用行为索引`idx_action`优化统计查询
- ✅ 实现数据归档策略（6个月阈值）

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
├── prismaClient.ts              # Prisma客户端（已存在）
├── UserDataRepository.ts        # 用户数据仓库（已存在，Story 6-2）
├── ChildDataRepository.ts       # 孩子数据仓库（已存在，Story 6-3）
├── StudyDataRepository.ts       # 学习数据仓库（新建）
└── __tests__/
    ├── prismaClient.test.ts     # Prisma客户端测试（已存在）
    ├── UserDataRepository.test.ts  # 用户数据测试（已存在）
    ├── ChildDataRepository.test.ts # 孩子数据测试（已存在）
    ├── StudyDataRepository.test.ts # 学习数据测试（新建）
    └── integration.test.ts        # 集成测试（新建）
```

**命名约定**：
- 仓库类：`{Entity}DataRepository`
- 测试文件：`{Entity}DataRepository.test.ts`
- 导出：命名导出（`export class StudyDataRepository`）

---

## 🧪 测试要求

### 单元测试

**StudyDataRepository测试**（`StudyDataRepository.test.ts`）：

```typescript
describe('StudyDataRepository', () => {
  // 创建记录
  it('should create study record with valid data', async () => {
    const record = await studyDataRepository.create({
      recordId: 'test-record-1',
      childId: 'test-child-1',
      parentId: 'test-user-1',
      questionId: 'question-123',
      action: 'practice',
      duration: 30000,
      correct: true,
      questionType: '加法',
      difficulty: '简单',
    });
    expect(record.recordId).toBe('test-record-1');
  });

  // 按childId查询
  it('should find records by childId', async () => {
    const records = await studyDataRepository.findByChildId('test-child-1');
    expect(records.length).toBeGreaterThan(0);
  });

  // 按parentId查询
  it('should find records by parentId', async () => {
    const records = await studyDataRepository.findByParentId('test-user-1');
    expect(records.length).toBeGreaterThan(0);
  });

  // 按action筛选
  it('should filter records by action', async () => {
    const records = await studyDataRepository.findByAction('practice');
    expect(records.every(r => r.action === 'practice')).toBe(true);
  });

  // 时间范围查询
  it('should find records in time range', async () => {
    const startDate = new Date('2026-03-01');
    const endDate = new Date('2026-03-31');
    const records = await studyDataRepository.findByTimeRange(
      'test-child-1',
      startDate,
      endDate
    );
    expect(records.length).toBeGreaterThan(0);
  });

  // 统计查询
  it('should calculate statistics correctly', async () => {
    const stats = await studyDataRepository.getStatistics('test-child-1');
    expect(stats.totalQuestions).toBeDefined();
    expect(stats.correctCount).toBeDefined();
    expect(stats.accuracy).toBeGreaterThanOrEqual(0);
    expect(stats.averageDuration).toBeGreaterThan(0);
  });

  // 外键约束测试
  it('should reject record with non-existent child', async () => {
    await expect(
      studyDataRepository.create({
        recordId: 'orphan-record',
        childId: 'non-existent-child',
        parentId: 'test-user-1',
        action: 'practice',
      })
    ).rejects.toThrow('Foreign key constraint');
  });

  // action枚举测试
  it('should reject invalid action', async () => {
    await expect(
      studyDataRepository.create({
        recordId: 'invalid-action-record',
        childId: 'test-child-1',
        parentId: 'test-user-1',
        action: 'invalid', // 无效行为
      })
    ).rejects.toThrow('Enum constraint');
  });
});
```

### 集成测试

**studyApi集成测试**（`studyApi.integration.test.ts`）：

```typescript
describe('studyApi MySQL Integration', () => {
  // 记录学习行为
  it('should record study to MySQL and cache in AsyncStorage', async () => {
    const response = await studyApi.recordStudy({
      questionId: 'question-123',
      action: 'practice',
      duration: 30000,
      correct: true,
    });

    expect(response.success).toBe(true);

    // 验证MySQL
    const records = await studyDataRepository.findByChildId('test-child');
    expect(records.length).toBeGreaterThan(0);

    // 验证AsyncStorage缓存
    const cachedRecords = await AsyncStorage.getItem('@study_records_test-child');
    expect(cachedRecords).not.toBeNull();
  });

  // 获取统计
  it('should get statistics from MySQL with cache fallback', async () => {
    const response = await studyApi.getStatistics();

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.totalQuestions).toBeGreaterThanOrEqual(0);
    expect(response.data.accuracy).toBeGreaterThanOrEqual(0);
  });

  // 批量记录测试
  it('should handle batch recording efficiently', async () => {
    const batchSize = 100;
    const startTime = Date.now();

    for (let i = 0; i < batchSize; i++) {
      await studyApi.recordStudy({
        questionId: `question-${i}`,
        action: 'practice',
        duration: 30000,
        correct: i % 2 === 0,
      });
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5秒内完成
  });

  // 级联删除测试
  it('should cascade delete records when child deleted', async () => {
    // 创建孩子和记录
    const child = await childDataRepository.create({
      childId: 'test-child-delete',
      parentId: 'test-user-1',
      name: '测试孩子',
      grade: '一年级',
    });

    await studyDataRepository.create({
      recordId: 'test-record-delete',
      childId: child.childId,
      parentId: 'test-user-1',
      action: 'practice',
    });

    // 删除孩子
    await childDataRepository.delete(child.childId);

    // 验证记录也被删除
    const deletedRecord = await studyDataRepository.findByChildId(child.childId);
    expect(deletedRecord).toHaveLength(0);
  });
});
```

### 性能测试

**查询性能测试**（`performance.test.ts`）：

```typescript
describe('StudyDataRepository Performance', () => {
  beforeAll(async () => {
    // 插入1000条测试数据
    const records = Array.from({length: 1000}, (_, i) => ({
      recordId: `perf-record-${i}`,
      childId: 'perf-child-1',
      parentId: 'perf-user-1',
      questionId: `question-${i}`,
      action: 'practice',
      duration: Math.floor(Math.random() * 60000),
      correct: Math.random() > 0.3,
    }));

    for (const record of records) {
      await studyDataRepository.create(record);
    }
  });

  // 统计查询性能
  it('should calculate statistics within 1 second', async () => {
    const startTime = Date.now();
    const stats = await studyDataRepository.getStatistics('perf-child-1');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
    expect(stats.totalQuestions).toBe(1000);
  });

  // 时间范围查询性能
  it('should query time range efficiently using index', async () => {
    const startTime = Date.now();
    const records = await studyDataRepository.findByTimeRange(
      'perf-child-1',
      new Date('2026-03-01'),
      new Date('2026-03-31')
    );
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(500);
  });

  // 复合索引性能验证
  it('should use composite index for parent-child query', async () => {
    const startTime = Date.now();
    const records = await studyDataRepository.findByParentIdAndChildId(
      'perf-user-1',
      'perf-child-1'
    );
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(300);
    expect(records.length).toBe(1000);
  });

  // 大数据量测试（10000条）
  it('should handle 10000 records efficiently', async () => {
    // 插入9000条额外记录
    for (let i = 1000; i < 10000; i++) {
      await studyDataRepository.create({
        recordId: `large-record-${i}`,
        childId: 'large-child-1',
        parentId: 'large-user-1',
        action: 'practice',
      });
    }

    const startTime = Date.now();
    const stats = await studyDataRepository.getStatistics('large-child-1');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
    expect(stats.totalQuestions).toBe(10000);
  });
});
```

---

## 🚀 实施指南

### Step 1: 创建StudyDataRepository

**文件**: `src/services/mysql/StudyDataRepository.ts`

```typescript
import {PrismaClient, StudyRecord, Action} from '@prisma/client';
import {prismaClient} from './prismaClient';

export class StudyDataRepository {
  /**
   * 创建学习记录
   */
  async create(data: {
    recordId: string;
    childId: string;
    parentId: string;
    questionId?: string;
    action: Action;
    duration?: number;
    correct?: boolean;
    questionType?: string;
    difficulty?: string;
  }): Promise<StudyRecord> {
    return prismaClient.studyRecord.create({
      data: {
        recordId: data.recordId,
        childId: data.childId,
        parentId: data.parentId,
        questionId: data.questionId,
        action: data.action,
        duration: data.duration || 0,
        correct: data.correct,
        questionType: data.questionType,
        difficulty: data.difficulty,
      },
    });
  }

  /**
   * 按recordId查询
   */
  async findByRecordId(recordId: string): Promise<StudyRecord | null> {
    return prismaClient.studyRecord.findUnique({
      where: {recordId},
    });
  }

  /**
   * 按childId查询所有记录
   */
  async findByChildId(childId: string): Promise<StudyRecord[]> {
    return prismaClient.studyRecord.findMany({
      where: {childId},
      orderBy: {timestamp: 'desc'},
    });
  }

  /**
   * 按parentId查询所有记录
   */
  async findByParentId(parentId: string): Promise<StudyRecord[]> {
    return prismaClient.studyRecord.findMany({
      where: {parentId},
      orderBy: {timestamp: 'desc'},
    });
  }

  /**
   * 按家长和孩子查询（使用复合索引）
   */
  async findByParentIdAndChildId(
    parentId: string,
    childId: string
  ): Promise<StudyRecord[]> {
    return prismaClient.studyRecord.findMany({
      where: {
        parentId,
        childId,
      },
      orderBy: {timestamp: 'desc'},
    });
  }

  /**
   * 按行为类型筛选
   */
  async findByAction(action: Action): Promise<StudyRecord[]> {
    return prismaClient.studyRecord.findMany({
      where: {action},
      orderBy: {timestamp: 'desc'},
    });
  }

  /**
   * 时间范围查询
   */
  async findByTimeRange(
    childId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudyRecord[]> {
    return prismaClient.studyRecord.findMany({
      where: {
        childId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {timestamp: 'desc'},
    });
  }

  /**
   * 统计查询
   */
  async getStatistics(childId: string): Promise<{
    totalQuestions: number;
    correctCount: number;
    uploadCount: number;
    practiceCount: number;
    reviewCount: number;
    accuracy: number;
    averageDuration: number;
  }> {
    const records = await this.findByChildId(childId);

    const practiceRecords = records.filter(r => r.action === 'practice');
    const correctRecords = practiceRecords.filter(r => r.correct === true);
    const uploadRecords = records.filter(r => r.action === 'upload');
    const reviewRecords = records.filter(r => r.action === 'review');

    const totalDuration = practiceRecords.reduce(
      (sum, r) => sum + (r.duration || 0),
      0
    );

    return {
      totalQuestions: records.length,
      correctCount: correctRecords.length,
      uploadCount: uploadRecords.length,
      practiceCount: practiceRecords.length,
      reviewCount: reviewRecords.length,
      accuracy: practiceRecords.length > 0
        ? correctRecords.length / practiceRecords.length
        : 0,
      averageDuration: practiceRecords.length > 0
        ? Math.round(totalDuration / practiceRecords.length)
        : 0,
    };
  }

  /**
   * 删除记录
   */
  async delete(recordId: string): Promise<void> {
    await prismaClient.studyRecord.delete({
      where: {recordId},
    });
  }

  /**
   * 批量创建记录（事务）
   */
  async createMany(
    records: Array<{
      recordId: string;
      childId: string;
      parentId: string;
      questionId?: string;
      action: Action;
      duration?: number;
      correct?: boolean;
    }>
  ): Promise<void> {
    await prismaClient.$transaction(
      records.map(record =>
        prismaClient.studyRecord.create({
          data: record,
        })
      )
    );
  }
}
```

### Step 2: 重构studyApi

**文件**: `src/services/api.ts`

**更新studyApi**：

```typescript
import {StudyDataRepository} from './mysql/StudyDataRepository';

const studyDataRepository = new StudyDataRepository();

// 学习记录API（MySQL + AsyncStorage版本）
export const studyApi = {
  /**
   * 记录学习行为（MySQL主存储 + AsyncStorage缓存）
   */
  recordStudy: async (data: {
    questionId: string;
    action: 'upload' | 'practice' | 'review';
    duration?: number;
    correct?: boolean;
    questionType?: string;
    difficulty?: string;
  }) => {
    try {
      // 获取活跃孩子ID
      const { activeChildService } = await import('./activeChildService');
      await activeChildService.waitForInitialization();
      const activeChildId = activeChildService.getActiveChildId();

      if (!activeChildId) {
        return {
          success: false,
          error: {
            code: 'NO_ACTIVE_CHILD',
            message: '请先选择一个孩子',
          },
        };
      }

      // 获取当前用户
      const { userApi } = await import('./userApi');
      const userResponse = await userApi.getCurrentUser();
      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          error: {
            code: 'NO_USER',
            message: '用户未登录',
          },
        };
      }

      const userId = userResponse.data.id;
      const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 写入MySQL
      await studyDataRepository.create({
        recordId,
        childId: activeChildId,
        parentId: userId,
        questionId: data.questionId,
        action: data.action,
        duration: data.duration,
        correct: data.correct,
        questionType: data.questionType,
        difficulty: data.difficulty,
      });

      // 更新AsyncStorage缓存
      const storageKey = `@study_records_${activeChildId}`;
      const existingData = await AsyncStorage.getItem(storageKey);
      const records = existingData ? JSON.parse(existingData) : [];

      const newRecord = {
        id: recordId,
        userId,
        questionId: data.questionId,
        action: data.action,
        duration: data.duration,
        correct: data.correct,
        questionType: data.questionType,
        difficulty: data.difficulty,
        timestamp: new Date().toISOString(),
      };

      records.push(newRecord);
      // 限制缓存大小
      if (records.length > 1000) {
        records.splice(0, records.length - 1000);
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(records));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('[studyApi] Failed to record study:', error);
      return {
        success: false,
        error: {
          code: 'RECORD_STUDY_ERROR',
          message: '记录学习行为失败',
        },
      };
    }
  },

  /**
   * 获取学习统计（MySQL统计 + 缓存优化）
   */
  getStatistics: async () => {
    try {
      // 获取活跃孩子ID
      const { activeChildService } = await import('./activeChildService');
      await activeChildService.waitForInitialization();
      const activeChildId = activeChildService.getActiveChildId();

      if (!activeChildId) {
        return {
          success: false,
          error: {
            code: 'NO_ACTIVE_CHILD',
            message: '请先选择一个孩子',
          },
        };
      }

      // 从MySQL获取统计
      const stats = await studyDataRepository.getStatistics(activeChildId);

      // 获取最近活动
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentRecords = await studyDataRepository.findByTimeRange(
        activeChildId,
        sevenDaysAgo,
        new Date()
      );

      const recentActivity = recentRecords.slice(0, 10).map(r => ({
        id: r.recordId,
        questionId: r.questionId,
        action: r.action,
        duration: r.duration,
        correct: r.correct,
        timestamp: r.timestamp.toISOString(),
      }));

      return {
        success: true,
        data: {
          ...stats,
          recentActivity,
        },
      };
    } catch (error) {
      console.error('[studyApi] Failed to get statistics:', error);
      return {
        success: false,
        error: {
          code: 'GET_STATISTICS_ERROR',
          message: '获取学习统计失败',
        },
      };
    }
  },
};
```

---

## 📋 完成标准

### 代码完成标准
- [ ] StudyDataRepository实现完整的CRUD操作
- [ ] studyApi重构完成，保持API接口兼容
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 所有性能测试通过
- [ ] 代码符合项目编码规范

### 性能完成标准
- [ ] 1000条记录统计查询在1秒内完成
- [ ] 10000条记录查询在2秒内完成
- [ ] 时间范围查询使用索引优化
- [ ] 复合索引验证通过

### 数据完整性完成标准
- [ ] recordId唯一性约束验证通过
- [ ] childId外键约束验证通过
- [ ] action枚举约束验证通过
- [ ] 级联删除测试通过

### 缓存策略完成标准
- [ ] MySQL主存储 + AsyncStorage缓存策略实现
- [ ] 缓存一致性验证通过
- [ ] 离线降级方案验证通过

---

## 🔗 相关文件

### 数据库Schema
- `prisma/schema.prisma` - Prisma数据模型定义

### 相关服务
- `src/services/mysql/prismaClient.ts` - Prisma客户端
- `src/services/mysql/UserDataRepository.ts` - 用户数据仓库
- `src/services/mysql/ChildDataRepository.ts` - 孩子数据仓库
- `src/services/activeChildService.ts` - 活跃孩子服务

### 相关类型
- `src/types/index.ts` - 应用类型定义

### 测试文件
- `src/services/mysql/__tests__/StudyDataRepository.test.ts` - 单元测试
- `src/services/mysql/__tests__/studyApi.integration.test.ts` - 集成测试
- `src/services/mysql/__tests__/performance.test.ts` - 性能测试

---

## 📚 参考文档

- [MySQL数据层设计文档](../../_bmad-output/planning-artifacts/mysql-data-layer-design.md)
- [技术架构设计](../../docs/architecture-design.md)
- [产品需求文档](../../docs/prd.md)
- [Story 6-3: 孩子数据MySQL存储](./6-3-child-data-mysql-storage.md)

---

**创建日期**: 2026-03-25
**作者**: Scrum Master Bob
**状态**: ready-for-dev
