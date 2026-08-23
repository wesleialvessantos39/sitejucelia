// /src/types/backup.ts

export type BackupStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'file_missing'
  | 'verification_required'
  | 'deleted'
  | 'restoring'
  | 'restored';

export type BackupType = 'manual' | 'scheduled';

export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export type BackupStorageProvider = 'google_drive' | 'local_export';

export type BackupIntegrityStatus = 'valid' | 'invalid' | 'unknown' | 'unverified';

export interface SystemBackupMetadata {
  tables_included?: string[];
  total_records?: number;
  database_version?: string;
  app_version?: string;
  storage_buckets_included?: string[];
  include_photos?: boolean;
  include_videos?: boolean;
  include_documents?: boolean;
  photos_count?: number;
  videos_count?: number;
  documents_count?: number;
  total_storage_files?: number;
  total_storage_bytes?: number;
  sha256_checksum?: string;
  manifest_checksum?: string;
  format_version?: string;
  source_environment?: string;
  destination_folder_id?: string;
  destination_folder_name?: string;
  google_drive_file_id?: string;
  google_drive_view_link?: string;
  execution_duration_ms?: number;
  last_verified_at?: string;
  last_verified_status?: 'present' | 'missing' | 'trashed' | 'error';
  last_verified_message?: string;
  integrity_status?: BackupIntegrityStatus;
  integrity_verified_at?: string;
  remote_file_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deleted_by_email?: string;
  client_ip?: string;
  user_agent?: string;
  scheduled_trigger?: {
    frequency?: BackupFrequency;
    configured_time?: string;
    timezone?: string;
    day_of_week?: number;
    day_of_month?: number;
    attempt?: number;
  };
  [key: string]: any;
}

export interface SystemBackup {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  backup_name: string;
  backup_type: BackupType;
  status: BackupStatus;
  file_id: string | null;
  file_name: string | null;
  file_size: number | null;
  storage_provider: BackupStorageProvider;
  metadata: SystemBackupMetadata;
  error_message: string | null;
  completed_at: string | null;
  idempotency_key?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  last_verified_at?: string | null;
  // Join com profiles
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    role: string;
  } | null;
}

export interface CreateBackupInput {
  backup_name: string;
  backup_type?: BackupType;
  storage_provider?: BackupStorageProvider;
  metadata?: SystemBackupMetadata;
  idempotency_key?: string;
}

export interface UpdateBackupInput {
  status?: BackupStatus;
  file_id?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  metadata?: SystemBackupMetadata;
  error_message?: string | null;
  completed_at?: string | null;
}

export type GoogleDriveConnectionStatus = 'connected' | 'disconnected' | 'reconnect_required' | 'attention' | 'error';

export interface GoogleDriveConnection {
  id: string;
  provider: 'google_drive';
  connected_by: string | null;
  connected_by_email?: string | null;
  account_email: string;
  drive_folder_id: string | null;
  drive_folder_name: string;
  is_active: boolean;
  status: GoogleDriveConnectionStatus;
  last_verified_at: string | null;
  connected_at: string;
  updated_at: string;
}

export interface BackupSettings {
  enabled: boolean;
  provider: BackupStorageProvider;
  retention_days: number;
  scheduled_enabled: boolean;
  schedule_frequency: BackupFrequency;
  schedule_time: string; // 'HH:MM' (ex: '02:00')
  schedule_timezone: string; // ex: 'America/Sao_Paulo'
  schedule_day_of_week: number; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  schedule_day_of_month: number; // 1 a 28/31
  last_scheduled_backup_at: string | null;
  next_scheduled_backup_at: string | null;
  last_scheduled_status: 'completed' | 'failed' | 'skipped' | 'none' | null;
  last_scheduled_duration_ms?: number;
  last_scheduled_error?: string | null;
  last_backup_at: string | null;
  next_backup_at: string | null;
  google_drive_connected: boolean;
  google_drive_folder_id: string | null;
  google_drive_folder_name: string;
  google_drive_account_email?: string | null;
  google_drive_connected_by?: string | null;
  google_drive_connected_by_email?: string | null;
  google_drive_connected_at?: string | null;
  google_drive_last_verified_at?: string | null;
  google_drive_status?: GoogleDriveConnectionStatus;
  google_drive_error?: string | null;
}

export type RestoreProgressStep =
  | 'validating'
  | 'checking_version'
  | 'creating_safety_backup'
  | 'downloading_package'
  | 'extracting_manifest'
  | 'validating_checksums'
  | 'restoring_database'
  | 'restoring_storage'
  | 'post_validating'
  | 'completed'
  | 'failed';

export interface RestoreProgressInfo {
  step: RestoreProgressStep;
  message: string;
  detail?: string;
  percent?: number;
  currentTable?: string;
  currentBucket?: string;
  tablesRestored?: number;
  totalTables?: number;
  filesRestored?: number;
  totalFiles?: number;
}

export type RestoreProgressCallback = (info: RestoreProgressInfo) => void;

export interface RestoreResult {
  success: boolean;
  restoredBackupId: string;
  preRestoreBackupId: string | null;
  preRestoreBackupName: string | null;
  totalTablesRestored: number;
  totalRecordsRestored: number;
  totalStorageFilesRestored: number;
  totalPhotosRestored?: number;
  totalVideosRestored?: number;
  executionDurationMs: number;
  completedAt: string;
  error?: string;
}

export interface ExecuteBackupOptions {
  adminId: string;
  adminEmail: string;
  adminName?: string;
  includePhotos?: boolean;
  includeVideos?: boolean;
  includeDocuments?: boolean;
  onProgress?: (info: any) => void;
}

export interface ExecuteRestoreOptions {
  backupId: string;
  adminId: string;
  adminEmail: string;
  adminName?: string;
  restorePhotos?: boolean;
  restoreVideos?: boolean;
  restoreDocuments?: boolean;
  onProgress?: RestoreProgressCallback;
}

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  enabled: true,
  provider: 'google_drive',
  retention_days: 30,
  scheduled_enabled: false,
  schedule_frequency: 'daily',
  schedule_time: '02:00',
  schedule_timezone: 'America/Sao_Paulo',
  schedule_day_of_week: 0, // Domingo
  schedule_day_of_month: 1, // Dia 1
  last_scheduled_backup_at: null,
  next_scheduled_backup_at: null,
  last_scheduled_status: 'none',
  last_scheduled_duration_ms: 0,
  last_scheduled_error: null,
  last_backup_at: null,
  next_backup_at: null,
  google_drive_connected: false,
  google_drive_folder_id: null,
  google_drive_folder_name: 'Jucélia Santana Engenharia Civil — Backups',
  google_drive_account_email: null,
  google_drive_connected_by: null,
  google_drive_connected_by_email: null,
  google_drive_connected_at: null,
  google_drive_last_verified_at: null,
  google_drive_status: 'disconnected',
  google_drive_error: null,
};
