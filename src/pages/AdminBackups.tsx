// /src/pages/AdminBackups.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Database,
  HardDrive,
  Cloud,
  Shield,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
  Trash2,
  Info,
  CheckCircle2,
  XCircle,
  FolderLock,
  Layers,
  Settings,
  X,
  FileCode,
  Calendar,
  Link2,
  Unlink,
  ExternalLink,
  HelpCircle,
  FolderCheck,
  Mail,
  AlertTriangle,
  UserCheck,
  ArrowRightLeft,
  FileArchive,
  Check,
  DownloadCloud,
  Loader2,
  Sparkles,
  Search,
  SlidersHorizontal,
  Filter,
  ArrowUpDown,
  CheckCheck,
  AlertOctagon,
  FileCheck,
  FileX,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hash,
  ShieldAlert,
  Server,
  RotateCcw,
  History,
  FileLock2,
  Image,
  Video,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backupService, type BackupMetrics } from '../services/backupService';
import type { BackupProgressInfo } from '../services/backupEngine';
import type {
  SystemBackup,
  BackupSettings,
  BackupStatus,
  BackupType,
  BackupFrequency,
  RestoreProgressInfo,
  RestoreResult,
} from '../types/backup';
import { calculateNextScheduledBackup, WEEKDAYS, TIMEZONES } from '../utils/scheduleCalculator';

export default function AdminBackups() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Estados de dados principais
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [metrics, setMetrics] = useState<BackupMetrics | null>(null);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [serverStatus, setServerStatus] = useState<{
    configured: boolean;
    connected?: boolean;
    status?: string;
    account_email?: string | null;
    folder_name?: string | null;
    folder_id?: string | null;
    redirectUri?: string;
    appUrl?: string;
  } | null>(null);

  // Estados do Agendamento e Execução Automática (Etapa 20.6)
  const [scheduledEnabled, setScheduledEnabled] = useState<boolean>(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<BackupFrequency>('daily');
  const [scheduleTime, setScheduleTime] = useState<string>('02:00');
  const [scheduleTimezone, setScheduleTimezone] = useState<string>('America/Sao_Paulo');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(0);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState<number>(1);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [isTestingSchedule, setIsTestingSchedule] = useState<boolean>(false);

  // Estados de carregamento e ações
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [syncingDrive, setSyncingDrive] = useState<boolean>(false);
  const [verifyingFileId, setVerifyingFileId] = useState<string | null>(null);

  // Estados de Filtro, Busca, Ordenação e Paginação (Etapa 20.4)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'backup_name' | 'file_size' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Estados do Backup Manual (Etapa 20.3)
  const [isConfirmBackupModalOpen, setIsConfirmBackupModalOpen] = useState<boolean>(false);
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeVideos, setIncludeVideos] = useState<boolean>(true);
  const [includeDocuments, setIncludeDocuments] = useState<boolean>(true);
  const [isExecutingBackup, setIsExecutingBackup] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<BackupProgressInfo | null>(null);
  const [backupCompletedResult, setBackupCompletedResult] = useState<{
    backup: SystemBackup;
    fileId: string;
    fileName: string;
    fileSize: number;
    sha256: string;
    webViewLink: string;
  } | null>(null);

  // Estados da Restauração de Backup (Etapa 20.5)
  const [restoreTarget, setRestoreTarget] = useState<SystemBackup | null>(null);
  const [isConfirmRestoreModalOpen, setIsConfirmRestoreModalOpen] = useState<boolean>(false);
  const [restorePhotos, setRestorePhotos] = useState<boolean>(true);
  const [restoreVideos, setRestoreVideos] = useState<boolean>(true);
  const [restoreDocuments, setRestoreDocuments] = useState<boolean>(true);
  const [restoreConfirmInput, setRestoreConfirmInput] = useState<string>('');
  const [isExecutingRestore, setIsExecutingRestore] = useState<boolean>(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgressInfo | null>(null);
  const [restoreCompletedResult, setRestoreCompletedResult] = useState<RestoreResult | null>(null);
  const [restoreErrorMessage, setRestoreErrorMessage] = useState<string | null>(null);

  // Mensagens de feedback e toasts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modais de Controle
  const [selectedBackup, setSelectedBackup] = useState<SystemBackup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemBackup | null>(null);
  const [deleteFromDrive, setDeleteFromDrive] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState<boolean>(false);
  const [isSwitchAccountModalOpen, setIsSwitchAccountModalOpen] = useState<boolean>(false);

  // Estado para validação de integridade no modal de detalhes
  const [isValidatingIntegrity, setIsValidatingIntegrity] = useState<boolean>(false);
  const [integrityResult, setIntegrityResult] = useState<{
    valid: boolean;
    checksum: string | null;
    tablesCount: number;
    totalRecords: number;
    filesCount: number;
    message: string;
  } | null>(null);

  // Estado do Health Check completo (Etapa 20.7)
  const [healthCheck, setHealthCheck] = useState<{
    overallStatus: 'healthy' | 'warning' | 'error';
    supabaseOk: boolean;
    googleDriveOk: boolean;
    folderOk: boolean;
    lastBackupOk: boolean;
    scheduleOk: boolean;
    integrityOk: boolean;
    daysSinceLastBackup: number | null;
    warnings: string[];
  } | null>(null);

  // Referências para polling de OAuth adaptativo no desktop/preview
  const oauthPollingIntervalRef = useRef<number | null>(null);
  const oauthPopupRef = useRef<Window | null>(null);

  const stopOAuthPolling = useCallback(() => {
    if (oauthPollingIntervalRef.current) {
      window.clearInterval(oauthPollingIntervalRef.current);
      oauthPollingIntervalRef.current = null;
    }
  }, []);

  // Cleanup de timers sem acionar qualquer disconnect
  useEffect(() => {
    return () => {
      stopOAuthPolling();
    };
  }, [stopOAuthPolling]);

  // Carregamento de dados
  const loadBackupData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMessage(null);

    try {
      // Auto-recupera backups que possam ter ficado em processamento por falhas anteriores
      await backupService.recoverStaleBackups().catch(() => {});

      const [backupsList, currentMetrics, currentSettings, currentServerStatus, healthData] = await Promise.all([
        backupService.getBackups({ includeDeleted: false }),
        backupService.getBackupMetrics(),
        backupService.getBackupSettings(),
        backupService.getGoogleDriveServerStatus(),
        backupService.getSystemHealthCheck(),
      ]);

      setBackups(backupsList);
      setMetrics(currentMetrics);
      setSettings(currentSettings);
      setServerStatus(currentServerStatus);
      setHealthCheck(healthData);

      if (currentSettings) {
        setScheduledEnabled(Boolean(currentSettings.scheduled_enabled));
        setScheduleFrequency(currentSettings.schedule_frequency || 'daily');
        setScheduleTime(currentSettings.schedule_time || '02:00');
        setScheduleTimezone(currentSettings.schedule_timezone || 'America/Sao_Paulo');
        setScheduleDayOfWeek(currentSettings.schedule_day_of_week ?? 0);
        setScheduleDayOfMonth(currentSettings.schedule_day_of_month ?? 1);
      }
    } catch (err: any) {
      console.error('[AdminBackups] Falha ao carregar dados de backup:', err);
      setErrorMessage('Não foi possível carregar as informações de backup. Verifique a conexão com o Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Inicialização e captura do retorno de redirecionamento OAuth HTTP 303
  useEffect(() => {
    const checkUrlAndLoad = async () => {
      const params = new URLSearchParams(window.location.search);
      const googleDriveStatus = params.get('google_drive');
      const reason = params.get('reason');

      if (googleDriveStatus === 'connected') {
        window.history.replaceState({}, document.title, window.location.pathname);
        setConnecting(false);
        try {
          const st = await backupService.getGoogleDriveServerStatus();
          setServerStatus(st);
          if (st.connected) {
            setSuccessMessage('Google Drive conectado com sucesso.');
            setTimeout(() => setSuccessMessage(null), 5000);
          }
        } catch (e) {
          console.warn('[AdminBackups] Erro ao verificar status pós-OAuth:', e);
        }
        await loadBackupData(true);

        // Se esta janela foi aberta como popup externo no Desktop, fecha-a suavemente
        if (window.opener && window.opener !== window) {
          try {
            window.close();
          } catch (closeErr) {
            console.warn('[AdminBackups] Falha ao fechar popup:', closeErr);
          }
        }
      } else if (googleDriveStatus === 'error') {
        window.history.replaceState({}, document.title, window.location.pathname);
        setConnecting(false);
        const errorMsg =
          reason === 'session_expired'
            ? 'A sessão de autorização expirou. Por favor, tente novamente.'
            : reason === 'authorization_cancelled'
            ? 'Autorização cancelada no Google.'
            : 'Não foi possível concluir a autorização no Google. Verifique se o aplicativo OAuth está publicado e se esta conta possui permissão de acesso.';
        setErrorMessage(errorMsg);
        await loadBackupData();

        if (window.opener && window.opener !== window) {
          try {
            window.close();
          } catch (e) {}
        }
      } else {
        await loadBackupData();
      }
    };

    checkUrlAndLoad();
  }, [loadBackupData]);

  // Iniciar Conexão OAuth com Google Drive (Janela Externa Top-Level + Polling Server-Side)
  const handleConnectGoogleDrive = async () => {
    if (connecting) return;
    setConnecting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    stopOAuthPolling();

    // 1. Validar sessão Supabase
    if (!user) {
      setErrorMessage('Sessão expirada ou inválida. Por favor, faça login novamente.');
      setConnecting(false);
      return;
    }

    // 2. Validar role admin
    if (!isAdmin) {
      setErrorMessage('Acesso restrito: apenas administradores ativos podem gerenciar integrações e backups.');
      setConnecting(false);
      return;
    }

    // 3. Validar status active
    if (profile?.active === false) {
      setErrorMessage('Conta de administrador inativa. Entre em contato com a administração.');
      setConnecting(false);
      return;
    }

    // Fecha modal de troca de conta se estiver aberto
    setIsSwitchAccountModalOpen(false);

    // Detecção de contexto adaptativo
    const isMobile =
      typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 768px)').matches ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    // 4. Cria a janela/aba externa sincronamente a partir do gesto de clique do usuário
    const width = 600;
    const height = 760;
    const left = typeof window !== 'undefined' ? window.screenX + (window.outerWidth - width) / 2 : 0;
    const top = typeof window !== 'undefined' ? window.screenY + (window.outerHeight - height) / 2 : 0;

    let oauthWindow: Window | null = null;
    try {
      oauthWindow = window.open(
        'about:blank',
        isMobile ? '_blank' : 'google-drive-oauth',
        isMobile ? undefined : `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );
    } catch (openErr) {
      console.warn('[AdminBackups] Falha ao abrir janela inicial:', openErr);
    }

    // Tratamento caso a janela tenha sido bloqueada pelo navegador
    if (!oauthWindow || oauthWindow.closed || typeof oauthWindow.closed === 'undefined') {
      setErrorMessage(
        'A janela de autorização do Google foi bloqueada pelo navegador. Permita popups para este site ou abra o aplicativo fora do preview e tente novamente.'
      );
      setConnecting(false);
      return;
    }

    oauthPopupRef.current = oauthWindow;

    try {
      // 5. Chamar Edge Function / endpoint server-side para gerar URL oficial de autorização do Google
      const authRes = await backupService.getGoogleDriveAuthUrl(user?.id, user?.email);

      // 6. Se não estiver configurado no servidor, fechar janela e apresentar mensagem amigável
      if (!authRes.configured || !authRes.url) {
        if (oauthWindow && !oauthWindow.closed) {
          try {
            oauthWindow.close();
          } catch (e) {}
        }
        oauthPopupRef.current = null;
        setErrorMessage(
          'Não foi possível iniciar a conexão com o Google Drive. A integração precisa ser configurada pelo administrador técnico do sistema.'
        );
        setConnecting(false);
        return;
      }

      // 7. Navega a janela externa top-level para a URL de autorização oficial do Google
      oauthWindow.location.href = authRes.url;

      // 8. Inicia Polling server-side de action=status (a cada 1000ms, máx 120s)
      let elapsedSeconds = 0;
      const maxSeconds = 120;

      oauthPollingIntervalRef.current = window.setInterval(async () => {
        elapsedSeconds += 1;

        try {
          const currentStatus = await backupService.getGoogleDriveServerStatus();

          if (currentStatus.connected) {
            stopOAuthPolling();
            if (oauthPopupRef.current && !oauthPopupRef.current.closed) {
              try {
                oauthPopupRef.current.close();
              } catch (e) {}
            }
            oauthPopupRef.current = null;
            setConnecting(false);
            setServerStatus(currentStatus);
            setSuccessMessage('Google Drive conectado com sucesso.');
            await loadBackupData(true);
            setTimeout(() => setSuccessMessage(null), 5000);
            return;
          }
        } catch (pollErr) {
          console.warn('[OAuth Polling]:', pollErr);
        }

        // Se o usuário fechou o popup antes de autorizar
        if (oauthPopupRef.current && oauthPopupRef.current.closed) {
          stopOAuthPolling();
          oauthPopupRef.current = null;

          // Checagem final rápida
          try {
            const finalCheck = await backupService.getGoogleDriveServerStatus();
            if (finalCheck.connected) {
              setConnecting(false);
              setServerStatus(finalCheck);
              setSuccessMessage('Google Drive conectado com sucesso.');
              await loadBackupData(true);
              setTimeout(() => setSuccessMessage(null), 5000);
              return;
            }
          } catch (e) {}

          setConnecting(false);
          setErrorMessage('A autorização do Google Drive não foi concluída.');
          return;
        }

        // Timeout de 120s
        if (elapsedSeconds >= maxSeconds) {
          stopOAuthPolling();
          if (oauthPopupRef.current && !oauthPopupRef.current.closed) {
            try {
              oauthPopupRef.current.close();
            } catch (e) {}
          }
          oauthPopupRef.current = null;
          setConnecting(false);
          setErrorMessage('Tempo limite de conexão esgotado. Verifique a autorização no Google e tente novamente.');
        }
      }, 1000);
    } catch (err: any) {
      console.error('[AdminBackups] Erro ao iniciar OAuth:', err);
      if (oauthWindow && !oauthWindow.closed) {
        try {
          oauthWindow.close();
        } catch (e) {}
      }
      oauthPopupRef.current = null;
      setErrorMessage(
        err.message || 'Erro inesperado ao iniciar a autenticação com o Google Drive. Tente novamente.'
      );
      setConnecting(false);
    }
  };

  // Verificar Conexão Real com Google Drive
  const handleVerifyConnection = async () => {
    if (verifying) return;
    setVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await backupService.verifyGoogleDriveConnection(user?.id, user?.email);

      if (result.success) {
        setSuccessMessage('Conexão oficial com o Google Drive verificada e operacional!');
      } else {
        if (result.status === 'attention') {
          setErrorMessage('A conexão com o Google Drive precisa ser autorizada novamente.');
        } else {
          setErrorMessage(result.message || 'Google Drive não conectado no ambiente.');
        }
      }

      await loadBackupData(true);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('[AdminBackups] Erro ao verificar conexão:', err);
      setErrorMessage('Não foi possível verificar a conexão com o Google Drive.');
    } finally {
      setVerifying(false);
    }
  };

  // Desconectar Google Drive
  const handleDisconnectGoogleDrive = async () => {
    if (disconnecting) return;
    setDisconnecting(true);
    setErrorMessage(null);

    try {
      const res = await backupService.disconnectGoogleDrive(user?.id, user?.email);

      if (res.success) {
        setSuccessMessage('Google Drive desconectado com sucesso. Os backups salvos anteriormente no Drive foram preservados.');
        setIsDisconnectModalOpen(false);
        await loadBackupData(true);
      } else {
        setErrorMessage(res.message || 'Erro ao desconectar Google Drive.');
      }

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('[AdminBackups] Erro ao desconectar:', err);
      setErrorMessage('Falha ao desconectar Google Drive.');
    } finally {
      setDisconnecting(false);
    }
  };

  // Sincronizar todos os backups com o Google Drive
  const handleSyncWithDrive = async () => {
    if (syncingDrive || !isDriveConnected) return;
    setSyncingDrive(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await backupService.syncBackupsWithDrive(user?.id, user?.email);
      setSuccessMessage(
        `Sincronização concluída! ${result.totalChecked} arquivo(s) checado(s): ${result.verifiedCount} íntegro(s), ${result.missingCount} ausente(s).`
      );
      await loadBackupData(true);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('[AdminBackups] Erro ao sincronizar com Google Drive:', err);
      setErrorMessage(err.message || 'Falha ao sincronizar lista de backups com o Google Drive.');
    } finally {
      setSyncingDrive(false);
    }
  };

  // Verificar arquivo individual no Google Drive
  const handleVerifySingleBackup = async (backup: SystemBackup) => {
    if (verifyingFileId || !backup.file_id) return;
    setVerifyingFileId(backup.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await backupService.verifyBackupFile(backup.id, backup.file_id, user?.id, user?.email);

      if (res.exists) {
        setSuccessMessage(`Arquivo do backup "${backup.backup_name}" confirmado e disponível no Google Drive.`);
      } else {
        setErrorMessage(
          res.trashed
            ? `Aviso: O arquivo do backup "${backup.backup_name}" está na lixeira do Google Drive.`
            : `Alerta: O arquivo do backup "${backup.backup_name}" não foi encontrado no Google Drive.`
        );
      }

      await loadBackupData(true);
      if (selectedBackup?.id === backup.id) {
        const updated = await backupService.getBackupById(backup.id);
        if (updated) setSelectedBackup(updated);
      }
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('[AdminBackups] Erro ao verificar arquivo individual:', err);
      setErrorMessage(err.message || 'Falha ao verificar arquivo junto ao Google Drive.');
    } finally {
      setVerifyingFileId(null);
    }
  };

  // Validar integridade detalhada de um backup no modal
  const handleValidateIntegrity = async (backupId: string) => {
    if (isValidatingIntegrity) return;
    setIsValidatingIntegrity(true);
    setIntegrityResult(null);

    try {
      const result = await backupService.verifyBackupIntegrity(backupId);
      setIntegrityResult(result);
      await loadBackupData(true);
      const updated = await backupService.getBackupById(backupId);
      if (updated) setSelectedBackup(updated);
    } catch (err: any) {
      console.error('[AdminBackups] Erro na validação de integridade:', err);
      setIntegrityResult({
        valid: false,
        checksum: null,
        tablesCount: 0,
        totalRecords: 0,
        filesCount: 0,
        message: err.message || 'Falha ao verificar integridade do pacote.',
      });
    } finally {
      setIsValidatingIntegrity(false);
    }
  };

  // Execução do Backup Manual
  const handleExecuteManualBackup = async () => {
    if (isExecutingBackup || !user) return;

    setIsConfirmBackupModalOpen(false);
    setIsExecutingBackup(true);
    setBackupCompletedResult(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    setBackupProgress({
      step: 'validating',
      message: 'Iniciando validações prévias e segurança...',
      percent: 5,
    });

    try {
      const result = await backupService.executeManualBackup({
        adminId: user.id,
        adminEmail: user.email || 'admin@sistema.local',
        adminName: profile?.full_name || 'Administrador',
        includePhotos,
        includeVideos,
        includeDocuments,
        onProgress: (progressInfo: BackupProgressInfo) => {
          setBackupProgress(progressInfo);
        },
      });

      setBackupCompletedResult(result);
      setSuccessMessage(`Backup "${result.fileName}" concluído com sucesso e enviado ao Google Drive!`);
      await loadBackupData(true);
    } catch (err: any) {
      console.error('[AdminBackups] Erro ao executar backup manual:', err);
      setErrorMessage(err.message || 'Falha ao executar o backup manual.');
      setBackupProgress({
        step: 'failed',
        message: err.message || 'Falha durante o processo de backup.',
        percent: 100,
      });
    }
  };

  // Fechar modal de progresso
  const handleCloseProgressModal = () => {
    if (isExecutingBackup && backupProgress?.step !== 'completed' && backupProgress?.step !== 'failed') {
      return;
    }
    setIsExecutingBackup(false);
    setBackupProgress(null);
    setBackupCompletedResult(null);
  };

  // Exclusão Segura com Opção de Remoção do Google Drive
  const handleDeleteBackup = async () => {
    if (!deleteTarget || !user) return;
    setDeleting(true);
    setErrorMessage(null);

    try {
      if (deleteFromDrive && deleteTarget.file_id) {
        // Exclusão completa: Google Drive + Supabase
        await backupService.deleteBackupAndRemoteFile(
          deleteTarget.id,
          user.id,
          user.email || 'admin@sistema.local',
          { hardDelete: false }
        );
        setSuccessMessage(`Backup "${deleteTarget.backup_name}" e arquivo remoto no Google Drive removidos.`);
      } else {
        // Exclusão apenas do registro no banco
        await backupService.deleteBackupRecord(
          deleteTarget.id,
          user.id,
          user.email
        );
        setSuccessMessage(`Registro do backup "${deleteTarget.backup_name}" removido com sucesso.`);
      }

      setDeleteTarget(null);
      await loadBackupData(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('[AdminBackups] Erro ao excluir backup:', err);
      setErrorMessage(err.message || 'Erro ao remover backup.');
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // MANIPULADORES DE RESTAURAÇÃO DE BACKUP (ETAPA 20.5)
  // ---------------------------------------------------------------------------

  const handleOpenRestoreModal = (backup: SystemBackup) => {
    setRestoreTarget(backup);
    setRestoreConfirmInput('');
    setRestoreErrorMessage(null);
    setRestoreProgress(null);
    setRestoreCompletedResult(null);

    const hasPhotos = backup.metadata?.include_photos !== false;
    const hasVideos = backup.metadata?.include_videos !== false;
    const hasDocs = backup.metadata?.include_documents !== false;

    setRestorePhotos(hasPhotos);
    setRestoreVideos(hasVideos);
    setRestoreDocuments(hasDocs);
    setIsConfirmRestoreModalOpen(true);
  };

  const handleCloseRestoreModal = () => {
    if (isExecutingRestore) return;
    setIsConfirmRestoreModalOpen(false);
    setRestoreConfirmInput('');
    setRestoreTarget(null);
    setRestoreErrorMessage(null);
  };

  const handleExecuteRestore = async () => {
    if (!restoreTarget || !user) return;

    if (restoreConfirmInput.trim().toUpperCase() !== 'RESTAURAR') {
      setRestoreErrorMessage('Digite a palavra "RESTAURAR" exatamente para liberar a confirmação.');
      return;
    }

    setIsConfirmRestoreModalOpen(false);
    setIsExecutingRestore(true);
    setRestoreErrorMessage(null);
    setRestoreCompletedResult(null);
    setRestoreProgress({
      step: 'validating',
      message: 'Iniciando protocolo de restauração segura...',
      detail: 'Verificando permissões administrativas e parâmetros',
      percent: 5,
    });

    try {
      const result = await backupService.executeRestore({
        backupId: restoreTarget.id,
        adminId: user.id,
        adminEmail: user.email || 'admin@sistema.local',
        adminName: profile?.full_name || 'Administrador',
        restorePhotos,
        restoreVideos,
        restoreDocuments,
        onProgress: (info) => {
          setRestoreProgress(info);
        },
      });

      setRestoreCompletedResult(result);
      setSuccessMessage(`Restauração concluída! ${result.totalRecordsRestored} registros e ${result.totalStorageFilesRestored} arquivos restabelecidos.`);
      await loadBackupData(true);
    } catch (err: any) {
      console.error('[AdminBackups] Erro ao executar restauração:', err);
      setRestoreErrorMessage(err.message || 'Falha durante o processo de restauração.');
    } finally {
      setIsExecutingRestore(false);
    }
  };

  const handleCloseRestoreProgressModal = () => {
    if (isExecutingRestore) return;
    setRestoreProgress(null);
    setRestoreCompletedResult(null);
    setRestoreErrorMessage(null);
    setRestoreTarget(null);
  };

  // Cálculo reativo em tempo real da próxima execução com base nos inputs atuais
  const liveCalculatedNextSchedule = useMemo(() => {
    if (!scheduledEnabled) return null;
    return calculateNextScheduledBackup({
      frequency: scheduleFrequency,
      time: scheduleTime,
      timezone: scheduleTimezone,
      dayOfWeek: scheduleDayOfWeek,
      dayOfMonth: scheduleDayOfMonth,
    });
  }, [scheduledEnabled, scheduleFrequency, scheduleTime, scheduleTimezone, scheduleDayOfWeek, scheduleDayOfMonth]);

  // Salvar configurações de agendamento automático
  const handleSaveSchedule = async () => {
    if (!user) return;
    setIsSavingSchedule(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await backupService.saveScheduleConfig({
        scheduled_enabled: scheduledEnabled,
        schedule_frequency: scheduleFrequency,
        schedule_time: scheduleTime,
        schedule_timezone: scheduleTimezone,
        schedule_day_of_week: scheduleDayOfWeek,
        schedule_day_of_month: scheduleDayOfMonth,
        adminId: user.id,
        adminEmail: user.email || 'admin@sistema.local',
      });

      setSuccessMessage(result.message);
      await loadBackupData(true);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('[AdminBackups] Falha ao salvar rotina de backup:', err);
      setErrorMessage(err.message || 'Falha ao salvar configurações de agendamento.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Disparo manual do teste do agendador server-side
  const handleTestScheduledBackup = async () => {
    if (!user) return;
    setIsTestingSchedule(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await backupService.triggerScheduledBackupTest(
        user.id,
        user.email || 'admin@sistema.local'
      );

      setSuccessMessage(`Teste do backup automático concluído com sucesso! Arquivo gerado: "${result.fileName || 'backup.zip'}" no Google Drive.`);
      await loadBackupData(true);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('[AdminBackups] Falha no teste do backup automático:', err);
      setErrorMessage(err.message || 'Falha ao testar execução automática do backup no servidor.');
    } finally {
      setIsTestingSchedule(false);
    }
  };

  // Helper de badges de status de backup
  const renderStatusBadge = (status: BackupStatus, verifiedStatus?: string) => {
    switch (status) {
      case 'completed':
        if (verifiedStatus === 'missing' || verifiedStatus === 'trashed') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <FileX className="w-3.5 h-3.5" />
              Arquivo Ausente no Drive
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluído
          </span>
        );
      case 'file_missing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Arquivo Ausente
          </span>
        );
      case 'verification_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            Verificação Necessária
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Processando
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Falha
          </span>
        );
      case 'restoring':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Restaurando
          </span>
        );
      case 'restored':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Restaurado
          </span>
        );
      case 'deleted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Trash2 className="w-3.5 h-3.5" />
            Excluído
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pendente
          </span>
        );
    }
  };

  // Helper do Status do Google Drive (Fonte de verdade: Edge Function serverStatus)
  const isDriveConnected = Boolean(
    serverStatus?.connected ||
    serverStatus?.status === 'connected' ||
    settings?.google_drive_connected
  );
  const isDriveAttention = Boolean(
    serverStatus?.status === 'reconnect_required' ||
    serverStatus?.status === 'attention' ||
    settings?.google_drive_status === 'attention'
  );
  const driveAccountEmail = serverStatus?.account_email || settings?.google_drive_account_email || null;
  const driveFolderName = serverStatus?.folder_name || settings?.google_drive_folder_name || 'Jucélia Santana Engenharia Civil — Backups';
  const driveFolderId = serverStatus?.folder_id || settings?.google_drive_folder_id || null;

  // Filtragem, Pesquisa e Ordenação em Memória
  const filteredBackups = useMemo(() => {
    return backups.filter((b) => {
      // 1. Busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = b.backup_name?.toLowerCase().includes(query);
        const matchFile = b.file_name?.toLowerCase().includes(query);
        const matchId = b.id?.toLowerCase().includes(query);
        const matchUser = b.profiles?.full_name?.toLowerCase().includes(query) || b.profiles?.email?.toLowerCase().includes(query);
        if (!matchName && !matchFile && !matchId && !matchUser) return false;
      }

      // 2. Filtro de Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && b.status !== 'completed') return false;
        if (statusFilter === 'failed' && b.status !== 'failed') return false;
        if (statusFilter === 'file_missing' && b.status !== 'file_missing') return false;
        if (statusFilter === 'pending' && b.status !== 'pending' && b.status !== 'processing') return false;
      }

      // 3. Filtro de Tipo
      if (typeFilter !== 'all') {
        if (b.backup_type !== typeFilter) return false;
      }

      // 4. Filtro de Período
      if (periodFilter !== 'all') {
        const createdAt = new Date(b.created_at).getTime();
        const now = Date.now();
        if (periodFilter === '24h' && now - createdAt > 24 * 60 * 60 * 1000) return false;
        if (periodFilter === '7d' && now - createdAt > 7 * 24 * 60 * 60 * 1000) return false;
        if (periodFilter === '30d' && now - createdAt > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'backup_name') {
        comparison = a.backup_name.localeCompare(b.backup_name);
      } else if (sortBy === 'file_size') {
        comparison = (a.file_size || 0) - (b.file_size || 0);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [backups, searchQuery, statusFilter, typeFilter, periodFilter, sortBy, sortOrder]);

  // Paginação dos dados
  const totalPages = Math.ceil(filteredBackups.length / itemsPerPage) || 1;
  const paginatedBackups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBackups.slice(start, start + itemsPerPage);
  }, [filteredBackups, currentPage, itemsPerPage]);

  // Checagem se o backup a ser excluído é o único válido
  const isOnlyValidBackup = useMemo(() => {
    if (!deleteTarget) return false;
    const validBackups = backups.filter(b => b.status === 'completed' && b.id !== deleteTarget.id);
    return deleteTarget.status === 'completed' && validBackups.length === 0;
  }, [backups, deleteTarget]);

  // Limpeza de filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPeriodFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || typeFilter !== 'all' || periodFilter !== 'all';

  // Se não for administrador, bloqueia a interface
  if (!isAdmin && !loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesso Restrito a Administradores</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          O gerenciamento de cópias de segurança e integração com o Google Drive requer privilégios administrativos ativos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-serif">
                Central de Backups
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Gerenciamento, verificação de integridade e histórico de cópias no Google Drive
              </p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas de Topo */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => loadBackupData(true)}
            disabled={refreshing || loading || isExecutingBackup || syncingDrive}
            className="px-3.5 py-2 rounded-xl bg-[#0B1526] border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            title="Atualizar lista e status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#C5A059]' : ''}`} />
            <span>Atualizar</span>
          </button>

          {isDriveConnected && (
            <button
              type="button"
              onClick={handleSyncWithDrive}
              disabled={syncingDrive || loading || isExecutingBackup}
              className="px-3.5 py-2 rounded-xl bg-[#0B1526] border border-sky-500/20 text-sky-300 hover:text-white hover:bg-sky-500/10 transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              title="Sincronizar e checar existência dos arquivos no Google Drive"
            >
              <FileCheck className={`w-3.5 h-3.5 ${syncingDrive ? 'animate-spin text-sky-400' : 'text-sky-400'}`} />
              <span>{syncingDrive ? 'Sincronizando...' : 'Sincronizar com Drive'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            disabled={isExecutingBackup}
            className="px-3.5 py-2 rounded-xl bg-[#0B1526] border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            title="Configurações de retenção e provedor"
          >
            <Settings className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Configurações</span>
          </button>

          {/* Botão Fazer Backup Agora */}
          <button
            type="button"
            disabled={!isDriveConnected || isExecutingBackup}
            onClick={() => setIsConfirmBackupModalOpen(true)}
            className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              isDriveConnected && !isExecutingBackup
                ? 'bg-gradient-to-r from-[#C5A059] to-[#dfba74] hover:from-[#d4b06a] hover:to-[#ebc886] text-black shadow-[#C5A059]/20 hover:shadow-[#C5A059]/30 hover:scale-[1.02] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60'
            }`}
            title={!isDriveConnected ? 'Conecte o Google Drive para habilitar a execução de backups' : 'Executar novo backup manual'}
          >
            <HardDrive className="w-4 h-4" />
            <span>{isExecutingBackup ? 'Processando...' : 'Fazer Backup Agora'}</span>
          </button>
        </div>
      </div>

      {/* Mensagens de Feedback Globais */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 text-rose-300 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alertas Ativos do Health Check (Etapa 20.7) */}
      {healthCheck && healthCheck.warnings && healthCheck.warnings.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-amber-200 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Avisos de Integridade e Governança do Sistema:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11px]">
            {healthCheck.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 1. CARDS DE MÉTRICAS E INDICADORES (ETAPA 20.4) */}
      {/* ============================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Backups & Espaço */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Backups</span>
            <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {metrics?.totalBackups ?? backups.length}
              </span>
              <span className="text-xs text-slate-400">registros</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Espaço total:</span>
              <strong className="text-slate-200 font-mono">
                {backupService.formatBytes(metrics?.totalSizeBytes || 0)}
              </strong>
            </p>
          </div>
        </div>

        {/* Card 2: Último Backup Concluído */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Último Backup Válido</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            {metrics?.latestValidBackup ? (
              <>
                <span className="text-sm font-bold text-white block truncate" title={metrics.latestValidBackup.backup_name}>
                  {metrics.latestValidBackup.backup_name}
                </span>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {new Date(metrics.latestValidBackup.completed_at || metrics.latestValidBackup.created_at).toLocaleString('pt-BR')}
                  </span>
                </p>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-slate-400 block">Nenhum backup concluído</span>
                <p className="text-xs text-slate-500">Gere o primeiro pacote</p>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Integridade & Saúde */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saúde do Sistema</span>
            <div className={`p-2 rounded-xl border ${
              healthCheck?.overallStatus === 'healthy'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : healthCheck?.overallStatus === 'warning'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                healthCheck?.overallStatus === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : healthCheck?.overallStatus === 'warning'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  healthCheck?.overallStatus === 'healthy'
                    ? 'bg-emerald-400'
                    : healthCheck?.overallStatus === 'warning'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`} />
                {healthCheck?.overallStatus === 'healthy'
                  ? 'Operacional'
                  : healthCheck?.overallStatus === 'warning'
                  ? 'Requer Atenção'
                  : 'Falha Detectada'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 pt-1">
              <span>{metrics?.completedBackups || 0} válidos</span>
              {metrics?.missingBackups && metrics.missingBackups > 0 ? (
                <span className="text-amber-400 font-medium">⚠️ {metrics.missingBackups} ausentes</span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Card 4: Destino do Google Drive */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destino Oficial</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Cloud className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isDriveConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Google Drive Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Não Conectado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 truncate" title={driveAccountEmail || ''}>
              {driveAccountEmail || 'Nenhuma conta vinculada'}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 2. CARD DO GOOGLE DRIVE & GOVERNANÇA */}
      {/* ============================================================================== */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white">Armazenamento em Nuvem</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  Google Drive Oficial deste Site
                </span>
              </div>
              <p className="text-xs text-slate-400">
                O administrador escolhe sua própria conta Google através do OAuth oficial para armazenar os backups
              </p>
            </div>
          </div>
        </div>

        {/* Detalhes da Conexão */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-1.5">
            <span className="text-slate-400 font-medium block">Provedor Oficial</span>
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Cloud className="w-4 h-4 text-sky-400" />
              <span>Google Drive</span>
            </div>
            <p className="text-[11px] text-slate-500">Escopo restrito exclusivo para backups</p>
          </div>

          <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-1.5">
            <span className="text-slate-400 font-medium block">Status da Conexão</span>
            <div>
              {isDriveConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  🟢 Conectado
                </span>
              ) : isDriveAttention ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  🟡 Requer Atenção
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" />
                  🔴 Não Conectado
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {isDriveConnected ? 'Autorização OAuth validada' : 'Aguardando autenticação'}
            </p>
          </div>

          <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-1.5">
            <span className="text-slate-400 font-medium block">Conta Google Autorizada</span>
            <div className="flex items-center gap-1.5 text-white font-medium truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate" title={driveAccountEmail || ''}>
                {driveAccountEmail || 'Nenhuma conta vinculada'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {settings?.google_drive_connected_by_email
                ? `Autorizado por: ${settings.google_drive_connected_by_email}`
                : 'Não registrado'}
            </p>
          </div>

          <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-1.5">
            <span className="text-slate-400 font-medium block">Pasta no Drive</span>
            <div className="flex items-center gap-1.5 text-white font-medium truncate">
              <FolderCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <span className="truncate" title={driveFolderName}>
                {driveFolderName}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate font-mono">
              {driveFolderId ? `ID: ${driveFolderId}` : 'Pasta na conta escolhida'}
            </p>
          </div>
        </div>

        {/* Barra de Botões de Ação da Integração */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2.5 flex-wrap">
            {!isDriveConnected ? (
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={connecting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-950/50 transition-all cursor-pointer disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Conectando ao Google...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Conectar Google Drive</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleVerifyConnection}
                  disabled={verifying || isExecutingBackup}
                  className="px-4 py-2.5 rounded-xl bg-[#070D18] border border-white/15 text-slate-200 hover:text-white hover:bg-white/5 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin text-[#C5A059]' : 'text-sky-400'}`} />
                  <span>{verifying ? 'Verificando com Google Drive...' : 'Verificar conexão'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSwitchAccountModalOpen(true)}
                  disabled={connecting || isExecutingBackup}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Alterar conta Google Drive</span>
                </button>
              </>
            )}
          </div>

          {isDriveConnected && (
            <button
              type="button"
              onClick={() => setIsDisconnectModalOpen(true)}
              disabled={isExecutingBackup}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5 text-rose-400" />
              <span>Desconectar</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 2.1 CARD DE ROTINA E AGENDAMENTO AUTOMÁTICO (ETAPA 20.6) */}
      {/* ============================================================================== */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 space-y-6 shadow-lg relative overflow-hidden">
        {/* Cabeçalho da Seção de Agendamento */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white">Rotina e Agendamento Automático</h2>
                {scheduledEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Rotina Automática Ativa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-white/10">
                    Rotina Desativada
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                O servidor executa o backup periodicamente em segundo plano e realiza upload direto ao Google Drive
              </p>
            </div>
          </div>

          {/* Toggle Principal de Ativação */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-[#070D18] px-4 py-2 rounded-xl border border-white/10">
            <span className="text-xs font-semibold text-slate-300">
              {scheduledEnabled ? 'Agendador Ligado' : 'Agendador Desligado'}
            </span>
            <button
              type="button"
              disabled={!isDriveConnected}
              onClick={() => setScheduledEnabled(!scheduledEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                scheduledEnabled ? 'bg-[#C5A059]' : 'bg-slate-700'
              }`}
              title={!isDriveConnected ? 'Conecte o Google Drive para ativar o backup automático' : 'Alternar agendador'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  scheduledEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Alerta caso Google Drive não esteja conectado */}
        {!isDriveConnected && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300">Google Drive Necessário para Backups Automáticos</span>
              <p className="leading-relaxed text-[11.5px] text-amber-200/90">
                Para que o servidor consiga salvar as cópias automáticas em segundo plano, conecte sua conta Google no card acima.
              </p>
            </div>
          </div>
        )}

        {/* Formulário de Configuração de Parâmetros */}
        <div className={`space-y-5 transition-opacity ${!scheduledEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* 1. Seleção de Frequência */}
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-2.5">
              <label className="block font-semibold text-slate-200">Frequência de Execução</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setScheduleFrequency(freq)}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer capitalize text-center ${
                      scheduleFrequency === freq
                        ? 'bg-[#C5A059] text-black shadow-md'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {freq === 'daily' ? 'Diário' : freq === 'weekly' ? 'Semanal' : 'Mensal'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                {scheduleFrequency === 'daily' && 'Executa todos os dias no horário programado.'}
                {scheduleFrequency === 'weekly' && 'Executa 1 vez por semana no dia escolhido.'}
                {scheduleFrequency === 'monthly' && 'Executa 1 vez por mês no dia configurado.'}
              </p>
            </div>

            {/* 2. Seleção de Dia (Semanal ou Mensal) */}
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-2.5">
              <label className="block font-semibold text-slate-200">
                {scheduleFrequency === 'daily'
                  ? 'Dias da Semana'
                  : scheduleFrequency === 'weekly'
                  ? 'Dia da Semana'
                  : 'Dia do Mês'}
              </label>

              {scheduleFrequency === 'daily' && (
                <div className="py-2 text-slate-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Todos os 7 dias da semana (Segunda a Domingo)</span>
                </div>
              )}

              {scheduleFrequency === 'weekly' && (
                <select
                  value={scheduleDayOfWeek}
                  onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0B1526] border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-[#C5A059] cursor-pointer"
                >
                  {WEEKDAYS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              )}

              {scheduleFrequency === 'monthly' && (
                <select
                  value={scheduleDayOfMonth}
                  onChange={(e) => setScheduleDayOfMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0B1526] border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-[#C5A059] cursor-pointer"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Dia {day} de cada mês
                    </option>
                  ))}
                </select>
              )}

              <p className="text-[11px] text-slate-400">
                {scheduleFrequency === 'weekly' && 'Recomendado: Domingos ou Segundas de madrugada.'}
                {scheduleFrequency === 'monthly' && 'Fixado entre os dias 1 e 28 para compatibilidade com todos os meses.'}
              </p>
            </div>

            {/* 3. Horário e Fuso Horário */}
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-2.5">
              <label className="block font-semibold text-slate-200">Horário e Fuso Horário</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0B1526] border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-[#C5A059] font-mono cursor-pointer"
                />
                <select
                  value={scheduleTimezone}
                  onChange={(e) => setScheduleTimezone(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0B1526] border border-white/15 rounded-lg text-[11px] text-white focus:outline-none focus:border-[#C5A059] cursor-pointer"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.value}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400">
                Recomendado: <strong>02:00</strong> às <strong>04:00</strong> da madrugada (menor tráfego no servidor).
              </p>
            </div>
          </div>

          {/* Painel Informativo da Próxima Execução Calculada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#070D18] to-[#0B1526] border border-[#C5A059]/30 p-4 rounded-xl flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block">
                  Próxima Execução Prevista (Cálculo Automático)
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white block truncate">
                  {liveCalculatedNextSchedule
                    ? `${liveCalculatedNextSchedule.formattedDateOnly} às ${liveCalculatedNextSchedule.formattedTimeOnly}`
                    : 'Agendador Desativado'}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono truncate">
                  Fuso: {scheduleTimezone}
                </span>
              </div>
            </div>

            {/* Painel do Histórico do Último Backup Agendado */}
            <div className="bg-[#070D18] border border-white/10 p-4 rounded-xl flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                settings?.last_scheduled_status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : settings?.last_scheduled_status === 'failed'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}>
                <History className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Última Execução Automática
                </span>
                <span className="text-xs sm:text-sm font-bold text-white block truncate">
                  {settings?.last_scheduled_backup_at
                    ? new Date(settings.last_scheduled_backup_at).toLocaleString('pt-BR')
                    : 'Nenhuma execução agendada realizada'}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  Status:{' '}
                  {settings?.last_scheduled_status === 'completed' ? (
                    <strong className="text-emerald-400 font-semibold">Sucesso</strong>
                  ) : settings?.last_scheduled_status === 'failed' ? (
                    <strong className="text-rose-400 font-semibold">Falha</strong>
                  ) : (
                    'Pendente'
                  )}
                  {settings?.last_scheduled_duration_ms ? ` (${(settings.last_scheduled_duration_ms / 1000).toFixed(1)}s)` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação do Agendador */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Motor cron persistente no servidor com reexecução e idempotência ativas.</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={isTestingSchedule || isSavingSchedule || isExecutingBackup || !isDriveConnected}
              onClick={handleTestScheduledBackup}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Dispara uma execução teste imediata usando as regras automáticas do servidor"
            >
              {isTestingSchedule ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                  <span>Testando Agendador...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Testar Backup Automático Agora</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSavingSchedule || isTestingSchedule}
              onClick={handleSaveSchedule}
              className="px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4b06a] text-black font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingSchedule ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Salvando Configuração...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Configurações de Agendamento</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 3. BARRA DE FILTROS, BUSCA E FERRAMENTAS (ETAPA 20.4) */}
      {/* ============================================================================== */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Campo de Busca Textual */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nome do backup, arquivo ZIP ou ID..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#070D18] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros Dropdown */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Filtro Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-[#070D18] border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#C5A059] cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">🟢 Concluídos</option>
              <option value="failed">🔴 Falhas</option>
              <option value="file_missing">⚪ Arquivo Ausente</option>
              <option value="pending">🟡 Pendentes</option>
            </select>

            {/* Filtro Tipo */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-[#070D18] border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#C5A059] cursor-pointer"
            >
              <option value="all">Todos os Tipos</option>
              <option value="manual">Manual</option>
              <option value="scheduled">Agendado</option>
            </select>

            {/* Filtro Período */}
            <select
              value={periodFilter}
              onChange={(e) => {
                setPeriodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-[#070D18] border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#C5A059] cursor-pointer"
            >
              <option value="all">Todo o Período</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </select>

            {/* Ordenação */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2.5 bg-[#070D18] border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title={sortOrder === 'desc' ? 'Ordenação decrescente (mais recente)' : 'Ordenação crescente (mais antigo)'}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Limpar todos os filtros"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 4. TABELA / HISTÓRICO DE BACKUPS GERENCIÁVEIS (ETAPA 20.4) */}
      {/* ============================================================================== */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl overflow-hidden shadow-lg space-y-0">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#C5A059]" />
            <div>
              <h3 className="text-base font-bold text-white">Histórico e Governança de Backups</h3>
              <p className="text-xs text-slate-400">
                {filteredBackups.length} registro(s) encontrado(s) {hasActiveFilters && '(com filtros ativos)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Exibir por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-[#070D18] border border-white/10 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Carregando registros de backup do Supabase...</p>
          </div>
        ) : filteredBackups.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
              <Database className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-white">
                {hasActiveFilters ? 'Nenhum backup corresponde aos filtros' : 'Nenhum backup realizado'}
              </h4>
              <p className="text-xs text-slate-400">
                {hasActiveFilters
                  ? 'Tente ajustar ou limpar seus filtros de pesquisa para visualizar outros registros.'
                  : isDriveConnected
                  ? 'Clique em "Fazer Backup Agora" para gerar e enviar o primeiro pacote de dados ao Google Drive.'
                  : 'Conecte o Google Drive para iniciar o armazenamento dos seus backups.'}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Limpar Filtros</span>
              </button>
            ) : isDriveConnected && (
              <button
                type="button"
                onClick={() => setIsConfirmBackupModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#C5A059] text-black font-bold text-xs hover:bg-[#d4b06a] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4" />
                <span>Fazer Primeiro Backup</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#08101E] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Nome do Backup / Arquivo</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Tamanho</th>
                  <th className="py-3 px-4">Status & Integridade</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Data / Horário</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedBackups.map((b) => {
                  const driveViewLink =
                    (b.metadata as any)?.google_drive_view_link ||
                    (b.file_id ? `https://drive.google.com/file/d/${b.file_id}/view` : null);

                  const isVerifyingThis = verifyingFileId === b.id;
                  const verifiedStatus = (b.metadata as any)?.last_verified_status;

                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="space-y-1">
                          <span className="block">{b.backup_name}</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {b.file_name && (
                              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                <FileArchive className="w-3 h-3 text-[#C5A059]" />
                                {b.file_name}
                              </span>
                            )}
                            {b.metadata?.include_photos !== false && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 font-semibold text-[9.5px] inline-flex items-center gap-0.5" title="Contém fotos do sistema">
                                <Image className="w-2.5 h-2.5" /> Fotos
                              </span>
                            )}
                            {b.metadata?.include_videos !== false && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 font-semibold text-[9.5px] inline-flex items-center gap-0.5" title="Contém vídeos de obras">
                                <Video className="w-2.5 h-2.5" /> Vídeos
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.backup_type === 'scheduled'
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                        }`}>
                          {b.backup_type === 'scheduled' ? 'Agendado' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {backupService.formatBytes(b.file_size)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {renderStatusBadge(b.status, verifiedStatus)}
                          {b.metadata?.sha256_checksum && (
                            <span className="block text-[10px] text-slate-500 font-mono truncate max-w-[120px]" title={b.metadata.sha256_checksum}>
                              SHA: {b.metadata.sha256_checksum.substring(0, 10)}...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{b.profiles?.full_name || b.profiles?.email || 'Administrador'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(b.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ação 1: Abrir no Google Drive */}
                          {driveViewLink && (
                            <a
                              href={driveViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 border border-sky-500/20 transition-all inline-flex items-center gap-1 font-medium text-[11px]"
                              title="Abrir arquivo no Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Drive</span>
                            </a>
                          )}

                          {/* Ação 2: Verificar Arquivo no Drive */}
                          {b.file_id && (
                            <button
                              type="button"
                              onClick={() => handleVerifySingleBackup(b)}
                              disabled={isVerifyingThis || isExecutingBackup}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                              title="Verificar se arquivo ainda existe no Google Drive"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingThis ? 'animate-spin text-[#C5A059]' : 'text-slate-400'}`} />
                            </button>
                          )}

                          {/* Ação 3: Ver Detalhes e Metadados */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBackup(b);
                              setIntegrityResult(null);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Ver Detalhes e Metadados"
                          >
                            <Info className="w-4 h-4 text-[#C5A059]" />
                          </button>

                          {/* Ação 4: Restaurar Backup (Etapa 20.5) */}
                          {(b.status === 'completed' || b.status === 'restored') && b.file_id && verifiedStatus !== 'missing' && verifiedStatus !== 'trashed' && (
                            <button
                              type="button"
                              onClick={() => handleOpenRestoreModal(b)}
                              disabled={isExecutingRestore || isExecutingBackup || !isDriveConnected}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-all inline-flex items-center gap-1 font-semibold text-[11px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title={
                                !isDriveConnected
                                  ? 'Conecte o Google Drive para restaurar'
                                  : 'Restaurar banco de dados e arquivos deste backup'
                              }
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Restaurar</span>
                            </button>
                          )}

                          {/* Ação 5: Excluir Backup com Segurança */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(b)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                            title="Excluir Backup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé da Tabela com Paginação */}
        {filteredBackups.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-[#08101E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Exibindo <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> a{' '}
              <strong>{Math.min(currentPage * itemsPerPage, filteredBackups.length)}</strong> de{' '}
              <strong>{filteredBackups.length}</strong> registro(s)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-white/5 rounded-lg text-white font-semibold">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* 5. MODAIS DO SISTEMA */}
      {/* ============================================================================== */}

      {/* 5.0 MODAL DE CONFIRMAÇÃO DO BACKUP MANUAL (ETAPA 20.3) */}
      {isConfirmBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-[#C5A059]/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3 text-[#C5A059]">
                <div className="p-3 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20">
                  <HardDrive className="w-6 h-6 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Criar Backup do Sistema</h3>
                  <p className="text-xs text-slate-400">Escolha o conteúdo e envie com segurança ao Google Drive</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmBackupModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                Selecione quais mídias e arquivos deseja empacotar neste backup. Os dados essenciais do banco de dados são sempre incluídos para garantir a integridade do sistema.
              </p>

              {/* Seleção de Mídia e Conteúdo */}
              <div className="space-y-2.5">
                <span className="font-semibold text-white block text-xs flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#C5A059]" /> O que deseja incluir no backup?
                </span>

                {/* Opção Fixo: Banco de Dados */}
                <div className="p-3 bg-[#070D18] rounded-xl border border-emerald-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Banco de Dados PostgreSQL (Supabase)</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        Obrigatório
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      10 tabelas relacionais: projetos, imagens, artigos do blog, contatos, perfis e configurações.
                    </p>
                  </div>
                </div>

                {/* Opção Selecionável: Fotos e Imagens */}
                <label className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                  includePhotos
                    ? 'bg-[#070D18] border-[#C5A059]/40 shadow-sm shadow-[#C5A059]/5'
                    : 'bg-[#070D18]/50 border-white/10 opacity-70 hover:opacity-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-[#C5A059] focus:ring-[#C5A059] bg-slate-900 cursor-pointer accent-[#C5A059]"
                  />
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                    <Image className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Fotos e Imagens</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        includePhotos ? 'bg-sky-500/20 text-sky-300' : 'bg-white/5 text-slate-500'
                      }`}>
                        {includePhotos ? 'Incluso' : 'Ignorado'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fotos de projetos, galerias de obras, capas e artigos do blog, hero images e fotos de perfil.
                    </p>
                  </div>
                </label>

                {/* Opção Selecionável: Vídeos de Projetos */}
                <label className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                  includeVideos
                    ? 'bg-[#070D18] border-[#C5A059]/40 shadow-sm shadow-[#C5A059]/5'
                    : 'bg-[#070D18]/50 border-white/10 opacity-70 hover:opacity-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={includeVideos}
                    onChange={(e) => setIncludeVideos(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-[#C5A059] focus:ring-[#C5A059] bg-slate-900 cursor-pointer accent-[#C5A059]"
                  />
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Vídeos de Obras e Projetos</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        includeVideos ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500'
                      }`}>
                        {includeVideos ? 'Incluso' : 'Ignorado'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Vídeos demonstrativos de projetos e arquivos de vídeo de obras armazenados no Storage.
                    </p>
                  </div>
                </label>

                {/* Opção Selecionável: Documentos e Anexos */}
                <label className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                  includeDocuments
                    ? 'bg-[#070D18] border-white/20'
                    : 'bg-[#070D18]/50 border-white/10 opacity-70 hover:opacity-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={includeDocuments}
                    onChange={(e) => setIncludeDocuments(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-[#C5A059] focus:ring-[#C5A059] bg-slate-900 cursor-pointer accent-[#C5A059]"
                  />
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Documentos e Anexos</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        includeDocuments ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-500'
                      }`}>
                        {includeDocuments ? 'Incluso' : 'Ignorado'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Arquivos PDF, memoriais técnicos e documentos cadastrados no Storage.
                    </p>
                  </div>
                </label>
              </div>

              {/* Resumo do tipo de backup configurado */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Modo de Empacotamento:</span>
                <span className="font-bold text-[#C5A059] flex items-center gap-1.5">
                  {includePhotos && includeVideos ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Completo (Banco + Fotos + Vídeos)</span>
                    </>
                  ) : includePhotos && !includeVideos ? (
                    <>
                      <Image className="w-3.5 h-3.5 text-sky-400" />
                      <span>Banco de Dados + Fotos</span>
                    </>
                  ) : !includePhotos && includeVideos ? (
                    <>
                      <Video className="w-3.5 h-3.5 text-purple-400" />
                      <span>Banco de Dados + Vídeos</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Compacto Rápido (Apenas Banco de Dados)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <span>Destino no Google Drive:</span>
                </div>
                <span className="font-semibold text-slate-200 truncate max-w-[220px]" title={settings?.google_drive_folder_name || 'Backups'}>
                  {settings?.google_drive_folder_name || 'Jucélia Santana Engenharia Civil — Backups'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsConfirmBackupModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteManualBackup}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#dfba74] text-black text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-black/40 hover:brightness-110 cursor-pointer"
              >
                <HardDrive className="w-4 h-4" />
                <span>Iniciar Backup Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.1 MODAL DE PROGRESSO E RESULTADO DO BACKUP MANUAL (ETAPA 20.3) */}
      {isExecutingBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            {/* Cabeçalho do Modal de Progresso */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  backupProgress?.step === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : backupProgress?.step === 'failed'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20'
                }`}>
                  {backupProgress?.step === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : backupProgress?.step === 'failed' ? (
                    <XCircle className="w-6 h-6" />
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {backupProgress?.step === 'completed'
                      ? 'Backup Concluído com Sucesso!'
                      : backupProgress?.step === 'failed'
                      ? 'Falha no Processamento do Backup'
                      : 'Executando Backup Manual'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {backupProgress?.step === 'completed'
                      ? backupCompletedResult?.fileName
                      : 'Processamento e envio ao Google Drive'}
                  </p>
                </div>
              </div>

              {(backupProgress?.step === 'completed' || backupProgress?.step === 'failed') && (
                <button
                  type="button"
                  onClick={handleCloseProgressModal}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Barra de Progresso Real */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {backupProgress?.message || 'Aguarde o processamento...'}
                </span>
                <span className="font-mono font-bold text-[#C5A059]">
                  {backupProgress?.percent ?? 0}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-300 ${
                    backupProgress?.step === 'completed'
                      ? 'bg-emerald-500'
                      : backupProgress?.step === 'failed'
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-[#C5A059] to-[#ebd19c]'
                  }`}
                  style={{ width: `${backupProgress?.percent ?? 10}%` }}
                />
              </div>
            </div>

            {/* Linhas de Etapas do Processo */}
            <div className="space-y-2.5 text-xs bg-[#070D18] p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2.5 text-slate-300">
                {backupProgress?.percent && backupProgress.percent >= 15 ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>1. Validação de credenciais e integridade administrativa</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                {backupProgress?.percent && backupProgress.percent >= 35 ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>2. Exportação de todas as tabelas do banco de dados</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                {backupProgress?.percent && backupProgress.percent >= 60 ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>3. Download e inclusão de mídias do Supabase Storage</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                {backupProgress?.percent && backupProgress.percent >= 80 ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>4. Compactação ZIP e cálculo de hashes SHA-256</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                {backupProgress?.percent && backupProgress.percent === 100 && backupProgress.step === 'completed' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>5. Envio real e registro do arquivo no Google Drive</span>
              </div>
            </div>

            {/* Sucesso Detalhado */}
            {backupProgress?.step === 'completed' && backupCompletedResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Pacote Registrado com Sucesso
                </span>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  <p><strong>Tamanho:</strong> {backupService.formatBytes(backupCompletedResult.fileSize)}</p>
                  <p className="truncate"><strong>SHA-256:</strong> {backupCompletedResult.sha256}</p>
                </div>
              </div>
            )}

            {/* Erro Detalhado */}
            {backupProgress?.step === 'failed' && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-xs text-rose-200">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" /> Erro na Operação
                </span>
                <p>{backupProgress.detail || backupProgress.message}</p>
              </div>
            )}

            {/* Rodapé e Botões */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              {backupProgress?.step === 'completed' && backupCompletedResult ? (
                <>
                  <a
                    href={backupCompletedResult.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir no Google Drive</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCloseProgressModal}
                    className="px-4 py-2 rounded-xl bg-[#C5A059] text-black font-bold text-xs hover:bg-[#d4b06a] transition-all cursor-pointer"
                  >
                    Concluir
                  </button>
                </>
              ) : backupProgress?.step === 'failed' ? (
                <>
                  <button
                    type="button"
                    onClick={handleCloseProgressModal}
                    className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/15 text-xs font-semibold"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteManualBackup}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar Novamente</span>
                  </button>
                </>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                  <span>Por favor, não feche esta janela durante o upload...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5.2 MODAL DE ALTERAR CONTA GOOGLE DRIVE */}
      {isSwitchAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-[#C5A059]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#C5A059]">
              <div className="p-2.5 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Alterar Conta Google Drive</h3>
                <p className="text-xs text-slate-400">Substituir a conta oficial de destino dos backups</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-white/10 rounded-xl space-y-2 text-xs text-slate-300">
              <span className="font-semibold text-[#C5A059] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Política de Preservação
              </span>
              <p className="text-slate-300 leading-relaxed">
                Os backups existentes na conta anterior <strong>não serão apagados</strong>. Os próximos backups serão enviados para a nova conta autorizada.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={connecting}
                onClick={() => setIsSwitchAccountModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={connecting}
                onClick={handleConnectGoogleDrive}
                className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#d4b06a] text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Abrindo Google...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Continuar para o Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.3 MODAL DE DESCONECTAR GOOGLE DRIVE */}
      {isDisconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Unlink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Desconectar Google Drive</h3>
                <p className="text-xs text-slate-400">Confirmação administrativa de desconexão</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja desconectar o Google Drive?
            </p>

            <div className="p-3 bg-slate-900 border border-white/5 rounded-xl text-[11px] text-slate-300 space-y-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Segurança dos Dados
              </span>
              <p className="text-slate-400">
                Desconectar <strong>NÃO</strong> apagará os arquivos de backup já existentes na sua pasta do Google Drive.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={disconnecting}
                onClick={() => setIsDisconnectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={disconnecting}
                onClick={handleDisconnectGoogleDrive}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {disconnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Desconectando...</span>
                  </>
                ) : (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Confirmar Desconexão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.4 MODAL DE DETALHES, INTEGRIDADE E METADADOS DO BACKUP (ETAPA 20.4) */}
      {selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedBackup.backup_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedBackup.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBackup(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400">Status Geral</span>
                <div>{renderStatusBadge(selectedBackup.status, (selectedBackup.metadata as any)?.last_verified_status)}</div>
              </div>
              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400">Provedor</span>
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                  {selectedBackup.storage_provider === 'google_drive' ? 'Google Drive' : 'Export Local'}
                </p>
              </div>
              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400">Tipo</span>
                <p className="font-semibold text-white">
                  {selectedBackup.backup_type === 'scheduled' ? 'Agendado Automático' : 'Manual'}
                </p>
              </div>
              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400">Tamanho</span>
                <p className="font-semibold text-white font-mono">
                  {backupService.formatBytes(selectedBackup.file_size)}
                </p>
              </div>
              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400">Data de Criação</span>
                <p className="font-semibold text-white">
                  {new Date(selectedBackup.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400">Responsável</span>
                <p className="font-semibold text-white truncate" title={selectedBackup.profiles?.email || ''}>
                  {selectedBackup.profiles?.full_name || selectedBackup.profiles?.email || 'Administrador'}
                </p>
              </div>
            </div>

            {/* Seção de Verificação e Integridade */}
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Integridade e Validação Criptográfica
                </span>
                <button
                  type="button"
                  onClick={() => handleValidateIntegrity(selectedBackup.id)}
                  disabled={isValidatingIntegrity}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isValidatingIntegrity ? 'animate-spin text-[#C5A059]' : ''}`} />
                  <span>{isValidatingIntegrity ? 'Validando...' : 'Revalidar Integridade'}</span>
                </button>
              </div>

              <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                <p className="break-all">
                  <strong className="text-slate-400 font-sans">Checksum SHA-256: </strong>
                  {selectedBackup.metadata?.sha256_checksum || 'Não informado'}
                </p>
                <p>
                  <strong className="text-slate-400 font-sans">Tabelas Inclusas: </strong>
                  {selectedBackup.metadata?.tables_included?.join(', ') || 'Todas as tabelas do banco'}
                </p>
                <p>
                  <strong className="text-slate-400 font-sans">Total de Registros: </strong>
                  {selectedBackup.metadata?.total_records ?? 'N/D'}
                </p>
                <p>
                  <strong className="text-slate-400 font-sans">Fotos no Storage: </strong>
                  {selectedBackup.metadata?.include_photos === false
                    ? 'Não incluído'
                    : selectedBackup.metadata?.photos_count !== undefined
                    ? `${selectedBackup.metadata.photos_count} fotos`
                    : 'Incluído'}
                </p>
                <p>
                  <strong className="text-slate-400 font-sans">Vídeos no Storage: </strong>
                  {selectedBackup.metadata?.include_videos === false
                    ? 'Não incluído'
                    : selectedBackup.metadata?.videos_count !== undefined
                    ? `${selectedBackup.metadata.videos_count} vídeos`
                    : 'Incluído'}
                </p>
                <p>
                  <strong className="text-slate-400 font-sans">Arquivos do Storage: </strong>
                  {selectedBackup.metadata?.total_storage_files ?? 'N/D'}
                </p>
              </div>

              {integrityResult && (
                <div className={`p-3 rounded-xl text-xs ${
                  integrityResult.valid
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}>
                  <p className="font-semibold">{integrityResult.message}</p>
                </div>
              )}
            </div>

            {/* Metadados Técnicos JSON */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-[#C5A059]" /> Metadados Técnicos Estruturados
              </span>
              <pre className="p-3 bg-[#070D18] border border-white/5 rounded-xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-40">
                {JSON.stringify(selectedBackup.metadata, null, 2)}
              </pre>
            </div>

            {/* Botões do Rodapé do Modal */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-2">
                {(selectedBackup.metadata as any)?.google_drive_view_link || selectedBackup.file_id ? (
                  <a
                    href={
                      (selectedBackup.metadata as any)?.google_drive_view_link ||
                      `https://drive.google.com/file/d/${selectedBackup.file_id}/view`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver no Drive</span>
                  </a>
                ) : null}

                {(selectedBackup.status === 'completed' || selectedBackup.status === 'restored') && selectedBackup.file_id && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBackup;
                      setSelectedBackup(null);
                      handleOpenRestoreModal(b);
                    }}
                    disabled={isExecutingRestore || isExecutingBackup || !isDriveConnected}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Este Backup</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBackup(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 font-semibold text-xs transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.6 MODAL DE EXCLUSÃO SEGURA DE BACKUP (ETAPA 20.4) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Cópia de Backup</h3>
                <p className="text-xs text-slate-400">Ação administrativa auditada</p>
              </div>
            </div>

            {/* ALERTA CRÍTICO: SE FOR O ÚNICO BACKUP VÁLIDO */}
            {isOnlyValidBackup && (
              <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl space-y-1.5 text-xs text-rose-200">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                  ALERTA DE SEGURANÇA CRÍTICO
                </span>
                <p className="leading-relaxed">
                  Este é o <strong>único backup válido disponível</strong> no sistema. Excluí-lo deixará o site sem nenhuma cópia de restauração recente em caso de desastres.
                </p>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja realmente remover o backup <strong className="text-white font-semibold">"{deleteTarget.backup_name}"</strong>?
            </p>

            {deleteTarget.file_id && (
              <div className="p-3 bg-[#070D18] border border-white/10 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={deleteFromDrive}
                    onChange={(e) => setDeleteFromDrive(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-[#C5A059] focus:ring-0"
                  />
                  <span>Excluir também o arquivo ZIP permanentemente do Google Drive</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteBackup}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.7 MODAL DE CONFIGURAÇÕES DE BACKUP */}
      {isSettingsOpen && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059]">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Configurações de Backup</h3>
                  <p className="text-xs text-slate-400">Parâmetros em public.site_settings (backup_settings)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400 block font-medium">Destino Oficial do Site</span>
                <p className="font-bold text-white">Google Drive (1 Conexão Oficial Ativa)</p>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400 block font-medium">Pasta Padrão no Drive</span>
                <p className="font-mono text-slate-200">{settings.google_drive_folder_name}</p>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400 block font-medium">Política de Retenção Padrão</span>
                <p className="font-semibold text-slate-200">{settings.retention_days} dias</p>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-400 block font-medium">Agendamento Automático</span>
                <p className="font-semibold text-slate-200">
                  {settings.scheduled_enabled
                    ? `Ativo — Frequência ${settings.schedule_frequency || 'daily'} às ${settings.schedule_time || '02:00'} (${settings.schedule_timezone || 'America/Sao_Paulo'})`
                    : 'Desativado'}
                </p>
              </div>

              <div className="p-3 bg-[#070D18] border border-white/5 rounded-xl text-slate-300 space-y-1">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" /> Status da Integração
                </span>
                <p className="text-[11px] leading-relaxed">
                  {isDriveConnected
                    ? `Conectado à conta ${settings.google_drive_account_email || ''} por ${settings.google_drive_connected_by_email || 'Administrador'}`
                    : 'Google Drive não conectado atualmente.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#C5A059] text-black font-bold text-xs hover:bg-[#d4b06a] transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.8 MODAL DE CONFIRMAÇÃO REFORÇADA DE RESTAURAÇÃO (ETAPA 20.5) */}
      {isConfirmRestoreModalOpen && restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Restauração de Backup do Sistema</h3>
                  <p className="text-xs text-amber-400/90 font-medium">Recuperação de Banco de Dados e Arquivos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseRestoreModal}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações do Backup Alvo */}
            <div className="p-4 bg-[#070D18] border border-white/10 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Backup Selecionado:</span>
                <span className="font-bold text-white truncate max-w-[240px]" title={restoreTarget.backup_name}>
                  {restoreTarget.backup_name}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-slate-400">Data de Geração:</span>
                <span className="font-semibold text-slate-200">
                  {new Date(restoreTarget.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-slate-400">Tamanho do Arquivo:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {backupService.formatBytes(restoreTarget.file_size)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-slate-400">Conteúdo Detectado:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold text-[10px]">
                    Banco de Dados
                  </span>
                  {restoreTarget.metadata?.include_photos !== false && (
                    <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-semibold text-[10px] flex items-center gap-1">
                      <Image className="w-3 h-3" /> Fotos
                    </span>
                  )}
                  {restoreTarget.metadata?.include_videos !== false && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-semibold text-[10px] flex items-center gap-1">
                      <Video className="w-3 h-3" /> Vídeos
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Seleção do que Restaurar */}
            <div className="space-y-2.5">
              <span className="font-semibold text-white block text-xs flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Escolha o que deseja restaurar:
              </span>

              {/* Fixo: Banco de Dados */}
              <div className="p-3 bg-[#070D18] rounded-xl border border-emerald-500/20 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Restaurar Banco de Dados</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Obrigatório
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Restaura todas as tabelas e registros relacionais cadastrados.
                  </p>
                </div>
              </div>

              {/* Checkbox: Fotos */}
              <label className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                restorePhotos
                  ? 'bg-[#070D18] border-sky-500/40 shadow-sm'
                  : 'bg-[#070D18]/50 border-white/10 opacity-70 hover:opacity-100'
              }`}>
                <input
                  type="checkbox"
                  checked={restorePhotos}
                  onChange={(e) => setRestorePhotos(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-900 cursor-pointer accent-sky-500"
                />
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                  <Image className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Restaurar Fotos e Imagens</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      restorePhotos ? 'bg-sky-500/20 text-sky-300' : 'bg-white/5 text-slate-500'
                    }`}>
                      {restorePhotos ? 'Restaurar' : 'Não Restaurar'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recupera as fotos de projetos, imagens do blog, hero images e fotos de perfil no Storage.
                  </p>
                </div>
              </label>

              {/* Checkbox: Vídeos */}
              <label className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                restoreVideos
                  ? 'bg-[#070D18] border-purple-500/40 shadow-sm'
                  : 'bg-[#070D18]/50 border-white/10 opacity-70 hover:opacity-100'
              }`}>
                <input
                  type="checkbox"
                  checked={restoreVideos}
                  onChange={(e) => setRestoreVideos(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500 bg-slate-900 cursor-pointer accent-purple-500"
                />
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Restaurar Vídeos de Projetos e Obras</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      restoreVideos ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500'
                    }`}>
                      {restoreVideos ? 'Restaurar' : 'Não Restaurar'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recupera os arquivos de vídeo dos projetos no Storage.
                  </p>
                </div>
              </label>

              {/* Checkbox: Documentos */}
              <label className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                restoreDocuments
                  ? 'bg-[#070D18] border-amber-500/40 shadow-sm'
                  : 'bg-[#070D18]/50 border-white/10 opacity-70 hover:opacity-100'
              }`}>
                <input
                  type="checkbox"
                  checked={restoreDocuments}
                  onChange={(e) => setRestoreDocuments(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer accent-amber-500"
                />
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Restaurar Documentos e Anexos</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      restoreDocuments ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-500'
                    }`}>
                      {restoreDocuments ? 'Restaurar' : 'Não Restaurar'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recupera arquivos e relatórios PDF arquivados no Storage.
                  </p>
                </div>
              </label>
            </div>

            {/* Alertas Críticos de Segurança */}
            <div className="space-y-2.5">
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl space-y-1 text-xs text-rose-200">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  Substituição do Estado Atual
                </span>
                <p className="leading-relaxed text-[11.5px]">
                  Os dados das tabelas e arquivos do storage serão atualizados para o exato momento em que este backup foi gerado.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-xs text-emerald-200">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  Snapshot Automático de Segurança
                </span>
                <p className="leading-relaxed text-[11.5px] text-emerald-100/90">
                  Antes de qualquer alteração, o sistema gerará <strong>obrigatoriamente um backup completo preventivo</strong> do estado atual e o enviará ao Google Drive. Se esse snapshot falhar, a restauração será cancelada sem tocar em nenhuma tabela.
                </p>
              </div>
            </div>

            {/* Campo de Confirmação Textual Obrigatória */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-200">
                Para autorizar, digite <span className="text-amber-400 font-mono font-bold tracking-wider">RESTAURAR</span> no campo abaixo:
              </label>
              <input
                type="text"
                value={restoreConfirmInput}
                onChange={(e) => setRestoreConfirmInput(e.target.value.toUpperCase())}
                placeholder="RESTAURAR"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-3.5 py-2.5 bg-[#070D18] border border-white/20 rounded-xl text-sm font-mono text-center tracking-widest text-white uppercase placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {restoreErrorMessage && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {restoreErrorMessage}
                </p>
              )}
            </div>

            {/* Rodapé e Botões */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleCloseRestoreModal}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={restoreConfirmInput.trim().toUpperCase() !== 'RESTAURAR'}
                onClick={handleExecuteRestore}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.9 MODAL DE EXECUÇÃO E PROGRESSO DA RESTAURAÇÃO (ETAPA 20.5) */}
      {(isExecutingRestore || (restoreProgress && restoreProgress.step !== 'validating') || restoreCompletedResult || (restoreErrorMessage && !isConfirmRestoreModalOpen)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-[#C5A059]/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  restoreCompletedResult
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : restoreProgress?.step === 'failed' || restoreErrorMessage
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-[#C5A059]/10 border-[#C5A059]/20 text-[#C5A059]'
                }`}>
                  {restoreCompletedResult ? (
                    <CheckCheck className="w-5 h-5" />
                  ) : restoreProgress?.step === 'failed' || restoreErrorMessage ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {restoreCompletedResult
                      ? 'Restauração Concluída!'
                      : restoreProgress?.step === 'failed' || restoreErrorMessage
                      ? 'Falha na Restauração'
                      : 'Restaurando Sistema...'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {restoreCompletedResult
                      ? 'Todos os registros e arquivos foram restabelecidos'
                      : restoreProgress?.step === 'failed' || restoreErrorMessage
                      ? 'Ocorreu um erro durante o processo'
                      : 'Executando etapas de segurança e integridade'}
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">
                  {restoreProgress?.message || 'Processando restauração...'}
                </span>
                <span className="text-[#C5A059] font-mono">
                  {restoreProgress?.percent ?? (restoreCompletedResult ? 100 : 50)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    restoreCompletedResult
                      ? 'bg-emerald-500'
                      : restoreProgress?.step === 'failed' || restoreErrorMessage
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-[#C5A059] to-amber-400'
                  }`}
                  style={{ width: `${restoreProgress?.percent ?? (restoreCompletedResult ? 100 : 50)}%` }}
                />
              </div>
            </div>

            {/* Linha do Tempo de Etapas */}
            <div className="p-3.5 bg-[#070D18] rounded-xl border border-white/5 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {restoreProgress?.step === 'validating' ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
                ) : restoreProgress && ['creating_safety_backup', 'downloading_package', 'extracting_manifest', 'validating_checksums', 'restoring_database', 'restoring_storage', 'post_validating', 'completed'].includes(restoreProgress.step) ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span className={restoreProgress?.step === 'validating' ? 'text-[#C5A059] font-semibold' : 'text-slate-300'}>
                  1. Validação de Autorização e Parâmetros
                </span>
              </div>

              <div className="flex items-center gap-2">
                {restoreProgress?.step === 'creating_safety_backup' ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
                ) : restoreProgress && ['downloading_package', 'extracting_manifest', 'validating_checksums', 'restoring_database', 'restoring_storage', 'post_validating', 'completed'].includes(restoreProgress.step) ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span className={restoreProgress?.step === 'creating_safety_backup' ? 'text-[#C5A059] font-semibold' : 'text-slate-300'}>
                  2. Criação do Snapshot de Segurança Pré-Restauração
                </span>
              </div>

              <div className="flex items-center gap-2">
                {restoreProgress?.step === 'downloading_package' ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
                ) : restoreProgress && ['extracting_manifest', 'validating_checksums', 'restoring_database', 'restoring_storage', 'post_validating', 'completed'].includes(restoreProgress.step) ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span className={restoreProgress?.step === 'downloading_package' ? 'text-[#C5A059] font-semibold' : 'text-slate-300'}>
                  3. Download do Pacote Oficial do Google Drive
                </span>
              </div>

              <div className="flex items-center gap-2">
                {restoreProgress?.step === 'extracting_manifest' || restoreProgress?.step === 'validating_checksums' || restoreProgress?.step === 'restoring_database' ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
                ) : restoreProgress && ['restoring_storage', 'post_validating', 'completed'].includes(restoreProgress.step) ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span className={restoreProgress?.step === 'restoring_database' ? 'text-[#C5A059] font-semibold' : 'text-slate-300'}>
                  4. Restauração Ordenada do Banco de Dados
                </span>
              </div>

              <div className="flex items-center gap-2">
                {restoreProgress?.step === 'restoring_storage' ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
                ) : restoreProgress && ['post_validating', 'completed'].includes(restoreProgress.step) ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span className={restoreProgress?.step === 'restoring_storage' ? 'text-[#C5A059] font-semibold' : 'text-slate-300'}>
                  5. Sincronização de Arquivos e Mídias no Storage
                </span>
              </div>

              <div className="flex items-center gap-2">
                {restoreProgress?.step === 'post_validating' ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
                ) : restoreProgress && restoreProgress.step === 'completed' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span className={restoreProgress?.step === 'post_validating' ? 'text-[#C5A059] font-semibold' : 'text-slate-300'}>
                  6. Testes de Integridade e Validação Pós-Restauração
                </span>
              </div>
            </div>

            {/* Sucesso Detalhado */}
            {restoreCompletedResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2.5 text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Relatório de Restauração
                </span>
                <div className="space-y-1 font-mono text-[11px] text-slate-200">
                  <p><strong>Registros Recuperados:</strong> {restoreCompletedResult.totalRecordsRestored}</p>
                  <p><strong>Arquivos no Storage:</strong> {restoreCompletedResult.totalStorageFilesRestored}</p>
                  <p><strong>Duração:</strong> {Math.round(restoreCompletedResult.executionDurationMs / 1000)}s</p>
                  {restoreCompletedResult.preRestoreBackupName && (
                    <p className="truncate text-slate-400 pt-1 border-t border-emerald-500/20 font-sans">
                      <strong>Snapshot Preventivo Criado:</strong> {restoreCompletedResult.preRestoreBackupName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Erro Detalhado */}
            {(restoreProgress?.step === 'failed' || restoreErrorMessage) && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1.5 text-xs text-rose-200">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" /> Informações do Erro
                </span>
                <p className="leading-relaxed">
                  {restoreErrorMessage || restoreProgress?.detail || restoreProgress?.message}
                </p>
                <p className="text-[11px] text-rose-300/80 pt-1 border-t border-rose-500/20">
                  Caso o snapshot inicial de segurança não tenha sido finalizado, nenhuma tabela foi alterada.
                </p>
              </div>
            )}

            {/* Rodapé e Botões */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              {restoreCompletedResult ? (
                <button
                  type="button"
                  onClick={handleCloseRestoreProgressModal}
                  className="px-5 py-2 rounded-xl bg-[#C5A059] text-black font-bold text-xs hover:bg-[#d4b06a] transition-all cursor-pointer shadow-md"
                >
                  Concluir e Atualizar Painel
                </button>
              ) : restoreProgress?.step === 'failed' || restoreErrorMessage ? (
                <button
                  type="button"
                  onClick={handleCloseRestoreProgressModal}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/15 text-xs font-semibold cursor-pointer"
                >
                  Fechar
                </button>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                  <span>Por favor, não feche o navegador durante a restauração...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

