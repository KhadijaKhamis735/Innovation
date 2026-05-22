import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const typeClass = { Grant: "type-indigo", Accelerator: "type-purple", Hackathon: "type-orange", Challenge: "type-teal", Fellowship: "type-blue", Internship: "type-teal" };

export default function MyOpportunities() {
  const { user, opportunities } = useAuth();
  const myOpps = opportunities.filter((o) => o.orgId === user.id);

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Opportunities</h1>
            <p className="page-sub">{myOpps.length} opportunity{myOpps.length !== 1 ? "ies" : "y"} posted</p>
          </div>
          <Link to="/dashboard/organization/post" className="btn-primary">+ Post New</Link>
        </div>

        {myOpps.length === 0 ? (
          <div className="empty-state" style={{paddingTop: 100}}>
            <div className="empty-icon">📢</div>
            <p className="empty-title">No opportunities posted yet</p>
            <p className="empty-desc">Click "Post New" to create your first opportunity.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {myOpps.map((opp) => (
              <div key={opp.id} className="opp-card">
                <div className="opp-card-top">
                  <span className={`type-tag ${typeClass[opp.type] || "type-indigo"}`}>{opp.type}</span>
                  <span className="badge badge-green">Open</span>
                </div>
                <p className="opp-card-title" style={{marginTop:10}}>{opp.title}</p>
                <p className="opp-card-desc">{opp.description}</p>
                <div className="opp-card-meta">
                  {opp.amount && <div className="opp-meta-item"><span>💰</span><span>{opp.amount}</span></div>}
                  <div className="opp-meta-item"><span>📅</span><span>Deadline: {opp.deadline}</span></div>
                  {opp.location && <div className="opp-meta-item"><span>📍</span><span>{opp.location}</span></div>}
                </div>
                <div className="opp-card-tags">
                  {opp.tags.map((t) => <span key={t} className="opp-tag">{t}</span>)}
                </div>
                <div className="opp-card-footer">
                  <span style={{fontSize:13, fontWeight:600, color:"#6366f1"}}>
                    👥 {opp.applicants.length} applicant{opp.applicants.length !== 1 ? "s" : ""}
                  </span>
                  <Link to="/dashboard/organization/applications" className="btn-outline btn-sm">
                    View Applications
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
