// 同步工具函数
import type {
  SyncRecord,
  SyncConflict,
  SyncStatus,
  SyncOptions,
  SyncResult,
  ConflictResolution,
  ConflictMergeStrategy,
} from '../types/sync';
import type { Blog } from '../types/blog';
import type { MediaLibraryItem } from '../types/upload';

/**
 * 同步状态管理
 */
export class SyncStatusManager {
  private listeners: Map<string, (status: SyncStatus) => void> = new Map();
  private currentStatus: SyncStatus = 'idle';

  /**
   * 设置同步状态
   */
  setStatus(status: SyncStatus): void {
    this.currentStatus = status;
    this.notifyListeners();
  }

  /**
   * 获取当前状态
   */
  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  /**
   * 添加状态监听器
   */
  addListener(id: string, callback: (status: SyncStatus) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * 移除状态监听器
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }
}

/**
 * 同步队列管理
 */
export class SyncQueue {
  private queue: SyncRecord[] = [];
  private processing = false;
  private maxRetries = 3;
  private retryDelay = 5000;

  /**
   * 添加同步任务
   */
  add(record: SyncRecord): void {
    this.queue.push(record);
    this.processQueue();
  }

  /**
   * 批量添加同步任务
   */
  addBatch(records: SyncRecord[]): void {
    this.queue.push(...records);
    this.processQueue();
  }

  /**
   * 获取队列长度
   */
  getLength(): number {
    return this.queue.length;
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const record = this.queue.shift()!;
      
      try {
        await this.processRecord(record);
      } catch (error) {
        console.error('Failed to process sync record:', error);
        
        // 重试逻辑
        if (record.retryCount < this.maxRetries) {
          record.retryCount++;
          record.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // 延迟后重新加入队列
          setTimeout(() => {
            this.queue.push(record);
          }, this.retryDelay);
        }
      }
    }

    this.processing = false;
  }

  /**
   * 处理单个同步记录
   */
  private async processRecord(record: SyncRecord): Promise<void> {
    // 这里应该调用实际的同步逻辑
    console.log(`Processing sync record: ${record.id}`);
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * 冲突检测工具
 */
export class ConflictDetector {
  /**
   * 检测博客冲突
   */
  static detectBlogConflicts(localBlog: Blog, remoteBlog: Blog): string[] {
    const conflicts: string[] = [];
    
    const fieldsToCheck: (keyof Blog)[] = [
      'title',
      'content',
      'excerpt',
      'status',
      'visibility',
      'categoryId',
      'coverImage',
    ];
    
    for (const field of fieldsToCheck) {
      if (localBlog[field] !== remoteBlog[field]) {
        conflicts.push(field);
      }
    }
    
    // 检查标签数组
    if (!this.arraysEqual(localBlog.tags || [], remoteBlog.tags || [])) {
      conflicts.push('tags');
    }
    
    // 检查元数据对象
    if (!this.objectsEqual(localBlog.metadata || {}, remoteBlog.metadata || {})) {
      conflicts.push('metadata');
    }
    
    return conflicts;
  }

  /**
   * 检测媒体文件冲突
   */
  static detectMediaConflicts(localMedia: MediaLibraryItem, remoteMedia: MediaLibraryItem): string[] {
    const conflicts: string[] = [];
    
    const fieldsToCheck: (keyof MediaLibraryItem)[] = [
      'filename',
      'alt',
      'description',
      'folderId',
    ];
    
    for (const field of fieldsToCheck) {
      if (localMedia[field] !== remoteMedia[field]) {
        conflicts.push(field);
      }
    }
    
    // 检查标签数组
    if (!this.arraysEqual(localMedia.tags || [], remoteMedia.tags || [])) {
      conflicts.push('tags');
    }
    
    return conflicts;
  }

  /**
   * 比较数组是否相等
   */
  private static arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
    
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    
    return sorted1.every((value, index) => value === sorted2[index]);
  }

  /**
   * 比较对象是否相等
   */
  private static objectsEqual(obj1: any, obj2: any): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    return keys1.every(key => {
      const value1 = obj1[key];
      const value2 = obj2[key];
      
      if (typeof value1 === 'object' && typeof value2 === 'object') {
        return this.objectsEqual(value1, value2);
      }
      
      return value1 === value2;
    });
  }
}

/**
 * 数据合并工具
 */
export class DataMerger {
  /**
   * 智能合并博客数据
   */
  static mergeBlogData(
    localBlog: Blog,
    remoteBlog: Blog,
    strategy: ConflictMergeStrategy = 'smart'
  ): Blog {
    switch (strategy) {
      case 'smart':
        return this.smartMergeBlog(localBlog, remoteBlog);
      case 'timestamp':
        return this.timestampMergeBlog(localBlog, remoteBlog);
      case 'field_priority':
        return this.fieldPriorityMergeBlog(localBlog, remoteBlog);
      case 'user_preference':
        return this.userPreferenceMergeBlog(localBlog, remoteBlog);
      default:
        return remoteBlog;
    }
  }

  /**
   * 智能合并媒体数据
   */
  static mergeMediaData(
    localMedia: MediaLibraryItem,
    remoteMedia: MediaLibraryItem,
    strategy: ConflictMergeStrategy = 'smart'
  ): MediaLibraryItem {
    switch (strategy) {
      case 'smart':
        return this.smartMergeMedia(localMedia, remoteMedia);
      case 'timestamp':
        return this.timestampMergeMedia(localMedia, remoteMedia);
      case 'field_priority':
        return this.fieldPriorityMergeMedia(localMedia, remoteMedia);
      case 'user_preference':
        return this.userPreferenceMergeMedia(localMedia, remoteMedia);
      default:
        return remoteMedia;
    }
  }

  /**
   * 智能合并博客
   */
  private static smartMergeBlog(localBlog: Blog, remoteBlog: Blog): Blog {
    const merged = { ...remoteBlog };

    // 标题：选择更长的
    if (localBlog.title.length > remoteBlog.title.length) {
      merged.title = localBlog.title;
    }

    // 内容：选择更长的
    if (localBlog.content.length > remoteBlog.content.length) {
      merged.content = localBlog.content;
    }

    // 标签：合并去重
    const allTags = [...(localBlog.tags || []), ...(remoteBlog.tags || [])];
    merged.tags = [...new Set(allTags)];

    // 状态：优先已发布
    if (localBlog.status === 'published' || remoteBlog.status === 'published') {
      merged.status = 'published';
    }

    // 元数据：合并
    merged.metadata = {
      ...remoteBlog.metadata,
      ...localBlog.metadata,
    };

    // 更新时间戳
    merged.updatedAt = new Date().toISOString();

    return merged;
  }

  /**
   * 时间戳合并博客
   */
  private static timestampMergeBlog(localBlog: Blog, remoteBlog: Blog): Blog {
    const localTime = new Date(localBlog.updatedAt);
    const remoteTime = new Date(remoteBlog.updatedAt);
    
    return localTime > remoteTime ? localBlog : remoteBlog;
  }

  /**
   * 字段优先级合并博客
   */
  private static fieldPriorityMergeBlog(localBlog: Blog, remoteBlog: Blog): Blog {
    const merged = { ...remoteBlog };
    
    // 本地优先的字段
    const localPriorityFields: (keyof Blog)[] = ['title', 'content', 'tags'];
    
    for (const field of localPriorityFields) {
      if (localBlog[field] !== undefined) {
        merged[field] = localBlog[field] as any;
      }
    }
    
    return merged;
  }

  /**
   * 用户偏好合并博客
   */
  private static userPreferenceMergeBlog(localBlog: Blog, remoteBlog: Blog): Blog {
    // 这里可以根据用户设置的偏好来决定合并策略
    // 暂时使用智能合并
    return this.smartMergeBlog(localBlog, remoteBlog);
  }

  /**
   * 智能合并媒体文件
   */
  private static smartMergeMedia(localMedia: MediaLibraryItem, remoteMedia: MediaLibraryItem): MediaLibraryItem {
    const merged = { ...remoteMedia };

    // 文件名：保持本地
    merged.filename = localMedia.filename;

    // 描述：选择更详细的
    if ((localMedia.description || '').length > (remoteMedia.description || '').length) {
      merged.description = localMedia.description;
    }

    // Alt文本：选择更详细的
    if ((localMedia.alt || '').length > (remoteMedia.alt || '').length) {
      merged.alt = localMedia.alt;
    }

    // 标签：合并去重
    const allTags = [...(localMedia.tags || []), ...(remoteMedia.tags || [])];
    merged.tags = [...new Set(allTags)];

    return merged;
  }

  /**
   * 时间戳合并媒体文件
   */
  private static timestampMergeMedia(localMedia: MediaLibraryItem, remoteMedia: MediaLibraryItem): MediaLibraryItem {
    const localTime = new Date(localMedia.updatedAt);
    const remoteTime = new Date(remoteMedia.updatedAt);
    
    return localTime > remoteTime ? localMedia : remoteMedia;
  }

  /**
   * 字段优先级合并媒体文件
   */
  private static fieldPriorityMergeMedia(localMedia: MediaLibraryItem, remoteMedia: MediaLibraryItem): MediaLibraryItem {
    const merged = { ...remoteMedia };
    
    // 本地优先的字段
    const localPriorityFields: (keyof MediaLibraryItem)[] = ['filename', 'alt', 'description'];
    
    for (const field of localPriorityFields) {
      if (localMedia[field] !== undefined) {
        merged[field] = localMedia[field] as any;
      }
    }
    
    return merged;
  }

  /**
   * 用户偏好合并媒体文件
   */
  private static userPreferenceMergeMedia(localMedia: MediaLibraryItem, remoteMedia: MediaLibraryItem): MediaLibraryItem {
    // 这里可以根据用户设置的偏好来决定合并策略
    // 暂时使用智能合并
    return this.smartMergeMedia(localMedia, remoteMedia);
  }
}

/**
 * 同步验证工具
 */
export class SyncValidator {
  /**
   * 验证博客数据
   */
  static validateBlogData(blog: Blog): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!blog.title || blog.title.trim().length === 0) {
      errors.push('标题不能为空');
    }

    if (!blog.content || blog.content.trim().length === 0) {
      errors.push('内容不能为空');
    }

    if (blog.title && blog.title.length > 200) {
      errors.push('标题长度不能超过200个字符');
    }

    if (!['draft', 'published', 'archived'].includes(blog.status)) {
      errors.push('无效的博客状态');
    }

    if (!['public', 'private', 'password'].includes(blog.visibility)) {
      errors.push('无效的可见性设置');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证媒体文件数据
   */
  static validateMediaData(media: MediaLibraryItem): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!media.filename || media.filename.trim().length === 0) {
      errors.push('文件名不能为空');
    }

    if (!media.url || media.url.trim().length === 0) {
      errors.push('文件URL不能为空');
    }

    if (!media.fileType || media.fileType.trim().length === 0) {
      errors.push('文件类型不能为空');
    }

    if (media.fileSize <= 0) {
      errors.push('文件大小必须大于0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证同步记录
   */
  static validateSyncRecord(record: SyncRecord): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!record.id || record.id.trim().length === 0) {
      errors.push('同步记录ID不能为空');
    }

    if (!record.tableName || record.tableName.trim().length === 0) {
      errors.push('表名不能为空');
    }

    if (!record.recordId || record.recordId.trim().length === 0) {
      errors.push('记录ID不能为空');
    }

    if (!['create', 'update', 'delete'].includes(record.operation)) {
      errors.push('无效的操作类型');
    }

    if (!['pending', 'syncing', 'completed', 'failed'].includes(record.status)) {
      errors.push('无效的同步状态');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 同步性能监控
 */
export class SyncPerformanceMonitor {
  private metrics: Map<string, {
    startTime: number;
    endTime?: number;
    duration?: number;
    success?: boolean;
    error?: string;
  }> = new Map();

  /**
   * 开始监控
   */
  start(operationId: string): void {
    this.metrics.set(operationId, {
      startTime: Date.now(),
    });
  }

  /**
   * 结束监控
   */
  end(operationId: string, success = true, error?: string): void {
    const metric = this.metrics.get(operationId);
    if (metric) {
      const endTime = Date.now();
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      metric.success = success;
      metric.error = error;
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((metric, operationId) => {
      result[operationId] = { ...metric };
    });
    
    return result;
  }

  /**
   * 清理指标
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    totalDuration: number;
  } {
    const metrics = Array.from(this.metrics.values());
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    
    const totalOperations = completedMetrics.length;
    const successfulOperations = completedMetrics.filter(m => m.success).length;
    const failedOperations = totalOperations - successfulOperations;
    
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0;
    
    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageDuration,
      totalDuration,
    };
  }
}

/**
 * 同步工具函数
 */
export const syncUtils = {
  /**
   * 生成同步记录ID
   */
  generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * 生成冲突ID
   */
  generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * 检查网络连接
   */
  isOnline(): boolean {
    return navigator.onLine;
  },

  /**
   * 等待网络连接
   */
  waitForOnline(timeout = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        window.removeEventListener('online', onlineHandler);
        resolve(false);
      }, timeout);

      const onlineHandler = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('online', onlineHandler);
        resolve(true);
      };

      window.addEventListener('online', onlineHandler);
    });
  },

  /**
   * 延迟执行
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 重试执行
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (i < maxRetries) {
          await this.delay(delayMs * Math.pow(2, i)); // 指数退避
        }
      }
    }

    throw lastError!;
  },

  /**
   * 批处理
   */
  async batch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize = 10,
    delayBetweenBatches = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      
      if (i + batchSize < items.length) {
        await this.delay(delayBetweenBatches);
      }
    }
    
    return results;
  },

  /**
   * 计算数据哈希
   */
  calculateHash(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return hash.toString(36);
  },

  /**
   * 比较数据是否相同
   */
  isDataEqual(data1: any, data2: any): boolean {
    return this.calculateHash(data1) === this.calculateHash(data2);
  },

  /**
   * 格式化同步时间
   */
  formatSyncTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString();
    }
  },
};

// 创建全局实例
export const syncStatusManager = new SyncStatusManager();
export const syncQueue = new SyncQueue();
export const performanceMonitor = new SyncPerformanceMonitor();

// 导出所有工具
export {
  ConflictDetector,
  DataMerger,
  SyncValidator,
};