// 通用类型定义

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimestampEntity {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

export interface SortOption {
  label: string;
  value: string;
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
  count?: number;
}

export interface FilterGroup {
  name: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'boolean';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  progress?: number;
}

export interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
}

export interface NotificationConfig {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

export interface ToastConfig extends NotificationConfig {
  id: string;
  createdAt: Date;
  dismissed?: boolean;
}

export interface ModalConfig {
  id: string;
  title?: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  centered?: boolean;
  footer?: React.ReactNode;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ConfirmConfig {
  title: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: SelectOption[];
  validation?: ValidationRule[];
  disabled?: boolean;
  hidden?: boolean;
  description?: string;
}

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  DATETIME = 'datetime',
  FILE = 'file',
  IMAGE = 'image',
  RICH_TEXT = 'rich_text'
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  group?: string;
}

export interface ValidationRule {
  type: ValidationType;
  message: string;
  value?: any;
  pattern?: RegExp;
  validator?: (value: any) => boolean | Promise<boolean>;
}

export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  MIN = 'min',
  MAX = 'max',
  PATTERN = 'pattern',
  EMAIL = 'email',
  URL = 'url',
  CUSTOM = 'custom'
}

export interface FormErrors {
  [fieldName: string]: string[];
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  global?: boolean;
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  disabled?: boolean;
  hidden?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
  icon?: string;
  disabled?: boolean;
  closable?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number | string;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableConfig<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationParams;
  selection?: {
    type: 'checkbox' | 'radio';
    selectedKeys: string[];
    onChange: (selectedKeys: string[]) => void;
  };
  expandable?: {
    expandedRowKeys: string[];
    onExpand: (expanded: boolean, record: T) => void;
    expandedRowRender: (record: T) => React.ReactNode;
  };
}

export interface DragDropConfig {
  accept?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onDrop: (files: File[]) => void;
  onError?: (error: string) => void;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: Size;
  colorDepth: number;
  pixelRatio: number;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  bundleSize?: number;
  cacheHitRate?: number;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  category?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: FeatureFlagCondition[];
}

export interface FeatureFlagCondition {
  type: 'user' | 'group' | 'date' | 'custom';
  operator: 'equals' | 'contains' | 'greater' | 'less';
  value: any;
}

export interface ExportConfig {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  filename?: string;
  fields?: string[];
  filters?: Record<string, any>;
}

export interface ImportConfig {
  format: 'json' | 'csv' | 'xlsx';
  file: File;
  mapping?: Record<string, string>;
  skipErrors?: boolean;
  preview?: boolean;
}