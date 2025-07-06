// 应用配置常量

// 应用基本信息
export const APP_INFO = {
  NAME: 'Tauri Blog',
  VERSION: '1.0.0',
  DESCRIPTION: '基于 Tauri + React + TypeScript 的高性能博客系统',
  AUTHOR: 'Blog Team',
  HOMEPAGE: 'https://github.com/your-username/tauri-blog',
  REPOSITORY: 'https://github.com/your-username/tauri-blog',
  LICENSE: 'MIT',
} as const;

// 应用配置
export const APP_CONFIG = {
  // 默认语言
  DEFAULT_LANGUAGE: 'zh-CN',
  
  // 支持的语言
  SUPPORTED_LANGUAGES: [
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  ],
  
  // 默认主题
  DEFAULT_THEME: 'light',
  
  // 支持的主题
  SUPPORTED_THEMES: [
    { key: 'light', name: '浅色主题', icon: 'Sun' },
    { key: 'dark', name: '深色主题', icon: 'Moon' },
    { key: 'auto', name: '跟随系统', icon: 'Monitor' },
  ],
  
  // 默认时区
  DEFAULT_TIMEZONE: 'Asia/Shanghai',
  
  // 日期格式
  DATE_FORMATS: {
    SHORT: 'YYYY-MM-DD',
    LONG: 'YYYY年MM月DD日',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    RELATIVE: 'relative', // 相对时间
  },
  
  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100,
  },
  
  // 搜索配置
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    MAX_QUERY_LENGTH: 100,
    DEBOUNCE_DELAY: 300,
    MAX_RESULTS: 50,
  },
  
  // 缓存配置
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5分钟
    MAX_SIZE: 100, // 最大缓存条目数
    STORAGE_KEY_PREFIX: 'tauri_blog_',
  },
  
  // 性能配置
  PERFORMANCE: {
    LAZY_LOADING_THRESHOLD: 3, // 懒加载阈值
    VIRTUAL_SCROLL_ITEM_HEIGHT: 60, // 虚拟滚动项高度
    DEBOUNCE_DELAY: 300, // 防抖延迟
    THROTTLE_DELAY: 100, // 节流延迟
  },
} as const;

// 编辑器配置
export const EDITOR_CONFIG = {
  // 默认配置
  DEFAULT_CONFIG: {
    theme: 'github',
    fontSize: 14,
    lineHeight: 1.6,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: false,
    autoSave: true,
    autoSaveDelay: 2000,
  },
  
  // 支持的主题
  THEMES: [
    { key: 'github', name: 'GitHub' },
    { key: 'monokai', name: 'Monokai' },
    { key: 'dracula', name: 'Dracula' },
    { key: 'one-dark', name: 'One Dark' },
    { key: 'solarized-light', name: 'Solarized Light' },
    { key: 'solarized-dark', name: 'Solarized Dark' },
  ],
  
  // 字体大小选项
  FONT_SIZES: [12, 14, 16, 18, 20, 22, 24],
  
  // 行高选项
  LINE_HEIGHTS: [1.2, 1.4, 1.6, 1.8, 2.0],
  
  // Tab 大小选项
  TAB_SIZES: [2, 4, 8],
  
  // 支持的文件格式
  SUPPORTED_FORMATS: [
    { key: 'markdown', name: 'Markdown', extension: '.md' },
    { key: 'html', name: 'HTML', extension: '.html' },
    { key: 'text', name: 'Plain Text', extension: '.txt' },
  ],
  
  // 快捷键
  SHORTCUTS: {
    SAVE: 'Ctrl+S',
    PREVIEW: 'Ctrl+P',
    BOLD: 'Ctrl+B',
    ITALIC: 'Ctrl+I',
    LINK: 'Ctrl+K',
    IMAGE: 'Ctrl+Shift+I',
    CODE: 'Ctrl+`',
    QUOTE: 'Ctrl+Shift+.',
    LIST: 'Ctrl+L',
    HEADING: 'Ctrl+H',
    UNDO: 'Ctrl+Z',
    REDO: 'Ctrl+Y',
    FIND: 'Ctrl+F',
    REPLACE: 'Ctrl+H',
  },
} as const;

// 文件上传配置
export const UPLOAD_CONFIG = {
  // 支持的图片格式
  SUPPORTED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  
  // 支持的文档格式
  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
  
  // 支持的音频格式
  SUPPORTED_AUDIO_TYPES: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
  ],
  
  // 支持的视频格式
  SUPPORTED_VIDEO_TYPES: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
  ],
  
  // 文件大小限制 (字节)
  MAX_FILE_SIZES: {
    IMAGE: 10 * 1024 * 1024, // 10MB
    DOCUMENT: 50 * 1024 * 1024, // 50MB
    AUDIO: 100 * 1024 * 1024, // 100MB
    VIDEO: 500 * 1024 * 1024, // 500MB
    OTHER: 20 * 1024 * 1024, // 20MB
  },
  
  // 图片压缩配置
  IMAGE_COMPRESSION: {
    QUALITY: 0.8,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    ENABLE_WEBP: true,
  },
  
  // 缩略图配置
  THUMBNAIL_SIZES: [
    { name: 'small', width: 150, height: 150 },
    { name: 'medium', width: 300, height: 300 },
    { name: 'large', width: 600, height: 600 },
  ],
} as const;

// 通知配置
export const NOTIFICATION_CONFIG = {
  // 默认持续时间 (毫秒)
  DEFAULT_DURATION: {
    SUCCESS: 3000,
    INFO: 4000,
    WARNING: 5000,
    ERROR: 6000,
  },
  
  // 最大通知数量
  MAX_NOTIFICATIONS: 5,
  
  // 位置选项
  POSITIONS: [
    { key: 'top-right', name: '右上角' },
    { key: 'top-left', name: '左上角' },
    { key: 'bottom-right', name: '右下角' },
    { key: 'bottom-left', name: '左下角' },
    { key: 'top-center', name: '顶部居中' },
    { key: 'bottom-center', name: '底部居中' },
  ],
  
  // 默认位置
  DEFAULT_POSITION: 'top-right',
} as const;

// 键盘快捷键配置
export const KEYBOARD_SHORTCUTS = {
  // 全局快捷键
  GLOBAL: {
    SEARCH: 'Ctrl+K',
    NEW_POST: 'Ctrl+N',
    SETTINGS: 'Ctrl+,',
    HELP: 'F1',
    TOGGLE_THEME: 'Ctrl+Shift+T',
    TOGGLE_SIDEBAR: 'Ctrl+B',
    COMMAND_PALETTE: 'Ctrl+Shift+P',
  },
  
  // 导航快捷键
  NAVIGATION: {
    HOME: 'Alt+H',
    BLOG: 'Alt+B',
    ADMIN: 'Alt+A',
    PROFILE: 'Alt+P',
  },
  
  // 编辑器快捷键
  EDITOR: EDITOR_CONFIG.SHORTCUTS,
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  // 网络错误
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',
  
  // 认证错误
  UNAUTHORIZED: '未授权访问，请先登录',
  FORBIDDEN: '权限不足，无法访问此资源',
  TOKEN_EXPIRED: '登录已过期，请重新登录',
  
  // 验证错误
  VALIDATION_ERROR: '输入数据验证失败',
  REQUIRED_FIELD: '此字段为必填项',
  INVALID_EMAIL: '邮箱格式不正确',
  INVALID_PASSWORD: '密码格式不正确',
  PASSWORD_MISMATCH: '两次输入的密码不一致',
  
  // 文件错误
  FILE_TOO_LARGE: '文件大小超出限制',
  INVALID_FILE_TYPE: '不支持的文件类型',
  UPLOAD_FAILED: '文件上传失败',
  
  // 通用错误
  UNKNOWN_ERROR: '未知错误，请稍后重试',
  OPERATION_FAILED: '操作失败，请稍后重试',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: '保存成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  CREATE_SUCCESS: '创建成功',
  UPLOAD_SUCCESS: '上传成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
  PASSWORD_RESET_SUCCESS: '密码重置成功',
  EMAIL_SENT: '邮件发送成功',
  SYNC_SUCCESS: '同步成功',
  BACKUP_SUCCESS: '备份成功',
  RESTORE_SUCCESS: '恢复成功',
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  // 用户相关
  USER_TOKEN: 'user_token',
  USER_INFO: 'user_info',
  USER_PREFERENCES: 'user_preferences',
  
  // 应用设置
  APP_THEME: 'app_theme',
  APP_LANGUAGE: 'app_language',
  APP_SETTINGS: 'app_settings',
  
  // 编辑器设置
  EDITOR_CONFIG: 'editor_config',
  EDITOR_DRAFTS: 'editor_drafts',
  
  // 缓存
  CACHE_PREFIX: 'cache_',
  
  // 临时数据
  TEMP_DATA: 'temp_data',
} as const;

// 正则表达式
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^1[3-9]\d{9}$/,
  COLOR_HEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

// 动画配置
export const ANIMATION_CONFIG = {
  // 持续时间
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // 缓动函数
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;