/**
 * ExplanationScreen 组件测试
 * Story 3-2: generate-knowledge-point-explanation
 * Task 5 & 7: Create explanation display components and comprehensive tests
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {ExplanationScreen} from '../ExplanationScreen';
import {ExplanationService} from '../../services/explanationService';
import {Explanation, ExplanationSource, ExplanationSectionType} from '../../types/explanation';

// Mock navigation and route
const mockNavigation = {
  setOptions: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: {
    knowledgePointId: 'kp-add-001',
    knowledgePointName: '10以内加法',
    grade: '一年级',
  },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert.alert = jest.fn();
  return RN;
});

// Mock ExplanationService
jest.mock('../../services/explanationService', () => {
  const mockExplanation: Explanation = {
    id: 'exp-001',
    knowledgePointId: 'kp-add-001',
    knowledgePointName: '10以内加法',
    sections: [
      {
        type: 'definition', // 使用字符串字面值代替 ExplanationSectionType.DEFINITION
        title: '什么是10以内加法',
        content: ['加法就是把东西合在一起数一数'],
        order: 1,
      },
      {
        type: 'methods', // 使用字符串字面值代替 ExplanationSectionType.METHODS
        title: '解题方法',
        content: ['第一步：数手指法'],
        order: 2,
      },
      {
        type: 'examples', // 使用字符串字面值代替 ExplanationSectionType.EXAMPLES
        title: '常见例题',
        content: [],
        examples: [
          {
            question: '3 + 2 = ?',
            answer: '5',
            steps: ['数一数'],
            difficulty: 'easy',
          },
        ],
        order: 3,
      },
      {
        type: 'tips', // 使用字符串字面值代替 ExplanationSectionType.TIPS
        title: '辅导技巧',
        content: ['✅ 多鼓励孩子'],
        order: 4,
      },
    ],
    teachingTips: [
      {
        id: 'tip-001',
        title: '用实物演示',
        description: '用玩具演示',
        dos: ['使用玩具'],
        donts: ['不要用抽象数字'],
      },
    ],
    source: 'template', // Use string literal instead of enum
    qualityScore: 0.95,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    getInstance: jest.fn(() => mockService),
    generateExplanation: jest.fn().mockResolvedValue({
      explanation: mockExplanation,
      generationTime: 1200,
      source: 'template' as const,
      fallbackUsed: false,
      qualityMetrics: {
        completeness: 0.95,
        clarity: 0.9,
        childAppropriate: 0.92,
      },
    }),
    submitFeedback: jest.fn().mockResolvedValue({success: true}),
  };

  return {
    ExplanationService: mockService,
    getExplanationService: () => mockService,
  };
});

describe('ExplanationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    const {getByText} = render(<ExplanationScreen />);

    expect(getByText(/正在生成讲解内容/)).toBeTruthy();
    expect(getByText(/通常需要1-3秒/)).toBeTruthy();
  });

  it('should load and display explanation', async () => {
    const {getByText} = render(<ExplanationScreen />);

    await waitFor(() => {
      expect(getByText('10以内加法')).toBeTruthy();
    });

    expect(mockNavigation.setOptions).toHaveBeenCalledWith({
      title: '10以内加法',
    });
  });

  it('should set navigation header with feedback button', async () => {
    render(<ExplanationScreen />);

    await waitFor(() => {
      expect(mockNavigation.setOptions).toHaveBeenCalled();
    });

    const setOptionsCall = mockNavigation.setOptions.mock.calls[0][0];
    expect(setOptionsCall.headerRight).toBeDefined();
  });

  it('should display error state on load failure', async () => {
    const {getExplanationService} = require('../../services/explanationService');
    getExplanationService().generateExplanation.mockRejectedValue(
      new Error('Network error')
    );

    const {getByText} = render(<ExplanationScreen />);

    await waitFor(() => {
      expect(getByText(/加载失败/)).toBeTruthy();
    });

    expect(getByText('重试')).toBeTruthy();
    expect(getByText('返回')).toBeTruthy();
  });

  it('should show quality warning for low quality explanations', async () => {
    const {getExplanationService} = require('../../services/explanationService');
    getExplanationService().generateExplanation.mockResolvedValue({
      explanation: {
        ...require('../../services/explanationService').mockExplanation,
        qualityScore: 0.7,
      },
      generationTime: 1000,
      source: 'template' as const,
      fallbackUsed: false,
      qualityMetrics: {
        completeness: 0.7,
        clarity: 0.7,
        childAppropriate: 0.7,
      },
    });

    const {getByText} = render(<ExplanationScreen />);

    await waitFor(() => {
      expect(
        getByText(/此讲解内容质量评分较低，建议谨慎参考/)
      ).toBeTruthy();
    });
  });

  it('should handle retry on error', async () => {
    const {getExplanationService} = require('../../services/explanationService');
    getExplanationService().generateExplanation
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        explanation: require('../../services/explanationService').mockExplanation,
        generationTime: 1000,
        source: 'template' as const,
        fallbackUsed: false,
        qualityMetrics: {
          completeness: 0.95,
          clarity: 0.9,
          childAppropriate: 0.92,
        },
      });

    const {getByText} = render(<ExplanationScreen />);

    // Wait for error
    await waitFor(() => {
      expect(getByText('重试')).toBeTruthy();
    });

    // Press retry
    const retryButton = getByText('重试');
    fireEvent.press(retryButton);

    // Should now show explanation
    await waitFor(() => {
      expect(getByText('10以内加法')).toBeTruthy();
    });
  });

  it('should handle feedback submission', async () => {
    const {getExplanationService} = require('../../services/explanationService');

    // Mock Alert.alert to trigger the first option callback
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress(); // Simulate pressing "很有帮助"
      }
    });

    render(<ExplanationScreen />);

    await waitFor(() => {
      expect(mockNavigation.setOptions).toHaveBeenCalled();
    });

    // Get the feedback button from headerRight
    const headerRight = mockNavigation.setOptions.mock.calls.find(
      call => call[0].headerRight
    );

    if (headerRight) {
      // Trigger the feedback button press
      const feedbackButton = headerRight[0].headerRight();
      // This is a simplified test - actual implementation would need more handling
    }

    await waitFor(() => {
      expect(getExplanationService().submitFeedback).toHaveBeenCalled();
    });
  });

  it('should display explanation sections correctly', async () => {
    const {getByText} = render(<ExplanationScreen />);

    await waitFor(() => {
      expect(getByText('什么是10以内加法')).toBeTruthy();
      expect(getByText('加法就是把东西合在一起数一数')).toBeTruthy();
    });
  });

  it('should show teaching tips', async () => {
    const {getByText} = render(<ExplanationScreen />);

    await waitFor(() => {
      expect(getByText('💡 家长辅导技巧')).toBeTruthy();
      expect(getByText('用实物演示')).toBeTruthy();
    });
  });

  it('should display footer information', async () => {
    const {getByText} = render(<ExplanationScreen />);

    await waitFor(() => {
      expect(getByText(/来源: 专业审核/)).toBeTruthy();
      expect(getByText(/版本: v1/)).toBeTruthy();
      expect(getByText(/✅ 已审核/)).toBeTruthy();
    });
  });

  it('should handle missing knowledge point ID', async () => {
    mockRoute.params = {};

    const {getByText} = render(<ExplanationScreen />);

    await waitFor(() => {
      expect(getByText(/缺少知识点ID/)).toBeTruthy();
    });
  });
});

describe('ExplanationScreen Integration Tests', () => {
  it('should complete full user flow successfully', async () => {
    const {getByText, getByPlaceholder} = render(<ExplanationScreen />);

    // 1. Show loading
    expect(getByText(/正在生成讲解内容/)).toBeTruthy();

    // 2. Show explanation
    await waitFor(() => {
      expect(getByText('10以内加法')).toBeTruthy();
    });

    // 3. Verify sections are present
    expect(getByText('💡 概念说明')).toBeTruthy();
    expect(getByText('📝 解题方法')).toBeTruthy();
    expect(getByText('✏️ 常见例题')).toBeTruthy();
    expect(getByText('⭐ 辅导技巧')).toBeTruthy();

    // 4. Verify footer info
    expect(getByText(/来源: 专业审核/)).toBeTruthy();
  });

  it('should handle error recovery gracefully', async () => {
    const {getExplanationService} = require('../../services/explanationService');
    getExplanationService().generateExplanation
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        explanation: require('../../services/explanationService').mockExplanation,
        generationTime: 1000,
        source: 'template' as const,
        fallbackUsed: false,
        qualityMetrics: {
          completeness: 0.95,
          clarity: 0.9,
          childAppropriate: 0.92,
        },
      });

    const {getByText} = render(<ExplanationScreen />);

    // Should show error
    await waitFor(() => {
      expect(getByText(/加载失败/)).toBeTruthy();
    });

    // Press retry
    fireEvent.press(getByText('重试'));

    // Should recover and show content
    await waitFor(() => {
      expect(getByText('10以内加法')).toBeTruthy();
    });
  });
});
