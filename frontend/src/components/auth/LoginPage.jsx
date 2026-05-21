import { useState } from "react";
import { useAuth } from "../../App";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login gagal");
      login(data.user, data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className="login-content">
        <div className="login-card">
          <div className="login-logo">
            <a href="https://www.ipb.ac.id/" target="_blank" rel="noopener">
              <img src="https://www.ipb.ac.id/wp-content/uploads/2023/12/Logo-IPB-University_Horizontal-Putih.png" alt="IPB University" style={{ height: 52, objectFit: "contain", marginBottom: 8 }} />
            </a>
            <div className="login-title">IPB Facility</div>
            <div className="login-subtitle">Sistem Peminjaman Fasilitas Kampus</div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-msg">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="nama@apps.ipb.ac.id"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Masukkan password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          <div className="login-note">
            Gunakan email domain @apps.ipb.ac.id atau @ipb.ac.id
          </div>
        </div>
      </div>
    </div>
  );
}
