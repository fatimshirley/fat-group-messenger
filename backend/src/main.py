from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.invitations.routes import router as invitations_router

from src.auth.routes import router as auth_router
from src.database.session import get_db
from src.users.routes import router as users_router
from src.channels.routes import router as channels_router

from src.messages.routes import router as messages_router

from src.websocket.routes import router as websocket_router

# Création de l'application
app = FastAPI(
    title="Messagerie Interne",
    description="API de messagerie interne pour une organisation",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des routes
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(channels_router)
app.include_router(invitations_router)
app.include_router(messages_router)
app.include_router(websocket_router)

# Route principale
@app.get("/")
def home():
    return {
        "message": "Bienvenue sur l'API de Messagerie Interne !",
        "status": "success"
    }

# Route de vérification
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "Messagerie Interne"
    }

# Vérification de la connexion à PostgreSQL
@app.get("/database-check")
def database_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT current_database()"))

    return {
        "status": "success",
        "database": result.scalar()
    }