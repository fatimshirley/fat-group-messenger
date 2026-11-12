from fastapi import APIRouter, Depends, Body, status
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.auth.dependencies import get_current_user

from src.users.models import User

from src.channels import services
from src.channels.schemas import (
    ChannelCreate,
    ChannelUpdate,
    ChannelResponse,
    ChannelDetailResponse,
    ChannelMemberCreate,
    ChannelMemberResponse,
    ChannelRoleUpdate,
    UserSummaryResponse
)

router = APIRouter(
    prefix="/channels",
    tags=["Channels"]
)


# ==========================================================
# CREATION D'UN SALON OU GROUPE
# ==========================================================

@router.post(
    "/",
    response_model=ChannelResponse,
    status_code=status.HTTP_201_CREATED
)
def create_channel(
    channel_data: ChannelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.create_channel(
        db,
        channel_data,
        current_user
    )


# ==========================================================
# LISTE DES SALONS
# ==========================================================

@router.get(
    "/",
    response_model=list[ChannelResponse]
)
def get_channels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.get_channels(
        db,
        current_user
    )


# ==========================================================
# DETAIL D'UN SALON
# ==========================================================

@router.get(
    "/{channel_id}",
    response_model=ChannelDetailResponse
)
def get_channel_details(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.get_channel_details(
        db,
        channel_id,
        current_user
    )


# ==========================================================
# MODIFICATION D'UN SALON
# ==========================================================

@router.patch(
    "/{channel_id}",
    response_model=ChannelResponse
)
def update_channel(
    channel_id: int,
    channel_data: ChannelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.update_channel(
        db,
        channel_id,
        channel_data,
        current_user
    )


# ==========================================================
# DESACTIVATION D'UN SALON
# ==========================================================

@router.delete(
    "/{channel_id}",
    response_model=ChannelResponse
)
def deactivate_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.deactivate_channel(
        db,
        channel_id,
        current_user
    )


# ==========================================================
# UTILISATEURS DISPONIBLES POUR UN GROUPE
# ==========================================================

@router.get(
    "/{channel_id}/available-members",
    response_model=list[UserSummaryResponse]
)
def get_available_channel_members(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.get_available_channel_members(
        db,
        channel_id,
        current_user
    )

# ==========================================================
# AJOUT D'UN PARTICIPANT
# ==========================================================

@router.post(
    "/{channel_id}/members",
    response_model=ChannelMemberResponse,
    status_code=status.HTTP_201_CREATED
)
def add_channel_member(
    channel_id: int,
    member_data: ChannelMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.add_channel_member(
        db=db,
        channel_id=channel_id,
        user_id=member_data.user_id,
        current_user=current_user,
        role=member_data.role
    )


# ==========================================================
# RETRAIT D'UN PARTICIPANT
# ==========================================================

@router.delete(
    "/{channel_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_channel_member(
    channel_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    services.remove_channel_member(
        db,
        channel_id,
        user_id,
        current_user
    )


# ==========================================================
# MODIFICATION DU ROLE D'UN PARTICIPANT
# ==========================================================

@router.patch(
    "/{channel_id}/members/{user_id}/role",
    response_model=ChannelMemberResponse
)
def update_member_role(
    channel_id: int,
    user_id: int,
    role_data: ChannelRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.update_member_role(
        db,
        channel_id,
        user_id,
        role_data.role,
        current_user
    )


# ==========================================================
# TRANSFERT DE PROPRIETE
# ==========================================================

@router.post(
    "/{channel_id}/transfer-ownership",
    response_model=ChannelMemberResponse
)
def transfer_channel_ownership(
    channel_id: int,
    new_owner_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.transfer_channel_ownership(
        db,
        channel_id,
        new_owner_id,
        current_user
    )