import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./OrganizationDashboard.css";

const phases = [
  { id: "idea", label: "Idea", color: "#0284c7" },
  { id: "proposal", label: "Proposal", color: "#d97706" },
  { id: "prototype", label: "Prototype", color: "#7c3aed" },
  { id: "mvp", label: "MVP", color: "#16a34a" },
  { id: "scaling", label: "Scaling", color: "#ea580c" },
];

const innovatorProjects = [
  {
    id: 1,
    name: "Smart Water Monitor",
    innovator: "Alex Johnson",
    category: "IoT / Environment",
    phase: "prototype",
    progress: 60,
    completedMilestones: ["idea-1", "idea-2", "idea-3", "proposal-1", "proposal-2", "proposal-3", "prototype-1"],
    description: "IoT-based water quality monitoring system for rural communities.",
    date: "Mar 2025",
  },
  {
    id: 2,
    name: "AI Crop Disease Detector",
    innovator: "Fatima Hassan",
    category: "AgriTech",
    phase: "proposal",
    progress: 40,
    completedMilestones: ["idea-1", "idea-2", "idea-3"],
    description: "Machine learning model to detect crop diseases from smartphone photos.",
    date: "Jan 2025",
  },
  {
    id: 3,
    name: "Health Tracking App",
    innovator: "Priya Mwangi",
    category: "HealthTech",
    phase: "mvp",
    progress: 80,
    completedMilestones: ["idea-1", "idea-2", "idea-3", "proposal-1", "proposal-2", "proposal-3", "prototype-1", "prototype-2", "prototype-3", "mvp-1", "mvp-2"],
    description: "Mobile app for personal health monitoring.",
    date: "Feb 2026",
  },
  {
    id: 4,
    name: "E-Commerce Platform",
    innovator: "James Odhiambo",
    category: "FinTech",
    phase: "idea",
    progress: 20,
    completedMilestones: ["idea-1"],
    description: "Peer-to-peer marketplace for local artisans.",
    date: "May 2026",
  },
];

const opportunities = [
  { title: "Green Tech Innovation Grant", deadline: "Jun 30, 2026", applicants: 18, status: "Open", type: "Grant" },
  { title: "Women in STEM Accelerator", deadline: "Jul 15, 2026", applicants: 34, status: "Open", type: "Accelerator" },
  { title: "Digital Health Hackathon", deadline: "May 20, 2026", applicants: 52, status: "Closed", type: "Hackathon" },
];

const applications = [
  { project: "Smart Water Monitor", innovator: "Alex Johnson", status: "Under Review", date: "May 18, 2026" },
  { project: "AI Crop Detector", innovator: "Fatima Hassan", status: "Shortlisted", date: "May 16, 2026" },
  { project: "P2P Microfinance", innovator: "James Odhiambo", status: "Rejected", date: "May 14, 2026" },
  { project: "EduBot Platform", innovator: "Priya Mwangi", status: "Accepted", date: "May 12, 2026" },
];

const statusConfig = {
  "Under Review": { bg: "#fef3c7", color: "#d97706" },
  "Shortlisted": { bg: "#f3e8ff", color: "#7c3aed" },
  "Accepted": { bg: "#dcfce7", color: "#16a34a" },
  "Rejected": { bg: "#fee2e2", color: "#dc2626" },
  "Open": { bg: "#dcfce7", color: "#16a34a" },
  "Closed": { bg: "#f1f5f9", color: "#64748b" },
};

const typeConfig = {
  "Grant": { bg: "#e0f2fe", color: "#0284c7" },
  "Accelerator": { bg: "#f3e8ff", color: "#7c3aed" },
  "Hackathon": { bg: "#ffedd5", color: "#ea580c" },
};

const phaseColors = {
  idea: { bg: "#e0f2fe", color: "#0284c7" },
  proposal: { bg: "#fef3c7", color: "#d97706" },
  prototype: { bg: "#f3e8ff", color: "#7c3aed" },
  mvp: { bg: "#dcfce7", color: "#16a34a" },
  scaling: { bg: "#ffedd5", color: "#ea580c" },
};

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [activeTab, setActiveTab] = useState("opportunities");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const viewProjectDetails = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
          <Link to="/dashboard/funder" className="nav-item nav-item-active">
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
            <span>My Opportunities</span>
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

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">Organization Dashboard</h1>
            <p className="page-subtitle">Manage opportunities and review applications</p>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-card-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">3</p>
                <p className="stat-label">Active Opportunities</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">104</p>
                <p className="stat-label">Total Applications</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">12</p>
                <p className="stat-label">Under Review</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-card-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">8</p>
                <p className="stat-label">Funded Projects</p>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Funded Projects</h3>
              </div>
              <div className="projects-list">
                {innovatorProjects.map((project) => (
                  <div key={project.id} className="project-item" onClick={() => viewProjectDetails(project)}>
                    <div className="project-header">
                      <h4 className="project-name">{project.name}</h4>
                      <span
                        className="phase-badge"
                        style={{ background: phaseColors[project.phase]?.bg, color: phaseColors[project.phase]?.color }}
                      >
                        {project.phase.charAt(0).toUpperCase() + project.phase.slice(1)}
                      </span>
                    </div>
                    <p className="project-innovator">{project.innovator} • {project.category}</p>
                    <div className="project-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <span className="progress-text">{project.progress}%</span>
                    </div>
                    <div className="phase-timeline">
                      {phases.map((phase, index) => (
                        <div
                          key={phase.id}
                          className={`timeline-phase ${project.completedMilestones.some(m => m.startsWith(phase.id)) ? 'completed' : ''}`}
                          style={{ opacity: project.completedMilestones.some(m => m.startsWith(phase.id)) ? 1 : 0.3 }}
                        >
                          <div className="phase-dot" style={{ background: phase.color }}></div>
                          <span className="phase-label">{phase.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Applications</h3>
                <Link to="/dashboard/funder/applications" className="card-link">View All</Link>
              </div>
              <div className="applications-list">
                {applications.map((app, index) => (
                  <div key={index} className="application-item">
                    <div className="application-info">
                      <p className="application-title">{app.project}</p>
                      <p className="application-org">{app.innovator}</p>
                      <p className="application-date">{app.date}</p>
                    </div>
                    <span
                      className="status-badge"
                      style={{ background: statusConfig[app.status]?.bg, color: statusConfig[app.status]?.color }}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showProjectModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProject.name}</h2>
              <button className="modal-close" onClick={() => setShowProjectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>Innovator</h4>
                <p>{selectedProject.innovator}</p>
              </div>
              <div className="modal-section">
                <h4>Category</h4>
                <p>{selectedProject.category}</p>
              </div>
              <div className="modal-section">
                <h4>Phase</h4>
                <span
                  className="phase-badge"
                  style={{ background: phaseColors[selectedProject.phase]?.bg, color: phaseColors[selectedProject.phase]?.color }}
                >
                  {selectedProject.phase.charAt(0).toUpperCase() + selectedProject.phase.slice(1)}
                </span>
              </div>
              <div className="modal-section">
                <h4>Description</h4>
                <p>{selectedProject.description}</p>
              </div>
              <div className="modal-section">
                <h4>Progress</h4>
                <div className="modal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${selectedProject.progress}%` }}></div>
                  </div>
                  <span>{selectedProject.progress}%</span>
                </div>
              </div>
              <div className="modal-section">
                <h4>Completed Milestones</h4>
                <div className="milestones-list">
                  {selectedProject.completedMilestones.map((milestone) => (
                    <span key={milestone} className="milestone-tag">
                      {milestone.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}