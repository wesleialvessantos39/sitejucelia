// /src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVisualIdentity } from '../context/VisualIdentityContext';
import { ManagedMedia } from '../components/ui/ManagedMedia';
import { Building2, Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resetPassword } = useAuth();
  const { settings } = useVisualIdentity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Por favor, informe seu e-mail corporativo.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccessMsg('As instruções para redefinição de senha foram enviadas para o e-mail informado.');
    } catch (err: any) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      setErrorMsg('Ocorreu um erro ao processar sua solicitação. Verifique o e-mail informado.');
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
            Recuperação de Senha
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white font-serif">Redefinir Senha</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Informe o seu e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha no Supabase Auth.
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                E-mail de Acesso
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#C5A059] text-[#070D18] font-extrabold text-sm hover:bg-[#d4b068] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#070D18] border-t-transparent rounded-full animate-spin" />
                  <span>Enviando Link...</span>
                </>
              ) : (
                <>
                  <span>Enviar Link de Recuperação</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-white/5 pt-4 text-center">
            <Link to="/login" className="text-xs text-[#C5A059] font-semibold hover:underline inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
