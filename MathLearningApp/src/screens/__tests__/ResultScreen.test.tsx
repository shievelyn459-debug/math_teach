import React from 'react';
import {render, fireEvent, waitFor, getAllByText} from '@testing-library/react-native';
import ResultScreen from '../ResultScreen';
import {RecognitionResult} from '../../types';
import {QuestionType, Difficulty} from '../../types';
import {KnowledgePointCategory} from '../../types/knowledgePoint';

describe('ResultScreen', () => {
  const mockOnKnowledgePointPress = jest.fn();
  const mockOnBack = jest.fn();

  const mockRecognitionResult: RecognitionResult = {
    questionType: QuestionType.ADDITION,
    difficulty: Difficulty.EASY,
    confidence: 0.85,
    knowledgePoint: '10以内加法',
    knowledgePoints: {
      knowledgePoints: [
        {
          knowledgePoint: {
            id: 'kp-add-001',
            name: '10以内加法',
            category: KnowledgePointCategory.ADDITION,
            grade: '一年级',
            keywords: ['加', '+', '和', '一共'],
            description: '掌握10以内的加法运算',
            examples: ['3 + 2 = ?'],
            confidenceThreshold: 0.6,
          },
          confidence: 0.85,
          matchedKeywords: ['加', '+'],
        },
      ],
      primaryKnowledgePoint: {
        knowledgePoint: {
          id: 'kp-add-001',
          name: '10以内加法',
          category: KnowledgePointCategory.ADDITION,
          grade: '一年级',
          keywords: ['加', '+', '和', '一共'],
          description: '掌握10以内的加法运算',
          examples: ['3 + 2 = ?'],
          confidenceThreshold: 0.6,
        },
        confidence: 0.85,
        matchedKeywords: ['加', '+'],
      },
      fallbackUsed: false,
    },
    extractedText: '3 + 2 = ?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该显示识别结果', () => {
    const {getByText} = render(
      <ResultScreen
        recognitionResult={mockRecognitionResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    expect(getByText('识别结果')).toBeTruthy();
    expect(getByText(QuestionType.ADDITION)).toBeTruthy();
    expect(getByText(Difficulty.EASY)).toBeTruthy();
  });

  it('应该显示知识点标签 (AC: 1)', () => {
    const {getByText} = render(
      <ResultScreen
        recognitionResult={mockRecognitionResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    expect(getByText('知识点')).toBeTruthy();
    expect(getByText('主要知识点：')).toBeTruthy();
    expect(getByText('10以内加法')).toBeTruthy();
  });

  it('应该显示置信度 (AC: 4)', () => {
    const {getByTestId, getAllByText} = render(
      <ResultScreen
        recognitionResult={mockRecognitionResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    // 验证置信度显示元素存在
    expect(getByTestId('confidence-display')).toBeTruthy();
    // 验证置信度值显示（有多个85%，至少有一个在结果区域）
    const confidence85Elements = getAllByText('85%');
    expect(confidence85Elements.length).toBeGreaterThanOrEqual(1);
  });

  it('点击知识点应该导航到详细讲解 (AC: 6)', () => {
    const {getByTestId} = render(
      <ResultScreen
        recognitionResult={mockRecognitionResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    fireEvent.press(getByTestId('knowledge-point-tag'));
    expect(mockOnKnowledgePointPress).toHaveBeenCalledWith('kp-add-001');
  });

  it('应该支持多个知识点显示 (AC: 3)', () => {
    const multiKpResult: RecognitionResult = {
      ...mockRecognitionResult,
      knowledgePoints: {
        ...mockRecognitionResult.knowledgePoints!,
        knowledgePoints: [
          ...(mockRecognitionResult.knowledgePoints?.knowledgePoints || []),
          {
            knowledgePoint: {
              id: 'kp-wp-001',
              name: '简单应用题',
              category: KnowledgePointCategory.WORD_PROBLEM,
              grade: '一年级',
              keywords: ['原来', '一共有'],
              description: '解决简单的应用题',
              examples: ['原来有5个...'],
              confidenceThreshold: 0.6,
            },
            confidence: 0.7,
            matchedKeywords: ['原来'],
          },
        ],
      },
    };

    const {getByText} = render(
      <ResultScreen
        recognitionResult={multiKpResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    expect(getByText('相关知识点：')).toBeTruthy();
    expect(getByText('简单应用题')).toBeTruthy();
  });

  it('应该显示降级提示 (AC: 7)', () => {
    const fallbackResult: RecognitionResult = {
      ...mockRecognitionResult,
      knowledgePoints: {
        knowledgePoints: [],
        primaryKnowledgePoint: {
          knowledgePoint: {
            id: 'kp-other-001',
            name: '其他题型',
            category: KnowledgePointCategory.OTHER,
            grade: '一年级',
            keywords: [],
            description: '未能自动识别的知识点',
            examples: [],
            confidenceThreshold: 0,
          },
          confidence: 0,
          matchedKeywords: [],
        },
        fallbackUsed: true,
      },
    };

    const {getByText} = render(
      <ResultScreen
        recognitionResult={fallbackResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    expect(getByText(/未能自动识别具体知识点/)).toBeTruthy();
  });

  it('加载状态应该显示加载指示器', () => {
    const {getByText} = render(
      <ResultScreen
        recognitionResult={null}
        isLoading={true}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    expect(getByText('正在识别知识点...')).toBeTruthy();
  });

  it('应该显示提取的文本', () => {
    const {getByText} = render(
      <ResultScreen
        recognitionResult={mockRecognitionResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    expect(getByText('3 + 2 = ?')).toBeTruthy();
  });

  it('点击返回按钮应该调用onBack', () => {
    const {getByText} = render(
      <ResultScreen
        recognitionResult={mockRecognitionResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    fireEvent.press(getByText('返回'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('应该在1.5秒内渲染完成 (AC: 5 性能要求)', async () => {
    const startTime = Date.now();

    const {getByText} = render(
      <ResultScreen
        recognitionResult={mockRecognitionResult}
        isLoading={false}
        onKnowledgePointPress={mockOnKnowledgePointPress}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(getByText('10以内加法')).toBeTruthy();
    });

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(1500);
  });
});
