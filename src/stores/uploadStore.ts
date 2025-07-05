// 上传状态管理
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { uploadAPI } from '../services/api/upload';
import type {
  UploadFile,
  MediaFile,
  MediaFolder,
  UploadProgress,
  ChunkUploadInfo,
  StorageStats,
  MediaListParams,
} from '../types/upload';
import type { PaginatedResponse } from '../types/common';

// 上传任务状态
interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  result?: UploadFile;
  chunkInfo?: ChunkUploadInfo;
  abortController?: AbortController;
}

// 上传状态接口
interface UploadState {
  // 上传任务
  uploadTasks: UploadTask[];
  
  // 媒体库
  mediaFiles: MediaFile[];
  currentFolder: MediaFolder | null;
  folders: MediaFolder[];
  
  // 分页信息
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // 存储统计
  storageStats: StorageStats | null;
  
  // 搜索和筛选
  searchQuery: string;
  filters: {
    type?: 'image' | 'video' | 'document' | 'audio' | 'other';
    folderId?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    sizeRange?: {
      min: number;
      max: number;
    };
  };
  
  // 选中的文件
  selectedFiles: string[];
  
  // 加载状态
  isLoading: boolean;
  isUploading: boolean;
  
  // 错误状态
  error: string | null;
  
  // 上传配置
  uploadConfig: {
    maxFileSize: number;
    allowedTypes: string[];
    chunkSize: number;
    maxConcurrent: number;
    autoCompress: boolean;
    generateThumbnail: boolean;
  };
}

// 上传操作接口
interface UploadActions {
  // ==================== 文件上传 ====================
  uploadFile: (file: File, options?: {
    compress?: boolean;
    generateThumbnail?: boolean;
    folderId?: string;
  }) => Promise<UploadFile>;
  uploadFiles: (files: File[], options?: {
    compress?: boolean;
    generateThumbnail?: boolean;
    folderId?: string;
  }) => Promise<UploadFile[]>;
  uploadImage: (file: File, options?: {
    compress?: boolean;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    generateThumbnail?: boolean;
    folderId?: string;
  }) => Promise<UploadFile>;
  uploadVideo: (file: File, options?: {
    folderId?: string;
  }) => Promise<UploadFile>;
  uploadDocument: (file: File, options?: {
    folderId?: string;
  }) => Promise<UploadFile>;
  
  // ==================== 分片上传 ====================
  initChunkUpload: (file: File, options?: {
    chunkSize?: number;
    folderId?: string;
  }) => Promise<string>;
  uploadChunk: (uploadId: string, chunkIndex: number, chunk: Blob) => Promise<void>;
  completeChunkUpload: (uploadId: string) => Promise<UploadFile>;
  cancelChunkUpload: (uploadId: string) => Promise<void>;
  getUploadedChunks: (uploadId: string) => Promise<number[]>;
  
  // ==================== 上传任务管理 ====================
  addUploadTask: (file: File) => string;
  updateTaskProgress: (taskId: string, progress: number) => void;
  updateTaskStatus: (taskId: string, status: UploadTask['status'], error?: string, result?: UploadFile) => void;
  cancelUploadTask: (taskId: string) => void;
  retryUploadTask: (taskId: string) => Promise<void>;
  clearCompletedTasks: () => void;
  clearAllTasks: () => void;
  
  // ==================== 媒体库管理 ====================
  getMediaFiles: (params?: MediaListParams) => Promise<void>;
  getMediaFileById: (id: string) => Promise<MediaFile>;
  updateMediaFile: (id: string, data: Partial<MediaFile>) => Promise<void>;
  deleteMediaFile: (id: string) => Promise<void>;
  deleteMediaFiles: (ids: string[]) => Promise<void>;
  moveMediaFile: (id: string, folderId: string) => Promise<void>;
  copyMediaFile: (id: string, folderId: string) => Promise<void>;
  
  // ==================== 文件夹管理 ====================
  getFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  updateFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveFolder: (id: string, parentId: string) => Promise<void>;
  setCurrentFolder: (folder: MediaFolder | null) => void;
  
  // ==================== 搜索和筛选 ====================
  searchMediaFiles: (query: string, params?: MediaListParams) => Promise<void>;
  setFilters: (filters: Partial<UploadState['filters']>) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  
  // ==================== 文件选择 ====================
  selectFile: (id: string) => void;
  selectFiles: (ids: string[]) => void;
  unselectFile: (id: string) => void;
  unselectFiles: (ids: string[]) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
  
  // ==================== 存储统计 ====================
  getStorageStats: () => Promise<void>;
  
  // ==================== 文件预览和下载 ====================
  getPreviewUrl: (id: string) => Promise<string>;
  getDownloadUrl: (id: string) => Promise<string>;
  downloadFile: (id: string, filename?: string) => Promise<void>;
  
  // ==================== 工具方法 ====================
  validateFile: (file: File) => { valid: boolean; error?: string };
  compressImage: (file: File, options?: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  }) => Promise<File>;
  generateThumbnail: (file: File, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }) => Promise<Blob>;
  
  // ==================== 状态管理 ====================
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // ==================== 分页管理 ====================
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // ==================== 配置管理 ====================
  updateUploadConfig: (config: Partial<UploadState['uploadConfig']>) => void;
}

type UploadStore = UploadState & UploadActions;

// 初始状态
const initialState: UploadState = {
  uploadTasks: [],
  mediaFiles: [],
  currentFolder: null,
  folders: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  storageStats: null,
  searchQuery: '',
  filters: {},
  selectedFiles: [],
  isLoading: false,
  isUploading: false,
  error: null,
  uploadConfig: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
      'text/markdown',
    ],
    chunkSize: 1024 * 1024, // 1MB
    maxConcurrent: 3,
    autoCompress: true,
    generateThumbnail: true,
  },
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 创建上传store
export const useUploadStore = create<UploadStore>()()
  (persist(
    immer((set, get) => ({
      ...initialState,

      // ==================== 文件上传 ====================
      
      uploadFile: async (file: File, options = {}) => {
        const taskId = get().addUploadTask(file);
        
        try {
          get().updateTaskStatus(taskId, 'uploading');
          
          const result = await uploadAPI.uploadFile(file, {
            ...options,
            onProgress: (progress) => {
              get().updateTaskProgress(taskId, progress);
            },
          });
          
          get().updateTaskStatus(taskId, 'completed', undefined, result);
          
          // 刷新媒体库
          if (get().currentFolder?.id === options.folderId || !options.folderId) {
            await get().getMediaFiles();
          }
          
          return result;
        } catch (error) {
          get().updateTaskStatus(taskId, 'failed', (error as Error).message);
          throw error;
        }
      },

      uploadFiles: async (files: File[], options = {}) => {
        const results: UploadFile[] = [];
        const maxConcurrent = get().uploadConfig.maxConcurrent;
        
        // 分批上传
        for (let i = 0; i < files.length; i += maxConcurrent) {
          const batch = files.slice(i, i + maxConcurrent);
          const batchPromises = batch.map(file => get().uploadFile(file, options));
          
          try {
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
          } catch (error) {
            console.error('Batch upload failed:', error);
            // 继续上传剩余文件
          }
        }
        
        return results;
      },

      uploadImage: async (file: File, options = {}) => {
        const taskId = get().addUploadTask(file);
        
        try {
          get().updateTaskStatus(taskId, 'uploading');
          
          const result = await uploadAPI.uploadImage(file, {
            ...options,
            onProgress: (progress) => {
              get().updateTaskProgress(taskId, progress);
            },
          });
          
          get().updateTaskStatus(taskId, 'completed', undefined, result);
          
          // 刷新媒体库
          if (get().currentFolder?.id === options.folderId || !options.folderId) {
            await get().getMediaFiles();
          }
          
          return result;
        } catch (error) {
          get().updateTaskStatus(taskId, 'failed', (error as Error).message);
          throw error;
        }
      },

      uploadVideo: async (file: File, options = {}) => {
        const taskId = get().addUploadTask(file);
        
        try {
          get().updateTaskStatus(taskId, 'uploading');
          
          const result = await uploadAPI.uploadVideo(file, {
            ...options,
            onProgress: (progress) => {
              get().updateTaskProgress(taskId, progress);
            },
          });
          
          get().updateTaskStatus(taskId, 'completed', undefined, result);
          
          // 刷新媒体库
          if (get().currentFolder?.id === options.folderId || !options.folderId) {
            await get().getMediaFiles();
          }
          
          return result;
        } catch (error) {
          get().updateTaskStatus(taskId, 'failed', (error as Error).message);
          throw error;
        }
      },

      uploadDocument: async (file: File, options = {}) => {
        const taskId = get().addUploadTask(file);
        
        try {
          get().updateTaskStatus(taskId, 'uploading');
          
          const result = await uploadAPI.uploadDocument(file, {
            ...options,
            onProgress: (progress) => {
              get().updateTaskProgress(taskId, progress);
            },
          });
          
          get().updateTaskStatus(taskId, 'completed', undefined, result);
          
          // 刷新媒体库
          if (get().currentFolder?.id === options.folderId || !options.folderId) {
            await get().getMediaFiles();
          }
          
          return result;
        } catch (error) {
          get().updateTaskStatus(taskId, 'failed', (error as Error).message);
          throw error;
        }
      },

      // ==================== 分片上传 ====================
      
      initChunkUpload: async (file: File, options = {}) => {
        const chunkSize = options.chunkSize || get().uploadConfig.chunkSize;
        const uploadId = await uploadAPI.initChunkUpload(file, { chunkSize, ...options });
        
        // 创建上传任务
        const taskId = get().addUploadTask(file);
        set((state) => {
          const task = state.uploadTasks.find(t => t.id === taskId);
          if (task) {
            task.chunkInfo = {
              uploadId,
              totalChunks: Math.ceil(file.size / chunkSize),
              uploadedChunks: [],
            };
          }
        });
        
        return uploadId;
      },

      uploadChunk: async (uploadId: string, chunkIndex: number, chunk: Blob) => {
        await uploadAPI.uploadChunk(uploadId, chunkIndex, chunk);
        
        // 更新任务进度
        set((state) => {
          const task = state.uploadTasks.find(t => t.chunkInfo?.uploadId === uploadId);
          if (task && task.chunkInfo) {
            task.chunkInfo.uploadedChunks.push(chunkIndex);
            task.progress = (task.chunkInfo.uploadedChunks.length / task.chunkInfo.totalChunks) * 100;
          }
        });
      },

      completeChunkUpload: async (uploadId: string) => {
        const result = await uploadAPI.completeChunkUpload(uploadId);
        
        // 更新任务状态
        set((state) => {
          const task = state.uploadTasks.find(t => t.chunkInfo?.uploadId === uploadId);
          if (task) {
            task.status = 'completed';
            task.progress = 100;
            task.result = result;
          }
        });
        
        // 刷新媒体库
        await get().getMediaFiles();
        
        return result;
      },

      cancelChunkUpload: async (uploadId: string) => {
        await uploadAPI.cancelChunkUpload(uploadId);
        
        // 更新任务状态
        set((state) => {
          const task = state.uploadTasks.find(t => t.chunkInfo?.uploadId === uploadId);
          if (task) {
            task.status = 'cancelled';
          }
        });
      },

      getUploadedChunks: async (uploadId: string) => {
        return await uploadAPI.getUploadedChunks(uploadId);
      },

      // ==================== 上传任务管理 ====================
      
      addUploadTask: (file: File) => {
        const taskId = generateId();
        
        set((state) => {
          state.uploadTasks.push({
            id: taskId,
            file,
            progress: 0,
            status: 'pending',
            abortController: new AbortController(),
          });
          state.isUploading = true;
        });
        
        return taskId;
      },

      updateTaskProgress: (taskId: string, progress: number) => {
        set((state) => {
          const task = state.uploadTasks.find(t => t.id === taskId);
          if (task) {
            task.progress = progress;
          }
        });
      },

      updateTaskStatus: (taskId: string, status: UploadTask['status'], error?: string, result?: UploadFile) => {
        set((state) => {
          const task = state.uploadTasks.find(t => t.id === taskId);
          if (task) {
            task.status = status;
            if (error) task.error = error;
            if (result) task.result = result;
          }
          
          // 检查是否还有上传中的任务
          const hasUploadingTasks = state.uploadTasks.some(t => 
            t.status === 'uploading' || t.status === 'pending'
          );
          state.isUploading = hasUploadingTasks;
        });
      },

      cancelUploadTask: (taskId: string) => {
        set((state) => {
          const task = state.uploadTasks.find(t => t.id === taskId);
          if (task) {
            task.abortController?.abort();
            task.status = 'cancelled';
          }
        });
      },

      retryUploadTask: async (taskId: string) => {
        const task = get().uploadTasks.find(t => t.id === taskId);
        if (!task || task.status !== 'failed') return;
        
        try {
          await get().uploadFile(task.file);
        } catch (error) {
          console.error('Retry upload failed:', error);
        }
      },

      clearCompletedTasks: () => {
        set((state) => {
          state.uploadTasks = state.uploadTasks.filter(t => 
            t.status !== 'completed' && t.status !== 'failed' && t.status !== 'cancelled'
          );
        });
      },

      clearAllTasks: () => {
        set((state) => {
          // 取消所有进行中的任务
          state.uploadTasks.forEach(task => {
            if (task.status === 'uploading' || task.status === 'pending') {
              task.abortController?.abort();
            }
          });
          state.uploadTasks = [];
          state.isUploading = false;
        });
      },

      // ==================== 媒体库管理 ====================
      
      getMediaFiles: async (params?: MediaListParams) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const currentFilters = get().filters;
          const mergedParams = {
            page: get().pagination.page,
            pageSize: get().pagination.pageSize,
            folderId: get().currentFolder?.id,
            ...currentFilters,
            ...params,
          };

          const response = await uploadAPI.getMediaFiles(mergedParams);
          
          set((state) => {
            state.mediaFiles = response.data;
            state.pagination = {
              page: response.page,
              pageSize: response.pageSize,
              total: response.total,
              totalPages: response.totalPages,
            };
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getMediaFileById: async (id: string) => {
        const file = await uploadAPI.getMediaFileById(id);
        return file;
      },

      updateMediaFile: async (id: string, data: Partial<MediaFile>) => {
        try {
          const updatedFile = await uploadAPI.updateMediaFile(id, data);
          
          set((state) => {
            const index = state.mediaFiles.findIndex(f => f.id === id);
            if (index !== -1) {
              state.mediaFiles[index] = updatedFile;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteMediaFile: async (id: string) => {
        try {
          await uploadAPI.deleteMediaFile(id);
          
          set((state) => {
            state.mediaFiles = state.mediaFiles.filter(f => f.id !== id);
            state.selectedFiles = state.selectedFiles.filter(fId => fId !== id);
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteMediaFiles: async (ids: string[]) => {
        try {
          await uploadAPI.deleteMediaFiles(ids);
          
          set((state) => {
            state.mediaFiles = state.mediaFiles.filter(f => !ids.includes(f.id));
            state.selectedFiles = state.selectedFiles.filter(fId => !ids.includes(fId));
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      moveMediaFile: async (id: string, folderId: string) => {
        try {
          await uploadAPI.moveMediaFile(id, folderId);
          
          // 刷新当前文件夹
          await get().getMediaFiles();
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      copyMediaFile: async (id: string, folderId: string) => {
        try {
          await uploadAPI.copyMediaFile(id, folderId);
          
          // 刷新当前文件夹
          await get().getMediaFiles();
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 文件夹管理 ====================
      
      getFolders: async () => {
        try {
          const folders = await uploadAPI.getFolders();
          
          set((state) => {
            state.folders = folders;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      createFolder: async (name: string, parentId?: string) => {
        try {
          const newFolder = await uploadAPI.createFolder(name, parentId);
          
          set((state) => {
            state.folders.push(newFolder);
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      updateFolder: async (id: string, name: string) => {
        try {
          const updatedFolder = await uploadAPI.updateFolder(id, name);
          
          set((state) => {
            const index = state.folders.findIndex(f => f.id === id);
            if (index !== -1) {
              state.folders[index] = updatedFolder;
            }
            if (state.currentFolder?.id === id) {
              state.currentFolder = updatedFolder;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteFolder: async (id: string) => {
        try {
          await uploadAPI.deleteFolder(id);
          
          set((state) => {
            state.folders = state.folders.filter(f => f.id !== id);
            if (state.currentFolder?.id === id) {
              state.currentFolder = null;
            }
          });
          
          // 刷新媒体文件列表
          await get().getMediaFiles();
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      moveFolder: async (id: string, parentId: string) => {
        try {
          await uploadAPI.moveFolder(id, parentId);
          
          // 刷新文件夹列表
          await get().getFolders();
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      setCurrentFolder: (folder: MediaFolder | null) => {
        set((state) => {
          state.currentFolder = folder;
          state.selectedFiles = [];
        });
      },

      // ==================== 搜索和筛选 ====================
      
      searchMediaFiles: async (query: string, params?: MediaListParams) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.searchQuery = query;
        });

        try {
          const mergedParams = {
            page: 1,
            pageSize: get().pagination.pageSize,
            ...params,
          };

          const response = await uploadAPI.searchMediaFiles(query, mergedParams);
          
          set((state) => {
            state.mediaFiles = response.data;
            state.pagination = {
              page: response.page,
              pageSize: response.pageSize,
              total: response.total,
              totalPages: response.totalPages,
            };
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      setFilters: (filters: Partial<UploadState['filters']>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      clearFilters: () => {
        set((state) => {
          state.filters = {};
        });
      },

      clearSearch: () => {
        set((state) => {
          state.searchQuery = '';
        });
      },

      // ==================== 文件选择 ====================
      
      selectFile: (id: string) => {
        set((state) => {
          if (!state.selectedFiles.includes(id)) {
            state.selectedFiles.push(id);
          }
        });
      },

      selectFiles: (ids: string[]) => {
        set((state) => {
          ids.forEach(id => {
            if (!state.selectedFiles.includes(id)) {
              state.selectedFiles.push(id);
            }
          });
        });
      },

      unselectFile: (id: string) => {
        set((state) => {
          state.selectedFiles = state.selectedFiles.filter(fId => fId !== id);
        });
      },

      unselectFiles: (ids: string[]) => {
        set((state) => {
          state.selectedFiles = state.selectedFiles.filter(fId => !ids.includes(fId));
        });
      },

      selectAllFiles: () => {
        set((state) => {
          state.selectedFiles = state.mediaFiles.map(f => f.id);
        });
      },

      clearSelection: () => {
        set((state) => {
          state.selectedFiles = [];
        });
      },

      // ==================== 存储统计 ====================
      
      getStorageStats: async () => {
        try {
          const stats = await uploadAPI.getStorageStats();
          
          set((state) => {
            state.storageStats = stats;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 文件预览和下载 ====================
      
      getPreviewUrl: async (id: string) => {
        const response = await uploadAPI.getPreviewUrl(id);
        return response.url;
      },

      getDownloadUrl: async (id: string) => {
        const response = await uploadAPI.getDownloadUrl(id);
        return response.url;
      },

      downloadFile: async (id: string, filename?: string) => {
        try {
          const url = await get().getDownloadUrl(id);
          
          // 创建下载链接
          const link = document.createElement('a');
          link.href = url;
          if (filename) {
            link.download = filename;
          }
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 工具方法 ====================
      
      validateFile: (file: File) => {
        const config = get().uploadConfig;
        
        // 检查文件大小
        if (file.size > config.maxFileSize) {
          return {
            valid: false,
            error: `文件大小超过限制 (${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB)`,
          };
        }
        
        // 检查文件类型
        if (config.allowedTypes.length > 0 && !config.allowedTypes.includes(file.type)) {
          return {
            valid: false,
            error: '不支持的文件类型',
          };
        }
        
        return { valid: true };
      },

      compressImage: async (file: File, options = {}) => {
        return await uploadAPI.compressImage(file, options);
      },

      generateThumbnail: async (file: File, options = {}) => {
        return await uploadAPI.generateThumbnail(file, options);
      },

      // ==================== 状态管理 ====================
      
      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      reset: () => {
        set(() => ({ ...initialState }));
      },

      // ==================== 分页管理 ====================
      
      setPage: (page: number) => {
        set((state) => {
          state.pagination.page = page;
        });
      },

      setPageSize: (pageSize: number) => {
        set((state) => {
          state.pagination.pageSize = pageSize;
          state.pagination.page = 1; // 重置到第一页
        });
      },

      nextPage: () => {
        const { page, totalPages } = get().pagination;
        if (page < totalPages) {
          set((state) => {
            state.pagination.page = page + 1;
          });
        }
      },

      prevPage: () => {
        const { page } = get().pagination;
        if (page > 1) {
          set((state) => {
            state.pagination.page = page - 1;
          });
        }
      },

      // ==================== 配置管理 ====================
      
      updateUploadConfig: (config: Partial<UploadState['uploadConfig']>) => {
        set((state) => {
          state.uploadConfig = { ...state.uploadConfig, ...config };
        });
      },
    })),
    {
      name: 'upload-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        uploadConfig: state.uploadConfig,
        filters: state.filters,
        pagination: {
          pageSize: state.pagination.pageSize,
        },
      }),
    }
  ));

export default useUploadStore;