"""
NEXAWIS Backend - Common Response and Error Schemas.
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str
    type: Optional[str] = None


class ErrorEnvelope(BaseModel):
    code: str
    message: str
    details: Optional[Union[List[ErrorDetail], Dict[str, Any], str]] = None


class ErrorResponse(BaseModel):
    error: ErrorEnvelope
