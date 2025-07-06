import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiLogIn } from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { QuickOAuthButtons } from '../../components/auth/OAuthButton';
import { useAuthStore } from '../../stores/auth';
import { useOAuthState, type OAuthProvider } from '../../hooks/useOAuthState';

const SimpleLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOAuthLogin, isLoading, error } = useOAuthState();

  // 检查是否已登录（使用store中的状态）
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);



  const handleProviderLogin = (provider: OAuthProvider) => {
    const from = (location.state as any)?.from?.pathname || '/';
    handleOAuthLogin(provider, from);
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
           <QuickOAuthButtons
             onProviderClick={handleProviderLogin}
             loading={isLoading}
             loadingProvider={null}
             disabled={false}
             className="space-y-3"
           />

          {/* 错误提示 */}
          {error && (
            <Alert
              type="error"
              icon={<FiAlertCircle />}
              title="登录失败"
              message={error}
            />
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default SimpleLogin;