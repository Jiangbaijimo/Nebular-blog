import { useCallback } from 'react';
import { userAPI } from '../services/api';
import { useApi, usePaginatedApi, useSubmit, useBatchOperation } from './useApi';
import type {
  User,
  UserListParams,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  UserStatus,
  UserProfile,
  UpdateUserProfileRequest
} from '../types/user';

/**
 * 用户列表Hook
 * @param initialParams 初始查询参数
 * @returns 用户列表状态和操作方法
 */
export function useUserList(initialParams: UserListParams = { page: 1, limit: 10 }) {
  return usePaginatedApi(
    (params: UserListParams) => userAPI.getUsers(params),
    initialParams,
    {
      immediate: true,
      onError: (error) => {
        console.error('获取用户列表失败:', error);
      }
    }
  );
}

/**
 * 用户详情Hook
 * @param id 用户ID
 * @returns 用户详情状态和操作方法
 */
export function useUserDetail(id: string | null) {
  return useApi(
    useCallback(() => {
      if (!id) throw new Error('用户ID不能为空');
      return userAPI.getUser(id);
    }, [id]),
    {
      immediate: !!id,
      onError: (error) => {
        console.error('获取用户详情失败:', error);
      }
    }
  );
}

/**
 * 创建用户Hook
 * @returns 创建用户状态和操作方法
 */
export function useCreateUser() {
  return useSubmit(
    (data: CreateUserRequest) => userAPI.createUser(data),
    {
      onSuccess: (user) => {
        console.log('用户创建成功:', user);
      },
      onError: (error) => {
        console.error('创建用户失败:', error);
      }
    }
  );
}

/**
 * 更新用户Hook
 * @returns 更新用户状态和操作方法
 */
export function useUpdateUser() {
  return useSubmit(
    ({ id, data }: { id: string; data: UpdateUserRequest }) => 
      userAPI.updateUser(id, data),
    {
      onSuccess: (user) => {
        console.log('用户更新成功:', user);
      },
      onError: (error) => {
        console.error('更新用户失败:', error);
      }
    }
  );
}

/**
 * 删除用户Hook
 * @returns 删除用户状态和操作方法
 */
export function useDeleteUser() {
  return useSubmit(
    (id: string) => userAPI.deleteUser(id),
    {
      onSuccess: () => {
        console.log('用户删除成功');
      },
      onError: (error) => {
        console.error('删除用户失败:', error);
      }
    }
  );
}

/**
 * 批量删除用户Hook
 * @returns 批量删除状态和操作方法
 */
export function useBatchDeleteUsers() {
  return useBatchOperation(
    (ids: string[]) => userAPI.batchDeleteUsers(ids),
    {
      onSuccess: (result) => {
        console.log('批量删除用户成功:', result);
      },
      onError: (error) => {
        console.error('批量删除用户失败:', error);
      }
    }
  );
}

/**
 * 更新用户状态Hook
 * @returns 更新状态和操作方法
 */
export function useUpdateUserStatus() {
  return useSubmit(
    ({ id, status }: { id: string; status: UserStatus }) => 
      userAPI.updateUser(id, { status }),
    {
      onSuccess: (user) => {
        console.log(`用户状态更新为${user.status}成功`);
      },
      onError: (error) => {
        console.error('更新用户状态失败:', error);
      }
    }
  );
}

/**
 * 批量更新用户状态Hook
 * @returns 批量更新状态和操作方法
 */
export function useBatchUpdateUserStatus() {
  return useBatchOperation(
    ({ ids, status }: { ids: string[]; status: UserStatus }) => 
      userAPI.batchUpdateUserStatus(ids, status),
    {
      onSuccess: (result) => {
        console.log('批量更新用户状态成功:', result);
      },
      onError: (error) => {
        console.error('批量更新用户状态失败:', error);
      }
    }
  );
}

/**
 * 更新用户角色Hook
 * @returns 更新角色状态和操作方法
 */
export function useUpdateUserRole() {
  return useSubmit(
    ({ id, role }: { id: string; role: UserRole }) => 
      userAPI.updateUser(id, { role }),
    {
      onSuccess: (user) => {
        console.log(`用户角色更新为${user.role}成功`);
      },
      onError: (error) => {
        console.error('更新用户角色失败:', error);
      }
    }
  );
}

/**
 * 重置用户密码Hook
 * @returns 重置密码状态和操作方法
 */
export function useResetUserPassword() {
  return useSubmit(
    ({ id, newPassword }: { id: string; newPassword: string }) => 
      userAPI.resetUserPassword(id, newPassword),
    {
      onSuccess: () => {
        console.log('用户密码重置成功');
      },
      onError: (error) => {
        console.error('重置用户密码失败:', error);
      }
    }
  );
}

/**
 * 用户资料Hook
 * @param id 用户ID
 * @returns 用户资料状态和操作方法
 */
export function useUserProfile(id: string | null) {
  return useApi(
    useCallback(() => {
      if (!id) throw new Error('用户ID不能为空');
      return userAPI.getUserProfile(id);
    }, [id]),
    {
      immediate: !!id,
      onError: (error) => {
        console.error('获取用户资料失败:', error);
      }
    }
  );
}

/**
 * 更新用户资料Hook
 * @returns 更新资料状态和操作方法
 */
export function useUpdateUserProfile() {
  return useSubmit(
    ({ id, data }: { id: string; data: UpdateUserProfileRequest }) => 
      userAPI.updateUserProfile(id, data),
    {
      onSuccess: (profile) => {
        console.log('用户资料更新成功:', profile);
      },
      onError: (error) => {
        console.error('更新用户资料失败:', error);
      }
    }
  );
}

/**
 * 用户统计Hook
 * @returns 用户统计数据
 */
export function useUserStats() {
  return useApi(
    () => userAPI.getUserStats(),
    {
      immediate: true,
      // refreshInterval: 60000, // 暂时禁用自动刷新，避免频繁API调用
      onError: (error) => {
        console.error('获取用户统计失败:', error);
      }
    }
  );
}

/**
 * 用户搜索Hook
 * @param query 搜索关键词
 * @param params 搜索参数
 * @returns 搜索结果状态和操作方法
 */
export function useUserSearch(
  query: string,
  params: Omit<UserListParams, 'search'> = { page: 1, limit: 10 }
) {
  return usePaginatedApi(
    useCallback((searchParams: UserListParams) => 
      userAPI.getUsers({ ...searchParams, search: query }),
    [query]),
    { ...params, search: query },
    {
      immediate: !!query,
      onError: (error) => {
        console.error('搜索用户失败:', error);
      }
    }
  );
}

/**
 * 用户活动日志Hook
 * @param userId 用户ID
 * @param params 查询参数
 * @returns 活动日志状态和操作方法
 */
export function useUserActivityLogs(
  userId: string | null,
  params: { page: number; limit: number } = { page: 1, limit: 10 }
) {
  return usePaginatedApi(
    useCallback((logParams: typeof params) => {
      if (!userId) throw new Error('用户ID不能为空');
      return userAPI.getUserActivityLogs(userId, logParams);
    }, [userId]),
    params,
    {
      immediate: !!userId,
      onError: (error) => {
        console.error('获取用户活动日志失败:', error);
      }
    }
  );
}

/**
 * 用户权限Hook
 * @param userId 用户ID
 * @returns 用户权限状态和操作方法
 */
export function useUserPermissions(userId: string | null) {
  return useApi(
    useCallback(() => {
      if (!userId) throw new Error('用户ID不能为空');
      return userAPI.getUserPermissions(userId);
    }, [userId]),
    {
      immediate: !!userId,
      onError: (error) => {
        console.error('获取用户权限失败:', error);
      }
    }
  );
}

/**
 * 更新用户权限Hook
 * @returns 更新权限状态和操作方法
 */
export function useUpdateUserPermissions() {
  return useSubmit(
    ({ userId, permissions }: { userId: string; permissions: string[] }) => 
      userAPI.updateUserPermissions(userId, permissions),
    {
      onSuccess: () => {
        console.log('用户权限更新成功');
      },
      onError: (error) => {
        console.error('更新用户权限失败:', error);
      }
    }
  );
}

/**
 * 导出用户数据Hook
 * @returns 导出状态和操作方法
 */
export function useExportUsers() {
  return useSubmit(
    (params: UserListParams) => userAPI.exportUsers(params),
    {
      onSuccess: (blob) => {
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('用户数据导出成功');
      },
      onError: (error) => {
        console.error('导出用户数据失败:', error);
      }
    }
  );
}

/**
 * 导入用户数据Hook
 * @returns 导入状态和操作方法
 */
export function useImportUsers() {
  return useSubmit(
    (file: File) => userAPI.importUsers(file),
    {
      onSuccess: (result) => {
        console.log('用户数据导入成功:', result);
      },
      onError: (error) => {
        console.error('导入用户数据失败:', error);
      }
    }
  );
}