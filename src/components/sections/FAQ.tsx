// /src/components/sections/FAQ.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SectionHeader } from '../ui/SectionHeader';
import { useSiteContent } from '../../context/SiteContentContext';
import { SmartText } from '../ui/SmartText';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { COMPANY_INFO, getWhatsAppUrl, FAQ_DATA } from '../../data/companyData';
import { FaqItemContent } from '../../types/content';

export const FAQ: React.FC = () => {
  const { content } = useSiteContent();
  const [openId, setOpenId] = useState<string | null>('1');

  const faqSettings = content?.faq || {
    badgeText: 'Esclarecimento de Dúvidas',
    title: 'Perguntas Frequentes',
    highlightTitle: 'E Esclarecimentos Técnicos',
    subtitle: 'Entenda como funcionam nossos processos de contratação, entregas de laudos, projetos e fiscalizações.',
    items: FAQ_DATA.map((item, idx) => ({ ...item, order: idx + 1, active: true })),
  };

  // Filtrar apenas ativos e ordenar
  const visibleItems = (faqSettings.items && faqSettings.items.length > 0 ? faqSettings.items : FAQ_DATA)
    .filter((item: any) => item.active !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-[#0A1220] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeader
          badgeText={faqSettings.badgeText || "Esclarecimento de Dúvidas"}
          title={faqSettings.title || "Perguntas Frequentes"}
          highlightTitle={faqSettings.highlightTitle || "E Esclarecimentos Técnicos"}
          subtitle={faqSettings.subtitle || "Entenda como funcionam nossos processos de contratação, entregas de laudos, projetos e fiscalizações."}
        />

        <div className="space-y-4 mt-10">
          {visibleItems.map((faq: FaqItemContent | any) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-[#122038] border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-[#C5A059] shadow-lg shadow-[#C5A059]/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className={`w-5 h-5 shrink-0 transition-colors ${isOpen ? 'text-[#C5A059]' : 'text-slate-400'}`} />
                    <span className="font-cinzel font-bold text-base sm:text-lg text-white">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#C5A059] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-white/5">
                        <SmartText
                          section="faq"
                          text={faq.answer}
                          className="text-xs sm:text-sm text-slate-300 font-jakarta leading-relaxed whitespace-pre-line"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Direct Contact Prompt */}
        <div className="mt-12 p-6 bg-[#122038] border border-[#C5A059]/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="font-cinzel font-bold text-white text-base">
              Possui uma dúvida específica sobre sua obra ou laudo?
            </h4>
            <p className="font-jakarta text-xs text-slate-400 mt-1">
              Fale diretamente com nossa equipe técnica via WhatsApp.
            </p>
          </div>
          <a
            href={getWhatsAppUrl('Olá, Engª Jucélia Santana! Tenho uma dúvida técnica sobre meu projeto em Ariquemes / RO e gostaria de uma orientação.')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-[#C5A059] text-black font-jakarta font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#D4AF37] transition-all flex items-center gap-2 shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            Tirar Dúvida Agora
          </a>
        </div>

      </div>
    </section>
  );
};
