import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Calendar, User, Tag, Eye, Heart, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/date';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage?: string;
  status: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isTop: boolean;
  allowComment: boolean;
  tags: string[];
  seoKeywords: string[];
  seoDescription: string;
  publishedAt: string;
  author: {
    id: number;
    username: string;
    nickname: string;
    avatar?: string;
  };
  categories: {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon?: string;
    color?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface BlogListResponse {
  data: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  children?: Category[];
}

const BlogList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pageSize: 10,
    totalPages: 0
  });

  // 从URL参数获取分类ID和页码
  const categoryId = searchParams.get('categoryId');
  const page = parseInt(searchParams.get('page') || '1');

  // 获取分类树数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories/tree');
        const result = await response.json();
        if (result.success) {
          setCategories(result.data.data || []);
          
          // 查找当前分类
          if (categoryId) {
            const findCategory = (cats: Category[]): Category | null => {
              for (const cat of cats) {
                if (cat.id.toString() === categoryId) {
                  return cat;
                }
                if (cat.children) {
                  const found = findCategory(cat.children);
                  if (found) return found;
                }
              }
              return null;
            };
            setCurrentCategory(findCategory(result.data.data || []));
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };

    fetchCategories();
  }, [categoryId]);

  // 获取博客列表
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.pageSize.toString(),
          status: 'published',
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        });
        
        if (categoryId) {
          params.append('categoryId', categoryId);
        }
        
        const response = await fetch(`/api/blogs?${params.toString()}`);
        const result = await response.json();
        
        if (result.success && result.data.success) {
          const data: BlogListResponse = result.data.data;
          setPosts(data.data || []);
          setPagination({
            current: data.page,
            total: data.total,
            pageSize: data.limit,
            totalPages: data.totalPages
          });
        } else {
          throw new Error('获取博客列表失败');
        }
      } catch (error) {
        console.error('获取博客失败:', error);
        setError('获取博客列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [categoryId, page, pagination.pageSize]);

  // 处理分页
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 渲染分页组件
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pagination.current - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(pagination.current - 1)}
          disabled={pagination.current <= 1}
          className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {start > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              1
            </button>
            {start > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`px-3 py-2 rounded-md border ${
              pageNum === pagination.current
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {pageNum}
          </button>
        ))}
        
        {end < pagination.totalPages && (
          <>
            {end < pagination.totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {pagination.totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(pagination.current + 1)}
          disabled={pagination.current >= pagination.totalPages}
          className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">首页</Link>
            <span>/</span>
            {currentCategory ? (
              <>
                <span>博客</span>
                <span>/</span>
                <span className="text-gray-900 dark:text-white">{currentCategory.name}</span>
              </>
            ) : (
              <span className="text-gray-900 dark:text-white">所有博客</span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {currentCategory?.icon && (
              <span className="text-2xl">{currentCategory.icon}</span>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentCategory ? currentCategory.name : '所有博客'}
              </h1>
              {currentCategory?.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {currentCategory.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            共找到 {pagination.total} 篇文章
          </div>
        </div>

        {/* 博客列表 */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map(post => (
              <article key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* 文章标题 */}
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <Link to={`/blog/${post.slug || post.id}`}>
                        {post.isTop && (
                          <span className="inline-block bg-red-100 text-red-600 text-xs px-2 py-1 rounded mr-2">
                            置顶
                          </span>
                        )}
                        {post.title}
                      </Link>
                    </h2>
                  </div>
                  
                  {/* 文章摘要 */}
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {post.summary}
                  </p>
                  
                  {/* 标签 */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 文章元信息 */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{post.author.nickname || post.author.username}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.viewCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.likeCount}</span>
                      </div>
                      {post.allowComment && (
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
            
            {/* 分页 */}
            {renderPagination()}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {currentCategory ? `${currentCategory.name} 分类下暂无文章` : '暂无文章'}
            </p>
            <Link 
              to="/"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              返回首页
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;