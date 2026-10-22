"""
NEXAWIS Backend - Analytics and Business Intelligence Pydantic Schemas.
Defines API request filters and response structures matching frontend contracts.
"""

from typing import Optional, List, Dict, Any, Literal
from datetime import date, datetime
from pydantic import BaseModel, Field


class AnalyticsDateRangeSchema(BaseModel):
    preset: str = Field(default="30d", description="'7d', '30d', '90d', or 'custom'")
    startDate: Optional[str] = Field(default=None, description="ISO date YYYY-MM-DD")
    endDate: Optional[str] = Field(default=None, description="ISO date YYYY-MM-DD")
    label: str = Field(default="Last 30 Days")


class AnalyticsFiltersSchema(BaseModel):
    dateRange: AnalyticsDateRangeSchema = Field(default_factory=AnalyticsDateRangeSchema)
    department: str = Field(default="All")
    projectId: str = Field(default="All")
    searchQuery: Optional[str] = Field(default="")


class KpiMetricSchema(BaseModel):
    id: str
    title: str
    value: Any
    unit: Optional[str] = None
    changePercent: Optional[float] = None
    changeDirection: Optional[Literal["up", "down", "neutral"]] = "neutral"
    changeLabel: Optional[str] = None
    benchmark: Optional[str] = None
    status: Optional[Literal["positive", "warning", "neutral", "critical"]] = "neutral"
    description: str
    trendData: Optional[List[float]] = None


class AnalyticsKpiSummarySchema(BaseModel):
    averageAwisScore: KpiMetricSchema
    workforceUtilization: KpiMetricSchema
    averageTeamFit: KpiMetricSchema
    workforceSustainability: KpiMetricSchema = Field(
        ...,
        description="Operational heuristic: Base 100 minus linear penalty weights (0.4*overallocated_pct + 0.4*high_burnout_pct). Established as an operational capacity rebalancing heuristic."
    )


class TimeSeriesPointSchema(BaseModel):
    date: str
    label: str
    value: float
    benchmark: Optional[float] = None
    secondaryValue: Optional[float] = None


class DistributionSliceSchema(BaseModel):
    name: str
    value: int
    percentage: float
    color: str
    secondaryInfo: Optional[str] = None


class SkillCoverageItemSchema(BaseModel):
    skill: str
    requiredCount: int
    availableCount: int
    coveragePercent: float
    gapCount: int
    status: Literal["Surplus", "Balanced", "Deficit"]


class WorkloadTierSummarySchema(BaseModel):
    tier: Literal["Underutilized", "Balanced", "High", "Overallocated"]
    label: str
    rangeLabel: str
    employeeCount: int
    percentage: float
    color: str
    description: str


class ProjectAnalyticsItemSchema(BaseModel):
    id: str
    projectId: str
    name: str
    department: str
    priority: str
    status: str
    progress: float
    risk: str
    teamSize: int
    teamFit: float
    deadline: str
    scheduleHealth: Literal["On Track", "At Risk", "Delayed"]
    demoSuccessScore: float


class EmployeeAnalyticsRowSchema(BaseModel):
    id: str
    employeeId: str
    name: str
    avatarUrl: Optional[str] = None
    department: str
    role: str
    experienceYears: float
    performanceScore: float
    availabilityScore: float
    workloadScore: float
    wellbeingRisk: str  # 'Low', 'Moderate', 'High', or 'Restricted' if masked
    awisFitScore: float
    primarySkill: str
    activeProjectsCount: int


class TeamFormationAnalyticsRowSchema(BaseModel):
    id: str
    projectId: str
    projectName: str
    projectDepartment: str
    teamSize: int
    teamFitScore: float
    skillCoveragePercent: float
    workloadBalanceScore: float
    sustainabilityScore: float
    status: str
    createdAt: str


class DemoInsightSchema(BaseModel):
    id: str
    type: Literal["opportunity", "warning", "achievement", "recommendation"]
    title: str
    observation: str
    metricLabel: str
    metricValue: str
    targetModule: Literal["employees", "projects", "teams"]
    actionLabel: str
    actionUrl: str


class WorkforceAnalyticsDataSchema(BaseModel):
    totalEmployees: int
    avgPerformance: float
    avgAvailability: float
    avgWorkload: float
    headcountByDepartment: List[DistributionSliceSchema]
    headcountByRole: List[DistributionSliceSchema]
    skillCoverage: List[SkillCoverageItemSchema]
    workloadTiers: List[WorkloadTierSummarySchema]
    wellbeingDistribution: List[DistributionSliceSchema]
    experienceDistribution: List[DistributionSliceSchema]
    tableRows: List[EmployeeAnalyticsRowSchema]


class ProjectAnalyticsDataSchema(BaseModel):
    totalProjects: int
    activeProjectsCount: int
    criticalProjectsCount: int
    avgProgress: float
    avgTeamFit: float
    statusDistribution: List[DistributionSliceSchema]
    priorityDistribution: List[DistributionSliceSchema]
    riskDistribution: List[DistributionSliceSchema]
    scheduleHealthDistribution: List[DistributionSliceSchema]
    tableRows: List[ProjectAnalyticsItemSchema]


class TeamAnalyticsDataSchema(BaseModel):
    totalFormations: int
    avgTeamFit: float
    avgSkillCoverage: float
    avgSustainability: float
    fitDistribution: List[DistributionSliceSchema]
    teamSizeDistribution: List[DistributionSliceSchema]
    statusDistribution: List[DistributionSliceSchema]
    tableRows: List[TeamFormationAnalyticsRowSchema]


class DepartmentBurnoutRiskSchema(BaseModel):
    department: str
    low: int
    moderate: int
    high: int
    avgWorkload: float


class SustainabilityAnalyticsDataSchema(BaseModel):
    sustainabilityIndex: float = Field(
        ...,
        description="Operational heuristic: Base 100 minus linear penalty weights (0.4*overallocated_pct + 0.4*high_burnout_pct). Established as an operational capacity rebalancing heuristic."
    )
    overallocatedCount: int
    overallocatedPercent: float
    highBurnoutRiskCount: int
    workloadVariance: float
    workloadTiers: List[WorkloadTierSummarySchema]
    departmentBurnoutRisks: List[DepartmentBurnoutRiskSchema]
    atRiskEmployees: List[EmployeeAnalyticsRowSchema]


class AnalyticsTrendsResponseSchema(BaseModel):
    awisTrend: List[TimeSeriesPointSchema]
    projectPerformanceTrend: List[TimeSeriesPointSchema]


class WorkforceOverviewDistributionSchema(BaseModel):
    byDepartment: List[DistributionSliceSchema]
    byRole: List[DistributionSliceSchema]
    byAvailability: List[DistributionSliceSchema]
    byWorkload: List[DistributionSliceSchema]


class TeamEffectivenessItemSchema(BaseModel):
    projectName: str
    teamFit: float
    status: str
    teamSize: int


class FullAnalyticsPayloadSchema(BaseModel):
    kpis: AnalyticsKpiSummarySchema
    awisTrend: List[TimeSeriesPointSchema]
    projectPerformanceTrend: List[TimeSeriesPointSchema]
    workforceDistribution: WorkforceOverviewDistributionSchema
    teamEffectiveness: List[TeamEffectivenessItemSchema]
    workloadCapacity: List[WorkloadTierSummarySchema]
    workforce: WorkforceAnalyticsDataSchema
    projects: ProjectAnalyticsDataSchema
    teams: TeamAnalyticsDataSchema
    sustainability: SustainabilityAnalyticsDataSchema
    insights: List[DemoInsightSchema]


class ProjectOptionItem(BaseModel):
    id: str
    name: str


class FilterOptionsResponse(BaseModel):
    departments: List[str]
    projects: List[ProjectOptionItem]
