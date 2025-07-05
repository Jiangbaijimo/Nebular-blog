// 博客状态管理
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { blogAPI } from '../services/api/blog';
import type {
  Blog,
  BlogListParams,
  CreateBlogRequest,
  UpdateBlogRequest,
  Category,
  Tag,
  Comment,
  Draft,
  BlogVersion,
  BlogStats,
  SearchSuggestion,
} from '../types/blog';
import type { PaginatedResponse } from '../types/common';

// 博客状态接口
interface BlogState {
  // 博客列表
  blogs: Blog[];
  currentBlog: Blog | null;
  blogStats: BlogStats | null;
  
  // 分页信息
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // 分类和标签
  categories: Category[];
  tags: Tag[];
  
  // 评论
  comments: Comment[];
  commentsPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // 草稿
  drafts: Draft[];
  currentDraft: Draft | null;
  
  // 版本历史
  versions: BlogVersion[];
  
  // 搜索
  searchResults: Blog[];
  searchSuggestions: SearchSuggestion[];
  searchQuery: string;
  
  // 热门和推荐
  popularBlogs: Blog[];
  recommendedBlogs: Blog[];
  latestBlogs: Blog[];
  
  // 加载状态
  isLoading: boolean;
  isLoadingComments: boolean;
  isLoadingDrafts: boolean;
  isLoadingVersions: boolean;
  
  // 错误状态
  error: string | null;
  
  // 筛选和排序
  filters: {
    categoryId?: string;
    tagId?: string;
    status?: 'published' | 'draft' | 'archived';
    sortBy?: 'createdAt' | 'updatedAt' | 'views' | 'likes';
    sortOrder?: 'asc' | 'desc';
  };
}

// 博客操作接口
interface BlogActions {
  // ==================== 博客CRUD ====================
  getBlogs: (params?: BlogListParams) => Promise<void>;
  getBlogById: (id: string) => Promise<void>;
  createBlog: (blog: CreateBlogRequest) => Promise<Blog>;
  updateBlog: (id: string, blog: UpdateBlogRequest) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  deleteBulkBlogs: (ids: string[]) => Promise<void>;
  
  // ==================== 博客操作 ====================
  publishBlog: (id: string) => Promise<void>;
  unpublishBlog: (id: string) => Promise<void>;
  likeBlog: (id: string) => Promise<void>;
  unlikeBlog: (id: string) => Promise<void>;
  favoriteBlog: (id: string) => Promise<void>;
  unfavoriteBlog: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  
  // ==================== 搜索 ====================
  searchBlogs: (query: string, params?: BlogListParams) => Promise<void>;
  getSearchSuggestions: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // ==================== 分类管理 ====================
  getCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getBlogsByCategory: (categoryId: string, params?: BlogListParams) => Promise<void>;
  
  // ==================== 标签管理 ====================
  getTags: () => Promise<void>;
  createTag: (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTag: (id: string, tag: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getBlogsByTag: (tagId: string, params?: BlogListParams) => Promise<void>;
  getPopularTags: (limit?: number) => Promise<void>;
  
  // ==================== 评论管理 ====================
  getComments: (blogId: string, page?: number, pageSize?: number) => Promise<void>;
  createComment: (blogId: string, content: string, parentId?: string) => Promise<void>;
  updateComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  likeComment: (id: string) => Promise<void>;
  unlikeComment: (id: string) => Promise<void>;
  
  // ==================== 草稿管理 ====================
  getDrafts: (params?: BlogListParams) => Promise<void>;
  getDraftById: (id: string) => Promise<void>;
  createDraft: (draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDraft: (id: string, draft: Partial<Draft>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  publishDraft: (id: string) => Promise<void>;
  
  // ==================== 版本管理 ====================
  getBlogVersions: (blogId: string) => Promise<void>;
  getBlogVersion: (blogId: string, version: number) => Promise<BlogVersion>;
  restoreBlogVersion: (blogId: string, version: number) => Promise<void>;
  
  // ==================== 统计信息 ====================
  getBlogStats: (blogId?: string) => Promise<void>;
  getPopularBlogs: (limit?: number) => Promise<void>;
  getRecommendedBlogs: (limit?: number) => Promise<void>;
  getLatestBlogs: (limit?: number) => Promise<void>;
  
  // ==================== 导入导出 ====================
  exportBlogs: (format: 'json' | 'markdown' | 'html', blogIds?: string[]) => Promise<Blob>;
  importBlogs: (file: File, format: 'json' | 'markdown') => Promise<void>;
  
  // ==================== 状态管理 ====================
  setCurrentBlog: (blog: Blog | null) => void;
  setCurrentDraft: (draft: Draft | null) => void;
  setFilters: (filters: Partial<BlogState['filters']>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // ==================== 分页管理 ====================
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

type BlogStore = BlogState & BlogActions;

// 初始状态
const initialState: BlogState = {
  blogs: [],
  currentBlog: null,
  blogStats: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },
  categories: [],
  tags: [],
  comments: [],
  commentsPagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  drafts: [],
  currentDraft: null,
  versions: [],
  searchResults: [],
  searchSuggestions: [],
  searchQuery: '',
  popularBlogs: [],
  recommendedBlogs: [],
  latestBlogs: [],
  isLoading: false,
  isLoadingComments: false,
  isLoadingDrafts: false,
  isLoadingVersions: false,
  error: null,
  filters: {},
};

// 创建博客store
export const useBlogStore = create<BlogStore>()
  (persist(
    immer((set, get) => ({
      ...initialState,

      // ==================== 博客CRUD ====================
      
      getBlogs: async (params?: BlogListParams) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const currentFilters = get().filters;
          const mergedParams = {
            page: get().pagination.page,
            pageSize: get().pagination.pageSize,
            ...currentFilters,
            ...params,
          };

          const response = await blogAPI.getBlogs(mergedParams);
          
          set((state) => {
            state.blogs = response.data;
            state.pagination = {
              page: response.page,
              pageSize: response.pageSize,
              total: response.total,
              totalPages: response.totalPages,
            };
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getBlogById: async (id: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const blog = await blogAPI.getBlogById(id);
          
          set((state) => {
            state.currentBlog = blog;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      createBlog: async (blog: CreateBlogRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const newBlog = await blogAPI.createBlog(blog);
          
          set((state) => {
            state.blogs.unshift(newBlog);
            state.currentBlog = newBlog;
            state.isLoading = false;
          });
          
          return newBlog;
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      updateBlog: async (id: string, blog: UpdateBlogRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const updatedBlog = await blogAPI.updateBlog(id, blog);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === id);
            if (index !== -1) {
              state.blogs[index] = updatedBlog;
            }
            if (state.currentBlog?.id === id) {
              state.currentBlog = updatedBlog;
            }
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteBlog: async (id: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await blogAPI.deleteBlog(id);
          
          set((state) => {
            state.blogs = state.blogs.filter(b => b.id !== id);
            if (state.currentBlog?.id === id) {
              state.currentBlog = null;
            }
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteBulkBlogs: async (ids: string[]) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await blogAPI.deleteBulkBlogs(ids);
          
          set((state) => {
            state.blogs = state.blogs.filter(b => !ids.includes(b.id));
            if (state.currentBlog && ids.includes(state.currentBlog.id)) {
              state.currentBlog = null;
            }
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 博客操作 ====================
      
      publishBlog: async (id: string) => {
        try {
          const updatedBlog = await blogAPI.publishBlog(id);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === id);
            if (index !== -1) {
              state.blogs[index] = updatedBlog;
            }
            if (state.currentBlog?.id === id) {
              state.currentBlog = updatedBlog;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      unpublishBlog: async (id: string) => {
        try {
          const updatedBlog = await blogAPI.unpublishBlog(id);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === id);
            if (index !== -1) {
              state.blogs[index] = updatedBlog;
            }
            if (state.currentBlog?.id === id) {
              state.currentBlog = updatedBlog;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      likeBlog: async (id: string) => {
        try {
          const updatedBlog = await blogAPI.likeBlog(id);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === id);
            if (index !== -1) {
              state.blogs[index] = updatedBlog;
            }
            if (state.currentBlog?.id === id) {
              state.currentBlog = updatedBlog;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      unlikeBlog: async (id: string) => {
        try {
          const updatedBlog = await blogAPI.unlikeBlog(id);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === id);
            if (index !== -1) {
              state.blogs[index] = updatedBlog;
            }
            if (state.currentBlog?.id === id) {
              state.currentBlog = updatedBlog;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      favoriteBlog: async (id: string) => {
        try {
          const updatedBlog = await blogAPI.favoriteBlog(id);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === id);
            if (index !== -1) {
              state.blogs[index] = updatedBlog;
            }
            if (state.currentBlog?.id === id) {
              state.currentBlog = updatedBlog;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      unfavoriteBlog: async (id: string) => {
        try {
          const updatedBlog = await blogAPI.unfavoriteBlog(id);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === id);
            if (index !== -1) {
              state.blogs[index] = updatedBlog;
            }
            if (state.currentBlog?.id === id) {
              state.currentBlog = updatedBlog;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      incrementViews: async (id: string) => {
        try {
          const updatedBlog = await blogAPI.incrementViews(id);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === id);
            if (index !== -1) {
              state.blogs[index] = updatedBlog;
            }
            if (state.currentBlog?.id === id) {
              state.currentBlog = updatedBlog;
            }
          });
        } catch (error) {
          // 浏览量增加失败不显示错误
          console.warn('Failed to increment views:', error);
        }
      },

      // ==================== 搜索 ====================
      
      searchBlogs: async (query: string, params?: BlogListParams) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.searchQuery = query;
        });

        try {
          const mergedParams = {
            page: 1,
            pageSize: get().pagination.pageSize,
            ...params,
          };

          const response = await blogAPI.searchBlogs(query, mergedParams);
          
          set((state) => {
            state.searchResults = response.data;
            state.pagination = {
              page: response.page,
              pageSize: response.pageSize,
              total: response.total,
              totalPages: response.totalPages,
            };
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getSearchSuggestions: async (query: string) => {
        try {
          const suggestions = await blogAPI.getSearchSuggestions(query);
          
          set((state) => {
            state.searchSuggestions = suggestions;
          });
        } catch (error) {
          console.warn('Failed to get search suggestions:', error);
        }
      },

      clearSearch: () => {
        set((state) => {
          state.searchResults = [];
          state.searchSuggestions = [];
          state.searchQuery = '';
        });
      },

      // ==================== 分类管理 ====================
      
      getCategories: async () => {
        try {
          const categories = await blogAPI.getCategories();
          
          set((state) => {
            state.categories = categories;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      createCategory: async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
          const newCategory = await blogAPI.createCategory(category);
          
          set((state) => {
            state.categories.push(newCategory);
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      updateCategory: async (id: string, category: Partial<Category>) => {
        try {
          const updatedCategory = await blogAPI.updateCategory(id, category);
          
          set((state) => {
            const index = state.categories.findIndex(c => c.id === id);
            if (index !== -1) {
              state.categories[index] = updatedCategory;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteCategory: async (id: string) => {
        try {
          await blogAPI.deleteCategory(id);
          
          set((state) => {
            state.categories = state.categories.filter(c => c.id !== id);
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getBlogsByCategory: async (categoryId: string, params?: BlogListParams) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const mergedParams = {
            page: 1,
            pageSize: get().pagination.pageSize,
            ...params,
          };

          const response = await blogAPI.getBlogsByCategory(categoryId, mergedParams);
          
          set((state) => {
            state.blogs = response.data;
            state.pagination = {
              page: response.page,
              pageSize: response.pageSize,
              total: response.total,
              totalPages: response.totalPages,
            };
            state.filters.categoryId = categoryId;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 标签管理 ====================
      
      getTags: async () => {
        try {
          const tags = await blogAPI.getTags();
          
          set((state) => {
            state.tags = tags;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      createTag: async (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
          const newTag = await blogAPI.createTag(tag);
          
          set((state) => {
            state.tags.push(newTag);
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      updateTag: async (id: string, tag: Partial<Tag>) => {
        try {
          const updatedTag = await blogAPI.updateTag(id, tag);
          
          set((state) => {
            const index = state.tags.findIndex(t => t.id === id);
            if (index !== -1) {
              state.tags[index] = updatedTag;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteTag: async (id: string) => {
        try {
          await blogAPI.deleteTag(id);
          
          set((state) => {
            state.tags = state.tags.filter(t => t.id !== id);
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getBlogsByTag: async (tagId: string, params?: BlogListParams) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const mergedParams = {
            page: 1,
            pageSize: get().pagination.pageSize,
            ...params,
          };

          const response = await blogAPI.getBlogsByTag(tagId, mergedParams);
          
          set((state) => {
            state.blogs = response.data;
            state.pagination = {
              page: response.page,
              pageSize: response.pageSize,
              total: response.total,
              totalPages: response.totalPages,
            };
            state.filters.tagId = tagId;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getPopularTags: async (limit = 20) => {
        try {
          const tags = await blogAPI.getPopularTags(limit);
          
          set((state) => {
            state.tags = tags;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 评论管理 ====================
      
      getComments: async (blogId: string, page = 1, pageSize = 20) => {
        set((state) => {
          state.isLoadingComments = true;
          state.error = null;
        });

        try {
          const response = await blogAPI.getComments(blogId, { page, pageSize });
          
          set((state) => {
            state.comments = response.data;
            state.commentsPagination = {
              page: response.page,
              pageSize: response.pageSize,
              total: response.total,
              totalPages: response.totalPages,
            };
            state.isLoadingComments = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoadingComments = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      createComment: async (blogId: string, content: string, parentId?: string) => {
        try {
          const newComment = await blogAPI.createComment(blogId, { content, parentId });
          
          set((state) => {
            state.comments.unshift(newComment);
            state.commentsPagination.total += 1;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      updateComment: async (id: string, content: string) => {
        try {
          const updatedComment = await blogAPI.updateComment(id, { content });
          
          set((state) => {
            const index = state.comments.findIndex(c => c.id === id);
            if (index !== -1) {
              state.comments[index] = updatedComment;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteComment: async (id: string) => {
        try {
          await blogAPI.deleteComment(id);
          
          set((state) => {
            state.comments = state.comments.filter(c => c.id !== id);
            state.commentsPagination.total -= 1;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      likeComment: async (id: string) => {
        try {
          const updatedComment = await blogAPI.likeComment(id);
          
          set((state) => {
            const index = state.comments.findIndex(c => c.id === id);
            if (index !== -1) {
              state.comments[index] = updatedComment;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      unlikeComment: async (id: string) => {
        try {
          const updatedComment = await blogAPI.unlikeComment(id);
          
          set((state) => {
            const index = state.comments.findIndex(c => c.id === id);
            if (index !== -1) {
              state.comments[index] = updatedComment;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 草稿管理 ====================
      
      getDrafts: async (params?: BlogListParams) => {
        set((state) => {
          state.isLoadingDrafts = true;
          state.error = null;
        });

        try {
          const mergedParams = {
            page: 1,
            pageSize: 20,
            ...params,
          };

          const response = await blogAPI.getDrafts(mergedParams);
          
          set((state) => {
            state.drafts = response.data;
            state.isLoadingDrafts = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoadingDrafts = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getDraftById: async (id: string) => {
        set((state) => {
          state.isLoadingDrafts = true;
          state.error = null;
        });

        try {
          const draft = await blogAPI.getDraftById(id);
          
          set((state) => {
            state.currentDraft = draft;
            state.isLoadingDrafts = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoadingDrafts = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      createDraft: async (draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
          const newDraft = await blogAPI.createDraft(draft);
          
          set((state) => {
            state.drafts.unshift(newDraft);
            state.currentDraft = newDraft;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      updateDraft: async (id: string, draft: Partial<Draft>) => {
        try {
          const updatedDraft = await blogAPI.updateDraft(id, draft);
          
          set((state) => {
            const index = state.drafts.findIndex(d => d.id === id);
            if (index !== -1) {
              state.drafts[index] = updatedDraft;
            }
            if (state.currentDraft?.id === id) {
              state.currentDraft = updatedDraft;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      deleteDraft: async (id: string) => {
        try {
          await blogAPI.deleteDraft(id);
          
          set((state) => {
            state.drafts = state.drafts.filter(d => d.id !== id);
            if (state.currentDraft?.id === id) {
              state.currentDraft = null;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      publishDraft: async (id: string) => {
        try {
          const publishedBlog = await blogAPI.publishDraft(id);
          
          set((state) => {
            // 从草稿列表中移除
            state.drafts = state.drafts.filter(d => d.id !== id);
            if (state.currentDraft?.id === id) {
              state.currentDraft = null;
            }
            
            // 添加到博客列表
            state.blogs.unshift(publishedBlog);
            state.currentBlog = publishedBlog;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 版本管理 ====================
      
      getBlogVersions: async (blogId: string) => {
        set((state) => {
          state.isLoadingVersions = true;
          state.error = null;
        });

        try {
          const versions = await blogAPI.getBlogVersions(blogId);
          
          set((state) => {
            state.versions = versions;
            state.isLoadingVersions = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoadingVersions = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getBlogVersion: async (blogId: string, version: number) => {
        const versionData = await blogAPI.getBlogVersion(blogId, version);
        return versionData;
      },

      restoreBlogVersion: async (blogId: string, version: number) => {
        try {
          const restoredBlog = await blogAPI.restoreBlogVersion(blogId, version);
          
          set((state) => {
            const index = state.blogs.findIndex(b => b.id === blogId);
            if (index !== -1) {
              state.blogs[index] = restoredBlog;
            }
            if (state.currentBlog?.id === blogId) {
              state.currentBlog = restoredBlog;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 统计信息 ====================
      
      getBlogStats: async (blogId?: string) => {
        try {
          const stats = await blogAPI.getBlogStats(blogId);
          
          set((state) => {
            state.blogStats = stats;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getPopularBlogs: async (limit = 10) => {
        try {
          const blogs = await blogAPI.getPopularBlogs(limit);
          
          set((state) => {
            state.popularBlogs = blogs;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getRecommendedBlogs: async (limit = 10) => {
        try {
          const blogs = await blogAPI.getRecommendedBlogs(limit);
          
          set((state) => {
            state.recommendedBlogs = blogs;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      getLatestBlogs: async (limit = 10) => {
        try {
          const blogs = await blogAPI.getLatestBlogs(limit);
          
          set((state) => {
            state.latestBlogs = blogs;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 导入导出 ====================
      
      exportBlogs: async (format: 'json' | 'markdown' | 'html', blogIds?: string[]) => {
        const blob = await blogAPI.exportBlogs(format, blogIds);
        return blob;
      },

      importBlogs: async (file: File, format: 'json' | 'markdown') => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await blogAPI.importBlogs(file, format);
          
          // 重新获取博客列表
          await get().getBlogs();
          
          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = (error as Error).message;
          });
          throw error;
        }
      },

      // ==================== 状态管理 ====================
      
      setCurrentBlog: (blog: Blog | null) => {
        set((state) => {
          state.currentBlog = blog;
        });
      },

      setCurrentDraft: (draft: Draft | null) => {
        set((state) => {
          state.currentDraft = draft;
        });
      },

      setFilters: (filters: Partial<BlogState['filters']>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      clearFilters: () => {
        set((state) => {
          state.filters = {};
        });
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      reset: () => {
        set(() => ({ ...initialState }));
      },

      // ==================== 分页管理 ====================
      
      setPage: (page: number) => {
        set((state) => {
          state.pagination.page = page;
        });
      },

      setPageSize: (pageSize: number) => {
        set((state) => {
          state.pagination.pageSize = pageSize;
          state.pagination.page = 1; // 重置到第一页
        });
      },

      nextPage: () => {
        const { page, totalPages } = get().pagination;
        if (page < totalPages) {
          set((state) => {
            state.pagination.page = page + 1;
          });
        }
      },

      prevPage: () => {
        const { page } = get().pagination;
        if (page > 1) {
          set((state) => {
            state.pagination.page = page - 1;
          });
        }
      },
    })),
    {
      name: 'blog-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        filters: state.filters,
        pagination: {
          pageSize: state.pagination.pageSize,
        },
      }),
    }
  ));

export default useBlogStore;