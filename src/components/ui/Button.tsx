import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/common';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    rounded = false,
    disabled,
    children,
    ...props
  },
  ref
) => {
  // 基础样式
  const baseStyles = [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    fullWidth && 'w-full',
    rounded ? 'rounded-full' : 'rounded-lg'
  ];

  // 变体样式
  const variantStyles = {
    primary: [
      'bg-blue-600 text-white shadow-sm',
      'hover:bg-blue-700 focus:ring-blue-500',
      'active:bg-blue-800'
    ],
    secondary: [
      'bg-gray-600 text-white shadow-sm',
      'hover:bg-gray-700 focus:ring-gray-500',
      'active:bg-gray-800'
    ],
    outline: [
      'border border-gray-300 bg-white text-gray-700 shadow-sm',
      'hover:bg-gray-50 focus:ring-blue-500',
      'active:bg-gray-100',
      'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
      'dark:hover:bg-gray-700 dark:active:bg-gray-600'
    ],
    ghost: [
      'text-gray-700 bg-transparent',
      'hover:bg-gray-100 focus:ring-gray-500',
      'active:bg-gray-200',
      'dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700'
    ],
    danger: [
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 focus:ring-red-500',
      'active:bg-red-800'
    ],
    success: [
      'bg-green-600 text-white shadow-sm',
      'hover:bg-green-700 focus:ring-green-500',
      'active:bg-green-800'
    ],
    warning: [
      'bg-yellow-600 text-white shadow-sm',
      'hover:bg-yellow-700 focus:ring-yellow-500',
      'active:bg-yellow-800'
    ]
  };

  // 尺寸样式
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3'
  };

  // 图标尺寸
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };

  const isDisabled = disabled || loading;

  const renderIcon = (iconElement: React.ReactNode, position: 'left' | 'right') => {
    if (!iconElement) return null;
    
    return (
      <span className={cn(
        iconSizes[size],
        position === 'right' && 'order-last'
      )}>
        {iconElement}
      </span>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
          {loadingText || children}
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && renderIcon(icon, 'left')}
        {children}
        {icon && iconPosition === 'right' && renderIcon(icon, 'right')}
      </>
    );
  };

  return (
    <button
      ref={ref}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

// 预设按钮组件
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);

export const OutlineButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="outline" {...props} />
);

export const GhostButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />
);

export const DangerButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="danger" {...props} />
);

export const SuccessButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="success" {...props} />
);

export const WarningButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="warning" {...props} />
);

// 按钮组组件
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
  size,
  variant
}) => {
  const groupStyles = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col'
  };

  return (
    <div className={cn(
      groupStyles[orientation],
      orientation === 'horizontal' ? 'space-x-0' : 'space-y-0',
      className
    )}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;
        
        const groupClassName = cn(
          orientation === 'horizontal' ? [
            !isFirst && '-ml-px',
            !isFirst && !isLast && 'rounded-none',
            isFirst && 'rounded-r-none',
            isLast && 'rounded-l-none'
          ] : [
            !isFirst && '-mt-px',
            !isFirst && !isLast && 'rounded-none',
            isFirst && 'rounded-b-none',
            isLast && 'rounded-t-none'
          ]
        );

        return React.cloneElement(child, {
          className: cn(child.props.className, groupClassName),
          size: size || child.props.size,
          variant: variant || child.props.variant
        });
      })}
    </div>
  );
};

// 图标按钮组件
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>((
  { icon, className, size = 'md', ...props },
  ref
) => {
  const iconOnlyStyles = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4'
  };

  return (
    <Button
      ref={ref}
      className={cn(iconOnlyStyles[size], className)}
      size={size}
      {...props}
    >
      {icon}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

export { Button };
export default Button;