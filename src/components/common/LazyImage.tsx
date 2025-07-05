/**
 * 图片懒加载组件
 * 支持响应式图片、CDN优化、加载状态、错误回退等功能
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cdnManager } from '../../services/cdn/cdnManager';
import type { ImageTransform } from '../../services/cdn/cdnManager';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  placeholder?: string;
  fallback?: string;
  transforms?: ImageTransform;
  preset?: string;
  responsive?: boolean;
  priority?: 'high' | 'low';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
  crossOrigin?: 'anonymous' | 'use-credentials';
  decoding?: 'async' | 'sync' | 'auto';
}

interface LazyImageState {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  currentSrc: string;
  isInView: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  style,
  width,
  height,
  placeholder = '/images/placeholder.svg',
  fallback,
  transforms,
  preset,
  responsive = false,
  priority = 'low',
  onLoad,
  onError,
  onClick,
  loading = 'lazy',
  crossOrigin,
  decoding = 'async'
}) => {
  const [state, setState] = useState<LazyImageState>({
    isLoaded: false,
    isLoading: false,
    hasError: false,
    currentSrc: placeholder,
    isInView: false
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // 获取优化后的图片URL
  const getOptimizedSrc = useCallback(() => {
    if (preset) {
      return cdnManager.getPresetUrl(src, preset);
    }
    if (transforms) {
      return cdnManager.generateUrl(src, transforms);
    }
    return cdnManager.generateUrl(src);
  }, [src, preset, transforms]);

  // 获取响应式图片源集
  const getResponsiveSrcSet = useCallback(() => {
    if (!responsive) return undefined;

    const urls = cdnManager.getResponsiveUrls(src);
    const srcSet = [
      `${urls.small} 300w`,
      `${urls.medium} 600w`,
      `${urls.large} 1200w`
    ].join(', ');

    return srcSet;
  }, [src, responsive]);

  // 获取响应式尺寸
  const getResponsiveSizes = useCallback(() => {
    if (!responsive) return undefined;

    return '(max-width: 300px) 300px, (max-width: 600px) 600px, 1200px';
  }, [responsive]);

  // 加载图片
  const loadImage = useCallback(async () => {
    if (state.isLoading || state.isLoaded) return;

    setState(prev => ({ ...prev, isLoading: true, hasError: false }));

    try {
      const optimizedSrc = getOptimizedSrc();
      
      // 检查图片是否可用
      const isAvailable = await cdnManager.checkImageAvailability(optimizedSrc);
      
      if (!isAvailable) {
        throw new Error('Image not available');
      }

      // 预加载图片
      await cdnManager.preloadImage(optimizedSrc, priority);

      setState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        currentSrc: optimizedSrc,
        hasError: false
      }));

      onLoad?.();
      retryCountRef.current = 0;
    } catch (error) {
      console.warn('Failed to load image:', error);
      
      // 重试逻辑
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => {
          setState(prev => ({ ...prev, isLoading: false }));
          loadImage();
        }, 1000 * retryCountRef.current);
        return;
      }

      // 使用回退图片
      const fallbackSrc = fallback || cdnManager.getFallbackUrl(src);
      
      setState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        currentSrc: fallbackSrc,
        hasError: true
      }));

      onError?.(error as Error);
    }
  }, [src, state.isLoading, state.isLoaded, getOptimizedSrc, priority, onLoad, onError, fallback]);

  // 设置Intersection Observer
  useEffect(() => {
    if (loading === 'eager') {
      setState(prev => ({ ...prev, isInView: true }));
      return;
    }

    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, isInView: true }));
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading]);

  // 当图片进入视口时开始加载
  useEffect(() => {
    if (state.isInView && !state.isLoaded && !state.isLoading) {
      loadImage();
    }
  }, [state.isInView, state.isLoaded, state.isLoading, loadImage]);

  // 重试加载
  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    setState(prev => ({
      ...prev,
      isLoaded: false,
      isLoading: false,
      hasError: false,
      currentSrc: placeholder
    }));
    loadImage();
  }, [loadImage, placeholder]);

  // 处理图片加载完成
  const handleImageLoad = useCallback(() => {
    if (!state.isLoaded) {
      setState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        hasError: false
      }));
      onLoad?.();
    }
  }, [state.isLoaded, onLoad]);

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      setTimeout(handleRetry, 1000 * retryCountRef.current);
    } else {
      const fallbackSrc = fallback || cdnManager.getFallbackUrl(src);
      setState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        currentSrc: fallbackSrc,
        hasError: true
      }));
      onError?.(new Error('Failed to load image after retries'));
    }
  }, [handleRetry, fallback, src, onError]);

  // 计算样式
  const imageStyle: React.CSSProperties = {
    ...style,
    opacity: state.isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    ...(width && { width }),
    ...(height && { height })
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    ...(width && { width }),
    ...(height && { height })
  };

  return (
    <div style={containerStyle} className={`lazy-image-container ${className}`}>
      {/* 占位符 */}
      {!state.isLoaded && (
        <div
          className="lazy-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px'
          }}
        >
          {state.isLoading ? (
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
          ) : (
            <span>加载中...</span>
          )}
        </div>
      )}

      {/* 主图片 */}
      <img
        ref={imgRef}
        src={state.currentSrc}
        alt={alt}
        style={imageStyle}
        srcSet={getResponsiveSrcSet()}
        sizes={getResponsiveSizes()}
        loading={loading}
        crossOrigin={crossOrigin}
        decoding={decoding}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onClick={onClick}
        className="lazy-image"
      />

      {/* 错误状态 */}
      {state.hasError && (
        <div
          className="lazy-image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '12px',
            cursor: 'pointer'
          }}
          onClick={handleRetry}
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
          <span>点击重试</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
export type { LazyImageProps };