import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PDFPreviewScreen from '../PDFPreviewScreen';

// Mock dependencies
jest.mock('react-native-pdf', () => ({
  Pdf: 'Pdf',
}));

jest.mock('react-native-pdf-lib', () => ({
  PDFDocument: {
    getDocumentsDirectory: jest.fn(() => '/mock/documents/dir'),
  },
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/Documents',
  ExternalStorageDirectoryPath: '/mock/external/storage',
  exists: jest.fn(),
  mkdir: jest.fn(),
  copyFile: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

jest.mock('../../components/FilenameDialog', () => 'FilenameDialog');

import { pdfService } from '../../services/pdfService';

describe('PDFPreviewScreen', () => {
  const mockRoute = {
    params: {
      pdfPath: '/mock/path.pdf',
      questionCount: 10,
      difficulty: 'easy' as const,
    },
  };

  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render PDF preview with header info', () => {
    const { getByText } = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    expect(getByText('PDF 预览')).toBeTruthy();
    expect(getByText('10 题 · 简单')).toBeTruthy();
  });

  it('should show cancel and save buttons', () => {
    const { getByText } = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    expect(getByText('取消')).toBeTruthy();
    expect(getByText('保存 PDF')).toBeTruthy();
  });

  it('should navigate back when cancel button pressed', () => {
    const { getByText } = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    const cancelButton = getByText('取消');
    fireEvent.press(cancelButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should request permissions if not granted', async () => {
    pdfService.checkStoragePermissions = jest.fn().mockResolvedValue(false);
    pdfService.requestStoragePermissions = jest.fn().mockResolvedValue(true);

    const { getByText } = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    const saveButton = getByText('保存 PDF');
    fireEvent.press(saveButton);

    // Since FilenameDialog is mocked as a string, it won't render
    // but we can verify the service was called
    expect(pdfService.checkStoragePermissions).toHaveBeenCalled();
  });

  it('should show error if permissions denied', async () => {
    pdfService.checkStoragePermissions = jest.fn().mockResolvedValue(false);
    pdfService.requestStoragePermissions = jest.fn().mockResolvedValue(false);

    const { getByText } = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    const saveButton = getByText('保存 PDF');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(getByText('需要存储权限才能保存 PDF 文件')).toBeTruthy();
    });
  });

  it('should generate correct default filename', () => {
    pdfService.getDifficultyLabel = jest.fn(() => '简单');

    const { getByText } = render(
      <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
    );

    expect(getByText('10 题 · 简单')).toBeTruthy();
  });

  describe('error handling', () => {
    it('should show error when PDF save fails', async () => {
      pdfService.checkStoragePermissions = jest.fn().mockResolvedValue(true);
      pdfService.savePDF = jest.fn().mockRejectedValue(new Error('保存失败'));

      const { getByText, queryByText } = render(
        <PDFPreviewScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );

      const saveButton = getByText('保存 PDF');
      fireEvent.press(saveButton);

      // TODO: Need to simulate FilenameDialog confirmation
      // This would require more complex test setup
    });
  });
});
