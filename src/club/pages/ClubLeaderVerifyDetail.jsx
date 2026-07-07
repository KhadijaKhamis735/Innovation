import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ClubSidebar from "../components/ClubSidebar";
import { useClub } from "../context/ClubContext";
// Same shell/sidebar/topbar/card classes as InnovatorDashboard.
import "../../pages/InnovatorDashboard.css";
import "./ClubLeaderVerifyDetail.css";
import "./ClubLeaderExtras.css";

const formatDate = (iso) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch (e) { return iso; }
};

const initials = (name) =>
  (name || "CU").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export default function ClubLeaderVerifyDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { currentClubLeader, findUniversity, students, approveStudent, rejectStudent, logoutClub } = useClub();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState("");

  if (!currentClubLeader) {
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

  const student = students.find((s) => s.id === studentId);
  const university = student ? findUniversity(student.universityId) : null;

  if (!student) {
    return (
      <div className="dashboard">
        <ClubSidebar user={currentClubLeader} userRole="leader" onLogout={() => { logoutClub(); navigate("/club", { replace: true }); }} />
        <main className="main-content">
          <header className="top-bar">
            <div className="top-bar-left">
              <h1 className="page-title">Student not found</h1>
              <p className="page-subtitle">This record may have been removed.</p>
            </div>
            <div className="top-bar-right">
              <div className="user-avatar">{initials(currentClubLeader.fullName)}</div>
            </div>
          </header>
          <div className="dashboard-content">
            <button className="quick-action-btn quick-action-secondary" onClick={() => navigate("/club/leader/dashboard", { replace: true })}>
              <span className="quick-action-arrow">←</span>
              <span className="quick-action-label">Back to dashboard</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleLogout = () => {
    logoutClub();
    navigate("/club", { replace: true });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleApprove = () => {
    approveStudent(student.id, currentClubLeader.id);
    showToast("Student verified ✓");
    setTimeout(() => navigate("/club/leader/dashboard", { replace: true }), 800);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      showToast("Please provide a reason");
      return;
    }
    rejectStudent(student.id, currentClubLeader.id, rejectReason.trim());
    setRejectOpen(false);
    showToast("Student rejected");
    setTimeout(() => navigate("/club/leader/dashboard", { replace: true }), 800);
  };

  const memberInitials = initials(currentClubLeader.fullName);

  return (
    <div className="dashboard">
      <ClubSidebar user={currentClubLeader} userRole="leader" onLogout={handleLogout} />

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">Review Student</h1>
            <p className="page-subtitle">{university?.shortName} · {university?.name}</p>
          </div>
          <div className="top-bar-right">
            <button className="icon-btn" onClick={() => navigate("/club/leader/dashboard")} title="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div className="user-avatar">{memberInitials}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Hero card — mirrors Innovator's Recent Applications hero block */}
          <section className="card verify-hero-card">
            <div className="verify-avatar">{initials(student.fullName)}</div>
            <h2 className="verify-name">{student.fullName}</h2>
            <div className="verify-status-row">
              <span className={`status-badge status-${student.status}`}>
                {student.status === "pending" ? "Pending" : student.status === "active" ? "Verified" : "Rejected"}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Registered {formatDate(student.registeredAt)}
              </span>
            </div>
          </section>

          <div className="dashboard-grid">
            {/* Details — mirrors Recent Applications */}
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Registration Details</h2>
              </div>
              <div className="applications-list">
                <div className="application-item">
                  <div className="application-info">
                    <h3 className="application-title" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</h3>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{student.email}</span>
                </div>
                <div className="application-item">
                  <div className="application-info">
                    <h3 className="application-title" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>University</h3>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{university?.name || "—"}</span>
                </div>
                <div className="application-item" style={{ borderBottom: "none" }}>
                  <div className="application-info">
                    <h3 className="application-title" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Registration Number</h3>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace" }}>{student.regNumber}</span>
                </div>
              </div>
            </section>

            {/* Actions — mirrors Quick Actions */}
            <section className="card quick-actions-card">
              <div className="card-header">
                <h2 className="card-title">Decision</h2>
              </div>
              {student.status === "pending" ? (
                <div className="quick-actions">
                  <button
                    type="button"
                    className="quick-action-btn quick-action-secondary verify-reject-btn"
                    onClick={() => setRejectOpen(true)}
                  >
                    <div className="quick-action-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                    <span className="quick-action-label">Reject Student</span>
                    <span className="quick-action-arrow">→</span>
                  </button>
                  <button
                    type="button"
                    className="quick-action-btn quick-action-primary"
                    onClick={handleApprove}
                  >
                    <div className="quick-action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="quick-action-label">Approve Student</span>
                    <span className="quick-action-arrow">✓</span>
                  </button>
                </div>
              ) : (
                <div className="verify-decided-card">
                  <h3 className="verify-decided-title">
                    {student.status === "active" ? "Already verified" : "Already rejected"}
                  </h3>
                  {student.verifiedAt ? (
                    <p className="verify-decided-meta">Decided on {formatDate(student.verifiedAt)}</p>
                  ) : null}
                  {student.rejectionReason ? (
                    <p className="verify-decided-reason">"{student.rejectionReason}"</p>
                  ) : null}
                  <button className="club-btn-primary" onClick={() => navigate("/club/leader/dashboard", { replace: true })}>
                    Back to Dashboard
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {rejectOpen ? (
        <div className="club-modal-overlay" onClick={() => setRejectOpen(false)}>
          <div className="club-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 className="club-modal-title">Reject this student?</h3>
            <p className="club-modal-sub">
              Please provide a reason. The student will see this message on their next login.
            </p>
            <textarea
              className="club-form-textarea"
              placeholder="e.g. Registration number not on the official roster."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div className="club-modal-actions">
              <button className="club-btn-outline" onClick={() => setRejectOpen(false)}>Cancel</button>
              <button
                className="club-btn-danger"
                onClick={handleReject}
              >
                Reject student
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="club-toast">{toast}</div> : null}
    </div>
  );
}