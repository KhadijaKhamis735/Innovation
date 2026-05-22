import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const statusClass = {
  "Under Review": "badge-amber", Accepted: "badge-green",
  Rejected: "badge-red", Shortlisted: "badge-blue",
};

export default function ReceivedApplications() {
  const { user, opportunities, updateApplicationStatus } = useAuth();
  const [filterOpp, setFilterOpp] = useState("All");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const myOpps = opportunities.filter((o) => o.orgId === user.id);
  const allApplications = myOpps.flatMap((opp) =>
    opp.applicants.map((a) => ({ ...a, oppId: opp.id, opportunity: opp.title }))
  );
  const filtered = filterOpp === "All" ? allApplications : allApplications.filter((a) => a.opportunity === filterOpp);

  const handleStatus = (oppId, innovatorId, status) => {
    updateApplicationStatus(oppId, innovatorId, status);
    if (selected?.innovatorId === innovatorId) setSelected({ ...selected, status });
    showToast(`✅ Application marked as ${status}`);
  };

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Applications Received</h1>
            <p className="page-sub">{filtered.length} application{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Filter by opportunity */}
        <div className="filter-bar">
          <button className={`filter-btn ${filterOpp === "All" ? "active" : ""}`} onClick={() => setFilterOpp("All")}>All</button>
          {myOpps.map((o) => (
            <button key={o.id} className={`filter-btn ${filterOpp === o.title ? "active" : ""}`} onClick={() => setFilterOpp(o.title)}>
              {o.title.length > 30 ? o.title.slice(0, 30) + "…" : o.title}
            </button>
          ))}
        </div>

        {myOpps.length === 0 ? (
          <div className="empty-state" style={{paddingTop: 80}}>
            <div className="empty-icon">📥</div>
            <p className="empty-title">No opportunities posted yet</p>
            <p className="empty-desc">Post an opportunity first to start receiving applications.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{paddingTop: 80}}>
            <div className="empty-icon">📭</div>
            <p className="empty-title">No applications yet</p>
            <p className="empty-desc">Applications will appear here once innovators apply.</p>
          </div>
        ) : (
          <div className="dash-card" style={{padding: 0, overflow:"hidden"}}>
            <table className="app-table">
              <thead>
                <tr>
                  <th>Innovator</th>
                  <th>Project</th>
                  <th>Opportunity</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{display:"flex", alignItems:"center", gap:10}}>
                        <div className="item-avatar item-avatar-purple" style={{width:32, height:32, borderRadius:8, fontSize:12}}>
                          {a.innovatorName.charAt(0)}
                        </div>
                        <div>
                          <p style={{fontWeight:600, fontSize:13}}>{a.innovatorName}</p>
                          <p style={{fontSize:11, color:"#94a3b8"}}>{a.innovatorEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{fontWeight:600, fontSize:13}}>{a.projectName}</p>
                      <button onClick={() => setSelected(a)} style={{background:"none", border:"none", color:"#6366f1", fontSize:11, cursor:"pointer", padding:0, fontWeight:600}}>
                        View Details →
                      </button>
                    </td>
                    <td style={{color:"#64748b", fontSize:13}}>{a.opportunity}</td>
                    <td style={{color:"#94a3b8", fontSize:13}}>{a.date}</td>
                    <td><span className={`badge ${statusClass[a.status]}`}>{a.status}</span></td>
                    <td>
                      <div style={{display:"flex", gap:6}}>
                        <button className="btn-outline btn-sm btn-success" onClick={() => handleStatus(a.oppId, a.innovatorId, "Accepted")}>Accept</button>
                        <button className="btn-outline btn-sm" style={{color:"#f59e0b", borderColor:"#fde68a", background:"#fffbeb"}} onClick={() => handleStatus(a.oppId, a.innovatorId, "Shortlisted")}>Shortlist</button>
                        <button className="btn-outline btn-sm btn-danger" onClick={() => handleStatus(a.oppId, a.innovatorId, "Rejected")}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <p className="modal-title">{selected.projectName}</p>
              <p className="modal-sub">by {selected.innovatorName} · {selected.date}</p>
              <div style={{marginBottom:16}}>
                <p style={{fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:4, textTransform:"uppercase"}}>Opportunity</p>
                <p style={{fontSize:14, color:"#1e293b"}}>{selected.opportunity}</p>
              </div>
              <div style={{marginBottom:16}}>
                <p style={{fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:4, textTransform:"uppercase"}}>Motivation</p>
                <p style={{fontSize:14, color:"#1e293b", lineHeight:1.6}}>{selected.motivation}</p>
              </div>
              {selected.experience && (
                <div style={{marginBottom:16}}>
                  <p style={{fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:4, textTransform:"uppercase"}}>Experience</p>
                  <p style={{fontSize:14, color:"#1e293b", lineHeight:1.6}}>{selected.experience}</p>
                </div>
              )}
              <div style={{marginBottom:20}}>
                <p style={{fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:6, textTransform:"uppercase"}}>Status</p>
                <span className={`badge ${statusClass[selected.status]}`}>{selected.status}</span>
              </div>
              <div className="modal-footer">
                <button className="btn-outline btn-sm btn-danger" onClick={() => { handleStatus(selected.oppId, selected.innovatorId, "Rejected"); setSelected(null); }}>Reject</button>
                <button className="btn-outline btn-sm" style={{color:"#f59e0b", borderColor:"#fde68a", background:"#fffbeb"}} onClick={() => { handleStatus(selected.oppId, selected.innovatorId, "Shortlisted"); setSelected(null); }}>Shortlist</button>
                <button className="btn-primary btn-sm" onClick={() => { handleStatus(selected.oppId, selected.innovatorId, "Accepted"); setSelected(null); }}>Accept</button>
              </div>
            </div>
          </div>
        )}
        {toast && <div className="toast">{toast}</div>}
      </main>
    </div>
  );
}