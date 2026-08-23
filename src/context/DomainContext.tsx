// /src/context/DomainContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { SiteDomain } from '../types/domain';
import { supabaseDatabase } from '../services/supabaseDatabase';
import {
  getCurrentHostname,
  normalizeDomain,
  isDevelopmentOrPreviewHostname,
  buildCanonicalUrl,
  updateDocumentCanonicalUrl,
} from '../utils/domainUtils';

export interface DomainContextType {
  /**
   * Domínio específico correspondente ao hostname atual, se cadastrado e ativo no Supabase
   */
  currentDomain: SiteDomain | null;

  /**
   * Domínio oficial principal ativo do site
   */
  primaryDomain: SiteDomain | null;

  /**
   * Hostname bruto obtido de window.location.hostname
   */
  hostname: string;

  /**
   * Hostname normalizado (lowercase, sem portas, sem caminhos)
   */
  normalizedHostname: string;

  /**
   * Indica se o acesso está ocorrendo por um domínio customizado reconhecido no banco
   */
  isCustomDomain: boolean;

  /**
   * Indica se o ambiente atual é localhost, 127.0.0.1 ou container de preview/desenvolvimento
   */
  isDevelopment: boolean;

  /**
   * Indica se o processo de resolução de domínio foi concluído (com sucesso ou via fallback)
   */
  isResolved: boolean;

  /**
   * Status de carregamento da consulta ao Supabase
   */
  isLoading: boolean;

  /**
   * Mensagem de erro de rede ou consulta, caso ocorra (sem quebrar a renderização)
   */
  error: string | null;

  /**
   * URL base oficial HTTPS calculada para o contexto atual
   */
  canonicalBaseUrl: string;

  /**
   * Gera a URL canônica completa para uma rota específica
   */
  getCanonicalUrl: (pathname?: string) => string;

  /**
   * Força a recarga e revalidação do domínio no Supabase, invalidando o cache em memória
   */
  refreshDomain: () => Promise<void>;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

// Cache em memória durante a sessão da aplicação (Item 22)
const memoryDomainCache = new Map<string, { domain: SiteDomain | null; primary: SiteDomain | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface DomainProviderProps {
  children: ReactNode;
}

export function DomainProvider({ children }: DomainProviderProps) {
  const [currentDomain, setCurrentDomain] = useState<SiteDomain | null>(null);
  const [primaryDomain, setPrimaryDomain] = useState<SiteDomain | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const rawHostname = getCurrentHostname();
  const normalizedHostname = normalizeDomain(rawHostname);
  const isDevelopment = isDevelopmentOrPreviewHostname(rawHostname);

  // Executa a resolução do domínio a partir do hostname e Supabase
  const resolveDomain = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const cacheKey = normalizedHostname || 'default';
      const cached = memoryDomainCache.get(cacheKey);
      const now = Date.now();

      // Utiliza cache em memória caso ainda esteja válido e não seja forçado o refresh
      if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
        setCurrentDomain(cached.domain);
        setPrimaryDomain(cached.primary);
        setIsResolved(true);
        setIsLoading(false);
        return;
      }

      // Em ambientes de desenvolvimento/preview, busca apenas o domínio primário em background
      // sem bloquear nem interferir na renderização local
      if (isDevelopment && !normalizedHostname) {
        const primary = await supabaseDatabase.getPrimaryDomain().catch(() => null);
        setPrimaryDomain(primary);
        setCurrentDomain(null);
        setIsResolved(true);
        setIsLoading(false);
        return;
      }

      // Executa consulta concorrente ao Supabase para o domínio correspondente e o primário
      const [matchedDomain, primary] = await Promise.all([
        supabaseDatabase.getDomainByHostname(normalizedHostname).catch((err) => {
          console.warn('[DomainContext] Aviso ao consultar domínio por hostname:', err);
          return null;
        }),
        supabaseDatabase.getPrimaryDomain().catch((err) => {
          console.warn('[DomainContext] Aviso ao consultar domínio primário:', err);
          return null;
        }),
      ]);

      setCurrentDomain(matchedDomain);
      setPrimaryDomain(primary);

      // Salva no cache de memória da sessão
      memoryDomainCache.set(cacheKey, {
        domain: matchedDomain,
        primary,
        timestamp: now,
      });

      setIsResolved(true);
    } catch (err: any) {
      console.warn('[DomainContext] Falha não impeditiva na resolução do domínio (aplicando fallback):', err);
      setError(err?.message || 'Falha ao resolver domínio.');
      // O fallback garante que a aplicação continua executando normalmente
      setIsResolved(true);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedHostname, isDevelopment]);

  // Inicialização na montagem do componente
  useEffect(() => {
    resolveDomain();
  }, [resolveDomain]);

  // Cálculo da URL canônica base oficial
  const effectiveDomainName = currentDomain?.domain || primaryDomain?.domain || null;
  const canonicalBaseUrl = buildCanonicalUrl(effectiveDomainName);

  // Atualiza as tags canônicas no DOM sempre que a URL base é determinada
  useEffect(() => {
    if (isResolved && canonicalBaseUrl) {
      updateDocumentCanonicalUrl(canonicalBaseUrl);
    }
  }, [isResolved, canonicalBaseUrl]);

  // Helper para gerar URL canônica de páginas específicas
  const getCanonicalUrl = useCallback((pathname = '/') => {
    return buildCanonicalUrl(effectiveDomainName, pathname);
  }, [effectiveDomainName]);

  // Função para recarregar o domínio
  const refreshDomain = useCallback(async () => {
    memoryDomainCache.clear();
    await resolveDomain(true);
  }, [resolveDomain]);

  const value: DomainContextType = {
    currentDomain,
    primaryDomain,
    hostname: rawHostname,
    normalizedHostname,
    isCustomDomain: !!currentDomain,
    isDevelopment,
    isResolved,
    isLoading,
    error,
    canonicalBaseUrl,
    getCanonicalUrl,
    refreshDomain,
  };

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
}

/**
 * Hook para acessar as informações do domínio ativo na aplicação
 */
export function useDomain(): DomainContextType {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomain deve ser utilizado dentro de um DomainProvider');
  }
  return context;
}

/**
 * Hook alias alternativo
 */
export function useCurrentDomain(): DomainContextType {
  return useDomain();
}
