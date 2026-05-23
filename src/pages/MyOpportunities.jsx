import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./FunderDashboard.css";

const typeConfig = {
  Grant: { bg: "#e0f2fe", color: "#0284c7" },
  Accelerator: { bg: "#f3e8ff", color: "#7c3aed" },
  Challenge: { bg: "#fef3c7", color: "#d97706" },
  Fellowship: { bg: "#dcfce7", color: "#16a34a" },
};

// Mock data for demo (when no backend)
const mockOpportunities = [
  {
    id: 1,
    title: "Green Tech Innovation Grant",
    type: "Grant",
    description: "Supporting innovative solutions for environmental sustainability and climate action.",
    amount: "$25,000",
    deadline: "Jun 30, 2026",
    location: "Remote",
    applicants: 18,
    tags: ["Environment", "Technology", "Sustainability"],
    status: "Open",
  },
  {
    id: 2,
    title: "Women in STEM Accelerator",
    type: "Accelerator",
    description: "A 6-month intensive program supporting women-led tech startups.",
    amount: "Mentorship + $15,000",
    deadline: "Jul 15, 2026",
    location: "Nairobi, Kenya",
    applicants: 34,
    tags: ["Women", "STEM", "Accelerator"],
    status: "Open",
  },
  {
    id: 3,
    title: "Digital Health Hackathon",
    type: "Challenge",
    description: "48-hour hackathon focused on healthcare innovation in developing regions.",
    amount: "$5,000",
    deadline: "May 20, 2026",
    location: "Virtual",
    applicants: 52,
    tags: ["HealthTech", "Hackathon", "Innovation"],
    status: "Closed",
  },
];

export default function MyOpportunities() {
  const { user, opportunities } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [selectedOpp, setSelectedOpp] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Use mock data for demo, later will use: opportunities.filter((o) => o.orgId === user.id)
  const myOpportunities = mockOpportunities;

  const filteredOpps = filter === "All"
    ? myOpportunities
    : myOpportunities.filter(o => o.type === filter);

  const stats = {
    total: myOpportunities.length,
    open: myOpportunities.filter(o => o.status === "Open").length,
    totalApplicants: myOpportunities.reduce((sum, o) => sum + o.applicants, 0),
  };

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
          <Link to="/dashboard/funder/post" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>Post Opportunity</span>
          </Link>
          <Link to="/dashboard/funder/opportunities" className="nav-item nav-item-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Posters</span>
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
            <h1 className="page-title">Posted Opportunities</h1>
            <p className="page-subtitle">{stats.total} opportunities posted</p>
          </div>
          <Link to="/dashboard/funder/post" className="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post New
          </Link>
        </header>

        <div className="dashboard-content">
          {/* Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "32px" }}>
            <div className="stat-card">
              <div className="stat-icon stat-card-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.total}</p>
                <p className="stat-label">Total Opportunities</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.open}</p>
                <p className="stat-label">Currently Open</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.totalApplicants}</p>
                <p className="stat-label">Total Applicants</p>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="filter-bar">
            <button className={`filter-btn ${filter === "All" ? "active" : ""}`} onClick={() => setFilter("All")}>
              All
            </button>
            <button className={`filter-btn ${filter === "Grant" ? "active" : ""}`} onClick={() => setFilter("Grant")}>
              Grants
            </button>
            <button className={`filter-btn ${filter === "Accelerator" ? "active" : ""}`} onClick={() => setFilter("Accelerator")}>
              Accelerators
            </button>
            <button className={`filter-btn ${filter === "Challenge" ? "active" : ""}`} onClick={() => setFilter("Challenge")}>
              Challenges
            </button>
          </div>

          {/* Opportunities Grid */}
          {filteredOpps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="empty-title">No opportunities found</h3>
              <p className="empty-desc">Post your first opportunity to start receiving applications.</p>
              <Link to="/dashboard/funder/post" className="empty-btn">
                Post New Opportunity
              </Link>
            </div>
          ) : (
            <div className="opp-cards-grid">
              {filteredOpps.map((opp) => (
                <div key={opp.id} className="opp-card" onClick={() => setSelectedOpp(opp)}>
                  <div className="opp-card-header">
                    <span
                      className="type-badge"
                      style={{ background: typeConfig[opp.type]?.bg, color: typeConfig[opp.type]?.color }}
                    >
                      {opp.type}
                    </span>
                    <span className={`status-badge ${opp.status === "Open" ? "open" : "closed"}`}>
                      {opp.status}
                    </span>
                  </div>

                  <h3 className="opp-card-title">{opp.title}</h3>
                  <p className="opp-card-desc">{opp.description}</p>

                  <div className="opp-card-meta">
                    {opp.amount && (
                      <div className="opp-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>{opp.amount}</span>
                      </div>
                    )}
                    <div className="opp-meta-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Deadline: {opp.deadline}</span>
                    </div>
                    {opp.location && (
                      <div className="opp-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{opp.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="opp-card-tags">
                    {opp.tags.map((tag) => (
                      <span key={tag} className="opp-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="opp-card-footer">
                    <span className="applicant-count">
                      {opp.applicants} applicant{opp.applicants !== 1 ? "s" : ""} applied
                    </span>
                    <button
                      className="btn-outline btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOpp(opp);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <div className="modal-overlay" onClick={() => setSelectedOpp(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: "24px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  className="type-badge"
                  style={{ background: typeConfig[selectedOpp.type]?.bg, color: typeConfig[selectedOpp.type]?.color }}
                >
                  {selectedOpp.type}
                </span>
                <span className={`status-badge ${selectedOpp.status === "Open" ? "open" : "closed"}`}>
                  {selectedOpp.status}
                </span>
              </div>
              <button
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#f1f5f9",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => setSelectedOpp(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
                {selectedOpp.title}
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px" }}>
                Posted on Innovation Hub
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {selectedOpp.amount && (
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 4px" }}>Award</p>
                    <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>{selectedOpp.amount}</p>
                  </div>
                )}
                <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 4px" }}>Deadline</p>
                  <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>{selectedOpp.deadline}</p>
                </div>
                {selectedOpp.location && (
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 4px" }}>Pitch Location</p>
                    <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>{selectedOpp.location}</p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 8px" }}>Description</h4>
                <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
                  {selectedOpp.description}
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 12px" }}>Tags</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedOpp.tags.map((tag) => (
                    <span key={tag} className="opp-tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 12px" }}>
                  Applicants ({selectedOpp.applicants})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#d97706" }}>AM</div>
                      <div>
                        <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>Amara Mensah</p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Tech Innovator, Ghana</p>
                      </div>
                    </div>
                    <span style={{ padding: "4px 12px", background: "#fef3c7", color: "#d97706", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>Under Review</span>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#7c3aed" }}>KO</div>
                      <div>
                        <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>Kwame Osei</p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Product Designer, Kenya</p>
                      </div>
                    </div>
                    <span style={{ padding: "4px 12px", background: "#f3e8ff", color: "#7c3aed", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>Shortlisted</span>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#3b82f6" }}>LN</div>
                      <div>
                        <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>Lena Nkosi</p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Software Engineer, South Africa</p>
                      </div>
                    </div>
                    <span style={{ padding: "4px 12px", background: "#dbeafe", color: "#3b82f6", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>Interview</span>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#8b5cf6" }}>JM</div>
                      <div>
                        <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>James Mwangi</p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Finance Expert, Uganda</p>
                      </div>
                    </div>
                    <span style={{ padding: "4px 12px", background: "#f3e8ff", color: "#8b5cf6", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>Pitch</span>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#16a34a" }}>AW</div>
                      <div>
                        <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>Amina Wanjiku</p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Marketing Specialist, Tanzania</p>
                      </div>
                    </div>
                    <span style={{ padding: "4px 12px", background: "#dcfce7", color: "#16a34a", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>Accepted</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn-outline" style={{ flex: 1 }}>
                  Edit Opportunity
                </button>
                <button className="btn-outline btn-danger" style={{ flex: 1 }}>
                  Close Opportunity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}