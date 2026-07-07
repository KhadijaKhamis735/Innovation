import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 47 — Dissolution Proposal & Voting
// Requires ¾ majority at an Extraordinary General Meeting.
// Assets go to university/ZSA/educational institution — NOT to members.

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return iso; }
};

const RECIPIENT_PRESETS = [
  { id: 'university', label: 'University', description: 'Transfer to the host university.' },
  { id: 'zsa', label: 'Zanzibar Startup Association (ZSA)', description: 'Transfer to the parent organisation.' },
  { id: 'edu_organisation', label: 'Educational / innovation organisation', description: 'Transfer to another eligible institution.' },
];

export default function ClubDissolution() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    dissolutionForBranch,
    openDissolutionVote,
    castDissolutionVote,
    closeDissolution,
    sendDissolutionNotifications,
    students,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const dissolution = branch ? dissolutionForBranch(branch.id) : null;
  const me = currentStudent || currentClubLeader;

  const [reason, setReason] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState(['university', 'zsa']);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

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

  const myVote = dissolution?.votes
    ? me ? dissolution.votes.find((v) => v.voterId === me.id) : null
    : null;
  const votesFor = dissolution?.votesFor || 0;
  const votesAgainst = dissolution?.votesAgainst || 0;
  const votesAbstain = dissolution?.votesAbstain || 0;
  const considered = votesFor + votesAgainst;
  const forRatio = considered > 0 ? (votesFor / considered) * 100 : 0;
  const passed = forRatio / 100 >= (dissolution?.threshold || 0.75);
  const status = dissolution?.status;

  const canManage = !!currentClubLeader || (currentStudent && currentStudent.status === 'active');

  const flash = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3500);
  };

  const toggleRecipient = (id) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenMotion = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Provide a reason for dissolution.');
      return;
    }
    if (selectedRecipients.length === 0) {
      setError('Select at least one asset recipient.');
      return;
    }
    const result = openDissolutionVote({
      branchId: branch.id,
      reason,
      initiatedBy: me?.id || null,
      assetRecipients: selectedRecipients,
    });
    if (!result.ok) {
      setError(result.error || 'Could not open motion.');
      return;
    }
    flash('success', 'Dissolution motion opened ✓');
    setReason('');
  };

  const handleVote = (choice) => {
    if (!me || me.status !== 'active') {
      flash('error', 'Only active members can vote.');
      return;
    }
    castDissolutionVote(dissolution.id, me.id, choice);
    flash('success', `Vote cast: ${choice} ✓`);
  };

  const handleClose = () => {
    const result = closeDissolution(dissolution.id, me?.id || null);
    if (!result.ok) {
      flash('error', result.error || 'Could not close.');
    } else {
      flash('success', result.passed ? 'Dissolution passed ✓' : 'Motion did not pass.');
    }
  };

  const handleNotify = () => {
    sendDissolutionNotifications(dissolution.id);
    flash('success', 'Notification flag set — university & ZSA must be informed in writing.');
  };

  return (
    <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Dissolution (Kuvunjwa kwa Klabu)"
            subtitle={`${branch.name} · IBARA YA 47`}
          />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}`)}>
              ← Branch
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {feedback.msg ? (
          <div
            className="club-error-box"
            style={{
              background: feedback.type === 'success' ? '#dcfce7' : '#fef2f2',
              borderColor: feedback.type === 'success' ? '#bbf7d0' : '#fecaca',
              color: feedback.type === 'success' ? '#15803d' : '#dc2626',
            }}
          >
            {feedback.msg}
          </div>
        ) : null}

        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Dissolution rules</h2>
            <span className="card-link">IBARA YA 47</span>
          </div>
          <ol className="club-duty-list">
            <li>Requires a <strong>¾ majority</strong> at an Extraordinary General Meeting convened specifically for dissolution.</li>
            <li>The university and ZSA <strong>must be notified in writing</strong> before dissolution can take effect.</li>
            <li>Remaining funds and assets are <strong>NOT distributed to members</strong>. They are transferred to the university, ZSA, or another educational / innovation institution.</li>
          </ol>
        </section>

        {!dissolution || status === 'rejected' ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Open a dissolution motion</h2>
            </div>
            <form onSubmit={handleOpenMotion}>
              {error ? <div className="club-error-box">{error}</div> : null}
              <div className="club-form-group">
                <label className="club-form-label">Reason *</label>
                <textarea
                  className="club-form-textarea"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is dissolution being proposed?"
                />
              </div>
              <div className="club-form-group">
                <label className="club-form-label">Asset recipients *</label>
                <div className="club-asset-list">
                  {RECIPIENT_PRESETS.map((r) => (
                    <label key={r.id} className="club-asset-row">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(r.id)}
                        onChange={() => toggleRecipient(r.id)}
                      />
                      <span><strong>{r.label}</strong> — {r.description}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="club-btn-primary">Open motion</button>
            </form>
          </section>
        ) : null}

        {dissolution ? (
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Motion status: {status}</h2>
              <span className="card-link">{considered} votes counted</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--club-text-2)' }}>
              {dissolution.reason}
            </p>

            <div className="audit-log" style={{ marginTop: 12 }}>
              <div className="audit-log-row">
                <span className="audit-log-time">👍 For</span>
                <span className="audit-log-type">{votesFor}</span>
                <span className="audit-log-meta">{forRatio.toFixed(0)}% in favour</span>
              </div>
              <div className="audit-log-row">
                <span className="audit-log-time">✋ Against</span>
                <span className="audit-log-type">{votesAgainst}</span>
              </div>
              <div className="audit-log-row">
                <span className="audit-log-time">🤷 Abstain</span>
                <span className="audit-log-type">{votesAbstain}</span>
              </div>
            </div>

            {considered > 0 ? (
              <>
                <div className="amendment-bar">
                  <div className="amendment-bar-fill" style={{ width: `${forRatio}%`, background: passed ? '#22c55e' : '#ef4444' }} />
                  <div className="amendment-bar-mark" style={{ left: '75%' }} />
                </div>
                <p className="amendment-threshold-label">Threshold: 75% (¾ majority)</p>
              </>
            ) : null}

            <p className="club-form-sublabel" style={{ marginTop: 12 }}>Asset recipients:</p>
            <ul style={{ paddingLeft: 18 }}>
              {dissolution.assetRecipients.map((r) => (
                <li key={r}>{RECIPIENT_PRESETS.find((p) => p.id === r)?.label || r}</li>
              ))}
            </ul>

            {status === 'voting' && me && me.status === 'active' ? (
              <div className="club-vote-buttons" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="club-vote-btn club-vote-btn-for"
                  disabled={myVote?.choice === 'for'}
                  onClick={() => handleVote('for')}
                >
                  👍 For
                </button>
                <button
                  type="button"
                  className="club-vote-btn club-vote-btn-against"
                  disabled={myVote?.choice === 'against'}
                  onClick={() => handleVote('against')}
                >
                  ✋ Against
                </button>
                <button
                  type="button"
                  className="club-vote-btn"
                  style={{ background: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' }}
                  disabled={myVote?.choice === 'abstain'}
                  onClick={() => handleVote('abstain')}
                >
                  🤷 Abstain
                </button>
              </div>
            ) : null}

            {myVote ? (
              <p className="club-footnote" style={{ marginTop: 10 }}>
                ✓ You voted: <strong>{myVote.choice.toUpperCase()}</strong>
              </p>
            ) : null}

            {status === 'voting' && canManage ? (
              <div className="club-stage-buttons" style={{ marginTop: 14 }}>
                <button type="button" className="club-btn-secondary club-btn-sm" onClick={handleNotify}>
                  Mark university & ZSA notified
                </button>
                <button type="button" className="club-btn-primary club-btn-sm" onClick={handleClose}>
                  Close motion &amp; tally
                </button>
              </div>
            ) : null}

            {status === 'passed' || status === 'rejected' ? (
              <div
                className="club-error-box"
                style={{
                  marginTop: 14,
                  background: status === 'passed' ? '#fee2e2' : '#dcfce7',
                  borderColor: status === 'passed' ? '#fecaca' : '#bbf7d0',
                  color: status === 'passed' ? '#b91c1c' : '#15803d',
                }}
              >
                {status === 'passed'
                  ? `🟥 Dissolution carried — branch is dissolved. Assets must be transferred to: ${dissolution.assetRecipients.map((r) => RECIPIENT_PRESETS.find((p) => p.id === r)?.label || r).join(', ')}.`
                  : '🟩 Motion did not carry — branch remains active.'}
              </div>
            ) : null}

            {!dissolution.notificationsSent && status !== 'passed' ? (
              <p className="club-footnote" style={{ marginTop: 8 }}>
                ⚠️ University & ZSA have not yet been notified in writing. Send written notice before the motion can be executed.
              </p>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}