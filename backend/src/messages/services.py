from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from src.messages.models import Message
from src.messages.schemas import MessageCreate, MessageUpdate
from src.channels import services as channel_services


def create_message(
    db: Session,
    message_data: MessageCreate,
    current_user
):
    channel = channel_services.get_channel_by_id(
        db,
        message_data.channel_id
    )

    channel_services.check_channel_access(
        db,
        channel,
        current_user
    )

    message = Message(
        channel_id=channel.id,
        sender_id=current_user.id,
        content=message_data.content
    )

    db.add(message)
    db.commit()

    db.refresh(message)

    return message


def get_channel_messages(
    db: Session,
    channel_id: int,
    current_user,
    limit: int = 50,
    offset: int = 0
):
    channel = channel_services.get_channel_by_id(
        db,
        channel_id
    )

    channel_services.check_channel_access(
        db,
        channel,
        current_user
    )

    return (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(
            Message.channel_id == channel.id,
            Message.is_deleted.is_(False)
        )
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def update_message(
    db: Session,
    message_id: int,
    message_data: MessageUpdate,
    current_user
):
    message = db.query(Message).filter(
        Message.id == message_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message introuvable."
        )

    channel = channel_services.get_channel_by_id(
        db,
        message.channel_id
    )

    channel_services.check_channel_access(
        db,
        channel,
        current_user
    )

    if (
        message.sender_id != current_user.id
        and current_user.role.value != "ADMIN"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez modifier que vos propres messages."
        )

    message.content = message_data.content
    message.is_edited = True

    db.commit()
    db.refresh(message)

    return message


def delete_message(
    db: Session,
    message_id: int,
    current_user
):
    message = db.query(Message).filter(
        Message.id == message_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message introuvable."
        )

    channel = channel_services.get_channel_by_id(
        db,
        message.channel_id
    )

    channel_services.check_channel_access(
        db,
        channel,
        current_user
    )

    if (
        message.sender_id != current_user.id
        and current_user.role.value != "ADMIN"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez supprimer que vos propres messages."
        )

    message.is_deleted = True
    message.content = "Ce message a été supprimé."

    db.commit()

    return {
        "message": "Message supprimé avec succès."
    }