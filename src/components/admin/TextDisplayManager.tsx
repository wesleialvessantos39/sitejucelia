// /src/components/admin/TextDisplayManager.tsx
import React, { useState, useEffect } from 'react';
import { useTextDisplay } from '../../context/TextDisplayContext';
import {
  TextDisplaySettings,
  PublicTextSection,
  TextDisplayMode,
  PUBLIC_SECTIONS,
} from '../../types/textDisplay';
import {
  DEFAULT_TEXT_DISPLAY_SETTINGS,
  SECTION_METADATA,
} from '../../data/defaultTextDisplaySettings';
import {
  Sliders,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { SmartText } from '../ui/SmartText';

export const TextDisplayManager: React.FC = () => {
  const { settings, saveSettings, resetSettings } = useTextDisplay();
  const [formData, setFormData] = useState<TextDisplaySettings>(settings);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [activeSectionOverride, setActiveSectionOverride] = useState<PublicTextSection>('about');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleToggleEnabled = () => {
    setFormData((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const handleGlobalModeChange = (mode: TextDisplayMode) => {
    setFormData((prev) => ({
      ...prev,
      mode,
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const success = await saveSettings(formData);
      if (success) {
        setFeedback({
          type: 'success',
          message: 'Configurações de exibição inteligente dos textos salvas com sucesso! O site público já está atualizado.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Erro ao salvar configurações no Supabase. Verifique sua conexão.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Ocorreu um erro ao salvar as configurações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Deseja restaurar as configurações recomendadas de exibição de textos?')) {
      const success = await resetSettings();
      if (success) {
        setFormData(DEFAULT_TEXT_DISPLAY_SETTINGS);
        setFeedback({
          type: 'info',
          message: 'Configurações restauradas para os padrões recomendados com sucesso.',
        });
      }
    }
  };

  const sampleLongText =
    'Com sólida experiência em engenharia civil e atuação focada em Rondônia, a Engª Jucélia Santana desenvolve projetos estruturais de alta precisão e laudos cautelares NBR para empreendimentos residenciais, comerciais, industriais e do agronegócio. Nossos projetos combinam precisão matemática, uso racional de insumos e conformidade rigorosa com as normas ABNT NBR 6118, NBR 6120 e NBR 13752. Garantimos total transparência, cumprimento rigoroso de prazos e acompanhamento consultivo direto em todas as fases da obra.';

  return (
    <div className="space-y-8">
      {/* Top Banner Alert / Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : feedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          ) : (
            <Info className="w-5 h-5 shrink-0 text-blue-400" />
          )}
          <span className="text-xs sm:text-sm font-jakarta">{feedback.message}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        
        {/* 1. Global Activation Card */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-cinzel font-bold text-lg text-white">
                  Redução Inteligente de Textos Longos (OE-SITE-001)
                </h3>
              </div>
              <p className="font-jakarta text-xs text-slate-400">
                Reduz a altura visual de parágrafos extensos mantendo o conteúdo original integral no banco de dados.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C5A059] ${
                formData.enabled ? 'bg-[#C5A059]' : 'bg-slate-700'
              }`}
              role="switch"
              aria-checked={formData.enabled}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  formData.enabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#C5A059]">
              Modo Padrão Global de Exibição
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'collapsible',
                  title: 'Reduzido com "Ler mais"',
                  desc: 'Limita as linhas e exibe um botão elegante para expandir/recolher o texto completo.',
                },
                {
                  id: 'compact',
                  title: 'Compacto Fixo',
                  desc: 'Limita as linhas estritamente sem botão de expansão (ideal para cards pequenos).',
                },
                {
                  id: 'full',
                  title: 'Integral (Sem Redução)',
                  desc: 'Exibe todo o texto original sem truncamento visual.',
                },
              ].map((m) => {
                const isSelected = formData.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleGlobalModeChange(m.id as TextDisplayMode)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#122038] border-[#C5A059] shadow-lg shadow-[#C5A059]/10'
                        : 'bg-[#0E1B31]/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-cinzel text-xs font-bold text-white">{m.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />}
                    </div>
                    <p className="font-jakarta text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device Line Limits */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#C5A059]">
              Limite de Linhas Visíveis por Tipo de Dispositivo
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mobile */}
              <div className="p-4 bg-[#0E1B31] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#C5A059]" /> Mobile (&lt; 768px)
                  </span>
                  <span className="text-xs font-bold text-[#C5A059]">{formData.mobileLines} linhas</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={formData.mobileLines}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mobileLines: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#C5A059] cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">Recomendado: 3 linhas para telas compactas.</span>
              </div>

              {/* Tablet */}
              <div className="p-4 bg-[#0E1B31] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Tablet className="w-4 h-4 text-[#C5A059]" /> Tablet (768px - 1024px)
                  </span>
                  <span className="text-xs font-bold text-[#C5A059]">{formData.tabletLines} linhas</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={formData.tabletLines}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tabletLines: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#C5A059] cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">Recomendado: 4 linhas para tablets.</span>
              </div>

              {/* Desktop */}
              <div className="p-4 bg-[#0E1B31] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-[#C5A059]" /> Desktop (&gt; 1024px)
                  </span>
                  <span className="text-xs font-bold text-[#C5A059]">{formData.desktopLines} linhas</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={formData.desktopLines}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      desktopLines: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#C5A059] cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">Recomendado: 5 linhas para monitores.</span>
              </div>
            </div>
          </div>

          {/* Trigger Threshold & Button Labels */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Gatilho Mínimo de Caracteres
              </label>
              <input
                type="number"
                min="80"
                max="600"
                step="10"
                value={formData.minimumCharacters}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimumCharacters: Number(e.target.value),
                  }))
                }
                className="w-full px-3.5 py-2 bg-[#0E1B31] border border-white/10 rounded-xl text-white text-xs font-mono focus:border-[#C5A059] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Textos menores serão exibidos sem truncamento.</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Rótulo do Botão "Expandir"
              </label>
              <input
                type="text"
                value={formData.expandLabel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expandLabel: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2 bg-[#0E1B31] border border-white/10 rounded-xl text-white text-xs focus:border-[#C5A059] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Padrão: "Ler mais..."</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Rótulo do Botão "Recolher"
              </label>
              <input
                type="text"
                value={formData.collapseLabel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    collapseLabel: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2 bg-[#0E1B31] border border-white/10 rounded-xl text-white text-xs focus:border-[#C5A059] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Padrão: "Ler menos"</span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Live Preview Simulator */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-cinzel font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C5A059]" /> Simulador Visual em Tempo Real
              </h3>
              <p className="text-xs text-slate-400 font-jakarta mt-0.5">
                Veja exatamente como o texto será apresentado aos visitantes nos diferentes dispositivos.
              </p>
            </div>

            {/* Viewport Switcher */}
            <div className="flex items-center gap-1.5 bg-[#0E1B31] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  previewViewport === 'mobile'
                    ? 'bg-[#C5A059] text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile ({formData.mobileLines}l)
              </button>

              <button
                type="button"
                onClick={() => setPreviewViewport('tablet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  previewViewport === 'tablet'
                    ? 'bg-[#C5A059] text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" /> Tablet ({formData.tabletLines}l)
              </button>

              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  previewViewport === 'desktop'
                    ? 'bg-[#C5A059] text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop ({formData.desktopLines}l)
              </button>
            </div>
          </div>

          {/* Simulated Card Container */}
          <div
            className={`mx-auto p-6 rounded-2xl bg-[#122038] border border-[#C5A059]/40 shadow-inner transition-all duration-300 ${
              previewViewport === 'mobile'
                ? 'max-w-sm'
                : previewViewport === 'tablet'
                ? 'max-w-md'
                : 'max-w-2xl'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-2 mb-3">
              <span className="font-semibold text-white">Simulação — Seção Sobre</span>
              <span className="text-[10px] text-[#C5A059]">
                {previewViewport.toUpperCase()} • Modo:{' '}
                {formData.enabled ? formData.mode : 'desativado (integral)'}
              </span>
            </div>

            <SmartText
              section="about"
              text={sampleLongText}
              className="text-slate-300 font-jakarta text-xs sm:text-sm leading-relaxed"
              forceMaxLines={
                previewViewport === 'mobile'
                  ? formData.mobileLines
                  : previewViewport === 'tablet'
                  ? formData.tabletLines
                  : formData.desktopLines
              }
              forceMode={formData.enabled ? formData.mode : 'full'}
            />
          </div>
        </div>

        {/* 3. Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrões Recomendados</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#C5A059] hover:bg-[#DFB76C] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/20 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações de Exibição</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
