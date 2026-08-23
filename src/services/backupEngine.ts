// /src/services/backupEngine.ts
import JSZip from 'jszip';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { SystemBackup, SystemBackupMetadata } from '../types/backup';
import { supabaseDatabase } from './supabaseDatabase';

export type BackupProgressStep =
  | 'validating'
  | 'collecting_database'
  | 'collecting_storage'
  | 'packaging'
  | 'uploading'
  | 'finalizing'
  | 'completed'
  | 'failed';

export interface BackupProgressInfo {
  step: BackupProgressStep;
  message: string;
  detail?: string;
  percent?: number;
  currentTable?: string;
  currentBucket?: string;
  tablesProcessed?: number;
  totalTables?: number;
  filesProcessed?: number;
  totalFiles?: number;
}

export type BackupProgressCallback = (info: BackupProgressInfo) => void;

/**
 * Calcula o hash SHA-256 de forma compatível com navegadores e ambientes modernos
 */
export async function calculateSha256(data: Uint8Array | string | ArrayBuffer): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data).buffer;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else {
    buffer = data;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converte Uint8Array para base64 de forma eficiente
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Motor Central de Backup Manual do Sistema
 * Executa coleta de banco de dados, arquivos de Storage, empacotamento ZIP estruturado,
 * validação de integridade e envio real ao Google Drive.
 */
export const backupEngine = {
  /**
   * Executa o fluxo completo do backup manual com relatórios de progresso em tempo real
   */
  async executeManualBackup(options: {
    adminId: string;
    adminEmail: string;
    adminName?: string;
    onProgress?: BackupProgressCallback;
  }): Promise<{
    backup: SystemBackup;
    fileId: string;
    fileName: string;
    fileSize: number;
    sha256: string;
    webViewLink: string;
  }> {
    const startTime = Date.now();
    const {
      adminId,
      adminEmail,
      adminName,
      includePhotos = true,
      includeVideos = true,
      includeDocuments = true,
      onProgress,
    } = options as any;

    const report = (step: BackupProgressStep, message: string, detail?: string, percent?: number) => {
      if (onProgress) {
        onProgress({ step, message, detail, percent });
      }
    };

    let backupRecordId: string | null = null;
    const now = new Date();
    const dateFormatted = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `jucelia-santana-backup-${dateFormatted}.zip`;

    try {
      // -----------------------------------------------------------------------
      // ETAPA 1: VALIDAÇÃO DO ADMINISTRADOR E DO GOOGLE DRIVE
      // -----------------------------------------------------------------------
      report('validating', 'Validando permissões e conexão com o Google Drive...', 'Checando credenciais', 10);

      if (!isSupabaseConfigured) {
        throw new Error('Supabase não está configurado.');
      }

      // Validação do perfil do administrador
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, role, active, email, full_name, status')
        .eq('id', adminId)
        .single();

      if (profileErr || !profile || profile.role !== 'admin' || !profile.active || profile.status === 'suspended') {
        throw new Error('Acesso Negado: Apenas administradores ativos podem gerar backups.');
      }

      // Checagem de operações concorrentes (se já existe um backup em processamento)
      const { data: runningBackups } = await supabase
        .from('system_backups')
        .select('id, backup_name, created_at')
        .eq('status', 'processing')
        .limit(1);

      if (runningBackups && runningBackups.length > 0) {
        throw new Error('Já existe uma operação de backup em andamento. Aguarde a conclusão.');
      }

      // Validação da conexão ativa com o Google Drive via Edge Function server-side
      const driveInfo = await this.validateGoogleDriveConnection(adminId, adminEmail);
      if (!driveInfo.connected) {
        throw new Error(
          driveInfo.error || 'Não foi possível iniciar o backup porque a conexão com o Google Drive precisa ser restabelecida.'
        );
      }

      const folderId = driveInfo.folderId;
      const folderName = driveInfo.folderName || 'Jucélia Santana Engenharia Civil — Backups';

      // Cria registro inicial em public.system_backups com status 'pending'
      const idempotencyKey = `manual_backup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const { data: newBackup, error: createBackupErr } = await supabase
        .from('system_backups')
        .insert({
          created_by: adminId,
          backup_name: fileName,
          backup_type: 'manual',
          status: 'pending',
          storage_provider: 'google_drive',
          metadata: {
            step: 'pending',
            version: '1.0',
            source_environment: 'production',
            folder_name: folderName,
          },
          idempotency_key: idempotencyKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (createBackupErr || !newBackup) {
        throw new Error('Falha ao registrar a operação de backup no banco de dados.');
      }

      backupRecordId = newBackup.id;

      // Atualiza status para 'processing' antes de iniciar a extração pesada
      await supabase
        .from('system_backups')
        .update({
          status: 'processing',
          metadata: {
            step: 'processing',
            version: '1.0',
            source_environment: 'production',
            folder_name: folderName,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', backupRecordId);

      // Auditoria: BACKUP_MANUAL_REQUESTED & BACKUP_MANUAL_STARTED
      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_MANUAL_REQUESTED',
        entity_type: 'system_backups',
        entity_id: backupRecordId,
        details: { backup_name: fileName, folder_name: folderName },
      });

      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_MANUAL_STARTED',
        entity_type: 'system_backups',
        entity_id: backupRecordId,
        details: { backup_name: fileName, folder_id: folderId },
      });

      // Inicializa estrutura ZIP
      const zip = new JSZip();
      const dbFolder = zip.folder('database');
      const storageFolder = zip.folder('storage');
      const metaFolder = zip.folder('metadata');

      const checksums: Record<string, string> = {};
      const tableSummaries: Record<string, { count: number; sha256: string; bytes: number }> = {};
      const bucketSummaries: Record<string, { count: number; total_bytes: number; files: string[] }> = {};

      let totalRecords = 0;
      let totalStorageFiles = 0;
      let totalStorageBytes = 0;

      // -----------------------------------------------------------------------
      // ETAPA 2: COLETAR TABELAS DO BANCO DE DADOS
      // -----------------------------------------------------------------------
      report('collecting_database', 'Coletando dados persistentes do banco...', 'Extraindo tabelas', 15);

      const tablesToBackup = [
        'profiles',
        'projects',
        'project_images',
        'blog_posts',
        'site_settings',
        'contact_messages',
        'technical_documents',
        'site_domains',
        'admin_audit_logs',
        'site_visit_stats',
        'system_backups',
        'google_drive_connections',
      ];

      for (let i = 0; i < tablesToBackup.length; i++) {
        const table = tablesToBackup[i];
        report(
          'collecting_database',
          `Coletando tabela: ${table} (${i + 1}/${tablesToBackup.length})`,
          table,
          15 + Math.round(((i + 1) / tablesToBackup.length) * 20)
        );

        try {
          // Consulta todos os registros da tabela
          const { data: records, error: tableErr } = await supabase
            .from(table as any)
            .select('*');

          if (tableErr) {
            console.warn(`[backupEngine] Aviso ao exportar tabela ${table}:`, tableErr.message);
          }

          let sanitizedRecords = records || [];

          // Sanitização de segurança: nunca incluir tokens secretos ou segredos de chaves
          if (table === 'google_drive_connections') {
            sanitizedRecords = sanitizedRecords.map((r: any) => {
              const { refresh_token_encrypted, ...rest } = r;
              return rest;
            });
          }

          const jsonString = JSON.stringify(sanitizedRecords, null, 2);
          const sha256 = await calculateSha256(jsonString);
          const bytes = new TextEncoder().encode(jsonString).byteLength;

          dbFolder?.file(`${table}.json`, jsonString);
          checksums[`database/${table}.json`] = sha256;
          tableSummaries[table] = {
            count: sanitizedRecords.length,
            sha256,
            bytes,
          };

          totalRecords += sanitizedRecords.length;
        } catch (tErr) {
          console.warn(`[backupEngine] Erro ao processar tabela ${table}:`, tErr);
        }
      }

      // -----------------------------------------------------------------------
      // ETAPA 3: COLETAR ARQUIVOS DE STORAGE (MÍDIAS E DOCUMENTOS COM BYTES REAIS)
      // -----------------------------------------------------------------------
      report('collecting_storage', 'Coletando arquivos e documentos do Storage...', 'Lendo buckets', 40);

      const photoBuckets = ['profile-images', 'hero-images', 'project-images', 'blog-images'];
      const videoBuckets = ['project-videos'];
      const documentBuckets = ['documents'];

      const bucketsToBackup: string[] = [];
      if (includePhotos) bucketsToBackup.push(...photoBuckets);
      if (includeVideos) bucketsToBackup.push(...videoBuckets);
      if (includeDocuments) bucketsToBackup.push(...documentBuckets);

      let photosCount = 0;
      let videosCount = 0;
      let documentsCount = 0;
      let sourcePhotosCount = 0;
      let sourceVideosCount = 0;
      let sourceDocumentsCount = 0;
      let totalSourceFiles = 0;

      interface StorageItemMeta {
        bucket: string;
        path: string;
        category: 'photo' | 'video' | 'document' | 'other';
        mime_type: string;
        size: number;
        sha256: string;
        updated_at: string;
        metadata: any;
      }

      const storageManifestEntries: StorageItemMeta[] = [];

      function getMimeAndCategory(fileName: string, rawMime?: string, bucketName?: string): { mime: string; category: 'photo' | 'video' | 'document' | 'other' } {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        let mime = rawMime || '';
        if (!mime || mime === 'application/octet-stream') {
          if (['jpg', 'jpeg'].includes(ext)) mime = 'image/jpeg';
          else if (ext === 'png') mime = 'image/png';
          else if (ext === 'webp') mime = 'image/webp';
          else if (ext === 'svg') mime = 'image/svg+xml';
          else if (ext === 'gif') mime = 'image/gif';
          else if (ext === 'mp4') mime = 'video/mp4';
          else if (ext === 'webm') mime = 'video/webm';
          else if (ext === 'pdf') mime = 'application/pdf';
          else if (ext === 'json') mime = 'application/json';
          else mime = 'application/octet-stream';
        }

        if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'avif', 'ico'].includes(ext)) {
          return { mime, category: 'photo' };
        }
        if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
          return { mime, category: 'video' };
        }
        if (bucketName === 'documents' || mime === 'application/pdf' || ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
          return { mime, category: 'document' };
        }
        return { mime, category: 'other' };
      }

      if (bucketsToBackup.length === 0) {
        report('collecting_storage', 'Nenhum bucket de mídia selecionado para o backup.', 'Avançando', 60);
      }

      // Função auxiliar para listar recursivamente todos os arquivos de um bucket com caminhos relativos
      async function listAllBucketFilesRecursive(
        bucket: string,
        prefix = ''
      ): Promise<Array<{ name: string; fullPath: string; metadata?: any; updated_at?: string }>> {
        let list: Array<{ name: string; fullPath: string; metadata?: any; updated_at?: string }> = [];
        const { data: items, error: lErr } = await supabase.storage
          .from(bucket)
          .list(prefix, { limit: 500, sortBy: { column: 'name', order: 'asc' } });

        if (lErr || !items) return list;

        for (const it of items) {
          if (it.name === '.emptyFolderPlaceholder') continue;
          const fullPath = prefix ? `${prefix}/${it.name}` : it.name;
          if (!it.id || it.metadata === null || it.id === null) {
            // Subpasta identificada: recursão
            const subItems = await listAllBucketFilesRecursive(bucket, fullPath);
            list = list.concat(subItems);
          } else {
            list.push({
              name: it.name,
              fullPath,
              metadata: it.metadata,
              updated_at: it.updated_at,
            });
          }
        }
        return list;
      }

      for (let b = 0; b < bucketsToBackup.length; b++) {
        const bucket = bucketsToBackup[b];
        const isPhotoBucket = photoBuckets.includes(bucket);
        const isVideoBucket = videoBuckets.includes(bucket);
        const isDocumentBucket = documentBuckets.includes(bucket);

        const categoryLabel = isPhotoBucket
          ? 'Fotos/Imagens'
          : isVideoBucket
          ? 'Vídeos'
          : 'Documentos';

        report(
          'collecting_storage',
          `Processando bucket [${categoryLabel}]: ${bucket} (${b + 1}/${bucketsToBackup.length})`,
          bucket,
          40 + Math.round(((b + 1) / Math.max(1, bucketsToBackup.length)) * 20)
        );

        bucketSummaries[bucket] = { count: 0, total_bytes: 0, files: [] };

        try {
          const fileList = await listAllBucketFilesRecursive(bucket);

          for (const fileObj of fileList) {
            totalSourceFiles++;
            const rawMime = fileObj.metadata?.mimetype;
            const { mime, category } = getMimeAndCategory(fileObj.name, rawMime, bucket);

            if (category === 'photo' || isPhotoBucket) sourcePhotosCount++;
            else if (category === 'video' || isVideoBucket) sourceVideosCount++;
            else if (category === 'document' || isDocumentBucket) sourceDocumentsCount++;

            try {
              const { data: blobData, error: dlErr } = await supabase.storage
                .from(bucket)
                .download(fileObj.fullPath);

              if (dlErr || !blobData) {
                console.warn(`[backupEngine] Falha ao baixar ${bucket}/${fileObj.fullPath}:`, dlErr);
                continue;
              }

              const arrayBuffer = await blobData.arrayBuffer();
              const uint8 = new Uint8Array(arrayBuffer);
              const fileSha = await calculateSha256(uint8);

              storageFolder?.file(`${bucket}/${fileObj.fullPath}`, uint8);
              const relPath = `storage/${bucket}/${fileObj.fullPath}`;
              checksums[relPath] = fileSha;

              bucketSummaries[bucket].count++;
              bucketSummaries[bucket].total_bytes += uint8.byteLength;
              bucketSummaries[bucket].files.push(fileObj.fullPath);

              totalStorageFiles++;
              totalStorageBytes += uint8.byteLength;

              if (category === 'photo' || isPhotoBucket) photosCount++;
              else if (category === 'video' || isVideoBucket) videosCount++;
              else if (category === 'document' || isDocumentBucket) documentsCount++;

              storageManifestEntries.push({
                bucket,
                path: fileObj.fullPath,
                category,
                mime_type: mime,
                size: uint8.byteLength,
                sha256: fileSha,
                updated_at: fileObj.updated_at || now.toISOString(),
                metadata: fileObj.metadata || {},
              });
            } catch (dlException) {
              console.warn(`[backupEngine] Erro ao processar ${bucket}/${fileObj.fullPath}:`, dlException);
            }
          }
        } catch (bErr) {
          console.warn(`[backupEngine] Erro ao listar bucket ${bucket}:`, bErr);
        }
      }

      // Regra de Integridade Obrigatória do Storage: comparação rigorosa
      if (includePhotos && sourcePhotosCount > photosCount) {
        throw new Error(
          `Falha de Integridade: ${sourcePhotosCount} fotos foram encontradas nos buckets, mas apenas ${photosCount} foram empacotadas no ZIP.`
        );
      }

      if (includeVideos && sourceVideosCount > videosCount) {
        throw new Error(
          `Falha de Integridade: ${sourceVideosCount} vídeos foram encontrados nos buckets, mas apenas ${videosCount} foram empacotados no ZIP.`
        );
      }

      if (totalSourceFiles > totalStorageFiles) {
        throw new Error(
          `Falha de Integridade: ${totalSourceFiles} arquivos de Storage foram encontrados, mas apenas ${totalStorageFiles} foram empacotados no ZIP.`
        );
      }

      // -----------------------------------------------------------------------
      // ETAPA 4: MANIFEST, METADATA E COMPACTAÇÃO ZIP
      // -----------------------------------------------------------------------
      report('packaging', 'Gerando manifesto estruturado e compactando...', 'JSZip Packaging', 65);

      const manifest = {
        backup_version: '1.0',
        application: 'Jucélia Santana Engenharia Civil',
        created_at: now.toISOString(),
        created_by: {
          id: adminId,
          email: adminEmail,
          name: adminName || profile?.full_name || 'Administrador',
        },
        backup_type: 'manual',
        source_environment: 'production',
        database_summary: {
          total_tables: tablesToBackup.length,
          total_records: totalRecords,
          tables: tableSummaries,
        },
        storage_summary: {
          include_photos: includePhotos,
          include_videos: includeVideos,
          include_documents: includeDocuments,
          photos_count: photosCount,
          videos_count: videosCount,
          documents_count: documentsCount,
          total_buckets: bucketsToBackup.length,
          total_files: totalStorageFiles,
          total_bytes: totalStorageBytes,
          storage_buckets_included: bucketsToBackup,
          buckets: bucketSummaries,
        },
        metadata: {
          generated_by: 'backupEngine v1.0',
          destination_provider: 'google_drive',
          destination_folder_name: folderName,
          include_photos: includePhotos,
          include_videos: includeVideos,
          include_documents: includeDocuments,
        },
      };

      const manifestStr = JSON.stringify(manifest, null, 2);
      const manifestSha = await calculateSha256(manifestStr);
      checksums['manifest.json'] = manifestSha;

      zip.file('manifest.json', manifestStr);
      metaFolder?.file('checksums.json', JSON.stringify(checksums, null, 2));
      metaFolder?.file('storage.json', JSON.stringify(storageManifestEntries, null, 2));
      metaFolder?.file(
        'schema.json',
        JSON.stringify(
          {
            format_version: '1.0',
            engine: 'PostgreSQL / Supabase / Google Drive',
            database_tables: tablesToBackup,
            storage_buckets: bucketsToBackup,
            documentation: 'Pacote de backup oficial estruturado do Ecossistema Jucélia Santana Engenharia Civil',
          },
          null,
          2
        )
      );

      // Gera o arquivo ZIP final em memória como Uint8Array
      const zipUint8Array = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const finalPackageSha256 = await calculateSha256(zipUint8Array);
      const packageSize = zipUint8Array.byteLength;

      if (packageSize <= 0) {
        throw new Error('Falha na geração do pacote: o arquivo gerado possui 0 bytes.');
      }

      // -----------------------------------------------------------------------
      // ETAPA 5: ENVIO REAL AO GOOGLE DRIVE
      // -----------------------------------------------------------------------
      report('uploading', 'Enviando arquivo real para o Google Drive...', `${(packageSize / 1024 / 1024).toFixed(2)} MB`, 85);

      // Auditoria: BACKUP_UPLOAD_STARTED
      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_UPLOAD_STARTED',
        entity_type: 'system_backups',
        entity_id: backupRecordId,
        details: {
          file_name: fileName,
          file_size: packageSize,
          sha256: finalPackageSha256,
          destination_folder_id: folderId,
        },
      });

      const uploadResult = await this.uploadToGoogleDrive({
        fileName,
        fileData: zipUint8Array,
        folderId,
        backupId: backupRecordId,
      });

      if (!uploadResult.success || !uploadResult.fileId) {
        throw new Error(uploadResult.error || 'Falha no upload para o Google Drive.');
      }

      // Auditoria: BACKUP_UPLOAD_COMPLETED
      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_UPLOAD_COMPLETED',
        entity_type: 'system_backups',
        entity_id: backupRecordId,
        details: {
          file_id: uploadResult.fileId,
          file_name: fileName,
          file_size: uploadResult.fileSize || packageSize,
          web_view_link: uploadResult.webViewLink,
        },
      });

      // -----------------------------------------------------------------------
      // ETAPA 6: FINALIZAÇÃO E ATUALIZAÇÃO NO SUPABASE
      // -----------------------------------------------------------------------
      report('finalizing', 'Finalizando e registrando auditoria...', 'Concluindo operação', 95);

      const completedAt = new Date().toISOString();
      const executionDurationMs = Date.now() - startTime;

      const finalMetadata: SystemBackupMetadata = {
        format_version: '1.0',
        sha256_checksum: finalPackageSha256,
        manifest_checksum: manifestSha,
        total_tables: tablesToBackup.length,
        total_records: totalRecords,
        total_storage_files: totalStorageFiles,
        total_storage_bytes: totalStorageBytes,
        destination_folder_id: folderId,
        destination_folder_name: folderName,
        google_drive_file_id: uploadResult.fileId,
        google_drive_view_link: uploadResult.webViewLink,
        execution_duration_ms: executionDurationMs,
        tables_included: tablesToBackup,
        storage_buckets_included: bucketsToBackup,
        include_photos: includePhotos,
        include_videos: includeVideos,
        include_documents: includeDocuments,
        photos_count: photosCount,
        videos_count: videosCount,
        documents_count: documentsCount,
      };

      // Atualiza o registro em public.system_backups com status 'completed'
      const { data: completedBackup, error: updateErr } = await supabase
        .from('system_backups')
        .update({
          status: 'completed',
          file_id: uploadResult.fileId,
          file_name: fileName,
          file_size: uploadResult.fileSize || packageSize,
          completed_at: completedAt,
          metadata: finalMetadata,
          error_message: null,
          updated_at: completedAt,
        })
        .eq('id', backupRecordId)
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

      if (updateErr || !completedBackup) {
        console.warn('[backupEngine] Aviso ao atualizar registro concluído:', updateErr);
      }

      // Atualiza timestamp em site_settings.backup_settings
      try {
        const { data: currentSettings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'backup_settings')
          .maybeSingle();

        if (currentSettings && typeof currentSettings.value === 'object' && currentSettings.value !== null) {
          const valObj = currentSettings.value as Record<string, any>;
          await supabase
            .from('site_settings')
            .update({
              value: {
                ...valObj,
                last_backup_at: completedAt,
                google_drive_connected: true,
                google_drive_status: 'connected',
              },
              updated_at: completedAt,
            })
            .eq('key', 'backup_settings');
        }
      } catch (sErr) {
        console.warn('[backupEngine] Aviso ao atualizar backup_settings last_backup_at:', sErr);
      }

      // Auditoria: BACKUP_MANUAL_COMPLETED
      await supabaseDatabase.logAdminAction({
        user_id: adminId,
        user_email: adminEmail,
        action: 'BACKUP_MANUAL_COMPLETED',
        entity_type: 'system_backups',
        entity_id: backupRecordId,
        details: {
          backup_name: fileName,
          file_id: uploadResult.fileId,
          file_size: uploadResult.fileSize || packageSize,
          sha256: finalPackageSha256,
          total_records: totalRecords,
          total_storage_files: totalStorageFiles,
          duration_ms: executionDurationMs,
        },
      });

      report('completed', 'Backup manual concluído com sucesso e enviado ao Google Drive!', fileName, 100);

      return {
        backup: (completedBackup as SystemBackup) || (newBackup as SystemBackup),
        fileId: uploadResult.fileId,
        fileName,
        fileSize: uploadResult.fileSize || packageSize,
        sha256: finalPackageSha256,
        webViewLink: uploadResult.webViewLink,
      };
    } catch (err: any) {
      console.error('[backupEngine] Erro na execução do backup manual:', err);
      const safeErrorMsg = err.message || 'Erro inesperado durante a execução do backup manual.';

      // Atualiza status do registro para 'failed' se o registro já havia sido criado
      if (backupRecordId) {
        try {
          await supabase
            .from('system_backups')
            .update({
              status: 'failed',
              error_message: safeErrorMsg,
              updated_at: new Date().toISOString(),
            })
            .eq('id', backupRecordId);

          await supabaseDatabase.logAdminAction({
            user_id: adminId,
            user_email: adminEmail,
            action: 'BACKUP_MANUAL_FAILED',
            entity_type: 'system_backups',
            entity_id: backupRecordId,
            details: { error: safeErrorMsg, file_name: fileName },
          });
        } catch (logErr) {
          console.error('[backupEngine] Erro ao registrar falha:', logErr);
        }
      }

      report('failed', `Falha no backup: ${safeErrorMsg}`, safeErrorMsg, 100);
      throw new Error(safeErrorMsg);
    }
  },

  /**
   * Valida se existe conexão ativa e saudável com o Google Drive consultando a Edge Function server-side
   */
  async validateGoogleDriveConnection(adminId: string, adminEmail: string): Promise<{
    connected: boolean;
    folderId?: string;
    folderName?: string;
    accountEmail?: string;
    error?: string;
  }> {
    try {
      // 1. Consulta exclusivamente a Edge Function oficial (google-drive-oauth?action=status)
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-drive-oauth?action=status`;

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'apikey': supabaseAnonKey,
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      try {
        const edgeRes = await fetch(edgeFunctionUrl, {
          method: 'GET',
          headers,
        });

        if (edgeRes.ok) {
          const data = await edgeRes.json();
          if (data.configured && data.connected) {
            return {
              connected: true,
              folderId: data.connection?.drive_folder_id || undefined,
              folderName: data.connection?.drive_folder_name || 'Jucélia Santana Engenharia Civil — Backups',
              accountEmail: data.connection?.account_email || undefined,
            };
          } else {
            return {
              connected: false,
              error: data.connection?.error_message || data.error || 'Nenhuma conexão ativa com o Google Drive encontrada.',
            };
          }
        }
      } catch (edgeErr) {
        console.warn('[backupEngine] Erro ao consultar Edge Function status:', edgeErr);
      }

      // 2. Fallback de verificação no backend local se a Edge Function estiver indisponível
      try {
        const localRes = await fetch('/api/google-drive/status');
        if (localRes.ok) {
          const localData = await localRes.json();
          if (localData.configured && localData.connected) {
            return {
              connected: true,
              folderId: localData.folder_id || undefined,
              folderName: localData.folder_name || 'Jucélia Santana Engenharia Civil — Backups',
              accountEmail: localData.account_email || undefined,
            };
          }
        }
      } catch (localErr) {
        console.warn('[backupEngine] Erro no status local:', localErr);
      }

      return {
        connected: false,
        error: 'Nenhuma conexão ativa com o Google Drive encontrada no servidor. Conecte sua conta no painel.',
      };
    } catch (err: any) {
      return {
        connected: false,
        error: err.message || 'Erro ao validar conexão com o Google Drive.',
      };
    }
  },

  /**
   * Realiza upload de backup server-side diretamente para o Google Drive sem expor tokens
   */
  async uploadToGoogleDrive(params: {
    fileName: string;
    fileData: Uint8Array;
    folderId?: string;
    backupId?: string;
  }): Promise<{
    success: boolean;
    fileId?: string;
    fileName?: string;
    fileSize?: number;
    webViewLink?: string;
    error?: string;
  }> {
    const { fileName, fileData, folderId, backupId } = params;
    const base64Data = uint8ArrayToBase64(fileData);

    // 1. Tenta envio prioritário via Supabase Edge Function (action=upload-backup)
    try {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/google-drive-oauth?action=upload-backup`;

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const edgeRes = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileName,
          fileData: base64Data,
          folderId,
          backupId,
        }),
      });

      if (edgeRes.ok) {
        const edgeData = await edgeRes.json();
        if (edgeData.success && edgeData.fileId) {
          return {
            success: true,
            fileId: edgeData.fileId,
            fileName: edgeData.fileName || fileName,
            fileSize: edgeData.fileSize || fileData.byteLength,
            webViewLink: edgeData.webViewLink || `https://drive.google.com/file/d/${edgeData.fileId}/view`,
          };
        } else {
          return {
            success: false,
            error: edgeData.error || 'Falha ao processar o upload no Google Drive.',
          };
        }
      } else {
        const errJson = await edgeRes.json().catch(() => ({}));
        const errMsg = errJson.error || `Erro retornado pelo Google Drive (HTTP ${edgeRes.status}).`;
        console.warn('[backupEngine] Edge Function upload warning:', errMsg);
        return {
          success: false,
          error: errMsg,
        };
      }
    } catch (edgeErr: any) {
      console.warn('[backupEngine] Falha de rede na Edge Function de upload:', edgeErr);
    }

    // 2. Fallback: Upload via Proxy do Backend Local
    try {
      const proxyRes = await fetch('/api/google-drive/upload-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileData: base64Data,
          folderId,
          backupId,
        }),
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success && proxyData.fileId) {
          return {
            success: true,
            fileId: proxyData.fileId,
            fileName: proxyData.fileName || fileName,
            fileSize: proxyData.fileSize || fileData.byteLength,
            webViewLink: proxyData.webViewLink || `https://drive.google.com/file/d/${proxyData.fileId}/view`,
          };
        }
      }

      const errData = await proxyRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || 'Falha ao enviar backup para o Google Drive.',
      };
    } catch (proxyErr: any) {
      return {
        success: false,
        error: proxyErr.message || 'Erro de comunicação ao enviar arquivo para o Google Drive.',
      };
    }
  },
};
