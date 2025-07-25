import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Archive,
  Calendar,
  User,
  Tag,
  MoreHorizontal,
  ChevronDown,
  Download,
  RefreshCw,
  FileText,
  Globe,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useBlogList,
  useDeleteBlog,
  useBatchDeleteBlogs,
  usePublishBlog,
  useBlogStats,
  useBlogCategories,
  useBlogTags
} from '../../hooks/useBlog';
import type { Blog, BlogStatus, BlogListParams } from '../../types/blog';

// 状态选项
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
  { value: 'archived', label: '已归档' }
];

// 排序选项
const sortOptions = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'updatedAt', label: '更新时间' },
  { value: 'publishedAt', label: '发布时间' },
  { value: 'viewCount', label: '浏览量' },
  { value: 'title', label: '标题' }
];

const BlogManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // 使用博客相关的hooks
  const {
    data: blogData,
    loading: blogsLoading,
    error: blogsError,
    pagination,
    updateParams,
    refresh: refreshBlogs
  } = useBlogList({
    page: 1,
    limit: 10,
    search: searchTerm || undefined,
    status: statusFilter || undefined,
    categoryId: categoryFilter || undefined,
    tagId: tagFilter || undefined,
    sortBy,
    sortOrder
  } as BlogListParams);

  // 延迟加载统计数据，避免初始页面加载时过多API调用
  const { data: stats, loading: statsLoading, execute: loadStats } = useBlogStats();
  const { data: categories, execute: loadCategories } = useBlogCategories();
  const { data: tags, execute: loadTags } = useBlogTags();
  
  // 在组件挂载后延迟加载辅助数据，使用ref避免重复调用
  const hasLoadedRef = useRef(false);
  
  useEffect(() => {
    if (hasLoadedRef.current) return;
    
    const timer = setTimeout(() => {
      loadStats();
      loadCategories();
      loadTags();
      hasLoadedRef.current = true;
    }, 500); // 延迟500ms加载
    
    return () => clearTimeout(timer);
  }, []); // 移除依赖项，只在组件挂载时执行一次
  
  const { submit: deleteBlog, loading: deleteLoading } = useDeleteBlog();
  const { submit: batchDelete, loading: batchDeleteLoading } = useBatchDeleteBlogs();
  const { submit: publishBlog, loading: publishLoading } = usePublishBlog();

  // 使用useMemo优化数据处理，确保正确处理API响应数据
  const blogs = useMemo(() => {
    if (!blogData || !Array.isArray(blogData.data)) {
      return [];
    }
    return blogData.data.map(blog => ({
      ...blog,
      id: blog.id?.toString() || '',
      title: blog.title || '无标题',
      summary: blog.summary || blog.content?.substring(0, 100) + '...' || '暂无摘要',
      status: blog.status || 'draft',
      viewCount: blog.viewCount || 0,
      likeCount: blog.likeCount || 0,
      commentCount: blog.commentCount || 0,
      tags: Array.isArray(blog.tags) ? blog.tags : [],
      categories: Array.isArray(blog.categories) ? blog.categories : [],
      author: blog.author || { nickname: '未知作者', username: 'unknown' },
      createdAt: blog.createdAt || new Date().toISOString(),
      publishedAt: blog.publishedAt || blog.createdAt || new Date().toISOString()
    }));
  }, [blogData]);
  
  const totalCount = blogData?.total || 0;
  const loading = blogsLoading;
  
  console.log('BlogManagement - 完整响应数据:', blogData);
  console.log('BlogManagement - 提取的blogs数组:', blogs);
  console.log('BlogManagement - 总数:', totalCount);
  console.log('BlogManagement - 分页信息:', pagination);
  console.log('BlogManagement - 加载状态:', loading);
  console.log('BlogManagement - 错误信息:', blogsError);

  // 搜索处理
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    updateParams({
      search: term || undefined,
      page: 1
    } as Partial<BlogListParams>);
  }, [updateParams]);

  // 状态过滤处理
  const handleStatusFilter = useCallback((status: BlogStatus | '') => {
    setStatusFilter(status);
    updateParams({
      status: status || undefined,
      page: 1
    } as Partial<BlogListParams>);
  }, [updateParams]);

  // 分类过滤处理
  const handleCategoryFilter = useCallback((categoryId: string) => {
    setCategoryFilter(categoryId);
    updateParams({
      categoryId: categoryId || undefined,
      page: 1
    } as Partial<BlogListParams>);
  }, [updateParams]);

  // 标签过滤处理
  const handleTagFilter = useCallback((tagId: string) => {
    setTagFilter(tagId);
    updateParams({
      tagId: tagId || undefined,
      page: 1
    } as Partial<BlogListParams>);
  }, [updateParams]);

  // 排序处理
  const handleSort = useCallback((field: string) => {
    const newOrder = sortBy === field && sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortBy(field);
    setSortOrder(newOrder);
    updateParams({
      sortBy: field,
      sortOrder: newOrder,
      page: 1
    } as Partial<BlogListParams>);
  }, [updateParams, sortBy, sortOrder]);

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedPosts.length === 0) return;
    
    if (window.confirm(`确定要删除选中的 ${selectedPosts.length} 篇文章吗？`)) {
      try {
        await batchDelete(selectedPosts);
        setSelectedPosts([]);
        updateParams({});
      } catch (error) {
        console.error('批量删除失败:', error);
      }
    }
  };

  // 批量归档
  const handleBatchArchive = async () => {
    if (selectedPosts.length === 0) return;
    
    try {
      for (const postId of selectedPosts) {
        await publishBlog({ id: postId, published: false });
      }
      setSelectedPosts([]);
      updateParams({});
    } catch (error) {
      console.error('批量归档失败:', error);
    }
  };

  // 删除单个文章
  const handleDeletePost = async (postId: string) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      try {
        await deleteBlog(postId);
        updateParams({});
      } catch (error) {
        console.error('删除文章失败:', error);
      }
    }
  };

  // 切换发布状态
  const handleTogglePublish = async (blog: Blog) => {
    try {
      await publishBlog({ id: blog.id, published: blog.status !== 'published' });
      updateParams({});
    } catch (error) {
      console.error('更新发布状态失败:', error);
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return '已发布';
      case 'draft':
        return '草稿';
      case 'archived':
        return '已归档';
      case 'pending':
        return '待审核';
      default:
        return '未知';
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === blogs.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(blogs.map(blog => blog.id));
    }
  };

  // 错误处理
  if (blogsError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                加载失败
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {blogsError.message || '获取博客列表时发生错误'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => updateParams({})}
              className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">文章管理</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            管理您的博客文章，包括发布、编辑和删除操作。
          </p>
        </div>
        <Link
          to="/admin/blog/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建文章
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">总文章数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? '...' : (stats?.total || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">已发布</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? '...' : (stats?.published || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">草稿</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? '...' : (stats?.draft || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">总浏览量</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? '...' : formatNumber(stats?.totalViews || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索文章标题或内容..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as BlogStatus | '')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
            
            <button
              onClick={() => updateParams({})}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  分类
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">全部分类</option>
                  {categories?.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标签
                </label>
                <select
                  value={tagFilter}
                  onChange={(e) => handleTagFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">全部标签</option>
                  {tags?.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedPosts.length === blogs.length && blogs.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                  已选择 {selectedPosts.length} 项
                </span>
              </label>
            </div>
            {selectedPosts.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchDelete}
                  disabled={batchDeleteLoading}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {batchDeleteLoading ? '删除中...' : '批量删除'}
                </button>
                <button
                  onClick={handleBatchArchive}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  批量归档
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  文章
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  作者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  发布日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  浏览量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {blogs.length > 0 ? blogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(blog.id)}
                        onChange={() => handleSelectPost(blog.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          <Link
                            to={`/admin/blog/${blog.id}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {blog.title || '无标题'}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {blog.summary || '暂无摘要'}
                        </div>
                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            {blog.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={typeof tag === 'string' ? tag : tag.id || index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {typeof tag === 'string' ? tag : tag.name}
                              </span>
                            ))}
                            {blog.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{blog.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8">
                        {blog.author?.avatar ? (
                          <img
                            className="w-8 h-8 rounded-full"
                            src={blog.author.avatar}
                            alt={blog.author.nickname || blog.author.username}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {blog.author?.nickname || blog.author?.username || '未知作者'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePublish(blog)}
                      disabled={publishLoading}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                        blog.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200'
                          : blog.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {getStatusText(blog.status)}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {formatDate(blog.publishedAt || blog.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
                        {formatNumber(blog.viewCount || 0)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/blog/${blog.slug}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="预览文章"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/blog/${blog.id}/edit`}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="编辑文章"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeletePost(blog.id)}
                        disabled={deleteLoading}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="删除文章"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <FileText className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {loading ? '加载中...' : '暂无博客文章'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {loading ? '正在获取博客列表' : '开始创建您的第一篇文章吧'}
                    </p>
                    {!loading && (
                      <Link
                        to="/admin/blog/new"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        新建文章
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalCount > 0 && (
        <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              显示 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, totalCount)}
              </span>{' '}
              条，共 <span className="font-medium">{totalCount}</span> 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParams({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateParams({ page: pageNum })}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      pageNum === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => updateParams({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;