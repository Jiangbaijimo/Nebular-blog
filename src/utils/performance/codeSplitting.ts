import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { RouteObject } from 'react-router-dom';

// 代码分割配置
interface CodeSplittingConfig {
  retryCount: number;
  retryDelay: number;
  timeout: number;
  enablePreload: boolean;
  preloadDelay: number;
  chunkLoadTimeout: number;
}

const defaultConfig: CodeSplittingConfig = {
  retryCount: 3,
  retryDelay: 1000,
  timeout: 10000,
  enablePreload: boolean,
  preloadDelay: 2000,
  chunkLoadTimeout: 30000,
};

// 懒加载组件工厂
class LazyComponentFactory {
  private config: CodeSplittingConfig;
  private loadingComponents = new Map<string, Promise<any>>();
  private loadedComponents = new Map<string, ComponentType<any>>();
  private failedComponents = new Set<string>();
  private preloadQueue = new Set<string>();

  constructor(config: Partial<CodeSplittingConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // 创建懒加载组件
  createLazyComponent<T = any>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    componentName: string,
    options: {
      fallback?: ComponentType;
      errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
      preload?: boolean;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): LazyExoticComponent<ComponentType<T>> {
    const { fallback, errorBoundary, preload = false, priority = 'medium' } = options;

    // 包装导入函数以添加重试逻辑
    const wrappedImportFn = this.createRetryableImport(importFn, componentName);

    // 创建懒加载组件
    const LazyComponent = lazy(wrappedImportFn);

    // 如果需要预加载
    if (preload) {
      this.schedulePreload(componentName, wrappedImportFn, priority);
    }

    return LazyComponent;
  }

  // 创建可重试的导入函数
  private createRetryableImport<T>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    componentName: string
  ) {
    return async (): Promise<{ default: ComponentType<T> }> => {
      // 检查是否已经加载
      if (this.loadedComponents.has(componentName)) {
        return { default: this.loadedComponents.get(componentName)! };
      }

      // 检查是否正在加载
      if (this.loadingComponents.has(componentName)) {
        return this.loadingComponents.get(componentName)!;
      }

      // 检查是否加载失败
      if (this.failedComponents.has(componentName)) {
        throw new Error(`Component ${componentName} failed to load`);
      }

      // 创建加载 Promise
      const loadPromise = this.loadWithRetry(importFn, componentName);
      this.loadingComponents.set(componentName, loadPromise);

      try {
        const result = await loadPromise;
        this.loadedComponents.set(componentName, result.default);
        this.loadingComponents.delete(componentName);
        return result;
      } catch (error) {
        this.loadingComponents.delete(componentName);
        this.failedComponents.add(componentName);
        throw error;
      }
    };
  }

  // 带重试的加载
  private async loadWithRetry<T>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    componentName: string,
    attempt = 1
  ): Promise<{ default: ComponentType<T> }> {
    try {
      // 设置超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Component ${componentName} load timeout`));
        }, this.config.timeout);
      });

      const result = await Promise.race([importFn(), timeoutPromise]);
      
      console.log(`✅ Component ${componentName} loaded successfully (attempt ${attempt})`);
      return result;
    } catch (error) {
      console.warn(`❌ Component ${componentName} load failed (attempt ${attempt}):`, error);

      if (attempt < this.config.retryCount) {
        console.log(`🔄 Retrying ${componentName} in ${this.config.retryDelay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        return this.loadWithRetry(importFn, componentName, attempt + 1);
      }

      throw new Error(`Failed to load component ${componentName} after ${this.config.retryCount} attempts`);
    }
  }

  // 调度预加载
  private schedulePreload<T>(
    componentName: string,
    importFn: () => Promise<{ default: ComponentType<T> }>,
    priority: 'high' | 'medium' | 'low'
  ) {
    if (this.preloadQueue.has(componentName)) return;

    this.preloadQueue.add(componentName);

    const delay = {
      high: 0,
      medium: this.config.preloadDelay,
      low: this.config.preloadDelay * 2,
    }[priority];

    setTimeout(() => {
      this.preloadComponent(componentName, importFn);
    }, delay);
  }

  // 预加载组件
  async preloadComponent<T>(
    componentName: string,
    importFn: () => Promise<{ default: ComponentType<T> }>
  ): Promise<void> {
    if (this.loadedComponents.has(componentName) || this.loadingComponents.has(componentName)) {
      return;
    }

    try {
      console.log(`🚀 Preloading component: ${componentName}`);
      const result = await this.loadWithRetry(importFn, componentName);
      this.loadedComponents.set(componentName, result.default);
      console.log(`✅ Component ${componentName} preloaded successfully`);
    } catch (error) {
      console.warn(`❌ Failed to preload component ${componentName}:`, error);
      this.failedComponents.add(componentName);
    } finally {
      this.preloadQueue.delete(componentName);
    }
  }

  // 批量预加载
  async preloadComponents(components: Array<{
    name: string;
    importFn: () => Promise<{ default: ComponentType<any> }>;
    priority?: 'high' | 'medium' | 'low';
  }>): Promise<void> {
    const sortedComponents = components.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
    });

    for (const component of sortedComponents) {
      await this.preloadComponent(component.name, component.importFn);
    }
  }

  // 获取加载统计
  getStats() {
    return {
      loaded: this.loadedComponents.size,
      loading: this.loadingComponents.size,
      failed: this.failedComponents.size,
      preloading: this.preloadQueue.size,
      components: {
        loaded: Array.from(this.loadedComponents.keys()),
        loading: Array.from(this.loadingComponents.keys()),
        failed: Array.from(this.failedComponents),
        preloading: Array.from(this.preloadQueue),
      },
    };
  }

  // 清理失败的组件
  retryFailedComponents() {
    const failedComponents = Array.from(this.failedComponents);
    this.failedComponents.clear();
    console.log(`🔄 Retrying ${failedComponents.length} failed components`);
    return failedComponents;
  }

  // 清理缓存
  clearCache() {
    this.loadingComponents.clear();
    this.loadedComponents.clear();
    this.failedComponents.clear();
    this.preloadQueue.clear();
  }
}

// 全局懒加载工厂实例
export const lazyFactory = new LazyComponentFactory();

// 路由懒加载管理器
class RouteLazyLoader {
  private routeComponents = new Map<string, () => Promise<any>>();
  private preloadedRoutes = new Set<string>();
  private currentRoute = '';

  // 注册路由组件
  registerRoute(path: string, importFn: () => Promise<any>) {
    this.routeComponents.set(path, importFn);
  }

  // 预加载路由
  async preloadRoute(path: string): Promise<void> {
    if (this.preloadedRoutes.has(path)) return;

    const importFn = this.routeComponents.get(path);
    if (!importFn) {
      console.warn(`Route ${path} not found`);
      return;
    }

    try {
      console.log(`🚀 Preloading route: ${path}`);
      await importFn();
      this.preloadedRoutes.add(path);
      console.log(`✅ Route ${path} preloaded successfully`);
    } catch (error) {
      console.warn(`❌ Failed to preload route ${path}:`, error);
    }
  }

  // 预加载相关路由
  async preloadRelatedRoutes(currentPath: string): Promise<void> {
    this.currentRoute = currentPath;

    // 预加载策略：根据当前路由预测可能访问的路由
    const relatedRoutes = this.getRelatedRoutes(currentPath);
    
    for (const route of relatedRoutes) {
      await this.preloadRoute(route);
    }
  }

  // 获取相关路由
  private getRelatedRoutes(currentPath: string): string[] {
    const routes: string[] = [];

    // 基于路由层级的预测
    if (currentPath === '/') {
      routes.push('/blog', '/about', '/auth/login');
    } else if (currentPath.startsWith('/blog')) {
      routes.push('/blog/create', '/blog/categories', '/admin');
    } else if (currentPath.startsWith('/admin')) {
      routes.push('/admin/posts', '/admin/media', '/admin/settings');
    } else if (currentPath.startsWith('/auth')) {
      routes.push('/dashboard', '/profile');
    }

    return routes.filter(route => this.routeComponents.has(route));
  }

  // 智能预加载
  enableSmartPreloading() {
    // 监听鼠标悬停事件
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const path = new URL(link.href).pathname;
        if (this.routeComponents.has(path)) {
          this.preloadRoute(path);
        }
      }
    });

    // 监听触摸开始事件（移动设备）
    document.addEventListener('touchstart', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const path = new URL(link.href).pathname;
        if (this.routeComponents.has(path)) {
          this.preloadRoute(path);
        }
      }
    });

    // 监听空闲时间
    if ('requestIdleCallback' in window) {
      const preloadOnIdle = () => {
        requestIdleCallback(() => {
          const unpreloadedRoutes = Array.from(this.routeComponents.keys())
            .filter(route => !this.preloadedRoutes.has(route));
          
          if (unpreloadedRoutes.length > 0) {
            this.preloadRoute(unpreloadedRoutes[0]);
            preloadOnIdle();
          }
        });
      };
      preloadOnIdle();
    }
  }

  // 获取预加载统计
  getPreloadStats() {
    return {
      total: this.routeComponents.size,
      preloaded: this.preloadedRoutes.size,
      remaining: this.routeComponents.size - this.preloadedRoutes.size,
      currentRoute: this.currentRoute,
      routes: {
        all: Array.from(this.routeComponents.keys()),
        preloaded: Array.from(this.preloadedRoutes),
      },
    };
  }
}

// 全局路由懒加载管理器
export const routeLazyLoader = new RouteLazyLoader();

// Webpack 魔法注释助手
export const createChunkName = (name: string, group?: string) => {
  const chunkName = group ? `${group}-${name}` : name;
  return `/* webpackChunkName: "${chunkName}" */`;
};

// 创建带预加载的懒加载组件
export const createLazyComponent = <T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string,
  options?: {
    fallback?: ComponentType;
    errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
    preload?: boolean;
    priority?: 'high' | 'medium' | 'low';
    chunkName?: string;
    group?: string;
  }
) => {
  const { chunkName, group, ...lazyOptions } = options || {};
  
  // 如果提供了 chunk 名称，包装导入函数
  const wrappedImportFn = chunkName || group
    ? () => import(createChunkName(chunkName || componentName, group) + importFn.toString().match(/import\(['"](.*?)['"]\)/)?.[1] || '')
    : importFn;

  return lazyFactory.createLazyComponent(
    wrappedImportFn as () => Promise<{ default: ComponentType<T> }>,
    componentName,
    lazyOptions
  );
};

// 创建路由懒加载配置
export const createLazyRoute = (
  path: string,
  importFn: () => Promise<{ default: ComponentType<any> }>,
  options?: {
    preload?: boolean;
    priority?: 'high' | 'medium' | 'low';
    chunkName?: string;
    group?: string;
  }
): RouteObject => {
  const { preload = false, priority = 'medium', chunkName, group } = options || {};
  
  // 注册路由到懒加载管理器
  routeLazyLoader.registerRoute(path, importFn);
  
  // 创建懒加载组件
  const LazyComponent = createLazyComponent(
    importFn,
    `route-${path.replace(/\//g, '-')}`,
    {
      preload,
      priority,
      chunkName: chunkName || `route-${path.replace(/\//g, '-')}`,
      group: group || 'routes',
    }
  );

  return {
    path,
    element: LazyComponent,
  };
};

// 性能监控
class CodeSplittingMonitor {
  private loadTimes = new Map<string, number>();
  private chunkSizes = new Map<string, number>();
  private errors = new Map<string, Error[]>();

  // 记录加载时间
  recordLoadTime(componentName: string, loadTime: number) {
    this.loadTimes.set(componentName, loadTime);
  }

  // 记录 chunk 大小
  recordChunkSize(chunkName: string, size: number) {
    this.chunkSizes.set(chunkName, size);
  }

  // 记录错误
  recordError(componentName: string, error: Error) {
    const errors = this.errors.get(componentName) || [];
    errors.push(error);
    this.errors.set(componentName, errors);
  }

  // 获取性能报告
  getPerformanceReport() {
    const avgLoadTime = Array.from(this.loadTimes.values())
      .reduce((sum, time) => sum + time, 0) / this.loadTimes.size;

    const totalChunkSize = Array.from(this.chunkSizes.values())
      .reduce((sum, size) => sum + size, 0);

    const errorRate = this.errors.size / (this.loadTimes.size + this.errors.size);

    return {
      avgLoadTime: avgLoadTime || 0,
      totalChunkSize,
      errorRate,
      slowestComponents: Array.from(this.loadTimes.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      largestChunks: Array.from(this.chunkSizes.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      errorComponents: Array.from(this.errors.keys()),
    };
  }

  // 清理数据
  clear() {
    this.loadTimes.clear();
    this.chunkSizes.clear();
    this.errors.clear();
  }
}

export const codeSplittingMonitor = new CodeSplittingMonitor();

// 导出类型
export type {
  CodeSplittingConfig,
  LazyComponentFactory,
  RouteLazyLoader,
  CodeSplittingMonitor,
};