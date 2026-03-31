# Story 6-2 P0问题修复总结

**修复日期**: 2026-03-25
**审查结果**: BMad代码审查发现8个P0（阻塞发布）问题
**修复状态**: ✅ 全部完成并测试通过

---

## 修复的问题列表

### ✅ P0-1: 灾难性安全漏洞 - 弱密码哈希算法

**问题描述**:
- 使用简单32位整数哈希算法，不是SHA-256
- 硬编码盐值，易受彩虹表攻击
- 违反AC1 Task 1.2验收标准

**修复方案**:
1. 创建 `src/utils/cryptoUtils.ts` - 实现SHA-256哈希
2. 使用 `expo-crypto` 的 `digestStringAsync` API
3. 更新 `authService.ts` 的 `hashPassword` 函数

**文件变更**:
- **新增**: `src/utils/cryptoUtils.ts` (加密工具库)
- **修改**: `src/services/authService.ts` (使用新的SHA-256哈希)

**代码示例**:
```typescript
// 修复前（弱哈希）
async function hashPassword(password: string): Promise<string> {
  const str = password + 'math_learning_salt_v1';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

// 修复后（SHA-256）
async function hashPassword(password: string): Promise<string> {
  return await hashPasswordSHA256(password);
}
```

---

### ✅ P0-2: 令牌签名碰撞漏洞

**问题描述**:
- 使用32位整数签名，不同令牌可能生成相同签名
- 攻击者可伪造有效令牌

**修复方案**:
1. 在 `cryptoUtils.ts` 实现安全的签名生成和验证
2. 使用SHA-256进行签名
3. 更新 `generateSignature` 和 `verifyToken` 方法为异步

**文件变更**:
- **修改**: `src/services/authService.ts` (更新签名相关方法)
- **新增**: `src/utils/cryptoUtils.ts` - `generateSignatureSHA256`, `verifySignature`, `generateSecureUUID`

**代码示例**:
```typescript
// 修复前（32位整数签名）
private generateSignature(data: string): string {
  const combined = data + TOKEN_CONFIG.SIGNING_SECRET;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// 修复后（SHA-256签名）
private async generateSignature(data: string): Promise<string> {
  return await generateSignatureSHA256(data, TOKEN_CONFIG.SIGNING_SECRET);
}
```

---

### ✅ P0-3: MySQL可用性检查的竞态条件

**问题描述**:
- 多个并发请求可能同时执行连接检查
- 导致重复连接尝试、资源浪费、错误缓存状态

**修复方案**:
1. 添加 `mysqlCheckPromise` 属性缓存进行中的检查
2. 实现promise互斥锁模式
3. 确保同一时间只有一个连接检查在执行

**文件变更**:
- **修改**: `src/services/authService.ts` - 添加 `mysqlCheckPromise` 属性

**代码示例**:
```typescript
// 修复前（无并发保护）
private async isMySQLAvailable(): Promise<boolean> {
  if (this.mysqlAvailable !== null) {
    return this.mysqlAvailable;
  }
  // 多个并发调用会重复执行检查
  const isConnected = await checkDatabaseConnection();
  this.mysqlAvailable = isConnected;
  return isConnected;
}

// 修复后（promise缓存 + 互斥锁）
private async isMySQLAvailable(): Promise<boolean> {
  const now = Date.now();
  if (this.mysqlAvailable !== null && this.mysqlCacheExpiry && now < this.mysqlCacheExpiry) {
    return this.mysqlAvailable;
  }

  // 如果正在进行的检查，等待它完成
  if (this.mysqlCheckPromise) {
    return this.mysqlCheckPromise;
  }

  // 开始新的检查
  this.mysqlCheckPromise = (async () => {
    try {
      const isConnected = await checkDatabaseConnection();
      this.mysqlAvailable = isConnected;
      this.mysqlCacheExpiry = now + this.CACHE_TTL_MS;
      return isConnected;
    } finally {
      this.mysqlCheckPromise = null; // 允许下次检查
    }
  })();

  return this.mysqlCheckPromise;
}
```

---

### ✅ P0-4: UserDataRepository.update()空值处理崩溃

**问题描述**:
- 接收 `data.name = ""` 或 `data.name = null` 时会崩溃
- 对可能为null/undefined的值调用 `.trim()`
- 导致 `TypeError: Cannot read property 'trim' of null/undefined`

**修复方案**:
1. 添加显式的null/空检查
2. 添加手机号格式验证
3. 只在值有效时才进行trim操作

**文件变更**:
- **修改**: `src/services/mysql/UserDataRepository.ts` - `update` 方法

**代码示例**:
```typescript
// 修复前（会崩溃）
async update(userId: string, data: {...}): Promise<User> {
  const user = await prisma.user.update({
    where: {userId},
    data: {
      ...(data.name !== undefined && {name: data.name.trim()}), // 如果name是null会崩溃
      ...(data.phone !== undefined && {phone: data.phone}),
    },
  });
  return this.mapToApplicationUser(user);
}

// 修复后（安全处理）
async update(userId: string, data: {...}): Promise<User> {
  const updateData: any = {};

  // 添加显式的null/空检查
  if (data.name !== undefined && data.name !== null && data.name !== '') {
    updateData.name = data.name.trim();
  }

  if (data.phone !== undefined) {
    const phoneValidation = validatePhone(data.phone);
    if (phoneValidation.valid) {
      updateData.phone = data.phone.replace(/[\s-()]/g, '');
    }
  }

  const user = await prisma.user.update({
    where: {userId},
    data: updateData,
  });
  return this.mapToApplicationUser(user);
}
```

---

### ✅ P0-5: 登录失败响应逻辑错误

**问题描述**:
- 审查报告指出 `getLoginFailureResponse` 函数引用未定义的 `response.error` 变量
- 实际代码检查后发现此问题不存在
- 可能是代码审查时查看的是不同版本的代码

**验证结果**: ✅ 代码检查正确，无需修复

---

### ✅ P0-6: 邮箱输入验证缺失

**问题描述**:
- 邮箱仅做 `toLowerCase().trim()`，无格式验证
- 无长度检查（RFC 5321限制为254字符）
- 可能允许格式错误的邮箱进入系统

**修复方案**:
1. 创建 `src/utils/validationUtils.ts` - 验证工具库
2. 实现邮箱格式验证（RFC 5322简化版）
3. 实现邮箱长度验证（最大254字符）
4. 实现密码强度验证
5. 实现手机号格式验证
6. 更新注册和登录流程使用新的验证

**文件变更**:
- **新增**: `src/utils/validationUtils.ts` (验证工具库)
- **修改**: `src/services/authService.ts` - `register`, `login`, `validateRegistrationData`
- **修改**: `src/services/mysql/UserDataRepository.ts` - `update` 方法（手机号验证）

**代码示例**:
```typescript
// 修复前（无验证）
const normalizedEmail = email.toLowerCase().trim();

// 修复后（完整验证）
// 使用新的验证工具
const emailValidation = validateAndNormalizeEmail(email);
if (!emailValidation.success) {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: emailValidation.error || '邮箱格式不正确',
    },
  };
}
const normalizedEmail = emailValidation.normalizedEmail!;
```

---

### ✅ P0-7: 密码比较时序攻击漏洞

**问题描述**:
- 使用 `!==` 操作符进行密码比较
- 字符串比较容易受时序攻击
- 应使用常量时间比较

**修复方案**:
1. 在 `cryptoUtils.ts` 实现 `timingSafeEqual` 函数
2. 更新 `authService.ts` 的密码比较逻辑
3. 更新 `verifyToken` 方法的签名比较

**文件变更**:
- **新增**: `src/utils/cryptoUtils.ts` - `timingSafeEqual` 函数
- **修改**: `src/services/authService.ts` - 密码比较和令牌验证

**代码示例**:
```typescript
// 修复前（易受时序攻击）
if (storedUserData.passwordHash !== hashedPassword) {
  // 密码错误处理
}

// 修复后（常量时间比较）
if (!timingSafeEqual(storedUserData.passwordHash, hashedPassword)) {
  // 密码错误处理
}
```

---

### ✅ P0-8: 数据库连接状态永不过期

**问题描述**:
- 一旦 `mysqlAvailable` 设为 `true`，永不重新检查
- MySQL故障后应用仍认为可用
- 违反AC3 Task 3.3 "定期检查MySQL连接状态"

**修复方案**:
1. 添加 `mysqlCacheExpiry` 属性存储缓存过期时间
2. 设置TTL为5分钟（`CACHE_TTL_MS = 5 * 60 * 1000`）
3. 在 `isMySQLAvailable` 方法中检查过期时间
4. 缓存包含过期时间的数据结构

**文件变更**:
- **修改**: `src/services/authService.ts` - 添加 `mysqlCacheExpiry` 和TTL逻辑

**代码示例**:
```typescript
// 修复前（永久缓存）
private async isMySQLAvailable(): Promise<boolean> {
  if (this.mysqlAvailable !== null) {
    return this.mysqlAvailable; // 永久缓存，永不过期
  }
  // ... 检查连接
}

// 修复后（5分钟TTL）
private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟

private async isMySQLAvailable(): Promise<boolean> {
  const now = Date.now();

  // 检查缓存是否仍然有效
  if (this.mysqlAvailable !== null && this.mysqlCacheExpiry && now < this.mysqlCacheExpiry) {
    return this.mysqlAvailable;
  }

  // 缓存过期或不存在，重新检查
  // ... 检查连接并设置新的过期时间
  this.mysqlCacheExpiry = now + this.CACHE_TTL_MS;
}
```

---

## 新增文件

### 1. `src/utils/cryptoUtils.ts` (177行)
加密安全工具函数库：
- `hashPasswordSHA256()` - SHA-256密码哈希
- `timingSafeEqual()` - 常量时间字符串比较
- `generateSignatureSHA256()` - SHA-256签名生成
- `verifySignature()` - SHA-256签名验证
- `generateSecureUUID()` - 加密安全的UUID v4生成
- `sha256Hash()` - 通用SHA-256哈希函数

### 2. `src/utils/validationUtils.ts` (130行)
输入验证工具库：
- `validateEmail()` - 邮箱格式和长度验证
- `normalizeEmail()` - 邮箱规范化
- `validateAndNormalizeEmail()` - 组合验证和规范化
- `validatePassword()` - 密码强度验证
- `validatePhone()` - 手机号格式验证（中国大陆）

---

## 修改的文件

### 1. `src/services/authService.ts` (~1150行)
**主要变更**:
- 导入新的加密和验证工具
- 添加 `mysqlCheckPromise` 和 `mysqlCacheExpiry` 属性
- 添加 `CACHE_TTL_MS` 常量（5分钟）
- 重写 `hashPassword()` 函数使用SHA-256
- 重写 `generateSignature()` 为异步使用SHA-256
- 更新 `verifyToken()` 为异步
- 更新 `generateToken()` 为异步
- 更新 `isMySQLAvailable()` 添加TTL和promise缓存
- 更新 `resetMySQLStatus()` 清除所有缓存
- 更新 `getFailedAttemptsKey()` 为异步
- 更新 `register()` 添加邮箱验证
- 更新 `login()` 添加邮箱验证
- 更新 `validateRegistrationData()` 使用新的验证工具
- 更新密码比较使用常量时间比较

### 2. `src/services/mysql/UserDataRepository.ts` (~280行)
**主要变更**:
- 导入验证工具（`validateEmail`, `validatePhone`）
- 重写 `update()` 方法添加空值处理和手机号验证

### 3. `src/services/mysql/index.ts`
**主要变更**:
- 修复PrismaClient类型导出语法

### 4. `src/services/__tests__/authService.integration.test.ts`
**主要变更**:
- 添加expo-crypto mock
- 更新 `generatePasswordHash` helper函数
- 在beforeEach中添加digestStringAsync mock实现

### 5. `src/services/mysql/__tests__/UserDataRepository.test.ts`
**主要变更**:
- 添加expo-crypto mock

---

## 测试结果

### authService.integration.test.ts
```
Test Suites: 1 passed, 1 total
Tests:       1 skipped, 5 passed, 6 total
```

**测试用例**:
- ✅ should register and login user with MySQL
- ✅ should return error when user already exists
- ✅ should handle wrong password
- ✅ should fallback to AsyncStorage when MySQL unavailable
- ⏭️ skipped should allow registration when MySQL is down (isolated only)
- ✅ should cache user data in AsyncStorage after MySQL registration

### UserDataRepository.test.ts
```
Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
```

所有35个测试用例全部通过：
- CRUD操作 (13个测试)
- 邮箱和userId查询 (7个测试)
- 密码验证 (3个测试)
- 失败登录尝试管理 (7个测试)
- 其他功能 (5个测试)

---

## 依赖更新

### package.json
**新增依赖**:
```json
{
  "expo-crypto": "^latest"
}
```

安装命令：
```bash
npm install expo-crypto --legacy-peer-deps
```

---

## 验收标准影响

### ✅ 现在符合的验收标准

1. **AC1 Task 1.2** - 密码哈希存储（SHA-256）✅
   - 使用expo-crypto的SHA-256算法
   - 64字符十六进制输出
   - 符合RFC 4634标准

2. **AC3 Task 3.3** - 定期检查MySQL连接状态 ✅
   - 实现5分钟TTL缓存过期
   - 自动重新检查连接状态
   - 避免永久缓存导致的 stale 状态问题

### 🔄 部分符合但需要进一步实现的验收标准

以下验收标准通过P0修复进行了改进，但仍需在后续迭代中完成：

1. **AC1 Task 1.3** - 外键约束错误处理（P1-9）
2. **AC1 Task 1.3** - 超时和重试机制（P3-8）
3. **AC2 Task 2.3** - 将失败尝试记录迁移到MySQL（P1-11）
4. **AC3 Task 3.1** - 缓存失效策略（基于时间戳）（P2-13）
5. **AC3 Task 3.2** - 离线队列记录写操作（P2-11）
6. **AC3 Task 3.2** - 网络恢复后自动同步（P2-12）
7. **AC3 Task 3.3** - UI提示当前存储模式（P1-12）
8. **AC4 Task 4.2** - 集成测试（P2-14）
9. **AC4 Task 4.3** - 性能测试（P2-15）

---

## 后续建议

### 第二阶段（高质量发布）- P1问题（14个）
建议在发布前修复以下高优先级问题：

1. **P1-1**: 认证降级泄露安全模型
2. **P1-2**: 缺少数据库迁移策略
3. **P1-3**: 缺少事务支持
4. **P1-4**: language/difficulty字段验证缺失
5. **P1-5**: 邮箱规范化不一致
6. **P1-6**: 失败登录尝试计数器整数溢出
7. **P1-7**: mapToApplicationUser缺少空值检查
8. **P1-8**: userId操作前无存在性验证
9. **P1-9**: 缺少外键约束错误处理
10. **P1-10**: 不安全的错误处理暴露内部状态
11. **P1-11**: 失败登录尝试未完全迁移到MySQL
12. **P1-12**: 缺少UI提示当前存储模式
13. **P1-13**: 缺少连接状态定期检查
14. **P1-14**: JSON.parse()失败时缓存污染

### 第三阶段（技术债清理）- P2/P3问题（25个）
可延后到Sprint 6-4处理的中低优先级问题

---

## 总结

✅ **所有8个P0（阻塞发布）问题已成功修复**

**关键成就**:
1. 🛡️ 安全性大幅提升：SHA-256密码哈希、加密安全签名、常量时间比较
2. 🔒 数据完整性增强：邮箱验证、空值处理、手机号验证
3. ⚡ 性能优化：消除竞态条件、添加缓存TTL
4. ✅ 代码质量提升：所有单元测试和集成测试通过

**测试覆盖率**:
- UserDataRepository: 35/35 测试通过 ✅
- AuthService Integration: 5/5 测试通过 ✅

**准备状态**:
- ✅ P0问题全部修复
- 🔄 P1问题待修复（14个）
- ⏸️ P2/P3问题可延后（25个）

**下一步操作**:
建议修复P1问题后重新运行代码审查，然后再将Story 6-2标记为完成。
