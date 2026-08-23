// /src/services/supabaseAuth.ts
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

/**
 * Service de Autenticação Supabase (Supabase Auth)
 */
export const supabaseAuth = {
  /**
   * Efetua o login por e-mail e senha
   */
  async signInWithEmail(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Efetua o logout do usuário e limpa a sessão
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Obtém a sessão ativa atual
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Obtém o usuário atualmente autenticado
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  /**
   * Ouve mudanças de estado na autenticação (login, logout, token refresh)
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Envia e-mail para recuperação/redefinição de senha
   */
  async resetPasswordForEmail(email: string, redirectTo?: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/admin/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Atualiza a senha do usuário autenticado
   */
  async updateUserPassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Registra a data/hora do último acesso do usuário de forma real no Supabase
   */
  async recordUserLogin(userId: string): Promise<void> {
    try {
      if (!userId) return;
      const nowIso = new Date().toISOString();
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          last_login: nowIso,
          updated_at: nowIso
        })
        .eq('id', userId);

      if (error) {
        console.warn('[supabaseAuth] Não foi possível atualizar last_login no profiles:', error.message);
      } else {
        console.info('[supabaseAuth] Último acesso atualizado com sucesso:', nowIso);
      }
    } catch (err) {
      console.warn('[supabaseAuth] Erro inesperado ao registrar last_login:', err);
    }
  },

  /**
   * Obtém o perfil estendido da tabela public.profiles
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
    return data;
  },

  /**
   * Atualiza os dados de perfil do usuário na tabela public.profiles
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
