import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RotateCw, Sparkles, ShieldCheck } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import type { 
  AnalyticsFilters, 
  FullAnalyticsPayload 
} from '../../types/analytics';
import { AnalyticsHeader } from '../../components/analytics/AnalyticsHeader';
import { AnalyticsKpiCards } from '../../components/analytics/AnalyticsKpiCards';
import { AnalyticsTabsNav, type AnalyticsTabId } from '../../components/analytics/AnalyticsTabsNav';
import { DemoInsightsCallout } from '../../components/analytics/DemoInsightsCallout';
import { OverviewTab } from '../../components/analytics/OverviewTab';
import { WorkforceTab } from '../../components/analytics/WorkforceTab';
import { ProjectsTab } from '../../components/analytics/ProjectsTab';
import { TeamPerformanceTab } from '../../components/analytics/TeamPerformanceTab';
import { SustainabilityTab } from '../../components/analytics/SustainabilityTab';
import { AnalyticsEmptyState } from '../../components/analytics/AnalyticsEmptyState';

const initialFilters: AnalyticsFilters = {
  dateRange: {
    preset: '30d',
    label: 'Last 30 Days'
  },
  department: 'All',
  projectId: 'All',
  searchQuery: ''
};

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('overview');
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FullAnalyticsPayload | null>(null);

  const [filterOptions, setFilterOptions] = useState<{
    departments: string[];
    projects: Array<{ id: string; name: string }>;
  }>({
    departments: ['All'],
    projects: [{ id: 'All', name: 'All Projects' }]
  });

  // Load dropdown options once on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const opts = await analyticsService.getFilterOptions();
        setFilterOptions(opts);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    }
    loadOptions();
  }, []);

  // Fetch analytics data whenever filters change
  const loadData = useCallback(async (currentFilters: AnalyticsFilters, showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const payload = await analyticsService.getAnalyticsData(currentFilters);
      setData(payload);
    } catch (err) {
      console.error('Error loading analytics payload:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the analytics backend. Please verify your connection and permissions.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleFilterChange = (updates: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleRefresh = () => {
    loadData(filters, true);
  };

  const handleExport = async () => {
    if (!data) return;
    try {
      await analyticsService.exportCurrentView(activeTab, data, filters);
    } catch (err) {
      console.error('Error exporting analytics CSV:', err);
    }
  };

  // Determine if active view has 0 matching data
  const isViewEmpty = () => {
    if (!data) return false;
    if (activeTab === 'workforce') return data.workforce.tableRows.length === 0;
    if (activeTab === 'projects') return data.projects.tableRows.length === 0;
    if (activeTab === 'teams') return data.teams.tableRows.length === 0;
    if (activeTab === 'sustainability') return data.sustainability.departmentBurnoutRisks.length === 0;
    return false;
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header with Title, Date Range, Department, Project, Refresh & CSV Export */}
      <AnalyticsHeader
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isRefreshing={isRefreshing}
        departmentOptions={filterOptions.departments}
        projectOptions={filterOptions.projects}
        activeTabName={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
      />

      {/* Error Alert Recovery */}
      {!isLoading && error && (
        <div className="card-base p-6 rounded-2xl border border-red-500/30 bg-red-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-red-200">Analytics Data Retrieval Error</h4>
              <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(filters)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[--color-surface-2] hover:bg-[--color-surface-3] text-[--color-text-secondary] border border-[--color-border-subtle] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="h-32 rounded-2xl border"
                style={{
                  backgroundColor: 'var(--color-surface-1)',
                  borderColor: 'var(--color-border-subtle)'
                }}
              />
            ))}
          </div>
          <div 
            className="h-12 w-96 rounded-2xl border"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-border-subtle)'
            }}
          />
          <div 
            className="h-96 rounded-2xl border"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-border-subtle)'
            }}
          />
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* 4 Compact Overview KPI Cards */}
          <AnalyticsKpiCards kpis={data.kpis} />

          {/* 5-Section Analytics Navigation Tabs */}
          <AnalyticsTabsNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            workforceCount={data.workforce.totalEmployees}
            projectCount={data.projects.totalProjects}
            formationCount={data.teams.totalFormations}
          />

          {/* Transparency & Model Provenance Disclaimer */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[--color-surface-2]/60 border border-[--color-border-subtle] text-[11px] text-[--color-text-secondary]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[--color-accent-lime]" />
              <span>
                <strong>Verified Workspace Telemetry:</strong> Aggregated from active allocations, recorded deadlines, and AWIS evaluations.
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[--color-text-muted] font-mono">
              <Sparkles className="w-3 h-3 text-[--color-accent-cyan]" />
              <span>ML Burnout & Success models provide prospective simulation only.</span>
            </div>
          </div>

          {/* Empty State Guard if Filter Has Zero Matches */}
          {isViewEmpty() ? (
            <AnalyticsEmptyState onClearFilters={handleResetFilters} />
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <OverviewTab data={data} />
                  <DemoInsightsCallout insights={data.insights} />
                </div>
              )}

              {/* Tab 2: Workforce Analytics */}
              {activeTab === 'workforce' && (
                <div className="space-y-6">
                  <WorkforceTab workforce={data.workforce} />
                  <DemoInsightsCallout 
                    insights={data.insights.filter(i => i.targetModule === 'employees')} 
                  />
                </div>
              )}

              {/* Tab 3: Project Analytics */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <ProjectsTab projects={data.projects} />
                  <DemoInsightsCallout 
                    insights={data.insights.filter(i => i.targetModule === 'projects')} 
                  />
                </div>
              )}

              {/* Tab 4: Team Performance */}
              {activeTab === 'teams' && (
                <div className="space-y-6">
                  <TeamPerformanceTab teams={data.teams} />
                  <DemoInsightsCallout 
                    insights={data.insights.filter(i => i.targetModule === 'teams')} 
                  />
                </div>
              )}

              {/* Tab 5: Sustainability */}
              {activeTab === 'sustainability' && (
                <div className="space-y-6">
                  <SustainabilityTab sustainability={data.sustainability} />
                </div>
              )}
            </>
          )}

        </div>
      ) : null}

    </div>
  );
}
