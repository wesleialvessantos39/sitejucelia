// /src/pages/PublicProposalRequest.tsx
import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  MapPin,
  Maximize2,
  Calendar,
  Layers,
  Phone,
  Mail,
  User,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Paperclip,
  Trash2,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { useContactSettings } from '../context/ContactSettingsContext';
import {
  ProposalProjectType,
  ProposalStructureType,
  ProposalServiceType,
  ProposalStage,
  ProposalAttachment,
  CreateProposalDTO
} from '../types/proposals';

const PROJECT_TYPES: { id: ProposalProjectType; label: string; desc: string }[] = [
  { id: 'residencial', label: 'Residencial', desc: 'Casas térreas, sobrados, condomínios' },
  { id: 'comercial', label: 'Comercial', desc: 'Lojas, escritórios, centros comerciais' },
  { id: 'galpao', label: 'Galpão / Pavilhão', desc: 'Armazéns logísticos, centros de distribuição' },
  { id: 'industrial', label: 'Industrial', desc: 'Fábricas, plantas industriais, bases técnicas' },
  { id: 'agronegocio', label: 'Agronegócio', desc: 'Silos, secadores, barracões rurais' },
  { id: 'institucional', label: 'Institucional', desc: 'Escolas, postos, prédios públicos' },
  { id: 'misto', label: 'Uso Misto', desc: 'Comércio no térreo com moradia superior' },
  { id: 'outro', label: 'Outro Tipo', desc: 'Necessidades e obras customizadas' },
];

const STRUCTURE_TYPES: { id: ProposalStructureType; label: string }[] = [
  { id: 'concreto_armado', label: 'Concreto Armado Convencional' },
  { id: 'metalica', label: 'Estrutura Metálica (Aço)' },
  { id: 'mista', label: 'Estrutura Mista (Aço + Concreto)' },
  { id: 'alvenaria_estrutural', label: 'Alvenaria Estrutural (Blocos)' },
  { id: 'pre_moldado', label: 'Estrutura Pré-Moldada' },
  { id: 'madeira', label: 'Madeira / Engenheirada' },
  { id: 'reforco_estrutural', label: 'Reforço de Estrutura Existente' },
  { id: 'outro', label: 'A Definir com a Engenheira' },
];

const SERVICE_TYPES: { id: ProposalServiceType; label: string }[] = [
  { id: 'projeto_estrutural', label: 'Projeto Estrutural Completo com ART' },
  { id: 'pre_dimensionamento', label: 'Pré-Dimensionamento e Estudo de Viabilidade' },
  { id: 'avaliacao_estrutural', label: 'Avaliação de Capacidade de Carga' },
  { id: 'pericia_tecnica', label: 'Perícia Técnica / Diagnóstico de Patologias' },
  { id: 'laudo_vistoria', label: 'Laudo Técnico de Vistoria (NBR 13752)' },
  { id: 'reforma_ampliacao', label: 'Projeto para Reforma e Ampliação' },
  { id: 'reforco_estrutural', label: 'Projeto de Reforço Estrutural' },
  { id: 'consultoria_obra', label: 'Consultoria e Acompanhamento Técnico' },
  { id: 'outro', label: 'Outra Demanda Especial' },
];

const STAGES: { id: ProposalStage; label: string }[] = [
  { id: 'estudo_preliminar', label: 'Estudo Preliminar / Ideia Inicial' },
  { id: 'anteprojeto', label: 'Anteprojeto em Definição' },
  { id: 'projeto_arquitetonico_pronto', label: 'Projeto Arquitetônico Pronto' },
  { id: 'obra_nao_iniciada', label: 'Terreno Adquirido / Obra Não Iniciada' },
  { id: 'fundacao_em_andamento', label: 'Fundações em Execução' },
  { id: 'estrutura_em_andamento', label: 'Estrutura em Andamento' },
  { id: 'reforma_edificacao_existente', label: 'Edificação Construída (Reforma)' },
  { id: 'patologia_ou_sinistro', label: 'Aparecimento de Fissuras / Sinistro' },
];

export default function PublicProposalRequest() {
  const { getWhatsAppHref, getPhoneHref, formattedPhone, formattedWhatsApp } = useContactSettings();

  const [formData, setFormData] = useState<CreateProposalDTO>({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    requester_whatsapp: '',
    company_name: '',
    city: 'Ariquemes',
    state: 'RO',
    project_type: 'residencial',
    project_use: '',
    location: '',
    area_m2: null,
    floors: 1,
    structure_type: 'concreto_armado',
    service_type: 'projeto_estrutural',
    current_stage: 'projeto_arquitetonico_pronto',
    expected_start_date: '',
    has_architectural_project: false,
    has_soil_report: false,
    has_structural_project: false,
    has_topography: false,
    description: '',
    technical_notes: '',
  });

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFieldChange = (field: keyof CreateProposalDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      // Limite de 5 arquivos e 25MB cada
      const valid = selected.filter((f) => f.size <= 25 * 1024 * 1024);
      setFilesToUpload((prev) => [...prev, ...valid].slice(0, 5));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!formData.requester_name.trim() || !formData.requester_email.trim() || !formData.requester_phone.trim()) {
        throw new Error('Por favor, preencha seus dados de contato (Nome, E-mail e Telefone).');
      }

      if (!formData.description.trim()) {
        throw new Error('Por favor, descreva brevemente os objetivos da sua obra ou serviço.');
      }

      // 1. Upload dos arquivos anexados (se houver)
      const uploadedAttachments: ProposalAttachment[] = [];
      if (filesToUpload.length > 0) {
        setUploadProgress('Enviando plantas e croquis para o Storage seguro...');
        for (const f of filesToUpload) {
          const res = await supabaseStorage.uploadProposalAttachment(f);
          uploadedAttachments.push({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: res.name,
            size: res.size,
            type: res.type,
            url: res.url,
            path: res.path,
            created_at: new Date().toISOString(),
          });
        }
      }

      // 2. Criação do registro no Supabase
      setUploadProgress('Registrando proposta técnica preliminar...');
      const created = await supabaseDatabase.createProposalRequest({
        ...formData,
        attachments: uploadedAttachments,
      });

      setSubmittedId(created.id);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Erro ao enviar solicitação de proposta:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Institucional da Página */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Engenharia Diagnóstica • Pré-Dimensionamento e Orçamento</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Solicitação de Proposta e <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                Pré-Dimensionamento Estrutural
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Preencha os dados preliminares da sua edificação para que a Engenharia Civil realize a análise técnica de requisitos e prepare uma proposta personalizada com rigor normativo NBR.
            </p>
          </div>

          {/* Estado de Sucesso */}
          {isSuccess ? (
            <div className="bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Solicitação Recebida com Sucesso!</h2>
                <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
                  Recebemos os requisitos técnicos e anexos da sua obra. Nossa equipe técnica analisará a viabilidade estrutural e entrará em contato em breve.
                </p>
                {submittedId && (
                  <div className="text-xs text-amber-400 font-mono pt-2">
                    Protocolo de Atendimento: <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">{submittedId}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl max-w-lg mx-auto text-xs text-slate-400 space-y-2">
                <div className="flex items-center justify-center gap-2 text-slate-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Acompanhamento Técnico Imediato</span>
                </div>
                <p>Se desejar agilizar a análise ou tirar dúvidas urgentes, fale diretamente pelo nosso canal oficial:</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <a
                  href={getWhatsAppHref(`Olá, Engª Jucélia Santana! Acabei de enviar uma solicitação de proposta técnica (Protocolo ${submittedId || ''}) e gostaria de acompanhar.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Falar pelo WhatsApp ({formattedWhatsApp})</span>
                </a>

                <a
                  href={getPhoneHref()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Ligar para o Escritório ({formattedPhone})</span>
                </a>
              </div>
            </div>
          ) : (
            /* Formulário Estruturado */
            <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-10">
              {errorMessage && (
                <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center gap-3 text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* SEÇÃO 1: Dados do Solicitante */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <User className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-white">1. Dados do Solicitante e Contato</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={formData.requester_name}
                      onChange={(e) => handleFieldChange('requester_name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      E-mail de Retorno *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contato@empresa.com"
                      value={formData.requester_email}
                      onChange={(e) => handleFieldChange('requester_email', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(69) 99999-9999"
                      value={formData.requester_phone}
                      onChange={(e) => handleFieldChange('requester_phone', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Empresa / Construtora (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Construtora Exemplo"
                      value={formData.company_name || ''}
                      onChange={(e) => handleFieldChange('company_name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Cidade da Obra *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ariquemes"
                      value={formData.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Estado (UF) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="RO"
                      value={formData.state}
                      onChange={(e) => handleFieldChange('state', e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: Dados da Obra & Tipologia */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-white">2. Tipologia da Obra e Sistema Estrutural</h2>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Selecione a Tipologia da Edificação *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PROJECT_TYPES.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => handleFieldChange('project_type', t.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${formData.project_type === t.id ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500' : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                      >
                        <div className="text-xs font-bold text-white">{t.label}</div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Sistema Estrutural Desejado *
                    </label>
                    <select
                      value={formData.structure_type}
                      onChange={(e) => handleFieldChange('structure_type', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {STRUCTURE_TYPES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Serviço Técnico Solicitado *
                    </label>
                    <select
                      value={formData.service_type}
                      onChange={(e) => handleFieldChange('service_type', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {SERVICE_TYPES.map((st) => (
                        <option key={st.id} value={st.id}>{st.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Estágio Atual da Demanda *
                    </label>
                    <select
                      value={formData.current_stage}
                      onChange={(e) => handleFieldChange('current_stage', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {STAGES.map((stg) => (
                        <option key={stg.id} value={stg.id}>{stg.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Área Estimada Total (m²)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 350"
                      value={formData.area_m2 || ''}
                      onChange={(e) => handleFieldChange('area_m2', e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Número de Pavimentos
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.floors || 1}
                      onChange={(e) => handleFieldChange('floors', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Local / Bairro do Terreno
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Setor de Grandes Áreas"
                      value={formData.location}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: Estudos e Projetos Disponíveis */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-white">3. Estudos e Projetos Prévios Disponíveis</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.has_architectural_project}
                      onChange={(e) => handleFieldChange('has_architectural_project', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300 font-medium">Possui Projeto Arquitetônico</span>
                  </label>

                  <label className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.has_soil_report}
                      onChange={(e) => handleFieldChange('has_soil_report', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300 font-medium">Possui Laudo de Sondagem (SPT)</span>
                  </label>

                  <label className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.has_structural_project}
                      onChange={(e) => handleFieldChange('has_structural_project', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300 font-medium">Possui Estrutural Antigo (Reforma)</span>
                  </label>

                  <label className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.has_topography}
                      onChange={(e) => handleFieldChange('has_topography', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300 font-medium">Possui Levantamento Topográfico</span>
                  </label>
                </div>
              </div>

              {/* SEÇÃO 4: Descrição e Upload de Documentos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-white">4. Detalhamento e Anexo de Arquivos (PDF, PNG, JPG)</h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Descrição dos Objetivos da Obra / Demanda Técnica *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Descreva detalhes como: vão livre desejado, cargas especiais, altura do pé-direito, patologias observadas ou prazos pretendidos..."
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Upload Box */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Anexar Plantas, Croquis ou Fotos da Obra (Até 5 arquivos, máx. 25MB cada)
                  </label>

                  <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 text-center bg-slate-950/40 transition-colors">
                    <input
                      type="file"
                      id="proposal-files"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileSelection}
                      className="hidden"
                    />
                    <label htmlFor="proposal-files" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold text-white">Clique para selecionar arquivos ou arraste aqui</span>
                      <span className="text-xs text-slate-400">Formatos aceitos: PDF, Imagens (PNG, JPG, WEBP)</span>
                    </label>
                  </div>

                  {filesToUpload.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400">Arquivos selecionados ({filesToUpload.length}):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filesToUpload.map((f, i) => (
                          <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Paperclip className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              <span className="text-slate-200 truncate">{f.name}</span>
                              <span className="text-slate-500 text-[10px]">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(i)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Aviso Legal Preliminar */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Aviso Técnico Preliminar:</strong> As informações submetidas através deste formulário destinam-se exclusivamente ao pré-dimensionamento e levantamento de requisitos para emissão de proposta comercial e honorários. Não constituem cálculo ou projeto estrutural executivo definitivo.
                </p>
              </div>

              {/* Botão de Envio */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500 text-center sm:text-left">
                  * Campos obrigatórios para validação técnica inicial
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{uploadProgress || 'Processando envio...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Solicitação de Proposta</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
