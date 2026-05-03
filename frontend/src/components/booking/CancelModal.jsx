import { useState } from "react";
import { apiFetch } from "../../App";

export default function CancelModal({ booking, onClose, onSuccess }) {
  const needsLetter = booking.status === "disetujui";
  const [alasan, setAlasan] = useState("");
  const [surat, setSurat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!alasan.trim()) {
      setError("Alasan pembatalan wajib diisi");
      return;
    }
    if (needsLetter && !surat.trim()) {
      setError("Surat pembatalan wajib dilampirkan untuk peminjaman yang sudah disetujui");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/bookings/${booking.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({
          booking_id: booking.id,
          alasan,
          lampiran_surat_pembatalan: surat || null,
        }),
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <span className="modal-title">Pembatalan Pengajuan</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-md)", fontSize: 13 }}>
            <strong>{booking.fasilitas?.nama}</strong>
            {needsLetter && (
              <div style={{ marginTop: 4, fontSize: 12, color: "var(--status-pending)" }}>
                ⚠️ Peminjaman sudah disetujui — wajib melampirkan surat pembatalan
              </div>
            )}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Alasan Pembatalan</label>
              <textarea
                className="form-textarea"
                placeholder="Jelaskan alasan pembatalan..."
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                required
              />
            </div>

            {needsLetter && (
              <div className="form-group">
                <label className="form-label">Surat Pembatalan (URL PDF)</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={surat}
                  onChange={e => setSurat(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                Batal
              </button>
              <button type="submit" className="btn btn-danger" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Memproses..." : "Ajukan Pembatalan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
