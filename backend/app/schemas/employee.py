"""
NEXAWIS Backend - Employee Management API Schemas.
Pydantic contracts for employee records, skills, allocations, performance, and stats.
Supports both camelCase aliases for the frontend and standard Python attributes.
"""

from datetime import date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class SkillItem(BaseModel):
    """Employee technical or domain skill mapping."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    name: str = Field(..., min_length=1, max_length=100)
    proficiency: int = Field(default=70, ge=0, le=100)
    is_primary: bool = Field(default=False, alias="isPrimary")


class ProjectAllocationItem(BaseModel):
    """Active project allocation summary for an employee."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    name: str
    role: str
    allocation_percent: float = Field(default=50.0, alias="allocationPercent")
    priority: str = "Medium"
    team_fit: float = Field(default=80.0, alias="teamFit")
    status: str = "Active"


class PerformanceRecordItem(BaseModel):
    """Historical evaluation point."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    month: str
    score: float


class AwisInsightsItem(BaseModel):
    """Explainability narrative and factor insights."""
    model_config = ConfigDict(populate_by_name=True)

    positive: List[str] = Field(default_factory=list)
    negative: List[str] = Field(default_factory=list)
    summary: str = ""


class EmployeeListItemResponse(BaseModel):
    """Employee record representation for directory listings and card views."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    employee_id: str = Field(alias="employeeId")
    name: str
    email: str
    avatar_url: str = Field(alias="avatarUrl")
    role: str
    department: str
    experience_years: float = Field(alias="experienceYears")
    status: str
    performance_score: float = Field(alias="performanceScore")
    performance_trend: str = Field(alias="performanceTrend")
    availability_score: float = Field(alias="availabilityScore")
    workload_score: float = Field(alias="workloadScore")
    wellbeing_risk: Optional[str] = Field(default=None, alias="wellbeingRisk")
    growth_potential: float = Field(default=70.0, alias="growthPotential")
    awis_fit_score: float = Field(default=80.0, alias="awisFitScore")
    skills: List[SkillItem] = Field(default_factory=list)
    work_location: Optional[str] = Field(default=None, alias="workLocation")


class EmployeeDetailResponse(EmployeeListItemResponse):
    """Comprehensive employee profile with allocations, historical logs, and metrics."""
    employment_type: str = Field(default="Full-time", alias="employmentType")
    joining_date: Optional[date] = Field(default=None, alias="joiningDate")
    reporting_manager_id: Optional[str] = Field(default=None, alias="reportingManagerId")
    wfh_setup_available: bool = Field(default=True, alias="wfhSetupAvailable")
    company_type: str = Field(default="Service", alias="companyType")
    current_projects: List[ProjectAllocationItem] = Field(default_factory=list, alias="currentProjects")
    performance_history: List[PerformanceRecordItem] = Field(default_factory=list, alias="performanceHistory")
    awis_insights: AwisInsightsItem = Field(default_factory=AwisInsightsItem, alias="awisInsights")
    mental_fatigue_score: Optional[float] = Field(default=None, alias="mentalFatigueScore")


class EmployeeListResponse(BaseModel):
    """Paginated collection of employee directory listings."""
    model_config = ConfigDict(populate_by_name=True)

    items: List[EmployeeListItemResponse]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
    total_pages: int = Field(alias="totalPages")


class EmployeeStatsResponse(BaseModel):
    """Aggregated organizational capacity and headcount indicators."""
    model_config = ConfigDict(populate_by_name=True)

    total: int
    active: int
    available: int
    at_risk: int = Field(alias="atRisk")


class EmployeeCreateRequest(BaseModel):
    """Client payload to onboard a new employee into the workspace."""
    model_config = ConfigDict(populate_by_name=True)

    employee_code: str = Field(..., min_length=2, max_length=50, alias="employeeId")
    full_name: str = Field(..., min_length=1, max_length=150, alias="name")
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    department: str = Field(..., min_length=1, max_length=100)
    designation: str = Field(..., min_length=1, max_length=100, alias="role")
    experience_years: float = Field(default=0.0, ge=0.0, le=70.0, alias="experienceYears")
    employment_status: str = Field(default="Available", alias="status")
    employment_type: str = Field(default="Full-time", alias="employmentType")
    work_location: Optional[str] = Field(default="Remote", alias="workLocation")
    wfh_setup_available: bool = Field(default=True, alias="wfhSetupAvailable")
    company_type: str = Field(default="Service", alias="companyType")
    avatar_url: Optional[str] = Field(default=None, alias="avatarUrl")
    skills: Optional[List[SkillItem]] = None
    performance_score: Optional[float] = Field(default=80.0, ge=0.0, le=100.0, alias="performanceScore")
    performance_trend: Optional[str] = Field(default="stable", alias="performanceTrend")
    availability_score: Optional[float] = Field(default=100.0, ge=0.0, le=100.0, alias="availabilityScore")
    current_workload_percent: Optional[float] = Field(default=0.0, ge=0.0, le=200.0, alias="workloadScore")
    growth_potential: Optional[float] = Field(default=70.0, ge=0.0, le=100.0, alias="growthPotential")
    collaboration_score: Optional[float] = Field(default=80.0, ge=0.0, le=100.0, alias="awisFitScore")
    wellbeing_risk: Optional[str] = Field(default="Low", alias="wellbeingRisk")
    mental_fatigue_score: Optional[float] = Field(default=2.5, ge=0.0, le=10.0, alias="mentalFatigueScore")


class EmployeeUpdateRequest(BaseModel):
    """Client payload for updating employee information."""
    model_config = ConfigDict(populate_by_name=True)

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150, alias="name")
    department: Optional[str] = Field(default=None, min_length=1, max_length=100)
    designation: Optional[str] = Field(default=None, min_length=1, max_length=100, alias="role")
    experience_years: Optional[float] = Field(default=None, ge=0.0, le=70.0, alias="experienceYears")
    employment_status: Optional[str] = Field(default=None, alias="status")
    employment_type: Optional[str] = Field(default=None, alias="employmentType")
    work_location: Optional[str] = Field(default=None, alias="workLocation")
    wfh_setup_available: Optional[bool] = Field(default=None, alias="wfhSetupAvailable")
    avatar_url: Optional[str] = Field(default=None, alias="avatarUrl")
    skills: Optional[List[SkillItem]] = None
    performance_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, alias="performanceScore")
    performance_trend: Optional[str] = Field(default=None, alias="performanceTrend")
    availability_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, alias="availabilityScore")
    current_workload_percent: Optional[float] = Field(default=None, ge=0.0, le=200.0, alias="workloadScore")
    growth_potential: Optional[float] = Field(default=None, ge=0.0, le=100.0, alias="growthPotential")
    collaboration_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, alias="awisFitScore")
    wellbeing_risk: Optional[str] = Field(default=None, alias="wellbeingRisk")
