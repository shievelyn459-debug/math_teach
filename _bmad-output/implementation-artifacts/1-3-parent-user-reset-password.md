# Story 1.3: parent-user-reset-password

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want to reset my forgotten password via email,
so that I can regain access to my account and continue helping my child with math.

## Acceptance Criteria

1. [ ] Users can request a password reset from the login screen by providing their registered email
2. [ ] The system validates the email and sends a reset link if the email exists in the system
3. [ ] For security, the system displays the same message whether email exists or not (prevents email enumeration)
4. [ ] The reset link expires after 1 hour for security
5. [ ] Users can set a new password using the reset link/token
6. [ ] New password must meet security requirements (8+ chars, letters + numbers)
7. [ ] After successful reset, users can log in with the new password
8. [ ] The reset process completes within 5 seconds for email sending and 3 seconds for password update
9. [ ] Users receive clear feedback at each step of the process

## Tasks / Subtasks

- [ ] Implement password reset request service (AC: 1, 2, 3, 8)
  - [ ] Create password reset request API endpoint in api.ts
  - [ ] Implement email validation
  - [ ] Add security measure to prevent email enumeration
  - [ ] Generate secure reset token with expiration
  - [ ] Send reset email with token/link
- [ ] Create password reset request UI (AC: 1, 9)
  - [ ] Create PasswordResetRequestScreen.tsx
  - [ ] Add email input field
  - [ ] Implement "Send Reset Link" button
  - [ ] Add navigation back to login screen
  - [ ] Show success message after sending
- [ ] Implement new password setting service (AC: 4, 5, 6, 7, 8)
  - [ ] Create password reset confirmation API endpoint
  - [ ] Validate reset token and check expiration
  - [ ] Implement password strength validation
  - [ ] Update password in secure storage
  - [ ] Invalidate reset token after use
- [ ] Create new password UI (AC: 5, 6, 9)
  - [ ] Create SetNewPasswordScreen.tsx
  - [ ] Add new password and confirm password fields
  - [ ] Implement password strength indicator
  - [ ] Show error if passwords don't match
  - [ ] Add navigation to login after successful reset
- [ ] Implement security measures (AC: 3, 4)
  - [ ] Generate secure random tokens (use crypto library)
  - [ ] Set token expiration to 1 hour
  - [ ] Invalidate token after successful reset
  - [ ] Prevent reuse of expired tokens
- [ ] Add email service integration (AC: 2)
  - [ ] Integrate with email service provider
  - [ ] Design reset email template with reset link
  - [ ] Handle email delivery failures gracefully
- [ ] Create comprehensive tests (All AC)
  - [ ] Unit tests for reset request service
  - [ ] Unit tests for password update service
  - [ ] Unit tests for token validation and expiration
  - [ ] Integration tests for API endpoints
  - [ ] UI component tests for both screens

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **API Pattern**: Follow the existing userApi structure in MathLearningApp/src/services/api.ts
- **Security Pattern**: Implement secure token generation using crypto libraries
- **Email Service**: May need to integrate with email provider (e.g., SendGrid, AWS SES)
- **Performance Constraint**: Email sending within 5 seconds, password update within 3 seconds
- **Security Constraint**: Prevent email enumeration, use secure tokens
- **Type Safety**: Use TypeScript interfaces for type safety

### Source Tree Components to Touch

- **MathLearningApp/src/services/api.ts** (modify)
  - Add passwordResetApi with requestReset and confirmReset methods
  - Follow ApiResponse<T> pattern for consistency
  - Add proper error handling

- **MathLearningApp/src/screens/** (new)
  - Create PasswordResetRequestScreen.tsx for email input
  - Create SetNewPasswordScreen.tsx for new password form
  - Follow PascalCase naming convention

- **MathLearningApp/src/services/** (new)
  - Create passwordResetService.ts for reset logic
  - Handle token generation and validation
  - Manage reset state

- **MathLearningApp/src/navigation/** (modify)
  - Add reset screens to navigation flow
  - Handle deep linking for reset emails (reset token in URL)
  - Configure navigation between login, reset request, and new password screens

- **MathLearningApp/src/components/** (reuse)
  - Reuse FormInput.tsx and PasswordInput.tsx from story 1-1
  - Reuse or extend PasswordInput for strength indicator

### Previous Story Intelligence (Story 1-1 & 1-2 Context)

**Story 1-1 (parent-user-create-account) established patterns:**
1. **Form Components**: FormInput and PasswordInput for reusability
2. **Validation**: Client-side validation patterns
3. **UI Pattern**: react-native-paper components
4. **Error Handling**: User-friendly error messages

**Story 1-2 (parent-user-login) established patterns:**
1. **Auth Service**: authService.ts for authentication management
2. **Navigation**: Login screen with links to other auth screens
3. **Security**: Failed attempt tracking and rate limiting

**Integration Points:**
- Link from LoginScreen (story 1-2) to PasswordResetRequestScreen
- Use same User interface and validation patterns
- Follow API structure from previous stories
- Extend authService.ts to handle reset state

### Security Considerations

**Critical Security Requirements:**
1. **Prevent Email Enumeration**: Always show same message regardless of whether email exists
2. **Secure Tokens**: Use cryptographically secure random token generation
3. **Token Expiration**: 1-hour expiration for reset links
4. **One-time Use**: Invalidate token after successful password change
5. **Rate Limiting**: Limit reset requests per email to prevent abuse

**Token Generation Best Practices:**
- Use crypto.randomBytes() or equivalent
- Minimum 32 bytes of entropy
- Store hashed tokens, not plain tokens
- Include timestamp for expiration checking

### Testing Standards Summary

- **Unit Tests**: Token generation, validation, expiration logic
- **Integration Tests**: API endpoints, email service integration
- **Security Tests**: Email enumeration prevention, token security
- **UI Tests**: Both screens, navigation flow, error messages
- **Performance Tests**: Verify timing constraints

### Project Structure Notes

- Follow existing file structure patterns from stories 1-1 and 1-2
- Reuse components created in story 1-1 (FormInput, PasswordInput)
- Maintain consistency with existing API patterns
- Screen components in src/screens/, services in src/services/
- Create dedicated passwordResetService.ts for reset logic

### Integration Points

- **Login Screen**: Add "Forgot Password?" link to PasswordResetRequestScreen
- **New Password Screen**: Navigate back to LoginScreen after successful reset
- **Email Service**: May require backend integration for sending emails
- **Deep Linking**: Handle reset links from emails (token in URL params)

### Technical Constraints

- **React Native version**: 0.74.3
- **Navigation**: Using @react-navigation/native-stack v6.9.17
- **UI Components**: Using react-native-paper v5.11.14
- **Crypto**: Use react-native-crypto or equivalent for secure token generation
- **Deep Linking**: Configure react navigation for handling email links

### Email Template Requirements

The reset email should include:
- Clear subject line indicating password reset
- User's name for personalization
- Reset button/link with token
- Expiration notice (1 hour)
- Security warning (ignore if not requested)
- Support contact information

### Error Scenarios to Handle

- Invalid email format
- Email not found (show generic message)
- Expired reset token
- Invalid reset token
- Token already used
- New password doesn't meet requirements
- Passwords don't match
- Network errors during API calls
- Email delivery failures

### User Flow

1. User clicks "Forgot Password?" on LoginScreen
2. User enters email on PasswordResetRequestScreen
3. System sends reset email (shows success message regardless)
4. User clicks reset link in email (deep link to app)
5. User enters new password on SetNewPasswordScreen
6. System validates token and updates password
7. User navigates to LoginScreen to log in with new password

### References

- [Source: docs/prd.md#功能需求] FR1: 家长用户可以重置忘记的密码
- [Source: _planning-artifacts/epics.md#史诗故事-1] 用户管理史诗的故事1.3
- [Source: docs/architecture-design.md#安全架构设计] 安全要求和模式
- [Source: MathLearningApp/src/types/index.ts] User interface definition
- [Source: MathLearningApp/src/services/api.ts] Existing API patterns
- [Source: 1-1-parent-user-create-account.md] Form components and validation patterns
- [Source: 1-2-parent-user-login.md] Auth screen patterns and navigation

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (glm-4.7)

### Implementation Plan

**阶段1：密码重置请求服务实现**
- 在api.ts中添加passwordResetApi.requestReset函数
- 实现邮箱验证和安全消息返回（防止邮箱枚举）
- 生成安全重置令牌（加密随机、1小时过期）
- 集成邮件服务发送重置链接

**阶段2：重置请求界面实现**
- 创建PasswordResetRequestScreen.tsx
- 复用story 1-1的FormInput组件
- 实现"发送重置链接"按钮
- 添加成功/错误提示消息
- 添加返回登录屏幕的导航

**阶段3：新密码设置服务实现**
- 在api.ts中添加passwordResetApi.confirmReset函数
- 实现令牌验证和过期检查
- 实现密码强度验证
- 更新密码并使令牌失效

**阶段4：新密码界面实现**
- 创建SetNewPasswordScreen.tsx
- 复用PasswordInput组件并添加强度指示器
- 添加确认密码字段和匹配验证
- 实现成功后导航到登录屏幕

**阶段5：导航和深度链接配置**
- 在LoginScreen添加"忘记密码？"链接
- 配置深度链接处理邮件中的重置链接
- 实现令牌从URL参数的提取和验证
- 处理所有错误场景和重试流程

**阶段6：测试和安全验证**
- 编写单元测试：令牌生成、验证、过期逻辑
- 编写集成测试：API端点、邮件服务
- 进行安全测试：邮箱枚举防护、令牌安全
- 在真实设备上验证完整流程

### Debug Log References

### Completion Notes List

### File List

**待创建文件：**
- MathLearningApp/src/screens/PasswordResetRequestScreen.tsx
- MathLearningApp/src/screens/SetNewPasswordScreen.tsx
- MathLearningApp/src/services/passwordResetService.ts
- MathLearningApp/src/screens/__tests__/PasswordResetRequestScreen.test.tsx
- MathLearningApp/src/screens/__tests__/SetNewPasswordScreen.test.tsx
- MathLearningApp/src/services/__tests__/passwordResetService.test.ts

**待修改文件：**
- MathLearningApp/src/services/api.ts (添加passwordResetApi)
- MathLearningApp/src/screens/LoginScreen.tsx (添加"忘记密码？"链接)
- MathLearningApp/src/navigation/App.tsx (配置重置流程和深度链接)

**复用文件（来自story 1-1）：**
- MathLearningApp/src/components/FormInput.tsx
- MathLearningApp/src/components/PasswordInput.tsx

### Dependencies

复用story 1-1和1-2的依赖：
- `@react-native-async-storage/async-storage`: 用于存储临时状态
- `react-native-paper`: UI组件库

可能需要添加的新依赖：
- `react-native-crypto` 或 `expo-crypto`: 用于安全令牌生成
- `react-native-deep-linking`: 用于处理邮件中的重置链接（或使用React Navigation的链接功能）

### Security Checklist

- [ ] 防止邮箱枚举攻击（始终显示相同消息）
- [ ] 使用加密安全的随机令牌生成器
- [ ] 令牌至少32字节熵
- [ ] 令牌1小时后过期
- [ ] 令牌存储使用哈希，非明文
- [ ] 成功重置后令牌失效
- [ ] 实施速率限制防止滥用
- [ ] HTTPS用于所有重置请求
- [ ] 密码强度验证：8+字符，字母+数字
- [ ] 新密码和确认密码匹配验证
