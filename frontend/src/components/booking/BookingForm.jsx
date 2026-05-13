import { useState } from "react";
import { apiFetch } from "../../App";

export default function BookingForm({ facility, onSuccess, onBack }) {
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const [form, setForm] = useState({
    kegiatan_organisasi: "",
    tanggal_peminjaman: today,
    jam_mulai: "08:00",
    jam_selesai: "17:00",
    lampiran_surat: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.jam_mulai >= form.jam_selesai) {
      setError("Jam selesai harus setelah jam mulai");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        fasilitas_id: facility.id,
        kegiatan_organisasi: form.kegiatan_organisasi,
        tanggal_peminjaman: new Date(form.tanggal_peminjaman).toISOString(),
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        lampiran_surat: form.lampiran_surat,
      };

      await apiFetch("/bookings/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Pengajuan Berhasil Dikirim!</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Pengajuan Anda sedang menunggu persetujuan admin. Anda akan mendapat notifikasi dalam 1×24 jam.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-md)", fontSize: 13 }}>
        <strong>{facility.nama}</strong>
        <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{facility.fakultas}</span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="form-group">
        <label className="form-label">1. Nama UKM / Organisasi / Lembaga</label>
        <input
          className="form-input"
          type="text"
          placeholder="Contoh: Himpunan Mahasiswa Ilmu Komputer"
          value={form.kegiatan_organisasi}
          onChange={e => setForm(p => ({ ...p, kegiatan_organisasi: e.target.value }))}
          required
        />
      </div>

      <div className="form-row" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">2. Tanggal Peminjaman</label>
          <input
            className="form-input"
            type="date"
            min={today}
            max={maxDateStr}
            value={form.tanggal_peminjaman}
            onChange={e => setForm(p => ({ ...p, tanggal_peminjaman: e.target.value }))}
            required
          />
          <p className="form-hint">Maksimal 2 bulan ke depan</p>
        </div>
        <div>
          <label className="form-label">Waktu Peminjaman</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="form-input"
              type="time"
              value={form.jam_mulai}
              onChange={e => setForm(p => ({ ...p, jam_mulai: e.target.value }))}
              required
              style={{ flex: 1 }}
            />
            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>—</span>
            <input
              className="form-input"
              type="time"
              min={form.jam_mulai}
              value={form.jam_selesai}
              onChange={e => setForm(p => ({ ...p, jam_selesai: e.target.value }))}
              required
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">3. Lampiran Surat Peminjaman (URL PDF)</label>
        <input
          className="form-input"
          type="url"
          placeholder="https://drive.google.com/... atau URL file PDF"
          value={form.lampiran_surat}
          onChange={e => setForm(p => ({ ...p, lampiran_surat: e.target.value }))}
          required
        />
        <p className="form-hint">Upload ke Google Drive/OneDrive lalu paste link-nya di sini</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" className="btn btn-secondary" onClick={onBack} style={{ flex: 1 }}>
          ← Kembali
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
          {loading ? "Mengirim..." : "Kirim Pengajuan"}
        </button>
      </div>
    </form>
  );
}
