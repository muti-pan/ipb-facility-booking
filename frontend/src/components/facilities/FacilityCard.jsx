import { getDirectImageUrl } from '../../utils/formatters';

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function FacilityCard({ facility, onClick }) {
  const capacity = facility.kapasitas_min
    ? `${facility.kapasitas_min.toLocaleString()}–${facility.kapasitas_max.toLocaleString()} orang`
    : `${facility.kapasitas_max.toLocaleString()} orang`;

  return (
    <div className="facility-card" onClick={onClick}>
      <div className="facility-card-img">
        {facility.foto
          ? <img src={getDirectImageUrl(facility.foto)} alt={facility.nama} onError={e => { e.target.style.display = "none"; }} />
          : <span style={{ fontSize: 40, opacity: 0.3 }}>🏛️</span>
        }
      </div>
      <div className="facility-card-body">
        <div className="facility-card-header">
          <span className="faculty-tag">{facility.fakultas}</span>
        </div>
        <div className="facility-name">{facility.nama}</div>
        <div className="facility-meta">
          <span className="capacity-info">👥 {capacity}</span>
          <span className="price-info">{formatRupiah(facility.harga)}</span>
        </div>
        {facility.deskripsi && (
          <p className="facility-desc">{facility.deskripsi}</p>
        )}
      </div>
    </div>
  );
}
