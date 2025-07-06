import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGithub, FiAlertCircle, FiLogIn } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/ui/Loading';
import { useAuthStore } from '../../stores/authStore';
import { authAPI } from '../../services/api/auth';
import { oauthService } from '../../services/auth/oauthService';

const SimpleLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 检查是否已登录（使用store中的状态）
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);



  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setSubmitError(null);

    try {
      await oauthService.authenticate(provider);
      // 认证成功后，oauthService 内部会处理重定向或token设置
      // 这里可能不需要立即导航，或者由全局状态监听来处理
      // 暂时保留，如果 oauthService 处理了导航，可以移除
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(`${provider} 登录失败:`, error);
      // 用户取消授权时不显示错误
      if (error.message.toLowerCase().includes('cancelled') || error.message.toLowerCase().includes('timeout')) {
        return;
      }
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        `${provider === 'google' ? 'Google' : 'GitHub'} 登录失败，请重试`
      );
    } finally {
      setOauthLoading(null);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          {/* 头部 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FiLogIn className="text-white text-2xl" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              欢迎回来
            </h1>
            <p className="text-gray-600">
              使用 GitHub 或 Google 账户登录
            </p>
          </div>

          {/* OAuth 登录按钮 */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin('github')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center space-x-3 py-3 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            >
              {oauthLoading === 'github' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <FiGithub className="text-xl" />
              )}
              <span>使用 GitHub 登录</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center space-x-3 py-3 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            >
              {oauthLoading === 'google' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <FaGoogle className="text-xl text-red-500" />
              )}
              <span>使用 Google 登录</span>
            </Button>
          </div>

          {/* 错误提示 */}
          {submitError && (
            <Alert
              type="error"
              icon={<FiAlertCircle />}
              title="登录失败"
              message={submitError}
            />
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default SimpleLogin;