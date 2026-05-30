from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models.models import Booking, BookingStatus, Approval, User, Cancellation
from app.schemas.schemas import ApprovalCreate, ApprovalResponse, BookingDetailResponse
from app.utils.auth import require_admin
from app.utils.notifications import create_notification

router = APIRouter()


@router.get("/bookings", response_model=List[BookingDetailResponse])
def get_all_bookings(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(Booking).options(
        joinedload(Booking.fasilitas),
        joinedload(Booking.mahasiswa),
        joinedload(Booking.cancellation)
    )
    if status:
        query = query.filter(Booking.status == status)

    # Sort by created_at ascending (FIFO queue)
    bookings = query.order_by(Booking.created_at.asc()).all()

    # Attach cancellation reason onto booking objects so the Pydantic
    # response model can include it (BookingResponse.cancellation_alasan).
    for b in bookings:
        try:
            b.cancellation_alasan = b.cancellation.alasan if b.cancellation else None
        except Exception:
            b.cancellation_alasan = None

    return bookings


@router.post("/approve", response_model=ApprovalResponse)
def approve_or_reject(
    approval_data: ApprovalCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    booking = db.query(Booking).options(
        joinedload(Booking.fasilitas),
        joinedload(Booking.mahasiswa)
    ).filter(Booking.id == approval_data.booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Peminjaman tidak ditemukan")

    if booking.status != BookingStatus.menunggu:
        raise HTTPException(status_code=400, detail="Peminjaman sudah diproses sebelumnya")

    if approval_data.status == BookingStatus.ditolak and not approval_data.catatan:
        raise HTTPException(status_code=400, detail="Alasan penolakan wajib diisi")

    # Update booking status
    booking.status = approval_data.status
    if approval_data.status == BookingStatus.ditolak:
        booking.alasan_penolakan = approval_data.catatan

    # Create approval record
    approval = Approval(
        booking_id=booking.id,
        admin_id=admin.id,
        status_peminjaman=approval_data.status,
        catatan=approval_data.catatan
    )
    db.add(approval)

    # Send notification to mahasiswa
    if approval_data.status == BookingStatus.disetujui:
        msg = (
            f"Peminjaman {booking.fasilitas.nama} pada "
            f"{booking.tanggal_peminjaman.strftime('%d/%m/%Y')} pukul {booking.jam_mulai}–{booking.jam_selesai} "
            f"DISETUJUI. Silakan melakukan pembayaran ke {booking.fasilitas.kontak_pj or booking.fasilitas.penanggung_jawab}."
        )
    else:
        msg = (
            f"Peminjaman {booking.fasilitas.nama} pada "
            f"{booking.tanggal_peminjaman.strftime('%d/%m/%Y')} DITOLAK. "
            f"Alasan: {approval_data.catatan}"
        )

    create_notification(
        db=db,
        user_id=booking.mahasiswa_id,
        booking_id=booking.id,
        judul=f"Peminjaman {'Disetujui' if approval_data.status == BookingStatus.disetujui else 'Ditolak'}",
        pesan=msg
    )

    db.commit()
    db.refresh(approval)
    return approval


@router.post("/approve-cancellation/{cancellation_id}")
def approve_cancellation(
    cancellation_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    cancellation = db.query(Cancellation).filter(Cancellation.id == cancellation_id).first()
    if not cancellation:
        raise HTTPException(status_code=404, detail="Permintaan pembatalan tidak ditemukan")

    booking = cancellation.booking
    booking.status = BookingStatus.dibatalkan
    cancellation.status = "approved"
    db.commit()

    create_notification(
        db=db,
        user_id=booking.mahasiswa_id,
        booking_id=booking.id,
        judul="Pembatalan Disetujui",
        pesan=f"Pembatalan peminjaman {booking.fasilitas.nama} telah disetujui."
    )

    return {"message": "Pembatalan disetujui"}


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    total = db.query(Booking).count()
    menunggu = db.query(Booking).filter(Booking.status == BookingStatus.menunggu).count()
    menunggu_batal = db.query(Booking).filter(Booking.status == BookingStatus.menunggu_batal).count()
    disetujui = db.query(Booking).filter(Booking.status == BookingStatus.disetujui).count()
    ditolak = db.query(Booking).filter(Booking.status == BookingStatus.ditolak).count()
    dibatalkan = db.query(Booking).filter(Booking.status == BookingStatus.dibatalkan).count()

    return {
        "total": total,
        "menunggu": menunggu,
        "menunggu_batal": menunggu_batal,
        "disetujui": disetujui,
        "ditolak": ditolak,
        "dibatalkan": dibatalkan,
    }
