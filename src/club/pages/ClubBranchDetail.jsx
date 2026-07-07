import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 4 — Branch Detail
// Shows branch metadata, patron, member-category breakdown, and the public
// membership status distribution.

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

const STATUS_LABELS = {
  pending: 'Pending verification',
  active: 'Active',
  suspended: 'Suspended',
  expelled: 'Expelled',
  withdrawn: 'Withdrawn',
  rejected: 'Rejected',
};

const CATEGORY_LABELS = {
  student: 'Students',
  staff: 'University Staff',
  alumni: 'Alumni',
  corporate: 'Corporate / NGO Partners',
};

export default function ClubBranchDetail() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    universities,
    branchById,
    patronForBranch,
    branchStats,
    membersForBranch,
    zsaHQ,
    currentStudent,
  } = useClub();

  const branch = branchById(branchId);
  if (!branch) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Branch not found" />
            <button className="club-btn-secondary" type="button" onClick={() => navigate('/club/branches')}>
              ← Back to branches
            </button>
          </div>
        </header>
        <main className="club-public-main">
          <p>This branch does not exist or has been dissolved.</p>
        </main>
      </div>
    );
  }

  const uni = universities.find((u) => u.id === branch.universityId);
  const patron = patronForBranch(branch.id);
  const stats = branchStats(branch.id);
  const allMembers = membersForBranch(branch.id);

  const isMyBranch =
    currentStudent?.clubId === branch.id ||
    currentStudent?.universityId === branch.universityId;

  return (
    <ClubLayout user={currentStudent} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title={branch.name}
            subtitle={`${uni?.name} · ${zsaHQ.name}`}
          />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate('/club/branches')}>
              ← All branches
            </button>
            {!currentStudent ? (
              <button
                type="button"
                className="club-btn-primary"
                style={{ width: 'auto', padding: '12px 22px' }}
                onClick={() => navigate('/club/register')}
              >
                Join this branch
              </button>
            ) : isMyBranch ? (
              <span className="club-badge club-badge-soft">Your branch</span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {/* Hero */}
        <section className="club-branch-hero" style={{ background: uni?.primaryColor }}>
          <div className="club-branch-hero-overlay" />
          <div className="club-branch-hero-inner">
            <span className="club-branch-hero-badge">{uni?.shortName}</span>
            <h1 className="club-branch-hero-title">{branch.name}</h1>
            <p className="club-branch-hero-tag">{uni?.tagline}</p>
            <div className="club-branch-hero-meta">
              <span>📍 {branch.address || branch.campus}</span>
              <span>📅 Founded {formatDate(branch.foundedAt)}</span>
              <span>📜 Charter signed {formatDate(branch.charterSignedAt)}</span>
              <span>📊 {branch.status === 'active' ? '🟢 Active' : branch.status}</span>
            </div>
          </div>
        </section>

        <div className="club-branch-grid-2">
          {/* Patron card (IBARA YA 20) */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Branch Patron (Mlezi)</h2>
            </div>
            {patron ? (
              <div className="club-patron-card">
                <div className="club-patron-avatar">
                  {patron.fullName
                    .split(' ')
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="club-patron-name">{patron.fullName}</h3>
                  <p className="club-patron-role">{patron.role}</p>
                  <p className="club-patron-meta">{uni?.name}</p>
                  <p className="club-patron-meta">{patron.email}</p>
                  <p className="club-patron-meta">{patron.phone}</p>
                </div>
              </div>
            ) : (
              <p className="club-empty">No patron assigned yet.</p>
            )}
            <p className="club-footnote">
              IBARA YA 20 — The Patron is a faculty or staff member who supervises and
              guides the branch, but is not part of the elected Executive Committee.
            </p>
          </section>

          {/* Member breakdown (IBARA YA 11) */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Members by Category</h2>
              <span className="card-link">{stats.total} total</span>
            </div>
            <div className="club-category-breakdown">
              {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                <div key={id} className="club-category-row">
                  <span className="club-category-row-label">{label}</span>
                  <span className="club-category-row-value">{stats[id] || 0}</span>
                </div>
              ))}
            </div>
            <div className="club-status-breakdown">
              <h3 className="card-title" style={{ fontSize: 14, marginTop: 18 }}>
                Membership Status
              </h3>
              {Object.entries(STATUS_LABELS).map(([id, label]) => (
                <div key={id} className="club-status-row">
                  <span className="club-status-row-label">{label}</span>
                  <span className="club-status-row-value">{stats[id] || 0}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent members preview */}
        <section className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h2 className="card-title">Recent Members</h2>
            <button
              type="button"
              className="card-link"
              onClick={() => navigate(`/club/branches/${branch.id}/members`)}
            >
              View directory →
            </button>
          </div>
          {allMembers.length === 0 ? (
            <p className="club-empty">No members yet. Be the first to register.</p>
          ) : (
            <div className="club-member-list">
              {allMembers.slice(0, 6).map((m) => (
                <div key={m.id} className="club-member-row">
                  <div className="club-member-avatar">
                    {m.fullName
                      .split(' ')
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="club-member-info">
                    <p className="club-member-name">{m.fullName}</p>
                    <p className="club-member-meta">
                      {CATEGORY_LABELS[m.category] || m.category}
                      {m.regNumber ? ` · ${m.regNumber}` : ''}
                      {m.staffId ? ` · ${m.staffId}` : ''}
                      {m.graduationYear ? ` · Class of ${m.graduationYear}` : ''}
                      {m.organizationName ? ` · ${m.organizationName}` : ''}
                    </p>
                  </div>
                  <span className={`club-badge club-badge-${m.status}`}>
                    {STATUS_LABELS[m.status] || m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}