import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./InnovatorDashboard.css";

export default function InnovatorDashboard() {
  const navigate = useNavigate();
  const { user, opportunities } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const stats = [
    { label: "Active Projects", value: "3", icon: "folder", color: "blue" },
    { label: "Applications Sent", value: "5", icon: "send", color: "orange" },
    { label: "In Review", value: "2", icon: "clock", color: "purple" },
    { label: "Successful", value: "1", icon: "check", color: "green" },
  ];

  const recentApplications = [
    { id: 1, title: "Innovation Grant 2026", org: "UNDP Tanzania", status: "Under Review", date: "May 15, 2026" },
    { id: 2, title: "Youth Innovation Challenge", org: "UNESCO", status: "Submitted", date: "May 12, 2026" },
    { id: 3, title: "Tech Startup Fund", org: "AfricArena", status: "Accepted", date: "May 5, 2026" },
  ];

  const notifications = [
    { id: 1, title: "Application Under Review", message: "Your application for Innovation Grant 2026 is being reviewed", time: "2 hours ago", unread: true },
    { id: 2, title: "New Opportunity Available", message: "New funding opportunity from Gates Foundation", time: "1 day ago", unread: true },
    { id: 3, title: "Project Milestone Completed", message: "Your project Smart Water Monitor reached Prototype phase", time: "3 days ago", unread: false },
  ];

  const quickActions = [
    { label: "Browse Opportunities", icon: "search", path: "/dashboard/innovator/opportunities", color: "primary" },
    { label: "My Applications", icon: "file", path: "/dashboard/innovator/applications", color: "secondary" },
    { label: "View Projects", icon: "folder", path: "/dashboard/innovator/projects", color: "secondary" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="dashboard">
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
          <Link to="/dashboard/innovator" className="nav-item nav-item-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/dashboard/innovator/projects" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>My Projects</span>
          </Link>
          <Link to="/dashboard/innovator/opportunities" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>Browse Opportunities</span>
          </Link>
          <Link to="/dashboard/innovator/applications" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>My Applications</span>
          </Link>
          <Link to="/dashboard/innovator/settings" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
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

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.firstName || 'Innovator'}!</p>
          </div>
          <div className="top-bar-right">
            <div className="notification-wrapper">
              <button className="icon-btn notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="notification-badge">{notifications.filter(n => n.unread).length}</span>
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <button className="mark-read-btn">Mark all as read</button>
                  </div>
                  <div className="notification-list">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
                        <div className="notif-icon">
                          {notif.unread && <span className="unread-dot"></span>}
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
                    <Link to="/dashboard/innovator/notifications" onClick={() => setShowNotifications(false)}>
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="user-avatar">
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className={`stat-card stat-card-${stat.color}`}>
                <div className="stat-icon">
                  {stat.icon === "folder" && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                  {stat.icon === "send" && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                  {stat.icon === "clock" && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                  {stat.icon === "check" && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </div>
                <div className="stat-info">
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </section>

          <div className="dashboard-grid">
            <section className="card recent-applications">
              <div className="card-header">
                <h2 className="card-title">Recent Applications</h2>
                <Link to="/dashboard/innovator/applications" className="card-link">View All</Link>
              </div>
              <div className="applications-list">
                {recentApplications.map((app) => (
                  <div key={app.id} className="application-item">
                    <div className="application-info">
                      <h3 className="application-title">{app.title}</h3>
                      <p className="application-org">{app.org}</p>
                      <p className="application-date">{app.date}</p>
                    </div>
                    <span className={`status-badge status-${app.status.toLowerCase().replace(" ", "-")}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card quick-actions-card">
              <div className="card-header">
                <h2 className="card-title">Quick Actions</h2>
              </div>
              <div className="quick-actions">
                {quickActions.map((action) => (
                  <Link key={action.path} to={action.path} className={`quick-action-btn quick-action-${action.color}`}>
                    <span className="quick-action-icon">
                      {action.icon === "search" && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                      )}
                      {action.icon === "file" && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                      {action.icon === "folder" && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                    </span>
                    <span className="quick-action-label">{action.label}</span>
                    <svg className="quick-action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>

            <section className="card opportunities-preview">
              <div className="card-header">
                <h2 className="card-title">Latest Opportunities</h2>
                <Link to="/dashboard/innovator/opportunities" className="card-link">Browse All</Link>
              </div>
              <div className="opportunities-list">
                {opportunities.slice(0, 3).map((opp) => (
                  <div key={opp.id} className="opportunity-item">
                    <div className="opportunity-header">
                      <h3 className="opportunity-title">{opp.title}</h3>
                      <span className="opp-type-badge">{opp.type}</span>
                    </div>
                    <p className="opportunity-org">{opp.org}</p>
                    <div className="opportunity-meta">
                      <span className="opp-amount">{opp.amount}</span>
                      <span className="opp-deadline">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card help-resources-card">
              <div className="card-header">
                <h2 className="card-title">Help & Resources</h2>
              </div>
              <div className="help-items">
                <Link to="/dashboard/innovator/projects" className="help-item">
                  <div className="help-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="help-content">
                    <h4>My Projects</h4>
                    <p>Track your project milestones</p>
                  </div>
                </Link>
                <Link to="/dashboard/innovator/opportunities" className="help-item">
                  <div className="help-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <div className="help-content">
                    <h4>Browse Opportunities</h4>
                    <p>Find funding for your innovation</p>
                  </div>
                </Link>
                <Link to="/dashboard/innovator/settings" className="help-item">
                  <div className="help-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <div className="help-content">
                    <h4>Settings</h4>
                    <p>Manage your account</p>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}