import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 43 — Conflict of Interest Disclosure

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return iso; }
};

export default function ClubConflictDisclosure() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    declareConflict,
    conflictsForMember,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const me = currentStudent || currentClubLeader;

  const [decisionContext, setDecisionContext] = useState('');
  const [nature, setNature] = useState('');
  const [recused, setRecused] = useState(false);
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

  const mine = me ? conflictsForMember(me.id).filter((c) => {
    if (!decisionContext) return true;
    return true; // we don't carry branchId on conflicts; show all for the member
  }) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!me) {
      setFeedback('Please sign in to disclose a conflict.');
      return;
    }
    const result = declareConflict({
      memberId: me.id,
      decisionContext,
      nature,
      recused,
    });
    if (!result.ok) {
      setFeedback(result.error || 'Could not disclose.');
      return;
    }
    setDecisionContext('');
    setNature('');
    setRecused(false);
    setFeedback('Conflict disclosed ✓');
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Conflict of Interest" subtitle={`${branch.name} · IBARA YA 43`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}`)}>
              ← Branch
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">When to disclose</h2>
            <span className="card-link">IBARA YA 43</span>
          </div>
          <p style={{ margin: 0, color: 'var(--club-text-2)', lineHeight: 1.6 }}>
            Any leader or member who has a personal, family, or business interest
            in a decision before the club must disclose it <strong>before</strong> the
            decision is made and, when appropriate, recuse themselves from voting.
            The club may not use leadership positions for personal gain or unfair
            favoritism toward family, business partners, or allies.
          </p>
        </section>

        {me ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Disclose a conflict</h2>
              <span className="card-link">Filing as {me.fullName}</span>
            </div>
            <form onSubmit={handleSubmit}>
              {feedback ? (
                <div
                  className="club-error-box"
                  style={{
                    background: feedback.includes('✓') ? '#dcfce7' : '#fef2f2',
                    borderColor: feedback.includes('✓') ? '#bbf7d0' : '#fecaca',
                    color: feedback.includes('✓') ? '#15803d' : '#dc2626',
                  }}
                >
                  {feedback}
                </div>
              ) : null}
              <div className="club-form-group">
                <label className="club-form-label">Decision context</label>
                <input
                  type="text"
                  className="club-form-input"
                  placeholder="e.g. Vote on Q3 sponsorship from XYZ Ltd, which my cousin runs."
                  value={decisionContext}
                  onChange={(e) => setDecisionContext(e.target.value)}
                />
              </div>
              <div className="club-form-group">
                <label className="club-form-label">Nature of the conflict *</label>
                <textarea
                  className="club-form-textarea"
                  rows={4}
                  placeholder="Describe the relationship or interest clearly. Be specific."
                  value={nature}
                  onChange={(e) => setNature(e.target.value)}
                />
              </div>
              <label className="club-asset-row">
                <input type="checkbox" checked={recused} onChange={(e) => setRecused(e.target.checked)} />
                <span>I will recuse myself from voting on this decision.</span>
              </label>
              <button type="submit" className="club-btn-primary" style={{ marginTop: 14 }}>
                Submit disclosure
              </button>
            </form>
          </section>
        ) : (
          <section className="card">
            <p className="club-empty">
              You must be signed in to file a disclosure.{' '}
              <button type="button" className="club-btn-secondary club-btn-sm" onClick={() => navigate('/club/login')}>
                Sign in
              </button>
            </p>
          </section>
        )}

        {me && mine.length > 0 ? (
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">My disclosures</h2>
              <span className="card-link">{mine.length} total</span>
            </div>
            <div className="club-decision-list">
              {mine.map((c) => (
                <div key={c.id} className="club-decision-row">
                  <div className="club-decision-row-head">
                    <p className="club-decision-row-text">{c.nature}</p>
                    {c.recused ? <span className="club-badge club-badge-active">Recused</span> : null}
                  </div>
                  <p className="club-decision-row-meta">
                    Context: {c.decisionContext || '—'} · Disclosed {formatDate(c.disclosedAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
    </ClubLayout>
  );
}