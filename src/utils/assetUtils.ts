// /src/utils/assetUtils.ts

/**
 * Extracts storage path relative to bucket from a Supabase Storage URL
 */
export const extractStoragePathFromUrl = (url: string, bucketName: string): string | null => {
  if (!url) return null;
  const needle = `/storage/v1/object/public/${bucketName}/`;
  const index = url.indexOf(needle);
  if (index !== -1) {
    const rawPath = url.substring(index + needle.length);
    return rawPath.split('?')[0];
  }
  if (url.startsWith('projects/')) {
    return url.split('?')[0];
  }
  return null;
};

/**
 * Returns a relative URL for local assets so they work on any domain, subfolder, or file system host.
 */
export const getAssetUrl = (url: string): string => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  let cleanPath = url;
  if (cleanPath.startsWith('./')) {
    cleanPath = cleanPath.slice(2);
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }
  return `./${cleanPath}`;
};

/**
 * Multi-stage fallback handler for the company logo.
 */
export const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (!target.dataset.fallbackStep) {
    target.dataset.fallbackStep = '1';
    target.src = './foto_logo.png';
  } else if (target.dataset.fallbackStep === '1') {
    target.dataset.fallbackStep = '2';
    target.src = './foto_logo.jpg';
  } else if (target.dataset.fallbackStep === '2') {
    target.dataset.fallbackStep = '3';
    target.src = './foto logo.png';
  } else if (target.dataset.fallbackStep === '3') {
    target.dataset.fallbackStep = '4';
    target.src = './foto logo.jpg';
  }
};

/**
 * Fallback handler for structural project photos.
 */
export const handleStructuralPhotoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (!target.dataset.fallbackStep) {
    target.dataset.fallbackStep = '1';
    target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80';
  } else if (target.dataset.fallbackStep === '1') {
    target.dataset.fallbackStep = '2';
    target.src = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80';
  }
};

/**
 * Fallback handler for structural project video.
 */
export const handleStructuralVideoError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement, Event>) => {
  const target = e.currentTarget;
  if (!target.dataset.fallbackHandled) {
    target.dataset.fallbackHandled = 'true';
    console.warn('[assetUtils] Erro ao carregar mídia de vídeo do projeto:', target);
  }
};
