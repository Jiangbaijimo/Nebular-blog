import React from 'react';
import { cn } from '../../utils/common';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  hoverable = false,
  clickable = false,
  onClick
}) => {
  // 基础样式
  const baseStyles = [
    'rounded-lg transition-all duration-200',
    clickable && 'cursor-pointer',
    hoverable && 'hover:shadow-md transform hover:-translate-y-0.5'
  ];

  // 变体样式
  const variantStyles = {
    default: [
      'bg-white border border-gray-200 shadow-sm',
      'dark:bg-gray-800 dark:border-gray-700'
    ],
    outlined: [
      'bg-white border-2 border-gray-300',
      'dark:bg-gray-800 dark:border-gray-600'
    ],
    elevated: [
      'bg-white shadow-lg border-0',
      'dark:bg-gray-800'
    ],
    filled: [
      'bg-gray-50 border-0',
      'dark:bg-gray-700'
    ]
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  // 悬停效果
  const hoverStyles = {
    default: hoverable && 'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600',
    outlined: hoverable && 'hover:border-blue-300 dark:hover:border-blue-600',
    elevated: hoverable && 'hover:shadow-xl',
    filled: hoverable && 'hover:bg-gray-100 dark:hover:bg-gray-600'
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        hoverStyles[variant],
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      {children}
    </div>
  );
};

// 卡片头部组件
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  avatar?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
  avatar
}) => {
  if (title || subtitle || action || avatar) {
    return (
      <div className={cn('flex items-start justify-between mb-4', className)}>
        <div className="flex items-start space-x-3">
          {avatar && (
            <div className="flex-shrink-0">
              {avatar}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0 ml-4">
            {action}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
};

// 卡片内容组件
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('text-gray-700 dark:text-gray-300', className)}>
      {children}
    </div>
  );
};

// 卡片底部组件
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  justify = 'end'
}) => {
  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={cn(
      'flex items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700',
      justifyStyles[justify],
      className
    )}>
      {children}
    </div>
  );
};

// 媒体卡片组件
interface MediaCardProps {
  image: string;
  imageAlt?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  imageHeight?: string;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  image,
  imageAlt = '',
  title,
  subtitle,
  content,
  actions,
  className,
  imageHeight = '12rem',
  hoverable = true,
  clickable = false,
  onClick
}) => {
  return (
    <Card
      className={cn('overflow-hidden p-0', className)}
      hoverable={hoverable}
      clickable={clickable}
      onClick={onClick}
    >
      {/* 图片 */}
      <div className="relative overflow-hidden" style={{ height: imageHeight }}>
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      
      {/* 内容 */}
      <div className="p-6">
        <CardHeader title={title} subtitle={subtitle} className="mb-3" />
        {content && (
          <CardContent className="mb-4">
            {content}
          </CardContent>
        )}
        {actions && (
          <CardFooter className="mt-4 pt-4 border-t-0">
            {actions}
          </CardFooter>
        )}
      </div>
    </Card>
  );
};

// 统计卡片组件
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'blue',
  className
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      value: 'text-blue-900 dark:text-blue-100'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      value: 'text-green-900 dark:text-green-100'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      value: 'text-red-900 dark:text-red-100'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      value: 'text-yellow-900 dark:text-yellow-100'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-900 dark:text-purple-100'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      icon: 'text-gray-600 dark:text-gray-400',
      value: 'text-gray-900 dark:text-gray-100'
    }
  };

  const changeStyles = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  const changeIcons = {
    increase: '↗',
    decrease: '↘',
    neutral: '→'
  };

  return (
    <Card className={cn(colorStyles[color].bg, className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className={cn('text-2xl font-bold', colorStyles[color].value)}>
            {value}
          </p>
          {change && (
            <p className={cn('text-sm mt-1 flex items-center', changeStyles[change.type])}>
              <span className="mr-1">{changeIcons[change.type]}</span>
              {change.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-lg', colorStyles[color].icon)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// 用户卡片组件
interface UserCardProps {
  avatar: string;
  name: string;
  title?: string;
  description?: string;
  stats?: Array<{
    label: string;
    value: string | number;
  }>;
  actions?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UserCard: React.FC<UserCardProps> = ({
  avatar,
  name,
  title,
  description,
  stats,
  actions,
  className,
  size = 'md'
}) => {
  const sizeStyles = {
    sm: {
      avatar: 'w-12 h-12',
      name: 'text-base',
      title: 'text-sm'
    },
    md: {
      avatar: 'w-16 h-16',
      name: 'text-lg',
      title: 'text-base'
    },
    lg: {
      avatar: 'w-20 h-20',
      name: 'text-xl',
      title: 'text-lg'
    }
  };

  return (
    <Card className={cn('text-center', className)}>
      {/* 头像 */}
      <div className="flex justify-center mb-4">
        <img
          src={avatar}
          alt={name}
          className={cn(
            'rounded-full object-cover',
            sizeStyles[size].avatar
          )}
        />
      </div>
      
      {/* 用户信息 */}
      <div className="mb-4">
        <h3 className={cn(
          'font-semibold text-gray-900 dark:text-white',
          sizeStyles[size].name
        )}>
          {name}
        </h3>
        {title && (
          <p className={cn(
            'text-gray-600 dark:text-gray-400 mt-1',
            sizeStyles[size].title
          )}>
            {title}
          </p>
        )}
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {description}
          </p>
        )}
      </div>
      
      {/* 统计信息 */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-gray-200 dark:border-gray-700">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* 操作按钮 */}
      {actions && (
        <div className="flex justify-center space-x-2">
          {actions}
        </div>
      )}
    </Card>
  );
};

// 产品卡片组件
interface ProductCardProps {
  image: string;
  title: string;
  price: string;
  originalPrice?: string;
  rating?: number;
  reviews?: number;
  badge?: {
    text: string;
    color: 'red' | 'green' | 'blue' | 'yellow';
  };
  onAddToCart?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  image,
  title,
  price,
  originalPrice,
  rating,
  reviews,
  badge,
  onAddToCart,
  onViewDetails,
  className
}) => {
  const badgeColors = {
    red: 'bg-red-500 text-white',
    green: 'bg-green-500 text-white',
    blue: 'bg-blue-500 text-white',
    yellow: 'bg-yellow-500 text-black'
  };

  return (
    <Card className={cn('overflow-hidden p-0 group', className)} hoverable>
      {/* 图片容器 */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {badge && (
          <div className={cn(
            'absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded',
            badgeColors[badge.color]
          )}>
            {badge.text}
          </div>
        )}
      </div>
      
      {/* 内容 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {title}
        </h3>
        
        {/* 评分 */}
        {rating !== undefined && (
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'text-sm',
                    i < rating ? 'text-yellow-400' : 'text-gray-300'
                  )}
                >
                  ★
                </span>
              ))}
            </div>
            {reviews !== undefined && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                ({reviews})
              </span>
            )}
          </div>
        )}
        
        {/* 价格 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {price}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {originalPrice}
              </span>
            )}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex space-x-2">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              查看详情
            </button>
          )}
          {onAddToCart && (
            <button
              onClick={onAddToCart}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              加入购物车
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export { Card };
export default Card;