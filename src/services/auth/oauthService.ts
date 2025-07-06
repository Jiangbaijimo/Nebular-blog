// OAuth认证服务
import { invoke } from '@tauri-apps/api/core';

import { listen } from '@tauri-apps/api/event';
import tokenManager from './tokenManager';
import { authAPI } from '../api';
import type {
  OAuthProvider,
  OAuthConfig,
  OAuthState,
  LoginResponse,
} from '../../types/auth';

const IS_TAURI = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * OAuth认证服务类
 * 支持Tauri和Web环境
 */
class OAuthService {
  private static instance: OAuthService;
  private configs: Map<OAuthProvider, OAuthConfig> = new Map();
  private pendingStates: Map<string, OAuthState> = new Map();
  private readonly OAUTH_CALLBACK_PORT = 3001; // 仅用于Tauri
  private readonly STATE_STORAGE_KEY = 'oauth_state';

  private constructor() {
    this.initializeConfigs();
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

  private getRedirectUri(provider: OAuthProvider): string {
    // 统一使用后端的回调地址，这样与GitHub OAuth App配置保持一致
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    return `${baseUrl}/auth/${provider}/callback`;
  }

  private initializeConfigs(): void {
    const providers: OAuthProvider[] = ['google', 'github', 'microsoft'];
    providers.forEach(provider => {
      this.configs.set(provider, {
        clientId: import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_ID`] || '',
        clientSecret: import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_SECRET`] || '', // 注意：clientSecret不应在前端使用
        redirectUri: this.getRedirectUri(provider),
        scope: provider === 'github' ? 'user:email' : 'openid profile email',
        authUrl: this.getAuthUrl(provider),
      });
    });
  }

  private getAuthUrl(provider: OAuthProvider): string {
    switch (provider) {
      case 'google': return 'https://accounts.google.com/o/oauth2/v2/auth';
      case 'github': return 'https://github.com/login/oauth/authorize';
      case 'microsoft': return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
      default: throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async setupTauriListener(): Promise<void> {
    try {
      await listen('oauth-callback', (event: any) => {
        this.handleTauriCallback(event.payload);
      });
      console.log('Tauri OAuth callback listener setup complete');
    } catch (error) {
      console.error('Failed to setup Tauri OAuth callback listener:', error);
    }
  }

  async authenticate(provider: OAuthProvider): Promise<any> {
    const config = this.configs.get(provider);
    if (!config || !config.clientId) {
      throw new Error(`OAuth not configured for ${provider}`);
    }

    const state = this.generateState();
    const nonce = this.generateNonce();
    const stateData = { provider, nonce, timestamp: Date.now() };

    // 构建授权URL
    const authUrl = this.buildAuthUrl(config, state, nonce);

    if (IS_TAURI) {
      // Tauri环境：启动本地服务器并监听回调
      this.pendingStates.set(state, { ...stateData, resolve: null as any, reject: null as any });
      await this.startTauriCallbackServer();
      const { open } = await import('@tauri-apps/plugin-opener');
      await open(authUrl);
      return new Promise((resolve, reject) => {
        const pendingState = this.pendingStates.get(state);
        if (pendingState) {
          pendingState.resolve = resolve;
          pendingState.reject = reject;
          setTimeout(() => {
            this.pendingStates.delete(state);
            reject(new Error('OAuth authentication timeout'));
          }, 300000); // 5分钟超时
        }
      });
    } else {
      // Web环境：保存状态并重定向
      sessionStorage.setItem(this.STATE_STORAGE_KEY, JSON.stringify({ state, ...stateData }));
      window.location.href = authUrl;
    }
  }

  /**
   * 处理来自Web环境的回调 (由/auth/callback/:provider页面调用)
   */
  async handleWebAppCallback(url: URL): Promise<LoginResponse> {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`OAuth failed: ${error}`);
    }

    const storedStateJSON = sessionStorage.getItem(this.STATE_STORAGE_KEY);
    if (!storedStateJSON) {
      throw new Error('No OAuth state found in session storage.');
    }
    sessionStorage.removeItem(this.STATE_STORAGE_KEY);

    const storedState = JSON.parse(storedStateJSON);
    if (!code || !state || state !== storedState.state) {
      throw new Error('Invalid state or missing code from OAuth callback.');
    }

    return this.authenticateWithBackend(storedState.provider, code);
  }

  private buildAuthUrl(config: OAuthConfig, state: string, nonce: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state,
    });
    if (config.scope.includes('openid')) {
      params.append('nonce', nonce);
    }
    return `${config.authUrl}?${params.toString()}`;
  }

  private async startTauriCallbackServer(): Promise<void> {
    try {
      await invoke('start_oauth_server', { port: this.OAUTH_CALLBACK_PORT });
      console.log(`Tauri OAuth callback server started on port ${this.OAUTH_CALLBACK_PORT}`);
    } catch (error) {
      console.error('Failed to start Tauri OAuth callback server:', error);
      throw error;
    }
  }

  private async stopTauriCallbackServer(): Promise<void> {
    if (!IS_TAURI) return;
    try {
      await invoke('stop_oauth_server');
      console.log('Tauri OAuth callback server stopped');
    } catch (error) {
      console.error('Failed to stop Tauri OAuth callback server:', error);
    }
  }

  private async handleTauriCallback(payload: { provider: OAuthProvider; code?: string; state?: string; error?: string; error_description?: string; }): Promise<void> {
    const { provider, code, state, error, error_description } = payload;
    const stateData = state ? this.pendingStates.get(state) : null;

    if (!state || !stateData) {
      console.error('Invalid or missing OAuth state parameter from Tauri callback.');
      return;
    }

    try {
      if (error) {
        throw new Error(error_description || error);
      }
      if (!code) {
        throw new Error('Missing authorization code from Tauri callback.');
      }
      if (stateData.provider !== provider) {
        throw new Error('OAuth provider mismatch in Tauri callback.');
      }

      const authResult = await this.authenticateWithBackend(provider, code);
      await tokenManager.setTokens(authResult.tokens);
      
      if (stateData.resolve) {
        stateData.resolve(authResult.user);
      }
    } catch (e) {
      console.error('Tauri OAuth callback handling failed:', e);
      if (stateData.reject) {
        stateData.reject(e);
      }
    } finally {
      this.pendingStates.delete(state);
      await this.stopTauriCallbackServer();
    }
  }

  /**
   * 与后端进行认证 (安全流程)
   * @param provider OAuth提供商
   * @param code 从OAuth提供商获取的授权码
   * @returns 后端返回的登录响应，包含JWT token和用户信息
   */
  private async authenticateWithBackend(provider: OAuthProvider, code: string): Promise<LoginResponse> {
    try {
      // 后端API应接收provider和code，然后在后端安全地交换token并验证用户
      const response = await authAPI.oauthLogin({
        provider,
        code,
        redirectUri: this.getRedirectUri(provider), // 发送redirectUri给后端用于token交换
      });

      // 假设后端成功处理并返回LoginResponse结构
      if (!response.tokens || !response.user) {
        throw new Error('Invalid authentication response from backend');
      }

      // 保存令牌
      await tokenManager.setTokens(response.tokens);

      return response;
    } catch (error) {
      console.error('Backend authentication failed:', error);
      throw error;
    }
  }

  private generateState(): string {
    return this.generateRandomString(32);
  }

  private generateNonce(): string {
    return this.generateRandomString(16);
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }

  getSupportedProviders(): OAuthProvider[] {
    return Array.from(this.configs.keys());
  }

  isProviderConfigured(provider: OAuthProvider): boolean {
    const config = this.configs.get(provider);
    return !!(config && config.clientId);
  }
}

const oauthService = OAuthService.getInstance();

export { oauthService, OAuthService };
export default oauthService;