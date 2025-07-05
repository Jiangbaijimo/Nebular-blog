// OAuth认证服务
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/api/shell';
import { listen } from '@tauri-apps/api/event';
import tokenManager from './tokenManager';
import type {
  OAuthProvider,
  OAuthConfig,
  OAuthState,
  OAuthTokenResponse,
  OAuthUserInfo,
} from '../../types/auth';

/**
 * OAuth认证服务类
 */
class OAuthService {
  private static instance: OAuthService;
  private configs: Map<OAuthProvider, OAuthConfig> = new Map();
  private pendingStates: Map<string, OAuthState> = new Map();
  private readonly OAUTH_CALLBACK_PORT = 3001;
  private callbackServer: any = null;

  private constructor() {
    this.initializeConfigs();
    this.setupCallbackListener();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  /**
   * 初始化OAuth配置
   */
  private initializeConfigs(): void {
    // Google OAuth配置
    this.configs.set('google', {
      clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirectUri: `http://localhost:${this.OAUTH_CALLBACK_PORT}/callback/google`,
      scope: 'openid profile email',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });

    // GitHub OAuth配置
    this.configs.set('github', {
      clientId: process.env.VITE_GITHUB_CLIENT_ID || '',
      clientSecret: process.env.VITE_GITHUB_CLIENT_SECRET || '',
      redirectUri: `http://localhost:${this.OAUTH_CALLBACK_PORT}/callback/github`,
      scope: 'user:email',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
    });

    // Microsoft OAuth配置
    this.configs.set('microsoft', {
      clientId: process.env.VITE_MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.VITE_MICROSOFT_CLIENT_SECRET || '',
      redirectUri: `http://localhost:${this.OAUTH_CALLBACK_PORT}/callback/microsoft`,
      scope: 'openid profile email',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    });
  }

  /**
   * 设置回调监听器
   */
  private async setupCallbackListener(): Promise<void> {
    try {
      // 监听来自Tauri后端的OAuth回调事件
      await listen('oauth-callback', (event: any) => {
        this.handleOAuthCallback(event.payload);
      });

      console.log('OAuth callback listener setup complete');
    } catch (error) {
      console.error('Failed to setup OAuth callback listener:', error);
    }
  }

  /**
   * 启动OAuth认证流程
   */
  async authenticate(provider: OAuthProvider): Promise<OAuthUserInfo> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    if (!config.clientId) {
      throw new Error(`OAuth client ID not configured for ${provider}`);
    }

    try {
      // 生成状态参数
      const state = this.generateState();
      const nonce = this.generateNonce();

      // 保存状态信息
      this.pendingStates.set(state, {
        provider,
        nonce,
        timestamp: Date.now(),
        resolve: null as any,
        reject: null as any,
      });

      // 构建授权URL
      const authUrl = this.buildAuthUrl(config, state, nonce);

      // 启动本地回调服务器
      await this.startCallbackServer();

      // 在默认浏览器中打开授权URL
      await open(authUrl);

      // 返回Promise，等待回调
      return new Promise((resolve, reject) => {
        const stateData = this.pendingStates.get(state);
        if (stateData) {
          stateData.resolve = resolve;
          stateData.reject = reject;

          // 设置超时
          setTimeout(() => {
            this.pendingStates.delete(state);
            reject(new Error('OAuth authentication timeout'));
          }, 300000); // 5分钟超时
        } else {
          reject(new Error('Failed to initialize OAuth state'));
        }
      });
    } catch (error) {
      console.error(`OAuth authentication failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * 构建授权URL
   */
  private buildAuthUrl(config: OAuthConfig, state: string, nonce: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state,
    });

    // 对于支持OIDC的提供商，添加nonce
    if (config.authUrl.includes('google') || config.authUrl.includes('microsoft')) {
      params.append('nonce', nonce);
    }

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * 启动回调服务器
   */
  private async startCallbackServer(): Promise<void> {
    try {
      // 使用Tauri命令启动本地HTTP服务器
      await invoke('start_oauth_server', {
        port: this.OAUTH_CALLBACK_PORT,
      });

      console.log(`OAuth callback server started on port ${this.OAUTH_CALLBACK_PORT}`);
    } catch (error) {
      console.error('Failed to start OAuth callback server:', error);
      throw error;
    }
  }

  /**
   * 停止回调服务器
   */
  private async stopCallbackServer(): Promise<void> {
    try {
      await invoke('stop_oauth_server');
      console.log('OAuth callback server stopped');
    } catch (error) {
      console.error('Failed to stop OAuth callback server:', error);
    }
  }

  /**
   * 处理OAuth回调
   */
  private async handleOAuthCallback(payload: {
    provider: OAuthProvider;
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }): Promise<void> {
    const { provider, code, state, error, error_description } = payload;

    // 检查是否有错误
    if (error) {
      const stateData = state ? this.pendingStates.get(state) : null;
      if (stateData?.reject) {
        stateData.reject(new Error(error_description || error));
      }
      if (state) {
        this.pendingStates.delete(state);
      }
      return;
    }

    // 验证状态参数
    if (!state || !this.pendingStates.has(state)) {
      console.error('Invalid or missing OAuth state parameter');
      return;
    }

    const stateData = this.pendingStates.get(state)!;
    
    try {
      // 验证提供商匹配
      if (stateData.provider !== provider) {
        throw new Error('OAuth provider mismatch');
      }

      // 检查授权码
      if (!code) {
        throw new Error('Missing authorization code');
      }

      // 交换访问令牌
      const tokenResponse = await this.exchangeCodeForToken(provider, code);
      
      // 获取用户信息
      const userInfo = await this.fetchUserInfo(provider, tokenResponse.access_token);
      
      // 调用后端API进行用户认证/注册
      const authResult = await this.authenticateWithBackend(provider, tokenResponse, userInfo);
      
      // 保存令牌
      await tokenManager.setTokens({
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
      });

      // 解析Promise
      if (stateData.resolve) {
        stateData.resolve(userInfo);
      }
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      if (stateData.reject) {
        stateData.reject(error);
      }
    } finally {
      // 清理状态
      this.pendingStates.delete(state);
      
      // 停止回调服务器
      await this.stopCallbackServer();
    }
  }

  /**
   * 交换授权码为访问令牌
   */
  private async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string
  ): Promise<OAuthTokenResponse> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Configuration not found for provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    });

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      
      if (!tokenData.access_token) {
        throw new Error('No access token in response');
      }

      return tokenData;
    } catch (error) {
      console.error(`Token exchange failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  private async fetchUserInfo(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<OAuthUserInfo> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Configuration not found for provider: ${provider}`);
    }

    try {
      const response = await fetch(config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      const userData = await response.json();
      
      // 标准化用户信息格式
      return this.normalizeUserInfo(provider, userData);
    } catch (error) {
      console.error(`Failed to fetch user info for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * 标准化用户信息
   */
  private normalizeUserInfo(provider: OAuthProvider, userData: any): OAuthUserInfo {
    switch (provider) {
      case 'google':
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.picture,
          provider: 'google',
          verified: userData.verified_email,
        };
      
      case 'github':
        return {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.name || userData.login,
          avatar: userData.avatar_url,
          provider: 'github',
          verified: true, // GitHub邮箱默认验证
        };
      
      case 'microsoft':
        return {
          id: userData.id,
          email: userData.mail || userData.userPrincipalName,
          name: userData.displayName,
          avatar: null, // Microsoft Graph API需要单独请求头像
          provider: 'microsoft',
          verified: true,
        };
      
      default:
        throw new Error(`Unsupported provider for user info normalization: ${provider}`);
    }
  }

  /**
   * 与后端进行认证
   */
  private async authenticateWithBackend(
    provider: OAuthProvider,
    tokenResponse: OAuthTokenResponse,
    userInfo: OAuthUserInfo
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          oauthToken: tokenResponse.access_token,
          userInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Backend authentication failed');
      }

      const authData = await response.json();
      
      if (!authData.accessToken || !authData.refreshToken) {
        throw new Error('Invalid authentication response from backend');
      }

      return authData;
    } catch (error) {
      console.error('Backend authentication failed:', error);
      throw error;
    }
  }

  /**
   * 生成状态参数
   */
  private generateState(): string {
    return this.generateRandomString(32);
  }

  /**
   * 生成nonce参数
   */
  private generateNonce(): string {
    return this.generateRandomString(16);
  }

  /**
   * 生成随机字符串
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * 获取支持的OAuth提供商
   */
  getSupportedProviders(): OAuthProvider[] {
    return Array.from(this.configs.keys());
  }

  /**
   * 检查提供商是否已配置
   */
  isProviderConfigured(provider: OAuthProvider): boolean {
    const config = this.configs.get(provider);
    return !!(config && config.clientId && config.clientSecret);
  }

  /**
   * 获取提供商配置状态
   */
  getProviderStatus(): Record<OAuthProvider, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const provider of this.getSupportedProviders()) {
      status[provider] = this.isProviderConfigured(provider);
    }
    
    return status as Record<OAuthProvider, boolean>;
  }

  /**
   * 清理过期的状态
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    const expiredStates: string[] = [];
    
    this.pendingStates.forEach((stateData, state) => {
      if (now - stateData.timestamp > 300000) { // 5分钟过期
        expiredStates.push(state);
      }
    });
    
    expiredStates.forEach(state => {
      const stateData = this.pendingStates.get(state);
      if (stateData?.reject) {
        stateData.reject(new Error('OAuth state expired'));
      }
      this.pendingStates.delete(state);
    });
  }

  /**
   * 取消OAuth认证
   */
  async cancelAuthentication(state?: string): Promise<void> {
    if (state && this.pendingStates.has(state)) {
      const stateData = this.pendingStates.get(state);
      if (stateData?.reject) {
        stateData.reject(new Error('OAuth authentication cancelled'));
      }
      this.pendingStates.delete(state);
    } else {
      // 取消所有待处理的认证
      this.pendingStates.forEach((stateData) => {
        if (stateData.reject) {
          stateData.reject(new Error('OAuth authentication cancelled'));
        }
      });
      this.pendingStates.clear();
    }
    
    // 停止回调服务器
    await this.stopCallbackServer();
  }

  /**
   * 获取OAuth认证状态
   */
  getAuthenticationStatus(): {
    pending: number;
    providers: OAuthProvider[];
  } {
    const pendingProviders: OAuthProvider[] = [];
    
    this.pendingStates.forEach((stateData) => {
      pendingProviders.push(stateData.provider);
    });
    
    return {
      pending: this.pendingStates.size,
      providers: pendingProviders,
    };
  }
}

// 创建单例实例
const oauthService = OAuthService.getInstance();

export { oauthService, OAuthService };
export default oauthService;