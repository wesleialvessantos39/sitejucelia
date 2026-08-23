import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { preloadCriticalAssets } from './utils/preloadUtils.ts';
import './index.css';

// Pré-carrega imediatamente os ativos da identidade visual antes da montagem da árvore
preloadCriticalAssets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

