// API服务模块导出

// 导出所有API服务
export { authAPI, AuthAPI } from './auth';
export { blogAPI, BlogAPI } from './blog';
export { uploadAPI, UploadAPI } from './upload';
export { cloudFunctionAPI, CloudFunctionAPI } from './cloudFunction';

// 导出HTTP客户端
export { httpClient, TokenManager } from '../http';
export type { RequestConfig, ApiResponse, ApiError } from '../http';

// 重新导出主要API实例
import authAPI from './auth';
import blogAPI from './blog';
import uploadAPI from './upload';
import cloudFunctionAPI from './cloudFunction';

/**
 * 统一的API服务对象
 */
export const api = {
  auth: authAPI,
  blog: blogAPI,
  upload: uploadAPI,
  cloudFunction: cloudFunctionAPI,
} as const;

// 默认导出
export default api;

// 类型导出
export type {
  // 认证相关类型
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ResetPasswordRequest,
  ChangePasswordRequest,
  OAuthLoginRequest,
  UserProfile,
  UserPreferences,
} from '../../types/auth';

export type {
  // 博客相关类型
  Blog,
  BlogPost,
  BlogCreateRequest,
  BlogUpdateRequest,
  BlogListParams,
  BlogListResponse,
  BlogStats,
  BlogCategory,
  BlogTag,
  BlogComment,
  CommentCreateRequest,
  CommentUpdateRequest,
  BlogDraft,
  BlogVersion,
  BlogSearchParams,
  BlogSearchResponse,
} from '../../types/blog';

export type {
  // 上传相关类型
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

export type {
  // 云函数相关类型
  CloudFunction,
  CloudFunctionCreateRequest,
  CloudFunctionUpdateRequest,
  CloudFunctionExecuteRequest,
  CloudFunctionExecuteResponse,
  CloudFunctionListParams,
  CloudFunctionListResponse,
  CloudFunctionLog,
  CloudFunctionVersion,
  CloudFunctionStats,
  CloudFunctionTemplate,
  CloudFunctionDeployment,
  CloudFunctionEnvironment,
  CloudFunctionTrigger,
  CloudFunctionSchedule,
} from '../../types/cloudFunction';