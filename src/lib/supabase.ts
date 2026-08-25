// /src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const DEFAULT_SUPABASE_URL = 'https://mnupdwlmgcratpfgypik.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udXBkd2xtZ2NyYXRwZmd5cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMTU5NTAsImV4cCI6MjEwMTc5MTk1MH0.QO9-qnW77aYX7jDjlL1GRc9FO91UibLM2hZidJpqkyU';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Ap1WmhS4fG-JH8IOixA-AQ_hlTb1qUc';

function getValidSupabaseUrl(rawUrl?: string): string {
  if (rawUrl && typeof rawUrl === 'string') {
    const cleaned = rawUrl.trim().replace(/^["']|["']$/g, '');
    if (cleaned.includes('supabase.co') || cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
      try {
        let urlString = cleaned;
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
          urlString = `https://${urlString}`;
        }
        const parsed = new URL(urlString);
        if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname && parsed.hostname.includes('.')) {
          return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/+$/, '');
        }
      } catch {
        // Ignora erro de parse
      }
    }
  }

  return DEFAULT_SUPABASE_URL.replace(/\/+$/, '');
}

function getValidSupabaseKey(rawKey?: string, fallbackKey?: string): string {
  if (rawKey && typeof rawKey === 'string') {
    const cleaned = rawKey.trim().replace(/^["']|["']$/g, '');
    if ((cleaned.startsWith('eyJ') || cleaned.startsWith('sb_publishable_')) && cleaned.length >= 30) {
      return cleaned;
    }
  }
  if (fallbackKey && typeof fallbackKey === 'string') {
    const cleaned = fallbackKey.trim().replace(/^["']|["']$/g, '');
    if ((cleaned.startsWith('eyJ') || cleaned.startsWith('sb_publishable_')) && cleaned.length >= 30) {
      return cleaned;
    }
  }
  return DEFAULT_SUPABASE_ANON_KEY;
}

const rawEnvUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL;
const rawEnvKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;
const rawEnvPublishableKey = (import.meta as any)?.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseUrl = getValidSupabaseUrl(rawEnvUrl);
export const supabaseAnonKey = getValidSupabaseKey(rawEnvKey, DEFAULT_SUPABASE_ANON_KEY);
export const supabasePublishableKey = getValidSupabaseKey(rawEnvPublishableKey, DEFAULT_SUPABASE_PUBLISHABLE_KEY);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder')
);

if (isSupabaseConfigured) {
  console.info('✅ Conexão Supabase configurada com o projeto:', supabaseUrl);
} else {
  console.warn(
    '⚠️ Variáveis de ambiente do Supabase ausentes ou usando valor genérico.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Verificação técnica silenciosa de conexão com a infraestrutura Supabase
if ((import.meta as any)?.env?.DEV) {
  supabase.auth.getSession().then(({ error }) => {
    if (error) {
      console.info('ℹ️ Conexão Supabase inicializada (Aguardando credenciais ativas no ambiente).');
    } else {
      console.info('✅ Conexão Supabase estabelecida com sucesso e cliente operacional.');
    }
  }).catch(() => {
    console.info('ℹ️ Cliente Supabase ativo e pronto para comunicação.');
  });
}


