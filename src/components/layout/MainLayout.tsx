import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuthStore } from '../../stores/auth';
import { useRoleGuard } from '../auth/RoleGuard';
import { cn } from '../../utils/common';

// 布局配置接口
export interface LayoutConfig {
  showHeader?: boolean;
  showSidebar?: boolean;
  showFooter?: boolean;
  headerProps?: {
    showMenuButton?: boolean;
    onMenuToggle?: () => void;
    className?: string;
  };
  sidebarProps?: {
    isOpen?: boolean;
    onClose?: () => void;
    className?: string;
  };
  footerProps?: {
    variant?: 'default' | 'minimal' | 'admin';
    className?: string;
  };
  containerClassName?: string;
  mainClassName?: string;
}

interface MainLayoutProps extends LayoutConfig {
  children?: React.ReactNode;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showHeader = true,
  showSidebar = false,
  showFooter = false,
  headerProps = {},
  sidebarProps = {},
  footerProps = {},
  containerClassName = 'min-h-screen bg-gray-50 dark:bg-gray-900',
  mainClassName = 'flex-1 overflow-auto',
  className
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // 合并默认props和传入的props
  const mergedHeaderProps = {
    showMenuButton: showSidebar,
    onMenuToggle: toggleSidebar,
    ...headerProps
  };

  const mergedSidebarProps = {
    isOpen: isSidebarOpen,
    onClose: closeSidebar,
    ...sidebarProps
  };

  const mergedFooterProps = {
    variant: 'default' as const,
    ...footerProps
  };

  return (
    <div className={cn(containerClassName, className)}>
      {/* 移动端遮罩 */}
      {isMobile && isSidebarOpen && showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className="flex h-full">
        {/* 侧边栏 */}
        {showSidebar && (
          <div className={cn(
            'fixed md:relative z-50 h-full',
            isMobile ? 'inset-y-0 left-0' : ''
          )}>
            <Sidebar 
              {...mergedSidebarProps}
              className={cn(
                'h-full',
                isMobile && !isSidebarOpen && 'hidden',
                mergedSidebarProps.className
              )}
            />
          </div>
        )}

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 头部导航 */}
          {showHeader && (
            <Header {...mergedHeaderProps} />
          )}

          {/* 主内容 */}
          <main className={cn(mainClassName)}>
            {children || <Outlet />}
          </main>

          {/* 底部 */}
          {showFooter && (
            <Footer {...mergedFooterProps} />
          )}
        </div>
      </div>
    </div>
  );
};

// 预设布局配置
export const LayoutPresets = {
  // 认证页面布局
  auth: {
    showHeader: false,
    showSidebar: false,
    showFooter: false,
    containerClassName: 'min-h-screen bg-gray-50 dark:bg-gray-900',
    mainClassName: 'flex flex-col justify-center py-12 sm:px-6 lg:px-8'
  } as LayoutConfig,

  // 管理后台布局
  admin: {
    showHeader: true,
    showSidebar: true,
    showFooter: false,
    containerClassName: 'min-h-screen bg-gray-50 dark:bg-gray-900',
    mainClassName: 'flex-1 overflow-auto p-6',
    headerProps: {
      showMenuButton: true
    }
  } as LayoutConfig,

  // 全屏布局（首页等）
  fullscreen: {
    showHeader: true,
    showSidebar: false,
    showFooter: true,
    containerClassName: 'min-h-screen bg-white dark:bg-gray-900',
    mainClassName: 'min-h-screen',
    headerProps: {
      showMenuButton: false
    },
    footerProps: {
      variant: 'minimal' as const
    }
  } as LayoutConfig,

  // 编辑器布局
  editor: {
    showHeader: true,
    showSidebar: false,
    showFooter: false,
    containerClassName: 'h-screen bg-white dark:bg-gray-900 flex flex-col',
    mainClassName: 'flex-1 overflow-hidden',
    headerProps: {
      showMenuButton: false
    }
  } as LayoutConfig,

  // 博客页面布局
  blog: {
    showHeader: true,
    showSidebar: false,
    showFooter: true,
    containerClassName: 'min-h-screen bg-white dark:bg-gray-900',
    mainClassName: 'flex-1 overflow-auto',
    headerProps: {
      showMenuButton: false
    },
    footerProps: {
      variant: 'default' as const
    }
  } as LayoutConfig
};

/**
 * 认证布局 - 用于登录、注册等页面
 */
export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MainLayout {...LayoutPresets.auth}>
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
    </MainLayout>
  );
};

/**
 * 编辑器布局 - 用于写作页面
 */
export const EditorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MainLayout {...LayoutPresets.editor}>
      {children}
    </MainLayout>
  );
};

/**
 * 管理后台布局 - 用于管理页面
 */
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MainLayout {...LayoutPresets.admin}>
      {children}
    </MainLayout>
  );
};

/**
 * 全屏布局 - 用于首页等需要全屏展示的页面
 */
export const FullscreenLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MainLayout {...LayoutPresets.fullscreen}>
      {children}
    </MainLayout>
  );
};

/**
 * 博客页面布局 - 用于博客文章页面
 */
export const BlogLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MainLayout {...LayoutPresets.blog}>
      {children}
    </MainLayout>
  );
};

export default MainLayout;