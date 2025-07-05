// 自动刷新Token服务
import tokenManager from './tokenManager';
import type { TokenInfo } from '../../types/auth';

/**
 * 自动刷新Token服务类
 */
class AutoRefreshService {
  private static instance: AutoRefreshService;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5分钟
  private readonly CHECK_INTERVAL = 60 * 1000; // 1分钟检查一次
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private retryCount = 0;
  private listeners: Array<(success: boolean, error?: Error) => void> = [];
  private isEnabled = true;

  private constructor() {
    this.startAutoRefresh();
    this.setupVisibilityListener();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AutoRefreshService {
    if (!AutoRefreshService.instance) {
      AutoRefreshService.instance = new AutoRefreshService();
    }
    return AutoRefreshService.instance;
  }

  /**
   * 启动自动刷新
   */
  startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      if (this.isEnabled) {
        this.checkAndRefreshToken();
      }
    }, this.CHECK_INTERVAL);

    console.log('Auto refresh service started');
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    console.log('Auto refresh service stopped');
  }

  /**
   * 启用/禁用自动刷新
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Auto refresh ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 检查并刷新Token
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      const tokenInfo = await tokenManager.getTokenInfo();
      
      if (!tokenInfo || !tokenInfo.accessToken) {
        return;
      }

      // 检查Token是否即将过期
      if (this.shouldRefreshToken(tokenInfo)) {
        await this.refreshToken();
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
  }

  /**
   * 判断是否应该刷新Token
   */
  private shouldRefreshToken(tokenInfo: TokenInfo): boolean {
    if (!tokenInfo.expiresAt) {
      return false;
    }

    const now = Date.now();
    const expiresAt = new Date(tokenInfo.expiresAt).getTime();
    const timeUntilExpiry = expiresAt - now;

    return timeUntilExpiry <= this.REFRESH_THRESHOLD;
  }

  /**
   * 刷新Token
   */
  async refreshToken(): Promise<void> {
    // 如果已经在刷新中，返回现有的Promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 执行Token刷新
   */
  private async performTokenRefresh(): Promise<void> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // 调用刷新API
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Refresh token无效，需要重新登录
          await this.handleRefreshTokenExpired();
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();
      
      if (!tokenData.accessToken) {
        throw new Error('Invalid refresh response: missing access token');
      }

      // 保存新的Token
      await tokenManager.setTokens({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || refreshToken,
      });

      // 重置重试计数
      this.retryCount = 0;
      
      // 通知监听器
      this.notifyListeners(true);
      
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // 增加重试计数
      this.retryCount++;
      
      // 如果达到最大重试次数，清除Token
      if (this.retryCount >= this.MAX_RETRY_ATTEMPTS) {
        console.error('Max refresh retry attempts reached, clearing tokens');
        await this.handleRefreshFailure();
      }
      
      // 通知监听器
      this.notifyListeners(false, error as Error);
      
      throw error;
    }
  }

  /**
   * 处理Refresh Token过期
   */
  private async handleRefreshTokenExpired(): Promise<void> {
    console.log('Refresh token expired, clearing all tokens');
    
    // 清除所有Token
    await tokenManager.clearTokens();
    
    // 重置重试计数
    this.retryCount = 0;
    
    // 触发登录过期事件
    this.dispatchLoginExpiredEvent();
  }

  /**
   * 处理刷新失败
   */
  private async handleRefreshFailure(): Promise<void> {
    // 清除Token
    await tokenManager.clearTokens();
    
    // 重置重试计数
    this.retryCount = 0;
    
    // 触发登录过期事件
    this.dispatchLoginExpiredEvent();
  }

  /**
   * 触发登录过期事件
   */
  private dispatchLoginExpiredEvent(): void {
    const event = new CustomEvent('auth:login-expired', {
      detail: {
        reason: 'token_refresh_failed',
        timestamp: Date.now(),
      },
    });
    
    window.dispatchEvent(event);
  }

  /**
   * 设置页面可见性监听器
   */
  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isEnabled) {
        // 页面变为可见时，立即检查Token
        this.checkAndRefreshToken();
      }
    });
  }

  /**
   * 手动触发Token刷新
   */
  async forceRefresh(): Promise<void> {
    console.log('Force refreshing token');
    await this.refreshToken();
  }

  /**
   * 检查Token是否需要刷新
   */
  async needsRefresh(): Promise<boolean> {
    try {
      const tokenInfo = await tokenManager.getTokenInfo();
      return tokenInfo ? this.shouldRefreshToken(tokenInfo) : false;
    } catch (error) {
      console.error('Error checking if token needs refresh:', error);
      return false;
    }
  }

  /**
   * 获取Token剩余时间
   */
  async getTokenTimeRemaining(): Promise<number | null> {
    try {
      const tokenInfo = await tokenManager.getTokenInfo();
      
      if (!tokenInfo || !tokenInfo.expiresAt) {
        return null;
      }

      const now = Date.now();
      const expiresAt = new Date(tokenInfo.expiresAt).getTime();
      const remaining = expiresAt - now;

      return Math.max(0, remaining);
    } catch (error) {
      console.error('Error getting token time remaining:', error);
      return null;
    }
  }

  /**
   * 添加刷新监听器
   */
  addRefreshListener(listener: (success: boolean, error?: Error) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除刷新监听器
   */
  removeRefreshListener(listener: (success: boolean, error?: Error) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(success: boolean, error?: Error): void {
    this.listeners.forEach(listener => {
      try {
        listener(success, error);
      } catch (err) {
        console.error('Error in refresh listener:', err);
      }
    });
  }

  /**
   * 获取刷新状态
   */
  getRefreshStatus(): {
    isRefreshing: boolean;
    isEnabled: boolean;
    retryCount: number;
    maxRetryAttempts: number;
    refreshThreshold: number;
    checkInterval: number;
  } {
    return {
      isRefreshing: this.isRefreshing,
      isEnabled: this.isEnabled,
      retryCount: this.retryCount,
      maxRetryAttempts: this.MAX_RETRY_ATTEMPTS,
      refreshThreshold: this.REFRESH_THRESHOLD,
      checkInterval: this.CHECK_INTERVAL,
    };
  }

  /**
   * 重置重试计数
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }

  /**
   * 设置刷新阈值
   */
  setRefreshThreshold(threshold: number): void {
    if (threshold > 0) {
      (this as any).REFRESH_THRESHOLD = threshold;
      console.log(`Refresh threshold set to ${threshold}ms`);
    }
  }

  /**
   * 设置检查间隔
   */
  setCheckInterval(interval: number): void {
    if (interval > 0) {
      (this as any).CHECK_INTERVAL = interval;
      
      // 重启定时器
      this.stopAutoRefresh();
      this.startAutoRefresh();
      
      console.log(`Check interval set to ${interval}ms`);
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.listeners = [];
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.retryCount = 0;
    
    console.log('Auto refresh service destroyed');
  }
}

// 创建单例实例
const autoRefreshService = AutoRefreshService.getInstance();

export { autoRefreshService, AutoRefreshService };
export default autoRefreshService;