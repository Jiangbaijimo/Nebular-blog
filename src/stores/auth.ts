/**
 * 认证状态管理
 * 管理用户认证状态、登录/登出、token管理等
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User, AuthTokens, UserSession, AuthStatus, AuthError, UserRole } from '../types/auth';
import { httpClient } from '../services/http';
import { API_ENDPOINTS } from '../constants/api';

// ==================== 类型定义 ====================

/**
 * 认证状态接口
 */
export interface AuthState {
  // 用户信息
  user: User | null;
  tokens: AuthTokens | null;
  session: UserSession | null;
  
  // 认证状态
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // 错误状态
  error: AuthError | null;
  
  // 登录状态
  loginAttempts: number;
  lastLoginAttempt: number;
  isLocked: boolean;
  lockUntil: number;
  
  // 会话状态
  sessionExpiry: number;
  rememberMe: boolean;
  
  // OAuth状态
  oauthState: string | null;
  oauthProvider: string | null;
  
  // 两步验证
  twoFactorRequired: boolean;
  twoFactorToken: string | null;
}

/**
 * 认证操作接口
 */
export interface AuthActions {
  // 初始化
  initialize: () => Promise<void>;
  
  // 登录/登出
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  
  // OAuth
  loginWithOAuth: (provider: string) => Promise<void>;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
  
  // 密码管理
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // 用户信息
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshUserInfo: () => Promise<void>;
  
  // Token管理
  refreshTokens: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  
  // 会话管理
  extendSession: () => Promise<void>;
  checkSessionExpiry: () => boolean;
  
  // 两步验证
  verifyTwoFactor: (code: string) => Promise<void>;
  enableTwoFactor: () => Promise<string>; // 返回QR码
  disableTwoFactor: (password: string) => Promise<void>;
  
  // 错误处理
  clearError: () => void;
  setError: (error: AuthError) => void;
  
  // 权限检查
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  
  // 重置状态
  reset: () => void;
}

/**
 * 注册数据接口
 */
interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

// ==================== 默认状态 ====================

const initialAuthState: AuthState = {
  user: null,
  tokens: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: 0,
  isLocked: false,
  lockUntil: 0,
  sessionExpiry: 0,
  rememberMe: false,
  oauthState: null,
  oauthProvider: null,
  twoFactorRequired: false,
  twoFactorToken: null
};

// ==================== 工具函数 ====================

/**
 * 生成OAuth状态参数
 */
const generateOAuthState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * 检查账户锁定状态
 */
const checkAccountLock = (attempts: number, lastAttempt: number): { isLocked: boolean; lockUntil: number } => {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 15 * 60 * 1000; // 15分钟
  const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5分钟内的尝试
  
  const now = Date.now();
  
  // 如果超过尝试窗口，重置计数
  if (now - lastAttempt > ATTEMPT_WINDOW) {
    return { isLocked: false, lockUntil: 0 };
  }
  
  // 检查是否超过最大尝试次数
  if (attempts >= MAX_ATTEMPTS) {
    return { isLocked: true, lockUntil: now + LOCK_DURATION };
  }
  
  return { isLocked: false, lockUntil: 0 };
};

/**
 * 验证token是否有效
 */
const isTokenValid = (token: string, expiry: number): boolean => {
  if (!token || !expiry) return false;
  return Date.now() < expiry * 1000;
};

// ==================== 认证Store ====================

export const useAuthStore = create<AuthState & AuthActions>()()
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialAuthState,

          // 初始化
          initialize: async () => {
            try {
              set((state) => {
                state.isLoading = true;
              });

              const tokens = get().tokens;
              if (tokens && isTokenValid(tokens.accessToken, tokens.expiresAt)) {
                // Token有效，获取用户信息
                await get().refreshUserInfo();
              } else if (tokens?.refreshToken) {
                // 尝试刷新token
                try {
                  await get().refreshTokens();
                  await get().refreshUserInfo();
                } catch (error) {
                  // 刷新失败，清除token
                  get().logout();
                }
              }

              set((state) => {
                state.isInitialized = true;
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'INIT_ERROR',
                  message: error instanceof Error ? error.message : 'Initialization failed',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
                state.isInitialized = true;
              });
            }
          },

          // 登录
          login: async (email, password, rememberMe = false) => {
            const state = get();
            
            // 检查账户锁定
            if (state.isLocked && Date.now() < state.lockUntil) {
              throw new Error('Account is temporarily locked. Please try again later.');
            }

            try {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              const response = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, {
                email,
                password,
                rememberMe
              });

              if (response.success) {
                const { user, tokens, session, twoFactorRequired, twoFactorToken } = response.data;

                if (twoFactorRequired) {
                  set((state) => {
                    state.twoFactorRequired = true;
                    state.twoFactorToken = twoFactorToken;
                    state.isLoading = false;
                  });
                  return;
                }

                // 设置认证信息
                httpClient.setAuthTokens(tokens);

                set((state) => {
                  state.user = user;
                  state.tokens = tokens;
                  state.session = session;
                  state.isAuthenticated = true;
                  state.rememberMe = rememberMe;
                  state.sessionExpiry = tokens.expiresAt;
                  state.loginAttempts = 0;
                  state.isLocked = false;
                  state.lockUntil = 0;
                  state.isLoading = false;
                });

                // 触发登录成功事件
                window.dispatchEvent(new CustomEvent('auth-login', {
                  detail: { user }
                }));
              }
            } catch (error) {
              const attempts = state.loginAttempts + 1;
              const now = Date.now();
              const lockStatus = checkAccountLock(attempts, now);

              set((state) => {
                state.loginAttempts = attempts;
                state.lastLoginAttempt = now;
                state.isLocked = lockStatus.isLocked;
                state.lockUntil = lockStatus.lockUntil;
                state.error = {
                  code: 'LOGIN_ERROR',
                  message: error instanceof Error ? error.message : 'Login failed',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
              });
              throw error;
            }
          },

          // 登出
          logout: async () => {
            try {
              const tokens = get().tokens;
              if (tokens) {
                // 通知服务器登出
                await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
                  refreshToken: tokens.refreshToken
                });
              }
            } catch (error) {
              console.warn('Logout request failed:', error);
            } finally {
              // 清除本地状态
              set((state) => {
                state.user = null;
                state.tokens = null;
                state.session = null;
                state.isAuthenticated = false;
                state.sessionExpiry = 0;
                state.twoFactorRequired = false;
                state.twoFactorToken = null;
                state.error = null;
              });

              // 清除HTTP客户端的token
              httpClient.setAuthTokens({ accessToken: '', refreshToken: '', expiresAt: 0 });

              // 触发登出事件
              window.dispatchEvent(new CustomEvent('auth-logout'));
            }
          },

          // 注册
          register: async (userData) => {
            try {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              const response = await httpClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);

              if (response.success) {
                // 注册成功，可能需要邮箱验证
                set((state) => {
                  state.isLoading = false;
                });

                // 触发注册成功事件
                window.dispatchEvent(new CustomEvent('auth-register', {
                  detail: { email: userData.email }
                }));
              }
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'REGISTER_ERROR',
                  message: error instanceof Error ? error.message : 'Registration failed',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
              });
              throw error;
            }
          },

          // OAuth登录
          loginWithOAuth: async (provider) => {
            try {
              const state = generateOAuthState();
              
              set((draft) => {
                draft.oauthState = state;
                draft.oauthProvider = provider;
              });

              const response = await httpClient.get(`${API_ENDPOINTS.AUTH.OAUTH}/${provider}`, {
                params: { state }
              });

              if (response.success && response.data.authUrl) {
                // 打开OAuth授权页面
                window.open(response.data.authUrl, '_blank');
              }
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'OAUTH_ERROR',
                  message: error instanceof Error ? error.message : 'OAuth login failed',
                  timestamp: new Date().toISOString()
                };
              });
              throw error;
            }
          },

          // 处理OAuth回调
          handleOAuthCallback: async (code, state) => {
            try {
              const currentState = get().oauthState;
              if (state !== currentState) {
                throw new Error('Invalid OAuth state parameter');
              }

              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              const response = await httpClient.post(API_ENDPOINTS.AUTH.OAUTH_CALLBACK, {
                code,
                state,
                provider: get().oauthProvider
              });

              if (response.success) {
                const { user, tokens, session } = response.data;

                httpClient.setAuthTokens(tokens);

                set((state) => {
                  state.user = user;
                  state.tokens = tokens;
                  state.session = session;
                  state.isAuthenticated = true;
                  state.sessionExpiry = tokens.expiresAt;
                  state.oauthState = null;
                  state.oauthProvider = null;
                  state.isLoading = false;
                });

                window.dispatchEvent(new CustomEvent('auth-oauth-success', {
                  detail: { user }
                }));
              }
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'OAUTH_CALLBACK_ERROR',
                  message: error instanceof Error ? error.message : 'OAuth callback failed',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
                state.oauthState = null;
                state.oauthProvider = null;
              });
              throw error;
            }
          },

          // 忘记密码
          forgotPassword: async (email) => {
            try {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              await httpClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });

              set((state) => {
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'FORGOT_PASSWORD_ERROR',
                  message: error instanceof Error ? error.message : 'Failed to send reset email',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
              });
              throw error;
            }
          },

          // 重置密码
          resetPassword: async (token, newPassword) => {
            try {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              await httpClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                token,
                newPassword
              });

              set((state) => {
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'RESET_PASSWORD_ERROR',
                  message: error instanceof Error ? error.message : 'Password reset failed',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
              });
              throw error;
            }
          },

          // 修改密码
          changePassword: async (currentPassword, newPassword) => {
            try {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              await httpClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
                currentPassword,
                newPassword
              });

              set((state) => {
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'CHANGE_PASSWORD_ERROR',
                  message: error instanceof Error ? error.message : 'Password change failed',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
              });
              throw error;
            }
          },

          // 更新用户信息
          updateProfile: async (userData) => {
            try {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              const response = await httpClient.put(API_ENDPOINTS.AUTH.PROFILE, userData);

              if (response.success) {
                set((state) => {
                  state.user = { ...state.user, ...response.data };
                  state.isLoading = false;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'UPDATE_PROFILE_ERROR',
                  message: error instanceof Error ? error.message : 'Profile update failed',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
              });
              throw error;
            }
          },

          // 刷新用户信息
          refreshUserInfo: async () => {
            try {
              const response = await httpClient.get(API_ENDPOINTS.AUTH.PROFILE);
              
              if (response.success) {
                set((state) => {
                  state.user = response.data;
                });
              }
            } catch (error) {
              console.warn('Failed to refresh user info:', error);
            }
          },

          // 刷新token
          refreshTokens: async () => {
            try {
              const tokens = get().tokens;
              if (!tokens?.refreshToken) {
                throw new Error('No refresh token available');
              }

              const response = await httpClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
                refreshToken: tokens.refreshToken
              });

              if (response.success) {
                const newTokens = response.data;
                httpClient.setAuthTokens(newTokens);

                set((state) => {
                  state.tokens = newTokens;
                  state.sessionExpiry = newTokens.expiresAt;
                });
              }
            } catch (error) {
              // Token刷新失败，登出用户
              get().logout();
              throw error;
            }
          },

          // 验证token
          validateToken: async () => {
            try {
              const response = await httpClient.get(API_ENDPOINTS.AUTH.VALIDATE_TOKEN);
              return response.success;
            } catch {
              return false;
            }
          },

          // 延长会话
          extendSession: async () => {
            try {
              const response = await httpClient.post(API_ENDPOINTS.AUTH.EXTEND_SESSION);
              
              if (response.success) {
                set((state) => {
                  state.sessionExpiry = response.data.expiresAt;
                });
              }
            } catch (error) {
              console.warn('Failed to extend session:', error);
            }
          },

          // 检查会话过期
          checkSessionExpiry: () => {
            const { sessionExpiry, isAuthenticated } = get();
            if (!isAuthenticated) return false;
            
            const now = Date.now() / 1000;
            const timeUntilExpiry = sessionExpiry - now;
            
            // 如果会话即将过期（5分钟内），尝试刷新
            if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
              get().refreshTokens().catch(() => {
                // 刷新失败，会在refreshTokens中处理登出
              });
            }
            
            return timeUntilExpiry > 0;
          },

          // 验证两步验证
          verifyTwoFactor: async (code) => {
            try {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              const response = await httpClient.post(API_ENDPOINTS.AUTH.VERIFY_2FA, {
                token: get().twoFactorToken,
                code
              });

              if (response.success) {
                const { user, tokens, session } = response.data;
                httpClient.setAuthTokens(tokens);

                set((state) => {
                  state.user = user;
                  state.tokens = tokens;
                  state.session = session;
                  state.isAuthenticated = true;
                  state.sessionExpiry = tokens.expiresAt;
                  state.twoFactorRequired = false;
                  state.twoFactorToken = null;
                  state.isLoading = false;
                });

                window.dispatchEvent(new CustomEvent('auth-2fa-success', {
                  detail: { user }
                }));
              }
            } catch (error) {
              set((state) => {
                state.error = {
                  code: '2FA_ERROR',
                  message: error instanceof Error ? error.message : 'Two-factor verification failed',
                  timestamp: new Date().toISOString()
                };
                state.isLoading = false;
              });
              throw error;
            }
          },

          // 启用两步验证
          enableTwoFactor: async () => {
            try {
              const response = await httpClient.post(API_ENDPOINTS.AUTH.ENABLE_2FA);
              
              if (response.success) {
                return response.data.qrCode;
              }
              throw new Error('Failed to enable two-factor authentication');
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'ENABLE_2FA_ERROR',
                  message: error instanceof Error ? error.message : 'Failed to enable 2FA',
                  timestamp: new Date().toISOString()
                };
              });
              throw error;
            }
          },

          // 禁用两步验证
          disableTwoFactor: async (password) => {
            try {
              await httpClient.post(API_ENDPOINTS.AUTH.DISABLE_2FA, { password });
              
              // 刷新用户信息
              await get().refreshUserInfo();
            } catch (error) {
              set((state) => {
                state.error = {
                  code: 'DISABLE_2FA_ERROR',
                  message: error instanceof Error ? error.message : 'Failed to disable 2FA',
                  timestamp: new Date().toISOString()
                };
              });
              throw error;
            }
          },

          // 清除错误
          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          // 设置错误
          setError: (error) => {
            set((state) => {
              state.error = error;
            });
          },

          // 权限检查
          hasPermission: (permission) => {
            const user = get().user;
            if (!user) return false;
            
            // 管理员拥有所有权限
            if (user.role === 'admin') return true;
            
            return user.permissions?.includes(permission) || false;
          },

          // 角色检查
          hasRole: (role) => {
            const user = get().user;
            return user?.role === role || false;
          },

          // 重置状态
          reset: () => {
            set(() => ({ ...initialAuthState }));
          }
        }))
      ),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          rememberMe: state.rememberMe,
          sessionExpiry: state.sessionExpiry
        })
      }
    ),
    {
      name: 'auth-store'
    }
  );

// ==================== 导出工具函数 ====================

/**
 * 检查用户是否已认证
 */
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated);
};

/**
 * 获取当前用户
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user);
};

/**
 * 检查用户权限
 */
export const useHasPermission = (permission: string) => {
  return useAuthStore((state) => state.hasPermission(permission));
};

/**
 * 检查用户角色
 */
export const useHasRole = (role: UserRole) => {
  return useAuthStore((state) => state.hasRole(role));
};

/**
 * 认证加载状态
 */
export const useAuthLoading = () => {
  return useAuthStore((state) => state.isLoading);
};

/**
 * 认证错误状态
 */
export const useAuthError = () => {
  return useAuthStore((state) => state.error);
};