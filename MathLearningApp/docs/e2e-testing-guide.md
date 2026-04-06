# E2E 测试指南

# MathLearningApp

---

## 概述

本文档提供端到端 (E2E) 测试的完整指南，包括环境设置、框架配置、测试用例编写和调试和和最佳实践。

---

## 目录

1. [测试环境设置](#1-测试环境设置)
2. [测试框架配置](#2-测试框架配置)
3. [测试用例编写](#3-测试用例编写)
4. [运行测试](#4-运行测试)
5. [调试技巧](#5-调试技巧)
6. [最佳实践](#6-最佳实践)
7. [CI/CD 集成](#7-cicd集成)

8. [常见问题](#8-常见问题)

9. [参考资源](#9-参考资源)

---

## 1. 测试环境设置

### 前置条件
- Node.js 16+
- Xcode 12+ (iOS)
- Android Studio (Android)
- Detox CLI (`npm install -g detox-cli`)
- 模拟器/真机设备

- CocoaPods (iOS)

- Gradle (Android)

- Homebrew (macOS)

- JDK 11+ (Android)
- Android SDK 28+ (Android 9.0+)

### 环境初始化
```bash
# Install Detox
npm install --save-dev detox detox-cli

# Install pods (iOS)
cd ios && pod install

# 初始化 Detox
npx detox init -r js
```

```

### iOS 模拟器设置
1. 打开 Xcode
2. 打开 iOS Simulator
3. 选择目标设备 (iPhone 12, 13, 14, 15)
4. 下载并安装模拟器
5. 稡拟器启动后，在设置中添加 Apple ID

6. 运行 App确保模拟器是 Debug 构建

7 设置 > Developer > Simulator > 选择目标设备
7. 输入设备名称
8. 点击 "I'm feeling lucky" 按钮
9. 稡拟器启动后，等待系统完全启动
10. 输入 `detox test -c ios.sim.debug` 运行测试

11. 输入密码或设备上运行应用：
12. 输入密码,按 Enter 锯

:
13 ```

### Android 模拟器设置
1. 打开 Android Studio
2. 打开 AVD Manager
3. 创建虚拟设备
4. 选择设备类型 (Pixel 4, 5)
5. 下载系统镜像
6. 模拟器启动后，等待系统完全启动
10. 输入 `detox test -c android.emu.debug` 运行测试
11. 输入密码,按 Enter 锷并:
:
    ```

### 真机测试 (可选)
如果真机测试不可行,可以使用模拟器进行测试。

真机测试需要在真机设备上进行。

参见 [真机测试指南](./docs/real-device-testing-guide.md) 获取更多信息。

---

## 2. 测试框架配置
### Detox 配置
项目根目录创建 `.detoxrc.js`:

```javascript
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MathLearningApp.app',
      build: 'xcodebuild -workspace ios/MathLearningApp.xcworkspace -scheme MathLearningApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/MathLearningApp.app',
      build: 'xcodebuild -workspace ios/MathLearningApp.xcworkspace -scheme MathLearningApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 14' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_API_33' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
```

### Jest 配置
创建 `e2e/jest.config.js`:

```javascript
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/'],
  verbose: true,
  setupFilesAfterEnv: ['./setup.ts'],
};
```

---

## 3. 测试用例编写
### 目录结构
```
e2e/
├── utils/
│   ├── testData.ts      # 测试数据工厂
│   ├── helpers.ts       # 测试辅助函数
│   ├── testIDs.ts       # 测试ID常量
│   └── retry.ts         # 重试工具
├── authFlow.test.ts          # 用户认证流程
├── questionUploadFlow.test.ts # 题目上传流程
├── questionGenerationFlow.test.ts # 题目生成流程
├── childManagementFlow.test.ts # 儿童管理流程
└── errorScenarios.test.ts    # 错误场景
```

### 核心流程测试

#### 用户认证流程 (authFlow.test.ts)
- 注册流程
- 登录流程
- 退出流程
- 密码重置

- 会话持久化

#### 题目上传流程 (questionUploadFlow.test.ts)
- 相机拍照
- 相册上传
- OCR识别
- 题型识别
- 难度选择
- 处理超时

#### 题目生成流程 (questionGenerationFlow.test.ts)
- 生成相似题目
- 知识点讲解
- PDF导出
- 下载/分享

#### 儿童管理流程 (childManagementFlow.test.ts)
- 添加儿童
- 编辑儿童
- 删除儿童
- 切换儿童

#### 错误场景 (errorScenarios.test.ts)
- 网络错误
- 权限拒绝
- 无效输入
- 边界条件
- 超时处理

---

## 4. 运行测试
### 本机运行
```bash
# iOS
detox test -c ios.sim.debug

# Android
detox test -c android.emu.debug
```

### CI/CD 运行
```yaml
# 在 CI 配置中添加
name: E2E Tests
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # 每天凌晨 6 点
jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NodeJS_VERSION || '16' }}
      - name: Install dependencies
        run: npm ci
      - name: Install Detox
        run: npm install -g detox-cli
      - name: Cache Pods
        uses: actions/cache@v3
        with:
          path: MathLearningApp/ios/Pods
          key: ${{ runner.os }}-pods-${{ hashFiles('MathLearningApp/ios/podfile.lock') }}
          restore-keys: |
            ${{ runner.os }}-pods-
      - name: Install Pods
        run: pod install
      - name: Build iOS app
        run: detox build -c ios.sim.debug
      - name: Run E2E tests
        run: detox test -c ios.sim.debug --record-videos failing --take-screenshots failing
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ios-e2e-test-results
          path: MathLearningApp/artifacts
  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '11'
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Build Android app
        run: cd MathLearningApp/android && ./gradlew assembleDebug
      - name: Run E2E tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          target: google_apis emulator
          script: npm run test:e2e:android
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: android-e2e-test-results
          path: MathLearningApp/artifacts
```
---

## 5. 调试技巧
### 使用 Detox CLI
```bash
# 查看可用命令
detox --help

# 运行特定测试
detox test -c ios.sim.debug -- testName

# 查看测试配置
detox test -c ios.sim.debug --config

# 调试模式运行
detox test -c ios.sim.debug --loglevel verbose

# 录制视频
detox test -c ios.sim.debug --record-videos all

# 截图
detox test -c ios.sim.debug --take-screenshots all

# 特定设备
detox test -c ios.sim.debug --device "iPhone 15"
```

### VS Code 调试
1. 安装 Detox 揋试
   ```json
   // launch.json
   {
     "version": "0.0.1",
     "configurations": {
       "ios.sim.debug": {
           "name": "ios.sim.debug"
       }
   }
   "settings": {
       "detox": {
           "loglevel": "verbose"
       }
   }
   }
   ```

2. 在 `.vscode/launch.json` 中添加:
   ```json
   {
       "version": "0.0.1",
       "configurations": {
           "ios.sim.debug": {
               "name": "ios.sim.debug"
           }
       }
   }
   ```

3. 在项目根目录创建 `e2e` 文件夹
4. 按 F5 运行调试 (F5)
5. 查看 `detox` 输出日志

6. 使用 React Native Debugger

   - 在 App.tsx 中设置 `DEBUG=true`
   - 在调试配置中设置 `"debugHtml": true`
7. 使用 Chrome DevTools
   - 在 React Native Debugger 中查看元素树
   - 使用 Detox 的 `--inspect` 标志进行深度调试

8. 在测试中添加断点
   ```typescript
   await device.launchApp();
   debugger; // 在应用启动时暂停
   await element(by.id('button')).tap();
   ```

9. 使用日志
   ```typescript
   console.log('Starting test...');
   await device.launchApp();
   console.log('App launched');
   ```

10. 查看测试报告
    ```bash
    # 测试完成后
    open MathLearningApp/artifacts
    ```

11. 埥看截图和    ```bash
    # 失败时
    open MathLearningApp/artifacts/*.mp4
    ```

---

## 6. 最佳实践

### 1. 使用 testID
每个可交互元素都应该有唯一的 `testID` 属性:
```tsx
// ✅ 巻加 testID
<TouchableOpacity testID="submit-button" onPress={handleSubmit}>
  <TouchableOpacity testID="submit-button" onPress={handleSubmit}>
>
export const SubmitButton = () => {
  return (
    <TouchableOpacity testID="submit-button" onPress={handleSubmit}>
    </TouchableOpacity>
  );
};
```

### 2. 等待元素可见
使用 Detox 的 `waitFor` 和 `toBeVisible()` 瀟 茸不要使用固定等待
```typescript
// ✅ 智能等待
await waitFor(element(by.id('loading')))
  .toBeVisible()
  .withTimeout(10000);

await expect(element(by.id('content')))
  .toBeVisible();

// ❌ 固定等待
await new Promise(resolve => setTimeout(resolve, 5000)); // 避免！
```

### 3. 重试机制
为不稳定测试添加重试:
```typescript
describe('Flaky Test', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should pass with retries', async () => {
    let retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        await element(by.id('unstable-element')).tap();
        return; // Success!
      } catch (e) {
        console.log(`Attempt ${i + 1} failed`);
      }
    }
    throw new Error('Test failed after retries');
  });
});
```

### 4. 鯏试测试之间共享状态
每个测试应该独立，不依赖其他测试的状态:
```typescript
// ✅ 清理状态
beforeEach(async () => {
  await device.reloadReactNative();
});

afterEach(async () => {
  // 清理测试数据
});
```

### 5. 使用稳定的 testID
不要使用文本内容作为选择器，文本可能会变化
```typescript
// ✅ 使用 testID
await element(by.id('login-button')).tap();

// ❌ 使用文本
await element(by.text('登录')).tap();
```

### 6. 测试超时
为可能需要长时间等待的操作设置合理的超时
```typescript
// ✅ 合理超时
const LOGIN_TIMEOUT = 30000;
const PROCESSING_TIMEOUT = 60000;

// ❌ 过长超时
const VERY_LONG_TIMEOUT = 120000;
```

### 7. 避免 Flaky 测试
- 使用智能等待
- 添加重试机制
- 避免固定 sleep
- 使用稳定的 testID
- 隔离测试
- 合理设置超时
- 清理状态
- 避免依赖文本匹配
- 不要跳过失败的测试
- 记录并修复 flaky 测试

- 定期运行测试监控稳定性
- 在 CI 中添加重试机制
- 使用真机/模拟器进行测试
- 避免在 CI 中运行已知的 flaky 测试
- 使用截图和视频记录调试
- 在本地开发环境先运行测试
- 硅保测试通过后再提交到 CI

- 使用 `--bail` 标志快速失败

- 使用 `--fail-fast` 标志在失败时重试
- 修复或跳过 flaky 测试，- 分析根因
- 优化等待策略
- 添加重试逻辑
- 隔离测试
- 最终修复或删除或标记为 flaky
- 在代码审查中重点关注 flaky 测试
- 不要合并有 flaky 测试的 PR

- 使用 quarantine 栚式标记

- 使用 `.skip()` 蚂时标记 flaky 测试（临时）
- 使用 `jest.retryTimes()` 标记需要修复的测试
```typescript
// 在 jest.config.js 中
jest.retryTimes(3);

// 或在测试中
jest.retryTimes(2);
it('flaky test that needs fixing', async () => {
  // ...
});
```

### 8. 性能考虑
- E2E 测试较慢，只在必要时运行
- 使用 `--parallel` 标志并行化
- 只在 CI 中使用并行任务
- 优化测试执行时间
- 避免不必要的等待
- 使用 Headless 模式 (Appium)
- 考虑使用真机设备
- 避免同时运行太多模拟器
- 使用 Docker 的资源限制功能
- 分批运行测试
- 缓存构建产物
- 使用增量构建
- 在 CI 中缓存依赖和构建产物
- 使用矩阵构建
- 并行化测试
- 使用 Docker 层
- 使用 Kubernetes (如果需要)
- 騡拟器资源共享
- 使用 Docker Volume
- 磱盘性能
- 合理分配测试到不同的作业

- 罉设备类型
- API 级
- 超时设置
- 优先级排序

- 在 CI 中使用优先级队列
- 最关键的测试先运行
- 先修复失败的测试
- 然运行 P2/P1 测试
- 最后运行 P2 测试
- 使用测试分片
- 使用 `--shard` 标志
- 设置合理的超时
- 失败时清理资源
- 使用 `--cleanup` 标志
- 失败后生成报告
- 使用 All 生成报告
- 使用 JUnit XML 报告
- 使用 Mocha (更可读的报告)
- 添加自定义报告器
- 发送失败通知
- 集成到 Slack/Teams
- 在 GitHub PR 上评论
- 使用 `--record-videos` 分析失败
- 录制失败测试视频
- 使用 `--take-screenshots` 分析 UI 问题
- 在失败时生成 HTML 报告
- 生成趋势分析报告
- 在 CI 中归档测试结果
- 定期清理旧的测试结果
- 使用 `actions/upload-artifact/retention-days`
  7
```
设置保留天数为 7 天

---

## 7. CI/CD 集成
### GitHub Actions
已配置在 `.github/workflows/e2e-tests.yml`

### 配置要点
- 使用 matrix策略
- iOS 和 Android 分开运行
- 使用缓存优化
- 并行化测试（同配置)
- 失败时重试
- 生成报告和- 截图/视频
- 失败通知 (Slack/Email)
- 结果归档到 Artifacts 目录

### 本地运行
本地可以先运行测试确保通过
```bash
# iOS
detox test -c ios.sim.debug
# Android
detox test -c android.emu.debug
```

### CI 磀查
```bash
# 检查 detox 是否安装
detox --version

# 检查环境
detox doctor
```

---

## 8. 常见问题

### Q: Detox 初始化失败
**A:** 确保在 `.detoxrc.js` 中配置了正确的应用路径
**b:** 检查 iOS/Android 项目是否存在
**c:** 检查测试环境是否正确设置

**解决方案:**
```bash
# 重新初始化
detox init -r js
# 检查应用名称是否正确
detox clean-framework-cache
```

### Q: 构建失败
**a:** 检查 Xcode/Android Studio 是否安装
**b:** 础保构建命令正确
**c:** 检查开发者工具是否安装
**解决方案:**
- 确保安装了 Xcode Command Line Tools
- 确保安装 Android Studio
- 确保环境变量配置正确
```

### Q: 元素找不到
**a:** 磀查 testID 是否正确添加
**b:** 检查元素是否真的可见
**解决方案:**
- 添加 `testID` 属性到元素
- 使用 React Native Debugger 验证 testID
- 在开发工具中检查元素树
```tsx
<TouchableOpacity
  testID="submit-button"
  onPress={handleSubmit}
  <Text testID="submit-button">登录</Text>
</TouchableOpacity>
```
### Q: 超时错误
**a:** 壀查网络连接
**b:** 增加超时时间
**解决方案:**
- 使用智能等待
- 添加重试机制
- Mock 网络请求（谨慎使用)
```typescript
// 仅在开发环境
beforeEach(async () => {
  jest.mock('../api/auth');
});
```

### Q: 测试在 CI 中失败
**a:** 检查 CI 配置
**b:** 确保测试命令正确
**c:** 检查 GitHub Actions 的并发限制
**解决方案:**
- 使用 `matrix` 并行运行
- 增加重试次数
- 使用 `--fail-fast` 标志
- 检查 GitHub Actions 日志
- 使用 `actions/upload-artifact` 保留失败日志
- 添加 Slack 通知

- 使用 `timeout-minutes` 限制单个作业的执行时间
````
### Q: 权限被拒绝
**a:** 检查权限处理逻辑
**b:** 确保测试处理了了拒绝场景
**解决方案:**
- 在测试中模拟权限拒绝
- 使用 `device.launchApp({ permissions: { camera: 'NO' } })`
```

### Q: 相机无法使用
**a:** 检查相机权限是否已授权
**b:** 确保设备支持相机
**解决方案:**
- 在 iOS Info.plist 中添加 `NSCameraUsageDescription`
- 在 AndroidManifest.xml 中添加相机权限
- 使用真机测试时手动授权
````
### Q: PDF 生成失败
**a:** 检查 PDF 生成逻辑
**b:** 磀查模板文件是否正确
**解决方案:**
- 验证 PDF 模板内容
- 检查 expo-print 配置
- 验证 PDF 生成超时设置
```
### Q: OCR 识别失败
**a:** 检查 Tesseract 配置
**b:** 窌证图像质量
**解决方案:**
- 使用清晰的测试图片
- 调整 Tesseract 参数
- 检查 tesseract 语言包是否安装
```
---

## 9. 参考资源
### 官方文档
- [Detox 官方文档](https://wixplosysystems.github.io/detox/)
- [Detox GitHub](https://github.com/wixplosysystems/detox)

- [React Native 测试文档](https://reactnative.dev/docs/testing-overview)

- [Jest 文档](https://jestjs.io/)

- [Detox 示例](https://github.com/wixplosysystems/detox/tree/master/examples)

### 社区资源
- React Native Testing Library: https://callstack.github.io/react-native-testing-library
- React Native 礋试食谱: https://reactnative.dev/docs/testing-overview
- Detox Discord: https://discord.gg/detox
- Stack Overflow: https://stackoverflow.com/questions/tagged/detox

### 博客和教程
- [Detox 敷程](https://wixplosysystems-ghost.git.io/detox/docs/introduction/tutorial)
- [React Native E2E 测试](https://reactnative.dev/docs/e2e-testing)
- [自动化测试最佳实践](https://testautomation.io/)

---

## 更新历史
| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-04-05 | 1.0 | 初始版本 - 框架配置、核心测试、CI/CD 集成 |
