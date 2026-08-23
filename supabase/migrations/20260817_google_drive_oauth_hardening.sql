-- ==============================================================================
-- MIGRATION: 20260817_google_drive_oauth_hardening.sql
-- PROJETO: Engª Jucélia Santana (Ref Supabase: mnupdwlmgcratpfgypik)
-- DESCRIÇÃO: Infraestrutura server-side hardened para Google Drive OAuth 2.0:
--            1. Hardening do search_path em public.is_admin() (Security Advisor)
--            2. Tabela public.google_oauth_states (CSRF & Replay Protection)
--            3. RPC public.consume_google_oauth_state (Consumo Atômico de State)
--            4. Tabela public.google_drive_connections (Armazenamento Seguro de Tokens)
--            5. RPC public.switch_active_google_drive_connection (Troca Atômica de Conexão)
--            6. Hardening de RLS em public.site_settings (Proteção de backup_settings)
--            7. Bloqueio total de acesso direto às tabelas e RPCs por anon/authenticated
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. HARDENING DE SEGURANÇA: PUBLIC.IS_ADMIN()
-- ------------------------------------------------------------------------------
-- Fixa search_path = '' para corrigir o alerta function_search_path_mutable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE pg_namespace.nspname = 'public'
          AND pg_proc.proname = 'is_admin'
    ) THEN
        ALTER FUNCTION public.is_admin() SET search_path = '';
    END IF;
END;
$$;


-- ------------------------------------------------------------------------------
-- 1. TABELA TEMPORÁRIA: GOOGLE_OAUTH_STATES (CSRF & REPLAY PROTECTION)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_hash TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    origin TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

-- Índice para expiração de states (índice em state_hash já é criado pelo UNIQUE)
CREATE INDEX IF NOT EXISTS idx_google_oauth_states_expires ON public.google_oauth_states(expires_at);

-- RLS ativado: nenhum acesso direto permitido para anon ou authenticated
ALTER TABLE public.google_oauth_states ENABLE ROW LEVEL SECURITY;

-- Revoga explicitamente privilégios de acesso direto para anon e authenticated
REVOKE ALL ON TABLE public.google_oauth_states FROM PUBLIC;
REVOKE ALL ON TABLE public.google_oauth_states FROM anon;
REVOKE ALL ON TABLE public.google_oauth_states FROM authenticated;
GRANT ALL ON TABLE public.google_oauth_states TO service_role;


-- ------------------------------------------------------------------------------
-- 2. FUNÇÃO RPC: CONSUMO ATÔMICO DO STATE OAUTH
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_google_oauth_state(p_state_hash TEXT)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    origin TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.google_oauth_states
    SET used_at = now()
    WHERE google_oauth_states.state_hash = p_state_hash
      AND google_oauth_states.used_at IS NULL
      AND google_oauth_states.expires_at > now()
    RETURNING google_oauth_states.user_id, google_oauth_states.user_email, google_oauth_states.origin;
END;
$$;

-- Permissões estritas: exclusividade para service_role (Edge Function server-side)
REVOKE ALL ON FUNCTION public.consume_google_oauth_state(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_google_oauth_state(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.consume_google_oauth_state(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_google_oauth_state(TEXT) TO service_role;


-- ------------------------------------------------------------------------------
-- 3. TABELA: GOOGLE_DRIVE_CONNECTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_drive_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'google_drive' CHECK (provider = 'google_drive'),
    connected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    connected_by_email TEXT,
    account_email TEXT NOT NULL,
    drive_folder_id TEXT NOT NULL,
    drive_folder_name TEXT NOT NULL DEFAULT 'Jucélia Santana Engenharia Civil — Backups',
    is_active BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'reconnect_required', 'error')),
    refresh_token_encrypted TEXT,
    error_message TEXT,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_active_token_presence CHECK (
        is_active = false OR (
            refresh_token_encrypted IS NOT NULL
            AND length(trim(refresh_token_encrypted)) > 0
        )
    )
);

-- Constraint de Integridade: Apenas UMA conexão ativa oficial do Google Drive
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_google_drive_connection
ON public.google_drive_connections (provider)
WHERE (is_active = true AND provider = 'google_drive');

CREATE INDEX IF NOT EXISTS idx_google_drive_connections_active ON public.google_drive_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_google_drive_connections_status ON public.google_drive_connections(status);

-- RLS ativado: nenhum acesso direto permitido para anon ou authenticated
ALTER TABLE public.google_drive_connections ENABLE ROW LEVEL SECURITY;

-- Revoga explicitamente privilégios de acesso direto para anon e authenticated
REVOKE ALL ON TABLE public.google_drive_connections FROM PUBLIC;
REVOKE ALL ON TABLE public.google_drive_connections FROM anon;
REVOKE ALL ON TABLE public.google_drive_connections FROM authenticated;
GRANT ALL ON TABLE public.google_drive_connections TO service_role;


-- ------------------------------------------------------------------------------
-- 4. FUNÇÃO RPC: TROCA ATÔMICA DA CONEXÃO ATIVA DO GOOGLE DRIVE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.switch_active_google_drive_connection(
    p_connected_by UUID,
    p_connected_by_email TEXT,
    p_account_email TEXT,
    p_drive_folder_id TEXT,
    p_drive_folder_name TEXT,
    p_refresh_token_encrypted TEXT
)
RETURNS public.google_drive_connections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_new_connection public.google_drive_connections;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- 1. Validações estritas de parâmetros antes de alterar o estado do banco
    IF p_account_email IS NULL OR length(trim(p_account_email)) = 0 THEN
        RAISE EXCEPTION 'p_account_email é obrigatório e não pode ser vazio.';
    END IF;

    IF p_drive_folder_id IS NULL OR length(trim(p_drive_folder_id)) = 0 THEN
        RAISE EXCEPTION 'p_drive_folder_id é obrigatório e não pode ser vazio.';
    END IF;

    IF p_refresh_token_encrypted IS NULL OR length(trim(p_refresh_token_encrypted)) = 0 THEN
        RAISE EXCEPTION 'p_refresh_token_encrypted é obrigatório e não pode ser vazio.';
    END IF;

    IF NOT (p_refresh_token_encrypted LIKE 'enc:v1:%') THEN
        RAISE EXCEPTION 'p_refresh_token_encrypted deve possuir formato criptografado AES-GCM válido (enc:v1:...).';
    END IF;

    -- 2. Desativa conexões anteriores ativas e limpa seus tokens em uma só etapa
    UPDATE public.google_drive_connections
    SET is_active = false,
        status = 'disconnected',
        refresh_token_encrypted = NULL,
        updated_at = v_now
    WHERE provider = 'google_drive'
      AND is_active = true;

    -- 3. Insere a nova conexão atômica como ativa
    INSERT INTO public.google_drive_connections (
        provider,
        connected_by,
        connected_by_email,
        account_email,
        drive_folder_id,
        drive_folder_name,
        is_active,
        status,
        refresh_token_encrypted,
        connected_at,
        last_verified_at,
        created_at,
        updated_at
    )
    VALUES (
        'google_drive',
        p_connected_by,
        p_connected_by_email,
        trim(p_account_email),
        trim(p_drive_folder_id),
        COALESCE(NULLIF(trim(p_drive_folder_name), ''), 'Jucélia Santana Engenharia Civil — Backups'),
        true,
        'connected',
        p_refresh_token_encrypted,
        v_now,
        v_now,
        v_now,
        v_now
    )
    RETURNING * INTO v_new_connection;

    -- 4. Sincroniza metadados administrativos não-sensíveis em site_settings
    INSERT INTO public.site_settings (key, value, updated_at, updated_by)
    VALUES (
        'backup_settings',
        jsonb_build_object(
            'enabled', true,
            'provider', 'google_drive',
            'google_drive_connected', true,
            'google_drive_status', 'connected',
            'google_drive_folder_name', v_new_connection.drive_folder_name,
            'google_drive_connected_at', v_now,
            'google_drive_last_verified_at', v_now
        ),
        v_now,
        p_connected_by
    )
    ON CONFLICT (key) DO UPDATE SET
        value = (
            COALESCE(public.site_settings.value, '{}'::jsonb) ||
            jsonb_build_object(
                'enabled', true,
                'provider', 'google_drive',
                'google_drive_connected', true,
                'google_drive_status', 'connected',
                'google_drive_folder_name', v_new_connection.drive_folder_name,
                'google_drive_connected_at', v_now,
                'google_drive_last_verified_at', v_now
            ) - 'google_drive_error'
        ),
        updated_at = v_now,
        updated_by = p_connected_by;

    RETURN v_new_connection;
END;
$$;

-- Permissões estritas: exclusividade para service_role (Edge Function server-side)
REVOKE ALL ON FUNCTION public.switch_active_google_drive_connection(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.switch_active_google_drive_connection(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.switch_active_google_drive_connection(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.switch_active_google_drive_connection(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;


-- ------------------------------------------------------------------------------
-- 5. HARDENING DE RLS NA TABELA SITE_SETTINGS (PROTEÇÃO CONTRA VAZAMENTO PÚBLICO)
-- ------------------------------------------------------------------------------
-- Configurações públicas (ex: banner, contato, redes) permanecem visíveis a todos.
-- A chave 'backup_settings' é explicitamente ocultada de leituras públicas.
DROP POLICY IF EXISTS "Configurações públicas visíveis a todos" ON public.site_settings;
CREATE POLICY "Configurações públicas visíveis a todos"
    ON public.site_settings FOR SELECT
    TO public
    USING (
        key NOT IN ('backup_settings')
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Apenas Administradores alteram configurações" ON public.site_settings;
DROP POLICY IF EXISTS "Apenas Administradores gerenciam configurações" ON public.site_settings;
CREATE POLICY "Apenas Administradores gerenciam configurações"
    ON public.site_settings FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
