import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./FunderDashboard.css";

const opportunityTypes = [
  { value: "Grant", desc: "Funding for specific projects or research" },
  { value: "Accelerator", desc: "Mentorship and resources for growth" },
  { value: "Challenge", desc: "Competition with prizes for solutions" },
  { value: "Fellowship", desc: "Structured program for skill development" },
];

const typeColors = {
  Grant: { bg: "#e0f2fe", color: "#0284c7" },
  Accelerator: { bg: "#f3e8ff", color: "#7c3aed" },
  Challenge: { bg: "#fef3c7", color: "#d97706" },
  Fellowship: { bg: "#dcfce7", color: "#16a34a" },
};

export default function PostOpportunity() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "Grant",
    description: "",
    amount: "",
    deadline: "",
    location: "",
    requirements: "",
    tags: "",
  });
  const [step, setStep] = useState(1);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.deadline) {
      showToast("Please fill in all required fields");
      return;
    }
    showToast("Opportunity posted successfully!");
    setTimeout(() => navigate("/dashboard/funder/opportunities"), 1500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="sidebar-brand">Innovation Hub</span>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard/funder" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/dashboard/funder/post" className="nav-item nav-item-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>Post Opportunity</span>
          </Link>
          <Link to="/dashboard/funder/opportunities" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>My Opportunities</span>
          </Link>
          <Link to="/dashboard/funder/applications" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Applications</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </Link>
          <button className="nav-item nav-item-logout" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">Post New Opportunity</h1>
            <p className="page-subtitle">Create an opportunity for innovators to apply</p>
          </div>
        </header>

        <div className="dashboard-content">
          <form onSubmit={handleSubmit}>
            {/* Progress Steps */}
            <div className="tabs-container" style={{ marginBottom: "32px" }}>
              <button type="button" className={`tab-btn ${step === 1 ? "tab-active" : ""}`}>
                <span>1. Basic Info</span>
              </button>
              <button type="button" className={`tab-btn ${step === 2 ? "tab-active" : ""}`}>
                <span>2. Details</span>
              </button>
              <button type="button" className={`tab-btn ${step === 3 ? "tab-active" : ""}`}>
                <span>3. Review</span>
              </button>
            </div>

            <div className="form-card" style={{ maxWidth: "800px" }}>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "24px" }}>
                    Basic Information
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Opportunity Title *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Green Tech Innovation Grant 2026"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                      {opportunityTypes.map((type) => (
                        <div
                          key={type.value}
                          onClick={() => setForm({ ...form, type: type.value })}
                          style={{
                            padding: "16px",
                            borderRadius: "12px",
                            border: `2px solid ${form.type === type.value ? "#f97316" : "#e2e8f0"}`,
                            background: form.type === type.value ? `${typeColors[type.value].bg}` : "#fff",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          <span style={{ fontWeight: "600", color: typeColors[type.value].color }}>
                            {type.value}
                          </span>
                          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
                            {type.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Award / Value</label>
                      <input
                        className="form-input"
                        placeholder="e.g. $10,000 or Mentorship"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Application Deadline *</label>
                      <input
                        className="form-input"
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "24px" }}>
                    Opportunity Details
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: "160px" }}
                      placeholder="Describe what this opportunity offers, who should apply, and what you are looking for..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Requirements</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: "100px" }}
                      placeholder="List the eligibility criteria, qualifications, or any specific requirements..."
                      value={form.requirements}
                      onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Pitch Location</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Nairobi, Kenya or Remote"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tags (comma-separated)</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Technology, Health, Youth"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "24px" }}>
                    Review Your Opportunity
                  </h3>

                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                      <div>
                        <span
                          className="type-badge"
                          style={{ background: typeColors[form.type]?.bg, color: typeColors[form.type]?.color }}
                        >
                          {form.type}
                        </span>
                        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "12px 0 0" }}>
                          {form.title || "Untitled Opportunity"}
                        </h2>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
                      {form.amount && (
                        <div>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Award</p>
                          <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>{form.amount}</p>
                        </div>
                      )}
                      {form.deadline && (
                        <div>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Deadline</p>
                          <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>{formatDate(form.deadline)}</p>
                        </div>
                      )}
                      {form.location && (
                        <div>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Pitch Location</p>
                          <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>{form.location}</p>
                        </div>
                      )}
                    </div>

                    {form.description && (
                      <div style={{ marginBottom: "16px" }}>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 8px" }}>Description</p>
                        <p style={{ color: "#334155", lineHeight: "1.6", margin: 0 }}>{form.description}</p>
                      </div>
                    )}

                    {form.requirements && (
                      <div style={{ marginBottom: "16px" }}>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 8px" }}>Requirements</p>
                        <p style={{ color: "#334155", lineHeight: "1.6", margin: 0 }}>{form.requirements}</p>
                      </div>
                    )}

                    {form.tags && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {form.tags.split(",").map((tag, i) => (
                          <span key={i} className="opp-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                {step > 1 && (
                  <button type="button" className="btn-outline" onClick={prevStep}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}
                <Link to="/dashboard/funder/opportunities" className="btn-outline">
                  Cancel
                </Link>
                {step < 3 ? (
                  <button type="button" className="btn-primary" onClick={nextStep}>
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button type="submit" className="btn-primary">
                    Post Opportunity
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}