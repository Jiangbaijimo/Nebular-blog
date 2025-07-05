/**
 * UI状态管理
 * 管理界面状态、主题、布局、通知等
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ==================== 类型定义 ====================

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * 语言类型
 */
export type Language = 'zh-CN' | 'en-US' | 'ja-JP';

/**
 * 布局类型
 */
export type Layout = 'default' | 'compact' | 'wide';

/**
 * 侧边栏状态
 */
export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

/**
 * 通知类型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 通知位置
 */
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

/**
 * 模态框类型
 */
export type ModalType = 'confirm' | 'alert' | 'prompt' | 'custom';

/**
 * 加载状态
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

/**
 * 通知项
 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  timestamp: number;
}

/**
 * 模态框配置
 */
export interface ModalConfig {
  id: string;
  type: ModalType;
  title: string;
  content?: string;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  maskClosable?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * 面包屑项
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

/**
 * UI状态接口
 */
export interface UIState {
  // 主题和外观
  theme: Theme;
  language: Language;
  layout: Layout;
  fontSize: number;
  
  // 布局状态
  sidebar: {
    state: SidebarState;
    width: number;
    pinned: boolean;
  };
  
  header: {
    visible: boolean;
    height: number;
    fixed: boolean;
  };
  
  footer: {
    visible: boolean;
    height: number;
  };
  
  // 页面状态
  currentPage: string;
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
  
  // 加载状态
  globalLoading: LoadingState;
  pageLoading: Map<string, LoadingState>;
  
  // 通知系统
  notifications: NotificationItem[];
  notificationPosition: NotificationPosition;
  maxNotifications: number;
  
  // 模态框系统
  modals: ModalConfig[];
  
  // 交互状态
  isFullscreen: boolean;
  isOnline: boolean;
  
  // 快捷键
  shortcuts: Map<string, ShortcutConfig>;
  shortcutsEnabled: boolean;
  
  // 用户偏好
  preferences: {
    animations: boolean;
    sounds: boolean;
    autoSave: boolean;
    compactMode: boolean;
    showTooltips: boolean;
    confirmBeforeExit: boolean;
  };
  
  // 开发者工具
  devMode: boolean;
  debugInfo: boolean;
}

/**
 * UI操作接口
 */
export interface UIActions {
  // 主题和外观
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setLayout: (layout: Layout) => void;
  setFontSize: (size: number) => void;
  
  // 布局控制
  toggleSidebar: () => void;
  setSidebarState: (state: SidebarState) => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebarPin: () => void;
  
  setHeaderVisible: (visible: boolean) => void;
  setHeaderFixed: (fixed: boolean) => void;
  setFooterVisible: (visible: boolean) => void;
  
  // 页面管理
  setCurrentPage: (page: string) => void;
  setPageTitle: (title: string) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  
  // 加载状态
  setGlobalLoading: (loading: boolean, message?: string, progress?: number) => void;
  setPageLoading: (page: string, loading: boolean, message?: string, progress?: number) => void;
  clearPageLoading: (page: string) => void;
  
  // 通知系统
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setNotificationPosition: (position: NotificationPosition) => void;
  
  // 便捷通知方法
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
  
  // 模态框系统
  openModal: (config: Omit<ModalConfig, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // 便捷模态框方法
  showConfirm: (title: string, content: string, onConfirm?: () => void) => string;
  showAlert: (title: string, content: string) => string;
  showPrompt: (title: string, defaultValue?: string) => Promise<string | null>;
  
  // 交互状态
  toggleFullscreen: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
  
  // 快捷键管理
  registerShortcut: (config: ShortcutConfig) => void;
  unregisterShortcut: (key: string) => void;
  toggleShortcuts: () => void;
  
  // 用户偏好
  updatePreferences: (preferences: Partial<UIState['preferences']>) => void;
  resetPreferences: () => void;
  
  // 开发者工具
  toggleDevMode: () => void;
  toggleDebugInfo: () => void;
  
  // 重置状态
  reset: () => void;
}

// ==================== 默认状态 ====================

const defaultPreferences: UIState['preferences'] = {
  animations: true,
  sounds: false,
  autoSave: true,
  compactMode: false,
  showTooltips: true,
  confirmBeforeExit: true
};

const initialUIState: UIState = {
  theme: 'auto',
  language: 'zh-CN',
  layout: 'default',
  fontSize: 14,
  
  sidebar: {
    state: 'expanded',
    width: 280,
    pinned: true
  },
  
  header: {
    visible: true,
    height: 64,
    fixed: true
  },
  
  footer: {
    visible: true,
    height: 48
  },
  
  currentPage: '',
  pageTitle: '',
  breadcrumbs: [],
  
  globalLoading: {
    isLoading: false
  },
  pageLoading: new Map(),
  
  notifications: [],
  notificationPosition: 'top-right',
  maxNotifications: 5,
  
  modals: [],
  
  isFullscreen: false,
  isOnline: navigator.onLine,
  
  shortcuts: new Map(),
  shortcutsEnabled: true,
  
  preferences: defaultPreferences,
  
  devMode: false,
  debugInfo: false
};

// ==================== 工具函数 ====================

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 格式化快捷键
 */
const formatShortcutKey = (config: ShortcutConfig): string => {
  const parts: string[] = [];
  
  if (config.ctrl) parts.push('Ctrl');
  if (config.alt) parts.push('Alt');
  if (config.shift) parts.push('Shift');
  if (config.meta) parts.push('Meta');
  
  parts.push(config.key.toUpperCase());
  
  return parts.join('+');
};

/**
 * 检查快捷键匹配
 */
const matchesShortcut = (event: KeyboardEvent, config: ShortcutConfig): boolean => {
  return (
    event.key.toLowerCase() === config.key.toLowerCase() &&
    !!event.ctrlKey === !!config.ctrl &&
    !!event.altKey === !!config.alt &&
    !!event.shiftKey === !!config.shift &&
    !!event.metaKey === !!config.meta
  );
};

// ==================== UI Store ====================

export const useUIStore = create<UIState & UIActions>()()
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialUIState,

          // 设置主题
          setTheme: (theme) => {
            set((state) => {
              state.theme = theme;
            });
            
            // 应用主题到DOM
            if (typeof document !== 'undefined') {
              const root = document.documentElement;
              
              if (theme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
              } else {
                root.setAttribute('data-theme', theme);
              }
            }
          },

          // 设置语言
          setLanguage: (language) => {
            set((state) => {
              state.language = language;
            });
            
            // 触发语言变更事件
            window.dispatchEvent(new CustomEvent('language-changed', {
              detail: { language }
            }));
          },

          // 设置布局
          setLayout: (layout) => {
            set((state) => {
              state.layout = layout;
            });
          },

          // 设置字体大小
          setFontSize: (size) => {
            set((state) => {
              state.fontSize = Math.max(12, Math.min(24, size));
            });
            
            // 应用字体大小到DOM
            if (typeof document !== 'undefined') {
              document.documentElement.style.fontSize = `${get().fontSize}px`;
            }
          },

          // 切换侧边栏
          toggleSidebar: () => {
            set((state) => {
              const currentState = state.sidebar.state;
              
              if (currentState === 'expanded') {
                state.sidebar.state = 'collapsed';
              } else if (currentState === 'collapsed') {
                state.sidebar.state = 'expanded';
              } else {
                state.sidebar.state = 'expanded';
              }
            });
          },

          // 设置侧边栏状态
          setSidebarState: (sidebarState) => {
            set((state) => {
              state.sidebar.state = sidebarState;
            });
          },

          // 设置侧边栏宽度
          setSidebarWidth: (width) => {
            set((state) => {
              state.sidebar.width = Math.max(200, Math.min(500, width));
            });
          },

          // 切换侧边栏固定
          toggleSidebarPin: () => {
            set((state) => {
              state.sidebar.pinned = !state.sidebar.pinned;
            });
          },

          // 设置头部可见性
          setHeaderVisible: (visible) => {
            set((state) => {
              state.header.visible = visible;
            });
          },

          // 设置头部固定
          setHeaderFixed: (fixed) => {
            set((state) => {
              state.header.fixed = fixed;
            });
          },

          // 设置底部可见性
          setFooterVisible: (visible) => {
            set((state) => {
              state.footer.visible = visible;
            });
          },

          // 设置当前页面
          setCurrentPage: (page) => {
            set((state) => {
              state.currentPage = page;
            });
          },

          // 设置页面标题
          setPageTitle: (title) => {
            set((state) => {
              state.pageTitle = title;
            });
            
            // 更新文档标题
            if (typeof document !== 'undefined') {
              document.title = title ? `${title} - Blog` : 'Blog';
            }
          },

          // 设置面包屑
          setBreadcrumbs: (breadcrumbs) => {
            set((state) => {
              state.breadcrumbs = breadcrumbs;
            });
          },

          // 添加面包屑
          addBreadcrumb: (item) => {
            set((state) => {
              state.breadcrumbs.push(item);
            });
          },

          // 设置全局加载状态
          setGlobalLoading: (loading, message, progress) => {
            set((state) => {
              state.globalLoading = {
                isLoading: loading,
                message,
                progress
              };
            });
          },

          // 设置页面加载状态
          setPageLoading: (page, loading, message, progress) => {
            set((state) => {
              if (loading) {
                state.pageLoading.set(page, {
                  isLoading: true,
                  message,
                  progress
                });
              } else {
                state.pageLoading.delete(page);
              }
            });
          },

          // 清除页面加载状态
          clearPageLoading: (page) => {
            set((state) => {
              state.pageLoading.delete(page);
            });
          },

          // 添加通知
          addNotification: (notification) => {
            const id = generateId();
            const item: NotificationItem = {
              ...notification,
              id,
              timestamp: Date.now()
            };

            set((state) => {
              state.notifications.unshift(item);
              
              // 限制通知数量
              if (state.notifications.length > state.maxNotifications) {
                state.notifications = state.notifications.slice(0, state.maxNotifications);
              }
            });

            // 自动移除通知
            if (!notification.persistent && notification.duration !== 0) {
              const duration = notification.duration || 5000;
              setTimeout(() => {
                get().removeNotification(id);
              }, duration);
            }

            return id;
          },

          // 移除通知
          removeNotification: (id) => {
            set((state) => {
              state.notifications = state.notifications.filter(n => n.id !== id);
            });
          },

          // 清空通知
          clearNotifications: () => {
            set((state) => {
              state.notifications = [];
            });
          },

          // 设置通知位置
          setNotificationPosition: (position) => {
            set((state) => {
              state.notificationPosition = position;
            });
          },

          // 显示成功通知
          showSuccess: (title, message, duration) => {
            return get().addNotification({
              type: 'success',
              title,
              message,
              duration
            });
          },

          // 显示错误通知
          showError: (title, message, duration) => {
            return get().addNotification({
              type: 'error',
              title,
              message,
              duration: duration || 0, // 错误通知默认不自动消失
              persistent: duration === undefined
            });
          },

          // 显示警告通知
          showWarning: (title, message, duration) => {
            return get().addNotification({
              type: 'warning',
              title,
              message,
              duration
            });
          },

          // 显示信息通知
          showInfo: (title, message, duration) => {
            return get().addNotification({
              type: 'info',
              title,
              message,
              duration
            });
          },

          // 打开模态框
          openModal: (config) => {
            const id = generateId();
            const modal: ModalConfig = {
              ...config,
              id,
              size: config.size || 'medium',
              closable: config.closable !== false,
              maskClosable: config.maskClosable !== false
            };

            set((state) => {
              state.modals.push(modal);
            });

            return id;
          },

          // 关闭模态框
          closeModal: (id) => {
            set((state) => {
              state.modals = state.modals.filter(m => m.id !== id);
            });
          },

          // 关闭所有模态框
          closeAllModals: () => {
            set((state) => {
              state.modals = [];
            });
          },

          // 显示确认对话框
          showConfirm: (title, content, onConfirm) => {
            return get().openModal({
              type: 'confirm',
              title,
              content,
              onConfirm,
              confirmText: '确认',
              cancelText: '取消'
            });
          },

          // 显示警告对话框
          showAlert: (title, content) => {
            return get().openModal({
              type: 'alert',
              title,
              content,
              confirmText: '确定'
            });
          },

          // 显示输入对话框
          showPrompt: (title, defaultValue = '') => {
            return new Promise<string | null>((resolve) => {
              let inputValue = defaultValue;
              
              get().openModal({
                type: 'prompt',
                title,
                content: defaultValue,
                onConfirm: () => resolve(inputValue),
                onCancel: () => resolve(null),
                confirmText: '确认',
                cancelText: '取消'
              });
            });
          },

          // 切换全屏
          toggleFullscreen: () => {
            if (typeof document === 'undefined') return;
            
            const isFullscreen = !!document.fullscreenElement;
            
            if (isFullscreen) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
            
            set((state) => {
              state.isFullscreen = !isFullscreen;
            });
          },

          // 设置在线状态
          setOnlineStatus: (isOnline) => {
            set((state) => {
              state.isOnline = isOnline;
            });
            
            // 显示网络状态通知
            if (isOnline) {
              get().showSuccess('网络已连接', '您现在可以正常使用所有功能');
            } else {
              get().showWarning('网络已断开', '部分功能可能无法使用');
            }
          },

          // 注册快捷键
          registerShortcut: (config) => {
            const key = formatShortcutKey(config);
            
            set((state) => {
              state.shortcuts.set(key, config);
            });
          },

          // 注销快捷键
          unregisterShortcut: (key) => {
            set((state) => {
              state.shortcuts.delete(key);
            });
          },

          // 切换快捷键启用状态
          toggleShortcuts: () => {
            set((state) => {
              state.shortcutsEnabled = !state.shortcutsEnabled;
            });
          },

          // 更新用户偏好
          updatePreferences: (preferences) => {
            set((state) => {
              state.preferences = { ...state.preferences, ...preferences };
            });
          },

          // 重置用户偏好
          resetPreferences: () => {
            set((state) => {
              state.preferences = defaultPreferences;
            });
          },

          // 切换开发者模式
          toggleDevMode: () => {
            set((state) => {
              state.devMode = !state.devMode;
            });
          },

          // 切换调试信息
          toggleDebugInfo: () => {
            set((state) => {
              state.debugInfo = !state.debugInfo;
            });
          },

          // 重置状态
          reset: () => {
            set(() => ({ ...initialUIState }));
          }
        }))
      ),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          layout: state.layout,
          fontSize: state.fontSize,
          sidebar: state.sidebar,
          header: state.header,
          footer: state.footer,
          notificationPosition: state.notificationPosition,
          maxNotifications: state.maxNotifications,
          preferences: state.preferences,
          shortcutsEnabled: state.shortcutsEnabled
        })
      }
    ),
    {
      name: 'ui-store'
    }
  );

// ==================== 导出工具函数 ====================

/**
 * 获取主题状态
 */
export const useTheme = () => {
  return useUIStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme
  }));
};

/**
 * 获取语言状态
 */
export const useLanguage = () => {
  return useUIStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage
  }));
};

/**
 * 获取布局状态
 */
export const useLayout = () => {
  return useUIStore((state) => ({
    layout: state.layout,
    sidebar: state.sidebar,
    header: state.header,
    footer: state.footer,
    setLayout: state.setLayout,
    toggleSidebar: state.toggleSidebar,
    setSidebarState: state.setSidebarState
  }));
};

/**
 * 获取加载状态
 */
export const useLoading = () => {
  return useUIStore((state) => ({
    globalLoading: state.globalLoading,
    pageLoading: state.pageLoading,
    setGlobalLoading: state.setGlobalLoading,
    setPageLoading: state.setPageLoading,
    clearPageLoading: state.clearPageLoading
  }));
};

/**
 * 获取通知状态
 */
export const useNotifications = () => {
  return useUIStore((state) => ({
    notifications: state.notifications,
    position: state.notificationPosition,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,
    showSuccess: state.showSuccess,
    showError: state.showError,
    showWarning: state.showWarning,
    showInfo: state.showInfo
  }));
};

/**
 * 获取模态框状态
 */
export const useModals = () => {
  return useUIStore((state) => ({
    modals: state.modals,
    openModal: state.openModal,
    closeModal: state.closeModal,
    closeAllModals: state.closeAllModals,
    showConfirm: state.showConfirm,
    showAlert: state.showAlert,
    showPrompt: state.showPrompt
  }));
};

/**
 * 获取页面状态
 */
export const usePageState = () => {
  return useUIStore((state) => ({
    currentPage: state.currentPage,
    pageTitle: state.pageTitle,
    breadcrumbs: state.breadcrumbs,
    setCurrentPage: state.setCurrentPage,
    setPageTitle: state.setPageTitle,
    setBreadcrumbs: state.setBreadcrumbs,
    addBreadcrumb: state.addBreadcrumb
  }));
};

/**
 * 获取快捷键状态
 */
export const useShortcuts = () => {
  return useUIStore((state) => ({
    shortcuts: state.shortcuts,
    enabled: state.shortcutsEnabled,
    registerShortcut: state.registerShortcut,
    unregisterShortcut: state.unregisterShortcut,
    toggleShortcuts: state.toggleShortcuts
  }));
};

/**
 * 获取用户偏好
 */
export const usePreferences = () => {
  return useUIStore((state) => ({
    preferences: state.preferences,
    updatePreferences: state.updatePreferences,
    resetPreferences: state.resetPreferences
  }));
};

// ==================== 事件监听器 ====================

// 监听系统主题变化
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleThemeChange = (e: MediaQueryListEvent) => {
    const state = useUIStore.getState();
    if (state.theme === 'auto') {
      const root = document.documentElement;
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  };
  
  mediaQuery.addEventListener('change', handleThemeChange);
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    useUIStore.getState().set((state) => {
      state.isFullscreen = isFullscreen;
    });
  });
  
  // 监听网络状态变化
  window.addEventListener('online', () => {
    useUIStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useUIStore.getState().setOnlineStatus(false);
  });
  
  // 监听快捷键
  document.addEventListener('keydown', (event) => {
    const state = useUIStore.getState();
    
    if (!state.shortcutsEnabled) return;
    
    for (const [, config] of state.shortcuts) {
      if (matchesShortcut(event, config)) {
        event.preventDefault();
        config.action();
        break;
      }
    }
  });
}