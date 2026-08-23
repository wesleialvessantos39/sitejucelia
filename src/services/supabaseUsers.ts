// /src/services/supabaseUsers.ts
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { supabaseDatabase } from './supabaseDatabase';

export type UserProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Service de Gerenciamento de Usuários e Perfis (Supabase Auth & public.profiles)
 */
export const supabaseUsers = {
  /**
   * Obtém a lista completa de perfis na tabela public.profiles.
   */
  async getAllProfiles(): Promise<UserProfileRow[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar perfis de usuários:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Obtém os detalhes de um perfil individual pelo ID
   */
  async getProfileById(userId: string): Promise<UserProfileRow | null> {
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
   * Promove ou rebaixa o privilégio de um usuário (role: 'admin' | 'user').
   * O RLS e o Trigger de proteção no PostgreSQL garantem no banco de dados que
   * apenas Administradores Ativos conseguem alterar este campo.
   */
  async updateUserRole(
    targetUserId: string,
    newRole: 'admin' | 'user',
    performerId: string,
    performerEmail: string
  ): Promise<UserProfileRow> {
    // 1. Proteção contra auto-rebaixamento
    if (targetUserId === performerId && newRole === 'user') {
      throw new Error('Você não pode remover suas próprias permissões administrativas.');
    }

    // 2. Proteção do último administrador ativo
    if (newRole === 'user') {
      const allProfiles = await this.getAllProfiles();
      const activeAdmins = allProfiles.filter(
        (p) => p.role === 'admin' && p.active && p.status === 'active'
      );
      const isTargetActiveAdmin = activeAdmins.some((p) => p.id === targetUserId);

      if (isTargetActiveAdmin && activeAdmins.length <= 1) {
        throw new Error('Operação negada: O sistema deve manter no mínimo 1 Administrador ativo.');
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        updated_by: performerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar função do usuário:', error);
      throw error;
    }

    // Registra auditoria administrativa com ação padronizada
    const auditAction = newRole === 'admin' ? 'PROMOTE_USER_TO_ADMIN' : 'DEMOTE_ADMIN_TO_USER';
    await supabaseDatabase.logAdminAction({
      user_id: performerId,
      user_email: performerEmail,
      action: auditAction,
      entity_type: 'profiles',
      entity_id: targetUserId,
      details: {
        target_id: targetUserId,
        target_email: data.email,
        target_name: data.full_name,
        new_role: newRole,
        previous_role: newRole === 'admin' ? 'user' : 'admin',
      },
    });

    return data;
  },

  /**
   * Altera o status da conta do usuário (active: boolean, status: 'active' | 'suspended' | 'inactive').
   * Protegido no banco pelo RLS e Trigger public.protect_profile_fields.
   */
  async updateUserStatus(
    targetUserId: string,
    active: boolean,
    status: 'active' | 'suspended' | 'inactive',
    performerId: string,
    performerEmail: string
  ): Promise<UserProfileRow> {
    // 1. Proteção contra auto-suspensão
    if (targetUserId === performerId && (!active || status !== 'active')) {
      throw new Error('Você não pode suspender sua própria conta de administrador.');
    }

    // 2. Proteção do último administrador ativo contra suspensão
    if (!active || status === 'suspended') {
      const allProfiles = await this.getAllProfiles();
      const activeAdmins = allProfiles.filter(
        (p) => p.role === 'admin' && p.active && p.status === 'active'
      );
      const isTargetActiveAdmin = activeAdmins.some((p) => p.id === targetUserId);

      if (isTargetActiveAdmin && activeAdmins.length <= 1) {
        throw new Error('Não é possível suspender o último administrador ativo do sistema.');
      }
    }

    const { data: previousData } = await supabase
      .from('profiles')
      .select('status, active, email, full_name')
      .eq('id', targetUserId)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .update({
        active,
        status,
        updated_by: performerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alterar status do usuário:', error);
      throw error;
    }

    // Registra auditoria administrativa
    let auditAction = 'ACTIVATE_USER';
    if (!active || status === 'suspended') {
      auditAction = 'SUSPEND_USER';
    } else if (previousData && (previousData.status === 'suspended' || !previousData.active)) {
      auditAction = 'REACTIVATE_USER';
    }

    await supabaseDatabase.logAdminAction({
      user_id: performerId,
      user_email: performerEmail,
      action: auditAction,
      entity_type: 'profiles',
      entity_id: targetUserId,
      details: {
        target_id: targetUserId,
        target_email: data.email,
        target_name: data.full_name,
        active,
        status,
        previous_status: previousData?.status,
      },
    });

    return data;
  },

  /**
   * Permite que o próprio usuário edite seus dados pessoais seguros
   * (nome completo, telefone, CREA/CAU, avatar URL).
   */
  async updateOwnProfile(
    userId: string,
    safeUpdates: {
      full_name?: string | null;
      phone?: string | null;
      crea?: string | null;
      avatar_url?: string | null;
    }
  ): Promise<UserProfileRow> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil próprio:', error);
      throw error;
    }

    // Registra atualização de perfil no log de auditoria
    await supabaseDatabase.logAdminAction({
      user_id: userId,
      user_email: data.email,
      action: 'UPDATE_USER',
      entity_type: 'profiles',
      entity_id: userId,
      details: {
        updated_fields: Object.keys(safeUpdates),
        user_email: data.email,
      },
    });

    return data;
  },

  /**
   * Exclui o perfil de um usuário na tabela public.profiles (protegido por RLS para Administradores)
   * e registra a ação no log de auditoria.
   */
  async deleteUserProfile(
    targetUserId: string,
    performerId: string,
    performerEmail: string
  ): Promise<void> {
    // 1. Proteção contra auto-exclusão
    if (targetUserId === performerId) {
      throw new Error('Operação negada: Não é permitido excluir a própria conta de administrador.');
    }

    const { data: userToDelete } = await supabase
      .from('profiles')
      .select('email, full_name, role, active, status')
      .eq('id', targetUserId)
      .single();

    // 2. Proteção do último administrador ativo
    if (userToDelete?.role === 'admin' && userToDelete.active && userToDelete.status === 'active') {
      const allProfiles = await this.getAllProfiles();
      const activeAdmins = allProfiles.filter(
        (p) => p.role === 'admin' && p.active && p.status === 'active'
      );
      if (activeAdmins.length <= 1) {
        throw new Error('Não é possível excluir o último administrador ativo do sistema.');
      }
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', targetUserId);

    if (error) {
      console.error('Erro ao excluir perfil do usuário:', error);
      throw error;
    }

    // Registra auditoria administrativa
    const auditAction = userToDelete?.role === 'admin' ? 'DELETE_ADMIN' : 'DELETE_USER';
    await supabaseDatabase.logAdminAction({
      user_id: performerId,
      user_email: performerEmail,
      action: auditAction,
      entity_type: 'profiles',
      entity_id: targetUserId,
      details: {
        target_id: targetUserId,
        target_email: userToDelete?.email || 'desconhecido',
        target_name: userToDelete?.full_name || 'desconhecido',
        target_role: userToDelete?.role || 'user',
      },
    });
  },
};

