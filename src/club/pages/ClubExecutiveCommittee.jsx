import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 17, 19 — Executive Committee (Kamati Tendaji)
// Displays all 7 constitutional positions for the branch with current holders,
// term information, and a "View duties" link per position.

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

const daysUntil = (iso) => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function ClubExecutiveCommittee() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    patronForBranch,
    executivesForBranch,
    memberForExecutive,
    executivePositions,
  } = useClub();

  const branch = branchById(branchId);
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
              ← Back to branches
            </button>
          </div>
        </header>
      </div>
    );
  }

  const uni = universities.find((u) => u.id === branch.universityId);
  const patron = patronForBranch(branch.id);
  const committee = executivesForBranch(branch.id);

  // Build a position → executive lookup so unfilled positions are still shown
  const execByPosition = new Map(committee.map((e) => [e.position, e]));

  return (
    <ClubLayout userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Executive Committee (Kamati Tendaji)"
            subtitle={`${branch.name} · IBARA YA 17, 19`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}`)}
            >
              ← Branch detail
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {/* Patron (IBARA YA 20) — separate from the Executive Committee */}
        <section className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">Branch Patron (Mlezi wa Klabu)</h2>
            <span className="card-link">Non-voting supervisor · IBARA YA 20</span>
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
                <p className="club-patron-meta">{uni?.name}</p>
                <p className="club-patron-meta">📧 {patron.email}</p>
                {patron.phone ? (
                  <p className="club-patron-meta">📱 {patron.phone}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="club-empty">No patron assigned yet.</p>
          )}
          <p className="club-footnote">
            IBARA YA 20 — The Patron is a faculty or staff member who supervises
            and advises the branch but is <strong>not</strong> part of the
            elected Executive Committee.
          </p>
        </section>

        {/* 7 Executive Committee positions */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Kamati Tendaji — 7 Positions</h2>
            <span className="card-link">
              {committee.filter((e) => e.memberId).length} of 7 filled
            </span>
          </div>

          <div className="club-exec-grid">
            {executivePositions.map((pos) => {
              const exec = execByPosition.get(pos.id);
              const member = exec ? memberForExecutive(exec) : null;
              const days = exec ? daysUntil(exec.termEndsAt) : null;
              const termExpiringSoon = days !== null && days <= 60 && days > 0;
              const termExpired = days !== null && days <= 0;
              return (
                <article
                  key={pos.id}
                  className="club-exec-card"
                  style={{ borderTopColor: pos.color }}
                >
                  <div className="club-exec-card-top">
                    <span
                      className="club-exec-card-icon"
                      style={{ background: pos.color }}
                    >
                      {pos.icon}
                    </span>
                    <div>
                      <h3 className="club-exec-card-title">{pos.title}</h3>
                      <p className="club-exec-card-sub">{pos.titleEnglish} · IBARA YA {pos.ibara}</p>
                    </div>
                  </div>

                  <div className="club-exec-card-body">
                    {member ? (
                      <>
                        <div className="club-exec-card-member">
                          <div className="club-member-avatar">
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
                            <p className="club-member-meta">
                              {member.regNumber ||
                                member.staffId ||
                                (member.graduationYear ? `Class of ${member.graduationYear}` : '') ||
                                member.organizationName ||
                                member.email}
                            </p>
                          </div>
                        </div>
                        <dl className="club-exec-card-meta">
                          <div>
                            <dt>Term started</dt>
                            <dd>{formatDate(exec.electedAt)}</dd>
                          </div>
                          <div>
                            <dt>Term ends</dt>
                            <dd>
                              {formatDate(exec.termEndsAt)}{' '}
                              {termExpired ? (
                                <span className="club-badge club-badge-suspended">Expired</span>
                              ) : termExpiringSoon ? (
                                <span className="club-badge club-badge-pending">
                                  {days}d left
                                </span>
                              ) : null}
                            </dd>
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
                          <div>
                            <dt>Renewals</dt>
                            <dd>{exec.reelectedCount}/1</dd>
                          </div>
                        </dl>
                      </>
                    ) : (
                      <div className="club-exec-card-vacant">
                        <p className="club-exec-card-vacant-label">Position vacant</p>
                        <p className="club-exec-card-vacant-meta">
                          IBARA YA 48 — A vacant slot may be filled by interim appointment
                          (≤1 term) until formal election.
                        </p>
                      </div>
                    )}

                    <div className="club-exec-card-actions">
                      <button
                        type="button"
                        className="club-btn-secondary club-btn-sm"
                        onClick={() =>
                          navigate(`/club/branches/${branch.id}/positions/${pos.id}`)
                        }
                      >
                        View duties →
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <p className="club-footnote" style={{ marginTop: 20 }}>
          IBARA YA 33 — Each elected official serves a <strong>12-month term</strong>,
          renewable <strong>once</strong> in the same position. After election,
          outgoing officials must complete a <strong>14-day handover</strong> of
          documents, funds, accounts, and records.
        </p>
      </main>
    </div>
    </ClubLayout>
  );
}