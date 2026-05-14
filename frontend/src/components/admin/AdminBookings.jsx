import { useState, useEffect } from "react";
import { apiFetch } from "../../App";

const STATUS_CONFIG = {
  menunggu:       { label: "Menunggu Persetujuan", class: "badge-pending" },
  disetujui:      { label: "Disetujui",            class: "badge-approved" },
  ditolak:        { label: "Ditolak",               class: "badge-rejected" },
  dibatalkan:     { label: "Dibatalkan",            class: "badge-cancelled" },
  menunggu_batal: { label: "Menunggu Batal",        class: "badge-cancelling" },
};

// Konversi string UTC dari backend ke WIB (UTC+7)
// Backend menyimpan waktu UTC tanpa suffix "Z", sehingga perlu ditambahkan
// agar browser tidak salah interpretasi sebagai waktu lokal
function parseWIB(dateStr) {
  if (!dateStr) return null;
  const hasTimezone = /[Z+\-]\d*$/.test(dateStr) || dateStr.endsWith("Z");
  const utcStr = hasTimezone ? dateStr : dateStr + "Z";
  return new Date(utcStr);
}

function formatDate(d) {
  const date = parseWIB(d);
  if (!date) return "—";
  return (
    date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB"
  );
}

function formatDateOnly(d) {
  const date = parseWIB(d);
  if (!date) return "—";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function AdminBookings({ onRefreshStats }) {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing]   = useState(false);
  const [toast, setToast]             = useState("");

  const [pendingCount, setPendingCount] = useState(0);

  const loadPendingCount = async () => {
    try {
      const data = await apiFetch("/admin/bookings?status=menunggu");
      setPendingCount(Array.isArray(data) ? data.length : 0);
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const data = await apiFetch(`/admin/bookings${params}`);
      setBookings(data);
      if (filterStatus === "menunggu") {
        setPendingCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    loadPendingCount();
  }, []);

  useEffect(() => {
    load();
    if (filterStatus !== "menunggu") {
      loadPendingCount();
    }
  }, [filterStatus]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleApprove = async (bookingId) => {
    setProcessing(true);
    try {
      await apiFetch("/admin/approve", {
        method: "POST",
        body: JSON.stringify({ booking_id: bookingId, status: "disetujui" }),
      });
      setSelected(null);
      await load();
      await loadPendingCount();
      onRefreshStats?.();
      showToast("✅ Peminjaman berhasil disetujui");
    } catch (e) {
      showToast("❌ " + e.message);
    }
    setProcessing(false);
  };

  const handleApproveCancellation = async (cancellationId) => {
    setProcessing(true);
    try {
      await apiFetch(`/admin/approve-cancellation/${cancellationId}`, {
        method: "POST",
      });
      setSelected(null);
      await load();
      onRefreshStats?.();
      showToast("✅ Pembatalan berhasil disetujui");
    } catch (e) {
      showToast("❌ " + e.message);
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setProcessing(true);
    try {
      await apiFetch("/admin/approve", {
        method: "POST",
        body: JSON.stringify({
          booking_id: rejectModal.id,
          status: "ditolak",
          catatan: rejectReason,
        }),
      });
      setRejectModal(null);
      setRejectReason("");
      setSelected(null);
      await load();
      await loadPendingCount();
      onRefreshStats?.();
      showToast("Peminjaman ditolak");
    } catch (e) {
      showToast("❌ " + e.message);
    }
    setProcessing(false);
  };

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", padding: "12px 20px",
          boxShadow: "var(--shadow-lg)", fontSize: 14, fontWeight: 500,
          animation: "slideUp 0.2s ease"
        }}>
          {toast}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { value: "all",       label: "Semua" },
          { value: "menunggu",  label: "Menunggu" },
          { value: "disetujui", label: "Disetujui" },
          { value: "ditolak",   label: "Ditolak" },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            style={{
              padding: "6px 16px", borderRadius: 20, border: "1.5px solid",
              borderColor: filterStatus === tab.value ? "var(--ipb-blue)" : "var(--border)",
              background: filterStatus === tab.value ? "var(--ipb-blue)" : "var(--surface)",
              color: filterStatus === tab.value ? "white" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
            }}
          >
            {tab.label}
            {tab.value === "menunggu" && pendingCount > 0 && (
              <span style={{
                marginLeft: 6, background: "var(--status-pending)",
                color: "white", borderRadius: 10, padding: "1px 6px", fontSize: 11
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Memuat...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">Tidak ada pengajuan</div>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Ruangan</th>
                <th>Pemohon</th>
                <th>Tanggal Pengajuan</th>
                <th>Waktu Pinjam</th>
                <th>Detail</th>
                <th>Status</th>
                <th>Aksi/Alasan</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => {
                const cfg = STATUS_CONFIG[b.status] || { label: b.status, class: "badge-cancelled" };
                return (
                  <tr key={b.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.fasilitas?.nama || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.kegiatan_organisasi}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{b.mahasiswa?.nama || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.mahasiswa?.nim || ""}</div>
                    </td>
                    {/* Waktu pengajuan dalam WIB */}
                    <td style={{ fontSize: 13 }}>{formatDate(b.created_at)}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{formatDateOnly(b.tanggal_peminjaman)}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.jam_mulai} — {b.jam_selesai}</div>
                    </td>
                    <td>
                      {b.lampiran_surat ? (
                        <a href={b.lampiran_surat} target="_blank" rel="noreferrer">
                          <button className="btn btn-secondary btn-sm">PDF</button>
                        </a>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                    </td>
                    <td>
                      {(b.status === "menunggu" || b.status === "menunggu_batal") && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelected(b)}
                        >
                          {b.status === "menunggu_batal" ? "Setujui" : "Tinjau"}
                        </button>
                      )}
                      {b.alasan_penolakan && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, maxWidth: 160 }}>
                          {b.alasan_penolakan}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span className="modal-title">Permintaan Persetujuan</span>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{
                border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                padding: "16px 20px", marginBottom: 24, lineHeight: 2, fontSize: 14
              }}>
                <div><strong>Lembaga</strong> &nbsp;: {selected.kegiatan_organisasi}</div>
                <div><strong>Lokasi</strong> &nbsp;&nbsp;&nbsp;&nbsp;: {selected.fasilitas?.nama}</div>
                <div><strong>Tanggal</strong> &nbsp;: {formatDateOnly(selected.tanggal_peminjaman)}</div>
                <div><strong>Pukul</strong> &nbsp;&nbsp;&nbsp;&nbsp;: {selected.jam_mulai} — {selected.jam_selesai}</div>
                {selected.lampiran_surat && (
                  <div style={{ marginTop: 8 }}>
                    <a href={selected.lampiran_surat} target="_blank" rel="noreferrer" style={{ color: "var(--ipb-blue)", fontSize: 13 }}>
                      📎 Lihat Surat Peminjaman
                    </a>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                {selected.status === "menunggu" && (
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => { setRejectModal(selected); }}
                    disabled={processing}
                  >
                    Ditolak
                  </button>
                )}
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  onClick={() => selected.status === "menunggu_batal" ? handleApproveCancellation(selected.cancellation_id) : handleApprove(selected.id)}
                  disabled={processing}
                >
                  {processing ? "Memproses..." : selected.status === "menunggu_batal" ? "Setujui" : "Disetujui"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title">Alasan Penolakan</span>
              <button className="modal-close" onClick={() => setRejectModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Alasan penolakan (wajib)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Jelaskan alasan penolakan..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>
                  Batal
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                >
                  {processing ? "Memproses..." : "Tolak Pengajuan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
