# Story 6-3 代码审查分类报告

**审查日期**: 2026-03-26
**审查类型**: BMad三层并行审查 (Blind Hunter + Edge Case Hunter + Acceptance Auditor)

---

## 📊 审查统计

| 指标 | 数值 |
|------|------|
| **总发现数** | 41 |
| **重复合并后** | 35 |
| **拒绝** | 4 |
| **有效发现** | 31 |

---

## 🔴 P0 - 阻塞发布 (必须修复)

### P0-1: 缓存竞态条件导致数据损坏
- **来源**: blind + edge
- **位置**: `childApi.ts:200-234` (updateCacheChild, removeCacheChild)
- **问题**: 缓存读-修改-写操作无原子性，并发请求可能导致数据丢失
- **证据**:
  ```typescript
  async function updateCacheChild(childId: string, updates: Partial<Child>): Promise<void> {
    const children = await readCache();  // 读
    // ... 修改 ...
    await writeCache(children);  // 写
  }
  ```
- **影响**: 多个并发API调用可能破坏缓存一致性
- **修复**: 实现乐观并发控制或缓存锁

### P0-2: JSON.parse()无类型验证
- **来源**: blind + edge
- **位置**: `childApi.ts:186-192, 272-282` (多处)
- **问题**: 解析JSON后直接断言为Child类型，无运行时验证
- **证据**:
  ```typescript
  const children: Child[] = JSON.parse(data);
  children.forEach(child => {
    if (child.birthday) child.birthday = new Date(child.birthday);
  });
  ```
- **影响**: 格化错误数据可能导致运行时崩溃
- **修复**: 添加schema验证（zod/yup）或字段存在性检查

### P0-3: MySQL降级时用户无感知
- **来源**: blind
- **位置**: `childApi.ts:264-282, 397-426` (所有CRUD操作)
- **问题**: MySQL不可用时静默降级到AsyncStorage，用户不知数据未持久化
- **证据**:
  ```typescript
  if (!isConnected) {
    console.warn('[childApi] Database not connected, using AsyncStorage fallback');
    // ... 继续操作 ...
    return { success: true, data: children };  // 无警告指示器
  }
  ```
- **影响**: 用户以为数据已保存到云端，实际只在本地
- **修复**: 添加warning/storageMode字段到响应

### P0-4: activeChildService未集成MySQL
- **来源**: auditor (CRITICAL)
- **位置**: `activeChildService.ts` (整个文件)
- **问题**: 活跃孩子服务仍使用AsyncStorage，与MySQL数据可能不一致
- **影响**: 违反AC2.3规范要求
- **修复**: 更新activeChildService从MySQL读取孩子数据

---

## 🟠 P1 - 高优先级 (应尽快修复)

### P1-1: 弱UUID生成算法
- **来源**: blind
- **位置**: `childApi.ts:302-303, 410, 441`
- **问题**: 使用`Math.random()`生成ID，不加密安全
- **证据**:
  ```typescript
  id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  ```
- **修复**: 使用`uuid`库或React Native的`getRandomValues()`

### P1-2: 代码重复 - 日期转换逻辑
- **来源**: blind
- **位置**: 多处 (8+次重复)
- **问题**: 相同的日期转换逻辑重复出现
- **修复**: 提取为工具函数`convertChildDates()`

### P1-3: 缓存惊群漏洞
- **来源**: blind + edge
- **位置**: `childApi.ts:213-217` (getChildren)
- **问题**: 缓存过期时多个并发请求同时击中MySQL
- **修复**: 实现缓存锁或stale-while-revalidate模式

### P1-4: 缓存TTL边界竞态
- **来源**: edge
- **位置**: `childApi.ts:153-160` (readCache)
- **问题**: TOCTOU (check-to-use) 竞态条件
- **修复**: 使用版本号而非TTL

### P1-5: MySQL断开连接中途事务
- **来源**: edge
- **位置**: `ChildDataRepository.ts:361-374` (createMany)
- **问题**: 批量插入时断开连接，部分数据可能残留
- **修复**: 添加显式事务错误处理

### P1-6: 并发注册导致重复用户
- **来源**: edge
- **位置**: `authService.ts` (其他文件)
- **问题**: 检查和创建之间的时间窗口允许重复
- **修复**: 处理P2002错误并返回友好提示

### P1-7: 令牌生成碰撞
- **来源**: edge
- **位置**: `passwordResetService.ts:337-339`
- **问题**: 使用时间戳+随机数可能碰撞
- **修复**: 使用crypto安全UUID

### P1-8: 大批量操作无限制
- **来源**: edge
- **位置**: `ChildDataRepository.ts:340`
- **问题**: `createMany`无批量大小限制
- **修复**: 添加批量上限（如100个）

### P1-9: 缓存无界增长
- **来源**: edge
- **位置**: `childApi.ts:119-134` (writeCache)
- **问题**: AsyncStorage有6MB配额
- **修复**: 添加缓存大小限制

### P1-10: 密码重置令牌状态错误标记时机
- **来源**: edge
- **位置**: `passwordResetService.ts:296`
- **问题**: 令牌在密码更新前标记为已使用
- **修复**: 在成功更新后再标记

---

## 🟡 P2 - 中优先级 (技术债务)

### P2-1: Magic Numbers - 年龄验证
- **来源**: blind
- **位置**: `childApi.ts:31-32`
- **问题**: 年龄阈值(5, 12)硬编码
- **修复**: 提取为命名常量

### P2-2: 闰年日期计算不精确
- **来源**: blind
- **位置**: `childApi.ts:31`
- **问题**: `365.25`近似值对闰年生日可能偏差1天
- **修复**: 使用`date-fns`库精确计算

### P2-3: Console.log语句在生产线
- **来源**: blind
- **位置**: 整个`childApi.ts`文件
- **问题**: 生产代码包含调试日志
- **修复**: 替换为结构化日志服务

### P2-4: 输入未转义
- **来源**: blind
- **位置**: `childApi.ts:304`
- **问题**: 只trim空白，不处理XSS
- **修复**: 如渲染web view需添加转义

### P2-5: 批量创建空数组返回不一致
- **来源**: edge
- **位置**: `ChildDataRepository.ts:345-346`
- **问题**: 空数组返回而其他方法可能抛错
- **修复**: 统一错误处理策略

### P2-6: 字符串长度验证边界问题
- **来源**: edge
- **位置**: `childApi.ts:22-34`
- **问题**: trim前验证，trim后可能超限
- **修复**: 先trim再验证长度

### P2-7: Unicode字符未处理
- **来源**: edge
- **位置**: `childApi.ts:22-34`, `authService.ts:1167-1170`
- **问题**: 名字和邮箱不支持Unicode
- **修复**: 添加Unicode规范化

### P2-8: 事务回滚静默失败
- **来源**: edge
- **位置**: `ChildDataRepository.ts:361-374`
- **问题**: 无法检测回滚是否成功
- **修复**: 添加事务失败日志

### P2-9: Event Listener内存泄漏
- **来源**: edge
- **位置**: `authService.ts:778-790`
- **问题**: 依赖调用者清理，无自动清理
- **修复**: 实现自动清理或WeakMap

### P2-10: 失败尝试计数器溢出
- **来源**: edge
- **位置**: `UserDataRepository.ts:194-221`
- **问题**: 成功登录后未重置计数器
- **修复**: 成功后重置计数器

### P2-11: 大量令牌存储累积
- **来源**: edge
- **位置**: `passwordResetService.ts:205-209`
- **问题**: 过期令牌不自动清理
- **修复**: 应用启动时定期清理

### P2-12: Prisma客户端未初始化检查
- **来源**: edge
- **位置**: 所有使用`prisma`的文件
- **问题**: 无健康检查
- **修复**: 操作前检查连接状态

### P2-13: AsyncStorage配额超时无区分
- **来源**: edge
- **位置**: 多个catch块
- **问题**: 无法区分QuotaExceededError
- **修复**: 检查特定错误类型

### P2-14: MySQL-AsyncStorage缓存漂移
- **来源**: edge
- **位置**: 整个缓存系统
- **问题**: 5分钟TTL窗口数据可能不一致
- **修复**: 实现推送通知或WebSocket失效

---

## 🟢 P3 - 低优先级 (改进建议)

### P3-1: 非null断言(!)不安全
- **来源**: blind
- **位置**: `childApi.ts:247, 257, 267, 423, 433, 443`
- **问题**: 验证error字段时使用`!`
- **修复**: 显式null检查

### P3-2: SQL注入风险 - 错误消息暴露值
- **来源**: edge
- **位置**: `gradeMapping.ts:45`
- **问题**: 错误消息包含原始输入
- **修复**: 不在错误中包含用户输入

### P3-3: 外键关系完整性检查不完整
- **来源**: auditor (MINOR)
- **位置**: `ChildDataRepository.ts`
- **问题**: 无显式的完整性检查方法
- **修复**: 添加`checkReferentialIntegrity()`方法

---

## ❌ 已拒绝 (噪音/误报/已处理)

### R1: 生日验证null检查
- **来源**: edge
- **位置**: `childApi.ts:58-59`
- **原因**: 生日是可选字段，返回true正确
- **状态**: 拒绝

### R2: refresh()递归风险
- **来源**: blind
- **位置**: `childApi.ts:761-773`
- **原因**: `getChildren()`不会触发refresh()，无递归
- **状态**: 拒绝

### R3: User Data Repository映射null处理
- **来源**: edge
- **位置**: `UserDataRepository.ts:313`
- **原因**: 这是Prisma生成的模型，email有not null约束
- **状态**: 拒绝 (defer - 其他文件)

### R4: Password Reset令牌状态
- **来源**: edge
- **位置**: `passwordResetService.ts`
- **原因**: 不在Story 6-3范围内
- **状态**: 拒绝 (defer - 其他功能)

---

## 🔵 Bad Spec (规范问题)

### BS-1: AC2.3 activeChildService集成要求不明确
- **来源**: auditor
- **问题**: 规范要求"集成activeChildService"但未明确是否需要迁移到MySQL
- **建议**: 更新规范明确activeChildService应该使用MySQL还是继续使用AsyncStorage

### BS-2: AC3/AC4 测试要求过于宽泛
- **来源**: auditor
- **问题**: "集成测试"和"UI集成测试"未明确具体覆盖哪些场景
- **建议**: 添加具体测试场景清单

---

## 📝 意图缺口 (需要澄清)

### IG-1: 缓存一致性策略
- **来源**: auditor
- **问题**: 未明确多设备场景下缓存失效策略
- **建议**: 添加WebSocket/push通知或明确接受5分钟延迟

---

## 修复优先级建议

| 优先级 | 数量 | 建议处理时间 |
|--------|------|-------------|
| **P0** | 4 | 立即修复 |
| **P1** | 10 | 本Sprint内修复 |
| **P2** | 14 | 下Sprint技术债务 |
| **P3** | 3 | 有时间修复 |

---

**审查完成时间**: 2026-03-26
**下次审查**: 修复P0/P1后重新审查
