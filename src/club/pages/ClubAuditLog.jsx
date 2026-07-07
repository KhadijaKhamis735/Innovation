import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 41 — Audit Log
// Patron / leadership can see all major state transitions for transparency.

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return iso; }
};

const TYPE_LABELS = {
  registered: 'Member registered',
  approved: 'Member approved',
  rejected: 'Member rejected',
  suspended: 'Member suspended',
  reinstated: 'Member reinstated',
  expelled: 'Member expelled',
  withdrawn: 'Membership withdrawn',
  executive_appointed: 'Executive appointed',
  executive_removed: 'Executive removed',
  executive_replaced: 'Executive replaced by election',
  handover_completed: 'Handover completed',
  election_announced: 'Election announced',
  election_stage_changed: 'Election stage changed',
  election_closed: 'Election closed',
  nomination_submitted: 'Nomination submitted',
  ballot_cast: 'Ballot cast (secret)',
  no_confidence_opened: 'Vote of no confidence opened',
  meeting_scheduled: 'Meeting scheduled',
  meeting_started: 'Meeting started',
  meeting_cancelled: 'Meeting cancelled',
  minutes_approved: 'Minutes approved',
  ip_registered: 'IP registered',
};

export default function ClubAuditLog() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { branchById, universities, membershipHistory, students, completeAudit, auditLogs } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);

  const [selectedAudit, setSelectedAudit] = useState(null);
  const [auditFindings, setAuditFindings] = useState(['']);

  // Filter to events related to this branch
  const branchEvents = branch
    ? membershipHistory.filter((h) => h.branchId === branch.id).slice(0, 100)
    : [];
  const branchAudits = branch ? auditLogs.filter((a) => a.branchId === branch.id) : [];

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

  return (
    <ClubLayout userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Audit Log" subtitle={`${branch.name} · IBARA YA 41`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/treasury`)}>
              ← Treasury
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">About this log</h2>
            <span className="card-link">IBARA YA 41</span>
          </div>
          <p style={{ margin: 0, color: 'var(--club-text-2)', lineHeight: 1.6 }}>
            This is a tamper-evident history of every major state change affecting
            the branch — membership approvals, suspensions, executive changes,
            handovers, meetings, elections, and IP registrations. Ballots are recorded
            without naming the chosen candidate to preserve the secret ballot.
          </p>
        </section>

        {branchAudits.length > 0 ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Requested audits</h2>
              <span className="card-link">{branchAudits.length} total</span>
            </div>
            <div className="treasury-tx-list">
              {branchAudits.map((a) => (
                <div key={a.id} className="treasury-tx-row" style={{ alignItems: 'flex-start' }}>
                  <div className="treasury-tx-icon">🔍</div>
                  <div className="treasury-tx-body">
                    <p className="treasury-tx-title">Audit · {a.status}</p>
                    <p className="treasury-tx-meta">
                      {a.scope} · Requested {formatDateTime(a.requestedAt)}
                      {a.note ? ` · "${a.note}"` : ''}
                    </p>
                    {a.findings?.length > 0 ? (
                      <div style={{ marginTop: 6 }}>
                        <strong style={{ fontSize: 12, color: 'var(--club-text-2)' }}>Findings:</strong>
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--club-text-2)' }}>
                          {a.findings.map((f, idx) => <li key={idx}>{f}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  {a.status === 'requested' ? (
                    <button
                      type="button"
                      className="club-btn-secondary club-btn-sm"
                      onClick={() => {
                        setSelectedAudit(a);
                        setAuditFindings(['']);
                      }}
                    >
                      Complete audit
                    </button>
                  ) : (
                    <span className="club-badge club-badge-active">Completed</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Event history</h2>
            <span className="card-link">{branchEvents.length} events</span>
          </div>
          {branchEvents.length === 0 ? (
            <p className="club-empty">No history yet.</p>
          ) : (
            <ol className="audit-log">
              {branchEvents.map((h) => {
                const member = h.memberId ? students.find((s) => s.id === h.memberId) : null;
                return (
                  <li key={h.id} className="audit-log-row">
                    <span className="audit-log-time">{formatDateTime(h.at)}</span>
                    <span className="audit-log-type">{TYPE_LABELS[h.type] || h.type}</span>
                    {member ? <span className="audit-log-meta">{member.fullName}</span> : null}
                    {h.reason ? <span className="audit-log-meta">· "{h.reason}"</span> : null}
                    {h.position ? <span className="audit-log-meta">· {h.position}</span> : null}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {selectedAudit ? (
          <section className="card" style={{ marginTop: 20, border: '2px solid var(--club-orange)' }}>
            <div className="card-header">
              <h2 className="card-title">Complete audit</h2>
            </div>
            <p style={{ color: 'var(--club-text-2)', fontSize: 13 }}>
              Record findings for the audit requested on{' '}
              {formatDateTime(selectedAudit.requestedAt)}.
            </p>
            {auditFindings.map((finding, idx) => (
              <div key={idx} className="club-form-row-2" style={{ alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="text"
                  className="club-form-input"
                  placeholder={`Finding #${idx + 1}`}
                  value={finding}
                  onChange={(e) => setAuditFindings((arr) => arr.map((v, i) => (i === idx ? e.target.value : v)))}
                />
                <button
                  type="button"
                  className="club-btn-secondary club-btn-sm"
                  onClick={() => setAuditFindings((arr) => arr.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="club-btn-secondary club-btn-sm"
                onClick={() => setAuditFindings((arr) => [...arr, ''])}
              >
                + Add finding
              </button>
              <button
                type="button"
                className="club-btn-primary"
                onClick={() => {
                  completeAudit(selectedAudit.id, null, auditFindings.filter(Boolean));
                  setSelectedAudit(null);
                }}
              >
                Save findings
              </button>
              <button
                type="button"
                className="club-btn-secondary club-btn-sm"
                onClick={() => setSelectedAudit(null)}
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
    </ClubLayout>
  );
}