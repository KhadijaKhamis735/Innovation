import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClubSidebar from "../components/ClubSidebar";
import { useClub } from "../context/ClubContext";
import { useAuth } from "../../context/AuthContext";
// Reuse the EXACT same shell, sidebar, topbar, stat-card, card,
// status-badge, notification-dropdown CSS classes as InnovatorDashboard
// so the two portals feel like one system.
import "../../pages/InnovatorDashboard.css";
import "./ClubLeaderExtras.css";

const formatDate = (iso) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch (e) { return iso; }
};

const initials = (name) =>
  (name || "CU").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

// Status mapping — the data model uses 'active' for verified members (per
// IBARA YA 13 in ClubContext), so keys here mirror the stored value, not
// the human-facing word.
const statusClass = {
  pending: "status-pending",
  active: "status-verified",
  rejected: "status-rejected",
};
const statusLabel = { pending: "Pending", active: "Verified", rejected: "Rejected" };

export default function ClubLeaderDashboard() {
  const navigate = useNavigate();
  const {
    currentClubLeader,
    findUniversity,
    pendingQueueForLeader,
    recentDecisionsForLeader,
    statsForUniversity,
    logoutClub,
  } = useClub();
  const { logout: logoutAuth } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

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

  const university = findUniversity(currentClubLeader.universityId);
  const queue = pendingQueueForLeader(currentClubLeader.id);
  const recent = recentDecisionsForLeader(currentClubLeader.id, 5);
  const stats = statsForUniversity(currentClubLeader.universityId);
  const memberInitials = initials(currentClubLeader.fullName);

  const statsCards = [
    { label: "Pending",  value: stats.pending,  color: "orange", icon: "clock" },
    { label: "Verified", value: stats.verified, color: "green",  icon: "check" },
    { label: "Rejected", value: stats.rejected, color: "purple", icon: "x" },
    { label: "Total Members", value: stats.total, color: "blue", icon: "users" },
  ];

  const handleLogout = () => {
    logoutClub();
    logoutAuth();
    navigate("/", { replace: true });
  };

  const renderIcon = (name) => {
    const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };
    switch (name) {
      case "clock":
        return <svg {...common}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
      case "check":
        return <svg {...common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
      case "x":
        return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
      case "users":
        return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
      default:
        return null;
    }
  };

  // Sample notifications (Club Leader domain)
  const notifications = [
    { id: 1, title: "New verification request", message: `${queue[0]?.fullName || "A student"} registered from your university`, time: "Just now", unread: true },
    { id: 2, title: "Student verified", message: "You approved a registration number.", time: "1 hour ago", unread: false },
    { id: 3, title: "Club project posted", message: "A verified member posted a new Club Project to the Innovation Hub.", time: "Yesterday", unread: false },
  ];

  return (
    <div className="dashboard">
      <ClubSidebar user={currentClubLeader} userRole="leader" onLogout={handleLogout} />

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">Club Leader Dashboard</h1>
            <p className="page-subtitle">
              {currentClubLeader.role} · {university?.shortName} · {university?.name}
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
                <span className="notification-badge">
                  {notifications.filter((n) => n.unread).length}
                </span>
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
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowNotifications(false); }}>
                      View All Notifications
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="user-avatar">{memberInitials}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Welcome card — mirrors Innovator's "Recent Applications" / "Quick Actions" cards */}
          <section className="card" style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #2d1f0f 100%)",
            color: "#fff",
            border: "none",
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: 1, opacity: 0.85, textTransform: "uppercase" }}>
                  Welcome
                </p>
                <h2 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, color: "#fff" }}>
                  {currentClubLeader.fullName}
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                  {currentClubLeader.role} of {university?.name}
                </p>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}>
                {university?.shortName}
              </div>
            </div>
          </section>

          {/* Stats grid — exact same component as Innovator */}
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
            {/* Verification queue — mirrors "Recent Applications" card */}
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Verification Queue</h2>
                <span className="card-link" style={{ color: queue.length > 0 ? "var(--orange-primary)" : "var(--text-muted)" }}>
                  {queue.length} pending
                </span>
              </div>

              {queue.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎉</div>
                  <p>No pending verifications — you're all caught up!</p>
                </div>
              ) : (
                <div className="applications-list">
                  {queue.map((s) => (
                    <div
                      key={s.id}
                      className="application-item club-queue-row"
                      onClick={() => navigate(`/club/leader/verify/${s.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") navigate(`/club/leader/verify/${s.id}`); }}
                    >
                      <div className="application-info">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="club-queue-avatar">{initials(s.fullName)}</div>
                          <div>
                            <h3 className="application-title">{s.fullName}</h3>
                            <p className="application-org">{s.regNumber}</p>
                            <p className="application-date">{s.email} · Registered {formatDate(s.registeredAt)}</p>
                          </div>
                        </div>
                      </div>
                      <span className="status-badge status-pending">{statusLabel.pending}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick actions — same component as Innovator */}
            <section className="card quick-actions-card">
              <div className="card-header">
                <h2 className="card-title">Quick Actions</h2>
              </div>
              <div className="quick-actions">
                <a href="/club/leader/dashboard" className="quick-action-btn quick-action-secondary" onClick={(e) => { e.preventDefault(); navigate("/club/leader/dashboard"); }}>
                  <div className="quick-action-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <span className="quick-action-label">Refresh Queue</span>
                  <span className="quick-action-arrow">→</span>
                </a>
                <a href="/club" className="quick-action-btn quick-action-secondary" onClick={(e) => { e.preventDefault(); navigate("/club"); }}>
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

          {/* Recent decisions — mirrors "Latest Opportunities" card */}
          <section className="card opportunities-preview" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h2 className="card-title">Recent Decisions</h2>
              <span className="card-link">Last {recent.length}</span>
            </div>
            {recent.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>No recent verifications yet.</p>
              </div>
            ) : (
              <div className="opportunities-list">
                {recent.map((s) => (
                  <div key={s.id} className="opportunity-item">
                    <div className="opportunity-header">
                      <h3 className="opportunity-title">{s.fullName}</h3>
                      <span className={`status-badge ${statusClass[s.status] || "status-pending"}`}>
                        {statusLabel[s.status] || s.status}
                      </span>
                    </div>
                    <p className="opportunity-org">{s.regNumber} · {s.email}</p>
                    <div className="opportunity-meta">
                      <span className="opp-deadline">Decided {formatDate(s.verifiedAt || s.registeredAt)}</span>
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
                  opportunities, or post public innovation projects, sign up separately at the
                  Innovation Hub.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}