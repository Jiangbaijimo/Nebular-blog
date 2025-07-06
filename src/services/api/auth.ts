// 认证API服务
import httpClient, { TokenManager } from '../http';
import { API_ENDPOINTS } from '../../constants/api';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ResetPasswordRequest,
  ChangePasswordRequest,
  OAuthLoginRequest,
  UserProfile,
  UserPreferences,
} from '../../types/auth';

/**
 * 认证API服务类
 */
class AuthAPI {
  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      { skipAuth: true }
    );

    // 保存token
    if (response.accessToken) {
      TokenManager.setAccessToken(response.accessToken, response.expiresIn);
      TokenManager.setRefreshToken(response.refreshToken);
    }

    return response;
  }



  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        await httpClient.post(
          API_ENDPOINTS.AUTH.LOGOUT,
          { refreshToken },
          { skipRetry: true }
        );
      }
    } catch (error) {
      // 登出失败也要清除本地token
      console.warn('Logout request failed:', error);
    } finally {
      // 清除本地token
      TokenManager.clearTokens();
      
      // 触发登出事件
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  /**
   * 刷新访问token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await httpClient.post<RefreshTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      request,
      { skipAuth: true, skipRetry: true }
    );

    // 更新token
    if (response.accessToken) {
      TokenManager.setAccessToken(response.accessToken, response.expiresIn);
      if (response.refreshToken) {
        TokenManager.setRefreshToken(response.refreshToken);
      }
    }

    return response;
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    const response = await httpClient.get<{
      success: boolean;
      data: User;
    }>(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  }

  /**
   * 更新用户资料
   */
  async updateProfile(profile: Partial<UserProfile>): Promise<User> {
    return httpClient.put<User>(API_ENDPOINTS.AUTH.PROFILE, profile);
  }

  /**
   * 更新用户偏好设置
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return httpClient.put<UserPreferences>(
      API_ENDPOINTS.AUTH.PREFERENCES,
      preferences
    );
  }

  /**
   * 获取用户偏好设置
   */
  async getPreferences(): Promise<UserPreferences> {
    return httpClient.get<UserPreferences>(API_ENDPOINTS.AUTH.PREFERENCES);
  }

  /**
   * 修改密码
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    return httpClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, request);
  }

  /**
   * 重置密码请求
   */
  async requestPasswordReset(email: string): Promise<void> {
    return httpClient.post(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      { email },
      { skipAuth: true }
    );
  }

  /**
   * 重置密码确认
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    return httpClient.post(
      API_ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM,
      request,
      { skipAuth: true }
    );
  }

  /**
   * OAuth登录（Google、GitHub等）- 已废弃，保留兼容性
   * @deprecated 使用 exchangeCodeForToken 替代
   */
  async oauthLogin(request: OAuthLoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.OAUTH_LOGIN,
      request,
      { skipAuth: true }
    );

    // 保存token
    if (response.accessToken) {
      TokenManager.setAccessToken(response.accessToken, response.expiresIn);
      TokenManager.setRefreshToken(response.refreshToken);
    }

    return response;
  }

  /**
   * 获取OAuth授权URL - 已废弃，保留兼容性
   * @deprecated 直接使用后端OAuth入口端点
   */
  async getOAuthUrl(provider: 'google' | 'github'): Promise<{ url: string }> {
    return httpClient.get<{ url: string }>(
      `${API_ENDPOINTS.AUTH.OAUTH_URL}/${provider}`,
      { skipAuth: true }
    );
  }

  /**
   * 使用临时授权码交换真实token
   * 这是新的OAuth流程的核心方法
   */
  async exchangeCodeForToken(code: string): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.EXCHANGE_CODE,
      { code },
      { skipAuth: true }
    );

    // 保存token
    if (response.accessToken) {
      TokenManager.setAccessToken(response.accessToken, response.expiresIn);
      TokenManager.setRefreshToken(response.refreshToken);
    }

    return response;
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<void> {
    return httpClient.post(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { token },
      { skipAuth: true }
    );
  }

  /**
   * 重新发送验证邮件
   */
  async resendVerificationEmail(): Promise<void> {
    return httpClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION);
  }

  /**
   * 检查用户名是否可用
   */
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    return httpClient.get<{ available: boolean }>(
      `${API_ENDPOINTS.AUTH.CHECK_USERNAME}?username=${encodeURIComponent(username)}`,
      { skipAuth: true }
    );
  }

  /**
   * 检查邮箱是否可用
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    return httpClient.get<{ available: boolean }>(
      `${API_ENDPOINTS.AUTH.CHECK_EMAIL}?email=${encodeURIComponent(email)}`,
      { skipAuth: true }
    );
  }

  /**
   * 获取用户会话信息
   */
  async getSessions(): Promise<Array<{
    id: string;
    deviceInfo: string;
    ipAddress: string;
    location?: string;
    lastActive: string;
    current: boolean;
  }>> {
    return httpClient.get(API_ENDPOINTS.AUTH.SESSIONS);
  }

  /**
   * 撤销指定会话
   */
  async revokeSession(sessionId: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.AUTH.SESSIONS}/${sessionId}`);
  }

  /**
   * 撤销所有其他会话
   */
  async revokeAllOtherSessions(): Promise<void> {
    return httpClient.post(`${API_ENDPOINTS.AUTH.SESSIONS}/revoke-others`);
  }

  /**
   * 启用两步验证
   */
  async enableTwoFactor(): Promise<{
    qrCode: string;
    secret: string;
    backupCodes: string[];
  }> {
    return httpClient.post(API_ENDPOINTS.AUTH.TWO_FACTOR_ENABLE);
  }

  /**
   * 确认两步验证设置
   */
  async confirmTwoFactor(code: string): Promise<void> {
    return httpClient.post(API_ENDPOINTS.AUTH.TWO_FACTOR_CONFIRM, { code });
  }

  /**
   * 禁用两步验证
   */
  async disableTwoFactor(code: string): Promise<void> {
    return httpClient.post(API_ENDPOINTS.AUTH.TWO_FACTOR_DISABLE, { code });
  }

  /**
   * 生成新的备份码
   */
  async generateBackupCodes(): Promise<{ backupCodes: string[] }> {
    return httpClient.post(API_ENDPOINTS.AUTH.TWO_FACTOR_BACKUP_CODES);
  }

  /**
   * 检查当前认证状态
   */
  isAuthenticated(): boolean {
    const token = TokenManager.getAccessToken();
    return !!token && !TokenManager.isTokenExpired();
  }

  /**
   * 检查是否需要刷新token
   */
  shouldRefreshToken(): boolean {
    return TokenManager.shouldRefreshToken();
  }

  /**
   * 获取当前访问token
   */
  getAccessToken(): string | null {
    return TokenManager.getAccessToken();
  }

  /**
   * 获取当前刷新token
   */
  getRefreshToken(): string | null {
    return TokenManager.getRefreshToken();
  }

  /**
   * 清除所有认证信息
   */
  clearAuth(): void {
    TokenManager.clearTokens();
  }

  /**
   * 检查系统初始化状态
   */
  async checkInitialization(): Promise<{
    isInitialized: boolean;
    requiresSetup: boolean;
    allowRegistration: boolean;
    adminUserExists: boolean;
    userCount: number;
  }> {
    const response = await httpClient.get<{
      success: boolean;
      data: {
        isInitialized: boolean;
        requiresSetup: boolean;
        allowRegistration: boolean;
        adminUserExists: boolean;
        userCount: number;
      };
      message: string;
      timestamp: string;
    }>(
      API_ENDPOINTS.AUTH.CHECK_INITIALIZATION,
      { skipAuth: true }
    );
    return response.data;
  }


}

// 创建认证API实例
const authAPI = new AuthAPI();

export { authAPI, AuthAPI };
export default authAPI;