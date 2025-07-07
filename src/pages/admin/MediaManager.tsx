/**
 * 媒体管理组件
 * 提供文件上传、管理、预览等功能
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ResponsiveImage from '../../components/common/ResponsiveImage';
import { formatDate } from '../../utils/date';

interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  mimeType: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: string;
  uploadedBy: string;
  alt?: string;
  caption?: string;
  tags: string[];
  folder?: string;
}

interface MediaFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdAt: string;
  fileCount: number;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface MediaManagerProps {
  className?: string;
  selectionMode?: boolean;
  multiple?: boolean;
  allowedTypes?: string[];
  onSelect?: (files: MediaFile[]) => void;
  onCancel?: () => void;
}

const MediaManager: React.FC<MediaManagerProps> = ({
  className = '',
  selectionMode = false,
  multiple = false,
  allowedTypes,
  onSelect,
  onCancel
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 文件类型图标映射
  const typeIcons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📄',
    other: '📎'
  };

  // 加载媒体文件
  useEffect(() => {
    loadMediaFiles();
  }, [currentFolder]);

  // 加载文件夹
  useEffect(() => {
    loadFolders();
  }, []);

  // 加载媒体文件
  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟媒体文件数据
      const mockFiles: MediaFile[] = [
        {
          id: '1',
          name: 'hero-banner.jpg',
          originalName: '首页横幅图.jpg',
          url: '/images/hero-banner.jpg',
          thumbnailUrl: '/images/thumbnails/hero-banner.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 2048576,
          dimensions: { width: 1920, height: 1080 },
          uploadedAt: '2024-01-15T10:30:00Z',
          uploadedBy: 'admin',
          alt: '首页横幅图',
          caption: '网站首页的主要横幅图片',
          tags: ['首页', '横幅', '设计'],
          folder: currentFolder || undefined
        },
        {
          id: '2',
          name: 'profile-avatar.png',
          originalName: '个人头像.png',
          url: '/images/profile-avatar.png',
          thumbnailUrl: '/images/thumbnails/profile-avatar.png',
          type: 'image',
          mimeType: 'image/png',
          size: 512000,
          dimensions: { width: 400, height: 400 },
          uploadedAt: '2024-01-14T15:20:00Z',
          uploadedBy: 'admin',
          alt: '个人头像',
          tags: ['头像', '个人'],
          folder: currentFolder || undefined
        },
        {
          id: '3',
          name: 'demo-video.mp4',
          originalName: '演示视频.mp4',
          url: '/videos/demo-video.mp4',
          thumbnailUrl: '/images/thumbnails/demo-video.jpg',
          type: 'video',
          mimeType: 'video/mp4',
          size: 15728640,
          uploadedAt: '2024-01-13T09:15:00Z',
          uploadedBy: 'admin',
          caption: '产品演示视频',
          tags: ['演示', '视频'],
          folder: currentFolder || undefined
        },
        {
          id: '4',
          name: 'document.pdf',
          originalName: '技术文档.pdf',
          url: '/documents/document.pdf',
          type: 'document',
          mimeType: 'application/pdf',
          size: 1024000,
          uploadedAt: '2024-01-12T14:45:00Z',
          uploadedBy: 'admin',
          tags: ['文档', '技术'],
          folder: currentFolder || undefined
        }
      ];
      
      setFiles(mockFiles);
    } catch (error) {
      console.error('加载媒体文件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载文件夹
  const loadFolders = async () => {
    try {
      // 模拟文件夹数据
      const mockFolders: MediaFolder[] = [
        {
          id: 'images',
          name: '图片',
          path: '/images',
          createdAt: '2024-01-01T00:00:00Z',
          fileCount: 25
        },
        {
          id: 'videos',
          name: '视频',
          path: '/videos',
          createdAt: '2024-01-01T00:00:00Z',
          fileCount: 8
        },
        {
          id: 'documents',
          name: '文档',
          path: '/documents',
          createdAt: '2024-01-01T00:00:00Z',
          fileCount: 12
        }
      ];
      
      setFolders(mockFolders);
    } catch (error) {
      console.error('加载文件夹失败:', error);
    }
  };

  // 过滤和排序文件
  const filteredAndSortedFiles = React.useMemo(() => {
    let filtered = files;
    
    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // 类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(file => file.type === filterType);
    }
    
    // 允许类型过滤
    if (allowedTypes && allowedTypes.length > 0) {
      filtered = filtered.filter(file => allowedTypes.includes(file.mimeType));
    }
    
    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [files, searchQuery, filterType, allowedTypes, sortBy, sortOrder]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件类型
  const getFileType = (mimeType: string): MediaFile['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
  };

  // 处理文件上传
  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setUploading(true);
    const newProgress: UploadProgress[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadProgress(newProgress);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i ? { ...item, progress } : item
            )
          );
        }
        
        // 模拟上传完成
        const newFile: MediaFile = {
          id: Date.now().toString() + i,
          name: file.name,
          originalName: file.name,
          url: URL.createObjectURL(file),
          type: getFileType(file.type),
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'admin',
          tags: [],
          folder: currentFolder || undefined
        };
        
        // 如果是图片，获取尺寸
        if (newFile.type === 'image') {
          const img = new Image();
          img.onload = () => {
            newFile.dimensions = { width: img.width, height: img.height };
            setFiles(prev => [...prev, newFile]);
          };
          img.src = newFile.url;
        } else {
          setFiles(prev => [...prev, newFile]);
        }
        
        setUploadProgress(prev => 
          prev.map((item, index) => 
            index === i ? { ...item, status: 'completed' } : item
          )
        );
      }
      
      // 清理上传进度
      setTimeout(() => {
        setUploadProgress([]);
        setShowUploadArea(false);
      }, 2000);
      
    } catch (error) {
      console.error('上传失败:', error);
      setUploadProgress(prev => 
        prev.map(item => ({ ...item, status: 'error', error: '上传失败' }))
      );
    } finally {
      setUploading(false);
    }
  };

  // 处理拖拽上传
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  // 选择文件
  const toggleFileSelection = (fileId: string) => {
    if (selectionMode) {
      const newSelection = new Set(selectedFiles);
      
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        if (!multiple) {
          newSelection.clear();
        }
        newSelection.add(fileId);
      }
      
      setSelectedFiles(newSelection);
    } else {
      const file = files.find(f => f.id === fileId);
      if (file) {
        setSelectedFile(file);
        setShowFileDetails(true);
      }
    }
  };

  // 删除文件
  const deleteFile = async (fileId: string) => {
    if (confirm('确定要删除这个文件吗？')) {
      try {
        // 模拟删除API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setFiles(prev => prev.filter(f => f.id !== fileId));
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
        
        if (selectedFile?.id === fileId) {
          setSelectedFile(null);
          setShowFileDetails(false);
        }
        
        console.log('文件删除成功');
      } catch (error) {
        console.error('删除文件失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  // 创建文件夹
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const newFolder: MediaFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        path: currentFolder ? `${currentFolder}/${newFolderName}` : `/${newFolderName}`,
        parentId: currentFolder || undefined,
        createdAt: new Date().toISOString(),
        fileCount: 0
      };
      
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowCreateFolder(false);
      
      console.log('文件夹创建成功');
    } catch (error) {
      console.error('创建文件夹失败:', error);
      alert('创建失败，请重试');
    }
  };

  // 确认选择
  const handleConfirmSelection = () => {
    const selected = files.filter(f => selectedFiles.has(f.id));
    if (onSelect) {
      onSelect(selected);
    }
  };

  return (
    <div className={`media-manager ${className}`}>
      {/* 头部工具栏 */}
      <div className="media-header">
        <div className="header-left">
          <h2>媒体库</h2>
          
          {/* 面包屑导航 */}
          <div className="breadcrumb">
            <button 
              className="breadcrumb-item"
              onClick={() => setCurrentFolder(null)}
            >
              根目录
            </button>
            {currentFolder && (
              <>
                <span className="separator">/</span>
                <span className="breadcrumb-item current">
                  {folders.find(f => f.id === currentFolder)?.name}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="header-right">
          {/* 搜索 */}
          <div className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件..."
            />
          </div>
          
          {/* 过滤器 */}
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">所有类型</option>
            <option value="image">图片</option>
            <option value="video">视频</option>
            <option value="audio">音频</option>
            <option value="document">文档</option>
            <option value="other">其他</option>
          </select>
          
          {/* 排序 */}
          <select 
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
            className="sort-select"
          >
            <option value="date-desc">最新上传</option>
            <option value="date-asc">最早上传</option>
            <option value="name-asc">名称 A-Z</option>
            <option value="name-desc">名称 Z-A</option>
            <option value="size-desc">大小（大到小）</option>
            <option value="size-asc">大小（小到大）</option>
            <option value="type-asc">类型</option>
          </select>
          
          {/* 视图模式 */}
          <div className="view-modes">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="网格视图"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              ☰
            </button>
          </div>
          
          {/* 操作按钮 */}
          <button 
            className="btn-primary"
            onClick={() => setShowUploadArea(true)}
          >
            上传文件
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => setShowCreateFolder(true)}
          >
            新建文件夹
          </button>
        </div>
      </div>

      {/* 选择模式工具栏 */}
      {selectionMode && (
        <div className="selection-toolbar">
          <div className="selection-info">
            已选择 {selectedFiles.size} 个文件
          </div>
          
          <div className="selection-actions">
            <button 
              className="btn-secondary"
              onClick={() => setSelectedFiles(new Set())}
            >
              清除选择
            </button>
            
            <button 
              className="btn-primary"
              onClick={handleConfirmSelection}
              disabled={selectedFiles.size === 0}
            >
              确认选择
            </button>
            
            {onCancel && (
              <button 
                className="btn-secondary"
                onClick={onCancel}
              >
                取消
              </button>
            )}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="media-content">
        {/* 文件夹列表 */}
        {!currentFolder && folders.length > 0 && (
          <div className="folders-section">
            <h3>文件夹</h3>
            <div className="folders-grid">
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  className="folder-item"
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <div className="folder-icon">📁</div>
                  <div className="folder-name">{folder.name}</div>
                  <div className="folder-count">{folder.fileCount} 个文件</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 文件列表 */}
        <div className="files-section">
          {!currentFolder && <h3>文件</h3>}
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : filteredAndSortedFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>暂无文件</h3>
              <p>点击上传按钮添加文件</p>
            </div>
          ) : (
            <div className={`files-${viewMode}`}>
              {viewMode === 'grid' ? (
                // 网格视图
                <div className="files-grid">
                  {filteredAndSortedFiles.map(file => (
                    <div 
                      key={file.id}
                      className={`file-item ${selectedFiles.has(file.id) ? 'selected' : ''}`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="file-preview">
                        {file.type === 'image' ? (
                          <ResponsiveImage
                            src={file.thumbnailUrl || file.url}
                            alt={file.alt || file.name}
                            className="file-thumbnail"
                          />
                        ) : (
                          <div className="file-icon">
                            {typeIcons[file.type]}
                          </div>
                        )}
                        
                        {selectionMode && (
                          <div className="selection-indicator">
                            {selectedFiles.has(file.id) ? '✓' : ''}
                          </div>
                        )}
                      </div>
                      
                      <div className="file-info">
                        <div className="file-name" title={file.originalName}>
                          {file.originalName}
                        </div>
                        <div className="file-meta">
                          <span className="file-size">{formatFileSize(file.size)}</span>
                          {file.dimensions && (
                            <span className="file-dimensions">
                              {file.dimensions.width}×{file.dimensions.height}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!selectionMode && (
                        <div className="file-actions">
                          <button 
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.url, '_blank');
                            }}
                            title="预览"
                          >
                            👁️
                          </button>
                          
                          <button 
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(file.url);
                              alert('链接已复制到剪贴板');
                            }}
                            title="复制链接"
                          >
                            🔗
                          </button>
                          
                          <button 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(file.id);
                            }}
                            title="删除"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // 列表视图
                <div className="files-list">
                  <div className="list-header">
                    <div className="col-name">名称</div>
                    <div className="col-type">类型</div>
                    <div className="col-size">大小</div>
                    <div className="col-date">上传时间</div>
                    <div className="col-actions">操作</div>
                  </div>
                  
                  {filteredAndSortedFiles.map(file => (
                    <div 
                      key={file.id}
                      className={`list-item ${selectedFiles.has(file.id) ? 'selected' : ''}`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="col-name">
                        <div className="file-icon-small">
                          {typeIcons[file.type]}
                        </div>
                        <span className="file-name">{file.originalName}</span>
                        {selectionMode && (
                          <div className="selection-checkbox">
                            {selectedFiles.has(file.id) ? '✓' : '○'}
                          </div>
                        )}
                      </div>
                      
                      <div className="col-type">{file.type}</div>
                      <div className="col-size">{formatFileSize(file.size)}</div>
                      <div className="col-date">{formatDate(file.uploadedAt)}</div>
                      
                      {!selectionMode && (
                        <div className="col-actions">
                          <button 
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.url, '_blank');
                            }}
                          >
                            预览
                          </button>
                          
                          <button 
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(file.url);
                              alert('链接已复制');
                            }}
                          >
                            复制
                          </button>
                          
                          <button 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(file.id);
                            }}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 上传区域 */}
      {showUploadArea && (
        <div className="upload-overlay">
          <div className="upload-modal">
            <div className="upload-header">
              <h3>上传文件</h3>
              <button 
                className="close-btn"
                onClick={() => setShowUploadArea(false)}
              >
                ×
              </button>
            </div>
            
            <div 
              ref={dropZoneRef}
              className={`upload-area ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📁</div>
              <h4>拖拽文件到这里或点击选择</h4>
              <p>支持多文件上传</p>
              
              {allowedTypes && (
                <p className="allowed-types">
                  支持格式: {allowedTypes.join(', ')}
                </p>
              )}
            </div>
            
            {/* 上传进度 */}
            {uploadProgress.length > 0 && (
              <div className="upload-progress">
                <h4>上传进度</h4>
                {uploadProgress.map((item, index) => (
                  <div key={index} className="progress-item">
                    <div className="progress-info">
                      <span className="file-name">{item.file.name}</span>
                      <span className="progress-percent">{item.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${item.status}`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    {item.error && (
                      <div className="progress-error">{item.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 创建文件夹 */}
      {showCreateFolder && (
        <div className="folder-overlay">
          <div className="folder-modal">
            <div className="folder-header">
              <h3>新建文件夹</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateFolder(false)}
              >
                ×
              </button>
            </div>
            
            <div className="folder-form">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="输入文件夹名称"
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                autoFocus
              />
              
              <div className="folder-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowCreateFolder(false)}
                >
                  取消
                </button>
                
                <button 
                  className="btn-primary"
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文件详情 */}
      {showFileDetails && selectedFile && (
        <div className="details-overlay">
          <div className="details-modal">
            <div className="details-header">
              <h3>文件详情</h3>
              <button 
                className="close-btn"
                onClick={() => setShowFileDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="details-content">
              <div className="details-preview">
                {selectedFile.type === 'image' ? (
                  <ResponsiveImage
                    src={selectedFile.url}
                    alt={selectedFile.alt || selectedFile.name}
                    className="details-image"
                  />
                ) : (
                  <div className="details-icon">
                    {typeIcons[selectedFile.type]}
                  </div>
                )}
              </div>
              
              <div className="details-info">
                <div className="info-group">
                  <label>文件名</label>
                  <span>{selectedFile.originalName}</span>
                </div>
                
                <div className="info-group">
                  <label>文件大小</label>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
                
                <div className="info-group">
                  <label>文件类型</label>
                  <span>{selectedFile.mimeType}</span>
                </div>
                
                {selectedFile.dimensions && (
                  <div className="info-group">
                    <label>尺寸</label>
                    <span>{selectedFile.dimensions.width} × {selectedFile.dimensions.height}</span>
                  </div>
                )}
                
                <div className="info-group">
                  <label>上传时间</label>
                  <span>{formatDate(selectedFile.uploadedAt)}</span>
                </div>
                
                <div className="info-group">
                  <label>上传者</label>
                  <span>{selectedFile.uploadedBy}</span>
                </div>
                
                <div className="info-group">
                  <label>文件URL</label>
                  <div className="url-container">
                    <input 
                      type="text" 
                      value={selectedFile.url} 
                      readOnly 
                      className="url-input"
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedFile.url);
                        alert('链接已复制');
                      }}
                    >
                      复制
                    </button>
                  </div>
                </div>
                
                {selectedFile.tags.length > 0 && (
                  <div className="info-group">
                    <label>标签</label>
                    <div className="tags-list">
                      {selectedFile.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes?.join(',')}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(e.target.files);
          }
        }}
      />
    </div>
  );
};

export default MediaManager;
export type {
  MediaFile,
  MediaFolder,
  UploadProgress,
  MediaManagerProps
};