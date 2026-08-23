// /src/components/layout/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  Home,
  UserCheck,
  Briefcase,
  FolderKanban,
  ShieldCheck,
  PhoneCall,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { COMPANY_INFO } from '../../data/companyData';
import { Button } from '../ui/Button';
import { getAssetUrl, handleLogoError } from '../../utils/assetUtils';
import { useVisualIdentity } from '../../context/VisualIdentityContext';
import { useContactSettings } from '../../context/ContactSettingsContext';
import { ManagedMedia } from '../ui/ManagedMedia';

export interface NavLink {
  name: string;
  href: string;
  id: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_LINKS: NavLink[] = [
  { name: 'Início', href: '#home', id: 'home', icon: Home },
  { name: 'Empresa', href: '#sobre', id: 'sobre', icon: UserCheck },
  { name: 'Serviços', href: '#servicos', id: 'servicos', icon: Briefcase },
  { name: 'Obras', href: '#projetos', id: 'projetos', icon: FolderKanban },
  { name: 'Laudos', href: '#blog', id: 'blog', icon: BookOpen },
  { name: 'Diferenciais', href: '#diferenciais', id: 'diferenciais', icon: ShieldCheck },
  { name: 'Contato', href: '#contato', id: 'contato', icon: PhoneCall },
];

export interface NavbarProps {
  onReplayIntro?: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin }) => {
  const { settings, getEffectiveAsset } = useVisualIdentity();
  const { getWhatsAppHref, formattedWhatsApp } = useContactSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const siteLogoSrc = getEffectiveAsset ? getEffectiveAsset('site_logo') : (settings.site_logo || getAssetUrl('foto_logo.png'));


  // Monitor scroll state & active section based on actual DOM positions
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const scrollPosition = window.scrollY + 140;

      // Map sections to their DOM elements and sort by actual top position on page
      const sections = NAV_LINKS.map(link => {
        const el = document.getElementById(link.id);
        return el ? { id: link.id, top: el.offsetTop } : null;
      })
      .filter((item): item is { id: string; top: number } => item !== null)
      .sort((a, b) => a.top - b.top);

      let currentActive = NAV_LINKS[0]?.id || 'home';
      for (const section of sections) {
        if (section.top <= scrollPosition) {
          currentActive = section.id;
        } else {
          break;
        }
      }

      setActiveSection(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Click outside detector to close drawer automatically
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (mobileMenuOpen && headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveSection(id);
    document.body.style.overflow = '';

    const targetId = href.replace('#', '');

    setTimeout(() => {
      if (targetId === 'home' || href === '#home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const element = document.getElementById(targetId);
      if (element) {
        const headerOffset = 85;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 50);
  };

  const whatsAppMessage = 'Olá, Engª Jucélia Santana! Gostaria de solicitar informações sobre um orçamento ou consultoria técnica para obra/projeto em Ariquemes - RO.';
  const whatsAppUrl = getWhatsAppHref(whatsAppMessage);

  return (
    <header
      ref={headerRef}
      role="banner"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none pt-2 sm:pt-3 pb-2"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pointer-events-auto">
        <div
          className={`rounded-2xl border transition-all duration-300 px-3 sm:px-5 lg:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2 overflow-hidden ${
            isScrolled
              ? 'bg-[#0A1220]/95 backdrop-blur-md border-[#C5A059]/40 shadow-2xl shadow-black/80'
              : 'bg-[#122038]/90 backdrop-blur-md border-white/10 shadow-xl'
          }`}
        >
          
          {/* Logo Brand */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home', 'home')}
            className="flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] rounded-lg p-1 transition-all shrink-0"
            aria-label={`${COMPANY_INFO.name} - Ir para o início`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#C5A059] to-[#8F7238] p-[1px] flex items-center justify-center shadow-lg shadow-[#C5A059]/20 group-hover:shadow-[#C5A059]/40 transition-all shrink-0">
              <div className="w-full h-full bg-[#0A1220] rounded-[11px] p-1 flex items-center justify-center overflow-hidden">
                <ManagedMedia
                  mediaKey="visual_identity:site_logo"
                  src={siteLogoSrc}
                  onError={handleLogoError}
                  alt="Logo Engª Jucélia Santana"
                  context="visual_identity"
                  loading="eager"
                  decoding="sync"
                  className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(197,160,89,0.3)]"
                  containerClassName="w-full h-full"
                />
              </div>
            </div>
            <div className="flex flex-col shrink-0">
              <span className="font-cinzel font-bold text-white text-xs sm:text-sm md:text-base tracking-wider group-hover:text-[#C5A059] transition-colors leading-tight">
                JUCÉLIA SANTANA
              </span>
              <div className="flex items-center gap-1">
                <span className="font-jakarta text-[8px] sm:text-[9px] tracking-widest text-[#C5A059] uppercase font-semibold">
                  ENGENHEIRA CIVIL
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono">| CREA-RO</span>
              </div>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0" role="navigation" aria-label="Navegação Principal">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href, link.id)}
                  className={`font-jakarta text-[10px] xl:text-xs uppercase tracking-wider font-semibold py-1.5 px-2 xl:px-2.5 rounded-xl transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] ${
                    isActive
                      ? 'text-[#C5A059] bg-[#0A1220] border border-[#C5A059]/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#C5A059] rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action Controls (WhatsApp Quick Contact & Admin Link) */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 shrink-0">
            <Link
              to="/admin/dashboard"
              title="Área Administrativa CMS"
              aria-label="Abrir Painel Administrativo CMS"
              className="px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl bg-[#0A1220] border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059] hover:text-black transition-all font-jakarta text-[11px] xl:text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Painel CMS</span>
            </Link>

            {/* WhatsApp Quick Icon Link */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar pelo WhatsApp com Engenheira Jucélia Santana"
              className="p-2 xl:p-2.5 rounded-xl bg-[#0A1220] border border-[#C5A059]/30 text-[#25D366] hover:bg-[#25D366] hover:text-black hover:border-[#25D366] transition-all transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] shrink-0"
              title="Atendimento via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
            </a>
          </div>

          {/* Mobile Menu Controls */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <Link
              to="/admin/dashboard"
              className="p-2 rounded-xl bg-[#0A1220] border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059] hover:text-black transition-all text-xs font-bold cursor-pointer"
              title="Painel CMS"
            >
              <ShieldCheck className="w-4 h-4" />
            </Link>
            {/* WhatsApp Mobile Quick Icon */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[#0A1220] border border-[#C5A059]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
              aria-label="Contato via WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-[#C5A059] bg-[#0A1220] border border-white/10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] transition-all cursor-pointer flex items-center gap-1.5"
              aria-label={mobileMenuOpen ? 'Fechar Menu de Navegação' : 'Abrir Menu de Navegação'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-drawer"
            >
              <span className="font-jakarta text-[11px] uppercase tracking-widest font-bold text-slate-300 hidden sm:inline">
                {mobileMenuOpen ? 'Fechar' : 'Menu'}
              </span>
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#C5A059]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer & Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 lg:hidden cursor-pointer"
              aria-hidden="true"
            />

            {/* Drawer Container */}
            <motion.div
              id="mobile-drawer"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute top-full left-0 right-0 bg-[#0A1220]/98 border-b border-[#C5A059]/30 backdrop-blur-2xl z-50 lg:hidden shadow-2xl overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 max-h-[85vh] overflow-y-auto">
                {/* Mobile Drawer Header Brand Badge */}
                <div className="flex items-center gap-3 p-3 bg-[#122038] border border-[#C5A059]/40 rounded-xl shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-[#0A1220] border border-[#C5A059]/50 p-1.5 flex items-center justify-center shrink-0 shadow-lg shadow-[#C5A059]/10 overflow-hidden">
                    <ManagedMedia
                      mediaKey="visual_identity:site_logo"
                      src={siteLogoSrc}
                      onError={handleLogoError}
                      alt="Logo Jucélia Santana"
                      context="visual_identity"
                      loading="eager"
                      decoding="sync"
                      className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(197,160,89,0.3)]"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-cinzel font-bold text-white text-sm sm:text-base tracking-wider leading-tight">
                      JUCÉLIA SANTANA
                    </span>
                    <span className="font-jakarta text-[10px] tracking-widest text-[#C5A059] uppercase font-bold mt-0.5">
                      ENGENHEIRA CIVIL • CREA-RO 22430D
                    </span>
                  </div>
                </div>

                <nav className="flex flex-col space-y-1.5" aria-label="Navegação Mobile">
                  {NAV_LINKS.map((link) => {
                    const IconComponent = link.icon;
                    const isActive = activeSection === link.id;
                    return (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.href, link.id)}
                        className={`font-jakarta text-xs sm:text-sm uppercase tracking-wider font-bold py-3 px-3.5 rounded-xl border transition-all flex items-center justify-between group shadow-sm min-h-[44px] ${
                          isActive
                            ? 'bg-[#122038] text-[#C5A059] border-[#C5A059]/40'
                            : 'bg-[#0E1729]/60 text-slate-200 hover:text-[#C5A059] border-white/5 hover:border-[#C5A059]/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border transition-all ${
                            isActive
                              ? 'bg-[#C5A059] text-black border-[#C5A059]'
                              : 'bg-[#122038] border-white/10 text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-black'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span>{link.name}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-all ${
                          isActive ? 'text-[#C5A059] translate-x-0.5' : 'text-slate-500 group-hover:text-[#C5A059] group-hover:translate-x-1'
                        }`} />
                      </a>
                    );
                  })}
                </nav>

                <div className="pt-3 space-y-2.5 border-t border-white/10">
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-[#122038] border border-[#25D366]/40 text-[#25D366] rounded-xl text-xs uppercase tracking-wider font-bold hover:bg-[#25D366] hover:text-black transition-all shadow-md min-h-[44px]"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                    Atendimento via WhatsApp
                  </a>

                  <a
                    href="#contato"
                    onClick={(e) => handleNavClick(e, '#contato', 'contato')}
                    className="block w-full"
                  >
                    <Button size="md" variant="gold" fullWidth icon={<Phone className="w-4 h-4" />}>
                      Solicitar Orçamento
                    </Button>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
