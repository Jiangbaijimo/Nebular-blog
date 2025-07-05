// 认证状态管理
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../services/api/auth';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  UserPreferences,
  UserProfile,
  ChangePasswordRequest,
  OAuthLoginRequest,
} from '../types/auth';
import { setStorageItem, getStorageItem, removeStorageItem } from '../utils/storage';

// 认证状态接口
interface AuthState {
  // 状态数据
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  preferences: UserPreferences | null;
  
  // 会话信息
  sessions: Array<{
    id: string;
    deviceInfo: string;
    ipAddress: string;
    location?: string;
    lastActive: string;
    current: boolean;
  }>;
  
  // 两步验证状态
  twoFactorEnabled: boolean;
  twoFactorSetup: {
    qrCode?: string;
    secret?: string;
    backupCodes?: string[];
  } | null;
}

// 认证操作接口
interface AuthActions {
  // 基础认证操作
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // 用户信息管理
  getCurrentUser: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  getPreferences: () => Promise<void>;
  
  // 密码管理
  changePassword: (request: ChangePasswordRequest) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  
  // OAuth登录
  oauthLogin: (request: OAuthLoginRequest) => Promise<void>;
  getOAuthUrl: (provider: 'google' | 'github') => Promise<string>;
  
  // 邮箱验证
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  
  // 用户名和邮箱检查
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  checkEmailAvailability: (email: string) => Promise<boolean>;
  
  // 会话管理
  getSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;
  
  // 两步验证
  enableTwoFactor: () => Promise<void>;
  confirmTwoFactor: (code: string) => Promise<void>;
  disableTwoFactor: (code: string) => Promise<void>;
  generateBackupCodes: () => Promise<void>;
  
  // 状态管理
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // 认证检查
  checkAuthStatus: () => Promise<void>;
  isTokenExpired: () => boolean;
  shouldRefreshToken: () => boolean;
}

type AuthStore = AuthState & AuthActions;

// 初始状态
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  preferences: null,
  sessions: [],
  twoFactorEnabled: false,
  twoFactorSetup: null,
};

// 创建认证store
export const useAuthStore = create<AuthStore>()
  (persist(
    immer((set, get) => ({
      ...initialState,

      // ==================== 基础认证操作 ====================
      
      login: async (credentials: LoginRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authAPI.login(credentials);
          
          set((state) => {
            state.user = response.user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.twoFactorEnabled = response.user.twoFactorEnabled || false;
          });

          // 获取用户偏好设置
          await get().getPreferences();
          
          // 触发登录成功事件
          window.dispatchEvent(new CustomEvent('auth:login', {
            detail: { user: response.user }
          }));
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authAPI.register(userData);
          
          // 如果注册后自动登录
          if (response.user) {
            set((state) => {
              state.user = response.user;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
            
            // 获取用户偏好设置
            await get().getPreferences();
          } else {
            set((state) => {
              state.isLoading = false;
            });
          }
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          await authAPI.logout();
        } catch (error) {
          console.warn('Logout request failed:', error);
        } finally {
          // 无论请求是否成功，都清除本地状态
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.preferences = null;
            state.sessions = [];
            state.twoFactorEnabled = false;
            state.twoFactorSetup = null;
            state.error = null;
          });
          
          // 触发登出事件
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      },

      refreshToken: async () => {
        try {
          const refreshToken = authAPI.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          await authAPI.refreshToken({ refreshToken });
          
          // 刷新用户信息
          await get().getCurrentUser();
        } catch (error) {
          // 刷新失败，清除认证状态
          await get().logout();
          throw error;
        }
      },

      // ==================== 用户信息管理 ====================
      
      getCurrentUser: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const user = await authAPI.getCurrentUser();
          
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.twoFactorEnabled = user.twoFactorEnabled || false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
            state.isAuthenticated = false;
            state.user = null;
          });
          throw error;
        }
      },

      updateProfile: async (profile: Partial<UserProfile>) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const updatedUser = await authAPI.updateProfile(profile);
          
          set((state) => {
            state.user = updatedUser;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      updatePreferences: async (preferences: Partial<UserPreferences>) => {
        try {
          const updatedPreferences = await authAPI.updatePreferences(preferences);
          
          set((state) => {
            state.preferences = updatedPreferences;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getPreferences: async () => {
        try {
          const preferences = await authAPI.getPreferences();
          
          set((state) => {
            state.preferences = preferences;
          });
        } catch (error) {
          console.warn('Failed to get user preferences:', error);
        }
      },

      // ==================== 密码管理 ====================
      
      changePassword: async (request: ChangePasswordRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await authAPI.changePassword(request);
          
          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      requestPasswordReset: async (email: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await authAPI.requestPasswordReset(email);
          
          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await authAPI.resetPassword({ token, newPassword });
          
          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== OAuth登录 ====================
      
      oauthLogin: async (request: OAuthLoginRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authAPI.oauthLogin(request);
          
          set((state) => {
            state.user = response.user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.twoFactorEnabled = response.user.twoFactorEnabled || false;
          });

          // 获取用户偏好设置
          await get().getPreferences();
          
          // 触发登录成功事件
          window.dispatchEvent(new CustomEvent('auth:login', {
            detail: { user: response.user }
          }));
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getOAuthUrl: async (provider: 'google' | 'github') => {
        const response = await authAPI.getOAuthUrl(provider);
        return response.url;
      },

      // ==================== 邮箱验证 ====================
      
      verifyEmail: async (token: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await authAPI.verifyEmail(token);
          
          // 刷新用户信息
          await get().getCurrentUser();
          
          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      resendVerificationEmail: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await authAPI.resendVerificationEmail();
          
          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 用户名和邮箱检查 ====================
      
      checkUsernameAvailability: async (username: string) => {
        const response = await authAPI.checkUsernameAvailability(username);
        return response.available;
      },

      checkEmailAvailability: async (email: string) => {
        const response = await authAPI.checkEmailAvailability(email);
        return response.available;
      },

      // ==================== 会话管理 ====================
      
      getSessions: async () => {
        try {
          const sessions = await authAPI.getSessions();
          
          set((state) => {
            state.sessions = sessions;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      revokeSession: async (sessionId: string) => {
        try {
          await authAPI.revokeSession(sessionId);
          
          // 刷新会话列表
          await get().getSessions();
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      revokeAllOtherSessions: async () => {
        try {
          await authAPI.revokeAllOtherSessions();
          
          // 刷新会话列表
          await get().getSessions();
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 两步验证 ====================
      
      enableTwoFactor: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authAPI.enableTwoFactor();
          
          set((state) => {
            state.twoFactorSetup = {
              qrCode: response.qrCode,
              secret: response.secret,
              backupCodes: response.backupCodes,
            };
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      confirmTwoFactor: async (code: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await authAPI.confirmTwoFactor(code);
          
          set((state) => {
            state.twoFactorEnabled = true;
            state.twoFactorSetup = null;
            state.isLoading = false;
          });
          
          // 更新用户信息
          if (get().user) {
            set((state) => {
              if (state.user) {
                state.user.twoFactorEnabled = true;
              }
            });
          }
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      disableTwoFactor: async (code: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await authAPI.disableTwoFactor(code);
          
          set((state) => {
            state.twoFactorEnabled = false;
            state.twoFactorSetup = null;
            state.isLoading = false;
          });
          
          // 更新用户信息
          if (get().user) {
            set((state) => {
              if (state.user) {
                state.user.twoFactorEnabled = false;
              }
            });
          }
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      generateBackupCodes: async () => {
        try {
          const response = await authAPI.generateBackupCodes();
          
          set((state) => {
            if (state.twoFactorSetup) {
              state.twoFactorSetup.backupCodes = response.backupCodes;
            } else {
              state.twoFactorSetup = {
                backupCodes: response.backupCodes,
              };
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 状态管理 ====================
      
      setUser: (user: User | null) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      reset: () => {
        set(() => ({ ...initialState }));
      },

      // ==================== 认证检查 ====================
      
      checkAuthStatus: async () => {
        const token = authAPI.getAccessToken();
        
        if (!token) {
          set((state) => {
            state.isAuthenticated = false;
            state.user = null;
          });
          return;
        }

        if (authAPI.isAuthenticated()) {
          try {
            // 如果token有效但没有用户信息，获取用户信息
            if (!get().user) {
              await get().getCurrentUser();
            }
            
            // 检查是否需要刷新token
            if (authAPI.shouldRefreshToken()) {
              await get().refreshToken();
            }
          } catch (error) {
            console.warn('Auth status check failed:', error);
            await get().logout();
          }
        } else {
          // Token过期，尝试刷新
          try {
            await get().refreshToken();
          } catch (error) {
            await get().logout();
          }
        }
      },

      isTokenExpired: () => {
        return !authAPI.isAuthenticated();
      },

      shouldRefreshToken: () => {
        return authAPI.shouldRefreshToken();
      },
    })),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        preferences: state.preferences,
        twoFactorEnabled: state.twoFactorEnabled,
      }),
    }
  ));

// 监听认证事件
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().reset();
  });
}

export default useAuthStore;