/**
 * OAuth 工具函数
 * 提供 OAuth 认证流程中常用的工具方法
 */

import { OAUTH_CALLBACK_CONFIG, getOAuthErrorMessage, generateState, validateState } from '../config/oauth';

/**
 * URL 参数解析工具
 */
export class URLParamsParser {
  private params: URLSearchParams;

  constructor(url?: string) {
    const targetUrl = url || window.location.href;
    this.params = new URLSearchParams(new URL(targetUrl).search);
  }

  /**
   * 获取授权码
   */
  getCode(): string | null {
    return this.params.get('code');
  }

  /**
   * 获取错误码
   */
  getError(): string | null {
    return this.params.get('error');
  }

  /**
   * 获取错误描述
   */
  getErrorDescription(): string | null {
    return this.params.get('error_description');
  }

  /**
   * 获取状态参数
   */
  getState(): string | null {
    return this.params.get('state');
  }

  /**
   * 获取所有参数
   */
  getAllParams(): Record<string, string> {
    const result: Record<string, string> = {};
    this.params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * 检查是否包含错误
   */
  hasError(): boolean {
    return this.getError() !== null;
  }

  /**
   * 检查是否包含授权码
   */
  hasCode(): boolean {
    return this.getCode() !== null;
  }
}

/**
 * 本地存储管理器
 */
export class OAuthStorageManager {
  /**
   * 保存重定向路径
   */
  static saveRedirectPath(path: string): void {
    try {
      localStorage.setItem(OAUTH_CALLBACK_CONFIG.storageKeys.redirectPath, path);
    } catch (error) {
      console.warn('Failed to save redirect path:', error);
    }
  }

  /**
   * 获取重定向路径
   */
  static getRedirectPath(): string | null {
    try {
      return localStorage.getItem(OAUTH_CALLBACK_CONFIG.storageKeys.redirectPath);
    } catch (error) {
      console.warn('Failed to get redirect path:', error);
      return null;
    }
  }

  /**
   * 清除重定向路径
   */
  static clearRedirectPath(): void {
    try {
      localStorage.removeItem(OAUTH_CALLBACK_CONFIG.storageKeys.redirectPath);
    } catch (error) {
      console.warn('Failed to clear redirect path:', error);
    }
  }

  /**
   * 保存状态参数
   */
  static saveState(state: string): void {
    try {
      localStorage.setItem(OAUTH_CALLBACK_CONFIG.storageKeys.state, state);
    } catch (error) {
      console.warn('Failed to save OAuth state:', error);
    }
  }

  /**
   * 获取状态参数
   */
  static getState(): string | null {
    try {
      return localStorage.getItem(OAUTH_CALLBACK_CONFIG.storageKeys.state);
    } catch (error) {
      console.warn('Failed to get OAuth state:', error);
      return null;
    }
  }

  /**
   * 清除状态参数
   */
  static clearState(): void {
    try {
      localStorage.removeItem(OAUTH_CALLBACK_CONFIG.storageKeys.state);
    } catch (error) {
      console.warn('Failed to clear OAuth state:', error);
    }
  }

  /**
   * 保存提供商信息
   */
  static saveProvider(provider: string): void {
    try {
      localStorage.setItem(OAUTH_CALLBACK_CONFIG.storageKeys.provider, provider);
    } catch (error) {
      console.warn('Failed to save OAuth provider:', error);
    }
  }

  /**
   * 获取提供商信息
   */
  static getProvider(): string | null {
    try {
      return localStorage.getItem(OAUTH_CALLBACK_CONFIG.storageKeys.provider);
    } catch (error) {
      console.warn('Failed to get OAuth provider:', error);
      return null;
    }
  }

  /**
   * 清除提供商信息
   */
  static clearProvider(): void {
    try {
      localStorage.removeItem(OAUTH_CALLBACK_CONFIG.storageKeys.provider);
    } catch (error) {
      console.warn('Failed to clear OAuth provider:', error);
    }
  }

  /**
   * 清除所有 OAuth 相关数据
   */
  static clearAll(): void {
    this.clearRedirectPath();
    this.clearState();
    this.clearProvider();
  }
}

/**
 * OAuth 错误处理器
 */
export class OAuthErrorHandler {
  /**
   * 处理 OAuth 错误
   */
  static handleError(error: string, description?: string): {
    message: string;
    shouldRetry: boolean;
    redirectToLogin: boolean;
  } {
    const message = getOAuthErrorMessage(error, description);
    
    // 根据错误类型决定处理策略
    switch (error) {
      case 'access_denied':
        return {
          message,
          shouldRetry: true,
          redirectToLogin: true,
        };
      
      case 'server_error':
      case 'temporarily_unavailable':
        return {
          message,
          shouldRetry: true,
          redirectToLogin: false,
        };
      
      case 'invalid_client':
      case 'unauthorized_client':
        return {
          message: '应用配置错误，请联系管理员',
          shouldRetry: false,
          redirectToLogin: true,
        };
      
      default:
        return {
          message,
          shouldRetry: true,
          redirectToLogin: true,
        };
    }
  }

  /**
   * 记录错误日志
   */
  static logError(error: string, description?: string, context?: any): void {
    const errorInfo = {
      error,
      description,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    console.error('OAuth Error:', errorInfo);
    
    // 在生产环境中，可以将错误发送到错误监控服务
    if (process.env.NODE_ENV === 'production') {
      // TODO: 发送到错误监控服务（如 Sentry）
    }
  }
}

/**
 * OAuth 状态验证器
 */
export class OAuthStateValidator {
  /**
   * 验证回调状态
   */
  static validateCallback(): {
    isValid: boolean;
    error?: string;
    code?: string;
    state?: string;
  } {
    const parser = new URLParamsParser();
    
    // 检查是否有错误
    if (parser.hasError()) {
      const error = parser.getError()!;
      const description = parser.getErrorDescription();
      
      OAuthErrorHandler.logError(error, description || undefined);
      
      return {
        isValid: false,
        error: getOAuthErrorMessage(error, description || undefined),
      };
    }
    
    // 检查是否有授权码
    const code = parser.getCode();
    if (!code) {
      OAuthErrorHandler.logError('missing_code');
      return {
        isValid: false,
        error: getOAuthErrorMessage('missing_code'),
      };
    }
    
    // 验证状态参数（可选，取决于实现）
    const receivedState = parser.getState();
    const expectedState = OAuthStorageManager.getState();
    
    if (expectedState && receivedState) {
      if (!validateState(receivedState, expectedState)) {
        OAuthErrorHandler.logError('invalid_state', 'State parameter mismatch');
        return {
          isValid: false,
          error: getOAuthErrorMessage('invalid_state'),
        };
      }
    }
    
    return {
      isValid: true,
      code,
      state: receivedState || undefined,
    };
  }
}

/**
 * OAuth URL 构建器
 */
export class OAuthURLBuilder {
  /**
   * 构建回调 URL
   */
  static buildCallbackURL(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}${OAUTH_CALLBACK_CONFIG.callbackPath}`;
  }

  /**
   * 构建错误重定向 URL
   */
  static buildErrorRedirectURL(error?: string): string {
    const baseUrl = window.location.origin;
    const path = OAUTH_CALLBACK_CONFIG.errorRedirectPath;
    
    if (error) {
      return `${baseUrl}${path}?error=${encodeURIComponent(error)}`;
    }
    
    return `${baseUrl}${path}`;
  }

  /**
   * 构建成功重定向 URL
   */
  static buildSuccessRedirectURL(path?: string): string {
    const baseUrl = window.location.origin;
    const redirectPath = path || OAUTH_CALLBACK_CONFIG.defaultRedirectPath;
    return `${baseUrl}${redirectPath}`;
  }
}

/**
 * 倒计时工具
 */
export class CountdownTimer {
  private timer: NodeJS.Timeout | null = null;
  private callback: (count: number) => void;
  private onComplete: () => void;

  constructor(callback: (count: number) => void, onComplete: () => void) {
    this.callback = callback;
    this.onComplete = onComplete;
  }

  /**
   * 开始倒计时
   */
  start(seconds: number): void {
    this.stop(); // 清除之前的计时器
    
    let count = seconds;
    this.callback(count);
    
    this.timer = setInterval(() => {
      count--;
      this.callback(count);
      
      if (count <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  }

  /**
   * 停止倒计时
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/**
 * 导出所有工具类和函数
 */
export {
  generateState,
  validateState,
  getOAuthErrorMessage,
};