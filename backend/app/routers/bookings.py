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

    # If already approved, need letter and admin approval
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
    else:
        # Still pending → auto cancel
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
