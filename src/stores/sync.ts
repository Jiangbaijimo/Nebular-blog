/**
 * 同步状态管理
 * 管理数据同步、冲突解决、离线支持等状态
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  SyncItem, 
  SyncStatus, 
  SyncOperation, 
  ConflictData, 
  SyncTask, 
  SyncError, 
  SyncConfig,
  DataStatus,
  ConflictResolutionStrategy,
  SyncDirection
} from '../types/sync';
import { httpClient } from '../services/http';
import { API_ENDPOINTS } from '../constants/api';

// ==================== 类型定义 ====================

/**
 * 同步状态接口
 */
export interface SyncState {
  // 同步项目
  items: Map<string, SyncItem>;
  pendingItems: SyncItem[];
  conflictItems: ConflictData[];
  
  // 同步任务
  activeTasks: Map<string, SyncTask>;
  taskQueue: SyncTask[];
  
  // 全局状态
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  nextSyncTime: number;
  
  // 配置
  config: SyncConfig;
  
  // 错误状态
  errors: SyncError[];
  
  // 统计信息
  stats: {
    totalSynced: number;
    successCount: number;
    failureCount: number;
    conflictCount: number;
    lastSyncDuration: number;
    averageSyncTime: number;
  };
  
  // 离线队列
  offlineQueue: SyncOperation[];
  
  // 数据完整性
  checksums: Map<string, string>;
  corruptedItems: string[];
}

/**
 * 同步操作接口
 */
export interface SyncActions {
  // 同步操作
  sync: (options?: Partial<SyncConfig>) => Promise<void>;
  syncItem: (itemId: string, direction?: SyncDirection) => Promise<void>;
  syncBatch: (itemIds: string[], direction?: SyncDirection) => Promise<void>;
  
  // 增量同步
  incrementalSync: (since?: number) => Promise<void>;
  
  // 冲突处理
  resolveConflict: (conflictId: string, strategy: ConflictResolutionStrategy, data?: any) => Promise<void>;
  resolveAllConflicts: (strategy: ConflictResolutionStrategy) => Promise<void>;
  
  // 离线支持
  addToOfflineQueue: (operation: SyncOperation) => void;
  processOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
  
  // 数据管理
  addItem: (item: SyncItem) => void;
  updateItem: (itemId: string, updates: Partial<SyncItem>) => void;
  removeItem: (itemId: string) => void;
  getItem: (itemId: string) => SyncItem | null;
  
  // 状态管理
  setOnlineStatus: (isOnline: boolean) => void;
  updateSyncStatus: (isSyncing: boolean) => void;
  
  // 配置管理
  updateConfig: (config: Partial<SyncConfig>) => void;
  resetConfig: () => void;
  
  // 错误处理
  addError: (error: SyncError) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  
  // 数据完整性
  validateData: () => Promise<void>;
  repairData: (itemIds?: string[]) => Promise<void>;
  calculateChecksum: (data: any) => string;
  
  // 统计信息
  updateStats: (stats: Partial<SyncState['stats']>) => void;
  resetStats: () => void;
  
  // 清理操作
  cleanup: () => void;
  
  // 重置状态
  reset: () => void;
}

// ==================== 默认状态 ====================

const defaultSyncConfig: SyncConfig = {
  autoSync: true,
  syncInterval: 30000, // 30秒
  retryAttempts: 3,
  retryDelay: 1000,
  batchSize: 50,
  conflictResolution: 'manual',
  enableOfflineQueue: true,
  enableDataValidation: true,
  enableCompression: false,
  syncDirection: 'bidirectional',
  priority: 'normal'
};

const initialSyncState: SyncState = {
  items: new Map(),
  pendingItems: [],
  conflictItems: [],
  activeTasks: new Map(),
  taskQueue: [],
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncTime: 0,
  nextSyncTime: 0,
  config: defaultSyncConfig,
  errors: [],
  stats: {
    totalSynced: 0,
    successCount: 0,
    failureCount: 0,
    conflictCount: 0,
    lastSyncDuration: 0,
    averageSyncTime: 0
  },
  offlineQueue: [],
  checksums: new Map(),
  corruptedItems: []
};

// ==================== 工具函数 ====================

/**
 * 生成唯一任务ID
 */
const generateTaskId = (): string => {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 计算数据校验和
 */
const calculateChecksum = (data: any): string => {
  const str = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString(16);
};

/**
 * 检测冲突
 */
const detectConflict = (localItem: SyncItem, remoteItem: SyncItem): boolean => {
  return (
    localItem.lastModified !== remoteItem.lastModified &&
    localItem.version !== remoteItem.version
  );
};

/**
 * 创建同步任务
 */
const createSyncTask = (itemId: string, operation: SyncOperation, direction: SyncDirection = 'bidirectional'): SyncTask => {
  return {
    id: generateTaskId(),
    itemId,
    operation,
    direction,
    status: 'pending',
    progress: 0,
    startTime: Date.now(),
    retryCount: 0,
    priority: 'normal'
  };
};

// ==================== 同步Store ====================

export const useSyncStore = create<SyncState & SyncActions>()()
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialSyncState,

          // 主同步方法
          sync: async (options = {}) => {
            const state = get();
            
            if (state.isSyncing) {
              console.warn('Sync already in progress');
              return;
            }

            if (!state.isOnline) {
              console.warn('Cannot sync while offline');
              return;
            }

            const config = { ...state.config, ...options };
            const startTime = Date.now();

            set((state) => {
              state.isSyncing = true;
              state.lastSyncTime = startTime;
            });

            try {
              // 获取远程更改
              const response = await httpClient.get(API_ENDPOINTS.SYNC.CHANGES, {
                params: {
                  since: state.lastSyncTime,
                  limit: config.batchSize
                }
              });

              if (response.success) {
                const remoteChanges = response.data.changes || [];
                
                // 处理远程更改
                for (const change of remoteChanges) {
                  await get().processRemoteChange(change);
                }

                // 推送本地更改
                await get().pushLocalChanges(config);

                // 更新统计
                const duration = Date.now() - startTime;
                set((state) => {
                  state.stats.successCount += 1;
                  state.stats.lastSyncDuration = duration;
                  state.stats.averageSyncTime = 
                    (state.stats.averageSyncTime * (state.stats.successCount - 1) + duration) / state.stats.successCount;
                });

                // 触发同步完成事件
                window.dispatchEvent(new CustomEvent('sync-completed', {
                  detail: { duration, changesCount: remoteChanges.length }
                }));
              }
            } catch (error) {
              const syncError: SyncError = {
                id: generateTaskId(),
                code: 'SYNC_ERROR',
                message: error instanceof Error ? error.message : 'Sync failed',
                timestamp: new Date().toISOString(),
                context: { operation: 'full_sync' }
              };

              get().addError(syncError);
              
              set((state) => {
                state.stats.failureCount += 1;
              });

              // 触发同步失败事件
              window.dispatchEvent(new CustomEvent('sync-failed', {
                detail: { error: syncError }
              }));

              throw error;
            } finally {
              set((state) => {
                state.isSyncing = false;
                state.nextSyncTime = Date.now() + config.syncInterval;
              });
            }
          },

          // 同步单个项目
          syncItem: async (itemId, direction = 'bidirectional') => {
            const item = get().getItem(itemId);
            if (!item) {
              throw new Error(`Item ${itemId} not found`);
            }

            const task = createSyncTask(itemId, 'update', direction);
            
            set((state) => {
              state.activeTasks.set(task.id, task);
            });

            try {
              await get().executeTask(task);
            } finally {
              set((state) => {
                state.activeTasks.delete(task.id);
              });
            }
          },

          // 批量同步
          syncBatch: async (itemIds, direction = 'bidirectional') => {
            const tasks = itemIds.map(itemId => createSyncTask(itemId, 'update', direction));
            
            set((state) => {
              tasks.forEach(task => {
                state.activeTasks.set(task.id, task);
              });
            });

            try {
              await Promise.all(tasks.map(task => get().executeTask(task)));
            } finally {
              set((state) => {
                tasks.forEach(task => {
                  state.activeTasks.delete(task.id);
                });
              });
            }
          },

          // 增量同步
          incrementalSync: async (since) => {
            const state = get();
            const timestamp = since || state.lastSyncTime;

            try {
              const response = await httpClient.get(API_ENDPOINTS.SYNC.INCREMENTAL, {
                params: { since: timestamp }
              });

              if (response.success) {
                const changes = response.data.changes || [];
                
                for (const change of changes) {
                  await get().processRemoteChange(change);
                }

                set((state) => {
                  state.lastSyncTime = Math.max(state.lastSyncTime, response.data.timestamp || Date.now());
                });
              }
            } catch (error) {
              console.error('Incremental sync failed:', error);
              throw error;
            }
          },

          // 处理远程更改
          processRemoteChange: async (change: any) => {
            const { itemId, operation, data, timestamp } = change;
            const localItem = get().getItem(itemId);

            switch (operation) {
              case 'create':
                if (!localItem) {
                  get().addItem({
                    id: itemId,
                    data,
                    status: 'synced',
                    lastModified: timestamp,
                    version: data.version || 1,
                    checksum: get().calculateChecksum(data)
                  });
                } else {
                  // 冲突：远程创建但本地已存在
                  get().handleConflict(itemId, localItem, {
                    id: itemId,
                    data,
                    status: 'synced',
                    lastModified: timestamp,
                    version: data.version || 1,
                    checksum: get().calculateChecksum(data)
                  });
                }
                break;

              case 'update':
                if (localItem) {
                  if (detectConflict(localItem, { ...localItem, lastModified: timestamp, version: data.version })) {
                    get().handleConflict(itemId, localItem, {
                      id: itemId,
                      data,
                      status: 'synced',
                      lastModified: timestamp,
                      version: data.version || localItem.version + 1,
                      checksum: get().calculateChecksum(data)
                    });
                  } else {
                    get().updateItem(itemId, {
                      data,
                      status: 'synced',
                      lastModified: timestamp,
                      version: data.version || localItem.version + 1,
                      checksum: get().calculateChecksum(data)
                    });
                  }
                } else {
                  // 远程更新但本地不存在，当作创建处理
                  get().addItem({
                    id: itemId,
                    data,
                    status: 'synced',
                    lastModified: timestamp,
                    version: data.version || 1,
                    checksum: get().calculateChecksum(data)
                  });
                }
                break;

              case 'delete':
                if (localItem) {
                  if (localItem.status === 'modified') {
                    // 冲突：远程删除但本地已修改
                    get().handleConflict(itemId, localItem, null);
                  } else {
                    get().removeItem(itemId);
                  }
                }
                break;
            }
          },

          // 推送本地更改
          pushLocalChanges: async (config: SyncConfig) => {
            const state = get();
            const pendingItems = state.pendingItems.slice(0, config.batchSize);

            if (pendingItems.length === 0) {
              return;
            }

            try {
              const changes = pendingItems.map(item => ({
                itemId: item.id,
                operation: item.status === 'deleted' ? 'delete' : 
                          item.version === 1 ? 'create' : 'update',
                data: item.data,
                version: item.version,
                checksum: item.checksum
              }));

              const response = await httpClient.post(API_ENDPOINTS.SYNC.PUSH, {
                changes
              });

              if (response.success) {
                // 更新成功推送的项目状态
                const succeededIds = response.data.succeeded || [];
                const conflicts = response.data.conflicts || [];

                set((state) => {
                  succeededIds.forEach((itemId: string) => {
                    const item = state.items.get(itemId);
                    if (item) {
                      item.status = 'synced';
                      state.pendingItems = state.pendingItems.filter(p => p.id !== itemId);
                    }
                  });

                  // 处理冲突
                  conflicts.forEach((conflict: any) => {
                    get().handleConflict(conflict.itemId, 
                      state.items.get(conflict.itemId)!, 
                      conflict.remoteData
                    );
                  });
                });
              }
            } catch (error) {
              console.error('Failed to push local changes:', error);
              throw error;
            }
          },

          // 处理冲突
          handleConflict: (itemId: string, localItem: SyncItem, remoteItem: SyncItem | null) => {
            const conflict: ConflictData = {
              id: generateTaskId(),
              itemId,
              localData: localItem,
              remoteData: remoteItem,
              timestamp: Date.now(),
              status: 'pending'
            };

            set((state) => {
              state.conflictItems.push(conflict);
              state.stats.conflictCount += 1;
            });

            // 触发冲突事件
            window.dispatchEvent(new CustomEvent('sync-conflict', {
              detail: { conflict }
            }));

            // 自动解决冲突（如果配置了自动策略）
            const config = get().config;
            if (config.conflictResolution !== 'manual') {
              get().resolveConflict(conflict.id, config.conflictResolution);
            }
          },

          // 解决冲突
          resolveConflict: async (conflictId, strategy, data) => {
            const state = get();
            const conflict = state.conflictItems.find(c => c.id === conflictId);
            
            if (!conflict) {
              throw new Error(`Conflict ${conflictId} not found`);
            }

            let resolvedData: any;

            switch (strategy) {
              case 'local_wins':
                resolvedData = conflict.localData;
                break;
              case 'remote_wins':
                resolvedData = conflict.remoteData;
                break;
              case 'merge':
                resolvedData = get().mergeData(conflict.localData, conflict.remoteData);
                break;
              case 'custom':
                resolvedData = data;
                break;
              default:
                throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
            }

            try {
              // 应用解决方案
              if (resolvedData) {
                get().updateItem(conflict.itemId, {
                  data: resolvedData.data,
                  status: 'modified',
                  lastModified: Date.now(),
                  version: Math.max(
                    conflict.localData?.version || 0,
                    conflict.remoteData?.version || 0
                  ) + 1,
                  checksum: get().calculateChecksum(resolvedData.data)
                });
              } else {
                // 删除项目
                get().removeItem(conflict.itemId);
              }

              // 移除冲突
              set((state) => {
                state.conflictItems = state.conflictItems.filter(c => c.id !== conflictId);
              });

              // 触发冲突解决事件
              window.dispatchEvent(new CustomEvent('conflict-resolved', {
                detail: { conflictId, strategy, resolvedData }
              }));
            } catch (error) {
              console.error('Failed to resolve conflict:', error);
              throw error;
            }
          },

          // 解决所有冲突
          resolveAllConflicts: async (strategy) => {
            const conflicts = get().conflictItems;
            
            for (const conflict of conflicts) {
              try {
                await get().resolveConflict(conflict.id, strategy);
              } catch (error) {
                console.error(`Failed to resolve conflict ${conflict.id}:`, error);
              }
            }
          },

          // 合并数据
          mergeData: (localData: SyncItem | null, remoteData: SyncItem | null) => {
            if (!localData) return remoteData;
            if (!remoteData) return localData;

            // 简单的合并策略：使用最新的时间戳
            return localData.lastModified > remoteData.lastModified ? localData : remoteData;
          },

          // 执行任务
          executeTask: async (task: SyncTask) => {
            set((state) => {
              const activeTask = state.activeTasks.get(task.id);
              if (activeTask) {
                activeTask.status = 'running';
                activeTask.progress = 0;
              }
            });

            try {
              const item = get().getItem(task.itemId);
              if (!item) {
                throw new Error(`Item ${task.itemId} not found`);
              }

              // 模拟进度更新
              for (let progress = 0; progress <= 100; progress += 25) {
                set((state) => {
                  const activeTask = state.activeTasks.get(task.id);
                  if (activeTask) {
                    activeTask.progress = progress;
                  }
                });
                
                if (progress < 100) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }

              set((state) => {
                const activeTask = state.activeTasks.get(task.id);
                if (activeTask) {
                  activeTask.status = 'completed';
                  activeTask.endTime = Date.now();
                }
                
                // 更新项目状态
                const item = state.items.get(task.itemId);
                if (item) {
                  item.status = 'synced';
                }
              });
            } catch (error) {
              set((state) => {
                const activeTask = state.activeTasks.get(task.id);
                if (activeTask) {
                  activeTask.status = 'failed';
                  activeTask.error = {
                    code: 'TASK_ERROR',
                    message: error instanceof Error ? error.message : 'Task failed',
                    timestamp: new Date().toISOString()
                  };
                  activeTask.endTime = Date.now();
                }
              });
              throw error;
            }
          },

          // 添加到离线队列
          addToOfflineQueue: (operation) => {
            set((state) => {
              state.offlineQueue.push({
                ...operation,
                timestamp: Date.now()
              });
            });
          },

          // 处理离线队列
          processOfflineQueue: async () => {
            const state = get();
            
            if (!state.isOnline || state.offlineQueue.length === 0) {
              return;
            }

            const operations = [...state.offlineQueue];
            
            set((state) => {
              state.offlineQueue = [];
            });

            for (const operation of operations) {
              try {
                await get().executeOfflineOperation(operation);
              } catch (error) {
                console.error('Failed to execute offline operation:', error);
                // 重新添加到队列
                get().addToOfflineQueue(operation);
              }
            }
          },

          // 执行离线操作
          executeOfflineOperation: async (operation: SyncOperation) => {
            switch (operation.type) {
              case 'create':
              case 'update':
                await httpClient.post(API_ENDPOINTS.SYNC.OPERATION, {
                  operation: operation.type,
                  itemId: operation.itemId,
                  data: operation.data
                });
                break;
              case 'delete':
                await httpClient.delete(`${API_ENDPOINTS.SYNC.OPERATION}/${operation.itemId}`);
                break;
            }
          },

          // 清空离线队列
          clearOfflineQueue: () => {
            set((state) => {
              state.offlineQueue = [];
            });
          },

          // 添加项目
          addItem: (item) => {
            set((state) => {
              state.items.set(item.id, item);
              
              if (item.status !== 'synced') {
                state.pendingItems.push(item);
              }
              
              state.checksums.set(item.id, item.checksum);
            });
          },

          // 更新项目
          updateItem: (itemId, updates) => {
            set((state) => {
              const item = state.items.get(itemId);
              if (item) {
                Object.assign(item, updates);
                
                // 更新待同步列表
                if (updates.status && updates.status !== 'synced') {
                  if (!state.pendingItems.find(p => p.id === itemId)) {
                    state.pendingItems.push(item);
                  }
                } else if (updates.status === 'synced') {
                  state.pendingItems = state.pendingItems.filter(p => p.id !== itemId);
                }
                
                // 更新校验和
                if (updates.checksum) {
                  state.checksums.set(itemId, updates.checksum);
                }
              }
            });
          },

          // 移除项目
          removeItem: (itemId) => {
            set((state) => {
              state.items.delete(itemId);
              state.pendingItems = state.pendingItems.filter(p => p.id !== itemId);
              state.checksums.delete(itemId);
              state.corruptedItems = state.corruptedItems.filter(id => id !== itemId);
            });
          },

          // 获取项目
          getItem: (itemId) => {
            return get().items.get(itemId) || null;
          },

          // 设置在线状态
          setOnlineStatus: (isOnline) => {
            set((state) => {
              state.isOnline = isOnline;
            });

            // 如果重新上线，处理离线队列
            if (isOnline) {
              get().processOfflineQueue();
            }
          },

          // 更新同步状态
          updateSyncStatus: (isSyncing) => {
            set((state) => {
              state.isSyncing = isSyncing;
            });
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
              state.config = defaultSyncConfig;
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

          // 验证数据
          validateData: async () => {
            const state = get();
            const corruptedItems: string[] = [];

            for (const [itemId, item] of state.items) {
              const expectedChecksum = get().calculateChecksum(item.data);
              const storedChecksum = state.checksums.get(itemId);
              
              if (storedChecksum && storedChecksum !== expectedChecksum) {
                corruptedItems.push(itemId);
              }
            }

            set((state) => {
              state.corruptedItems = corruptedItems;
            });

            if (corruptedItems.length > 0) {
              window.dispatchEvent(new CustomEvent('data-corruption-detected', {
                detail: { corruptedItems }
              }));
            }
          },

          // 修复数据
          repairData: async (itemIds) => {
            const state = get();
            const idsToRepair = itemIds || state.corruptedItems;

            for (const itemId of idsToRepair) {
              try {
                // 从服务器重新获取数据
                const response = await httpClient.get(`${API_ENDPOINTS.SYNC.ITEM}/${itemId}`);
                
                if (response.success) {
                  const serverData = response.data;
                  get().updateItem(itemId, {
                    data: serverData,
                    status: 'synced',
                    checksum: get().calculateChecksum(serverData)
                  });
                }
              } catch (error) {
                console.error(`Failed to repair item ${itemId}:`, error);
              }
            }

            set((state) => {
              state.corruptedItems = state.corruptedItems.filter(id => !idsToRepair.includes(id));
            });
          },

          // 计算校验和
          calculateChecksum: (data) => {
            return calculateChecksum(data);
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
              state.stats = initialSyncState.stats;
            });
          },

          // 清理操作
          cleanup: () => {
            set((state) => {
              // 清理已完成的任务
              const activeTasks = new Map();
              for (const [id, task] of state.activeTasks) {
                if (task.status === 'running' || task.status === 'pending') {
                  activeTasks.set(id, task);
                }
              }
              state.activeTasks = activeTasks;
              
              // 清理旧错误
              const oneHourAgo = Date.now() - 60 * 60 * 1000;
              state.errors = state.errors.filter(error => 
                new Date(error.timestamp).getTime() > oneHourAgo
              );
            });
          },

          // 重置状态
          reset: () => {
            set(() => ({ ...initialSyncState }));
          }
        }))
      ),
      {
        name: 'sync-store',
        partialize: (state) => ({
          config: state.config,
          stats: state.stats,
          lastSyncTime: state.lastSyncTime,
          // 不持久化大型对象如items和缓存
        })
      }
    ),
    {
      name: 'sync-store'
    }
  );

// ==================== 导出工具函数 ====================

/**
 * 获取同步状态
 */
export const useSyncStatus = () => {
  return useSyncStore((state) => ({
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
    lastSyncTime: state.lastSyncTime,
    nextSyncTime: state.nextSyncTime,
    pendingCount: state.pendingItems.length,
    conflictCount: state.conflictItems.length,
    offlineQueueCount: state.offlineQueue.length
  }));
};

/**
 * 获取冲突列表
 */
export const useSyncConflicts = () => {
  return useSyncStore((state) => state.conflictItems);
};

/**
 * 获取同步统计
 */
export const useSyncStats = () => {
  return useSyncStore((state) => state.stats);
};

/**
 * 获取同步错误
 */
export const useSyncErrors = () => {
  return useSyncStore((state) => state.errors);
};

/**
 * 获取待同步项目
 */
export const usePendingItems = () => {
  return useSyncStore((state) => state.pendingItems);
};

/**
 * 获取离线队列
 */
export const useOfflineQueue = () => {
  return useSyncStore((state) => state.offlineQueue);
};

/**
 * 获取数据完整性状态
 */
export const useDataIntegrity = () => {
  return useSyncStore((state) => ({
    corruptedItems: state.corruptedItems,
    totalItems: state.items.size,
    corruptionRate: state.corruptedItems.length / Math.max(state.items.size, 1)
  }));
};

// ==================== 网络状态监听 ====================

// 监听网络状态变化
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnlineStatus(false);
  });
}