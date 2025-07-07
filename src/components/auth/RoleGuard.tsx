import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { rbacService } from '../../services/auth/rbac';
import { Permission, Role } from '../../types/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
  requiredPermissions?: Permission[];
  requireAll?: boolean; // 是否需要满足所有角色/权限
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * 角色权限守卫组件
 * 用于保护需要特定角色或权限的组件
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback,
  redirectTo = '/auth/login'
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // 如果未认证，重定向到登录页
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 检查角色权限
  const hasRequiredAccess = () => {
    // 如果没有要求任何角色和权限，直接通过
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    let hasRoles = true;
    let hasPermissions = true;

    // 检查角色
    if (requiredRoles.length > 0) {
      if (requireAll) {
        hasRoles = requiredRoles.every(role => rbacService.hasRole(role));
      } else {
        hasRoles = requiredRoles.some(role => rbacService.hasRole(role));
      }
    }

    // 检查权限
    if (requiredPermissions.length > 0) {
      if (requireAll) {
        hasPermissions = requiredPermissions.every(permission => rbacService.hasPermission(permission));
      } else {
        hasPermissions = requiredPermissions.some(permission => rbacService.hasPermission(permission));
      }
    }

    // 如果同时指定了角色和权限
    if (requiredRoles.length > 0 && requiredPermissions.length > 0) {
      return requireAll ? (hasRoles && hasPermissions) : (hasRoles || hasPermissions);
    }

    return hasRoles && hasPermissions;
  };

  // 如果没有权限
  if (!hasRequiredAccess()) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
          <p className="text-gray-600 mb-4">您没有权限访问此页面</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * 需要管理员权限的组件包装器
 */
export const RequireAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // 如果未认证，重定向到登录页
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // 检查用户是否有管理员角色
  const isAdmin = user.roles?.some(role => role.code === 'admin') || false;

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
       <div className="flex items-center justify-center min-h-screen bg-gray-50">
         <div className="text-center">
           <div className="text-6xl text-gray-400 mb-4">🔍</div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">神秘的登录入口</h1>
           <p className="text-gray-600 mb-4">你发现了神秘的登录入口，但这里什么也没有</p>
           <button
             onClick={() => window.history.back()}
             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
           >
             返回上一页
           </button>
         </div>
       </div>
     );
  }

  return <>{children}</>;
};

/**
 * 需要编辑权限的组件包装器
 */
export const RequireEditor: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  return (
    <RoleGuard
      requiredRoles={['editor', 'admin', 'super_admin']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * 需要作者权限的组件包装器
 */
export const RequireAuthor: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  return (
    <RoleGuard
      requiredRoles={['author', 'editor', 'admin', 'super_admin']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * 需要特定权限的组件包装器
 */
export const RequirePermission: React.FC<{
  children: React.ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}> = ({ children, permissions, requireAll = false, fallback }) => {
  return (
    <RoleGuard
      requiredPermissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * 角色权限高阶组件
 */
export const withRoleGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRoles?: Role[];
    requiredPermissions?: Permission[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    redirectTo?: string;
  } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <RoleGuard {...options}>
        <Component {...props} />
      </RoleGuard>
    );
  };

  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * 使用角色权限的Hook
 */
export const useRoleGuard = () => {
  const { isAuthenticated, user } = useAuthStore();

  const hasRole = (role: Role): boolean => {
    if (!isAuthenticated || !user) return false;
    return rbacService.hasRole(role);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!isAuthenticated || !user) return false;
    return rbacService.hasPermission(permission);
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.some(role => rbacService.hasRole(role));
  };

  const hasAllRoles = (roles: Role[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.every(role => rbacService.hasRole(role));
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return permissions.some(permission => rbacService.hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return permissions.every(permission => rbacService.hasPermission(permission));
  };

  const isAdmin = (): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.roles?.some(role => role.code === 'admin') || false;
  };

  const isEditor = (): boolean => {
    return hasAnyRole(['editor', 'admin', 'super_admin']);
  };

  const isAuthor = (): boolean => {
    return hasAnyRole(['author', 'editor', 'admin', 'super_admin']);
  };

  const canManageBlogs = (): boolean => {
    return hasAnyPermission(['blog:write', 'blog:manage']);
  };

  const canManageUsers = (): boolean => {
    return hasPermission('user:manage');
  };

  const canManageSystem = (): boolean => {
    return hasPermission('system:manage');
  };

  return {
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isEditor,
    isAuthor,
    canManageBlogs,
    canManageUsers,
    canManageSystem,
    user,
    isAuthenticated
  };
};

export default RoleGuard;