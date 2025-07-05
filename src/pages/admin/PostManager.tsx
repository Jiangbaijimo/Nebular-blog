/**
 * 文章管理组件
 * 提供文章的增删改查、批量操作、状态管理等功能
 */

import React, { useState, useEffect, useRef } from 'react';
import ResponsiveImage from '../../components/common/ResponsiveImage';
import { formatDate, formatRelativeTime } from '../../utils/dateUtils';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  visibility: 'public' | 'private' | 'password';
  password?: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  comments: number;
  likes: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  featured: boolean;
  allowComments: boolean;
}

interface PostFilter {
  status?: Post['status'];
  category?: string;
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  featured?: boolean;
}

interface PostSort {
  field: 'title' | 'publishedAt' | 'createdAt' | 'updatedAt' | 'views' | 'comments';
  direction: 'asc' | 'desc';
}

interface PostManagerProps {
  className?: string;
}

const PostManager: React.FC<PostManagerProps> = ({ className = '' }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<PostFilter>({});
  const [sort, setSort] = useState<PostSort>({ field: 'updatedAt', direction: 'desc' });
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'table'>('table');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 模拟数据
  const mockPosts: Post[] = [
    {
      id: '1',
      title: 'React最佳实践指南',
      slug: 'react-best-practices-guide',
      content: '这是一篇关于React最佳实践的详细指南...',
      excerpt: '学习React开发中的最佳实践，提高代码质量和开发效率。',
      status: 'published',
      visibility: 'public',
      featuredImage: '/images/react-guide.jpg',
      category: '前端开发',
      tags: ['React', 'JavaScript', '最佳实践'],
      author: {
        id: 'author1',
        name: '张三',
        avatar: '/images/author-1.jpg'
      },
      publishedAt: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-14T15:30:00Z',
      updatedAt: '2024-01-15T09:45:00Z',
      views: 1234,
      comments: 45,
      likes: 89,
      seo: {
        title: 'React最佳实践指南 - 提高开发效率',
        description: '学习React开发中的最佳实践，包括组件设计、状态管理、性能优化等。',
        keywords: ['React', '最佳实践', '前端开发', 'JavaScript']
      },
      featured: true,
      allowComments: true
    },
    {
      id: '2',
      title: 'TypeScript进阶技巧',
      slug: 'typescript-advanced-tips',
      content: '深入探讨TypeScript的高级特性...',
      excerpt: 'TypeScript高级特性详解，包括泛型、装饰器、模块系统等。',
      status: 'published',
      visibility: 'public',
      featuredImage: '/images/typescript-tips.jpg',
      category: '编程语言',
      tags: ['TypeScript', '进阶', '类型系统'],
      author: {
        id: 'author1',
        name: '张三',
        avatar: '/images/author-1.jpg'
      },
      publishedAt: '2024-01-12T14:30:00Z',
      createdAt: '2024-01-11T09:15:00Z',
      updatedAt: '2024-01-12T14:25:00Z',
      views: 987,
      comments: 32,
      likes: 67,
      seo: {
        title: 'TypeScript进阶技巧 - 掌握高级特性',
        description: '深入学习TypeScript的高级特性，提升类型安全和开发体验。'
      },
      featured: false,
      allowComments: true
    },
    {
      id: '3',
      title: 'Vue3组合式API详解',
      slug: 'vue3-composition-api-guide',
      content: 'Vue3组合式API的完整使用指南...',
      excerpt: '全面了解Vue3组合式API的使用方法和最佳实践。',
      status: 'draft',
      visibility: 'public',
      category: '前端框架',
      tags: ['Vue3', 'Composition API', '前端'],
      author: {
        id: 'author1',
        name: '张三',
        avatar: '/images/author-1.jpg'
      },
      createdAt: '2024-01-10T16:20:00Z',
      updatedAt: '2024-01-11T10:30:00Z',
      views: 0,
      comments: 0,
      likes: 0,
      seo: {},
      featured: false,
      allowComments: true
    },
    {
      id: '4',
      title: 'Node.js性能优化实战',
      slug: 'nodejs-performance-optimization',
      content: 'Node.js应用性能优化的实用技巧...',
      excerpt: '学习Node.js性能优化的各种技巧和工具。',
      status: 'scheduled',
      visibility: 'public',
      featuredImage: '/images/nodejs-performance.jpg',
      category: '后端开发',
      tags: ['Node.js', '性能优化', '后端'],
      author: {
        id: 'author1',
        name: '张三',
        avatar: '/images/author-1.jpg'
      },
      scheduledAt: '2024-01-20T10:00:00Z',
      createdAt: '2024-01-08T11:45:00Z',
      updatedAt: '2024-01-09T14:20:00Z',
      views: 0,
      comments: 0,
      likes: 0,
      seo: {
        title: 'Node.js性能优化实战指南',
        description: '掌握Node.js性能优化的核心技巧，提升应用性能。'
      },
      featured: false,
      allowComments: true
    },
    {
      id: '5',
      title: 'CSS Grid布局完全指南',
      slug: 'css-grid-complete-guide',
      content: 'CSS Grid布局的完整学习指南...',
      excerpt: '从基础到高级，全面掌握CSS Grid布局技术。',
      status: 'archived',
      visibility: 'public',
      featuredImage: '/images/css-grid.jpg',
      category: 'CSS',
      tags: ['CSS', 'Grid', '布局'],
      author: {
        id: 'author1',
        name: '张三',
        avatar: '/images/author-1.jpg'
      },
      publishedAt: '2024-01-05T11:20:00Z',
      createdAt: '2024-01-04T09:30:00Z',
      updatedAt: '2024-01-05T11:15:00Z',
      views: 692,
      comments: 15,
      likes: 38,
      seo: {
        title: 'CSS Grid布局完全指南 - 现代布局技术',
        description: '学习CSS Grid布局的所有特性，创建复杂的网页布局。'
      },
      featured: false,
      allowComments: true
    }
  ];

  // 分类和标签选项
  const categories = ['前端开发', '后端开发', '编程语言', '前端框架', 'CSS', '数据库', '工具'];
  const allTags = ['React', 'Vue', 'TypeScript', 'JavaScript', 'Node.js', 'CSS', 'HTML', 'Python'];

  // 加载文章数据
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 应用筛选和排序
      let filteredPosts = [...mockPosts];
      
      // 应用筛选
      if (filter.status) {
        filteredPosts = filteredPosts.filter(post => post.status === filter.status);
      }
      if (filter.category) {
        filteredPosts = filteredPosts.filter(post => post.category === filter.category);
      }
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
          post.title.toLowerCase().includes(searchTerm) ||
          post.excerpt.toLowerCase().includes(searchTerm) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      if (filter.featured !== undefined) {
        filteredPosts = filteredPosts.filter(post => post.featured === filter.featured);
      }
      
      // 应用排序
      filteredPosts.sort((a, b) => {
        let aValue: any = a[sort.field];
        let bValue: any = b[sort.field];
        
        if (sort.field === 'publishedAt' || sort.field === 'createdAt' || sort.field === 'updatedAt') {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }
        
        if (sort.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      setTotalCount(filteredPosts.length);
      
      // 应用分页
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedPosts = filteredPosts.slice(startIndex, startIndex + pageSize);
      
      setPosts(paginatedPosts);
      setLoading(false);
    };
    
    loadPosts();
  }, [filter, sort, currentPage, pageSize]);

  // 处理搜索
  const handleSearch = (searchTerm: string) => {
    setFilter(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  // 处理筛选
  const handleFilter = (newFilter: Partial<PostFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    setCurrentPage(1);
  };

  // 处理排序
  const handleSort = (field: PostSort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // 选择文章
  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map(post => post.id)));
    }
  };

  // 批量操作
  const handleBulkAction = async (action: string) => {
    if (selectedPosts.size === 0) return;
    
    console.log(`执行批量操作: ${action}，选中文章:`, Array.from(selectedPosts));
    
    // 这里应该调用API执行批量操作
    switch (action) {
      case 'publish':
        // 批量发布
        break;
      case 'draft':
        // 批量转为草稿
        break;
      case 'delete':
        // 批量删除
        if (confirm(`确定要删除选中的 ${selectedPosts.size} 篇文章吗？`)) {
          // 执行删除操作
        }
        break;
      case 'feature':
        // 批量设为精选
        break;
    }
    
    setSelectedPosts(new Set());
    setShowBulkActions(false);
  };

  // 获取状态颜色
  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'published': return '#10b981';
      case 'draft': return '#6b7280';
      case 'scheduled': return '#f59e0b';
      case 'archived': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // 获取状态文本
  const getStatusText = (status: Post['status']) => {
    switch (status) {
      case 'published': return '已发布';
      case 'draft': return '草稿';
      case 'scheduled': return '定时发布';
      case 'archived': return '已归档';
      default: return '未知';
    }
  };

  return (
    <div className={`post-manager ${className}`}>
      {/* 页面头部 */}
      <div className="manager-header">
        <div className="header-content">
          <h1 className="page-title">文章管理</h1>
          <p className="page-subtitle">管理您的所有文章内容</p>
        </div>
        
        <div className="header-actions">
          <button className="btn-primary">
            <span className="btn-icon">✏️</span>
            写新文章
          </button>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="manager-filters">
        <div className="filters-row">
          {/* 搜索 */}
          <div className="search-box">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索文章标题、内容或标签..."
              className="search-input"
              onChange={(e) => handleSearch(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          {/* 状态筛选 */}
          <select 
            className="filter-select"
            value={filter.status || ''}
            onChange={(e) => handleFilter({ status: e.target.value as Post['status'] || undefined })}
          >
            <option value="">所有状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="scheduled">定时发布</option>
            <option value="archived">已归档</option>
          </select>
          
          {/* 分类筛选 */}
          <select 
            className="filter-select"
            value={filter.category || ''}
            onChange={(e) => handleFilter({ category: e.target.value || undefined })}
          >
            <option value="">所有分类</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          {/* 精选筛选 */}
          <select 
            className="filter-select"
            value={filter.featured === undefined ? '' : filter.featured.toString()}
            onChange={(e) => {
              const value = e.target.value;
              handleFilter({ 
                featured: value === '' ? undefined : value === 'true' 
              });
            }}
          >
            <option value="">所有文章</option>
            <option value="true">精选文章</option>
            <option value="false">普通文章</option>
          </select>
        </div>
        
        <div className="filters-row">
          {/* 视图模式 */}
          <div className="view-modes">
            {[
              { mode: 'table', icon: '📋', label: '表格' },
              { mode: 'list', icon: '📄', label: '列表' },
              { mode: 'grid', icon: '⊞', label: '网格' }
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                className={`view-mode-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode as any)}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>
          
          {/* 页面大小 */}
          <select 
            className="page-size-select"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedPosts.size > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            已选择 {selectedPosts.size} 篇文章
          </div>
          
          <div className="bulk-buttons">
            <button 
              className="bulk-btn"
              onClick={() => handleBulkAction('publish')}
            >
              批量发布
            </button>
            <button 
              className="bulk-btn"
              onClick={() => handleBulkAction('draft')}
            >
              转为草稿
            </button>
            <button 
              className="bulk-btn"
              onClick={() => handleBulkAction('feature')}
            >
              设为精选
            </button>
            <button 
              className="bulk-btn danger"
              onClick={() => handleBulkAction('delete')}
            >
              批量删除
            </button>
          </div>
          
          <button 
            className="bulk-close"
            onClick={() => setSelectedPosts(new Set())}
          >
            ✕
          </button>
        </div>
      )}

      {/* 文章列表 */}
      <div className="posts-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>加载文章列表...</p>
          </div>
        ) : (
          <>
            {viewMode === 'table' && (
              <div className="posts-table">
                <table>
                  <thead>
                    <tr>
                      <th className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedPosts.size === posts.length && posts.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('title')}
                      >
                        标题
                        {sort.field === 'title' && (
                          <span className="sort-indicator">
                            {sort.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th>状态</th>
                      <th>分类</th>
                      <th>标签</th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('views')}
                      >
                        访问量
                        {sort.field === 'views' && (
                          <span className="sort-indicator">
                            {sort.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('updatedAt')}
                      >
                        更新时间
                        {sort.field === 'updatedAt' && (
                          <span className="sort-indicator">
                            {sort.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id} className={selectedPosts.has(post.id) ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedPosts.has(post.id)}
                            onChange={() => togglePostSelection(post.id)}
                          />
                        </td>
                        <td>
                          <div className="post-title-cell">
                            {post.featuredImage && (
                              <ResponsiveImage
                                src={post.featuredImage}
                                alt={post.title}
                                className="post-thumbnail"
                              />
                            )}
                            <div className="post-info">
                              <h3 className="post-title">{post.title}</h3>
                              <p className="post-excerpt">{post.excerpt}</p>
                              {post.featured && <span className="featured-badge">精选</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(post.status) }}
                          >
                            {getStatusText(post.status)}
                          </span>
                        </td>
                        <td>{post.category}</td>
                        <td>
                          <div className="tags-cell">
                            {post.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="tag-more">+{post.tags.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td>{post.views.toLocaleString()}</td>
                        <td>{formatRelativeTime(post.updatedAt)}</td>
                        <td>
                          <div className="post-actions">
                            <button className="action-btn" title="编辑">
                              ✏️
                            </button>
                            <button className="action-btn" title="查看">
                              👁️
                            </button>
                            <button className="action-btn" title="复制">
                              📋
                            </button>
                            <button className="action-btn danger" title="删除">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'list' && (
              <div className="posts-list">
                {posts.map(post => (
                  <div key={post.id} className={`post-item ${selectedPosts.has(post.id) ? 'selected' : ''}`}>
                    <div className="post-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                      />
                    </div>
                    
                    {post.featuredImage && (
                      <div className="post-image">
                        <ResponsiveImage
                          src={post.featuredImage}
                          alt={post.title}
                          className="post-img"
                        />
                      </div>
                    )}
                    
                    <div className="post-content">
                      <div className="post-header">
                        <h3 className="post-title">{post.title}</h3>
                        <div className="post-badges">
                          {post.featured && <span className="featured-badge">精选</span>}
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(post.status) }}
                          >
                            {getStatusText(post.status)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="post-excerpt">{post.excerpt}</p>
                      
                      <div className="post-meta">
                        <span className="meta-item">分类：{post.category}</span>
                        <span className="meta-item">访问：{post.views}</span>
                        <span className="meta-item">更新：{formatRelativeTime(post.updatedAt)}</span>
                      </div>
                      
                      <div className="post-tags">
                        {post.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="post-actions">
                      <button className="action-btn" title="编辑">✏️</button>
                      <button className="action-btn" title="查看">👁️</button>
                      <button className="action-btn" title="复制">📋</button>
                      <button className="action-btn danger" title="删除">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="posts-grid">
                {posts.map(post => (
                  <div key={post.id} className={`post-card ${selectedPosts.has(post.id) ? 'selected' : ''}`}>
                    <div className="card-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                      />
                    </div>
                    
                    {post.featuredImage && (
                      <div className="card-image">
                        <ResponsiveImage
                          src={post.featuredImage}
                          alt={post.title}
                          className="card-img"
                        />
                      </div>
                    )}
                    
                    <div className="card-content">
                      <div className="card-header">
                        <h3 className="card-title">{post.title}</h3>
                        <div className="card-badges">
                          {post.featured && <span className="featured-badge">精选</span>}
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(post.status) }}
                          >
                            {getStatusText(post.status)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="card-excerpt">{post.excerpt}</p>
                      
                      <div className="card-meta">
                        <span className="meta-category">{post.category}</span>
                        <span className="meta-views">{post.views} 次访问</span>
                      </div>
                      
                      <div className="card-tags">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      
                      <div className="card-footer">
                        <span className="update-time">{formatRelativeTime(post.updatedAt)}</span>
                        <div className="card-actions">
                          <button className="action-btn" title="编辑">✏️</button>
                          <button className="action-btn" title="查看">👁️</button>
                          <button className="action-btn danger" title="删除">🗑️</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 分页 */}
      {!loading && totalCount > pageSize && (
        <div className="pagination">
          <div className="pagination-info">
            显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} 条，
            共 {totalCount} 条记录
          </div>
          
          <div className="pagination-controls">
            <button 
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              首页
            </button>
            <button 
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              上一页
            </button>
            
            {/* 页码 */}
            {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
              const pageNum = currentPage - 2 + i;
              if (pageNum < 1 || pageNum > Math.ceil(totalCount / pageSize)) return null;
              
              return (
                <button
                  key={pageNum}
                  className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className="page-btn"
              disabled={currentPage === Math.ceil(totalCount / pageSize)}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              下一页
            </button>
            <button 
              className="page-btn"
              disabled={currentPage === Math.ceil(totalCount / pageSize)}
              onClick={() => setCurrentPage(Math.ceil(totalCount / pageSize))}
            >
              末页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManager;
export type {
  Post,
  PostFilter,
  PostSort,
  PostManagerProps
};