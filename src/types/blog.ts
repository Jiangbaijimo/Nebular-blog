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