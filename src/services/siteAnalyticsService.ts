// /src/services/siteAnalyticsService.ts
import { supabase } from '../lib/supabase';
import { supabaseDatabase } from './supabaseDatabase';
import type {
  SiteVisitStat,
  AnalyticsSummary,
  PageViewMetric,
  DailyViewMetric,
  RecordViewResult,
  AnalyticsFilterOptions,
  AnalyticsPeriod,
  AnalyticsDashboardData,
  PeriodComparisonResult,
  TopPageHighlight,
  TopDayHighlight,
  DeletionPreview,
  DeletionResult,
  DeletionScopeType,
  StatsIntegrityReport,
  StatsIntegrityAnomaly,
} from '../types/analytics';

/**
 * Cache leve em memória de eventos recentes de rastreamento para prevenir duplo registro
 * causado por React StrictMode, trocas de estado de componentes ou re-renderizações simultâneas.
 */
const recentPageTrackingMap = new Map<string, number>();
const RECENT_TRACKING_COOLDOWN_MS = 2500; // 2.5 segundos de cooldown para a MESMA rota

/**
 * Limpa periodicamente entradas antigas do cache em memória para manter o consumo de memória mínimo
 */
function cleanupRecentTrackingCache(): void {
  const now = Date.now();
  for (const [key, timestamp] of recentPageTrackingMap.entries()) {
    if (now - timestamp > 30000) { // 30 segundos
      recentPageTrackingMap.delete(key);
    }
  }
}

/**
 * Valida rigorosamente se o identificador de página é válido para registro estatístico:
 * - Deve ser string não nula e não vazia
 * - Não pode conter valores de conversão acidental (ex: 'undefined', 'null', '[object Object]')
 * - Não pode exceder o limite razoável de 255 caracteres
 * - Não pode ser rota administrativa ou de autenticação
 */
export function isValidAnalyticsPath(rawPath: unknown): boolean {
  if (rawPath === null || rawPath === undefined || typeof rawPath !== 'string') {
    return false;
  }

  const trimmed = rawPath.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed.includes('[object') || trimmed.includes('<script')) {
    return false;
  }

  if (trimmed.length > 255) {
    return false;
  }

  return !isIgnoredRoute(trimmed);
}

/**
 * Verifica se uma rota deve ser ignorada pela contabilização de visualizações públicas:
 * - Rotas administrativas (/admin, /admin/*)
 * - Rotas de autenticação (/login, /login/*)
 * - Rotas técnicas ou arquivos estáticos
 */
export function isIgnoredRoute(rawPath: string | null | undefined): boolean {
  if (!rawPath || typeof rawPath !== 'string') return true;
  
  const norm = normalizeAnalyticsPath(rawPath);
  if (!norm) return true;
  
  // Ignora rotas administrativas
  if (norm === '/admin' || norm.startsWith('/admin/')) {
    return true;
  }
  
  // Ignora rotas de autenticação
  if (norm === '/login' || norm.startsWith('/login/')) {
    return true;
  }

  // Ignora arquivos e rotas técnicas
  if (norm.startsWith('/api/') || norm.startsWith('/assets/') || norm.includes('.')) {
    return true;
  }

  return false;
}

/**
 * Determina se a rota atual é pública e válida para contabilização
 */
export function shouldTrackPath(rawPath: string | null | undefined): boolean {
  return isValidAnalyticsPath(rawPath) && !isIgnoredRoute(rawPath);
}

/**
 * Normaliza caminhos de página para garantir agregação precisa e consistente:
 * - Garante barra inicial ('/').
 * - Remove query strings ('?utm=...') e fragmentos de âncora ('#section').
 * - Remove barras duplicadas ('//').
 * - Remove barra final ('/galeria/' -> '/galeria'), exceto para raiz ('/').
 * - Converte para minúsculas e remove espaços.
 * - Limite razoável de 255 caracteres (rejeita se ultrapassar em vez de truncar).
 */
export function normalizeAnalyticsPath(rawPath: string | null | undefined): string {
  if (!rawPath || typeof rawPath !== 'string') {
    return '/';
  }

  let normalized = rawPath.trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return '/';
  }

  // Rejeita caminhos que excedam o limite máximo
  if (normalized.length > 255) {
    return '/';
  }

  // Garante que comece com barra
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  // Remove query params e hash fragments
  normalized = normalized.split('?')[0].split('#')[0];

  // Remove barras duplicadas consecutivas
  normalized = normalized.replace(/\/+/g, '/');

  // Converte para minúsculas
  normalized = normalized.toLowerCase().trim();

  // Remove barra final se não for a raiz
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  // Se após normalização estiver vazia ou exceder 255 caracteres, retorna raiz segura
  if (!normalized || normalized.length > 255) {
    return '/';
  }

  return normalized;
}

/**
 * Retorna um nome descritivo e amigável para exibição na interface administrativa
 */
export function getPageFriendlyName(rawPath: string | null | undefined): string {
  const norm = normalizeAnalyticsPath(rawPath);

  if (norm === '/') return 'Página Inicial (Home)';
  if (norm === '/galeria') return 'Galeria de Obras e Mídias';
  if (norm === '/documentos') return 'Central de Documentos Técnicos';
  if (norm === '/solicitar-proposta') return 'Solicitação de Proposta e Orçamento';
  if (norm === '/artigos') return 'Artigos e Laudos Periciais';

  if (norm.startsWith('/documentos/')) {
    const slug = norm.replace('/documentos/', '').replace(/-/g, ' ');
    const capitalized = slug.charAt(0).toUpperCase() + slug.slice(1);
    return `Documento: ${capitalized}`;
  }

  if (norm.startsWith('/artigos/')) {
    const slug = norm.replace('/artigos/', '').replace(/-/g, ' ');
    const capitalized = slug.charAt(0).toUpperCase() + slug.slice(1);
    return `Artigo: ${capitalized}`;
  }

  // Nome padrão com primeira letra maiúscula
  const clean = norm.replace(/^\//, '').replace(/-/g, ' ');
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : norm;
}

/**
 * Formata uma data para YYYY-MM-DD no fuso horário local
 */
export function formatLocalDateToYMD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data YYYY-MM-DD para exibição brasileira DD/MM ou DD/MM/AAAA
 */
export function formatYMDToBR(ymd: string, includeYear: boolean = false): string {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  const [year, month, day] = parts;
  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

/**
 * Calcula intervalo de datas para os períodos pré-definidos
 */
export function getPeriodDateRange(
  period: AnalyticsPeriod,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const todayStr = formatLocalDateToYMD(now);

  if (period === 'today') {
    return { startDate: todayStr, endDate: todayStr, label: 'Hoje' };
  }

  if (period === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDateToYMD(yesterday);
    return { startDate: yesterdayStr, endDate: yesterdayStr, label: 'Ontem' };
  }

  if (period === 'last7days') {
    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 6);
    return { startDate: formatLocalDateToYMD(d7), endDate: todayStr, label: 'Últimos 7 dias' };
  }

  if (period === 'last30days') {
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 29);
    return { startDate: formatLocalDateToYMD(d30), endDate: todayStr, label: 'Últimos 30 dias' };
  }

  if (period === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: formatLocalDateToYMD(firstDay), endDate: todayStr, label: 'Este mês' };
  }

  if (period === 'lastMonth') {
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: formatLocalDateToYMD(firstDayLastMonth),
      endDate: formatLocalDateToYMD(lastDayLastMonth),
      label: 'Mês anterior',
    };
  }

  if (period === 'custom' && customStart && customEnd) {
    return {
      startDate: customStart,
      endDate: customEnd,
      label: `Período (${formatYMDToBR(customStart, true)} a ${formatYMDToBR(customEnd, true)})`,
    };
  }

  // 'all' ou fallback
  return {
    startDate: '2020-01-01',
    endDate: todayStr,
    label: 'Todo o período',
  };
}

/**
 * Calcula o período equivalente imediatamente anterior para comparação percentual
 */
export function getPreviousPeriodDateRange(
  startDate: string,
  endDate: string
): { startDate: string; endDate: string } {
  try {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);

    return {
      startDate: formatLocalDateToYMD(prevStart),
      endDate: formatLocalDateToYMD(prevEnd),
    };
  } catch {
    return { startDate, endDate };
  }
}

/**
 * Registra/incrementa atômica e seguramente uma visualização no Supabase:
 * - Valida integridade do identificador de rota (evita strings vazias, valores nulos ou URLs excessivas)
 * - Proteção em memória contra duplo registro imediato da mesma rota (React StrictMode, re-renderizações)
 * - Executa a RPC segura 'increment_page_view' com agregação por data e página
 * - Em caso de erro ou falha no banco, NÃO lança exceção para não interromper a navegação institucional
 */
export async function recordPageView(
  rawPath: string,
  customDate?: string
): Promise<RecordViewResult> {
  // 1. Validação estrita de rota pública
  if (!shouldTrackPath(rawPath)) {
    return {
      success: true,
      normalizedPath: '/',
    };
  }

  const normalizedPath = normalizeAnalyticsPath(rawPath);
  if (!normalizedPath || normalizedPath.length > 255) {
    return {
      success: false,
      error: 'Identificador de rota inválido ou superior a 255 caracteres',
    };
  }

  // 2. Proteção contra duplo disparo na mesma rota (cooldown leve)
  const now = Date.now();
  const lastTracked = recentPageTrackingMap.get(normalizedPath);

  if (lastTracked && now - lastTracked < RECENT_TRACKING_COOLDOWN_MS) {
    // Chamada ignorada com segurança (já registrada recentemente neste ciclo)
    return {
      success: true,
      normalizedPath,
    };
  }

  // Registra no cache em memória
  recentPageTrackingMap.set(normalizedPath, now);
  cleanupRecentTrackingCache();

  // 3. Data alvo sanitizada
  const targetDate = customDate || formatLocalDateToYMD();

  try {
    const { data, error } = await supabase.rpc('increment_page_view', {
      p_page_path: normalizedPath,
      p_visit_date: targetDate,
    });

    if (error) {
      if (import.meta.env.DEV) {
        console.warn('[siteAnalyticsService] Falha não impeditiva ao registrar visualização (RPC):', error.message || error);
      }
      return {
        success: false,
        normalizedPath,
        error: error.message,
      };
    }

    return {
      success: true,
      views: typeof data === 'number' ? data : Number(data) || 1,
      normalizedPath,
    };
  } catch (err: any) {
    if (import.meta.env.DEV) {
      console.warn('[siteAnalyticsService] Exceção capturada ao registrar visualização:', err?.message || err);
    }
    return {
      success: false,
      normalizedPath,
      error: err?.message || 'Erro inesperado ao registrar estatística',
    };
  }
}

/**
 * Busca estatísticas agregadas por período (Acesso administrativo)
 */
export async function getDailyStats(
  options: AnalyticsFilterOptions = {}
): Promise<SiteVisitStat[]> {
  try {
    let query = supabase
      .from('site_visit_stats')
      .select('*')
      .order('visit_date', { ascending: false })
      .order('views', { ascending: false });

    if (options.startDate) {
      query = query.gte('visit_date', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('visit_date', options.endDate);
    }

    if (options.pagePath) {
      const norm = normalizeAnalyticsPath(options.pagePath);
      query = query.eq('page_path', norm);
    }

    if (options.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[siteAnalyticsService] Erro ao buscar estatísticas diárias:', error);
      throw new Error(error.message || 'Falha ao buscar estatísticas.');
    }

    return (data as SiteVisitStat[]) || [];
  } catch (err: any) {
    console.error('[siteAnalyticsService] Falha na consulta de estatísticas:', err);
    return [];
  }
}

/**
 * Busca estatísticas específicas de uma determinada página
 */
export async function getPageStats(
  rawPagePath: string,
  startDate?: string,
  endDate?: string
): Promise<SiteVisitStat[]> {
  const normalizedPath = normalizeAnalyticsPath(rawPagePath);
  return getDailyStats({
    pagePath: normalizedPath,
    startDate,
    endDate,
  });
}

/**
 * Consulta e consolida os dados completos para o Painel Administrativo de Estatísticas (Etapa 19.3)
 */
export async function getAnalyticsDashboardData(options: {
  period: AnalyticsPeriod;
  customStart?: string;
  customEnd?: string;
  pageFilter?: string;
  search?: string;
}): Promise<AnalyticsDashboardData> {
  const { period, customStart, customEnd, pageFilter, search } = options;
  const { startDate, endDate, label: periodLabel } = getPeriodDateRange(period, customStart, customEnd);
  const prevPeriod = getPreviousPeriodDateRange(startDate, endDate);

  const todayStr = formatLocalDateToYMD();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatLocalDateToYMD(yesterdayDate);

  const d7Date = new Date();
  d7Date.setDate(d7Date.getDate() - 6);
  const d7Str = formatLocalDateToYMD(d7Date);

  const d30Date = new Date();
  d30Date.setDate(d30Date.getDate() - 29);
  const d30Str = formatLocalDateToYMD(d30Date);

  try {
    // 1. Busca estatísticas do período selecionado e do período anterior em paralelo
    const [currentStats, prevStats, global30Stats] = await Promise.all([
      getDailyStats({
        startDate,
        endDate,
        pagePath: pageFilter ? normalizeAnalyticsPath(pageFilter) : undefined,
      }),
      getDailyStats({
        startDate: prevPeriod.startDate,
        endDate: prevPeriod.endDate,
        pagePath: pageFilter ? normalizeAnalyticsPath(pageFilter) : undefined,
      }),
      getDailyStats({
        startDate: d30Str,
        endDate: todayStr,
      }),
    ]);

    // 2. Calcula indicadores globais fixos (Hoje, Ontem, 7d, 30d)
    let todayViews = 0;
    let yesterdayViews = 0;
    let last7DaysViews = 0;
    let last30DaysViews = 0;

    for (const item of global30Stats) {
      const v = item.views || 0;
      if (item.visit_date === todayStr) todayViews += v;
      if (item.visit_date === yesterdayStr) yesterdayViews += v;
      if (item.visit_date >= d7Str) last7DaysViews += v;
      if (item.visit_date >= d30Str) last30DaysViews += v;
    }

    // 3. Processa dados do período selecionado
    let totalPeriodViews = 0;
    const dailyMap: Record<string, number> = {};
    const pageMap: Record<string, number> = {};

    for (const item of currentStats) {
      const v = item.views || 0;
      totalPeriodViews += v;
      dailyMap[item.visit_date] = (dailyMap[item.visit_date] || 0) + v;
      pageMap[item.page_path] = (pageMap[item.page_path] || 0) + v;
    }

    // 4. Processa comparação com período anterior (Etapa 19.6)
    let previousTotal = 0;
    for (const item of prevStats) {
      previousTotal += item.views || 0;
    }

    const difference = totalPeriodViews - previousTotal;
    let percentageChange: number | null = null;
    let formattedPercentage = '0%';
    let statusDescription = '';
    let trend: 'up' | 'down' | 'neutral' | 'no_data' = 'no_data';

    let previousPeriodLabel = '';
    if (period === 'today') previousPeriodLabel = 'ontem';
    else if (period === 'yesterday') previousPeriodLabel = 'anteontem';
    else if (period === 'last7days') previousPeriodLabel = '7 dias anteriores';
    else if (period === 'last30days') previousPeriodLabel = '30 dias anteriores';
    else if (period === 'thisMonth') previousPeriodLabel = 'período equivalente do mês anterior';
    else if (period === 'lastMonth') previousPeriodLabel = 'mês retrasado';
    else if (period === 'custom') previousPeriodLabel = `${formatYMDToBR(prevPeriod.startDate, true)} a ${formatYMDToBR(prevPeriod.endDate, true)}`;
    else previousPeriodLabel = 'período anterior';

    if (previousTotal > 0) {
      const rawPct = ((totalPeriodViews - previousTotal) / previousTotal) * 100;
      percentageChange = Number(rawPct.toFixed(2));
      const formattedNumber = Math.abs(percentageChange).toLocaleString('pt-BR', {
        minimumFractionDigits: percentageChange % 1 !== 0 ? 1 : 0,
        maximumFractionDigits: 2,
      });

      if (percentageChange > 0) {
        trend = 'up';
        formattedPercentage = `+${formattedNumber}%`;
        statusDescription = `+${difference.toLocaleString('pt-BR')} visualizações (+${formattedNumber}%) em relação a ${previousPeriodLabel}`;
      } else if (percentageChange < 0) {
        trend = 'down';
        formattedPercentage = `-${formattedNumber}%`;
        statusDescription = `${difference.toLocaleString('pt-BR')} visualizações (-${formattedNumber}%) em relação a ${previousPeriodLabel}`;
      } else {
        trend = 'neutral';
        formattedPercentage = '0%';
        statusDescription = `Mesmo volume de visualizações (${totalPeriodViews.toLocaleString('pt-BR')}) que ${previousPeriodLabel}`;
      }
    } else if (totalPeriodViews > 0) {
      // Período anterior foi 0, mas atual possui dados
      trend = 'up';
      percentageChange = 100;
      formattedPercentage = 'Novo período';
      statusDescription = `+${totalPeriodViews.toLocaleString('pt-BR')} visualizações (sem histórico anterior em ${previousPeriodLabel})`;
    } else {
      // Ambos 0
      trend = 'no_data';
      percentageChange = null;
      formattedPercentage = 'Sem dados';
      statusDescription = `Sem visualizações registradas no período ou em ${previousPeriodLabel}`;
    }

    const comparison: PeriodComparisonResult = {
      currentTotal: totalPeriodViews,
      previousTotal,
      difference,
      percentageChange,
      formattedPercentage,
      statusDescription,
      previousPeriodLabel,
      trend,
    };

    // 5. Gera a lista diária contínua para o gráfico
    const dailyMetrics: DailyViewMetric[] = Object.entries(dailyMap)
      .map(([date, views]) => ({
        date,
        displayDate: formatYMDToBR(date),
        views,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. Gera lista de páginas com ordenação decrescente por visualizações (Ranking)
    let pageMetrics: PageViewMetric[] = Object.entries(pageMap)
      .map(([path, views]) => ({
        path,
        friendlyName: getPageFriendlyName(path),
        views,
        percentage: totalPeriodViews > 0 ? Math.round((views / totalPeriodViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    // Destaques dinâmicos do período (Etapa 19.6)
    const topPage = pageMetrics.length > 0 ? pageMetrics[0] : null;

    let topDay: TopDayHighlight | null = null;
    if (dailyMetrics.length > 0) {
      const highestDay = [...dailyMetrics].sort((a, b) => b.views - a.views)[0];
      if (highestDay && highestDay.views > 0) {
        topDay = {
          date: highestDay.date,
          displayDate: highestDay.displayDate,
          views: highestDay.views,
        };
      }
    }

    // Filtro de busca textual se especificado
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      pageMetrics = pageMetrics.filter(
        (p) =>
          p.path.toLowerCase().includes(q) ||
          p.friendlyName.toLowerCase().includes(q)
      );
    }

    return {
      period,
      startDate,
      endDate,
      periodLabel,
      totalPeriodViews,
      todayViews,
      yesterdayViews,
      last7DaysViews,
      last30DaysViews,
      comparison,
      dailyMetrics,
      pageMetrics,
      topPage,
      topDay,
      uniquePagesCount: Object.keys(pageMap).length,
      rawStats: currentStats,
    };
  } catch (err: any) {
    console.error('[siteAnalyticsService] Erro ao obter dados do dashboard:', err);
    throw err;
  }
}

/**
 * Resumo rápido para exibição no card do AdminDashboard
 */
export async function getDashboardQuickMetrics(): Promise<{
  today: number;
  last7Days: number;
  last30Days: number;
  topPage: string;
}> {
  try {
    const todayStr = formatLocalDateToYMD();
    const d7 = new Date();
    d7.setDate(d7.getDate() - 6);
    const d7Str = formatLocalDateToYMD(d7);

    const d30 = new Date();
    d30.setDate(d30.getDate() - 29);
    const d30Str = formatLocalDateToYMD(d30);

    const stats = await getDailyStats({ startDate: d30Str });

    let today = 0;
    let last7Days = 0;
    let last30Days = 0;
    const pageCounts: Record<string, number> = {};

    for (const item of stats) {
      const v = item.views || 0;
      if (item.visit_date === todayStr) today += v;
      if (item.visit_date >= d7Str) last7Days += v;
      if (item.visit_date >= d30Str) last30Days += v;
      pageCounts[item.page_path] = (pageCounts[item.page_path] || 0) + v;
    }

    let topPage = 'Página Inicial';
    let maxViews = -1;
    for (const [path, views] of Object.entries(pageCounts)) {
      if (views > maxViews) {
        maxViews = views;
        topPage = getPageFriendlyName(path);
      }
    }

    return { today, last7Days, last30Days, topPage };
  } catch (err) {
    console.error('[siteAnalyticsService] Falha ao buscar métricas rápidas:', err);
    return { today: 0, last7Days: 0, last30Days: 0, topPage: 'Página Inicial' };
  }
}

/**
 * Calcula resumo analítico legado (totais, hoje, ontem, últimos 7 e 30 dias, top páginas)
 */
export async function getSummaryStats(daysCount: number = 30): Promise<AnalyticsSummary> {
  const emptySummary: AnalyticsSummary = {
    totalViews: 0,
    todayViews: 0,
    yesterdayViews: 0,
    last7DaysViews: 0,
    last30DaysViews: 0,
    topPages: [],
    recentDaily: [],
  };

  try {
    const todayStr = formatLocalDateToYMD();
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = formatLocalDateToYMD(yesterdayDate);

    const past30DaysDate = new Date();
    past30DaysDate.setDate(past30DaysDate.getDate() - daysCount);
    const past30DaysStr = formatLocalDateToYMD(past30DaysDate);

    const past7DaysDate = new Date();
    past7DaysDate.setDate(past7DaysDate.getDate() - 7);
    const past7DaysStr = formatLocalDateToYMD(past7DaysDate);

    const stats = await getDailyStats({ startDate: past30DaysStr });

    if (!stats || stats.length === 0) {
      return emptySummary;
    }

    let totalViews = 0;
    let todayViews = 0;
    let yesterdayViews = 0;
    let last7DaysViews = 0;
    let last30DaysViews = 0;

    const pageViewsMap: Record<string, number> = {};
    const dailyViewsMap: Record<string, number> = {};

    for (const item of stats) {
      const v = item.views || 0;
      totalViews += v;

      if (item.visit_date === todayStr) {
        todayViews += v;
      }
      if (item.visit_date === yesterdayStr) {
        yesterdayViews += v;
      }
      if (item.visit_date >= past7DaysStr) {
        last7DaysViews += v;
      }
      if (item.visit_date >= past30DaysStr) {
        last30DaysViews += v;
      }

      pageViewsMap[item.page_path] = (pageViewsMap[item.page_path] || 0) + v;
      dailyViewsMap[item.visit_date] = (dailyViewsMap[item.visit_date] || 0) + v;
    }

    const topPages: PageViewMetric[] = Object.entries(pageViewsMap)
      .map(([path, views]) => ({
        path,
        friendlyName: getPageFriendlyName(path),
        views,
        percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    const recentDaily: DailyViewMetric[] = Object.entries(dailyViewsMap)
      .map(([date, views]) => ({
        date,
        displayDate: formatYMDToBR(date),
        views,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalViews,
      todayViews,
      yesterdayViews,
      last7DaysViews,
      last30DaysViews,
      topPages,
      recentDaily,
    };
  } catch (err) {
    console.error('[siteAnalyticsService] Erro ao consolidar resumo analítico:', err);
    return emptySummary;
  }
}

/**
 * Calcula intervalo de datas para um mês e ano específicos
 */
export function getMonthDateRange(
  year: number,
  month: number // 1 a 12
): { startDate: string; endDate: string; label: string } {
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startDate = formatLocalDateToYMD(firstDay);
  const endDate = formatLocalDateToYMD(lastDay);
  const label = `${monthNames[month - 1] || 'Mês'} de ${year}`;

  return { startDate, endDate, label };
}

/**
 * Consulta prévia dos registros e total de visualizações que serão afetados pela exclusão
 */
export async function getStatsPreviewForDeletion(params: {
  startDate: string;
  endDate: string;
  pagePath?: string;
  scopeType?: DeletionScopeType;
  label?: string;
}): Promise<DeletionPreview> {
  const { startDate, endDate, pagePath, scopeType = 'custom', label = 'Período Selecionado' } = params;

  try {
    let query = supabase
      .from('site_visit_stats')
      .select('id, views, visit_date, page_path')
      .gte('visit_date', startDate)
      .lte('visit_date', endDate);

    if (pagePath) {
      const norm = normalizeAnalyticsPath(pagePath);
      query = query.eq('page_path', norm);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[siteAnalyticsService] Erro ao obter prévia de exclusão:', error);
      throw new Error(error.message || 'Falha ao consultar prévia das estatísticas.');
    }

    const records = data || [];
    const recordsCount = records.length;
    const viewsCount = records.reduce((sum, r) => sum + (r.views || 0), 0);

    return {
      scopeType,
      startDate,
      endDate,
      pagePath: pagePath ? normalizeAnalyticsPath(pagePath) : undefined,
      label,
      recordsCount,
      viewsCount,
    };
  } catch (err: any) {
    console.error('[siteAnalyticsService] Exceção ao consultar prévia:', err);
    throw err;
  }
}

/**
 * Exclusão definitiva de estatísticas por período/página com registro em auditoria
 * Tenta utilizar a RPC atômica delete_site_visit_stats_by_period. Se não disponível, realiza exclusão direta autenticada.
 */
export async function deleteStatsByPeriod(params: {
  startDate: string;
  endDate: string;
  pagePath?: string;
  userEmail?: string;
  userId?: string;
}): Promise<DeletionResult> {
  const { startDate, endDate, pagePath, userEmail, userId } = params;

  if (!startDate || !endDate) {
    return {
      success: false,
      recordsDeleted: 0,
      viewsDeleted: 0,
      startDate: startDate || '',
      endDate: endDate || '',
      error: 'Data inicial e data final são obrigatórias.',
    };
  }

  if (startDate > endDate) {
    return {
      success: false,
      recordsDeleted: 0,
      viewsDeleted: 0,
      startDate,
      endDate,
      error: 'A data inicial não pode ser superior à data final.',
    };
  }

  const normPath = pagePath ? normalizeAnalyticsPath(pagePath) : undefined;

  try {
    // 1. Tenta executar via RPC segura
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      'delete_site_visit_stats_by_period',
      {
        p_start_date: startDate,
        p_end_date: endDate,
        p_page_path: normPath || null,
      }
    );

    if (!rpcError && rpcData && typeof rpcData === 'object' && rpcData.success) {
      return {
        success: true,
        recordsDeleted: Number(rpcData.records_deleted) || 0,
        viewsDeleted: Number(rpcData.views_deleted) || 0,
        startDate,
        endDate,
        pagePath: normPath,
      };
    }

    // Se a RPC não estiver disponível no banco remoto ou retornar erro de método não encontrado, usa fallback direto seguro
    if (rpcError && (rpcError.code === 'PGRST202' || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist'))) {
      console.warn('[siteAnalyticsService] RPC delete_site_visit_stats_by_period não encontrada. Executando fallback seguro com auditoria...');
      
      // 1. Consulta prévia dos registros afetados
      const preview = await getStatsPreviewForDeletion({
        startDate,
        endDate,
        pagePath: normPath,
      });

      // 2. Executa a deleção
      let deleteQuery = supabase
        .from('site_visit_stats')
        .delete()
        .gte('visit_date', startDate)
        .lte('visit_date', endDate);

      if (normPath) {
        deleteQuery = deleteQuery.eq('page_path', normPath);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error('[siteAnalyticsService] Erro no fallback de exclusão:', deleteError);
        return {
          success: false,
          recordsDeleted: 0,
          viewsDeleted: 0,
          startDate,
          endDate,
          pagePath: normPath,
          error: deleteError.message || 'Falha ao excluir registros no banco de dados.',
        };
      }

      // 3. Registra na trilha de auditoria administrativa
      try {
        await supabaseDatabase.logAdminAction({
          user_id: userId || null,
          user_email: userEmail || null,
          action: 'DELETE_SITE_VISIT_STATS',
          entity_type: 'site_visit_stats',
          entity_id: `${startDate}_${endDate}`,
          details: {
            start_date: startDate,
            end_date: endDate,
            page_path: normPath || null,
            records_deleted: preview.recordsCount,
            views_deleted: preview.viewsCount,
            executed_at: new Date().toISOString(),
          },
        });
      } catch (auditErr) {
        console.warn('[siteAnalyticsService] Aviso ao registrar auditoria de exclusão:', auditErr);
      }

      return {
        success: true,
        recordsDeleted: preview.recordsCount,
        viewsDeleted: preview.viewsCount,
        startDate,
        endDate,
        pagePath: normPath,
      };
    }

    if (rpcError) {
      console.error('[siteAnalyticsService] Erro retornado pela RPC de exclusão:', rpcError);
      return {
        success: false,
        recordsDeleted: 0,
        viewsDeleted: 0,
        startDate,
        endDate,
        pagePath: normPath,
        error: rpcError.message || 'Não foi possível concluir a exclusão de estatísticas.',
      };
    }

    return {
      success: false,
      recordsDeleted: 0,
      viewsDeleted: 0,
      startDate,
      endDate,
      pagePath: normPath,
      error: 'Operação não confirmada pelo banco de dados.',
    };
  } catch (err: any) {
    console.error('[siteAnalyticsService] Exceção crítica ao excluir estatísticas:', err);
    return {
      success: false,
      recordsDeleted: 0,
      viewsDeleted: 0,
      startDate,
      endDate,
      pagePath: normPath,
      error: err?.message || 'Falha de comunicação com o Supabase ao excluir dados.',
    };
  }
}

/**
 * Exclui registros de estatísticas conforme filtros (Acesso administrativo)
 */
export async function deleteStats(
  filters: { startDate?: string; endDate?: string; pagePath?: string } = {}
): Promise<boolean> {
  try {
    let query = supabase.from('site_visit_stats').delete();

    if (filters.startDate) {
      query = query.gte('visit_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('visit_date', filters.endDate);
    }
    if (filters.pagePath) {
      const norm = normalizeAnalyticsPath(filters.pagePath);
      query = query.eq('page_path', norm);
    }

    const { error } = await query;
    if (error) {
      console.error('[siteAnalyticsService] Erro ao excluir estatísticas:', error);
      throw new Error(error.message || 'Falha ao excluir dados de estatísticas.');
    }

    return true;
  } catch (err: any) {
    console.error('[siteAnalyticsService] Falha na exclusão de estatísticas:', err);
    return false;
  }
}

/**
 * Realiza uma auditoria de integridade nos registros de visualizações:
 * - Identifica registros nulos, vazios ou corrompidos
 * - Identifica caminhos que excedam 255 caracteres
 * - Identifica registros com contagem de views <= 0 ou datas nulas
 * - Retorna relatório detalhado sem excluir dados automaticamente
 */
export async function checkStatsDataIntegrity(): Promise<StatsIntegrityReport> {
  const fallbackReport: StatsIntegrityReport = {
    isHealthy: true,
    totalRecordsChecked: 0,
    invalidRecordsCount: 0,
    anomalies: [],
    checkedAt: new Date().toISOString(),
  };

  try {
    // 1. Tenta executar a RPC segura de integridade
    const { data: rpcData, error: rpcError } = await supabase.rpc('check_site_visit_stats_integrity');

    if (!rpcError && rpcData) {
      const res = rpcData as unknown as {
        isHealthy?: boolean;
        totalRecordsChecked?: number;
        invalidRecordsCount?: number;
        anomalies?: StatsIntegrityAnomaly[];
        checkedAt?: string;
      };
      return {
        isHealthy: Boolean(res.isHealthy),
        totalRecordsChecked: Number(res.totalRecordsChecked) || 0,
        invalidRecordsCount: Number(res.invalidRecordsCount) || 0,
        anomalies: (res.anomalies as StatsIntegrityAnomaly[]) || [],
        checkedAt: res.checkedAt || new Date().toISOString(),
      };
    }

    // 2. Fallback direto via Supabase client caso a RPC não tenha sido executada ainda
    const { data, error, count } = await supabase
      .from('site_visit_stats')
      .select('*', { count: 'exact' });

    if (error || !data) {
      console.warn('[siteAnalyticsService] Não foi possível consultar integridade:', error?.message);
      return fallbackReport;
    }

    const anomalies: StatsIntegrityAnomaly[] = [];

    for (const row of data as SiteVisitStat[]) {
      let reason: string | null = null;

      if (!row.page_path || typeof row.page_path !== 'string' || row.page_path.trim() === '') {
        reason = 'Caminho de página vazio ou nulo';
      } else if (row.page_path.length > 255) {
        reason = 'Caminho excede 255 caracteres';
      } else if (typeof row.views !== 'number' || row.views <= 0) {
        reason = 'Contagem de visualizações menor ou igual a zero';
      } else if (!row.visit_date) {
        reason = 'Data de visita nula';
      } else if (!row.page_path.startsWith('/')) {
        reason = 'Caminho sem barra inicial';
      }

      if (reason) {
        anomalies.push({
          id: row.id,
          visit_date: row.visit_date,
          page_path: row.page_path,
          views: row.views,
          reason,
        });
      }
    }

    return {
      isHealthy: anomalies.length === 0,
      totalRecordsChecked: count || data.length,
      invalidRecordsCount: anomalies.length,
      anomalies,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[siteAnalyticsService] Erro ao auditar integridade de estatísticas:', err);
    return fallbackReport;
  }
}


