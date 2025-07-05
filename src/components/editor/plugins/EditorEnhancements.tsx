import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor } from '../core/EditorProvider';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Tooltip } from '../../ui/Tooltip';
import { Dropdown } from '../../ui/Dropdown';
import {
  Search,
  Replace,
  Code,
  Palette,
  Keyboard,
  Settings,
  Eye,
  EyeOff,
  RotateCcw,
  RotateCw,
  Save,
  Copy,
  Scissors,
  ClipboardPaste,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  MoreHorizontal,
  FileText,
  Hash,
  List,
  Quote,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Image,
  Table,
  CheckSquare
} from 'lucide-react';

// 快捷键配置
interface ShortcutConfig {
  key: string;
  description: string;
  action: () => void;
  category: string;
}

// 代码片段配置
interface SnippetConfig {
  trigger: string;
  description: string;
  content: string;
  category: string;
}

// 主题配置
interface ThemeConfig {
  name: string;
  label: string;
  isDark: boolean;
}

// 编辑器增强功能组件属性
interface EditorEnhancementsProps {
  className?: string;
}

// 编辑器增强功能组件
export const EditorEnhancements: React.FC<EditorEnhancementsProps> = ({ className = '' }) => {
  const { 
    editorRef, 
    insertText, 
    replaceText, 
    getSelectedText, 
    getCursorPosition,
    setCursorPosition,
    undo,
    redo,
    save,
    settings,
    updateSettings
  } = useEditor();
  
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceTextValue, setReplaceTextValue] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  const findInputRef = useRef<HTMLInputElement>(null);

  // 主题配置
  const themes: ThemeConfig[] = [
    { name: 'vs', label: 'Light', isDark: false },
    { name: 'vs-dark', label: 'Dark', isDark: true },
    { name: 'hc-black', label: 'High Contrast', isDark: true },
    { name: 'github-light', label: 'GitHub Light', isDark: false },
    { name: 'github-dark', label: 'GitHub Dark', isDark: true },
    { name: 'monokai', label: 'Monokai', isDark: true },
    { name: 'solarized-light', label: 'Solarized Light', isDark: false },
    { name: 'solarized-dark', label: 'Solarized Dark', isDark: true }
  ];

  // 代码片段配置
  const snippets: SnippetConfig[] = [
    {
      trigger: 'h1',
      description: '一级标题',
      content: '# ',
      category: '标题'
    },
    {
      trigger: 'h2',
      description: '二级标题',
      content: '## ',
      category: '标题'
    },
    {
      trigger: 'h3',
      description: '三级标题',
      content: '### ',
      category: '标题'
    },
    {
      trigger: 'code',
      description: '代码块',
      content: '```\n\n```',
      category: '代码'
    },
    {
      trigger: 'js',
      description: 'JavaScript代码块',
      content: '```javascript\n\n```',
      category: '代码'
    },
    {
      trigger: 'py',
      description: 'Python代码块',
      content: '```python\n\n```',
      category: '代码'
    },
    {
      trigger: 'table',
      description: '表格',
      content: '| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容1 | 内容2 | 内容3 |',
      category: '表格'
    },
    {
      trigger: 'link',
      description: '链接',
      content: '[链接文本](URL)',
      category: '链接'
    },
    {
      trigger: 'img',
      description: '图片',
      content: '![图片描述](图片URL)',
      category: '媒体'
    },
    {
      trigger: 'quote',
      description: '引用',
      content: '> ',
      category: '格式'
    },
    {
      trigger: 'list',
      description: '无序列表',
      content: '- ',
      category: '列表'
    },
    {
      trigger: 'olist',
      description: '有序列表',
      content: '1. ',
      category: '列表'
    },
    {
      trigger: 'task',
      description: '任务列表',
      content: '- [ ] ',
      category: '列表'
    },
    {
      trigger: 'hr',
      description: '分割线',
      content: '---',
      category: '格式'
    },
    {
      trigger: 'math',
      description: '数学公式',
      content: '$$\n\n$$',
      category: '公式'
    },
    {
      trigger: 'inline-math',
      description: '行内公式',
      content: '$公式$',
      category: '公式'
    }
  ];

  // 快捷键配置
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'Ctrl+S',
      description: '保存文档',
      action: save,
      category: '文件操作'
    },
    {
      key: 'Ctrl+Z',
      description: '撤销',
      action: undo,
      category: '编辑操作'
    },
    {
      key: 'Ctrl+Y',
      description: '重做',
      action: redo,
      category: '编辑操作'
    },
    {
      key: 'Ctrl+F',
      description: '查找',
      action: () => setShowFindReplace(true),
      category: '查找替换'
    },
    {
      key: 'Ctrl+H',
      description: '替换',
      action: () => setShowFindReplace(true),
      category: '查找替换'
    },
    {
      key: 'Ctrl+B',
      description: '粗体',
      action: () => wrapText('**', '**'),
      category: '格式化'
    },
    {
      key: 'Ctrl+I',
      description: '斜体',
      action: () => wrapText('*', '*'),
      category: '格式化'
    },
    {
      key: 'Ctrl+U',
      description: '下划线',
      action: () => wrapText('<u>', '</u>'),
      category: '格式化'
    },
    {
      key: 'Ctrl+K',
      description: '插入链接',
      action: () => insertText('[链接文本](URL)'),
      category: '插入'
    },
    {
      key: 'F11',
      description: '全屏切换',
      action: toggleFullscreen,
      category: '视图'
    }
  ];

  // 包装选中文本
  const wrapText = useCallback((prefix: string, suffix: string) => {
    const selectedText = getSelectedText();
    if (selectedText) {
      replaceText(selectedText, `${prefix}${selectedText}${suffix}`);
    } else {
      insertText(`${prefix}${suffix}`);
      // 将光标移动到中间
      const position = getCursorPosition();
      setCursorPosition(position.lineNumber, position.column - suffix.length);
    }
  }, [getSelectedText, replaceText, insertText, getCursorPosition, setCursorPosition]);

  // 插入代码片段
  const insertSnippet = useCallback((snippet: SnippetConfig) => {
    insertText(snippet.content);
    setShowSnippets(false);
  }, [insertText]);

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    // 这里可以添加实际的全屏逻辑
  }, [isFullscreen]);

  // 缩放控制
  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(50, Math.min(200, zoomLevel + delta));
    setZoomLevel(newZoom);
    updateSettings({ fontSize: Math.round(14 * (newZoom / 100)) });
  }, [zoomLevel, updateSettings]);

  // 查找功能
  const performFind = useCallback(() => {
    if (!findText || !editorRef?.current) return;
    
    // 这里应该调用Monaco编辑器的查找API
    // 暂时模拟查找结果
    setTotalMatches(Math.floor(Math.random() * 10) + 1);
    setCurrentMatch(1);
  }, [findText, editorRef]);

  // 替换功能
  const performReplace = useCallback(() => {
    if (!findText || !replaceTextValue || !editorRef?.current) return;
    
    // 这里应该调用Monaco编辑器的替换API
    console.log('Replace:', findText, 'with:', replaceTextValue);
  }, [findText, replaceTextValue, editorRef]);

  // 全部替换
  const performReplaceAll = useCallback(() => {
    if (!findText || !replaceTextValue || !editorRef?.current) return;
    
    // 这里应该调用Monaco编辑器的全部替换API
    console.log('Replace all:', findText, 'with:', replaceTextValue);
  }, [findText, replaceTextValue, editorRef]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 处理快捷键
      const shortcut = shortcuts.find(s => {
        const keys = s.key.split('+');
        const ctrlKey = keys.includes('Ctrl') && e.ctrlKey;
        const shiftKey = keys.includes('Shift') && e.shiftKey;
        const altKey = keys.includes('Alt') && e.altKey;
        const key = keys[keys.length - 1];
        
        return (
          (keys.includes('Ctrl') ? ctrlKey : !e.ctrlKey) &&
          (keys.includes('Shift') ? shiftKey : !e.shiftKey) &&
          (keys.includes('Alt') ? altKey : !e.altKey) &&
          (e.key === key || e.code === key)
        );
      });
      
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  // 查找替换模态框打开时聚焦输入框
  useEffect(() => {
    if (showFindReplace && findInputRef.current) {
      findInputRef.current.focus();
    }
  }, [showFindReplace]);

  // 渲染工具栏
  const renderToolbar = () => (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 查找替换 */}
      <Tooltip content="查找替换 (Ctrl+F)">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFindReplace(true)}
          className="p-2"
        >
          <Search className="w-4 h-4" />
        </Button>
      </Tooltip>

      {/* 代码片段 */}
      <Tooltip content="代码片段">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSnippets(true)}
          className="p-2"
        >
          <Code className="w-4 h-4" />
        </Button>
      </Tooltip>

      {/* 主题切换 */}
      <Dropdown
        trigger={
          <Tooltip content="切换主题">
            <Button variant="ghost" size="sm" className="p-2">
              <Palette className="w-4 h-4" />
            </Button>
          </Tooltip>
        }
        items={themes.map(theme => ({
          label: theme.label,
          onClick: () => updateSettings({ theme: theme.name }),
          active: settings.theme === theme.name
        }))}
      />

      {/* 缩放控制 */}
      <div className="flex items-center gap-1">
        <Tooltip content="缩小">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(-10)}
            className="p-2"
            disabled={zoomLevel <= 50}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <span className="text-xs text-gray-500 min-w-[3rem] text-center">
          {zoomLevel}%
        </span>
        
        <Tooltip content="放大">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(10)}
            className="p-2"
            disabled={zoomLevel >= 200}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      {/* 全屏切换 */}
      <Tooltip content="全屏切换 (F11)">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="p-2"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      </Tooltip>

      {/* 快捷键帮助 */}
      <Tooltip content="快捷键帮助">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowShortcuts(true)}
          className="p-2"
        >
          <Keyboard className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );

  return (
    <>
      {renderToolbar()}

      {/* 查找替换模态框 */}
      <Modal
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        title="查找和替换"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">查找</label>
            <Input
              ref={findInputRef}
              placeholder="输入要查找的内容"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performFind()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">替换为</label>
            <Input
              placeholder="输入替换内容"
              value={replaceTextValue}
              onChange={(e) => setReplaceTextValue(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              <span className="text-sm">区分大小写</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
              />
              <span className="text-sm">全字匹配</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
              />
              <span className="text-sm">正则表达式</span>
            </label>
          </div>
          
          {totalMatches > 0 && (
            <div className="text-sm text-gray-500">
              {currentMatch} / {totalMatches} 个匹配项
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={performFind}>
              查找
            </Button>
            <Button variant="outline" onClick={performReplace}>
              替换
            </Button>
            <Button onClick={performReplaceAll}>
              全部替换
            </Button>
          </div>
        </div>
      </Modal>

      {/* 代码片段模态框 */}
      <Modal
        isOpen={showSnippets}
        onClose={() => setShowSnippets(false)}
        title="代码片段"
        size="lg"
      >
        <div className="space-y-4">
          {Object.entries(
            snippets.reduce((acc, snippet) => {
              if (!acc[snippet.category]) acc[snippet.category] = [];
              acc[snippet.category].push(snippet);
              return acc;
            }, {} as Record<string, SnippetConfig[]>)
          ).map(([category, categorySnippets]) => (
            <div key={category}>
              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                {category}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {categorySnippets.map((snippet) => (
                  <button
                    key={snippet.trigger}
                    onClick={() => insertSnippet(snippet)}
                    className="p-3 text-left border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="font-mono text-sm text-blue-600 dark:text-blue-400">
                      {snippet.trigger}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {snippet.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* 快捷键帮助模态框 */}
      <Modal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="快捷键"
        size="lg"
      >
        <div className="space-y-4">
          {Object.entries(
            shortcuts.reduce((acc, shortcut) => {
              if (!acc[shortcut.category]) acc[shortcut.category] = [];
              acc[shortcut.category].push(shortcut);
              return acc;
            }, {} as Record<string, ShortcutConfig[]>)
          ).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

// 格式化工具栏组件
export const FormatToolbar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { insertText, getSelectedText, replaceText, getCursorPosition, setCursorPosition } = useEditor();

  // 包装选中文本
  const wrapText = useCallback((prefix: string, suffix: string) => {
    const selectedText = getSelectedText();
    if (selectedText) {
      replaceText(selectedText, `${prefix}${selectedText}${suffix}`);
    } else {
      insertText(`${prefix}${suffix}`);
      const position = getCursorPosition();
      setCursorPosition(position.lineNumber, position.column - suffix.length);
    }
  }, [getSelectedText, replaceText, insertText, getCursorPosition, setCursorPosition]);

  const formatActions = [
    {
      icon: <Bold className="w-4 h-4" />,
      tooltip: '粗体 (Ctrl+B)',
      action: () => wrapText('**', '**')
    },
    {
      icon: <Italic className="w-4 h-4" />,
      tooltip: '斜体 (Ctrl+I)',
      action: () => wrapText('*', '*')
    },
    {
      icon: <Underline className="w-4 h-4" />,
      tooltip: '下划线 (Ctrl+U)',
      action: () => wrapText('<u>', '</u>')
    },
    {
      icon: <Strikethrough className="w-4 h-4" />,
      tooltip: '删除线',
      action: () => wrapText('~~', '~~')
    },
    {
      icon: <Code className="w-4 h-4" />,
      tooltip: '行内代码',
      action: () => wrapText('`', '`')
    },
    {
      icon: <Link className="w-4 h-4" />,
      tooltip: '链接 (Ctrl+K)',
      action: () => insertText('[链接文本](URL)')
    },
    {
      icon: <Image className="w-4 h-4" />,
      tooltip: '图片',
      action: () => insertText('![图片描述](图片URL)')
    },
    {
      icon: <Quote className="w-4 h-4" />,
      tooltip: '引用',
      action: () => insertText('> ')
    },
    {
      icon: <List className="w-4 h-4" />,
      tooltip: '无序列表',
      action: () => insertText('- ')
    },
    {
      icon: <Hash className="w-4 h-4" />,
      tooltip: '有序列表',
      action: () => insertText('1. ')
    },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      tooltip: '任务列表',
      action: () => insertText('- [ ] ')
    },
    {
      icon: <Table className="w-4 h-4" />,
      tooltip: '表格',
      action: () => insertText('| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容1 | 内容2 | 内容3 |')
    }
  ];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {formatActions.map((action, index) => (
        <Tooltip key={index} content={action.tooltip}>
          <Button
            variant="ghost"
            size="sm"
            onClick={action.action}
            className="p-2"
          >
            {action.icon}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
};

export default EditorEnhancements;