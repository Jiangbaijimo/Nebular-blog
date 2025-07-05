// 博客文章相关类型定义

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  categories: string[];
  status: PostStatus;
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
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  categoriesCount: number;
  tagsCount: number;
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
  order: 'asc' | 'desc';
}

export interface PaginatedPosts {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API 请求和响应类型
export interface BlogListParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  tag?: string;
  search?: string;
  authorId?: string;
}

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