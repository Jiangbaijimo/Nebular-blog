import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { Loading } from '../ui/Loading';
import { Input } from '../ui/Input';
import imageService, { ImageInfo } from '../../services/storage/imageService';
import {
  Folder,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive,
  Download,
  Upload,
  Trash2,
  Edit3,
  Copy,
  Move,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Eye,
  Share2,
  Star,
  Clock,
  Calendar,
  HardDrive,
  RefreshCw,
  Plus,
  FolderPlus,
  X,
  Check,
  AlertCircle,
  Info,
  Settings,
  Tag,
  Bookmark
} from 'lucide-react';

// 文件类型
type FileType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

// 文件信息接口
interface FileInfo {
  id: string;
  name: string;
  type: FileType;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  description?: string;
  isStarred: boolean;
  parentId?: string;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

// 文件夹信息接口
interface FolderInfo {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  fileCount: number;
  totalSize: number;
  isStarred: boolean;
}

// 排序选项
type SortBy = 'name' | 'size' | 'type' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

// 视图模式
type ViewMode = 'grid' | 'list' | 'detail';

// 文件项组件属性
interface FileItemProps {
  file: FileInfo;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect: (file: FileInfo) => void;
  onPreview: (file: FileInfo) => void;
  onEdit: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
  onStar: (file: FileInfo) => void;
  onCopy: (file: FileInfo) => void;
  onMove: (file: FileInfo) => void;
}

// 文件项组件
const FileItem: React.FC<FileItemProps> = ({
  file,
  viewMode,
  isSelected,
  onSelect,
  onPreview,
  onEdit,
  onDelete,
  onStar,
  onCopy,
  onMove
}) => {
  const [showActions, setShowActions] = useState(false);

  const getFileIcon = (type: FileType, mimeType: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-green-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-orange-500" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-yellow-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
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

  if (viewMode === 'grid') {
    return (
      <div
        className={`relative group bg-white dark:bg-gray-800 border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
        onClick={() => onSelect(file)}
        onDoubleClick={() => onPreview(file)}
      >
        {/* 缩略图/图标 */}
        <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
          {file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-4xl">
              {getFileIcon(file.type, file.mimeType)}
            </div>
          )}
          
          {/* 星标 */}
          {file.isStarred && (
            <div className="absolute top-2 left-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            </div>
          )}
          
          {/* 选中标识 */}
          {isSelected && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          )}
          
          {/* 悬停操作 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Tooltip content="预览">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(file);
                  }}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="更多">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* 文件信息 */}
        <div className="p-3">
          <div className="font-medium text-sm truncate" title={file.name}>
            {file.name}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatFileSize(file.size)}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(file.createdAt)}
          </div>
          
          {/* 标签 */}
          {file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {file.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1 rounded"
                >
                  {tag}
                </span>
              ))}
              {file.tags.length > 2 && (
                <span className="text-xs text-gray-400">+{file.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* 操作菜单 */}
        {showActions && (
          <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStar(file);
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Star className={`w-4 h-4 ${file.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                {file.isStarred ? '取消星标' : '添加星标'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(file);
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
                编辑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(file);
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4 text-gray-400" />
                复制
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(file);
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Move className="w-4 h-4 text-gray-400" />
                移动
              </button>
              <hr className="my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(file);
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        onClick={() => onSelect(file)}
        onDoubleClick={() => onPreview(file)}
      >
        {/* 选择框 */}
        <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
          {isSelected && <Check className="w-3 h-3 text-blue-500" />}
        </div>
        
        {/* 图标/缩略图 */}
        <div className="w-8 h-8 flex-shrink-0">
          {file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            getFileIcon(file.type, file.mimeType)
          )}
        </div>
        
        {/* 星标 */}
        <div className="w-4">
          {file.isStarred && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
        </div>
        
        {/* 文件名 */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate" title={file.name}>
            {file.name}
          </div>
        </div>
        
        {/* 大小 */}
        <div className="w-20 text-sm text-gray-500 text-right">
          {formatFileSize(file.size)}
        </div>
        
        {/* 修改时间 */}
        <div className="w-32 text-sm text-gray-500 text-right">
          {formatDate(file.updatedAt)}
        </div>
        
        {/* 操作 */}
        <div className="flex items-center gap-1">
          <Tooltip content="预览">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file);
              }}
              className="p-1"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="更多">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  }

  // Detail view
  return (
    <div
      className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={() => onSelect(file)}
      onDoubleClick={() => onPreview(file)}
    >
      <div className="flex gap-4">
        {/* 缩略图/图标 */}
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
          {file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="text-2xl">
              {getFileIcon(file.type, file.mimeType)}
            </div>
          )}
        </div>
        
        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate" title={file.name}>
              {file.name}
            </h3>
            {file.isStarred && (
              <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
            )}
            {isSelected && (
              <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="text-sm text-gray-500 mt-1">
            {formatFileSize(file.size)} • {file.mimeType}
          </div>
          
          {file.width && file.height && (
            <div className="text-sm text-gray-500">
              {file.width} × {file.height}
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            创建: {formatDate(file.createdAt)} • 修改: {formatDate(file.updatedAt)}
          </div>
          
          {/* 标签 */}
          {file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {file.tags.map((tag, index) => (
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
          {file.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {file.description}
            </p>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(file);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            预览
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// 文件管理器组件属性
interface FileManagerProps {
  className?: string;
  showTrigger?: boolean;
  initialFolder?: string;
  onFileSelect?: (file: FileInfo) => void;
  allowMultiSelect?: boolean;
  fileTypes?: FileType[];
  maxFileSize?: number;
}

// 文件管理器组件
export const FileManager: React.FC<FileManagerProps> = ({
  className = '',
  showTrigger = true,
  initialFolder,
  onFileSelect,
  allowMultiSelect = false,
  fileTypes,
  maxFileSize
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(initialFolder);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterType, setFilterType] = useState<FileType | 'all'>('all');
  const [showStarred, setShowStarred] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockFiles: FileInfo[] = [
        {
          id: '1',
          name: 'example.jpg',
          type: 'image',
          size: 1024000,
          url: '/api/files/1',
          thumbnailUrl: '/api/files/1/thumbnail',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          tags: ['photo', 'landscape'],
          description: 'Beautiful landscape photo',
          isStarred: true,
          parentId: currentFolder,
          mimeType: 'image/jpeg',
          width: 1920,
          height: 1080
        },
        {
          id: '2',
          name: 'document.pdf',
          type: 'document',
          size: 2048000,
          url: '/api/files/2',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          tags: ['work', 'important'],
          isStarred: false,
          parentId: currentFolder,
          mimeType: 'application/pdf'
        }
      ];
      
      let filteredFiles = mockFiles;
      
      // 应用过滤器
      if (filterType !== 'all') {
        filteredFiles = filteredFiles.filter(file => file.type === filterType);
      }
      
      if (showStarred) {
        filteredFiles = filteredFiles.filter(file => file.isStarred);
      }
      
      if (fileTypes && fileTypes.length > 0) {
        filteredFiles = filteredFiles.filter(file => fileTypes.includes(file.type));
      }
      
      if (maxFileSize) {
        filteredFiles = filteredFiles.filter(file => file.size <= maxFileSize);
      }
      
      // 搜索
      if (searchTerm) {
        filteredFiles = filteredFiles.filter(file =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // 排序
      filteredFiles.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'createdAt':
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          case 'updatedAt':
            aValue = a.updatedAt.getTime();
            bValue = b.updatedAt.getTime();
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
      
      setFiles(filteredFiles);
      
      // 模拟文件夹数据
      const mockFolders: FolderInfo[] = [
        {
          id: 'folder1',
          name: 'Images',
          parentId: currentFolder,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          fileCount: 25,
          totalSize: 50000000,
          isStarred: false
        }
      ];
      
      setFolders(mockFolders);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolder, searchTerm, filterType, showStarred, sortBy, sortOrder, fileTypes, maxFileSize]);

  // 打开时加载数据
  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, loadFiles]);

  // 选择文件
  const handleSelectFile = useCallback((file: FileInfo) => {
    if (allowMultiSelect) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(file.id)) {
          newSet.delete(file.id);
        } else {
          newSet.add(file.id);
        }
        return newSet;
      });
    } else {
      setSelectedFiles(new Set([file.id]));
      onFileSelect?.(file);
    }
  }, [allowMultiSelect, onFileSelect]);

  // 预览文件
  const handlePreviewFile = useCallback((file: FileInfo) => {
    setPreviewFile(file);
  }, []);

  // 编辑文件
  const handleEditFile = useCallback((file: FileInfo) => {
    setEditingFile(file);
  }, []);

  // 删除文件
  const handleDeleteFile = useCallback(async (file: FileInfo) => {
    try {
      // 模拟删除API调用
      console.log('Deleting file:', file.id);
      setFiles(prev => prev.filter(f => f.id !== file.id));
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, []);

  // 星标文件
  const handleStarFile = useCallback(async (file: FileInfo) => {
    try {
      // 模拟星标API调用
      console.log('Starring file:', file.id);
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, isStarred: !f.isStarred } : f
      ));
    } catch (error) {
      console.error('Star failed:', error);
    }
  }, []);

  // 复制文件
  const handleCopyFile = useCallback(async (file: FileInfo) => {
    try {
      await navigator.clipboard.writeText(file.url);
      console.log('File URL copied:', file.url);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, []);

  // 移动文件
  const handleMoveFile = useCallback(async (file: FileInfo) => {
    // 这里可以打开文件夹选择器
    console.log('Moving file:', file.id);
  }, []);

  // 上传文件
  const handleUploadFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      // 这里可以集成到 imageService 或其他上传服务
      console.log('Uploading file:', file.name);
    });
  }, []);

  // 创建文件夹
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    
    try {
      // 模拟创建文件夹API调用
      const newFolder: FolderInfo = {
        id: `folder_${Date.now()}`,
        name: newFolderName,
        parentId: currentFolder,
        createdAt: new Date(),
        updatedAt: new Date(),
        fileCount: 0,
        totalSize: 0,
        isStarred: false
      };
      
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowNewFolder(false);
    } catch (error) {
      console.error('Create folder failed:', error);
    }
  }, [newFolderName, currentFolder]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {showTrigger && (
        <div className={className}>
          <Tooltip content="文件管理">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="p-2"
            >
              <Folder className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      )}

      {/* 文件管理器模态框 */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="文件管理器"
        size="full"
      >
        <div className="h-full flex flex-col">
          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {/* 上传按钮 */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                上传文件
              </Button>
              
              {/* 新建文件夹 */}
              <Button
                variant="outline"
                onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                新建文件夹
              </Button>
              
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleUploadFiles(e.target.files);
                  }
                }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文件..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm w-64"
                />
              </div>
              
              {/* 过滤器 */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
              >
                <option value="all">全部类型</option>
                <option value="image">图片</option>
                <option value="video">视频</option>
                <option value="audio">音频</option>
                <option value="document">文档</option>
                <option value="archive">压缩包</option>
              </select>
              
              {/* 星标过滤 */}
              <Button
                variant={showStarred ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setShowStarred(!showStarred)}
              >
                <Star className={`w-4 h-4 ${showStarred ? 'fill-current' : ''}`} />
              </Button>
              
              {/* 排序 */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as SortBy);
                  setSortOrder(order as SortOrder);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
              >
                <option value="name-asc">名称 ↑</option>
                <option value="name-desc">名称 ↓</option>
                <option value="size-asc">大小 ↑</option>
                <option value="size-desc">大小 ↓</option>
                <option value="createdAt-asc">创建时间 ↑</option>
                <option value="createdAt-desc">创建时间 ↓</option>
                <option value="updatedAt-asc">修改时间 ↑</option>
                <option value="updatedAt-desc">修改时间 ↓</option>
              </select>
              
              {/* 视图模式 */}
              <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('detail')}
                  className={`p-2 ${viewMode === 'detail' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800'}`}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              
              {/* 刷新 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={loadFiles}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* 面包屑导航 */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setCurrentFolder(undefined)}
                className="text-blue-600 hover:text-blue-800"
              >
                根目录
              </button>
              {currentFolder && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600 dark:text-gray-400">当前文件夹</span>
                </>
              )}
            </div>
          </div>

          {/* 文件列表 */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loading size="lg" text="加载中..." />
              </div>
            ) : (
              <>
                {/* 文件夹列表 */}
                {folders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">文件夹</h3>
                    <div className={`${
                      viewMode === 'grid' 
                        ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
                        : 'space-y-2'
                    }`}>
                      {folders.map((folder) => (
                        <div
                          key={folder.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onDoubleClick={() => setCurrentFolder(folder.id)}
                        >
                          <Folder className="w-8 h-8 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{folder.name}</div>
                            <div className="text-xs text-gray-500">
                              {folder.fileCount} 个文件 • {formatFileSize(folder.totalSize)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 文件列表 */}
                {files.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无文件</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">文件</h3>
                    {viewMode === 'list' && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* 表头 */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-medium">
                          <div className="w-4"></div>
                          <div className="w-8"></div>
                          <div className="w-4"></div>
                          <div className="flex-1">名称</div>
                          <div className="w-20 text-right">大小</div>
                          <div className="w-32 text-right">修改时间</div>
                          <div className="w-20">操作</div>
                        </div>
                        {files.map((file) => (
                          <FileItem
                            key={file.id}
                            file={file}
                            viewMode={viewMode}
                            isSelected={selectedFiles.has(file.id)}
                            onSelect={handleSelectFile}
                            onPreview={handlePreviewFile}
                            onEdit={handleEditFile}
                            onDelete={handleDeleteFile}
                            onStar={handleStarFile}
                            onCopy={handleCopyFile}
                            onMove={handleMoveFile}
                          />
                        ))}
                      </div>
                    )}
                    
                    {viewMode !== 'list' && (
                      <div className={`${
                        viewMode === 'grid' 
                          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
                          : 'space-y-4'
                      }`}>
                        {files.map((file) => (
                          <FileItem
                            key={file.id}
                            file={file}
                            viewMode={viewMode}
                            isSelected={selectedFiles.has(file.id)}
                            onSelect={handleSelectFile}
                            onPreview={handlePreviewFile}
                            onEdit={handleEditFile}
                            onDelete={handleDeleteFile}
                            onStar={handleStarFile}
                            onCopy={handleCopyFile}
                            onMove={handleMoveFile}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 状态栏 */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>
                {selectedFiles.size > 0 ? (
                  `已选择 ${selectedFiles.size} 个文件`
                ) : (
                  `${files.length} 个文件`
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <HardDrive className="w-4 h-4" />
                  <span>存储空间: 2.5GB / 10GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 新建文件夹模态框 */}
      <Modal
        isOpen={showNewFolder}
        onClose={() => {
          setShowNewFolder(false);
          setNewFolderName('');
        }}
        title="新建文件夹"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="请输入文件夹名称"
            autoFocus
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="flex-1"
            >
              创建
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
              }}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 文件预览模态框 */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name || ''}
        size="lg"
      >
        {previewFile && (
          <div className="space-y-4">
            {/* 文件预览 */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              {previewFile.type === 'image' ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="w-full h-auto max-h-96 object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <div className="text-6xl mb-4">
                      {previewFile.type === 'video' && <Video className="w-16 h-16 mx-auto text-purple-500" />}
                      {previewFile.type === 'audio' && <Music className="w-16 h-16 mx-auto text-green-500" />}
                      {previewFile.type === 'document' && <FileText className="w-16 h-16 mx-auto text-orange-500" />}
                      {previewFile.type === 'archive' && <Archive className="w-16 h-16 mx-auto text-yellow-500" />}
                      {previewFile.type === 'other' && <File className="w-16 h-16 mx-auto text-gray-500" />}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">无法预览此文件类型</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 文件信息 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">大小:</span> {formatFileSize(previewFile.size)}
              </div>
              <div>
                <span className="font-medium">类型:</span> {previewFile.mimeType}
              </div>
              {previewFile.width && previewFile.height && (
                <div>
                  <span className="font-medium">尺寸:</span> {previewFile.width} × {previewFile.height}
                </div>
              )}
              <div>
                <span className="font-medium">创建时间:</span> {new Intl.DateTimeFormat('zh-CN').format(previewFile.createdAt)}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleCopyFile(previewFile)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制链接
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewFile.url;
                  link.download = previewFile.name;
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

      {/* 文件编辑模态框 */}
      <Modal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        title="编辑文件信息"
        size="md"
      >
        {editingFile && (
          <div className="space-y-4">
            <Input
              label="文件名"
              value={editingFile.name}
              onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
            />
            
            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
              <textarea
                value={editingFile.description || ''}
                onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded resize-none"
                rows={3}
                placeholder="请输入文件描述"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">标签</label>
              <input
                type="text"
                value={editingFile.tags.join(', ')}
                onChange={(e) => setEditingFile({ 
                  ...editingFile, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
                placeholder="用逗号分隔多个标签"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // 保存文件信息
                  setFiles(prev => prev.map(f => 
                    f.id === editingFile.id ? editingFile : f
                  ));
                  setEditingFile(null);
                }}
                className="flex-1"
              >
                保存
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingFile(null)}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default FileManager;