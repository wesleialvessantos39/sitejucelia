// /src/context/MediaDisplayContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseDatabase } from '../services/supabaseDatabase';
import {
  MediaDisplaySetting,
  MediaDisplaySettingsMap,
  DEFAULT_MEDIA_DISPLAY_SETTINGS,
  MediaContext,
} from '../types/mediaDisplay';

interface MediaDisplayContextType {
  settings: MediaDisplaySettingsMap;
  loading: boolean;
  getSettingForMedia: (mediaKey: string, context?: MediaContext) => MediaDisplaySetting;
  saveSetting: (
    mediaKey: string,
    setting: MediaDisplaySetting,
    userId?: string,
    userEmail?: string
  ) => Promise<void>;
  resetSetting: (
    mediaKey: string,
    userId?: string,
    userEmail?: string
  ) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const MediaDisplayContext = createContext<MediaDisplayContextType>({
  settings: {},
  loading: true,
  getSettingForMedia: () => ({
    id: 'default',
    media_type: 'image',
    context: 'general',
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: 'auto',
    object_position: '50% 50%',
  }),
  saveSetting: async () => {},
  resetSetting: async () => {},
  refreshSettings: async () => {},
});

export const MediaDisplayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<MediaDisplaySettingsMap>({});
  const [loading, setLoading] = useState<boolean>(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseDatabase.getMediaDisplaySettings();
      setSettings(data || {});
    } catch (err) {
      console.warn('[MediaDisplayContext] Erro ao carregar configurações de enquadramento:', err);
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const getSettingForMedia = useCallback(
    (mediaKey: string, context: MediaContext = 'general'): MediaDisplaySetting => {
      const custom = settings[mediaKey];
      const defaultForContext = DEFAULT_MEDIA_DISPLAY_SETTINGS[context] || DEFAULT_MEDIA_DISPLAY_SETTINGS.general;

      if (custom) {
        // Validação de sanidade e segurança para prevenir NaN ou números corrompidos
        const safePosX = typeof custom.position_x === 'number' && !isNaN(custom.position_x) ? Math.min(100, Math.max(0, custom.position_x)) : (defaultForContext.position_x ?? 50);
        const safePosY = typeof custom.position_y === 'number' && !isNaN(custom.position_y) ? Math.min(100, Math.max(0, custom.position_y)) : (defaultForContext.position_y ?? 50);
        const safeFocalX = typeof custom.focal_x === 'number' && !isNaN(custom.focal_x) ? Math.min(100, Math.max(0, custom.focal_x)) : (defaultForContext.focal_x ?? 50);
        const safeFocalY = typeof custom.focal_y === 'number' && !isNaN(custom.focal_y) ? Math.min(100, Math.max(0, custom.focal_y)) : (defaultForContext.focal_y ?? 50);
        const safeZoom = typeof custom.zoom === 'number' && !isNaN(custom.zoom) ? Math.min(3.0, Math.max(1.0, custom.zoom)) : (defaultForContext.zoom ?? 1.0);

        return {
          id: custom.id || mediaKey,
          media_type: custom.media_type || 'image',
          context: custom.context || context,
          object_fit: custom.object_fit || defaultForContext.object_fit || 'cover',
          position_x: safePosX,
          position_y: safePosY,
          focal_x: safeFocalX,
          focal_y: safeFocalY,
          zoom: safeZoom,
          aspect_ratio: custom.aspect_ratio || defaultForContext.aspect_ratio || 'auto',
          object_position: custom.object_position || `${safeFocalX}% ${safeFocalY}%`,
          updated_at: custom.updated_at,
          updated_by: custom.updated_by,
        };
      }

      return {
        id: mediaKey,
        media_type: 'image',
        context: context,
        object_fit: defaultForContext.object_fit,
        position_x: defaultForContext.position_x,
        position_y: defaultForContext.position_y,
        focal_x: defaultForContext.focal_x,
        focal_y: defaultForContext.focal_y,
        zoom: defaultForContext.zoom,
        aspect_ratio: defaultForContext.aspect_ratio,
        object_position: defaultForContext.object_position || `${defaultForContext.focal_x}% ${defaultForContext.focal_y}%`,
      };
    },
    [settings]
  );

  const saveSetting = useCallback(
    async (
      mediaKey: string,
      setting: MediaDisplaySetting,
      userId?: string,
      userEmail?: string
    ) => {
      // Sanitização prévia
      const sanitized: MediaDisplaySetting = {
        ...setting,
        id: mediaKey,
        position_x: Math.min(100, Math.max(0, Number(setting.position_x) || 50)),
        position_y: Math.min(100, Math.max(0, Number(setting.position_y) || 50)),
        focal_x: Math.min(100, Math.max(0, Number(setting.focal_x) || 50)),
        focal_y: Math.min(100, Math.max(0, Number(setting.focal_y) || 50)),
        zoom: Math.min(3.0, Math.max(1.0, Number(setting.zoom) || 1.0)),
        object_position: `${setting.focal_x}% ${setting.focal_y}%`,
      };

      const updated = await supabaseDatabase.saveMediaDisplaySetting(
        mediaKey,
        sanitized,
        userId,
        userEmail
      );
      setSettings(updated);
    },
    []
  );

  const resetSetting = useCallback(
    async (mediaKey: string, userId?: string, userEmail?: string) => {
      const updated = await supabaseDatabase.resetMediaDisplaySetting(mediaKey, userId, userEmail);
      setSettings(updated);
    },
    []
  );

  return (
    <MediaDisplayContext.Provider
      value={{
        settings,
        loading,
        getSettingForMedia,
        saveSetting,
        resetSetting,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </MediaDisplayContext.Provider>
  );
};

export const useMediaDisplay = () => useContext(MediaDisplayContext);
