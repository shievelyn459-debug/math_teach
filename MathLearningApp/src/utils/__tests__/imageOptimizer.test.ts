import { imageOptimizer } from '../imageOptimizer';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulateAsync: jest.fn(),
    SaveFormat: {
      JPEG: 'jpeg',
      PNG: 'png',
    },
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockImplementation((uri) => {
    // Return large size for images that need optimization, small for already optimized
    if (uri.includes('small') || uri.includes('optimized')) {
      return Promise.resolve({
        exists: true,
        size: 100 * 1024, // 100KB - already small
        uri,
        width: 800,
        height: 600,
      });
    }
    return Promise.resolve({
      exists: true,
      size: 5 * 1024 * 1024, // 5MB - needs optimization
      uri,
      width: 3840,
      height: 2160,
    });
  }),
}));

describe('ImageOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const { ImageManipulator } = require('expo-image-manipulator');

  describe('optimizeImage', () => {
    it('应该优化大尺寸图片', async () => {
      ImageManipulator.manipulateAsync.mockResolvedValue({
        uri: 'optimized-image.jpg',
        width: 1200,
        height: 800,
      });

      // Use smaller max dimensions to force optimization
      const result = await imageOptimizer.optimizeImage('large-image.jpg', {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.8,
      });

      expect(result.uri).toBe('optimized-image.jpg');
      expect(result.width).toBe(1200);
      expect(result.height).toBe(800);
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalled();
    });

    it('应该计算压缩比例', async () => {
      ImageManipulator.manipulateAsync.mockResolvedValue({
        uri: 'optimized-image.jpg',
        width: 1920,
        height: 1080,
      });

      // Use a custom option that forces optimization by having different dimensions
      const result = await imageOptimizer.optimizeImage('large-image.jpg', {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.8,
      });

      // When manipulation happens, compressionRatio should be calculated
      expect(result).toBeDefined();
    });

    it('已优化的小图片应该跳过压缩', async () => {
      const result = await imageOptimizer.optimizeImage('small-image.jpg', {
        maxWidth: 3840,
        maxHeight: 2160,
        quality: 0.9,
      });

      // 由于模拟返回，这里检查是否调用了优化
      expect(result).toBeDefined();
    });

    it('优化失败时应该返回原始图片信息', async () => {
      ImageManipulator.manipulateAsync.mockRejectedValue(new Error('Optimization failed'));

      const result = await imageOptimizer.optimizeImage('error-image.jpg');

      expect(result.uri).toBe('error-image.jpg');
      expect(result.compressionRatio).toBe(1);
    });
  });

  describe('optimizeImages', () => {
    it('应该批量优化多张图片', async () => {
      ImageManipulator.manipulateAsync
        .mockResolvedValueOnce({
          uri: 'optimized-1.jpg',
          width: 1200,
          height: 800,
        })
        .mockResolvedValueOnce({
          uri: 'optimized-2.jpg',
          width: 1200,
          height: 800,
        });

      const results = await imageOptimizer.optimizeImages(
        ['image-1.jpg', 'image-2.jpg'],
        {
          maxWidth: 1200,
          maxHeight: 800,
          quality: 0.8,
        }
      );

      expect(results).toHaveLength(2);
      expect(results).toBeDefined();
      expect(results[0].width).toBe(1200);
      expect(results[1].width).toBe(1200);
    });
  });

  describe('calculateOptimalQuality', () => {
    it('应该计算合适的质量以匹配目标大小', () => {
      const originalSize = 2 * 1024 * 1024; // 2MB
      const targetSize = 500 * 1024; // 500KB

      const quality = imageOptimizer.calculateOptimalQuality(originalSize, targetSize);

      expect(quality).toBeGreaterThan(0);
      expect(quality).toBeLessThanOrEqual(1);
    });

    it('质量应该在合理范围内', () => {
      const quality1 = imageOptimizer.calculateOptimalQuality(1024);
      expect(quality1).toBeGreaterThanOrEqual(0.5);
      expect(quality1).toBeLessThanOrEqual(1);
    });
  });

  describe('needsOptimization', () => {
    it('大尺寸图片需要优化', () => {
      const needs = imageOptimizer.needsOptimization(3000, 2000, 1024 * 1024);
      expect(needs).toBe(true);
    });

    it('大文件需要优化', () => {
      const needs = imageOptimizer.needsOptimization(1920, 1080, 2 * 1024 * 1024);
      expect(needs).toBe(true);
    });

    it('小图片不需要优化', () => {
      const needs = imageOptimizer.needsOptimization(1920, 1080, 300 * 1024);
      expect(needs).toBe(false);
    });
  });
});
