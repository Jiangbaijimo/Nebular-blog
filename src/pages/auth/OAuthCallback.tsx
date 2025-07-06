import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader, FiHome, FiRefreshCw } from 'react-icons/fi';
import { useOAuthState, type OAuthCallbackState } from '../../hooks/useOAuthState';
import { OAuthErrorBoundary } from '../../components/auth/OAuthErrorBoundary';
import { oauthService } from '../../services/auth/oauthService';

/**
 * OAuth 回调处理页面
 * 处理来自 OAuth 提供商的回调，完成认证流程
 */
const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { handleCallback } = useOAuthState();
  const [callbackState, setCallbackState] = useState<OAuthCallbackState>({
    status: 'loading',
    message: '正在处理认证信息...',
    countdown: 0,
  });
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('开始处理 OAuth 回调');
        
        const result = await handleCallback();
        setCallbackState(result);
        
        if (result.status === 'success') {
          // 获取之前保存的重定向路径
          const redirectPath = oauthService.getRedirectPath() || '/';
          console.log('准备重定向到:', redirectPath);
          
          // 延迟跳转，让用户看到成功消息
          setTimeout(() => {
            oauthService.clearRedirectPath();
            navigate(redirectPath, { replace: true });
          }, result.countdown * 1000);
        } else if (result.status === 'error') {
          // 延迟跳转到登录页
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, result.countdown * 1000);
        }
        
      } catch (error: any) {
        console.error('OAuth 回调处理异常:', error);
        setCallbackState({
          status: 'error',
          message: '处理认证信息时发生异常',
          countdown: 5,
        });
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 5000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [handleCallback, navigate]);

  // 倒计时效果
  useEffect(() => {
    if (callbackState.countdown && callbackState.countdown > 0) {
      const timer = setTimeout(() => {
        setCallbackState(prev => ({
          ...prev,
          countdown: prev.countdown - 1
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [callbackState.countdown]);

  const getIcon = () => {
    switch (callbackState.status) {
      case 'loading':
        return <FiLoader className="animate-spin text-4xl text-blue-500" />;
      case 'success':
        return <FiCheckCircle className="text-4xl text-green-500" />;
      case 'error':
        return <FiXCircle className="text-4xl text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (callbackState.status) {
      case 'loading': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <OAuthErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            key={callbackState.status}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-6"
          >
            {getIcon()}
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-xl font-semibold mb-4 ${getStatusColor()}`}
          >
            {callbackState.status === 'loading' && 'OAuth 认证中'}
            {callbackState.status === 'success' && '认证成功'}
            {callbackState.status === 'error' && '认证失败'}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 mb-4"
          >
            {callbackState.message}
          </motion.p>
          
          {callbackState.countdown > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-500 mb-4"
            >
              {callbackState.countdown} 秒后自动跳转
            </motion.div>
          )}
          
          {callbackState.status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}
          
          {callbackState.status === 'error' && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex gap-3 justify-center"
            >
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FiRefreshCw className="text-sm" />
                重试
              </button>
              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <FiHome className="text-sm" />
                返回首页
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </OAuthErrorBoundary>
  );
};

export default OAuthCallback;