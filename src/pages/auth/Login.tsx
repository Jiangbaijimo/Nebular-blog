// 登录页面组件
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Github, Chrome, User } from 'lucide-react';
import authAPI from '../../services/api/auth';
import oauthService from '../../services/auth/oauthService';
import tokenManager from '../../services/auth/tokenManager';
import type { LoginCredentials, OAuthProvider } from '../../types/auth';

/**
 * 登录页面组件
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 表单状态
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  // UI状态
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [oauthLoading, setOauthLoading] = useState<Record<OAuthProvider, boolean>>({} as any);
  
  // 获取重定向路径
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  
  // 检查是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await tokenManager.isAuthenticated();
      if (isAuthenticated) {
        navigate(from, { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate, from]);

  /**
   * 处理表单输入变化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(formData);
      
      // 从嵌套的响应结构中提取token数据
      const tokenData = response.data?.data || response.data || response;
      
      // 验证token数据
      if (!tokenData.accessToken || !tokenData.refreshToken) {
        throw new Error('登录响应中缺少必要的token信息');
      }
      
      // 保存Token
      await tokenManager.setTokens({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
      });
      
      // 跳转到目标页面
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login failed:', error);
      
      if (error.status === 401) {
        setErrors({ general: '邮箱或密码错误' });
      } else if (error.status === 429) {
        setErrors({ general: '登录尝试过于频繁，请稍后再试' });
      } else {
        setErrors({ general: error.message || '登录失败，请稍后重试' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理OAuth登录
   */
  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (!oauthService.isProviderConfigured(provider)) {
      setErrors({ general: `${provider} 登录未配置` });
      return;
    }
    
    setOauthLoading(prev => ({ ...prev, [provider]: true }));
    
    try {
      const userInfo = await oauthService.authenticate(provider);
      console.log('OAuth login successful:', userInfo);
      
      // 跳转到目标页面
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(`${provider} login failed:`, error);
      
      if (error.message.includes('cancelled')) {
        // 用户取消登录，不显示错误
        return;
      }
      
      setErrors({ general: `${provider} 登录失败：${error.message}` });
    } finally {
      setOauthLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  /**
   * 获取OAuth提供商图标
   */
  const getOAuthIcon = (provider: OAuthProvider) => {
    switch (provider) {
      case 'google':
        return <Chrome className="w-5 h-5" />;
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'microsoft':
        return <User className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  /**
   * 获取OAuth提供商名称
   */
  const getOAuthName = (provider: OAuthProvider) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'github':
        return 'GitHub';
      case 'microsoft':
        return 'Microsoft';
      default:
        return provider;
    }
  };

  // 获取可用的OAuth提供商
  const availableProviders = oauthService.getSupportedProviders().filter(
    provider => oauthService.isProviderConfigured(provider)
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 头部 */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
            <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            登录账户
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            还没有账户？{' '}
            <Link
              to="/auth/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              立即注册
            </Link>
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-lg">
          {/* 全局错误信息 */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                邮箱地址
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.email
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="请输入邮箱地址"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                密码
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.password
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  记住我
                </label>
              </div>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                忘记密码？
              </Link>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登录中...
                </div>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* OAuth登录 */}
          {availableProviders.length > 0 && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      或使用第三方登录
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                {availableProviders.map(provider => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleOAuthLogin(provider)}
                    disabled={oauthLoading[provider]}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {oauthLoading[provider] ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                        连接中...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {getOAuthIcon(provider)}
                        <span className="ml-2">使用 {getOAuthName(provider)} 登录</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;