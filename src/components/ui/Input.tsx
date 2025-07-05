import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/common';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'underlined';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    className,
    label,
    error,
    success,
    hint,
    size = 'md',
    variant = 'default',
    leftIcon,
    rightIcon,
    clearable = false,
    loading = false,
    fullWidth = false,
    required = false,
    disabled,
    value,
    onChange,
    onClear,
    id,
    ...props
  },
  ref
) => {
  const [showValue, setShowValue] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const hasSuccess = !!success && !hasError;
  const hasValue = value !== undefined && value !== '';

  // 基础样式
  const baseStyles = [
    'w-full transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    disabled && 'opacity-50 cursor-not-allowed',
    fullWidth && 'w-full'
  ];

  // 变体样式
  const variantStyles = {
    default: [
      'border rounded-lg bg-white',
      'focus:ring-blue-500',
      hasError ? 'border-red-500 focus:border-red-500' : 
      hasSuccess ? 'border-green-500 focus:border-green-500' :
      'border-gray-300 focus:border-blue-500',
      'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
      'dark:focus:border-blue-400'
    ],
    filled: [
      'border-0 rounded-lg',
      'bg-gray-100 focus:bg-white focus:ring-blue-500',
      hasError ? 'bg-red-50 focus:bg-red-50' :
      hasSuccess ? 'bg-green-50 focus:bg-green-50' : '',
      'dark:bg-gray-700 dark:focus:bg-gray-600 dark:text-white'
    ],
    underlined: [
      'border-0 border-b-2 rounded-none bg-transparent',
      'focus:ring-0 focus:ring-offset-0',
      hasError ? 'border-red-500' :
      hasSuccess ? 'border-green-500' :
      'border-gray-300 focus:border-blue-500',
      'dark:border-gray-600 dark:text-white dark:focus:border-blue-400'
    ]
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  // 图标样式
  const iconStyles = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // 处理清除
  const handleClear = () => {
    if (onChange) {
      const event = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    if (onClear) {
      onClear();
    }
  };

  // 渲染状态图标
  const renderStatusIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin">
          <div className={cn('border-2 border-gray-300 border-t-blue-500 rounded-full', iconStyles[size])} />
        </div>
      );
    }
    
    if (hasError) {
      return <AlertCircle className={cn('text-red-500', iconStyles[size])} />;
    }
    
    if (hasSuccess) {
      return <CheckCircle className={cn('text-green-500', iconStyles[size])} />;
    }
    
    return null;
  };

  // 渲染右侧图标
  const renderRightIcon = () => {
    const icons = [];
    
    // 清除按钮
    if (clearable && hasValue && !disabled) {
      icons.push(
        <button
          key="clear"
          type="button"
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          <X className={iconStyles[size]} />
        </button>
      );
    }
    
    // 状态图标
    const statusIcon = renderStatusIcon();
    if (statusIcon) {
      icons.push(
        <span key="status">{statusIcon}</span>
      );
    }
    
    // 自定义右图标
    if (rightIcon) {
      icons.push(
        <span key="custom" className={iconStyles[size]}>
          {rightIcon}
        </span>
      );
    }
    
    return icons.length > 0 ? (
      <div className="flex items-center space-x-2">
        {icons}
      </div>
    ) : null;
  };

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full')}>
      {/* 标签 */}
      {label && (
        <label 
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium',
            hasError ? 'text-red-700' :
            hasSuccess ? 'text-green-700' :
            'text-gray-700 dark:text-gray-300',
            required && "after:content-['*'] after:text-red-500 after:ml-1"
          )}
        >
          {label}
        </label>
      )}
      
      {/* 输入框容器 */}
      <div className="relative">
        {/* 左图标 */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span className={iconStyles[size]}>
              {leftIcon}
            </span>
          </div>
        )}
        
        {/* 输入框 */}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            leftIcon && 'pl-10',
            (rightIcon || clearable || loading || hasError || hasSuccess) && 'pr-10',
            className
          )}
          disabled={disabled}
          value={value}
          onChange={onChange}
          {...props}
        />
        
        {/* 右图标 */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {renderRightIcon()}
        </div>
      </div>
      
      {/* 提示信息 */}
      {(error || success || hint) && (
        <div className="text-sm">
          {error && (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          )}
          {success && !error && (
            <p className="text-green-600 dark:text-green-400">{success}</p>
          )}
          {hint && !error && !success && (
            <p className="text-gray-500 dark:text-gray-400">{hint}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// 密码输入框
interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((
  { showToggle = true, ...props },
  ref
) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const toggleIcon = showPassword ? 
    <EyeOff className="h-5 w-5" /> : 
    <Eye className="h-5 w-5" />;
    
  const rightIcon = showToggle ? (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      tabIndex={-1}
    >
      {toggleIcon}
    </button>
  ) : undefined;
  
  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={rightIcon}
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

// 搜索输入框
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void;
  searchOnEnter?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>((
  { onSearch, searchOnEnter = true, onKeyDown, ...props },
  ref
) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchOnEnter && e.key === 'Enter' && onSearch) {
      onSearch(e.currentTarget.value);
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };
  
  return (
    <Input
      ref={ref}
      type="search"
      leftIcon={<Search />}
      onKeyDown={handleKeyDown}
      clearable
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';

// 数字输入框
interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>((
  { min, max, step = 1, precision, onChange, ...props },
  ref
) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // 处理精度
    if (precision !== undefined && value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        value = num.toFixed(precision);
      }
    }
    
    // 处理范围
    if (value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (min !== undefined && num < min) value = min.toString();
        if (max !== undefined && num > max) value = max.toString();
      }
    }
    
    const newEvent = {
      ...e,
      target: { ...e.target, value }
    };
    
    if (onChange) {
      onChange(newEvent);
    }
  };
  
  return (
    <Input
      ref={ref}
      type="number"
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      {...props}
    />
  );
});

NumberInput.displayName = 'NumberInput';

export { Input };
export default Input;