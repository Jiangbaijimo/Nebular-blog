import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  Cog6ToothIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { offlineModeManager, OfflineOperationRecord, OfflineStatus } from '../../services/offline/offlineModeManager';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { toast } from 'react-hot-toast';

interface OfflineDataSyncProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
}

const OfflineDataSync: React.FC<OfflineDataSyncProps> = ({
  className = '',
  showDetails = true,
  autoRefresh = true
}) => {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [pendingOperations, setPendingOperations] = useState<OfflineOperationRecord[]>([]);
  const [failedOperations, setFailedOperations] = useState<OfflineOperationRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<OfflineOperationRecord | null>(null);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();

  // 刷新数据
  const refreshData = async () => {
    try {
      const [status, pending, failed] = await Promise.all([
        offlineModeManager.getOfflineStatus(),
        offlineModeManager.getPendingOperations(),
        offlineModeManager.getFailedOperations()
      ]);
      
      setOfflineStatus(status);
      setPendingOperations(pending);
      setFailedOperations(failed);
    } catch (error) {
      console.error('刷新离线数据失败:', error);
    }
  };

  // 初始化和事件监听
  useEffect(() => {
    refreshData();

    const handleSyncStart = (data: { count: number }) => {
      setIsSyncing(true);
      setSyncProgress({ current: 0, total: data.count });
      toast.loading(`开始同步 ${data.count} 项操作...`, { id: 'sync-progress' });
    };

    const handleSyncCompleted = (data: { syncedCount: number; failedCount: number }) => {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
      toast.dismiss('sync-progress');
      
      if (data.failedCount > 0) {
        toast.error(`同步完成: ${data.syncedCount} 成功, ${data.failedCount} 失败`);
      } else {
        toast.success(`同步完成: ${data.syncedCount} 项操作成功`);
      }
      
      refreshData();
    };

    const handleOperationSynced = () => {
      setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
      refreshData();
    };

    // 监听离线模式事件
    offlineModeManager.on('sync_started', handleSyncStart);
    offlineModeManager.on('sync_completed', handleSyncCompleted);
    offlineModeManager.on('operation_synced', handleOperationSynced);
    offlineModeManager.on('operation_added', refreshData);
    offlineModeManager.on('operation_failed', refreshData);

    // 自动刷新
    let refreshInterval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      refreshInterval = setInterval(refreshData, 5000); // 每5秒刷新
    }

    return () => {
      offlineModeManager.off('sync_started', handleSyncStart);
      offlineModeManager.off('sync_completed', handleSyncCompleted);
      offlineModeManager.off('operation_synced', handleOperationSynced);
      offlineModeManager.off('operation_added', refreshData);
      offlineModeManager.off('operation_failed', refreshData);
      
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  // 手动同步
  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error('网络连接不可用，无法同步');
      return;
    }

    if (pendingOperations.length === 0) {
      toast.info('没有待同步的操作');
      return;
    }

    try {
      await offlineModeManager.syncPendingOperations();
    } catch (error) {
      console.error('手动同步失败:', error);
      toast.error('同步失败');
    }
  };

  // 重试失败的操作
  const handleRetryFailed = async (operationId: string) => {
    try {
      // 将失败的操作重新标记为待处理
      const operation = failedOperations.find(op => op.id === operationId);
      if (operation) {
        operation.status = 'pending';
        operation.error = undefined;
        await refreshData();
        toast.success('操作已重新加入同步队列');
      }
    } catch (error) {
      console.error('重试操作失败:', error);
      toast.error('重试失败');
    }
  };

  // 删除操作
  const handleDeleteOperation = async (operationId: string) => {
    try {
      await offlineModeManager.removeOfflineOperation(operationId);
      await refreshData();
      toast.success('操作已删除');
    } catch (error) {
      console.error('删除操作失败:', error);
      toast.error('删除失败');
    }
  };

  // 获取操作图标
  const getOperationIcon = (operation: OfflineOperationRecord) => {
    switch (operation.operation) {
      case 'create_draft':
      case 'update_draft':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'upload_image':
        return <PhotoIcon className="h-4 w-4" />;
      case 'delete_draft':
      case 'delete_image':
        return <TrashIcon className="h-4 w-4" />;
      case 'update_settings':
        return <Cog6ToothIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  // 获取操作描述
  const getOperationDescription = (operation: OfflineOperationRecord) => {
    switch (operation.operation) {
      case 'create_draft':
        return '创建草稿';
      case 'update_draft':
        return '更新草稿';
      case 'delete_draft':
        return '删除草稿';
      case 'upload_image':
        return '上传图片';
      case 'delete_image':
        return '删除图片';
      case 'update_settings':
        return '更新设置';
      default:
        return '未知操作';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'synced':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!offlineStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className={`offline-data-sync ${className}`}>
      {/* 同步状态概览 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">离线数据同步</h3>
          
          <div className="flex items-center space-x-3">
            {/* 网络状态 */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>{isOnline ? '在线' : '离线'}</span>
              {isSlowConnection && <span>(慢速)</span>}
            </div>

            {/* 刷新按钮 */}
            <button
              onClick={refreshData}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>

            {/* 同步按钮 */}
            <button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing || pendingOperations.length === 0}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm">同步中...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4" />
                  <span className="text-sm">立即同步</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 同步进度 */}
        <AnimatePresence>
          {isSyncing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    同步进度: {syncProgress.current} / {syncProgress.total}
                  </span>
                  <span className="text-sm text-blue-700">
                    {Math.round((syncProgress.current / syncProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(syncProgress.current / syncProgress.total) * 100}%` 
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 状态统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">待同步</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {offlineStatus.pendingOperations}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">草稿</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {offlineStatus.cachedItems.drafts}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <PhotoIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">图片</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {offlineStatus.cachedItems.images}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Cog6ToothIcon className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">存储</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {Math.round(offlineStatus.storageUsage.percentage)}%
            </p>
          </div>
        </div>

        {/* 最后同步时间 */}
        {offlineStatus.lastSync && (
          <div className="text-sm text-gray-500 mb-4">
            最后同步: {offlineStatus.lastSync.toLocaleString()}
          </div>
        )}
      </div>

      {/* 操作列表 */}
      {showDetails && (
        <div className="mt-6 space-y-4">
          {/* 待处理操作 */}
          {pendingOperations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-md font-semibold text-gray-900 flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                  <span>待同步操作 ({pendingOperations.length})</span>
                </h4>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingOperations.map((operation) => (
                  <div key={operation.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-yellow-600">
                          {getOperationIcon(operation)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getOperationDescription(operation)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {operation.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(operation.status)
                        }`}>
                          待处理
                        </span>
                        
                        <button
                          onClick={() => {
                            setSelectedOperation(operation);
                            setShowOperationDetails(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteOperation(operation.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 失败操作 */}
          {failedOperations.length > 0 && (
            <div className="bg-white rounded-lg border border-red-200">
              <div className="px-6 py-4 border-b border-red-200">
                <h4 className="text-md font-semibold text-gray-900 flex items-center space-x-2">
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                  <span>失败操作 ({failedOperations.length})</span>
                </h4>
              </div>
              <div className="divide-y divide-gray-200">
                {failedOperations.map((operation) => (
                  <div key={operation.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-red-600">
                          {getOperationIcon(operation)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getOperationDescription(operation)}
                          </p>
                          <p className="text-xs text-red-600">
                            {operation.error}
                          </p>
                          <p className="text-xs text-gray-500">
                            重试次数: {operation.retryCount} | {operation.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRetryFailed(operation.id)}
                          className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          <ArrowPathIcon className="h-3 w-3" />
                          <span>重试</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedOperation(operation);
                            setShowOperationDetails(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteOperation(operation.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 无操作提示 */}
          {pendingOperations.length === 0 && failedOperations.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">所有数据已同步</h4>
              <p className="text-gray-500">没有待处理的离线操作</p>
            </div>
          )}
        </div>
      )}

      {/* 操作详情模态框 */}
      <AnimatePresence>
        {showOperationDetails && selectedOperation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowOperationDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">操作详情</h3>
                <button
                  onClick={() => setShowOperationDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">操作类型</label>
                  <p className="text-sm text-gray-900">{getOperationDescription(selectedOperation)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">实体类型</label>
                  <p className="text-sm text-gray-900">{selectedOperation.entityType}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">实体ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedOperation.entityId}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">状态</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    getStatusColor(selectedOperation.status)
                  }`}>
                    {selectedOperation.status === 'pending' ? '待处理' : 
                     selectedOperation.status === 'synced' ? '已同步' : '失败'}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">创建时间</label>
                  <p className="text-sm text-gray-900">{selectedOperation.timestamp.toLocaleString()}</p>
                </div>
                
                {selectedOperation.error && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">错误信息</label>
                    <p className="text-sm text-red-600">{selectedOperation.error}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-700">重试次数</label>
                  <p className="text-sm text-gray-900">{selectedOperation.retryCount}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">数据</label>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedOperation.data, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineDataSync;