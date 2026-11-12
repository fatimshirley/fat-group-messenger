from datetime import datetime, timezone
import json

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session

from src.auth.token import decode_access_token
from src.database.connection import SessionLocal
from src.users.models import User
from src.messages.models import Message
from src.channels import services as channel_services
from src.websocket.manager import manager


router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/channels/{channel_id}")
async def channel_websocket(
    websocket: WebSocket,
    channel_id: int,
    token: str
):
    db: Session = SessionLocal()
    connected = False

    try:
        # Vérification du token JWT
        try:
            payload = decode_access_token(token)
            user_id = int(payload.get("sub"))
        except (jwt.InvalidTokenError, ValueError, TypeError, AttributeError):
            await websocket.close(
                code=4401,
                reason="Token invalide"
            )
            return

        # Récupération de l'utilisateur
        current_user = db.query(User).filter(
            User.id == user_id
        ).first()

        if not current_user or not current_user.is_active:
            await websocket.close(
                code=4401,
                reason="Utilisateur introuvable ou inactif"
            )
            return

        # Récupération du salon
        try:
            channel = channel_services.get_channel_by_id(
                db,
                channel_id
            )

            channel_services.check_channel_access(
                db,
                channel,
                current_user
            )

        except HTTPException:
            await websocket.close(
                code=4403,
                reason="Accès au salon refusé"
            )
            return

        # Connexion WebSocket
        await manager.connect(websocket, channel_id)
        connected = True

        # Notification de connexion
        await manager.broadcast(
            channel_id,
            {
                "event": "user_connected",
                "user_id": current_user.id,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name
            }
        )

        while True:
            raw_data = await websocket.receive_text()

            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "event": "error",
                    "message": "Format JSON invalide."
                })
                continue

            content = data.get("content") if isinstance(data, dict) else None

            if not isinstance(content, str) or not content.strip():
                await websocket.send_json({
                    "event": "error",
                    "message": "Le message ne peut pas être vide."
                })
                continue

            content = content.strip()

            if len(content) > 10000:
                await websocket.send_json({
                    "event": "error",
                    "message": "Le message dépasse 10 000 caractères."
                })
                continue

            # Enregistrement du message dans PostgreSQL
            message = Message(
                channel_id=channel_id,
                sender_id=current_user.id,
                content=content
            )

            db.add(message)
            db.commit()
            db.refresh(message)

            # Diffusion aux utilisateurs connectés
            await manager.broadcast(
                channel_id,
                {
                    "event": "new_message",
                    "id": message.id,
                    "channel_id": message.channel_id,
                    "sender_id": message.sender_id,
                    "sender_name": (
                        f"{current_user.first_name} "
                        f"{current_user.last_name}"
                    ),
                    "content": message.content,
                    "created_at": (
                        message.created_at.isoformat()
                        if message.created_at
                        else datetime.now(timezone.utc).isoformat()
                    )
                }
            )

    except WebSocketDisconnect:
        pass

    except Exception:
        db.rollback()
        raise

    finally:
        if connected:
            manager.disconnect(websocket, channel_id)

        db.close()