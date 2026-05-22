import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRole = location.state?.defaultRole || "innovator";
  const [role, setRole] = useState(defaultRole);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "", sector: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("Please fill all required fields.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      login(form.email, role, form.firstName, form.lastName);
      navigate(role === "innovator" ? "/dashboard/innovator" : "/dashboard/funder");
    }, 900);
  };

  const requirements = [
    { text: "At least 6 characters", met: form.password.length >= 6 },
    { text: "Contains a number", met: /\d/.test(form.password) },
  ];

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
        <h2 className="auth-left-title">Join the innovation ecosystem today</h2>
        <p className="auth-left-sub">
          Whether you're an innovator with ideas or an organization seeking talent this is where it starts.
        </p>
        <ul className="auth-perks">
          <li className="auth-perk-item">
            <span className="auth-perk-check">✓</span>
            Free to join as Innovator
          </li>
          <li className="auth-perk-item">
            <span className="auth-perk-check">✓</span>
            Connect with partners and opportunities
          </li>
          <li className="auth-perk-item">
            <span className="auth-perk-check">✓</span>
            Track everything in one place
          </li>
        </ul>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <h1 className="auth-heading">Create account</h1>
          <p className="auth-subheading">Get started it's completely free.</p>

          <div className="role-toggle">
            {[
              { key: "innovator", label: "Innovator" },
              { key: "funder", label: "Funder" },
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={`role-btn ${role === r.key ? "role-btn-active" : ""}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {role === "funder" && (
            <div className="auth-notice">
              <strong>Note:</strong> Funder accounts require admin approval before you can post funding opportunities.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  placeholder="First Name"
                  className="form-input"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  autoComplete="given-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  className="form-input"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  autoComplete="family-name"
                />
              </div>
            </div>

            {role === "funder" && (
              <div className="form-group">
                <label className="form-label">Industry / Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Technology, Healthcare"
                  className="form-input"
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email address *</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    className="form-input"
                    style={{ paddingRight: "48px" }}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="new-password"
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
                {form.password && (
                  <div className="password-requirements">
                    {requirements.map((req, i) => (
                      <span key={i} className={`requirement ${req.met ? "met" : ""}`}>
                        <span className="requirement-icon">
                          {req.met ? "✓" : "○"}
                        </span>
                        {req.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm password"
                    className="form-input"
                    style={{ paddingRight: "48px" }}
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
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
                    {showConfirm ? (
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
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                `Register as ${role === "innovator" ? "Innovator" : "Funder"}`
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login" className="auth-switch-link">
              Sign in
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