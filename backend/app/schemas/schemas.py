from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, BookingStatus


# ─── AUTH ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    nama: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.mahasiswa
    nim: Optional[str] = None
    id_pegawai: Optional[str] = None
    unit_kerja: Optional[str] = None

    @field_validator("email")
    @classmethod
    def email_must_be_ipb(cls, v):
        if not v.endswith("@apps.ipb.ac.id") and not v.endswith("@ipb.ac.id"):
            raise ValueError("Email harus menggunakan domain @apps.ipb.ac.id atau @ipb.ac.id")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    nama: str
    email: str
    role: UserRole
    nim: Optional[str]
    id_pegawai: Optional[str]
    unit_kerja: Optional[str]
    foto_profil: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ─── FACILITY ────────────────────────────────────────────────────────────────

class FacilityCreate(BaseModel):
    nama: str
    foto: str
    kapasitas_min: Optional[int] = None
    kapasitas_max: int
    harga: float
    deskripsi: str
    penanggung_jawab: str
    kontak_pj: str
    fakultas: str

    @field_validator("foto")
    @classmethod
    def validate_foto(cls, v):
        if not v or not v.strip():
            raise ValueError("Foto fasilitas wajib diunggah")
        return v

    @field_validator("deskripsi")
    @classmethod
    def validate_deskripsi(cls, v):
        if not v or not v.strip():
            raise ValueError("Deskripsi fasilitas wajib diisi")
        return v

    @field_validator("kontak_pj")
    @classmethod
    def validate_kontak_pj(cls, v):
        if not v or not v.strip():
            raise ValueError("Nomor telepon PJ wajib diisi")
        return v

    @field_validator("kapasitas_min")
    @classmethod
    def validate_min_capacity(cls, v):
        if v is not None and v < 0:
            raise ValueError("Kapasitas minimal tidak boleh negatif")
        return v

    @field_validator("kapasitas_max")
    @classmethod
    def validate_max_capacity(cls, v):
        if v <= 0:
            raise ValueError("Kapasitas maksimal harus lebih dari 0")
        return v

    @model_validator(mode="after")
    @classmethod
    def validate_capacity_range(cls, values):
        if values.kapasitas_min is not None and values.kapasitas_min >= values.kapasitas_max:
            raise ValueError("Kapasitas maksimal harus lebih besar dari kapasitas minimal")
        return values


class FacilityUpdate(BaseModel):
    nama: Optional[str] = None
    foto: Optional[str] = None
    kapasitas_min: Optional[int] = None
    kapasitas_max: Optional[int] = None
    harga: Optional[float] = None
    deskripsi: Optional[str] = None
    penanggung_jawab: Optional[str] = None
    kontak_pj: Optional[str] = None
    fakultas: Optional[str] = None
    status_fasilitas: Optional[str] = None

    @field_validator("kapasitas_min")
    @classmethod
    def validate_min_capacity(cls, v):
        if v is not None and v < 0:
            raise ValueError("Kapasitas minimal tidak boleh negatif")
        return v

    @field_validator("kapasitas_max")
    @classmethod
    def validate_max_capacity(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Kapasitas maksimal harus lebih dari 0")
        return v

    @field_validator("deskripsi")
    @classmethod
    def validate_deskripsi_update(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Deskripsi fasilitas wajib diisi")
        return v

    @field_validator("kontak_pj")
    @classmethod
    def validate_kontak_pj_update(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Nomor telepon PJ wajib diisi")
        return v


class FacilityResponse(BaseModel):
    id: int
    nama: str
    foto: Optional[str]
    kapasitas_min: Optional[int]
    kapasitas_max: int
    harga: float
    deskripsi: Optional[str]
    penanggung_jawab: str
    kontak_pj: Optional[str]
    fakultas: str
    status_fasilitas: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── BOOKING ─────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    fasilitas_id: int
    kegiatan_organisasi: str
    tanggal_peminjaman: datetime
    jam_mulai: str
    jam_selesai: str
    lampiran_surat: Optional[str] = None

    @field_validator("tanggal_peminjaman")
    @classmethod
    def validate_max_2_months(cls, v):
        from datetime import timezone
        now = datetime.now(timezone.utc)
        v_aware = v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v
        diff = v_aware - now
        if diff.days > 60:
            raise ValueError("Peminjaman maksimal 2 bulan ke depan")
        if diff.days < 0:
            raise ValueError("Tanggal peminjaman tidak boleh di masa lalu")
        return v

    @model_validator(mode="after")
    @classmethod
    def validate_time_range(cls, values):
        def time_to_minutes(t: str) -> int:
            h, m = map(int, t.split(":"))
            return h * 60 + m

        if time_to_minutes(values.jam_mulai) >= time_to_minutes(values.jam_selesai):
            raise ValueError("Jam selesai harus setelah jam mulai")

        return values


class BookingResponse(BaseModel):
    id: int
    mahasiswa_id: int
    fasilitas_id: int
    kegiatan_organisasi: str
    tanggal_peminjaman: datetime
    jam_mulai: str
    jam_selesai: str
    lampiran_surat: Optional[str]
    status: BookingStatus
    alasan_penolakan: Optional[str]
    cancellation_id: Optional[int] = None
    cancellation_lampiran_surat_pembatalan: Optional[str] = None
    cancellation_alasan: Optional[str] = None
    created_at: datetime
    fasilitas: Optional[FacilityResponse]

    class Config:
        from_attributes = True


class BookingDetailResponse(BookingResponse):
    mahasiswa: Optional[UserResponse]

    class Config:
        from_attributes = True


# ─── APPROVAL ────────────────────────────────────────────────────────────────

class ApprovalCreate(BaseModel):
    booking_id: int
    status: BookingStatus
    catatan: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: int
    booking_id: int
    admin_id: int
    status_peminjaman: BookingStatus
    catatan: Optional[str]
    waktu_persetujuan: datetime

    class Config:
        from_attributes = True


# ─── CANCELLATION ────────────────────────────────────────────────────────────

class CancellationCreate(BaseModel):
    booking_id: int
    alasan: str
    lampiran_surat_pembatalan: Optional[str] = None


class CancellationResponse(BaseModel):
    id: int
    booking_id: int
    alasan: str
    lampiran_surat_pembatalan: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── NOTIFICATION ─────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    booking_id: Optional[int]
    judul: str
    pesan: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
