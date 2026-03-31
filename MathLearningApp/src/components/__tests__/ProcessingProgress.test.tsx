import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import ProcessingProgress from '../ProcessingProgress';
import {ProcessingStage, PerformanceMetrics} from '../../types';

// Mock performance tracker
jest.mock('../../services/performanceTracker', () => ({
  performanceTracker: {
    getElapsedTime: jest.fn(() => 5000),
    getCurrentStage: jest.fn(() => 'RECOGNIZING'), // 使用字符串字面值代替 ProcessingStage.RECOGNIZING
    estimateRemainingTime: jest.fn(() => 15000),
    shouldShowWarning: jest.fn(() => false),
  },
  WARNING_THRESHOLD: 25000,
  TOTAL_TIMEOUT: 30000,
}));

describe('ProcessingProgress', () => {
  const mockMetrics: PerformanceMetrics = {
    sessionId: 'test-session',
    startTime: Date.now() - 5000,
    stages: [
      {stage: ProcessingStage.IDLE, timestamp: Date.now() - 5000},
      {stage: ProcessingStage.UPLOADING, timestamp: Date.now() - 4000, duration: 1000},
      {stage: ProcessingStage.RECOGNIZING, timestamp: Date.now() - 2000, duration: 2000},
    ],
    status: 'in_progress',
    totalUploadTime: 1000,
    totalRecognitionTime: 2000,
  };

  it('应该在 visible 为 true 时显示', () => {
    const {getByText} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    expect(getByText('正在处理题目...')).toBeTruthy();
  });

  it('应该在 visible 为 false 时不显示', () => {
    const {queryByText} = render(
      <ProcessingProgress visible={false} metrics={mockMetrics} />
    );

    expect(queryByText('正在处理题目...')).toBeNull();
  });

  it('没有 metrics 时不应该显示', () => {
    const {queryByText} = render(
      <ProcessingProgress visible={true} metrics={null} />
    );

    expect(queryByText('正在处理题目...')).toBeNull();
  });

  it('应该显示所有阶段标签', () => {
    const {getByText} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    expect(getByText('上传中')).toBeTruthy();
    expect(getByText('识别中')).toBeTruthy();
    expect(getByText('选择类型')).toBeTruthy();
    expect(getByText('选择难度')).toBeTruthy();
    expect(getByText('生成中')).toBeTruthy();
  });

  it('应该显示当前阶段为活动状态', () => {
    const {getAllByText} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    // "处理中..." 应该出现
    const statusTexts = getAllByText('处理中...');
    expect(statusTexts.length).toBeGreaterThan(0);
  });

  it('应该显示警告消息当超过阈值', async () => {
    const {performanceTracker} = require('../../services/performanceTracker');
    performanceTracker.shouldShowWarning.mockReturnValue(true);

    const {getByText} = render(
      <ProcessingProgress
        visible={true}
        metrics={mockMetrics}
        warningThreshold={25000}
      />
    );

    await waitFor(() => {
      expect(getByText(/处理时间较长/)).toBeTruthy();
    });
  });

  it('应该显示已用时间', () => {
    const {getByText} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    expect(getByText(/已用时间：/)).toBeTruthy();
  });

  it('应该在非用户交互阶段显示预计剩余时间', () => {
    const {performanceTracker} = require('../../services/performanceTracker');
    performanceTracker.getCurrentStage.mockReturnValue(ProcessingStage.RECOGNIZING);
    performanceTracker.estimateRemainingTime.mockReturnValue(15000);

    const {getByText} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    expect(getByText(/预计剩余：/)).toBeTruthy();
  });

  it('应该显示正确的提示信息', () => {
    const {getByText} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    expect(getByText(/系统正在处理/)).toBeTruthy();
  });

  it('应该显示进度百分比', () => {
    const {getByText} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    // 应该包含 % 符号
    const percentText = getByText(/\d+%/);
    expect(percentText).toBeTruthy();
  });

  it('用户交互阶段应显示不同提示', () => {
    const {performanceTracker} = require('../../services/performanceTracker');
    performanceTracker.getCurrentStage.mockReturnValue(ProcessingStage.CORRECTION);

    const {getByText} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    expect(getByText(/请选择/)).toBeTruthy();
  });

  it('应该渲染 Modal 组件', () => {
    const {UNSAFE_getByType} = render(
      <ProcessingProgress visible={true} metrics={mockMetrics} />
    );

    const modal = UNSAFE_getByType('Modal');
    expect(modal).toBeTruthy();
    expect(modal.props.visible).toBe(true);
  });
});
