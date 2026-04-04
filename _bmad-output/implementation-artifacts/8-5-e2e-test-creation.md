# Story 8.5: E2E 测试创建

Status: ready-for-dev

## Story

As a **开发人员**,
I want **创建端到端（E2E）测试，覆盖完整用户流程，确保用户体验的完整性**,
so that **关键用户场景得到充分测试，产品质量得到保障**.

## Acceptance Criteria

1. **AC1: 核心用户流程覆盖** - 5 个核心用户流程的 E2E 测试覆盖
2. **AC2: E2E 测试框架** - Detox 或 Appium 框架配置完成
3. **AC3: 测试环境** - 测试环境配置完成（模拟器/真机）
4. **AC4: CI/CD 集成** - E2E 测试集成到 CI/CD 流水线
5. **AC5: 测试稳定性** - E2E 测试通过率 ≥ 90%（允许少量 flaky 测试）
6. **AC6: 测试文档** - E2E 测试指南和最佳实践文档

## Tasks / Subtasks

- [ ] Task 1: E2E 测试框架选择和配置 (AC: #2)
  - [ ] 1.1 评估 Detox vs Appium
  - [ ] 1.2 安装和配置 E2E 框架
  - [ ] 1.3 配置测试环境（iOS 模拟器/Android 模拟器）
  - [ ] 1.4 创建 E2E 测试脚手手架

- [ ] Task 2: 核心流程 E2E 测试 (AC: #1)
  - [ ] 2.1 用户注册和登录流程 E2E 测试
  - [ ] 2.2 题目上传和识别流程 E2E 测试
  - [ ] 2.3 题目生成和导出流程 E2E 测试
  - [ ] 2.4 知识点讲解流程 E2E 测试
  - [ ] 2.5 儿童管理流程 E2E 测试

- [ ] Task 3: 错误场景测试 (AC: #1)
  - [ ] 3.1 网络错误场景 E2E 测试
  - [ ] 3.2 权限拒绝场景 E2E 测试
  - [ ] 3.3 无效输入场景 E2E 测试
  - [ ] 3.4 边界条件场景 E2E 测试

- [ ] Task 4: 测试稳定性优化 (AC: #5)
  - [ ] 4.1 实现智能等待策略
  - [ ] 4.2 添加重试机制
  - [ ] 4.3 优化测试超时配置
  - [ ] 4.4 减少 flaky 测试

- [ ] Task 5: CI/CD 集成 (AC: #4)
  - [ ] 5.1 配置 CI/CD E2E 测试任务
  - [ ] 5.2 设置测试并行化
  - [ ] 5.3 配置测试报告生成
  - [ ] 5.4 设置失败通知

- [ ] Task 6: 测试文档 (AC: #6)
  - [ ] 6.1 编写 E2E 测试指南
  - [ ] 6.2 编写测试维护指南
  - [ ] 6.3 创建测试场景文档
  - [ ] 6.4 更新测试最佳实践文档

## Dev Notes

### 核心用户流程（E2E 测试重点）

**流程 1: 完整的新用户旅程**
```
打开 App → 注册账号 → 登录 → 创建儿童 → 上传题目 → 查看讲解 → 完成
```
**关键步骤**:
1. 启动应用
2. 导航到注册页面
3. 填写注册表单
4. 提交并验证
5. 登录
6. 创建儿童档案
7. 拍照上传题目
8. 等待识别和生成
9. 查看生成的题目和讲解
10. 导出 PDF

**流程 2: 回归用户日常使用**
```
打开 App → 登录 → 拍照上传 → 查看历史 → 生成新题 → 导出 PDF
```

**流程 3: 知识点学习流程**
```
打开 App → 登录 → 拍照 → 查看知识点讲解 → 切换格式 → 保存
```

**流程 4: 儿童管理流程**
```
打开 App → 登录 → 管理儿童 → 添加新儿童 → 编辑信息 → 删除儿童
```

**流程 5: 设置和个人资料**
```
打开 App → 登录 → 设置 → 修改个人资料 → 修改密码 → 退出登录
```

### E2E 测试框架对比

| 特征 | Detox | Appium |
|------|-------|--------|
| **React Native 支持** | ✅ 优秀 | ⚠️ 需要配置 |
| **速度** | ✅ 快速 | ⚠️ 较慢 |
| **稳定性** | ✅ 高 | ⚠️ 中等 |
| **跨平台** | ✅ iOS/Android | ✅ 多平台 |
| **学习曲线** | ⚠️ 中等 | ⚠️ 较陡 |
| **社区支持** | ✅ 活跃 | ✅ 成熟 |
| **调试工具** | ✅ 良好 | ✅ 丰富 |

**推荐**: Detox (React Native 专用，性能更好)

### Detox 配置示例

**安装**:
```bash
npm install --save-dev detox detox-cli
```

**配置 (package.json)**:
```json
{
  "detox": {
    "configurations": {
      "ios.sim.debug": {
        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/MathLearningApp.app",
        "build": "xcodebuild -project ios/MathLearningApp.xcodeproj -scheme MathLearningApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
        "type": "ios.simulator",
        "device": {
          "type": "iPhone 14"
        }
      },
      "android.emu.debug": {
        "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
        "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug",
        "type": "android.emulator",
        "device": {
          "avdName": "Pixel_API_28"
        }
      }
    }
  }
}
```

**测试示例 (Detox)**:
```typescript
// e2e/userRegistration.test.ts
describe('User Registration Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete user registration', async () => {
    // 1. 等待启动画面
    await expect(element(by.id('welcome-screen'))).toBeVisible();

    // 2. 点击注册按钮
    await element(by.id('register-button')).tap();

    // 3. 填写注册表单
    await element(by.id('name-input')).typeText('Test User');
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');

    // 4. 提交注册
    await element(by.id('submit-button')).tap();

    // 5. 等待成功
    await expect(element(by.id('registration-success'))).toBeVisible();

    // 6. 验证自动登录
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should handle duplicate email error', async () => {
    // 重复注册流程
    await element(by.id('register-button')).tap();
    await element(by.id('email-input')).typeText('existing@example.com');
    // ... 填写其他字段
    await element(by.id('submit-button')).tap();

    // 验证错误提示
    await expect(element(by.text('该邮箱已被注册'))).toBeVisible();
  });
});
```

### 测试环境配置

**iOS 模拟器要求**:
- Xcode 12+
- iOS 14.0+ 模拟器
- iPhone 12/13/14 系列设备

**Android 模拟器要求**:
- Android Studio
- API Level 28+ (Android 9.0+)
- 模拟器硬件加速 (HAXM/KVM)

**测试数据准备**:
```typescript
// e2e/utils/testData.ts
export const testUser = {
  email: 'e2e-test@example.com',
  password: 'testPassword123',
  name: 'E2E Test User',
};

export const testChild = {
  name: 'Test Child',
  grade: '一年级',
  birthDate: '2018-01-01',
};
```

### 智能等待策略

**等待策略对比**:
| 策略 | 用途 | 示例 |
|------|------|------|
| `toBeVisible()` | 等待元素可见 | `await expect(element(by.id('button'))).toBeVisible()` |
| `toExist()` | 等待元素存在 | `await expect(element(by.id('container'))).toExist()` |
| `toHaveText()` | 等待文本出现 | `await expect(element(by.id('label'))).toHaveText('成功')` |
| **自定义等待** | 复杂场景 | `await waitFor(element(by.id('dynamic-content'))).toBeVisible().withTimeout(5000)` |

**最佳实践**:
```typescript
// ✅ 好的等待策略
await waitFor(element(by.id('loading-indicator'))).toBeNotVisible().withTimeout(10000);
await expect(element(by.id('content'))).toBeVisible();

// ❌ 不好的等待策略（固定等待时间）
await new Promise(resolve => setTimeout(resolve, 5000)); // 避免！
```

### CI/CD 集成

**GitHub Actions 示例**:
```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm ci

      - name: Build iOS app
        run: npm run build:ios

      - name: Run E2E tests
        run: npm run test:e2e:ios

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: e2e-test-results
          path: artifacts/

  e2e-android:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Java
        uses: actions/setup-java@v2
        with:
          java-version: '11'

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm ci

      - name: Build Android app
        run: npm run build:android

      - name: Run E2E tests
        run: npm run test:e2e:android
```

### 预计工作量

**时间估算**: 3-4 天

**详细分解**:
- 第 1 天: E2E 框架配置 + 环境设置（8 小时）
- 第 2 天: 核心流程 E2E 测试（8 小时）
- 第 3 天: 错误场景 + 稳定性优化（8 小时）
- 第 4 天: CI/CD 集成 + 文档（6 小时）

### 优先级 P0 测试

**必须覆盖**:
1. **新用户注册流程** - 核心功能
2. **用户登录流程** - 核心功能
3. **题目上传和识别流程** - 核心功能
4. **题目生成和导出流程** - 核心功能
5. **儿童管理流程** - 重要功能

**P1 测试**:
1. 知识点学习流程
2. 历史记录查看
3. 设置和个人资料

**P2 测试**:
1. 错误处理场景
2. 边界条件
3. 性能测试

### 测试稳定性最佳实践

**减少 Flaky 测试**:
1. **智能等待** - 使用 Detox 的自动等待，避免固定 sleep
2. **重试机制** - 失败时自动重试 2-3 次
3. **元素唯一性** - 使用稳定的 testID 而非文本
4. **隔离测试** - 每个测试独立，不依赖其他测试
5. **清理状态** - 每个测试前后清理应用状态

**调试工具**:
```bash
# 录制失败测试的视频
detox test --record-videos all

# 生成截图
detox test --take-screenshots all

# 详细日志
detox test --loglevel verbose
```

### 关键依赖

**需要安装**:
- Detox CLI (`npm install -g detox-cli`)
- Detox (`npm install --save-dev detox`)
- Xcode (iOS 开发)
- Android Studio (Android 开发)

**配置文件**:
- `.detoxrc.js` 或 `package.json` 中的 detox 配置
- `e2e/` 目录结构
- `e2e/utils/` 测试工具

### 成功标准

**Story 8.5 完成标志**:
1. ✅ 5 个核心流程的 E2E 测试覆盖
2. ✅ Detox 框架配置完成
3. ✅ 测试环境（iOS/Android）配置完成
4. ✅ E2E 测试通过率 ≥ 90%
5. ✅ CI/CD E2E 测试集成完成
6. ✅ E2E 测试指南文档完成

### 风险和缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 环境配置复杂 | 高 | 提供详细的安装指南 |
| 测试运行慢 | 中 | 使用并行测试和智能等待 |
| Flaky 测试 | 高 | 实现重试机制和智能等待 |
| 模拟器问题 | 中 | 提供多个设备配置选项 |
| CI/CD 集成困难 | 中 | 参考成熟的 GitHub Actions 配置 |

### Anti-Patterns to Avoid

- ❌ 不要使用固定 sleep 等待
- ❌ 不要依赖文本匹配（使用 testID）
- ❌ 不要在测试之间共享状态
- ❌ 不要跳过 flaky 测试（修复它们）
- ❌ 不要使用生产数据
- ❌ 不要在 CI 中运行慢速测试（优化或并行化）

### 与其他 Story 的关系

**Story 8.1-8.3 (已完成):** 单元测试
**Story 8.4 (进行中):** 集成测试
**Story 8.5 (当前):** E2E 测试
**Story 8.6-8.7 (进行中):** 补充测试

**测试金字塔**:
```
        E2E Tests (Story 8.5)
       /                  \
      /  Integration Tests \
     /    (Story 8.4)      \
    /                      \
   /   Unit Tests (8.3)    \
  /                        \
```

## Dev Agent Record

### Agent Model Used
{{agent_model_name}}

### Debugging Notes

_待开发时填写_

### Completion Notes List

_待开发时填写_

### File List

**预期新增文件**:
- MathLearningApp/e2e/userRegistration.test.ts
- MathLearningApp/e2e/userLogin.test.ts
- MathLearningApp/e2e/questionUpload.test.ts
- MathLearningApp/e2e/questionGeneration.test.ts
- MathLearningApp/e2e/childManagement.test.ts

**配置文件**:
- MathLearningApp/.detoxrc.js (新建)
- MathLearningApp/e2e/utils/testData.ts (新建)
- MathLearningApp/e2e/utils/helpers.ts (新建)

**CI/CD 文件**:
- .github/workflows/e2e-tests.yml (新建)

**文档文件**:
- MathLearningApp/docs/e2e-testing-guide.md (新建)
- MathLearningApp/docs/e2e-test-scenarios.md (新建)

## Change Log

- 2026-04-04 21:15: Story 8.5 规范文件创建 - 准备 E2E 测试创建
