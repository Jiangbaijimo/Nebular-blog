import React, { useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';

// Markdown预览组件属性
interface MarkdownPreviewProps {
  content: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  enableMath?: boolean;
  enableMermaid?: boolean;
  enableToc?: boolean;
  enableCopyCode?: boolean;
  onLinkClick?: (url: string, event: React.MouseEvent) => void;
  onImageClick?: (src: string, alt: string, event: React.MouseEvent) => void;
}

// 目录项接口
interface TocItem {
  id: string;
  text: string;
  level: number;
  children: TocItem[];
}

// 配置marked
const configureMarked = () => {
  // 配置代码高亮
  marked.use(markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  }));

  // 自定义渲染器
  const renderer = new marked.Renderer();

  // 自定义标题渲染，添加锚点
  renderer.heading = (text, level) => {
    const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
    return `<h${level} id="${id}" class="heading-${level}">
      <a href="#${id}" class="heading-anchor">#</a>
      ${text}
    </h${level}>`;
  };

  // 自定义代码块渲染，添加复制按钮
  renderer.code = (code, language) => {
    const lang = language || 'plaintext';
    const highlighted = hljs.getLanguage(lang) 
      ? hljs.highlight(code, { language: lang }).value
      : hljs.highlightAuto(code).value;
    
    return `<div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-language">${lang}</span>
        <button class="copy-code-btn" data-code="${encodeURIComponent(code)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          复制
        </button>
      </div>
      <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
    </div>`;
  };

  // 自定义链接渲染
  renderer.link = (href, title, text) => {
    const titleAttr = title ? ` title="${title}"` : '';
    const target = href?.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${titleAttr}${target} class="markdown-link">${text}</a>`;
  };

  // 自定义图片渲染
  renderer.image = (href, title, text) => {
    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : '';
    return `<img src="${href}"${altAttr}${titleAttr} class="markdown-image" loading="lazy" />`;
  };

  // 自定义表格渲染
  renderer.table = (header, body) => {
    return `<div class="table-wrapper">
      <table class="markdown-table">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
  };

  // 自定义任务列表渲染
  renderer.listitem = (text) => {
    if (/^\s*\[[x ]\]\s*/.test(text)) {
      const checked = /^\s*\[x\]\s*/.test(text);
      const cleanText = text.replace(/^\s*\[[x ]\]\s*/, '');
      return `<li class="task-list-item">
        <input type="checkbox" ${checked ? 'checked' : ''} disabled class="task-checkbox" />
        ${cleanText}
      </li>`;
    }
    return `<li>${text}</li>`;
  };

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartypants: true
  });
};

// 提取目录
const extractToc = (html: string): TocItem[] => {
  const headings: TocItem[] = [];
  const headingRegex = /<h([1-6])\s+id="([^"]+)"[^>]*>.*?<\/h[1-6]>/g;
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const id = match[2];
    const text = match[0].replace(/<[^>]*>/g, '').replace('#', '').trim();
    
    headings.push({
      id,
      text,
      level,
      children: []
    });
  }

  // 构建层级结构
  const buildHierarchy = (items: TocItem[]): TocItem[] => {
    const result: TocItem[] = [];
    const stack: TocItem[] = [];

    for (const item of items) {
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        result.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }

      stack.push(item);
    }

    return result;
  };

  return buildHierarchy(headings);
};

// 目录组件
const TableOfContents: React.FC<{ toc: TocItem[]; className?: string }> = ({ toc, className = '' }) => {
  const renderTocItem = (item: TocItem) => (
    <li key={item.id} className={`toc-item toc-level-${item.level}`}>
      <a href={`#${item.id}`} className="toc-link">
        {item.text}
      </a>
      {item.children.length > 0 && (
        <ul className="toc-children">
          {item.children.map(renderTocItem)}
        </ul>
      )}
    </li>
  );

  if (toc.length === 0) return null;

  return (
    <div className={`toc-container ${className}`}>
      <h3 className="toc-title">目录</h3>
      <ul className="toc-list">
        {toc.map(renderTocItem)}
      </ul>
    </div>
  );
};

// Markdown预览组件
export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className = '',
  theme = 'auto',
  enableMath = true,
  enableMermaid = true,
  enableToc = true,
  enableCopyCode = true,
  onLinkClick,
  onImageClick
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = React.useState<TocItem[]>([]);

  // 初始化marked配置
  useEffect(() => {
    configureMarked();
  }, []);

  // 初始化mermaid
  useEffect(() => {
    if (enableMermaid) {
      mermaid.initialize({
        startOnLoad: true,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit'
      });
    }
  }, [enableMermaid, theme]);

  // 渲染HTML
  const renderedHtml = useMemo(() => {
    if (!content.trim()) return '';

    try {
      let html = marked(content);
      
      // 处理Mermaid图表
      if (enableMermaid) {
        html = html.replace(
          /<pre><code class="hljs language-mermaid">(.*?)<\/code><\/pre>/gs,
          (match, code) => {
            const decodedCode = decodeURIComponent(code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
            return `<div class="mermaid">${decodedCode}</div>`;
          }
        );
      }

      // 处理数学公式（如果启用）
      if (enableMath) {
        // 行内公式
        html = html.replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>');
        // 块级公式
        html = html.replace(/\$\$([^$]+)\$\$/g, '<div class="math-block">$1</div>');
      }

      // 清理HTML
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'em', 'u', 's', 'code', 'pre',
          'a', 'img',
          'ul', 'ol', 'li',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'blockquote',
          'div', 'span',
          'input', 'button', 'svg', 'path'
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'target', 'rel',
          'src', 'alt', 'loading',
          'id', 'class',
          'type', 'checked', 'disabled',
          'data-code',
          'stroke-linecap', 'stroke-linejoin', 'stroke-width',
          'fill', 'stroke', 'viewBox'
        ]
      });
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return '<p class="error">渲染错误</p>';
    }
  }, [content, enableMath, enableMermaid]);

  // 提取目录
  useEffect(() => {
    if (enableToc && renderedHtml) {
      const tocItems = extractToc(renderedHtml);
      setToc(tocItems);
    }
  }, [renderedHtml, enableToc]);

  // 处理点击事件
  useEffect(() => {
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // 处理链接点击
      if (target.tagName === 'A' && target.classList.contains('markdown-link')) {
        const href = target.getAttribute('href');
        if (href && onLinkClick) {
          event.preventDefault();
          onLinkClick(href, event as any);
        }
      }
      
      // 处理图片点击
      if (target.tagName === 'IMG' && target.classList.contains('markdown-image')) {
        const src = target.getAttribute('src');
        const alt = target.getAttribute('alt');
        if (src && onImageClick) {
          event.preventDefault();
          onImageClick(src, alt || '', event as any);
        }
      }
      
      // 处理代码复制
      if (target.classList.contains('copy-code-btn') || target.closest('.copy-code-btn')) {
        const btn = target.classList.contains('copy-code-btn') ? target : target.closest('.copy-code-btn');
        const code = btn?.getAttribute('data-code');
        if (code && enableCopyCode) {
          navigator.clipboard.writeText(decodeURIComponent(code)).then(() => {
            const originalText = btn!.innerHTML;
            btn!.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>已复制`;
            setTimeout(() => {
              btn!.innerHTML = originalText;
            }, 2000);
          });
        }
      }
    };

    const previewElement = previewRef.current;
    if (previewElement) {
      previewElement.addEventListener('click', handleClick);
      return () => previewElement.removeEventListener('click', handleClick);
    }
  }, [onLinkClick, onImageClick, enableCopyCode]);

  // 渲染Mermaid图表
  useEffect(() => {
    if (enableMermaid && previewRef.current) {
      const mermaidElements = previewRef.current.querySelectorAll('.mermaid');
      mermaidElements.forEach((element, index) => {
        const id = `mermaid-${Date.now()}-${index}`;
        element.id = id;
        mermaid.render(id, element.textContent || '', (svgCode) => {
          element.innerHTML = svgCode;
        });
      });
    }
  }, [renderedHtml, enableMermaid]);

  return (
    <div className={`markdown-preview ${theme} ${className}`}>
      {enableToc && toc.length > 0 && (
        <TableOfContents toc={toc} className="mb-6" />
      )}
      
      <div
        ref={previewRef}
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
      
      <style jsx>{`
        .markdown-preview {
          @apply text-gray-900 dark:text-gray-100;
        }
        
        .markdown-content {
          @apply prose prose-gray dark:prose-invert max-w-none;
        }
        
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          @apply relative group;
        }
        
        .heading-anchor {
          @apply absolute -left-6 top-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity;
          text-decoration: none;
        }
        
        .code-block-wrapper {
          @apply relative mb-4;
        }
        
        .code-block-header {
          @apply flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg;
        }
        
        .code-language {
          @apply text-sm font-medium text-gray-600 dark:text-gray-400;
        }
        
        .copy-code-btn {
          @apply flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors;
        }
        
        .markdown-content pre {
          @apply mt-0 rounded-t-none;
        }
        
        .markdown-link {
          @apply text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors;
        }
        
        .markdown-image {
          @apply max-w-full h-auto rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow;
        }
        
        .table-wrapper {
          @apply overflow-x-auto;
        }
        
        .markdown-table {
          @apply w-full border-collapse border border-gray-300 dark:border-gray-600;
        }
        
        .markdown-table th,
        .markdown-table td {
          @apply border border-gray-300 dark:border-gray-600 px-3 py-2;
        }
        
        .markdown-table th {
          @apply bg-gray-100 dark:bg-gray-800 font-semibold;
        }
        
        .task-list-item {
          @apply flex items-start gap-2 list-none;
        }
        
        .task-checkbox {
          @apply mt-1;
        }
        
        .toc-container {
          @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
        }
        
        .toc-title {
          @apply text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100;
        }
        
        .toc-list {
          @apply space-y-1;
        }
        
        .toc-item {
          @apply list-none;
        }
        
        .toc-link {
          @apply text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm;
          text-decoration: none;
        }
        
        .toc-level-1 .toc-link {
          @apply font-semibold;
        }
        
        .toc-level-2 .toc-link {
          @apply ml-4;
        }
        
        .toc-level-3 .toc-link {
          @apply ml-8;
        }
        
        .toc-level-4 .toc-link {
          @apply ml-12;
        }
        
        .toc-level-5 .toc-link {
          @apply ml-16;
        }
        
        .toc-level-6 .toc-link {
          @apply ml-20;
        }
        
        .toc-children {
          @apply mt-1 space-y-1;
        }
        
        .math-inline {
          @apply bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm;
        }
        
        .math-block {
          @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-4 text-center;
        }
        
        .mermaid {
          @apply flex justify-center my-4;
        }
        
        .error {
          @apply text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800;
        }
      `}</style>
    </div>
  );
};

export default MarkdownPreview;