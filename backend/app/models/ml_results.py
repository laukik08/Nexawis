"""
NEXAWIS Backend - AWIS Evaluations and Machine Learning Prediction Models.
Separates observed business entities from algorithmic outputs and model inference records.
"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, JSON_TYPE, utc_now

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.project import Project
    from app.models.employee import Employee
    from app.models.team_formation import TeamFormation


class AwisEvaluation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Evaluation record capturing the 9-dimensional Adaptive Workforce Intelligence Score (AWIS)
    for an employee in the context of a specific project.
    """
    __tablename__ = "awis_evaluations"
    __table_args__ = (
        Index("ix_awis_eval_lookup", "project_id", "employee_id"),
        Index("ix_awis_eval_score", "project_id", "composite_awis_score"),
        Index("ix_awis_eval_workspace", "workspace_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )
    formation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("team_formations.id", ondelete="SET NULL"),
        nullable=True,
    )

    scoring_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    composite_awis_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 100

    # 9 Normalized Dimensions (PRD §6.3)
    skill_intelligence: Mapped[float] = mapped_column(Float, nullable=False)
    experience_intelligence: Mapped[float] = mapped_column(Float, nullable=False)
    performance_intelligence: Mapped[float] = mapped_column(Float, nullable=False)
    availability_intelligence: Mapped[float] = mapped_column(Float, nullable=False)
    workload_intelligence: Mapped[float] = mapped_column(Float, nullable=False)
    burnout_intelligence: Mapped[float] = mapped_column(Float, nullable=False)
    collaboration_intelligence: Mapped[float] = mapped_column(Float, nullable=False)
    growth_intelligence: Mapped[float] = mapped_column(Float, nullable=False)
    compatibility_intelligence: Mapped[float] = mapped_column(Float, nullable=False)

    rank_position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    eligibility_passed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Qualitative explainability attributes (positives, concerns, summary)
    explanation_metadata: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="awis_evaluations")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="awis_evaluations")
    formation: Mapped[Optional["TeamFormation"]] = relationship("TeamFormation", back_populates="awis_evaluations")

    def __repr__(self) -> str:
        return f"<AwisEvaluation(project_id={self.project_id}, employee_id={self.employee_id}, score={self.composite_awis_score})>"


class MlBurnoutPrediction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Inference record storing outputs from the Burnout Prediction Model (burnout_model.pkl).
    Maintains provenance of inputs without modifying observed employee operational records.
    """
    __tablename__ = "ml_burnout_predictions"
    __table_args__ = (
        Index("ix_burnout_pred_emp", "employee_id", "predicted_at"),
        Index("ix_burnout_pred_workspace", "workspace_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )

    model_version: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'burnout_model_v1'
    predicted_burn_rate: Mapped[float] = mapped_column(Float, nullable=False)  # Continuous raw model output
    normalized_burnout_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 100 internal score
    risk_tier: Mapped[str] = mapped_column(String(20), nullable=False)  # 'Low', 'Moderate', 'High'

    # Exact snapshot of features at prediction time (10 features from PRD §6.1)
    feature_provenance: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    # SHAP feature contributions for Explainable AI (XAI)
    explanation_shap: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationship
    employee: Mapped["Employee"] = relationship("Employee", back_populates="burnout_predictions")

    def __repr__(self) -> str:
        return f"<MlBurnoutPrediction(employee_id={self.employee_id}, burn_rate={self.predicted_burn_rate}, risk='{self.risk_tier}')>"


class MlProjectSuccessPrediction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Inference record storing outputs from Project_Success_XGBoost.pkl for candidate or finalized teams.
    """
    __tablename__ = "ml_project_success_predictions"
    __table_args__ = (
        Index("ix_success_pred_proj", "project_id", "predicted_at"),
        Index("ix_success_pred_workspace", "workspace_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    formation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("team_formations.id", ondelete="SET NULL"),
        nullable=True,
    )

    model_version: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'Project_Success_XGBoost_v1'
    predicted_success_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 100 continuous score
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Aggregated team and project feature inputs (PRD §6.2)
    aggregated_team_features: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    positive_factors: Mapped[Optional[list]] = mapped_column(JSON_TYPE, nullable=True)
    negative_factors: Mapped[Optional[list]] = mapped_column(JSON_TYPE, nullable=True)

    # SHAP explanations for project success factors
    explanation_shap: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="success_predictions")
    formation: Mapped[Optional["TeamFormation"]] = relationship("TeamFormation", back_populates="success_predictions")

    def __repr__(self) -> str:
        return f"<MlProjectSuccessPrediction(project_id={self.project_id}, success_score={self.predicted_success_score})>"
