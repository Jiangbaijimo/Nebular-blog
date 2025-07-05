import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { authAPI } from '../../services/api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/ui/Loading';
import { validateEmail, validatePassword, validateUsername } from '../../utils/validation';

interface SetupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  nickname: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  nickname?: string;
}

const SystemSetup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SetupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    nickname: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 验证邮箱
    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 验证用户名
    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线，长度3-20位';
    }

    // 验证昵称
    if (!formData.nickname) {
      newErrors.nickname = '请输入昵称';
    } else if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      newErrors.nickname = '昵称长度应在2-20个字符之间';
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码至少8位，包含大小写字母、数字';
    }

    // 验证确认密码
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SetupFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    try {
      await authAPI.register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        nickname: formData.nickname
      });

      // 设置成功，跳转到首页
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('系统初始化失败:', error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        '系统初始化失败，请重试'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // 验证第一步的字段
      const stepErrors: FormErrors = {};
      if (!formData.email || !validateEmail(formData.email)) {
        stepErrors.email = '请输入有效的邮箱地址';
      }
      if (!formData.username || !validateUsername(formData.username)) {
        stepErrors.username = '请输入有效的用户名';
      }
      if (!formData.nickname || formData.nickname.length < 2) {
        stepErrors.nickname = '请输入有效的昵称';
      }
      
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
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
              <FiUser className="text-white text-2xl" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              系统初始化设置
            </h1>
            <p className="text-gray-600">
              欢迎！请设置管理员账户以完成系统初始化
            </p>
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? <FiCheck /> : '1'}
              </div>
              <div className={`w-12 h-0.5 ${
                currentStep > 1 ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? <FiCheck /> : '2'}
              </div>
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Input
                  label="邮箱地址"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={errors.email}
                  placeholder="请输入管理员邮箱"
                  icon={<FiMail />}
                  required
                />
                
                <Input
                  label="用户名"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  error={errors.username}
                  placeholder="请输入用户名"
                  icon={<FiUser />}
                  required
                />
                
                <Input
                  label="昵称"
                  type="text"
                  value={formData.nickname}
                  onChange={handleInputChange('nickname')}
                  error={errors.nickname}
                  placeholder="请输入显示昵称"
                  icon={<FiUser />}
                  required
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Input
                  label="密码"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={errors.password}
                  placeholder="请输入密码"
                  icon={<FiLock />}
                  required
                />
                
                <Input
                  label="确认密码"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  error={errors.confirmPassword}
                  placeholder="请再次输入密码"
                  icon={<FiLock />}
                  required
                />
              </motion.div>
            )}

            {/* 错误提示 */}
            {submitError && (
              <Alert
                type="error"
                icon={<FiAlertCircle />}
                title="初始化失败"
                message={submitError}
              />
            )}

            {/* 按钮组 */}
            <div className="flex space-x-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  上一步
                </Button>
              )}
              
              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1"
                >
                  下一步
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      初始化中...
                    </>
                  ) : (
                    '完成初始化'
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* 安全提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">安全提示</p>
                <p>此账户将拥有系统最高权限，请妥善保管账户信息。</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SystemSetup;