// /src/pages/AdminDocuments.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  Star,
  RefreshCw,
  X,
  FileSpreadsheet,
  FileCheck,
  FileCode2,
  FilePlus,
  Layers,
  ArrowUp,
  ArrowDown,
  Globe,
  Lock,
  ExternalLink,
  Tag,
  Calendar,
  HardDrive,
  FileUp,
  Info
} from 'lucide-react';
import { TechnicalDocument, DocumentCategory, DocumentType } from '../types/documents';
import { supabaseDatabase, TechnicalDocumentRow } from '../services/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const CATEGORIES: DocumentCategory[] = [
  'Laudos Técnicos',
  'Artigos Técnicos',
  'Memorial Descritivo',
  'Relatórios',
  'Materiais Educativos',
  'Normas e Referências',
  'Engenharia Civil',
  'Segurança e Prevenção',
  'Outros'
];

const DOCUMENT_TYPES: DocumentType[] = [
  'PDF',
  'Documento Técnico',
  'Artigo',
  'Relatório',
  'Memorial',
  'Guia',
  'Planilha',
  'Apresentação',
  'Outro'
];

export default function AdminDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<TechnicalDocumentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isReplaceFileOpen, setIsReplaceFileOpen] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Estados de Edição e Seleção
  const [editingDoc, setEditingDoc] = useState<TechnicalDocumentRow | null>(null);
  const [selectedForReplace, setSelectedForReplace] = useState<TechnicalDocumentRow | null>(null);
  const [previewDoc, setPreviewDoc] = useState<TechnicalDocumentRow | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<TechnicalDocumentRow | null>(null);

  // Campos do Formulário
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0]);
  const [description, setDescription] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados do Modal de Substituição de Arquivo
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState<boolean>(false);

  // Status de Ações
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Carregar documentos do Supabase
  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await supabaseDatabase.getTechnicalDocuments({
        onlyPublished: false,
        includeSoftDeleted: false
      });
      setDocuments(data || []);
    } catch (err) {
      console.error('Erro ao carregar documentos técnicos:', err);
      showFeedback('error', 'Falha ao carregar documentos técnicos do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Formatador de tamanho de arquivo
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Gerador de slug amigável
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!editingDoc) {
      setSlug(generateSlug(val));
    }
  };

  // Abrir Modal de Novo Documento
  const handleOpenNewModal = () => {
    setEditingDoc(null);
    setTitle('');
    setSlug('');
    setCategory(CATEGORIES[0]);
    setDocumentType(DOCUMENT_TYPES[0]);
    setDescription('');
    setIsPublished(true);
    setIsFeatured(false);
    setSelectedFile(null);
    setSlugError(null);
    setIsFormOpen(true);
  };

  // Abrir Modal de Edição de Metadados
  const handleOpenEditModal = (doc: TechnicalDocumentRow) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setSlug(doc.slug);
    setCategory(doc.category || CATEGORIES[0]);
    setDocumentType(doc.document_type || DOCUMENT_TYPES[0]);
    setDescription(doc.description || '');
    setIsPublished(doc.is_published);
    setIsFeatured(doc.is_featured);
    setSelectedFile(null);
    setSlugError(null);
    setIsFormOpen(true);
  };

  // Abrir Modal de Substituição de Arquivo
  const handleOpenReplaceModal = (doc: TechnicalDocumentRow) => {
    setSelectedForReplace(doc);
    setReplacementFile(null);
    setIsReplaceFileOpen(true);
  };

  // Validação de arquivo (MIME / Extensão)
  const validateFile = (file: File): boolean => {
    const blockedExtensions = ['exe', 'bat', 'cmd', 'sh', 'js', 'html', 'php', 'vbs', 'msi'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (blockedExtensions.includes(ext)) {
      showFeedback('error', `O arquivo .${ext} é executável ou potencialmente inseguro e não pode ser enviado.`);
      return false;
    }

    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      showFeedback('error', 'O arquivo excede o limite máximo permitido de 25MB.');
      return false;
    }

    return true;
  };

  // Submissão do Formulário Principal (Criação / Edição)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showFeedback('error', 'O título do documento é obrigatório.');
      return;
    }

    const cleanSlug = generateSlug(slug || title);
    if (!cleanSlug) {
      showFeedback('error', 'O identificador (slug) é inválido.');
      return;
    }

    // Se estiver criando e não selecionou arquivo
    if (!editingDoc && !selectedFile) {
      showFeedback('error', 'Por favor, selecione o arquivo do documento para upload.');
      return;
    }

    setSaving(true);
    setSlugError(null);

    try {
      if (editingDoc) {
        // Atualização de Metadados
        let fileUploadData = null;
        if (selectedFile) {
          if (!validateFile(selectedFile)) {
            setSaving(false);
            return;
          }
          fileUploadData = await supabaseStorage.uploadTechnicalDocument(selectedFile, cleanSlug);
        }

        const updates: any = {
          title: title.trim(),
          slug: cleanSlug,
          category,
          document_type: documentType,
          description: description.trim(),
          is_published: isPublished,
          is_featured: isFeatured,
        };

        if (fileUploadData) {
          updates.file_name = fileUploadData.fileName;
          updates.file_path = fileUploadData.path;
          updates.file_url = fileUploadData.publicUrl;
          updates.mime_type = fileUploadData.mimeType;
          updates.file_size = fileUploadData.fileSize;
        }

        await supabaseDatabase.updateTechnicalDocument(editingDoc.id, updates, user?.id);

        // Se trocou de arquivo com sucesso, remove o anterior se for diferente
        if (fileUploadData && editingDoc.file_path && editingDoc.file_path !== fileUploadData.path) {
          await supabaseStorage.deleteTechnicalDocument(editingDoc.file_path);
        }

        showFeedback('success', 'Documento técnico atualizado com sucesso!');
      } else {
        // Criação de Novo Documento
        if (!selectedFile) return;
        if (!validateFile(selectedFile)) {
          setSaving(false);
          return;
        }

        const uploadResult = await supabaseStorage.uploadTechnicalDocument(selectedFile, cleanSlug);

        await supabaseDatabase.createTechnicalDocument(
          {
            title: title.trim(),
            slug: cleanSlug,
            description: description.trim(),
            category,
            document_type: documentType,
            file_name: uploadResult.fileName,
            file_path: uploadResult.path,
            file_url: uploadResult.publicUrl,
            mime_type: uploadResult.mimeType,
            file_size: uploadResult.fileSize,
            thumbnail_url: null,
            is_published: isPublished,
            is_featured: isFeatured,
            order_index: documents.length,
            downloads_count: 0,
          },
          user?.id
        );

        showFeedback('success', 'Documento técnico cadastrado e publicado com sucesso!');
      }

      setIsFormOpen(false);
      await loadDocuments();
    } catch (err: any) {
      console.error('Erro ao salvar documento técnico:', err);
      if (err?.code === '23505' || err?.message?.includes('duplicate key') || err?.message?.includes('slug')) {
        setSlugError('Já existe um documento com este slug/identificador. Escolha um nome diferente.');
        showFeedback('error', 'O slug informado já está em uso.');
      } else {
        showFeedback('error', err?.message || 'Falha ao gravar documento no sistema.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Executar Substituição de Arquivo
  const handleExecuteFileReplacement = async () => {
    if (!selectedForReplace || !replacementFile) {
      showFeedback('error', 'Selecione um novo arquivo para realizar a substituição.');
      return;
    }

    if (!validateFile(replacementFile)) return;

    setReplacing(true);
    try {
      const oldFilePath = selectedForReplace.file_path;

      // 1. Faz upload do novo arquivo primeiro (garantia de integridade)
      const uploadRes = await supabaseStorage.uploadTechnicalDocument(
        replacementFile,
        selectedForReplace.slug
      );

      // 2. Atualiza a referência no banco de dados
      await supabaseDatabase.updateTechnicalDocument(
        selectedForReplace.id,
        {
          file_name: uploadRes.fileName,
          file_path: uploadRes.path,
          file_url: uploadRes.publicUrl,
          mime_type: uploadRes.mimeType,
          file_size: uploadRes.fileSize,
        },
        user?.id
      );

      // 3. Remove o arquivo anterior com segurança
      if (oldFilePath && oldFilePath !== uploadRes.path) {
        await supabaseStorage.deleteTechnicalDocument(oldFilePath);
      }

      showFeedback('success', `Arquivo de "${selectedForReplace.title}" substituído com sucesso!`);
      setIsReplaceFileOpen(false);
      setSelectedForReplace(null);
      setReplacementFile(null);
      await loadDocuments();
    } catch (err: any) {
      console.error('Erro ao substituir arquivo:', err);
      showFeedback('error', err?.message || 'Erro ao processar substituição do arquivo.');
    } finally {
      setReplacing(false);
    }
  };

  // Alternar Publicação
  const handleTogglePublish = async (doc: TechnicalDocumentRow) => {
    try {
      const nextState = !doc.is_published;
      await supabaseDatabase.togglePublishDocument(doc.id, nextState, user?.id);
      setDocuments(prev =>
        prev.map(d => (d.id === doc.id ? { ...d, is_published: nextState } : d))
      );
      showFeedback(
        'success',
        nextState ? `"${doc.title}" foi publicado com sucesso!` : `"${doc.title}" foi despublicado (salvo como rascunho).`
      );
    } catch (err) {
      console.error('Erro ao alternar publicação:', err);
      showFeedback('error', 'Falha ao alterar status de publicação.');
    }
  };

  // Alternar Destaque
  const handleToggleFeature = async (doc: TechnicalDocumentRow) => {
    try {
      const nextState = !doc.is_featured;
      await supabaseDatabase.toggleFeatureDocument(doc.id, nextState, user?.id);
      setDocuments(prev =>
        prev.map(d => (d.id === doc.id ? { ...d, is_featured: nextState } : d))
      );
      showFeedback(
        'success',
        nextState ? `"${doc.title}" foi marcado como destaque!` : `"${doc.title}" foi removido dos destaques.`
      );
    } catch (err) {
      console.error('Erro ao alternar destaque:', err);
      showFeedback('error', 'Falha ao alterar status de destaque.');
    }
  };

  // Reordenação de Itens
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredDocuments.length) return;

    const newDocs = [...filteredDocuments];
    const temp = newDocs[index];
    newDocs[index] = newDocs[targetIndex];
    newDocs[targetIndex] = temp;

    setDocuments(newDocs);

    try {
      const orderedIds = newDocs.map(d => d.id);
      await supabaseDatabase.reorderTechnicalDocuments(orderedIds, user?.id);
      showFeedback('success', 'Ordem de exibição dos documentos atualizada.');
    } catch (err) {
      console.error('Erro ao salvar reordenação:', err);
      showFeedback('error', 'Falha ao salvar nova ordem dos documentos.');
      await loadDocuments();
    }
  };

  // Exclusão de Documento
  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    try {
      await supabaseDatabase.deleteTechnicalDocument(deletingDoc.id, user?.id);
      if (deletingDoc.file_path) {
        await supabaseStorage.deleteTechnicalDocument(deletingDoc.file_path);
      }
      showFeedback('success', `Documento "${deletingDoc.title}" removido com sucesso.`);
      setIsDeleteModalOpen(false);
      setDeletingDoc(null);
      await loadDocuments();
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      showFeedback('error', 'Falha ao excluir documento.');
    }
  };

  // Obter ícone representativo pelo tipo de arquivo
  const getFileIcon = (mimeType: string, type: string) => {
    if (mimeType.includes('pdf') || type.toLowerCase().includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel') || type.toLowerCase().includes('planilha')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    if (type.toLowerCase().includes('memorial') || type.toLowerCase().includes('laudo')) {
      return <FileCheck className="w-5 h-5 text-[#C5A059]" />;
    }
    return <FileCode2 className="w-5 h-5 text-sky-400" />;
  };

  // Filtros aplicados
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.file_name && doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || doc.category === selectedCategory;

    const matchesType =
      selectedType === 'all' || doc.document_type === selectedType;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'published'
        ? doc.is_published
        : !doc.is_published;

    const matchesFeatured =
      featuredFilter === 'all' ? true : doc.is_featured;

    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesFeatured;
  });

  // Métricas
  const totalCount = documents.length;
  const publishedCount = documents.filter(d => d.is_published).length;
  const draftCount = documents.filter(d => !d.is_published).length;
  const featuredCount = documents.filter(d => d.is_featured).length;
  const totalDownloads = documents.reduce((acc, curr) => acc + (curr.downloads_count || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-8 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border ${
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
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header com Título e Botão de Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 text-[#C5A059] text-xs font-semibold uppercase tracking-wider mb-2 border border-[#C5A059]/20">
            <FileText className="w-3.5 h-3.5" /> Gestão de Engenharia
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-serif">
            Central de Documentos Técnicos e Laudos
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Gerencie laudos periciais, memoriais descritivos, cadernos de encargos, apostilas técnicas e publicações oficiais da Engª Jucélia Santana.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={loadDocuments}
            variant="outline"
            className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 text-xs"
            title="Recarregar do Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={handleOpenNewModal}
            className="bg-[#C5A059] hover:bg-[#b08d4b] text-[#070D18] font-bold flex items-center gap-2 shadow-lg shadow-[#C5A059]/20 transition-all transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Documento</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas em Tempo Real */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</span>
          <p className="text-2xl font-bold text-white">{totalCount}</p>
          <span className="text-[11px] text-slate-500">Documentos no banco</span>
        </div>

        <div className="bg-[#0B1526] border border-emerald-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Publicados</span>
          <p className="text-2xl font-bold text-emerald-400">{publishedCount}</p>
          <span className="text-[11px] text-emerald-500/70">Visíveis no site</span>
        </div>

        <div className="bg-[#0B1526] border border-amber-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Rascunhos</span>
          <p className="text-2xl font-bold text-amber-400">{draftCount}</p>
          <span className="text-[11px] text-amber-500/70">Em revisão</span>
        </div>

        <div className="bg-[#0B1526] border border-[#C5A059]/30 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#C5A059] font-medium uppercase tracking-wider">Destaques</span>
          <p className="text-2xl font-bold text-[#C5A059]">{featuredCount}</p>
          <span className="text-[11px] text-[#C5A059]/70">Topo da Central</span>
        </div>

        <div className="bg-[#0B1526] border border-sky-500/20 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs text-sky-400 font-medium uppercase tracking-wider">Acessos</span>
          <p className="text-2xl font-bold text-sky-400">{totalDownloads}</p>
          <span className="text-[11px] text-sky-500/70">Downloads registrados</span>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Barra de Pesquisa */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, descrição ou nome do arquivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070D18] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#C5A059] transition-colors"
          >
            <option value="all">Todas as Categorias</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Filtro por Tipo */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#C5A059] transition-colors"
          >
            <option value="all">Todos os Tipos</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#C5A059] transition-colors"
          >
            <option value="all">Todos os Status</option>
            <option value="published">Apenas Publicados</option>
            <option value="draft">Apenas Rascunhos</option>
          </select>

          {/* Filtro por Destaque */}
          <button
            onClick={() => setFeaturedFilter(prev => (prev === 'all' ? 'featured' : 'all'))}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-all ${
              featuredFilter === 'featured'
                ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]'
                : 'bg-[#070D18] border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className={`w-4 h-4 ${featuredFilter === 'featured' ? 'fill-[#C5A059]' : ''}`} />
            <span>{featuredFilter === 'featured' ? 'Em Destaque' : 'Filtrar Destaques'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Documentos */}
      {loading ? (
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin" />
          <p className="text-slate-400 text-sm">Carregando documentos técnicos do Supabase...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum documento encontrado</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all'
              ? 'Nenhum documento corresponde aos filtros selecionados. Tente limpar a busca.'
              : 'Nenhum documento técnico cadastrado até o momento. Clique no botão abaixo para adicionar o primeiro.'}
          </p>
          <Button
            onClick={handleOpenNewModal}
            className="bg-[#C5A059] text-[#070D18] font-bold mt-2"
          >
            Cadastrar Novo Documento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="bg-[#0B1526] border border-white/10 hover:border-[#C5A059]/40 rounded-2xl p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Lado Esquerdo: Ícone + Título + Metadados */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Botões de Reordenação */}
                <div className="hidden sm:flex flex-col gap-1 items-center justify-center shrink-0 pt-1">
                  <button
                    onClick={() => handleMoveOrder(idx, 'up')}
                    disabled={idx === 0}
                    title="Mover para cima"
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                  <button
                    onClick={() => handleMoveOrder(idx, 'down')}
                    disabled={idx === filteredDocuments.length - 1}
                    title="Mover para baixo"
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Ícone de Formato */}
                <div className="w-12 h-12 rounded-xl bg-[#070D18] border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  {getFileIcon(doc.mime_type, doc.document_type)}
                </div>

                {/* Dados Principais */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate max-w-lg hover:text-[#C5A059] transition-colors">
                      {doc.title}
                    </h3>

                    {/* Badge de Destaque */}
                    {doc.is_featured && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3 fill-[#C5A059]" /> Destaque
                      </span>
                    )}

                    {/* Badge de Status */}
                    {doc.is_published ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <Globe className="w-3 h-3" /> Publicado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" /> Rascunho
                      </span>
                    )}
                  </div>

                  {doc.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  {/* Metadados Técnicos */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono pt-1">
                    <span className="inline-flex items-center gap-1 text-[#C5A059]">
                      <Tag className="w-3 h-3" /> {doc.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Layers className="w-3 h-3 text-slate-500" /> {doc.document_type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <HardDrive className="w-3 h-3 text-slate-500" /> {formatFileSize(doc.file_size)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sky-400">
                      <Download className="w-3 h-3" /> {doc.downloads_count || 0} downloads
                    </span>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Ações */}
              <div className="flex flex-wrap items-center gap-1.5 border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0 shrink-0">
                {/* Botão de Destaque Rápido */}
                <button
                  onClick={() => handleToggleFeature(doc)}
                  title={doc.is_featured ? 'Remover dos destaques' : 'Marcar como destaque'}
                  className={`p-2 rounded-xl border transition-all ${
                    doc.is_featured
                      ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Star className={`w-4 h-4 ${doc.is_featured ? 'fill-[#C5A059]' : ''}`} />
                </button>

                {/* Botão de Publicação Rápida */}
                <button
                  onClick={() => handleTogglePublish(doc)}
                  title={doc.is_published ? 'Despublicar (Tornar Rascunho)' : 'Publicar no site'}
                  className={`p-2 rounded-xl border transition-all ${
                    doc.is_published
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  {doc.is_published ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>

                {/* Visualizar / Preview */}
                <button
                  onClick={() => {
                    setPreviewDoc(doc);
                    setIsPreviewOpen(true);
                  }}
                  title="Visualizar documento / PDF"
                  className="p-2 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/30 text-slate-300 hover:text-sky-400 transition-all"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Substituir Arquivo */}
                <button
                  onClick={() => handleOpenReplaceModal(doc)}
                  title="Substituir arquivo por nova versão"
                  className="p-2 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-slate-300 hover:text-purple-400 transition-all"
                >
                  <FileUp className="w-4 h-4" />
                </button>

                {/* Editar Metadados */}
                <button
                  onClick={() => handleOpenEditModal(doc)}
                  title="Editar informações do documento"
                  className="p-2 rounded-xl bg-white/5 hover:bg-[#C5A059]/20 border border-white/10 hover:border-[#C5A059]/30 text-slate-300 hover:text-[#C5A059] transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Baixar Arquivo */}
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.file_name}
                  onClick={() => supabaseDatabase.incrementDocumentDownloads(doc.id)}
                  title="Baixar arquivo original"
                  className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-all"
                >
                  <Download className="w-4 h-4" />
                </a>

                {/* Excluir Documento */}
                <button
                  onClick={() => {
                    setDeletingDoc(doc);
                    setIsDeleteModalOpen(true);
                  }}
                  title="Excluir documento permanentemente"
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: FORMULÁRIO DE NOVO / EDIÇÃO       */}
      {/* ========================================== */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0B1526] border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#070D18]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center">
                    <FilePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-serif">
                      {editingDoc ? 'Editar Documento Técnico' : 'Cadastrar Novo Documento'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {editingDoc
                        ? 'Atualize os metadados ou substitua o arquivo anexado.'
                        : 'Preencha os campos e anexe o arquivo para publicação.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Título do Documento *</span>
                    <span className="text-slate-500 text-[11px]">Ex: Laudo Pericial de Patologia Estrutural</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Digite o título oficial do documento ou laudo..."
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Identificador Amigável (Slug) *</span>
                    <span className="text-slate-500 text-[11px]">URL: /documentos/{slug || 'exemplo'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    placeholder="identificador-amigavel-do-documento"
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                  {slugError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {slugError}
                    </p>
                  )}
                </div>

                {/* Categoria e Tipo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Categoria *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Tipo de Documento *</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full bg-[#070D18] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059]"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descrição / Resumo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Descrição / Resumo Técnico</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o escopo do documento, normas técnicas contempladas (ABNT), finalidade e observações periciais..."
                    className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C5A059] transition-colors resize-none"
                  />
                </div>

                {/* Upload de Arquivo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Arquivo do Documento {editingDoc ? '(Opcional se manter o atual)' : '*'}</span>
                    <span className="text-slate-500 text-[11px]">PDF, DOCX, XLSX, PPTX (Máx. 25MB)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-[#C5A059] rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#070D18]/50 hover:bg-[#070D18] space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-[#C5A059]/10 text-slate-400 group-hover:text-[#C5A059] flex items-center justify-center mx-auto transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-bold text-emerald-400">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    ) : editingDoc ? (
                      <div>
                        <p className="text-sm font-semibold text-white">Arquivo atual: {editingDoc.file_name}</p>
                        <p className="text-xs text-slate-400">Clique para selecionar outro arquivo se desejar substituir.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-white">Clique para selecionar o arquivo</p>
                        <p className="text-xs text-slate-400">Arraste ou clique para anexar o laudo em PDF ou documento</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Opções de Publicação e Destaque */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#070D18] border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-[#C5A059] focus:ring-[#C5A059]"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Publicar Imediatamente</span>
                      <span className="text-[11px] text-slate-400 block">Tornar visível na Central de Documentos pública</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#070D18] border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-[#C5A059] focus:ring-[#C5A059]"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Destacar no Topo</span>
                      <span className="text-[11px] text-slate-400 block">Exibir na seção de publicações em destaque</span>
                    </div>
                  </label>
                </div>

                {/* Footer do Modal */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    className="border-white/10 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[#C5A059] hover:bg-[#b08d4b] text-[#070D18] font-bold"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
                      </span>
                    ) : editingDoc ? (
                      'Salvar Alterações'
                    ) : (
                      'Publicar Documento'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL 2: SUBSTITUIÇÃO DIRETA DE ARQUIVO    */}
      {/* ========================================== */}
      <AnimatePresence>
        {isReplaceFileOpen && selectedForReplace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B1526] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#070D18]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">Substituir Arquivo</h3>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{selectedForReplace.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReplaceFileOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[#070D18] p-3.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Arquivo Atual</span>
                  <p className="text-xs font-mono text-white truncate">{selectedForReplace.file_name}</p>
                  <span className="text-[11px] text-slate-500 block">Tamanho: {formatFileSize(selectedForReplace.file_size)}</span>
                </div>

                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReplacementFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => replaceFileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-500/30 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-purple-500/5 hover:bg-purple-500/10 space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  {replacementFile ? (
                    <div>
                      <p className="text-sm font-bold text-emerald-400">{replacementFile.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(replacementFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-white">Selecionar novo arquivo</p>
                      <p className="text-xs text-slate-400">O novo arquivo substituirá a versão anterior mantendo todos os links.</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => setIsReplaceFileOpen(false)}
                    className="border-white/10 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    disabled={!replacementFile || replacing}
                    onClick={handleExecuteFileReplacement}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    {replacing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Substituindo...
                      </span>
                    ) : (
                      'Confirmar Substituição'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL 3: PREVIEW DE DOCUMENTO / PDF        */}
      {/* ========================================== */}
      <AnimatePresence>
        {isPreviewOpen && previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B1526] border border-white/15 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#070D18] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white font-serif truncate">{previewDoc.title}</h3>
                    <p className="text-xs text-slate-400 truncate">
                      {previewDoc.category} • {formatFileSize(previewDoc.file_size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={previewDoc.file_name}
                    onClick={() => supabaseDatabase.incrementDocumentDownloads(previewDoc.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#C5A059] text-[#070D18] font-bold text-xs flex items-center gap-1.5 hover:bg-[#b08d4b] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </a>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Corpo do Preview */}
              <div className="flex-1 bg-[#070D18] p-4 flex flex-col items-center justify-center overflow-hidden">
                {previewDoc.mime_type.includes('pdf') || previewDoc.file_name.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={`${previewDoc.file_url}#toolbar=1`}
                    title={previewDoc.title}
                    className="w-full h-full rounded-xl border border-white/10"
                  />
                ) : (
                  <div className="text-center space-y-4 max-w-md p-8 bg-[#0B1526] rounded-2xl border border-white/10">
                    <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white">{previewDoc.file_name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Este formato ({previewDoc.document_type || 'Documento Técnico'}) pode ser aberto e baixado diretamente para visualização em aplicativos locais (Word, Excel, AutoCAD, etc.).
                    </p>
                    <a
                      href={previewDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={previewDoc.file_name}
                      onClick={() => supabaseDatabase.incrementDocumentDownloads(previewDoc.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] text-[#070D18] font-bold text-sm hover:bg-[#b08d4b] transition-all"
                    >
                      <Download className="w-4 h-4" /> Baixar Documento Original
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO           */}
      {/* ========================================== */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B1526] border border-rose-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-serif">Excluir Documento?</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tem certeza que deseja excluir o documento <strong className="text-white">"{deletingDoc.title}"</strong>? O arquivo será removido do banco de dados e do armazenamento.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="border-white/10 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Sim, Excluir Documento
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
