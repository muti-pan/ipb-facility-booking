import { useState } from "react";
import BookingForm from "../booking/BookingForm";
import { getDirectImageUrl } from '../../utils/formatters';

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function FacilityModal({ facility, onClose, onBookingSuccess }) {
  const [showBooking, setShowBooking] = useState(false);

  const capacity = facility.kapasitas_min
    ? `${facility.kapasitas_min.toLocaleString()}–${facility.kapasitas_max.toLocaleString()} orang`
    : `${facility.kapasitas_max.toLocaleString()} orang`;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">
            {showBooking ? "Formulir Peminjaman" : "Detail Fasilitas"}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!showBooking ? (
            <>
              <div className="modal-facility-img">
                {facility.foto
                  ? <img src={getDirectImageUrl(facility.foto)} alt={facility.nama} onError={e => { e.target.style.display = "none"; }} />
                  : <span style={{ fontSize: 60, opacity: 0.3 }}>🏛️</span>
                }
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ipb-blue)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {facility.fakultas}
                  </span>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{facility.nama}</h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ipb-navy)" }}>
                    {formatRupiah(facility.harga)}
                  </div>
                </div>
              </div>

              <div className="facility-detail-grid">
                <div className="detail-item">
                  <label>Kapasitas</label>
                  <span>{capacity}</span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span style={{ color: facility.status_fasilitas === "tersedia" ? "var(--status-approved)" : "var(--status-rejected)" }}>
                    {facility.status_fasilitas === "tersedia" ? "✓ Tersedia" : "✗ Tidak Tersedia"}
                  </span>
                </div>
              </div>

              {facility.deskripsi && (
                <p className="detail-desc">{facility.deskripsi}</p>
              )}

              <div className="pj-info">
                <div><strong>Penanggung Jawab Ruangan: </strong><span>{facility.penanggung_jawab}</span></div>
                {facility.kontak_pj && (
                  <div style={{ marginTop: 4 }}><strong>Kontak PJ Ruangan: </strong><span>{facility.kontak_pj}</span></div>
                )}
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={() => setShowBooking(true)}
                disabled={facility.status_fasilitas !== "tersedia"}
              >
                Ajukan Peminjaman
              </button>
            </>
          ) : (
            <BookingForm
              facility={facility}
              onSuccess={() => {
                onBookingSuccess();
                onClose();
              }}
              onBack={() => setShowBooking(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
