// /src/context/ContactSettingsContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ContactSettings,
  DEFAULT_CONTACT_SETTINGS,
  normalizePhoneNumber,
  formatPhoneDisplay,
  getWhatsAppLink,
  getPhoneTelLink,
} from '../types/contactSettings';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { useAuth } from './AuthContext';

interface ContactSettingsContextType {
  settings: ContactSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<ContactSettings>) => Promise<boolean>;
  getWhatsAppHref: (customMessage?: string) => string;
  getPhoneHref: () => string;
  formattedPhone: string;
  formattedWhatsApp: string;
  refreshSettings: () => Promise<void>;
}

const ContactSettingsContext = createContext<ContactSettingsContextType | undefined>(undefined);

export const ContactSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await supabaseDatabase.getContactSettings();
      if (data) {
        const merged: ContactSettings = {
          ...DEFAULT_CONTACT_SETTINGS,
          ...data,
          phone_number: normalizePhoneNumber(data.phone_number || DEFAULT_CONTACT_SETTINGS.phone_number),
          whatsapp_number: normalizePhoneNumber(data.whatsapp_number || DEFAULT_CONTACT_SETTINGS.whatsapp_number),
          phone_display: data.phone_display || formatPhoneDisplay(data.phone_number || DEFAULT_CONTACT_SETTINGS.phone_number),
          whatsapp_display: data.whatsapp_display || formatPhoneDisplay(data.whatsapp_number || DEFAULT_CONTACT_SETTINGS.whatsapp_number),
        };
        setSettings(merged);
      } else {
        setSettings(DEFAULT_CONTACT_SETTINGS);
      }
    } catch (err) {
      console.warn('[ContactSettingsContext] Aviso ao carregar configurações de contato, utilizando padrão:', err);
      setSettings(DEFAULT_CONTACT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newValues: Partial<ContactSettings>): Promise<boolean> => {
    try {
      const phoneClean = newValues.phone_number ? normalizePhoneNumber(newValues.phone_number) : settings.phone_number;
      const waClean = newValues.whatsapp_number ? normalizePhoneNumber(newValues.whatsapp_number) : settings.whatsapp_number;

      const merged: ContactSettings = {
        ...settings,
        ...newValues,
        phone_number: phoneClean,
        whatsapp_number: waClean,
        phone_display: newValues.phone_display || formatPhoneDisplay(phoneClean),
        whatsapp_display: newValues.whatsapp_display || formatPhoneDisplay(waClean),
        updated_at: new Date().toISOString(),
      };

      await supabaseDatabase.saveContactSettings(merged, user?.id);
      setSettings(merged);
      return true;
    } catch (err) {
      console.error('[ContactSettingsContext] Erro ao atualizar configurações de contato:', err);
      return false;
    }
  };

  const getWhatsAppHref = (customMessage?: string): string => {
    return getWhatsAppLink(settings.whatsapp_number, customMessage);
  };

  const getPhoneHref = (): string => {
    return getPhoneTelLink(settings.phone_number);
  };

  return (
    <ContactSettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        getWhatsAppHref,
        getPhoneHref,
        formattedPhone: settings.phone_display || formatPhoneDisplay(settings.phone_number),
        formattedWhatsApp: settings.whatsapp_display || formatPhoneDisplay(settings.whatsapp_number),
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </ContactSettingsContext.Provider>
  );
};

export const useContactSettings = (): ContactSettingsContextType => {
  const context = useContext(ContactSettingsContext);
  if (!context) {
    throw new Error('useContactSettings deve ser utilizado dentro de um ContactSettingsProvider');
  }
  return context;
};
