/**
 * 响应式图片组件
 * 根据屏幕尺寸和设备像素比自动选择最适合的图片
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cdnManager } from '../../services/cdn/cdnManager';
import LazyImage from '../ui/LazyImage';
import type { ImageTransform } from '../../services/cdn/cdnManager';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  fallback?: string;
  priority?: 'high' | 'low';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
  // 响应式配置
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  // 自定义尺寸映射
  sizesConfig?: {
    mobile?: ImageTransform;
    tablet?: ImageTransform;
    desktop?: ImageTransform;
  };
  // 是否启用高DPI支持
  enableHighDPI?: boolean;
  // 最大宽度限制
  maxWidth?: number;
  // 宽高比
  aspectRatio?: number;
  // 是否填充容器
  fill?: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
  type: 'mobile' | 'tablet' | 'desktop';
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  style,
  placeholder,
  fallback,
  priority = 'low',
  onLoad,
  onError,
  onClick,
  loading = 'lazy',
  breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1920
  },
  sizesConfig,
  enableHighDPI = true,
  maxWidth,
  aspectRatio,
  fill = false
}) => {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    type: 'desktop'
  });

  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [currentTransforms, setCurrentTransforms] = useState<ImageTransform>({});

  // 获取屏幕类型
  const getScreenType = useCallback((width: number): 'mobile' | 'tablet' | 'desktop' => {
    if (width <= breakpoints.mobile!) {
      return 'mobile';
    } else if (width <= breakpoints.tablet!) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }, [breakpoints]);

  // 更新屏幕信息
  const updateScreenInfo = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const type = getScreenType(width);

    setScreenInfo({ width, height, devicePixelRatio, type });
  }, [getScreenType]);

  // 计算最佳图片尺寸
  const calculateOptimalSize = useCallback(() => {
    const { width, devicePixelRatio, type } = screenInfo;
    
    // 基础宽度
    let baseWidth = width;
    
    // 应用最大宽度限制
    if (maxWidth && baseWidth > maxWidth) {
      baseWidth = maxWidth;
    }

    // 根据屏幕类型调整
    switch (type) {
      case 'mobile':
        baseWidth = Math.min(baseWidth, 480);
        break;
      case 'tablet':
        baseWidth = Math.min(baseWidth, 768);
        break;
      case 'desktop':
        baseWidth = Math.min(baseWidth, 1200);
        break;
    }

    // 应用设备像素比
    if (enableHighDPI && devicePixelRatio > 1) {
      baseWidth *= Math.min(devicePixelRatio, 2); // 最大2倍
    }

    // 计算高度
    let baseHeight: number | undefined;
    if (aspectRatio) {
      baseHeight = baseWidth / aspectRatio;
    }

    return {
      width: Math.round(baseWidth),
      height: baseHeight ? Math.round(baseHeight) : undefined
    };
  }, [screenInfo, maxWidth, aspectRatio, enableHighDPI]);

  // 获取图片变换参数
  const getImageTransforms = useCallback((): ImageTransform => {
    const { type } = screenInfo;
    
    // 使用自定义配置
    if (sizesConfig && sizesConfig[type]) {
      return sizesConfig[type]!;
    }

    // 计算最佳尺寸
    const { width, height } = calculateOptimalSize();
    
    // 默认变换参数
    const transforms: ImageTransform = {
      width,
      height,
      format: 'webp',
      quality: 85,
      crop: 'scale'
    };

    // 根据屏幕类型调整质量
    switch (type) {
      case 'mobile':
        transforms.quality = 80;
        break;
      case 'tablet':
        transforms.quality = 85;
        break;
      case 'desktop':
        transforms.quality = 90;
        break;
    }

    return transforms;
  }, [screenInfo, sizesConfig, calculateOptimalSize]);

  // 生成响应式srcSet
  const generateSrcSet = useCallback(() => {
    const transforms = getImageTransforms();
    const baseWidth = transforms.width || 800;
    
    const sizes = [
      { width: Math.round(baseWidth * 0.5), descriptor: '0.5x' },
      { width: baseWidth, descriptor: '1x' },
      { width: Math.round(baseWidth * 1.5), descriptor: '1.5x' },
      { width: Math.round(baseWidth * 2), descriptor: '2x' }
    ];

    return sizes
      .map(size => {
        const sizeTransforms = {
          ...transforms,
          width: size.width,
          height: transforms.height ? Math.round(transforms.height * (size.width / baseWidth)) : undefined
        };
        const url = cdnManager.generateUrl(src, sizeTransforms);
        return `${url} ${size.descriptor}`;
      })
      .join(', ');
  }, [src, getImageTransforms]);

  // 生成sizes属性
  const generateSizes = useCallback(() => {
    const { type } = screenInfo;
    
    switch (type) {
      case 'mobile':
        return '(max-width: 480px) 100vw, 480px';
      case 'tablet':
        return '(max-width: 768px) 100vw, 768px';
      case 'desktop':
      default:
        return maxWidth ? `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px` : '100vw';
    }
  }, [screenInfo, maxWidth]);

  // 更新优化后的图片源
  useEffect(() => {
    const transforms = getImageTransforms();
    const newSrc = cdnManager.generateUrl(src, transforms);
    
    setOptimizedSrc(newSrc);
    setCurrentTransforms(transforms);
  }, [src, getImageTransforms]);

  // 监听窗口大小变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateScreenInfo();

    const handleResize = () => {
      updateScreenInfo();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateScreenInfo]);

  // 计算容器样式
  const containerStyle: React.CSSProperties = {
    ...style,
    ...(fill && {
      width: '100%',
      height: '100%'
    }),
    ...(aspectRatio && !fill && {
      aspectRatio: aspectRatio.toString()
    })
  };

  // 计算图片样式
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    ...(fill && {
      height: '100%',
      objectFit: 'cover'
    })
  };

  return (
    <div 
      className={`responsive-image-container ${className}`}
      style={containerStyle}
    >
      <LazyImage
        src={optimizedSrc}
        alt={alt}
        style={imageStyle}
        placeholder={placeholder}
        fallback={fallback}
        priority={priority}
        onLoad={onLoad}
        onError={onError}
        onClick={onClick}
        loading={loading}
        responsive={true}
        transforms={currentTransforms}
      />
      
      {/* 用于SEO和可访问性的picture元素 */}
      <picture style={{ display: 'none' }}>
        <source
          media={`(max-width: ${breakpoints.mobile}px)`}
          srcSet={generateSrcSet()}
          sizes={generateSizes()}
        />
        <source
          media={`(max-width: ${breakpoints.tablet}px)`}
          srcSet={generateSrcSet()}
          sizes={generateSizes()}
        />
        <source
          srcSet={generateSrcSet()}
          sizes={generateSizes()}
        />
        <img src={optimizedSrc} alt={alt} />
      </picture>
    </div>
  );
};

// 预设配置
export const ResponsiveImagePresets = {
  // 头像
  avatar: {
    breakpoints: { mobile: 768, tablet: 1024, desktop: 1920 },
    sizesConfig: {
      mobile: { width: 64, height: 64, quality: 85, format: 'webp' as const },
      tablet: { width: 80, height: 80, quality: 90, format: 'webp' as const },
      desktop: { width: 100, height: 100, quality: 95, format: 'webp' as const }
    },
    aspectRatio: 1
  },
  
  // 博客封面
  blogCover: {
    breakpoints: { mobile: 768, tablet: 1024, desktop: 1920 },
    sizesConfig: {
      mobile: { width: 400, height: 225, quality: 80, format: 'webp' as const },
      tablet: { width: 600, height: 338, quality: 85, format: 'webp' as const },
      desktop: { width: 800, height: 450, quality: 90, format: 'webp' as const }
    },
    aspectRatio: 16/9
  },
  
  // 文章内图片
  articleImage: {
    breakpoints: { mobile: 768, tablet: 1024, desktop: 1920 },
    maxWidth: 1200,
    enableHighDPI: true
  },
  
  // 缩略图
  thumbnail: {
    breakpoints: { mobile: 768, tablet: 1024, desktop: 1920 },
    sizesConfig: {
      mobile: { width: 150, height: 150, quality: 80, format: 'webp' as const },
      tablet: { width: 200, height: 200, quality: 85, format: 'webp' as const },
      desktop: { width: 250, height: 250, quality: 90, format: 'webp' as const }
    },
    aspectRatio: 1
  }
};

export default ResponsiveImage;
export type { ResponsiveImageProps, ScreenInfo };