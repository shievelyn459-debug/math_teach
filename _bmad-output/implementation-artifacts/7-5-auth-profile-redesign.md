# Story 7.5: 重构用户管理页面 (Phase 3)

Status: done

## Story

As a **开发人员**,
I want **重构用户管理页面（LoginScreen, RegisterScreen, ProfileScreen, EditProfileScreen, QuestionListScreen）使用新的设计系统**,
so that **用户认证和个人中心页面具有一致的UI风格**.

## Acceptance Criteria

1. **AC1: LoginScreen 重构** - 移除所有硬编码颜色、字体、间距值，使用设计系统和UI组件
2. **AC2: RegisterScreen 重构** - 移除所有硬编码值，使用设计系统和UI组件
3. **AC3: ProfileScreen 重构** - 移除所有硬编码值，使用设计系统和UI组件
4. **AC4: EditProfileScreen 重构** - 移除所有硬编码值，使用设计系统和UI组件
5. **AC5: QuestionListScreen 重构** - 移除所有硬编码值，使用设计系统和UI组件
6. **AC6: 功能不变** - 重构后所有功能保持正常工作
7. **AC7: 样式一致** - 所有页面视觉效果统一
8. **AC8: Paper主题集成** - 保持与 react-native-paper 主题的兼容性
9. **AC9: Emoji替换** - 将 💡 emoji 替换为 MaterialIcons

## Tasks / Subtasks

- [ ] Task 1: LoginScreen 重构 (AC: #1, #6, #7, #8)
  - [ ] 1.1 导入 designSystem 和 UI 组件
  - [ ] 1.2 替换硬编码颜色 (`#f5f5f5`, `#fff`, `#333`, `#666`, `#ffebee`, `#c62828`, `#fff3e0`, `#ffe0b2`, `#e65100`, `#555`)
  - [ ] 1.3 替换硬编码字体 (28, 18, 16, 14, 13, 12)
  - [ ] 1.4 替换硬编码间距 (80, 32, 24, 16, 12, 8, 4)
  - [ ] 1.5 替换硬编码圆角 (20, 12, 8)
  - [ ] 1.6 替换 💡 emoji 为 Icon 组件
  - [ ] 1.7 使用 Typography 组件替换 Text
  - [ ] 1.8 测试登录流程正常

- [ ] Task 2: RegisterScreen 重构 (AC: #2, #6, #7, #8)
  - [ ] 2.1 导入 designSystem 和 UI 组件
  - [ ] 2.2 替换硬编码颜色 (同 LoginScreen + `#e3f2fd`, `#1976d2`)
  - [ ] 2.3 替换硬编码字体 (28, 18, 16, 14, 13)
  - [ ] 2.4 替换硬编码间距 (60, 24, 16, 12, 8, 4)
  - [ ] 2.5 替换硬编码圆角 (20, 12, 8)
  - [ ] 2.6 替换 💡 emoji 为 Icon 组件
  - [ ] 2.7 测试注册流程正常

- [ ] Task 3: ProfileScreen 重构 (AC: #3, #6, #7, #8)
  - [ ] 3.1 导入 designSystem 和 UI 组件
  - [ ] 3.2 替换硬编码颜色 (`#f5f5f5`, `#fff`, `#333`, `#666`, `#999`, `#007bff`, `#ffebee`, `#c62828`)
  - [ ] 3.3 替换硬编码字体 (32, 24, 20, 16, 14, 12)
  - [ ] 3.4 替换硬编码间距 (80, 60, 24, 16, 12, 8, 4)
  - [ ] 3.5 替换硬编码圆角 (40, 20, 12)
  - [ ] 3.6 使用 Card 组件替换 menuItem 样式
  - [ ] 3.7 测试个人中心功能正常

- [ ] Task 4: EditProfileScreen 重构 (AC: #4, #6, #7, #8)
  - [ ] 4.1 导入 designSystem 和 UI 组件
  - [ ] 4.2 替换硬编码颜色 (`#f5f5f5`, `#fff`, `#666`, `#ff9800`)
  - [ ] 4.3 替换硬编码字体 (24, 14, 12)
  - [ ] 4.4 替换硬编码间距 (60, 24, 16, 12, 8, 4)
  - [ ] 4.5 替换硬编码圆角 (20)
  - [ ] 4.6 测试编辑功能正常

- [ ] Task 5: QuestionListScreen 重构 (AC: #5, #6, #7)
  - [ ] 5.1 导入 designSystem 和 UI 组件
  - [ ] 5.2 替换硬编码颜色 (`#f5f5f5`, `#333`, `#666`)
  - [ ] 5.3 替换硬编码字体 (24, 16)
  - [ ] 5.4 替换硬编码间距 (8)
  - [ ] 5.5 使用 Typography 组件
  - [ ] 5.6 测试页面显示正常

## Dev Notes

### 需要重构的文件

| 文件 | 路径 | 复杂度 | 主要功能 |
|------|------|--------|----------|
| LoginScreen | `src/screens/LoginScreen.tsx` | 高 | 用户登录，Paper组件集成 |
| RegisterScreen | `src/screens/RegisterScreen.tsx` | 高 | 用户注册，Paper组件集成 |
| ProfileScreen | `src/screens/ProfileScreen.tsx` | 中 | 个人中心，Paper主题 |
| EditProfileScreen | `src/screens/EditProfileScreen.tsx` | 中 | 编辑资料，Paper主题 |
| QuestionListScreen | `src/screens/QuestionListScreen.tsx` | 低 | 占位页面 |

### 重构模式（参考 Story 7.3 和 7.4）

```typescript
// ===== 1. 导入设计系统和UI组件 =====
import { designSystem } from '../styles/designSystem';
import { Button, Card, Icon, Typography, Spacer } from '../components/ui';

// ===== 2. 保持 Paper 主题集成 =====
// LoginScreen 和 RegisterScreen 使用 react-native-paper 组件
// 保持 useTheme() 钩子，只替换硬编码值
import { Button, Card, Checkbox, useTheme } from 'react-native-paper';
const theme = useTheme();

// Paper 组件使用 theme.colors，硬编码值使用 designSystem
// Before: backgroundColor: '#ffebee'
// After: backgroundColor: designSystem.colors.error.light

// ===== 3. 替换 Emoji 图标 =====
// Before:
<Text style={styles.tipsTitle}>💡 温馨提示</Text>

// After:
<View style={styles.tipsTitle}>
  <Icon name="lightbulb" size="sm" color={designSystem.colors.warning.main} />
  <Typography variant="headlineSmall" color={designSystem.colors.warning.dark}>温馨提示</Typography>
</View>

// ===== 4. 使用 Typography 组件 =====
// Before:
<Text style={styles.headerTitle}>欢迎回来</Text>

// After:
<Typography variant="displaySmall" color={designSystem.colors.text.inverse}>欢迎回来</Typography>
```

---

## 详细文件分析

### LoginScreen.tsx (复杂 - 432行)

**硬编码颜色 (15+ 处):**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| headerTitle.color | `#fff` | `designSystem.colors.text.inverse` |
| headerSubtitle.color | `#fff` | `designSystem.colors.text.inverse` |
| cardTitle.color | `#333` | `designSystem.colors.text.primary` |
| errorBox.backgroundColor | `#ffebee` | `designSystem.colors.error.light` |
| errorBoxText.color | `#c62828` | `designSystem.colors.error.dark` |
| checkboxText.color | `#333` | `designSystem.colors.text.primary` |
| rememberMeHint.color | `#666` | `designSystem.colors.text.secondary` |
| registerLinkText.color | `#666` | `designSystem.colors.text.secondary` |
| tipsBox.backgroundColor | `#fff3e0` | `designSystem.colors.warning.light` |
| tipsBox.borderColor | `#ffe0b2` | `designSystem.colors.warning.border` |
| tipsTitle.color | `#e65100` | `designSystem.colors.warning.dark` |
| tipsText.color | `#555` | `designSystem.colors.text.secondary` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| headerTitle.fontSize | 28 | Typography variant="displaySmall" |
| headerTitle.fontWeight | 'bold' | Typography 内置 |
| headerSubtitle.fontSize | 14 | Typography variant="caption" |
| cardTitle.fontSize | 18 | Typography variant="headlineSmall" |
| errorBoxText.fontSize | 14 | Typography variant="caption" |
| forgotPasswordLink.fontSize | 13 | Typography variant="overline" |
| checkboxText.fontSize | 14 | Typography variant="caption" |
| rememberMeHint.fontSize | 12 | Typography variant="overline" |
| loginButtonLabel.fontSize | 16 | Typography variant="body" |
| registerLinkText.fontSize | 14 | Typography variant="caption" |
| registerLink.fontSize | 14 | Typography variant="caption" |
| tipsTitle.fontSize | 16 | Typography variant="body" |
| tipsText.fontSize | 13 | Typography variant="overline" |

**硬编码间距:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| header.padding | 24 | designSystem.spacing.xxl |
| header.paddingTop | 80 | designSystem.spacing.xxxl + designSystem.spacing.xxl |
| headerTitle.marginBottom | 8 | designSystem.spacing.sm |
| card.margin | 16 | designSystem.spacing.lg |
| card.marginTop | 32 | designSystem.spacing.xxxl |
| cardTitle.marginBottom | 16 | designSystem.spacing.lg |
| errorBox.padding | 12 | designSystem.spacing.md |
| errorBox.marginBottom | 16 | designSystem.spacing.lg |
| forgotPasswordContainer.marginTop | 4 | designSystem.spacing.xs |
| forgotPasswordContainer.marginBottom | 8 | designSystem.spacing.sm |
| rememberMeContainer.marginVertical | 12 | designSystem.spacing.md |
| checkboxLabel.marginLeft | 8 | designSystem.spacing.sm |
| rememberMeHint.marginLeft | 32 | designSystem.spacing.xxxl |
| rememberMeHint.marginTop | 4 | designSystem.spacing.xs |
| loginButton.marginTop | 8 | designSystem.spacing.sm |
| loginButtonContent.paddingVertical | 8 | designSystem.spacing.sm |
| registerLinkContainer.marginTop | 24 | designSystem.spacing.xxl |
| registerLink.marginLeft | 4 | designSystem.spacing.xs |
| tipsBox.margin | 16 | designSystem.spacing.lg |
| tipsBox.padding | 16 | designSystem.spacing.lg |
| tipsTitle.marginBottom | 8 | designSystem.spacing.sm |

**硬编码圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| header.borderBottomLeftRadius | 20 | designSystem.borderRadius.xl |
| header.borderBottomRightRadius | 20 | designSystem.borderRadius.xl |
| card.borderRadius | 12 | designSystem.borderRadius.lg |
| errorBox.borderRadius | 8 | designSystem.borderRadius.md |
| tipsBox.borderRadius | 12 | designSystem.borderRadius.lg |

**Emoji 替换:**
| 当前 | 替换为 |
|------|--------|
| `💡` (tipsTitle) | `<Icon name="lightbulb" size="sm" color={designSystem.colors.warning.main} />` |

---

### RegisterScreen.tsx (复杂 - 403行)

**硬编码颜色 (与 LoginScreen 类似):**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| headerTitle.color | `#fff` | `designSystem.colors.text.inverse` |
| headerSubtitle.color | `#fff` | `designSystem.colors.text.inverse` |
| cardTitle.color | `#333` | `designSystem.colors.text.primary` |
| errorBox.backgroundColor | `#ffebee` | `designSystem.colors.error.light` |
| errorBoxText.color | `#c62828` | `designSystem.colors.error.dark` |
| passwordHint.backgroundColor | `#e3f2fd` | `designSystem.colors.info.light` |
| hintTitle.color | `#1976d2` | `designSystem.colors.info.dark` |
| hintText.color | `#555` | `designSystem.colors.text.secondary` |
| loginLinkText.color | `#666` | `designSystem.colors.text.secondary` |
| tipsBox.backgroundColor | `#fff3e0` | `designSystem.colors.warning.light` |
| tipsBox.borderColor | `#ffe0b2` | `designSystem.colors.warning.border` |
| tipsTitle.color | `#e65100` | `designSystem.colors.warning.dark` |
| tipsText.color | `#555` | `designSystem.colors.text.secondary` |

**硬编码字体 (与 LoginScreen 类似):**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| headerTitle.fontSize | 28 | Typography variant="displaySmall" |
| headerSubtitle.fontSize | 14 | Typography variant="caption" |
| cardTitle.fontSize | 18 | Typography variant="headlineSmall" |
| errorBoxText.fontSize | 14 | Typography variant="caption" |
| hintTitle.fontSize | 14 | Typography variant="caption" |
| hintText.fontSize | 13 | Typography variant="overline" |
| registerButtonLabel.fontSize | 16 | Typography variant="body" |
| loginLinkText.fontSize | 14 | Typography variant="caption" |
| loginLink.fontSize | 14 | Typography variant="caption" |
| tipsTitle.fontSize | 16 | Typography variant="body" |
| tipsText.fontSize | 13 | Typography variant="overline" |

**硬编码间距:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| header.padding | 24 | designSystem.spacing.xxl |
| header.paddingTop | 60 | designSystem.spacing.xxxl + designSystem.spacing.xl |
| headerTitle.marginBottom | 8 | designSystem.spacing.sm |
| card.margin | 16 | designSystem.spacing.lg |
| cardTitle.marginBottom | 16 | designSystem.spacing.lg |
| errorBox.padding | 12 | designSystem.spacing.md |
| errorBox.marginBottom | 16 | designSystem.spacing.lg |
| passwordHint.padding | 12 | designSystem.spacing.md |
| passwordHint.marginVertical | 16 | designSystem.spacing.lg |
| hintTitle.marginBottom | 4 | designSystem.spacing.xs |
| registerButton.marginTop | 8 | designSystem.spacing.sm |
| registerButtonContent.paddingVertical | 8 | designSystem.spacing.sm |
| loginLinkContainer.marginTop | 24 | designSystem.spacing.xxl |
| loginLink.marginLeft | 4 | designSystem.spacing.xs |
| tipsBox.margin | 16 | designSystem.spacing.lg |
| tipsBox.padding | 16 | designSystem.spacing.lg |
| tipsTitle.marginBottom | 8 | designSystem.spacing.sm |

**硬编码圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| header.borderBottomLeftRadius | 20 | designSystem.borderRadius.xl |
| header.borderBottomRightRadius | 20 | designSystem.borderRadius.xl |
| card.borderRadius | 12 | designSystem.borderRadius.lg |
| errorBox.borderRadius | 8 | designSystem.borderRadius.md |
| passwordHint.borderRadius | 8 | designSystem.borderRadius.md |
| tipsBox.borderRadius | 12 | designSystem.borderRadius.lg |

**Emoji 替换:**
| 当前 | 替换为 |
|------|--------|
| `💡` (tipsTitle) | `<Icon name="lightbulb" size="sm" color={designSystem.colors.warning.main} />` |

---

### ProfileScreen.tsx (中等 - 394行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| loadingText.color | `#666` | `designSystem.colors.text.secondary` |
| userName.color | `#fff` | `designSystem.colors.text.inverse` |
| userEmail.color | `#fff` | `designSystem.colors.text.inverse` |
| avatarPlaceholder.backgroundColor | `#fff` | `designSystem.colors.surface.primary` |
| menuItem.backgroundColor | `#fff` | `designSystem.colors.surface.primary` |
| menuItemText.color | `#333` | `designSystem.colors.text.primary` |
| menuItem.shadowColor | `#000` | `designSystem.colors.shadow` |
| Icon color (edit/child-care/history/settings) | `#666` | `designSystem.colors.text.secondary` |
| Icon color (chevron-right) | `#999` | `designSystem.colors.text.hint` |
| loginButton.backgroundColor | `#007bff` | `designSystem.colors.primary` |
| loginButtonText.color | `#fff` | `designSystem.colors.text.inverse` |
| logoutButton.backgroundColor | `#ffebee` | `designSystem.colors.error.light` |
| logoutButtonText.color | `#c62828` | `designSystem.colors.error.dark` |
| refreshingText.color | `#666` | `designSystem.colors.text.secondary` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| loadingText.fontSize | 16 | Typography variant="body" |
| avatarText.fontSize | 32 | Typography variant="displayMedium" |
| userName.fontSize | 24 | Typography variant="displaySmall" |
| userEmail.fontSize | 14 | Typography variant="caption" |
| sectionTitle.fontSize | 14 | Typography variant="caption" |
| menuItemText.fontSize | 16 | Typography variant="body" |
| loginButtonText.fontSize | 16 | Typography variant="body" |
| logoutButtonText.fontSize | 16 | Typography variant="body" |
| refreshingText.fontSize | 14 | Typography variant="caption" |

**硬编码间距:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| loadingText.marginTop | 12 | designSystem.spacing.md |
| header.padding | 24 | designSystem.spacing.xxl |
| header.paddingTop | 60 | designSystem.spacing.xxxl + designSystem.spacing.xl |
| avatarContainer.marginBottom | 12 | designSystem.spacing.md |
| avatarPlaceholder.marginBottom | 12 | designSystem.spacing.md |
| userName.marginBottom | 4 | designSystem.spacing.xs |
| sectionContainer.marginTop | 24 | designSystem.spacing.xxl |
| sectionContainer.paddingHorizontal | 16 | designSystem.spacing.lg |
| sectionHeader.marginBottom | 12 | designSystem.spacing.md |
| sectionHeader.marginLeft | 4 | designSystem.spacing.xs |
| sectionTitle.marginLeft | 8 | designSystem.spacing.sm |
| menuItem.padding | 16 | designSystem.spacing.lg |
| menuItem.marginBottom | 8 | designSystem.spacing.sm |
| menuItemText.marginLeft | 12 | designSystem.spacing.md |
| loginButton.margin | 16 | designSystem.spacing.lg |
| loginButton.marginTop | 24 | designSystem.spacing.xxl |
| loginButton.padding | 16 | designSystem.spacing.lg |
| logoutButton.margin | 16 | designSystem.spacing.lg |
| logoutButton.marginTop | 24 | designSystem.spacing.xxl |
| logoutButton.padding | 16 | designSystem.spacing.lg |
| refreshingIndicator.padding | 8 | designSystem.spacing.sm |
| refreshingText.marginLeft | 8 | designSystem.spacing.sm |

**硬编码圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| header.borderBottomLeftRadius | 20 | designSystem.borderRadius.xl |
| header.borderBottomRightRadius | 20 | designSystem.borderRadius.xl |
| avatarContainer.borderRadius | 40 | designSystem.borderRadius.full |
| avatarPlaceholder.borderRadius | 40 | designSystem.borderRadius.full |
| menuItem.borderRadius | 12 | designSystem.borderRadius.lg |
| loginButton.borderRadius | 12 | designSystem.borderRadius.lg |
| logoutButton.borderRadius | 12 | designSystem.borderRadius.lg |

---

### EditProfileScreen.tsx (中等 - 381行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| headerTitle.color | `#fff` | `designSystem.colors.text.inverse` |
| headerSubtitle.color | `#fff` | `designSystem.colors.text.inverse` |
| hintText.color | `#666` | `designSystem.colors.text.secondary` |
| unsavedHintText.color | `#ff9800` | `designSystem.colors.warning.main` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| headerTitle.fontSize | 24 | Typography variant="displaySmall" |
| headerSubtitle.fontSize | 14 | Typography variant="caption" |
| hintText.fontSize | 12 | Typography variant="overline" |
| unsavedHintText.fontSize | 12 | Typography variant="overline" |

**硬编码间距:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| content.paddingBottom | 24 | designSystem.spacing.xxl |
| header.padding | 24 | designSystem.spacing.xxl |
| header.paddingTop | 60 | designSystem.spacing.xxxl + designSystem.spacing.xl |
| headerTitle.marginBottom | 4 | designSystem.spacing.xs |
| formContainer.marginTop | 24 | designSystem.spacing.xxl |
| formContainer.paddingHorizontal | 16 | designSystem.spacing.lg |
| hintText.marginBottom | 16 | designSystem.spacing.lg |
| hintText.marginLeft | 4 | designSystem.spacing.xs |
| buttonContainer.paddingHorizontal | 16 | designSystem.spacing.lg |
| buttonContainer.marginTop | 8 | designSystem.spacing.sm |
| saveButton.marginBottom | 12 | designSystem.spacing.md |
| cancelButton.marginBottom | 8 | designSystem.spacing.sm |
| unsavedHint.marginTop | 16 | designSystem.spacing.lg |

**硬编码圆角:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| header.borderBottomLeftRadius | 20 | designSystem.borderRadius.xl |
| header.borderBottomRightRadius | 20 | designSystem.borderRadius.xl |

---

### QuestionListScreen.tsx (简单 - 37行)

**硬编码颜色:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| container.backgroundColor | `#f5f5f5` | `designSystem.colors.background` |
| title.color | (默认黑色) | `designSystem.colors.text.primary` |
| subtitle.color | `#666` | `designSystem.colors.text.secondary` |

**硬编码字体:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| title.fontSize | 24 | Typography variant="displaySmall" |
| title.fontWeight | 'bold' | Typography 内置 |
| subtitle.fontSize | 16 | Typography variant="body" |

**硬编码间距:**
| 位置 | 当前值 | 替换为 |
|------|--------|--------|
| title.marginBottom | 8 | `<Spacer size="sm" />` |

---

### 依赖关系

- **必须先完成 Story 7.1** ✅ - 需要 designSystem.ts
- **必须先完成 Story 7.2** ✅ - 需要 UI 组件库
- **建议完成 Story 7.3, 7.4** ✅ - 参考其他页面重构模式

### 技术要求

1. **保持 Paper 主题集成** - LoginScreen 和 RegisterScreen 使用 react-native-paper 组件，保持 useTheme() 钩子
2. **保持表单验证** - 不改变验证逻辑
3. **保持错误提示** - 保留错误消息显示
4. **保持导航** - 不改变页面跳转逻辑
5. **保持无障碍** - 保留所有 testID 和 accessibilityLabel

### 重构策略

**推荐顺序:**
1. **QuestionListScreen** (最简单) - 热身
2. **EditProfileScreen** (中等) - 练习简单表单
3. **ProfileScreen** (中等) - 练习列表页面
4. **LoginScreen** (复杂) - Paper 组件集成
5. **RegisterScreen** (复杂) - Paper 组件集成

**Paper 主题集成注意事项:**
```typescript
// 保持 Paper 组件的使用
import { Button, Card, Checkbox, useTheme } from 'react-native-paper';
const theme = useTheme();

// 在 JSX 中使用 Paper 组件
<Button
  mode="contained"
  onPress={handleLogin}
  // Paper Button 自动使用 theme.colors
>
  登录
</Button>

// 只替换硬编码在 StyleSheet 中的值
const styles = StyleSheet.create({
  container: {
    backgroundColor: designSystem.colors.background, // 替换 #f5f5f5
  },
  // theme.colors.primary 通过 Paper 自动应用
});
```

### Anti-Patterns to Avoid

- ❌ 不要修改表单验证规则
- ❌ 不要修改 API 调用
- ❌ 不要删除错误处理
- ❌ 不要修改密码加密逻辑
- ❌ 不要移除 react-native-paper 组件
- ❌ 不要破坏 Paper 主题集成
- ❌ 不要删除 testID 或 accessibilityLabel
- ❌ 不要修改导航逻辑

### References

- [Source: src/screens/LoginScreen.tsx] - 待重构
- [Source: src/screens/RegisterScreen.tsx] - 待重构
- [Source: src/screens/ProfileScreen.tsx] - 待重构
- [Source: src/screens/EditProfileScreen.tsx] - 待重构
- [Source: src/screens/QuestionListScreen.tsx] - 待重构
- [Source: src/styles/designSystem.ts] - 设计系统入口
- [Source: src/components/ui/index.ts] - UI 组件库入口
- [Source: _bmad-output/implementation-artifacts/7-3-home-camera-redesign.md] - 参考重构模式
- [Source: _bmad-output/implementation-artifacts/7-4-explain-pdf-redesign.md] - 参考重构模式

## Dev Agent Record

### Agent Model Used
{{agent_model_name}}

### Debugging Notes
<!-- 开发过程中遇到的问题和解决方案 -->

### Completion Notes List
<!-- 完成时的备注 -->

### File List

**修改文件：**
- MathLearningApp/src/screens/LoginScreen.tsx
- MathLearningApp/src/screens/RegisterScreen.tsx
- MathLearningApp/src/screens/ProfileScreen.tsx
- MathLearningApp/src/screens/EditProfileScreen.tsx
- MathLearningApp/src/screens/QuestionListScreen.tsx

## Change Log

- 2026-03-31: Story 7.5 上下文文件创建 - 准备开发
