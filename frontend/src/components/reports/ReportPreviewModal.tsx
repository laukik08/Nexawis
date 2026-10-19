import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Building,
  FolderKanban,
  FileText,
  Clock,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from 'recharts';
import type { ReportRecord } from '../../types/reports';
import { exportReportToCsv, triggerReportPrint } from '../../utils/reportExport';
import { useTheme } from '../../context/ThemeContext';

interface ReportPreviewModalProps {
  report: ReportRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEditConfig?: (report: ReportRecord) => void;
  onDuplicate?: (report: ReportRecord) => void;
}

const CHART_PALETTE = ['#0d9488', '#0284c7', '#16a34a', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  report,
  isOpen,
  onClose,
  onEditConfig,
  onDuplicate
}) => {
  const { theme } = useTheme();

  if (!isOpen || !report) return null;

  const chartTheme = {
    textColor: theme === 'dark' ? '#8db3bd' : '#577682',
    gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    tooltipBg: theme === 'dark' ? '#0a141a' : '#ffffff',
    tooltipBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(13, 26, 32, 0.2)'
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'info') => {
    switch (priority) {
      case 'high':
        return (
          <span 
            className="px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: '#ef4444',
              color: '#ef4444'
            }}
          >
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span 
            className="px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: '#f59e0b',
              color: '#f59e0b'
            }}
          >
            Medium Priority
          </span>
        );
      case 'info':
      default:
        return (
          <span 
            className="px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-accent-cyan)',
              color: 'var(--color-accent-cyan)'
            }}
          >
            Observational
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(5, 12, 16, 0.88)' : 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-preview-title"
    >
      {/* Top Action Toolbar (Hidden during print) */}
      <header 
        className="report-no-print sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b shadow-lg"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent-cyan)] hover:text-[var(--color-accent-cyan)] shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
            title="Back to Reports"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-xs font-mono font-bold px-2 py-0.5 rounded border shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {report.id}
              </span>
              <span 
                className="text-xs font-bold px-2.5 py-0.5 rounded-full capitalize border shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-accent-cyan)',
                  color: 'var(--color-accent-cyan)'
                }}
              >
                {report.category.replace('_', ' ')}
              </span>
              <span 
                className="text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: '#f59e0b',
                  color: '#f59e0b'
                }}
              >
                Demo Report
              </span>
            </div>
            <h2 
              id="report-preview-title" 
              className="text-base font-bold truncate max-w-xl"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {report.name}
            </h2>
          </div>
        </div>

        {/* Action Options */}
        <div className="flex items-center gap-2.5">
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(report)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold cursor-pointer rounded-xl border shadow-sm transition-all hover:scale-102 hover:border-[var(--color-accent-lime)]"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-primary)'
              }}
              title="Duplicate Report Config"
            >
              <Copy className="w-4 h-4 text-[var(--color-accent-lime)]" />
              <span>Duplicate</span>
            </button>
          )}

          {onEditConfig && (
            <button
              onClick={() => {
                onClose();
                onEditConfig(report);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold cursor-pointer rounded-xl border shadow-sm transition-all hover:scale-102 hover:border-[var(--color-accent-cyan)]"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-primary)'
              }}
              title="Edit Report Configuration"
            >
              <Layers className="w-4 h-4 text-[var(--color-accent-cyan)]" />
              <span>Edit Config</span>
            </button>
          )}

          <button
            onClick={() => exportReportToCsv(report)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold cursor-pointer rounded-xl border shadow-sm transition-all hover:scale-102 hover:border-[var(--color-accent-cyan)]"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-[var(--color-accent-cyan)]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => triggerReportPrint()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold cursor-pointer rounded-xl shadow-md transition-all hover:brightness-110 hover:scale-102"
            style={{
              backgroundColor: 'var(--color-accent-cyan)',
              borderColor: 'var(--color-accent-cyan)',
              color: '#ffffff'
            }}
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 ml-1 rounded-xl border transition-all cursor-pointer hover:border-[var(--color-accent-cyan)] hover:text-[var(--color-text-primary)] shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-secondary)'
            }}
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Scrollable Document Viewer */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center">
        {/* Printable Paper Canvas */}
        <article 
          id="report-printable-area" 
          className="report-document w-full max-w-5xl rounded-2xl p-6 sm:p-10 shadow-2xl transition-all"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            border: '1px solid var(--color-border-strong)',
            color: 'var(--color-text-primary)'
          }}
        >
          {/* Document Header */}
          <header 
            className="border-b pb-6 mb-8"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs shadow-xs"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-accent-cyan)',
                      color: 'var(--color-accent-cyan)'
                    }}
                  >
                    NW
                  </div>
                  <span 
                    className="text-xs font-extrabold tracking-widest uppercase"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    NEXAWIS Workforce Intelligence Suite
                  </span>
                </div>
                <h1 
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {report.name}
                </h1>
                <p 
                  className="text-xs mt-1.5 flex items-center gap-2 flex-wrap"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span className="font-semibold text-[var(--color-accent-cyan)] capitalize">
                    {report.category.replace('_', ' ')} Report
                  </span>
                  <span>•</span>
                  <span className="font-mono">ID: {report.id}</span>
                  <span>•</span>
                  <span>Created by {report.createdBy}</span>
                </p>
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-col sm:items-end gap-1.5 text-xs">
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium shadow-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
                  <span>Period: {report.reportingPeriod}</span>
                </div>

                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium shadow-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <Clock className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
                  <span>Generated: {new Date(report.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>

                {report.config.department !== 'All' && (
                  <div 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium shadow-xs"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border-strong)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <Building className="w-3.5 h-3.5 text-[var(--color-accent-lime)]" />
                    <span>Dept: {report.config.department}</span>
                  </div>
                )}

                {report.config.projectId !== 'All' && (
                  <div 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium shadow-xs"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border-strong)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
                    <span>Project: {report.config.projectId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Included Report Sections Pill Bar */}
            {report.config.sections && report.config.sections.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-strong)' }}>
                <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Included Report Sections:
                </span>
                <div className="flex flex-wrap gap-2">
                  {report.config.sections.map((section, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border shadow-xs"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border-strong)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Check className="w-3.5 h-3.5 text-[var(--color-accent-lime)]" />
                      <span>{section}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prominent Demonstration Data Banner */}
            <div 
              className="mt-6 p-4 rounded-xl flex items-start gap-3 border text-xs shadow-sm"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-strong)',
                borderLeft: '4px solid var(--color-accent-cyan)',
                color: 'var(--color-text-primary)'
              }}
            >
              <Info className="w-4 h-4 text-[var(--color-accent-cyan)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--color-accent-cyan)]">Demonstration Intelligence Notice: </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  This report has been compiled from mock workforce, project, and team formation telemetry for frontend demonstration. 
                  Metrics, AWIS distribution indicators, and workload scores are deterministic illustrations and do not reflect active machine learning inference.
                </span>
              </div>
            </div>
          </header>

          {/* Section: Executive Summary Key Metrics */}
          <section className="mb-10 print:break-inside-avoid">
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <FileText className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                <span>Executive Summary Metrics</span>
              </h3>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {report.summaryMetrics.length} Key Indicators
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {report.summaryMetrics.map((metric, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-xl border transition-all shadow-xs"
                  style={{ 
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)'
                  }}
                >
                  <p 
                    className="text-xs font-semibold truncate mb-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {metric.label}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span 
                      className="text-xl sm:text-2xl font-extrabold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {metric.value}
                    </span>
                    {metric.unit && (
                      <span 
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {metric.unit}
                      </span>
                    )}
                  </div>
                  {(metric.change || metric.benchmark) && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs flex-wrap">
                      {metric.change && (
                        <span className={`inline-flex items-center gap-0.5 font-bold ${
                          metric.status === 'positive' 
                            ? 'text-emerald-500' 
                            : metric.status === 'warning' 
                            ? 'text-amber-500' 
                            : 'text-[var(--color-text-secondary)]'
                        }`}>
                          {metric.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                          {metric.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                          {metric.trend === 'neutral' && <Minus className="w-3 h-3" />}
                          {metric.change}
                        </span>
                      )}
                      {metric.benchmark && (
                        <span 
                          className="text-[10px]"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {metric.benchmark}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section: Key Findings & Observations */}
          {report.findings && report.findings.length > 0 && (
            <section className="mb-10 print:break-inside-avoid">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Sparkles className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                <span>Key Findings & Observations</span>
              </h3>
              <div 
                className="p-5 rounded-xl border space-y-3 shadow-xs"
                style={{ 
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-strong)'
                }}
              >
                {report.findings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span 
                      className="w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
                      style={{
                        backgroundColor: 'var(--color-accent-cyan)',
                        color: '#ffffff'
                      }}
                    >
                      {idx + 1}
                    </span>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {finding}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Operational Warnings (if present) */}
          {report.warnings && report.warnings.length > 0 && (
            <section className="mb-10 print:break-inside-avoid">
              <div 
                className="p-4 rounded-xl border flex items-start gap-3.5 shadow-sm"
                style={{ 
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-strong)',
                  borderLeft: '4px solid #f59e0b',
                  color: 'var(--color-text-primary)'
                }}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    Operational Risk Flags & Threshold Warnings
                  </h4>
                  {report.warnings.map((warn, i) => (
                    <p 
                      key={i} 
                      className="text-xs leading-normal"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      • {warn}
                    </p>
                  ))}
                  <p 
                    className="text-[11px] pt-1 italic"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Note: Burnout risk & capacity warnings are heuristics and do not constitute clinical psychological or medical assessments.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Section: Visualizations & Charts (if enabled in config) */}
          {report.config.includeCharts && report.charts && (
            <section className="mb-10 print:break-inside-avoid">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Layers className="w-4 h-4 text-[var(--color-accent-lime)]" />
                <span>Visual Analytics & Distribution Breakdown</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Primary Chart */}
                <div 
                  className="p-5 rounded-xl border shadow-xs"
                  style={{ 
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)'
                  }}
                >
                  <h4 
                    className="text-xs font-bold uppercase tracking-wider mb-4"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {report.charts.primaryChartTitle}
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {report.charts.primaryChartType === 'bar' ? (
                        <BarChart data={report.charts.primaryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: chartTheme.textColor, fontSize: 10 }}
                            angle={-25}
                            textAnchor="end"
                            height={40}
                          />
                          <YAxis tick={{ fill: chartTheme.textColor, fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: chartTheme.tooltipBg, 
                              borderColor: chartTheme.tooltipBorder,
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: 'var(--color-text-primary)'
                            }} 
                          />
                          <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} />
                          {report.charts.primaryChartData.some(d => d.secondaryValue !== undefined) && (
                            <Bar dataKey="secondaryValue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                          )}
                        </BarChart>
                      ) : report.charts.primaryChartType === 'area' ? (
                        <AreaChart data={report.charts.primaryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                          <defs>
                            <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                          <XAxis dataKey="name" tick={{ fill: chartTheme.textColor, fontSize: 10 }} />
                          <YAxis tick={{ fill: chartTheme.textColor, fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: chartTheme.tooltipBg, 
                              borderColor: chartTheme.tooltipBorder,
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: 'var(--color-text-primary)'
                            }} 
                          />
                          <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2.5} fill="url(#primaryAreaGrad)" />
                        </AreaChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={report.charts.primaryChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                          >
                            {report.charts.primaryChartData.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: chartTheme.tooltipBg, 
                              borderColor: chartTheme.tooltipBorder,
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: 'var(--color-text-primary)'
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', color: chartTheme.textColor }} />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Secondary Chart (if available) */}
                {report.charts.secondaryChartData && report.charts.secondaryChartTitle ? (
                  <div 
                    className="p-5 rounded-xl border shadow-xs"
                    style={{ 
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border-strong)'
                    }}
                  >
                    <h4 
                      className="text-xs font-bold uppercase tracking-wider mb-4"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {report.charts.secondaryChartTitle}
                    </h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {report.charts.secondaryChartType === 'donut' ? (
                          <PieChart>
                            <Pie
                              data={report.charts.secondaryChartData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={4}
                            >
                              {report.charts.secondaryChartData.map((_, i) => (
                                <Cell key={`cell-sec-${i}`} fill={CHART_PALETTE[(i + 2) % CHART_PALETTE.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: chartTheme.tooltipBg, 
                                borderColor: chartTheme.tooltipBorder,
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'var(--color-text-primary)'
                              }} 
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', color: chartTheme.textColor }} />
                          </PieChart>
                        ) : (
                          <BarChart data={report.charts.secondaryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fill: chartTheme.textColor, fontSize: 10 }}
                              angle={-25}
                              textAnchor="end"
                              height={40}
                            />
                            <YAxis tick={{ fill: chartTheme.textColor, fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: chartTheme.tooltipBg, 
                                borderColor: chartTheme.tooltipBorder,
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'var(--color-text-primary)'
                              }} 
                            />
                            <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="p-5 rounded-xl border flex flex-col justify-center items-center text-center shadow-xs"
                    style={{ 
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border-strong)'
                    }}
                  >
                    <Info className="w-8 h-8 mb-2" style={{ color: 'var(--color-text-secondary)' }} />
                    <p className="text-xs max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Single primary visualization requested for this configuration. Additional comparison charts can be toggled in configuration settings.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section: Tabular Breakdown Data (if enabled) */}
          {report.config.includeTables && report.tableData && (
            <section className="mb-10 print:break-inside-avoid">
              <div className="mb-4">
                <h3 
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>{report.tableData.title}</span>
                </h3>
                {report.tableData.description && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {report.tableData.description}
                  </p>
                )}
              </div>

              <div 
                className="rounded-xl border overflow-x-auto shadow-sm"
                style={{ borderColor: 'var(--color-border-strong)' }}
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr 
                      className="border-b"
                      style={{ 
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border-strong)'
                      }}
                    >
                      {report.tableData.headers.map((header, idx) => (
                        <th 
                          key={idx}
                          className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border-strong)' }}>
                    {report.tableData.rows.map((row, rIdx) => (
                      <tr 
                        key={rIdx}
                        className="transition-colors hover:bg-[var(--color-surface-2)]"
                        style={{ borderColor: 'var(--color-border-strong)' }}
                      >
                        {row.map((cell, cIdx) => (
                          <td 
                            key={cIdx}
                            className={`px-4 py-2.5 ${typeof cell === 'number' ? 'font-mono font-semibold' : ''}`}
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section: Actionable Insights */}
          {report.insights && report.insights.length > 0 && (
            <section className="mb-10 print:break-inside-avoid">
              <div className="flex items-center justify-between mb-4">
                <h3 
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Sparkles className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                  <span>Actionable Demonstration Insights</span>
                </h3>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Rule-based Synthesis
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.insights.map((insight) => (
                  <div 
                    key={insight.id}
                    className="p-4 rounded-xl border flex flex-col justify-between shadow-xs"
                    style={{ 
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border-strong)'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {getPriorityBadge(insight.priority)}
                        <span 
                          className="text-[11px] font-mono px-2 py-0.5 rounded border font-bold"
                          style={{ 
                            backgroundColor: 'var(--color-surface-1)',
                            borderColor: 'var(--color-border-strong)',
                            color: 'var(--color-text-primary)'
                          }}
                        >
                          {insight.metric}
                        </span>
                      </div>
                      <h4 
                        className="text-xs font-bold mb-1"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {insight.title}
                      </h4>
                      <p 
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {insight.observation}
                      </p>
                    </div>

                    <div 
                      className="mt-3 pt-2.5 border-t text-[10px] flex items-center justify-between"
                      style={{ 
                        borderColor: 'var(--color-border-strong)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      <span className="font-bold text-[var(--color-accent-cyan)]">Supporting Metric: {insight.metric}</span>
                      <span>Demo heuristic</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Document Footer */}
          <footer 
            className="pt-6 border-t text-xs flex flex-col sm:flex-row items-center justify-between gap-2"
            style={{ 
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <div>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                NEXAWIS Intelligence Engine
              </span>
              <span> — Document {report.id}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Confidential • Internal Workforce Strategy</span>
              <span>Format: {report.format}</span>
            </div>
          </footer>
        </article>
      </main>
    </div>
  );
};
