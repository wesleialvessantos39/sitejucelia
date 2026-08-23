// /src/pages/AdminDomains.tsx
import React, { useState, useEffect, useId } from 'react';
import {
  Globe,
  Plus,
  ExternalLink,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Info,
  Server,
  Link as LinkIcon,
  Search,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { useAuth } from '../context/AuthContext';
import { useDomain } from '../context/DomainContext';
import type { SiteDomain, CreateDomainInput, UpdateDomainInput } from '../types/domain';
import { normalizeDomain, validateDomain, formatDomainUrl, formatDatabaseErrorMessage } from '../utils/domainUtils';

type FilterStatus = 'all' | 'active' | 'inactive' | 'primary';
type SortOption = 'created_desc' | 'updated_desc' | 'domain_asc' | 'domain_desc';

export default function AdminDomains() {
  const { user } = useAuth();
  const { hostname, isDevelopment, currentDomain, refreshDomain } = useDomain();
  const [domains, setDomains] = useState<SiteDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Clipboard copy feedback state
  const [copiedState, setCopiedState] = useState<{ id: string; type: 'domain' | 'url' } | null>(null);

  // Accessibility IDs
  const domainInputId = useId();
  const labelInputId = useId();
  const descriptionInputId = useId();
  const isActiveInputId = useId();
  const isPrimaryInputId = useId();
  const sortSelectId = useId();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<SiteDomain | null>(null);
  const [formData, setFormData] = useState<{
    domain: string;
    label: string;
    description: string;
    is_active: boolean;
    is_primary: boolean;
  }>({
    domain: '',
    label: 'Site Principal',
    description: '',
    is_active: true,
    is_primary: false,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmDomain, setDeleteConfirmDomain] = useState<SiteDomain | null>(null);
  const [deactivatePrimaryConfirm, setDeactivatePrimaryConfirm] = useState<SiteDomain | null>(null);
  const [openInactiveConfirm, setOpenInactiveConfirm] = useState<SiteDomain | null>(null);

  // Carrega lista de domínios cadastrados no Supabase
  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await supabaseDatabase.getSiteDomains();
      setDomains(data);
    } catch (err: any) {
      console.error('Erro ao carregar domínios:', err);
      setFeedback({
        type: 'error',
        message: formatDatabaseErrorMessage(err) || 'Não foi possível carregar a lista de domínios cadastrados.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  // Copiar domínio ou URL com feedback
  const handleCopy = async (id: string, text: string, type: 'domain' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState({ id, type });
      setFeedback({
        type: 'info',
        message: type === 'domain' ? 'Domínio copiado para a área de transferência.' : 'Endereço do site copiado para a área de transferência.',
      });
      setTimeout(() => {
        setCopiedState(null);
      }, 3000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  // Abre modal para novo cadastro
  const handleOpenCreateModal = () => {
    setEditingDomain(null);
    setFormData({
      domain: '',
      label: domains.length === 0 ? 'Domínio Principal' : 'Domínio Adicional',
      description: '',
      is_active: true,
      is_primary: domains.length === 0, // Se for o primeiro, sugere como principal
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Abre modal para edição
  const handleOpenEditModal = (item: SiteDomain) => {
    setEditingDomain(item);
    setFormData({
      domain: item.domain,
      label: item.label,
      description: item.description || '',
      is_active: item.is_active,
      is_primary: item.is_primary,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Salva domínio (novo ou edição)
  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validação de formato e regras
    const validation = validateDomain(formData.domain);
    if (!validation.isValid) {
      setFormError(validation.error || 'Formato de domínio inválido.');
      return;
    }

    try {
      setActionLoading(true);

      if (editingDomain) {
        // Atualização de registro existente
        const updatePayload: UpdateDomainInput = {
          domain: formData.domain.trim(),
          label: formData.label.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
          is_primary: formData.is_primary,
        };

        const updated = await supabaseDatabase.updateSiteDomain(
          editingDomain.id,
          updatePayload,
          user?.id,
          user?.email
        );

        setFeedback({
          type: 'success',
          message: `Domínio "${updated.domain}" atualizado com sucesso!`,
        });
      } else {
        // Criação de novo registro
        const createPayload: CreateDomainInput = {
          domain: formData.domain.trim(),
          label: formData.label.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
          is_primary: formData.is_primary,
        };

        const created = await supabaseDatabase.createSiteDomain(
          createPayload,
          user?.id,
          user?.email
        );

        setFeedback({
          type: 'success',
          message: `Domínio "${created.domain}" cadastrado com sucesso!`,
        });
      }

      setIsModalOpen(false);
      await loadDomains();
      await refreshDomain();
    } catch (err: any) {
      console.error('Erro ao salvar domínio:', err);
      setFormError(formatDatabaseErrorMessage(err) || 'Ocorreu um erro ao salvar o domínio no banco de dados.');
    } finally {
      setActionLoading(false);
    }
  };

  // Define domínio como principal
  const handleSetPrimary = async (item: SiteDomain) => {
    if (item.is_primary) return;

    try {
      setActionLoading(true);
      await supabaseDatabase.setPrimarySiteDomain(item.id, user?.id, user?.email);
      setFeedback({
        type: 'success',
        message: `"${item.domain}" definido como o Domínio Principal com sucesso!`,
      });
      await loadDomains();
      await refreshDomain();
    } catch (err: any) {
      console.error('Erro ao definir domínio principal:', err);
      setFeedback({
        type: 'error',
        message: formatDatabaseErrorMessage(err) || 'Falha ao definir o domínio como principal.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Alterna status ativo / inativo com proteção
  const handleToggleStatusClick = (item: SiteDomain) => {
    // Se for o domínio principal e estiver sendo desativado, solicita confirmação
    if (item.is_primary && item.is_active) {
      setDeactivatePrimaryConfirm(item);
      return;
    }

    executeToggleStatus(item, !item.is_active);
  };

  const executeToggleStatus = async (item: SiteDomain, newStatus: boolean) => {
    try {
      setActionLoading(true);
      await supabaseDatabase.toggleSiteDomainStatus(item.id, newStatus, user?.id, user?.email);
      setFeedback({
        type: 'success',
        message: `Domínio "${item.domain}" ${newStatus ? 'ativado' : 'desativado'} com sucesso!`,
      });
      setDeactivatePrimaryConfirm(null);
      await loadDomains();
      await refreshDomain();
    } catch (err: any) {
      console.error('Erro ao alternar status do domínio:', err);
      setFeedback({
        type: 'error',
        message: formatDatabaseErrorMessage(err) || 'Falha ao alterar status do domínio.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmação de exclusão
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmDomain) return;

    try {
      setActionLoading(true);
      await supabaseDatabase.deleteSiteDomain(deleteConfirmDomain.id, user?.id, user?.email);
      setFeedback({
        type: 'success',
        message: `Domínio "${deleteConfirmDomain.domain}" removido com sucesso!`,
      });
      setDeleteConfirmDomain(null);
      await loadDomains();
      await refreshDomain();
    } catch (err: any) {
      console.error('Erro ao excluir domínio:', err);
      setFeedback({
        type: 'error',
        message: formatDatabaseErrorMessage(err) || 'Falha ao excluir o domínio.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Abertura de site com validação de status ativo/inativo (Item 18)
  const handleOpenSite = (item: SiteDomain) => {
    const url = formatDomainUrl(item.domain, true);
    if (item.is_active) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setOpenInactiveConfirm(item);
    }
  };

  // Métricas
  const totalDomains = domains.length;
  const activeDomains = domains.filter((d) => d.is_active).length;
  const inactiveDomains = totalDomains - activeDomains;
  const primaryDomain = domains.find((d) => d.is_primary);

  // Filtragem e Ordenação
  const processedDomains = domains
    .filter((d) => {
      // Filtro de busca textual
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        d.domain.toLowerCase().includes(term) ||
        d.normalized_domain.toLowerCase().includes(term) ||
        d.label.toLowerCase().includes(term) ||
        (d.description && d.description.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // Filtro de status
      if (statusFilter === 'active') return d.is_active;
      if (statusFilter === 'inactive') return !d.is_active;
      if (statusFilter === 'primary') return d.is_primary;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'updated_desc') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === 'domain_asc') {
        return a.domain.localeCompare(b.domain);
      }
      if (sortBy === 'domain_desc') {
        return b.domain.localeCompare(a.domain);
      }
      return 0;
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Gerenciamento de Domínios do Site
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre, controle e gerencie os domínios oficiais e endereços de acesso ao portal e site institucional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDomains}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#0B1526] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C5A059]' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C5A059] text-[#070D18] font-bold text-sm hover:bg-[#d4b06a] transition-all shadow-lg shadow-[#C5A059]/10"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Domínio</span>
          </button>
        </div>
      </div>

      {/* Barra de Status do Hostname Atual da Sessão (Etapa 18.4) */}
      <div className="p-3.5 bg-[#0B1526]/90 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 block sm:inline">Hostname Atual: </span>
            <code className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 ml-0 sm:ml-1 font-semibold">
              {hostname || 'localhost'}
            </code>
            <span className="text-slate-400 ml-2 hidden md:inline">
              ({isDevelopment ? 'Ambiente de Desenvolvimento / Preview' : (currentDomain ? 'Domínio Oficial Reconhecido' : 'Domínio Padrão')})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          <span className="text-emerald-400/90 font-medium">● Sincronizado via Supabase</span>
        </div>
      </div>

      {/* Banner de Detecção Automática de Domínio Customizado não cadastrado */}
      {!isDevelopment && hostname && !currentDomain && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-[#C5A059]/10 to-amber-500/5 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
              <Globe className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Novo Domínio Detectado no Acesso
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Ação Recomendada
                </span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você está acessando a aplicação pelo endereço <code className="text-amber-300 font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded">{hostname}</code>. Deseja cadastrá-lo como Domínio Oficial no Supabase para sincronização total de URLs canônicas, SEO e identidade?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingDomain(null);
              setFormData({
                domain: hostname,
                label: 'Domínio Principal',
                description: 'Domínio próprio vinculado e detectado em produção',
                is_active: true,
                is_primary: true,
              });
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#C5A059] text-black font-bold text-xs hover:bg-[#d4b06a] transition-all whitespace-nowrap shrink-0 shadow-md flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar {hostname}</span>
          </button>
        </div>
      )}

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              : 'bg-sky-500/10 border-sky-500/20 text-sky-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {feedback.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            {feedback.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 hover:underline shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Domínios */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Cadastrado
            </span>
            <div className="text-2xl font-black text-white mt-1">{totalDomains}</div>
            <span className="text-[11px] text-slate-500">Endereços mapeados</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center">
            <Server className="w-6 h-6 text-[#C5A059]" />
          </div>
        </div>

        {/* Domínio Principal */}
        <div className="bg-[#0B1526] border border-[#C5A059]/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059]" />
              <span className="text-xs font-semibold text-[#C5A059] uppercase tracking-wider">
                Domínio Principal
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-1 truncate" title={primaryDomain?.domain || 'Não configurado'}>
              {primaryDomain ? primaryDomain.domain : 'Não configurado'}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              {primaryDomain ? '● Conectado ao Portal' : 'Defina um domínio principal'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        {/* Domínios Ativos */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Domínios Ativos
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{activeDomains}</div>
            <span className="text-[11px] text-slate-500">{inactiveDomains} inativo(s)</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Status & Protocolo */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Segurança & SSL
            </span>
            <div className="text-sm font-bold text-sky-400 mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>HTTPS Oficial</span>
            </div>
            <span className="text-[11px] text-slate-500">Cadastrado no painel</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtro, Busca e Ordenação */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por domínio, identificação ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#070D18] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] transition-all"
            />
          </div>

          {/* Filtros por Status (Tabs) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[#C5A059] text-[#070D18]'
                  : 'bg-[#070D18] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              Todos ({totalDomains})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'active'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#070D18] text-slate-400 hover:text-emerald-400 border border-white/5'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ativos ({activeDomains})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'inactive'
                  ? 'bg-slate-600 text-white'
                  : 'bg-[#070D18] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Inativos ({inactiveDomains})
            </button>
            <button
              onClick={() => setStatusFilter('primary')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'primary'
                  ? 'bg-[#C5A059] text-[#070D18]'
                  : 'bg-[#070D18] text-slate-400 hover:text-[#C5A059] border border-white/5'
              }`}
            >
              <Star className="w-3 h-3" />
              Principal ({primaryDomain ? 1 : 0})
            </button>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <label htmlFor={sortSelectId} className="sr-only">Ordenar por</label>
            <select
              id={sortSelectId}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#070D18] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#C5A059]"
            >
              <option value="created_desc">Mais Recentes</option>
              <option value="updated_desc">Atualizados Recentemente</option>
              <option value="domain_asc">Nome (A - Z)</option>
              <option value="domain_desc">Nome (Z - A)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-1 flex items-center justify-between border-t border-white/5">
          <span>Exibindo <strong>{processedDomains.length}</strong> de <strong>{totalDomains}</strong> domínios cadastrados</span>
          <span className="text-[11px] text-slate-500">Supabase PostgreSQL • RLS Ativa</span>
        </div>
      </div>

      {/* Lista de Domínios */}
      {loading ? (
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin" />
          <p className="text-sm text-slate-400">Carregando domínios do banco de dados...</p>
        </div>
      ) : processedDomains.length === 0 ? (
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {searchTerm || statusFilter !== 'all'
                ? 'Nenhum domínio encontrado para os filtros selecionados'
                : 'Nenhum domínio cadastrado ainda'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Ajuste os termos de busca ou alterne os filtros de status.'
                : 'Cadastre o domínio oficial (ex: juceliasantanaengencivil.com.br) para que o sistema registre e controle os acessos.'}
            </p>
          </div>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5A059] text-[#070D18] font-bold text-xs hover:bg-[#d4b06a] transition-all mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Domínio</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {processedDomains.map((item) => {
            const domainUrl = formatDomainUrl(item.domain, true);
            const isDomainCopied = copiedState?.id === item.id && copiedState?.type === 'domain';
            const isUrlCopied = copiedState?.id === item.id && copiedState?.type === 'url';

            return (
              <div
                key={item.id}
                className={`bg-[#0B1526] border rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:border-white/20 ${
                  item.is_primary
                    ? 'border-[#C5A059]/40 bg-[#0B1526]/95 shadow-md shadow-[#C5A059]/5 ring-1 ring-[#C5A059]/20'
                    : 'border-white/10'
                }`}
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  {/* Informações Principais do Domínio */}
                  <div className="space-y-2.5 min-w-0 flex-1">
                    {/* Badges de Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Selo Principal */}
                      {item.is_primary && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                          <Star className="w-3 h-3 fill-[#C5A059]" />
                          Domínio Principal
                        </span>
                      )}

                      {/* Status Ativo / Inativo / Pendente */}
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          🟢 Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          ⚪ Inativo
                        </span>
                      )}

                      {/* SSL Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        HTTPS / SSL
                      </span>

                      {/* Rótulo / Identificação */}
                      <span className="text-xs text-slate-400 font-medium">
                        • {item.label}
                      </span>
                    </div>

                    {/* Linha do Domínio e Cópias Rápidas */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#070D18] border border-white/10 text-[#C5A059] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Globe className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight break-all">
                            {item.domain}
                          </h2>

                          {/* Botão Copiar Domínio */}
                          <button
                            onClick={() => handleCopy(item.id, item.domain, 'domain')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#070D18] border border-white/10 text-[11px] text-slate-300 hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all"
                            title="Copiar domínio"
                          >
                            {isDomainCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>

                          {/* Botão Copiar URL Completa */}
                          <button
                            onClick={() => handleCopy(item.id, domainUrl, 'url')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#070D18] border border-white/10 text-[11px] text-slate-400 hover:text-sky-300 hover:border-sky-500/30 transition-all"
                            title="Copiar endereço completo com HTTPS"
                          >
                            {isUrlCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">URL Copiada</span>
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-3 h-3" />
                                <span>Copiar URL</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-400 mt-0.5">
                          Normalizado: <code className="text-slate-300 bg-black/40 px-1.5 py-0.5 rounded text-[11px] font-mono">{item.normalized_domain}</code>
                        </p>
                      </div>
                    </div>

                    {/* Descrição se houver */}
                    {item.description && (
                      <p className="text-xs text-slate-400 pl-0 sm:pl-13 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Datas de Cadastro e Atualização */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pl-0 sm:pl-13 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Cadastrado: {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span>•</span>
                      <span>Atualizado: {new Date(item.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Ações do Domínio */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 xl:pt-0 border-t xl:border-t-0 border-white/5 justify-start xl:justify-end">
                    {/* Botão ABRIR SITE */}
                    <button
                      type="button"
                      onClick={() => handleOpenSite(item)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                        item.is_active
                          ? 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20 text-sky-400'
                          : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                      title={
                        item.is_active
                          ? 'Abrir este domínio em uma nova aba'
                          : 'Domínio inativo no painel. Clique para ver opções de abertura.'
                      }
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ABRIR SITE</span>
                    </button>

                    {/* Botão Definir como Principal */}
                    {!item.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(item)}
                        disabled={actionLoading || !item.is_active}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-[#C5A059]/15 border border-white/10 hover:border-[#C5A059]/30 text-xs font-semibold text-slate-300 hover:text-[#C5A059] transition-all disabled:opacity-40"
                        title={
                          !item.is_active
                            ? 'Ative o domínio antes de defini-lo como principal.'
                            : 'Tornar este o domínio oficial do site'
                        }
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Definir como Principal</span>
                      </button>
                    )}

                    {/* Botão Alternar Ativo/Inativo */}
                    <button
                      onClick={() => handleToggleStatusClick(item)}
                      disabled={actionLoading}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 ${
                        item.is_active
                          ? 'bg-slate-500/10 hover:bg-rose-500/15 border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                      }`}
                      title={item.is_active ? 'Desativar domínio' : 'Ativar domínio'}
                    >
                      {item.is_active ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Desativar</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>

                    {/* Botão Editar */}
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      disabled={actionLoading}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                      title="Editar informações do domínio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Botão Excluir */}
                    <button
                      onClick={() => setDeleteConfirmDomain(item)}
                      disabled={actionLoading}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 transition-all disabled:opacity-50"
                      title="Excluir domínio"
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

      {/* Caixa de Esclarecimento Técnico, Sincronização Supabase e Boas Práticas */}
      <div className="bg-[#0B1526]/80 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-slate-200 text-sm font-bold">
            <Info className="w-4 h-4 text-[#C5A059]" />
            <span>Guia Técnico: Sincronização de Domínios, Supabase e Roteamento SPA</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            Produção & Hospedagem
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Roteamento SPA & Erro 404 */}
          <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#C5A059]">
              <Layers className="w-3.5 h-3.5" />
              <span>1. Recarregamento Sem Erro 404</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O projeto possui regras ativas de reescrita em <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">vercel.json</code> e <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">_redirects</code>. Ao recarregar páginas em qualquer rota interna (como <code className="text-slate-300">/admin/analytics</code> ou <code className="text-slate-300">/galeria</code>), o servidor web redireciona automaticamente para o <code className="text-white font-mono">index.html</code> da aplicação React.
            </p>
          </div>

          {/* Card 2: Sincronização com Supabase */}
          <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
              <Server className="w-3.5 h-3.5" />
              <span>2. Sincronização de Dados no Supabase</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Todos os dados do site (projetos, artigos, laudos, fotos, textos e contatos) residem no mesmo banco PostgreSQL do Supabase. Todos os domínios compartilham a mesma base de dados instantaneamente em tempo real.
            </p>
          </div>

          {/* Card 3: Configuração de Auth no Supabase */}
          <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. URL de Autenticação do Domínio</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Para login administrativo e recuperação de senha funcionarem no novo domínio, adicione o endereço em seu <strong className="text-slate-300">Supabase Dashboard → Authentication → URL Configuration → Redirect URLs</strong> (ex: <code className="text-white font-mono text-[10px]">https://seusite.com.br/**</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header do Modal */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingDomain ? 'Editar Domínio' : 'Cadastrar Novo Domínio'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingDomain ? 'Atualize os dados e configurações do domínio.' : 'Informe o endereço e identificação do domínio.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={actionLoading}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDomain} className="p-5 space-y-4">
              {/* Alerta de erro */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Campo Domínio */}
              <div className="space-y-1.5">
                <label htmlFor={domainInputId} className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Nome do Domínio <span className="text-[#C5A059]">*</span></span>
                  <span className="text-[11px] text-slate-500 font-normal">Ex: juceliasantanaengencivil.com.br</span>
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id={domainInputId}
                    type="text"
                    required
                    placeholder="ex: juceliasantanaengencivil.com.br"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#070D18] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] transition-all"
                  />
                </div>
                {formData.domain && (
                  <p className="text-[11px] text-slate-400">
                    Normalizado: <code className="text-[#C5A059] font-mono">{normalizeDomain(formData.domain) || '...'}</code>
                  </p>
                )}
              </div>

              {/* Campo Rótulo / Identificação */}
              <div className="space-y-1.5">
                <label htmlFor={labelInputId} className="text-xs font-semibold text-slate-300">
                  Rótulo / Identificação <span className="text-[#C5A059]">*</span>
                </label>
                <input
                  id={labelInputId}
                  type="text"
                  required
                  placeholder="Ex: Site Oficial, Domínio Principal, Landing Page"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#070D18] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] transition-all"
                />
              </div>

              {/* Campo Descrição */}
              <div className="space-y-1.5">
                <label htmlFor={descriptionInputId} className="text-xs font-semibold text-slate-300">
                  Descrição / Observações (Opcional)
                </label>
                <textarea
                  id={descriptionInputId}
                  rows={2}
                  placeholder="Anotações internas sobre provedor, DNS ou finalidade deste domínio..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#070D18] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] transition-all resize-none"
                />
              </div>

              {/* Checkboxes de Configuração */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <label htmlFor={isActiveInputId} className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    id={isActiveInputId}
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#070D18] border-white/20 text-[#C5A059] focus:ring-[#C5A059] focus:ring-offset-0"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Domínio Ativo</div>
                    <div className="text-[11px] text-slate-400">Permite requisições e apontamentos por este endereço</div>
                  </div>
                </label>

                <label htmlFor={isPrimaryInputId} className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    id={isPrimaryInputId}
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#070D18] border-white/20 text-[#C5A059] focus:ring-[#C5A059] focus:ring-offset-0"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#C5A059] flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#C5A059]" />
                      Definir como Domínio Principal
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Irá substituir o domínio principal atual e passará a ser a URL oficial do site
                    </div>
                  </div>
                </label>
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C5A059] text-[#070D18] font-bold text-xs hover:bg-[#d4b06a] transition-all disabled:opacity-50 shadow-lg shadow-[#C5A059]/10"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingDomain ? 'Salvar Alterações' : 'Cadastrar Domínio'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-rose-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-base font-bold text-white">Excluir Domínio?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Este domínio será removido do gerenciamento do site. Deseja continuar?
                </p>
                <div className="p-2.5 rounded-xl bg-[#070D18] border border-white/10 text-xs text-white font-mono">
                  {deleteConfirmDomain.domain}
                </div>
                {deleteConfirmDomain.is_primary && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-left flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Atenção:</strong> Este é o domínio principal atual. Ao excluí-lo, defina outro domínio como principal para manter os acessos canônicos.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmDomain(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <span>Confirmar Exclusão</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Desativar Domínio Principal */}
      {deactivatePrimaryConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-base font-bold text-white">Desativar Domínio Principal?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O domínio <strong className="text-white">"{deactivatePrimaryConfirm.domain}"</strong> está configurado como o Domínio Principal do site. Ao desativá-lo, o portal ficará temporariamente sem um domínio principal ativo até que outro seja definido.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeactivatePrimaryConfirm(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => executeToggleStatus(deactivatePrimaryConfirm, false)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#070D18] font-bold text-xs transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Desativando...</span>
                    </>
                  ) : (
                    <span>Confirmar Desativação</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Abertura de Domínio Inativo (Item 18) */}
      {openInactiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-sky-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                <ExternalLink className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-base font-bold text-white">Abrir Domínio Inativo?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O domínio <strong className="text-white">"{openInactiveConfirm.domain}"</strong> está atualmente marcado como <span className="text-slate-400 font-semibold">Inativo</span> no painel. O servidor ou DNS podem recusar ou redirecionar a conexão enquanto estiver inativo.
                </p>
                <div className="p-2.5 rounded-xl bg-[#070D18] border border-white/10 text-xs text-slate-300 font-mono break-all">
                  {formatDomainUrl(openInactiveConfirm.domain, true)}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpenInactiveConfirm(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = formatDomainUrl(openInactiveConfirm.domain, true);
                    window.open(url, '_blank', 'noopener,noreferrer');
                    setOpenInactiveConfirm(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Mesmo Assim</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
