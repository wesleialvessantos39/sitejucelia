// /src/components/sections/CTA.tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { getWhatsAppUrl, COMPANY_INFO, PROJECTS_DATA } from '../../data/companyData';
import { useSiteContent } from '../../context/SiteContentContext';
import { 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  Phone,
  Award,
  ArrowRight,
  HardHat
} from 'lucide-react';

import { getAssetUrl, handleStructuralPhotoError } from '../../utils/assetUtils';

export const CTA: React.FC = () => {
  const { content } = useSiteContent();
  const ctaContent = content.cta;
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(COMPANY_INFO.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 3000);
    }
  };

  const whatsAppUrl = getWhatsAppUrl(
    'Olá, Engª Jucélia Santana! Gostaria de solicitar um orçamento sem compromisso para meu projeto.'
  );

  // High resolution existing project image from company data
  const bgImageUrl = PROJECTS_DATA[0]?.imageUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

  return (
    <section 
      id="cta"
      role="region"
      aria-label="Chamada para Ação e Solicitação de Orçamento"
      className="relative py-24 md:py-32 overflow-hidden bg-[#0A1220] border-t border-white/10"
    >
      {/* Background Work Photo with Dark Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={getAssetUrl(bgImageUrl)}
          alt="Obra de Engenharia Estrutural Jucélia Santana"
          decoding="async"
          loading="lazy"
          onError={handleStructuralPhotoError}
          className="w-full h-full object-cover object-center scale-105 filter brightness-40 contrast-125"
        />
        {/* Dark Multi-layer Gradient Overlay for Contrast & Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1220] via-[#0A1220]/95 to-[#0A1220]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1220] via-transparent to-[#0A1220]" />
      </div>

      {/* Radial Gold Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C5A059]/10 rounded-full filter blur-[150px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main CTA Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-[#122038]/95 border border-[#C5A059]/50 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl backdrop-blur-xl overflow-hidden group"
        >
          {/* Top Gold Subtle Accent Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />

          {/* Institutional Floating Badge */}
          <div className="flex justify-center md:justify-start mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0A1220] border border-[#C5A059]/40 text-[#C5A059] font-jakarta text-xs font-bold uppercase tracking-widest shadow-md">
              <Award className="w-4 h-4 text-[#C5A059]" />
              <span>{ctaContent.badgeText || "Engenharia Estrutural de Alto Padrão"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Title, Description & Action Buttons */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Headline */}
              <h2 className="font-cinzel font-bold text-2xl sm:text-4xl lg:text-5xl text-white leading-tight sm:leading-snug">
                {ctaContent.title || "SOLICITE SEU ORÇAMENTO TÉCNICO"}{' '}
                <span className="text-[#C5A059] relative inline-block">
                  {ctaContent.highlightTitle || "SEM COMPROMISSO"}
                  <span className="absolute bottom-1 left-0 w-full h-[2px] bg-[#C5A059]/40" />
                </span>
              </h2>

              {/* Subtitle */}
              <p className="font-jakarta text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {ctaContent.subtitle || "Garanta a máxima segurança estrutural, conformidade rigorosa com normas ABNT e economia real em materiais para seu empreendimento."}
              </p>

              {/* Buttons Area */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                
                {/* Primary Button: WhatsApp Direct */}
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="gold"
                    icon={<MessageSquare className="w-5 h-5" />}
                    className="w-full sm:w-auto justify-center font-bold tracking-wider text-xs sm:text-sm uppercase shadow-xl hover:shadow-[#C5A059]/30 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[48px]"
                  >
                    {ctaContent.buttonText || "Solicitar Orçamento no WhatsApp"}
                  </Button>
                </a>

                {/* Secondary Button: Form Anchor */}
                <a
                  href="#contato"
                  className="w-full sm:w-auto"
                >
                  <button
                    type="button"
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-xl bg-[#0A1220] hover:bg-[#C5A059] text-slate-200 hover:text-black border border-white/20 hover:border-[#C5A059] font-jakarta text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <FileText className="w-4 h-4 text-[#C5A059] group-hover:text-black transition-colors" />
                    <span>Enviar Mensagem pelo Site</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </a>

              </div>

              {/* Contact Direct Line & CREA */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-jakarta text-slate-400">
                <button
                  onClick={handleCopyPhone}
                  className="flex items-center gap-1.5 hover:text-[#C5A059] transition-colors cursor-pointer"
                  title="Clique para copiar telefone"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{COMPANY_INFO.phone}</span>
                  {copiedPhone && <span className="text-emerald-400 font-bold ml-1">(Copiado!)</span>}
                </button>

                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{COMPANY_INFO.crea}</span>
                </span>
              </div>

            </div>

            {/* Right Column: Institutional Guarantees Cards */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="text-xs font-jakarta uppercase tracking-wider text-[#C5A059] font-bold mb-3 text-center lg:text-left flex items-center justify-center lg:justify-start gap-2">
                <HardHat className="w-4 h-4" />
                <span>Garantias da Nossa Engenharia</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0A1220]/90 border border-white/10 hover:border-[#C5A059]/50 transition-all duration-300 flex items-start gap-3.5 group/guarantee">
                  <div className="w-10 h-10 rounded-xl bg-[#122038] border border-[#C5A059]/40 flex items-center justify-center shrink-0 text-[#C5A059] shadow-inner">
                    <Clock className="w-5 h-5 group-hover/guarantee:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-cinzel font-bold text-xs sm:text-sm text-white group-hover/guarantee:text-[#C5A059] transition-colors">
                      Atendimento Inicial Rápido
                    </h4>
                    <p className="font-jakarta text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      Análise preliminar do projeto arquitetônico e retorno com plano técnico em até 24 horas.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A1220]/90 border border-white/10 hover:border-[#C5A059]/50 transition-all duration-300 flex items-start gap-3.5 group/guarantee">
                  <div className="w-10 h-10 rounded-xl bg-[#122038] border border-[#C5A059]/40 flex items-center justify-center shrink-0 text-[#C5A059] shadow-inner">
                    <ShieldCheck className="w-5 h-5 group-hover/guarantee:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-cinzel font-bold text-xs sm:text-sm text-white group-hover/guarantee:text-[#C5A059] transition-colors">
                      ART Registrada no CREA-RO
                    </h4>
                    <p className="font-jakarta text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      Responsabilidade técnica formalizada perante todos os órgãos competentes e prefeituras.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A1220]/90 border border-white/10 hover:border-[#C5A059]/50 transition-all duration-300 flex items-start gap-3.5 group/guarantee">
                  <div className="w-10 h-10 rounded-xl bg-[#122038] border border-[#C5A059]/40 flex items-center justify-center shrink-0 text-[#C5A059] shadow-inner">
                    <UserCheck className="w-5 h-5 group-hover/guarantee:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-cinzel font-bold text-xs sm:text-sm text-white group-hover/guarantee:text-[#C5A059] transition-colors">
                      Economia Racional de Insumos
                    </h4>
                    <p className="font-jakarta text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      Cálculos otimizados para redução de consumo de aço e concreto sem desperdícios.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Metric Trust Highlights */}
          <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-jakarta">
            <div className="p-2">
              <span className="text-[#C5A059] font-bold text-xl sm:text-2xl block font-cinzel">100%</span>
              <span className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider">Normas ABNT Atendidas</span>
            </div>
            <div className="p-2">
              <span className="text-[#C5A059] font-bold text-xl sm:text-2xl block font-cinzel">CREA-RO</span>
              <span className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider">Engenharia Habilitada</span>
            </div>
            <div className="p-2">
              <span className="text-[#C5A059] font-bold text-xl sm:text-2xl block font-cinzel">3D BIM</span>
              <span className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider">Compatibilização Completa</span>
            </div>
            <div className="p-2">
              <span className="text-[#C5A059] font-bold text-xl sm:text-2xl block font-cinzel">Suporte</span>
              <span className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider">Acompanhamento de Obra</span>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
};
