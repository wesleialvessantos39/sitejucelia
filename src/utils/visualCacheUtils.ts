// /src/utils/visualCacheUtils.ts
import { getAssetUrl } from './assetUtils';

export interface VisualIdentitySettings {
  site_logo: string | null;
  site_favicon: string | null;
  splash_icon: string | null;
  dashboard_icon: string | null;
  admin_sidebar_icon: string | null;
}

export const VISUAL_IDENTITY_CACHE_KEY = 'JS_VISUAL_IDENTITY_CACHE_V1';

/**
 * Configurações visuais padrão com recursos locais mínimos garantidos e comprovadamente válidos.
 * Elimina qualquer estado de imagem vazia, placeholder quebrado ou texto substituto.
 */
export const DEFAULT_VISUAL_SETTINGS: VisualIdentitySettings = {
  site_logo: getAssetUrl('foto_logo.png'),
  site_favicon: '/icon.svg',
  splash_icon: getAssetUrl('foto_logo.png'),
  dashboard_icon: getAssetUrl('foto_logo.png'),
  admin_sidebar_icon: getAssetUrl('foto_logo.png'),
};

/**
 * Obtém a identidade visual armazenada em cache local (localStorage).
 * Permite que a aplicação inicie no frame 0 com os recursos visuais oficiais já disponíveis,
 * mesmo antes de qualquer resposta de rede do Supabase.
 */
export function getCachedVisualIdentity(): VisualIdentitySettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_VISUAL_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(VISUAL_IDENTITY_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          site_logo: parsed.site_logo || DEFAULT_VISUAL_SETTINGS.site_logo,
          site_favicon: parsed.site_favicon || DEFAULT_VISUAL_SETTINGS.site_favicon,
          splash_icon: parsed.splash_icon || DEFAULT_VISUAL_SETTINGS.splash_icon,
          dashboard_icon: parsed.dashboard_icon || DEFAULT_VISUAL_SETTINGS.dashboard_icon,
          admin_sidebar_icon: parsed.admin_sidebar_icon || DEFAULT_VISUAL_SETTINGS.admin_sidebar_icon,
        };
      }
    }
  } catch (err) {
    console.warn('[visualCacheUtils] Aviso ao ler cache visual local:', err);
  }

  return { ...DEFAULT_VISUAL_SETTINGS };
}

/**
 * Atualiza o cache local com as configurações visuais mais recentes.
 * Armazena exclusivamente URLs de assets (sem credenciais ou dados sensíveis).
 */
export function setCachedVisualIdentity(settings: Partial<VisualIdentitySettings>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getCachedVisualIdentity();
    const updated: VisualIdentitySettings = {
      site_logo: settings.site_logo ?? current.site_logo ?? DEFAULT_VISUAL_SETTINGS.site_logo,
      site_favicon: settings.site_favicon ?? current.site_favicon ?? DEFAULT_VISUAL_SETTINGS.site_favicon,
      splash_icon: settings.splash_icon ?? current.splash_icon ?? DEFAULT_VISUAL_SETTINGS.splash_icon,
      dashboard_icon: settings.dashboard_icon ?? current.dashboard_icon ?? DEFAULT_VISUAL_SETTINGS.dashboard_icon,
      admin_sidebar_icon: settings.admin_sidebar_icon ?? current.admin_sidebar_icon ?? DEFAULT_VISUAL_SETTINGS.admin_sidebar_icon,
    };

    localStorage.setItem(VISUAL_IDENTITY_CACHE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[visualCacheUtils] Aviso ao salvar cache visual local:', err);
  }
}

/**
 * Hierarquia de Fallback Visual Imediato para cada tipo de asset:
 * 1. splash_icon: splash_icon -> dashboard_icon -> site_logo -> site_favicon -> foto_logo.png
 * 2. site_logo: site_logo -> splash_icon -> dashboard_icon -> foto_logo.png
 * 3. dashboard_icon: dashboard_icon -> splash_icon -> site_logo -> foto_logo.png
 * 4. admin_sidebar_icon: admin_sidebar_icon -> dashboard_icon -> site_logo -> splash_icon -> foto_logo.png
 * 5. site_favicon: site_favicon -> /icon.svg
 */
export function getEffectiveVisualAsset(
  key: keyof VisualIdentitySettings,
  settings?: Partial<VisualIdentitySettings> | null
): string {
  const s = settings || getCachedVisualIdentity();
  const defaultLocalLogo = getAssetUrl('foto_logo.png') || './foto_logo.png';
  const defaultFavicon = '/icon.svg';

  switch (key) {
    case 'splash_icon':
      return (
        s.splash_icon ||
        s.dashboard_icon ||
        s.site_logo ||
        s.site_favicon ||
        defaultLocalLogo
      );

    case 'site_logo':
      return (
        s.site_logo ||
        s.splash_icon ||
        s.dashboard_icon ||
        defaultLocalLogo
      );

    case 'dashboard_icon':
      return (
        s.dashboard_icon ||
        s.splash_icon ||
        s.site_logo ||
        defaultLocalLogo
      );

    case 'admin_sidebar_icon':
      return (
        s.admin_sidebar_icon ||
        s.dashboard_icon ||
        s.site_logo ||
        s.splash_icon ||
        defaultLocalLogo
      );

    case 'site_favicon':
      return (
        s.site_favicon ||
        defaultFavicon
      );

    default:
      return defaultLocalLogo;
  }
}
