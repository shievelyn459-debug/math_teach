# Story 7.2: 创建通用UI组件库

Status: done

## Story

As a **开发人员**,
I want **创建通用UI组件库（Button, Card, Icon, Typography, Spacer）**,
so that **所有页面可以使用统一的组件，避免重复定义样式**.

## Acceptance Criteria

1. **AC1: Button 组件** ✅ 创建 `src/components/ui/Button/Button.tsx`，支持 primary/secondary/outline/ghost 变体，sm/md/lg 尺寸，normal/disabled/loading 状态
2. **AC2: Card 组件** ✅ 创建 `src/components/ui/Card/Card.tsx`，支持 elevated/outlined/filled 变体，统一 padding, borderRadius, shadow
3. **AC3: Icon 组件** ✅ 创建 `src/components/ui/Icon/Icon.tsx`，统一使用 MaterialIcons，预设 sm(16)/md(24)/lg(32)/xl(48) 尺寸
4. **AC4: Typography 组件** ✅ 创建 `src/components/ui/Typography/Typography.tsx`，支持 display/headline/body/caption/overline 变体
5. **AC5: Spacer 组件** ✅ 创建 `src/components/ui/Spacing/Spacer.tsx`，使用设计系统的 spacing 值
6. **AC6: 组件导出** ✅ 每个组件都有 index.ts 导出文件和 TypeScript 类型定义
7. **AC7: 使用设计系统** ✅ 所有组件都从 designSystem.ts 获取样式值
8. **AC8: 无障碍支持** ✅ 所有可交互组件都有 accessibilityLabel 支持

## Tasks / Subtasks

- [x] Task 1: 创建 Button 组件 (AC: #1, #6, #7, #8)
  - [x] 1.1 创建 `src/components/ui/Button/` 目录
  - [x] 1.2 创建 `Button.types.ts` 类型定义
  - [x] 1.3 创建 `Button.tsx` 组件实现
  - [x] 1.4 支持 4 种变体 (primary, secondary, outline, ghost)
  - [x] 1.5 支持 3 种尺寸 (sm, md, lg)
  - [x] 1.6 支持 loading 和 disabled 状态
  - [x] 1.7 添加 accessibilityLabel 支持
  - [x] 1.8 创建 `index.ts` 导出

- [x] Task 2: 创建 Card 组件 (AC: #2, #6, #7)
  - [x] 2.1 创建 `src/components/ui/Card/` 目录
  - [x] 2.2 创建 `Card.types.ts` 类型定义
  - [x] 2.3 创建 `Card.tsx` 组件实现
  - [x] 2.4 支持 3 种变体 (elevated, outlined, filled)
  - [x] 2.5 统一使用 borderRadius 和 shadows
  - [x] 2.6 创建 `index.ts` 导出

- [x] Task 3: 创建 Icon 组件 (AC: #3, #6, #7)
  - [x] 3.1 创建 `src/components/ui/Icon/` 目录
  - [x] 3.2 创建 `Icon.types.ts` 类型定义
  - [x] 3.3 创建 `Icon.tsx` 组件实现
  - [x] 3.4 封装 MaterialIcons，提供类型安全的图标名称
  - [x] 3.5 支持 4 种预设尺寸
  - [x] 3.6 创建 `index.ts` 导出

- [x] Task 4: 创建 Typography 组件 (AC: #4, #6, #7)
  - [x] 4.1 创建 `src/components/ui/Typography/` 目录
  - [x] 4.2 创建 `Typography.types.ts` 类型定义
  - [x] 4.3 创建 `Typography.tsx` 组件实现
  - [x] 4.4 支持 11 种变体 (displayLarge/Small/Medium, headlineLarge/Medium/Small, bodyLarge/Small, caption, overline)
  - [x] 4.5 从 designSystem 获取字体样式
  - [x] 4.6 创建 `index.ts` 导出

- [x] Task 5: 创建 Spacer 组件 (AC: #5, #6, #7)
  - [x] 5.1 创建 `src/components/ui/Spacing/` 目录
  - [x] 5.2 创建 `Spacer.tsx` 组件实现
  - [x] 5.3 支持 spacing 系统的所有尺寸
  - [x] 5.4 支持水平和垂直方向
  - [x] 5.5 创建 `index.ts` 导出

- [x] Task 6: 创建 UI 组件库入口 (AC: #6)
  - [x] 6.1 创建 `src/components/ui/index.ts`
  - [x] 6.2 导出所有组件

## Dev Notes

### 文件结构

```
src/components/ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.types.ts
│   └── index.ts
├── Card/
│   ├── Card.tsx
│   ├── Card.types.ts
│   └── index.ts
├── Icon/
│   ├── Icon.tsx
│   ├── Icon.types.ts
│   └── index.ts
├── Typography/
│   ├── Typography.tsx
│   ├── Typography.types.ts
│   └── index.ts
├── Spacing/
│   ├── Spacer.tsx
│   └── index.ts
└── index.ts
```

### 依赖关系

- **必须先完成 Story 7.1** - 本 Story 依赖 designSystem.ts
- **使用 react-native-vector-icons** - Icon 组件封装 MaterialIcons

### Button 组件规范

```typescript
// Button.types.ts
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  title: string;
  accessibilityLabel?: string;
  leftIcon?: string;
  rightIcon?: string;
}
```

**尺寸对应:**
| Size | padding | fontSize |
|------|---------|----------|
| sm | 8px 16px | 14px |
| md | 12px 20px | 16px |
| lg | 16px 24px | 18px |

### Card 组件规范

```typescript
// Card.types.ts
export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps {
  variant?: CardVariant;
  padding?: keyof typeof designSystem.spacing;
  children: React.ReactNode;
}
```

### Icon 组件规范

```typescript
// Icon.types.ts
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps {
  name: string; // MaterialIcons name
  size?: IconSize;
  color?: string;
  accessibilityLabel?: string;
}
```

**尺寸映射:**
| Size | dp |
|------|-----|
| sm | 16 |
| md | 24 |
| lg | 32 |
| xl | 48 |

### Typography 组件规范

```typescript
// Typography.types.ts
export type TypographyVariant =
  | 'displayLarge' | 'displayMedium' | 'displaySmall'
  | 'headlineLarge' | 'headlineMedium' | 'headlineSmall'
  | 'bodyLarge' | 'body' | 'bodySmall'
  | 'caption' | 'overline';

export interface TypographyProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}
```

### Spacer 组件规范

```typescript
// Spacer.tsx
export interface SpacerProps {
  size?: keyof typeof designSystem.spacing; // xs, sm, md, lg, xl, xxl, xxxl
  direction?: 'horizontal' | 'vertical';
}
```

### 技术要求

1. **TypeScript 严格模式** - 所有组件都有完整类型定义
2. **使用 designSystem** - 从 `src/styles/designSystem.ts` 获取所有样式值
3. **无障碍支持** - 所有可交互组件支持 accessibilityLabel
4. **性能优化** - 使用 React.memo 包装纯组件

### Anti-Patterns to Avoid

- ❌ 不要在组件内硬编码颜色值
- ❌ 不要使用内联样式，使用 StyleSheet.create
- ❌ 不要忽略无障碍属性
- ❌ 不要创建与 react-native-paper 功能重叠的组件

### References

- [Source: src/styles/designSystem.ts] - 设计系统入口（Story 7.1 创建）
- [Source: node_modules/react-native-vector-icons/MaterialIcons.js] - MaterialIcons 图标列表
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-30.md] - 变更提案

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (glm-5)

### Debugging Notes
- 使用 designSystem Token 确保样式一致性
- 所有组件使用 React.memo 包装优化性能
- Typography 支持 11 种变体（超出原计划的 5 种）
- Spacer 支持 VSpacer 和 HSpacer 快捷组件

### Completion Notes List
- ✅ 创建了 Button 组件（4 种变体 + 3 种尺寸 + loading/disabled 状态）
- ✅ 创建了 Card 组件（3 种变体 + 可点击支持）
- ✅ 创建了 Icon 组件（4 种预设尺寸 + MaterialIcons 封装）
- ✅ 创建了 Typography 组件（11 种变体 + 对齐支持）
- ✅ 创建了 Spacer 组件（水平/垂直方向 + VSpacer/HSpacer 快捷组件）
- ✅ 创建了 UI 组件库统一入口
- ✅ 所有组件都使用设计系统 Token
- ✅ 所有可交互组件都有无障碍支持

### Code Review Results (2026-03-30)
**审查结果**: ✅ 通过 (5 Patch 问题已修复)

**修复的问题:**
1. ✅ **运行时验证缺失** - 为 Button, Card, Typography, Spacer 添加了 isValidVariant/isValidSize 等运行时验证，无效值时回退到默认值并发出 console.warn
2. ✅ **回调错误处理** - Button.onPress 和 Card.onPress 包装在 try-catch 中，防止用户代码错误导致组件崩溃
3. ✅ **空内容警告** - Button 在 title 和 icon 都为空时发出开发警告
4. ✅ **无效 align 处理** - Typography.getAlignment 函数添加验证，无效值回退到 'left'
5. ✅ **Spacer size 验证** - 添加 isValidSize 验证，无效值回退到 'md'

**验证**: 所有 5 个修复后的文件 TypeScript 编译通过

## File List

**新增文件：**
- MathLearningApp/src/components/ui/Button/Button.tsx
- MathLearningApp/src/components/ui/Button/Button.types.ts
- MathLearningApp/src/components/ui/Button/index.ts
- MathLearningApp/src/components/ui/Card/Card.tsx
- MathLearningApp/src/components/ui/Card/Card.types.ts
- MathLearningApp/src/components/ui/Card/index.ts
- MathLearningApp/src/components/ui/Icon/Icon.tsx
- MathLearningApp/src/components/ui/Icon/Icon.types.ts
- MathLearningApp/src/components/ui/Icon/index.ts
- MathLearningApp/src/components/ui/Typography/Typography.tsx
- MathLearningApp/src/components/ui/Typography/Typography.types.ts
- MathLearningApp/src/components/ui/Typography/index.ts
- MathLearningApp/src/components/ui/Spacing/Spacer.tsx
- MathLearningApp/src/components/ui/Spacing/index.ts
- MathLearningApp/src/components/ui/index.ts

## Change Log

- 2026-03-30: Story 7.2 完成 - 创建通用 UI 组件库
