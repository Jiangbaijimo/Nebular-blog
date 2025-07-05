/**
 * CDN管理服务
 * 处理CDN URL生成、图片优化、缓存策略等
 */

import { imageService } from '../storage/imageService';

// CDN配置接口
interface CDNConfig {
  baseUrl: string;
  enabled: boolean;
  provider: 'cloudflare' | 'aws' | 'aliyun' | 'custom';
  apiKey?: string;
  secretKey?: string;
  bucket?: string;
  region?: string;
  customDomain?: string;
}

// 图片变换参数
interface ImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
  crop?: 'scale' | 'fit' | 'fill' | 'crop';
  gravity?: 'center' | 'north' | 'south' | 'east' | 'west';
  blur?: number;
  sharpen?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

// CDN响应接口
interface CDNResponse {
  url: string;
  originalUrl: string;
  transforms: ImageTransform;
  cached: boolean;
  size?: number;
  format?: string;
}

// 预设尺寸配置
interface PresetSize {
  name: string;
  width: number;
  height?: number;
  quality: number;
  format: string;
  description: string;
}

class CDNManager {
  private config: CDNConfig;
  private cache: Map<string, CDNResponse> = new Map();
  private presetSizes: PresetSize[] = [
    {
      name: 'thumbnail',
      width: 150,
      height: 150,
      quality: 80,
      format: 'webp',
      description: '缩略图'
    },
    {
      name: 'small',
      width: 300,
      quality: 85,
      format: 'webp',
      description: '小图'
    },
    {
      name: 'medium',
      width: 600,
      quality: 90,
      format: 'webp',
      description: '中图'
    },
    {
      name: 'large',
      width: 1200,
      quality: 95,
      format: 'webp',
      description: '大图'
    },
    {
      name: 'original',
      width: 0, // 0表示原始尺寸
      quality: 100,
      format: 'auto',
      description: '原图'
    }
  ];

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * 加载CDN配置
   */
  private loadConfig(): CDNConfig {
    const defaultConfig: CDNConfig = {
      baseUrl: import.meta.env.VITE_CDN_BASE_URL || '',
      enabled: import.meta.env.VITE_ENABLE_CDN === 'true',
      provider: 'custom'
    };

    try {
      const savedConfig = localStorage.getItem('cdn_config');
      if (savedConfig) {
        return { ...defaultConfig, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.warn('Failed to load CDN config:', error);
    }

    return defaultConfig;
  }

  /**
   * 保存CDN配置
   */
  saveConfig(config: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...config };
    try {
      localStorage.setItem('cdn_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save CDN config:', error);
    }
  }

  /**
   * 生成CDN URL
   */
  generateUrl(originalUrl: string, transforms?: ImageTransform): string {
    if (!this.config.enabled || !this.config.baseUrl) {
      return originalUrl;
    }

    const cacheKey = this.getCacheKey(originalUrl, transforms);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached.url;
    }

    let cdnUrl = originalUrl;

    // 如果是本地URL，转换为CDN URL
    if (originalUrl.startsWith('blob:') || originalUrl.startsWith('/')) {
      cdnUrl = this.buildCDNUrl(originalUrl, transforms);
    }

    // 缓存结果
    this.cache.set(cacheKey, {
      url: cdnUrl,
      originalUrl,
      transforms: transforms || {},
      cached: true
    });

    return cdnUrl;
  }

  /**
   * 构建CDN URL
   */
  private buildCDNUrl(originalUrl: string, transforms?: ImageTransform): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    let url = `${baseUrl}${originalUrl}`;

    if (transforms && Object.keys(transforms).length > 0) {
      const params = this.buildTransformParams(transforms);
      url += `?${params}`;
    }

    return url;
  }

  /**
   * 构建变换参数
   */
  private buildTransformParams(transforms: ImageTransform): string {
    const params: string[] = [];

    if (transforms.width) {
      params.push(`w=${transforms.width}`);
    }
    if (transforms.height) {
      params.push(`h=${transforms.height}`);
    }
    if (transforms.quality) {
      params.push(`q=${transforms.quality}`);
    }
    if (transforms.format && transforms.format !== 'auto') {
      params.push(`f=${transforms.format}`);
    }
    if (transforms.crop) {
      params.push(`c=${transforms.crop}`);
    }
    if (transforms.gravity) {
      params.push(`g=${transforms.gravity}`);
    }
    if (transforms.blur) {
      params.push(`blur=${transforms.blur}`);
    }
    if (transforms.sharpen) {
      params.push(`sharpen=${transforms.sharpen}`);
    }
    if (transforms.brightness) {
      params.push(`brightness=${transforms.brightness}`);
    }
    if (transforms.contrast) {
      params.push(`contrast=${transforms.contrast}`);
    }
    if (transforms.saturation) {
      params.push(`saturation=${transforms.saturation}`);
    }

    return params.join('&');
  }

  /**
   * 获取预设尺寸URL
   */
  getPresetUrl(originalUrl: string, presetName: string): string {
    const preset = this.presetSizes.find(p => p.name === presetName);
    if (!preset) {
      return originalUrl;
    }

    const transforms: ImageTransform = {
      width: preset.width || undefined,
      height: preset.height || undefined,
      quality: preset.quality,
      format: preset.format as any
    };

    return this.generateUrl(originalUrl, transforms);
  }

  /**
   * 获取响应式图片URL集合
   */
  getResponsiveUrls(originalUrl: string): Record<string, string> {
    const urls: Record<string, string> = {};

    this.presetSizes.forEach(preset => {
      urls[preset.name] = this.getPresetUrl(originalUrl, preset.name);
    });

    return urls;
  }

  /**
   * 预加载图片
   */
  async preloadImage(url: string, priority: 'high' | 'low' = 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // 设置优先级
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }

      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
      img.src = url;
    });
  }

  /**
   * 批量预加载图片
   */
  async preloadImages(urls: string[], concurrency: number = 3): Promise<void> {
    const chunks = this.chunkArray(urls, concurrency);
    
    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(url => this.preloadImage(url))
      );
    }
  }

  /**
   * 检查图片是否可用
   */
  async checkImageAvailability(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取图片回退URL
   */
  getFallbackUrl(originalUrl: string): string {
    // 如果CDN不可用，返回原始URL
    if (!this.config.enabled) {
      return originalUrl;
    }

    // 可以返回一个默认的占位图片
    return '/images/placeholder.svg';
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 获取预设尺寸配置
   */
  getPresetSizes(): PresetSize[] {
    return [...this.presetSizes];
  }

  /**
   * 添加预设尺寸
   */
  addPresetSize(preset: PresetSize): void {
    const existingIndex = this.presetSizes.findIndex(p => p.name === preset.name);
    if (existingIndex >= 0) {
      this.presetSizes[existingIndex] = preset;
    } else {
      this.presetSizes.push(preset);
    }
  }

  /**
   * 删除预设尺寸
   */
  removePresetSize(name: string): void {
    const index = this.presetSizes.findIndex(p => p.name === name);
    if (index >= 0) {
      this.presetSizes.splice(index, 1);
    }
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(url: string, transforms?: ImageTransform): string {
    const transformStr = transforms ? JSON.stringify(transforms) : '';
    return `${url}:${transformStr}`;
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 获取当前配置
   */
  getConfig(): CDNConfig {
    return { ...this.config };
  }

  /**
   * 测试CDN连接
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.enabled || !this.config.baseUrl) {
      return false;
    }

    try {
      const testUrl = `${this.config.baseUrl}/health`;
      const response = await fetch(testUrl, {
        method: 'HEAD',
        timeout: 5000
      } as any);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 导出单例
export const cdnManager = new CDNManager();

// 导出类型
export type {
  CDNConfig,
  ImageTransform,
  CDNResponse,
  PresetSize
};

export { CDNManager };