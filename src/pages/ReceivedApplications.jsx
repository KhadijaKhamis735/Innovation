import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./FunderDashboard.css";

// Stage configuration
const defaultStages = [
  { id: "under_review", name: "Under Review", color: "#f59e0b", bg: "#fef3c7" },
  { id: "interview", name: "Interview", color: "#3b82f6", bg: "#dbeafe" },
  { id: "pitch", name: "Pitch", color: "#8b5cf6", bg: "#f3e8ff" },
  { id: "shortlisted", name: "Shortlisted", color: "#7c3aed", bg: "#f3e8ff" },
  { id: "accepted", name: "Accepted", color: "#16a34a", bg: "#dcfce7" },
  { id: "rejected", name: "Rejected", color: "#dc2626", bg: "#fee2e2" },
];

// Default email templates
const defaultEmailTemplates = {
  interview: {
    subject: "Invitation to Interview - {opportunity}",
    body: `Dear {name},

Congratulations! You have been selected for the interview stage for {opportunity}.

Our team was impressed by your application and would like to learn more about your project.

We will be in touch shortly with scheduling details.

Best regards,
{funder} Team`,
  },
  pitch: {
    subject: "Invitation to Pitch - {opportunity}",
    body: `Dear {name},

Great news! You have been invited to the pitch stage for {opportunity}.

This is an exciting opportunity to present your project to our panel of experts.

We will share more details about the pitch format and schedule soon.

Best regards,
{funder} Team`,
  },
  shortlisted: {
    subject: "You've Been Shortlisted - {opportunity}",
    body: `Dear {name},

We are pleased to inform you that your application to {opportunity} has been shortlisted!

This is a significant achievement, and we look forward to learning more about your work.

Best regards,
{funder} Team`,
  },
  accepted: {
    subject: "Congratulations! You've Been Accepted - {opportunity}",
    body: `Dear {name},

We are thrilled to inform you that your application to {opportunity} has been accepted!

Congratulations on this achievement. Our team will be in touch with next steps shortly.

Welcome to the program!

Best regards,
{funder} Team`,
  },
  rejected: {
    subject: "Update on Your Application - {opportunity}",
    body: `Dear {name},

Thank you for your interest in {opportunity} and for taking the time to submit your application.

After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.

We encourage you to apply for future opportunities.

Best regards,
{funder} Team`,
  },
};

// Mock data for demo
const mockApplications = [
  {
    id: 1,
    innovatorId: 1,
    innovatorName: "Alex Johnson",
    innovatorEmail: "alex.j@email.com",
    projectName: "Smart Water Monitor",
    opportunity: "Green Tech Innovation Grant",
    opportunityId: 1,
    motivation: "I am passionate about environmental sustainability and believe this project can make a real impact in rural communities.",
    experience: "5+ years in IoT development, previously built similar monitoring systems.",
    stage: "under_review",
    date: "May 18, 2026",
    tags: ["IoT", "Environment"],
  },
  {
    id: 2,
    innovatorId: 2,
    innovatorName: "Fatima Hassan",
    innovatorEmail: "fatima.h@email.com",
    projectName: "AI Crop Disease Detector",
    opportunity: "Green Tech Innovation Grant",
    opportunityId: 1,
    motivation: "Agriculture is the backbone of our economy. This AI solution can help farmers detect diseases early and increase yield.",
    experience: "MSc in Computer Science, experience with ML models for agriculture.",
    stage: "shortlisted",
    date: "May 16, 2026",
    tags: ["AI", "Agriculture"],
  },
  {
    id: 3,
    innovatorId: 3,
    innovatorName: "James Odhiambo",
    innovatorEmail: "james.o@email.com",
    projectName: "P2P Microfinance",
    opportunity: "Women in STEM Accelerator",
    opportunityId: 2,
    motivation: "I want to bridge the financial gap for women entrepreneurs in underserved areas.",
    experience: "Former fintech developer, MBA in Finance.",
    stage: "rejected",
    date: "May 14, 2026",
    tags: ["FinTech", "Social Impact"],
  },
  {
    id: 4,
    innovatorId: 4,
    innovatorName: "Priya Mwangi",
    innovatorEmail: "priya.m@email.com",
    projectName: "EduBot Platform",
    opportunity: "Women in STEM Accelerator",
    opportunityId: 2,
    motivation: "EdTech is my passion. I believe AI-powered tutoring can democratize education.",
    experience: "Former teacher, self-taught developer, launched MVP last year.",
    stage: "accepted",
    date: "May 12, 2026",
    tags: ["EdTech", "AI"],
  },
  {
    id: 5,
    innovatorId: 5,
    innovatorName: "David Kimani",
    innovatorEmail: "david.k@email.com",
    projectName: "Drone Delivery System",
    opportunity: "Digital Health Hackathon",
    opportunityId: 3,
    motivation: "Medical supply delivery in hard-to-reach areas is critical for healthcare access.",
    experience: "Aerospace engineering background, built drone prototypes.",
    stage: "under_review",
    date: "May 20, 2026",
    tags: ["Drones", "HealthTech"],
  },
  {
    id: 6,
    innovatorId: 6,
    innovatorName: "Sarah Wanjiku",
    innovatorEmail: "sarah.w@email.com",
    projectName: "Solar Food Preserver",
    opportunity: "Green Tech Innovation Grant",
    opportunityId: 1,
    motivation: "Post-harvest losses are a major problem. My solar-powered solution can help reduce food waste.",
    experience: "Mechanical engineer with 8 years in sustainable tech.",
    stage: "interview",
    date: "May 19, 2026",
    tags: ["Solar", "AgriTech"],
  },
  {
    id: 7,
    innovatorId: 7,
    innovatorName: "Michael Otieno",
    innovatorEmail: "michael.o@email.com",
    projectName: "Telehealth Platform",
    opportunity: "Digital Health Hackathon",
    opportunityId: 3,
    motivation: "Healthcare access in rural areas is limited. Telehealth can bridge this gap effectively.",
    experience: "Healthcare IT specialist, built telehealth solutions for NGOs.",
    stage: "pitch",
    date: "May 21, 2026",
    tags: ["Telehealth", "Rural Tech"],
  },
];

const opportunityOptions = ["All", "Green Tech Innovation Grant", "Women in STEM Accelerator", "Digital Health Hackathon"];

export default function ReceivedApplications() {
  const navigate = useNavigate();
  const [filterOpp, setFilterOpp] = useState("All");
  const [filterStage, setFilterStage] = useState("All");
  const [selectedApp, setSelectedApp] = useState(null);
  const [toast, setToast] = useState("");
  const [selectedApps, setSelectedApps] = useState([]);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState(null);
  const [customStages, setCustomStages] = useState(defaultStages);
  const [emailTemplates, setEmailTemplates] = useState(defaultEmailTemplates);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Use mock data for demo
  const applications = mockApplications;

  const filteredApps = applications.filter((a) => {
    const matchesOpp = filterOpp === "All" || a.opportunity === filterOpp;
    const matchesStage = filterStage === "All" || a.stage === filterStage;
    return matchesOpp && matchesStage;
  });

  const stageById = (stageId) => customStages.find(s => s.id === stageId) || defaultStages.find(s => s.id === stageId) || { name: stageId, color: "#64748b", bg: "#f1f5f9" };

  const stats = {
    total: applications.length,
    underReview: applications.filter(a => a.stage === "under_review").length,
    interview: applications.filter(a => a.stage === "interview").length,
    pitch: applications.filter(a => a.stage === "pitch").length,
    shortlisted: applications.filter(a => a.stage === "shortlisted").length,
    accepted: applications.filter(a => a.stage === "accepted").length,
  };

  const toggleSelectApp = (appId) => {
    setSelectedApps(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedApps.length === filteredApps.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filteredApps.map(a => a.id));
    }
  };

  const handleStageChange = (appId, newStage, sendEmail = true) => {
    showToast(`Application moved to ${stageById(newStage).name}${sendEmail ? " - Email sent" : ""}`);
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, stage: newStage });
    }
    setShowStageModal(false);
    setPendingStageChange(null);
  };

  const handleBulkStageChange = (newStage, sendEmail = true) => {
    showToast(`${selectedApps.length} applications moved to ${stageById(newStage).name}${sendEmail ? " - Emails sent" : ""}`);
    setSelectedApps([]);
    setShowStageModal(false);
  };

  const openStageModal = (appId = null, stage = null) => {
    setPendingStageChange({ appId, stage });
    setShowStageModal(true);
  };

  const getStageList = () => {
    return customStages.filter(s => s.id !== "under_review" && s.id !== "accepted" && s.id !== "rejected");
  };

  const getStatusList = () => {
    return customStages.filter(s => s.id === "accepted" || s.id === "rejected");
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
          <Link to="/dashboard/funder/opportunities" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Posters</span>
          </Link>
          <Link to="/dashboard/funder/applications" className="nav-item nav-item-active">
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
            <h1 className="page-title">Applications Received</h1>
            <p className="page-subtitle">{filteredApps.length} application{filteredApps.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-outline" onClick={() => setShowSettingsModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Stage Settings
            </button>
            {selectedApps.length > 0 && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "#64748b" }}>
                  {selectedApps.length} selected
                </span>
                <button className="btn-primary" onClick={() => openStageModal()}>
                  Move to Stage
                </button>
                <button className="btn-outline" onClick={() => setSelectedApps([])}>
                  Clear
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="dashboard-content">
          {/* Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginBottom: "32px" }}>
            <div className="stat-card">
              <div className="stat-icon stat-card-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.total}</p>
                <p className="stat-label">Total</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.underReview}</p>
                <p className="stat-label">Under Review</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.interview}</p>
                <p className="stat-label">Interview</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.pitch}</p>
                <p className="stat-label">Pitch</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#f3e8ff" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.shortlisted}</p>
                <p className="stat-label">Shortlisted</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats.accepted}</p>
                <p className="stat-label">Accepted</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#64748b", alignSelf: "center" }}>Opportunity:</span>
              <div className="filter-bar" style={{ marginBottom: 0 }}>
                {opportunityOptions.map((opp) => (
                  <button
                    key={opp}
                    className={`filter-btn ${filterOpp === opp ? "active" : ""}`}
                    onClick={() => setFilterOpp(opp)}
                  >
                    {opp === "All" ? "All" : opp.length > 20 ? opp.slice(0, 20) + "..." : opp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", color: "#64748b", alignSelf: "center" }}>Stage:</span>
            <div className="filter-bar" style={{ marginBottom: 0 }}>
              {["All", "under_review", "interview", "pitch", "shortlisted", "accepted", "rejected"].map((stage) => (
                <button
                  key={stage}
                  className={`filter-btn ${filterStage === stage ? "active" : ""}`}
                  onClick={() => setFilterStage(stage)}
                  style={filterStage === stage && stage !== "All" ? {
                    background: stageById(stage).bg,
                    color: stageById(stage).color,
                    borderColor: stageById(stage).color
                  } : {}}
                >
                  {stage === "All" ? "All" : stageById(stage).name}
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          {filteredApps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="empty-title">No applications found</h3>
              <p className="empty-desc">Try adjusting your filters or wait for new submissions.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Header Row */}
              <div style={{ display: "flex", alignItems: "center", padding: "12px 24px", background: "#f8fafc", borderRadius: "12px", marginBottom: "4px" }}>
                <input
                  type="checkbox"
                  checked={selectedApps.length === filteredApps.length && filteredApps.length > 0}
                  onChange={toggleSelectAll}
                  style={{ width: "18px", height: "18px", marginRight: "16px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500", flex: 1 }}>Select All</span>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500", width: "120px" }}>Stage</span>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500", width: "180px" }}>Actions</span>
              </div>

              {filteredApps.map((app) => (
                <div key={app.id} className="card" style={{ padding: "0", overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedApps.includes(app.id)}
                        onChange={() => toggleSelectApp(app.id)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: stageById(app.stage).bg,
                          color: stageById(app.stage).color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: "600",
                        }}
                      >
                        {app.innovatorName.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", margin: "0 0 2px" }}>
                          {app.projectName}
                        </h4>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                          by {app.innovatorName} • {app.opportunity}
                        </p>
                      </div>
                    </div>
                    <div style={{ width: "120px", display: "flex", justifyContent: "center" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                          background: stageById(app.stage).bg,
                          color: stageById(app.stage).color,
                        }}
                      >
                        {stageById(app.stage).name}
                      </span>
                    </div>
                    <div style={{ width: "180px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        View
                      </button>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <button
                          className="btn-outline btn-sm"
                          onClick={() => openStageModal(app.id)}
                        >
                          Move
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "4px" }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
                    {selectedApp.projectName}
                  </h2>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    by {selectedApp.innovatorName} • {selectedApp.date}
                  </p>
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
                  onClick={() => setSelectedApp(null)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Stage */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 12px" }}>
                  Current Stage
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "500",
                      background: stageById(selectedApp.stage).bg,
                      color: stageById(selectedApp.stage).color,
                    }}
                  >
                    {stageById(selectedApp.stage).name}
                  </span>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    Applied to: {selectedApp.opportunity}
                  </span>
                </div>
              </div>

              {/* Innovator Info */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 12px" }}>
                  Innovator Information
                </h4>
                <div
                  style={{
                    padding: "16px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: stageById(selectedApp.stage).bg,
                      color: stageById(selectedApp.stage).color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "600",
                    }}
                  >
                    {selectedApp.innovatorName.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: "600", color: "#0f172a", margin: 0 }}>{selectedApp.innovatorName}</p>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{selectedApp.innovatorEmail}</p>
                  </div>
                </div>
              </div>

              {/* Motivation */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 12px" }}>
                  Motivation
                </h4>
                <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.7", margin: 0 }}>
                  {selectedApp.motivation}
                </p>
              </div>

              {/* Experience */}
              {selectedApp.experience && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 12px" }}>
                    Relevant Experience
                  </h4>
                  <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.7", margin: 0 }}>
                    {selectedApp.experience}
                  </p>
                </div>
              )}

              {/* Tags */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 12px" }}>
                  Project Tags
                </h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  {selectedApp.tags.map((tag) => (
                    <span key={tag} className="opp-tag">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                }}
              >
                <button
                  className="btn-outline"
                  style={{ color: "#dc2626", borderColor: "#fecaca", flex: 1 }}
                  onClick={() => handleStageChange(selectedApp.id, "rejected")}
                >
                  Reject
                </button>
                <button
                  className="btn-outline"
                  style={{ color: "#3b82f6", borderColor: "#bfdbfe", flex: 1 }}
                  onClick={() => handleStageChange(selectedApp.id, "interview")}
                >
                  Interview
                </button>
                <button
                  className="btn-outline"
                  style={{ color: "#8b5cf6", borderColor: "#e9d5ff", flex: 1 }}
                  onClick={() => handleStageChange(selectedApp.id, "pitch")}
                >
                  Pitch
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => handleStageChange(selectedApp.id, "accepted")}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Change Modal */}
      {showStageModal && (
        <div className="modal-overlay" onClick={() => { setShowStageModal(false); setPendingStageChange(null); }}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0 }}>
                Move to Stage
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                {pendingStageChange?.appId || selectedApps.length > 0
                  ? `Moving ${pendingStageChange?.appId ? "1 application" : `${selectedApps.length} applications`} to:`
                  : "Select a stage:"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                {customStages.filter(s => s.id !== "under_review").map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => {
                      if (pendingStageChange?.appId) {
                        handleStageChange(pendingStageChange.appId, stage.id);
                      } else {
                        handleBulkStageChange(stage.id);
                      }
                    }}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: stage.bg,
                      border: `2px solid ${stage.color}`
                    }} />
                    <span style={{ fontWeight: "500", color: "#0f172a" }}>{stage.name}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" style={{ marginLeft: "auto" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
                Email notification will be sent automatically to applicant(s)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0 }}>
                  Stage & Email Settings
                </h3>
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
                  onClick={() => setShowSettingsModal(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div style={{ padding: "24px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 16px" }}>
                Email Templates
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(emailTemplates).map(([key, template]) => (
                  <div key={key} style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontWeight: "600", color: "#0f172a", textTransform: "capitalize" }}>{key} Email</span>
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => setEditingTemplate(key)}
                      >
                        Edit
                      </button>
                    </div>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontStyle: "italic" }}>
                      Subject: {template.subject}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="modal-overlay" onClick={() => setEditingTemplate(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0, textTransform: "capitalize" }}>
                Edit {editingTemplate} Email Template
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              <div className="form-group">
                <label className="form-label">Subject Line</label>
                <input
                  className="form-input"
                  value={emailTemplates[editingTemplate].subject}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    [editingTemplate]: { ...emailTemplates[editingTemplate], subject: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Body</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: "200px" }}
                  value={emailTemplates[editingTemplate].body}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    [editingTemplate]: { ...emailTemplates[editingTemplate], body: e.target.value }
                  })}
                />
              </div>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>
                Available variables: {"{name}"}, {"{opportunity}"}, {"{funder}"}
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button className="btn-outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={() => {
                  showToast("Email template saved");
                  setEditingTemplate(null);
                }}>
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}