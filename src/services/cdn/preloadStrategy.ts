/**
 * 图片预加载策略服务
 * 智能预加载图片，提升用户体验
 */

import { cdnManager } from './cdnManager';
import type { ImageTransform } from './cdnManager';

// 预加载策略类型
type PreloadStrategy = 'immediate' | 'viewport' | 'hover' | 'idle' | 'manual';

// 预加载优先级
type PreloadPriority = 'high' | 'medium' | 'low';

// 预加载项配置
interface PreloadItem {
  id: string;
  src: string;
  transforms?: ImageTransform;
  preset?: string;
  strategy: PreloadStrategy;
  priority: PreloadPriority;
  delay?: number;
  condition?: () => boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// 预加载状态
interface PreloadState {
  id: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  startTime?: number;
  endTime?: number;
  error?: Error;
  retryCount: number;
}

// 预加载统计
interface PreloadStats {
  total: number;
  loaded: number;
  failed: number;
  pending: number;
  loading: number;
  averageLoadTime: number;
  totalBytes: number;
  cacheHitRate: number;
}

class PreloadStrategy {
  private items: Map<string, PreloadItem> = new Map();
  private states: Map<string, PreloadState> = new Map();
  private loadingQueue: Set<string> = new Set();
  private maxConcurrent = 3;
  private retryAttempts = 3;
  private retryDelay = 1000;
  private idleCallback: number | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private hoverListeners: Map<string, () => void> = new Map();

  constructor() {
    this.setupIntersectionObserver();
    this.setupIdleCallback();
  }

  /**
   * 添加预加载项
   */
  addItem(item: PreloadItem): void {
    this.items.set(item.id, item);
    this.states.set(item.id, {
      id: item.id,
      status: 'pending',
      retryCount: 0
    });

    // 根据策略执行预加载
    this.executeStrategy(item);
  }

  /**
   * 批量添加预加载项
   */
  addItems(items: PreloadItem[]): void {
    items.forEach(item => this.addItem(item));
  }

  /**
   * 移除预加载项
   */
  removeItem(id: string): void {
    const item = this.items.get(id);
    if (item) {
      // 清理hover监听器
      if (item.strategy === 'hover') {
        this.removeHoverListener(id);
      }
      
      this.items.delete(id);
      this.states.delete(id);
      this.loadingQueue.delete(id);
    }
  }

  /**
   * 清空所有预加载项
   */
  clear(): void {
    this.items.clear();
    this.states.clear();
    this.loadingQueue.clear();
    this.hoverListeners.clear();
  }

  /**
   * 手动触发预加载
   */
  async preload(id: string): Promise<void> {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`Preload item not found: ${id}`);
    }

    return this.loadImage(item);
  }

  /**
   * 批量预加载
   */
  async preloadBatch(ids: string[]): Promise<void> {
    const promises = ids.map(id => this.preload(id).catch(error => ({ id, error })));
    await Promise.allSettled(promises);
  }

  /**
   * 获取预加载状态
   */
  getState(id: string): PreloadState | undefined {
    return this.states.get(id);
  }

  /**
   * 获取所有状态
   */
  getAllStates(): PreloadState[] {
    return Array.from(this.states.values());
  }

  /**
   * 获取预加载统计
   */
  getStats(): PreloadStats {
    const states = this.getAllStates();
    const total = states.length;
    const loaded = states.filter(s => s.status === 'loaded').length;
    const failed = states.filter(s => s.status === 'error').length;
    const pending = states.filter(s => s.status === 'pending').length;
    const loading = states.filter(s => s.status === 'loading').length;

    // 计算平均加载时间
    const loadedStates = states.filter(s => s.status === 'loaded' && s.startTime && s.endTime);
    const averageLoadTime = loadedStates.length > 0 
      ? loadedStates.reduce((sum, s) => sum + (s.endTime! - s.startTime!), 0) / loadedStates.length
      : 0;

    return {
      total,
      loaded,
      failed,
      pending,
      loading,
      averageLoadTime,
      totalBytes: 0, // 需要从实际加载中获取
      cacheHitRate: 0 // 需要从CDN统计中获取
    };
  }

  /**
   * 设置最大并发数
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
  }

  /**
   * 执行预加载策略
   */
  private executeStrategy(item: PreloadItem): void {
    switch (item.strategy) {
      case 'immediate':
        this.scheduleLoad(item);
        break;
      case 'viewport':
        this.setupViewportPreload(item);
        break;
      case 'hover':
        this.setupHoverPreload(item);
        break;
      case 'idle':
        this.scheduleIdleLoad(item);
        break;
      case 'manual':
        // 手动触发，不自动执行
        break;
    }
  }

  /**
   * 调度加载
   */
  private scheduleLoad(item: PreloadItem): void {
    if (item.delay) {
      setTimeout(() => this.loadImage(item), item.delay);
    } else {
      this.loadImage(item);
    }
  }

  /**
   * 设置视口预加载
   */
  private setupViewportPreload(item: PreloadItem): void {
    // 这里需要与具体的DOM元素关联
    // 在实际使用中，可以通过data属性或其他方式关联
    const element = document.querySelector(`[data-preload-id="${item.id}"]`);
    if (element && this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * 设置hover预加载
   */
  private setupHoverPreload(item: PreloadItem): void {
    const element = document.querySelector(`[data-preload-id="${item.id}"]`);
    if (element) {
      const hoverHandler = () => this.loadImage(item);
      element.addEventListener('mouseenter', hoverHandler, { once: true });
      this.hoverListeners.set(item.id, hoverHandler);
    }
  }

  /**
   * 调度空闲时加载
   */
  private scheduleIdleLoad(item: PreloadItem): void {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.loadImage(item));
    } else {
      // 降级到setTimeout
      setTimeout(() => this.loadImage(item), 100);
    }
  }

  /**
   * 加载图片
   */
  private async loadImage(item: PreloadItem): Promise<void> {
    const state = this.states.get(item.id);
    if (!state || state.status === 'loaded' || state.status === 'loading') {
      return;
    }

    // 检查并发限制
    if (this.loadingQueue.size >= this.maxConcurrent) {
      // 等待队列有空位
      await this.waitForQueue();
    }

    // 检查条件
    if (item.condition && !item.condition()) {
      return;
    }

    this.loadingQueue.add(item.id);
    state.status = 'loading';
    state.startTime = Date.now();

    try {
      // 获取优化后的URL
      let imageUrl: string;
      if (item.preset) {
        imageUrl = cdnManager.getPresetUrl(item.src, item.preset);
      } else if (item.transforms) {
        imageUrl = cdnManager.generateUrl(item.src, item.transforms);
      } else {
        imageUrl = cdnManager.generateUrl(item.src);
      }

      // 预加载图片
      await cdnManager.preloadImage(imageUrl, this.getPriorityLevel(item.priority));

      state.status = 'loaded';
      state.endTime = Date.now();
      state.retryCount = 0;
      
      item.onLoad?.();
    } catch (error) {
      state.error = error as Error;
      
      // 重试逻辑
      if (state.retryCount < this.retryAttempts) {
        state.retryCount++;
        state.status = 'pending';
        
        setTimeout(() => {
          this.loadImage(item);
        }, this.retryDelay * state.retryCount);
      } else {
        state.status = 'error';
        item.onError?.(error as Error);
      }
    } finally {
      this.loadingQueue.delete(item.id);
    }
  }

  /**
   * 等待队列有空位
   */
  private async waitForQueue(): Promise<void> {
    return new Promise(resolve => {
      const checkQueue = () => {
        if (this.loadingQueue.size < this.maxConcurrent) {
          resolve();
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      checkQueue();
    });
  }

  /**
   * 获取优先级级别
   */
  private getPriorityLevel(priority: PreloadPriority): 'high' | 'low' {
    return priority === 'high' ? 'high' : 'low';
  }

  /**
   * 设置Intersection Observer
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const preloadId = entry.target.getAttribute('data-preload-id');
            if (preloadId) {
              const item = this.items.get(preloadId);
              if (item) {
                this.loadImage(item);
                this.intersectionObserver?.unobserve(entry.target);
              }
            }
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );
  }

  /**
   * 设置空闲回调
   */
  private setupIdleCallback(): void {
    if (typeof requestIdleCallback === 'undefined') return;

    const processIdleItems = () => {
      const idleItems = Array.from(this.items.values())
        .filter(item => item.strategy === 'idle')
        .filter(item => {
          const state = this.states.get(item.id);
          return state?.status === 'pending';
        });

      if (idleItems.length > 0) {
        const item = idleItems[0];
        this.loadImage(item);
      }

      this.idleCallback = requestIdleCallback(processIdleItems);
    };

    this.idleCallback = requestIdleCallback(processIdleItems);
  }

  /**
   * 移除hover监听器
   */
  private removeHoverListener(id: string): void {
    const handler = this.hoverListeners.get(id);
    if (handler) {
      const element = document.querySelector(`[data-preload-id="${id}"]`);
      if (element) {
        element.removeEventListener('mouseenter', handler);
      }
      this.hoverListeners.delete(id);
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.clear();
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    if (this.idleCallback) {
      cancelIdleCallback(this.idleCallback);
      this.idleCallback = null;
    }
  }
}

// 预设策略配置
export const PreloadStrategies = {
  // 关键图片立即加载
  critical: {
    strategy: 'immediate' as const,
    priority: 'high' as const
  },
  
  // 首屏图片
  aboveFold: {
    strategy: 'immediate' as const,
    priority: 'medium' as const,
    delay: 100
  },
  
  // 视口内图片
  inViewport: {
    strategy: 'viewport' as const,
    priority: 'medium' as const
  },
  
  // 悬停预加载
  onHover: {
    strategy: 'hover' as const,
    priority: 'low' as const
  },
  
  // 空闲时加载
  whenIdle: {
    strategy: 'idle' as const,
    priority: 'low' as const
  }
};

// 导出单例
export const preloadStrategy = new PreloadStrategy();

// 导出类型
export type {
  PreloadStrategy as PreloadStrategyType,
  PreloadItem,
  PreloadState,
  PreloadStats,
  PreloadPriority
};

export { PreloadStrategy };