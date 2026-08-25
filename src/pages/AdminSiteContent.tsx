// /src/pages/AdminSiteContent.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';
import { SiteContentSettings } from '../types/content';
import { DEFAULT_SITE_CONTENT } from '../data/defaultSiteContent';
import { 
  FileText, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Edit3, 
  Sparkles, 
  HelpCircle,
  ShieldCheck,
  Building2,
  Phone,
  Layout,
  Sliders,
  ChevronRight,
  X,
  ExternalLink
} from 'lucide-react';
import { TextDisplayManager } from '../components/admin/TextDisplayManager';

type SectionKey = keyof SiteContentSettings | 'text_display';

const SECTION_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  text_display: {
    label: '✨ Exibição dos Textos (OE-SITE-001)',
    icon: 'Sparkles',
    description: 'Controle global de redução de altura de textos longos, limites de linhas por aparelho e botões de expansão.',
  },
  hero: {
    label: 'Hero (Início)',
    icon: 'Layout',
    description: 'Títulos principais, frases de efeito e botões de chamada no topo do site.',
  },
  about: {
    label: 'Sobre a Engª',
    icon: 'Building2',
    description: 'Apresentação institucional, biografia técnica e proposta de valor no Sobre.',
  },
  services: {
    label: 'Serviços',
    icon: 'Sliders',
    description: 'Títulos, subtítulos e descrições do catálogo de soluções técnicas.',
  },
  projects: {
    label: 'Obras e Projetos',
    icon: 'FileText',
    description: 'Apresentação e legendas do cabeçalho da galeria e portfólio de obras.',
  },
  differentials: {
    label: 'Diferenciais',
    icon: 'ShieldCheck',
    description: 'Textos explicativos da seção de diferenciais competitivos e qualidade ABNT.',
  },
  process: {
    label: 'Metodologia',
    icon: 'ChevronRight',
    description: 'Títulos e frases introdutórias do passo a passo do fluxo de trabalho.',
  },
  faq: {
    label: 'Perguntas e FAQ',
    icon: 'HelpCircle',
    description: 'Textos introdutórios e cabeçalhos da seção de esclarecimento de dúvidas técnicas.',
  },
  cta: {
    label: 'Chamada para Ação',
    icon: 'Sparkles',
    description: 'Textos de conversão e incentivo ao orçamento via WhatsApp.',
  },
  contact: {
    label: 'Contato',
    icon: 'Phone',
    description: 'Informações de atendimento, chamadas e instruções do formulário.',
  },
  footer: {
    label: 'Rodapé',
    icon: 'Layout',
    description: 'Resumo institucional, selos de normas e direitos autorais no rodapé.',
  },
};

export const AdminSiteContent: React.FC = () => {
  const { content, updateContent, resetContent, isLoading } = useSiteContent();
  const [formData, setFormData] = useState<SiteContentSettings>(content);
  const [activeTab, setActiveTab] = useState<SectionKey>('hero');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (content) {
      setFormData(JSON.parse(JSON.stringify(content)));
    }
  }, [content]);

  // Sanitização básica contra scripts e HTML perigoso
  const sanitizeInput = (val: string): string => {
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');
  };

  const handleFieldChange = (section: SectionKey, field: string, value: string) => {
    const sanitized = sanitizeInput(value);
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: sanitized,
      },
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const success = await updateContent(formData);
      if (success) {
        setFeedback({
          type: 'success',
          message: 'Textos e legendas atualizados com sucesso.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Não foi possível salvar os textos. Tente novamente.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Ocorreu um erro ao tentar salvar as alterações.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(JSON.parse(JSON.stringify(content)));
    setFeedback({
      type: 'info',
      message: 'Alterações canceladas. Dados restaurados da versão salva.',
    });
  };

  const handleConfirmReset = async () => {
    setIsSubmitting(true);
    setIsResetModalOpen(false);
    try {
      const success = await resetContent();
      if (success) {
        setFormData(JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT)));
        setFeedback({
          type: 'success',
          message: 'Textos restaurados para o padrão com sucesso.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Erro ao restaurar textos padrão.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Erro inesperado ao restaurar textos padrão.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-300 font-jakarta text-sm">Carregando textos e legendas do Supabase...</p>
      </div>
    );
  }

  const currentSectionData = formData[activeTab] || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#C5A059] text-xs font-semibold tracking-wider uppercase mb-1">
            <FileText className="w-4 h-4" />
            <span>Gerenciamento Centralizado de Conteúdo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-white">
            Textos e Legendas do Site
          </h1>
          <p className="text-slate-400 text-sm font-jakarta mt-1">
            Altere os títulos, subtítulos, descrições e botões de todas as seções públicas em tempo real.
          </p>
        </div>

        {activeTab !== 'text_display' && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-jakarta border transition-all flex items-center gap-2 ${
                showPreview
                  ? 'bg-[#C5A059] text-black border-[#C5A059]'
                  : 'bg-[#0B1526] text-slate-300 border-white/10 hover:border-[#C5A059]/50'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Ocultar Prévia' : 'Pré-visualizar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold font-jakarta bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold font-jakarta bg-[#0B1526] text-slate-300 border border-white/10 hover:border-slate-500 transition-all"
            >
              Cancelar Alterações
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-jakarta bg-gradient-to-r from-[#C5A059] to-[#A37F3E] text-black hover:opacity-90 transition-all shadow-lg shadow-[#C5A059]/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Salvar Alterações</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-jakarta ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {feedback.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            {feedback.type === 'info' && <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-white/10 scrollbar-thin">
        {Object.keys(SECTION_LABELS).map((key) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as SectionKey)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-jakarta whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059] shadow-md shadow-[#C5A059]/10'
                  : 'bg-[#0B1526] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>{SECTION_LABELS[key].label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {activeTab === 'text_display' ? (
        <TextDisplayManager />
      ) : (
        /* Main Form & Preview Area */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Editor Form Column */}
          <div className={showPreview ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
            <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold font-cinzel text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#C5A059]" />
                  <span>Edição — {SECTION_LABELS[activeTab]?.label || activeTab}</span>
                </h2>
                <p className="text-xs text-slate-400 font-jakarta mt-1">
                  {SECTION_LABELS[activeTab]?.description || ''}
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {Object.entries(currentSectionData).map(([field, value]) => {
                if (field === 'items' && Array.isArray(value)) {
                  return (
                    <div key={field} className="p-4 rounded-xl bg-[#070D18] border border-[#C5A059]/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#C5A059]" />
                          <span className="text-xs font-bold text-white font-cinzel">
                            Perguntas e Esclarecimentos Cadastrados ({value.length} itens)
                          </span>
                        </div>
                        <Link
                          to="/admin/faq"
                          className="px-3 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#D4AF37] text-black text-xs font-jakarta font-bold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <span>Gerenciar Perguntas</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-slate-400 font-jakarta">
                        Para editar o conteúdo das perguntas, respostas técnicas, ordenar ou ativar/desativar itens existentes, acesse o painel dedicado.
                      </p>
                    </div>
                  );
                }

                const isLongText = field.toLowerCase().includes('description') || 
                                  field.toLowerCase().includes('subtitle') || 
                                  field.toLowerCase().includes('bio') || 
                                  field.toLowerCase().includes('paragraph');

                // Label formatado amigável em Português
                const formattedLabel = field
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())
                  .replace('Badge Text', 'Selo / Insígnia (Badge)')
                  .replace('Location Badge', 'Badge de Localização')
                  .replace('Title Highlight', 'Destaque Dourado do Título')
                  .replace('Title', 'Título Principal')
                  .replace('Subtitle', 'Subtítulo Explicativo')
                  .replace('Description', 'Descrição Detalhada')
                  .replace('Primary Cta', 'Texto Botão Principal')
                  .replace('Secondary Cta', 'Texto Botão Secundário')
                  .replace('Whatsapp Notice', 'Aviso de WhatsApp')
                  .replace('Bio Paragraph1', 'Parágrafo 1 Biografia')
                  .replace('Bio Paragraph2', 'Parágrafo 2 Biografia')
                  .replace('Cta Text', 'Texto do Botão CTA')
                  .replace('Form Title', 'Título do Formulário')
                  .replace('Form Subtitle', 'Subtítulo do Formulário')
                  .replace('Short Description', 'Descrição Curta do Rodapé')
                  .replace('Crea Badge', 'Texto Registro CREA')
                  .replace('Normas Text', 'Texto de Normas ABNT')
                  .replace('Copyright Text', 'Texto de Direitos Autorais');

                return (
                  <div key={field} className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 font-jakarta">
                      {formattedLabel}
                    </label>

                    {isLongText ? (
                      <textarea
                        rows={3}
                        value={(value as string) || ''}
                        onChange={(e) => handleFieldChange(activeTab, field, e.target.value)}
                        className="w-full bg-[#070D18] border border-white/10 focus:border-[#C5A059] rounded-xl px-4 py-3 text-sm text-white font-jakarta focus:outline-none transition-all"
                        placeholder={`Digite o texto para ${formattedLabel}...`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={(value as string) || ''}
                        onChange={(e) => handleFieldChange(activeTab, field, e.target.value)}
                        className="w-full bg-[#070D18] border border-white/10 focus:border-[#C5A059] rounded-xl px-4 py-2.5 text-sm text-white font-jakarta focus:outline-none transition-all"
                        placeholder={`Digite o texto para ${formattedLabel}...`}
                      />
                    )}
                  </div>
                );
              })}

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold font-jakarta text-slate-400 hover:text-white transition-all"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold font-jakarta bg-[#C5A059] text-black hover:bg-[#D4AF67] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Salvar {SECTION_LABELS[activeTab].label}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Preview Column */}
        {showPreview && (
          <div className="lg:col-span-5 space-y-4 sticky top-6">
            <div className="bg-[#0B1526] border border-[#C5A059]/30 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-[#C5A059] text-xs font-bold font-jakarta">
                  <Sparkles className="w-4 h-4" />
                  <span>Prévia da Seção: {SECTION_LABELS[activeTab].label}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-jakarta bg-white/5 px-2 py-0.5 rounded">
                  Tempo Real
                </span>
              </div>

              {/* Component Preview Card */}
              <div className="bg-[#070D18] border border-white/10 rounded-xl p-6 space-y-4 relative overflow-hidden">
                <div className="space-y-3">
                  {currentSectionData['badgeText'] && (
                    <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                      {currentSectionData['badgeText']}
                    </div>
                  )}

                  <h3 className="text-xl font-cinzel font-bold text-white leading-tight">
                    {currentSectionData['title']}{' '}
                    {currentSectionData['highlightTitle'] && (
                      <span className="text-[#C5A059] block mt-1">
                        {currentSectionData['highlightTitle']}
                      </span>
                    )}
                  </h3>

                  {(currentSectionData['subtitle'] || currentSectionData['description'] || currentSectionData['shortDescription']) && (
                    <p className="text-xs text-slate-300 font-jakarta leading-relaxed">
                      {currentSectionData['subtitle'] ||
                        currentSectionData['description'] ||
                        currentSectionData['shortDescription']}
                    </p>
                  )}

                  {currentSectionData['bioParagraph1'] && (
                    <p className="text-xs text-slate-400 font-jakarta leading-relaxed">
                      {currentSectionData['bioParagraph1']}
                    </p>
                  )}

                  {/* Buttons Preview */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {currentSectionData['primaryCta'] && (
                      <div className="px-4 py-2 rounded-lg text-xs font-bold bg-[#C5A059] text-black">
                        {currentSectionData['primaryCta']}
                      </div>
                    )}
                    {currentSectionData['secondaryCta'] && (
                      <div className="px-4 py-2 rounded-lg text-xs font-medium border border-[#C5A059]/50 text-white bg-[#122038]">
                        {currentSectionData['secondaryCta']}
                      </div>
                    )}
                    {currentSectionData['buttonText'] && (
                      <div className="px-4 py-2 rounded-lg text-xs font-bold bg-[#25D366] text-black">
                        {currentSectionData['buttonText']}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Confirmation Modal for Resetting Defaults */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold font-cinzel text-white">
                Restaurar Textos Padrão?
              </h3>
            </div>

            <p className="text-sm text-slate-300 font-jakarta leading-relaxed">
              Os textos e legendas de todas as seções do site serão restaurados para os valores originais de fábrica do sistema. Deseja realmente prosseguir?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold font-jakarta text-slate-400 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold font-jakarta bg-red-600 hover:bg-red-500 text-white transition-all flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Sim, Restaurar Padrão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSiteContent;
