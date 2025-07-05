import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/common';

interface DropdownItem {
  key: string;
  label: React.ReactNode;
  value?: any;
  disabled?: boolean;
  divider?: boolean;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect?: (item: DropdownItem) => void;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right';
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  arrow?: boolean;
  closeOnSelect?: boolean;
  maxHeight?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  onSelect,
  placement = 'bottom-start',
  disabled = false,
  className,
  dropdownClassName,
  arrow = false,
  closeOnSelect = true,
  maxHeight = '16rem'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      const enabledItems = items.filter(item => !item.disabled && !item.divider);

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex >= enabledItems.length ? 0 : nextIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev - 1;
            return nextIndex < 0 ? enabledItems.length - 1 : nextIndex;
          });
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < enabledItems.length) {
            handleSelect(enabledItems[focusedIndex]);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, focusedIndex, items]);

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setFocusedIndex(-1);
    }
  };

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    
    if (onSelect) {
      onSelect(item);
    }
    
    if (closeOnSelect) {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  // 位置样式
  const placementStyles = {
    'bottom-start': 'top-full left-0 mt-1',
    'bottom-end': 'top-full right-0 mt-1',
    'top-start': 'bottom-full left-0 mb-1',
    'top-end': 'bottom-full right-0 mb-1',
    'left': 'right-full top-0 mr-1',
    'right': 'left-full top-0 ml-1'
  };

  const enabledItems = items.filter(item => !item.disabled && !item.divider);

  return (
    <div className={cn('relative inline-block', className)}>
      {/* 触发器 */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={cn(
          'cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {trigger}
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 min-w-48 py-1 bg-white rounded-lg shadow-lg border border-gray-200',
            'dark:bg-gray-800 dark:border-gray-700',
            placementStyles[placement],
            dropdownClassName
          )}
          style={{ maxHeight }}
        >
          {/* 箭头 */}
          {arrow && (
            <div className={cn(
              'absolute w-2 h-2 bg-white border transform rotate-45',
              'dark:bg-gray-800 dark:border-gray-700',
              placement.startsWith('bottom') ? '-top-1 border-b-0 border-r-0' :
              placement.startsWith('top') ? '-bottom-1 border-t-0 border-l-0' :
              placement === 'left' ? '-right-1 border-l-0 border-t-0' :
              '-left-1 border-r-0 border-b-0',
              placement.includes('start') ? 'left-4' :
              placement.includes('end') ? 'right-4' :
              'top-1/2 -translate-y-1/2'
            )} />
          )}

          <div className="overflow-auto" style={{ maxHeight }}>
            {items.map((item, index) => {
              if (item.divider) {
                return (
                  <div
                    key={item.key}
                    className="my-1 border-t border-gray-200 dark:border-gray-600"
                  />
                );
              }

              const enabledIndex = enabledItems.findIndex(enabledItem => enabledItem.key === item.key);
              const isFocused = enabledIndex === focusedIndex;

              return (
                <div
                  key={item.key}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors',
                    item.disabled
                      ? 'text-gray-400 cursor-not-allowed dark:text-gray-500'
                      : item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                    isFocused && !item.disabled && (
                      item.danger
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-gray-100 dark:bg-gray-700'
                    )
                  )}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    {item.icon && (
                      <span className="flex-shrink-0">
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                  
                  {item.shortcut && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// 选择器组件
interface SelectOption {
  value: any;
  label: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectProps {
  value?: any;
  defaultValue?: any;
  placeholder?: string;
  options: SelectOption[];
  onChange?: (value: any, option: SelectOption) => void;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  error?: boolean;
  loading?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  placeholder = '请选择',
  options,
  onChange,
  disabled = false,
  clearable = false,
  searchable = false,
  multiple = false,
  size = 'md',
  className,
  error = false,
  loading = false
}) => {
  const [internalValue, setInternalValue] = useState(value ?? defaultValue);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const currentValue = value !== undefined ? value : internalValue;

  // 过滤选项
  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        String(option.label).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // 获取显示文本
  const getDisplayText = () => {
    if (multiple && Array.isArray(currentValue)) {
      if (currentValue.length === 0) return placeholder;
      if (currentValue.length === 1) {
        const option = options.find(opt => opt.value === currentValue[0]);
        return option?.label || currentValue[0];
      }
      return `已选择 ${currentValue.length} 项`;
    }
    
    if (currentValue !== undefined && currentValue !== null) {
      const option = options.find(opt => opt.value === currentValue);
      return option?.label || currentValue;
    }
    
    return placeholder;
  };

  // 处理选择
  const handleSelect = (option: SelectOption) => {
    let newValue;
    
    if (multiple) {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      if (currentArray.includes(option.value)) {
        newValue = currentArray.filter(v => v !== option.value);
      } else {
        newValue = [...currentArray, option.value];
      }
    } else {
      newValue = option.value;
      setIsOpen(false);
    }
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      onChange(newValue, option);
    }
  };

  // 处理清除
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = multiple ? [] : undefined;
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      onChange(newValue, null as any);
    }
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  };

  // 构建下拉项
  const dropdownItems: DropdownItem[] = filteredOptions.map(option => ({
    key: String(option.value),
    label: (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          {option.icon && <span>{option.icon}</span>}
          <span>{option.label}</span>
        </div>
        {multiple && Array.isArray(currentValue) && currentValue.includes(option.value) && (
          <Check className="h-4 w-4" />
        )}
      </div>
    ),
    value: option.value,
    disabled: option.disabled
  }));

  const trigger = (
    <div
      className={cn(
        'flex items-center justify-between w-full border rounded-lg bg-white cursor-pointer transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
        sizeStyles[size],
        className
      )}
    >
      <span className={cn(
        'truncate',
        currentValue === undefined || currentValue === null || 
        (Array.isArray(currentValue) && currentValue.length === 0)
          ? 'text-gray-500'
          : 'text-gray-900'
      )}>
        {getDisplayText()}
      </span>
      
      <div className="flex items-center space-x-1 ml-2">
        {clearable && currentValue !== undefined && currentValue !== null && 
         (!Array.isArray(currentValue) || currentValue.length > 0) && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            ×
          </button>
        )}
        <ChevronDown className={cn(
          'h-4 w-4 text-gray-400 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </div>
    </div>
  );

  return (
    <Dropdown
      trigger={trigger}
      items={dropdownItems}
      onSelect={(item) => {
        const option = options.find(opt => opt.value === item.value);
        if (option) {
          handleSelect(option);
        }
      }}
      disabled={disabled}
      closeOnSelect={!multiple}
      className="w-full"
    />
  );
};

export { Dropdown };
export default Dropdown;