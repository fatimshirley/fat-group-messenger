from src.channels.models import Channel, ChannelMember
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context
from src.invitations.models import ChannelInvitation

from src.core.config import settings
from src.database.base import Base
from src.database.connection import DATABASE_URL
from src.users.models import User

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Métadonnées des modèles SQLAlchemy
target_metadata = Base.metadata

# Configuration de la connexion
config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL.render_as_string(hide_password=False).replace("%", "%%")
)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()