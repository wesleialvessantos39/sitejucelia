// /src/services/backupService.ts
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type {
  SystemBackup,
  BackupStatus,
  BackupType,
  CreateBackupInput,
  UpdateBackupInput,
  BackupSettings,
} from '../types/backup';
import { DEFAULT_BACKUP_SETTINGS } from '../types/backup';
import { supabaseDatabase, type SystemBackupUpdate } from './supabaseDatabase';

export interface GetBackupsOptions {
  limit?: number;
  offset?: number;
  status?: BackupStatus | 'all';
  backup_type?: BackupType | 'all';
  search?: string;
  sortBy?: 'created_at' | 'backup_name' | 'file_size' | 'status';
  sortOrder?: 'asc' | 'desc';
  period?: 'all' | '7d' | '30d' | 'this_month';
  includeDeleted?: boolean;
}

export interface BackupMetrics {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  missingBackups: number;
  manualBackups: number;
  scheduledBackups: number;
  totalSizeBytes: number;
  latestValidBackup: SystemBackup | null;
  lastBackupAt: string | null;
}

/**
 * Service de Gerenciamento de Backups e Infraestrutura (Supabase & Google Drive)
 * Preparado na Etapa 20.1 (Estrutura, RLS, Auditoria e Controle de Estado)
 */
export const backupService = {
  /**
   * Consulta a lista de backups com dados de perfil do criador
   */
  async getBackups(options?: GetBackupsOptions): Promise<SystemBackup[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const sortField = options?.sortBy || 'created_at';
      const sortAsc = options?.sortOrder === 'asc';

      let query = supabase
        .from('system_backups')
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
            email,
            avatar_url,
            role
          )
        `)
        .order(sortField, { ascending: sortAsc });

      // Filtro de status
      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      // Filtro de tipo
      if (options?.backup_type && options.backup_type !== 'all') {
        query = query.eq('backup_type', options.backup_type);
      }

      // Filtro de exclusão lógica (por padrão não traz backups marcados como deleted)
      if (!options?.includeDeleted && (!options?.status || options.status !== 'deleted')) {
        query = query.neq('status', 'deleted');
      }

      // Filtro de período
      if (options?.period && options.period !== 'all') {
        const now = new Date();
        if (options.period === '7d') {
          const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', past);
        } else if (options.period === '30d') {
          const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', past);
        } else if (options.period === 'this_month') {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          query = query.gte('created_at', firstDay);
        }
      }

      // Pesquisa por texto no nome, arquivo ou ID
      if (options?.search && options.search.trim()) {
        const term = `%${options.search.trim()}%`;
        query = query.or(`backup_name.ilike.${term},file_name.ilike.${term},id.ilike.${term}`);
      }

      if (options?.limit && options.limit > 0) {
        if (options.offset && options.offset > 0) {
          query = query.range(options.offset, options.offset + options.limit - 1);
        } else {
          query = query.limit(options.limit);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[backupService] Aviso ao consultar lista de backups:', error.message || error);
        return [];
      }

      return (data || []) as SystemBackup[];
    } catch (err) {
      console.error('[backupService] Erro inesperado ao consultar backups:', err);
      return [];
    }
  },

  /**
   * Calcula métricas agregadas da base de backups
   */
  async getBackupMetrics(): Promise<BackupMetrics> {
    if (!isSupabaseConfigured) {
      return {
        totalBackups: 0,
        completedBackups: 0,
        failedBackups: 0,
        missingBackups: 0,
        manualBackups: 0,
        scheduledBackups: 0,
        totalSizeBytes: 0,
        latestValidBackup: null,
        lastBackupAt: null,
      };
    }

    try {
      const allBackups = await this.getBackups({ includeDeleted: false });

      let completedCount = 0;
      let failedCount = 0;
      let missingCount = 0;
      let manualCount = 0;
      let scheduledCount = 0;
      let totalBytes = 0;
      let latestValid: SystemBackup | null = null;

      for (const b of allBackups) {
        if (b.status === 'completed') {
          completedCount++;
          if (b.file_size) totalBytes += Number(b.file_size);
          if (!latestValid) {
            latestValid = b;
          }
        } else if (b.status === 'failed') {
          failedCount++;
        } else if (b.status === 'file_missing') {
          missingCount++;
        }

        if (b.backup_type === 'manual') manualCount++;
        else if (b.backup_type === 'scheduled') scheduledCount++;
      }

      return {
        totalBackups: allBackups.length,
        completedBackups: completedCount,
        failedBackups: failedCount,
        missingBackups: missingCount,
        manualBackups: manualCount,
        scheduledBackups: scheduledCount,
        totalSizeBytes: totalBytes,
        latestValidBackup: latestValid,
        lastBackupAt: latestValid?.completed_at || latestValid?.created_at || null,
      };
    } catch (err) {
      console.error('[backupService] Erro ao calcular métricas de backup:', err);
      return {
        totalBackups: 0,
        completedBackups: 0,
        failedBackups: 0,
        missingBackups: 0,
        manualBackups: 0,
        scheduledBackups: 0,
        totalSizeBytes: 0,
        latestValidBackup: null,
        lastBackupAt: null,
      };
    }
  },

  /**
   * Consulta um backup específico pelo ID
   */
  async getBackupById(id: string): Promise<SystemBackup | null> {
    if (!isSupabaseConfigured || !id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('system_backups')
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
            email,
            avatar_url,
            role
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.warn('[backupService] Backup não localizado por ID:', id, error.message || error);
        return null;
      }

      return data as SystemBackup;
    } catch (err) {
      console.error('[backupService] Erro ao buscar backup por ID:', err);
      return null;
    }
  },

  /**
   * Registra uma nova operação ou intenção de backup no banco com proteção de idempotência
   */
  async createBackupRecord(
    input: CreateBackupInput,
    userId?: string,
    userEmail?: string
  ): Promise<SystemBackup> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    const idempotencyKey = input.idempotency_key || `backup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Checagem de idempotência para evitar registros duplicados em caso de duplo clique
    if (input.idempotency_key) {
      const { data: existing } = await supabase
        .from('system_backups')
        .select('id')
        .eq('idempotency_key', input.idempotency_key)
        .maybeSingle();

      if (existing) {
        const full = await this.getBackupById(existing.id);
        if (full) return full;
      }
    }

    const newRecord = {
      created_by: userId || null,
      backup_name: input.backup_name.trim(),
      backup_type: input.backup_type || 'manual',
      status: 'pending' as BackupStatus,
      storage_provider: input.storage_provider || 'google_drive',
      metadata: input.metadata || {},
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('system_backups')
      .insert(newRecord)
      .select(`
        *,
        profiles:created_by (
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `)
      .single();

    if (error || !data) {
      console.error('[backupService] Erro ao criar registro de backup:', error);
      throw new Error(error?.message || 'Falha ao registrar novo backup no banco.');
    }

    const createdBackup = data as SystemBackup;

    // Registra auditoria administrativa
    await supabaseDatabase.logAdminAction({
      user_id: userId || null,
      user_email: userEmail || null,
      action: 'BACKUP_CREATED',
      entity_type: 'system_backups',
      entity_id: createdBackup.id,
      details: {
        backup_name: createdBackup.backup_name,
        backup_type: createdBackup.backup_type,
        storage_provider: createdBackup.storage_provider,
        idempotency_key: idempotencyKey,
      },
    });

    return createdBackup;
  },

  /**
   * Atualiza o status e metadados de um backup
   */
  async updateBackupStatus(
    id: string,
    status: BackupStatus,
    updates?: UpdateBackupInput,
    userId?: string,
    userEmail?: string
  ): Promise<SystemBackup> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    const now = new Date().toISOString();
    const updatePayload: SystemBackupUpdate = {
      status,
      updated_at: now,
    };

    if (updates?.file_id !== undefined) updatePayload.file_id = updates.file_id;
    if (updates?.file_name !== undefined) updatePayload.file_name = updates.file_name;
    if (updates?.file_size !== undefined) updatePayload.file_size = updates.file_size;
    if (updates?.error_message !== undefined) updatePayload.error_message = updates.error_message;
    if (updates?.metadata !== undefined) updatePayload.metadata = updates.metadata as any;

    if (status === 'completed') {
      updatePayload.completed_at = updates?.completed_at || now;
      updatePayload.error_message = null;
    } else if (status === 'failed') {
      updatePayload.completed_at = null;
    }

    const { data, error } = await supabase
      .from('system_backups')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        profiles:created_by (
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `)
      .single();

    if (error || !data) {
      console.error('[backupService] Erro ao atualizar status do backup:', error);
      throw new Error(error?.message || 'Falha ao atualizar registro de backup.');
    }

    const updatedBackup = data as SystemBackup;

    // Determina a ação correspondente no log de auditoria
    let auditAction = 'BACKUP_UPDATED';
    if (status === 'processing') auditAction = 'BACKUP_STARTED';
    else if (status === 'completed') auditAction = 'BACKUP_COMPLETED';
    else if (status === 'failed') auditAction = 'BACKUP_FAILED';
    else if (status === 'restoring') auditAction = 'BACKUP_RESTORE_STARTED';
    else if (status === 'restored') auditAction = 'BACKUP_RESTORE_COMPLETED';

    await supabaseDatabase.logAdminAction({
      user_id: userId || null,
      user_email: userEmail || null,
      action: auditAction,
      entity_type: 'system_backups',
      entity_id: id,
      details: {
        backup_name: updatedBackup.backup_name,
        new_status: status,
        file_name: updatedBackup.file_name,
        file_size: updatedBackup.file_size,
        error_message: updatedBackup.error_message,
      },
    });

    return updatedBackup;
  },

  /**
   * Exclui um registro de backup do histórico
   */
  async deleteBackupRecord(
    id: string,
    userId?: string,
    userEmail?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    const target = await this.getBackupById(id);
    if (!target) {
      throw new Error('Registro de backup não localizado para exclusão.');
    }

    const { error } = await supabase
      .from('system_backups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[backupService] Erro ao excluir registro de backup:', error);
      throw new Error(error.message || 'Falha ao excluir registro de backup.');
    }

    // Registra auditoria
    await supabaseDatabase.logAdminAction({
      user_id: userId || null,
      user_email: userEmail || null,
      action: 'BACKUP_DELETED',
      entity_type: 'system_backups',
      entity_id: id,
      details: {
        backup_name: target.backup_name,
        file_name: target.file_name,
        storage_provider: target.storage_provider,
        deleted_at: new Date().toISOString(),
      },
    });

    return true;
  },

  /**
   * Consulta as configurações de backup armazenadas na tabela public.site_settings
   */
  async getBackupSettings(): Promise<BackupSettings> {
    if (!isSupabaseConfigured) {
      return DEFAULT_BACKUP_SETTINGS;
    }

    try {
      const saved = await supabaseDatabase.getSiteSetting('backup_settings');
      if (saved && typeof saved === 'object') {
        return {
          ...DEFAULT_BACKUP_SETTINGS,
          ...saved,
        };
      }
      return DEFAULT_BACKUP_SETTINGS;
    } catch (err) {
      console.warn('[backupService] Aviso ao consultar backup_settings:', err);
      return DEFAULT_BACKUP_SETTINGS;
    }
  },

  /**
   * Atualiza as configurações de backup na tabela public.site_settings
   */
  async updateBackupSettings(
    settings: Partial<BackupSettings>,
    userId?: string,
    userEmail?: string
  ): Promise<BackupSettings> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    const current = await this.getBackupSettings();
    const updated: BackupSettings = {
      ...current,
      ...settings,
    };

    await supabaseDatabase.updateSiteSetting('backup_settings', updated, userId);

    await supabaseDatabase.logAdminAction({
      user_id: userId || null,
      user_email: userEmail || null,
      action: 'BACKUP_SETTINGS_UPDATED',
      entity_type: 'site_settings',
      entity_id: 'backup_settings',
      details: {
        provider: updated.provider,
        enabled: updated.enabled,
        retention_days: updated.retention_days,
        scheduled_enabled: updated.scheduled_enabled,
      },
    });

    return updated;
  },

  /**
   * Formatador utilitário de tamanho em bytes
   */
  formatBytes(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${size} ${units[i]}`;
  },

  /**
   * Obtém os dados da conexão ativa com o Google Drive consultando a Edge Function server-side (sem expor tokens nem consultar tabelas restritas)
   */
  async getActiveGoogleDriveConnection(): Promise<any | null> {
    try {
      const status = await this.getGoogleDriveServerStatus();
      if (status.configured && status.connected) {
        return {
          id: status.folder_id || 'google_drive_active',
          provider: 'google_drive',
          account_email: status.account_email || null,
          drive_folder_id: status.folder_id || null,
          drive_folder_name: status.folder_name || 'Jucélia Santana Engenharia Civil — Backups',
          status: status.status || 'connected',
          is_active: true,
        };
      }
      return null;
    } catch (err) {
      console.warn('[backupService] Erro ao consultar conexão ativa:', err);
      return null;
    }
  },

  /**
   * Obtém a URL de autorização oficial do Google Drive via Supabase Edge Function ou Backend Local
   */
  async getGoogleDriveAuthUrl(adminId?: string, adminEmail?: string): Promise<{
    configured: boolean;
    url?: string;
    state?: string;
    redirectUri?: string;
    message?: string;
  }> {
    try {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-drive-oauth?action=start&origin=${encodeURIComponent(window.location.origin)}`;

      // Obtém o token JWT da sessão ativa do administrador
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'apikey': supabaseAnonKey,
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Tenta primeiro a Supabase Edge Function
      try {
        const edgeRes = await fetch(edgeFunctionUrl, {
          method: 'GET',
          headers,
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          if (edgeData.configured && edgeData.url) {
            return edgeData;
          }
        }
      } catch (edgeErr) {
        console.warn('[backupService] Edge Function indisponível, utilizando fallback local:', edgeErr);
      }

      // Fallback para backend local
      const queryParams = new URLSearchParams({
        admin_id: adminId || '',
        admin_email: adminEmail || '',
      });

      const res = await fetch(`/api/google-drive/auth-url?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Falha ao comunicar com o servidor de autorização.');
      }
      return await res.json();
    } catch (err: any) {
      console.error('[backupService] Erro ao obter URL de autenticação Google Drive:', err);
      return {
        configured: false,
        message: err.message || 'Erro ao iniciar fluxo OAuth com o Google.',
      };
    }
  },

  /**
   * Executa a verificação real da conexão e permissões do Google Drive
   */
  async verifyGoogleDriveConnection(adminId?: string, adminEmail?: string): Promise<{
    success: boolean;
    status: 'connected' | 'disconnected' | 'reconnect_required' | 'attention';
    message?: string;
    verified_at?: string;
    account_email?: string;
    folder_id?: string;
    folder_name?: string;
    folder_healthy?: boolean;
  }> {
    try {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-drive-oauth?action=verify`;

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Tenta primeiro a Supabase Edge Function
      try {
        const edgeRes = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ admin_id: adminId, admin_email: adminEmail }),
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          return edgeData;
        }
      } catch (edgeErr) {
        console.warn('[backupService] Edge Function verify fallback:', edgeErr);
      }

      // Fallback para backend local
      const res = await fetch('/api/google-drive/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, admin_email: adminEmail }),
      });

      if (!res.ok) {
        throw new Error('Erro na resposta do servidor de verificação.');
      }

      return await res.json();
    } catch (err: any) {
      console.error('[backupService] Erro ao verificar Google Drive:', err);
      return {
        success: false,
        status: 'attention',
        message: 'Não foi possível validar o status da conexão com o Google Drive.',
      };
    }
  },

  /**
   * Desconecta a integração com o Google Drive sem remover backups existentes
   */
  async disconnectGoogleDrive(adminId?: string, adminEmail?: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-drive-oauth?action=disconnect`;

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Tenta primeiro a Supabase Edge Function
      try {
        const edgeRes = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ admin_id: adminId, admin_email: adminEmail }),
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          // Atualiza configurações locais no banco também
          const current = await this.getBackupSettings();
          await this.updateBackupSettings(
            {
              ...current,
              google_drive_connected: false,
              google_drive_account_email: null,
              google_drive_status: 'disconnected',
              google_drive_error: null,
            },
            adminId,
            adminEmail
          );
          return edgeData;
        }
      } catch (edgeErr) {
        console.warn('[backupService] Edge Function disconnect fallback:', edgeErr);
      }

      // Fallback para backend local
      const res = await fetch('/api/google-drive/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, admin_email: adminEmail }),
      });

      if (!res.ok) {
        throw new Error('Erro ao desconectar no servidor.');
      }

      // Atualiza via Supabase cliente
      const current = await this.getBackupSettings();
      await this.updateBackupSettings(
        {
          ...current,
          google_drive_connected: false,
          google_drive_account_email: null,
          google_drive_status: 'disconnected',
          google_drive_error: null,
        },
        adminId,
        adminEmail
      );

      return await res.json();
    } catch (err: any) {
      console.error('[backupService] Erro ao desconectar Google Drive:', err);
      return {
        success: false,
        message: err.message || 'Falha ao desconectar Google Drive.',
      };
    }
  },

  /**
   * Obtém o status do servidor e variáveis de ambiente configuradas através da Edge Function server-side
   */
  async getGoogleDriveServerStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    redirectUri?: string;
    appUrl?: string;
    hasServerSession?: boolean;
    account_email?: string | null;
    folder_id?: string | null;
    folder_name?: string | null;
    status?: string | null;
  }> {
    try {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-drive-oauth?action=status`;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          'apikey': supabaseAnonKey,
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const edgeRes = await fetch(edgeFunctionUrl, {
          method: 'GET',
          headers,
        });

        if (edgeRes.ok) {
          const data = await edgeRes.json();
          if (data.configured) {
            return {
              configured: true,
              connected: Boolean(data.connected),
              redirectUri: `${supabaseUrl}/functions/v1/google-drive-oauth/callback`,
              account_email: data.connection?.account_email || null,
              folder_id: data.connection?.drive_folder_id || null,
              folder_name: data.connection?.drive_folder_name || null,
              status: data.connection?.status || (data.connected ? 'connected' : 'disconnected'),
            };
          }
        }
      } catch (e) {
        // Ignora e tenta local
      }

      const res = await fetch('/api/google-drive/status');
      if (res.ok) {
        const localData = await res.json();
        return {
          configured: Boolean(localData.configured),
          connected: Boolean(localData.connected),
          redirectUri: localData.redirectUri || `${supabaseUrl}/functions/v1/google-drive-oauth/callback`,
          account_email: localData.account_email || null,
          folder_id: localData.folder_id || null,
          folder_name: localData.folder_name || null,
          status: localData.connected ? 'connected' : 'disconnected',
        };
      }
      return {
        configured: true,
        connected: false,
        redirectUri: `${supabaseUrl}/functions/v1/google-drive-oauth/callback`,
      };
    } catch (e) {
      return {
        configured: true,
        connected: false,
        redirectUri: `${supabaseUrl}/functions/v1/google-drive-oauth/callback`,
      };
    }
  },

  /**
   * Executa o backup manual completo do sistema com envio seguro ao Google Drive
   */
  async executeManualBackup(params: {
    adminId: string;
    adminEmail: string;
    adminName?: string;
    includePhotos?: boolean;
    includeVideos?: boolean;
    includeDocuments?: boolean;
    onProgress?: (info: any) => void;
  }) {
    const { backupEngine } = await import('./backupEngine');
    return backupEngine.executeManualBackup(params);
  },

  /**
   * Verifica se o arquivo físico do backup ainda existe e está íntegro no Google Drive
   */
  async verifyBackupFile(
    backupId: string,
    fileId?: string | null,
    adminId?: string,
    adminEmail?: string
  ): Promise<{
    success: boolean;
    exists: boolean;
    trashed?: boolean;
    message: string;
    fileId?: string;
    fileName?: string;
    fileSize?: number | null;
    verifiedAt?: string;
    reconnectRequired?: boolean;
  }> {
    if (!backupId) {
      throw new Error('ID do backup é obrigatório para verificação.');
    }

    const backup = await this.getBackupById(backupId);
    if (!backup) {
      throw new Error('Backup não localizado no banco de dados.');
    }

    const targetFileId = fileId || backup.file_id;
    if (!targetFileId) {
      // Se não possui file_id registrado
      const now = new Date().toISOString();
      await this.updateBackupStatus(backupId, 'file_missing', {
        metadata: {
          ...backup.metadata,
          last_verified_at: now,
          last_verified_status: 'missing',
          last_verified_message: 'Nenhum identificador de arquivo do Google Drive associado a este backup.',
        },
      }, adminId, adminEmail);

      return {
        success: true,
        exists: false,
        message: 'Nenhum identificador de arquivo do Google Drive associado a este backup.',
        verifiedAt: now,
      };
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-drive-oauth?action=verify-file`;

    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    let verificationResult: any = null;

    // Tenta primeiro Edge Function
    try {
      const edgeRes = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileId: targetFileId, backupId }),
      });

      if (edgeRes.ok) {
        verificationResult = await edgeRes.json();
      }
    } catch (e) {
      console.warn('[backupService] Edge Function verify-file fallback:', e);
    }

    // Fallback para backend local se necessário
    if (!verificationResult) {
      try {
        const localRes = await fetch('/api/google-drive/verify-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: targetFileId, backupId }),
        });
        if (localRes.ok) {
          verificationResult = await localRes.json();
        } else {
          const errData = await localRes.json().catch(() => ({}));
          verificationResult = {
            success: false,
            exists: false,
            message: errData.error || 'Erro ao verificar arquivo junto ao Google Drive.',
            reconnectRequired: Boolean(errData.reconnectRequired),
          };
        }
      } catch (err: any) {
        verificationResult = {
          success: false,
          exists: false,
          message: err.message || 'Falha de comunicação com o servidor de verificação.',
        };
      }
    }

    const now = new Date().toISOString();

    if (verificationResult.exists) {
      // Arquivo existe e está disponível no Drive
      await this.updateBackupStatus(
        backupId,
        backup.status === 'file_missing' ? 'completed' : backup.status,
        {
          file_size: verificationResult.fileSize || backup.file_size,
          metadata: {
            ...backup.metadata,
            last_verified_at: now,
            last_verified_status: 'present',
            last_verified_message: 'Arquivo verificado com sucesso no Google Drive.',
            integrity_status: 'valid',
          },
        },
        adminId,
        adminEmail
      );

      return {
        success: true,
        exists: true,
        fileId: targetFileId,
        fileName: verificationResult.fileName || backup.file_name,
        fileSize: verificationResult.fileSize || backup.file_size,
        verifiedAt: now,
        message: 'Backup verificado com sucesso no Google Drive.',
      };
    } else {
      // Arquivo ausente ou na lixeira do Drive
      const isTrashed = Boolean(verificationResult.trashed);
      const msg = isTrashed
        ? 'O arquivo correspondente foi movido para a lixeira no Google Drive.'
        : 'Arquivo do backup não foi encontrado no Google Drive (removido externamente).';

      await this.updateBackupStatus(
        backupId,
        'file_missing',
        {
          metadata: {
            ...backup.metadata,
            last_verified_at: now,
            last_verified_status: isTrashed ? 'trashed' : 'missing',
            last_verified_message: msg,
            integrity_status: 'invalid',
          },
        },
        adminId,
        adminEmail
      );

      // Registra auditoria de anomalia / arquivo ausente
      await supabaseDatabase.logAdminAction({
        user_id: adminId || null,
        user_email: adminEmail || null,
        action: 'BACKUP_FILE_MISSING',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          backup_name: backup.backup_name,
          file_id: targetFileId,
          reason: msg,
          verified_at: now,
        },
      });

      return {
        success: true,
        exists: false,
        trashed: isTrashed,
        message: msg,
        verifiedAt: now,
        reconnectRequired: verificationResult.reconnectRequired,
      };
    }
  },

  /**
   * Validação de integridade do backup (metadados, checksum e estrutura)
   */
  async verifyBackupIntegrity(backupId: string): Promise<{
    valid: boolean;
    checksum: string | null;
    tablesCount: number;
    totalRecords: number;
    filesCount: number;
    message: string;
  }> {
    const backup = await this.getBackupById(backupId);
    if (!backup) {
      throw new Error('Backup não encontrado.');
    }

    const sha256 = backup.metadata?.sha256_checksum || null;
    const tables = backup.metadata?.tables_included || [];
    const records = backup.metadata?.total_records || 0;
    const files = backup.metadata?.total_storage_files || 0;

    const hasEssentialTables = tables.includes('site_settings') && tables.includes('profiles');
    const isValid = Boolean(backup.status === 'completed' && sha256 && hasEssentialTables);

    const now = new Date().toISOString();
    await this.updateBackupStatus(backupId, backup.status, {
      metadata: {
        ...backup.metadata,
        integrity_status: isValid ? 'valid' : 'invalid',
        integrity_verified_at: now,
      },
    });

    return {
      valid: isValid,
      checksum: sha256,
      tablesCount: tables.length,
      totalRecords: records,
      filesCount: files,
      message: isValid
        ? 'Assinatura SHA-256 e estrutura do pacote validadas com sucesso.'
        : 'Estrutura incompleta ou checksum não identificado.',
    };
  },

  /**
   * Sincroniza a lista de backups com o estado real do Google Drive
   */
  async syncBackupsWithDrive(adminId?: string, adminEmail?: string): Promise<{
    totalChecked: number;
    verifiedCount: number;
    missingCount: number;
    errorsCount: number;
  }> {
    const backups = await this.getBackups({ includeDeleted: false });
    const driveBackups = backups.filter(b => b.storage_provider === 'google_drive' && b.file_id);

    let verifiedCount = 0;
    let missingCount = 0;
    let errorsCount = 0;

    // Executa verificação em paralelo com limite de concorrência seguro
    for (const b of driveBackups) {
      try {
        const res = await this.verifyBackupFile(b.id, b.file_id, adminId, adminEmail);
        if (res.exists) {
          verifiedCount++;
        } else {
          missingCount++;
        }
      } catch (err) {
        console.error(`[backupService] Falha ao sincronizar backup ${b.id}:`, err);
        errorsCount++;
      }
    }

    return {
      totalChecked: driveBackups.length,
      verifiedCount,
      missingCount,
      errorsCount,
    };
  },

  /**
   * Exclusão segura de backup: remove o arquivo do Google Drive e atualiza o histórico no Supabase
   */
  async deleteBackupAndRemoteFile(
    backupId: string,
    adminId: string,
    adminEmail: string,
    options?: { hardDelete?: boolean }
  ): Promise<{
    success: boolean;
    remoteDeleted: boolean;
    message: string;
  }> {
    if (!backupId) {
      throw new Error('ID do backup é obrigatório.');
    }

    const backup = await this.getBackupById(backupId);
    if (!backup) {
      throw new Error('Backup não localizado no sistema.');
    }

    // 1. Registra intenção de exclusão
    await supabaseDatabase.logAdminAction({
      user_id: adminId,
      user_email: adminEmail,
      action: 'BACKUP_DELETE_REQUESTED',
      entity_type: 'system_backups',
      entity_id: backupId,
      details: {
        backup_name: backup.backup_name,
        file_id: backup.file_id,
        file_size: backup.file_size,
        status: backup.status,
      },
    });

    let remoteDeleted = false;

    // 2. Se houver arquivo no Google Drive, executa exclusão remota
    if (backup.storage_provider === 'google_drive' && backup.file_id) {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-drive-oauth?action=delete-file`;

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      let deleteRemoteSuccess = false;
      let deleteRemoteError = '';
      let reconnectRequired = false;

      // Tenta Edge Function
      try {
        const edgeRes = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ fileId: backup.file_id, backupId }),
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          if (edgeData.deleted || edgeData.alreadyDeleted) {
            deleteRemoteSuccess = true;
          }
        } else {
          const errData = await edgeRes.json().catch(() => ({}));
          deleteRemoteError = errData.error || 'Falha na exclusão remota.';
          reconnectRequired = Boolean(errData.reconnectRequired);
        }
      } catch (e) {
        console.warn('[backupService] Edge Function delete-file fallback:', e);
      }

      // Fallback para servidor local
      if (!deleteRemoteSuccess && !reconnectRequired) {
        try {
          const localRes = await fetch('/api/google-drive/delete-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: backup.file_id, backupId }),
          });

          if (localRes.ok) {
            const localData = await localRes.json();
            if (localData.deleted || localData.alreadyDeleted) {
              deleteRemoteSuccess = true;
            }
          } else {
            const errData = await localRes.json().catch(() => ({}));
            deleteRemoteError = errData.error || 'Falha na exclusão remota.';
            reconnectRequired = Boolean(errData.reconnectRequired);
          }
        } catch (err: any) {
          deleteRemoteError = err.message || 'Erro de comunicação ao excluir arquivo remoto.';
        }
      }

      if (reconnectRequired) {
        await supabaseDatabase.logAdminAction({
          user_id: adminId,
          user_email: adminEmail,
          action: 'BACKUP_DELETE_FAILED',
          entity_type: 'system_backups',
          entity_id: backupId,
          details: {
            backup_name: backup.backup_name,
            reason: 'Reconexão com Google Drive necessária para excluir arquivo remoto.',
          },
        });

        throw new Error('Reconecte o Google Drive para concluir a exclusão deste backup de forma segura.');
      }

      remoteDeleted = deleteRemoteSuccess;
    }

    // 3. Atualiza estado no Supabase
    const now = new Date().toISOString();

    if (options?.hardDelete) {
      await supabase
        .from('system_backups')
        .delete()
        .eq('id', backupId);
    } else {
      // Soft delete preservando rastro administrativo
      await supabase
        .from('system_backups')
        .update({
          status: 'deleted',
          updated_at: now,
          metadata: {
            ...backup.metadata,
            deleted_at: now,
            deleted_by: adminId,
            deleted_by_email: adminEmail,
            remote_file_deleted: remoteDeleted,
          },
        })
        .eq('id', backupId);
    }

    // 4. Registra auditoria de sucesso
    await supabaseDatabase.logAdminAction({
      user_id: adminId,
      user_email: adminEmail,
      action: 'BACKUP_DELETE_COMPLETED',
      entity_type: 'system_backups',
      entity_id: backupId,
      details: {
        backup_name: backup.backup_name,
        file_id: backup.file_id,
        remote_deleted: remoteDeleted,
        hard_deleted: Boolean(options?.hardDelete),
        deleted_at: now,
      },
    });

    return {
      success: true,
      remoteDeleted,
      message: remoteDeleted
        ? 'Backup e arquivo no Google Drive excluídos com sucesso.'
        : 'Registro de backup removido do sistema.',
    };
  },

  /**
   * Executa a restauração completa e segura de um backup armazenado no Google Drive
   */
  async executeRestore(params: {
    backupId: string;
    adminId: string;
    adminEmail: string;
    adminName?: string;
    restorePhotos?: boolean;
    restoreVideos?: boolean;
    restoreDocuments?: boolean;
    onProgress?: (info: any) => void;
  }) {
    const { restoreEngine } = await import('./restoreEngine');
    return restoreEngine.executeRestore(params);
  },

  /**
   * Consulta o estado e configuração do agendador no servidor
   */
  async getScheduleConfig(): Promise<{
    settings: BackupSettings;
    isServerRunning: boolean;
    hasGoogleDriveSession: boolean;
  }> {
    try {
      const res = await fetch('/api/backup/schedule');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          return {
            settings: {
              ...DEFAULT_BACKUP_SETTINGS,
              ...data.settings,
            },
            isServerRunning: Boolean(data.isServerRunning),
            hasGoogleDriveSession: Boolean(data.hasGoogleDriveSession),
          };
        }
      }
    } catch (e) {
      console.warn('[backupService] Falha ao consultar /api/backup/schedule, usando fallback:', e);
    }

    const fallbackSettings = await this.getBackupSettings();
    return {
      settings: fallbackSettings,
      isServerRunning: false,
      hasGoogleDriveSession: Boolean(fallbackSettings.google_drive_connected),
    };
  },

  /**
   * Salva configurações de agendamento no backend
   */
  async saveScheduleConfig(params: {
    scheduled_enabled: boolean;
    schedule_frequency: 'daily' | 'weekly' | 'monthly';
    schedule_time: string;
    schedule_timezone: string;
    schedule_day_of_week?: number;
    schedule_day_of_month?: number;
    adminId: string;
    adminEmail: string;
  }): Promise<{ success: boolean; message: string; next_scheduled_backup_at?: string | null }> {
    try {
      const res = await fetch('/api/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_enabled: params.scheduled_enabled,
          schedule_frequency: params.schedule_frequency,
          schedule_time: params.schedule_time,
          schedule_timezone: params.schedule_timezone,
          schedule_day_of_week: params.schedule_day_of_week,
          schedule_day_of_month: params.schedule_day_of_month,
          admin_id: params.adminId,
          admin_email: params.adminEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao salvar agendamento de backup.');
      }

      return {
        success: true,
        message: data.message || 'Configuração salva com sucesso.',
        next_scheduled_backup_at: data.next_scheduled_backup_at,
      };
    } catch (err: any) {
      console.error('[backupService] Erro ao salvar agendamento:', err);
      throw new Error(err.message || 'Erro ao comunicar com o servidor de agendamento.');
    }
  },

  /**
   * Dispara a execução de teste do backup agendado diretamente no servidor
   */
  async triggerScheduledBackupTest(adminId: string, adminEmail: string): Promise<{
    success: boolean;
    message: string;
    backupId?: string;
    fileName?: string;
  }> {
    try {
      const res = await fetch('/api/backup/trigger-scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          admin_email: adminEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao executar teste do backup agendado.');
      }

      return {
        success: true,
        message: data.message || 'Backup automático executado com sucesso.',
        backupId: data.backupId,
        fileName: data.fileName,
      };
    } catch (err: any) {
      console.error('[backupService] Erro no teste do backup agendado:', err);
      throw new Error(err.message || 'Erro ao disparar teste do agendador.');
    }
  },

  /**
   * Recupera e marca como 'failed' backups que ficaram em estado 'processing' ou 'pending'
   * por mais de 20 minutos (execuções travadas ou abandonadas)
   */
  async recoverStaleBackups(): Promise<{ recoveredCount: number }> {
    if (!isSupabaseConfigured) return { recoveredCount: 0 };

    try {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const { data: staleBackups, error } = await supabase
        .from('system_backups')
        .select('id, backup_name, created_at, status')
        .in('status', ['processing', 'pending', 'restoring'])
        .lt('created_at', twentyMinutesAgo);

      if (error || !staleBackups || staleBackups.length === 0) {
        return { recoveredCount: 0 };
      }

      let recovered = 0;
      for (const b of staleBackups) {
        await supabase
          .from('system_backups')
          .update({
            status: 'failed',
            error_message: 'Operação interrompida ou cancelada pelo servidor (Timeout de 20 minutos)',
            updated_at: new Date().toISOString(),
          })
          .eq('id', b.id);
        recovered++;
      }

      return { recoveredCount: recovered };
    } catch (err) {
      console.error('[backupService] Erro ao recuperar backups stale:', err);
      return { recoveredCount: 0 };
    }
  },

  /**
   * Executa Health Check técnico completo do ecossistema de backups
   */
  async getSystemHealthCheck(): Promise<{
    overallStatus: 'healthy' | 'warning' | 'error';
    supabaseOk: boolean;
    googleDriveOk: boolean;
    folderOk: boolean;
    lastBackupOk: boolean;
    scheduleOk: boolean;
    integrityOk: boolean;
    daysSinceLastBackup: number | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let supabaseOk = false;
    let googleDriveOk = false;
    let folderOk = false;
    let lastBackupOk = false;
    let scheduleOk = false;
    let integrityOk = true;
    let daysSinceLastBackup: number | null = null;

    try {
      // 1. Testa Supabase
      if (isSupabaseConfigured) {
        const { data: sbTest } = await supabase.from('site_settings').select('key').limit(1);
        supabaseOk = Boolean(sbTest);
      }
      if (!supabaseOk) {
        warnings.push('Conexão com a base de dados Supabase não pôde ser confirmada.');
      }

      // 2. Testa Google Drive e Pasta
      const settings = await this.getBackupSettings();
      googleDriveOk = Boolean(settings.google_drive_connected && settings.google_drive_status === 'connected');
      folderOk = Boolean(settings.google_drive_folder_id);

      if (!googleDriveOk) {
        warnings.push('A conta oficial do Google Drive não está conectada ou requer autorização.');
      }

      // 3. Testa Agendamento
      scheduleOk = Boolean(settings.scheduled_enabled);

      // 4. Testa Último Backup
      const metrics = await this.getBackupMetrics();
      if (metrics.latestValidBackup) {
        lastBackupOk = true;
        const backupTime = new Date(metrics.latestValidBackup.completed_at || metrics.latestValidBackup.created_at).getTime();
        daysSinceLastBackup = Math.floor((Date.now() - backupTime) / (1000 * 60 * 60 * 24));

        if (daysSinceLastBackup > 7) {
          warnings.push(`Nenhum backup válido foi concluído nos últimos ${daysSinceLastBackup} dias.`);
        }
      } else {
        warnings.push('Nenhum backup válido foi realizado até o momento.');
      }

      if (metrics.missingBackups > 0) {
        integrityOk = false;
        warnings.push(`Existem ${metrics.missingBackups} registro(s) com arquivos ausentes no Google Drive.`);
      }

      if (settings.last_scheduled_status === 'failed') {
        warnings.push('A última rotina agendada falhou. Verifique o histórico de execuções.');
      }

      let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
      if (!supabaseOk || !googleDriveOk) {
        overallStatus = 'error';
      } else if (warnings.length > 0) {
        overallStatus = 'warning';
      }

      return {
        overallStatus,
        supabaseOk,
        googleDriveOk,
        folderOk,
        lastBackupOk,
        scheduleOk,
        integrityOk,
        daysSinceLastBackup,
        warnings,
      };
    } catch (err: any) {
      console.error('[backupService] Erro no health check:', err);
      return {
        overallStatus: 'error',
        supabaseOk: false,
        googleDriveOk: false,
        folderOk: false,
        lastBackupOk: false,
        scheduleOk: false,
        integrityOk: false,
        daysSinceLastBackup: null,
        warnings: [err.message || 'Falha ao executar auditoria de saúde do sistema.'],
      };
    }
  },
};


