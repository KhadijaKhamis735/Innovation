import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminPanel.css";

// Mock data
const mockStats = {
  innovators: 234,
  organizations: 89,
  opportunities: 156,
  applications: 412,
};

const mockPendingOrgs = [
  {
    id: 1,
    name: "TechBridge Africa",
    email: "contact@techbridge.africa",
    location: "Lagos, Nigeria",
    type: "Government Agency",
    submittedDate: "May 22, 2026",
  },
  {
    id: 2,
    name: "Green Innovators Hub",
    email: "hello@greeninnovators.org",
    location: "Nairobi, Kenya",
    type: "Non-Profit",
    submittedDate: "May 21, 2026",
  },
  {
    id: 3,
    name: "Women in Tech Africa",
    email: "info@womenintech.africa",
    location: "Accra, Ghana",
    type: "NGO",
    submittedDate: "May 20, 2026",
  },
];

const mockRecentActivity = [
  { type: "new_innovator", text: "Kofi Mensah registered as Innovator", time: "2 hours ago" },
  { type: "new_org", text: "TechBridge Africa submitted registration", time: "4 hours ago" },
  { type: "new_opp", text: "Green Tech Grant was posted", time: "6 hours ago" },
  { type: "new_app", text: "Sarah Wanjiku applied to Solar Grant", time: "8 hours ago" },
  { type: "approved", text: "HealthTech Accelerator was approved", time: "1 day ago" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const sendEmailNotification = (funder, status) => {
    const subject = status === "approved"
      ? "Your Funder Registration has been Approved!"
      : "Update on Your Funder Registration";
    const body = status === "approved"
      ? `Dear ${funder.name},\n\nWe are pleased to inform you that your funder registration has been approved! You can now start posting opportunities and connecting with innovators on our platform.\n\nWelcome aboard!\n\nBest regards,\nInnovation Hub Team`
      : `Dear ${funder.name},\n\nWe regret to inform you that your funder registration has not been approved at this time. If you have any questions, please contact our support team.\n\nBest regards,\nInnovation Hub Team`;
    showToast(`Email notification queued for ${funder.name}`);
  };

  const approveOrg = (orgId, orgName, orgEmail) => {
    showToast(`${orgName} has been approved`);
    const funder = { id: orgId, name: orgName, email: orgEmail };
    sendEmailNotification(funder, "approved");
  };

  const rejectOrg = (orgId, orgName, orgEmail) => {
    showToast(`${orgName} has been rejected`);
    const funder = { id: orgId, name: orgName, email: orgEmail };
    sendEmailNotification(funder, "rejected");
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="admin-sidebar-brand">Admin Panel</span>
        </div>

        <nav className="admin-sidebar-nav">
          <Link to="/admin/dashboard" className="admin-nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/organizations" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
              <path d="M9 9v.01" />
              <path d="M9 12v.01" />
              <path d="M9 15v.01" />
              <path d="M9 18v.01" />
            </svg>
            <span>Funders</span>
          </Link>
          <Link to="/admin/users" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Users</span>
          </Link>
          <Link to="/admin/opportunities" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Opportunities</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </Link>
          <button className="admin-nav-item admin-nav-logout" onClick={handleLogout}>
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
      <main className="admin-main">
        <header className="admin-top-bar">
          <div className="admin-top-bar-left">
            <h1>Dashboard</h1>
            <p>Welcome back, Admin</p>
          </div>
          <div className="admin-top-bar-right">
            <button className="admin-btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Export Report
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{mockStats.innovators}</h3>
              <p>Total Innovators</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9v.01" />
                <path d="M9 12v.01" />
                <path d="M9 15v.01" />
                <path d="M9 18v.01" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{mockStats.organizations}</h3>
              <p>Total Organizations</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{mockStats.opportunities}</h3>
              <p>Total Opportunities</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{mockStats.applications}</h3>
              <p>Total Applications</p>
            </div>
          </div>
        </div>

        {/* Pending Organizations */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Pending Funder Registrations</h3>
            <Link to="/admin/organizations">View All</Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Funder</th>
                <th>Type</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPendingOrgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className="admin-user-avatar">
                      <div className="admin-avatar-circle">{org.name.charAt(0)}</div>
                      <div className="admin-user-info">
                        <strong>{org.name}</strong>
                        <span>{org.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="admin-badge admin-badge-pending">{org.type}</span></td>
                  <td>{org.location}</td>
                  <td>{org.submittedDate}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn-sm admin-btn-sm-success" onClick={() => approveOrg(org.id, org.name, org.email)}>Approve</button>
                      <button className="admin-btn-sm admin-btn-sm-danger" onClick={() => rejectOrg(org.id, org.name, org.email)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Activity</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {mockRecentActivity.map((activity, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316" }} />
                  <span style={{ fontSize: "14px", color: "#334155" }}>{activity.text}</span>
                </div>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}