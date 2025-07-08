// 博客文章相关类型定义

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  categories: string[];
  status: PostStatus | BlogStatus; // 兼容两种状态类型
  published?: boolean; // 添加published字段以兼容组件
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLocal: boolean;
  syncStatus: SyncStatus;
  metadata?: PostMetadata;
}

export interface PostMetadata {
  readingTime: number; // 预计阅读时间（分钟）
  wordCount: number;
  lastEditedBy?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  customFields?: Record<string, any>;
}

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled'
}

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
  ERROR = 'error',
  LOCAL_ONLY = 'local_only'
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  parentId?: string;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  postCount: number;
  createdAt: Date;
}

export interface BlogComment {
  id: string;
  postId: string;
  authorId?: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  content: string;
  parentId?: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  replies?: BlogComment[];
}

export enum CommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SPAM = 'spam'
}

export interface BlogStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  archivedBlogs: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  categoriesCount: number;
  tagsCount: number;
  // 兼容性字段
  totalPosts?: number;
  publishedPosts?: number;
  draftPosts?: number;
}

export interface PostFilter {
  status?: PostStatus[];
  categories?: string[];
  tags?: string[];
  authorId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface PostSort {
  field: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'viewCount' | 'likeCount';
  order: 'ASC' | 'DESC';
}

export interface PaginatedPosts {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API 请求和响应类型（已移动到文件末尾，避免重复定义）

export interface BlogListResponse {
  data: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlogCreateRequest {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  categories?: string[];
  status?: PostStatus;
  publishedAt?: Date;
  metadata?: PostMetadata;
}

export interface BlogUpdateRequest extends Partial<BlogCreateRequest> {
  id: string;
}

export interface BlogSearchParams {
  query: string;
  filters?: {
    categories?: string[];
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  page?: number;
  limit?: number;
}

export interface BlogSearchResponse {
  results: BlogPost[];
  total: number;
  page: number;
  limit: number;
  suggestions?: string[];
}

export interface CommentCreateRequest {
  postId: string;
  content: string;
  parentId?: string;
  authorName: string;
  authorEmail?: string;
}

export interface CommentUpdateRequest {
  content: string;
  status?: CommentStatus;
}

// 简化的博客类型定义（用于前端展示）
export interface SimpleBlogPost {
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

export interface SimpleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  color?: string;
}

export interface SimpleTag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  color?: string;
}

export interface BlogDraft {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  categories?: string[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: PostMetadata;
}

export interface BlogVersion {
  id: string;
  blogId: string;
  version: number;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  categories?: string[];
  createdAt: Date;
  createdBy: string;
  changeLog?: string;
}

// 重新导出为 Blog 类型（兼容性）
export type Blog = BlogPost;

// 导出所有状态枚举的字符串联合类型
export type PostStatusString = keyof typeof PostStatus;
export type SyncStatusString = keyof typeof SyncStatus;
export type CommentStatusString = keyof typeof CommentStatus;

// 博客状态类型（用于组件）
export type BlogStatus = 'published' | 'draft' | 'archived' | 'scheduled';

// 博客列表查询参数（扩展版本）
export interface BlogListParams {
  page?: number;
  limit?: number;
  status?: BlogStatus | '';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  categoryId?: string;
  tag?: string;
  search?: string;
  authorId?: string;
}