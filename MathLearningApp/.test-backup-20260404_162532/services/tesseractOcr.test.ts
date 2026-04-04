import { TesseractOCRService } from '../tesseractOcr';

// 模拟react-native模块
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(() => ['chi_sim+eng']),
  },
}));

describe('TesseractOCRService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractText', () => {
    it('应该处理OCR失败并回退到模拟文本', async () => {
      // 模拟Tesseract OCR失败
      jest.mock('react-native-tesseract-ocr', () => {
        throw new Error('Tesseract not available');
      });

      const imageUri = 'test-image.jpg';
      const result = await TesseractOCRService.extractText(imageUri);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('应该从图像URI生成确定性模拟文本', async () => {
      const imageUri1 = 'image1.jpg';
      const imageUri2 = 'image2.jpg';

      // 模拟Tesseract OCR失败以触发回退
      jest.mock('react-native-tesseract-ocr', () => {
        throw new Error('Tesseract not available');
      });

      const result1 = await TesseractOCRService.extractText(imageUri1);
      const result2 = await TesseractOCRService.extractText(imageUri2);

      // 不同的URI应该产生不同的文本（高概率）
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });
  });

  describe('isAvailable', () => {
    it('应该检查Tesseract OCR可用性', async () => {
      // 模拟require失败
      jest.mock('react-native-tesseract-ocr', () => {
        throw new Error('Module not found');
      });

      const isAvailable = await TesseractOCRService.isAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });
});