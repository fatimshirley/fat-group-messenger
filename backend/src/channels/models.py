from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base
from src.channels.enums import ChannelType, ChannelRole


class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    type: Mapped[ChannelType] = mapped_column(
        SQLAlchemyEnum(ChannelType, name="channel_type"),
        nullable=False
    )

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    creator = relationship(
        "User",
        foreign_keys=[created_by_id]
    )

    members = relationship(
        "ChannelMember",
        back_populates="channel",
        cascade="all, delete-orphan"
    )


class ChannelMember(Base):
    __tablename__ = "channel_members"

    __table_args__ = (
        UniqueConstraint(
            "channel_id",
            "user_id",
            name="uq_channel_member"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    channel_id: Mapped[int] = mapped_column(
        ForeignKey("channels.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    role: Mapped[ChannelRole] = mapped_column(
        SQLAlchemyEnum(ChannelRole, name="channel_role"),
        default=ChannelRole.MEMBER,
        nullable=False
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    channel = relationship(
        "Channel",
        back_populates="members"
    )

    user = relationship(
        "User"
    )