# Bug Report: passwordResetService 导入路径错误

## 🐛 Bug 信息

**发现日期：** 2026-03-26
**发现者：** Quinn (QA Engineer)
**优先级：** 🔴 High
**状态：** Open
**影响范围：** 密码重置功能

## 📋 问题描述

`passwordResetService.ts` 中的 `resetPassword()` 方法无法正常完成密码更新，因为动态导入路径错误。

### 受影响的代码

**文件：** `src/services/passwordResetService.ts`
**行号：** 291
**错误代码：**
```typescript
const { loadUserByEmail, hashPassword } = await import('./../services/authService');
```

**问题：** 导入路径 `'./../services/authService'` 是错误的。从 `src/services/` 目录导入同目录的 `authService.ts` 应该使用 `'./authService'`。

### 错误的导入路径

| 当前路径（错误） | 正确路径 |
|---|---|
| `'./../services/authService'` | `'./authService'` |

## 💥 影响分析

### 功能影响
- **核心功能：** 用户无法通过安全问题验证重置密码
- **用户体验：** 密码重置流程在最后一步失败
- **安全影响：** 用户无法重置忘记的密码

### 测试覆盖
- **测试文件：** `src/services/__tests__/passwordResetService.test.ts`
- **跳过的测试：** 2个
  - `应该接受有效的令牌并更新密码`
  - `应该标记令牌为已使用`
- **通过率：** 36/38 (94.7%)

## 🔍 复现步骤

1. 用户设置安全问题
2. 用户验证安全问题答案
3. 用户收到重置令牌
4. 用户尝试使用令牌重置密码
5. ❌ 密码更新失败，返回 `RESET_FAILED` 错误

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "RESET_FAILED",
    "message": "密码重置失败，请重新申请"
  }
}
```

## 🛠️ 修复方案

### 代码修复

**文件：** `src/services/passwordResetService.ts`
**行号：** 291

**修改前：**
```typescript
const { loadUserByEmail, hashPassword } = await import('./../services/authService');
```

**修改后：**
```typescript
const { loadUserByEmail, hashPassword } = await import('./authService');
```

### 验证步骤

1. 应用修复
2. 运行测试：`npm test -- passwordResetService.test.ts`
3. 确认所有38个测试通过（包括之前跳过的2个）
4. 手动测试密码重置流程

## 📊 相关文件

### 受影响文件
- `src/services/passwordResetService.ts` (源代码，需要修复)
- `src/services/__tests__/passwordResetService.test.ts` (测试，已更新)

### 相关文件
- `src/services/authService.ts` (目标导入文件)
- Story 1-3: 家长用户重置密码

## 📝 备注

### 测试状态
- 测试已重写以匹配新的安全问题验证流程（而非邮件链接）
- 36/38 测试正常通过
- 2个测试因源代码bug而跳过
- 测试文件中已添加详细的bug注释和跳过原因

### 实现状态
源代码中的密码重置实现似乎不完整：
- 第287-293行包含TODO注释
- 缺少实际的密码更新逻辑
- `authService` 可能没有导出所需的私有方法

### 建议的完整修复
除了修复导入路径外，还需要：
1. 实现 `authService.updatePassword()` 方法
2. 或者重构为直接调用数据库更新
3. 确保密码更新后用户状态正确更新

## 🔗 相关链接

- 测试文件：`src/services/__tests__/passwordResetService.test.ts`
- 源代码：`src/services/passwordResetService.ts:291`
- Story: Story 1-3

---

**报告人：** Quinn (QA Engineer)
**审查状态：** 待 Dev 团队审查
