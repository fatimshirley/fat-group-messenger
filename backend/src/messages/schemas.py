from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    field_validator
)


class MessageCreate(BaseModel):
    channel_id: int = Field(gt=0)
    content: str = Field(min_length=1, max_length=10000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Le message ne peut pas être vide.")

        return value


class MessageUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Le message ne peut pas être vide.")

        return value


class MessageSenderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
    email: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    channel_id: int
    sender_id: int
    sender: MessageSenderResponse = Field(exclude=True)

    content: str
    is_edited: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def sender_name(self) -> str:
        return (
            f"{self.sender.first_name} "
            f"{self.sender.last_name}"
        )