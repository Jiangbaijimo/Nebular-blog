// API端点配置

// 使用相对路径，通过代理访问后端API
const API_BASE_URL = '/api';
const CLOUD_FUNCTION_URL = '/api/fn';
const UPLOAD_URL = '/api/upload';

// API端点定义
export const API_ENDPOINTS = {
  // 基础配置
  BASE_URL: API_BASE_URL,
  CLOUD_FUNCTION_URL,
  UPLOAD_URL,

  // 认证相关
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    RESET_PASSWORD_CONFIRM: `${API_BASE_URL}/auth/reset-password/confirm`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
    RESEND_VERIFICATION: `${API_BASE_URL}/auth/resend-verification`,
    OAUTH_LOGIN: `${API_BASE_URL}/auth/oauth/login`,
    OAUTH_URL: `${API_BASE_URL}/auth/oauth/url`,
    GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
    GITHUB_LOGIN: `${API_BASE_URL}/auth/github`,
    ME: `${API_BASE_URL}/auth/me`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
    PREFERENCES: `${API_BASE_URL}/auth/preferences`,
    CHECK_USERNAME: `${API_BASE_URL}/auth/check-username`,
    CHECK_EMAIL: `${API_BASE_URL}/auth/check-email`,
    SESSIONS: `${API_BASE_URL}/auth/sessions`,
    TWO_FACTOR_ENABLE: `${API_BASE_URL}/auth/2fa/enable`,
    TWO_FACTOR_CONFIRM: `${API_BASE_URL}/auth/2fa/confirm`,
    TWO_FACTOR_DISABLE: `${API_BASE_URL}/auth/2fa/disable`,
    TWO_FACTOR_BACKUP_CODES: `${API_BASE_URL}/auth/2fa/backup-codes`,
    CHECK_INITIALIZATION: `${API_BASE_URL}/auth/check-initialization`,
  },

  // 用户相关
  USERS: {
    PROFILE: `${API_BASE_URL}/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
    UPLOAD_AVATAR: `${API_BASE_URL}/users/avatar`,
    SESSIONS: `${API_BASE_URL}/users/sessions`,
    ACTIVITIES: `${API_BASE_URL}/users/activities`,
    LIST: `${API_BASE_URL}/users`,
    DETAIL: (id: string) => `${API_BASE_URL}/users/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/users/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/users/${id}`,
  },

  // 博客相关
  POSTS: {
    LIST: `${API_BASE_URL}/blogs`,
    CREATE: `${API_BASE_URL}/posts`,
    DETAIL: (id: string) => `${API_BASE_URL}/posts/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/posts/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/posts/${id}`,
    PUBLISH: (id: string) => `${API_BASE_URL}/posts/${id}/publish`,
    UNPUBLISH: (id: string) => `${API_BASE_URL}/posts/${id}/unpublish`,
    LIKE: (id: string) => `${API_BASE_URL}/posts/${id}/like`,
    UNLIKE: (id: string) => `${API_BASE_URL}/posts/${id}/unlike`,
    SEARCH: `${API_BASE_URL}/posts/search`,
    STATS: `${API_BASE_URL}/posts/stats`,
    BATCH: `${API_BASE_URL}/posts/batch`,
  },

  // 博客相关 (别名，与 blogAPI 服务保持一致)
  BLOG: {
    LIST: `${API_BASE_URL}/blogs`,
    CREATE: `${API_BASE_URL}/posts`,
    DETAIL: `${API_BASE_URL}/posts`,
    UPDATE: `${API_BASE_URL}/posts`,
    DELETE: `${API_BASE_URL}/posts`,
    PUBLISH: `${API_BASE_URL}/posts`,
    UNPUBLISH: `${API_BASE_URL}/posts`,
    LIKE: `${API_BASE_URL}/posts`,
    FAVORITE: `${API_BASE_URL}/posts`,
    VIEW: `${API_BASE_URL}/posts`,
    SEARCH: `${API_BASE_URL}/posts/search`,
    SEARCH_SUGGESTIONS: `${API_BASE_URL}/posts/search/suggestions`,
    BY_SLUG: `${API_BASE_URL}/posts/slug`,
    BULK_DELETE: `${API_BASE_URL}/posts/batch-delete`,
    CATEGORIES: `${API_BASE_URL}/categories`,
    TAGS: `${API_BASE_URL}/tags`,
  },

  // 分类相关
  CATEGORIES: {
    LIST: `${API_BASE_URL}/categories`,
    CREATE: `${API_BASE_URL}/categories`,
    DETAIL: (id: string) => `${API_BASE_URL}/categories/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/categories/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/categories/${id}`,
    POSTS: (id: string) => `${API_BASE_URL}/categories/${id}/posts`,
  },

  // 标签相关
  TAGS: {
    LIST: `${API_BASE_URL}/tags`,
    CREATE: `${API_BASE_URL}/tags`,
    DETAIL: (id: string) => `${API_BASE_URL}/tags/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/tags/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/tags/${id}`,
    POSTS: (id: string) => `${API_BASE_URL}/tags/${id}/posts`,
    POPULAR: `${API_BASE_URL}/tags/popular`,
  },

  // 评论相关
  COMMENTS: {
    LIST: (postId: string) => `${API_BASE_URL}/posts/${postId}/comments`,
    CREATE: `${API_BASE_URL}/comments`,
    DETAIL: (id: string) => `${API_BASE_URL}/comments/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/comments/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/comments/${id}`,
    APPROVE: (id: string) => `${API_BASE_URL}/comments/${id}/approve`,
    REJECT: (id: string) => `${API_BASE_URL}/comments/${id}/reject`,
    REPLIES: (id: string) => `${API_BASE_URL}/comments/${id}/replies`,
  },

  // 文件上传相关
  UPLOAD: {
    IMAGE: `${UPLOAD_URL}/image`,
    FILE: `${UPLOAD_URL}/file`,
    BATCH: `${UPLOAD_URL}/batch`,
    CHUNK: `${UPLOAD_URL}/chunk`,
    MERGE: `${UPLOAD_URL}/merge`,
    DELETE: (id: string) => `${UPLOAD_URL}/${id}`,
    LIST: `${UPLOAD_URL}/list`,
    COMPRESS: `${UPLOAD_URL}/compress`,
    THUMBNAIL: `${UPLOAD_URL}/thumbnail`,
  },

  // 媒体库相关
  MEDIA: {
    LIST: `${API_BASE_URL}/media`,
    UPLOAD: `${API_BASE_URL}/media/upload`,
    DELETE: (id: string) => `${API_BASE_URL}/media/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/media/${id}`,
    BATCH_DELETE: `${API_BASE_URL}/media/batch-delete`,
    FOLDERS: `${API_BASE_URL}/media/folders`,
    MOVE: `${API_BASE_URL}/media/move`,
  },

  // 同步相关
  SYNC: {
    STATUS: `${API_BASE_URL}/sync/status`,
    PUSH: `${API_BASE_URL}/sync/push`,
    PULL: `${API_BASE_URL}/sync/pull`,
    RESOLVE: `${API_BASE_URL}/sync/resolve`,
    CONFLICTS: `${API_BASE_URL}/sync/conflicts`,
    HISTORY: `${API_BASE_URL}/sync/history`,
  },

  // 云函数相关
  CLOUD_FUNCTIONS: {
    LIST: `${CLOUD_FUNCTION_URL}/list`,
    EXECUTE: (name: string) => `${CLOUD_FUNCTION_URL}/${name}`,
    CREATE: `${CLOUD_FUNCTION_URL}/create`,
    UPDATE: (id: string) => `${CLOUD_FUNCTION_URL}/${id}`,
    DELETE: (id: string) => `${CLOUD_FUNCTION_URL}/${id}`,
    LOGS: (id: string) => `${CLOUD_FUNCTION_URL}/${id}/logs`,
    TEST: (id: string) => `${CLOUD_FUNCTION_URL}/${id}/test`,
  },

  // 统计相关
  STATS: {
    DASHBOARD: `${API_BASE_URL}/stats/dashboard`,
    POSTS: `${API_BASE_URL}/stats/posts`,
    USERS: `${API_BASE_URL}/stats/users`,
    TRAFFIC: `${API_BASE_URL}/stats/traffic`,
    POPULAR: `${API_BASE_URL}/stats/popular`,
  },

  // 设置相关
  SETTINGS: {
    GENERAL: `${API_BASE_URL}/settings/general`,
    THEME: `${API_BASE_URL}/settings/theme`,
    EMAIL: `${API_BASE_URL}/settings/email`,
    SECURITY: `${API_BASE_URL}/settings/security`,
    BACKUP: `${API_BASE_URL}/settings/backup`,
  },

  // 搜索相关
  SEARCH: {
    GLOBAL: `${API_BASE_URL}/search`,
    POSTS: `${API_BASE_URL}/search/posts`,
    USERS: `${API_BASE_URL}/search/users`,
    SUGGESTIONS: `${API_BASE_URL}/search/suggestions`,
    HISTORY: `${API_BASE_URL}/search/history`,
  },

  // 通知相关
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/notifications`,
    MARK_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/read-all`,
    DELETE: (id: string) => `${API_BASE_URL}/notifications/${id}`,
    SETTINGS: `${API_BASE_URL}/notifications/settings`,
  },
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// 请求超时配置
export const REQUEST_TIMEOUT = {
  DEFAULT: 10000, // 10秒
  UPLOAD: 300000, // 5分钟
  DOWNLOAD: 60000, // 1分钟
  SYNC: 30000, // 30秒
} as const;

// 重试配置
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1秒
  BACKOFF_FACTOR: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
} as const;

// WebSocket配置
export const WEBSOCKET_CONFIG = {
  URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',
  RECONNECT_INTERVAL: 5000, // 5秒
  MAX_RECONNECT_ATTEMPTS: 10,
  HEARTBEAT_INTERVAL: 30000, // 30秒
} as const;