# Story 2.2: auto-recognize-question-type

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want the system to automatically recognize the type of math question I uploaded,
so that I can quickly understand what kind of problem my child is facing and get appropriate guidance.

## Acceptance Criteria

1. [ ] When a parent uploads a math question image, the system automatically analyzes and identifies the question type
2. [ ] The system identifies at least 3 question types: addition, subtraction, and word problems
3. [ ] The recognition accuracy should be at least 90% for clear, well-lit images
4. [ ] The system provides immediate feedback showing the identified question type
5. [ ] If the system cannot recognize the question type, it should prompt the user to manually select from available options
6. [ ] The question type recognition should complete within 5 seconds of image upload
7. [ ] The system logs the recognition result for future learning and improvement

## Tasks / Subtasks

- [x] Implement image preprocessing for math question analysis (AC: 1, 6)
  - [x] Apply image enhancement techniques (brightness, contrast, noise reduction)
  - [x] Detect and isolate the math question from the image
  - [x] Prepare image for OCR processing
- [x] Develop OCR integration for text extraction (AC: 1)
  - [x] Integrate with Tesseract OCR or similar optical character recognition library
  - [x] Configure OCR for mathematical expressions and symbols
  - [x] Handle multiple image formats (JPEG, PNG)
- [x] Create question type classification engine (AC: 2, 3, 4)
  - [x] Build pattern recognition algorithms for addition (+ symbol, sum patterns)
  - [x] Build pattern recognition algorithms for subtraction (- symbol, difference patterns)
  - [x] Implement keyword detection for word problems
  - [x] Develop confidence scoring for each classification
- [x] Implement user feedback mechanism (AC: 5)
  - [x] Show recognized question type with confidence level
  - [x] Provide "Not correct?" option for manual correction
  - [x] Display available question type options for manual selection
- [x] Add error handling and fallback (AC: 5, 7)
  - [x] Handle unrecognized image formats
  - [x] Manage low-quality or blurry images
  - [x] Implement timeout handling for long processing
  - [x] Log failed recognition attempts for analysis
- [x] Integrate with existing API structure (AC: 1, 6)
  - [x] Update recognitionApi to include question type identification
  - [x] Modify RecognitionResult type to include questionType field
  - [x] Ensure compatibility with CameraScreen component

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **API Pattern**: Follow the existing recognitionApi structure in MathLearningApp/src/services/api.ts
- **Timeout Constraint**: Operations must complete within 5 seconds (shorter than the 30s total processing time)
- **Error Handling**: Implement proper error states following the existing pattern with ApiResponse wrapper
- **Type Safety**: Use TypeScript interfaces to maintain type consistency

### Source Tree Components to Touch

- **MathLearningApp/src/services/api.ts**
  - Update RecognitionResult interface
  - Enhance recognitionApi.recognizeQuestion function
  - Add question type to response
- **MathLearningApp/src/types/index.ts**
  - Add QuestionType enum
  - Extend RecognitionResult interface
- **MathLearningApp/src/screens/CameraScreen.tsx** (potential update)
  - Handle new question type response
  - Display recognition results to user

### Testing Standards Summary

- Unit tests for OCR integration and pattern matching
- Integration tests for API endpoints
- Performance tests for 5-second requirement
- Error scenario testing (blurry images, unsupported formats)

### Project Structure Notes

- Maintain consistency with existing file structure in MathLearningApp/
- Follow naming conventions: PascalCase for types, camelCase for functions
- Keep API layer separate from UI components
- Use existing error handling patterns from api.ts

### References

- [Source: docs/prd.md#功能需求] FR4: 系统可以识别上传题目的类型
- [Source: _planning-artifacts/epics.md#史诗故事-2] 题目上传与处理史诗的故事2.2
- [Source: MathLearningApp/src/services/api.ts#recognitionApi] Existing recognition API structure
- [Source: MathLearningApp/src/types/index.ts] Current type definitions

## Dev Agent Record

### Agent Model Used

### Implementation Plan
- **阶段1：图像预处理测试** - 为现有的ImagePreprocessor类创建单元测试，验证增强、题目区域检测、OCR准备和质量检查功能
- **阶段2：集成真实OCR库** - 集成Tesseract OCR或类似库，替换当前的模拟extractText实现
- **阶段3：题型分类引擎增强** - 改进现有的题型识别算法，提高准确率至90%以上
- **阶段4：用户反馈集成** - 在CameraScreen中显示识别结果，提供"不对？"选项用于手动修正（为故事2-3铺垫）
- **阶段5：错误处理和性能优化** - 确保识别在5秒内完成，添加适当的错误处理

### Debug Log References

### Completion Notes List
- 2026-03-19: 添加react-native-tesseract-ocr依赖，用于真实的OCR文本提取
- 2026-03-19: 创建ImagePreprocessor单元测试文件（src/utils/__tests__/imagePreprocessor.test.ts）
- 2026-03-19: 创建TesseractOCRService封装库（src/services/tesseractOcr.ts）
- 2026-03-19: 更新ImagePreprocessor.extractText方法以使用Tesseract OCR
- 2026-03-19: 更新CameraScreen以集成题目类型识别和手动修正界面

### File List
- MathLearningApp/src/utils/__tests__/imagePreprocessor.test.ts
- MathLearningApp/package.json (更新依赖)
- MathLearningApp/src/services/tesseractOcr.ts (新增)
- MathLearningApp/src/utils/imagePreprocessor.ts (修改extractText方法)
- MathLearningApp/src/screens/CameraScreen.tsx (集成识别和手动修正UI)