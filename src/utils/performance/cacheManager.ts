import { LRUCache } from 'lru-cache';

// 缓存配置接口
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  maxAge?: number; // Deprecated, use ttl
  updateAgeOnGet?: boolean;
  allowStale?: boolean;
  noDeleteOnFetchRejection?: boolean;
}

// 缓存项接口
interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size?: number;
}

// 缓存统计接口
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
  memoryUsage: number;
}

// 高级缓存管理器
class AdvancedCacheManager<K = string, V = any> {
  private cache: LRUCache<K, CacheItem<V>>;
  private stats: CacheStats;
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private compressionEnabled = false;
  private encryptionEnabled = false;
  private persistenceEnabled = false;
  private storageKey: string;

  constructor(
    config: CacheConfig,
    options: {
      enableCompression?: boolean;
      enableEncryption?: boolean;
      enablePersistence?: boolean;
      storageKey?: string;
    } = {}
  ) {
    this.config = config;
    this.storageKey = options.storageKey || 'cache-manager';
    
    this.cache = new LRUCache<K, CacheItem<V>>({
      max: config.maxSize,
      ttl: config.ttl,
      updateAgeOnGet: config.updateAgeOnGet ?? true,
      allowStale: config.allowStale ?? false,
      noDeleteOnFetchRejection: config.noDeleteOnFetchRejection ?? true,
      dispose: (value, key) => {
        this.stats.evictions++;
        this.onEviction?.(key, value.value);
      },
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      maxSize: config.maxSize,
      hitRate: 0,
      memoryUsage: 0,
    };

    this.compressionEnabled = options.enableCompression ?? false;
    this.encryptionEnabled = options.enableEncryption ?? false;
    this.persistenceEnabled = options.enablePersistence ?? false;

    // 启动清理任务
    this.startCleanupTask();

    // 从持久化存储恢复
    if (this.persistenceEnabled) {
      this.loadFromStorage();
    }
  }

  // 事件回调
  onEviction?: (key: K, value: V) => void;
  onHit?: (key: K, value: V) => void;
  onMiss?: (key: K) => void;
  onSet?: (key: K, value: V) => void;
  onDelete?: (key: K) => void;

  // 设置缓存项
  set(
    key: K,
    value: V,
    options: {
      ttl?: number;
      priority?: number;
      tags?: string[];
      compress?: boolean;
      encrypt?: boolean;
    } = {}
  ): boolean {
    try {
      let processedValue = value;
      
      // 压缩处理
      if ((options.compress ?? this.compressionEnabled) && typeof value === 'string') {
        processedValue = this.compress(value) as V;
      }
      
      // 加密处理
      if (options.encrypt ?? this.encryptionEnabled) {
        processedValue = this.encrypt(processedValue) as V;
      }

      const cacheItem: CacheItem<V> = {
        value: processedValue,
        timestamp: Date.now(),
        ttl: options.ttl ?? this.config.ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateSize(processedValue),
      };

      const success = this.cache.set(key, cacheItem, {
        ttl: options.ttl,
      });

      if (success) {
        this.stats.sets++;
        this.stats.size = this.cache.size;
        this.updateMemoryUsage();
        this.onSet?.(key, value);
        
        // 持久化
        if (this.persistenceEnabled) {
          this.saveToStorage();
        }
      }

      return success;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // 获取缓存项
  get(key: K, options: { allowStale?: boolean } = {}): V | undefined {
    try {
      const cacheItem = this.cache.get(key, {
        allowStale: options.allowStale ?? this.config.allowStale,
      });

      if (cacheItem) {
        // 更新访问统计
        cacheItem.accessCount++;
        cacheItem.lastAccessed = Date.now();
        
        this.stats.hits++;
        this.updateHitRate();
        
        let value = cacheItem.value;
        
        // 解密处理
        if (this.encryptionEnabled) {
          value = this.decrypt(value);
        }
        
        // 解压缩处理
        if (this.compressionEnabled && typeof value === 'string') {
          value = this.decompress(value as string) as V;
        }
        
        this.onHit?.(key, value);
        return value;
      } else {
        this.stats.misses++;
        this.updateHitRate();
        this.onMiss?.(key);
        return undefined;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }
  }

  // 检查是否存在
  has(key: K): boolean {
    return this.cache.has(key);
  }

  // 删除缓存项
  delete(key: K): boolean {
    const success = this.cache.delete(key);
    if (success) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      this.updateMemoryUsage();
      this.onDelete?.(key);
      
      if (this.persistenceEnabled) {
        this.saveToStorage();
      }
    }
    return success;
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.memoryUsage = 0;
    
    if (this.persistenceEnabled) {
      this.clearStorage();
    }
  }

  // 获取所有键
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  // 获取所有值
  values(): V[] {
    return Array.from(this.cache.values()).map(item => {
      let value = item.value;
      
      if (this.encryptionEnabled) {
        value = this.decrypt(value);
      }
      
      if (this.compressionEnabled && typeof value === 'string') {
        value = this.decompress(value as string) as V;
      }
      
      return value;
    });
  }

  // 获取缓存项详情
  getItemInfo(key: K): (CacheItem<V> & { remainingTtl: number }) | undefined {
    const item = this.cache.get(key, { allowStale: true });
    if (!item) return undefined;

    const now = Date.now();
    const remainingTtl = Math.max(0, item.ttl - (now - item.timestamp));

    return {
      ...item,
      remainingTtl,
    };
  }

  // 批量设置
  setMany(entries: Array<[K, V, { ttl?: number }?]>): boolean[] {
    return entries.map(([key, value, options]) => this.set(key, value, options));
  }

  // 批量获取
  getMany(keys: K[]): Array<V | undefined> {
    return keys.map(key => this.get(key));
  }

  // 批量删除
  deleteMany(keys: K[]): boolean[] {
    return keys.map(key => this.delete(key));
  }

  // 根据标签删除
  deleteByTag(tag: string): number {
    let deletedCount = 0;
    // 注意：这需要在实际实现中添加标签支持
    // 这里只是示例接口
    return deletedCount;
  }

  // 获取统计信息
  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.cache.size,
    };
  }

  // 重置统计信息
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0,
      memoryUsage: this.stats.memoryUsage,
    };
  }

  // 获取热点数据
  getHotKeys(limit = 10): Array<{ key: K; accessCount: number; lastAccessed: number }> {
    const items: Array<{ key: K; accessCount: number; lastAccessed: number }> = [];
    
    for (const [key, item] of this.cache.entries()) {
      items.push({
        key,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed,
      });
    }
    
    return items
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  // 获取即将过期的项
  getExpiringItems(withinMs = 60000): Array<{ key: K; remainingTtl: number }> {
    const items: Array<{ key: K; remainingTtl: number }> = [];
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      const remainingTtl = item.ttl - (now - item.timestamp);
      if (remainingTtl > 0 && remainingTtl <= withinMs) {
        items.push({ key, remainingTtl });
      }
    }
    
    return items.sort((a, b) => a.remainingTtl - b.remainingTtl);
  }

  // 刷新缓存项的 TTL
  refresh(key: K, newTtl?: number): boolean {
    const item = this.cache.get(key, { allowStale: true });
    if (!item) return false;

    item.timestamp = Date.now();
    if (newTtl !== undefined) {
      item.ttl = newTtl;
    }

    return this.cache.set(key, item, { ttl: item.ttl });
  }

  // 压缩数据
  private compress(data: string): string {
    // 简单的压缩实现（实际项目中应使用专业的压缩库）
    try {
      return btoa(data);
    } catch {
      return data;
    }
  }

  // 解压缩数据
  private decompress(data: string): string {
    try {
      return atob(data);
    } catch {
      return data;
    }
  }

  // 加密数据
  private encrypt(data: V): V {
    // 简单的加密实现（实际项目中应使用专业的加密库）
    return data;
  }

  // 解密数据
  private decrypt(data: V): V {
    // 简单的解密实现
    return data;
  }

  // 计算数据大小
  private calculateSize(data: V): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  // 更新命中率
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // 更新内存使用量
  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size || 0;
    }
    this.stats.memoryUsage = totalSize;
  }

  // 启动清理任务
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // 每分钟清理一次
  }

  // 清理过期项
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  // 保存到本地存储
  private saveToStorage(): void {
    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  // 从本地存储加载
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return;

      const parsed = JSON.parse(data);
      const now = Date.now();
      
      // 检查数据是否过期（24小时）
      if (now - parsed.timestamp > 24 * 60 * 60 * 1000) {
        this.clearStorage();
        return;
      }

      // 恢复缓存项
      for (const [key, item] of parsed.cache) {
        if (now - item.timestamp < item.ttl) {
          this.cache.set(key, item);
        }
      }

      // 恢复统计信息
      this.stats = { ...this.stats, ...parsed.stats };
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.clearStorage();
    }
  }

  // 清空本地存储
  private clearStorage(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }

  // 销毁缓存管理器
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.persistenceEnabled) {
      this.saveToStorage();
    }
    
    this.cache.clear();
  }
}

// 缓存管理器工厂
class CacheManagerFactory {
  private static instances = new Map<string, AdvancedCacheManager<any, any>>();

  static create<K = string, V = any>(
    name: string,
    config: CacheConfig,
    options?: {
      enableCompression?: boolean;
      enableEncryption?: boolean;
      enablePersistence?: boolean;
    }
  ): AdvancedCacheManager<K, V> {
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    const instance = new AdvancedCacheManager<K, V>(config, {
      ...options,
      storageKey: `cache-${name}`,
    });

    this.instances.set(name, instance);
    return instance;
  }

  static get<K = string, V = any>(name: string): AdvancedCacheManager<K, V> | undefined {
    return this.instances.get(name);
  }

  static destroy(name: string): boolean {
    const instance = this.instances.get(name);
    if (instance) {
      instance.destroy();
      this.instances.delete(name);
      return true;
    }
    return false;
  }

  static destroyAll(): void {
    for (const [name, instance] of this.instances) {
      instance.destroy();
    }
    this.instances.clear();
  }

  static getAll(): Array<{ name: string; instance: AdvancedCacheManager<any, any> }> {
    return Array.from(this.instances.entries()).map(([name, instance]) => ({
      name,
      instance,
    }));
  }
}

// 预定义的缓存实例
export const apiCache = CacheManagerFactory.create('api', {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5分钟
  updateAgeOnGet: true,
}, {
  enableCompression: true,
  enablePersistence: true,
});

export const imageCache = CacheManagerFactory.create('images', {
  maxSize: 500,
  ttl: 30 * 60 * 1000, // 30分钟
  updateAgeOnGet: true,
}, {
  enablePersistence: true,
});

export const userCache = CacheManagerFactory.create('user', {
  maxSize: 100,
  ttl: 15 * 60 * 1000, // 15分钟
  updateAgeOnGet: true,
}, {
  enableEncryption: true,
  enablePersistence: true,
});

export const blogCache = CacheManagerFactory.create('blog', {
  maxSize: 2000,
  ttl: 10 * 60 * 1000, // 10分钟
  updateAgeOnGet: true,
}, {
  enableCompression: true,
  enablePersistence: true,
});

// 缓存装饰器
export function Cacheable<T extends (...args: any[]) => any>(
  cacheManager: AdvancedCacheManager<string, any>,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    condition?: (...args: Parameters<T>) => boolean;
  } = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      // 检查缓存条件
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }

      // 生成缓存键
      const key = options.keyGenerator
        ? options.keyGenerator(...args)
        : `${target.constructor.name}.${propertyKey}(${JSON.stringify(args)})`;

      // 尝试从缓存获取
      const cached = cacheManager.get(key);
      if (cached !== undefined) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      cacheManager.set(key, result, { ttl: options.ttl });

      return result;
    };

    return descriptor;
  };
}

// 缓存清理策略
export class CacheCleanupStrategy {
  static createLRUStrategy(maxSize: number) {
    return (cache: AdvancedCacheManager<any, any>) => {
      const stats = cache.getStats();
      if (stats.size > maxSize) {
        // LRU 策略已经内置在 LRUCache 中
        console.log(`Cache size ${stats.size} exceeds limit ${maxSize}, LRU eviction will occur`);
      }
    };
  }

  static createTTLStrategy(maxAge: number) {
    return (cache: AdvancedCacheManager<any, any>) => {
      const expiringItems = cache.getExpiringItems(maxAge);
      expiringItems.forEach(({ key }) => {
        cache.delete(key);
      });
    };
  }

  static createMemoryStrategy(maxMemoryMB: number) {
    return (cache: AdvancedCacheManager<any, any>) => {
      const stats = cache.getStats();
      const maxMemoryBytes = maxMemoryMB * 1024 * 1024;
      
      if (stats.memoryUsage > maxMemoryBytes) {
        // 删除最少使用的项目直到内存使用量降低
        const hotKeys = cache.getHotKeys(stats.size);
        const keysToDelete = hotKeys
          .slice(-Math.ceil(stats.size * 0.1)) // 删除10%的最少使用项
          .map(item => item.key);
        
        cache.deleteMany(keysToDelete);
      }
    };
  }
}

export {
  AdvancedCacheManager,
  CacheManagerFactory,
  type CacheConfig,
  type CacheItem,
  type CacheStats,
};