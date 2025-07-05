// 文件上传相关类型定义

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: UploadStatus;
  progress: number;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
  error?: string;
  url?: string;
  thumbnailUrl?: string;
  metadata?: FileMetadata;
  chunks?: FileChunk[];
}

export enum UploadStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export interface FileChunk {
  index: number;
  start: number;
  end: number;
  blob: Blob;
  status: ChunkStatus;
  retries: number;
  uploadedAt?: Date;
}

export enum ChunkStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface UploadConfig {
  maxFileSize: number; // bytes
  maxFiles: number;
  allowedTypes: string[];
  chunkSize: number; // bytes
  maxConcurrentUploads: number;
  maxRetries: number;
  retryDelay: number; // milliseconds
  autoUpload: boolean;
  enableCompression: boolean;
  compressionQuality: number;
  enableThumbnails: boolean;
  thumbnailSize: { width: number; height: number };
}

export interface ImageCompressionOptions {
  quality: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'webp' | 'png';
  enableResize: boolean;
  maintainAspectRatio: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export interface UploadQueue {
  files: UploadFile[];
  activeUploads: number;
  totalSize: number;
  uploadedSize: number;
  overallProgress: number;
  estimatedTimeRemaining?: number;
}

export interface UploadStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
  averageSpeed: number;
  totalTime: number;
}

export interface CloudStorageConfig {
  provider: CloudProvider;
  bucket: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  endpoint?: string;
  cdnUrl?: string;
  enableCdn: boolean;
}

export enum CloudProvider {
  AWS_S3 = 'aws-s3',
  GOOGLE_CLOUD = 'google-cloud',
  AZURE_BLOB = 'azure-blob',
  ALIBABA_OSS = 'alibaba-oss',
  QINIU = 'qiniu',
  TENCENT_COS = 'tencent-cos',
  LOCAL = 'local'
}

export interface FileMetadata {
  // 通用元数据
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploadedAt: Date;
  uploadedBy: string;
  
  // 图片元数据
  width?: number;
  height?: number;
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  
  // 视频元数据
  duration?: number;
  bitrate?: number;
  framerate?: number;
  codec?: string;
  
  // 音频元数据
  sampleRate?: number;
  channels?: number;
  
  // 文档元数据
  pageCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  
  // 自定义元数据
  tags?: string[];
  description?: string;
  alt?: string;
  caption?: string;
  customFields?: Record<string, any>;
}

export interface ThumbnailConfig {
  enabled: boolean;
  sizes: ThumbnailSize[];
  quality: number;
  format: 'jpeg' | 'webp' | 'png';
  background?: string;
}

export interface ThumbnailSize {
  name: string;
  width: number;
  height: number;
  crop: boolean;
}

export interface UploadEvent {
  type: UploadEventType;
  fileId: string;
  data?: any;
  timestamp: Date;
}

export enum UploadEventType {
  FILE_ADDED = 'file-added',
  FILE_REMOVED = 'file-removed',
  UPLOAD_STARTED = 'upload-started',
  UPLOAD_PROGRESS = 'upload-progress',
  UPLOAD_COMPLETED = 'upload-completed',
  UPLOAD_FAILED = 'upload-failed',
  UPLOAD_CANCELLED = 'upload-cancelled',
  UPLOAD_PAUSED = 'upload-paused',
  UPLOAD_RESUMED = 'upload-resumed',
  CHUNK_UPLOADED = 'chunk-uploaded',
  CHUNK_FAILED = 'chunk-failed'
}

export interface DropzoneConfig {
  accept?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  preventDropOnDocument?: boolean;
  noClick?: boolean;
  noKeyboard?: boolean;
  noDrag?: boolean;
  noDragEventsBubbling?: boolean;
}

export interface PasteUploadConfig {
  enabled: boolean;
  autoUpload: boolean;
  supportedTypes: string[];
  maxSize: number;
  generateFilename: (file: File) => string;
}