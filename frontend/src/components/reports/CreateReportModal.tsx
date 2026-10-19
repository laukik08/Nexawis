import { useState, useId, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Layers, 
  Users, 
  FolderKanban, 
  Network, 
  BrainCircuit, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  FolderGit2, 
  CheckSquare, 
  Square, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  RotateCw 
} from 'lucide-react';
import { mockReportCategories } from '../../data/mockReports';
import { reportService } from '../../services/reportService';
import type { 
  ReportCategory, 
  ReportConfig, 
  ReportDatePreset, 
  ReportRecord 
} from '../../types/reports';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: (newReport: ReportRecord) => void;
  departmentOptions: string[];
  projectOptions: Array<{ id: string; name: string }>;
  initialConfig?: Partial<ReportConfig> | null;
}

export function CreateReportModal({
  isOpen,
  onClose,
  onReportCreated,
  departmentOptions,
  projectOptions,
  initialConfig
}: CreateReportModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('executive');
  const [reportTitle, setReportTitle] = useState('Comprehensive Executive Intelligence Brief');
  const [datePreset, setDatePreset] = useState<ReportDatePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState('2026-09-18');
  const [customEndDate, setCustomEndDate] = useState('2026-10-18');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState('All');
  const [selectedSections, setSelectedSections] = useState<string[]>(
    mockReportCategories[0].defaultSections
  );
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeComparison, setIncludeComparison] = useState(true);
  const [outputFormat, setOutputFormat] = useState<'PDF' | 'CSV'>('PDF');

  const titleInputId = useId();
  const formatInputId = useId();

  useEffect(() => {
    if (initialConfig && isOpen) {
      if (initialConfig.category) setSelectedCategory(initialConfig.category);
      if (initialConfig.title) setReportTitle(initialConfig.title);
      if (initialConfig.dateRange?.preset) setDatePreset(initialConfig.dateRange.preset);
      if (initialConfig.dateRange?.startDate) setCustomStartDate(initialConfig.dateRange.startDate);
      if (initialConfig.dateRange?.endDate) setCustomEndDate(initialConfig.dateRange.endDate);
      if (initialConfig.department) setSelectedDept(initialConfig.department);
      if (initialConfig.projectId) setSelectedProjectId(initialConfig.projectId);
      if (initialConfig.sections) setSelectedSections(initialConfig.sections);
      if (initialConfig.includeCharts !== undefined) setIncludeCharts(initialConfig.includeCharts);
      if (initialConfig.includeTables !== undefined) setIncludeTables(initialConfig.includeTables);
      if (initialConfig.includeComparison !== undefined) setIncludeComparison(initialConfig.includeComparison);
      if (initialConfig.format) setOutputFormat(initialConfig.format);
      setCurrentStep(2);
    } else if (isOpen && !initialConfig) {
      setCurrentStep(1);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const currentCategoryDef = mockReportCategories.find(c => c.id === selectedCategory) || mockReportCategories[0];

  const handleSelectCategory = (cat: ReportCategory) => {
    setSelectedCategory(cat);
    const catDef = mockReportCategories.find(c => c.id === cat);
    if (catDef) {
      setReportTitle(catDef.title);
      setSelectedSections(catDef.defaultSections);
    }
  };

  const handleToggleSection = (section: string) => {
    if (selectedSections.includes(section)) {
      if (selectedSections.length === 1) {
        setValidationError('At least one report section must remain selected.');
        return;
      }
      setSelectedSections(selectedSections.filter(s => s !== section));
    } else {
      setSelectedSections([...selectedSections, section]);
    }
    setValidationError(null);
  };

  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (!reportTitle.trim()) {
      setValidationError('Please specify a report title.');
      return;
    }
    if (selectedSections.length === 0) {
      setValidationError('Please select at least one report section to include.');
      return;
    }
    setValidationError(null);
    setCurrentStep(3);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setValidationError(null);

    const config: ReportConfig = {
      title: reportTitle.trim(),
      category: selectedCategory,
      dateRange: {
        preset: datePreset,
        startDate: datePreset === 'custom' ? customStartDate : undefined,
        endDate: datePreset === 'custom' ? customEndDate : undefined,
        label: datePreset === '7d' ? 'Last 7 Days' : datePreset === '30d' ? 'Last 30 Days' : datePreset === '90d' ? 'Last 90 Days' : `Custom: ${customStartDate} to ${customEndDate}`
      },
      department: selectedDept,
      projectId: selectedProjectId,
      sections: selectedSections,
      includeCharts,
      includeTables,
      includeComparison,
      format: outputFormat
    };

    try {
      const newReport = await reportService.generateReport(config);
      setIsGenerating(false);
      onReportCreated(newReport);
    } catch (err) {
      console.error('Error generating report:', err);
      setValidationError('Failed to generate report. Please try again.');
      setIsGenerating(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'layers': return <Layers className="w-5 h-5 text-[--color-accent-cyan]" />;
      case 'users': return <Users className="w-5 h-5 text-[--color-accent-lime]" />;
      case 'folder-kanban': return <FolderKanban className="w-5 h-5 text-amber-400" />;
      case 'network': return <Network className="w-5 h-5 text-purple-400" />;
      case 'brain-circuit': return <BrainCircuit className="w-5 h-5 text-cyan-400" />;
      case 'shield-check': return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      default: return <FileText className="w-5 h-5 text-[--color-accent-cyan]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Modal Header */}
        <div 
          className="p-6 border-b flex items-start justify-between gap-4"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  color: 'var(--color-accent-cyan)',
                  border: '1px solid rgba(2, 132, 199, 0.25)'
                }}
              >
                <Sparkles className="w-3 h-3" />
                Step 0{currentStep} of 03
              </span>
              <span className="text-xs text-[--color-text-muted] font-medium">
                {currentStep === 1 && 'Select Report Category'}
                {currentStep === 2 && 'Configure Parameters & Filters'}
                {currentStep === 3 && 'Preview & Generate Report'}
              </span>
            </div>

            <h2 
              className="text-xl sm:text-2xl font-display font-bold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {currentStep === 1 && 'Select Report Type'}
              {currentStep === 2 && 'Configure Report Parameters'}
              {currentStep === 3 && 'Review & Generate Report'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[--color-surface-2] transition-colors text-[--color-text-muted] hover:text-[--color-text-primary]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div 
            className="mx-6 mt-4 p-3 rounded-xl border text-xs font-semibold shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: '#ef4444',
              color: '#ef4444'
            }}
          >
            {validationError}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          
          {/* STEP 1: Select Category */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {mockReportCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-[--color-accent-cyan] shadow-lg'
                        : 'hover:border-[--color-border-strong] hover:bg-[--color-surface-2]/60'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                      borderColor: isSelected ? 'var(--color-accent-cyan)' : 'var(--color-border-subtle)'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border-strong)'
                          }}
                        >
                          {getCategoryIcon(cat.iconName)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{
                              backgroundColor: 'var(--color-surface-2)',
                              color: cat.accentColor,
                              border: '1px solid var(--color-border-strong)'
                            }}
                          >
                            {cat.badge}
                          </span>

                          <div 
                            className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-[--color-accent-cyan] border-[--color-accent-cyan] text-white' 
                                : 'border-[--color-border-strong] bg-[var(--color-surface-2)]'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      <h3 
                        className="font-display font-bold text-sm mb-1"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {cat.title}
                      </h3>

                      <p 
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[--color-border-subtle] text-[10px] text-[--color-text-muted]">
                      {cat.defaultSections.length} report sections included
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2: Configure Parameters */}
          {currentStep === 2 && (
            <div className="space-y-5">
              
              {/* Report Title */}
              <div className="space-y-1.5">
                <label htmlFor={titleInputId} className="text-xs font-bold text-[--color-text-primary]">
                  Report Title
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter a descriptive report name..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                />
              </div>

              {/* Scope Filters: Date Range, Department, Project */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Date Preset */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[--color-text-primary] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[--color-text-muted]" />
                    <span>Reporting Period</span>
                  </label>
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value as ReportDatePreset)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none"
                  >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[--color-text-primary] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[--color-text-muted]" />
                    <span>Target Department</span>
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none"
                  >
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
                    ))}
                  </select>
                </div>

                {/* Project Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[--color-text-primary] flex items-center gap-1">
                    <FolderGit2 className="w-3.5 h-3.5 text-[--color-text-muted]" />
                    <span>Project Scope</span>
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none truncate"
                  >
                    {projectOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Date Pickers */}
              {datePreset === 'custom' && (
                <div className="p-3 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="text-[--color-text-muted]">Start:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2 py-1 rounded bg-[--color-surface-1] border border-[--color-border-subtle] text-[--color-text-primary]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[--color-text-muted]">End:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2 py-1 rounded bg-[--color-surface-1] border border-[--color-border-subtle] text-[--color-text-primary]"
                    />
                  </div>
                </div>
              )}

              {/* Section Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-[--color-border-subtle]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[--color-text-primary]">
                    Sections to Include in Report
                  </label>
                  <span className="text-[11px] text-[--color-text-muted]">
                    {selectedSections.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentCategoryDef.defaultSections.map((sec) => {
                    const isChecked = selectedSections.includes(sec);
                    return (
                      <div
                        key={sec}
                        onClick={() => handleToggleSection(sec)}
                        className="p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors hover:bg-[--color-surface-2]"
                        style={{
                          backgroundColor: isChecked ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                          borderColor: isChecked ? 'var(--color-accent-cyan)' : 'var(--color-border-subtle)'
                        }}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[--color-accent-cyan] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[--color-text-muted] shrink-0" />
                        )}
                        <span className="text-xs font-medium text-[--color-text-primary] line-clamp-1">
                          {sec}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Display & Output Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[--color-border-subtle]">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[--color-text-primary]">Visual Inclusions</label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCharts}
                        onChange={(e) => setIncludeCharts(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-[--color-text-secondary]">Include Visual Charts & Graphs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTables}
                        onChange={(e) => setIncludeTables(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-[--color-text-secondary]">Include Detailed Data Tables</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeComparison}
                        onChange={(e) => setIncludeComparison(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-[--color-text-secondary]">Compare with Previous Period</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor={formatInputId} className="text-xs font-bold text-[--color-text-primary]">Primary Output Format</label>
                  <div className="flex items-center gap-2">
                    <button
                      id={formatInputId}
                      type="button"
                      onClick={() => setOutputFormat('PDF')}
                      className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        outputFormat === 'PDF' ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
                      }`}
                      style={outputFormat !== 'PDF' ? {
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border-subtle)',
                        color: 'var(--color-text-secondary)'
                      } : {}}
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF Document</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutputFormat('CSV')}
                      className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        outputFormat === 'CSV' ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
                      }`}
                      style={outputFormat !== 'CSV' ? {
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border-subtle)',
                        color: 'var(--color-text-secondary)'
                      } : {}}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>CSV Spreadsheet</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Preview & Generate */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div 
                className="p-5 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-subtle)'
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shadow-xs"
                      style={{
                        backgroundColor: 'var(--color-surface-1)',
                        borderColor: 'var(--color-border-strong)',
                        color: currentCategoryDef.accentColor
                      }}
                    >
                      {currentCategoryDef.badge}
                    </span>
                    <h3 className="text-base font-bold text-[--color-text-primary] mt-1">
                      {reportTitle}
                    </h3>
                  </div>

                  <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-[--color-surface-1] border border-[--color-border-subtle] font-bold text-[--color-accent-cyan]">
                    {outputFormat} Format
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[--color-border-subtle] text-xs">
                  <div>
                    <span className="text-[10px] text-[--color-text-muted] uppercase font-bold">Scope</span>
                    <div className="font-semibold text-[--color-text-primary]">{selectedDept}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[--color-text-muted] uppercase font-bold">Period</span>
                    <div className="font-semibold text-[--color-text-primary]">
                      {datePreset === '7d' ? 'Last 7 Days' : datePreset === '30d' ? 'Last 30 Days' : datePreset === '90d' ? 'Last 90 Days' : 'Custom'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[--color-text-muted] uppercase font-bold">Inclusions</span>
                    <div className="font-semibold text-[--color-text-primary]">
                      {includeCharts ? 'Charts' : ''} {includeTables ? '• Tables' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections summary list */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[--color-text-primary]">
                  Configured Report Sections ({selectedSections.length})
                </span>
                <div className="space-y-1">
                  {selectedSections.map((sec, i) => (
                    <div 
                      key={sec} 
                      className="p-2 rounded-lg bg-[--color-surface-2] text-xs text-[--color-text-secondary] flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[--color-accent-lime] shrink-0" />
                      <span>Section 0{i + 1}: {sec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div 
          className="p-5 border-t flex items-center justify-between gap-3"
          style={{ 
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-subtle)' 
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((currentStep - 1) as any)}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-colors hover:bg-[var(--color-surface-hover)] flex items-center gap-1.5 cursor-pointer"
              style={{
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)'
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer"
              style={{
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-2">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleStep1Next}
                className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
              >
                <span>Continue to Parameters</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleStep2Next}
                className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
              >
                <span>Preview Configuration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Generate & Open Report</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
