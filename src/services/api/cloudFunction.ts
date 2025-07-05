// 云函数API服务
import httpClient from '../http';
import { API_ENDPOINTS } from '../../constants/api';
import type {
  CloudFunction,
  CloudFunctionCreateRequest,
  CloudFunctionUpdateRequest,
  CloudFunctionExecuteRequest,
  CloudFunctionExecuteResponse,
  CloudFunctionListParams,
  CloudFunctionListResponse,
  CloudFunctionLog,
  CloudFunctionVersion,
  CloudFunctionStats,
  CloudFunctionTemplate,
  CloudFunctionDeployment,
  CloudFunctionEnvironment,
  CloudFunctionTrigger,
  CloudFunctionSchedule,
} from '../../types/cloudFunction';
import type { PaginationParams, PaginationResult } from '../../types/common';

/**
 * 云函数API服务类
 */
class CloudFunctionAPI {
  // ==================== 云函数管理 ====================

  /**
   * 获取云函数列表
   */
  async getCloudFunctions(params?: CloudFunctionListParams): Promise<CloudFunctionListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.CLOUD_FUNCTION.LIST}?${queryParams.toString()}`
      : API_ENDPOINTS.CLOUD_FUNCTION.LIST;

    return httpClient.get<CloudFunctionListResponse>(url);
  }

  /**
   * 获取云函数详情
   */
  async getCloudFunction(id: string): Promise<CloudFunction> {
    return httpClient.get<CloudFunction>(`${API_ENDPOINTS.CLOUD_FUNCTION.DETAIL}/${id}`);
  }

  /**
   * 创建云函数
   */
  async createCloudFunction(data: CloudFunctionCreateRequest): Promise<CloudFunction> {
    return httpClient.post<CloudFunction>(API_ENDPOINTS.CLOUD_FUNCTION.CREATE, data);
  }

  /**
   * 更新云函数
   */
  async updateCloudFunction(
    id: string,
    data: CloudFunctionUpdateRequest
  ): Promise<CloudFunction> {
    return httpClient.put<CloudFunction>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.UPDATE}/${id}`,
      data
    );
  }

  /**
   * 删除云函数
   */
  async deleteCloudFunction(id: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.CLOUD_FUNCTION.DELETE}/${id}`);
  }

  /**
   * 批量删除云函数
   */
  async deleteMultipleCloudFunctions(ids: string[]): Promise<void> {
    return httpClient.post(API_ENDPOINTS.CLOUD_FUNCTION.BULK_DELETE, { ids });
  }

  // ==================== 云函数执行 ====================

  /**
   * 执行云函数
   */
  async executeCloudFunction(
    id: string,
    request: CloudFunctionExecuteRequest
  ): Promise<CloudFunctionExecuteResponse> {
    return httpClient.post<CloudFunctionExecuteResponse>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.EXECUTE}/${id}`,
      request
    );
  }

  /**
   * 根据名称执行云函数
   */
  async executeCloudFunctionByName(
    name: string,
    request: CloudFunctionExecuteRequest
  ): Promise<CloudFunctionExecuteResponse> {
    return httpClient.post<CloudFunctionExecuteResponse>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.EXECUTE_BY_NAME}/${name}`,
      request
    );
  }

  /**
   * 异步执行云函数
   */
  async executeCloudFunctionAsync(
    id: string,
    request: CloudFunctionExecuteRequest
  ): Promise<{ executionId: string }> {
    return httpClient.post<{ executionId: string }>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.EXECUTE_ASYNC}/${id}`,
      request
    );
  }

  /**
   * 获取异步执行结果
   */
  async getExecutionResult(executionId: string): Promise<CloudFunctionExecuteResponse> {
    return httpClient.get<CloudFunctionExecuteResponse>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.EXECUTION_RESULT}/${executionId}`
    );
  }

  /**
   * 取消异步执行
   */
  async cancelExecution(executionId: string): Promise<void> {
    return httpClient.post(`${API_ENDPOINTS.CLOUD_FUNCTION.CANCEL_EXECUTION}/${executionId}`);
  }

  // ==================== 云函数部署 ====================

  /**
   * 部署云函数
   */
  async deployCloudFunction(
    id: string,
    options?: {
      version?: string;
      environment?: string;
      config?: Record<string, any>;
    }
  ): Promise<CloudFunctionDeployment> {
    return httpClient.post<CloudFunctionDeployment>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.DEPLOY}/${id}`,
      options
    );
  }

  /**
   * 获取部署状态
   */
  async getDeploymentStatus(deploymentId: string): Promise<CloudFunctionDeployment> {
    return httpClient.get<CloudFunctionDeployment>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.DEPLOYMENT_STATUS}/${deploymentId}`
    );
  }

  /**
   * 回滚部署
   */
  async rollbackDeployment(
    id: string,
    targetVersion: string
  ): Promise<CloudFunctionDeployment> {
    return httpClient.post<CloudFunctionDeployment>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.ROLLBACK}/${id}`,
      { targetVersion }
    );
  }

  /**
   * 获取部署历史
   */
  async getDeploymentHistory(
    id: string,
    params?: PaginationParams
  ): Promise<PaginationResult<CloudFunctionDeployment>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.CLOUD_FUNCTION.DEPLOYMENT_HISTORY}/${id}?${queryParams.toString()}`
      : `${API_ENDPOINTS.CLOUD_FUNCTION.DEPLOYMENT_HISTORY}/${id}`;

    return httpClient.get<PaginationResult<CloudFunctionDeployment>>(url);
  }

  // ==================== 云函数版本管理 ====================

  /**
   * 获取云函数版本列表
   */
  async getCloudFunctionVersions(
    id: string,
    params?: PaginationParams
  ): Promise<PaginationResult<CloudFunctionVersion>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.CLOUD_FUNCTION.VERSIONS}/${id}?${queryParams.toString()}`
      : `${API_ENDPOINTS.CLOUD_FUNCTION.VERSIONS}/${id}`;

    return httpClient.get<PaginationResult<CloudFunctionVersion>>(url);
  }

  /**
   * 获取指定版本详情
   */
  async getCloudFunctionVersion(id: string, version: string): Promise<CloudFunctionVersion> {
    return httpClient.get<CloudFunctionVersion>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.VERSIONS}/${id}/${version}`
    );
  }

  /**
   * 创建新版本
   */
  async createCloudFunctionVersion(
    id: string,
    data: {
      version: string;
      description?: string;
      code: string;
      config?: Record<string, any>;
    }
  ): Promise<CloudFunctionVersion> {
    return httpClient.post<CloudFunctionVersion>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.VERSIONS}/${id}`,
      data
    );
  }

  /**
   * 删除版本
   */
  async deleteCloudFunctionVersion(id: string, version: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.CLOUD_FUNCTION.VERSIONS}/${id}/${version}`);
  }

  /**
   * 设置活跃版本
   */
  async setActiveVersion(id: string, version: string): Promise<CloudFunction> {
    return httpClient.post<CloudFunction>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.SET_ACTIVE_VERSION}/${id}`,
      { version }
    );
  }

  // ==================== 云函数日志 ====================

  /**
   * 获取云函数日志
   */
  async getCloudFunctionLogs(
    id: string,
    params?: {
      startTime?: string;
      endTime?: string;
      level?: 'debug' | 'info' | 'warn' | 'error';
      limit?: number;
      offset?: number;
    }
  ): Promise<PaginationResult<CloudFunctionLog>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.CLOUD_FUNCTION.LOGS}/${id}?${queryParams.toString()}`
      : `${API_ENDPOINTS.CLOUD_FUNCTION.LOGS}/${id}`;

    return httpClient.get<PaginationResult<CloudFunctionLog>>(url);
  }

  /**
   * 实时日志流
   */
  async streamCloudFunctionLogs(
    id: string,
    onLog: (log: CloudFunctionLog) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    // 使用WebSocket或Server-Sent Events实现实时日志流
    const eventSource = new EventSource(
      `${API_ENDPOINTS.CLOUD_FUNCTION.LOG_STREAM}/${id}`,
      {
        withCredentials: true,
      }
    );

    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data) as CloudFunctionLog;
        onLog(log);
      } catch (error) {
        onError?.(error as Error);
      }
    };

    eventSource.onerror = (event) => {
      onError?.(new Error('Log stream connection error'));
    };

    // 返回关闭连接的函数
    return () => {
      eventSource.close();
    };
  }

  // ==================== 云函数统计 ====================

  /**
   * 获取云函数统计信息
   */
  async getCloudFunctionStats(
    id: string,
    params?: {
      startTime?: string;
      endTime?: string;
      granularity?: 'hour' | 'day' | 'week' | 'month';
    }
  ): Promise<CloudFunctionStats> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.CLOUD_FUNCTION.STATS}/${id}?${queryParams.toString()}`
      : `${API_ENDPOINTS.CLOUD_FUNCTION.STATS}/${id}`;

    return httpClient.get<CloudFunctionStats>(url);
  }

  /**
   * 获取全局统计信息
   */
  async getGlobalStats(params?: {
    startTime?: string;
    endTime?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<{
    totalFunctions: number;
    totalExecutions: number;
    totalErrors: number;
    averageExecutionTime: number;
    executionsByStatus: Record<string, number>;
    executionsByFunction: Array<{
      functionId: string;
      functionName: string;
      executions: number;
      errors: number;
      averageTime: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.CLOUD_FUNCTION.GLOBAL_STATS}?${queryParams.toString()}`
      : API_ENDPOINTS.CLOUD_FUNCTION.GLOBAL_STATS;

    return httpClient.get(url);
  }

  // ==================== 云函数模板 ====================

  /**
   * 获取云函数模板列表
   */
  async getCloudFunctionTemplates(): Promise<CloudFunctionTemplate[]> {
    return httpClient.get<CloudFunctionTemplate[]>(
      API_ENDPOINTS.CLOUD_FUNCTION.TEMPLATES,
      { skipAuth: true }
    );
  }

  /**
   * 获取模板详情
   */
  async getCloudFunctionTemplate(templateId: string): Promise<CloudFunctionTemplate> {
    return httpClient.get<CloudFunctionTemplate>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.TEMPLATES}/${templateId}`,
      { skipAuth: true }
    );
  }

  /**
   * 从模板创建云函数
   */
  async createFromTemplate(
    templateId: string,
    data: {
      name: string;
      description?: string;
      config?: Record<string, any>;
    }
  ): Promise<CloudFunction> {
    return httpClient.post<CloudFunction>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.CREATE_FROM_TEMPLATE}/${templateId}`,
      data
    );
  }

  // ==================== 云函数环境管理 ====================

  /**
   * 获取环境列表
   */
  async getEnvironments(): Promise<CloudFunctionEnvironment[]> {
    return httpClient.get<CloudFunctionEnvironment[]>(API_ENDPOINTS.CLOUD_FUNCTION.ENVIRONMENTS);
  }

  /**
   * 创建环境
   */
  async createEnvironment(data: {
    name: string;
    description?: string;
    variables: Record<string, string>;
  }): Promise<CloudFunctionEnvironment> {
    return httpClient.post<CloudFunctionEnvironment>(
      API_ENDPOINTS.CLOUD_FUNCTION.ENVIRONMENTS,
      data
    );
  }

  /**
   * 更新环境
   */
  async updateEnvironment(
    id: string,
    data: {
      name?: string;
      description?: string;
      variables?: Record<string, string>;
    }
  ): Promise<CloudFunctionEnvironment> {
    return httpClient.put<CloudFunctionEnvironment>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.ENVIRONMENTS}/${id}`,
      data
    );
  }

  /**
   * 删除环境
   */
  async deleteEnvironment(id: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.CLOUD_FUNCTION.ENVIRONMENTS}/${id}`);
  }

  // ==================== 云函数触发器管理 ====================

  /**
   * 获取触发器列表
   */
  async getTriggers(functionId: string): Promise<CloudFunctionTrigger[]> {
    return httpClient.get<CloudFunctionTrigger[]>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.TRIGGERS}/${functionId}`
    );
  }

  /**
   * 创建触发器
   */
  async createTrigger(
    functionId: string,
    data: {
      type: 'http' | 'schedule' | 'event';
      name: string;
      config: Record<string, any>;
      enabled?: boolean;
    }
  ): Promise<CloudFunctionTrigger> {
    return httpClient.post<CloudFunctionTrigger>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.TRIGGERS}/${functionId}`,
      data
    );
  }

  /**
   * 更新触发器
   */
  async updateTrigger(
    triggerId: string,
    data: {
      name?: string;
      config?: Record<string, any>;
      enabled?: boolean;
    }
  ): Promise<CloudFunctionTrigger> {
    return httpClient.put<CloudFunctionTrigger>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.TRIGGER_UPDATE}/${triggerId}`,
      data
    );
  }

  /**
   * 删除触发器
   */
  async deleteTrigger(triggerId: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.CLOUD_FUNCTION.TRIGGER_DELETE}/${triggerId}`);
  }

  /**
   * 启用/禁用触发器
   */
  async toggleTrigger(triggerId: string, enabled: boolean): Promise<CloudFunctionTrigger> {
    return httpClient.post<CloudFunctionTrigger>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.TRIGGER_TOGGLE}/${triggerId}`,
      { enabled }
    );
  }

  // ==================== 云函数调度管理 ====================

  /**
   * 获取调度任务列表
   */
  async getSchedules(): Promise<CloudFunctionSchedule[]> {
    return httpClient.get<CloudFunctionSchedule[]>(API_ENDPOINTS.CLOUD_FUNCTION.SCHEDULES);
  }

  /**
   * 创建调度任务
   */
  async createSchedule(data: {
    functionId: string;
    name: string;
    cron: string;
    timezone?: string;
    enabled?: boolean;
    payload?: Record<string, any>;
  }): Promise<CloudFunctionSchedule> {
    return httpClient.post<CloudFunctionSchedule>(API_ENDPOINTS.CLOUD_FUNCTION.SCHEDULES, data);
  }

  /**
   * 更新调度任务
   */
  async updateSchedule(
    id: string,
    data: {
      name?: string;
      cron?: string;
      timezone?: string;
      enabled?: boolean;
      payload?: Record<string, any>;
    }
  ): Promise<CloudFunctionSchedule> {
    return httpClient.put<CloudFunctionSchedule>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.SCHEDULES}/${id}`,
      data
    );
  }

  /**
   * 删除调度任务
   */
  async deleteSchedule(id: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.CLOUD_FUNCTION.SCHEDULES}/${id}`);
  }

  /**
   * 启用/禁用调度任务
   */
  async toggleSchedule(id: string, enabled: boolean): Promise<CloudFunctionSchedule> {
    return httpClient.post<CloudFunctionSchedule>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.SCHEDULE_TOGGLE}/${id}`,
      { enabled }
    );
  }

  /**
   * 手动触发调度任务
   */
  async triggerSchedule(id: string): Promise<{ executionId: string }> {
    return httpClient.post<{ executionId: string }>(
      `${API_ENDPOINTS.CLOUD_FUNCTION.SCHEDULE_TRIGGER}/${id}`
    );
  }
}

// 创建云函数API实例
const cloudFunctionAPI = new CloudFunctionAPI();

export { cloudFunctionAPI, CloudFunctionAPI };
export default cloudFunctionAPI;