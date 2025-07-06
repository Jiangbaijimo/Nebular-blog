// 认证守卫组件
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import tokenManager from '../../services/auth/tokenManager';
import autoRefreshService from '../../services/auth/autoRefresh';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * 认证守卫组件
 * 用于保护需要认证的路由
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = '/auth/login',
  requireAuth = true,
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);

  /**
   * 检查认证状态（使用authStore）
   */
  const handleAuthCheck = async () => {
    try {
      setLocalError(null);
      await checkAuthStatus();
    } catch (error) {
      console.error('Auth check failed:', error);
      setLocalError(error instanceof Error ? error.message : '认证检查失败');
    }
  };

  // 初始认证检查
  useEffect(() => {
    handleAuthCheck();
  }, []);

  // 监听Token变化
  useEffect(() => {
    const handleTokenChange = () => {
      handleAuthCheck();
    };

    // 监听Token变化事件
    window.addEventListener('auth:token-changed', handleTokenChange);
    window.addEventListener('auth:login-expired', handleTokenChange);
    
    return () => {
      window.removeEventListener('auth:token-changed', handleTokenChange);
      window.removeEventListener('auth:login-expired', handleTokenChange);
    };
  }, []);

  // 监听页面可见性变化，重新检查认证状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && requireAuth) {
        handleAuthCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requireAuth]);

  // 加载状态
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            正在验证身份...
          </p>
        </div>
      </div>
    );
  }

  // 需要认证但未认证
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location, error: localError }}
        replace
      />
    );
  }

  // 不需要认证但已认证（如登录页面）
  if (!requireAuth && isAuthenticated) {
    // 从state中获取原始目标路径，或默认跳转到首页
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // 认证状态符合要求，渲染子组件
  return <>{children}</>;
};

/**
 * 需要认证的路由守卫
 */
export const RequireAuth: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, fallback, redirectTo }) => {
  return (
    <AuthGuard
      requireAuth={true}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </AuthGuard>
  );
};

/**
 * 需要未认证的路由守卫（如登录、注册页面）
 */
export const RequireGuest: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, fallback, redirectTo }) => {
  return (
    <AuthGuard
      requireAuth={false}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </AuthGuard>
  );
};

/**
 * 高阶组件：为组件添加认证保护
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    redirectTo?: string;
  }
) => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    return (
      <RequireAuth
        fallback={options?.fallback}
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </RequireAuth>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

/**
 * 高阶组件：为组件添加访客保护（已登录用户不能访问）
 */
export const withGuest = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    redirectTo?: string;
  }
) => {
  const GuestComponent: React.FC<P> = (props) => {
    return (
      <RequireGuest
        fallback={options?.fallback}
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </RequireGuest>
    );
  };

  GuestComponent.displayName = `withGuest(${Component.displayName || Component.name})`;
  
  return GuestComponent;
};

/**
 * Hook：获取认证状态（使用authStore）
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setError(null);
      await checkAuthStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '认证检查失败');
    }
  };

  useEffect(() => {
    const handleAuthChange = () => {
      refetch();
    };

    window.addEventListener('auth:token-changed', handleAuthChange);
    window.addEventListener('auth:login-expired', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth:token-changed', handleAuthChange);
      window.removeEventListener('auth:login-expired', handleAuthChange);
    };
  }, []);

  return {
    isLoading,
    isAuthenticated,
    error,
    refetch,
  };
};

export default AuthGuard;