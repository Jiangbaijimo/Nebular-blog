/**
 * 博客归档页面组件
 * 按时间、分类、标签等维度展示博客文章归档
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDate, formatReadTime } from '../../utils/date';
import { SimpleBlogPost as BlogPost, SimpleCategory as Category, SimpleTag as Tag } from '../../types/blog';

interface ArchiveGroup {
  key: string;
  label: string;
  posts: BlogPost[];
  count: number;
}

interface YearMonth {
  year: number;
  month: number;
  label: string;
  posts: BlogPost[];
  count: number;
}

interface BlogArchiveProps {
  className?: string;
}

type ArchiveMode = 'timeline' | 'category' | 'tag' | 'year';
type ViewMode = 'list' | 'grid' | 'compact';

const BlogArchive: React.FC<BlogArchiveProps> = ({ className = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 归档模式和视图状态
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>('timeline');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 从URL参数初始化状态
  useEffect(() => {
    const mode = (searchParams.get('mode') as ArchiveMode) || 'timeline';
    const view = (searchParams.get('view') as ViewMode) || 'list';
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const search = searchParams.get('search') || '';

    setArchiveMode(mode);
    setViewMode(view);
    setSelectedYear(year);
    setSelectedCategory(category);
    setSelectedTag(tag);
    setSearchQuery(search);
  }, [searchParams]);

  // 更新URL参数
  const updateSearchParams = useCallback((updates: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 生成模拟数据（更多文章用于归档展示）
        const mockPosts: BlogPost[] = Array.from({ length: 120 }, (_, i) => {
          const publishDate = new Date();
          publishDate.setDate(publishDate.getDate() - Math.floor(Math.random() * 1095)); // 过去3年内
          
          return {
            id: `post-${i + 1}`,
            title: `博客文章标题 ${i + 1}`,
            excerpt: `这是第 ${i + 1} 篇博客文章的摘要，介绍了一些有趣的技术内容...`,
            content: `完整的博客文章内容 ${i + 1}`,
            coverImage: i % 4 === 0 ? `/images/blog-cover-${(i % 5) + 1}.jpg` : undefined,
            author: {
              name: '作者名称',
              avatar: '/images/avatar.jpg',
              bio: '全栈开发工程师'
            },
            publishedAt: publishDate.toISOString(),
            updatedAt: new Date().toISOString(),
            readTime: Math.floor(Math.random() * 15) + 3,
            tags: [`标签${(i % 8) + 1}`, `标签${(i % 5) + 1}`],
            categories: [`分类${(i % 6) + 1}`],
            status: 'published',
            featured: i < 5,
            viewCount: Math.floor(Math.random() * 2000),
            likeCount: Math.floor(Math.random() * 150),
            commentCount: Math.floor(Math.random() * 30),
            seo: {
              metaTitle: `博客文章标题 ${i + 1}`,
              metaDescription: `这是第 ${i + 1} 篇博客文章的描述`,
              keywords: [`关键词${i + 1}`, '技术', '博客']
            }
          };
        });

        // 按发布时间排序
        mockPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        // 生成分类和标签统计
        const categoryMap = new Map<string, number>();
        const tagMap = new Map<string, number>();
        
        mockPosts.forEach(post => {
          post.categories.forEach(cat => {
            categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
          });
          post.tags.forEach(tag => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
          });
        });

        const mockCategories: Category[] = Array.from(categoryMap.entries()).map(([name, count], i) => ({
          id: `cat-${i + 1}`,
          name,
          slug: name.toLowerCase(),
          postCount: count,
          color: `hsl(${(i * 60) % 360}, 60%, 50%)`
        }));

        const mockTags: Tag[] = Array.from(tagMap.entries()).map(([name, count], i) => ({
          id: `tag-${i + 1}`,
          name,
          slug: name.toLowerCase(),
          postCount: count,
          color: `hsl(${(i * 45) % 360}, 50%, 60%)`
        }));

        setPosts(mockPosts);
        setCategories(mockCategories.sort((a, b) => b.postCount - a.postCount));
        setTags(mockTags.sort((a, b) => b.postCount - a.postCount));
      } catch (err) {
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 筛选文章
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 年份筛选
      if (selectedYear) {
        const postYear = new Date(post.publishedAt).getFullYear();
        if (postYear !== selectedYear) return false;
      }
      
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
  }, [posts, selectedYear, selectedCategory, selectedTag, searchQuery]);

  // 按时间线分组
  const timelineGroups = useMemo((): YearMonth[] => {
    const groups = new Map<string, YearMonth>();
    
    filteredPosts.forEach(post => {
      const date = new Date(post.publishedAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${year}年${month + 1}月`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          year,
          month,
          label,
          posts: [],
          count: 0
        });
      }
      
      const group = groups.get(key)!;
      group.posts.push(post);
      group.count++;
    });
    
    return Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [filteredPosts]);

  // 按分类分组
  const categoryGroups = useMemo((): ArchiveGroup[] => {
    const groups = new Map<string, ArchiveGroup>();
    
    filteredPosts.forEach(post => {
      post.categories.forEach(category => {
        if (!groups.has(category)) {
          groups.set(category, {
            key: category,
            label: category,
            posts: [],
            count: 0
          });
        }
        
        const group = groups.get(category)!;
        if (!group.posts.find(p => p.id === post.id)) {
          group.posts.push(post);
          group.count++;
        }
      });
    });
    
    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }, [filteredPosts]);

  // 按标签分组
  const tagGroups = useMemo((): ArchiveGroup[] => {
    const groups = new Map<string, ArchiveGroup>();
    
    filteredPosts.forEach(post => {
      post.tags.forEach(tag => {
        if (!groups.has(tag)) {
          groups.set(tag, {
            key: tag,
            label: tag,
            posts: [],
            count: 0
          });
        }
        
        const group = groups.get(tag)!;
        if (!group.posts.find(p => p.id === post.id)) {
          group.posts.push(post);
          group.count++;
        }
      });
    });
    
    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }, [filteredPosts]);

  // 按年份分组
  const yearGroups = useMemo((): ArchiveGroup[] => {
    const groups = new Map<number, ArchiveGroup>();
    
    filteredPosts.forEach(post => {
      const year = new Date(post.publishedAt).getFullYear();
      
      if (!groups.has(year)) {
        groups.set(year, {
          key: year.toString(),
          label: `${year}年`,
          posts: [],
          count: 0
        });
      }
      
      const group = groups.get(year)!;
      group.posts.push(post);
      group.count++;
    });
    
    return Array.from(groups.values()).sort((a, b) => parseInt(b.key) - parseInt(a.key));
  }, [filteredPosts]);

  // 获取年份列表
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    posts.forEach(post => {
      years.add(new Date(post.publishedAt).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [posts]);

  // 切换分组展开状态
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // 处理模式切换
  const handleModeChange = (mode: ArchiveMode) => {
    setArchiveMode(mode);
    updateSearchParams({ mode });
  };

  // 处理视图切换
  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
    updateSearchParams({ view });
  };

  // 渲染文章项
  const renderPostItem = (post: BlogPost, compact = false) => (
    <article key={post.id} className={`archive-post ${compact ? 'compact' : ''}`}>
      <Link to={`/blog/${post.id}`} className="post-link">
        <div className="post-content">
          <h3 className="post-title">{post.title}</h3>
          {!compact && (
            <p className="post-excerpt">{post.excerpt}</p>
          )}
          <div className="post-meta">
            <span className="date">{formatDate(post.publishedAt)}</span>
            <span className="read-time">{formatReadTime(post.readTime)}</span>
            <span className="stats">
              {post.viewCount} 阅读 · {post.likeCount} 点赞
            </span>
          </div>
          {!compact && (
            <div className="post-tags">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );

  if (loading) {
    return (
      <div className="blog-archive-loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-archive-error">
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div className={`blog-archive ${className}`}>
      {/* 页面头部 */}
      <header className="archive-header">
        <div className="header-content">
          <h1>博客归档</h1>
          <p>共 {posts.length} 篇文章</p>
          
          {/* 搜索框 */}
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateSearchParams({ search: e.target.value });
              }}
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
      </header>

      <div className="archive-layout">
        {/* 侧边栏 */}
        <aside className="archive-sidebar">
          {/* 归档模式切换 */}
          <div className="sidebar-section">
            <h3>归档方式</h3>
            <div className="mode-tabs">
              <button
                className={`mode-tab ${archiveMode === 'timeline' ? 'active' : ''}`}
                onClick={() => handleModeChange('timeline')}
              >
                时间线
              </button>
              <button
                className={`mode-tab ${archiveMode === 'category' ? 'active' : ''}`}
                onClick={() => handleModeChange('category')}
              >
                分类
              </button>
              <button
                className={`mode-tab ${archiveMode === 'tag' ? 'active' : ''}`}
                onClick={() => handleModeChange('tag')}
              >
                标签
              </button>
              <button
                className={`mode-tab ${archiveMode === 'year' ? 'active' : ''}`}
                onClick={() => handleModeChange('year')}
              >
                年份
              </button>
            </div>
          </div>

          {/* 年份筛选 */}
          <div className="sidebar-section">
            <h3>年份</h3>
            <div className="year-list">
              <button
                className={`year-item ${!selectedYear ? 'active' : ''}`}
                onClick={() => {
                  setSelectedYear(null);
                  updateSearchParams({ year: null });
                }}
              >
                全部年份
              </button>
              {availableYears.map(year => {
                const yearPostCount = posts.filter(p => 
                  new Date(p.publishedAt).getFullYear() === year
                ).length;
                
                return (
                  <button
                    key={year}
                    className={`year-item ${selectedYear === year ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedYear(year);
                      updateSearchParams({ year });
                    }}
                  >
                    {year}年 ({yearPostCount})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 分类筛选 */}
          <div className="sidebar-section">
            <h3>分类</h3>
            <div className="category-list">
              <button
                className={`category-item ${!selectedCategory ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory('');
                  updateSearchParams({ category: '' });
                }}
              >
                全部分类
              </button>
              {categories.slice(0, 10).map(category => (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    updateSearchParams({ category: category.name });
                  }}
                  style={{ '--category-color': category.color } as React.CSSProperties}
                >
                  {category.name} ({category.postCount})
                </button>
              ))}
            </div>
          </div>

          {/* 热门标签 */}
          <div className="sidebar-section">
            <h3>热门标签</h3>
            <div className="tag-cloud">
              {tags.slice(0, 20).map(tag => (
                <button
                  key={tag.id}
                  className={`tag-item ${selectedTag === tag.name ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTag(tag.name);
                    updateSearchParams({ tag: tag.name });
                  }}
                  style={{ 
                    '--tag-color': tag.color,
                    fontSize: `${Math.min(16, 12 + tag.postCount / 5)}px`
                  } as React.CSSProperties}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="archive-content">
          {/* 工具栏 */}
          <div className="content-toolbar">
            <div className="toolbar-left">
              <span className="result-count">
                {archiveMode === 'timeline' && `共 ${timelineGroups.length} 个月份`}
                {archiveMode === 'category' && `共 ${categoryGroups.length} 个分类`}
                {archiveMode === 'tag' && `共 ${tagGroups.length} 个标签`}
                {archiveMode === 'year' && `共 ${yearGroups.length} 个年份`}
                ，{filteredPosts.length} 篇文章
              </span>
              
              {/* 活动筛选器 */}
              {(selectedYear || selectedCategory || selectedTag || searchQuery) && (
                <div className="active-filters">
                  {selectedYear && (
                    <span className="filter-tag">
                      {selectedYear}年
                      <button onClick={() => {
                        setSelectedYear(null);
                        updateSearchParams({ year: null });
                      }}>×</button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="filter-tag">
                      分类: {selectedCategory}
                      <button onClick={() => {
                        setSelectedCategory('');
                        updateSearchParams({ category: '' });
                      }}>×</button>
                    </span>
                  )}
                  {selectedTag && (
                    <span className="filter-tag">
                      标签: {selectedTag}
                      <button onClick={() => {
                        setSelectedTag('');
                        updateSearchParams({ tag: '' });
                      }}>×</button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="filter-tag">
                      搜索: {searchQuery}
                      <button onClick={() => {
                        setSearchQuery('');
                        updateSearchParams({ search: '' });
                      }}>×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="toolbar-right">
              {/* 视图模式 */}
              <div className="view-mode-toggle">
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleViewChange('list')}
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
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleViewChange('grid')}
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
                  className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                  onClick={() => handleViewChange('compact')}
                  title="紧凑视图"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 归档内容 */}
          <div className={`archive-groups ${viewMode}`}>
            {/* 时间线模式 */}
            {archiveMode === 'timeline' && timelineGroups.map(group => (
              <div key={group.label} className="archive-group">
                <div 
                  className="group-header"
                  onClick={() => toggleGroup(group.label)}
                >
                  <h3 className="group-title">{group.label}</h3>
                  <span className="group-count">{group.count} 篇</span>
                  <button className="group-toggle">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      className={expandedGroups.has(group.label) ? 'expanded' : ''}
                    >
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </button>
                </div>
                
                {expandedGroups.has(group.label) && (
                  <div className="group-content">
                    {group.posts.map(post => renderPostItem(post, viewMode === 'compact'))}
                  </div>
                )}
              </div>
            ))}

            {/* 分类模式 */}
            {archiveMode === 'category' && categoryGroups.map(group => (
              <div key={group.key} className="archive-group">
                <div 
                  className="group-header"
                  onClick={() => toggleGroup(group.key)}
                >
                  <h3 className="group-title">{group.label}</h3>
                  <span className="group-count">{group.count} 篇</span>
                  <button className="group-toggle">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      className={expandedGroups.has(group.key) ? 'expanded' : ''}
                    >
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </button>
                </div>
                
                {expandedGroups.has(group.key) && (
                  <div className="group-content">
                    {group.posts.map(post => renderPostItem(post, viewMode === 'compact'))}
                  </div>
                )}
              </div>
            ))}

            {/* 标签模式 */}
            {archiveMode === 'tag' && tagGroups.map(group => (
              <div key={group.key} className="archive-group">
                <div 
                  className="group-header"
                  onClick={() => toggleGroup(group.key)}
                >
                  <h3 className="group-title">{group.label}</h3>
                  <span className="group-count">{group.count} 篇</span>
                  <button className="group-toggle">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      className={expandedGroups.has(group.key) ? 'expanded' : ''}
                    >
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </button>
                </div>
                
                {expandedGroups.has(group.key) && (
                  <div className="group-content">
                    {group.posts.map(post => renderPostItem(post, viewMode === 'compact'))}
                  </div>
                )}
              </div>
            ))}

            {/* 年份模式 */}
            {archiveMode === 'year' && yearGroups.map(group => (
              <div key={group.key} className="archive-group">
                <div 
                  className="group-header"
                  onClick={() => toggleGroup(group.key)}
                >
                  <h3 className="group-title">{group.label}</h3>
                  <span className="group-count">{group.count} 篇</span>
                  <button className="group-toggle">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      className={expandedGroups.has(group.key) ? 'expanded' : ''}
                    >
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </button>
                </div>
                
                {expandedGroups.has(group.key) && (
                  <div className="group-content">
                    {group.posts.map(post => renderPostItem(post, viewMode === 'compact'))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 无结果 */}
          {filteredPosts.length === 0 && (
            <div className="no-results">
              <div className="no-results-content">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h3>没有找到相关文章</h3>
                <p>尝试调整筛选条件或搜索关键词</p>
                <button
                  onClick={() => {
                    setSelectedYear(null);
                    setSelectedCategory('');
                    setSelectedTag('');
                    setSearchQuery('');
                    updateSearchParams({ year: null, category: '', tag: '', search: '' });
                  }}
                  className="reset-filters-btn"
                >
                  清除所有筛选
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogArchive;
export type { ArchiveGroup, YearMonth, ArchiveMode, ViewMode, BlogArchiveProps };