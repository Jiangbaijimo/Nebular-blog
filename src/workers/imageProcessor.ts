/**
 * 图片处理Worker
 * 在Web Worker中处理图片，避免阻塞主线程
 */

// 图片处理任务类型
interface ImageProcessTask {
  id: string;
  type: 'compress' | 'thumbnail' | 'convert' | 'watermark' | 'exif';
  file: File | Blob;
  options: any;
}

// 图片处理结果
interface ImageProcessResult {
  id: string;
  success: boolean;
  data?: Blob | string | any;
  error?: string;
  metadata?: {
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    width: number;
    height: number;
    format: string;
  };
}

// 压缩选项
interface CompressOptions {
  quality: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

// 缩略图选项
interface ThumbnailOptions {
  width: number;
  height: number;
  crop?: boolean;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// 格式转换选项
interface ConvertOptions {
  format: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

// 水印选项
interface WatermarkOptions {
  text?: string;
  image?: string; // base64 or url
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number; // 0-1
  fontSize?: number;
  fontColor?: string;
  margin?: number;
}

// EXIF处理选项
interface ExifOptions {
  remove?: boolean;
  extract?: boolean;
  modify?: Record<string, any>;
}

class ImageProcessor {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;

  constructor() {
    this.canvas = new OffscreenCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * 压缩图片
   */
  async compressImage(file: File | Blob, options: CompressOptions): Promise<Blob> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'jpeg',
      maintainAspectRatio = true
    } = options;

    // 创建图片对象
    const bitmap = await createImageBitmap(file);
    const { width: originalWidth, height: originalHeight } = bitmap;

    // 计算新尺寸
    let { width, height } = this.calculateDimensions(
      originalWidth,
      originalHeight,
      maxWidth,
      maxHeight,
      maintainAspectRatio
    );

    // 设置画布尺寸
    this.canvas.width = width;
    this.canvas.height = height;

    // 清空画布
    this.ctx.clearRect(0, 0, width, height);

    // 绘制图片
    this.ctx.drawImage(bitmap, 0, 0, width, height);

    // 转换为Blob
    const mimeType = this.getMimeType(format);
    const blob = await this.canvas.convertToBlob({
      type: mimeType,
      quality: format === 'png' ? undefined : quality
    });

    bitmap.close();
    return blob;
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(file: File | Blob, options: ThumbnailOptions): Promise<Blob> {
    const {
      width,
      height,
      crop = false,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const bitmap = await createImageBitmap(file);
    const { width: originalWidth, height: originalHeight } = bitmap;

    // 设置画布尺寸
    this.canvas.width = width;
    this.canvas.height = height;

    // 清空画布
    this.ctx.clearRect(0, 0, width, height);

    if (crop) {
      // 裁剪模式：填满整个缩略图区域
      const scale = Math.max(width / originalWidth, height / originalHeight);
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;

      this.ctx.drawImage(bitmap, x, y, scaledWidth, scaledHeight);
    } else {
      // 适应模式：保持宽高比
      const { width: newWidth, height: newHeight } = this.calculateDimensions(
        originalWidth,
        originalHeight,
        width,
        height,
        true
      );

      const x = (width - newWidth) / 2;
      const y = (height - newHeight) / 2;

      // 填充背景色（白色）
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, width, height);

      this.ctx.drawImage(bitmap, x, y, newWidth, newHeight);
    }

    const mimeType = this.getMimeType(format);
    const blob = await this.canvas.convertToBlob({
      type: mimeType,
      quality: format === 'png' ? undefined : quality
    });

    bitmap.close();
    return blob;
  }

  /**
   * 格式转换
   */
  async convertFormat(file: File | Blob, options: ConvertOptions): Promise<Blob> {
    const { format, quality = 0.9 } = options;

    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(bitmap, 0, 0);

    const mimeType = this.getMimeType(format);
    const blob = await this.canvas.convertToBlob({
      type: mimeType,
      quality: format === 'png' ? undefined : quality
    });

    bitmap.close();
    return blob;
  }

  /**
   * 添加水印
   */
  async addWatermark(file: File | Blob, options: WatermarkOptions): Promise<Blob> {
    const {
      text,
      image,
      position,
      opacity = 0.5,
      fontSize = 24,
      fontColor = '#ffffff',
      margin = 20
    } = options;

    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(bitmap, 0, 0);

    // 设置透明度
    this.ctx.globalAlpha = opacity;

    if (text) {
      // 文字水印
      this.ctx.font = `${fontSize}px Arial`;
      this.ctx.fillStyle = fontColor;
      this.ctx.textBaseline = 'top';

      const textMetrics = this.ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      const { x, y } = this.getWatermarkPosition(
        position,
        width,
        height,
        textWidth,
        textHeight,
        margin
      );

      // 添加文字阴影
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 2;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;

      this.ctx.fillText(text, x, y);
    }

    if (image) {
      // 图片水印
      try {
        const watermarkBitmap = await this.loadImageFromBase64(image);
        const { width: wmWidth, height: wmHeight } = watermarkBitmap;

        const { x, y } = this.getWatermarkPosition(
          position,
          width,
          height,
          wmWidth,
          wmHeight,
          margin
        );

        this.ctx.drawImage(watermarkBitmap, x, y);
        watermarkBitmap.close();
      } catch (error) {
        console.warn('Failed to load watermark image:', error);
      }
    }

    // 重置透明度
    this.ctx.globalAlpha = 1;

    const blob = await this.canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.9
    });

    bitmap.close();
    return blob;
  }

  /**
   * 处理EXIF信息
   */
  async processExif(file: File, options: ExifOptions): Promise<any> {
    const { remove = false, extract = false, modify } = options;

    if (extract) {
      // 提取EXIF信息
      return this.extractExifData(file);
    }

    if (remove || modify) {
      // 移除或修改EXIF信息
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;

      this.canvas.width = width;
      this.canvas.height = height;

      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(bitmap, 0, 0);

      // 转换为新的Blob（不包含EXIF信息）
      const blob = await this.canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.95
      });

      bitmap.close();
      return blob;
    }

    return null;
  }

  /**
   * 计算新尺寸
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp'
    };
    return mimeTypes[format] || 'image/jpeg';
  }

  /**
   * 获取水印位置
   */
  private getWatermarkPosition(
    position: string,
    canvasWidth: number,
    canvasHeight: number,
    watermarkWidth: number,
    watermarkHeight: number,
    margin: number
  ): { x: number; y: number } {
    switch (position) {
      case 'top-left':
        return { x: margin, y: margin };
      case 'top-right':
        return { x: canvasWidth - watermarkWidth - margin, y: margin };
      case 'bottom-left':
        return { x: margin, y: canvasHeight - watermarkHeight - margin };
      case 'bottom-right':
        return {
          x: canvasWidth - watermarkWidth - margin,
          y: canvasHeight - watermarkHeight - margin
        };
      case 'center':
        return {
          x: (canvasWidth - watermarkWidth) / 2,
          y: (canvasHeight - watermarkHeight) / 2
        };
      default:
        return { x: margin, y: margin };
    }
  }

  /**
   * 从Base64加载图片
   */
  private async loadImageFromBase64(base64: string): Promise<ImageBitmap> {
    const response = await fetch(base64);
    const blob = await response.blob();
    return createImageBitmap(blob);
  }

  /**
   * 提取EXIF数据（简化版本）
   */
  private async extractExifData(file: File): Promise<any> {
    // 这里是一个简化的EXIF提取实现
    // 在实际项目中，你可能需要使用专门的EXIF库
    const arrayBuffer = await file.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // 检查JPEG文件头
    if (dataView.getUint16(0) !== 0xFFD8) {
      return null; // 不是JPEG文件
    }

    // 简单的EXIF信息提取
    const exifData: any = {
      fileSize: file.size,
      fileName: file.name,
      fileType: file.type,
      lastModified: new Date(file.lastModified)
    };

    // 这里可以添加更详细的EXIF解析逻辑
    // 例如：相机型号、拍摄时间、GPS信息等

    return exifData;
  }
}

// Worker消息处理
const processor = new ImageProcessor();

self.onmessage = async (event: MessageEvent<ImageProcessTask>) => {
  const task = event.data;
  const result: ImageProcessResult = {
    id: task.id,
    success: false
  };

  try {
    const originalSize = task.file.size;
    let processedData: Blob | any;
    let metadata: any = {
      originalSize,
      processedSize: 0,
      compressionRatio: 0,
      width: 0,
      height: 0,
      format: ''
    };

    switch (task.type) {
      case 'compress':
        processedData = await processor.compressImage(task.file, task.options);
        break;
      case 'thumbnail':
        processedData = await processor.generateThumbnail(task.file, task.options);
        break;
      case 'convert':
        processedData = await processor.convertFormat(task.file, task.options);
        break;
      case 'watermark':
        processedData = await processor.addWatermark(task.file, task.options);
        break;
      case 'exif':
        processedData = await processor.processExif(task.file as File, task.options);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    if (processedData instanceof Blob) {
      // 获取处理后的图片信息
      const bitmap = await createImageBitmap(processedData);
      metadata.processedSize = processedData.size;
      metadata.compressionRatio = originalSize / processedData.size;
      metadata.width = bitmap.width;
      metadata.height = bitmap.height;
      metadata.format = processedData.type;
      bitmap.close();
    }

    result.success = true;
    result.data = processedData;
    result.metadata = metadata;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  self.postMessage(result);
};

// 导出类型定义
export type {
  ImageProcessTask,
  ImageProcessResult,
  CompressOptions,
  ThumbnailOptions,
  ConvertOptions,
  WatermarkOptions,
  ExifOptions
};