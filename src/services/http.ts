// HTTP客户端配置
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_ENDPOINTS, HTTP_STATUS, REQUEST_TIMEOUT, RETRY_CONFIG } from '../constants/api';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import { APP_CONFIG } from '../constants/app';
import type { AuthTokens } from '../types/auth';

// 请求配置接口
interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipRetry?: boolean;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
}

// 响应数据接口
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 错误响应接口
interface ApiError {
  code: number;
  message: string;
  details?: any;
}

// Token管理
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRES_KEY = 'token_expires';

  static getAccessToken(): string | null {
    return getStorageItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string, expiresIn: number): void {
    setStorageItem(this.ACCESS_TOKEN_KEY, token);
    const expiresAt = Date.now() + expiresIn * 1000;
    setStorageItem(this.TOKEN_EXPIRES_KEY, expiresAt.toString());
  }

  static getRefreshToken(): string | null {
    return getStorageItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    setStorageItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    removeStorageItem(this.ACCESS_TOKEN_KEY);
    removeStorageItem(this.REFRESH_TOKEN_KEY);
    removeStorageItem(this.TOKEN_EXPIRES_KEY);
  }

  static isTokenExpired(): boolean {
    const expiresAt = getStorageItem(this.TOKEN_EXPIRES_KEY);
    if (!expiresAt) return true;
    return Date.now() > parseInt(expiresAt);
  }

  static shouldRefreshToken(): boolean {
    const expiresAt = getStorageItem(this.TOKEN_EXPIRES_KEY);
    if (!expiresAt) return false;
    // 提前5分钟刷新token
    return Date.now() > (parseInt(expiresAt) - 5 * 60 * 1000);
  }
}

// HTTP客户端类
class HttpClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: '',
      timeout: REQUEST_TIMEOUT.DEFAULT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加认证token
        if (!config.skipAuth) {
          const token = TokenManager.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] = this.generateRequestId();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 统一处理响应数据
        if (response.data.code === HTTP_STATUS.SUCCESS) {
          return response.data.data;
        } else {
          return Promise.reject(new Error(response.data.message));
        }
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as RequestConfig;

        // 处理401未授权错误
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest.skipAuth) {
          return this.handleUnauthorized(originalRequest);
        }

        // 处理网络错误重试
        if (this.shouldRetry(error) && !originalRequest.skipRetry) {
          return this.retryRequest(originalRequest);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async handleUnauthorized(originalRequest: RequestConfig): Promise<any> {
    if (this.isRefreshing) {
      // 如果正在刷新token，将请求加入队列
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // 刷新token
      const response = await this.instance.post(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN,
        { refreshToken },
        { skipAuth: true, skipRetry: true }
      );

      const { accessToken, expiresIn } = response.data;
      TokenManager.setAccessToken(accessToken, expiresIn);

      // 处理队列中的请求
      this.failedQueue.forEach(({ resolve }) => {
        resolve(this.instance(originalRequest));
      });
      this.failedQueue = [];

      // 重新发送原始请求
      return this.instance(originalRequest);
    } catch (refreshError) {
      // 刷新token失败，清除所有token并跳转到登录页
      TokenManager.clearTokens();
      this.failedQueue.forEach(({ reject }) => {
        reject(refreshError);
      });
      this.failedQueue = [];

      // 触发登录事件
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    // 网络错误或5xx服务器错误才重试
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  }

  private async retryRequest(config: RequestConfig): Promise<any> {
    const retryCount = config.retryCount || 0;
    
    if (retryCount >= RETRY_CONFIG.MAX_RETRIES) {
      return Promise.reject(new Error('Max retry attempts reached'));
    }

    // 指数退避延迟
    const delay = RETRY_CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    config.retryCount = retryCount + 1;
    return this.instance(config);
  }

  private formatError(error: AxiosError): ApiError {
    if (error.response?.data) {
      const data = error.response.data as any;
      return {
        code: data.code || error.response.status,
        message: data.message || error.message,
        details: data.details,
      };
    }

    return {
      code: 0,
      message: error.message || 'Network error',
    };
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // GET请求
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  // POST请求
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }

  // PUT请求
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config);
  }

  // DELETE请求
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  // PATCH请求
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.patch(url, data, config);
  }

  // 文件上传
  async upload<T = any>(
    url: string,
    file: File,
    options?: {
      onProgress?: (progress: number) => void;
      chunkSize?: number;
      concurrent?: boolean;
    }
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: REQUEST_TIMEOUT.UPLOAD,
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    });
  }

  // 批量上传
  async uploadMultiple<T = any>(
    url: string,
    files: File[],
    options?: {
      onProgress?: (fileIndex: number, progress: number) => void;
      onComplete?: (fileIndex: number, result: T) => void;
      onError?: (fileIndex: number, error: Error) => void;
      maxConcurrent?: number;
    }
  ): Promise<T[]> {
    const maxConcurrent = options?.maxConcurrent || 3;
    const results: T[] = [];
    const errors: Error[] = [];

    // 分批处理文件上传
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex;
        try {
          const result = await this.upload<T>(url, file, {
            onProgress: (progress) => options?.onProgress?.(fileIndex, progress),
          });
          results[fileIndex] = result;
          options?.onComplete?.(fileIndex, result);
          return result;
        } catch (error) {
          errors[fileIndex] = error as Error;
          options?.onError?.(fileIndex, error as Error);
          throw error;
        }
      });

      await Promise.allSettled(batchPromises);
    }

    if (errors.length > 0) {
      throw new Error(`${errors.length} files failed to upload`);
    }

    return results;
  }

  // 下载文件
  async download(
    url: string,
    filename?: string,
    options?: {
      onProgress?: (progress: number) => void;
    }
  ): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
      timeout: REQUEST_TIMEOUT.DOWNLOAD,
      onDownloadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // 设置认证令牌
  setAuthTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      // 处理过期时间，支持字符串和数字格式
      let expiresAtMs: number;
      if (typeof tokens.expiresAt === 'string') {
        expiresAtMs = new Date(tokens.expiresAt).getTime();
      } else {
        expiresAtMs = tokens.expiresAt * 1000; // 假设数字是秒，转换为毫秒
      }
      
      // 计算剩余过期时间（秒）
      const expiresIn = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      TokenManager.setAccessToken(tokens.accessToken, expiresIn);
    }
    
    if (tokens.refreshToken) {
      TokenManager.setRefreshToken(tokens.refreshToken);
    }
  }

  // 清除认证令牌
  clearAuthTokens(): void {
    TokenManager.clearTokens();
  }

  // 获取当前访问令牌
  getAccessToken(): string | null {
    return TokenManager.getAccessToken();
  }

  // 获取原始axios实例
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// 创建HTTP客户端实例
const httpClient = new HttpClient();

// 导出HTTP客户端和Token管理器
export { httpClient, TokenManager };
export type { RequestConfig, ApiResponse, ApiError };
export default httpClient;