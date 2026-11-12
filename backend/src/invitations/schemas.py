from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InvitationCreate(BaseModel):
    expires_in_hours: int = Field(
        default=168,
        ge=1,
        le=720
    )

    max_uses: int | None = Field(
        default=20,
        ge=1,
        le=500
    )


class InvitationResponse(BaseModel):
    id: int
    channel_id: int
    token: str
    expires_at: datetime
    max_uses: int | None
    uses_count: int
    created_at: datetime


class InvitationAcceptedResponse(BaseModel):
    message: str
    channel_id: int
    channel_name: str


class InvitationRevokeResponse(BaseModel):
    message: str