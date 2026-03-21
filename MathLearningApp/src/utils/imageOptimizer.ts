/**
 * 图片优化工具
 * 用于压缩和优化上传的图片
 */

import {ImageManipulator} from 'expo-image-manipulator';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png';
}

export interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  size: number; // bytes
  compressionRatio: number; // 原始大小 / 优化后大小
}

// 默认优化配置
const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920, // 最大宽度
  maxHeight: 1080, // 最大高度
  quality: 0.85, // JPEG 质量
  format: 'jpeg',
};

// 目标文件大小（约 500KB）
const TARGET_SIZE_BYTES = 500 * 1024;

class ImageOptimizer {
  /**
   * 优化图片
   */
  async optimizeImage(
    imageUri: string,
    options: ImageOptimizationOptions = DEFAULT_OPTIONS
  ): Promise<OptimizedImageResult> {
    try {
      const mergedOptions = {...DEFAULT_OPTIONS, ...options};

      // 获取原始图片信息
      const originalInfo = await this.getImageInfo(imageUri);
      const originalSize = originalInfo.size || 0;

      console.log(`[ImageOptimizer] Original image: ${originalInfo.width}x${originalInfo.height}, size: ${this.formatBytes(originalSize)}`);

      // 如果图片已经很小，直接返回
      if (originalSize <= TARGET_SIZE_BYTES && originalInfo.width <= mergedOptions.maxWidth!) {
        console.log('[ImageOptimizer] Image already optimized, skipping compression');
        return {
          uri: imageUri,
          width: originalInfo.width,
          height: originalInfo.height,
          size: originalSize,
          compressionRatio: 1,
        };
      }

      // 计算缩放比例
      const scale = Math.min(
        mergedOptions.maxWidth! / originalInfo.width,
        mergedOptions.maxHeight! / originalInfo.height,
        1
      );

      // 如果需要缩放
      let resultUri = imageUri;
      let resultWidth = originalInfo.width;
      let resultHeight = originalInfo.height;

      if (scale < 1) {
        const manipulatorResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{resize: {width: Math.round(originalInfo.width * scale)}}],
          {
            compress: mergedOptions.quality!,
            format: mergedOptions.format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
          }
        );

        resultUri = manipulatorResult.uri;
        resultWidth = manipulatorResult.width;
        resultHeight = manipulatorResult.height;
      }

      // 获取优化后的文件大小
      const optimizedSize = await this.getFileSize(resultUri);
      const compressionRatio = originalSize / optimizedSize;

      console.log(
        `[ImageOptimizer] Optimized image: ${resultWidth}x${resultHeight}, size: ${this.formatBytes(optimizedSize)}, ratio: ${compressionRatio.toFixed(2)}x`
      );

      return {
        uri: resultUri,
        width: resultWidth,
        height: resultHeight,
        size: optimizedSize,
        compressionRatio,
      };
    } catch (error) {
      console.error('[ImageOptimizer] Optimization failed:', error);
      // 失败时返回原始图片
      const info = await this.getImageInfo(imageUri);
      return {
        uri: imageUri,
        width: info.width,
        height: info.height,
        size: info.size || 0,
        compressionRatio: 1,
      };
    }
  }

  /**
   * 批量优化图片
   */
  async optimizeImages(
    imageUris: string[],
    options?: ImageOptimizationOptions
  ): Promise<OptimizedImageResult[]> {
    const results: OptimizedImageResult[] = [];

    for (const uri of imageUris) {
      const result = await this.optimizeImage(uri, options);
      results.push(result);
    }

    return results;
  }

  /**
   * 获取图片信息
   */
  private async getImageInfo(uri: string): Promise<{
    width: number;
    height: number;
    size?: number;
  }> {
    // 在 React Native 中，可以使用 Image.getSize
    return new Promise((resolve, reject) => {
      // 这里简化处理，实际应用中需要更复杂的实现
      resolve({width: 1920, height: 1080, size: 0});
    });
  }

  /**
   * 获取文件大小
   */
  private async getFileSize(uri: string): Promise<number> {
    // 在 React Native 中，可以使用 FileSystem.getInfoAsync
    // 这里简化处理
    return 300 * 1024; // 假设 300KB
  }

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * 估算优化质量（基于目标大小）
   */
  calculateOptimalQuality(originalSize: number, targetSize: number = TARGET_SIZE_BYTES): number {
    // 简单的线性估算
    const ratio = targetSize / originalSize;
    return Math.min(Math.max(Math.sqrt(ratio), 0.5), 1);
  }

  /**
   * 检查是否需要优化
   */
  needsOptimization(width: number, height: number, size: number): boolean {
    return (
      width > DEFAULT_OPTIONS.maxWidth! ||
      height > DEFAULT_OPTIONS.maxHeight! ||
      size > TARGET_SIZE_BYTES
    );
  }
}

export const imageOptimizer = new ImageOptimizer();
