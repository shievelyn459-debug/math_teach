# 集成测试指南

**Story 8-4**: 集成测试补充
**创建日期**: 2026-04-05
**状态**: In-Progress

---

## 📋 概述

本文档描述了 MathLearningApp 的集成测试策略、配置和最佳实践。

### 测试范围

| AC | 描述 | 文件数量 | 测试用例数 |
|----|------|----------|------------|
| AC1 | API 集成测试 | 4 | 49+ |
| AC2 | 数据库集成测试 | 1 | 18 |
| AC3 | 服务间集成测试 | 1 | 14 |
| AC4 | 错误处理测试 | 1 | 20 |
| **总计** | | **7** | **101+** |

---

## 🚀 快速开始

### 运行所有集成测试

```bash
cd MathLearningApp
npm run test:integration
```

### 运行特定测试文件

```bash
npm test -- --config jest.integration.config.js userAuth.integration.test.ts
```

### 运行带覆盖率的测试

```bash
npm run test:integration -- --coverage
```

### 运行并生成报告

```bash
npm run test:integration -- --coverage --coverageReporters=html
```

---

## 📁 目录结构

```
MathLearningApp/src/__tests__/integration/
├── setup/                           # 测试环境配置
│   ├── testDatabase.ts              # 测试数据库配置
│   └── testData.ts                  # 测试数据工厂
├── api/                             # API集成测试
│   ├── userAuth.integration.test.ts
│   ├── questionGeneration.integration.test.ts
│   ├── childManagement.integration.test.ts
│   └── explanationGeneration.integration.test.ts
├── database/                        # 数据库集成测试
│   └── database.integration.test.ts
├── services/                        # 服务间集成测试
│   └── serviceCollaboration.integration.test.ts
└── errors/                          # 错误处理测试
    └── errorHandling.integration.test.ts
```

---

## ⚙️ 配置文件

### Jest 配置

| 文件 | 用途 |
|------|------|
| `jest.integration.config.js` | 集成测试主配置 |
| `jest.integration.setup.js` | 环境初始化 |
| `jest.integration.afterEnv.js` | 自定义匹配器 |

### 环境变量

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=mysql://test:test@localhost:3306/math_test
API_BASE_URL=http://localhost:3000
TEST_TIMEOUT=30000
```

---

## 🧪 测试分类

### 1. API 集成测试 (AC1)

测试关键API流程的端到端功能：

- **用户认证流程**: 注册、登录、Token刷新、密码重置
- **题目生成流程**: OCR识别 → AI生成 → 保存 → PDF导出
- **儿童管理流程**: 创建、更新、切换、删除
- **讲解生成流程**: 模板/AI生成、缓存、反馈

### 2. 数据库集成测试 (AC2)

测试MySQL数据库操作：

- 连接测试
- 数据持久化
- 复杂查询
- 事务处理
- 数据同步

### 3. 服务间集成测试 (AC3)

测试多服务协作：

- OCR服务 + AI服务
- AI服务 + PDF服务
- 用户服务 + 儿童服务
- 通知服务 + 状态管理

### 4. 错误处理测试 (AC4)

测试错误场景处理：

- 网络断开
- API超时
- 数据库错误
- 第三方服务错误

---

## 📊 测试数据管理

### TestDataFactory

```typescript
import { TestDataFactory } from '../setup/testData';

// 创建测试用户
const user = TestDataFactory.createUser({ email: 'custom@test.com' });

// 创建测试儿童
const child = TestDataFactory.createChild({ parentId: user.id });

// 创建测试题目
const question = TestDataFactory.createQuestion({ childId: child.id });
```

### TestDataCleaner

```typescript
import { TestDataCleaner } from '../setup/testData';

afterAll(async () => {
  await TestDataCleaner.cleanAll();
});
```

---

## 🔧 Mock 策略

### 最小化 Mock

集成测试应尽量减少 Mock 使用：

| 类型 | Mock策略 |
|------|----------|
| 外部API | ✅ Mock (百度OCR, DeepSeek) |
| 数据库 | ⚠️ 使用测试数据库 |
| 文件系统 | ✅ Mock 或使用临时目录 |
| 内部服务 | ❌ 不Mock |

### Mock 示例

```typescript
// Mock API客户端
jest.mock('../../../services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));
```

---

## ✅ 最佳实践

### 1. 测试命名

```typescript
// 好的命名
it('should successfully register a new user', async () => {});
it('should reject duplicate email registration', async () => {});

// 不好的命名
it('test1', async () => {});
it('works', async () => {});
```

### 2. AAA 模式

```typescript
it('should complete full flow', async () => {
  // Arrange
  const testData = TestDataFactory.createUser();

  // Act
  const result = await service.process(testData);

  // Assert
  expect(result.success).toBe(true);
});
```

### 3. 独立测试

```typescript
// 每个测试应该独立
beforeEach(() => {
  jest.clearAllMocks();
});

// 不共享状态
it('test 1', async () => {
  const user = TestDataFactory.createUser();
  // ...
});

it('test 2', async () => {
  const user = TestDataFactory.createUser(); // 新的测试数据
  // ...
});
```

### 4. 超时设置

```typescript
// 对于可能较长的测试
it('should complete within 30 seconds', async () => {
  // ...
}, 30000);
```

---

## 📈 覆盖率目标

| 指标 | 目标 | 当前 |
|------|------|------|
| 语句覆盖率 | ≥ 80% | - |
| 分支覆盖率 | ≥ 75% | - |
| 函数覆盖率 | ≥ 85% | - |
| 行覆盖率 | ≥ 80% | - |

### 查看覆盖率报告

```bash
npm run test:integration -- --coverage
open coverage/integration/lcov-report/index.html
```

---

## 🔍 调试技巧

### 1. 单独运行失败的测试

```bash
npm test -- --config jest.integration.config.js -t "should handle network error"
```

### 2. 查看详细输出

```bash
npm test -- --config jest.integration.config.js --verbose
```

### 3. 不清除Mock

```typescript
// 在特定测试中保留Mock状态
beforeEach(() => {
  // 不调用 jest.clearAllMocks();
});
```

---

## 🚨 故障排除

### 常见问题

1. **测试超时**
   - 增加 `testTimeout` 配置
   - 检查是否有死循环或未解决的Promise

2. **Mock不生效**
   - 确保 `jest.mock` 在文件顶部
   - 检查模块路径是否正确

3. **数据库连接失败**
   - 检查 `.env.test` 配置
   - 确保测试数据库已创建

4. **内存不足**
   - 减少 `maxWorkers`
   - 使用 `--runInBand` 串行运行

---

## 📝 维护指南

### 添加新测试

1. 在相应目录创建测试文件
2. 使用 `*.integration.test.ts` 命名约定
3. 导入 `TestDataFactory` 和 `TestDataCleaner`
4. 遵循 AAA 模式

### 更新测试

1. 当API变更时更新Mock响应
2. 添加新的测试场景
3. 保持测试覆盖率

---

**最后更新**: 2026-04-05
**维护者**: Dev Team
