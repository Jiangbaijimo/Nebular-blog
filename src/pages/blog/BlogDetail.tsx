/**
 * 博客文章详情页组件
 * 展示完整的博客文章内容、评论、相关文章等
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ResponsiveImage from '../../components/common/ResponsiveImage';
import { formatDate, formatReadTime } from '../../utils/date';
import { SimpleBlogPost as BlogPost } from '../../types/blog';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
    email?: string;
    website?: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  replies?: Comment[];
  likeCount: number;
  isLiked: boolean;
  status: 'approved' | 'pending' | 'spam';
}

interface TableOfContent {
  id: string;
  title: string;
  level: number;
  anchor: string;
  children?: TableOfContent[];
}

interface BlogDetailProps {
  className?: string;
}

const BlogDetail: React.FC<BlogDetailProps> = ({ className = '' }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tableOfContents, setTableOfContents] = useState<TableOfContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 交互状态
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [readProgress, setReadProgress] = useState(0);
  
  // 评论状态
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentSortBy, setCommentSortBy] = useState<'latest' | 'oldest' | 'popular'>('latest');

  // 加载文章数据
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟文章数据
        const mockPost: BlogPost = {
          id,
          title: `博客文章详情 ${id}`,
          excerpt: '这是一篇详细的技术博客文章，介绍了现代前端开发的最佳实践...',
          content: `
# 现代前端开发最佳实践

## 引言

在当今快速发展的技术环境中，前端开发已经从简单的静态页面制作演变为复杂的应用程序开发。本文将探讨现代前端开发的最佳实践。

## 技术栈选择

### React 生态系统

React 作为目前最流行的前端框架之一，提供了强大的组件化开发能力：

\`\`\`jsx
function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

### TypeScript 的重要性

TypeScript 为 JavaScript 添加了静态类型检查，大大提高了代码的可维护性：

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUserInfo(user: User): string {
  return \`\${user.name} (\${user.email})\`;
}
\`\`\`

## 性能优化

### 代码分割

使用动态导入实现代码分割：

\`\`\`javascript
const LazyComponent = React.lazy(() => import('./LazyComponent'));
\`\`\`

### 图片优化

- 使用现代图片格式（WebP、AVIF）
- 实现响应式图片
- 添加懒加载

## 开发工具

### 构建工具

1. **Vite** - 快速的构建工具
2. **Webpack** - 功能强大的模块打包器
3. **Rollup** - 专注于库开发

### 代码质量

- ESLint 进行代码检查
- Prettier 统一代码格式
- Husky 添加 Git hooks

## 测试策略

### 单元测试

\`\`\`javascript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello World')).toBeInTheDocument();
});
\`\`\`

### 集成测试

使用 Cypress 或 Playwright 进行端到端测试。

## 部署和监控

### CI/CD 流程

1. 代码提交触发构建
2. 运行测试套件
3. 构建生产版本
4. 部署到生产环境

### 性能监控

- 使用 Web Vitals 监控核心性能指标
- 实现错误追踪和日志记录
- 设置性能预算

## 总结

现代前端开发需要综合考虑技术选型、性能优化、开发效率和代码质量等多个方面。通过采用最佳实践，我们可以构建出高质量、高性能的前端应用。

持续学习和实践是前端开发者成长的关键。随着技术的不断发展，我们需要保持开放的心态，拥抱新技术，同时也要理性地评估技术的适用性。
          `,
          coverImage: '/images/blog-cover-detail.jpg',
          author: {
            name: '技术专家',
            avatar: '/images/author-avatar.jpg',
            bio: '全栈开发工程师，专注于现代前端技术'
          },
          publishedAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-16T15:30:00Z',
          readTime: 12,
          tags: ['React', 'TypeScript', '前端开发', '最佳实践'],
          categories: ['前端开发'],
          status: 'published',
          featured: true,
          viewCount: 1250,
          likeCount: 89,
          commentCount: 23,
          seo: {
            metaTitle: '现代前端开发最佳实践 - 技术博客',
            metaDescription: '深入探讨现代前端开发的最佳实践，包括技术栈选择、性能优化、开发工具等',
            keywords: ['前端开发', 'React', 'TypeScript', '性能优化', '最佳实践']
          }
        };

        // 模拟相关文章
        const mockRelatedPosts: BlogPost[] = Array.from({ length: 3 }, (_, i) => ({
          id: `related-${i + 1}`,
          title: `相关文章 ${i + 1}`,
          excerpt: `这是相关文章 ${i + 1} 的摘要...`,
          content: '',
          author: mockPost.author,
          publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          readTime: Math.floor(Math.random() * 10) + 5,
          tags: mockPost.tags.slice(0, 2),
          categories: mockPost.categories,
          status: 'published',
          featured: false,
          viewCount: Math.floor(Math.random() * 500),
          likeCount: Math.floor(Math.random() * 50),
          commentCount: Math.floor(Math.random() * 10),
          seo: {}
        }));

        // 模拟评论数据
        const mockComments: Comment[] = [
          {
            id: '1',
            author: {
              name: '张三',
              avatar: '/images/user-1.jpg',
              email: 'zhangsan@example.com'
            },
            content: '非常好的文章！对我的项目很有帮助。',
            createdAt: '2024-01-16T09:00:00Z',
            likeCount: 5,
            isLiked: false,
            status: 'approved'
          },
          {
            id: '2',
            author: {
              name: '李四',
              avatar: '/images/user-2.jpg',
              email: 'lisi@example.com'
            },
            content: '关于 TypeScript 的部分写得特别详细，学到了很多。',
            createdAt: '2024-01-16T10:30:00Z',
            likeCount: 3,
            isLiked: true,
            status: 'approved',
            replies: [
              {
                id: '2-1',
                author: {
                  name: '技术专家',
                  avatar: '/images/author-avatar.jpg'
                },
                content: '谢谢你的反馈！TypeScript 确实是现代前端开发的重要工具。',
                createdAt: '2024-01-16T11:00:00Z',
                parentId: '2',
                likeCount: 2,
                isLiked: false,
                status: 'approved'
              }
            ]
          }
        ];

        setPost(mockPost);
        setRelatedPosts(mockRelatedPosts);
        setComments(mockComments);
        setLikeCount(mockPost.likeCount);
        
        // 更新页面标题
        document.title = mockPost.seo.metaTitle || mockPost.title;
        
      } catch (err) {
        setError('加载文章失败');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  // 生成目录
  useEffect(() => {
    if (!post || !contentRef.current) return;

    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc: TableOfContent[] = [];
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const title = heading.textContent || '';
      const anchor = `heading-${index}`;
      
      heading.id = anchor;
      
      toc.push({
        id: anchor,
        title,
        level,
        anchor
      });
    });
    
    setTableOfContents(toc);
  }, [post]);

  // 监听滚动，更新阅读进度和当前标题
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadProgress(Math.min(100, Math.max(0, progress)));

      // 找到当前可见的标题
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let currentHeading = '';
      
      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          currentHeading = heading.id;
        }
      });
      
      setActiveHeading(currentHeading);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 处理点赞
  const handleLike = useCallback(async () => {
    try {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      // 这里应该调用API
    } catch (err) {
      // 回滚状态
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    }
  }, [isLiked, likeCount]);

  // 处理收藏
  const handleBookmark = useCallback(async () => {
    try {
      setIsBookmarked(!isBookmarked);
      // 这里应该调用API
    } catch (err) {
      setIsBookmarked(isBookmarked);
    }
  }, [isBookmarked]);

  // 处理分享
  const handleShare = useCallback((platform: string) => {
    if (!post) return;
    
    const url = window.location.href;
    const title = post.title;
    const text = post.excerpt;
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'wechat':
        // 显示二维码
        break;
    }
    
    setShowShareMenu(false);
  }, [post]);

  // 处理评论提交
  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        author: {
          name: '当前用户',
          avatar: '/images/current-user.jpg'
        },
        content: newComment,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        isLiked: false,
        status: 'approved',
        ...(replyingTo && { parentId: replyingTo })
      };

      if (replyingTo) {
        // 添加回复
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo) {
            return {
              ...c,
              replies: [...(c.replies || []), comment]
            };
          }
          return c;
        }));
      } else {
        // 添加新评论
        setComments(prev => [comment, ...prev]);
      }

      setNewComment('');
      setReplyingTo(null);
      setShowCommentForm(false);
    } catch (err) {
      console.error('提交评论失败:', err);
    }
  }, [newComment, replyingTo]);

  // 跳转到标题
  const scrollToHeading = useCallback((anchor: string) => {
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (loading) {
    return (
      <div className="blog-detail-loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-detail-error">
        <div className="error-content">
          <h2>文章不存在</h2>
          <p>{error || '找不到指定的文章'}</p>
          <button onClick={() => navigate('/blog')}>返回博客首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`blog-detail ${className}`}>
      {/* 阅读进度条 */}
      <div className="read-progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* 文章头部 */}
      <header className="article-header">
        <div className="header-content">
          <nav className="breadcrumb">
            <Link to="/">首页</Link>
            <span>/</span>
            <Link to="/blog">博客</Link>
            <span>/</span>
            <span>{post.title}</span>
          </nav>
          
          <h1 className="article-title">{post.title}</h1>
          
          <div className="article-meta">
            <div className="author-info">
              {post.author.avatar && (
                <ResponsiveImage
                  src={post.author.avatar}
                  alt={post.author.name}
                  preset="avatar"
                  className="author-avatar"
                />
              )}
              <div className="author-details">
                <span className="author-name">{post.author.name}</span>
                {post.author.bio && (
                  <span className="author-bio">{post.author.bio}</span>
                )}
              </div>
            </div>
            
            <div className="article-stats">
              <span className="publish-date">{formatDate(post.publishedAt)}</span>
              <span className="read-time">{formatReadTime(post.readTime)}</span>
              <span className="view-count">{post.viewCount} 次阅读</span>
            </div>
          </div>
          
          <div className="article-tags">
            {post.tags.map(tag => (
              <Link key={tag} to={`/blog?tag=${tag}`} className="tag">
                {tag}
              </Link>
            ))}
          </div>
        </div>
        
        {post.coverImage && (
          <div className="cover-image">
            <ResponsiveImage
              src={post.coverImage}
              alt={post.title}
              preset="blogCover"
              className="cover-img"
            />
          </div>
        )}
      </header>

      <div className="article-layout">
        {/* 目录 */}
        {tableOfContents.length > 0 && (
          <aside className="table-of-contents">
            <h3>目录</h3>
            <nav className="toc-nav">
              {tableOfContents.map(item => (
                <button
                  key={item.id}
                  className={`toc-item level-${item.level} ${activeHeading === item.id ? 'active' : ''}`}
                  onClick={() => scrollToHeading(item.anchor)}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* 主内容 */}
        <main className="article-main">
          <article className="article-content" ref={contentRef}>
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
            />
          </article>
          
          {/* 文章底部操作 */}
          <div className="article-actions">
            <div className="action-buttons">
              <button 
                className={`action-btn like-btn ${isLiked ? 'active' : ''}`}
                onClick={handleLike}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{likeCount}</span>
              </button>
              
              <button 
                className={`action-btn bookmark-btn ${isBookmarked ? 'active' : ''}`}
                onClick={handleBookmark}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>收藏</span>
              </button>
              
              <div className="share-dropdown">
                <button 
                  className="action-btn share-btn"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>分享</span>
                </button>
                
                {showShareMenu && (
                  <div className="share-menu">
                    <button onClick={() => handleShare('copy')}>复制链接</button>
                    <button onClick={() => handleShare('twitter')}>Twitter</button>
                    <button onClick={() => handleShare('facebook')}>Facebook</button>
                    <button onClick={() => handleShare('linkedin')}>LinkedIn</button>
                    <button onClick={() => handleShare('wechat')}>微信</button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="article-info">
              <p>最后更新：{formatDate(post.updatedAt)}</p>
              <p>分类：{post.categories.join(', ')}</p>
            </div>
          </div>

          {/* 相关文章 */}
          {relatedPosts.length > 0 && (
            <section className="related-posts">
              <h3>相关文章</h3>
              <div className="related-grid">
                {relatedPosts.map(relatedPost => (
                  <article key={relatedPost.id} className="related-post">
                    <Link to={`/blog/${relatedPost.id}`}>
                      <h4>{relatedPost.title}</h4>
                      <p>{relatedPost.excerpt}</p>
                      <div className="related-meta">
                        <span>{formatDate(relatedPost.publishedAt)}</span>
                        <span>{formatReadTime(relatedPost.readTime)}</span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* 评论区 */}
          <section className="comments-section">
            <div className="comments-header">
              <h3>评论 ({comments.length})</h3>
              <div className="comments-controls">
                <select 
                  value={commentSortBy}
                  onChange={(e) => setCommentSortBy(e.target.value as typeof commentSortBy)}
                >
                  <option value="latest">最新</option>
                  <option value="oldest">最早</option>
                  <option value="popular">最热</option>
                </select>
                <button 
                  className="add-comment-btn"
                  onClick={() => setShowCommentForm(!showCommentForm)}
                >
                  写评论
                </button>
              </div>
            </div>
            
            {/* 评论表单 */}
            {showCommentForm && (
              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? '写下你的回复...' : '写下你的评论...'}
                  rows={4}
                  required
                />
                <div className="form-actions">
                  <button type="button" onClick={() => {
                    setShowCommentForm(false);
                    setReplyingTo(null);
                    setNewComment('');
                  }}>
                    取消
                  </button>
                  <button type="submit">发布</button>
                </div>
              </form>
            )}
            
            {/* 评论列表 */}
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    {comment.author.avatar && (
                      <ResponsiveImage
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        preset="avatar"
                        className="comment-avatar"
                      />
                    )}
                    <div className="comment-info">
                      <span className="comment-author">{comment.author.name}</span>
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                  
                  <div className="comment-actions">
                    <button className={`comment-like ${comment.isLiked ? 'active' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={comment.isLiked ? 'currentColor' : 'none'} stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {comment.likeCount}
                    </button>
                    <button 
                      className="comment-reply"
                      onClick={() => {
                        setReplyingTo(comment.id);
                        setShowCommentForm(true);
                      }}
                    >
                      回复
                    </button>
                  </div>
                  
                  {/* 回复列表 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="reply">
                          <div className="comment-header">
                            {reply.author.avatar && (
                              <ResponsiveImage
                                src={reply.author.avatar}
                                alt={reply.author.name}
                                preset="avatar"
                                className="comment-avatar"
                              />
                            )}
                            <div className="comment-info">
                              <span className="comment-author">{reply.author.name}</span>
                              <span className="comment-date">{formatDate(reply.createdAt)}</span>
                            </div>
                          </div>
                          <div className="comment-content">
                            <p>{reply.content}</p>
                          </div>
                          <div className="comment-actions">
                            <button className={`comment-like ${reply.isLiked ? 'active' : ''}`}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={reply.isLiked ? 'currentColor' : 'none'} stroke="currentColor">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                              {reply.likeCount}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default BlogDetail;
export type { Comment, TableOfContent, BlogDetailProps };