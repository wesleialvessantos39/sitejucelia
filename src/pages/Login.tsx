// /src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVisualIdentity } from '../context/VisualIdentityContext';
import { ManagedMedia } from '../components/ui/ManagedMedia';
import { Building2, Lock, Mail, ArrowRight, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { settings, getEffectiveAsset } = useVisualIdentity();
  const navigate = useNavigate();
  const location = useLocation();

  const logoSrc = getEffectiveAsset ? getEffectiveAsset('site_logo') : (settings.site_logo || '');


  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (err.message?.includes('Email not confirmed')) {
        setErrorMsg('E-mail ainda não confirmado no Supabase Auth.');
      } else if (err.message?.includes('Invalid API key') || err.message?.includes('apiKey') || err.message?.includes('apikey')) {
        setErrorMsg('Erro de chave de API no Supabase (Invalid API key): A chave pública "anon" do seu projeto no Supabase foi alterada ou expirou. Acesse seu painel do Supabase (Project Settings -> API) e certifique-se de usar a chave "anon public" do projeto.');
      } else if (err.message?.includes('Failed to fetch')) {
        setErrorMsg('Não foi possível conectar ao projeto Supabase. Verifique a conexão com a internet ou as credenciais do Supabase.');
      } else {
        setErrorMsg(err.message || 'Falha ao autenticar. Verifique suas credenciais e tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Elementos decorativos sutis no background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#C5A059]/5 blur-3xl pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4 text-center">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A059] text-[#070D18] flex items-center justify-center font-bold shadow-xl group-hover:scale-105 transition-transform overflow-hidden p-1.5">
            {logoSrc ? (
              <ManagedMedia
                mediaKey="visual_identity:site_logo"
                src={logoSrc}
                alt="Logo Engª Jucélia Santana"
                context="visual_identity"
                loading="eager"
                decoding="sync"
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
            Painel Administrativo
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
              <ShieldCheck className="w-5 h-5 text-[#C5A059]" /> Acesso Restrito
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Informe suas credenciais para gerenciar obras, laudos e configurações.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                E-mail Corporativo
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
                  placeholder="admin@juceliasantana.eng.br"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D18] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Senha
                </label>
                <Link
                  to="/login/forgot-password"
                  className="text-xs text-[#C5A059] hover:underline font-medium flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" /> Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D18] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#C5A059] text-[#070D18] font-extrabold text-sm hover:bg-[#d4b068] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#070D18] border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-white/5 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Novo engenheiro ou colaborador?{' '}
              <Link to="/login/register" className="text-[#C5A059] font-bold hover:underline">
                Criar Conta
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Voltar para o Site Principal
          </Link>
        </div>
      </div>
    </div>
  );
}
