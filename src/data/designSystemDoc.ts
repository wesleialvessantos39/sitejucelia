// /src/data/designSystemDoc.ts
import { ColorToken, TypographyToken } from '../types';

export const COLOR_PALETTE: ColorToken[] = [
  {
    name: 'Azul Marinho Nobre Principal',
    hex: '#0A1220',
    rgb: 'rgb(10, 18, 32)',
    role: 'Fundo Primário (Dark Navy Canvas)',
    usage: 'Fundo global da aplicação, transmitindo solidez, sofisticação e sobriedade.'
  },
  {
    name: 'Azul Marinho Elevado / Surface',
    hex: '#122038',
    rgb: 'rgb(18, 32, 56)',
    role: 'Fundo de Cards & Elevadores',
    usage: 'Cards de serviços, containers de depoimentos, seções destacadas com efeito glassmorphic.'
  },
  {
    name: 'Azul Marinho Profundo Substrato',
    hex: '#060C17',
    rgb: 'rgb(6, 12, 23)',
    role: 'Hover State & Sub-cards',
    usage: 'Estados de foco, seções alternadas e modais de detalhes.'
  },
  {
    name: 'Dourado Arquitetônico',
    hex: '#C5A059',
    rgb: 'rgb(197, 160, 89)',
    role: 'Cor de Destaque / Brand Accent',
    usage: 'Linhas divisórias elegantes, ícones institucionais, bordas ativas e detalhes em títulos.'
  },
  {
    name: 'Dourado Brilhante Hover',
    hex: '#D4AF37',
    rgb: 'rgb(212, 175, 55)',
    role: 'Botões Primários & Hovers',
    usage: 'Botões de CTA de alta conversão (Solicitar Orçamento / WhatsApp), badge de destaques.'
  },
  {
    name: 'Dourado Muted Border',
    hex: '#8F7238',
    rgb: 'rgb(143, 114, 56)',
    role: 'Bordas e Linhas de Estrutura',
    usage: 'Bordas sutis de 1px em cards e delimitadores de seções.'
  },
  {
    name: 'Branco Puro',
    hex: '#FFFFFF',
    rgb: 'rgb(255, 255, 255)',
    role: 'Texto Principal & Alto Contraste',
    usage: 'Títulos H1/H2 de máximo destaque, ícones de botões primários.'
  },
  {
    name: 'Branco Gelo (Off-White)',
    hex: '#F8F9FA',
    rgb: 'rgb(248, 249, 250)',
    role: 'Corpo de Texto e Parágrafos',
    usage: 'Texto legível de leitura longa, rótulos de formulário.'
  },
  {
    name: 'Cinza Platina',
    hex: '#E2E8F0',
    rgb: 'rgb(226, 232, 240)',
    role: 'Bordas Desativadas e Divisores',
    usage: 'Linhas de grade, bordas de formulários em estado neutro.'
  },
  {
    name: 'Cinza Slate Secundário',
    hex: '#94A3B8',
    rgb: 'rgb(148, 163, 184)',
    role: 'Subtítulos & Metadados',
    usage: 'Datas de projetos, números de registro CREA, notas de rodapé.'
  }
];

export const TYPOGRAPHY_SYSTEM: TypographyToken[] = [
  {
    level: 'Hero H1 Display',
    fontFamily: 'Cinzel (Serif Geometric)',
    sizeDesktop: '52px (3.25rem)',
    sizeMobile: '36px (2.25rem)',
    weight: '700 (Bold)',
    lineHeight: '1.15',
    tracking: 'tracking-tight (-0.02em)',
    purpose: 'Título principal da Hero Section - impacto imediato e autoridade de marca.'
  },
  {
    level: 'Section H2 Title',
    fontFamily: 'Cinzel (Serif Geometric)',
    sizeDesktop: '38px (2.375rem)',
    sizeMobile: '28px (1.75rem)',
    weight: '700 (Bold)',
    lineHeight: '1.2',
    tracking: 'tracking-normal',
    purpose: 'Títulos de seções (Sobre, Serviços, Projetos) com detalhe em sublinhado dourado.'
  },
  {
    level: 'Card H3 Title',
    fontFamily: 'Cinzel (Serif Geometric)',
    sizeDesktop: '22px (1.375rem)',
    sizeMobile: '18px (1.125rem)',
    weight: '600 (SemiBold)',
    lineHeight: '1.3',
    tracking: 'tracking-wide (+0.01em)',
    purpose: 'Nome dos serviços e títulos dos cards de portfólio.'
  },
  {
    level: 'Body Text / Paragraph',
    fontFamily: 'Plus Jakarta Sans',
    sizeDesktop: '16px (1rem)',
    sizeMobile: '15px (0.9375rem)',
    weight: '400 (Regular) / 500 (Medium)',
    lineHeight: '1.65',
    tracking: 'normal',
    purpose: 'Textos de leitura contínua, descrições institucionais e respostas de FAQ.'
  },
  {
    level: 'Button Label & Badge',
    fontFamily: 'Plus Jakarta Sans',
    sizeDesktop: '14px (0.875rem)',
    sizeMobile: '13px (0.8125rem)',
    weight: '600 (SemiBold)',
    lineHeight: '1.25',
    tracking: 'tracking-wider (+0.05em)',
    purpose: 'Textos de botões em maiúsculas suaves e badges institucionais.'
  }
];

export const DESIGN_SYSTEM_RULES = {
  spacingGrid: 'Módulo base de 8px (8, 16, 24, 32, 48, 64, 96, 128px). Padding externo da seção sempre >= 80px no Desktop.',
  borderRadius: 'Capsula Pills (9999px) para Badges e Botões primários; Radius de 12px para Cards e Modais.',
  shadows: 'Sombra estrutural: 0 20px 40px -15px rgba(0, 0, 0, 0.5); Brilho dourado: 0 0 25px rgba(197, 160, 89, 0.2).',
  animationTiming: 'Transição suave com Framer Motion: duration = 0.5s, ease = [0.22, 1, 0.36, 1] (Cubic Bezier de desaceleração suave).',
  accessibilityStandards: 'Contraste WCAG AA verificado (> 4.5:1 em todos os textos); navegação via tecla Tab e indicação de foco dourado.'
};
