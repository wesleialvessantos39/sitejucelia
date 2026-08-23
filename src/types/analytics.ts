// /src/types/analytics.ts

export interface SiteVisitStat {
  id: string;
  visit_date: string;
  page_path: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export type AnalyticsPeriod =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom'
  | 'all';

export interface PageViewMetric {
  path: string;
  friendlyName: string;
  views: number;
  percentage: number;
}

export interface DailyViewMetric {
  date: string;
  displayDate: string;
  views: number;
}

export interface PeriodComparisonResult {
  currentTotal: number;
  previousTotal: number;
  difference: number;
  percentageChange: number | null; // null if previous was 0 or no previous data
  formattedPercentage: string;
  statusDescription: string;
  previousPeriodLabel: string;
  trend: 'up' | 'down' | 'neutral' | 'no_data';
}

export interface TopPageHighlight {
  path: string;
  friendlyName: string;
  views: number;
  percentage: number;
}

export interface TopDayHighlight {
  date: string;
  displayDate: string;
  views: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  todayViews: number;
  yesterdayViews: number;
  last7DaysViews: number;
  last30DaysViews: number;
  topPages: PageViewMetric[];
  recentDaily: DailyViewMetric[];
}

export interface AnalyticsDashboardData {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  periodLabel: string;
  totalPeriodViews: number;
  todayViews: number;
  yesterdayViews: number;
  last7DaysViews: number;
  last30DaysViews: number;
  comparison: PeriodComparisonResult;
  dailyMetrics: DailyViewMetric[];
  pageMetrics: PageViewMetric[];
  topPage: TopPageHighlight | null;
  topDay: TopDayHighlight | null;
  uniquePagesCount: number;
  rawStats: SiteVisitStat[];
}

export interface RecordViewResult {
  success: boolean;
  views?: number;
  normalizedPath?: string;
  error?: string;
}

export interface AnalyticsFilterOptions {
  startDate?: string;
  endDate?: string;
  pagePath?: string;
  limit?: number;
}

export type DeletionScopeType = 'day' | 'month' | 'custom' | 'single_page';

export interface DeletionPreview {
  scopeType: DeletionScopeType;
  startDate: string;
  endDate: string;
  pagePath?: string;
  label: string;
  recordsCount: number;
  viewsCount: number;
}

export interface DeletionResult {
  success: boolean;
  recordsDeleted: number;
  viewsDeleted: number;
  startDate: string;
  endDate: string;
  pagePath?: string;
  error?: string;
}

export interface StatsIntegrityAnomaly {
  id: string;
  visit_date: string;
  page_path: string;
  views: number;
  reason: string;
}

export interface StatsIntegrityReport {
  isHealthy: boolean;
  totalRecordsChecked: number;
  invalidRecordsCount: number;
  anomalies: StatsIntegrityAnomaly[];
  checkedAt: string;
}


