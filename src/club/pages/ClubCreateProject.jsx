import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClubSidebar from "../components/ClubSidebar";
import { useClub } from "../context/ClubContext";
// Same shell/sidebar/topbar as InnovatorDashboard;
// same form/tab/button classes as PostOpportunity (Funder portal)
import "../../pages/InnovatorDashboard.css";
import "../../pages/FunderDashboard.css";
import "./ClubLeaderExtras.css";

const CATEGORIES = ["AgriTech", "HealthTech", "EduTech", "CleanTech", "FinTech", "General"];
const PHASES = [
  { id: "idea",      label: "Idea",      desc: "Concept development",     color: "#0284c7", bg: "#e0f2fe" },
  { id: "proposal",  label: "Proposal",  desc: "Planning & pitching",     color: "#d97706", bg: "#fef3c7" },
  { id: "prototype", label: "Prototype", desc: "Building & testing",      color: "#7c3aed", bg: "#f3e8ff" },
  { id: "mvp",       label: "MVP",       desc: "Minimum viable product",  color: "#16a34a", bg: "#dcfce7" },
  { id: "scaling",   label: "Scaling",   desc: "Growth & expansion",      color: "#ea580c", bg: "#ffedd5" },
];

export default function ClubCreateProject() {
  const navigate = useNavigate();
  const { currentStudent, findUniversity, createClubProject, logoutClub } = useClub();

  const [step, setStep] = useState(1);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "AgriTech",
    phase: "idea",
    tagline: "",
    description: "",
    tags: "",
  });

  if (!currentStudent) {
    return (
      <div className="dashboard">
        <main className="main-content">
          <div className="dashboard-content">
            <p>You are not signed in. <a href="/club/login">Sign in</a></p>
          </div>
        </main>
      </div>
    );
  }

  const university = findUniversity(currentStudent.universityId);
  const memberInitials = (currentStudent.fullName || "CU")
    .split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.title.trim()) { setError("Please enter a project title."); return; }
      if (!form.tagline.trim()) { setError("Please add a short tagline."); return; }
    }
    if (step === 2) {
      if (!form.description.trim()) { setError("Please add a description."); return; }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const result = createClubProject(form, currentStudent);
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error || "Could not create project.");
        return;
      }
      showToast("Club project posted! Surfaced in Innovation Hub.");
      setTimeout(() => navigate("/club/member/dashboard", { replace: true }), 1200);
    }, 600);
  };

  const handleLogout = () => {
    logoutClub();
    navigate("/club", { replace: true });
  };

  return (
    <div className="dashboard">
      <ClubSidebar user={currentStudent} userRole="member" onLogout={handleLogout} />

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">Create Club Project</h1>
            <p className="page-subtitle">
              {university?.shortName} · Surfaces in Innovation Hub
            </p>
          </div>
          <div className="top-bar-right">
            <button className="icon-btn" onClick={() => navigate("/club/member/dashboard")} title="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div className="user-avatar">{memberInitials}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Step tabs — reusing Funder's tabs-container */}
          <div className="tabs-container">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={`tab-btn ${step === n ? "tab-active" : ""}`}
                onClick={() => setStep(n)}
              >
                {n}. {n === 1 ? "Basics" : n === 2 ? "Details" : "Review"}
              </button>
            ))}
          </div>

          {error ? <div className="club-error-box" style={{ marginBottom: 16 }}>{error}</div> : null}

          {/* Form steps live in a form-card (matches Funder's post-opportunity style) */}
          <div className="form-card">
            {step === 1 ? (
              <>
                <div className="form-group">
                  <label className="form-label">Project title *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Smart Irrigation for Zanzibar Farms"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {CATEGORIES.map((c) => {
                      const selected = form.category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => set("category", c)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 999,
                            border: "1px solid",
                            background: selected ? "var(--orange-light)" : "#fff",
                            borderColor: selected ? "var(--orange-primary)" : "var(--border-color)",
                            color: selected ? "var(--orange-primary)" : "var(--text-secondary)",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phase</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                    {PHASES.map((p) => {
                      const selected = form.phase === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => set("phase", p.id)}
                          style={{
                            padding: 14,
                            borderRadius: 12,
                            border: "1.5px solid",
                            borderColor: selected ? p.color : "var(--border-color)",
                            background: selected ? p.bg : "#fff",
                            textAlign: "left",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <h4 style={{
                            margin: "0 0 4px",
                            fontSize: 14,
                            fontWeight: 700,
                            color: selected ? p.color : "var(--text-primary)",
                          }}>
                            {p.label}
                          </h4>
                          <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>
                            {p.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Short tagline *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="One sentence summary"
                    value={form.tagline}
                    onChange={(e) => set("tagline", e.target.value)}
                  />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="What does the project do? Who benefits? What's the impact?"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. IoT, Agriculture, Zanzibar"
                    value={form.tags}
                    onChange={(e) => set("tags", e.target.value)}
                  />
                </div>

                <div className="club-notice">
                  <strong>Heads up:</strong> Your project will be visible on the Innovation Hub alongside funder opportunities. Only verified Club Members can post.
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px" }}>
                  Review your Club Project
                </h3>
                <ReviewRow label="Title" value={form.title} />
                <ReviewRow label="Category" value={form.category} />
                <ReviewRow label="Phase" value={PHASES.find((p) => p.id === form.phase)?.label || form.phase} />
                <ReviewRow label="Tagline" value={form.tagline} />
                <ReviewRow label="University" value={university?.name} />
                <ReviewRow label="Description" value={form.description} block />
                {form.tags.trim() ? <ReviewRow label="Tags" value={form.tags} /> : null}
              </>
            ) : null}
          </div>

          <div className="form-actions">
            {step > 1 ? (
              <button type="button" className="btn-outline" onClick={prevStep}>← Back</button>
            ) : null}
            {step < 3 ? (
              <button type="button" className="btn-primary" onClick={nextStep}>Next →</button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Posting…" : "Post Club Project 🚀"}
              </button>
            )}
          </div>
        </div>
      </main>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function ReviewRow({ label, value, block }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: block ? "flex-start" : "space-between",
      alignItems: block ? "flex-start" : "center",
      flexDirection: block ? "column" : "row",
      padding: "12px 0",
      borderBottom: "1px solid var(--border-color)",
      gap: 8,
    }}>
      <span style={{
        fontSize: 12,
        color: "var(--text-muted)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}>{label}</span>
      <span style={{
        fontSize: 14,
        color: "var(--text-primary)",
        fontWeight: 600,
        textAlign: block ? "left" : "right",
      }}>{value}</span>
    </div>
  );
}