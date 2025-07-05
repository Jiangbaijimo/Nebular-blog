import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { writeFile, readBinaryFile, exists, createDir } from '@tauri-apps/api/fs';
import { appDataDir, join } from '@tauri-apps/api/path';

// 图片信息接口
export interface ImageInfo {
  id: string;
  name: string;
  originalName: string;
  size: number;
  width: number;
  height: number;
  type: string;
  url: string;
  localPath?: string;
  cloudUrl?: string;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'failed';
  uploadProgress: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  description?: string;
  isCompressed: boolean;
  originalSize?: number;
  thumbnailUrl?: string;
}

// 上传配置接口
export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  enableCompression: boolean;
  compressionQuality: number;
  generateThumbnail: boolean;
  thumbnailSize: { width: number; height: number };
  chunkSize: number;
  maxConcurrentUploads: number;
}

// 默认上传配置
const defaultUploadConfig: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  enableCompression: true,
  compressionQuality: 0.8,
  generateThumbnail: true,
  thumbnailSize: { width: 300, height: 300 },
  chunkSize: 1024 * 1024, // 1MB
  maxConcurrentUploads: 3
};

// 图片服务类
class ImageService {
  private config: UploadConfig;
  private uploadQueue: Map<string, ImageInfo> = new Map();
  private activeUploads: Set<string> = new Set();
  private listeners: Map<string, (info: ImageInfo) => void> = new Map();
  private db: IDBDatabase | null = null;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = { ...defaultUploadConfig, ...config };
    this.initDatabase();
  }

  // 初始化IndexedDB数据库
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BlogImageDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建图片存储对象存储
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('uploadStatus', 'uploadStatus', { unique: false });
          imageStore.createIndex('createdAt', 'createdAt', { unique: false });
          imageStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
        
        // 创建图片数据存储（blob数据）
        if (!db.objectStoreNames.contains('imageData')) {
          db.createObjectStore('imageData', { keyPath: 'id' });
        }
      };
    });
  }

  // 生成唯一ID
  private generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 验证文件
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `文件大小超过限制 (${this.formatFileSize(this.config.maxFileSize)})`
      };
    }
    
    if (!this.config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.type}`
      };
    }
    
    return { valid: true };
  }

  // 格式化文件大小
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取图片尺寸
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // 压缩图片
  private compressImage(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // 生成缩略图
  private generateThumbnail(file: File, size: { width: number; height: number }): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = this.calculateThumbnailSize(img.width, img.height, size);
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          0.8
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // 计算缩略图尺寸
  private calculateThumbnailSize(
    originalWidth: number,
    originalHeight: number,
    targetSize: { width: number; height: number }
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    if (aspectRatio > 1) {
      // 宽图
      return {
        width: targetSize.width,
        height: Math.round(targetSize.width / aspectRatio)
      };
    } else {
      // 高图
      return {
        width: Math.round(targetSize.height * aspectRatio),
        height: targetSize.height
      };
    }
  }

  // 保存到IndexedDB
  private async saveToIndexedDB(imageInfo: ImageInfo, imageData: Blob, thumbnailData?: Blob): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['images', 'imageData'], 'readwrite');
    
    // 保存图片信息
    const imageStore = transaction.objectStore('images');
    await new Promise<void>((resolve, reject) => {
      const request = imageStore.put(imageInfo);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // 保存图片数据
    const dataStore = transaction.objectStore('imageData');
    await new Promise<void>((resolve, reject) => {
      const request = dataStore.put({
        id: imageInfo.id,
        imageData: imageData,
        thumbnailData: thumbnailData
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 从IndexedDB获取图片
  private async getFromIndexedDB(id: string): Promise<{ info: ImageInfo; data: Blob; thumbnail?: Blob } | null> {
    if (!this.db) return null;
    
    const transaction = this.db.transaction(['images', 'imageData'], 'readonly');
    
    // 获取图片信息
    const imageStore = transaction.objectStore('images');
    const info = await new Promise<ImageInfo | null>((resolve) => {
      const request = imageStore.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
    
    if (!info) return null;
    
    // 获取图片数据
    const dataStore = transaction.objectStore('imageData');
    const data = await new Promise<any>((resolve) => {
      const request = dataStore.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
    
    if (!data) return null;
    
    return {
      info,
      data: data.imageData,
      thumbnail: data.thumbnailData
    };
  }

  // 上传单个文件
  public async uploadFile(file: File, options: {
    tags?: string[];
    description?: string;
    onProgress?: (progress: number) => void;
  } = {}): Promise<ImageInfo> {
    // 验证文件
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 生成图片信息
    const id = this.generateId();
    const dimensions = await this.getImageDimensions(file);
    
    let processedFile: Blob = file;
    let isCompressed = false;
    let originalSize = file.size;
    
    // 压缩图片
    if (this.config.enableCompression && file.type !== 'image/svg+xml') {
      processedFile = await this.compressImage(file, this.config.compressionQuality);
      isCompressed = true;
    }
    
    // 生成缩略图
    let thumbnailData: Blob | undefined;
    if (this.config.generateThumbnail && file.type !== 'image/svg+xml') {
      thumbnailData = await this.generateThumbnail(file, this.config.thumbnailSize);
    }
    
    const imageInfo: ImageInfo = {
      id,
      name: `${id}.${file.name.split('.').pop()}`,
      originalName: file.name,
      size: processedFile.size,
      width: dimensions.width,
      height: dimensions.height,
      type: file.type,
      url: URL.createObjectURL(processedFile),
      uploadStatus: 'pending',
      uploadProgress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: options.tags || [],
      description: options.description,
      isCompressed,
      originalSize: isCompressed ? originalSize : undefined,
      thumbnailUrl: thumbnailData ? URL.createObjectURL(thumbnailData) : undefined
    };

    // 保存到本地数据库
    await this.saveToIndexedDB(imageInfo, processedFile, thumbnailData);
    
    // 添加到上传队列
    this.uploadQueue.set(id, imageInfo);
    
    // 开始上传
    this.processUploadQueue();
    
    return imageInfo;
  }

  // 批量上传文件
  public async uploadFiles(files: File[], options: {
    tags?: string[];
    description?: string;
    onProgress?: (id: string, progress: number) => void;
    onComplete?: (results: ImageInfo[]) => void;
  } = {}): Promise<ImageInfo[]> {
    const results: ImageInfo[] = [];
    
    for (const file of files) {
      try {
        const imageInfo = await this.uploadFile(file, {
          tags: options.tags,
          description: options.description,
          onProgress: options.onProgress ? (progress) => options.onProgress!(imageInfo.id, progress) : undefined
        });
        results.push(imageInfo);
      } catch (error) {
        console.error('Upload failed for file:', file.name, error);
      }
    }
    
    if (options.onComplete) {
      options.onComplete(results);
    }
    
    return results;
  }

  // 处理上传队列
  private async processUploadQueue(): Promise<void> {
    const pendingUploads = Array.from(this.uploadQueue.values())
      .filter(info => info.uploadStatus === 'pending' && !this.activeUploads.has(info.id))
      .slice(0, this.config.maxConcurrentUploads - this.activeUploads.size);
    
    for (const imageInfo of pendingUploads) {
      this.uploadToCloud(imageInfo);
    }
  }

  // 上传到云端
  private async uploadToCloud(imageInfo: ImageInfo): Promise<void> {
    this.activeUploads.add(imageInfo.id);
    
    try {
      // 更新状态为上传中
      imageInfo.uploadStatus = 'uploading';
      this.notifyListeners(imageInfo);
      
      // 获取图片数据
      const localData = await this.getFromIndexedDB(imageInfo.id);
      if (!localData) {
        throw new Error('Local image data not found');
      }
      
      // 模拟上传过程（实际应该调用真实的上传API）
      const cloudUrl = await this.simulateCloudUpload(localData.data, imageInfo, (progress) => {
        imageInfo.uploadProgress = progress;
        this.notifyListeners(imageInfo);
      });
      
      // 更新状态为成功
      imageInfo.uploadStatus = 'success';
      imageInfo.cloudUrl = cloudUrl;
      imageInfo.uploadProgress = 100;
      imageInfo.updatedAt = new Date();
      
      // 更新数据库
      await this.saveToIndexedDB(imageInfo, localData.data, localData.thumbnail);
      
      this.notifyListeners(imageInfo);
      
    } catch (error) {
      // 更新状态为失败
      imageInfo.uploadStatus = 'failed';
      imageInfo.updatedAt = new Date();
      
      console.error('Upload failed:', error);
      this.notifyListeners(imageInfo);
    } finally {
      this.activeUploads.delete(imageInfo.id);
      this.uploadQueue.delete(imageInfo.id);
      
      // 继续处理队列
      setTimeout(() => this.processUploadQueue(), 100);
    }
  }

  // 模拟云端上传
  private async simulateCloudUpload(
    data: Blob,
    imageInfo: ImageInfo,
    onProgress: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // 模拟成功或失败
          if (Math.random() > 0.1) { // 90% 成功率
            resolve(`https://cdn.example.com/images/${imageInfo.name}`);
          } else {
            reject(new Error('Upload failed'));
          }
        }
        onProgress(progress);
      }, 100);
    });
  }

  // 重试上传
  public async retryUpload(id: string): Promise<void> {
    const imageInfo = await this.getImageInfo(id);
    if (!imageInfo || imageInfo.uploadStatus !== 'failed') {
      return;
    }
    
    imageInfo.uploadStatus = 'pending';
    imageInfo.uploadProgress = 0;
    this.uploadQueue.set(id, imageInfo);
    
    this.processUploadQueue();
  }

  // 获取图片信息
  public async getImageInfo(id: string): Promise<ImageInfo | null> {
    const data = await this.getFromIndexedDB(id);
    return data ? data.info : null;
  }

  // 获取图片列表
  public async getImageList(options: {
    status?: 'pending' | 'uploading' | 'success' | 'failed';
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<ImageInfo[]> {
    if (!this.db) return [];
    
    const transaction = this.db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let results = request.result as ImageInfo[];
        
        // 过滤
        if (options.status) {
          results = results.filter(img => img.uploadStatus === options.status);
        }
        
        if (options.tags && options.tags.length > 0) {
          results = results.filter(img => 
            options.tags!.some(tag => img.tags.includes(tag))
          );
        }
        
        // 排序
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // 分页
        if (options.offset || options.limit) {
          const start = options.offset || 0;
          const end = options.limit ? start + options.limit : undefined;
          results = results.slice(start, end);
        }
        
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  }

  // 删除图片
  public async deleteImage(id: string): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['images', 'imageData'], 'readwrite');
    
    // 删除图片信息
    const imageStore = transaction.objectStore('images');
    await new Promise<void>((resolve, reject) => {
      const request = imageStore.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // 删除图片数据
    const dataStore = transaction.objectStore('imageData');
    await new Promise<void>((resolve, reject) => {
      const request = dataStore.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // 从队列中移除
    this.uploadQueue.delete(id);
    this.activeUploads.delete(id);
  }

  // 清理缓存
  public async clearCache(options: {
    olderThan?: Date;
    status?: 'success' | 'failed';
    keepRecent?: number;
  } = {}): Promise<number> {
    const images = await this.getImageList();
    let toDelete = images;
    
    if (options.olderThan) {
      toDelete = toDelete.filter(img => img.createdAt < options.olderThan!);
    }
    
    if (options.status) {
      toDelete = toDelete.filter(img => img.uploadStatus === options.status);
    }
    
    if (options.keepRecent) {
      toDelete = toDelete.slice(options.keepRecent);
    }
    
    for (const image of toDelete) {
      await this.deleteImage(image.id);
    }
    
    return toDelete.length;
  }

  // 添加监听器
  public addListener(id: string, callback: (info: ImageInfo) => void): void {
    this.listeners.set(id, callback);
  }

  // 移除监听器
  public removeListener(id: string): void {
    this.listeners.delete(id);
  }

  // 通知监听器
  private notifyListeners(imageInfo: ImageInfo): void {
    this.listeners.forEach(callback => callback(imageInfo));
  }

  // 获取统计信息
  public async getStats(): Promise<{
    total: number;
    pending: number;
    uploading: number;
    success: number;
    failed: number;
    totalSize: number;
    savedSize: number;
  }> {
    const images = await this.getImageList();
    
    const stats = {
      total: images.length,
      pending: 0,
      uploading: 0,
      success: 0,
      failed: 0,
      totalSize: 0,
      savedSize: 0
    };
    
    images.forEach(img => {
      stats[img.uploadStatus]++;
      stats.totalSize += img.size;
      if (img.isCompressed && img.originalSize) {
        stats.savedSize += img.originalSize - img.size;
      }
    });
    
    return stats;
  }
}

// 导出单例实例
export const imageService = new ImageService();
export default imageService;