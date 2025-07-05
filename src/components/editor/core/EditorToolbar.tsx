import React, { useState, useCallback } from 'react';
import { useEditor } from './EditorProvider';
import { Button } from '../../ui/Button';
import { Dropdown } from '../../ui/Dropdown';
import { Tooltip } from '../../ui/Tooltip';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import {
  Save,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table,
  Eye,
  EyeOff,
  Split,
  Search,
  Replace,
  Settings,
  Download,
  Upload,
  Copy,
  Scissors,
  FileText,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckSquare,
  Square,
  Calendar,
  Tag,
  Hash,
  AtSign,
  Zap,
  Type,
  Palette
} from 'lucide-react';

// 工具栏组件属性
interface EditorToolbarProps {
  className?: string;
  variant?: 'full' | 'minimal' | 'compact';
  showViewControls?: boolean;
  showFormatting?: boolean;
  showInsert?: boolean;
  showActions?: boolean;
  customButtons?: React.ReactNode;
}

// 格式化按钮组件
const FormatButton: React.FC<{
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}> = ({ icon, tooltip, onClick, isActive, disabled }) => (
  <Tooltip content={tooltip}>
    <Button
      variant={isActive ? 'primary' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="p-2"
    >
      {icon}
    </Button>
  </Tooltip>
);

// 分隔符组件
const Separator: React.FC = () => (
  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
);

// 编辑器工具栏组件
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  className = '',
  variant = 'full',
  showViewControls = true,
  showFormatting = true,
  showInsert = true,
  showActions = true,
  customButtons
}) => {
  const {
    state,
    save,
    undo,
    redo,
    format,
    insertText,
    setViewMode,
    togglePreview,
    find,
    replace,
    updateSettings
  } = useEditor();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // 格式化操作
  const handleBold = useCallback(() => {
    insertText('**粗体文本**');
  }, [insertText]);

  const handleItalic = useCallback(() => {
    insertText('*斜体文本*');
  }, [insertText]);

  const handleUnderline = useCallback(() => {
    insertText('<u>下划线文本</u>');
  }, [insertText]);

  const handleStrikethrough = useCallback(() => {
    insertText('~~删除线文本~~');
  }, [insertText]);

  const handleCode = useCallback(() => {
    insertText('`代码`');
  }, [insertText]);

  const handleCodeBlock = useCallback(() => {
    insertText('```\n代码块\n```');
  }, [insertText]);

  const handleHeading = useCallback((level: number) => {
    const prefix = '#'.repeat(level);
    insertText(`${prefix} 标题${level}`);
  }, [insertText]);

  const handleList = useCallback(() => {
    insertText('- 列表项1\n- 列表项2\n- 列表项3');
  }, [insertText]);

  const handleOrderedList = useCallback(() => {
    insertText('1. 列表项1\n2. 列表项2\n3. 列表项3');
  }, [insertText]);

  const handleQuote = useCallback(() => {
    insertText('> 引用文本');
  }, [insertText]);

  const handleCheckbox = useCallback(() => {
    insertText('- [ ] 待办事项\n- [x] 已完成事项');
  }, [insertText]);

  // 插入链接
  const handleInsertLink = useCallback(() => {
    if (linkText && linkUrl) {
      insertText(`[${linkText}](${linkUrl})`);
      setLinkText('');
      setLinkUrl('');
      setShowLinkModal(false);
    }
  }, [insertText, linkText, linkUrl]);

  // 插入图片
  const handleInsertImage = useCallback(() => {
    if (imageUrl) {
      insertText(`![${imageAlt || '图片'}](${imageUrl})`);
      setImageAlt('');
      setImageUrl('');
      setShowImageModal(false);
    }
  }, [insertText, imageAlt, imageUrl]);

  // 插入表格
  const handleInsertTable = useCallback(() => {
    const headers = Array(tableCols).fill('标题').map((h, i) => `${h}${i + 1}`).join(' | ');
    const separator = Array(tableCols).fill('---').join(' | ');
    const rows = Array(tableRows - 1).fill(null).map((_, i) => 
      Array(tableCols).fill('内容').map((c, j) => `${c}${i + 1}-${j + 1}`).join(' | ')
    ).join('\n');
    
    const table = `${headers}\n${separator}\n${rows}`;
    insertText(table);
    setShowTableModal(false);
  }, [insertText, tableRows, tableCols]);

  // 搜索操作
  const handleSearch = useCallback(() => {
    if (searchQuery) {
      find(searchQuery);
      setShowSearchModal(false);
    }
  }, [find, searchQuery]);

  // 替换操作
  const handleReplace = useCallback(() => {
    if (replaceQuery && replaceWith) {
      replace(replaceQuery, replaceWith);
      setShowReplaceModal(false);
    }
  }, [replace, replaceQuery, replaceWith]);

  // 主题选项
  const themeOptions = [
    { value: 'vs', label: '浅色主题', icon: <Palette className="w-4 h-4" /> },
    { value: 'vs-dark', label: '深色主题', icon: <Palette className="w-4 h-4" /> },
    { value: 'hc-black', label: '高对比度', icon: <Palette className="w-4 h-4" /> }
  ];

  // 字体大小选项
  const fontSizeOptions = [
    { value: 12, label: '12px' },
    { value: 14, label: '14px' },
    { value: 16, label: '16px' },
    { value: 18, label: '18px' },
    { value: 20, label: '20px' },
    { value: 24, label: '24px' }
  ];

  // 视图模式选项
  const viewModeOptions = [
    { value: 'edit', label: '编辑', icon: <FileText className="w-4 h-4" /> },
    { value: 'preview', label: '预览', icon: <Eye className="w-4 h-4" /> },
    { value: 'split', label: '分屏', icon: <Split className="w-4 h-4" /> }
  ];

  // 根据变体决定显示的工具
  const isMinimal = variant === 'minimal';
  const isCompact = variant === 'compact';

  return (
    <>
      <div className={`flex items-center gap-1 p-2 border-b bg-white dark:bg-gray-800 ${className}`}>
        {/* 文件操作 */}
        {showActions && (
          <>
            <FormatButton
              icon={<Save className="w-4 h-4" />}
              tooltip="保存 (Ctrl+S)"
              onClick={save}
              disabled={state.isSaving || !state.isDirty}
            />
            <FormatButton
              icon={<Undo className="w-4 h-4" />}
              tooltip="撤销 (Ctrl+Z)"
              onClick={undo}
              disabled={!state.history.canUndo}
            />
            <FormatButton
              icon={<Redo className="w-4 h-4" />}
              tooltip="重做 (Ctrl+Y)"
              onClick={redo}
              disabled={!state.history.canRedo}
            />
            {!isMinimal && <Separator />}
          </>
        )}

        {/* 格式化工具 */}
        {showFormatting && !isMinimal && (
          <>
            <FormatButton
              icon={<Bold className="w-4 h-4" />}
              tooltip="粗体"
              onClick={handleBold}
            />
            <FormatButton
              icon={<Italic className="w-4 h-4" />}
              tooltip="斜体"
              onClick={handleItalic}
            />
            {!isCompact && (
              <>
                <FormatButton
                  icon={<Underline className="w-4 h-4" />}
                  tooltip="下划线"
                  onClick={handleUnderline}
                />
                <FormatButton
                  icon={<Strikethrough className="w-4 h-4" />}
                  tooltip="删除线"
                  onClick={handleStrikethrough}
                />
              </>
            )}
            <FormatButton
              icon={<Code className="w-4 h-4" />}
              tooltip="行内代码"
              onClick={handleCode}
            />
            <Separator />
          </>
        )}

        {/* 标题工具 */}
        {showFormatting && !isMinimal && (
          <>
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm" className="p-2">
                  <Heading1 className="w-4 h-4" />
                </Button>
              }
              items={[
                {
                  label: '标题 1',
                  icon: <Heading1 className="w-4 h-4" />,
                  onClick: () => handleHeading(1)
                },
                {
                  label: '标题 2',
                  icon: <Heading2 className="w-4 h-4" />,
                  onClick: () => handleHeading(2)
                },
                {
                  label: '标题 3',
                  icon: <Heading3 className="w-4 h-4" />,
                  onClick: () => handleHeading(3)
                }
              ]}
            />
            <Separator />
          </>
        )}

        {/* 列表和引用 */}
        {showFormatting && !isMinimal && (
          <>
            <FormatButton
              icon={<List className="w-4 h-4" />}
              tooltip="无序列表"
              onClick={handleList}
            />
            <FormatButton
              icon={<ListOrdered className="w-4 h-4" />}
              tooltip="有序列表"
              onClick={handleOrderedList}
            />
            {!isCompact && (
              <>
                <FormatButton
                  icon={<CheckSquare className="w-4 h-4" />}
                  tooltip="任务列表"
                  onClick={handleCheckbox}
                />
                <FormatButton
                  icon={<Quote className="w-4 h-4" />}
                  tooltip="引用"
                  onClick={handleQuote}
                />
              </>
            )}
            <Separator />
          </>
        )}

        {/* 插入工具 */}
        {showInsert && !isMinimal && (
          <>
            <FormatButton
              icon={<Link className="w-4 h-4" />}
              tooltip="插入链接"
              onClick={() => setShowLinkModal(true)}
            />
            <FormatButton
              icon={<Image className="w-4 h-4" />}
              tooltip="插入图片"
              onClick={() => setShowImageModal(true)}
            />
            {!isCompact && (
              <FormatButton
                icon={<Table className="w-4 h-4" />}
                tooltip="插入表格"
                onClick={() => setShowTableModal(true)}
              />
            )}
            <Separator />
          </>
        )}

        {/* 搜索和替换 */}
        {showActions && !isCompact && (
          <>
            <FormatButton
              icon={<Search className="w-4 h-4" />}
              tooltip="查找 (Ctrl+F)"
              onClick={() => setShowSearchModal(true)}
            />
            <FormatButton
              icon={<Replace className="w-4 h-4" />}
              tooltip="替换 (Ctrl+H)"
              onClick={() => setShowReplaceModal(true)}
            />
            <Separator />
          </>
        )}

        {/* 视图控制 */}
        {showViewControls && (
          <>
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm" className="p-2">
                  {state.viewMode === 'edit' && <FileText className="w-4 h-4" />}
                  {state.viewMode === 'preview' && <Eye className="w-4 h-4" />}
                  {state.viewMode === 'split' && <Split className="w-4 h-4" />}
                </Button>
              }
              items={viewModeOptions.map(option => ({
                label: option.label,
                icon: option.icon,
                onClick: () => setViewMode(option.value as any),
                isActive: state.viewMode === option.value
              }))}
            />
            {!isMinimal && <Separator />}
          </>
        )}

        {/* 设置 */}
        {showActions && !isCompact && (
          <FormatButton
            icon={<Settings className="w-4 h-4" />}
            tooltip="编辑器设置"
            onClick={() => setShowSettingsModal(true)}
          />
        )}

        {/* 自定义按钮 */}
        {customButtons && (
          <>
            <Separator />
            {customButtons}
          </>
        )}

        {/* 状态指示器 */}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {state.isDirty && (
            <span className="text-orange-500">未保存</span>
          )}
          {state.isSaving && (
            <span className="text-blue-500">保存中...</span>
          )}
          {state.lastSaved && (
            <span>已保存 {state.lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* 搜索模态框 */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="查找"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            placeholder="输入搜索内容"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSearchModal(false)}>
              取消
            </Button>
            <Button onClick={handleSearch} disabled={!searchQuery}>
              查找
            </Button>
          </div>
        </div>
      </Modal>

      {/* 替换模态框 */}
      <Modal
        isOpen={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        title="查找和替换"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            placeholder="查找内容"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
          />
          <Input
            placeholder="替换为"
            value={replaceWith}
            onChange={(e) => setReplaceWith(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReplaceModal(false)}>
              取消
            </Button>
            <Button onClick={handleReplace} disabled={!replaceQuery}>
              替换
            </Button>
          </div>
        </div>
      </Modal>

      {/* 链接模态框 */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="插入链接"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            placeholder="链接文本"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
          />
          <Input
            placeholder="链接地址"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLinkModal(false)}>
              取消
            </Button>
            <Button onClick={handleInsertLink} disabled={!linkUrl}>
              插入
            </Button>
          </div>
        </div>
      </Modal>

      {/* 图片模态框 */}
      <Modal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        title="插入图片"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            placeholder="图片描述（可选）"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
          />
          <Input
            placeholder="图片地址"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowImageModal(false)}>
              取消
            </Button>
            <Button onClick={handleInsertImage} disabled={!imageUrl}>
              插入
            </Button>
          </div>
        </div>
      </Modal>

      {/* 表格模态框 */}
      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title="插入表格"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">行数</label>
              <Input
                type="number"
                min="2"
                max="20"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">列数</label>
              <Input
                type="number"
                min="2"
                max="10"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTableModal(false)}>
              取消
            </Button>
            <Button onClick={handleInsertTable}>
              插入
            </Button>
          </div>
        </div>
      </Modal>

      {/* 设置模态框 */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="编辑器设置"
        size="md"
      >
        <div className="space-y-6">
          {/* 主题设置 */}
          <div>
            <label className="block text-sm font-medium mb-2">主题</label>
            <Dropdown
              trigger={
                <Button variant="outline" className="w-full justify-between">
                  {themeOptions.find(t => t.value === state.theme)?.label}
                </Button>
              }
              items={themeOptions.map(theme => ({
                label: theme.label,
                icon: theme.icon,
                onClick: () => updateSettings({ theme: theme.value as any }),
                isActive: state.theme === theme.value
              }))}
            />
          </div>

          {/* 字体大小 */}
          <div>
            <label className="block text-sm font-medium mb-2">字体大小</label>
            <Dropdown
              trigger={
                <Button variant="outline" className="w-full justify-between">
                  {state.fontSize}px
                </Button>
              }
              items={fontSizeOptions.map(size => ({
                label: size.label,
                onClick: () => updateSettings({ fontSize: size.value }),
                isActive: state.fontSize === size.value
              }))}
            />
          </div>

          {/* 其他设置 */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.wordWrap}
                onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">自动换行</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.lineNumbers}
                onChange={(e) => updateSettings({ lineNumbers: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">显示行号</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.minimap}
                onChange={(e) => updateSettings({ minimap: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">显示缩略图</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.autoSave}
                onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">自动保存</span>
            </label>
          </div>

          {/* 自动保存间隔 */}
          {state.autoSave && (
            <div>
              <label className="block text-sm font-medium mb-2">
                自动保存间隔（秒）
              </label>
              <Input
                type="number"
                min="5"
                max="300"
                value={state.autoSaveInterval}
                onChange={(e) => updateSettings({ autoSaveInterval: parseInt(e.target.value) || 30 })}
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setShowSettingsModal(false)}>
              确定
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditorToolbar;