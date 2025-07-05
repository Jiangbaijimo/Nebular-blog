import React, { useEffect, useRef, useState } from 'react';
import { EditorProvider, useEditor } from './EditorProvider';
import { MonacoEditor, MonacoEditorRef } from './MonacoEditor';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { Loading } from '../../ui/Loading';
import { Button } from '../../ui/Button';
import { Tooltip } from '../../ui/Tooltip';
import {
  PanelLeft,
  PanelRight,
  Maximize,
  Minimize,
  RotateCcw,
  Save,
  FileText,
  Eye,
  Split
} from 'lucide-react';

// 编辑器布局组件属性
interface EditorLayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: number;
  onSidebarToggle?: (visible: boolean) => void;
}

// 编辑器布局组件
const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  className = '',
  showSidebar = false,
  sidebarContent,
  sidebarPosition = 'right',
  sidebarWidth = 300,
  onSidebarToggle
}) => {
  const [sidebarVisible, setSidebarVisible] = useState(showSidebar);
  const [isResizing, setIsResizing] = useState(false);
  const [currentSidebarWidth, setCurrentSidebarWidth] = useState(sidebarWidth);
  const resizeRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    const newVisible = !sidebarVisible;
    setSidebarVisible(newVisible);
    onSidebarToggle?.(newVisible);
  };

  // 处理侧边栏拖拽调整大小
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const container = resizeRef.current?.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      let newWidth;
      
      if (sidebarPosition === 'right') {
        newWidth = containerRect.right - e.clientX;
      } else {
        newWidth = e.clientX - containerRect.left;
      }
      
      newWidth = Math.max(200, Math.min(600, newWidth));
      setCurrentSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarPosition]);

  return (
    <div className={`flex h-full ${className}`}>
      {/* 左侧边栏 */}
      {sidebarPosition === 'left' && sidebarVisible && sidebarContent && (
        <>
          <div 
            className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0"
            style={{ width: currentSidebarWidth }}
          >
            {sidebarContent}
          </div>
          <div
            ref={resizeRef}
            className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors"
            onMouseDown={handleMouseDown}
          />
        </>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>

      {/* 右侧边栏 */}
      {sidebarPosition === 'right' && sidebarVisible && sidebarContent && (
        <>
          <div
            ref={resizeRef}
            className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors"
            onMouseDown={handleMouseDown}
          />
          <div 
            className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-shrink-0"
            style={{ width: currentSidebarWidth }}
          >
            {sidebarContent}
          </div>
        </>
      )}

      {/* 侧边栏切换按钮 */}
      {sidebarContent && (
        <Tooltip content={sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={`absolute top-4 z-10 ${
              sidebarPosition === 'right' ? 'right-4' : 'left-4'
            }`}
          >
            {sidebarPosition === 'right' ? (
              sidebarVisible ? <PanelRight className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />
            ) : (
              sidebarVisible ? <PanelLeft className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />
            )}
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

// 编辑器内容组件
const EditorContent: React.FC = () => {
  const {
    state,
    editorRef,
    setContent,
    save,
    setViewMode
  } = useEditor();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理编辑器内容变化
  const handleContentChange = (value: string) => {
    setContent(value);
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 渲染编辑器视图
  const renderEditorView = () => {
    switch (state.viewMode) {
      case 'edit':
        return (
          <div className="flex-1 flex flex-col">
            <MonacoEditor
              ref={editorRef}
              value={state.content}
              language="markdown"
              theme={state.theme}
              options={{
                fontSize: state.fontSize,
                wordWrap: state.wordWrap ? 'on' : 'off',
                lineNumbers: state.lineNumbers ? 'on' : 'off',
                minimap: { enabled: state.minimap },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true
                },
                suggest: {
                  showKeywords: true,
                  showSnippets: true
                },
                quickSuggestions: {
                  other: true,
                  comments: true,
                  strings: true
                }
              }}
              onChange={handleContentChange}
              onMount={(editor) => {
                // 添加自定义快捷键
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                  save();
                });
                
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
                  setViewMode('preview');
                });
                
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
                  setViewMode('split');
                });
              }}
            />
          </div>
        );

      case 'preview':
        return (
          <div className="flex-1 overflow-auto p-6">
            <MarkdownPreview
              content={state.content}
              theme={state.theme === 'vs-dark' ? 'dark' : 'light'}
              enableMath={true}
              enableMermaid={true}
              enableToc={true}
              enableCopyCode={true}
            />
          </div>
        );

      case 'split':
        return (
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
              <MonacoEditor
                ref={editorRef}
                value={state.content}
                language="markdown"
                theme={state.theme}
                options={{
                  fontSize: state.fontSize,
                  wordWrap: state.wordWrap ? 'on' : 'off',
                  lineNumbers: state.lineNumbers ? 'on' : 'off',
                  minimap: { enabled: false }, // 分屏模式下禁用缩略图
                  automaticLayout: true,
                  scrollBeyondLastLine: false
                }}
                onChange={handleContentChange}
              />
            </div>
            <div className="flex-1 overflow-auto p-6">
              <MarkdownPreview
                content={state.content}
                theme={state.theme === 'vs-dark' ? 'dark' : 'light'}
                enableMath={true}
                enableMermaid={true}
                enableToc={false} // 分屏模式下禁用目录
                enableCopyCode={true}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading size="lg" text="加载编辑器..." />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {/* 工具栏 */}
      <EditorToolbar
        variant={isFullscreen ? 'full' : 'full'}
        customButtons={
          <Tooltip content={isFullscreen ? '退出全屏' : '全屏编辑'}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="p-2"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </Tooltip>
        }
      />

      {/* 编辑器内容 */}
      {renderEditorView()}

      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>Markdown</span>
          <span>UTF-8</span>
          {state.cursorPosition && (
            <span>
              行 {state.cursorPosition.lineNumber}, 列 {state.cursorPosition.column}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span>字符数: {state.content.length}</span>
          <span>行数: {state.content.split('\n').length}</span>
          
          {/* 视图模式指示器 */}
          <div className="flex items-center gap-1">
            <Button
              variant={state.viewMode === 'edit' ? 'primary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('edit')}
              className="p-1"
            >
              <FileText className="w-3 h-3" />
            </Button>
            <Button
              variant={state.viewMode === 'preview' ? 'primary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('preview')}
              className="p-1"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button
              variant={state.viewMode === 'split' ? 'primary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('split')}
              className="p-1"
            >
              <Split className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主编辑器组件属性
interface EditorProps {
  initialContent?: string;
  className?: string;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  autoSave?: boolean;
  autoSaveInterval?: number;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  onError?: (error: Error) => void;
}

// 主编辑器组件
export const Editor: React.FC<EditorProps> = ({
  initialContent = '',
  className = '',
  showSidebar = false,
  sidebarContent,
  sidebarPosition = 'right',
  autoSave = true,
  autoSaveInterval = 30,
  onContentChange,
  onSave,
  onError
}) => {
  return (
    <EditorProvider
      initialContent={initialContent}
      onContentChange={onContentChange}
      onSave={onSave}
      onError={onError}
      autoSave={autoSave}
      autoSaveInterval={autoSaveInterval}
    >
      <EditorLayout
        className={className}
        showSidebar={showSidebar}
        sidebarContent={sidebarContent}
        sidebarPosition={sidebarPosition}
      >
        <EditorContent />
      </EditorLayout>
    </EditorProvider>
  );
};

// 导出相关组件和Hook
export {
  EditorProvider,
  useEditor,
  MonacoEditor,
  EditorToolbar,
  MarkdownPreview,
  EditorLayout
};

export default Editor;