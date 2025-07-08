import { useCallback } from 'react';
import { systemAPI } from '../services/api';
import { useApi, useSubmit } from './useApi';
import type {
  SystemConfig,
  SystemStats,
  SystemLog,
  SystemLogParams,
  BackupConfig,
  BackupRecord,
  SystemHealth,
  SystemNotification,
  EmailConfig,
  SecurityConfig,
  PerformanceConfig
} from '../types/system';

/**
 * 系统配置Hook
 * @returns 系统配置状态和操作方法
 */
export function useSystemConfig() {
  return useApi(
    () => systemAPI.getSystemConfig(),
    {
      immediate: true,
      onError: (error) => {
        console.error('获取系统配置失败:', error);
      }
    }
  );
}

/**
 * 更新系统配置Hook
 * @returns 更新配置状态和操作方法
 */
export function useUpdateSystemConfig() {
  return useSubmit(
    (config: Partial<SystemConfig>) => systemAPI.updateSystemConfig(config),
    {
      onSuccess: (config) => {
        console.log('系统配置更新成功:', config);
      },
      onError: (error) => {
        console.error('更新系统配置失败:', error);
      }
    }
  );
}

/**
 * 重置系统配置Hook
 * @returns 重置配置状态和操作方法
 */
export function useResetSystemConfig() {
  return useSubmit(
    () => systemAPI.resetSystemConfig(),
    {
      onSuccess: (config) => {
        console.log('系统配置重置成功:', config);
      },
      onError: (error) => {
        console.error('重置系统配置失败:', error);
      }
    }
  );
}

/**
 * 系统统计Hook
 * @returns 系统统计数据
 */
export function useSystemStats() {
  return useApi(
    () => systemAPI.getSystemStats(),
    {
      immediate: true,
      // refreshInterval: 30000, // 暂时禁用自动刷新，避免频繁API调用
      onError: (error) => {
        console.error('获取系统统计失败:', error);
      }
    }
  );
}

/**
 * 系统健康状态Hook
 * @returns 系统健康状态
 */
export function useSystemHealth() {
  return useApi(
    () => systemAPI.getSystemHealth(),
    {
      immediate: true,
      // refreshInterval: 10000, // 暂时禁用自动刷新，避免频繁API调用
      onError: (error) => {
        console.error('获取系统健康状态失败:', error);
      }
    }
  );
}

/**
 * 系统日志Hook
 * @param params 查询参数
 * @returns 系统日志状态和操作方法
 */
export function useSystemLogs(params: SystemLogParams = { page: 1, limit: 50 }) {
  return useApi(
    useCallback(() => systemAPI.getSystemLogs(params), [JSON.stringify(params)]),
    {
      immediate: true,
      onError: (error) => {
        console.error('获取系统日志失败:', error);
      }
    }
  );
}

/**
 * 清理系统日志Hook
 * @returns 清理日志状态和操作方法
 */
export function useClearSystemLogs() {
  return useSubmit(
    (beforeDate?: string) => systemAPI.clearSystemLogs(beforeDate),
    {
      onSuccess: () => {
        console.log('系统日志清理成功');
      },
      onError: (error) => {
        console.error('清理系统日志失败:', error);
      }
    }
  );
}

/**
 * 导出系统日志Hook
 * @returns 导出日志状态和操作方法
 */
export function useExportSystemLogs() {
  return useSubmit(
    (params: SystemLogParams) => systemAPI.exportSystemLogs(params),
    {
      onSuccess: (blob) => {
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `system_logs_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('系统日志导出成功');
      },
      onError: (error) => {
        console.error('导出系统日志失败:', error);
      }
    }
  );
}

/**
 * 备份配置Hook
 * @returns 备份配置状态和操作方法
 */
export function useBackupConfig() {
  return useApi(
    () => systemAPI.getBackupConfig(),
    {
      immediate: true,
      onError: (error) => {
        console.error('获取备份配置失败:', error);
      }
    }
  );
}

/**
 * 更新备份配置Hook
 * @returns 更新备份配置状态和操作方法
 */
export function useUpdateBackupConfig() {
  return useSubmit(
    (config: BackupConfig) => systemAPI.updateBackupConfig(config),
    {
      onSuccess: (config) => {
        console.log('备份配置更新成功:', config);
      },
      onError: (error) => {
        console.error('更新备份配置失败:', error);
      }
    }
  );
}

/**
 * 备份记录Hook
 * @returns 备份记录状态和操作方法
 */
export function useBackupRecords() {
  return useApi(
    () => systemAPI.getBackupRecords(),
    {
      immediate: true,
      onError: (error) => {
        console.error('获取备份记录失败:', error);
      }
    }
  );
}

/**
 * 创建备份Hook
 * @returns 创建备份状态和操作方法
 */
export function useCreateBackup() {
  return useSubmit(
    (description?: string) => systemAPI.createBackup(description),
    {
      onSuccess: (backup) => {
        console.log('备份创建成功:', backup);
      },
      onError: (error) => {
        console.error('创建备份失败:', error);
      }
    }
  );
}

/**
 * 恢复备份Hook
 * @returns 恢复备份状态和操作方法
 */
export function useRestoreBackup() {
  return useSubmit(
    (backupId: string) => systemAPI.restoreBackup(backupId),
    {
      onSuccess: () => {
        console.log('备份恢复成功');
      },
      onError: (error) => {
        console.error('恢复备份失败:', error);
      }
    }
  );
}

/**
 * 删除备份Hook
 * @returns 删除备份状态和操作方法
 */
export function useDeleteBackup() {
  return useSubmit(
    (backupId: string) => systemAPI.deleteBackup(backupId),
    {
      onSuccess: () => {
        console.log('备份删除成功');
      },
      onError: (error) => {
        console.error('删除备份失败:', error);
      }
    }
  );
}

/**
 * 下载备份Hook
 * @returns 下载备份状态和操作方法
 */
export function useDownloadBackup() {
  return useSubmit(
    (backupId: string) => systemAPI.downloadBackup(backupId),
    {
      onSuccess: (blob) => {
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_${backupId}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('备份下载成功');
      },
      onError: (error) => {
        console.error('下载备份失败:', error);
      }
    }
  );
}

/**
 * 系统通知Hook
 * @returns 系统通知状态和操作方法
 */
export function useSystemNotifications() {
  return useApi(
    () => systemAPI.getSystemNotifications(),
    {
      immediate: true,
      // refreshInterval: 60000, // 暂时禁用自动刷新，避免频繁API调用
      onError: (error) => {
        console.error('获取系统通知失败:', error);
      }
    }
  );
}

/**
 * 标记通知已读Hook
 * @returns 标记已读状态和操作方法
 */
export function useMarkNotificationRead() {
  return useSubmit(
    (notificationId: string) => systemAPI.markNotificationRead(notificationId),
    {
      onSuccess: () => {
        console.log('通知标记已读成功');
      },
      onError: (error) => {
        console.error('标记通知已读失败:', error);
      }
    }
  );
}

/**
 * 清除所有通知Hook
 * @returns 清除通知状态和操作方法
 */
export function useClearAllNotifications() {
  return useSubmit(
    () => systemAPI.clearAllNotifications(),
    {
      onSuccess: () => {
        console.log('所有通知清除成功');
      },
      onError: (error) => {
        console.error('清除所有通知失败:', error);
      }
    }
  );
}

/**
 * 测试邮件配置Hook
 * @returns 测试邮件状态和操作方法
 */
export function useTestEmailConfig() {
  return useSubmit(
    (config: EmailConfig) => systemAPI.testEmailConfig(config),
    {
      onSuccess: () => {
        console.log('邮件配置测试成功');
      },
      onError: (error) => {
        console.error('邮件配置测试失败:', error);
      }
    }
  );
}

/**
 * 发送测试邮件Hook
 * @returns 发送测试邮件状态和操作方法
 */
export function useSendTestEmail() {
  return useSubmit(
    (email: string) => systemAPI.sendTestEmail(email),
    {
      onSuccess: () => {
        console.log('测试邮件发送成功');
      },
      onError: (error) => {
        console.error('发送测试邮件失败:', error);
      }
    }
  );
}

/**
 * 系统重启Hook
 * @returns 重启状态和操作方法
 */
export function useRestartSystem() {
  return useSubmit(
    () => systemAPI.restartSystem(),
    {
      onSuccess: () => {
        console.log('系统重启命令发送成功');
      },
      onError: (error) => {
        console.error('系统重启失败:', error);
      }
    }
  );
}

/**
 * 系统关闭Hook
 * @returns 关闭状态和操作方法
 */
export function useShutdownSystem() {
  return useSubmit(
    () => systemAPI.shutdownSystem(),
    {
      onSuccess: () => {
        console.log('系统关闭命令发送成功');
      },
      onError: (error) => {
        console.error('系统关闭失败:', error);
      }
    }
  );
}

/**
 * 清理系统缓存Hook
 * @returns 清理缓存状态和操作方法
 */
export function useClearSystemCache() {
  return useSubmit(
    () => systemAPI.clearSystemCache(),
    {
      onSuccess: () => {
        console.log('系统缓存清理成功');
      },
      onError: (error) => {
        console.error('清理系统缓存失败:', error);
      }
    }
  );
}

/**
 * 优化数据库Hook
 * @returns 优化数据库状态和操作方法
 */
export function useOptimizeDatabase() {
  return useSubmit(
    () => systemAPI.optimizeDatabase(),
    {
      onSuccess: () => {
        console.log('数据库优化成功');
      },
      onError: (error) => {
        console.error('数据库优化失败:', error);
      }
    }
  );
}

/**
 * 检查系统更新Hook
 * @returns 检查更新状态和操作方法
 */
export function useCheckSystemUpdate() {
  return useSubmit(
    () => systemAPI.checkSystemUpdate(),
    {
      onSuccess: (update) => {
        console.log('系统更新检查完成:', update);
      },
      onError: (error) => {
        console.error('检查系统更新失败:', error);
      }
    }
  );
}

/**
 * 安装系统更新Hook
 * @returns 安装更新状态和操作方法
 */
export function useInstallSystemUpdate() {
  return useSubmit(
    () => systemAPI.installSystemUpdate(),
    {
      onSuccess: () => {
        console.log('系统更新安装成功');
      },
      onError: (error) => {
        console.error('安装系统更新失败:', error);
      }
    }
  );
}