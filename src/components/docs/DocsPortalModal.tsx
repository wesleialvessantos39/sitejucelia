// /src/components/docs/DocsPortalModal.tsx
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ARCHITECTURE_SPEC } from '../../data/architectureDoc';
import { COLOR_PALETTE, TYPOGRAPHY_SYSTEM, DESIGN_SYSTEM_RULES } from '../../data/designSystemDoc';
import { 
  TARGET_AUDIENCE_PROFILES, 
  USER_JOURNEY_STAGES, 
  WIREFRAME_SECTION_SPECS,
  NAVIGATION_SPECS,
  CTA_STRATEGY,
  ACCESSIBILITY_AND_SEO 
} from '../../data/uxDoc';
import {
  HERO_SECTION_SPEC,
  HIGHLIGHTS_SECTION_SPEC,
  ABOUT_SECTION_SPEC,
  SERVICES_SECTION_SPEC,
  PROJECTS_SECTION_SPEC,
  DIFFERENTIALS_SECTION_SPEC,
  CTA_SECTION_SPEC,
  CONTACT_SECTION_SPEC,
  FOOTER_SPEC,
  MICROINTERACTIONS_SPEC,
  RESPONSIVENESS_SPEC
} from '../../data/homeSpecDoc';
import { Badge } from '../ui/Badge';
import { 
  FileCode2, 
  Palette, 
  FolderTree, 
  Layers, 
  Search, 
  Zap, 
  Smartphone, 
  Type, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  Copy, 
  Check,
  Compass,
  Users,
  Target,
  LayoutGrid
} from 'lucide-react';

interface DocsPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsPortalModal: React.FC<DocsPortalModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'design-system' | 'ux' | 'home-spec'>('architecture');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Especificações Técnicas: Arquitetura, Design System, UX e Home Page"
      maxWidth="4xl"
    >
      <div className="space-y-6 font-jakarta">
        
        {/* Main Tab Switcher */}
        <div className="flex border-b border-white/10 pb-2 gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 pb-3 px-3 font-cinzel font-bold text-xs sm:text-sm tracking-wider uppercase transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            1. Arquitetura (PROMPT 01)
          </button>

          <button
            onClick={() => setActiveTab('design-system')}
            className={`flex items-center gap-2 pb-3 px-3 font-cinzel font-bold text-xs sm:text-sm tracking-wider uppercase transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'design-system'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            2. Design System (PROMPT 02)
          </button>

          <button
            onClick={() => setActiveTab('ux')}
            className={`flex items-center gap-2 pb-3 px-3 font-cinzel font-bold text-xs sm:text-sm tracking-wider uppercase transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'ux'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            3. Arquitetura UX (PROMPT 03)
          </button>

          <button
            onClick={() => setActiveTab('home-spec')}
            className={`flex items-center gap-2 pb-3 px-3 font-cinzel font-bold text-xs sm:text-sm tracking-wider uppercase transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'home-spec'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            4. Spec Home Page (PROMPT 04)
          </button>
        </div>

        {/* Tab 1: Architecture Content */}
        {activeTab === 'architecture' && (
          <div className="space-y-8 text-xs sm:text-sm text-slate-300">
            
            {/* Header Status */}
            <div className="p-4 bg-[#0A1220] border border-[#C5A059]/30 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-cinzel font-bold text-white text-base">
                  {ARCHITECTURE_SPEC.title}
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Engenharia de Software para {ARCHITECTURE_SPEC.company}
                </p>
              </div>
              <Badge variant="gold">
                {ARCHITECTURE_SPEC.version}
              </Badge>
            </div>

            {/* Tech Stack Grid */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <Layers className="w-4 h-4" /> 1. Stack Tecnológica Obrigatória
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ARCHITECTURE_SPEC.stack.map((tech, idx) => (
                  <div key={idx} className="p-3 bg-[#121316] border border-white/5 rounded-lg space-y-1">
                    <span className="font-bold text-white block font-jakarta text-xs">
                      {tech.name}
                    </span>
                    <span className="text-slate-400 text-[11px] block leading-snug">
                      {tech.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Folder Structure Tree */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <FolderTree className="w-4 h-4" /> 2. Estrutura Modular de Arquivos e Pastas
              </h4>
              <div className="bg-[#121316] border border-white/10 rounded-xl p-4 font-mono text-xs space-y-2">
                {ARCHITECTURE_SPEC.folders.map((f, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-1.5 last:border-none">
                    <span className="text-[#C5A059] font-semibold">{f.path}</span>
                    <span className="text-slate-400 font-sans text-[11px]">{f.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Flow */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <Zap className="w-4 h-4" /> 3. Fluxo de Dados e Estado
              </h4>
              <ul className="space-y-2 bg-[#121316] p-4 rounded-xl border border-white/5 text-xs">
                {ARCHITECTURE_SPEC.dataFlow.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategies Grid (SEO, Performance, Responsiveness) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Estratégia de SEO
                </h5>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  {ARCHITECTURE_SPEC.seoStrategy.map((s, idx) => (
                    <li key={idx}>• {s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Performance e Carregamento
                </h5>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  {ARCHITECTURE_SPEC.performanceStrategy.map((p, idx) => (
                    <li key={idx}>• {p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Responsividade
                </h5>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  {ARCHITECTURE_SPEC.responsivenessStrategy.map((r, idx) => (
                    <li key={idx}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Design System Content */}
        {activeTab === 'design-system' && (
          <div className="space-y-8 text-xs sm:text-sm text-slate-300">
            
            {/* Palette Specification */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <Palette className="w-4 h-4" /> 1. Paleta Oficial de Cores (HEX e Aplicação)
              </h4>
              <p className="text-xs text-slate-400">
                Inspirada na sofisticação do Preto Grafite e Dourado Metálico Arquitetônico.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {COLOR_PALETTE.map((color, idx) => (
                  <div key={idx} className="p-3 bg-[#121316] border border-white/10 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 rounded-md border border-white/20" style={{ backgroundColor: color.hex }} />
                        <button
                          onClick={() => copyToClipboard(color.hex)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-[#C5A059] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          {copiedHex === color.hex ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {color.hex}
                        </button>
                      </div>
                      <span className="font-bold text-white block text-xs">{color.name}</span>
                      <span className="text-[10px] text-[#C5A059] block font-medium">{color.role}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-white/5 leading-tight">
                      {color.usage}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography Specification */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <Type className="w-4 h-4" /> 2. Hierarquia Tipográfica e Escala
              </h4>

              <div className="space-y-2 bg-[#121316] border border-white/10 rounded-xl p-4">
                {TYPOGRAPHY_SYSTEM.map((typo, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-2.5 last:border-none space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-white text-xs">{typo.level}</span>
                      <span className="text-[#C5A059] text-[11px] font-mono">
                        {typo.fontFamily} • {typo.sizeDesktop} (Desktop) / {typo.sizeMobile} (Mobile)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{typo.purpose}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Component & Motion Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Animações Framer Motion
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {DESIGN_SYSTEM_RULES.animationTiming}
                </p>
              </div>

              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Acessibilidade WCAG AA
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {DESIGN_SYSTEM_RULES.accessibilityStandards}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: UX Architecture Content */}
        {activeTab === 'ux' && (
          <div className="space-y-8 text-xs sm:text-sm text-slate-300">
            
            {/* Target Audience Profiles */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <Users className="w-4 h-4" /> 1. Mapeamento de Personas e Público-Alvo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TARGET_AUDIENCE_PROFILES.map((profile, idx) => (
                  <div key={idx} className="p-4 bg-[#121316] border border-white/10 rounded-xl space-y-3">
                    <div className="border-b border-white/10 pb-2">
                      <span className="font-cinzel font-bold text-white text-sm text-[#C5A059]">
                        {profile.profile}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold mb-0.5">O que procura:</span>
                      <p className="text-xs text-slate-200">{profile.seeks}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold mb-1">Principais Dúvidas / Objeções:</span>
                      <ul className="space-y-1">
                        {profile.fearsAndDoubts.map((doubt, dIdx) => (
                          <li key={dIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                            <span className="text-[#C5A059]">•</span>
                            <span>{doubt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-[#C5A059] font-bold block uppercase tracking-wider">
                        Gatilho de Conversão:
                      </span>
                      <p className="text-[11px] text-slate-300 italic">{profile.conversionTriggers}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Journey Stages */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <Target className="w-4 h-4" /> 2. Jornada do Usuário e Funil de Conversão
              </h4>
              <div className="space-y-2 bg-[#121316] border border-white/10 rounded-xl p-4">
                {USER_JOURNEY_STAGES.map((journey, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-3 last:border-none space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs text-[#C5A059]">{journey.stage}</span>
                    </div>
                    <p className="text-xs text-slate-200">{journey.objective}</p>
                    <p className="text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Elementos Chave:</span> {journey.keyElements}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Wireframe Specs */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <LayoutGrid className="w-4 h-4" /> 3. Wireframe e Estrutura de Seções
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIREFRAME_SECTION_SPECS.map((spec, idx) => (
                  <div key={idx} className="p-3 bg-[#121316] border border-white/5 rounded-lg space-y-1.5">
                    <span className="font-cinzel font-bold text-white text-xs block text-[#C5A059]">
                      {spec.section}
                    </span>
                    <p className="text-[11px] text-slate-300">{spec.elements}</p>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-white/5">
                      Propósito UX: {spec.uxPurpose}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Specs */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <Compass className="w-4 h-4" /> 4. Arquitetura de Navegação e Interação
              </h4>
              <div className="bg-[#121316] border border-white/10 rounded-xl p-4 space-y-2 text-xs">
                <p><span className="text-[#C5A059] font-bold">Header Fixo:</span> {NAVIGATION_SPECS.fixedHeaderBehavior}</p>
                <p><span className="text-[#C5A059] font-bold">Navegação Suave:</span> {NAVIGATION_SPECS.scrollBehavior}</p>
                <p><span className="text-[#C5A059] font-bold">Menu Mobile:</span> {NAVIGATION_SPECS.mobileMenu}</p>
                <p><span className="text-[#C5A059] font-bold">Botão WhatsApp:</span> {NAVIGATION_SPECS.floatingWhatsApp}</p>
                <p><span className="text-[#C5A059] font-bold">Voltar ao Topo:</span> {NAVIGATION_SPECS.backToTop}</p>
              </div>
            </div>

            {/* CTA Strategy */}
            <div className="space-y-3">
              <h4 className="font-cinzel font-bold text-white text-base flex items-center gap-2 text-[#C5A059]">
                <Sparkles className="w-4 h-4" /> 5. Estratégia de Chamadas para Ação (CTAs)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CTA_STRATEGY.map((cta, idx) => (
                  <div key={idx} className="p-3 bg-[#121316] border border-white/5 rounded-lg space-y-1">
                    <span className="font-bold text-white text-xs block text-[#C5A059]">{cta.location}: {cta.label}</span>
                    <p className="text-[11px] text-slate-200">"{cta.text}"</p>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-white/5">{cta.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SEO & WCAG Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> SEO e Performance
                </h5>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  {ACCESSIBILITY_AND_SEO.seoRules.map((rule, idx) => (
                    <li key={idx}>• {rule}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Acessibilidade WCAG AA
                </h5>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  {ACCESSIBILITY_AND_SEO.wcagRules.map((rule, idx) => (
                    <li key={idx}>• {rule}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: Home Page Specification (PROMPT 04) */}
        {activeTab === 'home-spec' && (
          <div className="space-y-8 text-xs sm:text-sm text-slate-300">
            
            <div className="p-4 bg-[#121316] border border-[#C5A059]/30 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-cinzel font-bold text-white text-base">
                  Especificação Técnica da Página Principal
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Documento Técnico de UX/UI e Estrutura de Seções para Jucélia Santana Engenharia Civil
                </p>
              </div>
              <Badge variant="gold">ESPECIFICAÇÃO TÉCNICA</Badge>
            </div>

            {/* Sections Spec Array */}
            <div className="space-y-6">
              {[
                HERO_SECTION_SPEC,
                HIGHLIGHTS_SECTION_SPEC,
                ABOUT_SECTION_SPEC,
                SERVICES_SECTION_SPEC,
                PROJECTS_SECTION_SPEC,
                DIFFERENTIALS_SECTION_SPEC,
                CTA_SECTION_SPEC,
                CONTACT_SECTION_SPEC,
                FOOTER_SPEC
              ].map((sec, idx) => (
                <div key={idx} className="bg-[#121316] border border-white/10 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-cinzel font-bold text-[#C5A059] text-sm">
                      SEÇÃO {sec.sectionNumber} — {sec.sectionTitle.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Status: Implementado</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-white">Layout e Estrutura: </span>
                    {sec.layoutDescription}
                  </p>

                  <div className="space-y-1">
                    <span className="font-bold text-xs text-[#C5A059]">Elementos Visuais e Componentes:</span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-1">
                      {sec.visualElements.map((elem, eIdx) => (
                        <li key={eIdx}>{elem}</li>
                      ))}
                    </ul>
                  </div>

                  {sec.copywritingTexts.length > 0 && (
                    <div className="space-y-1 bg-[#0B0C0E] p-3 rounded-lg border border-white/5">
                      <span className="font-bold text-[11px] text-[#C5A059]">Copywriting e Textos Institucionais:</span>
                      {sec.copywritingTexts.map((copy, cIdx) => (
                        <p key={cIdx} className="text-[11px] text-slate-300">
                          <span className="text-slate-400 font-semibold">{copy.label}: </span>
                          "{copy.content}"
                        </p>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5">
                    <span className="text-[#C5A059] font-semibold">Justificativa Estratégica: </span>
                    {sec.strategicRationale}
                  </p>
                </div>
              ))}
            </div>

            {/* Microinteractions & Responsiveness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Microinterações e Feedback Visual
                </h5>
                <ul className="space-y-2 text-[11px] text-slate-400">
                  <li><strong className="text-slate-200">Hover:</strong> {MICROINTERACTIONS_SPEC.hoverEffects}</li>
                  <li><strong className="text-slate-200">Scroll:</strong> {MICROINTERACTIONS_SPEC.scrollBehavior}</li>
                  <li><strong className="text-slate-200">Animações:</strong> {MICROINTERACTIONS_SPEC.fadeAnimations}</li>
                  <li><strong className="text-slate-200">Feedback:</strong> {MICROINTERACTIONS_SPEC.visualFeedback}</li>
                </ul>
              </div>

              <div className="p-4 bg-[#121316] border border-white/5 rounded-xl space-y-2">
                <h5 className="font-cinzel font-bold text-white text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Matriz de Responsividade
                </h5>
                <ul className="space-y-2 text-[11px] text-slate-400">
                  <li><strong className="text-slate-200">Desktop (1280px+):</strong> {RESPONSIVENESS_SPEC.desktop}</li>
                  <li><strong className="text-slate-200">Notebook (1024px):</strong> {RESPONSIVENESS_SPEC.notebook}</li>
                  <li><strong className="text-slate-200">Tablet (768px):</strong> {RESPONSIVENESS_SPEC.tablet}</li>
                  <li><strong className="text-slate-200">Celular (375px):</strong> {RESPONSIVENESS_SPEC.mobile}</li>
                </ul>
              </div>
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
};

