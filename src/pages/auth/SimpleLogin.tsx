import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiGithub, FiAlertCircle, FiLogIn } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { authAPI } from '../../services/api/auth';
import { oauthService } from '../../services/auth/oauthService';
import { tokenManager } from '../../services/auth/tokenManager';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { validateEmail } from '../../utils/validation';

const SimpleLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 检查是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await tokenManager.isAuthenticated();
      if (isAuthenticated) {
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    };
    checkAuth();
  }, [navigate, location]);

  const validateEmailInput = (email: string): boolean => {
    if (!email) {
      setEmailError('请输入邮箱地址');
      return false;
    }
    if (!validateEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmailInput(email)) {
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    try {
      // 使用邮箱快速注册/登录
      await authAPI.quickRegisterByEmail(email);
      
      // 登录成功，跳转到来源页面或首页
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('邮箱登录失败:', error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        '登录失败，请重试'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setSubmitError(null);

    try {
      const userInfo = await oauthService.authenticate(provider);
      
      // 使用OAuth信息登录
      await authAPI.oauthLogin({
        provider,
        code: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.avatar
      });

      // 登录成功，跳转到来源页面或首页
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(`${provider} 登录失败:`, error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        `${provider === 'google' ? 'Google' : 'GitHub'} 登录失败，请重试`
      );
    } finally {
      setOauthLoading(null);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError(null);
    }
    if (submitError) {
      setSubmitError(null);
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
              选择您喜欢的方式登录
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

          {/* 分割线 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          {/* 邮箱登录表单 */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="邮箱地址"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              placeholder="请输入您的邮箱地址"
              icon={<FiMail />}
              required
            />

            {/* 错误提示 */}
            {submitError && (
              <Alert
                type="error"
                icon={<FiAlertCircle />}
                title="登录失败"
                message={submitError}
              />
            )}

            <Button
              type="submit"
              disabled={isLoading || !!oauthLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  登录中...
                </>
              ) : (
                '邮箱登录'
              )}
            </Button>
          </form>

          {/* 说明文字 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">登录说明</p>
                <p>邮箱登录无需密码，系统会自动为您创建或登录账户。</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SimpleLogin;