/**
 * 文章编辑器组件
 * 提供富文本编辑、Markdown编辑、实时预览等功能
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ResponsiveImage from '../../components/common/ResponsiveImage';
import { formatDate } from '../../utils/date';

interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'scheduled';
  visibility: 'public' | 'private' | 'password';
  password?: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  publishedAt?: string;
  scheduledAt?: string;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  featured: boolean;
  allowComments: boolean;
}

interface EditorSettings {
  mode: 'markdown' | 'visual';
  showPreview: boolean;
  autoSave: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  theme: 'light' | 'dark';
}

interface PostEditorProps {
  postId?: string;
  className?: string;
  onSave?: (post: PostData) => void;
  onCancel?: () => void;
}

const PostEditor: React.FC<PostEditorProps> = ({ 
  postId, 
  className = '', 
  onSave, 
  onCancel 
}) => {
  const [post, setPost] = useState<PostData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    visibility: 'public',
    category: '',
    tags: [],
    seo: {},
    featured: false,
    allowComments: true
  });
  
  const [settings, setSettings] = useState<EditorSettings>({
    mode: 'markdown',
    showPreview: true,
    autoSave: true,
    wordWrap: true,
    lineNumbers: true,
    theme: 'light'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 分类选项
  const categories = [
    '前端开发', '后端开发', '编程语言', '前端框架', 'CSS', 
    '数据库', '工具', '算法', '设计', '产品', '其他'
  ];

  // 加载文章数据
  useEffect(() => {
    if (postId) {
      loadPost(postId);
    }
  }, [postId]);

  // 自动保存
  useEffect(() => {
    if (settings.autoSave && post.title) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000);
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [post, settings.autoSave]);

  // 计算字数和阅读时间
  useEffect(() => {
    const text = post.content.replace(/[#*`_~\[\]()]/g, '').trim();
    const words = text.length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200)); // 假设每分钟阅读200字
  }, [post.content]);

  // 生成slug
  useEffect(() => {
    if (post.title && !postId) {
      const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setPost(prev => ({ ...prev, slug }));
    }
  }, [post.title, postId]);

  // 加载文章
  const loadPost = async (id: string) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟加载的文章数据
      const mockPost: PostData = {
        id,
        title: 'React最佳实践指南',
        slug: 'react-best-practices-guide',
        content: `# React最佳实践指南

## 简介

这是一篇关于React开发最佳实践的详细指南。

## 组件设计原则

### 1. 单一职责原则

每个组件应该只负责一个功能。

### 2. 可复用性

设计组件时要考虑复用性。

## 状态管理

### useState vs useReducer

选择合适的状态管理方式。

## 性能优化

### React.memo

使用React.memo优化组件渲染。

### useMemo和useCallback

合理使用缓存hooks。

## 总结

遵循这些最佳实践可以提高代码质量。`,
        excerpt: '学习React开发中的最佳实践，提高代码质量和开发效率。',
        status: 'draft',
        visibility: 'public',
        featuredImage: '/images/react-guide.jpg',
        category: '前端开发',
        tags: ['React', 'JavaScript', '最佳实践'],
        seo: {
          title: 'React最佳实践指南 - 提高开发效率',
          description: '学习React开发中的最佳实践，包括组件设计、状态管理、性能优化等。',
          keywords: ['React', '最佳实践', '前端开发', 'JavaScript']
        },
        featured: true,
        allowComments: true
      };
      
      setPost(mockPost);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自动保存
  const handleAutoSave = async () => {
    if (!post.title.trim()) return;
    
    try {
      // 模拟自动保存API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
      console.log('自动保存成功');
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  };

  // 保存文章
  const handleSave = async (status: PostData['status'] = 'draft') => {
    if (!post.title.trim()) {
      alert('请输入文章标题');
      return;
    }
    
    if (!post.content.trim()) {
      alert('请输入文章内容');
      return;
    }
    
    setSaving(true);
    
    try {
      const postData = {
        ...post,
        status,
        publishedAt: status === 'published' ? new Date().toISOString() : post.publishedAt
      };
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('保存文章:', postData);
      setLastSaved(new Date());
      
      if (onSave) {
        onSave(postData);
      }
      
      alert(`文章${status === 'published' ? '发布' : '保存'}成功！`);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 上传图片
  const handleImageUpload = async (file: File) => {
    try {
      // 模拟图片上传
      const formData = new FormData();
      formData.append('image', file);
      
      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟返回的图片URL
      const imageUrl = `/images/uploaded-${Date.now()}.jpg`;
      
      // 插入到编辑器
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      insertTextAtCursor(imageMarkdown);
      
      console.log('图片上传成功:', imageUrl);
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败');
    }
  };

  // 在光标位置插入文本
  const insertTextAtCursor = (text: string) => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = post.content;
    
    const newContent = content.substring(0, start) + text + content.substring(end);
    setPost(prev => ({ ...prev, content: newContent }));
    
    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // 添加标签
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !post.tags.includes(tag)) {
      setPost(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 添加SEO关键词
  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !post.seo.keywords?.includes(keyword)) {
      setPost(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...(prev.seo.keywords || []), keyword]
        }
      }));
      setKeywordInput('');
    }
  };

  // 删除SEO关键词
  const removeKeyword = (keywordToRemove: string) => {
    setPost(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords?.filter(keyword => keyword !== keywordToRemove) || []
      }
    }));
  };

  // 插入Markdown语法
  const insertMarkdown = (syntax: string) => {
    insertTextAtCursor(syntax);
  };

  if (loading) {
    return (
      <div className={`editor-loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载编辑器...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`post-editor ${className} ${settings.theme}`}>
      {/* 编辑器头部 */}
      <div className="editor-header">
        <div className="header-left">
          <input
            type="text"
            value={post.title}
            onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
            placeholder="输入文章标题..."
            className="title-input"
          />
          
          <div className="editor-stats">
            <span className="stat-item">{wordCount} 字</span>
            <span className="stat-item">{readingTime} 分钟阅读</span>
            {lastSaved && (
              <span className="stat-item">上次保存: {formatDate(lastSaved.toISOString())}</span>
            )}
          </div>
        </div>
        
        <div className="header-right">
          <div className="editor-modes">
            <button
              className={`mode-btn ${settings.mode === 'markdown' ? 'active' : ''}`}
              onClick={() => setSettings(prev => ({ ...prev, mode: 'markdown' }))}
            >
              Markdown
            </button>
            <button
              className={`mode-btn ${settings.mode === 'visual' ? 'active' : ''}`}
              onClick={() => setSettings(prev => ({ ...prev, mode: 'visual' }))}
            >
              可视化
            </button>
          </div>
          
          <button
            className={`preview-btn ${settings.showPreview ? 'active' : ''}`}
            onClick={() => setSettings(prev => ({ ...prev, showPreview: !prev.showPreview }))}
          >
            {settings.showPreview ? '隐藏预览' : '显示预览'}
          </button>
          
          <button
            className="settings-btn"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 工具栏 */}
      {settings.mode === 'markdown' && (
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('**粗体文本**')}
              title="粗体"
            >
              <strong>B</strong>
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('*斜体文本*')}
              title="斜体"
            >
              <em>I</em>
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('~~删除线~~')}
              title="删除线"
            >
              <s>S</s>
            </button>
          </div>
          
          <div className="toolbar-group">
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n# 标题1\n')}
              title="标题1"
            >
              H1
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n## 标题2\n')}
              title="标题2"
            >
              H2
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n### 标题3\n')}
              title="标题3"
            >
              H3
            </button>
          </div>
          
          <div className="toolbar-group">
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n- 列表项\n')}
              title="无序列表"
            >
              • 列表
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n1. 列表项\n')}
              title="有序列表"
            >
              1. 列表
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n> 引用文本\n')}
              title="引用"
            >
              " 引用
            </button>
          </div>
          
          <div className="toolbar-group">
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n```\n代码块\n```\n')}
              title="代码块"
            >
              &lt;/&gt; 代码
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('[链接文本](URL)')}
              title="链接"
            >
              🔗 链接
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => fileInputRef.current?.click()}
              title="插入图片"
            >
              🖼️ 图片
            </button>
          </div>
          
          <div className="toolbar-group">
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n')}
              title="表格"
            >
              📊 表格
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => insertMarkdown('\n---\n')}
              title="分割线"
            >
              ➖ 分割线
            </button>
          </div>
        </div>
      )}

      {/* 编辑器主体 */}
      <div className="editor-body">
        {/* 左侧编辑区 */}
        <div className={`editor-content ${settings.showPreview ? 'split' : 'full'}`}>
          <textarea
            ref={contentRef}
            value={post.content}
            onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
            placeholder="开始写作..."
            className={`content-textarea ${settings.wordWrap ? 'word-wrap' : ''} ${settings.lineNumbers ? 'line-numbers' : ''}`}
          />
        </div>
        
        {/* 右侧预览区 */}
        {settings.showPreview && (
          <div className="editor-preview">
            <div className="preview-header">
              <h3>预览</h3>
            </div>
            <div className="preview-content">
              {/* 这里应该渲染Markdown内容 */}
              <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        )}
      </div>

      {/* 侧边栏 */}
      <div className="editor-sidebar">
        {/* 发布设置 */}
        <div className="sidebar-section">
          <h3 className="section-title">发布设置</h3>
          
          <div className="form-group">
            <label>状态</label>
            <select 
              value={post.status}
              onChange={(e) => setPost(prev => ({ ...prev, status: e.target.value as PostData['status'] }))}
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="scheduled">定时发布</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>可见性</label>
            <select 
              value={post.visibility}
              onChange={(e) => setPost(prev => ({ ...prev, visibility: e.target.value as PostData['visibility'] }))}
            >
              <option value="public">公开</option>
              <option value="private">私密</option>
              <option value="password">密码保护</option>
            </select>
          </div>
          
          {post.visibility === 'password' && (
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={post.password || ''}
                onChange={(e) => setPost(prev => ({ ...prev, password: e.target.value }))}
                placeholder="设置访问密码"
              />
            </div>
          )}
          
          {post.status === 'scheduled' && (
            <div className="form-group">
              <label>发布时间</label>
              <input
                type="datetime-local"
                value={post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setPost(prev => ({ ...prev, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={post.featured}
                onChange={(e) => setPost(prev => ({ ...prev, featured: e.target.checked }))}
              />
              设为精选文章
            </label>
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={post.allowComments}
                onChange={(e) => setPost(prev => ({ ...prev, allowComments: e.target.checked }))}
              />
              允许评论
            </label>
          </div>
        </div>

        {/* 分类和标签 */}
        <div className="sidebar-section">
          <h3 className="section-title">分类和标签</h3>
          
          <div className="form-group">
            <label>分类</label>
            <select 
              value={post.category}
              onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">选择分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>标签</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="输入标签后按回车"
              />
              <button onClick={addTag}>添加</button>
            </div>
            <div className="tags-list">
              {post.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 特色图片 */}
        <div className="sidebar-section">
          <h3 className="section-title">特色图片</h3>
          
          {post.featuredImage ? (
            <div className="featured-image">
              <ResponsiveImage
                src={post.featuredImage}
                alt="特色图片"
                className="featured-img"
              />
              <button 
                className="remove-image"
                onClick={() => setPost(prev => ({ ...prev, featuredImage: undefined }))}
              >
                移除图片
              </button>
            </div>
          ) : (
            <button className="upload-image">
              上传特色图片
            </button>
          )}
        </div>

        {/* 摘要 */}
        <div className="sidebar-section">
          <h3 className="section-title">文章摘要</h3>
          
          <div className="form-group">
            <textarea
              value={post.excerpt}
              onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="输入文章摘要..."
              rows={3}
            />
            <div className="character-count">
              {post.excerpt.length} / 200
            </div>
          </div>
        </div>

        {/* SEO设置 */}
        <div className="sidebar-section">
          <h3 className="section-title">
            SEO设置
            <button 
              className="toggle-btn"
              onClick={() => setShowSEOPanel(!showSEOPanel)}
            >
              {showSEOPanel ? '收起' : '展开'}
            </button>
          </h3>
          
          {showSEOPanel && (
            <>
              <div className="form-group">
                <label>SEO标题</label>
                <input
                  type="text"
                  value={post.seo.title || ''}
                  onChange={(e) => setPost(prev => ({
                    ...prev,
                    seo: { ...prev.seo, title: e.target.value }
                  }))}
                  placeholder="SEO标题（留空使用文章标题）"
                />
              </div>
              
              <div className="form-group">
                <label>SEO描述</label>
                <textarea
                  value={post.seo.description || ''}
                  onChange={(e) => setPost(prev => ({
                    ...prev,
                    seo: { ...prev.seo, description: e.target.value }
                  }))}
                  placeholder="SEO描述（留空使用文章摘要）"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>关键词</label>
                <div className="keyword-input-container">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="输入关键词后按回车"
                  />
                  <button onClick={addKeyword}>添加</button>
                </div>
                <div className="keywords-list">
                  {post.seo.keywords?.map(keyword => (
                    <span key={keyword} className="keyword">
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="editor-footer">
        <div className="footer-left">
          <button 
            className="btn-secondary"
            onClick={onCancel}
          >
            取消
          </button>
        </div>
        
        <div className="footer-right">
          <button 
            className="btn-secondary"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>
          
          <button 
            className="btn-primary"
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            {saving ? '发布中...' : '发布文章'}
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImageUpload(file);
          }
        }}
      />

      {/* 设置面板 */}
      {showSettingsPanel && (
        <div className="settings-panel">
          <div className="panel-header">
            <h3>编辑器设置</h3>
            <button onClick={() => setShowSettingsPanel(false)}>×</button>
          </div>
          
          <div className="panel-content">
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                />
                自动保存
              </label>
            </div>
            
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) => setSettings(prev => ({ ...prev, wordWrap: e.target.checked }))}
                />
                自动换行
              </label>
            </div>
            
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.lineNumbers}
                  onChange={(e) => setSettings(prev => ({ ...prev, lineNumbers: e.target.checked }))}
                />
                显示行号
              </label>
            </div>
            
            <div className="setting-item">
              <label>主题</label>
              <select 
                value={settings.theme}
                onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostEditor;
export type {
  PostData,
  EditorSettings,
  PostEditorProps
};