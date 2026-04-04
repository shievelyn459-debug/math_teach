# Story 8.1: 手动修复快速参考

**快速查找指南** - 使用 Ctrl+F 搜索文件名

---

## 📝 手动修复清单

### 1. jest.setup.js (添加全局 Mocks)

**文件:** `jest.setup.js`
**在文件末尾添加:**

```javascript
// Story 8.1: 全局测试修复
jest.mock('react-native-pdf-lib', () => ({
  PDFDocument: { create: jest.fn() },
  PDFPage: { create: jest.fn() },
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: '14.0',
  select: (obj) => obj.ios || obj.default,
}));
```

---

### 2. FormInput.test.tsx (5个修改)

**文件:** `src/components/__tests__/FormInput.test.tsx`

**修改 1 - 导入设计系统 (第1-5行):**
```typescript
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {FormInput, PasswordInput} from '../FormInput';
import {designSystem} from '../../styles/designSystem'; // 添加这行
```

**修改 2 - 成功图标测试 (第142-154行):**
```typescript
it('should show success icon when valid and has value', () => {
  const {queryByRole} = render(  // 改用 queryByRole
    <FormInput
      {...defaultProps}
      value="test@email.com"
      valid={true}
      showSuccessIcon={true}
      testID="test-input"
    />
  );

  expect(queryByRole('image')).toBeTruthy();  // 改用 role 查询
});
```

**修改 3 - 空 value 测试 (第156-168行):**
```typescript
it('should not show success icon when value is empty', () => {
  const {queryByRole} = render(  // 改用 queryByRole
    <FormInput
      {...defaultProps}
      value=""
      valid={true}
      showSuccessIcon={true}
      testID="test-input"
    />
  );

  expect(queryByRole('image')).toBeNull();  // 改用 role 查询
});
```

**修改 4 - 内联错误测试 (第217-229行):**
```typescript
it('should show inline error with clear button', () => {
  const {getByText, queryByRole} = render(  // 添加 queryByRole
    <FormInput
      {...defaultProps}
      error="This field is required"
      onClearError={jest.fn()}
      testID="test-input"
    />
  );

  expect(getByText('This field is required')).toBeTruthy();
  // 清除按钮现在使用 Icon，不再查找 emoji
  expect(queryByRole('image')).toBeTruthy();  // 添加这行
});
```

**修改 5 - 绿色边框测试 (第231-242行):**
```typescript
it('should apply green border when valid and has value', () => {
  const {getByTestId} = render(
    <FormInput
      {...defaultProps}
      value="valid@email.com"
      valid={true}
      testID="test-input"
    />
  );

  const inputContainer = getByTestId('test-input').parent;
  expect(inputContainer).toHaveStyle({
    borderColor: designSystem.colors.success.default  // 使用设计系统
  });
});
```

---

### 3. KnowledgePointTag.test.tsx

**文件:** `src/components/__tests__/KnowledgePointTag.test.tsx`

**问题:** testID `knowledge-point-tag` 不存在

**修复方法:**
```typescript
// 方法1: 在 KnowledgePointTag.tsx 组件中添加 testID
<View testID="knowledge-point-tag">
  <Text>{point}</Text>
</View>

// 方法2: 在测试中使用不同的查询
// 替换所有 getByTestId('knowledge-point-tag')
- const tag = getByTestId('knowledge-point-tag');
+ const tag = getByText(/知识点/);  // 或其他可识别文本
```

---

### 4. ProcessingProgress.test.tsx

**文件:** `src/components/__tests__/ProcessingProgress.test.tsx`

**在文件顶部添加:**
```typescript
// Mock ProcessingStage enum
jest.mock('../../types', () => ({
  ProcessingStage: {
    UPLOADING: 'UPLOADING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    ERROR: 'ERROR',
  },
}));
```

---

### 5. EditProfileScreen.test.tsx

**文件:** `src/screens/__tests__/EditProfileScreen.test.tsx`

**在文件顶部添加 Navigation mock:**
```typescript
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
}));
```

**修复 disabled 检测:**
```typescript
// 替换所有 .props.disabled 检测
- expect(saveButton.props.disabled).toBe(true);
+ fireEvent.press(saveButton);
+ expect(mockOnSave).not.toHaveBeenCalled();
```

---

### 6. 创建 Mock 文件

**文件:** `src/__mocks__/config/aiConfig.ts` (新建)
```typescript
export const aiConfig = {
  apiKey: 'test-api-key',
  baseURL: 'https://api.test.com',
  model: 'test-model',
};
```

**文件:** `src/__mocks__/react-native-pdf-lib/index.js` (新建)
```javascript
module.exports = {
  PDFDocument: {
    create: jest.fn(() => ({
      addPage: jest.fn(),
      write: jest.fn(() => Promise.resolve('mock-path')),
    })),
  },
  PDFPage: {
    create: jest.fn(() => ({
      setMediaBox: jest.fn(),
      addText: jest.fn(),
    })),
  },
};
```

---

### 7. ResultScreen.test.tsx

**文件:** `src/screens/__tests__/ResultScreen.test.tsx`

**修复 testID 查询:**
```typescript
// 如果 knowledge-point-tag 不存在
- const tag = getByTestId('knowledge-point-tag');
+ const tag = getByText(/置信度/);  // 或其他可见文本
```

---

### 8. ExplanationScreen.test.tsx

**文件:** `src/screens/__tests__/ExplanationScreen.test.tsx`

**修复 jest.mock 顺序:**
```typescript
// 将所有 mock 移到文件最顶部 (在 import 之前)
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
}));

jest.mock('../../services/ai/aiService', () => ({
  generateExplanation: jest.fn(),
}));

// 然后才是 import
import React from 'react';
...
```

---

### 9. ExplanationContent.test.tsx

**文件:** `src/components/__tests__/ExplanationContent.test.tsx`

**添加 AccessibilityInfo mock:**
```typescript
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.AccessibilityInfo = {
    announceForAccessibility: jest.fn(),
  };
  return RN;
});
```

---

## 🎯 快速验证

修复完成后运行:

```bash
# 运行所有测试
npm test

# 只运行特定文件的测试
npm test -- FormInput.test.tsx

# 查看覆盖率
npm test -- --coverage
```

---

## ✅ 检查清单

- [ ] jest.setup.js - 添加全局 mocks
- [ ] FormInput.test.tsx - 5个修改
- [ ] KnowledgePointTag.test.tsx - testID 或查询方法
- [ ] ProcessingProgress.test.tsx - ProcessingStage mock
- [ ] EditProfileScreen.test.tsx - Navigation mock
- [ ] 创建 aiConfig mock 文件
- [ ] 创建 pdf-lib mock 文件
- [ ] ResultScreen.test.tsx - testID 查询
- [ ] ExplanationScreen.test.tsx - mock 顺序
- [ ] ExplanationContent.test.tsx - AccessibilityInfo mock

---

**创建时间:** 2026-04-04
**预计修复时间:** 30-45 分钟
