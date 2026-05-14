import { useState, useRef, useEffect } from "react";
import { useAuth, apiFetch } from "../../App";

function BellIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export { SearchIcon };

export default function Navbar({ onSearch, searchValue }) {
  const { user, logout, page, setPage } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const avatarRef = useRef(null);
  const notifRef = useRef(null);

  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifs = async () => {
    try {
      const data = await apiFetch("/notifications/");
      setNotifs(data);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (!avatarRef.current?.contains(e.target)) setShowDropdown(false);
      if (!notifRef.current?.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user?.nama?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const formatTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo-placeholder">IPB</div>
      </div>

      {setPage && (
        <div className="navbar-nav">
          <button
            className={`nav-btn ${page === "home" ? "active" : ""}`}
            onClick={() => setPage("home")}
          >
            Beranda
          </button>
          <button
            className={`nav-btn ${page === "history" ? "active" : ""}`}
            onClick={() => setPage("history")}
          >
            Riwayat Peminjaman
          </button>
        </div>
      )}

      {onSearch && (
        <div style={{ flex: 1, maxWidth: 400, margin: "0 12px" }}>
          <div className="search-input-wrap">
            <SearchIcon />
            <input
              className="search-input"
              placeholder="Cari fasilitas..."
              value={searchValue || ""}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="navbar-right">
        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button className="notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
            <BellIcon />
            {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>

          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifikasi</span>
                {unread > 0 && (
                  <button
                    style={{ fontSize: 12, color: "var(--ipb-blue)", cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
                    onClick={markAllRead}
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  Tidak ada notifikasi
                </div>
              ) : notifs.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? "unread" : ""}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="notif-item-title">{n.judul}</div>
                  <div className="notif-item-body">{n.pesan}</div>
                  <div className="notif-item-time">{formatTime(n.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div ref={avatarRef} style={{ position: "relative" }}>
          <button className="avatar-btn" onClick={() => setShowDropdown(!showDropdown)}>
            {initials}
          </button>
          {showDropdown && (
            <div className="dropdown">
              <div className="dropdown-item" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.nama}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user?.email}</div>
                </div>
              </div>
              <div className="dropdown-item danger" onClick={logout}>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
