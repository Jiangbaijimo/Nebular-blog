/**
 * 性能优化配置
 * 集中管理所有性能相关的配置和策略
 */

export interface PerformanceConfig {
  // 代码分割配置
  codeSplitting: {
    enabled: boolean;
    chunkSizeWarningLimit: number;
    preloadStrategy: 'aggressive' | 'conservative' | 'minimal';
    routePreloading: boolean;
  };
  
  // 虚拟滚动配置
  virtualScroll: {
    enabled: boolean;
    itemHeight: number;
    bufferSize: number;
    overscan: number;
  };
  
  // 图片优化配置
  imageOptimization: {
    lazyLoading: boolean;
    preloading: boolean;
    compression: {
      enabled: boolean;
      quality: number;
      format: 'webp' | 'jpeg' | 'png' | 'auto';
    };
    responsive: boolean;
    placeholder: 'blur' | 'skeleton' | 'none';
  };
  
  // 动画性能配置
  animation: {
    enabled: boolean;
    reducedMotion: boolean;
    fps: number;
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: string;
  };
  
  // 缓存配置
  cache: {
    serviceWorker: {
      enabled: boolean;
      strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate';
      maxAge: number;
    };
    memory: {
      enabled: boolean;
      maxSize: number;
      ttl: number;
    };
    localStorage: {
      enabled: boolean;
      maxSize: number;
      compression: boolean;
    };
  };
  
  // 网络优化配置
  network: {
    prefetch: {
      enabled: boolean;
      routes: string[];
      resources: string[];
    };
    preconnect: {
      enabled: boolean;
      domains: string[];
    };
    compression: {
      enabled: boolean;
      algorithm: 'gzip' | 'brotli' | 'deflate';
    };
  };
  
  // 监控配置
  monitoring: {
    enabled: boolean;
    webVitals: boolean;
    customMetrics: boolean;
    reportingInterval: number;
    thresholds: {
      fcp: number; // First Contentful Paint
      lcp: number; // Largest Contentful Paint
      fid: number; // First Input Delay
      cls: number; // Cumulative Layout Shift
      ttfb: number; // Time to First Byte
    };
  };
}

// 默认性能配置
export const defaultPerformanceConfig: PerformanceConfig = {
  codeSplitting: {
    enabled: true,
    chunkSizeWarningLimit: 1000,
    preloadStrategy: 'conservative',
    routePreloading: true,
  },
  
  virtualScroll: {
    enabled: true,
    itemHeight: 200,
    bufferSize: 5,
    overscan: 3,
  },
  
  imageOptimization: {
    lazyLoading: true,
    preloading: true,
    compression: {
      enabled: true,
      quality: 0.8,
      format: 'auto',
    },
    responsive: true,
    placeholder: 'skeleton',
  },
  
  animation: {
    enabled: true,
    reducedMotion: false,
    fps: 60,
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  cache: {
    serviceWorker: {
      enabled: true,
      strategy: 'staleWhileRevalidate',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    memory: {
      enabled: true,
      maxSize: 100 * 1024 * 1024, // 100MB
      ttl: 30 * 60 * 1000, // 30 minutes
    },
    localStorage: {
      enabled: true,
      maxSize: 50 * 1024 * 1024, // 50MB
      compression: true,
    },
  },
  
  network: {
    prefetch: {
      enabled: true,
      routes: ['/blog', '/editor', '/admin'],
      resources: [],
    },
    preconnect: {
      enabled: true,
      domains: [],
    },
    compression: {
      enabled: true,
      algorithm: 'gzip',
    },
  },
  
  monitoring: {
    enabled: true,
    webVitals: true,
    customMetrics: true,
    reportingInterval: 30000, // 30 seconds
    thresholds: {
      fcp: 1800, // 1.8s
      lcp: 2500, // 2.5s
      fid: 100,  // 100ms
      cls: 0.1,  // 0.1
      ttfb: 800, // 800ms
    },
  },
};

// 性能配置管理器
export class PerformanceConfigManager {
  private config: PerformanceConfig;
  private listeners: Set<(config: PerformanceConfig) => void> = new Set();
  
  constructor(initialConfig?: Partial<PerformanceConfig>) {
    this.config = {
      ...defaultPerformanceConfig,
      ...initialConfig,
    };
    
    // 从本地存储加载配置
    this.loadFromStorage();
    
    // 监听系统偏好设置变化
    this.setupSystemPreferenceListeners();
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
    
    this.saveToStorage();
    this.notifyListeners();
  }
  
  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = { ...defaultPerformanceConfig };
    this.saveToStorage();
    this.notifyListeners();
  }
  
  /**
   * 添加配置变化监听器
   */
  addListener(listener: (config: PerformanceConfig) => void): () => void {
    this.listeners.add(listener);
    
    // 返回移除监听器的函数
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * 获取针对设备的优化配置
   */
  getDeviceOptimizedConfig(): PerformanceConfig {
    const config = { ...this.config };
    
    // 根据设备性能调整配置
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const connectionType = (navigator as any).connection?.effectiveType || '4g';
    
    // 低端设备优化
    if (deviceMemory <= 2 || hardwareConcurrency <= 2) {
      config.virtualScroll.bufferSize = 3;
      config.virtualScroll.overscan = 1;
      config.animation.fps = 30;
      config.cache.memory.maxSize = 50 * 1024 * 1024; // 50MB
      config.imageOptimization.compression.quality = 0.6;
    }
    
    // 慢网络优化
    if (connectionType === '2g' || connectionType === 'slow-2g') {
      config.imageOptimization.compression.quality = 0.5;
      config.network.prefetch.enabled = false;
      config.cache.serviceWorker.strategy = 'cacheFirst';
    }
    
    return config;
  }
  
  /**
   * 从本地存储加载配置
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('performance-config');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.config = {
          ...defaultPerformanceConfig,
          ...parsedConfig,
        };
      }
    } catch (error) {
      console.warn('Failed to load performance config from storage:', error);
    }
  }
  
  /**
   * 保存配置到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('performance-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save performance config to storage:', error);
    }
  }
  
  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error in performance config listener:', error);
      }
    });
  }
  
  /**
   * 设置系统偏好设置监听器
   */
  private setupSystemPreferenceListeners(): void {
    // 监听减少动画偏好设置
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      this.updateConfig({
        animation: {
          ...this.config.animation,
          reducedMotion: e.matches,
        },
      });
    };
    
    mediaQuery.addEventListener('change', handleReducedMotionChange);
    
    // 初始设置
    if (mediaQuery.matches) {
      this.config.animation.reducedMotion = true;
    }
  }
}

// 全局性能配置管理器实例
export const performanceConfigManager = new PerformanceConfigManager();

/**
 * 获取当前性能配置
 */
export function getPerformanceConfig(): PerformanceConfig {
  return performanceConfigManager.getConfig();
}

/**
 * 更新性能配置
 */
export function updatePerformanceConfig(updates: Partial<PerformanceConfig>): void {
  performanceConfigManager.updateConfig(updates);
}

/**
 * 获取设备优化的性能配置
 */
export function getDeviceOptimizedConfig(): PerformanceConfig {
  return performanceConfigManager.getDeviceOptimizedConfig();
}

/**
 * 监听性能配置变化
 */
export function onPerformanceConfigChange(
  listener: (config: PerformanceConfig) => void
): () => void {
  return performanceConfigManager.addListener(listener);
}

/**
 * 检查是否应该启用某个性能功能
 */
export function shouldEnableFeature(feature: keyof PerformanceConfig): boolean {
  const config = getPerformanceConfig();
  const featureConfig = config[feature] as any;
  
  if (typeof featureConfig === 'object' && 'enabled' in featureConfig) {
    return featureConfig.enabled;
  }
  
  return true;
}

/**
 * 获取性能阈值
 */
export function getPerformanceThresholds() {
  return getPerformanceConfig().monitoring.thresholds;
}

/**
 * 检查当前设备是否为低端设备
 */
export function isLowEndDevice(): boolean {
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  
  return deviceMemory <= 2 || hardwareConcurrency <= 2;
}

/**
 * 检查当前网络是否为慢网络
 */
export function isSlowNetwork(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return false;
  
  const slowTypes = ['2g', 'slow-2g'];
  return slowTypes.includes(connection.effectiveType);
}

/**
 * 获取推荐的图片质量
 */
export function getRecommendedImageQuality(): number {
  const config = getPerformanceConfig();
  let quality = config.imageOptimization.compression.quality;
  
  // 根据设备和网络条件调整
  if (isLowEndDevice()) {
    quality = Math.min(quality, 0.6);
  }
  
  if (isSlowNetwork()) {
    quality = Math.min(quality, 0.5);
  }
  
  return quality;
}

/**
 * 获取推荐的动画帧率
 */
export function getRecommendedFPS(): number {
  const config = getPerformanceConfig();
  
  if (config.animation.reducedMotion) {
    return 0; // 禁用动画
  }
  
  if (isLowEndDevice()) {
    return 30;
  }
  
  return config.animation.fps;
}