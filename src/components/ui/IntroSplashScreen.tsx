// /src/components/ui/IntroSplashScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { handleLogoError } from '../../utils/assetUtils';
import { useVisualIdentity } from '../../context/VisualIdentityContext';
import { getEffectiveVisualAsset } from '../../utils/visualCacheUtils';
import { ManagedMedia } from './ManagedMedia';

interface IntroSplashScreenProps {
  onComplete?: () => void;
  autoDismissTime?: number;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({
  onComplete,
  autoDismissTime = 1100
}) => {
  const { settings, getEffectiveAsset } = useVisualIdentity();
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  // Obtém o recurso visual garantido (com cache local e fallback hierárquico)
  const splashIconSrc = useMemo(() => {
    return getEffectiveAsset ? getEffectiveAsset('splash_icon') : getEffectiveVisualAsset('splash_icon', settings);
  }, [getEffectiveAsset, settings]);

  const nameFirst = "JUCÉLIA".split("");
  const nameSecond = "SANTANA".split("");
  const titleText = "ENGENHEIRA CIVIL".split("");

  // Detecção de prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effectiveDismissTime = prefersReducedMotion ? Math.min(autoDismissTime, 600) : autoDismissTime;

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.round((elapsed / effectiveDismissTime) * 100));
      setProgress(currentProgress);

      if (elapsed >= effectiveDismissTime) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 15);

    // Fallback de segurança para nunca travar a tela
    const safetyTimeout = setTimeout(() => {
      handleDismiss();
    }, effectiveDismissTime + 200);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
      document.body.style.overflow = 'unset';
    };
  }, [effectiveDismissTime]);

  const handleDismiss = () => {
    document.body.style.overflow = 'unset';
    setIsVisible(false);
    setTimeout(() => {
      if (onComplete) onComplete();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  };

  return (
    <AnimatePresence onExitComplete={() => {
      document.body.style.overflow = 'unset';
      if (onComplete) onComplete();
    }}>
      {isVisible && (
        <motion.div
          key="intro-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.25, ease: 'easeOut' }}
          style={{ backgroundColor: 'var(--bg-primary, #0A1220)', color: 'var(--color-text, #F8F9FA)' }}
          className="fixed inset-0 z-[9999] text-slate-100 flex flex-col items-center justify-center overflow-hidden select-none will-change-transform"
        >
          <div className="absolute w-[650px] h-[650px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(197,160,89,0.22)_0%,rgba(10,18,32,0.9)_50%,transparent_70%)] filter blur-md" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none bg-[#122038]/60 filter blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none bg-[#0E1B31]/80 filter blur-3xl" />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
            <div className="w-[450px] h-[450px] rounded-full border border-[#C5A059]/30" />
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />
            <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-[#C5A059]/40 to-transparent" />
          </div>

          <div className="relative z-10 max-w-3xl px-6 py-6 text-center space-y-5 flex flex-col items-center my-auto">
            
            {/* Contêiner do Ícone Oficial da Identidade Visual */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-1.5 rounded-2xl bg-[#0A1220] border border-[#C5A059]/50 shadow-2xl shadow-[#C5A059]/25 overflow-hidden"
            >
              <ManagedMedia
                mediaKey="visual_identity:splash_icon"
                src={splashIconSrc}
                onError={handleLogoError}
                alt="Logo Engª Jucélia Santana"
                context="visual_identity"
                loading="eager"
                decoding="sync"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(197,160,89,0.35)]"
                containerClassName="w-full h-full"
              />
            </motion.div>

            <div className="space-y-2">
              <div className="overflow-hidden py-1">
                <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 font-cinzel font-black text-2xl sm:text-4xl md:text-5xl tracking-[0.18em] uppercase">
                  <div className="flex items-center">
                    {nameFirst.map((char, index) => (
                      <motion.span
                        key={`first-${index}`}
                        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: prefersReducedMotion ? 0 : 0.05 + index * 0.02,
                          ease: "easeOut"
                        }}
                        className="inline-block gold-gradient-text"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>

                  <div className="flex items-center">
                    {nameSecond.map((char, index) => (
                      <motion.span
                        key={`second-${index}`}
                        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: prefersReducedMotion ? 0 : 0.15 + index * 0.02,
                          ease: "easeOut"
                        }}
                        className="inline-block text-white"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.25, delay: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
                className="h-[2px] w-40 sm:w-60 mx-auto bg-gradient-to-r from-transparent via-[#C5A059] to-transparent"
              />

              <div className="overflow-hidden pt-1">
                <motion.div
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: prefersReducedMotion ? 0 : 0.35 }}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap font-jakarta font-bold text-xs sm:text-base md:text-lg text-[#C5A059] uppercase tracking-[0.25em]"
                >
                  {titleText.map((char, index) => (
                    <motion.span
                      key={`title-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.15,
                        delay: prefersReducedMotion ? 0 : 0.4 + index * 0.015
                      }}
                      className={char === " " ? "mr-2" : "inline-block"}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: prefersReducedMotion ? 0 : 0.6 }}
                className="flex items-center justify-center gap-2 pt-1 text-[11px] font-jakarta text-slate-400 tracking-wider"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>CREA: 22430D/RO</span>
                <span className="text-[#C5A059]">•</span>
                <span>Ariquemes - RO</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.65, duration: 0.2 }}
              className="pt-1 w-full max-w-xs flex flex-col items-center gap-2"
            >
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#8F7238] via-[#C5A059] to-[#F3E0AA] transition-all duration-75 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

