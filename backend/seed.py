"""
Script untuk mengisi data awal (seed) ke database.
Jalankan: python seed.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.models import User, Facility, UserRole
from app.utils.auth import get_password_hash

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database sudah ada data. Skip seeding.")
            return

        # Create admin
        admin = User(
            nama="Admin IPB",
            email="admin@ipb.ac.id",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.admin,
            id_pegawai="ADM001",
            unit_kerja="Biro Administrasi Umum"
        )
        db.add(admin)

        # Create test mahasiswa
        mhs = User(
            nama="Budi Mahasiswa",
            email="budi@apps.ipb.ac.id",
            hashed_password=get_password_hash("mhs123"),
            role=UserRole.mahasiswa,
            nim="G6401231001"
        )
        db.add(mhs)
        db.flush()

        # Create facilities
        facilities = [
            Facility(
                nama="Auditorium FMIPA",
                kapasitas_min=100,
                kapasitas_max=300,
                harga=3_000_000,
                deskripsi="Auditorium FMIPA (Fakultas Matematika dan Ilmu Pengetahuan Alam) berlokasi di Jalan Agatis Kampus Dramaga IPB yang berdekatan dengan Departemen Biologi dan Departemen Kimia dan berada diseberang Masjid Al-Hurriyah.",
                penanggung_jawab="Mutiah Khairunnisa, S.Kom., M.T.",
                kontak_pj="wa.me/628123456789",
                fakultas="FMIPA",
                admin_id=admin.id
            ),
            Facility(
                nama="Auditorium Toyib Hadiwijaya",
                kapasitas_min=None,
                kapasitas_max=400,
                harga=4_000_000,
                deskripsi="Auditorium Toyib Hadiwijaya merupakan uditorium utama di Fakultas Pertanian IPB yang dapat menampung kurang lebih 400 orang dan digunakan untuk berbagai acara ceremonial lainnya di IPB terutama di Fakultas Pertanian.",
                penanggung_jawab="Kepala Biro Pertanian",
                kontak_pj="wa.me/628234567890",
                fakultas="Pertanian",
                admin_id=admin.id
            ),
            Facility(
                nama="Auditorium FEM",
                kapasitas_min=None,
                kapasitas_max=600,
                harga=6_000_000,
                deskripsi="Auditorium FEM IPB berlokasi tepat di samping gedung Baru Fakultas Ekonomi dan Manajemen (FEM) Kampus IPB Darmaga.",
                penanggung_jawab="Kepala Biro FEM",
                kontak_pj="wa.me/628345678901",
                fakultas="FEM",
                admin_id=admin.id
            ),
            Facility(
                nama="Auditorium AHN",
                kapasitas_min=200,
                kapasitas_max=500,
                harga=4_500_000,
                deskripsi="Gedung serbaguna Andi Hakim Nasoetion yang dapat digunakan untuk berbagai kegiatan akademik dan kemahasiswaan.",
                penanggung_jawab="Kepala Direktorat Kemahasiswaan",
                kontak_pj="wa.me/628456789012",
                fakultas="Umum",
                admin_id=admin.id
            ),
            Facility(
                nama="Auditorium CCR",
                kapasitas_min=100,
                kapasitas_max=400,
                harga=3_500_000,
                deskripsi="Central Computer Room (CCR) IPB merupakan fasilitas serbaguna yang dapat digunakan untuk kegiatan seminar, workshop, dan pertemuan besar.",
                penanggung_jawab="Kepala DKSI IPB",
                kontak_pj="wa.me/628567890123",
                fakultas="Umum",
                admin_id=admin.id
            ),
            Facility(
                nama="Grha Widya Wisuda",
                kapasitas_min=500,
                kapasitas_max=2000,
                harga=15_000_000,
                deskripsi="Grha Widya Wisuda adalah gedung utama upacara wisuda IPB yang juga dapat digunakan untuk acara besar lainnya.",
                penanggung_jawab="Kepala Biro Umum IPB",
                kontak_pj="wa.me/628678901234",
                fakultas="Umum",
                admin_id=admin.id
            ),
        ]

        for f in facilities:
            db.add(f)

        db.commit()
        print("✅ Seed berhasil!")
        print("   Admin: admin@ipb.ac.id / admin123")
        print("   Mahasiswa: budi@apps.ipb.ac.id / mhs123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
