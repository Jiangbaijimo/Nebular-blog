import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/common';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  className?: string;
  overlayClassName?: string;
  footer?: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  destroyOnClose?: boolean;
  zIndex?: number;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  centered = true,
  closable = true,
  maskClosable = true,
  keyboard = true,
  className,
  overlayClassName,
  footer,
  hideHeader = false,
  hideFooter = false,
  destroyOnClose = false,
  zIndex = 1000
}) => {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // 尺寸样式
  const sizeStyles = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyboard || !isOpen) return;
      
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, keyboard, closable, onClose]);

  // 处理焦点管理
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // 延迟聚焦到模态框
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else {
      // 恢复之前的焦点
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // 处理body滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 组件挂载状态
  useEffect(() => {
    setMounted(true);
  }, []);

  // 处理遮罩点击
  const handleMaskClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      onClose();
    }
  };

  // 如果未挂载或不显示且设置了销毁，则不渲染
  if (!mounted || (!isOpen && destroyOnClose)) {
    return null;
  }

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 transition-all duration-300',
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
        overlayClassName
      )}
      style={{ zIndex }}
      onClick={handleMaskClick}
    >
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* 模态框容器 */}
      <div className={cn(
        'relative flex min-h-full items-center justify-center p-4',
        centered ? 'items-center' : 'items-start pt-16'
      )}>
        {/* 模态框内容 */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={cn(
            'relative w-full transform rounded-lg bg-white shadow-xl transition-all duration-300',
            'dark:bg-gray-800',
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
            sizeStyles[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          {!hideHeader && (title || closable) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {closable && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
          
          {/* 内容 */}
          <div className={cn(
            'p-6',
            !hideHeader && (title || closable) && 'pt-0',
            !hideFooter && footer && 'pb-0'
          )}>
            {children}
          </div>
          
          {/* 底部 */}
          {!hideFooter && footer && (
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// 确认对话框
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  content?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  content = '您确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  loading = false
}) => {
  const icons = {
    info: <Info className="h-6 w-6 text-blue-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    error: <AlertCircle className="h-6 w-6 text-red-500" />,
    success: <CheckCircle className="h-6 w-6 text-green-500" />
  };

  const buttonVariants = {
    info: 'primary' as const,
    warning: 'warning' as const,
    error: 'danger' as const,
    success: 'success' as const
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[type]}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1">
          {typeof content === 'string' ? (
            <p className="text-gray-700 dark:text-gray-300">{content}</p>
          ) : (
            content
          )}
        </div>
      </div>
    </Modal>
  );
};

// 警告对话框
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: React.ReactNode;
  confirmText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title = '提示',
  content = '操作完成',
  confirmText = '确定',
  type = 'info'
}) => {
  const icons = {
    info: <Info className="h-6 w-6 text-blue-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    error: <AlertCircle className="h-6 w-6 text-red-500" />,
    success: <CheckCircle className="h-6 w-6 text-green-500" />
  };

  const buttonVariants = {
    info: 'primary' as const,
    warning: 'warning' as const,
    error: 'danger' as const,
    success: 'success' as const
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <Button
          variant={buttonVariants[type]}
          onClick={onClose}
          fullWidth
        >
          {confirmText}
        </Button>
      }
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1">
          {typeof content === 'string' ? (
            <p className="text-gray-700 dark:text-gray-300">{content}</p>
          ) : (
            content
          )}
        </div>
      </div>
    </Modal>
  );
};

// 抽屉组件
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  maskClosable?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  placement = 'right',
  size = 'md',
  closable = true,
  maskClosable = true,
  className,
  footer
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const sizeStyles = {
    sm: placement === 'left' || placement === 'right' ? 'w-80' : 'h-80',
    md: placement === 'left' || placement === 'right' ? 'w-96' : 'h-96',
    lg: placement === 'left' || placement === 'right' ? 'w-[32rem]' : 'h-[32rem]',
    xl: placement === 'left' || placement === 'right' ? 'w-[40rem]' : 'h-[40rem]'
  };

  const placementStyles = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full'
  };

  const transformStyles = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    top: isOpen ? 'translate-y-0' : '-translate-y-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full'
  };

  const handleMaskClick = () => {
    if (maskClosable) {
      onClose();
    }
  };

  const drawerContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-all duration-300',
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      )}
    >
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={handleMaskClick}
      />
      
      {/* 抽屉内容 */}
      <div
        className={cn(
          'absolute bg-white shadow-xl transition-transform duration-300',
          'dark:bg-gray-800',
          placementStyles[placement],
          sizeStyles[size],
          transformStyles[placement],
          className
        )}
      >
        {/* 头部 */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        )}
        
        {/* 内容 */}
        <div className={cn(
          'flex-1 p-6 overflow-auto',
          footer && 'pb-0'
        )}>
          {children}
        </div>
        
        {/* 底部 */}
        {footer && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

export { Modal };
export default Modal;