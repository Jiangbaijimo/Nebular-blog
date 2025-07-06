/**
 * OAuth 配置文件
 * 集中管理 OAuth 相关的配置信息
 */

export type OAuthProvider = 'google' | 'github' | 'microsoft';

/**
 * OAuth 提供商配置
 */
export interface OAuthProviderConfig {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  enabled: boolean;
  scopes?: string[];
  additionalParams?: Record<string, string>;
}

/**
 * OAuth 提供商配置映射
 */
export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: {
    name: 'google',
    displayName: 'Google',
    icon: 'FaGoogle',
    color: '#4285f4',
    enabled: true,
    scopes: ['openid', 'profile', 'email'],
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  github: {
    name: 'github',
    displayName: 'GitHub',
    icon: 'FiGithub',
    color: '#333',
    enabled: true,
    scopes: ['user:email', 'read:user'],
  },
  microsoft: {
    name: 'microsoft',
    displayName: 'Microsoft',
    icon: 'FaMicrosoft',
    color: '#0078d4',
    enabled: true,
    scopes: ['openid', 'profile', 'email'],
  },
};

/**
 * OAuth 回调配置
 */
export const OAUTH_CALLBACK_CONFIG = {
  // 回调页面路径
  callbackPath: '/auth/oauth/callback',
  
  // 成功后的默认重定向路径
  defaultRedirectPath: '/',
  
  // 失败后的重定向路径
  errorRedirectPath: '/login',
  
  // 重定向延迟（毫秒）
  redirectDelay: {
    success: 2000,
    error: 5000,
  },
  
  // 本地存储键名
  storageKeys: {
    redirectPath: 'oauth_redirect_path',
    state: 'oauth_state',
    provider: 'oauth_provider',
  },
};

/**
 * OAuth 错误码映射
 */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  // 标准 OAuth 2.0 错误码
  access_denied: '用户拒绝了授权请求',
  invalid_request: '无效的授权请求',
  unauthorized_client: '客户端未授权',
  unsupported_response_type: '不支持的响应类型',
  invalid_scope: '无效的授权范围',
  server_error: '服务器内部错误',
  temporarily_unavailable: '服务暂时不可用',
  invalid_client: '无效的客户端',
  invalid_grant: '无效的授权许可',
  unsupported_grant_type: '不支持的授权类型',
  
  // 自定义错误码
  network_error: '网络连接错误，请检查网络设置',
  timeout_error: '请求超时，请重试',
  unknown_error: '发生未知错误，请重试',
  invalid_state: '无效的状态参数，可能存在安全风险',
  missing_code: '缺少授权码，认证流程异常',
  expired_code: '授权码已过期，请重新认证',
  invalid_code: '无效的授权码',
  
  // 提供商特定错误
  google_error: 'Google 认证失败',
  github_error: 'GitHub 认证失败',
  microsoft_error: 'Microsoft 认证失败',
};

/**
 * 获取启用的 OAuth 提供商列表
 */
export function getEnabledProviders(): OAuthProvider[] {
  return Object.entries(OAUTH_PROVIDERS)
    .filter(([, config]) => config.enabled)
    .map(([provider]) => provider as OAuthProvider);
}

/**
 * 获取提供商配置
 */
export function getProviderConfig(provider: OAuthProvider): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[provider] || null;
}

/**
 * 检查提供商是否启用
 */
export function isProviderEnabled(provider: OAuthProvider): boolean {
  const config = getProviderConfig(provider);
  return config?.enabled ?? false;
}

/**
 * 获取错误消息
 */
export function getOAuthErrorMessage(errorCode: string, fallback?: string): string {
  return OAUTH_ERROR_MESSAGES[errorCode] || fallback || OAUTH_ERROR_MESSAGES.unknown_error;
}

/**
 * 生成状态参数（用于防止 CSRF 攻击）
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证状态参数
 */
export function validateState(receivedState: string, expectedState: string): boolean {
  return receivedState === expectedState;
}

/**
 * OAuth 环境配置
 */
export const OAUTH_ENV_CONFIG = {
  // 开发环境配置
  development: {
    enableDebugLogs: true,
    enableErrorDetails: true,
    skipStateValidation: false, // 即使在开发环境也要验证状态
  },
  
  // 生产环境配置
  production: {
    enableDebugLogs: false,
    enableErrorDetails: false,
    skipStateValidation: false,
  },
};

/**
 * 获取当前环境的 OAuth 配置
 */
export function getCurrentEnvConfig() {
  const env = process.env.NODE_ENV as 'development' | 'production';
  return OAUTH_ENV_CONFIG[env] || OAUTH_ENV_CONFIG.production;
}