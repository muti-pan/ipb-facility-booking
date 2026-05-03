from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.models import Booking, BookingStatus
from datetime import datetime


def check_schedule_conflict(
    db: Session,
    fasilitas_id: int,
    tanggal: datetime,
    jam_mulai: str,
    jam_selesai: str,
    exclude_booking_id: int = None
) -> bool:
    """
    Returns True if there is a conflict (jadwal bentrok).
    Checks against all active bookings (menunggu or disetujui).
    """
    query = db.query(Booking).filter(
        Booking.fasilitas_id == fasilitas_id,
        Booking.tanggal_peminjaman == tanggal,
        Booking.status.in_([BookingStatus.menunggu, BookingStatus.disetujui])
    )

    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)

    existing = query.all()

    def time_to_minutes(t: str) -> int:
        h, m = map(int, t.split(":"))
        return h * 60 + m

    new_start = time_to_minutes(jam_mulai)
    new_end = time_to_minutes(jam_selesai)

    for booking in existing:
        existing_start = time_to_minutes(booking.jam_mulai)
        existing_end = time_to_minutes(booking.jam_selesai)

        # Overlap check: new starts before existing ends AND new ends after existing starts
        if new_start < existing_end and new_end > existing_start:
            return True

    return False


def get_available_slots(
    db: Session,
    fasilitas_id: int,
    tanggal: datetime
) -> list:
    """Returns list of booked time slots for a facility on a given date."""
    bookings = db.query(Booking).filter(
        Booking.fasilitas_id == fasilitas_id,
        Booking.tanggal_peminjaman == tanggal,
        Booking.status.in_([BookingStatus.menunggu, BookingStatus.disetujui])
    ).all()

    return [
        {"jam_mulai": b.jam_mulai, "jam_selesai": b.jam_selesai, "status": b.status}
        for b in bookings
    ]
