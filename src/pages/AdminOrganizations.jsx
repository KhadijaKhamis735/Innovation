import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminPanel.css";

// Mock data
const mockOrganizations = [
  { id: 1, name: "TechBridge Africa", email: "contact@techbridge.africa", location: "Lagos, Nigeria", type: "Government Agency", status: "pending", submittedDate: "May 22, 2026" },
  { id: 2, name: "Green Innovators Hub", email: "hello@greeninnovators.org", location: "Nairobi, Kenya", type: "Non-Profit", status: "pending", submittedDate: "May 21, 2026" },
  { id: 3, name: "Women in Tech Africa", email: "info@womenintech.africa", location: "Accra, Ghana", type: "NGO", status: "pending", submittedDate: "May 20, 2026" },
  { id: 4, name: "Solar Power Initiative", email: "contact@solarpower.org", location: "Johannesburg, SA", type: "Grant Maker", status: "approved", submittedDate: "May 15, 2026" },
  { id: 5, name: "HealthTech Accelerator", email: "apply@healthtechacc.ng", location: "Lagos, Nigeria", type: "Accelerator", status: "approved", submittedDate: "May 10, 2026" },
  { id: 6, name: "EduFund Foundation", email: "info@edufund.org", location: "Nairobi, Kenya", type: "Foundation", status: "approved", submittedDate: "May 5, 2026" },
  { id: 7, name: "Fake Organization", email: "fake@spam.com", location: "Unknown", type: "Unknown", status: "rejected", submittedDate: "May 1, 2026" },
];

export default function AdminOrganizations() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [emailNotification, setEmailNotification] = useState(null);

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

    setEmailNotification({ to: funder.email, subject, body });
    showToast(`Email notification queued for ${funder.name}`);
    setTimeout(() => setEmailNotification(null), 5000);
  };

  const filteredOrgs = mockOrganizations.filter(org => {
    const matchesFilter = filter === "all" || org.status === filter;
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
                         org.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    pending: mockOrganizations.filter(o => o.status === "pending").length,
    approved: mockOrganizations.filter(o => o.status === "approved").length,
    rejected: mockOrganizations.filter(o => o.status === "rejected").length,
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
          <Link to="/admin/dashboard" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/organizations" className="admin-nav-item active">
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
            <h1>Funders</h1>
            <p>Manage funder registrations</p>
          </div>
        </header>

        {/* Stats */}
        <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="admin-stat-card">
            <div className="admin-stat-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.pending}</h3>
              <p>Pending Approval</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.approved}</h3>
              <p>Approved</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.rejected}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filter-bar">
          <button className={`admin-filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          <button className={`admin-filter-btn ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>Pending</button>
          <button className={`admin-filter-btn ${filter === "approved" ? "active" : ""}`} onClick={() => setFilter("approved")}>Approved</button>
          <button className={`admin-filter-btn ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>Rejected</button>
        </div>

        {/* Search */}
        <div className="admin-search">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {filteredOrgs.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                </svg>
              </div>
              <h3>No funders found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Funder</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => (
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
                    <td>{org.type}</td>
                    <td>{org.location}</td>
                    <td>
                      <span className={`admin-badge admin-badge-${org.status}`}>
                        {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                      </span>
                    </td>
                    <td>{org.submittedDate}</td>
                    <td>
                      <div className="admin-actions">
                        {org.status === "pending" && (
                          <>
                            <button className="admin-btn-sm admin-btn-sm-success" onClick={() => approveOrg(org.id, org.name, org.email)}>Approve</button>
                            <button className="admin-btn-sm admin-btn-sm-danger" onClick={() => rejectOrg(org.id, org.name, org.email)}>Reject</button>
                          </>
                        )}
                        {org.status === "approved" && (
                          <button className="admin-btn-sm admin-btn-sm-danger" onClick={() => rejectOrg(org.id, org.name, org.email)}>Revoke</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}