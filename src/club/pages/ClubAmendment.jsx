import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import { translate } from '../i18n/strings';
import '../styles/ClubShared.css';

// IBARA YA 46 — Propose + Vote on a Constitutional Amendment

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return iso; }
};

export default function ClubAmendmentDetail() {
  const { branchId, amendmentId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    ibaraList,
    amendmentById,
    votesOnAmendment,
    meetingsForBranch,
    castAmendmentVote,
    openAmendmentVoting,
    tallyAndCloseAmendment,
    preferences,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const amendment = amendmentId ? amendmentById(amendmentId) : null;
  const branchMeetings = branch ? meetingsForBranch(branch.id) : [];
  const isSw = preferences?.language === 'sw';

  const [meetingId, setMeetingId] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  const [decisionMeetingId, setDecisionMeetingId] = useState('');

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

  if (!amendment) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Amendment not found" />
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/constitution`)}>
              ← Constitution
            </button>
          </div>
        </header>
      </div>
    );
  }

  const article = ibaraList.find((a) => a.number === amendment.articleNumber);
  const me = currentStudent || currentClubLeader;
  const votes = votesOnAmendment(amendment.id);
  const userVote = me ? votes.find((v) => v.voterId === me.id) : null;
  const votesFor = votes.filter((v) => v.choice === 'for').length;
  const votesAgainst = votes.filter((v) => v.choice === 'against').length;
  const votesAbstain = votes.filter((v) => v.choice === 'abstain').length;
  const considered = votesFor + votesAgainst;
  const forRatio = considered > 0 ? (votesFor / considered) * 100 : 0;
  const passed = forRatio / 100 >= amendment.threshold;
  const canVote = me && me.status === 'active';
  const canManage = !!currentClubLeader || (currentStudent && currentStudent.status === 'active');

  const flash = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3000);
  };

  const handleVote = (choice) => {
    if (!me || me.status !== 'active') {
      flash('error', isSw ? 'Wanachama hai tu ndio wanaopiga kura.' : 'Only active members can vote.');
      return;
    }
    const result = castAmendmentVote(amendment.id, me.id, choice);
    if (!result.ok) {
      flash('error', result.error);
    } else {
      flash('success', isSw ? `Kura imerekodiwa: ${choice}` : `Vote recorded: ${choice}`);
    }
  };

  const handleOpenVoting = () => {
    if (!meetingId) {
      flash('error', isSw ? 'Tafadhali chagua mkutano wenye quorum.' : 'Pick a quorum meeting.');
      return;
    }
    openAmendmentVoting(amendment.id, meetingId);
    flash('success', isSw ? 'Kupiga kura kumefunguliwa.' : 'Voting opened.');
  };

  const handleClose = () => {
    const result = tallyAndCloseAmendment(amendment.id, decisionMeetingId || null);
    if (!result.ok) {
      flash('error', result.error);
    } else {
      flash('success', result.passed ? (isSw ? 'Marekebisho yamepitishwa ✓' : 'Amendment passed ✓') : (isSw ? 'Marekebisho yamepigwa.' : 'Amendment rejected.'));
    }
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title={`${translate(preferences, 'articleShort')} ${amendment.articleNumber} — ${isSw ? 'Marekebisho' : 'Amendment'}`}
            subtitle={`${branch.name} · IBARA YA 46`}
          />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/constitution`)}>
              ← {translate(preferences, 'constitution')}
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

        <section
          className="club-position-hero"
          style={{ background: passed ? '#22c55e' : amendment.status === 'voting' ? '#10b981' : '#f59e0b' }}
        >
          <span className="club-position-hero-icon">{passed ? '✓' : '🗳️'}</span>
          <div>
            <h1 className="club-position-hero-title">
              {isSw ? 'Ibara' : 'Article'} {amendment.articleNumber} · {isSw ? 'Marekebisho' : 'Amendment'}
            </h1>
            <p className="club-position-hero-sub">{amendment.status}</p>
            <p className="club-position-hero-summary">{translate(preferences, 'requiresTwoThirds')}</p>
          </div>
        </section>

        <div className="club-branch-grid-2">
          {/* Diff */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">{translate(preferences, 'proposedText')}</h2>
            </div>
            <div className="amendment-diff">
              <div className="amendment-diff-pane is-current">
                <p className="amendment-diff-label">CURRENT</p>
                <p className="amendment-diff-text">{article?.kiswahili || amendment.currentText}</p>
              </div>
              <div className="amendment-diff-arrow">→</div>
              <div className="amendment-diff-pane is-proposed">
                <p className="amendment-diff-label">PROPOSED</p>
                <p className="amendment-diff-text">{amendment.proposedText}</p>
              </div>
            </div>
            {amendment.rationale ? (
              <div className="club-footnote" style={{ marginTop: 14 }}>
                <strong>{translate(preferences, 'rationale')}:</strong> {amendment.rationale}
              </div>
            ) : null}
          </section>

          {/* Vote panel */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Ballot · {amendment.status === 'voting' || amendment.status === 'debating' ? 'Open' : 'Closed'}</h2>
              <span className="card-link">{considered} {isSw ? 'kura zilizohesabiwa' : 'votes counted'}</span>
            </div>

            {considered > 0 ? (
              <div className="audit-log" style={{ marginBottom: 14 }}>
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
            ) : null}

            {considered > 0 ? (
              <div className="amendment-bar">
                <div className="amendment-bar-fill" style={{ width: `${forRatio}%`, background: passed ? '#22c55e' : '#ef4444' }} />
                <div className="amendment-bar-mark" style={{ left: `${amendment.threshold * 100}%` }} />
              </div>
            ) : null}
            <p className="amendment-threshold-label">
              Threshold: {Math.round(amendment.threshold * 100)}% ({isSw ? '⅔' : 'two-thirds'})
            </p>

            {(amendment.status === 'voting' || amendment.status === 'debating') && canVote ? (
              <div className="club-vote-buttons" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="club-vote-btn club-vote-btn-for"
                  disabled={amendment.status === 'debating'}
                  onClick={() => handleVote('for')}
                >
                  👍 For
                </button>
                <button
                  type="button"
                  className="club-vote-btn club-vote-btn-against"
                  disabled={amendment.status === 'debating'}
                  onClick={() => handleVote('against')}
                >
                  ✋ Against
                </button>
                <button
                  type="button"
                  className="club-vote-btn"
                  style={{ background: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' }}
                  disabled={amendment.status === 'debating'}
                  onClick={() => handleVote('abstain')}
                >
                  🤷 Abstain
                </button>
              </div>
            ) : null}

            {amendment.status === 'debating' && canManage ? (
              <div style={{ marginTop: 14 }}>
                <p className="club-form-sublabel" style={{ marginBottom: 6 }}>
                  Open voting for the amendment at a quorum meeting.
                </p>
                <select className="club-form-input" value={meetingId} onChange={(e) => setMeetingId(e.target.value)}>
                  <option value="">— Pick a quorum meeting —</option>
                  {branchMeetings.filter((m) => m.status !== 'cancelled').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} · {formatDate(m.date)}
                    </option>
                  ))}
                </select>
                <button type="button" className="club-btn-primary club-btn-sm" style={{ marginTop: 8 }} onClick={handleOpenVoting}>
                  Open voting
                </button>
              </div>
            ) : null}

            {amendment.status === 'voting' && canManage ? (
              <div style={{ marginTop: 14 }}>
                <p className="club-form-sublabel" style={{ marginBottom: 6 }}>
                  Pick the meeting at which the decision is being closed.
                </p>
                <select className="club-form-input" value={decisionMeetingId} onChange={(e) => setDecisionMeetingId(e.target.value)}>
                  <option value="">— Decision meeting —</option>
                  {branchMeetings.filter((m) => m.status !== 'cancelled').map((m) => (
                    <option key={m.id} value={m.id}>{m.title} · {formatDate(m.date)}</option>
                  ))}
                </select>
                <button type="button" className="club-btn-primary club-btn-sm" style={{ marginTop: 8 }} onClick={handleClose}>
                  Tally &amp; close
                </button>
              </div>
            ) : null}

            {amendment.status === 'passed' || amendment.status === 'rejected' ? (
              <div
                className="club-error-box"
                style={{
                  marginTop: 14,
                  background: amendment.status === 'passed' ? '#dcfce7' : '#fef2f2',
                  borderColor: amendment.status === 'passed' ? '#bbf7d0' : '#fecaca',
                  color: amendment.status === 'passed' ? '#15803d' : '#b91c1c',
                }}
              >
                {amendment.status === 'passed'
                  ? '🟩 ' + (isSw ? 'Marekebisho yamepitishwa kwa theluthi mbili ya kura.' : 'Amendment passed with two-thirds majority.')
                  : '🟥 ' + (isSw ? 'Marekebisho hayakupata theluthi mbili ya kura.' : 'Amendment did not reach the two-thirds threshold.')}
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}