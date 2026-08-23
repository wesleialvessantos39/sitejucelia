-- ==============================================================================
-- INFRAESTRUTURA COMPLETA SUPABASE HARDENED - PROJETO ENGª JUCÉLIA SANTANA
-- ==============================================================================
-- FASE 2.1: REVISÃO TÉCNICA, AUDITORIA, HARDENING E VALIDAÇÃO DA INFRAESTRUTURA
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELAS NORMALIZADAS COM AUDITORIA E RESTRIÇÕES
-- ==============================================================================

-- 2.1 TABELA: PROFILES (Perfis de Usuários e Administradores)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    phone TEXT,
    crea TEXT DEFAULT 'CREA-RO 22430D',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 TABELA: PROJECTS (Obras e Projetos de Engenharia)
-- Decisão arquitetural para `services_executed`:
-- Mantido como TEXT[] nativo do PostgreSQL por oferecer alta performance em leituras,
-- simplificar payload do frontend, reduzir overhead de JOINs e permitir queries com o operador @>.
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    video_url TEXT,
    video_title TEXT,
    location TEXT NOT NULL,
    year TEXT,
    area TEXT,
    status TEXT NOT NULL DEFAULT 'Concluído',
    services_executed TEXT[] DEFAULT '{}',
    has_video BOOLEAN NOT NULL DEFAULT false,
    featured BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 TABELA: PROJECT_IMAGES (Galeria de Fotos dos Projetos)
CREATE TABLE IF NOT EXISTS public.project_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 TABELA: BLOG_POSTS (Laudos Periciais e Artigos Técnicos)
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Laudos & Perícias',
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_url TEXT,
    author TEXT NOT NULL DEFAULT 'Engª Jucélia Santana',
    published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 TABELA: SITE_SETTINGS (Configurações Globais do Site)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.6 TABELA: CONTACT_MESSAGES (Mensagens e Solicitações de Orçamento)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    origin TEXT NOT NULL DEFAULT 'website_form',
    notes TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 TABELA: SITE_DOMAINS (Gerenciamento de Domínios do Site - Etapa 18)
CREATE TABLE IF NOT EXISTS public.site_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    normalized_domain TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL DEFAULT 'Domínio Principal',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    ssl_status TEXT DEFAULT 'active' CHECK (ssl_status IN ('active', 'pending', 'needs_verification', 'inactive')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8 TABELA: ADMIN_AUDIT_LOGS (Registro de Auditoria de Ações Administrativas)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.9 TABELA: SITE_VISIT_STATS (Estatísticas Agregadas de Visualizações do Site - Etapa 19)
CREATE TABLE IF NOT EXISTS public.site_visit_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    page_path TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 1 CHECK (views > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_site_visit_stats_date_path UNIQUE (visit_date, page_path)
);

-- ==============================================================================
-- 3. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_order ON public.projects(order_index ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON public.project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_order ON public.project_images(order_index ASC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_deleted_at ON public.blog_posts(deleted_at);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_domains_normalized ON public.site_domains(normalized_domain);
CREATE INDEX IF NOT EXISTS idx_site_domains_is_primary ON public.site_domains(is_primary);
CREATE INDEX IF NOT EXISTS idx_site_domains_is_active ON public.site_domains(is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Índices de Alta Performance para Estatísticas de Visualização (Etapa 19)
CREATE INDEX IF NOT EXISTS idx_site_visit_stats_date ON public.site_visit_stats(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_visit_stats_path ON public.site_visit_stats(page_path);
CREATE INDEX IF NOT EXISTS idx_site_visit_stats_date_path ON public.site_visit_stats(visit_date, page_path);

-- ==============================================================================
-- 4. FUNÇÕES DE SEGURANÇA E TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- Função auxiliar para verificar se o usuário é Administrador Ativo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
          AND active = true
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de atualização automática de updated_at
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trigger_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trigger_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_site_domains_updated_at ON public.site_domains;
CREATE TRIGGER trigger_site_domains_updated_at
    BEFORE UPDATE ON public.site_domains
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_site_visit_stats_updated_at ON public.site_visit_stats;
CREATE TRIGGER trigger_site_visit_stats_updated_at
    BEFORE UPDATE ON public.site_visit_stats
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função Segura para Incremento Atômico de Visualizações de Página (Etapas 19.1 e 19.5)
-- Validação estrita, proteção contra rotas inválidas/abusivas, agregação atômica (+1) e timezone consistente
CREATE OR REPLACE FUNCTION public.increment_page_view(
    p_page_path TEXT,
    p_visit_date DATE DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw_path TEXT;
    v_normalized_path TEXT;
    v_date DATE;
    v_views INTEGER;
    v_server_today DATE;
BEGIN
    -- 1. Validação prévia de entrada
    IF p_page_path IS NULL THEN
        RETURN 0;
    END IF;

    v_raw_path := TRIM(p_page_path);
    
    -- Rejeita strings vazias, valores nulos em texto e identificadores claramente inválidos
    IF v_raw_path = '' 
       OR v_raw_path = 'null' 
       OR v_raw_path = 'undefined' 
       OR v_raw_path = '[object Object]' 
       OR LENGTH(v_raw_path) > 255 THEN
        RETURN 0;
    END IF;

    -- 2. Normalização e sanitização da rota
    v_normalized_path := v_raw_path;
    
    -- Garante que comece com barra
    IF v_normalized_path NOT LIKE '/%' THEN
        v_normalized_path := '/' || v_normalized_path;
    END IF;
    
    -- Remove query strings ('?') e âncoras ('#')
    v_normalized_path := SPLIT_PART(v_normalized_path, '?', 1);
    v_normalized_path := SPLIT_PART(v_normalized_path, '#', 1);
    
    -- Remove barras duplicadas consecutivas
    v_normalized_path := REGEXP_REPLACE(v_normalized_path, '/+', '/', 'g');
    
    -- Converte para minúsculas e remove espaços residuais
    v_normalized_path := LOWER(TRIM(v_normalized_path));

    -- Remove barra final se não for a raiz
    IF LENGTH(v_normalized_path) > 1 AND v_normalized_path LIKE '%/' THEN
        v_normalized_path := RTRIM(v_normalized_path, '/');
    END IF;
    
    -- Re-valida tamanho após normalização (máx 255 caracteres) e conteúdo não-vazio
    IF LENGTH(v_normalized_path) = 0 OR LENGTH(v_normalized_path) > 255 THEN
        RETURN 0;
    END IF;

    -- Rejeita rotas administrativas, de autenticação e rotas técnicas internas
    IF v_normalized_path = '/admin' 
       OR v_normalized_path LIKE '/admin/%' 
       OR v_normalized_path = '/login' 
       OR v_normalized_path LIKE '/login/%' 
       OR v_normalized_path LIKE '/api/%' THEN
        RETURN 0;
    END IF;

    -- 3. Referência temporal consistente (fuso horário local Brasil / Server Date)
    v_server_today := timezone('America/Sao_Paulo'::text, now())::date;
    IF v_server_today IS NULL THEN
        v_server_today := CURRENT_DATE;
    END IF;

    -- Se o cliente passar uma data válida razoável, utiliza-a; caso contrário, adota a data real do servidor
    IF p_visit_date IS NOT NULL 
       AND p_visit_date >= DATE '2020-01-01' 
       AND p_visit_date <= (v_server_today + INTERVAL '1 day')::date THEN
        v_date := p_visit_date;
    ELSE
        v_date := v_server_today;
    END IF;

    -- 4. Upsert atômico estritamente positivo (+1 incremento controlado)
    INSERT INTO public.site_visit_stats (visit_date, page_path, views, created_at, updated_at)
    VALUES (v_date, v_normalized_path, 1, timezone('utc'::text, now()), timezone('utc'::text, now()))
    ON CONFLICT (visit_date, page_path)
    DO UPDATE SET
        views = GREATEST(public.site_visit_stats.views + 1, 1),
        updated_at = timezone('utc'::text, now())
    RETURNING views INTO v_views;

    RETURN COALESCE(v_views, 1);
END;
$$;

-- Função para sincronizar automaticamente novos usuários no Supabase Auth com public.profiles
-- SEGURANÇA: Todo novo cadastro público é forçado para role = 'user', active = true, status = 'active'
-- ignorando qualquer valor enviado pelo cliente em raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status, active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
        NEW.raw_user_meta_data->>'avatar_url',
        'user', -- FORÇADO 'user' para prevenir escalada de privilégio pública
        'active',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de proteção rígida de campos privilegiados de profiles durante UPDATE
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Se quem está atualizando NÃO é Administrador Ativo, bloqueia qualquer tentativa de alteração de campos sensíveis
    IF NOT public.is_admin() THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Acesso Negado: Usuários comuns não possuem permissão para alterar a função (role).';
        END IF;
        IF NEW.active IS DISTINCT FROM OLD.active THEN
            RAISE EXCEPTION 'Acesso Negado: Usuários comuns não possuem permissão para alterar o estado de ativação (active).';
        END IF;
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Acesso Negado: Usuários comuns não possuem permissão para alterar o status da conta.';
        END IF;
        IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
            RAISE EXCEPTION 'Acesso Negado: Usuários comuns não podem alterar o campo created_by.';
        END IF;
        IF NEW.updated_by IS DISTINCT FROM OLD.updated_by THEN
            RAISE EXCEPTION 'Acesso Negado: Usuários comuns não podem alterar o campo updated_by.';
        END IF;
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'Acesso Negado: O identificador de perfil (id) é imutável.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de proteção acionado antes de qualquer UPDATE na tabela profiles
DROP TRIGGER IF EXISTS trigger_protect_profile_fields ON public.profiles;
CREATE TRIGGER trigger_protect_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- Trigger ativado na criação de usuários no auth.users
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY POLICIES (RLS RIGOROSO)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visit_stats ENABLE ROW LEVEL SECURITY;

-- POLICIES: PROFILES
DROP POLICY IF EXISTS "Perfis visíveis para autenticados" ON public.profiles;
CREATE POLICY "Perfis visíveis para autenticados"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuário altera próprio perfil ou Admin" ON public.profiles;
CREATE POLICY "Usuário altera próprio perfil ou Admin"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- POLICIES: PROJECTS
DROP POLICY IF EXISTS "Projetos ativos visíveis ao público" ON public.projects;
CREATE POLICY "Projetos ativos visíveis ao público"
    ON public.projects FOR SELECT
    TO public
    USING (deleted_at IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Apenas Administradores modificam projetos" ON public.projects;
CREATE POLICY "Apenas Administradores modificam projetos"
    ON public.projects FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- POLICIES: PROJECT_IMAGES
DROP POLICY IF EXISTS "Imagens de projetos visíveis publicamente" ON public.project_images;
CREATE POLICY "Imagens de projetos visíveis publicamente"
    ON public.project_images FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Apenas Administradores alteram imagens de projetos" ON public.project_images;
CREATE POLICY "Apenas Administradores alteram imagens de projetos"
    ON public.project_images FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- POLICIES: BLOG_POSTS
DROP POLICY IF EXISTS "Artigos publicados visíveis ao público" ON public.blog_posts;
CREATE POLICY "Artigos publicados visíveis ao público"
    ON public.blog_posts FOR SELECT
    TO public
    USING ((published = true AND deleted_at IS NULL) OR public.is_admin());

DROP POLICY IF EXISTS "Apenas Administradores gerenciam artigos" ON public.blog_posts;
CREATE POLICY "Apenas Administradores gerenciam artigos"
    ON public.blog_posts FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- POLICIES: SITE_SETTINGS
-- Configurações públicas (ex: banner, contato, redes) permanecem visíveis ao público.
-- Chaves administrativas e sensíveis (ex: backup_settings) são restritas a Administradores Ativos.
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

-- POLICIES: CONTACT_MESSAGES
DROP POLICY IF EXISTS "Visitantes enviam mensagens de contato" ON public.contact_messages;
CREATE POLICY "Visitantes enviam mensagens de contato"
    ON public.contact_messages FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Apenas Administradores leem mensagens de contato" ON public.contact_messages;
CREATE POLICY "Apenas Administradores leem mensagens de contato"
    ON public.contact_messages FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Apenas Administradores atualizam mensagens de contato" ON public.contact_messages;
CREATE POLICY "Apenas Administradores atualizam mensagens de contato"
    ON public.contact_messages FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- POLICIES: SITE_DOMAINS (Etapa 18)
DROP POLICY IF EXISTS "Domínios visíveis para o público e autenticados" ON public.site_domains;
CREATE POLICY "Domínios visíveis para o público e autenticados"
    ON public.site_domains FOR SELECT
    TO public
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Apenas Administradores gerenciam domínios" ON public.site_domains;
CREATE POLICY "Apenas Administradores gerenciam domínios"
    ON public.site_domains FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- POLICIES: ADMIN_AUDIT_LOGS
DROP POLICY IF EXISTS "Apenas Administradores visualizam logs de auditoria" ON public.admin_audit_logs;
CREATE POLICY "Apenas Administradores visualizam logs de auditoria"
    ON public.admin_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Administradores ou sistema registram logs" ON public.admin_audit_logs;
CREATE POLICY "Administradores ou sistema registram logs"
    ON public.admin_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- POLICIES: SITE_VISIT_STATS (Etapa 19 - Estatísticas Agregadas de Visualizações)
DROP POLICY IF EXISTS "Apenas Administradores visualizam estatísticas do site" ON public.site_visit_stats;
CREATE POLICY "Apenas Administradores visualizam estatísticas do site"
    ON public.site_visit_stats FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Apenas Administradores gerenciam estatísticas do site" ON public.site_visit_stats;
CREATE POLICY "Apenas Administradores gerenciam estatísticas do site"
    ON public.site_visit_stats FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Permissão de execução da RPC increment_page_view para visitantes (anon) e autenticados
GRANT EXECUTE ON FUNCTION public.increment_page_view(TEXT, DATE) TO anon, authenticated;

-- Função Segura para Exclusão e Limpeza Administrativa de Estatísticas (Etapa 19.4)
-- Valida permissão de Administrador Ativo, remove registros no intervalo e registra na auditoria
CREATE OR REPLACE FUNCTION public.delete_site_visit_stats_by_period(
    p_start_date DATE,
    p_end_date DATE,
    p_page_path TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_records_deleted INTEGER := 0;
    v_views_deleted INTEGER := 0;
    v_user_id UUID := auth.uid();
    v_user_email TEXT := 'admin';
    v_normalized_path TEXT := NULL;
BEGIN
    -- 1. Validação de Segurança: Apenas Administrador Ativo
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas administradores ativos podem excluir estatísticas de visualização.';
    END IF;

    -- 2. Validação de Parâmetros
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Data inicial e data final são obrigatórias para exclusão.';
    END IF;

    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'A data inicial (%) não pode ser posterior à data final (%).', p_start_date, p_end_date;
    END IF;

    -- Normaliza caminho de página se fornecido
    IF p_page_path IS NOT NULL AND TRIM(p_page_path) <> '' THEN
        v_normalized_path := LOWER(TRIM(p_page_path));
    END IF;

    -- 3. Contabilização prévia exata dos dados a serem removidos
    IF v_normalized_path IS NOT NULL THEN
        SELECT COALESCE(SUM(views), 0), COUNT(*)
        INTO v_views_deleted, v_records_deleted
        FROM public.site_visit_stats
        WHERE visit_date >= p_start_date
          AND visit_date <= p_end_date
          AND page_path = v_normalized_path;

        -- Exclusão real no banco de dados
        DELETE FROM public.site_visit_stats
        WHERE visit_date >= p_start_date
          AND visit_date <= p_end_date
          AND page_path = v_normalized_path;
    ELSE
        SELECT COALESCE(SUM(views), 0), COUNT(*)
        INTO v_views_deleted, v_records_deleted
        FROM public.site_visit_stats
        WHERE visit_date >= p_start_date
          AND visit_date <= p_end_date;

        -- Exclusão real no banco de dados
        DELETE FROM public.site_visit_stats
        WHERE visit_date >= p_start_date
          AND visit_date <= p_end_date;
    END IF;

    -- 4. Identificação do administrador para auditoria
    IF v_user_id IS NOT NULL THEN
        SELECT email INTO v_user_email FROM public.profiles WHERE id = v_user_id;
    END IF;

    -- 5. Registro na trilha de auditoria administrativa (admin_audit_logs)
    INSERT INTO public.admin_audit_logs (
        user_id,
        user_email,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_user_id,
        v_user_email,
        'DELETE_SITE_VISIT_STATS',
        'site_visit_stats',
        p_start_date::text || '_' || p_end_date::text,
        jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date,
            'page_path', v_normalized_path,
            'records_deleted', v_records_deleted,
            'views_deleted', v_views_deleted,
            'executed_at', timezone('utc'::text, now())
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'records_deleted', v_records_deleted,
        'views_deleted', v_views_deleted,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'page_path', v_normalized_path
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissão de execução da RPC para usuários autenticados (a função valida internamente se é admin)
GRANT EXECUTE ON FUNCTION public.delete_site_visit_stats_by_period(DATE, DATE, TEXT) TO authenticated;

-- Função Administrativa para Verificação e Diagnóstico de Integridade das Estatísticas (Etapa 19.5)
-- Inspeciona inconsistências (rotas vazias, caracteres ilegais, views <= 0 ou datas nulas)
CREATE OR REPLACE FUNCTION public.check_site_visit_stats_integrity()
RETURNS JSONB AS $$
DECLARE
    v_total_records INTEGER := 0;
    v_invalid_count INTEGER := 0;
    v_anomalies JSONB := '[]'::jsonb;
BEGIN
    -- Validação de Segurança: Apenas Administrador Ativo
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas administradores ativos podem auditar a integridade das estatísticas.';
    END IF;

    -- Total de registros na tabela
    SELECT COUNT(*) INTO v_total_records FROM public.site_visit_stats;

    -- Seleciona anomalias caso existam
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'visit_date', visit_date,
                'page_path', page_path,
                'views', views,
                'reason', CASE
                    WHEN page_path IS NULL OR TRIM(page_path) = '' THEN 'Caminho de página vazio ou nulo'
                    WHEN LENGTH(page_path) > 255 THEN 'Caminho excede 255 caracteres'
                    WHEN views <= 0 THEN 'Contagem de visualizações menor ou igual a zero'
                    WHEN visit_date IS NULL THEN 'Data de visita nula'
                    WHEN page_path NOT LIKE '/%' THEN 'Caminho sem barra inicial'
                    ELSE 'Formato fora do padrão'
                END
            )
        ), '[]'::jsonb
    )
    INTO v_anomalies
    FROM public.site_visit_stats
    WHERE page_path IS NULL 
       OR TRIM(page_path) = '' 
       OR LENGTH(page_path) > 255 
       OR views <= 0 
       OR visit_date IS NULL
       OR page_path NOT LIKE '/%';

    v_invalid_count := jsonb_array_length(v_anomalies);

    RETURN jsonb_build_object(
        'isHealthy', (v_invalid_count = 0),
        'totalRecordsChecked', v_total_records,
        'invalidRecordsCount', v_invalid_count,
        'anomalies', v_anomalies,
        'checkedAt', timezone('utc'::text, now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_site_visit_stats_integrity() TO authenticated;


-- ==============================================================================
-- 6. STORAGE BUCKETS E POLÍTICAS DE ACESSO
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    ('hero-images', 'hero-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('project-images', 'project-images', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('project-videos', 'project-videos', true, 52428800, ARRAY['video/mp4', 'video/webm']),
    ('blog-images', 'blog-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('documents', 'documents', true, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy de Leitura Pública para Buckets de Mídia
DROP POLICY IF EXISTS "Mídias públicas visíveis para todos" ON storage.objects;
CREATE POLICY "Mídias públicas visíveis para todos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id IN ('profile-images', 'hero-images', 'project-images', 'project-videos', 'blog-images', 'documents'));

-- Policy de Upload e Gerenciamento para Usuários Administradores Autenticados
DROP POLICY IF EXISTS "Apenas Administradores gerenciam arquivos no storage" ON storage.objects;
CREATE POLICY "Apenas Administradores gerenciam arquivos no storage"
    ON storage.objects FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ==============================================================================
-- 7. ETAPA 20.1 — INFRAESTRUTURA DE BACKUP E RESTAURAÇÃO (SISTEMA DE BACKUP)
-- ==============================================================================

-- Tabela Central de Controle e Metadados de Backups
CREATE TABLE IF NOT EXISTS public.system_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    backup_name TEXT NOT NULL,
    backup_type TEXT NOT NULL DEFAULT 'manual' CHECK (backup_type IN ('manual', 'scheduled')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'restoring', 'restored')),
    file_id TEXT,
    file_name TEXT,
    file_size BIGINT,
    storage_provider TEXT NOT NULL DEFAULT 'google_drive' CHECK (storage_provider IN ('google_drive', 'local_export')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    idempotency_key TEXT
);

-- Índices de Alta Performance para Listagem e Consultas no Painel Administrativo
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON public.system_backups (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_by ON public.system_backups (created_by);
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON public.system_backups (status);
CREATE INDEX IF NOT EXISTS idx_system_backups_idempotency ON public.system_backups (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Habilitação de Segurança por Linha (Row Level Security - RLS)
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- Regras de RLS: Apenas Administradores Autenticados Ativos
DROP POLICY IF EXISTS "Administradores podem consultar backups" ON public.system_backups;
CREATE POLICY "Administradores podem consultar backups"
    ON public.system_backups FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Administradores podem criar backups" ON public.system_backups;
CREATE POLICY "Administradores podem criar backups"
    ON public.system_backups FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Administradores podem atualizar backups" ON public.system_backups;
CREATE POLICY "Administradores podem atualizar backups"
    ON public.system_backups FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Administradores podem excluir registros de backups" ON public.system_backups;
CREATE POLICY "Administradores podem excluir registros de backups"
    ON public.system_backups FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Semente da Configuração Padrão 'backup_settings' na Tabela site_settings
INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
    'backup_settings',
    '{
        "enabled": true,
        "provider": "google_drive",
        "retention_days": 30,
        "scheduled_enabled": false,
        "schedule_time": "03:00",
        "last_backup_at": null,
        "next_backup_at": null,
        "google_drive_connected": false,
        "google_drive_folder_id": null,
        "google_drive_folder_name": "Jucélia Santana Engenharia Civil — Backups"
    }'::jsonb,
    timezone('utc'::text, now())
)
ON CONFLICT (key) DO NOTHING;


-- ==============================================================================
-- 8. ETAPA 20.2 — ESTRUTURA DE CONEXÃO SEGURA DO GOOGLE DRIVE (OAUTH + SUPABASE)
-- ==============================================================================

-- Tabela Central de Conexões Oficiais com o Google Drive
CREATE TABLE IF NOT EXISTS public.google_drive_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'google_drive',
    connected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    connected_by_email TEXT,
    account_email TEXT NOT NULL,
    drive_folder_id TEXT NOT NULL,
    drive_folder_name TEXT NOT NULL DEFAULT 'Jucélia Santana Engenharia Civil — Backups',
    is_active BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected', 'reconnect_required', 'error')),
    refresh_token_encrypted TEXT NOT NULL, -- Criptografia AES-GCM obrigatória
    error_message TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    connected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Constraint de Integridade: Apenas 1 Conexão Ativa Oficial por Provedor no Site
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_google_drive_connection
ON public.google_drive_connections (provider)
WHERE (is_active = true AND provider = 'google_drive');

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_google_drive_connections_active ON public.google_drive_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_google_drive_connections_connected_by ON public.google_drive_connections(connected_by);
CREATE INDEX IF NOT EXISTS idx_google_drive_connections_status ON public.google_drive_connections(status);

-- Habilitação de Segurança por Linha (Row Level Security - RLS)
ALTER TABLE public.google_drive_connections ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para google_drive_connections
DROP POLICY IF EXISTS "Administradores podem consultar conexões do Google Drive" ON public.google_drive_connections;
DROP POLICY IF EXISTS "Apenas Administradores leem conexões do Google Drive" ON public.google_drive_connections;
CREATE POLICY "Apenas Administradores leem conexões do Google Drive"
    ON public.google_drive_connections FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Administradores podem inserir conexões do Google Drive" ON public.google_drive_connections;
DROP POLICY IF EXISTS "Administradores podem atualizar conexões do Google Drive" ON public.google_drive_connections;
DROP POLICY IF EXISTS "Administradores podem excluir conexões do Google Drive" ON public.google_drive_connections;
DROP POLICY IF EXISTS "Apenas Administradores gerenciam conexões do Google Drive" ON public.google_drive_connections;
CREATE POLICY "Apenas Administradores gerenciam conexões do Google Drive"
    ON public.google_drive_connections FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Função RPC: Troca Atômica da Conexão do Google Drive (Prevenção de estado inconsistente)
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
SET search_path = public
AS $$
DECLARE
    v_new_connection public.google_drive_connections;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Desativa conexões anteriores ativas do provedor google_drive
    UPDATE public.google_drive_connections
    SET is_active = false,
        status = 'disconnected',
        updated_at = v_now
    WHERE provider = 'google_drive'
      AND is_active = true;

    -- 2. Insere a nova conexão atômica como ativa
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
        last_verified_at,
        connected_at,
        created_at,
        updated_at
    )
    VALUES (
        'google_drive',
        p_connected_by,
        p_connected_by_email,
        p_account_email,
        p_drive_folder_id,
        COALESCE(p_drive_folder_name, 'Jucélia Santana Engenharia Civil — Backups'),
        true,
        'connected',
        p_refresh_token_encrypted,
        v_now,
        v_now,
        v_now,
        v_now
    )
    RETURNING * INTO v_new_connection;

    -- 3. Sincroniza metadados administrativos não-sensíveis em site_settings
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

REVOKE ALL ON FUNCTION public.switch_active_google_drive_connection(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.switch_active_google_drive_connection(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role, authenticated;


-- ==============================================================================
-- 9. TABELA DE ESTADOS TEMPORÁRIOS OAUTH (CSRF & STATE HARDENED)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.google_oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_hash TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT,
    origin TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_google_oauth_states_hash ON public.google_oauth_states(state_hash);
CREATE INDEX IF NOT EXISTS idx_google_oauth_states_expires ON public.google_oauth_states(expires_at);

ALTER TABLE public.google_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas Administradores gerenciam states OAuth" ON public.google_oauth_states;
CREATE POLICY "Apenas Administradores gerenciam states OAuth"
    ON public.google_oauth_states FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Função RPC: Consumo Atômico de State OAuth (Uso Único e Proteção contra Replay)
CREATE OR REPLACE FUNCTION public.consume_google_oauth_state(p_state_hash TEXT)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    origin TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.google_oauth_states
    SET used_at = timezone('utc'::text, now())
    WHERE state_hash = p_state_hash
      AND used_at IS NULL
      AND expires_at > timezone('utc'::text, now())
    RETURNING google_oauth_states.user_id, google_oauth_states.user_email, google_oauth_states.origin;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_google_oauth_state(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_google_oauth_state(TEXT) TO service_role, authenticated;



