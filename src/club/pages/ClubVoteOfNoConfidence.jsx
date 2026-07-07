import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 34 — Vote of No Confidence / Removal
// A formal motion to remove an incumbent executive. Active members can open
// the motion (with reason) and then cast votes to remove or retain.
// Removal requires > 50% of votes cast.

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return iso;
  }
};

const REQUIRED_MAJORITY = 0.5; // > 50% of votes cast to remove

export default function ClubVoteOfNoConfidence() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    executivesForBranch,
    executivePositions,
    memberForExecutive,
    removeExecutive,
    currentStudent,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const committee = branch ? executivesForBranch(branch.id) : [];

  const [selectedExecId, setSelectedExecId] = useState('');
  const [reason, setReason] = useState('');
  const [voters, setVoters] = useState({}); // memberId -> 'for' | 'against'
  const [opened, setOpened] = useState(false);
  const [closed, setClosed] = useState(false);
  const [motion, setMotion] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const selectedExec = committee.find((e) => e.id === selectedExecId);
  const selectedPos = executivePositions.find((p) => p.id === selectedExec?.position);
  const selectedMember = selectedExec ? memberForExecutive(selectedExec) : null;

  const votesFor = Object.values(voters).filter((v) => v === 'for').length;
  const votesAgainst = Object.values(voters).filter((v) => v === 'against').length;
  const totalVotes = votesFor + votesAgainst;
  const forPct = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
  const removed = closed && totalVotes > 0 && forPct / 100 > REQUIRED_MAJORITY;

  if (!branch) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Branch not found" />
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

  const openMotion = () => {
    if (!selectedExecId) {
      showFeedback('error', 'Please select an executive to challenge.');
      return;
    }
    if (!reason.trim()) {
      showFeedback('error', 'Please provide a reason for the motion.');
      return;
    }
    setOpened(true);
    setMotion({
      targetExecId: selectedExecId,
      reason: reason.trim(),
      openedAt: new Date().toISOString(),
    });
    showFeedback('success', 'Motion opened ✓ — members may now vote.');
  };

  const castVote = (vote) => {
    if (!currentStudent) {
      showFeedback('error', 'Please sign in to vote.');
      return;
    }
    if (currentStudent.status !== 'active') {
      showFeedback('error', 'Only active members can vote.');
      return;
    }
    setVoters((prev) => ({ ...prev, [currentStudent.id]: vote }));
    showFeedback('success', `Vote recorded (${vote === 'for' ? 'remove' : 'retain'}) ✓`);
  };

  const closeMotion = () => {
    setClosed(true);
    if (removed) {
      removeExecutive(selectedExecId, `vote_of_no_confidence: ${reason.trim()}`);
      showFeedback('success', `Motion carried — ${selectedPos?.title} removed.`);
    } else {
      showFeedback('success', `Motion closed — ${selectedPos?.title} retained.`);
    }
  };

  return (
    <ClubLayout user={currentStudent} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Vote of No Confidence"
            subtitle={`${branch.name} · IBARA YA 34`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/committee`)}
            >
              ← Committee
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">How removal works</h2>
            <span className="card-link">IBARA YA 34</span>
          </div>
          <ol className="club-duty-list">
            <li><strong>Open motion</strong> — Any active member can open a motion against an executive with a written reason.</li>
            <li><strong>Vote</strong> — Active members cast a secret ballot: <strong>for</strong> (remove) or <strong>against</strong> (retain).</li>
            <li><strong>Threshold</strong> — Removal requires <strong>more than 50%</strong> of votes cast.</li>
            <li><strong>Outcome</strong> — If carried, the position becomes vacant and a new election is triggered. If not, the executive stays in office.</li>
          </ol>
        </section>

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

        <div className="club-branch-grid-2">
          {/* Open motion */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">{opened ? 'Motion open' : 'Open a motion'}</h2>
            </div>
            <div className="club-form-group">
              <label className="club-form-label">Target executive</label>
              <select
                className="club-form-input"
                value={selectedExecId}
                onChange={(e) => setSelectedExecId(e.target.value)}
                disabled={opened || closed}
              >
                <option value="">— Select an executive —</option>
                {committee
                  .filter((e) => e.memberId)
                  .map((e) => {
                    const pos = executivePositions.find((p) => p.id === e.position);
                    const member = memberForExecutive(e);
                    return (
                      <option key={e.id} value={e.id}>
                        {pos?.title} — {member?.fullName || '(vacant)'}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="club-form-group">
              <label className="club-form-label">Reason for motion *</label>
              <textarea
                className="club-form-textarea"
                rows={4}
                placeholder="Why should this executive be removed? Be specific and factual."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={opened || closed}
              />
            </div>

            {!opened && !closed ? (
              <button type="button" className="club-btn-primary" onClick={openMotion}>
                Open motion
              </button>
            ) : null}
            {opened && !closed ? (
              <p className="club-footnote">
                Motion opened {formatDate(motion?.openedAt)}. Members may now cast their votes.
              </p>
            ) : null}
          </section>

          {/* Voting */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Cast your vote</h2>
              <span className="card-link">{totalVotes} vote{totalVotes === 1 ? '' : 's'} cast</span>
            </div>
            {!opened ? (
              <p className="club-empty">Open the motion first to enable voting.</p>
            ) : (
              <>
                {selectedMember ? (
                  <div className="club-handover-current">
                    <p className="club-handover-label">Target</p>
                    <p className="club-handover-name">{selectedMember.fullName}</p>
                    <p className="club-handover-meta">
                      {selectedPos?.title} ({selectedPos?.titleEnglish})
                    </p>
                  </div>
                ) : null}

                <div className="club-vote-buttons">
                  <button
                    type="button"
                    className="club-vote-btn club-vote-btn-for"
                    disabled={closed || (currentStudent && voters[currentStudent.id])}
                    onClick={() => castVote('for')}
                  >
                    👍 Vote to REMOVE
                  </button>
                  <button
                    type="button"
                    className="club-vote-btn club-vote-btn-against"
                    disabled={closed || (currentStudent && voters[currentStudent.id])}
                    onClick={() => castVote('against')}
                  >
                    ✋ Vote to RETAIN
                  </button>
                </div>

                {currentStudent && voters[currentStudent.id] ? (
                  <p className="club-footnote" style={{ marginTop: 10 }}>
                    ✓ You voted: <strong>{voters[currentStudent.id] === 'for' ? 'REMOVE' : 'RETAIN'}</strong>.
                  </p>
                ) : null}

                <div className="club-results-bar" style={{ marginTop: 14 }}>
                  <div
                    className="club-results-bar-fill"
                    style={{ width: `${forPct}%`, background: '#ef4444' }}
                  />
                </div>
                <p className="club-results-meta">
                  {votesFor} remove · {votesAgainst} retain · {forPct.toFixed(0)}% in favour
                </p>

                {!closed ? (
                  <button
                    type="button"
                    className="club-btn-primary club-btn-sm"
                    style={{ marginTop: 14 }}
                    onClick={closeMotion}
                    disabled={totalVotes === 0}
                  >
                    Close motion &amp; tally
                  </button>
                ) : (
                  <div
                    className="club-error-box"
                    style={{
                      marginTop: 14,
                      background: removed ? '#fee2e2' : '#dcfce7',
                      borderColor: removed ? '#fecaca' : '#bbf7d0',
                      color: removed ? '#b91c1c' : '#15803d',
                    }}
                  >
                    {removed
                      ? `🟥 Motion carried — ${selectedPos?.title} ${selectedMember?.fullName} has been removed from office.`
                      : `🟩 Motion did not carry — ${selectedPos?.title} ${selectedMember?.fullName} retains office.`}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}