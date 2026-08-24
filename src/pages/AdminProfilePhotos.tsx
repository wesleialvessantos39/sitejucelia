// /src/pages/AdminProfilePhotos.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
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
  Star,
  Award,
  Camera,
  Layers,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { MediaDisplayEditorModal } from '../components/admin/MediaDisplayEditorModal';
import { ManagedMedia } from '../components/ui/ManagedMedia';
import type { InstitutionalPhoto } from '../types';

export default function AdminProfilePhotos() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [photos, setPhotos] = useState<InstitutionalPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mensagens de Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado para Modal de Criar Nova Foto
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Perfil Profissional e Engenharia');
  const [newPose, setNewPose] = useState('Atuação Executiva e Consultoria');
  const [newOutfit, setNewOutfit] = useState('Engenheira Civil');
  const [newCaption, setNewCaption] = useState('');
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [newActive, setNewActive] = useState(true);
  const [newOrder, setNewOrder] = useState<number>(0);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Estado para Modal de Editar Foto
  const [editingPhoto, setEditingPhoto] = useState<InstitutionalPhoto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPose, setEditPose] = useState('');
  const [editOutfit, setEditOutfit] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editIsPrimary, setEditIsPrimary] = useState(false);
  const [editActive, setEditActive] = useState(true);
  const [editOrder, setEditOrder] = useState<number>(0);

  // Estado para Modal de Substituir Imagem
  const [replacingPhoto, setReplacingPhoto] = useState<InstitutionalPhoto | null>(null);
  const [replaceImageFile, setReplaceImageFile] = useState<File | null>(null);
  const [replaceImagePreview, setReplaceImagePreview] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Estado para Modal de Confirmação de Exclusão
  const [deletingPhoto, setDeletingPhoto] = useState<InstitutionalPhoto | null>(null);

  // Estado para Modal de Enquadramento Universal (Etapa 17)
  const [framingPhoto, setFramingPhoto] = useState<InstitutionalPhoto | null>(null);

  // Carrega as fotos institucionais do Supabase
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await supabaseDatabase.getInstitutionalPhotos();
      const sorted = [...(data || [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      setPhotos(sorted);
    } catch (err: any) {
      console.error('[AdminProfilePhotos] Erro ao carregar fotos institucionais:', err);
      setErrorMessage('Erro ao carregar as fotos de perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Helper de feedback temporário
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

  // Seleção de nova imagem (Nova Foto)
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

  // Seleção de nova imagem (Substituição)
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

  // Criar Nova Foto de Perfil
  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!newImageFile) {
      showFeedback(null, 'Por favor, selecione um arquivo de imagem.');
      return;
    }

    try {
      setSaving(true);

      // 1. Upload da imagem para o Supabase Storage
      const uploadResult = await supabaseStorage.uploadInstitutionalPhoto(newImageFile);

      // 2. Se a nova foto for definida como Principal, desmarca as anteriores
      const now = new Date().toISOString();
      let updatedList = photos.map((p) => (newIsPrimary ? { ...p, is_primary: false, updated_at: now } : p));

      // Se for a primeira foto do sistema, força ser principal
      const shouldBePrimary = newIsPrimary || updatedList.length === 0;

      const newPhoto: InstitutionalPhoto = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: newTitle.trim() || `Foto de Perfil ${photos.length + 1}`,
        category: newCategory.trim() || 'Perfil Profissional',
        pose: newPose.trim() || 'Atuação Executiva e Perícia',
        outfit: newOutfit.trim() || 'Engenheira Civil',
        caption: newCaption.trim() || undefined,
        image_url: uploadResult.publicUrl,
        storage_path: uploadResult.path,
        is_primary: shouldBePrimary,
        order_index: newOrder >= 0 ? newOrder : updatedList.length,
        active: newActive,
        created_at: now,
        updated_at: now,
      };

      updatedList.push(newPhoto);
      updatedList.sort((a, b) => a.order_index - b.order_index);

      // Re-indexar ordens
      const reindexed = updatedList.map((item, idx) => ({ ...item, order_index: idx }));

      // 3. Salvar no Supabase database
      await supabaseDatabase.saveInstitutionalPhotos(reindexed, user?.id);

      // 4. Auditoria
      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'CREATE_INSTITUTIONAL_PHOTO',
        entity_type: 'institutional_photos',
        entity_id: newPhoto.id,
        details: { title: newPhoto.title, is_primary: newPhoto.is_primary, active: newPhoto.active },
      });

      setPhotos(reindexed);
      setIsCreateModalOpen(false);

      // Reset campos
      setNewTitle('');
      setNewCategory('Perfil Profissional e Engenharia');
      setNewPose('Atuação Executiva e Consultoria');
      setNewOutfit('Engenheira Civil');
      setNewCaption('');
      setNewIsPrimary(false);
      setNewActive(true);
      setNewOrder(reindexed.length);
      setNewImageFile(null);
      setNewImagePreview(null);

      showFeedback('Foto de perfil cadastrada com sucesso.');
    } catch (err: any) {
      console.error('[AdminProfilePhotos] Erro ao cadastrar foto:', err);
      showFeedback(null, 'Erro ao enviar a imagem ou cadastrar a foto de perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Salvar Edição da Foto
  const handleSaveEditPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingPhoto) return;

    try {
      setSaving(true);
      const now = new Date().toISOString();

      let updatedList = photos.map((p) => {
        if (editIsPrimary && p.id !== editingPhoto.id) {
          return { ...p, is_primary: false, updated_at: now };
        }
        if (p.id === editingPhoto.id) {
          return {
            ...p,
            title: editTitle.trim() || p.title,
            category: editCategory.trim(),
            pose: editPose.trim(),
            outfit: editOutfit.trim(),
            caption: editCaption.trim(),
            is_primary: editIsPrimary,
            active: editActive,
            order_index: editOrder,
            updated_at: now,
          };
        }
        return p;
      }).sort((a, b) => a.order_index - b.order_index);

      const reindexed = updatedList.map((item, idx) => ({ ...item, order_index: idx }));

      await supabaseDatabase.saveInstitutionalPhotos(reindexed, user?.id);

      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'UPDATE_INSTITUTIONAL_PHOTO',
        entity_type: 'institutional_photos',
        entity_id: editingPhoto.id,
        details: { title: editTitle, is_primary: editIsPrimary, active: editActive },
      });

      setPhotos(reindexed);
      setEditingPhoto(null);
      showFeedback('Informações da foto atualizadas com sucesso.');
    } catch (err: any) {
      console.error('[AdminProfilePhotos] Erro ao atualizar foto:', err);
      showFeedback(null, 'Erro ao atualizar os dados da foto.');
    } finally {
      setSaving(false);
    }
  };

  // Definir rapidamente como Foto Principal da Seção Sobre
  const handleSetPrimary = async (photo: InstitutionalPhoto) => {
    if (!isAdmin) return;

    try {
      setSaving(true);
      const now = new Date().toISOString();

      const updatedList = photos.map((p) => ({
        ...p,
        is_primary: p.id === photo.id,
        active: p.id === photo.id ? true : p.active, // Garante que a principal fique ativa
        updated_at: now,
      }));

      await supabaseDatabase.saveInstitutionalPhotos(updatedList, user?.id);

      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'SET_PRIMARY_INSTITUTIONAL_PHOTO',
        entity_type: 'institutional_photos',
        entity_id: photo.id,
        details: { title: photo.title, is_primary: true },
      });

      setPhotos(updatedList);
      showFeedback(`'${photo.title}' definida como a Foto Principal da Seção Sobre!`);
    } catch (err: any) {
      console.error('[AdminProfilePhotos] Erro ao definir foto principal:', err);
      showFeedback(null, 'Erro ao alterar a foto principal.');
    } finally {
      setSaving(false);
    }
  };

  // Substituir Imagem da Foto Existente
  const handleSaveReplaceImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !replacingPhoto || !replaceImageFile) return;

    try {
      setSaving(true);

      // 1. Upload do novo arquivo
      const uploadResult = await supabaseStorage.uploadInstitutionalPhoto(replaceImageFile);

      // 2. Guarda caminho antigo para remoção
      const oldStoragePath = replacingPhoto.storage_path;

      const now = new Date().toISOString();
      const updatedList = photos.map((p) => {
        if (p.id === replacingPhoto.id) {
          return {
            ...p,
            image_url: uploadResult.publicUrl,
            storage_path: uploadResult.path,
            updated_at: now,
          };
        }
        return p;
      });

      // 3. Atualiza no Supabase
      await supabaseDatabase.saveInstitutionalPhotos(updatedList, user?.id);

      // 4. Deleta arquivo antigo do Storage se possuir
      if (oldStoragePath) {
        await supabaseStorage.deleteInstitutionalPhoto(oldStoragePath);
      }

      // 5. Auditoria
      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'UPDATE_INSTITUTIONAL_PHOTO_IMAGE',
        entity_type: 'institutional_photos',
        entity_id: replacingPhoto.id,
        details: { old_path: oldStoragePath, new_path: uploadResult.path },
      });

      setPhotos(updatedList);
      setReplacingPhoto(null);
      setReplaceImageFile(null);
      setReplaceImagePreview(null);

      showFeedback('Imagem de perfil substituída com sucesso.');
    } catch (err: any) {
      console.error('[AdminProfilePhotos] Erro ao substituir imagem de perfil:', err);
      showFeedback(null, 'Erro ao fazer upload da nova imagem. A imagem anterior foi mantida.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Ativar / Desativar rápido
  const handleToggleActive = async (photo: InstitutionalPhoto) => {
    if (!isAdmin) return;

    try {
      setSaving(true);
      const newStatus = !photo.active;
      const now = new Date().toISOString();

      const updatedList = photos.map((p) => (p.id === photo.id ? { ...p, active: newStatus, updated_at: now } : p));

      await supabaseDatabase.saveInstitutionalPhotos(updatedList, user?.id);

      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: newStatus ? 'ACTIVATE_INSTITUTIONAL_PHOTO' : 'DEACTIVATE_INSTITUTIONAL_PHOTO',
        entity_type: 'institutional_photos',
        entity_id: photo.id,
        details: { title: photo.title, active: newStatus },
      });

      setPhotos(updatedList);
      showFeedback(newStatus ? 'Foto ativada com sucesso.' : 'Foto desativada com sucesso.');
    } catch (err: any) {
      console.error('[AdminProfilePhotos] Erro ao alterar status da foto:', err);
      showFeedback(null, 'Erro ao alterar o status da foto.');
    } finally {
      setSaving(false);
    }
  };

  // Reordenar Foto (Subir ou Descer)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    try {
      setSaving(true);
      const newPhotos = [...photos];
      const temp = newPhotos[index];
      newPhotos[index] = newPhotos[targetIndex];
      newPhotos[targetIndex] = temp;

      const now = new Date().toISOString();
      const reindexed = newPhotos.map((item, idx) => ({ ...item, order_index: idx, updated_at: now }));

      await supabaseDatabase.saveInstitutionalPhotos(reindexed, user?.id);

      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'REORDER_INSTITUTIONAL_PHOTOS',
        entity_type: 'institutional_photos',
        entity_id: null,
        details: { moved_photo_id: temp.id, from: index, to: targetIndex },
      });

      setPhotos(reindexed);
      showFeedback('Ordem das fotos atualizada com sucesso.');
    } catch (err: any) {
      console.error('[AdminProfilePhotos] Erro ao reordenar fotos:', err);
      showFeedback(null, 'Erro ao salvar a nova ordem das fotos.');
    } finally {
      setSaving(false);
    }
  };

  // Confirmar Exclusão de Foto
  const handleConfirmDeletePhoto = async () => {
    if (!isAdmin || !deletingPhoto) return;

    try {
      setSaving(true);

      const updatedList = photos.filter((p) => p.id !== deletingPhoto.id);
      const reindexed = updatedList.map((item, idx) => ({ ...item, order_index: idx }));

      // Se deletar a principal, define a primeira como nova principal se houver
      if (deletingPhoto.is_primary && reindexed.length > 0) {
        reindexed[0].is_primary = true;
      }

      await supabaseDatabase.saveInstitutionalPhotos(reindexed, user?.id);

      // Deleta arquivo do Storage
      if (deletingPhoto.storage_path) {
        await supabaseStorage.deleteInstitutionalPhoto(deletingPhoto.storage_path);
      }

      await supabaseDatabase.logAdminAction({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: 'DELETE_INSTITUTIONAL_PHOTO',
        entity_type: 'institutional_photos',
        entity_id: deletingPhoto.id,
        details: { title: deletingPhoto.title, storage_path: deletingPhoto.storage_path },
      });

      setPhotos(reindexed);
      setDeletingPhoto(null);
      showFeedback('Foto de perfil removida com sucesso.');
    } catch (err: any) {
      console.error('[AdminProfilePhotos] Erro ao excluir foto:', err);
      showFeedback(null, 'Erro ao remover a foto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-[#0B1526] rounded-2xl border border-rose-500/20 text-center max-w-2xl mx-auto my-12">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 font-serif">Acesso Restrito ao Administrador</h2>
        <p className="text-slate-400 text-sm">
          Apenas usuários administradores possuem permissão para gerenciar as fotos do Perfil Institucional e Técnico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0B1526] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-serif tracking-tight">
              Fotos do Perfil Institucional e Técnico
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie os retratos da Engª Jucélia Santana e defina a Foto Principal exibida na Seção Sobre.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewTitle('');
            setNewCategory('Perfil Profissional e Engenharia');
            setNewPose('Atuação Executiva e Consultoria');
            setNewOutfit('Engenheira Civil');
            setNewCaption('');
            setNewIsPrimary(photos.length === 0);
            setNewActive(true);
            setNewOrder(photos.length);
            setNewImageFile(null);
            setNewImagePreview(null);
            setIsCreateModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4b068] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Foto de Perfil
        </button>
      </div>

      {/* Alertas */}
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

      {/* Grid de Fotos */}
      {loading ? (
        <div className="p-12 text-center bg-[#0B1526] rounded-2xl border border-white/10">
          <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Carregando fotos do perfil institucional...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="p-12 text-center bg-[#0B1526] rounded-2xl border border-white/10 space-y-4">
          <Camera className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white font-serif">Nenhuma Foto Cadastrada</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Não há fotos de perfil cadastradas no Supabase. Adicione a primeira foto para o perfil da Engª Jucélia Santana.
          </p>
          <button
            type="button"
            onClick={() => {
              setNewOrder(0);
              setNewIsPrimary(true);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#C5A059] text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Primeira Foto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`bg-[#0B1526] rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xl ${
                photo.is_primary
                  ? 'border-[#C5A059] ring-1 ring-[#C5A059]/40 bg-[#0E1B30]'
                  : photo.active
                  ? 'border-white/10 hover:border-white/20'
                  : 'border-white/5 opacity-60 bg-[#070D18]'
              }`}
            >
              {/* Imagem do Perfil */}
              <div className="relative h-64 w-full bg-[#070D18] group overflow-hidden">
                <ManagedMedia
                  mediaKey={`institutional_photo:${photo.id}`}
                  src={photo.image_url}
                  alt={photo.title}
                  context="institutional_photo"
                  className="group-hover:scale-105 transition-transform duration-500"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1526] via-transparent to-black/40 pointer-events-none" />

                {/* Badges Principais */}
                <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 pointer-events-none">
                  {photo.is_primary && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#C5A059] text-black text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                      <Star className="w-3 h-3 fill-black" />
                      Foto Principal (Seção Sobre)
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider border ${
                      photo.active
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-500/20 border-slate-500/40 text-slate-400'
                    }`}
                  >
                    {photo.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                {/* Botões para Reordenar Rápidos */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0 || saving}
                    title="Mover para Cima"
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-[#C5A059] text-white hover:text-black border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === photos.length - 1 || saving}
                    title="Mover para Baixo"
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-[#C5A059] text-white hover:text-black border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Informações da Foto */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                      {photo.category || 'Perfil Institucional'}
                    </span>
                    <span className="text-[10px] text-slate-500">Ordem #{photo.order_index + 1}</span>
                  </div>

                  <h3 className="font-serif font-bold text-white text-base truncate" title={photo.title}>
                    {photo.title}
                  </h3>

                  {photo.pose && (
                    <p className="text-slate-300 text-xs flex items-center gap-1.5 pt-1">
                      <Award className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                      <span className="truncate">{photo.pose}</span>
                    </p>
                  )}

                  {photo.caption && (
                    <p className="text-slate-400 text-xs line-clamp-2 italic pt-1 border-t border-white/5">
                      "{photo.caption}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center">
                  <span>
                    Atualizado:{' '}
                    {photo.updated_at ? new Date(photo.updated_at).toLocaleDateString('pt-BR') : 'Data n/a'}
                  </span>
                  <span>ID: {photo.id.slice(0, 10)}</span>
                </div>
              </div>

              {/* Ações Administrativas */}
              <div className="p-3 bg-[#070D18] border-t border-white/10 grid grid-cols-6 gap-1 text-center">
                <button
                  type="button"
                  onClick={() => handleSetPrimary(photo)}
                  disabled={saving || photo.is_primary}
                  title={photo.is_primary ? 'Foto Principal Atual' : 'Definir como Foto Principal da Seção Sobre'}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    photo.is_primary
                      ? 'bg-[#C5A059] text-black border border-[#C5A059] font-bold'
                      : 'bg-white/5 hover:bg-[#C5A059]/20 text-slate-300 hover:text-[#C5A059] border border-white/10'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${photo.is_primary ? 'fill-black' : ''}`} />
                  <span className="text-[9px] uppercase">{photo.is_primary ? '1º' : 'Tornar 1º'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFramingPhoto(photo)}
                  disabled={saving}
                  title="Ajustar Enquadramento e Foco da Foto"
                  className="py-2 px-1 rounded-xl bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase">Enquadrar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleActive(photo)}
                  disabled={saving}
                  title={photo.active ? 'Desativar Foto' : 'Ativar Foto'}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    photo.active
                      ? 'bg-emerald-500/10 hover:bg-amber-500/20 text-emerald-400 hover:text-amber-400 border border-emerald-500/20'
                      : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-white/10'
                  }`}
                >
                  {photo.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[9px] uppercase">{photo.active ? 'Ativa' : 'Inativa'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPhoto(photo);
                    setEditTitle(photo.title);
                    setEditCategory(photo.category || '');
                    setEditPose(photo.pose || '');
                    setEditOutfit(photo.outfit || '');
                    setEditCaption(photo.caption || '');
                    setEditIsPrimary(photo.is_primary);
                    setEditActive(photo.active);
                    setEditOrder(photo.order_index);
                  }}
                  disabled={saving}
                  title="Editar Dados da Foto"
                  className="py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-[9px] uppercase">Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReplacingPhoto(photo);
                    setReplaceImageFile(null);
                    setReplaceImagePreview(null);
                  }}
                  disabled={saving}
                  title="Substituir Imagem do Arquivo"
                  className="py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[9px] uppercase">Imagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingPhoto(photo)}
                  disabled={saving}
                  title="Excluir Foto"
                  className="py-2 px-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase">Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: CADASTRAR NOVA FOTO DE PERFIL */}
      {/* ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1526] rounded-2xl border border-[#C5A059]/40 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#122038]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-white text-lg">Nova Foto do Perfil Institucional</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePhoto} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Upload de Imagem */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-2">
                  Arquivo de Imagem * (PNG, JPG, WEBP - Max 10MB)
                </label>
                <div
                  onClick={() => createFileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-[#C5A059] rounded-xl p-4 text-center cursor-pointer bg-[#070D18]/50 transition-all group"
                >
                  {newImagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={newImagePreview}
                        alt="Prévia Foto Perfil"
                        className="max-h-48 mx-auto rounded-lg object-cover border border-white/20"
                      />
                      <span className="text-[11px] text-[#C5A059] block font-semibold">
                        Clique para alterar a imagem selecionada
                      </span>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#C5A059] mx-auto transition-colors" />
                      <p className="text-xs font-medium text-slate-300">
                        Clique para selecionar ou arraste a foto aqui
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Proporção sugerida: Retrato vertical / Perfil (ex: 3:4 ou 800x1000px)
                      </p>
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

              {/* Título e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Título da Foto</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Retrato Institucional — Engª Jucélia"
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Ex: Perfil Profissional"
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Atuação e Vestuário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Atuação / Pose</label>
                  <input
                    type="text"
                    value={newPose}
                    onChange={(e) => setNewPose(e.target.value)}
                    placeholder="Ex: Postura consultiva executiva"
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Vestuário / Perfil</label>
                  <input
                    type="text"
                    value={newOutfit}
                    onChange={(e) => setNewOutfit(e.target.value)}
                    placeholder="Ex: Colete institucional"
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Legenda / Descrição */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Legenda / Resumo</label>
                <textarea
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  rows={2}
                  placeholder="Apresentação técnica para o perfil institucional"
                  className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Opções (Principal e Ativo) */}
              <div className="p-3 bg-[#070D18] rounded-xl border border-white/10 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={newIsPrimary}
                    onChange={(e) => setNewIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#070D18] text-[#C5A059] focus:ring-0"
                  />
                  <span>Definir como Foto Principal da Seção Sobre</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={newActive}
                    onChange={(e) => setNewActive(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#070D18] text-[#C5A059] focus:ring-0"
                  />
                  <span>Foto Ativa no Sistema</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold"
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
                      <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Salvar Foto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: EDIÇÃO DE FOTO DE PERFIL */}
      {/* ========================================== */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1526] rounded-2xl border border-white/20 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#122038]">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-white text-lg">Editar Foto de Perfil</h3>
              </div>
              <button onClick={() => setEditingPhoto(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPhoto} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Prévia da Imagem Atual */}
              <div className="relative h-40 w-full rounded-xl overflow-hidden border border-white/10 bg-[#070D18]">
                <img src={editingPhoto.image_url} alt={editingPhoto.title} className="w-full h-full object-cover object-top" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Título</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Atuação / Pose</label>
                  <input
                    type="text"
                    value={editPose}
                    onChange={(e) => setEditPose(e.target.value)}
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Legenda / Resumo</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={2}
                  className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="p-3 bg-[#070D18] rounded-xl border border-white/10 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={editIsPrimary}
                    onChange={(e) => setEditIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#070D18] text-[#C5A059] focus:ring-0"
                  />
                  <span>Foto Principal (Exibida na Seção Sobre)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#070D18] text-[#C5A059] focus:ring-0"
                  />
                  <span>Ativa</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
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
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Atualizar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: SUBSTITUIR IMAGEM */}
      {/* ========================================== */}
      {replacingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1526] rounded-2xl border border-blue-500/40 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#122038]">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif font-bold text-white text-lg">Substituir Imagem de Perfil</h3>
              </div>
              <button onClick={() => setReplacingPhoto(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReplaceImage} className="p-6 space-y-5">
              <p className="text-xs text-slate-300">
                Substituindo foto de: <strong className="text-white">{replacingPhoto.title}</strong>
              </p>

              <div
                onClick={() => replaceFileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-500/30 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer bg-[#070D18]/60 transition-all group"
              >
                {replaceImagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={replaceImagePreview}
                      alt="Nova Foto"
                      className="max-h-48 mx-auto rounded-lg object-cover border border-white/20"
                    />
                    <span className="text-[11px] text-blue-400 block font-semibold">
                      Clique para escolher outro arquivo
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="relative h-32 w-full rounded-lg overflow-hidden border border-white/10 mb-3 opacity-60">
                      <img src={replacingPhoto.image_url} alt="Atual" className="w-full h-full object-cover object-top" />
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
                A nova imagem será enviada para o Supabase Storage no bucket de perfil e substituirá com segurança a imagem atual.
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplacingPhoto(null)}
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
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirmar Substituição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ========================================== */}
      {deletingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1526] rounded-2xl border border-rose-500/40 max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-white text-lg">Excluir Foto de Perfil</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Esta foto de perfil será removida e sua imagem poderá ser eliminada do armazenamento do Supabase. Deseja
              continuar?
            </p>

            <div className="p-3 bg-[#070D18] rounded-xl border border-white/10 flex items-center gap-3">
              <img
                src={deletingPhoto.image_url}
                alt={deletingPhoto.title}
                className="w-12 h-12 object-cover rounded-lg border border-white/10"
              />
              <div className="overflow-hidden">
                <span className="font-semibold text-white text-xs block truncate">{deletingPhoto.title}</span>
                <span className="text-[10px] text-slate-400 block">{deletingPhoto.category}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingPhoto(null)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePhoto}
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
      {framingPhoto && (
        <MediaDisplayEditorModal
          isOpen={!!framingPhoto}
          onClose={() => setFramingPhoto(null)}
          mediaKey={`institutional_photo:${framingPhoto.id}`}
          mediaUrl={framingPhoto.image_url}
          mediaTitle={framingPhoto.title}
          mediaType="image"
          context="institutional_photo"
          onSaved={() => {
            showFeedback('Enquadramento e foco visual da foto atualizados com sucesso!');
          }}
        />
      )}
    </div>
  );
}
