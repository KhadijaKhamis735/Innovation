import { useState } from "react";
import InnovatorLayout from "../components/InnovatorLayout";
import "./MyProjects.css";

const phases = [
  { id: "idea", label: "Idea", desc: "Concept development" },
  { id: "proposal", label: "Proposal", desc: "Planning & pitching" },
  { id: "prototype", label: "Prototype", desc: "Building & testing" },
  { id: "mvp", label: "MVP", desc: "Minimum viable product" },
  { id: "scaling", label: "Scaling", desc: "Growth & expansion" },
];

const milestones = {
  idea: [
    { id: "idea-1", label: "Problem statement", desc: "Define the problem you're solving" },
    { id: "idea-2", label: "Initial concept", desc: "Describe your core idea" },
    { id: "idea-3", label: "Target audience", desc: "Identify your target users" },
  ],
  proposal: [
    { id: "proposal-1", label: "Business plan", desc: "Create a detailed business plan" },
    { id: "proposal-2", label: "Budget outline", desc: "Define your budget and funding needs" },
    { id: "proposal-3", label: "Team composition", desc: "List your team members and roles" },
  ],
  prototype: [
    { id: "prototype-1", label: "Working prototype", desc: "Build a functional prototype" },
    { id: "prototype-2", label: "Testing results", desc: "Document testing outcomes" },
    { id: "prototype-3", label: "User feedback", desc: "Collect feedback from users" },
  ],
  mvp: [
    { id: "mvp-1", label: "Core features ready", desc: "Implement essential features" },
    { id: "mvp-2", label: "Beta testing complete", desc: "Run beta testing phase" },
    { id: "mvp-3", label: "Market validation", desc: "Validate market demand" },
  ],
  scaling: [
    { id: "scaling-1", label: "Revenue model", desc: "Define your revenue strategy" },
    { id: "scaling-2", label: "Growth strategy", desc: "Plan your growth path" },
    { id: "scaling-3", label: "Team expansion", desc: "Expand your team capacity" },
  ],
};

const phaseColors = {
  idea: { bg: "#e0f2fe", color: "#0284c7" },
  proposal: { bg: "#fef3c7", color: "#d97706" },
  prototype: { bg: "#f3e8ff", color: "#7c3aed" },
  mvp: { bg: "#dcfce7", color: "#16a34a" },
  scaling: { bg: "#ffedd5", color: "#ea580c" },
};

const initialProjects = [
  {
    id: 1,
    zsaId: "ZSA-INV-2025-001",
    name: "Smart Water Monitor",
    category: "IoT / Environment",
    phase: "prototype",
    date: "Mar 2025",
    description: "IoT-based water quality monitoring system for rural communities.",
    completedMilestones: ["idea-1", "idea-2", "idea-3", "proposal-1", "proposal-2", "proposal-3", "prototype-1"],
    milestoneDates: {
      "idea-1": "2025-03-15", "idea-2": "2025-03-18", "idea-3": "2025-03-22",
      "proposal-1": "2025-04-01", "proposal-2": "2025-04-05", "proposal-3": "2025-04-10",
      "prototype-1": "2025-04-20",
    },
  },
  {
    id: 2,
    zsaId: "ZSA-INV-2025-002",
    name: "AI Crop Disease Detector",
    category: "AgriTech",
    phase: "proposal",
    date: "Jan 2025",
    description: "Machine learning model to detect crop diseases from smartphone photos.",
    completedMilestones: ["idea-1", "idea-2", "idea-3"],
    milestoneDates: {
      "idea-1": "2025-01-10", "idea-2": "2025-01-15", "idea-3": "2025-01-20",
    },
  },
  {
    id: 3,
    zsaId: "ZSA-INV-2026-001",
    name: "E-Commerce Platform",
    category: "FinTech",
    phase: "idea",
    date: "May 2026",
    description: "Peer-to-peer marketplace for local artisans.",
    completedMilestones: ["idea-1"],
    milestoneDates: { "idea-1": "2026-05-10" },
  },
  {
    id: 4,
    zsaId: "ZSA-INV-2026-002",
    name: "Health Tracking App",
    category: "HealthTech",
    phase: "mvp",
    date: "Feb 2026",
    description: "Mobile app for personal health monitoring.",
    completedMilestones: ["idea-1", "idea-2", "idea-3", "proposal-1", "proposal-2", "proposal-3", "prototype-1", "prototype-2", "prototype-3", "mvp-1", "mvp-2"],
    milestoneDates: {
      "idea-1": "2026-02-01", "idea-2": "2026-02-03", "idea-3": "2026-02-05",
      "proposal-1": "2026-02-10", "proposal-2": "2026-02-12", "proposal-3": "2026-02-15",
      "prototype-1": "2026-03-01", "prototype-2": "2026-03-10", "prototype-3": "2026-03-15",
      "mvp-1": "2026-04-01", "mvp-2": "2026-04-15",
    },
  },
];

function getPhaseProgress(project, phaseId) {
  const phaseMilestones = milestones[phaseId] || [];
  if (phaseMilestones.length === 0) return 0;
  const completed = phaseMilestones.filter(m => project.completedMilestones.includes(m.id)).length;
  return Math.round((completed / phaseMilestones.length) * 100);
}

function getCurrentPhaseProgress(project) {
  return getPhaseProgress(project, project.phase);
}

function canAdvancePhase(project) {
  return getCurrentPhaseProgress(project) === 100;
}

function getNextPhase(currentPhase) {
  const currentIndex = phases.findIndex(p => p.id === currentPhase);
  return currentIndex < phases.length - 1 ? phases[currentIndex + 1] : null;
}

export default function MyProjects() {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleMilestoneToggle = (projectId, milestoneId) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const isCompleted = p.completedMilestones.includes(milestoneId);
      const newCompleted = isCompleted
        ? p.completedMilestones.filter(id => id !== milestoneId)
        : [...p.completedMilestones, milestoneId];
      return {
        ...p,
        completedMilestones: newCompleted,
        milestoneDates: {
          ...p.milestoneDates,
          [milestoneId]: isCompleted ? p.milestoneDates[milestoneId] : new Date().toISOString().split("T")[0],
        },
      };
    }));
    if (selectedProject) {
      setSelectedProject(prev => {
        const isCompleted = prev.completedMilestones.includes(milestoneId);
        const newCompleted = isCompleted
          ? prev.completedMilestones.filter(id => id !== milestoneId)
          : [...prev.completedMilestones, milestoneId];
        return {
          ...prev,
          completedMilestones: newCompleted,
          milestoneDates: {
            ...prev.milestoneDates,
            [milestoneId]: isCompleted ? prev.milestoneDates[milestoneId] : new Date().toISOString().split("T")[0],
          },
        };
      });
    }
  };

  const handleAdvancePhase = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    const nextPhase = getNextPhase(project.phase);
    if (nextPhase) {
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, phase: nextPhase.id } : p
      ));
      if (selectedProject?.id === projectId) {
        setSelectedProject(prev => ({ ...prev, phase: nextPhase.id }));
      }
    }
  };

  const getTotalProgress = (project) => {
    let completed = 0;
    let total = 0;
    phases.forEach(phase => {
      const phaseMilestones = milestones[phase.id] || [];
      total += phaseMilestones.length;
      completed += phaseMilestones.filter(m => project.completedMilestones.includes(m.id)).length;
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <InnovatorLayout>
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="page-title">My Projects</h1>
            <p className="page-subtitle">Track your innovation journey through each phase</p>
          </div>
        </header>

        <div className="projects-content">
          <div className="phases-timeline">
            {phases.map((phase, index) => {
              const phaseProjects = projects.filter(p => p.phase === phase.id);
              return (
                <div key={phase.id} className="phase-column">
                  <div className="phase-header" style={{ background: phaseColors[phase.id].bg }}>
                    <span className="phase-number">{index + 1}</span>
                    <div className="phase-info">
                      <h3 className="phase-name" style={{ color: phaseColors[phase.id].color }}>{phase.label}</h3>
                      <p className="phase-desc">{phase.desc}</p>
                    </div>
                    <span className="phase-count">{phaseProjects.length}</span>
                  </div>
                  <div className="phase-projects">
                    {phaseProjects.length > 0 ? (
                      phaseProjects.map(project => {
                        const progress = getPhaseProgress(project, phase.id);
                        return (
                          <div
                            key={project.id}
                            className="project-card"
                            onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}
                          >
                            <div className="project-card-header">
                              <span className="project-zsa-id">{project.zsaId}</span>
                              <span className="project-date">{project.date}</span>
                            </div>
                            <h4 className="project-name">{project.name}</h4>
                            <p className="project-description">{project.description}</p>
                            <div className="project-progress">
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${progress}%`, background: phaseColors[phase.id].color }}
                                />
                              </div>
                              <span className="progress-text">{progress}%</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="phase-empty">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        <p>No projects</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Detail Modal */}
        {showDetailModal && selectedProject && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-project-info">
                  <h2 className="modal-project-name">{selectedProject.name}</h2>
                  <p className="modal-project-meta">{selectedProject.category} · Started {selectedProject.date}</p>
                </div>
                <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-progress-header">
                <div className="overall-progress">
                  <span className="overall-label">Overall Progress</span>
                  <span className="overall-value">{getTotalProgress(selectedProject)}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${getTotalProgress(selectedProject)}%` }} />
                  </div>
                </div>
                <div className="current-phase-badge">
                  <span className="phase-dot" style={{ background: phaseColors[selectedProject.phase].color }} />
                  <span style={{ color: phaseColors[selectedProject.phase].color }}>
                    {phases.find(p => p.id === selectedProject.phase)?.label} Phase
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="project-timeline">
                <h3 className="timeline-title">Project Journey</h3>
                <div className="timeline-items">
                  {phases.map((phase, index) => {
                    const isCompleted = phases.findIndex(p => p.id === selectedProject.phase) > index;
                    const isCurrent = phase.id === selectedProject.phase;
                    const phaseMilestones = milestones[phase.id] || [];
                    const completedInPhase = phaseMilestones.filter(m => selectedProject.completedMilestones.includes(m.id)).length;

                    return (
                      <div key={phase.id} className={`timeline-item ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                        <div className="timeline-marker">
                          {isCompleted ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : isCurrent ? (
                            <span className="current-dot" />
                          ) : (
                            <span className="pending-dot" />
                          )}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-phase-name" style={{ color: phaseColors[phase.id].color }}>
                              {phase.label}
                            </span>
                            {isCurrent && (
                              <span className="current-badge">In Progress</span>
                            )}
                            {isCompleted && completedInPhase > 0 && (
                              <span className="completed-phase-date">
                                {formatDate(selectedProject.milestoneDates[phaseMilestones[phaseMilestones.length - 1]?.id])}
                              </span>
                            )}
                          </div>
                          <div className="timeline-milestones">
                            {phaseMilestones.map(m => {
                              const isMilestoneDone = selectedProject.completedMilestones.includes(m.id);
                              return (
                                <div key={m.id} className={`milestone-item ${isMilestoneDone ? "done" : ""}`}>
                                  <span className="milestone-check">
                                    {isMilestoneDone ? (
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    ) : (
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                      </svg>
                                    )}
                                  </span>
                                  <span className="milestone-label">{m.label}</span>
                                  {isMilestoneDone && selectedProject.milestoneDates[m.id] && (
                                    <span className="milestone-date">{formatDate(selectedProject.milestoneDates[m.id])}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Milestone Checklist */}
              <div className="milestone-checklist">
                <h3 className="checklist-title">
                  <span style={{ color: phaseColors[selectedProject.phase].color }}>
                    {phases.find(p => p.id === selectedProject.phase)?.label} Phase
                  </span>
                  <span className="checklist-progress">
                    {getPhaseProgress(selectedProject, selectedProject.phase)}% Complete
                  </span>
                </h3>
                <div className="checklist-items">
                  {milestones[selectedProject.phase]?.map(m => {
                    const isDone = selectedProject.completedMilestones.includes(m.id);
                    return (
                      <label key={m.id} className={`checklist-item ${isDone ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleMilestoneToggle(selectedProject.id, m.id)}
                        />
                        <span className="checklist-checkbox">
                          {isDone && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <div className="checklist-content">
                          <span className="checklist-label">{m.label}</span>
                          <span className="checklist-desc">{m.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Advance Phase Button */}
              {canAdvancePhase(selectedProject) && getNextPhase(selectedProject.phase) && (
                <button
                  className="advance-phase-btn"
                  onClick={() => handleAdvancePhase(selectedProject.id)}
                >
                  <span>Advance to {getNextPhase(selectedProject.phase)?.label} Phase</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
    </InnovatorLayout>
  );
}