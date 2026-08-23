// /src/services/supabaseStorage.ts
import { supabase } from '../lib/supabase';
import { validateUploadFile, generateSafeStoragePath } from '../utils/securityUtils';

export type StorageBucket =
  | 'profile-images'
  | 'hero-images'
  | 'project-images'
  | 'project-videos'
  | 'blog-images'
  | 'documents'
  | 'proposal-files'
  | 'site-assets';

/**
 * Service de Armazenamento de Arquivos Supabase (Supabase Storage)
 */
export const supabaseStorage = {
  /**
   * Envia um arquivo para o bucket especificado no Supabase Storage
   */
  async uploadFile(bucket: StorageBucket, path: string, file: File | Blob, options?: { cacheControl?: string; upsert?: boolean }) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert ?? true,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Obtém a URL pública direta de um arquivo no bucket
   */
  getPublicUrl(bucket: StorageBucket, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Remove um ou mais arquivos do bucket
   */
  async deleteFile(bucket: StorageBucket, paths: string[]) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) throw error;
    return data;
  },

  /**
   * Lista arquivos dentro de uma pasta do bucket
   */
  async listFiles(bucket: StorageBucket, folderPath?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath || '', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) throw error;
    return data;
  },

  /**
   * Envia um asset de identidade visual tentando 'site-assets' e retrocedendo para 'hero-images' se necessário.
   * Retorna a URL pública com cache-busting.
   */
  async uploadVisualAsset(assetKey: string, file: File): Promise<string> {
    const val = validateUploadFile(file, 'IMAGE');
    if (!val.isValid) {
      throw new Error(val.errorMessage || 'Arquivo de imagem inválido para identidade visual.');
    }

    const filePath = generateSafeStoragePath('branding', file.name, `identity_${assetKey}`);
    let primaryBucket: StorageBucket = 'site-assets';

    try {
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    } catch (err: any) {
      console.warn(`[supabaseStorage] Falha ao enviar para ${primaryBucket}, tentando bucket secundário 'hero-images':`, err);
      primaryBucket = 'hero-images';
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    }

    const publicUrl = this.getPublicUrl(primaryBucket, filePath);
    // Adiciona parâmetro de versão para cache-busting imediato no navegador
    return `${publicUrl}?v=${Date.now()}`;
  },

  /**
   * Envia uma nova imagem para os slides do Dashboard no bucket 'hero-images'
   */
  async uploadSlideImage(file: File): Promise<{ publicUrl: string; path: string }> {
    const val = validateUploadFile(file, 'IMAGE');
    if (!val.isValid) {
      throw new Error(val.errorMessage || 'Arquivo de imagem inválido para slide.');
    }

    const filePath = generateSafeStoragePath('slides', file.name, 'slide');
    let primaryBucket: StorageBucket = 'hero-images';

    try {
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    } catch (err: any) {
      console.warn(`[supabaseStorage] Falha ao enviar para ${primaryBucket}, tentando 'site-assets':`, err);
      primaryBucket = 'site-assets';
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    }

    const publicUrl = `${this.getPublicUrl(primaryBucket, filePath)}?v=${Date.now()}`;
    return { publicUrl, path: filePath };
  },

  /**
   * Remove a imagem de um slide do Supabase Storage
   */
  async deleteSlideImage(filePath: string): Promise<boolean> {
    if (!filePath) return false;
    try {
      await this.deleteFile('hero-images', [filePath]);
      return true;
    } catch {
      try {
        await this.deleteFile('site-assets', [filePath]);
        return true;
      } catch (err) {
        console.warn('[supabaseStorage] Aviso ao remover arquivo de imagem do slide do Storage:', filePath, err);
        return false;
      }
    }
  },

  /**
   * Envia uma nova foto de perfil institucional/técnico no bucket 'profile-images'
   */
  async uploadInstitutionalPhoto(file: File): Promise<{ publicUrl: string; path: string }> {
    const val = validateUploadFile(file, 'IMAGE');
    if (!val.isValid) {
      throw new Error(val.errorMessage || 'Arquivo de imagem inválido para foto de perfil.');
    }

    const filePath = generateSafeStoragePath('institutional', file.name, 'profile');
    let primaryBucket: StorageBucket = 'profile-images';

    try {
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    } catch (err: any) {
      console.warn(`[supabaseStorage] Falha ao enviar para ${primaryBucket}, tentando 'site-assets':`, err);
      primaryBucket = 'site-assets';
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    }

    const publicUrl = `${this.getPublicUrl(primaryBucket, filePath)}?v=${Date.now()}`;
    return { publicUrl, path: filePath };
  },

  /**
   * Remove uma foto de perfil institucional do Supabase Storage
   */
  async deleteInstitutionalPhoto(filePath: string): Promise<boolean> {
    if (!filePath) return false;
    try {
      await this.deleteFile('profile-images', [filePath]);
      return true;
    } catch {
      try {
        await this.deleteFile('site-assets', [filePath]);
        return true;
      } catch (err) {
        console.warn('[supabaseStorage] Aviso ao remover foto de perfil do Storage:', filePath, err);
        return false;
      }
    }
  },

  /**
   * Envia uma nova imagem de capa para artigo técnico / laudo no bucket 'blog-images'
   */
  async uploadBlogCoverImage(file: File): Promise<{ publicUrl: string; path: string }> {
    const val = validateUploadFile(file, 'IMAGE');
    if (!val.isValid) {
      throw new Error(val.errorMessage || 'Arquivo de imagem inválido para capa de artigo.');
    }

    const filePath = generateSafeStoragePath('articles', file.name, 'article');
    let primaryBucket: StorageBucket = 'blog-images';

    try {
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    } catch (err: any) {
      console.warn(`[supabaseStorage] Falha ao enviar para ${primaryBucket}, tentando 'site-assets':`, err);
      primaryBucket = 'site-assets';
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    }

    const publicUrl = `${this.getPublicUrl(primaryBucket, filePath)}?v=${Date.now()}`;
    return { publicUrl, path: filePath };
  },

  /**
   * Remove uma imagem de capa de artigo técnico do Supabase Storage
   */
  async deleteBlogCoverImage(filePath: string): Promise<boolean> {
    if (!filePath) return false;
    try {
      await this.deleteFile('blog-images', [filePath]);
      return true;
    } catch {
      try {
        await this.deleteFile('site-assets', [filePath]);
        return true;
      } catch (err) {
        console.warn('[supabaseStorage] Aviso ao remover imagem do artigo do Storage:', filePath, err);
        return false;
      }
    }
  },

  /**
   * Envia um Documento Técnico / Material de Engenharia para o bucket 'documents'
   * Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
   */
  async uploadTechnicalDocument(file: File, documentSlug?: string): Promise<{ publicUrl: string; path: string; fileName: string; mimeType: string; fileSize: number }> {
    const val = validateUploadFile(file, 'DOCUMENT');
    if (!val.isValid) {
      throw new Error(val.errorMessage || 'Formato de documento inválido ou não seguro.');
    }

    const cleanSlug = (documentSlug || 'doc')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const cleanOriginalName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    const filePath = generateSafeStoragePath('technical_docs', file.name, cleanSlug || 'doc');
    let primaryBucket: StorageBucket = 'documents';

    try {
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    } catch (err: any) {
      console.warn(`[supabaseStorage] Falha ao enviar documento para '${primaryBucket}', tentando 'site-assets':`, err);
      primaryBucket = 'site-assets';
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    }

    const publicUrl = `${this.getPublicUrl(primaryBucket, filePath)}?v=${Date.now()}`;
    return {
      publicUrl,
      path: filePath,
      fileName: cleanOriginalName,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
    };
  },

  /**
   * Remove um Documento Técnico do Supabase Storage
   */
  async deleteTechnicalDocument(filePath: string): Promise<boolean> {
    if (!filePath) return false;
    try {
      await this.deleteFile('documents', [filePath]);
      return true;
    } catch {
      try {
        await this.deleteFile('site-assets', [filePath]);
        return true;
      } catch (err) {
        console.warn('[supabaseStorage] Aviso ao remover documento técnico do Storage:', filePath, err);
        return false;
      }
    }
  },

  /**
   * Envia um anexo/planta/croqui fornecido pelo cliente para a solicitação de proposta
   */
  async uploadProposalAttachment(file: File): Promise<{
    url: string;
    path: string;
    name: string;
    size: number;
    type: string;
  }> {
    const val = validateUploadFile(file, 'PROPOSAL_ATTACHMENT');
    if (!val.isValid) {
      throw new Error(val.errorMessage || 'Arquivo de anexo de proposta inválido.');
    }

    const cleanOriginalName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    const filePath = generateSafeStoragePath('proposals', file.name, 'prop');
    let primaryBucket: StorageBucket = 'proposal-files';

    try {
      await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
    } catch (err: any) {
      console.warn(`[supabaseStorage] Falha ao enviar para '${primaryBucket}', tentando 'documents':`, err);
      primaryBucket = 'documents';
      try {
        await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
      } catch (err2: any) {
        console.warn(`[supabaseStorage] Falha ao enviar para '${primaryBucket}', tentando 'site-assets':`, err2);
        primaryBucket = 'site-assets';
        await this.uploadFile(primaryBucket, filePath, file, { cacheControl: '86400', upsert: true });
      }
    }

    const publicUrl = `${this.getPublicUrl(primaryBucket, filePath)}?v=${Date.now()}`;
    return {
      url: publicUrl,
      path: filePath,
      name: cleanOriginalName,
      size: file.size,
      type: file.type || 'application/octet-stream',
    };
  },

  /**
   * Remove um anexo de proposta do Storage
   */
  async deleteProposalAttachment(filePath: string): Promise<boolean> {
    if (!filePath) return false;
    const buckets: StorageBucket[] = ['proposal-files', 'documents', 'site-assets'];
    for (const b of buckets) {
      try {
        await this.deleteFile(b, [filePath]);
        return true;
      } catch {
        // tenta o próximo bucket
      }
    }
    return false;
  }
};

