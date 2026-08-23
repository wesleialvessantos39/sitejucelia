import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Video,
  Trash2,
  Edit3,
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Archive,
  ArrowUp,
  ArrowDown,
  Star,
  Search,
  RotateCcw,
  Layers,
  FileText,
  Play,
  Replace,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseDatabase, ProjectInsert, ProjectUpdate } from '../services/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { getAssetUrl, extractStoragePathFromUrl } from '../utils/assetUtils';
import { MediaDisplayEditorModal } from '../components/admin/MediaDisplayEditorModal';
import { ManagedMedia } from '../components/ui/ManagedMedia';

export interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryLabel: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  videoTitle?: string;
  location: string;
  year?: string;
  area?: string;
  status: string;
  servicesExecuted?: string[];
  hasVideo?: boolean;
  featured?: boolean;
  orderIndex?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectImageItem {
  id: string;
  project_id: string;
  image_url: string;
  caption?: string | null;
  order_index: number;
  created_at?: string;
}

const CATEGORY_OPTIONS = [
  { id: 'estrutural', label: 'Projeto Estrutural' },
  { id: 'laudos', label: 'Laudo Técnico' },
  { id: 'consultoria', label: 'Consultoria Especializada' },
  { id: 'execucao', label: 'Execução de Obra' },
];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export default function AdminPosts() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Tab inside Form Modal: 'data' | 'photos' | 'videos'
  const [activeModalTab, setActiveModalTab] = useState<'data' | 'photos' | 'videos'>('data');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Fields State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('estrutural');
  const [categoryLabel, setCategoryLabel] = useState('Projeto Estrutural');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Ariquemes - RO');
  const [year, setYear] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState('Concluído');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [featured, setFeatured] = useState(false);
  const [servicesInput, setServicesInput] = useState('');

  // Media State
  const [projectImages, setProjectImages] = useState<ProjectImageItem[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);

  // Replacement references
  const [imageToReplace, setImageToReplace] = useState<ProjectImageItem | null>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const replaceVideoInputRef = useRef<HTMLInputElement>(null);

  // Delete Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPhotoDeleteModalOpen, setIsPhotoDeleteModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<ProjectImageItem | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const [isVideoDeleteModalOpen, setIsVideoDeleteModalOpen] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  // Framing Modal State (Etapa 17)
  const [framingMedia, setFramingMedia] = useState<{
    key: string;
    url: string;
    title: string;
    context: 'project_thumbnail' | 'project_gallery';
  } | null>(null);

  // Status & Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadAdminProjects = async () => {
    try {
      setLoading(true);
      const data = await supabaseDatabase.getProjects(true);
      if (data) {
        const mapped: Post[] = data.map((item: any) => {
          const sortedImages = Array.isArray(item.project_images)
            ? [...item.project_images].sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            : [];
          const mainImage = item.image_url || (sortedImages.length > 0 ? sortedImages[0].image_url : '');
          return {
            id: item.id,
            title: item.title || '',
            slug: item.slug || '',
            category: item.category || 'estrutural',
            categoryLabel: item.category_label || 'Projeto Estrutural',
            description: item.description || '',
            imageUrl: mainImage ? getAssetUrl(mainImage) : '',
            videoUrl: item.video_url ? getAssetUrl(item.video_url) : '',
            videoTitle: item.video_title || '',
            location: item.location || 'Ariquemes - RO',
            year: item.year || '',
            area: item.area || '',
            status: item.status || 'Concluído',
            servicesExecuted: Array.isArray(item.services_executed) ? item.services_executed : [],
            hasVideo: item.has_video || Boolean(item.video_url),
            featured: item.featured || false,
            orderIndex: item.order_index || 0,
            deletedAt: item.deleted_at || null,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || undefined,
          };
        });
        setPosts(mapped);
      }
    } catch (err) {
      console.error('[AdminPosts] Erro ao carregar lista de obras:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectImages = async (projectId: string) => {
    try {
      const imgs = await supabaseDatabase.getProjectImages(projectId);
      if (imgs) {
        setProjectImages(imgs);
      } else {
        setProjectImages([]);
      }
    } catch (err) {
      console.error('[AdminPosts] Erro ao carregar imagens da obra:', err);
      setProjectImages([]);
    }
  };

  useEffect(() => {
    loadAdminProjects();
  }, []);

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const found = CATEGORY_OPTIONS.find((c) => c.id === catId);
    if (found) {
      setCategoryLabel(found.label);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingPost) {
      setSlug(slugify(val));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setActiveModalTab('data');
    setTitle('');
    setSlug('');
    setCategory('estrutural');
    setCategoryLabel('Projeto Estrutural');
    setDescription('');
    setLocation('Ariquemes - RO');
    setYear(new Date().getFullYear().toString());
    setArea('');
    setStatus('Concluído');
    setImageUrl('');
    setVideoUrl('');
    setVideoTitle('');
    setFeatured(false);
    setServicesInput('Cálculo Estrutural, Detalhamento Armaduras');
    setProjectImages([]);
    setPendingImageFiles([]);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: Post, initialTab: 'data' | 'photos' | 'videos' = 'data') => {
    setEditingPost(post);
    setActiveModalTab(initialTab);
    setTitle(post.title || '');
    setSlug(post.slug || slugify(post.title || ''));
    setCategory(post.category || 'estrutural');
    setCategoryLabel(post.categoryLabel || 'Projeto Estrutural');
    setDescription(post.description || '');
    setLocation(post.location || 'Ariquemes - RO');
    setYear(post.year || '');
    setArea(post.area || '');
    setStatus(post.status || 'Concluído');
    setImageUrl(post.imageUrl || '');
    setVideoUrl(post.videoUrl || '');
    setVideoTitle(post.videoTitle || '');
    setFeatured(post.featured || false);
    setServicesInput(post.servicesExecuted ? post.servicesExecuted.join(', ') : '');
    setPendingImageFiles([]);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
    loadProjectImages(post.id);
  };

  const handleOpenDeleteModal = (post: Post) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  // ==========================================
  // FOTOS MANAGEMENT
  // ==========================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!isAdmin) {
      setFormError('Acesso negado: Somente administradores ativos podem enviar fotos.');
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    const fileList = Array.from(files);

    for (const file of fileList) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        setFormError(`Formato inválido no arquivo "${file.name}". Permitido apenas JPEG, PNG e WEBP.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setFormError(`O arquivo "${file.name}" excede o tamanho máximo permitido de 15MB.`);
        return;
      }
    }

    if (editingPost) {
      try {
        setIsUploadingImage(true);
        for (const file of fileList) {
          const cleanName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
          const storagePath = `projects/${editingPost.id}/${Date.now()}_${cleanName}`;

          await supabaseStorage.uploadFile('project-images', storagePath, file);
          const publicUrl = supabaseStorage.getPublicUrl('project-images', storagePath);

          const currentMaxOrder = projectImages.length > 0
            ? Math.max(...projectImages.map((img) => img.order_index ?? 0))
            : -1;
          const newOrderIndex = currentMaxOrder + 1;

          const inserted = await supabaseDatabase.addProjectImage({
            project_id: editingPost.id,
            image_url: publicUrl,
            order_index: newOrderIndex,
          });

          if (user?.id && inserted) {
            await supabaseDatabase.logAdminAction({
              user_id: user.id,
              action: 'UPLOAD_WORK_IMAGE',
              entity_type: 'project_images',
              entity_id: inserted.id,
              details: { project_id: editingPost.id, file_name: file.name, image_url: publicUrl },
            });
          }
        }

        setFormSuccess('Foto adicionada com sucesso.');
        await loadProjectImages(editingPost.id);

        if (!imageUrl || imageUrl.includes('unsplash.com')) {
          const updated = await supabaseDatabase.getProjectImages(editingPost.id);
          if (updated && updated.length > 0) {
            const firstImg = updated[0].image_url;
            setImageUrl(firstImg);
            await supabaseDatabase.updateProject(editingPost.id, { image_url: firstImg });
          }
        }
      } catch (err: any) {
        console.error('[AdminPosts] Erro ao enviar foto:', err);
        setFormError(err?.message || 'Ocorreu um erro no upload da foto.');
      } finally {
        setIsUploadingImage(false);
        e.target.value = '';
      }
    } else {
      setPendingImageFiles((prev) => [...prev, ...fileList]);
      setFormSuccess(`${fileList.length} foto(s) preparada(s) para a nova obra.`);
      e.target.value = '';
    }
  };

  const handleTriggerReplaceImage = (img: ProjectImageItem) => {
    setImageToReplace(img);
    if (replaceImageInputRef.current) {
      replaceImageInputRef.current.click();
    }
  };

  const handleReplaceImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageToReplace || !editingPost) return;

    if (!isAdmin) {
      setFormError('Acesso negado: Somente administradores ativos podem substituir fotos.');
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      setFormError(`Formato inválido no arquivo "${file.name}". Permitido apenas JPEG, PNG e WEBP.`);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFormError(`O arquivo "${file.name}" excede o tamanho máximo de 15MB.`);
      return;
    }

    const oldUrl = imageToReplace.image_url;

    try {
      setIsUploadingImage(true);
      const cleanName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      const newStoragePath = `projects/${editingPost.id}/${Date.now()}_replace_${cleanName}`;

      // Step 1: Upload new file
      await supabaseStorage.uploadFile('project-images', newStoragePath, file);
      const newPublicUrl = supabaseStorage.getPublicUrl('project-images', newStoragePath);

      // Step 2: Update reference in DB
      await supabaseDatabase.updateProjectImage(imageToReplace.id, {
        image_url: newPublicUrl,
      });

      // Step 3: If replaced image was the main cover image, update project cover as well
      if (imageUrl === oldUrl) {
        setImageUrl(newPublicUrl);
        await supabaseDatabase.updateProject(editingPost.id, { image_url: newPublicUrl });
      }

      // Step 4: Delete old file from Storage ONLY AFTER new upload succeeds
      const oldStoragePath = extractStoragePathFromUrl(oldUrl, 'project-images');
      if (oldStoragePath) {
        try {
          await supabaseStorage.deleteFile('project-images', [oldStoragePath]);
        } catch (delErr) {
          console.warn('[AdminPosts] Aviso ao remover imagem antiga do storage:', delErr);
        }
      }

      // Step 5: Log audit
      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'UPDATE_WORK_IMAGE',
          entity_type: 'project_images',
          entity_id: imageToReplace.id,
          details: { project_id: editingPost.id, old_url: oldUrl, new_url: newPublicUrl },
        });
      }

      setFormSuccess('Foto substituída com sucesso.');
      await loadProjectImages(editingPost.id);
      await loadAdminProjects();
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao substituir foto:', err);
      setFormError(err?.message || 'Falha ao substituir foto da obra.');
    } finally {
      setIsUploadingImage(false);
      setImageToReplace(null);
      e.target.value = '';
    }
  };

  const handleOpenPhotoDeleteModal = (img: ProjectImageItem) => {
    setPhotoToDelete(img);
    setIsPhotoDeleteModalOpen(true);
  };

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete || !editingPost) return;

    if (!isAdmin) {
      setFormError('Acesso negado: Somente administradores ativos podem remover fotos.');
      return;
    }

    try {
      setIsDeletingPhoto(true);

      // 1. Delete database reference
      await supabaseDatabase.deleteProjectImage(photoToDelete.id);

      // 2. Delete file from Storage
      const storagePath = extractStoragePathFromUrl(photoToDelete.image_url, 'project-images');
      if (storagePath) {
        try {
          await supabaseStorage.deleteFile('project-images', [storagePath]);
        } catch (stErr) {
          console.warn('[AdminPosts] Aviso ao apagar arquivo do storage:', stErr);
        }
      }

      // 3. Update main cover image if deleted photo was the main cover
      if (imageUrl === photoToDelete.image_url) {
        const remaining = projectImages.filter((p) => p.id !== photoToDelete.id);
        const nextCover = remaining.length > 0 ? remaining[0].image_url : '';
        setImageUrl(nextCover);
        await supabaseDatabase.updateProject(editingPost.id, { image_url: nextCover });
      }

      // 4. Log audit
      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'DELETE_WORK_IMAGE',
          entity_type: 'project_images',
          entity_id: photoToDelete.id,
          details: { project_id: editingPost.id, image_url: photoToDelete.image_url },
        });
      }

      setFormSuccess('Foto removida com sucesso.');
      setIsPhotoDeleteModalOpen(false);
      setPhotoToDelete(null);
      await loadProjectImages(editingPost.id);
      await loadAdminProjects();
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao excluir foto:', err);
      setFormError(err?.message || 'Erro ao remover foto do banco de dados.');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleSetMainImage = async (imgUrl: string) => {
    if (!isAdmin || !editingPost) return;

    try {
      setImageUrl(imgUrl);
      await supabaseDatabase.updateProject(editingPost.id, { image_url: imgUrl });

      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'SET_MAIN_WORK_IMAGE',
          entity_type: 'projects',
          entity_id: editingPost.id,
          details: { main_image_url: imgUrl },
        });
      }

      setFormSuccess('Foto principal definida com sucesso.');
      await loadAdminProjects();
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao definir foto principal:', err);
      setFormError('Erro ao definir foto principal da obra.');
    }
  };

  const handleMoveImageOrder = async (index: number, direction: 'up' | 'down') => {
    if (index < 0 || index >= projectImages.length) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projectImages.length) return;

    const currentImg = projectImages[index];
    const targetImg = projectImages[targetIndex];

    try {
      await supabaseDatabase.updateProjectImageOrder(currentImg.id, targetImg.order_index);
      await supabaseDatabase.updateProjectImageOrder(targetImg.id, currentImg.order_index);

      if (user?.id && editingPost) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'REORDER_WORK_MEDIA',
          entity_type: 'project_images',
          entity_id: currentImg.id,
          details: { project_id: editingPost.id, from: index, to: targetIndex },
        });
      }

      if (editingPost) {
        await loadProjectImages(editingPost.id);
      }
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao reordenar foto:', err);
      setFormError('Falha ao atualizar a ordem da foto.');
    }
  };

  // ==========================================
  // VÍDEOS MANAGEMENT
  // ==========================================
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      setFormError('Acesso negado: Somente administradores ativos podem enviar vídeos.');
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    if (!ALLOWED_VIDEO_TYPES.includes(file.type.toLowerCase())) {
      setFormError(`Formato de vídeo inválido para "${file.name}". Permitido apenas MP4 e WEBM.`);
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setFormError(`O vídeo "${file.name}" excede o tamanho máximo permitido de 50MB.`);
      return;
    }

    const isReplacing = Boolean(videoUrl);
    const oldVideoUrl = videoUrl;

    try {
      setIsUploadingVideo(true);
      const cleanName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      const storagePath = `projects/${editingPost?.id || 'new'}/${Date.now()}_${cleanName}`;

      // Upload new video
      await supabaseStorage.uploadFile('project-videos', storagePath, file);
      const publicUrl = supabaseStorage.getPublicUrl('project-videos', storagePath);

      setVideoUrl(publicUrl);

      // If editing existing project, update project immediately
      if (editingPost) {
        await supabaseDatabase.updateProject(editingPost.id, {
          video_url: publicUrl,
          has_video: true,
        });

        // Delete old video file if replacing
        if (isReplacing && oldVideoUrl) {
          const oldStoragePath = extractStoragePathFromUrl(oldVideoUrl, 'project-videos');
          if (oldStoragePath) {
            try {
              await supabaseStorage.deleteFile('project-videos', [oldStoragePath]);
            } catch (vErr) {
              console.warn('[AdminPosts] Aviso ao remover vídeo antigo do storage:', vErr);
            }
          }
        }
      }

      const successMsg = isReplacing ? 'Vídeo substituído com sucesso.' : 'Vídeo adicionado com sucesso.';
      setFormSuccess(successMsg);

      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: isReplacing ? 'UPDATE_WORK_VIDEO' : 'UPLOAD_WORK_VIDEO',
          entity_type: 'projects',
          entity_id: editingPost?.id || 'new_project',
          details: { video_url: publicUrl, file_name: file.name, replaced_old: isReplacing },
        });
      }

      await loadAdminProjects();
    } catch (err: any) {
      console.error('[AdminPosts] Erro no upload de vídeo:', err);
      setFormError(err?.message || 'Ocorreu um erro ao enviar o vídeo.');
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleOpenVideoDeleteModal = () => {
    setIsVideoDeleteModalOpen(true);
  };

  const handleConfirmDeleteVideo = async () => {
    if (!isAdmin) return;

    try {
      setIsDeletingVideo(true);
      const previousVideo = videoUrl;

      // 1. Delete file from Storage if path exists
      if (previousVideo) {
        const storagePath = extractStoragePathFromUrl(previousVideo, 'project-videos');
        if (storagePath) {
          try {
            await supabaseStorage.deleteFile('project-videos', [storagePath]);
          } catch (stErr) {
            console.warn('[AdminPosts] Aviso ao apagar arquivo de vídeo do storage:', stErr);
          }
        }
      }

      // 2. Clear state and update database
      setVideoUrl('');
      setVideoTitle('');

      if (editingPost) {
        await supabaseDatabase.updateProject(editingPost.id, {
          video_url: null,
          video_title: null,
          has_video: false,
        });
      }

      setFormSuccess('Vídeo removido com sucesso.');

      // 3. Log audit
      if (user?.id && previousVideo) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'DELETE_WORK_VIDEO',
          entity_type: 'projects',
          entity_id: editingPost?.id || 'new_project',
          details: { previous_video_url: previousVideo },
        });
      }

      setIsVideoDeleteModalOpen(false);
      await loadAdminProjects();
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao remover vídeo:', err);
      setFormError('Erro ao remover vídeo.');
    } finally {
      setIsDeletingVideo(false);
    }
  };

  // ==========================================
  // OBRAS FORM SUBMISSION & DELETION
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!isAdmin) {
      setFormError('Acesso negado: Somente administradores ativos possuem permissão para esta operação.');
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('O título da obra é obrigatório.');
      return;
    }

    const cleanSlug = slug.trim() || slugify(cleanTitle);
    if (!cleanSlug) {
      setFormError('O slug da obra é obrigatório.');
      return;
    }

    const cleanDescription = description.trim();
    if (!cleanDescription) {
      setFormError('A descrição da obra é obrigatória.');
      return;
    }

    const cleanLocation = location.trim() || 'Ariquemes - RO';
    const fallbackImage =
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80';
    const cleanImageUrl = imageUrl.trim() || fallbackImage;

    const parsedServices = servicesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      setIsSaving(true);

      if (editingPost) {
        // Update Work
        const updates: ProjectUpdate = {
          title: cleanTitle,
          slug: cleanSlug,
          category,
          category_label: categoryLabel,
          description: cleanDescription,
          location: cleanLocation,
          year: year.trim() || null,
          area: area.trim() || null,
          status: status || 'Concluído',
          image_url: cleanImageUrl,
          video_url: videoUrl.trim() || null,
          video_title: videoTitle.trim() || null,
          has_video: Boolean(videoUrl.trim()),
          featured,
          services_executed: parsedServices,
          updated_by: user?.id || null,
        };

        await supabaseDatabase.updateProject(editingPost.id, updates);

        if (user?.id) {
          await supabaseDatabase.logAdminAction({
            user_id: user.id,
            action: 'UPDATE_WORK',
            entity_type: 'projects',
            entity_id: editingPost.id,
            details: { title: cleanTitle, slug: cleanSlug },
          });
        }

        setFormSuccess('Obra atualizada com sucesso.');
      } else {
        // Create Work
        const newProject: ProjectInsert = {
          title: cleanTitle,
          slug: cleanSlug,
          category,
          category_label: categoryLabel,
          description: cleanDescription,
          location: cleanLocation,
          year: year.trim() || null,
          area: area.trim() || null,
          status: status || 'Concluído',
          image_url: cleanImageUrl,
          video_url: videoUrl.trim() || null,
          video_title: videoTitle.trim() || null,
          has_video: Boolean(videoUrl.trim()),
          featured,
          services_executed: parsedServices,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        };

        const created = await supabaseDatabase.createProject(newProject);

        if (created) {
          // Process pending images
          if (pendingImageFiles.length > 0) {
            for (let i = 0; i < pendingImageFiles.length; i++) {
              const file = pendingImageFiles[i];
              const cleanName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
              const storagePath = `projects/${created.id}/${Date.now()}_${cleanName}`;

              await supabaseStorage.uploadFile('project-images', storagePath, file);
              const publicUrl = supabaseStorage.getPublicUrl('project-images', storagePath);

              const inserted = await supabaseDatabase.addProjectImage({
                project_id: created.id,
                image_url: publicUrl,
                order_index: i,
              });

              if (user?.id && inserted) {
                await supabaseDatabase.logAdminAction({
                  user_id: user.id,
                  action: 'UPLOAD_WORK_IMAGE',
                  entity_type: 'project_images',
                  entity_id: inserted.id,
                  details: { project_id: created.id, file_name: file.name, image_url: publicUrl },
                });
              }
            }
            setPendingImageFiles([]);
          }

          if (user?.id) {
            await supabaseDatabase.logAdminAction({
              user_id: user.id,
              action: 'CREATE_WORK',
              entity_type: 'projects',
              entity_id: created.id,
              details: { title: cleanTitle, slug: cleanSlug },
            });
          }
        }

        setFormSuccess('Obra cadastrada com sucesso.');
      }

      await loadAdminProjects();

      setTimeout(() => {
        setIsModalOpen(false);
      }, 800);
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao salvar obra:', err);
      if (err?.code === '23505' || err?.message?.includes('duplicate key') || err?.message?.includes('slug')) {
        setFormError('Já existe uma obra cadastrada com este mesmo Slug. Por favor, ajuste o Slug.');
      } else {
        setFormError(err?.message || 'Ocorreu um erro ao salvar o registro no banco de dados.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!postToDelete) return;
    if (!isAdmin) {
      alert('Acesso negado: Somente administradores ativos possuem permissão para excluir obras.');
      return;
    }

    try {
      setIsDeleting(true);

      // 1. Fetch all project images to clean up storage
      const images = await supabaseDatabase.getProjectImages(postToDelete.id);
      if (images && images.length > 0) {
        for (const img of images) {
          const path = extractStoragePathFromUrl(img.image_url, 'project-images');
          if (path) {
            try {
              await supabaseStorage.deleteFile('project-images', [path]);
            } catch (errImg) {
              console.warn('[AdminPosts] Falha ao excluir arquivo de imagem no Storage:', errImg);
            }
          }
          await supabaseDatabase.deleteProjectImage(img.id);
        }
      }

      // 2. Clean up video storage file if present
      if (postToDelete.videoUrl) {
        const videoPath = extractStoragePathFromUrl(postToDelete.videoUrl, 'project-videos');
        if (videoPath) {
          try {
            await supabaseStorage.deleteFile('project-videos', [videoPath]);
          } catch (errVid) {
            console.warn('[AdminPosts] Falha ao excluir vídeo no Storage:', errVid);
          }
        }
      }

      // 3. Delete work from database (permanent or soft-delete with media cleanup)
      await supabaseDatabase.deleteProjectPermanent(postToDelete.id);

      // 4. Log audit
      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'DELETE_WORK',
          entity_type: 'projects',
          entity_id: postToDelete.id,
          details: { title: postToDelete.title },
        });
      }

      setFormSuccess('Obra removida com sucesso.');
      await loadAdminProjects();
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao excluir obra:', err);
      alert('Erro ao excluir a obra: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreProject = async (post: Post) => {
    if (!isAdmin) {
      alert('Acesso negado: Somente administradores ativos possuem permissão para restaurar obras.');
      return;
    }

    try {
      await supabaseDatabase.restoreProject(post.id);

      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'UPDATE_WORK',
          entity_type: 'projects',
          entity_id: post.id,
          details: { title: post.title, restored: true },
        });
      }

      await loadAdminProjects();
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao restaurar obra:', err);
      alert('Erro ao restaurar a obra: ' + (err?.message || 'Tente novamente.'));
    }
  };

  const handleToggleFeatured = async (post: Post) => {
    if (!isAdmin) {
      alert('Acesso negado: Somente administradores ativos podem alterar o destaque.');
      return;
    }

    try {
      const newFeatured = !post.featured;
      await supabaseDatabase.updateProject(post.id, { featured: newFeatured });

      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'UPDATE_WORK',
          entity_type: 'projects',
          entity_id: post.id,
          details: { title: post.title, featured: newFeatured },
        });
      }

      await loadAdminProjects();
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao alterar destaque:', err);
      alert('Erro ao atualizar o destaque: ' + (err?.message || 'Tente novamente.'));
    }
  };

  const filteredPosts = posts.filter((post) => {
    const isDeleted = Boolean(post.deletedAt);
    if (statusFilter === 'active' && isDeleted) return false;
    if (statusFilter === 'deleted' && !isDeleted) return false;

    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchesTitle = post.title.toLowerCase().includes(term);
      const matchesSlug = post.slug.toLowerCase().includes(term);
      const matchesCategory =
        post.category.toLowerCase().includes(term) || post.categoryLabel.toLowerCase().includes(term);
      const matchesLocation = post.location.toLowerCase().includes(term);

      if (!matchesTitle && !matchesSlug && !matchesCategory && !matchesLocation) {
        return false;
      }
    }

    return true;
  });

  const handleMovePostOrder = async (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    if (index < 0 || index >= filteredPosts.length) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredPosts.length) return;

    const currentPost = filteredPosts[index];
    const targetPost = filteredPosts[targetIndex];

    const currentOrder = currentPost.orderIndex ?? index;
    const targetOrder = targetPost.orderIndex ?? targetIndex;

    const newCurrentOrder = targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder;
    const newTargetOrder = currentOrder;

    try {
      await supabaseDatabase.updateProject(currentPost.id, { order_index: newCurrentOrder });
      await supabaseDatabase.updateProject(targetPost.id, { order_index: newTargetOrder });

      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          action: 'REORDER_WORK_MEDIA',
          entity_type: 'projects',
          entity_id: currentPost.id,
          details: { title: currentPost.title, new_order: newCurrentOrder },
        });
      }

      await loadAdminProjects();
    } catch (err: any) {
      console.error('[AdminPosts] Erro ao reordenar obras:', err);
      alert('Erro ao reordenar as obras: ' + (err?.message || 'Tente novamente.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs for replace actions */}
      <input
        type="file"
        ref={replaceImageInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleReplaceImageSelected}
        className="hidden"
      />
      <input
        type="file"
        ref={replaceVideoInputRef}
        accept="video/mp4,video/webm"
        onChange={handleVideoFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1526] border border-white/10 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Gerenciamento Completo de Obras</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Cadastre, edite, organize fotos e vídeos e gerencie todas as obras do portfólio oficial.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAdminProjects}
            disabled={loading}
            className="p-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C5A059]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#b08d48] text-[#070D18] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" /> Nova Obra
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-[#0B1526] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar título, slug, categoria, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#122038] p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#C5A059] text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'active' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ativos ({posts.filter((p) => !p.deletedAt).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('deleted')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'deleted' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Removidos ({posts.filter((p) => Boolean(p.deletedAt)).length})
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white text-xs focus:outline-none focus:border-[#C5A059] cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Obras */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
            Carregando lista de obras do banco de dados...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400 text-sm">
              {posts.length === 0
                ? 'Nenhuma obra encontrada no banco de dados.'
                : 'Nenhum projeto encontrado com os filtros e busca aplicados.'}
            </p>
            {posts.length === 0 && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="text-[#C5A059] font-medium text-xs hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                + Clique aqui para cadastrar a primeira obra
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Imagem Principal</th>
                  <th className="p-4">Obra / Título</th>
                  <th className="p-4">Tipo / Categoria</th>
                  <th className="p-4 text-center">Destaque</th>
                  <th className="p-4 text-center">Ordem</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Criação / Atualização</th>
                  <th className="p-4 text-right">Ações Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredPosts.map((post, idx) => {
                  const isDeleted = Boolean(post.deletedAt);
                  return (
                    <tr
                      key={post.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isDeleted ? 'opacity-60 bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="p-4 w-28">
                        <div className="w-20 h-14 bg-black/50 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center relative">
                          {post.imageUrl ? (
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-600" />
                          )}
                          {post.hasVideo && (
                            <span className="absolute bottom-1 right-1 bg-sky-500 text-white p-0.5 rounded shadow">
                              <Video className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-white truncate">{post.title}</div>
                        <div className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                          /{post.slug}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-300 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-medium">
                          {post.categoryLabel}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(post)}
                          title={post.featured ? 'Remover de Destaque' : 'Marcar como Destaque'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            post.featured
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-white/5 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${post.featured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMovePostOrder(idx, 'up')}
                            disabled={idx === 0}
                            title="Mover para cima"
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs text-slate-400 font-mono w-5 text-center">
                            {post.orderIndex ?? idx}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMovePostOrder(idx, 'down')}
                            disabled={idx === filteredPosts.length - 1}
                            title="Mover para baixo"
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-xs whitespace-nowrap">
                        {isDeleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <Archive className="w-3 h-3" /> Arquivado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <CheckCircle className="w-3 h-3" /> Publicado
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(post, 'data')}
                          title="Editar Obra"
                          className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition-colors text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(post, 'photos')}
                          title="Gerenciar Mídias da Obra"
                          className="px-2.5 py-1.5 rounded-lg bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 border border-[#C5A059]/30 transition-colors text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" /> Gerenciar Mídias
                        </button>
                        {isDeleted ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreProject(post)}
                            title="Restaurar Obra"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(post)}
                            title="Excluir Obra e Mídias"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Principal de Criação / Edição / Gerenciamento de Mídias */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1526] border border-white/20 rounded-2xl max-w-4xl w-full p-6 space-y-5 relative shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho do Modal & Navegação por Abas */}
            <div className="space-y-3 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white font-serif">
                {editingPost ? `Editar Obra: ${editingPost.title}` : 'Nova Obra'}
              </h2>

              {/* Abas do Modal */}
              <div className="flex items-center gap-2 bg-[#122038] p-1.5 rounded-xl border border-white/10 text-xs w-fit">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('data')}
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeModalTab === 'data'
                      ? 'bg-[#C5A059] text-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Dados da Obra
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('photos')}
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeModalTab === 'photos'
                      ? 'bg-[#C5A059] text-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" /> Fotos da Obra ({projectImages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('videos')}
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeModalTab === 'videos'
                      ? 'bg-[#C5A059] text-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Video className="w-4 h-4" /> Vídeos da Obra ({videoUrl ? 1 : 0})
                </button>
              </div>
            </div>

            {/* Notificações de Erro e Sucesso no Modal */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* CONTEÚDO DAS ABAS */}
            {activeModalTab === 'data' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Título da Obra *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Galpão Industrial 1.200m² - Ariquemes RO"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Slug / URL Amigável *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: galpao-industrial-ariquemes"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] text-sm font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tipo / Categoria *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white focus:outline-none focus:border-[#C5A059] text-sm cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0B1526]">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Localização
                    </label>
                    <input
                      type="text"
                      placeholder="Ariquemes - RO"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Descrição Detalhada da Obra *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Descreva os detalhes estruturais, materiais utilizados e metodologias executivas..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Ano</label>
                    <input
                      type="text"
                      placeholder="2025"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Área / Tamanho</label>
                    <input
                      type="text"
                      placeholder="Ex: 1.200 m²"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                    <input
                      type="text"
                      placeholder="Concluído / Em Andamento"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Serviços Executados (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="Cálculo Estrutural, Projeto de Armações, Detalhamento"
                    value={servicesInput}
                    onChange={(e) => setServicesInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#122038] text-[#C5A059] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="featured" className="text-xs font-medium text-slate-300 cursor-pointer">
                    Exibir como destaque na página principal do site
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploadingImage || isUploadingVideo}
                    className="px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#b08d48] text-[#070D18] font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />{' '}
                        {editingPost ? 'Salvar Alterações' : 'Cadastrar Obra'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ABA DE GERENCIAMENTO DE FOTOS */}
            {activeModalTab === 'photos' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between bg-[#122038] p-4 rounded-xl border border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#C5A059]" /> Fotos Vinculadas à Obra
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Formats: JPEG, PNG, WEBP (Até 15MB cada). Armazenamento no Supabase Storage.
                    </p>
                  </div>
                  <label className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08d48] text-[#070D18] text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md">
                    {isUploadingImage ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Adicionar Foto
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Grid de Fotos Existentes */}
                {projectImages.length === 0 ? (
                  <div className="p-8 text-center bg-[#122038]/50 border border-dashed border-white/10 rounded-xl space-y-2">
                    <p className="text-xs text-slate-400">Nenhuma foto adicionada a esta obra ainda.</p>
                    <p className="text-[11px] text-slate-500">Clique em "+ Adicionar Foto" acima para enviar arquivos para o Supabase Storage.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {projectImages.map((img, idx) => {
                      const isMain = imageUrl === img.image_url;
                      return (
                        <div
                          key={img.id}
                          className={`relative rounded-xl overflow-hidden border bg-[#070D18] flex flex-col justify-between shadow-lg transition-all ${
                            isMain ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30' : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="relative aspect-video bg-black/60 overflow-hidden group">
                            <ManagedMedia
                              mediaKey={`project:${editingPost?.id || 'draft'}:gallery_${idx}`}
                              src={img.image_url}
                              alt={`Foto da obra ${idx + 1}`}
                              context="project_gallery"
                              containerClassName="w-full h-full"
                            />
                            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold pointer-events-none">
                              #{idx + 1}
                            </div>
                            {isMain && (
                              <div className="absolute top-2 right-2 bg-[#C5A059] text-black text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow pointer-events-none">
                                <Star className="w-3 h-3 fill-black" /> Imagem Principal
                              </div>
                            )}
                          </div>

                          {/* Ações de Controle de Foto */}
                          <div className="p-2.5 bg-[#0B1526] border-t border-white/10 flex items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-1">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImageOrder(idx, 'up')}
                                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                                  title="Mover para cima"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {idx < projectImages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImageOrder(idx, 'down')}
                                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                                  title="Mover para baixo"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setFramingMedia({
                                    key: `project:${editingPost?.id || 'draft'}:gallery_${idx}`,
                                    url: img.image_url,
                                    title: `Foto #${idx + 1} - ${title || 'Obra'}`,
                                    context: 'project_gallery',
                                  })
                                }
                                className="p-1.5 rounded bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 cursor-pointer transition-colors"
                                title="Ajustar Enquadramento e Foco"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                              {!isMain && (
                                <button
                                  type="button"
                                  onClick={() => handleSetMainImage(img.image_url)}
                                  className="px-2 py-1 rounded bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059] hover:text-black font-semibold text-[11px] cursor-pointer transition-colors"
                                  title="Definir como Foto Principal"
                                >
                                  Definir Principal
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleTriggerReplaceImage(img)}
                                className="p-1.5 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 cursor-pointer transition-colors"
                                title="Substituir Foto"
                              >
                                <Replace className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenPhotoDeleteModal(img)}
                                className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
                                title="Excluir Foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ABA DE GERENCIAMENTO DE VÍDEOS */}
            {activeModalTab === 'videos' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between bg-[#122038] p-4 rounded-xl border border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-sky-400" /> Vídeo da Obra
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Upload direto de arquivos MP4/WEBM (até 50MB) ou especificação de link externo.
                    </p>
                  </div>
                  <label className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md">
                    {isUploadingVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Enviando Vídeo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {videoUrl ? 'Substituir Vídeo (50MB)' : 'Adicionar Vídeo (50MB)'}
                      </>
                    )}
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleVideoFileUpload}
                      disabled={isUploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">URL do Vídeo</label>
                    <input
                      type="text"
                      placeholder="https://...mp4 ou link de incorporação"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Título do Vídeo (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Tour Virtual da Estrutura Metálica"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {videoUrl ? (
                  <div className="bg-[#070D18] border border-sky-500/30 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-400 flex items-center gap-2">
                        <Play className="w-4 h-4 fill-sky-400" /> Vídeo Atualmente Vinculado
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenVideoDeleteModal}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold cursor-pointer transition-colors"
                      >
                        Excluir Vídeo
                      </button>
                    </div>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                      <video
                        src={getAssetUrl(videoUrl)}
                        controls
                        className="w-full h-full object-contain"
                      >
                        Seu navegador não suporta a exibição direta deste vídeo.
                      </video>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#122038]/50 border border-dashed border-white/10 rounded-xl space-y-2">
                    <p className="text-xs text-slate-400">Nenhum vídeo vinculado a esta obra no momento.</p>
                    <p className="text-[11px] text-slate-500">
                      Você pode enviar um arquivo MP4/WEBM ou informar uma URL direta para que o vídeo seja exibido na galeria pública.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão da Obra */}
      {isDeleteModalOpen && postToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white font-serif">
                Confirmar Exclusão de Obra
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Esta obra e todas as mídias vinculadas (fotos e vídeos) serão removidas do banco de dados e do armazenamento. Deseja continuar com a exclusão de <strong className="text-white">"{postToDelete.title}"</strong>?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirmar Exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Foto */}
      {isPhotoDeleteModalOpen && photoToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white font-serif">
                Confirmar Exclusão de Foto
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Esta foto será removida da obra e do armazenamento. Deseja continuar?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPhotoDeleteModalOpen(false);
                  setPhotoToDelete(null);
                }}
                disabled={isDeletingPhoto}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePhoto}
                disabled={isDeletingPhoto}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isDeletingPhoto ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirmar Exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Vídeo */}
      {isVideoDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white font-serif">
                Confirmar Exclusão de Vídeo
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Este vídeo será removido da obra e do armazenamento. Deseja continuar?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsVideoDeleteModalOpen(false)}
                disabled={isDeletingVideo}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVideo}
                disabled={isDeletingVideo}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isDeletingVideo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirmar Exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 6: ENQUADRAMENTO UNIVERSAL DE MÍDIA */}
      {/* ========================================== */}
      {framingMedia && (
        <MediaDisplayEditorModal
          isOpen={!!framingMedia}
          onClose={() => setFramingMedia(null)}
          mediaKey={framingMedia.key}
          mediaUrl={framingMedia.url}
          mediaTitle={framingMedia.title}
          mediaType="image"
          context={framingMedia.context}
          onSaved={() => {
            setFormSuccess('Enquadramento e foco visual da foto atualizados com sucesso!');
            setTimeout(() => setFormSuccess(null), 4000);
          }}
        />
      )}
    </div>
  );
}
