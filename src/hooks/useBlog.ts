import { useCallback } from 'react';
import { blogAPI } from '../services/api';
import { useApi, usePaginatedApi, useSubmit, useBatchOperation } from './useApi';
import type {
  Blog,
  BlogListParams,
  BlogListResponse,
  CreateBlogRequest,
  UpdateBlogRequest,
  BlogCategory,
  BlogTag,
  BlogComment,
  BlogCommentListParams,
  BlogCommentListResponse,
  CreateBlogCommentRequest,
  UpdateBlogCommentRequest
} from '../types/blog';

/**
 * 博客列表Hook
 * @param initialParams 初始查询参数
 * @returns 博客列表状态和操作方法
 */
export function useBlogList(initialParams: BlogListParams = { page: 1, limit: 10 }) {
  return usePaginatedApi(
    async (params: BlogListParams) => {
      try {
        const response = await blogAPI.getBlogs(params);
        console.log('API响应数据:', response);
        
        // 确保返回的数据结构正确
        if (!response || typeof response !== 'object') {
          throw new Error('API返回数据格式错误');
        }
        
        // 处理多层嵌套的响应结构
        let actualData = [];
        let actualTotal = 0;
        let actualPage = 1;
        let actualLimit = 10;
        let actualTotalPages = 0;
        
        // 处理嵌套结构：{ success: true, data: { success: true, data: { data: [...], total: ..., ... } } }
        if (response.data && response.data.data && response.data.data.data) {
          const innerData = response.data.data;
          actualData = Array.isArray(innerData.data) ? innerData.data : [];
          actualTotal = innerData.total || 0;
          actualPage = innerData.page || 1;
          actualLimit = innerData.limit || 10;
          actualTotalPages = innerData.totalPages || Math.ceil(actualTotal / actualLimit);
        }
        // 处理二层嵌套：{ success: true, data: { data: [...], total: ..., ... } }
        else if (response.data && response.data.data) {
          actualData = Array.isArray(response.data.data) ? response.data.data : [];
          actualTotal = response.data.total || 0;
          actualPage = response.data.page || 1;
          actualLimit = response.data.limit || 10;
          actualTotalPages = response.data.totalPages || Math.ceil(actualTotal / actualLimit);
        }
        // 处理直接结构：{ data: [...], total: ..., ... }
        else if (response.data && Array.isArray(response.data)) {
          actualData = response.data;
          actualTotal = response.total || 0;
          actualPage = response.page || 1;
          actualLimit = response.limit || 10;
          actualTotalPages = response.totalPages || Math.ceil(actualTotal / actualLimit);
        }
        // 兜底处理
        else {
          actualData = Array.isArray(response.data) ? response.data : [];
          actualTotal = response.total || actualData.length;
          actualPage = response.page || 1;
          actualLimit = response.limit || 10;
          actualTotalPages = response.totalPages || Math.ceil(actualTotal / actualLimit);
        }
        
        // 数据标准化处理
        const normalizedData = actualData.map((blog: any) => ({
          ...blog,
          id: blog.id?.toString() || '',
          title: blog.title || '无标题',
          slug: blog.slug || '',
          summary: blog.summary || '',
          content: blog.content || '',
          status: blog.status || 'draft',
          viewCount: blog.viewCount || 0,
          likeCount: blog.likeCount || 0,
          commentCount: blog.commentCount || 0,
          tags: Array.isArray(blog.tags) ? blog.tags : [],
          categories: Array.isArray(blog.categories) ? blog.categories : [],
          author: blog.author || { nickname: '未知作者', username: 'unknown' },
          createdAt: blog.createdAt || new Date().toISOString(),
          updatedAt: blog.updatedAt || new Date().toISOString(),
          publishedAt: blog.publishedAt || blog.createdAt || new Date().toISOString()
        }));
        
        console.log('处理后的数据:', { 
          data: normalizedData, 
          total: actualTotal, 
          page: actualPage, 
          limit: actualLimit, 
          totalPages: actualTotalPages 
        });
        
        // 转换为PaginationResult格式
        return {
          data: normalizedData,
          total: actualTotal,
          page: actualPage,
          limit: actualLimit,
          totalPages: actualTotalPages
        };
      } catch (error) {
        console.error('获取博客列表失败:', error);
        // 返回空数据结构而不是抛出错误
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        };
      }
    },
    initialParams,
    {
      immediate: true,
      onError: (error) => {
        console.error('获取博客列表失败:', error);
      }
    }
  );
}

/**
 * 博客详情Hook
 * @param id 博客ID
 * @returns 博客详情状态和操作方法
 */
export function useBlogDetail(id: string | null) {
  return useApi(
    useCallback(() => {
      if (!id) throw new Error('博客ID不能为空');
      return blogAPI.getBlog(id);
    }, [id]),
    {
      immediate: !!id,
      onError: (error) => {
        console.error('获取博客详情失败:', error);
      }
    }
  );
}

/**
 * 创建博客Hook
 * @returns 创建博客状态和操作方法
 */
export function useCreateBlog() {
  return useSubmit(
    (data: CreateBlogRequest) => blogAPI.createBlog(data),
    {
      onSuccess: (blog) => {
        console.log('博客创建成功:', blog);
      },
      onError: (error) => {
        console.error('创建博客失败:', error);
      }
    }
  );
}

/**
 * 更新博客Hook
 * @returns 更新博客状态和操作方法
 */
export function useUpdateBlog() {
  return useSubmit(
    ({ id, data }: { id: string; data: UpdateBlogRequest }) => 
      blogAPI.updateBlog(id, data),
    {
      onSuccess: (blog) => {
        console.log('博客更新成功:', blog);
      },
      onError: (error) => {
        console.error('更新博客失败:', error);
      }
    }
  );
}

/**
 * 删除博客Hook
 * @returns 删除博客状态和操作方法
 */
export function useDeleteBlog() {
  return useSubmit(
    (id: string) => blogAPI.deleteBlog(id),
    {
      onSuccess: () => {
        console.log('博客删除成功');
      },
      onError: (error) => {
        console.error('删除博客失败:', error);
      }
    }
  );
}

/**
 * 批量删除博客Hook
 * @returns 批量删除状态和操作方法
 */
export function useBatchDeleteBlogs() {
  return useBatchOperation(
    (ids: string[]) => blogAPI.batchDeleteBlogs(ids),
    {
      onSuccess: (result) => {
        console.log('批量删除博客成功:', result);
      },
      onError: (error) => {
        console.error('批量删除博客失败:', error);
      }
    }
  );
}

/**
 * 发布/取消发布博客Hook
 * @returns 发布状态和操作方法
 */
export function usePublishBlog() {
  return useSubmit(
    ({ id, published }: { id: string; published: boolean }) => 
      blogAPI.updateBlog(id, { published }),
    {
      onSuccess: (blog) => {
        console.log(`博客${blog.published ? '发布' : '取消发布'}成功`);
      },
      onError: (error) => {
        console.error('更新发布状态失败:', error);
      }
    }
  );
}

/**
 * 博客分类列表Hook
 * @returns 分类列表状态和操作方法
 */
export function useBlogCategories() {
  const apiFunction = useCallback(() => blogAPI.getCategories(), []);
  
  return useApi(
    apiFunction,
    {
      immediate: false, // 改为手动加载
      onError: (error) => {
        console.error('获取博客分类失败:', error);
      }
    }
  );
}

/**
 * 创建博客分类Hook
 * @returns 创建分类状态和操作方法
 */
export function useCreateBlogCategory() {
  return useSubmit(
    (data: Omit<BlogCategory, 'id' | 'createdAt' | 'updatedAt'>) => 
      blogAPI.createCategory(data),
    {
      onSuccess: (category) => {
        console.log('分类创建成功:', category);
      },
      onError: (error) => {
        console.error('创建分类失败:', error);
      }
    }
  );
}

/**
 * 更新博客分类Hook
 * @returns 更新分类状态和操作方法
 */
export function useUpdateBlogCategory() {
  return useSubmit(
    ({ id, data }: { id: string; data: Partial<BlogCategory> }) => 
      blogAPI.updateCategory(id, data),
    {
      onSuccess: (category) => {
        console.log('分类更新成功:', category);
      },
      onError: (error) => {
        console.error('更新分类失败:', error);
      }
    }
  );
}

/**
 * 删除博客分类Hook
 * @returns 删除分类状态和操作方法
 */
export function useDeleteBlogCategory() {
  return useSubmit(
    (id: string) => blogAPI.deleteCategory(id),
    {
      onSuccess: () => {
        console.log('分类删除成功');
      },
      onError: (error) => {
        console.error('删除分类失败:', error);
      }
    }
  );
}

/**
 * 博客标签列表Hook
 * @returns 标签列表状态和操作方法
 */
export function useBlogTags() {
  const apiFunction = useCallback(() => blogAPI.getTags(), []);
  
  return useApi(
    apiFunction,
    {
      immediate: false, // 改为手动加载
      onError: (error) => {
        console.error('获取博客标签失败:', error);
      }
    }
  );
}

/**
 * 创建博客标签Hook
 * @returns 创建标签状态和操作方法
 */
export function useCreateBlogTag() {
  return useSubmit(
    (data: Omit<BlogTag, 'id' | 'createdAt' | 'updatedAt'>) => 
      blogAPI.createTag(data),
    {
      onSuccess: (tag) => {
        console.log('标签创建成功:', tag);
      },
      onError: (error) => {
        console.error('创建标签失败:', error);
      }
    }
  );
}

/**
 * 博客评论列表Hook
 * @param blogId 博客ID
 * @param initialParams 初始查询参数
 * @returns 评论列表状态和操作方法
 */
export function useBlogComments(
  blogId: string | null,
  initialParams: BlogCommentListParams = { page: 1, limit: 10 }
) {
  return usePaginatedApi(
    useCallback((params: BlogCommentListParams) => {
      if (!blogId) throw new Error('博客ID不能为空');
      return blogAPI.getBlogComments(blogId, params);
    }, [blogId]),
    initialParams,
    {
      immediate: !!blogId,
      onError: (error) => {
        console.error('获取博客评论失败:', error);
      }
    }
  );
}

/**
 * 创建博客评论Hook
 * @returns 创建评论状态和操作方法
 */
export function useCreateBlogComment() {
  return useSubmit(
    ({ blogId, data }: { blogId: string; data: CreateBlogCommentRequest }) => 
      blogAPI.createBlogComment(blogId, data),
    {
      onSuccess: (comment) => {
        console.log('评论创建成功:', comment);
      },
      onError: (error) => {
        console.error('创建评论失败:', error);
      }
    }
  );
}

/**
 * 更新博客评论Hook
 * @returns 更新评论状态和操作方法
 */
export function useUpdateBlogComment() {
  return useSubmit(
    ({ id, data }: { id: string; data: UpdateBlogCommentRequest }) => 
      blogAPI.updateBlogComment(id, data),
    {
      onSuccess: (comment) => {
        console.log('评论更新成功:', comment);
      },
      onError: (error) => {
        console.error('更新评论失败:', error);
      }
    }
  );
}

/**
 * 删除博客评论Hook
 * @returns 删除评论状态和操作方法
 */
export function useDeleteBlogComment() {
  return useSubmit(
    (id: string) => blogAPI.deleteBlogComment(id),
    {
      onSuccess: () => {
        console.log('评论删除成功');
      },
      onError: (error) => {
        console.error('删除评论失败:', error);
      }
    }
  );
}

/**
 * 博客统计Hook
 * @returns 博客统计数据
 */
export function useBlogStats() {
  const apiFunction = useCallback(async () => {
    try {
      const response = await blogAPI.getBlogStats();
      console.log('统计API响应数据:', response);
      
      // 处理嵌套响应结构
      let actualData = null;
      
      // 处理嵌套结构：{ success: true, data: { success: true, data: { total: ..., published: ..., ... } } }
      if (response && response.data && response.data.data) {
        actualData = response.data.data;
      }
      // 处理二层嵌套：{ success: true, data: { total: ..., published: ..., ... } }
      else if (response && response.data) {
        actualData = response.data;
      }
      // 处理直接结构：{ total: ..., published: ..., ... }
      else {
        actualData = response;
      }
      
      console.log('处理后的统计数据:', actualData);
      return actualData;
    } catch (error) {
      console.error('获取博客统计失败:', error);
      // 返回默认数据而不是抛出错误
      return {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0,
        totalViews: 0,
        totalLikes: 0
      };
    }
  }, []);
  
  return useApi(
    apiFunction,
    {
      immediate: false, // 改为手动加载
      onError: (error) => {
        console.error('获取博客统计失败:', error);
      }
    }
  );
}

/**
 * 博客搜索Hook
 * @param query 搜索关键词
 * @param params 搜索参数
 * @returns 搜索结果状态和操作方法
 */
export function useBlogSearch(
  query: string,
  params: Omit<BlogListParams, 'search'> = { page: 1, limit: 10 }
) {
  return usePaginatedApi(
    useCallback((searchParams: BlogListParams) => 
      blogAPI.getBlogs({ ...searchParams, search: query }),
    [query]),
    { ...params, search: query },
    {
      immediate: !!query,
      onError: (error) => {
        console.error('搜索博客失败:', error);
      }
    }
  );
}