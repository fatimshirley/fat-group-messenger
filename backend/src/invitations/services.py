import hashlib
import secrets

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.channels.models import Channel, ChannelMember
from src.channels.enums import ChannelType, ChannelRole
from src.channels import services as channel_services
from src.invitations.models import ChannelInvitation
from src.invitations.schemas import InvitationCreate
from src.users.models import User


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_invitation(
    db: Session,
    channel_id: int,
    invitation_data: InvitationCreate,
    current_user: User
):
    channel = channel_services.get_channel_by_id(db, channel_id)

    channel_services.check_channel_management(
        db,
        channel,
        current_user
    )

    if channel.type != ChannelType.GROUP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les invitations concernent uniquement les groupes."
        )

    if not channel.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce groupe est désactivé."
        )

    token = secrets.token_urlsafe(32)

    invitation = ChannelInvitation(
        channel_id=channel.id,
        created_by_id=current_user.id,
        token_hash=hash_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(
            hours=invitation_data.expires_in_hours
        ),
        max_uses=invitation_data.max_uses
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return {
        "id": invitation.id,
        "channel_id": invitation.channel_id,
        "token": token,
        "expires_at": invitation.expires_at,
        "max_uses": invitation.max_uses,
        "uses_count": invitation.uses_count,
        "created_at": invitation.created_at
    }


def accept_invitation(
    db: Session,
    token: str,
    current_user: User
):
    channel_services.check_active_user(current_user)

    invitation = db.query(ChannelInvitation).filter(
        ChannelInvitation.token_hash == hash_token(token)
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lien d'invitation invalide."
        )

    now = datetime.now(timezone.utc)

    if invitation.is_revoked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette invitation a été révoquée."
        )

    expires_at = invitation.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette invitation a expiré."
        )

    if (
        invitation.max_uses is not None
        and invitation.uses_count >= invitation.max_uses
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette invitation a atteint sa limite d'utilisation."
        )

    channel = channel_services.get_channel_by_id(
        db,
        invitation.channel_id
    )

    if not channel.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce groupe est désactivé."
        )

    if channel.type != ChannelType.GROUP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette invitation ne concerne pas un groupe."
        )

    existing_membership = db.query(ChannelMember).filter(
        ChannelMember.channel_id == channel.id,
        ChannelMember.user_id == current_user.id
    ).first()

    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vous êtes déjà membre de ce groupe."
        )

    membership = ChannelMember(
        channel_id=channel.id,
        user_id=current_user.id,
        role=ChannelRole.MEMBER
    )

    invitation.uses_count += 1

    db.add(membership)
    db.commit()

    return {
        "message": "Vous avez rejoint le groupe avec succès.",
        "channel_id": channel.id,
        "channel_name": channel.name
    }


def revoke_invitation(
    db: Session,
    invitation_id: int,
    current_user: User
):
    invitation = db.query(ChannelInvitation).filter(
        ChannelInvitation.id == invitation_id
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation introuvable."
        )

    channel = channel_services.get_channel_by_id(
        db,
        invitation.channel_id
    )

    channel_services.check_channel_management(
        db,
        channel,
        current_user
    )

    if invitation.is_revoked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette invitation est déjà révoquée."
        )

    invitation.is_revoked = True
    db.commit()

    return {
        "message": "Invitation révoquée avec succès."
    }