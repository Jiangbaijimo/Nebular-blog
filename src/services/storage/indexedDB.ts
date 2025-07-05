// IndexedDB图片缓存存储服务
import type {
  ImageCacheItem,
  ImageCacheOptions,
  ImageCacheStats,
} from '../../types/upload';

/**
 * IndexedDB图片缓存管理类
 */
class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private dbName = 'BlogImageCache';
  private dbVersion = 1;
  private storeName = 'images';
  private metaStoreName = 'metadata';
  private isInitialized = false;
  private maxCacheSize = 500 * 1024 * 1024; // 500MB
  private maxCacheItems = 1000;

  /**
   * 初始化IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建图片存储对象仓库
        if (!db.objectStoreNames.contains(this.storeName)) {
          const imageStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
          imageStore.createIndex('url', 'url', { unique: true });
          imageStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          imageStore.createIndex('size', 'size', { unique: false });
          imageStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建元数据存储对象仓库
        if (!db.objectStoreNames.contains(this.metaStoreName)) {
          const metaStore = db.createObjectStore(this.metaStoreName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * 存储图片到缓存
   */
  async storeImage(
    url: string,
    blob: Blob,
    options?: ImageCacheOptions
  ): Promise<ImageCacheItem> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const id = this.generateId(url);
    const now = Date.now();
    
    // 检查缓存空间
    await this.ensureCacheSpace(blob.size);

    const cacheItem: ImageCacheItem = {
      id,
      url,
      blob,
      size: blob.size,
      mimeType: blob.type,
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      expiresAt: options?.expiresAt || (now + 30 * 24 * 60 * 60 * 1000), // 默认30天过期
      metadata: options?.metadata || {},
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cacheItem);

      request.onsuccess = () => {
        this.updateCacheStats();
        resolve(cacheItem);
      };

      request.onerror = () => {
        reject(new Error('Failed to store image in cache'));
      };
    });
  }

  /**
   * 从缓存获取图片
   */
  async getImage(url: string): Promise<ImageCacheItem | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('url');
      const request = index.get(url);

      request.onsuccess = () => {
        const result = request.result as ImageCacheItem | undefined;
        
        if (result) {
          // 检查是否过期
          if (result.expiresAt && Date.now() > result.expiresAt) {
            this.deleteImage(url);
            resolve(null);
            return;
          }

          // 更新访问信息
          this.updateAccessInfo(result.id);
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to get image from cache'));
      };
    });
  }

  /**
   * 检查图片是否在缓存中
   */
  async hasImage(url: string): Promise<boolean> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('url');
      const request = index.count(url);

      request.onsuccess = () => {
        resolve(request.result > 0);
      };

      request.onerror = () => {
        reject(new Error('Failed to check image in cache'));
      };
    });
  }

  /**
   * 删除缓存中的图片
   */
  async deleteImage(url: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('url');
      const getRequest = index.get(url);

      getRequest.onsuccess = () => {
        const result = getRequest.result as ImageCacheItem | undefined;
        if (result) {
          const deleteRequest = store.delete(result.id);
          deleteRequest.onsuccess = () => {
            this.updateCacheStats();
            resolve();
          };
          deleteRequest.onerror = () => {
            reject(new Error('Failed to delete image from cache'));
          };
        } else {
          resolve(); // 图片不存在，视为删除成功
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to find image in cache'));
      };
    });
  }

  /**
   * 批量删除图片
   */
  async deleteImages(urls: string[]): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const promises = urls.map(url => this.deleteImage(url));
    await Promise.allSettled(promises);
  }

  /**
   * 清空所有缓存
   */
  async clearCache(): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        this.updateCacheStats();
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear cache'));
      };
    });
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<ImageCacheStats> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as ImageCacheItem[];
        const totalSize = items.reduce((sum, item) => sum + item.size, 0);
        const totalItems = items.length;
        const oldestItem = items.reduce((oldest, item) => 
          !oldest || item.createdAt < oldest.createdAt ? item : oldest, null as ImageCacheItem | null
        );
        const newestItem = items.reduce((newest, item) => 
          !newest || item.createdAt > newest.createdAt ? item : newest, null as ImageCacheItem | null
        );

        resolve({
          totalSize,
          totalItems,
          maxCacheSize: this.maxCacheSize,
          maxCacheItems: this.maxCacheItems,
          usagePercentage: (totalSize / this.maxCacheSize) * 100,
          oldestItemDate: oldestItem?.createdAt || null,
          newestItemDate: newestItem?.createdAt || null,
        });
      };

      request.onerror = () => {
        reject(new Error('Failed to get cache stats'));
      };
    });
  }

  /**
   * 获取所有缓存项
   */
  async getAllCacheItems(): Promise<ImageCacheItem[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as ImageCacheItem[]);
      };

      request.onerror = () => {
        reject(new Error('Failed to get all cache items'));
      };
    });
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpiredCache(): Promise<number> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const now = Date.now();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        
        if (cursor) {
          const item = cursor.value as ImageCacheItem;
          
          if (item.expiresAt && now > item.expiresAt) {
            cursor.delete();
            deletedCount++;
          }
          
          cursor.continue();
        } else {
          // 遍历完成
          this.updateCacheStats();
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to cleanup expired cache'));
      };
    });
  }

  /**
   * LRU缓存清理（最近最少使用）
   */
  async cleanupLRU(targetSize?: number): Promise<number> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const stats = await this.getCacheStats();
    const target = targetSize || this.maxCacheSize * 0.8; // 清理到80%
    
    if (stats.totalSize <= target) {
      return 0; // 不需要清理
    }

    const items = await this.getAllCacheItems();
    
    // 按最后访问时间排序（最久未访问的在前）
    items.sort((a, b) => a.lastAccessed - b.lastAccessed);

    let deletedCount = 0;
    let currentSize = stats.totalSize;

    for (const item of items) {
      if (currentSize <= target) break;
      
      await this.deleteImage(item.url);
      currentSize -= item.size;
      deletedCount++;
    }

    return deletedCount;
  }

  /**
   * 确保缓存空间足够
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const stats = await this.getCacheStats();
    
    // 检查是否超过最大项目数
    if (stats.totalItems >= this.maxCacheItems) {
      await this.cleanupLRU();
    }
    
    // 检查是否超过最大大小
    if (stats.totalSize + requiredSize > this.maxCacheSize) {
      await this.cleanupLRU(this.maxCacheSize - requiredSize);
    }
  }

  /**
   * 更新访问信息
   */
  private async updateAccessInfo(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result as ImageCacheItem;
        if (item) {
          item.lastAccessed = Date.now();
          item.accessCount = (item.accessCount || 0) + 1;
          
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to update access info'));
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get item for access update'));
      };
    });
  }

  /**
   * 更新缓存统计信息
   */
  private async updateCacheStats(): Promise<void> {
    if (!this.db) return;

    try {
      const stats = await this.getCacheStats();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.metaStoreName], 'readwrite');
        const store = transaction.objectStore(this.metaStoreName);
        const request = store.put({
          key: 'cacheStats',
          value: stats,
          updatedAt: Date.now(),
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to update cache stats'));
      });
    } catch (error) {
      console.error('Failed to update cache stats:', error);
    }
  }

  /**
   * 生成缓存项ID
   */
  private generateId(url: string): string {
    // 使用URL的哈希作为ID
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 创建Blob URL
   */
  createBlobUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * 释放Blob URL
   */
  revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * 压缩图片
   */
  async compressImage(
    blob: Blob,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'webp' | 'png';
    } = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // 绘制图片
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 转换为Blob
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              resolve(compressedBlob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(
    blob: Blob,
    size: number = 200
  ): Promise<Blob> {
    return this.compressImage(blob, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg'
    });
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// 创建IndexedDB缓存实例
const indexedDBCache = new IndexedDBCache();

export { indexedDBCache, IndexedDBCache };
export default indexedDBCache;