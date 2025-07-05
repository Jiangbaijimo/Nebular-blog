import { sqliteManager, BlogDraft, ImageCache, SyncStatus, UserConfig } from './sqliteManager';
import { EventEmitter } from 'events';

// 离线存储配置
export interface OfflineStorageConfig {
  maxCacheSize: number; // 最大缓存大小（字节）
  maxDraftHistory: number; // 最大草稿历史记录数
  autoCleanupInterval: number; // 自动清理间隔（毫秒）
  compressionEnabled: boolean; // 是否启用压缩
  encryptionEnabled: boolean; // 是否启用加密
  syncOnNetworkRestore: boolean; // 网络恢复时是否自动同步
}

// 存储统计信息
export interface StorageStats {
  totalSize: number;
  draftCount: number;
  imageCount: number;
  pendingSyncCount: number;
  lastCleanup: Date;
  cacheHitRate: number;
}

// 数据备份信息
export interface BackupInfo {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
  type: 'full' | 'incremental';
  compressed: boolean;
  encrypted: boolean;
}

class OfflineStorageService extends EventEmitter {
  private config: OfflineStorageConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    super();
    
    this.config = {
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxDraftHistory: 100,
      autoCleanupInterval: 24 * 60 * 60 * 1000, // 24小时
      compressionEnabled: true,
      encryptionEnabled: false,
      syncOnNetworkRestore: true
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // 加载配置
      await this.loadConfig();
      
      // 启动自动清理
      this.startAutoCleanup();
      
      // 监听网络状态变化
      this.setupNetworkListener();
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('离线存储服务初始化成功');
    } catch (error) {
      console.error('离线存储服务初始化失败:', error);
      throw error;
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

  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.performAutoCleanup();
    }, this.config.autoCleanupInterval);
  }

  private setupNetworkListener(): void {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      if (this.config.syncOnNetworkRestore) {
        this.emit('network_restored');
        this.triggerPendingSync();
      }
    });

    window.addEventListener('offline', () => {
      this.emit('network_lost');
    });
  }

  // 配置管理
  async updateConfig(newConfig: Partial<OfflineStorageConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await sqliteManager.setConfig('offlineStorageConfig', this.config, 'general');
    
    // 重启自动清理
    this.startAutoCleanup();
    
    this.emit('config_updated', this.config);
  }

  getConfig(): OfflineStorageConfig {
    return { ...this.config };
  }

  // 草稿离线存储
  async saveDraftOffline(draft: Partial<BlogDraft>): Promise<string> {
    try {
      const draftData = {
        title: draft.title || '无标题',
        content: draft.content || '',
        excerpt: draft.excerpt,
        tags: draft.tags || [],
        categories: draft.categories || [],
        featuredImage: draft.featuredImage,
        status: draft.status || 'draft',
        isLocal: true,
        lastModified: new Date(),
        syncStatus: 'pending' as const,
        remoteId: draft.remoteId
      };

      const draftId = await sqliteManager.saveDraft(draftData);
      
      // 添加到同步队列
      await this.addToSyncQueue('draft', draftId, 'create');
      
      this.emit('draft_saved_offline', { draftId, draft: draftData });
      return draftId;
    } catch (error) {
      console.error('离线保存草稿失败:', error);
      throw error;
    }
  }

  async updateDraftOffline(draftId: string, updates: Partial<BlogDraft>): Promise<void> {
    try {
      await sqliteManager.updateDraft(draftId, {
        ...updates,
        lastModified: new Date(),
        syncStatus: 'pending'
      });
      
      // 添加到同步队列
      await this.addToSyncQueue('draft', draftId, 'update');
      
      this.emit('draft_updated_offline', { draftId, updates });
    } catch (error) {
      console.error('离线更新草稿失败:', error);
      throw error;
    }
  }

  async deleteDraftOffline(draftId: string): Promise<void> {
    try {
      await sqliteManager.deleteDraft(draftId);
      
      // 添加到同步队列
      await this.addToSyncQueue('draft', draftId, 'delete');
      
      this.emit('draft_deleted_offline', { draftId });
    } catch (error) {
      console.error('离线删除草稿失败:', error);
      throw error;
    }
  }

  async getDraftsOffline(filters?: {
    status?: string;
    syncStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<BlogDraft[]> {
    try {
      return await sqliteManager.getDrafts(filters);
    } catch (error) {
      console.error('获取离线草稿失败:', error);
      throw error;
    }
  }

  // 图片离线存储
  async saveImageOffline(imageData: {
    localPath: string;
    originalName: string;
    size: number;
    mimeType: string;
    file?: File;
  }): Promise<string> {
    try {
      const imageCache: Omit<ImageCache, 'id' | 'createdAt' | 'lastAccessed'> = {
        localPath: imageData.localPath,
        originalName: imageData.originalName,
        size: imageData.size,
        mimeType: imageData.mimeType,
        uploadStatus: 'pending',
        uploadProgress: 0,
        isCompressed: false
      };

      const imageId = await sqliteManager.saveImageCache(imageCache);
      
      // 如果有文件数据，进行压缩处理
      if (imageData.file && this.config.compressionEnabled) {
        await this.compressAndSaveImage(imageId, imageData.file);
      }
      
      // 添加到同步队列
      await this.addToSyncQueue('image', imageId, 'create');
      
      this.emit('image_saved_offline', { imageId, imageData });
      return imageId;
    } catch (error) {
      console.error('离线保存图片失败:', error);
      throw error;
    }
  }

  private async compressAndSaveImage(imageId: string, file: File): Promise<void> {
    try {
      // 创建压缩后的图片
      const compressedFile = await this.compressImage(file);
      
      // 更新图片缓存信息
      await sqliteManager.updateImageCache(imageId, {
        isCompressed: true,
        compressedSize: compressedFile.size,
        size: compressedFile.size
      });
      
      console.log(`图片 ${imageId} 压缩完成，原大小: ${file.size}, 压缩后: ${compressedFile.size}`);
    } catch (error) {
      console.error('图片压缩失败:', error);
    }
  }

  private async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = URL.createObjectURL(file);
    });
  }

  async getImagesOffline(filters?: {
    uploadStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<ImageCache[]> {
    try {
      return await sqliteManager.getImageCaches(filters);
    } catch (error) {
      console.error('获取离线图片失败:', error);
      throw error;
    }
  }

  async deleteImageOffline(imageId: string): Promise<void> {
    try {
      await sqliteManager.deleteImageCache(imageId);
      
      // 添加到同步队列
      await this.addToSyncQueue('image', imageId, 'delete');
      
      this.emit('image_deleted_offline', { imageId });
    } catch (error) {
      console.error('离线删除图片失败:', error);
      throw error;
    }
  }

  // 同步队列管理
  private async addToSyncQueue(
    entityType: 'draft' | 'image' | 'settings',
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    priority: number = 0
  ): Promise<void> {
    try {
      const syncTask: Omit<SyncStatus, 'id' | 'createdAt'> = {
        entityType,
        entityId,
        operation,
        status: 'pending',
        retryCount: 0,
        priority,
        lastAttempt: undefined,
        errorMessage: undefined
      };

      await sqliteManager.addSyncTask(syncTask);
      this.emit('sync_task_added', syncTask);
    } catch (error) {
      console.error('添加同步任务失败:', error);
    }
  }

  async getPendingSyncTasks(limit: number = 50): Promise<SyncStatus[]> {
    try {
      return await sqliteManager.getPendingSyncTasks(limit);
    } catch (error) {
      console.error('获取待同步任务失败:', error);
      return [];
    }
  }

  private async triggerPendingSync(): Promise<void> {
    try {
      const pendingTasks = await this.getPendingSyncTasks();
      if (pendingTasks.length > 0) {
        this.emit('sync_required', pendingTasks);
        console.log(`发现 ${pendingTasks.length} 个待同步任务`);
      }
    } catch (error) {
      console.error('触发待同步任务失败:', error);
    }
  }

  // 存储统计
  async getStorageStats(): Promise<StorageStats> {
    try {
      const [drafts, images, pendingSync] = await Promise.all([
        this.getDraftsOffline(),
        this.getImagesOffline(),
        this.getPendingSyncTasks(1000)
      ]);

      const totalSize = images.reduce((sum, img) => sum + img.size, 0);
      
      const lastCleanupStr = await sqliteManager.getConfig<string>('lastCleanupTime');
      const lastCleanup = lastCleanupStr ? new Date(lastCleanupStr) : new Date(0);

      return {
        totalSize,
        draftCount: drafts.length,
        imageCount: images.length,
        pendingSyncCount: pendingSync.length,
        lastCleanup,
        cacheHitRate: 0.95 // 模拟缓存命中率
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      throw error;
    }
  }

  // 数据清理
  async performAutoCleanup(): Promise<void> {
    try {
      console.log('开始自动清理离线数据...');
      
      // 清理过期的图片缓存
      await this.cleanupExpiredImages();
      
      // 清理过期的草稿历史
      await this.cleanupOldDrafts();
      
      // 清理已完成的同步任务
      await this.cleanupCompletedSyncTasks();
      
      // 检查存储空间
      await this.checkStorageLimit();
      
      // 更新最后清理时间
      await sqliteManager.setConfig('lastCleanupTime', new Date().toISOString(), 'general');
      
      this.emit('cleanup_completed');
      console.log('自动清理完成');
    } catch (error) {
      console.error('自动清理失败:', error);
      this.emit('cleanup_failed', error);
    }
  }

  private async cleanupExpiredImages(): Promise<void> {
    try {
      // 删除30天未访问的图片
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const expiredImages = await sqliteManager.getImageCaches({
        lastAccessedBefore: thirtyDaysAgo
      });
      
      for (const image of expiredImages) {
        await this.deleteImageOffline(image.id);
      }
      
      console.log(`清理了 ${expiredImages.length} 个过期图片`);
    } catch (error) {
      console.error('清理过期图片失败:', error);
    }
  }

  private async cleanupOldDrafts(): Promise<void> {
    try {
      const allDrafts = await sqliteManager.getDrafts();
      
      if (allDrafts.length > this.config.maxDraftHistory) {
        // 按最后修改时间排序，删除最旧的草稿
        const sortedDrafts = allDrafts.sort((a, b) => 
          b.lastModified.getTime() - a.lastModified.getTime()
        );
        
        const draftsToDelete = sortedDrafts.slice(this.config.maxDraftHistory);
        
        for (const draft of draftsToDelete) {
          if (draft.syncStatus === 'synced') {
            await this.deleteDraftOffline(draft.id);
          }
        }
        
        console.log(`清理了 ${draftsToDelete.length} 个旧草稿`);
      }
    } catch (error) {
      console.error('清理旧草稿失败:', error);
    }
  }

  private async cleanupCompletedSyncTasks(): Promise<void> {
    try {
      // 删除7天前完成的同步任务
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      await sqliteManager.cleanupSyncTasks(sevenDaysAgo);
      
      console.log('清理了已完成的同步任务');
    } catch (error) {
      console.error('清理同步任务失败:', error);
    }
  }

  private async checkStorageLimit(): Promise<void> {
    try {
      const stats = await this.getStorageStats();
      
      if (stats.totalSize > this.config.maxCacheSize) {
        console.warn(`存储空间超限: ${stats.totalSize} > ${this.config.maxCacheSize}`);
        
        // 删除最旧的图片直到低于限制
        const images = await sqliteManager.getImageCaches();
        const sortedImages = images.sort((a, b) => 
          a.lastAccessed.getTime() - b.lastAccessed.getTime()
        );
        
        let currentSize = stats.totalSize;
        for (const image of sortedImages) {
          if (currentSize <= this.config.maxCacheSize * 0.8) break;
          
          await this.deleteImageOffline(image.id);
          currentSize -= image.size;
        }
        
        this.emit('storage_limit_exceeded', { oldSize: stats.totalSize, newSize: currentSize });
      }
    } catch (error) {
      console.error('检查存储限制失败:', error);
    }
  }

  async manualCleanup(options: {
    cleanImages?: boolean;
    cleanDrafts?: boolean;
    cleanSyncTasks?: boolean;
    force?: boolean;
  }): Promise<void> {
    try {
      if (options.cleanImages) {
        await this.cleanupExpiredImages();
      }
      
      if (options.cleanDrafts) {
        await this.cleanupOldDrafts();
      }
      
      if (options.cleanSyncTasks) {
        await this.cleanupCompletedSyncTasks();
      }
      
      this.emit('manual_cleanup_completed', options);
    } catch (error) {
      console.error('手动清理失败:', error);
      throw error;
    }
  }

  // 数据备份和恢复
  async createBackup(name: string, type: 'full' | 'incremental' = 'full'): Promise<BackupInfo> {
    try {
      const backupId = crypto.randomUUID();
      const timestamp = new Date();
      
      // 获取要备份的数据
      const [drafts, images, configs] = await Promise.all([
        this.getDraftsOffline(),
        this.getImagesOffline(),
        sqliteManager.getAllConfigs()
      ]);
      
      const backupData = {
        version: '1.0',
        timestamp: timestamp.toISOString(),
        type,
        data: {
          drafts,
          images: images.map(img => ({ ...img, localPath: undefined })), // 不备份本地路径
          configs
        }
      };
      
      // 压缩备份数据
      const compressedData = this.config.compressionEnabled 
        ? await this.compressData(JSON.stringify(backupData))
        : JSON.stringify(backupData);
      
      // 保存备份信息
      const backupInfo: BackupInfo = {
        id: backupId,
        name,
        size: compressedData.length,
        createdAt: timestamp,
        type,
        compressed: this.config.compressionEnabled,
        encrypted: this.config.encryptionEnabled
      };
      
      await sqliteManager.setConfig(`backup_${backupId}`, backupInfo, 'general');
      await sqliteManager.setConfig(`backup_data_${backupId}`, compressedData, 'general');
      
      this.emit('backup_created', backupInfo);
      return backupInfo;
    } catch (error) {
      console.error('创建备份失败:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    try {
      const backupInfo = await sqliteManager.getConfig<BackupInfo>(`backup_${backupId}`);
      if (!backupInfo) {
        throw new Error(`备份 ${backupId} 不存在`);
      }
      
      const backupData = await sqliteManager.getConfig<string>(`backup_data_${backupId}`);
      if (!backupData) {
        throw new Error(`备份数据 ${backupId} 不存在`);
      }
      
      // 解压数据
      const dataStr = backupInfo.compressed 
        ? await this.decompressData(backupData)
        : backupData;
      
      const data = JSON.parse(dataStr);
      
      // 恢复数据
      if (data.data.drafts) {
        for (const draft of data.data.drafts) {
          await this.saveDraftOffline(draft);
        }
      }
      
      if (data.data.configs) {
        for (const config of data.data.configs) {
          await sqliteManager.setConfig(config.key, config.value, config.category);
        }
      }
      
      this.emit('backup_restored', { backupId, backupInfo });
      console.log(`备份 ${backupId} 恢复成功`);
    } catch (error) {
      console.error('恢复备份失败:', error);
      throw error;
    }
  }

  private async compressData(data: string): Promise<string> {
    // 简化的压缩实现，实际项目中可以使用更好的压缩算法
    return btoa(data);
  }

  private async decompressData(compressedData: string): Promise<string> {
    // 简化的解压实现
    return atob(compressedData);
  }

  // 服务销毁
  async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.removeAllListeners();
    this.isInitialized = false;
    
    console.log('离线存储服务已销毁');
  }
}

// 导出单例实例
export const offlineStorageService = new OfflineStorageService();
export default offlineStorageService;