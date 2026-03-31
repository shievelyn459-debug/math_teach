# Story 7.6: 更新现有组件

Status: done

## Story

As a **开发人员**,
I want **更新现有组件使用新的设计系统**,
so that **所有组件库具有一致的样式，便于维护**.

## Acceptance Criteria

1. **AC1: QuestionTypeSelector 重构** - 使用设计系统，移除硬编码值
2. **AC2: DifficultySelector 重构** - 使用设计系统，移除硬编码值
3. **AC3: KnowledgePointTag 重构** - 使用设计系统，移除硬编码值
4. **AC4: FormatSelector 重构** - 使用设计系统，移除硬编码值，替换 Emoji
5. **AC5: QuantitySelector 重构** - 使用设计系统，移除硬编码值
6. **AC6: FilenameDialog 重构** - 使用设计系统，移除硬编码值
7. **AC7: PDFActionButtons 重构** - 使用 Button 组件，移除硬编码值
8. **AC8: ProfileField 重构** - 使用设计系统，移除硬编码值
9. **AC9: FormInput 重构** - 使用设计系统，移除硬编码值
10. **AC10: RecentPracticeCard 重构** - 使用 Card 组件，移除硬编码值
11. **AC11: 功能不变** - 重构后所有组件功能正常
12. **AC12: Emoji替换** - 将所有 Emoji 图标替换为 MaterialIcons

## Tasks / Subtasks

- [x] Task 1: 选择器组件重构 (AC: #1, #2, #4, #5, #11, #12)
  - [x] 1.1 QuestionTypeSelector.tsx 重构 - Modal 选择器
  - [x] 1.2 DifficultySelector.tsx 重构 - Modal 选择器
  - [x] 1.3 FormatSelector.tsx 重构 - 格式切换器 + Emoji 替换
  - [x] 1.4 QuantitySelector.tsx 重构 - Modal 选择器

- [x] Task 2: 标签和字段组件重构 (AC: #3, #8, #9, #11)
  - [x] 2.1 KnowledgePointTag.tsx 重构 - 置信度标签
  - [x] 2.2 ProfileField.tsx 重构 - 个人资料字段
  - [x] 2.3 FormInput.tsx 重构 - 表单输入组件

- [x] Task 3: 对话框和按钮组件重构 (AC: #6, #7, #11)
  - [x] 3.1 FilenameDialog.tsx 重构 - 文件名对话框
  - [x] 3.2 PDFActionButtons.tsx 重构 - PDF 操作按钮

- [x] Task 4: 卡片组件重构 (AC: #10, #11)
  - [x] 4.1 RecentPracticeCard.tsx 重构 - 最近练习卡片

## Dev Notes

### 需要重构的组件列表

| 组件 | 路径 | 优先级 | 行数 | Emoji |
|------|------|--------|------|-------|
| QuestionTypeSelector | `src/components/QuestionTypeSelector.tsx` | P1 | 142 | - |
| DifficultySelector | `src/components/DifficultySelector.tsx` | P1 | 276 | ✓ |
| KnowledgePointTag | `src/components/KnowledgePointTag.tsx` | P1 | 147 | - |
| FormatSelector | `src/components/FormatSelector.tsx` | P1 | 212 | 📝🎬🎥 |
| QuantitySelector | `src/components/QuantitySelector.tsx` | P1 | 214 | ✓ |
| FilenameDialog | `src/components/FilenameDialog.tsx` | P1 | 232 | - |
| PDFActionButtons | `src/components/PDFActionButtons.tsx` | P1 | 170 | ↗🖨📄→ |
| ProfileField | `src/components/ProfileField.tsx` | P1 | 113 | - |
| FormInput | `src/components/FormInput.tsx` | P1 | 270 | - |
| RecentPracticeCard | `src/components/RecentPracticeCard.tsx` | P1 | 195 | - |

---

## 详细组件分析

### 1. QuestionTypeSelector.tsx (142行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| modalContainer.backgroundColor | `rgba(0, 0, 0, 0.5)` | `designSystem.colors.overlay` |
| modalContent.backgroundColor | `white` | `designSystem.colors.surface.primary` |
| modalContent.shadowColor | `#000` | `designSystem.colors.shadow` |
| modalTitle.color | `#333` | `designSystem.colors.text.primary` |
| modalSubtitle.color | `#666` | `designSystem.colors.text.secondary` |
| typeOption.backgroundColor | `#f8f9fa` | `designSystem.colors.surface.secondary` |
| typeOption.borderColor | `#e9ecef` | `designSystem.colors.border` |
| typeOptionSelected.backgroundColor | `#2196f3` | `designSystem.colors.primary` |
| typeOptionSelected.borderColor | `#1976d2` | `designSystem.colors.primaryDark` |
| typeLabel.color | `#333` | `designSystem.colors.text.primary` |
| typeDescription.color | `#666` | `designSystem.colors.text.secondary` |
| cancelButton.backgroundColor | `#e0e0e0` | `designSystem.colors.surface.tertiary` |
| cancelButtonText.color | `#666` | `designSystem.colors.text.secondary` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| modalTitle.fontSize | 20 | Typography variant="headlineMedium" |
| modalSubtitle.fontSize | 14 | Typography variant="caption" |
| typeLabel.fontSize | 18 | Typography variant="headlineSmall" |
| typeDescription.fontSize | 14 | Typography variant="caption" |
| cancelButtonText.fontSize | 16 | Typography variant="body" |

**硬编码间距/圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| modalContent.borderRadius | 12 | `designSystem.borderRadius.lg` |
| modalContent.padding | 24 | `designSystem.spacing.xxl` |
| modalTitle.marginBottom | 12 | `designSystem.spacing.md` |
| modalSubtitle.marginBottom | 20 | `designSystem.spacing.xl` |
| typeOption.padding | 16 | `designSystem.spacing.lg` |
| typeOption.borderRadius | 8 | `designSystem.borderRadius.md` |
| typeOption.marginVertical | 6 | `designSystem.spacing.sm` |
| typeLabel.marginBottom | 4 | `designSystem.spacing.xs` |
| cancelButton.padding | 14 | `designSystem.spacing.md` |
| cancelButton.borderRadius | 8 | `designSystem.borderRadius.md` |
| cancelButton.marginTop | 16 | `designSystem.spacing.lg` |

---

### 2. DifficultySelector.tsx (276行)

**硬编码颜色 (与 QuestionTypeSelector 类似 + 以下):**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| recommendationBadge.backgroundColor | `#e3f2fd` | `designSystem.colors.info.light` |
| recommendationBadge.borderColor | `#2196f3` | `designSystem.colors.info.main` |
| recommendationText.color | `#1976d2` | `designSystem.colors.info.dark` |
| loadingText.color | `#666` | `designSystem.colors.text.secondary` |
| difficultyOption.backgroundColor | `#f8f9fa` | `designSystem.colors.surface.secondary` |
| difficultyOption.borderColor | `#e9ecef` | `designSystem.colors.border` |
| difficultyOptionSelected.backgroundColor | `#2196f3` | `designSystem.colors.primary` |
| difficultyOptionSelected.borderColor | `#1976d2` | `designSystem.colors.primaryDark` |
| recommendationTag.backgroundColor | `#4caf50` | `designSystem.colors.success.main` |
| difficultyLabel.color | `#333` | `designSystem.colors.text.primary` |
| difficultyLabelSelected.color | `white` | `designSystem.colors.text.inverse` |
| selectedCheck.color | `white` | `designSystem.colors.text.inverse` |
| difficultyDescription.color | `#555` | `designSystem.colors.text.secondary` |
| difficultyDescriptionSelected.color | `white` | `designSystem.colors.text.inverse` |
| difficultyDetail.color | `#777` | `designSystem.colors.text.hint` |
| difficultyDetailSelected.color | `rgba(255, 255, 255, 0.9)` | `designSystem.colors.text.inverse` (opacity 0.9) |

**Emoji 替换:**
| 当前 | 替换为 |
|------|--------|
| `✓` (selectedCheck) | `<Icon name="check" size="sm" color={designSystem.colors.text.inverse} />` |

---

### 3. FormatSelector.tsx (212行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| selectedButton.backgroundColor | `#2196f3` | `designSystem.colors.primary` |
| formatLabel.color | `#333` | `designSystem.colors.text.primary` |
| selectedLabel.color | `#fff` | `designSystem.colors.text.inverse` |
| checkmark.color | `#fff` | `designSystem.colors.text.inverse` |
| disabledText.color | `#999` | `designSystem.colors.text.disabled` |
| comingSoonBadge.backgroundColor | `#ff9800` | `designSystem.colors.warning.main` |
| comingSoonText.color | `#fff` | `designSystem.colors.text.inverse` |

**Emoji 替换:**
| 当前 | 替换为 |
|------|--------|
| `📝` (TEXT icon) | `<Icon name="description" size="sm" />` |
| `🎬` (ANIMATION icon) | `<Icon name="play-circle" size="sm" />` |
| `🎥` (VIDEO icon) | `<Icon name="video-library" size="sm" />` |
| `✓` (checkmark) | `<Icon name="check" size="sm" color={designSystem.colors.text.inverse} />` |

---

### 4. QuantitySelector.tsx (214行)

**硬编码颜色 (与 DifficultySelector 类似):**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| modalContainer.backgroundColor | `rgba(0, 0, 0, 0.5)` | `designSystem.colors.overlay` |
| modalContent.backgroundColor | `white` | `designSystem.colors.surface.primary` |
| modalTitle.color | `#333` | `designSystem.colors.text.primary` |
| modalSubtitle.color | `#666` | `designSystem.colors.text.secondary` |
| quantityOption.backgroundColor | `#f8f9fa` | `designSystem.colors.surface.secondary` |
| quantityOption.borderColor | `#e9ecef` | `designSystem.colors.border` |
| quantityOptionSelected.backgroundColor | `#2196f3` | `designSystem.colors.primary` |
| quantityOptionSelected.borderColor | `#1976d2` | `designSystem.colors.primaryDark` |
| recommendationTag.backgroundColor | `#4caf50` | `designSystem.colors.success.main` |
| quantityLabel.color | `#333` | `designSystem.colors.text.primary` |
| quantityLabelSelected.color | `white` | `designSystem.colors.text.inverse` |
| selectedCheck.color | `white` | `designSystem.colors.text.inverse` |
| quantityDescription.color | `#666` | `designSystem.colors.text.secondary` |
| quantityDescriptionSelected.color | `rgba(255, 255, 255, 0.9)` | `designSystem.colors.text.inverse` (opacity 0.9) |
| cancelButton.backgroundColor | `#e0e0e0` | `designSystem.colors.surface.tertiary` |
| cancelButtonText.color | `#666` | `designSystem.colors.text.secondary` |

**Emoji 替换:**
| 当前 | 替换为 |
|------|--------|
| `✓` (selectedCheck) | `<Icon name="check" size="sm" color={designSystem.colors.text.inverse} />` |

---

### 5. FilenameDialog.tsx (232行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| overlay.backgroundColor | `rgba(0, 0, 0, 0.5)` | `designSystem.colors.overlay` |
| dialog.backgroundColor | `white` | `designSystem.colors.surface.primary` |
| dialog.shadowColor | `#000` | `designSystem.colors.shadow` |
| title.color | `#333` | `designSystem.colors.text.primary` |
| inputContainer.borderColor | `#ddd` | `designSystem.colors.border` |
| inputContainer.backgroundColor | `#f9f9f9` | `designSystem.colors.surface.secondary` |
| input.color | `#333` | `designSystem.colors.text.primary` |
| inputError.borderColor | `#f44336` | `designSystem.colors.error.main` |
| extension.color | `#666` | `designSystem.colors.text.secondary` |
| errorText.color | `#f44336` | `designSystem.colors.error.main` |
| cancelButton.backgroundColor | `#f5f5f5` | `designSystem.colors.surface.secondary` |
| cancelButtonText.color | `#666` | `designSystem.colors.text.secondary` |
| confirmButton.backgroundColor | `#2196f3` | `designSystem.colors.primary` |
| confirmButtonText.color | `white` | `designSystem.colors.text.inverse` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| title.fontSize | 18 | Typography variant="headlineSmall" |
| input.fontSize | 16 | Typography variant="body" |
| extension.fontSize | 16 | Typography variant="body" |
| errorText.fontSize | 12 | Typography variant="overline" |
| cancelButtonText.fontSize | 16 | Typography variant="body" |
| confirmButtonText.fontSize | 16 | Typography variant="body" |

**硬编码间距/圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| dialog.borderRadius | 12 | `designSystem.borderRadius.lg` |
| dialog.padding | 20 | `designSystem.spacing.xl` |
| title.marginBottom | 16 | `designSystem.spacing.lg` |
| inputContainer.borderRadius | 8 | `designSystem.borderRadius.md` |
| inputContainer.paddingHorizontal | 12 | `designSystem.spacing.md` |
| input.height | 44 | `designSystem.spacing.xxxl + designSystem.spacing.xl` |
| extension.marginLeft | 4 | `designSystem.spacing.xs` |
| errorText.marginTop | 8 | `designSystem.spacing.sm` |
| buttonContainer.marginTop | 20 | `designSystem.spacing.xl` |
| buttonContainer.gap | 12 | `designSystem.spacing.md` |
| button.paddingHorizontal | 20 | `designSystem.spacing.xl` |
| button.paddingVertical | 10 | `designSystem.spacing.md` - 2 |
| button.borderRadius | 6 | `designSystem.borderRadius.sm` |
| button.minWidth | 80 | `designSystem.spacing.xxxl * 2.5` |

---

### 6. PDFActionButtons.tsx (170行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| buttonIcon.color | `#fff` | `designSystem.colors.text.inverse` |
| buttonLabel.color | `#fff` | `designSystem.colors.text.inverse` |
| shareButton.backgroundColor | `#4CAF50` | `designSystem.colors.success.main` |
| printButton.backgroundColor | `#2196F3` | `designSystem.colors.primary` |
| openButton.backgroundColor | `#FF9800` | `designSystem.colors.warning.main` |
| viewAllButton.backgroundColor | `#f5f5f5` | `designSystem.colors.surface.secondary` |
| viewAllButton.borderColor | `#e0e0e0` | `designSystem.colors.border` |
| viewAllButtonText.color | `#666` | `designSystem.colors.text.secondary` |
| viewAllButtonIcon.color | `#2196F3` | `designSystem.colors.primary` |

**Emoji 替换:**
| 当前 | 替换为 |
|------|--------|
| `↗` (share icon) | `<Icon name="share" size="sm" color={designSystem.colors.text.inverse} />` |
| `🖨` (print icon) | `<Icon name="print" size="sm" color={designSystem.colors.text.inverse} />` |
| `📄` (open icon) | `<Icon name="description" size="sm" color={designSystem.colors.text.inverse} />` |
| `→` (viewAll icon) | `<Icon name="chevron-right" size="sm" color={designSystem.colors.primary} />` |

**重构建议:** 使用 UI Button 组件替换 TouchableOpacity

---

### 7. ProfileField.tsx (113行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| fieldContainer.backgroundColor | `#fff` | `designSystem.colors.surface.primary` |
| value.color (有值) | `#333` | `designSystem.colors.text.primary` |
| value.color (无值) | `#999` | `designSystem.colors.text.hint` |
| shadowColor | `#000` | `designSystem.colors.shadow` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| label.fontSize | 12 | Typography variant="overline" |
| value.fontSize | 16 | Typography variant="body" |
| editText.fontSize | 14 | Typography variant="caption" |

**硬编码间距/圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| fieldContainer.padding | 16 | `designSystem.spacing.lg` |
| fieldContainer.borderRadius | 12 | `designSystem.borderRadius.lg` |
| fieldContainer.marginBottom | 12 | `designSystem.spacing.md` |
| label.marginBottom | 8 | `designSystem.spacing.sm` |

**注意:** 使用 `useTheme()` 获取 Paper 主题，保持与 Paper 的集成

---

### 8. FormInput.tsx (270行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| input.backgroundColor | `#fff` | `designSystem.colors.surface.primary` |
| input.borderColor (default) | `#ddd` | `designSystem.colors.border` |
| inputError.borderColor | `#d32f2f` | `designSystem.colors.error.main` |
| inputDisabled.backgroundColor | `#f5f5f5` | `designSystem.colors.surface.secondary` |
| inputDisabled.color | `#999` | `designSystem.colors.text.disabled` |
| placeholderTextColor | `#999` | `designSystem.colors.text.hint` |
| success borderColor | `#4caf50` | `designSystem.colors.success.main` |
| errorContainer.backgroundColor | `#ffebee` | `designSystem.colors.error.light` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| label.fontSize | 14 | Typography variant="caption" |
| input.fontSize | 16 | Typography variant="body" |
| externalStatusIcon.fontSize | 16 | Typography variant="body" |
| errorText.fontSize | 12 | Typography variant="overline" |
| clearErrorText.fontSize | 14 | Typography variant="caption" |
| toggleButtonText.fontSize | 20 | Typography variant="headlineSmall" |

**硬编码间距/圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.marginBottom | 16 | `designSystem.spacing.lg` |
| label.marginBottom | 8 | `designSystem.spacing.sm` |
| input.borderRadius | 8 | `designSystem.borderRadius.md` |
| input.paddingHorizontal | 12 | `designSystem.spacing.md` |
| input.paddingVertical | 12 | `designSystem.spacing.md` |
| input.minHeight | 46 | `designSystem.spacing.xxxl + designSystem.spacing.xl + 2` |
| errorContainer.marginTop | 4 | `designSystem.spacing.xs` |
| errorContainer.borderRadius | 4 | `designSystem.borderRadius.sm` |
| errorContainer.paddingHorizontal | 8 | `designSystem.spacing.sm` |
| errorContainer.paddingVertical | 6 | `designSystem.spacing.sm` - 2 |

**注意:** 使用 `useTheme()` 获取 Paper 主题，保持与 Paper 的集成

---

### 9. RecentPracticeCard.tsx (195行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| typeText.color | `#333` | `designSystem.colors.text.primary` |
| countText.color | `#757575` | `designSystem.colors.text.secondary` |
| timeText.color | `#757575` | `designSystem.colors.text.secondary` |
| chevron-right color | `#9e9e9e` | `designSystem.colors.text.hint` |
| getDifficultyColor(EASY) | `#4caf50` | `designSystem.colors.success.main` |
| getDifficultyColor(MEDIUM) | `#ff9800` | `designSystem.colors.warning.main` |
| getDifficultyColor(HARD) | `#f44336` | `designSystem.colors.error.main` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| typeText.fontSize | 16 | Typography variant="body" |
| countText.fontSize | 12 | Typography variant="overline" |
| timeText.fontSize | 12 | Typography variant="overline" |
| difficultyText.fontSize | 11 | Typography variant="overline" |

**硬编码间距/圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| card.marginHorizontal | 16 | `designSystem.spacing.lg` |
| card.marginVertical | 6 | `designSystem.spacing.sm` |
| card.borderRadius | 12 | `designSystem.borderRadius.lg` |
| cardContent.paddingVertical | 12 | `designSystem.spacing.md` |
| cardContent.paddingHorizontal | 16 | `designSystem.spacing.lg` |
| icon.marginRight | 12 | `designSystem.spacing.md` |
| countText.marginTop | 2 | `designSystem.spacing.xs / 2` |
| middleSection.marginRight | 8 | `designSystem.spacing.sm` |
| timeText.marginBottom | 4 | `designSystem.spacing.xs` |
| difficultyBadge.paddingHorizontal | 8 | `designSystem.spacing.sm` |
| difficultyBadge.paddingVertical | 2 | `designSystem.spacing.xs / 2` |
| difficultyBadge.borderRadius | 12 | `designSystem.borderRadius.lg` |

**注意:** 使用 Paper Card 组件，保持与 Paper 的集成

---

### 重构模式示例

**选择器组件（Modal 类型）:**
```typescript
// Before
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
  },
  typeOptionSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#1976d2',
  },
});

// After
import { View, Modal, StyleSheet } from 'react-native';
import { designSystem } from '../styles/designSystem';
import { Typography, Button, Icon, Spacer, Card } from '../components/ui';

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: designSystem.colors.overlay,
  },
  modalContent: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.xxl,
  },
  typeOptionSelected: {
    backgroundColor: designSystem.colors.primary,
    borderColor: designSystem.colors.primaryDark,
  },
});

// JSX 中使用 Typography 和 Icon
<Typography variant="headlineMedium" color={designSystem.colors.text.primary}>
  手动选择题目类型
</Typography>
<Icon name="check" size="sm" color={designSystem.colors.text.inverse} />
```

---

### 依赖关系

- **必须先完成 Story 7.1** ✅ - 需要 designSystem.ts
- **必须先完成 Story 7.2** ✅ - 需要 UI 组件库（Button, Card, Icon, Typography, Spacer）
- **建议最后执行** - 在所有页面重构完成后

### 技术要求

1. **保持组件接口** - 不改变 props 定义
2. **保持测试兼容** - 不改变 testID
3. **保持无障碍** - 保留 accessibilityLabel
4. **保持 Paper 集成** - FormInput, ProfileField, RecentPracticeCard 使用 Paper 组件

### 重构策略

**推荐顺序（按复杂度）:**
1. **ProfileField** (简单) - 最小改动
2. **PDFActionButtons** (简单) - 替换为 UI Button
3. **KnowledgePointTag** (简单) - 颜色和间距
4. **FormInput** (中等) - Paper 集成
5. **RecentPracticeCard** (中等) - Paper Card 集成
6. **FilenameDialog** (中等) - Modal + Input
7. **QuestionTypeSelector** (中等) - Modal 选择器
8. **QuantitySelector** (中等) - Modal 选择器
9. **FormatSelector** (中等) - Emoji 替换 + 格式切换
10. **DifficultySelector** (复杂) - Modal 选择器 + 推荐逻辑

### Anti-Patterns to Avoid

- ❌ 不要改变组件的 props 接口
- ❌ 不要删除现有的回调函数
- ❌ 不要修改组件的业务逻辑
- ❌ 不要跳过测试验证
- ❌ 不要删除 testID 或 accessibilityLabel
- ❌ 不要破坏 react-native-paper 主题集成
- ❌ 不要在 JSX 中硬编码样式值

### References

- [Source: src/components/QuestionTypeSelector.tsx] - 待重构
- [Source: src/components/DifficultySelector.tsx] - 待重构
- [Source: src/components/KnowledgePointTag.tsx] - 待重构
- [Source: src/components/FormatSelector.tsx] - 待重构
- [Source: src/components/QuantitySelector.tsx] - 待重构
- [Source: src/components/FilenameDialog.tsx] - 待重构
- [Source: src/components/PDFActionButtons.tsx] - 待重构
- [Source: src/components/ProfileField.tsx] - 待重构
- [Source: src/components/FormInput.tsx] - 待重构
- [Source: src/components/RecentPracticeCard.tsx] - 待重构
- [Source: src/styles/designSystem.ts] - 设计系统入口
- [Source: src/components/ui/index.ts] - UI 组件库入口

## Dev Agent Record

### Agent Model Used
{{agent_model_name}}

### Debugging Notes
<!-- 开发过程中遇到的问题和解决方案 -->

### Completion Notes List
<!-- 完成时的备注 -->

### File List

**修改文件：**
- MathLearningApp/src/components/QuestionTypeSelector.tsx
- MathLearningApp/src/components/DifficultySelector.tsx
- MathLearningApp/src/components/KnowledgePointTag.tsx
- MathLearningApp/src/components/FormatSelector.tsx
- MathLearningApp/src/components/QuantitySelector.tsx
- MathLearningApp/src/components/FilenameDialog.tsx
- MathLearningApp/src/components/PDFActionButtons.tsx
- MathLearningApp/src/components/ProfileField.tsx
- MathLearningApp/src/components/FormInput.tsx
- MathLearningApp/src/components/RecentPracticeCard.tsx

## Change Log

- 2026-03-31: Story 7.6 上下文文件创建 - 准备开发
