// /src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isAdmin, loading, logout, user, profile } = useAuth();
  const location = useLocation();

  // 1. Estado de Carregamento Inicial
  if (loading) {
    return <div className="min-h-screen bg-[#070D18]" />;
  }

  // 2. Não Autenticado -> Redirecionar para Login
  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Autenticado mas sem Permissão de Administrador Ativo
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0B1526] border border-rose-500/30 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white font-serif">Acesso Restrito</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sua conta (<span className="text-white font-medium">{user.email}</span>) não possui permissão de Administrador Ativo no sistema.
            </p>
            {profile && (
              <div className="p-3 bg-white/5 rounded-xl text-left text-xs space-y-1 mt-3">
                <p><span className="text-slate-400">Função:</span> <span className="text-[#C5A059] capitalize font-medium">{profile.role}</span></p>
                <p><span className="text-slate-400">Status:</span> <span className="text-slate-200 capitalize font-medium">{profile.status}</span></p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/"
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Site
            </Link>
            <button
              onClick={() => logout()}
              type="button"
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Autenticado e Autorizado
  return children ? <>{children}</> : null;
}
