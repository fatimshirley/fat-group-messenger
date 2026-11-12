"""create messages table

Revision ID: 11c96fdc1e64
Revises: 8a8bd454af1b
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "11c96fdc1e64"
down_revision: Union[str, Sequence[str], None] = "8a8bd454af1b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "messages",

        sa.Column("id", sa.Integer(), primary_key=True),

        sa.Column(
            "channel_id",
            sa.Integer(),
            sa.ForeignKey("channels.id", ondelete="CASCADE"),
            nullable=False
        ),

        sa.Column(
            "sender_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False
        ),

        sa.Column(
            "content",
            sa.Text(),
            nullable=False
        ),

        sa.Column(
            "is_edited",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        ),

        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        )
    )

    op.create_index(
        "ix_messages_id",
        "messages",
        ["id"]
    )

    op.create_index(
        "ix_messages_channel_id",
        "messages",
        ["channel_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_messages_channel_id", table_name="messages")
    op.drop_index("ix_messages_id", table_name="messages")
    op.drop_table("messages")