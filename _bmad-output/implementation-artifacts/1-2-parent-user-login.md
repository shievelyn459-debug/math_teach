# Story 1.2: parent-user-login

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want to log in to the app using my email and password,
so that I can access the math learning features and help my child with problems.

## Acceptance Criteria

1. [ ] Parent users can log in by providing their registered email and password
2. [ ] The system validates credentials and provides clear error messages for invalid login
3. [ ] After successful login, users are navigated to the home screen
4. [ ] The system provides "Remember me" option to keep users logged in
5. [ ] Login form provides clear feedback and error messages in parent-friendly language
6. [ ] The login process completes within 3 seconds under normal network conditions
7. [ ] Failed login attempts are tracked and appropriate security measures are applied
8. [ ] Users can navigate to registration screen if they don't have an account
9. [ ] Users can navigate to password reset screen if they forgot their password

## Tasks / Subtasks

- [ ] Implement user login service (AC: 1, 2, 6, 7)
  - [ ] Implement userApi.login function in api.ts
  - [ ] Add credential validation and error handling
  - [ ] Implement authentication token storage
  - [ ] Add failed login attempt tracking
  - [ ] Implement rate limiting for security
- [ ] Create login screen UI (AC: 1, 5, 8, 9)
  - [ ] Design parent-friendly login form
  - [ ] Add input fields for email and password
  - [ ] Implement "Remember me" checkbox
  - [ ] Add navigation links to registration and password reset screens
  - [ ] Ensure responsive design for tablet devices
- [ ] Implement authentication state management (AC: 3, 4)
  - [ ] Create authService.ts for auth state management
  - [ ] Implement secure token storage using AsyncStorage
  - [ ] Handle "Remember me" functionality
  - [ ] Implement auto-login on app start if remember me is checked
- [ ] Add navigation and error handling (AC: 2, 3, 5)
  - [ ] Implement loading states during login
  - [ ] Handle successful login with navigation to home screen
  - [ ] Handle login errors with user-friendly messages
  - [ ] Optimize for 3-second completion requirement
- [ ] Implement security measures (AC: 7)
  - [ ] Track failed login attempts
  - [ ] Implement temporary lockout after multiple failures (e.g., 5 attempts)
  - [ ] Log security events for monitoring
- [ ] Create comprehensive tests (All AC)
  - [ ] Unit tests for login service
  - [ ] Unit tests for auth state management
  - [ ] Integration tests for API endpoints
  - [ ] UI component tests for login screen

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **API Pattern**: Follow the existing userApi structure in MathLearningApp/src/services/api.ts (lines 178-190)
- **Authentication**: Use JWT tokens or similar mechanism for secure authentication
- **Token Storage**: Use AsyncStorage for secure token persistence
- **Security Requirements**: Follow security architecture from docs/architecture-design.md
- **Performance Constraint**: Login must complete within 3 seconds
- **Type Safety**: Use TypeScript interfaces for User and ApiResponse types

### Source Tree Components to Touch

- **MathLearningApp/src/services/api.ts** (modify)
  - Implement userApi.login function (currently a stub)
  - Add proper error handling and response formatting
  - Follow ApiResponse<T> pattern for consistency

- **MathLearningApp/src/screens/** (new)
  - Create LoginScreen.tsx for the login UI
  - Follow naming convention: PascalCase for screen components

- **MathLearningApp/src/services/** (new or modify)
  - Create or enhance authService.ts for authentication state management
  - Handle login state, token storage, and session management

- **MathLearningApp/src/navigation/** (modify)
  - Add login screen to navigation stack
  - Configure authentication flow (auth stack vs app stack)
  - Implement navigation guards for protected routes

- **MathLearningApp/src/components/** (reuse from story 1-1)
  - Reuse FormInput.tsx and PasswordInput.tsx from registration story

### Previous Story Intelligence (Story 1-1 Context)

**Story 1-1 (parent-user-create-account) established patterns:**

1. **API Pattern**: userApi structure with ApiResponse<T> wrapper
2. **Form Components**: FormInput and PasswordInput components for reusability
3. **Auth Service**: authService.ts created for token management
4. **UI Pattern**: react-native-paper components for Material Design
5. **Validation**: Client-side validation with user-friendly error messages
6. **Security**: AsyncStorage for secure token storage

**Integration Points:**
- Story 1-1 creates the user account, story 1-2 authenticates those users
- Both use the same User interface from types/index.ts
- Both follow the same API pattern in api.ts
- authService.ts from 1-1 should be extended for login functionality

### Testing Standards Summary

- **Unit Tests**: Test login service, auth state management, form validation
- **Integration Tests**: Test API endpoints, token storage, navigation flow
- **UI Tests**: Test screen navigation, form submission, error display
- **Performance Tests**: Verify 3-second login completion
- **Security Tests**: Verify failed attempt tracking, rate limiting

### Project Structure Notes

- Follow existing file structure patterns from story 1-1
- Reuse components created in story 1-1 (FormInput, PasswordInput)
- Maintain consistency with existing API patterns in api.ts
- Screen components go in src/screens/, services in src/services/
- Extend authService.ts rather than creating duplicate auth logic

### Integration Points

- **Post-login navigation**: Navigate to HomeScreen.tsx (already exists)
- **Auth state**: Will be used by story 1-3 (password reset) and other protected features
- **Registration flow**: Navigation link to RegisterScreen from story 1-1
- **Password reset**: Navigation link to reset screen (story 1-3)

### Technical Constraints

- **React Native version**: 0.74.3
- **Navigation**: Using @react-navigation/native-stack v6.9.17
- **UI Components**: Using react-native-paper v5.11.14
- **Storage**: AsyncStorage for token storage (from story 1-1)
- **Authentication**: Consider using JWT or similar token-based auth

### Security Considerations

- **Password handling**: Never store passwords locally, only tokens
- **Token security**: Store tokens securely in AsyncStorage
- **Failed attempts**: Track and limit failed login attempts
- **Rate limiting**: Implement exponential backoff for repeated failures
- **Session management**: Handle token expiration and refresh

### Performance Optimization

- Use loading indicators for user feedback
- Implement form validation on submit to avoid unnecessary re-renders
- Cache authentication state to avoid redundant API calls
- Minimize navigation transitions time

### Error Scenarios to Handle

- Invalid email or password
- Network connectivity issues
- Account locked due to multiple failed attempts
- Server errors
- Token expiration

### References

- [Source: docs/prd.md#功能需求] FR1: 家长用户可以注册和登录系统
- [Source: _planning-artifacts/epics.md#史诗故事-1] 用户管理史诗的故事1.2
- [Source: docs/architecture-design.md#数据库设计] 用户集合(users)结构定义
- [Source: docs/architecture-design.md#安全架构设计] 安全要求和模式
- [Source: MathLearningApp/src/types/index.ts] User interface definition
- [Source: MathLearningApp/src/services/api.ts] Existing API patterns
- [Source: 1-1-parent-user-create-account.md] Previous story with established patterns
- [Source: 2-3-manually-correct-question-type.md] Reference for error handling patterns

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (glm-4.7)

### Implementation Plan

**阶段1：用户登录服务实现**
- 实现userApi.login函数，完成登录API调用
- 添加凭证验证和错误处理
- 实现认证令牌的接收和存储
- 添加失败登录尝试跟踪
- 实现速率限制保护

**阶段2：登录界面UI实现**
- 创建LoginScreen.tsx，设计家长友好的登录表单
- 复用story 1-1的FormInput和PasswordInput组件
- 添加"记住我"复选框
- 添加"还没有账号？注册"和"忘记密码？"链接
- 确保响应式设计适配平板

**阶段3：认证状态管理**
- 扩展authService.ts，处理登录状态
- 实现令牌的安全存储和检索
- 处理"记住我"功能
- 实现应用启动时的自动登录

**阶段4：导航流程配置**
- 实现认证后的主屏幕导航
- 配置受保护路由的身份验证守卫
- 处理登录失败场景和重试逻辑
- 优化3秒内完成登录的性能

**阶段5：测试和优化**
- 编写单元测试：登录服务、认证状态管理
- 编写集成测试：API调用、令牌存储、导航
- 进行性能测试：确保3秒内完成
- 在真实设备上验证用户体验

### Debug Log References

### Completion Notes List

### File List

**待创建文件：**
- MathLearningApp/src/screens/LoginScreen.tsx
- MathLearningApp/src/screens/__tests__/LoginScreen.test.tsx

**待修改文件：**
- MathLearningApp/src/services/api.ts (实现userApi.login)
- MathLearningApp/src/services/authService.ts (扩展以支持登录)
- MathLearningApp/src/navigation/App.tsx 或类似文件 (配置认证流程)

**复用文件（来自story 1-1）：**
- MathLearningApp/src/components/FormInput.tsx
- MathLearningApp/src/components/PasswordInput.tsx

### Dependencies

复用story 1-1的依赖：
- `@react-native-async-storage/async-storage`: 用于存储认证令牌
- `react-native-paper`: UI组件库

可能需要添加的新依赖：
- 无新依赖（复用story 1-1的依赖）

### Security Checklist

- [ ] 密码从不存储在本地设备
- [ ] 认证令牌安全存储在AsyncStorage
- [ ] 失败登录尝试被跟踪
- [ ] 多次失败后实施账户锁定
- [ ] 实施速率限制防止暴力攻击
- [ ] 令牌过期处理和刷新机制
- [ ] HTTPS用于所有认证请求
