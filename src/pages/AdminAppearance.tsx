// /src/pages/AdminAppearance.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Upload,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Building2,
  LayoutDashboard,
  Layout,
  X,
  RotateCcw,
  Sliders,
  Check,
  ShieldAlert,
  Wand2,
  Layers,
  Type,
  MousePointerClick
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVisualIdentity, VisualIdentitySettings } from '../context/VisualIdentityContext';
import { supabaseStorage } from '../services/supabaseStorage';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { getAssetUrl } from '../utils/assetUtils';
import {
  SiteThemeSettings,
  DEFAULT_THEME,
  isValidHex,
  analyzeThemeContrast,
  calculateAutoContrastText,
  isLightColor
} from '../utils/themeUtils';
import { ManagedMedia } from '../components/ui/ManagedMedia';
import { MediaDisplayEditorModal } from '../components/admin/MediaDisplayEditorModal';
import { MediaContext } from '../types/mediaDisplay';

interface AssetConfigItem {
  key: keyof VisualIdentitySettings;
  title: string;
  description: string;
  recommendedSize: string;
  defaultFallbackName: string;
  defaultFallbackIcon: React.ElementType;
  defaultFallbackImage?: string;
}

const ASSET_ITEMS: AssetConfigItem[] = [
  {
    key: 'site_logo',
    title: 'Logo Principal do Site',
    description: 'Exibida no cabeçalho (Navbar) e rodapé (Footer) de todas as páginas públicas do ecossistema.',
    recommendedSize: 'Proporção recomendada: 1:1 ou Horizontal (mínimo 300x300px com fundo transparente PNG/SVG)',
    defaultFallbackName: 'Logo Padrão da Empresa (foto_logo.png)',
    defaultFallbackIcon: Building2,
    defaultFallbackImage: getAssetUrl('foto_logo.png'),
  },
  {
    key: 'site_favicon',
    title: 'Favicon / Ícone da Aba do Navegador',
    description: 'Exibido na guia do navegador, marcadores de favoritos e atalhos móveis salvos.',
    recommendedSize: 'Proporção 1:1 (32x32px ou 64x64px em formato PNG, ICO ou SVG)',
    defaultFallbackName: 'Ícone Padrão do Sistema (/icon.svg)',
    defaultFallbackIcon: Sparkles,
    defaultFallbackImage: '/icon.svg',
  },
  {
    key: 'splash_icon',
    title: 'Ícone da Tela Inicial (Splash Screen)',
    description: 'Apresentado na animação premium de carregamento ao abrir a página inicial do site.',
    recommendedSize: 'Proporção 1:1 (mínimo 200x200px com fundo transparente)',
    defaultFallbackName: 'Logo do Sistema',
    defaultFallbackIcon: Building2,
    defaultFallbackImage: getAssetUrl('foto_logo.png'),
  },
  {
    key: 'dashboard_icon',
    title: 'Ícone do Dashboard Administrativo',
    description: 'Exibido no cartão de boas-vindas do painel de controle principal.',
    recommendedSize: 'Proporção 1:1 (mínimo 128x128px)',
    defaultFallbackName: 'Ícone Padrão de Engenharia (Building2)',
    defaultFallbackIcon: LayoutDashboard,
  },
  {
    key: 'admin_sidebar_icon',
    title: 'Ícone da Barra Lateral Administrativa',
    description: 'Exibido no topo da barra de navegação superior e lateral do painel administrativo.',
    recommendedSize: 'Proporção 1:1 (mínimo 128x128px)',
    defaultFallbackName: 'Ícone Padrão da Marca (Building2)',
    defaultFallbackIcon: Layout,
  },
];

interface ColorFieldMeta {
  key: keyof SiteThemeSettings;
  label: string;
  description: string;
  category: 'surfaces' | 'typography' | 'brand' | 'buttons';
}

const COLOR_FIELDS: ColorFieldMeta[] = [
  {
    key: 'bg_primary',
    label: 'Cor de Fundo Principal',
    description: 'Fundo geral das páginas do site público e do painel administrativo.',
    category: 'surfaces',
  },
  {
    key: 'bg_secondary',
    label: 'Cor de Fundo Secundária',
    description: 'Fundo do cabeçalho, rodapé e seções de destaque.',
    category: 'surfaces',
  },
  {
    key: 'color_cards',
    label: 'Cor dos Cards e Superfícies',
    description: 'Fundo dos cartões, painéis e contêineres de conteúdo.',
    category: 'surfaces',
  },
  {
    key: 'color_border',
    label: 'Cor das Bordas e Linhas',
    description: 'Bordas de separação, contornos de inputs e divisores.',
    category: 'surfaces',
  },
  {
    key: 'color_titles',
    label: 'Cor dos Títulos',
    description: 'Títulos principais (H1, H2, H3) e cabeçalhos em estilo Serif.',
    category: 'typography',
  },
  {
    key: 'color_text',
    label: 'Cor dos Textos',
    description: 'Cor do texto de corpo, parágrafos, legendas e descrições.',
    category: 'typography',
  },
  {
    key: 'color_primary',
    label: 'Cor Principal da Marca',
    description: 'Destaques principais, ícones de marca e elementos primários.',
    category: 'brand',
  },
  {
    key: 'color_secondary',
    label: 'Cor Secundária da Marca',
    description: 'Acentos secundários, fundos de badges e detalhes finos.',
    category: 'brand',
  },
  {
    key: 'color_accent',
    label: 'Cor de Destaque / Brilho',
    description: 'Gradientes dourados, bordas ativas e indicadores de status.',
    category: 'brand',
  },
  {
    key: 'color_buttons',
    label: 'Cor do Fundo dos Botões',
    description: 'Preenchimento dos botões de ação primária em todo o ecossistema.',
    category: 'buttons',
  },
  {
    key: 'color_button_text',
    label: 'Cor do Texto dos Botões',
    description: 'Texto interno dos botões de ação primária.',
    category: 'buttons',
  },
];

export default function AdminAppearance() {
  const { user, profile, isAdmin } = useAuth();
  const {
    settings,
    theme,
    updateSetting,
    refreshSettings,
    updateTheme,
    resetThemeToDefault,
    applyThemePreview,
    restorePublishedTheme,
  } = useVisualIdentity();

  // Aba ativa: 'assets' (Ícones) ou 'theme' (Cores e Tema)
  const [activeTab, setActiveTab] = useState<'theme' | 'assets'>('theme');

  // Estado das cores do formulário de tema
  const [formTheme, setFormTheme] = useState<SiteThemeSettings>(theme);
  const [savingTheme, setSavingTheme] = useState(false);

  // Estados de feedback de assets
  const [loadingKey, setLoadingKey] = useState<keyof VisualIdentitySettings | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal de pré-visualização de imagem antes de salvar (Etapa 2)
  const [previewItem, setPreviewItem] = useState<{
    key: keyof VisualIdentitySettings;
    file: File;
    previewUrl: string;
    itemConfig: AssetConfigItem;
  } | null>(null);

  // Modal de confirmação de exclusão de asset (Etapa 2)
  const [deleteModalItem, setDeleteModalItem] = useState<{
    key: keyof VisualIdentitySettings;
    title: string;
  } | null>(null);

  // Modal para visualizar imagem/ícone ampliado em alta resolução
  const [viewFullAsset, setViewFullAsset] = useState<{
    item: AssetConfigItem;
    url: string;
  } | null>(null);

  // Modal de ajuste de enquadramento (Universal Media Display)
  const [mediaEditorItem, setMediaEditorItem] = useState<{
    key: keyof VisualIdentitySettings;
    title: string;
    url: string;
    context: MediaContext;
  } | null>(null);

  // Mapeia erros de carregamento de imagens para detectar URLs corrompidas no banco
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Modal de confirmação para restaurar tema padrão (Etapa 3)
  const [showResetThemeModal, setShowResetThemeModal] = useState(false);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Sincroniza o formTheme quando o tema publicado do contexto muda
  useEffect(() => {
    setFormTheme(theme);
  }, [theme]);

  // Aplica a pré-visualização do tema em tempo real ao alterar o formulário
  const handleColorChange = (key: keyof SiteThemeSettings, value: string) => {
    const updated = {
      ...formTheme,
      [key]: value,
    };
    setFormTheme(updated);
    applyThemePreview(updated);
  };

  // Restaura o tema publicado sem salvar
  const handleCancelThemeChanges = () => {
    setFormTheme(theme);
    restorePublishedTheme();
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Otimização automática de contraste WCAG AA
  const handleAutoOptimizeContrast = () => {
    const autoText = calculateAutoContrastText(formTheme.bg_primary, '#CBD5E1', '#0F172A');
    const autoTitles = calculateAutoContrastText(formTheme.bg_primary, '#FFFFFF', '#090D16');
    const autoBtnText = calculateAutoContrastText(formTheme.color_buttons, '#FFFFFF', '#070D18');

    const optimized: SiteThemeSettings = {
      ...formTheme,
      color_text: autoText,
      color_titles: autoTitles,
      color_button_text: autoBtnText,
    };

    setFormTheme(optimized);
    applyThemePreview(optimized);
    setSuccessMsg('Cores de texto e botões otimizadas automaticamente para excelente contraste WCAG AA.');
  };

  // Salvar as alterações de tema no Supabase
  const handleSaveTheme = async () => {
    if (!user || !isAdmin) {
      setErrorMsg('Apenas administradores ativos podem alterar o tema do sistema.');
      return;
    }

    // Valida todas as cores do formulário
    const invalidKeys = (Object.keys(formTheme) as (keyof SiteThemeSettings)[]).filter(
      (k) => !isValidHex(formTheme[k])
    );

    if (invalidKeys.length > 0) {
      setErrorMsg(`Por favor, insira códigos HEX válidos para os campos: ${invalidKeys.join(', ')}.`);
      return;
    }

    setSavingTheme(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Atualiza e persiste no Supabase
      await updateTheme(formTheme, user.id);

      // 2. Registra log de auditoria
      await supabaseDatabase.logAdminAction({
        user_id: user.id,
        user_email: user.email || profile?.email || 'admin@juceliasantana.com',
        action: 'UPDATE_SITE_THEME',
        entity_type: 'site_settings',
        entity_id: 'site_theme',
        details: {
          theme_config: formTheme as unknown as Record<string, any>,
        },
      });

      setSuccessMsg('Tema visual atualizado com sucesso.');
    } catch (err: any) {
      console.error('Erro ao salvar tema no Supabase:', err);
      setErrorMsg('Não foi possível salvar o tema. Tente novamente.');
      // Restaura o tema válido atualmente publicado
      restorePublishedTheme();
    } finally {
      setSavingTheme(false);
    }
  };

  // Confirmação para restaurar tema padrão
  const handleConfirmResetTheme = async () => {
    if (!user || !isAdmin) return;

    setSavingTheme(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await resetThemeToDefault(user.id);
      setFormTheme(DEFAULT_THEME);

      await supabaseDatabase.logAdminAction({
        user_id: user.id,
        user_email: user.email || profile?.email || 'admin@juceliasantana.com',
        action: 'RESET_SITE_THEME',
        entity_type: 'site_settings',
        entity_id: 'site_theme',
        details: {
          restored_theme: DEFAULT_THEME as unknown as Record<string, any>,
        },
      });

      setSuccessMsg('Tema padrão original restaurado com sucesso.');
      setShowResetThemeModal(false);
    } catch (err: any) {
      console.error('Erro ao restaurar tema padrão:', err);
      setErrorMsg('Não foi possível restaurar o tema padrão. Tente novamente.');
    } finally {
      setSavingTheme(false);
    }
  };

  // Validação de arquivo de asset (Etapa 2)
  const validateFile = (file: File): string | null => {
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ];

    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|svg|ico)$/i)) {
      return 'Formato de arquivo inválido. Formatos aceitos: PNG, JPG, WEBP, SVG e ICO.';
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return 'O arquivo selecionado excede o limite máximo de 5MB.';
    }

    return null;
  };

  const handleFileSelect = (key: keyof VisualIdentitySettings, itemConfig: AssetConfigItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMsg(validationError);
      if (fileInputRefs.current[key]) {
        fileInputRefs.current[key]!.value = '';
      }
      return;
    }

    setErrorMsg(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewItem({
      key,
      file,
      previewUrl: objectUrl,
      itemConfig,
    });
  };

  const handleConfirmAssetUpload = async () => {
    if (!previewItem || !user || !isAdmin) return;

    const { key, file, itemConfig } = previewItem;
    setLoadingKey(key);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const publicUrl = await supabaseStorage.uploadVisualAsset(key, file);
      await updateSetting(key, publicUrl, user.id);

      await supabaseDatabase.logAdminAction({
        user_id: user.id,
        user_email: user.email || profile?.email || 'admin@juceliasantana.com',
        action: 'UPDATE_VISUAL_IDENTITY_ASSET',
        entity_type: 'site_settings',
        entity_id: key,
        details: {
          asset_key: key,
          asset_title: itemConfig.title,
          new_url: publicUrl,
        },
      });

      setSuccessMsg(`Identidade visual atualizada com sucesso: ${itemConfig.title}.`);
      setPreviewItem(null);
      if (fileInputRefs.current[key]) {
        fileInputRefs.current[key]!.value = '';
      }
    } catch (err: any) {
      console.error('Erro ao atualizar asset de identidade visual:', err);
      setErrorMsg(err.message || 'Falha ao salvar a nova imagem no servidor. Tente novamente.');
    } finally {
      setLoadingKey(null);
    }
  };

  const handleConfirmAssetRemove = async () => {
    if (!deleteModalItem || !user || !isAdmin) return;

    const { key, title } = deleteModalItem;
    setLoadingKey(key);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateSetting(key, null, user.id);

      await supabaseDatabase.logAdminAction({
        user_id: user.id,
        user_email: user.email || profile?.email || 'admin@juceliasantana.com',
        action: 'RESET_VISUAL_IDENTITY_ASSET',
        entity_type: 'site_settings',
        entity_id: key,
        details: {
          asset_key: key,
          asset_title: title,
        },
      });

      setSuccessMsg(`Imagem removida com sucesso. O asset padrão do sistema foi restaurado para ${title}.`);
      setDeleteModalItem(null);
    } catch (err: any) {
      console.error('Erro ao remover imagem de identidade visual:', err);
      setErrorMsg(err.message || 'Falha ao restaurar o asset padrão do sistema.');
    } finally {
      setLoadingKey(null);
    }
  };

  // Analisa o contraste do formulário de tema atual
  const contrastAnalysis = analyzeThemeContrast(formTheme);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Principal do Módulo */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] text-xs font-bold uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5" /> Aparência e Marca
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight">
              Gerenciamento Centralizado de Aparência e Tema
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
              Personalize as cores corporativas e os assets visuais da Engª Jucélia Santana. As configurações são aplicadas instantaneamente em todo o site e salvas com segurança no Supabase.
            </p>
          </div>

          <button
            onClick={() => refreshSettings()}
            type="button"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'theme'
                ? 'bg-[#C5A059] text-[#070D18] shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Cores e Tema</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-[#C5A059] text-[#070D18] shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagens e Ícones (Assets)</span>
          </button>
        </div>
      </div>

      {/* Banner de Sucesso */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400/80 hover:text-emerald-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner de Erro */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400/80 hover:text-rose-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ABA 1: CORES E TEMA VISTO NO PAINEL */}
      {activeTab === 'theme' && (
        <div className="space-y-8 animate-fade-in">
          {/* Painel Superior de Ações do Tema */}
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#C5A059]/15 text-[#C5A059]">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white font-serif">Configuração Global de Paleta de Cores</h2>
                <p className="text-xs text-slate-400">Edite os valores HEX, verifique o contraste e visualize o resultado ao vivo.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowResetThemeModal(true)}
                disabled={savingTheme}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Tema Padrão</span>
              </button>

              <button
                type="button"
                onClick={handleCancelThemeChanges}
                disabled={savingTheme}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>

              <button
                type="button"
                onClick={handleSaveTheme}
                disabled={savingTheme}
                className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08e4c] text-[#070D18] text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {savingTheme ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>

          {/* Painel de Análise de Contraste e Acessibilidade (WCAG AA) */}
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    contrastAnalysis.overallPass
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {contrastAnalysis.overallPass ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                    Acessibilidade e Contraste WCAG 2.1
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                        contrastAnalysis.overallPass
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {contrastAnalysis.overallPass ? 'Aprovado' : 'Aviso de Baixo Contraste'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    O sistema avalia a razão de contraste entre fundos e textos para garantir legibilidade impecável.
                  </p>
                </div>
              </div>

              {!contrastAnalysis.overallPass && (
                <button
                  type="button"
                  onClick={handleAutoOptimizeContrast}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Otimizar Contraste Automático</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {contrastAnalysis.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                    item.isPass
                      ? 'bg-[#070D18] border-white/10'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-300">{item.label}</span>
                    <span
                      className={`font-mono ${
                        item.isPass ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {item.ratio.toFixed(1)}:1
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: item.bgHex }} title={`Fundo: ${item.bgHex}`} />
                    <span className="text-slate-500 text-[10px]">vs</span>
                    <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: item.fgHex }} title={`Texto: ${item.fgHex}`} />
                    <span className="text-[10px] text-slate-400 truncate">
                      {item.isPass ? 'Contraste WCAG OK' : 'Baixo Contraste'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid de Edição de Cores + Pré-Visualização Lado a Lado */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Coluna Esquerda: Form de Cores (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Categoria 1: Superfícies e Fundos */}
              <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[#C5A059]">
                  <Layers className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">Superfícies e Fundos</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COLOR_FIELDS.filter((f) => f.category === 'surfaces').map((field) => (
                    <div key={field.key} className="space-y-1.5 p-3 rounded-xl bg-[#070D18] border border-white/5">
                      <label className="text-xs font-bold text-slate-200 block">{field.label}</label>
                      <p className="text-[11px] text-slate-400 h-8">{field.description}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <div
                          className="w-10 h-10 rounded-xl border border-white/20 relative overflow-hidden shadow-inner shrink-0 cursor-pointer"
                          style={{ backgroundColor: formTheme[field.key] }}
                        >
                          <input
                            type="color"
                            value={isValidHex(formTheme[field.key]) ? formTheme[field.key] : '#000000'}
                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>

                        <input
                          type="text"
                          value={formTheme[field.key]}
                          onChange={(e) => handleColorChange(field.key, e.target.value)}
                          placeholder="#0A1220"
                          className={`w-full px-3 py-2 rounded-xl bg-[#0B1526] text-white text-xs font-mono border uppercase transition-all ${
                            isValidHex(formTheme[field.key])
                              ? 'border-white/10 focus:border-[#C5A059]'
                              : 'border-rose-500 text-rose-300'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categoria 2: Tipografia e Textos */}
              <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[#C5A059]">
                  <Type className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">Tipografia e Textos</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COLOR_FIELDS.filter((f) => f.category === 'typography').map((field) => (
                    <div key={field.key} className="space-y-1.5 p-3 rounded-xl bg-[#070D18] border border-white/5">
                      <label className="text-xs font-bold text-slate-200 block">{field.label}</label>
                      <p className="text-[11px] text-slate-400 h-8">{field.description}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <div
                          className="w-10 h-10 rounded-xl border border-white/20 relative overflow-hidden shadow-inner shrink-0 cursor-pointer"
                          style={{ backgroundColor: formTheme[field.key] }}
                        >
                          <input
                            type="color"
                            value={isValidHex(formTheme[field.key]) ? formTheme[field.key] : '#000000'}
                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>

                        <input
                          type="text"
                          value={formTheme[field.key]}
                          onChange={(e) => handleColorChange(field.key, e.target.value)}
                          placeholder="#FFFFFF"
                          className={`w-full px-3 py-2 rounded-xl bg-[#0B1526] text-white text-xs font-mono border uppercase transition-all ${
                            isValidHex(formTheme[field.key])
                              ? 'border-white/10 focus:border-[#C5A059]'
                              : 'border-rose-500 text-rose-300'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categoria 3: Identidade da Marca */}
              <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[#C5A059]">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">Identidade da Marca</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {COLOR_FIELDS.filter((f) => f.category === 'brand').map((field) => (
                    <div key={field.key} className="space-y-1.5 p-3 rounded-xl bg-[#070D18] border border-white/5">
                      <label className="text-xs font-bold text-slate-200 block">{field.label}</label>
                      <p className="text-[11px] text-slate-400 h-8">{field.description}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <div
                          className="w-10 h-10 rounded-xl border border-white/20 relative overflow-hidden shadow-inner shrink-0 cursor-pointer"
                          style={{ backgroundColor: formTheme[field.key] }}
                        >
                          <input
                            type="color"
                            value={isValidHex(formTheme[field.key]) ? formTheme[field.key] : '#000000'}
                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>

                        <input
                          type="text"
                          value={formTheme[field.key]}
                          onChange={(e) => handleColorChange(field.key, e.target.value)}
                          placeholder="#C5A059"
                          className={`w-full px-3 py-2 rounded-xl bg-[#0B1526] text-white text-xs font-mono border uppercase transition-all ${
                            isValidHex(formTheme[field.key])
                              ? 'border-white/10 focus:border-[#C5A059]'
                              : 'border-rose-500 text-rose-300'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categoria 4: Botões e Controles */}
              <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[#C5A059]">
                  <MousePointerClick className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">Botões e Ações</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COLOR_FIELDS.filter((f) => f.category === 'buttons').map((field) => (
                    <div key={field.key} className="space-y-1.5 p-3 rounded-xl bg-[#070D18] border border-white/5">
                      <label className="text-xs font-bold text-slate-200 block">{field.label}</label>
                      <p className="text-[11px] text-slate-400 h-8">{field.description}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <div
                          className="w-10 h-10 rounded-xl border border-white/20 relative overflow-hidden shadow-inner shrink-0 cursor-pointer"
                          style={{ backgroundColor: formTheme[field.key] }}
                        >
                          <input
                            type="color"
                            value={isValidHex(formTheme[field.key]) ? formTheme[field.key] : '#000000'}
                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>

                        <input
                          type="text"
                          value={formTheme[field.key]}
                          onChange={(e) => handleColorChange(field.key, e.target.value)}
                          placeholder="#C5A059"
                          className={`w-full px-3 py-2 rounded-xl bg-[#0B1526] text-white text-xs font-mono border uppercase transition-all ${
                            isValidHex(formTheme[field.key])
                              ? 'border-white/10 focus:border-[#C5A059]'
                              : 'border-rose-500 text-rose-300'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Área de Pré-Visualização Interativa (5 cols) */}
            <div className="lg:col-span-5 space-y-4 sticky top-6 self-start">
              <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#C5A059]" />
                    <h3 className="text-sm font-extrabold text-white font-serif">Pré-Visualização em Tempo Real</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-mono font-bold uppercase">
                    Live Mockup
                  </span>
                </div>

                {/* Mockup do Sistema com as Cores em Tempo Real */}
                <div
                  className="rounded-2xl p-5 border shadow-2xl space-y-4 transition-all duration-300 overflow-hidden"
                  style={{
                    backgroundColor: formTheme.bg_primary,
                    borderColor: formTheme.color_border,
                  }}
                >
                  {/* Navbar Mockup */}
                  <div
                    className="p-3 rounded-xl border flex items-center justify-between shadow-md"
                    style={{
                      backgroundColor: formTheme.bg_secondary,
                      borderColor: formTheme.color_border,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow"
                        style={{
                          backgroundColor: formTheme.color_primary,
                          color: formTheme.color_button_text,
                        }}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span
                        className="font-serif font-bold text-xs"
                        style={{ color: formTheme.color_titles }}
                      >
                        Engª Jucélia Santana
                      </span>
                    </div>

                    <div
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      style={{
                        backgroundColor: formTheme.color_buttons,
                        color: formTheme.color_button_text,
                      }}
                    >
                      Contato
                    </div>
                  </div>

                  {/* Card Principais de Exemplo */}
                  <div
                    className="p-4 rounded-xl border space-y-3 shadow-lg"
                    style={{
                      backgroundColor: formTheme.color_cards,
                      borderColor: formTheme.color_border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{
                          backgroundColor: formTheme.color_secondary,
                          color: formTheme.color_titles,
                        }}
                      >
                        Projeto Estrutural
                      </span>
                      <Sparkles
                        className="w-4 h-4"
                        style={{ color: formTheme.color_accent }}
                      />
                    </div>

                    <h4
                      className="text-base font-bold font-serif"
                      style={{ color: formTheme.color_titles }}
                    >
                      Residencial de Alto Padrão
                    </h4>

                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: formTheme.color_text }}
                    >
                      Cálculo estrutural avançado, compatibilização BIM e laudos de segurança técnica com ISO 9001.
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-lg text-xs font-bold transition-transform shadow hover:scale-105"
                        style={{
                          backgroundColor: formTheme.color_buttons,
                          color: formTheme.color_button_text,
                        }}
                      >
                        Solicitar Orçamento
                      </button>

                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg text-xs font-bold border transition-all"
                        style={{
                          borderColor: formTheme.color_border,
                          color: formTheme.color_titles,
                          backgroundColor: formTheme.bg_secondary,
                        }}
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>

                  {/* Banner de Destaque Inferior */}
                  <div
                    className="p-3 rounded-xl border flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: formTheme.bg_secondary,
                      borderColor: formTheme.color_accent,
                    }}
                  >
                    <span style={{ color: formTheme.color_text }}>
                      Satisfação dos Clientes:
                    </span>
                    <span
                      className="font-bold font-mono"
                      style={{ color: formTheme.color_accent }}
                    >
                      100% Aprovado
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#070D18] border border-white/5 text-[11px] text-slate-400 space-y-1 font-mono">
                  <p>✔ As cores são aplicadas em tempo real nesta pré-visualização.</p>
                  <p>✔ Clique em "Salvar Alterações" para publicar no site oficial.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: IMAGENS E ÍCONES (ASSETS DA ETAPA 2) */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          {ASSET_ITEMS.map((item) => {
            const currentUrl = settings[item.key];
            const isUploading = loadingKey === item.key;
            const DefaultIcon = item.defaultFallbackIcon;
            const isCorrupted = imageErrors[item.key];
            const activeDisplayUrl = currentUrl || item.defaultFallbackImage;

            return (
              <div
                key={item.key}
                className={`bg-[#0B1526] border rounded-2xl p-6 shadow-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                  isCorrupted ? 'border-rose-500/50 bg-rose-950/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Informações do Asset */}
                <div className="space-y-2 flex-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#070D18] border border-white/10 text-[#C5A059]">
                      <DefaultIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-white font-serif">{item.title}</h2>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">{item.description}</p>

                  <div className="p-2.5 rounded-lg bg-[#070D18]/80 border border-white/5 text-[11px] text-slate-400 font-mono">
                    {item.recommendedSize}
                  </div>

                  {isCorrupted && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        URL de foto sem formato válido detectada no banco.
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteModalItem({ key: item.key, title: item.title })}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer transition-all"
                      >
                        Excluir e Limpar Banco
                      </button>
                    </div>
                  )}
                </div>

                {/* Prévia do Asset */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto bg-[#070D18] p-4 rounded-xl border border-white/5 shrink-0">
                  <div className="relative w-24 h-24 rounded-xl border border-white/10 bg-[#0B1526] flex items-center justify-center p-2 overflow-hidden group shadow-inner">
                    {activeDisplayUrl ? (
                      <ManagedMedia
                        mediaKey={`visual_identity:${item.key}`}
                        src={activeDisplayUrl}
                        alt={item.title}
                        context="visual_identity"
                        onError={() => setImageErrors((prev) => ({ ...prev, [item.key]: true }))}
                        className="w-full h-full object-contain drop-shadow-md"
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <DefaultIcon className="w-10 h-10 text-[#C5A059] opacity-70" />
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center px-1">
                        {currentUrl ? 'Personalizada' : 'Padrão'}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto text-center sm:text-left">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Atual</span>
                      <span
                        className={`text-xs font-bold ${
                          isCorrupted
                            ? 'text-rose-400'
                            : currentUrl
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isCorrupted
                          ? '⚠️ Formato Inválido / Corrompido'
                          : currentUrl
                          ? 'Imagem Personalizada Ativa'
                          : `Padrão: ${item.defaultFallbackName}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {activeDisplayUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => setViewFullAsset({ item, url: activeDisplayUrl })}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Visualizar imagem ampliada em alta resolução"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Visualizar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMediaEditorItem({
                                key: item.key,
                                title: item.title,
                                url: activeDisplayUrl,
                                context: 'visual_identity',
                              })
                            }
                            className="px-3 py-2 rounded-xl bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border border-[#C5A059]/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            title="Ajustar enquadramento, zoom, ponto focal e proporção deste ícone/logo em todas as telas"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Enquadrar</span>
                          </button>
                        </>
                      )}

                      <input
                        ref={(el) => { fileInputRefs.current[item.key] = el; }}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/x-icon, image/vnd.microsoft.icon"
                        onChange={(e) => handleFileSelect(item.key, item, e)}
                        className="hidden"
                        id={`input-${item.key}`}
                      />
                      <label
                        htmlFor={`input-${item.key}`}
                        className={`px-3.5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08e4c] text-[#070D18] text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                          isUploading ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {isUploading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{currentUrl ? 'Substituir' : 'Enviar Imagem'}</span>
                      </label>

                      {currentUrl && (
                        <button
                          type="button"
                          onClick={() => setDeleteModalItem({ key: item.key, title: item.title })}
                          disabled={isUploading}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Excluir imagem do banco de dados e restaurar padrão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: PRÉ-VISUALIZAÇÃO DE UPLOAD DE ASSET (ETAPA 2) */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#C5A059]/15 text-[#C5A059]">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-serif">Pré-visualização da Imagem</h3>
                  <p className="text-xs text-slate-400">{previewItem.itemConfig.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#070D18] border border-white/5 space-y-4 text-center">
              <span className="text-xs font-semibold text-slate-400 block">
                Imagem Selecionada ({previewItem.file.name})
              </span>

              <div className="mx-auto w-36 h-36 rounded-2xl border border-white/20 p-3 flex items-center justify-center shadow-2xl relative overflow-hidden bg-slate-900">
                <img
                  src={previewItem.previewUrl}
                  alt="Pré-visualização"
                  className="max-w-full max-h-full object-contain filter drop-shadow-lg"
                />
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                <p>Tamanho: {(previewItem.file.size / 1024).toFixed(1)} KB</p>
                <p>Formato: {previewItem.file.type}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                disabled={loadingKey !== null}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAssetUpload}
                disabled={loadingKey !== null}
                className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08e4c] text-[#070D18] text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {loadingKey === previewItem.key && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar e Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAÇÃO DE REMOÇÃO DE ASSET (ETAPA 2) */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 rounded-xl bg-rose-500/15">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">Remover Imagem Personalizada</h3>
                <p className="text-xs text-slate-400">{deleteModalItem.title}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-rose-500/20 text-xs text-slate-300 space-y-2">
              <p>
                Deseja remover a imagem personalizada de <strong className="text-white">{deleteModalItem.title}</strong>?
              </p>
              <p className="text-slate-400 text-[11px]">
                O sistema restaurará automaticamente a imagem e ícone padrão originais da plataforma.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                disabled={loadingKey !== null}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAssetRemove}
                disabled={loadingKey !== null}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {loadingKey === deleteModalItem.key && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Remoção</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAÇÃO DE RESTAURAÇÃO DE TEMA PADRÃO (ETAPA 3) */}
      {showResetThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 rounded-xl bg-rose-500/15">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-serif">Restaurar Tema Padrão</h3>
                <p className="text-xs text-slate-400">Restaurar cores originais do sistema</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#070D18] border border-rose-500/20 text-xs text-slate-300 space-y-2">
              <p>
                Tem certeza de que deseja restaurar todas as cores originais da marca corporativa Engª Jucélia Santana?
              </p>
              <p className="text-slate-400 text-[11px]">
                Esta ação redefinirá os fundos, textos, botões e destaques para os padrões originais do sistema no Supabase.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetThemeModal(false)}
                disabled={savingTheme}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetTheme}
                disabled={savingTheme}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {savingTheme && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Restaurar Tema Padrão</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: VISUALIZAR IMAGEM AMPLIADA EM ALTA RESOLUÇÃO */}
      {viewFullAsset && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#C5A059]/15 text-[#C5A059]">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-serif">{viewFullAsset.item.title}</h3>
                  <p className="text-xs text-slate-400">Visualização detalhada da foto e asset cadastrado no banco</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewFullAsset(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#070D18] border border-white/5 space-y-4 text-center">
              <div className="mx-auto max-w-full max-h-80 rounded-xl border border-white/10 p-4 flex items-center justify-center bg-slate-950/80 shadow-2xl overflow-hidden relative">
                <img
                  src={viewFullAsset.url}
                  alt={viewFullAsset.item.title}
                  className="max-w-full max-h-72 object-contain drop-shadow-2xl"
                  onError={() => setImageErrors((prev) => ({ ...prev, [viewFullAsset.item.key]: true }))}
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0B1526] border border-white/5 text-[11px] text-slate-400 space-y-1 font-mono text-left">
                <p><strong className="text-slate-200">Recomendação:</strong> {viewFullAsset.item.recommendedSize}</p>
                <p className="truncate"><strong className="text-slate-200">URL / Fonte:</strong> {viewFullAsset.url}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {settings[viewFullAsset.item.key] && (
                  <button
                    type="button"
                    onClick={() => {
                      const key = viewFullAsset.item.key;
                      const title = viewFullAsset.item.title;
                      setViewFullAsset(null);
                      setDeleteModalItem({ key, title });
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir do Banco</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const item = viewFullAsset.item;
                    const url = viewFullAsset.url;
                    setViewFullAsset(null);
                    setMediaEditorItem({
                      key: item.key,
                      title: item.title,
                      url,
                      context: 'visual_identity',
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border border-[#C5A059]/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Ajustar Enquadramento</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewFullAsset(null)}
                className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08e4c] text-[#070D18] text-xs font-extrabold transition-all cursor-pointer ml-auto"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: AJUSTE UNIVERSAL DE ENQUADRAMENTO E FOCO (UNIVERSAL MEDIA DISPLAY) */}
      {mediaEditorItem && (
        <MediaDisplayEditorModal
          isOpen={!!mediaEditorItem}
          onClose={() => setMediaEditorItem(null)}
          mediaKey={`visual_identity:${mediaEditorItem.key}`}
          mediaUrl={mediaEditorItem.url}
          mediaTitle={mediaEditorItem.title}
          mediaType="icon"
          context={mediaEditorItem.context}
          onSaved={() => {
            setSuccessMsg(`Enquadramento de "${mediaEditorItem.title}" atualizado com sucesso em todas as telas do sistema.`);
            setMediaEditorItem(null);
          }}
        />
      )}
    </div>
  );
}
