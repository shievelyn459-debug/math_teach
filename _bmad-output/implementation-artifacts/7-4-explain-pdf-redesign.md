# Story 7.4: 重构功能页面 (Phase 2)

Status: done

## Story

As a **开发人员**,
I want **重构功能页面（ExplainScreen, PDFPreviewScreen, PDFListScreen, ChildListScreen）使用新的设计系统**,
so that **所有功能页面具有一致的UI风格**.

## Acceptance Criteria

1. **AC1: ExplainScreen 重构** - 移除所有硬编码颜色、字体、间距值，使用设计系统和UI组件
2. **AC2: PDFPreviewScreen 重构** - 移除所有硬编码值，使用设计系统和UI组件
3. **AC3: PDFListScreen 重构** - 移除所有硬编码值，使用设计系统和UI组件
4. **AC4: ChildListScreen 重构** - 移除所有硬编码值，使用设计系统和UI组件
5. **AC5: 功能不变** - 重构后所有功能保持正常工作
6. **AC6: 样式一致** - 所有页面视觉效果统一
7. **AC7: Emoji替换** - 将所有emoji图标替换为MaterialIcons

## Tasks / Subtasks

- [x] Task 1: ExplainScreen 重构 (AC: #1, #5, #6)
  - [x] 1.1 导入 designSystem 和 UI 组件
  - [x] 1.2 替换硬编码颜色 (`#f5f5f5`, `#333`, `#666`)
  - [x] 1.3 替换硬编码字体 (24, 16)
  - [x] 1.4 替换硬编码间距 (8)
  - [x] 1.5 使用 Typography 组件替换 Text
  - [x] 1.6 测试功能正常

- [x] Task 2: PDFPreviewScreen 重构 (AC: #2, #5, #6, #7)
  - [x] 2.1 导入 designSystem 和 UI 组件
  - [x] 2.2 替换硬编码颜色 (`#f5f5f5`, `#fff`, `#333`, `#666`, `#999`, `#2196f3`, `#4caf50`, `#f44336`, `#e0e0e0`, `#ccc`, `#fff3e0`, `#ffb74d`, `#e65100`)
  - [x] 2.3 替换硬编码字体 (getFontSize 调用 → Typography 组件)
  - [x] 2.4 替换硬编码间距 (getScaledSpacing 调用 → designSystem.spacing)
  - [x] 2.5 替换硬编码圆角 (8, 12 → designSystem.borderRadius)
  - [x] 2.6 使用 Button 组件替换 TouchableOpacity 按钮样式
  - [x] 2.7 替换 emoji 图标 (✓, !) 为 Icon 组件
  - [x] 2.8 测试所有功能正常（保存、分享、打印、打开）

- [x] Task 3: PDFListScreen 重构 (AC: #3, #5, #6, #7)
  - [x] 3.1 导入 designSystem 和 UI 组件
  - [x] 3.2 替换硬编码颜色 (`#f5f5f5`, `#fff`, `#333`, `#666`, `#999`, `#2196f3`, `#e0e0e0`, `#e3f2fd`, `#f44336`, `#c62828`, `#ffcdd2`, `#ffebee`)
  - [x] 3.3 替换硬编码字体 (getFontSize 调用 → Typography 组件)
  - [x] 3.4 替换硬编码间距 (getScaledSpacing 调用 → designSystem.spacing)
  - [x] 3.5 替换硬编码圆角 (8, 12, 18 → designSystem.borderRadius)
  - [x] 3.6 替换 emoji 图标 (📄, ↗, 🖨, 🗑, 📁) 为 Icon 组件
  - [x] 3.7 测试所有功能正常（列表、分享、打印、删除）

- [x] Task 4: ChildListScreen 重构 (AC: #4, #5, #6)
  - [x] 4.1 导入 designSystem 和 UI 组件
  - [x] 4.2 替换硬编码颜色 (`#f5f5f5`, `#fff`, `#333`, `#666`, `#999`, `#e0e0e0`, `#ccc`)
  - [x] 4.3 替换硬编码字体 (12, 14, 16, 18, 20, 24, 28, 80)
  - [x] 4.4 替换硬编码间距 (2, 4, 8, 12, 16, 24, 32, 60)
  - [x] 4.5 替换硬编码圆角 (12, 20, 24, 28, 30)
  - [x] 4.6 使用 designSystem.shadows 替换硬编码阴影
  - [x] 4.7 测试所有功能正常（选择、编辑、删除、添加）

## Dev Notes

### 需要重构的文件

| 文件 | 路径 | 复杂度 | 主要功能 |
|------|------|--------|----------|
| ExplainScreen | `src/screens/ExplainScreen.tsx` | 低 | 占位页面，简单重构 |
| PDFPreviewScreen | `src/screens/PDFPreviewScreen.tsx` | 高 | PDF预览，横竖屏适配 |
| PDFListScreen | `src/screens/PDFListScreen.tsx` | 中 | PDF列表管理 |
| ChildListScreen | `src/screens/ChildListScreen.tsx` | 中 | 孩子信息列表 |

### 重构模式（参考 Story 7.3）

```typescript
// ===== 1. 导入设计系统和UI组件 =====
import { designSystem } from '../styles/designSystem';
import { Button, Card, Icon, Typography, Spacer } from '../components/ui';

// ===== 2. 替换硬编码颜色 =====
// Before:
backgroundColor: '#f5f5f5'
color: '#333'
color: '#666'
color: '#999'

// After:
backgroundColor: designSystem.colors.background
color: designSystem.colors.text.primary
color: designSystem.colors.text.secondary
color: designSystem.colors.text.hint

// ===== 3. 替换硬编码字体 =====
// Before:
<Text style={{ fontSize: 24, fontWeight: 'bold' }}>标题</Text>
<Text style={{ fontSize: 16 }}>正文</Text>

// After:
<Typography variant="displaySmall">标题</Typography>
<Typography variant="body">正文</Typography>

// ===== 4. 替换硬编码间距 =====
// Before:
padding: 16
marginTop: 12
marginBottom: 8

// After:
padding: designSystem.spacing.lg
<Spacer size="md" /> // 在 JSX 中
// 或在 StyleSheet 中:
marginTop: designSystem.spacing.md
marginBottom: designSystem.spacing.sm

// ===== 5. 替换硬编码圆角 =====
// Before:
borderRadius: 8
borderRadius: 12

// After:
borderRadius: designSystem.borderRadius.md
borderRadius: designSystem.borderRadius.lg

// ===== 6. 替换 Emoji 图标 =====
// Before:
<Text>📄</Text>
<Text>✓</Text>
<Text>!</Text>

// After:
<Icon name="description" size="md" color={designSystem.colors.text.secondary} />
<Icon name="check" size="xl" color={designSystem.colors.success.main} />
<Icon name="error" size="xl" color={designSystem.colors.error.main} />
```

---

## 详细文件分析

### ExplainScreen.tsx (简单)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| title.color | (默认黑色) | `designSystem.colors.text.primary` |
| subtitle.color | `#666` | `designSystem.colors.text.secondary` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| title.fontSize | 24 | `<Typography variant="displaySmall">` |
| title.fontWeight | 'bold' | Typography 内置 |
| subtitle.fontSize | 16 | `<Typography variant="body">` |

**硬编码间距:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| title.marginBottom | 8 | `<Spacer size="sm" />` |

---

### PDFPreviewScreen.tsx (复杂 - 600行)

**硬编码颜色 (15+ 处):**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| header.backgroundColor | `white` | `designSystem.colors.surface.primary` |
| header.borderBottomColor | `#e0e0e0` | `designSystem.colors.border` |
| headerTitle.color | `#333` | `designSystem.colors.text.primary` |
| headerInfo.color | `#666` | `designSystem.colors.text.secondary` |
| landscapeControls.backgroundColor | `white` | `designSystem.colors.surface.primary` |
| landscapeControls.borderLeftColor | `#e0e0e0` | `designSystem.colors.border` |
| landscapeTitle.color | `#333` | `designSystem.colors.text.primary` |
| landscapeInfo.color | `#666` | `designSystem.colors.text.secondary` |
| buttonDisabled.backgroundColor | `#ccc` | `designSystem.colors.text.disabled` |
| saveButton.backgroundColor | `#2196f3` | `designSystem.colors.primary` |
| cancelButton.backgroundColor | `#f5f5f5` | `designSystem.colors.surface.secondary` |
| cancelButtonText.color | `#666` | `designSystem.colors.text.secondary` |
| successIcon.color | `#4caf50` | `designSystem.colors.success.main` |
| successTitle.color | `#333` | `designSystem.colors.text.primary` |
| successPath.color | `#666` | `designSystem.colors.text.secondary` |
| successFileSize.color | `#999` | `designSystem.colors.text.hint` |
| primaryButton.backgroundColor | `#2196f3` | `designSystem.colors.primary` |
| secondaryButton.backgroundColor | `#f5f5f5` | `designSystem.colors.surface.secondary` |
| secondaryButtonText.color | `#666` | `designSystem.colors.text.secondary` |
| errorIcon.color | `#f44336` | `designSystem.colors.error.main` |
| errorTitle.color | `#333` | `designSystem.colors.text.primary` |
| errorMessage.color | `#666` | `designSystem.colors.text.secondary` |
| retryButton.backgroundColor | `#f44336` | `designSystem.colors.error.main` |
| actionErrorContainer.backgroundColor | `#fff3e0` | `designSystem.colors.warning.light` |
| actionErrorContainer.borderColor | `#ffb74d` | `designSystem.colors.warning.border` |
| actionErrorText.color | `#e65100` | `designSystem.colors.warning.dark` |
| dismissErrorButton.backgroundColor | `#ffb74d` | `designSystem.colors.warning.main` |
| dismissErrorButtonText.color | `#fff` | `designSystem.colors.text.inverse` |
| landscapePdfContainer.backgroundColor | `#333` | `designSystem.colors.surface.inverse` |

**Emoji 图标替换:**
| 当前 | 替换为 |
|------|--------|
| `✓` (successIcon) | `<Icon name="check-circle" size="xl" color={designSystem.colors.success.main} />` |

**圆角替换:**
| 当前值 | 替换为 |
|--------|--------|
| 8 | `designSystem.borderRadius.md` |

---

### PDFListScreen.tsx (中等 - 395行)

**硬编码颜色 (15+ 处):**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| loadingText.color | `#666` | `designSystem.colors.text.secondary` |
| header.backgroundColor | `white` | `designSystem.colors.surface.primary` |
| header.borderBottomColor | `#e0e0e0` | `designSystem.colors.border` |
| headerTitle.color | `#333` | `designSystem.colors.text.primary` |
| headerCount.color | `#666` | `designSystem.colors.text.secondary` |
| itemContainer.backgroundColor | `white` | `designSystem.colors.surface.primary` |
| itemContainer.shadowColor | `#000` | `designSystem.colors.shadow` |
| itemIconContainer.backgroundColor | `#e3f2fd` | `designSystem.colors.info.light` |
| itemName.color | `#333` | `designSystem.colors.text.primary` |
| itemMeta.color | `#999` | `designSystem.colors.text.hint` |
| actionButton.backgroundColor | `#f5f5f5` | `designSystem.colors.surface.secondary` |
| deleteIcon.color | `#f44336` | `designSystem.colors.error.main` |
| emptyTitle.color | `#333` | `designSystem.colors.text.primary` |
| emptyMessage.color | `#999` | `designSystem.colors.text.hint` |
| errorContainer.backgroundColor | `#ffebee` | `designSystem.colors.error.light` |
| errorContainer.borderColor | `#ffcdd2` | `designSystem.colors.error.border` |
| errorText.color | `#c62828` | `designSystem.colors.error.dark` |
| retryButton.backgroundColor | `#c62828` | `designSystem.colors.error.dark` |
| RefreshControl.tintColor | `#2196f3` | `designSystem.colors.primary` |

**Emoji 图标替换:**
| 当前 | 替换为 |
|------|--------|
| `📄` (itemIcon) | `<Icon name="description" size="md" color={designSystem.colors.info.main} />` |
| `↗` (分享按钮) | `<Icon name="share" size="sm" />` |
| `🖨` (打印按钮) | `<Icon name="print" size="sm" />` |
| `🗑` (删除按钮) | `<Icon name="delete" size="sm" color={designSystem.colors.error.main} />` |
| `📁` (emptyIcon) | `<Icon name="folder-open" size="xl" color={designSystem.colors.text.disabled} />` |

**圆角替换:**
| 当前值 | 替换为 |
|--------|--------|
| 8 | `designSystem.borderRadius.md` |
| 12 | `designSystem.borderRadius.lg` |
| 18 | `designSystem.borderRadius.xl` |

---

### ChildListScreen.tsx (中等 - 497行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| loadingText.color | `#666` | `designSystem.colors.text.secondary` |
| header (使用 theme.colors.primary) | 保持 | 保持使用 theme |
| headerTitle.color | `#fff` | `designSystem.colors.text.inverse` |
| headerSubtitle.color | `#fff` | `designSystem.colors.text.inverse` |
| childItem.backgroundColor | `#fff` | `designSystem.colors.surface.primary` |
| childItem.borderColor | `#e0e0e0` | `designSystem.colors.border` |
| childItem.shadowColor | `#000` | `designSystem.colors.shadow` |
| avatarText.color | `#fff` | `designSystem.colors.text.inverse` |
| childName.color | `#333` | `designSystem.colors.text.primary` |
| activeText.color | `#fff` | `designSystem.colors.text.inverse` |
| childGrade.color | `#666` | `designSystem.colors.text.secondary` |
| childBirthday.color | `#999` | `designSystem.colors.text.hint` |
| deleteButtonText.color | `#fff` | `designSystem.colors.text.inverse` |
| emptyStateTitle.color | `#333` | `designSystem.colors.text.primary` |
| emptyStateDescription.color | `#666` | `designSystem.colors.text.secondary` |
| addButtonText.color | `#fff` | `designSystem.colors.text.inverse` |

**注意:** ChildListScreen 使用 react-native-paper 的 `useTheme()`，保持与 Paper 主题的集成，只替换硬编码值。

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| loadingText.fontSize | 16 | Typography variant="body" |
| headerTitle.fontSize | 28 | Typography variant="displaySmall" |
| headerSubtitle.fontSize | 14 | Typography variant="caption" |
| avatarText.fontSize | 24 | Typography variant="headlineSmall" |
| childName.fontSize | 18 | Typography variant="headlineSmall" |
| activeText.fontSize | 12 | Typography variant="caption" |
| childGrade.fontSize | 14 | Typography variant="caption" |
| childBirthday.fontSize | 12 | Typography variant="overline" |
| deleteButtonText.fontSize | 16 | Typography variant="body" |
| emptyStateTitle.fontSize | 20 | Typography variant="headlineMedium" |
| emptyStateDescription.fontSize | 14 | Typography variant="caption" |
| addButtonText.fontSize | 16 | Typography variant="body" |

**硬编码间距:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| header.padding | 24 | designSystem.spacing.xxl |
| header.paddingTop | 60 | designSystem.spacing.xxxl + designSystem.spacing.xxl |
| listContent.padding | 16 | designSystem.spacing.lg |
| childItem.marginBottom | 12 | designSystem.spacing.md |
| childItemContent.padding | 16 | designSystem.spacing.lg |
| avatarContainer.marginRight | 12 | designSystem.spacing.md |
| nameRow.marginBottom | 4 | designSystem.spacing.xs |
| childName.marginRight | 8 | designSystem.spacing.sm |
| activeBadge.paddingHorizontal | 8 | designSystem.spacing.sm |
| activeBadge.paddingVertical | 2 | designSystem.spacing.xs / 2 |
| activeText.marginLeft | 4 | designSystem.spacing.xs |
| childGrade.marginBottom | 2 | designSystem.spacing.xs / 2 |
| editButton.padding | 8 | designSystem.spacing.sm |
| editButton.marginLeft | 8 | designSystem.spacing.sm |
| deleteButton.padding | 16 | designSystem.spacing.lg |
| emptyState.padding | 32 | designSystem.spacing.xxxl |
| emptyStateTitle.marginTop | 16 | designSystem.spacing.lg |
| emptyStateTitle.marginBottom | 8 | designSystem.spacing.sm |
| emptyStateDescription.marginBottom | 24 | designSystem.spacing.xxl |
| addButton.paddingHorizontal | 24 | designSystem.spacing.xxl |
| addButton.paddingVertical | 12 | designSystem.spacing.md |
| floatingActionButton.right/bottom | 24 | designSystem.spacing.xxl |

**硬编码圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| header.borderBottomLeftRadius | 20 | designSystem.borderRadius.xl |
| header.borderBottomRightRadius | 20 | designSystem.borderRadius.xl |
| childItem.borderRadius | 12 | designSystem.borderRadius.lg |
| avatarContainer.borderRadius | 30 | designSystem.borderRadius.full |
| activeBadge.borderRadius | 12 | designSystem.borderRadius.lg |
| addButton.borderRadius | 24 | designSystem.borderRadius.full |
| floatingActionButton.borderRadius | 28 | designSystem.borderRadius.full |

---

### 依赖关系

- **必须先完成 Story 7.1** ✅ - 需要 designSystem.ts
- **必须先完成 Story 7.2** ✅ - 需要 UI 组件库
- **建议完成 Story 7.3** ✅ - 参考核心页面重构模式

### 技术要求

1. **保持功能完整** - 不改变任何业务逻辑
2. **保持无障碍** - 保留所有 accessibilityLabel 和 testID
3. **保持测试兼容** - 不改变测试相关属性
4. **保持响应式** - 保留 tablet.ts 中的 getFontSize 和 getScaledSpacing 调用逻辑（仅替换基础值）
5. **保持横竖屏适配** - PDFPreviewScreen 的横竖屏布局不变

### 重构策略

**推荐顺序:**
1. **ExplainScreen** (最简单) - 热身，验证重构流程
2. **PDFListScreen** (中等) - 练习复杂列表页面
3. **ChildListScreen** (中等) - 练习与 Paper 主题集成
4. **PDFPreviewScreen** (最复杂) - 最后处理，横竖屏适配

**每个文件的重构步骤:**
1. 添加导入语句
2. 逐个替换样式中的硬编码值
3. 在 JSX 中替换组件（Typography, Icon, Spacer）
4. 验证 TypeScript 编译
5. 运行测试确保功能正常

### Anti-Patterns to Avoid

- ❌ 不要修改页面导航逻辑
- ❌ 不要修改数据获取逻辑
- ❌ 不要删除错误处理代码
- ❌ 不要修改 props 接口
- ❌ 不要删除 accessibilityLabel 或 testID
- ❌ 不要移除横竖屏适配逻辑
- ❌ 不要破坏 react-native-paper 主题集成 (ChildListScreen)

### References

- [Source: src/screens/ExplainScreen.tsx] - 已重构
- [Source: src/screens/PDFPreviewScreen.tsx] - 已重构
- [Source: src/screens/PDFListScreen.tsx] - 已重构
- [Source: src/screens/ChildListScreen.tsx] - 已重构
- [Source: src/styles/designSystem.ts] - 设计系统入口
- [Source: src/components/ui/index.ts] - UI 组件库入口
- [Source: _bmad-output/implementation-artifacts/7-3-home-camera-redesign.md] - 参考重构模式

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (glm-5)

### Debugging Notes
- TypeScript 编译通过，所有4个屏幕文件重构完成
- 保持了所有现有功能不变
- 保留了横竖屏适配逻辑
- 保持了 react-native-paper 主题集成

### Completion Notes List
- ✅ ExplainScreen 重构完成
  - 导入 designSystem 和 UI 组件 (Typography, Spacer)
  - 替换所有硬编码颜色为 designSystem.colors
  - 替换所有硬编码字体为 Typography 组件
  - 替换所有硬编码间距为 Spacer 组件

- ✅ PDFListScreen 重构完成
  - 导入 designSystem 和 UI 组件 (Typography, Icon, Spacer)
  - 替换所有硬编码颜色为 designSystem.colors
  - 替换所有 Text 为 Typography 组件
  - 替换 emoji 图标 (📄, ↗, 🖨, 🗑, 📁) 为 Icon 组件
  - 替换硬编码圆角为 designSystem.borderRadius
  - 替换硬编码阴影为 designSystem.shadows

- ✅ ChildListScreen 重构完成
  - 导入 designSystem 和 UI 组件 (Typography, Icon, Spacer)
  - 替换所有硬编码颜色为 designSystem.colors
  - 替换所有 Text 为 Typography 组件
  - 替换硬编码间距为 designSystem.spacing
  - 替换硬编码圆角为 designSystem.borderRadius
  - 替换硬编码阴影为 designSystem.shadows
  - 保持与 react-native-paper 主题的集成

- ✅ PDFPreviewScreen 重构完成
  - 导入 designSystem 和 UI 组件 (Typography, Icon, Spacer, Button)
  - 替换所有硬编码颜色为 designSystem.colors
  - 替换 emoji 图标 (✓, !) 为 Icon 组件 (check-circle, error)
  - 替换硬编码圆角为 designSystem.borderRadius
  - 保持横竖屏适配逻辑不变

### File List

**修改文件：**
- MathLearningApp/src/screens/ExplainScreen.tsx
- MathLearningApp/src/screens/PDFPreviewScreen.tsx
- MathLearningApp/src/screens/PDFListScreen.tsx
- MathLearningApp/src/screens/ChildListScreen.tsx

## Change Log

- 2026-03-31: Story 7.4 上下文文件创建 - 准备开发
- 2026-03-31: Task 1 ExplainScreen 重构完成
- 2026-03-31: Task 3 PDFListScreen 重构完成
- 2026-03-31: Task 4 ChildListScreen 重构完成
- 2026-03-31: Task 2 PDFPreviewScreen 重构完成
- 2026-03-31: 所有任务完成，Story 状态更新为 review
