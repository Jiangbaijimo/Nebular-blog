import { invoke } from '@tauri-apps/api/core';
import { message } from '@tauri-apps/plugin-dialog';
import { sqliteManager } from '../database/sqliteManager';
import { blogAPI } from '../api';
import type { BlogPost } from '../../types/blog';
import type { ThemeConfig } from '../api/cloudFunctionTheme';

// 缓存数据类型
interface CacheData {
  id: string;
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

// 缓存配置
interface CacheConfig {
  defaultTTL: number; // 默认缓存时间（毫秒）
  maxCacheSize: number; // 最大缓存条目数
  enableOfflineMode: boolean;
}

class OfflineCacheService {
  private config: CacheConfig = {
    defaultTTL: 24 * 60 * 60 * 1000, // 24小时
    maxCacheSize: 1000,
    enableOfflineMode: true
  };

  private memoryCache = new Map<string, CacheData>();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 初始化SQLite缓存表
      await this.initializeCacheTable();
      
      // 加载配置
      await this.loadConfig();
      
      // 清理过期缓存
      await this.cleanExpiredCache();
      
      this.isInitialized = true;
      console.log('离线缓存服务初始化成功');
    } catch (error) {
      console.error('离线缓存服务初始化失败:', error);
      throw error;
    }
  }

  private async initializeCacheTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS api_cache (
        id TEXT PRIMARY KEY,
        cache_key TEXT UNIQUE NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        expires_at INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sqliteManager.execute(createTableSQL);
    
    // 创建索引
    await sqliteManager.execute('CREATE INDEX IF NOT EXISTS idx_cache_key ON api_cache(cache_key)');
    await sqliteManager.execute('CREATE INDEX IF NOT EXISTS idx_expires_at ON api_cache(expires_at)');
  }

  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await sqliteManager.getConfig<CacheConfig>('offlineCacheConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.warn('加载缓存配置失败，使用默认配置:', error);
    }
  }

  private async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    await sqliteManager.execute(
      'DELETE FROM api_cache WHERE expires_at IS NOT NULL AND expires_at < ?',
      [now]
    );
  }

  // 生成缓存键
  private generateCacheKey(url: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}_${paramStr}`;
  }

  // 设置缓存
  async setCache(key: string, data: any, ttl?: number): Promise<void> {
    const cacheData: CacheData = {
      id: crypto.randomUUID(),
      key,
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : Date.now() + this.config.defaultTTL
    };

    // 存储到内存缓存
    this.memoryCache.set(key, cacheData);

    // 存储到SQLite
    try {
      await sqliteManager.execute(
        'INSERT OR REPLACE INTO api_cache (id, cache_key, data, timestamp, expires_at) VALUES (?, ?, ?, ?, ?)',
        [cacheData.id, key, JSON.stringify(data), cacheData.timestamp, cacheData.expiresAt]
      );
    } catch (error) {
      console.error('保存缓存到数据库失败:', error);
    }
  }

  // 获取缓存
  async getCache(key: string): Promise<any | null> {
    // 先检查内存缓存
    const memoryData = this.memoryCache.get(key);
    if (memoryData && (!memoryData.expiresAt || memoryData.expiresAt > Date.now())) {
      return memoryData.data;
    }

    // 检查SQLite缓存
    try {
      const result = await sqliteManager.query(
        'SELECT data, expires_at FROM api_cache WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > ?)',
        [key, Date.now()]
      );

      if (result.length > 0) {
        const data = JSON.parse(result[0].data);
        
        // 更新内存缓存
        this.memoryCache.set(key, {
          id: crypto.randomUUID(),
          key,
          data,
          timestamp: Date.now(),
          expiresAt: result[0].expires_at
        });
        
        return data;
      }
    } catch (error) {
      console.error('从数据库获取缓存失败:', error);
    }

    return null;
  }

  // 检查是否在Tauri环境中
  private isTauriApp(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
  }

  // 显示离线提示
  private async showOfflineNotification(msg: string): Promise<void> {
    if (this.isTauriApp()) {
      try {
        await message(msg, {
          title: '离线模式',
          okLabel: '确定'
        });
      } catch (error) {
        console.error('显示Tauri对话框失败:', error);
        // 降级到浏览器通知
        this.showBrowserNotification(msg);
      }
    } else {
      this.showBrowserNotification(msg);
    }
  }

  private showBrowserNotification(msg: string): void {
    // 创建浏览器通知
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.textContent = msg;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // 带缓存的API请求
  async fetchWithCache<T>(
    apiCall: () => Promise<T>,
    cacheKey: string,
    options?: {
      ttl?: number;
      forceRefresh?: boolean;
      showOfflineMessage?: boolean;
    }
  ): Promise<T> {
    const { ttl, forceRefresh = false, showOfflineMessage = true } = options || {};

    // 如果不强制刷新，先尝试获取缓存
    if (!forceRefresh) {
      const cachedData = await this.getCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      // 尝试API请求
      const data = await apiCall();
      
      // 缓存成功的响应
      await this.setCache(cacheKey, data, ttl);
      
      return data;
    } catch (error) {
      console.error('API请求失败:', error);
      
      // API失败时，尝试获取缓存数据
      const cachedData = await this.getCache(cacheKey);
      
      if (cachedData) {
        if (showOfflineMessage) {
          await this.showOfflineNotification(
            '网络连接异常，正在显示缓存数据。请检查网络连接后重试。'
          );
        }
        return cachedData;
      }
      
      // 没有缓存数据时抛出错误
      throw error;
    }
  }

  // 获取博客列表（带缓存）
  async getBlogsWithCache(): Promise<BlogPost[]> {
    const cacheKey = this.generateCacheKey('/api/blogs');
    
    return this.fetchWithCache(
      async () => {
        const response = await fetch('/api/blogs');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        return result.data || result;
      },
      cacheKey,
      { ttl: 10 * 60 * 1000 } // 10分钟缓存
    );
  }

  // 获取主题配置（带缓存）
  async getThemeConfigWithCache(): Promise<ThemeConfig> {
    const cacheKey = this.generateCacheKey('/api/fn/shiro/');
    
    return this.fetchWithCache(
      async () => {
        const response = await fetch('/api/fn/shiro/');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        return result.data;
      },
      cacheKey,
      { ttl: 60 * 60 * 1000 } // 1小时缓存
    );
  }

  // 清除所有缓存
  async clearAllCache(): Promise<void> {
    this.memoryCache.clear();
    await sqliteManager.execute('DELETE FROM api_cache');
  }

  // 清除特定缓存
  async clearCache(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await sqliteManager.execute('DELETE FROM api_cache WHERE cache_key = ?', [key]);
  }

  // 获取缓存统计
  async getCacheStats(): Promise<{
    totalItems: number;
    memoryItems: number;
    totalSize: number;
    oldestItem?: Date;
    newestItem?: Date;
  }> {
    const dbResult = await sqliteManager.query(
      'SELECT COUNT(*) as count, MIN(timestamp) as oldest, MAX(timestamp) as newest FROM api_cache'
    );
    
    const totalItems = dbResult[0]?.count || 0;
    const memoryItems = this.memoryCache.size;
    
    return {
      totalItems,
      memoryItems,
      totalSize: totalItems, // 简化统计
      oldestItem: dbResult[0]?.oldest ? new Date(dbResult[0].oldest) : undefined,
      newestItem: dbResult[0]?.newest ? new Date(dbResult[0].newest) : undefined
    };
  }
}

// 导出单例实例
export const offlineCacheService = new OfflineCacheService();
export default offlineCacheService;