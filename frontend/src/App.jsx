import { useState, useEffect, createContext, useContext } from "react";
import LoginPage from "./components/auth/LoginPage";
import Dashboard from "./components/dashboard/Dashboard";
import BookingHistory from "./components/booking/BookingHistory";
import AdminDashboard from "./components/admin/AdminDashboard";
import "./styles/global.css";

// ─── Auth Context ─────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─── API Helper ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Terjadi kesalahan" }));
    throw new Error(err.detail || "Request gagal");
  }
  return res.json();
}

export async function apiUpload(path, file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload file gagal" }));
    throw new Error(err.detail || "Upload file gagal");
  }
  return res.json();
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("home"); // home | history | admin

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setPage("home");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("home");
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <LoginPage />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, page, setPage }}>
      <div className="app-container">
        {user.role === "admin" ? (
          <AdminDashboard />
        ) : (
          <>
            {page === "history" ? <BookingHistory /> : <Dashboard />}
          </>
        )}
      </div>
    </AuthContext.Provider>
  );
}
