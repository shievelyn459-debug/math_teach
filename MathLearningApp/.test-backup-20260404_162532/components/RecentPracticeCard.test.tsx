/**
 * Story 5-1: RecentPracticeCard 组件测试
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import RecentPracticeCard from '../RecentPracticeCard';
import {GenerationRecord, QuestionType, Difficulty} from '../../types';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock Icon
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock formatTimeAgo
jest.mock('../../utils/timeUtils', () => ({
  formatTimeAgo: jest.fn(() => '5分钟前'),
}));

describe('RecentPracticeCard', () => {
  const mockRecord: GenerationRecord = {
    id: 'test_123',
    questionType: QuestionType.ADDITION,
    difficulty: Difficulty.EASY,
    count: 5,
    timestamp: Date.now(),
    questions: [],
    processingTime: 5000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const {getByText} = render(<RecentPracticeCard record={mockRecord} />);

    expect(getByText('加法')).toBeTruthy();
    expect(getByText('5道题')).toBeTruthy();
    expect(getByText('5分钟前')).toBeTruthy();
    expect(getByText('简单')).toBeTruthy();
  });

  it('should display subtraction type correctly', () => {
    const subtractionRecord = {
      ...mockRecord,
      questionType: QuestionType.SUBTRACTION,
    };

    const {getByText} = render(
      <RecentPracticeCard record={subtractionRecord} />
    );

    expect(getByText('减法')).toBeTruthy();
  });

  it('should display word problem type correctly', () => {
    const wordProblemRecord = {
      ...mockRecord,
      questionType: QuestionType.WORD_PROBLEM,
    };

    const {getByText} = render(
      <RecentPracticeCard record={wordProblemRecord} />
    );

    expect(getByText('应用题')).toBeTruthy();
  });

  it('should display medium difficulty', () => {
    const mediumRecord = {
      ...mockRecord,
      difficulty: Difficulty.MEDIUM,
    };

    const {getByText} = render(<RecentPracticeCard record={mediumRecord} />);

    expect(getByText('中等')).toBeTruthy();
  });

  it('should display hard difficulty', () => {
    const hardRecord = {
      ...mockRecord,
      difficulty: Difficulty.HARD,
    };

    const {getByText} = render(<RecentPracticeCard record={hardRecord} />);

    expect(getByText('困难')).toBeTruthy();
  });

  it('should navigate to GeneratedQuestionsList on press', () => {
    const {getByRole} = render(<RecentPracticeCard record={mockRecord} />);

    fireEvent.press(getByRole('button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('GeneratedQuestionsList', {
      generationId: 'test_123',
      questions: [],
    });
  });

  it('should have correct accessibility properties', () => {
    const {getByRole} = render(<RecentPracticeCard record={mockRecord} />);

    expect(getByRole('button')).toBeTruthy();
  });
});
