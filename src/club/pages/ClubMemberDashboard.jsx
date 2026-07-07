import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClubSidebar from "../components/ClubSidebar";
import { useClub } from "../context/ClubContext";
import { useAuth } from "../../context/AuthContext";
// Reuse the EXACT same shell, sidebar, topbar, stat-card, card conventions
// as InnovatorDashboard so the two portals feel like one system.
import "../../pages/InnovatorDashboard.css";
import "./ClubLeaderExtras.css";

const formatDate = (iso) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch (e) { return iso; }
};

const PHASE_LABEL = {
  idea: "Idea", proposal: "Proposal", prototype: "Prototype", mvp: "MVP", scaling: "Scaling",
};

export default function ClubMemberDashboard() {
  const navigate = useNavigate();
  const {
    currentStudent,
    findUniversity,
    clubs,
    projectsForStudent,
    statsForUniversity,
    logoutClub,
  } = useClub();
  const { logout: logoutAuth } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

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
  const myClub = clubs.find((c) => c.universityId === currentStudent.universityId);
  const myProjects = projectsForStudent(currentStudent.id);
  const uniStats = statsForUniversity(currentStudent.universityId);
  const verified = currentStudent.status === "active";
  const memberInitials = (currentStudent.fullName || "CU")
    .split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const statsCards = [
    { label: "Verified in University", value: uniStats.verified, color: "green",  icon: "check" },
    { label: "Pending in University",  value: uniStats.pending,  color: "purple", icon: "clock" },
    { label: "My Club Projects",       value: myProjects.length, color: "blue",   icon: "folder" },
    { label: "My Status",              value: verified ? "Verified" : "Pending", color: "orange", icon: "shield" },
  ];

  const handleLogout = () => {
    logoutClub();
    logoutAuth();
    navigate("/", { replace: true });
  };

  const renderIcon = (name) => {
    const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };
    switch (name) {
      case "folder":
        return <svg {...common}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
      case "clock":
        return <svg {...common}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
      case "check":
        return <svg {...common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
      case "shield":
        return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
      default:
        return null;
    }
  };

  const notifications = verified ? [
    { id: 1, title: "Welcome to your club", message: `You're a verified member of ${university?.shortName} Innovation Club.`, time: "Just now", unread: true },
    { id: 2, title: "Club project posted", message: "Your project will surface on the Innovation Hub.", time: "1 day ago", unread: false },
  ] : [
    { id: 1, title: "Awaiting verification", message: "Your account is pending until your Club Leader verifies your Student Registration Number.", time: "Just now", unread: true },
    { id: 2, title: "How verification works", message: "Your university's Club Leader (Mlezi) will approve your registration number.", time: "Yesterday", unread: false },
  ];

  return (
    <div className="dashboard">
      <ClubSidebar user={currentStudent} userRole="member" onLogout={handleLogout} />

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">Club Member Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {currentStudent.firstName || currentStudent.fullName?.split(" ")[0] || "Member"}! · {university?.shortName}
            </p>
          </div>
          <div className="top-bar-right">
            <div className="notification-wrapper">
              <button
                className="icon-btn notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="notification-badge">{notifications.filter((n) => n.unread).length}</span>
              </button>
              {showNotifications ? (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <button className="mark-read-btn">Mark all as read</button>
                  </div>
                  <div className="notification-list">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`notification-item ${notif.unread ? "unread" : ""}`}>
                        <div className="notif-icon">
                          {notif.unread ? <span className="unread-dot"></span> : null}
                        </div>
                        <div className="notif-content">
                          <p className="notif-title">{notif.title}</p>
                          <p className="notif-message">{notif.message}</p>
                          <span className="notif-time">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="notification-footer">
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowNotifications(false); }}>View All Notifications</a>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="user-avatar">{memberInitials}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Verification banner — only when not yet verified */}
          {!verified ? (
            <section className="club-pending-banner">
              <span className="club-pending-banner-icon">🕒</span>
              <div>
                <p className="club-pending-banner-title">Awaiting verification</p>
                <p className="club-pending-banner-text">
                  Your account is still pending. You can browse the Innovation Hub,
                  but "Create Club Project" is locked until your Club Leader verifies
                  your Student Registration Number.
                </p>
              </div>
              <span className="status-badge status-pending">Pending</span>
            </section>
          ) : null}

          {/* Stats grid — same component class as Innovator */}
          <section className="stats-grid">
            {statsCards.map((stat) => (
              <div key={stat.label} className={`stat-card stat-card-${stat.color}`}>
                <div className="stat-icon">{renderIcon(stat.icon)}</div>
                <div className="stat-info">
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </section>

          <div className="dashboard-grid">
            {/* My Club card — mirrors Recent Applications */}
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">My Club</h2>
                <span className="card-link">{university?.shortName}</span>
              </div>
              <div className="club-detail-card">
                <div className="club-detail-badge" style={{ background: university?.primaryColor }}>
                  {university?.shortName}
                </div>
                <h3 className="club-detail-name">{myClub?.name || `${university?.shortName} Innovation Club`}</h3>
                <p className="club-detail-meta">{university?.name}</p>
                <p className="club-detail-meta">{university?.tagline}</p>
              </div>
            </section>

            {/* Quick actions — same component class as Innovator */}
            <section className="card quick-actions-card">
              <div className="card-header">
                <h2 className="card-title">Quick Actions</h2>
              </div>
              <div className="quick-actions">
                <button
                  type="button"
                  className={`quick-action-btn ${verified ? "quick-action-primary" : "quick-action-secondary"}`}
                  onClick={() => verified && navigate("/club/member/create")}
                  disabled={!verified}
                  style={!verified ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                >
                  <div className="quick-action-icon">
                    {verified ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </div>
                  <span className="quick-action-label">
                    {verified ? "Create Club Project" : "Create Club Project (locked)"}
                  </span>
                  <span className="quick-action-arrow">→</span>
                </button>
                <a
                  href="/club"
                  className="quick-action-btn quick-action-secondary"
                  onClick={(e) => { e.preventDefault(); navigate("/club"); }}
                >
                  <div className="quick-action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span className="quick-action-label">Club Hub Home</span>
                  <span className="quick-action-arrow">→</span>
                </a>
              </div>
            </section>
          </div>

          {/* My Projects — mirrors Latest Opportunities card */}
          <section className="card opportunities-preview" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h2 className="card-title">My Projects</h2>
              {myProjects.length > 0 ? (
                <span className="card-link">Surfaced in Innovation Hub</span>
              ) : null}
            </div>
            {myProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p>You haven't posted a Club Project yet. Once verified, use "Create Club Project" above.</p>
              </div>
            ) : (
              <div className="opportunities-list">
                {myProjects.map((p) => (
                  <div key={p.id} className="opportunity-item">
                    <div className="opportunity-header">
                      <h3 className="opportunity-title">{p.title}</h3>
                      <span className="opp-type-badge">{p.category}</span>
                    </div>
                    <p className="opportunity-org">{p.authorName} · {university?.shortName}</p>
                    <div className="opportunity-meta">
                      <span className="opp-amount">{PHASE_LABEL[p.phase] || p.phase}</span>
                      <span className="opp-deadline">📅 {formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Separate-systems note */}
          <section className="card" style={{ marginTop: 24, background: "rgba(59, 130, 246, 0.04)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(59, 130, 246, 0.12)", color: "#1d4ed8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                ℹ️
              </div>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                  About Club Management &amp; Innovation Hub
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Club Management is a <strong>separate system</strong> from the Innovation Hub.
                  Each system has its own account and login. To apply for funding, browse
                  public opportunities, or post standalone innovation projects, sign up
                  separately at the Innovation Hub.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}