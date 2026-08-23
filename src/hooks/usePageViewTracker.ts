// /src/hooks/usePageViewTracker.ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { recordPageView, shouldTrackPath, normalizeAnalyticsPath } from '../services/siteAnalyticsService';

/**
 * Hook customizado para contabilização automática de visualizações públicas:
 * 1. Escuta mudanças na rota pelo React Router (`useLocation`).
 * 2. Valida se a rota é pública através de `shouldTrackPath`.
 * 3. Previne duplicações geradas por React Strict Mode, trocas de tema/contexto ou re-renderizações usando ref de transição.
 * 4. Dispara a gravação via RPC Supabase de forma assíncrona e não-bloqueante (em segundo plano).
 * 5. Garante que recarregamento de página (F5), navegação interna entre páginas diferentes e aberturas em nova aba registrem visualizações legítimas.
 */
export function usePageViewTracker() {
  const location = useLocation();
  const lastTrackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const rawPath = location.pathname;

    // Ignora rotas administrativas e de autenticação
    if (!shouldTrackPath(rawPath)) {
      return;
    }

    const normalizedPath = normalizeAnalyticsPath(rawPath);

    // Cria uma chave única para a transição de rota atual (location.key é único por navegação do React Router)
    const transitionKey = `${location.key || 'init'}:${normalizedPath}`;

    // Previne disparo duplo do React Strict Mode e re-renderizações no mesmo ciclo de vida
    if (lastTrackedKeyRef.current === transitionKey) {
      return;
    }

    lastTrackedKeyRef.current = transitionKey;

    // Executa em segundo plano sem bloquear a renderização da interface
    const timer = setTimeout(() => {
      recordPageView(normalizedPath).catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('[usePageViewTracker] Falha silenciosa ao registrar página:', err);
        }
      });
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname, location.key]);
}
