import { invoke } from '@tauri-apps/api/tauri';
import { appDataDir, join, downloadDir, documentDir } from '@tauri-apps/api/path';
import { createDir, exists, writeFile, readFile, removeFile, readDir } from '@tauri-apps/api/fs';
import { save, open } from '@tauri-apps/api/dialog';
import { sqliteManager, BlogDraft, ImageCache, UserConfig } from './sqliteManager';
import { offlineStorage } from './offlineStorage';

// 备份类型
export type BackupType = 'full' | 'incremental' | 'drafts-only' | 'images-only' | 'config-only';

// 备份元数据
export interface BackupMetadata {
  id: string;
  name: string;
  type: BackupType;
  version: string;
  createdAt: Date;
  size: number;
  itemCount: {
    drafts: number;
    images: number;
    configs: number;
  };
  checksum: string;
  description?: string;
  tags: string[];
}

// 备份数据结构
export interface BackupData {
  metadata: BackupMetadata;
  drafts?: BlogDraft[];
  images?: ImageCache[];
  configs?: UserConfig[];
  imageFiles?: { [key: string]: Uint8Array }; // 图片文件数据
}

// 备份配置
export interface BackupConfig {
  autoBackupEnabled: boolean;
  autoBackupInterval: number; // 小时
  maxBackupCount: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  includeImages: boolean;
  backupLocation: 'local' | 'custom';
  customPath?: string;
}

// 恢复选项
export interface RestoreOptions {
  overwriteExisting: boolean;
  restoreDrafts: boolean;
  restoreImages: boolean;
  restoreConfigs: boolean;
  conflictResolution: 'skip' | 'overwrite' | 'merge' | 'ask';
}

// 备份进度
export interface BackupProgress {
  stage: 'preparing' | 'exporting' | 'compressing' | 'encrypting' | 'saving' | 'completed' | 'error';
  progress: number; // 0-100
  currentItem?: string;
  totalItems: number;
  processedItems: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

class BackupService {
  private config: BackupConfig;
  private backupPath = '';
  private autoBackupTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.config = {
      autoBackupEnabled: true,
      autoBackupInterval: 24, // 24小时
      maxBackupCount: 10,
      compressionEnabled: true,
      encryptionEnabled: false,
      includeImages: true,
      backupLocation: 'local'
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const appData = await appDataDir();
      this.backupPath = await join(appData, 'backups');

      // 确保备份目录存在
      if (!(await exists(this.backupPath))) {
        await createDir(this.backupPath, { recursive: true });
      }

      // 加载配置
      await this.loadConfig();

      // 启动自动备份
      this.startAutoBackup();

      this.isInitialized = true;
      console.log('备份服务初始化成功');
    } catch (error) {
      console.error('备份服务初始化失败:', error);
      throw error;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await sqliteManager.getConfig<BackupConfig>('backupConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.warn('加载备份配置失败，使用默认配置:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    await sqliteManager.setConfig('backupConfig', this.config, 'backup');
  }

  private startAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }

    if (!this.config.autoBackupEnabled) {
      return;
    }

    const intervalMs = this.config.autoBackupInterval * 60 * 60 * 1000;
    
    this.autoBackupTimer = setInterval(async () => {
      try {
        await this.createAutoBackup();
      } catch (error) {
        console.error('自动备份失败:', error);
      }
    }, intervalMs);
  }

  // 配置管理
  async updateConfig(newConfig: Partial<BackupConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
    
    // 重新启动自动备份
    this.startAutoBackup();
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  // 创建备份
  async createBackup(
    type: BackupType = 'full',
    options?: {
      name?: string;
      description?: string;
      tags?: string[];
      customPath?: string;
      onProgress?: (progress: BackupProgress) => void;
    }
  ): Promise<string> {
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = options?.name || `backup_${type}_${timestamp}`;
    
    const progress: BackupProgress = {
      stage: 'preparing',
      progress: 0,
      totalItems: 0,
      processedItems: 0
    };

    try {
      options?.onProgress?.(progress);

      // 准备阶段
      progress.stage = 'preparing';
      progress.progress = 5;
      options?.onProgress?.(progress);

      // 导出数据
      progress.stage = 'exporting';
      progress.progress = 10;
      options?.onProgress?.(progress);

      const backupData = await this.exportData(type, (current, total) => {
        progress.processedItems = current;
        progress.totalItems = total;
        progress.progress = 10 + (current / total) * 60;
        progress.currentItem = `导出数据 ${current}/${total}`;
        options?.onProgress?.(progress);
      });

      // 创建元数据
      const metadata: BackupMetadata = {
        id: backupId,
        name: backupName,
        type,
        version: '1.0.0',
        createdAt: new Date(),
        size: 0, // 将在保存后计算
        itemCount: {
          drafts: backupData.drafts?.length || 0,
          images: backupData.images?.length || 0,
          configs: backupData.configs?.length || 0
        },
        checksum: '',
        description: options?.description,
        tags: options?.tags || []
      };

      backupData.metadata = metadata;

      // 压缩阶段
      let finalData: Uint8Array;
      if (this.config.compressionEnabled) {
        progress.stage = 'compressing';
        progress.progress = 75;
        options?.onProgress?.(progress);
        
        finalData = await this.compressData(JSON.stringify(backupData));
      } else {
        finalData = new TextEncoder().encode(JSON.stringify(backupData));
      }

      // 加密阶段
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        progress.stage = 'encrypting';
        progress.progress = 85;
        options?.onProgress?.(progress);
        
        finalData = await this.encryptData(finalData, this.config.encryptionKey);
      }

      // 保存阶段
      progress.stage = 'saving';
      progress.progress = 90;
      options?.onProgress?.(progress);

      const backupFilePath = await this.saveBackupFile(backupName, finalData, options?.customPath);

      // 更新元数据
      metadata.size = finalData.length;
      metadata.checksum = await this.calculateChecksum(finalData);

      // 保存元数据
      await this.saveBackupMetadata(metadata);

      // 清理旧备份
      await this.cleanupOldBackups();

      progress.stage = 'completed';
      progress.progress = 100;
      options?.onProgress?.(progress);

      console.log(`备份创建成功: ${backupFilePath}`);
      return backupFilePath;
    } catch (error) {
      progress.stage = 'error';
      progress.error = error instanceof Error ? error.message : '未知错误';
      options?.onProgress?.(progress);
      
      console.error('创建备份失败:', error);
      throw error;
    }
  }

  private async exportData(
    type: BackupType,
    onProgress?: (current: number, total: number) => void
  ): Promise<Omit<BackupData, 'metadata'>> {
    const data: Omit<BackupData, 'metadata'> = {};
    let current = 0;
    let total = 0;

    // 计算总项目数
    if (type === 'full' || type === 'drafts-only') {
      const drafts = await sqliteManager.getDrafts();
      total += drafts.length;
    }
    if (type === 'full' || type === 'images-only') {
      const images = await sqliteManager.getImageCaches();
      total += images.length;
    }
    if (type === 'full' || type === 'config-only') {
      const configs = await sqliteManager.getAllConfigs();
      total += configs.length;
    }

    // 导出草稿
    if (type === 'full' || type === 'drafts-only') {
      data.drafts = await sqliteManager.getDrafts();
      current += data.drafts.length;
      onProgress?.(current, total);
    }

    // 导出图片
    if (type === 'full' || type === 'images-only') {
      data.images = await sqliteManager.getImageCaches();
      
      if (this.config.includeImages) {
        data.imageFiles = {};
        
        for (const image of data.images) {
          try {
            if (await exists(image.localPath)) {
              const imageData = await readFile(image.localPath);
              data.imageFiles[image.id] = new Uint8Array(imageData);
            }
          } catch (error) {
            console.warn(`读取图片文件失败: ${image.localPath}`, error);
          }
          
          current++;
          onProgress?.(current, total);
        }
      } else {
        current += data.images.length;
        onProgress?.(current, total);
      }
    }

    // 导出配置
    if (type === 'full' || type === 'config-only') {
      data.configs = await sqliteManager.getAllConfigs();
      current += data.configs.length;
      onProgress?.(current, total);
    }

    return data;
  }

  private async saveBackupFile(name: string, data: Uint8Array, customPath?: string): Promise<string> {
    let filePath: string;
    
    if (customPath) {
      filePath = await join(customPath, `${name}.backup`);
    } else {
      filePath = await join(this.backupPath, `${name}.backup`);
    }

    await writeFile(filePath, data);
    return filePath;
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = await join(this.backupPath, `${metadata.name}.meta.json`);
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  // 恢复备份
  async restoreBackup(
    backupPath: string,
    options: RestoreOptions,
    onProgress?: (progress: BackupProgress) => void
  ): Promise<void> {
    const progress: BackupProgress = {
      stage: 'preparing',
      progress: 0,
      totalItems: 0,
      processedItems: 0
    };

    try {
      onProgress?.(progress);

      // 读取备份文件
      progress.stage = 'preparing';
      progress.progress = 10;
      onProgress?.(progress);

      const backupData = await this.loadBackupFile(backupPath);
      
      progress.totalItems = 
        (backupData.drafts?.length || 0) +
        (backupData.images?.length || 0) +
        (backupData.configs?.length || 0);

      // 恢复草稿
      if (options.restoreDrafts && backupData.drafts) {
        progress.stage = 'exporting';
        progress.currentItem = '恢复草稿';
        
        for (const draft of backupData.drafts) {
          await this.restoreDraft(draft, options);
          progress.processedItems++;
          progress.progress = 10 + (progress.processedItems / progress.totalItems) * 60;
          onProgress?.(progress);
        }
      }

      // 恢复图片
      if (options.restoreImages && backupData.images) {
        progress.currentItem = '恢复图片';
        
        for (const image of backupData.images) {
          await this.restoreImage(image, backupData.imageFiles?.[image.id], options);
          progress.processedItems++;
          progress.progress = 10 + (progress.processedItems / progress.totalItems) * 60;
          onProgress?.(progress);
        }
      }

      // 恢复配置
      if (options.restoreConfigs && backupData.configs) {
        progress.currentItem = '恢复配置';
        
        for (const config of backupData.configs) {
          await this.restoreConfig(config, options);
          progress.processedItems++;
          progress.progress = 10 + (progress.processedItems / progress.totalItems) * 60;
          onProgress?.(progress);
        }
      }

      progress.stage = 'completed';
      progress.progress = 100;
      onProgress?.(progress);

      console.log('备份恢复成功');
    } catch (error) {
      progress.stage = 'error';
      progress.error = error instanceof Error ? error.message : '未知错误';
      onProgress?.(progress);
      
      console.error('恢复备份失败:', error);
      throw error;
    }
  }

  private async loadBackupFile(filePath: string): Promise<BackupData> {
    let data = await readFile(filePath);
    let uint8Data = new Uint8Array(data);

    // 尝试解密
    if (this.config.encryptionEnabled && this.config.encryptionKey) {
      try {
        uint8Data = await this.decryptData(uint8Data, this.config.encryptionKey);
      } catch (error) {
        console.warn('解密失败，尝试作为未加密文件处理:', error);
      }
    }

    // 尝试解压缩
    let jsonString: string;
    if (this.config.compressionEnabled) {
      try {
        jsonString = await this.decompressData(uint8Data);
      } catch (error) {
        console.warn('解压缩失败，尝试作为未压缩文件处理:', error);
        jsonString = new TextDecoder().decode(uint8Data);
      }
    } else {
      jsonString = new TextDecoder().decode(uint8Data);
    }

    return JSON.parse(jsonString);
  }

  private async restoreDraft(draft: BlogDraft, options: RestoreOptions): Promise<void> {
    const existing = await sqliteManager.getDraft(draft.id);
    
    if (existing) {
      switch (options.conflictResolution) {
        case 'skip':
          return;
        case 'overwrite':
          await sqliteManager.updateDraft(draft.id, draft);
          break;
        case 'merge':
          // 简单合并策略：使用最新的修改时间
          if (draft.lastModified > existing.lastModified) {
            await sqliteManager.updateDraft(draft.id, draft);
          }
          break;
        case 'ask':
          // 在实际应用中，这里应该弹出对话框让用户选择
          console.log(`草稿冲突: ${draft.title}`);
          break;
      }
    } else {
      await sqliteManager.saveDraft(draft);
    }
  }

  private async restoreImage(image: ImageCache, imageData?: Uint8Array, options: RestoreOptions): Promise<void> {
    const existing = await sqliteManager.getImageCache(image.id);
    
    if (existing && options.conflictResolution === 'skip') {
      return;
    }

    // 恢复图片文件
    if (imageData && this.config.includeImages) {
      try {
        await writeFile(image.localPath, imageData);
      } catch (error) {
        console.warn(`恢复图片文件失败: ${image.localPath}`, error);
      }
    }

    // 恢复数据库记录
    if (existing) {
      await sqliteManager.updateImageCache(image.id, image);
    } else {
      await sqliteManager.saveImageCache(image);
    }
  }

  private async restoreConfig(config: UserConfig, options: RestoreOptions): Promise<void> {
    const existing = await sqliteManager.getConfig(config.key);
    
    if (existing && options.conflictResolution === 'skip') {
      return;
    }

    await sqliteManager.setConfig(config.key, config.value, config.category);
  }

  // 备份管理
  async getBackupList(): Promise<BackupMetadata[]> {
    try {
      const entries = await readDir(this.backupPath);
      const metadataFiles = entries.filter(entry => entry.name?.endsWith('.meta.json'));
      
      const backups: BackupMetadata[] = [];
      
      for (const file of metadataFiles) {
        try {
          const metadataPath = await join(this.backupPath, file.name!);
          const content = await readFile(metadataPath, { encoding: 'utf8' });
          const metadata = JSON.parse(content as string) as BackupMetadata;
          backups.push(metadata);
        } catch (error) {
          console.warn(`读取备份元数据失败: ${file.name}`, error);
        }
      }
      
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    const backups = await this.getBackupList();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      throw new Error('备份不存在');
    }

    try {
      // 删除备份文件
      const backupFilePath = await join(this.backupPath, `${backup.name}.backup`);
      if (await exists(backupFilePath)) {
        await removeFile(backupFilePath);
      }

      // 删除元数据文件
      const metadataPath = await join(this.backupPath, `${backup.name}.meta.json`);
      if (await exists(metadataPath)) {
        await removeFile(metadataPath);
      }

      console.log(`备份删除成功: ${backup.name}`);
    } catch (error) {
      console.error('删除备份失败:', error);
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.getBackupList();
    
    if (backups.length > this.config.maxBackupCount) {
      const toDelete = backups.slice(this.config.maxBackupCount);
      
      for (const backup of toDelete) {
        try {
          await this.deleteBackup(backup.id);
        } catch (error) {
          console.warn(`清理旧备份失败: ${backup.name}`, error);
        }
      }
    }
  }

  // 自动备份
  private async createAutoBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await this.createBackup('incremental', {
        name: `auto_backup_${timestamp}`,
        description: '自动备份',
        tags: ['auto']
      });
      
      console.log('自动备份完成');
    } catch (error) {
      console.error('自动备份失败:', error);
    }
  }

  // 导入/导出功能
  async exportBackupToFile(): Promise<string | null> {
    try {
      const filePath = await save({
        filters: [{
          name: '备份文件',
          extensions: ['backup']
        }]
      });

      if (filePath) {
        return await this.createBackup('full', {
          customPath: await documentDir()
        });
      }
      
      return null;
    } catch (error) {
      console.error('导出备份失败:', error);
      throw error;
    }
  }

  async importBackupFromFile(): Promise<void> {
    try {
      const selected = await open({
        filters: [{
          name: '备份文件',
          extensions: ['backup']
        }]
      });

      if (selected && typeof selected === 'string') {
        await this.restoreBackup(selected, {
          overwriteExisting: false,
          restoreDrafts: true,
          restoreImages: true,
          restoreConfigs: true,
          conflictResolution: 'ask'
        });
      }
    } catch (error) {
      console.error('导入备份失败:', error);
      throw error;
    }
  }

  // 数据压缩和加密（简化实现）
  private async compressData(data: string): Promise<Uint8Array> {
    // 这里应该使用真正的压缩算法，如gzip
    // 为了简化，这里只是转换为Uint8Array
    return new TextEncoder().encode(data);
  }

  private async decompressData(data: Uint8Array): Promise<string> {
    // 对应的解压缩实现
    return new TextDecoder().decode(data);
  }

  private async encryptData(data: Uint8Array, key: string): Promise<Uint8Array> {
    // 这里应该使用真正的加密算法，如AES
    // 为了简化，这里只是返回原数据
    return data;
  }

  private async decryptData(data: Uint8Array, key: string): Promise<Uint8Array> {
    // 对应的解密实现
    return data;
  }

  private async calculateChecksum(data: Uint8Array): Promise<string> {
    // 计算数据校验和
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 销毁服务
  async destroy(): Promise<void> {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
    
    this.isInitialized = false;
  }
}

// 导出单例实例
export const backupService = new BackupService();
export default backupService;