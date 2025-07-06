// 认证相关类型定义

// 用户基础信息
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  role: UserRole;
  permissions: string[];
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
}

// 用户角色
export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  emailNotifications: {
    newComment: boolean;
    newFollower: boolean;
    blogLiked: boolean;
    blogShared: boolean;
    systemUpdates: boolean;
    newsletter: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    newComment: boolean;
    newFollower: boolean;
    blogLiked: boolean;
    mentions: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    showBirthday: boolean;
    allowDirectMessages: boolean;
    allowComments: boolean;
  };
  editor: {
    theme: string;
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
  };
}

// 用户统计信息
export interface UserStats {
  blogsCount: number;
  draftsCount: number;
  commentsCount: number;
  likesReceived: number;
  viewsReceived: number;
  followersCount: number;
  followingCount: number;
  totalWords: number;
  totalReadingTime: number;
}

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}



// 登录响应
export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  session: UserSession;
  requiresTwoFactor?: boolean;
  twoFactorMethods?: TwoFactorMethod[];
}

// 认证令牌
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: string;
  scope?: string[];
}

// 用户会话
export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  ipAddress: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

// 两步验证方法
export interface TwoFactorMethod {
  type: 'totp' | 'sms' | 'email' | 'backup_codes';
  enabled: boolean;
  verified: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

// TOTP设置
export interface TotpSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
}

// 两步验证验证请求
export interface TwoFactorVerifyRequest {
  code: string;
  method: 'totp' | 'sms' | 'email' | 'backup_code';
  rememberDevice?: boolean;
}

// OAuth提供商
export type OAuthProvider = 'google' | 'github' | 'facebook' | 'twitter' | 'discord';

// OAuth登录请求
export interface OAuthLoginRequest {
  provider: OAuthProvider;
  code: string;
  state?: string;
  redirectUri: string;
}

// OAuth账户信息
export interface OAuthAccount {
  id: string;
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string[];
  createdAt: string;
  updatedAt: string;
}

// 密码重置请求
export interface PasswordResetRequest {
  email: string;
  captcha?: string;
}

// 密码重置确认请求
export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// 修改密码请求
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 邮箱验证请求
export interface EmailVerificationRequest {
  token: string;
}

// 重发验证邮件请求
export interface ResendVerificationRequest {
  email: string;
}

// 用户名/邮箱检查请求
export interface UsernameCheckRequest {
  username: string;
}

export interface EmailCheckRequest {
  email: string;
}

// 用户名/邮箱检查响应
export interface UsernameCheckResponse {
  available: boolean;
  suggestions?: string[];
}

export interface EmailCheckResponse {
  available: boolean;
  registered: boolean;
}

// 用户资料更新请求
export interface ProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
}

// 头像上传响应
export interface AvatarUploadResponse {
  url: string;
  thumbnailUrl: string;
  originalUrl: string;
}

// 用户偏好更新请求
export interface PreferencesUpdateRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  emailNotifications?: Partial<UserPreferences['emailNotifications']>;
  pushNotifications?: Partial<UserPreferences['pushNotifications']>;
  privacy?: Partial<UserPreferences['privacy']>;
  editor?: Partial<UserPreferences['editor']>;
}

// 认证状态
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

// 认证错误类型
export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// 认证上下文
export interface AuthContext {
  user: User | null;
  status: AuthStatus;
  error: AuthError | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: ProfileUpdateRequest) => Promise<void>;
  updatePreferences: (data: PreferencesUpdateRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  resetPassword: (data: PasswordResetRequest) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  enableTwoFactor: () => Promise<TotpSetup>;
  disableTwoFactor: (code: string) => Promise<void>;
  verifyTwoFactor: (data: TwoFactorVerifyRequest) => Promise<void>;
}

// 权限定义
export const PERMISSIONS = {
  // 博客权限
  BLOG_CREATE: 'blog:create',
  BLOG_READ: 'blog:read',
  BLOG_UPDATE: 'blog:update',
  BLOG_DELETE: 'blog:delete',
  BLOG_PUBLISH: 'blog:publish',
  BLOG_MODERATE: 'blog:moderate',
  
  // 评论权限
  COMMENT_CREATE: 'comment:create',
  COMMENT_READ: 'comment:read',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_MODERATE: 'comment:moderate',
  
  // 用户权限
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',
  
  // 媒体权限
  MEDIA_UPLOAD: 'media:upload',
  MEDIA_READ: 'media:read',
  MEDIA_UPDATE: 'media:update',
  MEDIA_DELETE: 'media:delete',
  MEDIA_MANAGE: 'media:manage',
  
  // 云函数权限
  FUNCTION_CREATE: 'function:create',
  FUNCTION_READ: 'function:read',
  FUNCTION_UPDATE: 'function:update',
  FUNCTION_DELETE: 'function:delete',
  FUNCTION_EXECUTE: 'function:execute',
  FUNCTION_MANAGE: 'function:manage',
  
  // 系统权限
  SYSTEM_READ: 'system:read',
  SYSTEM_UPDATE: 'system:update',
  SYSTEM_MANAGE: 'system:manage',
  
  // 管理员权限
  ADMIN_ACCESS: 'admin:access',
  ADMIN_USERS: 'admin:users',
  ADMIN_CONTENT: 'admin:content',
  ADMIN_SYSTEM: 'admin:system',
} as const;

// 角色定义
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  EDITOR: 'editor',
  AUTHOR: 'author',
  USER: 'user',
  GUEST: 'guest',
} as const;

// 角色权限映射
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.BLOG_CREATE,
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.BLOG_UPDATE,
    PERMISSIONS.BLOG_DELETE,
    PERMISSIONS.BLOG_PUBLISH,
    PERMISSIONS.BLOG_MODERATE,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_UPDATE,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_UPDATE,
    PERMISSIONS.MEDIA_DELETE,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.FUNCTION_READ,
    PERMISSIONS.FUNCTION_EXECUTE,
    PERMISSIONS.SYSTEM_READ,
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.ADMIN_USERS,
    PERMISSIONS.ADMIN_CONTENT,
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.BLOG_MODERATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.ADMIN_CONTENT,
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.BLOG_CREATE,
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.BLOG_UPDATE,
    PERMISSIONS.BLOG_DELETE,
    PERMISSIONS.BLOG_PUBLISH,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_UPDATE,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_UPDATE,
    PERMISSIONS.MEDIA_DELETE,
  ],
  [ROLES.AUTHOR]: [
    PERMISSIONS.BLOG_CREATE,
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.BLOG_UPDATE,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
  ],
  [ROLES.USER]: [
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.MEDIA_READ,
  ],
  [ROLES.GUEST]: [
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.COMMENT_READ,
  ],
} as const;

// 认证事件类型
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth:login_success',
  LOGIN_FAILED: 'auth:login_failed',
  LOGOUT: 'auth:logout',
  TOKEN_REFRESHED: 'auth:token_refreshed',
  TOKEN_EXPIRED: 'auth:token_expired',
  USER_UPDATED: 'auth:user_updated',
  PERMISSION_CHANGED: 'auth:permission_changed',
  SESSION_EXPIRED: 'auth:session_expired',
  TWO_FACTOR_REQUIRED: 'auth:two_factor_required',
  TWO_FACTOR_VERIFIED: 'auth:two_factor_verified',
} as const;

// 认证存储键名
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  PREFERENCES: 'user_preferences',
  SESSION: 'user_session',
  REMEMBER_ME: 'remember_me',
  DEVICE_ID: 'device_id',
} as const;