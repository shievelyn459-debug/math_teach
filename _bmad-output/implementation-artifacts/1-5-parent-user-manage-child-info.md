# Story 1.5: parent-user-manage-child-info

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want to add and manage my child's information (name, grade, birthday),
so that the app can provide personalized learning experiences and appropriate content for my child.

## Acceptance Criteria

1. [ ] Users can add one or more children to their account
2. [ ] For each child, users can provide: name, grade (1-6), and birthday (optional)
3. [ ] Users can view all their children in a list on the profile screen
4. [ ] Users can edit existing child information
5. [ ] Users can delete a child from their account (with confirmation)
6. [ ] Child's grade determines the difficulty level of generated questions
7. [ ] The system validates child name (2-50 characters) and grade (1-6 for primary school)
8. [ ] Changes are saved immediately with success/error feedback
9. [ ] The child management operations complete within 3 seconds under normal network conditions
10. [ ] Users can select an active child for the current learning session

## Tasks / Subtasks

- [ ] Implement child data model and service (AC: 1, 9)
  - [ ] Add Child interface to types/index.ts
  - [ ] Create childApi in api.ts for CRUD operations
  - [ ] Implement getChildren, addChild, updateChild, deleteChild methods
  - [ ] Add proper error handling and validation
- [ ] Create child list view (AC: 3, 10)
  - [ ] Create ChildListScreen.tsx to display all children
  - [ ] Show each child's name, grade, and avatar/icon
  - [ ] Add "Add Child" button
  - [ ] Implement swipe-to-edit and swipe-to-delete actions
  - [ ] Add active child indicator
- [ ] Create add/edit child screen (AC: 2, 4, 7, 8)
  - [ ] Create ChildFormScreen.tsx for add/edit
  - [ ] Add name input field (2-50 characters validation)
  - [ ] Add grade selector (dropdown for grades 1-6)
  - [ ] Add birthday picker (optional, date picker)
  - [ ] Implement save and cancel buttons
  - [ ] Show validation errors inline
- [ ] Implement delete functionality (AC: 5, 8)
  - [ ] Add delete confirmation dialog
  - [ ] Implement delete API call
  - [ ] Handle active child deletion (prompt to select new active child)
  - [ ] Update UI to reflect deletion
- [ ] Implement active child selection (AC: 10)
  - [ ] Add mechanism to select active child
  - [ ] Persist active child selection locally
  - [ ] Update app context when active child changes
  - [ ] Use active child's grade for question generation
- [ ] Integrate with profile screen (AC: 3)
  - [ ] Add "My Children" section to ProfileScreen
  - [ ] Show quick summary of children
  - [ ] Add navigation to full child list
- [ ] Create comprehensive tests (All AC)
  - [ ] Unit tests for child services
  - [ ] Unit tests for validation logic
  - [ ] Integration tests for API endpoints
  - [ ] UI component tests for child screens
  - [ ] Test active child persistence and selection

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **API Pattern**: Follow the existing userApi structure in MathLearningApp/src/services/api.ts
- **Data Model**: Create new Child interface in types/index.ts
- **Parent-Child Relationship**: Child data belongs to a parent user
- **Active Child**: Store active child selection in AsyncStorage
- **Performance Constraint**: Operations complete within 3 seconds
- **Validation**: Client-side validation with server-side confirmation
- **Type Safety**: Use TypeScript interfaces for type safety

### Source Tree Components to Touch

- **MathLearningApp/src/types/index.ts** (modify)
  - Add Child interface with name, grade, birthday fields
  - Extend User interface to include children array
  - Add Grade enum or type (1-6 for primary school)

- **MathLearningApp/src/services/api.ts** (modify)
  - Add childApi object with CRUD methods
  - Implement getChildren, addChild, updateChild, deleteChild
  - Follow ApiResponse<T> pattern for consistency

- **MathLearningApp/src/services/** (new)
  - Create activeChildService.ts for managing active child state
  - Handle persistence and retrieval of active child
  - Provide context for rest of app

- **MathLearningApp/src/screens/** (new)
  - Create ChildListScreen.tsx for viewing all children
  - Create ChildFormScreen.tsx for add/edit child
  - Follow PascalCase naming convention

- **MathLearningApp/src/components/** (new)
  - Create ChildCard.tsx for displaying individual child
  - Create ChildListItem.tsx for list items
  - Create GradeSelector.tsx for grade selection dropdown

- **MathLearningApp/src/navigation/** (modify)
  - Add child management screens to navigation stack
  - Configure navigation from profile to child list
  - Handle navigation between child list and form

- **MathLearningApp/src/contexts/** (new, optional)
  - Create ActiveChildContext.tsx for app-wide active child state
  - Provide active child to all screens that need it

### Database Schema Updates

From docs/architecture-design.md, the User schema includes a children array:
```javascript
{
  profile: {
    children: [{
      name: String,
      grade: String,
      birthday: Date
    }]
  }
}
```

Extend this schema with:
- childId: unique identifier for each child
- avatar: optional avatar image URL
- isActive: boolean flag for currently selected child
- createdAt: timestamp

### Previous Story Intelligence (Stories 1-1 through 1-4 Context)

**Previous stories established patterns:**
1. **Form Components**: FormInput and validation patterns from story 1-1
2. **Profile Management**: ProfileScreen from story 1-4
3. **API Patterns**: ApiResponse<T> wrapper, consistent API structure
4. **UI Pattern**: react-native-paper components for Material Design
5. **Error Handling**: User-friendly error messages and feedback
6. **State Management**: AsyncStorage for local persistence

**Integration Points:**
- Child list accessible from ProfileScreen (story 1-4)
- Uses same validation patterns from previous forms
- Follows API structure from previous user stories
- Active child affects question generation (epic 2, 4)

### Testing Standards Summary

- **Unit Tests**: Child services, validation logic, active child management
- **Integration Tests**: API endpoints, parent-child relationships
- **UI Tests**: All screens, form submission, navigation, delete confirmation
- **Performance Tests**: Verify 3-second constraint
- **Security Tests**: Authorization (parent can only manage their children)

### Project Structure Notes

- Follow existing file structure patterns from previous stories
- Reuse FormInput component from story 1-1
- Create reusable child-related components
- Screen components in src/screens/, services in src/services/
- Consider using React Context for active child state

### Active Child Management

**Why Active Child Matters:**
- Determines grade level for question generation
- Personalizes the learning experience
- Allows parents to switch between children

**Implementation Approach:**
1. Store active child ID in AsyncStorage
2. Create ActiveChildContext for app-wide access
3. Update active child when user selects different child
4. Default to first child if no active child set
5. Handle edge case: no children, active child deleted

### Child Data Model

```typescript
interface Child {
  id: string;
  parentId: string;
  name: string;
  grade: Grade; // 1-6
  birthday?: Date; // optional
  avatar?: string; // optional
  createdAt: Date;
  updatedAt: Date;
}

enum Grade {
  GRADE_1 = '1',
  GRADE_2 = '2',
  GRADE_3 = '3',
  GRADE_4 = '4',
  GRADE_5 = '5',
  GRADE_6 = '6',
}
```

### Validation Rules

**Child Name:**
- Required field
- 2-50 characters
- Letters, spaces, and common punctuation allowed
- Trim leading/trailing whitespace

**Grade:**
- Required field
- Must be 1-6 (primary school grades)
- Display as "一年级" through "六年级"

**Birthday:**
- Optional field
- Must be a valid date in the past
- Age calculation: should be 5-12 years old for grade 1-6
- Format: ISO 8601 or Date object

### Integration with Question Generation

The active child's grade affects:
- **Epic 2**: Difficulty of recognized questions
- **Epic 3**: Complexity of knowledge point explanations
- **Epic 4**: Grade-appropriate question generation

Question generation APIs should accept grade parameter:
```typescript
generateQuestions(params: {
  questionType: QuestionType;
  difficulty: Difficulty;
  count: number;
  grade?: number; // new parameter from active child
})
```

### User Flow

**Add Child:**
1. User navigates to ProfileScreen
2. Taps "My Children" section
3. Taps "Add Child" button
4. Fills in child information
5. Taps "Save"
6. Child added to list, user returns to child list

**Edit Child:**
1. User views ChildListScreen
2. Swipes left on child card or taps edit icon
3. ChildFormScreen opens with pre-filled data
4. User makes changes
5. Taps "Save"
6. Child updated, user returns to child list

**Delete Child:**
1. User swipes left on child card
2. Taps "Delete" button
3. Confirmation dialog appears
4. User confirms deletion
5. Child deleted from list
6. If deleted child was active, prompt to select new active child

**Select Active Child:**
1. User views ChildListScreen
2. Taps on a child card
3. Child becomes active (visual indicator shown)
4. Active child ID saved to AsyncStorage
5. App context updated with new active child

### Error Scenarios to Handle

- Network errors during save/update/delete
- Invalid child name (too short/long)
- Invalid grade (not 1-6)
- Child deletion failure
- Active child persistence failure
- No children when app requires active child
- Duplicate child names (allow but warn)

### UI/UX Considerations

**Child List:**
- Card-based layout with child info
- Avatar/icon for visual appeal
- Active child indicator (checkmark or highlight)
- Swipe gestures for quick edit/delete
- Empty state when no children added

**Child Form:**
- Clean, simple form for child info
- Grade selector as dropdown or radio buttons
- Birthday picker using native date picker
- Inline validation errors
- Clear save/cancel buttons

**Visual Design:**
- Use child-friendly colors and icons
- Larger touch targets for tablet use
- Clear visual hierarchy
- Parent-friendly language

### References

- [Source: docs/prd.md#功能需求] FR1: 家长用户可以管理孩子的信息
- [Source: _planning-artifacts/epics.md#史诗故事-1] 用户管理史诗的故事1.5
- [Source: docs/architecture-design.md#数据库设计] 用户集合(children)结构定义
- [Source: MathLearningApp/src/types/index.ts] User interface definition
- [Source: MathLearningApp/src/services/api.ts] Existing API patterns
- [Source: 1-1-parent-user-create-account.md] Form components and validation
- [Source: 1-4-parent-user-update-profile.md] Profile screen patterns

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (glm-4.7)

### Implementation Plan

**阶段1：孩子数据模型和服务实现**
- 在types/index.ts中添加Child接口和Grade枚举
- 扩展User接口包含children数组
- 在api.ts中创建childApi，实现CRUD方法
- 实现getChildren、addChild、updateChild、deleteChild函数

**阶段2：活跃孩子状态管理**
- 创建activeChildService.ts管理活跃孩子状态
- 实现活跃孩子的持久化存储（AsyncStorage）
- 创建ActiveChildContext提供全局状态访问
- 处理活跃孩子切换和删除场景

**阶段3：孩子列表界面实现**
- 创建ChildListScreen.tsx显示所有孩子
- 设计卡片式布局展示孩子信息
- 实现滑动操作（编辑/删除）
- 添加活跃孩子指示器
- 实现"添加孩子"按钮

**阶段4：孩子表单界面实现**
- 创建ChildFormScreen.tsx用于添加/编辑
- 实现姓名输入和验证
- 创建年级选择器（下拉或单选按钮）
- 实现生日选择器（可选字段）
- 添加保存和取消按钮

**阶段5：删除功能实现**
- 实现滑动删除操作
- 添加删除确认对话框
- 处理活跃孩子被删除的情况
- 提示用户选择新的活跃孩子

**阶段6：与资料页面集成**
- 在ProfileScreen添加"我的孩子"部分
- 显示孩子快速摘要
- 添加导航到完整孩子列表
- 确保导航流程顺畅

**阶段7：与题目生成集成**
- 更新题目生成API接受年级参数
- 使用活跃孩子的年级影响题目难度
- 确保Epic 2和4的功能能访问活跃孩子信息

**阶段8：测试和优化**
- 编写单元测试：孩子服务、验证逻辑、活跃孩子管理
- 编写集成测试：API端点、父子关系
- 进行性能测试：确保3秒内完成
- 在真实设备上验证用户体验

### Debug Log References

### Completion Notes List

### File List

**待创建文件：**
- MathLearningApp/src/screens/ChildListScreen.tsx
- MathLearningApp/src/screens/ChildFormScreen.tsx
- MathLearningApp/src/services/activeChildService.ts
- MathLearningApp/src/contexts/ActiveChildContext.tsx (可选)
- MathLearningApp/src/components/ChildCard.tsx
- MathLearningApp/src/components/GradeSelector.tsx
- MathLearningApp/src/screens/__tests__/ChildListScreen.test.tsx
- MathLearningApp/src/screens/__tests__/ChildFormScreen.test.tsx

**待修改文件：**
- MathLearningApp/src/types/index.ts (添加Child接口和Grade枚举)
- MathLearningApp/src/services/api.ts (添加childApi)
- MathLearningApp/src/screens/ProfileScreen.tsx (添加孩子部分)
- MathLearningApp/src/navigation/App.tsx (配置孩子管理导航)

**复用文件（来自story 1-1）：**
- MathLearningApp/src/components/FormInput.tsx

### Dependencies

复用现有依赖：
- `@react-navigation/native-stack`: 导航
- `react-native-paper`: UI组件（Card, Dialog,等）
- `@react-native-async-storage/async-storage`: 活跃孩子持久化

可能需要添加的新依赖：
- 无新依赖（复用现有依赖）

### Grade Display Mapping

```typescript
const gradeDisplayNames: Record<Grade, string> = {
  [Grade.GRADE_1]: '一年级',
  [Grade.GRADE_2]: '二年级',
  [Grade.GRADE_3]: '三年级',
  [Grade.GRADE_4]: '四年级',
  [Grade.GRADE_5]: '五年级',
  [Grade.GRADE_6]: '六年级',
};
```

### Optional Enhancements

- [ ] 孩子头像上传和裁剪
- [ ] 孩子学习进度概览
- [ ] 每个孩子的学习统计
- [ ] 拖拽重新排序孩子列表
- [ ] 孩子备注或标签功能
- [ ] 多语言孩子名字支持

### Epic Completion Note

这是Epic 1（用户管理）的最后一个故事！完成后，Epic 1将提供完整的用户管理功能：
- ✅ 用户注册和登录
- ✅ 密码重置
- ✅ 资料管理
- ✅ 孩子信息管理

Epic 1完成后，用户可以完整地使用应用的身份管理和个人化功能。
