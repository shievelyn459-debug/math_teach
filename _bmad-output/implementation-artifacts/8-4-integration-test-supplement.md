# Story 8.4: 集成测试补充

Status: in-progress

## Story

As a **开发人员**,
I want **补充集成测试，确保关键用户流程的端到端功能正常工作**,
so that **系统的集成度和可靠性得到保障**.

## Acceptance Criteria

1. **AC1: API 集成测试** - 关键 API 调用流程的集成测试覆盖
2. **AC2: 数据库集成测试** - 数据库操作的集成测试（MySQL）
3. **AC3: 服务间集成测试** - 多个服务协作的集成测试
4. **AC4: 锏误处理流程** - 完整错误处理路径的集成测试
5. **AC5: 测试通过率** - 集成测试通过率达到 95%+
6. **AC6: CI/CD 验证** - 集成测试支持在 CI/CD 环境中运行

## Tasks / Subtasks

- [x] Task 1: 关键流程识别 (AC: #1)
  - [x] 1.1 识别端到端关键用户流程
  - [x] 1.2 映射流程到测试用例
  - [x] 1.3 确定测试优先级

- [x] Task 2: API 集成测试 (AC: #1)
  - [x] 2.1 用户注册-登录流程测试
  - [x] 2.2 题目上传-识别流程测试
  - [x] 2.3 题目生成流程测试
  - [x] 2.4 PDF 导出流程测试
  - [x] 2.5 讲解生成流程测试

- [x] Task 3: 数据库集成测试 (AC: #2)
  - [x] 3.1 MySQL 连接测试
  - [x] 3.2 数据持久化测试
  - [x] 3.3 数据查询测试
  - [x] 3.4 数据同步测试

- [x] Task 4: 服务间集成测试 (AC: #3)
  - [x] 4.1 OCR 服务 + AI 服务协作测试
  - [x] 4.2 AI 服务 + PDF 服务协作测试
  - [x] 4.3 用户服务 + 儿童信息服务测试
  - [x] 4.4 通知服务 + 状态管理测试

- [x] Task 5: 错误处理测试 (AC: #4)
  - [x] 5.1 网络断开场景测试
  - [x] 5.2 API 超时场景测试
  - [x] 5.3 数据库错误场景测试
  - [x] 5.4 第三方服务错误场景测试

- [x] Task 6: CI/CD 集成 (AC: #6)
  - [x] 6.1 配置 CI/CD 流水线
  - [x] 6.2 设置测试数据库
  - [x] 6.3 配置测试环境变量
  - [x] 6.4 运行集成测试套件

- [x] Task 7: 测试文档 (AC: #5)
  - [x] 7.1 编写集成测试指南
  - [x] 7.2 更新测试覆盖率报告
  - [x] 7.3 创建测试数据准备脚本
  - [x] 7.4 编写 CI/CD 测试文档

## Dev Notes

### 关键用户流程

**流程 1: 完整的题目生成流程**
```
用户登录 → 上传题目照片 → OCR 识别 → AI 生成题目 → PDF 导出
```

**流程 2: 知识点学习流程**
```
用户登录 → 选择知识点 → AI 生成讲解 → 用户阅读 → 记录学习进度
```

**流程 3: 儿童管理流程**
```
用户登录 → 创建儿童 → 更新信息 → 查看学习记录 → 删除儿童
```

### 集成测试 vs 单元测试

| 特征 | 单元测试 | 集成测试 |
|------|---------|---------|
| **范围** | 单个函数/组件 | 多个组件/服务 |
| **速度** | 快速 (毫秒级) | 较慢 (秒级) |
| **Mock** | 大量使用 | 最小化使用 |
| **数据库** | Mock | 真实测试数据库 |
| **依赖** | 隔离依赖 | 真实依赖 |

### 集成测试工具

**推荐工具**:
- `@testing-library/react-native` (已安装)
- `jest` (已配置)
- 测试数据库: SQLite (内存) 或 MySQL (测试环境)

**测试数据准备**:
```typescript
// 使用工厂模式创建测试数据
const testUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
};

const testChild = {
  id: 'test-child-1',
  userId: testUser.id,
  name: 'Test Child',
  grade: '一年级',
};
```

### 测试环境配置

**环境变量**:
```bash
# .env.test
DATABASE_URL=mysql://test:test@localhost:3306/math_test
API_BASE_URL=http://localhost:3000
NODE_ENV=test
```

**Jest 配置**:
```javascript
// jest.config.js
module.exports = {
  testMatch: ['**/*.integration.test.{ts,tsx}'],
  testTimeout: 30000, // 30 秒超时
  setupFiles: ['<rootDir>/jest.integration.setup.js'],
};
```

### 优先级 P0 流程

**必须测试**:
1. **用户认证流程** - 注册 → 登录 → 获取用户信息
2. **题目生成流程** - 上传 → 识别 → 生成 → 导出
3. **数据库同步流程** - 本地存储 → MySQL 同步

**P1 流程**:
1. 讲解生成流程
2. 学习记录流程
3. 儿童管理流程

**P2 流程**:
1. 设置管理流程
2. 通知流程
3. 分析统计流程

### 测试示例

**API 集成测试**:
```typescript
describe('User Auth Flow Integration', () => {
  let testUser;

  beforeAll(async () => {
    // 设置测试数据库
    await setupTestDatabase();
  });

  afterAll(async () => {
    // 清理测试数据库
    await cleanupTestDatabase();
  });

  it('should complete full registration flow', async () => {
    // 1. 注册
    const registerResponse = await userApi.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(registerResponse.success).toBe(true);
    testUser = registerResponse.data;

    // 2. 登录
    const loginResponse = await userApi.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(loginResponse.success).toBe(true);

    // 3. 获取用户信息
    const userResponse = await userApi.getUser(testUser.id);
    expect(userResponse.data.email).toBe('test@example.com');
  });

  it('should handle duplicate email error', async () => {
    // 第一次注册
    await userApi.register({
      email: 'duplicate@example.com',
      password: 'password123',
    });

    // 第二次注册（应该失败）
    const response = await userApi.register({
      email: 'duplicate@example.com',
      password: 'password456',
    });

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('DUPLICATE_EMAIL');
  });
});
```

**数据库集成测试**:
```typescript
describe('Database Integration', () => {
  it('should persist and retrieve user data', async () => {
    // 创建用户
    const user = await userDataRepository.create({
      name: 'Test User',
      email: 'test@example.com',
    });

    // 查询用户
    const foundUser = await userDataRepository.findById(user.id);
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe('test@example.com');

    // 更新用户
    await userDataRepository.update(user.id, {
      name: 'Updated User',
    });

    // 验证更新
    const updatedUser = await userDataRepository.findById(user.id);
    expect(updatedUser.name).toBe('Updated User');

    // 删除用户
    await userDataRepository.delete(user.id);

    // 验证删除
    const deletedUser = await userDataRepository.findById(user.id);
    expect(deletedUser).toBeNull();
  });
});
```

### Mock 策略

**最小化 Mock**:
- ✅ 真实数据库连接
- ✅ 真实文件系统（临时目录）
- ❌ 不 mock API 客户端（使用真实或 mock server）
- ❌ 不 mock 内部服务

**可以 Mock**:
- 外部第三方服务（百度 OCR API, DeepSeek API）
- 文件系统（使用临时目录代替）
- 网络请求（使用 mock server）

### 预计工作量

**时间估算**: 2-3 天

**详细分解**:
- 第 1 天: 关键流程集成测试（8 小时）
- 第 2 天: 数据库和服务集成测试（8 小时）
- 第 3 天: 错误处理和 CI/CD 集成（6 小时）

### 关键依赖

**已安装的测试工具**:
- Jest (已配置)
- @testing-library/react-native
- MySQL (生产环境)

**需要安装的测试工具**:
- 无（使用现有工具即可）

**测试环境要求**:
- 测试数据库（MySQL 或 SQLite）
- 测试环境变量配置
- CI/CD 测试流水线配置

### 成功标准

**Story 8.4 完成标志**:
1. ✅ 关键 API 流程集成测试覆盖
2. ✅ 数据库操作集成测试覆盖
3. ✅ 服务协作集成测试覆盖
4. ✅ 错误处理流程测试覆盖
5. ✅ 集成测试通过率 ≥ 95%
6. ✅ CI/CD 集成测试配置完成

### 风险和缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 测试数据库配置复杂 | 中 | 提供 SQLite 内存数据库备选方案 |
| 集成测试运行慢 | 中 | 使用测试数据库快照，| 第三方服务不稳定 | 高 | Mock 外部 API，| 测试数据清理困难 | 低 | 使用事务回滚 |

### Anti-Patterns to Avoid

- ❌ 不要在集成测试中过度 mock
- ❌ 不要依赖外部服务（使用 mock 或测试实例）
- ❌ 不要在测试之间共享状态
- ❌ 不要忽略测试数据清理
- ❌ 不要使用生产数据库

### 与其他 Story 的关系

**Story 8.1 (已完成):** 修复失败测试，**Story 8.2 (已完成):** 分析覆盖率
**Story 8.3 (已完成):** 单元测试增强
**Story 8.4 (当前):** 集成测试补充
**Story 8.5 (后续):** E2E 测试创建
**Story 8.6 (进行中):** UI 组件测试补充
**Story 8.7 (进行中):** API 服务测试补充

## Dev Agent Record

### Agent Model Used
Claude (Dev Agent)

### Debugging Notes

1. **Jest Mock 作用域问题**: 在 `database.integration.test.ts` 中，`jest.mock()` 不能引用外部变量。解决方案是将 mock 对象定义在 mock 工厂函数外部。

2. **测试超时**: 集成测试需要更长的超时时间，设置 `testTimeout: 30000`。

3. **Mock 策略**: 最小化 mock，只 mock 外部第三方服务（百度 OCR、DeepSeek AI），使用测试数据库进行真实操作。

### Completion Notes List

- ✅ 创建了 4 个 API 集成测试文件 (userAuth, questionGeneration, childManagement, explanationGeneration)
- ✅ 创建了数据库集成测试文件
- ✅ 创建了服务间协作集成测试文件
- ✅ 创建了错误处理集成测试文件
- ✅ 配置了 Jest 集成测试环境
- ✅ 创建了测试环境变量文件
- ✅ 编写了集成测试指南文档

### File List

**新增测试文件**:
- MathLearningApp/src/__tests__/integration/api/userAuth.integration.test.ts
- MathLearningApp/src/__tests__/integration/api/questionGeneration.integration.test.ts
- MathLearningApp/src/__tests__/integration/api/childManagement.integration.test.ts
- MathLearningApp/src/__tests__/integration/api/explanationGeneration.integration.test.ts
- MathLearningApp/src/__tests__/integration/database/database.integration.test.ts
- MathLearningApp/src/__tests__/integration/services/serviceCollaboration.integration.test.ts
- MathLearningApp/src/__tests__/integration/errors/errorHandling.integration.test.ts

**配置文件**:
- MathLearningApp/jest.integration.config.js
- MathLearningApp/jest.integration.setup.js
- MathLearningApp/jest.integration.afterEnv.js
- MathLearningApp/.env.test

**文档文件**:
- MathLearningApp/docs/integration-testing-guide.md

**已存在的文件** (之前创建):
- MathLearningApp/src/__tests__/integration/setup/testDatabase.ts
- MathLearningApp/src/__tests__/integration/setup/testData.ts

## Change Log

- 2026-04-04 21:00: Story 8.4 规范文件创建 - 准备集成测试补充
- 2026-04-05 17:30: 完成所有 7 个任务的测试文件创建
- 2026-04-05 17:45: 配置 CI/CD 环境和测试文档
