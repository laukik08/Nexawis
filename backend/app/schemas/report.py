"""
NEXAWIS Backend - Reporting & Export Module Pydantic Schemas.
Defines typed request and response contracts for report configuration,
generation, library listings, KPI metrics, preview, and scheduled distributions.
"""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


class ReportDateRangeSchema(BaseModel):
    preset: str = Field(default="30d", pattern="^(7d|30d|90d|custom)$")
    startDate: Optional[str] = Field(default=None, description="ISO date YYYY-MM-DD")
    endDate: Optional[str] = Field(default=None, description="ISO date YYYY-MM-DD")
    label: str = Field(default="Last 30 Days")


class ReportConfigSchema(BaseModel):
    title: str = Field(default="NEXAWIS Intelligence Report", max_length=200)
    category: Literal[
        "workforce",
        "projects",
        "team_formation",
        "awis_intelligence",
        "sustainability",
        "executive",
    ] = Field(default="executive")
    dateRange: ReportDateRangeSchema = Field(default_factory=ReportDateRangeSchema)
    department: str = Field(default="All")
    projectId: str = Field(default="All")
    sections: List[str] = Field(default_factory=list)
    includeCharts: bool = Field(default=True)
    includeTables: bool = Field(default=True)
    includeComparison: bool = Field(default=True)
    format: Literal["PDF", "CSV"] = Field(default="PDF")


class ReportMetricItemSchema(BaseModel):
    label: str
    value: Any
    unit: Optional[str] = None
    change: Optional[str] = None
    trend: Optional[Literal["up", "down", "neutral"]] = "neutral"
    status: Optional[Literal["positive", "warning", "neutral", "critical"]] = "neutral"
    benchmark: Optional[str] = None


class ReportInsightItemSchema(BaseModel):
    id: str
    title: str
    observation: str
    metric: str
    priority: Literal["high", "medium", "info"] = "info"
    actionUrl: Optional[str] = None
    actionLabel: Optional[str] = None


class ReportTableDataSchema(BaseModel):
    title: str
    description: Optional[str] = None
    headers: List[str]
    rows: List[List[Any]]


class ReportChartDataPointSchema(BaseModel):
    name: str
    value: float
    secondaryValue: Optional[float] = None
    color: Optional[str] = None
    category: Optional[str] = None


class ReportChartsSchema(BaseModel):
    primaryChartTitle: str
    primaryChartType: Literal["bar", "area", "donut"] = "bar"
    primaryChartData: List[ReportChartDataPointSchema] = Field(default_factory=list)
    secondaryChartTitle: Optional[str] = None
    secondaryChartType: Optional[Literal["bar", "area", "donut"]] = None
    secondaryChartData: Optional[List[ReportChartDataPointSchema]] = None


class ReportRecordSchema(BaseModel):
    id: str
    name: str
    category: str
    reportingPeriod: str
    createdAt: str
    createdBy: str
    status: str = "Ready"
    format: str = "PDF"
    fileSizeBytes: int = 0
    config: ReportConfigSchema
    summaryMetrics: List[ReportMetricItemSchema] = Field(default_factory=list)
    findings: List[str] = Field(default_factory=list)
    warnings: Optional[List[str]] = None
    insights: List[ReportInsightItemSchema] = Field(default_factory=list)
    charts: Optional[ReportChartsSchema] = None
    tableData: Optional[ReportTableDataSchema] = None


class ReportKpiMetricsSchema(BaseModel):
    totalReports: int
    reportsGenerated: int
    scheduledReports: int
    latestReportDate: str
    latestReportName: str


class ReportCategoryDefSchema(BaseModel):
    id: str
    title: str
    badge: str
    description: str
    iconName: str
    accentColor: str
    defaultSections: List[str]


class ScheduledReportDefSchema(BaseModel):
    id: str
    name: str
    category: str
    frequency: str
    nextRunDate: Optional[str] = None
    recipients: List[str]
    enabled: bool
    format: str
    department: str
    createdAt: str


class ScheduledReportCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    category: Literal[
        "workforce",
        "projects",
        "team_formation",
        "awis_intelligence",
        "sustainability",
        "executive",
    ] = Field(default="executive")
    frequency: Literal["Daily", "Weekly", "Monthly"] = Field(default="Weekly")
    recipients: List[str] = Field(default_factory=list)
    enabled: bool = Field(default=True)
    format: Literal["PDF", "CSV"] = Field(default="PDF")
    department: str = Field(default="All")


class ReportFilterOptionsResponse(BaseModel):
    departments: List[str]
    projects: List[Dict[str, str]]
