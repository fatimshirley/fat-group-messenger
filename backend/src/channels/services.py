from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from src.channels.models import Channel, ChannelMember
from src.channels.enums import ChannelType, ChannelRole
from src.channels.schemas import ChannelCreate, ChannelUpdate
from src.users.models import User
from src.users.enums import UserRole


# ==========================================================
# OUTILS DE VERIFICATION
# ==========================================================

def is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN


def check_active_user(user: User) -> None:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte est désactivé."
        )


def get_channel_by_id(db: Session, channel_id: int) -> Channel:
    channel = db.query(Channel).filter(
        Channel.id == channel_id
    ).first()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon introuvable."
        )

    return channel


def get_channel_membership(
    db: Session,
    channel_id: int,
    user_id: int
) -> ChannelMember | None:

    return db.query(ChannelMember).filter(
        ChannelMember.channel_id == channel_id,
        ChannelMember.user_id == user_id
    ).first()


def check_channel_access(
    db: Session,
    channel: Channel,
    user: User
) -> ChannelMember | None:

    check_active_user(user)

    # L'administrateur accède à tous les salons.
    if is_admin(user):
        return None

    # Tous les membres actifs peuvent accéder
    # aux salons officiels.
    if channel.type == ChannelType.OFFICIAL:
        return None

    membership = get_channel_membership(
        db,
        channel.id,
        user.id
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce salon."
        )

    return membership


def check_channel_management(
    db: Session,
    channel: Channel,
    user: User
) -> ChannelMember | None:

    check_active_user(user)

    if is_admin(user):
        return None

    membership = check_channel_access(
        db,
        channel,
        user
    )

    if channel.type == ChannelType.OFFICIAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul l'administrateur peut gérer un salon officiel."
        )

    if membership.role != ChannelRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le propriétaire peut gérer ce groupe."
        )

    return membership


# ==========================================================
# CREATION DES SALONS ET GROUPES
# ==========================================================

def create_channel(
    db: Session,
    channel_data: ChannelCreate,
    current_user: User
) -> Channel:

    check_active_user(current_user)

    if channel_data.type == ChannelType.OFFICIAL:
        if not is_admin(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul l'administrateur peut créer un salon officiel."
            )

    elif channel_data.type == ChannelType.GROUP:
        # Tous les membres actifs peuvent créer un groupe.
        pass

    channel = Channel(
        name=channel_data.name,
        description=channel_data.description,
        type=channel_data.type,
        created_by_id=current_user.id,
        is_active=True
    )

    db.add(channel)
    db.flush()

    # Le créateur devient automatiquement OWNER.
    membership = ChannelMember(
        channel_id=channel.id,
        user_id=current_user.id,
        role=ChannelRole.OWNER
    )

    db.add(membership)

    db.commit()
    db.refresh(channel)

    return channel


# ==========================================================
# LISTE DES SALONS
# ==========================================================

def get_channels(
    db: Session,
    current_user: User
) -> list[Channel]:

    check_active_user(current_user)

    query = db.query(Channel).options(
        joinedload(Channel.members)
    )

    if is_admin(current_user):
        return query.order_by(
            Channel.created_at.desc()
        ).all()

    # Un membre voit :
    # - tous les salons officiels actifs ;
    # - les groupes actifs auxquels il appartient.

    return query.filter(
        Channel.is_active.is_(True)
    ).filter(
        (
            Channel.type == ChannelType.OFFICIAL
        ) |
        (
            Channel.members.any(
                ChannelMember.user_id == current_user.id
            )
        )
    ).order_by(
        Channel.created_at.desc()
    ).all()


# ==========================================================
# DETAIL D'UN SALON
# ==========================================================

def get_channel_details(
    db: Session,
    channel_id: int,
    current_user: User
) -> Channel:

    channel = db.query(Channel).options(
       joinedload(Channel.members).joinedload(ChannelMember.user)
    ).filter(
       Channel.id == channel_id
    ).first()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon introuvable."
        )

    check_active_user(current_user)

    if not channel.is_active and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce salon n'est plus disponible."
        )

    check_channel_access(
        db,
        channel,
        current_user
    )

    return channel


# ==========================================================
# MODIFICATION D'UN SALON
# ==========================================================

def update_channel(
    db: Session,
    channel_id: int,
    channel_data: ChannelUpdate,
    current_user: User
) -> Channel:

    channel = get_channel_by_id(db, channel_id)

    check_channel_management(
        db,
        channel,
        current_user
    )

    update_data = channel_data.model_dump(
        exclude_unset=True
    )

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune modification fournie."
        )

    for field, value in update_data.items():
        setattr(channel, field, value)

    db.commit()
    db.refresh(channel)

    return channel


# ==========================================================
# DESACTIVATION D'UN SALON
# ==========================================================

def deactivate_channel(
    db: Session,
    channel_id: int,
    current_user: User
) -> Channel:

    channel = get_channel_by_id(db, channel_id)

    check_channel_management(
        db,
        channel,
        current_user
    )

    if not channel.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce salon est déjà désactivé."
        )

    channel.is_active = False

    db.commit()
    db.refresh(channel)

    return channel


# ==========================================================
# AJOUT D'UN PARTICIPANT
# ==========================================================

def add_channel_member(
    db: Session,
    channel_id: int,
    user_id: int,
    current_user: User,
    role: ChannelRole = ChannelRole.MEMBER
) -> ChannelMember:

    channel = get_channel_by_id(db, channel_id)

    check_channel_management(
        db,
        channel,
        current_user
    )

    if not channel.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'ajouter un membre à un salon désactivé."
        )

    if role == ChannelRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisez le transfert de propriété pour désigner un propriétaire."
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable."
        )

    # Un administrateur ne peut pas participer à un groupe privé.
    if (
        channel.type == ChannelType.GROUP
        and user.role == UserRole.ADMIN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les administrateurs ne peuvent pas être ajoutés comme participants aux groupes privés."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'ajouter un utilisateur désactivé."
        )

    existing_member = get_channel_membership(
        db,
        channel_id,
        user_id
    )

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet utilisateur participe déjà à ce salon."
        )

    membership = ChannelMember(
        channel_id=channel_id,
        user_id=user_id,
        role=role
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership


# ==========================================================
# RETRAIT D'UN PARTICIPANT
# ==========================================================

def remove_channel_member(
    db: Session,
    channel_id: int,
    user_id: int,
    current_user: User
) -> None:

    channel = get_channel_by_id(db, channel_id)

    check_channel_management(
        db,
        channel,
        current_user
    )

    membership = get_channel_membership(
        db,
        channel_id,
        user_id
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant introuvable dans ce salon."
        )

    if membership.role == ChannelRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transférez d'abord la propriété avant de retirer le propriétaire."
        )

    db.delete(membership)
    db.commit()


# ==========================================================
# MODIFICATION DU ROLE D'UN PARTICIPANT
# ==========================================================

def update_member_role(
    db: Session,
    channel_id: int,
    user_id: int,
    new_role: ChannelRole,
    current_user: User
) -> ChannelMember:

    channel = get_channel_by_id(db, channel_id)

    check_channel_management(
        db,
        channel,
        current_user
    )

    if new_role == ChannelRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisez le transfert de propriété pour changer de propriétaire."
        )

    membership = get_channel_membership(
        db,
        channel_id,
        user_id
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant introuvable dans ce salon."
        )

    if membership.role == ChannelRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le rôle du propriétaire ne peut pas être modifié directement."
        )

    membership.role = new_role

    db.commit()
    db.refresh(membership)

    return membership


# ==========================================================
# TRANSFERT DE PROPRIETE
# ==========================================================

def transfer_channel_ownership(
    db: Session,
    channel_id: int,
    new_owner_id: int,
    current_user: User
) -> ChannelMember:

    channel = get_channel_by_id(db, channel_id)

    current_membership = check_channel_management(
        db,
        channel,
        current_user
    )

    if channel.type == ChannelType.OFFICIAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le transfert de propriété des salons officiels n'est pas autorisé."
        )

    new_owner_membership = get_channel_membership(
        db,
        channel_id,
        new_owner_id
    )

    if not new_owner_membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Le nouveau propriétaire doit déjà être membre du groupe."
        )

    new_owner = db.query(User).filter(
        User.id == new_owner_id
    ).first()

    if not new_owner or not new_owner.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau propriétaire doit avoir un compte actif."
        )

    if is_admin(current_user):

        owners = db.query(ChannelMember).filter(
            ChannelMember.channel_id == channel_id,
            ChannelMember.role == ChannelRole.OWNER
        ).all()

        if len(owners) != 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Le groupe doit posséder exactement un propriétaire avant le transfert."
            )

        old_owner = owners[0]

    else:
        old_owner = current_membership

    if not old_owner or old_owner.role != ChannelRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun propriétaire valide trouvé."
        )

    if old_owner.user_id == new_owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet utilisateur est déjà propriétaire."
        )

    old_owner.role = ChannelRole.MEMBER
    new_owner_membership.role = ChannelRole.OWNER

    db.commit()
    db.refresh(new_owner_membership)

    return new_owner_membership

# ==========================================================
# LISTE DES UTILISATEURS DISPONIBLES POUR UN GROUPE
# ==========================================================

def get_available_channel_members(
    db: Session,
    channel_id: int,
    current_user: User
) -> list[User]:

    channel = get_channel_by_id(db, channel_id)

    check_channel_management(
        db,
        channel,
        current_user
    )

    if channel.type != ChannelType.GROUP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette opération est réservée aux groupes."
        )

    existing_members = db.query(
        ChannelMember.user_id
    ).filter(
        ChannelMember.channel_id == channel_id
    )

    return db.query(User).filter(
        User.is_active.is_(True),
        User.role == UserRole.MEMBER,
        ~User.id.in_(existing_members)
    ).order_by(
        User.first_name.asc(),
        User.last_name.asc()
    ).all()