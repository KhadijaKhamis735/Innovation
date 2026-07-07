import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 45 — File a Disciplinary Complaint

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return iso; }
};

export default function ClubFileComplaint() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    membersForBranch,
    fileComplaint,
    casesForBranch,
    caseById,
    students,
    currentStudent,
    currentClubLeader,
    sanctionLevels,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const me = currentStudent || currentClubLeader;
  const branchMembers = branch ? membersForBranch(branch.id, null, 'active') : [];
  const existingCases = branch ? casesForBranch(branch.id) : [];

  const [respondentId, setRespondentId] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [sanctionRequested, setSanctionRequested] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  if (!branch) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Branch not found" />
            <button className="club-btn-secondary" type="button" onClick={() => navigate('/club/branches')}>
              ← Branches
            </button>
          </div>
        </header>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!me) {
      setError('Please sign in.');
      return;
    }
    if (respondentId === me.id) {
      setError('You cannot file a complaint against yourself.');
      return;
    }
    const result = fileComplaint({
      branchId: branch.id,
      complainantId: me.id,
      respondentId,
      complaintText,
      sanctionRequested: sanctionRequested || null,
    });
    if (!result.ok) {
      setError(result.error || 'Could not file.');
      return;
    }
    setFeedback('Complaint filed ✓');
    setRespondentId('');
    setComplaintText('');
    setSanctionRequested('');
    setTimeout(() => {
      navigate(`/club/branches/${branch.id}/discipline/${result.case.id}`);
    }, 700);
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="File a Complaint" subtitle={`${branch.name} · IBARA YA 45`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/discipline`)}>
              ← Disciplinary cases
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Procedure</h2>
            <span className="card-link">IBARA YA 45</span>
          </div>
          <ol className="club-duty-list">
            <li><strong>Submit in writing</strong> to the Secretary, Chair, or Patron.</li>
            <li><strong>Investigation</strong> — The Executive Committee gathers facts. The respondent is informed of the allegations.</li>
            <li><strong>Hearing</strong> — The respondent is heard before any sanction.</li>
            <li><strong>Sanction</strong> — May be a verbal warning, written warning, suspension, removal from office, or expulsion (depending on severity).</li>
            <li><strong>Appeal</strong> — The respondent may appeal to the General Meeting (Mkutano Mkuu).</li>
          </ol>
        </section>

        {existingCases.length > 0 ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Existing cases</h2>
              <span className="card-link">{existingCases.length} total</span>
            </div>
            <div className="treasury-tx-list">
              {existingCases.map((c) => {
                const respondent = students.find((s) => s.id === c.respondentId);
                const complainant = students.find((s) => s.id === c.complainantId);
                return (
                  <div key={c.id} className="treasury-tx-row">
                    <div className="treasury-tx-icon">⚠️</div>
                    <div className="treasury-tx-body">
                      <p className="treasury-tx-title">vs. {respondent?.fullName || c.respondentId}</p>
                      <p className="treasury-tx-meta">
                        by {complainant?.fullName || 'anon'} · {formatDate(c.filedAt)} · {c.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="club-btn-secondary club-btn-sm"
                      onClick={() => navigate(`/club/branches/${branch.id}/discipline/${c.id}`)}
                    >
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">File a new complaint</h2>
          </div>
          {me ? (
            <form onSubmit={handleSubmit}>
              {error ? <div className="club-error-box">{error}</div> : null}
              {feedback ? (
                <div className="club-error-box" style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' }}>
                  {feedback}
                </div>
              ) : null}
              <div className="club-form-group">
                <label className="club-form-label">Respondent (member complained about) *</label>
                <select className="club-form-input" value={respondentId} onChange={(e) => setRespondentId(e.target.value)}>
                  <option value="">— Select a member —</option>
                  {branchMembers.filter((m) => m.id !== me.id).map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName} — {m.regNumber || m.email}</option>
                  ))}
                </select>
              </div>
              <div className="club-form-group">
                <label className="club-form-label">Complaint text *</label>
                <span className="club-form-sublabel">Be factual and specific. Include dates, places, and witnesses if possible.</span>
                <textarea
                  className="club-form-textarea"
                  rows={6}
                  placeholder="Describe what happened, when, and what behaviour violated the Code of Conduct (IBARA YA 42)."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                />
              </div>
              <div className="club-form-group">
                <label className="club-form-label">Suggested sanction (optional)</label>
                <select className="club-form-input" value={sanctionRequested} onChange={(e) => setSanctionRequested(e.target.value)}>
                  <option value="">— Suggest a starting point —</option>
                  {sanctionLevels.map((s) => (
                    <option key={s.id} value={s.id}>{s.label} (severity {s.severity})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="club-btn-primary">File complaint</button>
            </form>
          ) : (
            <p className="club-empty">
              You must be signed in to file a complaint.{' '}
              <button type="button" className="club-btn-secondary club-btn-sm" onClick={() => navigate('/club/login')}>
                Sign in
              </button>
            </p>
          )}
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}