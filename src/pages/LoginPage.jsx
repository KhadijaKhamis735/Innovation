import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", role: "innovator" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      login(form.email, form.role);
      navigate(form.role === "innovator" ? "/dashboard/innovator" : "/dashboard/funder");
    }, 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-blob auth-left-blob-1" />
        <div className="auth-left-blob auth-left-blob-2" />
        <div className="auth-left-blob auth-left-blob-3" />
        <Link to="/" className="auth-brand">
          <div className="auth-brand-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="auth-brand-name">Innovation Management</span>
        </Link>
        <h2 className="auth-left-title">Welcome back to your innovation hub</h2>
        <p className="auth-left-sub">
          Log in to manage your projects, discover opportunities, and grow your innovation journey.
        </p>
        <ul className="auth-perks">
          <li className="auth-perk-item">
            <span className="auth-perk-check">✓</span>
            Manage your projects and track progress
          </li>
          <li className="auth-perk-item">
            <span className="auth-perk-check">✓</span>
            Browse and apply for funding
          </li>
          <li className="auth-perk-item">
            <span className="auth-perk-check">✓</span>
            Connect with funders and partners
          </li>
        </ul>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <h1 className="auth-heading">Sign in</h1>
          <p className="auth-subheading">Enter your credentials to access your dashboard.</p>

          <div className="role-toggle">
            {["innovator", "funder"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, role: r })}
                className={`role-btn ${form.role === r ? "role-btn-active" : ""}`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">Password</label>
                <Link to="#" className="forgot-link">Forgot Password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="form-input"
                  style={{ paddingRight: "48px" }}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: "4px",
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register" className="auth-switch-link">
              Create one
            </Link>
          </p>

          <p className="auth-admin-link">
            <Link to="/admin/login" className="auth-admin-link-text">
              Admin Login
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}