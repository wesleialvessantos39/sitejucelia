// /src/pages/AdminProfile.tsx
import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Crown,
  Lock,
  Mail,
  User,
  Phone,
  Award,
  Image as ImageIcon,
  Save,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseUsers } from '../services/supabaseUsers';

export default function AdminProfile() {
  const { user, profile, refreshProfile, updatePassword } = useAuth();

  // Estados dos Campos Editáveis
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [crea, setCrea] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Estado da Troca de Senha
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Feedbacks de Tela
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [loadingPass, setLoadingPass] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preenche formulário quando o perfil carrega
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCrea(profile.crea || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Limpa notificações após tempo
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Salvar Alterações de Perfil Pessoal
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoadingProfile(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await supabaseUsers.updateOwnProfile(user.id, {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        crea: crea.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });

      await refreshProfile();
      setSuccessMsg('Seus dados de perfil foram atualizados com sucesso.');
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setErrorMsg(err.message || 'Falha ao salvar as alterações no perfil.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Atualizar Senha de Acesso
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação da senha não confere.');
      return;
    }

    setLoadingPass(true);
    try {
      await updatePassword(newPassword);
      setSuccessMsg('Sua senha de acesso foi alterada com sucesso.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      setErrorMsg(err.message || 'Falha ao alterar senha de acesso.');
    } finally {
      setLoadingPass(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Não registrado';
    try {
      return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Cabeçalho */}
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold uppercase tracking-wider mb-2">
          <UserCog className="w-3.5 h-3.5" /> Meu Perfil
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
          Configurações de Conta e Perfil
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Gerencie suas informações pessoais e credenciais de acesso com segurança.
        </p>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-md animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold">Erro no Processamento:</strong>
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

      {/* Resumo e Badges da Conta */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#070D18] border-2 border-[#C5A059] flex items-center justify-center overflow-hidden text-2xl font-black text-[#C5A059] shrink-0 shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName || user?.email || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              (fullName || user?.email || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">
              {fullName || 'Usuário do Ecossistema'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Membro desde: {formatDate(profile?.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile?.role === 'admin' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] font-extrabold text-xs">
              <Crown className="w-4 h-4" /> Administrador
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs">
              <User className="w-4 h-4" /> Usuário
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs">
            <Shield className="w-4 h-4" /> Status: Ativo
          </span>
        </div>
      </div>

      {/* Formulário de Edição do Perfil */}
      <form onSubmit={handleSaveProfile} className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#C5A059]" />
            Dados Pessoais e Profissionais
          </h3>
          <p className="text-xs text-slate-400">
            Campos protegidos e seguros para autoedição do próprio usuário.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Nome Completo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#C5A059]" /> Nome Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Engª Jucélia Santana"
              className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          {/* Telefone / WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#C5A059]" /> Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: (75) 99999-9999"
              className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          {/* Registro CREA / CAU */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#C5A059]" /> Registro CREA / CAU
            </label>
            <input
              type="text"
              value={crea}
              onChange={(e) => setCrea(e.target.value)}
              placeholder="Ex: CREA-BA 123456/D"
              className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          {/* Foto de Perfil URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#C5A059]" /> URL do Avatar / Foto
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>

        {/* Informação sobre Campos Restritos */}
        <div className="p-4 rounded-xl bg-[#070D18] border border-white/10 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#C5A059] font-bold">
            <Lock className="w-4 h-4" />
            <span>Campos Restritos e Imutáveis pelo Usuário</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Campos como <strong className="text-slate-200">Função (role)</strong> e <strong className="text-slate-200">Status (active)</strong> são gerenciados estritamente pelo backend via RLS no PostgreSQL e requerem elevação administrativa.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loadingProfile}
            className="px-6 py-2.5 rounded-xl bg-[#C5A059] text-[#070D18] text-xs font-extrabold hover:bg-[#b38f49] transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {loadingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Alterações de Perfil</span>
          </button>
        </div>
      </form>

      {/* Cartão de Troca de Senha */}
      <form onSubmit={handleUpdatePassword} className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#C5A059]" />
            Segurança & Troca de Senha
          </h3>
          <p className="text-xs text-slate-400">
            Atualize sua senha de acesso via Supabase Auth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" /> Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" /> Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#070D18] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loadingPass}
            className="px-6 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-slate-100 hover:text-white hover:border-[#C5A059] text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {loadingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4 text-[#C5A059]" />}
            <span>Atualizar Senha</span>
          </button>
        </div>
      </form>
    </div>
  );
}
