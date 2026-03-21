# Story 1.1: parent-user-create-account

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want to create a new account with my name, email, and password,
so that I can use the math learning app to help my child with math problems.

## Acceptance Criteria

1. [ ] Parent users can create a new account by providing name, email, and password
2. [ ] The system validates email format and password strength (minimum 8 characters, includes letters and numbers)
3. [ ] The system checks if the email is already registered and displays appropriate error message
4. [ ] After successful registration, the user is automatically logged in and navigated to the home screen
5. [ ] Registration form provides clear feedback and error messages in parent-friendly language
6. [ ] The registration process completes within 5 seconds under normal network conditions
7. [ ] User data is securely stored following the security requirements in the architecture

## Tasks / Subtasks

- [ ] Implement user registration service (AC: 1, 4, 7)
  - [ ] Create user registration API endpoint in api.ts
  - [ ] Implement secure password handling (hashing/salting)
  - [ ] Add user data persistence layer
  - [ ] Integrate with authentication service for auto-login after registration
- [ ] Create registration screen UI (AC: 1, 5)
  - [ ] Design parent-friendly registration form with clear labels
  - [ ] Add input fields for name, email, password, and confirm password
  - [ ] Implement form validation with inline error messages
  - [ ] Add show/hide password toggle for better UX
  - [ ] Ensure responsive design for tablet devices
- [ ] Implement input validation (AC: 2, 3, 5)
  - [ ] Email format validation
  - [ ] Password strength validation (8+ chars, letters + numbers)
  - [ ] Password confirmation matching
  - [ ] Duplicate email check with appropriate error messaging
- [ ] Add navigation and state management (AC: 4, 6)
  - [ ] Implement loading states during registration
  - [ ] Handle successful registration with auto-login and navigation
  - [ ] Handle registration errors with retry options
  - [ ] Optimize for 5-second completion requirement
- [ ] Implement security measures (AC: 7)
  - [ ] Secure data transmission (HTTPS)
  - [ ] Password encryption before storage
  - [ ] Follow security patterns from architecture document
- [ ] Create comprehensive tests (All AC)
  - [ ] Unit tests for registration service
  - [ ] Unit tests for form validation
  - [ ] Integration tests for API endpoints
  - [ ] UI component tests for registration screen

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **API Pattern**: Follow the existing userApi structure in MathLearningApp/src/services/api.ts (lines 178-190)
- **Authentication**: Auto-login after registration - store auth token securely using AsyncStorage
- **Security Requirements**: Follow security architecture from docs/architecture-design.md (数据加密、HTTPS传输)
- **Performance Constraint**: Registration must complete within 5 seconds (per PRD performance requirements)
- **Type Safety**: Use TypeScript interfaces for User type already defined in MathLearningApp/src/types/index.ts

### Source Tree Components to Touch

- **MathLearningApp/src/services/api.ts** (modify)
  - Implement userApi.register function (currently a stub)
  - Add proper error handling and response formatting
  - Follow ApiResponse<T> pattern for consistency

- **MathLearningApp/src/screens/** (new)
  - Create RegisterScreen.tsx for the registration UI
  - Follow naming convention: PascalCase for screen components

- **MathLearningApp/src/components/** (new, optional)
  - Create FormInput.tsx for reusable form input component
  - Create PasswordInput.tsx for password input with show/hide toggle

- **MathLearningApp/src/navigation/** (modify if exists)
  - Add registration screen to navigation stack
  - Configure post-registration navigation flow

- **MathLearningApp/src/services/** (new)
  - Create authService.ts for authentication state management
  - Handle token storage and retrieval

### Testing Standards Summary

- **Unit Tests**: Test registration service, form validation logic
- **Integration Tests**: Test API endpoint responses and error handling
- **UI Tests**: Test screen navigation, form submission, error display
- **Performance Tests**: Verify 5-second registration completion
- **Security Tests**: Verify password handling, data encryption

### Project Structure Notes

- Follow existing file structure patterns from Epic 2 & 3 stories
- Use TypeScript strict mode for type safety
- Maintain consistency with existing API patterns in api.ts
- Screen components go in src/screens/, reusable components in src/components/
- Services go in src/services/ with clear separation of concerns

### Integration Points

- **Post-registration navigation**: Should navigate to HomeScreen.tsx (already exists)
- **Auth state management**: Will be used by story 1-2 (login) and 1-3 (password reset)
- **User profile**: Sets up data for story 1-4 (update profile) and 1-5 (manage child info)

### Technical Constraints

- **React Native version**: 0.74.3 (per package.json)
- **Navigation**: Using @react-navigation/native-stack v6.9.17
- **UI Components**: Using react-native-paper v5.11.14 for Material Design components
- **Storage**: Use AsyncStorage for secure token storage
- **Form Validation**: Implement client-side validation, don't rely solely on server

### Performance Optimization

- Use loading indicators to provide user feedback
- Implement debouncing for input validation
- Minimize re-renders using React.memo or useCallback where appropriate
- Cache API responses to prevent duplicate registration attempts

### References

- [Source: docs/prd.md#功能需求] FR1: 家长用户可以注册和登录系统
- [Source: _planning-artifacts/epics.md#史诗故事-1] 用户管理史诗的故事1.1
- [Source: docs/architecture-design.md#数据库设计] 用户集合(users)结构定义
- [Source: MathLearningApp/src/types/index.ts] User interface definition
- [Source: MathLearningApp/src/services/api.ts] Existing API patterns and userApi stub
- [Source: 2-2-auto-recognize-question-type.md] Reference for API structure patterns
- [Source: 2-3-manually-correct-question-type.md] Reference for component structure patterns

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (glm-4.7)

### Implementation Plan

**阶段1：用户注册服务实现**
- 实现userApi.register函数，完成用户注册API调用
- 添加密码安全处理（加密传输和存储）
- 实现邮箱唯一性检查
- 添加适当的错误处理和重试机制

**阶段2：注册界面UI实现**
- 创建RegisterScreen.tsx，设计家长友好的注册表单
- 使用react-native-paper组件实现Material Design风格
- 添加表单验证和实时错误提示
- 实现密码显示/隐藏切换功能

**阶段3：导航和状态管理**
- 实现注册成功后的自动登录
- 配置从注册屏幕到主页的导航流程
- 使用AsyncStorage安全存储认证令牌
- 添加加载状态和错误处理UI

**阶段4：测试和优化**
- 编写单元测试：注册服务、表单验证
- 编写集成测试：API调用、导航流程
- 进行性能测试：确保5秒内完成注册
- 在真实设备上验证用户体验

### Debug Log References

### Completion Notes List

### File List

**待创建文件：**
- MathLearningApp/src/screens/RegisterScreen.tsx
- MathLearningApp/src/services/authService.ts
- MathLearningApp/src/components/FormInput.tsx (可选，用于提高代码复用性)
- MathLearningApp/src/components/PasswordInput.tsx (可选)
- MathLearningApp/src/screens/__tests__/RegisterScreen.test.tsx
- MathLearningApp/src/services/__tests__/authService.test.ts

**待修改文件：**
- MathLearningApp/src/services/api.ts (实现userApi.register)
- MathLearningApp/src/navigation/App.tsx 或类似导航文件 (添加注册路由)

### Dependencies

可能需要添加的新依赖：
- `@react-native-async-storage/async-storage`: 用于存储认证令牌（如果尚未安装）
- `react-native-keychain`: 用于更安全的凭证存储（可选）
