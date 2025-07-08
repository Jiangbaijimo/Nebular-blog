import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiResponse } from '../types/api';

// 防抖函数
function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]) as T;
}

// API状态接口
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// API操作选项
export interface ApiOptions {
  immediate?: boolean; // 是否立即执行
  refreshInterval?: number; // 自动刷新间隔（毫秒）
  retryCount?: number; // 重试次数
  retryDelay?: number; // 重试延迟（毫秒）
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页结果
export interface PaginationResult<T> {
  data: T[]; // 改为data字段以匹配BlogListResponse
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  // 兼容性字段
  items?: T[];
}

/**
 * 通用API数据获取Hook
 * @param apiFunction API函数
 * @param options 配置选项
 * @returns API状态和操作方法
 */
export function useApi<T, P = any>(
  apiFunction: (params?: P) => Promise<T>,
  options: ApiOptions = {}
) {
  const {
    immediate = false,
    refreshInterval,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // 执行API请求
  const execute = useCallback(async (params?: P, options?: { silent?: boolean }) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!options?.silent) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const result = await apiFunction(params);
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      retryCountRef.current = 0;
      onSuccess?.(result);
      
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '请求失败';
      
      // 如果还有重试次数，则重试
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        retryTimeoutRef.current = setTimeout(() => {
          execute(params, options);
        }, retryDelay);
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
      throw error;
    }
  }, [apiFunction, retryCount, retryDelay, onSuccess, onError]);

  // 刷新数据
  const refresh = useCallback((params?: P) => {
    return execute(params, { silent: false });
  }, [execute]);

  // 静默刷新（不显示loading状态）
  const silentRefresh = useCallback((params?: P) => {
    return execute(params, { silent: true });
  }, [execute]);

  // 重置状态
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
    retryCountRef.current = 0;
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
  }, []);

  // 设置自动刷新
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        silentRefresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, silentRefresh]);

  // 立即执行
  useEffect(() => {
    if (immediate) {
      execute();
    }

    return cleanup;
  }, [immediate, execute, cleanup]);

  return {
    ...state,
    execute,
    refresh,
    silentRefresh,
    reset,
    cleanup
  };
}

/**
 * 分页数据获取Hook
 * @param apiFunction 分页API函数
 * @param initialParams 初始参数
 * @param options 配置选项
 * @returns 分页状态和操作方法
 */
export function usePaginatedApi<T, P extends PaginationParams = PaginationParams>(
  apiFunction: (params: P) => Promise<PaginationResult<T>>,
  initialParams: P,
  options: ApiOptions & { debounceDelay?: number } = {}
) {
  const { debounceDelay = 300, ...apiOptions } = options;
  const [params, setParams] = useState<P>(initialParams);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const api = useApi(
    useCallback((p: P) => apiFunction(p || params), [apiFunction, params]),
    { ...apiOptions, immediate: false }
  );

  // 防抖的API执行函数
  const debouncedExecute = useDebounce((newParams: P) => {
    setIsUpdating(false);
    api.execute(newParams);
  }, debounceDelay);

  // 更新参数并重新获取数据
  const updateParams = useCallback((newParams: Partial<P>) => {
    const updatedParams = { ...params, ...newParams } as P;
    setParams(updatedParams);
    setIsUpdating(true);
    debouncedExecute(updatedParams);
  }, [params, debouncedExecute]);

  // 初始加载
  useEffect(() => {
    if (apiOptions.immediate !== false) {
      api.execute(params);
    }
  }, []);

  // 跳转到指定页
  const goToPage = useCallback((page: number) => {
    return updateParams({ page } as Partial<P>);
  }, [updateParams]);

  // 改变每页数量
  const changePageSize = useCallback((limit: number) => {
    return updateParams({ page: 1, limit } as Partial<P>);
  }, [updateParams]);

  // 排序
  const sort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    return updateParams({ sortBy, sortOrder } as Partial<P>);
  }, [updateParams]);

  // 搜索
  const search = useCallback((searchParams: Partial<P>) => {
    return updateParams({ ...searchParams, page: 1 } as Partial<P>);
  }, [updateParams]);

  return {
    ...api,
    loading: api.loading || isUpdating,
    params,
    updateParams,
    goToPage,
    changePageSize,
    sort,
    search,
    // 添加分页信息
    pagination: api.data ? {
      page: api.data.page,
      limit: api.data.limit,
      total: api.data.total,
      totalPages: api.data.totalPages
    } : null
  };
}

/**
 * 表单提交Hook
 * @param submitFunction 提交函数
 * @param options 配置选项
 * @returns 提交状态和操作方法
 */
export function useSubmit<T, P = any>(
  submitFunction: (data: P) => Promise<T>,
  options: ApiOptions = {}
) {
  const { onSuccess, onError } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const submit = useCallback(async (data: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await submitFunction(data);
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      onSuccess?.(result);
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '提交失败';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
      throw error;
    }
  }, [submitFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
  }, []);

  return {
    ...state,
    submit,
    reset
  };
}

/**
 * 批量操作Hook
 * @param batchFunction 批量操作函数
 * @param options 配置选项
 * @returns 批量操作状态和方法
 */
export function useBatchOperation<T, P = any>(
  batchFunction: (items: P[]) => Promise<T>,
  options: ApiOptions = {}
) {
  const { onSuccess, onError } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [progress, setProgress] = useState(0);

  const execute = useCallback(async (items: P[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setProgress(0);

    try {
      const result = await batchFunction(items);
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      
      setProgress(100);
      onSuccess?.(result);
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '批量操作失败';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      setProgress(0);
      onError?.(errorMessage);
      throw error;
    }
  }, [batchFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
    setProgress(0);
  }, []);

  return {
    ...state,
    progress,
    execute,
    reset
  };
}