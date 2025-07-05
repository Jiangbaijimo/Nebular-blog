import { Database } from '@tauri-apps/plugin-sql';
import { invoke } from '@tauri-apps/api/tauri';

// 数据库表结构接口
export interface BlogDraft {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  tags: string[];
  categories: string[];
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  isLocal: boolean;
  lastModified: Date;
  createdAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  remoteId?: string;
  version: number;
}

export interface ImageCache {
  id: string;
  localPath: string;
  remotePath?: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
  uploadProgress: number;
  createdAt: Date;
  lastAccessed: Date;
  isCompressed: boolean;
  compressedSize?: number;
}

export interface SyncStatus {
  id: string;
  entityType: 'draft' | 'image' | 'settings';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  lastAttempt?: Date;
  errorMessage?: string;
  priority: number;
  createdAt: Date;
}

export interface UserConfig {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'editor' | 'sync' | 'ui' | 'performance' | 'general';
  lastModified: Date;
  syncStatus: 'local' | 'synced';
}

class SQLiteManager {
  private db: Database | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // 连接到SQLite数据库
      this.db = await Database.load('sqlite:blog_local.db');
      
      // 创建表结构
      await this.createTables();
      
      this.isInitialized = true;
      console.log('SQLite数据库初始化成功');
    } catch (error) {
      console.error('SQLite数据库初始化失败:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    // 创建博客草稿表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS blog_drafts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        tags TEXT, -- JSON array
        categories TEXT, -- JSON array
        featured_image TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        is_local INTEGER NOT NULL DEFAULT 1,
        last_modified INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        remote_id TEXT,
        version INTEGER NOT NULL DEFAULT 1
      )
    `);

    // 创建图片缓存表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS image_cache (
        id TEXT PRIMARY KEY,
        local_path TEXT NOT NULL,
        remote_path TEXT,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        upload_status TEXT NOT NULL DEFAULT 'pending',
        upload_progress INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        last_accessed INTEGER NOT NULL,
        is_compressed INTEGER NOT NULL DEFAULT 0,
        compressed_size INTEGER
      )
    `);

    // 创建同步状态表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_attempt INTEGER,
        error_message TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `);

    // 创建用户配置表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS user_config (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'string',
        category TEXT NOT NULL DEFAULT 'general',
        last_modified INTEGER NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // 创建索引
    await this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_drafts_status ON blog_drafts(status)',
      'CREATE INDEX IF NOT EXISTS idx_drafts_sync_status ON blog_drafts(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_drafts_last_modified ON blog_drafts(last_modified)',
      'CREATE INDEX IF NOT EXISTS idx_images_upload_status ON image_cache(upload_status)',
      'CREATE INDEX IF NOT EXISTS idx_images_last_accessed ON image_cache(last_accessed)',
      'CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_status(status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_priority ON sync_status(priority)',
      'CREATE INDEX IF NOT EXISTS idx_config_category ON user_config(category)'
    ];

    for (const index of indexes) {
      await this.db.execute(index);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
  }

  // 博客草稿操作
  async saveDraft(draft: Omit<BlogDraft, 'id' | 'createdAt' | 'version'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await this.db!.execute(
      `INSERT INTO blog_drafts (
        id, title, content, excerpt, tags, categories, featured_image,
        status, is_local, last_modified, created_at, sync_status, remote_id, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        draft.title,
        draft.content,
        draft.excerpt || null,
        JSON.stringify(draft.tags),
        JSON.stringify(draft.categories),
        draft.featuredImage || null,
        draft.status,
        draft.isLocal ? 1 : 0,
        now,
        now,
        draft.syncStatus,
        draft.remoteId || null,
        1
      ]
    );

    return id;
  }

  async updateDraft(id: string, updates: Partial<BlogDraft>): Promise<void> {
    await this.ensureInitialized();
    
    const setClause = [];
    const values = [];
    
    if (updates.title !== undefined) {
      setClause.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      setClause.push('content = ?');
      values.push(updates.content);
    }
    if (updates.excerpt !== undefined) {
      setClause.push('excerpt = ?');
      values.push(updates.excerpt);
    }
    if (updates.tags !== undefined) {
      setClause.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.categories !== undefined) {
      setClause.push('categories = ?');
      values.push(JSON.stringify(updates.categories));
    }
    if (updates.featuredImage !== undefined) {
      setClause.push('featured_image = ?');
      values.push(updates.featuredImage);
    }
    if (updates.status !== undefined) {
      setClause.push('status = ?');
      values.push(updates.status);
    }
    if (updates.syncStatus !== undefined) {
      setClause.push('sync_status = ?');
      values.push(updates.syncStatus);
    }
    if (updates.remoteId !== undefined) {
      setClause.push('remote_id = ?');
      values.push(updates.remoteId);
    }
    
    setClause.push('last_modified = ?', 'version = version + 1');
    values.push(Date.now());
    values.push(id);
    
    await this.db!.execute(
      `UPDATE blog_drafts SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );
  }

  async getDraft(id: string): Promise<BlogDraft | null> {
    await this.ensureInitialized();
    
    const result = await this.db!.select<any[]>(
      'SELECT * FROM blog_drafts WHERE id = ?',
      [id]
    );
    
    if (result.length === 0) return null;
    
    return this.mapRowToDraft(result[0]);
  }

  async getDrafts(filters?: {
    status?: string;
    syncStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<BlogDraft[]> {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM blog_drafts';
    const conditions = [];
    const values = [];
    
    if (filters?.status) {
      conditions.push('status = ?');
      values.push(filters.status);
    }
    
    if (filters?.syncStatus) {
      conditions.push('sync_status = ?');
      values.push(filters.syncStatus);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY last_modified DESC';
    
    if (filters?.limit) {
      query += ' LIMIT ?';
      values.push(filters.limit);
      
      if (filters?.offset) {
        query += ' OFFSET ?';
        values.push(filters.offset);
      }
    }
    
    const result = await this.db!.select<any[]>(query, values);
    return result.map(row => this.mapRowToDraft(row));
  }

  async deleteDraft(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.execute('DELETE FROM blog_drafts WHERE id = ?', [id]);
  }

  // 图片缓存操作
  async saveImageCache(image: Omit<ImageCache, 'id' | 'createdAt' | 'lastAccessed'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await this.db!.execute(
      `INSERT INTO image_cache (
        id, local_path, remote_path, original_name, size, mime_type,
        upload_status, upload_progress, created_at, last_accessed,
        is_compressed, compressed_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        image.localPath,
        image.remotePath || null,
        image.originalName,
        image.size,
        image.mimeType,
        image.uploadStatus,
        image.uploadProgress,
        now,
        now,
        image.isCompressed ? 1 : 0,
        image.compressedSize || null
      ]
    );

    return id;
  }

  async updateImageCache(id: string, updates: Partial<ImageCache>): Promise<void> {
    await this.ensureInitialized();
    
    const setClause = [];
    const values = [];
    
    if (updates.remotePath !== undefined) {
      setClause.push('remote_path = ?');
      values.push(updates.remotePath);
    }
    if (updates.uploadStatus !== undefined) {
      setClause.push('upload_status = ?');
      values.push(updates.uploadStatus);
    }
    if (updates.uploadProgress !== undefined) {
      setClause.push('upload_progress = ?');
      values.push(updates.uploadProgress);
    }
    if (updates.isCompressed !== undefined) {
      setClause.push('is_compressed = ?');
      values.push(updates.isCompressed ? 1 : 0);
    }
    if (updates.compressedSize !== undefined) {
      setClause.push('compressed_size = ?');
      values.push(updates.compressedSize);
    }
    
    setClause.push('last_accessed = ?');
    values.push(Date.now());
    values.push(id);
    
    await this.db!.execute(
      `UPDATE image_cache SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );
  }

  async getImageCache(id: string): Promise<ImageCache | null> {
    await this.ensureInitialized();
    
    const result = await this.db!.select<any[]>(
      'SELECT * FROM image_cache WHERE id = ?',
      [id]
    );
    
    if (result.length === 0) return null;
    
    return this.mapRowToImageCache(result[0]);
  }

  async getImageCacheByPath(localPath: string): Promise<ImageCache | null> {
    await this.ensureInitialized();
    
    const result = await this.db!.select<any[]>(
      'SELECT * FROM image_cache WHERE local_path = ?',
      [localPath]
    );
    
    if (result.length === 0) return null;
    
    return this.mapRowToImageCache(result[0]);
  }

  async getImageCaches(filters?: {
    uploadStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<ImageCache[]> {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM image_cache';
    const conditions = [];
    const values = [];
    
    if (filters?.uploadStatus) {
      conditions.push('upload_status = ?');
      values.push(filters.uploadStatus);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters?.limit) {
      query += ' LIMIT ?';
      values.push(filters.limit);
      
      if (filters?.offset) {
        query += ' OFFSET ?';
        values.push(filters.offset);
      }
    }
    
    const result = await this.db!.select<any[]>(query, values);
    return result.map(row => this.mapRowToImageCache(row));
  }

  // 同步状态操作
  async addSyncTask(task: Omit<SyncStatus, 'id' | 'createdAt'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await this.db!.execute(
      `INSERT INTO sync_status (
        id, entity_type, entity_id, operation, status, retry_count,
        last_attempt, error_message, priority, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        task.entityType,
        task.entityId,
        task.operation,
        task.status,
        task.retryCount,
        task.lastAttempt ? task.lastAttempt.getTime() : null,
        task.errorMessage || null,
        task.priority,
        now
      ]
    );

    return id;
  }

  async updateSyncTask(id: string, updates: Partial<SyncStatus>): Promise<void> {
    await this.ensureInitialized();
    
    const setClause = [];
    const values = [];
    
    if (updates.status !== undefined) {
      setClause.push('status = ?');
      values.push(updates.status);
    }
    if (updates.retryCount !== undefined) {
      setClause.push('retry_count = ?');
      values.push(updates.retryCount);
    }
    if (updates.lastAttempt !== undefined) {
      setClause.push('last_attempt = ?');
      values.push(updates.lastAttempt.getTime());
    }
    if (updates.errorMessage !== undefined) {
      setClause.push('error_message = ?');
      values.push(updates.errorMessage);
    }
    
    values.push(id);
    
    await this.db!.execute(
      `UPDATE sync_status SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );
  }

  async getPendingSyncTasks(limit = 10): Promise<SyncStatus[]> {
    await this.ensureInitialized();
    
    const result = await this.db!.select<any[]>(
      'SELECT * FROM sync_status WHERE status = ? ORDER BY priority DESC, created_at ASC LIMIT ?',
      ['pending', limit]
    );
    
    return result.map(row => this.mapRowToSyncStatus(row));
  }

  async deleteSyncTask(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.execute('DELETE FROM sync_status WHERE id = ?', [id]);
  }

  // 用户配置操作
  async setConfig(key: string, value: any, category = 'general'): Promise<void> {
    await this.ensureInitialized();
    
    const id = crypto.randomUUID();
    const now = Date.now();
    let type: string;
    let stringValue: string;
    
    if (typeof value === 'string') {
      type = 'string';
      stringValue = value;
    } else if (typeof value === 'number') {
      type = 'number';
      stringValue = value.toString();
    } else if (typeof value === 'boolean') {
      type = 'boolean';
      stringValue = value.toString();
    } else {
      type = 'json';
      stringValue = JSON.stringify(value);
    }
    
    await this.db!.execute(
      `INSERT OR REPLACE INTO user_config (
        id, key, value, type, category, last_modified, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, key, stringValue, type, category, now, 'local']
    );
  }

  async getConfig<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
    await this.ensureInitialized();
    
    const result = await this.db!.select<any[]>(
      'SELECT * FROM user_config WHERE key = ?',
      [key]
    );
    
    if (result.length === 0) return defaultValue;
    
    const config = result[0];
    
    switch (config.type) {
      case 'string':
        return config.value as T;
      case 'number':
        return Number(config.value) as T;
      case 'boolean':
        return (config.value === 'true') as T;
      case 'json':
        return JSON.parse(config.value) as T;
      default:
        return config.value as T;
    }
  }

  async getAllConfigs(category?: string): Promise<UserConfig[]> {
    await this.ensureInitialized();
    
    let query = 'SELECT * FROM user_config';
    const values = [];
    
    if (category) {
      query += ' WHERE category = ?';
      values.push(category);
    }
    
    query += ' ORDER BY key';
    
    const result = await this.db!.select<any[]>(query, values);
    return result.map(row => this.mapRowToUserConfig(row));
  }

  // 数据备份和恢复
  async exportData(): Promise<{
    drafts: BlogDraft[];
    images: ImageCache[];
    configs: UserConfig[];
    exportTime: Date;
  }> {
    await this.ensureInitialized();
    
    const [drafts, images, configs] = await Promise.all([
      this.getDrafts(),
      this.getImageCaches(),
      this.getAllConfigs()
    ]);
    
    return {
      drafts,
      images,
      configs,
      exportTime: new Date()
    };
  }

  async importData(data: {
    drafts?: BlogDraft[];
    images?: ImageCache[];
    configs?: UserConfig[];
  }): Promise<void> {
    await this.ensureInitialized();
    
    // 开始事务
    await this.db!.execute('BEGIN TRANSACTION');
    
    try {
      // 导入草稿
      if (data.drafts) {
        for (const draft of data.drafts) {
          await this.saveDraft(draft);
        }
      }
      
      // 导入图片缓存
      if (data.images) {
        for (const image of data.images) {
          await this.saveImageCache(image);
        }
      }
      
      // 导入配置
      if (data.configs) {
        for (const config of data.configs) {
          await this.setConfig(config.key, config.value, config.category);
        }
      }
      
      await this.db!.execute('COMMIT');
    } catch (error) {
      await this.db!.execute('ROLLBACK');
      throw error;
    }
  }

  // 清理过期数据
  async cleanupExpiredData(): Promise<void> {
    await this.ensureInitialized();
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // 清理已完成的同步任务
    await this.db!.execute(
      'DELETE FROM sync_status WHERE status = ? AND created_at < ?',
      ['completed', thirtyDaysAgo]
    );
    
    // 清理长时间未访问的图片缓存
    await this.db!.execute(
      'DELETE FROM image_cache WHERE upload_status = ? AND last_accessed < ?',
      ['uploaded', thirtyDaysAgo]
    );
  }

  // 数据映射方法
  private mapRowToDraft(row: any): BlogDraft {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      tags: JSON.parse(row.tags || '[]'),
      categories: JSON.parse(row.categories || '[]'),
      featuredImage: row.featured_image,
      status: row.status,
      isLocal: Boolean(row.is_local),
      lastModified: new Date(row.last_modified),
      createdAt: new Date(row.created_at),
      syncStatus: row.sync_status,
      remoteId: row.remote_id,
      version: row.version
    };
  }

  private mapRowToImageCache(row: any): ImageCache {
    return {
      id: row.id,
      localPath: row.local_path,
      remotePath: row.remote_path,
      originalName: row.original_name,
      size: row.size,
      mimeType: row.mime_type,
      uploadStatus: row.upload_status,
      uploadProgress: row.upload_progress,
      createdAt: new Date(row.created_at),
      lastAccessed: new Date(row.last_accessed),
      isCompressed: Boolean(row.is_compressed),
      compressedSize: row.compressed_size
    };
  }

  private mapRowToSyncStatus(row: any): SyncStatus {
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation,
      status: row.status,
      retryCount: row.retry_count,
      lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined,
      errorMessage: row.error_message,
      priority: row.priority,
      createdAt: new Date(row.created_at)
    };
  }

  private mapRowToUserConfig(row: any): UserConfig {
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      type: row.type,
      category: row.category,
      lastModified: new Date(row.last_modified),
      syncStatus: row.sync_status
    };
  }

  // 关闭数据库连接
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// 导出单例实例
export const sqliteManager = new SQLiteManager();
export default sqliteManager;