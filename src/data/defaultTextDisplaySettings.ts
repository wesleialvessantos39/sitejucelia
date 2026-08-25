// /src/data/defaultTextDisplaySettings.ts
import {
  TextDisplayMode,
  PublicTextSection,
  TextSectionOverride,
  TextDisplaySettings,
  ViewportType,
  ResolvedSectionTextConfig,
} from '../types/textDisplay';

export const ALL_PUBLIC_TEXT_SECTIONS: PublicTextSection[] = [
  'hero',
  'about',
  'services',
  'projects',
  'gallery',
  'blog',
  'differentials',
  'process',
  'faq',
  'cta',
  'contact',
  'footer',
];

export const SECTION_NAMES_PT: Record<PublicTextSection, string> = {
  hero: 'Apresentação (Hero)',
  about: 'Sobre a Engenheira',
  services: 'Serviços e Soluções',
  projects: 'Obras e Projetos',
  gallery: 'Galeria de Mídias',
  blog: 'Artigos e Notícias (Blog)',
  differentials: 'Diferenciais Técnicos',
  process: 'Metodologia de Trabalho',
  faq: 'Perguntas Frequentes (FAQ)',
  cta: 'Chamada para Ação (CTA)',
  contact: 'Atendimento e Contato',
  footer: 'Rodapé Institucional',
};

export const SECTION_METADATA: Record<PublicTextSection, { name: string; description: string }> = {
  hero: { name: 'Apresentação (Hero)', description: 'Parágrafo descritivo de abertura no topo da página.' },
  about: { name: 'Sobre a Engenheira', description: 'Biografia técnica e parágrafos de apresentação institucional.' },
  services: { name: 'Serviços e Soluções', description: 'Descrições técnicas dos cards e modais de serviços.' },
  projects: { name: 'Obras e Projetos', description: 'Descrições dos projetos executados e laudos periciais.' },
  gallery: { name: 'Galeria de Mídias', description: 'Legendas das fotos e vídeos de campo.' },
  blog: { name: 'Artigos e Notícias (Blog)', description: 'Resumos dos artigos e laudos técnicos periciais.' },
  differentials: { name: 'Diferenciais Técnicos', description: 'Detalhamento dos pilares de qualidade e conformidade NBR.' },
  process: { name: 'Metodologia de Trabalho', description: 'Descrições das etapas do fluxo de engenharia.' },
  faq: { name: 'Perguntas Frequentes (FAQ)', description: 'Respostas detalhadas às dúvidas frequentes dos clientes.' },
  cta: { name: 'Chamada para Ação (CTA)', description: 'Subtítulo e texto de fechamento para solicitação de orçamento.' },
  contact: { name: 'Atendimento e Contato', description: 'Instruções de atendimento e canais diretos.' },
  footer: { name: 'Rodapé Institucional', description: 'Resumo institucional de fechamento no rodapé.' },
};

export const DEFAULT_TEXT_DISPLAY_SETTINGS: TextDisplaySettings = {
  enabled: true,
  mode: 'collapsible',
  automaticDetection: true,
  minimumCharacters: 180,
  mobileLines: 3,
  tabletLines: 4,
  desktopLines: 5,
  initiallyExpanded: false,
  showToggle: true,
  expandLabel: 'Ler mais...',
  collapseLabel: 'Ler menos',
  sectionOverrides: {},
  updatedAt: new Date().toISOString(),
};

const VALID_MODES: TextDisplayMode[] = ['full', 'compact', 'collapsible'];

function clamp(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function sanitizeLabel(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const cleaned = val.replace(/<[^>]*>?/gm, '').trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

export function normalizeTextDisplaySettings(input?: unknown): TextDisplaySettings {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_TEXT_DISPLAY_SETTINGS };
  }

  const raw = input as Partial<TextDisplaySettings>;

  const mode: TextDisplayMode =
    typeof raw.mode === 'string' && VALID_MODES.includes(raw.mode as TextDisplayMode)
      ? (raw.mode as TextDisplayMode)
      : DEFAULT_TEXT_DISPLAY_SETTINGS.mode;

  const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_TEXT_DISPLAY_SETTINGS.enabled;
  const automaticDetection =
    typeof raw.automaticDetection === 'boolean'
      ? raw.automaticDetection
      : DEFAULT_TEXT_DISPLAY_SETTINGS.automaticDetection;
  const initiallyExpanded =
    typeof raw.initiallyExpanded === 'boolean'
      ? raw.initiallyExpanded
      : DEFAULT_TEXT_DISPLAY_SETTINGS.initiallyExpanded;
  const showToggle =
    typeof raw.showToggle === 'boolean'
      ? raw.showToggle
      : DEFAULT_TEXT_DISPLAY_SETTINGS.showToggle;

  const minimumCharacters = clamp(
    Number(raw.minimumCharacters) || DEFAULT_TEXT_DISPLAY_SETTINGS.minimumCharacters,
    80,
    2000
  );

  const mobileLines = clamp(
    Number(raw.mobileLines) || DEFAULT_TEXT_DISPLAY_SETTINGS.mobileLines,
    2,
    12
  );

  const tabletLines = clamp(
    Number(raw.tabletLines) || DEFAULT_TEXT_DISPLAY_SETTINGS.tabletLines,
    2,
    12
  );

  const desktopLines = clamp(
    Number(raw.desktopLines) || DEFAULT_TEXT_DISPLAY_SETTINGS.desktopLines,
    2,
    12
  );

  const expandLabel = sanitizeLabel(raw.expandLabel, DEFAULT_TEXT_DISPLAY_SETTINGS.expandLabel);
  const collapseLabel = sanitizeLabel(raw.collapseLabel, DEFAULT_TEXT_DISPLAY_SETTINGS.collapseLabel);

  const sectionOverrides: Partial<Record<PublicTextSection, TextSectionOverride>> = {};

  if (raw.sectionOverrides && typeof raw.sectionOverrides === 'object') {
    for (const section of ALL_PUBLIC_TEXT_SECTIONS) {
      const override = (raw.sectionOverrides as Record<string, unknown>)[section];
      if (override && typeof override === 'object') {
        const o = override as Partial<TextSectionOverride>;
        const validOverrideModes = ['inherit', 'full', 'compact', 'collapsible'];
        const overrideMode =
          typeof o.mode === 'string' && validOverrideModes.includes(o.mode)
            ? (o.mode as 'inherit' | TextDisplayMode)
            : 'inherit';

        const sanitizedOverride: TextSectionOverride = {
          mode: overrideMode,
        };

        if (typeof o.minimumCharacters === 'number' && !isNaN(o.minimumCharacters)) {
          sanitizedOverride.minimumCharacters = clamp(o.minimumCharacters, 80, 2000);
        }
        if (typeof o.mobileLines === 'number' && !isNaN(o.mobileLines)) {
          sanitizedOverride.mobileLines = clamp(o.mobileLines, 2, 12);
        }
        if (typeof o.tabletLines === 'number' && !isNaN(o.tabletLines)) {
          sanitizedOverride.tabletLines = clamp(o.tabletLines, 2, 12);
        }
        if (typeof o.desktopLines === 'number' && !isNaN(o.desktopLines)) {
          sanitizedOverride.desktopLines = clamp(o.desktopLines, 2, 12);
        }

        sectionOverrides[section] = sanitizedOverride;
      }
    }
  }

  return {
    enabled,
    mode,
    automaticDetection,
    minimumCharacters,
    mobileLines,
    tabletLines,
    desktopLines,
    initiallyExpanded,
    showToggle,
    expandLabel,
    collapseLabel,
    sectionOverrides,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export function resolveTextSectionConfig(
  settings: TextDisplaySettings,
  section: PublicTextSection,
  viewport: ViewportType = 'desktop'
): ResolvedSectionTextConfig {
  const norm = normalizeTextDisplaySettings(settings);
  if (!norm.enabled) {
    return {
      enabled: false,
      mode: 'full',
      maxLines: 999,
      minimumCharacters: norm.minimumCharacters,
      showToggle: false,
      initiallyExpanded: true,
      expandLabel: norm.expandLabel,
      collapseLabel: norm.collapseLabel,
    };
  }

  const override = norm.sectionOverrides[section];
  const mode: TextDisplayMode =
    override && override.mode && override.mode !== 'inherit'
      ? override.mode
      : norm.mode;

  if (mode === 'full') {
    return {
      enabled: true,
      mode: 'full',
      maxLines: 999,
      minimumCharacters: norm.minimumCharacters,
      showToggle: false,
      initiallyExpanded: true,
      expandLabel: norm.expandLabel,
      collapseLabel: norm.collapseLabel,
    };
  }

  let baseLines = norm.desktopLines;
  if (viewport === 'mobile') baseLines = norm.mobileLines;
  else if (viewport === 'tablet') baseLines = norm.tabletLines;

  let maxLines = baseLines;
  if (override) {
    if (viewport === 'mobile' && typeof override.mobileLines === 'number') {
      maxLines = override.mobileLines;
    } else if (viewport === 'tablet' && typeof override.tabletLines === 'number') {
      maxLines = override.tabletLines;
    } else if (viewport === 'desktop' && typeof override.desktopLines === 'number') {
      maxLines = override.desktopLines;
    }
  }

  const minChars =
    override && typeof override.minimumCharacters === 'number'
      ? override.minimumCharacters
      : norm.minimumCharacters;

  return {
    enabled: true,
    mode,
    maxLines: clamp(maxLines, 2, 12),
    minimumCharacters: clamp(minChars, 80, 2000),
    showToggle: mode === 'collapsible' ? norm.showToggle : false,
    initiallyExpanded: norm.initiallyExpanded,
    expandLabel: norm.expandLabel,
    collapseLabel: norm.collapseLabel,
  };
}
