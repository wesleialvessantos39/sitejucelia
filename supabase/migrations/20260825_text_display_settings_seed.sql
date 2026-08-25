-- ==============================================================================
-- MIGRATION: 20260825_text_display_settings_seed.sql
-- PROJETO: Engª Jucélia Santana (Ref Supabase: mnupdwlmgcratpfgypik)
-- DESCRIÇÃO: Semente idempotente para 'text_display_settings' em public.site_settings (OE-SITE-001)
-- ==============================================================================

INSERT INTO public.site_settings (key, value, updated_at, updated_by)
VALUES (
    'text_display_settings',
    jsonb_build_object(
        'enabled', true,
        'mode', 'collapsible',
        'automaticDetection', true,
        'minimumCharacters', 180,
        'mobileLines', 3,
        'tabletLines', 4,
        'desktopLines', 5,
        'initiallyExpanded', false,
        'showToggle', true,
        'expandLabel', 'Ler mais...',
        'collapseLabel', 'Ler menos',
        'sectionOverrides', jsonb_build_object(),
        'updatedAt', now()
    ),
    now(),
    NULL
)
ON CONFLICT (key) DO NOTHING;
