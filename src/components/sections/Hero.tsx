// /src/components/sections/Hero.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { COMPANY_INFO, getWhatsAppUrl } from '../../data/companyData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ShieldCheck,
  ArrowRight,
  Phone,
  CheckCircle2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Award,
  Building2,
  ChevronDown
} from 'lucide-react';

import { supabaseDatabase } from '../../services/supabaseDatabase';
import { useSiteContent } from '../../context/SiteContentContext';
import { useMediaDisplay } from '../../context/MediaDisplayContext';
import { SmartText } from '../ui/SmartText';
import type { DashboardSlide } from '../../types';

// Fotos de alta resolução como fallback seguro caso nenhum slide esteja cadastrado no Supabase
const DEFAULT_HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80'
];

export const Hero: React.FC = () => {
  const { content } = useSiteContent();
  const { getSettingForMedia } = useMediaDisplay();
  const heroContent = content.hero;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [heroSlides, setHeroSlides] = useState<Array<{ id: string; url: string }>>(() =>
    DEFAULT_HERO_PHOTOS.map((url, idx) => ({ id: `slide-0${idx + 1}`, url }))
  );
  const SLIDE_DURATION = 6000; // 6 segundos por foto no fundo

  // Carrega os slides ativos configurados no Supabase
  useEffect(() => {
    let isMounted = true;
    const loadSlides = async () => {
      try {
        const slides = await supabaseDatabase.getDashboardSlides();
        if (isMounted && slides && slides.length > 0) {
          const activeSlides = slides
            .filter((s) => s.active !== false)
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

          if (activeSlides.length > 0) {
            setHeroSlides(activeSlides.map((s) => ({ id: s.id, url: s.image_url })));
          } else {
            setHeroSlides(DEFAULT_HERO_PHOTOS.map((url, idx) => ({ id: `slide-0${idx + 1}`, url })));
          }
        }
      } catch (err) {
        console.warn('[Hero] Erro ao carregar slides do Supabase, utilizando fallback de segurança:', err);
        if (isMounted) {
          setHeroSlides(DEFAULT_HERO_PHOTOS.map((url, idx) => ({ id: `slide-0${idx + 1}`, url })));
        }
      }
    };

    loadSlides();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNext = useCallback(() => {
    if (heroSlides.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides]);

  const handlePrev = useCallback(() => {
    if (heroSlides.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides]);

  // Passagem automática das fotos no fundo
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [handleNext]);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId.replace('#', ''));
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const whatsAppUrl = getWhatsAppUrl(
    'Olá, Engª Jucélia Santana! Gostaria de solicitar informações sobre um orçamento ou consultoria técnica para obra/projeto em Ariquemes - RO.'
  );

  return (
    <section
      id="home"
      role="region"
      aria-label="Apresentação Principal Jucélia Santana Engenheira Civil"
      className="relative min-h-screen flex items-center pt-28 pb-20 lg:pt-32 lg:pb-24 overflow-hidden bg-[#0A1220]"
    >
      {/* Sistema Inteligente de Fotos no Fundo com Crossfade Direto */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {heroSlides.map((slide, idx) => {
          const isActive = idx === currentPhotoIndex;
          const mediaKey = `dashboard_slide:${slide.id}`;
          const displaySetting = getSettingForMedia(mediaKey, 'hero_slide');
          const focalPosition = `${displaySetting.focal_x}% ${displaySetting.focal_y}%`;
          const zoomScale = (displaySetting.zoom || 1.0) * (isActive ? 1.04 : 1.0);

          return (
            <motion.div
              key={`hero-bg-${slide.id}-${idx}`}
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
              }}
              transition={{
                opacity: { duration: 1.5, ease: [0.25, 1, 0.5, 1] },
              }}
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ zIndex: isActive ? 2 : 1 }}
            >
              <img
                src={slide.url}
                alt={`Hero Slide ${idx + 1}`}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-full transition-transform duration-6000 ease-linear filter contrast-[1.02] brightness-[0.95]"
                style={{
                  objectFit: displaySetting.object_fit || 'cover',
                  objectPosition: focalPosition,
                  transform: `scale(${zoomScale})`,
                  transformOrigin: focalPosition,
                }}
              />
            </motion.div>
          );
        })}

        {/* Camada de Gradientes Suaves */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1220]/90 via-[#0A1220]/65 to-[#0A1220]/30 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1220] via-transparent to-[#0A1220]/70 z-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full filter blur-[120px] pointer-events-none z-10" />
      </div>

      {/* Setinhas Transparentes de Navegação nas Laterais */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Foto Anterior no Fundo"
        title="Ver Foto Anterior"
        className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#122038]/80 hover:bg-[#C5A059] border border-[#C5A059]/40 hover:border-[#C5A059] text-white hover:text-black backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group shadow-xl"
      >
        <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Próxima Foto no Fundo"
        title="Ver Próxima Foto"
        className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#122038]/80 hover:bg-[#C5A059] border border-[#C5A059]/40 hover:border-[#C5A059] text-white hover:text-black backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group shadow-xl"
      >
        <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 sm:space-y-7"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="gold" className="px-3 py-1 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-[#C5A059]" />
                {heroContent.badgeText || COMPANY_INFO.crea}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs font-jakarta text-slate-200 font-medium bg-[#122038]/90 border border-[#C5A059]/30 px-3 py-1 rounded-full backdrop-blur-md shadow-md">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{heroContent.locationBadge || 'Ariquemes e Região - RO'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-5xl font-cinzel font-bold text-white leading-[1.2] tracking-tight">
                {heroContent.title || 'Projetos Estruturais e'}
                <span className="gold-gradient-text block mt-1 sm:mt-2">
                  {heroContent.titleHighlight || 'Soluções em Engenharia Civil'}
                </span>
              </h1>
              <SmartText
                section="hero"
                text={heroContent.description || 'Cálculo de estruturas, laudos periciais e acompanhamento de obras residenciais, comerciais e do agronegócio.'}
                className="text-slate-200 font-jakarta text-base sm:text-lg leading-relaxed max-w-2xl font-normal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pb-1 font-jakarta text-xs sm:text-sm text-slate-100">
              <div className="flex items-center gap-2.5 bg-[#122038]/90 border border-[#C5A059]/30 p-2.5 sm:p-3 rounded-xl backdrop-blur-md shadow-lg shadow-[#0A1220]/50 hover:border-[#C5A059]/60 transition-all">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Projetos Estruturais Executivos</span>
              </div>
              <div className="flex items-center gap-2.5 bg-[#122038]/90 border border-[#C5A059]/30 p-2.5 sm:p-3 rounded-xl backdrop-blur-md shadow-lg shadow-[#0A1220]/50 hover:border-[#C5A059]/60 transition-all">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Laudos Periciais e Vistorias NBR</span>
              </div>
              <div className="flex items-center gap-2.5 bg-[#122038]/90 border border-[#C5A059]/30 p-2.5 sm:p-3 rounded-xl backdrop-blur-md shadow-lg shadow-[#0A1220]/50 hover:border-[#C5A059]/60 transition-all">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Infraestrutura Rural e Agroindustrial</span>
              </div>
              <div className="flex items-center gap-2.5 bg-[#122038]/90 border border-[#C5A059]/30 p-2.5 sm:p-3 rounded-xl backdrop-blur-md shadow-lg shadow-[#0A1220]/50 hover:border-[#C5A059]/60 transition-all">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Gestão Executiva e Fiscalização</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href="#contato"
                onClick={(e) => handleScrollTo(e, '#contato')}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="gold"
                  fullWidth
                  icon={<Phone className="w-4 h-4" />}
                  className="font-bold uppercase tracking-wider shadow-xl"
                >
                  {heroContent.primaryCta || 'Solicitar Orçamento'}
                </Button>
              </a>

              <a
                href="#servicos"
                onClick={(e) => handleScrollTo(e, '#servicos')}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="outline"
                  fullWidth
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="font-medium bg-[#122038]/90 hover:bg-[#182A4A] border border-[#C5A059]/50 hover:border-[#C5A059] text-white backdrop-blur-md shadow-lg"
                >
                  {heroContent.secondaryCta || 'Conhecer Nossos Serviços'}
                </Button>
              </a>
            </div>

            <div className="pt-1 inline-flex items-center gap-2 text-xs font-jakarta text-slate-300 bg-[#122038]/80 border border-[#25D366]/30 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-md">
              <span>{heroContent.whatsappNotice || 'Atendimento técnico rápido:'}</span>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] font-semibold hover:underline flex items-center gap-1"
              >
                Falar pelo WhatsApp
              </a>
            </div>

            <div className="flex items-center gap-2 pt-3">
              {heroSlides.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  onClick={() => setCurrentPhotoIndex(idx)}
                  aria-label={`Mudar para foto de fundo ${idx + 1}`}
                  title={`Foto ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentPhotoIndex
                      ? 'w-8 bg-[#C5A059]'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="glass-panel p-6 rounded-2xl relative border border-[#C5A059]/50 bg-[#122038]/95 backdrop-blur-xl space-y-6 shadow-2xl">
              <div className="absolute top-0 right-0 translate-x-2 -translate-y-3 bg-[#C5A059] text-black font-cinzel font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Autoridade Técnica
              </div>

              <div className="flex items-center gap-3 border-b border-[#C5A059]/20 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0A1220] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0 shadow-inner">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base sm:text-lg font-bold text-white">
                    Indicadores de Performance
                  </h3>
                  <p className="font-jakarta text-xs text-slate-300">
                    Compromisso com o rigor normativo e prazos em RO
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {COMPANY_INFO.stats.map((stat, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0A1220]/80 border border-white/10 space-y-1 shadow-inner">
                    <span className="font-cinzel font-black text-2xl sm:text-3xl gold-gradient-text block">
                      {stat.value}
                    </span>
                    <span className="font-jakarta text-[11px] sm:text-xs text-slate-300 font-medium leading-tight block">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-300 font-jakarta gap-2">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#C5A059] shrink-0" />
                  Conformidade NBR / ABNT
                </span>
                <span className="text-[#C5A059] font-bold px-2 py-0.5 rounded bg-[#C5A059]/10 border border-[#C5A059]/30">
                  100% dos Serviços com ART
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-2 cursor-pointer"
      >
        <a
          href="#sobre"
          onClick={(e) => handleScrollTo(e, '#sobre')}
          className="flex flex-col items-center text-slate-400 hover:text-[#C5A059] transition-colors group focus-visible:outline-none"
          aria-label="Rolar para a seção Sobre"
        >
          <span className="font-jakarta text-[10px] uppercase tracking-widest font-semibold group-hover:text-[#C5A059]">
            Explore a Empresa
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-9 rounded-full border border-slate-600 group-hover:border-[#C5A059] flex items-start justify-center p-1.5 mt-1"
          >
            <div className="w-1 h-2 bg-[#C5A059] rounded-full" />
          </motion.div>
          <ChevronDown className="w-4 h-4 text-[#C5A059] -mt-1" />
        </a>
      </motion.div>
    </section>
  );
};
