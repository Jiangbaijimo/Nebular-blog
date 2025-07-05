import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/common';

interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'white';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  fullScreen = false,
  overlay = false,
  className
}) => {
  // 尺寸样式
  const sizeStyles = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // 颜色样式
  const colorStyles = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    white: 'text-white'
  };

  // 文本尺寸
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // 渲染不同变体的加载动画
  const renderLoader = () => {
    const baseClasses = cn(sizeStyles[size], colorStyles[color]);

    switch (variant) {
      case 'spinner':
        return (
          <Loader2 className={cn('animate-spin', baseClasses)} />
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full animate-pulse',
                  colorStyles[color].replace('text-', 'bg-'),
                  size === 'xs' ? 'w-1 h-1' :
                  size === 'sm' ? 'w-1.5 h-1.5' :
                  size === 'md' ? 'w-2 h-2' :
                  size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div
            className={cn(
              'rounded-full animate-pulse',
              colorStyles[color].replace('text-', 'bg-'),
              sizeStyles[size]
            )}
          />
        );

      case 'bars':
        return (
          <div className="flex items-end space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'animate-pulse',
                  colorStyles[color].replace('text-', 'bg-'),
                  size === 'xs' ? 'w-0.5 h-2' :
                  size === 'sm' ? 'w-0.5 h-3' :
                  size === 'md' ? 'w-1 h-4' :
                  size === 'lg' ? 'w-1 h-6' : 'w-1.5 h-8'
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <div className={cn('relative', sizeStyles[size])}>
            <div
              className={cn(
                'absolute inset-0 rounded-full border-2 border-transparent animate-spin',
                `border-t-current ${colorStyles[color]}`
              )}
            />
            <div
              className={cn(
                'absolute inset-1 rounded-full border-2 border-transparent animate-spin',
                `border-b-current ${colorStyles[color]}`
              )}
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            />
          </div>
        );

      default:
        return (
          <Loader2 className={cn('animate-spin', baseClasses)} />
        );
    }
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-2',
      className
    )}>
      {renderLoader()}
      {text && (
        <p className={cn(
          'font-medium',
          textSizes[size],
          colorStyles[color]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75">
        {content}
      </div>
    );
  }

  return content;
};

// 骨架屏组件
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  className,
  lines = 1
}) => {
  const baseClasses = [
    'bg-gray-200 dark:bg-gray-700',
    animation === 'pulse' && 'animate-pulse',
    animation === 'wave' && 'animate-pulse'
  ];

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const defaultSizes = {
    text: { width: '100%', height: '1rem' },
    circular: { width: '2rem', height: '2rem' },
    rectangular: { width: '100%', height: '8rem' }
  };

  const style = {
    width: width || defaultSizes[variant].width,
    height: height || defaultSizes[variant].height
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              index === lines - 1 && 'w-3/4' // 最后一行稍短
            )}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
};

// 加载包装器组件
interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  overlay?: boolean;
  className?: string;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  children,
  loadingComponent,
  overlay = true,
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        loadingComponent || (
          <Loading
            overlay={overlay}
            text="加载中..."
          />
        )
      )}
    </div>
  );
};

// 页面加载组件
interface PageLoadingProps {
  text?: string;
  logo?: React.ReactNode;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  text = '页面加载中...',
  logo
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      {logo && (
        <div className="mb-8">
          {logo}
        </div>
      )}
      <Loading
        size="lg"
        variant="spinner"
        text={text}
      />
    </div>
  );
};

// 内容加载组件
interface ContentLoadingProps {
  lines?: number;
  avatar?: boolean;
  title?: boolean;
  paragraph?: boolean;
  className?: string;
}

export const ContentLoading: React.FC<ContentLoadingProps> = ({
  lines = 3,
  avatar = false,
  title = true,
  paragraph = true,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start space-x-4">
        {avatar && (
          <Skeleton variant="circular" width={40} height={40} />
        )}
        <div className="flex-1 space-y-2">
          {title && (
            <Skeleton variant="text" width="60%" height="1.25rem" />
          )}
          {paragraph && (
            <Skeleton variant="text" lines={lines} />
          )}
        </div>
      </div>
    </div>
  );
};

// 卡片加载组件
export const CardLoading: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <Skeleton variant="rectangular" height="12rem" />
      <div className="space-y-2">
        <Skeleton variant="text" width="80%" height="1.25rem" />
        <Skeleton variant="text" lines={2} />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="20%" />
      </div>
    </div>
  );
};

// 表格加载组件
interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export const TableLoading: React.FC<TableLoadingProps> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="space-y-3">
      {/* 表头 */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" height="1.5rem" />
        ))}
      </div>
      
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
};

export { Loading };
export default Loading;