// /src/utils/preloadUtils.ts
import { getAssetUrl } from './assetUtils';
import { getCachedVisualIdentity, getEffectiveVisualAsset } from './visualCacheUtils';

/**
 * Pré-carrega imagens e recursos visuais críticos imediatamente no início do ciclo de vida,
 * garantindo que o splash screen, o cabeçalho e os logos apareçam instantaneamente sem flash.
 */
export function preloadCriticalAssets() {
  if (typeof window === 'undefined') return;

  const cached = getCachedVisualIdentity();
  const effectiveSplash = getEffectiveVisualAsset('splash_icon', cached);
  const effectiveLogo = getEffectiveVisualAsset('site_logo', cached);

  const criticalImages = [
    effectiveSplash,
    effectiveLogo,
    getAssetUrl('foto_logo.png'),
    getAssetUrl('foto_logo.jpg'),
    '/icon.svg',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80',
  ].filter(Boolean) as string[];

  // Evita duplicatas
  const uniqueUrls = Array.from(new Set(criticalImages));

  uniqueUrls.forEach((url) => {
    if (!url) return;
    try {
      const img = new Image();
      img.src = url;
    } catch {
      // Ignora silenciosamente
    }
  });
}

/**
 * Utilitário para pré-carregar um módulo React em hover/focus de links.
 */
export function preloadComponent(factory: () => Promise<any>) {
  try {
    factory();
  } catch {
    // Ignora silenciosamente se o pré-carregamento falhar
  }
}

