from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models.models import Booking, BookingStatus, Facility, User
from app.schemas.schemas import BookingCreate, BookingResponse, BookingDetailResponse, CancellationCreate, CancellationResponse
from app.utils.auth import get_current_user, require_mahasiswa
from app.utils.conflict import check_schedule_conflict
from app.utils.notifications import create_notification
from app.models.models import Cancellation

router = APIRouter()


@router.get("/", response_model=List[BookingDetailResponse])
def get_my_bookings(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Booking).options(
        joinedload(Booking.fasilitas),
        joinedload(Booking.mahasiswa)
    ).filter(Booking.mahasiswa_id == current_user.id)

    if status:
        query = query.filter(Booking.status == status)

    return query.order_by(Booking.created_at.desc()).all()


@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).options(
        joinedload(Booking.fasilitas),
        joinedload(Booking.mahasiswa)
    ).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Peminjaman tidak ditemukan")

    # Mahasiswa only see own; admin see all
    if current_user.role == "mahasiswa" and booking.mahasiswa_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    return booking


@router.post("/", response_model=BookingResponse, status_code=201)
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "mahasiswa":
        raise HTTPException(status_code=403, detail="Hanya mahasiswa yang dapat mengajukan peminjaman")

    # Check facility exists
    facility = db.query(Facility).filter(Facility.id == booking_data.fasilitas_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")

    def time_to_minutes(t: str) -> int:
        h, m = map(int, t.split(":"))
        return h * 60 + m

    if time_to_minutes(booking_data.jam_mulai) >= time_to_minutes(booking_data.jam_selesai):
        raise HTTPException(status_code=400, detail="Jam selesai harus setelah jam mulai")

    # ✅ Conflict detection
    has_conflict = check_schedule_conflict(
        db=db,
        fasilitas_id=booking_data.fasilitas_id,
        tanggal=booking_data.tanggal_peminjaman,
        jam_mulai=booking_data.jam_mulai,
        jam_selesai=booking_data.jam_selesai
    )
    if has_conflict:
        raise HTTPException(
            status_code=409,
            detail="Jadwal bentrok dengan peminjaman lain. Silakan pilih waktu yang berbeda."
        )

    booking = Booking(
        mahasiswa_id=current_user.id,
        fasilitas_id=booking_data.fasilitas_id,
        kegiatan_organisasi=booking_data.kegiatan_organisasi,
        tanggal_peminjaman=booking_data.tanggal_peminjaman,
        jam_mulai=booking_data.jam_mulai,
        jam_selesai=booking_data.jam_selesai,
        lampiran_surat=booking_data.lampiran_surat,
        status=BookingStatus.menunggu
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Notify admin (find all admins)
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            booking_id=booking.id,
            judul="Pengajuan Peminjaman Baru",
            pesan=f"{current_user.nama} mengajukan peminjaman {facility.nama} pada {booking.tanggal_peminjaman.strftime('%d/%m/%Y')} pukul {booking.jam_mulai}–{booking.jam_selesai}"
        )

    return booking


@router.post("/{booking_id}/cancel", response_model=CancellationResponse)
def cancel_booking(
    booking_id: int,
    cancel_data: CancellationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.mahasiswa_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Peminjaman tidak ditemukan")

    if booking.status not in [BookingStatus.menunggu, BookingStatus.disetujui]:
        raise HTTPException(status_code=400, detail="Peminjaman tidak dapat dibatalkan")

    booking_date = booking.tanggal_peminjaman
    now_utc = datetime.now(timezone.utc)
    if booking_date.tzinfo is None:
        booking_date = booking_date.replace(tzinfo=timezone.utc)

    if booking_date.date() < now_utc.date():
        raise HTTPException(
            status_code=400,
            detail="Peminjaman dengan tanggal yang sudah lewat tidak dapat dibatalkan"
        )

    # If already approved, require a cancellation letter and create a pending
    # cancellation request (menunggu_batal) that must be approved by admin.
    # If still pending (not yet approved), perform an immediate cancel.
    if booking.status == BookingStatus.disetujui:
        if not cancel_data.lampiran_surat_pembatalan:
            raise HTTPException(
                status_code=400,
                detail="Peminjaman yang sudah disetujui memerlukan surat pembatalan"
            )

        booking.status = BookingStatus.menunggu_batal
        cancellation = Cancellation(
            booking_id=booking_id,
            alasan=cancel_data.alasan,
            lampiran_surat_pembatalan=cancel_data.lampiran_surat_pembatalan,
            status="pending"
        )

        db.add(cancellation)
        db.commit()
        db.refresh(cancellation)

        # Notify admin(s) about the new cancellation request
        admins = db.query(User).filter(User.role == "admin").all()
        for admin in admins:
            create_notification(
                db=db,
                user_id=admin.id,
                booking_id=booking.id,
                judul="Permintaan Pembatalan Baru",
                pesan=(
                    f"{current_user.nama} mengajukan pembatalan peminjaman {booking.fasilitas.nama} "
                    f"pada {booking.tanggal_peminjaman.strftime('%d/%m/%Y')} pukul {booking.jam_mulai}–{booking.jam_selesai}."
                )
            )

        return cancellation
    else:
        # Still pending → auto cancel immediately
        booking.status = BookingStatus.dibatalkan
        cancellation = Cancellation(
            booking_id=booking_id,
            alasan=cancel_data.alasan,
            status="approved"
        )

        db.add(cancellation)
        db.commit()
        db.refresh(cancellation)
        return cancellation
