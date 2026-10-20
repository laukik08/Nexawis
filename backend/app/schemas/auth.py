"""
NEXAWIS Backend - Authentication and User Profile API Schemas.
Standardized response and request envelopes for verified identities and workspace memberships.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class UserProfileResponse(BaseModel):
    """Public application profile of an authenticated user."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clerk_user_id: str
    email: str
    full_name: str
    role: str
    title: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime


class WorkspaceBriefResponse(BaseModel):
    """Brief summary of a workspace and the user's role within it."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    role: str
    is_active: bool


class ProfileSyncRequest(BaseModel):
    """Client request payload to synchronize profile details from Clerk."""
    email: Optional[str] = Field(None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    full_name: Optional[str] = Field(None, min_length=1, max_length=150)

    avatar_url: Optional[str] = Field(None, max_length=500)
    title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)


class CreateWorkspaceRequest(BaseModel):
    """Client request to provision a new workspace partition."""
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class AuthMeResponse(BaseModel):
    """Complete authenticated session summary returned to the client application."""
    user: UserProfileResponse
    workspaces: List[WorkspaceBriefResponse]
    active_workspace_id: uuid.UUID
    active_workspace_role: str
    permissions: List[str]
