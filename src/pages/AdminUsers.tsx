// /src/pages/AdminUsers.tsx
import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  User,
  Search,
  RefreshCw,
  Crown,
  UserCheck,
  UserX,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Calendar,
  Mail,
  Phone,
  Trash2,
  ArrowUpDown,
  UserMinus,
  UserPlus,
  Palette,
  FileText,
  Ticket,
  Sliders,
  Eye,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseUsers, UserProfileRow } from '../services/supabaseUsers';
import { supabaseDatabase, AuditLogRow } from '../services/supabaseDatabase';
import { formatAuditAction, HumanizedAuditItem } from '../utils/auditFormatter';

export default function AdminUsers() {
  const { user: currentUser, profile: currentProfile, isAdmin, refreshProfile } = useAuth();

  const [profiles, setProfiles] = useState<UserProfileRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros de busca e visualização rápida
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'admin' | 'user' | 'active' | 'suspended'>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

  // Filtros específicos da aba de Auditoria
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'all' | 'users' | 'theme' | 'documents' | 'invites' | 'content'>('all');
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>('');

  // Modais de confirmação e ação
  const [selectedUser, setSelectedUser] = useState<UserProfileRow | null>(null);
  const [modalAction, setModalAction] = useState<'promote' | 'demote' | 'activate' | 'suspend' | 'delete' | 'details' | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Estados para Exclusão de Registros de Auditoria (com deleção real no Banco)
  const [selectedAuditLogIds, setSelectedAuditLogIds] = useState<string[]>([]);
  const [logToDelete, setLogToDelete] = useState<AuditLogRow | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState<boolean>(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [auditActionLoading, setAuditActionLoading] = useState<boolean>(false);

  // Carrega lista de usuários e auditoria
  const loadData = async () => {
    setRefreshing(true);
    setErrorMsg(null);
    try {
      const [allProfiles, logs] = await Promise.all([
        supabaseUsers.getAllProfiles(),
        supabaseDatabase.getAuditLogs(60),
      ]);
      setProfiles(allProfiles);
      setAuditLogs(logs || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados de usuários:', err);
      setErrorMsg(err.message || 'Falha ao buscar a lista de usuários no servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Limpa mensagens de sucesso após 5 segundos
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Contadores
  const totalUsers = profiles.length;
  const countAdmins = profiles.filter((p) => p.role === 'admin' && p.active && p.status === 'active').length;
  const countUsers = profiles.filter((p) => p.role !== 'admin').length;
  const countActive = profiles.filter((p) => p.active && p.status === 'active').length;
  const countSuspended = profiles.filter((p) => !p.active || p.status === 'suspended').length;

  // Filtra lista de usuários
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.crea || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (quickFilter === 'admin') return p.role === 'admin';
    if (quickFilter === 'user') return p.role !== 'admin';
    if (quickFilter === 'active') return p.active && p.status === 'active';
    if (quickFilter === 'suspended') return !p.active || p.status === 'suspended';
    return true;
  });

  // Filtra e humaniza os logs de auditoria
  const humanizedAuditList = auditLogs.map((log) => {
    const formatted = formatAuditAction(log.action, log.details, log.entity_type);
    return {
      ...log,
      humanized: formatted,
    };
  }).filter((item) => {
    if (auditCategoryFilter !== 'all' && item.humanized.category !== auditCategoryFilter) {
      return false;
    }
    if (auditSearchTerm.trim() !== '') {
      const term = auditSearchTerm.toLowerCase();
      const matchTitle = item.humanized.title.toLowerCase().includes(term);
      const matchDesc = item.humanized.description.toLowerCase().includes(term);
      const matchEmail = (item.user_email || '').toLowerCase().includes(term);
      const matchCategory = item.humanized.categoryLabel.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchEmail || matchCategory;
    }
    return true;
  });

  // Handlers para Ações com Validação e Proteção
  const handleOpenAction = (userItem: UserProfileRow, action: 'promote' | 'demote' | 'activate' | 'suspend' | 'delete' | 'details') => {
    setErrorMsg(null);
    setSelectedUser(userItem);
    setModalAction(action);
  };

  const handleExecuteAction = async () => {
    if (!selectedUser || !currentUser) return;
    setActionLoading(true);
    setErrorMsg(null);

    const performerId = currentUser.id;
    const performerEmail = currentUser.email || currentProfile?.email || 'admin@juceliasantana.eng.br';

    try {
      if (modalAction === 'promote') {
        await supabaseUsers.updateUserRole(selectedUser.id, 'admin', performerId, performerEmail);
        setSuccessMsg(`Usuário "${selectedUser.full_name || selectedUser.email}" promovido a Administrador com sucesso.`);
      } else if (modalAction === 'demote') {
        if (selectedUser.id === performerId) {
          throw new Error('Você não pode remover suas próprias permissões de administrador.');
        }
        if (countAdmins <= 1 && selectedUser.role === 'admin' && selectedUser.active && selectedUser.status === 'active') {
          throw new Error('Operação negada: O sistema deve manter no mínimo 1 Administrador ativo.');
        }
        await supabaseUsers.updateUserRole(selectedUser.id, 'user', performerId, performerEmail);
        setSuccessMsg(`Permissões administrativas de "${selectedUser.full_name || selectedUser.email}" foram revogadas com sucesso.`);
      } else if (modalAction === 'activate') {
        const wasSuspended = !selectedUser.active || selectedUser.status === 'suspended';
        await supabaseUsers.updateUserStatus(selectedUser.id, true, 'active', performerId, performerEmail);
        setSuccessMsg(wasSuspended ? `Conta de "${selectedUser.full_name || selectedUser.email}" reativada com sucesso.` : `Conta ativada.`);
      } else if (modalAction === 'suspend') {
        if (selectedUser.id === performerId) {
          throw new Error('Você não pode suspender sua própria conta de administrador.');
        }
        if (selectedUser.role === 'admin' && countAdmins <= 1) {
          throw new Error('Não é possível suspender o último administrador ativo do sistema.');
        }
        await supabaseUsers.updateUserStatus(selectedUser.id, false, 'suspended', performerId, performerEmail);
        setSuccessMsg(`Usuário "${selectedUser.full_name || selectedUser.email}" suspenso com sucesso.`);
      } else if (modalAction === 'delete') {
        if (selectedUser.id === performerId) {
          throw new Error('Operação negada: Não é permitido excluir a própria conta em uso.');
        }
        if (selectedUser.role === 'admin' && countAdmins <= 1) {
          throw new Error('Não é possível excluir o único administrador ativo do sistema.');
        }
        await supabaseUsers.deleteUserProfile(selectedUser.id, performerId, performerEmail);
        setSuccessMsg(selectedUser.role === 'admin' ? 'Administrador excluído com sucesso.' : 'Usuário excluído com sucesso.');
      }

      setModalAction(null);
      setSelectedUser(null);
      await loadData();
      await refreshProfile();
    } catch (err: any) {
      console.error('Erro na execução da ação administrativa:', err);
      setErrorMsg(err.message || 'Erro ao processar a operação administrativa.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers para Exclusão de Auditoria (com reflexo imediato no Supabase)
  const handleToggleSelectLog = (id: string) => {
    setSelectedAuditLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllLogs = () => {
    if (selectedAuditLogIds.length === humanizedAuditList.length && humanizedAuditList.length > 0) {
      setSelectedAuditLogIds([]);
    } else {
      setSelectedAuditLogIds(humanizedAuditList.map((l) => l.id));
    }
  };

  const handleDeleteSingleLog = async () => {
    if (!logToDelete) return;
    setAuditActionLoading(true);
    setErrorMsg(null);
    try {
      await supabaseDatabase.deleteAuditLog(logToDelete.id, currentUser?.id, currentUser?.email || currentProfile?.email);
      setSuccessMsg('Registro de auditoria excluído permanentemente do banco de dados.');
      setSelectedAuditLogIds((prev) => prev.filter((id) => id !== logToDelete.id));
      setLogToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir registro de auditoria:', err);
      setErrorMsg(err.message || 'Falha ao excluir o registro de auditoria no banco de dados.');
    } finally {
      setAuditActionLoading(false);
    }
  };

  const handleDeleteSelectedLogs = async () => {
    if (selectedAuditLogIds.length === 0) return;
    setAuditActionLoading(true);
    setErrorMsg(null);
    try {
      await supabaseDatabase.deleteAuditLogsBatch(selectedAuditLogIds, currentUser?.id, currentUser?.email || currentProfile?.email);
      setSuccessMsg(`${selectedAuditLogIds.length} registros de auditoria excluídos permanentemente do banco de dados.`);
      setIsBatchDeleteModalOpen(false);
      setSelectedAuditLogIds([]);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir lote de auditoria:', err);
      setErrorMsg(err.message || 'Falha ao excluir registros de auditoria selecionados no banco.');
    } finally {
      setAuditActionLoading(false);
    }
  };

  const handleClearAllLogs = async () => {
    setAuditActionLoading(true);
    setErrorMsg(null);
    try {
      await supabaseDatabase.clearAllAuditLogs(currentUser?.id, currentUser?.email || currentProfile?.email);
      setSuccessMsg('Todo o histórico de registros de auditoria foi permanentemente excluído do banco de dados.');
      setIsClearAllModalOpen(false);
      setSelectedAuditLogIds([]);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao limpar todo o histórico de auditoria:', err);
      setErrorMsg(err.message || 'Falha ao limpar histórico de auditoria no banco de dados.');
    } finally {
      setAuditActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Não registrado';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Não registrado';
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Administração Centralizada
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
            Gestão de Usuários e Permissões
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Controle de acessos reais no Supabase, hierarquia de administradores e histórico de auditoria executiva.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-[#0B1526] border border-white/10 hover:border-[#C5A059] text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-[#C5A059] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Recarregar Dados'}</span>
          </button>
        </div>
      </div>

      {/* Alertas de Notificação */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-md animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold">Aviso de Operação:</strong>
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-3 shadow-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold">Sucesso:</strong>
            {successMsg}
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Cadastrados</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalUsers}</p>
          <p className="text-[10px] text-slate-500">Perfis sincronizados no banco</p>
        </div>

        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Administradores</span>
            <div className="p-2 rounded-xl bg-[#C5A059]/15 text-[#C5A059]">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#C5A059]">{countAdmins}</p>
          <p className="text-[10px] text-slate-500">Acesso administrativo total</p>
        </div>

        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usuários Ativos</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">{countActive}</p>
          <p className="text-[10px] text-slate-500">Acessos liberados</p>
        </div>

        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suspensos / Inativos</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400">{countSuspended}</p>
          <p className="text-[10px] text-slate-500">Acessos bloqueados</p>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#C5A059] text-[#070D18] shadow-lg shadow-[#C5A059]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Contas ({filteredProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#C5A059] text-[#070D18] shadow-lg shadow-[#C5A059]/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Auditoria Executiva ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: LISTAGEM DE USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1526] border border-white/10 rounded-2xl p-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, CREA ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#C5A059] transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setQuickFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  quickFilter === 'all' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                Todos ({totalUsers})
              </button>
              <button
                onClick={() => setQuickFilter('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  quickFilter === 'admin' ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                Admins ({countAdmins})
              </button>
              <button
                onClick={() => setQuickFilter('user')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  quickFilter === 'user' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                Usuários ({countUsers})
              </button>
              <button
                onClick={() => setQuickFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  quickFilter === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                Ativos ({countActive})
              </button>
              <button
                onClick={() => setQuickFilter('suspended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  quickFilter === 'suspended' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                Suspensos ({countSuspended})
              </button>
            </div>
          </div>

          {/* Tabela de Usuários */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-[#0B1526] border border-white/10 rounded-2xl">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C5A059]" />
              Carregando dados sincronizados do banco de dados...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-[#0B1526] border border-white/10 rounded-2xl">
              Nenhum usuário encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="bg-[#0B1526] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#070D18] text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-6">Usuário / Engenheiro(a)</th>
                      <th className="py-3.5 px-4">Função / Papel</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Data Cadastro</th>
                      <th className="py-3.5 px-4">Último Acesso</th>
                      <th className="py-3.5 px-6 text-right">Ações Administrativas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProfiles.map((p) => {
                      const isSelf = currentUser?.id === p.id;
                      const isAdminRole = p.role === 'admin';
                      const isActiveAcc = p.active && p.status === 'active';

                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Coluna Perfil */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#070D18] border border-white/10 flex items-center justify-center overflow-hidden font-bold text-white text-xs shrink-0">
                                {p.avatar_url ? (
                                  <img
                                    src={p.avatar_url}
                                    alt={p.full_name || p.email}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[#C5A059]">
                                    {(p.full_name || p.email || 'U').charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-xs">
                                    {p.full_name || 'Sem Nome Cadastrado'}
                                  </span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
                                      Você
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 text-[11px] font-mono">{p.email}</div>
                                {p.crea && (
                                  <div className="text-slate-500 text-[10px]">CREA: {p.crea}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Coluna Função */}
                          <td className="py-4 px-4">
                            {isAdminRole ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                                <Crown className="w-3 h-3" />
                                Administrador
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                <User className="w-3 h-3" />
                                Usuário
                              </span>
                            )}
                          </td>

                          {/* Coluna Status */}
                          <td className="py-4 px-4">
                            {isActiveAcc ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3 h-3" />
                                Suspenso
                              </span>
                            )}
                          </td>

                          {/* Data Cadastro */}
                          <td className="py-4 px-4 text-slate-400 text-[11px]">
                            {formatDate(p.created_at)}
                          </td>

                          {/* Último Acesso */}
                          <td className="py-4 px-4 text-slate-300 text-[11px]">
                            {p.last_login ? (
                              <span className="inline-flex items-center gap-1 font-mono text-emerald-400/90">
                                <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                                {formatDate(p.last_login)}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">Não registrado</span>
                            )}
                          </td>

                          {/* Ações Administrativas */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Botão Ver Detalhes */}
                              <button
                                onClick={() => handleOpenAction(p, 'details')}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
                                title="Ver Detalhes do Perfil"
                              >
                                Detalhes
                              </button>

                              {/* Somente Administradores podem executar promoção/bloqueio */}
                              {isAdmin && (
                                <>
                                  {/* [Promover a Administrador] / [Rebaixar para Usuário] */}
                                  {isAdminRole ? (
                                    <button
                                      onClick={() => handleOpenAction(p, 'demote')}
                                      className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title={isSelf ? 'Sua conta conectada' : 'Rebaixar para Usuário'}
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                      <span>Rebaixar para Usuário</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenAction(p, 'promote')}
                                      className="px-2.5 py-1.5 rounded-lg border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="Promover a Administrador"
                                    >
                                      <Crown className="w-3.5 h-3.5" />
                                      <span>Promover a Administrador</span>
                                    </button>
                                  )}

                                  {/* [Ativar / Reativar] / [Suspender] */}
                                  {isActiveAcc ? (
                                    <button
                                      onClick={() => handleOpenAction(p, 'suspend')}
                                      className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title={isSelf ? 'Sua conta conectada' : 'Suspender Conta'}
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Suspender</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenAction(p, 'activate')}
                                      className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="Reativar Conta"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Reativar</span>
                                    </button>
                                  )}

                                  {/* [Excluir Usuário] / [Excluir Administrador] */}
                                  <button
                                    onClick={() => handleOpenAction(p, 'delete')}
                                    className="px-2.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title={isAdminRole ? 'Excluir Administrador' : 'Excluir Usuário'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{isAdminRole ? 'Excluir Administrador' : 'Excluir Usuário'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDITORIA ADMINISTRATIVA HUMANIZADA (COM EXCLUSÃO REAL NO BANCO) */}
      {activeTab === 'audit' && (
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
          {/* Cabeçalho da Auditoria */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#C5A059]" />
                Central de Auditoria Administrativa
              </h3>
              <p className="text-xs text-slate-400">
                Histórico em tempo real de operações, permissões e personalizações gravadas com rastreabilidade total no banco de dados.
              </p>
            </div>

            {/* Ações Globais de Exclusão de Auditoria */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-slate-400 font-mono mr-1">
                Total: <strong className="text-white">{auditLogs.length}</strong>
              </span>

              {selectedAuditLogIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsBatchDeleteModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer animate-fade-in"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Selecionados ({selectedAuditLogIds.length})</span>
                </button>
              )}

              {auditLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Limpar todos os registros de auditoria do banco de dados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Limpar Histórico</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros da Central de Auditoria */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por responsável, descrição ou ação..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#070D18] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#C5A059] transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setAuditCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  auditCategoryFilter === 'all' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setAuditCategoryFilter('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  auditCategoryFilter === 'users' ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Usuários
              </button>
              <button
                onClick={() => setAuditCategoryFilter('theme')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  auditCategoryFilter === 'theme' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Tema & Aparência
              </button>
              <button
                onClick={() => setAuditCategoryFilter('documents')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  auditCategoryFilter === 'documents' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Documentos
              </button>
              <button
                onClick={() => setAuditCategoryFilter('invites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  auditCategoryFilter === 'invites' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white bg-[#070D18]'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                Convites
              </button>
            </div>
          </div>

          {/* Barra de Seleção em Lote */}
          {humanizedAuditList.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#070D18] border border-white/5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllLogs}
                  className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                >
                  {selectedAuditLogIds.length === humanizedAuditList.length && humanizedAuditList.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-[#C5A059]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="font-semibold text-slate-300">
                    {selectedAuditLogIds.length === humanizedAuditList.length && humanizedAuditList.length > 0
                      ? 'Desmarcar todos'
                      : `Selecionar todos (${humanizedAuditList.length})`}
                  </span>
                </button>
              </div>

              {selectedAuditLogIds.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#C5A059] font-semibold">
                    {selectedAuditLogIds.length} selecionado{selectedAuditLogIds.length > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAuditLogIds([])}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Limpar seleção
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lista de Registros Humanizados */}
          {humanizedAuditList.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-[#070D18] border border-white/5 rounded-xl">
              Nenhum registro encontrado correspondente aos filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {humanizedAuditList.map((log) => {
                const { humanized } = log;
                const isSelected = selectedAuditLogIds.includes(log.id);

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl bg-[#070D18] border transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs shadow-sm ${
                      isSelected ? 'border-[#C5A059]/60 bg-[#C5A059]/5' : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Checkbox de Seleção */}
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectLog(log.id)}
                        className="mt-1 text-slate-500 hover:text-[#C5A059] transition-colors cursor-pointer shrink-0"
                        title={isSelected ? 'Desmarcar item' : 'Selecionar item'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#C5A059]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="space-y-2 flex-1">
                        {/* Cabeçalho do Card */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${humanized.badgeColor}`}>
                            {humanized.categoryLabel}
                          </span>

                          <h4 className="text-white font-bold text-sm">
                            {humanized.title}
                          </h4>

                          {humanized.isCritical && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Ação Crítica
                            </span>
                          )}
                        </div>

                        {/* Descrição em Português Claro */}
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {humanized.description}
                        </p>

                        {/* Lista de Detalhes Decodificados */}
                        {humanized.detailsList.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {humanized.detailsList.map((det, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-[11px]"
                              >
                                <span className="text-slate-400 font-medium">{det.label}:</span>
                                <span className="text-white font-semibold ml-2 truncate max-w-[200px]" title={det.value}>
                                  {det.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Autor da Ação */}
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-500">Executado por:</span>
                          <span className="text-slate-200 font-mono bg-white/5 px-2 py-0.5 rounded">
                            {log.user_email || 'Sistema Automático'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Data, Hora e Ação de Exclusão Individual */}
                    <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-white/5 pt-2 md:pt-0 shrink-0 gap-2">
                      <div className="text-slate-400 text-[11px] md:text-right">
                        <span className="text-slate-500 text-[10px] block">Horário do Registro</span>
                        <span className="font-mono text-slate-300 font-medium">{formatDate(log.created_at)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLogToDelete(log)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                        title="Excluir este registro de auditoria do banco"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: PROMOVER A ADMINISTRADOR */}
      {modalAction === 'promote' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-[#C5A059]">
              <div className="p-3 rounded-xl bg-[#C5A059]/15">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  Promover a Administrador
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedUser.full_name || selectedUser.email}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-white/10 space-y-3 text-xs text-slate-300">
              <p>
                Deseja conceder privilégios de <strong className="text-[#C5A059] font-bold">ADMINISTRADOR</strong> a{' '}
                <strong className="text-white">{selectedUser.full_name || selectedUser.email}</strong>?
              </p>
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                <strong className="block font-bold">Aviso de Segurança:</strong>
                O usuário terá acesso total ao painel administrativo e a todas as configurações do portal.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalAction(null);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-[#C5A059] text-[#070D18] text-xs font-extrabold hover:bg-[#b38f49] transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Promoção</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REBAIXAR PARA USUÁRIO */}
      {modalAction === 'demote' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 rounded-xl bg-amber-500/15">
                <UserMinus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  Rebaixar para Usuário
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedUser.full_name || selectedUser.email}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-white/10 space-y-3 text-xs text-slate-300">
              <p className="text-sm font-semibold text-white">
                Este usuário perderá as permissões de administrador. Deseja continuar?
              </p>
              {selectedUser.id === currentUser?.id ? (
                <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                  Aviso: Você está conectado com esta conta. O sistema bloqueará o auto-rebaixamento por segurança.
                </div>
              ) : (
                <div className="p-3 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                  O usuário não poderá mais gerenciar outros usuários, temas, auditorias ou acervos restritos.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalAction(null);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Rebaixamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ATIVAR OU SUSPENDER CONTA */}
      {(modalAction === 'activate' || modalAction === 'suspend') && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className={`flex items-center gap-3 ${modalAction === 'activate' ? 'text-emerald-400' : 'text-rose-400'}`}>
              <div className={`p-3 rounded-xl ${modalAction === 'activate' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                {modalAction === 'activate' ? <UserCheck className="w-6 h-6" /> : <UserX className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  {modalAction === 'activate' ? 'Ativar / Reativar Usuário' : 'Suspender Usuário'}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedUser.full_name || selectedUser.email}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-white/10 space-y-3 text-xs text-slate-300">
              {modalAction === 'suspend' ? (
                <>
                  <p className="text-sm font-semibold text-white">
                    Tem certeza que deseja suspender este usuário? O acesso ao portal será imediatamente bloqueado.
                  </p>
                  {selectedUser.id === currentUser?.id && (
                    <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                      Aviso: Não é permitido suspender a própria conta conectada.
                    </div>
                  )}
                  <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                    Contas suspensas não conseguem autenticar até que um administrador reative o cadastro.
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-white">
                    Deseja reativar o acesso de <strong className="text-emerald-400">{selectedUser.full_name || selectedUser.email}</strong>?
                  </p>
                  <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                    O usuário poderá acessar a plataforma normalmente conforme sua função atribuída.
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalAction(null);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${
                  modalAction === 'activate'
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{modalAction === 'activate' ? 'Confirmar Ativação' : 'Confirmar Suspensão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUSÃO PERMANENTE */}
      {modalAction === 'delete' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 rounded-xl bg-rose-500/15">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  {selectedUser.role === 'admin' ? 'Excluir Administrador' : 'Excluir Usuário'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-rose-500/20 space-y-3 text-xs text-slate-300">
              {selectedUser.role === 'admin' ? (
                <p className="text-sm font-semibold text-white">
                  Este administrador será removido permanentemente e perderá o acesso total ao painel. Deseja realmente continuar?
                </p>
              ) : (
                <p className="text-sm font-semibold text-white">
                  Esta conta de usuário será excluída permanentemente. Deseja continuar?
                </p>
              )}
              {selectedUser.id === currentUser?.id && (
                <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                  Aviso: Não é permitido excluir a própria conta conectada no sistema.
                </div>
              )}
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] space-y-1">
                <strong className="block font-bold">Aviso Irreversível:</strong>
                O perfil será excluído do banco de dados e a ação será registrada no histórico de auditoria.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalAction(null);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DO PERFIL */}
      {modalAction === 'details' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#070D18] border border-white/10 flex items-center justify-center overflow-hidden font-bold text-white text-lg">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.full_name || selectedUser.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#C5A059]">
                      {(selectedUser.full_name || selectedUser.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedUser.full_name || 'Usuário Sem Nome'}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{selectedUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setModalAction(null);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-white p-1 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">ID do Usuário</span>
                <span className="text-slate-300 font-mono text-[11px] block truncate">{selectedUser.id}</span>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Função (Role)</span>
                <span className="font-bold text-[#C5A059] block">
                  {selectedUser.role === 'admin' ? 'Administrador' : 'Usuário Comum'}
                </span>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Status da Conta</span>
                <span className={selectedUser.active && selectedUser.status === 'active' ? 'text-emerald-400 font-bold block' : 'text-rose-400 font-bold block'}>
                  {selectedUser.active && selectedUser.status === 'active' ? 'Ativo' : selectedUser.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                </span>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Registro CREA/CAU</span>
                <span className="text-slate-300 font-mono block">{selectedUser.crea || 'Não informado'}</span>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Telefone / Whats</span>
                <span className="text-slate-300 block">{selectedUser.phone || 'Não informado'}</span>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Data de Cadastro</span>
                <span className="text-slate-300 block">{formatDate(selectedUser.created_at)}</span>
              </div>

              <div className="bg-[#070D18] p-3 rounded-xl border border-white/5 space-y-1 col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Último Acesso Registrado</span>
                <span className="text-emerald-400 font-mono block">{formatDate(selectedUser.last_login)}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setModalAction(null);
                  setSelectedUser(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR REGISTRO INDIVIDUAL DE AUDITORIA NO BANCO */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-xl bg-rose-500/15">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  Excluir Registro de Auditoria
                </h3>
                <p className="text-xs text-slate-400">
                  Exclusão permanente no banco de dados Supabase
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-white/10 space-y-3 text-xs text-slate-300">
              <p>
                Tem certeza que deseja excluir permanentemente o seguinte evento de auditoria?
              </p>
              
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Ação:</span>
                  <span className="text-[#C5A059] font-bold">{logToDelete.action}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Responsável:</span>
                  <span className="text-white truncate max-w-[180px]">{logToDelete.user_email || 'Sistema'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Data/Hora:</span>
                  <span className="text-slate-300">{formatDate(logToDelete.created_at)}</span>
                </div>
              </div>

              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                Esta ação apagará o registro definitivamente da tabela <code className="bg-black/30 px-1 py-0.5 rounded text-rose-200">admin_audit_logs</code> do banco de dados e não poderá ser desfeita.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                disabled={auditActionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSingleLog}
                disabled={auditActionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {auditActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Excluir do Banco</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR LOTE SELECIONADO DE AUDITORIA */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-xl bg-rose-500/15">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  Excluir {selectedAuditLogIds.length} Registros Selecionados
                </h3>
                <p className="text-xs text-slate-400">
                  Exclusão em lote no banco de dados
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-white/10 space-y-3 text-xs text-slate-300">
              <p>
                Deseja realmente excluir permanentemente os <strong className="text-white font-bold">{selectedAuditLogIds.length} registros</strong> selecionados?
              </p>

              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] space-y-1">
                <strong className="block font-bold">Aviso Irreversível:</strong>
                Todos os dados correspondentes serão removidos permanentemente do banco de dados Supabase.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                disabled={auditActionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedLogs}
                disabled={auditActionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {auditActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Excluir {selectedAuditLogIds.length} Itens</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIMPAR TODO O HISTÓRICO DE AUDITORIA */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  Limpar Todo o Histórico
                </h3>
                <p className="text-xs text-rose-400 font-medium">
                  Ação Crítica de Banco de Dados
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-white/10 space-y-3 text-xs text-slate-300">
              <p>
                Você está prestes a apagar <strong className="text-white font-bold">TODOS OS REGISTROS ({auditLogs.length})</strong> da tabela de auditoria do Supabase.
              </p>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Atenção: Ação Definitiva</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Todo o histórico de rastreabilidade de ações passadas de todos os usuários será completamente zerado.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={auditActionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAllLogs}
                disabled={auditActionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {auditActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar e Limpar Banco</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
