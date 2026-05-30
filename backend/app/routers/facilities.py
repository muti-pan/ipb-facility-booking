from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
from app.database import get_db
from app.models.models import Facility, User
from app.schemas.schemas import FacilityCreate, FacilityUpdate, FacilityResponse
from app.utils.auth import get_current_user, require_admin
from app.utils.conflict import get_available_slots
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
IMAGE_DIR = UPLOAD_DIR / "images"

router = APIRouter()


@router.get("/", response_model=List[FacilityResponse])
def get_facilities(
    fakultas: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Facility)
    if fakultas:
        query = query.filter(Facility.fakultas == fakultas)
    if search:
        query = query.filter(
            Facility.nama.ilike(f"%{search}%") |
            Facility.deskripsi.ilike(f"%{search}%")
        )
    return query.all()


@router.get("/{facility_id}", response_model=FacilityResponse)
def get_facility(
    facility_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    return facility


@router.post("/", response_model=FacilityResponse, status_code=201)
def create_facility(
    facility_data: FacilityCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Check nama unique
    existing = db.query(Facility).filter(Facility.nama == facility_data.nama).first()
    if existing:
        raise HTTPException(status_code=400, detail="Nama fasilitas sudah ada")

    facility = Facility(**facility_data.dict(), admin_id=admin.id)
    db.add(facility)
    db.commit()
    db.refresh(facility)
    return facility


@router.put("/{facility_id}", response_model=FacilityResponse)
def update_facility(
    facility_id: int,
    facility_data: FacilityUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")

    update_data = facility_data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada data yang diubah")

    kapasitas_min = update_data.get("kapasitas_min", facility.kapasitas_min)
    kapasitas_max = update_data.get("kapasitas_max", facility.kapasitas_max)

    if kapasitas_min is not None and kapasitas_min < 0:
        raise HTTPException(status_code=400, detail="Kapasitas minimal tidak boleh negatif")
    if kapasitas_max is not None and kapasitas_max <= 0:
        raise HTTPException(status_code=400, detail="Kapasitas maksimal harus lebih dari 0")
    if kapasitas_min is not None and kapasitas_min >= kapasitas_max:
        raise HTTPException(status_code=400, detail="Kapasitas maksimal harus lebih besar dari kapasitas minimal")

    old_photo = None
    if "foto" in update_data:
        new_photo = update_data.get("foto")
        if facility.foto and facility.foto != new_photo:
            old_photo = facility.foto

    for key, value in update_data.items():
        setattr(facility, key, value)

    db.commit()
    db.refresh(facility)

    if old_photo:
        _delete_local_image(old_photo)

    return facility


def _delete_local_image(image_url: Optional[str]):
    if not image_url:
        return

    parts = image_url.split("/uploads/images/")
    if len(parts) != 2:
        return

    filename_part = parts[1].split("?")[0].split("#")[0]
    filename = Path(filename_part).name
    image_path = IMAGE_DIR / filename
    if image_path.exists() and image_path.is_file():
        try:
            image_path.unlink()
        except OSError:
            pass


@router.delete("/{facility_id}")
def delete_facility(
    facility_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")

    image_to_delete = facility.foto
    db.delete(facility)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Fasilitas tidak dapat dihapus. Pastikan tidak ada peminjaman terkait.")

    _delete_local_image(image_to_delete)
    return {"message": "Fasilitas berhasil dihapus"}


@router.get("/{facility_id}/slots")
def get_slots(
    facility_id: int,
    tanggal: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        tanggal_dt = datetime.strptime(tanggal, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Format tanggal salah. Gunakan YYYY-MM-DD")

    slots = get_available_slots(db, facility_id, tanggal_dt)
    return {"tanggal": tanggal, "booked_slots": slots}
