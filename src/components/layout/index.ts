// 主要布局组件
export { MainLayout, LayoutPresets } from './MainLayout';
export type { LayoutConfig } from './MainLayout';

// 预设布局组件
export { AuthLayout } from './MainLayout';
export { AdminLayout } from './MainLayout';
export { EditorLayout } from './MainLayout';
export { FullscreenLayout } from './MainLayout';
export { BlogLayout } from './MainLayout';

// 基础组件
export { default as Header } from './Header';
export { Sidebar } from './Sidebar';
export { Footer } from './Footer';

// 使用示例和文档
export const LayoutExamples = {
  // 自定义布局示例
  customLayout: {
    showHeader: true,
    showSidebar: true,
    showFooter: true,
    headerProps: {
      showMenuButton: true,
      className: 'custom-header'
    },
    sidebarProps: {
      className: 'custom-sidebar'
    },
    footerProps: {
      variant: 'default' as const,
      className: 'custom-footer'
    },
    containerClassName: 'min-h-screen bg-custom',
    mainClassName: 'flex-1 p-4'
  },

  // 最小化布局示例
  minimalLayout: {
    showHeader: false,
    showSidebar: false,
    showFooter: false,
    containerClassName: 'min-h-screen bg-white',
    mainClassName: 'p-8'
  }
};