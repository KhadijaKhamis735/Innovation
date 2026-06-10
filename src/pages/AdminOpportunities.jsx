import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const typeConfig = {
  Grant: { bg: "#e0f2fe", color: "#0284c7" },
  Accelerator: { bg: "#f3e8ff", color: "#7c3aed" },
  Challenge: { bg: "#fef3c7", color: "#d97706" },
  Fellowship: { bg: "#dcfce7", color: "#16a34a" },
};

// Mock data with more details
const mockOpportunities = [
  {
    id: 1,
    title: "Green Tech Innovation Grant",
    type: "Grant",
    organization: "Solar Power Initiative",
    email: "contact@solarpower.org",
    amount: "$25,000",
    deadline: "Jun 30, 2026",
    applications: 18,
    status: "open",
    description: "Funding for innovative green technology solutions that address climate change challenges.",
    requirements: ["Must be African-based", "Minimum 3 team members", "Proof of concept required"],
    postedDate: "May 15, 2026"
  },
  {
    id: 2,
    title: "Women in STEM Accelerator",
    type: "Accelerator",
    organization: "Women in Tech Africa",
    email: "info@womenintech.africa",
    amount: "$15,000 + Mentorship",
    deadline: "Jul 15, 2026",
    applications: 34,
    status: "open",
    description: "12-week accelerator program for women-led tech startups in Africa.",
    requirements: ["Women-led team", "Tech-focused solution", "African startup"],
    postedDate: "May 10, 2026"
  },
  {
    id: 3,
    title: "Digital Health Hackathon",
    type: "Challenge",
    organization: "HealthTech Accelerator",
    email: "apply@healthtechacc.ng",
    amount: "$5,000",
    deadline: "May 20, 2026",
    applications: 52,
    status: "closed",
    description: "48-hour hackathon to develop digital health solutions.",
    requirements: ["Open to all", "Team of 2-5", "Prototype submission"],
    postedDate: "Apr 25, 2026"
  },
  {
    id: 4,
    title: "AgriTech Fellowship",
    type: "Fellowship",
    organization: "Green Innovators Hub",
    email: "hello@greeninnovators.org",
    amount: "Stipend + Housing",
    deadline: "Aug 1, 2026",
    applications: 12,
    status: "open",
    description: "6-month fellowship for agricultural technology innovators.",
    requirements: ["Agricultural innovation focus", "African citizen", "Full-time commitment"],
    postedDate: "May 20, 2026"
  },
  {
    id: 5,
    title: "Youth Innovation Challenge",
    type: "Challenge",
    organization: "TechBridge Africa",
    email: "contact@techbridge.africa",
    amount: "$10,000",
    deadline: "Jun 15, 2026",
    applications: 45,
    status: "open",
    description: "Challenge for young innovators aged 18-30 to solve community problems.",
    requirements: ["Age 18-30", "African resident", "Innovative solution"],
    postedDate: "May 5, 2026"
  },
  {
    id: 6,
    title: "EdTech Accelerator Program",
    type: "Accelerator",
    organization: "EduFund Foundation",
    email: "info@edufund.org",
    amount: "$20,000",
    deadline: "Jul 30, 2026",
    applications: 28,
    status: "open",
    description: "3-month intensive accelerator for education technology startups.",
    requirements: ["EdTech focus", "Minimum viable product", "African market focus"],
    postedDate: "May 1, 2026"
  },
];

// Mock applicants data
const mockApplicants = [
  { id: 1, name: "Amara Diallo", email: "amara.d@email.com", stage: "Interview", appliedDate: "May 20, 2026" },
  { id: 2, name: "Kenji Yamamoto", email: "kenji.y@email.com", stage: "Under Review", appliedDate: "May 18, 2026" },
  { id: 3, name: "Fatima Hassan", email: "fatima.h@email.com", stage: "Pitch", appliedDate: "May 15, 2026" },
  { id: 4, name: "James Otieno", email: "james.o@email.com", stage: "Shortlisted", appliedDate: "May 12, 2026" },
  { id: 5, name: "Sarah Wanjiku", email: "sarah.w@email.com", stage: "Accepted", appliedDate: "May 10, 2026" },
];

const stageConfig = {
  "Under Review": { bg: "#fef3c7", color: "#d97706" },
  "Interview": { bg: "#dbeafe", color: "#2563eb" },
  "Pitch": { bg: "#f3e8ff", color: "#7c3aed" },
  "Shortlisted": { bg: "#fce7f3", color: "#db2777" },
  "Accepted": { bg: "#dcfce7", color: "#16a34a" },
  "Rejected": { bg: "#fee2e2", color: "#dc2626" },
};

export default function AdminOpportunities() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filteredOpps = mockOpportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(search.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || opp.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: mockOpportunities.length,
    open: mockOpportunities.filter(o => o.status === "open").length,
    closed: mockOpportunities.filter(o => o.status === "closed").length,
    totalApplications: mockOpportunities.reduce((sum, o) => sum + o.applications, 0),
  };

  const viewDetails = (opp) => {
    setSelectedOpp(opp);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedOpp(null);
  };

  const toggleStatus = (opp) => {
    showToast(`${opp.title} has been ${opp.status === "open" ? "closed" : "reopened"}`);
  };

  const deleteOpportunity = (opp) => {
    showToast(`${opp.title} has been deleted`);
    closeModal();
  };

  const sendEmailNotification = (opp, type) => {
    const subject = type === "closed"
      ? `Update: ${opp.title} has been Closed`
      : `Important Update: ${opp.title}`;
    showToast(`Email notification queued for ${opp.applications} applicants`);
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
          <Link to="/admin/organizations" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
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
          <Link to="/admin/opportunities" className="admin-nav-item active">
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
            <h1>Opportunities</h1>
            <p>Manage all posted opportunities</p>
          </div>
        </header>

        {/* Stats */}
        <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.total}</h3>
              <p>Total Opportunities</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.open}</h3>
              <p>Open</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#f1f5f9", color: "#64748b" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.closed}</h3>
              <p>Closed</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.totalApplications}</h3>
              <p>Total Applications</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filter-bar">
          <button className={`admin-filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          <button className={`admin-filter-btn ${filter === "open" ? "active" : ""}`} onClick={() => setFilter("open")}>Open</button>
          <button className={`admin-filter-btn ${filter === "closed" ? "active" : ""}`} onClick={() => setFilter("closed")}>Closed</button>
        </div>

        {/* Search */}
        <div className="admin-search">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by title or funder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {filteredOpps.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>No opportunities found</h3>
              <p>Try adjusting your search</p>
            </div>
          </div>
        ) : (
          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Type</th>
                  <th>Funder</th>
                  <th>Award</th>
                  <th>Applications</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpps.map((opp) => (
                  <tr key={opp.id}>
                    <td>
                      <strong style={{ color: "#0f172a" }}>{opp.title}</strong>
                    </td>
                    <td>
                      <span className="admin-badge" style={{ background: typeConfig[opp.type]?.bg, color: typeConfig[opp.type]?.color }}>
                        {opp.type}
                      </span>
                    </td>
                    <td>{opp.organization}</td>
                    <td>{opp.amount}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "600", color: "#7c3aed" }}>
                          {opp.applications}
                        </div>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>apps</span>
                      </div>
                    </td>
                    <td>{opp.deadline}</td>
                    <td>
                      <span className={`admin-badge admin-badge-${opp.status === "open" ? "approved" : "rejected"}`}>
                        {opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn-sm" onClick={() => viewDetails(opp)}>View</button>
                        <button
                          className="admin-btn-sm"
                          style={{ background: opp.status === "open" ? "#fef3c7" : "#dcfce7", color: opp.status === "open" ? "#d97706" : "#16a34a" }}
                          onClick={() => toggleStatus(opp)}
                        >
                          {opp.status === "open" ? "Close" : "Reopen"}
                        </button>
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

      {/* Detail Modal */}
      {showDetailModal && selectedOpp && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div className="admin-modal-header">
              <h2>{selectedOpp.title}</h2>
              <button className="admin-modal-close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Opportunity Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Funder</p>
                  <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedOpp.organization}</p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Type</p>
                  <span className="admin-badge" style={{ background: typeConfig[selectedOpp.type]?.bg, color: typeConfig[selectedOpp.type]?.color }}>
                    {selectedOpp.type}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Award Amount</p>
                  <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedOpp.amount}</p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Deadline</p>
                  <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedOpp.deadline}</p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Posted Date</p>
                  <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedOpp.postedDate}</p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Status</p>
                  <span className={`admin-badge admin-badge-${selectedOpp.status === "open" ? "approved" : "rejected"}`}>
                    {selectedOpp.status.charAt(0).toUpperCase() + selectedOpp.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Description</p>
                <p style={{ color: "#334155", lineHeight: "1.6" }}>{selectedOpp.description}</p>
              </div>

              {/* Requirements */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Requirements</p>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#334155" }}>
                  {selectedOpp.requirements.map((req, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{req}</li>
                  ))}
                </ul>
              </div>

              {/* Applicants Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0 }}>
                    Applicants ({selectedOpp.applications})
                  </h3>
                  <button
                    className="admin-btn-sm admin-btn-sm-success"
                    style={{ padding: "8px 12px", fontSize: "12px" }}
                    onClick={() => sendEmailNotification(selectedOpp, "all")}
                  >
                    Notify All
                  </button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Applied Date</th>
                      <th>Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockApplicants.map((applicant) => (
                      <tr key={applicant.id}>
                        <td>
                          <div className="admin-user-avatar">
                            <div className="admin-avatar-circle">{applicant.name.charAt(0)}</div>
                            <div className="admin-user-info">
                              <strong>{applicant.name}</strong>
                              <span>{applicant.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{applicant.appliedDate}</td>
                        <td>
                          <span className="admin-badge" style={{ background: stageConfig[applicant.stage]?.bg, color: stageConfig[applicant.stage]?.color }}>
                            {applicant.stage}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                className="admin-btn-sm admin-btn-sm-danger"
                onClick={() => deleteOpportunity(selectedOpp)}
              >
                Delete Opportunity
              </button>
              <button className="admin-btn-sm" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}