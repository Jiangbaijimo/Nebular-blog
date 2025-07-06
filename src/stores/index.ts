// 状态管理索引文件

// 导出所有store
export { useAuthStore } from './auth';
export { default as useBlogStore } from './blogStore';
export { default as useUploadStore } from './uploadStore';
export { default as useAppStore } from './appStore';

// 导出类型
export type {
  Theme,
  Language,
  SidebarState,
  Layout,
  Notification,
  Modal,
  AppSettings,
} from './appStore';

// 导出store hooks的组合使用示例
export const useStores = () => {
  const authStore = useAuthStore();
  const blogStore = useBlogStore();
  const uploadStore = useUploadStore();
  const appStore = useAppStore();
  
  return {
    auth: authStore,
    blog: blogStore,
    upload: uploadStore,
    app: appStore,
  };
};

// 导出常用的store选择器
export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  return { user, isAuthenticated, login, logout };
};

export const useBlog = () => {
  const { blogs, currentBlog, getBlogs, createBlog, updateBlog, deleteBlog } = useBlogStore();
  return { blogs, currentBlog, getBlogs, createBlog, updateBlog, deleteBlog };
};

export const useUpload = () => {
  const { uploadFile, uploadFiles, mediaFiles, getMediaFiles } = useUploadStore();
  return { uploadFile, uploadFiles, mediaFiles, getMediaFiles };
};

export const useApp = () => {
  const { 
    settings, 
    theme, 
    language, 
    notifications, 
    setTheme, 
    setLanguage, 
    addNotification 
  } = useAppStore((state) => ({
    settings: state.settings,
    theme: state.settings.theme,
    language: state.settings.language,
    notifications: state.notifications,
    setTheme: state.setTheme,
    setLanguage: state.setLanguage,
    addNotification: state.addNotification,
  }));
  
  return { 
    settings, 
    theme, 
    language, 
    notifications, 
    setTheme, 
    setLanguage, 
    addNotification 
  };
};

// 导出store重置函数
export const resetAllStores = () => {
  useAuthStore.getState().reset();
  useBlogStore.getState().reset();
  useUploadStore.getState().reset();
  // 注意：通常不重置appStore，因为它包含用户设置
};

// 导出store持久化清理函数
export const clearPersistedStores = () => {
  localStorage.removeItem('auth-store');
  localStorage.removeItem('blog-store');
  localStorage.removeItem('upload-store');
  localStorage.removeItem('app-store');
};