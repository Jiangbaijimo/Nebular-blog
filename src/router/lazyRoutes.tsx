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
const HomePage = React.lazy(() => import('../pages/home/HomePage'));
const BlogList = React.lazy(() => import('../pages/blog/BlogList'));
const BlogDetail = React.lazy(() => import('../pages/blog/BlogDetail'));
const BlogEditor = React.lazy(() => import('../pages/blog/BlogEditor'));

// 认证页面
const Login = React.lazy(() => import('../pages/auth/Login'));
const SimpleLogin = React.lazy(() => import('../pages/auth/SimpleLogin'));

// 系统设置页面
const SystemSetup = React.lazy(() => import('../pages/setup/SystemSetup'));

// 管理后台页面
const AdminLayout = React.lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const BlogManagement = React.lazy(() => import('../pages/admin/BlogManagement'));
const UserManagement = React.lazy(() => import('../pages/admin/UserManagement'));
const MediaLibrary = React.lazy(() => import('../pages/admin/MediaLibrary'));
const CloudFunctionManagement = React.lazy(() => import('../pages/admin/CloudFunctionManagement'));
const SystemSettings = React.lazy(() => import('../pages/admin/SystemSettings'));

// 用户页面
const UserProfile = React.lazy(() => import('../pages/user/UserProfile'));
const UserSettings = React.lazy(() => import('../pages/user/UserSettings'));

// 错误页面
const NotFound = React.lazy(() => import('../pages/error/NotFound'));
const ServerError = React.lazy(() => import('../pages/error/ServerError'));

// 路由预加载函数
export const preloadRoute = (routeName: string) => {
  switch (routeName) {
    case 'home':
      return import('../pages/home/HomePage');
    case 'blog-list':
      return import('../pages/blog/BlogList');
    case 'blog-detail':
      return import('../pages/blog/BlogDetail');
    case 'blog-editor':
      return import('../pages/blog/BlogEditor');
    case 'login':
      return import('../pages/auth/Login');

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
    case 'user-profile':
      return import('../pages/user/UserProfile');
    case 'user-settings':
      return import('../pages/user/UserSettings');
    default:
      return Promise.resolve();
  }
};

// 路由配置
export const lazyRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <LazyWrapper>
        <HomePage />
      </LazyWrapper>
    ),
  },
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
  {
    path: '/auth/login',
    element: (
      <LazyWrapper>
        <Login />
      </LazyWrapper>
    ),
  },

  {
    path: '/auth/simple-login',
    element: (
      <LazyWrapper>
        <SimpleLogin />
      </LazyWrapper>
    ),
  },
  {
    path: '/setup',
    element: (
      <LazyWrapper>
        <SystemSetup />
      </LazyWrapper>
    ),
  },
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
  {
    path: '/user/profile',
    element: (
      <LazyWrapper>
        <UserProfile />
      </LazyWrapper>
    ),
  },
  {
    path: '/user/settings',
    element: (
      <LazyWrapper>
        <UserSettings />
      </LazyWrapper>
    ),
  },
  {
    path: '/404',
    element: (
      <LazyWrapper>
        <NotFound />
      </LazyWrapper>
    ),
  },
  {
    path: '/500',
    element: (
      <LazyWrapper>
        <ServerError />
      </LazyWrapper>
    ),
  },
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