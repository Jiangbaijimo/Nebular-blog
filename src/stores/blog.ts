/**
 * 博客状态管理
 * 管理博客文章、分类、标签、评论等状态
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  BlogPost, 
  BlogCategory, 
  BlogTag, 
  BlogComment, 
  PostStatus, 
  SyncStatus,
  BlogStats,
  PostFilter,
  PostSort,
  PaginatedPosts
} from '../types/blog';
import { httpClient } from '../services/http';
import { API_ENDPOINTS } from '../constants/api';

// ==================== 类型定义 ====================

/**
 * 博客状态接口
 */
export interface BlogState {
  // 文章相关
  posts: BlogPost[];
  currentPost: BlogPost | null;
  draftPosts: BlogPost[];
  
  // 分类和标签
  categories: BlogCategory[];
  tags: BlogTag[];
  
  // 评论
  comments: BlogComment[];
  
  // 分页和筛选
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filter: PostFilter;
  sort: PostSort;
  
  // 加载状态
  isLoading: boolean;
  isLoadingPosts: boolean;
  isLoadingPost: boolean;
  isLoadingCategories: boolean;
  isLoadingTags: boolean;
  isLoadingComments: boolean;
  
  // 操作状态
  isSaving: boolean;
  isPublishing: boolean;
  isDeleting: boolean;
  
  // 错误状态
  error: string | null;
  
  // 统计信息
  stats: BlogStats | null;
  
  // 搜索状态
  searchQuery: string;
  searchResults: BlogPost[];
  isSearching: boolean;
  
  // 缓存状态
  lastFetchTime: number;
  cacheExpiry: number;
}

/**
 * 博客操作接口
 */
export interface BlogActions {
  // 文章操作
  fetchPosts: (params?: Partial<PostFilter & PostSort & { page: number; pageSize: number }>) => Promise<void>;
  fetchPost: (id: string) => Promise<BlogPost>;
  createPost: (post: Partial<BlogPost>) => Promise<BlogPost>;
  updatePost: (id: string, post: Partial<BlogPost>) => Promise<BlogPost>;
  deletePost: (id: string) => Promise<void>;
  publishPost: (id: string) => Promise<void>;
  unpublishPost: (id: string) => Promise<void>;
  duplicatePost: (id: string) => Promise<BlogPost>;
  
  // 草稿操作
  saveDraft: (post: Partial<BlogPost>) => Promise<BlogPost>;
  loadDrafts: () => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  
  // 分类操作
  fetchCategories: () => Promise<void>;
  createCategory: (category: Partial<BlogCategory>) => Promise<BlogCategory>;
  updateCategory: (id: string, category: Partial<BlogCategory>) => Promise<BlogCategory>;
  deleteCategory: (id: string) => Promise<void>;
  
  // 标签操作
  fetchTags: () => Promise<void>;
  createTag: (tag: Partial<BlogTag>) => Promise<BlogTag>;
  updateTag: (id: string, tag: Partial<BlogTag>) => Promise<BlogTag>;
  deleteTag: (id: string) => Promise<void>;
  
  // 评论操作
  fetchComments: (postId?: string) => Promise<void>;
  createComment: (comment: Partial<BlogComment>) => Promise<BlogComment>;
  updateComment: (id: string, comment: Partial<BlogComment>) => Promise<BlogComment>;
  deleteComment: (id: string) => Promise<void>;
  approveComment: (id: string) => Promise<void>;
  rejectComment: (id: string) => Promise<void>;
  
  // 搜索操作
  searchPosts: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // 筛选和排序
  setFilter: (filter: Partial<PostFilter>) => void;
  setSort: (sort: Partial<PostSort>) => void;
  resetFilter: () => void;
  
  // 分页操作
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // 统计信息
  fetchStats: () => Promise<void>;
  
  // 批量操作
  batchUpdatePosts: (ids: string[], updates: Partial<BlogPost>) => Promise<void>;
  batchDeletePosts: (ids: string[]) => Promise<void>;
  
  // 缓存管理
  clearCache: () => void;
  refreshCache: () => Promise<void>;
  
  // 错误处理
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 重置状态
  reset: () => void;
}

// ==================== 默认状态 ====================

const initialBlogState: BlogState = {
  posts: [],
  currentPost: null,
  draftPosts: [],
  categories: [],
  tags: [],
  comments: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  },
  filter: {
    status: undefined,
    category: undefined,
    tags: [],
    author: undefined,
    dateRange: undefined,
    featured: undefined
  },
  sort: {
    field: 'createdAt',
    order: 'desc'
  },
  isLoading: false,
  isLoadingPosts: false,
  isLoadingPost: false,
  isLoadingCategories: false,
  isLoadingTags: false,
  isLoadingComments: false,
  isSaving: false,
  isPublishing: false,
  isDeleting: false,
  error: null,
  stats: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  lastFetchTime: 0,
  cacheExpiry: 5 * 60 * 1000 // 5分钟
};

// ==================== 工具函数 ====================

/**
 * 构建查询参数
 */
const buildQueryParams = (filter: PostFilter, sort: PostSort, pagination: { page: number; pageSize: number }) => {
  const params: any = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    sortBy: sort.field,
    sortOrder: sort.order
  };

  if (filter.status) params.status = filter.status;
  if (filter.category) params.category = filter.category;
  if (filter.tags && filter.tags.length > 0) params.tags = filter.tags.join(',');
  if (filter.author) params.author = filter.author;
  if (filter.featured !== undefined) params.featured = filter.featured;
  if (filter.dateRange) {
    params.startDate = filter.dateRange.start;
    params.endDate = filter.dateRange.end;
  }

  return params;
};

/**
 * 检查缓存是否有效
 */
const isCacheValid = (lastFetchTime: number, cacheExpiry: number): boolean => {
  return Date.now() - lastFetchTime < cacheExpiry;
};

/**
 * 更新文章在列表中的位置
 */
const updatePostInList = (posts: BlogPost[], updatedPost: BlogPost): BlogPost[] => {
  const index = posts.findIndex(post => post.id === updatedPost.id);
  if (index !== -1) {
    const newPosts = [...posts];
    newPosts[index] = updatedPost;
    return newPosts;
  }
  return posts;
};

/**
 * 从列表中移除文章
 */
const removePostFromList = (posts: BlogPost[], postId: string): BlogPost[] => {
  return posts.filter(post => post.id !== postId);
};

// ==================== 博客Store ====================

export const useBlogStore = create<BlogState & BlogActions>()()
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialBlogState,

          // 获取文章列表
          fetchPosts: async (params = {}) => {
            try {
              set((state) => {
                state.isLoadingPosts = true;
                state.error = null;
              });

              const currentState = get();
              const queryParams = buildQueryParams(
                { ...currentState.filter, ...params },
                { ...currentState.sort, ...params },
                { 
                  page: params.page || currentState.pagination.current,
                  pageSize: params.pageSize || currentState.pagination.pageSize
                }
              );

              const response = await httpClient.get<PaginatedPosts>(API_ENDPOINTS.BLOG.POSTS, {
                params: queryParams
              });

              if (response.success) {
                set((state) => {
                  state.posts = response.data.posts;
                  state.pagination = {
                    current: response.data.pagination.page,
                    pageSize: response.data.pagination.pageSize,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages
                  };
                  state.lastFetchTime = Date.now();
                  state.isLoadingPosts = false;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to fetch posts';
                state.isLoadingPosts = false;
              });
              throw error;
            }
          },

          // 获取单篇文章
          fetchPost: async (id) => {
            try {
              set((state) => {
                state.isLoadingPost = true;
                state.error = null;
              });

              const response = await httpClient.get<BlogPost>(`${API_ENDPOINTS.BLOG.POSTS}/${id}`);

              if (response.success) {
                set((state) => {
                  state.currentPost = response.data;
                  state.isLoadingPost = false;
                });
                return response.data;
              }
              throw new Error('Failed to fetch post');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to fetch post';
                state.isLoadingPost = false;
              });
              throw error;
            }
          },

          // 创建文章
          createPost: async (postData) => {
            try {
              set((state) => {
                state.isSaving = true;
                state.error = null;
              });

              const response = await httpClient.post<BlogPost>(API_ENDPOINTS.BLOG.POSTS, postData);

              if (response.success) {
                set((state) => {
                  state.posts.unshift(response.data);
                  state.currentPost = response.data;
                  state.pagination.total += 1;
                  state.isSaving = false;
                });

                // 触发文章创建事件
                window.dispatchEvent(new CustomEvent('blog-post-created', {
                  detail: { post: response.data }
                }));

                return response.data;
              }
              throw new Error('Failed to create post');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create post';
                state.isSaving = false;
              });
              throw error;
            }
          },

          // 更新文章
          updatePost: async (id, postData) => {
            try {
              set((state) => {
                state.isSaving = true;
                state.error = null;
              });

              const response = await httpClient.put<BlogPost>(`${API_ENDPOINTS.BLOG.POSTS}/${id}`, postData);

              if (response.success) {
                set((state) => {
                  state.posts = updatePostInList(state.posts, response.data);
                  if (state.currentPost?.id === id) {
                    state.currentPost = response.data;
                  }
                  state.isSaving = false;
                });

                window.dispatchEvent(new CustomEvent('blog-post-updated', {
                  detail: { post: response.data }
                }));

                return response.data;
              }
              throw new Error('Failed to update post');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to update post';
                state.isSaving = false;
              });
              throw error;
            }
          },

          // 删除文章
          deletePost: async (id) => {
            try {
              set((state) => {
                state.isDeleting = true;
                state.error = null;
              });

              await httpClient.delete(`${API_ENDPOINTS.BLOG.POSTS}/${id}`);

              set((state) => {
                state.posts = removePostFromList(state.posts, id);
                if (state.currentPost?.id === id) {
                  state.currentPost = null;
                }
                state.pagination.total = Math.max(0, state.pagination.total - 1);
                state.isDeleting = false;
              });

              window.dispatchEvent(new CustomEvent('blog-post-deleted', {
                detail: { postId: id }
              }));
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete post';
                state.isDeleting = false;
              });
              throw error;
            }
          },

          // 发布文章
          publishPost: async (id) => {
            try {
              set((state) => {
                state.isPublishing = true;
                state.error = null;
              });

              const response = await httpClient.post<BlogPost>(`${API_ENDPOINTS.BLOG.POSTS}/${id}/publish`);

              if (response.success) {
                set((state) => {
                  state.posts = updatePostInList(state.posts, response.data);
                  if (state.currentPost?.id === id) {
                    state.currentPost = response.data;
                  }
                  state.isPublishing = false;
                });

                window.dispatchEvent(new CustomEvent('blog-post-published', {
                  detail: { post: response.data }
                }));
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to publish post';
                state.isPublishing = false;
              });
              throw error;
            }
          },

          // 取消发布文章
          unpublishPost: async (id) => {
            try {
              set((state) => {
                state.isPublishing = true;
                state.error = null;
              });

              const response = await httpClient.post<BlogPost>(`${API_ENDPOINTS.BLOG.POSTS}/${id}/unpublish`);

              if (response.success) {
                set((state) => {
                  state.posts = updatePostInList(state.posts, response.data);
                  if (state.currentPost?.id === id) {
                    state.currentPost = response.data;
                  }
                  state.isPublishing = false;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to unpublish post';
                state.isPublishing = false;
              });
              throw error;
            }
          },

          // 复制文章
          duplicatePost: async (id) => {
            try {
              const response = await httpClient.post<BlogPost>(`${API_ENDPOINTS.BLOG.POSTS}/${id}/duplicate`);

              if (response.success) {
                set((state) => {
                  state.posts.unshift(response.data);
                  state.pagination.total += 1;
                });
                return response.data;
              }
              throw new Error('Failed to duplicate post');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to duplicate post';
              });
              throw error;
            }
          },

          // 保存草稿
          saveDraft: async (postData) => {
            try {
              set((state) => {
                state.isSaving = true;
                state.error = null;
              });

              const response = await httpClient.post<BlogPost>(API_ENDPOINTS.BLOG.DRAFTS, {
                ...postData,
                status: 'draft' as PostStatus
              });

              if (response.success) {
                set((state) => {
                  const existingIndex = state.draftPosts.findIndex(draft => draft.id === response.data.id);
                  if (existingIndex !== -1) {
                    state.draftPosts[existingIndex] = response.data;
                  } else {
                    state.draftPosts.unshift(response.data);
                  }
                  state.isSaving = false;
                });
                return response.data;
              }
              throw new Error('Failed to save draft');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to save draft';
                state.isSaving = false;
              });
              throw error;
            }
          },

          // 加载草稿
          loadDrafts: async () => {
            try {
              const response = await httpClient.get<BlogPost[]>(API_ENDPOINTS.BLOG.DRAFTS);

              if (response.success) {
                set((state) => {
                  state.draftPosts = response.data;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to load drafts';
              });
            }
          },

          // 删除草稿
          deleteDraft: async (id) => {
            try {
              await httpClient.delete(`${API_ENDPOINTS.BLOG.DRAFTS}/${id}`);

              set((state) => {
                state.draftPosts = state.draftPosts.filter(draft => draft.id !== id);
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete draft';
              });
              throw error;
            }
          },

          // 获取分类
          fetchCategories: async () => {
            try {
              set((state) => {
                state.isLoadingCategories = true;
                state.error = null;
              });

              const response = await httpClient.get<BlogCategory[]>(API_ENDPOINTS.BLOG.CATEGORIES);

              if (response.success) {
                set((state) => {
                  state.categories = response.data;
                  state.isLoadingCategories = false;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to fetch categories';
                state.isLoadingCategories = false;
              });
            }
          },

          // 创建分类
          createCategory: async (categoryData) => {
            try {
              const response = await httpClient.post<BlogCategory>(API_ENDPOINTS.BLOG.CATEGORIES, categoryData);

              if (response.success) {
                set((state) => {
                  state.categories.push(response.data);
                });
                return response.data;
              }
              throw new Error('Failed to create category');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create category';
              });
              throw error;
            }
          },

          // 更新分类
          updateCategory: async (id, categoryData) => {
            try {
              const response = await httpClient.put<BlogCategory>(`${API_ENDPOINTS.BLOG.CATEGORIES}/${id}`, categoryData);

              if (response.success) {
                set((state) => {
                  const index = state.categories.findIndex(cat => cat.id === id);
                  if (index !== -1) {
                    state.categories[index] = response.data;
                  }
                });
                return response.data;
              }
              throw new Error('Failed to update category');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to update category';
              });
              throw error;
            }
          },

          // 删除分类
          deleteCategory: async (id) => {
            try {
              await httpClient.delete(`${API_ENDPOINTS.BLOG.CATEGORIES}/${id}`);

              set((state) => {
                state.categories = state.categories.filter(cat => cat.id !== id);
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete category';
              });
              throw error;
            }
          },

          // 获取标签
          fetchTags: async () => {
            try {
              set((state) => {
                state.isLoadingTags = true;
                state.error = null;
              });

              const response = await httpClient.get<BlogTag[]>(API_ENDPOINTS.BLOG.TAGS);

              if (response.success) {
                set((state) => {
                  state.tags = response.data;
                  state.isLoadingTags = false;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to fetch tags';
                state.isLoadingTags = false;
              });
            }
          },

          // 创建标签
          createTag: async (tagData) => {
            try {
              const response = await httpClient.post<BlogTag>(API_ENDPOINTS.BLOG.TAGS, tagData);

              if (response.success) {
                set((state) => {
                  state.tags.push(response.data);
                });
                return response.data;
              }
              throw new Error('Failed to create tag');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create tag';
              });
              throw error;
            }
          },

          // 更新标签
          updateTag: async (id, tagData) => {
            try {
              const response = await httpClient.put<BlogTag>(`${API_ENDPOINTS.BLOG.TAGS}/${id}`, tagData);

              if (response.success) {
                set((state) => {
                  const index = state.tags.findIndex(tag => tag.id === id);
                  if (index !== -1) {
                    state.tags[index] = response.data;
                  }
                });
                return response.data;
              }
              throw new Error('Failed to update tag');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to update tag';
              });
              throw error;
            }
          },

          // 删除标签
          deleteTag: async (id) => {
            try {
              await httpClient.delete(`${API_ENDPOINTS.BLOG.TAGS}/${id}`);

              set((state) => {
                state.tags = state.tags.filter(tag => tag.id !== id);
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete tag';
              });
              throw error;
            }
          },

          // 获取评论
          fetchComments: async (postId) => {
            try {
              set((state) => {
                state.isLoadingComments = true;
                state.error = null;
              });

              const url = postId 
                ? `${API_ENDPOINTS.BLOG.COMMENTS}?postId=${postId}`
                : API_ENDPOINTS.BLOG.COMMENTS;

              const response = await httpClient.get<BlogComment[]>(url);

              if (response.success) {
                set((state) => {
                  state.comments = response.data;
                  state.isLoadingComments = false;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to fetch comments';
                state.isLoadingComments = false;
              });
            }
          },

          // 创建评论
          createComment: async (commentData) => {
            try {
              const response = await httpClient.post<BlogComment>(API_ENDPOINTS.BLOG.COMMENTS, commentData);

              if (response.success) {
                set((state) => {
                  state.comments.push(response.data);
                });
                return response.data;
              }
              throw new Error('Failed to create comment');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create comment';
              });
              throw error;
            }
          },

          // 更新评论
          updateComment: async (id, commentData) => {
            try {
              const response = await httpClient.put<BlogComment>(`${API_ENDPOINTS.BLOG.COMMENTS}/${id}`, commentData);

              if (response.success) {
                set((state) => {
                  const index = state.comments.findIndex(comment => comment.id === id);
                  if (index !== -1) {
                    state.comments[index] = response.data;
                  }
                });
                return response.data;
              }
              throw new Error('Failed to update comment');
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to update comment';
              });
              throw error;
            }
          },

          // 删除评论
          deleteComment: async (id) => {
            try {
              await httpClient.delete(`${API_ENDPOINTS.BLOG.COMMENTS}/${id}`);

              set((state) => {
                state.comments = state.comments.filter(comment => comment.id !== id);
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete comment';
              });
              throw error;
            }
          },

          // 批准评论
          approveComment: async (id) => {
            try {
              const response = await httpClient.post<BlogComment>(`${API_ENDPOINTS.BLOG.COMMENTS}/${id}/approve`);

              if (response.success) {
                set((state) => {
                  const index = state.comments.findIndex(comment => comment.id === id);
                  if (index !== -1) {
                    state.comments[index] = response.data;
                  }
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to approve comment';
              });
              throw error;
            }
          },

          // 拒绝评论
          rejectComment: async (id) => {
            try {
              const response = await httpClient.post<BlogComment>(`${API_ENDPOINTS.BLOG.COMMENTS}/${id}/reject`);

              if (response.success) {
                set((state) => {
                  const index = state.comments.findIndex(comment => comment.id === id);
                  if (index !== -1) {
                    state.comments[index] = response.data;
                  }
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to reject comment';
              });
              throw error;
            }
          },

          // 搜索文章
          searchPosts: async (query) => {
            try {
              set((state) => {
                state.isSearching = true;
                state.searchQuery = query;
                state.error = null;
              });

              const response = await httpClient.get<BlogPost[]>(API_ENDPOINTS.BLOG.SEARCH, {
                params: { q: query }
              });

              if (response.success) {
                set((state) => {
                  state.searchResults = response.data;
                  state.isSearching = false;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Search failed';
                state.isSearching = false;
              });
            }
          },

          // 清除搜索
          clearSearch: () => {
            set((state) => {
              state.searchQuery = '';
              state.searchResults = [];
            });
          },

          // 设置筛选
          setFilter: (filter) => {
            set((state) => {
              state.filter = { ...state.filter, ...filter };
              state.pagination.current = 1; // 重置到第一页
            });
            
            // 自动重新获取数据
            get().fetchPosts();
          },

          // 设置排序
          setSort: (sort) => {
            set((state) => {
              state.sort = { ...state.sort, ...sort };
              state.pagination.current = 1; // 重置到第一页
            });
            
            // 自动重新获取数据
            get().fetchPosts();
          },

          // 重置筛选
          resetFilter: () => {
            set((state) => {
              state.filter = initialBlogState.filter;
              state.sort = initialBlogState.sort;
              state.pagination.current = 1;
            });
            
            get().fetchPosts();
          },

          // 设置页码
          setPage: (page) => {
            set((state) => {
              state.pagination.current = page;
            });
            
            get().fetchPosts({ page });
          },

          // 设置页面大小
          setPageSize: (pageSize) => {
            set((state) => {
              state.pagination.pageSize = pageSize;
              state.pagination.current = 1; // 重置到第一页
            });
            
            get().fetchPosts({ pageSize, page: 1 });
          },

          // 获取统计信息
          fetchStats: async () => {
            try {
              const response = await httpClient.get<BlogStats>(API_ENDPOINTS.BLOG.STATS);

              if (response.success) {
                set((state) => {
                  state.stats = response.data;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to fetch stats';
              });
            }
          },

          // 批量更新文章
          batchUpdatePosts: async (ids, updates) => {
            try {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });

              await httpClient.patch(API_ENDPOINTS.BLOG.BATCH_UPDATE, {
                ids,
                updates
              });

              // 重新获取文章列表
              await get().fetchPosts();

              set((state) => {
                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Batch update failed';
                state.isLoading = false;
              });
              throw error;
            }
          },

          // 批量删除文章
          batchDeletePosts: async (ids) => {
            try {
              set((state) => {
                state.isDeleting = true;
                state.error = null;
              });

              await httpClient.delete(API_ENDPOINTS.BLOG.BATCH_DELETE, {
                data: { ids }
              });

              set((state) => {
                state.posts = state.posts.filter(post => !ids.includes(post.id));
                state.pagination.total = Math.max(0, state.pagination.total - ids.length);
                state.isDeleting = false;
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Batch delete failed';
                state.isDeleting = false;
              });
              throw error;
            }
          },

          // 清除缓存
          clearCache: () => {
            set((state) => {
              state.lastFetchTime = 0;
            });
          },

          // 刷新缓存
          refreshCache: async () => {
            get().clearCache();
            await Promise.all([
              get().fetchPosts(),
              get().fetchCategories(),
              get().fetchTags(),
              get().fetchStats()
            ]);
          },

          // 设置错误
          setError: (error) => {
            set((state) => {
              state.error = error;
            });
          },

          // 清除错误
          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          // 重置状态
          reset: () => {
            set(() => ({ ...initialBlogState }));
          }
        }))
      ),
      {
        name: 'blog-store',
        partialize: (state) => ({
          filter: state.filter,
          sort: state.sort,
          pagination: state.pagination,
          draftPosts: state.draftPosts
        })
      }
    ),
    {
      name: 'blog-store'
    }
  );

// ==================== 导出工具函数 ====================

/**
 * 获取当前文章
 */
export const useCurrentPost = () => {
  return useBlogStore((state) => state.currentPost);
};

/**
 * 获取文章列表
 */
export const usePosts = () => {
  return useBlogStore((state) => state.posts);
};

/**
 * 获取分类列表
 */
export const useCategories = () => {
  return useBlogStore((state) => state.categories);
};

/**
 * 获取标签列表
 */
export const useTags = () => {
  return useBlogStore((state) => state.tags);
};

/**
 * 获取评论列表
 */
export const useComments = () => {
  return useBlogStore((state) => state.comments);
};

/**
 * 获取博客统计
 */
export const useBlogStats = () => {
  return useBlogStore((state) => state.stats);
};

/**
 * 获取加载状态
 */
export const useBlogLoading = () => {
  return useBlogStore((state) => ({
    isLoading: state.isLoading,
    isLoadingPosts: state.isLoadingPosts,
    isLoadingPost: state.isLoadingPost,
    isSaving: state.isSaving,
    isPublishing: state.isPublishing,
    isDeleting: state.isDeleting
  }));
};

/**
 * 获取分页信息
 */
export const usePagination = () => {
  return useBlogStore((state) => state.pagination);
};

/**
 * 获取筛选和排序
 */
export const useFilterAndSort = () => {
  return useBlogStore((state) => ({
    filter: state.filter,
    sort: state.sort
  }));
};

/**
 * 获取搜索状态
 */
export const useSearch = () => {
  return useBlogStore((state) => ({
    query: state.searchQuery,
    results: state.searchResults,
    isSearching: state.isSearching
  }));
};