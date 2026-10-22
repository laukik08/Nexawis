"""
NEXAWIS Backend - Machine Learning Model Lifecycle Manager.
Handles controlled startup loading, cryptographic integrity verification,
self-testing, version pinning, and graceful degradation for ML artifacts.
"""

import hashlib
import pickle
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import joblib
import pandas as pd

from app.core.config import settings
from app.core.logging import logger
from app.schemas.ml import ModelArtifactStatus, MlModelsHealthResponse


class ModelLifecycleManager:
    """
    Singleton lifecycle manager for pre-trained machine learning models.
    Loads models once at startup into memory and verifies integrity before serving traffic.
    """

    def __init__(self) -> None:
        self.burnout_model: Optional[Any] = None
        self.project_success_model: Optional[Any] = None

        self._burnout_status: ModelArtifactStatus = ModelArtifactStatus(
            name=settings.BURNOUT_MODEL_FILENAME,
            version=settings.BURNOUT_MODEL_VERSION,
            is_loaded=False,
            status="unloaded",
            checksum_verified=False,
            expected_features_count=10,
            error=None,
        )

        self._project_success_status: ModelArtifactStatus = ModelArtifactStatus(
            name=settings.PROJECT_SUCCESS_MODEL_FILENAME,
            version=settings.PROJECT_SUCCESS_MODEL_VERSION,
            is_loaded=False,
            status="unloaded",
            checksum_verified=False,
            expected_features_count=23,
            error=None,
        )

        self.last_checked_at: datetime = datetime.now(timezone.utc)

    # --------------------------------------------------------------------------
    # Public Accessors
    # --------------------------------------------------------------------------

    def get_burnout_model(self) -> Optional[Any]:
        """Returns loaded burnout XGBRegressor model if healthy, else None."""
        if self._burnout_status.is_loaded:
            return self.burnout_model
        return None

    def get_project_success_model(self) -> Optional[Any]:
        """Returns loaded project success Pipeline model if healthy, else None."""
        if self._project_success_status.is_loaded:
            return self.project_success_model
        return None

    def get_health_status(self) -> MlModelsHealthResponse:
        """Returns current operational status of the ML inference subsystem."""
        burnout_ok = self._burnout_status.is_loaded
        proj_ok = self._project_success_status.is_loaded

        if burnout_ok and proj_ok:
            overall = "healthy"
        elif burnout_ok or proj_ok:
            overall = "degraded"
        else:
            overall = "unavailable"

        return MlModelsHealthResponse(
            status=overall,
            models={
                "burnout": self._burnout_status,
                "project_success": self._project_success_status,
            },
            timestamp=datetime.now(timezone.utc),
        )

    # --------------------------------------------------------------------------
    # Lifecycle Loading & Verification
    # --------------------------------------------------------------------------

    def load_models(self) -> None:
        """
        Executes startup model loading, checksum validation, and synthetic self-test.
        Catches all errors gracefully to prevent crashing application startup.
        """
        model_dir = Path(settings.ML_MODEL_DIR)
        logger.info(f"Initializing ML models from directory: {model_dir.name}")

        self._load_burnout_model(model_dir / settings.BURNOUT_MODEL_FILENAME)
        self._load_project_success_model(model_dir / settings.PROJECT_SUCCESS_MODEL_FILENAME)
        self.last_checked_at = datetime.now(timezone.utc)

        health = self.get_health_status()
        logger.info(
            f"ML inference subsystem initialized with status: [{health.status.upper()}]. "
            f"Burnout: {self._burnout_status.status}, ProjectSuccess: {self._project_success_status.status}"
        )

    def _verify_file_integrity(self, file_path: Path, expected_sha256: str) -> Tuple[bool, Optional[str]]:
        """Verifies file exists and matches the expected SHA-256 checksum."""
        if not file_path.exists() or not file_path.is_file():
            return False, "Model artifact file not found in canonical directory"

        try:
            content = file_path.read_bytes()
            actual_sha256 = hashlib.sha256(content).hexdigest().lower()
            if actual_sha256 != expected_sha256.lower():
                logger.error(
                    f"Integrity check failed for {file_path.name}: "
                    f"expected {expected_sha256[:12]}..., got {actual_sha256[:12]}..."
                )
                return False, "Artifact cryptographic integrity check failed (checksum mismatch)"
            return True, None
        except Exception as e:
            logger.error(f"Failed to read artifact {file_path.name}: {e}")
            return False, "Failed to read artifact file"

    def _load_burnout_model(self, file_path: Path) -> None:
        """Loads and self-tests the XGBoost Burnout Regression model."""
        is_valid, err = self._verify_file_integrity(file_path, settings.BURNOUT_MODEL_EXPECTED_SHA256)
        if not is_valid:
            self._burnout_status = ModelArtifactStatus(
                name=settings.BURNOUT_MODEL_FILENAME,
                version=settings.BURNOUT_MODEL_VERSION,
                is_loaded=False,
                status="missing" if "not found" in (err or "") else "failed",
                checksum_verified=False,
                expected_features_count=10,
                error=err,
            )
            return

        try:
            with open(file_path, "rb") as f:
                model = pickle.load(f)

            # Self-test with baseline synthetic input
            test_df = pd.DataFrame([{
                "Company_Type": 0,
                "WFH_Setup_Available": 1,
                "Designation": 2,
                "Experience_Years": 5.0,
                "Resource_Allocation": 5.0,
                "Mental_Fatigue_Score": 5.0,
                "Weekly_Work_Hours": 40.0,
                "Overtime_Hours": 0.0,
                "Utilization_Percentage": 80.0,
                "Consecutive_Working_Days": 5,
            }])

            pred = model.predict(test_df)
            val = float(pred[0])
            if not (0.0 <= val <= 1.0):
                raise ValueError(f"Self-test output out of bounds [0, 1]: {val}")

            self.burnout_model = model
            self._burnout_status = ModelArtifactStatus(
                name=settings.BURNOUT_MODEL_FILENAME,
                version=settings.BURNOUT_MODEL_VERSION,
                is_loaded=True,
                status="ready",
                checksum_verified=True,
                expected_features_count=10,
                error=None,
            )
            logger.info(f"Burnout model loaded and verified successfully. Self-test output: {val:.4f}")
        except Exception as e:
            logger.error(f"Burnout model initialization failed: {e}")
            self._burnout_status = ModelArtifactStatus(
                name=settings.BURNOUT_MODEL_FILENAME,
                version=settings.BURNOUT_MODEL_VERSION,
                is_loaded=False,
                status="failed",
                checksum_verified=True,
                expected_features_count=10,
                error="Model initialization or startup self-test failed",
            )

    def _load_project_success_model(self, file_path: Path) -> None:
        """Loads and self-tests the Project Success Pipeline (ColumnTransformer + XGBoost)."""
        is_valid, err = self._verify_file_integrity(file_path, settings.PROJECT_SUCCESS_EXPECTED_SHA256)
        if not is_valid:
            self._project_success_status = ModelArtifactStatus(
                name=settings.PROJECT_SUCCESS_MODEL_FILENAME,
                version=settings.PROJECT_SUCCESS_MODEL_VERSION,
                is_loaded=False,
                status="missing" if "not found" in (err or "") else "failed",
                checksum_verified=False,
                expected_features_count=23,
                error=err,
            )
            return

        try:
            model = joblib.load(file_path)

            # Self-test with known sample input
            test_df = pd.DataFrame([{
                "Organization": "AgileWorks Co",
                "Quarter": "Q1-2024",
                "Department": "Engineering",
                "Team_Size": 6.0,
                "Avg_Skill": 7.0,
                "Avg_Experience": 5.0,
                "Avg_Performance": 0.8,
                "Avg_Burnout": 4.0,
                "Avg_Training": 40.0,
                "Avg_Certifications": 3.0,
                "Avg_Collaboration": 7.5,
                "Mentor_Ratio": 0.3,
                "Project_Priority": "Critical",
                "Project_Complexity": "High",
                "Requirement_Stability": 5.0,
                "Tech_Risk": 4.0,
                "Schedule_Pressure": 5.0,
                "Client_Engagement": 6.0,
                "Innovation_Index": 5.0,
                "Scope_Change": 2.0,
                "Employee_Turnover": 1.0,
                "Budget_Variance": 5.0,
                "Delivery_Delay_Days": 0.0,
            }])

            pred = model.predict(test_df)
            val = float(pred[0])
            if not (0.0 <= val <= 100.0):
                raise ValueError(f"Self-test output out of bounds [0, 100]: {val}")

            self.project_success_model = model
            self._project_success_status = ModelArtifactStatus(
                name=settings.PROJECT_SUCCESS_MODEL_FILENAME,
                version=settings.PROJECT_SUCCESS_MODEL_VERSION,
                is_loaded=True,
                status="ready",
                checksum_verified=True,
                expected_features_count=23,
                error=None,
            )
            logger.info(f"Project success model loaded and verified successfully. Self-test output: {val:.2f}")
        except Exception as e:
            logger.error(f"Project success model initialization failed: {e}")
            self._project_success_status = ModelArtifactStatus(
                name=settings.PROJECT_SUCCESS_MODEL_FILENAME,
                version=settings.PROJECT_SUCCESS_MODEL_VERSION,
                is_loaded=False,
                status="failed",
                checksum_verified=True,
                expected_features_count=23,
                error="Model initialization or startup self-test failed",
            )


# Global singleton instance
model_manager = ModelLifecycleManager()
