import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { oauthService } from '../services/auth/oauthService';

export type OAuthProvider = 'google' | 'github' | 'microsoft';

export interface OAuthState {
  isLoading: boolean;
  error: string | null;
  provider: OAuthProvider | null;
}

export interface OAuthCallbackState {
  status: 'loading' | 'success' | 'error';
  message: string;
  countdown: number;
}

/**
 * OAuth 状态管理 Hook
 * 提供统一的 OAuth 认证状态管理和操作方法
 */
export function useOAuthState() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  
  const [state, setState] = useState<OAuthState>({
    isLoading: false,
    error: null,
    provider: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 启动 OAuth 认证流程
   */
  const handleOAuthLogin = useCallback(async (
    provider: OAuthProvider,
    redirectTo?: string
  ) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setState({
      isLoading: true,
      error: null,
      provider,
    });

    try {
      await oauthService.authenticate(provider, redirectTo);
      // 注意：这里的代码通常不会执行，因为 authenticate 会触发页面重定向
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // 请求被取消，不处理错误
      }
      
      console.error(`${provider} OAuth 启动失败:`, error);
      setState({
        isLoading: false,
        error: error.response?.data?.message || 
               error.message || 
               `${getProviderDisplayName(provider)} 登录启动失败，请重试`,
        provider: null,
      });
    }
  }, []);

  /**
   * 处理 OAuth 回调
   */
  const handleCallback = useCallback(async (): Promise<OAuthCallbackState> => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const code = urlParams.get('code');

    // 检查是否有错误参数
    if (error) {
      const errorMessage = getErrorMessage(error, errorDescription);
      console.error('OAuth 回调错误:', { error, errorDescription });
      
      return {
        status: 'error',
        message: errorMessage,
        countdown: 5,
      };
    }

    // 检查是否有授权码
    if (!code) {
      console.error('OAuth 回调缺少授权码');
      return {
        status: 'error',
        message: '认证失败：缺少授权码',
        countdown: 5,
      };
    }

    try {
      // 处理 OAuth 回调
      const response = await oauthService.handleWebAppCallback();
      
      if (response.success && response.data) {
        // 更新全局认证状态
        useAuthStore.getState().setAuthData(response.data);
        
        // 刷新用户信息以确保数据完整
        try {
          await useAuthStore.getState().refreshUserInfo();
        } catch (error) {
          console.warn('刷新用户信息失败:', error);
        }
        
        return {
          status: 'success',
          message: '登录成功，正在跳转...',
          countdown: 2,
        };
      } else {
        return {
          status: 'error',
          message: response.message || '认证失败，请重试',
          countdown: 5,
        };
      }
    } catch (error: any) {
      console.error('OAuth 回调处理失败:', error);
      
      return {
        status: 'error',
        message: error.response?.data?.message || 
                error.message || 
                '认证失败，请重试',
        countdown: 5,
      };
    }
  }, []);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      isLoading: false,
      error: null,
      provider: null,
    });
  }, []);

  /**
   * 获取支持的 OAuth 提供商
   */
  const getSupportedProviders = useCallback(() => {
    return oauthService.getSupportedProviders();
  }, []);

  /**
   * 检查提供商是否可用
   */
  const isProviderAvailable = useCallback((provider: OAuthProvider) => {
    return oauthService.isProviderAvailable(provider);
  }, []);

  return {
    ...state,
    handleOAuthLogin,
    handleCallback,
    clearError,
    reset,
    getSupportedProviders,
    isProviderAvailable,
  };
}

/**
 * 获取提供商显示名称
 */
function getProviderDisplayName(provider: OAuthProvider): string {
  const names: Record<OAuthProvider, string> = {
    google: 'Google',
    github: 'GitHub',
    microsoft: 'Microsoft',
  };
  return names[provider] || provider;
}

/**
 * 获取错误消息
 */
function getErrorMessage(error: string, description?: string | null): string {
  const errorMessages: Record<string, string> = {
    'access_denied': '用户拒绝了授权请求',
    'invalid_request': '无效的授权请求',
    'unauthorized_client': '客户端未授权',
    'unsupported_response_type': '不支持的响应类型',
    'invalid_scope': '无效的授权范围',
    'server_error': '服务器内部错误',
    'temporarily_unavailable': '服务暂时不可用',
    'invalid_client': '无效的客户端',
    'invalid_grant': '无效的授权许可',
    'unsupported_grant_type': '不支持的授权类型',
  };

  const message = errorMessages[error] || '认证过程中发生未知错误';
  
  if (description && process.env.NODE_ENV === 'development') {
    return `${message}（${description}）`;
  }
  
  return message;
}

export default useOAuthState;