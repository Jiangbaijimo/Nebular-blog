/**
 * 上传状态管理
 * 管理文件上传、队列、进度、缓存等状态
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  UploadTask, 
  UploadStatus, 
  FileInfo, 
  UploadError, 
  UploadConfig,
  FileType,
  StorageType
} from '../types/upload';
import { httpClient } from '../services/http';
import { API_ENDPOINTS } from '../constants/api';
import { UPLOAD_CONFIG, UPLOAD_QUEUE_CONFIG, FILE_SIZE_LIMITS } from '../constants/upload';

// ==================== 类型定义 ====================

/**
 * 上传状态接口
 */
export interface UploadState {
  // 上传任务
  tasks: UploadTask[];
  activeUploads: Map<string, UploadTask>;
  completedUploads: UploadTask[];
  failedUploads: UploadTask[];
  
  // 队列状态
  queue: UploadTask[];
  isProcessing: boolean;
  maxConcurrent: number;
  
  // 全局状态
  isUploading: boolean;
  totalProgress: number;
  
  // 配置
  config: UploadConfig;
  
  // 错误状态
  errors: UploadError[];
  
  // 缓存状态
  localCache: Map<string, FileInfo>;
  cacheSize: number;
  maxCacheSize: number;
  
  // 统计信息
  stats: {
    totalUploaded: number;
    totalSize: number;
    successCount: number;
    failureCount: number;
    averageSpeed: number;
  };
}

/**
 * 上传操作接口
 */
export interface UploadActions {
  // 文件上传
  uploadFile: (file: File, options?: Partial<UploadTask>) => Promise<FileInfo>;
  uploadFiles: (files: File[], options?: Partial<UploadTask>) => Promise<FileInfo[]>;
  uploadFromUrl: (url: string, options?: Partial<UploadTask>) => Promise<FileInfo>;
  
  // 队列管理
  addToQueue: (task: UploadTask) => void;
  removeFromQueue: (taskId: string) => void;
  clearQueue: () => void;
  processQueue: () => Promise<void>;
  pauseQueue: () => void;
  resumeQueue: () => void;
  
  // 任务控制
  pauseUpload: (taskId: string) => void;
  resumeUpload: (taskId: string) => void;
  cancelUpload: (taskId: string) => void;
  retryUpload: (taskId: string) => Promise<void>;
  
  // 批量操作
  pauseAllUploads: () => void;
  resumeAllUploads: () => void;
  cancelAllUploads: () => void;
  retryFailedUploads: () => Promise<void>;
  
  // 缓存管理
  addToCache: (fileInfo: FileInfo) => void;
  removeFromCache: (fileId: string) => void;
  clearCache: () => void;
  getCachedFile: (fileId: string) => FileInfo | null;
  
  // 配置管理
  updateConfig: (config: Partial<UploadConfig>) => void;
  resetConfig: () => void;
  
  // 错误处理
  addError: (error: UploadError) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  
  // 统计信息
  updateStats: (stats: Partial<UploadState['stats']>) => void;
  resetStats: () => void;
  
  // 清理操作
  cleanupCompleted: () => void;
  cleanupFailed: () => void;
  
  // 重置状态
  reset: () => void;
}

// ==================== 默认状态 ====================

const initialUploadState: UploadState = {
  tasks: [],
  activeUploads: new Map(),
  completedUploads: [],
  failedUploads: [],
  queue: [],
  isProcessing: false,
  maxConcurrent: UPLOAD_QUEUE_CONFIG.MAX_CONCURRENT,
  isUploading: false,
  totalProgress: 0,
  config: UPLOAD_CONFIG,
  errors: [],
  localCache: new Map(),
  cacheSize: 0,
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  stats: {
    totalUploaded: 0,
    totalSize: 0,
    successCount: 0,
    failureCount: 0,
    averageSpeed: 0
  }
};

// ==================== 工具函数 ====================

/**
 * 生成唯一任务ID
 */
const generateTaskId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 检测文件类型
 */
const detectFileType = (file: File): FileType => {
  const mimeType = file.type;
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType.includes('text/') || mimeType.includes('document')) return 'document';
  
  return 'other';
};

/**
 * 验证文件大小
 */
const validateFileSize = (file: File): boolean => {
  const fileType = detectFileType(file);
  const maxSize = FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.other;
  return file.size <= maxSize;
};

/**
 * 计算总进度
 */
const calculateTotalProgress = (tasks: UploadTask[]): number => {
  if (tasks.length === 0) return 0;
  
  const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
  return Math.round(totalProgress / tasks.length);
};

/**
 * 创建上传任务
 */
const createUploadTask = (file: File, options: Partial<UploadTask> = {}): UploadTask => {
  const taskId = generateTaskId();
  const fileType = detectFileType(file);
  
  return {
    id: taskId,
    file,
    fileName: file.name,
    fileSize: file.size,
    fileType,
    mimeType: file.type,
    status: 'pending',
    progress: 0,
    uploadedBytes: 0,
    speed: 0,
    remainingTime: 0,
    startTime: Date.now(),
    storageType: 'cloud',
    retryCount: 0,
    maxRetries: 3,
    ...options
  };
};

// ==================== 上传Store ====================

export const useUploadStore = create<UploadState & UploadActions>()()
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialUploadState,

          // 上传单个文件
          uploadFile: async (file, options = {}) => {
            // 验证文件
            if (!validateFileSize(file)) {
              throw new Error(`File size exceeds limit for ${detectFileType(file)} files`);
            }

            const task = createUploadTask(file, options);
            
            set((state) => {
              state.tasks.push(task);
              state.isUploading = true;
            });

            try {
              // 检查是否启用队列
              if (get().config.enableQueue) {
                get().addToQueue(task);
                get().processQueue();
                
                // 等待任务完成
                return new Promise((resolve, reject) => {
                  const unsubscribe = useUploadStore.subscribe(
                    (state) => state.tasks.find(t => t.id === task.id),
                    (updatedTask) => {
                      if (updatedTask?.status === 'completed' && updatedTask.result) {
                        unsubscribe();
                        resolve(updatedTask.result);
                      } else if (updatedTask?.status === 'failed') {
                        unsubscribe();
                        reject(new Error(updatedTask.error?.message || 'Upload failed'));
                      }
                    }
                  );
                });
              } else {
                // 直接上传
                return get().executeUpload(task);
              }
            } catch (error) {
              set((state) => {
                const taskIndex = state.tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                  state.tasks[taskIndex].status = 'failed';
                  state.tasks[taskIndex].error = {
                    code: 'UPLOAD_ERROR',
                    message: error instanceof Error ? error.message : 'Upload failed',
                    timestamp: new Date().toISOString()
                  };
                  state.failedUploads.push(state.tasks[taskIndex]);
                }
                state.isUploading = state.tasks.some(t => t.status === 'uploading');
              });
              throw error;
            }
          },

          // 上传多个文件
          uploadFiles: async (files, options = {}) => {
            const tasks = files.map(file => {
              if (!validateFileSize(file)) {
                throw new Error(`File ${file.name} exceeds size limit`);
              }
              return createUploadTask(file, options);
            });

            set((state) => {
              state.tasks.push(...tasks);
              state.isUploading = true;
            });

            try {
              if (get().config.enableQueue) {
                // 添加到队列
                tasks.forEach(task => get().addToQueue(task));
                get().processQueue();
                
                // 等待所有任务完成
                return Promise.all(tasks.map(task => 
                  new Promise<FileInfo>((resolve, reject) => {
                    const unsubscribe = useUploadStore.subscribe(
                      (state) => state.tasks.find(t => t.id === task.id),
                      (updatedTask) => {
                        if (updatedTask?.status === 'completed' && updatedTask.result) {
                          unsubscribe();
                          resolve(updatedTask.result);
                        } else if (updatedTask?.status === 'failed') {
                          unsubscribe();
                          reject(new Error(updatedTask.error?.message || 'Upload failed'));
                        }
                      }
                    );
                  })
                ));
              } else {
                // 并发上传
                return Promise.all(tasks.map(task => get().executeUpload(task)));
              }
            } catch (error) {
              set((state) => {
                tasks.forEach(task => {
                  const taskIndex = state.tasks.findIndex(t => t.id === task.id);
                  if (taskIndex !== -1) {
                    state.tasks[taskIndex].status = 'failed';
                    state.tasks[taskIndex].error = {
                      code: 'UPLOAD_ERROR',
                      message: error instanceof Error ? error.message : 'Upload failed',
                      timestamp: new Date().toISOString()
                    };
                    state.failedUploads.push(state.tasks[taskIndex]);
                  }
                });
                state.isUploading = state.tasks.some(t => t.status === 'uploading');
              });
              throw error;
            }
          },

          // 从URL上传
          uploadFromUrl: async (url, options = {}) => {
            const task = {
              id: generateTaskId(),
              fileName: url.split('/').pop() || 'unknown',
              fileSize: 0,
              fileType: 'other' as FileType,
              mimeType: 'application/octet-stream',
              status: 'pending' as UploadStatus,
              progress: 0,
              uploadedBytes: 0,
              speed: 0,
              remainingTime: 0,
              startTime: Date.now(),
              storageType: 'cloud' as StorageType,
              retryCount: 0,
              maxRetries: 3,
              sourceUrl: url,
              ...options
            };

            set((state) => {
              state.tasks.push(task);
              state.isUploading = true;
            });

            try {
              const response = await httpClient.post(API_ENDPOINTS.UPLOAD.FROM_URL, {
                url,
                ...options
              });

              if (response.success) {
                const fileInfo = response.data;
                
                set((state) => {
                  const taskIndex = state.tasks.findIndex(t => t.id === task.id);
                  if (taskIndex !== -1) {
                    state.tasks[taskIndex].status = 'completed';
                    state.tasks[taskIndex].progress = 100;
                    state.tasks[taskIndex].result = fileInfo;
                    state.completedUploads.push(state.tasks[taskIndex]);
                  }
                  state.isUploading = state.tasks.some(t => t.status === 'uploading');
                });

                get().addToCache(fileInfo);
                return fileInfo;
              }
              throw new Error('Failed to upload from URL');
            } catch (error) {
              set((state) => {
                const taskIndex = state.tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                  state.tasks[taskIndex].status = 'failed';
                  state.tasks[taskIndex].error = {
                    code: 'URL_UPLOAD_ERROR',
                    message: error instanceof Error ? error.message : 'URL upload failed',
                    timestamp: new Date().toISOString()
                  };
                  state.failedUploads.push(state.tasks[taskIndex]);
                }
                state.isUploading = state.tasks.some(t => t.status === 'uploading');
              });
              throw error;
            }
          },

          // 执行上传（内部方法）
          executeUpload: async (task: UploadTask): Promise<FileInfo> => {
            set((state) => {
              const taskIndex = state.tasks.findIndex(t => t.id === task.id);
              if (taskIndex !== -1) {
                state.tasks[taskIndex].status = 'uploading';
                state.tasks[taskIndex].startTime = Date.now();
                state.activeUploads.set(task.id, state.tasks[taskIndex]);
              }
            });

            try {
              const response = await httpClient.upload(
                API_ENDPOINTS.UPLOAD.FILE,
                task.file!,
                {
                  onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                      (progressEvent.loaded * 100) / (progressEvent.total || 1)
                    );
                    
                    const now = Date.now();
                    const elapsed = (now - task.startTime) / 1000;
                    const speed = progressEvent.loaded / elapsed;
                    const remainingBytes = (progressEvent.total || 0) - progressEvent.loaded;
                    const remainingTime = speed > 0 ? remainingBytes / speed : 0;

                    set((state) => {
                      const taskIndex = state.tasks.findIndex(t => t.id === task.id);
                      if (taskIndex !== -1) {
                        state.tasks[taskIndex].progress = progress;
                        state.tasks[taskIndex].uploadedBytes = progressEvent.loaded;
                        state.tasks[taskIndex].speed = speed;
                        state.tasks[taskIndex].remainingTime = remainingTime;
                        state.activeUploads.set(task.id, state.tasks[taskIndex]);
                      }
                      
                      // 更新总进度
                      state.totalProgress = calculateTotalProgress(
                        state.tasks.filter(t => t.status === 'uploading' || t.status === 'completed')
                      );
                    });
                  },
                  data: {
                    storageType: task.storageType,
                    category: task.category,
                    tags: task.tags
                  }
                }
              );

              if (response.success) {
                const fileInfo = response.data;
                
                set((state) => {
                  const taskIndex = state.tasks.findIndex(t => t.id === task.id);
                  if (taskIndex !== -1) {
                    state.tasks[taskIndex].status = 'completed';
                    state.tasks[taskIndex].progress = 100;
                    state.tasks[taskIndex].result = fileInfo;
                    state.tasks[taskIndex].endTime = Date.now();
                    state.completedUploads.push(state.tasks[taskIndex]);
                    state.activeUploads.delete(task.id);
                  }
                  
                  // 更新统计
                  state.stats.successCount += 1;
                  state.stats.totalUploaded += task.fileSize;
                  state.stats.totalSize += task.fileSize;
                  
                  state.isUploading = state.tasks.some(t => t.status === 'uploading');
                });

                get().addToCache(fileInfo);
                
                // 触发上传完成事件
                window.dispatchEvent(new CustomEvent('upload-completed', {
                  detail: { task, fileInfo }
                }));

                return fileInfo;
              }
              throw new Error('Upload failed');
            } catch (error) {
              set((state) => {
                const taskIndex = state.tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                  state.tasks[taskIndex].status = 'failed';
                  state.tasks[taskIndex].error = {
                    code: 'UPLOAD_ERROR',
                    message: error instanceof Error ? error.message : 'Upload failed',
                    timestamp: new Date().toISOString()
                  };
                  state.tasks[taskIndex].endTime = Date.now();
                  state.failedUploads.push(state.tasks[taskIndex]);
                  state.activeUploads.delete(task.id);
                }
                
                // 更新统计
                state.stats.failureCount += 1;
                state.isUploading = state.tasks.some(t => t.status === 'uploading');
              });
              
              // 触发上传失败事件
              window.dispatchEvent(new CustomEvent('upload-failed', {
                detail: { task, error }
              }));
              
              throw error;
            }
          },

          // 添加到队列
          addToQueue: (task) => {
            set((state) => {
              if (!state.queue.find(t => t.id === task.id)) {
                state.queue.push(task);
              }
            });
          },

          // 从队列移除
          removeFromQueue: (taskId) => {
            set((state) => {
              state.queue = state.queue.filter(task => task.id !== taskId);
            });
          },

          // 清空队列
          clearQueue: () => {
            set((state) => {
              state.queue = [];
            });
          },

          // 处理队列
          processQueue: async () => {
            const state = get();
            
            if (state.isProcessing || state.queue.length === 0) {
              return;
            }

            set((state) => {
              state.isProcessing = true;
            });

            try {
              while (state.queue.length > 0 && state.activeUploads.size < state.maxConcurrent) {
                const task = state.queue.shift();
                if (task) {
                  get().removeFromQueue(task.id);
                  get().executeUpload(task).catch(console.error);
                }
              }
            } finally {
              set((state) => {
                state.isProcessing = false;
              });
            }
          },

          // 暂停队列
          pauseQueue: () => {
            set((state) => {
              state.isProcessing = false;
            });
          },

          // 恢复队列
          resumeQueue: () => {
            get().processQueue();
          },

          // 暂停上传
          pauseUpload: (taskId) => {
            set((state) => {
              const taskIndex = state.tasks.findIndex(t => t.id === taskId);
              if (taskIndex !== -1 && state.tasks[taskIndex].status === 'uploading') {
                state.tasks[taskIndex].status = 'paused';
                state.activeUploads.delete(taskId);
              }
            });
          },

          // 恢复上传
          resumeUpload: (taskId) => {
            const task = get().tasks.find(t => t.id === taskId);
            if (task && task.status === 'paused') {
              set((state) => {
                const taskIndex = state.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                  state.tasks[taskIndex].status = 'pending';
                }
              });
              
              if (get().config.enableQueue) {
                get().addToQueue(task);
                get().processQueue();
              } else {
                get().executeUpload(task).catch(console.error);
              }
            }
          },

          // 取消上传
          cancelUpload: (taskId) => {
            set((state) => {
              const taskIndex = state.tasks.findIndex(t => t.id === taskId);
              if (taskIndex !== -1) {
                state.tasks[taskIndex].status = 'cancelled';
                state.tasks[taskIndex].endTime = Date.now();
                state.activeUploads.delete(taskId);
              }
              state.queue = state.queue.filter(task => task.id !== taskId);
              state.isUploading = state.tasks.some(t => t.status === 'uploading');
            });
          },

          // 重试上传
          retryUpload: async (taskId) => {
            const task = get().tasks.find(t => t.id === taskId);
            if (task && (task.status === 'failed' || task.status === 'cancelled')) {
              if (task.retryCount < task.maxRetries) {
                set((state) => {
                  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
                  if (taskIndex !== -1) {
                    state.tasks[taskIndex].status = 'pending';
                    state.tasks[taskIndex].retryCount += 1;
                    state.tasks[taskIndex].error = undefined;
                    state.tasks[taskIndex].progress = 0;
                    state.tasks[taskIndex].uploadedBytes = 0;
                  }
                  state.failedUploads = state.failedUploads.filter(t => t.id !== taskId);
                });
                
                if (get().config.enableQueue) {
                  get().addToQueue(task);
                  get().processQueue();
                } else {
                  await get().executeUpload(task);
                }
              } else {
                throw new Error('Maximum retry attempts exceeded');
              }
            }
          },

          // 暂停所有上传
          pauseAllUploads: () => {
            set((state) => {
              state.tasks.forEach(task => {
                if (task.status === 'uploading') {
                  task.status = 'paused';
                }
              });
              state.activeUploads.clear();
              state.isProcessing = false;
            });
          },

          // 恢复所有上传
          resumeAllUploads: () => {
            const pausedTasks = get().tasks.filter(t => t.status === 'paused');
            pausedTasks.forEach(task => {
              get().resumeUpload(task.id);
            });
          },

          // 取消所有上传
          cancelAllUploads: () => {
            set((state) => {
              state.tasks.forEach(task => {
                if (task.status === 'uploading' || task.status === 'pending' || task.status === 'paused') {
                  task.status = 'cancelled';
                  task.endTime = Date.now();
                }
              });
              state.activeUploads.clear();
              state.queue = [];
              state.isProcessing = false;
              state.isUploading = false;
            });
          },

          // 重试失败的上传
          retryFailedUploads: async () => {
            const failedTasks = get().failedUploads.filter(task => task.retryCount < task.maxRetries);
            
            for (const task of failedTasks) {
              try {
                await get().retryUpload(task.id);
              } catch (error) {
                console.error(`Failed to retry upload ${task.id}:`, error);
              }
            }
          },

          // 添加到缓存
          addToCache: (fileInfo) => {
            set((state) => {
              // 检查缓存大小
              if (state.cacheSize + (fileInfo.size || 0) > state.maxCacheSize) {
                // 清理最旧的缓存项
                const entries = Array.from(state.localCache.entries());
                entries.sort((a, b) => (a[1].uploadedAt || 0) - (b[1].uploadedAt || 0));
                
                for (const [key, value] of entries) {
                  state.localCache.delete(key);
                  state.cacheSize -= value.size || 0;
                  
                  if (state.cacheSize + (fileInfo.size || 0) <= state.maxCacheSize) {
                    break;
                  }
                }
              }
              
              state.localCache.set(fileInfo.id, fileInfo);
              state.cacheSize += fileInfo.size || 0;
            });
          },

          // 从缓存移除
          removeFromCache: (fileId) => {
            set((state) => {
              const fileInfo = state.localCache.get(fileId);
              if (fileInfo) {
                state.localCache.delete(fileId);
                state.cacheSize -= fileInfo.size || 0;
              }
            });
          },

          // 清空缓存
          clearCache: () => {
            set((state) => {
              state.localCache.clear();
              state.cacheSize = 0;
            });
          },

          // 获取缓存文件
          getCachedFile: (fileId) => {
            return get().localCache.get(fileId) || null;
          },

          // 更新配置
          updateConfig: (config) => {
            set((state) => {
              state.config = { ...state.config, ...config };
            });
          },

          // 重置配置
          resetConfig: () => {
            set((state) => {
              state.config = UPLOAD_CONFIG;
            });
          },

          // 添加错误
          addError: (error) => {
            set((state) => {
              state.errors.push(error);
              
              // 限制错误数量
              if (state.errors.length > 100) {
                state.errors = state.errors.slice(-50);
              }
            });
          },

          // 移除错误
          removeError: (errorId) => {
            set((state) => {
              state.errors = state.errors.filter(error => error.id !== errorId);
            });
          },

          // 清空错误
          clearErrors: () => {
            set((state) => {
              state.errors = [];
            });
          },

          // 更新统计
          updateStats: (stats) => {
            set((state) => {
              state.stats = { ...state.stats, ...stats };
            });
          },

          // 重置统计
          resetStats: () => {
            set((state) => {
              state.stats = initialUploadState.stats;
            });
          },

          // 清理已完成的任务
          cleanupCompleted: () => {
            set((state) => {
              state.tasks = state.tasks.filter(task => task.status !== 'completed');
              state.completedUploads = [];
            });
          },

          // 清理失败的任务
          cleanupFailed: () => {
            set((state) => {
              state.tasks = state.tasks.filter(task => task.status !== 'failed');
              state.failedUploads = [];
            });
          },

          // 重置状态
          reset: () => {
            set(() => ({ ...initialUploadState }));
          }
        }))
      ),
      {
        name: 'upload-store',
        partialize: (state) => ({
          config: state.config,
          stats: state.stats,
          // 不持久化大型对象如文件和缓存
        })
      }
    ),
    {
      name: 'upload-store'
    }
  );

// ==================== 导出工具函数 ====================

/**
 * 获取上传任务列表
 */
export const useUploadTasks = () => {
  return useUploadStore((state) => state.tasks);
};

/**
 * 获取活跃上传
 */
export const useActiveUploads = () => {
  return useUploadStore((state) => Array.from(state.activeUploads.values()));
};

/**
 * 获取上传队列
 */
export const useUploadQueue = () => {
  return useUploadStore((state) => state.queue);
};

/**
 * 获取上传统计
 */
export const useUploadStats = () => {
  return useUploadStore((state) => state.stats);
};

/**
 * 获取上传状态
 */
export const useUploadStatus = () => {
  return useUploadStore((state) => ({
    isUploading: state.isUploading,
    isProcessing: state.isProcessing,
    totalProgress: state.totalProgress,
    activeCount: state.activeUploads.size,
    queueCount: state.queue.length
  }));
};

/**
 * 获取上传错误
 */
export const useUploadErrors = () => {
  return useUploadStore((state) => state.errors);
};

/**
 * 获取缓存信息
 */
export const useCacheInfo = () => {
  return useUploadStore((state) => ({
    size: state.cacheSize,
    maxSize: state.maxCacheSize,
    count: state.localCache.size,
    usage: (state.cacheSize / state.maxCacheSize) * 100
  }));
};