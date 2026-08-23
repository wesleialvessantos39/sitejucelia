// /src/pages/AdminAnalytics.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Activity,
  Layers,
  ShieldCheck,
  AlertCircle,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  ShieldAlert,
  X,
  FileCheck2,
  Database,
  Lock,
  Award,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import type {
  AnalyticsPeriod,
  AnalyticsDashboardData,
  DailyViewMetric,
  DeletionPreview,
  DeletionScopeType,
  StatsIntegrityReport,
} from '../types/analytics';
import {
  getAnalyticsDashboardData,
  formatLocalDateToYMD,
  formatYMDToBR,
  getMonthDateRange,
  getStatsPreviewForDeletion,
  deleteStatsByPeriod,
  getPageFriendlyName,
  checkStatsDataIntegrity,
} from '../services/siteAnalyticsService';
import { useAuth } from '../context/AuthContext';

export default function AdminAnalytics() {
  const { user, profile } = useAuth();

  // Estados de filtro do dashboard
  const [period, setPeriod] = useState<AnalyticsPeriod>('last30days');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return formatLocalDateToYMD(d);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => formatLocalDateToYMD());
  const [pageFilter, setPageFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados de dados e interface
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DailyViewMetric | null>(null);

  // Estados do Módulo de Integridade e Proteção (Etapa 19.5)
  const [showIntegrityModal, setShowIntegrityModal] = useState<boolean>(false);
  const [checkingIntegrity, setCheckingIntegrity] = useState<boolean>(false);
  const [integrityReport, setIntegrityReport] = useState<StatsIntegrityReport | null>(null);

  // Estados do Módulo de Gerenciamento e Limpeza (Etapa 19.4)
  const [deleteMode, setDeleteMode] = useState<DeletionScopeType>('day');
  const [deleteTargetDate, setDeleteTargetDate] = useState<string>(() => formatLocalDateToYMD());
  const [deleteTargetYear, setDeleteTargetYear] = useState<number>(() => new Date().getFullYear());
  const [deleteTargetMonth, setDeleteTargetMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [deleteCustomStart, setDeleteCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatLocalDateToYMD(d);
  });
  const [deleteCustomEnd, setDeleteCustomEnd] = useState<string>(() => formatLocalDateToYMD());
  const [deletePageFilter, setDeletePageFilter] = useState<string>('');

  // Modal de confirmação e feedback de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [activePreview, setActivePreview] = useState<DeletionPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Carrega os dados reais do Supabase
  const loadData = useCallback(
    async (isManualRefresh: boolean = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getAnalyticsDashboardData({
          period,
          customStart: period === 'custom' ? customStart : undefined,
          customEnd: period === 'custom' ? customEnd : undefined,
          pageFilter: pageFilter || undefined,
          search: searchTerm || undefined,
        });
        setDashboardData(data);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error('[AdminAnalytics] Erro ao carregar dados:', err);
        setError(
          err?.message ||
            'Não foi possível carregar as estatísticas de visualização. Verifique sua conexão e tente novamente.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, customStart, customEnd, pageFilter, searchTerm]
  );

  // Atualiza ao alterar filtros
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lista única de páginas para os dropdowns de filtro
  const availablePages = useMemo(() => {
    if (!dashboardData?.rawStats) return [];
    const set = new Set<string>();
    for (const item of dashboardData.rawStats) {
      set.add(item.page_path);
    }
    return Array.from(set).sort();
  }, [dashboardData?.rawStats]);

  // Cálculo do pico do gráfico diário para escala SVG
  const maxDailyViews = useMemo(() => {
    if (!dashboardData?.dailyMetrics || dashboardData.dailyMetrics.length === 0) return 10;
    const max = Math.max(...dashboardData.dailyMetrics.map((d) => d.views));
    return max > 0 ? max : 10;
  }, [dashboardData?.dailyMetrics]);

  // Handler para solicitar prévia de exclusão antes de abrir o modal
  const handleRequestDeletionPreview = async (
    overrideScope?: {
      scopeType: DeletionScopeType;
      startDate: string;
      endDate: string;
      pagePath?: string;
      label: string;
    }
  ) => {
    setActionErrorMessage(null);
    setActionSuccessMessage(null);
    setLoadingPreview(true);

    try {
      let startDate = '';
      let endDate = '';
      let label = '';
      let pagePath: string | undefined = deletePageFilter || undefined;
      const scopeType: DeletionScopeType = overrideScope?.scopeType || deleteMode;

      if (overrideScope) {
        startDate = overrideScope.startDate;
        endDate = overrideScope.endDate;
        pagePath = overrideScope.pagePath;
        label = overrideScope.label;
      } else if (deleteMode === 'day') {
        if (!deleteTargetDate) {
          throw new Error('Por favor, informe a data específica que deseja excluir.');
        }
        startDate = deleteTargetDate;
        endDate = deleteTargetDate;
        label = `Dia ${formatYMDToBR(deleteTargetDate, true)}`;
      } else if (deleteMode === 'month') {
        const range = getMonthDateRange(deleteTargetYear, deleteTargetMonth);
        startDate = range.startDate;
        endDate = range.endDate;
        label = range.label;
      } else {
        // Custom
        if (!deleteCustomStart || !deleteCustomEnd) {
          throw new Error('Por favor, selecione as datas inicial e final do período.');
        }
        if (deleteCustomStart > deleteCustomEnd) {
          throw new Error('A data inicial não pode ser posterior à data final.');
        }
        startDate = deleteCustomStart;
        endDate = deleteCustomEnd;
        label = `Período de ${formatYMDToBR(deleteCustomStart, true)} a ${formatYMDToBR(deleteCustomEnd, true)}`;
      }

      // Consulta os dados reais no banco
      const preview = await getStatsPreviewForDeletion({
        startDate,
        endDate,
        pagePath,
        scopeType,
        label,
      });

      setActivePreview(preview);
      setShowDeleteModal(true);
    } catch (err: any) {
      console.error('[AdminAnalytics] Erro ao consultar prévia:', err);
      setActionErrorMessage(err?.message || 'Falha ao consultar prévia dos registros.');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handler para exclusão rápida de uma página específica diretamente pela tabela
  const handleQuickDeletePage = (path: string) => {
    if (!dashboardData) return;
    const pageLabel = getPageFriendlyName(path);
    handleRequestDeletionPreview({
      scopeType: 'single_page',
      startDate: dashboardData.startDate,
      endDate: dashboardData.endDate,
      pagePath: path,
      label: `Página "${pageLabel}" (${dashboardData.periodLabel})`,
    });
  };

  // Handler para confirmar a exclusão real no Supabase
  const handleConfirmDeletion = async () => {
    if (!activePreview) return;
    setDeleting(true);
    setActionErrorMessage(null);

    try {
      const result = await deleteStatsByPeriod({
        startDate: activePreview.startDate,
        endDate: activePreview.endDate,
        pagePath: activePreview.pagePath,
        userEmail: user?.email || profile?.email || 'admin',
        userId: user?.id,
      });

      if (!result.success) {
        throw new Error(result.error || 'Falha ao executar a exclusão no banco de dados.');
      }

      // Sucesso
      setShowDeleteModal(false);
      setActionSuccessMessage(
        `Exclusão concluída com sucesso! ${result.recordsDeleted} ${
          result.recordsDeleted === 1 ? 'registro' : 'registros'
        } e ${result.viewsDeleted.toLocaleString('pt-BR')} ${
          result.viewsDeleted === 1 ? 'visualização foram removidos' : 'visualizações foram removidas'
        } do Supabase. Ação registrada no log de auditoria.`
      );
      setActivePreview(null);

      // Recarrega o painel de métricas
      await loadData(true);
    } catch (err: any) {
      console.error('[AdminAnalytics] Erro na exclusão:', err);
      setActionErrorMessage(err?.message || 'Ocorreu um erro ao excluir as estatísticas.');
    } finally {
      setDeleting(false);
    }
  };

  // Executa auditoria e diagnóstico de integridade da base (Etapa 19.5)
  const handleRunIntegrityCheck = async () => {
    setCheckingIntegrity(true);
    try {
      const report = await checkStatsDataIntegrity();
      setIntegrityReport(report);
      setShowIntegrityModal(true);
    } catch (err: any) {
      console.error('[AdminAnalytics] Erro ao auditar integridade:', err);
      setActionErrorMessage(err?.message || 'Falha ao verificar integridade das estatísticas.');
    } finally {
      setCheckingIntegrity(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header do Painel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0F1C30] via-[#0B1526] to-[#0F1C30] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas e Acessos em Tempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight">
            Estatísticas de Visualizações
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Acompanhe com precisão matemática o volume de acessos às páginas públicas do site institucional e faça a gestão e limpeza segura dos dados históricos.
          </p>
        </div>

        {/* Ações do Topo: Integridade e Atualização */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10 shrink-0">
          <button
            type="button"
            onClick={handleRunIntegrityCheck}
            disabled={checkingIntegrity}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            title="Diagnóstico de integridade e consistência da base"
          >
            <ShieldCheck className={`w-4 h-4 text-emerald-400 ${checkingIntegrity ? 'animate-spin' : ''}`} />
            <span>{checkingIntegrity ? 'Auditando...' : 'Diagnóstico de Integridade'}</span>
          </button>

          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-medium">
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#b08e4c] text-[#070D18] font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            title="Atualizar dados agora"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar Estatísticas'}</span>
          </button>
        </div>
      </div>

      {/* 2. Notificações de Ação (Sucesso ou Erro Global) */}
      {actionSuccessMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-emerald-200 animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-white text-sm">Operação Realizada com Sucesso</h4>
              <p className="text-emerald-300 leading-relaxed">{actionSuccessMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-rose-200 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-white text-sm">Erro na Operação</h4>
              <p className="text-rose-300 leading-relaxed">{actionErrorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-white text-sm">Falha ao consultar estatísticas</h4>
            <p>{error}</p>
            <button
              onClick={() => loadData(true)}
              className="mt-2 text-[#C5A059] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* 3. Resumo Principal & Destaques Dinâmicos (Etapa 19.6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Card 1: Hoje */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Hoje</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-slate-500 my-1" />
            ) : (
              dashboardData?.todayViews.toLocaleString('pt-BR') || 0
            )}
          </p>
          <p className="text-[10px] text-slate-400">Acessos registrados hoje</p>
        </div>

        {/* Card 2: Últimos 7 dias */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-[#C5A059]/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-wider">Últimos 7 dias</span>
            <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-slate-500 my-1" />
            ) : (
              dashboardData?.last7DaysViews.toLocaleString('pt-BR') || 0
            )}
          </p>
          <p className="text-[10px] text-slate-400">Semana acumulada</p>
        </div>

        {/* Card 3: Últimos 30 dias */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-purple-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Últimos 30 dias</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-slate-500 my-1" />
            ) : (
              dashboardData?.last30DaysViews.toLocaleString('pt-BR') || 0
            )}
          </p>
          <p className="text-[10px] text-slate-400">Mês acumulado</p>
        </div>

        {/* Card 4: Total do Período Selecionado */}
        <div className="bg-[#122038] border-2 border-[#C5A059]/50 rounded-2xl p-4 sm:p-5 space-y-2 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#C5A059] uppercase tracking-wider">Total Selecionado</span>
            <div className="p-2 rounded-xl bg-[#C5A059] text-black font-bold">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-slate-500 my-1" />
              ) : (
                dashboardData?.totalPeriodViews.toLocaleString('pt-BR') || 0
              )}
            </p>
            {dashboardData?.comparison && dashboardData.comparison.trend !== 'no_data' && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  dashboardData.comparison.trend === 'up'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : dashboardData.comparison.trend === 'down'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-500/20 text-slate-300'
                }`}
                title={dashboardData.comparison.statusDescription}
              >
                {dashboardData.comparison.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                {dashboardData.comparison.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                {dashboardData.comparison.formattedPercentage}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {dashboardData?.periodLabel || 'Período atual'}
          </p>
        </div>

        {/* Card 5: Destaque Página Mais Visualizada (Etapa 19.6) */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-amber-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Top Página</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-slate-500 my-1" />
          ) : dashboardData?.topPage ? (
            <div>
              <p className="text-sm font-bold text-white truncate" title={dashboardData.topPage.friendlyName}>
                {dashboardData.topPage.friendlyName}
              </p>
              <div className="flex items-center justify-between gap-1 mt-1">
                <span className="text-xs font-extrabold text-[#C5A059]">
                  {dashboardData.topPage.views.toLocaleString('pt-BR')} views
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                  {dashboardData.topPage.percentage}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-1">Sem visualizações</p>
          )}
          <p className="text-[10px] text-slate-400 truncate">
            {dashboardData?.topPage?.path || 'Página líder do período'}
          </p>
        </div>

        {/* Card 6: Destaque Dia com Mais Visualizações (Etapa 19.6) */}
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-sky-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Dia com Mais Views</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-slate-500 my-1" />
          ) : dashboardData?.topDay ? (
            <div>
              <p className="text-sm font-bold text-white">
                {dashboardData.topDay.displayDate}
              </p>
              <p className="text-xs font-extrabold text-sky-400 mt-1">
                {dashboardData.topDay.views.toLocaleString('pt-BR')} visualizações
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-1">Sem dados no período</p>
          )}
          <p className="text-[10px] text-slate-400">Pico de acesso registrado</p>
        </div>
      </div>

      {/* 3.1 Painel de Comparação com Período Anterior (Etapa 19.6) */}
      {dashboardData && !loading && (
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059]">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Comparação com Período Anterior
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    Mesma duração
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Evolução comparativa entre o período selecionado e o período imediatamente anterior
                </p>
              </div>
            </div>

            {/* Badge de Variação Geral */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 rounded-xl border ${
                  dashboardData.comparison.trend === 'up'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : dashboardData.comparison.trend === 'down'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : dashboardData.comparison.trend === 'neutral'
                    ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {dashboardData.comparison.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                {dashboardData.comparison.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                {dashboardData.comparison.formattedPercentage}
              </span>
            </div>
          </div>

          {/* Grid Comparativo: Período Atual vs Período Anterior */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Bloco 1: Período Atual */}
            <div className="bg-[#070D18] border border-white/10 rounded-xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider block">
                Período Selecionado (Atual)
              </span>
              <p className="text-xl sm:text-2xl font-black text-white">
                {dashboardData.totalPeriodViews.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">views</span>
              </p>
              <p className="text-xs text-slate-400 truncate">
                {formatYMDToBR(dashboardData.startDate)} a {formatYMDToBR(dashboardData.endDate)}
              </p>
            </div>

            {/* Bloco 2: Período Anterior */}
            <div className="bg-[#070D18] border border-white/10 rounded-xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Período Equivalente Anterior
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-300">
                {dashboardData.comparison.previousTotal.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">views</span>
              </p>
              <p className="text-xs text-slate-400 capitalize truncate">
                {dashboardData.comparison.previousPeriodLabel}
              </p>
            </div>

            {/* Bloco 3: Variação Absoluta e Percentual */}
            <div className="bg-[#070D18] border border-white/10 rounded-xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Variação Real
              </span>
              <p
                className={`text-xl sm:text-2xl font-black ${
                  dashboardData.comparison.difference > 0
                    ? 'text-emerald-400'
                    : dashboardData.comparison.difference < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {dashboardData.comparison.difference > 0 ? '+' : ''}
                {dashboardData.comparison.difference.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">views</span>
              </p>
              <p className="text-xs text-slate-400">
                {dashboardData.comparison.statusDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Barra de Filtros de Período e Pesquisa */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-4 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Seletor de Períodos Rápidos */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Selecione o Período
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'today', label: 'Hoje' },
                { key: 'yesterday', label: 'Ontem' },
                { key: 'last7days', label: 'Últimos 7 dias' },
                { key: 'last30days', label: 'Últimos 30 dias' },
                { key: 'thisMonth', label: 'Este Mês' },
                { key: 'lastMonth', label: 'Mês Anterior' },
                { key: 'all', label: 'Todo o Período' },
                { key: 'custom', label: 'Personalizado' },
              ].map((p) => {
                const isActive = period === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPeriod(p.key as AnalyticsPeriod)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#C5A059] text-[#070D18] font-bold shadow-md'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por Rota/Página e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Dropdown de Página */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Filtrar por Página
              </label>
              <div className="relative">
                <select
                  value={pageFilter}
                  onChange={(e) => setPageFilter(e.target.value)}
                  className="w-full sm:w-48 bg-[#070D18] border border-white/15 text-white rounded-xl px-3 py-2 text-xs focus:border-[#C5A059] focus:outline-none appearance-none pr-8 cursor-pointer"
                >
                  <option value="">Todas as Páginas</option>
                  <option value="/">Página Inicial (/)</option>
                  <option value="/galeria">Galeria (/galeria)</option>
                  <option value="/documentos">Documentos (/documentos)</option>
                  <option value="/solicitar-proposta">Solicitar Proposta</option>
                  {availablePages
                    .filter((p) => !['/', '/galeria', '/documentos', '/solicitar-proposta'].includes(p))
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pesquisar Rota
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: memorial, laudo, galeria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-56 bg-[#070D18] border border-white/15 text-white rounded-xl pl-8 pr-3 py-2 text-xs focus:border-[#C5A059] focus:outline-none placeholder:text-slate-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Inputs de Período Personalizado (Quando selecionado 'custom') */}
        {period === 'custom' && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3 bg-[#070D18]/50 p-3 rounded-xl">
            <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" /> Período Personalizado:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-[#0B1526] border border-white/15 text-white rounded-lg px-3 py-1.5 text-xs focus:border-[#C5A059] focus:outline-none"
              />
              <span className="text-slate-500 text-xs">até</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-[#0B1526] border border-white/15 text-white rounded-lg px-3 py-1.5 text-xs focus:border-[#C5A059] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="px-3 py-1.5 rounded-lg bg-[#C5A059] text-black font-bold text-xs hover:bg-[#b08e4c] transition-all cursor-pointer"
            >
              Aplicar Datas
            </button>
          </div>
        )}
      </div>

      {/* 5. Gráfico de Evolução Diária */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
            <div>
              <h3 className="text-base font-bold text-white">
                Evolução Diária de Visualizações
              </h3>
              <p className="text-xs text-slate-400">
                Distribuição temporal dos acessos dia a dia no período
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {hoveredDay ? (
              <span className="text-[#C5A059] font-bold bg-[#C5A059]/10 px-2.5 py-1 rounded-lg border border-[#C5A059]/20">
                {hoveredDay.displayDate}: {hoveredDay.views} {hoveredDay.views === 1 ? 'visualização' : 'visualizações'}
              </span>
            ) : (
              <span>Passe o cursor sobre as barras para ver os detalhes diários</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin" />
            <p className="text-xs text-slate-400">Processando métricas diárias...</p>
          </div>
        ) : !dashboardData?.dailyMetrics || dashboardData.dailyMetrics.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center space-y-2 text-center p-6 bg-white/[0.02] rounded-xl border border-white/5">
            <BarChart3 className="w-8 h-8 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma visualização registrada no período selecionado.</p>
            <p className="text-xs text-slate-500 max-w-sm">
              As visualizações são contabilizadas automaticamente quando os visitantes navegam pelas páginas públicas do site.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Gráfico em Barras Flexíveis e Responsivas com Tooltips */}
            <div className="h-56 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1 overflow-x-auto">
              {dashboardData.dailyMetrics.map((day) => {
                const heightPercent = Math.max(
                  Math.round((day.views / maxDailyViews) * 100),
                  day.views > 0 ? 8 : 2
                );
                const isHovered = hoveredDay?.date === day.date;
                const isPeak = dashboardData.topDay?.date === day.date && day.views > 0;

                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 min-w-[20px] max-w-[48px] h-full flex flex-col justify-end items-center group cursor-pointer"
                  >
                    {/* Indicador de valor no topo da barra em hover */}
                    <span
                      className={`text-[9px] font-bold mb-1 transition-all ${
                        isHovered
                          ? 'text-[#C5A059] scale-110 opacity-100'
                          : isPeak
                          ? 'text-amber-400 opacity-90'
                          : 'text-slate-400 opacity-0 sm:group-hover:opacity-100'
                      }`}
                    >
                      {day.views}
                    </span>

                    {/* Barra Vertical */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 relative ${
                        isHovered
                          ? 'bg-[#C5A059] shadow-lg shadow-[#C5A059]/30 scale-x-105'
                          : isPeak
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                          : 'bg-gradient-to-t from-[#C5A059]/40 to-[#C5A059] hover:from-[#C5A059] hover:to-[#dfbb6c]'
                      }`}
                    />

                    {/* Rótulo da Data no Eixo X */}
                    <span className="text-[9px] text-slate-400 mt-2 font-medium truncate w-full text-center group-hover:text-white">
                      {day.displayDate}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rodapé informativo do gráfico com métricas complementares (Etapa 19.6) */}
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>
                  Dias com registro: <strong className="text-white">{dashboardData.dailyMetrics.length}</strong>
                </span>
                <span>
                  Média diária:{' '}
                  <strong className="text-[#C5A059]">
                    {dashboardData.dailyMetrics.length > 0
                      ? (dashboardData.totalPeriodViews / dashboardData.dailyMetrics.length).toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })
                      : '0'}{' '}
                    views/dia
                  </strong>
                </span>
              </div>
              {dashboardData.topDay && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Pico de acesso:{' '}
                    <strong>
                      {dashboardData.topDay.displayDate} ({dashboardData.topDay.views} views)
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Tabela / Ranking de Páginas Mais Visualizadas (Etapa 19.6) */}
      <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Ranking de Páginas Mais Visualizadas
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Ordenado por Acessos
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Páginas públicas acessadas e sua representatividade no período selecionado
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Total de páginas no ranking: <span className="text-white font-bold">{dashboardData?.pageMetrics.length || 0}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#C5A059] mx-auto mb-2" />
            Carregando detalhamento de páginas...
          </div>
        ) : !dashboardData?.pageMetrics || dashboardData.pageMetrics.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] rounded-xl border border-white/5 space-y-2">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Nenhum registro encontrado com os filtros atuais.</p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-[#C5A059] hover:underline font-bold"
              >
                Limpar busca por termo
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Ranking / Página</th>
                  <th className="py-3 px-3 text-right">Visualizações</th>
                  <th className="py-3 px-3 text-left w-1/3 min-w-[140px]">Participação</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dashboardData.pageMetrics.map((page, index) => {
                  const rankNumber = index + 1;
                  const isFirst = rankNumber === 1;
                  const isSecond = rankNumber === 2;
                  const isThird = rankNumber === 3;

                  return (
                    <tr
                      key={page.path}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Ranking, Nome amigável e caminho */}
                      <td className="py-3.5 px-3 space-y-0.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full font-extrabold text-[11px] flex items-center justify-center shrink-0 border ${
                              isFirst
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                                : isSecond
                                ? 'bg-slate-300/20 text-slate-200 border-slate-300/40'
                                : isThird
                                ? 'bg-amber-800/30 text-amber-400 border-amber-800/50'
                                : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                          >
                            {rankNumber}º
                          </span>
                          <span className="font-bold text-white text-sm group-hover:text-[#C5A059] transition-colors">
                            {page.friendlyName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block pl-8.5">
                          {page.path}
                        </span>
                      </td>

                      {/* Contagem de Views */}
                      <td className="py-3.5 px-3 text-right font-bold text-white text-sm">
                        {page.views.toLocaleString('pt-BR')}
                      </td>

                      {/* Barra de Progresso Visual */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 font-semibold">{page.percentage}%</span>
                            <span className="text-slate-500">{page.views} de {dashboardData.totalPeriodViews}</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(page.percentage, 100)}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFirst
                                  ? 'bg-gradient-to-r from-amber-500 to-[#C5A059]'
                                  : 'bg-gradient-to-r from-[#C5A059]/70 to-[#C5A059]'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Ações: Testar Rota, Isolar ou Excluir Estatísticas da Página */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={page.path}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                            title="Abrir página pública em nova aba"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPageFilter(page.path === pageFilter ? '' : page.path)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                              pageFilter === page.path
                                ? 'bg-[#C5A059] text-black font-bold'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                            title="Isolar estatísticas desta página no gráfico"
                          >
                            {pageFilter === page.path ? 'Isolada' : 'Isolar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDeletePage(page.path)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                            title="Excluir visualizações desta página no período selecionado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. ETAPA 19.4 — GERENCIAMENTO E LIMPEZA DE ESTATÍSTICAS */}
      <div className="bg-[#0B1526] border border-rose-500/20 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
        {/* Glow sutil */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho da Seção de Limpeza */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif">
                Gerenciamento e Limpeza de Dados de Estatísticas
              </h3>
              <p className="text-xs text-slate-400">
                Exclua dados antigos ou seleções específicas com remoção real no banco de dados e registro compulsório de auditoria.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-rose-300/80 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 self-start sm:self-auto">
            Acesso Restrito: Administrador
          </span>
        </div>

        {/* Seletor do Tipo de Exclusão */}
        <div className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Escolha a Modalidade de Exclusão:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteMode('day')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  deleteMode === 'day'
                    ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-md'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <CalendarDays className={`w-4 h-4 shrink-0 ${deleteMode === 'day' ? 'text-rose-400' : 'text-slate-500'}`} />
                <div>
                  <span className="text-xs font-bold block text-white">Dia Específico</span>
                  <span className="text-[10px] text-slate-400">Limpar visualizações de 1 data</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeleteMode('month')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  deleteMode === 'month'
                    ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-md'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Calendar className={`w-4 h-4 shrink-0 ${deleteMode === 'month' ? 'text-rose-400' : 'text-slate-500'}`} />
                <div>
                  <span className="text-xs font-bold block text-white">Mês Completo</span>
                  <span className="text-[10px] text-slate-400">Limpar dados de um mês inteiro</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeleteMode('custom')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  deleteMode === 'custom'
                    ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-md'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Clock className={`w-4 h-4 shrink-0 ${deleteMode === 'custom' ? 'text-rose-400' : 'text-slate-500'}`} />
                <div>
                  <span className="text-xs font-bold block text-white">Período Personalizado</span>
                  <span className="text-[10px] text-slate-400">Intervalo customizado de datas</span>
                </div>
              </button>
            </div>
          </div>

          {/* Painel com Parâmetros da Modalidade Escolhida */}
          <div className="bg-[#070D18] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
            {/* Opção 1: Dia Específico */}
            {deleteMode === 'day' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Data para Exclusão:
                  </label>
                  <input
                    type="date"
                    value={deleteTargetDate}
                    max={formatLocalDateToYMD()}
                    onChange={(e) => setDeleteTargetDate(e.target.value)}
                    className="w-full bg-[#0B1526] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-rose-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">
                    Formato: DD/MM/AAAA.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Alvo da Página (Opcional):
                  </label>
                  <select
                    value={deletePageFilter}
                    onChange={(e) => setDeletePageFilter(e.target.value)}
                    className="w-full bg-[#0B1526] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Todas as Páginas no dia</option>
                    <option value="/">Página Inicial (/)</option>
                    <option value="/galeria">Galeria (/galeria)</option>
                    <option value="/documentos">Documentos (/documentos)</option>
                    <option value="/solicitar-proposta">Solicitar Proposta</option>
                    {availablePages
                      .filter((p) => !['/', '/galeria', '/documentos', '/solicitar-proposta'].includes(p))
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                  <span className="text-[10px] text-slate-500">
                    Selecione uma rota específica ou todas do dia.
                  </span>
                </div>
              </div>
            )}

            {/* Opção 2: Mês Completo */}
            {deleteMode === 'month' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Mês:
                  </label>
                  <select
                    value={deleteTargetMonth}
                    onChange={(e) => setDeleteTargetMonth(Number(e.target.value))}
                    className="w-full bg-[#0B1526] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    {[
                      { num: 1, name: 'Janeiro' },
                      { num: 2, name: 'Fevereiro' },
                      { num: 3, name: 'Março' },
                      { num: 4, name: 'Abril' },
                      { num: 5, name: 'Maio' },
                      { num: 6, name: 'Junho' },
                      { num: 7, name: 'Julho' },
                      { num: 8, name: 'Agosto' },
                      { num: 9, name: 'Setembro' },
                      { num: 10, name: 'Outubro' },
                      { num: 11, name: 'Novembro' },
                      { num: 12, name: 'Dezembro' },
                    ].map((m) => (
                      <option key={m.num} value={m.num}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Ano:
                  </label>
                  <select
                    value={deleteTargetYear}
                    onChange={(e) => setDeleteTargetYear(Number(e.target.value))}
                    className="w-full bg-[#0B1526] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    {[2026, 2025, 2024, 2023].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Alvo da Página (Opcional):
                  </label>
                  <select
                    value={deletePageFilter}
                    onChange={(e) => setDeletePageFilter(e.target.value)}
                    className="w-full bg-[#0B1526] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Todas as Páginas no mês</option>
                    <option value="/">Página Inicial (/)</option>
                    <option value="/galeria">Galeria (/galeria)</option>
                    <option value="/documentos">Documentos (/documentos)</option>
                    <option value="/solicitar-proposta">Solicitar Proposta</option>
                    {availablePages
                      .filter((p) => !['/', '/galeria', '/documentos', '/solicitar-proposta'].includes(p))
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Opção 3: Período Personalizado */}
            {deleteMode === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Data Inicial:
                  </label>
                  <input
                    type="date"
                    value={deleteCustomStart}
                    max={formatLocalDateToYMD()}
                    onChange={(e) => setDeleteCustomStart(e.target.value)}
                    className="w-full bg-[#0B1526] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Data Final:
                  </label>
                  <input
                    type="date"
                    value={deleteCustomEnd}
                    max={formatLocalDateToYMD()}
                    onChange={(e) => setDeleteCustomEnd(e.target.value)}
                    className="w-full bg-[#0B1526] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Alvo da Página (Opcional):
                  </label>
                  <select
                    value={deletePageFilter}
                    onChange={(e) => setDeletePageFilter(e.target.value)}
                    className="w-full bg-[#0B1526] border border-white/15 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Todas as Páginas no intervalo</option>
                    <option value="/">Página Inicial (/)</option>
                    <option value="/galeria">Galeria (/galeria)</option>
                    <option value="/documentos">Documentos (/documentos)</option>
                    <option value="/solicitar-proposta">Solicitar Proposta</option>
                    {availablePages
                      .filter((p) => !['/', '/galeria', '/documentos', '/solicitar-proposta'].includes(p))
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Botão de Disparo da Prévia */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                Ao clicar abaixo, o sistema calculará os registros reais afetados e solicitará sua confirmação prévia obrigatória.
              </p>
              <button
                type="button"
                onClick={() => handleRequestDeletionPreview()}
                disabled={loadingPreview}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] shrink-0"
              >
                {loadingPreview ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculando Prévia...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Consultar e Excluir Estatísticas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 8. MODAL DE CONFIRMAÇÃO OBRIGATÓRIA & PRÉVIA DA EXCLUSÃO */}
      {showDeleteModal && activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-rose-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-rose-950/60 to-[#0B1526] border-b border-white/10 p-5 sm:p-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-serif">
                    Confirmar Exclusão de Estatísticas
                  </h3>
                  <span className="text-xs text-rose-300 font-medium">
                    Ação Destrutiva e Irreversível
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !deleting && setShowDeleteModal(false)}
                disabled={deleting}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Resumo Real dos Dados */}
            <div className="p-5 sm:p-6 space-y-5">
              <p className="text-xs text-slate-300 leading-relaxed">
                Você solicitou a exclusão definitiva de estatísticas de visualização. Confira os parâmetros e o volume de dados localizados no banco de dados:
              </p>

              {/* Quadro de Resumo */}
              <div className="bg-[#070D18] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-slate-400">Escopo da Seleção:</span>
                  <span className="font-bold text-white text-right">{activePreview.label}</span>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-slate-400">Período de Datas:</span>
                  <span className="font-mono text-[#C5A059] font-semibold text-right">
                    {formatYMDToBR(activePreview.startDate, true)} até {formatYMDToBR(activePreview.endDate, true)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-slate-400">Página Alvo:</span>
                  <span className="font-bold text-slate-200 text-right">
                    {activePreview.pagePath ? `${getPageFriendlyName(activePreview.pagePath)} (${activePreview.pagePath})` : 'Todas as páginas'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-slate-400">Registros Encontrados:</span>
                  <span className="font-extrabold text-white text-right">
                    {activePreview.recordsCount} {activePreview.recordsCount === 1 ? 'linha' : 'linhas'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-bold">Total de Visualizações:</span>
                  <span className="text-base font-black text-rose-400 text-right">
                    {activePreview.viewsCount.toLocaleString('pt-BR')} visualizações
                  </span>
                </div>
              </div>

              {activePreview.recordsCount === 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Nenhum registro de visualização foi encontrado no período selecionado. A execução não alterará dados existentes.
                  </span>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    Esta operação removerá os dados definitivamente do Supabase e registrará seu e-mail ({user?.email || profile?.email || 'admin'}) no log de auditoria administrativa.
                  </span>
                </div>
              )}
            </div>

            {/* Ações do Modal */}
            <div className="bg-[#070D18] border-t border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDeletion}
                disabled={deleting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Excluindo do Supabase...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Exclusão Definitiva</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL DE DIAGNÓSTICO DE INTEGRIDADE E PROTEÇÃO (ETAPA 19.5) */}
      {showIntegrityModal && integrityReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1526] border border-emerald-500/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-[#0B1526] border-b border-white/10 p-5 sm:p-6 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-serif">
                    Auditoria de Integridade das Estatísticas
                  </h3>
                  <span className="text-xs text-emerald-300 font-medium">
                    Diagnóstico Automático de Consistência e Proteção
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIntegrityModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal (Scrollável) */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Status Principal */}
              {integrityReport.isHealthy ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-white text-sm">Base de Dados 100% Íntegra e Consistente</h4>
                    <p className="text-emerald-300 leading-relaxed">
                      Nenhuma anomalia, rota corrompida, string nula ou inconsistência numérica foi detectada entre os {integrityReport.totalRecordsChecked.toLocaleString('pt-BR')} registros examinados.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-white text-sm">Registros Inconsistentes Localizados</h4>
                    <p className="text-amber-300 leading-relaxed">
                      Foram identificados {integrityReport.invalidRecordsCount} {integrityReport.invalidRecordsCount === 1 ? 'registro com formato atípico' : 'registros com formato atípico'} na base de dados.
                    </p>
                  </div>
                </div>
              )}

              {/* Quadro de Métricas da Auditoria */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#070D18] border border-white/10 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Registros Auditados
                  </span>
                  <span className="text-xl font-extrabold text-white">
                    {integrityReport.totalRecordsChecked.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="bg-[#070D18] border border-white/10 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Anomalias Encontradas
                  </span>
                  <span className={`text-xl font-extrabold ${integrityReport.invalidRecordsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {integrityReport.invalidRecordsCount}
                  </span>
                </div>

                <div className="bg-[#070D18] border border-white/10 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Data da Inspeção
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {new Date(integrityReport.checkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Resumo das Proteções Ativas da Etapa 19.5 */}
              <div className="bg-[#070D18] border border-white/10 rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#C5A059]" /> Proteções e Salvaguardas Ativas no Sistema
                </h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Normalização Estrita:</strong> Todas as rotas passam por padronização com limite de 255 caracteres, remoção de query strings, hashes e barras duplicadas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Prevenção de Duplo Disparo:</strong> Debounce e ref de transição no cliente previnem duplicações causadas por StrictMode ou re-renderizações simultâneas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Agregação Atômica Positiva:</strong> A função RPC do Supabase garante apenas incrementos estritamente positivos (+1) por data e página.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Isolamento de Erros:</strong> Falhas de conectividade ou rede são silenciadas no cliente sem afetar a navegação institucional do usuário.</span>
                  </li>
                </ul>
              </div>

              {/* Tabela de Anomalias (caso existam) */}
              {integrityReport.anomalies && integrityReport.anomalies.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-amber-300">
                    Detalhes dos Registros com Formato Atípico ({integrityReport.anomalies.length})
                  </h5>
                  <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl bg-[#070D18]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                        <tr>
                          <th className="p-2">Data</th>
                          <th className="p-2">Caminho</th>
                          <th className="p-2 text-right">Views</th>
                          <th className="p-2">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {integrityReport.anomalies.map((anom) => (
                          <tr key={anom.id}>
                            <td className="p-2 font-mono">{anom.visit_date}</td>
                            <td className="p-2 font-mono truncate max-w-[140px]">{anom.page_path || '(vazio)'}</td>
                            <td className="p-2 text-right font-bold">{anom.views}</td>
                            <td className="p-2 text-amber-300">{anom.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="bg-[#070D18] border-t border-white/10 p-4 sm:p-5 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowIntegrityModal(false)}
                className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08e4c] text-black font-bold text-xs transition-all cursor-pointer"
              >
                Concluir Diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Nota Técnica de Privacidade e Auditoria */}
      <div className="bg-[#08101E] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-slate-400 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-slate-200 block">Privacidade, Integridade e Conformidade LGPD</span>
          <p>
            As estatísticas deste painel são calculadas por agregação atômica no banco de dados (Supabase PostgreSQL), sem utilização de plataformas de rastreamento invasivo de terceiros. A integridade estrutural, a sanitização rigorosa de rotas e a proteção contra duplicações garantem dados leves, consistentes e auditáveis sob a tabela <code className="text-slate-300 font-mono">public.admin_audit_logs</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
