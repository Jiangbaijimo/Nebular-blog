import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { useSyncStore } from '../../stores/syncStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

// 同步状态类型
export type SyncStatus = 'idle' | 'syncing' | 'uploading' | 'downloading' | 'error' | 'offline';

// 同步状态信息
export interface SyncStatusInfo {
  status: SyncStatus;
  message: string;
  progress?: number;
  lastSync?: Date;
  pendingItems?: number;
  error?: string;
}

// 组件属性
interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className = '',
  showDetails = true,
  position = 'top-right',
  size = 'md'
}) => {
  const { 
    status, 
    lastSync, 
    error, 
    pendingItems, 
    progress,
    isOnline 
  } = useSyncStore();
  const { isOnline: networkOnline, connectionType } = useNetworkStatus();
  const [showTooltip, setShowTooltip] = useState(false);
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>({
    status: 'idle',
    message: '已同步'
  });

  // 更新同步状态信息
  useEffect(() => {
    const updateSyncInfo = () => {
      let newStatus: SyncStatus = 'idle';
      let message = '已同步';
      
      if (!networkOnline || !isOnline) {
        newStatus = 'offline';
        message = '离线模式';
      } else if (error) {
        newStatus = 'error';
        message = `同步失败: ${error}`;
      } else if (status === 'syncing') {
        newStatus = 'syncing';
        message = '正在同步...';
      } else if (status === 'uploading') {
        newStatus = 'uploading';
        message = '正在上传...';
      } else if (status === 'downloading') {
        newStatus = 'downloading';
        message = '正在下载...';
      } else if (pendingItems && pendingItems > 0) {
        newStatus = 'idle';
        message = `${pendingItems} 项待同步`;
      } else {
        newStatus = 'idle';
        message = lastSync ? `最后同步: ${formatLastSync(lastSync)}` : '已同步';
      }

      setSyncInfo({
        status: newStatus,
        message,
        progress,
        lastSync,
        pendingItems,
        error
      });
    };

    updateSyncInfo();
  }, [status, lastSync, error, pendingItems, progress, networkOnline, isOnline]);

  // 格式化最后同步时间
  const formatLastSync = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  // 获取状态图标
  const getStatusIcon = () => {
    const iconProps = {
      className: `${getSizeClass()} transition-all duration-200`,
      'aria-hidden': true
    };

    switch (syncInfo.status) {
      case 'syncing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <ArrowPathIcon {...iconProps} />
          </motion.div>
        );
      case 'uploading':
        return <CloudArrowUpIcon {...iconProps} />;
      case 'downloading':
        return <CloudArrowDownIcon {...iconProps} />;
      case 'error':
        return <ExclamationTriangleIcon {...iconProps} />;
      case 'offline':
        return <NoSymbolIcon {...iconProps} />;
      default:
        return <CheckCircleIcon {...iconProps} />;
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (syncInfo.status) {
      case 'syncing':
      case 'uploading':
      case 'downloading':
        return 'text-blue-500';
      case 'error':
        return 'text-red-500';
      case 'offline':
        return 'text-gray-500';
      default:
        return 'text-green-500';
    }
  };

  // 获取背景颜色
  const getBackgroundColor = () => {
    switch (syncInfo.status) {
      case 'syncing':
      case 'uploading':
      case 'downloading':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'offline':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  // 获取尺寸类
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  // 获取位置类
  const getPositionClass = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClass()} z-50 ${className}`}>
      <div
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm
          ${getBackgroundColor()}
          ${size === 'sm' ? 'px-2 py-1' : size === 'lg' ? 'px-4 py-3' : 'px-3 py-2'}
          transition-all duration-200 hover:shadow-md cursor-pointer
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* 状态图标 */}
        <div className={getStatusColor()}>
          {getStatusIcon()}
        </div>

        {/* 网络状态指示器 */}
        <div className="flex items-center gap-1">
          <WifiIcon 
            className={`w-4 h-4 ${
              networkOnline ? 'text-green-500' : 'text-red-500'
            }`} 
          />
          {connectionType && (
            <span className="text-xs text-gray-500 uppercase">
              {connectionType}
            </span>
          )}
        </div>

        {/* 详细信息 */}
        {showDetails && (
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {syncInfo.status === 'syncing' ? '同步中' : 
               syncInfo.status === 'uploading' ? '上传中' :
               syncInfo.status === 'downloading' ? '下载中' :
               syncInfo.status === 'error' ? '错误' :
               syncInfo.status === 'offline' ? '离线' : '已同步'}
            </span>
            
            {/* 进度条 */}
            {syncInfo.progress !== undefined && syncInfo.progress > 0 && (
              <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${syncInfo.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
            
            {/* 待同步项目数 */}
            {syncInfo.pendingItems && syncInfo.pendingItems > 0 && (
              <span className="text-xs text-gray-500">
                {syncInfo.pendingItems} 项待同步
              </span>
            )}
          </div>
        )}

        {/* 脉冲动画（同步中） */}
        {(syncInfo.status === 'syncing' || 
          syncInfo.status === 'uploading' || 
          syncInfo.status === 'downloading') && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-blue-400"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </div>

      {/* 详细信息提示框 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`
              absolute ${position.includes('top') ? 'top-full mt-2' : 'bottom-full mb-2'}
              ${position.includes('right') ? 'right-0' : 'left-0'}
              bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg
              max-w-xs z-10
            `}
          >
            <div className="space-y-1">
              <div className="font-medium">{syncInfo.message}</div>
              
              {syncInfo.lastSync && (
                <div className="text-gray-300 text-xs">
                  最后同步: {syncInfo.lastSync.toLocaleString()}
                </div>
              )}
              
              {syncInfo.error && (
                <div className="text-red-300 text-xs">
                  错误: {syncInfo.error}
                </div>
              )}
              
              <div className="text-gray-300 text-xs">
                网络: {networkOnline ? '在线' : '离线'}
                {connectionType && ` (${connectionType})`}
              </div>
            </div>
            
            {/* 箭头 */}
            <div 
              className={`
                absolute w-2 h-2 bg-gray-900 transform rotate-45
                ${position.includes('top') ? '-top-1' : '-bottom-1'}
                ${position.includes('right') ? 'right-4' : 'left-4'}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyncStatusIndicator;