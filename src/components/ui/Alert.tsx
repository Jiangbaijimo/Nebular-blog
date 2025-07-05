import React from 'react';
import { cn } from '../../utils/common';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
  icon = true
}) => {
  const variantStyles = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: FiInfo,
      iconColor: 'text-blue-500'
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: FiCheckCircle,
      iconColor: 'text-green-500'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: FiAlertTriangle,
      iconColor: 'text-yellow-500'
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: FiAlertCircle,
      iconColor: 'text-red-500'
    }
  };

  const { container, icon: IconComponent, iconColor } = variantStyles[variant];

  return (
    <div className={cn(
      'p-4 border rounded-lg',
      container,
      className
    )}>
      <div className="flex">
        {icon && (
          <div className="flex-shrink-0">
            <IconComponent className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
        <div className={cn('ml-3', !icon && 'ml-0')}>
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Alert };
export default Alert;