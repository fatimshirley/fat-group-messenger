from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.auth.dependencies import get_current_user
from src.users.models import User

from src.invitations import services
from src.invitations.schemas import (
    InvitationCreate,
    InvitationResponse,
    InvitationAcceptedResponse,
    InvitationRevokeResponse
)


router = APIRouter(
    prefix="/invitations",
    tags=["Invitations"]
)


@router.post(
    "/channels/{channel_id}",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_invitation(
    channel_id: int,
    invitation_data: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.create_invitation(
        db,
        channel_id,
        invitation_data,
        current_user
    )


@router.post(
    "/{token}/accept",
    response_model=InvitationAcceptedResponse
)
def accept_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.accept_invitation(
        db,
        token,
        current_user
    )


@router.delete(
    "/{invitation_id}",
    response_model=InvitationRevokeResponse
)
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.revoke_invitation(
        db,
        invitation_id,
        current_user
    )