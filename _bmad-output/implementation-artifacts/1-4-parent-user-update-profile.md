# Story 1.4: parent-user-update-profile

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want to update my profile information (name, email, phone),
so that I can keep my account information current and maintain accessibility.

## Acceptance Criteria

1. [ ] Users can view their current profile information in a profile screen
2. [ ] Users can update their display name with validation (2-50 characters)
3. [ ] Users can update their email address with email format validation
4. [ ] Users can optionally add/update their phone number with format validation
5. [ ] When updating email, users must verify the new email via confirmation link
6. [ ] The system prevents duplicate email addresses (already registered)
7. [ ] Changes are saved immediately with success/error feedback
8. [ ] Users can cancel edits and return to previous values
9. [ ] The profile update completes within 3 seconds under normal network conditions
10. [ ] Profile avatar can be updated with image upload (optional enhancement)

## Tasks / Subtasks

- [ ] Implement profile retrieval service (AC: 1)
  - [ ] Add getProfile method to userApi in api.ts
  - [ ] Fetch current user profile data
  - [ ] Handle loading and error states
- [ ] Create profile view screen (AC: 1, 8)
  - [ ] Create ProfileScreen.tsx to display user info
  - [ ] Show current name, email, phone, and avatar
  - [ ] Add "Edit Profile" button
  - [ ] Implement responsive design for tablets
- [ ] Implement profile update service (AC: 2, 3, 4, 5, 6, 9)
  - [ ] Add updateProfile method to userApi in api.ts
  - [ ] Implement field validation (name, email, phone)
  - [ ] Check for duplicate email addresses
  - [ ] Handle email change verification flow
  - [ ] Implement optimistic UI updates
- [ ] Create profile edit screen (AC: 2, 3, 4, 8)
  - [ ] Create EditProfileScreen.tsx with form inputs
  - [ ] Add name input field (2-50 characters validation)
  - [ ] Add email input field with format validation
  - [ ] Add phone input field with optional format validation
  - [ ] Implement save and cancel buttons
  - [ ] Show validation errors inline
- [ ] Implement email change verification (AC: 5)
  - [ ] Generate verification token for new email
  - [ ] Send verification email to new address
  - [ ] Keep old email active until verification
  - [ ] Handle verification link click
- [ ] Add avatar upload functionality (AC: 10 - optional)
  - [ ] Integrate image picker for avatar selection
  - [ ] Implement image upload to server
  - [ ] Update user avatar URL
  - [ ] Show upload progress and error handling
- [ ] Create comprehensive tests (All AC)
  - [ ] Unit tests for profile services
  - [ ] Unit tests for validation logic
  - [ ] Integration tests for API endpoints
  - [ ] UI component tests for profile screens

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **API Pattern**: Follow the existing userApi structure in MathLearningApp/src/services/api.ts
- **User Interface**: Extend User type from types/index.ts with additional profile fields
- **Optimistic Updates**: Update UI immediately, rollback on error for better UX
- **Performance Constraint**: Profile update within 3 seconds
- **Validation**: Client-side validation with server-side confirmation
- **Type Safety**: Use TypeScript interfaces for type safety

### Source Tree Components to Touch

- **MathLearningApp/src/services/api.ts** (modify)
  - Implement userApi.getProfile function (currently a stub)
  - Add userApi.updateProfile function
  - Add userApi.updateAvatar function (optional)
  - Follow ApiResponse<T> pattern for consistency

- **MathLearningApp/src/screens/** (new)
  - Create ProfileScreen.tsx for viewing profile
  - Create EditProfileScreen.tsx for editing profile
  - Follow PascalCase naming convention

- **MathLearningApp/src/types/index.ts** (modify)
  - Extend User interface with phone and avatar fields
  - Add UserProfile interface for profile-specific data

- **MathLearningApp/src/components/** (reuse and extend)
  - Reuse FormInput.tsx from story 1-1
  - Create AvatarUpload.tsx component (optional)
  - Create ProfileField.tsx for reusable profile display

- **MathLearningApp/src/navigation/** (modify)
  - Add profile screens to navigation stack
  - Configure navigation from home to profile
  - Handle back navigation properly

### Previous Story Intelligence (Story 1-1, 1-2, 1-3 Context)

**Stories 1-1, 1-2, 1-3 established patterns:**
1. **Form Components**: FormInput and PasswordInput for reusability
2. **Validation**: Client-side validation patterns with user-friendly messages
3. **UI Pattern**: react-native-paper components for Material Design
4. **API Pattern**: ApiResponse<T> wrapper for consistent responses
5. **Error Handling**: Graceful error handling with user feedback
6. **Auth State**: authService.ts for managing user authentication state

**Integration Points:**
- Profile screen accessible from home screen or drawer navigation
- Uses same User interface from types/index.ts
- Follows API structure from previous user stories
- May integrate with authService for user state management

### Database Schema Updates

From docs/architecture-design.md, the User schema includes:
```javascript
{
  profile: {
    name: String,
    phone: String,
    // ... other fields
  }
}
```

Ensure updates align with this schema structure.

### Testing Standards Summary

- **Unit Tests**: Profile services, validation logic, email verification
- **Integration Tests**: API endpoints, email verification flow
- **UI Tests**: Both screens, form submission, navigation
- **Performance Tests**: Verify 3-second update constraint
- **Security Tests**: Email duplicate check, authorization checks

### Project Structure Notes

- Follow existing file structure patterns from previous stories
- Reuse components from story 1-1 (FormInput)
- Maintain consistency with existing API patterns
- Screen components in src/screens/, services in src/services/
- Create reusable profile components in src/components/

### Integration Points

- **Home Screen**: Add profile icon/button to navigate to ProfileScreen
- **Auth State**: Profile data linked to authenticated user from authService
- **Email Verification**: Similar flow to password reset (story 1-3) but for email change
- **Avatar Upload**: Uses image picker similar to camera functionality (epic 2)

### Technical Constraints

- **React Native version**: 0.74.3
- **Navigation**: Using @react-navigation/native-stack v6.9.17
- **UI Components**: Using react-native-paper v5.11.14
- **Image Upload**: May need react-native-image-picker (already in dependencies)
- **Forms**: Reuse FormInput components from story 1-1

### Email Change Flow

1. User requests email change in EditProfileScreen
2. System sends verification email to new address
3. Old email remains active until verification
4. User clicks verification link in email
5. System confirms and updates email
6. User may need to re-login with new email

### Validation Rules

**Name:**
- Required field
- 2-50 characters
- Letters, spaces, and common punctuation allowed
- Trim leading/trailing whitespace

**Email:**
- Required field
- Valid email format (regex or validator library)
- Must not already be registered
- Case-insensitive duplicate check

**Phone (Optional):**
- Optional field
- Validate format if provided
- Support international formats
- Store in E.164 format if possible

### Error Scenarios to Handle

- Network errors during save
- Duplicate email address
- Invalid email format
- Name too short or too long
- Invalid phone format
- Email verification link expired
- Email verification failed
- Avatar upload failed
- Unauthorized access (user not logged in)

### User Flow

**View Profile:**
1. User navigates to ProfileScreen from home/drawer
2. System loads and displays current profile data
3. User taps "Edit Profile" button

**Edit Profile:**
1. User enters EditProfileScreen
2. Form is pre-populated with current values
3. User makes changes
4. System validates input in real-time
5. User taps "Save" or "Cancel"
6. If save: updates sent to server, success message shown
7. If cancel: changes discarded, return to view mode

### Avatar Upload (Optional Enhancement)

If implementing avatar upload:
- Use react-native-image-picker (already in dependencies from epic 2)
- Show image preview before upload
- Display upload progress
- Handle image size limits (e.g., max 5MB)
- Crop/square images to consistent size
- Fallback to default avatar if none set

### References

- [Source: docs/prd.md#功能需求] FR1: 家长用户可以更新个人资料信息
- [Source: _planning-artifacts/epics.md#史诗故事-1] 用户管理史诗的故事1.4
- [Source: docs/architecture-design.md#数据库设计] 用户集合(users)结构定义
- [Source: MathLearningApp/src/types/index.ts] User interface definition
- [Source: MathLearningApp/src/services/api.ts] Existing API patterns
- [Source: 1-1-parent-user-create-account.md] Form components and validation patterns
- [Source: 1-2-parent-user-login.md] Auth state management patterns
- [Source: 2-1-upload-math-question-photo.md] Image upload patterns (for avatar)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (glm-4.7)

### Implementation Plan

**阶段1：用户资料获取服务实现**
- 实现userApi.getProfile函数，获取当前用户资料
- 添加加载状态和错误处理
- 集成到authService中的用户状态管理

**阶段2：资料查看界面实现**
- 创建ProfileScreen.tsx，显示用户信息
- 设计卡片式布局展示姓名、邮箱、电话、头像
- 添加"编辑资料"按钮
- 实现从主页或抽屉导航的入口

**阶段3：资料更新服务实现**
- 在api.ts中添加userApi.updateProfile函数
- 实现字段验证（姓名、邮箱、电话）
- 添加重复邮箱检查
- 实现邮箱变更验证流程
- 添加乐观UI更新机制

**阶段4：资料编辑界面实现**
- 创建EditProfileScreen.tsx
- 复用story 1-1的FormInput组件
- 实现实时验证和错误提示
- 添加保存和取消按钮
- 实现未保存更改的确认提示

**阶段5：邮箱变更验证实现**
- 生成验证令牌并发送到新邮箱
- 保持旧邮箱有效直到验证完成
- 处理验证链接点击（深度链接）
- 更新邮箱并通知用户

**阶段6：头像上传功能（可选）**
- 集成react-native-image-picker选择头像
- 实现图片上传到服务器
- 更新用户头像URL
- 显示上传进度和错误处理

**阶段7：导航和状态管理**
- 配置从主页到资料页的导航
- 实现编辑和查看模式之间的切换
- 处理返回导航和未保存更改
- 优化3秒内完成更新的性能

**阶段8：测试和优化**
- 编写单元测试：资料服务、验证逻辑
- 编写集成测试：API端点、邮箱验证流程
- 进行性能测试：确保3秒内完成
- 在真实设备上验证用户体验

### Debug Log References

### Completion Notes List

### File List

**待创建文件：**
- MathLearningApp/src/screens/ProfileScreen.tsx
- MathLearningApp/src/screens/EditProfileScreen.tsx
- MathLearningApp/src/components/ProfileField.tsx (可复用组件)
- MathLearningApp/src/components/AvatarUpload.tsx (可选)
- MathLearningApp/src/screens/__tests__/ProfileScreen.test.tsx
- MathLearningApp/src/screens/__tests__/EditProfileScreen.test.tsx

**待修改文件：**
- MathLearningApp/src/services/api.ts (实现getProfile和updateProfile)
- MathLearningApp/src/types/index.ts (扩展User接口)
- MathLearningApp/src/services/authService.ts (添加用户资料状态)
- MathLearningApp/src/navigation/App.tsx (配置资料页面导航)
- MathLearningApp/src/screens/HomeScreen.tsx (添加资料入口)

**复用文件（来自story 1-1）：**
- MathLearningApp/src/components/FormInput.tsx

### Dependencies

复用现有依赖：
- `@react-navigation/native-stack`: 导航
- `react-native-paper`: UI组件
- `react-native-image-picker`: 头像上传（已安装）

可能需要添加的新依赖：
- 无新依赖（复用现有依赖）

### Optional Enhancements

- [ ] 头像裁剪功能（react-native-image-crop-picker）
- [ ] 头像占位符生成（使用用户名首字母）
- [ ] 资料完成度指示器
- [ ] 最近活动时间显示
- [ ] 账户创建日期显示
