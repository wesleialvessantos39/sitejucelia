// /src/components/sections/About.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SectionHeader } from '../ui/SectionHeader';
import { COMPANY_INFO, getWhatsAppUrl } from '../../data/companyData';
import { Button } from '../ui/Button';
import { INSTITUTIONAL_PHOTO } from '../../data/engineerPhotos';
import { supabaseDatabase } from '../../services/supabaseDatabase';
import { useSiteContent } from '../../context/SiteContentContext';
import { useMediaDisplay } from '../../context/MediaDisplayContext';
import { ManagedMedia } from '../ui/ManagedMedia';
import type { InstitutionalPhoto } from '../../types';
import {
  ShieldCheck,
  Compass,
  Target,
  UserCheck,
  GraduationCap,
  Briefcase,
  Building2,
  FileCheck2,
  Phone,
  Award,
  X,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const About: React.FC = () => {
  const { content } = useSiteContent();
  const aboutContent = content.about;
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [profilePhoto, setProfilePhoto] = useState<{ id: string; url: string }>({
    id: INSTITUTIONAL_PHOTO.id,
    url: INSTITUTIONAL_PHOTO.url,
  });

  // Carrega a Foto Principal de Perfil Institucional do Supabase
  useEffect(() => {
    let isMounted = true;
    const loadProfilePhoto = async () => {
      try {
        const photos = await supabaseDatabase.getInstitutionalPhotos();
        if (isMounted && photos && photos.length > 0) {
          const primary = photos.find((p) => p.is_primary && p.active !== false) ||
                          photos.find((p) => p.active !== false);
          if (primary && primary.image_url) {
            setProfilePhoto({ id: primary.id, url: primary.image_url });
          }
        }
      } catch (err) {
        console.warn('[About] Erro ao carregar foto de perfil institucional do Supabase:', err);
      }
    };
    loadProfilePhoto();
    return () => {
      isMounted = false;
    };
  }, []);

  const whatsAppUrl = getWhatsAppUrl(
    'Olá, Engª Jucélia Santana! Gostaria de agendar uma consulta técnica presencial para apresentar meu projeto em Ariquemes - RO.'
  );

  const differentials = [
    {
      icon: ShieldCheck,
      title: 'Compliance e Normas ABNT',
      description: 'Aderência estrita às normas NBR 6118, NBR 13752, NBR 6120 e regulamentações do sistema CONFEA/CREA-RO.'
    },
    {
      icon: Compass,
      title: 'Modelagem 3D e Compatibilização',
      description: 'Análise tridimensional refinada para eliminar interferências antes da execução física na canteiro de obras.'
    },
    {
      icon: Target,
      title: 'Engenharia Econômica Racional',
      description: 'Otimização inteligente de insumos (aço e concreto) mantendo margens elevadas de segurança estrutural.'
    },
    {
      icon: UserCheck,
      title: 'Atendimento Consultivo Direto',
      description: 'Acompanhamento pessoal da Engª Jucélia Santana em todas as fases da concepção ao suporte executivo.'
    },
    {
      icon: FileCheck2,
      title: 'Laudos Periciais e Vistorias',
      description: 'Diagnósticos cautelares, perícias prediais e laudos fotográficos com rigor técnico e suporte legal.'
    },
    {
      icon: Briefcase,
      title: 'Anotação de Responsabilidade (ART)',
      description: 'Emissão e registro formal de ART perante o CREA-RO para 100% dos projetos e laudos emitidos.'
    }
  ];

  const pillars = [
    {
      title: 'Missão',
      description: 'Projetar e gerir obras com precisão matemática, viabilidade financeira e total segurança estrutural.'
    },
    {
      title: 'Visão',
      description: 'Ser referência regional em engenharia estrutural de alto padrão e laudos cautelares em Rondônia.'
    },
    {
      title: 'Valores',
      description: 'Rigor técnico inegociável, ética absoluta, pontualidade nas entregas e transparência total.'
    }
  ];

  return (
    <section
      id="sobre"
      role="region"
      aria-label="Sobre a Engenheira Jucélia Santana"
      className="py-20 md:py-28 bg-[#0A1220] relative overflow-hidden border-t border-white/5"
    >
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#C5A059]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#C5A059]/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <SectionHeader
          badgeText={aboutContent.badgeText || "Institucional e Perfil Técnico"}
          title={aboutContent.title || "ENGª JUCÉLIA SANTANA"}
          highlightTitle={aboutContent.highlightTitle || "SOLIDEZ, PRECISÃO E CREDIBILIDADE"}
          subtitle={aboutContent.subtitle || "Engenheira Civil registrada no CREA-RO, especializada em cálculo de estruturas, perícias e soluções de engenharia para edificações e agronegócio."}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mt-12">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative space-y-4"
          >
            <div className="relative rounded-2xl overflow-hidden group">
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="relative w-full h-[400px] sm:h-[480px] md:h-[520px] rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
              >
                <ManagedMedia
                  mediaKey={`institutional_photo:${profilePhoto.id}`}
                  src={profilePhoto.url}
                  alt="Engª Jucélia Santana - Perfil Institucional de Engenharia"
                  context="institutional_photo"
                  className="rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  containerClassName="rounded-2xl"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = `./photos/${INSTITUTIONAL_PHOTO.filename}`;
                    }
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-[#122038]/90 border border-white/10 rounded-2xl space-y-2.5 font-jakarta text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span><strong>Formação:</strong> Bacharelado em Engenharia Civil</span>
              </div>
              <div className="flex items-center gap-3 border-t border-white/5 pt-2.5">
                <Building2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span><strong>Sede Técnica:</strong> Ariquemes - RO (Atendimento em todo o Estado)</span>
              </div>
              <div className="flex items-center gap-3 border-t border-white/5 pt-2.5">
                <Briefcase className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span><strong>Atuação:</strong> Estruturas, Perícias, Consultoria e Laudos</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-bold font-jakarta text-[#C5A059] uppercase tracking-wider">
                SOMOS ESPECIALISTAS EM ENGENHARIA ESTRUTURAL E GESTÃO DE OBRAS QUE DÃO FORMA AO SONHO E SOLIDEZ À ENTREGA.
              </p>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-cinzel text-white leading-tight">
                Mais que obra, é compromisso com confiança e qualidade
              </h3>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#122038] border-l-4 border-[#C5A059] border-y border-r border-white/5 shadow-xl">
              <p className="text-white font-medium text-base sm:text-lg italic leading-relaxed">
                "A engenharia estrutural de excelência combina rigor matemático inegociável, responsabilidade legal e visão prática para transformar conceitos arquitetônicos em edificações seguras e duradouras."
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-cinzel text-[#C5A059] uppercase tracking-wider">
                    Engª Jucélia Santana
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Engenheira Civil — {COMPANY_INFO.crea}
                  </p>
                </div>
                <Award className="w-5 h-5 text-[#C5A059]/80" />
              </div>
            </div>

            <div className="space-y-4 text-slate-300 font-jakarta text-sm sm:text-base leading-relaxed">
              <p>
                {aboutContent.bioParagraph1 || 'Com sólida experiência em engenharia civil e atuação focada em Rondônia, a Engª Jucélia Santana desenvolve projetos estruturais de alta precisão e laudos cautelares NBR para empreendimentos residenciais, comerciais, industriais e do agronegócio.'}
              </p>
              <p>
                {aboutContent.bioParagraph2 || 'Nossos projetos combinam precisão matemática, uso racional de insumos e conformidade rigorosa com as normas ABNT NBR 6118, NBR 6120 e NBR 13752. Garantimos total transparência, cumprimento de prazos e acompanhamento consultivo direto.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#122038] border border-white/10 rounded-xl hover:border-[#C5A059]/40 transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                    <span className="font-cinzel text-xs font-bold text-white uppercase tracking-wider">
                      {pillar.title}
                    </span>
                  </div>
                  <p className="font-jakarta text-xs text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#servicos"
                className="w-full sm:w-auto"
              >
                <Button
                  size="md"
                  variant="gold"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="font-bold shadow-lg shadow-[#C5A059]/20 w-full uppercase tracking-wider"
                >
                  Nossos Serviços
                </Button>
              </a>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-jakarta text-xs uppercase tracking-wider text-slate-300 hover:text-[#C5A059] font-bold py-3 px-4 transition-colors flex items-center justify-center gap-1.5 border border-white/10 rounded-xl bg-[#122038] hover:border-[#C5A059]/30"
              >
                <Phone className="w-4 h-4 text-[#C5A059]" />
                <span>Agendar Consulta Técnica</span>
              </a>
            </div>
          </motion.div>

        </div>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {isLightboxOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsLightboxOpen(false)}
                className="fixed inset-0 z-[9999] bg-[#0A1220]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 overflow-hidden cursor-pointer"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between max-w-5xl mx-auto w-full z-20 border-b border-white/10 pb-3 cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-cinzel font-bold text-white text-base sm:text-lg">
                      Engª Jucélia Santana — Perfil Institucional
                    </span>
                    <span className="text-[#C5A059] font-jakarta text-xs font-semibold px-2.5 py-1 rounded bg-[#C5A059]/10 border border-[#C5A059]/30 hidden sm:inline-block">
                      {COMPANY_INFO.crea}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Fechar visualização"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-w-5xl max-h-[85vh] mx-auto w-full flex items-center justify-center my-auto p-2 cursor-default"
                >
                  <img
                    src={profilePhoto.url}
                    alt="Engª Jucélia Santana - Perfil Institucional"
                    className="max-h-[82vh] max-w-full w-auto object-contain rounded-xl shadow-2xl border border-white/10 bg-[#0A1220]"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedFallback) {
                        target.dataset.triedFallback = 'true';
                        target.src = `./photos/${INSTITUTIONAL_PHOTO.filename}`;
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 pt-12 border-t border-white/10"
        >
          <div className="text-center mb-8">
            <span className="font-jakarta text-xs uppercase tracking-widest text-[#C5A059] font-bold block mb-1">
              Métricas e Reconhecimento
            </span>
            <h3 className="font-cinzel font-bold text-white text-2xl sm:text-3xl">
              Nossa Trajetória em Números
            </h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {COMPANY_INFO.stats.map((stat, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-xl bg-[#122038] border border-white/5 hover:border-[#C5A059]/30 transition-all text-center group shadow-md"
              >
                <span className="font-cinzel font-black text-3xl sm:text-4xl gold-gradient-text block mb-2 group-hover:scale-105 transition-transform">
                  {stat.value}
                </span>
                <span className="font-jakarta text-xs text-slate-300 font-medium block leading-snug">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 pt-12 border-t border-white/10"
        >
          <div className="text-center mb-10">
            <span className="font-jakarta text-xs uppercase tracking-widest text-[#C5A059] font-bold block mb-1">
              Diferenciais Executivos
            </span>
            <h3 className="font-cinzel font-bold text-white text-2xl sm:text-3xl">
              Por que Escolher Nossos Serviços
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentials.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-[#122038] border border-white/10 rounded-2xl hover:border-[#C5A059]/40 transition-all duration-300 hover:-translate-y-1 group shadow-lg"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] mb-4 group-hover:bg-[#C5A059] group-hover:text-black transition-colors">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h4 className="font-cinzel font-bold text-white text-base mb-2 group-hover:text-[#C5A059] transition-colors">
                    {item.title}
                  </h4>
                  <p className="font-jakarta text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </section>
  );
};
