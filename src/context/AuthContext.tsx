// /src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { supabaseAuth, UserProfile } from '../services/supabaseAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string, inviteCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Deriva o status de Administrador Ativo
  const isAdmin = Boolean(
    profile &&
    profile.role === 'admin' &&
    profile.active === true &&
    profile.status === 'active'
  );

  const fetchProfile = async (userId: string) => {
    try {
      const userProfile = await supabaseAuth.getProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      console.error('Erro ao buscar perfil public.profiles:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Obtém a sessão inicial
    const initSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao recuperar sessão inicial:', error.message);
        }
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            // Garante gravação do último acesso ao restaurar a sessão
            await supabaseAuth.recordUserLogin(initialSession.user.id);
            await fetchProfile(initialSession.user.id);
          }
        }
      } catch (err) {
        console.error('Erro na inicialização da sessão:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    // Inscreve no listener centralizado de mudanças do Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          if (event === 'SIGNED_IN') {
            // Atualiza last_login no Supabase de forma persistente
            await supabaseAuth.recordUserLogin(currentSession.user.id);
          }
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const data = await supabaseAuth.signInWithEmail(email, pass);
      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        // Grava de forma assíncrona o último acesso
        await supabaseAuth.recordUserLogin(data.user.id);
        await fetchProfile(data.user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, inviteCode?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            invite_code: inviteCode,
          },
        },
      });

      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        await fetchProfile(data.user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabaseAuth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await supabaseAuth.resetPasswordForEmail(email);
  };

  const updatePassword = async (newPassword: string) => {
    await supabaseAuth.updateUserPassword(newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        login,
        signUp,
        logout,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
