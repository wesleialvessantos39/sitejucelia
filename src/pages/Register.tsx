// /src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVisualIdentity } from '../context/VisualIdentityContext';
import { ManagedMedia } from '../components/ui/ManagedMedia';
import { Building2, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Ticket } from 'lucide-react';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUp } = useAuth();
  const { settings } = useVisualIdentity();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Validação dos campos obrigatórios
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const cleanInvite = inviteCode.trim().toUpperCase();
    if (!cleanInvite) {
      setErrorMsg('É necessário possuir um convite válido para realizar o cadastro.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Validação prévia e rigorosa do convite
      const inviteValidation = await supabaseDatabase.checkInviteValidity(cleanInvite);
      if (!inviteValidation.valid) {
        setErrorMsg(inviteValidation.reason || 'Convite inválido ou expirado.');
        setIsSubmitting(false);
        return;
      }

      // 3. Criação da conta no Supabase Auth
      await signUp(email.trim(), password, fullName.trim(), cleanInvite);

      // 4. Consumo do código de convite e registro de auditoria
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || `usr-${Date.now()}`;

      await supabaseDatabase.consumeInviteCode(cleanInvite, currentUserId, email.trim());

      // 5. Garante inserção/atualização do perfil na tabela public.profiles como role 'user'
      try {
        await supabase.from('profiles').upsert({
          id: currentUserId,
          email: email.trim(),
          full_name: fullName.trim(),
          role: 'user',
          active: true,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (profileErr) {
        console.warn('Aviso ao sincronizar perfil inicial:', profileErr);
      }

      // 6. Registra auditoria de criação de usuário
      await supabaseDatabase.logAdminAction({
        user_id: currentUserId,
        user_email: email.trim(),
        action: 'CREATE_USER',
        entity_type: 'profiles',
        entity_id: currentUserId,
        details: {
          full_name: fullName.trim(),
          email: email.trim(),
          invite_code: cleanInvite,
          role: 'user',
          status: 'active',
        },
      });

      setSuccessMsg('Cadastro realizado com sucesso! Redirecionando para o painel...');
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      if (err.message?.includes('User already registered')) {
        setErrorMsg('Este e-mail já está cadastrado no sistema.');
      } else if (err.message?.includes('rate limit') || err.message?.includes('rate_limit') || err.status === 429) {
        setErrorMsg('Limite de envio atingido temporariamente no Supabase Auth. Aguarde alguns minutos.');
      } else if (err.message?.includes('Invalid API key') || err.message?.includes('apiKey') || err.message?.includes('apikey')) {
        setErrorMsg('Erro de chave de API no Supabase. Verifique a configuração.');
      } else if (err.message?.includes('Failed to fetch')) {
        setErrorMsg('Não foi possível conectar ao servidor. Verifique a conexão.');
      } else {
        setErrorMsg(err.message || 'Falha ao realizar cadastro. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#C5A059]/5 blur-3xl pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4 text-center">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A059] text-[#070D18] flex items-center justify-center font-bold shadow-xl group-hover:scale-105 transition-transform overflow-hidden p-1.5">
            {settings.site_logo || settings.admin_sidebar_icon ? (
              <ManagedMedia
                mediaKey={settings.site_logo ? "visual_identity:site_logo" : "visual_identity:admin_sidebar_icon"}
                src={settings.site_logo || settings.admin_sidebar_icon || ''}
                alt="Logo Engª Jucélia Santana"
                context="visual_identity"
                className="w-full h-full object-contain"
                containerClassName="w-full h-full"
              />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
          </div>
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-white font-serif tracking-tight">
            ENGª JUCÉLIA SANTANA
          </h2>
          <p className="text-xs text-[#C5A059] font-medium tracking-widest uppercase mt-0.5">
            Cadastro com Convite Obrigatório
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
              <ShieldCheck className="w-5 h-5 text-[#C5A059]" /> Criar Nova Conta
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              O acesso ao sistema de engenharia requer código de convite gerado por um administrador.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Código de Convite <span className="text-[#C5A059]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5A059]">
                  <Ticket className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Ex: JS-ENG-XXXX-XXXX ou ENG-JUCELIA-2026"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D18] border border-[#C5A059]/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all uppercase font-mono tracking-wider font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Convite fornecido pela equipe de administração.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome Completo <span className="text-[#C5A059]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Engª Jucélia Santana"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D18] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail Corporativo <span className="text-[#C5A059]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@juceliasantana.eng.br"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D18] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Senha de Acesso <span className="text-[#C5A059]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (mínimo 6 caracteres)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D18] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirmar Senha <span className="text-[#C5A059]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D18] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#C5A059] text-[#070D18] font-extrabold text-sm hover:bg-[#d4b068] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer pt-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#070D18] border-t-transparent rounded-full animate-spin" />
                  <span>Validando e Criando Conta...</span>
                </>
              ) : (
                <>
                  <span>Finalizar Cadastro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-white/5 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Já possui uma conta?{' '}
              <Link to="/login" className="text-[#C5A059] font-bold hover:underline">
                Acessar Painel
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

