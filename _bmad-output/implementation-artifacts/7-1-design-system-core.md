# Story 7.1: 创建设计系统核心文件

Status: done

## Story

As a **开发人员**,
I want **创建统一的设计系统核心文件（间距、圆角、阴影、整合入口）**,
so that **所有页面和组件可以使用一致的样式Token，消除硬编码值**.

## Acceptance Criteria

1. **AC1: 间距系统** ✅ 创建 `src/styles/spacing.ts`，定义 xs(4), sm(8), md(12), lg(16), xl(20), xxl(24), xxxl(32) 间距值
2. **AC2: 圆角系统** ✅ 创建 `src/styles/borderRadius.ts`，定义 none(0), sm(4), md(8), lg(12), xl(16), full(9999) 圆角值
3. **AC3: 阴影系统** ✅ 创建 `src/styles/shadows.ts`，定义 none, sm, md, lg 阴影样式对象
4. **AC4: 设计系统入口** ✅ 创建 `src/styles/designSystem.ts`，整合 colors, typography, spacing, borderRadius, shadows
5. **AC5: 类型导出** ✅ 所有文件都有完整的 TypeScript 类型定义和导出
6. **AC6: 与现有文件兼容** ✅ 不修改现有的 colors.ts, typography.ts, tablet.ts，只创建新文件并整合

## Tasks / Subtasks

- [x] Task 1: 创建间距系统 (AC: #1)
  - [x] 1.1 创建 `src/styles/spacing.ts`
  - [x] 1.2 定义 Spacing 类型
  - [x] 1.3 导出 spacing 常量对象

- [x] Task 2: 创建圆角系统 (AC: #2)
  - [x] 2.1 创建 `src/styles/borderRadius.ts`
  - [x] 2.2 定义 BorderRadius 类型
  - [x] 2.3 导出 borderRadius 常量对象

- [x] Task 3: 创建阴影系统 (AC: #3)
  - [x] 3.1 创建 `src/styles/shadows.ts`
  - [x] 3.2 定义 Shadow 类型
  - [x] 3.3 创建平台适配的阴影样式（iOS shadow*, Android elevation）

- [x] Task 4: 创建设计系统入口 (AC: #4, #5, #6)
  - [x] 4.1 创建 `src/styles/designSystem.ts`
  - [x] 4.2 导入并整合现有 colors.ts, typography.ts
  - [x] 4.3 导入新创建的 spacing, borderRadius, shadows
  - [x] 4.4 导出统一的 designSystem 对象
  - [x] 4.5 导出所有类型定义

- [x] Task 5: 验证和测试 (AC: All)
  - [x] 5.1 TypeScript 编译无错误
  - [x] 5.2 所有导出正确

## Dev Notes

### 现有文件结构

```
src/styles/
├── colors.ts          # ✅ 已存在 - WCAG AA 兼容颜色系统
├── typography.ts      # ✅ 已存在 - 字体系统
├── tablet.ts          # ✅ 已存在 - 响应式设计
├── calmingColors.ts   # ✅ 已存在 - 焦虑缓解颜色
└── animations.ts      # ✅ 已存在 - 动画配置
```

### 新增文件结构

```
src/styles/
├── spacing.ts         # 🆕 新建
├── borderRadius.ts    # 🆕 新建
├── shadows.ts         # 🆕 新建
└── designSystem.ts    # 🆕 新建 - 整合入口
```

### 间距规范

| 名称 | 值 | 用途 |
|------|-----|------|
| xs | 4dp | 极小间距 |
| sm | 8dp | 小间距 |
| md | 12dp | 中等间距 |
| lg | 16dp | 大间距（默认padding） |
| xl | 20dp | 较大间距 |
| xxl | 24dp | 区块间距 |
| xxxl | 32dp | 大区块间距 |

### 圆角规范

| 名称 | 值 | 用途 |
|------|-----|------|
| none | 0 | 无圆角 |
| sm | 4dp | 小圆角（按钮） |
| md | 8dp | 中圆角（输入框） |
| lg | 12dp | 大圆角（卡片） |
| xl | 16dp | 超大圆角 |
| full | 9999dp | 完全圆形 |

### 阴影规范

| 名称 | 用途 | iOS | Android |
|------|------|-----|---------|
| none | 无阴影 | - | elevation: 0 |
| sm | 轻微阴影 | shadowOpacity: 0.1 | elevation: 2 |
| md | 中等阴影 | shadowOpacity: 0.15 | elevation: 4 |
| lg | 强阴影 | shadowOpacity: 0.2 | elevation: 6 |

### 技术要求

1. **使用 TypeScript** - 所有文件必须有类型定义
2. **平台适配** - 阴影需要同时支持 iOS (shadow*) 和 Android (elevation)
3. **不修改现有文件** - 只创建新文件，不修改 colors.ts, typography.ts
4. **导出格式** - 使用命名导出和默认导出

### 代码示例

**spacing.ts:**
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export type Spacing = typeof spacing;
export default spacing;
```

**designSystem.ts:**
```typescript
import { Colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { borderRadius } from './borderRadius';
import { shadows } from './shadows';

export const designSystem = {
  colors: Colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export type DesignSystem = typeof designSystem;
export default designSystem;

// 重新导出所有子模块
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './borderRadius';
export * from './shadows';
```

### Project Structure Notes

- 所有样式文件放在 `src/styles/` 目录
- 遵循现有文件的命名规范（小驼峰）
- 保持与现有 colors.ts, typography.ts 一致的代码风格

### References

- [Source: src/styles/colors.ts] - 现有颜色系统结构
- [Source: src/styles/typography.ts] - 现有字体系统结构
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-30.md] - 变更提案

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (glm-5)

### Debugging Notes
- 项目没有根级 tsconfig.json，使用 React Native 默认配置
- 测试框架使用 Jest
- 现有测试中有一些预存的失败（ProcessingStage.UPLOADING 相关），与本次变更无关

### Completion Notes List
- ✅ 创建了 `src/styles/spacing.ts` - 间距系统
- ✅ 创建了 `src/styles/borderRadius.ts` - 圆角系统
- ✅ 创建了 `src/styles/shadows.ts` - 阴影系统（支持 iOS/Android 双平台）
- ✅ 创建了 `src/styles/designSystem.ts` - 统一设计系统入口
- ✅ 所有文件都有完整的 TypeScript 类型定义
- ✅ 与现有文件（colors.ts, typography.ts）保持兼容
- ✅ 提供便捷工具函数：getSpacing, getBorderRadius, getShadow, createPadding, createMargin

### Code Review Results (2026-03-30)
**审查结果**: ✅ 通过 (5 Patch 问题已修复)

**修复的问题**:
1. ✅ `getShadow` 缺少运行时验证 → 添加了 validLevels 数组和 fallback 逻辑
2. ✅ `createSpacing` 命名不准确 → 重命名为 `createPadding`，添加 `createSpacing` 作为 deprecated 别名
3. ✅ CSS shorthand 参数缺少文档 → 添加了完整的 JSDoc 文档说明
4. ✅ ShadowColor 硬编码 → 改用 `Colors.text.primary`
5. ✅ ShadowStyle 类型别名 → 保留用于语义化

**验证**: 所有 4 个文件 TypeScript 编译通过

## File List

**新增文件：**
- MathLearningApp/src/styles/spacing.ts
- MathLearningApp/src/styles/borderRadius.ts
- MathLearningApp/src/styles/shadows.ts
- MathLearningApp/src/styles/designSystem.ts

## Change Log

- 2026-03-30: Story 7.1 完成 - 创建设计系统核心文件
