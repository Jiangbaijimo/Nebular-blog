import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  estimatedItemHeight?: number;
  dynamicHeight?: boolean;
  scrollToIndex?: number;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
}

interface ItemMeasurement {
  height: number;
  offset: number;
}

const VirtualScroll = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  onEndReached,
  endReachedThreshold = 0.8,
  loading = false,
  loadingComponent,
  emptyComponent,
  estimatedItemHeight,
  dynamicHeight = false,
  scrollToIndex,
  scrollToAlignment = 'auto'
}: VirtualScrollProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [measurements, setMeasurements] = useState<Map<number, ItemMeasurement>>(new Map());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 };
    }

    let start = 0;
    let end = items.length - 1;

    if (dynamicHeight && measurements.size > 0) {
      // 动态高度计算
      let accumulatedHeight = 0;
      start = 0;
      
      for (let i = 0; i < items.length; i++) {
        const measurement = measurements.get(i);
        const height = measurement?.height || estimatedItemHeight || itemHeight;
        
        if (accumulatedHeight + height > scrollTop) {
          start = Math.max(0, i - overscan);
          break;
        }
        
        accumulatedHeight += height;
      }

      accumulatedHeight = 0;
      for (let i = start; i < items.length; i++) {
        const measurement = measurements.get(i);
        const height = measurement?.height || estimatedItemHeight || itemHeight;
        
        if (accumulatedHeight > containerHeight + overscan * (estimatedItemHeight || itemHeight)) {
          end = i;
          break;
        }
        
        accumulatedHeight += height;
      }
    } else {
      // 固定高度计算
      start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      end = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );
    }

    return { start, end };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan, dynamicHeight, measurements, estimatedItemHeight]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (dynamicHeight && measurements.size > 0) {
      let height = 0;
      for (let i = 0; i < items.length; i++) {
        const measurement = measurements.get(i);
        height += measurement?.height || estimatedItemHeight || itemHeight;
      }
      return height;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, dynamicHeight, measurements, estimatedItemHeight]);

  // 计算偏移量
  const getItemOffset = useCallback((index: number): number => {
    if (dynamicHeight && measurements.size > 0) {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        const measurement = measurements.get(i);
        offset += measurement?.height || estimatedItemHeight || itemHeight;
      }
      return offset;
    }
    return index * itemHeight;
  }, [itemHeight, dynamicHeight, measurements, estimatedItemHeight]);

  // 滚动处理
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // 清除之前的超时
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 设置新的超时
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    // 调用外部滚动回调
    onScroll?.(newScrollTop);

    // 检查是否到达底部
    if (onEndReached) {
      const { scrollHeight, clientHeight } = event.currentTarget;
      const scrollPercentage = (newScrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage >= endReachedThreshold) {
        onEndReached();
      }
    }
  }, [onScroll, onEndReached, endReachedThreshold]);

  // 测量项目高度
  const measureItem = useCallback((index: number, element: HTMLDivElement) => {
    if (!dynamicHeight) return;

    const height = element.getBoundingClientRect().height;
    const offset = getItemOffset(index);

    setMeasurements(prev => {
      const newMeasurements = new Map(prev);
      newMeasurements.set(index, { height, offset });
      return newMeasurements;
    });
  }, [dynamicHeight, getItemOffset]);

  // 设置项目引用
  const setItemRef = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(index, element);
      measureItem(index, element);
    } else {
      itemRefs.current.delete(index);
    }
  }, [measureItem]);

  // 滚动到指定索引
  const scrollToItem = useCallback((index: number, alignment: 'start' | 'center' | 'end' | 'auto' = 'auto') => {
    if (!scrollElementRef.current || index < 0 || index >= items.length) {
      return;
    }

    const itemOffset = getItemOffset(index);
    const itemHeight = measurements.get(index)?.height || estimatedItemHeight || itemHeight;
    
    let scrollTop = itemOffset;

    switch (alignment) {
      case 'center':
        scrollTop = itemOffset - (containerHeight - itemHeight) / 2;
        break;
      case 'end':
        scrollTop = itemOffset - containerHeight + itemHeight;
        break;
      case 'auto':
        const currentScrollTop = scrollElementRef.current.scrollTop;
        const itemStart = itemOffset;
        const itemEnd = itemOffset + itemHeight;
        const viewStart = currentScrollTop;
        const viewEnd = currentScrollTop + containerHeight;

        if (itemStart < viewStart) {
          scrollTop = itemStart;
        } else if (itemEnd > viewEnd) {
          scrollTop = itemEnd - containerHeight;
        } else {
          return; // 项目已经可见，不需要滚动
        }
        break;
    }

    scrollElementRef.current.scrollTo({
      top: Math.max(0, Math.min(scrollTop, totalHeight - containerHeight)),
      behavior: 'smooth'
    });
  }, [items.length, getItemOffset, measurements, estimatedItemHeight, itemHeight, containerHeight, totalHeight]);

  // 处理滚动到指定索引
  useEffect(() => {
    if (scrollToIndex !== undefined) {
      scrollToItem(scrollToIndex, scrollToAlignment);
    }
  }, [scrollToIndex, scrollToAlignment, scrollToItem]);

  // 设置 ResizeObserver
  useEffect(() => {
    if (!dynamicHeight) return;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLDivElement;
        const index = parseInt(element.dataset.index || '-1', 10);
        
        if (index >= 0) {
          measureItem(index, element);
        }
      }
    });

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [dynamicHeight, measureItem]);

  // 观察可见项目的尺寸变化
  useEffect(() => {
    if (!dynamicHeight || !resizeObserverRef.current) return;

    // 取消观察所有元素
    resizeObserverRef.current.disconnect();

    // 观察当前可见的元素
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const element = itemRefs.current.get(i);
      if (element) {
        resizeObserverRef.current.observe(element);
      }
    }
  }, [visibleRange, dynamicHeight]);

  // 清理
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= items.length) break;
      
      const item = items[i];
      const offset = getItemOffset(i);
      
      items_to_render.push(
        <motion.div
          key={i}
          data-index={i}
          ref={(el) => setItemRef(i, el)}
          style={{
            position: 'absolute',
            top: offset,
            left: 0,
            right: 0,
            minHeight: dynamicHeight ? 'auto' : itemHeight,
          }}
          initial={isScrolling ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: (i - visibleRange.start) * 0.02 }}
        >
          {renderItem(item, i)}
        </motion.div>
      );
    }
    
    return items_to_render;
  }, [visibleRange, items, getItemOffset, dynamicHeight, itemHeight, renderItem, setItemRef, isScrolling]);

  // 空状态
  if (items.length === 0 && !loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        {emptyComponent || (
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">暂无数据</p>
            <p className="text-sm mt-1">没有找到任何项目</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* 虚拟容器 */}
        <div
          className="relative"
          style={{ height: totalHeight }}
        >
          <AnimatePresence mode="popLayout">
            {visibleItems}
          </AnimatePresence>
        </div>
        
        {/* 加载指示器 */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            {loadingComponent || (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">加载中...</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 滚动指示器 */}
      {items.length > 0 && (
        <div className="absolute right-2 top-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {Math.ceil((scrollTop + containerHeight) / totalHeight * 100)}%
        </div>
      )}
    </div>
  );
};

// 虚拟滚动 Hook
export const useVirtualScroll = <T,>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start, end };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan]);
  
  const totalHeight = items.length * itemHeight;
  
  const getItemOffset = useCallback((index: number) => {
    return index * itemHeight;
  }, [itemHeight]);
  
  return {
    visibleRange,
    totalHeight,
    scrollTop,
    setScrollTop,
    getItemOffset,
  };
};

// 虚拟网格组件
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
}

export const VirtualGrid = <T,>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 0,
  className = '',
}: VirtualGridProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const columnsCount = Math.floor(containerWidth / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);
  const totalHeight = rowsCount * (itemHeight + gap) - gap;
  
  const visibleStartRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 1);
  const visibleEndRow = Math.min(
    rowsCount - 1,
    Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + 1
  );
  
  const visibleItems = [];
  
  for (let row = visibleStartRow; row <= visibleEndRow; row++) {
    for (let col = 0; col < columnsCount; col++) {
      const index = row * columnsCount + col;
      if (index >= items.length) break;
      
      const item = items[index];
      const x = col * (itemWidth + gap);
      const y = row * (itemHeight + gap);
      
      visibleItems.push(
        <div
          key={index}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: itemWidth,
            height: itemHeight,
          }}
        >
          {renderItem(item, index)}
        </div>
      );
    }
  }
  
  return (
    <div className={className}>
      <div
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div
          className="relative"
          style={{ height: totalHeight }}
        >
          {visibleItems}
        </div>
      </div>
    </div>
  );
};

export default VirtualScroll;