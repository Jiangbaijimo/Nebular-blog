// 文件上传配置

// 文件大小限制（字节）
export const FILE_SIZE_LIMITS = {
  // 图片文件
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    THUMBNAIL_MAX_SIZE: 2 * 1024 * 1024, // 2MB
    AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  },
  
  // 视频文件
  VIDEO: {
    MAX_SIZE: 500 * 1024 * 1024, // 500MB
    PREVIEW_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  },
  
  // 音频文件
  AUDIO: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
  },
  
  // 文档文件
  DOCUMENT: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
  },
  
  // 压缩包
  ARCHIVE: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
  },
  
  // 其他文件
  OTHER: {
    MAX_SIZE: 20 * 1024 * 1024, // 20MB
  },
} as const;

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  // 图片类型
  IMAGE: {
    MIME_TYPES: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
    ],
    EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'],
  },
  
  // 视频类型
  VIDEO: {
    MIME_TYPES: [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv',
      'video/3gp',
    ],
    EXTENSIONS: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.3gp'],
  },
  
  // 音频类型
  AUDIO: {
    MIME_TYPES: [
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
      'audio/m4a',
      'audio/wma',
    ],
    EXTENSIONS: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma'],
  },
  
  // 文档类型
  DOCUMENT: {
    MIME_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf',
    ],
    EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf'],
  },
  
  // 压缩包类型
  ARCHIVE: {
    MIME_TYPES: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
    ],
    EXTENSIONS: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  },
  
  // 代码文件类型
  CODE: {
    MIME_TYPES: [
      'text/javascript',
      'text/typescript',
      'text/html',
      'text/css',
      'application/json',
      'text/xml',
      'text/markdown',
    ],
    EXTENSIONS: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json', '.xml', '.md', '.py', '.java', '.cpp', '.c'],
  },
} as const;

// 上传配置
export const UPLOAD_CONFIG = {
  // 分片上传配置
  CHUNK: {
    SIZE: 2 * 1024 * 1024, // 2MB per chunk
    MAX_CONCURRENT: 3, // 最大并发上传数
    RETRY_TIMES: 3, // 重试次数
    RETRY_DELAY: 1000, // 重试延迟（毫秒）
  },
  
  // 并发上传配置
  CONCURRENT: {
    MAX_FILES: 5, // 最大同时上传文件数
    MAX_CONNECTIONS: 3, // 每个文件最大连接数
  },
  
  // 压缩配置
  COMPRESSION: {
    IMAGE: {
      QUALITY: 0.8, // 压缩质量 (0-1)
      MAX_WIDTH: 1920, // 最大宽度
      MAX_HEIGHT: 1080, // 最大高度
      FORMAT: 'webp', // 目标格式
    },
    THUMBNAIL: {
      QUALITY: 0.7,
      MAX_WIDTH: 300,
      MAX_HEIGHT: 300,
      FORMAT: 'webp',
    },
  },
  
  // 缓存配置
  CACHE: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    MAX_FILES: 1000, // 最大缓存文件数
    EXPIRE_TIME: 7 * 24 * 60 * 60 * 1000, // 7天过期
  },
  
  // 预览配置
  PREVIEW: {
    IMAGE: {
      MAX_SIZE: 5 * 1024 * 1024, // 5MB
      THUMBNAIL_SIZE: 200, // 缩略图尺寸
    },
    VIDEO: {
      MAX_SIZE: 50 * 1024 * 1024, // 50MB
      THUMBNAIL_TIME: 1, // 视频缩略图截取时间（秒）
    },
  },
} as const;

// 上传状态
export const UPLOAD_STATUS = {
  PENDING: 'pending', // 等待上传
  UPLOADING: 'uploading', // 上传中
  PROCESSING: 'processing', // 处理中
  SUCCESS: 'success', // 上传成功
  ERROR: 'error', // 上传失败
  CANCELLED: 'cancelled', // 已取消
  PAUSED: 'paused', // 已暂停
} as const;

// 上传错误类型
export const UPLOAD_ERROR_TYPES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
  UNKNOWN: 'UNKNOWN',
} as const;

// 错误消息映射
export const UPLOAD_ERROR_MESSAGES = {
  [UPLOAD_ERROR_TYPES.FILE_TOO_LARGE]: '文件大小超出限制',
  [UPLOAD_ERROR_TYPES.INVALID_FILE_TYPE]: '不支持的文件类型',
  [UPLOAD_ERROR_TYPES.NETWORK_ERROR]: '网络连接错误',
  [UPLOAD_ERROR_TYPES.SERVER_ERROR]: '服务器错误',
  [UPLOAD_ERROR_TYPES.QUOTA_EXCEEDED]: '存储空间不足',
  [UPLOAD_ERROR_TYPES.PERMISSION_DENIED]: '权限不足',
  [UPLOAD_ERROR_TYPES.FILE_CORRUPTED]: '文件已损坏',
  [UPLOAD_ERROR_TYPES.TIMEOUT]: '上传超时',
  [UPLOAD_ERROR_TYPES.CANCELLED]: '上传已取消',
  [UPLOAD_ERROR_TYPES.UNKNOWN]: '未知错误',
} as const;

// 文件类型检测
export const fileTypeUtils = {
  // 根据MIME类型获取文件分类
  getFileCategory: (mimeType: string): keyof typeof SUPPORTED_FILE_TYPES => {
    for (const [category, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.MIME_TYPES.includes(mimeType)) {
        return category as keyof typeof SUPPORTED_FILE_TYPES;
      }
    }
    return 'OTHER' as keyof typeof SUPPORTED_FILE_TYPES;
  },
  
  // 根据文件扩展名获取文件分类
  getFileCategoryByExtension: (filename: string): keyof typeof SUPPORTED_FILE_TYPES => {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    for (const [category, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.EXTENSIONS.includes(extension)) {
        return category as keyof typeof SUPPORTED_FILE_TYPES;
      }
    }
    return 'OTHER' as keyof typeof SUPPORTED_FILE_TYPES;
  },
  
  // 检查文件类型是否支持
  isFileTypeSupported: (mimeType: string): boolean => {
    return Object.values(SUPPORTED_FILE_TYPES).some(config => 
      config.MIME_TYPES.includes(mimeType)
    );
  },
  
  // 检查文件扩展名是否支持
  isFileExtensionSupported: (filename: string): boolean => {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return Object.values(SUPPORTED_FILE_TYPES).some(config => 
      config.EXTENSIONS.includes(extension)
    );
  },
  
  // 获取文件大小限制
  getFileSizeLimit: (mimeType: string): number => {
    const category = fileTypeUtils.getFileCategory(mimeType);
    switch (category) {
      case 'IMAGE':
        return FILE_SIZE_LIMITS.IMAGE.MAX_SIZE;
      case 'VIDEO':
        return FILE_SIZE_LIMITS.VIDEO.MAX_SIZE;
      case 'AUDIO':
        return FILE_SIZE_LIMITS.AUDIO.MAX_SIZE;
      case 'DOCUMENT':
        return FILE_SIZE_LIMITS.DOCUMENT.MAX_SIZE;
      case 'ARCHIVE':
        return FILE_SIZE_LIMITS.ARCHIVE.MAX_SIZE;
      default:
        return FILE_SIZE_LIMITS.OTHER.MAX_SIZE;
    }
  },
  
  // 检查文件大小是否超限
  isFileSizeValid: (file: File): boolean => {
    const limit = fileTypeUtils.getFileSizeLimit(file.type);
    return file.size <= limit;
  },
  
  // 格式化文件大小
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // 获取文件图标
  getFileIcon: (mimeType: string): string => {
    const category = fileTypeUtils.getFileCategory(mimeType);
    switch (category) {
      case 'IMAGE':
        return 'Image';
      case 'VIDEO':
        return 'Video';
      case 'AUDIO':
        return 'Music';
      case 'DOCUMENT':
        return 'FileText';
      case 'ARCHIVE':
        return 'Archive';
      case 'CODE':
        return 'Code';
      default:
        return 'File';
    }
  },
};

// 上传队列配置
export const UPLOAD_QUEUE_CONFIG = {
  MAX_QUEUE_SIZE: 100, // 最大队列长度
  AUTO_START: true, // 自动开始上传
  RETRY_FAILED: true, // 自动重试失败的上传
  SAVE_PROGRESS: true, // 保存上传进度
  CLEAR_COMPLETED: false, // 自动清除已完成的任务
} as const;

// 本地存储键名
export const UPLOAD_STORAGE_KEYS = {
  UPLOAD_QUEUE: 'upload_queue',
  UPLOAD_PROGRESS: 'upload_progress',
  UPLOAD_SETTINGS: 'upload_settings',
  FAILED_UPLOADS: 'failed_uploads',
  UPLOAD_CACHE: 'upload_cache',
} as const;

// 上传事件类型
export const UPLOAD_EVENTS = {
  QUEUE_CHANGED: 'upload:queue_changed',
  PROGRESS_UPDATED: 'upload:progress_updated',
  FILE_COMPLETED: 'upload:file_completed',
  FILE_FAILED: 'upload:file_failed',
  ALL_COMPLETED: 'upload:all_completed',
  QUEUE_CLEARED: 'upload:queue_cleared',
} as const;