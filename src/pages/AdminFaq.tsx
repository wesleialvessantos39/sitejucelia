// /src/pages/AdminFaq.tsx
import React, { useState, useEffect } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import { useAuth } from '../context/AuthContext';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { FaqItemContent } from '../types/content';
import { 
  HelpCircle, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sliders, 
  Save, 
  X, 
  Info,
  Layers,
  Sparkles,
  RefreshCw,
  FileQuestion
} from 'lucide-react';

export const AdminFaq: React.FC = () => {
  const { content, refreshContent } = useSiteContent();
  const { user } = useAuth();

  const [items, setItems] = useState<FaqItemContent[]>([]);
  const [editingItem, setEditingItem] = useState<FaqItemContent | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<FaqItemContent | null>(null);
  
  // Header editor state
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const [headerData, setHeaderData] = useState({
    badgeText: '',
    title: '',
    highlightTitle: '',
    subtitle: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Carregar dados de FAQ existentes do contexto
  useEffect(() => {
    if (content?.faq) {
      const sorted = [...(content.faq.items || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      setItems(sorted);
      setHeaderData({
        badgeText: content.faq.badgeText || 'Esclarecimento de Dúvidas',
        title: content.faq.title || 'Perguntas Frequentes',
        highlightTitle: content.faq.highlightTitle || 'E Esclarecimentos Técnicos',
        subtitle: content.faq.subtitle || 'Entenda como funcionam nossos processos de contratação, entregas de laudos, projetos e fiscalizações.',
      });
    }
  }, [content]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Sanitização básica contra scripts e HTML perigoso
  const sanitizeText = (text: string): string => {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  };

  // ==========================================
  // EDIÇÃO DE PERGUNTA EXISTENTE
  // ==========================================
  const handleOpenEdit = (item: FaqItemContent) => {
    setDuplicateWarning(null);
    setEditingItem({ ...item });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const sanitizedQuestion = sanitizeText(editingItem.question);
    const sanitizedAnswer = sanitizeText(editingItem.answer);
    const sanitizedCategory = sanitizeText(editingItem.category || 'Geral');

    // Validação de conteúdo obrigatório
    if (!sanitizedQuestion) {
      setDuplicateWarning('O texto da pergunta não pode estar vazio.');
      return;
    }
    if (!sanitizedAnswer) {
      setDuplicateWarning('O texto da resposta/esclarecimento técnico não pode estar vazio.');
      return;
    }

    // Validação de duplicidade com outras perguntas existentes
    const isDuplicate = items.some(
      (item) =>
        item.id !== editingItem.id &&
        item.question.trim().toLowerCase() === sanitizedQuestion.toLowerCase()
    );

    if (isDuplicate) {
      setDuplicateWarning('Já existe uma pergunta com este conteúdo.');
      return;
    }

    setLoading(true);
    setDuplicateWarning(null);

    try {
      const updated: FaqItemContent = {
        ...editingItem,
        question: sanitizedQuestion,
        answer: sanitizedAnswer,
        category: sanitizedCategory,
      };

      await supabaseDatabase.updateFaqItem(updated, user?.id);
      await refreshContent();
      setEditingItem(null);
      showFeedback('success', 'Pergunta e resposta atualizadas com sucesso.');
    } catch (err: any) {
      console.error('Erro ao atualizar pergunta:', err);
      showFeedback('error', err.message || 'Erro ao salvar alterações na pergunta.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ATIVAÇÃO / DESATIVAÇÃO
  // ==========================================
  const handleToggleStatus = async (item: FaqItemContent) => {
    const newStatus = !item.active;
    setLoading(true);
    try {
      await supabaseDatabase.toggleFaqItemStatus(item.id, newStatus, user?.id);
      await refreshContent();
      showFeedback(
        'success',
        newStatus ? 'Pergunta ativada com sucesso.' : 'Pergunta desativada com sucesso.'
      );
    } catch (err: any) {
      console.error('Erro ao alterar status da pergunta:', err);
      showFeedback('error', err.message || 'Erro ao alterar status da pergunta.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EXCLUSÃO DE PERGUNTA EXISTENTE
  // ==========================================
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setLoading(true);
    try {
      await supabaseDatabase.deleteFaqItem(deleteConfirmItem.id, user?.id);
      await refreshContent();
      setDeleteConfirmItem(null);
      showFeedback('success', 'Pergunta removida com sucesso.');
    } catch (err: any) {
      console.error('Erro ao excluir pergunta:', err);
      showFeedback('error', err.message || 'Erro ao excluir pergunta.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // REORDENAÇÃO (SUBIR / DESCER)
  // ==========================================
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setItems(newItems);
    setLoading(true);

    try {
      await supabaseDatabase.reorderFaqItems(newItems, user?.id);
      await refreshContent();
      showFeedback('success', 'Ordem das perguntas atualizada com sucesso.');
    } catch (err: any) {
      console.error('Erro ao reordenar perguntas:', err);
      showFeedback('error', err.message || 'Erro ao atualizar ordem das perguntas.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SALVAR CABEÇALHO DA SEÇÃO
  // ==========================================
  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setLoading(true);

    try {
      const updatedSiteContent = {
        ...content,
        faq: {
          ...content.faq,
          badgeText: sanitizeText(headerData.badgeText),
          title: sanitizeText(headerData.title),
          highlightTitle: sanitizeText(headerData.highlightTitle),
          subtitle: sanitizeText(headerData.subtitle),
        },
      };

      await supabaseDatabase.saveSiteContent(updatedSiteContent, user?.id);
      await refreshContent();
      setIsHeaderOpen(false);
      showFeedback('success', 'Textos de cabeçalho da seção de dúvidas atualizados com sucesso.');
    } catch (err: any) {
      console.error('Erro ao salvar cabeçalho:', err);
      showFeedback('error', err.message || 'Erro ao salvar textos da seção.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-cinzel font-bold text-white tracking-wide">
                Perguntas e Esclarecimentos
              </h1>
              <p className="text-sm font-jakarta text-slate-400 mt-0.5">
                Gerencie as perguntas e respostas que já aparecem no site.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsHeaderOpen(!isHeaderOpen)}
            className="px-4 py-2 rounded-xl bg-[#122038] hover:bg-[#1A2E4F] border border-white/10 text-xs font-jakarta font-semibold text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-[#C5A059]" />
            <span>{isHeaderOpen ? 'Ocultar Cabeçalho' : 'Editar Cabeçalho da Seção'}</span>
          </button>

          <button
            type="button"
            onClick={() => refreshContent()}
            disabled={loading}
            className="p-2 rounded-xl bg-[#122038] hover:bg-[#1A2E4F] border border-white/10 text-slate-300 transition-all cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C5A059]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-jakarta font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/70 border border-red-500/30 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Painel Retrátil de Edição do Cabeçalho da Seção */}
      {isHeaderOpen && (
        <form
          onSubmit={handleSaveHeader}
          className="bg-[#0E1729] border border-[#C5A059]/30 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-cinzel font-bold text-white text-sm">
                Textos Institucionais do Cabeçalho da Seção FAQ
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsHeaderOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-jakarta text-slate-300 mb-1 font-semibold">
                Badge / Tag Superior
              </label>
              <input
                type="text"
                value={headerData.badgeText}
                onChange={(e) => setHeaderData({ ...headerData, badgeText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs font-jakarta focus:outline-none focus:border-[#C5A059]"
                placeholder="Ex: Esclarecimento de Dúvidas"
              />
            </div>

            <div>
              <label className="block text-xs font-jakarta text-slate-300 mb-1 font-semibold">
                Título Principal
              </label>
              <input
                type="text"
                value={headerData.title}
                onChange={(e) => setHeaderData({ ...headerData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs font-jakarta focus:outline-none focus:border-[#C5A059]"
                placeholder="Ex: Perguntas Frequentes"
              />
            </div>

            <div>
              <label className="block text-xs font-jakarta text-slate-300 mb-1 font-semibold">
                Destaque Dourado do Título
              </label>
              <input
                type="text"
                value={headerData.highlightTitle}
                onChange={(e) => setHeaderData({ ...headerData, highlightTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs font-jakarta focus:outline-none focus:border-[#C5A059]"
                placeholder="Ex: E Esclarecimentos Técnicos"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-jakarta text-slate-300 mb-1 font-semibold">
              Subtítulo Descritivo
            </label>
            <textarea
              rows={2}
              value={headerData.subtitle}
              onChange={(e) => setHeaderData({ ...headerData, subtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs font-jakarta focus:outline-none focus:border-[#C5A059]"
              placeholder="Descrição introdutória da seção..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsHeaderOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-jakarta text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-black text-xs font-jakarta font-bold flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Cabeçalho
            </button>
          </div>
        </form>
      )}

      {/* Lista de Perguntas Existentes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C5A059]" />
            <span className="text-xs font-jakarta font-semibold text-slate-300 uppercase tracking-wider">
              Perguntas Existentes no Site ({items.length})
            </span>
          </div>
          <div className="text-[11px] font-jakarta text-slate-400">
            Itens desativados são ocultados automaticamente da área pública
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-[#0E1729] border border-white/10 rounded-2xl p-12 text-center space-y-3">
            <FileQuestion className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="font-cinzel font-bold text-white text-base">
              Nenhuma pergunta cadastrada na estrutura
            </h3>
            <p className="text-xs font-jakarta text-slate-400 max-w-md mx-auto">
              As perguntas padrão serão restauradas automaticamente caso a estrutura seja reiniciada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const isActive = item.active !== false;
              return (
                <div
                  key={item.id}
                  className={`bg-[#0E1729] border rounded-2xl p-5 transition-all duration-200 ${
                    isActive
                      ? 'border-white/10 hover:border-[#C5A059]/40 shadow-sm'
                      : 'border-white/5 bg-[#070D18]/60 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Conteúdo da Pergunta e Categoria */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#122038] border border-white/10 text-[11px] font-jakarta font-bold text-[#C5A059]">
                          Ordem: {index + 1}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[11px] font-jakarta font-semibold text-[#D4AF37]">
                          {item.category || 'Esclarecimentos Técnicos'}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-jakarta font-bold flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-400" />
                              ATIVO NO SITE
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-400" />
                              INATIVO (OCULTO)
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="font-cinzel font-bold text-white text-base sm:text-lg">
                        {item.question}
                      </h3>

                      <p className="text-xs sm:text-sm font-jakarta text-slate-300 leading-relaxed whitespace-pre-line bg-[#070D18]/80 p-3.5 rounded-xl border border-white/5">
                        {item.answer}
                      </p>
                    </div>

                    {/* Ações Administrativas */}
                    <div className="flex items-center gap-1.5 lg:self-start shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                      {/* Subir Ordem */}
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0 || loading}
                        className="p-2 rounded-xl bg-[#122038] hover:bg-[#1A2E4F] border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Descer Ordem */}
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === items.length - 1 || loading}
                        className="p-2 rounded-xl bg-[#122038] hover:bg-[#1A2E4F] border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Ativar / Desativar */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={loading}
                        className={`px-3 py-2 rounded-xl text-xs font-jakarta font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                            : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300'
                        }`}
                        title={isActive ? 'Desativar pergunta' : 'Ativar pergunta'}
                      >
                        {isActive ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Desativar</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ativar</span>
                          </>
                        )}
                      </button>

                      {/* Editar Pergunta */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        disabled={loading}
                        className="px-3 py-2 rounded-xl bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#D4AF37] text-xs font-jakarta font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {/* Excluir Pergunta */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem(item)}
                        disabled={loading}
                        className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 transition-all cursor-pointer"
                        title="Excluir pergunta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DE PERGUNTA EXISTENTE */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0E1729] border border-[#C5A059]/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cinzel font-bold text-white text-lg">
                    Editar Pergunta Existente
                  </h3>
                  <p className="text-xs font-jakarta text-slate-400">
                    Altere os textos da pergunta, esclarecimento técnico ou categoria.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateWarning && (
              <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-jakarta flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-jakarta text-slate-300 font-semibold mb-1">
                  Texto da Pergunta *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingItem.question}
                  onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs sm:text-sm font-jakarta focus:outline-none focus:border-[#C5A059]"
                  placeholder="Digite o texto da pergunta..."
                />
              </div>

              <div>
                <label className="block text-xs font-jakarta text-slate-300 font-semibold mb-1">
                  Resposta / Esclarecimento Técnico *
                </label>
                <textarea
                  rows={6}
                  required
                  value={editingItem.answer}
                  onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs sm:text-sm font-jakarta focus:outline-none focus:border-[#C5A059] leading-relaxed"
                  placeholder="Digite a resposta detalhada e os esclarecimentos técnicos..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-jakarta text-slate-300 font-semibold mb-1">
                    Categoria Técnica
                  </label>
                  <input
                    type="text"
                    value={editingItem.category || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs font-jakarta focus:outline-none focus:border-[#C5A059]"
                    placeholder="Ex: Projetos, Laudos, Processos, Institucional"
                  />
                </div>

                <div>
                  <label className="block text-xs font-jakarta text-slate-300 font-semibold mb-1">
                    Status de Exibição
                  </label>
                  <select
                    value={editingItem.active !== false ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, active: e.target.value === 'active' })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs font-jakarta focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="active">Ativo (Visível no site)</option>
                    <option value="inactive">Inativo (Oculto no site)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-jakarta font-semibold text-slate-300 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-black text-xs font-jakarta font-bold flex items-center gap-2 shadow-lg shadow-[#C5A059]/10 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0E1729] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-cinzel font-bold text-white text-base">
                Confirmar Exclusão
              </h3>
            </div>

            <p className="text-xs sm:text-sm font-jakarta text-slate-300 leading-relaxed">
              Esta pergunta e sua resposta serão removidas da seção de esclarecimentos do site. Deseja continuar?
            </p>

            <div className="p-3 bg-[#070D18] rounded-xl border border-white/5 text-xs font-jakarta text-slate-300 italic">
              "{deleteConfirmItem.question}"
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-jakarta font-semibold text-slate-300 transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-jakarta font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Removendo...' : 'Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
