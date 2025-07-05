import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useEditor } from '../core/EditorProvider';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Loading } from '../../ui/Loading';
import { Tooltip } from '../../ui/Tooltip';
import {
  Upload,
  Image as ImageIcon,
  Link,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Copy,
  Trash2,
  Camera,
  Clipboard
} from 'lucide-react';

// 图片上传状态
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'retrying';

// 图片信息接口
interface ImageInfo {
  id: string;
  file?: File;
  url: string;
  localUrl?: string; // 本地blob URL
  cloudUrl?: string; // 云端URL
  name: string;
  size: number;
  type: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  uploadedAt?: Date;
  retryCount: number;
}

// 图片上传配置
interface UploadConfig {
  maxSize: number; // 最大文件大小（字节）
  allowedTypes: string[]; // 允许的文件类型
  quality: number; // 压缩质量 (0-1)
  maxWidth: number; // 最大宽度
  maxHeight: number; // 最大高度
  enableCompression: boolean; // 是否启用压缩
  enableLocalFirst: boolean; // 是否启用本地优先
}

// 默认配置
const defaultConfig: UploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  enableCompression: true,
  enableLocalFirst: true
};

// 图片压缩函数
const compressImage = (file: File, config: UploadConfig): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!config.enableCompression) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img;
      const ratio = Math.min(config.maxWidth / width, config.maxHeight / height);
      
      if (ratio < 1) {
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        file.type,
        config.quality
      );
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
};

// 本地存储服务
class LocalImageStorage {
  private dbName = 'blog-images';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        }
      };
    });
  }

  async saveImage(imageInfo: ImageInfo): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.put(imageInfo);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getImage(id: string): Promise<ImageInfo | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllImages(): Promise<ImageInfo[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteImage(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// 上传队列管理
class UploadQueue {
  private queue: ImageInfo[] = [];
  private processing = false;
  private maxConcurrent = 3;
  private activeUploads = 0;
  private storage = new LocalImageStorage();
  private onUpdate?: (images: ImageInfo[]) => void;

  constructor(onUpdate?: (images: ImageInfo[]) => void) {
    this.onUpdate = onUpdate;
    this.storage.init();
  }

  addToQueue(imageInfo: ImageInfo): void {
    this.queue.push(imageInfo);
    this.storage.saveImage(imageInfo);
    this.onUpdate?.(this.queue);
    this.processQueue();
  }

  updateImage(id: string, updates: Partial<ImageInfo>): void {
    const index = this.queue.findIndex(img => img.id === id);
    if (index !== -1) {
      this.queue[index] = { ...this.queue[index], ...updates };
      this.storage.saveImage(this.queue[index]);
      this.onUpdate?.(this.queue);
    }
  }

  removeFromQueue(id: string): void {
    this.queue = this.queue.filter(img => img.id !== id);
    this.storage.deleteImage(id);
    this.onUpdate?.(this.queue);
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.activeUploads >= this.maxConcurrent) return;
    
    const pendingImages = this.queue.filter(img => 
      img.status === 'idle' || img.status === 'error'
    );
    
    if (pendingImages.length === 0) return;
    
    this.processing = true;
    
    for (const imageInfo of pendingImages) {
      if (this.activeUploads >= this.maxConcurrent) break;
      
      this.uploadImage(imageInfo);
    }
    
    this.processing = false;
  }

  private async uploadImage(imageInfo: ImageInfo): Promise<void> {
    this.activeUploads++;
    this.updateImage(imageInfo.id, { status: 'uploading', progress: 0 });

    try {
      // 模拟上传过程
      const cloudUrl = await this.simulateUpload(imageInfo, (progress) => {
        this.updateImage(imageInfo.id, { progress });
      });

      this.updateImage(imageInfo.id, {
        status: 'success',
        progress: 100,
        cloudUrl,
        uploadedAt: new Date(),
        url: cloudUrl // 上传成功后使用云端URL
      });
    } catch (error) {
      this.updateImage(imageInfo.id, {
        status: 'error',
        error: (error as Error).message,
        retryCount: imageInfo.retryCount + 1
      });
    } finally {
      this.activeUploads--;
      this.processQueue(); // 继续处理队列
    }
  }

  private simulateUpload(imageInfo: ImageInfo, onProgress: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          clearInterval(interval);
          onProgress(100);
          
          // 模拟上传成功/失败
          if (Math.random() > 0.1) { // 90% 成功率
            resolve(`https://cdn.example.com/images/${imageInfo.id}.${imageInfo.type.split('/')[1]}`);
          } else {
            reject(new Error('网络错误，上传失败'));
          }
        } else {
          onProgress(Math.min(progress, 99));
        }
      }, 100);
    });
  }

  retryUpload(id: string): void {
    const imageInfo = this.queue.find(img => img.id === id);
    if (imageInfo && imageInfo.retryCount < 3) {
      this.updateImage(id, { status: 'idle', error: undefined });
      this.processQueue();
    }
  }

  getQueueStatus(): { total: number; uploading: number; success: number; error: number } {
    return {
      total: this.queue.length,
      uploading: this.queue.filter(img => img.status === 'uploading').length,
      success: this.queue.filter(img => img.status === 'success').length,
      error: this.queue.filter(img => img.status === 'error').length
    };
  }
}

// 图片上传组件属性
interface ImageUploadProps {
  config?: Partial<UploadConfig>;
  onImageInsert?: (imageInfo: ImageInfo) => void;
  className?: string;
}

// 图片上传组件
export const ImageUpload: React.FC<ImageUploadProps> = ({
  config: userConfig = {},
  onImageInsert,
  className = ''
}) => {
  const { insertText } = useEditor();
  const [config] = useState<UploadConfig>({ ...defaultConfig, ...userConfig });
  const [uploadQueue] = useState(() => new UploadQueue());
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化上传队列
  useEffect(() => {
    uploadQueue.onUpdate = setImages;
    // 加载本地存储的图片
    uploadQueue.storage.getAllImages().then(setImages);
  }, [uploadQueue]);

  // 验证文件
  const validateFile = (file: File): string | null => {
    if (!config.allowedTypes.includes(file.type)) {
      return `不支持的文件类型: ${file.type}`;
    }
    if (file.size > config.maxSize) {
      return `文件大小超过限制: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${(config.maxSize / 1024 / 1024).toFixed(2)}MB`;
    }
    return null;
  }

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        console.error(error);
        continue;
      }

      try {
        // 压缩图片
        const compressedFile = await compressImage(file, config);
        
        // 创建本地URL
        const localUrl = URL.createObjectURL(compressedFile);
        
        const imageInfo: ImageInfo = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file: compressedFile,
          url: config.enableLocalFirst ? localUrl : '', // 本地优先时先使用本地URL
          localUrl,
          name: file.name,
          size: compressedFile.size,
          type: compressedFile.type,
          status: 'idle',
          progress: 0,
          retryCount: 0
        };

        // 添加到上传队列
        uploadQueue.addToQueue(imageInfo);
        
        // 如果启用本地优先，立即插入到编辑器
        if (config.enableLocalFirst) {
          insertImageToEditor(imageInfo);
        }
        
        onImageInsert?.(imageInfo);
      } catch (error) {
        console.error('图片处理失败:', error);
      }
    }
  }, [config, uploadQueue, insertText, onImageInsert]);

  // 插入图片到编辑器
  const insertImageToEditor = (imageInfo: ImageInfo) => {
    const alt = imageInfo.name.replace(/\.[^/.]+$/, ''); // 移除扩展名作为alt
    const markdown = `![${alt}](${imageInfo.url})`;
    insertText(markdown);
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // 处理粘贴
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFileUpload([file]);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleFileUpload]);

  // 处理URL插入
  const handleUrlInsert = () => {
    if (urlInput.trim()) {
      const imageInfo: ImageInfo = {
        id: `url_${Date.now()}`,
        url: urlInput.trim(),
        name: altInput || 'image',
        size: 0,
        type: 'image/unknown',
        status: 'success',
        progress: 100,
        retryCount: 0
      };
      
      insertImageToEditor(imageInfo);
      onImageInsert?.(imageInfo);
      
      setUrlInput('');
      setAltInput('');
      setShowUrlModal(false);
    }
  };

  // 重试上传
  const handleRetry = (id: string) => {
    uploadQueue.retryUpload(id);
  };

  // 删除图片
  const handleDelete = (id: string) => {
    uploadQueue.removeFromQueue(id);
  };

  // 复制图片URL
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const queueStatus = uploadQueue.getQueueStatus();

  return (
    <>
      {/* 上传按钮组 */}
      <div className={`flex items-center gap-2 ${className}`}>
        <Tooltip content="上传图片">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-2"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <Tooltip content="插入图片URL">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlModal(true)}
            className="p-2"
          >
            <Link className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <Tooltip content="图片管理">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModal(true)}
            className="p-2 relative"
          >
            <ImageIcon className="w-4 h-4" />
            {queueStatus.uploading > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                {queueStatus.uploading}
              </span>
            )}
          </Button>
        </Tooltip>
        
        <Tooltip content="从剪贴板粘贴">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // 提示用户使用 Ctrl+V 粘贴
              alert('请使用 Ctrl+V 粘贴剪贴板中的图片');
            }}
            className="p-2"
          >
            <Clipboard className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.allowedTypes.join(',')}
        multiple
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* 拖拽区域覆盖层 */}
      {dragOver && (
        <div
          className="fixed inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 z-50 flex items-center justify-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">拖拽图片到这里上传</p>
            <p className="text-sm text-gray-500 mt-2">
              支持 {config.allowedTypes.map(type => type.split('/')[1]).join(', ')} 格式
            </p>
          </div>
        </div>
      )}

      {/* URL插入模态框 */}
      <Modal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        title="插入图片链接"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            placeholder="图片URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="图片描述（可选）"
            value={altInput}
            onChange={(e) => setAltInput(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUrlModal(false)}>
              取消
            </Button>
            <Button onClick={handleUrlInsert} disabled={!urlInput.trim()}>
              插入
            </Button>
          </div>
        </div>
      </Modal>

      {/* 图片管理模态框 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="图片管理"
        size="lg"
      >
        <div className="space-y-4">
          {/* 状态统计 */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{queueStatus.total}</div>
              <div className="text-sm text-gray-500">总计</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{queueStatus.uploading}</div>
              <div className="text-sm text-gray-500">上传中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{queueStatus.success}</div>
              <div className="text-sm text-gray-500">成功</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{queueStatus.error}</div>
              <div className="text-sm text-gray-500">失败</div>
            </div>
          </div>

          {/* 图片列表 */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无图片</p>
              </div>
            ) : (
              images.map((image) => (
                <div key={image.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {/* 图片预览 */}
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                    {image.url ? (
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* 图片信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{image.name}</div>
                    <div className="text-sm text-gray-500">
                      {(image.size / 1024).toFixed(1)} KB
                    </div>
                    
                    {/* 进度条 */}
                    {image.status === 'uploading' && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${image.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{image.progress}%</div>
                      </div>
                    )}
                    
                    {/* 错误信息 */}
                    {image.status === 'error' && image.error && (
                      <div className="text-xs text-red-500 mt-1">{image.error}</div>
                    )}
                  </div>

                  {/* 状态图标 */}
                  <div className="flex-shrink-0">
                    {image.status === 'uploading' && <Loading size="sm" />}
                    {image.status === 'success' && <Check className="w-5 h-5 text-green-500" />}
                    {image.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {image.status === 'success' && (
                      <>
                        <Tooltip content="复制URL">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleCopyUrl(image.url)}
                            className="p-1"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="插入到编辑器">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => insertImageToEditor(image)}
                            className="p-1"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </Tooltip>
                      </>
                    )}
                    
                    {image.status === 'error' && image.retryCount < 3 && (
                      <Tooltip content="重试上传">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleRetry(image.id)}
                          className="p-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </Tooltip>
                    )}
                    
                    <Tooltip content="删除">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDelete(image.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ImageUpload;