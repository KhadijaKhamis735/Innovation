import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 45 — Disciplinary Cases listing + individual case view

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

export default function ClubDiscipline() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    casesForBranch,
    caseById,
    students,
    currentClubLeader,
    sanctionLevels,
    currentStudent,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const cases = branch ? casesForBranch(branch.id) : [];

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
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Disciplinary Cases" subtitle={`${branch.name} · IBARA YA 45`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}`)}>
              ← Branch
            </button>
            <button
              className="club-btn-primary"
              style={{ width: 'auto', padding: '12px 22px' }}
              onClick={() => navigate(`/club/branches/${branch.id}/discipline/new`)}
            >
              + File a complaint
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Procedure &amp; sanctions</h2>
            <span className="card-link">IBARA YA 45</span>
          </div>
          <ol className="club-duty-list">
            {sanctionLevels.map((s) => (
              <li key={s.id}>
                <strong>{s.label}</strong> (severity {s.severity}) — {s.description}
              </li>
            ))}
          </ol>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Cases</h2>
            <span className="card-link">{cases.length} total</span>
          </div>
          {cases.length === 0 ? (
            <p className="club-empty">No disciplinary cases yet — good standing.</p>
          ) : (
            <div className="treasury-tx-list">
              {cases.map((c) => {
                const respondent = students.find((s) => s.id === c.respondentId);
                const complainant = students.find((s) => s.id === c.complainantId);
                const badge = STATUS_BADGES[c.status] || { label: c.status, color: '#94a3b8' };
                return (
                  <div key={c.id} className="treasury-tx-row">
                    <div className="treasury-tx-icon">⚠️</div>
                    <div className="treasury-tx-body">
                      <p className="treasury-tx-title">{respondent?.fullName || c.respondentId}</p>
                      <p className="treasury-tx-meta">
                        by {complainant?.fullName || 'anon'} · {formatDate(c.filedAt)} · {c.sanction ? `Sanction: ${c.sanction}` : 'No sanction yet'}
                      </p>
                    </div>
                    <span
                      className="club-badge"
                      style={{ background: badge.color + '20', color: badge.color }}
                    >
                      {badge.label}
                    </span>
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

        {/* Sanctions record */}
        <SanctionsRecord branch={branch} navigate={navigate} />
      </main>
    </div>
    </ClubLayout>
  );
}

function SanctionsRecord({ branch, navigate }) {
  const { students, sanctionLevels } = useClub();
  const sanctioned = students
    .filter((s) => s.universityId === branch.universityId)
    .filter((s) => ['suspended', 'expelled', 'written_warning'].includes(s.status) || s.suspensionReason || s.expulsionReason);

  if (sanctioned.length === 0) return null;
  return (
    <section className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <h2 className="card-title">Active sanctions</h2>
        <span className="card-link">{sanctioned.length} member{sanctioned.length === 1 ? '' : 's'}</span>
      </div>
      <div className="treasury-tx-list">
        {sanctioned.map((m) => (
          <div key={m.id} className="treasury-tx-row">
            <div className="treasury-tx-icon">⛔</div>
            <div className="treasury-tx-body">
              <p className="treasury-tx-title">{m.fullName}</p>
              <p className="treasury-tx-meta">
                {m.status === 'suspended' ? 'Suspended' : m.status === 'expelled' ? 'Expelled' : 'Sanctioned'} ·{' '}
                {m.suspensionReason || m.expulsionReason || '—'}
              </p>
            </div>
            <span className={`club-badge ${m.status === 'expelled' ? 'club-badge-suspended' : 'club-badge-pending'}`}>
              {m.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}