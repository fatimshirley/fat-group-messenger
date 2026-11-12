from uuid import uuid4

from src.database.connection import SessionLocal
from src.users.enums import UserRole
from src.users.schemas import UserCreate
from src.users.services import create_user
from src.auth.security import verify_password


db = SessionLocal()

user = None

try:
    email = f"test_{uuid4().hex[:8]}@example.com"

    user_data = UserCreate(
        first_name="Utilisateur",
        last_name="Test",
        email=email,
        password="TestPassword123",
        role=UserRole.MEMBER
    )

    user = create_user(db, user_data)

    print("Utilisateur créé avec succès !")
    print("ID :", user.id)
    print("Email :", user.email)
    print("Rôle :", user.role.value)

    print(
        "Mot de passe correctement haché :",
        verify_password("TestPassword123", user.password_hash)
    )

except Exception as error:
    db.rollback()
    print("Erreur :", error)

finally:
    if user is not None:
        db.delete(user)
        db.commit()
        print("Utilisateur de test supprimé.")

    db.close()