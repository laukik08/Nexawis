import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../../services/reportService';
import type { 
  ReportRecord, 
  ReportConfig, 
  ReportKpiMetrics, 
  ScheduledReportDef, 
  ReportLibraryFilters 
} from '../../types/reports';
import { exportReportToCsv, exportReportLibraryToCsv } from '../../utils/reportExport';
import { ReportsHeader } from '../../components/reports/ReportsHeader';
import { ReportKpiCards } from '../../components/reports/ReportKpiCards';
import { ReportCategorySelector } from '../../components/reports/ReportCategorySelector';
import { ReportLibraryTable } from '../../components/reports/ReportLibraryTable';
import { CreateReportModal } from '../../components/reports/CreateReportModal';
import { ReportPreviewModal } from '../../components/reports/ReportPreviewModal';
import { ScheduleReportModal } from '../../components/reports/ScheduleReportModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const initialLibraryFilters: ReportLibraryFilters = {
  searchQuery: '',
  category: 'All',
  status: 'All',
  sortBy: 'date-desc'
};

export function ReportsPage() {
  // State for data
  const [kpiMetrics, setKpiMetrics] = useState<ReportKpiMetrics | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduledReportDef[]>([]);
  const [filters, setFilters] = useState<ReportLibraryFilters>(initialLibraryFilters);
  const [filterOptions, setFilterOptions] = useState<{
    departments: string[];
    projects: Array<{ id: string; name: string }>;
  }>({
    departments: ['All'],
    projects: [{ id: 'All', name: 'All Projects' }]
  });

  // Loading & refreshing
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<ReportConfig> | null>(null);
  const [activePreviewReport, setActivePreviewReport] = useState<ReportRecord | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Categories & KPIs once
  const loadStaticData = useCallback(async () => {
    try {
      const [kpis, scheds, opts] = await Promise.all([
        reportService.getReportKpis(),
        reportService.getScheduledReports(),
        reportService.getFilterOptions()
      ]);
      setKpiMetrics(kpis);
      setSchedules(scheds);
      setFilterOptions(opts);
    } catch (err) {
      console.error('Failed to load reports metadata:', err);
    }
  }, []);

  // Load Reports with active filters
  const loadReportsList = useCallback(async (currentFilters: ReportLibraryFilters, refreshIndicator = false) => {
    if (refreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const list = await reportService.getReports(currentFilters);
      setReports(list);

      // Refresh KPIs if this was a user refresh
      if (refreshIndicator) {
        const [kpis, scheds] = await Promise.all([
          reportService.getReportKpis(),
          reportService.getScheduledReports()
        ]);
        setKpiMetrics(kpis);
        setSchedules(scheds);
        showToast('Reports library refreshed successfully');
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      showToast('Error loading reports', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStaticData();
  }, [loadStaticData]);

  useEffect(() => {
    loadReportsList(filters);
  }, [filters, loadReportsList]);

  // Compute category report counts across all records
  const categoryCounts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  // Handlers
  const handleRefresh = () => {
    loadReportsList(filters, true);
  };

  const handleCategorySelect = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      category: categoryId
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialLibraryFilters);
  };

  const handleReportCreated = async (newReport: ReportRecord) => {
    try {
      const updatedList = await reportService.getReports(filters);
      const updatedKpis = await reportService.getReportKpis();
      setReports(updatedList);
      setKpiMetrics(updatedKpis);
      setIsCreateModalOpen(false);
      setEditingConfig(null);

      // Automatically open the preview for the newly generated report
      setActivePreviewReport(newReport);
      showToast(`Report "${newReport.name}" generated successfully`);
    } catch (err) {
      console.error('Failed to update reports list after creation:', err);
    }
  };

  const handleViewReport = (report: ReportRecord) => {
    setActivePreviewReport(report);
  };

  const handleDuplicateReport = async (report: ReportRecord) => {
    try {
      const copy = await reportService.duplicateReport(report.id);
      if (copy) {
        const updatedList = await reportService.getReports(filters);
        const updatedKpis = await reportService.getReportKpis();
        setReports(updatedList);
        setKpiMetrics(updatedKpis);
        showToast(`Created duplicate: "${copy.name}"`);
      }
    } catch (err) {
      console.error('Failed to duplicate report:', err);
      showToast('Could not duplicate report', 'error');
    }
  };

  const handleDownloadReport = async (report: ReportRecord) => {
    try {
      const format = (report.format?.toLowerCase() === 'pdf' ? 'pdf' : 'csv') as 'pdf' | 'csv';
      try {
        await reportService.downloadReportFile(report.id, format, report.name);
        showToast(`Downloaded ${format.toUpperCase()} for "${report.name}"`);
      } catch (backendErr) {
        // Fallback to client-side CSV export
        exportReportToCsv(report);
        showToast(`Exported CSV for "${report.name}"`);
      }
    } catch (err) {
      console.error('Error downloading report:', err);
      showToast('Failed to export report file', 'error');
    }
  };

  const handleExportLibraryCsv = () => {
    try {
      exportReportLibraryToCsv(reports);
      showToast(`Exported ${reports.length} reports to CSV`);
    } catch (err) {
      console.error('Failed to export library:', err);
      showToast('Failed to export library CSV', 'error');
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const success = await reportService.deleteReport(id);
      if (success) {
        setReports(prev => prev.filter(r => r.id !== id));
        const updatedKpis = await reportService.getReportKpis();
        setKpiMetrics(updatedKpis);
        showToast('Demonstration report record removed');
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
      showToast('Could not delete report', 'error');
    }
  };

  const handleEditConfig = (report: ReportRecord) => {
    setEditingConfig({
      ...report.config,
      title: `${report.name} (Revised)`
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveSchedule = async (scheduleData: Omit<ScheduledReportDef, 'id' | 'createdAt'>) => {
    const saved = await reportService.saveScheduledReport(scheduleData);
    setSchedules(prev => [saved, ...prev.filter(s => s.id !== saved.id)]);
    const updatedKpis = await reportService.getReportKpis();
    setKpiMetrics(updatedKpis);
  };

  const handleToggleSchedule = async (id: string) => {
    const updated = await reportService.toggleScheduleEnabled(id);
    if (updated) {
      setSchedules(prev => prev.map(s => s.id === id ? updated : s));
      const updatedKpis = await reportService.getReportKpis();
      setKpiMetrics(updatedKpis);
      showToast(`Schedule ${updated.enabled ? 'activated' : 'paused'}`);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/40 backdrop-blur-md'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <ReportsHeader
        onCreateReport={() => {
          setEditingConfig(null);
          setIsCreateModalOpen(true);
        }}
        onExportLibrary={handleExportLibraryCsv}
        onOpenSchedule={() => setIsScheduleModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Overview KPI Cards */}
      <ReportKpiCards
        kpis={kpiMetrics}
        isLoading={isLoading && !kpiMetrics}
      />

      {/* Category Pills Selector */}
      <ReportCategorySelector
        selectedCategory={filters.category}
        onSelectCategory={handleCategorySelect}
        categoryCounts={categoryCounts}
      />

      {/* Main Report Library & History */}
      <ReportLibraryTable
        reports={reports}
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
        onViewReport={handleViewReport}
        onDuplicateReport={handleDuplicateReport}
        onDownloadReport={handleDownloadReport}
        onDeleteReport={handleDeleteReport}
        onCreateReport={() => {
          setEditingConfig(null);
          setIsCreateModalOpen(true);
        }}
        isLoading={isLoading}
      />

      {/* Create / Configure Report Wizard Modal */}
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingConfig(null);
        }}
        onReportCreated={handleReportCreated}
        departmentOptions={filterOptions.departments}
        projectOptions={filterOptions.projects}
        initialConfig={editingConfig}
      />

      {/* Report Preview Modal with Print / CSV Export */}
      <ReportPreviewModal
        report={activePreviewReport}
        isOpen={Boolean(activePreviewReport)}
        onClose={() => setActivePreviewReport(null)}
        onEditConfig={handleEditConfig}
        onDuplicate={handleDuplicateReport}
      />

      {/* Demonstration Scheduling Modal */}
      <ScheduleReportModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        schedules={schedules}
        onSaveSchedule={handleSaveSchedule}
        onToggleSchedule={handleToggleSchedule}
      />
    </div>
  );
}
