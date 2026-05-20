import { useState, useEffect } from "react";
import { useAuth, apiFetch } from "../../App";
import AdminBookings from "./AdminBookings";
import AdminFacilities from "./AdminFacilities";
import AdminAddFacility from "./AdminAddFacility";

// "Tambah Fasilitas" dihapus dari NAV — akses hanya via tombol di halaman Kelola Fasilitas
const NAV = [
  { id: "bookings",    label: "Permintaan Persetujuan", icon: "📋" },
  { id: "facilities",  label: "Kelola Fasilitas",       icon: "🏛️" },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("bookings");
  const [stats, setStats] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiFetch("/admin/stats");
      setStats(data);
      setPendingCount(data.menunggu || 0);
    } catch {}
  };

  const initials = user?.nama?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const PAGE_TITLES = {
    bookings:   "Permintaan Persetujuan",
    facilities: "Kelola Fasilitas",
    add:        "Tambah Fasilitas Baru",
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <a href="https://www.ipb.ac.id/" target="_blank" rel="noopener">
              <img src="https://www.ipb.ac.id/wp-content/uploads/2023/12/Logo-IPB-University_Horizontal-Putih.png" alt="IPB University" style={{ height: 44, objectFit: "contain" }} />
            </a>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${page === item.id || (page === "add" && item.id === "facilities") ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "bookings" && pendingCount > 0 && (
                <span className="badge-count">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--ipb-accent)", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontWeight: 700, color: "var(--ipb-navy)", fontSize: 13
            }}>
              {initials}
            </div>
            <div>
              <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{user?.nama}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Admin</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%", padding: "8px", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "var(--radius-md)", background: "none",
              color: "rgba(255,255,255,0.65)", fontFamily: "inherit",
              fontSize: 13, cursor: "pointer", transition: "0.15s",
              display: "flex", alignItems: "center", gap: 8
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
          >
            ⎋ Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <div>
            <div className="admin-topbar-title">{PAGE_TITLES[page]}</div>
            {stats && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {stats.total} total · {stats.menunggu} menunggu persetujuan · {stats.disetujui} disetujui
              </div>
            )}
          </div>

          {/* Stats quick view */}
          {stats && (
            <div style={{ display: "flex", gap: 12 }}>
              <StatPill label="Menunggu Persetujuan"  value={stats.menunggu}  color="var(--status-pending)"  />
              <StatPill label="Disetujui" value={stats.disetujui} color="var(--status-approved)" />
              <StatPill label="Ditolak"   value={stats.ditolak}   color="var(--status-rejected)" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="admin-content">
          {page === "bookings"    && <AdminBookings onRefreshStats={loadStats} />}
          {page === "facilities"  && (
            <AdminFacilities onAdd={() => setPage("add")} />
          )}
          {page === "add" && (
            <AdminAddFacility
              onSuccess={() => { setPage("facilities"); loadStats(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 20,
      background: `${color}15`, border: `1px solid ${color}30`
    }}>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
    </div>
  );
}
