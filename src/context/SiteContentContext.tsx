// /src/context/SiteContentContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteContentSettings } from '../types/content';
import { DEFAULT_SITE_CONTENT } from '../data/defaultSiteContent';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { useAuth } from './AuthContext';

interface SiteContentContextType {
  content: SiteContentSettings;
  isLoading: boolean;
  updateContent: (newContent: SiteContentSettings) => Promise<boolean>;
  resetContent: () => Promise<boolean>;
  refreshContent: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContentSettings>(DEFAULT_SITE_CONTENT);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await supabaseDatabase.getSiteContent();
      setContent(data);
    } catch (err) {
      console.warn('[SiteContentContext] Erro ao carregar textos, usando fallback:', err);
      setContent(DEFAULT_SITE_CONTENT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const updateContent = async (newContent: SiteContentSettings): Promise<boolean> => {
    try {
      await supabaseDatabase.saveSiteContent(newContent, user?.id);
      setContent(newContent);
      return true;
    } catch (err) {
      console.error('[SiteContentContext] Erro ao salvar textos:', err);
      return false;
    }
  };

  const resetContent = async (): Promise<boolean> => {
    try {
      const defaultContent = await supabaseDatabase.resetSiteContent(user?.id);
      setContent(defaultContent);
      return true;
    } catch (err) {
      console.error('[SiteContentContext] Erro ao restaurar textos padrão:', err);
      return false;
    }
  };

  return (
    <SiteContentContext.Provider
      value={{
        content,
        isLoading,
        updateContent,
        resetContent,
        refreshContent: fetchContent,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = (): SiteContentContextType => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent deve ser usado dentro de um SiteContentProvider');
  }
  return context;
};
