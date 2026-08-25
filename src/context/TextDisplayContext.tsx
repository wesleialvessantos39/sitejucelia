// /src/context/TextDisplayContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { useAuth } from './AuthContext';
import {
  TextDisplaySettings,
  PublicTextSection,
  ViewportType,
  ResolvedSectionTextConfig,
} from '../types/textDisplay';
import {
  DEFAULT_TEXT_DISPLAY_SETTINGS,
  normalizeTextDisplaySettings,
  resolveTextSectionConfig,
} from '../data/defaultTextDisplaySettings';

interface TextDisplayContextType {
  settings: TextDisplaySettings;
  loading: boolean;
  viewport: ViewportType;
  saveSettings: (newSettings: TextDisplaySettings) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  resolveConfig: (section: PublicTextSection, forcedViewport?: ViewportType) => ResolvedSectionTextConfig;
}

const TextDisplayContext = createContext<TextDisplayContextType | undefined>(undefined);

export const TextDisplayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<TextDisplaySettings>(DEFAULT_TEXT_DISPLAY_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  const { user } = useAuth();

  // Detecção de viewport responsivo no cliente
  useEffect(() => {
    const handleResize = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      if (width < 640) {
        setViewport('mobile');
      } else if (width < 1024) {
        setViewport('tablet');
      } else {
        setViewport('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabaseDatabase.getTextDisplaySettings();
      setSettings(data);
    } catch (err) {
      console.warn('[TextDisplayContext] Erro ao carregar configurações de texto:', err);
      setSettings(DEFAULT_TEXT_DISPLAY_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Inscrição Realtime no Supabase para sincronização instantânea em abas e clientes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    try {
      const channel = supabase
        .channel('realtime_text_display_settings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'site_settings',
            filter: 'key=eq.text_display_settings',
          },
          (payload) => {
            if (payload.new && typeof payload.new === 'object') {
              const newRow = payload.new as { value?: unknown };
              if (newRow.value) {
                setSettings(normalizeTextDisplaySettings(newRow.value));
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[TextDisplayContext] Aviso ao registrar canal Realtime:', err);
    }
  }, []);

  const saveSettings = useCallback(
    async (newSettings: TextDisplaySettings): Promise<boolean> => {
      try {
        const saved = await supabaseDatabase.saveTextDisplaySettings(
          newSettings,
          user?.id,
          user?.email
        );
        setSettings(saved);
        return true;
      } catch (err) {
        console.error('[TextDisplayContext] Erro ao salvar configurações de texto:', err);
        return false;
      }
    },
    [user]
  );

  const resetSettings = useCallback(async (): Promise<boolean> => {
    try {
      const reset = await supabaseDatabase.resetTextDisplaySettings(user?.id, user?.email);
      setSettings(reset);
      return true;
    } catch (err) {
      console.error('[TextDisplayContext] Erro ao redefinir configurações de texto:', err);
      return false;
    }
  }, [user]);

  const resolveConfig = useCallback(
    (section: PublicTextSection, forcedViewport?: ViewportType): ResolvedSectionTextConfig => {
      const targetViewport = forcedViewport || viewport;
      return resolveTextSectionConfig(settings, section, targetViewport);
    },
    [settings, viewport]
  );

  const contextValue = useMemo(
    () => ({
      settings,
      loading,
      viewport,
      saveSettings,
      resetSettings,
      refreshSettings: fetchSettings,
      resolveConfig,
    }),
    [settings, loading, viewport, saveSettings, resetSettings, fetchSettings, resolveConfig]
  );

  return (
    <TextDisplayContext.Provider value={contextValue}>
      {children}
    </TextDisplayContext.Provider>
  );
};

export const useTextDisplay = (): TextDisplayContextType => {
  const context = useContext(TextDisplayContext);
  if (!context) {
    throw new Error('useTextDisplay deve ser usado dentro de um TextDisplayProvider');
  }
  return context;
};
