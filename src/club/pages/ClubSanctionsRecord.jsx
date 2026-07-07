import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// Per-member sanctions record

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function ClubSanctionsRecord() {
  const { branchId, memberId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    students,
    casesForMember,
    membershipHistory,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const member = students.find((s) => s.id === memberId);
  const cases = member ? casesForMember(member.id).filter((c) => c.branchId === branch?.id) : [];
  const history = useMemo(
    () => membershipHistory.filter((h) => h.memberId === memberId),
    [membershipHistory, memberId]
  );

  if (!branch || !member) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Not found" />
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branchId}/discipline`)}>
              ← Cases
            </button>
          </div>
        </header>
      </div>
    );
  }

  const openCases = cases.filter((c) => !['resolved', 'dismissed', 'appeal_upheld'].includes(c.status));
  const closedCases = cases.filter((c) => ['resolved', 'dismissed', 'appeal_upheld'].includes(c.status));

  return (
    <ClubLayout userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Sanctions Record" subtitle={`${member.fullName} · ${uni?.shortName} · IBARA YA 45`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/discipline`)}>
              ← Cases
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">{member.fullName}</h2>
            <span className="card-link">{member.email}</span>
          </div>
          <dl className="club-exec-card-meta">
            <div><dt>Membership status</dt><dd>{member.status}</dd></div>
            <div><dt>Member ID</dt><dd>{member.id}</dd></div>
            <div><dt>Reg number / staff ID</dt><dd>{member.regNumber || member.staffId || '—'}</dd></div>
            <div><dt>Total cases on record</dt><dd>{cases.length}</dd></div>
          </dl>
        </section>

        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Open cases</h2>
            <span className="card-link">{openCases.length}</span>
          </div>
          {openCases.length === 0 ? (
            <p className="club-empty">No open cases.</p>
          ) : (
            <div className="treasury-tx-list">
              {openCases.map((c) => {
                const badge = STATUS_BADGES[c.status] || { label: c.status, color: '#94a3b8' };
                return (
                  <div key={c.id} className="treasury-tx-row">
                    <div className="treasury-tx-icon">⚠️</div>
                    <div className="treasury-tx-body">
                      <p className="treasury-tx-title">Filed {formatDate(c.filedAt)}</p>
                      <p className="treasury-tx-meta">{c.complaintText.slice(0, 100)}…</p>
                    </div>
                    <span className="club-badge" style={{ background: badge.color + '20', color: badge.color }}>{badge.label}</span>
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
          )}
        </section>

        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Closed cases</h2>
            <span className="card-link">{closedCases.length}</span>
          </div>
          {closedCases.length === 0 ? (
            <p className="club-empty">No closed cases on record.</p>
          ) : (
            <div className="treasury-tx-list">
              {closedCases.map((c) => {
                const badge = STATUS_BADGES[c.status] || { label: c.status, color: '#94a3b8' };
                return (
                  <div key={c.id} className="treasury-tx-row">
                    <div className="treasury-tx-icon">📋</div>
                    <div className="treasury-tx-body">
                      <p className="treasury-tx-title">
                        {c.sanction ? `Sanction: ${c.sanction}` : 'Dismissed'} · Filed {formatDate(c.filedAt)}
                      </p>
                      <p className="treasury-tx-meta">{c.complaintText.slice(0, 100)}…</p>
                    </div>
                    <span className="club-badge" style={{ background: badge.color + '20', color: badge.color }}>{badge.label}</span>
                    <button
                      type="button"
                      className="club-btn-secondary club-btn-sm"
                      onClick={() => navigate(`/club/branches/${branch.id}/discipline/${c.id}`)}
                    >
                      Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Membership events</h2>
            <span className="card-link">Audit trail (IBARA YA 16)</span>
          </div>
          {history.length === 0 ? (
            <p className="club-empty">No history yet.</p>
          ) : (
            <ol className="audit-log">
              {history.map((h) => (
                <li key={h.id} className="audit-log-row">
                  <span className="audit-log-time">{formatDate(h.at)}</span>
                  <span className="audit-log-type">{h.type}</span>
                  {h.reason ? <span className="audit-log-meta">· "{h.reason}"</span> : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}