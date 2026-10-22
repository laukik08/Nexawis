"""
NEXAWIS Backend - In-App Notification Service.
Manages notification creation, recipient eligibility, deduplication, unread counts,
and preference resolution scoped strictly to authenticated users and workspaces.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.orm import selectinload

from app.models.notification import Notification
from app.models.user import User, UserPreference
from app.models.workspace import WorkspaceMember
from app.core.logging import logger


class NotificationService:
    """Enterprise notification lifecycle management."""

    @classmethod
    async def create_notification(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        title: str,
        message: str,
        category: str,
        severity: str = "info",
        link: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        notification_metadata: Optional[Dict[str, Any]] = None,
        dedup_key: Optional[str] = None,
        dedup_window_hours: int = 24,
    ) -> Optional[Notification]:
        """
        Creates and persists an in-app notification after verifying:
        1. Recipient is an active member of the workspace.
        2. Recipient preferences permit the notification (unless critical).
        3. Deduplication check: suppresses duplicates within the cooldown window.
        """
        # 1. Validate recipient workspace membership
        member_q = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.is_active == True,  # noqa: E712
        )
        membership = (await db.execute(member_q)).scalar_one_or_none()
        if not membership:
            logger.warning(
                f"Suppressed notification for user {user_id}: Not an active member of workspace {workspace_id}"
            )
            return None

        # 2. Check recipient preferences (critical alerts cannot be disabled)
        if severity != "critical":
            pref_q = select(UserPreference).where(UserPreference.user_id == user_id)
            pref = (await db.execute(pref_q)).scalar_one_or_none()
            if pref and pref.notification_settings:
                settings = pref.notification_settings
                channels = settings.get("deliveryChannels", {})
                if channels.get("inAppBadge") is False:
                    # User opted out of all in-app notifications
                    return None

                # Category-specific preference mapping
                category_map = {
                    "project": settings.get("projectUpdates", {}).get("statusChanges", True),
                    "workload": settings.get("workforceIntelligence", {}).get("burnoutRisk", True),
                    "team_formation": settings.get("teamFormation", {}).get("recommendationsReady", True),
                    "report": settings.get("reports", {}).get("automatedGenerated", True),
                    "ml_risk": settings.get("workforceIntelligence", {}).get("burnoutRisk", True),
                }
                if category in category_map and not category_map[category]:
                    return None

        # 3. Deduplication check
        if dedup_key:
            cooldown_time = datetime.now(timezone.utc) - timedelta(hours=dedup_window_hours)
            existing_q = select(Notification).where(
                Notification.workspace_id == workspace_id,
                Notification.user_id == user_id,
                Notification.dedup_key == dedup_key,
                Notification.created_at >= cooldown_time,
                Notification.is_read == False,  # noqa: E712
            )
            existing = (await db.execute(existing_q)).scalar_one_or_none()
            if existing:
                logger.debug(f"Suppressed duplicate notification {dedup_key} for user {user_id}")
                return None

        # 4. Create and persist notification
        notif = Notification(
            id=uuid.uuid4(),
            workspace_id=workspace_id,
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            severity=severity,
            is_read=False,
            link=link,
            resource_type=resource_type,
            resource_id=resource_id,
            notification_metadata=notification_metadata or {},
            dedup_key=dedup_key,
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        return notif

    @classmethod
    async def get_user_notifications(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        is_read: Optional[bool] = None,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Notification]:
        """Fetches notifications for a user in the active workspace with optional filters."""
        query = select(Notification).where(
            Notification.workspace_id == workspace_id,
            Notification.user_id == user_id,
        )
        if is_read is not None:
            query = query.where(Notification.is_read == is_read)
        if category:
            query = query.where(Notification.category == category)

        query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        return list((await db.execute(query)).scalars().all())

    @classmethod
    async def get_unread_count(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> int:
        """Fast aggregate query returning the count of unread notifications."""
        query = select(func.count(Notification.id)).where(
            Notification.workspace_id == workspace_id,
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
        return int((await db.execute(query)).scalar() or 0)

    @classmethod
    async def mark_as_read(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        notification_id: uuid.UUID,
    ) -> Optional[Notification]:
        """Marks a single notification as read after validating ownership."""
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.workspace_id == workspace_id,
            Notification.user_id == user_id,
        )
        notif = (await db.execute(query)).scalar_one_or_none()
        if not notif:
            return None

        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(notif)
        return notif

    @classmethod
    async def mark_all_as_read(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> int:
        """Marks all unread notifications as read for the user in the active workspace."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(Notification)
            .where(
                Notification.workspace_id == workspace_id,
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True, read_at=now)
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount

    @classmethod
    async def delete_notification(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        notification_id: uuid.UUID,
    ) -> bool:
        """Deletes/dismisses a single notification validating user and workspace ownership."""
        stmt = delete(Notification).where(
            Notification.id == notification_id,
            Notification.workspace_id == workspace_id,
            Notification.user_id == user_id,
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount > 0

    @classmethod
    async def get_user_preferences(
        cls,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """Retrieves user notification preferences or default structure."""
        query = select(UserPreference).where(UserPreference.user_id == user_id)
        pref = (await db.execute(query)).scalar_one_or_none()
        if pref and pref.notification_settings:
            return pref.notification_settings

        # Default configuration
        return {
            "projectUpdates": {"statusChanges": True, "deadlines": True, "riskThreshold": True},
            "teamFormation": {"optimizationComplete": True, "recommendationsReady": True, "balanceAlerts": True},
            "workforceIntelligence": {"burnoutRisk": True, "skillScarcity": True, "awisFluctuations": True},
            "reports": {"automatedGenerated": True, "weeklyDigest": True, "scheduledDistribution": True},
            "productUpdates": {"systemMaintenance": True, "featureAnnouncements": True},
            "deliveryChannels": {"inAppBadge": True, "emailDigest": True},
        }

    @classmethod
    async def update_user_preferences(
        cls,
        db: AsyncSession,
        user_id: uuid.UUID,
        settings: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Updates user notification preferences."""
        query = select(UserPreference).where(UserPreference.user_id == user_id)
        pref = (await db.execute(query)).scalar_one_or_none()
        if not pref:
            pref = UserPreference(
                id=uuid.uuid4(),
                user_id=user_id,
                notification_settings=settings,
            )
            db.add(pref)
        else:
            pref.notification_settings = settings
        await db.commit()
        return pref.notification_settings or {}
