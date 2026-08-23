// /src/components/layout/Footer.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO, getGmailComposeUrl, getOutlookComposeUrl, getWhatsAppUrl } from '../../data/companyData';
import { getAssetUrl, handleLogoError } from '../../utils/assetUtils';
import { useVisualIdentity } from '../../context/VisualIdentityContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { useContactSettings } from '../../context/ContactSettingsContext';
import { ManagedMedia } from '../ui/ManagedMedia';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Shield, 
  ArrowUp, 
  Scale, 
  Clock, 
  CheckCircle2, 
  Instagram, 
  MessageCircle,
  ChevronRight,
  FileCheck,
  FileText
} from 'lucide-react';
import { TermsModal } from '../docs/TermsModal';
import { SafetyIsoModal } from '../docs/SafetyIsoModal';

export const Footer: React.FC = () => {
  const { settings, getEffectiveAsset } = useVisualIdentity();
  const { content } = useSiteContent();
  const { settings: contactSettings, getWhatsAppHref, getPhoneHref, formattedPhone, formattedWhatsApp } = useContactSettings();
  const footerContent = content.footer;
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSafetyIsoOpen, setIsSafetyIsoOpen] = useState(false);
  const siteLogoSrc = getEffectiveAsset ? getEffectiveAsset('site_logo') : (settings.site_logo || getAssetUrl('foto_logo.png'));


  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    if (targetId === 'home' || href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const whatsAppUrl = getWhatsAppHref('Olá, Engª Jucélia Santana! Vim pelo site e gostaria de solicitar informações sobre um projeto.');

  return (
    <>
      <footer 
        role="contentinfo" 
        aria-label="Rodapé Institucional Engª Jucélia Santana"
        className="bg-[#0A1220] border-t border-[#C5A059]/30 text-slate-300 pt-16 pb-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C5A059]/5 rounded-full filter blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C5A059]/5 rounded-full filter blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-14 border-b border-white/10">
            
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#9E7D3B] p-[1px] flex items-center justify-center shadow-lg shadow-[#C5A059]/10">
                  <div className="w-full h-full bg-[#0A1220] rounded-[11px] p-1 flex items-center justify-center overflow-hidden">
                    <ManagedMedia
                      mediaKey="visual_identity:site_logo"
                      src={siteLogoSrc}
                      onError={handleLogoError}
                      alt="Logo Engª Jucélia Santana"
                      context="visual_identity"
                      className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(197,160,89,0.3)]"
                      containerClassName="w-full h-full"
                    />
                  </div>
                </div>
                <div>
                  <span className="font-cinzel font-bold text-white text-lg tracking-wide block">
                    JUCÉLIA SANTANA
                  </span>
                  <span className="font-jakarta text-[10px] tracking-widest text-[#C5A059] uppercase block font-bold">
                    ENGENHEIRA CIVIL
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-jakarta leading-relaxed">
                {footerContent.shortDescription || COMPANY_INFO.description}
              </p>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0E1729] border border-[#C5A059]/40 rounded-xl text-xs font-jakarta text-[#C5A059] shadow-inner">
                <Award className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span className="font-semibold">{footerContent.creaBadge || COMPANY_INFO.crea}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-jakarta">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{footerContent.normasText || 'Normas ABNT NBR 6118 / 6120 / 14931'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-cinzel font-bold text-white text-base tracking-wider uppercase border-b border-[#C5A059]/40 pb-2.5 inline-block">
                Navegação
              </h4>
              <nav aria-label="Links do Rodapé">
                <ul className="space-y-2.5 font-jakarta text-xs text-slate-400">
                  <li>
                    <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="hover:text-[#C5A059] transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-[#C5A059] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      <span>Início</span>
                    </a>
                  </li>
                  <li>
                    <a href="#sobre" onClick={(e) => handleNavClick(e, '#sobre')} className="hover:text-[#C5A059] transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-[#C5A059] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      <span>Empresa e Engenheira</span>
                    </a>
                  </li>
                  <li>
                    <a href="#servicos" onClick={(e) => handleNavClick(e, '#servicos')} className="hover:text-[#C5A059] transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-[#C5A059] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      <span>Serviços de Engenharia</span>
                    </a>
                  </li>
                  <li>
                    <a href="#diferenciais" onClick={(e) => handleNavClick(e, '#diferenciais')} className="hover:text-[#C5A059] transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-[#C5A059] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      <span>Diferenciais Técnicos</span>
                    </a>
                  </li>
                  <li>
                    <a href="#projetos" onClick={(e) => handleNavClick(e, '#projetos')} className="hover:text-[#C5A059] transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-[#C5A059] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      <span>Portfólio de Obras</span>
                    </a>
                  </li>
                  <li>
                    <a href="#processo" onClick={(e) => handleNavClick(e, '#processo')} className="hover:text-[#C5A059] transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-[#C5A059] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      <span>Metodologia e Processo</span>
                    </a>
                  </li>
                  <li>
                    <a href="#contato" onClick={(e) => handleNavClick(e, '#contato')} className="hover:text-[#C5A059] transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-[#C5A059] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      <span>Fale Conosco Rápido</span>
                    </a>
                  </li>
                  <li>
                    <Link to="/solicitar-proposta" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      <span>Pré-Dimensionamento e Orçamento</span>
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-cinzel font-bold text-white text-base tracking-wider uppercase border-b border-[#C5A059]/40 pb-2.5 inline-block">
                Contato e Endereço
              </h4>
              
              <div className="space-y-3.5 font-jakarta text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0E1729] border border-white/10 flex items-center justify-center shrink-0 text-[#C5A059] mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Localização do Escritório:</span>
                    <span className="text-slate-400 leading-relaxed text-[11px] block">{contactSettings.address_full || COMPANY_INFO.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0E1729] border border-white/10 flex items-center justify-center shrink-0 text-[#C5A059]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Telefone / WhatsApp:</span>
                    <a 
                      href={whatsAppUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#C5A059] hover:underline font-mono text-xs block font-bold"
                    >
                      {formattedWhatsApp || COMPANY_INFO.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0E1729] border border-white/10 flex items-center justify-center shrink-0 text-[#C5A059]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Horário de Atendimento:</span>
                    <span className="text-slate-400 text-[11px] block">{contactSettings.business_hours || COMPANY_INFO.hours}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2 border-t border-white/5">
                  <a
                    href={getOutlookComposeUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#0E1729] border border-white/5 hover:border-blue-500/50 text-slate-300 hover:text-white transition-all text-[11px] group"
                    title="Enviar e-mail via Outlook Web"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{COMPANY_INFO.emailOutlook}</span>
                  </a>

                  <a
                    href={getGmailComposeUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#0E1729] border border-white/5 hover:border-red-500/50 text-slate-300 hover:text-white transition-all text-[11px] group"
                    title="Enviar e-mail via Gmail Web"
                  >
                    <Mail className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{COMPANY_INFO.emailGmail}</span>
                  </a>
                </div>

              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-cinzel font-bold text-white text-base tracking-wider uppercase border-b border-[#C5A059]/40 pb-2.5 inline-block">
                Redes e Canais
              </h4>

              <p className="text-xs text-slate-400 font-jakarta leading-relaxed">
                Acompanhe bastidores de obras, orientações técnicas de engenharia civil e projetos em andamento em nossos canais oficiais.
              </p>

              <div className="grid grid-cols-2 gap-2.5 font-jakarta text-xs pt-1">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0E1729] border border-white/10 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all duration-300 group shadow-md"
                  aria-label="WhatsApp Institucional"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[11px]">WhatsApp</span>
                </a>

                <a
                  href={COMPANY_INFO.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0E1729] border border-white/10 hover:border-pink-500/50 text-slate-300 hover:text-pink-400 transition-all duration-300 group shadow-md"
                  aria-label="Instagram Profissional Engª Jucélia Santana"
                >
                  <Instagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[11px]">Instagram</span>
                </a>
              </div>

              <div className="pt-3 space-y-2">
                <Link
                  to="/documentos"
                  className="w-full text-left p-2.5 rounded-xl bg-[#0E1729] border border-[#C5A059]/30 hover:border-[#C5A059] text-xs font-jakarta text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer block"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Central de Documentos e Laudos</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSafetyIsoOpen(true)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#0E1729] border border-[#C5A059]/30 hover:border-[#C5A059] text-xs font-jakarta text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Segurança e NBR ISO</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              </div>

            </div>

          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs font-jakarta text-slate-400 gap-4">
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-[#C5A059] transition-colors flex items-center gap-2 cursor-pointer text-center md:text-left group"
              title="Clique para ler os Termos de Uso e Propriedade Intelectual"
            >
              <Scale className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform shrink-0" />
              <span className="underline decoration-[#C5A059]/40 underline-offset-4 group-hover:decoration-[#C5A059]">
                © {new Date().getFullYear()} {footerContent.copyrightText || `Jucélia Santana Engenheira Civil (${COMPANY_INFO.crea}). Todos os direitos reservados.`}
              </span>
            </button>

            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="hover:text-[#C5A059] transition-colors text-[11px] underline decoration-slate-600 underline-offset-4 cursor-pointer"
              >
                Termos e Privacidade
              </button>

              <button
                type="button"
                onClick={scrollToTop}
                className="p-2.5 bg-[#0E1729] border border-[#C5A059]/40 text-[#C5A059] rounded-xl hover:bg-[#C5A059] hover:text-black transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5 font-bold text-xs"
                aria-label="Voltar ao topo da página"
              >
                <span>Topo</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </footer>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <SafetyIsoModal isOpen={isSafetyIsoOpen} onClose={() => setIsSafetyIsoOpen(false)} />
    </>
  );
};
