# Story 6-2 代码审查 - 问题分类报告

**生成时间**: 2026-03-25
**审查对象**: 用户数据MySQL存储实现
**审查方法**: BMad三层对抗式审查

---

## 执行摘要

**审查结果**: ❌ **不通过** - 需要修复关键问题后重新审查

**问题统计**:
- 阻塞发布 (P0): 8个
- 高优先级 (P1): 14个
- 中优先级 (P2): 15个
- 低优先级 (P3): 10个
- **总计**: 47个问题

**验收标准通过率**: 8/23 (35%) ❌

---

## P0 - 阻塞发布问题（必须修复）

### P0-1: 灾难性安全漏洞 - 弱密码哈希算法
**来源**: Blind Hunter #1, Edge Case Hunter #3, Acceptance Auditor #1
**严重性**: CRITICAL
**位置**: `authService.ts:30-43` (hashPassword函数)

**问题描述**:
- 使用简单的32位整数哈希算法，不是SHA-256
- 硬编码盐值且公开：`'math_learning_salt_v1'`
- 无迭代次数，无加密构造
- 仅产生32字符十六进制输出（最多128位）
- 易受彩虹表攻击、碰撞攻击和暴力破解

**违反**: AC1 Task 1.2 - "密码哈希存储（SHA-256）"

**建议修复**:
```typescript
import {Platform} from 'react-native';
import * as Crypto from 'expo-crypto';

async function hashPassword(password: string): Promise<string> {
  // 使用Web Crypto API的SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'math_learning_salt_v1');
  const hashBuffer = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hashBuffer;
}
```

---

### P0-2: 令牌签名碰撞漏洞
**来源**: Edge Case Hunter #4
**严重性**: CRITICAL
**位置**: `authService.ts:842-853` (generateSignature)

**问题描述**:
- 使用32位整数算术生成签名
- 不同令牌可能生成相同签名
- 攻击者可能伪造有效令牌

**建议修复**:
使用HMAC-SHA256进行加密签名

---

### P0-3: MySQL可用性检查的竞态条件
**来源**: Edge Case Hunter #1, Blind Hunter #4
**严重性**: CRITICAL
**位置**: `authService.ts:140-161` (isMySQLAvailable方法)

**问题描述**:
- 多个并发请求可能同时执行连接检查
- 最后写入胜出，但连接状态可能不一致
- 导致重复连接尝试、资源浪费、错误的缓存状态

**建议修复**:
实现互斥锁模式或使用promise缓存

---

### P0-4: UserDataRepository.update()中的空值处理错误
**来源**: Edge Case Hunter #2
**严重性**: CRITICAL
**位置**: `UserDataRepository.ts:98-118`

**问题描述**:
- 接收 `data.name = ""` 或 `data.name = null` 时会崩溃
- 第110行对可能为null/undefined的值调用`.trim()`
- 导致 `TypeError: Cannot read property 'trim' of null/undefined`

**建议修复**:
添加显式的null/空检查

---

### P0-5: 登录失败响应中的逻辑错误
**来源**: Blind Hunter #9
**严重性**: HIGH（运行时错误）
**位置**: `authService.ts:470-497` (getLoginFailureResponse)

**问题描述**:
- 第487行引用未定义的 `response.error` 变量
- 函数作用域中没有 `response` 定义
- 将导致运行时错误

**建议修复**:
使用 `errorMessage` 参数替代

---

### P0-6: 邮箱输入验证缺失
**来源**: Blind Hunter #3, Edge Case Hunter #15
**严重性**: HIGH
**位置**: `authService.ts:299, 429`

**问题描述**:
- 邮箱仅做 `toLowerCase().trim()`，无格式验证
- 无长度检查（RFC 5321限制为254字符）
- 可能允许格式错误的邮箱进入系统
- 极长邮箱字符串可能导致DoS

**建议修复**:
添加邮箱格式和长度验证

---

### P0-7: 密码比较时序攻击漏洞
**来源**: Blind Hunter #5
**严重性**: HIGH
**位置**: `authService.ts:443`

**问题描述**:
- 使用 `!==` 操作符进行密码比较
- 字符串比较容易受时序攻击
- 应使用常量时间比较

**建议修复**:
使用crypto.subtle.timingSafeEqual()或类似实现

---

### P0-8: 数据库连接状态永不过期
**来源**: Edge Case Hunter #11, Acceptance Auditor #12
**严重性**: HIGH
**位置**: `authService.ts:142-160` (isMySQLAvailable)

**问题描述**:
- 一旦 `mysqlAvailable` 设为 `true`，永不重新检查
- MySQL故障后应用仍认为可用
- 违反AC3 Task 3.3 "定期检查MySQL连接状态"

**建议修复**:
实现缓存TTL（如5分钟）

---

## P1 - 高优先级问题（强烈建议修复）

### P1-1: 认证降级泄露安全模型
**来源**: Blind Hunter #6
**严重性**: HIGH
**位置**: `authService.ts:605-624`

**问题描述**:
- MySQL故障时静默降级到AsyncStorage
- 用户无感知数据存储在本地而非MySQL
- 违反显式同意原则
- 设备丢失=数据丢失且无警告

### P1-2: 缺少数据库迁移策略
**来源**: Blind Hunter #7, Acceptance Auditor #6, #7
**严重性**: HIGH
**位置**: `authService.ts:591-624, 656-671, 687-723`

**问题描述**:
- 注册可在MySQL或AsyncStorage创建用户
- 无从AsyncStorage迁移到MySQL的机制
- 用户可能永久"卡"在AsyncStorage
- 违反AC3 Task 3.2

### P1-3: 缺少事务支持
**来源**: Acceptance Auditor #2
**严重性**: HIGH
**位置**: `UserDataRepository.ts`

**问题描述**:
- 虽然prismaClient.ts导出transaction包装器
- 但UserDataRepository不使用事务
- 违反AC1 Task 1.1 "添加事务支持"

### P1-4: language/difficulty字段验证缺失
**来源**: Edge Case Hunter #5
**严重性**: HIGH
**位置**: `UserDataRepository.ts:98-118`, `authService.ts:697-767`

**问题描述**:
- 无效语言（`"xyz"`）或难度（`"impossible"`）无验证
- 直接写入数据库
- 破坏期望有效值的下游逻辑

### P1-5: 邮箱规范化不一致
**来源**: Edge Case Hunter #6
**严重性**: HIGH
**位置**: `authService.ts:211` (cache key), `UserDataRepository.ts:52`

**问题描述**:
- AuthService规范化邮箱
- 但cache key使用原始邮箱（第178行）
- 导致缓存缺失、重复用户条目

### P1-6: 失败登录尝试计数器整数溢出
**来源**: Edge Case Hunter #7
**严重性**: HIGH
**位置**: `UserDataRepository.ts:163-173`

**问题描述**:
- 攻击者执行2^31次失败登录
- Prisma自动递增无上界检查
- 整数溢出导致负值，绕过锁定

### P1-7: mapToApplicationUser缺少空值检查
**来源**: Edge Case Hunter #8
**严重性**: HIGH
**位置**: `UserDataRepository.ts:259-269`

**问题描述**:
- 第263行直接使用 `prismaUser.email` 无空检查
- 如数据库约束被绕过或数据损坏
- 返回null而非字符串

### P1-8: userId操作前无存在性验证
**来源**: Edge Case Hunter #9
**严重性**: HIGH
**位置**: `UserDataRepository.ts:98-130`

**问题描述**:
- update(), delete(), validatePassword()等
- 使用不存在的userId
- Prisma抛出P2025错误但无优雅处理

### P1-9: 缺少外键约束错误处理
**来源**: Acceptance Auditor #3
**严重性**: HIGH
**位置**: `UserDataRepository.ts`

**问题描述**:
- 无Prisma外键约束错误（P2003）处理
- 错误处理仅覆盖P2002和P2025
- 违反AC1 Task 1.3

### P1-10: 不安全的错误处理暴露内部状态
**来源**: Blind Hunter #8
**严重性**: HIGH
**位置**: 多处console.warn/log

**问题描述**:
- 生产构建中日志可能暴露：
  - 数据库连接状态
  - 用户邮箱
  - 存储后端决策
  - 错误详情

### P1-11: 失败登录尝试未完全迁移到MySQL
**来源**: Acceptance Auditor #5
**严重性**: HIGH
**位置**: `authService.ts:924-1003`

**问题描述**:
- 混合方法：AsyncStorage和MySQL同时追踪
- 规范要求迁移到MySQL，AsyncStorage仅作离线降级
- 违反AC2 Task 2.3

### P1-12: 缺少UI提示当前存储模式
**来源**: Acceptance Auditor #9
**严重性**: HIGH

**问题描述**:
- 代码内部追踪MySQL可用性
- 无机制通知UI当前存储模式
- 违反AC3 Task 3.3

### P1-13: 缺少连接状态定期检查
**来源**: Acceptance Auditor #12
**严重性**: HIGH

**问题描述**:
- 无定期健康检查实现
- isMySQLAvailable仅检查一次并永久缓存
- 违反AC3 Task 3.3

### P1-14: JSON.parse()失败时缓存污染
**来源**: Edge Case Hunter #10
**严重性**: MEDIUM-HIGH
**位置**: `authService.ts:198, 575, 939`

**问题描述**:
- AsyncStorage包含损坏/格式错误的JSON
- JSON.parse()抛出异常但仅记录
- 无缓存清理
- 导致重复失败、缓存污染

---

## P2 - 中优先级问题（建议修复）

### P2-1: updateProfile中未使用的缓存密码哈希
**来源**: Blind Hunter #10
**严重性**: MEDIUM
**位置**: `authService.ts:711-714`

### P2-2: MySQL操作中的不一致错误处理
**来源**: Blind Hunter #11
**严重性**: MEDIUM
**位置**: 多处

### P2-3: 缺少事务边界
**来源**: Blind Hunter #12
**严重性**: MEDIUM
**位置**: `authService.ts:591-624, 656-671`

### P2-4: authListeners潜在内存泄漏
**来源**: Blind Hunter #13, Edge Case Hunter #14
**严重性**: MEDIUM
**位置**: `authService.ts:106, 720`

### P2-5: 缺少MySQL可用性状态更改的原子操作
**来源**: Edge Case Hunter #12
**严重性**: MEDIUM
**位置**: `authService.ts:166-169`

### P2-6: 令牌过期未验证Date.now()边界情况
**来源**: Edge Case Hunter #13
**严重性**: MEDIUM
**位置**: `authService.ts:880-883`

### P2-7: 无邮箱长度验证
**来源**: Edge Case Hunter #15
**严重性**: MEDIUM
**位置**: 多处调用toLowerCase()

### P2-8: 缺少失败尝试时间窗口边界验证
**来源**: Edge Case Hunter #16
**严重性**: MEDIUM
**位置**: `authService.ts:963-971`

### P2-9: name字段无清理
**来源**: Edge Case Hunter #17
**严重性**: MEDIUM
**位置**: `UserDataRepository.ts:37, 110`

### P2-10: AsyncStorage中的日期序列化问题
**来源**: Edge Case Hunter #18
**严重性**: MEDIUM
**位置**: `authService.ts:183, 737`

### P2-11: 缺少离线队列记录写操作
**来源**: Acceptance Auditor #6
**严重性**: MEDIUM

### P2-12: 缺少网络恢复后自动同步
**来源**: Acceptance Auditor #7
**严重性**: MEDIUM

### P2-13: 缺少缓存失效策略
**来源**: Acceptance Auditor #8
**严重性**: MEDIUM

### P2-14: 集成测试覆盖不足
**来源**: Acceptance Auditor #10
**严重性**: MEDIUM

### P2-15: 性能测试不完整
**来源**: Acceptance Auditor #11
**严重性**: MEDIUM

---

## P3 - 低优先级问题（可延后修复）

### P3-1: 类型安全不一致
**来源**: Blind Hunter #14
**严重性**: LOW
**位置**: `authService.ts:481, 483`

### P3-2: 哈希函数中的魔法数字
**来源**: Blind Hunter #15
**严重性**: LOW
**位置**: `authService.ts:31`

### P3-3: 注释表明生产中使用不安全代码
**来源**: Blind Hunter #16
**严重性**: LOW
**位置**: `authService.ts:26`

### P3-4: 登录成功路径中的冗余用户查找
**来源**: Blind Hunter #17
**严重性**: LOW
**位置**: `authService.ts:664-669`

### P3-5: 缺少记住我令牌过期的验证
**来源**: Blind Hunter #18
**严重性**: LOW
**位置**: `authService.ts:681`

### P3-6: 缺少电话号码格式验证
**来源**: Edge Case Hunter #19
**严重性**: LOW
**位置**: `UserDataRepository.ts:38, 111`

### P3-7: 并发登出和登录竞态条件
**来源**: Edge Case Hunter #20
**严重性**: LOW
**位置**: `authService.ts:585-599, 774-792`

### P3-8: 缺少超时和重试机制实现
**来源**: Acceptance Auditor #4
**严重性**: LOW

### P3-9: UUID生成使用Math.random()
**来源**: Blind Hunter #2
**严重性**: LOW
**位置**: `authService.ts:43-49`

### P3-10: SQL注入风险（数据不一致）
**来源**: Blind Hunter #2
**严重性**: LOW

---

## 验收标准合规性分析

### ✅ 通过的验收标准

1. **AC1 Task 1.4** - Prisma 7.0配置（prisma.config.ts）
2. **AC2 Task 2.1** - 双ID模式（id + userId）
3. **AC2 Task 2.2** - 通过邮箱查找用户
4. **AC2 Task 2.4** - 密码哈希字段存在
5. **AC3 Task 3.1** - 写穿透缓存策略
6. **AC3 Task 3.2** - 读旁路缓存策略
7. **AC3 Task 3.3** - 智能降级机制
8. **AC4 Task 4.1** - 单元测试存在

### ❌ 未通过的验收标准

1. **AC1 Task 1.1** - 添加事务支持（P1-3）
2. **AC1 Task 1.2** - 密码哈希存储（SHA-256）（P0-1）
3. **AC1 Task 1.3** - 外键约束错误处理（P1-9）
4. **AC1 Task 1.3** - 超时和重试机制（P3-8）
5. **AC2 Task 2.3** - 将失败尝试记录迁移到MySQL（P1-11）
6. **AC3 Task 3.1** - 缓存失效策略（基于时间戳）（P2-13）
7. **AC3 Task 3.2** - 离线队列记录写操作（P2-11）
8. **AC3 Task 3.2** - 网络恢复后自动同步（P2-12）
9. **AC3 Task 3.3** - UI提示当前存储模式（P1-12）
10. **AC3 Task 3.3** - 定期检查MySQL连接状态（P1-13）
11. **AC4 Task 4.2** - 集成测试（P2-14）
12. **AC4 Task 4.3** - 性能测试（P2-15）

**通过率**: 8/20 (40%)

---

## 修复优先级建议

### 第一阶段（阻塞发布）- 必须立即修复
1. P0-1: 实现SHA-256密码哈希
2. P0-2: 修复令牌签名算法
3. P0-3: 修复MySQL可用性检查竞态条件
4. P0-4: 修复update()空值处理
5. P0-5: 修复登录失败响应逻辑错误
6. P0-6: 添加邮箱验证
7. P0-7: 实现常量时间密码比较
8. P0-8: 实现连接状态TTL

### 第二阶段（高质量发布）- 强烈建议修复
1. P1-1到P1-14：所有高优先级问题

### 第三阶段（技术债清理）- 可延后到Sprint 6-4
1. P2-1到P2-15：中优先级问题
2. P3-1到P3-10：低优先级问题

---

## 审查结论

**❌ Story 6-2审查不通过**

**原因**:
1. 存在8个阻塞发布问题（P0）
2. 验收标准通过率仅40%
3. 存在严重安全漏洞（弱密码哈希、令牌签名碰撞）
4. 存在运行时错误风险（登录失败响应逻辑错误）

**建议**:
1. 修复所有P0问题
2. 修复至少P1-1到P1-8高优先级问题
3. 重新运行审查工作流
4. 更新单元和集成测试以覆盖修复场景

---

## 审查团队

- **Blind Hunter**: 发现18个问题
- **Edge Case Hunter**: 发现20个边界情况
- **Acceptance Auditor**: 识别12个验收标准违规

**审查方法**: BMad对抗式三层并行审查
