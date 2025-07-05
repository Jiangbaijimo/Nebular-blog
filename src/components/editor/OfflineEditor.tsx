import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PencilIcon,
  CloudArrowUpIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  TagIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { offlineModeManager, OfflineStatus } from '../../services/offline/offlineModeManager';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { BlogDraft } from '../../services/database/sqliteManager';
import { toast } from 'react-hot-toast';

interface OfflineEditorProps {
  draftId?: string;
  onSave?: (draft: BlogDraft) => void;
  onPublish?: (draft: BlogDraft) => void;
  className?: string;
}

interface EditorState {
  title: string;
  content: string;
  tags: string[];
  categories: string[];
  status: 'draft' | 'published';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

const OfflineEditor: React.FC<OfflineEditorProps> = ({
  draftId,
  onSave,
  onPublish,
  className = ''
}) => {
  const [editorState, setEditorState] = useState<EditorState>({
    title: '',
    content: '',
    tags: [],
    categories: [],
    status: 'draft',
    lastSaved: null,
    hasUnsavedChanges: false
  });

  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // 初始化编辑器
  useEffect(() => {
    initializeEditor();
    loadOfflineStatus();
    
    // 监听离线模式事件
    const handleOfflineModeChange = () => {
      loadOfflineStatus();
      setShowOfflineIndicator(offlineModeManager.isOffline());
    };

    offlineModeManager.on('offline_mode_enabled', handleOfflineModeChange);
    offlineModeManager.on('offline_mode_disabled', handleOfflineModeChange);
    offlineModeManager.on('operation_added', loadOfflineStatus);
    offlineModeManager.on('sync_completed', loadOfflineStatus);

    return () => {
      offlineModeManager.off('offline_mode_enabled', handleOfflineModeChange);
      offlineModeManager.off('offline_mode_disabled', handleOfflineModeChange);
      offlineModeManager.off('operation_added', loadOfflineStatus);
      offlineModeManager.off('sync_completed', loadOfflineStatus);
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // 网络状态变化处理
  useEffect(() => {
    if (!isOnline && !offlineModeManager.isOffline()) {
      offlineModeManager.enableOfflineMode();
      toast.error('网络连接断开，已切换到离线模式');
    } else if (isOnline && offlineModeManager.isOffline()) {
      toast.success('网络连接恢复，正在同步数据...');
    }
  }, [isOnline]);

  // 自动保存
  useEffect(() => {
    if (editorState.hasUnsavedChanges && autoSaveEnabled) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000); // 2秒后自动保存
    }
  }, [editorState.title, editorState.content, editorState.tags, editorState.categories]);

  const initializeEditor = async () => {
    if (draftId) {
      setIsLoading(true);
      try {
        const drafts = await offlineModeManager.getDraftsOffline({ id: draftId });
        if (drafts.length > 0) {
          const draft = drafts[0];
          setEditorState({
            title: draft.title,
            content: draft.content,
            tags: draft.tags,
            categories: draft.categories,
            status: draft.status as 'draft' | 'published',
            lastSaved: draft.lastModified,
            hasUnsavedChanges: false
          });
        }
      } catch (error) {
        console.error('加载草稿失败:', error);
        toast.error('加载草稿失败');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadOfflineStatus = async () => {
    try {
      const status = await offlineModeManager.getOfflineStatus();
      setOfflineStatus(status);
    } catch (error) {
      console.error('获取离线状态失败:', error);
    }
  };

  const handleAutoSave = async () => {
    if (!editorState.hasUnsavedChanges) return;
    
    try {
      await handleSave(false);
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  };

  const handleSave = async (showToast = true) => {
    setIsSaving(true);
    
    try {
      const draftData: Partial<BlogDraft> = {
        title: editorState.title,
        content: editorState.content,
        tags: editorState.tags,
        categories: editorState.categories,
        status: editorState.status,
        lastModified: new Date()
      };

      let savedDraftId = draftId;
      
      if (draftId) {
        await offlineModeManager.updateDraftOffline(draftId, draftData);
      } else {
        savedDraftId = await offlineModeManager.createDraftOffline(draftData);
      }

      setEditorState(prev => ({
        ...prev,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }));

      if (showToast) {
        if (offlineModeManager.isOffline()) {
          toast.success('草稿已保存到本地，将在网络恢复后同步');
        } else {
          toast.success('草稿保存成功');
        }
      }

      if (onSave && savedDraftId) {
        const drafts = await offlineModeManager.getDraftsOffline({ id: savedDraftId });
        if (drafts.length > 0) {
          onSave(drafts[0]);
        }
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      toast.error('保存草稿失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!editorState.title.trim() || !editorState.content.trim()) {
      toast.error('请填写标题和内容');
      return;
    }

    try {
      // 先保存为草稿
      await handleSave(false);
      
      // 更新状态为已发布
      setEditorState(prev => ({ ...prev, status: 'published' }));
      
      if (draftId) {
        await offlineModeManager.updateDraftOffline(draftId, { status: 'published' });
      }

      if (offlineModeManager.isOffline()) {
        toast.success('文章已标记为发布，将在网络恢复后同步到服务器');
      } else {
        toast.success('文章发布成功');
      }

      if (onPublish && draftId) {
        const drafts = await offlineModeManager.getDraftsOffline({ id: draftId });
        if (drafts.length > 0) {
          onPublish(drafts[0]);
        }
      }
    } catch (error) {
      console.error('发布文章失败:', error);
      toast.error('发布文章失败');
    }
  };

  const handleInputChange = (field: keyof EditorState, value: any) => {
    setEditorState(prev => ({
      ...prev,
      [field]: value,
      hasUnsavedChanges: true
    }));
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !editorState.tags.includes(tag.trim())) {
      handleInputChange('tags', [...editorState.tags, tag.trim()]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    handleInputChange('tags', editorState.tags.filter(tag => tag !== tagToRemove));
  };

  const handleCategoryAdd = (category: string) => {
    if (category.trim() && !editorState.categories.includes(category.trim())) {
      handleInputChange('categories', [...editorState.categories, category.trim()]);
    }
  };

  const handleCategoryRemove = (categoryToRemove: string) => {
    handleInputChange('categories', editorState.categories.filter(cat => cat !== categoryToRemove));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      try {
        const results = await offlineModeManager.searchOffline(query, {
          type: 'draft',
          limit: 10
        });
        setSearchResults(results);
      } catch (error) {
        console.error('搜索失败:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const insertTextAtCursor = (text: string) => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      const currentContent = editorState.content;
      const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
      
      handleInputChange('content', newContent);
      
      // 恢复光标位置
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = start + text.length;
          editorRef.current.selectionEnd = start + text.length;
          editorRef.current.focus();
        }
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className={`offline-editor ${className}`}>
      {/* 离线状态指示器 */}
      <AnimatePresence>
        {(showOfflineIndicator || !isOnline) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4"
          >
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <p className="text-sm text-yellow-700">
                  {!isOnline ? '网络连接断开，' : ''}当前处于离线模式
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  您的更改将保存到本地，并在网络恢复后自动同步
                  {offlineStatus && offlineStatus.pendingOperations > 0 && (
                    <span className="ml-2">
                      (待同步: {offlineStatus.pendingOperations} 项)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑器工具栏 */}
      <div className="bg-white border border-gray-200 rounded-t-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <PencilIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {draftId ? '编辑草稿' : '新建文章'}
              </span>
            </div>
            
            {editorState.lastSaved && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>最后保存: {editorState.lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            
            {editorState.hasUnsavedChanges && (
              <span className="text-xs text-orange-500">有未保存的更改</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* 网络状态 */}
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <WifiIcon className="h-4 w-4 text-green-500" />
              ) : (
                <WifiIcon className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-gray-500">
                {isOnline ? (isSlowConnection ? '慢速连接' : '在线') : '离线'}
              </span>
            </div>

            {/* 自动保存开关 */}
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">自动保存</span>
            </label>

            {/* 搜索按钮 */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索草稿..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-sm max-h-40 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        insertTextAtCursor(`[${result.title}]`);
                        setShowSearch(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{result.title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {result.content.substring(0, 100)}...
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSave()}
              disabled={isSaving || !editorState.hasUnsavedChanges}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <DocumentTextIcon className="h-4 w-4" />
              )}
              <span className="text-sm">{isSaving ? '保存中...' : '保存草稿'}</span>
            </button>

            <button
              onClick={handlePublish}
              disabled={!editorState.title.trim() || !editorState.content.trim()}
              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              <span className="text-sm">发布</span>
            </button>
          </div>

          {offlineStatus && (
            <div className="text-xs text-gray-500">
              存储使用: {Math.round(offlineStatus.storageUsage.percentage)}%
            </div>
          )}
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="bg-white border-l border-r border-gray-200">
        {/* 标题输入 */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="请输入文章标题..."
            value={editorState.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full text-2xl font-bold border-none outline-none placeholder-gray-400"
          />
        </div>

        {/* 标签和分类 */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* 标签 */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <TagIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">标签</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {editorState.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="添加标签..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTagAdd(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 分类 */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FolderIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">分类</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {editorState.categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {category}
                  <button
                    onClick={() => handleCategoryRemove(category)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="添加分类..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCategoryAdd(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 内容编辑器 */}
        <div className="p-4">
          <textarea
            ref={editorRef}
            placeholder="开始写作..."
            value={editorState.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className="w-full h-96 border-none outline-none resize-none placeholder-gray-400 leading-relaxed"
          />
        </div>
      </div>

      {/* 编辑器底部 */}
      <div className="bg-gray-50 border border-gray-200 rounded-b-lg p-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>字数: {editorState.content.length}</span>
            <span>标签: {editorState.tags.length}</span>
            <span>分类: {editorState.categories.length}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {editorState.status === 'published' && (
              <span className="flex items-center space-x-1 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>已发布</span>
              </span>
            )}
            
            {isSlowConnection && (
              <span className="text-orange-500">慢速连接</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineEditor;