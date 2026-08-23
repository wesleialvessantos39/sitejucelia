import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Archive,
  Send,
  User,
  Filter,
  Eye,
  Trash2
} from 'lucide-react';
import { supabaseDatabase, ContactMessageRow } from '../services/supabaseDatabase';
import { useAuth } from '../context/AuthContext';

export default function AdminMessages() {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRow | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await supabaseDatabase.getContactMessages();
      setMessages(data || []);
    } catch (err) {
      console.error('[AdminMessages] Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'new' | 'read' | 'replied' | 'archived') => {
    if (!isAdmin) return;
    try {
      await supabaseDatabase.updateContactMessage(id, { status: newStatus });

      if (user?.id) {
        await supabaseDatabase.logAdminAction({
          user_id: user.id,
          user_email: user.email,
          action: 'UPDATE_MESSAGE_STATUS',
          entity_type: 'contact_messages',
          entity_id: id,
          details: { status: newStatus },
        });
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, status: newStatus } : msg))
      );

      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status da mensagem:', err);
      alert('Erro ao atualizar status: ' + (err?.message || 'Tente novamente.'));
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (statusFilter !== 'all' && msg.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchesName = msg.name.toLowerCase().includes(term);
      const matchesEmail = msg.email.toLowerCase().includes(term);
      const matchesSubject = msg.subject?.toLowerCase().includes(term);
      const matchesPhone = msg.phone?.toLowerCase().includes(term);

      if (!matchesName && !matchesEmail && !matchesSubject && !matchesPhone) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1526] border border-white/10 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[#C5A059] text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" /> Mensagens e Solicitações de Orçamento
          </div>
          <h1 className="text-2xl font-extrabold text-white font-serif">
            Central de Contatos do Site
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Gerencie todas as dúvidas, solicitações de laudos e orçamentos enviados pelos clientes através do formulário de contato.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMessages}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C5A059]' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0B1526] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar nome, e-mail, assunto, telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#122038] border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#122038] p-1 rounded-xl border border-white/10 text-xs w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-[#C5A059] text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('new')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'new' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Novas ({messages.filter((m) => m.status === 'new').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('read')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'read' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lidas ({messages.filter((m) => m.status === 'read').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('replied')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'replied' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Respondidas ({messages.filter((m) => m.status === 'replied').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'archived' ? 'bg-slate-700 text-slate-200 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Arquivadas ({messages.filter((m) => m.status === 'archived').length})
          </button>
        </div>
      </div>

      {/* Main Grid: Messages Table + Preview Modal */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
            Carregando mensagens recebidas...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">Nenhuma mensagem encontrada nesta categoria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Cliente / E-mail</th>
                  <th className="p-4">Assunto</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data de Envio</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {msg.name}
                      <span className="block text-xs text-slate-400 font-normal">{msg.email}</span>
                    </td>
                    <td className="p-4 text-slate-300 text-xs">
                      <span className="font-medium text-white block">{msg.subject || 'Contato do Site'}</span>
                      <span className="text-slate-400 truncate block max-w-xs">{msg.message}</span>
                    </td>
                    <td className="p-4 text-slate-300 text-xs font-mono">
                      {msg.phone || 'Não informado'}
                    </td>
                    <td className="p-4 text-xs whitespace-nowrap">
                      {msg.status === 'new' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                          <Clock className="w-3 h-3" /> Nova
                        </span>
                      )}
                      {msg.status === 'read' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                          <Eye className="w-3 h-3" /> Lida
                        </span>
                      )}
                      {msg.status === 'replied' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Respondida
                        </span>
                      )}
                      {msg.status === 'archived' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                          <Archive className="w-3 h-3" /> Arquivada
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                      {msg.created_at ? new Date(msg.created_at).toLocaleString('pt-BR') : 'N/I'}
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMessage(msg);
                          if (msg.status === 'new') {
                            handleUpdateStatus(msg.id, 'read');
                          }
                        }}
                        className="p-2 rounded-lg bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 transition-colors cursor-pointer text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> Ler Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Mensagem */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs text-[#C5A059] font-bold uppercase tracking-wider block">
                  Mensagem #{selectedMessage.id.substring(0, 8)}
                </span>
                <h3 className="text-xl font-bold text-white font-serif mt-1">
                  {selectedMessage.subject || 'Solicitação de Orçamento'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#122038] p-4 rounded-xl border border-white/5">
              <div className="space-y-1">
                <span className="text-slate-400 block">Remetente:</span>
                <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                  <User className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedMessage.name}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">E-mail de Contato:</span>
                <span className="text-sky-400 font-mono flex items-center gap-1.5 text-sm">
                  <Mail className="w-3.5 h-3.5" /> {selectedMessage.email}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Telefone / WhatsApp:</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1.5 text-sm">
                  <Phone className="w-3.5 h-3.5" /> {selectedMessage.phone || 'Não informado'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Data do Envio:</span>
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />{' '}
                  {selectedMessage.created_at
                    ? new Date(selectedMessage.created_at).toLocaleString('pt-BR')
                    : 'N/I'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Conteúdo da Mensagem:
              </span>
              <div className="bg-[#122038] p-4 rounded-xl border border-white/5 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedMessage.message}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Mudar Status:</span>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Marcar Respondida
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'archived')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Arquivar
                </button>
              </div>

              {selectedMessage.phone && (
                <a
                  href={`https://wa.me/55${selectedMessage.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${selectedMessage.name}, referente ao seu contato no site da Engª Jucélia Santana:`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" /> Responder via WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
