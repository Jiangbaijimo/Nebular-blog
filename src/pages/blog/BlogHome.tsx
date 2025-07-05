/**
 * 博客首页组件
 * 展示博客文章列表、分类、标签等
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ResponsiveImage from '../../components/common/ResponsiveImage';
import { formatDate, formatReadTime } from '../../utils/dateUtils';
import { truncateText } from '../../utils/textUtils';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
  updatedAt: string;
  readTime: number;
  tags: string[];
  categories: string[];
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  color?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  color?: string;
}

interface BlogHomeProps {
  className?: string;
}

const BlogHome: React.FC<BlogHomeProps> = ({ className = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选和排序状态
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 从URL参数初始化状态
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const sort = (searchParams.get('sort') as typeof sortBy) || 'latest';
    const view = (searchParams.get('view') as typeof viewMode) || 'grid';

    setSelectedCategory(category);
    setSelectedTag(tag);
    setSearchQuery(search);
    setCurrentPage(page);
    setSortBy(sort);
    setViewMode(view);
  }, [searchParams]);

  // 更新URL参数
  const updateSearchParams = useCallback((updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // 模拟数据加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟博客文章数据
        const mockPosts: BlogPost[] = Array.from({ length: 50 }, (_, i) => ({
          id: `post-${i + 1}`,
          title: `博客文章标题 ${i + 1}`,
          excerpt: `这是第 ${i + 1} 篇博客文章的摘要，介绍了一些有趣的技术内容和实践经验...`,
          content: `完整的博客文章内容 ${i + 1}`,
          coverImage: i % 3 === 0 ? `/images/blog-cover-${(i % 5) + 1}.jpg` : undefined,
          author: {
            name: '作者名称',
            avatar: '/images/avatar.jpg',
            bio: '全栈开发工程师'
          },
          publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          readTime: Math.floor(Math.random() * 15) + 3,
          tags: [`标签${(i % 5) + 1}`, `标签${(i % 3) + 1}`],
          categories: [`分类${(i % 4) + 1}`],
          status: 'published',
          featured: i < 3,
          viewCount: Math.floor(Math.random() * 1000),
          likeCount: Math.floor(Math.random() * 100),
          commentCount: Math.floor(Math.random() * 20),
          seo: {
            metaTitle: `博客文章标题 ${i + 1}`,
            metaDescription: `这是第 ${i + 1} 篇博客文章的描述`,
            keywords: [`关键词${i + 1}`, '技术', '博客']
          }
        }));

        // 模拟分类数据
        const mockCategories: Category[] = [
          { id: '1', name: '前端开发', slug: 'frontend', postCount: 15, color: '#3b82f6' },
          { id: '2', name: '后端开发', slug: 'backend', postCount: 12, color: '#10b981' },
          { id: '3', name: '移动开发', slug: 'mobile', postCount: 8, color: '#f59e0b' },
          { id: '4', name: '人工智能', slug: 'ai', postCount: 10, color: '#8b5cf6' }
        ];

        // 模拟标签数据
        const mockTags: Tag[] = [
          { id: '1', name: 'React', slug: 'react', postCount: 20, color: '#61dafb' },
          { id: '2', name: 'TypeScript', slug: 'typescript', postCount: 18, color: '#3178c6' },
          { id: '3', name: 'Node.js', slug: 'nodejs', postCount: 15, color: '#339933' },
          { id: '4', name: 'Python', slug: 'python', postCount: 12, color: '#3776ab' },
          { id: '5', name: 'Vue.js', slug: 'vuejs', postCount: 10, color: '#4fc08d' }
        ];

        setPosts(mockPosts);
        setCategories(mockCategories);
        setTags(mockTags);
      } catch (err) {
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 筛选和排序文章
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(post => {
      // 分类筛选
      if (selectedCategory && !post.categories.includes(selectedCategory)) {
        return false;
      }
      
      // 标签筛选
      if (selectedTag && !post.tags.includes(selectedTag)) {
        return false;
      }
      
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });

    // 排序
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'trending':
        filtered.sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount));
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
    }

    return filtered;
  }, [posts, selectedCategory, selectedTag, searchQuery, sortBy]);

  // 分页
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);
  const paginatedPosts = filteredAndSortedPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // 精选文章
  const featuredPosts = posts.filter(post => post.featured).slice(0, 3);

  // 处理筛选变化
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    updateSearchParams({ category, page: 1 });
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setCurrentPage(1);
    updateSearchParams({ tag, page: 1 });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateSearchParams({ search: query, page: 1 });
  };

  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
    updateSearchParams({ sort });
  };

  const handleViewModeChange = (mode: typeof viewMode) => {
    setViewMode(mode);
    updateSearchParams({ view: mode });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateSearchParams({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="blog-home-loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-home-error">
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div className={`blog-home ${className}`}>
      {/* 头部横幅 */}
      <section className="blog-hero">
        <div className="hero-content">
          <h1>技术博客</h1>
          <p>分享技术见解，记录成长历程</p>
          
          {/* 搜索框 */}
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* 精选文章 */}
      {featuredPosts.length > 0 && (
        <section className="featured-posts">
          <h2>精选文章</h2>
          <div className="featured-grid">
            {featuredPosts.map(post => (
              <article key={post.id} className="featured-post">
                <Link to={`/blog/${post.id}`} className="featured-link">
                  {post.coverImage && (
                    <div className="featured-image">
                      <ResponsiveImage
                        src={post.coverImage}
                        alt={post.title}
                        preset="blogCover"
                        className="cover-img"
                      />
                    </div>
                  )}
                  <div className="featured-content">
                    <h3>{post.title}</h3>
                    <p>{truncateText(post.excerpt, 120)}</p>
                    <div className="featured-meta">
                      <span className="date">{formatDate(post.publishedAt)}</span>
                      <span className="read-time">{formatReadTime(post.readTime)}</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="blog-main">
        {/* 侧边栏 */}
        <aside className="blog-sidebar">
          {/* 分类 */}
          <div className="sidebar-section">
            <h3>分类</h3>
            <div className="category-list">
              <button
                className={`category-item ${!selectedCategory ? 'active' : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                全部 ({posts.length})
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category.name)}
                  style={{ '--category-color': category.color } as React.CSSProperties}
                >
                  {category.name} ({category.postCount})
                </button>
              ))}
            </div>
          </div>

          {/* 标签云 */}
          <div className="sidebar-section">
            <h3>标签</h3>
            <div className="tag-cloud">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  className={`tag-item ${selectedTag === tag.name ? 'active' : ''}`}
                  onClick={() => handleTagChange(tag.name)}
                  style={{ '--tag-color': tag.color } as React.CSSProperties}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="blog-content">
          {/* 工具栏 */}
          <div className="content-toolbar">
            <div className="toolbar-left">
              <span className="result-count">
                共 {filteredAndSortedPosts.length} 篇文章
              </span>
              {(selectedCategory || selectedTag || searchQuery) && (
                <div className="active-filters">
                  {selectedCategory && (
                    <span className="filter-tag">
                      分类: {selectedCategory}
                      <button onClick={() => handleCategoryChange('')}>×</button>
                    </span>
                  )}
                  {selectedTag && (
                    <span className="filter-tag">
                      标签: {selectedTag}
                      <button onClick={() => handleTagChange('')}>×</button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="filter-tag">
                      搜索: {searchQuery}
                      <button onClick={() => handleSearchChange('')}>×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="toolbar-right">
              {/* 排序 */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                className="sort-select"
              >
                <option value="latest">最新发布</option>
                <option value="popular">最多浏览</option>
                <option value="trending">最受欢迎</option>
              </select>
              
              {/* 视图模式 */}
              <div className="view-mode-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('grid')}
                  title="网格视图"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('list')}
                  title="列表视图"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 文章列表 */}
          {paginatedPosts.length > 0 ? (
            <div className={`posts-container ${viewMode}`}>
              {paginatedPosts.map(post => (
                <article key={post.id} className="post-card">
                  <Link to={`/blog/${post.id}`} className="post-link">
                    {post.coverImage && (
                      <div className="post-image">
                        <ResponsiveImage
                          src={post.coverImage}
                          alt={post.title}
                          preset="articleImage"
                          className="cover-img"
                        />
                      </div>
                    )}
                    
                    <div className="post-content">
                      <div className="post-header">
                        <h3 className="post-title">{post.title}</h3>
                        <div className="post-meta">
                          <span className="author">{post.author.name}</span>
                          <span className="date">{formatDate(post.publishedAt)}</span>
                          <span className="read-time">{formatReadTime(post.readTime)}</span>
                        </div>
                      </div>
                      
                      <p className="post-excerpt">
                        {truncateText(post.excerpt, viewMode === 'grid' ? 120 : 200)}
                      </p>
                      
                      <div className="post-footer">
                        <div className="post-tags">
                          {post.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                        
                        <div className="post-stats">
                          <span className="stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            {post.viewCount}
                          </span>
                          <span className="stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {post.likeCount}
                          </span>
                          <span className="stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {post.commentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-posts">
              <div className="no-posts-content">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h3>没有找到相关文章</h3>
                <p>尝试调整筛选条件或搜索关键词</p>
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedTag('');
                    setSearchQuery('');
                    updateSearchParams({ category: '', tag: '', search: '' });
                  }}
                  className="reset-filters-btn"
                >
                  清除所有筛选
                </button>
              </div>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                上一页
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogHome;
export type { BlogPost, Category, Tag, BlogHomeProps };