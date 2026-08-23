// /src/types/contactSettings.ts

export interface ContactSettings {
  phone_number: string;
  phone_display: string;
  whatsapp_number: string;
  whatsapp_display: string;
  country_code: string;
  whatsapp_enabled: boolean;
  phone_enabled: boolean;
  email: string;
  address_city: string;
  address_state: string;
  address_full: string;
  crea_registration: string;
  business_hours: string;
  updated_at: string;
}

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  phone_number: '5569992086883',
  phone_display: '(69) 99208-6883',
  whatsapp_number: '5569992086883',
  whatsapp_display: '(69) 99208-6883',
  country_code: '55',
  whatsapp_enabled: true,
  phone_enabled: true,
  email: 'jucelia.engcivil@gmail.com',
  address_city: 'Ariquemes',
  address_state: 'RO',
  address_full: 'Ariquemes - RO e Região Norte',
  crea_registration: 'CREA-RO 21676/D',
  business_hours: 'Segunda a Sexta, das 08h às 18h',
  updated_at: new Date().toISOString()
};

/**
 * Normaliza qualquer número de telefone/WhatsApp para o formato de discagem internacional (E.164 limpo)
 * Exemplo: "(69) 99208-6883" -> "5569992086883"
 */
export function normalizePhoneNumber(rawNumber: string, defaultCountryCode = '55'): string {
  if (!rawNumber) return '';
  const digits = rawNumber.replace(/\D/g, '');
  if (!digits) return '';

  // Se já começar com o código do país (ex: 5569992086883 com 12 ou 13 dígitos)
  if (digits.length >= 12 && digits.startsWith(defaultCountryCode)) {
    return digits;
  }

  // Se for número nacional com DDD (10 ou 11 dígitos: ex 69992086883)
  if (digits.length === 10 || digits.length === 11) {
    return `${defaultCountryCode}${digits}`;
  }

  return digits;
}

/**
 * Formata um número num padrão visual elegante para exibição
 * Exemplo: "5569992086883" ou "69992086883" -> "(69) 99208-6883"
 */
export function formatPhoneDisplay(rawNumber: string): string {
  if (!rawNumber) return '';
  let digits = rawNumber.replace(/\D/g, '');
  
  // Se começar com 55 e tiver 12 ou 13 dígitos, remove o 55 para formatar o DDD local
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.substring(2);
  }

  if (digits.length === 11) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.substring(0, 5)}-${digits.substring(5)}`;
  }
  if (digits.length === 8) {
    return `${digits.substring(0, 4)}-${digits.substring(4)}`;
  }

  return rawNumber;
}

/**
 * Gera a URL completa para abertura do WhatsApp oficial
 */
export function getWhatsAppLink(whatsappNumber: string, message?: string): string {
  const normalized = normalizePhoneNumber(whatsappNumber);
  if (!normalized) return '#';
  const encodedText = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${normalized}${encodedText ? `?text=${encodedText}` : ''}`;
}

/**
 * Gera o link tel: seguro para discagem telefônica
 */
export function getPhoneTelLink(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized) return '#';
  return `tel:+${normalized}`;
}
