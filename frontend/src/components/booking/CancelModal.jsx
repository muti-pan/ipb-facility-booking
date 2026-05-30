import { useState, useEffect, useRef } from "react";
import { apiFetch, apiUpload } from "../../App";

export default function CancelModal({ booking, onClose, onSuccess }) {
  const needsLetter = booking.status === "disetujui";
  const [alasan, setAlasan] = useState("");
  const [surat, setSurat] = useState(null);
  const [suratNama, setSuratNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!alasan.trim()) {
      setError("Alasan pembatalan wajib diisi");
      return;
    }
    if (needsLetter && !surat) {
      setError("Surat pembatalan wajib dilampirkan untuk peminjaman yang sudah disetujui");
      return;
    }
    setLoading(true);
    try {
      let suratUrl = typeof surat === "string" ? surat : null;
      if (needsLetter && surat instanceof File) {
        const uploadResult = await apiUpload("/uploads/pdf", surat);
        suratUrl = uploadResult.url;
      }

      await apiFetch(`/bookings/${booking.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({
          booking_id: booking.id,
          alasan,
          lampiran_surat_pembatalan: suratUrl,
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

          {error && <div className="error-msg" ref={errorRef}>{error}</div>}

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
                <label className="form-label">Surat Pembatalan (PDF)</label>
                <input
                  className="form-input"
                  type="file"
                  accept="application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setSurat(file);
                    setSuratNama(file?.name || "");
                  }}
                />
                {suratNama && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                    File dipilih: {suratNama}
                  </div>
                )}
                <p className="form-hint">Unggah file PDF surat pembatalan langsung dari perangkat Anda.</p>
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
