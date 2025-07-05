// 本地SQLite数据库服务
import { Database } from '@tauri-apps/plugin-sql';
import type {
  Blog,
  BlogCreateRequest,
  BlogUpdateRequest,
  BlogCategory,
  BlogTag,
} from '../../types/blog';
import type {
  User,
  UserSession,
} from '../../types/auth';
import type {
  UploadTask,
  MediaLibraryItem,
} from '../../types/upload';
import type {
  SyncRecord,
  SyncConflict,
} from '../../types/sync';

/**
 * 本地SQLite数据库管理类
 */
class LocalDatabase {
  private db: Database | null = null;
  private isInitialized = false;

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 连接到SQLite数据库
      this.db = await Database.load('sqlite:blog.db');
      
      // 创建表结构
      await this.createTables();
      
      this.isInitialized = true;
      console.log('Local database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local database:', error);
      throw error;
    }
  }

  /**
   * 创建数据库表结构
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 用户表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        preferences TEXT, -- JSON string
        stats TEXT, -- JSON string
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        is_dirty INTEGER DEFAULT 0
      )
    `);

    // 用户会话表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_info TEXT, -- JSON string
        ip_address TEXT,
        user_agent TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_active_at TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // 博客文章表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS blogs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        cover_image TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        visibility TEXT NOT NULL DEFAULT 'public',
        author_id TEXT NOT NULL,
        category_id TEXT,
        tags TEXT, -- JSON array string
        metadata TEXT, -- JSON string
        seo TEXT, -- JSON string
        stats TEXT, -- JSON string
        published_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        is_dirty INTEGER DEFAULT 0,
        FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES blog_categories (id) ON DELETE SET NULL
      )
    `);

    // 博客分类表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT,
        icon TEXT,
        parent_id TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        is_dirty INTEGER DEFAULT 0,
        FOREIGN KEY (parent_id) REFERENCES blog_categories (id) ON DELETE SET NULL
      )
    `);

    // 博客标签表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS blog_tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        is_dirty INTEGER DEFAULT 0
      )
    `);

    // 媒体文件表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS media_files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        url TEXT,
        local_path TEXT,
        thumbnail_url TEXT,
        folder_id TEXT,
        tags TEXT, -- JSON array string
        description TEXT,
        is_public INTEGER DEFAULT 1,
        upload_status TEXT DEFAULT 'pending', -- pending, uploading, completed, failed
        upload_progress INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        is_dirty INTEGER DEFAULT 0
      )
    `);

    // 上传任务表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS upload_tasks (
        id TEXT PRIMARY KEY,
        file_id TEXT,
        filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- pending, uploading, completed, failed, cancelled
        progress INTEGER DEFAULT 0,
        upload_url TEXT,
        chunk_size INTEGER,
        uploaded_chunks TEXT, -- JSON array string
        total_chunks INTEGER,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (file_id) REFERENCES media_files (id) ON DELETE CASCADE
      )
    `);

    // 同步记录表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS sync_records (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL, -- create, update, delete
        local_data TEXT, -- JSON string
        remote_data TEXT, -- JSON string
        status TEXT NOT NULL DEFAULT 'pending', -- pending, syncing, completed, failed, conflict
        conflict_resolution TEXT, -- local, remote, manual
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        UNIQUE(table_name, record_id, operation)
      )
    `);

    // 同步冲突表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS sync_conflicts (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        local_data TEXT NOT NULL, -- JSON string
        remote_data TEXT NOT NULL, -- JSON string
        conflict_fields TEXT, -- JSON array string
        resolution_strategy TEXT, -- local, remote, merge, manual
        resolved_data TEXT, -- JSON string
        status TEXT NOT NULL DEFAULT 'pending', -- pending, resolved
        created_at TEXT NOT NULL,
        resolved_at TEXT
      )
    `);

    // 应用设置表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'string', -- string, number, boolean, json
        description TEXT,
        updated_at TEXT NOT NULL
      )
    `);

    // 创建索引
    await this.createIndexes();
  }

  /**
   * 创建数据库索引
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON blogs (author_id)',
      'CREATE INDEX IF NOT EXISTS idx_blogs_category_id ON blogs (category_id)',
      'CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs (status)',
      'CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs (published_at)',
      'CREATE INDEX IF NOT EXISTS idx_blogs_is_dirty ON blogs (is_dirty)',
      'CREATE INDEX IF NOT EXISTS idx_media_files_folder_id ON media_files (folder_id)',
      'CREATE INDEX IF NOT EXISTS idx_media_files_upload_status ON media_files (upload_status)',
      'CREATE INDEX IF NOT EXISTS idx_media_files_is_dirty ON media_files (is_dirty)',
      'CREATE INDEX IF NOT EXISTS idx_upload_tasks_status ON upload_tasks (status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_records_status ON sync_records (status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_records_table_record ON sync_records (table_name, record_id)',
      'CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON sync_conflicts (status)',
    ];

    for (const indexSql of indexes) {
      await this.db.execute(indexSql);
    }
  }

  // ==================== 博客相关操作 ====================

  /**
   * 获取本地博客列表
   */
  async getBlogs(params?: {
    authorId?: string;
    categoryId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Blog[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = 'SELECT * FROM blogs WHERE 1=1';
    const sqlParams: any[] = [];

    if (params?.authorId) {
      sql += ' AND author_id = ?';
      sqlParams.push(params.authorId);
    }

    if (params?.categoryId) {
      sql += ' AND category_id = ?';
      sqlParams.push(params.categoryId);
    }

    if (params?.status) {
      sql += ' AND status = ?';
      sqlParams.push(params.status);
    }

    sql += ' ORDER BY updated_at DESC';

    if (params?.limit) {
      sql += ' LIMIT ?';
      sqlParams.push(params.limit);

      if (params?.offset) {
        sql += ' OFFSET ?';
        sqlParams.push(params.offset);
      }
    }

    const result = await this.db.select<any[]>(sql, sqlParams);
    return result.map(this.mapBlogFromDB);
  }

  /**
   * 获取单个博客
   */
  async getBlog(id: string): Promise<Blog | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.select<any[]>(
      'SELECT * FROM blogs WHERE id = ?',
      [id]
    );

    return result.length > 0 ? this.mapBlogFromDB(result[0]) : null;
  }

  /**
   * 创建博客
   */
  async createBlog(blog: BlogCreateRequest & { id: string; authorId: string }): Promise<Blog> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const blogData = {
      id: blog.id,
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || '',
      cover_image: blog.coverImage || null,
      status: blog.status || 'draft',
      visibility: blog.visibility || 'public',
      author_id: blog.authorId,
      category_id: blog.categoryId || null,
      tags: JSON.stringify(blog.tags || []),
      metadata: JSON.stringify(blog.metadata || {}),
      seo: JSON.stringify(blog.seo || {}),
      stats: JSON.stringify({ views: 0, likes: 0, comments: 0 }),
      published_at: blog.publishedAt || null,
      created_at: now,
      updated_at: now,
      synced_at: null,
      is_dirty: 1,
    };

    await this.db.execute(
      `INSERT INTO blogs (
        id, title, content, excerpt, cover_image, status, visibility,
        author_id, category_id, tags, metadata, seo, stats,
        published_at, created_at, updated_at, synced_at, is_dirty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        blogData.id, blogData.title, blogData.content, blogData.excerpt,
        blogData.cover_image, blogData.status, blogData.visibility,
        blogData.author_id, blogData.category_id, blogData.tags,
        blogData.metadata, blogData.seo, blogData.stats,
        blogData.published_at, blogData.created_at, blogData.updated_at,
        blogData.synced_at, blogData.is_dirty
      ]
    );

    return this.mapBlogFromDB(blogData);
  }

  /**
   * 更新博客
   */
  async updateBlog(id: string, updates: Partial<BlogUpdateRequest>): Promise<Blog | null> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const setParts: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        if (typeof value === 'object' && value !== null) {
          setParts.push(`${dbKey} = ?`);
          params.push(JSON.stringify(value));
        } else {
          setParts.push(`${dbKey} = ?`);
          params.push(value);
        }
      }
    });

    if (setParts.length === 0) {
      return this.getBlog(id);
    }

    setParts.push('updated_at = ?', 'is_dirty = ?');
    params.push(now, 1, id);

    await this.db.execute(
      `UPDATE blogs SET ${setParts.join(', ')} WHERE id = ?`,
      params
    );

    return this.getBlog(id);
  }

  /**
   * 删除博客
   */
  async deleteBlog(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execute('DELETE FROM blogs WHERE id = ?', [id]);
  }

  /**
   * 获取需要同步的博客
   */
  async getDirtyBlogs(): Promise<Blog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.select<any[]>(
      'SELECT * FROM blogs WHERE is_dirty = 1 ORDER BY updated_at ASC'
    );

    return result.map(this.mapBlogFromDB);
  }

  /**
   * 标记博客为已同步
   */
  async markBlogSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.execute(
      'UPDATE blogs SET is_dirty = 0, synced_at = ? WHERE id = ?',
      [now, id]
    );
  }

  // ==================== 媒体文件相关操作 ====================

  /**
   * 获取媒体文件列表
   */
  async getMediaFiles(params?: {
    folderId?: string;
    uploadStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<MediaLibraryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = 'SELECT * FROM media_files WHERE 1=1';
    const sqlParams: any[] = [];

    if (params?.folderId) {
      sql += ' AND folder_id = ?';
      sqlParams.push(params.folderId);
    }

    if (params?.uploadStatus) {
      sql += ' AND upload_status = ?';
      sqlParams.push(params.uploadStatus);
    }

    sql += ' ORDER BY created_at DESC';

    if (params?.limit) {
      sql += ' LIMIT ?';
      sqlParams.push(params.limit);

      if (params?.offset) {
        sql += ' OFFSET ?';
        sqlParams.push(params.offset);
      }
    }

    const result = await this.db.select<any[]>(sql, sqlParams);
    return result.map(this.mapMediaFileFromDB);
  }

  /**
   * 创建媒体文件记录
   */
  async createMediaFile(file: Omit<MediaLibraryItem, 'createdAt' | 'updatedAt'>): Promise<MediaLibraryItem> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fileData = {
      id: file.id,
      filename: file.filename,
      original_name: file.originalName,
      mime_type: file.mimeType,
      size: file.size,
      width: file.width || null,
      height: file.height || null,
      url: file.url || null,
      local_path: file.localPath || null,
      thumbnail_url: file.thumbnailUrl || null,
      folder_id: file.folderId || null,
      tags: JSON.stringify(file.tags || []),
      description: file.description || null,
      is_public: file.isPublic ? 1 : 0,
      upload_status: file.uploadStatus || 'pending',
      upload_progress: file.uploadProgress || 0,
      error_message: file.errorMessage || null,
      created_at: now,
      updated_at: now,
      synced_at: null,
      is_dirty: 1,
    };

    await this.db.execute(
      `INSERT INTO media_files (
        id, filename, original_name, mime_type, size, width, height,
        url, local_path, thumbnail_url, folder_id, tags, description,
        is_public, upload_status, upload_progress, error_message,
        created_at, updated_at, synced_at, is_dirty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileData.id, fileData.filename, fileData.original_name, fileData.mime_type,
        fileData.size, fileData.width, fileData.height, fileData.url,
        fileData.local_path, fileData.thumbnail_url, fileData.folder_id,
        fileData.tags, fileData.description, fileData.is_public,
        fileData.upload_status, fileData.upload_progress, fileData.error_message,
        fileData.created_at, fileData.updated_at, fileData.synced_at, fileData.is_dirty
      ]
    );

    return this.mapMediaFileFromDB(fileData);
  }

  /**
   * 更新媒体文件
   */
  async updateMediaFile(id: string, updates: Partial<MediaLibraryItem>): Promise<MediaLibraryItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const setParts: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        if (Array.isArray(value)) {
          setParts.push(`${dbKey} = ?`);
          params.push(JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          setParts.push(`${dbKey} = ?`);
          params.push(value ? 1 : 0);
        } else {
          setParts.push(`${dbKey} = ?`);
          params.push(value);
        }
      }
    });

    if (setParts.length === 0) {
      return this.getMediaFile(id);
    }

    setParts.push('updated_at = ?', 'is_dirty = ?');
    params.push(now, 1, id);

    await this.db.execute(
      `UPDATE media_files SET ${setParts.join(', ')} WHERE id = ?`,
      params
    );

    return this.getMediaFile(id);
  }

  /**
   * 获取单个媒体文件
   */
  async getMediaFile(id: string): Promise<MediaLibraryItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.select<any[]>(
      'SELECT * FROM media_files WHERE id = ?',
      [id]
    );

    return result.length > 0 ? this.mapMediaFileFromDB(result[0]) : null;
  }

  // ==================== 上传任务相关操作 ====================

  /**
   * 创建上传任务
   */
  async createUploadTask(task: Omit<UploadTask, 'createdAt' | 'updatedAt'>): Promise<UploadTask> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const taskData = {
      id: task.id,
      file_id: task.fileId || null,
      filename: task.filename,
      file_size: task.fileSize,
      mime_type: task.mimeType,
      status: task.status,
      progress: task.progress,
      upload_url: task.uploadUrl || null,
      chunk_size: task.chunkSize || null,
      uploaded_chunks: JSON.stringify(task.uploadedChunks || []),
      total_chunks: task.totalChunks || null,
      error_message: task.errorMessage || null,
      retry_count: task.retryCount || 0,
      max_retries: task.maxRetries || 3,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO upload_tasks (
        id, file_id, filename, file_size, mime_type, status, progress,
        upload_url, chunk_size, uploaded_chunks, total_chunks,
        error_message, retry_count, max_retries, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskData.id, taskData.file_id, taskData.filename, taskData.file_size,
        taskData.mime_type, taskData.status, taskData.progress,
        taskData.upload_url, taskData.chunk_size, taskData.uploaded_chunks,
        taskData.total_chunks, taskData.error_message, taskData.retry_count,
        taskData.max_retries, taskData.created_at, taskData.updated_at
      ]
    );

    return this.mapUploadTaskFromDB(taskData);
  }

  /**
   * 更新上传任务
   */
  async updateUploadTask(id: string, updates: Partial<UploadTask>): Promise<UploadTask | null> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const setParts: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        if (Array.isArray(value)) {
          setParts.push(`${dbKey} = ?`);
          params.push(JSON.stringify(value));
        } else {
          setParts.push(`${dbKey} = ?`);
          params.push(value);
        }
      }
    });

    if (setParts.length === 0) {
      return this.getUploadTask(id);
    }

    setParts.push('updated_at = ?');
    params.push(now, id);

    await this.db.execute(
      `UPDATE upload_tasks SET ${setParts.join(', ')} WHERE id = ?`,
      params
    );

    return this.getUploadTask(id);
  }

  /**
   * 获取上传任务
   */
  async getUploadTask(id: string): Promise<UploadTask | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.select<any[]>(
      'SELECT * FROM upload_tasks WHERE id = ?',
      [id]
    );

    return result.length > 0 ? this.mapUploadTaskFromDB(result[0]) : null;
  }

  /**
   * 获取待处理的上传任务
   */
  async getPendingUploadTasks(): Promise<UploadTask[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.select<any[]>(
      "SELECT * FROM upload_tasks WHERE status IN ('pending', 'failed') AND retry_count < max_retries ORDER BY created_at ASC"
    );

    return result.map(this.mapUploadTaskFromDB);
  }

  // ==================== 同步相关操作 ====================

  /**
   * 创建同步记录
   */
  async createSyncRecord(record: Omit<SyncRecord, 'createdAt' | 'updatedAt'>): Promise<SyncRecord> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const recordData = {
      id: record.id,
      table_name: record.tableName,
      record_id: record.recordId,
      operation: record.operation,
      local_data: JSON.stringify(record.localData),
      remote_data: record.remoteData ? JSON.stringify(record.remoteData) : null,
      status: record.status,
      conflict_resolution: record.conflictResolution || null,
      error_message: record.errorMessage || null,
      retry_count: record.retryCount || 0,
      max_retries: record.maxRetries || 3,
      created_at: now,
      updated_at: now,
      synced_at: record.syncedAt || null,
    };

    await this.db.execute(
      `INSERT OR REPLACE INTO sync_records (
        id, table_name, record_id, operation, local_data, remote_data,
        status, conflict_resolution, error_message, retry_count,
        max_retries, created_at, updated_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordData.id, recordData.table_name, recordData.record_id,
        recordData.operation, recordData.local_data, recordData.remote_data,
        recordData.status, recordData.conflict_resolution, recordData.error_message,
        recordData.retry_count, recordData.max_retries, recordData.created_at,
        recordData.updated_at, recordData.synced_at
      ]
    );

    return this.mapSyncRecordFromDB(recordData);
  }

  /**
   * 获取待同步记录
   */
  async getPendingSyncRecords(): Promise<SyncRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.select<any[]>(
      "SELECT * FROM sync_records WHERE status IN ('pending', 'failed') AND retry_count < max_retries ORDER BY created_at ASC"
    );

    return result.map(this.mapSyncRecordFromDB);
  }

  // ==================== 工具方法 ====================

  /**
   * 驼峰转下划线
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 下划线转驼峰
   */
  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 映射博客数据库记录到对象
   */
  private mapBlogFromDB(row: any): Blog {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      coverImage: row.cover_image,
      status: row.status,
      visibility: row.visibility,
      authorId: row.author_id,
      categoryId: row.category_id,
      tags: row.tags ? JSON.parse(row.tags) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      seo: row.seo ? JSON.parse(row.seo) : {},
      stats: row.stats ? JSON.parse(row.stats) : { views: 0, likes: 0, comments: 0 },
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 映射媒体文件数据库记录到对象
   */
  private mapMediaFileFromDB(row: any): MediaLibraryItem {
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: row.size,
      width: row.width,
      height: row.height,
      url: row.url,
      localPath: row.local_path,
      thumbnailUrl: row.thumbnail_url,
      folderId: row.folder_id,
      tags: row.tags ? JSON.parse(row.tags) : [],
      description: row.description,
      isPublic: Boolean(row.is_public),
      uploadStatus: row.upload_status,
      uploadProgress: row.upload_progress,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 映射上传任务数据库记录到对象
   */
  private mapUploadTaskFromDB(row: any): UploadTask {
    return {
      id: row.id,
      fileId: row.file_id,
      filename: row.filename,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      status: row.status,
      progress: row.progress,
      uploadUrl: row.upload_url,
      chunkSize: row.chunk_size,
      uploadedChunks: row.uploaded_chunks ? JSON.parse(row.uploaded_chunks) : [],
      totalChunks: row.total_chunks,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 映射同步记录数据库记录到对象
   */
  private mapSyncRecordFromDB(row: any): SyncRecord {
    return {
      id: row.id,
      tableName: row.table_name,
      recordId: row.record_id,
      operation: row.operation,
      localData: row.local_data ? JSON.parse(row.local_data) : null,
      remoteData: row.remote_data ? JSON.parse(row.remote_data) : null,
      status: row.status,
      conflictResolution: row.conflict_resolution,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncedAt: row.synced_at,
    };
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// 创建本地数据库实例
const localDB = new LocalDatabase();

export { localDB, LocalDatabase };
export default localDB;