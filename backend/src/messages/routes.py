from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.auth.dependencies import get_current_user
from src.users.models import User

from src.messages import services
from src.messages.schemas import (
    MessageCreate,
    MessageUpdate,
    MessageResponse
)

router = APIRouter(
    prefix="/messages",
    tags=["Messages"]
)


@router.post(
    "/",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED
)
def create_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.create_message(
        db,
        message_data,
        current_user
    )


@router.get(
    "/channel/{channel_id}",
    response_model=list[MessageResponse]
)
def get_channel_messages(
    channel_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.get_channel_messages(
        db,
        channel_id,
        current_user,
        limit,
        offset
    )


@router.patch("/{message_id}", response_model=MessageResponse)
def update_message(
    message_id: int,
    message_data: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.update_message(
        db,
        message_id,
        message_data,
        current_user
    )


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.delete_message(
        db,
        message_id,
        current_user
    )