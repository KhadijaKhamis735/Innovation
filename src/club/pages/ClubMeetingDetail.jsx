import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import {
  MEETING_STATUS_LABELS,
  MEETING_STATUS_COLORS,
} from '../data/meetings';
import '../styles/ClubShared.css';

// IBARA YA 35–37 — Meeting Detail
// Central hub: status, attendance quorum, agenda, minutes overview, decisions.

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

export default function ClubMeetingDetail() {
  const { branchId, meetingId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    meetingById,
    findMeetingType,
    attendanceForMeeting,
    minutesForMeeting,
    decisionsForMeeting,
    quorumForMeeting,
    membersForBranch,
    students,
    startMeeting,
    cancelMeeting,
    approveMinutes,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const meeting = meetingById(meetingId);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

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

  const type = findMeetingType(meeting.type);
  const statusColor = MEETING_STATUS_COLORS[meeting.status];
  const attendees = attendanceForMeeting(meeting.id);
  const quorum = quorumForMeeting(meeting);
  const minutes = minutesForMeeting(meeting.id);
  const decisions = decisionsForMeeting(meeting.id);
  const branchActiveMembers = membersForBranch(branch.id, null, 'active');

  const canRun = currentStudent && (currentStudent.status === 'active' || !!currentClubLeader);
  const isComplete = meeting.status === 'completed';
  const isCancelled = meeting.status === 'cancelled';

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3500);
  };

  const handleStart = () => {
    startMeeting(meeting.id, currentStudent?.id || currentClubLeader?.id || null);
    showFeedback('success', 'Meeting marked as in-progress.');
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      showFeedback('error', 'Please provide a reason for cancellation.');
      return;
    }
    cancelMeeting(meeting.id, currentStudent?.id || currentClubLeader?.id || null, cancelReason);
    setShowCancel(false);
    showFeedback('success', 'Meeting cancelled.');
  };

  const handleApproveMinutes = () => {
    approveMinutes(meeting.id, currentStudent?.id || currentClubLeader?.id || null);
    showFeedback('success', 'Minutes approved & meeting closed ✓');
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title={meeting.title}
            subtitle={`${branch.name} · IBARA YA 35–37`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/meetings`)}
            >
              ← Calendar
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {/* Status hero */}
        <section
          className="club-position-hero"
          style={{
            background: `linear-gradient(135deg, ${type?.color || statusColor}, ${(type?.color || statusColor)}cc)`,
            opacity: isCancelled ? 0.7 : 1,
          }}
        >
          <span className="club-position-hero-icon">{type?.icon || '🗓️'}</span>
          <div>
            <h1 className="club-position-hero-title">{type?.label || meeting.type}</h1>
            <p className="club-position-hero-sub">
              {MEETING_STATUS_LABELS[meeting.status] || 'Scheduled'} · {formatDateTime(meeting.date)}
            </p>
            <p className="club-position-hero-summary">
              {meeting.location}
              {meeting.isOnline && meeting.meetingUrl ? ' · Online link shared below' : ''}
            </p>
            {meeting.isOnline && meeting.meetingUrl ? (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="club-btn-primary club-btn-sm"
                style={{ marginTop: 14, width: 'auto', display: 'inline-flex' }}
              >
                Join online meeting →
              </a>
            ) : null}
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
          {/* Schedule + quorum */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Attendance &amp; quorum</h2>
              <span className="card-link">IBARA YA 35</span>
            </div>
            <div className="club-quorum-meter">
              <div className="club-quorum-meter-track">
                <div
                  className="club-quorum-meter-fill"
                  style={{
                    width: `${Math.min(100, (quorum.present / Math.max(1, quorum.required)) * 100)}%`,
                    background: quorum.met ? '#22c55e' : 'var(--club-orange)',
                  }}
                />
              </div>
              <p className="club-quorum-meter-label">
                <strong>{quorum.present}</strong> / {quorum.required} required
                {quorum.met ? ' ✅ Quorum met' : ' ⏳ Quorum not yet met'}
              </p>
            </div>
            {attendees.length > 0 ? (
              <div className="club-attendee-grid">
                {attendees.map((id) => {
                  const m = students.find((s) => s.id === id);
                  if (!m) return null;
                  return (
                    <div key={id} className="club-attendee-chip">
                      <div className="club-attendee-avatar">
                        {m.fullName
                          .split(' ')
                          .map((p) => p[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="club-attendee-name">{m.fullName}</p>
                        <p className="club-attendee-meta">{m.regNumber || m.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="club-empty">No one marked attendance yet.</p>
            )}
            <button
              type="button"
              className="club-btn-primary"
              style={{ width: 'auto', padding: '10px 18px', marginTop: 14 }}
              onClick={() => navigate(`/club/branches/${branch.id}/meetings/${meeting.id}/attendance`)}
            >
              Manage attendance →
            </button>
          </section>

          {/* Agenda */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Agenda</h2>
              <span className="card-link">Convened for discussion</span>
            </div>
            {meeting.agenda ? (
              <pre className="club-agenda">{meeting.agenda}</pre>
            ) : (
              <p className="club-empty">No agenda was provided.</p>
            )}
            <dl className="club-exec-card-meta" style={{ marginTop: 14 }}>
              <div>
                <dt>Format</dt>
                <dd>{meeting.isOnline ? 'Online' : 'In-person'}</dd>
              </div>
              <div>
                <dt>Active members in branch</dt>
                <dd>{branchActiveMembers.length}</dd>
              </div>
              <div>
                <dt>Notifications sent</dt>
                <dd>{meeting.notifiedAt ? formatDateTime(meeting.notifiedAt) : 'Pending'}</dd>
              </div>
              <div>
                <dt>Quorum rule</dt>
                <dd>{type?.quorum}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Decisions (IBARA YA 36) */}
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2 className="card-title">🗳️ Decisions &amp; votes</h2>
            <span className="card-link">
              {decisions.length} decision{decisions.length === 1 ? '' : 's'}
            </span>
          </div>
          {decisions.length === 0 ? (
            <p className="club-empty">No decisions proposed yet.</p>
          ) : (
            <div className="club-decision-list">
              {decisions.map((d) => {
                const forCount = d.ballots?.filter((b) => b.choice === 'for').length || 0;
                const againstCount = d.ballots?.filter((b) => b.choice === 'against').length || 0;
                const abstainCount = d.ballots?.filter((b) => b.choice === 'abstain').length || 0;
                return (
                  <div
                    key={d.id}
                    className={`club-decision-row ${d.outcome ? `is-${d.outcome}` : ''}`}
                  >
                    <div className="club-decision-row-head">
                      <p className="club-decision-row-text">{d.description}</p>
                      {d.outcome === 'passed' ? (
                        <span className="club-badge club-badge-active">✓ Passed</span>
                      ) : d.outcome === 'failed' ? (
                        <span className="club-badge club-badge-suspended">✗ Failed</span>
                      ) : (
                        <span className="club-badge club-badge-pending">Open</span>
                      )}
                    </div>
                    <p className="club-decision-row-meta">
                      Threshold {Math.round((d.threshold || 0.5) * 100)}% · For {forCount} · Against {againstCount} · Abstain {abstainCount}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          {canRun && !isCancelled ? (
            <button
              type="button"
              className="club-btn-primary club-btn-sm"
              style={{ marginTop: 12, width: 'auto', padding: '10px 18px' }}
              onClick={() => navigate(`/club/branches/${branch.id}/meetings/${meeting.id}/votes`)}
            >
              Propose decision &amp; vote →
            </button>
          ) : null}
        </section>

        {/* Minutes (IBARA YA 37) */}
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2 className="card-title">📝 Minutes (Kumbukumbu)</h2>
            <span className="card-link">
              {meeting.minutesApprovedAt ? '✓ Approved' : 'Draft'}
            </span>
          </div>
          {minutes && minutes.items?.length > 0 ? (
            <ol className="club-minutes-list">
              {minutes.items.map((it, idx) => (
                <li key={it.id || idx}>
                  <div className="club-minutes-row-head">
                    <strong>{it.agendaItem}</strong>
                    {it.decision ? (
                      <span className="club-badge club-badge-active">Decision</span>
                    ) : null}
                  </div>
                  {it.discussion ? <p className="club-minutes-row-text">{it.discussion}</p> : null}
                  {it.decision ? (
                    <p className="club-minutes-row-decision">
                      <strong>Decision:</strong> {it.decision}
                    </p>
                  ) : null}
                  {it.responsible ? (
                    <p className="club-minutes-row-meta">
                      Responsible: {it.responsible}
                      {it.deadline ? ` · Due ${formatDateTime(it.deadline)}` : ''}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="club-empty">No minutes recorded yet.</p>
          )}
          <div className="club-meeting-row-foot" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="club-btn-secondary club-btn-sm"
              onClick={() => navigate(`/club/branches/${branch.id}/meetings/${meeting.id}/minutes`)}
            >
              {minutes ? 'Edit minutes' : 'Add minutes'} →
            </button>
            {minutes && !meeting.minutesApprovedAt && canRun ? (
              <button
                type="button"
                className="club-btn-primary club-btn-sm"
                onClick={handleApproveMinutes}
              >
                Approve &amp; close
              </button>
            ) : null}
          </div>
        </section>

        {/* Controls */}
        {canRun && !isComplete && !isCancelled ? (
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Meeting controls</h2>
              <span className="card-link">Secretary / Chair</span>
            </div>
            <div className="club-stage-buttons">
              {meeting.status === 'scheduled' ? (
                <button
                  type="button"
                  className="club-btn-primary club-btn-sm"
                  onClick={handleStart}
                >
                  Mark as in-progress
                </button>
              ) : null}
              {!showCancel ? (
                <button
                  type="button"
                  className="club-btn-ghost-danger"
                  style={{ width: 'auto', padding: '9px 14px' }}
                  onClick={() => setShowCancel(true)}
                >
                  Cancel meeting
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="club-form-input"
                    placeholder="Reason for cancellation"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <button
                    type="button"
                    className="club-btn-ghost-danger"
                    style={{ width: 'auto', padding: '9px 14px' }}
                    onClick={handleCancel}
                  >
                    Confirm cancel
                  </button>
                  <button
                    type="button"
                    className="club-btn-secondary club-btn-sm"
                    onClick={() => setShowCancel(false)}
                  >
                    Keep
                  </button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {isCancelled && meeting.cancellationReason ? (
          <div
            className="club-error-box"
            style={{ marginTop: 20, background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}
          >
            <strong>Meeting cancelled.</strong> Reason: {meeting.cancellationReason}
          </div>
        ) : null}
      </main>
    </div>
    </ClubLayout>
  );
}