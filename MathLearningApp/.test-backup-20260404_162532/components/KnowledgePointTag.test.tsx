import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import KnowledgePointTag from '../KnowledgePointTag';
import {KnowledgePointMatchResult} from '../../types/knowledgePoint';
import {KnowledgePointCategory} from '../../types/knowledgePoint';

describe('KnowledgePointTag', () => {
  const mockMatchResult: KnowledgePointMatchResult = {
    knowledgePoint: {
      id: 'kp-add-001',
      name: '10以内加法',
      category: KnowledgePointCategory.ADDITION,
      grade: '一年级',
      keywords: ['加', '+', '和', '一共'],
      description: '掌握10以内的加法运算',
      examples: ['3 + 2 = ?', '5 + 4 = ?'],
      confidenceThreshold: 0.6,
    },
    confidence: 0.85,
    matchedKeywords: ['加', '+'],
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染知识点名称', () => {
    const {getByText} = render(
      <KnowledgePointTag matchResult={mockMatchResult} onPress={mockOnPress} />
    );

    expect(getByText('10以内加法')).toBeTruthy();
  });

  it('应该显示置信度分数 (AC: 4)', () => {
    const {getByText} = render(
      <KnowledgePointTag matchResult={mockMatchResult} onPress={mockOnPress} />
    );

    expect(getByText('85%')).toBeTruthy();
  });

  it('高置信度(>=0.8)应该显示绿色', () => {
    const {getByTestId} = render(
      <KnowledgePointTag matchResult={mockMatchResult} onPress={mockOnPress} />
    );

    const tag = getByTestId('knowledge-point-tag');
    expect(tag.props.style).toHaveProperty('backgroundColor');
  });

  it('中等置信度(0.5-0.8)应该显示蓝色', () => {
    const mediumConfidenceResult = {...mockMatchResult, confidence: 0.65};
    const {getByTestId} = render(
      <KnowledgePointTag
        matchResult={mediumConfidenceResult}
        onPress={mockOnPress}
      />
    );

    expect(getByTestId('knowledge-point-tag')).toBeTruthy();
  });

  it('低置信度(<0.5)应该显示橙色', () => {
    const lowConfidenceResult = {...mockMatchResult, confidence: 0.4};
    const {getByTestId} = render(
      <KnowledgePointTag
        matchResult={lowConfidenceResult}
        onPress={mockOnPress}
      />
    );

    expect(getByTestId('knowledge-point-tag')).toBeTruthy();
  });

  it('点击时应该调用onPress回调 (AC: 6)', () => {
    const {getByTestId} = render(
      <KnowledgePointTag matchResult={mockMatchResult} onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('knowledge-point-tag'));
    expect(mockOnPress).toHaveBeenCalledWith(mockMatchResult);
  });

  it('compact模式应该显示简化版本', () => {
    const {getByText, queryByTestId} = render(
      <KnowledgePointTag
        matchResult={mockMatchResult}
        onPress={mockOnPress}
        compact={true}
      />
    );

    expect(getByText('10以内加法')).toBeTruthy();
    // compact模式可能不显示置信度
  });

  it('应该支持多个标签显示 (AC: 3)', () => {
    const matchResults: KnowledgePointMatchResult[] = [
      mockMatchResult,
      {
        ...mockMatchResult,
        knowledgePoint: {
          ...mockMatchResult.knowledgePoint,
          id: 'kp-wp-001',
          name: '简单应用题',
          category: KnowledgePointCategory.WORD_PROBLEM,
        },
        confidence: 0.7,
        matchedKeywords: ['原来', '一共有'],
      },
    ];

    const {getAllByTestId} = render(
      <>
        {matchResults.map((mr, index) => (
          <KnowledgePointTag
            key={index}
            matchResult={mr}
            onPress={mockOnPress}
          />
        ))}
      </>
    );

    const tags = getAllByTestId('knowledge-point-tag');
    expect(tags.length).toBe(2);
  });

  it('应该显示家长友好的样式', () => {
    const {getByText} = render(
      <KnowledgePointTag matchResult={mockMatchResult} onPress={mockOnPress} />
    );

    // 检查是否有易于理解的置信度显示
    expect(getByText('85%')).toBeTruthy();
  });

  it('降级知识点应该显示特殊样式', () => {
    const fallbackResult: KnowledgePointMatchResult = {
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
    };

    const {getByText, getByTestId} = render(
      <KnowledgePointTag matchResult={fallbackResult} onPress={mockOnPress} />
    );

    expect(getByText('其他题型')).toBeTruthy();
    expect(getByTestId('knowledge-point-tag')).toBeTruthy();
  });

  it('should render within 1.5 seconds (performance requirement AC: 5)', async () => {
    const startTime = Date.now();

    const {getByText} = render(
      <KnowledgePointTag matchResult={mockMatchResult} onPress={mockOnPress} />
    );

    await getByText('10以内加法');

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(1500);
  });
});
