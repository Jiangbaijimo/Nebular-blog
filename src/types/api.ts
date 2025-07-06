// API相关类型定义

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  cache?: boolean;
  cacheTTL?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number; // for videos
  format?: string;
  quality?: number;
  compression?: string;
}

export interface BatchUploadResponse {
  successful: FileUploadResponse[];
  failed: {
    file: File;
    error: string;
  }[];
  total: number;
  successCount: number;
  failureCount: number;
}

export interface ApiEndpoints {
  // 认证相关
  auth: {
    login: string;
    logout: string;
    refresh: string;
    resetPassword: string;
    changePassword: string;
    verifyEmail: string;
  };
  
  // 用户相关
  users: {
    profile: string;
    updateProfile: string;
    uploadAvatar: string;
    sessions: string;
    activities: string;
  };
  
  // 博客相关
  posts: {
    list: string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    publish: (id: string) => string;
    unpublish: (id: string) => string;
    like: (id: string) => string;
    unlike: (id: string) => string;
  };
  
  // 分类和标签
  categories: {
    list: string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
  };
  
  tags: {
    list: string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
  };
  
  // 评论相关
  comments: {
    list: (postId: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    approve: (id: string) => string;
    reject: (id: string) => string;
  };
  
  // 文件上传
  upload: {
    image: string;
    file: string;
    batch: string;
    delete: (id: string) => string;
  };
  
  // 同步相关
  sync: {
    status: string;
    push: string;
    pull: string;
    resolve: string;
  };
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeat?: boolean;
  heartbeatInterval?: number;
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}