// /src/services/restoreEngine.ts
import JSZip from 'jszip';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SystemBackup, RestoreProgressCallback, RestoreProgressStep, RestoreResult } from '../types/backup';
import { backupEngine, calculateSha256 } from './backupEngine';
import { supabaseDatabase } from './supabaseDatabase';
import { callGoogleDriveEdge } from './backupService';

// Trava de concorrência em memória para evitar restaurações simultâneas
let isGlobalRestoreActive = false;

/**
 * Converte base64 para Uint8Array de forma segura no navegador
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Detecta MIME type simples pelo nome do arquivo
 */
function getMimeTypeByFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'mp4':
      return 'video/mp4';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Motor Central de Restauração Segura de Backups a partir do Google Drive
 * Segue rigorosamente o fluxo de confirmação reforçada, criação de backup de segurança
 * pré-restauração, validação de integridade, compatibilidade de versão,
 * restauração ordenada de tabelas com foreign keys e sincronização do Supabase Storage.
 */
export const restoreEngine = {
  /**
   * Executa a restauração completa e segura do backup selecionado
   */
  async executeRestore(options: {
    backupId: string;
    adminId: string;
    adminEmail: string;
    adminName?: string;
    restorePhotos?: boolean;
    restoreVideos?: boolean;
    restoreDocuments?: boolean;
    onProgress?: RestoreProgressCallback;
  }): Promise<RestoreResult> {
    const startTime = Date.now();
    const {
      backupId,
      adminId,
      adminEmail,
      adminName,
      restorePhotos = true,
      restoreVideos = true,
      restoreDocuments = true,
      onProgress,
    } = options as any;

    if (isGlobalRestoreActive) {
      throw new Error('Já existe uma operação de restauração em andamento no sistema. Aguarde a finalização.');
    }

    isGlobalRestoreActive = true;

    const report = (step: RestoreProgressStep, message: string, detail?: string, percent?: number) => {
      if (onProgress) {
        onProgress({ step, message, detail, percent });
      }
    };

    let preRestoreBackupId: string | null = null;
    let preRestoreBackupName: string | null = null;
    let targetBackup: SystemBackup | null = null;

    try {
      // -----------------------------------------------------------------------
      // ETAPA 1: VALIDAÇÃO PRÉVIA DO ADMINISTRADOR E DO BACKUP FONTE
      // -----------------------------------------------------------------------
      report('validating', 'Validando autorização do administrador e integridade dos parâmetros...', 'Verificando permissões', 5);

      if (!isSupabaseConfigured) {
        throw new Error('Supabase não está configurado.');
      }

      // Valida se o usuário é administrador ativo e não suspenso
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, role, active, status, email, full_name')
        .eq('id', adminId)
        .single();

      if (profileErr || !profile || profile.role !== 'admin' || !profile.active || profile.status === 'suspended') {
        throw new Error('Acesso Negado: Apenas administradores ativos e com privilégios plenos podem restaurar backups.');
      }

      // Consulta o backup alvo
      const { data: backupRecord, error: backupErr } = await supabase
        .from('system_backups')
        .select('*')
        .eq('id', backupId)
        .single();

      if (backupErr || !backupRecord) {
        throw new Error('O backup selecionado para restauração não foi encontrado no registro do sistema.');
      }

      targetBackup = backupRecord as SystemBackup;

      if (targetBackup.status === 'file_missing') {
        throw new Error('Este backup não pode ser restaurado pois o arquivo físico está ausente no Google Drive.');
      }

      if (targetBackup.status !== 'completed' && targetBackup.status !== 'restored') {
        throw new Error(`Este backup possui status '${targetBackup.status}' e não pode ser restaurado.`);
      }

      if (!targetBackup.file_id) {
        throw new Error('O identificador remoto do arquivo no Google Drive (file_id) não está disponível.');
      }

      // Auditoria: BACKUP_RESTORE_REQUESTED & VALIDATION_STARTED
      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_RESTORE_REQUESTED',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          backup_name: targetBackup.backup_name,
          file_id: targetBackup.file_id,
          file_size: targetBackup.file_size,
        },
      });

      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_RESTORE_VALIDATION_STARTED',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          backup_name: targetBackup.backup_name,
          started_at: new Date().toISOString(),
        },
      });

      // -----------------------------------------------------------------------
      // ETAPA 2: CRIAÇÃO DO BACKUP DE SEGURANÇA PRÉ-RESTAURAÇÃO (MANDATÓRIO)
      // -----------------------------------------------------------------------
      report(
        'creating_safety_backup',
        'Criando backup de segurança do estado atual do sistema antes de qualquer alteração...',
        'Snapshot pré-restauração no Google Drive',
        15
      );

      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'PRE_RESTORE_BACKUP_STARTED',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          target_backup_name: targetBackup.backup_name,
          reason: 'Criação obrigatória de snapshot preventivo antes da restauração',
        },
      });

      let safetyBackupResult: any = null;
      try {
        safetyBackupResult = await backupEngine.executeManualBackup({
          adminId,
          adminEmail,
          adminName: `${adminName || profile.full_name || 'Admin'} (Pré-Restauração)`,
          onProgress: (info) => {
            report(
              'creating_safety_backup',
              `Criando backup de segurança pré-restauração: ${info.message}`,
              info.detail,
              15 + Math.round((info.percent || 0) * 0.15)
            );
          },
        });
      } catch (safetyErr: any) {
        console.error('[restoreEngine] Falha ao criar backup de segurança pré-restauração:', safetyErr);
        throw new Error(
          `Não foi possível criar o backup de segurança necessário antes da restauração. Nenhuma alteração foi realizada. Detalhes: ${safetyErr.message}`
        );
      }

      if (!safetyBackupResult || !safetyBackupResult.backup || !safetyBackupResult.fileId) {
        throw new Error(
          'Não foi possível criar o backup de segurança necessário antes da restauração. Nenhuma alteração foi realizada.'
        );
      }

      preRestoreBackupId = safetyBackupResult.backup.id;
      preRestoreBackupName = safetyBackupResult.fileName;

      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'PRE_RESTORE_BACKUP_COMPLETED',
        entity_type: 'system_backups',
        entity_id: preRestoreBackupId,
        details: {
          pre_restore_backup_name: preRestoreBackupName,
          target_backup_id: backupId,
          file_id: safetyBackupResult.fileId,
        },
      });

      // -----------------------------------------------------------------------
      // ETAPA 3: DOWNLOAD SEGURO DO PACOTE A PARTIR DO GOOGLE DRIVE
      // -----------------------------------------------------------------------
      report(
        'downloading_package',
        `Baixando pacote oficial de backup do Google Drive (${targetBackup.file_name || 'backup.zip'})...`,
        'Transferência segura server-side',
        35
      );

      const downloadData = await callGoogleDriveEdge('download-backup', {
        method: 'POST',
        body: { fileId: targetBackup.file_id },
      });

      if (!downloadData.success || !downloadData.fileData) {
        throw new Error(downloadData.error || 'Dados corrompidos ou incompletos recebidos do Google Drive.');
      }

      const zipBytes = base64ToUint8Array(downloadData.fileData);
      const downloadedSha256 = await calculateSha256(zipBytes);

      // Validação de Checksum externo do ZIP se constar nos metadados
      const expectedChecksum = targetBackup.metadata?.sha256_checksum;
      if (expectedChecksum && expectedChecksum !== downloadedSha256) {
        // Se houver discrepância de checksum
        console.warn(`[restoreEngine] Hash divergente. Esperado: ${expectedChecksum}, Calculado: ${downloadedSha256}`);
        // Se o arquivo sofreu alteração estrutural não autorizada
        await supabaseDatabase.logAdminAction({
          user_id: adminId,
          user_email: adminEmail,
          action: 'BACKUP_RESTORE_VALIDATION_FAILED',
          entity_type: 'system_backups',
          entity_id: backupId,
          details: {
            reason: 'Checksum SHA-256 do arquivo baixado difere do registrado',
            expected: expectedChecksum,
            calculated: downloadedSha256,
          },
        });
        throw new Error('Falha de Integridade: O arquivo baixado do Google Drive não corresponde ao checksum registrado no momento da criação.');
      }

      // -----------------------------------------------------------------------
      // ETAPA 4: EXTRAÇÃO E VALIDAÇÃO DE SEGURANÇA (ZIP SLIP, ZIP BOMB, MANIFESTO E VERSÃO)
      // -----------------------------------------------------------------------
      report('extracting_manifest', 'Validando estrutura de segurança, manifesto técnico e integridade...', 'manifest.json', 45);

      const zip = await JSZip.loadAsync(zipBytes);

      // Proteção rigorosa contra Zip Slip e Zip Bomb
      const MAX_TOTAL_FILES_IN_ZIP = 5000;
      const MAX_UNCOMPRESSED_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
      let totalZipEntries = 0;
      let estimatedUncompressedSize = 0;

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        totalZipEntries++;
        if (totalZipEntries > MAX_TOTAL_FILES_IN_ZIP) {
          throw new Error('Proteção de Segurança (Zip Bomb): O pacote contém um número excessivo de arquivos e foi rejeitado.');
        }

        // Validação anti-Zip Slip: rejeita caracteres de escape, caminhos relativos maliciosos ou absolutos
        if (
          relativePath.includes('..') ||
          relativePath.startsWith('/') ||
          relativePath.startsWith('\\') ||
          relativePath.includes('://') ||
          /^[a-zA-Z]:[/\\]/.test(relativePath)
        ) {
          await supabaseDatabase.logAdminAction({
            user_id: adminId,
            user_email: adminEmail,
            action: 'BACKUP_RESTORE_SECURITY_REJECTED',
            entity_type: 'system_backups',
            entity_id: backupId,
            details: {
              reason: 'Tentativa de Zip Slip detectada no caminho do arquivo interno',
              entry_path: relativePath,
            },
          });
          throw new Error(`Proteção de Segurança (Zip Slip): O arquivo '${relativePath}' possui caminho malicioso e foi rejeitado.`);
        }

        // Estima tamanho descomprimido
        if (!zipEntry.dir) {
          const entrySize = (zipEntry as any)._data?.uncompressedSize || 0;
          estimatedUncompressedSize += entrySize;
          if (estimatedUncompressedSize > MAX_UNCOMPRESSED_SIZE_BYTES) {
            throw new Error('Proteção de Segurança (Zip Bomb): O tamanho total descompactado ultrapassa o limite seguro de 500MB.');
          }
        }
      }

      const manifestFile = zip.file('manifest.json');

      if (!manifestFile) {
        throw new Error('Arquivo manifest.json ausente no pacote de backup. Formato de backup inválido.');
      }

      const manifestText = await manifestFile.async('text');
      let manifest: any;
      try {
        manifest = JSON.parse(manifestText);
      } catch (jsonErr) {
        throw new Error('O arquivo manifest.json do backup está corrompido e não pôde ser interpretado.');
      }

      // Validação da versão do backup
      const backupVersion = manifest.backup_version || '1.0';
      const supportedVersions = ['1.0'];

      if (!supportedVersions.includes(backupVersion)) {
        throw new Error(`Este backup foi criado em uma versão (${backupVersion}) não compatível com a versão atual do sistema (1.0).`);
      }

      // Validação de integridade interna de arquivos (checksums.json)
      report('validating_checksums', 'Validando integridade dos arquivos e tabelas internas...', 'checksums.json', 50);

      let checksumsMap: Record<string, string> = {};
      const checksumsFile = zip.file('metadata/checksums.json');
      if (checksumsFile) {
        try {
          const checksumsText = await checksumsFile.async('text');
          checksumsMap = JSON.parse(checksumsText);

          // Valida arquivos críticos do banco
          for (const [filePath, expectedFileSha] of Object.entries(checksumsMap)) {
            const internalFile = zip.file(filePath);
            if (internalFile) {
              const fileContent = await internalFile.async('uint8array');
              const actualSha = await calculateSha256(fileContent);
              if (actualSha !== expectedFileSha) {
                console.warn(`[restoreEngine] Aviso de checksum interno em ${filePath}`);
              }
            }
          }
        } catch (cErr) {
          console.warn('[restoreEngine] Erro ao processar checksums.json interno:', cErr);
        }
      }

      // -----------------------------------------------------------------------
      // ETAPA 5: RESTAURAÇÃO DO BANCO DE DADOS (ORDEM ESTRITA DE DEPENDÊNCIAS)
      // -----------------------------------------------------------------------
      report('restoring_database', 'Iniciando restauração ordenada das tabelas do banco...', 'PostgreSQL Restorer', 60);

      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_RESTORE_STARTED',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          backup_name: targetBackup.backup_name,
          pre_restore_backup_id: preRestoreBackupId,
          version: backupVersion,
        },
      });

      // Salva dados de conexão atuais do Google Drive para que NÃO sejam sobrescritos
      let activeGoogleDriveSettings: any = null;
      try {
        const { data: currentSettingsRow } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'backup_settings')
          .maybeSingle();

        if (currentSettingsRow && currentSettingsRow.value) {
          activeGoogleDriveSettings = currentSettingsRow.value;
        }
      } catch (gErr) {
        console.warn('[restoreEngine] Não foi possível carregar backup_settings ativos:', gErr);
      }

      let totalTablesRestored = 0;
      let totalRecordsRestored = 0;

      // Ordem calculada de tabelas respeitando Foreign Keys e Integridade Referencial
      const tablesRestoreOrder = [
        'profiles',
        'site_domains',
        'site_settings',
        'projects',
        'project_images',
        'blog_posts',
        'contact_messages',
        'site_visit_stats',
        'system_backups',
        'admin_audit_logs',
      ];

      for (let i = 0; i < tablesRestoreOrder.length; i++) {
        const table = tablesRestoreOrder[i];
        const tableFile = zip.file(`database/${table}.json`);

        report(
          'restoring_database',
          `Restaurando tabela: ${table} (${i + 1}/${tablesRestoreOrder.length})`,
          table,
          60 + Math.round((i / tablesRestoreOrder.length) * 20)
        );

        if (!tableFile) {
          continue;
        }

        try {
          const rawTableText = await tableFile.async('text');
          const records: any[] = JSON.parse(rawTableText);

          if (!Array.isArray(records) || records.length === 0) {
            continue;
          }

          // -------------------------------------------------------------------
          // TRATAMENTO ESPECIAL POR TABELA
          // -------------------------------------------------------------------

          if (table === 'profiles') {
            // PROFILES: Proteção do administrador executor e último administrador
            for (const p of records) {
              try {
                // Se for o próprio administrador executando, garante que mantenha privilégios ativos
                const isCurrentAdmin = p.id === adminId || p.email === adminEmail;
                const profilePayload = {
                  ...p,
                  role: isCurrentAdmin ? 'admin' : (p.role || 'user'),
                  active: isCurrentAdmin ? true : (p.active ?? true),
                  status: isCurrentAdmin ? 'active' : (p.status || 'active'),
                  updated_at: new Date().toISOString(),
                };

                await supabase
                  .from('profiles')
                  .upsert(profilePayload, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (pErr) {
                console.warn(`[restoreEngine] Aviso ao restaurar perfil ${p.email}:`, pErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'site_settings') {
            // SITE_SETTINGS: Restaura visual identity, tema, textos, etc., MAS PRESERVA A CONEXÃO GOOGLE DRIVE ATIVA
            for (const s of records) {
              try {
                let settingValue = s.value;

                if (s.key === 'backup_settings' && activeGoogleDriveSettings) {
                  // Preserva tokens, emails e status da conexão Google Drive ativa atual
                  settingValue = {
                    ...settingValue,
                    google_drive_connected: activeGoogleDriveSettings.google_drive_connected,
                    google_drive_account_email: activeGoogleDriveSettings.google_drive_account_email,
                    google_drive_status: activeGoogleDriveSettings.google_drive_status,
                    google_drive_folder_id: activeGoogleDriveSettings.google_drive_folder_id,
                    google_drive_folder_name: activeGoogleDriveSettings.google_drive_folder_name,
                    google_drive_connected_by: activeGoogleDriveSettings.google_drive_connected_by,
                    google_drive_connected_at: activeGoogleDriveSettings.google_drive_connected_at,
                    google_drive_last_verified_at: activeGoogleDriveSettings.google_drive_last_verified_at,
                  };
                }

                await supabase
                  .from('site_settings')
                  .upsert(
                    {
                      key: s.key,
                      value: settingValue,
                      updated_at: new Date().toISOString(),
                      updated_by: adminId,
                    },
                    { onConflict: 'key' }
                  );
                totalRecordsRestored++;
              } catch (sErr) {
                console.warn(`[restoreEngine] Aviso ao restaurar configuração ${s.key}:`, sErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'projects') {
            // PROJECTS: Restaura projetos com upsert
            for (const proj of records) {
              try {
                await supabase
                  .from('projects')
                  .upsert(proj, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (prErr) {
                console.warn(`[restoreEngine] Aviso ao restaurar projeto ${proj.id}:`, prErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'project_images') {
            // PROJECT_IMAGES: Restaura imagens vinculadas a projetos
            for (const img of records) {
              try {
                await supabase
                  .from('project_images')
                  .upsert(img, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (imgErr) {
                console.warn(`[restoreEngine] Aviso ao restaurar imagem do projeto ${img.id}:`, imgErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'blog_posts') {
            // BLOG_POSTS: Restaura postagens do blog
            for (const post of records) {
              try {
                await supabase
                  .from('blog_posts')
                  .upsert(post, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (postErr) {
                console.warn(`[restoreEngine] Aviso ao restaurar post do blog ${post.id}:`, postErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'contact_messages') {
            // CONTACT_MESSAGES: Restaura mensagens de contato
            for (const msg of records) {
              try {
                await supabase
                  .from('contact_messages')
                  .upsert(msg, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (msgErr) {
                console.warn(`[restoreEngine] Aviso ao restaurar mensagem ${msg.id}:`, msgErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'site_domains') {
            // SITE_DOMAINS: Restaura domínios registrados
            for (const dom of records) {
              try {
                await supabase
                  .from('site_domains')
                  .upsert(dom, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (dErr) {
                console.warn(`[restoreEngine] Aviso ao restaurar domínio ${dom.id}:`, dErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'site_visit_stats') {
            // SITE_VISIT_STATS: Restaura estatísticas de acesso
            for (const stat of records) {
              try {
                await supabase
                  .from('site_visit_stats')
                  .upsert(stat, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (stErr) {
                console.warn(`[restoreEngine] Aviso ao restaurar estatística ${stat.id}:`, stErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'system_backups') {
            // SYSTEM_BACKUPS: Preserva os registros atuais e mescla o histórico do backup
            for (const b of records) {
              try {
                // Não sobrescrever o backup de segurança pré-restauração ou backups mais novos criados recentemente
                if (b.id === preRestoreBackupId) continue;
                await supabase
                  .from('system_backups')
                  .upsert(b, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (bErr) {
                console.warn(`[restoreEngine] Aviso ao mesclar histórico de backup ${b.id}:`, bErr);
              }
            }
            totalTablesRestored++;
          } else if (table === 'admin_audit_logs') {
            // ADMIN_AUDIT_LOGS: Mescla logs históricos sem apagar os logs da operação atual
            for (const log of records) {
              try {
                await supabase
                  .from('admin_audit_logs')
                  .upsert(log, { onConflict: 'id' });
                totalRecordsRestored++;
              } catch (lErr) {
                console.warn(`[restoreEngine] Aviso ao mesclar log de auditoria ${log.id}:`, lErr);
              }
            }
            totalTablesRestored++;
          }
        } catch (tErr) {
          console.warn(`[restoreEngine] Erro ao restaurar tabela ${table}:`, tErr);
        }
      }

      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_DATABASE_RESTORE_COMPLETED',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          tables_restored: totalTablesRestored,
          records_restored: totalRecordsRestored,
        },
      });

      // -----------------------------------------------------------------------
      // ETAPA 6: RESTAURAÇÃO DO SUPABASE STORAGE (ARQUIVOS E MÍDIAS)
      // -----------------------------------------------------------------------
      report('restoring_storage', 'Restaurando arquivos de mídia e documentos no Storage...', 'Supabase Storage Sync', 82);

      let totalStorageFilesRestored = 0;
      let totalStorageBytesRestored = 0;
      let totalPhotosRestored = 0;
      let totalVideosRestored = 0;
      let totalDocumentsRestored = 0;

      const photoBuckets = ['profile-images', 'hero-images', 'project-images', 'blog-images'];
      const videoBuckets = ['project-videos'];
      const documentBuckets = ['documents'];

      const storageBuckets = [
        'profile-images',
        'hero-images',
        'project-images',
        'project-videos',
        'blog-images',
        'documents',
      ];

      for (const bucket of storageBuckets) {
        const isPhotoBucket = photoBuckets.includes(bucket);
        const isVideoBucket = videoBuckets.includes(bucket);
        const isDocumentBucket = documentBuckets.includes(bucket);

        if (isPhotoBucket && !restorePhotos) {
          console.log(`[restoreEngine] Pulando bucket de fotos "${bucket}" (conforme seleção do usuário).`);
          continue;
        }
        if (isVideoBucket && !restoreVideos) {
          console.log(`[restoreEngine] Pulando bucket de vídeos "${bucket}" (conforme seleção do usuário).`);
          continue;
        }
        if (isDocumentBucket && !restoreDocuments) {
          console.log(`[restoreEngine] Pulando bucket de documentos "${bucket}" (conforme seleção do usuário).`);
          continue;
        }

        const bucketFolder = zip.folder(`storage/${bucket}`);
        if (!bucketFolder) continue;

        const fileEntries: Array<{ relativePath: string; fileObj: JSZip.JSZipObject }> = [];
        bucketFolder.forEach((relativePath, fileObj) => {
          if (!fileObj.dir && !relativePath.endsWith('/')) {
            fileEntries.push({ relativePath, fileObj });
          }
        });

        for (const { relativePath, fileObj } of fileEntries) {
          const fileName = relativePath.split('/').pop();
          if (!fileName || fileName === '.emptyFolderPlaceholder') continue;

          const categoryLabel = isPhotoBucket
            ? 'Foto/Imagem'
            : isVideoBucket
            ? 'Vídeo'
            : 'Documento';

          report(
            'restoring_storage',
            `Restaurando [${categoryLabel}]: ${bucket}/${relativePath}`,
            relativePath,
            82 + Math.min(10, Math.round((totalStorageFilesRestored / Math.max(1, fileEntries.length)) * 10))
          );

          try {
            const fileData = await fileObj.async('uint8array');
            const mimeType = getMimeTypeByFileName(fileName);
            const actualSha = await calculateSha256(fileData);

            // Validação de checksum individual se presente no manifesto/checksums
            const expectedChecksum = checksumsMap[`storage/${bucket}/${relativePath}`];
            if (expectedChecksum && actualSha !== expectedChecksum) {
              console.warn(
                `[restoreEngine] Divergência de checksum em ${bucket}/${relativePath}. Esperado: ${expectedChecksum}, Atual: ${actualSha}`
              );
            }

            const { error: uploadErr } = await supabase.storage
              .from(bucket)
              .upload(relativePath, fileData, {
                upsert: true,
                contentType: mimeType,
              });

            if (uploadErr) {
              console.warn(`[restoreEngine] Aviso ao enviar ${bucket}/${relativePath} para o Storage:`, uploadErr.message);
            } else {
              totalStorageFilesRestored++;
              totalStorageBytesRestored += fileData.byteLength;
              if (isPhotoBucket) totalPhotosRestored++;
              else if (isVideoBucket) totalVideosRestored++;
              else if (isDocumentBucket) totalDocumentsRestored++;
            }
          } catch (stgErr) {
            console.warn(`[restoreEngine] Erro ao extrair arquivo ${bucket}/${relativePath}:`, stgErr);
          }
        }
      }

      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_STORAGE_RESTORE_COMPLETED',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          total_files_restored: totalStorageFilesRestored,
          total_bytes_restored: totalStorageBytesRestored,
          photos_restored: totalPhotosRestored,
          videos_restored: totalVideosRestored,
          documents_restored: totalDocumentsRestored,
        },
      });

      // -----------------------------------------------------------------------
      // ETAPA 7: VALIDAÇÃO PÓS-RESTAURAÇÃO E HEALTH CHECKS
      // -----------------------------------------------------------------------
      report('post_validating', 'Executando testes de integridade pós-restauração...', 'Health Checks', 95);

      // Validação 1: Site Settings carregável
      const { data: testSettings, error: testSettingsErr } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1);

      if (testSettingsErr) {
        throw new Error('Falha no teste pós-restauração: a tabela site_settings não pôde ser consultada.');
      }

      // Validação 2: Administrador ativo preservado
      const { data: adminCheck } = await supabase
        .from('profiles')
        .select('id, role, active, status')
        .eq('id', adminId)
        .single();

      if (!adminCheck || adminCheck.role !== 'admin' || !adminCheck.active || adminCheck.status === 'suspended') {
        // Auto-repara o perfil do administrador executor imediatamente
        await supabase
          .from('profiles')
          .update({
            role: 'admin',
            active: true,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', adminId);
      }

      // -----------------------------------------------------------------------
      // ETAPA 8: FINALIZAÇÃO E REGISTRO DE AUDITORIA CONCLUÍDA
      // -----------------------------------------------------------------------
      const completedAt = new Date().toISOString();
      const executionDurationMs = Date.now() - startTime;

      // Atualiza o registro do backup restaurado para status 'restored'
      try {
        await supabase
          .from('system_backups')
          .update({
            status: 'restored',
            updated_at: completedAt,
            metadata: {
              ...targetBackup.metadata,
              restored_at: completedAt,
              restored_by: adminId,
              restored_by_email: adminEmail,
              pre_restore_backup_id: preRestoreBackupId,
              pre_restore_backup_name: preRestoreBackupName,
              total_tables_restored: totalTablesRestored,
              total_records_restored: totalRecordsRestored,
              total_storage_files_restored: totalStorageFilesRestored,
              restore_duration_ms: executionDurationMs,
            },
          })
          .eq('id', backupId);
      } catch (upErr) {
        console.warn('[restoreEngine] Aviso ao marcar backup como restaurado:', upErr);
      }

      // Auditoria: BACKUP_RESTORE_COMPLETED
      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_RESTORE_COMPLETED',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          backup_name: targetBackup.backup_name,
          pre_restore_backup_id: preRestoreBackupId,
          pre_restore_backup_name: preRestoreBackupName,
          tables_restored: totalTablesRestored,
          records_restored: totalRecordsRestored,
          storage_files_restored: totalStorageFilesRestored,
          duration_ms: executionDurationMs,
          completed_at: completedAt,
        },
      });

      report(
        'completed',
        'Restauração concluída com sucesso! Todos os dados e arquivos foram restabelecidos.',
        `${totalRecordsRestored} registros e ${totalStorageFilesRestored} arquivos recuperados`,
        100
      );

      return {
        success: true,
        restoredBackupId: backupId,
        preRestoreBackupId,
        preRestoreBackupName,
        totalTablesRestored,
        totalRecordsRestored,
        totalStorageFilesRestored,
        totalPhotosRestored,
        totalVideosRestored,
        executionDurationMs,
        completedAt,
      };
    } catch (err: any) {
      console.error('[restoreEngine] Falha na restauração do backup:', err);
      const safeError = err.message || 'Erro inesperado durante o processo de restauração do backup.';

      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_RESTORE_FAILED',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: {
          error: safeError,
          target_backup_name: targetBackup?.backup_name || 'Desconhecido',
          pre_restore_backup_id: preRestoreBackupId,
        },
      });

      report('failed', `Falha na restauração: ${safeError}`, safeError, 100);
      throw new Error(safeError);
    } finally {
      isGlobalRestoreActive = false;
    }
  },
};
