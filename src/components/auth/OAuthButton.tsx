import React from 'react';
import { motion } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';
import { FaGoogle, FaGithub, FaMicrosoft } from 'react-icons/fa';
import { type OAuthProvider, getProviderConfig } from '../../config/oauth';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: (provider: OAuthProvider) => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
  showText?: boolean;
  className?: string;
}

/**
 * OAuth 登录按钮组件
 * 支持多种提供商、样式和状态
 */
export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onClick,
  loading = false,
  disabled = false,
  size = 'md',
  variant = 'outline',
  showText = true,
  className = '',
}) => {
  const config = getProviderConfig(provider);
  
  if (!config) {
    console.warn(`Unknown OAuth provider: ${provider}`);
    return null;
  }

  const handleClick = () => {
    if (!loading && !disabled) {
      onClick(provider);
    }
  };

  const getIcon = () => {
    const iconProps = {
      className: getIconSize(),
    };

    switch (provider) {
      case 'google':
        return <FaGoogle {...iconProps} style={{ color: '#4285f4' }} />;
      case 'github':
        return <FaGithub {...iconProps} style={{ color: '#333' }} />;
      case 'microsoft':
        return <FaMicrosoft {...iconProps} style={{ color: '#0078d4' }} />;
      default:
        return null;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'md': return 'text-lg';
      case 'lg': return 'text-xl';
      default: return 'text-lg';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm';
      case 'md': return 'px-4 py-3 text-base';
      case 'lg': return 'px-6 py-4 text-lg';
      default: return 'px-4 py-3 text-base';
    }
  };

  const getVariantStyles = () => {
    const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'default':
        return `${baseStyles} bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-sm`;
      case 'outline':
        return `${baseStyles} bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500`;
      case 'minimal':
        return `${baseStyles} bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-blue-500`;
      default:
        return `${baseStyles} bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-sm`;
    }
  };

  const getDisabledStyles = () => {
    if (disabled || loading) {
      return 'opacity-50 cursor-not-allowed';
    }
    return 'cursor-pointer';
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        ${getVariantStyles()}
        ${getButtonSize()}
        ${getDisabledStyles()}
        flex items-center justify-center gap-3 w-full
        ${className}
      `}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <>
          <FiLoader className={`${getIconSize()} animate-spin`} />
          {showText && <span>连接中...</span>}
        </>
      ) : (
        <>
          {getIcon()}
          {showText && <span>使用 {config.displayName} 登录</span>}
        </>
      )}
    </motion.button>
  );
};

/**
 * OAuth 按钮组组件
 * 显示多个 OAuth 提供商按钮
 */
interface OAuthButtonGroupProps {
  providers: OAuthProvider[];
  onProviderClick: (provider: OAuthProvider) => void;
  loading?: boolean;
  loadingProvider?: OAuthProvider | null;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const OAuthButtonGroup: React.FC<OAuthButtonGroupProps> = ({
  providers,
  onProviderClick,
  loading = false,
  loadingProvider = null,
  disabled = false,
  size = 'md',
  variant = 'outline',
  orientation = 'vertical',
  className = '',
}) => {
  const containerClass = orientation === 'horizontal' 
    ? 'flex flex-row gap-3' 
    : 'flex flex-col gap-3';

  return (
    <div className={`${containerClass} ${className}`}>
      {providers.map((provider) => {
        const config = getProviderConfig(provider);
        if (!config || !config.enabled) {
          return null;
        }

        return (
          <OAuthButton
            key={provider}
            provider={provider}
            onClick={onProviderClick}
            loading={loading && loadingProvider === provider}
            disabled={disabled || (loading && loadingProvider !== provider)}
            size={size}
            variant={variant}
            showText={true}
          />
        );
      })}
    </div>
  );
};

/**
 * 快速 OAuth 按钮组件
 * 预配置的常用 OAuth 提供商按钮组
 */
interface QuickOAuthButtonsProps {
  onProviderClick: (provider: OAuthProvider) => void;
  loading?: boolean;
  loadingProvider?: OAuthProvider | null;
  disabled?: boolean;
  className?: string;
}

export const QuickOAuthButtons: React.FC<QuickOAuthButtonsProps> = (props) => {
  const enabledProviders: OAuthProvider[] = ['google', 'github', 'microsoft'];
  
  return (
    <OAuthButtonGroup
      {...props}
      providers={enabledProviders}
      size="md"
      variant="outline"
      orientation="vertical"
    />
  );
};

export default OAuthButton;