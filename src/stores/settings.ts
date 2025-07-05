/**
 * 设置状态管理
 * 管理应用设置、用户配置、系统偏好等
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { httpClient } from '../services/http';
import { API_ENDPOINTS } from '../constants/api';

// ==================== 类型定义 ====================

/**
 * 编辑器设置
 */
export interface EditorSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
  enableVim: boolean;
  enableEmmet: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  spellCheck: boolean;
  formatOnSave: boolean;
  enableCodeFolding: boolean;
  highlightActiveLine: boolean;
  showWhitespace: boolean;
}

/**
 * 博客设置
 */
export interface BlogSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  author: string;
  email: string;
  avatar: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  postsPerPage: number;
  enableComments: boolean;
  moderateComments: boolean;
  enableSearch: boolean;
  enableRSS: boolean;
  enableSitemap: boolean;
  enableAnalytics: boolean;
  analyticsId: string;
  socialLinks: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    email?: string;
    website?: string;
  };
}

/**
 * 上传设置
 */
export interface UploadSettings {
  defaultStorageType: 'local' | 'cloud' | 'cdn';
  maxFileSize: number;
  allowedFileTypes: string[];
  enableImageCompression: boolean;
  imageQuality: number;
  enableThumbnails: boolean;
  thumbnailSizes: number[];
  enableWatermark: boolean;
  watermarkText: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  enableChunkedUpload: boolean;
  chunkSize: number;
  maxConcurrentUploads: number;
  enableProgressNotification: boolean;
}

/**
 * 同步设置
 */
export interface SyncSettings {
  enableAutoSync: boolean;
  syncInterval: number;
  enableOfflineMode: boolean;
  conflictResolution: 'manual' | 'local_wins' | 'remote_wins' | 'merge';
  enableBackup: boolean;
  backupInterval: number;
  maxBackups: number;
  enableVersionControl: boolean;
  enableDataValidation: boolean;
  enableCompression: boolean;
  syncOnStartup: boolean;
  syncOnExit: boolean;
}

/**
 * 安全设置
 */
export interface SecuritySettings {
  enableTwoFactor: boolean;
  sessionTimeout: number;
  enableLoginNotification: boolean;
  enableDeviceTracking: boolean;
  enableIPWhitelist: boolean;
  ipWhitelist: string[];
  enablePasswordPolicy: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  enableAccountLockout: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

/**
 * 通知设置
 */
export interface NotificationSettings {
  enableDesktopNotifications: boolean;
  enableSoundNotifications: boolean;
  enableEmailNotifications: boolean;
  notificationPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  notificationDuration: number;
  enableCommentNotifications: boolean;
  enableUploadNotifications: boolean;
  enableSyncNotifications: boolean;
  enableErrorNotifications: boolean;
  enableSuccessNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

/**
 * 性能设置
 */
export interface PerformanceSettings {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCaching: boolean;
  cacheSize: number;
  enablePreloading: boolean;
  maxConcurrentRequests: number;
  requestTimeout: number;
  enableCompression: boolean;
  enableMinification: boolean;
  enableTreeShaking: boolean;
  enableCodeSplitting: boolean;
}

/**
 * 开发者设置
 */
export interface DeveloperSettings {
  enableDevMode: boolean;
  enableDebugMode: boolean;
  enableConsoleLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enablePerformanceMonitoring: boolean;
  enableErrorReporting: boolean;
  enableAnalytics: boolean;
  enableHotReload: boolean;
  enableSourceMaps: boolean;
  enableProfiling: boolean;
}

/**
 * 设置状态接口
 */
export interface SettingsState {
  // 各类设置
  editor: EditorSettings;
  blog: BlogSettings;
  upload: UploadSettings;
  sync: SyncSettings;
  security: SecuritySettings;
  notification: NotificationSettings;
  performance: PerformanceSettings;
  developer: DeveloperSettings;
  
  // 状态
  isLoading: boolean;
  lastSyncTime: number;
  hasUnsavedChanges: boolean;
  
  // 错误状态
  errors: Record<string, string>;
}

/**
 * 设置操作接口
 */
export interface SettingsActions {
  // 编辑器设置
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  resetEditorSettings: () => void;
  
  // 博客设置
  updateBlogSettings: (settings: Partial<BlogSettings>) => void;
  resetBlogSettings: () => void;
  
  // 上传设置
  updateUploadSettings: (settings: Partial<UploadSettings>) => void;
  resetUploadSettings: () => void;
  
  // 同步设置
  updateSyncSettings: (settings: Partial<SyncSettings>) => void;
  resetSyncSettings: () => void;
  
  // 安全设置
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  resetSecuritySettings: () => void;
  
  // 通知设置
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  resetNotificationSettings: () => void;
  
  // 性能设置
  updatePerformanceSettings: (settings: Partial<PerformanceSettings>) => void;
  resetPerformanceSettings: () => void;
  
  // 开发者设置
  updateDeveloperSettings: (settings: Partial<DeveloperSettings>) => void;
  resetDeveloperSettings: () => void;
  
  // 通用操作
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  resetAllSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => Promise<void>;
  
  // 错误处理
  setError: (key: string, message: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
}

// ==================== 默认设置 ====================

const defaultEditorSettings: EditorSettings = {
  theme: 'auto',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  lineHeight: 1.5,
  tabSize: 2,
  wordWrap: true,
  showLineNumbers: true,
  showMinimap: true,
  enableVim: false,
  enableEmmet: true,
  autoSave: true,
  autoSaveDelay: 2000,
  spellCheck: true,
  formatOnSave: true,
  enableCodeFolding: true,
  highlightActiveLine: true,
  showWhitespace: false
};

const defaultBlogSettings: BlogSettings = {
  siteName: 'My Blog',
  siteDescription: 'A personal blog built with modern technology',
  siteUrl: '',
  author: '',
  email: '',
  avatar: '',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  postsPerPage: 10,
  enableComments: true,
  moderateComments: true,
  enableSearch: true,
  enableRSS: true,
  enableSitemap: true,
  enableAnalytics: false,
  analyticsId: '',
  socialLinks: {}
};

const defaultUploadSettings: UploadSettings = {
  defaultStorageType: 'cloud',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx'],
  enableImageCompression: true,
  imageQuality: 80,
  enableThumbnails: true,
  thumbnailSizes: [150, 300, 600],
  enableWatermark: false,
  watermarkText: '',
  watermarkPosition: 'bottom-right',
  enableChunkedUpload: true,
  chunkSize: 1024 * 1024, // 1MB
  maxConcurrentUploads: 3,
  enableProgressNotification: true
};

const defaultSyncSettings: SyncSettings = {
  enableAutoSync: true,
  syncInterval: 30000, // 30秒
  enableOfflineMode: true,
  conflictResolution: 'manual',
  enableBackup: true,
  backupInterval: 24 * 60 * 60 * 1000, // 24小时
  maxBackups: 10,
  enableVersionControl: true,
  enableDataValidation: true,
  enableCompression: false,
  syncOnStartup: true,
  syncOnExit: true
};

const defaultSecuritySettings: SecuritySettings = {
  enableTwoFactor: false,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
  enableLoginNotification: true,
  enableDeviceTracking: true,
  enableIPWhitelist: false,
  ipWhitelist: [],
  enablePasswordPolicy: true,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  enableAccountLockout: true,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15分钟
};

const defaultNotificationSettings: NotificationSettings = {
  enableDesktopNotifications: true,
  enableSoundNotifications: false,
  enableEmailNotifications: true,
  notificationPosition: 'top-right',
  notificationDuration: 5000,
  enableCommentNotifications: true,
  enableUploadNotifications: true,
  enableSyncNotifications: false,
  enableErrorNotifications: true,
  enableSuccessNotifications: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  }
};

const defaultPerformanceSettings: PerformanceSettings = {
  enableLazyLoading: true,
  enableImageOptimization: true,
  enableCaching: true,
  cacheSize: 100 * 1024 * 1024, // 100MB
  enablePreloading: true,
  maxConcurrentRequests: 6,
  requestTimeout: 30000,
  enableCompression: true,
  enableMinification: true,
  enableTreeShaking: true,
  enableCodeSplitting: true
};

const defaultDeveloperSettings: DeveloperSettings = {
  enableDevMode: false,
  enableDebugMode: false,
  enableConsoleLogging: true,
  logLevel: 'info',
  enablePerformanceMonitoring: false,
  enableErrorReporting: true,
  enableAnalytics: false,
  enableHotReload: true,
  enableSourceMaps: false,
  enableProfiling: false
};

const initialSettingsState: SettingsState = {
  editor: defaultEditorSettings,
  blog: defaultBlogSettings,
  upload: defaultUploadSettings,
  sync: defaultSyncSettings,
  security: defaultSecuritySettings,
  notification: defaultNotificationSettings,
  performance: defaultPerformanceSettings,
  developer: defaultDeveloperSettings,
  isLoading: false,
  lastSyncTime: 0,
  hasUnsavedChanges: false,
  errors: {}
};

// ==================== 设置Store ====================

export const useSettingsStore = create<SettingsState & SettingsActions>()
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialSettingsState,

          // 更新编辑器设置
          updateEditorSettings: (settings) => {
            set((state) => {
              state.editor = { ...state.editor, ...settings };
              state.hasUnsavedChanges = true;
            });
            
            // 触发编辑器设置变更事件
            window.dispatchEvent(new CustomEvent('editor-settings-changed', {
              detail: { settings }
            }));
          },

          // 重置编辑器设置
          resetEditorSettings: () => {
            set((state) => {
              state.editor = defaultEditorSettings;
              state.hasUnsavedChanges = true;
            });
          },

          // 更新博客设置
          updateBlogSettings: (settings) => {
            set((state) => {
              state.blog = { ...state.blog, ...settings };
              state.hasUnsavedChanges = true;
            });
          },

          // 重置博客设置
          resetBlogSettings: () => {
            set((state) => {
              state.blog = defaultBlogSettings;
              state.hasUnsavedChanges = true;
            });
          },

          // 更新上传设置
          updateUploadSettings: (settings) => {
            set((state) => {
              state.upload = { ...state.upload, ...settings };
              state.hasUnsavedChanges = true;
            });
          },

          // 重置上传设置
          resetUploadSettings: () => {
            set((state) => {
              state.upload = defaultUploadSettings;
              state.hasUnsavedChanges = true;
            });
          },

          // 更新同步设置
          updateSyncSettings: (settings) => {
            set((state) => {
              state.sync = { ...state.sync, ...settings };
              state.hasUnsavedChanges = true;
            });
            
            // 触发同步设置变更事件
            window.dispatchEvent(new CustomEvent('sync-settings-changed', {
              detail: { settings }
            }));
          },

          // 重置同步设置
          resetSyncSettings: () => {
            set((state) => {
              state.sync = defaultSyncSettings;
              state.hasUnsavedChanges = true;
            });
          },

          // 更新安全设置
          updateSecuritySettings: (settings) => {
            set((state) => {
              state.security = { ...state.security, ...settings };
              state.hasUnsavedChanges = true;
            });
          },

          // 重置安全设置
          resetSecuritySettings: () => {
            set((state) => {
              state.security = defaultSecuritySettings;
              state.hasUnsavedChanges = true;
            });
          },

          // 更新通知设置
          updateNotificationSettings: (settings) => {
            set((state) => {
              state.notification = { ...state.notification, ...settings };
              state.hasUnsavedChanges = true;
            });
          },

          // 重置通知设置
          resetNotificationSettings: () => {
            set((state) => {
              state.notification = defaultNotificationSettings;
              state.hasUnsavedChanges = true;
            });
          },

          // 更新性能设置
          updatePerformanceSettings: (settings) => {
            set((state) => {
              state.performance = { ...state.performance, ...settings };
              state.hasUnsavedChanges = true;
            });
          },

          // 重置性能设置
          resetPerformanceSettings: () => {
            set((state) => {
              state.performance = defaultPerformanceSettings;
              state.hasUnsavedChanges = true;
            });
          },

          // 更新开发者设置
          updateDeveloperSettings: (settings) => {
            set((state) => {
              state.developer = { ...state.developer, ...settings };
              state.hasUnsavedChanges = true;
            });
          },

          // 重置开发者设置
          resetDeveloperSettings: () => {
            set((state) => {
              state.developer = defaultDeveloperSettings;
              state.hasUnsavedChanges = true;
            });
          },

          // 加载设置
          loadSettings: async () => {
            set((state) => {
              state.isLoading = true;
              state.errors = {};
            });

            try {
              const response = await httpClient.get(API_ENDPOINTS.SETTINGS.GET);
              
              if (response.success && response.data) {
                set((state) => {
                  // 合并服务器设置和默认设置
                  state.editor = { ...defaultEditorSettings, ...response.data.editor };
                  state.blog = { ...defaultBlogSettings, ...response.data.blog };
                  state.upload = { ...defaultUploadSettings, ...response.data.upload };
                  state.sync = { ...defaultSyncSettings, ...response.data.sync };
                  state.security = { ...defaultSecuritySettings, ...response.data.security };
                  state.notification = { ...defaultNotificationSettings, ...response.data.notification };
                  state.performance = { ...defaultPerformanceSettings, ...response.data.performance };
                  state.developer = { ...defaultDeveloperSettings, ...response.data.developer };
                  
                  state.lastSyncTime = Date.now();
                  state.hasUnsavedChanges = false;
                });
              }
            } catch (error) {
              get().setError('load', error instanceof Error ? error.message : 'Failed to load settings');
            } finally {
              set((state) => {
                state.isLoading = false;
              });
            }
          },

          // 保存设置
          saveSettings: async () => {
            const state = get();
            
            if (!state.hasUnsavedChanges) {
              return;
            }

            set((state) => {
              state.isLoading = true;
              state.errors = {};
            });

            try {
              const settingsData = {
                editor: state.editor,
                blog: state.blog,
                upload: state.upload,
                sync: state.sync,
                security: state.security,
                notification: state.notification,
                performance: state.performance,
                developer: state.developer
              };

              const response = await httpClient.post(API_ENDPOINTS.SETTINGS.UPDATE, settingsData);
              
              if (response.success) {
                set((state) => {
                  state.lastSyncTime = Date.now();
                  state.hasUnsavedChanges = false;
                });
                
                // 触发设置保存成功事件
                window.dispatchEvent(new CustomEvent('settings-saved', {
                  detail: { settings: settingsData }
                }));
              } else {
                throw new Error(response.message || 'Failed to save settings');
              }
            } catch (error) {
              get().setError('save', error instanceof Error ? error.message : 'Failed to save settings');
              throw error;
            } finally {
              set((state) => {
                state.isLoading = false;
              });
            }
          },

          // 重置所有设置
          resetAllSettings: () => {
            set((state) => {
              state.editor = defaultEditorSettings;
              state.blog = defaultBlogSettings;
              state.upload = defaultUploadSettings;
              state.sync = defaultSyncSettings;
              state.security = defaultSecuritySettings;
              state.notification = defaultNotificationSettings;
              state.performance = defaultPerformanceSettings;
              state.developer = defaultDeveloperSettings;
              state.hasUnsavedChanges = true;
              state.errors = {};
            });
          },

          // 导出设置
          exportSettings: () => {
            const state = get();
            const settingsData = {
              editor: state.editor,
              blog: state.blog,
              upload: state.upload,
              sync: state.sync,
              security: state.security,
              notification: state.notification,
              performance: state.performance,
              developer: state.developer,
              exportTime: new Date().toISOString(),
              version: '1.0.0'
            };
            
            return JSON.stringify(settingsData, null, 2);
          },

          // 导入设置
          importSettings: async (data) => {
            try {
              const settingsData = JSON.parse(data);
              
              // 验证数据格式
              if (!settingsData || typeof settingsData !== 'object') {
                throw new Error('Invalid settings data format');
              }

              set((state) => {
                // 安全地合并设置，只更新存在的字段
                if (settingsData.editor) {
                  state.editor = { ...state.editor, ...settingsData.editor };
                }
                if (settingsData.blog) {
                  state.blog = { ...state.blog, ...settingsData.blog };
                }
                if (settingsData.upload) {
                  state.upload = { ...state.upload, ...settingsData.upload };
                }
                if (settingsData.sync) {
                  state.sync = { ...state.sync, ...settingsData.sync };
                }
                if (settingsData.security) {
                  state.security = { ...state.security, ...settingsData.security };
                }
                if (settingsData.notification) {
                  state.notification = { ...state.notification, ...settingsData.notification };
                }
                if (settingsData.performance) {
                  state.performance = { ...state.performance, ...settingsData.performance };
                }
                if (settingsData.developer) {
                  state.developer = { ...state.developer, ...settingsData.developer };
                }
                
                state.hasUnsavedChanges = true;
                state.errors = {};
              });
              
              // 触发设置导入成功事件
              window.dispatchEvent(new CustomEvent('settings-imported', {
                detail: { settings: settingsData }
              }));
            } catch (error) {
              get().setError('import', error instanceof Error ? error.message : 'Failed to import settings');
              throw error;
            }
          },

          // 设置错误
          setError: (key, message) => {
            set((state) => {
              state.errors[key] = message;
            });
          },

          // 清除错误
          clearError: (key) => {
            set((state) => {
              delete state.errors[key];
            });
          },

          // 清除所有错误
          clearAllErrors: () => {
            set((state) => {
              state.errors = {};
            });
          },

          // 设置加载状态
          setLoading: (loading) => {
            set((state) => {
              state.isLoading = loading;
            });
          },

          // 标记为已更改
          markAsChanged: () => {
            set((state) => {
              state.hasUnsavedChanges = true;
            });
          },

          // 标记为已保存
          markAsSaved: () => {
            set((state) => {
              state.hasUnsavedChanges = false;
              state.lastSyncTime = Date.now();
            });
          }
        }))
      ),
      {
        name: 'settings-store',
        partialize: (state) => ({
          editor: state.editor,
          blog: state.blog,
          upload: state.upload,
          sync: state.sync,
          security: state.security,
          notification: state.notification,
          performance: state.performance,
          developer: state.developer,
          lastSyncTime: state.lastSyncTime
        })
      }
    ),
    {
      name: 'settings-store'
    }
  );

// ==================== 导出工具函数 ====================

/**
 * 获取编辑器设置
 */
export const useEditorSettings = () => {
  return useSettingsStore((state) => ({
    settings: state.editor,
    updateSettings: state.updateEditorSettings,
    resetSettings: state.resetEditorSettings
  }));
};

/**
 * 获取博客设置
 */
export const useBlogSettings = () => {
  return useSettingsStore((state) => ({
    settings: state.blog,
    updateSettings: state.updateBlogSettings,
    resetSettings: state.resetBlogSettings
  }));
};

/**
 * 获取上传设置
 */
export const useUploadSettings = () => {
  return useSettingsStore((state) => ({
    settings: state.upload,
    updateSettings: state.updateUploadSettings,
    resetSettings: state.resetUploadSettings
  }));
};

/**
 * 获取同步设置
 */
export const useSyncSettings = () => {
  return useSettingsStore((state) => ({
    settings: state.sync,
    updateSettings: state.updateSyncSettings,
    resetSettings: state.resetSyncSettings
  }));
};

/**
 * 获取安全设置
 */
export const useSecuritySettings = () => {
  return useSettingsStore((state) => ({
    settings: state.security,
    updateSettings: state.updateSecuritySettings,
    resetSettings: state.resetSecuritySettings
  }));
};

/**
 * 获取通知设置
 */
export const useNotificationSettings = () => {
  return useSettingsStore((state) => ({
    settings: state.notification,
    updateSettings: state.updateNotificationSettings,
    resetSettings: state.resetNotificationSettings
  }));
};

/**
 * 获取性能设置
 */
export const usePerformanceSettings = () => {
  return useSettingsStore((state) => ({
    settings: state.performance,
    updateSettings: state.updatePerformanceSettings,
    resetSettings: state.resetPerformanceSettings
  }));
};

/**
 * 获取开发者设置
 */
export const useDeveloperSettings = () => {
  return useSettingsStore((state) => ({
    settings: state.developer,
    updateSettings: state.updateDeveloperSettings,
    resetSettings: state.resetDeveloperSettings
  }));
};

/**
 * 获取设置状态
 */
export const useSettingsStatus = () => {
  return useSettingsStore((state) => ({
    isLoading: state.isLoading,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSyncTime: state.lastSyncTime,
    errors: state.errors,
    loadSettings: state.loadSettings,
    saveSettings: state.saveSettings,
    resetAllSettings: state.resetAllSettings,
    exportSettings: state.exportSettings,
    importSettings: state.importSettings
  }));
};