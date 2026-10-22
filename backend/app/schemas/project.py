"""
NEXAWIS Backend - Project Management API Schemas.
Pydantic contracts for projects, requirements, milestones, risk indicators,
workforce capacity, and team allocations.
Supports camelCase serialization for the frontend and standard Python properties.
"""

from datetime import date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ProjectRequirementItem(BaseModel):
    """Technical or domain skill prerequisite demanded by the project."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    skill: str = Field(..., min_length=1, max_length=100)
    priority: str = Field(default="High", pattern=r"^(Critical|High|Medium|Low)$")
    level: str = Field(default="Advanced")


class ProjectTeamMemberItem(BaseModel):
    """Allocated employee assignment record on a project team."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    name: str
    avatar_url: str = Field(alias="avatarUrl")
    role: str
    primary_skill: str = Field(alias="primarySkill")
    allocation_percent: float = Field(default=50.0, ge=0.0, le=200.0, alias="allocationPercent")
    performance_score: float = Field(default=80.0, alias="performanceScore")
    team_fit: float = Field(default=80.0, alias="teamFit")
    wellbeing_risk: str = Field(default="Low", alias="wellbeingRisk")


class ProjectMilestoneItem(BaseModel):
    """Project delivery milestone."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    name: str
    status: str = Field(default="Upcoming", pattern=r"^(Completed|Current|Upcoming)$")
    date: str


class ProjectRiskItem(BaseModel):
    """Categorized risk vector."""
    model_config = ConfigDict(populate_by_name=True)

    category: str
    level: str = Field(default="Medium", pattern=r"^(Critical|High|Medium|Low)$")
    description: str
    trend: str = Field(default="stable", pattern=r"^(up|down|stable)$")


class ProjectSuccessPredictionItem(BaseModel):
    """Success forecast envelope."""
    model_config = ConfigDict(populate_by_name=True)

    score: float = 85.0
    trend: str = "stable"
    positive_factors: List[str] = Field(default_factory=list, alias="positiveFactors")
    negative_factors: List[str] = Field(default_factory=list, alias="negativeFactors")


class ProjectIntelligenceItem(BaseModel):
    """Quantitative features for project modeling."""
    model_config = ConfigDict(populate_by_name=True)

    priority_score: float = Field(default=50.0, alias="priorityScore")
    complexity_score: float = Field(default=50.0, alias="complexityScore")
    requirement_stability: float = Field(default=70.0, alias="requirementStability")
    technical_risk: float = Field(default=30.0, alias="technicalRisk")
    schedule_pressure: float = Field(default=40.0, alias="schedulePressure")
    client_engagement: float = Field(default=80.0, alias="clientEngagement")
    innovation_index: float = Field(default=50.0, alias="innovationIndex")
    scope_change: float = Field(default=10.0, alias="scopeChange")
    budget_variance: float = Field(default=0.0, alias="budgetVariance")
    delivery_delay_risk: float = Field(default=20.0, alias="deliveryDelayRisk")
    success_prediction: ProjectSuccessPredictionItem = Field(
        default_factory=ProjectSuccessPredictionItem,
        alias="successPrediction",
    )


class ProjectAwisFitExplanation(BaseModel):
    """Detailed explainability breakdowns."""
    model_config = ConfigDict(populate_by_name=True)

    positives: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)


class ProjectAwisFitItem(BaseModel):
    """Synergy and workforce compatibility index."""
    model_config = ConfigDict(populate_by_name=True)

    overall_score: float = Field(default=85.0, alias="overallScore")
    skills_match: float = Field(default=85.0, alias="skillsMatch")
    availability_match: float = Field(default=80.0, alias="availabilityMatch")
    experience_match: float = Field(default=88.0, alias="experienceMatch")
    workload_balance: float = Field(default=82.0, alias="workloadBalance")
    wellbeing_impact: float = Field(default=85.0, alias="wellbeingImpact")
    insights: List[str] = Field(default_factory=list)
    explanation: ProjectAwisFitExplanation = Field(default_factory=ProjectAwisFitExplanation)


class ProjectCapacityItem(BaseModel):
    """Workforce hours capacity and loading."""
    model_config = ConfigDict(populate_by_name=True)

    total_required: float = Field(default=160.0, alias="totalRequired")
    allocated: float = 0.0
    available: float = 160.0
    overloaded_members: int = Field(default=0, alias="overloadedMembers")
    balanced_members: int = Field(default=0, alias="balancedMembers")


class ProjectResponse(BaseModel):
    """Complete project profile contract aligned with the frontend Project interface."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    project_id: str = Field(alias="projectId")
    name: str
    description: str
    department: str
    client: Optional[str] = None
    project_manager: Optional[str] = Field(default=None, alias="projectManager")
    status: str
    priority: str
    complexity: str
    team_size: int = Field(alias="teamSize")
    progress: float
    overall_risk: str = Field(alias="overallRisk")
    team_fit: float = Field(alias="teamFit")
    start_date: str = Field(alias="startDate")
    deadline: str

    intelligence: ProjectIntelligenceItem
    requirements: List[ProjectRequirementItem] = Field(default_factory=list)
    current_team: List[ProjectTeamMemberItem] = Field(default_factory=list, alias="currentTeam")
    milestones: List[ProjectMilestoneItem] = Field(default_factory=list)
    risks: List[ProjectRiskItem] = Field(default_factory=list)
    awis_fit: ProjectAwisFitItem = Field(alias="awisFit")
    capacity: ProjectCapacityItem


class ProjectListResponse(BaseModel):
    """Paginated collection of project directory records."""
    model_config = ConfigDict(populate_by_name=True)

    items: List[ProjectResponse]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
    total_pages: int = Field(alias="totalPages")


class ProjectStatsResponse(BaseModel):
    """High-level project execution metrics."""
    model_config = ConfigDict(populate_by_name=True)

    total: int
    active: int
    on_track: int = Field(alias="onTrack")
    at_risk: int = Field(alias="atRisk")


class ProjectCreateRequest(BaseModel):
    """Client request to provision a new project in the workspace."""
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(default="", max_length=2000)
    department: str = Field(..., min_length=1, max_length=100)
    project_id: Optional[str] = Field(default=None, max_length=50, alias="projectId")
    client: Optional[str] = Field(default=None, max_length=150)
    project_manager: Optional[str] = Field(default=None, max_length=150, alias="projectManager")
    priority: str = Field(default="Medium", pattern=r"^(Critical|High|Medium|Low)$")
    status: str = Field(default="Planning")
    complexity: str = Field(default="Medium", pattern=r"^(High|Medium|Low)$")
    team_size: int = Field(default=4, ge=1, le=50, alias="teamSize")
    start_date: str = Field(alias="startDate")
    deadline: str
    requirements: Optional[List[ProjectRequirementItem]] = None


class ProjectUpdateRequest(BaseModel):
    """Client request to update existing project attributes."""
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=2000)
    department: Optional[str] = Field(default=None, min_length=1, max_length=100)
    client: Optional[str] = Field(default=None, max_length=150)
    project_manager: Optional[str] = Field(default=None, max_length=150, alias="projectManager")
    priority: Optional[str] = Field(default=None, pattern=r"^(Critical|High|Medium|Low)$")
    status: Optional[str] = None
    complexity: Optional[str] = Field(default=None, pattern=r"^(High|Medium|Low)$")
    team_size: Optional[int] = Field(default=None, ge=1, le=50, alias="teamSize")
    progress: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    start_date: Optional[str] = Field(default=None, alias="startDate")
    deadline: Optional[str] = None
    requirements: Optional[List[ProjectRequirementItem]] = None


class AddTeamMemberRequest(BaseModel):
    """Client request to allocate an employee to a project."""
    model_config = ConfigDict(populate_by_name=True)

    employee_id: str = Field(..., alias="id")
    role: Optional[str] = Field(default=None, max_length=100)
    allocation_percent: float = Field(default=100.0, ge=1.0, le=200.0, alias="allocationPercent")
    team_fit: Optional[float] = Field(default=85.0, ge=0.0, le=100.0, alias="teamFit")
