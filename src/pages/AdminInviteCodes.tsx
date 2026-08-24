// /src/pages/AdminInviteCodes.tsx
import React, { useEffect, useState } from 'react';
import {
  Ticket,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  UserCheck,
  Trash2,
  Ban,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  ExternalLink,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { useAuth } from '../context/AuthContext';
import type { InviteCode } from '../types';

export default function AdminInviteCodes() {
  const { user, profile, isAdmin } = useAuth();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'used' | 'expired' | 'canceled'>('all');

  // Modal de Criação de Convite
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Modal de Confirmação de Ação (cancelar ou excluir)
  const [confirmModal, setConfirmModal] = useState<{
    type: 'cancel' | 'delete';
    invite: InviteCode;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Mensagens de Feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const inviteList = await supabaseDatabase.getInviteCodes();
      setCodes(inviteList);
    } catch (err) {
      console.error('Erro ao carregar convites:', err);
      showFeedback('error', 'Erro ao carregar convites do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showFeedback('error', 'Somente administradores ativos podem gerar novos convites.');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const newInvite = await supabaseDatabase.createInviteCode(
        user?.id,
        user?.email || profile?.email || 'admin@juceliasantana.eng.br',
        expiresInDays
      );

      setCodes((prev) => [newInvite, ...prev]);
      setCreateModalOpen(false);
      showFeedback('success', `Código de convite ${newInvite.code} gerado com sucesso para ${expiresInDays} dias de validade!`);
    } catch (err: any) {
      console.error('Erro ao criar convite:', err);
      showFeedback('error', 'Erro ao gerar o convite: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal || !isAdmin) return;

    setIsProcessingAction(true);
    try {
      if (confirmModal.type === 'cancel') {
        await supabaseDatabase.cancelInviteCode(
          confirmModal.invite.id,
          user?.id,
          user?.email || profile?.email
        );
        setCodes((prev) =>
          prev.map((c) =>
            c.id === confirmModal.invite.id ? { ...c, status: 'canceled' as const } : c
          )
        );
        showFeedback('success', `Convite ${confirmModal.invite.code} cancelado com sucesso.`);
      } else if (confirmModal.type === 'delete') {
        await supabaseDatabase.deleteInviteCode(
          confirmModal.invite.id,
          user?.id,
          user?.email || profile?.email
        );
        setCodes((prev) => prev.filter((c) => c.id !== confirmModal.invite.id));
        showFeedback('success', `Convite ${confirmModal.invite.code} excluído com sucesso.`);
      }
      setConfirmModal(null);
    } catch (err: any) {
      console.error('Erro ao executar ação no convite:', err);
      showFeedback('error', err?.message || 'Erro ao processar a ação no convite.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showFeedback('success', `Código ${code} copiado para a área de transferência!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtragem dos convites
  const filteredCodes = codes.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.used_by_email && item.used_by_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.created_by_email && item.created_by_email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const countPending = codes.filter((c) => c.status === 'pending').length;
  const countUsed = codes.filter((c) => c.status === 'used').length;
  const countExpired = codes.filter((c) => c.status === 'expired').length;
  const countCanceled = codes.filter((c) => c.status === 'canceled').length;

  return (
    <div className="space-y-8">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between gap-3 shadow-2xl animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs uppercase hover:underline opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1526] border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
              <Ticket className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white font-serif">
              Gestão Centralizada de Convites
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Gere tokens criptográficos únicos e imprevisíveis para o cadastro restrito de novos usuários e administradores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            title="Atualizar lista"
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C5A059]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4b068] text-[#070D18] font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Convite</span>
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0B1526] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pendentes / Válidos</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-emerald-400">{countPending}</span>
        </div>

        <div className="bg-[#0B1526] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Utilizados</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-bold text-sky-400">{countUsed}</span>
        </div>

        <div className="bg-[#0B1526] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Expirados</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-amber-400">{countExpired}</span>
        </div>

        <div className="bg-[#0B1526] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Cancelados</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-bold text-rose-400">{countCanceled}</span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#C5A059] text-black shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Todos ({codes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Pendentes ({countPending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('used')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'used'
                ? 'bg-sky-500 text-black shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Utilizados ({countUsed})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'expired'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Expirados ({countExpired})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('canceled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'canceled'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Cancelados ({countCanceled})
          </button>
        </div>

        {/* Input de Busca */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código ou e-mail..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B1526] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>
      </div>

      {/* Tabela de Códigos de Convite */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
            Carregando convites do Supabase...
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm font-semibold">Nenhum código de convite localizado.</p>
            <p className="text-slate-500 text-xs">
              {searchQuery || statusFilter !== 'all'
                ? 'Tente alterar os filtros de busca ou limpar a pesquisa.'
                : 'Gere novos convites para permitir o cadastro de novos engenheiros e colaboradores.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-4">Código do Convite</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Criado Em / Por</th>
                  <th className="p-4">Expiração</th>
                  <th className="p-4">Utilizado Por</th>
                  <th className="p-4 text-right">Ações Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredCodes.map((item) => {
                  const isPending = item.status === 'pending';
                  const isUsed = item.status === 'used';
                  const isExpired = item.status === 'expired';
                  const isCanceled = item.status === 'canceled';

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Código */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-white tracking-wider text-sm sm:text-base bg-[#070D18] px-3 py-1 rounded-lg border border-white/10">
                            {item.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.code)}
                            title="Copiar código de convite"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#C5A059] transition-all cursor-pointer"
                          >
                            {copiedCode === item.code ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" /> Pendente / Válido
                          </span>
                        )}
                        {isUsed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-400 text-xs font-bold border border-sky-500/30">
                            <UserCheck className="w-3.5 h-3.5" /> Utilizado
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" /> Expirado
                          </span>
                        )}
                        {isCanceled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-bold border border-rose-500/30">
                            <Ban className="w-3.5 h-3.5" /> Cancelado
                          </span>
                        )}
                      </td>

                      {/* Criado Em / Por */}
                      <td className="p-4 text-xs text-slate-300">
                        <div className="space-y-0.5">
                          <span className="block text-white font-medium">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : 'N/I'}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                            {item.created_by_email || 'Administrador'}
                          </span>
                        </div>
                      </td>

                      {/* Expiração */}
                      <td className="p-4 text-xs">
                        {item.expires_at ? (
                          <div className="space-y-0.5">
                            <span className="text-white block font-medium">
                              {new Date(item.expires_at).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {new Date(item.expires_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Sem expiração</span>
                        )}
                      </td>

                      {/* Utilizado Por */}
                      <td className="p-4 text-xs">
                        {item.used_by_email ? (
                          <div className="space-y-0.5">
                            <span className="text-sky-300 font-semibold block flex items-center gap-1">
                              <Mail className="w-3 h-3 text-sky-400" />
                              {item.used_by_email}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              Em {item.used_at ? new Date(item.used_at).toLocaleDateString('pt-BR') : 'N/I'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-right whitespace-nowrap space-x-2">
                        {/* Cancelar convite pendente */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ type: 'cancel', invite: item })}
                            title="Cancelar Convite (bloqueia o uso)"
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </button>
                        )}

                        {/* Excluir código */}
                        <button
                          type="button"
                          onClick={() => setConfirmModal({ type: 'delete', invite: item })}
                          title="Excluir Convite do Sistema"
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all inline-flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link Rápido para a tela de Registro e Usuários */}
      <div className="p-4 rounded-xl bg-[#0B1526] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#C5A059]" />
          <span>
            Os convites gerados acima são consumidos e validados diretamente na tela de{' '}
            <strong className="text-white font-mono">/login/register</strong>.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/login/register"
            target="_blank"
            className="text-[#C5A059] font-bold hover:underline flex items-center gap-1"
          >
            Abrir Registro <ExternalLink className="w-3 h-3" />
          </Link>
          <span className="text-white/20">|</span>
          <Link
            to="/admin/users"
            className="text-sky-400 font-bold hover:underline"
          >
            Ver Usuários Cadastrados
          </Link>
        </div>
      </div>

      {/* Modal: Gerar Novo Convite */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-[#C5A059]">
              <div className="p-3 rounded-xl bg-[#C5A059]/15">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  Gerar Novo Código de Convite
                </h3>
                <p className="text-xs text-slate-400">
                  Crie um token seguro para disponibilizar a um novo colaborador.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Período de Validade do Convite
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { days: 3, label: '3 dias' },
                    { days: 7, label: '7 dias (Padrão)' },
                    { days: 15, label: '15 dias' },
                    { days: 30, label: '30 dias' },
                  ].map((option) => (
                    <button
                      key={option.days}
                      type="button"
                      onClick={() => setExpiresInDays(option.days)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        expiresInDays === option.days
                          ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-md'
                          : 'bg-[#070D18] text-slate-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070D18] border border-white/5 text-xs text-slate-400 space-y-1">
                <p className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" /> Formato do Token:
                </p>
                <p className="font-mono text-white text-[11px]">
                  JS-ENG-XXXX-XXXX (Criptograficamente aleatório e de uso único)
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#d4b068] text-black text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isSubmittingCreate && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar e Gerar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação (Cancelar ou Excluir) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  confirmModal.type === 'cancel'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {confirmModal.type === 'cancel' ? (
                  <Ban className="w-6 h-6" />
                ) : (
                  <Trash2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">
                  {confirmModal.type === 'cancel' ? 'Cancelar Código de Convite' : 'Excluir Código de Convite'}
                </h3>
                <p className="text-xs text-slate-400 font-mono font-bold">
                  {confirmModal.invite.code}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-white/5 text-xs text-slate-300 space-y-2">
              {confirmModal.type === 'cancel' ? (
                <p>
                  Tem certeza que deseja cancelar o convite{' '}
                  <strong className="text-white font-mono">{confirmModal.invite.code}</strong>? O código será imediatamente invalidado para novos cadastros.
                </p>
              ) : (
                <p>
                  Tem certeza que deseja excluir definitivamente o convite{' '}
                  <strong className="text-white font-mono">{confirmModal.invite.code}</strong>? Este registro será removido e a ação ficará registrada na auditoria.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isProcessingAction}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${
                  confirmModal.type === 'cancel'
                    ? 'bg-amber-500 hover:bg-amber-600 text-black'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isProcessingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {confirmModal.type === 'cancel' ? 'Confirmar Cancelamento' : 'Confirmar Exclusão'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

