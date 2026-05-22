import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import "./PostOpportunity.css";

export default function PostOpportunity() {
  const { postOpportunity } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    title: "", type: "Grant", description: "", amount: "",
    deadline: "", location: "", tags: "",
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.deadline) return;
    postOpportunity({
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    showToast("✅ Opportunity posted successfully!");
    setTimeout(() => navigate("/dashboard/organization/opportunities"), 1500);
  };

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Post Opportunity</h1>
            <p className="page-sub">Create a new opportunity for innovators to apply</p>
          </div>
        </div>

        <div className="form-page">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Opportunity Title *</label>
                <input className="form-input" placeholder="e.g. Green Tech Innovation Grant 2025" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option>Grant</option>
                    <option>Accelerator</option>
                    <option>Hackathon</option>
                    <option>Challenge</option>
                    <option>Fellowship</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Award / Value</label>
                  <input className="form-input" placeholder="e.g. $10,000 or Mentorship" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" placeholder="Describe what this opportunity offers, who should apply, and what you are looking for..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Application Deadline *</label>
                  <input className="form-input" type="date" value={form.deadline} onChange={e => {
                    const d = new Date(e.target.value);
                    setForm({...form, deadline: d.toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"})});
                  }} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="e.g. Nairobi, Kenya or Remote" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input className="form-input" placeholder="e.g. Technology, Health, Youth" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
              </div>

              <div style={{display:"flex", gap:12, justifyContent:"flex-end", marginTop:8}}>
                <button type="button" className="btn-outline" onClick={() => navigate("/dashboard/organization")}>Cancel</button>
                <button type="submit" className="btn-primary">Post Opportunity</button>
              </div>
            </form>
          </div>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </main>
    </div>
  );
}