/**
 * Service Worker 注册和管理工具
 * 提供 Service Worker 的注册、更新、缓存管理等功能
 */

export interface ServiceWorkerConfig {
  swUrl?: string;
  scope?: string;
  updateViaCache?: 'imports' | 'all' | 'none';
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export interface CacheStats {
  totalSize: number;
  cacheCount: number;
  caches: Array<{
    name: string;
    size: number;
    itemCount: number;
  }>;
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig;
  private updateCheckInterval: number | null = null;

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = {
      swUrl: '/sw.js',
      scope: '/',
      updateViaCache: 'none',
      ...config,
    };
  }

  /**
   * 注册 Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Service Worker is not supported in this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        this.config.swUrl!,
        {
          scope: this.config.scope,
          updateViaCache: this.config.updateViaCache,
        }
      );

      this.registration = registration;
      this.setupEventListeners(registration);
      this.startUpdateCheck();

      console.log('Service Worker registered successfully:', registration);
      this.config.onSuccess?.(registration);

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.config.onError?.(error as Error);
      return null;
    }
  }

  /**
   * 注销 Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      this.stopUpdateCheck();
      this.registration = null;
      console.log('Service Worker unregistered successfully');
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * 检查 Service Worker 更新
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Service Worker update check failed:', error);
      return false;
    }
  }

  /**
   * 跳过等待，立即激活新的 Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = () => resolve();
      
      this.registration!.waiting!.postMessage(
        { type: 'SKIP_WAITING' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<CacheStats> {
    if (!('caches' in window)) {
      return { totalSize: 0, cacheCount: 0, caches: [] };
    }

    try {
      const cacheNames = await caches.keys();
      const cacheStats = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          
          let size = 0;
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              size += blob.size;
            }
          }

          return {
            name,
            size,
            itemCount: requests.length,
          };
        })
      );

      const totalSize = cacheStats.reduce((sum, cache) => sum + cache.size, 0);

      return {
        totalSize,
        cacheCount: cacheNames.length,
        caches: cacheStats,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalSize: 0, cacheCount: 0, caches: [] };
    }
  }

  /**
   * 清理所有缓存
   */
  async clearAllCaches(): Promise<boolean> {
    if (!this.registration?.active) {
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };
      
      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * 预缓存指定的 URLs
   */
  async precacheUrls(urls: string[]): Promise<boolean> {
    if (!this.registration?.active) {
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };
      
      this.registration!.active!.postMessage(
        { type: 'CACHE_URLS', payload: { urls } },
        [messageChannel.port2]
      );
    });
  }

  /**
   * 获取当前注册状态
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * 检查是否支持 Service Worker
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * 检查是否已注册
   */
  isRegistered(): boolean {
    return this.registration !== null;
  }

  /**
   * 获取 Service Worker 状态
   */
  getStatus(): {
    supported: boolean;
    registered: boolean;
    active: boolean;
    waiting: boolean;
    installing: boolean;
  } {
    return {
      supported: this.isSupported(),
      registered: this.isRegistered(),
      active: !!this.registration?.active,
      waiting: !!this.registration?.waiting,
      installing: !!this.registration?.installing,
    };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(registration: ServiceWorkerRegistration): void {
    // 监听 Service Worker 状态变化
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 新的 Service Worker 已安装，但旧的仍在控制页面
          console.log('New Service Worker available');
          this.config.onUpdate?.(registration);
        }
      });
    });

    // 监听 Service Worker 控制器变化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      // 页面现在由新的 Service Worker 控制
      window.location.reload();
    });

    // 监听来自 Service Worker 的消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from Service Worker:', event.data);
    });
  }

  /**
   * 开始定期检查更新
   */
  private startUpdateCheck(): void {
    // 每小时检查一次更新
    this.updateCheckInterval = window.setInterval(() => {
      this.checkForUpdate();
    }, 60 * 60 * 1000);
  }

  /**
   * 停止定期检查更新
   */
  private stopUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}

// 默认的 Service Worker 管理器实例
export const serviceWorkerManager = new ServiceWorkerManager({
  onUpdate: (registration) => {
    // 显示更新提示
    if (window.confirm('发现新版本，是否立即更新？')) {
      serviceWorkerManager.skipWaiting().then(() => {
        window.location.reload();
      });
    }
  },
  onSuccess: (registration) => {
    console.log('Service Worker 注册成功');
  },
  onError: (error) => {
    console.error('Service Worker 注册失败:', error);
  },
});

/**
 * 注册 Service Worker（便捷函数）
 */
export async function registerServiceWorker(config?: ServiceWorkerConfig): Promise<ServiceWorkerRegistration | null> {
  const manager = config ? new ServiceWorkerManager(config) : serviceWorkerManager;
  return manager.register();
}

/**
 * 注销 Service Worker（便捷函数）
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  return serviceWorkerManager.unregister();
}

/**
 * 获取缓存统计信息（便捷函数）
 */
export async function getCacheStats(): Promise<CacheStats> {
  return serviceWorkerManager.getCacheStats();
}

/**
 * 清理所有缓存（便捷函数）
 */
export async function clearAllCaches(): Promise<boolean> {
  return serviceWorkerManager.clearAllCaches();
}

/**
 * 预缓存 URLs（便捷函数）
 */
export async function precacheUrls(urls: string[]): Promise<boolean> {
  return serviceWorkerManager.precacheUrls(urls);
}

/**
 * 格式化缓存大小
 */
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查网络状态
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 监听网络状态变化
 */
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}