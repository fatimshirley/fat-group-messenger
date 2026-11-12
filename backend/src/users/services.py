from sqlalchemy.orm import Session

from src.users.models import User
from src.auth.security import hash_password
from src.users.schemas import UserCreate, UserUpdate
from src.users.enums import UserRole
from sqlalchemy import func

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_data: UserCreate):
    existing_user = get_user_by_email(db, user_data.email)

    if existing_user:
        raise ValueError("Cette adresse email est déjà utilisée.")

    hashed_password = hash_password(user_data.password)

    new_user = User(
    first_name=user_data.first_name,
    last_name=user_data.last_name,
    email=user_data.email,
    password_hash=hashed_password,
    role=UserRole.MEMBER
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def get_all_users(db: Session):
    return db.query(User).order_by(User.id.asc()).all()


def update_user(
    db: Session,
    user: User,
    user_data: UserUpdate,
    current_admin: User
):
    update_data = user_data.model_dump(exclude_unset=True)

    # Vérifier si le nouvel email est déjà utilisé
    new_email = update_data.get("email")

    if new_email is not None:
        existing_user = get_user_by_email(db, new_email)

        if existing_user and existing_user.id != user.id:
            raise ValueError("Cette adresse email est déjà utilisée.")

    # Empêcher un administrateur de désactiver son propre compte
    if (
        user.id == current_admin.id
        and update_data.get("is_active") is False
    ):
        raise ValueError(
            "Vous ne pouvez pas désactiver votre propre compte."
        )

    # Empêcher la désactivation du dernier administrateur actif
    if (
        user.role == UserRole.ADMIN
        and update_data.get("is_active") is False
    ):
        active_admins = db.query(func.count(User.id)).filter(
            User.role == UserRole.ADMIN,
            User.is_active.is_(True)
        ).scalar()

        if active_admins <= 1:
            raise ValueError(
                "Impossible de désactiver le dernier administrateur actif."
            )

    # Appliquer les modifications
    try:
        for field, value in update_data.items():
            setattr(user, field, value)

        db.commit()
        db.refresh(user)

        return user

    except Exception:
        db.rollback()
        raise