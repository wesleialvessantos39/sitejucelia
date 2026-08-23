// /src/context/VisualIdentityContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseDatabase } from '../services/supabaseDatabase';
import {
  SiteThemeSettings,
  DEFAULT_THEME,
  normalizeTheme,
  applyThemeCSSVariables,
} from '../utils/themeUtils';
import {
  VisualIdentitySettings,
  DEFAULT_VISUAL_SETTINGS,
  getCachedVisualIdentity,
  setCachedVisualIdentity,
  getEffectiveVisualAsset,
} from '../utils/visualCacheUtils';

export type { VisualIdentitySettings };
export { getCachedVisualIdentity, setCachedVisualIdentity, getEffectiveVisualAsset };

interface VisualIdentityContextType {
  settings: VisualIdentitySettings;
  theme: SiteThemeSettings;
  loading: boolean;
  themeLoading: boolean;
  getEffectiveAsset: (key: keyof VisualIdentitySettings) => string;
  refreshSettings: () => Promise<void>;
  updateSetting: (key: keyof VisualIdentitySettings, url: string | null, userId?: string) => Promise<void>;
  updateAllSettings: (newSettings: VisualIdentitySettings, userId?: string) => Promise<void>;
  updateTheme: (newTheme: SiteThemeSettings, userId?: string) => Promise<void>;
  resetThemeToDefault: (userId?: string) => Promise<void>;
  applyThemePreview: (tempTheme: SiteThemeSettings) => void;
  restorePublishedTheme: () => void;
}

const VisualIdentityContext = createContext<VisualIdentityContextType>({
  settings: DEFAULT_VISUAL_SETTINGS,
  theme: DEFAULT_THEME,
  loading: false,
  themeLoading: true,
  getEffectiveAsset: (key) => getEffectiveVisualAsset(key, DEFAULT_VISUAL_SETTINGS),
  refreshSettings: async () => {},
  updateSetting: async () => {},
  updateAllSettings: async () => {},
  updateTheme: async () => {},
  resetThemeToDefault: async () => {},
  applyThemePreview: () => {},
  restorePublishedTheme: () => {},
});

export const VisualIdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializa instantaneamente com o cache local para garantir renderização imediata com identidade visual
  const [settings, setSettings] = useState<VisualIdentitySettings>(() => getCachedVisualIdentity());
  const [theme, setTheme] = useState<SiteThemeSettings>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [themeLoading, setThemeLoading] = useState(true);

  // Atualiza dinamicamente o Favicon no DOM <head>
  const applyFavicon = useCallback((faviconUrl: string | null) => {
    if (typeof document === 'undefined') return;

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    if (faviconUrl) {
      link.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon';
      link.href = faviconUrl;
    } else {
      link.type = 'image/svg+xml';
      link.href = '/icon.svg';
    }
  }, []);

  // Helper para obter o asset com hierarquia de fallback imediata
  const getEffectiveAsset = useCallback(
    (key: keyof VisualIdentitySettings) => getEffectiveVisualAsset(key, settings),
    [settings]
  );

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const saved = await supabaseDatabase.getSiteSetting('visual_identity');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        const data = saved as Record<string, any>;
        const merged: VisualIdentitySettings = {
          site_logo: data.site_logo || DEFAULT_VISUAL_SETTINGS.site_logo,
          site_favicon: data.site_favicon || DEFAULT_VISUAL_SETTINGS.site_favicon,
          splash_icon: data.splash_icon || DEFAULT_VISUAL_SETTINGS.splash_icon,
          dashboard_icon: data.dashboard_icon || DEFAULT_VISUAL_SETTINGS.dashboard_icon,
          admin_sidebar_icon: data.admin_sidebar_icon || DEFAULT_VISUAL_SETTINGS.admin_sidebar_icon,
        };
        setSettings(merged);
        setCachedVisualIdentity(merged);
        applyFavicon(merged.site_favicon);
      } else {
        const initial = getCachedVisualIdentity();
        setSettings(initial);
        applyFavicon(initial.site_favicon);
      }
    } catch (err) {
      console.warn('[VisualIdentityContext] Aviso ao carregar configurações de identidade visual:', err);
      const fallback = getCachedVisualIdentity();
      setSettings(fallback);
      applyFavicon(fallback.site_favicon);
    } finally {
      setLoading(false);
    }
  }, [applyFavicon]);

  const loadTheme = useCallback(async () => {
    try {
      setThemeLoading(true);
      const savedTheme = await supabaseDatabase.getSiteSetting('site_theme');
      const safeTheme = normalizeTheme(savedTheme);
      setTheme(safeTheme);
      applyThemeCSSVariables(safeTheme);
    } catch (err) {
      console.warn('[VisualIdentityContext] Aviso ao carregar tema visual do Supabase, utilizando tema padrão:', err);
      setTheme(DEFAULT_THEME);
      applyThemeCSSVariables(DEFAULT_THEME);
    } finally {
      setThemeLoading(false);
    }
  }, []);

  useEffect(() => {
    // Aplica o favicon inicial sincronicamente
    applyFavicon(settings.site_favicon);
    loadSettings();
    loadTheme();
  }, [loadSettings, loadTheme]);

  const updateSetting = async (key: keyof VisualIdentitySettings, url: string | null, userId?: string) => {
    const updated: VisualIdentitySettings = {
      ...settings,
      [key]: url,
    };
    setSettings(updated);
    setCachedVisualIdentity(updated);
    if (key === 'site_favicon') {
      applyFavicon(url);
    }
    await supabaseDatabase.updateSiteSetting('visual_identity', updated, userId);
  };

  const updateAllSettings = async (newSettings: VisualIdentitySettings, userId?: string) => {
    setSettings(newSettings);
    setCachedVisualIdentity(newSettings);
    applyFavicon(newSettings.site_favicon);
    await supabaseDatabase.updateSiteSetting('visual_identity', newSettings, userId);
  };

  const updateTheme = async (newTheme: SiteThemeSettings, userId?: string) => {
    const safeTheme = normalizeTheme(newTheme);
    setTheme(safeTheme);
    applyThemeCSSVariables(safeTheme);
    await supabaseDatabase.updateSiteSetting('site_theme', safeTheme, userId);
  };

  const resetThemeToDefault = async (userId?: string) => {
    setTheme(DEFAULT_THEME);
    applyThemeCSSVariables(DEFAULT_THEME);
    await supabaseDatabase.updateSiteSetting('site_theme', DEFAULT_THEME, userId);
  };

  const applyThemePreview = (tempTheme: SiteThemeSettings) => {
    applyThemeCSSVariables(normalizeTheme(tempTheme));
  };

  const restorePublishedTheme = () => {
    applyThemeCSSVariables(theme);
  };

  return (
    <VisualIdentityContext.Provider
      value={{
        settings,
        theme,
        loading,
        themeLoading,
        getEffectiveAsset,
        refreshSettings: loadSettings,
        updateSetting,
        updateAllSettings,
        updateTheme,
        resetThemeToDefault,
        applyThemePreview,
        restorePublishedTheme,
      }}
    >
      {children}
    </VisualIdentityContext.Provider>
  );
};

export const useVisualIdentity = () => useContext(VisualIdentityContext);


