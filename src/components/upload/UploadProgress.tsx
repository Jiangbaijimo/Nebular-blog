import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { Loading } from '../ui/Loading';
import imageService, { ImageInfo } from '../../services/storage/imageService';
import {
  Upload,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Trash2,
  Eye,
  Copy,
  Download,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Pause,
  Play,
  MoreHorizontal,
  Filter,
  Search,
  Grid,
  List as ListIcon
} from 'lucide-react';

// 上传项组件属性
interface UploadItemProps {
  imageInfo: ImageInfo;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (imageInfo: ImageInfo) => void;
  onCopyUrl: (url: string) => void;
  compact?: boolean;
}

// 上传项组件
const UploadItem: React.FC<UploadItemProps> = ({
  imageInfo,
  onRetry,
  onDelete,
  onView,
  onCopyUrl,
  compact = false
}) => {
  const getStatusIcon = () => {
    switch (imageInfo.uploadStatus) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'uploading':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (imageInfo.uploadStatus) {
      case 'pending':
        return '等待上传';
      case 'uploading':
        return `上传中 ${imageInfo.uploadProgress}%`;
      case 'success':
        return '上传成功';
      case 'failed':
        return '上传失败';
      default:
        return '未知状态';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
        {/* 缩略图 */}
        <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
          {imageInfo.thumbnailUrl ? (
            <img
              src={imageInfo.thumbnailUrl}
              alt={imageInfo.originalName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
          
          {/* 状态覆盖 */}
          <div className="absolute top-1 right-1">
            {getStatusIcon()}
          </div>
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{imageInfo.originalName}</span>
            {imageInfo.isCompressed && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-1 rounded">
                已压缩
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatFileSize(imageInfo.size)} • {getStatusText()}
          </div>
          
          {/* 进度条 */}
          {imageInfo.uploadStatus === 'uploading' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-2">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${imageInfo.uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          {imageInfo.uploadStatus === 'success' && (
            <>
              <Tooltip content="预览">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(imageInfo)}
                  className="p-1"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="复制链接">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyUrl(imageInfo.cloudUrl || imageInfo.url)}
                  className="p-1"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </Tooltip>
            </>
          )}
          
          {imageInfo.uploadStatus === 'failed' && (
            <Tooltip content="重试">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(imageInfo.id)}
                className="p-1"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
          
          <Tooltip content="删除">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(imageInfo.id)}
              className="p-1 text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 图片预览 */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
        {imageInfo.url ? (
          <img
            src={imageInfo.thumbnailUrl || imageInfo.url}
            alt={imageInfo.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* 状态覆盖 */}
        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1">
          {getStatusIcon()}
        </div>
        
        {/* 进度覆盖 */}
        {imageInfo.uploadStatus === 'uploading' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loading size="md" />
              <div className="mt-2 text-sm">{imageInfo.uploadProgress}%</div>
            </div>
          </div>
        )}
        
        {/* 压缩标识 */}
        {imageInfo.isCompressed && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            已压缩
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate" title={imageInfo.originalName}>
              {imageInfo.originalName}
            </h3>
            <div className="text-xs text-gray-500 mt-1">
              {imageInfo.width} × {imageInfo.height} • {formatFileSize(imageInfo.size)}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(imageInfo.createdAt)}
            </div>
            
            {/* 标签 */}
            {imageInfo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {imageInfo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* 描述 */}
            {imageInfo.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {imageInfo.description}
              </p>
            )}
          </div>
        </div>

        {/* 状态信息 */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon()}
            <span className={`${
              imageInfo.uploadStatus === 'success' ? 'text-green-600' :
              imageInfo.uploadStatus === 'failed' ? 'text-red-600' :
              imageInfo.uploadStatus === 'uploading' ? 'text-blue-600' :
              'text-gray-600'
            }`}>
              {getStatusText()}
            </span>
          </div>
          
          {/* 节省空间显示 */}
          {imageInfo.isCompressed && imageInfo.originalSize && (
            <div className="text-xs text-green-600">
              节省 {formatFileSize(imageInfo.originalSize - imageInfo.size)}
            </div>
          )}
        </div>

        {/* 进度条 */}
        {imageInfo.uploadStatus === 'uploading' && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${imageInfo.uploadProgress}%` }}
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 mt-3">
          {imageInfo.uploadStatus === 'success' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(imageInfo)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                预览
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyUrl(imageInfo.cloudUrl || imageInfo.url)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-1" />
                复制
              </Button>
            </>
          )}
          
          {imageInfo.uploadStatus === 'failed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRetry(imageInfo.id)}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              重试
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(imageInfo.id)}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// 上传进度组件属性
interface UploadProgressProps {
  className?: string;
  showTrigger?: boolean;
  compact?: boolean;
  maxHeight?: string;
}

// 上传进度组件
export const UploadProgress: React.FC<UploadProgressProps> = ({
  className = '',
  showTrigger = true,
  compact = false,
  maxHeight = '600px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'uploading' | 'success' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    uploading: 0,
    success: 0,
    failed: 0,
    totalSize: 0,
    savedSize: 0
  });

  // 加载图片列表
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const imageList = await imageService.getImageList({
        status: filter === 'all' ? undefined : filter
      });
      setImages(imageList);
      
      const statsData = await imageService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // 监听图片状态变化
  useEffect(() => {
    const handleImageUpdate = (imageInfo: ImageInfo) => {
      setImages(prev => {
        const index = prev.findIndex(img => img.id === imageInfo.id);
        if (index >= 0) {
          const newImages = [...prev];
          newImages[index] = imageInfo;
          return newImages;
        } else {
          return [imageInfo, ...prev];
        }
      });
      
      // 更新统计信息
      imageService.getStats().then(setStats);
    };

    imageService.addListener('upload-progress', handleImageUpdate);
    
    return () => {
      imageService.removeListener('upload-progress');
    };
  }, []);

  // 打开时加载数据
  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen, loadImages]);

  // 重试上传
  const handleRetry = useCallback(async (id: string) => {
    try {
      await imageService.retryUpload(id);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }, []);

  // 删除图片
  const handleDelete = useCallback(async (id: string) => {
    try {
      await imageService.deleteImage(id);
      setImages(prev => prev.filter(img => img.id !== id));
      
      const statsData = await imageService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, []);

  // 查看图片
  const handleView = useCallback((imageInfo: ImageInfo) => {
    setSelectedImage(imageInfo);
  }, []);

  // 复制URL
  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // 这里可以显示成功提示
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, []);

  // 清理缓存
  const handleClearCache = useCallback(async () => {
    try {
      const cleared = await imageService.clearCache({
        status: 'failed',
        keepRecent: 10
      });
      console.log(`Cleared ${cleared} items`);
      loadImages();
    } catch (error) {
      console.error('Clear cache failed:', error);
    }
  }, [loadImages]);

  // 过滤图片
  const filteredImages = images.filter(image => {
    if (searchTerm) {
      return image.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取活跃上传数量
  const activeUploads = images.filter(img => 
    img.uploadStatus === 'uploading' || img.uploadStatus === 'pending'
  ).length;

  return (
    <>
      {showTrigger && (
        <div className={`relative ${className}`}>
          <Tooltip content="上传管理">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="p-2 relative"
            >
              <Upload className="w-4 h-4" />
              {activeUploads > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeUploads}
                </span>
              )}
            </Button>
          </Tooltip>
        </div>
      )}

      {/* 上传管理模态框 */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="上传管理"
        size="xl"
      >
        <div className="space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">总计</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">成功</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.uploading + stats.pending}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">进行中</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">失败</div>
            </div>
          </div>

          {/* 空间节省信息 */}
          {stats.savedSize > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  通过压缩节省了 {formatFileSize(stats.savedSize)} 存储空间
                </span>
              </div>
            </div>
          )}

          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* 过滤器 */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
              >
                <option value="all">全部</option>
                <option value="pending">等待中</option>
                <option value="uploading">上传中</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
              </select>
              
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索图片..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm w-48"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 视图模式 */}
              <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
              
              {/* 清理缓存 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
              >
                清理缓存
              </Button>
              
              {/* 刷新 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={loadImages}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* 图片列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading size="lg" text="加载中..." />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无图片</p>
            </div>
          ) : (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }`}>
              {filteredImages.map((image) => (
                <UploadItem
                  key={image.id}
                  imageInfo={image}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                  onView={handleView}
                  onCopyUrl={handleCopyUrl}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* 图片预览模态框 */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title={selectedImage?.originalName || ''}
        size="lg"
      >
        {selectedImage && (
          <div className="space-y-4">
            {/* 图片预览 */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.originalName}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
            
            {/* 图片信息 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">尺寸:</span> {selectedImage.width} × {selectedImage.height}
              </div>
              <div>
                <span className="font-medium">大小:</span> {formatFileSize(selectedImage.size)}
              </div>
              <div>
                <span className="font-medium">类型:</span> {selectedImage.type}
              </div>
              <div>
                <span className="font-medium">状态:</span> 
                <span className={`ml-1 ${
                  selectedImage.uploadStatus === 'success' ? 'text-green-600' :
                  selectedImage.uploadStatus === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {selectedImage.uploadStatus === 'success' ? '上传成功' :
                   selectedImage.uploadStatus === 'failed' ? '上传失败' :
                   selectedImage.uploadStatus === 'uploading' ? '上传中' : '等待上传'}
                </span>
              </div>
            </div>
            
            {/* 标签 */}
            {selectedImage.tags.length > 0 && (
              <div>
                <span className="font-medium text-sm">标签:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedImage.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 描述 */}
            {selectedImage.description && (
              <div>
                <span className="font-medium text-sm">描述:</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedImage.description}
                </p>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex gap-2">
              {selectedImage.uploadStatus === 'success' && (
                <Button
                  onClick={() => handleCopyUrl(selectedImage.cloudUrl || selectedImage.url)}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制链接
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedImage.url;
                  link.download = selectedImage.originalName;
                  link.click();
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                下载
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default UploadProgress;