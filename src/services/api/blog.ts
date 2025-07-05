// 博客API服务
import httpClient from '../http';
import { API_ENDPOINTS } from '../../constants/api';
import type {
  Blog,
  BlogPost,
  BlogCreateRequest,
  BlogUpdateRequest,
  BlogListParams,
  BlogListResponse,
  BlogStats,
  BlogCategory,
  BlogTag,
  BlogComment,
  CommentCreateRequest,
  CommentUpdateRequest,
  BlogDraft,
  BlogVersion,
  BlogSearchParams,
  BlogSearchResponse,
} from '../../types/blog';
import type { PaginationParams, PaginationResult } from '../../types/common';

/**
 * 博客API服务类
 */
class BlogAPI {
  // ==================== 博客文章管理 ====================

  /**
   * 获取博客列表
   */
  async getBlogs(params?: BlogListParams): Promise<BlogListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.BLOG.LIST}?${queryParams.toString()}`
      : API_ENDPOINTS.BLOG.LIST;

    return httpClient.get<BlogListResponse>(url);
  }

  /**
   * 获取博客详情
   */
  async getBlog(id: string): Promise<BlogPost> {
    return httpClient.get<BlogPost>(`${API_ENDPOINTS.BLOG.DETAIL}/${id}`);
  }

  /**
   * 根据slug获取博客
   */
  async getBlogBySlug(slug: string): Promise<BlogPost> {
    return httpClient.get<BlogPost>(`${API_ENDPOINTS.BLOG.BY_SLUG}/${slug}`);
  }

  /**
   * 创建博客
   */
  async createBlog(data: BlogCreateRequest): Promise<BlogPost> {
    return httpClient.post<BlogPost>(API_ENDPOINTS.BLOG.CREATE, data);
  }

  /**
   * 更新博客
   */
  async updateBlog(id: string, data: BlogUpdateRequest): Promise<BlogPost> {
    return httpClient.put<BlogPost>(`${API_ENDPOINTS.BLOG.UPDATE}/${id}`, data);
  }

  /**
   * 删除博客
   */
  async deleteBlog(id: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.BLOG.DELETE}/${id}`);
  }

  /**
   * 批量删除博客
   */
  async deleteBulkBlogs(ids: string[]): Promise<void> {
    return httpClient.post(API_ENDPOINTS.BLOG.BULK_DELETE, { ids });
  }

  /**
   * 发布博客
   */
  async publishBlog(id: string): Promise<BlogPost> {
    return httpClient.post<BlogPost>(`${API_ENDPOINTS.BLOG.PUBLISH}/${id}`);
  }

  /**
   * 取消发布博客
   */
  async unpublishBlog(id: string): Promise<BlogPost> {
    return httpClient.post<BlogPost>(`${API_ENDPOINTS.BLOG.UNPUBLISH}/${id}`);
  }

  /**
   * 博客点赞
   */
  async likeBlog(id: string): Promise<{ liked: boolean; likeCount: number }> {
    return httpClient.post<{ liked: boolean; likeCount: number }>(
      `${API_ENDPOINTS.BLOG.LIKE}/${id}`
    );
  }

  /**
   * 博客收藏
   */
  async favoriteBlog(id: string): Promise<{ favorited: boolean; favoriteCount: number }> {
    return httpClient.post<{ favorited: boolean; favoriteCount: number }>(
      `${API_ENDPOINTS.BLOG.FAVORITE}/${id}`
    );
  }

  /**
   * 增加博客浏览量
   */
  async incrementViews(id: string): Promise<{ viewCount: number }> {
    return httpClient.post<{ viewCount: number }>(
      `${API_ENDPOINTS.BLOG.VIEW}/${id}`,
      {},
      { skipAuth: true }
    );
  }

  // ==================== 博客搜索 ====================

  /**
   * 搜索博客
   */
  async searchBlogs(params: BlogSearchParams): Promise<BlogSearchResponse> {
    return httpClient.post<BlogSearchResponse>(API_ENDPOINTS.BLOG.SEARCH, params);
  }

  /**
   * 获取搜索建议
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    return httpClient.get<string[]>(
      `${API_ENDPOINTS.BLOG.SEARCH_SUGGESTIONS}?q=${encodeURIComponent(query)}`,
      { skipAuth: true }
    );
  }

  // ==================== 博客分类管理 ====================

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<BlogCategory[]> {
    return httpClient.get<BlogCategory[]>(API_ENDPOINTS.BLOG.CATEGORIES, {
      skipAuth: true
    });
  }

  /**
   * 创建分类
   */
  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }): Promise<BlogCategory> {
    return httpClient.post<BlogCategory>(API_ENDPOINTS.BLOG.CATEGORIES, data);
  }

  /**
   * 更新分类
   */
  async updateCategory(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      parentId: string;
    }>
  ): Promise<BlogCategory> {
    return httpClient.put<BlogCategory>(`${API_ENDPOINTS.BLOG.CATEGORIES}/${id}`, data);
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.BLOG.CATEGORIES}/${id}`);
  }

  /**
   * 获取分类下的博客
   */
  async getBlogsByCategory(
    categoryId: string,
    params?: PaginationParams
  ): Promise<PaginationResult<BlogPost>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.BLOG.CATEGORIES}/${categoryId}/blogs?${queryParams.toString()}`
      : `${API_ENDPOINTS.BLOG.CATEGORIES}/${categoryId}/blogs`;

    return httpClient.get<PaginationResult<BlogPost>>(url, { skipAuth: true });
  }

  // ==================== 博客标签管理 ====================

  /**
   * 获取所有标签
   */
  async getTags(): Promise<BlogTag[]> {
    return httpClient.get<BlogTag[]>(API_ENDPOINTS.BLOG.TAGS, { skipAuth: true });
  }

  /**
   * 创建标签
   */
  async createTag(data: {
    name: string;
    slug: string;
    color?: string;
    description?: string;
  }): Promise<BlogTag> {
    return httpClient.post<BlogTag>(API_ENDPOINTS.BLOG.TAGS, data);
  }

  /**
   * 更新标签
   */
  async updateTag(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      color: string;
      description: string;
    }>
  ): Promise<BlogTag> {
    return httpClient.put<BlogTag>(`${API_ENDPOINTS.BLOG.TAGS}/${id}`, data);
  }

  /**
   * 删除标签
   */
  async deleteTag(id: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.BLOG.TAGS}/${id}`);
  }

  /**
   * 获取标签下的博客
   */
  async getBlogsByTag(
    tagId: string,
    params?: PaginationParams
  ): Promise<PaginationResult<BlogPost>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.BLOG.TAGS}/${tagId}/blogs?${queryParams.toString()}`
      : `${API_ENDPOINTS.BLOG.TAGS}/${tagId}/blogs`;

    return httpClient.get<PaginationResult<BlogPost>>(url, { skipAuth: true });
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit = 20): Promise<BlogTag[]> {
    return httpClient.get<BlogTag[]>(
      `${API_ENDPOINTS.BLOG.TAGS}/popular?limit=${limit}`,
      { skipAuth: true }
    );
  }

  // ==================== 博客评论管理 ====================

  /**
   * 获取博客评论
   */
  async getComments(
    blogId: string,
    params?: PaginationParams
  ): Promise<PaginationResult<BlogComment>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.BLOG.COMMENTS}/${blogId}?${queryParams.toString()}`
      : `${API_ENDPOINTS.BLOG.COMMENTS}/${blogId}`;

    return httpClient.get<PaginationResult<BlogComment>>(url, { skipAuth: true });
  }

  /**
   * 创建评论
   */
  async createComment(data: CommentCreateRequest): Promise<BlogComment> {
    return httpClient.post<BlogComment>(API_ENDPOINTS.BLOG.COMMENTS, data);
  }

  /**
   * 更新评论
   */
  async updateComment(id: string, data: CommentUpdateRequest): Promise<BlogComment> {
    return httpClient.put<BlogComment>(`${API_ENDPOINTS.BLOG.COMMENTS}/${id}`, data);
  }

  /**
   * 删除评论
   */
  async deleteComment(id: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.BLOG.COMMENTS}/${id}`);
  }

  /**
   * 点赞评论
   */
  async likeComment(id: string): Promise<{ liked: boolean; likeCount: number }> {
    return httpClient.post<{ liked: boolean; likeCount: number }>(
      `${API_ENDPOINTS.BLOG.COMMENTS}/${id}/like`
    );
  }

  // ==================== 博客草稿管理 ====================

  /**
   * 获取草稿列表
   */
  async getDrafts(params?: PaginationParams): Promise<PaginationResult<BlogDraft>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.BLOG.DRAFTS}?${queryParams.toString()}`
      : API_ENDPOINTS.BLOG.DRAFTS;

    return httpClient.get<PaginationResult<BlogDraft>>(url);
  }

  /**
   * 保存草稿
   */
  async saveDraft(data: Partial<BlogCreateRequest>): Promise<BlogDraft> {
    return httpClient.post<BlogDraft>(API_ENDPOINTS.BLOG.DRAFTS, data);
  }

  /**
   * 更新草稿
   */
  async updateDraft(id: string, data: Partial<BlogCreateRequest>): Promise<BlogDraft> {
    return httpClient.put<BlogDraft>(`${API_ENDPOINTS.BLOG.DRAFTS}/${id}`, data);
  }

  /**
   * 删除草稿
   */
  async deleteDraft(id: string): Promise<void> {
    return httpClient.delete(`${API_ENDPOINTS.BLOG.DRAFTS}/${id}`);
  }

  /**
   * 从草稿发布博客
   */
  async publishFromDraft(id: string): Promise<BlogPost> {
    return httpClient.post<BlogPost>(`${API_ENDPOINTS.BLOG.DRAFTS}/${id}/publish`);
  }

  // ==================== 博客版本管理 ====================

  /**
   * 获取博客版本历史
   */
  async getBlogVersions(blogId: string): Promise<BlogVersion[]> {
    return httpClient.get<BlogVersion[]>(`${API_ENDPOINTS.BLOG.VERSIONS}/${blogId}`);
  }

  /**
   * 获取指定版本内容
   */
  async getBlogVersion(blogId: string, versionId: string): Promise<BlogVersion> {
    return httpClient.get<BlogVersion>(
      `${API_ENDPOINTS.BLOG.VERSIONS}/${blogId}/${versionId}`
    );
  }

  /**
   * 恢复到指定版本
   */
  async restoreBlogVersion(blogId: string, versionId: string): Promise<BlogPost> {
    return httpClient.post<BlogPost>(
      `${API_ENDPOINTS.BLOG.VERSIONS}/${blogId}/${versionId}/restore`
    );
  }

  // ==================== 博客统计 ====================

  /**
   * 获取博客统计信息
   */
  async getBlogStats(blogId?: string): Promise<BlogStats> {
    const url = blogId 
      ? `${API_ENDPOINTS.BLOG.STATS}/${blogId}`
      : API_ENDPOINTS.BLOG.STATS;
    
    return httpClient.get<BlogStats>(url);
  }

  /**
   * 获取热门博客
   */
  async getPopularBlogs(params?: {
    period?: 'day' | 'week' | 'month' | 'year';
    limit?: number;
  }): Promise<BlogPost[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.BLOG.POPULAR}?${queryParams.toString()}`
      : API_ENDPOINTS.BLOG.POPULAR;

    return httpClient.get<BlogPost[]>(url, { skipAuth: true });
  }

  /**
   * 获取推荐博客
   */
  async getRecommendedBlogs(blogId?: string, limit = 5): Promise<BlogPost[]> {
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    if (blogId) {
      queryParams.append('blogId', blogId);
    }

    return httpClient.get<BlogPost[]>(
      `${API_ENDPOINTS.BLOG.RECOMMENDED}?${queryParams.toString()}`,
      { skipAuth: true }
    );
  }

  /**
   * 获取最新博客
   */
  async getLatestBlogs(limit = 10): Promise<BlogPost[]> {
    return httpClient.get<BlogPost[]>(
      `${API_ENDPOINTS.BLOG.LATEST}?limit=${limit}`,
      { skipAuth: true }
    );
  }

  // ==================== 博客导入导出 ====================

  /**
   * 导出博客
   */
  async exportBlog(id: string, format: 'markdown' | 'html' | 'pdf' = 'markdown'): Promise<Blob> {
    const response = await httpClient.getInstance().get(
      `${API_ENDPOINTS.BLOG.EXPORT}/${id}?format=${format}`,
      {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${httpClient.getInstance().defaults.headers.Authorization}`,
        },
      }
    );
    return response.data;
  }

  /**
   * 批量导出博客
   */
  async exportBlogs(
    ids: string[],
    format: 'markdown' | 'html' | 'pdf' = 'markdown'
  ): Promise<Blob> {
    const response = await httpClient.getInstance().post(
      `${API_ENDPOINTS.BLOG.EXPORT_BULK}?format=${format}`,
      { ids },
      {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${httpClient.getInstance().defaults.headers.Authorization}`,
        },
      }
    );
    return response.data;
  }

  /**
   * 导入博客
   */
  async importBlog(file: File): Promise<{ imported: number; failed: number; errors?: string[] }> {
    return httpClient.upload<{ imported: number; failed: number; errors?: string[] }>(
      API_ENDPOINTS.BLOG.IMPORT,
      file
    );
  }
}

// 创建博客API实例
const blogAPI = new BlogAPI();

export { blogAPI, BlogAPI };
export default blogAPI;