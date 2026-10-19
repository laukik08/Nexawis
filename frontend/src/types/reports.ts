export type ReportCategory = 
  | 'workforce' 
  | 'projects' 
  | 'team_formation' 
  | 'awis_intelligence' 
  | 'sustainability' 
  | 'executive';

export type ReportFormat = 'PDF' | 'CSV';

export type ReportStatus = 'Ready' | 'Scheduled' | 'Draft';

export type ReportDatePreset = '7d' | '30d' | '90d' | 'custom';

export interface ReportCategoryDef {
  id: ReportCategory;
  title: string;
  badge: string;
  description: string;
  iconName: 'users' | 'folder-kanban' | 'network' | 'brain-circuit' | 'shield-check' | 'layers';
  accentColor: string;
  defaultSections: string[];
}

export interface ReportConfig {
  title: string;
  category: ReportCategory;
  dateRange: {
    preset: ReportDatePreset;
    startDate?: string;
    endDate?: string;
    label: string;
  };
  department: string; // 'All' or specific
  projectId: string; // 'All' or specific
  sections: string[]; // selected section IDs
  includeCharts: boolean;
  includeTables: boolean;
  includeComparison: boolean;
  format: ReportFormat;
}

export interface ReportKpiMetrics {
  totalReports: number;
  reportsGenerated: number;
  scheduledReports: number;
  latestReportDate: string;
  latestReportName: string;
}

export interface ReportMetricItem {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'positive' | 'warning' | 'neutral';
  benchmark?: string;
}

export interface ReportInsightItem {
  id: string;
  title: string;
  observation: string;
  metric: string;
  priority: 'high' | 'medium' | 'info';
  actionUrl?: string;
  actionLabel?: string;
}

export interface ReportTableData {
  title: string;
  description?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export interface ReportChartDataPoint {
  name: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  category?: string;
}

export interface ReportRecord {
  id: string;
  name: string;
  category: ReportCategory;
  reportingPeriod: string;
  createdAt: string;
  createdBy: string;
  status: ReportStatus;
  format: ReportFormat;
  fileSizeBytes: number;
  config: ReportConfig;
  summaryMetrics: ReportMetricItem[];
  findings: string[];
  warnings?: string[];
  insights: ReportInsightItem[];
  charts?: {
    primaryChartTitle: string;
    primaryChartType: 'bar' | 'area' | 'donut';
    primaryChartData: ReportChartDataPoint[];
    secondaryChartTitle?: string;
    secondaryChartType?: 'bar' | 'area' | 'donut';
    secondaryChartData?: ReportChartDataPoint[];
  };
  tableData?: ReportTableData;
}

export interface ScheduledReportDef {
  id: string;
  name: string;
  category: ReportCategory;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  nextRunDate: string;
  recipients: string[];
  enabled: boolean;
  format: ReportFormat;
  department: string;
  createdAt: string;
}

export interface ReportLibraryFilters {
  searchQuery: string;
  category: string; // 'All' or category
  status: string; // 'All' or status
  sortBy: 'date-desc' | 'date-asc' | 'name-asc' | 'category-asc';
}
