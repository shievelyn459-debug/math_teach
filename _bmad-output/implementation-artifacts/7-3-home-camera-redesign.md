# Story 7.3: 重构核心页面 (Phase 1)

Status: done

## Story

As a **开发人员**,
I want **重构核心页面（HomeScreen, CameraScreen）使用新的设计系统和UI组件**,
so that **用户最常使用的页面具有一致的UI风格和专业的外观**.

## Acceptance Criteria

1. **AC1: HomeScreen 重构** - 移除所有硬编码颜色、字体、间距值，使用设计系统
2. **AC2: HomeScreen 使用UI组件** - 使用 Button, Card, Icon, Typography, Spacer 组件
3. **AC3: HomeScreen 移除 emoji** - 将 📚📊💡📝 替换为 MaterialIcons
4. **AC4: CameraScreen 重构** - 移除所有硬编码颜色、字体、间距值，使用设计系统
5. **AC5: CameraScreen 使用UI组件** - 使用 Button, Card, Icon, Typography, Spacer 组件
6. **AC6: 功能不变** - 重构后所有功能保持正常工作
7. **AC7: 样式一致** - 页面视觉效果统一、专业

## Tasks / Subtasks

- [x] Task 1: HomeScreen 重构 (AC: #1, #2, #3, #6, #7)
  - [x] 1.1 导入 designSystem 和 UI 组件
  - [x] 1.2 替换硬编码颜色为 designSystem.colors
  - [x] 1.3 替换硬编码字体为 Typography 组件
  - [x] 1.4 替换硬编码间距为 Spacer 组件或 designSystem.spacing
  - [x] 1.5 将 emoji 图标替换为 Icon 组件
  - [x] 1.6 使用 Card 组件替换硬编码卡片样式
  - [x] 1.7 使用 Button 组件替换硬编码按钮样式 (HomeScreen使用TouchableOpacity)
  - [x] 1.8 清理重复样式代码
  - [x] 1.9 测试所有功能正常

- [x] Task 2: CameraScreen 重构 (AC: #4, #5, #6, #7)
  - [x] 2.1 导入 designSystem 和 UI 组件
  - [x] 2.2 替换硬编码颜色为 designSystem.colors
  - [x] 2.3 替换硬编码字体为 Typography 组件
  - [x] 2.4 替换硬编码间距为 Spacer 组件或 designSystem.spacing
  - [x] 2.5 使用 Card 组件替换硬编码卡片样式
  - [x] 2.6 使用 Button 组件替换硬编码按钮样式
  - [x] 2.7 清理重复样式代码
  - [x] 2.8 测试所有功能正常

## Dev Notes

### 需要重构的文件

| 文件 | 路径 |
|------|------|
| HomeScreen | `src/screens/HomeScreen.tsx` |
| CameraScreen | `src/screens/CameraScreen.tsx` |

### HomeScreen 当前问题

**硬编码颜色（需替换）:**
```typescript
// 当前
backgroundColor: '#007bff'  // → designSystem.colors.primary
backgroundColor: '#E3F2FD'  // → designSystem.colors.info.light
backgroundColor: '#E8F5E9'  // → designSystem.colors.success.light
color: '#1565C0'           // → designSystem.colors.primaryDark
color: '#2E7D32'           // → designSystem.colors.success.dark
```

**硬编码字体（需替换）:**
```typescript
// 当前
fontSize: 24  // → Typography variant="displaySmall"
fontSize: 17  // → Typography variant="headlineSmall"
fontSize: 16  // → Typography variant="body"
fontSize: 14  // → Typography variant="caption"
fontSize: 13  // → Typography variant="caption"
```

**硬编码间距（需替换）:**
```typescript
// 当前
padding: 20     // → designSystem.spacing.xl
padding: 15     // → designSystem.spacing.lg
margin: 15      // → designSystem.spacing.lg
marginTop: 15   // → <Spacer size="lg" />
gap: 10         // → designSystem.spacing.md
```

**Emoji 图标（需替换）:**
```typescript
// 当前
📚  // → <Icon name="menu-book" size="md" />
📊  // → <Icon name="bar-chart" size="md" />
💡  // → <Icon name="lightbulb" size="md" />
📝  // → <Icon name="edit-note" size="md" />
```

### 重构示例

**Before:**
```tsx
<View style={styles.header}>
  <Text style={styles.title}>一年级数学学习助手</Text>
  <Text style={styles.subtitle}>让家长轻松掌握辅导方法</Text>
</View>

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#007bff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
```

**After:**
```tsx
<View style={[styles.header, { backgroundColor: designSystem.colors.primary }]}>
  <Typography variant="displaySmall" color={designSystem.colors.text.inverse}>
    一年级数学学习助手
  </Typography>
  <Spacer size="sm" />
  <Typography variant="body" color={designSystem.colors.text.inverse}>
    让家长轻松掌握辅导方法
  </Typography>
</View>

const styles = StyleSheet.create({
  header: {
    padding: designSystem.spacing.xl,
  },
});
```

### 依赖关系

- **必须先完成 Story 7.1** - 需要 designSystem.ts
- **必须先完成 Story 7.2** - 需要 UI 组件库

### 技术要求

1. **渐进式重构** - 保持功能稳定，逐步替换样式
2. **保持兼容** - 不改变组件 props 接口
3. **测试验证** - 每个页面重构后验证功能

### Anti-Patterns to Avoid

- ❌ 不要一次性修改太多文件，逐个页面重构
- ❌ 不要改变组件的业务逻辑
- ❌ 不要删除现有的辅助功能（HelpDialog, OnboardingTour 等）
- ❌ 不要修改测试文件的断言

### References

- [Source: src/screens/HomeScreen.tsx] - 待重构文件
- [Source: src/screens/CameraScreen.tsx] - 待重构文件
- [Source: src/styles/designSystem.ts] - 设计系统入口
- [Source: src/components/ui/] - UI 组件库

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (glm-5)

### Debugging Notes
- HomeScreen 重构完成，使用了 designSystem 和 UI 组件库
- CameraScreen 文件较大，包含复杂的相机逻辑，需要更仔细的重构策略
- 保持了所有现有功能不变
- CameraScreen 重构完成，所有硬编码值已替换为 designSystem tokens

### Completion Notes List
- ✅ HomeScreen 重构完成
  - 导入 designSystem 和 UI 组件 (Button, Card, Icon, Typography, Spacer)
  - 替换所有硬编码颜色为 designSystem.colors
  - 替换所有硬编码字体为 Typography 组件
  - 替换所有硬编码间距为 Spacer 组件或 designSystem.spacing
  - 替换 emoji 图标 (📚📊💡📝) 为 Icon 组件 (menu-book, bar-chart, lightbulb, edit-note)
  - 使用 Card 组件替换 PaperCard 样式
  - 清理重复样式代码，统一使用 designSystem tokens

- ✅ CameraScreen 重构完成
  - 导入 designSystem 和 UI 组件 (Button, Card, Icon, Typography, Spacer)
  - 替换所有硬编码颜色为 designSystem.colors (primary, info, success, error, surface, text, border)
  - 替换 Icon 组件调用为统一 API (size="sm|md|lg|xl", color={designSystem.colors...})
  - 替换 Text 为 Typography 组件
  - 替换 Paper Button/Button 为 UI Button 组件
  - 替换 Paper Card 为 UI Card 组件
  - 清理重复样式代码，统一使用 designSystem tokens (spacing, borderRadius, shadows)

## File List

**修改文件：**
- MathLearningApp/src/screens/HomeScreen.tsx
- MathLearningApp/src/screens/CameraScreen.tsx

## Change Log

- 2026-03-30: Task 1 HomeScreen 重构完成 - 使用设计系统和 UI 组件
- 2026-03-30: Task 2 CameraScreen 重构完成 - 使用设计系统和 UI 组件
