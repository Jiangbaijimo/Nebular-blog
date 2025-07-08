import { useCallback } from 'react';
import { uploadAPI } from '../services/api';
import { useApi, usePaginatedApi, useSubmit, useBatchOperation } from './useApi';
import type {
  MediaFile,
  MediaFolder,
  MediaListParams,
  MediaListResponse,
  CreateFolderRequest,
  UpdateMediaRequest,
  UploadFileRequest,
  MediaStats
} from '../types/media';

/**
 * 媒体文件列表Hook
 * @param initialParams 初始查询参数
 * @returns 媒体文件列表状态和操作方法
 */
export function useMediaList(initialParams: MediaListParams = { page: 1, limit: 20 }) {
  return usePaginatedApi(
    (params: MediaListParams) => uploadAPI.getMediaFiles(params),
    initialParams,
    {
      immediate: true,
      onError: (error) => {
        console.error('获取媒体文件列表失败:', error);
      }
    }
  );
}

/**
 * 媒体文件详情Hook
 * @param id 文件ID
 * @returns 媒体文件详情状态和操作方法
 */
export function useMediaDetail(id: string | null) {
  return useApi(
    useCallback(() => {
      if (!id) throw new Error('文件ID不能为空');
      return uploadAPI.getMediaFile(id);
    }, [id]),
    {
      immediate: !!id,
      onError: (error) => {
        console.error('获取媒体文件详情失败:', error);
      }
    }
  );
}

/**
 * 文件上传Hook
 * @returns 上传状态和操作方法
 */
export function useUploadFile() {
  return useSubmit(
    (data: UploadFileRequest) => uploadAPI.uploadFile(data),
    {
      onSuccess: (file) => {
        console.log('文件上传成功:', file);
      },
      onError: (error) => {
        console.error('文件上传失败:', error);
      }
    }
  );
}

/**
 * 批量文件上传Hook
 * @returns 批量上传状态和操作方法
 */
export function useBatchUploadFiles() {
  return useBatchOperation(
    (files: UploadFileRequest[]) => uploadAPI.batchUploadFiles(files),
    {
      onSuccess: (result) => {
        console.log('批量上传成功:', result);
      },
      onError: (error) => {
        console.error('批量上传失败:', error);
      }
    }
  );
}

/**
 * 更新媒体文件Hook
 * @returns 更新状态和操作方法
 */
export function useUpdateMedia() {
  return useSubmit(
    ({ id, data }: { id: string; data: UpdateMediaRequest }) => 
      uploadAPI.updateMediaFile(id, data),
    {
      onSuccess: (file) => {
        console.log('媒体文件更新成功:', file);
      },
      onError: (error) => {
        console.error('更新媒体文件失败:', error);
      }
    }
  );
}

/**
 * 删除媒体文件Hook
 * @returns 删除状态和操作方法
 */
export function useDeleteMedia() {
  return useSubmit(
    (id: string) => uploadAPI.deleteMediaFile(id),
    {
      onSuccess: () => {
        console.log('媒体文件删除成功');
      },
      onError: (error) => {
        console.error('删除媒体文件失败:', error);
      }
    }
  );
}

/**
 * 批量删除媒体文件Hook
 * @returns 批量删除状态和操作方法
 */
export function useBatchDeleteMedia() {
  return useBatchOperation(
    (ids: string[]) => uploadAPI.batchDeleteMediaFiles(ids),
    {
      onSuccess: (result) => {
        console.log('批量删除媒体文件成功:', result);
      },
      onError: (error) => {
        console.error('批量删除媒体文件失败:', error);
      }
    }
  );
}

/**
 * 移动媒体文件Hook
 * @returns 移动状态和操作方法
 */
export function useMoveMedia() {
  return useSubmit(
    ({ ids, folderId }: { ids: string[]; folderId: string | null }) => 
      uploadAPI.moveMediaFiles(ids, folderId),
    {
      onSuccess: () => {
        console.log('媒体文件移动成功');
      },
      onError: (error) => {
        console.error('移动媒体文件失败:', error);
      }
    }
  );
}

/**
 * 复制媒体文件Hook
 * @returns 复制状态和操作方法
 */
export function useCopyMedia() {
  return useSubmit(
    ({ ids, folderId }: { ids: string[]; folderId: string | null }) => 
      uploadAPI.copyMediaFiles(ids, folderId),
    {
      onSuccess: () => {
        console.log('媒体文件复制成功');
      },
      onError: (error) => {
        console.error('复制媒体文件失败:', error);
      }
    }
  );
}

/**
 * 媒体文件夹列表Hook
 * @param parentId 父文件夹ID
 * @returns 文件夹列表状态和操作方法
 */
export function useMediaFolders(parentId: string | null = null) {
  return useApi(
    useCallback(() => uploadAPI.getMediaFolders(parentId), [parentId]),
    {
      immediate: true,
      onError: (error) => {
        console.error('获取媒体文件夹失败:', error);
      }
    }
  );
}

/**
 * 创建媒体文件夹Hook
 * @returns 创建状态和操作方法
 */
export function useCreateMediaFolder() {
  return useSubmit(
    (data: CreateFolderRequest) => uploadAPI.createMediaFolder(data),
    {
      onSuccess: (folder) => {
        console.log('媒体文件夹创建成功:', folder);
      },
      onError: (error) => {
        console.error('创建媒体文件夹失败:', error);
      }
    }
  );
}

/**
 * 更新媒体文件夹Hook
 * @returns 更新状态和操作方法
 */
export function useUpdateMediaFolder() {
  return useSubmit(
    ({ id, data }: { id: string; data: Partial<MediaFolder> }) => 
      uploadAPI.updateMediaFolder(id, data),
    {
      onSuccess: (folder) => {
        console.log('媒体文件夹更新成功:', folder);
      },
      onError: (error) => {
        console.error('更新媒体文件夹失败:', error);
      }
    }
  );
}

/**
 * 删除媒体文件夹Hook
 * @returns 删除状态和操作方法
 */
export function useDeleteMediaFolder() {
  return useSubmit(
    (id: string) => uploadAPI.deleteMediaFolder(id),
    {
      onSuccess: () => {
        console.log('媒体文件夹删除成功');
      },
      onError: (error) => {
        console.error('删除媒体文件夹失败:', error);
      }
    }
  );
}

/**
 * 媒体统计Hook
 * @returns 媒体统计数据
 */
export function useMediaStats() {
  return useApi(
    () => uploadAPI.getMediaStats(),
    {
      immediate: true,
      // refreshInterval: 60000, // 暂时禁用自动刷新，避免频繁API调用
      onError: (error) => {
        console.error('获取媒体统计失败:', error);
      }
    }
  );
}

/**
 * 媒体搜索Hook
 * @param query 搜索关键词
 * @param params 搜索参数
 * @returns 搜索结果状态和操作方法
 */
export function useMediaSearch(
  query: string,
  params: Omit<MediaListParams, 'search'> = { page: 1, limit: 20 }
) {
  return usePaginatedApi(
    useCallback((searchParams: MediaListParams) => 
      uploadAPI.getMediaFiles({ ...searchParams, search: query }),
    [query]),
    { ...params, search: query },
    {
      immediate: !!query,
      onError: (error) => {
        console.error('搜索媒体文件失败:', error);
      }
    }
  );
}

/**
 * 获取文件下载链接Hook
 * @returns 获取下载链接状态和操作方法
 */
export function useGetDownloadUrl() {
  return useSubmit(
    (id: string) => uploadAPI.getDownloadUrl(id),
    {
      onSuccess: (url) => {
        // 自动下载文件
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('文件下载链接获取成功');
      },
      onError: (error) => {
        console.error('获取文件下载链接失败:', error);
      }
    }
  );
}

/**
 * 批量下载文件Hook
 * @returns 批量下载状态和操作方法
 */
export function useBatchDownloadMedia() {
  return useSubmit(
    (ids: string[]) => uploadAPI.batchDownloadMediaFiles(ids),
    {
      onSuccess: (blob) => {
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `media_files_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('批量下载成功');
      },
      onError: (error) => {
        console.error('批量下载失败:', error);
      }
    }
  );
}

/**
 * 生成文件缩略图Hook
 * @returns 生成缩略图状态和操作方法
 */
export function useGenerateThumbnail() {
  return useSubmit(
    (id: string) => uploadAPI.generateThumbnail(id),
    {
      onSuccess: (thumbnail) => {
        console.log('缩略图生成成功:', thumbnail);
      },
      onError: (error) => {
        console.error('生成缩略图失败:', error);
      }
    }
  );
}

/**
 * 文件压缩Hook
 * @returns 压缩状态和操作方法
 */
export function useCompressMedia() {
  return useSubmit(
    ({ id, quality }: { id: string; quality: number }) => 
      uploadAPI.compressMediaFile(id, quality),
    {
      onSuccess: (file) => {
        console.log('文件压缩成功:', file);
      },
      onError: (error) => {
        console.error('文件压缩失败:', error);
      }
    }
  );
}

/**
 * 文件格式转换Hook
 * @returns 转换状态和操作方法
 */
export function useConvertMedia() {
  return useSubmit(
    ({ id, format }: { id: string; format: string }) => 
      uploadAPI.convertMediaFile(id, format),
    {
      onSuccess: (file) => {
        console.log('文件格式转换成功:', file);
      },
      onError: (error) => {
        console.error('文件格式转换失败:', error);
      }
    }
  );
}

/**
 * 清理未使用的媒体文件Hook
 * @returns 清理状态和操作方法
 */
export function useCleanupUnusedMedia() {
  return useSubmit(
    () => uploadAPI.cleanupUnusedMedia(),
    {
      onSuccess: (result) => {
        console.log('清理未使用媒体文件成功:', result);
      },
      onError: (error) => {
        console.error('清理未使用媒体文件失败:', error);
      }
    }
  );
}