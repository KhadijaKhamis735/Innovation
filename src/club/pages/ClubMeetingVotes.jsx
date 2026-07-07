import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import {
  DEFAULT_DECISION_THRESHOLD,
} from '../data/meetings';
import '../styles/ClubShared.css';

// IBARA YA 36 — Meeting Decisions & Voting
// Propose decisions, vote (for/against/abstain), close & tally.

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return iso;
  }
};

const THRESHOLD_PRESETS = [
  { id: 'simple', label: 'Simple majority (≥50%)', value: 0.5 },
  { id: 'supermajority', label: 'Super-majority (≥2/3)', value: 2 / 3 },
  { id: 'unanimous', label: 'Unanimous (100%)', value: 0.99 },
];

export default function ClubMeetingVotes() {
  const { branchId, meetingId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    meetingById,
    decisionsForMeeting,
    quorumForMeeting,
    proposeDecision,
    castMeetingVote,
    closeDecision,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const meeting = meetingById(meetingId);
  const decisions = meeting ? decisionsForMeeting(meeting.id) : [];
  const quorum = meeting ? quorumForMeeting(meeting) : { present: 0, required: 0, met: false };

  const [showPropose, setShowPropose] = useState(false);
  const [draft, setDraft] = useState({ description: '', threshold: DEFAULT_DECISION_THRESHOLD });
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const canRun = currentStudent && (currentStudent.status === 'active' || !!currentClubLeader);

  if (!branch || !meeting) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Meeting not found" />
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate('/club/branches')}
            >
              ← Branches
            </button>
          </div>
        </header>
      </div>
    );
  }

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3500);
  };

  const submitDecision = (e) => {
    e.preventDefault();
    const result = proposeDecision({
      meetingId: meeting.id,
      description: draft.description,
      proposedBy: currentStudent?.id || currentClubLeader?.id || null,
      threshold: draft.threshold,
    });
    if (!result.ok) {
      showFeedback('error', result.error || 'Could not propose decision.');
      return;
    }
    setDraft({ description: '', threshold: DEFAULT_DECISION_THRESHOLD });
    setShowPropose(false);
    showFeedback('success', 'Decision proposed ✓');
  };

  const handleVote = (decisionId, choice) => {
    if (!currentStudent || currentStudent.status !== 'active') {
      showFeedback('error', 'Only active members can vote.');
      return;
    }
    const result = castMeetingVote(decisionId, currentStudent.id, choice);
    if (!result.ok) {
      showFeedback('error', result.error || 'Could not cast vote.');
      return;
    }
    showFeedback('success', `Vote cast: ${choice.toUpperCase()} ✓`);
  };

  const handleClose = (decisionId) => {
    const result = closeDecision(decisionId, currentStudent?.id || currentClubLeader?.id || null);
    if (!result.ok) {
      showFeedback('error', result.error || 'Could not close.');
      return;
    }
    if (result.decision.outcome === 'passed') showFeedback('success', 'Decision passed ✓');
    else showFeedback('success', 'Decision closed.');
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Decisions &amp; Voting"
            subtitle={`${meeting.title} · IBARA YA 36`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/meetings/${meeting.id}`)}
            >
              ← Meeting
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
            <h2 className="card-title">Quorum &amp; rules</h2>
            <span className="card-link">{uni?.shortName}</span>
          </div>
          <p style={{ margin: 0, color: 'var(--club-text-2)', lineHeight: 1.6 }}>
            IBARA YA 36 — A decision passes when the share of <strong>FOR</strong>
            votes among <em>FOR</em> + <em>AGAINST</em> reaches the chosen threshold
            (default: ≥50%). Tied votes are resolved by the Chair. <strong>Abstain</strong>
            {' '}votes count toward attendance but not toward the threshold ratio.
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--club-text-2)' }}>
            Current quorum: <strong>{quorum.present}</strong> present / {quorum.required} required{' '}
            {quorum.met ? '✅' : '⏳'}
          </p>
        </section>

        {/* Propose */}
        {canRun ? (
          showPropose ? (
            <section className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h2 className="card-title">Propose a new decision</h2>
              </div>
              <form onSubmit={submitDecision}>
                <div className="club-form-group">
                  <label className="club-form-label">Description *</label>
                  <textarea
                    className="club-form-textarea"
                    rows={3}
                    placeholder="State the motion clearly. e.g. Approve Ksh 50,000 for the July training calendar."
                    value={draft.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Required threshold</label>
                  <div className="club-threshold-pills">
                    {THRESHOLD_PRESETS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`club-threshold-pill ${draft.threshold === t.value ? 'is-selected' : ''}`}
                        onClick={() => setDraft((p) => ({ ...p, threshold: t.value }))}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="club-btn-primary club-btn-sm">
                    Propose
                  </button>
                  <button
                    type="button"
                    className="club-btn-secondary club-btn-sm"
                    onClick={() => {
                      setShowPropose(false);
                      setDraft({ description: '', threshold: DEFAULT_DECISION_THRESHOLD });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <button
              type="button"
              className="club-btn-primary"
              style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}
              onClick={() => setShowPropose(true)}
            >
              + Propose new decision
            </button>
          )
        ) : null}

        {/* Decisions list */}
        {decisions.length === 0 ? (
          <p className="club-empty">No decisions have been proposed yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {decisions.map((d) => {
              const forCount = d.ballots?.filter((b) => b.choice === 'for').length || 0;
              const againstCount = d.ballots?.filter((b) => b.choice === 'against').length || 0;
              const abstainCount = d.ballots?.filter((b) => b.choice === 'abstain').length || 0;
              const considered = forCount + againstCount;
              const forPct = considered > 0 ? (forCount / considered) * 100 : 0;
              const passed = forPct / 100 >= (d.threshold ?? DEFAULT_DECISION_THRESHOLD);
              const userChoice = currentStudent
                ? d.ballots?.find((b) => b.voterId === currentStudent.id)?.choice
                : null;
              const isOpen = !d.closedAt;

              return (
                <article key={d.id} className={`club-decision-card ${d.outcome ? `is-${d.outcome}` : ''}`}>
                  <div className="club-decision-card-head">
                    <p className="club-decision-card-text">{d.description}</p>
                    {d.outcome === 'passed' ? (
                      <span className="club-badge club-badge-active">✓ Passed</span>
                    ) : d.outcome === 'failed' ? (
                      <span className="club-badge club-badge-suspended">✗ Failed</span>
                    ) : (
                      <span className="club-badge club-badge-pending">Open</span>
                    )}
                  </div>
                  <p className="club-decision-card-meta">
                    Proposed {formatDateTime(d.proposedAt)} · Threshold{' '}
                    {Math.round((d.threshold || 0.5) * 100)}%
                    {d.outcome ? ` · Closed ${formatDateTime(d.closedAt)}` : ''}
                  </p>

                  <div className="club-vote-results">
                    <div className="club-vote-result-row">
                      <span className="club-vote-result-label">👍 For</span>
                      <span className="club-vote-result-value">{forCount}</span>
                    </div>
                    <div className="club-vote-result-row">
                      <span className="club-vote-result-label">✋ Against</span>
                      <span className="club-vote-result-value">{againstCount}</span>
                    </div>
                    <div className="club-vote-result-row">
                      <span className="club-vote-result-label">🤷 Abstain</span>
                      <span className="club-vote-result-value">{abstainCount}</span>
                    </div>
                  </div>

                  {considered > 0 ? (
                    <div className="club-results-bar" style={{ marginTop: 10 }}>
                      <div
                        className="club-results-bar-fill"
                        style={{
                          width: `${forPct}%`,
                          background: passed ? 'var(--club-orange)' : '#94a3b8',
                        }}
                      />
                    </div>
                  ) : null}
                  <p className="club-results-meta">
                    {considered > 0
                      ? `${forCount}/${considered} = ${forPct.toFixed(0)}% in favour`
                      : 'No votes yet'}
                    {considered > 0 && !d.closedAt ? ` · ${passed ? 'On track to pass' : 'Not enough support yet'}` : ''}
                  </p>

                  {isOpen && canRun ? (
                    <div className="club-vote-buttons" style={{ marginTop: 14 }}>
                      <button
                        type="button"
                        className="club-vote-btn club-vote-btn-for"
                        disabled={userChoice === 'for'}
                        onClick={() => handleVote(d.id, 'for')}
                      >
                        👍 For
                      </button>
                      <button
                        type="button"
                        className="club-vote-btn club-vote-btn-against"
                        disabled={userChoice === 'against'}
                        onClick={() => handleVote(d.id, 'against')}
                      >
                        ✋ Against
                      </button>
                      <button
                        type="button"
                        className="club-vote-btn"
                        style={{ background: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' }}
                        disabled={userChoice === 'abstain'}
                        onClick={() => handleVote(d.id, 'abstain')}
                      >
                        🤷 Abstain
                      </button>
                    </div>
                  ) : null}

                  {isOpen && currentStudent && userChoice ? (
                    <p className="club-footnote" style={{ marginTop: 10 }}>
                      ✓ You voted: <strong>{userChoice.toUpperCase()}</strong>
                    </p>
                  ) : null}

                  {isOpen && canRun ? (
                    <button
                      type="button"
                      className="club-btn-primary club-btn-sm"
                      style={{ marginTop: 10 }}
                      onClick={() => handleClose(d.id)}
                    >
                      Close &amp; tally
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
    </ClubLayout>
  );
}