import { ImageInfo } from './imageService';

// 云存储提供商类型
export type CloudProvider = 'aws-s3' | 'aliyun-oss' | 'qiniu' | 'tencent-cos' | 'upyun' | 'github' | 'custom';

// 云存储配置接口
export interface CloudStorageConfig {
  provider: CloudProvider;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region?: string;
  endpoint?: string;
  domain?: string;
  prefix?: string;
  enableHttps?: boolean;
  enableCdn?: boolean;
  cdnDomain?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  compressionQuality?: number;
  autoResize?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

// 上传选项
export interface UploadOptions {
  filename?: string;
  contentType?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
  tags?: string[];
  storageClass?: string;
  cacheControl?: string;
  expires?: Date;
  onProgress?: (progress: number) => void;
}

// 上传结果
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  etag?: string;
  size?: number;
  error?: string;
  metadata?: Record<string, any>;
}

// 文件信息
export interface CloudFileInfo {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType: string;
  metadata?: Record<string, string>;
  storageClass?: string;
}

// 云存储基类
export abstract class CloudStorageProvider {
  protected config: CloudStorageConfig;

  constructor(config: CloudStorageConfig) {
    this.config = config;
  }

  // 上传文件
  abstract upload(file: File | Blob, options?: UploadOptions): Promise<UploadResult>;

  // 删除文件
  abstract delete(key: string): Promise<boolean>;

  // 获取文件信息
  abstract getFileInfo(key: string): Promise<CloudFileInfo | null>;

  // 列出文件
  abstract listFiles(prefix?: string, maxKeys?: number): Promise<CloudFileInfo[]>;

  // 生成预签名URL
  abstract getSignedUrl(key: string, expires?: number): Promise<string>;

  // 检查连接
  abstract testConnection(): Promise<boolean>;

  // 获取存储统计
  abstract getStorageStats(): Promise<{
    totalSize: number;
    fileCount: number;
    usedQuota: number;
    availableQuota: number;
  }>;
}

// AWS S3 存储提供商
class AWSS3Provider extends CloudStorageProvider {
  async upload(file: File | Blob, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      // 模拟 AWS S3 上传
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', options.filename || `uploads/${Date.now()}_${(file as File).name || 'file'}`);
      formData.append('bucket', this.config.bucket);
      formData.append('region', this.config.region || 'us-east-1');
      
      // 模拟上传进度
      if (options.onProgress) {
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
          options.onProgress(i);
        }
      }
      
      const key = options.filename || `uploads/${Date.now()}_${(file as File).name || 'file'}`;
      const url = `https://${this.config.bucket}.s3.${this.config.region || 'us-east-1'}.amazonaws.com/${key}`;
      
      return {
        success: true,
        url,
        key,
        etag: `"${Math.random().toString(36).substr(2, 9)}"`,
        size: file.size
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      // 模拟删除操作
      console.log(`Deleting S3 object: ${key}`);
      return true;
    } catch (error) {
      console.error('S3 delete failed:', error);
      return false;
    }
  }

  async getFileInfo(key: string): Promise<CloudFileInfo | null> {
    try {
      // 模拟获取文件信息
      return {
        key,
        url: `https://${this.config.bucket}.s3.${this.config.region || 'us-east-1'}.amazonaws.com/${key}`,
        size: Math.floor(Math.random() * 1000000),
        lastModified: new Date(),
        etag: `"${Math.random().toString(36).substr(2, 9)}"`,
        contentType: 'image/jpeg'
      };
    } catch (error) {
      return null;
    }
  }

  async listFiles(prefix = '', maxKeys = 1000): Promise<CloudFileInfo[]> {
    try {
      // 模拟列出文件
      const files: CloudFileInfo[] = [];
      for (let i = 0; i < Math.min(maxKeys, 10); i++) {
        files.push({
          key: `${prefix}file_${i}.jpg`,
          url: `https://${this.config.bucket}.s3.${this.config.region || 'us-east-1'}.amazonaws.com/${prefix}file_${i}.jpg`,
          size: Math.floor(Math.random() * 1000000),
          lastModified: new Date(Date.now() - Math.random() * 86400000 * 30),
          etag: `"${Math.random().toString(36).substr(2, 9)}"`,
          contentType: 'image/jpeg'
        });
      }
      return files;
    } catch (error) {
      return [];
    }
  }

  async getSignedUrl(key: string, expires = 3600): Promise<string> {
    // 模拟生成预签名URL
    const timestamp = Math.floor(Date.now() / 1000) + expires;
    return `https://${this.config.bucket}.s3.${this.config.region || 'us-east-1'}.amazonaws.com/${key}?X-Amz-Expires=${expires}&X-Amz-Date=${timestamp}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      // 模拟连接测试
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStorageStats() {
    return {
      totalSize: 5000000000, // 5GB
      fileCount: 1250,
      usedQuota: 5000000000,
      availableQuota: 15000000000 // 15GB available
    };
  }
}

// 阿里云 OSS 存储提供商
class AliyunOSSProvider extends CloudStorageProvider {
  async upload(file: File | Blob, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      // 模拟阿里云 OSS 上传
      const key = options.filename || `uploads/${Date.now()}_${(file as File).name || 'file'}`;
      
      // 模拟上传进度
      if (options.onProgress) {
        for (let i = 0; i <= 100; i += 15) {
          await new Promise(resolve => setTimeout(resolve, 40));
          options.onProgress(i);
        }
      }
      
      const url = this.config.domain 
        ? `https://${this.config.domain}/${key}`
        : `https://${this.config.bucket}.${this.config.endpoint || 'oss-cn-hangzhou.aliyuncs.com'}/${key}`;
      
      return {
        success: true,
        url,
        key,
        etag: `"${Math.random().toString(36).substr(2, 9)}"`,
        size: file.size
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      console.log(`Deleting OSS object: ${key}`);
      return true;
    } catch (error) {
      console.error('OSS delete failed:', error);
      return false;
    }
  }

  async getFileInfo(key: string): Promise<CloudFileInfo | null> {
    try {
      const url = this.config.domain 
        ? `https://${this.config.domain}/${key}`
        : `https://${this.config.bucket}.${this.config.endpoint || 'oss-cn-hangzhou.aliyuncs.com'}/${key}`;
      
      return {
        key,
        url,
        size: Math.floor(Math.random() * 1000000),
        lastModified: new Date(),
        etag: `"${Math.random().toString(36).substr(2, 9)}"`,
        contentType: 'image/jpeg'
      };
    } catch (error) {
      return null;
    }
  }

  async listFiles(prefix = '', maxKeys = 1000): Promise<CloudFileInfo[]> {
    try {
      const files: CloudFileInfo[] = [];
      for (let i = 0; i < Math.min(maxKeys, 8); i++) {
        const key = `${prefix}oss_file_${i}.jpg`;
        const url = this.config.domain 
          ? `https://${this.config.domain}/${key}`
          : `https://${this.config.bucket}.${this.config.endpoint || 'oss-cn-hangzhou.aliyuncs.com'}/${key}`;
        
        files.push({
          key,
          url,
          size: Math.floor(Math.random() * 1000000),
          lastModified: new Date(Date.now() - Math.random() * 86400000 * 30),
          etag: `"${Math.random().toString(36).substr(2, 9)}"`,
          contentType: 'image/jpeg'
        });
      }
      return files;
    } catch (error) {
      return [];
    }
  }

  async getSignedUrl(key: string, expires = 3600): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000) + expires;
    const url = this.config.domain 
      ? `https://${this.config.domain}/${key}`
      : `https://${this.config.bucket}.${this.config.endpoint || 'oss-cn-hangzhou.aliyuncs.com'}/${key}`;
    return `${url}?Expires=${timestamp}&OSSAccessKeyId=${this.config.accessKey}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStorageStats() {
    return {
      totalSize: 3000000000, // 3GB
      fileCount: 890,
      usedQuota: 3000000000,
      availableQuota: 7000000000 // 7GB available
    };
  }
}

// 七牛云存储提供商
class QiniuProvider extends CloudStorageProvider {
  async upload(file: File | Blob, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      const key = options.filename || `uploads/${Date.now()}_${(file as File).name || 'file'}`;
      
      // 模拟上传进度
      if (options.onProgress) {
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(resolve => setTimeout(resolve, 30));
          options.onProgress(i);
        }
      }
      
      const url = this.config.domain 
        ? `https://${this.config.domain}/${key}`
        : `https://${this.config.bucket}.qiniucdn.com/${key}`;
      
      return {
        success: true,
        url,
        key,
        etag: `"${Math.random().toString(36).substr(2, 9)}"`,
        size: file.size
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      console.log(`Deleting Qiniu object: ${key}`);
      return true;
    } catch (error) {
      console.error('Qiniu delete failed:', error);
      return false;
    }
  }

  async getFileInfo(key: string): Promise<CloudFileInfo | null> {
    try {
      const url = this.config.domain 
        ? `https://${this.config.domain}/${key}`
        : `https://${this.config.bucket}.qiniucdn.com/${key}`;
      
      return {
        key,
        url,
        size: Math.floor(Math.random() * 1000000),
        lastModified: new Date(),
        etag: `"${Math.random().toString(36).substr(2, 9)}"`,
        contentType: 'image/jpeg'
      };
    } catch (error) {
      return null;
    }
  }

  async listFiles(prefix = '', maxKeys = 1000): Promise<CloudFileInfo[]> {
    try {
      const files: CloudFileInfo[] = [];
      for (let i = 0; i < Math.min(maxKeys, 6); i++) {
        const key = `${prefix}qiniu_file_${i}.jpg`;
        const url = this.config.domain 
          ? `https://${this.config.domain}/${key}`
          : `https://${this.config.bucket}.qiniucdn.com/${key}`;
        
        files.push({
          key,
          url,
          size: Math.floor(Math.random() * 1000000),
          lastModified: new Date(Date.now() - Math.random() * 86400000 * 30),
          etag: `"${Math.random().toString(36).substr(2, 9)}"`,
          contentType: 'image/jpeg'
        });
      }
      return files;
    } catch (error) {
      return [];
    }
  }

  async getSignedUrl(key: string, expires = 3600): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000) + expires;
    const url = this.config.domain 
      ? `https://${this.config.domain}/${key}`
      : `https://${this.config.bucket}.qiniucdn.com/${key}`;
    return `${url}?e=${timestamp}&token=${Math.random().toString(36).substr(2, 9)}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStorageStats() {
    return {
      totalSize: 2000000000, // 2GB
      fileCount: 650,
      usedQuota: 2000000000,
      availableQuota: 8000000000 // 8GB available
    };
  }
}

// GitHub 存储提供商（使用 GitHub API）
class GitHubProvider extends CloudStorageProvider {
  async upload(file: File | Blob, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      const key = options.filename || `uploads/${Date.now()}_${(file as File).name || 'file'}`;
      
      // 将文件转换为 base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // 模拟上传进度
      if (options.onProgress) {
        for (let i = 0; i <= 100; i += 25) {
          await new Promise(resolve => setTimeout(resolve, 100));
          options.onProgress(i);
        }
      }
      
      // 模拟 GitHub API 调用
      const url = `https://raw.githubusercontent.com/${this.config.bucket}/${this.config.region || 'main'}/${key}`;
      
      return {
        success: true,
        url,
        key,
        etag: `"${Math.random().toString(36).substr(2, 9)}"`,
        size: file.size
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      console.log(`Deleting GitHub file: ${key}`);
      return true;
    } catch (error) {
      console.error('GitHub delete failed:', error);
      return false;
    }
  }

  async getFileInfo(key: string): Promise<CloudFileInfo | null> {
    try {
      const url = `https://raw.githubusercontent.com/${this.config.bucket}/${this.config.region || 'main'}/${key}`;
      
      return {
        key,
        url,
        size: Math.floor(Math.random() * 1000000),
        lastModified: new Date(),
        etag: `"${Math.random().toString(36).substr(2, 9)}"`,
        contentType: 'image/jpeg'
      };
    } catch (error) {
      return null;
    }
  }

  async listFiles(prefix = '', maxKeys = 1000): Promise<CloudFileInfo[]> {
    try {
      const files: CloudFileInfo[] = [];
      for (let i = 0; i < Math.min(maxKeys, 5); i++) {
        const key = `${prefix}github_file_${i}.jpg`;
        const url = `https://raw.githubusercontent.com/${this.config.bucket}/${this.config.region || 'main'}/${key}`;
        
        files.push({
          key,
          url,
          size: Math.floor(Math.random() * 1000000),
          lastModified: new Date(Date.now() - Math.random() * 86400000 * 30),
          etag: `"${Math.random().toString(36).substr(2, 9)}"`,
          contentType: 'image/jpeg'
        });
      }
      return files;
    } catch (error) {
      return [];
    }
  }

  async getSignedUrl(key: string, expires = 3600): Promise<string> {
    // GitHub 不支持预签名URL，直接返回公开URL
    return `https://raw.githubusercontent.com/${this.config.bucket}/${this.config.region || 'main'}/${key}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStorageStats() {
    return {
      totalSize: 1000000000, // 1GB
      fileCount: 320,
      usedQuota: 1000000000,
      availableQuota: 999000000000 // GitHub 有很大的免费空间
    };
  }
}

// 云存储管理器
export class CloudStorageManager {
  private providers: Map<string, CloudStorageProvider> = new Map();
  private currentProvider: CloudStorageProvider | null = null;
  private configs: Map<string, CloudStorageConfig> = new Map();

  constructor() {
    this.loadConfigs();
  }

  // 加载配置
  private loadConfigs() {
    try {
      const savedConfigs = localStorage.getItem('cloud-storage-configs');
      if (savedConfigs) {
        const configs = JSON.parse(savedConfigs);
        Object.entries(configs).forEach(([key, config]) => {
          this.configs.set(key, config as CloudStorageConfig);
        });
      }
    } catch (error) {
      console.error('Failed to load cloud storage configs:', error);
    }
  }

  // 保存配置
  private saveConfigs() {
    try {
      const configs: Record<string, CloudStorageConfig> = {};
      this.configs.forEach((config, key) => {
        configs[key] = config;
      });
      localStorage.setItem('cloud-storage-configs', JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save cloud storage configs:', error);
    }
  }

  // 添加配置
  addConfig(name: string, config: CloudStorageConfig) {
    this.configs.set(name, config);
    this.saveConfigs();
  }

  // 删除配置
  removeConfig(name: string) {
    this.configs.delete(name);
    this.providers.delete(name);
    this.saveConfigs();
  }

  // 获取配置列表
  getConfigs(): Array<{ name: string; config: CloudStorageConfig }> {
    return Array.from(this.configs.entries()).map(([name, config]) => ({ name, config }));
  }

  // 创建提供商实例
  private createProvider(config: CloudStorageConfig): CloudStorageProvider {
    switch (config.provider) {
      case 'aws-s3':
        return new AWSS3Provider(config);
      case 'aliyun-oss':
        return new AliyunOSSProvider(config);
      case 'qiniu':
        return new QiniuProvider(config);
      case 'github':
        return new GitHubProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  // 设置当前提供商
  async setCurrentProvider(name: string): Promise<boolean> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Config not found: ${name}`);
    }

    try {
      let provider = this.providers.get(name);
      if (!provider) {
        provider = this.createProvider(config);
        this.providers.set(name, provider);
      }

      // 测试连接
      const connected = await provider.testConnection();
      if (connected) {
        this.currentProvider = provider;
        localStorage.setItem('current-cloud-provider', name);
        return true;
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      console.error('Failed to set current provider:', error);
      return false;
    }
  }

  // 获取当前提供商
  getCurrentProvider(): CloudStorageProvider | null {
    return this.currentProvider;
  }

  // 自动初始化当前提供商
  async autoInitialize(): Promise<boolean> {
    try {
      const savedProvider = localStorage.getItem('current-cloud-provider');
      if (savedProvider && this.configs.has(savedProvider)) {
        return await this.setCurrentProvider(savedProvider);
      }
    } catch (error) {
      console.error('Auto initialize failed:', error);
    }
    return false;
  }

  // 上传文件
  async upload(file: File | Blob, options?: UploadOptions): Promise<UploadResult> {
    if (!this.currentProvider) {
      return {
        success: false,
        error: 'No cloud storage provider configured'
      };
    }

    return await this.currentProvider.upload(file, options);
  }

  // 删除文件
  async delete(key: string): Promise<boolean> {
    if (!this.currentProvider) {
      return false;
    }

    return await this.currentProvider.delete(key);
  }

  // 获取文件信息
  async getFileInfo(key: string): Promise<CloudFileInfo | null> {
    if (!this.currentProvider) {
      return null;
    }

    return await this.currentProvider.getFileInfo(key);
  }

  // 列出文件
  async listFiles(prefix?: string, maxKeys?: number): Promise<CloudFileInfo[]> {
    if (!this.currentProvider) {
      return [];
    }

    return await this.currentProvider.listFiles(prefix, maxKeys);
  }

  // 生成预签名URL
  async getSignedUrl(key: string, expires?: number): Promise<string | null> {
    if (!this.currentProvider) {
      return null;
    }

    return await this.currentProvider.getSignedUrl(key, expires);
  }

  // 获取存储统计
  async getStorageStats() {
    if (!this.currentProvider) {
      return {
        totalSize: 0,
        fileCount: 0,
        usedQuota: 0,
        availableQuota: 0
      };
    }

    return await this.currentProvider.getStorageStats();
  }

  // 测试所有配置的连接
  async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, config] of this.configs.entries()) {
      try {
        let provider = this.providers.get(name);
        if (!provider) {
          provider = this.createProvider(config);
          this.providers.set(name, provider);
        }
        
        results[name] = await provider.testConnection();
      } catch (error) {
        results[name] = false;
      }
    }
    
    return results;
  }

  // 批量上传
  async batchUpload(
    files: Array<{ file: File | Blob; options?: UploadOptions }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<UploadResult[]> {
    if (!this.currentProvider) {
      return files.map(() => ({
        success: false,
        error: 'No cloud storage provider configured'
      }));
    }

    const results: UploadResult[] = [];
    let completed = 0;

    for (const { file, options } of files) {
      try {
        const result = await this.currentProvider.upload(file, options);
        results.push(result);
        completed++;
        onProgress?.(completed, files.length);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        completed++;
        onProgress?.(completed, files.length);
      }
    }

    return results;
  }

  // 同步到多个提供商
  async syncToMultipleProviders(
    file: File | Blob,
    providerNames: string[],
    options?: UploadOptions
  ): Promise<Record<string, UploadResult>> {
    const results: Record<string, UploadResult> = {};

    for (const name of providerNames) {
      const config = this.configs.get(name);
      if (!config) {
        results[name] = {
          success: false,
          error: `Config not found: ${name}`
        };
        continue;
      }

      try {
        let provider = this.providers.get(name);
        if (!provider) {
          provider = this.createProvider(config);
          this.providers.set(name, provider);
        }

        results[name] = await provider.upload(file, options);
      } catch (error) {
        results[name] = {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    }

    return results;
  }
}

// 导出单例实例
export const cloudStorageManager = new CloudStorageManager();

// 导出类型和接口
export type {
  CloudProvider,
  CloudStorageConfig,
  UploadOptions,
  UploadResult,
  CloudFileInfo
};

export { CloudStorageProvider };