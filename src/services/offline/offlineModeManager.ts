import { EventEmitter } from 'events';
import { sqliteManager, BlogDraft, ImageCache } from '../database/sqliteManager';
import { offlineStorageService } from '../database/offlineStorageService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSyncStore } from '../../stores/syncStore';

// 离线模式配置
export interface OfflineModeConfig {
  enabled: boolean;
  autoEnableOnDisconnect: boolean;
  showOfflineIndicator: boolean;
  cacheStrategy: 'aggressive' | 'conservative' | 'minimal';
  maxOfflineStorage: number; // MB
  syncOnReconnect: boolean;
  conflictResolution: 'local' | 'remote' | 'ask';
}

// 离线操作类型
export type OfflineOperation = 
  | 'create_draft'
  | 'update_draft'
  | 'delete_draft'
  | 'upload_image'
  | 'delete_image'
  | 'update_settings';

// 离线操作记录
export interface OfflineOperationRecord {
  id: string;
  operation: OfflineOperation;
  entityType: 'draft' | 'image' | 'settings';
  entityId: string;
  data: any;
  timestamp: Date;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

// 离线状态
export interface OfflineStatus {
  isOfflineMode: boolean;
  pendingOperations: number;
  cachedItems: {
    drafts: number;
    images: number;
    totalSize: number;
  };
  lastSync: Date | null;
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

// 离线搜索索引
interface SearchIndex {
  id: string;
  type: 'draft' | 'image';
  title: string;
  content: string;
  tags: string[];
  categories: string[];
  keywords: string[];
  lastModified: Date;
}

class OfflineModeManager extends EventEmitter {
  private config: OfflineModeConfig;
  private isOfflineMode = false;
  private searchIndex: SearchIndex[] = [];
  private operationQueue: OfflineOperationRecord[] = [];
  private isInitialized = false;

  constructor() {
    super();
    
    this.config = {
      enabled: true,
      autoEnableOnDisconnect: true,
      showOfflineIndicator: true,
      cacheStrategy: 'conservative',
      maxOfflineStorage: 500, // 500MB
      syncOnReconnect: true,
      conflictResolution: 'ask'
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // 加载配置
      await this.loadConfig();
      
      // 加载操作队列
      await this.loadOperationQueue();
      
      // 构建搜索索引
      await this.buildSearchIndex();
      
      // 监听网络状态变化
      this.setupNetworkListener();
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('离线模式管理器初始化成功');
    } catch (error) {
      console.error('离线模式管理器初始化失败:', error);
      throw error;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await sqliteManager.getConfig<OfflineModeConfig>('offlineModeConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.warn('加载离线模式配置失败，使用默认配置:', error);
    }
  }

  private async loadOperationQueue(): Promise<void> {
    try {
      const operations = await sqliteManager.getConfig<OfflineOperationRecord[]>('offlineOperations') || [];
      this.operationQueue = operations.map(op => ({
        ...op,
        timestamp: new Date(op.timestamp)
      }));
    } catch (error) {
      console.warn('加载离线操作队列失败:', error);
      this.operationQueue = [];
    }
  }

  private async saveOperationQueue(): Promise<void> {
    try {
      await sqliteManager.setConfig('offlineOperations', this.operationQueue, 'offline');
    } catch (error) {
      console.error('保存离线操作队列失败:', error);
    }
  }

  private setupNetworkListener(): void {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.handleNetworkOnline();
    });

    window.addEventListener('offline', () => {
      this.handleNetworkOffline();
    });

    // 初始状态检查
    if (!navigator.onLine && this.config.autoEnableOnDisconnect) {
      this.enableOfflineMode();
    }
  }

  private async handleNetworkOnline(): Promise<void> {
    console.log('网络已连接，处理离线模式恢复');
    
    if (this.config.syncOnReconnect && this.operationQueue.length > 0) {
      await this.syncPendingOperations();
    }
    
    if (this.config.autoEnableOnDisconnect) {
      this.disableOfflineMode();
    }
    
    this.emit('network_online');
  }

  private handleNetworkOffline(): void {
    console.log('网络已断开，启用离线模式');
    
    if (this.config.autoEnableOnDisconnect) {
      this.enableOfflineMode();
    }
    
    this.emit('network_offline');
  }

  // 配置管理
  async updateConfig(newConfig: Partial<OfflineModeConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await sqliteManager.setConfig('offlineModeConfig', this.config, 'offline');
    this.emit('config_updated', this.config);
  }

  getConfig(): OfflineModeConfig {
    return { ...this.config };
  }

  // 离线模式控制
  enableOfflineMode(): void {
    if (this.isOfflineMode) return;
    
    this.isOfflineMode = true;
    this.emit('offline_mode_enabled');
    console.log('离线模式已启用');
  }

  disableOfflineMode(): void {
    if (!this.isOfflineMode) return;
    
    this.isOfflineMode = false;
    this.emit('offline_mode_disabled');
    console.log('离线模式已禁用');
  }

  isOffline(): boolean {
    return this.isOfflineMode;
  }

  // 离线操作管理
  async addOfflineOperation(
    operation: OfflineOperation,
    entityType: 'draft' | 'image' | 'settings',
    entityId: string,
    data: any
  ): Promise<string> {
    const operationRecord: OfflineOperationRecord = {
      id: crypto.randomUUID(),
      operation,
      entityType,
      entityId,
      data,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };

    this.operationQueue.push(operationRecord);
    await this.saveOperationQueue();
    
    this.emit('operation_added', operationRecord);
    return operationRecord.id;
  }

  async removeOfflineOperation(operationId: string): Promise<void> {
    const index = this.operationQueue.findIndex(op => op.id === operationId);
    if (index !== -1) {
      const operation = this.operationQueue.splice(index, 1)[0];
      await this.saveOperationQueue();
      this.emit('operation_removed', operation);
    }
  }

  async markOperationSynced(operationId: string): Promise<void> {
    const operation = this.operationQueue.find(op => op.id === operationId);
    if (operation) {
      operation.status = 'synced';
      await this.saveOperationQueue();
      this.emit('operation_synced', operation);
    }
  }

  async markOperationFailed(operationId: string, error: string): Promise<void> {
    const operation = this.operationQueue.find(op => op.id === operationId);
    if (operation) {
      operation.status = 'failed';
      operation.error = error;
      operation.retryCount++;
      await this.saveOperationQueue();
      this.emit('operation_failed', operation);
    }
  }

  getPendingOperations(): OfflineOperationRecord[] {
    return this.operationQueue.filter(op => op.status === 'pending');
  }

  getFailedOperations(): OfflineOperationRecord[] {
    return this.operationQueue.filter(op => op.status === 'failed');
  }

  // 同步待处理操作
  async syncPendingOperations(): Promise<void> {
    const pendingOps = this.getPendingOperations();
    if (pendingOps.length === 0) {
      console.log('没有待同步的离线操作');
      return;
    }

    console.log(`开始同步 ${pendingOps.length} 个离线操作`);
    this.emit('sync_started', { count: pendingOps.length });

    let syncedCount = 0;
    let failedCount = 0;

    for (const operation of pendingOps) {
      try {
        await this.syncOperation(operation);
        await this.markOperationSynced(operation.id);
        syncedCount++;
      } catch (error) {
        console.error(`同步操作失败 ${operation.id}:`, error);
        await this.markOperationFailed(
          operation.id, 
          error instanceof Error ? error.message : '未知错误'
        );
        failedCount++;
      }
    }

    this.emit('sync_completed', { syncedCount, failedCount });
    console.log(`离线操作同步完成: ${syncedCount} 成功, ${failedCount} 失败`);
  }

  private async syncOperation(operation: OfflineOperationRecord): Promise<void> {
    // 这里应该调用相应的API来同步操作
    // 简化实现，实际项目中需要根据操作类型调用不同的API
    
    switch (operation.operation) {
      case 'create_draft':
      case 'update_draft':
        // 调用博客API同步草稿
        console.log(`同步草稿操作: ${operation.operation}`);
        break;
      case 'delete_draft':
        // 调用删除API
        console.log(`同步删除草稿操作: ${operation.entityId}`);
        break;
      case 'upload_image':
        // 调用图片上传API
        console.log(`同步图片上传操作: ${operation.entityId}`);
        break;
      case 'delete_image':
        // 调用图片删除API
        console.log(`同步图片删除操作: ${operation.entityId}`);
        break;
      case 'update_settings':
        // 调用设置更新API
        console.log(`同步设置更新操作`);
        break;
      default:
        throw new Error(`未知的操作类型: ${operation.operation}`);
    }
  }

  // 离线草稿管理
  async createDraftOffline(draft: Partial<BlogDraft>): Promise<string> {
    const draftId = await offlineStorageService.saveDraftOffline(draft);
    
    await this.addOfflineOperation('create_draft', 'draft', draftId, draft);
    await this.updateSearchIndex();
    
    this.emit('draft_created_offline', { draftId, draft });
    return draftId;
  }

  async updateDraftOffline(draftId: string, updates: Partial<BlogDraft>): Promise<void> {
    await offlineStorageService.updateDraftOffline(draftId, updates);
    
    await this.addOfflineOperation('update_draft', 'draft', draftId, updates);
    await this.updateSearchIndex();
    
    this.emit('draft_updated_offline', { draftId, updates });
  }

  async deleteDraftOffline(draftId: string): Promise<void> {
    await offlineStorageService.deleteDraftOffline(draftId);
    
    await this.addOfflineOperation('delete_draft', 'draft', draftId, null);
    await this.updateSearchIndex();
    
    this.emit('draft_deleted_offline', { draftId });
  }

  async getDraftsOffline(filters?: any): Promise<BlogDraft[]> {
    return await offlineStorageService.getDraftsOffline(filters);
  }

  // 离线图片管理
  async uploadImageOffline(imageData: {
    localPath: string;
    originalName: string;
    size: number;
    mimeType: string;
    file?: File;
  }): Promise<string> {
    const imageId = await offlineStorageService.saveImageOffline(imageData);
    
    await this.addOfflineOperation('upload_image', 'image', imageId, imageData);
    
    this.emit('image_uploaded_offline', { imageId, imageData });
    return imageId;
  }

  async deleteImageOffline(imageId: string): Promise<void> {
    await offlineStorageService.deleteImageOffline(imageId);
    
    await this.addOfflineOperation('delete_image', 'image', imageId, null);
    
    this.emit('image_deleted_offline', { imageId });
  }

  async getImagesOffline(filters?: any): Promise<ImageCache[]> {
    return await offlineStorageService.getImagesOffline(filters);
  }

  // 离线搜索功能
  async buildSearchIndex(): Promise<void> {
    try {
      const [drafts, images] = await Promise.all([
        this.getDraftsOffline(),
        this.getImagesOffline()
      ]);

      this.searchIndex = [];

      // 索引草稿
      for (const draft of drafts) {
        const keywords = this.extractKeywords(draft.content);
        this.searchIndex.push({
          id: draft.id,
          type: 'draft',
          title: draft.title,
          content: draft.content,
          tags: draft.tags,
          categories: draft.categories,
          keywords,
          lastModified: draft.lastModified
        });
      }

      // 索引图片
      for (const image of images) {
        this.searchIndex.push({
          id: image.id,
          type: 'image',
          title: image.originalName,
          content: image.originalName,
          tags: [],
          categories: [],
          keywords: [image.originalName, image.mimeType],
          lastModified: image.lastAccessed
        });
      }

      console.log(`搜索索引构建完成，共 ${this.searchIndex.length} 项`);
    } catch (error) {
      console.error('构建搜索索引失败:', error);
    }
  }

  async updateSearchIndex(): Promise<void> {
    await this.buildSearchIndex();
  }

  private extractKeywords(content: string): string[] {
    // 简单的关键词提取
    const words = content
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    // 去重并返回前20个最常见的词
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  async searchOffline(query: string, options?: {
    type?: 'draft' | 'image' | 'all';
    limit?: number;
    sortBy?: 'relevance' | 'date';
  }): Promise<SearchIndex[]> {
    const { type = 'all', limit = 50, sortBy = 'relevance' } = options || {};
    
    if (!query.trim()) {
      return [];
    }

    const searchTerms = query.toLowerCase().split(/\s+/);
    const results: Array<SearchIndex & { score: number }> = [];

    for (const item of this.searchIndex) {
      if (type !== 'all' && item.type !== type) {
        continue;
      }

      let score = 0;
      const searchableText = [
        item.title,
        item.content,
        ...item.tags,
        ...item.categories,
        ...item.keywords
      ].join(' ').toLowerCase();

      // 计算相关性分数
      for (const term of searchTerms) {
        if (item.title.toLowerCase().includes(term)) {
          score += 10; // 标题匹配权重最高
        }
        if (item.tags.some(tag => tag.toLowerCase().includes(term))) {
          score += 5; // 标签匹配
        }
        if (item.categories.some(cat => cat.toLowerCase().includes(term))) {
          score += 5; // 分类匹配
        }
        if (searchableText.includes(term)) {
          score += 1; // 内容匹配
        }
      }

      if (score > 0) {
        results.push({ ...item, score });
      }
    }

    // 排序
    if (sortBy === 'relevance') {
      results.sort((a, b) => b.score - a.score);
    } else {
      results.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    }

    return results.slice(0, limit).map(({ score, ...item }) => item);
  }

  // 获取离线状态
  async getOfflineStatus(): Promise<OfflineStatus> {
    const [drafts, images, storageStats] = await Promise.all([
      this.getDraftsOffline(),
      this.getImagesOffline(),
      offlineStorageService.getStorageStats()
    ]);

    const pendingOperations = this.getPendingOperations().length;
    const lastSyncTime = await sqliteManager.getConfig<string>('lastSyncTime');
    
    return {
      isOfflineMode: this.isOfflineMode,
      pendingOperations,
      cachedItems: {
        drafts: drafts.length,
        images: images.length,
        totalSize: storageStats.totalSize
      },
      lastSync: lastSyncTime ? new Date(lastSyncTime) : null,
      storageUsage: {
        used: storageStats.totalSize,
        available: this.config.maxOfflineStorage * 1024 * 1024 - storageStats.totalSize,
        percentage: (storageStats.totalSize / (this.config.maxOfflineStorage * 1024 * 1024)) * 100
      }
    };
  }

  // 清理离线数据
  async cleanupOfflineData(options?: {
    olderThan?: Date;
    keepDrafts?: boolean;
    keepImages?: boolean;
  }): Promise<void> {
    const { olderThan, keepDrafts = true, keepImages = true } = options || {};
    
    try {
      if (!keepDrafts && olderThan) {
        const drafts = await this.getDraftsOffline();
        for (const draft of drafts) {
          if (draft.lastModified < olderThan) {
            await this.deleteDraftOffline(draft.id);
          }
        }
      }

      if (!keepImages && olderThan) {
        const images = await this.getImagesOffline();
        for (const image of images) {
          if (image.lastAccessed < olderThan) {
            await this.deleteImageOffline(image.id);
          }
        }
      }

      // 清理已同步的操作记录
      this.operationQueue = this.operationQueue.filter(op => op.status !== 'synced');
      await this.saveOperationQueue();

      // 重建搜索索引
      await this.buildSearchIndex();

      this.emit('cleanup_completed');
      console.log('离线数据清理完成');
    } catch (error) {
      console.error('离线数据清理失败:', error);
      throw error;
    }
  }

  // 服务销毁
  async destroy(): Promise<void> {
    this.removeAllListeners();
    this.isInitialized = false;
    console.log('离线模式管理器已销毁');
  }
}

// 导出单例实例
export const offlineModeManager = new OfflineModeManager();
export default offlineModeManager;