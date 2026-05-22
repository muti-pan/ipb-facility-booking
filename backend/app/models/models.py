from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    mahasiswa = "mahasiswa"
    admin = "admin"


class BookingStatus(str, enum.Enum):
    menunggu = "menunggu"
    disetujui = "disetujui"
    ditolak = "ditolak"
    dibatalkan = "dibatalkan"
    menunggu_batal = "menunggu_batal"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String(255), nullable=False)
    nim = Column(String(50), unique=True, nullable=True)  # null for admin
    id_pegawai = Column(String(50), unique=True, nullable=True)  # null for mahasiswa
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.mahasiswa)
    unit_kerja = Column(String(255), nullable=True)  # for admin
    foto_profil = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bookings = relationship("Booking", back_populates="mahasiswa", foreign_keys="Booking.mahasiswa_id")
    approvals = relationship("Approval", back_populates="admin")
    notifications = relationship("Notification", back_populates="user")


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String(255), nullable=False)
    foto = Column(String(500), nullable=True)
    kapasitas_min = Column(Integer, nullable=True)
    kapasitas_max = Column(Integer, nullable=False)
    harga = Column(Float, nullable=False)
    deskripsi = Column(Text, nullable=True)
    penanggung_jawab = Column(String(255), nullable=False)
    kontak_pj = Column(String(255), nullable=True)
    fakultas = Column(String(255), nullable=False)
    status_fasilitas = Column(String(50), default="tersedia")  # tersedia, tidak_tersedia
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    bookings = relationship("Booking", back_populates="fasilitas")
    schedules = relationship("Schedule", back_populates="fasilitas")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    fasilitas_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    tanggal = Column(DateTime, nullable=False)
    jam_mulai = Column(String(10), nullable=False)
    jam_selesai = Column(String(10), nullable=False)
    is_available = Column(Boolean, default=True)

    fasilitas = relationship("Facility", back_populates="schedules")
    booking = relationship("Booking", back_populates="schedule")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    mahasiswa_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    fasilitas_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    kegiatan_organisasi = Column(String(255), nullable=False)
    tanggal_peminjaman = Column(DateTime, nullable=False)
    jam_mulai = Column(String(10), nullable=False)
    jam_selesai = Column(String(10), nullable=False)
    lampiran_surat = Column(String(500), nullable=True)  # file path/URL
    status = Column(Enum(BookingStatus), default=BookingStatus.menunggu)
    alasan_penolakan = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    mahasiswa = relationship("User", back_populates="bookings", foreign_keys=[mahasiswa_id])
    fasilitas = relationship("Facility", back_populates="bookings")
    approval = relationship("Approval", back_populates="booking", uselist=False)
    cancellation = relationship("Cancellation", back_populates="booking", uselist=False)
    schedule = relationship("Schedule", back_populates="booking", uselist=False)
    notifications = relationship("Notification", back_populates="booking")

    @property
    def cancellation_id(self):
        return self.cancellation.id if self.cancellation else None

    @property
    def cancellation_lampiran_surat_pembatalan(self):
        return self.cancellation.lampiran_surat_pembatalan if self.cancellation else None


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status_peminjaman = Column(Enum(BookingStatus), nullable=False)
    catatan = Column(Text, nullable=True)
    waktu_persetujuan = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Booking", back_populates="approval")
    admin = relationship("User", back_populates="approvals")


class Cancellation(Base):
    __tablename__ = "cancellations"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    alasan = Column(Text, nullable=False)
    lampiran_surat_pembatalan = Column(String(500), nullable=True)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Booking", back_populates="cancellation")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    judul = Column(String(255), nullable=False)
    pesan = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
    booking = relationship("Booking", back_populates="notifications")
