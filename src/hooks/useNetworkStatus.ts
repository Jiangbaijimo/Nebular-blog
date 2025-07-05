import { useState, useEffect, useCallback } from 'react';
import { useSyncStore } from '../stores/syncStore';

// 网络连接类型
export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'unknown';

// 网络状态信息
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: ConnectionType;
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

// 网络变化事件
export interface NetworkChangeEvent {
  isOnline: boolean;
  previousStatus: boolean;
  timestamp: Date;
  connectionType: ConnectionType;
}

// Hook选项
interface UseNetworkStatusOptions {
  onOnline?: (event: NetworkChangeEvent) => void;
  onOffline?: (event: NetworkChangeEvent) => void;
  onConnectionChange?: (event: NetworkChangeEvent) => void;
  enablePolling?: boolean;
  pollingInterval?: number;
  enableConnectionQuality?: boolean;
}

// 获取连接类型
const getConnectionType = (): ConnectionType => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      switch (connection.type) {
        case 'wifi':
          return 'wifi';
        case 'cellular':
          return 'cellular';
        case 'ethernet':
          return 'ethernet';
        case 'bluetooth':
          return 'bluetooth';
        default:
          return 'unknown';
      }
    }
  }
  return 'unknown';
};

// 获取网络质量信息
const getNetworkQuality = (): Partial<NetworkStatus> => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
    }
  }
  return {
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  };
};

// 测试网络连接质量
const testConnectionQuality = async (): Promise<{
  latency: number;
  downloadSpeed: number;
  isStable: boolean;
}> => {
  try {
    const startTime = performance.now();
    
    // 使用小图片测试延迟
    const response = await fetch('/favicon.ico?' + Date.now(), {
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    const latency = performance.now() - startTime;
    
    // 简单的下载速度测试（使用响应时间估算）
    const downloadSpeed = response.ok ? Math.max(1, 100 - latency) : 0;
    
    // 判断连接是否稳定（延迟小于500ms认为稳定）
    const isStable = latency < 500;
    
    return {
      latency,
      downloadSpeed,
      isStable
    };
  } catch (error) {
    return {
      latency: Infinity,
      downloadSpeed: 0,
      isStable: false
    };
  }
};

export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const {
    onOnline,
    onOffline,
    onConnectionChange,
    enablePolling = false,
    pollingInterval = 30000,
    enableConnectionQuality = false
  } = options;

  const { setNetworkStatus, triggerSync } = useSyncStore();
  
  const [networkStatus, setNetworkStatusState] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: getConnectionType(),
    ...getNetworkQuality()
  });
  
  const [connectionQuality, setConnectionQuality] = useState<{
    latency: number;
    downloadSpeed: number;
    isStable: boolean;
  }>({ latency: 0, downloadSpeed: 0, isStable: true });
  
  const [previousOnlineStatus, setPreviousOnlineStatus] = useState(navigator.onLine);

  // 更新网络状态
  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    const connectionType = getConnectionType();
    const networkQuality = getNetworkQuality();
    
    let quality = connectionQuality;
    if (enableConnectionQuality && isOnline) {
      try {
        quality = await testConnectionQuality();
        setConnectionQuality(quality);
      } catch (error) {
        console.warn('网络质量测试失败:', error);
      }
    }
    
    const newStatus: NetworkStatus = {
      isOnline,
      connectionType,
      ...networkQuality
    };
    
    setNetworkStatusState(newStatus);
    setNetworkStatus(isOnline);
    
    // 触发网络状态变化事件
    if (isOnline !== previousOnlineStatus) {
      const event: NetworkChangeEvent = {
        isOnline,
        previousStatus: previousOnlineStatus,
        timestamp: new Date(),
        connectionType
      };
      
      if (isOnline) {
        console.log('网络已连接');
        onOnline?.(event);
        // 网络恢复时触发同步
        setTimeout(() => {
          triggerSync();
        }, 1000);
      } else {
        console.log('网络已断开');
        onOffline?.(event);
      }
      
      onConnectionChange?.(event);
      setPreviousOnlineStatus(isOnline);
    }
  }, [enableConnectionQuality, connectionQuality, previousOnlineStatus, onOnline, onOffline, onConnectionChange, setNetworkStatus, triggerSync]);

  // 处理在线状态变化
  const handleOnline = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  const handleOffline = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  // 处理连接变化
  const handleConnectionChange = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  // 设置事件监听器
  useEffect(() => {
    // 初始化网络状态
    updateNetworkStatus();

    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 监听连接变化（如果支持）
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', handleConnectionChange);
      }
    }

    // 设置轮询（如果启用）
    let pollingTimer: NodeJS.Timeout | null = null;
    if (enablePolling) {
      pollingTimer = setInterval(() => {
        updateNetworkStatus();
      }, pollingInterval);
    }

    // 清理函数
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange);
        }
      }
      
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, enablePolling, pollingInterval, updateNetworkStatus]);

  // 手动刷新网络状态
  const refreshNetworkStatus = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  // 测试网络连接
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/favicon.ico?' + Date.now(), {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      return response.ok;
    } catch (error) {
      console.warn('网络连接测试失败:', error);
      return false;
    }
  }, []);

  // 获取网络状态描述
  const getNetworkDescription = useCallback((): string => {
    if (!networkStatus.isOnline) {
      return '离线';
    }
    
    const { connectionType, effectiveType } = networkStatus;
    let description = '';
    
    switch (connectionType) {
      case 'wifi':
        description = 'WiFi';
        break;
      case 'cellular':
        description = '移动网络';
        break;
      case 'ethernet':
        description = '有线网络';
        break;
      case 'bluetooth':
        description = '蓝牙';
        break;
      default:
        description = '未知网络';
    }
    
    if (effectiveType && effectiveType !== 'unknown') {
      description += ` (${effectiveType.toUpperCase()})`;
    }
    
    if (connectionQuality.isStable) {
      description += ' - 稳定';
    } else {
      description += ' - 不稳定';
    }
    
    return description;
  }, [networkStatus, connectionQuality]);

  // 判断是否为慢速连接
  const isSlowConnection = useCallback((): boolean => {
    return (
      networkStatus.effectiveType === '2g' ||
      networkStatus.effectiveType === 'slow-2g' ||
      networkStatus.downlink < 1 ||
      connectionQuality.latency > 1000
    );
  }, [networkStatus, connectionQuality]);

  // 判断是否应该启用数据保存模式
  const shouldSaveData = useCallback((): boolean => {
    return (
      networkStatus.saveData ||
      isSlowConnection() ||
      networkStatus.connectionType === 'cellular'
    );
  }, [networkStatus, isSlowConnection]);

  return {
    // 基本状态
    isOnline: networkStatus.isOnline,
    connectionType: networkStatus.connectionType,
    effectiveType: networkStatus.effectiveType,
    
    // 详细信息
    networkStatus,
    connectionQuality,
    
    // 工具方法
    refreshNetworkStatus,
    testConnection,
    getNetworkDescription,
    isSlowConnection,
    shouldSaveData,
    
    // 状态判断
    isWifi: networkStatus.connectionType === 'wifi',
    isCellular: networkStatus.connectionType === 'cellular',
    isEthernet: networkStatus.connectionType === 'ethernet',
    isStableConnection: connectionQuality.isStable,
    
    // 性能指标
    latency: connectionQuality.latency,
    downloadSpeed: connectionQuality.downloadSpeed,
    downlink: networkStatus.downlink,
    rtt: networkStatus.rtt
  };
};

export default useNetworkStatus;