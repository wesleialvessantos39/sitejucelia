// /src/components/ui/EngineerCarousel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Award
} from 'lucide-react';
import { PROFILE_PHOTOS, ENGINEER_PHOTOS, EngineerPhoto } from '../../data/engineerPhotos';
import { COMPANY_INFO } from '../../data/companyData';

export const EngineerCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const SLIDE_DURATION = 5000; // 5 seconds per slide transition
  const photosList = PROFILE_PHOTOS;
  const currentPhoto: EngineerPhoto = photosList[currentIndex] || photosList[0];

  // Preload all high-res photos into browser memory for instant smooth transitions
  useEffect(() => {
    ENGINEER_PHOTOS.forEach((photo) => {
      const img = new Image();
      img.src = photo.url;
      if (photo.filename) {
        const publicImg = new Image();
        publicImg.src = `/photos/${photo.filename}`;
      }
    });
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photosList.length);
  }, [photosList.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photosList.length) % photosList.length);
  }, [photosList.length]);

  // Continuous Autoplay effect (5 seconds per slide)
  useEffect(() => {
    if (isLightboxOpen) return;

    const timer = setInterval(() => {
      handleNext();
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isLightboxOpen, handleNext]);

  // Keyboard navigation when Lightbox is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  return (
    <div className="space-y-3 w-full">
      {/* Main Container Card */}
      <div className="relative rounded-2xl overflow-hidden border border-[#C5A059]/40 bg-[#0A1220] p-2 sm:p-3 shadow-2xl gold-glow">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10 px-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-cinzel text-[11px] sm:text-xs font-semibold px-1">
              Engª Jucélia Santana
            </span>
          </div>

          {/* Expand / Lightbox */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            title="Expandir Foto em Tela Cheia"
            className="px-2.5 py-1 rounded-lg bg-[#122038] border border-white/10 text-slate-200 hover:text-[#C5A059] hover:border-[#C5A059]/50 text-xs font-jakarta flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[11px] font-semibold">Ampliar</span>
          </button>
        </div>

        {/* Photo Canvas Container with Seamless Crossfade */}
        <div className="relative w-full h-[320px] sm:h-[380px] lg:h-[350px] xl:h-[380px] rounded-xl overflow-hidden bg-[#0A1220] border border-white/5 flex items-center justify-center p-1.5 group">
          {photosList.map((photo, idx) => {
            const isActive = idx === currentIndex;
            return (
              <motion.div
                key={photo.id}
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  scale: isActive ? 1 : 0.98,
                  zIndex: isActive ? 10 : 0
                }}
                transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                className="absolute inset-0 flex items-center justify-center p-2"
              >
                <img
                  src={photo.url}
                  alt={`Engª Jucélia Santana - ${photo.title}`}
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = `/photos/${photo.filename}`;
                    }
                  }}
                />
              </motion.div>
            );
          })}

          {/* Side Navigation Buttons */}
          <button
            onClick={handlePrev}
            aria-label="Foto Anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0A1220]/80 border border-white/20 backdrop-blur-md text-white hover:text-[#C5A059] hover:border-[#C5A059] hover:bg-[#0A1220] flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Próxima Foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0A1220]/80 border border-white/20 backdrop-blur-md text-white hover:text-[#C5A059] hover:border-[#C5A059] hover:bg-[#0A1220] flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Indicator Dots */}
        <div className="flex items-center justify-center gap-2 pt-2.5">
          {photosList.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir para a foto ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? 'w-8 bg-[#C5A059]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Full-Screen Lightbox Modal via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLightboxOpen(false)}
              className="fixed inset-0 z-[9999] bg-[#0A1220] flex flex-col justify-between p-4 sm:p-6 overflow-hidden cursor-pointer"
            >
              {/* Modal Header */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between max-w-5xl mx-auto w-full z-20 border-b border-white/10 pb-3 cursor-default"
              >
                <div className="flex items-center gap-3">
                  <span className="font-cinzel font-bold text-white text-lg">
                    Engª Jucélia Santana
                  </span>
                  <span className="text-[#C5A059] font-jakarta text-xs font-semibold px-2.5 py-1 rounded bg-[#C5A059]/10 border border-[#C5A059]/30">
                    {COMPANY_INFO.crea}
                  </span>
                </div>

                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Fechar visualização"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Main Photo Canvas */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-5xl max-h-[85vh] mx-auto w-full flex items-center justify-center my-auto p-2 cursor-default"
              >
                <button
                  onClick={handlePrev}
                  aria-label="Foto Anterior"
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#0A1220]/90 border border-[#C5A059]/40 text-white hover:text-black hover:bg-[#C5A059] hover:border-[#C5A059] transition-all hover:scale-110 z-30 cursor-pointer shadow-xl"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>

                <img
                  key={`modal-${currentPhoto.id}`}
                  src={currentPhoto.url}
                  alt={currentPhoto.title}
                  className="max-h-[82vh] max-w-full w-auto object-contain rounded-xl shadow-2xl border border-white/10 bg-[#0A1220]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = `/photos/${currentPhoto.filename}`;
                    }
                  }}
                />

                <button
                  onClick={handleNext}
                  aria-label="Próxima Foto"
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#0A1220]/90 border border-[#C5A059]/40 text-white hover:text-black hover:bg-[#C5A059] hover:border-[#C5A059] transition-all hover:scale-110 z-30 cursor-pointer shadow-xl"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

