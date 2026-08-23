import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Tag, 
  User, 
  Calendar, 
  Upload, 
  Image as ImageIcon, 
  X, 
  RefreshCw, 
  Sparkles, 
  Globe, 
  Lock, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  Quote, 
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { CMSBlogPost } from '../types/cms';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const CATEGORIES = [
  'Laudos e Perícias',
  'Projetos Estruturais',
  'Patologia Estrutural',
  'Engenharia Civil',
  'Inspeção e Manutenção',
  'Segurança e Normas NBR',
  'Agronegócio e Estruturas Metálicas',
  'Consultoria Técnica'
];

export default function AdminArticles() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CMSBlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Estados de Edição / Formulário
  const [editingPost, setEditingPost] = useState<CMSBlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<CMSBlogPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<CMSBlogPost | null>(null);

  // Campos do Formulário
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [author, setAuthor] = useState<string>('Engª Jucélia Santana');
  const [summary, setSummary] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [published, setPublished] = useState<boolean>(false);

  // Upload e Feedback
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Carregar artigos do Supabase
  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await supabaseDatabase.getBlogPosts(false, false);
      if (data) {
        const mapped: CMSBlogPost[] = data.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          summary: p.summary,
          content: p.content,
          cover_url: p.cover_url || undefined,
          author: p.author || 'Engª Jucélia Santana',
          published: p.published,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        setPosts(mapped);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Erro ao carregar artigos:', err);
      showFeedback('error', 'Falha ao carregar artigos do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Helper para gerar Slug automaticamente
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9 -]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífen
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!editingPost) {
      setSlug(generateSlug(val));
      setSlugError(null);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = generateSlug(e.target.value);
    setSlug(val);
    setSlugError(null);
  };

  // Abrir Modal de Formulário para Criar
  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setCategory(CATEGORIES[0]);
    setAuthor('Engª Jucélia Santana');
    setSummary('');
    setContent('');
    setCoverUrl('');
    setPublished(false);
    setSlugError(null);
    setIsFormOpen(true);
  };

  // Abrir Modal de Formulário para Editar
  const handleOpenEditModal = (post: CMSBlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setCategory(post.category);
    setAuthor(post.author || 'Engª Jucélia Santana');
    setSummary(post.summary);
    setContent(post.content);
    setCoverUrl(post.cover_url || '');
    setPublished(post.published);
    setSlugError(null);
    setIsFormOpen(true);
  };

  // Upload de Imagem de Capa
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('error', 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('error', 'A imagem excede o tamanho máximo permitido de 5MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const { publicUrl } = await supabaseStorage.uploadBlogCoverImage(file);
      setCoverUrl(publicUrl);
      showFeedback('success', 'Imagem de capa enviada com sucesso!');

      // Registrar na auditoria
      await supabaseDatabase.logAdminAction({
        action: 'UPLOAD_BLOG_IMAGE',
        entity_type: 'blog_posts',
        details: { fileName: file.name, url: publicUrl },
        user_id: user?.id || null,
      });
    } catch (err) {
      console.error('Erro ao enviar imagem de capa:', err);
      showFeedback('error', 'Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Validar e Salvar Artigo
  const handleSavePost = async (shouldPublish?: boolean) => {
    const finalPublished = shouldPublish !== undefined ? shouldPublish : published;

    if (!title.trim()) {
      showFeedback('error', 'O título do artigo é obrigatório.');
      return;
    }

    if (!slug.trim()) {
      showFeedback('error', 'O slug do artigo é obrigatório.');
      return;
    }

    if (!summary.trim()) {
      showFeedback('error', 'O resumo do artigo é obrigatório.');
      return;
    }

    if (!content.trim()) {
      showFeedback('error', 'O conteúdo completo do artigo é obrigatório.');
      return;
    }

    // Verificar unicidade de Slug no banco de dados local
    const duplicate = posts.find((p) => p.slug === slug && p.id !== editingPost?.id);
    if (duplicate) {
      setSlugError('Este slug já está em uso por outro artigo. Por favor, modifique.');
      showFeedback('error', 'O slug informado já existe. Escolha outro slug único.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        category: category.trim(),
        author: author.trim() || 'Engª Jucélia Santana',
        summary: summary.trim(),
        content: content.trim(),
        cover_url: coverUrl || null,
        published: finalPublished,
      };

      if (editingPost && editingPost.id) {
        // Atualizar
        await supabaseDatabase.updateBlogPost(editingPost.id, payload);
        showFeedback(
          'success',
          finalPublished ? 'Artigo atualizado e publicado com sucesso!' : 'Artigo salvo como rascunho!'
        );

        await supabaseDatabase.logAdminAction({
          action: finalPublished ? 'PUBLISH_BLOG_POST' : 'UPDATE_BLOG_POST',
          entity_type: 'blog_posts',
          entity_id: editingPost.id,
          details: { title: payload.title, slug: payload.slug, published: finalPublished },
          user_id: user?.id || null,
        });
      } else {
        // Criar
        const created = await supabaseDatabase.createBlogPost(payload);
        showFeedback(
          'success',
          finalPublished ? 'Novo artigo publicado com sucesso!' : 'Novo artigo salvo como rascunho!'
        );

        await supabaseDatabase.logAdminAction({
          action: 'CREATE_BLOG_POST',
          entity_type: 'blog_posts',
          entity_id: created.id,
          details: { title: payload.title, slug: payload.slug, published: finalPublished },
          user_id: user?.id || null,
        });
      }

      setIsFormOpen(false);
      await loadArticles();
    } catch (err: any) {
      console.error('Erro ao salvar artigo:', err);
      showFeedback('error', err.message || 'Falha ao salvar o artigo no banco de dados.');
    } finally {
      setSaving(false);
    }
  };

  // Alternar Status de Publicação Direto da Lista
  const handleTogglePublish = async (post: CMSBlogPost) => {
    if (!post.id) return;
    const newStatus = !post.published;

    try {
      await supabaseDatabase.updateBlogPost(post.id, { published: newStatus });
      showFeedback(
        'success',
        newStatus ? `Artigo "${post.title}" publicado!` : `Artigo "${post.title}" despublicado (movido para rascunhos).`
      );

      await supabaseDatabase.logAdminAction({
        action: newStatus ? 'PUBLISH_BLOG_POST' : 'UNPUBLISH_BLOG_POST',
        entity_type: 'blog_posts',
        entity_id: post.id,
        details: { title: post.title, slug: post.slug },
        user_id: user?.id || null,
      });

      await loadArticles();
    } catch (err) {
      console.error('Erro ao alterar status de publicação:', err);
      showFeedback('error', 'Erro ao alterar status de publicação.');
    }
  };

  // Confirmar Exclusão
  const handleDeletePost = async () => {
    if (!deletingPost || !deletingPost.id) return;

    setSaving(true);
    try {
      await supabaseDatabase.deleteBlogPostPermanent(deletingPost.id);

      // Tentar remover imagem vinculada se houver
      if (deletingPost.cover_url && deletingPost.cover_url.includes('blog-images')) {
        const pathMatch = deletingPost.cover_url.split('/blog-images/')[1]?.split('?')[0];
        if (pathMatch) {
          await supabaseStorage.deleteBlogCoverImage(pathMatch);
        }
      }

      showFeedback('success', 'Artigo removido com sucesso!');

      await supabaseDatabase.logAdminAction({
        action: 'DELETE_BLOG_POST',
        entity_type: 'blog_posts',
        entity_id: deletingPost.id,
        details: { title: deletingPost.title, slug: deletingPost.slug },
        user_id: user?.id || null,
      });

      setIsDeleteModalOpen(false);
      setDeletingPost(null);
      await loadArticles();
    } catch (err) {
      console.error('Erro ao excluir artigo:', err);
      showFeedback('error', 'Falha ao remover o artigo.');
    } finally {
      setSaving(false);
    }
  };

  // Inserção de formatação rápida no conteúdo
  const insertFormatting = (tag: string) => {
    if (tag === 'b') setContent((prev) => prev + ' **texto em negrito** ');
    if (tag === 'i') setContent((prev) => prev + ' *texto em itálico* ');
    if (tag === 'h2') setContent((prev) => prev + '\n\n## Subtítulo do Laudo\n');
    if (tag === 'h3') setContent((prev) => prev + '\n\n### Tópico de Análise\n');
    if (tag === 'list') setContent((prev) => prev + '\n\n1. Primeiro ponto técnico\n2. Segundo ponto técnico\n3. Terceiro ponto técnico\n');
    if (tag === 'quote') setContent((prev) => prev + '\n\n> "Orientação conforme NBR 6118 / ABNT"\n');
  };

  // Filtrar artigos
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && post.published) ||
      (statusFilter === 'draft' && !post.published);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Métricas
  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.published).length;
  const draftPosts = posts.filter((p) => !p.published).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 max-w-md ${
              feedback.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-medium leading-relaxed">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header com Ações do Topo */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Módulo de Acervo Técnico NBR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
            Artigos Técnicos e Laudos Publicáveis
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Cadastre, edite, publique e gerencie laudos periciais, orientações normativas ABNT e análises técnicas para exibição pública na página institucional.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            onClick={loadArticles}
            variant="outline"
            className="border-white/10 hover:bg-white/5 text-slate-300 text-xs gap-1.5 h-11"
            title="Atualizar lista do banco"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="bg-[#C5A059] hover:bg-[#b08d49] text-[#070D18] font-bold text-xs uppercase tracking-wider h-11 px-5 shadow-lg shadow-[#C5A059]/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Artigo / Laudo</span>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0B1526] border border-white/10 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Total em Acervo</span>
            <span className="text-2xl font-bold text-white mt-1 block">{totalPosts}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1526] border border-emerald-500/20 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 block font-medium uppercase tracking-wider">Publicados no Site</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{publishedPosts}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1526] border border-amber-500/20 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-400 block font-medium uppercase tracking-wider">Rascunhos em Edição</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{draftPosts}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filtros e Barra de Pesquisa */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Campo de Pesquisa */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, resumo ou assunto..."
              className="w-full bg-[#070D18] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Filtro por Categoria */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#070D18] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#C5A059]"
            >
              <option value="all">Todas as Categorias</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Filtro por Status */}
            <div className="inline-flex bg-[#070D18] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#C5A059] text-[#070D18] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({totalPosts})
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'published'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Publicados ({publishedPosts})
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'draft'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rascunhos ({draftPosts})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista / Tabela de Artigos */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Carregando acervo de artigos e laudos do Supabase...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum artigo encontrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all' || statusFilter !== 'all'
                ? 'Nenhum resultado corresponde aos filtros selecionados. Tente ajustar a busca.'
                : 'Não há artigos ou laudos periciais cadastrados no momento. Clique no botão abaixo para criar o primeiro.'}
            </p>
            {!searchTerm && selectedCategory === 'all' && statusFilter === 'all' && (
              <Button
                onClick={handleOpenCreateModal}
                className="bg-[#C5A059] text-[#070D18] font-bold text-xs uppercase px-5 py-2.5"
              >
                + Criar Primeiro Artigo
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-x-auto">
            {filteredPosts.map((post) => (
              <div
                key={post.id || post.slug}
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:bg-white/[0.02] transition-colors"
              >
                {/* Info do Artigo */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Thumbnail da Capa */}
                  <div className="w-20 h-14 rounded-lg bg-[#070D18] border border-white/10 overflow-hidden shrink-0 relative group">
                    {post.cover_url ? (
                      <img
                        src={post.cover_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=400';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Badge de Status */}
                      {post.published ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                          <Globe className="w-3 h-3" /> Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase">
                          <Lock className="w-3 h-3" /> Rascunho
                        </span>
                      )}

                      {/* Categoria */}
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#C5A059] font-medium">
                        <Tag className="w-3 h-3" /> {post.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-xl">
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">{post.summary}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('pt-BR') : 'Data N/D'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        slug: /{post.slug}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* Alternar Publicar/Despublicar */}
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      post.published
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                    title={post.published ? 'Despublicar este artigo' : 'Publicar este artigo no site'}
                  >
                    {post.published ? (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Despublicar
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" /> Publicar
                      </>
                    )}
                  </button>

                  {/* Pré-visualizar */}
                  <button
                    onClick={() => {
                      setPreviewPost(post);
                      setIsPreviewOpen(true);
                    }}
                    className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                    title="Pré-visualizar artigo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => handleOpenEditModal(post)}
                    className="p-2 rounded-lg bg-white/5 text-[#C5A059] hover:bg-[#C5A059]/20 border border-[#C5A059]/30 transition-all cursor-pointer"
                    title="Editar artigo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={() => {
                      setDeletingPost(post);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                    title="Excluir artigo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE FORMULÁRIO (CRIAR / EDITAR) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B1526] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl my-8 relative"
            >
              {/* Header do Modal */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0B1526] z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-serif">
                      {editingPost ? 'Editar Artigo Técnico / Laudo' : 'Novo Artigo Técnico / Laudo'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Preencha os dados abaixo com precisão técnica e rigor normativo NBR.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo do Formulário */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Linha 1: Título e Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                      Título do Artigo / Laudo *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="Ex: Laudo Pericial de Patologia Estrutural em Edificações"
                      className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                      Slug da URL *
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={handleSlugChange}
                      placeholder="laudo-pericial-patologia-estrutural"
                      className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-all font-mono"
                    />
                    {slugError ? (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {slugError}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        URL amigável gerada: <span className="text-[#C5A059]">/artigos/{slug || 'exemplo'}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Linha 2: Categoria e Autor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                      Categoria Técnica *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-all"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                      Autor Responsável
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Engª Jucélia Santana"
                      className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-all"
                    />
                  </div>
                </div>

                {/* Linha 3: Resumo / Excerpt */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Resumo Executivo (Exibido nos Cards) *
                  </label>
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Breve resumo destacando os pontos principais, diagnósticos normativos e relevância para o cliente..."
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-all resize-none"
                  />
                </div>

                {/* Linha 4: Imagem de Capa */}
                <div className="space-y-3 border border-white/10 rounded-xl p-5 bg-[#070D18]">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Imagem de Capa (Bucket blog-images)
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Prévia */}
                    <div className="w-full sm:w-48 h-32 rounded-xl bg-[#0B1526] border border-white/10 overflow-hidden flex items-center justify-center shrink-0 relative group">
                      {coverUrl ? (
                        <>
                          <img src={coverUrl} alt="Capa do artigo" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCoverUrl('')}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover imagem"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-3 text-slate-500">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px] block">Nenhuma imagem selecionada</span>
                        </div>
                      )}
                    </div>

                    {/* Inputs e Botão */}
                    <div className="space-y-3 flex-1 w-full">
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2">
                          <Upload className="w-4 h-4 text-[#C5A059]" />
                          <span>{uploadingImage ? 'Enviando...' : 'Selecionar Foto do Computador'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                        {uploadingImage && <RefreshCw className="w-4 h-4 text-[#C5A059] animate-spin" />}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 block">Ou informe uma URL direta de imagem:</span>
                        <input
                          type="text"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          placeholder="https://exemplo.com/imagem.jpg"
                          className="w-full bg-[#0B1526] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linha 5: Conteúdo Completo e Editor Simplificado */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                      Conteúdo Completo do Artigo / Laudo *
                    </label>

                    {/* Toolbar de Formatação Rápida */}
                    <div className="flex items-center gap-1 bg-[#070D18] p-1 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => insertFormatting('b')}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                        title="Adicionar Negrito"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('i')}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                        title="Adicionar Itálico"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('h2')}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold"
                        title="Adicionar Subtítulo H2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('h3')}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold"
                        title="Adicionar Tópico H3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('list')}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                        title="Adicionar Lista"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('quote')}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                        title="Adicionar Citação Normativa"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva a análise técnica completa, diagnósticos periciais, metodologias utilizadas, dados de ensaio e prescrições de correção..."
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-all font-mono leading-relaxed"
                  />
                </div>

                {/* Opção de Publicar Direto */}
                <div className="flex items-center gap-3 p-4 bg-[#070D18] border border-white/10 rounded-xl">
                  <input
                    type="checkbox"
                    id="publishedCheckbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 accent-[#C5A059] rounded cursor-pointer"
                  />
                  <label htmlFor="publishedCheckbox" className="text-xs text-slate-200 font-medium cursor-pointer">
                    Publicar imediatamente no site público após salvar (visível para os clientes)
                  </label>
                </div>
              </div>

              {/* Rodapé do Modal com Botões */}
              <div className="p-6 border-t border-white/10 bg-[#0B1526] flex items-center justify-end gap-3 sticky bottom-0">
                <Button
                  onClick={() => setIsFormOpen(false)}
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 text-slate-300 text-xs px-5"
                  disabled={saving}
                >
                  Cancelar
                </Button>

                <Button
                  onClick={() => handleSavePost(false)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase px-5 flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Salvar como Rascunho</span>
                </Button>

                <Button
                  onClick={() => handleSavePost(true)}
                  className="bg-[#C5A059] hover:bg-[#b08d49] text-[#070D18] font-bold text-xs uppercase px-6 flex items-center gap-2 shadow-lg shadow-[#C5A059]/20"
                  disabled={saving}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>Publicar Artigo</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO */}
      <AnimatePresence>
        {isPreviewOpen && previewPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A1220] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl my-8 relative"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0A1220] z-20">
                <div className="flex items-center gap-2 text-xs text-[#C5A059] font-bold uppercase tracking-wider">
                  <Eye className="w-4 h-4" /> Pré-visualização de Leitura
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {previewPost.cover_url && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#070D18] border border-white/10">
                    <img src={previewPost.cover_url} alt={previewPost.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="px-2.5 py-1 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 font-semibold">
                      {previewPost.category}
                    </span>
                    <span>Por {previewPost.author}</span>
                  </div>

                  <h1 className="font-cinzel font-bold text-2xl sm:text-3xl text-white leading-tight">
                    {previewPost.title}
                  </h1>

                  <p className="text-sm text-slate-300 italic border-l-2 border-[#C5A059] pl-4 py-1 bg-white/[0.02]">
                    {previewPost.summary}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6 text-slate-200 text-sm leading-relaxed whitespace-pre-line space-y-4">
                  {previewPost.content}
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-[#070D18] flex justify-end">
                <Button onClick={() => setIsPreviewOpen(false)} variant="outline" className="text-xs px-5">
                  Fechar Prévia
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B1526] border border-rose-500/30 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Confirmar Exclusão</h3>
                  <span className="text-xs text-rose-300">Ação irreversível</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Tem certeza de que deseja remover permanentemente o artigo{' '}
                <strong className="text-white">"{deletingPost.title}"</strong>? Esta operação irá removê-lo do banco de dados e despublicá-lo do site imediatamente.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  variant="outline"
                  className="border-white/10 text-xs px-4"
                  disabled={saving}
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleDeletePost}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase px-5 flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Excluir Permanentemente</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
