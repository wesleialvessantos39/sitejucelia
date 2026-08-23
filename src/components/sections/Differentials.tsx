// /src/components/sections/Differentials.tsx
import React from 'react';
import { motion } from 'motion/react';
import { SectionHeader } from '../ui/SectionHeader';
import { getActiveDifferentials } from '../../data/differentials';
import { useSiteContent } from '../../context/SiteContentContext';
import { 
  UserCheck, 
  Compass, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Eye, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Box, 
  TrendingUp,
  Check
} from 'lucide-react';

export const Differentials: React.FC = () => {
  const { content } = useSiteContent();
  const diffContent = content.differentials;
  const differentials = getActiveDifferentials();

  // Helper function to map dynamic icon name string to Lucide Component
  const renderIcon = (iconName: string) => {
    const iconProps = { className: "w-7 h-7 text-[#C5A059] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" };
    
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck {...iconProps} />;
      case 'Compass':
        return <Compass {...iconProps} />;
      case 'Clock':
        return <Clock {...iconProps} />;
      case 'ShieldCheck':
        return <ShieldCheck {...iconProps} />;
      case 'Layers':
        return <Layers {...iconProps} />;
      case 'Eye':
        return <Eye {...iconProps} />;
      case 'Award':
        return <Award {...iconProps} />;
      case 'CheckCircle2':
        return <CheckCircle2 {...iconProps} />;
      case 'Box':
        return <Box {...iconProps} />;
      case 'TrendingUp':
        return <TrendingUp {...iconProps} />;
      default:
        return <ShieldCheck {...iconProps} />;
    }
  };

  return (
    <section 
      id="diferenciais" 
      className="py-20 md:py-28 bg-[#0A1220] relative overflow-hidden"
      aria-label="Diferenciais Competitivos da Jucélia Santana Engenharia Civil"
    >
      {/* Ambient Gold Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A059]/5 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <SectionHeader
          badgeText={diffContent.badgeText || "Diferenciais de Excelência"}
          title={diffContent.title || "Por que Contratar a"}
          highlightTitle={diffContent.highlightTitle || "Jucélia Santana Engenharia Civil?"}
          subtitle={diffContent.subtitle || "Segurança jurídica, rigor normativo ABNT, pontualidade inegociável e atendimento personalizado focado na máxima eficiência e valorização do seu investimento."}
        />

        {/* Responsive Grid of Differentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {differentials.map((item, index) => {
            const displayTitle = item.titulo || item.title || '';
            const displayDesc = item.descricao || item.description || '';
            const iconKey = item.icone || item.iconName || 'ShieldCheck';
            const itemNumber = item.number || String(index + 1).padStart(2, '0');

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.5, 
                  delay: (index % 4) * 0.1,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="group relative bg-[#122038] border border-white/10 hover:border-[#C5A059]/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#C5A059]/10 focus-within:ring-2 focus-within:ring-[#C5A059]"
              >
                {/* Background Watermark Number */}
                <div 
                  className="absolute top-4 right-5 font-cinzel font-black text-4xl sm:text-5xl text-[#C5A059]/10 group-hover:text-[#C5A059]/20 transition-colors pointer-events-none select-none"
                  aria-hidden="true"
                >
                  {itemNumber}
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Icon Container with Gold Border */}
                  <div className="w-14 h-14 rounded-2xl bg-[#0A1220] border border-[#C5A059]/30 group-hover:border-[#C5A059] flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-[0_0_15px_rgba(197,160,89,0.25)]">
                    {renderIcon(iconKey)}
                  </div>

                  {/* Title */}
                  <h3 className="font-cinzel font-bold text-lg text-white group-hover:text-[#C5A059] transition-colors leading-snug">
                    {displayTitle}
                  </h3>

                  {/* Objective Description */}
                  <p className="font-jakarta text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {displayDesc}
                  </p>
                </div>

                {/* Card Institutional Badge Footer */}
                <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between text-xs font-jakarta text-[#C5A059]/80 group-hover:text-[#C5A059] transition-colors relative z-10">
                  <span className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 text-[#C5A059]" /> Padrão de Engenharia
                  </span>
                  <Sparkles className="w-3 h-3 text-[#C5A059]/60 group-hover:text-[#C5A059] transition-colors" />
                </div>

                {/* Card Top Border Gold Accent line on hover */}
                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.article>
            );
          })}
        </div>

        {/* Institutional Quality Bar Below Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 p-6 sm:p-8 bg-[#122038] border border-[#C5A059]/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/40 flex items-center justify-center shrink-0 text-[#C5A059] hidden sm:flex">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-base sm:text-lg text-white">
                Garantia Técnica e Registro CREA: 22430D/RO
              </h4>
              <p className="font-jakarta text-xs text-slate-400 mt-1 max-w-2xl">
                Todos os nossos projetos e laudos periciais são assinados com Anotação de Responsabilidade Técnica (ART), garantindo validade jurídica nacional, fiscalização conforme NBRs da ABNT e tranquilidade total para seu empreendimento.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <a
              href="#contato"
              className="px-6 py-3 rounded-full bg-[#C5A059] hover:bg-[#b08e4a] text-black font-jakarta font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-[#C5A059]/20 hover:scale-105 active:scale-95"
            >
              Falar com Engenheira
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
