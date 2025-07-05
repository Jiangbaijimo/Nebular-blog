/**
 * 图片加载失败回退组件
 * 提供多级回退策略和优雅的错误处理
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cdnManager } from '../../services/cdn/cdnManager';

interface FallbackSource {
  src: string;
  type: 'cdn' | 'local' | 'placeholder' | 'generated';
  priority: number;
  description?: string;
}

interface ImageFallbackProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  // 回退源列表
  fallbackSources?: FallbackSource[];
  // 是否启用自动生成占位符
  enableGeneratedPlaceholder?: boolean;
  // 占位符配置
  placeholderConfig?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    text?: string;
    showIcon?: boolean;
  };
  // 重试配置
  retryConfig?: {
    maxAttempts?: number;
    delay?: number;
    backoffMultiplier?: number;
  };
  // 事件回调
  onLoad?: () => void;
  onError?: (error: Error, source: FallbackSource) => void;
  onFallback?: (source: FallbackSource) => void;
  onClick?: () => void;
  // 加载策略
  loading?: 'lazy' | 'eager';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

interface LoadState {
  currentSourceIndex: number;
  isLoading: boolean;
  hasError: boolean;
  retryCount: number;
  loadedSrc: string;
  errorHistory: Array<{ src: string; error: string; timestamp: number }>;
}

const ImageFallback: React.FC<ImageFallbackProps> = ({
  src,
  alt,
  className = '',
  style,
  width,
  height,
  fallbackSources = [],
  enableGeneratedPlaceholder = true,
  placeholderConfig = {
    backgroundColor: '#f0f0f0',
    textColor: '#999',
    fontSize: 14,
    text: '图片加载失败',
    showIcon: true
  },
  retryConfig = {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2
  },
  onLoad,
  onError,
  onFallback,
  onClick,
  loading = 'lazy',
  crossOrigin
}) => {
  const [loadState, setLoadState] = useState<LoadState>({
    currentSourceIndex: -1,
    isLoading: true,
    hasError: false,
    retryCount: 0,
    loadedSrc: '',
    errorHistory: []
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 构建完整的源列表
  const buildSourceList = useCallback((): FallbackSource[] => {
    const sources: FallbackSource[] = [
      {
        src,
        type: 'cdn',
        priority: 1,
        description: '原始图片'
      },
      ...fallbackSources.sort((a, b) => a.priority - b.priority)
    ];

    // 添加CDN回退URL
    const cdnFallback = cdnManager.getFallbackUrl(src);
    if (cdnFallback !== src) {
      sources.push({
        src: cdnFallback,
        type: 'cdn',
        priority: 50,
        description: 'CDN回退'
      });
    }

    // 添加本地占位符
    sources.push({
      src: '/images/placeholder.svg',
      type: 'placeholder',
      priority: 90,
      description: '本地占位符'
    });

    // 添加生成的占位符
    if (enableGeneratedPlaceholder) {
      sources.push({
        src: generatePlaceholderDataUrl(),
        type: 'generated',
        priority: 100,
        description: '生成占位符'
      });
    }

    return sources;
  }, [src, fallbackSources, enableGeneratedPlaceholder]);

  // 生成占位符Data URL
  const generatePlaceholderDataUrl = useCallback((): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const w = width || 300;
    const h = height || 200;
    
    canvas.width = w;
    canvas.height = h;

    // 绘制背景
    ctx.fillStyle = placeholderConfig.backgroundColor || '#f0f0f0';
    ctx.fillRect(0, 0, w, h);

    // 绘制边框
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

    // 绘制图标
    if (placeholderConfig.showIcon) {
      const iconSize = Math.min(w, h) * 0.2;
      const iconX = (w - iconSize) / 2;
      const iconY = (h - iconSize) / 2 - 20;

      ctx.fillStyle = placeholderConfig.textColor || '#999';
      ctx.fillRect(iconX, iconY, iconSize, iconSize * 0.8);
      
      // 简单的图片图标
      ctx.fillStyle = '#fff';
      ctx.fillRect(iconX + iconSize * 0.1, iconY + iconSize * 0.1, iconSize * 0.8, iconSize * 0.6);
    }

    // 绘制文字
    if (placeholderConfig.text) {
      ctx.fillStyle = placeholderConfig.textColor || '#999';
      ctx.font = `${placeholderConfig.fontSize || 14}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textY = placeholderConfig.showIcon ? h / 2 + 30 : h / 2;
      ctx.fillText(placeholderConfig.text, w / 2, textY);
    }

    return canvas.toDataURL('image/png');
  }, [width, height, placeholderConfig]);

  // 尝试加载下一个源
  const tryNextSource = useCallback(async () => {
    const sources = buildSourceList();
    const nextIndex = loadState.currentSourceIndex + 1;

    if (nextIndex >= sources.length) {
      // 所有源都失败了
      setLoadState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));
      return;
    }

    const nextSource = sources[nextIndex];
    
    setLoadState(prev => ({
      ...prev,
      currentSourceIndex: nextIndex,
      isLoading: true,
      hasError: false,
      retryCount: 0
    }));

    onFallback?.(nextSource);
    
    // 尝试加载新源
    await loadImageSource(nextSource);
  }, [loadState.currentSourceIndex, buildSourceList, onFallback]);

  // 加载图片源
  const loadImageSource = useCallback(async (source: FallbackSource) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setLoadState(prev => ({
          ...prev,
          isLoading: false,
          hasError: false,
          loadedSrc: source.src
        }));
        onLoad?.();
        resolve();
      };

      img.onerror = () => {
        const error = new Error(`Failed to load image: ${source.src}`);
        
        setLoadState(prev => ({
          ...prev,
          errorHistory: [
            ...prev.errorHistory,
            {
              src: source.src,
              error: error.message,
              timestamp: Date.now()
            }
          ]
        }));

        onError?.(error, source);
        reject(error);
      };

      img.crossOrigin = crossOrigin || null;
      img.src = source.src;
    });
  }, [onLoad, onError, crossOrigin]);

  // 重试当前源
  const retryCurrentSource = useCallback(async () => {
    const sources = buildSourceList();
    const currentSource = sources[loadState.currentSourceIndex];
    
    if (!currentSource || loadState.retryCount >= (retryConfig.maxAttempts || 3)) {
      // 重试次数用完，尝试下一个源
      tryNextSource();
      return;
    }

    const delay = (retryConfig.delay || 1000) * Math.pow(retryConfig.backoffMultiplier || 2, loadState.retryCount);
    
    setLoadState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      isLoading: true,
      hasError: false
    }));

    retryTimeoutRef.current = setTimeout(async () => {
      try {
        await loadImageSource(currentSource);
      } catch {
        retryCurrentSource();
      }
    }, delay);
  }, [loadState.currentSourceIndex, loadState.retryCount, retryConfig, buildSourceList, tryNextSource, loadImageSource]);

  // 手动重试
  const handleManualRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    setLoadState({
      currentSourceIndex: -1,
      isLoading: true,
      hasError: false,
      retryCount: 0,
      loadedSrc: '',
      errorHistory: []
    });
  }, []);

  // 初始化加载
  useEffect(() => {
    if (loadState.currentSourceIndex === -1) {
      tryNextSource();
    }
  }, [loadState.currentSourceIndex, tryNextSource]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 处理图片加载完成
  const handleImageLoad = useCallback(() => {
    if (imgRef.current && !loadState.isLoading) {
      onLoad?.();
    }
  }, [loadState.isLoading, onLoad]);

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    if (!loadState.isLoading) {
      retryCurrentSource();
    }
  }, [loadState.isLoading, retryCurrentSource]);

  // 计算样式
  const imageStyle: React.CSSProperties = {
    ...style,
    ...(width && { width }),
    ...(height && { height }),
    display: loadState.isLoading ? 'none' : 'block'
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    ...(width && { width }),
    ...(height && { height })
  };

  return (
    <div className={`image-fallback-container ${className}`} style={containerStyle}>
      {/* 加载状态 */}
      {loadState.isLoading && (
        <div
          className="image-fallback-loading"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: placeholderConfig.backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: placeholderConfig.textColor,
            fontSize: placeholderConfig.fontSize
          }}
        >
          <div className="loading-spinner">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-spin"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        </div>
      )}

      {/* 主图片 */}
      {loadState.loadedSrc && (
        <img
          ref={imgRef}
          src={loadState.loadedSrc}
          alt={alt}
          style={imageStyle}
          loading={loading}
          crossOrigin={crossOrigin}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={onClick}
          className="image-fallback-img"
        />
      )}

      {/* 错误状态 */}
      {loadState.hasError && (
        <div
          className="image-fallback-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: placeholderConfig.backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: placeholderConfig.textColor,
            fontSize: placeholderConfig.fontSize,
            cursor: 'pointer',
            border: '1px dashed #ddd'
          }}
          onClick={handleManualRetry}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: '8px' }}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
          </svg>
          <span>加载失败，点击重试</span>
          {loadState.errorHistory.length > 0 && (
            <small style={{ marginTop: '4px', opacity: 0.7 }}>
              已尝试 {loadState.errorHistory.length} 个源
            </small>
          )}
        </div>
      )}
    </div>
  );
};

// 预设回退配置
export const FallbackPresets = {
  // 头像回退
  avatar: {
    fallbackSources: [
      {
        src: '/images/default-avatar.svg',
        type: 'local' as const,
        priority: 10,
        description: '默认头像'
      }
    ],
    placeholderConfig: {
      backgroundColor: '#f0f0f0',
      textColor: '#999',
      text: '头像',
      showIcon: true
    }
  },
  
  // 博客封面回退
  blogCover: {
    fallbackSources: [
      {
        src: '/images/default-cover.jpg',
        type: 'local' as const,
        priority: 10,
        description: '默认封面'
      }
    ],
    placeholderConfig: {
      backgroundColor: '#f8f9fa',
      textColor: '#6c757d',
      text: '封面图片',
      showIcon: true
    }
  },
  
  // 文章图片回退
  articleImage: {
    enableGeneratedPlaceholder: true,
    placeholderConfig: {
      backgroundColor: '#f8f9fa',
      textColor: '#6c757d',
      text: '图片暂时无法显示',
      showIcon: true
    }
  }
};

export default ImageFallback;
export type { ImageFallbackProps, FallbackSource, LoadState };