// /src/services/supabaseDatabase.ts
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { DashboardSlide, InstitutionalPhoto, InviteCode } from '../types';
import type { SiteContentSettings, FaqItemContent } from '../types/content';
import type { MediaDisplaySetting, MediaDisplaySettingsMap } from '../types/mediaDisplay';
import type { SiteDomain, CreateDomainInput, UpdateDomainInput } from '../types/domain';
import { normalizeDomain, validateDomain, getDomainLookupVariants, formatDatabaseErrorMessage } from '../utils/domainUtils';
import { DEFAULT_SITE_CONTENT } from '../data/defaultSiteContent';

export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type ProjectImageRow = Database['public']['Tables']['project_images']['Row'];
export type ProjectImageInsert = Database['public']['Tables']['project_images']['Insert'];

export type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];
export type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];
export type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update'];

export type SiteSettingsRow = Database['public']['Tables']['site_settings']['Row'];

export type ContactMessageRow = Database['public']['Tables']['contact_messages']['Row'];
export type ContactMessageInsert = Database['public']['Tables']['contact_messages']['Insert'];
export type ContactMessageUpdate = Database['public']['Tables']['contact_messages']['Update'];

export type TechnicalDocumentRow = Database['public']['Tables']['technical_documents']['Row'];
export type TechnicalDocumentInsert = Database['public']['Tables']['technical_documents']['Insert'];
export type TechnicalDocumentUpdate = Database['public']['Tables']['technical_documents']['Update'];

export type SiteDomainRow = Database['public']['Tables']['site_domains']['Row'];
export type SiteDomainInsert = Database['public']['Tables']['site_domains']['Insert'];
export type SiteDomainUpdate = Database['public']['Tables']['site_domains']['Update'];

export type SystemBackupRow = Database['public']['Tables']['system_backups']['Row'];
export type SystemBackupInsert = Database['public']['Tables']['system_backups']['Insert'];
export type SystemBackupUpdate = Database['public']['Tables']['system_backups']['Update'];

export type AuditLogRow = Database['public']['Tables']['admin_audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['admin_audit_logs']['Insert'];

/**
 * Service de Banco de Dados Supabase (PostgreSQL CRUD)
 */
export const supabaseDatabase = {
  // ==========================================
  // PROJECTS & PROJECT IMAGES
  // ==========================================
  async getProjects(includeSoftDeleted = false) {
    if (!isSupabaseConfigured) {
      return null;
    }
    try {
      let query = supabase
        .from('projects')
        .select('*, project_images(*)')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (!includeSoftDeleted) {
        query = query.is('deleted_at', null);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[supabaseDatabase] Aviso ao consultar projetos no Supabase:', error.message || error);
        return null;
      }

      // Se o banco estiver totalmente vazio (0 obras cadastradas), semeia automaticamente as obras iniciais
      if (data && data.length === 0) {
        const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        if (count === 0) {
          console.info('[supabaseDatabase] Nenhuma obra no banco de dados. Semeando obras iniciais no Supabase...');
          await supabaseDatabase.seedInitialProjects();
          
          const refetched = await query;
          return refetched.data || [];
        }
      }

      return data;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro de rede ao buscar projetos:', err);
      return null;
    }
  },

  async seedInitialProjects() {
    if (!isSupabaseConfigured) return;
    try {
      const { PROJECTS_DATA } = await import('../data/companyData');
      
      for (let index = 0; index < PROJECTS_DATA.length; index++) {
        const p = PROJECTS_DATA[index];
        const slug = p.id || p.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        const projectInsert: ProjectInsert = {
          title: p.title,
          slug: slug,
          category: p.category || 'estrutural',
          category_label: p.categoryLabel || 'Projetos Estruturais',
          description: p.description || '',
          image_url: typeof p.imageUrl === 'string' ? p.imageUrl : '',
          video_url: p.videoUrl || null,
          video_title: p.videoTitle || null,
          location: p.location || 'Ariquemes - RO',
          year: p.year || null,
          area: p.area || null,
          status: p.status || 'Concluído',
          services_executed: p.servicesExecuted || [],
          has_video: Boolean(p.hasVideo || p.videoUrl),
          featured: index < 3,
          order_index: index,
        };

        const { data: created, error } = await supabase
          .from('projects')
          .insert(projectInsert)
          .select()
          .single();

        if (error) {
          console.error('[supabaseDatabase] Erro ao semear obra inicial:', p.title, error.message || error);
          continue;
        }

        if (created) {
          const gallery = p.gallery && p.gallery.length > 0 ? p.gallery : [p.imageUrl];
          for (let imgIdx = 0; imgIdx < gallery.length; imgIdx++) {
            const imgUrl = gallery[imgIdx];
            if (imgUrl && typeof imgUrl === 'string') {
              await supabase.from('project_images').insert({
                project_id: created.id,
                image_url: imgUrl,
                order_index: imgIdx,
              });
            }
          }
        }
      }
      console.log('[supabaseDatabase] Obras iniciais do site semeadas com sucesso no banco de dados!');
    } catch (err) {
      console.error('[supabaseDatabase] Falha ao executar seedInitialProjects:', err);
    }
  },

  async getProjectBySlug(slug: string) {
    if (!isSupabaseConfigured) {
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_images(*)')
        .eq('slug', slug)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.warn('[supabaseDatabase] Aviso ao buscar projeto por slug:', error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar projeto por slug:', err);
      return null;
    }
  },

  async createProject(project: ProjectInsert) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: ProjectUpdate) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async softDeleteProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async restoreProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProjectPermanent(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async getProjectImages(projectId: string) {
    const { data, error } = await supabase
      .from('project_images')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async addProjectImage(image: ProjectImageInsert) {
    const { data, error } = await supabase
      .from('project_images')
      .insert(image)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProjectImage(imageId: string, updates: Partial<ProjectImageInsert>) {
    const { data, error } = await supabase
      .from('project_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProjectImageOrder(imageId: string, orderIndex: number) {
    const { data, error } = await supabase
      .from('project_images')
      .update({ order_index: orderIndex })
      .eq('id', imageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProjectImage(imageId: string) {
    const { error } = await supabase
      .from('project_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
    return true;
  },

  // ==========================================
  // BLOG POSTS / LAUDOS E ARTIGOS
  // ==========================================
  async getBlogPosts(onlyPublished = true, includeSoftDeleted = false) {
    if (!isSupabaseConfigured) {
      return null;
    }
    try {
      // 1. Verifica se a tabela blog_posts está totalmente vazia antes da consulta
      const { count, error: countError } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });

      if (!countError && count === 0) {
        // Semeia artigos iniciais reais no banco de dados Supabase
        console.log('[supabaseDatabase] Semeando artigos e laudos iniciais na tabela blog_posts...');
        const seedPosts = [
          {
            title: 'Laudo Pericial de Patologia Estrutural em Edificações Residenciais',
            slug: 'laudo-pericial-patologia-estrutural',
            category: 'Laudos & Perícias',
            summary: 'Análise técnica detalhada das manifestações patológicas, trincas, fissuras e armaduras expostas em estruturas de concreto armado.',
            content: `O laudo pericial de engenharia diagnóstica tem como objetivo identificar a origem das trincas e fissuras encontradas na estrutura de concreto.

Durante a vistoria técnica, foram utilizados esclerômetro mecânico e análises visuais sistemáticas para mensurar a resistência do concreto e mapear a evolução dos danos.

Soluções Recomendadas:
1. Tratamento de corrosão de armaduras.
2. Injeção de resina epóxi em fissuras estruturais.
3. Recuperação do cobrimento de concreto conforme a NBR 6118.`,
            cover_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200',
            author: 'Engª Jucélia Santana',
            published: true,
          },
          {
            title: 'Projeto e Dimensionamento de Galpões Metálicos para o Agronegócio',
            slug: 'projeto-galpoes-metalicos-agronegocio',
            category: 'Projetos Estruturais',
            summary: 'Critérios técnicos para o cálculo e verificação de estruturas metálicas sujeitas às ações de ventos e cargas industriais em Rondônia.',
            content: `Estruturas metálicas voltadas ao agronegócio exigem cálculo rigoroso da ação do vento (NBR 6123) e proteção contra corrosão em ambientes severos.

A utilização de perfis laminados e treliças otimizadas garante economia no consumo de aço sem comprometer os coeficientes de segurança exigidos.`,
            cover_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200',
            author: 'Engª Jucélia Santana',
            published: true,
          },
        ];

        await supabase.from('blog_posts').insert(seedPosts);
      }

      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (onlyPublished) {
        query = query.eq('published', true);
      }
      if (!includeSoftDeleted) {
        query = query.is('deleted_at', null);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[supabaseDatabase] Aviso ao buscar artigos:', error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar artigos:', err);
      return null;
    }
  },

  async getBlogPostBySlug(slug: string) {
    if (!isSupabaseConfigured) {
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.warn('[supabaseDatabase] Aviso ao buscar artigo por slug:', error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar artigo por slug:', err);
      return null;
    }
  },

  async createBlogPost(post: BlogPostInsert) {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBlogPost(id: string, updates: BlogPostUpdate) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async softDeleteBlogPost(id: string) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBlogPostPermanent(id: string) {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // ==========================================
  // SITE SETTINGS
  // ==========================================
  async getSiteSetting(key: string) {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.value : null;
  },

  async updateSiteSetting(key: string, value: any, userId?: string) {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key,
          value,
          updated_by: userId || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDashboardSlides(): Promise<DashboardSlide[]> {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      const saved = await this.getSiteSetting('dashboard_slides');
      if (Array.isArray(saved) && saved.length > 0) {
        return saved as DashboardSlide[];
      }

      // Se não houver slides cadastrados, semeia os 5 slides padrões com referências seguras
      const defaultSlideUrls = [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80'
      ];

      const now = new Date().toISOString();
      const initialSlides: DashboardSlide[] = [
        {
          id: 'slide-01',
          title: 'Projeto Central 01',
          description: 'Acompanhamento e Cálculo Estrutural em Ariquemes - RO',
          image_url: defaultSlideUrls[0],
          storage_path: null,
          order_index: 0,
          active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'slide-02',
          title: 'Projeto Central 02',
          description: 'Execução de Obras Residenciais e Comerciais',
          image_url: defaultSlideUrls[1],
          storage_path: null,
          order_index: 1,
          active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'slide-03',
          title: 'Projeto Central 03',
          description: 'Infraestrutura e Projetos de Engenharia Agroindustrial',
          image_url: defaultSlideUrls[2],
          storage_path: null,
          order_index: 2,
          active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'slide-04',
          title: 'Projeto Central 04',
          description: 'Laudos Periciais e Vistorias Técnicas NBR',
          image_url: defaultSlideUrls[3],
          storage_path: null,
          order_index: 3,
          active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'slide-05',
          title: 'Projeto Central 05',
          description: 'Projetos Estruturais Executivos em Rondônia',
          image_url: defaultSlideUrls[4],
          storage_path: null,
          order_index: 4,
          active: true,
          created_at: now,
          updated_at: now,
        },
      ];

      await this.updateSiteSetting('dashboard_slides', initialSlides);
      return initialSlides;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar slides do Dashboard:', err);
      return [];
    }
  },

  async saveDashboardSlides(slides: DashboardSlide[], userId?: string) {
    return await this.updateSiteSetting('dashboard_slides', slides, userId);
  },

  async getInstitutionalPhotos(): Promise<InstitutionalPhoto[]> {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      const saved = await this.getSiteSetting('institutional_photos');
      if (Array.isArray(saved) && saved.length > 0) {
        return saved as InstitutionalPhoto[];
      }

      // Se não houver fotos cadastradas, semeia as fotos padrões a partir do acervo institucional
      const { PROFILE_PHOTOS } = await import('../data/engineerPhotos');
      const now = new Date().toISOString();

      const initialPhotos: InstitutionalPhoto[] = PROFILE_PHOTOS.map((photo, idx) => ({
        id: photo.id || `profile-${idx + 1}`,
        title: photo.title || `Retrato Institucional ${idx + 1}`,
        category: photo.category || 'Perfil Profissional & Engenharia',
        pose: photo.pose || 'Atuação Executiva e Consultoria',
        outfit: photo.outfit || 'Engenheira Civil',
        caption: photo.caption || 'Engª Jucélia Santana - Engenharia Civil e Projetos.',
        image_url: photo.url,
        storage_path: null,
        is_primary: idx === 0, // Foto principal da seção Sobre
        order_index: idx,
        active: true,
        created_at: now,
        updated_at: now,
      }));

      await this.updateSiteSetting('institutional_photos', initialPhotos);
      return initialPhotos;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar fotos institucionais:', err);
      return [];
    }
  },

  async saveInstitutionalPhotos(photos: InstitutionalPhoto[], userId?: string) {
    return await this.updateSiteSetting('institutional_photos', photos, userId);
  },


  // ==========================================
  // CONTACT MESSAGES
  // ==========================================
  async sendContactMessage(message: ContactMessageInsert) {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getContactMessages() {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateContactMessage(id: string, updates: ContactMessageUpdate) {
    const { data, error } = await supabase
      .from('contact_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // ADMIN AUDIT LOGS
  // ==========================================
  async logAdminAction(log: AuditLogInsert) {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      console.error('Erro ao gravar log de auditoria:', error);
    }
    return data;
  },

  async getAuditLogs(limit = 100) {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('[supabaseDatabase] Aviso ao buscar logs de auditoria:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar logs de auditoria:', err);
      return [];
    }
  },

  /**
   * Exclui um registro individual de auditoria do banco de dados
   */
  async deleteAuditLog(id: string, performerUserId?: string, performerEmail?: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true;
    }
    try {
      const { error } = await supabase
        .from('admin_audit_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[supabaseDatabase] Erro ao excluir registro de auditoria:', error);
        throw error;
      }

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Exceção ao excluir registro de auditoria:', err);
      throw err;
    }
  },

  /**
   * Exclui múltiplos registros de auditoria em lote do banco de dados
   */
  async deleteAuditLogsBatch(ids: string[], performerUserId?: string, performerEmail?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !ids.length) {
      return true;
    }
    try {
      const { error } = await supabase
        .from('admin_audit_logs')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('[supabaseDatabase] Erro ao excluir lote de logs de auditoria:', error);
        throw error;
      }

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Exceção ao excluir lote de auditoria:', err);
      throw err;
    }
  },

  /**
   * Limpa todo o histórico de logs de auditoria no banco de dados
   */
  async clearAllAuditLogs(performerUserId?: string, performerEmail?: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true;
    }
    try {
      // Deleta todos os registros da tabela admin_audit_logs
      const { error } = await supabase
        .from('admin_audit_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('[supabaseDatabase] Erro ao limpar histórico de auditoria:', error);
        throw error;
      }

      // Registra o evento de limpeza de auditoria
      await this.logAdminAction({
        user_id: performerUserId || null,
        user_email: performerEmail || null,
        action: 'CLEAR_ALL_AUDIT_LOGS',
        entity_type: 'admin_audit_logs',
        entity_id: 'all',
        details: {
          cleared_at: new Date().toISOString(),
          cleared_by: performerEmail || performerUserId || 'admin',
        },
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Exceção ao limpar logs de auditoria:', err);
      throw err;
    }
  },

  // ==========================================
  // SITE CONTENT & LEGENDS SETTINGS
  // ==========================================
  async getSiteContent(): Promise<SiteContentSettings> {
    if (!isSupabaseConfigured) {
      return DEFAULT_SITE_CONTENT;
    }
    try {
      const saved = await this.getSiteSetting('site_content');
      if (!saved || typeof saved !== 'object') {
        return DEFAULT_SITE_CONTENT;
      }

      const defaultFaq = DEFAULT_SITE_CONTENT.faq;
      const savedFaq = (saved as Partial<SiteContentSettings>).faq;
      const mergedFaqItems = Array.isArray(savedFaq?.items) && savedFaq.items.length > 0
        ? savedFaq.items
        : defaultFaq.items;

      // Merge profundo de segurança para garantir que todos os campos e seções existam
      return {
        hero: { ...DEFAULT_SITE_CONTENT.hero, ...(saved as Partial<SiteContentSettings>).hero },
        about: { ...DEFAULT_SITE_CONTENT.about, ...(saved as Partial<SiteContentSettings>).about },
        services: { ...DEFAULT_SITE_CONTENT.services, ...(saved as Partial<SiteContentSettings>).services },
        projects: { ...DEFAULT_SITE_CONTENT.projects, ...(saved as Partial<SiteContentSettings>).projects },
        differentials: { ...DEFAULT_SITE_CONTENT.differentials, ...(saved as Partial<SiteContentSettings>).differentials },
        process: { ...DEFAULT_SITE_CONTENT.process, ...(saved as Partial<SiteContentSettings>).process },
        faq: {
          badgeText: savedFaq?.badgeText || defaultFaq.badgeText,
          title: savedFaq?.title || defaultFaq.title,
          highlightTitle: savedFaq?.highlightTitle || defaultFaq.highlightTitle,
          subtitle: savedFaq?.subtitle || defaultFaq.subtitle,
          items: mergedFaqItems,
        },
        cta: { ...DEFAULT_SITE_CONTENT.cta, ...(saved as Partial<SiteContentSettings>).cta },
        contact: { ...DEFAULT_SITE_CONTENT.contact, ...(saved as Partial<SiteContentSettings>).contact },
        footer: { ...DEFAULT_SITE_CONTENT.footer, ...(saved as Partial<SiteContentSettings>).footer },
      };
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar textos do site do Supabase, utilizando fallback:', err);
      return DEFAULT_SITE_CONTENT;
    }
  },

  async saveSiteContent(content: SiteContentSettings, userId?: string) {
    const res = await this.updateSiteSetting('site_content', content, userId);
    
    // Log na auditoria
    await this.logAdminAction({
      action: 'UPDATE_SITE_CONTENT',
      entity_type: 'site_settings',
      entity_id: 'site_content',
      details: {
        sections_updated: Object.keys(content),
      },
      user_id: userId || null,
    });

    return res;
  },

  async resetSiteContent(userId?: string): Promise<SiteContentSettings> {
    await this.updateSiteSetting('site_content', DEFAULT_SITE_CONTENT, userId);
    
    // Log na auditoria
    await this.logAdminAction({
      action: 'RESET_SITE_CONTENT',
      entity_type: 'site_settings',
      entity_id: 'site_content',
      details: {
        message: 'Textos e legendas restaurados para o padrão original',
      },
      user_id: userId || null,
    });

    return DEFAULT_SITE_CONTENT;
  },

  // Operações especializadas para FAQ e Esclarecimentos Técnicos existentes
  async updateFaqItem(updatedItem: FaqItemContent, userId?: string): Promise<boolean> {
    try {
      const currentContent = await this.getSiteContent();
      const items = currentContent.faq.items.map(item =>
        item.id === updatedItem.id ? { ...updatedItem, updated_at: new Date().toISOString() } : item
      );

      const newContent: SiteContentSettings = {
        ...currentContent,
        faq: {
          ...currentContent.faq,
          items,
        },
      };

      await this.updateSiteSetting('site_content', newContent, userId);

      await this.logAdminAction({
        action: 'UPDATE_FAQ_ITEM',
        entity_type: 'site_settings',
        entity_id: `faq_item_${updatedItem.id}`,
        details: {
          item_id: updatedItem.id,
          question: updatedItem.question,
          category: updatedItem.category,
          active: updatedItem.active,
          order: updatedItem.order,
        },
        user_id: userId || null,
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao atualizar item de FAQ:', err);
      throw err;
    }
  },

  async deleteFaqItem(itemId: string, userId?: string): Promise<boolean> {
    try {
      const currentContent = await this.getSiteContent();
      const targetItem = currentContent.faq.items.find(i => i.id === itemId);
      const items = currentContent.faq.items.filter(item => item.id !== itemId);

      const newContent: SiteContentSettings = {
        ...currentContent,
        faq: {
          ...currentContent.faq,
          items,
        },
      };

      await this.updateSiteSetting('site_content', newContent, userId);

      await this.logAdminAction({
        action: 'DELETE_FAQ_ITEM',
        entity_type: 'site_settings',
        entity_id: `faq_item_${itemId}`,
        details: {
          item_id: itemId,
          removed_question: targetItem?.question,
          remaining_count: items.length,
        },
        user_id: userId || null,
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao excluir item de FAQ:', err);
      throw err;
    }
  },

  async reorderFaqItems(items: FaqItemContent[], userId?: string): Promise<boolean> {
    try {
      const currentContent = await this.getSiteContent();
      const orderedItems = items.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));

      const newContent: SiteContentSettings = {
        ...currentContent,
        faq: {
          ...currentContent.faq,
          items: orderedItems,
        },
      };

      await this.updateSiteSetting('site_content', newContent, userId);

      await this.logAdminAction({
        action: 'REORDER_FAQ_ITEMS',
        entity_type: 'site_settings',
        entity_id: 'site_content_faq',
        details: {
          items_order: orderedItems.map(i => ({ id: i.id, order: i.order, question: i.question })),
        },
        user_id: userId || null,
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao reordenar itens de FAQ:', err);
      throw err;
    }
  },

  async toggleFaqItemStatus(itemId: string, active: boolean, userId?: string): Promise<boolean> {
    try {
      const currentContent = await this.getSiteContent();
      const targetItem = currentContent.faq.items.find(i => i.id === itemId);
      const items = currentContent.faq.items.map(item =>
        item.id === itemId ? { ...item, active, updated_at: new Date().toISOString() } : item
      );

      const newContent: SiteContentSettings = {
        ...currentContent,
        faq: {
          ...currentContent.faq,
          items,
        },
      };

      await this.updateSiteSetting('site_content', newContent, userId);

      await this.logAdminAction({
        action: active ? 'ACTIVATE_FAQ_ITEM' : 'DEACTIVATE_FAQ_ITEM',
        entity_type: 'site_settings',
        entity_id: `faq_item_${itemId}`,
        details: {
          item_id: itemId,
          question: targetItem?.question,
          new_status: active ? 'active' : 'inactive',
        },
        user_id: userId || null,
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao alterar status do item de FAQ:', err);
      throw err;
    }
  },

  // ==========================================
  // TECHNICAL DOCUMENTS & ENGINEERING ASSETS
  // ==========================================
  async getTechnicalDocuments(options?: {
    onlyPublished?: boolean;
    category?: string;
    documentType?: string;
    featuredOnly?: boolean;
    search?: string;
    includeSoftDeleted?: boolean;
  }): Promise<TechnicalDocumentRow[] | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
    try {
      // 1. Verifica se a tabela technical_documents está vazia para semear itens iniciais
      const { count, error: countError } = await supabase
        .from('technical_documents')
        .select('*', { count: 'exact', head: true });

      if (!countError && count === 0) {
        console.log('[supabaseDatabase] Semeando documentos técnicos iniciais no Supabase...');
        const seedDocs: TechnicalDocumentInsert[] = [
          {
            title: 'Manual de Uso, Operação e Manutenção da Edificação (ABNT NBR 5674)',
            slug: 'manual-uso-operacao-manutencao-nbr-5674',
            description: 'Diretrizes normativas e procedimentos para elaboração do programa de manutenção preventiva e corretiva predial conforme NBR 5674 e NBR 14037.',
            category: 'Normas e Referências',
            document_type: 'Guia',
            file_name: 'Manual_Manutencao_Edificacoes_NBR5674.pdf',
            file_path: 'technical_docs/manual_manutencao_nbr5674.pdf',
            file_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200',
            mime_type: 'application/pdf',
            file_size: 1845200,
            thumbnail_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600',
            is_published: true,
            is_featured: true,
            order_index: 0,
            downloads_count: 142,
            published_at: new Date().toISOString(),
          },
          {
            title: 'Laudo Técnico de Vistoria Cautelar de Vizinhança Pré-Obras',
            slug: 'laudo-vistoria-cautelar-vizinhanca',
            description: 'Modelo técnico de constatação pericial fotográfica e documental para registro de anomalias em imóveis confrontantes antes do início de fundações profundas.',
            category: 'Laudos Técnicos',
            document_type: 'Laudo Técnico',
            file_name: 'Laudo_Vistoria_Cautelar_Vizinhanca_Modelo.pdf',
            file_path: 'technical_docs/laudo_vistoria_cautelar.pdf',
            file_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200',
            mime_type: 'application/pdf',
            file_size: 2516580,
            thumbnail_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600',
            is_published: true,
            is_featured: true,
            order_index: 1,
            downloads_count: 98,
            published_at: new Date().toISOString(),
          },
          {
            title: 'Memorial Descritivo e Caderno de Encargos: Galpões Metálicos Agroindustriais',
            slug: 'memorial-descritivo-galpoes-metalicos-agro',
            description: 'Especificações de perfis de aço estrutural, tipos de ligações parafusadas/soldadas, sistemas de pintura anticorrosiva e cálculo de sobrecargas de vento (NBR 6123).',
            category: 'Memorial Descritivo',
            document_type: 'Memorial',
            file_name: 'Memorial_Galpoes_Metalicos_Agro.pdf',
            file_path: 'technical_docs/memorial_galpoes_agro.pdf',
            file_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200',
            mime_type: 'application/pdf',
            file_size: 3245100,
            thumbnail_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600',
            is_published: true,
            is_featured: false,
            order_index: 2,
            downloads_count: 75,
            published_at: new Date().toISOString(),
          },
          {
            title: 'Guia de Diagnóstico e Recuperação de Patologias em Concreto Armado',
            slug: 'guia-diagnostico-recuperacao-patologias-concreto',
            description: 'Metodologia para mapeamento de trincas, fissuras, corrosão de armaduras e delaminação de cobrimento com técnicas de esclerometria e injeção de epóxi.',
            category: 'Materiais Educativos',
            document_type: 'Artigo Técnico',
            file_name: 'Guia_Patologias_Concreto_Recuperacao.pdf',
            file_path: 'technical_docs/guia_patologias_concreto.pdf',
            file_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1200',
            mime_type: 'application/pdf',
            file_size: 2150000,
            thumbnail_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=600',
            is_published: true,
            is_featured: false,
            order_index: 3,
            downloads_count: 110,
            published_at: new Date().toISOString(),
          },
        ];

        await supabase.from('technical_documents').insert(seedDocs);
      }

      let query = supabase
        .from('technical_documents')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (options?.onlyPublished) {
        query = query.eq('is_published', true);
      }
      if (options?.featuredOnly) {
        query = query.eq('is_featured', true);
      }
      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }
      if (options?.documentType && options.documentType !== 'all') {
        query = query.eq('document_type', options.documentType);
      }
      if (!options?.includeSoftDeleted) {
        query = query.is('deleted_at', null);
      }
      if (options?.search && options.search.trim()) {
        const term = `%${options.search.trim()}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term},file_name.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[supabaseDatabase] Aviso ao consultar technical_documents:', error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar technical_documents:', err);
      return null;
    }
  },

  async getTechnicalDocumentBySlug(slug: string): Promise<TechnicalDocumentRow | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('technical_documents')
        .select('*')
        .eq('slug', slug)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.warn('[supabaseDatabase] Documento não encontrado pelo slug:', slug, error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar documento por slug:', err);
      return null;
    }
  },

  async getTechnicalDocumentById(id: string): Promise<TechnicalDocumentRow | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('technical_documents')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.warn('[supabaseDatabase] Documento não encontrado pelo ID:', id, error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar documento por ID:', err);
      return null;
    }
  },

  async createTechnicalDocument(doc: TechnicalDocumentInsert, userId?: string): Promise<TechnicalDocumentRow> {
    const { data, error } = await supabase
      .from('technical_documents')
      .insert({
        ...doc,
        created_by: userId || null,
        updated_by: userId || null,
        published_at: doc.is_published ? (doc.published_at || new Date().toISOString()) : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await this.logAdminAction({
      action: 'CREATE_TECHNICAL_DOCUMENT',
      entity_type: 'technical_documents',
      entity_id: data.id,
      details: {
        title: data.title,
        slug: data.slug,
        category: data.category,
        file_name: data.file_name,
        file_size: data.file_size,
        is_published: data.is_published,
        is_featured: data.is_featured,
      },
      user_id: userId || null,
    });

    return data;
  },

  async updateTechnicalDocument(id: string, updates: TechnicalDocumentUpdate, userId?: string): Promise<TechnicalDocumentRow> {
    const updatePayload: TechnicalDocumentUpdate = {
      ...updates,
      updated_by: userId || null,
      updated_at: new Date().toISOString(),
    };

    if (updates.is_published === true && !updates.published_at) {
      updatePayload.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('technical_documents')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const isFileUpdate = Boolean(updates.file_path || updates.file_url || updates.file_name);

    // Registrar auditoria
    await this.logAdminAction({
      action: isFileUpdate ? 'UPDATE_TECHNICAL_DOCUMENT_FILE' : 'UPDATE_TECHNICAL_DOCUMENT',
      entity_type: 'technical_documents',
      entity_id: id,
      details: {
        title: data.title,
        updated_fields: Object.keys(updates),
        is_file_updated: isFileUpdate,
      },
      user_id: userId || null,
    });

    return data;
  },

  async togglePublishDocument(id: string, isPublished: boolean, userId?: string): Promise<TechnicalDocumentRow> {
    const published_at = isPublished ? new Date().toISOString() : null;
    const { data, error } = await supabase
      .from('technical_documents')
      .update({
        is_published: isPublished,
        published_at,
        updated_by: userId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await this.logAdminAction({
      action: isPublished ? 'PUBLISH_TECHNICAL_DOCUMENT' : 'UNPUBLISH_TECHNICAL_DOCUMENT',
      entity_type: 'technical_documents',
      entity_id: id,
      details: {
        title: data.title,
        is_published: isPublished,
        published_at,
      },
      user_id: userId || null,
    });

    return data;
  },

  async toggleFeatureDocument(id: string, isFeatured: boolean, userId?: string): Promise<TechnicalDocumentRow> {
    const { data, error } = await supabase
      .from('technical_documents')
      .update({
        is_featured: isFeatured,
        updated_by: userId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await this.logAdminAction({
      action: isFeatured ? 'FEATURE_TECHNICAL_DOCUMENT' : 'UNFEATURE_TECHNICAL_DOCUMENT',
      entity_type: 'technical_documents',
      entity_id: id,
      details: {
        title: data.title,
        is_featured: isFeatured,
      },
      user_id: userId || null,
    });

    return data;
  },

  async reorderTechnicalDocuments(orderedIds: string[], userId?: string): Promise<boolean> {
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from('technical_documents')
          .update({
            order_index: i,
            updated_by: userId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderedIds[i]);
      }

      // Registrar auditoria
      await this.logAdminAction({
        action: 'REORDER_TECHNICAL_DOCUMENTS',
        entity_type: 'technical_documents',
        details: {
          total_reordered: orderedIds.length,
          order_sequence: orderedIds,
        },
        user_id: userId || null,
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao reordenar documentos técnicos:', err);
      throw err;
    }
  },

  async incrementDocumentDownloads(id: string): Promise<void> {
    try {
      const doc = await this.getTechnicalDocumentById(id);
      if (doc) {
        await supabase
          .from('technical_documents')
          .update({
            downloads_count: (doc.downloads_count || 0) + 1,
          })
          .eq('id', id);
      }
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao incrementar downloads:', err);
    }
  },

  async deleteTechnicalDocument(id: string, userId?: string): Promise<boolean> {
    // 1. Busca os metadados do documento para auditoria e deleção do Storage
    const existing = await this.getTechnicalDocumentById(id);

    // 2. Soft delete no banco (ou hard delete se desejado)
    const { error } = await supabase
      .from('technical_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // 3. Registrar auditoria
    await this.logAdminAction({
      action: 'DELETE_TECHNICAL_DOCUMENT',
      entity_type: 'technical_documents',
      entity_id: id,
      details: {
        title: existing?.title || 'Documento Removido',
        file_path: existing?.file_path,
        file_name: existing?.file_name,
      },
      user_id: userId || null,
    });

    return true;
  },

  // ==========================================
  // VOLUME 4 / ETAPA 11 - GESTÃO DE CONTATOS & TELEFONES
  // ==========================================

  /**
   * Obtém as configurações centralizadas de contato, telefone e WhatsApp do Supabase
   */
  async getContactSettings(): Promise<any> {
    try {
      const data = await this.getSiteSetting('contact_settings');
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data;
      }
      return null;
    } catch (err) {
      console.warn('[supabaseDatabase] Aviso ao carregar contact_settings:', err);
      return null;
    }
  },

  /**
   * Salva as configurações centralizadas de telefone e WhatsApp no Supabase e registra auditoria
   */
  async saveContactSettings(settings: any, userId?: string): Promise<boolean> {
    try {
      await this.updateSiteSetting('contact_settings', settings, userId);

      await this.logAdminAction({
        action: 'UPDATE_CONTACT_SETTINGS',
        entity_type: 'site_settings',
        entity_id: 'contact_settings',
        details: {
          phone_display: settings.phone_display,
          whatsapp_display: settings.whatsapp_display,
          phone_number: settings.phone_number,
          whatsapp_number: settings.whatsapp_number,
          whatsapp_enabled: settings.whatsapp_enabled,
          phone_enabled: settings.phone_enabled,
        },
        user_id: userId || null,
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao salvar contact_settings:', err);
      throw err;
    }
  },

  // ==========================================
  // VOLUME 4 / ETAPA 11 - SOLICITAÇÃO DE PROPOSTAS & PRÉ-DIMENSIONAMENTO
  // ==========================================

  /**
   * Cria uma nova solicitação técnica de proposta no Supabase
   */
  async createProposalRequest(dto: any): Promise<any> {
    try {
      const id = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const newProposal = {
        id,
        created_at: now,
        updated_at: now,
        requester_name: dto.requester_name,
        requester_email: dto.requester_email,
        requester_phone: dto.requester_phone,
        requester_whatsapp: dto.requester_whatsapp || null,
        company_name: dto.company_name || null,
        city: dto.city,
        state: dto.state,
        project_type: dto.project_type,
        project_use: dto.project_use || null,
        location: dto.location,
        area_m2: dto.area_m2 ? Number(dto.area_m2) : null,
        floors: dto.floors ? Number(dto.floors) : null,
        structure_type: dto.structure_type,
        service_type: dto.service_type,
        current_stage: dto.current_stage,
        expected_start_date: dto.expected_start_date || null,
        has_architectural_project: Boolean(dto.has_architectural_project),
        has_soil_report: Boolean(dto.has_soil_report),
        has_structural_project: Boolean(dto.has_structural_project),
        has_topography: Boolean(dto.has_topography),
        description: dto.description,
        technical_notes: dto.technical_notes || null,
        attachments: dto.attachments || [],
        status: 'new',
        priority: 'normal',
        admin_notes: null,
        assigned_to: null,
        estimated_value: null,
        last_contact_at: null,
      };

      // Tenta persistir na tabela proposal_requests, caso não exista usa site_settings
      const { error } = await (supabase.from as any)('proposal_requests').insert([newProposal]);

      if (error) {
        console.warn('[supabaseDatabase] Tabela proposal_requests não encontrada, persistindo em site_settings:', error.message);
        const existingList = (await this.getSiteSetting('proposal_requests_fallback')) || [];
        const updatedList = [newProposal, ...(Array.isArray(existingList) ? existingList : [])];
        await this.updateSiteSetting('proposal_requests_fallback', updatedList);
      }

      return newProposal;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao criar solicitação de proposta:', err);
      // Fallback de contingência
      const id = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fallbackProposal = {
        ...dto,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'new',
        priority: 'normal',
        attachments: dto.attachments || []
      };
      const existingList = (await this.getSiteSetting('proposal_requests_fallback')) || [];
      const updatedList = [fallbackProposal, ...(Array.isArray(existingList) ? existingList : [])];
      await this.updateSiteSetting('proposal_requests_fallback', updatedList);
      return fallbackProposal;
    }
  },

  /**
   * Obtém a lista de todas as solicitações de propostas
   */
  async getProposalRequests(): Promise<any[]> {
    try {
      const { data, error } = await (supabase.from as any)('proposal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }

      // Consulta no site_settings caso a tabela esteja vazia ou ausente
      const fallbackData = await this.getSiteSetting('proposal_requests_fallback');
      if (Array.isArray(fallbackData)) {
        return fallbackData;
      }

      return [];
    } catch (err) {
      console.warn('[supabaseDatabase] Aviso ao consultar proposal_requests:', err);
      const fallbackData = await this.getSiteSetting('proposal_requests_fallback');
      return Array.isArray(fallbackData) ? fallbackData : [];
    }
  },

  /**
   * Atualiza o status e detalhes de uma proposta técnica e registra auditoria
   */
  async updateProposalRequest(id: string, updates: any, userId?: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const updatedPayload = {
        ...updates,
        updated_at: now,
      };

      const { error } = await (supabase.from as any)('proposal_requests')
        .update(updatedPayload)
        .eq('id', id);

      if (error) {
        console.warn('[supabaseDatabase] Atualizando proposta no fallback site_settings:', error.message);
      }

      // Atualiza também no fallback site_settings para manter integridade
      const fallbackList = (await this.getSiteSetting('proposal_requests_fallback')) || [];
      if (Array.isArray(fallbackList)) {
        const index = fallbackList.findIndex((p: any) => p.id === id);
        if (index >= 0) {
          fallbackList[index] = { ...fallbackList[index], ...updatedPayload };
          await this.updateSiteSetting('proposal_requests_fallback', fallbackList, userId);
        }
      }

      await this.logAdminAction({
        action: 'UPDATE_PROPOSAL_REQUEST',
        entity_type: 'proposal_requests',
        entity_id: id,
        details: {
          status: updates.status,
          priority: updates.priority,
          admin_notes: updates.admin_notes,
          estimated_value: updates.estimated_value,
        },
        user_id: userId || null,
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao atualizar proposta:', err);
      throw err;
    }
  },

  /**
   * Exclui uma proposta técnica e registra auditoria
   */
  async deleteProposalRequest(id: string, userId?: string): Promise<boolean> {
    try {
      await (supabase.from as any)('proposal_requests')
        .delete()
        .eq('id', id);

      const fallbackList = (await this.getSiteSetting('proposal_requests_fallback')) || [];
      if (Array.isArray(fallbackList)) {
        const filtered = fallbackList.filter((p: any) => p.id !== id);
        await this.updateSiteSetting('proposal_requests_fallback', filtered, userId);
      }

      await this.logAdminAction({
        action: 'DELETE_PROPOSAL_REQUEST',
        entity_type: 'proposal_requests',
        entity_id: id,
        details: { deleted_id: id },
        user_id: userId || null,
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao excluir proposta:', err);
      throw err;
    }
  },

  // ==========================================
  // VOLUME 4 / ETAPA 14 - GESTÃO CENTRALIZADA DE CONVITES & ACESSOS
  // ==========================================

  /**
   * Obtém a lista de todos os códigos de convite com atualização de status por expiração
   */
  async getInviteCodes(): Promise<InviteCode[]> {
    try {
      const rawCodes = await this.getSiteSetting('invite_codes');
      if (!Array.isArray(rawCodes) || rawCodes.length === 0) {
        // Gera o convite inicial padrão de segurança se estiver vazio
        const initialInvite: InviteCode = {
          id: 'inv-init-01',
          code: 'ENG-JUCELIA-2026',
          created_by: null,
          created_by_email: 'admin@juceliasantana.eng.br',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          used_at: null,
          used_by: null,
          used_by_email: null,
          max_uses: 1,
          uses_count: 0,
        };
        await this.updateSiteSetting('invite_codes', [initialInvite]);
        return [initialInvite];
      }

      // Converte e atualiza status de expiração automaticamente
      const now = new Date();
      let hasUpdates = false;

      const formattedCodes: InviteCode[] = rawCodes.map((item: any) => {
        let currentStatus: 'pending' | 'used' | 'expired' | 'canceled' = item.status || 'pending';
        
        // Se estiver marcado como used ou uses_count >= max_uses
        if (Number(item.used) === 1 || item.status === 'used' || (item.uses_count && item.uses_count >= (item.max_uses || 1))) {
          currentStatus = 'used';
        } else if (currentStatus === 'pending' && item.expires_at && new Date(item.expires_at) < now) {
          currentStatus = 'expired';
          hasUpdates = true;
        }

        return {
          id: String(item.id || `inv-${Date.now()}`),
          code: String(item.code || '').trim().toUpperCase(),
          created_by: item.created_by || null,
          created_by_email: item.created_by_email || null,
          created_at: item.created_at || new Date().toISOString(),
          expires_at: item.expires_at || null,
          status: currentStatus,
          used_at: item.used_at || null,
          used_by: item.used_by || null,
          used_by_email: item.used_by_email || null,
          max_uses: item.max_uses || 1,
          uses_count: item.uses_count || (Number(item.used) === 1 ? 1 : 0),
        };
      });

      if (hasUpdates) {
        await this.updateSiteSetting('invite_codes', formattedCodes);
      }

      return formattedCodes;
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao recuperar invite_codes:', err);
      return [];
    }
  },

  /**
   * Cria um novo convite seguro e registra auditoria
   */
  async createInviteCode(
    creatorId?: string,
    creatorEmail?: string,
    expiresInDays: number = 7
  ): Promise<InviteCode> {
    try {
      const currentCodes = await this.getInviteCodes();
      
      // Gera token seguro e imprevisível (JS-ENG-XXXX-XXXX)
      const randomPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newCodeStr = `JS-ENG-${randomPart1}-${randomPart2}`;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

      const newInvite: InviteCode = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        code: newCodeStr,
        created_by: creatorId || null,
        created_by_email: creatorEmail || 'admin@juceliasantana.eng.br',
        created_at: now.toISOString(),
        expires_at: expiresAt,
        status: 'pending',
        used_at: null,
        used_by: null,
        used_by_email: null,
        max_uses: 1,
        uses_count: 0,
      };

      const updatedList = [newInvite, ...currentCodes];
      await this.updateSiteSetting('invite_codes', updatedList, creatorId);

      // Registra log de auditoria
      await this.logAdminAction({
        user_id: creatorId || null,
        user_email: creatorEmail || null,
        action: 'CREATE_INVITE_CODE',
        entity_type: 'site_settings',
        entity_id: newInvite.id,
        details: {
          code: newCodeStr,
          expires_at: expiresAt,
          expires_in_days: expiresInDays,
        },
      });

      return newInvite;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao criar convite:', err);
      throw err;
    }
  },

  /**
   * Cancela um convite pendente impedindo sua utilização futura
   */
  async cancelInviteCode(
    codeId: string,
    performerId?: string,
    performerEmail?: string
  ): Promise<boolean> {
    try {
      const currentCodes = await this.getInviteCodes();
      const target = currentCodes.find((c) => c.id === codeId);

      if (!target) {
        throw new Error('Convite não localizado para cancelamento.');
      }

      const updatedCodes = currentCodes.map((c) =>
        c.id === codeId ? { ...c, status: 'canceled' as const } : c
      );

      await this.updateSiteSetting('invite_codes', updatedCodes, performerId);

      // Registra log de auditoria
      await this.logAdminAction({
        user_id: performerId || null,
        user_email: performerEmail || null,
        action: 'CANCEL_INVITE_CODE',
        entity_type: 'site_settings',
        entity_id: codeId,
        details: {
          code: target.code,
          previous_status: target.status,
          canceled_at: new Date().toISOString(),
        },
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao cancelar convite:', err);
      throw err;
    }
  },

  /**
   * Exclui permanentemente um código de convite e registra auditoria
   */
  async deleteInviteCode(
    codeId: string,
    performerId?: string,
    performerEmail?: string
  ): Promise<boolean> {
    try {
      const currentCodes = await this.getInviteCodes();
      const target = currentCodes.find((c) => c.id === codeId);

      const filteredCodes = currentCodes.filter((c) => c.id !== codeId);
      await this.updateSiteSetting('invite_codes', filteredCodes, performerId);

      // Registra log de auditoria
      await this.logAdminAction({
        user_id: performerId || null,
        user_email: performerEmail || null,
        action: 'DELETE_INVITE_CODE',
        entity_type: 'site_settings',
        entity_id: codeId,
        details: {
          code: target?.code || 'desconhecido',
          deleted_at: new Date().toISOString(),
        },
      });

      return true;
    } catch (err) {
      console.error('[supabaseDatabase] Erro ao excluir convite:', err);
      throw err;
    }
  },

  /**
   * Valida se um código de convite está apto para utilização
   */
  async checkInviteValidity(code: string): Promise<{ valid: boolean; reason?: string; invite?: InviteCode }> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, reason: 'É necessário possuir um convite válido para realizar o cadastro.' };
    }

    const codes = await this.getInviteCodes();
    const found = codes.find((c) => c.code.trim().toUpperCase() === cleanCode);

    if (!found) {
      return { valid: false, reason: 'Código de convite inválido ou não cadastrado. Solicite um convite a um administrador.' };
    }

    if (found.status === 'canceled') {
      return { valid: false, reason: 'Este convite foi cancelado por um administrador e não pode mais ser utilizado.' };
    }

    if (found.status === 'used' || (found.uses_count && found.uses_count >= found.max_uses)) {
      return { valid: false, reason: 'Este convite já foi utilizado e não pode ser reutilizado.' };
    }

    if (found.expires_at && new Date(found.expires_at) < new Date()) {
      return { valid: false, reason: 'Este convite expirou. Solicite um novo convite a um administrador.' };
    }

    return { valid: true, invite: found };
  },

  /**
   * Valida e consome um código de convite no momento do cadastro de usuário
   */
  async consumeInviteCode(
    code: string,
    newUserId: string,
    newUserEmail: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const validity = await this.checkInviteValidity(code);
      if (!validity.valid || !validity.invite) {
        return { success: false, message: validity.reason || 'Convite inválido.' };
      }

      const currentCodes = await this.getInviteCodes();
      const now = new Date().toISOString();

      const updatedCodes = currentCodes.map((c) => {
        if (c.code.trim().toUpperCase() === code.trim().toUpperCase()) {
          return {
            ...c,
            status: 'used' as const,
            used_at: now,
            used_by: newUserId,
            used_by_email: newUserEmail,
            uses_count: (c.uses_count || 0) + 1,
          };
        }
        return c;
      });

      await this.updateSiteSetting('invite_codes', updatedCodes);

      // Registra log de auditoria
      await this.logAdminAction({
        user_id: newUserId,
        user_email: newUserEmail,
        action: 'USE_INVITE_CODE',
        entity_type: 'site_settings',
        entity_id: validity.invite.id,
        details: {
          code: validity.invite.code,
          used_by_user_id: newUserId,
          used_by_email: newUserEmail,
          used_at: now,
        },
      });

      return { success: true };
    } catch (err: any) {
      console.error('[supabaseDatabase] Erro ao consumir código de convite:', err);
      return { success: false, message: err.message || 'Erro ao processar convite.' };
    }
  },

  // ==========================================
  // MEDIA DISPLAY SETTINGS (ENQUADRAMENTO UNIVERSAL)
  // ==========================================
  async getMediaDisplaySettings(): Promise<MediaDisplaySettingsMap> {
    if (!isSupabaseConfigured) {
      return {};
    }
    try {
      const saved = await this.getSiteSetting('media_display_settings');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        return saved as MediaDisplaySettingsMap;
      }
      return {};
    } catch (err) {
      console.warn('[supabaseDatabase] Erro ao buscar configurações de enquadramento de mídia:', err);
      return {};
    }
  },

  async saveMediaDisplaySetting(
    mediaKey: string,
    setting: MediaDisplaySetting,
    userId?: string,
    userEmail?: string
  ): Promise<MediaDisplaySettingsMap> {
    try {
      const current = await this.getMediaDisplaySettings();
      const updatedMap: MediaDisplaySettingsMap = {
        ...current,
        [mediaKey]: {
          ...setting,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        },
      };

      await this.updateSiteSetting('media_display_settings', updatedMap, userId);

      // Registra trilha de auditoria administrativa
      if (userId || userEmail) {
        await this.logAdminAction({
          user_id: userId || null,
          user_email: userEmail || null,
          action: 'UPDATE_MEDIA_DISPLAY_SETTINGS',
          entity_type: 'media_display_settings',
          entity_id: mediaKey,
          details: {
            media_key: mediaKey,
            media_type: setting.media_type,
            context: setting.context,
            object_fit: setting.object_fit,
            object_position: setting.object_position,
            position_x: setting.position_x,
            position_y: setting.position_y,
            zoom: setting.zoom,
            aspect_ratio: setting.aspect_ratio,
            focal_x: setting.focal_x,
            focal_y: setting.focal_y,
          },
        });
      }

      return updatedMap;
    } catch (err: any) {
      console.error('[supabaseDatabase] Erro ao salvar enquadramento de mídia:', err);
      throw err;
    }
  },

  async resetMediaDisplaySetting(
    mediaKey: string,
    userId?: string,
    userEmail?: string
  ): Promise<MediaDisplaySettingsMap> {
    try {
      const current = await this.getMediaDisplaySettings();
      const updatedMap = { ...current };
      delete updatedMap[mediaKey];

      await this.updateSiteSetting('media_display_settings', updatedMap, userId);

      // Registra trilha de auditoria administrativa
      if (userId || userEmail) {
        await this.logAdminAction({
          user_id: userId || null,
          user_email: userEmail || null,
          action: 'RESET_MEDIA_DISPLAY_SETTINGS',
          entity_type: 'media_display_settings',
          entity_id: mediaKey,
          details: {
            media_key: mediaKey,
            action_type: 'RESET_TO_DEFAULT',
          },
        });
      }

      return updatedMap;
    } catch (err: any) {
      console.error('[supabaseDatabase] Erro ao restaurar padrão de enquadramento de mídia:', err);
      throw err;
    }
  },

  // ==========================================
  // SITE DOMAINS MANAGEMENT (ETAPA 18)
  // ==========================================
  async getSiteDomains(): Promise<SiteDomain[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('site_domains')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[supabaseDatabase] Aviso ao consultar domínios do site:', error.message || error);
        return [];
      }

      return (data || []) as SiteDomain[];
    } catch (err: any) {
      console.error('[supabaseDatabase] Erro ao carregar domínios do site:', err);
      return [];
    }
  },

  async getSiteDomainById(id: string): Promise<SiteDomain | null> {
    if (!isSupabaseConfigured || !id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('site_domains')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.warn('[supabaseDatabase] Aviso ao consultar domínio por ID:', error.message || error);
        return null;
      }

      return data as SiteDomain;
    } catch (err: any) {
      console.error('[supabaseDatabase] Erro ao carregar domínio por ID:', err);
      return null;
    }
  },

  /**
   * Consulta o domínio principal ativo oficial do site
   */
  async getPrimaryDomain(): Promise<SiteDomain | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('site_domains')
        .select('*')
        .eq('is_primary', true)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.warn('[supabaseDatabase] Aviso ao consultar domínio primário:', error.message || error);
        return null;
      }

      return data as SiteDomain | null;
    } catch (err: any) {
      console.error('[supabaseDatabase] Erro ao carregar domínio primário:', err);
      return null;
    }
  },

  /**
   * Busca um domínio cadastrado e ativo a partir do hostname (ex: window.location.hostname)
   * Suporta resolução transparente de variantes com e sem www
   */
  async getDomainByHostname(hostname: string): Promise<SiteDomain | null> {
    if (!isSupabaseConfigured || !hostname) {
      return null;
    }

    try {
      const normalized = normalizeDomain(hostname);
      if (!normalized) return null;

      const variants = getDomainLookupVariants(normalized);

      // Consulta os domínios ativos que correspondem ao hostname ou suas variantes
      const { data, error } = await supabase
        .from('site_domains')
        .select('*')
        .in('normalized_domain', variants)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[supabaseDatabase] Aviso ao buscar domínio por hostname:', error.message || error);
        return null;
      }

      return data as SiteDomain | null;
    } catch (err: any) {
      console.error('[supabaseDatabase] Erro ao buscar domínio por hostname:', err);
      return null;
    }
  },

  /**
   * Alias de compatibilidade para getDomainByHostname
   */
  async getSiteDomainByHostname(hostname: string): Promise<SiteDomain | null> {
    return this.getDomainByHostname(hostname);
  },

  async createSiteDomain(
    input: CreateDomainInput,
    userId?: string,
    userEmail?: string
  ): Promise<SiteDomain> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    // 1. Validação e normalização centralizada
    const validation = validateDomain(input.domain);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Domínio inválido fornecido.');
    }

    const normalizedDomain = validation.normalized;
    const label = input.label?.trim() || 'Domínio do Site';

    // 2. Verificação de duplicidade de normalized_domain
    const { data: existingDomain, error: checkError } = await supabase
      .from('site_domains')
      .select('id, domain')
      .eq('normalized_domain', normalizedDomain)
      .maybeSingle();

    if (checkError) {
      console.warn('[supabaseDatabase] Aviso ao checar duplicidade de domínio:', checkError.message || checkError);
      if (
        checkError.message?.includes('schema cache') ||
        checkError.message?.includes('does not exist')
      ) {
        throw new Error(formatDatabaseErrorMessage(checkError));
      }
    }

    if (existingDomain) {
      throw new Error(`O domínio "${normalizedDomain}" já está cadastrado no sistema.`);
    }

    // 3. Se for marcado como primário, desmarca outros domínios existentes
    if (input.is_primary) {
      const { error: resetError } = await supabase
        .from('site_domains')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('is_primary', true);

      if (resetError) {
        console.warn('[supabaseDatabase] Aviso ao redefinir domínio primário anterior:', resetError.message || resetError);
      }
    }

    // 4. Inserção do novo domínio
    const insertPayload: SiteDomainInsert = {
      domain: input.domain.trim(),
      normalized_domain: normalizedDomain,
      label,
      description: input.description?.trim() || null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      is_primary: !!input.is_primary,
      ssl_status: input.ssl_status || 'active',
      created_by: userId || null,
      updated_by: userId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('site_domains')
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      console.error('[supabaseDatabase] Erro ao cadastrar domínio:', error);
      throw new Error(formatDatabaseErrorMessage(error) || 'Falha ao cadastrar o domínio no banco de dados.');
    }

    const newDomain = data as SiteDomain;

    // 5. Registro na trilha de auditoria administrativa
    if (userId || userEmail) {
      await this.logAdminAction({
        user_id: userId || null,
        user_email: userEmail || null,
        action: 'DOMAIN_CREATED',
        entity_type: 'site_domains',
        entity_id: newDomain.id,
        details: {
          domain: newDomain.domain,
          normalized_domain: newDomain.normalized_domain,
          label: newDomain.label,
          is_active: newDomain.is_active,
          is_primary: newDomain.is_primary,
          ssl_status: newDomain.ssl_status,
        },
      });
    }

    return newDomain;
  },

  async updateSiteDomain(
    id: string,
    input: UpdateDomainInput,
    userId?: string,
    userEmail?: string
  ): Promise<SiteDomain> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    const current = await this.getSiteDomainById(id);
    if (!current) {
      throw new Error('Domínio não encontrado para atualização.');
    }

    const updatePayload: SiteDomainUpdate = {
      updated_by: userId || null,
      updated_at: new Date().toISOString(),
    };

    // Validação se o domínio foi alterado
    if (input.domain !== undefined) {
      const validation = validateDomain(input.domain);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Domínio inválido.');
      }
      const normalizedDomain = validation.normalized;

      // Checa duplicidade caso o normalized_domain tenha mudado
      if (normalizedDomain !== current.normalized_domain) {
        const { data: duplicate } = await supabase
          .from('site_domains')
          .select('id')
          .eq('normalized_domain', normalizedDomain)
          .neq('id', id)
          .maybeSingle();

        if (duplicate) {
          throw new Error(`O domínio "${normalizedDomain}" já está cadastrado.`);
        }
      }

      updatePayload.domain = input.domain.trim();
      updatePayload.normalized_domain = normalizedDomain;
    }

    if (input.label !== undefined) {
      updatePayload.label = input.label.trim();
    }

    if (input.description !== undefined) {
      updatePayload.description = input.description ? input.description.trim() : null;
    }

    if (input.is_active !== undefined) {
      updatePayload.is_active = input.is_active;
    }

    if (input.ssl_status !== undefined) {
      updatePayload.ssl_status = input.ssl_status;
    }

    // Se for marcado como primário, desmarca os demais
    if (input.is_primary === true) {
      await supabase
        .from('site_domains')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .neq('id', id)
        .eq('is_primary', true);

      updatePayload.is_primary = true;
      updatePayload.is_active = true; // Domínio primário deve permanecer ativo
    } else if (input.is_primary === false) {
      updatePayload.is_primary = false;
    }

    const { data, error } = await supabase
      .from('site_domains')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[supabaseDatabase] Erro ao atualizar domínio:', error);
      throw new Error(formatDatabaseErrorMessage(error) || 'Falha ao atualizar dados do domínio.');
    }

    const updatedDomain = data as SiteDomain;

    // Registra auditoria
    if (userId || userEmail) {
      await this.logAdminAction({
        user_id: userId || null,
        user_email: userEmail || null,
        action: 'DOMAIN_UPDATED',
        entity_type: 'site_domains',
        entity_id: id,
        details: {
          domain: updatedDomain.domain,
          normalized_domain: updatedDomain.normalized_domain,
          label: updatedDomain.label,
          is_active: updatedDomain.is_active,
          is_primary: updatedDomain.is_primary,
          changes: input,
        },
      });
    }

    return updatedDomain;
  },

  async deleteSiteDomain(
    id: string,
    userId?: string,
    userEmail?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    const current = await this.getSiteDomainById(id);
    if (!current) {
      throw new Error('Domínio não encontrado para exclusão.');
    }

    const { error } = await supabase
      .from('site_domains')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[supabaseDatabase] Erro ao excluir domínio:', error);
      throw new Error(formatDatabaseErrorMessage(error) || 'Falha ao excluir o domínio.');
    }

    // Registra auditoria
    if (userId || userEmail) {
      await this.logAdminAction({
        user_id: userId || null,
        user_email: userEmail || null,
        action: 'DOMAIN_DELETED',
        entity_type: 'site_domains',
        entity_id: id,
        details: {
          deleted_domain: current.domain,
          deleted_normalized: current.normalized_domain,
          label: current.label,
          was_primary: current.is_primary,
        },
      });
    }

    return true;
  },

  async setPrimarySiteDomain(
    id: string,
    userId?: string,
    userEmail?: string
  ): Promise<SiteDomain> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    const current = await this.getSiteDomainById(id);
    if (!current) {
      throw new Error('Domínio não encontrado.');
    }

    // 1. Desmarca outros domínios como primários
    await supabase
      .from('site_domains')
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .neq('id', id);

    // 2. Define o atual como primário e garante ativo
    const { data, error } = await supabase
      .from('site_domains')
      .update({
        is_primary: true,
        is_active: true,
        updated_by: userId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[supabaseDatabase] Erro ao definir domínio primário:', error);
      throw new Error(formatDatabaseErrorMessage(error) || 'Falha ao definir o domínio como principal.');
    }

    const updated = data as SiteDomain;

    // 3. Registra auditoria
    if (userId || userEmail) {
      await this.logAdminAction({
        user_id: userId || null,
        user_email: userEmail || null,
        action: 'DOMAIN_SET_PRIMARY',
        entity_type: 'site_domains',
        entity_id: id,
        details: {
          domain: updated.domain,
          normalized_domain: updated.normalized_domain,
          label: updated.label,
        },
      });
    }

    return updated;
  },

  async toggleSiteDomainStatus(
    id: string,
    isActive: boolean,
    userId?: string,
    userEmail?: string
  ): Promise<SiteDomain> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado no ambiente.');
    }

    const current = await this.getSiteDomainById(id);
    if (!current) {
      throw new Error('Domínio não encontrado.');
    }

    // Se estiver desativando e for o único primário, desmarca flag primária
    const isPrimaryUpdate = !isActive && current.is_primary ? false : current.is_primary;

    const { data, error } = await supabase
      .from('site_domains')
      .update({
        is_active: isActive,
        is_primary: isPrimaryUpdate,
        updated_by: userId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[supabaseDatabase] Erro ao alterar status do domínio:', error);
      throw new Error(formatDatabaseErrorMessage(error) || 'Falha ao atualizar o status do domínio.');
    }

    const updated = data as SiteDomain;

    // Registra auditoria
    if (userId || userEmail) {
      await this.logAdminAction({
        user_id: userId || null,
        user_email: userEmail || null,
        action: isActive ? 'DOMAIN_ACTIVATED' : 'DOMAIN_DEACTIVATED',
        entity_type: 'site_domains',
        entity_id: id,
        details: {
          domain: updated.domain,
          normalized_domain: updated.normalized_domain,
          new_status: isActive ? 'active' : 'inactive',
        },
      });
    }

    return updated;
  },
};

