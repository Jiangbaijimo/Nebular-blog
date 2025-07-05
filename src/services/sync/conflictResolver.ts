// 冲突解决器服务
import localDB from '../storage/localDB';
import type {
  SyncConflict,
  ConflictResolution,
  ConflictMergeStrategy,
  ConflictField,
} from '../../types/sync';
import type { Blog } from '../../types/blog';
import type { MediaLibraryItem } from '../../types/upload';

/**
 * 冲突解决器类
 */
class ConflictResolver {
  /**
   * 获取所有待解决的冲突
   */
  async getPendingConflicts(): Promise<SyncConflict[]> {
    try {
      return await localDB.getSyncConflicts({ status: 'pending' });
    } catch (error) {
      console.error('Failed to get pending conflicts:', error);
      throw error;
    }
  }

  /**
   * 获取特定冲突详情
   */
  async getConflict(conflictId: string): Promise<SyncConflict | null> {
    try {
      return await localDB.getSyncConflict(conflictId);
    } catch (error) {
      console.error(`Failed to get conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    mergedData?: any,
    strategy?: ConflictMergeStrategy
  ): Promise<void> {
    try {
      const conflict = await this.getConflict(conflictId);
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      let resolvedData: any;

      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          resolvedData = await this.mergeData(
            conflict.localData,
            conflict.remoteData,
            strategy || 'smart',
            conflict.conflictFields
          );
          break;
        case 'manual':
          if (!mergedData) {
            throw new Error('Merged data is required for manual resolution');
          }
          resolvedData = mergedData;
          break;
        default:
          throw new Error(`Unknown resolution strategy: ${resolution}`);
      }

      // 应用解决方案
      await this.applyResolution(conflict, resolvedData);

      // 更新冲突状态
      await localDB.updateSyncConflict(conflictId, {
        status: 'resolved',
        resolutionStrategy: resolution,
        resolvedData,
        resolvedAt: new Date().toISOString(),
      });

      console.log(`Conflict ${conflictId} resolved with strategy: ${resolution}`);
    } catch (error) {
      console.error(`Failed to resolve conflict ${conflictId}:`, error);
      
      // 更新冲突状态为失败
      await localDB.updateSyncConflict(conflictId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * 批量解决冲突
   */
  async resolveBatchConflicts(
    conflictIds: string[],
    resolution: ConflictResolution,
    strategy?: ConflictMergeStrategy
  ): Promise<{ resolved: string[]; failed: string[] }> {
    const resolved: string[] = [];
    const failed: string[] = [];

    for (const conflictId of conflictIds) {
      try {
        await this.resolveConflict(conflictId, resolution, undefined, strategy);
        resolved.push(conflictId);
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflictId}:`, error);
        failed.push(conflictId);
      }
    }

    return { resolved, failed };
  }

  /**
   * 智能合并数据
   */
  private async mergeData(
    localData: any,
    remoteData: any,
    strategy: ConflictMergeStrategy,
    conflictFields?: string[]
  ): Promise<any> {
    switch (strategy) {
      case 'smart':
        return this.smartMerge(localData, remoteData, conflictFields);
      case 'timestamp':
        return this.timestampMerge(localData, remoteData);
      case 'field_priority':
        return this.fieldPriorityMerge(localData, remoteData, conflictFields);
      case 'user_preference':
        return this.userPreferenceMerge(localData, remoteData);
      default:
        throw new Error(`Unknown merge strategy: ${strategy}`);
    }
  }

  /**
   * 智能合并策略
   */
  private smartMerge(localData: any, remoteData: any, conflictFields?: string[]): any {
    const merged = { ...remoteData }; // 以远程数据为基础

    // 对于博客数据的特殊处理
    if (this.isBlogData(localData)) {
      return this.smartMergeBlog(localData, remoteData, conflictFields);
    }

    // 对于媒体文件的特殊处理
    if (this.isMediaData(localData)) {
      return this.smartMergeMedia(localData, remoteData, conflictFields);
    }

    // 通用智能合并
    if (conflictFields) {
      for (const field of conflictFields) {
        // 根据字段类型和内容智能选择
        merged[field] = this.selectBestValue(localData[field], remoteData[field], field);
      }
    }

    return merged;
  }

  /**
   * 智能合并博客数据
   */
  private smartMergeBlog(localBlog: Blog, remoteBlog: Blog, conflictFields?: string[]): Blog {
    const merged = { ...remoteBlog };

    if (conflictFields) {
      for (const field of conflictFields) {
        switch (field) {
          case 'title':
            // 选择更长的标题（通常更完整）
            merged.title = localBlog.title.length > remoteBlog.title.length
              ? localBlog.title
              : remoteBlog.title;
            break;
          
          case 'content':
            // 选择内容更多的版本
            merged.content = localBlog.content.length > remoteBlog.content.length
              ? localBlog.content
              : remoteBlog.content;
            break;
          
          case 'tags':
            // 合并标签（去重）
            const allTags = [...(localBlog.tags || []), ...(remoteBlog.tags || [])];
            merged.tags = [...new Set(allTags)];
            break;
          
          case 'status':
            // 优先选择已发布状态
            if (localBlog.status === 'published' || remoteBlog.status === 'published') {
              merged.status = 'published';
            } else {
              merged.status = remoteBlog.status; // 默认使用远程状态
            }
            break;
          
          default:
            // 其他字段使用时间戳策略
            merged[field as keyof Blog] = new Date(localBlog.updatedAt) > new Date(remoteBlog.updatedAt)
              ? localBlog[field as keyof Blog]
              : remoteBlog[field as keyof Blog];
        }
      }
    }

    // 更新时间戳为最新
    merged.updatedAt = new Date().toISOString();

    return merged;
  }

  /**
   * 智能合并媒体文件数据
   */
  private smartMergeMedia(localMedia: MediaLibraryItem, remoteMedia: MediaLibraryItem, conflictFields?: string[]): MediaLibraryItem {
    const merged = { ...remoteMedia };

    if (conflictFields) {
      for (const field of conflictFields) {
        switch (field) {
          case 'filename':
            // 保持原始文件名
            merged.filename = localMedia.filename;
            break;
          
          case 'alt':
          case 'description':
            // 选择更详细的描述
            const localValue = localMedia[field as keyof MediaLibraryItem] as string || '';
            const remoteValue = remoteMedia[field as keyof MediaLibraryItem] as string || '';
            merged[field as keyof MediaLibraryItem] = localValue.length > remoteValue.length
              ? localValue
              : remoteValue;
            break;
          
          case 'tags':
            // 合并标签
            const localTags = localMedia.tags || [];
            const remoteTags = remoteMedia.tags || [];
            merged.tags = [...new Set([...localTags, ...remoteTags])];
            break;
          
          default:
            merged[field as keyof MediaLibraryItem] = remoteMedia[field as keyof MediaLibraryItem];
        }
      }
    }

    return merged;
  }

  /**
   * 时间戳合并策略
   */
  private timestampMerge(localData: any, remoteData: any): any {
    // 选择更新时间更晚的数据
    const localTime = new Date(localData.updatedAt || localData.createdAt);
    const remoteTime = new Date(remoteData.updatedAt || remoteData.createdAt);
    
    return localTime > remoteTime ? localData : remoteData;
  }

  /**
   * 字段优先级合并策略
   */
  private fieldPriorityMerge(localData: any, remoteData: any, conflictFields?: string[]): any {
    const merged = { ...remoteData };
    
    // 定义字段优先级（本地优先的字段）
    const localPriorityFields = ['title', 'content', 'tags', 'metadata'];
    
    if (conflictFields) {
      for (const field of conflictFields) {
        if (localPriorityFields.includes(field)) {
          merged[field] = localData[field];
        }
      }
    }
    
    return merged;
  }

  /**
   * 用户偏好合并策略
   */
  private userPreferenceMerge(localData: any, remoteData: any): any {
    // 这里可以根据用户设置的偏好来决定合并策略
    // 暂时使用智能合并作为默认
    return this.smartMerge(localData, remoteData);
  }

  /**
   * 选择最佳值
   */
  private selectBestValue(localValue: any, remoteValue: any, fieldName: string): any {
    // 如果其中一个值为空，选择非空的
    if (!localValue && remoteValue) return remoteValue;
    if (localValue && !remoteValue) return localValue;
    
    // 如果都为空或都有值，根据字段类型决定
    if (typeof localValue === 'string' && typeof remoteValue === 'string') {
      // 字符串类型：选择更长的（通常更完整）
      return localValue.length >= remoteValue.length ? localValue : remoteValue;
    }
    
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      // 数组类型：合并并去重
      return [...new Set([...localValue, ...remoteValue])];
    }
    
    // 其他类型：默认选择远程值
    return remoteValue;
  }

  /**
   * 应用解决方案
   */
  private async applyResolution(conflict: SyncConflict, resolvedData: any): Promise<void> {
    try {
      switch (conflict.tableName) {
        case 'blogs':
          await this.applyBlogResolution(conflict.recordId, resolvedData);
          break;
        case 'media_files':
          await this.applyMediaResolution(conflict.recordId, resolvedData);
          break;
        default:
          throw new Error(`Unknown table: ${conflict.tableName}`);
      }
    } catch (error) {
      console.error(`Failed to apply resolution for ${conflict.tableName}:${conflict.recordId}:`, error);
      throw error;
    }
  }

  /**
   * 应用博客解决方案
   */
  private async applyBlogResolution(blogId: string, resolvedData: Blog): Promise<void> {
    // 更新本地数据库
    await localDB.updateBlog(blogId, resolvedData);
    
    // 标记为需要同步到远程
    await localDB.markBlogDirty(blogId);
  }

  /**
   * 应用媒体文件解决方案
   */
  private async applyMediaResolution(mediaId: string, resolvedData: MediaLibraryItem): Promise<void> {
    // 更新本地数据库
    await localDB.updateMediaFile(mediaId, resolvedData);
  }

  /**
   * 忽略冲突
   */
  async ignoreConflict(conflictId: string): Promise<void> {
    try {
      await localDB.updateSyncConflict(conflictId, {
        status: 'ignored',
        resolvedAt: new Date().toISOString(),
      });
      
      console.log(`Conflict ${conflictId} ignored`);
    } catch (error) {
      console.error(`Failed to ignore conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * 删除已解决的冲突
   */
  async deleteResolvedConflicts(olderThanDays = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // 这里需要在localDB中实现删除已解决冲突的方法
      // const deletedCount = await localDB.deleteResolvedConflicts(cutoffDate.toISOString());
      
      console.log(`Deleted resolved conflicts older than ${olderThanDays} days`);
      return 0; // 暂时返回0
    } catch (error) {
      console.error('Failed to delete resolved conflicts:', error);
      throw error;
    }
  }

  /**
   * 获取冲突统计信息
   */
  async getConflictStats(): Promise<{
    total: number;
    pending: number;
    resolved: number;
    failed: number;
    ignored: number;
  }> {
    try {
      const allConflicts = await localDB.getSyncConflicts();
      
      const stats = {
        total: allConflicts.length,
        pending: 0,
        resolved: 0,
        failed: 0,
        ignored: 0,
      };
      
      for (const conflict of allConflicts) {
        stats[conflict.status]++;
      }
      
      return stats;
    } catch (error) {
      console.error('Failed to get conflict stats:', error);
      throw error;
    }
  }

  /**
   * 预览合并结果
   */
  async previewMerge(
    conflictId: string,
    strategy: ConflictMergeStrategy
  ): Promise<any> {
    try {
      const conflict = await this.getConflict(conflictId);
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }
      
      return await this.mergeData(
        conflict.localData,
        conflict.remoteData,
        strategy,
        conflict.conflictFields
      );
    } catch (error) {
      console.error(`Failed to preview merge for conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * 检查是否为博客数据
   */
  private isBlogData(data: any): data is Blog {
    return data && typeof data === 'object' && 'title' in data && 'content' in data;
  }

  /**
   * 检查是否为媒体数据
   */
  private isMediaData(data: any): data is MediaLibraryItem {
    return data && typeof data === 'object' && 'filename' in data && 'fileType' in data;
  }

  /**
   * 分析冲突字段
   */
  analyzeConflictFields(localData: any, remoteData: any): ConflictField[] {
    const fields: ConflictField[] = [];
    
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(remoteData)]);
    
    for (const key of allKeys) {
      const localValue = localData[key];
      const remoteValue = remoteData[key];
      
      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        fields.push({
          name: key,
          localValue,
          remoteValue,
          type: this.getFieldType(localValue, remoteValue),
          recommendation: this.getFieldRecommendation(key, localValue, remoteValue),
        });
      }
    }
    
    return fields;
  }

  /**
   * 获取字段类型
   */
  private getFieldType(localValue: any, remoteValue: any): string {
    if (Array.isArray(localValue) || Array.isArray(remoteValue)) {
      return 'array';
    }
    
    if (typeof localValue === 'object' || typeof remoteValue === 'object') {
      return 'object';
    }
    
    if (typeof localValue === 'string' || typeof remoteValue === 'string') {
      return 'string';
    }
    
    if (typeof localValue === 'number' || typeof remoteValue === 'number') {
      return 'number';
    }
    
    if (typeof localValue === 'boolean' || typeof remoteValue === 'boolean') {
      return 'boolean';
    }
    
    return 'unknown';
  }

  /**
   * 获取字段推荐
   */
  private getFieldRecommendation(fieldName: string, localValue: any, remoteValue: any): 'local' | 'remote' | 'merge' {
    // 根据字段名和值的特征给出推荐
    if (fieldName === 'updatedAt' || fieldName === 'modifiedAt') {
      return new Date(localValue) > new Date(remoteValue) ? 'local' : 'remote';
    }
    
    if (fieldName === 'tags' && Array.isArray(localValue) && Array.isArray(remoteValue)) {
      return 'merge';
    }
    
    if (typeof localValue === 'string' && typeof remoteValue === 'string') {
      return localValue.length > remoteValue.length ? 'local' : 'remote';
    }
    
    return 'remote'; // 默认推荐远程值
  }
}

// 创建冲突解决器实例
const conflictResolver = new ConflictResolver();

export { conflictResolver, ConflictResolver };
export default conflictResolver;