// /src/pages/AdminContactSettings.tsx
import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  MapPin,
  Mail,
  Building,
  Shield,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useContactSettings } from '../context/ContactSettingsContext';
import { useAuth } from '../context/AuthContext';
import {
  normalizePhoneNumber,
  formatPhoneDisplay,
  getWhatsAppLink,
  getPhoneTelLink
} from '../types/contactSettings';

export default function AdminContactSettings() {
  const { user } = useAuth();
  const {
    settings,
    isLoading,
    updateSettings,
    refreshSettings,
    formattedPhone,
    formattedWhatsApp,
    getWhatsAppHref,
    getPhoneHref,
  } = useContactSettings();

  const [formData, setFormData] = useState({
    phone_number: '',
    phone_display: '',
    whatsapp_number: '',
    whatsapp_display: '',
    email: '',
    address_full: '',
    crea_registration: '',
    business_hours: '',
    whatsapp_enabled: true,
    phone_enabled: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        phone_number: settings.phone_number || '',
        phone_display: settings.phone_display || '',
        whatsapp_number: settings.whatsapp_number || '',
        whatsapp_display: settings.whatsapp_display || '',
        email: settings.email || '',
        address_full: settings.address_full || '',
        crea_registration: settings.crea_registration || '',
        business_hours: settings.business_hours || '',
        whatsapp_enabled: settings.whatsapp_enabled ?? true,
        phone_enabled: settings.phone_enabled ?? true,
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      
      // Auto formatação e auto preenchimento de display se o usuário digitar no campo principal
      if (field === 'phone_number') {
        const clean = normalizePhoneNumber(value);
        next.phone_display = formatPhoneDisplay(clean);
      }
      if (field === 'whatsapp_number') {
        const clean = normalizePhoneNumber(value);
        next.whatsapp_display = formatPhoneDisplay(clean);
      }

      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const phoneClean = normalizePhoneNumber(formData.phone_number);
      const waClean = normalizePhoneNumber(formData.whatsapp_number);

      if (!phoneClean && !waClean) {
        throw new Error('Informe ao menos um número válido de telefone ou WhatsApp.');
      }

      const ok = await updateSettings({
        phone_number: phoneClean,
        phone_display: formData.phone_display || formatPhoneDisplay(phoneClean),
        whatsapp_number: waClean,
        whatsapp_display: formData.whatsapp_display || formatPhoneDisplay(waClean),
        email: formData.email.trim(),
        address_full: formData.address_full.trim(),
        crea_registration: formData.crea_registration.trim(),
        business_hours: formData.business_hours.trim(),
        whatsapp_enabled: formData.whatsapp_enabled,
        phone_enabled: formData.phone_enabled,
      });

      if (ok) {
        setSuccessMessage('Canais de atendimento e números salvos no Supabase com sucesso!');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        throw new Error('Falha ao salvar configurações de contato.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm tracking-wider uppercase">
            <Smartphone className="w-4 h-4" />
            <span>Configurações de Contato</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Canais de Atendimento e Telefones
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerenciamento centralizado do Telefone institucional e WhatsApp. Todas as alterações refletem instantaneamente em todo o site.
          </p>
        </div>

        <button
          onClick={refreshSettings}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Recarregar
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1 & 2: Campos de Configuração */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card WhatsApp */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Canal WhatsApp Oficial</h2>
                  <p className="text-xs text-slate-400">Utilizado nos botões de atendimento rápido e links diretos</p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.whatsapp_enabled}
                  onChange={(e) => handleChange('whatsapp_enabled', e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-300">Canal Ativo</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Número para API / wa.me
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5569992086883"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Apenas números com DDD e código 55</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Texto de Exibição Visual
                </label>
                <input
                  type="text"
                  placeholder="Ex: (69) 99208-6883"
                  value={formData.whatsapp_display}
                  onChange={(e) => handleChange('whatsapp_display', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Como os visitantes verão na tela</span>
              </div>
            </div>
          </div>

          {/* Card Telefone Institucional */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Telefone Institucional / Ligação</h2>
                  <p className="text-xs text-slate-400">Utilizado nas tags tel: e contatos oficiais do escritório</p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.phone_enabled}
                  onChange={(e) => handleChange('phone_enabled', e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-300">Canal Ativo</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Número para Discagem
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5569992086883"
                  value={formData.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Número para discadores móveis</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Texto de Exibição Visual
                </label>
                <input
                  type="text"
                  placeholder="Ex: (69) 99208-6883"
                  value={formData.phone_display}
                  onChange={(e) => handleChange('phone_display', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Formato com parênteses e traço</span>
              </div>
            </div>
          </div>

          {/* Dados Complementares de Atendimento */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-500" />
              <span>Informações Institucionais de Suporte</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Horário de Atendimento
                </label>
                <input
                  type="text"
                  value={formData.business_hours}
                  onChange={(e) => handleChange('business_hours', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Registro Profissional / CREA
                </label>
                <input
                  type="text"
                  value={formData.crea_registration}
                  onChange={(e) => handleChange('crea_registration', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Endereço / Polo de Atuação
                </label>
                <input
                  type="text"
                  value={formData.address_full}
                  onChange={(e) => handleChange('address_full', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all text-sm"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Todos os Canais no Supabase</span>
            </button>
          </div>
        </div>

        {/* Coluna 3: Painel de Prévia em Tempo Real */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Simulação dos Links Públicos</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-slate-500 block font-semibold">BOTÃO WHATSAPP PÚBLICO:</span>
                <div className="text-emerald-400 font-medium flex items-center gap-1.5 truncate">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{formData.whatsapp_display || '(Não configurado)'}</span>
                </div>
                <a
                  href={getWhatsAppHref('Teste de canal institucional')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 mt-1 underline"
                >
                  <span>Testar Link do WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-slate-500 block font-semibold">BOTÃO LIGAR PÚBLICO:</span>
                <div className="text-blue-400 font-medium flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{formData.phone_display || '(Não configurado)'}</span>
                </div>
                <a
                  href={getPhoneHref()}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 mt-1 underline"
                >
                  <span>Testar Link de Ligação ({getPhoneHref()})</span>
                </a>
              </div>
            </div>

            <div className="p-3.5 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-300/80 text-xs leading-relaxed">
              💡 <strong>Garantia de Fonte Única:</strong> Ao salvar, Navbar, Rodapé, Seção Contato, CTAs e botões flutuantes passam a responder imediatamente a estes dados.
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-white font-semibold block">Domínios Oficiais do Site</span>
                <span className="text-slate-400">Configure o domínio institucional e endereços de acesso ao portal.</span>
              </div>
              <a
                href="/admin/domains"
                className="px-3 py-1.5 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-bold hover:bg-[#C5A059] hover:text-[#070D18] transition-all shrink-0"
              >
                Gerenciar Domínios
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
