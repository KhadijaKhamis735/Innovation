import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import {
  ELECTION_STATUS_LABELS,
  ELECTION_STATUS_COLORS,
  CANDIDACY_REQUIREMENTS,
} from '../data/elections';
import '../styles/ClubShared.css';

// IBARA YA 30–34 — Election Detail
// Central hub for one election: status, schedule, candidates, ballots, complaints.
// Different actions are surfaced based on the current stage.

const formatDate = (iso) => {
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

export default function ClubElectionDetail() {
  const { branchId, electionId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    electionById,
    findPosition,
    students,
    nominationsForElection,
    ballotsForElection,
    activeElectionForPosition,
    advanceElectionStage,
    submitNomination,
    castBallot,
    fileElectionComplaint,
    tallyAndClose,
    installElectionWinner,
    currentStudent,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const election = electionById(electionId);

  // Nomination form state (only relevant during nominations_open)
  const [showNominate, setShowNominate] = useState(false);
  const [nomStatement, setNomStatement] = useState('');
  const [nomExperience, setNomExperience] = useState('');
  const [nomHours, setNomHours] = useState('');

  // Voting state
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Complaint state
  const [complaintText, setComplaintText] = useState('');
  const [showComplaint, setShowComplaint] = useState(false);

  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const nominations = election ? nominationsForElection(election.id) : [];
  const totalBallots = election ? ballotsForElection(election.id).length : 0;
  const alreadyVoted = currentStudent
    ? ballotsForElection(election?.id || '').some((b) => b.voterId === currentStudent.id)
    : false;

  const isCandidate = currentStudent
    ? nominations.some((n) => n.candidateId === currentStudent.id)
    : false;

  const eligibleMembers = useMemo(() => {
    if (!branch) return [];
    return students.filter(
      (s) => s.universityId === branch.universityId && s.status === 'active'
    );
  }, [students, branch]);

  if (!branch || !election) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Election not found" />
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

  const pos = findPosition(election.position);
  const statusColor = ELECTION_STATUS_COLORS[election.status];
  const isActive = ['nominations_open', 'campaign', 'voting'].includes(election.status);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3000);
  };

  const handleNominate = (e) => {
    e.preventDefault();
    if (!currentStudent) {
      showFeedback('error', 'Please sign in to nominate yourself.');
      return;
    }
    const result = submitNomination({
      electionId: election.id,
      candidateId: currentStudent.id,
      statement: nomStatement,
      experience: nomExperience,
      hoursPerWeek: nomHours,
    });
    if (!result.ok) {
      showFeedback('error', result.error || 'Could not submit nomination.');
      return;
    }
    setShowNominate(false);
    setNomStatement('');
    setNomExperience('');
    setNomHours('');
    showFeedback('success', 'Nomination submitted ✓');
  };

  const handleVote = () => {
    if (!currentStudent) {
      showFeedback('error', 'Please sign in to vote.');
      return;
    }
    if (!selectedCandidate) {
      showFeedback('error', 'Please select a candidate.');
      return;
    }
    if (!confirmChecked) {
      showFeedback('error', 'Please confirm that your vote is final.');
      return;
    }
    const result = castBallot({
      electionId: election.id,
      voterId: currentStudent.id,
      candidateId: selectedCandidate,
    });
    if (!result.ok) {
      showFeedback('error', result.error || 'Could not cast ballot.');
      return;
    }
    setSelectedCandidate('');
    setConfirmChecked(false);
    showFeedback('success', 'Ballot cast ✓ (secret — your choice is not displayed anywhere)');
  };

  const handleComplaint = (e) => {
    e.preventDefault();
    if (!currentStudent) {
      showFeedback('error', 'Please sign in to file a complaint.');
      return;
    }
    const result = fileElectionComplaint({
      electionId: election.id,
      complainantId: currentStudent.id,
      text: complaintText,
    });
    if (!result.ok) {
      showFeedback('error', result.error || 'Could not file complaint.');
      return;
    }
    setComplaintText('');
    setShowComplaint(false);
    showFeedback('success', 'Complaint filed ✓ — Election Committee will review.');
  };

  return (
    <ClubLayout user={currentStudent} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title={`Election — ${pos?.title || election.position}`}
            subtitle={`${branch.name} · IBARA YA 30–34`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/elections`)}
            >
              ← All elections
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {/* Status hero */}
        <section
          className="club-position-hero"
          style={{ background: `linear-gradient(135deg, ${statusColor}, ${statusColor}cc)` }}
        >
          <span className="club-position-hero-icon">{pos?.icon || '🗳️'}</span>
          <div>
            <h1 className="club-position-hero-title">
              {ELECTION_STATUS_LABELS[election.status]}
            </h1>
            <p className="club-position-hero-sub">
              {pos?.title} · {branch.name}
            </p>
            <p className="club-position-hero-summary">
              {election.status === 'nominations_open' &&
                `Nominations close ${formatDate(election.nominationsEndAt)}. Submit your candidacy to stand for election.`}
              {election.status === 'campaign' &&
                `Campaign ends ${formatDate(election.campaignEndAt)}. Review the candidates and ask questions before voting opens.`}
              {election.status === 'voting' &&
                `Voting closes ${formatDate(election.votingEndAt)}. Cast your secret ballot — one vote per active member.`}
              {election.status === 'closed' &&
                `Closed ${formatDate(election.closedAt)}. ${election.results?.winnerId ? 'A winner has been elected.' : 'No winner was elected.'}`}
              {election.status === 'cancelled' && 'This election was cancelled.'}
            </p>
          </div>
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
          {/* Left: schedule + status */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Schedule</h2>
              <span className="card-link">IBARA YA 30</span>
            </div>
            <dl className="club-exec-card-meta">
              <div>
                <dt>Nominations open until</dt>
                <dd>{formatDate(election.nominationsEndAt)}</dd>
              </div>
              <div>
                <dt>Campaign until</dt>
                <dd>{formatDate(election.campaignEndAt)}</dd>
              </div>
              <div>
                <dt>Voting until</dt>
                <dd>{formatDate(election.votingEndAt)}</dd>
              </div>
              <div>
                <dt>Opened</dt>
                <dd>{formatDate(election.openedAt)}</dd>
              </div>
              <div>
                <dt>Candidates</dt>
                <dd>{nominations.length}</dd>
              </div>
              <div>
                <dt>Ballots cast</dt>
                <dd>{totalBallots}</dd>
              </div>
            </dl>

            {/* Stage controls — Patron / Chair only */}
            {isActive ? (
              <div style={{ marginTop: 16 }}>
                <p className="club-footnote">
                  Election Committee / Patron controls — advance the election stage when the current period ends.
                </p>
                <div className="club-stage-buttons">
                  {election.status === 'nominations_open' ? (
                    <button
                      type="button"
                      className="club-btn-secondary club-btn-sm"
                      onClick={() => advanceElectionStage(election.id, 'campaign')}
                    >
                      Close nominations → Campaign
                    </button>
                  ) : null}
                  {election.status === 'campaign' ? (
                    <button
                      type="button"
                      className="club-btn-secondary club-btn-sm"
                      onClick={() => advanceElectionStage(election.id, 'voting')}
                    >
                      Open voting →
                    </button>
                  ) : null}
                  {election.status === 'voting' ? (
                    <button
                      type="button"
                      className="club-btn-primary club-btn-sm"
                      onClick={() => {
                        const result = tallyAndClose(election.id);
                        if (result.ok) showFeedback('success', 'Tallied & closed ✓');
                        else if (result.tied) showFeedback('error', result.message);
                        else showFeedback('error', result.error || 'Could not close.');
                      }}
                    >
                      Tally votes &amp; close
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          {/* Right: candidacy requirements + sign in prompt */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Eligibility (IBARA YA 31)</h2>
            </div>
            <ul className="club-duty-list">
              {CANDIDACY_REQUIREMENTS.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
            {!currentStudent ? (
              <button
                className="club-btn-primary"
                style={{ marginTop: 14 }}
                onClick={() => navigate('/club/login')}
              >
                Sign in to nominate or vote
              </button>
            ) : currentStudent.status !== 'active' ? (
              <p className="club-footnote" style={{ marginTop: 14 }}>
                Your account must be <strong>active</strong> to nominate or vote.
                Contact your Club Leader if you think this is wrong.
              </p>
            ) : null}
          </section>
        </div>

        {/* Nominations panel (active during nominations_open) */}
        {election.status === 'nominations_open' ? (
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Nominations</h2>
              <span className="card-link">{nominations.length} candidate{nominations.length === 1 ? '' : 's'}</span>
            </div>
            {nominations.length === 0 ? (
              <p className="club-empty">No candidates yet. Be the first to stand!</p>
            ) : (
              <div className="club-member-list">
                {nominations.map((n) => {
                  const member = students.find((s) => s.id === n.candidateId);
                  return (
                    <div key={n.id} className="club-member-row">
                      <div className="club-member-avatar">
                        {member
                          ? member.fullName
                              .split(' ')
                              .map((p) => p[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()
                          : '?'}
                      </div>
                      <div className="club-member-info">
                        <p className="club-member-name">{member?.fullName || n.candidateId}</p>
                        <p className="club-member-meta">
                          {n.hoursPerWeek} hr/week available · Nominated {formatDate(n.nominatedAt)}
                        </p>
                        {n.statement ? (
                          <p className="club-member-bio">"{n.statement}"</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentStudent && currentStudent.status === 'active' && !isCandidate ? (
              showNominate ? (
                <form onSubmit={handleNominate} style={{ marginTop: 16 }}>
                  <div className="club-form-group">
                    <label className="club-form-label">Statement *</label>
                    <textarea
                      className="club-form-textarea"
                      rows={4}
                      placeholder="Why are you standing for this position? What will you do?"
                      value={nomStatement}
                      onChange={(e) => setNomStatement(e.target.value)}
                    />
                  </div>
                  <div className="club-form-group">
                    <label className="club-form-label">Relevant experience</label>
                    <textarea
                      className="club-form-textarea"
                      rows={3}
                      placeholder="Past leadership roles, projects, skills…"
                      value={nomExperience}
                      onChange={(e) => setNomExperience(e.target.value)}
                    />
                  </div>
                  <div className="club-form-group">
                    <label className="club-form-label">Hours per week available</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      className="club-form-input"
                      placeholder="e.g. 6"
                      value={nomHours}
                      onChange={(e) => setNomHours(e.target.value)}
                    />
                  </div>
                  <div className="club-pending-actions">
                    <button type="submit" className="club-btn-primary club-btn-sm">
                      Submit nomination
                    </button>
                    <button
                      type="button"
                      className="club-btn-secondary club-btn-sm"
                      onClick={() => setShowNominate(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="club-btn-primary"
                  style={{ width: 'auto', padding: '10px 18px', marginTop: 14 }}
                  onClick={() => setShowNominate(true)}
                >
                  Nominate yourself →
                </button>
              )
            ) : null}

            {isCandidate ? (
              <p className="club-footnote" style={{ marginTop: 14 }}>
                ✓ You have already nominated yourself for this position.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Campaign panel */}
        {election.status === 'campaign' && nominations.length > 0 ? (
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Candidates &amp; manifestos</h2>
              <span className="card-link">Campaign period</span>
            </div>
            <div className="club-exec-grid">
              {nominations.map((n) => {
                const member = students.find((s) => s.id === n.candidateId);
                return (
                  <article
                    key={n.id}
                    className="club-exec-card"
                    style={{ borderTopColor: pos?.color }}
                  >
                    <div className="club-exec-card-top">
                      <span
                        className="club-exec-card-icon"
                        style={{ background: pos?.color }}
                      >
                        {member?.fullName?.[0] || '?'}
                      </span>
                      <div>
                        <h3 className="club-exec-card-title">{member?.fullName || n.candidateId}</h3>
                        <p className="club-exec-card-sub">
                          {n.hoursPerWeek} hr/week
                        </p>
                      </div>
                    </div>
                    <div className="club-exec-card-body">
                      {n.statement ? (
                        <p className="club-member-bio">"{n.statement}"</p>
                      ) : (
                        <p className="club-empty" style={{ padding: 0 }}>No manifesto submitted.</p>
                      )}
                      {n.experience ? (
                        <details className="club-campaign-details">
                          <summary>Experience</summary>
                          <p className="club-campaign-details-body">{n.experience}</p>
                        </details>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Voting panel */}
        {election.status === 'voting' ? (
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">🗳️ Cast your ballot</h2>
              <span className="card-link">Secret ballot · IBARA YA 30</span>
            </div>
            {alreadyVoted ? (
              <p className="club-footnote">
                ✓ You have already voted in this election. Your choice is secret and
                cannot be changed. The results will be published when voting closes.
              </p>
            ) : !currentStudent || currentStudent.status !== 'active' ? (
              <p className="club-empty">
                Only active members can vote. Sign in or contact your Club Leader.
              </p>
            ) : nominations.length === 0 ? (
              <p className="club-empty">No candidates — voting cannot proceed.</p>
            ) : (
              <>
                <p className="club-footnote" style={{ marginBottom: 12 }}>
                  Your vote is <strong>secret</strong> — it is stored separately from this
                  election record and only contributes to the final tally.
                </p>
                <div className="club-ballot-list">
                  {nominations.map((n) => {
                    const member = students.find((s) => s.id === n.candidateId);
                    return (
                      <label
                        key={n.id}
                        className={`club-ballot-row ${selectedCandidate === n.candidateId ? 'is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="ballot"
                          value={n.candidateId}
                          checked={selectedCandidate === n.candidateId}
                          onChange={() => setSelectedCandidate(n.candidateId)}
                        />
                        <div className="club-ballot-row-info">
                          <p className="club-member-name">{member?.fullName || n.candidateId}</p>
                          {n.statement ? (
                            <p className="club-member-bio">"{n.statement}"</p>
                          ) : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
                <label className="club-ballot-confirm">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                  />
                  <span>
                    I confirm this is my final choice and understand my vote cannot be changed.
                  </span>
                </label>
                <button
                  type="button"
                  className="club-btn-primary"
                  style={{ width: 'auto', padding: '12px 22px', marginTop: 12 }}
                  onClick={handleVote}
                  disabled={!selectedCandidate || !confirmChecked}
                >
                  Cast ballot
                </button>
              </>
            )}
          </section>
        ) : null}

        {/* Results */}
        {election.status === 'closed' && election.results ? (
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">📊 Results</h2>
              <span className="card-link">
                {election.results.totalBallots} ballot{election.results.totalBallots === 1 ? '' : 's'} cast
              </span>
            </div>
            <div className="club-results-list">
              {[...nominations]
                .sort((a, b) => (election.results.counts[b.candidateId] || 0) - (election.results.counts[a.candidateId] || 0))
                .map((n, idx) => {
                  const member = students.find((s) => s.id === n.candidateId);
                  const votes = election.results.counts[n.candidateId] || 0;
                  const isWinner = election.results.winnerId === n.candidateId;
                  const pct = election.results.totalBallots > 0
                    ? Math.round((votes / election.results.totalBallots) * 100)
                    : 0;
                  return (
                    <div
                      key={n.id}
                      className={`club-results-row ${isWinner ? 'is-winner' : ''}`}
                    >
                      <div className="club-results-row-head">
                        <span className="club-results-row-rank">#{idx + 1}</span>
                        <span className="club-member-name">
                          {member?.fullName || n.candidateId}
                        </span>
                        {isWinner ? (
                          <span className="club-badge club-badge-active">🏆 Elected</span>
                        ) : null}
                        <span className="club-results-row-votes">
                          {votes} vote{votes === 1 ? '' : 's'} · {pct}%
                        </span>
                      </div>
                      <div className="club-results-bar">
                        <div
                          className="club-results-bar-fill"
                          style={{ width: `${pct}%`, background: isWinner ? pos?.color : '#cbd5e1' }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            {election.results.winnerId ? (
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="club-btn-primary club-btn-sm"
                  onClick={() => {
                    const result = installElectionWinner(election.id);
                    if (result.ok) showFeedback('success', 'Winner installed as new executive ✓');
                    else showFeedback('error', result.error || 'Could not install winner.');
                  }}
                >
                  Install winner as new {pos?.title || election.position}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Complaints (IBARA YA 32) */}
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Complaints &amp; objections</h2>
            <span className="card-link">
              {election.complaints?.length || 0} filed
            </span>
          </div>
          {(election.complaints || []).length === 0 ? (
            <p className="club-empty">No complaints filed.</p>
          ) : (
            <div className="club-complaint-list">
              {election.complaints.map((c) => (
                <div key={c.id} className="club-complaint-row">
                  <p className="club-complaint-meta">
                    Filed {formatDate(c.filedAt)} · {c.resolved ? '✓ Resolved' : '⏳ Open'}
                  </p>
                  <p className="club-complaint-text">{c.text}</p>
                  {c.resolution ? (
                    <p className="club-complaint-resolution">Resolution: {c.resolution}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {currentStudent ? (
            showComplaint ? (
              <form onSubmit={handleComplaint} style={{ marginTop: 14 }}>
                <textarea
                  className="club-form-textarea"
                  rows={3}
                  placeholder="Describe the issue or objection. The Election Committee will review."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                />
                <div className="club-pending-actions" style={{ marginTop: 8 }}>
                  <button type="submit" className="club-btn-primary club-btn-sm">
                    Submit complaint
                  </button>
                  <button
                    type="button"
                    className="club-btn-secondary club-btn-sm"
                    onClick={() => setShowComplaint(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="club-btn-secondary club-btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => setShowComplaint(true)}
              >
                File a complaint
              </button>
            )
          ) : null}
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}