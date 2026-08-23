// /src/components/analytics/PageViewTracker.tsx
import React from 'react';
import { usePageViewTracker } from '../../hooks/usePageViewTracker';

/**
 * Componente invisível montado dentro do BrowserRouter para rastrear
 * automaticamente acessos a páginas públicas.
 */
export const PageViewTracker: React.FC = () => {
  usePageViewTracker();
  return null;
};

export default PageViewTracker;
