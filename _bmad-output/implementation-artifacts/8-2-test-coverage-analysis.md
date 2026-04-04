# Story 8.2: 测试覆盖率分析与报告

Status: review

## Story

As a **开发人员**,
I want **生成完整的测试覆盖率报告并分析未覆盖的代码区域**,
so that **能够识别测试盲点，为后续测试补充工作提供数据支持**.

## Acceptance Criteria

1. **AC1: 覆盖率报告生成** - 生成完整的测试覆盖率报告（语句、分支、函数、行覆盖率）
2. **AC2: 覆盖率目标设定** - 为各模块设定明确的覆盖率目标（80% 基准）
3. **AC3: 未覆盖区域识别** - 识别并列出所有覆盖率低于 50% 的模块
4. **AC4: 关键功能覆盖分析** - 分析核心业务逻辑的测试覆盖情况
5. **AC5: 文档输出** - 创建详细的覆盖率分析报告文档
6. **AC6: CI集成准备** - 准备覆盖率报告在 CI/CD 中自动生成的配置

## Tasks / Subtasks

- [x] Task 1: 配置 Jest 覆盖率报告 (AC: #1)
  - [x] 1.1 验证 jest.config.js 中的覆盖率配置
  - [x] 1.2 配置覆盖率报告格式（text, lcov, html）
  - [x] 1.3 设置覆盖率阈值和警告
  - [x] 1.4 运行首次覆盖率测试

- [x] Task 2: 生成完整覆盖率报告 (AC: #1, #2)
  - [x] 2.1 运行完整测试套件生成覆盖率数据
  - [x] 2.2 生成 HTML 可视化报告
  - [x] 2.3 生成 lcov 格式报告（供 CI 使用）
  - [x] 2.4 提取总体覆盖率统计

- [x] Task 3: 模块覆盖率分析 (AC: #3)
  - [x] 3.1 按目录/模块统计覆盖率
  - [x] 3.2 识别覆盖率 < 50% 的模块
  - [x] 3.3 识别覆盖率 50-70% 的模块
  - [x] 3.4 识别覆盖率 70-80% 的模块
  - [x] 3.5 生成模块覆盖率排名表

- [x] Task 4: 关键功能覆盖分析 (AC: #4)
  - [x] 4.1 分析 AI 服务模块覆盖率
  - [x] 4.2 分析 OCR 服务模块覆盖率
  - [x] 4.3 分析 PDF 服务模块覆盖率
  - [x] 4.4 分析数据持久化模块覆盖率
  - [x] 4.5 分析用户认证模块覆盖率

- [x] Task 5: 创建分析报告 (AC: #5)
  - [x] 5.1 创建总体覆盖率摘要
  - [x] 5.2 创建模块详细分析
  - [x] 5.3 创建未覆盖代码清单
  - [x] 5.4 创建优先级补充建议
  - [x] 5.5 保存报告到 docs/test-coverage-report.md

- [x] Task 6: CI 集成准备 (AC: #6)
  - [x] 6.1 创建覆盖率脚本（scripts/generate-coverage.sh）
  - [x] 6.2 添加 npm script（coverage:report）
  - [x] 6.3 创建 .gitignore 条目（coverage/）
  - [x] 6.4 准备 CI 配置示例（可选）

## Dev Notes

### 当前测试状态 (Story 8.1 完成后)

**测试套件:** 60 passed, 19 failed, 3 skipped (73.2%)
**测试用例:** 1146 passed, 48 failed, 13 skipped (95%)

### Jest 覆盖率配置

**当前配置 (jest.config.js):**
```javascript
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/__tests__/**',
  '!src/**/node_modules/**',
],
```

**需要添加:**
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
```

### 覆盖率目标

| 模块类型 | 目标覆盖率 | 说明 |
|---------|----------|------|
| 核心业务逻辑 | 85%+ | AI, OCR, PDF, 数据持久化 |
| 工具函数 | 90%+ | 纯函数，易于测试 |
| UI 组件 | 70%+ | 视觉组件，E2E 测试补充 |
| 集成层 | 75%+ | API 调用，需要 mock |

### 关键模块列表

#### 1. AI 服务模块
- `src/services/ai/aiService.ts`
- `src/services/ai/promptBuilder.ts`
- 重要性：核心功能，题目生成和讲解
- 预计覆盖率目标：85%+

#### 2. OCR 服务模块
- `src/services/ocrService.ts`
- `src/services/tesseractOcr.ts`
- 重要性：题目识别，用户体验关键
- 预计覆盖率目标：85%+

#### 3. PDF 服务模块
- `src/services/pdfService.ts`
- 重要性：题目导出功能
- 预计覆盖率目标：80%+

#### 4. 数据持久化模块
- `src/services/mysql/*.ts`
- 重要性：数据存储，ACID 保证
- 预计覆盖率目标：85%+

#### 5. 用户认证模块
- `src/services/authService.ts`
- `src/services/passwordResetService.ts`
- 重要性：安全性关键
- 预计覆盖率目标：90%+

### 分析维度

#### 覆盖率类型

1. **语句覆盖率 (Statements)** - 执行了多少代码语句
2. **分支覆盖率 (Branches)** - if/else 分支是否都执行
3. **函数覆盖率 (Functions)** - 函数是否被调用
4. **行覆盖率 (Lines)** - 代码行是否执行

#### 优先级判断

**P0 - 立即补充:**
- 覆盖率 < 50%
- 核心业务逻辑
- 安全相关代码

**P1 - 优先补充:**
- 覆盖率 50-70%
- 重要功能模块
- 错误处理路径

**P2 - 计划补充:**
- 覆盖率 70-80%
- 辅助功能
- UI 组件

**P3 - 可选补充:**
- 覆盖率 > 80%
- 简单工具函数
- 已有类似覆盖

### 工具和命令

```bash
# 生成覆盖率报告
npm test -- --coverage

# 生成特定格式的报告
npm test -- --coverage --coverageReporters=text,lcov,html

# 只运行特定模块的测试并生成覆盖率
npm test -- --coverage --testPathPattern=services/ai

# 查看覆盖率摘要
npm test -- --coverage --coverageReporters=text-summary

# 打开 HTML 报告
open coverage/lcov-report/index.html
```

### 报告模板

**总体覆盖率摘要:**
```markdown
# 测试覆盖率报告

**生成日期:** 2026-04-04
**总覆盖率:**
- 语句: XX%
- 分支: XX%
- 函数: XX%
- 行: XX%

**测试文件数:** XX
**测试用例数:** XX
```

**模块覆盖率表:**
```markdown
| 模块 | 语句 | 分支 | 函数 | 行 | 状态 | 优先级 |
|------|-----|------|------|-----|------|--------|
| services/ai | XX% | XX% | XX% | XX% | ⚠️ | P0 |
```

### 项目结构注意事项

**测试文件位置:**
- `src/**/__tests__/*.test.ts(x)` - 单元测试
- `src/**/*.test.ts(x)` - 组件测试

**覆盖率报告位置:**
- `coverage/` - 生成的覆盖率报告目录
- `coverage/lcov-report/index.html` - HTML 可视化报告
- `coverage/lcov.info` - lcov 格式报告

**.gitignore 条目:**
```
# 测试覆盖率
coverage/
*.lcov
.nyc_output/
```

### Anti-Patterns to Avoid

- ❌ 不要只关注总体覆盖率，要关注关键模块
- ❌ 不要为了覆盖率而写无意义的测试
- ❌ 不要忽略低覆盖率的警告
- ❌ 不要在 CI 中跳过覆盖率检查
- ❌ 不要提交覆盖率报告到 git（应添加到 .gitignore）

### 与 Story 8.1 的关系

**Story 8.1 (已完成):**
- 修复了 3 个关键测试文件
- 测试通过率达到 95%
- 创建了批量修复工具和文档

**Story 8.2 (当前):**
- 分析现有测试覆盖情况
- 识别测试盲点
- 为后续测试补充提供数据支持

**Story 8.3+ (后续):**
- 根据覆盖率报告补充单元测试
- 完善集成测试
- 创建 E2E 测试

### 成功标准

**Story 8.2 完成标志:**
1. ✅ 覆盖率报告成功生成（HTML + lcov）
2. ✅ 创建详细的覆盖率分析报告
3. ✅ 识别所有 < 50% 覆盖率的模块
4. ✅ 为后续测试工作提供明确的优先级列表
5. ✅ CI 集成配置准备就绪

### 预计工作量

**时间估算:** 1 天

**详细分解:**
- 上午 (2小时): 配置和生成覆盖率报告
- 下午 (3小时): 分析数据，创建详细报告
- 下午 (2小时): CI 集成准备，文档完善

### 风险和缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 覆盖率数据不准确 | 中 | 多次运行验证 |
| HTML 报告过大 | 低 | 只保留关键模块报告 |
| CI 配置复杂 | 低 | 提供配置示例和脚本 |

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (glm-5)

### Implementation Plan

**Task 1: Jest 覆盖率配置**
- ✅ 验证了 jest.config.js 现有配置
- ✅ 添加了 coverageReporters: ['text', 'text-summary', 'lcov', 'html']
- ✅ 添加了 coverageThreshold 配置（80% 目标）
- ✅ 运行了首次覆盖率测试，获取了基线数据

**Task 2: 生成完整覆盖率报告**
- ✅ 生成了 HTML 可视化报告（coverage/lcov-report/）
- ✅ 生成了 lcov 格式报告（coverage/lcov.info）
- ✅ 提取了总体覆盖率统计

**Task 3-4: 模块覆盖率分析**
- ✅ 分析了所有服务和组件模块的覆盖率
- ✅ 识别了 P0 优先级模块（<50% 覆盖率）
- ✅ 识别了 P1 优先级模块（50-70% 覆盖率）
- ✅ 分析了 5 个关键功能模块的覆盖率

**Task 5: 创建分析报告**
- ✅ 创建了详细的覆盖率分析报告（docs/test-coverage-report.md）
- ✅ 包含总体摘要、模块分析、优先级列表、改进建议

**Task 6: CI 集成准备**
- ✅ 创建了 scripts/generate-coverage.sh 脚本
- ✅ 添加了 npm scripts (test:coverage, test:coverage:report, coverage:report)
- ✅ 更新了 .gitignore 文件

### Debugging Notes

1. **测试失败问题**：当前测试套件有 19 个失败，但覆盖率报告仍能正常生成
2. **覆盖率阈值**：设置了 80% 的全局阈值，但当前仅 51.28%，Jest 会发出警告
3. **HTML 报告大小**：覆盖率报告较大（1.7MB lcov.info），但在可接受范围内
4. **jq 依赖**：脚本中使用 jq 解析 JSON，在 macOS 上需要安装（brew install jq）

### Completion Notes List

**Story 8.2 完成总结 (2026-04-04)**

**✅ 已完成所有 6 个任务和 24 个子任务**

**关键成果:**

1. **覆盖率基线数据**
   - 语句覆盖率: 51.28%
   - 分支覆盖率: 43.74%
   - 函数覆盖率: 53.93%
   - 行覆盖率: 51.58%

2. **识别的关键问题**
   - PDF 服务完全未测试（0% 覆盖率）
   - 8 个 UI 组件未测试
   - AI 服务模块覆盖率严重不足（<15%）

3. **创建的交付物**
   - 📊 详细分析报告: docs/test-coverage-report.md
   - 🔧 覆盖率脚本: scripts/generate-coverage.sh
   - 📦 npm scripts: test:coverage, test:coverage:report, coverage:report
   - 🚫 .gitignore 更新

4. **优先级建议**
   - P0 (立即补充): PDF 服务、AI 服务、0% 覆盖率组件
   - P1 (优先补充): API 服务、数据持久化、认证服务

**验收标准完成情况:**
- ✅ AC1: 覆盖率报告生成 - 完成
- ✅ AC2: 覆盖率目标设定 - 完成（80% 基准）
- ✅ AC3: 未覆盖区域识别 - 完成（识别所有 <50% 模块）
- ✅ AC4: 关键功能覆盖分析 - 完成（5个模块详细分析）
- ✅ AC5: 文档输出 - 完成（详细报告）
- ✅ AC6: CI 集成准备 - 完成（脚本和配置）

**下一步建议:**
- 开始 Story 8.3: 单元测试增强
- 优先补充 P0 模块的测试
- 目标: 将总体覆盖率从 51.28% 提升至 75%+

### File List

**修改文件：**
- MathLearningApp/jest.config.js - 添加覆盖率报告配置和阈值
- MathLearningApp/package.json - 添加覆盖率相关 npm scripts
- MathLearningApp/.gitignore - 添加覆盖率报告忽略规则

**新增文件：**
- MathLearningApp/docs/test-coverage-report.md - 详细的覆盖率分析报告
- MathLearningApp/scripts/generate-coverage.sh - 覆盖率生成脚本（已添加可执行权限）

**生成目录（已添加到 .gitignore）：**
- MathLearningApp/coverage/ - 覆盖率报告目录
- MathLearningApp/coverage/lcov-report/ - HTML 可视化报告
- MathLearningApp/coverage/lcov.info - LCOV 格式报告
- MathLearningApp/coverage/coverage-summary.json - JSON 格式摘要

## Change Log

- 2026-04-04 18:00: Story 8.2 完成 - 所有任务完成，覆盖率分析和报告生成完毕，状态更新为 review
- 2026-04-04: Story 8.2 上下文文件创建 - 准备测试覆盖率分析
