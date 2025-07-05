import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartBarIcon, CpuChipIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// 性能指标接口
interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  
  // 自定义指标
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // 网络指标
  networkInfo: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  
  // 渲染性能
  renderMetrics: {
    componentCount: number;
    rerenderCount: number;
    averageRenderTime: number;
    slowComponents: Array<{
      name: string;
      renderTime: number;
      rerenderCount: number;
    }>;
  };
  
  // 资源加载
  resourceMetrics: {
    totalResources: number;
    loadedResources: number;
    failedResources: number;
    totalSize: number;
    loadTime: number;
  };
}

// 性能警告接口
interface PerformanceWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  suggestions: string[];
}

// 性能监控 Hook
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [warnings, setWarnings] = useState<PerformanceWarning[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renderTimesRef = useRef<Map<string, number[]>>(new Map());
  
  // 性能阈值配置
  const thresholds = {
    fcp: 1800, // 1.8s
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    ttfb: 800, // 800ms
    memoryUsage: 80, // 80%
    renderTime: 16, // 16ms (60fps)
  };

  // 收集 Core Web Vitals
  const collectWebVitals = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    // FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp && metricsRef.current) {
        metricsRef.current.fcp = fcp.startTime;
        checkThreshold('fcp', fcp.startTime, thresholds.fcp);
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && metricsRef.current) {
        metricsRef.current.lcp = lastEntry.startTime;
        checkThreshold('lcp', lastEntry.startTime, thresholds.lcp);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (metricsRef.current) {
          metricsRef.current.fid = entry.processingStart - entry.startTime;
          checkThreshold('fid', entry.processingStart - entry.startTime, thresholds.fid);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          if (metricsRef.current) {
            metricsRef.current.cls = clsValue;
            checkThreshold('cls', clsValue, thresholds.cls);
          }
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Navigation Timing (TTFB)
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0 && metricsRef.current) {
      const ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
      metricsRef.current.ttfb = ttfb;
      checkThreshold('ttfb', ttfb, thresholds.ttfb);
    }

    observerRef.current = lcpObserver; // 保存一个引用用于清理
  }, []);

  // 收集内存使用情况
  const collectMemoryMetrics = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
      
      if (metricsRef.current) {
        metricsRef.current.memoryUsage = memoryUsage;
        checkThreshold('memoryUsage', memoryUsage.percentage, thresholds.memoryUsage);
      }
    }
  }, []);

  // 收集网络信息
  const collectNetworkMetrics = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const networkInfo = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      };
      
      if (metricsRef.current) {
        metricsRef.current.networkInfo = networkInfo;
      }
    }
  }, []);

  // 收集资源加载指标
  const collectResourceMetrics = useCallback(() => {
    const resources = performance.getEntriesByType('resource');
    const resourceMetrics = {
      totalResources: resources.length,
      loadedResources: resources.filter(r => r.duration > 0).length,
      failedResources: resources.filter(r => r.duration === 0).length,
      totalSize: resources.reduce((sum, r: any) => sum + (r.transferSize || 0), 0),
      loadTime: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length,
    };
    
    if (metricsRef.current) {
      metricsRef.current.resourceMetrics = resourceMetrics;
    }
  }, []);

  // 记录组件渲染时间
  const recordRenderTime = useCallback((componentName: string, renderTime: number) => {
    const times = renderTimesRef.current.get(componentName) || [];
    times.push(renderTime);
    
    // 只保留最近的100次记录
    if (times.length > 100) {
      times.shift();
    }
    
    renderTimesRef.current.set(componentName, times);
    
    // 检查渲染性能
    if (renderTime > thresholds.renderTime) {
      checkThreshold('renderTime', renderTime, thresholds.renderTime, componentName);
    }
  }, []);

  // 收集渲染指标
  const collectRenderMetrics = useCallback(() => {
    const componentCount = renderTimesRef.current.size;
    let totalRenderTime = 0;
    let totalRerenderCount = 0;
    const slowComponents: Array<{ name: string; renderTime: number; rerenderCount: number }> = [];
    
    for (const [componentName, times] of renderTimesRef.current.entries()) {
      const avgRenderTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      totalRenderTime += avgRenderTime;
      totalRerenderCount += times.length;
      
      if (avgRenderTime > thresholds.renderTime) {
        slowComponents.push({
          name: componentName,
          renderTime: avgRenderTime,
          rerenderCount: times.length,
        });
      }
    }
    
    const renderMetrics = {
      componentCount,
      rerenderCount: totalRerenderCount,
      averageRenderTime: componentCount > 0 ? totalRenderTime / componentCount : 0,
      slowComponents: slowComponents.sort((a, b) => b.renderTime - a.renderTime).slice(0, 10),
    };
    
    if (metricsRef.current) {
      metricsRef.current.renderMetrics = renderMetrics;
    }
  }, []);

  // 检查性能阈值
  const checkThreshold = useCallback((
    metric: string,
    value: number,
    threshold: number,
    context?: string
  ) => {
    if (value > threshold) {
      const warning: PerformanceWarning = {
        id: `${metric}-${Date.now()}`,
        type: value > threshold * 1.5 ? 'error' : 'warning',
        metric,
        value,
        threshold,
        message: `${metric}${context ? ` (${context})` : ''} 超过阈值: ${value.toFixed(2)} > ${threshold}`,
        timestamp: Date.now(),
        suggestions: getSuggestions(metric, value, threshold),
      };
      
      setWarnings(prev => {
        const filtered = prev.filter(w => w.metric !== metric || Date.now() - w.timestamp > 5000);
        return [...filtered, warning].slice(-10); // 只保留最近的10个警告
      });
    }
  }, []);

  // 获取性能建议
  const getSuggestions = (metric: string, value: number, threshold: number): string[] => {
    const suggestions: { [key: string]: string[] } = {
      fcp: [
        '优化关键渲染路径',
        '减少阻塞渲染的资源',
        '使用服务端渲染或预渲染',
        '优化字体加载策略',
      ],
      lcp: [
        '优化图片加载和压缩',
        '使用 CDN 加速资源加载',
        '预加载关键资源',
        '减少服务器响应时间',
      ],
      fid: [
        '减少 JavaScript 执行时间',
        '使用 Web Workers 处理复杂计算',
        '优化事件处理器',
        '延迟加载非关键 JavaScript',
      ],
      cls: [
        '为图片和视频设置尺寸属性',
        '避免在现有内容上方插入内容',
        '使用 transform 动画而非改变布局的属性',
        '预留广告位空间',
      ],
      ttfb: [
        '优化服务器性能',
        '使用 CDN',
        '启用服务器缓存',
        '优化数据库查询',
      ],
      memoryUsage: [
        '清理未使用的变量和事件监听器',
        '优化图片和媒体资源',
        '使用虚拟滚动减少 DOM 节点',
        '实现组件懒加载',
      ],
      renderTime: [
        '使用 React.memo 避免不必要的重渲染',
        '优化组件结构和逻辑',
        '使用 useMemo 和 useCallback',
        '分割大型组件',
      ],
    };
    
    return suggestions[metric] || ['检查相关性能最佳实践'];
  };

  // 收集所有指标
  const collectAllMetrics = useCallback(() => {
    if (!metricsRef.current) {
      metricsRef.current = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        networkInfo: { effectiveType: 'unknown', downlink: 0, rtt: 0, saveData: false },
        renderMetrics: { componentCount: 0, rerenderCount: 0, averageRenderTime: 0, slowComponents: [] },
        resourceMetrics: { totalResources: 0, loadedResources: 0, failedResources: 0, totalSize: 0, loadTime: 0 },
      };
    }
    
    collectMemoryMetrics();
    collectNetworkMetrics();
    collectResourceMetrics();
    collectRenderMetrics();
    
    setMetrics({ ...metricsRef.current });
  }, [collectMemoryMetrics, collectNetworkMetrics, collectResourceMetrics, collectRenderMetrics]);

  // 开始监控
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    collectWebVitals();
    collectAllMetrics();
    
    // 定期收集指标
    intervalRef.current = setInterval(collectAllMetrics, 5000);
  }, [isMonitoring, collectWebVitals, collectAllMetrics]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // 清除警告
  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  // 导出性能报告
  const exportReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: metricsRef.current,
      warnings: warnings,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [warnings]);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    metrics,
    warnings,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearWarnings,
    exportReport,
    recordRenderTime,
  };
};

// 性能监控组件
interface PerformanceMonitorProps {
  className?: string;
  autoStart?: boolean;
  showWarnings?: boolean;
  showMetrics?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  autoStart = true,
  showWarnings = true,
  showMetrics = true,
  position = 'bottom-right',
  minimized: initialMinimized = false,
}) => {
  const {
    metrics,
    warnings,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearWarnings,
    exportReport,
  } = usePerformanceMonitor();
  
  const [minimized, setMinimized] = useState(initialMinimized);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'vitals' | 'resources' | 'warnings'>('overview');

  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }
  }, [autoStart, startMonitoring]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getMetricColor = (value: number, threshold: number) => {
    if (value <= threshold) return 'text-green-600';
    if (value <= threshold * 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (minimized) {
    return (
      <motion.div
        className={`fixed ${positionClasses[position]} z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <button
          onClick={() => setMinimized(false)}
          className="bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        >
          <ChartBarIcon className="w-5 h-5" />
          {warnings.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {warnings.length}
            </span>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-50 bg-white rounded-lg shadow-xl border max-w-md w-80 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">性能监控</h3>
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`p-1 rounded ${isMonitoring ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
          >
            {isMonitoring ? '停止' : '开始'}
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            −
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex border-b">
        {[
          { key: 'overview', label: '概览' },
          { key: 'vitals', label: 'Core Vitals' },
          { key: 'resources', label: '资源' },
          { key: 'warnings', label: `警告 (${warnings.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium ${
              selectedTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && metrics && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">内存使用</div>
                  <div className={`text-lg font-semibold ${getMetricColor(metrics.memoryUsage.percentage, 80)}`}>
                    {metrics.memoryUsage.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatBytes(metrics.memoryUsage.used)} / {formatBytes(metrics.memoryUsage.total)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">组件数量</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {metrics.renderMetrics.componentCount}
                  </div>
                  <div className="text-xs text-gray-400">
                    平均渲染: {metrics.renderMetrics.averageRenderTime.toFixed(1)}ms
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-2">网络状态</div>
                <div className="flex justify-between text-sm">
                  <span>类型: {metrics.networkInfo.effectiveType}</span>
                  <span>RTT: {metrics.networkInfo.rtt}ms</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  下行: {metrics.networkInfo.downlink} Mbps
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'vitals' && metrics && (
            <motion.div
              key="vitals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {[
                { label: 'FCP', value: metrics.fcp, threshold: 1800, unit: 'ms' },
                { label: 'LCP', value: metrics.lcp, threshold: 2500, unit: 'ms' },
                { label: 'FID', value: metrics.fid, threshold: 100, unit: 'ms' },
                { label: 'CLS', value: metrics.cls, threshold: 0.1, unit: '' },
                { label: 'TTFB', value: metrics.ttfb, threshold: 800, unit: 'ms' },
              ].map(metric => (
                <div key={metric.label} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <span className={`text-sm font-semibold ${getMetricColor(metric.value, metric.threshold)}`}>
                    {metric.value.toFixed(metric.unit === 'ms' ? 0 : 3)}{metric.unit}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {selectedTab === 'resources' && metrics && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.resourceMetrics.totalResources}
                  </div>
                  <div className="text-xs text-gray-500">总资源</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.resourceMetrics.loadedResources}
                  </div>
                  <div className="text-xs text-gray-500">已加载</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>失败资源:</span>
                  <span className="text-red-600">{metrics.resourceMetrics.failedResources}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>总大小:</span>
                  <span>{formatBytes(metrics.resourceMetrics.totalSize)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>平均加载时间:</span>
                  <span>{formatTime(metrics.resourceMetrics.loadTime)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'warnings' && (
            <motion.div
              key="warnings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {warnings.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <div className="text-2xl mb-2">✅</div>
                  <div>暂无性能警告</div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">性能警告</span>
                    <button
                      onClick={clearWarnings}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      清除全部
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {warnings.map(warning => (
                      <div
                        key={warning.id}
                        className={`p-2 rounded border-l-4 ${
                          warning.type === 'error'
                            ? 'bg-red-50 border-red-400'
                            : warning.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-blue-50 border-blue-400'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <ExclamationTriangleIcon className={`w-4 h-4 mt-0.5 ${
                            warning.type === 'error'
                              ? 'text-red-500'
                              : warning.type === 'warning'
                              ? 'text-yellow-500'
                              : 'text-blue-500'
                          }`} />
                          <div className="flex-1">
                            <div className="text-xs font-medium">{warning.message}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(warning.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作 */}
      <div className="flex justify-between items-center p-3 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          {isMonitoring ? '监控中...' : '已停止'}
        </div>
        <button
          onClick={exportReport}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          导出报告
        </button>
      </div>
    </motion.div>
  );
};

// 性能监控 Hook 导出
export { usePerformanceMonitor };

// 组件渲染时间监控 HOC
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const PerformanceMonitoredComponent: React.FC<P> = (props) => {
    const renderStartTime = useRef<number>(0);
    
    // 记录渲染开始时间
    renderStartTime.current = performance.now();
    
    useEffect(() => {
      // 记录渲染结束时间
      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime.current;
      
      // 这里可以集成到性能监控系统
      console.log(`Component ${displayName} render time: ${renderTime.toFixed(2)}ms`);
    });
    
    return <WrappedComponent {...props} />;
  };
  
  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return PerformanceMonitoredComponent;
}

export default PerformanceMonitor;