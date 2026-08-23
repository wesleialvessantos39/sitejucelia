// /src/pages/AdminSlides.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Image as ImageIcon,
  ShieldAlert,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { MediaDisplayEditorModal } from '../components/admin/MediaDisplayEditorModal';
import { ManagedMedia } from '../components/ui/ManagedMedia';
import type { DashboardSlide } from '../types';

export default function AdminSlides() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [slides, setSlides] = useState<DashboardSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mensagens de Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado para Modal de Criar Novo Slide
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [newOrder, setNewOrder] = useState<number>(0);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Estado para Modal de Editar Slide
  const [editingSlide, setEditingSlide] = useState<DashboardSlide | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editOrder, setEditOrder] = useState<number>(0);

  // Estado para Modal de Substituir Imagem
  const [replacingSlide, setReplacingSlide] = useState<DashboardSlide | null>(null);
  const [replaceImageFile, setReplaceImageFile] = useState<File | null>(null);
  const [replaceImagePreview, setReplaceImagePreview] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Estado para Modal de Confirmação de Exclusão
  const [deletingSlide, setDeletingSlide] = useState<DashboardSlide | null>(null);

  // Estado para Modal de Enquadramento Universal (Etapa 17)
  const [framingSlide, setFramingSlide] = useState<DashboardSlide | null>(null);

  // Carrega os slides do Supabase
  const fetchSlides = async () => {
    try {
      setLoading(true);
      const data = await supabaseDatabase.getDashboardSlides();
      const sorted = [...(data || [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      setSlides(sorted);
    } catch (err: any) {
      console.error('[AdminSlides] Erro ao carregar slides do Dashboard:', err);
      setErrorMessage('Erro ao carregar os slides do Dashboard. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // Helper para exibir feedback temporário
  const showFeedback = (successMsg: string | null, errorMsg: string | null = null) => {
    if (successMsg) {
      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
    if (errorMsg) {
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Validação de arquivo de imagem
  const validateImageFile = (file: File): string | null => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Formato de arquivo não suportado. Utilize apenas PNG, JPG, JPEG ou WEBP.';
    }
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `O arquivo deve possuir no máximo ${maxSizeMB}MB.`;
    }
    return null;
  };

  // Handler para seleção de nova imagem (Novo Slide)
  const handleSelectNewImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      showFeedback(null, error);
      return;
    }

    setNewImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handler para seleção de nova imagem (Substituição)
  const handleSelectReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      showFeedback(null, error);
      return;
    }

    setReplaceImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReplaceImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Criar Novo Slide
  const handleCreateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!newImageFile) {
      showFeedback(null, 'Por favor, selecione uma imagem para o slide.');
      return;
    }

    try {
      setSaving(true);

      // 1. Upload da imagem para o Supabase Storage
      const uploadResult = await supabaseStorage.uploadSlideImage(newImageFile);

      // 2. Criação do objeto slide
      const now = new Date().toISOString();
      const newSlide: DashboardSlide = {
        id: `slide_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: newTitle.trim() || `Slide ${slides.length + 1}`,
        description: newDescription.trim() || undefined,
        image_url: uploadResult.publicUrl,
        storage_path: uploadResult.path,
        order_index: newOrder >= 0 ? newOrder : slides.length,
        active: newActive,
        created_at: now,
        updated_at: now,
      };

      // 3. Atualizar array ordenado
      const updatedList = [...slides, newSlide].sort((a, b) => a.order_index - b.order_index);

      // Re-indexar ordens
      const reindexed = updatedList.map((item, idx) => ({ ...item, order_index: idx }));

      // 4. Salvar no Supabase
      await supabaseDatabase.saveDashboardSlides(reindexed, user?.id);

      // 5. Auditoria
      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'CREATE_DASHBOARD_SLIDE',
        entity_type: 'dashboard_slides',
        entity_id: newSlide.id,
        details: { title: newSlide.title, image_url: newSlide.image_url, active: newSlide.active },
      });

      setSlides(reindexed);
      setIsCreateModalOpen(false);

      // Limpa campos
      setNewTitle('');
      setNewDescription('');
      setNewActive(true);
      setNewOrder(reindexed.length);
      setNewImageFile(null);
      setNewImagePreview(null);

      showFeedback('Slide cadastrado com sucesso.');
    } catch (err: any) {
      console.error('[AdminSlides] Erro ao cadastrar slide:', err);
      showFeedback(null, 'Erro ao enviar a imagem ou cadastrar o slide. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Salvar Edição de Texto e Status do Slide
  const handleSaveEditSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingSlide) return;

    try {
      setSaving(true);
      const now = new Date().toISOString();

      const updatedList = slides.map((s) => {
        if (s.id === editingSlide.id) {
          return {
            ...s,
            title: editTitle.trim() || s.title,
            description: editDescription.trim(),
            active: editActive,
            order_index: editOrder,
            updated_at: now,
          };
        }
        return s;
      }).sort((a, b) => a.order_index - b.order_index);

      const reindexed = updatedList.map((item, idx) => ({ ...item, order_index: idx }));

      await supabaseDatabase.saveDashboardSlides(reindexed, user?.id);

      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'UPDATE_DASHBOARD_SLIDE',
        entity_type: 'dashboard_slides',
        entity_id: editingSlide.id,
        details: { title: editTitle, active: editActive, order_index: editOrder },
      });

      setSlides(reindexed);
      setEditingSlide(null);
      showFeedback('Slide atualizado com sucesso.');
    } catch (err: any) {
      console.error('[AdminSlides] Erro ao atualizar slide:', err);
      showFeedback(null, 'Erro ao atualizar as informações do slide.');
    } finally {
      setSaving(false);
    }
  };

  // Substituir Imagem do Slide
  const handleSaveReplaceImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !replacingSlide || !replaceImageFile) return;

    try {
      setSaving(true);

      // 1. Enviar nova imagem para o Storage primeiro
      const uploadResult = await supabaseStorage.uploadSlideImage(replaceImageFile);

      // 2. Guarda o storage_path antigo para remover somente após o sucesso
      const oldStoragePath = replacingSlide.storage_path;

      const now = new Date().toISOString();
      const updatedList = slides.map((s) => {
        if (s.id === replacingSlide.id) {
          return {
            ...s,
            image_url: uploadResult.publicUrl,
            storage_path: uploadResult.path,
            updated_at: now,
          };
        }
        return s;
      });

      // 3. Atualizar o banco de dados
      await supabaseDatabase.saveDashboardSlides(updatedList, user?.id);

      // 4. Remover arquivo antigo do Storage se existir
      if (oldStoragePath) {
        await supabaseStorage.deleteSlideImage(oldStoragePath);
      }

      // 5. Auditoria
      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'UPDATE_DASHBOARD_SLIDE_IMAGE',
        entity_type: 'dashboard_slides',
        entity_id: replacingSlide.id,
        details: { old_path: oldStoragePath, new_path: uploadResult.path },
      });

      setSlides(updatedList);
      setReplacingSlide(null);
      setReplaceImageFile(null);
      setReplaceImagePreview(null);

      showFeedback('Imagem do slide substituída com sucesso.');
    } catch (err: any) {
      console.error('[AdminSlides] Erro ao substituir imagem do slide:', err);
      showFeedback(null, 'Erro ao fazer upload da nova imagem. A imagem anterior foi mantida.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Ativar / Desativar rápido
  const handleToggleActive = async (slide: DashboardSlide) => {
    if (!isAdmin) return;

    try {
      setSaving(true);
      const newStatus = !slide.active;
      const now = new Date().toISOString();

      const updatedList = slides.map((s) => (s.id === slide.id ? { ...s, active: newStatus, updated_at: now } : s));

      await supabaseDatabase.saveDashboardSlides(updatedList, user?.id);

      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: newStatus ? 'ACTIVATE_DASHBOARD_SLIDE' : 'DEACTIVATE_DASHBOARD_SLIDE',
        entity_type: 'dashboard_slides',
        entity_id: slide.id,
        details: { title: slide.title, active: newStatus },
      });

      setSlides(updatedList);
      showFeedback(newStatus ? 'Slide ativado com sucesso.' : 'Slide desativado com sucesso.');
    } catch (err: any) {
      console.error('[AdminSlides] Erro ao alterar status do slide:', err);
      showFeedback(null, 'Erro ao alterar o status do slide.');
    } finally {
      setSaving(false);
    }
  };

  // Reordenar Slide (Subir ou Descer)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    try {
      setSaving(true);
      const newSlides = [...slides];
      const temp = newSlides[index];
      newSlides[index] = newSlides[targetIndex];
      newSlides[targetIndex] = temp;

      // Re-indexar ordens
      const now = new Date().toISOString();
      const reindexed = newSlides.map((item, idx) => ({ ...item, order_index: idx, updated_at: now }));

      await supabaseDatabase.saveDashboardSlides(reindexed, user?.id);

      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'REORDER_DASHBOARD_SLIDES',
        entity_type: 'dashboard_slides',
        entity_id: null,
        details: { moved_slide_id: temp.id, from: index, to: targetIndex },
      });

      setSlides(reindexed);
      showFeedback('Ordem dos slides atualizada com sucesso.');
    } catch (err: any) {
      console.error('[AdminSlides] Erro ao reordenar slides:', err);
      showFeedback(null, 'Erro ao salvar a nova ordem dos slides.');
    } finally {
      setSaving(false);
    }
  };

  // Confirmar Exclusão de Slide
  const handleConfirmDeleteSlide = async () => {
    if (!isAdmin || !deletingSlide) return;

    try {
      setSaving(true);

      // 1. Filtrar a lista
      const updatedList = slides.filter((s) => s.id !== deletingSlide.id);
      const reindexed = updatedList.map((item, idx) => ({ ...item, order_index: idx }));

      // 2. Remover do banco de dados
      await supabaseDatabase.saveDashboardSlides(reindexed, user?.id);

      // 3. Remover a imagem do Supabase Storage se tiver storage_path
      if (deletingSlide.storage_path) {
        await supabaseStorage.deleteSlideImage(deletingSlide.storage_path);
      }

      // 4. Auditoria
      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'DELETE_DASHBOARD_SLIDE',
        entity_type: 'dashboard_slides',
        entity_id: deletingSlide.id,
        details: { title: deletingSlide.title, image_url: deletingSlide.image_url, storage_path: deletingSlide.storage_path },
      });

      setSlides(reindexed);
      setDeletingSlide(null);
      showFeedback('Slide removido com sucesso.');
    } catch (err: any) {
      console.error('[AdminSlides] Erro ao excluir slide:', err);
      showFeedback(null, 'Erro ao remover o slide. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Se não for administrador
  if (!isAdmin) {
    return (
      <div className="p-8 bg-[#0B1526] rounded-2xl border border-rose-500/20 text-center max-w-2xl mx-auto my-12">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 font-serif">Acesso Restrito ao Administrador</h2>
        <p className="text-slate-400 text-sm">
          Apenas usuários com perfil de administrador ativo possuem permissão para gerenciar os slides do Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0B1526] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-serif tracking-tight">
              Slides do Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie as imagens de fundo e apresentações exibidas na tela inicial do site.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewTitle('');
            setNewDescription('');
            setNewActive(true);
            setNewOrder(slides.length);
            setNewImageFile(null);
            setNewImagePreview(null);
            setIsCreateModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4b068] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Slide
        </button>
      </div>

      {/* Banner de Mensagens Feedback */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400/60 hover:text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400/60 hover:text-rose-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lista de Slides */}
      {loading ? (
        <div className="p-12 text-center bg-[#0B1526] rounded-2xl border border-white/10">
          <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Carregando slides do Dashboard...</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="p-12 text-center bg-[#0B1526] rounded-2xl border border-white/10 space-y-4">
          <ImageIcon className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white font-serif">Nenhum Slide Cadastrado</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Não há slides configurados para o Dashboard. Clique no botão abaixo para adicionar a primeira imagem de fundo.
          </p>
          <button
            type="button"
            onClick={() => {
              setNewOrder(0);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#C5A059] text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Primeiro Slide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`bg-[#0B1526] rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xl ${
                slide.active
                  ? 'border-white/10 hover:border-[#C5A059]/50'
                  : 'border-white/5 opacity-60 bg-[#070D18]'
              }`}
            >
              {/* Imagem do Slide */}
              <div className="relative h-48 w-full bg-[#070D18] group overflow-hidden">
                <ManagedMedia
                  mediaKey={`dashboard_slide:${slide.id}`}
                  src={slide.image_url}
                  alt={slide.title}
                  context="hero_slide"
                  className="group-hover:scale-105 transition-transform duration-500"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1526] via-transparent to-black/40 pointer-events-none" />

                {/* Badge de Ordem e Status */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold">
                    Ordem #{slide.order_index + 1}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider border ${
                      slide.active
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-500/20 border-slate-500/40 text-slate-400'
                    }`}
                  >
                    {slide.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Botões para Reordenar Rápidos */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0 || saving}
                    title="Mover para Cima"
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-[#C5A059] text-white hover:text-black border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === slides.length - 1 || saving}
                    title="Mover para Baixo"
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-[#C5A059] text-white hover:text-black border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Informações do Slide */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-white text-base truncate" title={slide.title}>
                    {slide.title}
                  </h3>
                  {slide.description ? (
                    <p className="text-slate-400 text-xs line-clamp-2 mt-1">{slide.description}</p>
                  ) : (
                    <p className="text-slate-600 text-xs italic mt-1">Sem descrição complementar</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center">
                  <span>
                    Atualizado:{' '}
                    {slide.updated_at ? new Date(slide.updated_at).toLocaleDateString('pt-BR') : 'Data n/a'}
                  </span>
                  <span>ID: {slide.id.slice(0, 10)}</span>
                </div>
              </div>

              {/* Ações Administrativas */}
              <div className="p-3 bg-[#070D18] border-t border-white/10 grid grid-cols-5 gap-1.5 text-center">
                <button
                  type="button"
                  onClick={() => handleToggleActive(slide)}
                  disabled={saving}
                  title={slide.active ? 'Desativar Slide' : 'Ativar Slide'}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    slide.active
                      ? 'bg-emerald-500/10 hover:bg-amber-500/20 text-emerald-400 hover:text-amber-400 border border-emerald-500/20'
                      : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-white/10'
                  }`}
                >
                  {slide.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{slide.active ? 'Ativo' : 'Inativo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFramingSlide(slide)}
                  disabled={saving}
                  title="Ajustar Enquadramento e Foco"
                  className="py-2 px-1 rounded-xl bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Enquadrar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSlide(slide);
                    setEditTitle(slide.title);
                    setEditDescription(slide.description || '');
                    setEditActive(slide.active);
                    setEditOrder(slide.order_index);
                  }}
                  disabled={saving}
                  title="Editar Informações"
                  className="py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[10px]">Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReplacingSlide(slide);
                    setReplaceImageFile(null);
                    setReplaceImagePreview(null);
                  }}
                  disabled={saving}
                  title="Substituir Imagem"
                  className="py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px]">Imagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingSlide(slide)}
                  disabled={saving}
                  title="Excluir Slide"
                  className="py-2 px-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: CADASTRO DE NOVO SLIDE */}
      {/* ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1526] rounded-2xl border border-[#C5A059]/40 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#122038]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-white text-lg">Novo Slide do Dashboard</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSlide} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Upload de Imagem */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-2">
                  Imagem do Slide * (PNG, JPG, WEBP - Max 10MB)
                </label>
                <div
                  onClick={() => createFileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-[#C5A059] rounded-xl p-4 text-center cursor-pointer bg-[#070D18]/50 transition-all group"
                >
                  {newImagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={newImagePreview}
                        alt="Prévia do Slide"
                        className="max-h-40 mx-auto rounded-lg object-cover border border-white/20"
                      />
                      <span className="text-[11px] text-[#C5A059] block font-semibold">
                        Clique para alterar a imagem selecionada
                      </span>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#C5A059] mx-auto transition-colors" />
                      <p className="text-xs font-medium text-slate-300">
                        Clique para selecionar ou arraste o arquivo aqui
                      </p>
                      <p className="text-[10px] text-slate-500">Proporção sugerida: 16:9 ou Full HD (1920x1080px)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={createFileInputRef}
                    onChange={handleSelectNewImage}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Título do Slide */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Título / Identificação do Slide
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Projeto Residencial Ariquemes"
                  className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Descrição do Slide */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Descrição / Legenda Interna
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Descrição complementar técnica ou localização da obra"
                  className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Ordem e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">Ordem de Exibição</label>
                  <input
                    type="number"
                    min={0}
                    value={newOrder}
                    onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">Status Inicial</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={newActive}
                      onChange={(e) => setNewActive(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#070D18] text-[#C5A059] focus:ring-0"
                    />
                    <span>Ativo no Dashboard</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !newImageFile}
                  className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#d4b068] text-black font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Slide'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: EDIÇÃO DE SLIDE */}
      {/* ========================================== */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1526] rounded-2xl border border-white/20 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#122038]">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-white text-lg">Editar Informações do Slide</h3>
              </div>
              <button onClick={() => setEditingSlide(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSlide} className="p-6 space-y-4">
              {/* Prévia da Imagem Atual */}
              <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-[#070D18]">
                <img src={editingSlide.image_url} alt={editingSlide.title} className="w-full h-full object-cover" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Título / Identificação
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Descrição</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    min={0}
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Status</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#070D18] text-[#C5A059] focus:ring-0"
                    />
                    <span>Ativo no Dashboard</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#d4b068] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Atualizar Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: SUBSTITUIR IMAGEM */}
      {/* ========================================== */}
      {replacingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1526] rounded-2xl border border-blue-500/40 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#122038]">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif font-bold text-white text-lg">Substituir Imagem do Slide</h3>
              </div>
              <button onClick={() => setReplacingSlide(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReplaceImage} className="p-6 space-y-5">
              <p className="text-xs text-slate-300">
                Substituindo imagem de: <strong className="text-white">{replacingSlide.title}</strong>
              </p>

              {/* Upload de Imagem */}
              <div
                onClick={() => replaceFileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-500/30 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer bg-[#070D18]/60 transition-all group"
              >
                {replaceImagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={replaceImagePreview}
                      alt="Prévia Nova Imagem"
                      className="max-h-44 mx-auto rounded-lg object-cover border border-white/20"
                    />
                    <span className="text-[11px] text-blue-400 block font-semibold">
                      Clique para escolher outro arquivo
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="relative h-28 w-full rounded-lg overflow-hidden border border-white/10 mb-3 opacity-60">
                      <img src={replacingSlide.image_url} alt="Atual" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold text-white">
                        Imagem Atual
                      </div>
                    </div>
                    <Upload className="w-6 h-6 text-blue-400 mx-auto" />
                    <p className="text-xs font-medium text-slate-200">Clique para selecionar a NOVA imagem</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={replaceFileInputRef}
                  onChange={handleSelectReplaceImage}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300">
                Ao confirmar, a nova imagem será enviada para o Supabase Storage e substituirá a imagem atual do
                Dashboard de forma segura.
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplacingSlide(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !replaceImageFile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Confirmar Substituição'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ========================================== */}
      {deletingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1526] rounded-2xl border border-rose-500/40 max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-white text-lg">Excluir Slide do Dashboard</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Este slide será removido do Dashboard e sua imagem poderá ser removida do armazenamento. Deseja
              continuar?
            </p>

            <div className="p-3 bg-[#070D18] rounded-xl border border-white/10 flex items-center gap-3">
              <img
                src={deletingSlide.image_url}
                alt={deletingSlide.title}
                className="w-12 h-12 object-cover rounded-lg border border-white/10"
              />
              <div className="overflow-hidden">
                <span className="font-semibold text-white text-xs block truncate">{deletingSlide.title}</span>
                <span className="text-[10px] text-slate-400 block">Ordem #{deletingSlide.order_index + 1}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingSlide(null)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSlide}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Excluindo...
                  </>
                ) : (
                  'Excluir Definitivamente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 5: ENQUADRAMENTO UNIVERSAL DE MÍDIA */}
      {/* ========================================== */}
      {framingSlide && (
        <MediaDisplayEditorModal
          isOpen={!!framingSlide}
          onClose={() => setFramingSlide(null)}
          mediaKey={`dashboard_slide:${framingSlide.id}`}
          mediaUrl={framingSlide.image_url}
          mediaTitle={framingSlide.title}
          mediaType="image"
          context="hero_slide"
          onSaved={() => {
            showFeedback('Enquadramento e foco visual atualizados com sucesso!');
          }}
        />
      )}
    </div>
  );
}
