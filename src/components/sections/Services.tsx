// /src/components/sections/Services.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SectionHeader } from '../ui/SectionHeader';
import { SERVICES_DATA, getWhatsAppUrl } from '../../data/companyData';
import { ServiceItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSiteContent } from '../../context/SiteContentContext';
import { 
  Building2, 
  ClipboardCheck, 
  Tractor, 
  HardHat, 
  Layers, 
  FileCheck2, 
  CheckCircle2, 
  FileText,
  Phone,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const Services: React.FC = () => {
  const { content } = useSiteContent();
  const servicesContent = content.services;
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('todos');

  const categories = [
    { id: 'todos', label: 'Todos os Serviços' },
    { id: 'estrutural', label: 'Estruturas' },
    { id: 'laudos', label: 'Laudos e Perícias' },
    { id: 'agronegocio', label: 'Agronegócio' },
    { id: 'gestao', label: 'Gestão de Obras' },
    { id: 'consultoria', label: 'Consultorias' },
  ];

  const filteredServices = activeTab === 'todos' 
    ? SERVICES_DATA 
    : SERVICES_DATA.filter(s => s.category === activeTab);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'estrutural': return 'Engenharia Estrutural';
      case 'laudos': return 'Laudos & Perícias';
      case 'agronegocio': return 'Infraestrutura Agro';
      case 'gestao': return 'Gestão de Obras';
      case 'consultoria': return 'Consultoria de Projetos';
      default: return 'Engenharia Civil';
    }
  };

  const getIcon = (iconName: string) => {
    const iconClass = "w-6 h-6 text-[#C5A059] group-hover:scale-110 group-hover:text-white transition-all duration-300";
    switch (iconName) {
      case 'Building2': return <Building2 className={iconClass} />;
      case 'Layers': return <Layers className={iconClass} />;
      case 'ClipboardCheck': return <ClipboardCheck className={iconClass} />;
      case 'Tractor': return <Tractor className={iconClass} />;
      case 'HardHat': return <HardHat className={iconClass} />;
      case 'BarChart3': return <BarChart3 className={iconClass} />;
      case 'FileCheck2': return <FileCheck2 className={iconClass} />;
      default: return <Building2 className={iconClass} />;
    }
  };

  return (
    <section 
      id="servicos" 
      role="region"
      aria-label="Serviços Prestados pela Engª Jucélia Santana"
      className="py-20 md:py-28 bg-[#0A1220] relative overflow-hidden border-t border-white/5"
    >
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#C5A059]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-[#C5A059]/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <SectionHeader
          badgeText={servicesContent.badgeText || "Catálogo de Soluções Técnicas"}
          title={servicesContent.title || "SERVIÇOS ESPECIALIZADOS EM"}
          highlightTitle={servicesContent.highlightTitle || "ENGENHARIA E ESTRUTURAS"}
          subtitle={servicesContent.subtitle || "Projetos estruturais de alto padrão, perícias cautelares, acompanhamento executivo e consultorias com rigor normativo NBR/ABNT e emissão de ART."}
        />

        {/* Filter Categories Tabs */}
        <div 
          className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-12"
          role="tablist"
          aria-label="Filtrar por Categoria de Serviço"
        >
          {categories.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                aria-controls="services-grid"
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2.5 rounded-full font-jakarta text-xs uppercase tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] ${
                  isActive
                    ? 'bg-[#C5A059] text-black font-bold shadow-lg shadow-[#C5A059]/25 scale-105'
                    : 'bg-[#122038] text-slate-300 hover:text-[#C5A059] hover:bg-[#182A4A] border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Premium Services Cards Grid */}
        <motion.div 
          id="services-grid"
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => (
              <motion.article
                key={service.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-[#122038] border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#C5A059]/60 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/80 relative overflow-hidden"
              >
                {/* Subtle top card accent highlight */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-4">
                  {/* Top Bar: Icon + Category Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0A1220] border border-[#C5A059]/30 flex items-center justify-center group-hover:border-[#C5A059] group-hover:bg-[#C5A059] transition-all shadow-inner">
                      {getIcon(service.iconName)}
                    </div>
                    <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#0A1220] text-[#C5A059] border border-[#C5A059]/20 shadow-sm">
                      {getCategoryLabel(service.category)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-cinzel font-bold text-lg sm:text-xl text-white group-hover:text-[#C5A059] transition-colors leading-snug">
                    {service.title}
                  </h3>

                  {/* Short Description */}
                  <p className="font-jakarta text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[54px]">
                    {service.shortDescription}
                  </p>

                  {/* Key Deliverables Highlights Preview */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <span className="font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#C5A059]/90 block">
                      Principais Entregáveis:
                    </span>
                    <ul className="space-y-1.5 font-jakarta text-xs text-slate-300">
                      {service.deliverables.slice(0, 3).map((del, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Normative Compliance Tags */}
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {service.normasTecnicas.map((norm, nIdx) => (
                      <span 
                        key={nIdx} 
                        className="text-[10px] font-jakarta px-2 py-0.5 rounded bg-[#0A1220] text-slate-300 border border-white/10 font-mono"
                      >
                        {norm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-5 mt-6 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedService(service)}
                    aria-label={`Ver detalhes técnicos e lista de entregáveis de ${service.title}`}
                    className="font-jakarta text-xs uppercase tracking-wider font-bold text-[#C5A059] hover:text-white flex items-center gap-1 transition-colors group/btn py-1"
                  >
                    <span>Saiba Mais</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <a
                    href={getWhatsAppUrl(`Olá, Engª Jucélia Santana! Gostaria de consultar orçamento para o serviço: ${service.title}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Solicitar proposta no WhatsApp para ${service.title}`}
                    className="font-jakarta text-xs uppercase font-bold px-3 py-1.5 rounded-lg bg-[#C5A059]/10 hover:bg-[#C5A059] text-[#C5A059] hover:text-black border border-[#C5A059]/30 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Orçamento</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Global CTA Banner beneath Services */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 p-6 sm:p-8 rounded-2xl bg-[#122038] border border-[#C5A059]/40 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 text-center lg:text-left relative z-10">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-[#C5A059]">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-cinzel text-xs font-bold uppercase tracking-widest">
                Responsabilidade Técnica & ART Inclusa
              </span>
            </div>
            <h3 className="font-cinzel font-bold text-white text-xl sm:text-2xl">
              Precisa de um Projeto Estrutural ou Laudo Pericial Urgente?
            </h3>
            <p className="font-jakarta text-xs sm:text-sm text-slate-300 max-w-2xl">
              Realizamos atendimento consultivo com verificação minuciosa das condições técnicas e emissão formal de ART junto ao CREA-RO.
            </p>
          </div>

          <a
            href={getWhatsAppUrl('Olá, Engª Jucélia Santana! Preciso de um atendimento técnico para apresentar meu projeto.')}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-full sm:w-auto relative z-10"
          >
            <Button
              size="md"
              variant="gold"
              icon={<Phone className="w-4 h-4" />}
              className="font-bold w-full sm:w-auto shadow-lg shadow-[#C5A059]/20"
            >
              Solicitar Orçamento no WhatsApp
            </Button>
          </a>
        </motion.div>

      </div>

      {/* Technical Detail Modal */}
      <Modal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={selectedService?.title}
        maxWidth="2xl"
      >
        {selectedService && (
          <div className="space-y-6 text-slate-300 font-jakarta">
            
            {/* Modal Header Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                {getCategoryLabel(selectedService.category)}
              </span>
              <span className="text-xs text-slate-400">
                • CREA-RO Certificado
              </span>
            </div>

            {/* Comprehensive Description */}
            <p className="text-sm sm:text-base leading-relaxed text-slate-200">
              {selectedService.fullDescription}
            </p>

            {/* Deliverables Checklist */}
            <div className="p-4 bg-[#0A1220] rounded-xl border border-white/10 space-y-3">
              <h4 className="font-cinzel font-bold text-white text-sm text-[#C5A059] flex items-center gap-2">
                <FileText className="w-4 h-4" /> Lista Completa de Entregáveis do Serviço:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                {selectedService.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-[#122038] p-2.5 rounded-lg border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NBR Technical Standards Compliance */}
            <div className="space-y-2 pt-1">
              <h4 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                Normas ABNT / NBR Integradas:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedService.normasTecnicas.map((norm, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-md bg-[#0A1220] text-[#C5A059] border border-[#C5A059]/30 text-xs font-mono">
                    {norm}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Modal Action */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Emissão garantida de ART (Anotação de Responsabilidade Técnica).</span>
              </div>

              <a
                href={getWhatsAppUrl(`Olá, Engª Jucélia Santana! Gostaria de solicitar uma proposta técnica e orçamento para o serviço de: ${selectedService.title} em Ariquemes / RO.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="sm" variant="gold" icon={<Phone className="w-4 h-4" />} className="w-full sm:w-auto font-bold">
                  Solicitar Orçamento
                </Button>
              </a>
            </div>

          </div>
        )}
      </Modal>

    </section>
  );
};


