from sqlalchemy import create_engine, URL
from sqlalchemy.orm import sessionmaker

from src.core.config import settings


# Construction de l'URL de connexion
DATABASE_URL = URL.create(
    drivername="postgresql+psycopg",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME
)


# Création du moteur SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True
)


# Création des sessions
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)