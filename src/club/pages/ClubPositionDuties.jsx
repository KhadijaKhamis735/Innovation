import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 23–29 — Position Duties
// Shows full constitutional duties for one of the 7 executive positions
// (or the patron), along with the current holder if any.

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

export default function ClubPositionDuties() {
  const { branchId, positionId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    executivePositions,
    executiveForPosition,
    memberForExecutive,
    patronForBranch,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const position = executivePositions.find((p) => p.id === positionId);

  // Special case: IBARA YA 20 — Patron
  if (positionId === 'patron') {
    const patron = patronForBranch(branch?.id);
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader
              compact
              title="Patron (Mlezi wa Klabu)"
              subtitle={`${branch?.name} · IBARA YA 20`}
            />
            <div className="club-public-header-actions">
              <button
                className="club-btn-secondary"
                type="button"
                onClick={() => navigate(`/club/branches/${branchId}/committee`)}
              >
                ← Committee
              </button>
            </div>
          </div>
        </header>
        <main className="club-public-main">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Role summary</h2>
              <span className="card-link">IBARA YA 20</span>
            </div>
            <p style={{ margin: 0, color: 'var(--club-text-2)', lineHeight: 1.7 }}>
              The Patron is a faculty or staff member appointed or recognized by
              the university to supervise and advise the club. The Patron is
              <strong> not</strong> part of the elected Executive Committee and
              does not have voting rights, but provides academic guidance,
              oversight of compliance with university rules, and institutional
              support when needed.
            </p>
          </section>
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Current Patron</h2>
            </div>
            {patron ? (
              <div className="club-patron-card">
                <div
                  className="club-patron-avatar"
                  style={{ background: uni?.primaryColor }}
                >
                  {patron.fullName
                    .split(' ')
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="club-patron-body">
                  <h3 className="club-patron-name">{patron.fullName}</h3>
                  <p className="club-patron-role">{patron.role}</p>
                  <p className="club-patron-meta">📧 {patron.email}</p>
                  {patron.phone ? (
                    <p className="club-patron-meta">📱 {patron.phone}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="club-empty">No patron assigned yet.</p>
            )}
          </section>
        </main>
      </div>
    );
  }

  if (!branch || !position) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Not found" />
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

  const exec = executiveForPosition(branch.id, position.id);
  const member = memberForExecutive(exec);

  return (
    <ClubLayout userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title={`${position.title} — Duties`}
            subtitle={`${branch.name} · IBARA YA ${position.ibara}`}
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
        {/* Position hero */}
        <section
          className="club-position-hero"
          style={{
            background: `linear-gradient(135deg, ${position.color}, ${position.color}cc)`,
          }}
        >
          <span className="club-position-hero-icon">{position.icon}</span>
          <div>
            <h1 className="club-position-hero-title">{position.title}</h1>
            <p className="club-position-hero-sub">
              {position.titleEnglish} · IBARA YA {position.ibara}
            </p>
            <p className="club-position-hero-summary">{position.summary}</p>
          </div>
        </section>

        <div className="club-branch-grid-2">
          {/* Duties list (IBARA YA 23–29) */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Constitutional Duties</h2>
              <span className="card-link">IBARA YA {position.ibara}</span>
            </div>
            <ol className="club-duty-list">
              {position.duties.map((duty, idx) => (
                <li key={idx}>{duty}</li>
              ))}
            </ol>
          </section>

          {/* Current holder */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Current Holder</h2>
            </div>
            {member && exec ? (
              <div>
                <div className="club-exec-card-member" style={{ marginBottom: 14 }}>
                  <div
                    className="club-member-avatar"
                    style={{ background: position.color }}
                  >
                    {member.fullName
                      .split(' ')
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="club-member-info">
                    <p className="club-member-name">{member.fullName}</p>
                    <p className="club-member-meta">{member.email}</p>
                    {member.regNumber ? (
                      <p className="club-member-meta">{member.regNumber}</p>
                    ) : null}
                  </div>
                </div>
                <dl className="club-exec-card-meta">
                  <div>
                    <dt>Term started</dt>
                    <dd>{formatDate(exec.electedAt)}</dd>
                  </div>
                  <div>
                    <dt>Term ends</dt>
                    <dd>{formatDate(exec.termEndsAt)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      {exec.isInterim ? (
                        <span className="club-badge club-badge-pending">Interim</span>
                      ) : (
                        <span className="club-badge club-badge-active">
                          {exec.electedBy === 'election' ? 'Elected' : 'Appointed'}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="club-exec-card-vacant">
                <p className="club-exec-card-vacant-label">Position vacant</p>
                <p className="club-exec-card-vacant-meta">
                  This seat is currently unfilled. Per IBARA YA 48, a new branch
                  may operate with interim appointments for up to one term until
                  a formal election is held.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}