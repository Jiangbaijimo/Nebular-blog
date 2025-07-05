// JWT Token管理服务
import { invoke } from '@tauri-apps/api/tauri';
import { storageUtils } from '../storage/localDB';
import type { TokenPair, TokenPayload, RefreshTokenResponse } from '../../types/auth';

/**
 * Token管理器类
 */
class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly REFRESH_BUFFER = 5 * 60 * 1000; // 5分钟缓冲时间

  private constructor() {
    this.loadTokensFromStorage();
    this.setupAutoRefresh();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * 设置Token对
   */
  async setTokens(tokenPair: TokenPair): Promise<void> {
    try {
      this.accessToken = tokenPair.accessToken;
      this.refreshToken = tokenPair.refreshToken;
      
      // 解析访问令牌获取过期时间
      const payload = this.parseJWT(tokenPair.accessToken);
      this.tokenExpiry = payload.exp * 1000; // 转换为毫秒

      // 保存到本地存储
      await this.saveTokensToStorage();
      
      // 设置自动刷新
      this.setupAutoRefresh();
      
      console.log('Tokens set successfully');
    } catch (error) {
      console.error('Failed to set tokens:', error);
      throw error;
    }
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string | null> {
    // 检查令牌是否即将过期
    if (this.isTokenExpiringSoon()) {
      await this.refreshAccessToken();
    }
    
    return this.accessToken;
  }

  /**
   * 获取刷新令牌
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * 检查是否有有效的访问令牌
   */
  hasValidAccessToken(): boolean {
    return this.accessToken !== null && !this.isTokenExpired();
  }

  /**
   * 检查是否有刷新令牌
   */
  hasRefreshToken(): boolean {
    return this.refreshToken !== null;
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      console.warn('No refresh token available');
      return null;
    }

    try {
      console.log('Refreshing access token...');
      
      // 调用后端API刷新令牌
      const response = await this.callRefreshAPI(this.refreshToken);
      
      if (response.accessToken) {
        this.accessToken = response.accessToken;
        
        // 如果返回了新的刷新令牌，也要更新
        if (response.refreshToken) {
          this.refreshToken = response.refreshToken;
        }
        
        // 更新过期时间
        const payload = this.parseJWT(response.accessToken);
        this.tokenExpiry = payload.exp * 1000;
        
        // 保存到本地存储
        await this.saveTokensToStorage();
        
        // 重新设置自动刷新
        this.setupAutoRefresh();
        
        console.log('Access token refreshed successfully');
        return this.accessToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      
      // 刷新失败，清除所有令牌
      await this.clearTokens();
      
      throw error;
    }
  }

  /**
   * 清除所有令牌
   */
  async clearTokens(): Promise<void> {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      
      // 清除自动刷新定时器
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      
      // 从本地存储中删除
      await this.removeTokensFromStorage();
      
      console.log('Tokens cleared successfully');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      throw error;
    }
  }

  /**
   * 获取令牌剩余有效时间（毫秒）
   */
  getTokenRemainingTime(): number {
    if (!this.tokenExpiry) {
      return 0;
    }
    
    return Math.max(0, this.tokenExpiry - Date.now());
  }

  /**
   * 检查令牌是否已过期
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) {
      return true;
    }
    
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * 检查令牌是否即将过期
   */
  private isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiry) {
      return true;
    }
    
    return Date.now() >= (this.tokenExpiry - this.REFRESH_BUFFER);
  }

  /**
   * 解析JWT令牌
   */
  private parseJWT(token: string): TokenPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      throw new Error('Invalid JWT token format');
    }
  }

  /**
   * 设置自动刷新
   */
  private setupAutoRefresh(): void {
    // 清除现有的定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    if (!this.tokenExpiry) {
      return;
    }
    
    // 计算刷新时间（过期前5分钟）
    const refreshTime = this.tokenExpiry - Date.now() - this.REFRESH_BUFFER;
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error('Auto refresh failed:', error);
        }
      }, refreshTime);
      
      console.log(`Auto refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`);
    } else {
      // 如果令牌已经即将过期，立即尝试刷新
      this.refreshAccessToken().catch(error => {
        console.error('Immediate refresh failed:', error);
      });
    }
  }

  /**
   * 从本地存储加载令牌
   */
  private async loadTokensFromStorage(): Promise<void> {
    try {
      // 使用Tauri的安全存储
      this.accessToken = await invoke<string | null>('get_secure_storage', {
        key: this.ACCESS_TOKEN_KEY,
      }).catch(() => null);
      
      this.refreshToken = await invoke<string | null>('get_secure_storage', {
        key: this.REFRESH_TOKEN_KEY,
      }).catch(() => null);
      
      const expiryStr = await invoke<string | null>('get_secure_storage', {
        key: this.TOKEN_EXPIRY_KEY,
      }).catch(() => null);
      
      if (expiryStr) {
        this.tokenExpiry = parseInt(expiryStr);
      }
      
      // 检查令牌是否已过期
      if (this.isTokenExpired()) {
        console.log('Stored access token is expired');
        this.accessToken = null;
        this.tokenExpiry = null;
      }
      
      console.log('Tokens loaded from storage');
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
    }
  }

  /**
   * 保存令牌到本地存储
   */
  private async saveTokensToStorage(): Promise<void> {
    try {
      if (this.accessToken) {
        await invoke('set_secure_storage', {
          key: this.ACCESS_TOKEN_KEY,
          value: this.accessToken,
        });
      }
      
      if (this.refreshToken) {
        await invoke('set_secure_storage', {
          key: this.REFRESH_TOKEN_KEY,
          value: this.refreshToken,
        });
      }
      
      if (this.tokenExpiry) {
        await invoke('set_secure_storage', {
          key: this.TOKEN_EXPIRY_KEY,
          value: this.tokenExpiry.toString(),
        });
      }
      
      console.log('Tokens saved to storage');
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
      throw error;
    }
  }

  /**
   * 从本地存储删除令牌
   */
  private async removeTokensFromStorage(): Promise<void> {
    try {
      await invoke('remove_secure_storage', { key: this.ACCESS_TOKEN_KEY });
      await invoke('remove_secure_storage', { key: this.REFRESH_TOKEN_KEY });
      await invoke('remove_secure_storage', { key: this.TOKEN_EXPIRY_KEY });
      
      console.log('Tokens removed from storage');
    } catch (error) {
      console.error('Failed to remove tokens from storage:', error);
    }
  }

  /**
   * 调用刷新API
   */
  private async callRefreshAPI(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // 这里应该调用实际的API
      // 暂时使用模拟的HTTP请求
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Refresh API call failed:', error);
      throw error;
    }
  }

  /**
   * 获取令牌信息
   */
  getTokenInfo(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    remainingTime: number;
    expiryDate: Date | null;
  } {
    return {
      hasAccessToken: this.accessToken !== null,
      hasRefreshToken: this.refreshToken !== null,
      isExpired: this.isTokenExpired(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      remainingTime: this.getTokenRemainingTime(),
      expiryDate: this.tokenExpiry ? new Date(this.tokenExpiry) : null,
    };
  }

  /**
   * 验证令牌格式
   */
  static validateTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      
      // 尝试解析header和payload
      JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取令牌载荷
   */
  getTokenPayload(): TokenPayload | null {
    if (!this.accessToken) {
      return null;
    }
    
    try {
      return this.parseJWT(this.accessToken);
    } catch {
      return null;
    }
  }

  /**
   * 检查令牌权限
   */
  hasPermission(permission: string): boolean {
    const payload = this.getTokenPayload();
    if (!payload || !payload.permissions) {
      return false;
    }
    
    return payload.permissions.includes(permission);
  }

  /**
   * 检查用户角色
   */
  hasRole(role: string): boolean {
    const payload = this.getTokenPayload();
    if (!payload || !payload.roles) {
      return false;
    }
    
    return payload.roles.includes(role);
  }

  /**
   * 获取用户ID
   */
  getUserId(): string | null {
    const payload = this.getTokenPayload();
    return payload?.sub || null;
  }

  /**
   * 获取用户名
   */
  getUsername(): string | null {
    const payload = this.getTokenPayload();
    return payload?.username || null;
  }

  /**
   * 监听令牌变化
   */
  onTokenChange(callback: (hasToken: boolean) => void): () => void {
    const checkToken = () => {
      callback(this.hasValidAccessToken());
    };
    
    // 立即执行一次
    checkToken();
    
    // 设置定期检查
    const interval = setInterval(checkToken, 60000); // 每分钟检查一次
    
    // 返回清理函数
    return () => {
      clearInterval(interval);
    };
  }
}

// 创建单例实例
const tokenManager = TokenManager.getInstance();

export { tokenManager, TokenManager };
export default tokenManager;