# Story 8-4: 集成测试规划文档

**创建日期**: 2026-04-05
**状态**: In-Progress
**开发者**: Claude (Dev Agent)

---

## 📋 关键用户流程识别

基于项目服务文件分析，识别以下关键用户流程：

### **P0 - 核心流程（必须测试）**

#### **1. 用户认证流程** 🔐
**文件**: `authService.ts`, `userApi.ts`, `passwordResetService.ts`

**流程**:
```
注册 → 登录 → 获取用户信息 → 更新用户信息 → 退出登录
```

**关键测试点**:
- ✅ 注册流程（邮箱唯一性验证）
- ✅ 登录流程（密码验证、Token生成）
- ✅ Token刷新机制
- ✅ 密码重置流程
- ✅ 会话管理

**依赖**:
- 数据库: MySQL (用户表)
- API: `/api/auth/*`

---

#### **2. 题目生成流程** 📝
**文件**: `questionGenerationService.ts`, `ai/localQuestionGenerator.ts`, `ai/baiduOcrService.ts`

**流程**:
```
上传照片 → OCR识别 → AI生成题目 → 保存历史 → 导出PDF
```

**关键测试点**:
- ✅ OCR服务集成
- ✅ AI服务集成
- ✅ 题目生成逻辑
- ✅ 历史记录保存
- ✅ PDF导出

**依赖**:
- 外部API: 百度OCR API
- 外部API: DeepSeek AI API
- 数据库: MySQL (题目历史表)
- 服务: `pdfService.ts`

---

#### **3. 数据库同步流程** 🔄
**文件**: `services/sync/*`, `services/mysql/*`

**流程**:
```
本地操作 → 离线队列 → 网络恢复 → 同步到MySQL → 冲突解决
```

**关键测试点**:
- ✅ 离线操作队列化
- ✅ 网络恢复自动同步
- ✅ 冲突检测和解决
- ✅ 数据一致性验证

**依赖**:
- 本地存储: AsyncStorage
- 远程数据库: MySQL
- 同步服务: `services/sync/*`

---

### **P1 - 重要流程（推荐测试）**

#### **4. 儿童管理流程** 👶
**文件**: `childApi.ts`, `activeChildService.ts`

**流程**:
```
创建儿童 → 设置年级 → 更新信息 → 查看学习记录 → 删除儿童
```

**关键测试点**:
- 儿童信息CRUD操作
- 活跃儿童切换
- 学习记录关联

---

#### **5. 知识点讲解流程** 📚
**文件**: `explanationService.ts`, `knowledgePointService.ts`, `ai/deepseekService.ts`

**流程**:
```
选择知识点 → AI生成讲解 → 格式化展示 → 保存历史 → 切换格式
```

**关键测试点**:
- 知识点识别
- AI讲解生成
- 多格式支持（文本、图文、互动）
- 讲解历史管理

---

#### **6. 帮助内容流程** 💡
**文件**: `helpContentService.ts`, `feedbackManager.ts`

**流程**:
```
用户操作 → 触发帮助 → 显示提示 → 用户反馈 → 记录反馈
```

**关键测试点**:
- 上下文感知帮助
- 用户反馈收集
- 反馈分析

---

### **P2 - 次要流程（可选测试）**

#### **7. 学习记录流程** 📊
**文件**: `generationHistoryService.ts`

**测试点**:
- 历史记录查询
- 统计分析
- 数据导出

---

## 🎯 测试策略

### **集成测试分类**

#### **API集成测试** (AC1)
**目标**: 关键API调用流程的端到端覆盖

**测试文件**:
1. `userAuth.integration.test.ts` - 用户认证流程
2. `questionGeneration.integration.test.ts` - 题目生成流程
3. `childManagement.integration.test.ts` - 儿童管理流程
4. `knowledgeExplanation.integration.test.ts` - 知识点讲解流程

**Mock策略**:
- ❌ 不mock内部服务
- ✅ Mock外部API（百度OCR, DeepSeek AI）
- ✅ 使用测试数据库

---

#### **数据库集成测试** (AC2)
**目标**: 数据库操作的集成验证

**测试文件**:
1. `mysql.integration.test.ts` - MySQL连接和操作
2. `dataPersistence.integration.test.ts` - 数据持久化
3. `sync.integration.test.ts` - 数据同步

**Mock策略**:
- ❌ 不mock数据库
- ✅ 使用测试数据库（SQLite内存或MySQL测试实例）
- ✅ 测试后清理数据

---

#### **服务间集成测试** (AC3)
**目标**: 多个服务协作的集成验证

**测试文件**:
1. `ocr-ai-collaboration.integration.test.ts` - OCR + AI服务
2. `ai-pdf-collaboration.integration.test.ts` - AI + PDF服务
3. `user-child-collaboration.integration.test.ts` - 用户 + 儿童服务
4. `offline-sync-collaboration.integration.test.ts` - 离线 + 同步服务

**Mock策略**:
- ❌ 不mock内部服务
- ✅ Mock外部API
- ✅ 使用真实文件系统（临时目录）

---

#### **错误处理流程测试** (AC4)
**目标**: 完整错误处理路径验证

**测试文件**:
1. `networkErrors.integration.test.ts` - 网络错误
2. `apiTimeout.integration.test.ts` - API超时
3. `databaseErrors.integration.test.ts` - 数据库错误
4. `thirdPartyErrors.integration.test.ts` - 第三方服务错误

**测试场景**:
- 网络断开
- API响应超时
- 数据库连接失败
- 外部API错误返回
- 数据验证失败
- 权限错误

---

## 📂 测试文件结构

```
MathLearningApp/src/__tests__/integration/
├── api/
│   ├── userAuth.integration.test.ts
│   ├── questionGeneration.integration.test.ts
│   ├── childManagement.integration.test.ts
│   └── knowledgeExplanation.integration.test.ts
├── database/
│   ├── mysql.integration.test.ts
│   ├── dataPersistence.integration.test.ts
│   └── sync.integration.test.ts
├── services/
│   ├── ocr-ai-collaboration.integration.test.ts
│   ├── ai-pdf-collaboration.integration.test.ts
│   └── user-child-collaboration.integration.test.ts
├── errors/
│   ├── networkErrors.integration.test.ts
│   ├── apiTimeout.integration.test.ts
│   └── databaseErrors.integration.test.ts
└── setup/
    ├── testDatabase.ts
    ├── testData.ts
    └── testCleanup.ts
```

---

## 🛠️ 测试环境配置

### **环境变量** (.env.test)

```bash
# 测试数据库
DATABASE_URL=mysql://test:test@localhost:3306/math_learning_test
# 或者使用SQLite内存数据库
# DATABASE_URL=sqlite::memory:

# API配置
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=5000

# 外部服务（Mock）
BAIDU_OCR_API_URL=http://mock-ocr:8080
DEEPSEEK_API_URL=http://mock-ai:8080

# 测试配置
NODE_ENV=test
TEST_TIMEOUT=30000
ENABLE_LOGGING=false
```

### **Jest配置** (jest.integration.config.js)

```javascript
module.exports = {
  preset: 'react-native',
  testMatch: ['**/__tests__/integration/**/*.integration.test.{ts,tsx}'],
  testTimeout: 30000,
  setupFiles: ['<rootDir>/jest.integration.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.after.js'],

  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],

  // 测试环境
  testEnvironment: 'node',

  // 全局变量
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
```

### **测试数据准备**

```typescript
// setup/testData.ts
export const testUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'Test123!@#',
};

export const testChild = {
  id: 'test-child-1',
  userId: 'test-user-1',
  name: 'Test Child',
  grade: 'GRADE_3',
  birthday: new Date('2016-05-15'),
};

export const testQuestion = {
  id: 'test-question-1',
  childId: 'test-child-1',
  type: 'ADDITION',
  difficulty: 'EASY',
  content: '3 + 5 = ?',
  answer: '8',
};
```

---

## 📊 预估工作量

| 任务 | 预估时间 | 优先级 |
|------|---------|--------|
| Task 1: 关键流程识别 | 2小时 | P0 |
| Task 2: API集成测试 | 6小时 | P0 |
| Task 3: 数据库集成测试 | 4小时 | P0 |
| Task 4: 服务间集成测试 | 4小时 | P1 |
| Task 5: 错误处理测试 | 3小时 | P1 |
| Task 6: CI/CD集成 | 2小时 | P1 |
| Task 7: 测试文档 | 2小时 | P2 |
| **总计** | **23小时 (3天)** | - |

---

## ✅ 成功标准

### **AC达成标准**

1. **AC1: API集成测试**
   - ✅ 4个核心API流程全部测试覆盖
   - ✅ 测试通过率≥95%
   - ✅ 覆盖正常流程和错误流程

2. **AC2: 数据库集成测试**
   - ✅ MySQL连接测试通过
   - ✅ 数据CRUD操作测试通过
   - ✅ 数据同步测试通过

3. **AC3: 服务间集成测试**
   - ✅ 4个服务协作场景测试覆盖
   - ✅ 服务间通信正常
   - ✅ 错误传播正确

4. **AC4: 错误处理流程**
   - ✅ 4类错误场景测试覆盖
   - ✅ 错误恢复机制验证
   - ✅ 用户友好错误提示

5. **AC5: 测试通过率**
   - ✅ 集成测试通过率≥95%
   - ✅ 无阻塞问题
   - ✅ 测试稳定可重复

6. **AC6: CI/CD验证**
   - ✅ CI/CD配置完成
   - ✅ 测试环境自动化
   - ✅ 测试报告生成

---

## 🚀 实施计划

### **Day 1: 核心集成测试** (8小时)

**上午 (4小时)**:
1. ✅ 配置测试环境
2. ✅ 实现用户认证流程集成测试
3. ✅ 实现题目生成流程集成测试

**下午 (4小时)**:
4. ✅ 实现数据库集成测试
5. ✅ 实现数据同步集成测试
6. ✅ 运行测试并修复问题

---

### **Day 2: 服务集成和错误处理** (8小时)

**上午 (4小时)**:
1. ✅ 实现OCR+AI服务协作测试
2. ✅ 实现AI+PDF服务协作测试
3. ✅ 实现用户+儿童服务协作测试

**下午 (4小时)**:
4. ✅ 实现网络错误处理测试
5. ✅ 实现API超时处理测试
6. ✅ 实现数据库错误处理测试

---

### **Day 3: CI/CD和文档** (6小时)

**上午 (3小时)**:
1. ✅ 配置CI/CD流水线
2. ✅ 设置测试数据库自动化
3. ✅ 验证CI/CD集成测试

**下午 (3小时)**:
4. ✅ 编写集成测试指南
5. ✅ 更新测试覆盖率报告
6. ✅ 创建测试数据准备脚本
7. ✅ 完成Story验收

---

## 📝 开发笔记

### **技术决策**

1. **数据库选择**: 优先使用SQLite内存数据库（快速、隔离），可选MySQL测试实例（真实环境）
2. **外部API**: 使用Mock Server模拟百度OCR和DeepSeek API
3. **测试隔离**: 每个测试文件独立，测试之间不共享状态
4. **数据清理**: 使用事务回滚或测试后自动清理

### **风险缓解**

1. **风险**: 外部API不稳定
   **缓解**: 使用Mock Server，不依赖真实API

2. **风险**: 测试运行慢
   **缓解**: 使用内存数据库，并行运行测试

3. **风险**: 测试数据清理困难
   **缓解**: 每个测试使用事务，测试后回滚

---

## 🎯 下一步行动

1. ✅ 开始Task 12: 识别关键用户流程 (已完成规划)
2. 🔄 开始Task 13: 实现API集成测试
3. ⏳ 准备测试环境配置

---

**文档创建**: 2026-04-05 16:15
**最后更新**: 2026-04-05 16:15
**负责人**: Claude (Dev Agent)
