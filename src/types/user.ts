// 用户相关类型定义

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  preferences: UserPreferences;
  socialLinks?: SocialLinks;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  SUBSCRIBER = 'subscriber'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: EmailNotificationSettings;
  editorSettings: EditorPreferences;
  privacy: PrivacySettings;
}

export interface EmailNotificationSettings {
  newComments: boolean;
  newFollowers: boolean;
  postLikes: boolean;
  systemUpdates: boolean;
  weeklyDigest: boolean;
}

export interface EditorPreferences {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // 秒
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showLastSeen: boolean;
  allowComments: boolean;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface AuthUser {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
  acceptTerms: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: Partial<SocialLinks>;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}