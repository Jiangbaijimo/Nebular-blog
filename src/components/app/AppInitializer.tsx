import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../../services/api/auth';
import { LoadingSpinner } from '../ui/Loading';
import SystemSetup from '../../pages/setup/SystemSetup';
import { motion } from 'framer-motion';
import { FiServer, FiAlertCircle } from 'react-icons/fi';

interface InitializationStatus {
  isInitialized: boolean;
  requiresSetup: boolean;
  allowRegistration: boolean;
  adminUserExists: boolean;
  userCount: number;
}

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [initStatus, setInitStatus] = useState<InitializationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkInitialization = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = await authAPI.checkInitialization();
      setInitStatus(status);
    } catch (error: any) {
      console.error('检查系统初始化状态失败:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        '无法连接到服务器，请检查网络连接'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkInitialization();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FiServer className="text-white text-2xl" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            正在检查系统状态
          </h2>
          <p className="text-gray-600 mb-4">
            请稍候，正在连接服务器...
          </p>
          <LoadingSpinner size="lg" />
        </motion.div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-white text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            连接失败
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              重试连接
            </button>
            <p className="text-sm text-gray-500">
              如果问题持续存在，请检查服务器是否正常运行
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 需要初始化
  if (initStatus && !initStatus.isInitialized && initStatus.requiresSetup) {
    return <SystemSetup />;
  }

  // 系统已初始化，渲染子组件
  return <>{children}</>;
};

export default AppInitializer;