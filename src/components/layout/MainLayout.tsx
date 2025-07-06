import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuthStore } from '../../stores/auth';
import { useRoleGuard } from '../auth/RoleGuard';
import { cn } from '../../utils/common';

interface MainLayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
  footerVariant?: 'default' | 'minimal' | 'admin';
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showSidebar = true,
  showFooter = true,
  footerVariant = 'default',
  className
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useRoleGuard();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 根据路由决定布局配置
  const getLayoutConfig = () => {
    const path = location.pathname;
    
    // 认证页面
    if (path.startsWith('/auth/')) {
      return {
        showSidebar: false,
        showFooter: false,
        containerClass: 'min-h-screen bg-gray-50 dark:bg-gray-900'
      };
    }
    
    // 管理后台
    if (path.startsWith('/admin/')) {
      return {
        showSidebar: true,
        showFooter: true,
        footerVariant: 'admin' as const,
        containerClass: 'min-h-screen bg-gray-50 dark:bg-gray-900'
      };
    }
    
    // 编辑器页面
    if (path.startsWith('/editor')) {
      return {
        showSidebar: false,
        showFooter: false,
        containerClass: 'h-screen bg-white dark:bg-gray-900'
      };
    }
    
    // 首页
    if (path === '/') {
      return {
        showSidebar: false,
        showFooter: true,
        footerVariant: 'default' as const,
        containerClass: 'min-h-screen bg-white dark:bg-gray-900'
      };
    }
    
    // 默认布局
    return {
      showSidebar: isAuthenticated,
      showFooter: true,
      footerVariant: 'default' as const,
      containerClass: 'min-h-screen bg-gray-50 dark:bg-gray-900'
    };
  };

  const layoutConfig = getLayoutConfig();
  const shouldShowSidebar = showSidebar && layoutConfig.showSidebar;
  const shouldShowFooter = showFooter && layoutConfig.showFooter;
  const currentFooterVariant = footerVariant || layoutConfig.footerVariant;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={cn(layoutConfig.containerClass, className)}>
      {/* 移动端遮罩 */}
      {isMobile && isSidebarOpen && shouldShowSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className="flex h-full">
        {/* 侧边栏 */}
        {shouldShowSidebar && (
          <div className={cn(
            'fixed md:relative z-50 h-full',
            isMobile ? 'inset-y-0 left-0' : ''
          )}>
            <Sidebar 
              isOpen={isSidebarOpen}
              onClose={closeSidebar}
              className={cn(
                'h-full',
                isMobile && !isSidebarOpen && 'hidden'
              )}
            />
          </div>
        )}

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 头部导航 */}
          <Header 
            onMenuToggle={toggleSidebar}
            showMenuButton={shouldShowSidebar}
          />

          {/* 主内容 */}
          <main className="flex-1 overflow-auto">
            {children || <Outlet />}
          </main>

          {/* 底部 */}
          {shouldShowFooter && (
            <Footer variant={currentFooterVariant} />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 认证布局 - 用于登录、注册等页面
 */
export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          博客系统
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          基于 Tauri 的高性能博客平台
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * 编辑器布局 - 用于写作页面
 */
export const EditorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* 编辑器头部 */}
      <Header showMenuButton={false} />
      
      {/* 编辑器主体 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

/**
 * 管理后台布局 - 用于管理页面
 */
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 移动端遮罩 */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className="flex h-screen">
        {/* 管理侧边栏 */}
        <div className={cn(
          'fixed md:relative z-50 h-full',
          isMobile ? 'inset-y-0 left-0' : ''
        )}>
          <Sidebar 
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
            className={cn(
              'h-full',
              isMobile && !isSidebarOpen && 'hidden'
            )}
          />
        </div>

        {/* 管理主内容 */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            onMenuToggle={toggleSidebar}
            showMenuButton={true}
          />
          
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
          
          <Footer variant="admin" />
        </div>
      </div>
    </div>
  );
};

/**
 * 全屏布局 - 用于首页等需要全屏展示的页面
 */
export const FullscreenLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header showMenuButton={false} />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer variant="minimal" />
    </div>
  );
};

export default MainLayout;