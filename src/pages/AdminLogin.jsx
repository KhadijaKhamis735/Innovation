import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@innovationhub.com";
const ADMIN_PASSWORD = "admin123";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem("adminToken", "admin-logged-in");
        navigate("/admin/dashboard");
      } else {
        setError("Invalid email or password. Use the demo credentials below.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1>Admin Portal</h1>
          <p>Innovation Hub Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@innovationhub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-admin-login" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="demo-credentials">
          <h4>Demo Credentials</h4>
          <div className="credential-item">
            <span className="credential-label">Email:</span>
            <code>admin@innovationhub.com</code>
          </div>
          <div className="credential-item">
            <span className="credential-label">Password:</span>
            <code>admin123</code>
          </div>
        </div>
      </div>

      <div className="admin-login-footer">
        <p>Innovation Hub Admin Portal</p>
      </div>
    </div>
  );
}