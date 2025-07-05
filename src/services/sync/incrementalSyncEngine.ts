import { sqliteManager, BlogDraft, ImageCache, SyncStatus } from '../database/sqliteManager';
import { offlineStorage } from '../database/offlineStorage';
import { apiClient } from '../api/apiClient';
import { EventEmitter } from 'events';

// 增量同步配置
export interface IncrementalSyncConfig {
  enabled: boolean;
  batchSize: number;
  maxRetryAttempts: number;
  retryDelay: number;
  checksumValidation: boolean;
  deltaCompression: boolean;
  conflictResolution: 'timestamp' | 'content' | 'user';
}

// 增量数据
export interface DeltaData {
  operation: 'create' | 'update' | 'delete';
  entityType: 'draft' | 'image' | 'config';
  entityId: string;
  timestamp: Date;
  checksum?: string;
  data?: any;
  previousChecksum?: string;
}

// 同步检查点
export interface SyncCheckpoint {
  id: string;
  timestamp: Date;
  lastSyncedId: string;
  totalItems: number;
  syncedItems: number;
  checksum: string;
}

// 冲突检测结果
export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictType: 'timestamp' | 'content' | 'version';
  localData: any;
  remoteData: any;
  resolution?: 'local' | 'remote' | 'merge';
}

// 增量同步结果
export interface IncrementalSyncResult {
  success: boolean;
  checkpoint: SyncCheckpoint;
  processedDeltas: number;
  appliedDeltas: number;
  conflicts: ConflictDetectionResult[];
  errors: string[];
  bytesTransferred: number;
  duration: number;
}

class IncrementalSyncEngine extends EventEmitter {
  private config: IncrementalSyncConfig;
  private lastCheckpoint: SyncCheckpoint | null = null;
  private isRunning = false;

  constructor() {
    super();
    
    this.config = {
      enabled: true,
      batchSize: 50,
      maxRetryAttempts: 3,
      retryDelay: 2000,
      checksumValidation: true,
      deltaCompression: true,
      conflictResolution: 'timestamp'
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // 加载配置
      const savedConfig = await sqliteManager.getConfig<IncrementalSyncConfig>('incrementalSyncConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }

      // 加载最后的检查点
      const lastCheckpointData = await sqliteManager.getConfig<SyncCheckpoint>('lastSyncCheckpoint');
      if (lastCheckpointData) {
        this.lastCheckpoint = {
          ...lastCheckpointData,
          timestamp: new Date(lastCheckpointData.timestamp)
        };
      }

      console.log('增量同步引擎初始化成功');
    } catch (error) {
      console.error('增量同步引擎初始化失败:', error);
    }
  }

  // 配置管理
  async updateConfig(newConfig: Partial<IncrementalSyncConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await sqliteManager.setConfig('incrementalSyncConfig', this.config, 'sync');
  }

  getConfig(): IncrementalSyncConfig {
    return { ...this.config };
  }

  getLastCheckpoint(): SyncCheckpoint | null {
    return this.lastCheckpoint ? { ...this.lastCheckpoint } : null;
  }

  // 主要的增量同步方法
  async performIncrementalSync(): Promise<IncrementalSyncResult> {
    if (this.isRunning) {
      throw new Error('增量同步正在进行中');
    }

    this.isRunning = true;
    const startTime = Date.now();

    const result: IncrementalSyncResult = {
      success: false,
      checkpoint: this.createInitialCheckpoint(),
      processedDeltas: 0,
      appliedDeltas: 0,
      conflicts: [],
      errors: [],
      bytesTransferred: 0,
      duration: 0
    };

    try {
      this.emit('sync_started', result.checkpoint);

      // 1. 生成本地增量数据
      const localDeltas = await this.generateLocalDeltas();
      
      // 2. 获取远程增量数据
      const remoteDeltas = await this.fetchRemoteDeltas();
      
      // 3. 检测和解决冲突
      const { resolvedDeltas, conflicts } = await this.detectAndResolveConflicts(localDeltas, remoteDeltas);
      result.conflicts = conflicts;
      
      // 4. 应用增量数据
      const applyResult = await this.applyDeltas(resolvedDeltas);
      result.appliedDeltas = applyResult.applied;
      result.bytesTransferred = applyResult.bytesTransferred;
      
      // 5. 更新检查点
      result.checkpoint = await this.updateCheckpoint(resolvedDeltas);
      
      // 6. 验证同步完整性
      await this.validateSyncIntegrity(result.checkpoint);
      
      result.processedDeltas = localDeltas.length + remoteDeltas.length;
      result.success = true;
      result.duration = Date.now() - startTime;

      this.emit('sync_completed', result);
      console.log('增量同步完成:', result);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '未知错误');
      result.duration = Date.now() - startTime;

      this.emit('sync_failed', result);
      console.error('增量同步失败:', error);
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  // 生成本地增量数据
  private async generateLocalDeltas(): Promise<DeltaData[]> {
    const deltas: DeltaData[] = [];
    const lastSyncTime = this.lastCheckpoint?.timestamp || new Date(0);

    try {
      // 获取变更的草稿
      const changedDrafts = await sqliteManager.getDrafts({
        syncStatus: 'pending'
      });

      for (const draft of changedDrafts) {
        if (draft.lastModified > lastSyncTime) {
          const checksum = await this.calculateChecksum(draft);
          
          deltas.push({
            operation: draft.remoteId ? 'update' : 'create',
            entityType: 'draft',
            entityId: draft.id,
            timestamp: draft.lastModified,
            checksum,
            data: draft
          });
        }
      }

      // 获取变更的图片
      const changedImages = await sqliteManager.getImageCaches({
        uploadStatus: 'pending'
      });

      for (const image of changedImages) {
        if (image.createdAt > lastSyncTime) {
          const checksum = await this.calculateChecksum(image);
          
          deltas.push({
            operation: image.remotePath ? 'update' : 'create',
            entityType: 'image',
            entityId: image.id,
            timestamp: image.createdAt,
            checksum,
            data: image
          });
        }
      }

      // 获取删除操作
      const deleteTasks = await sqliteManager.getPendingSyncTasks(1000);
      const deleteDeltas = deleteTasks
        .filter(task => task.operation === 'delete' && task.createdAt > lastSyncTime)
        .map(task => ({
          operation: 'delete' as const,
          entityType: task.entityType as 'draft' | 'image',
          entityId: task.entityId,
          timestamp: task.createdAt,
          checksum: undefined,
          data: null
        }));

      deltas.push(...deleteDeltas);

      // 按时间戳排序
      deltas.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      console.log(`生成了 ${deltas.length} 个本地增量数据`);
      return deltas;

    } catch (error) {
      console.error('生成本地增量数据失败:', error);
      throw error;
    }
  }

  // 获取远程增量数据
  private async fetchRemoteDeltas(): Promise<DeltaData[]> {
    try {
      const lastSyncTime = this.lastCheckpoint?.timestamp || new Date(0);
      
      const response = await apiClient.get('/sync/deltas', {
        params: {
          since: lastSyncTime.toISOString(),
          limit: this.config.batchSize
        }
      });

      const remoteDeltas: DeltaData[] = response.data.deltas.map((delta: any) => ({
        ...delta,
        timestamp: new Date(delta.timestamp)
      }));

      console.log(`获取了 ${remoteDeltas.length} 个远程增量数据`);
      return remoteDeltas;

    } catch (error) {
      console.error('获取远程增量数据失败:', error);
      throw error;
    }
  }

  // 检测和解决冲突
  private async detectAndResolveConflicts(
    localDeltas: DeltaData[],
    remoteDeltas: DeltaData[]
  ): Promise<{
    resolvedDeltas: DeltaData[];
    conflicts: ConflictDetectionResult[];
  }> {
    const conflicts: ConflictDetectionResult[] = [];
    const resolvedDeltas: DeltaData[] = [];
    
    // 创建实体ID到增量数据的映射
    const localDeltaMap = new Map<string, DeltaData>();
    const remoteDeltaMap = new Map<string, DeltaData>();
    
    localDeltas.forEach(delta => {
      const key = `${delta.entityType}:${delta.entityId}`;
      localDeltaMap.set(key, delta);
    });
    
    remoteDeltas.forEach(delta => {
      const key = `${delta.entityType}:${delta.entityId}`;
      remoteDeltaMap.set(key, delta);
    });

    // 检测冲突
    const allKeys = new Set([...localDeltaMap.keys(), ...remoteDeltaMap.keys()]);
    
    for (const key of allKeys) {
      const localDelta = localDeltaMap.get(key);
      const remoteDelta = remoteDeltaMap.get(key);
      
      if (localDelta && remoteDelta) {
        // 有冲突
        const conflictResult = await this.detectConflict(localDelta, remoteDelta);
        
        if (conflictResult.hasConflict) {
          conflicts.push(conflictResult);
          
          // 根据配置自动解决冲突
          const resolvedDelta = await this.resolveConflict(conflictResult);
          if (resolvedDelta) {
            resolvedDeltas.push(resolvedDelta);
          }
        } else {
          // 无冲突，选择较新的
          const newerDelta = localDelta.timestamp > remoteDelta.timestamp ? localDelta : remoteDelta;
          resolvedDeltas.push(newerDelta);
        }
      } else if (localDelta) {
        // 只有本地变更
        resolvedDeltas.push(localDelta);
      } else if (remoteDelta) {
        // 只有远程变更
        resolvedDeltas.push(remoteDelta);
      }
    }

    console.log(`检测到 ${conflicts.length} 个冲突，解决了 ${resolvedDeltas.length} 个增量数据`);
    
    return { resolvedDeltas, conflicts };
  }

  // 检测单个冲突
  private async detectConflict(localDelta: DeltaData, remoteDelta: DeltaData): Promise<ConflictDetectionResult> {
    const result: ConflictDetectionResult = {
      hasConflict: false,
      conflictType: 'timestamp',
      localData: localDelta.data,
      remoteData: remoteDelta.data
    };

    // 时间戳冲突检测
    const timeDiff = Math.abs(localDelta.timestamp.getTime() - remoteDelta.timestamp.getTime());
    if (timeDiff < 1000) { // 1秒内的变更认为可能有冲突
      result.hasConflict = true;
      result.conflictType = 'timestamp';
    }

    // 内容冲突检测
    if (this.config.checksumValidation && localDelta.checksum && remoteDelta.checksum) {
      if (localDelta.checksum !== remoteDelta.checksum) {
        result.hasConflict = true;
        result.conflictType = 'content';
      }
    }

    // 版本冲突检测（针对草稿）
    if (localDelta.entityType === 'draft' && localDelta.data && remoteDelta.data) {
      const localVersion = localDelta.data.version || 1;
      const remoteVersion = remoteDelta.data.version || 1;
      
      if (localVersion !== remoteVersion) {
        result.hasConflict = true;
        result.conflictType = 'version';
      }
    }

    return result;
  }

  // 解决冲突
  private async resolveConflict(conflict: ConflictDetectionResult): Promise<DeltaData | null> {
    switch (this.config.conflictResolution) {
      case 'timestamp':
        return this.resolveByTimestamp(conflict);
      case 'content':
        return this.resolveByContent(conflict);
      case 'user':
        // 用户手动解决，暂时返回null
        this.emit('conflict_requires_user_resolution', conflict);
        return null;
      default:
        return null;
    }
  }

  private async resolveByTimestamp(conflict: ConflictDetectionResult): Promise<DeltaData | null> {
    // 简单的时间戳解决策略：使用最新的数据
    const localTime = conflict.localData?.lastModified || conflict.localData?.createdAt;
    const remoteTime = conflict.remoteData?.lastModified || conflict.remoteData?.createdAt;
    
    if (!localTime || !remoteTime) return null;
    
    const useLocal = new Date(localTime) > new Date(remoteTime);
    conflict.resolution = useLocal ? 'local' : 'remote';
    
    // 返回选中的数据作为增量
    const selectedData = useLocal ? conflict.localData : conflict.remoteData;
    
    return {
      operation: 'update',
      entityType: selectedData.entityType || 'draft',
      entityId: selectedData.id,
      timestamp: new Date(useLocal ? localTime : remoteTime),
      data: selectedData
    };
  }

  private async resolveByContent(conflict: ConflictDetectionResult): Promise<DeltaData | null> {
    // 内容合并策略（简化版）
    if (conflict.localData && conflict.remoteData) {
      const mergedData = this.mergeContent(conflict.localData, conflict.remoteData);
      conflict.resolution = 'merge';
      
      return {
        operation: 'update',
        entityType: mergedData.entityType || 'draft',
        entityId: mergedData.id,
        timestamp: new Date(),
        data: mergedData
      };
    }
    
    return null;
  }

  private mergeContent(localData: any, remoteData: any): any {
    // 简单的合并策略：合并非冲突字段，冲突字段使用本地版本
    const merged = { ...remoteData };
    
    // 保留本地的标题和内容（如果存在）
    if (localData.title) merged.title = localData.title;
    if (localData.content) merged.content = localData.content;
    
    // 合并标签和分类
    if (localData.tags && remoteData.tags) {
      merged.tags = [...new Set([...localData.tags, ...remoteData.tags])];
    }
    
    if (localData.categories && remoteData.categories) {
      merged.categories = [...new Set([...localData.categories, ...remoteData.categories])];
    }
    
    // 使用最新的修改时间
    const localTime = new Date(localData.lastModified || localData.createdAt);
    const remoteTime = new Date(remoteData.lastModified || remoteData.createdAt);
    merged.lastModified = localTime > remoteTime ? localData.lastModified : remoteData.lastModified;
    
    return merged;
  }

  // 应用增量数据
  private async applyDeltas(deltas: DeltaData[]): Promise<{
    applied: number;
    bytesTransferred: number;
  }> {
    let applied = 0;
    let bytesTransferred = 0;

    for (const delta of deltas) {
      try {
        const result = await this.applyDelta(delta);
        if (result.success) {
          applied++;
          bytesTransferred += result.bytesTransferred || 0;
        }
        
        this.emit('delta_applied', { delta, result });
      } catch (error) {
        console.error(`应用增量数据失败:`, delta, error);
        this.emit('delta_failed', { delta, error });
      }
    }

    return { applied, bytesTransferred };
  }

  // 应用单个增量数据
  private async applyDelta(delta: DeltaData): Promise<{
    success: boolean;
    bytesTransferred?: number;
  }> {
    switch (delta.operation) {
      case 'create':
        return await this.applyCreateDelta(delta);
      case 'update':
        return await this.applyUpdateDelta(delta);
      case 'delete':
        return await this.applyDeleteDelta(delta);
      default:
        throw new Error(`未知的操作类型: ${delta.operation}`);
    }
  }

  private async applyCreateDelta(delta: DeltaData): Promise<{ success: boolean; bytesTransferred?: number }> {
    try {
      if (delta.entityType === 'draft') {
        await sqliteManager.saveDraft({
          ...delta.data,
          syncStatus: 'synced'
        });
      } else if (delta.entityType === 'image') {
        await sqliteManager.saveImageCache({
          ...delta.data,
          uploadStatus: 'uploaded'
        });
      }
      
      return { success: true, bytesTransferred: this.calculateDataSize(delta.data) };
    } catch (error) {
      console.error('应用创建增量失败:', error);
      return { success: false };
    }
  }

  private async applyUpdateDelta(delta: DeltaData): Promise<{ success: boolean; bytesTransferred?: number }> {
    try {
      if (delta.entityType === 'draft') {
        await sqliteManager.updateDraft(delta.entityId, {
          ...delta.data,
          syncStatus: 'synced'
        });
      } else if (delta.entityType === 'image') {
        await sqliteManager.updateImageCache(delta.entityId, {
          ...delta.data,
          uploadStatus: 'uploaded'
        });
      }
      
      return { success: true, bytesTransferred: this.calculateDataSize(delta.data) };
    } catch (error) {
      console.error('应用更新增量失败:', error);
      return { success: false };
    }
  }

  private async applyDeleteDelta(delta: DeltaData): Promise<{ success: boolean }> {
    try {
      if (delta.entityType === 'draft') {
        await sqliteManager.deleteDraft(delta.entityId);
      } else if (delta.entityType === 'image') {
        const image = await sqliteManager.getImageCache(delta.entityId);
        if (image) {
          // 删除本地文件
          try {
            await offlineStorage.deleteImageOffline?.(delta.entityId);
          } catch (error) {
            console.warn('删除本地图片文件失败:', error);
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('应用删除增量失败:', error);
      return { success: false };
    }
  }

  // 更新检查点
  private async updateCheckpoint(deltas: DeltaData[]): Promise<SyncCheckpoint> {
    const now = new Date();
    const lastDelta = deltas[deltas.length - 1];
    
    const checkpoint: SyncCheckpoint = {
      id: crypto.randomUUID(),
      timestamp: now,
      lastSyncedId: lastDelta?.entityId || '',
      totalItems: deltas.length,
      syncedItems: deltas.length,
      checksum: await this.calculateCheckpointChecksum(deltas)
    };

    // 保存检查点
    await sqliteManager.setConfig('lastSyncCheckpoint', checkpoint, 'sync');
    this.lastCheckpoint = checkpoint;

    return checkpoint;
  }

  // 验证同步完整性
  private async validateSyncIntegrity(checkpoint: SyncCheckpoint): Promise<void> {
    try {
      // 验证本地数据完整性
      const localChecksum = await this.calculateLocalDataChecksum();
      
      // 获取远程校验和
      const response = await apiClient.get('/sync/checksum', {
        params: {
          timestamp: checkpoint.timestamp.toISOString()
        }
      });
      
      const remoteChecksum = response.data.checksum;
      
      if (localChecksum !== remoteChecksum) {
        console.warn('同步完整性验证失败，本地和远程数据不一致');
        this.emit('integrity_validation_failed', {
          localChecksum,
          remoteChecksum,
          checkpoint
        });
      } else {
        console.log('同步完整性验证通过');
        this.emit('integrity_validation_passed', checkpoint);
      }
    } catch (error) {
      console.warn('同步完整性验证失败:', error);
    }
  }

  // 工具方法
  private createInitialCheckpoint(): SyncCheckpoint {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      lastSyncedId: '',
      totalItems: 0,
      syncedItems: 0,
      checksum: ''
    };
  }

  private async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async calculateCheckpointChecksum(deltas: DeltaData[]): Promise<string> {
    const checksumData = deltas.map(d => `${d.entityType}:${d.entityId}:${d.operation}:${d.timestamp.getTime()}`);
    return await this.calculateChecksum(checksumData);
  }

  private async calculateLocalDataChecksum(): Promise<string> {
    const [drafts, images] = await Promise.all([
      sqliteManager.getDrafts(),
      sqliteManager.getImageCaches()
    ]);
    
    const checksumData = {
      drafts: drafts.map(d => ({ id: d.id, lastModified: d.lastModified.getTime() })),
      images: images.map(i => ({ id: i.id, lastAccessed: i.lastAccessed.getTime() }))
    };
    
    return await this.calculateChecksum(checksumData);
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  // 重置同步状态
  async resetSyncState(): Promise<void> {
    this.lastCheckpoint = null;
    await sqliteManager.setConfig('lastSyncCheckpoint', null, 'sync');
    console.log('同步状态已重置');
  }

  // 获取同步统计
  async getSyncStats(): Promise<{
    lastCheckpoint: SyncCheckpoint | null;
    pendingDeltas: number;
    totalSynced: number;
  }> {
    const pendingTasks = await sqliteManager.getPendingSyncTasks(1000);
    
    return {
      lastCheckpoint: this.lastCheckpoint,
      pendingDeltas: pendingTasks.length,
      totalSynced: this.lastCheckpoint?.syncedItems || 0
    };
  }
}

// 导出单例实例
export const incrementalSyncEngine = new IncrementalSyncEngine();
export default incrementalSyncEngine;