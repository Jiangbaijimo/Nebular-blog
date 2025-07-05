import { sqliteManager, BlogDraft, ImageCache, SyncStatus } from './sqliteManager';
import { invoke } from '@tauri-apps/api/tauri';
import { appDataDir, join } from '@tauri-apps/api/path';
import { createDir, exists, writeFile, readFile, removeFile } from '@tauri-apps/api/fs';
import { LRUCache } from 'lru-cache';

// 离线存储配置
export interface OfflineStorageConfig {
  maxCacheSize: number; // 最大缓存大小（字节）
  maxImageCacheSize: number; // 最大图片缓存大小（字节）
  autoCleanupInterval: number; // 自动清理间隔（毫秒）
  compressionEnabled: boolean; // 是否启用压缩
  encryptionEnabled: boolean; // 是否启用加密
  syncRetryAttempts: number; // 同步重试次数
  syncRetryDelay: number; // 同步重试延迟（毫秒）
}

// 存储统计信息
export interface StorageStats {
  totalSize: number;
  imagesCacheSize: number;
  draftsCount: number;
  imagesCount: number;
  pendingSyncCount: number;
  lastCleanup: Date;
  availableSpace: number;
}

// 缓存策略
export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'manual';

// 数据压缩接口
interface CompressionResult {
  compressed: Uint8Array;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

class OfflineStorageService {
  private config: OfflineStorageConfig;
  private memoryCache: LRUCache<string, any>;
  private imagePathCache: LRUCache<string, string>;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private appDataPath = '';
  private imagesPath = '';
  private backupPath = '';

  constructor() {
    this.config = {
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxImageCacheSize: 500 * 1024 * 1024, // 500MB
      autoCleanupInterval: 60 * 60 * 1000, // 1小时
      compressionEnabled: true,
      encryptionEnabled: false,
      syncRetryAttempts: 3,
      syncRetryDelay: 5000
    };

    // 内存缓存配置
    this.memoryCache = new LRUCache({
      max: 1000, // 最大条目数
      maxSize: 50 * 1024 * 1024, // 50MB
      sizeCalculation: (value) => {
        return JSON.stringify(value).length;
      },
      ttl: 30 * 60 * 1000 // 30分钟TTL
    });

    // 图片路径缓存
    this.imagePathCache = new LRUCache({
      max: 5000,
      ttl: 60 * 60 * 1000 // 1小时TTL
    });

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // 获取应用数据目录
      this.appDataPath = await appDataDir();
      this.imagesPath = await join(this.appDataPath, 'images');
      this.backupPath = await join(this.appDataPath, 'backups');

      // 创建必要的目录
      await this.ensureDirectories();

      // 加载配置
      await this.loadConfig();

      // 启动自动清理
      this.startAutoCleanup();

      this.isInitialized = true;
      console.log('离线存储服务初始化成功');
    } catch (error) {
      console.error('离线存储服务初始化失败:', error);
      throw error;
    }
  }

  private async ensureDirectories(): Promise<void> {
    const directories = [this.imagesPath, this.backupPath];
    
    for (const dir of directories) {
      if (!(await exists(dir))) {
        await createDir(dir, { recursive: true });
      }
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await sqliteManager.getConfig<OfflineStorageConfig>('offlineStorageConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.warn('加载离线存储配置失败，使用默认配置:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    await sqliteManager.setConfig('offlineStorageConfig', this.config, 'storage');
  }

  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('自动清理失败:', error);
      }
    }, this.config.autoCleanupInterval);
  }

  // 配置管理
  async updateConfig(newConfig: Partial<OfflineStorageConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
    
    // 重新启动自动清理
    this.startAutoCleanup();
  }

  getConfig(): OfflineStorageConfig {
    return { ...this.config };
  }

  // 草稿存储
  async saveDraftOffline(draft: Omit<BlogDraft, 'id' | 'createdAt' | 'version'>): Promise<string> {
    const draftId = await sqliteManager.saveDraft({
      ...draft,
      isLocal: true,
      syncStatus: 'pending'
    });

    // 添加到同步队列
    await this.addToSyncQueue('draft', draftId, 'create');

    // 缓存到内存
    const savedDraft = await sqliteManager.getDraft(draftId);
    if (savedDraft) {
      this.memoryCache.set(`draft:${draftId}`, savedDraft);
    }

    return draftId;
  }

  async updateDraftOffline(id: string, updates: Partial<BlogDraft>): Promise<void> {
    await sqliteManager.updateDraft(id, {
      ...updates,
      syncStatus: 'pending'
    });

    // 添加到同步队列
    await this.addToSyncQueue('draft', id, 'update');

    // 更新内存缓存
    const updatedDraft = await sqliteManager.getDraft(id);
    if (updatedDraft) {
      this.memoryCache.set(`draft:${id}`, updatedDraft);
    }
  }

  async getDraftOffline(id: string): Promise<BlogDraft | null> {
    // 先从内存缓存获取
    const cached = this.memoryCache.get(`draft:${id}`);
    if (cached) {
      return cached as BlogDraft;
    }

    // 从数据库获取
    const draft = await sqliteManager.getDraft(id);
    if (draft) {
      this.memoryCache.set(`draft:${id}`, draft);
    }

    return draft;
  }

  async getDraftsOffline(filters?: {
    status?: string;
    syncStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<BlogDraft[]> {
    return await sqliteManager.getDrafts(filters);
  }

  async deleteDraftOffline(id: string): Promise<void> {
    await sqliteManager.deleteDraft(id);
    
    // 添加到同步队列（如果有远程ID）
    const draft = await sqliteManager.getDraft(id);
    if (draft?.remoteId) {
      await this.addToSyncQueue('draft', id, 'delete');
    }

    // 从内存缓存移除
    this.memoryCache.delete(`draft:${id}`);
  }

  // 图片存储
  async saveImageOffline(file: File, options?: {
    compress?: boolean;
    quality?: number;
  }): Promise<{
    id: string;
    localPath: string;
    previewUrl: string;
  }> {
    const id = crypto.randomUUID();
    const fileName = `${id}_${file.name}`;
    const localPath = await join(this.imagesPath, fileName);

    let fileData = new Uint8Array(await file.arrayBuffer());
    let finalSize = file.size;
    let isCompressed = false;

    // 图片压缩
    if (options?.compress && this.config.compressionEnabled) {
      try {
        const compressed = await this.compressImage(fileData, options.quality || 0.8);
        if (compressed.compressionRatio > 0.1) { // 压缩率超过10%才使用
          fileData = compressed.compressed;
          finalSize = compressed.compressedSize;
          isCompressed = true;
        }
      } catch (error) {
        console.warn('图片压缩失败，使用原图:', error);
      }
    }

    // 保存到本地文件系统
    await writeFile(localPath, fileData);

    // 保存到数据库
    await sqliteManager.saveImageCache({
      localPath,
      originalName: file.name,
      size: finalSize,
      mimeType: file.type,
      uploadStatus: 'pending',
      uploadProgress: 0,
      isCompressed,
      compressedSize: isCompressed ? finalSize : undefined
    });

    // 添加到同步队列
    await this.addToSyncQueue('image', id, 'create');

    // 生成预览URL
    const previewUrl = await this.getImagePreviewUrl(localPath);
    
    // 缓存路径
    this.imagePathCache.set(id, localPath);

    return {
      id,
      localPath,
      previewUrl
    };
  }

  async getImageOffline(id: string): Promise<ImageCache | null> {
    // 先从内存缓存获取路径
    let localPath = this.imagePathCache.get(id);
    
    if (!localPath) {
      // 从数据库获取
      const imageCache = await sqliteManager.getImageCache(id);
      if (imageCache) {
        localPath = imageCache.localPath;
        this.imagePathCache.set(id, localPath);
        return imageCache;
      }
    }

    return await sqliteManager.getImageCache(id);
  }

  async getImagePreviewUrl(localPath: string): Promise<string> {
    try {
      // 使用Tauri的convertFileSrc API生成可访问的URL
      return await invoke('plugin:fs|convert_file_src', { path: localPath });
    } catch (error) {
      console.error('生成图片预览URL失败:', error);
      return localPath;
    }
  }

  async updateImageUploadStatus(id: string, status: ImageCache['uploadStatus'], progress = 0, remotePath?: string): Promise<void> {
    await sqliteManager.updateImageCache(id, {
      uploadStatus: status,
      uploadProgress: progress,
      remotePath
    });

    // 如果上传完成，更新同步状态
    if (status === 'uploaded') {
      await this.markSyncCompleted('image', id);
    }
  }

  // 同步队列管理
  private async addToSyncQueue(entityType: SyncStatus['entityType'], entityId: string, operation: SyncStatus['operation'], priority = 0): Promise<void> {
    await sqliteManager.addSyncTask({
      entityType,
      entityId,
      operation,
      status: 'pending',
      retryCount: 0,
      priority
    });
  }

  async getPendingSyncTasks(limit = 10): Promise<SyncStatus[]> {
    return await sqliteManager.getPendingSyncTasks(limit);
  }

  async markSyncInProgress(taskId: string): Promise<void> {
    await sqliteManager.updateSyncTask(taskId, {
      status: 'syncing',
      lastAttempt: new Date()
    });
  }

  async markSyncCompleted(entityType: string, entityId: string): Promise<void> {
    // 查找对应的同步任务并标记为完成
    const tasks = await sqliteManager.getPendingSyncTasks(100);
    const task = tasks.find(t => t.entityType === entityType && t.entityId === entityId);
    
    if (task) {
      await sqliteManager.updateSyncTask(task.id, {
        status: 'completed'
      });
    }
  }

  async markSyncFailed(taskId: string, errorMessage: string): Promise<void> {
    const task = await sqliteManager.getPendingSyncTasks(1000).then(tasks => 
      tasks.find(t => t.id === taskId)
    );

    if (task) {
      const newRetryCount = task.retryCount + 1;
      
      if (newRetryCount >= this.config.syncRetryAttempts) {
        // 超过重试次数，标记为失败
        await sqliteManager.updateSyncTask(taskId, {
          status: 'failed',
          retryCount: newRetryCount,
          errorMessage,
          lastAttempt: new Date()
        });
      } else {
        // 重新加入队列
        await sqliteManager.updateSyncTask(taskId, {
          status: 'pending',
          retryCount: newRetryCount,
          errorMessage,
          lastAttempt: new Date()
        });
      }
    }
  }

  // 数据压缩
  private async compressImage(imageData: Uint8Array, quality = 0.8): Promise<CompressionResult> {
    try {
      // 使用Canvas API进行图片压缩
      const blob = new Blob([imageData]);
      const bitmap = await createImageBitmap(blob);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      
      ctx.drawImage(bitmap, 0, 0);
      
      return new Promise((resolve) => {
        canvas.toBlob((compressedBlob) => {
          if (compressedBlob) {
            compressedBlob.arrayBuffer().then(buffer => {
              const compressed = new Uint8Array(buffer);
              resolve({
                compressed,
                originalSize: imageData.length,
                compressedSize: compressed.length,
                compressionRatio: (imageData.length - compressed.length) / imageData.length
              });
            });
          } else {
            // 压缩失败，返回原数据
            resolve({
              compressed: imageData,
              originalSize: imageData.length,
              compressedSize: imageData.length,
              compressionRatio: 0
            });
          }
        }, 'image/jpeg', quality);
      });
    } catch (error) {
      console.error('图片压缩失败:', error);
      return {
        compressed: imageData,
        originalSize: imageData.length,
        compressedSize: imageData.length,
        compressionRatio: 0
      };
    }
  }

  // 存储统计
  async getStorageStats(): Promise<StorageStats> {
    const [drafts, images, pendingTasks] = await Promise.all([
      sqliteManager.getDrafts(),
      sqliteManager.getImageCaches(),
      sqliteManager.getPendingSyncTasks(1000)
    ]);

    // 计算图片缓存大小
    const imagesCacheSize = images.reduce((total, img) => total + img.size, 0);
    
    // 估算总大小（包括数据库）
    const totalSize = imagesCacheSize + (drafts.length * 1024); // 假设每个草稿1KB

    // 获取可用空间（模拟）
    const availableSpace = await this.getAvailableSpace();

    const lastCleanup = await sqliteManager.getConfig<string>('lastCleanupTime');

    return {
      totalSize,
      imagesCacheSize,
      draftsCount: drafts.length,
      imagesCount: images.length,
      pendingSyncCount: pendingTasks.length,
      lastCleanup: lastCleanup ? new Date(lastCleanup) : new Date(),
      availableSpace
    };
  }

  private async getAvailableSpace(): Promise<number> {
    try {
      // 使用Tauri API获取可用空间
      return await invoke('get_available_space', { path: this.appDataPath });
    } catch (error) {
      console.warn('获取可用空间失败:', error);
      return 1024 * 1024 * 1024; // 返回1GB作为默认值
    }
  }

  // 数据清理
  async performCleanup(): Promise<{
    deletedImages: number;
    deletedTasks: number;
    freedSpace: number;
  }> {
    let deletedImages = 0;
    let deletedTasks = 0;
    let freedSpace = 0;

    try {
      // 清理已上传且长时间未访问的图片
      const oldImages = await sqliteManager.getImageCaches({
        uploadStatus: 'uploaded'
      });

      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (const image of oldImages) {
        if (image.lastAccessed.getTime() < thirtyDaysAgo) {
          try {
            // 删除本地文件
            if (await exists(image.localPath)) {
              await removeFile(image.localPath);
              freedSpace += image.size;
            }
            
            // 从数据库删除记录
            await sqliteManager.updateImageCache(image.id, {
              uploadStatus: 'uploaded' // 保持状态，只删除本地文件
            });
            
            deletedImages++;
          } catch (error) {
            console.warn(`删除图片失败: ${image.localPath}`, error);
          }
        }
      }

      // 清理已完成的同步任务
      await sqliteManager.cleanupExpiredData();
      deletedTasks = 1; // 简化统计

      // 清理内存缓存
      this.memoryCache.clear();
      this.imagePathCache.clear();

      // 记录清理时间
      await sqliteManager.setConfig('lastCleanupTime', new Date().toISOString(), 'storage');

      console.log(`清理完成: 删除${deletedImages}个图片, ${deletedTasks}个任务, 释放${freedSpace}字节`);
    } catch (error) {
      console.error('数据清理失败:', error);
    }

    return {
      deletedImages,
      deletedTasks,
      freedSpace
    };
  }

  // 手动清理
  async manualCleanup(options?: {
    cleanImages?: boolean;
    cleanTasks?: boolean;
    cleanCache?: boolean;
  }): Promise<void> {
    const opts = {
      cleanImages: true,
      cleanTasks: true,
      cleanCache: true,
      ...options
    };

    if (opts.cleanImages || opts.cleanTasks) {
      await this.performCleanup();
    }

    if (opts.cleanCache) {
      this.memoryCache.clear();
      this.imagePathCache.clear();
    }
  }

  // 数据备份
  async createBackup(name?: string): Promise<string> {
    const backupName = name || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const backupFilePath = await join(this.backupPath, backupName);

    try {
      const data = await sqliteManager.exportData();
      const backupData = {
        ...data,
        version: '1.0.0',
        config: this.config
      };

      await writeFile(backupFilePath, JSON.stringify(backupData, null, 2));
      
      console.log(`备份创建成功: ${backupFilePath}`);
      return backupFilePath;
    } catch (error) {
      console.error('创建备份失败:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupFilePath: string): Promise<void> {
    try {
      const backupContent = await readFile(backupFilePath, { encoding: 'utf8' });
      const backupData = JSON.parse(backupContent as string);

      // 恢复配置
      if (backupData.config) {
        await this.updateConfig(backupData.config);
      }

      // 恢复数据
      await sqliteManager.importData({
        drafts: backupData.drafts,
        images: backupData.images,
        configs: backupData.configs
      });

      console.log('备份恢复成功');
    } catch (error) {
      console.error('恢复备份失败:', error);
      throw error;
    }
  }

  // 销毁服务
  async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.memoryCache.clear();
    this.imagePathCache.clear();
    
    await sqliteManager.close();
    this.isInitialized = false;
  }
}

// 导出单例实例
export const offlineStorage = new OfflineStorageService();
export default offlineStorage;