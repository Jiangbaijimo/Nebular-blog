import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import Loading from '../components/ui/Loading';

// 懒加载组件包装器
const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

// 懒加载页面组件
// 首页
const HomePage = React.lazy(() => import('../pages/home/HomePage'));

// 博客页面
const BlogList = React.lazy(() => import('../pages/blog/BlogList'));
const BlogDetail = React.lazy(() => import('../pages/blog/BlogDetail'));
const BlogEditor = React.lazy(() => import('../pages/blog/BlogEditor'));

// 认证页面
const Login = React.lazy(() => import('../pages/auth/login'));
const OAuthCallback = React.lazy(() => import('../pages/auth/oauthcallback'));

// 管理后台页面
const AdminLayout = React.lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const BlogManagement = React.lazy(() => import('../pages/admin/BlogManagement'));
const UserManagement = React.lazy(() => import('../pages/admin/UserManagement'));
const MediaLibrary = React.lazy(() => import('../pages/admin/MediaLibrary'));
const CloudFunctionManagement = React.lazy(() => import('../pages/admin/CloudFunctionManagement'));
const SystemSettings = React.lazy(() => import('../pages/admin/SystemSettings'));

// 简单的404页面组件
const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">页面未找到</p>
      <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        返回首页
      </a>
    </div>
  </div>
);

// 路由预加载函数
export const preloadRoute = (routeName: string) => {
  switch (routeName) {
    // 首页
    case 'home':
      return import('../pages/home/HomePage');
    
    // 博客相关
    case 'blog-list':
      return import('../pages/blog/BlogList');
    case 'blog-detail':
      return import('../pages/blog/BlogDetail');
    case 'blog-editor':
      return import('../pages/blog/BlogEditor');
    
    // 认证相关
    case 'login':
      return import('../pages/auth/login');
    case 'oauth-callback':
      return import('../pages/auth/oauthcallback');
    
    // 管理后台
    case 'admin':
      return import('../pages/admin/AdminLayout');
    case 'admin-dashboard':
      return import('../pages/admin/AdminDashboard');
    case 'blog-management':
      return import('../pages/admin/BlogManagement');
    case 'user-management':
      return import('../pages/admin/UserManagement');
    case 'media-library':
      return import('../pages/admin/MediaLibrary');
    case 'cloud-functions':
      return import('../pages/admin/CloudFunctionManagement');
    case 'system-settings':
      return import('../pages/admin/SystemSettings');
    
    default:
      return Promise.resolve();
  }
};

// 路由配置
export const lazyRoutes: RouteObject[] = [
  // 首页路由 (/)
  {
    path: '/',
    element: (
      <LazyWrapper>
        <HomePage />
      </LazyWrapper>
    ),
  },
  
  // 博客相关路由 (/blog)
  {
    path: '/blog',
    element: (
      <LazyWrapper>
        <BlogList />
      </LazyWrapper>
    ),
  },
  {
    path: '/blog/:id',
    element: (
      <LazyWrapper>
        <BlogDetail />
      </LazyWrapper>
    ),
  },
  {
    path: '/editor',
    element: (
      <LazyWrapper>
        <BlogEditor />
      </LazyWrapper>
    ),
  },
  {
    path: '/editor/:id',
    element: (
      <LazyWrapper>
        <BlogEditor />
      </LazyWrapper>
    ),
  },
  
  // 认证相关路由 (/auth)
  {
    path: '/auth/login',
    element: (
      <LazyWrapper>
        <Login />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <LazyWrapper>
        <OAuthCallback />
      </LazyWrapper>
    ),
  },
  
  // 管理后台路由 (/admin)
  {
    path: '/admin',
    element: (
      <LazyWrapper>
        <AdminLayout />
      </LazyWrapper>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyWrapper>
            <AdminDashboard />
          </LazyWrapper>
        ),
      },
      {
        path: 'blogs',
        element: (
          <LazyWrapper>
            <BlogManagement />
          </LazyWrapper>
        ),
      },
      {
        path: 'users',
        element: (
          <LazyWrapper>
            <UserManagement />
          </LazyWrapper>
        ),
      },
      {
        path: 'media',
        element: (
          <LazyWrapper>
            <MediaLibrary />
          </LazyWrapper>
        ),
      },
      {
        path: 'functions',
        element: (
          <LazyWrapper>
            <CloudFunctionManagement />
          </LazyWrapper>
        ),
      },
      {
        path: 'settings',
        element: (
          <LazyWrapper>
            <SystemSettings />
          </LazyWrapper>
        ),
      },
    ],
  },
  
  // 404错误页面
  {
    path: '/404',
    element: (
      <LazyWrapper>
        <NotFound />
      </LazyWrapper>
    ),
  },
  
  // 通配符路由，必须放在最后
  {
    path: '*',
    element: (
      <LazyWrapper>
        <NotFound />
      </LazyWrapper>
    ),
  },
];

// 路由预加载策略
export class RoutePreloader {
  private static preloadedRoutes = new Set<string>();
  private static preloadPromises = new Map<string, Promise<any>>();

  // 预加载单个路由
  static async preload(routeName: string): Promise<void> {
    if (this.preloadedRoutes.has(routeName)) {
      return;
    }

    if (this.preloadPromises.has(routeName)) {
      await this.preloadPromises.get(routeName);
      return;
    }

    const preloadPromise = preloadRoute(routeName);
    this.preloadPromises.set(routeName, preloadPromise);

    try {
      await preloadPromise;
      this.preloadedRoutes.add(routeName);
      console.log(`路由 ${routeName} 预加载完成`);
    } catch (error) {
      console.error(`路由 ${routeName} 预加载失败:`, error);
    } finally {
      this.preloadPromises.delete(routeName);
    }
  }

  // 批量预加载路由
  static async preloadMultiple(routeNames: string[]): Promise<void> {
    const promises = routeNames.map(routeName => this.preload(routeName));
    await Promise.allSettled(promises);
  }

  // 预加载关键路由（应用启动时）
  static async preloadCriticalRoutes(): Promise<void> {
    const criticalRoutes = ['home', 'blog-list', 'login'];
    await this.preloadMultiple(criticalRoutes);
  }

  // 预加载用户可能访问的路由（基于当前路由）
  static async preloadLikelyRoutes(currentRoute: string): Promise<void> {
    const routeMap: Record<string, string[]> = {
      'home': ['blog-list', 'blog-editor', 'login'],
      'blog-list': ['blog-detail', 'blog-editor'],
      'blog-detail': ['blog-list', 'blog-editor'],
      'blog-editor': ['blog-list', 'media-library'],
      'login': ['home'],
      'admin-dashboard': ['blog-management', 'user-management', 'media-library'],
      'blog-management': ['blog-editor', 'media-library'],
      'user-management': ['user-profile'],
      'media-library': ['blog-editor', 'blog-management'],
    };

    const likelyRoutes = routeMap[currentRoute] || [];
    if (likelyRoutes.length > 0) {
      // 延迟预加载，避免影响当前页面性能
      setTimeout(() => {
        this.preloadMultiple(likelyRoutes);
      }, 1000);
    }
  }

  // 鼠标悬停预加载
  static setupHoverPreload(): void {
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[data-preload]');
      
      if (link) {
        const routeName = link.getAttribute('data-preload');
        if (routeName) {
          this.preload(routeName);
        }
      }
    });
  }

  // 获取预加载状态
  static getPreloadStatus(): {
    preloaded: string[];
    loading: string[];
  } {
    return {
      preloaded: Array.from(this.preloadedRoutes),
      loading: Array.from(this.preloadPromises.keys()),
    };
  }

  // 清理预加载缓存
  static clearCache(): void {
    this.preloadedRoutes.clear();
    this.preloadPromises.clear();
  }
}

// 路由性能监控
export class RoutePerformanceMonitor {
  private static navigationTimes = new Map<string, number[]>();
  private static currentNavigationStart: number | null = null;

  // 开始导航计时
  static startNavigation(): void {
    this.currentNavigationStart = performance.now();
  }

  // 结束导航计时
  static endNavigation(routeName: string): void {
    if (this.currentNavigationStart) {
      const duration = performance.now() - this.currentNavigationStart;
      
      if (!this.navigationTimes.has(routeName)) {
        this.navigationTimes.set(routeName, []);
      }
      
      const times = this.navigationTimes.get(routeName)!;
      times.push(duration);
      
      // 只保留最近10次记录
      if (times.length > 10) {
        times.shift();
      }
      
      console.log(`路由 ${routeName} 导航耗时: ${duration.toFixed(2)}ms`);
      this.currentNavigationStart = null;
    }
  }

  // 获取路由性能统计
  static getPerformanceStats(routeName: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const times = this.navigationTimes.get(routeName);
    if (!times || times.length === 0) {
      return null;
    }

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return {
      average: Number(average.toFixed(2)),
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      count: times.length,
    };
  }

  // 获取所有路由性能统计
  static getAllPerformanceStats(): Record<string, ReturnType<typeof RoutePerformanceMonitor.getPerformanceStats>> {
    const stats: Record<string, any> = {};
    
    for (const routeName of this.navigationTimes.keys()) {
      stats[routeName] = this.getPerformanceStats(routeName);
    }
    
    return stats;
  }

  // 检测慢速路由
  static getSlowRoutes(threshold = 1000): string[] {
    const slowRoutes: string[] = [];
    
    for (const [routeName, times] of this.navigationTimes.entries()) {
      if (times.length > 0) {
        const average = times.reduce((sum, time) => sum + time, 0) / times.length;
        if (average > threshold) {
          slowRoutes.push(routeName);
        }
      }
    }
    
    return slowRoutes;
  }
}

// 导出默认配置
export default {
  routes: lazyRoutes,
  preloader: RoutePreloader,
  monitor: RoutePerformanceMonitor,
};