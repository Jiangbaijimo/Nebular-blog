// 常量模块导出

// API 相关常量
export * from './api';

// 路由相关常量
export * from './routes';

// 应用配置常量
export * from './app';

// 重新导出主要常量对象
export {
  API_ENDPOINTS,
  HTTP_STATUS,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
  WEBSOCKET_CONFIG,
} from './api';

export {
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  USER_ROUTES,
  EDITOR_ROUTES,
  ADMIN_ROUTES,
  ROUTES,
  ROUTE_PERMISSIONS,
  NAVIGATION_MENUS,
  BREADCRUMB_CONFIG,
  ROUTE_META,
} from './routes';

export {
  APP_INFO,
  APP_CONFIG,
  EDITOR_CONFIG,
  UPLOAD_CONFIG,
  NOTIFICATION_CONFIG,
  KEYBOARD_SHORTCUTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  REGEX_PATTERNS,
  ANIMATION_CONFIG,
} from './app';