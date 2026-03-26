/**
 * 图片优化工具
 * 用于压缩和优化上传的图片
 * Story 5-3: 增强性能优化
 *
 * 临时版本：expo依赖已禁用，直接返回原始图片
 * TODO: 集成react-native-image-crop-resizer或其他替代库
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png';
  removeExif?: boolean; // Story 5-3: 移除EXIF数据
}

export interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  size: number; // bytes
  compressionRatio: number; // 原始大小 / 优化后大小
}

// Story 5-3: 性能优化配置
const PERFORMANCE_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.75,
  format: 'jpeg',
  removeExif: true,
};

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'jpeg',
  removeExif: false,
};

// Story 5-3: 目标上传时间 < 3秒
const TARGET_SIZE_BYTES = 300 * 1024;

class ImageOptimizer {
  /**
   * 优化图片
   * 临时方案：直接返回原始图片（expo依赖已禁用）
   */
  async optimizeImage(
    imageUri: string,
    options: ImageOptimizationOptions = DEFAULT_OPTIONS,
    performanceMode: boolean = false
  ): Promise<OptimizedImageResult> {
    try {
      console.log('[ImageOptimizer] Expo disabled, returning original image');

      // 临时方案：返回原始图片信息
      // 注意：这里假设默认图片尺寸
      return {
        uri: imageUri,
        width: 1920,
        height: 1080,
        size: 500 * 1024,
        compressionRatio: 1,
      };
    } catch (error) {
      console.error('[ImageOptimizer] Error:', error);
      throw error;
    }
  }

  /**
   * 获取图片信息（临时实现）
   */
  async getImageInfo(uri: string): Promise<{width: number; height: number; size?: number}> {
    // 临时实现：返回默认值
    return {width: 1920, height: 1080, size: 500 * 1024};
  }

  /**
   * 格式化字节大小
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 单例导出
export const imageOptimizer = new ImageOptimizer();

// 便捷函数
export async function optimizeImage(
  imageUri: string,
  options?: ImageOptimizationOptions,
  performanceMode?: boolean
): Promise<OptimizedImageResult> {
  return imageOptimizer.optimizeImage(imageUri, options, performanceMode);
}
