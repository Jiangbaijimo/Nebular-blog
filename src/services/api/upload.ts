// 文件上传API服务
import httpClient from '../http';
import { API_ENDPOINTS } from '../../constants/api';
import type {
  UploadResponse,
  UploadProgress,
  UploadOptions,
  FileInfo,
  ImageUploadResponse,
  VideoUploadResponse,
  DocumentUploadResponse,
  UploadTask,
  UploadChunk,
  MediaLibraryItem,
  MediaLibraryParams,
  MediaLibraryResponse,
} from '../../types/upload';
import type { PaginationParams, PaginationResult } from '../../types/common';

/**
 * 文件上传API服务类
 */
class UploadAPI {
  // ==================== 基础文件上传 ====================

  /**
   * 单文件上传
   */
  async uploadFile(
    file: File,
    options?: UploadOptions
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // 添加额外参数
    if (options?.folder) {
      formData.append('folder', options.folder);
    }
    if (options?.isPublic !== undefined) {
      formData.append('isPublic', options.isPublic.toString());
    }
    if (options?.tags) {
      formData.append('tags', JSON.stringify(options.tags));
    }
    if (options?.description) {
      formData.append('description', options.description);
    }

    return httpClient.upload<UploadResponse>(
      API_ENDPOINTS.UPLOAD.FILE,
      file,
      {
        onProgress: options?.onProgress,
      }
    );
  }

  /**
   * 多文件批量上传
   */
  async uploadMultipleFiles(
    files: File[],
    options?: UploadOptions & {
      onFileProgress?: (fileIndex: number, progress: number) => void;
      onFileComplete?: (fileIndex: number, result: UploadResponse) => void;
      onFileError?: (fileIndex: number, error: Error) => void;
      maxConcurrent?: number;
    }
  ): Promise<UploadResponse[]> {
    return httpClient.uploadMultiple<UploadResponse>(
      API_ENDPOINTS.UPLOAD.MULTIPLE,
      files,
      {
        onProgress: options?.onFileProgress,
        onComplete: options?.onFileComplete,
        onError: options?.onFileError,
        maxConcurrent: options?.maxConcurrent,
      }
    );
  }

  // ==================== 图片上传 ====================

  /**
   * 图片上传（支持压缩和缩略图生成）
   */
  async uploadImage(
    file: File,
    options?: UploadOptions & {
      compress?: boolean;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      generateThumbnail?: boolean;
      thumbnailSize?: number;
    }
  ): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    
    // 添加图片处理参数
    if (options?.compress !== undefined) {
      formData.append('compress', options.compress.toString());
    }
    if (options?.quality) {
      formData.append('quality', options.quality.toString());
    }
    if (options?.maxWidth) {
      formData.append('maxWidth', options.maxWidth.toString());
    }
    if (options?.maxHeight) {
      formData.append('maxHeight', options.maxHeight.toString());
    }
    if (options?.generateThumbnail !== undefined) {
      formData.append('generateThumbnail', options.generateThumbnail.toString());
    }
    if (options?.thumbnailSize) {
      formData.append('thumbnailSize', options.thumbnailSize.toString());
    }
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    return httpClient.upload<ImageUploadResponse>(
      API_ENDPOINTS.UPLOAD.IMAGE,
      file,
      {
        onProgress: options?.onProgress,
      }
    );
  }

  /**
   * 批量图片上传
   */
  async uploadMultipleImages(
    files: File[],
    options?: UploadOptions & {
      compress?: boolean;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      generateThumbnail?: boolean;
      thumbnailSize?: number;
      onFileProgress?: (fileIndex: number, progress: number) => void;
      onFileComplete?: (fileIndex: number, result: ImageUploadResponse) => void;
      onFileError?: (fileIndex: number, error: Error) => void;
    }
  ): Promise<ImageUploadResponse[]> {
    const results: ImageUploadResponse[] = [];
    const maxConcurrent = 3; // 限制并发数

    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex;
        try {
          const result = await this.uploadImage(file, {
            ...options,
            onProgress: (progress) => options?.onFileProgress?.(fileIndex, progress),
          });
          results[fileIndex] = result;
          options?.onFileComplete?.(fileIndex, result);
          return result;
        } catch (error) {
          options?.onFileError?.(fileIndex, error as Error);
          throw error;
        }
      });

      await Promise.allSettled(batchPromises);
    }

    return results;
  }

  // ==================== 视频上传 ====================

  /**
   * 视频上传
   */
  async uploadVideo(
    file: File,
    options?: UploadOptions & {
      generateThumbnail?: boolean;
      thumbnailTime?: number; // 缩略图截取时间（秒）
    }
  ): Promise<VideoUploadResponse> {
    const formData = new FormData();
    formData.append('video', file);
    
    if (options?.generateThumbnail !== undefined) {
      formData.append('generateThumbnail', options.generateThumbnail.toString());
    }
    if (options?.thumbnailTime) {
      formData.append('thumbnailTime', options.thumbnailTime.toString());
    }
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    return httpClient.upload<VideoUploadResponse>(
      API_ENDPOINTS.UPLOAD.VIDEO,
      file,
      {
        onProgress: options?.onProgress,
      }
    );
  }

  // ==================== 文档上传 ====================

  /**
   * 文档上传
   */
  async uploadDocument(
    file: File,
    options?: UploadOptions
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('document', file);
    
    if (options?.folder) {
      formData.append('folder', options.folder);
    }
    if (options?.description) {
      formData.append('description', options.description);
    }

    return httpClient.upload<DocumentUploadResponse>(
      API_ENDPOINTS.UPLOAD.DOCUMENT,
      file,
      {
        onProgress: options?.onProgress,
      }
    );
  }

  // ==================== 分片上传（大文件） ====================

  /**
   * 初始化分片上传
   */
  async initChunkUpload(file: File, chunkSize = 1024 * 1024): Promise<{
    uploadId: string;
    chunkSize: number;
    totalChunks: number;
  }> {
    return httpClient.post(API_ENDPOINTS.UPLOAD.CHUNK_INIT, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      chunkSize,
    });
  }

  /**
   * 上传文件分片
   */
  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunk: Blob,
    onProgress?: (progress: number) => void
  ): Promise<UploadChunk> {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('chunk', chunk);

    return httpClient.post<UploadChunk>(
      API_ENDPOINTS.UPLOAD.CHUNK_UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );
  }

  /**
   * 完成分片上传
   */
  async completeChunkUpload(uploadId: string): Promise<UploadResponse> {
    return httpClient.post<UploadResponse>(API_ENDPOINTS.UPLOAD.CHUNK_COMPLETE, {
      uploadId,
    });
  }

  /**
   * 取消分片上传
   */
  async cancelChunkUpload(uploadId: string): Promise<void> {
    return httpClient.post(API_ENDPOINTS.UPLOAD.CHUNK_CANCEL, {
      uploadId,
    });
  }

  /**
   * 获取已上传的分片列表
   */
  async getUploadedChunks(uploadId: string): Promise<number[]> {
    return httpClient.get<number[]>(`${API_ENDPOINTS.UPLOAD.CHUNK_LIST}/${uploadId}`);
  }

  // ==================== 媒体库管理 ====================

  /**
   * 获取媒体库文件列表
   */
  async getMediaLibrary(params?: MediaLibraryParams): Promise<MediaLibraryResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.UPLOAD.MEDIA_LIBRARY}?${queryParams.toString()}`
      : API_ENDPOINTS.UPLOAD.MEDIA_LIBRARY;

    return httpClient.get<MediaLibraryResponse>(url);
  }

  /**
   * 获取文件详情
   */
  async getFileInfo(fileId: string): Promise<MediaLibraryItem> {
    return httpClient.get<MediaLibraryItem>(`${API_ENDPOINTS.UPLOAD.FILE_INFO}/${fileId}`);
  }

  /**
   * 更新文件信息
   */
  async updateFileInfo(
    fileId: string,
    data: {
      name?: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<MediaLibraryItem> {
    return httpClient.put<MediaLibraryItem>(
      `${API_ENDPOINTS.UPLOAD.FILE_INFO}/${fileId}`,
      data
    );
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.UPLOAD.DELETE}/${fileId}`);
  }

  /**
   * 批量删除文件
   */
  async deleteMultipleFiles(fileIds: string[]): Promise<void> {
    return httpClient.post(API_ENDPOINTS.UPLOAD.DELETE_MULTIPLE, { fileIds });
  }

  /**
   * 移动文件到文件夹
   */
  async moveFile(fileId: string, folderId: string): Promise<MediaLibraryItem> {
    return httpClient.post<MediaLibraryItem>(`${API_ENDPOINTS.UPLOAD.MOVE}/${fileId}`, {
      folderId,
    });
  }

  /**
   * 复制文件
   */
  async copyFile(fileId: string, folderId?: string): Promise<MediaLibraryItem> {
    return httpClient.post<MediaLibraryItem>(`${API_ENDPOINTS.UPLOAD.COPY}/${fileId}`, {
      folderId,
    });
  }

  // ==================== 文件夹管理 ====================

  /**
   * 创建文件夹
   */
  async createFolder(name: string, parentId?: string): Promise<{
    id: string;
    name: string;
    parentId?: string;
    path: string;
    createdAt: string;
  }> {
    return httpClient.post(API_ENDPOINTS.UPLOAD.CREATE_FOLDER, {
      name,
      parentId,
    });
  }

  /**
   * 重命名文件夹
   */
  async renameFolder(folderId: string, name: string): Promise<void> {
    return httpClient.put(`${API_ENDPOINTS.UPLOAD.RENAME_FOLDER}/${folderId}`, {
      name,
    });
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(folderId: string, force = false): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.UPLOAD.DELETE_FOLDER}/${folderId}?force=${force}`);
  }

  // ==================== 文件搜索 ====================

  /**
   * 搜索文件
   */
  async searchFiles(params: {
    query: string;
    type?: 'image' | 'video' | 'document' | 'all';
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    sizeMin?: number;
    sizeMax?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<MediaLibraryItem>> {
    return httpClient.post<PaginationResult<MediaLibraryItem>>(
      API_ENDPOINTS.UPLOAD.SEARCH,
      params
    );
  }

  // ==================== 文件统计 ====================

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    usedSpace: number;
    availableSpace: number;
    filesByType: Record<string, number>;
    sizeByType: Record<string, number>;
  }> {
    return httpClient.get(API_ENDPOINTS.UPLOAD.STATS);
  }

  // ==================== 文件预览 ====================

  /**
   * 获取文件预览URL
   */
  async getPreviewUrl(
    fileId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    }
  ): Promise<{ url: string; expiresAt: string }> {
    const queryParams = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.UPLOAD.PREVIEW}/${fileId}?${queryParams.toString()}`
      : `${API_ENDPOINTS.UPLOAD.PREVIEW}/${fileId}`;

    return httpClient.get<{ url: string; expiresAt: string }>(url);
  }

  /**
   * 获取文件下载URL
   */
  async getDownloadUrl(fileId: string): Promise<{ url: string; expiresAt: string }> {
    return httpClient.get<{ url: string; expiresAt: string }>(
      `${API_ENDPOINTS.UPLOAD.DOWNLOAD}/${fileId}`
    );
  }

  // ==================== 工具方法 ====================

  /**
   * 验证文件类型
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * 验证文件大小
   */
  validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * 生成文件预览
   */
  async generateFilePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 压缩图片
   */
  async compressImage(
    file: File,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: 'jpeg' | 'webp' | 'png';
    } = {}
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { quality = 0.8, maxWidth = 1920, maxHeight = 1080, format = 'jpeg' } = options;
        
        // 计算新尺寸
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // 绘制图片
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

// 创建上传API实例
const uploadAPI = new UploadAPI();

export { uploadAPI, UploadAPI };
export default uploadAPI;