// 用户管理相关类型定义

// 用户角色类型
export type UserRole = 'admin' | 'author' | 'reader';

// 用户状态类型
export type UserStatus = 'active' | 'inactive' | 'banned';

// 用户基础信息（用于用户管理）
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
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
  status: UserStatus;
  role: UserRole;
  permissions: string[];
  postsCount: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
}

// 用户列表查询参数
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  minPosts?: number;
  maxPosts?: number;
  lastLogin?: 'today' | 'week' | 'month' | 'quarter' | 'never';
}

// 用户列表响应
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 用户统计信息
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  bannedUsers: number;
  adminUsers: number;
  authorUsers: number;
  readerUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  newUsersToday: number;
  averagePostsPerUser: number;
  mostActiveUsers: User[];
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email: string;
  name: string;
  displayName: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  sendWelcomeEmail?: boolean;
}

// 更新用户请求
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  name?: string;
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

// 批量删除用户请求
export interface BatchDeleteUsersRequest {
  userIds: string[];
  reason?: string;
}

// 批量更新用户状态请求
export interface BatchUpdateUserStatusRequest {
  userIds: string[];
  status: UserStatus;
  reason?: string;
}

// 更新用户状态请求
export interface UpdateUserStatusRequest {
  userId: string;
  status: UserStatus;
  reason?: string;
}

// 更新用户角色请求
export interface UpdateUserRoleRequest {
  userId: string;
  role: UserRole;
  reason?: string;
}

// 重置用户密码请求
export interface ResetUserPasswordRequest {
  userId: string;
  newPassword?: string;
  sendEmail?: boolean;
}

// 用户权限请求
export interface UserPermissionsRequest {
  userId: string;
}

// 用户权限响应
export interface UserPermissionsResponse {
  permissions: string[];
  roles: UserRole[];
  inheritedPermissions: string[];
}

// 更新用户权限请求
export interface UpdateUserPermissionsRequest {
  userId: string;
  permissions: string[];
  roles?: UserRole[];
}

// 用户活动日志
export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// 用户活动日志查询参数
export interface UserActivityLogsParams {
  userId: string;
  page?: number;
  limit?: number;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

// 用户活动日志响应
export interface UserActivityLogsResponse {
  logs: UserActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 导出用户数据请求
export interface ExportUsersRequest {
  format?: 'csv' | 'xlsx' | 'json';
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  dateFrom?: string;
  dateTo?: string;
  fields?: string[];
}

// 导入用户数据请求
export interface ImportUsersRequest {
  file: File;
  format?: 'csv' | 'xlsx' | 'json';
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  sendWelcomeEmails?: boolean;
}

// 导入用户数据响应
export interface ImportUsersResponse {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// 用户详情响应
export interface UserDetailResponse {
  user: User;
  stats: {
    postsCount: number;
    draftsCount: number;
    commentsCount: number;
    likesReceived: number;
    viewsReceived: number;
    lastLoginAt?: string;
    registrationDays: number;
  };
  recentActivity: UserActivityLog[];
  permissions: string[];
  roles: UserRole[];
}

// 用户资料更新请求
export interface UserProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  avatar?: string;
}

// 用户搜索参数
export interface UserSearchParams {
  query: string;
  role?: UserRole;
  status?: UserStatus;
  limit?: number;
  includeInactive?: boolean;
}

// 用户搜索响应
export interface UserSearchResponse {
  users: User[];
  total: number;
  suggestions: string[];
}