import React, { useState, useEffect } from 'react';
import {
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Trash2,
  Edit,
  Eye,
  Copy,
  Image,
  Video,
  FileText,
  Music,
  Archive,
  MoreHorizontal,
  FolderPlus,
  Plus,
  X,
  Check
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive';
  size: number;
  url: string;
  thumbnail?: string;
  uploadDate: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  folder?: string;
}

interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  fileCount: number;
  createdAt: string;
}

const MediaLibrary: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadMediaFiles();
  }, [currentFolder]);

  const loadMediaFiles = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟文件夹数据
    setFolders([
      {
        id: '1',
        name: '图片',
        fileCount: 25,
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        name: '视频',
        fileCount: 8,
        createdAt: '2024-01-10'
      },
      {
        id: '3',
        name: '文档',
        fileCount: 12,
        createdAt: '2024-01-08'
      }
    ]);
    
    // 模拟文件数据
    setFiles([
      {
        id: '1',
        name: 'hero-image.jpg',
        type: 'image',
        size: 2048576,
        url: '/images/hero-image.jpg',
        thumbnail: '/images/thumbnails/hero-image.jpg',
        uploadDate: '2024-01-20',
        dimensions: { width: 1920, height: 1080 },
        folder: currentFolder || undefined
      },
      {
        id: '2',
        name: 'blog-post-1.jpg',
        type: 'image',
        size: 1536000,
        url: '/images/blog-post-1.jpg',
        thumbnail: '/images/thumbnails/blog-post-1.jpg',
        uploadDate: '2024-01-19',
        dimensions: { width: 1200, height: 800 },
        folder: currentFolder || undefined
      },
      {
        id: '3',
        name: 'demo-video.mp4',
        type: 'video',
        size: 15728640,
        url: '/videos/demo-video.mp4',
        thumbnail: '/images/thumbnails/demo-video.jpg',
        uploadDate: '2024-01-18',
        duration: 120,
        folder: currentFolder || undefined
      },
      {
        id: '4',
        name: 'user-manual.pdf',
        type: 'document',
        size: 5242880,
        url: '/documents/user-manual.pdf',
        uploadDate: '2024-01-17',
        folder: currentFolder || undefined
      },
      {
        id: '5',
        name: 'background-music.mp3',
        type: 'audio',
        size: 8388608,
        url: '/audio/background-music.mp3',
        uploadDate: '2024-01-16',
        duration: 180,
        folder: currentFolder || undefined
      }
    ]);
    
    setLoading(false);
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || file.type === typeFilter;
    const matchesFolder = currentFolder ? file.folder === currentFolder : !file.folder;
    return matchesSearch && matchesType && matchesFolder;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
      case 'audio':
        return <Music className="w-6 h-6" />;
      case 'document':
        return <FileText className="w-6 h-6" />;
      case 'archive':
        return <Archive className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'text-green-600';
      case 'video':
        return 'text-blue-600';
      case 'audio':
        return 'text-purple-600';
      case 'document':
        return 'text-red-600';
      case 'archive':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(file => file.id));
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: MediaFolder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        parentId: currentFolder || undefined,
        fileCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowNewFolderModal(false);
    }
  };

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
    const files = Array.from(e.dataTransfer.files);
    // 处理文件上传
    console.log('上传文件:', files);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">媒体库</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">媒体库</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            管理和组织您的媒体文件。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            新建文件夹
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            上传文件
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总文件数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{files.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">图片</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {files.filter(f => f.type === 'image').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Image className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">视频</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {files.filter(f => f.type === 'video').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">存储空间</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Archive className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部类型</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="document">文档</option>
              <option value="archive">压缩包</option>
            </select>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentFolder && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => setCurrentFolder(null)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              媒体库
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-white">
              {folders.find(f => f.id === currentFolder)?.name}
            </span>
          </nav>
        </div>
      )}

      {/* Selection Bar */}
      {selectedFiles.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200">
              已选择 {selectedFiles.length} 个文件
            </span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                下载
              </button>
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                删除
              </button>
              <button
                onClick={() => setSelectedFiles([])}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${
          dragOver ? 'border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Folders */}
        {!currentFolder && folders.length > 0 && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">文件夹</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-2">
                      <FolderPlus className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate w-full text-center">
                      {folder.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {folder.fileCount} 个文件
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        <div className="p-6">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || typeFilter !== 'all' ? '未找到匹配的文件' : '暂无文件'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || typeFilter !== 'all' ? '尝试调整搜索条件或筛选器' : '点击上传按钮添加文件'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      全选
                    </span>
                  </label>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 {filteredFiles.length} 个文件
                </span>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`relative group border rounded-lg overflow-hidden hover:border-blue-500 transition-colors ${
                        selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelect(file.id)}
                        className="absolute top-2 left-2 z-10 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {file.type === 'image' && file.thumbnail ? (
                          <img
                            src={file.thumbnail}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`${getFileTypeColor(file.type)}`}>
                            {getFileIcon(file.type)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                        {file.dimensions && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {file.dimensions.width} × {file.dimensions.height}
                          </p>
                        )}
                        {file.duration && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <button className="p-1 bg-white dark:bg-gray-800 rounded shadow-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
                            <Eye className="w-3 h-3" />
                          </button>
                          <button className="p-1 bg-white dark:bg-gray-800 rounded shadow-lg text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors">
                            <Download className="w-3 h-3" />
                          </button>
                          <button className="p-1 bg-white dark:bg-gray-800 rounded shadow-lg text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg hover:border-blue-500 transition-colors ${
                        selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelect(file.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        {file.type === 'image' && file.thumbnail ? (
                          <img
                            src={file.thumbnail}
                            alt={file.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className={`${getFileTypeColor(file.type)}`}>
                            {getFileIcon(file.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.uploadDate}</span>
                          {file.dimensions && (
                            <span>{file.dimensions.width} × {file.dimensions.height}</span>
                          )}
                          {file.duration && (
                            <span>{Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">上传文件</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-2">点击选择文件或拖拽到此处</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">支持图片、视频、音频、文档等格式</p>
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                选择文件
              </label>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">新建文件夹</h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  文件夹名称
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="输入文件夹名称"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;