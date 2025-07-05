import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  threshold?: number;
  rootMargin?: string;
  enableBlur?: boolean;
  enableFadeIn?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

interface ImageState {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  retryAttempts: number;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholderSrc,
  blurDataURL,
  width,
  height,
  objectFit = 'cover',
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
  fallbackSrc,
  threshold = 0.1,
  rootMargin = '50px',
  enableBlur = true,
  enableFadeIn = true,
  retryCount = 3,
  retryDelay = 1000,
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    isLoaded: false,
    isLoading: false,
    hasError: false,
    retryAttempts: 0,
  });
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string>(placeholderSrc || blurDataURL || '');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 创建占位符图片
  const createPlaceholder = useCallback((width: number, height: number, color = '#f3f4f6') => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      
      // 添加加载图标
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${Math.min(width, height) / 8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📷', width / 2, height / 2);
    }
    return canvas.toDataURL();
  }, []);

  // 加载图片
  const loadImage = useCallback(async (imageSrc: string) => {
    if (!imageSrc || imageState.isLoading) return;

    setImageState(prev => ({ ...prev, isLoading: true, hasError: false }));

    try {
      const img = new Image();
      
      // 设置跨域属性
      img.crossOrigin = 'anonymous';
      
      // 创建 Promise 来处理图片加载
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          setCurrentSrc(imageSrc);
          setImageState(prev => ({
            ...prev,
            isLoaded: true,
            isLoading: false,
            hasError: false,
          }));
          onLoad?.();
          resolve();
        };
        
        img.onerror = () => {
          reject(new Error(`Failed to load image: ${imageSrc}`));
        };
        
        img.src = imageSrc;
      });
    } catch (error) {
      console.warn('Image load failed:', error);
      
      setImageState(prev => {
        const newRetryAttempts = prev.retryAttempts + 1;
        
        if (newRetryAttempts < retryCount) {
          // 重试加载
          retryTimeoutRef.current = setTimeout(() => {
            loadImage(imageSrc);
          }, retryDelay * newRetryAttempts);
          
          return {
            ...prev,
            isLoading: false,
            retryAttempts: newRetryAttempts,
          };
        } else {
          // 使用备用图片或显示错误状态
          if (fallbackSrc && imageSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            return {
              ...prev,
              isLoading: false,
              retryAttempts: 0,
            };
          } else {
            onError?.();
            return {
              ...prev,
              isLoaded: false,
              isLoading: false,
              hasError: true,
            };
          }
        }
      });
    }
  }, [imageState.isLoading, onLoad, onError, fallbackSrc, retryCount, retryDelay]);

  // 设置 Intersection Observer
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, loading, threshold, rootMargin]);

  // 当图片进入视口时开始加载
  useEffect(() => {
    if (isInView && src && !imageState.isLoaded && !imageState.isLoading) {
      loadImage(src);
    }
  }, [isInView, src, imageState.isLoaded, imageState.isLoading, loadImage]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 获取当前显示的图片源
  const getDisplaySrc = useCallback(() => {
    if (imageState.hasError) {
      return fallbackSrc || createPlaceholder(width || 300, height || 200, '#fee2e2');
    }
    
    if (!isInView || !imageState.isLoaded) {
      return currentSrc || createPlaceholder(width || 300, height || 200);
    }
    
    return currentSrc;
  }, [imageState.hasError, imageState.isLoaded, isInView, currentSrc, fallbackSrc, createPlaceholder, width, height]);

  // 图片样式
  const imageStyle: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    objectFit,
    filter: enableBlur && !imageState.isLoaded && !imageState.hasError ? 'blur(10px)' : 'none',
    transition: 'filter 0.3s ease-in-out',
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
    >
      <AnimatePresence mode="wait">
        {enableFadeIn ? (
          <motion.img
            key={getDisplaySrc()}
            ref={imgRef}
            src={getDisplaySrc()}
            alt={alt}
            style={imageStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            loading={loading}
          />
        ) : (
          <img
            ref={imgRef}
            src={getDisplaySrc()}
            alt={alt}
            style={imageStyle}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* 加载指示器 */}
      {imageState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">加载中...</span>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {imageState.hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-center">
            <div className="text-red-400 text-2xl mb-2">⚠️</div>
            <p className="text-sm text-red-600">图片加载失败</p>
            {imageState.retryAttempts < retryCount && (
              <button
                onClick={() => loadImage(src)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                重试 ({imageState.retryAttempts + 1}/{retryCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 重试指示器 */}
      {imageState.retryAttempts > 0 && imageState.isLoading && (
        <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
          重试中 {imageState.retryAttempts}/{retryCount}
        </div>
      )}
    </div>
  );
};

// 图片预加载 Hook
export const useImagePreloader = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback(async (src: string): Promise<boolean> => {
    if (loadedImages.has(src)) {
      return true;
    }

    if (loadingImages.has(src)) {
      // 等待正在加载的图片
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (loadedImages.has(src)) {
            resolve(true);
          } else if (failedImages.has(src)) {
            resolve(false);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    setLoadingImages(prev => new Set(prev).add(src));

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
        img.src = src;
      });

      setLoadedImages(prev => new Set(prev).add(src));
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(src);
        return newSet;
      });
      
      return true;
    } catch (error) {
      console.warn('Image preload failed:', error);
      
      setFailedImages(prev => new Set(prev).add(src));
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(src);
        return newSet;
      });
      
      return false;
    }
  }, [loadedImages, loadingImages, failedImages]);

  const preloadImages = useCallback(async (sources: string[]): Promise<boolean[]> => {
    return Promise.all(sources.map(src => preloadImage(src)));
  }, [preloadImage]);

  const isImageLoaded = useCallback((src: string): boolean => {
    return loadedImages.has(src);
  }, [loadedImages]);

  const isImageLoading = useCallback((src: string): boolean => {
    return loadingImages.has(src);
  }, [loadingImages]);

  const isImageFailed = useCallback((src: string): boolean => {
    return failedImages.has(src);
  }, [failedImages]);

  const clearCache = useCallback(() => {
    setLoadedImages(new Set());
    setLoadingImages(new Set());
    setFailedImages(new Set());
  }, []);

  return {
    preloadImage,
    preloadImages,
    isImageLoaded,
    isImageLoading,
    isImageFailed,
    clearCache,
    stats: {
      loaded: loadedImages.size,
      loading: loadingImages.size,
      failed: failedImages.size,
    },
  };
};

// 响应式图片组件
interface ResponsiveImageProps extends Omit<LazyImageProps, 'src'> {
  src: string | { [key: string]: string };
  sizes?: string;
  breakpoints?: { [key: string]: number };
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  sizes = '100vw',
  breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    if (typeof src === 'string') {
      setCurrentSrc(src);
      return;
    }

    const updateSrc = () => {
      const width = window.innerWidth;
      
      // 找到合适的断点
      const sortedBreakpoints = Object.entries(breakpoints)
        .sort(([, a], [, b]) => a - b);
      
      let selectedKey = 'default';
      
      for (const [key, breakpoint] of sortedBreakpoints) {
        if (width >= breakpoint && src[key]) {
          selectedKey = key;
        }
      }
      
      setCurrentSrc(src[selectedKey] || src.default || Object.values(src)[0]);
    };

    updateSrc();
    window.addEventListener('resize', updateSrc);
    
    return () => {
      window.removeEventListener('resize', updateSrc);
    };
  }, [src, breakpoints]);

  return <LazyImage {...props} src={currentSrc} />;
};

// 图片画廊组件
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  className?: string;
  itemClassName?: string;
  columns?: number;
  gap?: number;
  enableLightbox?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
  itemClassName = '',
  columns = 3,
  gap = 16,
  enableLightbox = true,
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { preloadImage } = useImagePreloader();

  // 预加载相邻图片
  const preloadAdjacentImages = useCallback((index: number) => {
    const preloadIndexes = [
      index - 1,
      index + 1,
    ].filter(i => i >= 0 && i < images.length);

    preloadIndexes.forEach(i => {
      preloadImage(images[i].src);
    });
  }, [images, preloadImage]);

  const openLightbox = useCallback((index: number) => {
    if (enableLightbox) {
      setSelectedImage(index);
      preloadAdjacentImages(index);
    }
  }, [enableLightbox, preloadAdjacentImages]);

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (selectedImage === null) return;

    const newIndex = direction === 'prev' 
      ? (selectedImage - 1 + images.length) % images.length
      : (selectedImage + 1) % images.length;
    
    setSelectedImage(newIndex);
    preloadAdjacentImages(newIndex);
  }, [selectedImage, images.length, preloadAdjacentImages]);

  // 键盘导航
  useEffect(() => {
    if (selectedImage === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, closeLightbox, navigateImage]);

  return (
    <>
      <div 
        className={`grid ${className}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className={`cursor-pointer ${itemClassName}`}
            onClick={() => openLightbox(index)}
          >
            <LazyImage
              src={image.src}
              alt={image.alt}
              className="w-full h-48 rounded-lg hover:scale-105 transition-transform duration-200"
              objectFit="cover"
            />
            {image.caption && (
              <p className="mt-2 text-sm text-gray-600 text-center">
                {image.caption}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <motion.div
              className="relative max-w-4xl max-h-full p-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <LazyImage
                src={images[selectedImage].src}
                alt={images[selectedImage].alt}
                className="max-w-full max-h-full"
                objectFit="contain"
                priority
              />
              
              {/* 导航按钮 */}
              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full"
                    onClick={() => navigateImage('prev')}
                  >
                    ←
                  </button>
                  <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full"
                    onClick={() => navigateImage('next')}
                  >
                    →
                  </button>
                </>
              )}
              
              {/* 关闭按钮 */}
              <button
                className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full"
                onClick={closeLightbox}
              >
                ✕
              </button>
              
              {/* 图片信息 */}
              <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                <p className="text-lg font-medium">{images[selectedImage].alt}</p>
                {images[selectedImage].caption && (
                  <p className="text-sm opacity-75 mt-1">{images[selectedImage].caption}</p>
                )}
                <p className="text-xs opacity-50 mt-2">
                  {selectedImage + 1} / {images.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LazyImage;