# Story 3.2: generate-knowledge-point-explanation

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want detailed explanations for the knowledge point in my child's math question,
so that I can understand the concept and learn how to explain it to my child effectively.

## Acceptance Criteria

1. [ ] The system generates detailed explanations for each identified knowledge point
2. [ ] Explanations are written in parent-friendly language (not academic jargon)
3. [ ] Explanations include:
    - Concept definition (什么是[知识点])
    - Common methods (解题方法)
    - Typical examples (常见例题)
    - Teaching tips (家长辅导技巧)
4. [ ] Content is appropriate for 1st grade level
5. [ ] Explanations are generated within 3 seconds (part of 30-second budget)
6. [ ] If AI generation fails, fallback to pre-written template explanations
7. [ ] Explanations support multiple formats (Story 3.4: text, animation, video)
8. [ ] Content is reviewed for accuracy and child-appropriateness

## Tasks / Subtasks

- [ ] Design explanation content structure (AC: 2, 3, 4, 8)
  - [ ] Create content template for knowledge point explanations
  - [ ] Define sections: 概念说明、解题方法、例题演示、辅导技巧
  - [ ] Write parent-friendly language guidelines
  - [ ] Create style guide for 1st grade appropriate content
  - [ ] Establish accuracy review process

- [ ] Implement AI-powered explanation generation (AC: 1, 5, 6)
  - [ ] Create explanationService.ts
  - [ ] Integrate with AI API (e.g., OpenAI, Claude, or local LLM)
  - [ ] Design prompts for consistent, high-quality explanations
  - [ ] Implement caching for repeated knowledge points
  - [ ] Add fallback to template explanations on failure
  - [ ] Optimize for speed (< 3 seconds)

- [ ] Create template explanation database (AC: 4, 6, 8)
  - [ ] Write pre-approved explanations for core knowledge points:
    - 数的认识 (1-20)
    - 10以内加减法
    - 20以内进位/退位加减法
    - 简单应用题
    - 认识图形
  - [ ] Store in MongoDB explanations collection
  - [ ] Add version tracking for content updates
  - [ ] Implement content review workflow

- [ ] Implement explanation generation pipeline (AC: 1, 5, 7)
  - [ ] Add explanation step after knowledge point recognition
  - [ ] Support both AI-generated and template-based explanations
  - [ ] Store generated explanations in generation history
  - [ ] Track generation performance metrics
  - [ ] Add quality scoring for AI-generated content

- [ ] Create explanation display components (AC: 2, 3, 8)
  - [ ] Create ExplanationContent component
  - [ ] Implement section-based rendering (collapsible sections)
  - [ ] Add math formula rendering support
  - [ ] Style for readability (parent-friendly design)
  - [ ] Add examples with step-by-step breakdown

- [ ] Add content quality assurance (AC: 8)
  - [ ] Implement content filtering for child-appropriate language
  - [ ] Add safety checks for AI-generated content
  - [ ] Create review queue for low-confidence explanations
  - [ ] Track user feedback on explanation quality
  - [ ] Implement content improvement loop

- [ ] Create comprehensive tests (AC: 1, 5, 6, 7)
  - [ ] Unit tests for explanationService
  - [ ] Integration tests for generation pipeline
  - [ ] Performance tests for 3-second requirement
  - [ ] Quality tests for content accuracy
  - [ ] Fallback behavior tests

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **Content Target**: Parents of 1st grade students (not teachers or students)
- **Language Style**: 简单易懂, 避免专业术语, 使用生活化比喻
- **AI Integration**: Use LLM for dynamic generation with template fallback
- **Performance**: Must complete within 3 seconds (part of 30-second budget)
- **Content Safety**: All explanations reviewed for child-appropriateness
- **Localization**: All content in Simplified Chinese

### Source Tree Components to Touch

- **MathLearningApp/src/services/explanationService.ts** (new)
  - Implement AI-powered explanation generation
  - Template-based fallback system
  - Caching for repeated knowledge points
  - Content quality scoring

- **MathLearningApp/src/components/ExplanationContent.tsx** (new)
  - Display explanation sections
  - Collapsible section rendering
  - Math formula display
  - Step-by-step examples

- **MathLearningApp/src/screens/ExplanationScreen.tsx** (new)
  - Full-screen explanation view
  - Knowledge point header
  - Navigation between sections
  - Link to examples and practice

- **MathLearningApp/src/services/api.ts**
  - Add explanation generation endpoint
  - Update GenerationResult with explanation field
  - Add explanation feedback endpoint

- **MathLearningApp/src/types/index.ts**
  - Add Explanation interface
  - Add ExplanationSection interface
  - Add ExplanationSource enum (ai, template)

- **MathLearningApp/src/database/explanations.ts** (new)
  - Seed data for template explanations
  - Content version tracking
  - Quality review workflow

### Testing Standards Summary

- Unit tests for explanationService generation
- Integration tests for end-to-end pipeline
- Performance tests for 3-second SLA
- Quality tests for content accuracy and appropriateness
- UI component tests for ExplanationContent

### Project Structure Notes

- Follow React Native component naming conventions: PascalCase
- Keep services in src/services/ and database in src/database/
- Maintain consistent styling with existing components
- Use proper TypeScript interfaces for type safety
- Align with previous stories' implementation patterns

### Previous Story Intelligence

From Story 3-1 (auto-recognize-knowledge-point):
- **Knowledge Point Structure**: Taxonomy based on curriculum standards
- **Performance Budget**: 3 seconds allocated for explanation generation
- **Database Pattern**: MongoDB for content storage
- **UI Components**: KnowledgePointTag links to explanations

From Story 2-5 (process-question-within-30s):
- **Total Budget**: 30 seconds for complete flow
- **Progress Tracking**: Use PerformanceTracker for timing
- **Fallback Strategy**: Graceful degradation on failures

**Key Learnings:**
1. Parent-friendly language is critical (avoid jargon)
2. Performance budget requires caching
3. AI generation needs template fallback
4. Content quality must be assured
5. Examples should be step-by-step for clarity

### Git Intelligence Summary

Recent commits show established patterns:
- Functional components with hooks
- Service layer with standalone functions
- MongoDB for data persistence
- React Navigation for screen flow

### Latest Tech Information

**AI-Powered Explanation Generation:**
- **Options**: OpenAI GPT-4, Claude, open-source LLMs (LLaMA, Mistral)
- **Prompt Engineering**: Structure prompts for consistent output format
- **Temperature**: Low (0.3-0.5) for factual, consistent explanations
- **Token Management**: Limit output length for performance
- **Cost Control**: Cache results, use templates for common knowledge points

**Content Quality Assurance:**
- **Filter**: Profanity, inappropriate content, complex jargon
- **Validation**: Check against curriculum standards
- **Review**: Human review for low-confidence AI outputs
- **Feedback**: User ratings and improvement suggestions

**Parent-Friendly Language Guidelines:**
- 使用"孩子"而不是"学生"
- 用生活化比喻解释抽象概念
- 避免数学专业术语（如"加数"、"被加数"）
- 强调"如何教孩子"而不是"如何解题"
- 提供具体话术示例

**Explanation Content Template:**

```markdown
# [知识点名称]

## 什么是[知识点]？
[parent-friendly definition with real-world examples]

## 解题方法
[step-by-step approach in simple language]

## 常见例题
[3-5 representative examples with solutions]

## 家长辅导技巧
- 技巧1: [specific teaching tip]
- 技巧2: [common mistakes to avoid]
- 技巧3: [practice activities]
```

### Database Schema (MongoDB)

```javascript
{
  _id: ObjectId,
  knowledgePointId: ObjectId,  // Reference to knowledge points
  content: {
    definition: String,        // Concept explanation
    methods: [String],         // Solution approaches
    examples: [{
      question: String,
      answer: String,
      steps: [String]          // Step-by-step breakdown
    }],
    tips: [String]             // Teaching tips for parents
  },
  source: String,              // 'ai' or 'template'
  qualityScore: Number,        // 0-1 confidence rating
  version: Number,             // For content updates
  reviewed: Boolean,           // Human review flag
  createdAt: Date,
  updatedAt: Date
}
```

### API Integration

**AI Service Options:**
1. **OpenAI GPT-4**: Best quality, higher cost
2. **Anthropic Claude**: Good for educational content
3. **Local LLM (Ollama)**: Free, lower quality, good for MVP
4. **Template Fallback**: Always available, no cost

**Prompt Engineering Example:**
```
你是一个专业的家长教育顾问。请为小学一年级数学知识点"[知识点名称]"编写家长辅导指南。

要求：
1. 使用简单易懂的语言，避免专业术语
2. 提供生活化的比喻和例子
3. 包含具体的教学话术
4. 适合6-7岁儿童的认知水平

请按照以下结构输出：
- 概念说明：用家长能理解的方式解释
- 解题方法：分步骤说明如何教孩子
- 例题演示：3个典型例题及解答
- 辅导技巧：给家长的具体建议
```

### References

- [Source: docs/prd.md#功能需求] FR8: 系统可以生成针对该知识点的讲解内容
- [Source: _planning-artifacts/epics.md#史诗故事-3] US3.2: 系统生成针对该知识点的详细讲解内容
- [Source: docs/architecture-design.md] AI/ML服务层: 讲解内容生成
- [Source: 3-1-auto-recognize-knowledge-point.md] Knowledge point structure
- [Source: 2-5-process-question-within-30s.md] Performance budget integration

## Dev Agent Record

### Agent Model Used
To be filled by dev agent

### Debug Log References
To be filled by dev agent

### Completion Notes List
To be filled by dev agent

### File List
To be filled by dev agent
