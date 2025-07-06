// OAuth认证服务 - 基于临时授权码的安全实现
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/api/shell';
import tokenManager from './tokenManager';
import httpClient from '../http';
import { API_ENDPOINTS } from '../../constants/api';
import type {
  LoginResponse,
  User
} from '../../types/auth';
import { 
  type OAuthProvider, 
  OAUTH_CALLBACK_CONFIG,
  getEnabledProviders,
  isProviderEnabled,
  getCurrentEnvConfig
} from '../../config/oauth';
import {
  OAuthStorageManager,
  OAuthStateValidator,
  OAuthErrorHandler,
  URLParamsParser
} from '../../utils/oauth';

export interface OAuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

const IS_TAURI = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * OAuth认证服务类
 * 基于后端临时授权码的安全OAuth流程
 */
class OAuthService {
  private static instance: OAuthService;
  private readonly OAUTH_CALLBACK_PORT = 3001; // 仅用于Tauri
  private readonly REDIRECT_STORAGE_KEY = 'oauth_redirect';

  private constructor() {
    if (IS_TAURI) {
      this.setupTauriListener();
    }
  }

  static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  /**
   * 获取OAuth登录URL
   * 直接使用后端提供的OAuth入口
   */
  private getOAuthUrl(provider: OAuthProvider): string {
    return `/api/auth/${provider}`;
  }

  /**
   * 保存重定向路径到本地存储
   */
  private saveRedirectPath(path?: string): void {
    if (path) {
      OAuthStorageManager.saveRedirectPath(path);
    }
  }

  private async setupTauriListener(): Promise<void> {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      await listen('oauth-callback', (event: any) => {
        this.handleTauriCallback(event.payload);
      });
      console.log('Tauri OAuth callback listener setup complete');
    } catch (error) {
      console.error('Failed to setup Tauri OAuth callback listener:', error);
    }
  }

  /**
   * 启动OAuth认证流程
   * @param provider OAuth提供商
   * @param redirectTo 认证成功后的重定向路径
   */
  async authenticate(provider: OAuthProvider, redirectTo?: string): Promise<void> {
    // 保存重定向路径
    this.saveRedirectPath(redirectTo);

    const authUrl = this.getOAuthUrl(provider);

    if (IS_TAURI) {
      // Tauri环境：使用系统浏览器打开OAuth页面
      const { open } = await import('@tauri-apps/plugin-opener');
      await open(authUrl);
      // Tauri环境下，OAuth流程将通过深度链接或其他方式回调
    } else {
      // Web环境：直接重定向到后端OAuth入口
      window.location.href = authUrl;
    }
  }

  /**
   * 处理Web环境的OAuth回调
   */
  async handleWebAppCallback(): Promise<ApiResponse<LoginResponse>> {
    const envConfig = getCurrentEnvConfig();
    
    // 验证回调状态
    const validation = OAuthStateValidator.validateCallback();
    
    if (!validation.isValid) {
      if (envConfig.enableDebugLogs) {
        console.error('OAuth回调验证失败:', validation.error);
      }
      throw new Error(validation.error || '回调验证失败');
    }

    try {
      // 使用授权码交换token
      const response = await this.exchangeCodeForToken(validation.code!);
      
      if (envConfig.enableDebugLogs) {
        console.log('OAuth认证成功:', { user: response.user?.username || 'unknown' });
      }
      
      // 清除OAuth相关的本地存储数据
      OAuthStorageManager.clearState();
      OAuthStorageManager.clearProvider();
      
      return {
        success: true,
        data: {
          user: response.user,
          tokens: response.tokens,
          session: response.session,
        },
      };
    } catch (error: any) {
      if (envConfig.enableDebugLogs) {
        console.error('Token交换失败:', error);
      }
      
      // 记录错误
      OAuthErrorHandler.logError(
        'exchange_failed',
        error.response?.data?.message || error.message,
        { code: validation.code }
      );
      
      throw new Error(error.response?.data?.message || error.message || '认证失败');
    }
  }

  /**
   * 交换临时授权码获取真实token
   */
  private async exchangeCodeForToken(code: string): Promise<LoginResponse> {
    try {
      const response = await httpClient.post<any>(
        '/api/auth/exchange-code',
        { code },
        { skipAuth: true }
      );

      // 处理嵌套的响应结构: {success: true, data: {success: true, data: {user: {...}}}}
      const actualData = response.data?.data || response.data || response;
      
      // 保存token
      if (actualData.tokens) {
        // 将AuthTokens转换为TokenPair格式
        const tokenPair = {
          accessToken: actualData.tokens.accessToken,
          refreshToken: actualData.tokens.refreshToken
        };
        await tokenManager.setTokens(tokenPair);
      }

      return actualData;
    } catch (error: any) {
      console.error('授权码交换失败:', error);
      throw new Error(error.response?.data?.message || error.message || '授权码交换失败');
    }
  }

  /**
   * 获取重定向路径
   */
  getRedirectPath(): string | null {
    return OAuthStorageManager.getRedirectPath();
  }

  /**
   * 清除重定向路径
   */
  clearRedirectPath(): void {
    OAuthStorageManager.clearRedirectPath();
  }

  private handleTauriCallback(payload: any): void {
    // Tauri环境下的OAuth回调处理
    // 这里可以根据需要实现深度链接或其他回调机制
    console.log('Tauri OAuth callback received:', payload);
  }

  /**
   * 获取支持的OAuth提供商列表
   */
  getSupportedProviders(): OAuthProvider[] {
    return getEnabledProviders();
  }

  /**
   * 检查指定提供商是否可用
   */
  isProviderAvailable(provider: OAuthProvider): boolean {
    return isProviderEnabled(provider);
  }
}

const oauthService = OAuthService.getInstance();

export { oauthService, OAuthService };
export default oauthService;