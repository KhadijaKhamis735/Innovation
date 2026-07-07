import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import InnovatorLayout from "../components/InnovatorLayout";
import "./MyApplication.css";

export default function MyApplication() {
  const { user, opportunities } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);

  const myApplications = opportunities.flatMap((opp) =>
    opp.applicants
      .filter((a) => a.innovatorId === user?.id)
      .map((a) => ({ ...a, opportunity: opp.title, org: opp.org, type: opp.type, oppId: opp.id, deadline: opp.deadline }))
  );

  const pendingApplications = myApplications.filter(a =>
    !a.status || a.status === "Under Review" || a.status === "Submitted"
  );

  const pastApplications = myApplications.filter(a =>
    a.status === "Accepted" || a.status === "Rejected" || a.status === "Shortlisted"
  );

  const filterBySearch = (apps) => {
    if (!searchQuery.trim()) return apps;
    const query = searchQuery.toLowerCase();
    return apps.filter(app =>
      app.opportunity?.toLowerCase().includes(query) ||
      app.org?.toLowerCase().includes(query) ||
      app.projectName?.toLowerCase().includes(query) ||
      app.ideaTitle?.toLowerCase().includes(query)
    );
  };

  const displayedApps = filterBySearch(activeTab === "pending" ? pendingApplications : pastApplications);

  const statusConfig = {
    "Under Review": { bg: "#fef3c7", color: "#d97706" },
    "Submitted": { bg: "#e0f2fe", color: "#0284c7" },
    "Accepted": { bg: "#dcfce7", color: "#16a34a" },
    "Rejected": { bg: "#fee2e2", color: "#dc2626" },
    "Shortlisted": { bg: "#f3e8ff", color: "#7c3aed" },
  };

  const typeConfig = {
    "Grant": "#4f46e5",
    "Accelerator": "#7c3aed",
    "Challenge": "#0891b2",
    "Funding": "#ea580c",
  };

  return (
    <InnovatorLayout>
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">Track your funding applications</p>
        </div>
        <div className="top-bar-right">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            </div>
          </div>
        </header>

        <div className="applications-content">
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === "pending" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <span className="tab-label">Pending</span>
              <span className="tab-count">{pendingApplications.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "past" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              <span className="tab-label">Past Results</span>
              <span className="tab-count">{pastApplications.length}</span>
            </button>
          </div>

          {displayedApps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="empty-title">
                {activeTab === "pending" ? "No pending applications" : "No past applications"}
              </h3>
              <p className="empty-desc">
                {activeTab === "pending"
                  ? "Submit applications from the Browse Opportunities page"
                  : "Your application results will appear here"
                }
              </p>
              {activeTab === "pending" && (
                <Link to="/dashboard/innovator/opportunities" className="empty-btn">
                  Browse Opportunities
                </Link>
              )}
            </div>
          ) : (
            <div className="applications-list">
              {displayedApps.map((app, index) => (
                <div key={index} className="application-card">
                  <div className="app-header">
                    <div className="app-org-avatar">
                      {app.org?.charAt(0) || "O"}
                    </div>
                    <div className="app-header-info">
                      <h3 className="app-opportunity">{app.opportunity}</h3>
                      <p className="app-org-name">{app.org}</p>
                    </div>
                    <span
                      className="app-type-badge"
                      style={{
                        background: `${typeConfig[app.type] || "#4f46e5"}15`,
                        color: typeConfig[app.type] || "#4f46e5"
                      }}
                    >
                      {app.type}
                    </span>
                  </div>

                  <div className="app-details">
                    <div className="app-detail-item">
                      <span className="detail-label">Project Submitted</span>
                      <span className="detail-value">{app.projectName || "Not specified"}</span>
                    </div>
                    <div className="app-detail-item">
                      <span className="detail-label">Date Applied</span>
                      <span className="detail-value">{app.date || new Date().toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="app-details">
                    {app.ideaTitle && (
                      <div className="app-detail-item">
                        <span className="detail-label">Idea Title</span>
                        <span className="detail-value">{app.ideaTitle}</span>
                      </div>
                    )}
                    <div className="app-detail-item">
                      <span className="detail-label">Project Submitted</span>
                      <span className="detail-value">{app.projectName || "Not specified"}</span>
                    </div>
                    <div className="app-detail-item">
                      <span className="detail-label">Date Applied</span>
                      <span className="detail-value">{app.date || new Date().toLocaleDateString()}</span>
                    </div>
                    {app.deadline && (
                      <div className="app-detail-item">
                        <span className="detail-label">Application Deadline</span>
                        <span className="detail-value">{new Date(app.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    )}
                  </div>

                  <div className="app-footer">
                    <button
                      className="view-details-btn"
                      onClick={() => setSelectedApp(app)}
                    >
                      View Details
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span
                      className="status-badge"
                      style={{
                        background: statusConfig[app.status]?.bg || "#e0f2fe",
                        color: statusConfig[app.status]?.color || "#0284c7"
                      }}
                    >
                      {app.status || "Under Review"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Application Detail Modal */}
          {selectedApp && (
            <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
              <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-project-info">
                    <h2 className="modal-project-name">{selectedApp.opportunity}</h2>
                    <p className="modal-project-meta">Application for {selectedApp.org}</p>
                  </div>
                  <button className="modal-close-btn" onClick={() => setSelectedApp(null)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="detail-content">
                  <div className="detail-section">
                    <h3 className="detail-section-title">Application Status</h3>
                    <div className="status-info">
                      <span
                        className="status-badge-large"
                        style={{
                          background: statusConfig[selectedApp.status]?.bg || "#e0f2fe",
                          color: statusConfig[selectedApp.status]?.color || "#0284c7"
                        }}
                      >
                        {selectedApp.status || "Under Review"}
                      </span>
                      <span className="date-applied">
                        Applied on {selectedApp.date || new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {selectedApp.ideaTitle && (
                    <>
                      <div className="detail-section">
                        <h3 className="detail-section-title">Idea Details</h3>
                        <div className="idea-details">
                          <div className="idea-field">
                            <label>Idea Title</label>
                            <p>{selectedApp.ideaTitle}</p>
                          </div>
                          {selectedApp.problemStatement && (
                            <div className="idea-field">
                              <label>Problem Statement</label>
                              <p>{selectedApp.problemStatement}</p>
                            </div>
                          )}
                          {selectedApp.proposedSolution && (
                            <div className="idea-field">
                              <label>Proposed Solution</label>
                              <p>{selectedApp.proposedSolution}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="detail-section process-note">
                        <div className="process-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                        </div>
                        <div className="process-text">
                          <h4>What happens next?</h4>
                          <p>Your idea is being reviewed by the organization. Once approved, you will receive a ZSA ID for tracking your project through the innovation phases.</p>
                        </div>
                      </div>
                    </>
                  )}

                  {!selectedApp.ideaTitle && (
                    <div className="detail-section process-note">
                      <div className="process-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </div>
                      <div className="process-text">
                        <h4>Application Under Review</h4>
                        <p>Your application is currently being reviewed by {selectedApp.org}. You will be notified once a decision has been made.</p>
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <h3 className="detail-section-title">Opportunity Information</h3>
                    <div className="opportunity-info">
                      <div className="opp-info-item">
                        <span className="opp-info-label">Type</span>
                        <span className="opp-info-value">{selectedApp.type}</span>
                      </div>
                      {selectedApp.deadline && (
                        <div className="opp-info-item">
                          <span className="opp-info-label">Deadline</span>
                          <span className="opp-info-value">{new Date(selectedApp.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modal-actions">
                    <Link
                      to="/dashboard/innovator/opportunities"
                      className="modal-action-secondary"
                    >
                      Browse Other Opportunities
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </InnovatorLayout>
  );
}