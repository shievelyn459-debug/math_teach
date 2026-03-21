/**
 * ExplanationContent 组件测试
 * Story 3-2: generate-knowledge-point-explanation
 * Task 5 & 7: Create explanation display components and comprehensive tests
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {ExplanationContent} from '../ExplanationContent';
import {
  Explanation,
  ExplanationSource,
  ExplanationSectionType,
  ExplanationFormat,
} from '../../types/explanation';

// Mock AccessibilityInfo
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.AccessibilityInfo = {
    announceForSync: jest.fn(),
    announceForAsync: jest.fn(),
  };
  return RN;
});

// Spy on console.log to avoid spamming test output
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('ExplanationContent Component', () => {
  const mockExplanation: Explanation = {
    id: 'exp-001',
    knowledgePointId: 'kp-add-001',
    knowledgePointName: '10以内加法',
    // Story 3-4: 格式支持字段
    availableFormats: [ExplanationFormat.TEXT],
    currentFormat: ExplanationFormat.TEXT,
    formatMetadata: {
      textContent: '10以内加法讲解内容',
    },
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '什么是10以内加法',
        content: ['加法就是把东西合在一起数一数'],
        order: 1,
      },
      {
        type: ExplanationSectionType.METHODS,
        title: '解题方法',
        content: ['第一步：数手指法', '第二步：画图法'],
        order: 2,
      },
      {
        type: ExplanationSectionType.EXAMPLES,
        title: '常见例题',
        content: [],
        examples: [
          {
            question: '3 + 2 = ?',
            answer: '5',
            steps: ['先数出3个', '再数出2个', '合起来是5个'],
            difficulty: 'easy',
          },
          {
            question: '5 + 3 = ?',
            answer: '8',
            steps: ['先数出5个', '再数出3个', '合起来是8个'],
            difficulty: 'medium',
          },
        ],
        order: 3,
      },
      {
        type: ExplanationSectionType.TIPS,
        title: '辅导技巧',
        content: ['✅ 多鼓励孩子', '❌ 不要批评'],
        order: 4,
      },
    ],
    teachingTips: [
      {
        id: 'tip-001',
        title: '用实物演示',
        description: '用孩子喜欢的玩具来演示',
        dos: ['使用孩子熟悉的物品', '慢慢演示'],
        donts: ['不要一开始就用抽象数字'],
        practiceActivity: '和孩子一起玩积木',
      },
    ],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.95,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render explanation content correctly', () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(getByText('10以内加法')).toBeTruthy();
    expect(getByText(/阅读时间: 5分钟/)).toBeTruthy();
    expect(getByText(/质量分数: 95%/)).toBeTruthy();
  });

  it('should render all section types', () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    // Icon和title是分开渲染的，所以需要分别查找
    expect(getByText('💡')).toBeTruthy();
    expect(getByText('概念说明')).toBeTruthy();
    expect(getByText('📝')).toBeTruthy();
    expect(getByText('解题方法')).toBeTruthy();
    expect(getByText('✏️')).toBeTruthy();
    expect(getByText('常见例题')).toBeTruthy();
    expect(getByText('⭐')).toBeTruthy();
    expect(getByText('辅导技巧')).toBeTruthy();
  });

  it('should expand definition section by default', () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(getByText('加法就是把东西合在一起数一数')).toBeTruthy();
  });

  it('should toggle section expansion on press', async () => {
    const {getByText, queryByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    // Methods section should be collapsed by default
    expect(queryByText('第一步：数手指法')).toBeNull();

    // Press the methods section header
    const methodsHeader = getByText('解题方法');
    fireEvent.press(methodsHeader);

    // Now it should be visible
    await waitFor(() => {
      expect(getByText('第一步：数手指法')).toBeTruthy();
    });

    // Press again to collapse
    fireEvent.press(methodsHeader);

    // Should be collapsed again
    await waitFor(() => {
      expect(queryByText('第一步：数手指法')).toBeNull();
    });
  });

  it('should announce accessibility info on toggle', async () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    const methodsHeader = getByText('解题方法');
    fireEvent.press(methodsHeader);

    await waitFor(() => {
      expect(AccessibilityInfo.announceForSync).toHaveBeenCalledWith('解题方法已展开');
    });
  });

  it('should render examples with steps', () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    // Expand examples section first
    const examplesHeader = getByText('常见例题');
    fireEvent.press(examplesHeader);

    expect(getByText('Q1: 3 + 2 = ?')).toBeTruthy();
    expect(getByText('答案: 5')).toBeTruthy();
    expect(getByText('解题步骤:')).toBeTruthy();
    expect(getByText('1.')).toBeTruthy();
    expect(getByText('先数出3个')).toBeTruthy();
    expect(getByText('再数出2个')).toBeTruthy();
    expect(getByText('合起来是5个')).toBeTruthy();
  });

  it('should show difficulty badge for examples', () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    const examplesHeader = getByText('常见例题');
    fireEvent.press(examplesHeader);

    expect(getByText('难度: 简单')).toBeTruthy();
    expect(getByText('难度: 中等')).toBeTruthy();
  });

  it('should render teaching tips', () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(getByText('💡 家长辅导技巧')).toBeTruthy();
    expect(getByText('用实物演示')).toBeTruthy();
  });

  it('should expand teaching tip on press', async () => {
    const {getByText, queryByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    // Tip content should be collapsed by default
    expect(queryByText('用孩子喜欢的玩具来演示')).toBeNull();

    // Press the tip header
    const tipHeader = getByText('用实物演示');
    fireEvent.press(tipHeader);

    // Now content should be visible
    await waitFor(() => {
      expect(getByText('用孩子喜欢的玩具来演示')).toBeTruthy();
      expect(getByText('✅ 应该这样做:')).toBeTruthy();
      expect(getByText('❌ 不要这样做:')).toBeTruthy();
      expect(getByText('🎯 实践活动')).toBeTruthy();
    });
  });

  it('should call onSectionPress callback when section is pressed', () => {
    const onSectionPress = jest.fn();
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
        onSectionPress={onSectionPress}
      />
    );

    const methodsHeader = getByText('解题方法');
    fireEvent.press(methodsHeader);

    expect(onSectionPress).toHaveBeenCalledWith(ExplanationSectionType.METHODS);
  });

  it('should handle empty explanation gracefully', () => {
    const emptyExplanation: Explanation = {
      ...mockExplanation,
      sections: [],
      teachingTips: [],
    };

    const {toJSON} = render(
      <ExplanationContent
        explanation={emptyExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should display dos and donts in teaching tips', async () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    const tipHeader = getByText('用实物演示');
    fireEvent.press(tipHeader);

    await waitFor(() => {
      expect(getByText('使用孩子熟悉的物品')).toBeTruthy();
      expect(getByText('慢慢演示')).toBeTruthy();
      expect(getByText('不要一开始就用抽象数字')).toBeTruthy();
    });
  });

  it('should display practice activity when available', async () => {
    const {getByText, queryByText} = render(
      <ExplanationContent
        explanation={mockExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(queryByText('和孩子一起玩积木')).toBeNull();

    const tipHeader = getByText('用实物演示');
    fireEvent.press(tipHeader);

    await waitFor(() => {
      expect(getByText('和孩子一起玩积木')).toBeTruthy();
    });
  });
});

describe('ExplanationContent Component Edge Cases', () => {
  const minimalExplanation: Explanation = {
    id: 'exp-minimal',
    knowledgePointId: 'kp-test',
    knowledgePointName: '测试知识点',
    // Story 3-4: 格式支持字段
    availableFormats: [ExplanationFormat.TEXT],
    currentFormat: ExplanationFormat.TEXT,
    formatMetadata: {
      textContent: '测试讲解内容',
    },
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '定义',
        content: ['简单定义'],
        order: 1,
      },
    ],
    teachingTips: [],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.5,
    version: 1,
    reviewed: false,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should handle explanation without examples section', () => {
    const {queryByText} = render(
      <ExplanationContent
        explanation={minimalExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(queryByText('常见例题')).toBeNull();
  });

  it('should handle explanation with low quality score', () => {
    const {getByText} = render(
      <ExplanationContent
        explanation={minimalExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(getByText(/质量分数: 50%/)).toBeTruthy();
  });

  it('should handle explanation with many sections', () => {
    const manySections: Explanation = {
      ...minimalExplanation,
      availableFormats: [ExplanationFormat.TEXT],
      currentFormat: ExplanationFormat.TEXT,
      formatMetadata: {
        textContent: '多章节测试',
      },
      sections: [
        {
          type: ExplanationSectionType.DEFINITION,
          title: '定义1',
          content: ['内容1'],
          order: 1,
        },
        {
          type: ExplanationSectionType.METHODS,
          title: '方法1',
          content: ['方法内容'],
          order: 2,
        },
        {
          type: ExplanationSectionType.EXAMPLES,
          title: '例题',
          content: [],
          examples: [],
          order: 3,
        },
        {
          type: ExplanationSectionType.TIPS,
          title: '技巧',
          content: ['技巧内容'],
          order: 4,
        },
      ],
    };

    const {getByText} = render(
      <ExplanationContent
        explanation={manySections}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(getByText('定义1')).toBeTruthy();
    expect(getByText('方法1')).toBeTruthy();
    expect(getByText('例题')).toBeTruthy();
    expect(getByText('技巧')).toBeTruthy();
  });
});

// ============ Story 3-4: 多格式支持测试 ============
describe('ExplanationContent Component - Format Rendering (Story 3-4)', () => {
  const createExplanationWithFormats = (
    availableFormats: ExplanationFormat[],
    currentFormat: ExplanationFormat
  ): Explanation => ({
    id: 'exp-format-test',
    knowledgePointId: 'kp-format-test',
    knowledgePointName: '格式测试知识点',
    availableFormats,
    currentFormat,
    formatMetadata: {
      textContent: '格式测试内容',
    },
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '定义',
        content: ['测试定义内容'],
        order: 1,
      },
    ],
    teachingTips: [],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.9,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  /**
   * AC: 2 - 支持多种显示格式
   */
  it('should render TEXT format correctly', () => {
    const explanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT],
      ExplanationFormat.TEXT
    );

    const {getByText} = render(
      <ExplanationContent
        explanation={explanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(getByText('格式测试知识点')).toBeTruthy();
    expect(getByText(/阅读时间: 2分钟/)).toBeTruthy();
    expect(getByText('测试定义内容')).toBeTruthy();
  });

  /**
   * AC: 4 - 格式选择器与内容渲染集成
   */
  it('should display placeholder for ANIMATION format', () => {
    const explanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT, ExplanationFormat.ANIMATION],
      ExplanationFormat.ANIMATION
    );

    const {getByText} = render(
      <ExplanationContent
        explanation={explanation}
        currentFormat={ExplanationFormat.ANIMATION}
      />
    );

    expect(getByText('动画演示 即将推出')).toBeTruthy();
    expect(getByText(/我们正在为这个知识点制作生动的动画演示/)).toBeTruthy();
    expect(getByText(/预计上线时间/)).toBeTruthy();
  });

  /**
   * AC: 4 - 格式选择器与内容渲染集成
   */
  it('should display placeholder for VIDEO format', () => {
    const explanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT, ExplanationFormat.VIDEO],
      ExplanationFormat.VIDEO
    );

    const {getByText} = render(
      <ExplanationContent
        explanation={explanation}
        currentFormat={ExplanationFormat.VIDEO}
      />
    );

    expect(getByText('视频讲解 即将推出')).toBeTruthy();
    expect(getByText(/专业老师正在录制这个知识点的视频讲解/)).toBeTruthy();
    expect(getByText(/预计上线时间/)).toBeTruthy();
  });

  /**
   * 格式占位符应该包含友好提示
   */
  it('should show friendly hint in format placeholder', () => {
    const explanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT, ExplanationFormat.ANIMATION],
      ExplanationFormat.ANIMATION
    );

    const {getByText} = render(
      <ExplanationContent
        explanation={explanation}
        currentFormat={ExplanationFormat.ANIMATION}
      />
    );

    expect(getByText(/💡 您可以先查看文字讲解，内容同样详细易懂/)).toBeTruthy();
  });

  /**
   * 格式切换后内容应该正确更新
   */
  it('should update content when format changes', () => {
    const explanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT, ExplanationFormat.ANIMATION],
      ExplanationFormat.TEXT
    );

    // 渲染TEXT格式
    const {getByText, rerender} = render(
      <ExplanationContent
        explanation={explanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    expect(getByText('测试定义内容')).toBeTruthy();

    // 切换到ANIMATION格式
    rerender(
      <ExplanationContent
        explanation={explanation}
        currentFormat={ExplanationFormat.ANIMATION}
      />
    );

    expect(getByText('动画演示 即将推出')).toBeTruthy();
  });

  /**
   * 所有三种格式枚举值都应该被支持
   */
  it('should support all format enum values', () => {
    const textExplanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT],
      ExplanationFormat.TEXT
    );

    const animationExplanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT, ExplanationFormat.ANIMATION],
      ExplanationFormat.ANIMATION
    );

    const videoExplanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT, ExplanationFormat.VIDEO],
      ExplanationFormat.VIDEO
    );

    const {getByText: getTextForText} = render(
      <ExplanationContent
        explanation={textExplanation}
        currentFormat={ExplanationFormat.TEXT}
      />
    );

    const {getByText: getTextForAnimation} = render(
      <ExplanationContent
        explanation={animationExplanation}
        currentFormat={ExplanationFormat.ANIMATION}
      />
    );

    const {getByText: getTextForVideo} = render(
      <ExplanationContent
        explanation={videoExplanation}
        currentFormat={ExplanationFormat.VIDEO}
      />
    );

    expect(getTextForText('格式测试知识点')).toBeTruthy();
    expect(getTextForAnimation('动画演示 即将推出')).toBeTruthy();
    expect(getTextForVideo('视频讲解 即将推出')).toBeTruthy();
  });

  /**
   * 格式占位符应该有正确的样式结构
   */
  it('should render format placeholder with correct structure', () => {
    const explanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT, ExplanationFormat.ANIMATION],
      ExplanationFormat.ANIMATION
    );

    const {getByTestId, toJSON} = render(
      <ExplanationContent
        explanation={explanation}
        currentFormat={ExplanationFormat.ANIMATION}
      />
    );

    const renderedTree = toJSON();
    expect(renderedTree).toBeTruthy();

    // 验证占位符包含关键元素
    expect(getByText(/🎬/)).toBeTruthy();
    expect(getByText(/动画演示 即将推出/)).toBeTruthy();
  });

  /**
   * 格式切换不应该破坏内容组件的其他功能
   */
  it('should maintain other functionality when format changes', () => {
    const explanation = createExplanationWithFormats(
      [ExplanationFormat.TEXT, ExplanationFormat.ANIMATION],
      ExplanationFormat.ANIMATION
    );

    const onSectionPress = jest.fn();

    const {getByText} = render(
      <ExplanationContent
        explanation={explanation}
        currentFormat={ExplanationFormat.ANIMATION}
        onSectionPress={onSectionPress}
      />
    );

    // 即使使用占位符格式，组件也应该正常渲染
    expect(getByText('动画演示 即将推出')).toBeTruthy();
  });
});
