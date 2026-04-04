# Story 8.7: API 服务测试补充

Status: ready-for-dev

## Story

As a **开发人员**,
I want **补充 API 服务的单元测试，提升 API 服务覆盖率从 6.25% 到 60%**,
so that **API 调用逻辑得到充分测试，网络请求质量得到保障**.

## Acceptance Criteria

1. **AC1: API 服务覆盖率提升** - API 服务覆盖率从 6.25% 提升到 60%+
2. **AC2: 错误处理测试** - 所有错误处理路径得到测试（网络错误、超时、4xx/5xx）
3. **AC3: 重试逻辑测试** - 重试机制得到充分测试
4. **AC4: 类型守卫测试** - API 响应类型守卫函数达到 100% 覆盖
5. **AC5: 测试质量** - 所有测试遵循最佳实践，mock 策略合理
6. **AC6: 文档更新** - 更新 API 测试文档和覆盖率报告

## Tasks / Subtasks

- [ ] Task 1: 分析 API 服务结构 (AC: #1)
  - [ ] 1.1 分析 api.ts 文件结构（1564 行）
  - [ ] 1.2 识别可测试的函数和模块
  - [ ] 1.3 确定优先级 P0 函数
  - [ ] 1.4 分析依赖关系

- [ ] Task 2: 补充类型守卫测试 (AC: #4)
  - [ ] 2.1 完善 apiTypeGuards.test.ts（已存在，覆盖率 100%）
  - [ ] 2.2 测试 isApiSuccess() 函数
  - [ ] 2.3 测试 isApiError() 函数
  - [ ] 2.4 测试 getApiDataOrThrow() 函数

- [ ] Task 3: User API 测试 (AC: #1)
  - [ ] 3.1 测试 userApi.register()
  - [ ] 3.2 测试 userApi.login()
  - [ ] 3.3 测试 userApi.getUser()
  - [ ] 3.4 测试 userApi.updateUser()
  - [ ] 3.5 测试错误处理（401, 404, 500）

- [ ] Task 4: Recognition API 测试 (AC: #1, #2)
  - [ ] 4.1 测试 recognitionApi.recognizeImage()
  - [ ] 4.2 测试图片上传流程
  - [ ] 4.3 测试识别失败重试
  - [ ] 4.4 测试超时处理

- [ ] Task 5: Generation API 测试 (AC: #1)
  - [ ] 5.1 测试 generationApi.generateQuestions()
  - [ ] 5.2 测试题目生成请求
  - [ ] 5.3 测试批量生成
  - [ ] 5.4 测试生成失败处理

- [ ] Task 6: 错误处理和重试测试 (AC: #2, #3)
  - [ ] 6.1 测试网络错误处理
  - [ ] 6.2 测试请求超时处理
  - [ ] 6.3 测试 4xx 错误（400, 401, 403, 404）
  - [ ] 6.4 测试 5xx 错误（500, 502, 503）
  - [ ] 6.5 测试重试逻辑（指数退避）
  - [ ] 6.6 测试最大重试次数

- [ ] Task 7: 运行测试套件 (AC: #1, #5)
  - [ ] 7.1 运行所有 API 测试
  - [ ] 7.2 验证通过率 ≥ 95%
  - [ ] 7.3 生成覆盖率报告
  - [ ] 7.4 验证 API 覆盖率 ≥ 60%

- [ ] Task 8: 文档更新 (AC: #6)
  - [ ] 8.1 更新 docs/test-coverage-report.md
  - [ ] 8.2 创建 API 测试最佳实践文档
  - [ ] 8.3 创建测试补充报告

## Dev Notes

### 当前测试状态（Story 8.3 完成后）

**API 服务覆盖率**:
- 当前: 6.25%
- 目标: 60%
- 差距: +53.75%

**api.ts 文件分析**:
- 总行数: 1564 行
- 复杂度: 高
- 依赖: fetch API (原生，非 axios)
- Mock 难度: 中高

### API 服务结构

**导出的 API 对象**:
1. `userApi` - 用户相关 API
   - register()
   - login()
   - getUser()
   - updateUser()

2. `recognitionApi` - 图片识别 API
   - recognizeImage()

3. `generationApi` - 题目生成 API
   - generateQuestions()

4. `questionApi` - 题目相关 API
5. `studyApi` - 学习记录 API
6. `exportApi` - 导出功能 API
7. `passwordResetApi` - 密码重置 API
8. `explanationApi` - 讲解生成 API
9. `childApi` - 儿童信息 API

**辅助函数**:
- `isApiSuccess<T>()` - 类型守卫
- `isApiError<T>()` - 类型守卫
- `getApiDataOrThrow<T>()` - 数据提取
- `requestWithRetry()` - 重试逻辑

### Mock 策略

**不使用 axios**:
- api.ts 使用原生 fetch API
- 需要全局 mock fetch
- 或使用 jest-fetch-mock 库

**推荐 Mock 方案**:
```typescript
// 全局 mock fetch
global.fetch = jest.fn();

// 或使用 jest-fetch-mock
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
```

**Mock 示例**:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
});

it('should handle successful login', async () => {
  const mockResponse = {
    success: true,
    data: { id: '1', email: 'test@example.com' },
  };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  const result = await userApi.login({
    email: 'test@example.com',
    password: 'password123',
  });

  expect(result.success).toBe(true);
  expect(result.data.email).toBe('test@example.com');
});
```

### 优先级 P0 函数

**必须测试**:
1. `userApi.register()` - 用户注册（安全关键）
2. `userApi.login()` - 用户登录（安全关键）
3. `requestWithRetry()` - 重试逻辑（可靠性关键）
4. `isApiSuccess()` / `isApiError()` - 类型守卫（已 100% 覆盖）
5. `recognitionApi.recognizeImage()` - 核心功能

**P1 函数**:
1. `generationApi.generateQuestions()`
2. `childApi` 相关函数
3. `explanationApi` 相关函数

**P2 函数**:
1. 其他辅助 API 函数
2. 边缘案例处理

### 错误处理场景

**网络错误**:
```typescript
it('should handle network errors', async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(
    new Error('Network Error')
  );

  await expect(userApi.login({...})).rejects.toThrow('Network Error');
});
```

**超时错误**:
```typescript
it('should handle timeout', async () => {
  jest.useFakeTimers();

  const promise = userApi.login({...});

  jest.advanceTimersByTime(30000);

  await expect(promise).rejects.toThrow('timeout');
});
```

**HTTP 错误**:
```typescript
it('should handle 401 unauthorized', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  });

  const result = await userApi.login({...});
  expect(result.success).toBe(false);
  expect(result.error.code).toBe('UNAUTHORIZED');
});
```

### 重试逻辑测试

**指数退避**:
```typescript
it('should retry with exponential backoff', async () => {
  jest.useFakeTimers();

  // 第一次失败
  (global.fetch as jest.Mock)
    .mockRejectedValueOnce(new Error('Network Error'))
    .mockRejectedValueOnce(new Error('Network Error'))
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });

  const promise = requestWithRetry('/test', {}, 30000, {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
  });

  // 验证重试延迟
  await jest.runOnlyPendingTimersAsync();

  const result = await promise;
  expect(result.success).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(3);
});
```

### 预计工作量

**时间估算**: 2-3 天

**详细分解**:
- 第 1 天: 分析 API 结构 + Mock 基础设施 + P0 函数测试（8 小时）
- 第 2 天: P0 函数完成 + P1 函数测试（8 小时）
- 第 3 天: 错误处理测试 + 文档更新（6 小时）

### 成功经验（Story 8.3）

**有效策略**:
1. **集中火力** - 聚焦关键模块（User API, Recognition API）
2. **Mock 策略** - 全局 mock fetch，避免复杂依赖
3. **测试质量** - AAA 模式 + 清晰命名
4. **分阶段验证** - 逐个函数验证覆盖率

**避免陷阱**:
- ❌ 不要试图测试所有 1564 行代码
- ❌ 不要使用 axios mock（api.ts 不用 axios）
- ❌ 不要 mock 被测试的函数本身
- ❌ 不要忽略错误处理路径

### 关键依赖

**测试工具**:
- Jest (已配置)
- @testing-library/react-native
- jest-fetch-mock (需要安装)

**安装命令**:
```bash
npm install --save-dev jest-fetch-mock @types/jest-fetch-mock
```

### API 测试最佳实践

**1. 独立性**:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});
```

**2. 可读性**:
```typescript
// ✅ 好的命名
it('should return error when API call fails after 3 retries', async () => {});

// ❌ 不好的命名
it('test1', async () => {});
```

**3. 完整性**:
- 测试成功场景
- 测试失败场景
- 测试边界条件
- 测试并发场景（如果适用）

### 风险和缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 文件过大（1564 行） | 高 | 聚焦 P0 函数，分阶段完成 |
| Mock 策略不当 | 中 | 参考 fetch mock 最佳实践 |
| 覆盖率目标过高 | 中 | 调整为 60%，分阶段达成 |
| 测试运行慢 | 低 | 使用 fake timers，避免真实等待 |

### Anti-Patterns to Avoid

- ❌ 不要使用真实 API 调用
- ❌ 不要测试第三方库的实现
- ❌ 不要 mock 被测试的代码本身
- ❌ 不要在测试中使用真实的凭证或密钥
- ❌ 不要跳过失败的测试
- ❌ 不要使用过长的 timeout

### 与其他 Story 的关系

**Story 8.1 (已完成):** 修复失败测试，建立测试基础设施
**Story 8.2 (已完成):** 分析覆盖率，识别测试盲点
**Story 8.3 (已完成):** 补充单元测试（PDF、AI 服务）
**Story 8.6 (进行中):** UI 组件测试补充
**Story 8.7 (当前):** API 服务测试补充
**Story 8.4-8.5 (后续):** 集成测试和 E2E 测试

### 现实目标调整

**原因**:
- api.ts 过于复杂（1564 行）
- 60% 覆盖率更现实（vs 原目标 80%）
- 可以在后续迭代中继续提升

**分阶段目标**:
- 阶段 1: 40% (核心函数 + 错误处理)
- 阶段 2: 50% (更多 API 函数)
- 阶段 3: 60% (全面覆盖)

## Dev Agent Record

### Agent Model Used
{{agent_model_name}}

### Debugging Notes

_待开发时填写_

### Completion Notes List

_待开发时填写_

### File List

**预期修改文件**:
- MathLearningApp/src/services/__tests__/api.test.ts (新建)
- MathLearningApp/src/services/__tests__/apiTypeGuards.test.ts (已存在，可能需要补充)

**预期新增文件**:
- MathLearningApp/src/services/__tests__/userApi.test.ts (新建)
- MathLearningApp/src/services/__tests__/recognitionApi.test.ts (新建)
- MathLearningApp/src/services/__tests__/generationApi.test.ts (新建)
- MathLearningApp/src/services/__tests__/apiRetry.test.ts (新建)

**文档文件**:
- MathLearningApp/docs/api-testing-best-practices.md (新建)
- MathLearningApp/docs/test-coverage-report.md (更新)

## Change Log

- 2026-04-04 19:35: Story 8.7 规范文件创建 - 准备 API 服务测试补充
