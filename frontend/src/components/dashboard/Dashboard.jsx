import { useState, useEffect } from "react";
import { apiFetch } from "../../App";
import Navbar from "./Navbar";
import FacilityCard from "../facilities/FacilityCard";
import FacilityModal from "../facilities/FacilityModal";

const FAKULTAS_OPTIONS = ["Semua", "FMIPA", "Pertanian", "FEM", "Umum", "FAPERTA", "FAHUTAN", "FPIK", "FKH", "FAPET", "FATETA", "SB", "SV"];

export default function Dashboard() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fakultas, setFakultas] = useState("Semua");
  const [selected, setSelected] = useState(null);

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (fakultas !== "Semua") params.set("fakultas", fakultas);
      const data = await apiFetch(`/facilities/?${params}`);
      setFacilities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadFacilities, 300);
    return () => clearTimeout(timer);
  }, [search, fakultas]);

  return (
    <div className="app-container">
      <Navbar onSearch={setSearch} searchValue={search} />

      <div className="main-content">
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {FAKULTAS_OPTIONS.map(f => (
            <button
              key={f}
              onClick={() => setFakultas(f)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1.5px solid",
                borderColor: fakultas === f ? "var(--ipb-blue)" : "var(--border)",
                background: fakultas === f ? "var(--ipb-blue)" : "var(--surface)",
                color: fakultas === f ? "white" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "0.15s",
                fontFamily: "inherit"
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Facilities Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : facilities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏛️</div>
            <div className="empty-state-title">Tidak ada fasilitas ditemukan</div>
            <div className="empty-state-desc">Coba ubah filter atau kata kunci pencarian</div>
          </div>
        ) : (
          <div className="facilities-grid">
            {facilities.map(f => (
              <FacilityCard key={f.id} facility={f} onClick={() => setSelected(f)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <FacilityModal
          facility={selected}
          onClose={() => setSelected(null)}
          onBookingSuccess={() => {
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      border: "1px solid var(--border)"
    }}>
      <div style={{ height: 160, background: "var(--surface-2)", animation: "pulse 1.5s infinite" }} />
      <div style={{ padding: 16 }}>
        <div style={{ height: 12, background: "var(--surface-2)", borderRadius: 4, marginBottom: 8, width: "40%" }} />
        <div style={{ height: 16, background: "var(--surface-2)", borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 12, background: "var(--surface-2)", borderRadius: 4, width: "70%" }} />
      </div>
    </div>
  );
}
