// 同步引擎服务
import localDB from '../storage/localDB';
import authAPI from '../api/auth';
import blogAPI from '../api/blog';
import uploadAPI from '../api/upload';
import { useAuthStore } from '../../stores/auth';
import { useSyncStore } from '../../stores/syncStore';
import type {
  SyncRecord,
  SyncConflict,
  SyncStatus,
  SyncOptions,
  SyncResult,
  ConflictResolution,
} from '../../types/sync';
import type { Blog } from '../../types/blog';
import type { MediaLibraryItem } from '../../types/upload';

/**
 * 同步引擎类
 */
class SyncEngine {
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 5000; // 5秒
  private syncIntervalMs = 30000; // 30秒

  /**
   * 启动同步引擎
   */
  async start(options?: SyncOptions): Promise<void> {
    if (this.isRunning) {
      console.log('Sync engine is already running');
      return;
    }

    this.isRunning = true;
    
    if (options?.interval) {
      this.syncIntervalMs = options.interval;
    }

    console.log('Starting sync engine...');
    
    // 立即执行一次同步
    await this.performSync();
    
    // 暂时禁用定时同步，避免频繁API调用
    /*
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.syncIntervalMs);
    */

    // 监听网络状态变化
    this.setupNetworkListener();
  }

  /**
   * 停止同步引擎
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('Stopping sync engine...');
    
    this.isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * 手动触发同步
   */
  async sync(force = false): Promise<SyncResult> {
    const syncStore = useSyncStore();
    
    if (!force && syncStore.status === 'syncing') {
      throw new Error('Sync is already in progress');
    }

    return this.performSync();
  }

  /**
   * 执行同步操作
   */
  private async performSync(): Promise<SyncResult> {
    const authStore = useAuthStore();
    const syncStore = useSyncStore();
    
    // 检查用户是否已登录
    if (!authStore.isAuthenticated) {
      console.log('User not authenticated, skipping sync');
      return {
        success: false,
        error: 'User not authenticated',
        syncedItems: 0,
        conflicts: [],
      };
    }

    // 检查网络连接
    if (!navigator.onLine) {
      console.log('No network connection, skipping sync');
      return {
        success: false,
        error: 'No network connection',
        syncedItems: 0,
        conflicts: [],
      };
    }

    syncStore.setStatus('syncing');
    syncStore.setLastSyncAttempt(new Date().toISOString());

    try {
      const result: SyncResult = {
        success: true,
        syncedItems: 0,
        conflicts: [],
      };

      // 1. 同步博客数据
      const blogResult = await this.syncBlogs();
      result.syncedItems += blogResult.syncedItems;
      result.conflicts.push(...blogResult.conflicts);

      // 2. 同步媒体文件
      const mediaResult = await this.syncMediaFiles();
      result.syncedItems += mediaResult.syncedItems;
      result.conflicts.push(...mediaResult.conflicts);

      // 3. 处理上传队列
      await this.processUploadQueue();

      // 4. 清理已完成的同步记录
      await this.cleanupSyncRecords();

      syncStore.setStatus('idle');
      syncStore.setLastSync(new Date().toISOString());
      syncStore.setError(null);

      console.log(`Sync completed: ${result.syncedItems} items synced, ${result.conflicts.length} conflicts`);
      
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      
      syncStore.setStatus('error');
      syncStore.setError(error instanceof Error ? error.message : 'Unknown sync error');
      
      // 安排重试
      this.scheduleRetry();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        syncedItems: 0,
        conflicts: [],
      };
    }
  }

  /**
   * 同步博客数据
   */
  private async syncBlogs(): Promise<{ syncedItems: number; conflicts: SyncConflict[] }> {
    const conflicts: SyncConflict[] = [];
    let syncedItems = 0;

    try {
      // 获取本地待同步的博客
      const dirtyBlogs = await localDB.getDirtyBlogs();
      
      for (const blog of dirtyBlogs) {
        try {
          // 尝试同步到远程
          const syncResult = await this.syncBlogToRemote(blog);
          
          if (syncResult.success) {
            await localDB.markBlogSynced(blog.id);
            syncedItems++;
          } else if (syncResult.conflict) {
            conflicts.push(syncResult.conflict);
          }
        } catch (error) {
          console.error(`Failed to sync blog ${blog.id}:`, error);
          
          // 创建同步记录用于重试
          await this.createSyncRecord({
            tableName: 'blogs',
            recordId: blog.id,
            operation: 'update',
            localData: blog,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 从远程拉取更新
      await this.pullBlogsFromRemote();
      
    } catch (error) {
      console.error('Failed to sync blogs:', error);
      throw error;
    }

    return { syncedItems, conflicts };
  }

  /**
   * 同步单个博客到远程
   */
  private async syncBlogToRemote(blog: Blog): Promise<{
    success: boolean;
    conflict?: SyncConflict;
  }> {
    try {
      // 检查远程是否有更新的版本
      const remoteBlog = await blogAPI.getBlog(blog.id);
      
      if (remoteBlog && new Date(remoteBlog.updatedAt) > new Date(blog.updatedAt)) {
        // 发生冲突
        const conflict: SyncConflict = {
          id: `blog_${blog.id}_${Date.now()}`,
          tableName: 'blogs',
          recordId: blog.id,
          localData: blog,
          remoteData: remoteBlog,
          conflictFields: this.detectBlogConflictFields(blog, remoteBlog),
          resolutionStrategy: 'manual',
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        return { success: false, conflict };
      }
      
      // 更新远程博客
      const updatedBlog = await blogAPI.updateBlog(blog.id, {
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        coverImage: blog.coverImage,
        status: blog.status,
        visibility: blog.visibility,
        categoryId: blog.categoryId,
        tags: blog.tags,
        metadata: blog.metadata,
        seo: blog.seo,
      });
      
      // 更新本地数据
      await localDB.updateBlog(blog.id, {
        updatedAt: updatedBlog.updatedAt,
      });
      
      return { success: true };
    } catch (error) {
      console.error(`Failed to sync blog ${blog.id} to remote:`, error);
      throw error;
    }
  }

  /**
   * 从远程拉取博客更新
   */
  private async pullBlogsFromRemote(): Promise<void> {
    try {
      // 获取远程博客列表（只获取最近更新的）
      const remoteBlogs = await blogAPI.getBlogs({
        limit: 100,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      
      for (const remoteBlog of remoteBlogs.data) {
        const localBlog = await localDB.getBlog(remoteBlog.id);
        
        if (!localBlog) {
          // 本地不存在，创建新博客
          await localDB.createBlog({
            ...remoteBlog,
            authorId: remoteBlog.authorId,
          });
        } else if (new Date(remoteBlog.updatedAt) > new Date(localBlog.updatedAt)) {
          // 远程更新，更新本地
          await localDB.updateBlog(remoteBlog.id, remoteBlog);
        }
      }
    } catch (error) {
      console.error('Failed to pull blogs from remote:', error);
      throw error;
    }
  }

  /**
   * 同步媒体文件
   */
  private async syncMediaFiles(): Promise<{ syncedItems: number; conflicts: SyncConflict[] }> {
    const conflicts: SyncConflict[] = [];
    let syncedItems = 0;

    try {
      // 获取本地待上传的媒体文件
      const pendingFiles = await localDB.getMediaFiles({
        uploadStatus: 'pending',
      });
      
      for (const file of pendingFiles) {
        try {
          // 如果有本地文件路径，尝试上传
          if (file.localPath) {
            await this.uploadMediaFile(file);
            syncedItems++;
          }
        } catch (error) {
          console.error(`Failed to upload media file ${file.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync media files:', error);
      throw error;
    }

    return { syncedItems, conflicts };
  }

  /**
   * 上传媒体文件
   */
  private async uploadMediaFile(file: MediaLibraryItem): Promise<void> {
    try {
      // 更新上传状态
      await localDB.updateMediaFile(file.id, {
        uploadStatus: 'uploading',
        uploadProgress: 0,
      });

      // 这里需要从本地文件系统读取文件
      // 在实际实现中，需要使用Tauri的文件系统API
      // const fileBlob = await readLocalFile(file.localPath!);
      
      // 模拟上传过程
      const uploadResult = await uploadAPI.uploadFile(
        new File([], file.filename), // 这里需要实际的文件对象
        {
          onProgress: async (progress) => {
            await localDB.updateMediaFile(file.id, {
              uploadProgress: progress,
            });
          },
        }
      );

      // 更新文件信息
      await localDB.updateMediaFile(file.id, {
        url: uploadResult.url,
        uploadStatus: 'completed',
        uploadProgress: 100,
        errorMessage: null,
      });
    } catch (error) {
      await localDB.updateMediaFile(file.id, {
        uploadStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Upload failed',
      });
      throw error;
    }
  }

  /**
   * 处理上传队列
   */
  private async processUploadQueue(): Promise<void> {
    try {
      const pendingTasks = await localDB.getPendingUploadTasks();
      
      for (const task of pendingTasks) {
        try {
          // 重试上传任务
          await this.retryUploadTask(task);
        } catch (error) {
          console.error(`Failed to retry upload task ${task.id}:`, error);
          
          // 增加重试次数
          await localDB.updateUploadTask(task.id, {
            retryCount: task.retryCount + 1,
            errorMessage: error instanceof Error ? error.message : 'Retry failed',
          });
        }
      }
    } catch (error) {
      console.error('Failed to process upload queue:', error);
    }
  }

  /**
   * 重试上传任务
   */
  private async retryUploadTask(task: any): Promise<void> {
    // 实现上传任务重试逻辑
    // 这里需要根据具体的上传任务类型来处理
    console.log(`Retrying upload task ${task.id}`);
  }

  /**
   * 创建同步记录
   */
  private async createSyncRecord(data: Partial<SyncRecord>): Promise<void> {
    const record: SyncRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tableName: data.tableName!,
      recordId: data.recordId!,
      operation: data.operation!,
      localData: data.localData,
      remoteData: data.remoteData,
      status: data.status || 'pending',
      conflictResolution: data.conflictResolution,
      errorMessage: data.errorMessage,
      retryCount: data.retryCount || 0,
      maxRetries: data.maxRetries || this.maxRetries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedAt: data.syncedAt,
    };

    await localDB.createSyncRecord(record);
  }

  /**
   * 检测博客冲突字段
   */
  private detectBlogConflictFields(localBlog: Blog, remoteBlog: Blog): string[] {
    const conflicts: string[] = [];
    
    const fieldsToCheck = ['title', 'content', 'excerpt', 'status', 'visibility', 'categoryId'];
    
    for (const field of fieldsToCheck) {
      if (localBlog[field as keyof Blog] !== remoteBlog[field as keyof Blog]) {
        conflicts.push(field);
      }
    }
    
    return conflicts;
  }

  /**
   * 解决同步冲突
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    mergedData?: any
  ): Promise<void> {
    // 实现冲突解决逻辑
    console.log(`Resolving conflict ${conflictId} with strategy: ${resolution}`);
    
    // 根据解决策略更新数据
    switch (resolution) {
      case 'local':
        // 使用本地数据覆盖远程
        break;
      case 'remote':
        // 使用远程数据覆盖本地
        break;
      case 'merge':
        // 使用合并后的数据
        break;
      case 'manual':
        // 手动解决，使用提供的数据
        break;
    }
  }

  /**
   * 清理已完成的同步记录
   */
  private async cleanupSyncRecords(): Promise<void> {
    // 删除7天前的已完成同步记录
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    // 这里需要在localDB中实现清理方法
    console.log('Cleaning up old sync records...');
  }

  /**
   * 安排重试
   */
  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    this.retryTimeout = setTimeout(() => {
      if (this.isRunning) {
        this.performSync();
      }
    }, this.retryDelay);
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListener(): void {
    const handleOnline = () => {
      console.log('Network connection restored, triggering sync...');
      if (this.isRunning) {
        this.performSync();
      }
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      const syncStore = useSyncStore();
      syncStore.setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  /**
   * 获取同步状态
   */
  getStatus(): SyncStatus {
    const syncStore = useSyncStore();
    return syncStore.status;
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.isRunning;
  }
}

// 创建同步引擎实例
const syncEngine = new SyncEngine();

export { syncEngine, SyncEngine };
export default syncEngine;