// 应用状态管理
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';

// 主题类型
type Theme = 'light' | 'dark' | 'auto';

// 语言类型
type Language = 'zh-CN' | 'en-US';

// 侧边栏状态
type SidebarState = 'expanded' | 'collapsed' | 'hidden';

// 布局类型
type Layout = 'default' | 'compact' | 'wide';

// 通知类型
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  createdAt: number;
}

// 模态框状态
interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
  options?: {
    closable?: boolean;
    maskClosable?: boolean;
    keyboard?: boolean;
    centered?: boolean;
    width?: number | string;
    height?: number | string;
  };
}

// 应用设置
interface AppSettings {
  // 外观设置
  theme: Theme;
  language: Language;
  layout: Layout;
  sidebarState: SidebarState;
  
  // 编辑器设置
  editor: {
    theme: 'light' | 'dark';
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
    lineNumbers: boolean;
    autoSave: boolean;
    autoSaveDelay: number;
  };
  
  // 性能设置
  performance: {
    enableVirtualScroll: boolean;
    lazyLoadImages: boolean;
    enableCache: boolean;
    maxCacheSize: number;
  };
  
  // 通知设置
  notifications: {
    enabled: boolean;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration: number;
    maxCount: number;
  };
  
  // 快捷键设置
  shortcuts: {
    enabled: boolean;
    customShortcuts: Record<string, string>;
  };
  
  // 开发者设置
  developer: {
    enableDevTools: boolean;
    showPerformanceMetrics: boolean;
    enableDebugMode: boolean;
  };
}

// 应用状态接口
interface AppState {
  // 基础状态
  isInitialized: boolean;
  isLoading: boolean;
  isOnline: boolean;
  
  // 设置
  settings: AppSettings;
  
  // UI状态
  notifications: Notification[];
  modals: Modal[];
  
  // 路由状态
  currentRoute: string;
  previousRoute: string;
  
  // 窗口状态
  windowSize: {
    width: number;
    height: number;
  };
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // 性能监控
  performance: {
    loadTime: number;
    memoryUsage: number;
    renderTime: number;
  };
  
  // 错误状态
  errors: Array<{
    id: string;
    message: string;
    stack?: string;
    timestamp: number;
    context?: Record<string, any>;
  }>;
}

// 应用操作接口
interface AppActions {
  // ==================== 初始化 ====================
  initialize: () => Promise<void>;
  
  // ==================== 设置管理 ====================
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => void;
  
  // ==================== 主题管理 ====================
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // ==================== 语言管理 ====================
  setLanguage: (language: Language) => void;
  
  // ==================== 布局管理 ====================
  setLayout: (layout: Layout) => void;
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void;
  
  // ==================== 通知管理 ====================
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  
  // ==================== 模态框管理 ====================
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // ==================== 路由管理 ====================
  setCurrentRoute: (route: string) => void;
  
  // ==================== 窗口管理 ====================
  updateWindowSize: (size: { width: number; height: number }) => void;
  
  // ==================== 性能监控 ====================
  updatePerformance: (metrics: Partial<AppState['performance']>) => void;
  
  // ==================== 错误管理 ====================
  addError: (error: { message: string; stack?: string; context?: Record<string, any> }) => void;
  clearErrors: () => void;
  
  // ==================== 网络状态 ====================
  setOnlineStatus: (isOnline: boolean) => void;
  
  // ==================== 加载状态 ====================
  setLoading: (isLoading: boolean) => void;
}

type AppStore = AppState & AppActions;

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'zh-CN',
  layout: 'default',
  sidebarState: 'expanded',
  editor: {
    theme: 'light',
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    lineHeight: 1.5,
    tabSize: 2,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    autoSave: true,
    autoSaveDelay: 2000,
  },
  performance: {
    enableVirtualScroll: true,
    lazyLoadImages: true,
    enableCache: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
  },
  notifications: {
    enabled: true,
    position: 'top-right',
    duration: 4000,
    maxCount: 5,
  },
  shortcuts: {
    enabled: true,
    customShortcuts: {
      'ctrl+s': 'save',
      'ctrl+n': 'new',
      'ctrl+o': 'open',
      'ctrl+p': 'preview',
      'ctrl+shift+p': 'command-palette',
    },
  },
  developer: {
    enableDevTools: false,
    showPerformanceMetrics: false,
    enableDebugMode: false,
  },
};

// 初始状态
const initialState: AppState = {
  isInitialized: false,
  isLoading: false,
  isOnline: navigator.onLine,
  settings: defaultSettings,
  notifications: [],
  modals: [],
  currentRoute: '/',
  previousRoute: '/',
  windowSize: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  isMobile: window.innerWidth < 768,
  isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: window.innerWidth >= 1024,
  performance: {
    loadTime: 0,
    memoryUsage: 0,
    renderTime: 0,
  },
  errors: [],
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 创建应用store
export const useAppStore = create<AppStore>()()
  (persist(
    immer((set, get) => ({
      ...initialState,

      // ==================== 初始化 ====================
      
      initialize: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          // 检测系统主题
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const currentTheme = get().settings.theme;
          
          if (currentTheme === 'auto') {
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          } else {
            document.documentElement.setAttribute('data-theme', currentTheme);
          }
          
          // 监听系统主题变化
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (get().settings.theme === 'auto') {
              document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
          });
          
          // 监听网络状态
          window.addEventListener('online', () => get().setOnlineStatus(true));
          window.addEventListener('offline', () => get().setOnlineStatus(false));
          
          // 监听窗口大小变化
          const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            get().updateWindowSize({ width, height });
          };
          
          window.addEventListener('resize', handleResize);
          
          // 监听错误
          window.addEventListener('error', (event) => {
            get().addError({
              message: event.message,
              stack: event.error?.stack,
              context: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
              },
            });
          });
          
          window.addEventListener('unhandledrejection', (event) => {
            get().addError({
              message: event.reason?.message || 'Unhandled Promise Rejection',
              stack: event.reason?.stack,
              context: {
                type: 'unhandledrejection',
                reason: event.reason,
              },
            });
          });
          
          set((state) => {
            state.isInitialized = true;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
          });
          
          get().addError({
            message: 'Failed to initialize app',
            stack: (error as Error).stack,
            context: { error },
          });
        }
      },

      // ==================== 设置管理 ====================
      
      updateSettings: (settings: Partial<AppSettings>) => {
        set((state) => {
          state.settings = { ...state.settings, ...settings };
        });
        
        // 应用主题变化
        if (settings.theme) {
          const theme = settings.theme;
          if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          } else {
            document.documentElement.setAttribute('data-theme', theme);
          }
        }
      },

      resetSettings: () => {
        set((state) => {
          state.settings = { ...defaultSettings };
        });
      },

      exportSettings: () => {
        const settings = get().settings;
        return JSON.stringify(settings, null, 2);
      },

      importSettings: (settingsJson: string) => {
        try {
          const settings = JSON.parse(settingsJson);
          get().updateSettings(settings);
        } catch (error) {
          get().addNotification({
            type: 'error',
            title: '导入设置失败',
            message: '设置文件格式不正确',
          });
        }
      },

      // ==================== 主题管理 ====================
      
      setTheme: (theme: Theme) => {
        get().updateSettings({ theme });
      },

      toggleTheme: () => {
        const currentTheme = get().settings.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // ==================== 语言管理 ====================
      
      setLanguage: (language: Language) => {
        get().updateSettings({ language });
      },

      // ==================== 布局管理 ====================
      
      setLayout: (layout: Layout) => {
        get().updateSettings({ layout });
      },

      setSidebarState: (state: SidebarState) => {
        get().updateSettings({ sidebarState: state });
      },

      toggleSidebar: () => {
        const currentState = get().settings.sidebarState;
        const newState = currentState === 'expanded' ? 'collapsed' : 'expanded';
        get().setSidebarState(newState);
      },

      // ==================== 通知管理 ====================
      
      addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: Date.now(),
        };
        
        set((state) => {
          state.notifications.unshift(newNotification);
          
          // 限制通知数量
          const maxCount = state.settings.notifications.maxCount;
          if (state.notifications.length > maxCount) {
            state.notifications = state.notifications.slice(0, maxCount);
          }
        });
        
        // 自动移除通知
        if (!notification.persistent) {
          const duration = notification.duration || get().settings.notifications.duration;
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
        
        return id;
      },

      removeNotification: (id: string) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      clearNotifications: () => {
        set((state) => {
          state.notifications = [];
        });
      },

      markNotificationAsRead: (id: string) => {
        // 这里可以添加已读标记逻辑
        console.log('Mark notification as read:', id);
      },

      // ==================== 模态框管理 ====================
      
      openModal: (modal: Omit<Modal, 'id'>) => {
        const id = generateId();
        const newModal: Modal = {
          ...modal,
          id,
        };
        
        set((state) => {
          state.modals.push(newModal);
        });
        
        return id;
      },

      closeModal: (id: string) => {
        set((state) => {
          state.modals = state.modals.filter(m => m.id !== id);
        });
      },

      closeAllModals: () => {
        set((state) => {
          state.modals = [];
        });
      },

      // ==================== 路由管理 ====================
      
      setCurrentRoute: (route: string) => {
        set((state) => {
          state.previousRoute = state.currentRoute;
          state.currentRoute = route;
        });
      },

      // ==================== 窗口管理 ====================
      
      updateWindowSize: (size: { width: number; height: number }) => {
        set((state) => {
          state.windowSize = size;
          state.isMobile = size.width < 768;
          state.isTablet = size.width >= 768 && size.width < 1024;
          state.isDesktop = size.width >= 1024;
          
          // 在移动设备上自动折叠侧边栏
          if (state.isMobile && state.settings.sidebarState === 'expanded') {
            state.settings.sidebarState = 'collapsed';
          }
        });
      },

      // ==================== 性能监控 ====================
      
      updatePerformance: (metrics: Partial<AppState['performance']>) => {
        set((state) => {
          state.performance = { ...state.performance, ...metrics };
        });
      },

      // ==================== 错误管理 ====================
      
      addError: (error: { message: string; stack?: string; context?: Record<string, any> }) => {
        const errorWithId = {
          ...error,
          id: generateId(),
          timestamp: Date.now(),
        };
        
        set((state) => {
          state.errors.unshift(errorWithId);
          
          // 限制错误数量
          if (state.errors.length > 100) {
            state.errors = state.errors.slice(0, 100);
          }
        });
        
        // 在开发模式下显示错误通知
        if (get().settings.developer.enableDebugMode) {
          get().addNotification({
            type: 'error',
            title: '发生错误',
            message: error.message,
            persistent: true,
          });
        }
      },

      clearErrors: () => {
        set((state) => {
          state.errors = [];
        });
      },

      // ==================== 网络状态 ====================
      
      setOnlineStatus: (isOnline: boolean) => {
        set((state) => {
          state.isOnline = isOnline;
        });
        
        // 显示网络状态通知
        get().addNotification({
          type: isOnline ? 'success' : 'warning',
          title: isOnline ? '网络已连接' : '网络已断开',
          message: isOnline ? '您现在可以正常使用所有功能' : '部分功能可能无法使用',
        });
      },

      // ==================== 加载状态 ====================
      
      setLoading: (isLoading: boolean) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },
    })),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  ));

// 导出类型
export type { Theme, Language, SidebarState, Layout, Notification, Modal, AppSettings };

export default useAppStore;