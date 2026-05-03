import { useState, useEffect } from "react";
import { apiFetch } from "../../App";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function AdminFacilities({ onAdd }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState({});
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [toast, setToast]           = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/facilities/");
      setFacilities(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openEdit = (f) => {
    setEditTarget(f);
    setForm({
      nama: f.nama,
      kapasitas_min: f.kapasitas_min || "",
      kapasitas_max: f.kapasitas_max,
      harga: f.harga,
      deskripsi: f.deskripsi || "",
      penanggung_jawab: f.penanggung_jawab,
      kontak_pj: f.kontak_pj || "",
      fakultas: f.fakultas,
      status_fasilitas: f.status_fasilitas,
      foto: f.foto || "",
    });
    setError("");
  };

  const handleSave = async () => {
    if (!form.nama || !form.kapasitas_max || !form.harga || !form.penanggung_jawab) {
      setError("Semua field wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/facilities/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          kapasitas_min: form.kapasitas_min ? Number(form.kapasitas_min) : null,
          kapasitas_max: Number(form.kapasitas_max),
          harga: Number(form.harga),
        }),
      });
      setEditTarget(null);
      await load();
      showToast("✅ Informasi fasilitas berhasil diubah");
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus fasilitas "${nama}"?`)) return;
    try {
      await apiFetch(`/facilities/${id}`, { method: "DELETE" });
      await load();
      showToast("Fasilitas dihapus");
    } catch (e) {
      showToast("❌ " + e.message);
    }
  };

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", padding: "12px 20px",
          boxShadow: "var(--shadow-lg)", fontSize: 14, fontWeight: 500
        }}>{toast}</div>
      )}

      <div className="section-header">
        <div>
          <div className="section-title">Daftar Fasilitas</div>
          <div className="section-subtitle">{facilities.length} fasilitas terdaftar</div>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          + Tambah Fasilitas
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Memuat...</div>
      ) : facilities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏛️</div>
          <div className="empty-state-title">Belum ada fasilitas</div>
          <div className="empty-state-desc">Tambah fasilitas baru untuk memulai</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {facilities.map(f => (
            <div key={f.id} style={{
              background: "var(--surface)", borderRadius: "var(--radius-lg)",
              overflow: "hidden", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{
                height: 140, background: "linear-gradient(135deg, var(--ipb-navy), var(--ipb-blue))",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", position: "relative"
              }}>
                {f.foto
                  ? <img src={f.foto} alt={f.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 40, opacity: 0.3 }}>🏛️</span>
                }
                <span style={{
                  position: "absolute", top: 8, right: 8, padding: "3px 10px",
                  borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: f.status_fasilitas === "tersedia" ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)",
                  color: "white"
                }}>
                  {f.status_fasilitas === "tersedia" ? "Tersedia" : "Tidak Tersedia"}
                </span>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ipb-blue)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  {f.fakultas}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.nama}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}>
                  <span style={{ color: "var(--text-secondary)" }}>
                    👥 {f.kapasitas_min ? `${f.kapasitas_min}–` : ""}{f.kapasitas_max} orang
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--ipb-navy)" }}>
                    {formatRupiah(f.harga)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                  PJ: {f.penanggung_jawab}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(f)}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id, f.nama)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditTarget(null); }}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <span className="modal-title">Edit Fasilitas</span>
              <button className="modal-close" onClick={() => setEditTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-msg">{error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nama Ruangan *</label>
                  <input className="form-input" value={form.nama || ""} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fakultas *</label>
                  <input className="form-input" value={form.fakultas || ""} onChange={e => setForm(p => ({ ...p, fakultas: e.target.value }))} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kapasitas Min</label>
                  <input className="form-input" type="number" value={form.kapasitas_min || ""} onChange={e => setForm(p => ({ ...p, kapasitas_min: e.target.value }))} placeholder="Kosongkan jika tidak ada" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kapasitas Max *</label>
                  <input className="form-input" type="number" value={form.kapasitas_max || ""} onChange={e => setForm(p => ({ ...p, kapasitas_max: e.target.value }))} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Harga (Rp) *</label>
                  <input className="form-input" type="number" value={form.harga || ""} onChange={e => setForm(p => ({ ...p, harga: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status_fasilitas || "tersedia"} onChange={e => setForm(p => ({ ...p, status_fasilitas: e.target.value }))}>
                    <option value="tersedia">Tersedia</option>
                    <option value="tidak_tersedia">Tidak Tersedia</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tujuan Surat (Penanggung Jawab) *</label>
                <input className="form-input" value={form.penanggung_jawab || ""} onChange={e => setForm(p => ({ ...p, penanggung_jawab: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Kontak PJ</label>
                <input className="form-input" value={form.kontak_pj || ""} onChange={e => setForm(p => ({ ...p, kontak_pj: e.target.value }))} placeholder="wa.me/628..." />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Ruangan</label>
                <textarea className="form-textarea" value={form.deskripsi || ""} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">URL Foto Ruangan</label>
                <input className="form-input" value={form.foto || ""} onChange={e => setForm(p => ({ ...p, foto: e.target.value }))} placeholder="https://..." />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditTarget(null)}>Batal</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
