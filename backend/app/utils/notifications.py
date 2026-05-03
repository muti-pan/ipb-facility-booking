from sqlalchemy.orm import Session
from app.models.models import Notification


def create_notification(
    db: Session,
    user_id: int,
    judul: str,
    pesan: str,
    booking_id: int = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        booking_id=booking_id,
        judul=judul,
        pesan=pesan
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
