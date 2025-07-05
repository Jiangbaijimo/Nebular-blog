import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/common';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  delay?: number;
  hideDelay?: number;
  disabled?: boolean;
  arrow?: boolean;
  className?: string;
  tooltipClassName?: string;
  maxWidth?: string;
  zIndex?: number;
  offset?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  trigger = 'hover',
  delay = 100,
  hideDelay = 100,
  disabled = false,
  arrow = true,
  className,
  tooltipClassName,
  maxWidth = '200px',
  zIndex = 1000,
  offset = 8
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 计算位置
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - offset;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'top-start':
        top = triggerRect.top + scrollY - tooltipRect.height - offset;
        left = triggerRect.left + scrollX;
        break;
      case 'top-end':
        top = triggerRect.top + scrollY - tooltipRect.height - offset;
        left = triggerRect.right + scrollX - tooltipRect.width;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + offset;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom-start':
        top = triggerRect.bottom + scrollY + offset;
        left = triggerRect.left + scrollX;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + scrollY + offset;
        left = triggerRect.right + scrollX - tooltipRect.width;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollX + offset;
        break;
    }

    // 边界检测和调整
    if (left < scrollX) {
      left = scrollX + 8;
    } else if (left + tooltipRect.width > scrollX + viewportWidth) {
      left = scrollX + viewportWidth - tooltipRect.width - 8;
    }

    if (top < scrollY) {
      top = scrollY + 8;
    } else if (top + tooltipRect.height > scrollY + viewportHeight) {
      top = scrollY + viewportHeight - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  };

  // 显示tooltip
  const showTooltip = () => {
    if (disabled || !content) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // 延迟计算位置，确保DOM已更新
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  // 隐藏tooltip
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  };

  // 立即隐藏
  const hideTooltipImmediately = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // 处理鼠标事件
  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      showTooltip();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      hideTooltip();
    }
  };

  // 处理点击事件
  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltipImmediately();
      } else {
        showTooltip();
      }
    }
  };

  // 处理焦点事件
  const handleFocus = () => {
    if (trigger === 'focus') {
      showTooltip();
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      hideTooltip();
    }
  };

  // 处理tooltip鼠标事件（防止鼠标移到tooltip上时消失）
  const handleTooltipMouseEnter = () => {
    if (trigger === 'hover' && hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    if (trigger === 'hover') {
      hideTooltip();
    }
  };

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    const handleScroll = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    if (isVisible) {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isVisible]);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        trigger === 'click' &&
        isVisible &&
        triggerRef.current &&
        tooltipRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        hideTooltipImmediately();
      }
    };

    if (isVisible && trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, trigger]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // 箭头样式
  const getArrowStyles = () => {
    const arrowSize = 6;
    const arrowStyles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid'
    };

    switch (placement) {
      case 'top':
      case 'top-start':
      case 'top-end':
        arrowStyles.top = '100%';
        arrowStyles.borderWidth = `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`;
        arrowStyles.borderColor = '#374151 transparent transparent transparent';
        if (placement === 'top') arrowStyles.left = '50%';
        if (placement === 'top') arrowStyles.transform = 'translateX(-50%)';
        if (placement === 'top-start') arrowStyles.left = '12px';
        if (placement === 'top-end') arrowStyles.right = '12px';
        break;
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        arrowStyles.bottom = '100%';
        arrowStyles.borderWidth = `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`;
        arrowStyles.borderColor = 'transparent transparent #374151 transparent';
        if (placement === 'bottom') arrowStyles.left = '50%';
        if (placement === 'bottom') arrowStyles.transform = 'translateX(-50%)';
        if (placement === 'bottom-start') arrowStyles.left = '12px';
        if (placement === 'bottom-end') arrowStyles.right = '12px';
        break;
      case 'left':
        arrowStyles.left = '100%';
        arrowStyles.top = '50%';
        arrowStyles.transform = 'translateY(-50%)';
        arrowStyles.borderWidth = `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`;
        arrowStyles.borderColor = 'transparent transparent transparent #374151';
        break;
      case 'right':
        arrowStyles.right = '100%';
        arrowStyles.top = '50%';
        arrowStyles.transform = 'translateY(-50%)';
        arrowStyles.borderWidth = `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`;
        arrowStyles.borderColor = 'transparent #374151 transparent transparent';
        break;
    }

    return arrowStyles;
  };

  if (!mounted) {
    return (
      <div
        ref={triggerRef}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </div>
    );
  }

  const tooltipContent = isVisible && content && (
    <div
      ref={tooltipRef}
      className={cn(
        'absolute px-2 py-1 text-sm text-white bg-gray-700 rounded shadow-lg',
        'dark:bg-gray-900 dark:text-gray-200',
        'transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0',
        tooltipClassName
      )}
      style={{
        top: position.top,
        left: position.left,
        maxWidth,
        zIndex,
        pointerEvents: trigger === 'hover' ? 'auto' : 'none'
      }}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
      {content}
      {arrow && (
        <div style={getArrowStyles()} />
      )}
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </div>
      {createPortal(tooltipContent, document.body)}
    </>
  );
};

// 简化的Tooltip组件
interface SimpleTooltipProps {
  text: string;
  children: React.ReactNode;
  placement?: TooltipProps['placement'];
  className?: string;
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  text,
  children,
  placement = 'top',
  className
}) => {
  return (
    <Tooltip
      content={text}
      placement={placement}
      className={className}
    >
      {children}
    </Tooltip>
  );
};

// 信息提示组件
interface InfoTooltipProps {
  title?: string;
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipProps['placement'];
  maxWidth?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  content,
  children,
  placement = 'top',
  maxWidth = '300px'
}) => {
  const tooltipContent = (
    <div className="space-y-1">
      {title && (
        <div className="font-semibold text-white">{title}</div>
      )}
      <div className="text-gray-200">{content}</div>
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      placement={placement}
      maxWidth={maxWidth}
      trigger="hover"
      delay={200}
    >
      {children}
    </Tooltip>
  );
};

// 确认提示组件
interface ConfirmTooltipProps {
  title?: string;
  content?: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
  placement?: TooltipProps['placement'];
  loading?: boolean;
}

export const ConfirmTooltip: React.FC<ConfirmTooltipProps> = ({
  title = '确认操作',
  content = '您确定要执行此操作吗？',
  onConfirm,
  onCancel,
  confirmText = '确认',
  cancelText = '取消',
  children,
  placement = 'top',
  loading = false
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsVisible(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setIsVisible(false);
  };

  const tooltipContent = (
    <div className="space-y-3 min-w-48">
      <div className="space-y-1">
        <div className="font-semibold text-white">{title}</div>
        {content && (
          <div className="text-gray-200 text-sm">{content}</div>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? '处理中...' : confirmText}
        </button>
      </div>
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      placement={placement}
      trigger="manual"
      arrow={false}
      className="inline-block"
    >
      <div onClick={() => setIsVisible(!isVisible)}>
        {children}
      </div>
    </Tooltip>
  );
};

export { Tooltip };
export default Tooltip;