# Story 2.3: manually-correct-question-type

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want to manually correct the system's question type recognition when it's wrong,
so that I can ensure the system understands exactly what type of problem my child is facing.

## Acceptance Criteria

1. [ ] When the system shows a question type recognition result, there is an option to "Not correct?"
2. [ ] Clicking "Not correct?" shows a list of available question types for manual selection
3. [ ] User can select the correct question type from: addition, subtraction, word problems
4. [ ] After manual selection, the system confirms the choice and proceeds
5. [ ] The manual correction is logged for future AI learning and improvement
6. [ ] The system remembers the user's preference if they make the same correction multiple times
7. [ ] If the question has complex elements (e.g., both addition and subtraction), the system allows primary type selection
8. [ ] The manual correction interface appears within 2 seconds of clicking "Not correct?"

## Tasks / Subtasks

- [x] Create manual correction UI component (AC: 2, 8)
  - [x] Design "Not correct?" button that appears after auto-recognition
  - [x] Create modal or dropdown for question type selection
  - [x] Style the interface to be intuitive and parent-friendly
  - [x] Ensure responsive design for tablet screens
- [x] Implement question type selection logic (AC: 3)
  - [x] Display available question types: addition, subtraction, word problems
  - [x] Handle single selection (no multi-select for this story)
  - [x] Validate selection before proceeding
  - [x] Show confirmation of selected type
- [x] Integrate with existing recognition flow (AC: 1, 4, 5)
  - [x] Modify recognition API to accept manual corrections
  - [x] Update RecognitionResult to include correctedQuestionType field
  - [x] Ensure manual correction triggers subsequent processing steps
  - [x] Log correction data for AI training purposes
- [x] Implement preference learning (AC: 6)
  - [x] Track user corrections by question type patterns
  - [x] Store user preferences locally
  - [x] Apply preferences to future similar questions
  - [x] Provide option to clear learned preferences
- [x] Handle complex question scenarios (AC: 7)
  - [x] Identify questions with multiple operations
  - [x] Allow selection of primary operation type
  - [x] Document edge case for future enhancement
  - [x] Provide guidance on primary type selection
- [x] Add error handling and user feedback (AC: 1, 8)
  - [x] Handle cases where user cancels correction
  - [x] Show loading state during correction
  - [x] Provide clear error messages for invalid selections
  - [x] Ensure smooth cancellation without data loss

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **UI Component Pattern**: Follow existing React Native component structure in MathLearningApp/src/screens/
- **State Management**: Use React Navigation and component state for UI flow
- **API Integration**: Extend recognitionApi to handle manual corrections
- **Performance**: Interface must load within 2 seconds requirement

### Source Tree Components to Touch

- **MathLearningApp/src/screens/CameraScreen.tsx**
  - Add "Not correct?" button after recognition
  - Implement manual correction modal
  - Handle correction result
- **MathLearningApp/src/services/api.ts**
  - Update RecognitionResult interface
  - Add endpoint for manual correction submission
  - Extend recognitionApi with correction method
- **MathLearningApp/src/types/index.ts**
  - Add ManualCorrection interface
  - Update question type enums
- **MathLearningApp/src/components/QuestionTypeSelector.tsx** (new)
  - Create reusable question type selector component

### Testing Standards Summary

- Unit tests for QuestionTypeSelector component
- Integration tests for correction flow
- Performance tests for 2-second requirement
- User acceptance testing for interface intuitiveness

### Project Structure Notes

- Follow React Native component naming conventions: PascalCase
- Keep UI components in src/screens/ and src/components/
- Maintain consistent styling with existing screens
- Use proper TypeScript interfaces for type safety

### References

- [Source: docs/prd.md#功能需求] FR5: 家长可以手动修正系统识别的题目类型
- [Source: _planning-artifacts/epics.md#史诗故事-2] 题目上传与处理史诗的故事2.3
- [Source: MathLearningApp/src/services/api.ts#recognitionApi] Existing recognition API structure
- [Source: 2-2-auto-recognize-question-type.md] Previous story for integration points

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (glm-5)

### Debug Log References
- Component creation: QuestionTypeSelector
- API integration: submitManualCorrection
- Preferences service: AsyncStorage implementation
- Test configuration: Jest setup for React Native

### Completion Notes List
✅ **Task 1: Create manual correction UI component**
- Created QuestionTypeSelector component with Modal interface
- Implemented parent-friendly design with clear descriptions
- Ensured responsive design for tablets
- Load time optimized for < 2 seconds requirement

✅ **Task 2: Implement question type selection logic**
- Added all three question types: addition, subtraction, word problems
- Implemented single-selection mode
- Added visual feedback for selected type
- Confirmation message on selection

✅ **Task 3: Integrate with existing recognition flow**
- Extended RecognitionResult interface with correctedQuestionType and isCorrected fields
- Added ManualCorrection interface for type safety
- Implemented submitManualCorrection API method
- Integrated correction submission in CameraScreen

✅ **Task 4: Implement preference learning**
- Created PreferencesService with AsyncStorage
- Records correction history locally
- Suggests preferred type after 3+ similar corrections
- Provides clearPreferences option

✅ **Task 5: Handle complex question scenarios**
- Primary type selection supported
- Guidance provided for complex questions
- Documented in VERIFICATION.md

✅ **Task 6: Add error handling and user feedback**
- Cancellation handling implemented
- Loading states during API calls
- Clear error messages
- Graceful degradation on API failures

### File List

**New Files Created:**
- MathLearningApp/src/components/QuestionTypeSelector.tsx
- MathLearningApp/src/components/__tests__/QuestionTypeSelector.test.tsx
- MathLearningApp/src/services/preferencesService.ts
- MathLearningApp/jest.config.js
- MathLearningApp/jest.setup.js
- MathLearningApp/VERIFICATION.md

**Modified Files:**
- MathLearningApp/src/screens/CameraScreen.tsx
- MathLearningApp/src/services/api.ts
- MathLearningApp/src/types/index.ts
- MathLearningApp/package.json

### Change Log
- 2026-03-20: Implemented complete manual correction feature with UI component, API integration, and preference learning
- 2026-03-20: Added comprehensive error handling and user feedback
- 2026-03-20: Created verification guide for manual testing