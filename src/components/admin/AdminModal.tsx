import React from 'react';
import { Link } from 'react-router-dom';
import { X, Building2, ShieldCheck } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated?: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0A1220] border border-[#C5A059]/30 rounded-2xl shadow-2xl overflow-hidden my-8 p-6 md:p-8 space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-2xl text-[#C5A059]">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="font-cinzel font-bold text-2xl text-white">
            Painel Administrativo CMS
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Acesse as rotas administrativas dedicadas no menu do sistema para visualizar o gerenciamento de obras e convites.
          </p>
        </div>

        <div className="p-4 bg-[#122038] border border-white/10 rounded-xl space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#C5A059] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Interface Ativa
          </div>
          <p className="text-xs text-slate-300">
            Acesse diretamente <span className="font-mono text-white font-bold">/admin/dashboard</span> para navegar no painel visual completo.
          </p>
          <Link
            to="/admin/dashboard"
            onClick={onClose}
            className="inline-block px-5 py-2.5 rounded-xl bg-[#C5A059] text-[#070D18] font-bold text-xs uppercase tracking-wider hover:bg-[#b08d48] transition-colors"
          >
            Abrir Painel Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
