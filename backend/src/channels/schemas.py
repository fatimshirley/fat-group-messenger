from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)

from src.channels.enums import ChannelType, ChannelRole


# ==========================================================
# CREATION D'UN SALON
# ==========================================================

class ChannelCreate(BaseModel):

    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    type: ChannelType

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:

        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Le nom du salon doit contenir au moins 2 caractères."
            )

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:

        if value is not None:
            value = value.strip()

            if not value:
                return None

        return value


# ==========================================================
# MODIFICATION D'UN SALON
# ==========================================================

class ChannelUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        max_length=1000
    )

    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:

        if value is not None:
            value = value.strip()

            if len(value) < 2:
                raise ValueError(
                    "Le nom du salon doit contenir au moins 2 caractères."
                )

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:

        if value is not None:
            value = value.strip()

            if not value:
                return None

        return value


# ==========================================================
# REPONSE SALON
# ==========================================================

class ChannelResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    type: ChannelType
    created_by_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ==========================================================
# INFORMATIONS SIMPLIFIEES D'UN UTILISATEUR
# ==========================================================

class UserSummaryResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: str


# ==========================================================
# REPONSE PARTICIPANT
# ==========================================================

class ChannelMemberResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    channel_id: int
    user_id: int
    role: ChannelRole
    joined_at: datetime
    user: UserSummaryResponse


# ==========================================================
# REPONSE DETAILLEE D'UN SALON
# ==========================================================

class ChannelDetailResponse(ChannelResponse):

    members: list[ChannelMemberResponse] = Field(
        default_factory=list
    )


# ==========================================================
# AJOUT D'UN PARTICIPANT
# ==========================================================

class ChannelMemberCreate(BaseModel):

    user_id: int = Field(gt=0)

    role: ChannelRole = ChannelRole.MEMBER


# ==========================================================
# MODIFICATION DU ROLE
# ==========================================================

class ChannelRoleUpdate(BaseModel):

    role: ChannelRole