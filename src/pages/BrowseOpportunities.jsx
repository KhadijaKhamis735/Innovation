import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./BrowseOpportunities.css";

const mockOpportunities = [
  {
    id: 1,
    title: "Climate Tech Innovation Fund",
    organization: "Zanzibar Green Initiative",
    type: "Grant",
    category: "Environment",
    fundingAmount: 50000,
    deadline: "2026-06-15",
    eligibility: "Early-stage startups focused on renewable energy and environmental sustainability",
    description: "Supporting innovative solutions to climate challenges in East Africa. We fund projects that demonstrate clear environmental impact and scalability.",
    requirements: [
      "Registered business entity in Zanzibar",
      "Proof of concept or MVP",
      "Environmental impact assessment",
      "Team of at least 2 members"
    ],
    status: "Open"
  },
  {
    id: 2,
    title: "Women Entrepreneur Accelerator",
    organization: "SheForward Foundation",
    type: "Equity Funding",
    category: "Social Impact",
    fundingAmount: 25000,
    deadline: "2026-06-30",
    eligibility: "Female-led startups in any sector with potential for growth",
    description: "Accelerator program providing funding and mentorship to women entrepreneurs building sustainable businesses.",
    requirements: [
      "Female founder or co-founder",
      "Business registration",
      "Revenue traction (minimum $1,000/month)",
      "Scalable business model"
    ],
    status: "Open"
  },
  {
    id: 3,
    title: "AgriTech Development Grant",
    organization: "Ministry of Agriculture Zanzibar",
    type: "Grant",
    category: "Agriculture",
    fundingAmount: 30000,
    deadline: "2026-07-20",
    eligibility: "Innovators developing technology solutions for agricultural challenges",
    description: "Government-backed program supporting technological innovation in agriculture to improve food security and farmer livelihoods.",
    requirements: [
      "Project focused on agriculture sector",
      "Technology-driven solution",
      "Impact on local farmers",
      "Implementation plan"
    ],
    status: "Open"
  },
  {
    id: 4,
    title: "Digital Transformation Fund",
    organization: "TechHub Zanzibar",
    type: "Seed Funding",
    category: "Technology",
    fundingAmount: 40000,
    deadline: "2026-08-10",
    eligibility: "Startups leveraging technology to solve local challenges",
    description: "Supporting digital innovation that addresses community needs and contributes to Zanzibar's digital economy development.",
    requirements: [
      "Technology-based solution",
      "Clear problem statement",
      "Market validation",
      "Technical team"
    ],
    status: "Open"
  },
  {
    id: 5,
    title: "Blue Economy Innovation",
    organization: "Ocean Conservancy Zanzibar",
    type: "Grant",
    category: "Marine",
    fundingAmount: 60000,
    deadline: "2026-07-05",
    eligibility: "Projects focusing on marine conservation and sustainable ocean economy",
    description: "Protecting marine ecosystems while promoting sustainable economic opportunities in the blue economy sector.",
    requirements: [
      "Marine/ocean-related project",
      "Sustainability focus",
      "Community engagement plan",
      "Environmental compliance"
    ],
    status: "Open"
  },
  {
    id: 6,
    title: "Healthcare Innovation Challenge",
    organization: "Zanzibar Health Initiative",
    type: "Prize",
    category: "Healthcare",
    fundingAmount: 35000,
    deadline: "2026-06-25",
    eligibility: "Innovators improving healthcare access and delivery",
    description: "Competition rewarding innovative solutions that enhance healthcare delivery and accessibility in underserved communities.",
    requirements: [
      "Healthcare-focused innovation",
      "Scalability potential",
      "Alignment with local health priorities",
      "Pilot implementation ready"
    ],
    status: "Closing Soon"
  }
];

const categoryColors = {
  Environment: "#10b981",
  "Social Impact": "#8b5cf6",
  Agriculture: "#f59e0b",
  Technology: "#3b82f6",
  Marine: "#06b6d4",
  Healthcare: "#ef4444"
};

export default function BrowseOpportunities() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const [activeTab, setActiveTab] = useState("all");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOpportunities = mockOpportunities.filter((opp) => {
    const matchesTab = activeTab === "all" || activeTab === opp.status.toLowerCase().replace(" ", "-");
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const openCount = mockOpportunities.filter((o) => o.status === "Open").length;
  const closingSoonCount = mockOpportunities.filter((o) => o.status === "Closing Soon").length;

  const handleApply = () => {
    setShowApplyModal(true);
  };

  const submitApplication = () => {
    setApplicationSubmitted(true);
    setTimeout(() => {
      setShowApplyModal(false);
      setSelectedOpportunity(null);
      setApplicationSubmitted(false);
    }, 2000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <Link to="/dashboard/innovator" className="nav-item">
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
          <Link to="/dashboard/innovator/opportunities" className="nav-item nav-item-active">
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
            <h1 className="page-title">Browse Opportunities</h1>
            <p className="page-subtitle">Discover funding opportunities from organizations</p>
          </div>
        </header>

        <div className="opportunities-content">
          <div className="search-filter-bar">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{openCount}</span>
                <span className="stat-label">Open Opportunities</span>
              </div>
            </div>
            <div className="stat-card stat-card-warning">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{closingSoonCount}</span>
                <span className="stat-label">Closing Soon</span>
              </div>
            </div>
          </div>

          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === "open" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("open")}
            >
              Open <span className="tab-count">{openCount}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "closing-soon" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("closing-soon")}
            >
              Closing Soon <span className="tab-count">{closingSoonCount}</span>
            </button>
            <button
              className={`view-all-btn ${activeTab === "all" ? "view-all-active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              View All ({mockOpportunities.length})
            </button>
          </div>

          <div className="opportunities-grid">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="opportunity-card"
                onClick={() => setSelectedOpportunity(opp)}
              >
                <div className="opp-header">
                  <div className="opp-category" style={{ background: `${categoryColors[opp.category]}20`, color: categoryColors[opp.category] }}>
                    {opp.category}
                  </div>
                  <div className={`opp-status ${opp.status === "Closing Soon" ? "status-urgent" : ""}`}>
                    {opp.status}
                  </div>
                </div>

                <h3 className="opp-title">{opp.title}</h3>
                <p className="opp-org">{opp.organization}</p>

                <div className="opp-funding">
                  <span className="funding-amount">{formatCurrency(opp.fundingAmount)}</span>
                  <span className="funding-label">{opp.type}</span>
                </div>

                <div className="opp-meta">
                  <div className="opp-meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className={getDaysRemaining(opp.deadline) <= 14 ? "deadline-urgent" : ""}>
                      {getDaysRemaining(opp.deadline)} days left
                    </span>
                  </div>
                </div>

                <div className="opp-footer">
                  <button className="opp-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedOpportunity(opp); }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredOpportunities.length === 0 && (
            <div className="empty-state">
              <h3>No opportunities found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      {selectedOpportunity && (
        <div className="modal-overlay" onClick={() => setSelectedOpportunity(null)}>
          <div className="opp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="opp-category" style={{ background: `${categoryColors[selectedOpportunity.category]}20`, color: categoryColors[selectedOpportunity.category], marginBottom: "8px", display: "inline-block" }}>
                  {selectedOpportunity.category}
                </div>
                <h2>{selectedOpportunity.title}</h2>
                <p>{selectedOpportunity.organization}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOpportunity(null)}>×</button>
            </div>

            <div className="modal-funding-highlight">
              <span className="funding-highlight-amount">{formatCurrency(selectedOpportunity.fundingAmount)}</span>
              <span className="funding-highlight-type">{selectedOpportunity.type}</span>
              <span>Deadline: {formatDate(selectedOpportunity.deadline)}</span>
            </div>

            <div className="modal-body">
              <h3>About This Opportunity</h3>
              <p>{selectedOpportunity.description}</p>

              <h3>Eligibility</h3>
              <p>{selectedOpportunity.eligibility}</p>

              <h3>Requirements</h3>
              <ul>
                {selectedOpportunity.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedOpportunity(null)}>Close</button>
              <button className="modal-apply-btn" onClick={handleApply}>Apply Now</button>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && (
        <div className="modal-overlay">
          <div className="apply-modal">
            {applicationSubmitted ? (
              <div className="apply-success">
                <h3>Application Submitted!</h3>
                <p>You can track its status in "My Applications".</p>
              </div>
            ) : (
              <>
                <h3>Apply for {selectedOpportunity?.title}</h3>
                <div className="apply-form">
                  <div className="form-group">
                    <label>Idea Title *</label>
                    <input type="text" className="form-input" placeholder="Give your idea a clear title..." />
                  </div>
                  <div className="form-group">
                    <label>Problem Statement *</label>
                    <textarea className="form-input" rows="3" placeholder="What problem are you solving?"></textarea>
                  </div>
                  <div className="form-group">
                    <label>Proposed Solution *</label>
                    <textarea className="form-input" rows="3" placeholder="How does your idea solve this problem?"></textarea>
                  </div>
                  <div className="form-group">
                    <label>Estimated Budget (USD)</label>
                    <input type="number" className="form-input" placeholder="How much funding do you need?" />
                  </div>
                </div>
                <div className="apply-modal-footer">
                  <button onClick={() => setShowApplyModal(false)}>Cancel</button>
                  <button className="apply-submit-btn" onClick={submitApplication}>Submit</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}