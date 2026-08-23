// /src/utils/themeUtils.ts

export interface SiteThemeSettings {
  bg_primary: string;        // Cor de fundo principal (#0A1220)
  bg_secondary: string;      // Cor de fundo secundária (#0B1526)
  color_primary: string;     // Cor principal (#C5A059)
  color_secondary: string;   // Cor secundária (#182B4A)
  color_titles: string;      // Cor dos títulos (#FFFFFF)
  color_text: string;        // Cor dos textos (#CBD5E1)
  color_buttons: string;     // Cor dos botões (#C5A059)
  color_button_text: string; // Cor do texto dos botões (#070D18)
  color_accent: string;      // Cor de destaque (#D4AF37)
  color_border: string;      // Cor das bordas (#1E293B)
  color_cards: string;       // Cor das superfícies/cards (#0F1C30)
}

export const DEFAULT_THEME: SiteThemeSettings = {
  bg_primary: '#0A1220',
  bg_secondary: '#0B1526',
  color_primary: '#C5A059',
  color_secondary: '#182B4A',
  color_titles: '#FFFFFF',
  color_text: '#CBD5E1',
  color_buttons: '#C5A059',
  color_button_text: '#070D18',
  color_accent: '#D4AF37',
  color_border: '#1E293B',
  color_cards: '#0F1C30',
};

/**
 * Valida se a string é um código HEX hexadecimal de cor válido (#RGB ou #RRGGBB)
 */
export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex.trim());
}

/**
 * Converte código HEX (#RRGGBB ou #RGB) para objeto RGB { r, g, b }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHex(hex)) return null;
  let cleanHex = hex.trim().replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((char) => char + char).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calcula a luminância relativa conforme norma WCAG 2.1
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calcula a razão de contraste (Contrast Ratio) entre duas cores HEX (retorna valor de 1 a 21)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const max = Math.max(lum1, lum2);
  const min = Math.min(lum1, lum2);
  return (max + 0.05) / (min + 0.05);
}

/**
 * Determina se uma cor HEX é predominantemente clara (luminância > 0.35)
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.35;
}

/**
 * Calcula automaticamente uma cor de texto contrastante para um fundo qualquer
 */
export function calculateAutoContrastText(bgHex: string, preferredLight = '#FFFFFF', preferredDark = '#070D18'): string {
  if (!isValidHex(bgHex)) return preferredLight;
  return isLightColor(bgHex) ? preferredDark : preferredLight;
}

export interface ContrastAnalysisItem {
  label: string;
  fgHex: string;
  bgHex: string;
  ratio: number;
  isPass: boolean;
  recommendedFg?: string;
}

/**
 * Analisa a acessibilidade de contraste (WCAG AA) para os principais pares de cores do tema
 */
export function analyzeThemeContrast(theme: SiteThemeSettings): {
  overallPass: boolean;
  items: ContrastAnalysisItem[];
} {
  const items: ContrastAnalysisItem[] = [
    {
      label: 'Texto Principal vs Fundo Principal',
      fgHex: theme.color_text,
      bgHex: theme.bg_primary,
      ratio: getContrastRatio(theme.color_text, theme.bg_primary),
      isPass: getContrastRatio(theme.color_text, theme.bg_primary) >= 4.5,
      recommendedFg: calculateAutoContrastText(theme.bg_primary, '#CBD5E1', '#0F172A'),
    },
    {
      label: 'Títulos vs Fundo Principal',
      fgHex: theme.color_titles,
      bgHex: theme.bg_primary,
      ratio: getContrastRatio(theme.color_titles, theme.bg_primary),
      isPass: getContrastRatio(theme.color_titles, theme.bg_primary) >= 3.0,
      recommendedFg: calculateAutoContrastText(theme.bg_primary, '#FFFFFF', '#090D16'),
    },
    {
      label: 'Texto dos Cards vs Fundo do Card',
      fgHex: theme.color_text,
      bgHex: theme.color_cards,
      ratio: getContrastRatio(theme.color_text, theme.color_cards),
      isPass: getContrastRatio(theme.color_text, theme.color_cards) >= 4.5,
      recommendedFg: calculateAutoContrastText(theme.color_cards, '#CBD5E1', '#0F172A'),
    },
    {
      label: 'Texto do Botão vs Fundo do Botão',
      fgHex: theme.color_button_text,
      bgHex: theme.color_buttons,
      ratio: getContrastRatio(theme.color_button_text, theme.color_buttons),
      isPass: getContrastRatio(theme.color_button_text, theme.color_buttons) >= 4.5,
      recommendedFg: calculateAutoContrastText(theme.color_buttons, '#FFFFFF', '#070D18'),
    },
  ];

  const overallPass = items.every((i) => i.isPass);
  return { overallPass, items };
}

/**
 * Normaliza o objeto de tema garantindo fallbacks limpos para qualquer chave inválida ou ausente
 */
export function normalizeTheme(raw: any): SiteThemeSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_THEME };
  }

  return {
    bg_primary: isValidHex(raw.bg_primary) ? raw.bg_primary : DEFAULT_THEME.bg_primary,
    bg_secondary: isValidHex(raw.bg_secondary) ? raw.bg_secondary : DEFAULT_THEME.bg_secondary,
    color_primary: isValidHex(raw.color_primary) ? raw.color_primary : DEFAULT_THEME.color_primary,
    color_secondary: isValidHex(raw.color_secondary) ? raw.color_secondary : DEFAULT_THEME.color_secondary,
    color_titles: isValidHex(raw.color_titles) ? raw.color_titles : DEFAULT_THEME.color_titles,
    color_text: isValidHex(raw.color_text) ? raw.color_text : DEFAULT_THEME.color_text,
    color_buttons: isValidHex(raw.color_buttons) ? raw.color_buttons : DEFAULT_THEME.color_buttons,
    color_button_text: isValidHex(raw.color_button_text) ? raw.color_button_text : DEFAULT_THEME.color_button_text,
    color_accent: isValidHex(raw.color_accent) ? raw.color_accent : DEFAULT_THEME.color_accent,
    color_border: isValidHex(raw.color_border) ? raw.color_border : DEFAULT_THEME.color_border,
    color_cards: isValidHex(raw.color_cards) ? raw.color_cards : DEFAULT_THEME.color_cards,
  };
}

/**
 * Aplica as variáveis CSS globais (:root) no documento para que a alteração reflita em todo o ecossistema
 */
export function applyThemeCSSVariables(theme: SiteThemeSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const safeTheme = normalizeTheme(theme);

  root.style.setProperty('--bg-primary', safeTheme.bg_primary);
  root.style.setProperty('--bg-secondary', safeTheme.bg_secondary);
  root.style.setProperty('--color-primary', safeTheme.color_primary);
  root.style.setProperty('--color-secondary', safeTheme.color_secondary);
  root.style.setProperty('--color-titles', safeTheme.color_titles);
  root.style.setProperty('--color-text', safeTheme.color_text);
  root.style.setProperty('--color-buttons', safeTheme.color_buttons);
  root.style.setProperty('--color-button-text', safeTheme.color_button_text);
  root.style.setProperty('--color-accent', safeTheme.color_accent);
  root.style.setProperty('--color-border', safeTheme.color_border);
  root.style.setProperty('--color-cards', safeTheme.color_cards);
}
