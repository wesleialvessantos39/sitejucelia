// /src/types/textDisplay.ts

export type TextDisplayMode = 'full' | 'compact' | 'collapsible';

export type PublicTextSection =
  | 'hero'
  | 'about'
  | 'services'
  | 'projects'
  | 'gallery'
  | 'blog'
  | 'differentials'
  | 'process'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'footer';

export const PUBLIC_SECTIONS: PublicTextSection[] = [
  'hero',
  'about',
  'services',
  'projects',
  'differentials',
  'process',
  'faq',
  'cta',
  'contact',
  'footer',
  'gallery',
  'blog',
];

export interface TextSectionOverride {
  mode: 'inherit' | TextDisplayMode;
  minimumCharacters?: number;
  mobileLines?: number;
  tabletLines?: number;
  desktopLines?: number;
}

export interface TextDisplaySettings {
  enabled: boolean;
  mode: TextDisplayMode;
  automaticDetection: boolean;
  minimumCharacters: number;
  mobileLines: number;
  tabletLines: number;
  desktopLines: number;
  initiallyExpanded: boolean;
  showToggle: boolean;
  expandLabel: string;
  collapseLabel: string;
  sectionOverrides: Partial<Record<PublicTextSection, TextSectionOverride>>;
  updatedAt?: string;
}

export type ViewportType = 'mobile' | 'tablet' | 'desktop';

export interface ResolvedSectionTextConfig {
  enabled: boolean;
  mode: TextDisplayMode;
  maxLines: number;
  minimumCharacters: number;
  showToggle: boolean;
  initiallyExpanded: boolean;
  expandLabel: string;
  collapseLabel: string;
}
