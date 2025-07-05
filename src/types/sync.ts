// 同步相关类型定义

export interface SyncState {
  status: SyncStatus;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  isAutoSyncEnabled: boolean;
  conflictCount: number;
  pendingChanges: number;
  syncProgress?: SyncProgress;
  error?: SyncError;
}

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  CONFLICT = 'conflict',
  ERROR = 'error',
  OFFLINE = 'offline',
  PAUSED = 'paused'
}

export interface SyncProgress {
  phase: SyncPhase;
  current: number;
  total: number;
  percentage: number;
  message: string;
  startedAt: Date;
  estimatedTimeRemaining?: number;
}

export enum SyncPhase {
  PREPARING = 'preparing',
  UPLOADING = 'uploading',
  DOWNLOADING = 'downloading',
  RESOLVING_CONFLICTS = 'resolving-conflicts',
  FINALIZING = 'finalizing'
}

export interface SyncError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
  retryCount: number;
}

export interface SyncConflict {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  localVersion: any;
  remoteVersion: any;
  conflictType: ConflictType;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: ConflictResolution;
}

export enum ResourceType {
  POST = 'post',
  CATEGORY = 'category',
  TAG = 'tag',
  COMMENT = 'comment',
  USER = 'user',
  MEDIA = 'media',
  SETTINGS = 'settings'
}

export enum ConflictType {
  CONTENT_CONFLICT = 'content-conflict',
  DELETE_CONFLICT = 'delete-conflict',
  METADATA_CONFLICT = 'metadata-conflict',
  PERMISSION_CONFLICT = 'permission-conflict'
}

export interface ConflictResolution {
  strategy: ResolutionStrategy;
  resolvedBy: string;
  resolvedAt: Date;
  mergedData?: any;
  notes?: string;
}

export enum ResolutionStrategy {
  USE_LOCAL = 'use-local',
  USE_REMOTE = 'use-remote',
  MERGE = 'merge',
  MANUAL = 'manual'
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
  enableConflictResolution: boolean;
  defaultResolutionStrategy: ResolutionStrategy;
  syncOnStartup: boolean;
  syncOnNetworkReconnect: boolean;
  enableOfflineMode: boolean;
}

export interface SyncOperation {
  id: string;
  type: OperationType;
  resourceType: ResourceType;
  resourceId: string;
  data: any;
  status: OperationStatus;
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
  error?: string;
  dependencies?: string[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RESTORE = 'restore'
}

export enum OperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface SyncQueue {
  operations: SyncOperation[];
  isProcessing: boolean;
  maxConcurrentOperations: number;
  activeOperations: number;
}

export interface OfflineChange {
  id: string;
  operation: SyncOperation;
  timestamp: Date;
  deviceId: string;
  userId: string;
  synced: boolean;
}

export interface SyncStats {
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  conflictsResolved: number;
  lastSyncDuration: number; // milliseconds
  averageSyncDuration: number; // milliseconds
  dataTransferred: number; // bytes
  syncFrequency: number; // syncs per day
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: ConnectionType;
  effectiveType: EffectiveConnectionType;
  downlink: number; // Mbps
  rtt: number; // milliseconds
  saveData: boolean;
}

export enum ConnectionType {
  BLUETOOTH = 'bluetooth',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  NONE = 'none',
  WIFI = 'wifi',
  WIMAX = 'wimax',
  OTHER = 'other',
  UNKNOWN = 'unknown'
}

export enum EffectiveConnectionType {
  SLOW_2G = 'slow-2g',
  TWO_G = '2g',
  THREE_G = '3g',
  FOUR_G = '4g'
}

export interface SyncEvent {
  type: SyncEventType;
  data?: any;
  timestamp: Date;
}

export enum SyncEventType {
  SYNC_STARTED = 'sync-started',
  SYNC_COMPLETED = 'sync-completed',
  SYNC_FAILED = 'sync-failed',
  SYNC_PAUSED = 'sync-paused',
  SYNC_RESUMED = 'sync-resumed',
  CONFLICT_DETECTED = 'conflict-detected',
  CONFLICT_RESOLVED = 'conflict-resolved',
  NETWORK_STATUS_CHANGED = 'network-status-changed',
  OFFLINE_CHANGES_DETECTED = 'offline-changes-detected'
}

export interface BackupConfig {
  enabled: boolean;
  frequency: BackupFrequency;
  retentionDays: number;
  includeMedia: boolean;
  compression: boolean;
  encryption: boolean;
  destination: BackupDestination;
}

export enum BackupFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  MANUAL = 'manual'
}

export interface BackupDestination {
  type: 'local' | 'cloud';
  path?: string;
  cloudProvider?: CloudProvider;
  credentials?: Record<string, string>;
}

export interface Backup {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
  type: 'full' | 'incremental';
  status: 'creating' | 'completed' | 'failed';
  checksum: string;
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  version: string;
  postsCount: number;
  mediaCount: number;
  categoriesCount: number;
  tagsCount: number;
  commentsCount: number;
  usersCount: number;
}