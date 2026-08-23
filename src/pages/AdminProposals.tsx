// /src/pages/AdminProposals.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Building2,
  MapPin,
  Maximize2,
  Calendar,
  Layers,
  Phone,
  Mail,
  RefreshCw,
  X,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { useAuth } from '../context/AuthContext';
import { useContactSettings } from '../context/ContactSettingsContext';
import {
  ProposalRequest,
  ProposalStatus,
  ProposalPriority,
  ProposalProjectType,
  ProposalStructureType,
  ProposalServiceType,
  ProposalStage
} from '../types/proposals';
import { formatPhoneDisplay } from '../types/contactSettings';

const STATUS_LABELS: Record<ProposalStatus, { label: string; color: string; bg: string; border: string }> = {
  new: { label: 'Nova Solicitação', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  in_analysis: { label: 'Em Análise Técnica', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  awaiting_info: { label: 'Aguardando Info', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  drafting: { label: 'Em Elaboração', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  sent: { label: 'Proposta Enviada', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  converted: { label: 'Convertida / Fechada', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  closed: { label: 'Encerrada', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const PRIORITY_LABELS: Record<ProposalPriority, { label: string; color: string; badge: string }> = {
  low: { label: 'Baixa', color: 'text-slate-400', badge: 'bg-slate-800 text-slate-300' },
  normal: { label: 'Normal', color: 'text-blue-400', badge: 'bg-blue-900/40 text-blue-300' },
  high: { label: 'Alta', color: 'text-amber-400', badge: 'bg-amber-900/40 text-amber-300' },
  urgent: { label: 'Urgente', color: 'text-red-400', badge: 'bg-red-900/40 text-red-300' },
};

const PROJECT_TYPE_LABELS: Record<ProposalProjectType, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial',
  galpao: 'Galpão / Pavilhão',
  agronegocio: 'Agronegócio / Silos',
  institucional: 'Institucional / Público',
  misto: 'Uso Misto',
  outro: 'Outro Tipo',
};

const STRUCTURE_TYPE_LABELS: Record<ProposalStructureType, string> = {
  concreto_armado: 'Concreto Armado',
  metalica: 'Estrutura Metálica',
  mista: 'Mista (Aço + Concreto)',
  alvenaria_estrutural: 'Alvenaria Estrutural',
  madeira: 'Madeira / Engenheirada',
  pre_moldado: 'Pré-Moldado',
  reforco_estrutural: 'Reforço Estrutural',
  outro: 'Outro Sistema',
};

const SERVICE_TYPE_LABELS: Record<ProposalServiceType, string> = {
  projeto_estrutural: 'Projeto Estrutural Completo',
  pre_dimensionamento: 'Pré-Dimensionamento Técnico',
  avaliacao_estrutural: 'Avaliação Estrutural',
  pericia_tecnica: 'Perícia Técnica / Diagnóstico',
  laudo_vistoria: 'Laudo de Vistoria NBR',
  reforma_ampliacao: 'Reforma e Ampliação',
  reforco_estrutural: 'Reforço e Recuperação',
  consultoria_obra: 'Consultoria de Obra',
  outro: 'Outro Serviço',
};

const STAGE_LABELS: Record<ProposalStage, string> = {
  estudo_preliminar: 'Estudo Preliminar',
  anteprojeto: 'Anteprojeto em Definição',
  projeto_arquitetonico_pronto: 'Projeto Arquitetônico Concluído',
  obra_nao_iniciada: 'Terreno / Obra Não Iniciada',
  fundacao_em_andamento: 'Fundações em Andamento',
  estrutura_em_andamento: 'Estrutura em Andamento',
  reforma_edificacao_existente: 'Edificação Existente (Reforma)',
  patologia_ou_sinistro: 'Patologia / Sinistro Estrutural',
};

export default function AdminProposals() {
  const { user } = useAuth();
  const { getWhatsAppHref, formattedWhatsApp } = useContactSettings();
  const [proposals, setProposals] = useState<ProposalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<ProposalRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await supabaseDatabase.getProposalRequests();
      setProposals(data);
    } catch (err) {
      console.error('Erro ao buscar propostas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch =
        p.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.requester_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.company_name && p.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [proposals, searchTerm, statusFilter, priorityFilter]);

  const handleOpenDetail = (proposal: ProposalRequest) => {
    setSelectedProposal(proposal);
    setAdminNotesInput(proposal.admin_notes || '');
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = async (proposalId: string, newStatus: ProposalStatus) => {
    try {
      await supabaseDatabase.updateProposalRequest(
        proposalId,
        { status: newStatus },
        user?.id
      );
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: newStatus } : p))
      );
      if (selectedProposal && selectedProposal.id === proposalId) {
        setSelectedProposal({ ...selectedProposal, status: newStatus });
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleUpdatePriority = async (proposalId: string, newPriority: ProposalPriority) => {
    try {
      await supabaseDatabase.updateProposalRequest(
        proposalId,
        { priority: newPriority },
        user?.id
      );
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, priority: newPriority } : p))
      );
      if (selectedProposal && selectedProposal.id === proposalId) {
        setSelectedProposal({ ...selectedProposal, priority: newPriority });
      }
    } catch (err) {
      console.error('Erro ao atualizar prioridade:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedProposal) return;
    try {
      setIsSavingNotes(true);
      await supabaseDatabase.updateProposalRequest(
        selectedProposal.id,
        { admin_notes: adminNotesInput.trim() || null },
        user?.id
      );
      setSelectedProposal({ ...selectedProposal, admin_notes: adminNotesInput.trim() || null });
      setProposals((prev) =>
        prev.map((p) => (p.id === selectedProposal.id ? { ...p, admin_notes: adminNotesInput.trim() || null } : p))
      );
    } catch (err) {
      console.error('Erro ao salvar observações:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    try {
      // Remove arquivos vinculados do storage
      const propToDelete = proposals.find((p) => p.id === proposalId);
      if (propToDelete && propToDelete.attachments && propToDelete.attachments.length > 0) {
        for (const att of propToDelete.attachments) {
          if (att.path) {
            await supabaseStorage.deleteProposalAttachment(att.path);
          }
        }
      }

      await supabaseDatabase.deleteProposalRequest(proposalId, user?.id);
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      if (selectedProposal?.id === proposalId) {
        setIsDetailModalOpen(false);
        setSelectedProposal(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Erro ao excluir proposta:', err);
    }
  };

  // Métricas rápidas
  const metrics = useMemo(() => {
    const total = proposals.length;
    const news = proposals.filter((p) => p.status === 'new').length;
    const inAnalysis = proposals.filter((p) => p.status === 'in_analysis' || p.status === 'drafting').length;
    const converted = proposals.filter((p) => p.status === 'converted').length;
    return { total, news, inAnalysis, converted };
  }, [proposals]);

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm tracking-wider uppercase">
            <FileText className="w-4 h-4" />
            <span>Engenharia e Propostas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Propostas e Pré-Dimensionamento
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerenciamento e triagem técnica de solicitações de orçamento, croquis e plantas recebidas.
          </p>
        </div>

        <button
          onClick={fetchProposals}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total de Solicitações</span>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{metrics.total}</div>
        </div>
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 sm:p-5">
          <span className="text-amber-400 text-xs uppercase tracking-wider font-semibold">Novas / Pendentes</span>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">{metrics.news}</div>
        </div>
        <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 sm:p-5">
          <span className="text-blue-400 text-xs uppercase tracking-wider font-semibold">Em Análise / Estudo</span>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 mt-1">{metrics.inAnalysis}</div>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 sm:p-5">
          <span className="text-emerald-400 text-xs uppercase tracking-wider font-semibold">Convertidas / Obras</span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">{metrics.converted}</div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por solicitante, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos os Status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas as Prioridades</option>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista / Tabela de Solicitações */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
            <p className="text-sm">Carregando solicitações de propostas do Supabase...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">Nenhuma proposta encontrada</p>
            <p className="text-xs text-slate-500 mt-1">Quando visitantes enviarem o formulário técnico, elas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Solicitante & Local</th>
                  <th className="py-3.5 px-4">Tipo & Estrutura</th>
                  <th className="py-3.5 px-4">Serviço Desejado</th>
                  <th className="py-3.5 px-4">Área / Pav.</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Prioridade</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredProposals.map((p) => {
                  const statusInfo = STATUS_LABELS[p.status] || STATUS_LABELS.new;
                  const priorityInfo = PRIORITY_LABELS[p.priority] || PRIORITY_LABELS.normal;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">{p.requester_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{p.city} - {p.state}</span>
                        </div>
                        {p.company_name && (
                          <div className="text-xs text-amber-500/80 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span>{p.company_name}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-medium">{PROJECT_TYPE_LABELS[p.project_type] || p.project_type}</div>
                        <div className="text-xs text-slate-400">{STRUCTURE_TYPE_LABELS[p.structure_type] || p.structure_type}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-slate-300 text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
                          {SERVICE_TYPE_LABELS[p.service_type] || p.service_type}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-slate-300">{p.area_m2 ? `${p.area_m2} m²` : 'Não informada'}</div>
                        <div className="text-xs text-slate-500">{p.floors ? `${p.floors} pav.` : '1 pav.'}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${priorityInfo.badge}`}>
                          {priorityInfo.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(p)}
                            title="Visualizar e Gerenciar"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            title="Excluir"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Proposta */}
      {isDetailModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-8">
            {/* Topo do Modal */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_LABELS[selectedProposal.status]?.bg} ${STATUS_LABELS[selectedProposal.status]?.color} ${STATUS_LABELS[selectedProposal.status]?.border}`}>
                    {STATUS_LABELS[selectedProposal.status]?.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    ID: {selectedProposal.id} • {new Date(selectedProposal.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedProposal.requester_name}</h2>
                {selectedProposal.company_name && (
                  <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{selectedProposal.company_name}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
              {/* Controles de Status e Prioridade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alterar Status
                  </label>
                  <select
                    value={selectedProposal.status}
                    onChange={(e) => handleUpdateStatus(selectedProposal.id, e.target.value as ProposalStatus)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alterar Prioridade
                  </label>
                  <select
                    value={selectedProposal.priority}
                    onChange={(e) => handleUpdatePriority(selectedProposal.id, e.target.value as ProposalPriority)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Informações do Solicitante */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  1. Dados do Solicitante
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">E-mail</span>
                    <a href={`mailto:${selectedProposal.requester_email}`} className="text-white hover:text-amber-400 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{selectedProposal.requester_email}</span>
                    </a>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">Telefone / Ligação</span>
                    <a href={`tel:${selectedProposal.requester_phone.replace(/\D/g, '')}`} className="text-white hover:text-amber-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatPhoneDisplay(selectedProposal.requester_phone)}</span>
                    </a>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">WhatsApp de Retorno</span>
                    <a
                      href={`https://wa.me/55${(selectedProposal.requester_whatsapp || selectedProposal.requester_phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${selectedProposal.requester_name}! Aqui é da Engenharia Civil Engª Jucélia Santana referente à sua solicitação de proposta para ${selectedProposal.city}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 mt-0.5 font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Iniciar Atendimento</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Dados da Obra & Pré-Dimensionamento */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  2. Dados Técnicos da Edificação
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">Tipo de Obra</span>
                    <span className="text-white font-medium">{PROJECT_TYPE_LABELS[selectedProposal.project_type] || selectedProposal.project_type}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">Sistema Estrutural</span>
                    <span className="text-white font-medium">{STRUCTURE_TYPE_LABELS[selectedProposal.structure_type] || selectedProposal.structure_type}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">Área Estimada</span>
                    <span className="text-white font-medium">{selectedProposal.area_m2 ? `${selectedProposal.area_m2} m²` : 'N/D'}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">Pavimentos</span>
                    <span className="text-white font-medium">{selectedProposal.floors || 1} pav.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">Localização / Terreno</span>
                    <span className="text-white">{selectedProposal.location}, {selectedProposal.city} - {selectedProposal.state}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-500 block">Estágio Atual da Obra</span>
                    <span className="text-white">{STAGE_LABELS[selectedProposal.current_stage] || selectedProposal.current_stage}</span>
                  </div>
                </div>
              </div>

              {/* Checklist de Documentos Prévios */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  3. Disponibilidade de Estudos e Projetos Prévios
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${selectedProposal.has_architectural_project ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${selectedProposal.has_architectural_project ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Proj. Arquitetônico</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${selectedProposal.has_soil_report ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${selectedProposal.has_soil_report ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Sondagem do Solo</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${selectedProposal.has_structural_project ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${selectedProposal.has_structural_project ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Proj. Estrutural Antigo</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${selectedProposal.has_topography ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${selectedProposal.has_topography ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Topografia</span>
                  </div>
                </div>
              </div>

              {/* Descrição e Requisitos do Solicitante */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  4. Descrição da Demanda / Observações do Cliente
                </h3>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
                  {selectedProposal.description || 'Nenhuma descrição adicional informada.'}
                </div>
                {selectedProposal.technical_notes && (
                  <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-200/90 text-xs">
                    <strong>Notas Técnicas Adicionais:</strong> {selectedProposal.technical_notes}
                  </div>
                )}
              </div>

              {/* Arquivos / Croquis Anexados */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  5. Arquivos e Plantas Anexadas ({selectedProposal.attachments?.length || 0})
                </h3>
                {selectedProposal.attachments && selectedProposal.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProposal.attachments.map((file, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <span className="text-xs font-medium text-slate-200 block truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors flex-shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Abrir</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">O solicitante não anexou arquivos para esta proposta.</p>
                )}
              </div>

              {/* Observações Internas da Engenharia */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  6. Parecer Técnico Interno / Observações Administrativas
                </h3>
                <textarea
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  rows={3}
                  placeholder="Insira notas internas, estimativa de honorários, data de visita ou checklist de cálculo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isSavingNotes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Salvar Notas Internas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
              <button
                onClick={() => setDeleteConfirmId(selectedProposal.id)}
                className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Proposta</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Excluir Solicitação de Proposta?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Esta ação removerá permanentemente os dados da solicitação e os arquivos anexados no Storage.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProposal(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
