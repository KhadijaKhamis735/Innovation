import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 45 — Disciplinary Hearing (Patron / Chair manages one case)

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return iso; }
};

const STATUS_BADGES = {
  filed: { label: 'Filed', color: '#f59e0b' },
  investigating: { label: 'Investigating', color: '#3b82f6' },
  hearing_scheduled: { label: 'Hearing scheduled', color: '#0ea5e9' },
  resolved: { label: 'Resolved', color: '#22c55e' },
  dismissed: { label: 'Dismissed', color: '#6b7280' },
  appealed: { label: 'Appealed', color: '#a855f7' },
  appeal_upheld: { label: 'Appeal upheld', color: '#22c55e' },
  appeal_overturned: { label: 'Appeal overturned', color: '#ef4444' },
};

export default function ClubDisciplinaryHearing() {
  const { branchId, caseId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    caseById,
    students,
    sanctionLevels,
    updateCaseStatus,
    applySanction,
    dismissCase,
    fileAppeal,
    resolveAppeal,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const case_ = caseById(caseId);
  const me = currentStudent || currentClubLeader;

  const [sanction, setSanction] = useState('');
  const [sanctionDetails, setSanctionDetails] = useState('');
  const [appealText, setAppealText] = useState('');
  const [hearingDate, setHearingDate] = useState(case_?.hearingDate ? case_.hearingDate.slice(0, 16) : '');
  const [investigationNotes, setInvestigationNotes] = useState(case_?.investigationNotes || '');
  const [dismissalReason, setDismissalReason] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const canManage = !!currentClubLeader || (currentStudent && currentStudent.status === 'active');

  if (!branch || !case_) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Case not found" />
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branchId}/discipline`)}>
              ← Cases
            </button>
          </div>
        </header>
      </div>
    );
  }

  const respondent = students.find((s) => s.id === case_.respondentId);
  const complainant = students.find((s) => s.id === case_.complainantId);
  const badge = STATUS_BADGES[case_.status] || { label: case_.status, color: '#94a3b8' };
  const isRespondent = me?.id === case_.respondentId;
  const isComplainant = me?.id === case_.complainantId;

  const flash = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3500);
  };

  const handleStage = (newStatus) => {
    updateCaseStatus(case_.id, newStatus, { hearingDate: hearingDate ? new Date(hearingDate).toISOString() : undefined, investigationNotes });
    flash('success', `Case moved to ${newStatus}.`);
  };

  const handleApply = () => {
    if (!sanction) {
      flash('error', 'Pick a sanction.');
      return;
    }
    const result = applySanction({
      caseId: case_.id,
      sanction,
      sanctionDetails,
      actorId: currentClubLeader?.id || currentStudent?.id || null,
    });
    if (!result.ok) {
      flash('error', result.error || 'Could not apply.');
      return;
    }
    flash('success', `Sanction "${sanction}" applied ✓`);
    setSanction('');
    setSanctionDetails('');
  };

  const handleDismiss = () => {
    if (!dismissalReason.trim()) {
      flash('error', 'Provide a reason.');
      return;
    }
    dismissCase(case_.id, currentClubLeader?.id || currentStudent?.id || null, dismissalReason);
    flash('success', 'Case dismissed.');
  };

  const handleAppeal = () => {
    if (!appealText.trim()) {
      flash('error', 'Provide appeal grounds.');
      return;
    }
    fileAppeal({ caseId: case_.id, memberId: me.id, appealText });
    flash('success', 'Appeal filed ✓');
    setAppealText('');
  };

  const handleResolveAppeal = (decision) => {
    resolveAppeal({
      caseId: case_.id,
      decision,
      actorId: currentClubLeader?.id || currentStudent?.id || null,
      note: '',
    });
    flash('success', decision === 'uphold' ? 'Appeal upheld — sanction reversed' : 'Appeal overturned — sanction stands');
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title={`Disciplinary case vs. ${respondent?.fullName || case_.respondentId}`}
            subtitle={`${branch.name} · IBARA YA 45`}
          />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/discipline`)}>
              ← Cases
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section
          className="club-position-hero"
          style={{ background: `linear-gradient(135deg, ${badge.color}, ${badge.color}cc)` }}
        >
          <span className="club-position-hero-icon">⚠️</span>
          <div>
            <h1 className="club-position-hero-title">{badge.label}</h1>
            <p className="club-position-hero-sub">Filed {formatDateTime(case_.filedAt)}</p>
            <p className="club-position-hero-summary">
              {respondent?.fullName || case_.respondentId} · against complaint by {complainant?.fullName || 'anonymous'}
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
          {/* Complaint summary */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Complaint</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--club-text-2)', lineHeight: 1.6 }}>
              {case_.complaintText}
            </p>
            {case_.sanctionRequested ? (
              <p className="club-footnote" style={{ marginTop: 12 }}>
                Suggested sanction: <strong>{case_.sanctionRequested}</strong>
              </p>
            ) : null}
            <dl className="club-exec-card-meta" style={{ marginTop: 14 }}>
              <div><dt>Complainant</dt><dd>{complainant?.fullName || case_.complainantId}</dd></div>
              <div><dt>Respondent</dt><dd>{respondent?.fullName || case_.respondentId}</dd></div>
              <div><dt>Hearing</dt><dd>{formatDateTime(case_.hearingDate)}</dd></div>
              <div><dt>Sanction applied</dt><dd>{case_.sanction || '—'}</dd></div>
            </dl>
          </section>

          {/* Case management */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Manage case</h2>
              <span className="card-link">Patron / Chair</span>
            </div>
            {canManage && ['filed', 'investigating'].includes(case_.status) ? (
              <>
                <div className="club-form-group">
                  <label className="club-form-label">Investigation notes</label>
                  <textarea
                    className="club-form-textarea"
                    rows={3}
                    value={investigationNotes}
                    onChange={(e) => setInvestigationNotes(e.target.value)}
                  />
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Hearing date</label>
                  <input
                    type="datetime-local"
                    className="club-form-input"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                  />
                </div>
                <div className="club-stage-buttons">
                  <button
                    type="button"
                    className="club-btn-secondary club-btn-sm"
                    onClick={() => handleStage('investigating')}
                  >
                    Move to investigating
                  </button>
                  <button
                    type="button"
                    className="club-btn-secondary club-btn-sm"
                    onClick={() => handleStage('hearing_scheduled')}
                  >
                    Schedule hearing
                  </button>
                </div>
              </>
            ) : null}

            {canManage && ['hearing_scheduled', 'investigating'].includes(case_.status) ? (
              <div style={{ marginTop: 16 }}>
                <h3 className="card-title" style={{ fontSize: 14, margin: '12px 0 8px' }}>Apply sanction</h3>
                <div className="club-form-group">
                  <label className="club-form-label">Sanction *</label>
                  <select className="club-form-input" value={sanction} onChange={(e) => setSanction(e.target.value)}>
                    <option value="">— Choose a sanction —</option>
                    {sanctionLevels.map((s) => (
                      <option key={s.id} value={s.id}>{s.label} (severity {s.severity})</option>
                    ))}
                  </select>
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Details / rationale</label>
                  <textarea
                    className="club-form-textarea"
                    rows={3}
                    value={sanctionDetails}
                    onChange={(e) => setSanctionDetails(e.target.value)}
                  />
                </div>
                <div className="club-stage-buttons">
                  <button type="button" className="club-btn-primary club-btn-sm" onClick={handleApply}>
                    Apply sanction
                  </button>
                  <button type="button" className="club-btn-secondary club-btn-sm" onClick={() => handleStage('resolved')}>
                    Mark resolved (no sanction)
                  </button>
                </div>
                <div style={{ marginTop: 12 }}>
                  <input
                    type="text"
                    className="club-form-input"
                    placeholder="Reason for dismissal"
                    value={dismissalReason}
                    onChange={(e) => setDismissalReason(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <button type="button" className="club-btn-ghost-danger" onClick={handleDismiss}>
                    Dismiss case
                  </button>
                </div>
              </div>
            ) : null}

            {case_.status === 'resolved' && isRespondent ? (
              <div style={{ marginTop: 16 }}>
                <h3 className="card-title" style={{ fontSize: 14 }}>File an appeal</h3>
                <p style={{ fontSize: 13, color: 'var(--club-text-2)' }}>
                  If you were sanctioned, you may appeal to the General Meeting (Mkutano Mkuu).
                </p>
                <textarea
                  className="club-form-textarea"
                  rows={3}
                  placeholder="Grounds for appeal"
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                />
                <button type="button" className="club-btn-primary club-btn-sm" onClick={handleAppeal} style={{ marginTop: 8 }}>
                  File appeal
                </button>
              </div>
            ) : null}

            {case_.status === 'appealed' && canManage ? (
              <div style={{ marginTop: 16 }}>
                <h3 className="card-title" style={{ fontSize: 14 }}>Resolve appeal</h3>
                <p style={{ fontSize: 13, color: 'var(--club-text-2)' }}>
                  <strong>Grounds:</strong> {case_.appealText}
                </p>
                <div className="club-stage-buttons">
                  <button
                    type="button"
                    className="club-btn-primary club-btn-sm"
                    onClick={() => handleResolveAppeal('overturn')}
                  >
                    Overturn appeal · sanction stands
                  </button>
                  <button
                    type="button"
                    className="club-btn-secondary club-btn-sm"
                    onClick={() => handleResolveAppeal('uphold')}
                  >
                    Uphold appeal · reverse sanction
                  </button>
                </div>
              </div>
            ) : null}

            {case_.status === 'resolved' && case_.sanction ? (
              <p className="club-footnote" style={{ marginTop: 14 }}>
                ✓ Sanction applied: <strong>{case_.sanction}</strong> — {case_.sanctionDetails}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}