# 🏛️ IPB Facility — Sistem Peminjaman Fasilitas Kampus

Aplikasi web untuk peminjaman ruangan dan fasilitas kampus IPB University.

---

## 📁 STRUKTUR FOLDER LENGKAP

```
ipb-facility-booking/
│
├── backend/                          ← FastAPI (Python)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   ← Entry point FastAPI
│   │   ├── database.py               ← Koneksi SQLAlchemy
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── models.py             ← ORM: User, Facility, Booking, Approval, dll
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py            ← Pydantic request/response schemas
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py               ← POST /login, /register, GET /me
│   │   │   ├── facilities.py         ← CRUD fasilitas
│   │   │   ├── bookings.py           ← Ajukan & batalkan peminjaman
│   │   │   ├── admin.py              ← Approve/reject, kelola fasilitas
│   │   │   └── notifications.py      ← Notifikasi user
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── auth.py               ← JWT helper, password hash
│   │       ├── conflict.py           ← ✅ Conflict detection jadwal
│   │       └── notifications.py      ← Helper kirim notifikasi
│   │
│   ├── requirements.txt
│   ├── seed.py                       ← Data awal (admin + fasilitas contoh)
│   ├── .env.example
│   └── .env                          ← (buat sendiri, tidak di-commit)
│
├── frontend/                         ← React + Vite
│   ├── src/
│   │   ├── main.jsx                  ← Entry point React
│   │   ├── App.jsx                   ← Root: AuthContext + routing sederhana
│   │   │
│   │   ├── styles/
│   │   │   └── global.css            ← Semua CSS (IPB brand colors)
│   │   │
│   │   └── components/
│   │       ├── auth/
│   │       │   └── LoginPage.jsx     ← Halaman login (user & admin)
│   │       │
│   │       ├── dashboard/
│   │       │   ├── Dashboard.jsx     ← Halaman beranda mahasiswa
│   │       │   └── Navbar.jsx        ← Navbar + notifikasi + avatar dropdown
│   │       │
│   │       ├── facilities/
│   │       │   ├── FacilityCard.jsx  ← Kartu ruangan di grid
│   │       │   └── FacilityModal.jsx ← Detail ruangan + trigger form pinjam
│   │       │
│   │       ├── booking/
│   │       │   ├── BookingForm.jsx   ← Formulir peminjaman (lembaga, tgl, jam, surat)
│   │       │   ├── BookingHistory.jsx← Riwayat peminjaman mahasiswa
│   │       │   └── CancelModal.jsx   ← Modal pembatalan (pending vs disetujui)
│   │       │
│   │       └── admin/
│   │           ├── AdminDashboard.jsx← Layout admin: sidebar + topbar
│   │           ├── AdminBookings.jsx ← Tinjau, setujui, tolak pengajuan
│   │           ├── AdminFacilities.jsx← Daftar fasilitas + edit
│   │           └── AdminAddFacility.jsx← Form tambah fasilitas baru
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── .env                          ← (buat sendiri)
│
└── README.md
```

---

## ⚙️ LANGKAH-LANGKAH RUN DI LOKAL

### Prasyarat

Pastikan sudah terinstal:
- **Python 3.10+** → cek: `python --version`
- **Node.js 18+** → cek: `node --version`
- **pip** → cek: `pip --version`

---

### 🐍 BACKEND (Terminal 1)

#### 1. Masuk ke folder backend
```bash
cd ipb-facility/backend
```

#### 2. Buat virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install dependencies
```bash
pip install -r requirements.txt
```

#### 4. Buat file .env
```bash
# Salin dari contoh
cp .env.example .env
```

Isi file `.env`:
```
DATABASE_URL=sqlite:///./ipb_facility.db
SECRET_KEY=ganti-dengan-string-random-panjang-32-karakter
```

#### 5. Isi data awal (seed)
```bash
python seed.py
```

Output yang diharapkan:
```
✅ Seed berhasil!
   Admin: admin@ipb.ac.id / admin123
   Mahasiswa: budi@apps.ipb.ac.id / mhs123
```

#### 6. Jalankan server backend
```bash
uvicorn app.main:app --reload --port 8000
```

Backend berjalan di: **http://localhost:8000**  
API Docs (Swagger): **http://localhost:8000/docs**

---

### ⚛️ FRONTEND (Terminal 2)

#### 1. Masuk ke folder frontend
```bash
cd ipb-facility/frontend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Buat file .env
```bash
cp .env.example .env
```

Isi file `.env`:
```
VITE_API_URL=http://localhost:8000/api
```

#### 4. Jalankan development server
```bash
npm run dev
```

Frontend berjalan di: **http://localhost:5173**

---

### 🔑 LOGIN TEST

| Role        | Email                      | Password  |
|-------------|---------------------------|-----------|
| **Admin**   | admin@ipb.ac.id           | admin123  |
| **Mahasiswa** | budi@apps.ipb.ac.id     | mhs123    |

---

## 🗺️ ALUR PENGGUNAAN

### Sebagai Mahasiswa:
1. Login → Dashboard menampilkan semua fasilitas
2. Klik kartu ruangan → lihat detail
3. Klik "Ajukan Peminjaman" → isi formulir (lembaga, tanggal, jam, surat PDF)
4. Sistem otomatis cek konflik jadwal ✅
5. Pengajuan terkirim → status "Menunggu Persetujuan"
6. Tab "Riwayat Peminjaman" → lihat status & batalkan jika perlu

### Sebagai Admin:
1. Login → masuk ke panel admin (sidebar)
2. Tab "Permintaan Persetujuan" → tinjau pengajuan satu per satu (FIFO)
3. Klik "Tinjau" → lihat detail → pilih Disetujui / Ditolak
4. Jika ditolak, wajib isi alasan
5. Notifikasi otomatis terkirim ke mahasiswa
6. Tab "Kelola Fasilitas" → edit/hapus fasilitas
7. Tab "Tambah Fasilitas" → isi form tambah ruangan baru

---

## 🛠️ API ENDPOINTS UTAMA

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Daftar |
| GET | `/api/facilities/` | List fasilitas |
| POST | `/api/facilities/` | Tambah fasilitas (admin) |
| PUT | `/api/facilities/{id}` | Edit fasilitas (admin) |
| GET | `/api/facilities/{id}/slots` | Cek jadwal terpakai |
| POST | `/api/bookings/` | Ajukan peminjaman |
| GET | `/api/bookings/` | Riwayat peminjaman saya |
| POST | `/api/bookings/{id}/cancel` | Batalkan peminjaman |
| GET | `/api/admin/bookings` | Semua pengajuan (admin) |
| POST | `/api/admin/approve` | Setujui/tolak (admin) |
| GET | `/api/admin/stats` | Statistik (admin) |
| GET | `/api/notifications/` | Notifikasi saya |

Dokumentasi lengkap: http://localhost:8000/docs

---

## 🚀 DEPLOYMENT

### Backend → Railway
1. Buat akun di [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Pilih folder `backend/`
4. Tambah PostgreSQL plugin
5. Set environment variables:
   ```
   DATABASE_URL  = (otomatis dari Railway PostgreSQL)
   SECRET_KEY    = (string random panjang)
   ```
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend → Vercel
1. Buat akun di [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Set Root Directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables:
   ```
   VITE_API_URL = https://your-backend.railway.app/api
   ```

---

## ❓ TROUBLESHOOTING

**ModuleNotFoundError** → Pastikan virtual environment aktif (`source venv/bin/activate`)

**CORS error di browser** → Backend sudah dikonfigurasi `allow_origins=["*"]`. Pastikan `VITE_API_URL` benar di `.env` frontend.

**"Email harus @apps.ipb.ac.id"** → Gunakan email domain IPB untuk registrasi. Admin menggunakan `@ipb.ac.id`.

**Database sudah ada data saat seed** → Hapus file `ipb_facility.db` lalu jalankan `python seed.py` lagi.

**Port sudah dipakai** → Ganti port: `uvicorn app.main:app --reload --port 8001`
