import { useState, useEffect } from "react";
import { apiFetch } from "../../App";
import Navbar from "../dashboard/Navbar";
import CancelModal from "./CancelModal";

const STATUS_CONFIG = {
  menunggu: { label: "Menunggu Persetujuan", class: "badge-pending" },
  disetujui: { label: "Disetujui", class: "badge-approved" },
  ditolak: { label: "Ditolak", class: "badge-rejected" },
  dibatalkan: { label: "Dibatalkan", class: "badge-cancelled" },
  menunggu_batal: { label: "Menunggu Batal", class: "badge-cancelling" },
};

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// Konversi string UTC dari backend ke WIB (UTC+7)
// Backend menyimpan waktu UTC tanpa suffix "Z", sehingga perlu ditambahkan
// agar browser tidak salah interpretasi sebagai waktu lokal
function parseWIB(dateStr) {
  if (!dateStr) return null;
  // Jika sudah ada timezone info, biarkan; jika tidak, anggap UTC
  const hasTimezone = /[Z+\-]\d*$/.test(dateStr) || dateStr.endsWith("Z");
  const utcStr = hasTimezone ? dateStr : dateStr + "Z";
  return new Date(utcStr);
}

function formatDate(d) {
  const date = parseWIB(d);

  if (!date) return "—";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(d) {
  const date = parseWIB(d);

  if (!date) return "—";

  return (
    date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    "\n" +
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) +
    " WIB"
  );
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/bookings/");
      setBookings(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const canCancel = (status) => ["menunggu", "disetujui"].includes(status);

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content">
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            <div className="loader" style={{ margin: "0 auto", borderColor: "var(--border)", borderTopColor: "var(--ipb-blue)" }} />
            <div style={{ marginTop: 12 }}>Memuat riwayat...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <div className="section-header">
          <div>
            <div className="section-title">Riwayat Peminjaman</div>
            <div className="section-subtitle">{bookings.length} total pengajuan</div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Belum ada riwayat peminjaman</div>
            <div className="empty-state-desc">Ajukan peminjaman fasilitas dari halaman Beranda</div>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-card)", border: "1px solid var(--border)" }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Ruangan</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Waktu Peminjaman</th>
                  <th>Detail</th>
                  <th>Status</th>
                  <th></th>
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
                        {/* Waktu pengajuan dalam WIB */}
                        <div style={{ fontSize: 13, whiteSpace: "pre-line" }}>
                          {formatDateTime(b.created_at)} </div>
                      </td>
                      <td>
                        <div>{formatDate(b.tanggal_peminjaman)}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.jam_mulai} — {b.jam_selesai}</div>
                      </td>
                      <td>
                        {b.lampiran_surat ? (
                          <a href={b.lampiran_surat} target="_blank" rel="noreferrer">
                            <button className="btn btn-secondary btn-sm">PDF</button>
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                        {b.alasan_penolakan && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, maxWidth: 180 }}>
                            {b.alasan_penolakan}
                          </div>
                        )}
                      </td>
                      <td>
                        {canCancel(b.status) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setCancelTarget(b)}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={() => {
            setCancelTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
