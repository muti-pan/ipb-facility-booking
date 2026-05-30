import { useState, useEffect, useRef } from "react";
import { apiFetch, apiUpload } from "../../App";

const FAKULTAS_LIST = ["FAPERTA", "SKHB", "FPIK", "FAPET", "FAHUTAN", "FATETA", "FMIPA", "FEM", "FEMA", "KEDOKTERAN", "SSMI", "SB", "SV", "Umum"];

export default function AdminAddFacility({ onSuccess }) {
  const [form, setForm] = useState({
    nama: "",
    kapasitas_min: "",
    kapasitas_max: "",
    harga: "",
    deskripsi: "",
    penanggung_jawab: "",
    kontak_pj: "",
    fakultas: "FAPERTA",
    foto: "",
    foto_file: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const errorRef = useRef(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Hanya izinkan input angka pada kolom nomor telepon
  const handleKontakChange = (e) => {
    const val = e.target.value.replace(/\D/g, ""); // hapus karakter bukan angka
    set("kontak_pj", val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nama || form.nama.trim() === "") {
      setError("Nama ruangan wajib diisi");
      return;
    }

    const minCapacity = form.kapasitas_min === "" ? null : Number(form.kapasitas_min);
    const maxCapacity = Number(form.kapasitas_max);

    if (minCapacity !== null && (isNaN(minCapacity) || minCapacity < 0)) {
      setError("Kapasitas minimal tidak boleh negatif");
      return;
    }

    if (!form.kapasitas_max) {
      setError("Kapasitas maksimal wajib diisi");
      return;
    }
    if (isNaN(maxCapacity) || maxCapacity <= 0) {
      setError("Kapasitas maksimal harus lebih dari 0");
      return;
    }
    if (minCapacity !== null && minCapacity >= maxCapacity) {
      setError("Kapasitas maksimal harus lebih besar dari kapasitas minimal");
      return;
    }

    if (!form.harga) {
      setError("Harga peminjaman wajib diisi");
      return;
    }

    if (!form.penanggung_jawab || form.penanggung_jawab.trim() === "") {
      setError("Tujuan surat wajib diisi");
      return;
    }

    if (!form.kontak_pj) {
      setError("Nomor telepon PJ wajib diisi");
      return;
    }
    const digits = form.kontak_pj.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 13) {
      setError("Nomor telepon harus terdiri dari 8 hingga 13 digit angka");
      return;
    }

    if (!form.deskripsi || form.deskripsi.trim() === "") {
      setError("Deskripsi ruangan wajib diisi");
      return;
    }

    if (!form.foto_file) {
      setError("Foto ruangan wajib diunggah");
      return;
    }

    setLoading(true);
    try {
      let fotoUrl = form.foto || null;
      if (form.foto_file instanceof File) {
        const uploadResult = await apiUpload("/uploads/image", form.foto_file);
        fotoUrl = uploadResult.url;
      }

      await apiFetch("/facilities/", {
        method: "POST",
        body: JSON.stringify({
          nama: form.nama,
          kapasitas_min: form.kapasitas_min ? Number(form.kapasitas_min) : null,
          kapasitas_max: Number(form.kapasitas_max),
          harga: Number(form.harga),
          deskripsi: form.deskripsi || null,
          penanggung_jawab: form.penanggung_jawab,
          kontak_pj: form.kontak_pj || null,
          fakultas: form.fakultas,
          foto: fotoUrl,
        }),
      });
      setSuccess(true);
      setTimeout(onSuccess, 1800);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 48, textAlign: "center", boxShadow: "var(--shadow-md)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Fasilitas berhasil ditambahkan!</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Mengalihkan ke daftar fasilitas...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg" ref={errorRef}>{error}</div>}

          <div className="form-group">
            <label className="form-label">1. Nama Ruangan *</label>
            <input className="form-input" placeholder="Contoh: Auditorium FMIPA" value={form.nama} onChange={e => set("nama", e.target.value)} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">2. Kapasitas Min</label>
              <input className="form-input" type="number" min="0" placeholder="Opsional" value={form.kapasitas_min} onChange={e => set("kapasitas_min", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Kapasitas Max *</label>
              <input className="form-input" type="number" min="1" placeholder="Contoh: 300" value={form.kapasitas_max} onChange={e => set("kapasitas_max", e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">3. Harga Peminjaman (Rp) *</label>
              <input className="form-input" type="number" min="0" placeholder="Contoh: 3000000" value={form.harga} onChange={e => set("harga", e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Fakultas *</label>
              <select className="form-select" value={form.fakultas} onChange={e => set("fakultas", e.target.value)}>
                {FAKULTAS_LIST.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">4. Tujuan Surat *</label>
            <input className="form-input" placeholder="Contoh: Dr. Nama, S.Kom., M.T." value={form.penanggung_jawab} onChange={e => set("penanggung_jawab", e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Nomor Telepon PJ Ruangan *</label>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 08123456789"
              value={form.kontak_pj}
              onChange={handleKontakChange}
              minLength={8}
              maxLength={13}
              required
            />
            <p className="form-hint">
              Masukkan 8–13 digit angka (tanpa tanda +, spasi, atau strip)
              {form.kontak_pj && (
                <span style={{
                  marginLeft: 8,
                  color: form.kontak_pj.length >= 8 && form.kontak_pj.length <= 13
                    ? "var(--status-approved, green)"
                    : "var(--status-rejected, red)"
                }}>
                  {form.kontak_pj.length}/13 digit
                </span>
              )}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">5. Deskripsi Ruangan *</label>
            <textarea className="form-textarea" placeholder="Deskripsi lengkap ruangan..." value={form.deskripsi} onChange={e => set("deskripsi", e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">6. Foto Ruangan *</label>
            <input
              className="form-input"
              type="file"
              accept="image/*"
              required
              onChange={e => {
                const file = e.target.files?.[0] || null;
                set("foto_file", file);
              }}
            />
            <p className="form-hint">Unggah file gambar langsung dari perangkat Anda.</p>
            {form.foto_file && (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                File dipilih: {form.foto_file.name}
              </div>
            )}
            {form.foto && !form.foto_file && (
              <img
                src={form.foto}
                alt="Preview"
                style={{ marginTop: 8, width: "100%", height: 140, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8, padding: "13px" }}>
            {loading ? "Menyimpan..." : "Tambah Ruangan"}
          </button>
        </form>
      </div>
    </div>
  );
}
